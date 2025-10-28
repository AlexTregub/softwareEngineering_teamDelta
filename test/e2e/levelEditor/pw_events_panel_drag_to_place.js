/**
 * E2E Test: EventEditorPanel Drag-to-Place Functionality
 * 
 * Tests complete drag-to-place workflow after render parameter fix.
 * 
 * Test Flow:
 * 1. Enter Level Editor
 * 2. Toggle Events panel ON
 * 3. Click drag button on an event
 * 4. Verify drag state active
 * 5. Move mouse over terrain
 * 6. Release to place event
 * 7. Verify event placed correctly
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  let browser;
  
  try {
    console.log('=== EventEditorPanel Drag-to-Place E2E Test ===\n');
    
    // Step 1: Load game and ensure started
    console.log('Step 1: Loading game...');
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.goto('http://localhost:8000?test=1');
    
    console.log('Step 2: Ensuring game started...');
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    
    if (!gameStarted.started) {
      throw new Error(`Game failed to start: ${gameStarted.reason || 'Unknown reason'}`);
    }
    
    console.log('✅ Game started successfully\n');
    
    // Step 2: Enter Level Editor
    console.log('Step 3: Entering Level Editor mode...');
    await page.evaluate(() => {
      if (typeof GameState !== 'undefined' && GameState.setState) {
        GameState.setState('LEVEL_EDITOR');
      }
      
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(1000);
    console.log('✅ Entered Level Editor mode\n');
    
    // Wait for Level Editor to fully initialize
    await sleep(500);
    
    // Step 3: Toggle Events panel ON
    console.log('Step 4: Toggling Events panel...');
    await page.evaluate(() => {
      if (window.levelEditor && window.levelEditor.levelEditorPanels) {
        window.levelEditor.levelEditorPanels.toggleEventsPanel();
      }
      
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(500);
    console.log('✅ Events panel visible\n');
    await saveScreenshot(page, 'levelEditor/drag_to_place_01_panel_open', true);
    
    // Step 4: Click drag button
    console.log('Step 5: Clicking drag button on first event...');
    const dragStart = await page.evaluate(() => {
      const eventEditor = window.levelEditor.eventEditor;
      const panel = window.draggablePanelManager.panels.get('level-editor-events');
      
      if (!eventEditor || !panel) {
        return { success: false, error: 'EventEditor or panel not found' };
      }
      
      const events = window.EventManager.getInstance().getAllEvents();
      if (events.length === 0) {
        return { success: false, error: 'No events available' };
      }
      
      // Calculate drag button position
      const panelPos = panel.getPosition();
      const titleBarHeight = panel.calculateTitleBarHeight();
      const padding = panel.config.style.padding || 10;
      const contentX = panelPos.x + padding;
      const contentY = panelPos.y + titleBarHeight + padding;
      const contentWidth = panel.config.size.width - (padding * 2);
      
      const listY = contentY + 30;
      const dragBtnX = contentX + contentWidth - 55;
      const dragBtnY = listY + 5;
      
      // Click drag button
      const clickX = dragBtnX + 10;
      const clickY = dragBtnY + 10;
      
      eventEditor.handleClick(clickX, clickY, contentX, contentY);
      
      return {
        success: true,
        isDragging: eventEditor.isDragging(),
        eventId: eventEditor.getDragEventId(),
        clickPos: { x: clickX, y: clickY }
      };
    });
    
    if (!dragStart.success) {
      throw new Error(`Drag start failed: ${dragStart.error}`);
    }
    
    console.log(`✅ Drag started: ${dragStart.isDragging ? 'YES' : 'NO'}`);
    console.log(`   Event ID: ${dragStart.eventId}`);
    console.log(`   Click position: (${dragStart.clickPos.x}, ${dragStart.clickPos.y})\n`);
    
    await sleep(300);
    await saveScreenshot(page, 'levelEditor/drag_to_place_02_drag_started', dragStart.isDragging);
    
    // Step 5: Move mouse to terrain position
    console.log('Step 6: Moving mouse to terrain position...');
    const terrainX = 400;
    const terrainY = 300;
    
    await page.mouse.move(terrainX, terrainY);
    
    const dragMove = await page.evaluate((x, y) => {
      const eventEditor = window.levelEditor.eventEditor;
      
      if (eventEditor && eventEditor.isDragging()) {
        eventEditor.updateDragPosition(x, y);
      }
      
      if (typeof window.redraw === 'function') {
        window.redraw();
      }
      
      return {
        isDragging: eventEditor ? eventEditor.isDragging() : false,
        cursorPos: eventEditor ? eventEditor.dragState : null
      };
    }, terrainX, terrainY);
    
    console.log(`✅ Mouse moved to (${terrainX}, ${terrainY})`);
    console.log(`   Still dragging: ${dragMove.isDragging}\n`);
    
    await sleep(300);
    await saveScreenshot(page, 'levelEditor/drag_to_place_03_dragging_over_terrain', dragMove.isDragging);
    
    // Step 6: Release to place event
    console.log('Step 7: Releasing to place event...');
    const placement = await page.evaluate((screenX, screenY) => {
      const eventEditor = window.levelEditor.eventEditor;
      const levelEditor = window.levelEditor;
      
      if (!eventEditor || !eventEditor.isDragging()) {
        return { success: false, error: 'Not dragging' };
      }
      
      // Convert screen to world coordinates
      const worldCoords = levelEditor.convertScreenToWorld(screenX, screenY);
      
      // Complete the drag
      const result = eventEditor.completeDrag(worldCoords.worldX, worldCoords.worldY);
      
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
      }
      
      return {
        success: result.success,
        message: result.message || '',
        worldPos: { x: worldCoords.worldX, y: worldCoords.worldY },
        isDragging: eventEditor.isDragging()
      };
    }, terrainX, terrainY);
    
    console.log(`✅ Event placed: ${placement.success ? 'YES' : 'NO'}`);
    console.log(`   Message: ${placement.message}`);
    console.log(`   World position: (${Math.round(placement.worldPos?.x || 0)}, ${Math.round(placement.worldPos?.y || 0)})`);
    console.log(`   Drag ended: ${!placement.isDragging}\n`);
    
    await sleep(500);
    await saveScreenshot(page, 'levelEditor/drag_to_place_04_event_placed', placement.success);
    
    // Evaluate results
    console.log('=== TEST RESULTS ===\n');
    
    const test1 = dragStart.isDragging === true;
    const test2 = dragStart.eventId !== null;
    const test3 = dragMove.isDragging === true;
    const test4 = placement.success === true;
    const test5 = placement.isDragging === false;
    
    console.log(`Test 1 - Drag started: ${test1 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Test 2 - Event ID captured: ${test2 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Test 3 - Drag state maintained: ${test3 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Test 4 - Event placed successfully: ${test4 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Test 5 - Drag ended: ${test5 ? '✅ PASS' : '❌ FAIL'}`);
    
    const allPassed = test1 && test2 && test3 && test4 && test5;
    
    if (allPassed) {
      console.log('\n✅ ALL TESTS PASSED - Drag-to-place works correctly!');
    } else {
      console.log('\n❌ Some tests failed');
    }
    
    await browser.close();
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    if (browser) await browser.close();
    process.exit(1);
  }
})();
