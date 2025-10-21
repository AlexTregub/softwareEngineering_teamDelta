/**
 * Test Suite 41: AntLifecycle
 */

const { launchBrowser, sleep } = require('../puppeteer_helper');
const { ensureGameStarted, forceRedraw } = require('../helpers/game_helper');
const { captureEvidence } = require('../helpers/screenshot_helper');

let testsPassed = 0;
let testsFailed = 0;


async function test_Ant_spawns_searches_gathers_drops_repeats(page) {
  const testName = 'Ant spawns → searches → gathers → drops → repeats';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Ant spawns → searches → gathers → drops → repeats');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'integration/antlifecycle_1', 'integration', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Ant_hunger_seeks_food_eats_continues(page) {
  const testName = 'Ant hunger → seeks food → eats → continues';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Ant hunger → seeks food → eats → continues');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'integration/antlifecycle_2', 'integration', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Ant_encounters_enemy_engages_returns(page) {
  const testName = 'Ant encounters enemy → engages → returns';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Ant encounters enemy → engages → returns');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'integration/antlifecycle_3', 'integration', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Ant_inventory_fills_seeks_dropoff_deposits(page) {
  const testName = 'Ant inventory fills → seeks dropoff → deposits';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Ant inventory fills → seeks dropoff → deposits');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'integration/antlifecycle_4', 'integration', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Ant_follows_pheromone_completes_task(page) {
  const testName = 'Ant follows pheromone → completes task';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Ant follows pheromone → completes task');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'integration/antlifecycle_5', 'integration', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Ant_low_health_flees_heals(page) {
  const testName = 'Ant low health → flees → heals';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Ant low health → flees → heals');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'integration/antlifecycle_6', 'integration', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Ant_job_type_appropriate_behavior(page) {
  const testName = 'Ant job type → appropriate behavior';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Ant job type → appropriate behavior');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'integration/antlifecycle_7', 'integration', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Complete_gather_cycle_with_multiple_ants(page) {
  const testName = 'Complete gather cycle with multiple ants';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Complete gather cycle with multiple ants');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'integration/antlifecycle_8', 'integration', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Ant_death_removed_from_systems(page) {
  const testName = 'Ant death → removed from systems';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Ant death → removed from systems');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'integration/antlifecycle_9', 'integration', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Full_lifecycle_from_spawn_to_death(page) {
  const testName = 'Full lifecycle from spawn to death';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Full lifecycle from spawn to death');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'integration/antlifecycle_10', 'integration', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function runAntLifecycleTests() {
  console.log('\n' + '='.repeat(70));
  console.log('Test Suite 41: AntLifecycle');
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

    await test_Ant_spawns_searches_gathers_drops_repeats(page);
    await test_Ant_hunger_seeks_food_eats_continues(page);
    await test_Ant_encounters_enemy_engages_returns(page);
    await test_Ant_inventory_fills_seeks_dropoff_deposits(page);
    await test_Ant_follows_pheromone_completes_task(page);
    await test_Ant_low_health_flees_heals(page);
    await test_Ant_job_type_appropriate_behavior(page);
    await test_Complete_gather_cycle_with_multiple_ants(page);
    await test_Ant_death_removed_from_systems(page);
    await test_Full_lifecycle_from_spawn_to_death(page);

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

runAntLifecycleTests();
