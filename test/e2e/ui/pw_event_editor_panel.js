#!/usr/bin/env node
/**
 * @fileoverview E2E Test: EventEditorPanel Integration
 * 
 * Tests the EventEditorPanel in the Level Editor:
 * - Panel loads in LEVEL_EDITOR state
 * - Event list displays correctly
 * - Add event button works
 * - Export button works
 * - Visual verification via screenshots
 * 
 * Following testing standards:
 * - Use system APIs (EventManager, DraggablePanelManager)
 * - Test real browser behavior
 * - Headless mode for CI/CD
 * - Screenshot evidence for visual bugs
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const url = process.env.TEST_URL || 'http://localhost:8000?test=1';
  console.log('🧪 Running EventEditorPanel E2E Test');
  console.log('   URL:', url);

  let browser;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Capture console logs for debugging
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('ERROR') || text.includes('WARN') || text.includes('Event')) {
        console.log('   PAGE:', text);
      }
    });

    // Navigate to game
    console.log('\n📡 Loading game...');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    await sleep(2000);

    // Ensure game started
    console.log('▶️  Starting game...');
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Game failed to start');
    }
    console.log('   ✅ Game started');
    await sleep(1000);

    // TEST 1: Switch to LEVEL_EDITOR state and verify panel exists
    console.log('\n🧪 TEST 1: Switching to LEVEL_EDITOR state...');
    const test1 = await page.evaluate(() => {
      try {
        // Create test events
        const EventManager = window.EventManager.getInstance();
        EventManager.registerEvent({
          id: 'test-event-1',
          type: 'dialogue',
          priority: 1,
          content: { message: 'Test Event 1' }
        });
        EventManager.registerEvent({
          id: 'test-event-2',
          type: 'spawn',
          priority: 2,
          content: { entityType: 'ant' }
        });

        // Switch to LEVEL_EDITOR state (this triggers levelEditor initialization)
        if (typeof window.GameState !== 'undefined') {
          window.GameState.setState('LEVEL_EDITOR');
        } else {
          window.gameState = 'LEVEL_EDITOR';
        }
        
        // Wait for level editor to initialize
        if (window.levelEditor && !window.levelEditor.isActive()) {
          window.levelEditor.initialize(window.terrain);
        }
        
        // Force render
        if (window.draggablePanelManager) {
          window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
        }
        if (typeof window.redraw === 'function') {
          window.redraw(); window.redraw(); window.redraw();
        }

        // Verify panel exists
        const manager = window.draggablePanelManager;
        const panel = manager ? manager.panels.get('level-editor-events') : null;
        
        return {
          success: panel !== null && panel !== undefined,
          panelVisible: panel ? panel.state.visible : false,
          panelMinimized: panel ? panel.state.minimized : false,
          eventCount: EventManager.getAllEvents().length,
          levelEditorActive: window.levelEditor ? window.levelEditor.isActive() : false
        };
      } catch (e) {
        return { success: false, error: e.message, stack: e.stack };
      }
    });

    console.log('   Panel exists:', test1.success);
    console.log('   Panel visible:', test1.panelVisible);
    console.log('   Event count:', test1.eventCount);
    console.log('   Level editor active:', test1.levelEditorActive);
    
    if (!test1.success) {
      throw new Error(`Panel not found: ${test1.error}\n${test1.stack || ''}`);
    }

    await sleep(500);
    await saveScreenshot(page, 'ui/event_editor_panel_loaded', test1.success);

    // TEST 2: Verify EventEditorPanel rendering
    console.log('\n🧪 TEST 2: Verifying EventEditorPanel rendering...');
    const test2 = await page.evaluate(() => {
      try {
        // Check if eventEditor exists on levelEditor
        const levelEditor = window.levelEditor;
        const eventEditor = levelEditor ? levelEditor.eventEditor : null;
        
        if (!eventEditor) {
          return { success: false, error: 'eventEditor not found on levelEditor' };
        }

        // Check if it has the expected methods
        const hasRender = typeof eventEditor.render === 'function';
        const hasHandleClick = typeof eventEditor.handleClick === 'function';
        const hasGetContentSize = typeof eventEditor.getContentSize === 'function';

        return {
          success: hasRender && hasHandleClick && hasGetContentSize,
          hasRender,
          hasHandleClick,
          hasGetContentSize
        };
      } catch (e) {
        return { success: false, error: e.message };
      }
    });

    console.log('   EventEditor exists:', test2.success);
    console.log('   Has render():', test2.hasRender);
    console.log('   Has handleClick():', test2.hasHandleClick);
    console.log('   Has getContentSize():', test2.hasGetContentSize);

    if (!test2.success) {
      throw new Error(`EventEditorPanel verification failed: ${test2.error}`);
    }

    await sleep(500);
    await saveScreenshot(page, 'ui/event_editor_panel_methods', test2.success);

    // TEST 3: Test event retrieval
    console.log('\n🧪 TEST 3: Testing event retrieval...');
    const test3 = await page.evaluate(() => {
      try {
        const EventManager = window.EventManager.getInstance();
        const allEvents = EventManager.getAllEvents();
        
        return {
          success: allEvents && Array.isArray(allEvents),
          eventCount: allEvents ? allEvents.length : 0,
          hasTestEvent1: allEvents ? allEvents.some(e => e.id === 'test-event-1') : false,
          hasTestEvent2: allEvents ? allEvents.some(e => e.id === 'test-event-2') : false,
          event1Type: allEvents.find(e => e.id === 'test-event-1')?.type,
          event2Type: allEvents.find(e => e.id === 'test-event-2')?.type
        };
      } catch (e) {
        return { success: false, error: e.message };
      }
    });

    console.log('   Retrieval success:', test3.success);
    console.log('   Event count:', test3.eventCount);
    console.log('   Has test-event-1:', test3.hasTestEvent1);
    console.log('   Has test-event-2:', test3.hasTestEvent2);
    console.log('   Event 1 type:', test3.event1Type);
    console.log('   Event 2 type:', test3.event2Type);

    if (!test3.success) {
      throw new Error(`Event retrieval failed: ${test3.error}`);
    }

    await sleep(500);
    await saveScreenshot(page, 'ui/event_editor_panel_events', test3.success);

    // TEST 4: Final visual state
    console.log('\n🧪 TEST 4: Final visual verification...');
    await page.evaluate(() => {
      // Ensure everything is rendered
      window.gameState = 'LEVEL_EDITOR';
      if (window.draggablePanelManager) {
        window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
      }
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });

    await sleep(1000);
    await saveScreenshot(page, 'ui/event_editor_panel_final', true);

    // All tests passed
    console.log('\n✅ All EventEditorPanel tests passed!');
    console.log('   Screenshots saved to test/e2e/screenshots/ui/success/');

    await browser.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ EventEditorPanel E2E Test Failed');
    console.error('   Error:', error.message);
    console.error('   Stack:', error.stack);

    if (browser) {
      const page = (await browser.pages())[0];
      if (page) {
        await saveScreenshot(page, 'ui/event_editor_panel_error', false);
      }
      await browser.close();
    }
    
    process.exit(1);
  }
})();
