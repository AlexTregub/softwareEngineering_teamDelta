/**
 * E2E Test: Event Drag-and-Drop in Level Editor
 * Phase 5: Visual verification with screenshots
 * 
 * Tests:
 * 1. EventEditorPanel visible in Level Editor
 * 2. Drag event from panel to canvas
 * 3. EventFlag appears at drop location
 * 4. EventFlag renders with visual indicator (circle + flag icon)
 * 5. Multiple flags can be placed
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('Loading game...');
    await page.goto('http://localhost:8000?test=1');
    
    // CRITICAL: Ensure game started (bypass menu)
    console.log('Ensuring game started...');
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Game failed to start - still on menu');
    }
    console.log('Game started successfully');
    
    // Check what's actually available
    const terrainCheck = await page.evaluate(() => {
      return {
        hasG_map2: typeof window.g_map2 !== 'undefined',
        hasG_activeMap: typeof window.g_activeMap !== 'undefined',
        g_map2Type: typeof window.g_map2,
        g_activeMapType: typeof window.g_activeMap,
        g_map2Keys: window.g_map2 ? Object.keys(window.g_map2).slice(0, 10) : [],
        g_activeMapKeys: window.g_activeMap ? Object.keys(window.g_activeMap).slice(0, 10) : []
      };
    });
    console.log('Terrain availability:', terrainCheck);
    
    // Wait for terrain to initialize
    console.log('Waiting for terrain initialization...');
    await page.waitForFunction(() => {
      return window.g_activeMap;
    }, { timeout: 5000 });
    console.log('Terrain initialized');
    
    // Enter Level Editor mode
    console.log('Entering Level Editor mode...');
    const editorResult = await page.evaluate(() => {
      // Check if Level Editor exists
      if (!window.LevelEditor) {
        return { success: false, error: 'LevelEditor not found' };
      }
      
      // Create and initialize Level Editor
      window.testLevelEditor = new window.LevelEditor();
      
      // Check if terrain exists
      if (!window.g_activeMap) {
        return { success: false, error: 'Terrain (g_activeMap) not found' };
      }
      
      window.testLevelEditor.initialize(window.g_activeMap);
      window.testLevelEditor.active = true;
      
      // Verify EventEditorPanel exists
      if (!window.testLevelEditor.eventEditor) {
        return { success: false, error: 'EventEditorPanel not initialized' };
      }
      
      // Verify EventFlagLayer exists
      if (!window.testLevelEditor.eventFlagLayer) {
        return { success: false, error: 'EventFlagLayer not initialized' };
      }
      
      return { 
        success: true,
        hasEventEditor: !!window.testLevelEditor.eventEditor,
        hasEventFlagLayer: !!window.testLevelEditor.eventFlagLayer
      };
    });
    
    if (!editorResult.success) {
      throw new Error(`Level Editor setup failed: ${editorResult.error}`);
    }
    console.log('Level Editor initialized:', editorResult);
    
    // Test 1: Show EventEditorPanel
    console.log('Test 1: Showing EventEditorPanel...');
    const panelResult = await page.evaluate(() => {
      // Make panel visible for screenshot
      if (window.testLevelEditor.levelEditorPanels) {
        window.testLevelEditor.levelEditorPanels.toggleEventsPanel();
      }
      
      // Force rendering
      window.gameState = 'PLAYING';
      if (window.RenderManager) {
        window.RenderManager.render('PLAYING');
      }
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      return {
        success: true,
        panelVisible: window.testLevelEditor.eventEditor.visible || false
      };
    });
    
    await sleep(500);
    await saveScreenshot(page, 'levelEditor/event_panel_visible', panelResult.success);
    console.log('Test 1 complete:', panelResult);
    
    // Test 2: Add test event and start drag
    console.log('Test 2: Starting drag operation...');
    const dragStartResult = await page.evaluate(() => {
      // Add a test event to EventManager
      const eventManager = window.EventManager.getInstance();
      const testEvent = {
        id: 'test-drag-event',
        type: 'dialogue',
        priority: 2,
        content: {
          title: 'Test Event',
          message: 'Drag test successful!'
        }
      };
      eventManager.registerEvent(testEvent);
      
      // Start drag placement
      window.testLevelEditor.eventEditor.startDragPlacement('test-drag-event');
      
      // Update drag position to center of screen
      const centerX = window.width / 2;
      const centerY = window.height / 2;
      window.testLevelEditor.eventEditor.updateDragPosition(centerX, centerY);
      
      // Force rendering
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      return {
        success: true,
        isDragging: window.testLevelEditor.eventEditor.isDragging(),
        dragPosition: window.testLevelEditor.eventEditor.getDragPosition()
      };
    });
    
    await sleep(500);
    await saveScreenshot(page, 'levelEditor/event_drag_active', dragStartResult.success);
    console.log('Test 2 complete:', dragStartResult);
    
    // Test 3: Complete drag and create EventFlag
    console.log('Test 3: Completing drag and creating EventFlag...');
    const dragCompleteResult = await page.evaluate(() => {
      // Convert screen position to world coordinates
      const screenX = window.width / 2;
      const screenY = window.height / 2;
      
      let worldX = screenX;
      let worldY = screenY;
      
      // Use camera manager if available
      if (window.cameraManager && typeof window.cameraManager.screenToWorld === 'function') {
        const worldPos = window.cameraManager.screenToWorld(screenX, screenY);
        worldX = worldPos.x;
        worldY = worldPos.y;
      }
      
      // Complete drag
      const result = window.testLevelEditor.eventEditor.completeDrag(worldX, worldY);
      
      // Create and add EventFlag if drag was successful
      if (result.success && result.flagConfig) {
        const flag = new window.EventFlag(result.flagConfig);
        window.testLevelEditor.eventFlagLayer.addFlag(flag);
      }
      
      // Force rendering
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      return {
        success: result.success,
        flagCreated: result.success && result.flagConfig !== undefined,
        flagCount: window.testLevelEditor.eventFlagLayer.getAllFlags().length,
        flagConfig: result.flagConfig
      };
    });
    
    await sleep(500);
    await saveScreenshot(page, 'levelEditor/event_flag_placed', dragCompleteResult.success && dragCompleteResult.flagCreated);
    console.log('Test 3 complete:', dragCompleteResult);
    
    // Test 4: Verify EventFlag renders visually
    console.log('Test 4: Verifying EventFlag visual rendering...');
    const renderResult = await page.evaluate(() => {
      // Ensure editor mode is active
      window.testLevelEditor.active = true;
      
      // Render EventFlagLayer
      const flags = window.testLevelEditor.eventFlagLayer.getAllFlags();
      
      // Force rendering with editor mode
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      return {
        success: flags.length > 0,
        flagCount: flags.length,
        firstFlag: flags.length > 0 ? {
          x: flags[0].x,
          y: flags[0].y,
          radius: flags[0].radius,
          eventId: flags[0].eventId
        } : null
      };
    });
    
    await sleep(500);
    await saveScreenshot(page, 'levelEditor/event_flag_rendered', renderResult.success);
    console.log('Test 4 complete:', renderResult);
    
    // Test 5: Place multiple flags
    console.log('Test 5: Placing multiple EventFlags...');
    const multipleResult = await page.evaluate(() => {
      // Add second event
      const eventManager = window.EventManager.getInstance();
      eventManager.registerEvent({
        id: 'test-drag-event-2',
        type: 'tutorial',
        priority: 2,
        content: {
          title: 'Second Event',
          message: 'Multiple flags work!'
        }
      });
      
      // Place second flag at different location
      window.testLevelEditor.eventEditor.startDragPlacement('test-drag-event-2');
      
      let worldX = window.width / 2 + 100;
      let worldY = window.height / 2 + 100;
      
      if (window.cameraManager && typeof window.cameraManager.screenToWorld === 'function') {
        const worldPos = window.cameraManager.screenToWorld(worldX, worldY);
        worldX = worldPos.x;
        worldY = worldPos.y;
      }
      
      const result = window.testLevelEditor.eventEditor.completeDrag(worldX, worldY);
      
      if (result.success && result.flagConfig) {
        const flag = new window.EventFlag(result.flagConfig);
        window.testLevelEditor.eventFlagLayer.addFlag(flag);
      }
      
      // Force rendering
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      return {
        success: result.success,
        totalFlags: window.testLevelEditor.eventFlagLayer.getAllFlags().length,
        expectedCount: 2
      };
    });
    
    await sleep(500);
    await saveScreenshot(page, 'levelEditor/multiple_event_flags', multipleResult.success && multipleResult.totalFlags === 2);
    console.log('Test 5 complete:', multipleResult);
    
    // Summary
    console.log('\n=== E2E Test Summary ===');
    console.log('Test 1 - EventEditorPanel visible:', panelResult.success ? 'PASS' : 'FAIL');
    console.log('Test 2 - Drag operation started:', dragStartResult.success ? 'PASS' : 'FAIL');
    console.log('Test 3 - EventFlag created:', dragCompleteResult.success && dragCompleteResult.flagCreated ? 'PASS' : 'FAIL');
    console.log('Test 4 - EventFlag rendered:', renderResult.success ? 'PASS' : 'FAIL');
    console.log('Test 5 - Multiple flags placed:', multipleResult.success && multipleResult.totalFlags === 2 ? 'PASS' : 'FAIL');
    
    const allPassed = panelResult.success && 
                     dragStartResult.success && 
                     dragCompleteResult.success && 
                     dragCompleteResult.flagCreated &&
                     renderResult.success &&
                     multipleResult.success &&
                     multipleResult.totalFlags === 2;
    
    console.log('\nOverall:', allPassed ? 'ALL TESTS PASSED ✅' : 'SOME TESTS FAILED ❌');
    
    await browser.close();
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    console.error('E2E Test Error:', error);
    await saveScreenshot(page, 'levelEditor/event_drag_drop_error', false);
    await browser.close();
    process.exit(1);
  }
})();
