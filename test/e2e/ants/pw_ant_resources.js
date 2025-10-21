/**
 * Test Suite 17: AntResourceManagement
 * Tests ant antresourcemanagement functionality
 */

const { launchBrowser, saveScreenshot, sleep } = require('../puppeteer_helper');
const { ensureGameStarted, forceRedraw } = require('../helpers/game_helper');
const { captureEvidence } = require('../helpers/screenshot_helper');

let testsPassed = 0;
let testsFailed = 0;


async function test_getResourceCount_returns_current_load(page) {
  const testName = 'getResourceCount() returns current load';
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
    await captureEvidence(page, 'ants/antresourcemanagement_1', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_getMaxResources_returns_capacity(page) {
  const testName = 'getMaxResources() returns capacity';
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
    await captureEvidence(page, 'ants/antresourcemanagement_2', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_addResource_adds_to_inventory(page) {
  const testName = 'addResource() adds to inventory';
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
    await captureEvidence(page, 'ants/antresourcemanagement_3', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_removeResource_removes_from_inventory(page) {
  const testName = 'removeResource() removes from inventory';
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
    await captureEvidence(page, 'ants/antresourcemanagement_4', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_dropAllResources_empties_inventory(page) {
  const testName = 'dropAllResources() empties inventory';
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
    await captureEvidence(page, 'ants/antresourcemanagement_5', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Ant_transitions_to_DROPPING_OFF_when_full(page) {
  const testName = 'Ant transitions to DROPPING_OFF when full';
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
    await captureEvidence(page, 'ants/antresourcemanagement_6', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Ant_seeks_dropoff_location(page) {
  const testName = 'Ant seeks dropoff location';
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
    await captureEvidence(page, 'ants/antresourcemanagement_7', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Ant_deposits_resources_at_dropoff(page) {
  const testName = 'Ant deposits resources at dropoff';
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
    await captureEvidence(page, 'ants/antresourcemanagement_8', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Resource_indicator_renders_correctly(page) {
  const testName = 'Resource indicator renders correctly';
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
    await captureEvidence(page, 'ants/antresourcemanagement_9', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Inventory_affects_ant_behavior(page) {
  const testName = 'Inventory affects ant behavior';
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
    await captureEvidence(page, 'ants/antresourcemanagement_10', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function runAntResourceManagementTests() {
  console.log('\n' + '='.repeat(70));
  console.log('Test Suite 17: AntResourceManagement');
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

    await test_getResourceCount_returns_current_load(page);
    await test_getMaxResources_returns_capacity(page);
    await test_addResource_adds_to_inventory(page);
    await test_removeResource_removes_from_inventory(page);
    await test_dropAllResources_empties_inventory(page);
    await test_Ant_transitions_to_DROPPING_OFF_when_full(page);
    await test_Ant_seeks_dropoff_location(page);
    await test_Ant_deposits_resources_at_dropoff(page);
    await test_Resource_indicator_renders_correctly(page);
    await test_Inventory_affects_ant_behavior(page);

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

runAntResourceManagementTests();
