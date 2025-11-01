/**
 * E2E Test: Mouse Wheel Event Flow Diagnostic
 * 
 * Tests the complete mouse wheel event routing chain:
 * 1. Puppeteer sends wheel event
 * 2. sketch.js mouseWheel() receives it
 * 3. LevelEditor.handleMouseWheel() processes it
 * 4. LevelEditorPanels.handleMouseWheel() routes it
 * 5. EntityPalette.handleMouseWheel() scrolls
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  console.log('🧪 Mouse Wheel Event Flow Diagnostic');
  
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1280, height: 720 });
  
  // Inject event listener to track wheel events
  await page.evaluateOnNewDocument(() => {
    window._wheelEvents = [];
    window.addEventListener('wheel', (e) => {
      window._wheelEvents.push({
        deltaY: e.deltaY,
        timestamp: Date.now(),
        target: e.target.tagName
      });
    });
  });
  
  await page.goto('http://localhost:8000?test=1');
  await sleep(1000);
  
  // Enter Level Editor
  console.log('⏳ Entering Level Editor...');
  await page.evaluate(() => {
    if (window.GameState && typeof window.GameState.setState === 'function') {
      window.GameState.setState('LEVEL_EDITOR');
    } else {
      window.gameState = 'LEVEL_EDITOR';
    }
    
    if (window.levelEditor && window.g_map2) {
      window.levelEditor.initialize(window.g_map2);
    }
  });
  
  await sleep(500);
  
  // Show Entity Palette
  console.log('⏳ Showing Entity Palette...');
  await page.evaluate(() => {
    const panel = window.draggablePanelManager?.panels.get('level-editor-entity-palette');
    if (panel) panel.show();
    
    if (window.draggablePanelManager) {
      window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
    }
    if (typeof window.redraw === 'function') {
      window.redraw(); window.redraw(); window.redraw();
    }
  });
  
  await sleep(300);
  
  // Get panel center
  const panelInfo = await page.evaluate(() => {
    const panel = window.draggablePanelManager?.panels.get('level-editor-entity-palette');
    if (!panel) return null;
    
    const palette = window.levelEditor?.entityPalette;
    if (!palette) return null;
    
    const pos = panel.getPosition();
    const titleBarHeight = panel.calculateTitleBarHeight();
    const padding = panel.config.style.padding;
    const size = palette.getContentSize(220);
    
    const contentX = pos.x + padding;
    const contentY = pos.y + titleBarHeight + padding;
    
    return {
      centerX: contentX + size.width / 2,
      centerY: contentY + size.height / 2,
      scrollOffset: palette.scrollOffset,
      maxScrollOffset: palette.maxScrollOffset
    };
  });
  
  console.log('Panel center:', Math.round(panelInfo.centerX), Math.round(panelInfo.centerY));
  console.log('Initial scroll:', panelInfo.scrollOffset, '/', panelInfo.maxScrollOffset);
  console.log('');
  
  // Move mouse to panel center
  await page.mouse.move(panelInfo.centerX, panelInfo.centerY);
  await sleep(200);
  
  // Inject tracking into sketch.js mouseWheel
  await page.evaluate(() => {
    window._mouseWheelCalls = [];
    const originalMouseWheel = window.mouseWheel;
    window.mouseWheel = function(event) {
      window._mouseWheelCalls.push({
        deltaY: event.deltaY,
        timestamp: Date.now()
      });
      return originalMouseWheel.call(this, event);
    };
  });
  
  console.log('🖱️  Sending wheel event...');
  await page.mouse.wheel({ deltaY: 100 });
  await sleep(500);
  
  // Check event flow
  const eventFlow = await page.evaluate(() => {
    const palette = window.levelEditor?.entityPalette;
    
    return {
      wheelEventsReceived: window._wheelEvents.length,
      mouseWheelCalls: window._mouseWheelCalls.length,
      scrollOffset: palette ? palette.scrollOffset : null,
      gameState: window.gameState || window.GameState?.getState?.(),
      levelEditorActive: window.levelEditor?.isActive?.(),
      levelEditorExists: !!window.levelEditor,
      levelEditorPanelsExists: !!window.levelEditor?.levelEditorPanels,
      entityPaletteExists: !!window.levelEditor?.entityPalette
    };
  });
  
  console.log('');
  console.log('Event Flow:');
  console.log('  Browser wheel events:', eventFlow.wheelEventsReceived);
  console.log('  sketch.mouseWheel calls:', eventFlow.mouseWheelCalls);
  console.log('  scrollOffset after wheel:', eventFlow.scrollOffset);
  console.log('');
  console.log('State Check:');
  console.log('  Game state:', eventFlow.gameState);
  console.log('  Level Editor active:', eventFlow.levelEditorActive);
  console.log('  levelEditor exists:', eventFlow.levelEditorExists);
  console.log('  levelEditorPanels exists:', eventFlow.levelEditorPanelsExists);
  console.log('  entityPalette exists:', eventFlow.entityPaletteExists);
  
  await saveScreenshot(page, 'entity_palette_wheel_diagnostic/after_wheel', true);
  
  await browser.close();
  
  const success = eventFlow.wheelEventsReceived > 0 && 
                  eventFlow.mouseWheelCalls > 0 && 
                  eventFlow.scrollOffset > 0;
  
  console.log('');
  console.log('='.repeat(50));
  console.log(success ? '✅ WHEEL EVENTS FLOWING' : '❌ WHEEL EVENTS BLOCKED');
  console.log('='.repeat(50));
  
  process.exit(success ? 0 : 1);
})();
