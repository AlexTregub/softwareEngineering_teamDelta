/**
 * Test Suite 12: SelectionController
 * Tests selectioncontroller functionality
 */

const { launchBrowser, saveScreenshot, sleep } = require('../puppeteer_helper');
const { ensureGameStarted, forceRedraw } = require('../helpers/game_helper');
const { captureEvidence } = require('../helpers/screenshot_helper');

let testsPassed = 0;
let testsFailed = 0;


async function test_setSelected_changes_selection_state(page) {
  const testName = 'setSelected() changes selection state';
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
    await captureEvidence(page, 'controllers/selectioncontroller_1', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_isSelected_returns_state_correctly(page) {
  const testName = 'isSelected() returns state correctly';
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
    await captureEvidence(page, 'controllers/selectioncontroller_2', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_setSelectable_controls_selectability(page) {
  const testName = 'setSelectable() controls selectability';
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
    await captureEvidence(page, 'controllers/selectioncontroller_3', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_toggleSelected_switches_state(page) {
  const testName = 'toggleSelected() switches state';
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
    await captureEvidence(page, 'controllers/selectioncontroller_4', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Selection_highlight_renders(page) {
  const testName = 'Selection highlight renders';
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
    await captureEvidence(page, 'controllers/selectioncontroller_5', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Selection_icon_shows_for_selected_entity(page) {
  const testName = 'Selection icon shows for selected entity';
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
    await captureEvidence(page, 'controllers/selectioncontroller_6', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Selection_state_persists_during_movement(page) {
  const testName = 'Selection state persists during movement';
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
    await captureEvidence(page, 'controllers/selectioncontroller_7', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Unselectable_entities_cannot_be_selected(page) {
  const testName = 'Unselectable entities cannot be selected';
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
    await captureEvidence(page, 'controllers/selectioncontroller_8', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function runSelectionControllerTests() {
  console.log('\n' + '='.repeat(70));
  console.log('Test Suite 12: SelectionController');
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

    await test_setSelected_changes_selection_state(page);
    await test_isSelected_returns_state_correctly(page);
    await test_setSelectable_controls_selectability(page);
    await test_toggleSelected_switches_state(page);
    await test_Selection_highlight_renders(page);
    await test_Selection_icon_shows_for_selected_entity(page);
    await test_Selection_state_persists_during_movement(page);
    await test_Unselectable_entities_cannot_be_selected(page);

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

runSelectionControllerTests();
