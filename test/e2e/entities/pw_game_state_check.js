/**
 * E2E Test: Check current game state after loading
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  console.log('Loading game...');
  await page.goto('http://localhost:8000?test=1');
  await sleep(2000);
  
  // Load custom level
  console.log('Loading CaveTutorial.json...');
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
  
  console.log('Load result:', loadResult);
  await sleep(2000); // Wait longer
  
  // Check what exists
  const state = await page.evaluate(() => {
    return {
      windowAntsExists: typeof window.ants !== 'undefined',
      windowAntsIsArray: Array.isArray(window.ants),
      windowAntsLength: window.ants ? window.ants.length : null,
      bareAntsExists: typeof ants !== 'undefined',
      bareAntsIsArray: typeof ants !== 'undefined' && Array.isArray(ants),
      bareAntsLength: typeof ants !== 'undefined' && ants ? ants.length : null,
      gameState: typeof GameState !== 'undefined' ? GameState.getState() : null,
      levelLoaderExists: typeof window.levelLoader !== 'undefined',
      entityFactoryExists: typeof window.entityFactory !== 'undefined' || typeof window.EntityFactory !== 'undefined'
    };
  });
  
  console.log('\n=== Game State ===');
  console.log('window.ants exists:', state.windowAntsExists);
  console.log('window.ants is array:', state.windowAntsIsArray);
  console.log('window.ants.length:', state.windowAntsLength);
  console.log('bare ants exists:', state.bareAntsExists);
  console.log('bare ants is array:', state.bareAntsIsArray);
  console.log('bare ants.length:', state.bareAntsLength);
  console.log('GameState:', state.gameState);
  console.log('levelLoader exists:', state.levelLoaderExists);
  console.log('entityFactory exists:', state.entityFactoryExists);
  
  // Take screenshot
  await page.evaluate(() => {
    if (typeof window.redraw === 'function') {
      window.redraw();
      window.redraw();
      window.redraw();
    }
  });
  
  await sleep(500);
  await saveScreenshot(page, 'entities/game_state_check', true);
  console.log('\nScreenshot saved');
  
  await browser.close();
  process.exit(0);
})();
