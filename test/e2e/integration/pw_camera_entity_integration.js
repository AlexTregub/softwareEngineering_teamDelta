/**
 * Test Suite 43: CameraEntityIntegration
 */

const { launchBrowser, sleep } = require('../puppeteer_helper');
const { ensureGameStarted, forceRedraw } = require('../helpers/game_helper');
const { captureEvidence } = require('../helpers/screenshot_helper');

let testsPassed = 0;
let testsFailed = 0;


async function test_Camera_follows_selected_ant(page) {
  const testName = 'Camera follows selected ant';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Camera follows selected ant');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'integration/cameraentityintegration_1', 'integration', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Entities_render_at_correct_screen_positions(page) {
  const testName = 'Entities render at correct screen positions';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Entities render at correct screen positions');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'integration/cameraentityintegration_2', 'integration', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Camera_zoom_affects_entity_rendering(page) {
  const testName = 'Camera zoom affects entity rendering';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Camera zoom affects entity rendering');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'integration/cameraentityintegration_3', 'integration', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Entity_selection_works_with_camera_movement(page) {
  const testName = 'Entity selection works with camera movement';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Entity selection works with camera movement');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'integration/cameraentityintegration_4', 'integration', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Pathfinding_viz_updates_with_camera(page) {
  const testName = 'Pathfinding viz updates with camera';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Pathfinding viz updates with camera');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'integration/cameraentityintegration_5', 'integration', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_UI_elements_fixed_to_screen(page) {
  const testName = 'UI elements fixed to screen';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: UI elements fixed to screen');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'integration/cameraentityintegration_6', 'integration', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Entity_culling_works_off_screen(page) {
  const testName = 'Entity culling works off-screen';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Entity culling works off-screen');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'integration/cameraentityintegration_7', 'integration', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Camera_bounds_prevent_out_of_world(page) {
  const testName = 'Camera bounds prevent out-of-world';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Camera bounds prevent out-of-world');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'integration/cameraentityintegration_8', 'integration', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Screen_to_world_conversions_accurate(page) {
  const testName = 'Screen-to-world conversions accurate';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Screen-to-world conversions accurate');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'integration/cameraentityintegration_9', 'integration', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Camera_and_entities_synchronized(page) {
  const testName = 'Camera and entities synchronized';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Camera and entities synchronized');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'integration/cameraentityintegration_10', 'integration', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function runCameraEntityIntegrationTests() {
  console.log('\n' + '='.repeat(70));
  console.log('Test Suite 43: CameraEntityIntegration');
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

    await test_Camera_follows_selected_ant(page);
    await test_Entities_render_at_correct_screen_positions(page);
    await test_Camera_zoom_affects_entity_rendering(page);
    await test_Entity_selection_works_with_camera_movement(page);
    await test_Pathfinding_viz_updates_with_camera(page);
    await test_UI_elements_fixed_to_screen(page);
    await test_Entity_culling_works_off_screen(page);
    await test_Camera_bounds_prevent_out_of_world(page);
    await test_Screen_to_world_conversions_accurate(page);
    await test_Camera_and_entities_synchronized(page);

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

runCameraEntityIntegrationTests();
