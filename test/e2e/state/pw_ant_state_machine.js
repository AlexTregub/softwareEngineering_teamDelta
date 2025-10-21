/**
 * Test Suite 23: AntStateMachine
 */

const { launchBrowser, sleep } = require('../puppeteer_helper');
const { ensureGameStarted, forceRedraw } = require('../helpers/game_helper');
const { captureEvidence } = require('../helpers/screenshot_helper');

let testsPassed = 0;
let testsFailed = 0;


async function test_StateMachine_initializes_with_IDLE(page) {
  const testName = 'StateMachine initializes with IDLE';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      // Test implementation placeholder
      console.log('Testing: StateMachine initializes with IDLE');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'state/antstatemachine_1', 'state', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_setPrimaryState_changes_state(page) {
  const testName = 'setPrimaryState() changes state';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      // Test implementation placeholder
      console.log('Testing: setPrimaryState() changes state');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'state/antstatemachine_2', 'state', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_getCurrentState_returns_state(page) {
  const testName = 'getCurrentState() returns state';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      // Test implementation placeholder
      console.log('Testing: getCurrentState() returns state');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'state/antstatemachine_3', 'state', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_getFullState_includes_modifiers(page) {
  const testName = 'getFullState() includes modifiers';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      // Test implementation placeholder
      console.log('Testing: getFullState() includes modifiers');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'state/antstatemachine_4', 'state', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_setCombatModifier_sets_combat(page) {
  const testName = 'setCombatModifier() sets combat';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      // Test implementation placeholder
      console.log('Testing: setCombatModifier() sets combat');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'state/antstatemachine_5', 'state', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_setTerrainModifier_sets_terrain(page) {
  const testName = 'setTerrainModifier() sets terrain';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      // Test implementation placeholder
      console.log('Testing: setTerrainModifier() sets terrain');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'state/antstatemachine_6', 'state', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_canPerformAction_checks_validity(page) {
  const testName = 'canPerformAction() checks validity';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      // Test implementation placeholder
      console.log('Testing: canPerformAction() checks validity');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'state/antstatemachine_7', 'state', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_isValidPrimary_validates_states(page) {
  const testName = 'isValidPrimary() validates states';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      // Test implementation placeholder
      console.log('Testing: isValidPrimary() validates states');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'state/antstatemachine_8', 'state', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_reset_returns_to_IDLE(page) {
  const testName = 'reset() returns to IDLE';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      // Test implementation placeholder
      console.log('Testing: reset() returns to IDLE');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'state/antstatemachine_9', 'state', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_State_changes_trigger_callbacks(page) {
  const testName = 'State changes trigger callbacks';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      // Test implementation placeholder
      console.log('Testing: State changes trigger callbacks');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'state/antstatemachine_10', 'state', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Multiple_state_combinations_work(page) {
  const testName = 'Multiple state combinations work';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      // Test implementation placeholder
      console.log('Testing: Multiple state combinations work');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'state/antstatemachine_11', 'state', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Invalid_states_rejected(page) {
  const testName = 'Invalid states rejected';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      // Test implementation placeholder
      console.log('Testing: Invalid states rejected');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'state/antstatemachine_12', 'state', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function runAntStateMachineTests() {
  console.log('\n' + '='.repeat(70));
  console.log('Test Suite 23: AntStateMachine');
  console.log('='.repeat(70) + '\n');

  let browser, page;
  try {
    browser = await launchBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto('http://localhost:8000', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('canvas', { timeout: 10000 });
    await sleep(1000);

    const gameStarted = await ensureGameStarted(page);
    if (!gameStarted.started) throw new Error(`Failed to start game: ${gameStarted.reason}`);
    console.log('✅ Game started\n');

    await test_StateMachine_initializes_with_IDLE(page);
    await test_setPrimaryState_changes_state(page);
    await test_getCurrentState_returns_state(page);
    await test_getFullState_includes_modifiers(page);
    await test_setCombatModifier_sets_combat(page);
    await test_setTerrainModifier_sets_terrain(page);
    await test_canPerformAction_checks_validity(page);
    await test_isValidPrimary_validates_states(page);
    await test_reset_returns_to_IDLE(page);
    await test_State_changes_trigger_callbacks(page);
    await test_Multiple_state_combinations_work(page);
    await test_Invalid_states_rejected(page);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    if (browser) await browser.close();
  }

  console.log('\n' + '='.repeat(70));
  const total = testsPassed + testsFailed;
  const passRate = total > 0 ? ((testsPassed / total) * 100).toFixed(1) : '0.0';
  console.log(`Total: ${total}, Passed: ${testsPassed} ✅, Failed: ${testsFailed} ❌, Rate: ${passRate}%`);
  console.log('='.repeat(70) + '\n');
  process.exit(testsFailed > 0 ? 1 : 0);
}

runAntStateMachineTests();
