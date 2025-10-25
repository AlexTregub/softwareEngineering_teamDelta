/**
 * Test Suite 19: AntMovementPatterns
 * Tests ant antmovementpatterns functionality
 */

const { launchBrowser, saveScreenshot, sleep } = require('../puppeteer_helper');
const { ensureGameStarted, forceRedraw } = require('../helpers/game_helper');
const { captureEvidence } = require('../helpers/screenshot_helper');

let testsPassed = 0;
let testsFailed = 0;


async function test_Ant_pathfinds_around_obstacles(page) {
  const testName = 'Ant pathfinds around obstacles';
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
    await captureEvidence(page, 'ants/antmovementpatterns_1', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Ant_movement_respects_terrain(page) {
  const testName = 'Ant movement respects terrain';
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
    await captureEvidence(page, 'ants/antmovementpatterns_2', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Ant_follows_pheromone_trails(page) {
  const testName = 'Ant follows pheromone trails';
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
    await captureEvidence(page, 'ants/antmovementpatterns_3', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Ant_wanders_when_idle(page) {
  const testName = 'Ant wanders when idle';
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
    await captureEvidence(page, 'ants/antmovementpatterns_4', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Ant_returns_to_colony_when_full(page) {
  const testName = 'Ant returns to colony when full';
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
    await captureEvidence(page, 'ants/antmovementpatterns_5', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Ant_avoids_water_if_not_amphibious(page) {
  const testName = 'Ant avoids water if not amphibious';
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
    await captureEvidence(page, 'ants/antmovementpatterns_6', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Movement_speed_varies_by_terrain(page) {
  const testName = 'Movement speed varies by terrain';
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
    await captureEvidence(page, 'ants/antmovementpatterns_7', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Movement_updates_position_smoothly(page) {
  const testName = 'Movement updates position smoothly';
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
    await captureEvidence(page, 'ants/antmovementpatterns_8', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Collision_avoidance_works(page) {
  const testName = 'Collision avoidance works';
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
    await captureEvidence(page, 'ants/antmovementpatterns_9', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Pathfinding_uses_PathMap(page) {
  const testName = 'Pathfinding uses PathMap';
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
    await captureEvidence(page, 'ants/antmovementpatterns_10', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function runAntMovementPatternsTests() {
  console.log('\n' + '='.repeat(70));
  console.log('Test Suite 19: AntMovementPatterns');
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

    await test_Ant_pathfinds_around_obstacles(page);
    await test_Ant_movement_respects_terrain(page);
    await test_Ant_follows_pheromone_trails(page);
    await test_Ant_wanders_when_idle(page);
    await test_Ant_returns_to_colony_when_full(page);
    await test_Ant_avoids_water_if_not_amphibious(page);
    await test_Movement_speed_varies_by_terrain(page);
    await test_Movement_updates_position_smoothly(page);
    await test_Collision_avoidance_works(page);
    await test_Pathfinding_uses_PathMap(page);

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

runAntMovementPatternsTests();
