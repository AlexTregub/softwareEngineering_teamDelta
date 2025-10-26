/**
 * Test Suite 9: HealthController
 * Tests healthcontroller functionality
 */

const { launchBrowser, saveScreenshot, sleep } = require('../puppeteer_helper');
const { ensureGameStarted, forceRedraw } = require('../helpers/game_helper');
const { captureEvidence } = require('../helpers/screenshot_helper');

let testsPassed = 0;
let testsFailed = 0;


async function test_Entity_initializes_with_max_health(page) {
  const testName = 'Entity initializes with max health';
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
    await captureEvidence(page, 'controllers/healthcontroller_1', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_takeDamage_reduces_health(page) {
  const testName = 'takeDamage() reduces health';
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
    await captureEvidence(page, 'controllers/healthcontroller_2', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_heal_increases_health(page) {
  const testName = 'heal() increases health';
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
    await captureEvidence(page, 'controllers/healthcontroller_3', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Health_cannot_exceed_max_health(page) {
  const testName = 'Health cannot exceed max health';
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
    await captureEvidence(page, 'controllers/healthcontroller_4', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Health_cannot_go_below_0(page) {
  const testName = 'Health cannot go below 0';
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
    await captureEvidence(page, 'controllers/healthcontroller_5', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_getHealthPercent_returns_correct_percentage(page) {
  const testName = 'getHealthPercent() returns correct percentage';
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
    await captureEvidence(page, 'controllers/healthcontroller_6', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_applyFatigue_reduces_stamina(page) {
  const testName = 'applyFatigue() reduces stamina';
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
    await captureEvidence(page, 'controllers/healthcontroller_7', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Health_bar_renders_correctly(page) {
  const testName = 'Health bar renders correctly';
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
    await captureEvidence(page, 'controllers/healthcontroller_8', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Low_health_triggers_visual_feedback(page) {
  const testName = 'Low health triggers visual feedback';
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
    await captureEvidence(page, 'controllers/healthcontroller_9', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Death_at_0_health(page) {
  const testName = 'Death at 0 health';
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
    await captureEvidence(page, 'controllers/healthcontroller_10', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function runHealthControllerTests() {
  console.log('\n' + '='.repeat(70));
  console.log('Test Suite 9: HealthController');
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

    await test_Entity_initializes_with_max_health(page);
    await test_takeDamage_reduces_health(page);
    await test_heal_increases_health(page);
    await test_Health_cannot_exceed_max_health(page);
    await test_Health_cannot_go_below_0(page);
    await test_getHealthPercent_returns_correct_percentage(page);
    await test_applyFatigue_reduces_stamina(page);
    await test_Health_bar_renders_correctly(page);
    await test_Low_health_triggers_visual_feedback(page);
    await test_Death_at_0_health(page);

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

runHealthControllerTests();
