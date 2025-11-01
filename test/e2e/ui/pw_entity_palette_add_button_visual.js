/**
 * E2E Test: Entity Palette Add Button Visual Test
 * 
 * Test Strategy:
 * 1. Switch to Custom category
 * 2. Take screenshots at intervals
 * 3. Manually verify button is visible in screenshots
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  console.log('🧪 Entity Palette Add Button Visual Test');
  
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
  
  // Take initial screenshot
  await saveScreenshot(page, 'ui/add_button_visual/01_initial_entities_category', true);
  console.log('📸 Screenshot 1: Initial (Entities category)');
  
  // Switch to Custom category
  console.log('\n🖱️  Switching to Custom category...');
  await page.evaluate(() => {
    window.levelEditor.entityPalette.setCategory('custom');
    
    // Force redraws
    if (typeof window.redraw === 'function') {
      window.redraw();
      window.redraw();
      window.redraw();
    }
  });
  
  await sleep(100);
  await saveScreenshot(page, 'ui/add_button_visual/02_immediately_after_switch', true);
  console.log('📸 Screenshot 2: Immediately after switch');
  
  await sleep(500);
  await saveScreenshot(page, 'ui/add_button_visual/03_after_500ms', true);
  console.log('📸 Screenshot 3: After 500ms');
  
  await sleep(1500);
  await saveScreenshot(page, 'ui/add_button_visual/04_after_2000ms', true);
  console.log('📸 Screenshot 4: After 2000ms');
  
  // Get panel info for manual inspection
  const panelInfo = await page.evaluate(() => {
    const panel = window.draggablePanelManager?.panels.get('level-editor-entity-palette');
    if (!panel) return null;
    
    return {
      category: window.levelEditor.entityPalette.currentCategory,
      visible: panel.state.visible,
      position: panel.state.position,
      width: panel.state.width,
      height: panel.state.height
    };
  });
  
  console.log('\n📏 Panel Info:');
  console.log('  Category:', panelInfo.category);
  console.log('  Visible:', panelInfo.visible);
  console.log('  Position:', panelInfo.position);
  console.log('  Size:', `${panelInfo.width}x${panelInfo.height}`);
  
  console.log('\n==================================================');
  console.log('✅ Screenshots saved to test/e2e/screenshots/ui/add_button_visual/');
  console.log('==================================================');
  console.log('Manually inspect screenshots to verify Add button visibility');
  console.log('Expected: Green "➕ Add New Custom Entity" button at bottom of panel');
  
  await browser.close();
  process.exit(0);
})();
