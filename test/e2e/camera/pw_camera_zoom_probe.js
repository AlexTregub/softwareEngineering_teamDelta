const camera = require('./camera_helper');

async function run() {
  const browser = await camera.launch();
  const page = await camera.newPageReady(browser);
  await page.appGoto(process.env.TEST_URL || 'http://localhost:8000');

  await camera.ensureGameStarted(page);

  // dump available camera APIs
  const apiList = await page.evaluate(() => {
    const names = {};
    names.g_cameraManager = !!window.g_cameraManager;
    names.CameraController = !!window.CameraController;
    names.setCameraZoom = typeof window.setCameraZoom === 'function';
    names.setCameraPosition = typeof window.setCameraPosition === 'function';
    names.worldToScreen = typeof window.worldToScreen === 'function' || (window.g_cameraManager && typeof window.g_cameraManager.worldToScreen === 'function');
    names.screenToWorld = typeof window.screenToWorld === 'function' || (window.g_cameraManager && typeof window.g_cameraManager.screenToWorld === 'function');
    names.cameraGlobals = (typeof window.cameraX !== 'undefined') && (typeof window.cameraY !== 'undefined');
    names.g_activeMap = !!window.g_activeMap;
    return names;
  });

  console.log('camera API inventory:', apiList);

  // helper: measure screens, distances, pixels
  const measure = async (wx, wy) => {
    return await page.evaluate((wx, wy) => {
      const wts = (window.testHelpers && window.testHelpers.worldToScreen) ? window.testHelpers.worldToScreen : (window.g_cameraManager && window.g_cameraManager.worldToScreen ? window.g_cameraManager.worldToScreen.bind(window.g_cameraManager) : null);
      if (!wts) return { error: 'no-worldToScreen' };
      const s = wts(wx, wy);
      return { screen: s };
    }, wx, wy);
  };

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

  // pick a focus point near center
  const diag = await camera.getDiagnostics(page);
  const cam = diag && diag.camera ? diag.camera : { x:0,y:0,zoom:1 };
  const tile = (diag && diag.map && diag.map.tileSize) ? diag.map.tileSize : 32;
  const focusWorld = [cam.x + 0, cam.y + 0];

  // two points to measure scaling
  const pA = focusWorld;
  const pB = [focusWorld[0] + (tile || 32), focusWorld[1]];

  const methods = [
    { id: 'camera_helper.setZoom', fn: async (z, fx, fy) => { return await camera.setZoom(page, z, fx, fy); } },
    { id: 'g_cameraManager.setZoom', fn: async (z, fx, fy) => await page.evaluate((z,fx,fy) => { try { return window.g_cameraManager && typeof window.g_cameraManager.setZoom === 'function' ? window.g_cameraManager.setZoom(z,fx,fy) : false; } catch(e){ return {error: ''+e}; } }, z, fx, fy) },
    { id: 'setCameraZoom global', fn: async (z, fx, fy) => await page.evaluate((z,fx,fy) => { try { return typeof window.setCameraZoom === 'function' ? window.setCameraZoom(z,fx,fy) : false; } catch(e){ return {error: ''+e}; } }, z, fx, fy) },
    { id: 'direct assign g_cameraManager.cameraZoom', fn: async (z) => await page.evaluate((z) => { try { if (window.g_cameraManager) { window.g_cameraManager.cameraZoom = z; return true; } return false; } catch(e){ return {error: ''+e}; } }, z) },
    { id: 'direct assign cameraZoom global', fn: async (z) => await page.evaluate((z) => { try { window.cameraZoom = z; return true; } catch(e){ return {error: ''+e}; } }, z) },
    { id: 'mouse_wheel_event', fn: async (z, fx, fy) => { // compute deltaY from zoom target
        // wheel zoom in approximated by negative deltaY
        const delta = -100; // standard zoom-in step
        await camera.sendWheel(page, delta, { cx: fx, cy: fy });
        return { attempted: 'wheel' };
      }
    }
  ];

  const results = [];

  for (let m of methods) {
    // reset to baseline before each method
    await page.evaluate(() => {
      if (window.g_cameraManager && typeof window.g_cameraManager.setPosition === 'function') {}
      // try to reset zoom to 1 via known APIs
      try { if (window.g_cameraManager && typeof window.g_cameraManager.setZoom === 'function') window.g_cameraManager.setZoom(1, window.g_canvasX/2, window.g_canvasY/2); } catch(e){}
      try { if (typeof window.setCameraZoom === 'function') window.setCameraZoom(1, window.g_canvasX/2, window.g_canvasY/2); } catch(e){}
      try { if (window.g_cameraManager) window.g_cameraManager.cameraZoom = 1; } catch(e){}
      try { window.cameraZoom = 1; } catch(e){}
    });

    await page.waitForTimeout ? page.waitForTimeout(150) : new Promise(r => setTimeout(r,150));

    const beforeDiag = await camera.getDiagnostics(page);
    const beforeA = await measure(pA[0], pA[1]);
    const beforeB = await measure(pB[0], pB[1]);
    const beforePixel = await samplePixel(beforeA.screen.x, beforeA.screen.y).catch(e=>({error:''+e}));

    // call method
    let callRes;
    try {
      callRes = await m.fn(1.5, beforeA.screen.x, beforeA.screen.y);
    } catch (e) { callRes = { error: ''+e }; }

    await page.waitForTimeout ? page.waitForTimeout(250) : new Promise(r => setTimeout(r,250));

    const afterDiag = await camera.getDiagnostics(page);
    const afterA = await measure(pA[0], pA[1]);
    const afterB = await measure(pB[0], pB[1]);
    const afterPixel = await samplePixel(afterA.screen.x, afterA.screen.y).catch(e=>({error:''+e}));

    const distBefore = Math.hypot(beforeB.screen.x - beforeA.screen.x, beforeB.screen.y - beforeA.screen.y);
    const distAfter = Math.hypot(afterB.screen.x - afterA.screen.x, afterB.screen.y - afterA.screen.y);
    const observedScale = distAfter / (distBefore || 1);

    const record = { method: m.id, callRes, beforeZoom: beforeDiag.camera ? beforeDiag.camera.zoom : null, afterZoom: afterDiag.camera ? afterDiag.camera.zoom : null, distBefore, distAfter, observedScale, beforePixel, afterPixel };
    results.push(record);

    // save screenshot for each method
    await camera.saveScreenshot(page, `camera/zoom_probe_${m.id.replace(/\W+/g,'_')}`, (record.afterZoom && record.afterZoom !== record.beforeZoom));
  }

  console.log('zoom probe results:\n', JSON.stringify(results, null, 2));
  await camera.saveScreenshot(page, 'camera/zoom_probe_summary', false);
  await browser.close();
  process.exit(0);
}

run().catch(e => { console.error('zoom probe error', e); process.exit(1); });
