/**
 * E2E Test: JSON Configuration Loading
 * 
 * Tests loading event system from JSON in browser:
 * 1. Load events from JSON string
 * 2. Load triggers from JSON string
 * 3. Verify loaded events are registered
 * 4. Verify loaded triggers work correctly
 * 5. Test complex multi-event scenarios
 * 
 * CRITICAL: Tests real-world JSON configuration loading
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  try {
    console.log('JSON Loading E2E: Starting test...');
    
    await page.goto('http://localhost:8000?test=1', { waitUntil: 'networkidle2', timeout: 45000 });
    await sleep(1000);
    
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      console.error('Failed to start game:', gameStarted.reason);
      await saveScreenshot(page, 'events/json_loading_menu_stuck', false);
      await browser.close();
      process.exit(1);
    }
    
    console.log('Testing JSON configuration loading...');
    
    const result = await page.evaluate(() => {
      const results = {
        tests: [],
        allPassed: true
      };
      
      try {
        if (typeof EventManager === 'undefined') {
          results.tests.push({ name: 'EventManager exists', passed: false, error: 'EventManager not defined' });
          results.allPassed = false;
          return results;
        }
        
        const eventManager = EventManager.getInstance();
        
        // Test 1: Load events from JSON string
        const eventsConfig = JSON.stringify({
          events: [
            {
              id: 'json_event_1',
              type: 'dialogue',
              content: { message: 'First event from JSON' },
              priority: 1
            },
            {
              id: 'json_event_2',
              type: 'tutorial',
              content: { steps: ['Step 1', 'Step 2'] },
              priority: 2
            }
          ]
        });
        
        const loadResult1 = eventManager.loadFromJSON(eventsConfig);
        if (!loadResult1) {
          results.tests.push({ name: 'Load events from JSON', passed: false, error: 'loadFromJSON returned false' });
          results.allPassed = false;
          return results;
        }
        
        // Verify events loaded
        const event1 = eventManager.getEvent('json_event_1');
        const event2 = eventManager.getEvent('json_event_2');
        
        if (!event1 || !event2) {
          results.tests.push({ name: 'Load events from JSON', passed: false, error: 'Events not found after loading' });
          results.allPassed = false;
          return results;
        }
        results.tests.push({ name: 'Load events from JSON', passed: true });
        
        // Test 2: Verify event properties
        if (event1.type !== 'dialogue' || event2.type !== 'tutorial') {
          results.tests.push({ name: 'Event properties preserved', passed: false, error: 'Event types incorrect' });
          results.allPassed = false;
          return results;
        }
        
        if (event1.priority !== 1 || event2.priority !== 2) {
          results.tests.push({ name: 'Event properties preserved', passed: false, error: 'Event priorities incorrect' });
          results.allPassed = false;
          return results;
        }
        results.tests.push({ name: 'Event properties preserved', passed: true });
        
        // Test 3: Load triggers from JSON (triggers-only config)
        let triggerFired = false;
        event1.onTrigger = () => { triggerFired = true; };
        
        const triggersConfig = JSON.stringify({
          triggers: [
            {
              eventId: 'json_event_1',
              type: 'flag',
              oneTime: true,
              condition: {
                flag: 'json_test_flag',
                value: true
              }
            }
          ]
        });
        
        const loadResult2 = eventManager.loadFromJSON(triggersConfig);
        if (!loadResult2) {
          results.tests.push({ name: 'Load triggers from JSON', passed: false, error: 'loadFromJSON returned false for triggers' });
          results.allPassed = false;
          return results;
        }
        
        const triggers = eventManager.getTriggersForEvent('json_event_1');
        if (triggers.length !== 1) {
          results.tests.push({ name: 'Load triggers from JSON', passed: false, error: `Expected 1 trigger, got ${triggers.length}` });
          results.allPassed = false;
          return results;
        }
        results.tests.push({ name: 'Load triggers from JSON', passed: true });
        
        // Test 4: Verify loaded trigger works
        eventManager.setFlag('json_test_flag', true);
        eventManager.update();
        
        if (!triggerFired) {
          results.tests.push({ name: 'Loaded trigger fires', passed: false, error: 'Trigger from JSON did not fire' });
          results.allPassed = false;
          return results;
        }
        results.tests.push({ name: 'Loaded trigger fires', passed: true });
        
        // Test 5: Load combined events + triggers
        let event3Triggered = false;
        let event4Triggered = false;
        
        const combinedConfig = JSON.stringify({
          events: [
            {
              id: 'json_event_3',
              type: 'spawn',
              content: { enemyType: 'test' },
              priority: 3
            },
            {
              id: 'json_event_4',
              type: 'boss',
              content: { bossId: 'test_boss' },
              priority: 4
            }
          ],
          triggers: [
            {
              eventId: 'json_event_3',
              type: 'time',
              oneTime: true,
              condition: { delay: 0 } // Immediate
            },
            {
              eventId: 'json_event_4',
              type: 'flag',
              oneTime: true,
              condition: {
                flag: 'boss_ready',
                value: true
              }
            }
          ]
        });
        
        const loadResult3 = eventManager.loadFromJSON(combinedConfig);
        if (!loadResult3) {
          results.tests.push({ name: 'Load combined config', passed: false, error: 'loadFromJSON failed for combined config' });
          results.allPassed = false;
          return results;
        }
        
        const event3 = eventManager.getEvent('json_event_3');
        const event4 = eventManager.getEvent('json_event_4');
        
        if (!event3 || !event4) {
          results.tests.push({ name: 'Load combined config', passed: false, error: 'Events not loaded from combined config' });
          results.allPassed = false;
          return results;
        }
        
        event3.onTrigger = () => { event3Triggered = true; };
        event4.onTrigger = () => { event4Triggered = true; };
        
        // Time trigger should fire immediately
        eventManager.update();
        
        if (!event3Triggered) {
          results.tests.push({ name: 'Combined config triggers', passed: false, error: 'Time trigger did not fire' });
          results.allPassed = false;
          return results;
        }
        
        // Flag trigger should fire when flag set
        eventManager.setFlag('boss_ready', true);
        eventManager.update();
        
        if (!event4Triggered) {
          results.tests.push({ name: 'Combined config triggers', passed: false, error: 'Flag trigger did not fire' });
          results.allPassed = false;
          return results;
        }
        
        results.tests.push({ name: 'Combined config works', passed: true });
        
        // Test 6: Invalid JSON handling
        const invalidJSON = '{ invalid json }';
        const loadResult4 = eventManager.loadFromJSON(invalidJSON);
        
        if (loadResult4) {
          results.tests.push({ name: 'Invalid JSON rejected', passed: false, error: 'Invalid JSON was accepted' });
          results.allPassed = false;
          return results;
        }
        results.tests.push({ name: 'Invalid JSON rejected', passed: true });
        
        return results;
        
      } catch (error) {
        results.tests.push({ name: 'Execution', passed: false, error: error.message });
        results.allPassed = false;
        return results;
      }
    });
    
    console.log('\nJSON Loading E2E Test Results:');
    result.tests.forEach(test => {
      const status = test.passed ? '✓' : '✗';
      console.log(`  ${status} ${test.name}${test.error ? ` - ${test.error}` : ''}`);
    });
    console.log(`\nOverall: ${result.allPassed ? 'PASS' : 'FAIL'} (${result.tests.filter(t => t.passed).length}/${result.tests.length})`);
    
    await page.evaluate(() => {
      if (window.gameState) window.gameState = 'PLAYING';
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    await sleep(500);
    
    await saveScreenshot(page, 'events/json_loading', result.allPassed);
    
    await browser.close();
    process.exit(result.allPassed ? 0 : 1);
    
  } catch (error) {
    console.error('E2E test error:', error);
    await saveScreenshot(page, 'events/json_loading_error', false);
    await browser.close();
    process.exit(1);
  }
})();
