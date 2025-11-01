/**
 * E2E Test: Entity Palette Direct handleMouseWheel Call
 * 
 * Test Strategy:
 * Bypass Puppeteer mouse.wheel() and call handleMouseWheel directly
 * This tests the functionality without relying on browser event propagation
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  console.log('🧪 Entity Palette Direct handleMouseWheel Call Test');
  
  await page.goto('http://localhost:8000?test=1');
  await sleep(1000); // Initial load wait
  
  // Enter Level Editor manually
  console.log('⏳ Entering Level Editor...');
  const editorInit = await page.evaluate(() => {
    if (!window.levelEditor) {
      return { success: false, error: 'levelEditor not found' };
    }
    
    if (!window.levelEditor.isActive()) {
      if (window.GameState && typeof window.GameState.setState === 'function') {
        window.GameState.setState('LEVEL_EDITOR');
      } else {
        window.gameState = 'LEVEL_EDITOR';
      }
      
      if (window.g_map2) {
        window.levelEditor.initialize(window.g_map2);
      }
    }
    
    return { 
      success: true, 
      active: window.levelEditor.isActive()
    };
  });
  
  if (!editorInit.success) {
    console.error('❌ Failed to enter Level Editor');
    await browser.close();
    process.exit(1);
  }
  
  await sleep(1000); // Wait for panels to register
  
  // Show Entity Palette
  console.log('⏳ Showing Entity Palette...');
  await page.evaluate(() => {
    const state = 'LEVEL_EDITOR';
    const panelId = 'level-editor-entity-palette';
    
    // Add to state visibility (CRITICAL!)
    if (!window.draggablePanelManager.stateVisibility[state]) {
      window.draggablePanelManager.stateVisibility[state] = [];
    }
    if (!window.draggablePanelManager.stateVisibility[state].includes(panelId)) {
      window.draggablePanelManager.stateVisibility[state].push(panelId);
    }
    
    const panel = window.draggablePanelManager?.panels.get(panelId);
    if (panel) {
      panel.show();
      
      // Force render
      if (window.draggablePanelManager) {
        window.draggablePanelManager.renderPanels(state);
      }
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    }
  });
  
  await sleep(500);
  
  // Get panel info and initial state
  const beforeState = await page.evaluate(() => {
    const panelMgr = window.draggablePanelManager;
    if (!panelMgr) return { error: 'draggablePanelManager not found' };
    if (!panelMgr.panels) return { error: 'panels not found' };
    
    const panel = panelMgr.panels.get('level-editor-entity-palette');
    if (!panel) {
      // List available panels for debugging
      const keys = Array.from(panelMgr.panels.keys());
      return { error: 'panel not found', availablePanels: keys };
    }
    
    if (!window.levelEditor) return { error: 'levelEditor not found' };
    if (!window.levelEditor.entityPalette) return { error: 'entityPalette not found in levelEditor' };
    
    const pos = panel.getPosition();
    const width = panel.state.width || 220;
    const titleBarHeight = panel.calculateTitleBarHeight();
    const padding = panel.config.style.padding || 10;
    
    return {
      panelX: pos.x,
      panelY: pos.y,
      contentX: pos.x + padding,
      contentY: pos.y + titleBarHeight + padding,
      centerX: Math.floor(pos.x + width / 2),
      centerY: Math.floor(pos.y + titleBarHeight + 50),
      scrollOffset: window.levelEditor.entityPalette.scrollOffset,
      maxScrollOffset: window.levelEditor.entityPalette.maxScrollOffset
    };
  });
  
  if (beforeState.error) {
    console.error('❌ Error:', beforeState.error);
    if (beforeState.availablePanels) {
      console.error('Available panels:', beforeState.availablePanels);
    }
    await browser.close();
    process.exit(1);
  }
  
  console.log('Panel center:', beforeState.centerX, beforeState.centerY);
  console.log('Initial scroll:', beforeState.scrollOffset, '/', beforeState.maxScrollOffset);
  
  // Call LevelEditor.handleMouseWheel directly
  console.log('\n🖱️  Calling LevelEditor.handleMouseWheel directly...\n');
  
  const afterState = await page.evaluate((mouseX, mouseY) => {
    // Create mock event
    const mockEvent = {
      deltaY: 100,
      delta: 100,
      preventDefault: () => {}
    };
    
    // Call LevelEditor.handleMouseWheel
    const handled = window.levelEditor.handleMouseWheel(mockEvent, false, mouseX, mouseY);
    
    // Force redraw
    if (typeof window.redraw === 'function') {
      window.redraw();
      window.redraw();
      window.redraw();
    }
    
    return {
      handled,
      scrollOffset: window.levelEditor.entityPalette.scrollOffset,
      maxScrollOffset: window.levelEditor.entityPalette.maxScrollOffset,
      levelEditorActive: window.levelEditor.active,
      gameState: window.GameState ? window.GameState.getState() : 'unknown'
    };
  }, beforeState.centerX, beforeState.centerY);
  
  console.log('Result:');
  console.log('  handled:', afterState.handled);
  console.log('  scrollOffset:', beforeState.scrollOffset, '→', afterState.scrollOffset);
  console.log('  maxScrollOffset:', afterState.maxScrollOffset);
  console.log('  Level Editor active:', afterState.levelEditorActive);
  console.log('  Game state:', afterState.gameState);
  
  const scrollChanged = afterState.scrollOffset > beforeState.scrollOffset;
  const success = afterState.handled && scrollChanged;
  
  if (success) {
    console.log('\n==================================================');
    console.log('✅ DIRECT CALL SUCCESSFUL');
    console.log('==================================================');
  } else {
    console.log('\n==================================================');
    console.log('❌ DIRECT CALL FAILED');
    console.log('==================================================');
    
    if (!afterState.handled) {
      console.log('handleMouseWheel returned false');
    }
    if (!scrollChanged) {
      console.log('scrollOffset did not change');
    }
  }
  
  await saveScreenshot(page, 'ui/entity_palette_direct_call', success);
  await browser.close();
  process.exit(success ? 0 : 1);
})();
