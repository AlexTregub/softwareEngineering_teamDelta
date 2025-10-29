/**
 * E2E Test: Flag-Based Triggers
 * 
 * Tests flag trigger evaluation in real browser:
 * 1. Register event with flag trigger
 * 2. Verify trigger doesn't fire when flag is false
 * 3. Set flag and verify trigger fires
 * 4. Test multiple flag conditions (AND logic)
 * 5. Test flag operators (==, !=, >, <, etc.)
 * 
 * CRITICAL: Tests event chaining via flags
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  try {
    console.log('Flag Triggers E2E: Starting test...');
    
    await page.goto('http://localhost:8000?test=1', { waitUntil: 'networkidle2', timeout: 45000 });
    await sleep(1000);
    
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      console.error('Failed to start game:', gameStarted.reason);
      await saveScreenshot(page, 'events/flag_triggers_menu_stuck', false);
      await browser.close();
      process.exit(1);
    }
    
    console.log('Testing flag triggers...');
    
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
        let triggered = false;
        
        // Test 1: Register event with flag trigger
        eventManager.registerEvent({
          id: 'flag_event',
          type: 'dialogue',
          content: {},
          onTrigger: () => { triggered = true; }
        });
        
        eventManager.registerTrigger({
          eventId: 'flag_event',
          type: 'flag',
          oneTime: true,
          condition: {
            flag: 'tutorial_complete',
            value: true
          }
        });
        
        results.tests.push({ name: 'Register flag trigger', passed: true });
        
        // Test 2: Verify trigger doesn't fire when flag is unset
        eventManager.update();
        if (triggered) {
          results.tests.push({ name: 'No trigger when flag unset', passed: false, error: 'Triggered with unset flag' });
          results.allPassed = false;
          return results;
        }
        results.tests.push({ name: 'No trigger when flag unset', passed: true });
        
        // Test 3: Set flag and verify trigger fires
        eventManager.setFlag('tutorial_complete', true);
        eventManager.update();
        
        if (!triggered) {
          results.tests.push({ name: 'Trigger when flag set', passed: false, error: 'Did not trigger when flag set' });
          results.allPassed = false;
          return results;
        }
        results.tests.push({ name: 'Trigger when flag set', passed: true });
        
        // Test 4: Multiple flag conditions (AND logic)
        triggered = false;
        eventManager.registerEvent({
          id: 'multi_flag_event',
          type: 'dialogue',
          content: {},
          onTrigger: () => { triggered = true; }
        });
        
        eventManager.registerTrigger({
          eventId: 'multi_flag_event',
          type: 'flag',
          oneTime: true,
          condition: {
            flags: [
              { flag: 'level_1_complete', value: true },
              { flag: 'level_2_complete', value: true }
            ]
          }
        });
        
        // Set only one flag
        eventManager.setFlag('level_1_complete', true);
        eventManager.update();
        
        if (triggered) {
          results.tests.push({ name: 'Multi-flag AND logic (partial)', passed: false, error: 'Triggered with partial flags' });
          results.allPassed = false;
          return results;
        }
        
        // Set both flags
        eventManager.setFlag('level_2_complete', true);
        eventManager.update();
        
        if (!triggered) {
          results.tests.push({ name: 'Multi-flag AND logic (all)', passed: false, error: 'Did not trigger with all flags' });
          results.allPassed = false;
          return results;
        }
        results.tests.push({ name: 'Multi-flag AND logic', passed: true });
        
        // Test 5: Flag operators
        triggered = false;
        eventManager.registerEvent({
          id: 'operator_event',
          type: 'dialogue',
          content: {},
          onTrigger: () => { triggered = true; }
        });
        
        eventManager.registerTrigger({
          eventId: 'operator_event',
          type: 'flag',
          oneTime: true,
          condition: {
            flag: 'score',
            value: 100,
            operator: '>='
          }
        });
        
        // Set score below threshold
        eventManager.setFlag('score', 50);
        eventManager.update();
        
        if (triggered) {
          results.tests.push({ name: 'Operator >= (below)', passed: false, error: 'Triggered below threshold' });
          results.allPassed = false;
          return results;
        }
        
        // Set score at threshold
        eventManager.setFlag('score', 100);
        eventManager.update();
        
        if (!triggered) {
          results.tests.push({ name: 'Operator >= (at)', passed: false, error: 'Did not trigger at threshold' });
          results.allPassed = false;
          return results;
        }
        results.tests.push({ name: 'Flag operators', passed: true });
        
        // Test 6: Event chaining via completion flags
        let firstTriggered = false;
        let secondTriggered = false;
        
        eventManager.registerEvent({
          id: 'chain_first',
          type: 'dialogue',
          content: {},
          onTrigger: () => { firstTriggered = true; }
        });
        
        eventManager.registerEvent({
          id: 'chain_second',
          type: 'dialogue',
          content: {},
          onTrigger: () => { secondTriggered = true; }
        });
        
        eventManager.registerTrigger({
          eventId: 'chain_second',
          type: 'flag',
          oneTime: true,
          condition: {
            flag: 'event_chain_first_completed',
            value: true
          }
        });
        
        // Trigger and complete first event
        eventManager.triggerEvent('chain_first');
        eventManager.completeEvent('chain_first'); // Auto-sets completion flag
        
        // Second should trigger now
        eventManager.update();
        
        if (!secondTriggered) {
          results.tests.push({ name: 'Event chaining', passed: false, error: 'Second event did not chain from first' });
          results.allPassed = false;
          return results;
        }
        results.tests.push({ name: 'Event chaining', passed: true });
        
        return results;
        
      } catch (error) {
        results.tests.push({ name: 'Execution', passed: false, error: error.message });
        results.allPassed = false;
        return results;
      }
    });
    
    console.log('\nFlag Triggers E2E Test Results:');
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
    
    await saveScreenshot(page, 'events/flag_triggers', result.allPassed);
    
    await browser.close();
    process.exit(result.allPassed ? 0 : 1);
    
  } catch (error) {
    console.error('E2E test error:', error);
    await saveScreenshot(page, 'events/flag_triggers_error', false);
    await browser.close();
    process.exit(1);
  }
})();
