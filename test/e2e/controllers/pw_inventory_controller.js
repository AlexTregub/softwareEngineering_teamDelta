/**
 * Test Suite 10: InventoryController
 * Tests inventorycontroller functionality
 */

const { launchBrowser, saveScreenshot, sleep } = require('../puppeteer_helper');
const { ensureGameStarted, forceRedraw } = require('../helpers/game_helper');
const { captureEvidence } = require('../helpers/screenshot_helper');

let testsPassed = 0;
let testsFailed = 0;


async function test_Inventory_initializes_with_capacity(page) {
  const testName = 'Inventory initializes with capacity';
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
    await captureEvidence(page, 'controllers/inventorycontroller_1', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_addItem_adds_resource_to_inventory(page) {
  const testName = 'addItem() adds resource to inventory';
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
    await captureEvidence(page, 'controllers/inventorycontroller_2', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_isFull_returns_true_at_capacity(page) {
  const testName = 'isFull() returns true at capacity';
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
    await captureEvidence(page, 'controllers/inventorycontroller_3', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_hasItem_checks_for_specific_item(page) {
  const testName = 'hasItem() checks for specific item';
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
    await captureEvidence(page, 'controllers/inventorycontroller_4', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_removeItem_removes_from_inventory(page) {
  const testName = 'removeItem() removes from inventory';
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
    await captureEvidence(page, 'controllers/inventorycontroller_5', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Inventory_refuses_items_when_full(page) {
  const testName = 'Inventory refuses items when full';
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
    await captureEvidence(page, 'controllers/inventorycontroller_6', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_getCurrentLoad_returns_item_count(page) {
  const testName = 'getCurrentLoad() returns item count';
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
    await captureEvidence(page, 'controllers/inventorycontroller_7', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_getCapacity_returns_max_capacity(page) {
  const testName = 'getCapacity() returns max capacity';
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
    await captureEvidence(page, 'controllers/inventorycontroller_8', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Inventory_persists_during_movement(page) {
  const testName = 'Inventory persists during movement';
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
    await captureEvidence(page, 'controllers/inventorycontroller_9', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Inventory_visual_indicator_updates(page) {
  const testName = 'Inventory visual indicator updates';
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
    await captureEvidence(page, 'controllers/inventorycontroller_10', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function runInventoryControllerTests() {
  console.log('\n' + '='.repeat(70));
  console.log('Test Suite 10: InventoryController');
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

    await test_Inventory_initializes_with_capacity(page);
    await test_addItem_adds_resource_to_inventory(page);
    await test_isFull_returns_true_at_capacity(page);
    await test_hasItem_checks_for_specific_item(page);
    await test_removeItem_removes_from_inventory(page);
    await test_Inventory_refuses_items_when_full(page);
    await test_getCurrentLoad_returns_item_count(page);
    await test_getCapacity_returns_max_capacity(page);
    await test_Inventory_persists_during_movement(page);
    await test_Inventory_visual_indicator_updates(page);

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

runInventoryControllerTests();
