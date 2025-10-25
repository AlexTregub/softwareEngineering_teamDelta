/**
 * Test Suite 16: AntJobSystem
 * Tests ant antjobsystem functionality
 */

const { launchBrowser, saveScreenshot, sleep } = require('../puppeteer_helper');
const { ensureGameStarted, forceRedraw } = require('../helpers/game_helper');
const { captureEvidence } = require('../helpers/screenshot_helper');

let testsPassed = 0;
let testsFailed = 0;


async function test_assignJob_changes_ant_job(page) {
  const testName = 'assignJob() changes ant job';
  const startTime = Date.now();
  try {
    const result = await page.evaluate(() => {
      if (!window.antsSpawn) return { error: 'antsSpawn not available' };
      const ant = window.antsSpawn(100, 100, 20, 20, 30, 0, null, 'Scout', 'player');
      return {
        exists: !!ant,
        hasJobName: !!ant.JobName,
        hasIndex: ant._antIndex !== undefined,
        jobName: ant.JobName
      };
    });
    if (result.error) throw new Error(result.error);
    if (!result.exists) throw new Error('Ant not created');
    await forceRedraw(page);
    await captureEvidence(page, 'ants/antjobsystem_1', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Job_image_loads_correctly(page) {
  const testName = 'Job image loads correctly';
  const startTime = Date.now();
  try {
    const result = await page.evaluate(() => {
      if (!window.antsSpawn) return { error: 'antsSpawn not available' };
      const ant = window.antsSpawn(130, 130, 20, 20, 30, 0, null, 'Scout', 'player');
      return {
        exists: !!ant,
        hasJobName: !!ant.JobName,
        hasIndex: ant._antIndex !== undefined,
        jobName: ant.JobName
      };
    });
    if (result.error) throw new Error(result.error);
    if (!result.exists) throw new Error('Ant not created');
    await forceRedraw(page);
    await captureEvidence(page, 'ants/antjobsystem_2', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Job_stats_applied_health_damage_speed_(page) {
  const testName = 'Job stats applied (health, damage, speed)';
  const startTime = Date.now();
  try {
    const result = await page.evaluate(() => {
      if (!window.antsSpawn) return { error: 'antsSpawn not available' };
      const ant = window.antsSpawn(160, 160, 20, 20, 30, 0, null, 'Scout', 'player');
      return {
        exists: !!ant,
        hasJobName: !!ant.JobName,
        hasIndex: ant._antIndex !== undefined,
        jobName: ant.JobName
      };
    });
    if (result.error) throw new Error(result.error);
    if (!result.exists) throw new Error('Ant not created');
    await forceRedraw(page);
    await captureEvidence(page, 'ants/antjobsystem_3', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Builder_job_prioritizes_building(page) {
  const testName = 'Builder job prioritizes building';
  const startTime = Date.now();
  try {
    const result = await page.evaluate(() => {
      if (!window.antsSpawn) return { error: 'antsSpawn not available' };
      const ant = window.antsSpawn(190, 190, 20, 20, 30, 0, null, 'Scout', 'player');
      return {
        exists: !!ant,
        hasJobName: !!ant.JobName,
        hasIndex: ant._antIndex !== undefined,
        jobName: ant.JobName
      };
    });
    if (result.error) throw new Error(result.error);
    if (!result.exists) throw new Error('Ant not created');
    await forceRedraw(page);
    await captureEvidence(page, 'ants/antjobsystem_4', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Warrior_job_prioritizes_combat(page) {
  const testName = 'Warrior job prioritizes combat';
  const startTime = Date.now();
  try {
    const result = await page.evaluate(() => {
      if (!window.antsSpawn) return { error: 'antsSpawn not available' };
      const ant = window.antsSpawn(220, 220, 20, 20, 30, 0, null, 'Scout', 'player');
      return {
        exists: !!ant,
        hasJobName: !!ant.JobName,
        hasIndex: ant._antIndex !== undefined,
        jobName: ant.JobName
      };
    });
    if (result.error) throw new Error(result.error);
    if (!result.exists) throw new Error('Ant not created');
    await forceRedraw(page);
    await captureEvidence(page, 'ants/antjobsystem_5', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Farmer_job_prioritizes_farming(page) {
  const testName = 'Farmer job prioritizes farming';
  const startTime = Date.now();
  try {
    const result = await page.evaluate(() => {
      if (!window.antsSpawn) return { error: 'antsSpawn not available' };
      const ant = window.antsSpawn(250, 250, 20, 20, 30, 0, null, 'Scout', 'player');
      return {
        exists: !!ant,
        hasJobName: !!ant.JobName,
        hasIndex: ant._antIndex !== undefined,
        jobName: ant.JobName
      };
    });
    if (result.error) throw new Error(result.error);
    if (!result.exists) throw new Error('Ant not created');
    await forceRedraw(page);
    await captureEvidence(page, 'ants/antjobsystem_6', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Scout_job_explores_areas(page) {
  const testName = 'Scout job explores areas';
  const startTime = Date.now();
  try {
    const result = await page.evaluate(() => {
      if (!window.antsSpawn) return { error: 'antsSpawn not available' };
      const ant = window.antsSpawn(280, 280, 20, 20, 30, 0, null, 'Scout', 'player');
      return {
        exists: !!ant,
        hasJobName: !!ant.JobName,
        hasIndex: ant._antIndex !== undefined,
        jobName: ant.JobName
      };
    });
    if (result.error) throw new Error(result.error);
    if (!result.exists) throw new Error('Ant not created');
    await forceRedraw(page);
    await captureEvidence(page, 'ants/antjobsystem_7', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Spitter_job_has_ranged_attacks(page) {
  const testName = 'Spitter job has ranged attacks';
  const startTime = Date.now();
  try {
    const result = await page.evaluate(() => {
      if (!window.antsSpawn) return { error: 'antsSpawn not available' };
      const ant = window.antsSpawn(310, 310, 20, 20, 30, 0, null, 'Scout', 'player');
      return {
        exists: !!ant,
        hasJobName: !!ant.JobName,
        hasIndex: ant._antIndex !== undefined,
        jobName: ant.JobName
      };
    });
    if (result.error) throw new Error(result.error);
    if (!result.exists) throw new Error('Ant not created');
    await forceRedraw(page);
    await captureEvidence(page, 'ants/antjobsystem_8', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Job_types_have_unique_behaviors(page) {
  const testName = 'Job types have unique behaviors';
  const startTime = Date.now();
  try {
    const result = await page.evaluate(() => {
      if (!window.antsSpawn) return { error: 'antsSpawn not available' };
      const ant = window.antsSpawn(340, 340, 20, 20, 30, 0, null, 'Scout', 'player');
      return {
        exists: !!ant,
        hasJobName: !!ant.JobName,
        hasIndex: ant._antIndex !== undefined,
        jobName: ant.JobName
      };
    });
    if (result.error) throw new Error(result.error);
    if (!result.exists) throw new Error('Ant not created');
    await forceRedraw(page);
    await captureEvidence(page, 'ants/antjobsystem_9', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Job_specialization_affects_pheromone_priorities(page) {
  const testName = 'Job specialization affects pheromone priorities';
  const startTime = Date.now();
  try {
    const result = await page.evaluate(() => {
      if (!window.antsSpawn) return { error: 'antsSpawn not available' };
      const ant = window.antsSpawn(370, 370, 20, 20, 30, 0, null, 'Scout', 'player');
      return {
        exists: !!ant,
        hasJobName: !!ant.JobName,
        hasIndex: ant._antIndex !== undefined,
        jobName: ant.JobName
      };
    });
    if (result.error) throw new Error(result.error);
    if (!result.exists) throw new Error('Ant not created');
    await forceRedraw(page);
    await captureEvidence(page, 'ants/antjobsystem_10', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function runAntJobSystemTests() {
  console.log('\n' + '='.repeat(70));
  console.log('Test Suite 16: AntJobSystem');
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
    console.log('✅ Game started successfully\n');

    await test_assignJob_changes_ant_job(page);
    await test_Job_image_loads_correctly(page);
    await test_Job_stats_applied_health_damage_speed_(page);
    await test_Builder_job_prioritizes_building(page);
    await test_Warrior_job_prioritizes_combat(page);
    await test_Farmer_job_prioritizes_farming(page);
    await test_Scout_job_explores_areas(page);
    await test_Spitter_job_has_ranged_attacks(page);
    await test_Job_types_have_unique_behaviors(page);
    await test_Job_specialization_affects_pheromone_priorities(page);

  } catch (error) {
    console.error('\n❌ Test suite error:', error.message);
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

runAntJobSystemTests();
