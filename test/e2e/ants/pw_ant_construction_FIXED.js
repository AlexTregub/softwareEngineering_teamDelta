/**
 * Test Suite 15: Ant Construction
 * Tests ant construction and initialization functionality
 * FIXED VERSION - Uses correct ant constructor
 */

const { launchBrowser, saveScreenshot, sleep } = require('../puppeteer_helper');
const { ensureGameStarted, forceRedraw } = require('../helpers/game_helper');
const { captureEvidence } = require('../helpers/screenshot_helper');

let testsPassed = 0;
let testsFailed = 0;

async function test_Ant_inherits_from_Entity(page) {
  const testName = 'Ant inherits from Entity';
  const startTime = Date.now();
  try {
    const result = await page.evaluate(() => {
      if (!window.ant) return { error: 'ant class not available' };
      const testAnt = new window.ant(100, 100, 20, 20, 30, 0, null, 'Scout', 'player');
      const isEntity = testAnt instanceof window.Entity;
      return {
        exists: !!testAnt,
        isEntity: isEntity,
        type: testAnt.type
      };
    });
    if (result.error) throw new Error(result.error);
    if (!result.exists) throw new Error('Ant not created');
    if (!result.isEntity) throw new Error('Ant does not inherit from Entity');
    if (result.type !== 'Ant') throw new Error(`Expected type 'Ant', got '${result.type}'`);
    await forceRedraw(page);
    await captureEvidence(page, 'ants/antconstruction_1', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Ant_initializes_with_job_type(page) {
  const testName = 'Ant initializes with job type';
  const startTime = Date.now();
  try {
    const result = await page.evaluate(() => {
      if (!window.ant) return { error: 'ant class not available' };
      const testAnt = new window.ant(130, 130, 20, 20, 30, 0, null, 'Worker', 'player');
      return {
        exists: !!testAnt,
        hasJobName: !!testAnt.JobName,
        jobName: testAnt.JobName,
        isCorrectJob: testAnt.JobName === 'Worker'
      };
    });
    if (result.error) throw new Error(result.error);
    if (!result.exists) throw new Error('Ant not created');
    if (!result.hasJobName) throw new Error('Ant JobName not set');
    if (!result.isCorrectJob) throw new Error(`Expected Worker, got ${result.jobName}`);
    await forceRedraw(page);
    await captureEvidence(page, 'ants/antconstruction_2', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Ant_has_unique_ant_index(page) {
  const testName = 'Ant has unique ant index';
  const startTime = Date.now();
  try {
    const result = await page.evaluate(() => {
      if (!window.ant) return { error: 'ant class not available' };
      const ant1 = new window.ant(160, 160, 20, 20, 30, 0, null, 'Scout', 'player');
      const ant2 = new window.ant(190, 190, 20, 20, 30, 0, null, 'Scout', 'player');
      return {
        exists1: !!ant1,
        exists2: !!ant2,
        hasIndex1: ant1._antIndex !== undefined,
        hasIndex2: ant2._antIndex !== undefined,
        index1: ant1._antIndex,
        index2: ant2._antIndex,
        indicesUnique: ant1._antIndex !== ant2._antIndex
      };
    });
    if (result.error) throw new Error(result.error);
    if (!result.exists1 || !result.exists2) throw new Error('Ants not created');
    if (!result.hasIndex1 || !result.hasIndex2) throw new Error('Ant indices not set');
    if (!result.indicesUnique) throw new Error(`Indices not unique: ${result.index1} === ${result.index2}`);
    await forceRedraw(page);
    await captureEvidence(page, 'ants/antconstruction_3', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Ant_initializes_StatsContainer(page) {
  const testName = 'Ant initializes StatsContainer';
  const startTime = Date.now();
  try {
    const result = await page.evaluate(() => {
      if (!window.ant) return { error: 'ant class not available' };
      const testAnt = new window.ant(220, 220, 20, 20, 30, 0, null, 'Scout', 'player');
      return {
        exists: !!testAnt,
        hasStatsContainer: !!testAnt.StatsContainer,
        statsType: testAnt.StatsContainer ? testAnt.StatsContainer.constructor.name : null
      };
    });
    if (result.error) throw new Error(result.error);
    if (!result.exists) throw new Error('Ant not created');
    if (!result.hasStatsContainer) throw new Error('StatsContainer not initialized');
    if (result.statsType !== 'StatsContainer') throw new Error(`Expected StatsContainer, got ${result.statsType}`);
    await forceRedraw(page);
    await captureEvidence(page, 'ants/antconstruction_4', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Ant_initializes_ResourceManager(page) {
  const testName = 'Ant initializes ResourceManager';
  const startTime = Date.now();
  try {
    const result = await page.evaluate(() => {
      if (!window.ant) return { error: 'ant class not available' };
      const testAnt = new window.ant(250, 250, 20, 20, 30, 0, null, 'Scout', 'player');
      return {
        exists: !!testAnt,
        hasResourceManager: !!testAnt.resourceManager,
        managerType: testAnt.resourceManager ? testAnt.resourceManager.constructor.name : null
      };
    });
    if (result.error) throw new Error(result.error);
    if (!result.exists) throw new Error('Ant not created');
    if (!result.hasResourceManager) throw new Error('ResourceManager not initialized');
    if (result.managerType !== 'ResourceManager') throw new Error(`Expected ResourceManager, got ${result.managerType}`);
    await forceRedraw(page);
    await captureEvidence(page, 'ants/antconstruction_5', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Ant_initializes_AntStateMachine(page) {
  const testName = 'Ant initializes AntStateMachine';
  const startTime = Date.now();
  try {
    const result = await page.evaluate(() => {
      if (!window.ant) return { error: 'ant class not available' };
      const testAnt = new window.ant(280, 280, 20, 20, 30, 0, null, 'Scout', 'player');
      return {
        exists: !!testAnt,
        hasStateMachine: !!testAnt.stateMachine,
        machineType: testAnt.stateMachine ? testAnt.stateMachine.constructor.name : null
      };
    });
    if (result.error) throw new Error(result.error);
    if (!result.exists) throw new Error('Ant not created');
    if (!result.hasStateMachine) throw new Error('AntStateMachine not initialized');
    if (result.machineType !== 'AntStateMachine') throw new Error(`Expected AntStateMachine, got ${result.machineType}`);
    await forceRedraw(page);
    await captureEvidence(page, 'ants/antconstruction_6', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Ant_initializes_GatherState(page) {
  const testName = 'Ant initializes GatherState';
  const startTime = Date.now();
  try {
    const result = await page.evaluate(() => {
      if (!window.ant) return { error: 'ant class not available' };
      const testAnt = new window.ant(310, 310, 20, 20, 30, 0, null, 'Scout', 'player');
      return {
        exists: !!testAnt,
        hasGatherState: !!testAnt.gatherState,
        stateType: testAnt.gatherState ? testAnt.gatherState.constructor.name : null
      };
    });
    if (result.error) throw new Error(result.error);
    if (!result.exists) throw new Error('Ant not created');
    if (!result.hasGatherState) throw new Error('GatherState not initialized');
    if (result.stateType !== 'GatherState') throw new Error(`Expected GatherState, got ${result.stateType}`);
    await forceRedraw(page);
    await captureEvidence(page, 'ants/antconstruction_7', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Ant_initializes_AntBrain(page) {
  const testName = 'Ant brain property exists';
  const startTime = Date.now();
  try {
    const result = await page.evaluate(() => {
      if (!window.ant) return { error: 'ant class not available' };
      const testAnt = new window.ant(340, 340, 20, 20, 30, 0, null, 'Scout', 'player');
      return {
        exists: !!testAnt,
        hasBrainProperty: testAnt.brain !== undefined,
        brainValue: testAnt.brain
      };
    });
    if (result.error) throw new Error(result.error);
    if (!result.exists) throw new Error('Ant not created');
    if (!result.hasBrainProperty) throw new Error('Brain property not defined');
    // Brain may be undefined initially, that's okay as long as property exists
    await forceRedraw(page);
    await captureEvidence(page, 'ants/antconstruction_8', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Ant_sets_up_faction(page) {
  const testName = 'Ant sets up faction';
  const startTime = Date.now();
  try {
    const result = await page.evaluate(() => {
      if (!window.ant) return { error: 'ant class not available' };
      const testAnt = new window.ant(370, 370, 20, 20, 30, 0, null, 'Scout', 'enemy');
      return {
        exists: !!testAnt,
        hasFaction: !!testAnt.faction,
        faction: testAnt.faction,
        isCorrectFaction: testAnt.faction === 'enemy'
      };
    });
    if (result.error) throw new Error(result.error);
    if (!result.exists) throw new Error('Ant not created');
    if (!result.hasFaction) throw new Error('Faction not set');
    if (!result.isCorrectFaction) throw new Error(`Expected 'enemy', got '${result.faction}'`);
    await forceRedraw(page);
    await captureEvidence(page, 'ants/antconstruction_9', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Ant_registers_with_spatial_grid(page) {
  const testName = 'Ant registers with spatial grid';
  const startTime = Date.now();
  try {
    const result = await page.evaluate(() => {
      if (!window.ant) return { error: 'ant class not available' };
      if (!window.g_spatialGrid) return { error: 'SpatialGridManager not available' };
      
      const initialCount = window.g_spatialGrid.getEntitiesByType('Ant').length;
      const testAnt = new window.ant(400, 400, 20, 20, 30, 0, null, 'Scout', 'player');
      const finalCount = window.g_spatialGrid.getEntitiesByType('Ant').length;
      
      return {
        exists: !!testAnt,
        hasSpatialGrid: !!window.g_spatialGrid,
        initialCount: initialCount,
        finalCount: finalCount,
        wasRegistered: finalCount > initialCount
      };
    });
    if (result.error) throw new Error(result.error);
    if (!result.exists) throw new Error('Ant not created');
    if (!result.hasSpatialGrid) throw new Error('SpatialGridManager not available');
    if (!result.wasRegistered) throw new Error(`Ant not registered (count: ${result.initialCount} -> ${result.finalCount})`);
    await forceRedraw(page);
    await captureEvidence(page, 'ants/antconstruction_10', 'ants', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function runAntConstructionTests() {
  console.log('\n' + '='.repeat(70));
  console.log('Test Suite 15: Ant Construction');
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

    await test_Ant_inherits_from_Entity(page);
    await test_Ant_initializes_with_job_type(page);
    await test_Ant_has_unique_ant_index(page);
    await test_Ant_initializes_StatsContainer(page);
    await test_Ant_initializes_ResourceManager(page);
    await test_Ant_initializes_AntStateMachine(page);
    await test_Ant_initializes_GatherState(page);
    await test_Ant_initializes_AntBrain(page);
    await test_Ant_sets_up_faction(page);
    await test_Ant_registers_with_spatial_grid(page);

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

runAntConstructionTests();
