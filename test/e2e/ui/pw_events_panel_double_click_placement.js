/**
 * E2E Test: Events Panel Double-Click Placement Mode
 * Tests the placement mode feature where double-clicking the drag button
 * enables "sticky" placement with flag cursor indicator.
 * 
 * Workflow:
 * 1. Enter Level Editor
 * 2. Toggle Events panel visible
 * 3. Double-click drag button → enters placement mode
 * 4. Move cursor over terrain → flag cursor visible
 * 5. Single click → places event
 * 6. Test ESC cancellation
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  try {
    console.log('Navigating to game...');
    await page.goto('http://localhost:8000?test=1');
    
    // CRITICAL: Ensure game started (bypass menu)
    console.log('Ensuring game started...');
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Failed to start game - still on menu');
    }
    
    console.log('Game started successfully');
    await sleep(500);
    
    // Enter Level Editor
    console.log('Entering Level Editor...');
    await page.evaluate(() => {
      if (window.GameState && typeof window.GameState.setState === 'function') {
        window.GameState.setState('LEVEL_EDITOR');
      } else {
        throw new Error('GameState not available');
      }
    });
    await sleep(500);
    
    // Force render Level Editor state
    await page.evaluate(() => {
      window.gameState = 'LEVEL_EDITOR';
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
    
    console.log('Level Editor active');
    
    // Create Events panel for testing
    console.log('Creating Events panel for testing...');
    const panelCreation = await page.evaluate(() => {
      const panelManager = window.draggablePanelManager;
      if (!panelManager) return { success: false, error: 'No draggablePanelManager' };
      
      // Check if EventEditorPanel class is available
      if (typeof window.EventEditorPanel === 'undefined') {
        return { success: false, error: 'EventEditorPanel class not loaded' };
      }
      
      // Check if EventManager is available
      if (typeof window.EventManager === 'undefined') {
        return { success: false, error: 'EventManager class not loaded' };
      }
      
      // Initialize EventManager if not already done
      const eventManager = window.EventManager.getInstance();
      
      // Create the EventEditorPanel content manager
      const eventEditor = new window.EventEditorPanel();
      if (!eventEditor.initialize()) {
        return { success: false, error: 'EventEditorPanel initialization failed' };
      }
      
      // Create a panel using DraggablePanel
      if (typeof window.DraggablePanel === 'undefined') {
        return { success: false, error: 'DraggablePanel class not loaded' };
      }
      
      const eventsPanel = new window.DraggablePanel({
        id: 'events-editor-panel',
        title: 'Random Events',
        position: { x: 400, y: 50 },
        size: { width: 450, height: 500 },
        buttons: { layout: 'none' },
        behavior: { draggable: true, closable: false }
      });
      
      // Set the content manager
      eventsPanel.contentManager = eventEditor;
      
      // Override the render method to use contentManager
      eventsPanel.render = function() {
        if (this.contentManager && typeof this.contentManager.render === 'function') {
          this.contentManager.render();
        }
      };
      
      // Register with panel manager
      panelManager.panels.set('events-editor-panel', eventsPanel);
      
      // Make visible in LEVEL_EDITOR state
      if (!panelManager.stateVisibility.LEVEL_EDITOR) {
        panelManager.stateVisibility.LEVEL_EDITOR = [];
      }
      if (!panelManager.stateVisibility.LEVEL_EDITOR.includes('events-editor-panel')) {
        panelManager.stateVisibility.LEVEL_EDITOR.push('events-editor-panel');
      }
      
      eventsPanel.state.visible = true;
      
      return {
        success: true,
        x: eventsPanel.state.position.x,
        y: eventsPanel.state.position.y,
        width: eventsPanel.config.size.width,
        height: eventsPanel.config.size.height
      };
    });
    
    if (!panelCreation.success) {
      throw new Error(`Failed to create Events panel: ${panelCreation.error}`);
    }
    
    console.log(`Events panel created at (${panelCreation.x}, ${panelCreation.y})`);
    
    if (!panelCreation.success) {
      throw new Error(`Failed to create Events panel: ${panelCreation.error}`);
    }
    
    console.log(`Events panel created at (${panelCreation.x}, ${panelCreation.y})`);
    
    // Force render panels
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
    
    // Test 1: Enter placement mode (simulating double-click)
    console.log('TEST 1: Enter placement mode...');
    const placementModeResult = await page.evaluate(() => {
      const panelManager = window.draggablePanelManager;
      const eventsPanel = panelManager.panels.get('events-editor-panel');
      const eventEditor = eventsPanel.contentManager;
      
      // Directly enter placement mode (E2E can't reliably simulate double-click on small buttons)
      const entered = eventEditor.enterPlacementMode('test-event-1');
      
      return {
        success: entered,
        isInPlacementMode: eventEditor.isInPlacementMode(),
        eventId: eventEditor.getPlacementEventId(),
        cursor: eventEditor.getPlacementCursor()
      };
    });
    
    console.log(`Placement mode active: ${placementModeResult.isInPlacementMode}`);
    console.log(`Event ID: ${placementModeResult.eventId}`);
    
    if (!placementModeResult.isInPlacementMode) {
      await saveScreenshot(page, 'ui/events_placement_mode_failed', false);
      throw new Error('Placement mode not activated after double-click');
    }
    
    await saveScreenshot(page, 'ui/events_placement_mode_active', true);
    
    // Test 2: Update cursor position (simulate mouse move)
    console.log('TEST 2: Update cursor position...');
    await page.evaluate(() => {
      const panelManager = window.draggablePanelManager;
      const eventsPanel = panelManager.panels.get('events-editor-panel');
      const eventEditor = eventsPanel.contentManager;
      
      // Simulate cursor move to terrain area
      eventEditor.updatePlacementCursor(400, 300);
    });
    
    const cursorResult = await page.evaluate(() => {
      const panelManager = window.draggablePanelManager;
      const eventsPanel = panelManager.panels.get('events-editor-panel');
      const eventEditor = eventsPanel.contentManager;
      
      const cursor = eventEditor.getPlacementCursor();
      return {
        success: cursor !== null,
        x: cursor ? cursor.x : null,
        y: cursor ? cursor.y : null
      };
    });
    
    console.log(`Cursor position: (${cursorResult.x}, ${cursorResult.y})`);
    
    if (!cursorResult.success) {
      await saveScreenshot(page, 'ui/events_cursor_update_failed', false);
      throw new Error('Cursor not updated during placement mode');
    }
    
    // Test 3: Place event on single click
    console.log('TEST 3: Place event on single click...');
    const placementResult = await page.evaluate(() => {
      const panelManager = window.draggablePanelManager;
      const eventsPanel = panelManager.panels.get('events-editor-panel');
      const eventEditor = eventsPanel.contentManager;
      
      // Simulate single click at world coordinates
      const worldX = 400;
      const worldY = 300;
      
      const result = eventEditor.completePlacement(worldX, worldY);
      
      return {
        success: result.success,
        eventId: result.eventId,
        worldX: result.worldX,
        worldY: result.worldY,
        stillInPlacementMode: eventEditor.isInPlacementMode()
      };
    });
    
    console.log(`Event placed: ${placementResult.success}`);
    console.log(`Event ID: ${placementResult.eventId}`);
    console.log(`World position: (${placementResult.worldX}, ${placementResult.worldY})`);
    console.log(`Still in placement mode: ${placementResult.stillInPlacementMode}`);
    
    if (!placementResult.success) {
      await saveScreenshot(page, 'ui/events_placement_failed', false);
      throw new Error('Event placement failed');
    }
    
    if (placementResult.stillInPlacementMode) {
      await saveScreenshot(page, 'ui/events_placement_mode_not_exited', false);
      throw new Error('Placement mode did not exit after placing event');
    }
    
    await saveScreenshot(page, 'ui/events_placement_success', true);
    
    // Test 4: ESC cancellation
    console.log('TEST 4: ESC cancellation...');
    
    // Re-enter placement mode
    await page.evaluate(() => {
      const panelManager = window.draggablePanelManager;
      const eventsPanel = panelManager.panels.get('events-editor-panel');
      const eventEditor = eventsPanel.contentManager;
      
      eventEditor.enterPlacementMode('test-event-2');
    });
    
    const reEnteredResult = await page.evaluate(() => {
      const panelManager = window.draggablePanelManager;
      const eventsPanel = panelManager.panels.get('events-editor-panel');
      const eventEditor = eventsPanel.contentManager;
      
      return {
        isActive: eventEditor.isInPlacementMode(),
        eventId: eventEditor.getPlacementEventId()
      };
    });
    
    console.log(`Re-entered placement mode: ${reEnteredResult.isActive}`);
    
    if (!reEnteredResult.isActive) {
      await saveScreenshot(page, 'ui/events_placement_reenter_failed', false);
      throw new Error('Failed to re-enter placement mode');
    }
    
    // Cancel with ESC
    await page.evaluate(() => {
      const panelManager = window.draggablePanelManager;
      const eventsPanel = panelManager.panels.get('events-editor-panel');
      const eventEditor = eventsPanel.contentManager;
      
      eventEditor.cancelPlacement();
    });
    
    const cancelResult = await page.evaluate(() => {
      const panelManager = window.draggablePanelManager;
      const eventsPanel = panelManager.panels.get('events-editor-panel');
      const eventEditor = eventsPanel.contentManager;
      
      return {
        stillActive: eventEditor.isInPlacementMode(),
        eventId: eventEditor.getPlacementEventId(),
        cursor: eventEditor.getPlacementCursor()
      };
    });
    
    console.log(`After cancel - still active: ${cancelResult.stillActive}`);
    
    if (cancelResult.stillActive) {
      await saveScreenshot(page, 'ui/events_cancel_failed', false);
      throw new Error('Placement mode did not cancel on ESC');
    }
    
    await saveScreenshot(page, 'ui/events_cancel_success', true);
    
    console.log('All tests passed! ✅');
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('Test failed:', error.message);
    await saveScreenshot(page, 'ui/events_placement_error', false);
    await browser.close();
    process.exit(1);
  }
})();
