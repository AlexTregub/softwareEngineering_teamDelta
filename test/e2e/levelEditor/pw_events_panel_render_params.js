/**
 * E2E Test: EventEditorPanel Render Parameters Bug
 * 
 * Tests that EventEditorPanel receives correct width/height parameters
 * for proper layout and drag-to-place functionality.
 * 
 * CRITICAL BUG: LevelEditorPanels.render() only passes (x, y) to eventEditor.render()
 * but EventEditorPanel.render() expects (x, y, width, height).
 * 
 * Test Flow:
 * 1. Enter Level Editor
 * 2. Toggle Events panel ON
 * 3. Inspect rendered drag buttons
 * 4. Verify drag button positions are valid numbers (not NaN)
 * 5. Test click detection on drag button
 * 6. Attempt to drag an event to the map
 * 
 * Expected Failure: Drag buttons render at NaN positions, clicks don't register
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  let browser;
  
  try {
    console.log('=== EventEditorPanel Render Parameters Bug Test ===\n');
    
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
    
    await sleep(1000); // Wait for Level Editor to fully initialize
    console.log('✅ Entered Level Editor mode\n');
    
    // Step 3: Toggle Events panel ON
    console.log('Step 4: Toggling Events panel...');
    const toggleResult = await page.evaluate(() => {
      if (!window.levelEditor || !window.levelEditor.levelEditorPanels) {
        return { success: false, error: 'Level Editor not found' };
      }
      
      window.levelEditor.levelEditorPanels.toggleEventsPanel();
      
      const panel = window.draggablePanelManager.panels.get('level-editor-events');
      
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      return {
        success: true,
        visible: panel ? panel.isVisible() : false,
        position: panel ? panel.getPosition() : null
      };
    });
    
    if (!toggleResult.success) {
      throw new Error(`Toggle failed: ${toggleResult.error}`);
    }
    
    console.log(`✅ Events panel toggled: visible=${toggleResult.visible}`);
    console.log(`   Position: x=${toggleResult.position.x}, y=${toggleResult.position.y}\n`);
    
    await sleep(500);
    await saveScreenshot(page, 'levelEditor/events_panel_render_bug_01_panel_visible', toggleResult.visible);
    
    // Step 4: Inspect how eventEditor.render() is being called
    console.log('Step 5: Inspecting render call parameters...');
    const renderInspection = await page.evaluate(() => {
      const levelEditor = window.levelEditor;
      const eventEditor = levelEditor.eventEditor;
      const panel = window.draggablePanelManager.panels.get('level-editor-events');
      
      if (!eventEditor || !panel) {
        return { success: false, error: 'EventEditor or panel not found' };
      }
      
      // Get panel content area (what SHOULD be passed to render)
      const panelPos = panel.getPosition();
      const titleBarHeight = panel.calculateTitleBarHeight();
      const padding = panel.config.style.padding || 10;
      
      const contentArea = {
        x: panelPos.x + padding,
        y: panelPos.y + titleBarHeight + padding,
        width: panel.config.size.width - (padding * 2),
        height: panel.config.size.height - titleBarHeight - (padding * 2)
      };
      
      // Get expected content size from EventEditor
      const expectedSize = eventEditor.getContentSize();
      
      // Spy on the render call by wrapping it
      let renderCallArgs = null;
      const originalRender = eventEditor.render.bind(eventEditor);
      
      eventEditor.render = function(x, y, width, height) {
        renderCallArgs = { x, y, width, height };
        return originalRender(x, y, width, height);
      };
      
      // Force a re-render
      if (levelEditor.levelEditorPanels) {
        levelEditor.levelEditorPanels.render();
      }
      
      if (typeof window.redraw === 'function') {
        window.redraw();
      }
      
      return {
        success: true,
        contentArea: contentArea,
        expectedSize: expectedSize,
        renderCallArgs: renderCallArgs
      };
    });
    
    if (!renderInspection.success) {
      throw new Error(`Render inspection failed: ${renderInspection.error}`);
    }
    
    console.log('Content Area (what SHOULD be passed):');
    console.log(`   x: ${renderInspection.contentArea.x}`);
    console.log(`   y: ${renderInspection.contentArea.y}`);
    console.log(`   width: ${renderInspection.contentArea.width}`);
    console.log(`   height: ${renderInspection.contentArea.height}`);
    
    console.log('\nRender Call Arguments (what WAS passed):');
    console.log(`   x: ${renderInspection.renderCallArgs?.x ?? 'NOT CALLED'}`);
    console.log(`   y: ${renderInspection.renderCallArgs?.y ?? 'NOT CALLED'}`);
    console.log(`   width: ${renderInspection.renderCallArgs?.width ?? 'MISSING ❌'}`);
    console.log(`   height: ${renderInspection.renderCallArgs?.height ?? 'MISSING ❌'}\n`);
    
    // Step 5: Test drag button rendering
    console.log('Step 6: Testing drag button rendering...');
    const dragButtonTest = await page.evaluate(() => {
      const eventEditor = window.levelEditor.eventEditor;
      const panel = window.draggablePanelManager.panels.get('level-editor-events');
      
      if (!eventEditor || !panel) {
        return { success: false, error: 'EventEditor or panel not found' };
      }
      
      // Get all events
      const events = window.EventManager.getInstance().getAllEvents();
      
      // Calculate where drag buttons SHOULD be rendered
      const panelPos = panel.getPosition();
      const titleBarHeight = panel.calculateTitleBarHeight();
      const padding = panel.config.style.padding || 10;
      const contentX = panelPos.x + padding;
      const contentY = panelPos.y + titleBarHeight + padding;
      const contentWidth = panel.config.size.width - (padding * 2);
      
      // Drag button position from EventEditorPanel code:
      // const dragBtnX = x + width - 55;
      // If width is undefined: dragBtnX = x + undefined - 55 = NaN
      
      const expectedDragBtnX = contentX + contentWidth - 55;
      
      return {
        success: true,
        eventsCount: events.length,
        contentX: contentX,
        contentWidth: contentWidth,
        expectedDragBtnX: expectedDragBtnX,
        isValidPosition: !isNaN(expectedDragBtnX) && isFinite(expectedDragBtnX)
      };
    });
    
    console.log(`Events count: ${dragButtonTest.eventsCount}`);
    console.log(`Content X: ${dragButtonTest.contentX}`);
    console.log(`Content Width: ${dragButtonTest.contentWidth}`);
    console.log(`Expected Drag Button X: ${dragButtonTest.expectedDragBtnX}`);
    console.log(`Valid Position: ${dragButtonTest.isValidPosition ? '✅' : '❌ (NaN or Infinity)'}\n`);
    
    // Step 6: Test click detection on drag button
    console.log('Step 7: Testing drag button click detection...');
    const clickTest = await page.evaluate(() => {
      const eventEditor = window.levelEditor.eventEditor;
      const panel = window.draggablePanelManager.panels.get('level-editor-events');
      
      if (!eventEditor || !panel) {
        return { success: false, error: 'EventEditor or panel not found' };
      }
      
      const events = window.EventManager.getInstance().getAllEvents();
      if (events.length === 0) {
        return { success: false, error: 'No events to test' };
      }
      
      // Calculate drag button position for first event
      const panelPos = panel.getPosition();
      const titleBarHeight = panel.calculateTitleBarHeight();
      const padding = panel.config.style.padding || 10;
      const contentX = panelPos.x + padding;
      const contentY = panelPos.y + titleBarHeight + padding;
      const contentWidth = panel.config.size.width - (padding * 2);
      
      const listY = contentY + 30; // Header height
      const dragBtnX = contentX + contentWidth - 55;
      const dragBtnY = listY + 5; // First item
      const dragBtnSize = 20;
      
      // Click in the center of the drag button
      const clickX = dragBtnX + dragBtnSize / 2;
      const clickY = dragBtnY + dragBtnSize / 2;
      
      // Test if EventEditor can handle the click
      const wasHandled = eventEditor.handleClick(clickX, clickY, contentX, contentY);
      const isDragging = eventEditor.isDragging();
      
      return {
        success: true,
        clickPosition: { x: clickX, y: clickY },
        dragButtonBounds: {
          x: dragBtnX,
          y: dragBtnY,
          width: dragBtnSize,
          height: dragBtnSize
        },
        clickHandled: wasHandled,
        isDragging: isDragging,
        clickValid: !isNaN(clickX) && !isNaN(clickY)
      };
    });
    
    console.log(`Click Position: x=${clickTest.clickPosition?.x}, y=${clickTest.clickPosition?.y}`);
    console.log(`Click Valid: ${clickTest.clickValid ? '✅' : '❌'}`);
    console.log(`Click Handled: ${clickTest.clickHandled ? '✅' : '❌'}`);
    console.log(`Is Dragging: ${clickTest.isDragging ? '✅' : '❌'}\n`);
    
    await sleep(500);
    await saveScreenshot(page, 'levelEditor/events_panel_render_bug_02_after_click', clickTest.isDragging);
    
    // Evaluate results
    console.log('=== TEST RESULTS ===\n');
    
    const test1 = renderInspection.renderCallArgs !== null;
    const test2 = renderInspection.renderCallArgs?.width !== undefined;
    const test3 = renderInspection.renderCallArgs?.height !== undefined;
    const test4 = dragButtonTest.isValidPosition === true;
    const test5 = clickTest.clickValid === true;
    const test6 = clickTest.clickHandled === true;
    const test7 = clickTest.isDragging === true;
    
    console.log(`Test 1 - Render called: ${test1 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Test 2 - Width parameter passed: ${test2 ? '✅ PASS' : '❌ FAIL (BUG!)'}`);
    console.log(`Test 3 - Height parameter passed: ${test3 ? '✅ PASS' : '❌ FAIL (BUG!)'}`);
    console.log(`Test 4 - Drag button position valid: ${test4 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Test 5 - Click position valid: ${test5 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Test 6 - Click handled by EventEditor: ${test6 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Test 7 - Drag started: ${test7 ? '✅ PASS' : '❌ FAIL (BUG!)'}\\n`);
    
    const criticalTests = test2 && test3 && test7; // Width, height, and drag functionality
    
    if (!criticalTests) {
      console.log('❌ CRITICAL BUG DETECTED:');
      if (!test2 || !test3) {
        console.log('   - EventEditorPanel.render() not receiving width/height parameters');
      }
      if (!test7) {
        console.log('   - Drag-to-place functionality broken');
      }
      console.log('\\n   ROOT CAUSE: LevelEditorPanels.render() only passes (x, y)');
      console.log('   FIX NEEDED: Pass (contentArea.x, contentArea.y, contentArea.width, contentArea.height)');
    } else {
      console.log('✅ ALL TESTS PASSED - Bug is fixed!');
    }
    
    await browser.close();
    process.exit(criticalTests ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    if (browser) await browser.close();
    process.exit(1);
  }
})();
