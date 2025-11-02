/**
 * E2E Test: Camera Following Queen in Custom Level
 * =================================================
 * Verifies camera tracks queen movement in loaded custom level
 * 
 * Test Steps:
 * 1. Load custom level
 * 2. Verify IN_GAME state
 * 3. Verify queen exists
 * 4. Record initial camera position
 * 5. Record initial queen position
 * 6. Command queen to move
 * 7. Wait for movement
 * 8. Verify camera followed queen (camera position changed)
 * 9. Screenshot proof
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('[E2E] Starting test: Camera Following Queen');
    
    // Navigate and load level
    await page.goto('http://localhost:8000?test=1');
    await sleep(2000);
    
    // Wait for menu
    await page.waitForFunction(() => {
      return window.GameState && window.GameState.getState() === 'MENU';
    }, { timeout: 10000 });
    
    // Start game (loads custom level)
    await page.evaluate(() => {
      if (window.startGameTransition) {
        window.startGameTransition();
      }
    });
    
    await sleep(3000); // Wait for level to load
    
    // Verify IN_GAME state
    const gameState = await page.evaluate(() => {
      return window.GameState ? window.GameState.getState() : null;
    });
    
    if (gameState !== 'IN_GAME') {
      console.error(`[E2E] FAILED: Expected IN_GAME, got ${gameState}`);
      await saveScreenshot(page, 'cameraFollowing/01_state_error', false);
      await browser.close();
      process.exit(1);
    }
    
    console.log('[E2E] IN_GAME state confirmed');
    
    // Get initial positions
    const initialState = await page.evaluate(() => {
      const queen = window.queenAnt;
      if (!queen) {
        return { queenFound: false };
      }
      
      const camera = window.cameraManager;
      if (!camera) {
        return { queenFound: true, cameraFound: false };
      }
      
      return {
        queenFound: true,
        cameraFound: true,
        queenX: queen.x,
        queenY: queen.y,
        cameraX: camera.x || 0,
        cameraY: camera.y || 0,
        followEnabled: camera.cameraFollowEnabled || false,
        followTarget: camera.cameraFollowTarget ? true : false
      };
    });
    
    if (!initialState.queenFound) {
      console.error('[E2E] FAILED: Queen not found');
      await saveScreenshot(page, 'cameraFollowing/02_no_queen_error', false);
      await browser.close();
      process.exit(1);
    }
    
    if (!initialState.cameraFound) {
      console.error('[E2E] FAILED: CameraManager not found');
      await saveScreenshot(page, 'cameraFollowing/03_no_camera_error', false);
      await browser.close();
      process.exit(1);
    }
    
    console.log('[E2E] Initial state:');
    console.log('  Queen:', initialState.queenX, initialState.queenY);
    console.log('  Camera:', initialState.cameraX, initialState.cameraY);
    console.log('  Follow enabled:', initialState.followEnabled);
    console.log('  Follow target:', initialState.followTarget);
    
    // Take screenshot of initial state
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    await sleep(500);
    await saveScreenshot(page, 'cameraFollowing/04_initial_state', true);
    
    // Command queen to move far away (200 pixels)
    const targetX = initialState.queenX + 200;
    const targetY = initialState.queenY + 200;
    
    console.log('[E2E] Commanding queen to move to:', targetX, targetY);
    
    await page.evaluate(({ tx, ty }) => {
      const queen = window.queenAnt;
      if (queen && queen.moveToLocation) {
        queen.moveToLocation(tx, ty);
      }
    }, { tx: targetX, ty: targetY });
    
    // Wait for movement (3 seconds)
    await sleep(3000);
    
    // Force render
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    await sleep(500);
    
    // Take screenshot during movement
    await saveScreenshot(page, 'cameraFollowing/05_during_movement', true);
    
    // Wait more for queen to move further
    await sleep(2000);
    
    // Get final positions
    const finalState = await page.evaluate(() => {
      const queen = window.queenAnt;
      const camera = window.cameraManager;
      
      if (!queen || !camera) {
        return { error: 'Missing queen or camera' };
      }
      
      return {
        queenX: queen.x,
        queenY: queen.y,
        cameraX: camera.x || 0,
        cameraY: camera.y || 0,
        followEnabled: camera.cameraFollowEnabled || false
      };
    });
    
    if (finalState.error) {
      console.error('[E2E] FAILED:', finalState.error);
      await saveScreenshot(page, 'cameraFollowing/06_missing_objects_error', false);
      await browser.close();
      process.exit(1);
    }
    
    console.log('[E2E] Final state:');
    console.log('  Queen:', finalState.queenX, finalState.queenY);
    console.log('  Camera:', finalState.cameraX, finalState.cameraY);
    
    // Calculate distances moved
    const queenDistance = Math.sqrt(
      Math.pow(finalState.queenX - initialState.queenX, 2) +
      Math.pow(finalState.queenY - initialState.queenY, 2)
    );
    
    const cameraDistance = Math.sqrt(
      Math.pow(finalState.cameraX - initialState.cameraX, 2) +
      Math.pow(finalState.cameraY - initialState.cameraY, 2)
    );
    
    console.log('[E2E] Queen moved:', queenDistance.toFixed(2), 'pixels');
    console.log('[E2E] Camera moved:', cameraDistance.toFixed(2), 'pixels');
    
    // Verify queen moved (at least 50 pixels)
    if (queenDistance < 50) {
      console.error('[E2E] FAILED: Queen did not move enough (< 50 pixels)');
      await saveScreenshot(page, 'cameraFollowing/07_queen_no_move_error', false);
      await browser.close();
      process.exit(1);
    }
    
    // Verify camera followed (moved at least 30 pixels)
    if (cameraDistance < 30) {
      console.error('[E2E] FAILED: Camera did not follow queen (< 30 pixels movement)');
      console.error('[E2E] Camera follow enabled:', finalState.followEnabled);
      await saveScreenshot(page, 'cameraFollowing/08_camera_no_follow_error', false);
      await browser.close();
      process.exit(1);
    }
    
    // Take final screenshot
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    await sleep(500);
    await saveScreenshot(page, 'cameraFollowing/09_final_state', true);
    
    console.log('[E2E] SUCCESS: Camera followed queen');
    console.log('[E2E] - Queen moved:', queenDistance.toFixed(2), 'pixels');
    console.log('[E2E] - Camera moved:', cameraDistance.toFixed(2), 'pixels');
    console.log('[E2E] ✅ All checks passed');
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('[E2E] Test failed with error:', error);
    await saveScreenshot(page, 'cameraFollowing/error', false);
    await browser.close();
    process.exit(1);
  }
})();
