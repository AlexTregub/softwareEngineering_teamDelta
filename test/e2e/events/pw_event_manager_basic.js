/**
 * E2E Test: EventManager Basic Functionality
 * 
 * Tests EventManager in real browser environment:
 * 1. EventManager singleton initialization
 * 2. Event registration and retrieval
 * 3. Manual event triggering
 * 4. Flag system
 * 5. Active event tracking
 * 
 * CRITICAL: Provides screenshot proof of browser execution
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  try {
    console.log('EventManager E2E: Starting basic functionality test...');
    
    // Navigate to game
    await page.goto('http://localhost:8000?test=1', { waitUntil: 'networkidle2', timeout: 45000 });
    await sleep(1000);
    
    // CRITICAL: Ensure game started (bypass menu)
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      console.error('Failed to start game:', gameStarted.reason);
      await saveScreenshot(page, 'events/event_manager_basic_menu_stuck', false);
      await browser.close();
      process.exit(1);
    }
    
    console.log('Game started successfully, testing EventManager...');
    
    // Test EventManager in browser
    const result = await page.evaluate(() => {
      const results = {
        tests: [],
        allPassed: true
      };
      
      try {
        // Test 1: EventManager singleton exists
        if (typeof EventManager === 'undefined') {
          results.tests.push({ name: 'EventManager exists', passed: false, error: 'EventManager not defined' });
          results.allPassed = false;
          return results;
        }
        
        const eventManager = EventManager.getInstance();
        if (!eventManager) {
          results.tests.push({ name: 'getInstance()', passed: false, error: 'getInstance returned null' });
          results.allPassed = false;
          return results;
        }
        results.tests.push({ name: 'EventManager singleton', passed: true });
        
        // Test 2: Register event
        const registered = eventManager.registerEvent({
          id: 'e2e_test_event',
          type: 'dialogue',
          content: { message: 'E2E Test Event' },
          priority: 5
        });
        
        if (!registered) {
          results.tests.push({ name: 'Register event', passed: false, error: 'registerEvent returned false' });
          results.allPassed = false;
          return results;
        }
        results.tests.push({ name: 'Register event', passed: true });
        
        // Test 3: Retrieve event
        const event = eventManager.getEvent('e2e_test_event');
        if (!event || event.id !== 'e2e_test_event') {
          results.tests.push({ name: 'Get event', passed: false, error: 'Event not found or wrong ID' });
          results.allPassed = false;
          return results;
        }
        results.tests.push({ name: 'Get event', passed: true });
        
        // Test 4: Trigger event
        let triggered = false;
        event.onTrigger = () => { triggered = true; };
        
        const triggerResult = eventManager.triggerEvent('e2e_test_event');
        if (!triggerResult || !triggered) {
          results.tests.push({ name: 'Trigger event', passed: false, error: 'Event not triggered or callback not called' });
          results.allPassed = false;
          return results;
        }
        results.tests.push({ name: 'Trigger event', passed: true });
        
        // Test 5: Active event tracking
        const activeEvents = eventManager.getActiveEvents();
        if (activeEvents.length !== 1 || activeEvents[0].id !== 'e2e_test_event') {
          results.tests.push({ name: 'Active events', passed: false, error: `Expected 1 active event, got ${activeEvents.length}` });
          results.allPassed = false;
          return results;
        }
        results.tests.push({ name: 'Active events', passed: true });
        
        // Test 6: Flag system
        eventManager.setFlag('e2e_test_flag', 42);
        const flagValue = eventManager.getFlag('e2e_test_flag');
        if (flagValue !== 42) {
          results.tests.push({ name: 'Flag system', passed: false, error: `Expected 42, got ${flagValue}` });
          results.allPassed = false;
          return results;
        }
        results.tests.push({ name: 'Flag system', passed: true });
        
        // Test 7: Complete event
        const completed = eventManager.completeEvent('e2e_test_event');
        if (!completed) {
          results.tests.push({ name: 'Complete event', passed: false, error: 'completeEvent returned false' });
          results.allPassed = false;
          return results;
        }
        
        // Verify completion flag auto-set
        const completionFlag = eventManager.getFlag('event_e2e_test_event_completed');
        if (completionFlag !== true) {
          results.tests.push({ name: 'Auto-completion flag', passed: false, error: 'Completion flag not set' });
          results.allPassed = false;
          return results;
        }
        results.tests.push({ name: 'Complete event & flag', passed: true });
        
        // Test 8: Active events empty after completion
        const activeAfter = eventManager.getActiveEvents();
        if (activeAfter.length !== 0) {
          results.tests.push({ name: 'Clear active events', passed: false, error: `Expected 0 active events, got ${activeAfter.length}` });
          results.allPassed = false;
          return results;
        }
        results.tests.push({ name: 'Clear active events', passed: true });
        
        return results;
        
      } catch (error) {
        results.tests.push({ name: 'Execution', passed: false, error: error.message });
        results.allPassed = false;
        return results;
      }
    });
    
    // Log results
    console.log('\nEventManager E2E Test Results:');
    result.tests.forEach(test => {
      const status = test.passed ? '✓' : '✗';
      console.log(`  ${status} ${test.name}${test.error ? ` - ${test.error}` : ''}`);
    });
    console.log(`\nOverall: ${result.allPassed ? 'PASS' : 'FAIL'} (${result.tests.filter(t => t.passed).length}/${result.tests.length})`);
    
    // Force rendering to capture state
    await page.evaluate(() => {
      if (window.gameState) window.gameState = 'PLAYING';
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    await sleep(500);
    
    // Screenshot proof
    await saveScreenshot(page, 'events/event_manager_basic', result.allPassed);
    
    await browser.close();
    process.exit(result.allPassed ? 0 : 1);
    
  } catch (error) {
    console.error('E2E test error:', error);
    await saveScreenshot(page, 'events/event_manager_basic_error', false);
    await browser.close();
    process.exit(1);
  }
})();
