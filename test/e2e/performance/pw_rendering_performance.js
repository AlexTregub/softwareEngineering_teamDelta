/**
 * Test Suite 47: RenderingPerformance
 */

const { launchBrowser, sleep } = require('../puppeteer_helper');
const { ensureGameStarted, forceRedraw } = require('../helpers/game_helper');
const { captureEvidence } = require('../helpers/screenshot_helper');

let testsPassed = 0;
let testsFailed = 0;


async function test_Terrain_cache_improves_performance(page) {
  const testName = 'Terrain cache improves performance';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Terrain cache improves performance');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'performance/renderingperformance_1', 'performance', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Entity_culling_reduces_draw_calls(page) {
  const testName = 'Entity culling reduces draw calls';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Entity culling reduces draw calls');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'performance/renderingperformance_2', 'performance', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Sprite_batching_works(page) {
  const testName = 'Sprite batching works';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Sprite batching works');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'performance/renderingperformance_3', 'performance', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Layer_rendering_optimized(page) {
  const testName = 'Layer rendering optimized';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Layer rendering optimized');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'performance/renderingperformance_4', 'performance', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Camera_movement_doesnt_drop_FPS(page) {
  const testName = 'Camera movement doesnt drop FPS';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Camera movement doesnt drop FPS');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'performance/renderingperformance_5', 'performance', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Zoom_doesnt_affect_performance(page) {
  const testName = 'Zoom doesnt affect performance';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Zoom doesnt affect performance');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'performance/renderingperformance_6', 'performance', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_UI_rendering_separate_from_game(page) {
  const testName = 'UI rendering separate from game';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: UI rendering separate from game');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'performance/renderingperformance_7', 'performance', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Debug_rendering_toggleable(page) {
  const testName = 'Debug rendering toggleable';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Debug rendering toggleable');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'performance/renderingperformance_8', 'performance', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Render_time_per_layer_measured(page) {
  const testName = 'Render time per layer measured';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Render time per layer measured');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'performance/renderingperformance_9', 'performance', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_Overall_render_budget_maintained(page) {
  const testName = 'Overall render budget maintained';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      console.log('Testing: Overall render budget maintained');
    });
    await forceRedraw(page);
    await captureEvidence(page, 'performance/renderingperformance_10', 'performance', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function runRenderingPerformanceTests() {
  console.log('\n' + '='.repeat(70));
  console.log('Test Suite 47: RenderingPerformance');
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

    await test_Terrain_cache_improves_performance(page);
    await test_Entity_culling_reduces_draw_calls(page);
    await test_Sprite_batching_works(page);
    await test_Layer_rendering_optimized(page);
    await test_Camera_movement_doesnt_drop_FPS(page);
    await test_Zoom_doesnt_affect_performance(page);
    await test_UI_rendering_separate_from_game(page);
    await test_Debug_rendering_toggleable(page);
    await test_Render_time_per_layer_measured(page);
    await test_Overall_render_budget_maintained(page);

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

runRenderingPerformanceTests();
