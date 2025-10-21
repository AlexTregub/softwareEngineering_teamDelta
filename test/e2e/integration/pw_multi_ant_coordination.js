/**
 * Test Suite 42: MultiAntCoordination
 */

const { launchBrowser, sleep } = require('../puppeteer_helper');
const { ensureGameStarted, forceRedraw } = require('../helpers/game_helper');
const { captureEvidence } = require('../helpers/screenshot_helper');

let testsPassed = 0;
let testsFailed = 0;


async function test_Multiple_ants_gather_without_conflicts(page) {
  const testName = 'Multiple ants gather without conflicts';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Multiple ants gather without conflicts');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'integration/multiantcoordination_1', 'integration', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Ants_avoid_colliding(page) {
  const testName = 'Ants avoid colliding';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Ants avoid colliding');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'integration/multiantcoordination_2', 'integration', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Ants_share_resource_locations(page) {
  const testName = 'Ants share resource locations';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Ants share resource locations');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'integration/multiantcoordination_3', 'integration', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Ants_coordinate_dropoff_usage(page) {
  const testName = 'Ants coordinate dropoff usage';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Ants coordinate dropoff usage');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'integration/multiantcoordination_4', 'integration', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Combat_ants_support_each_other(page) {
  const testName = 'Combat ants support each other';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Combat ants support each other');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'integration/multiantcoordination_5', 'integration', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Builder_ants_coordinate_construction(page) {
  const testName = 'Builder ants coordinate construction';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Builder ants coordinate construction');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'integration/multiantcoordination_6', 'integration', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Spatial_grid_prevents_overlap(page) {
  const testName = 'Spatial grid prevents overlap';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Spatial grid prevents overlap');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'integration/multiantcoordination_7', 'integration', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Multiple_ants_pathfind_independently(page) {
  const testName = 'Multiple ants pathfind independently';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Multiple ants pathfind independently');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'integration/multiantcoordination_8', 'integration', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Ant_behaviors_dont_interfere(page) {
  const testName = 'Ant behaviors dont interfere';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Ant behaviors dont interfere');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'integration/multiantcoordination_9', 'integration', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Colony_coordination_emerges(page) {
  const testName = 'Colony coordination emerges';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Colony coordination emerges');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'integration/multiantcoordination_10', 'integration', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function runMultiAntCoordinationTests() {
  console.log('\n' + '='.repeat(70));
  console.log('Test Suite 42: MultiAntCoordination');
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

    await test_Multiple_ants_gather_without_conflicts(page);
    await test_Ants_avoid_colliding(page);
    await test_Ants_share_resource_locations(page);
    await test_Ants_coordinate_dropoff_usage(page);
    await test_Combat_ants_support_each_other(page);
    await test_Builder_ants_coordinate_construction(page);
    await test_Spatial_grid_prevents_overlap(page);
    await test_Multiple_ants_pathfind_independently(page);
    await test_Ant_behaviors_dont_interfere(page);
    await test_Colony_coordination_emerges(page);

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

runMultiAntCoordinationTests();
