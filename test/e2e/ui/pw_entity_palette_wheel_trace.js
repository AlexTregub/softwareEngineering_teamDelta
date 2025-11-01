/**
 * E2E Test: Trace handleMouseWheel Parameter Values
 * 
 * Test Strategy:
 * Wrap EntityPalette.handleMouseWheel to log all parameters
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  console.log('🧪 EntityPalette handleMouseWheel Parameter Trace');
  
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
  
  // Wrap handleMouseWheel to log parameters
  await page.evaluate(() => {
    window._handleMouseWheelLogs = [];
    
    const originalHandleMouseWheel = window.levelEditor.entityPalette.handleMouseWheel.bind(window.levelEditor.entityPalette);
    window.levelEditor.entityPalette.handleMouseWheel = function(delta, mouseX, mouseY, contentX, contentY, panelWidth) {
      const log = {
        delta,
        mouseX,
        mouseY,
        contentX,
        contentY,
        panelWidth,
        scrollOffsetBefore: this.scrollOffset,
        maxScrollOffset: this.maxScrollOffset
      };
      
      // Call containsPoint
      const contains = this.containsPoint(mouseX, mouseY, contentX, contentY);
      log.containsPointResult = contains;
      
      // Call original
      const result = originalHandleMouseWheel(delta, mouseX, mouseY, contentX, contentY, panelWidth);
      
      log.returned = result;
      log.scrollOffsetAfter = this.scrollOffset;
      
      window._handleMouseWheelLogs.push(log);
      
      return result;
    };
  });
  
  // Get panel center for mouse position
  const panelInfo = await page.evaluate(() => {
    const panel = window.draggablePanelManager?.panels.get('level-editor-entity-palette');
    if (!panel) return null;
    
    const pos = panel.getPosition();
    const width = panel.state.width || 220;
    const titleBarHeight = panel.calculateTitleBarHeight();
    
    return {
      centerX: Math.floor(pos.x + width / 2),
      centerY: Math.floor(pos.y + titleBarHeight + 50)
    };
  });
  
  console.log('Panel center:', panelInfo.centerX, panelInfo.centerY);
  
  // Call LevelEditor.handleMouseWheel
  console.log('\n🖱️  Calling LevelEditor.handleMouseWheel...\n');
  
  await page.evaluate((mouseX, mouseY) => {
    const mockEvent = {
      deltaY: 100,
      delta: 100,
      preventDefault: () => {}
    };
    
    window.levelEditor.handleMouseWheel(mockEvent, false, mouseX, mouseY);
    
    if (typeof window.redraw === 'function') {
      window.redraw(); window.redraw(); window.redraw();
    }
  }, panelInfo.centerX, panelInfo.centerY);
  
  await sleep(200);
  
  // Get logs
  const logs = await page.evaluate(() => window._handleMouseWheelLogs);
  
  if (logs.length === 0) {
    console.log('❌ EntityPalette.handleMouseWheel was NEVER CALLED');
    console.log('This means LevelEditorPanels.handleMouseWheel is not routing to it');
    await browser.close();
    process.exit(1);
  }
  
  console.log('EntityPalette.handleMouseWheel was called', logs.length, 'time(s)\n');
  
  logs.forEach((log, i) => {
    console.log(`Call ${i + 1}:`);
    console.log('  delta:', log.delta);
    console.log('  mouseX:', log.mouseX);
    console.log('  mouseY:', log.mouseY);
    console.log('  contentX:', log.contentX);
    console.log('  contentY:', log.contentY);
    console.log('  panelWidth:', log.panelWidth);
    console.log('  containsPoint() result:', log.containsPointResult);
    console.log('  scrollOffset:', log.scrollOffsetBefore, '→', log.scrollOffsetAfter);
    console.log('  maxScrollOffset:', log.maxScrollOffset);
    console.log('  returned:', log.returned);
    console.log('');
  });
  
  const lastLog = logs[logs.length - 1];
  const scrollChanged = lastLog.scrollOffsetAfter !== lastLog.scrollOffsetBefore;
  
  if (!lastLog.containsPointResult) {
    console.log('==================================================');
    console.log('❌ containsPoint() returned FALSE');
    console.log('==================================================');
    console.log('Mouse is not detected as being over the panel');
  } else if (!scrollChanged) {
    console.log('==================================================');
    console.log('❌ scrollOffset DID NOT CHANGE');
    console.log('==================================================');
    console.log('containsPoint() returned true but scroll did not update');
    console.log('Check scroll calculation logic');
  } else {
    console.log('==================================================');
    console.log('✅ SCROLLING WORKS');
    console.log('==================================================');
  }
  
  const success = scrollChanged && lastLog.returned;
  
  await saveScreenshot(page, 'ui/entity_palette_wheel_trace', success);
  await browser.close();
  process.exit(success ? 0 : 1);
})();
