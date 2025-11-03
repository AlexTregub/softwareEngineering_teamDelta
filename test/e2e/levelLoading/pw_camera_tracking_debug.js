/**
 * E2E Test: Camera Tracking Debug
 * ================================
 * Debug test to identify why camera is not tracking queen ant on game start
 * 
 * BUG REPORT:
 * - Camera should automatically follow queen ant when IN_GAME state reached
 * - Currently camera is not following queen
 * 
 * TEST STRATEGY:
 * - Verify queen entity exists in loaded entities
 * - Verify findQueen() utility works
 * - Verify CameraManager.followEntity() is called
 * - Verify cameraFollowEnabled is true
 * - Verify cameraFollowTarget is set to queen
 * - Screenshot proof at each stage
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('\n=== E2E Test: Camera Tracking Debug ===\n');
    
    // Enable console logging from page
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[loadCustomLevel]') || 
          text.includes('Camera') || 
          text.includes('queen') ||
          text.includes('follow')) {
        console.log(`[PAGE] ${text}`);
      }
    });
    
    // Navigate and wait for menu
    await page.goto('http://localhost:8000?test=1');
    await sleep(2000);
    
    console.log('[E2E] Step 1: Waiting for main menu...');
    await page.waitForFunction(() => {
      return window.GameState && window.GameState.getState() === 'MENU';
    }, { timeout: 10000 });
    console.log('[E2E] ✅ Main menu ready\n');
    
    // Start game
    console.log('[E2E] Step 2: Starting game...');
    await page.evaluate(() => {
      if (window.startGameTransition) {
        window.startGameTransition();
      }
    });
    
    await sleep(3000);
    
    // Check game state
    const gameState = await page.evaluate(() => {
      return window.GameState ? window.GameState.getState() : null;
    });
    
    if (gameState !== 'IN_GAME') {
      console.error(`[E2E] ❌ Game state error: ${gameState}`);
      await saveScreenshot(page, 'cameraTrackingDebug/01_state_error', false);
      await browser.close();
      process.exit(1);
    }
    
    console.log('[E2E] ✅ IN_GAME state confirmed\n');
    
    // DEBUG: Check for queen in window.queenAnt
    console.log('[E2E] Step 3: Checking window.queenAnt...');
    const queenCheck = await page.evaluate(() => {
      return {
        queenAntExists: typeof window.queenAnt !== 'undefined',
        queenAntValue: window.queenAnt ? {
          type: window.queenAnt.type,
          x: window.queenAnt.x,
          y: window.queenAnt.y,
          position: window.queenAnt.position
        } : null
      };
    });
    
    console.log('[E2E] window.queenAnt exists:', queenCheck.queenAntExists);
    console.log('[E2E] window.queenAnt value:', JSON.stringify(queenCheck.queenAntValue, null, 2));
    
    // DEBUG: Check CameraManager state
    console.log('\n[E2E] Step 4: Checking CameraManager state...');
    const cameraState = await page.evaluate(() => {
      const camera = window.cameraManager;
      if (!camera) return { exists: false };
      
      return {
        exists: true,
        followEnabled: camera.cameraFollowEnabled,
        hasTarget: camera.cameraFollowTarget ? true : false,
        targetType: camera.cameraFollowTarget?.type,
        targetPosition: camera.cameraFollowTarget ? {
          x: camera.cameraFollowTarget.x,
          y: camera.cameraFollowTarget.y
        } : null,
        cameraX: camera.x,
        cameraY: camera.y,
        hasFollowEntityMethod: typeof camera.followEntity === 'function'
      };
    });
    
    console.log('[E2E] CameraManager exists:', cameraState.exists);
    console.log('[E2E] followEnabled:', cameraState.followEnabled);
    console.log('[E2E] hasTarget:', cameraState.hasTarget);
    console.log('[E2E] targetType:', cameraState.targetType);
    console.log('[E2E] targetPosition:', cameraState.targetPosition);
    console.log('[E2E] cameraPosition:', cameraState.cameraX, cameraState.cameraY);
    console.log('[E2E] hasFollowEntityMethod:', cameraState.hasFollowEntityMethod);
    
    // DEBUG: Manually test findQueen
    console.log('\n[E2E] Step 5: Testing findQueen() manually...');
    const findQueenTest = await page.evaluate(() => {
      // Try to find queen detection utility
      const findQueen = window.queenDetection?.findQueen || window.findQueen;
      
      if (!findQueen) {
        return { error: 'findQueen not available' };
      }
      
      // Create test entities array
      const testEntities = [
        { id: 'ant1', type: 'Ant', x: 100, y: 100 },
        { id: 'queen1', type: 'Queen', x: 200, y: 200 },
        { id: 'ant2', type: 'Ant', x: 300, y: 300 }
      ];
      
      const queen = findQueen(testEntities);
      
      return {
        success: true,
        queenFound: queen ? true : false,
        queenId: queen?.id,
        queenType: queen?.type
      };
    });
    
    console.log('[E2E] findQueen test:', JSON.stringify(findQueenTest, null, 2));
    
    // DEBUG: Manually call followEntity
    console.log('\n[E2E] Step 6: Manually testing followEntity()...');
    const followTest = await page.evaluate(() => {
      const camera = window.cameraManager;
      
      if (!camera || typeof camera.followEntity !== 'function') {
        return { error: 'CameraManager or followEntity not available' };
      }
      
      // Create test entity
      const testEntity = {
        type: 'Queen',
        x: 500,
        y: 500,
        position: { x: 500, y: 500 }
      };
      
      // Call followEntity
      const result = camera.followEntity(testEntity);
      
      return {
        success: true,
        result: result,
        followEnabled: camera.cameraFollowEnabled,
        hasTarget: camera.cameraFollowTarget ? true : false,
        targetType: camera.cameraFollowTarget?.type
      };
    });
    
    console.log('[E2E] followEntity test:', JSON.stringify(followTest, null, 2));
    
    // Take screenshot
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    await sleep(500);
    await saveScreenshot(page, 'cameraTrackingDebug/02_final_state', true);
    
    // Summary
    console.log('\n=== DEBUG SUMMARY ===');
    console.log('window.queenAnt exists:', queenCheck.queenAntExists);
    console.log('CameraManager exists:', cameraState.exists);
    console.log('Camera followEnabled:', cameraState.followEnabled);
    console.log('Camera hasTarget:', cameraState.hasTarget);
    console.log('findQueen works:', findQueenTest.success && findQueenTest.queenFound);
    console.log('followEntity works:', followTest.success && followTest.followEnabled);
    
    // Determine root cause
    if (!queenCheck.queenAntExists) {
      console.log('\n❌ ROOT CAUSE: window.queenAnt not set (queen not found in entities)');
    } else if (!cameraState.followEnabled) {
      console.log('\n❌ ROOT CAUSE: Camera following not enabled (followEntity not called or failed)');
    } else {
      console.log('\n✅ Camera tracking working correctly');
    }
    
    await browser.close();
    process.exit(cameraState.followEnabled ? 0 : 1);
    
  } catch (error) {
    console.error('[E2E] Error:', error);
    await saveScreenshot(page, 'cameraTrackingDebug/99_error', false);
    await browser.close();
    process.exit(1);
  }
})();
