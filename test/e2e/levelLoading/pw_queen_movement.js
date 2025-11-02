/**
 * E2E Test: Queen Movement in IN_GAME State
 * ==========================================
 * Verifies queen ant can move in custom loaded level
 * 
 * Test Steps:
 * 1. Load game with custom level
 * 2. Verify IN_GAME state
 * 3. Find queen ant
 * 4. Record initial position
 * 5. Command queen to move to new location
 * 6. Wait for movement
 * 7. Verify position changed
 * 8. Screenshot proof
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('[E2E] Starting test: Queen Movement in IN_GAME');
    
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
      await saveScreenshot(page, 'queenMovement/01_state_error', false);
      await browser.close();
      process.exit(1);
    }
    
    console.log('[E2E] IN_GAME state confirmed');
    
    // Find queen ant and get initial position
    const queenInfo = await page.evaluate(() => {
      const queen = window.queenAnt || null;
      if (!queen) {
        return { found: false };
      }
      
      return {
        found: true,
        initialX: queen.x,
        initialY: queen.y,
        id: queen.id || 'unknown'
      };
    });
    
    if (!queenInfo.found) {
      console.error('[E2E] FAILED: Queen ant not found');
      await saveScreenshot(page, 'queenMovement/02_no_queen_error', false);
      await browser.close();
      process.exit(1);
    }
    
    console.log('[E2E] Queen found at position:', queenInfo.initialX, queenInfo.initialY);
    
    // Take screenshot of initial state
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    await sleep(500);
    await saveScreenshot(page, 'queenMovement/03_initial_position', true);
    
    // Command queen to move to new location (100 pixels away)
    const targetX = queenInfo.initialX + 100;
    const targetY = queenInfo.initialY + 100;
    
    console.log('[E2E] Commanding queen to move to:', targetX, targetY);
    
    await page.evaluate(({ tx, ty }) => {
      const queen = window.queenAnt;
      if (queen && queen.moveToLocation && typeof queen.moveToLocation === 'function') {
        queen.moveToLocation(tx, ty);
        console.log('[Game] Queen commanded to move');
      } else {
        console.error('[Game] Queen moveToLocation not available');
      }
    }, { tx: targetX, ty: targetY });
    
    // Wait for movement (2 seconds)
    await sleep(2000);
    
    // Force render
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    await sleep(500);
    
    // Take screenshot during movement
    await saveScreenshot(page, 'queenMovement/04_moving', true);
    
    // Wait more for queen to reach destination
    await sleep(3000);
    
    // Get final position
    const finalPosition = await page.evaluate(() => {
      const queen = window.queenAnt;
      if (!queen) return { found: false };
      
      return {
        found: true,
        finalX: queen.x,
        finalY: queen.y,
        isMoving: queen.isMoving || false
      };
    });
    
    if (!finalPosition.found) {
      console.error('[E2E] FAILED: Queen disappeared during movement');
      await saveScreenshot(page, 'queenMovement/05_queen_lost_error', false);
      await browser.close();
      process.exit(1);
    }
    
    console.log('[E2E] Queen final position:', finalPosition.finalX, finalPosition.finalY);
    
    // Calculate distance moved
    const distanceMoved = Math.sqrt(
      Math.pow(finalPosition.finalX - queenInfo.initialX, 2) +
      Math.pow(finalPosition.finalY - queenInfo.initialY, 2)
    );
    
    console.log('[E2E] Distance moved:', distanceMoved.toFixed(2), 'pixels');
    
    // Verify position changed (moved at least 10 pixels)
    if (distanceMoved < 10) {
      console.error('[E2E] FAILED: Queen did not move (distance < 10 pixels)');
      await saveScreenshot(page, 'queenMovement/06_no_movement_error', false);
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
    await saveScreenshot(page, 'queenMovement/07_final_position', true);
    
    console.log('[E2E] SUCCESS: Queen moved', distanceMoved.toFixed(2), 'pixels');
    console.log('[E2E] ✅ All checks passed');
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('[E2E] Test failed with error:', error);
    await saveScreenshot(page, 'queenMovement/error', false);
    await browser.close();
    process.exit(1);
  }
})();
