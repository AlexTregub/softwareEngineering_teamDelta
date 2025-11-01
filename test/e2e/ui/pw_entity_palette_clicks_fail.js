/**
 * E2E Test: Entity Palette Real User Clicks
 * Tests if REAL browser mouse clicks work on Entity Palette
 * 
 * This test will FAIL and show us WHY clicks don't work in the real app
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('[E2E] Loading page...');
    await page.goto('http://localhost:8000?test=1');
    await sleep(1500);
    
    // Manually enter Level Editor and wait for full initialization
    console.log('[SETUP] Entering Level Editor...');
    await page.evaluate(() => {
      const gs = window.GameState || window.g_gameState;
      if (gs && typeof gs.setState === 'function') {
        gs.setState('LEVEL_EDITOR');
      }
    });
    
    await sleep(2000); // Wait longer for panels to initialize
    
    // Verify panels exist
    const panelsCheck = await page.evaluate(() => {
      if (!window.draggablePanelManager || !window.draggablePanelManager.panels) {
        return { found: false };
      }
      const panelsObj = window.draggablePanelManager.panels;
      const panelIds = panelsObj instanceof Map ? Array.from(panelsObj.keys()) : Object.keys(panelsObj);
      return {
        found: true,
        hasEntityPalette: panelIds.includes('level-editor-entity-palette'),
        allPanels: panelIds
      };
    });
    
    console.log('[SETUP] Panels check:', JSON.stringify(panelsCheck, null, 2));
    
    if (!panelsCheck.hasEntityPalette) {
      await saveScreenshot(page, 'entity_palette_clicks/setup_no_panel', false);
      throw new Error('Entity Palette panel not found in draggablePanelManager');
    }
    
    // Open the Entity Palette panel
    console.log('[SETUP] Opening Entity Palette panel...');
    const toggleResult = await page.evaluate(() => {
      const mgr = window.draggablePanelManager;
      if (!mgr) return { success: false, reason: 'draggablePanelManager not found' };
      
      console.log('[DEBUG] Before toggle - gameState:', mgr.gameState);
      console.log('[DEBUG] Before toggle - stateVisibility:', mgr.stateVisibility);
      
      if (window.FileMenuBar && window.FileMenuBar._handleTogglePanel) {
        window.FileMenuBar._handleTogglePanel('entity-painter');
      } else {
        // Fallback: direct toggle
        const result = mgr.togglePanel('level-editor-entity-palette');
        console.log('[DEBUG] Direct toggle result:', result);
      }
      
      console.log('[DEBUG] After toggle - stateVisibility:', mgr.stateVisibility);
      
      const panel = mgr.panels.get('level-editor-entity-palette');
      return {
        success: true,
        visible: panel ? panel.isVisible() : null,
        gameState: mgr.gameState,
        stateVisibility: mgr.stateVisibility,
        panelState: panel && panel.state ? panel.state.visible : null
      };
    });
    
    console.log('[SETUP] Toggle result:', JSON.stringify(toggleResult, null, 2));
    
    await sleep(500);
    await page.evaluate(() => {
      if (window.draggablePanelManager) {
        window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
      }
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    await sleep(500);
    
    await saveScreenshot(page, 'entity_palette_clicks/setup_panel_opened', true);
    
    // Get panel position
    const panelPos = await page.evaluate(() => {
      const panel = window.draggablePanelManager.panels.get('level-editor-entity-palette');
      if (!panel) {
        return { found: false, reason: 'panel not in draggablePanelManager' };
      }
      if (!panel.state) {
        return { found: false, reason: 'panel has no state' };
      }
      
      const pos = panel.state.position;
      return {
        found: true,
        visible: panel.state.visible,
        x: pos.x,
        y: pos.y,
        width: panel.width,
        height: panel.height
      };
    });
    
    console.log('[SETUP] Panel position:', JSON.stringify(panelPos, null, 2));
    
    if (!panelPos.found) {
      await saveScreenshot(page, 'entity_palette_clicks/setup_panel_not_found', false);
      throw new Error(`Entity Palette panel not found: ${panelPos.reason}`);
    }
    
    if (!panelPos.visible) {
      await saveScreenshot(page, 'entity_palette_clicks/setup_panel_not_visible', false);
      throw new Error('Entity Palette panel not visible (state.visible = false)');
    }
    
    // TEST: Click on Buildings button (second category)
    console.log('\n[TEST] Clicking on Buildings category button...');
    
    const buildingsButtonX = panelPos.x + 110; // Second button
    const buildingsButtonY = panelPos.y + 45; // Title bar (~27px) + padding (10px) + button middle (15px)
    
    console.log(`[TEST] Click coordinates: (${buildingsButtonX}, ${buildingsButtonY})`);
    
    // Record state before click
    const beforeClick = await page.evaluate(() => {
      return {
        category: window.levelEditor.entityPalette.currentCategory
      };
    });
    console.log('[TEST] Before click - category:', beforeClick.category);
    
    // Perform REAL mouse click
    await page.mouse.click(buildingsButtonX, buildingsButtonY);
    await sleep(300);
    
    // Force redraw
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    await sleep(500);
    
    await saveScreenshot(page, 'entity_palette_clicks/after_buildings_click', true);
    
    // Check if category changed
    const afterClick = await page.evaluate(() => {
      return {
        category: window.levelEditor.entityPalette.currentCategory
      };
    });
    console.log('[TEST] After click - category:', afterClick.category);
    
    if (afterClick.category === beforeClick.category) {
      console.error('[TEST] ✗ FAILED: Category did not change!');
      console.error('[TEST] Expected: buildings, Got:', afterClick.category);
      
      // Debug: Check event listeners and routing
      const eventDebug = await page.evaluate((clickX, clickY) => {
        const debug = {
          hasSketchMousePressed: typeof window.mousePressed === 'function',
          hasLevelEditorHandleClick: window.levelEditor && typeof window.levelEditor.handleClick === 'function',
          levelEditorIsActive: window.levelEditor && typeof window.levelEditor.isActive === 'function' ? window.levelEditor.isActive() : 'no isActive',
          gameState: window.GameState ? window.GameState.getState() : 'no GameState',
          hasPanelsHandleClick: window.levelEditor && window.levelEditor.panels && typeof window.levelEditor.panels.handleClick === 'function'
        };
        
        // Try manually calling levelEditor.handleClick and intercept internal flow
        if (window.levelEditor && window.levelEditor.handleClick) {
          // Add temporary tracking
          const tracker = {
            handleClickCalled: false,
            active: window.levelEditor.active,
            isActiveResult: window.levelEditor.isActive ? window.levelEditor.isActive() : 'no isActive',
            panelsExists: !!window.levelEditor.levelEditorPanels,
            panelsHandleClickExists: window.levelEditor.levelEditorPanels && typeof window.levelEditor.levelEditorPanels.handleClick === 'function'
          };
          
          const result = window.levelEditor.handleClick(clickX, clickY);
          
          debug.manualCallResult = result;
          debug.categoryAfterManualCall = window.levelEditor.entityPalette ? window.levelEditor.entityPalette.currentCategory : 'no entityPalette';
          debug.tracker = tracker;
        }
        
        // Check containsPoint
        if (window.levelEditor && window.levelEditor.entityPalette) {
          const panel = window.draggablePanelManager.panels.get('level-editor-entity-palette');
          if (panel) {
            const pos = panel.getPosition();
            const titleBarHeight = panel.calculateTitleBarHeight();
            const padding = panel.config.style.padding;
            const contentX = pos.x + padding;
            const contentY = pos.y + titleBarHeight + padding;
            
            const contains = window.levelEditor.entityPalette.containsPoint(clickX, clickY, contentX, contentY);
            debug.containsPointCheck = {
              clickX, clickY, contentX, contentY,
              contains,
              panelPos: pos,
              titleBarHeight,
              padding
            };
          }
        }
        
        return debug;
      }, buildingsButtonX, buildingsButtonY);
      console.error('[DEBUG] Event listeners:', JSON.stringify(eventDebug, null, 2));
      
      await saveScreenshot(page, 'entity_palette_clicks/test_failed', false);
      await browser.close();
      process.exit(1);
    }
    
    console.log('[TEST] ✓ PASSED: Category changed to', afterClick.category);
    
    // TEST: Scroll
    console.log('\n[TEST] Testing mouse wheel scroll...');
    
    const scrollAreaX = panelPos.x + panelPos.width / 2;
    const scrollAreaY = panelPos.y + 150; // Below category buttons
    
    const beforeScroll = await page.evaluate(() => {
      return {
        scrollOffset: window.levelEditor.entityPalette.scrollOffset || 0
      };
    });
    console.log('[TEST] Before scroll - offset:', beforeScroll.scrollOffset);
    
    // Move mouse and scroll
    await page.mouse.move(scrollAreaX, scrollAreaY);
    await sleep(100);
    await page.mouse.wheel({ deltaY: 100 }); // Scroll down
    await sleep(300);
    
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    await sleep(500);
    
    await saveScreenshot(page, 'entity_palette_clicks/after_scroll', true);
    
    const afterScroll = await page.evaluate(() => {
      return {
        scrollOffset: window.levelEditor.entityPalette.scrollOffset || 0
      };
    });
    console.log('[TEST] After scroll - offset:', afterScroll.scrollOffset);
    
    if (afterScroll.scrollOffset === beforeScroll.scrollOffset) {
      console.error('[TEST] ✗ FAILED: Scroll offset did not change!');
      
      // Debug: Check wheel event listeners
      const wheelDebug = await page.evaluate(() => {
        return {
          hasMouseWheel: typeof window.mouseWheel === 'function',
          hasLevelEditorHandleMouseWheel: window.levelEditor && typeof window.levelEditor.handleMouseWheel === 'function',
          hasPanelsMouseWheel: window.levelEditor && window.levelEditor.panels && typeof window.levelEditor.panels.mouseWheel === 'function'
        };
      });
      console.error('[DEBUG] Wheel listeners:', JSON.stringify(wheelDebug, null, 2));
      
      await saveScreenshot(page, 'entity_palette_clicks/scroll_failed', false);
      await browser.close();
      process.exit(1);
    }
    
    console.log('[TEST] ✓ PASSED: Scroll offset changed');
    
    console.log('\n[E2E] ✓ All tests passed - clicks and scrolls work!');
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('[E2E] ✗ Test failed:', error.message);
    console.error(error.stack);
    await saveScreenshot(page, 'entity_palette_clicks/error', false);
    await browser.close();
    process.exit(1);
  }
})();
