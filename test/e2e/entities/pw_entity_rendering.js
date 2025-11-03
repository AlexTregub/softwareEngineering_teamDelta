/**
 * E2E Test: Entity Rendering in Custom Levels
 * 
 * Tests that entities from CaveTutorial.json are loaded and rendered in the game.
 * 
 * CRITICAL: Uses REAL user flow (load level, check rendering)
 * Provides screenshot proof of success/failure.
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('[E2E] Loading game...');
    await page.goto('http://localhost:8000?test=1');
    await sleep(2000); // Wait for initial load
    
    // Test 1: Load custom level
    console.log('[E2E] Test 1: Loading CaveTutorial.json...');
    const loadResult = await page.evaluate(async () => {
      if (typeof loadCustomLevel === 'function') {
        const result = await loadCustomLevel('levels/CaveTutorial.json');
        return {
          success: result,
          gameState: typeof GameState !== 'undefined' ? GameState.getState() : 'unknown'
        };
      }
      return { success: false, error: 'loadCustomLevel not available' };
    });
    
    console.log('[E2E] Load result:', loadResult);
    await sleep(1000);
    
    // Test 2: Check if entities were loaded into ants[] array
    console.log('[E2E] Test 2: Checking ants[] array...');
    const antsCheck = await page.evaluate(() => {
      return {
        antsArrayExists: typeof window.ants !== 'undefined',
        antsCount: Array.isArray(window.ants) ? window.ants.length : 0,
        firstAnt: Array.isArray(window.ants) && window.ants.length > 0 ? {
          type: window.ants[0].type,
          id: window.ants[0].id,
          x: window.ants[0].x,
          y: window.ants[0].y,
          position: window.ants[0].position
        } : null
      };
    });
    
    console.log('[E2E] Ants array check:', antsCheck);
    
    // Test 3: Force rendering and take screenshot
    console.log('[E2E] Test 3: Forcing redraw and capturing screenshot...');
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    await sleep(500);
    
    // Take screenshot
    const testPassed = antsCheck.antsCount > 0;
    await saveScreenshot(page, 'entities/entity_rendering', testPassed);
    
    // Test 4: Count rendered entities vs expected
    console.log('[E2E] Test 4: Verifying entity count...');
    const expectedAnts = 7; // 1 queen + 6 workers from CaveTutorial.json
    const success = antsCheck.antsCount === expectedAnts;
    
    console.log(`[E2E] Expected ${expectedAnts} ants, found ${antsCheck.antsCount}`);
    console.log(success ? '✅ TEST PASSED' : '❌ TEST FAILED');
    
    await browser.close();
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('[E2E] Test error:', error);
    await saveScreenshot(page, 'entities/entity_rendering_error', false);
    await browser.close();
    process.exit(1);
  }
})();
