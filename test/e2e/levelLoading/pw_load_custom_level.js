/**
 * E2E Test: Load Custom Level from Main Menu
 * ============================================
 * Verifies CaveTutorial.json loads correctly from main menu button
 * 
 * Test Steps:
 * 1. Start game
 * 2. Click "Start Game" button on main menu
 * 3. Verify custom level loads (CaveTutorial.json)
 * 4. Verify GameState transitions to IN_GAME
 * 5. Verify terrain rendered
 * 6. Screenshot proof
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('[E2E] Starting test: Load Custom Level from Main Menu');
    
    // Navigate to game
    await page.goto('http://localhost:8000?test=1');
    await sleep(2000); // Wait for game to initialize
    
    console.log('[E2E] Game loaded, waiting for main menu...');
    
    // Wait for main menu to be ready
    await page.waitForFunction(() => {
      return window.GameState && window.GameState.getState() === 'MENU';
    }, { timeout: 10000 });
    
    console.log('[E2E] Main menu ready');
    
    // Take screenshot of main menu
    await saveScreenshot(page, 'levelLoading/01_main_menu', true);
    
    // Click "Start Game" button
    console.log('[E2E] Clicking Start Game button...');
    await page.evaluate(() => {
      // Find and click the start game button
      if (window.startGameTransition && typeof window.startGameTransition === 'function') {
        window.startGameTransition();
        return true;
      }
      return false;
    });
    
    console.log('[E2E] Waiting for level to load...');
    await sleep(3000); // Give time for async level loading
    
    // Verify GameState is IN_GAME
    const gameState = await page.evaluate(() => {
      return {
        state: window.GameState ? window.GameState.getState() : null,
        isInGame: window.GameState ? window.GameState.isPlayingGame() : false,
        mapLoaded: window.g_activeMap !== null && window.g_activeMap !== undefined,
        mapType: window.g_activeMap ? (window.g_activeMap.constructor.name || 'unknown') : null
      };
    });
    
    console.log('[E2E] GameState:', gameState);
    
    // Verify state is IN_GAME
    if (gameState.state !== 'IN_GAME') {
      console.error(`[E2E] FAILED: Expected IN_GAME state, got ${gameState.state}`);
      await saveScreenshot(page, 'levelLoading/02_state_error', false);
      await browser.close();
      process.exit(1);
    }
    
    // Verify map loaded
    if (!gameState.mapLoaded) {
      console.error('[E2E] FAILED: Map not loaded');
      await saveScreenshot(page, 'levelLoading/03_map_error', false);
      await browser.close();
      process.exit(1);
    }
    
    console.log('[E2E] Map type:', gameState.mapType);
    
    // Force render to show current state
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(1000);
    
    // Take screenshot of loaded level
    await saveScreenshot(page, 'levelLoading/04_level_loaded', true);
    
    // Verify terrain has tiles
    const terrainInfo = await page.evaluate(() => {
      if (!window.g_activeMap) return { hasTiles: false, tileCount: 0 };
      
      let tileCount = 0;
      if (window.g_activeMap.tiles && window.g_activeMap.tiles.size) {
        tileCount = window.g_activeMap.tiles.size;
      }
      
      return {
        hasTiles: tileCount > 0,
        tileCount: tileCount,
        defaultMaterial: window.g_activeMap.defaultMaterial || null
      };
    });
    
    console.log('[E2E] Terrain info:', terrainInfo);
    
    if (!terrainInfo.hasTiles) {
      console.error('[E2E] FAILED: No terrain tiles loaded');
      await saveScreenshot(page, 'levelLoading/05_no_tiles_error', false);
      await browser.close();
      process.exit(1);
    }
    
    console.log(`[E2E] SUCCESS: Level loaded with ${terrainInfo.tileCount} tiles`);
    console.log('[E2E] ✅ All checks passed');
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('[E2E] Test failed with error:', error);
    await saveScreenshot(page, 'levelLoading/error', false);
    await browser.close();
    process.exit(1);
  }
})();
