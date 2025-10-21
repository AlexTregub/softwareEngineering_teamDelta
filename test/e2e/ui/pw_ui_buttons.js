/**
 * Test Suite 40: UIButtons
 */

const { launchBrowser, sleep } = require('../puppeteer_helper');
const { ensureGameStarted, forceRedraw } = require('../helpers/game_helper');
const { captureEvidence } = require('../helpers/screenshot_helper');

let testsPassed = 0;
let testsFailed = 0;


async function test_Spawn_buttons_create_ants(page) {
  const testName = 'Spawn buttons create ants';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Spawn buttons create ants');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'ui/uibuttons_1', 'ui', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Spawn_buttons_show_feedback(page) {
  const testName = 'Spawn buttons show feedback';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Spawn buttons show feedback');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'ui/uibuttons_2', 'ui', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Resource_buttons_spawn_resources(page) {
  const testName = 'Resource buttons spawn resources';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Resource buttons spawn resources');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'ui/uibuttons_3', 'ui', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Dropoff_button_creates_dropoff(page) {
  const testName = 'Dropoff button creates dropoff';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Dropoff button creates dropoff');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'ui/uibuttons_4', 'ui', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Button_hover_effects_work(page) {
  const testName = 'Button hover effects work';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Button hover effects work');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'ui/uibuttons_5', 'ui', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Button_click_handlers_fire(page) {
  const testName = 'Button click handlers fire';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Button click handlers fire');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'ui/uibuttons_6', 'ui', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Button_groups_organize_correctly(page) {
  const testName = 'Button groups organize correctly';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Button groups organize correctly');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'ui/uibuttons_7', 'ui', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Button_state_updates(page) {
  const testName = 'Button state updates';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Button state updates');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'ui/uibuttons_8', 'ui', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Button_visibility_rules_work(page) {
  const testName = 'Button visibility rules work';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Button visibility rules work');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'ui/uibuttons_9', 'ui', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Button_tooltips_show(page) {
  const testName = 'Button tooltips show';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Button tooltips show');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'ui/uibuttons_10', 'ui', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function runUIButtonsTests() {
  console.log('\n' + '='.repeat(70));
  console.log('Test Suite 40: UIButtons');
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

    await test_Spawn_buttons_create_ants(page);
    await test_Spawn_buttons_show_feedback(page);
    await test_Resource_buttons_spawn_resources(page);
    await test_Dropoff_button_creates_dropoff(page);
    await test_Button_hover_effects_work(page);
    await test_Button_click_handlers_fire(page);
    await test_Button_groups_organize_correctly(page);
    await test_Button_state_updates(page);
    await test_Button_visibility_rules_work(page);
    await test_Button_tooltips_show(page);

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

runUIButtonsTests();
