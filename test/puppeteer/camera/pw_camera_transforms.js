const camera = require('./camera_helper');

async function run() {
  const browser = await camera.launch();
  const page = await camera.newPageReady(browser);
  await page.appGoto(process.env.TEST_URL || 'http://localhost:8000');

  const started = await camera.ensureGameStarted(page);
  console.log('ensureGameStarted:', started);

  const diag = await camera.getDiagnostics(page);
  const camStart = diag && diag.camera ? diag.camera : { x:0, y:0, zoom:1 };
  const tile = (diag && diag.map && diag.map.tileSize) ? diag.map.tileSize : 32;

  // Camera positions: center and offsets >= 2 tiles
  const positions = [ [camStart.x, camStart.y], [camStart.x + 2*tile, camStart.y], [camStart.x - 2*tile, camStart.y], [camStart.x, camStart.y + 2*tile] ];
  const zooms = [0.5, 1, 2];

  const results = [];
  let allPassed = true;

  // helper to round-trip a world point
  const roundTrip = async (wx, wy) => {
    return await page.evaluate((x,y) => {
      try {
        const wts = (window.testHelpers && window.testHelpers.worldToScreen) ? window.testHelpers.worldToScreen : (window.g_cameraManager && window.g_cameraManager.worldToScreen ? window.g_cameraManager.worldToScreen.bind(window.g_cameraManager) : null);
        const stw = (window.testHelpers && window.testHelpers.screenToWorld) ? window.testHelpers.screenToWorld : (window.g_cameraManager && window.g_cameraManager.screenToWorld ? window.g_cameraManager.screenToWorld.bind(window.g_cameraManager) : null);
        if (!wts || !stw) return { error: 'missing transform functions' };
        const s = wts(x,y);
        const back = stw(s.x, s.y);
        return { screen: s, back };
      } catch (e) { return { error: ''+e }; }
    }, wx, wy);
  };

  for (let p = 0; p < positions.length; p++) {
    const [px, py] = positions[p];
    // center camera on this position
    await camera.centerOn(page, px, py);
    await page.waitForTimeout ? page.waitForTimeout(200) : new Promise(r => setTimeout(r,200));

    for (let z = 0; z < zooms.length; z++) {
      const targetZoom = zooms[z];
      await camera.setZoom(page, targetZoom, px, py);
      await page.waitForTimeout ? page.waitForTimeout(200) : new Promise(r => setTimeout(r,200));

      // pick a set of world points around the camera center
      const worldPoints = [ [px, py], [px + tile/2, py + tile/2], [px - tile/3, py + tile/4], [px + tile, py - tile] ];

      for (let w = 0; w < worldPoints.length; w++) {
        const [wx, wy] = worldPoints[w];
        const rt = await roundTrip(wx, wy);
        if (rt.error) { results.push({ pos: [px,py], zoom: targetZoom, point: [wx,wy], error: rt.error }); allPassed = false; continue; }

        const dx = rt.back.x - wx;
        const dy = rt.back.y - wy;
        const worldErr = Math.hypot(dx, dy);
        // tolerance: 0.5 world units (sub-pixel/ small)
        const tol = 0.5;
        const passed = worldErr <= tol;
        results.push({ pos: [px,py], zoom: targetZoom, point: [wx,wy], back: rt.back, worldErr, passed });
        if (!passed) allPassed = false;
      }

      // screenshot per zoom step
      await camera.saveScreenshot(page, `camera/transforms_pos${p}_zoom${targetZoom}`, passedAll(results));
    }
  }

  console.log('transform test results:', results);
  await camera.saveScreenshot(page, `camera/transforms_summary`, allPassed);
  await browser.close();
  process.exit(allPassed ? 0 : 4);
}

function passedAll(results) {
  if (!results || !results.length) return false;
  return results.slice(-4).every(r => r.passed);
}

run().catch(e => { console.error('transforms test error', e); process.exit(1); });
