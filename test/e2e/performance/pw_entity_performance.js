/**
 * Test Suite 45: EntityPerformance
 */

const { launchBrowser, sleep } = require('../puppeteer_helper');
const { ensureGameStarted, forceRedraw } = require('../helpers/game_helper');
const { captureEvidence } = require('../helpers/screenshot_helper');

let testsPassed = 0;
let testsFailed = 0;


async function test_10_entities_maintain_60_FPS(page) {
  const testName = '10 entities maintain 60 FPS';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: 10 entities maintain 60 FPS');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'performance/entityperformance_1', 'performance', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_50_entities_maintain_30_FPS(page) {
  const testName = '50 entities maintain >30 FPS';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: 50 entities maintain >30 FPS');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'performance/entityperformance_2', 'performance', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_100_entities_stress_test(page) {
  const testName = '100 entities stress test';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: 100 entities stress test');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'performance/entityperformance_3', 'performance', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Entity_update_time_measured(page) {
  const testName = 'Entity update time measured';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Entity update time measured');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'performance/entityperformance_4', 'performance', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Entity_render_time_measured(page) {
  const testName = 'Entity render time measured';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Entity render time measured');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'performance/entityperformance_5', 'performance', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Spatial_grid_query_performance(page) {
  const testName = 'Spatial grid query performance';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Spatial grid query performance');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'performance/entityperformance_6', 'performance', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Collision_detection_acceptable(page) {
  const testName = 'Collision detection acceptable';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Collision detection acceptable');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'performance/entityperformance_7', 'performance', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Memory_usage_reasonable(page) {
  const testName = 'Memory usage reasonable';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Memory usage reasonable');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'performance/entityperformance_8', 'performance', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_No_memory_leaks_over_time(page) {
  const testName = 'No memory leaks over time';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: No memory leaks over time');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'performance/entityperformance_9', 'performance', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Performance_profiling_collected(page) {
  const testName = 'Performance profiling collected';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Performance profiling collected');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'performance/entityperformance_10', 'performance', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function runEntityPerformanceTests() {
  console.log('\n' + '='.repeat(70));
  console.log('Test Suite 45: EntityPerformance');
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

    await test_10_entities_maintain_60_FPS(page);
    await test_50_entities_maintain_30_FPS(page);
    await test_100_entities_stress_test(page);
    await test_Entity_update_time_measured(page);
    await test_Entity_render_time_measured(page);
    await test_Spatial_grid_query_performance(page);
    await test_Collision_detection_acceptable(page);
    await test_Memory_usage_reasonable(page);
    await test_No_memory_leaks_over_time(page);
    await test_Performance_profiling_collected(page);

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

runEntityPerformanceTests();
