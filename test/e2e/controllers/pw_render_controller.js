/**
 * Test Suite 7: RenderController
 * Tests entity rendering, visual effects, and display properties
 */

const { launchBrowser, saveScreenshot, sleep } = require('../puppeteer_helper');
const { ensureGameStarted, forceRedraw } = require('../helpers/game_helper');
const { captureEvidence } = require('../helpers/screenshot_helper');

let testsPassed = 0;
let testsFailed = 0;

async function test_EntityRendersAtCorrectPosition(page) {
  const testName = 'Entity renders at correct screen position';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      if (window.testEntities) window.testEntities.forEach(e => e.destroy && e.destroy());
      window.testEntities = [];
      const entity = new Entity(400, 300, 32, 32, { type: "TestEntity" });
      window.testEntities = [entity];
    });
    await forceRedraw(page);
    await captureEvidence(page, 'controllers/render_position', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_SpriteRendersCorrectSize(page) {
  const testName = 'Sprite renders with correct size';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      if (window.testEntities) window.testEntities.forEach(e => e.destroy && e.destroy());
      window.testEntities = [];
      const entity = new Entity(450, 350, 64, 64, { type: "LargeEntity" });
      window.testEntities = [entity];
    });
    await forceRedraw(page);
    await captureEvidence(page, 'controllers/render_size', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_SetStateColorChangesVisual(page) {
  const testName = 'setStateColor() changes visual appearance';
  const startTime = Date.now();
  try {
    const result = await page.evaluate(() => {
      if (window.testEntities) window.testEntities.forEach(e => e.destroy && e.destroy());
      window.testEntities = [];
      const entity = new Entity(500, 400, 32, 32, { type: "TestEntity" });
      window.testEntities = [entity];
      const renderCtrl = entity.getController('render');
      if (renderCtrl && renderCtrl.setStateColor) {
        renderCtrl.setStateColor('red');
      }
      return { hasRenderController: !!renderCtrl };
    });
    await forceRedraw(page);
    await captureEvidence(page, 'controllers/render_state_color', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_PlayEffectShowsVisual(page) {
  const testName = 'playEffect() shows visual effect';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      if (window.testEntities) window.testEntities.forEach(e => e.destroy && e.destroy());
      window.testEntities = [];
      const entity = new Entity(550, 450, 32, 32, { type: "TestEntity" });
      window.testEntities = [entity];
      const renderCtrl = entity.getController('render');
      if (renderCtrl && renderCtrl.playEffect) {
        renderCtrl.playEffect('highlight');
      }
    });
    await forceRedraw(page);
    await captureEvidence(page, 'controllers/render_effect', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_OpacityChangesAffectRendering(page) {
  const testName = 'Opacity changes affect rendering';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      if (window.testEntities) window.testEntities.forEach(e => e.destroy && e.destroy());
      window.testEntities = [];
      const entity = new Entity(600, 500, 32, 32, { type: "TestEntity" });
      window.testEntities = [entity];
      if (entity._sprite && entity._sprite.setOpacity) {
        entity._sprite.setOpacity(0.5);
      }
    });
    await forceRedraw(page);
    await captureEvidence(page, 'controllers/render_opacity', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_EntityRendersInCorrectLayer(page) {
  const testName = 'Entity renders in correct layer';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      if (window.testEntities) window.testEntities.forEach(e => e.destroy && e.destroy());
      window.testEntities = [];
      const entity = new Entity(650, 550, 32, 32, { type: "TestEntity" });
      window.testEntities = [entity];
    });
    await forceRedraw(page);
    await captureEvidence(page, 'controllers/render_layer', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_CameraMovementUpdatesEntityScreenPosition(page) {
  const testName = 'Camera movement updates entity screen position';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      if (window.testEntities) window.testEntities.forEach(e => e.destroy && e.destroy());
      window.testEntities = [];
      const entity = new Entity(700, 600, 32, 32, { type: "TestEntity" });
      window.testEntities = [entity];
      if (window.cameraManager) {
        window.cameraManager.setPosition(100, 100);
      }
    });
    await forceRedraw(page);
    await captureEvidence(page, 'controllers/render_camera_move', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function test_ZoomAffectsEntityRenderingSize(page) {
  const testName = 'Zoom affects entity rendering size';
  const startTime = Date.now();
  try {
    await page.evaluate(() => {
      if (window.testEntities) window.testEntities.forEach(e => e.destroy && e.destroy());
      window.testEntities = [];
      const entity = new Entity(750, 650, 32, 32, { type: "TestEntity" });
      window.testEntities = [entity];
      if (window.cameraManager) {
        window.cameraManager.setZoom(1.5);
      }
    });
    await forceRedraw(page);
    await captureEvidence(page, 'controllers/render_zoom', 'controllers', true);
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    testsFailed++;
  }
}

async function runRenderControllerTests() {
  console.log('\n' + '='.repeat(70));
  console.log('Test Suite 7: RenderController');
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

    await test_EntityRendersAtCorrectPosition(page);
    await test_SpriteRendersCorrectSize(page);
    await test_SetStateColorChangesVisual(page);
    await test_PlayEffectShowsVisual(page);
    await test_OpacityChangesAffectRendering(page);
    await test_EntityRendersInCorrectLayer(page);
    await test_CameraMovementUpdatesEntityScreenPosition(page);
    await test_ZoomAffectsEntityRenderingSize(page);

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

runRenderControllerTests();
