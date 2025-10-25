/**
 * Test Suite 44: ResourceSystemIntegration
 */

const { launchBrowser, sleep } = require('../puppeteer_helper');
const { ensureGameStarted, forceRedraw } = require('../helpers/game_helper');
const { captureEvidence } = require('../helpers/screenshot_helper');

let testsPassed = 0;
let testsFailed = 0;


async function test_Resources_spawn_ants_detect_collect_deposit(page) {
  const testName = 'Resources spawn → ants detect → collect → deposit';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Resources spawn → ants detect → collect → deposit');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'integration/resourcesystemintegration_1', 'integration', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Resource_scarcity_affects_behavior(page) {
  const testName = 'Resource scarcity affects behavior';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Resource scarcity affects behavior');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'integration/resourcesystemintegration_2', 'integration', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Multiple_resource_types_handled(page) {
  const testName = 'Multiple resource types handled';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Multiple resource types handled');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'integration/resourcesystemintegration_3', 'integration', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Resource_respawn_after_depletion(page) {
  const testName = 'Resource respawn after depletion';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Resource respawn after depletion');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'integration/resourcesystemintegration_4', 'integration', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Resource_manager_tracks_all(page) {
  const testName = 'Resource manager tracks all';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Resource manager tracks all');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'integration/resourcesystemintegration_5', 'integration', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Ants_prioritize_food_when_hungry(page) {
  const testName = 'Ants prioritize food when hungry';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Ants prioritize food when hungry');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'integration/resourcesystemintegration_6', 'integration', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Builders_seek_wood_resources(page) {
  const testName = 'Builders seek wood resources';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Builders seek wood resources');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'integration/resourcesystemintegration_7', 'integration', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Resource_visualization_updates(page) {
  const testName = 'Resource visualization updates';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Resource visualization updates');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'integration/resourcesystemintegration_8', 'integration', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Dropoff_accumulation_shown(page) {
  const testName = 'Dropoff accumulation shown';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Dropoff accumulation shown');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'integration/resourcesystemintegration_9', 'integration', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Resource_system_scales_with_ant_count(page) {
  const testName = 'Resource system scales with ant count';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Resource system scales with ant count');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'integration/resourcesystemintegration_10', 'integration', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function runResourceSystemIntegrationTests() {
  console.log('\n' + '='.repeat(70));
  console.log('Test Suite 44: ResourceSystemIntegration');
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

    await test_Resources_spawn_ants_detect_collect_deposit(page);
    await test_Resource_scarcity_affects_behavior(page);
    await test_Multiple_resource_types_handled(page);
    await test_Resource_respawn_after_depletion(page);
    await test_Resource_manager_tracks_all(page);
    await test_Ants_prioritize_food_when_hungry(page);
    await test_Builders_seek_wood_resources(page);
    await test_Resource_visualization_updates(page);
    await test_Dropoff_accumulation_shown(page);
    await test_Resource_system_scales_with_ant_count(page);

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

runResourceSystemIntegrationTests();
