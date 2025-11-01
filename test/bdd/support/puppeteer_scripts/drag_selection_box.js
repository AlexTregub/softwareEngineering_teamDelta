/**
 * Puppeteer Script: Drag Selection Box
 * 
 * Simulates dragging a selection box over entities
 * Returns JSON with selection results and screenshot
 */

const { launchBrowser, sleep, saveScreenshot } = require('../../../e2e/puppeteer_helper');

// Get parameters from environment variables
const x1 = parseInt(process.env.TEST_X1 || '50');
const y1 = parseInt(process.env.TEST_Y1 || '50');
const x2 = parseInt(process.env.TEST_X2 || '350');
const y2 = parseInt(process.env.TEST_Y2 || '150');

(async () => {
  let browser;
  
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Navigate and set up (assuming Level Editor already open from previous step)
    await page.goto('http://localhost:8000?test=1', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    await sleep(2000);
    
    await page.evaluate(() => {
      window.gameState = 'LEVEL_EDITOR';
    });
    await sleep(500);
    
    // Perform selection box drag
    const result = await page.evaluate(({x1, y1, x2, y2}) => {
      const tool = window.testSelectionTool;
      if (!tool) return { success: false, error: 'Tool not found' };
      
      // Simulate drag
      tool.handleMousePressed(x1, y1);
      tool.handleMouseDragged(x2, y2);
      tool.handleMouseReleased(x2, y2);
      
      // Count selected
      const selectedCount = window.placedEntities.filter(e => e.isSelected === true).length;
      
      return {
        success: true,
        selectedCount,
        totalCount: window.placedEntities.length,
        box: { x1, y1, x2, y2 }
      };
    }, { x1, y1, x2, y2 });
    
    // Take screenshot
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const screenshotPath = `test/e2e/screenshots/bdd/selection_box_dragged_${timestamp}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: false });
    
    // Output result
    console.log(JSON.stringify({
      ...result,
      screenshot: screenshotPath
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
