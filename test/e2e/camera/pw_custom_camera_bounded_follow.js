/**
 * E2E Test: Custom Level Camera - Bounded Follow System
 * 
 * Tests the bounded follow camera system in custom levels with screenshot validation.
 * Verifies queen visibility, camera following, map edge handling, and no offset bugs.
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  console.log('🎬 Starting Custom Level Camera Bounded Follow E2E Test...\n');
  
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    // Navigate to game
    await page.goto('http://localhost:8000?test=1');
    await sleep(2000);
    
    // ========================================
    // Test 1: Load custom level and verify camera centers on queen
    // ========================================
    console.log('📋 Test 1: Load custom level - camera should center on queen');
    
    const loadResult = await cameraHelper.ensureGameStarted(page);
    if (!loadResult.started) {
      throw new Error('Game failed to start');
    }
    
    // Force CustomLevelCamera mode
    await page.evaluate(() => {
      window.gameState = 'IN_GAME';
      if (window.cameraManager && typeof window.cameraManager.switchCamera === 'function') {
        window.cameraManager.switchCamera('IN_GAME');
      }
    });
    
    // Get queen and camera positions
    const test1Result = await page.evaluate(() => {
      const queen = window.ants ? window.ants.find(ant => ant.JobName === 'Queen') : null;
      if (!queen || !window.cameraManager) {
        return { success: false, error: 'Queen or camera not found' };
      }
      
      const camera = window.cameraManager;
      const activeCamera = camera.activeCamera || camera;
      const cameraX = activeCamera.cameraX || activeCamera._cameraX || 0;
      const cameraY = activeCamera.cameraY || activeCamera._cameraY || 0;
      
      const queenCenterX = queen.x + (queen.width || 60) / 2;
      const queenCenterY = queen.y + (queen.height || 60) / 2;
      
      const viewportCenterX = cameraX + 400;
      const viewportCenterY = cameraY + 300;
      
      const deltaX = Math.abs(queenCenterX - viewportCenterX);
      const deltaY = Math.abs(queenCenterY - viewportCenterY);
      
      // Render scene
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      return {
        success: deltaX < 100 && deltaY < 100,
        queenPos: { x: queen.x, y: queen.y },
        queenCenter: { x: queenCenterX, y: queenCenterY },
        cameraPos: { x: cameraX, y: cameraY },
        viewportCenter: { x: viewportCenterX, y: viewportCenterY },
        delta: { x: deltaX, y: deltaY }
      };
    });
    
    console.log(`  Queen position: (${test1Result.queenPos?.x}, ${test1Result.queenPos?.y})`);
    console.log(`  Camera position: (${test1Result.cameraPos?.x}, ${test1Result.cameraPos?.y})`);
    console.log(`  Delta from center: X=${test1Result.delta?.x}px, Y=${test1Result.delta?.y}px`);
    console.log(`  ✅ Test 1: ${test1Result.success ? 'PASS' : 'FAIL'}\n`);
    
    await sleep(500);
    await saveScreenshot(page, 'camera/custom_level_camera_centered', test1Result.success);
    
    // ========================================
    // Test 2: Move queen within bounding box - camera should NOT move
    // ========================================
    console.log('📋 Test 2: Move queen within bounding box - camera should NOT move');
    
    const test2Result = await page.evaluate(() => {
      const queen = window.ants.find(ant => ant.JobName === 'Queen');
      if (!queen) return { success: false, error: 'Queen not found' };
      
      // Center queen first
      queen.x = 1570;
      queen.y = 1570;
      
      const camera = window.cameraManager;
      const activeCamera = camera.activeCamera || camera;
      
      if (typeof activeCamera.followEntity === 'function') {
        activeCamera.followEntity(queen);
      }
      if (typeof activeCamera.update === 'function') {
        activeCamera.update();
      }
      
      const initialCameraX = activeCamera.cameraX || activeCamera._cameraX || 0;
      const initialCameraY = activeCamera.cameraY || activeCamera._cameraY || 0;
      
      // Move queen slightly (within 200px horizontally, 150px vertically)
      queen.x = 1650; // 80px right
      queen.y = 1650; // 80px down
      
      if (typeof activeCamera.update === 'function') {
        activeCamera.update();
      }
      
      const finalCameraX = activeCamera.cameraX || activeCamera._cameraX || 0;
      const finalCameraY = activeCamera.cameraY || activeCamera._cameraY || 0;
      
      const cameraStill = (initialCameraX === finalCameraX && initialCameraY === finalCameraY);
      
      // Render
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      return {
        success: cameraStill,
        initialCamera: { x: initialCameraX, y: initialCameraY },
        finalCamera: { x: finalCameraX, y: finalCameraY },
        queenMoved: { x: 80, y: 80 }
      };
    });
    
    console.log(`  Queen moved: X=+80px, Y=+80px (within box)`);
    console.log(`  Initial camera: (${test2Result.initialCamera?.x}, ${test2Result.initialCamera?.y})`);
    console.log(`  Final camera: (${test2Result.finalCamera?.x}, ${test2Result.finalCamera?.y})`);
    console.log(`  ✅ Test 2: ${test2Result.success ? 'PASS (camera did NOT move)' : 'FAIL'}\n`);
    
    await sleep(500);
    await saveScreenshot(page, 'camera/custom_level_camera_within_box', test2Result.success);
    
    // ========================================
    // Test 3: Move queen outside bounding box - camera SHOULD follow
    // ========================================
    console.log('📋 Test 3: Move queen outside bounding box - camera SHOULD follow');
    
    const test3Result = await page.evaluate(() => {
      const queen = window.ants.find(ant => ant.JobName === 'Queen');
      if (!queen) return { success: false, error: 'Queen not found' };
      
      // Start at center
      queen.x = 1570;
      queen.y = 1570;
      
      const camera = window.cameraManager;
      const activeCamera = camera.activeCamera || camera;
      
      if (typeof activeCamera.update === 'function') {
        activeCamera.update();
      }
      
      const initialCameraX = activeCamera.cameraX || activeCamera._cameraX || 0;
      const initialCameraY = activeCamera.cameraY || activeCamera._cameraY || 0;
      
      // Move queen FAR right (outside bounding box)
      queen.x = 1970; // queen center at 2000, box right edge at ~1930
      
      if (typeof activeCamera.update === 'function') {
        activeCamera.update();
      }
      
      const finalCameraX = activeCamera.cameraX || activeCamera._cameraX || 0;
      const finalCameraY = activeCamera.cameraY || activeCamera._cameraY || 0;
      
      const cameraFollowed = (finalCameraX > initialCameraX); // Moved right
      
      // Render
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      return {
        success: cameraFollowed,
        initialCamera: { x: initialCameraX, y: initialCameraY },
        finalCamera: { x: finalCameraX, y: finalCameraY },
        queenMoved: { x: 400, y: 0 }
      };
    });
    
    console.log(`  Queen moved: X=+400px (outside box)`);
    console.log(`  Initial camera: (${test3Result.initialCamera?.x}, ${test3Result.initialCamera?.y})`);
    console.log(`  Final camera: (${test3Result.finalCamera?.x}, ${test3Result.finalCamera?.y})`);
    console.log(`  Camera moved: X=${(test3Result.finalCamera?.x || 0) - (test3Result.initialCamera?.x || 0)}px`);
    console.log(`  ✅ Test 3: ${test3Result.success ? 'PASS (camera followed)' : 'FAIL'}\n`);
    
    await sleep(500);
    await saveScreenshot(page, 'camera/custom_level_camera_outside_box', test3Result.success);
    
    // ========================================
    // Test 4: Queen at map edges - should be reachable (no 78px offset)
    // ========================================
    console.log('📋 Test 4: Queen at map edges - should reach all edges');
    
    const test4Result = await page.evaluate(() => {
      const queen = window.ants.find(ant => ant.JobName === 'Queen');
      if (!queen) return { success: false, error: 'Queen not found' };
      
      const camera = window.cameraManager;
      const activeCamera = camera.activeCamera || camera;
      
      const edges = [
        { name: 'top-left', x: 0, y: 0 },
        { name: 'top-right', x: 3140, y: 0 },
        { name: 'bottom-left', x: 0, y: 3140 },
        { name: 'bottom-right', x: 3140, y: 3140 }
      ];
      
      const results = [];
      
      edges.forEach(edge => {
        queen.x = edge.x;
        queen.y = edge.y;
        
        if (typeof activeCamera.update === 'function') {
          activeCamera.update();
        }
        
        const cameraX = activeCamera.cameraX || activeCamera._cameraX || 0;
        const cameraY = activeCamera.cameraY || activeCamera._cameraY || 0;
        
        const queenScreenX = queen.x - cameraX;
        const queenScreenY = queen.y - cameraY;
        
        const visible = queenScreenX >= -100 && queenScreenX <= 900 &&
                       queenScreenY >= -100 && queenScreenY <= 700;
        
        results.push({
          edge: edge.name,
          queenPos: { x: edge.x, y: edge.y },
          cameraPos: { x: cameraX, y: cameraY },
          visible: visible
        });
      });
      
      // Render final position
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      const allVisible = results.every(r => r.visible);
      
      return {
        success: allVisible,
        results: results
      };
    });
    
    test4Result.results?.forEach(r => {
      console.log(`  ${r.edge}: Queen (${r.queenPos.x}, ${r.queenPos.y}), Camera (${r.cameraPos.x}, ${r.cameraPos.y}) - ${r.visible ? '✓ Visible' : '✗ NOT visible'}`);
    });
    console.log(`  ✅ Test 4: ${test4Result.success ? 'PASS (all edges reachable)' : 'FAIL'}\n`);
    
    await sleep(500);
    await saveScreenshot(page, 'camera/custom_level_camera_edges', test4Result.success);
    
    // ========================================
    // Test 5: No 78-pixel offset bug when queen spawns at (2848, 608)
    // ========================================
    console.log('📋 Test 5: No 78-pixel offset bug (original bug location)');
    
    const test5Result = await page.evaluate(() => {
      const queen = window.ants.find(ant => ant.JobName === 'Queen');
      if (!queen) return { success: false, error: 'Queen not found' };
      
      // Move to original spawn position where bug was reported
      queen.x = 2848;
      queen.y = 608;
      
      const camera = window.cameraManager;
      const activeCamera = camera.activeCamera || camera;
      
      if (typeof activeCamera.update === 'function') {
        activeCamera.update();
      }
      
      const cameraX = activeCamera.cameraX || activeCamera._cameraX || 0;
      const cameraY = activeCamera.cameraY || activeCamera._cameraY || 0;
      
      const queenCenterX = queen.x + 30; // 2878
      const queenCenterY = queen.y + 30; // 638
      
      const viewportCenterX = cameraX + 400;
      const viewportCenterY = cameraY + 300;
      
      const offsetX = Math.abs(queenCenterX - viewportCenterX);
      const offsetY = Math.abs(queenCenterY - viewportCenterY);
      
      // Original bug had 78px offset - we want < 20px now
      const noOffset = offsetX < 20 && offsetY < 20;
      
      // Render
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      return {
        success: noOffset,
        queenPos: { x: queen.x, y: queen.y },
        cameraPos: { x: cameraX, y: cameraY },
        offset: { x: offsetX, y: offsetY }
      };
    });
    
    console.log(`  Queen at original bug position: (${test5Result.queenPos?.x}, ${test5Result.queenPos?.y})`);
    console.log(`  Camera position: (${test5Result.cameraPos?.x}, ${test5Result.cameraPos?.y})`);
    console.log(`  Offset from center: X=${test5Result.offset?.x}px, Y=${test5Result.offset?.y}px`);
    console.log(`  (Original bug: 78px offset)`);
    console.log(`  ✅ Test 5: ${test5Result.success ? 'PASS (no offset bug)' : 'FAIL'}\n`);
    
    await sleep(500);
    await saveScreenshot(page, 'camera/custom_level_camera_no_offset_bug', test5Result.success);
    
    // ========================================
    // Test 6: Camera switches between modes on state change
    // ========================================
    console.log('📋 Test 6: Camera switches between IN_GAME and PLAYING modes');
    
    const test6Result = await page.evaluate(() => {
      const camera = window.cameraManager;
      if (!camera || typeof camera.switchCamera !== 'function') {
        return { success: false, error: 'CameraSystemManager not found' };
      }
      
      // Switch to PLAYING mode
      camera.switchCamera('PLAYING');
      const playingCamera = camera.activeCamera ? camera.activeCamera.constructor.name : 'unknown';
      
      // Switch to IN_GAME mode
      camera.switchCamera('IN_GAME');
      const inGameCamera = camera.activeCamera ? camera.activeCamera.constructor.name : 'unknown';
      
      const switchWorking = (playingCamera !== inGameCamera);
      
      return {
        success: switchWorking,
        playingCamera: playingCamera,
        inGameCamera: inGameCamera
      };
    });
    
    console.log(`  PLAYING mode camera: ${test6Result.playingCamera}`);
    console.log(`  IN_GAME mode camera: ${test6Result.inGameCamera}`);
    console.log(`  ✅ Test 6: ${test6Result.success ? 'PASS (camera switched)' : 'FAIL'}\n`);
    
    // ========================================
    // Summary
    // ========================================
    const allPassed = test1Result.success && test2Result.success && 
                     test3Result.success && test4Result.success && 
                     test5Result.success && test6Result.success;
    
    console.log('═══════════════════════════════════════════');
    console.log(`📊 SUMMARY: ${allPassed ? 'ALL TESTS PASSED ✅' : 'SOME TESTS FAILED ❌'}`);
    console.log('═══════════════════════════════════════════');
    console.log(`Test 1 (Center on load): ${test1Result.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Test 2 (Within box): ${test2Result.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Test 3 (Outside box): ${test3Result.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Test 4 (Map edges): ${test4Result.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Test 5 (No offset bug): ${test5Result.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Test 6 (Mode switching): ${test6Result.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log('═══════════════════════════════════════════\n');
    
    await browser.close();
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Test execution error:', error.message);
    await saveScreenshot(page, 'camera/custom_level_camera_error', false);
    await browser.close();
    process.exit(1);
  }
})();
