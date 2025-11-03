/**
 * E2E Test: Check for JavaScript Errors
 * 
 * Monitors console for errors during page load
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  const errors = [];
  const warnings = [];
  
  // Capture console messages
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    
    if (type === 'error') {
      errors.push(text);
      console.error(`[PAGE ERROR] ${text}`);
    } else if (type === 'warning') {
      warnings.push(text);
    }
  });
  
  // Capture page errors
  page.on('pageerror', error => {
    errors.push(error.message);
    console.error(`[PAGE EXCEPTION] ${error.message}`);
  });
  
  try {
    console.log('Loading game and checking for errors...\n');
    await page.goto('http://localhost:8000?test=1');
    await sleep(3000);
    
    // Load custom level
    await page.evaluate(async () => {
      if (typeof loadCustomLevel === 'function') {
        await loadCustomLevel('levels/CaveTutorial.json');
      }
    });
    await sleep(1000);
    
    // Check EntityRenderer initialization
    const check = await page.evaluate(() => {
      return {
        EntityRendererType: typeof EntityRenderer,
        isInstance: typeof EntityRenderer === 'object',
        isClass: typeof EntityRenderer === 'function',
        hasRenderAllLayers: EntityRenderer && typeof EntityRenderer.renderAllLayers === 'function',
        constructorName: EntityRenderer && EntityRenderer.constructor ? EntityRenderer.constructor.name : null
      };
    });
    
    console.log('\n=== EntityRenderer Status ===');
    console.log(`Type: ${check.EntityRendererType}`);
    console.log(`Is Instance: ${check.isInstance}`);
    console.log(`Is Class: ${check.isClass}`);
    console.log(`Has renderAllLayers(): ${check.hasRenderAllLayers}`);
    console.log(`Constructor: ${check.constructorName}`);
    
    console.log('\n=== Errors Captured ===');
    console.log(`Total errors: ${errors.length}`);
    errors.forEach((err, i) => console.log(`${i + 1}. ${err}`));
    
    console.log('\n=== Warnings Captured ===');
    console.log(`Total warnings: ${warnings.length}`);
    if (warnings.length > 10) {
      console.log('(Showing first 10)');
      warnings.slice(0, 10).forEach((warn, i) => console.log(`${i + 1}. ${warn}`));
    } else {
      warnings.forEach((warn, i) => console.log(`${i + 1}. ${warn}`));
    }
    
    await browser.close();
    process.exit(errors.length === 0 ? 0 : 1);
    
  } catch (error) {
    console.error('Test error:', error);
    await browser.close();
    process.exit(1);
  }
})();
