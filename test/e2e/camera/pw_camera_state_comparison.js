/**
 * E2E Test: Camera Behavior - PLAYING vs IN_GAME State
 * 
 * PURPOSE: Document differences in camera behavior between game states
 * 
 * BACKGROUND:
 * - "PLAYING" state: Original procedural terrain (GridTerrain)
 * - "IN_GAME" state: Custom level loading (SparseTerrain from JSON)
 * 
 * CAMERA BEHAVIORS TO TEST:
 * 1. Camera initialization (where does camera start?)
 * 2. Camera controls (arrow keys, WASD, middle-click pan)
 * 3. Camera following (auto-track entities)
 * 4. Camera bounds (clamping to map edges)
 * 5. Camera zoom limits (different min zoom for editor vs game)
 * 
 * EXPECTED ISSUES:
 * - IN_GAME state may not update camera properly
 * - SparseTerrain may not have same camera APIs as GridTerrain
 * - Camera bounds may not work with custom levels
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const path = require('path');

(async () => {
  console.log('\n=== E2E Test: Camera State Comparison ===\n');

  const browser = await launchBrowser();
  const page = await browser.newPage();

  try {
    // Navigate to game
    await page.goto('http://localhost:8000?test=1');
    await sleep(2000);

    console.log('[E2E] ===== PART 1: PLAYING State (Procedural) =====\n');

    // Start normal game (PLAYING state)
    console.log('[E2E] Step 1: Starting normal game (PLAYING state)...');
    await page.evaluate(() => {
      if (typeof GameState !== 'undefined' && GameState.goToGame) {
        GameState.goToGame();
      }
    });
    await sleep(2000);

    // Get PLAYING state camera info
    const playingCameraInfo = await page.evaluate(() => {
      return {
        state: typeof GameState !== 'undefined' ? GameState.getState() : 'unknown',
        cameraX: typeof cameraManager !== 'undefined' ? cameraManager.cameraX : null,
        cameraY: typeof cameraManager !== 'undefined' ? cameraManager.cameraY : null,
        cameraZoom: typeof cameraManager !== 'undefined' ? cameraManager.cameraZoom : null,
        minZoom: typeof cameraManager !== 'undefined' ? cameraManager.MIN_CAMERA_ZOOM_PLAYING : null,
        terrainType: typeof g_activeMap !== 'undefined' ? g_activeMap.constructor.name : null,
        hasSetCameraPosition: typeof g_activeMap !== 'undefined' && typeof g_activeMap.setCameraPosition === 'function',
        updateMethodCalled: typeof cameraManager !== 'undefined' && cameraManager.isInGame ? cameraManager.isInGame() : null
      };
    });
    console.log('[E2E] PLAYING state camera:', JSON.stringify(playingCameraInfo, null, 2));

    // Test camera controls in PLAYING state
    const playingInitialX = playingCameraInfo.cameraX;
    await page.keyboard.press('ArrowRight');
    await sleep(100);
    
    const playingCameraAfterInput = await page.evaluate(() => {
      return {
        cameraX: typeof cameraManager !== 'undefined' ? cameraManager.cameraX : null,
        moved: true
      };
    });
    const playingCameraMoved = playingCameraAfterInput.cameraX !== playingInitialX;
    console.log(`[E2E] PLAYING camera responds to input: ${playingCameraMoved ? '✅' : '❌'}`);

    // Screenshot PLAYING state
    const playingScreenshotPath = path.join(__dirname, '../screenshots/camera/camera_state_playing.png');
    await page.screenshot({ path: playingScreenshotPath });
    console.log(`[E2E] Screenshot saved: ${playingScreenshotPath}`);

    console.log('\n[E2E] ===== PART 2: IN_GAME State (Custom Level) =====\n');

    // Reload page for fresh start
    await page.reload();
    await sleep(2000);

    // Load custom level (IN_GAME state)
    console.log('[E2E] Step 2: Loading custom level (IN_GAME state)...');
    await page.evaluate(() => {
      if (typeof loadCustomLevel === 'function') {
        loadCustomLevel('levels/CaveTutorial.json');
      }
    });
    await sleep(3000);

    // Get IN_GAME state camera info
    const inGameCameraInfo = await page.evaluate(() => {
      return {
        state: typeof GameState !== 'undefined' ? GameState.getState() : 'unknown',
        cameraX: typeof cameraManager !== 'undefined' ? cameraManager.cameraX : null,
        cameraY: typeof cameraManager !== 'undefined' ? cameraManager.cameraY : null,
        cameraZoom: typeof cameraManager !== 'undefined' ? cameraManager.cameraZoom : null,
        minZoom: typeof cameraManager !== 'undefined' ? cameraManager.MIN_CAMERA_ZOOM_PLAYING : null,
        terrainType: typeof g_activeMap !== 'undefined' ? g_activeMap.constructor.name : null,
        hasSetCameraPosition: typeof g_activeMap !== 'undefined' && typeof g_activeMap.setCameraPosition === 'function',
        updateMethodCalled: typeof cameraManager !== 'undefined' && cameraManager.isInGame ? cameraManager.isInGame() : null,
        queenExists: typeof window.queenAnt !== 'undefined' && window.queenAnt !== null
      };
    });
    console.log('[E2E] IN_GAME state camera:', JSON.stringify(inGameCameraInfo, null, 2));

    // Test camera controls in IN_GAME state
    const inGameInitialX = inGameCameraInfo.cameraX;
    await page.keyboard.press('ArrowRight');
    await sleep(100);
    
    const inGameCameraAfterInput = await page.evaluate(() => {
      return {
        cameraX: typeof cameraManager !== 'undefined' ? cameraManager.cameraX : null,
        moved: true
      };
    });
    const inGameCameraMoved = inGameCameraAfterInput.cameraX !== inGameInitialX;
    console.log(`[E2E] IN_GAME camera responds to input: ${inGameCameraMoved ? '✅' : '❌'}`);

    // Screenshot IN_GAME state
    const inGameScreenshotPath = path.join(__dirname, '../screenshots/camera/camera_state_ingame.png');
    await page.screenshot({ path: inGameScreenshotPath });
    console.log(`[E2E] Screenshot saved: ${inGameScreenshotPath}`);

    console.log('\n[E2E] ===== COMPARISON RESULTS =====\n');

    // Compare behaviors
    const comparison = {
      stateMatch: playingCameraInfo.state === 'PLAYING' && inGameCameraInfo.state === 'IN_GAME',
      terrainTypeDifferent: playingCameraInfo.terrainType !== inGameCameraInfo.terrainType,
      bothHaveSetCameraPosition: playingCameraInfo.hasSetCameraPosition && inGameCameraInfo.hasSetCameraPosition,
      playingCameraWorks: playingCameraMoved,
      inGameCameraWorks: inGameCameraMoved,
      cameraBreaksInInGame: playingCameraMoved && !inGameCameraMoved
    };

    console.log('State detection:', comparison.stateMatch ? '✅' : '❌');
    console.log(`PLAYING terrain: ${playingCameraInfo.terrainType}`);
    console.log(`IN_GAME terrain: ${inGameCameraInfo.terrainType}`);
    console.log(`Terrain types differ: ${comparison.terrainTypeDifferent ? '✅' : '❌'}`);
    console.log(`\nCamera controls:`);
    console.log(`  PLAYING state: ${comparison.playingCameraWorks ? '✅ Working' : '❌ Broken'}`);
    console.log(`  IN_GAME state: ${comparison.inGameCameraWorks ? '✅ Working' : '❌ Broken'}`);
    console.log(`\nCamera breaks in IN_GAME: ${comparison.cameraBreaksInInGame ? '⚠️ YES - BUG CONFIRMED' : '✅ No'}`);

    // Check update method
    console.log(`\nCamera update method check:`);
    console.log(`  PLAYING isInGame(): ${playingCameraInfo.updateMethodCalled}`);
    console.log(`  IN_GAME isInGame(): ${inGameCameraInfo.updateMethodCalled}`);

    const success = comparison.stateMatch && comparison.playingCameraWorks && comparison.inGameCameraWorks;

    await browser.close();
    process.exit(success ? 0 : 1);

  } catch (error) {
    console.error('[E2E] Test failed:', error);
    await browser.close();
    process.exit(1);
  }
})();
