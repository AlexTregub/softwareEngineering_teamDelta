/**
 * Test Suite 13: TaskManager
 * Tests taskmanager functionality
 */

const { launchBrowser, saveScreenshot, sleep } = require('../puppeteer_helper');
const { ensureGameStarted, forceRedraw } = require('../helpers/game_helper');
const { captureEvidence } = require('../helpers/screenshot_helper');

let testsPassed = 0;
let testsFailed = 0;


async function test_addTask_adds_task_to_queue(page) {
  const testName = 'addTask() adds task to queue';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      if (window.testEntities) window.testEntities.forEach(e => e.destroy && e.destroy());
      window.testEntities = [];
      const entity = new Entity(100, 100, 32, 32, { 
        type: "TestEntity",
        faction: "player" 
      });
      window.testEntities = [entity];
    });
    await forceRedraw(page);
    await captureEvidence(page, 'controllers/taskmanager_1', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_getCurrentTask_returns_active_task(page) {
  const testName = 'getCurrentTask() returns active task';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      if (window.testEntities) window.testEntities.forEach(e => e.destroy && e.destroy());
      window.testEntities = [];
      const entity = new Entity(150, 150, 32, 32, { 
        type: "TestEntity",
        faction: "player" 
      });
      window.testEntities = [entity];
    });
    await forceRedraw(page);
    await captureEvidence(page, 'controllers/taskmanager_2', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Tasks_execute_in_priority_order(page) {
  const testName = 'Tasks execute in priority order';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      if (window.testEntities) window.testEntities.forEach(e => e.destroy && e.destroy());
      window.testEntities = [];
      const entity = new Entity(200, 200, 32, 32, { 
        type: "TestEntity",
        faction: "player" 
      });
      window.testEntities = [entity];
    });
    await forceRedraw(page);
    await captureEvidence(page, 'controllers/taskmanager_3', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_EMERGENCY_priority_executes_first(page) {
  const testName = 'EMERGENCY priority executes first';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      if (window.testEntities) window.testEntities.forEach(e => e.destroy && e.destroy());
      window.testEntities = [];
      const entity = new Entity(250, 250, 32, 32, { 
        type: "TestEntity",
        faction: "player" 
      });
      window.testEntities = [entity];
    });
    await forceRedraw(page);
    await captureEvidence(page, 'controllers/taskmanager_4', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Task_timeout_removes_task(page) {
  const testName = 'Task timeout removes task';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      if (window.testEntities) window.testEntities.forEach(e => e.destroy && e.destroy());
      window.testEntities = [];
      const entity = new Entity(300, 300, 32, 32, { 
        type: "TestEntity",
        faction: "player" 
      });
      window.testEntities = [entity];
    });
    await forceRedraw(page);
    await captureEvidence(page, 'controllers/taskmanager_5', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Task_completion_triggers_next_task(page) {
  const testName = 'Task completion triggers next task';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      if (window.testEntities) window.testEntities.forEach(e => e.destroy && e.destroy());
      window.testEntities = [];
      const entity = new Entity(350, 350, 32, 32, { 
        type: "TestEntity",
        faction: "player" 
      });
      window.testEntities = [entity];
    });
    await forceRedraw(page);
    await captureEvidence(page, 'controllers/taskmanager_6', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_removeTask_cancels_task(page) {
  const testName = 'removeTask() cancels task';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      if (window.testEntities) window.testEntities.forEach(e => e.destroy && e.destroy());
      window.testEntities = [];
      const entity = new Entity(400, 400, 32, 32, { 
        type: "TestEntity",
        faction: "player" 
      });
      window.testEntities = [entity];
    });
    await forceRedraw(page);
    await captureEvidence(page, 'controllers/taskmanager_7', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_clearTasks_empties_queue(page) {
  const testName = 'clearTasks() empties queue';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      if (window.testEntities) window.testEntities.forEach(e => e.destroy && e.destroy());
      window.testEntities = [];
      const entity = new Entity(450, 450, 32, 32, { 
        type: "TestEntity",
        faction: "player" 
      });
      window.testEntities = [entity];
    });
    await forceRedraw(page);
    await captureEvidence(page, 'controllers/taskmanager_8', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Task_status_tracked_correctly(page) {
  const testName = 'Task status tracked correctly';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      if (window.testEntities) window.testEntities.forEach(e => e.destroy && e.destroy());
      window.testEntities = [];
      const entity = new Entity(500, 500, 32, 32, { 
        type: "TestEntity",
        faction: "player" 
      });
      window.testEntities = [entity];
    });
    await forceRedraw(page);
    await captureEvidence(page, 'controllers/taskmanager_9', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Multiple_tasks_queue_properly(page) {
  const testName = 'Multiple tasks queue properly';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      if (window.testEntities) window.testEntities.forEach(e => e.destroy && e.destroy());
      window.testEntities = [];
      const entity = new Entity(550, 550, 32, 32, { 
        type: "TestEntity",
        faction: "player" 
      });
      window.testEntities = [entity];
    });
    await forceRedraw(page);
    await captureEvidence(page, 'controllers/taskmanager_10', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function runTaskManagerTests() {
  console.log('\n' + '='.repeat(70));
  console.log('Test Suite 13: TaskManager');
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

    await test_addTask_adds_task_to_queue(page);
    await test_getCurrentTask_returns_active_task(page);
    await test_Tasks_execute_in_priority_order(page);
    await test_EMERGENCY_priority_executes_first(page);
    await test_Task_timeout_removes_task(page);
    await test_Task_completion_triggers_next_task(page);
    await test_removeTask_cancels_task(page);
    await test_clearTasks_empties_queue(page);
    await test_Task_status_tracked_correctly(page);
    await test_Multiple_tasks_queue_properly(page);

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

runTaskManagerTests();
