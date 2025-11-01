/**
 * E2E Test: Debug containsPoint Logic
 * 
 * Test Strategy:
 * Call handleMouseWheel with extensive logging of containsPoint check
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  console.log('🧪 EntityPalette containsPoint Debug Test');
  
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
  
  // Show Entity Palette
  console.log('⏳ Showing Entity Palette...');
  await page.evaluate(() => {
    const panel = window.draggablePanelManager?.panels.get('level-editor-entity-palette');
    if (panel) {
      panel.show();
      if (window.draggablePanelManager) {
        window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
      }
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    }
  });
  
  await sleep(500);
  
  // Test containsPoint with exact parameters that LevelEditorPanels.handleMouseWheel uses
  const result = await page.evaluate(() => {
    const panel = window.draggablePanelManager?.panels.get('level-editor-entity-palette');
    if (!panel || !window.levelEditor.entityPalette) {
      return { error: 'Panel or entityPalette not found' };
    }
    
    const palettePos = panel.getPosition();
    const titleBarHeight = panel.calculateTitleBarHeight();
    const padding = panel.config.style.padding || 10;
    const panelWidth = panel.state.width || 220;
    
    const contentX = palettePos.x + padding;
    const contentY = palettePos.y + titleBarHeight + padding;
    
    // Test mouse position at panel center
    const mouseX = Math.floor(palettePos.x + panelWidth / 2);
    const mouseY = Math.floor(palettePos.y + titleBarHeight + 50);
    
    // Call containsPoint
    const contains = window.levelEditor.entityPalette.containsPoint(mouseX, mouseY, contentX, contentY);
    
    // Get content size for bounds checking
    const size = window.levelEditor.entityPalette.getContentSize();
    
    // Manual bounds check
    const inBoundsX = mouseX >= contentX && mouseX <= contentX + size.width;
    const inBoundsY = mouseY >= contentY && mouseY <= contentY + size.height;
    
    return {
      panelPos: { x: palettePos.x, y: palettePos.y },
      titleBarHeight,
      padding,
      panelWidth,
      contentX,
      contentY,
      contentSize: size,
      mousePos: { x: mouseX, y: mouseY },
      containsResult: contains,
      boundsCheck: {
        inBoundsX,
        inBoundsY,
        leftEdge: contentX,
        rightEdge: contentX + size.width,
        topEdge: contentY,
        bottomEdge: contentY + size.height,
        mouseX,
        mouseY
      }
    };
  });
  
  if (result.error) {
    console.error('❌', result.error);
    await browser.close();
    process.exit(1);
  }
  
  console.log('\n📏 Panel Geometry:');
  console.log('  Panel position:', result.panelPos);
  console.log('  Title bar height:', result.titleBarHeight);
  console.log('  Padding:', result.padding);
  console.log('  Panel width:', result.panelWidth);
  
  console.log('\n📐 Content Area:');
  console.log('  contentX:', result.contentX);
  console.log('  contentY:', result.contentY);
  console.log('  contentSize:', result.contentSize);
  
  console.log('\n🖱️  Mouse Position:');
  console.log('  mouseX:', result.mousePos.x);
  console.log('  mouseY:', result.mousePos.y);
  
  console.log('\n✅ Bounds Check:');
  console.log('  X in bounds:', result.boundsCheck.inBoundsX);
  console.log('  Y in bounds:', result.boundsCheck.inBoundsY);
  console.log('  X range:', result.boundsCheck.leftEdge, '-', result.boundsCheck.rightEdge, '(mouse:', result.boundsCheck.mouseX, ')');
  console.log('  Y range:', result.boundsCheck.topEdge, '-', result.boundsCheck.bottomEdge, '(mouse:', result.boundsCheck.mouseY, ')');
  
  console.log('\n🎯 containsPoint() result:', result.containsResult);
  
  const expected = result.boundsCheck.inBoundsX && result.boundsCheck.inBoundsY;
  const success = result.containsResult === expected;
  
  if (success && result.containsResult) {
    console.log('\n==================================================');
    console.log('✅ containsPoint() CORRECT - Mouse is inside panel');
    console.log('==================================================');
  } else if (success && !result.containsResult) {
    console.log('\n==================================================');
    console.log('✅ containsPoint() CORRECT - Mouse is outside panel');
    console.log('==================================================');
  } else {
    console.log('\n==================================================');
    console.log('❌ containsPoint() INCORRECT');
    console.log('==================================================');
    console.log('Expected:', expected);
    console.log('Got:', result.containsResult);
  }
  
  await saveScreenshot(page, 'ui/entity_palette_contains_point_debug', success);
  await browser.close();
  process.exit(success ? 0 : 1);
})();
