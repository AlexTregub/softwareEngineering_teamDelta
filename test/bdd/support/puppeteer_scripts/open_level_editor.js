/**
 * Puppeteer Script: Open Level Editor
 * 
 * Called from Behave test steps to open and verify Level Editor
 * Returns JSON result with success status and screenshot path
 */

const { launchBrowser, sleep, saveScreenshot } = require('../../../e2e/puppeteer_helper');
const cameraHelper = require('../../../e2e/camera_helper');

(async () => {
  let browser;
  
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Navigate to app
    await page.goto('http://localhost:8000?test=1', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    await sleep(2000);
    
    // Open Level Editor
    const result = await page.evaluate(() => {
      if (window.GameState) {
        window.GameState.setState('LEVEL_EDITOR');
      } else {
        window.gameState = 'LEVEL_EDITOR';
      }
      
      return {
        success: !!window.levelEditor,
        state: window.gameState || window.GameState?.currentState
      };
    });
    
    await sleep(1000);
    
    // Force redraw
    await page.evaluate(() => {
      window.gameState = 'LEVEL_EDITOR';
      if (window.draggablePanelManager) {
        window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
      }
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    await sleep(500);
    
    // Take screenshot
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const screenshotPath = `test/e2e/screenshots/bdd/level_editor_opened_${timestamp}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: false });
    
    // Output JSON result
    console.log(JSON.stringify({
      success: result.success,
      state: result.state,
      screenshot: screenshotPath,
      screenshotDir: 'test/e2e/screenshots/bdd'
    }));
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error(JSON.stringify({
      success: false,
      error: error.message
    }));
    if (browser) await browser.close();
    process.exit(1);
  }
})();
