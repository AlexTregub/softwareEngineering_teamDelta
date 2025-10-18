const camera = require('./camera_helper');
const { launchBrowser, saveScreenshot } = require('./puppeteer_helper');

async function run() {
  const browser = await camera.launch();
  const page = await camera.newPageReady(browser);
  await page.appGoto(process.env.TEST_URL || 'http://localhost:8000');

  const started = await camera.ensureGameStarted(page);
  console.log('ensureGameStarted:', started);

  // helper to measure world->screen for a world point
  const measure = async (worldX, worldY) => {
    return await page.evaluate((wx, wy) => {
      const out = { screen: null, camera: null };
      try {
        const wts = (window.testHelpers && window.testHelpers.worldToScreen) ? window.testHelpers.worldToScreen : (window.g_cameraManager && window.g_cameraManager.worldToScreen ? window.g_cameraManager.worldToScreen.bind(window.g_cameraManager) : null);
        if (!wts) return { error: 'no-worldToScreen' };
        const s = wts(wx, wy);
        const cam = (window.g_cameraManager) ? { x: window.g_cameraManager.cameraX, y: window.g_cameraManager.cameraY, zoom: window.g_cameraManager.cameraZoom } : { x: window.cameraX, y: window.cameraY, zoom: window.cameraZoom };
        return { screen: s, camera: cam };
      } catch (e) { return { error: '' + e }; }
    }, worldX, worldY);
  };

  // Test positions: center and four quadrants relative to current camera center
  const diag = await camera.getDiagnostics(page);
  const cam = (diag && diag.camera) ? diag.camera : { x:0,y:0,zoom:1 };
  const tile = (diag && diag.map && diag.map.tileSize) ? diag.map.tileSize : 32;

  const offsets = [ [0,0], [-2*tile, -2*tile], [2*tile, -2*tile], [-2*tile, 2*tile], [2*tile, 2*tile] ];

  let allPassed = true;
  const results = [];

  for (let i = 0; i < offsets.length; i++) {
    const [ox, oy] = offsets[i];
    const worldX = cam.x + ox;
    const worldY = cam.y + oy;

    // center on the focus
    const centerRes = await camera.centerOn(page, worldX, worldY);
    console.log('centerOn attempt', i, centerRes);
    await page.waitForTimeout ? page.waitForTimeout(200) : new Promise(r => setTimeout(r,200));
    // Diagnostics + measurements BEFORE zoom
    const diagBefore = await camera.getDiagnostics(page);
    const beforeZoom = diagBefore && diagBefore.camera ? diagBefore.camera.zoom || 1 : 1;
    const before = await measure(worldX, worldY);
    const before2 = await measure(worldX + (tile || 32), worldY);
    if (before.error || before2.error) { results.push({ idx:i, error: before.error || before2.error }); allPassed = false; continue; }

    // also sample pixel color at integer screen coords before zoom
    const samplePixel = async (sx, sy) => {
      return await page.evaluate((x,y) => {
        try {
          const c = document.querySelector('canvas');
          if (!c) return { error: 'no-canvas' };
          const rect = c.getBoundingClientRect();
          const cx = Math.round(x - rect.left);
          const cy = Math.round(y - rect.top);
          const ctx = c.getContext('2d');
          const p = ctx.getImageData(cx, cy, 1, 1).data;
          return { rgba: [p[0], p[1], p[2], p[3]] };
        } catch (e) { return { error: ''+e }; }
      }, sx, sy);
    };

    const beforePixel = await samplePixel(before.screen.x, before.screen.y).catch(e => ({ error: ''+e }));

    // zoom in and check screen pos stability
    const zoomTo = (beforeZoom || 1) * 1.5;
    const setz = await camera.setZoom(page, zoomTo, worldX, worldY);
    console.log('setZoom result', setz);
    await page.waitForTimeout ? page.waitForTimeout(250) : new Promise(r => setTimeout(r,250));

    // Diagnostics + measurements AFTER zoom
    const diagAfter = await camera.getDiagnostics(page);
    const afterZoom = diagAfter && diagAfter.camera ? diagAfter.camera.zoom || beforeZoom : beforeZoom;
    const after = await measure(worldX, worldY);
    const after2 = await measure(worldX + (tile || 32), worldY);
    const afterPixel = await samplePixel(after.screen.x, after.screen.y).catch(e => ({ error: ''+e }));

    // compute screen delta for the single point and scale between two nearby points
    let delta = null;
    if (before.screen && after.screen && before2.screen && after2.screen) {
      delta = { dx: after.screen.x - before.screen.x, dy: after.screen.y - before.screen.y };
      const distBefore = Math.hypot(before2.screen.x - before.screen.x, before2.screen.y - before.screen.y);
      const distAfter = Math.hypot(after2.screen.x - after.screen.x, after2.screen.y - after.screen.y);
      const scaleObserved = distAfter / (distBefore || 1);
      const zoomFactor = (beforeZoom > 0) ? (afterZoom / beforeZoom) : null;
      // Accept if zoom actually changed close to expected and scale observed is reasonably close
      const zoomOk = zoomFactor !== null && Math.abs(zoomFactor - 1.5) / 1.5 < 0.15; // 15% tolerance
      const scaleOk = Math.abs(scaleObserved - 1.5) / 1.5 < 0.20; // 20% tolerance
      const pixelChanged = !(beforePixel && afterPixel && beforePixel.rgba && afterPixel.rgba && beforePixel.rgba.join(',') === afterPixel.rgba.join(','));

      const passed = zoomOk && scaleOk && (pixelChanged || Math.abs(delta.dx) < 1.5 && Math.abs(delta.dy) < 1.5);
      results.push({ idx:i, world: [worldX, worldY], before: before.screen, after: after.screen, delta, beforeZoom, afterZoom, distBefore, distAfter, scaleObserved, zoomFactor, zoomOk, scaleOk, beforePixel, afterPixel, passed });
      if (!passed) allPassed = false;
    } else {
      results.push({ idx:i, error: 'no-screen-data', before, after }); allPassed = false;
    }

    // save an intermediate screenshot per case (failure folder for investigation)
    const name = `camera_zoom_case_${i}`;
    await camera.saveScreenshot(page, `camera/${name}`, false);
  }

  // final screenshot and report
  await camera.saveScreenshot(page, `camera/zoom_summary`, allPassed);
  console.log('zoom test results:', results);

  await browser.close();
  process.exit(allPassed ? 0 : 3);
}

run().catch(e => { console.error('zoom test error', e); process.exit(1); });
