/**
 * E2E Test: Entity Palette Basic Interaction
 * Tests the most basic user interactions with Entity Palette panel
 * 
 * Purpose: Find what's broken by testing fundamental interactions:
 * 1. Can the panel be opened?
 * 2. Is the panel visible?
 * 3. Can we click on it at all?
 * 4. Does it respond to any mouse events?
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('[E2E] Loading Level Editor...');
    await page.goto('http://localhost:8000?test=1');
    
    // CRITICAL: Start Level Editor (not game)
    const editorStarted = await cameraHelper.ensureLevelEditorStarted(page);
    if (!editorStarted.started) {
      console.error('[E2E] Failed to start Level Editor');
      console.error('[E2E] Reason:', editorStarted.reason);
      console.error('[E2E] Diagnostics:', JSON.stringify(editorStarted.diagnostics, null, 2));
      throw new Error(`Failed to start Level Editor: ${editorStarted.reason || 'unknown'}`);
    }
    console.log('[E2E] ✓ Level Editor started');
    console.log('[E2E] Panels registered:', editorStarted.diagnostics.panels);
    await sleep(500);
    
    // Test 1: Check if Entity Palette panel exists at all
    console.log('\n[TEST 1] Checking if Entity Palette panel exists...');
    const panelExists = await page.evaluate(() => {
      if (!window.levelEditor) return { exists: false, reason: 'levelEditor not found' };
      if (!window.levelEditor.panels) return { exists: false, reason: 'panels not found' };
      if (!window.levelEditor.panels.entityPalette) return { exists: false, reason: 'entityPalette panel not found' };
      
      const panel = window.levelEditor.panels.entityPalette;
      return {
        exists: true,
        visible: panel.state ? panel.state.visible : false,
        position: panel.state ? panel.state.position : null,
        width: panel.width,
        height: panel.height
      };
    });
    
    console.log('[TEST 1] Panel exists:', JSON.stringify(panelExists, null, 2));
    
    if (!panelExists.exists) {
      await saveScreenshot(page, 'entity_palette_basic/test1_panel_not_found', false);
      throw new Error(`TEST 1 FAILED: ${panelExists.reason}`);
    }
    
    // Test 2: Open the panel if it's not visible
    if (!panelExists.visible) {
      console.log('\n[TEST 2] Opening Entity Palette panel...');
      const opened = await page.evaluate(() => {
        if (!window.levelEditor || !window.levelEditor.panels || !window.levelEditor.panels.entityPalette) {
          return { success: false, reason: 'Panel not found' };
        }
        
        const panel = window.levelEditor.panels.entityPalette;
        
        // Method 1: Try FileMenuBar toggle
        if (window.FileMenuBar && window.FileMenuBar._handleTogglePanel) {
          window.FileMenuBar._handleTogglePanel('entity-painter');
          return { success: true, method: 'FileMenuBar' };
        }
        
        // Method 2: Direct panel state change
        if (panel.state) {
          panel.state.visible = true;
          return { success: true, method: 'Direct state' };
        }
        
        return { success: false, reason: 'No toggle method available' };
      });
      
      console.log('[TEST 2] Panel opened:', JSON.stringify(opened, null, 2));
      
      if (!opened.success) {
        await saveScreenshot(page, 'entity_palette_basic/test2_cannot_open', false);
        throw new Error(`TEST 2 FAILED: ${opened.reason}`);
      }
      
      await sleep(300);
      await page.evaluate(() => {
        if (window.draggablePanelManager) {
          window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
        }
        if (typeof window.redraw === 'function') {
          window.redraw(); window.redraw(); window.redraw();
        }
      });
      await sleep(500);
    }
    
    await saveScreenshot(page, 'entity_palette_basic/test2_panel_opened', true);
    
    // Test 3: Check if EntityPalette content object exists
    console.log('\n[TEST 3] Checking EntityPalette content object...');
    const contentExists = await page.evaluate(() => {
      if (!window.levelEditor || !window.levelEditor.entityPalette) {
        return { exists: false, reason: 'levelEditor.entityPalette not found' };
      }
      
      const palette = window.levelEditor.entityPalette;
      return {
        exists: true,
        hasCategoryButtons: !!palette.categoryButtons,
        hasHandleClick: typeof palette.handleClick === 'function',
        hasHandleMouseWheel: typeof palette.handleMouseWheel === 'function',
        currentCategory: palette.currentCategory || 'unknown',
        categories: palette.categories ? palette.categories.map(c => c.id) : []
      };
    });
    
    console.log('[TEST 3] Content object:', JSON.stringify(contentExists, null, 2));
    
    if (!contentExists.exists) {
      await saveScreenshot(page, 'entity_palette_basic/test3_content_not_found', false);
      throw new Error(`TEST 3 FAILED: ${contentExists.reason}`);
    }
    
    // Test 4: Check if click event routing works
    console.log('\n[TEST 4] Testing click event routing...');
    const clickRouting = await page.evaluate(() => {
      const results = {
        levelEditorExists: !!window.levelEditor,
        panelsExists: !!(window.levelEditor && window.levelEditor.panels),
        entityPaletteExists: !!(window.levelEditor && window.levelEditor.panels && window.levelEditor.panels.entityPalette),
        mousePressedExists: !!(window.levelEditor && typeof window.levelEditor.mousePressed === 'function'),
        mouseWheelExists: !!(window.levelEditor && typeof window.levelEditor.handleMouseWheel === 'function')
      };
      
      // Check LevelEditorPanels
      if (window.levelEditor && window.levelEditor.panels) {
        const panels = window.levelEditor.panels;
        results.panelsMousePressed = typeof panels.mousePressed === 'function';
        results.panelsMouseWheel = typeof panels.mouseWheel === 'function';
      }
      
      return results;
    });
    
    console.log('[TEST 4] Click routing:', JSON.stringify(clickRouting, null, 2));
    
    // Test 5: Simulate a click on the panel
    console.log('\n[TEST 5] Simulating click on Entity Palette panel...');
    const clickResult = await page.evaluate(() => {
      if (!window.levelEditor || !window.levelEditor.panels || !window.levelEditor.panels.entityPalette) {
        return { success: false, reason: 'Panel not found' };
      }
      
      const panel = window.levelEditor.panels.entityPalette;
      if (!panel.state || !panel.state.visible) {
        return { success: false, reason: 'Panel not visible' };
      }
      
      const pos = panel.state.position;
      const clickX = pos.x + 110; // Center horizontally
      const clickY = pos.y + 15;  // Top area (category buttons)
      
      console.log('[EntityPalette] Simulating click at:', clickX, clickY);
      
      // Try direct handleClick on EntityPalette
      if (window.levelEditor.entityPalette && window.levelEditor.entityPalette.handleClick) {
        const result = window.levelEditor.entityPalette.handleClick(
          clickX, 
          clickY, 
          pos.x, 
          pos.y, 
          panel.width
        );
        return { success: true, result, method: 'direct' };
      }
      
      // Try through LevelEditorPanels
      if (window.levelEditor.panels && window.levelEditor.panels.mousePressed) {
        const result = window.levelEditor.panels.mousePressed(clickX, clickY);
        return { success: true, result, method: 'panels' };
      }
      
      return { success: false, reason: 'No click method available' };
    });
    
    console.log('[TEST 5] Click result:', JSON.stringify(clickResult, null, 2));
    await saveScreenshot(page, 'entity_palette_basic/test5_click_attempted', clickResult.success);
    
    // Test 6: Try scrolling
    console.log('\n[TEST 6] Testing scroll on Entity Palette...');
    const scrollResult = await page.evaluate(() => {
      if (!window.levelEditor || !window.levelEditor.entityPalette) {
        return { success: false, reason: 'EntityPalette not found' };
      }
      
      const palette = window.levelEditor.entityPalette;
      const beforeScroll = palette.scrollOffset || 0;
      
      // Try handleMouseWheel
      if (typeof palette.handleMouseWheel === 'function') {
        palette.handleMouseWheel(1); // Scroll down
        const afterScroll = palette.scrollOffset || 0;
        return {
          success: true,
          beforeScroll,
          afterScroll,
          changed: beforeScroll !== afterScroll
        };
      }
      
      return { success: false, reason: 'handleMouseWheel not found' };
    });
    
    console.log('[TEST 6] Scroll result:', JSON.stringify(scrollResult, null, 2));
    await saveScreenshot(page, 'entity_palette_basic/test6_scroll_attempted', scrollResult.success);
    
    console.log('\n[E2E] ✓ All basic interaction tests completed');
    console.log('[E2E] Check screenshots in test/e2e/screenshots/entity_palette_basic/');
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('[E2E] ✗ Test failed:', error.message);
    await saveScreenshot(page, 'entity_palette_basic/error', false);
    await browser.close();
    process.exit(1);
  }
})();
