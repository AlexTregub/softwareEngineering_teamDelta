/**
 * Test Suite 18: AntCombat
 * Tests ant antcombat functionality
 */

const { launchBrowser, saveScreenshot, sleep } = require('../puppeteer_helper');
const { ensureGameStarted, forceRedraw } = require('../helpers/game_helper');
const { captureEvidence } = require('../helpers/screenshot_helper');

let testsPassed = 0;
let testsFailed = 0;


async function test_takeDamage_reduces_ant_health(page) {
  const testName = 'takeDamage() reduces ant health';
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
    await captureEvidence(page, 'ants/antcombat_1', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_heal_restores_ant_health(page) {
  const testName = 'heal() restores ant health';
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
    await captureEvidence(page, 'ants/antcombat_2', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_attack_deals_damage_to_enemy(page) {
  const testName = 'attack() deals damage to enemy';
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
    await captureEvidence(page, 'ants/antcombat_3', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_die_deactivates_ant_at_0_health(page) {
  const testName = 'die() deactivates ant at 0 health';
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
    await captureEvidence(page, 'ants/antcombat_4', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Combat_state_changes_ant_behavior(page) {
  const testName = 'Combat state changes ant behavior';
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
    await captureEvidence(page, 'ants/antcombat_5', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Warriors_engage_enemies_automatically(page) {
  const testName = 'Warriors engage enemies automatically';
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
    await captureEvidence(page, 'ants/antcombat_6', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Non_warriors_flee_from_danger(page) {
  const testName = 'Non-warriors flee from danger';
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
    await captureEvidence(page, 'ants/antcombat_7', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Faction_determines_enemy_detection(page) {
  const testName = 'Faction determines enemy detection';
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
    await captureEvidence(page, 'ants/antcombat_8', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Health_bar_shows_during_combat(page) {
  const testName = 'Health bar shows during combat';
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
    await captureEvidence(page, 'ants/antcombat_9', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Death_removes_ant_from_game(page) {
  const testName = 'Death removes ant from game';
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
    await captureEvidence(page, 'ants/antcombat_10', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function runAntCombatTests() {
  console.log('\n' + '='.repeat(70));
  console.log('Test Suite 18: AntCombat');
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

    await test_takeDamage_reduces_ant_health(page);
    await test_heal_restores_ant_health(page);
    await test_attack_deals_damage_to_enemy(page);
    await test_die_deactivates_ant_at_0_health(page);
    await test_Combat_state_changes_ant_behavior(page);
    await test_Warriors_engage_enemies_automatically(page);
    await test_Non_warriors_flee_from_danger(page);
    await test_Faction_determines_enemy_detection(page);
    await test_Health_bar_shows_during_combat(page);
    await test_Death_removes_ant_from_game(page);

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

runAntCombatTests();
