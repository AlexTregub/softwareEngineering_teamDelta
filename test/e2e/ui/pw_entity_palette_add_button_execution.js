/**
 * E2E Test: Check if Add Button Code is Executing
 * 
 * Test Strategy:
 * Inject logging into EntityPalette.render() to see if Add button rendering code executes
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  console.log('🧪 Entity Palette Add Button Code Execution Test');
  
  await page.goto('http://localhost:8000?test=1');
  await sleep(1000);
  
  // Enter Level Editor
  console.log('⏳ Entering Level Editor...');
  await page.evaluate(() => {
    if (window.GameState && typeof window.GameState.setState === 'function') {
      window.GameState.setState('LEVEL_EDITOR');
    }
    if (window.levelEditor && window.g_map2) {
      window.levelEditor.initialize(window.g_map2);
    }
  });
  
  await sleep(1000);
  
  // Inject logging into rect() and text() functions
  await page.evaluate(() => {
    window._addButtonRenderLog = [];
    
    const originalRect = window.rect;
    window.rect = function(...args) {
      // Check if this might be the Add button (green background)
      const currentFill = window.drawingContext.fillStyle;
      if (currentFill && (currentFill.includes('2a5a2a') || currentFill.includes('2a4a6a'))) {
        window._addButtonRenderLog.push({
          type: 'rect',
          args: args.slice(0, 5), // x, y, width, height, radius
          fill: currentFill
        });
      }
      return originalRect.apply(this, args);
    };
    
    const originalText = window.text;
    window.text = function(...args) {
      const str = String(args[0]);
      if (str.includes('Add New') || str.includes('Store Selected')) {
        window._addButtonRenderLog.push({
          type: 'text',
          text: str,
          x: args[1],
          y: args[2]
        });
      }
      return originalText.apply(this, args);
    };
  });
  
  // Switch to Custom category
  console.log('🖱️  Switching to Custom category...\n');
  await page.evaluate(() => {
    window.levelEditor.entityPalette.setCategory('custom');
    
    // Force redraws
    if (typeof window.redraw === 'function') {
      window.redraw();
      window.redraw();
      window.redraw();
    }
  });
  
  await sleep(500);
  
  // Get log
  const log = await page.evaluate(() => window._addButtonRenderLog);
  
  console.log(`Add Button Render Calls: ${log.length}\n`);
  
  if (log.length === 0) {
    console.log('==================================================');
    console.log('❌ ADD BUTTON CODE NOT EXECUTING');
    console.log('==================================================');
    console.log('Either:');
    console.log('1. currentCategory !== "custom"');
    console.log('2. Code path not reached');
    console.log('3. JavaScript error before button rendering');
  } else {
    console.log('Render calls:');
    log.forEach(call => {
      if (call.type === 'rect') {
        console.log(`  📦 rect(${call.args.join(', ')})`);
        console.log(`     fill: ${call.fill}`);
      } else {
        console.log(`  📝 text("${call.text}", ${call.x}, ${call.y})`);
      }
    });
    
    console.log('\n==================================================');
    console.log('✅ ADD BUTTON CODE EXECUTING');
    console.log('==================================================');
  }
  
  await saveScreenshot(page, 'ui/add_button_execution_test', true);
  await browser.close();
  process.exit(log.length > 0 ? 0 : 1);
})();
