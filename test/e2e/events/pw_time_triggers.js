/**
 * E2E Test: Time-Based Triggers
 * 
 * Tests time trigger evaluation in real browser:
 * 1. Register event with time trigger
 * 2. Verify trigger fires after delay
 * 3. Verify one-time triggers are removed
 * 4. Test repeatable time triggers
 * 
 * CRITICAL: Uses real p5.js millis() function
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  try {
    console.log('Time Triggers E2E: Starting test...');
    
    await page.goto('http://localhost:8000?test=1', { waitUntil: 'networkidle2', timeout: 45000 });
    await sleep(1000);
    
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      console.error('Failed to start game:', gameStarted.reason);
      await saveScreenshot(page, 'events/time_triggers_menu_stuck', false);
      await browser.close();
      process.exit(1);
    }
    
    console.log('Testing time triggers...');
    
    const result = await page.evaluate(async () => {
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
        let triggerCount = 0;
        
        // Test 1: Register event with time trigger (100ms delay)
        eventManager.registerEvent({
          id: 'time_test_event',
          type: 'dialogue',
          content: {},
          onTrigger: () => { triggerCount++; }
        });
        
        eventManager.registerTrigger({
          eventId: 'time_test_event',
          type: 'time',
          oneTime: true,
          condition: { delay: 100 } // 100ms
        });
        
        results.tests.push({ name: 'Register time trigger', passed: true });
        
        // Test 2: Verify trigger doesn't fire immediately
        eventManager.update();
        if (triggerCount !== 0) {
          results.tests.push({ name: 'No immediate trigger', passed: false, error: `Triggered ${triggerCount} times immediately` });
          results.allPassed = false;
          return results;
        }
        results.tests.push({ name: 'No immediate trigger', passed: true });
        
        // Test 3: Wait for delay and verify trigger fires
        const startTime = millis();
        let fired = false;
        
        while (millis() - startTime < 500) { // Wait up to 500ms
          eventManager.update();
          if (triggerCount > 0) {
            fired = true;
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        if (!fired) {
          results.tests.push({ name: 'Trigger fires after delay', passed: false, error: 'Trigger never fired' });
          results.allPassed = false;
          return results;
        }
        results.tests.push({ name: 'Trigger fires after delay', passed: true });
        
        // Test 4: Verify one-time trigger was removed
        const triggers = eventManager.getTriggersForEvent('time_test_event');
        if (triggers.length !== 0) {
          results.tests.push({ name: 'One-time trigger removed', passed: false, error: `${triggers.length} triggers still registered` });
          results.allPassed = false;
          return results;
        }
        results.tests.push({ name: 'One-time trigger removed', passed: true });
        
        // Test 5: Repeatable trigger
        triggerCount = 0;
        eventManager.completeEvent('time_test_event'); // Clear active event
        
        eventManager.registerEvent({
          id: 'repeat_test',
          type: 'dialogue',
          content: {},
          onTrigger: () => { triggerCount++; }
        });
        
        eventManager.registerTrigger({
          eventId: 'repeat_test',
          type: 'time',
          repeatable: true, // NOT oneTime
          condition: { delay: 50 }
        });
        
        // Wait and count triggers
        const repeatStart = millis();
        while (millis() - repeatStart < 200) {
          eventManager.update();
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        // Repeatable triggers can fire multiple times but events can only be active once
        // So we should see it trigger at least once
        if (triggerCount === 0) {
          results.tests.push({ name: 'Repeatable trigger fires', passed: false, error: 'Never triggered' });
          results.allPassed = false;
          return results;
        }
        results.tests.push({ name: 'Repeatable trigger fires', passed: true });
        
        return results;
        
      } catch (error) {
        results.tests.push({ name: 'Execution', passed: false, error: error.message });
        results.allPassed = false;
        return results;
      }
    });
    
    // Log results
    console.log('\nTime Triggers E2E Test Results:');
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
    
    await saveScreenshot(page, 'events/time_triggers', result.allPassed);
    
    await browser.close();
    process.exit(result.allPassed ? 0 : 1);
    
  } catch (error) {
    console.error('E2E test error:', error);
    await saveScreenshot(page, 'events/time_triggers_error', false);
    await browser.close();
    process.exit(1);
  }
})();
