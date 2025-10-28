/**
 * E2E Test: Events Panel User Workflow - Click and Drag/Double-Click Placement
 * 
 * Tests the complete user workflow for placing events:
 * 1. Click Level Editor button from menu
 * 2. Click Events button in toolbar
 * 3. Verify Events panel appears
 * 4. Try to click and drag an event
 * 5. Try to double-click to enter placement mode
 * 
 * This test recreates the user's reported issue where clicking and dragging
 * or double-clicking doesn't work as expected.
 * 
 * TDD: This test should FAIL until the issue is fixed.
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  try {
    console.log('='.repeat(60));
    console.log('STEP 1: Navigate to game');
    console.log('='.repeat(60));
    await page.goto('http://localhost:8000?test=1');
    
    // Ensure game started (bypass main menu)
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Failed to start game - still on menu');
    }
    
    console.log('✅ Game started successfully\n');
    await sleep(500);
    
    console.log('='.repeat(60));
    console.log('STEP 2: Enter Level Editor');
    console.log('='.repeat(60));
    
    // Enter Level Editor directly (menu already bypassed by ensureGameStarted)
    await page.evaluate(() => {
      if (window.GameState && typeof window.GameState.setState === 'function') {
        window.GameState.setState('LEVEL_EDITOR');
      }
    });
    
    console.log('✅ Entered Level Editor state');
    await sleep(1000); // Wait for Level Editor to initialize
    
    // Verify Level Editor is active
    const levelEditorActive = await page.evaluate(() => {
      return {
        isActive: window.GameState && window.GameState.getState() === 'LEVEL_EDITOR',
        levelEditorExists: typeof window.levelEditor !== 'undefined',
        currentState: window.GameState ? window.GameState.getState() : 'unknown'
      };
    });
    
    if (!levelEditorActive.isActive) {
      console.error('❌ Level Editor not active. Current state:', levelEditorActive.currentState);
      await saveScreenshot(page, 'ui/events_workflow_02_level_editor_not_active', false);
      throw new Error('Level Editor did not activate');
    }
    
    console.log('✅ Level Editor is active\n');
    await saveScreenshot(page, 'ui/events_workflow_02_level_editor_active', true);
    
    console.log('='.repeat(60));
    console.log('STEP 3: Click Events button in toolbar');
    console.log('='.repeat(60));
    
    // Find and click Events button in toolbar
    const eventsButtonClicked = await page.evaluate(() => {
      if (!window.levelEditor) {
        return { success: false, error: 'LevelEditor not found' };
      }
      
      if (!window.levelEditor.toolbar) {
        return { success: false, error: 'Toolbar not found in LevelEditor' };
      }
      
      const toolbar = window.levelEditor.toolbar;
      
      // Check if Events button exists in toolbar
      const eventsToolInfo = toolbar.getToolInfo('events');
      
      if (!eventsToolInfo) {
        return { 
          success: false, 
          error: 'Events button not found in toolbar',
          availableTools: toolbar.getAllTools()
        };
      }
      
      // Events button has custom onClick handler, invoke it directly
      if (eventsToolInfo.onClick && typeof eventsToolInfo.onClick === 'function') {
        eventsToolInfo.onClick();
        return {
          success: true,
          buttonName: eventsToolInfo.name,
          tooltip: eventsToolInfo.tooltip
        };
      } else {
        return { 
          success: false, 
          error: 'Events button has no onClick method',
          toolInfo: {
            name: eventsToolInfo.name,
            hasOnClick: !!eventsToolInfo.onClick,
            properties: Object.keys(eventsToolInfo)
          }
        };
      }
    });
    
    if (!eventsButtonClicked.success) {
      console.error('❌ Failed to click Events button:', eventsButtonClicked.error);
      if (eventsButtonClicked.availableTools) {
        console.log('Available tools in toolbar:', eventsButtonClicked.availableTools);
      }
      if (eventsButtonClicked.toolInfo) {
        console.log('Tool info:', JSON.stringify(eventsButtonClicked.toolInfo, null, 2));
      }
      await saveScreenshot(page, 'ui/events_workflow_03_events_button_error', false);
      throw new Error(eventsButtonClicked.error);
    }
    
    console.log(`✅ Clicked Events button: "${eventsButtonClicked.buttonName}"`);
    await sleep(500);
    
    // Force render to update UI
    await page.evaluate(() => {
      if (window.draggablePanelManager) {
        window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
      }
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    await sleep(500);
    
    // Verify Events panel is visible
    const eventsPanelVisible = await page.evaluate(() => {
      if (!window.levelEditor || !window.levelEditor.levelEditorPanels) {
        return { visible: false, error: 'LevelEditor or panels not found' };
      }
      
      const panels = window.levelEditor.levelEditorPanels;
      const eventsPanel = panels.panels ? panels.panels.events : null;
      
      if (!eventsPanel) {
        return { visible: false, error: 'Events panel not found in panels object' };
      }
      
      return {
        visible: eventsPanel.state?.visible || eventsPanel.visible || false,
        position: eventsPanel.state?.position || { x: 0, y: 0 },
        hasDraggablePanel: !!eventsPanel
      };
    });
    
    if (!eventsPanelVisible.visible) {
      console.error('❌ Events panel not visible:', eventsPanelVisible.error);
      await saveScreenshot(page, 'ui/events_workflow_04_events_panel_not_visible', false);
      throw new Error('Events panel did not become visible');
    }
    
    console.log(`✅ Events panel is visible at (${eventsPanelVisible.position.x}, ${eventsPanelVisible.position.y})\n`);
    await saveScreenshot(page, 'ui/events_workflow_04_events_panel_visible', true);
    
    console.log('='.repeat(60));
    console.log('STEP 4: Test CLICK AND DRAG functionality');
    console.log('='.repeat(60));
    
    // Get first event's drag button position
    const dragButtonInfo = await page.evaluate(() => {
      if (!window.levelEditor || !window.levelEditor.eventEditor) {
        return { success: false, error: 'EventEditor not found' };
      }
      
      const eventEditor = window.levelEditor.eventEditor;
      const eventManager = eventEditor.eventManager;
      
      if (!eventManager) {
        return { success: false, error: 'EventManager not found' };
      }
      
      const events = eventManager.getAllEvents();
      if (!events || events.length === 0) {
        return { success: false, error: 'No events available to drag' };
      }
      
      // Get Events panel position
      const panels = window.levelEditor.levelEditorPanels;
      const eventsPanel = panels.panels.events;
      
      if (!eventsPanel || !eventsPanel.state) {
        return { success: false, error: 'Events panel state not found' };
      }
      
      const panelX = eventsPanel.state.position.x;
      const panelY = eventsPanel.state.position.y;
      
      // First event's drag button is approximately at:
      // - X: panel right edge - 55px (drag button column)
      // - Y: panel top + 80px (below header + first row)
      const dragBtnX = panelX + eventsPanel.config.size.width - 55;
      const dragBtnY = panelY + 80;
      
      return {
        success: true,
        eventId: events[0].id,
        dragButtonX: dragBtnX,
        dragButtonY: dragBtnY,
        panelX: panelX,
        panelY: panelY
      };
    });
    
    if (!dragButtonInfo.success) {
      console.error('❌ Cannot get drag button info:', dragButtonInfo.error);
      await saveScreenshot(page, 'ui/events_workflow_05_drag_button_error', false);
      throw new Error(dragButtonInfo.error);
    }
    
    console.log(`Event to drag: ${dragButtonInfo.eventId}`);
    console.log(`Drag button at: (${dragButtonInfo.dragButtonX}, ${dragButtonInfo.dragButtonY})`);
    
    // Attempt to click and drag
    console.log('Attempting click and drag...');
    await page.mouse.move(dragButtonInfo.dragButtonX, dragButtonInfo.dragButtonY);
    await sleep(200);
    await page.mouse.down();
    await sleep(100);
    
    // Drag to center of screen
    const dragToX = 640;
    const dragToY = 360;
    await page.mouse.move(dragToX, dragToY, { steps: 10 });
    await sleep(200);
    
    // Check if dragging state is active
    const isDragging = await page.evaluate(() => {
      if (!window.levelEditor || !window.levelEditor.eventEditor) {
        return { dragging: false, error: 'EventEditor not found' };
      }
      
      const eventEditor = window.levelEditor.eventEditor;
      return {
        dragging: eventEditor.isDragging ? eventEditor.isDragging() : false,
        dragState: eventEditor.dragState || null
      };
    });
    
    console.log(`Is dragging: ${isDragging.dragging}`);
    if (isDragging.dragState) {
      console.log('Drag state:', JSON.stringify(isDragging.dragState, null, 2));
    }
    
    await saveScreenshot(page, 'ui/events_workflow_05_during_drag', true);
    
    // Release mouse
    await page.mouse.up();
    await sleep(300);
    
    if (!isDragging.dragging) {
      console.error('❌ FAILURE: Click and drag did NOT activate drag mode');
      console.error('   This reproduces the user\'s reported issue!');
      await saveScreenshot(page, 'ui/events_workflow_06_drag_failed', false);
    } else {
      console.log('✅ Click and drag activated drag mode');
      await saveScreenshot(page, 'ui/events_workflow_06_drag_success', true);
    }
    
    console.log('');
    
    console.log('='.repeat(60));
    console.log('STEP 5: Test DOUBLE-CLICK PLACEMENT functionality');
    console.log('='.repeat(60));
    
    // Wait a bit before next test
    await sleep(500);
    
    // Attempt to double-click drag button
    console.log('Attempting double-click on drag button...');
    await page.mouse.move(dragButtonInfo.dragButtonX, dragButtonInfo.dragButtonY);
    await sleep(100);
    await page.mouse.click(dragButtonInfo.dragButtonX, dragButtonInfo.dragButtonY, { clickCount: 2 });
    await sleep(300);
    
    // Check if placement mode is active
    const isInPlacementMode = await page.evaluate(() => {
      if (!window.levelEditor || !window.levelEditor.eventEditor) {
        return { placementMode: false, error: 'EventEditor not found' };
      }
      
      const eventEditor = window.levelEditor.eventEditor;
      return {
        placementMode: eventEditor.isInPlacementMode ? eventEditor.isInPlacementMode() : false,
        placementState: eventEditor.placementMode || null
      };
    });
    
    console.log(`Is in placement mode: ${isInPlacementMode.placementMode}`);
    if (isInPlacementMode.placementState) {
      console.log('Placement state:', JSON.stringify(isInPlacementMode.placementState, null, 2));
    }
    
    await saveScreenshot(page, 'ui/events_workflow_07_after_double_click', true);
    
    if (!isInPlacementMode.placementMode) {
      console.error('❌ FAILURE: Double-click did NOT activate placement mode');
      console.error('   This reproduces the user\'s reported issue!');
      await saveScreenshot(page, 'ui/events_workflow_08_placement_failed', false);
    } else {
      console.log('✅ Double-click activated placement mode');
      await saveScreenshot(page, 'ui/events_workflow_08_placement_success', true);
    }
    
    console.log('');
    console.log('='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Level Editor opened: YES`);
    console.log(`✅ Events button clicked: YES`);
    console.log(`✅ Events panel visible: YES`);
    console.log(`${isDragging.dragging ? '✅' : '❌'} Click and drag working: ${isDragging.dragging ? 'YES' : 'NO'}`);
    console.log(`${isInPlacementMode.placementMode ? '✅' : '❌'} Double-click placement working: ${isInPlacementMode.placementMode ? 'YES' : 'NO'}`);
    
    const allPassed = isDragging.dragging && isInPlacementMode.placementMode;
    
    if (!allPassed) {
      console.log('');
      console.log('⚠️  TEST CAPTURED USER\'S ISSUE - EXPECTED TO FAIL');
      console.log('This test successfully reproduces the reported problem.');
      console.log('');
      await browser.close();
      process.exit(1); // Exit with failure to indicate test found the issue
    } else {
      console.log('');
      console.log('✅ All functionality working!');
      console.log('');
      await browser.close();
      process.exit(0);
    }
    
  } catch (error) {
    console.error('');
    console.error('❌ Test error:', error.message);
    await saveScreenshot(page, 'ui/events_workflow_error', false);
    await browser.close();
    process.exit(1);
  }
})();
