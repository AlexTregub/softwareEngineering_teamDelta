/**
 * E2E Test: Camera Behavior in Custom Levels (IN_GAME state)
 * 
 * Tests:
 * 1. Camera jumps to queen on level load
 * 2. Camera follows queen continuously
 * 3. Arrow keys are DISABLED (no manual camera control)
 * 4. Camera respects level bounds (SparseTerrain)
 * 5. Visual verification via screenshots
 */

const path = require('path');
const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  let browser, page;
  
  try {
    console.log('[E2E] Starting camera custom level test...\n');
    
    browser = await launchBrowser();
    page = await browser.newPage();
    
    // Capture console logs
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[CameraManager]') || 
          text.includes('[loadCustomLevel]') ||
          text.includes('Arrow key test')) {
        console.log(`[PAGE] ${text}`);
      }
    });
    
    // Navigate to game
    await page.goto('http://localhost:8000?test=1');
    await sleep(1000);
    
    // Step 1: Load custom level and ensure IN_GAME state
    console.log('[E2E] Step 1: Loading custom level...');
    const levelLoaded = await cameraHelper.ensureGameStarted(page, 'levels/CaveTutorial.json');
    
    if (!levelLoaded.started) {
      throw new Error('Failed to load custom level');
    }
    
    const gameState = await page.evaluate(() => {
      return {
        state: window.GameState ? window.GameState.getState() : 'unknown',
        isInGame: window.GameState ? window.GameState.isInGame() : false
      };
    });
    
    console.log('[E2E] Game state:', gameState);
    
    if (gameState.state !== 'IN_GAME') {
      throw new Error(`Expected IN_GAME state, got: ${gameState.state}`);
    }
    
    // Give time for camera to center, and force camera updates
    await page.evaluate(() => {
      if (typeof cameraManager !== 'undefined') {
        cameraManager.update();
        cameraManager.update();
      }
      if (typeof redraw === 'function') {
        redraw();
        redraw();
      }
    });
    
    await sleep(500);
    
    // Step 2: Verify queen exists and camera is centered on her
    console.log('\n[E2E] Step 2: Verifying camera centered on queen...');
    const queenInfo = await page.evaluate(() => {
      const queen = window.queenAnt;
      if (!queen) return { exists: false };
      
      return {
        exists: true,
        x: queen.x,
        y: queen.y,
        centerX: queen.x + (queen.width || 60) / 2,
        centerY: queen.y + (queen.height || 60) / 2
      };
    });
    
    if (!queenInfo.exists) {
      throw new Error('Queen not found in custom level');
    }
    
    console.log('[E2E] Queen position:', queenInfo);
    
    const cameraInfo1 = await page.evaluate(() => {
      if (typeof cameraManager === 'undefined') {
        return { exists: false };
      }
      return {
        exists: true,
        x: cameraManager.cameraX,
        y: cameraManager.cameraY,
        zoom: cameraManager.cameraZoom,
        followEnabled: cameraManager.cameraFollowEnabled,
        followTarget: cameraManager.cameraFollowTarget ? cameraManager.cameraFollowTarget.id : null,
        canvasWidth: cameraManager.canvasWidth,
        canvasHeight: cameraManager.canvasHeight
      };
    });
    
    console.log('[E2E] Initial camera:', cameraInfo1);
    
    if (!cameraInfo1.exists) {
      throw new Error('Camera manager not found');
    }
    
    // Verify camera is centered on queen
    // Use actual canvas dimensions from cameraManager
    const expectedCameraX = queenInfo.centerX - (cameraInfo1.canvasWidth / cameraInfo1.zoom / 2);
    const expectedCameraY = queenInfo.centerY - (cameraInfo1.canvasHeight / cameraInfo1.zoom / 2);
    const deltaX = Math.abs(cameraInfo1.x - expectedCameraX);
    const deltaY = Math.abs(cameraInfo1.y - expectedCameraY);
    const isCentered = deltaX < 100 && deltaY < 100; // Increased tolerance for initial centering
    
    console.log('[E2E] Camera centering check:', {
      expected: { x: expectedCameraX, y: expectedCameraY },
      actual: { x: cameraInfo1.x, y: cameraInfo1.y },
      delta: { x: deltaX, y: deltaY },
      isCentered
    });
    
    await saveScreenshot(page, 'camera/custom_level_initial_centered', isCentered);
    
    // Step 3: Test arrow keys (should be DISABLED)
    console.log('\n[E2E] Step 3: Testing arrow keys (should be DISABLED)...');
    
    const initialCameraX = cameraInfo1.x;
    const initialCameraY = cameraInfo1.y;
    
    // Press RIGHT arrow multiple times
    await page.evaluate(() => {
      console.log('[E2E] Arrow key test: Pressing RIGHT arrow');
    });
    
    for (let i = 0; i < 5; i++) {
      await page.keyboard.down('ArrowRight');
      await sleep(50);
      await page.keyboard.up('ArrowRight');
      await sleep(50);
    }
    
    await sleep(200);
    
    const cameraAfterArrows = await page.evaluate(() => {
      if (typeof cameraManager === 'undefined') {
        return { exists: false };
      }
      return {
        exists: true,
        x: cameraManager.cameraX,
        y: cameraManager.cameraY,
        followEnabled: cameraManager.cameraFollowEnabled
      };
    });
    
    console.log('[E2E] Camera after arrow keys:', cameraAfterArrows);
    
    const cameraMovedByArrows = Math.abs(cameraAfterArrows.x - initialCameraX) > 10;
    const followStillEnabled = cameraAfterArrows.followEnabled;
    
    console.log('[E2E] Arrow key results:', {
      cameraMoved: cameraMovedByArrows,
      followStillEnabled: followStillEnabled,
      expected: { cameraMoved: false, followEnabled: true }
    });
    
    await saveScreenshot(page, 'camera/custom_level_arrows_disabled', !cameraMovedByArrows && followStillEnabled);
    
    // Step 4: Test camera following by moving queen
    console.log('\n[E2E] Step 4: Testing camera following queen movement...');
    
    await page.evaluate(() => {
      // Move queen to new position
      if (window.queenAnt) {
        console.log('[E2E] Moving queen to test camera follow');
        window.queenAnt.x = 1500;
        window.queenAnt.y = 700;
        
        // Force camera update
        if (typeof cameraManager !== 'undefined') {
          cameraManager.update();
        }
        
        // Force redraw
        if (typeof window.redraw === 'function') {
          window.redraw();
          window.redraw();
          window.redraw();
        }
      }
    });
    
    await sleep(300);
    
    const cameraAfterQueenMove = await page.evaluate(() => {
      if (typeof cameraManager === 'undefined') {
        return { exists: false };
      }
      const queen = window.queenAnt;
      
      const queenCenterX = queen.x + (queen.width || 60) / 2;
      const queenCenterY = queen.y + (queen.height || 60) / 2;
      const expectedCamX = queenCenterX - (800 / cameraManager.cameraZoom / 2);
      const expectedCamY = queenCenterY - (600 / cameraManager.cameraZoom / 2);
      
      return {
        exists: true,
        cameraX: cameraManager.cameraX,
        cameraY: cameraManager.cameraY,
        queenX: queen.x,
        queenY: queen.y,
        expectedCameraX: expectedCamX,
        expectedCameraY: expectedCamY,
        deltaX: Math.abs(cameraManager.cameraX - expectedCamX),
        deltaY: Math.abs(cameraManager.cameraY - expectedCamY)
      };
    });
    
    console.log('[E2E] Camera after queen moved:', cameraAfterQueenMove);
    
    const cameraFollowedQueen = cameraAfterQueenMove.deltaX < 50 && cameraAfterQueenMove.deltaY < 50;
    
    await saveScreenshot(page, 'camera/custom_level_camera_following', cameraFollowedQueen);
    
    // Step 5: Test camera bounds clamping
    console.log('\n[E2E] Step 5: Testing level bounds clamping...');
    
    const boundsTest = await page.evaluate(() => {
      if (typeof cameraManager === 'undefined') {
        return { exists: false };
      }
      const level = cameraManager.currentLevel || window.g_activeMap;
      
      if (!level || !level.getWorldBounds) {
        return { success: false, error: 'No level or getWorldBounds method' };
      }
      
      const bounds = level.getWorldBounds();
      
      // Try to move camera beyond bounds
      cameraManager.cameraX = 10000;
      cameraManager.cameraY = 10000;
      cameraManager.clampToBounds();
      
      const maxX = bounds.width - (800 / cameraManager.cameraZoom);
      const maxY = bounds.height - (600 / cameraManager.cameraZoom);
      
      return {
        exists: true,
        success: true,
        levelBounds: bounds,
        maxCameraX: maxX,
        maxCameraY: maxY,
        actualCameraX: cameraManager.cameraX,
        actualCameraY: cameraManager.cameraY,
        clamped: cameraManager.cameraX <= maxX && cameraManager.cameraY <= maxY
      };
    });
    
    console.log('[E2E] Bounds clamping test:', boundsTest);
    
    await saveScreenshot(page, 'camera/custom_level_bounds_clamping', boundsTest.success && boundsTest.clamped);
    
    // Final results
    console.log('\n=== TEST RESULTS ===');
    console.log(`Game state is IN_GAME: ${gameState.state === 'IN_GAME' ? '✅' : '❌'}`);
    console.log(`Camera centered on queen: ${isCentered ? '✅' : '❌'}`);
    console.log(`Arrow keys disabled: ${!cameraMovedByArrows ? '✅' : '❌'}`);
    console.log(`Follow mode maintained: ${followStillEnabled ? '✅' : '❌'}`);
    console.log(`Camera follows queen: ${cameraFollowedQueen ? '✅' : '❌'}`);
    console.log(`Level bounds clamping: ${boundsTest.clamped ? '✅' : '❌'}`);
    
    const allTestsPassed = 
      gameState.state === 'IN_GAME' &&
      isCentered &&
      !cameraMovedByArrows &&
      followStillEnabled &&
      cameraFollowedQueen &&
      boundsTest.clamped;
    
    console.log(`\n${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    await browser.close();
    process.exit(allTestsPassed ? 0 : 1);
    
  } catch (error) {
    console.error('[E2E] Test failed:', error);
    if (page) {
      await saveScreenshot(page, 'camera/custom_level_error', false);
    }
    if (browser) await browser.close();
    process.exit(1);
  }
})();
