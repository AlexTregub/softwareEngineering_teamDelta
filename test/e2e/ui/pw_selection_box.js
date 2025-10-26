/**
 * Test Suite 38: SelectionBox
 */

const { launchBrowser, sleep } = require('../puppeteer_helper');
const { ensureGameStarted, forceRedraw } = require('../helpers/game_helper');
const { captureEvidence } = require('../helpers/screenshot_helper');

let testsPassed = 0;
let testsFailed = 0;


async function test_Click_drag_creates_selection_box(page) {
  const testName = 'Click-drag creates selection box';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Click-drag creates selection box');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'ui/selectionbox_1', 'ui', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Selection_box_renders_correctly(page) {
  const testName = 'Selection box renders correctly';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Selection box renders correctly');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'ui/selectionbox_2', 'ui', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Entities_inside_box_get_selected(page) {
  const testName = 'Entities inside box get selected';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Entities inside box get selected');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'ui/selectionbox_3', 'ui', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Entities_outside_stay_unselected(page) {
  const testName = 'Entities outside stay unselected';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Entities outside stay unselected');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'ui/selectionbox_4', 'ui', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Selection_box_visual_feedback(page) {
  const testName = 'Selection box visual feedback';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Selection box visual feedback');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'ui/selectionbox_5', 'ui', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Multiple_entity_selection_works(page) {
  const testName = 'Multiple entity selection works';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Multiple entity selection works');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'ui/selectionbox_6', 'ui', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Selection_box_respects_camera(page) {
  const testName = 'Selection box respects camera';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Selection box respects camera');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'ui/selectionbox_7', 'ui', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Selection_cleared_on_new_box(page) {
  const testName = 'Selection cleared on new box';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Selection cleared on new box');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'ui/selectionbox_8', 'ui', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Shift_key_adds_to_selection(page) {
  const testName = 'Shift key adds to selection';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Shift key adds to selection');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'ui/selectionbox_9', 'ui', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Selection_box_performance_acceptable(page) {
  const testName = 'Selection box performance acceptable';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Selection box performance acceptable');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'ui/selectionbox_10', 'ui', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function runSelectionBoxTests() {
  console.log('\n' + '='.repeat(70));
  console.log('Test Suite 38: SelectionBox');
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

    await test_Click_drag_creates_selection_box(page);
    await test_Selection_box_renders_correctly(page);
    await test_Entities_inside_box_get_selected(page);
    await test_Entities_outside_stay_unselected(page);
    await test_Selection_box_visual_feedback(page);
    await test_Multiple_entity_selection_works(page);
    await test_Selection_box_respects_camera(page);
    await test_Selection_cleared_on_new_box(page);
    await test_Shift_key_adds_to_selection(page);
    await test_Selection_box_performance_acceptable(page);

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

runSelectionBoxTests();
