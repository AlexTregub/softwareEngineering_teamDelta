/**
 * E2E Test: Real-time Camera Following Verification
 * 
 * This test monitors the camera over multiple frames to ensure it's actually
 * updating and following the queen in real-time.
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  let browser, page;
  
  try {
    console.log('[REALTIME TEST] Starting camera follow verification...\n');
    
    browser = await launchBrowser();
    page = await browser.newPage();
    
    // Capture ALL console logs for debugging
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[CameraManager') || 
          text.includes('[loadCustomLevel]') ||
          text.includes('Follow')) {
        console.log(`[PAGE] ${text}`);
      }
    });
    
    // Navigate to game
    await page.goto('http://localhost:8000?test=1');
    await sleep(1000);
    
    // Load custom level
    console.log('[REALTIME TEST] Loading custom level...');
    const levelLoaded = await cameraHelper.ensureGameStarted(page);
    
    if (!levelLoaded.started) {
      throw new Error('Failed to load game');
    }
    
    await sleep(1000);
    
    // Check initial state
    console.log('\n[REALTIME TEST] Checking initial camera state...');
    const initialState = await page.evaluate(() => {
      return {
        gameState: window.GameState ? window.GameState.getState() : 'unknown',
        cameraExists: typeof cameraManager !== 'undefined',
        queenExists: typeof queenAnt !== 'undefined' || typeof window.queenAnt !== 'undefined',
        followEnabled: typeof cameraManager !== 'undefined' ? cameraManager.cameraFollowEnabled : false,
        followTarget: typeof cameraManager !== 'undefined' && cameraManager.cameraFollowTarget ? 
          (cameraManager.cameraFollowTarget.id || cameraManager.cameraFollowTarget.type) : null
      };
    });
    
    console.log('[REALTIME TEST] Initial state:', initialState);
    
    if (!initialState.cameraExists) {
      throw new Error('CameraManager not found');
    }
    
    if (!initialState.queenExists) {
      throw new Error('Queen not found');
    }
    
    if (!initialState.followEnabled) {
      console.warn('⚠️ WARNING: Camera follow is NOT enabled!');
      console.log('[REALTIME TEST] Attempting to enable follow manually...');
      
      await page.evaluate(() => {
        const queen = queenAnt || window.queenAnt;
        if (queen && typeof cameraManager !== 'undefined') {
          console.log('[MANUAL] Calling cameraManager.followEntity(queen)');
          const result = cameraManager.followEntity(queen);
          console.log('[MANUAL] followEntity result:', result);
        }
      });
      
      await sleep(500);
      
      // Check again
      const retryState = await page.evaluate(() => {
        return {
          followEnabled: cameraManager.cameraFollowEnabled,
          followTarget: cameraManager.cameraFollowTarget ? 
            (cameraManager.cameraFollowTarget.id || cameraManager.cameraFollowTarget.type) : null
        };
      });
      
      console.log('[REALTIME TEST] After manual enable:', retryState);
      
      if (!retryState.followEnabled) {
        throw new Error('Failed to enable camera follow even manually');
      }
    }
    
    // Monitor camera for 3 seconds - sample every 200ms
    console.log('\n[REALTIME TEST] Monitoring camera position over 3 seconds...');
    console.log('(Queen should move with WASD, camera should follow)\n');
    
    const samples = [];
    for (let i = 0; i < 15; i++) {
      const sample = await page.evaluate(() => {
        // Try to get queen from camera's follow target
        const queen = cameraManager.cameraFollowTarget || window.queenAnt;
        return {
          frame: Date.now(),
          camera: {
            x: cameraManager.cameraX,
            y: cameraManager.cameraY,
            followEnabled: cameraManager.cameraFollowEnabled,
            followTarget: cameraManager.cameraFollowTarget ? 
              (cameraManager.cameraFollowTarget.id || cameraManager.cameraFollowTarget.type) : null
          },
          queen: queen ? {
            x: queen.x,
            y: queen.y,
            type: queen.type
          } : null
        };
      });
      
      samples.push(sample);
      const camX = (sample.camera && typeof sample.camera.x === 'number') ? sample.camera.x.toFixed(0) : 'N/A';
      const camY = (sample.camera && typeof sample.camera.y === 'number') ? sample.camera.y.toFixed(0) : 'N/A';
      const queenX = (sample.queen && typeof sample.queen.x === 'number') ? sample.queen.x.toFixed(0) : 'N/A';
      const queenY = (sample.queen && typeof sample.queen.y === 'number') ? sample.queen.y.toFixed(0) : 'N/A';
      const followEnabled = sample.camera ? sample.camera.followEnabled : false;
      
      console.log(`[Sample ${i + 1}/15] Camera: (${camX}, ${camY}) | Queen: (${queenX}, ${queenY}) | Follow: ${followEnabled}`);
      
      await sleep(200);
    }
    
    // Analyze samples
    console.log('\n[REALTIME TEST] Analyzing samples...');
    
    const cameraMovement = {
      minX: Math.min(...samples.map(s => s.camera.x)),
      maxX: Math.max(...samples.map(s => s.camera.x)),
      minY: Math.min(...samples.map(s => s.camera.y)),
      maxY: Math.max(...samples.map(s => s.camera.y))
    };
    
    const cameraRangeX = cameraMovement.maxX - cameraMovement.minX;
    const cameraRangeY = cameraMovement.maxY - cameraMovement.minY;
    
    console.log('\nCamera Movement Range:');
    console.log('  X: ', cameraMovement.minX.toFixed(0), 'to', cameraMovement.maxX.toFixed(0), '(range:', cameraRangeX.toFixed(0), 'pixels)');
    console.log('  Y: ', cameraMovement.minY.toFixed(0), 'to', cameraMovement.maxY.toFixed(0), '(range:', cameraRangeY.toFixed(0), 'pixels)');
    
    const followWasEnabled = samples.every(s => s.camera.followEnabled);
    const cameraDidMove = cameraRangeX > 5 || cameraRangeY > 5;
    
    console.log('\nResults:');
    console.log('  Follow Always Enabled:', followWasEnabled ? '✅' : '❌');
    console.log('  Camera Movement Detected:', cameraDidMove ? '✅' : '❌ (camera appears FROZEN)');
    
    // Test by moving queen manually
    console.log('\n[REALTIME TEST] Testing manual queen movement...');
    console.log('Moving queen 500 pixels to the right...');
    
    const beforeMove = await page.evaluate(() => {
      const queen = queenAnt || window.queenAnt;
      return {
        queenX: queen.x,
        queenY: queen.y,
        cameraX: cameraManager.cameraX,
        cameraY: cameraManager.cameraY
      };
    });
    
    console.log('Before move:', beforeMove);
    
    await page.evaluate(() => {
      const queen = queenAnt || window.queenAnt;
      queen.x += 500;
    });
    
    // Wait for camera to update
    await sleep(500);
    
    const afterMove = await page.evaluate(() => {
      const queen = queenAnt || window.queenAnt;
      return {
        queenX: queen.x,
        queenY: queen.y,
        cameraX: cameraManager.cameraX,
        cameraY: cameraManager.cameraY
      };
    });
    
    console.log('After move:', afterMove);
    
    const queenMoved = Math.abs(afterMove.queenX - beforeMove.queenX) > 400;
    const cameraMoved = Math.abs(afterMove.cameraX - beforeMove.cameraX) > 100;
    
    console.log('\nManual Movement Test:');
    console.log('  Queen Moved:', queenMoved ? '✅' : '❌');
    console.log('  Camera Followed:', cameraMoved ? '✅' : '❌');
    
    await saveScreenshot(page, 'camera/follow_realtime', followWasEnabled && (cameraDidMove || cameraMoved));
    
    // Final verdict
    console.log('\n' + '='.repeat(50));
    if (followWasEnabled && (cameraDidMove || cameraMoved)) {
      console.log('✅ CAMERA IS FOLLOWING QUEEN');
    } else if (followWasEnabled && !cameraDidMove && !cameraMoved) {
      console.log('❌ CAMERA FOLLOW ENABLED BUT CAMERA NOT MOVING');
      console.log('   This suggests the update() loop may not be working correctly');
    } else {
      console.log('❌ CAMERA FOLLOW NOT ENABLED');
    }
    console.log('='.repeat(50));
    
    await browser.close();
    process.exit((followWasEnabled && (cameraDidMove || cameraMoved)) ? 0 : 1);
    
  } catch (error) {
    console.error('[REALTIME TEST] Error:', error);
    if (browser) await browser.close();
    process.exit(1);
  }
})();
