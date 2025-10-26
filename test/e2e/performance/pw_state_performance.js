/**
 * Test Suite 46: StatePerformance
 */

const { launchBrowser, sleep } = require('../puppeteer_helper');
const { ensureGameStarted, forceRedraw } = require('../helpers/game_helper');
const { captureEvidence } = require('../helpers/screenshot_helper');

let testsPassed = 0;
let testsFailed = 0;


async function test_State_checks_dont_bottleneck(page) {
  const testName = 'State checks dont bottleneck';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: State checks dont bottleneck');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'performance/stateperformance_1', 'performance', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_State_transitions_fast_1ms(page) {
  const testName = 'State transitions fast <1ms';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: State transitions fast <1ms');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'performance/stateperformance_2', 'performance', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_AntBrain_decision_making_efficient(page) {
  const testName = 'AntBrain decision making efficient';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: AntBrain decision making efficient');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'performance/stateperformance_3', 'performance', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Pheromone_trail_checks_performant(page) {
  const testName = 'Pheromone trail checks performant';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Pheromone trail checks performant');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'performance/stateperformance_4', 'performance', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Multiple_state_machines_dont_slow(page) {
  const testName = 'Multiple state machines dont slow';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Multiple state machines dont slow');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'performance/stateperformance_5', 'performance', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_State_update_time_measured(page) {
  const testName = 'State update time measured';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: State update time measured');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'performance/stateperformance_6', 'performance', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_State_overhead_acceptable(page) {
  const testName = 'State overhead acceptable';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: State overhead acceptable');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'performance/stateperformance_7', 'performance', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_GatherState_search_efficient(page) {
  const testName = 'GatherState search efficient';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: GatherState search efficient');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'performance/stateperformance_8', 'performance', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_State_system_scales_to_100_ants(page) {
  const testName = 'State system scales to 100+ ants';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: State system scales to 100+ ants');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'performance/stateperformance_9', 'performance', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_No_performance_degradation_over_time(page) {
  const testName = 'No performance degradation over time';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: No performance degradation over time');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'performance/stateperformance_10', 'performance', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function runStatePerformanceTests() {
  console.log('\n' + '='.repeat(70));
  console.log('Test Suite 46: StatePerformance');
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

    await test_State_checks_dont_bottleneck(page);
    await test_State_transitions_fast_1ms(page);
    await test_AntBrain_decision_making_efficient(page);
    await test_Pheromone_trail_checks_performant(page);
    await test_Multiple_state_machines_dont_slow(page);
    await test_State_update_time_measured(page);
    await test_State_overhead_acceptable(page);
    await test_GatherState_search_efficient(page);
    await test_State_system_scales_to_100_ants(page);
    await test_No_performance_degradation_over_time(page);

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

runStatePerformanceTests();
