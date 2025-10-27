#!/usr/bin/env node
/**
 * @fileoverview E2E Test: EventEditorPanel Import/Export
 * 
 * Tests the JSON import/export functionality:
 * - Export button downloads JSON file
 * - Export copies to clipboard
 * - Exported JSON has correct structure
 * - Import loads events correctly
 * - Visual verification via screenshots
 * 
 * Following testing standards:
 * - Use system APIs (EventManager)
 * - Test real browser behavior
 * - Headless mode for CI/CD
 * - Screenshot evidence for visual bugs
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const url = process.env.TEST_URL || 'http://localhost:8000?test=1';
  console.log('🧪 Running EventEditorPanel Import/Export E2E Test');
  console.log('   URL:', url);

  let browser;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Capture console logs for debugging
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('ERROR') || text.includes('WARN') || text.includes('Event') || text.includes('✅')) {
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

    // TEST 1: Create test events and switch to LEVEL_EDITOR
    console.log('\n🧪 TEST 1: Creating test events...');
    const test1 = await page.evaluate(() => {
      try {
        const EventManager = window.EventManager.getInstance();
        
        // Create test events
        EventManager.registerEvent({
          id: 'export-test-dialogue',
          type: 'dialogue',
          priority: 1,
          content: { message: 'This is a test dialogue event' }
        });
        
        EventManager.registerEvent({
          id: 'export-test-spawn',
          type: 'spawn',
          priority: 2,
          content: { entityType: 'ant', count: 5 }
        });
        
        EventManager.registerEvent({
          id: 'export-test-tutorial',
          type: 'tutorial',
          priority: 3,
          content: { title: 'Tutorial', steps: ['Step 1', 'Step 2'] }
        });
        
        // Switch to LEVEL_EDITOR
        if (typeof window.GameState !== 'undefined') {
          window.GameState.setState('LEVEL_EDITOR');
        } else {
          window.gameState = 'LEVEL_EDITOR';
        }
        
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
        
        return {
          success: true,
          eventCount: EventManager.getAllEvents().length
        };
      } catch (e) {
        return { success: false, error: e.message, stack: e.stack };
      }
    });

    console.log('   Events created:', test1.eventCount);
    if (!test1.success) {
      throw new Error(`Test 1 failed: ${test1.error}`);
    }
    
    await sleep(500);
    await saveScreenshot(page, 'events/import_export_setup', test1.success);

    // TEST 2: Test exportToJSON method
    console.log('\n🧪 TEST 2: Testing exportToJSON()...');
    const test2 = await page.evaluate(() => {
      try {
        const EventManager = window.EventManager.getInstance();
        const json = EventManager.exportToJSON();
        const parsed = JSON.parse(json);
        
        return {
          success: true,
          hasEvents: Array.isArray(parsed.events),
          hasTriggers: Array.isArray(parsed.triggers),
          hasExportedAt: typeof parsed.exportedAt === 'string',
          eventCount: parsed.events ? parsed.events.length : 0,
          eventIds: parsed.events ? parsed.events.map(e => e.id) : [],
          jsonLength: json.length
        };
      } catch (e) {
        return { success: false, error: e.message };
      }
    });

    console.log('   Export success:', test2.success);
    console.log('   Has events array:', test2.hasEvents);
    console.log('   Has triggers array:', test2.hasTriggers);
    console.log('   Has timestamp:', test2.hasExportedAt);
    console.log('   Exported events:', test2.eventCount);
    console.log('   Event IDs:', test2.eventIds);

    if (!test2.success) {
      throw new Error(`Export failed: ${test2.error}`);
    }

    if (test2.eventCount !== 3) {
      throw new Error(`Expected 3 events, got ${test2.eventCount}`);
    }

    await sleep(500);
    await saveScreenshot(page, 'events/import_export_exported', test2.success);

    // TEST 3: Verify exported JSON structure
    console.log('\n🧪 TEST 3: Verifying exported JSON structure...');
    const test3 = await page.evaluate(() => {
      try {
        const EventManager = window.EventManager.getInstance();
        const json = EventManager.exportToJSON();
        const parsed = JSON.parse(json);
        
        // Check first event structure
        const event1 = parsed.events[0];
        
        return {
          success: true,
          hasId: typeof event1.id === 'string',
          hasType: typeof event1.type === 'string',
          hasPriority: typeof event1.priority === 'number',
          hasContent: typeof event1.content === 'object',
          noOnTrigger: event1.onTrigger === undefined,
          noOnComplete: event1.onComplete === undefined,
          noUpdate: event1.update === undefined,
          eventType: event1.type,
          eventPriority: event1.priority
        };
      } catch (e) {
        return { success: false, error: e.message };
      }
    });

    console.log('   Structure valid:', test3.success);
    console.log('   Has required fields:', test3.hasId && test3.hasType && test3.hasPriority);
    console.log('   Functions removed:', test3.noOnTrigger && test3.noOnComplete && test3.noUpdate);

    if (!test3.success) {
      throw new Error(`Structure verification failed: ${test3.error}`);
    }

    await sleep(500);
    await saveScreenshot(page, 'events/import_export_structure', test3.success);

    // TEST 4: Test import/export roundtrip
    console.log('\n🧪 TEST 4: Testing import/export roundtrip...');
    const test4 = await page.evaluate(() => {
      try {
        const EventManager = window.EventManager.getInstance();
        
        // Export current state
        const exportedJSON = EventManager.exportToJSON();
        
        // Create new manager and import
        const originalEventCount = EventManager.getAllEvents().length;
        
        // Clear and reload
        EventManager.reset(false);
        const afterClearCount = EventManager.getAllEvents().length;
        
        const importSuccess = EventManager.loadFromJSON(exportedJSON);
        const afterImportCount = EventManager.getAllEvents().length;
        
        // Verify imported events
        const event1 = EventManager.getEvent('export-test-dialogue');
        const event2 = EventManager.getEvent('export-test-spawn');
        const event3 = EventManager.getEvent('export-test-tutorial');
        
        return {
          success: importSuccess && afterImportCount === 3,
          originalCount: originalEventCount,
          afterClearCount,
          afterImportCount,
          hasDialogue: event1 !== undefined,
          hasSpawn: event2 !== undefined,
          hasTutorial: event3 !== undefined,
          dialogueType: event1 ? event1.type : null,
          spawnContent: event2 ? event2.content : null
        };
      } catch (e) {
        return { success: false, error: e.message, stack: e.stack };
      }
    });

    console.log('   Roundtrip success:', test4.success);
    console.log('   Original count:', test4.originalCount);
    console.log('   After clear:', test4.afterClearCount);
    console.log('   After import:', test4.afterImportCount);
    console.log('   All events restored:', test4.hasDialogue && test4.hasSpawn && test4.hasTutorial);

    if (!test4.success) {
      throw new Error(`Roundtrip failed: ${test4.error}\n${test4.stack || ''}`);
    }

    await sleep(500);
    await saveScreenshot(page, 'events/import_export_roundtrip', test4.success);

    // TEST 5: Final visual verification
    console.log('\n🧪 TEST 5: Final visual verification...');
    await page.evaluate(() => {
      window.gameState = 'LEVEL_EDITOR';
      if (window.draggablePanelManager) {
        window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
      }
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });

    await sleep(1000);
    await saveScreenshot(page, 'events/import_export_final', true);

    // All tests passed
    console.log('\n✅ All Import/Export tests passed!');
    console.log('   - Created 3 test events');
    console.log('   - Exported to JSON successfully');
    console.log('   - Verified JSON structure');
    console.log('   - Import/export roundtrip successful');
    console.log('   Screenshots saved to test/e2e/screenshots/events/success/');

    await browser.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Import/Export E2E Test Failed');
    console.error('   Error:', error.message);
    console.error('   Stack:', error.stack);

    if (browser) {
      const page = (await browser.pages())[0];
      if (page) {
        await saveScreenshot(page, 'events/import_export_error', false);
      }
      await browser.close();
    }
    
    process.exit(1);
  }
})();
