/**
 * E2E Test: RenderController Highlighting System
 * 
 * Tests visual highlight effects on entities with screenshot verification
 * 
 * Test Coverage:
 * - SELECTED highlight (white with pulse)
 * - HOVER highlight (yellow glow)
 * - COMBAT highlight (red)
 * - Multiple highlights on screen
 * - Highlight animations
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const { ensureGameStarted, forceRedraw } = require('../helpers/game_helper');
const { captureEvidence } = require('../helpers/screenshot_helper');

let testsPassed = 0;
let testsFailed = 0;

async function test_SELECTED_highlight(page) {
  const testName = 'SELECTED highlight effect';
  const startTime = Date.now();
  try {
    const result = await page.evaluate(() => {
      // Clean up previous test entities
      if (window.testEntities) window.testEntities.forEach(e => e.destroy && e.destroy());
      window.testEntities = [];
      
      // Create test entity
      const entity = new Entity(400, 300, 64, 64);
      const renderController = entity.getController('render');
      
      if (!renderController) {
        return { success: false, error: 'RenderController not found' };
      }
      
      // Set SELECTED highlight
      renderController.setHighlight('SELECTED');
      
      // Store for cleanup
      window.testEntities = [entity];
      
      return { 
        success: true, 
        highlightState: renderController._highlightState,
        hasEntity: true
      };
    });
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    await forceRedraw(page);
    await sleep(100);
    await captureEvidence(page, 'rendering/render_controller_selected', 'rendering', true);
    
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    await captureEvidence(page, 'rendering/render_controller_selected_fail', 'rendering', false);
    testsFailed++;
  }
}

async function test_HOVER_highlight(page) {
  const testName = 'HOVER highlight effect';
  const startTime = Date.now();
  try {
    const result = await page.evaluate(() => {
      if (window.testEntities) window.testEntities.forEach(e => e.destroy && e.destroy());
      window.testEntities = [];
      
      const entity = new Entity(500, 300, 64, 64);
      const renderController = entity.getController('render');
      
      if (!renderController) {
        return { success: false, error: 'RenderController not found' };
      }
      
      renderController.setHighlight('HOVER', 0.7);
      window.testEntities = [entity];
      
      return { success: true, highlightState: renderController._highlightState };
    });
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    await forceRedraw(page);
    await sleep(200);
    await captureEvidence(page, 'rendering/render_controller_hover', 'rendering', true);
    
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    await captureEvidence(page, 'rendering/render_controller_hover_fail', 'rendering', false);
    testsFailed++;
  }
}

async function test_COMBAT_highlight(page) {
  const testName = 'COMBAT highlight effect';
  const startTime = Date.now();
  try {
    const result = await page.evaluate(() => {
      if (window.testEntities) window.testEntities.forEach(e => e.destroy && e.destroy());
      window.testEntities = [];
      
      const entity = new Entity(350, 250, 64, 64);
      const renderController = entity.getController('render');
      
      if (!renderController) {
        return { success: false, error: 'RenderController not found' };
      }
      
      renderController.setHighlight('COMBAT');
      window.testEntities = [entity];
      
      return { success: true, highlightState: renderController._highlightState };
    });
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    await forceRedraw(page);
    await sleep(200);
    await captureEvidence(page, 'rendering/render_controller_combat', 'rendering', true);
    
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    await captureEvidence(page, 'rendering/render_controller_combat_fail', 'rendering', false);
    testsFailed++;
  }
}

async function test_Multiple_highlights(page) {
  const testName = 'Multiple highlights simultaneously';
  const startTime = Date.now();
  try {
    const result = await page.evaluate(() => {
      if (window.testEntities) window.testEntities.forEach(e => e.destroy && e.destroy());
      window.testEntities = [];
      
      const highlights = ['SELECTED', 'HOVER', 'COMBAT'];
      const entities = [];
      
      highlights.forEach((type, index) => {
        const x = 300 + (index * 100);
        const y = 300;
        const entity = new Entity(x, y, 64, 64);
        const renderController = entity.getController('render');
        
        if (!renderController) {
          return { success: false, error: 'RenderController not found' };
        }
        
        renderController.setHighlight(type);
        entities.push(entity);
      });
      
      window.testEntities = entities;
      
      return { success: true, count: entities.length };
    });
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    await forceRedraw(page);
    await sleep(200);
    await captureEvidence(page, 'rendering/render_controller_multiple', 'rendering', true);
    
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    await captureEvidence(page, 'rendering/render_controller_multiple_fail', 'rendering', false);
    testsFailed++;
  }
}

async function test_Highlight_animation(page) {
  const testName = 'Highlight animation updates';
  const startTime = Date.now();
  try {
    const result = await page.evaluate(() => {
      if (window.testEntities) window.testEntities.forEach(e => e.destroy && e.destroy());
      window.testEntities = [];
      
      const entity = new Entity(400, 300, 64, 64);
      const renderController = entity.getController('render');
      
      if (!renderController) {
        return { success: false, error: 'RenderController not found' };
      }
      
      // Set SELECTED highlight with pulse animation
      renderController.setHighlight('SELECTED');
      
      // Update several frames to show animation
      for (let i = 0; i < 5; i++) {
        renderController.update();
      }
      
      window.testEntities = [entity];
      
      return { 
        success: true, 
        bobOffset: renderController._bobOffset > 0
      };
    });
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    await forceRedraw(page);
    await sleep(200);
    await captureEvidence(page, 'rendering/render_controller_animation', 'rendering', true);
    
    console.log(`  ✅ PASS: ${testName} (${Date.now() - startTime}ms)`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${testName} (${Date.now() - startTime}ms) - ${error.message}`);
    await captureEvidence(page, 'rendering/render_controller_animation_fail', 'rendering', false);
    testsFailed++;
  }
}

async function runRenderControllerTests() {
  let browser;
  let page;

  console.log('\n' + '='.repeat(70));
  console.log('RenderController E2E Test Suite');
  console.log('='.repeat(70) + '\n');

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

    await test_SELECTED_highlight(page);
    await test_HOVER_highlight(page);
    await test_COMBAT_highlight(page);
    await test_Multiple_highlights(page);
    await test_Highlight_animation(page);

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

