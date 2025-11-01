/**
 * E2E Test: Entity Palette Add Button - Trace Render Components
 * 
 * Test Strategy:
 * 1. Inject logging into render() method
 * 2. Switch to Custom category
 * 3. Check which components are rendering
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  console.log('🧪 Entity Palette Add Button - Render Component Trace');
  
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
  
  // Inject render logging
  await page.evaluate(() => {
    window._renderLog = [];
    
    const originalRender = window.levelEditor.entityPalette.render.bind(window.levelEditor.entityPalette);
    window.levelEditor.entityPalette.render = function(x, y, width, height) {
      const log = {
        timestamp: Date.now(),
        category: this.currentCategory,
        components: {}
      };
      
      // Check component states BEFORE rendering
      log.components.loadingSpinnerVisible = this._loadingSpinnerVisible;
      log.components.isDragging = this._isDragging;
      log.components.hasToast = !!this._toast;
      log.components.toastVisible = this._toast ? this._toast.visible : false;
      
      // Call original render
      originalRender(x, y, width, height);
      
      window._renderLog.push(log);
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
  
  // Get render log
  const renderLog = await page.evaluate(() => window._renderLog);
  
  console.log(`Render() called ${renderLog.length} times\n`);
  
  // Show last 5 render calls
  const recent = renderLog.slice(-5);
  recent.forEach((log, i) => {
    console.log(`Render ${i + 1}:`);
    console.log('  Category:', log.category);
    console.log('  Loading spinner visible:', log.components.loadingSpinnerVisible);
    console.log('  Dragging:', log.components.isDragging);
    console.log('  Has toast:', log.components.hasToast);
    console.log('  Toast visible:', log.components.toastVisible);
    console.log('');
  });
  
  // Check if any problematic components are active
  const lastRender = renderLog[renderLog.length - 1];
  const hasProblems = lastRender.components.loadingSpinnerVisible || 
                      lastRender.components.isDragging ||
                      lastRender.components.toastVisible;
  
  if (hasProblems) {
    console.log('==================================================');
    console.log('⚠️  COMPONENTS RENDERING OVER ADD BUTTON');
    console.log('==================================================');
    if (lastRender.components.loadingSpinnerVisible) {
      console.log('- Loading spinner is visible (draws overlay)');
    }
    if (lastRender.components.isDragging) {
      console.log('- Drag ghost rendering');
    }
    if (lastRender.components.toastVisible) {
      console.log('- Toast notification rendering');
    }
  } else {
    console.log('==================================================');
    console.log('✅ NO OVERLAYS ACTIVE');
    console.log('==================================================');
    console.log('Add button should be visible');
  }
  
  await saveScreenshot(page, 'ui/add_button_bug/render_trace', true);
  await browser.close();
  process.exit(0);
})();
