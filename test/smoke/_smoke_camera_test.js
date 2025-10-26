const cameraHelper = require('../e2e/camera_helper');

(async function() {
  let browser;
  try {
    browser = await cameraHelper.launch();
    const page = await cameraHelper.newPageReady(browser);
    await page.appGoto(process.env.TEST_URL || 'http://localhost:8000');

    const started = await cameraHelper.ensureGameStarted(page);
    console.log('ensureGameStarted:', started);

    const diag = await cameraHelper.getDiagnostics(page);
    console.log('camera diagnostics:', diag);

    await cameraHelper.saveScreenshot(page, 'camera_smoke', !!started.started);

    await browser.close();
    process.exit(started.started ? 0 : 2);
  } catch (e) {
    console.error('smoke test error', e);
    try { if (browser) await browser.close(); } catch(_){}
    process.exit(1);
  }
})();
