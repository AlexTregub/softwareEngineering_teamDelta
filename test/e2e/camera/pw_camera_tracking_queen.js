/**
 * E2E Test: Camera Tracking Queen on Level Load
 * 
 * PURPOSE: Document camera tracking behavior when loading custom level with queen
 * 
 * EXPECTED BEHAVIOR:
 * 1. Game loads custom level (CaveTutorial.json)
 * 2. Queen entity spawns from JSON
 * 3. Camera IMMEDIATELY jumps to queen position
 * 4. Camera follows queen if she moves
 * 
 * CURRENT ISSUES (to be documented):
 * - Camera may not jump to queen initially
 * - Camera may not follow queen movement
 * - Different behavior between PLAYING and IN_GAME states
 * - SparseTerrain vs GridTerrain camera handling differences
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const path = require('path');

(async () => {
  console.log('\n=== E2E Test: Camera Tracking Queen ===\n');

  const browser = await launchBrowser();
  const page = await browser.newPage();

  try {
    // Capture console logs from the page
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[CameraManager]') || text.includes('[loadCustomLevel]')) {
        console.log(`[PAGE] ${text}`);
      }
    });

    // Navigate to game
    await page.goto('http://localhost:8000?test=1');

    // Step 1: Wait for main menu
    console.log('[E2E] Step 1: Waiting for main menu...');
    await sleep(2000);
    const menuReady = await page.evaluate(() => {
      return typeof GameState !== 'undefined' && GameState.getState() === 'MENU';
    });
    console.log(`[E2E] ${menuReady ? '✅' : '❌'} Main menu ready: ${menuReady}`);

    // Step 2: Click "Custom Level" button to load cave_tutorial.json
    console.log('\n[E2E] Step 2: Loading custom level...');
    await page.evaluate(() => {
      // Simulate button click to load custom level
      if (typeof loadCustomLevel === 'function') {
        loadCustomLevel('levels/CaveTutorial.json');
      }
    });
    await sleep(3000); // Wait for level to load

    // Step 3: Check game state
    const gameState = await page.evaluate(() => {
      return typeof GameState !== 'undefined' ? GameState.getState() : 'unknown';
    });
    console.log(`[E2E] Game state: ${gameState}`);

    // Step 4: Get queen entity information
    console.log('\n[E2E] Step 3: Checking queen entity...');
    const queenInfo = await page.evaluate(() => {
      const queen = window.queenAnt;
      if (!queen) return { exists: false };

      return {
        exists: true,
        type: queen.type,
        id: queen.id,
        // Try different position properties
        x: queen.x,
        y: queen.y,
        posX: queen.posX,
        posY: queen.posY,
        position: queen.position,
        hasGetPosition: typeof queen.getPosition === 'function',
        getPositionResult: typeof queen.getPosition === 'function' ? queen.getPosition() : null
      };
    });
    console.log('[E2E] Queen info:', JSON.stringify(queenInfo, null, 2));

    // Step 5: Get camera information
    console.log('\n[E2E] Step 4: Checking camera state...');
    const cameraInfo = await page.evaluate(() => {
      if (typeof cameraManager === 'undefined') {
        return { exists: false };
      }

      return {
        exists: true,
        cameraX: cameraManager.cameraX,
        cameraY: cameraManager.cameraY,
        cameraZoom: cameraManager.cameraZoom,
        followEnabled: cameraManager.cameraFollowEnabled,
        followTarget: cameraManager.cameraFollowTarget ? {
          type: cameraManager.cameraFollowTarget.type,
          id: cameraManager.cameraFollowTarget.id
        } : null,
        canvasWidth: cameraManager.canvasWidth,
        canvasHeight: cameraManager.canvasHeight
      };
    });
    console.log('[E2E] Camera info:', JSON.stringify(cameraInfo, null, 2));

    // Step 6: Calculate if camera is centered on queen
    console.log('\n[E2E] Step 5: Analyzing camera position...');
    const analysis = await page.evaluate(() => {
      const queen = window.queenAnt;
      const camera = window.cameraManager;

      if (!queen || !camera) {
        return { error: 'Queen or camera missing' };
      }

      // Get queen position (try multiple properties)
      let queenX, queenY;
      if (typeof queen.getPosition === 'function') {
        const pos = queen.getPosition();
        queenX = pos.x;
        queenY = pos.y;
      } else if (queen.position) {
        queenX = queen.position.x;
        queenY = queen.position.y;
      } else if (typeof queen.x === 'number' && typeof queen.y === 'number') {
        queenX = queen.x;
        queenY = queen.y;
      } else if (typeof queen.posX === 'number' && typeof queen.posY === 'number') {
        queenX = queen.posX;
        queenY = queen.posY;
      } else {
        return { error: 'Cannot determine queen position' };
      }

      // Calculate expected camera position (top-left of viewport centered on queen)
      const viewWidth = camera.canvasWidth / camera.cameraZoom;
      const viewHeight = camera.canvasHeight / camera.cameraZoom;
      const expectedCameraX = queenX - (viewWidth / 2);
      const expectedCameraY = queenY - (viewHeight / 2);

      // Calculate distance between current and expected camera position
      const deltaX = Math.abs(camera.cameraX - expectedCameraX);
      const deltaY = Math.abs(camera.cameraY - expectedCameraY);
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      return {
        queenWorldX: queenX,
        queenWorldY: queenY,
        cameraX: camera.cameraX,
        cameraY: camera.cameraY,
        expectedCameraX: expectedCameraX,
        expectedCameraY: expectedCameraY,
        deltaX: deltaX,
        deltaY: deltaY,
        distance: distance,
        isCentered: distance < 50, // Within 50 pixels = centered
        followEnabled: camera.cameraFollowEnabled,
        followTargetMatches: camera.cameraFollowTarget === queen
      };
    });
    console.log('[E2E] Camera analysis:', JSON.stringify(analysis, null, 2));

    // Step 7: Take screenshot
    console.log('\n[E2E] Step 6: Taking screenshot...');
    const screenshotPath = path.join(__dirname, '../screenshots/camera/camera_tracking_queen.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`[E2E] Screenshot saved: ${screenshotPath}`);

    // Step 8: Test camera movement with arrow keys
    console.log('\n[E2E] Step 7: Testing camera controls (arrow keys)...');
    const initialCameraX = cameraInfo.cameraX;
    
    // Press right arrow key
    await page.keyboard.press('ArrowRight');
    await sleep(100);
    
    const cameraAfterArrow = await page.evaluate(() => {
      return {
        cameraX: cameraManager.cameraX,
        cameraY: cameraManager.cameraY,
        followEnabled: cameraManager.cameraFollowEnabled
      };
    });
    console.log('[E2E] Camera after arrow key:', JSON.stringify(cameraAfterArrow, null, 2));
    console.log(`[E2E] Camera moved: ${cameraAfterArrow.cameraX !== initialCameraX}`);
    console.log(`[E2E] Follow disabled after manual input: ${!cameraAfterArrow.followEnabled}`);

    // Step 9: Test re-enabling camera follow
    console.log('\n[E2E] Step 8: Re-enabling camera follow...');
    await page.evaluate(() => {
      if (window.queenAnt && window.cameraManager) {
        cameraManager.followEntity(window.queenAnt);
      }
    });
    await sleep(100);

    const cameraAfterRefollow = await page.evaluate(() => {
      return {
        cameraX: cameraManager.cameraX,
        cameraY: cameraManager.cameraY,
        followEnabled: cameraManager.cameraFollowEnabled,
        followTarget: cameraManager.cameraFollowTarget ? cameraManager.cameraFollowTarget.id : null
      };
    });
    console.log('[E2E] Camera after re-follow:', JSON.stringify(cameraAfterRefollow, null, 2));

    // Final results
    console.log('\n=== TEST RESULTS ===');
    console.log(`Queen exists: ${queenInfo.exists ? '✅' : '❌'}`);
    console.log(`Camera exists: ${cameraInfo.exists ? '✅' : '❌'}`);
    console.log(`Camera centered on queen: ${analysis.isCentered ? '✅' : '❌'}`);
    console.log(`Camera following queen: ${analysis.followEnabled ? '✅' : '❌'}`);
    console.log(`Follow target matches queen: ${analysis.followTargetMatches ? '✅' : '❌'}`);
    console.log(`Camera responds to arrow keys: ${cameraAfterArrow.cameraX !== initialCameraX ? '✅' : '❌'}`);

    const success = queenInfo.exists && 
                   cameraInfo.exists && 
                   analysis.isCentered && 
                   analysis.followEnabled &&
                   analysis.followTargetMatches;

    await browser.close();
    process.exit(success ? 0 : 1);

  } catch (error) {
    console.error('[E2E] Test failed:', error);
    await browser.close();
    process.exit(1);
  }
})();
