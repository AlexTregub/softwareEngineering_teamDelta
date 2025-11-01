/**
 * E2E Test: Entity Palette Wheel Event Verbose Diagnostic
 * 
 * Test Strategy:
 * 1. Inject extensive logging at each stage of event routing
 * 2. Track: Browser → sketch.mouseWheel → LevelEditor → LevelEditorPanels → EntityPalette
 * 3. Log containsPoint checks, handle results, scroll values
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  console.log('🧪 Entity Palette Wheel Event VERBOSE Diagnostic');
  
  await page.goto('http://localhost:8000?test=1');
  
  // Ensure Level Editor started
  console.log('⏳ Entering Level Editor...');
  const editorStarted = await cameraHelper.ensureLevelEditorStarted(page);
  if (!editorStarted.started) {
    console.error('❌ Failed to start Level Editor');
    await browser.close();
    process.exit(1);
  }
  
  await sleep(500);
  
  // Inject EXTENSIVE logging into event chain
  await page.evaluate(() => {
    window._eventLog = [];
    
    function log(stage, data) {
      const entry = { stage, ...data, timestamp: Date.now() };
      window._eventLog.push(entry);
      console.log(`[${stage}]`, data);
    }
    
    // Wrap sketch.mouseWheel
    const originalMouseWheel = window.mouseWheel;
    window.mouseWheel = function(event) {
      log('sketch.mouseWheel', {
        deltaY: event.deltaY,
        mouseX: window.mouseX,
        mouseY: window.mouseY,
        gameState: window.GameState ? window.GameState.getState() : 'unknown'
      });
      return originalMouseWheel.call(this, event);
    };
    
    // Wrap LevelEditor.handleMouseWheel
    if (window.levelEditor && window.levelEditor.handleMouseWheel) {
      const originalLEHandleMouseWheel = window.levelEditor.handleMouseWheel.bind(window.levelEditor);
      window.levelEditor.handleMouseWheel = function(event, shiftKey, mouseX, mouseY) {
        log('LevelEditor.handleMouseWheel', {
          deltaY: event.deltaY,
          shiftKey,
          mouseX,
          mouseY,
          active: this.active,
          panelsExists: !!(this.levelEditorPanels)
        });
        const result = originalLEHandleMouseWheel(event, shiftKey, mouseX, mouseY);
        log('LevelEditor.handleMouseWheel.result', { returned: result });
        return result;
      };
    }
    
    // Wrap LevelEditorPanels.handleMouseWheel
    if (window.levelEditor && window.levelEditor.levelEditorPanels && window.levelEditor.levelEditorPanels.handleMouseWheel) {
      const originalPanelsHandleMouseWheel = window.levelEditor.levelEditorPanels.handleMouseWheel.bind(window.levelEditor.levelEditorPanels);
      window.levelEditor.levelEditorPanels.handleMouseWheel = function(delta, mouseX, mouseY) {
        log('LevelEditorPanels.handleMouseWheel', {
          delta,
          mouseX,
          mouseY,
          entityPaletteVisible: this.panels.entityPalette ? this.panels.entityPalette.state.visible : false
        });
        const result = originalPanelsHandleMouseWheel(delta, mouseX, mouseY);
        log('LevelEditorPanels.handleMouseWheel.result', { returned: result });
        return result;
      };
    }
    
    // Wrap EntityPalette.handleMouseWheel
    if (window.levelEditor && window.levelEditor.entityPalette && window.levelEditor.entityPalette.handleMouseWheel) {
      const originalEPHandleMouseWheel = window.levelEditor.entityPalette.handleMouseWheel.bind(window.levelEditor.entityPalette);
      window.levelEditor.entityPalette.handleMouseWheel = function(delta, mouseX, mouseY, contentX, contentY, panelWidth) {
        log('EntityPalette.handleMouseWheel', {
          delta,
          mouseX,
          mouseY,
          contentX,
          contentY,
          panelWidth,
          scrollOffsetBefore: this.scrollOffset,
          maxScrollOffset: this.maxScrollOffset
        });
        
        // Check containsPoint
        const contains = this.containsPoint(mouseX, mouseY, contentX, contentY);
        log('EntityPalette.containsPoint', {
          contains,
          bounds: {
            x: contentX,
            y: contentY,
            width: panelWidth,
            height: this.viewportHeight
          }
        });
        
        const result = originalEPHandleMouseWheel(delta, mouseX, mouseY, contentX, contentY, panelWidth);
        
        log('EntityPalette.handleMouseWheel.result', {
          returned: result,
          scrollOffsetAfter: this.scrollOffset
        });
        return result;
      };
    }
  });
  
  // Show Entity Palette
  console.log('⏳ Showing Entity Palette...');
  await page.evaluate(() => {
    if (window.draggablePanelManager && window.draggablePanelManager.getPanel) {
      const panel = window.draggablePanelManager.getPanel('levelEditor_entityPalette');
      if (panel) {
        panel.show();
      }
    }
  });
  
  await sleep(500);
  
  // Get panel info
  const panelInfo = await page.evaluate(() => {
    const panel = window.draggablePanelManager.getPanel('levelEditor_entityPalette');
    if (!panel) return null;
    
    const pos = panel.getPosition();
    const width = panel.state.width || 220;
    const height = panel.state.height || 400;
    const titleBarHeight = panel.calculateTitleBarHeight();
    
    return {
      x: pos.x,
      y: pos.y,
      width,
      height,
      titleBarHeight,
      centerX: Math.floor(pos.x + width / 2),
      centerY: Math.floor(pos.y + titleBarHeight + 50) // Near top of content
    };
  });
  
  if (!panelInfo) {
    console.error('❌ Entity Palette panel not found');
    await browser.close();
    process.exit(1);
  }
  
  console.log('Panel center:', panelInfo.centerX, panelInfo.centerY);
  
  // Get initial state
  const beforeState = await page.evaluate(() => {
    return {
      scrollOffset: window.levelEditor.entityPalette.scrollOffset,
      maxScrollOffset: window.levelEditor.entityPalette.maxScrollOffset
    };
  });
  
  console.log('Initial scroll:', beforeState.scrollOffset, '/', beforeState.maxScrollOffset);
  
  // Clear event log
  await page.evaluate(() => { window._eventLog = []; });
  
  // Move mouse to panel center
  await page.mouse.move(panelInfo.centerX, panelInfo.centerY);
  await sleep(200);
  
  console.log('\n🖱️  Sending wheel event...\n');
  
  // Send one wheel event
  await page.mouse.wheel({ deltaY: 100 });
  await sleep(500);
  
  // Get event log
  const eventLog = await page.evaluate(() => window._eventLog);
  
  console.log('Event Log:');
  eventLog.forEach(entry => {
    const { stage, timestamp, ...data } = entry;
    console.log(`  [${stage}]`, JSON.stringify(data, null, 2));
  });
  
  // Get final state
  const afterState = await page.evaluate(() => {
    return {
      scrollOffset: window.levelEditor.entityPalette.scrollOffset,
      maxScrollOffset: window.levelEditor.entityPalette.maxScrollOffset
    };
  });
  
  console.log('\nScroll After:', afterState.scrollOffset, '/', afterState.maxScrollOffset);
  
  // Check if ANY logging occurred
  const success = eventLog.length > 0 && afterState.scrollOffset > beforeState.scrollOffset;
  
  if (!success) {
    console.log('\n==================================================');
    console.log('❌ WHEEL EVENT NOT PROCESSED');
    console.log('==================================================');
    
    if (eventLog.length === 0) {
      console.log('No events logged - wheel event not reaching sketch.mouseWheel()');
    } else {
      console.log('Events logged but scrollOffset did not change');
      console.log('Check containsPoint() logic in EntityPalette');
    }
  } else {
    console.log('\n==================================================');
    console.log('✅ WHEEL EVENT PROCESSED');
    console.log('==================================================');
  }
  
  await saveScreenshot(page, 'ui/entity_palette_wheel_verbose', success);
  await browser.close();
  process.exit(success ? 0 : 1);
})();
