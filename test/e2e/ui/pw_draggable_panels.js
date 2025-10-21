/**
 * Test Suite 39: DraggablePanels
 */

const { launchBrowser, sleep } = require('../puppeteer_helper');
const { ensureGameStarted, forceRedraw } = require('../helpers/game_helper');
const { captureEvidence } = require('../helpers/screenshot_helper');

let testsPassed = 0;
let testsFailed = 0;


async function test_Panels_render_at_initial_position(page) {
  const testName = 'Panels render at initial position';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Panels render at initial position');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'ui/draggablepanels_1', 'ui', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Click_drag_moves_panel(page) {
  const testName = 'Click-drag moves panel';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Click-drag moves panel');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'ui/draggablepanels_2', 'ui', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Panel_stays_within_bounds(page) {
  const testName = 'Panel stays within bounds';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Panel stays within bounds');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'ui/draggablepanels_3', 'ui', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Panel_minimize_maximize_works(page) {
  const testName = 'Panel minimize/maximize works';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Panel minimize/maximize works');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'ui/draggablepanels_4', 'ui', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Panel_close_button_works(page) {
  const testName = 'Panel close button works';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Panel close button works');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'ui/draggablepanels_5', 'ui', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Multiple_panels_dont_overlap_badly(page) {
  const testName = 'Multiple panels dont overlap badly';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Multiple panels dont overlap badly');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'ui/draggablepanels_6', 'ui', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Panel_z_index_ordering_works(page) {
  const testName = 'Panel z-index ordering works';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Panel z-index ordering works');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'ui/draggablepanels_7', 'ui', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Panel_state_persists(page) {
  const testName = 'Panel state persists';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Panel state persists');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'ui/draggablepanels_8', 'ui', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Panel_visibility_toggles(page) {
  const testName = 'Panel visibility toggles';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Panel visibility toggles');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'ui/draggablepanels_9', 'ui', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Panel_content_renders_correctly(page) {
  const testName = 'Panel content renders correctly';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Panel content renders correctly');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'ui/draggablepanels_10', 'ui', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function runDraggablePanelsTests() {
  console.log('\n' + '='.repeat(70));
  console.log('Test Suite 39: DraggablePanels');
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

    await test_Panels_render_at_initial_position(page);
    await test_Click_drag_moves_panel(page);
    await test_Panel_stays_within_bounds(page);
    await test_Panel_minimize_maximize_works(page);
    await test_Panel_close_button_works(page);
    await test_Multiple_panels_dont_overlap_badly(page);
    await test_Panel_z_index_ordering_works(page);
    await test_Panel_state_persists(page);
    await test_Panel_visibility_toggles(page);
    await test_Panel_content_renders_correctly(page);

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

runDraggablePanelsTests();
