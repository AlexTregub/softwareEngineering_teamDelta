/**
 * Manual Camera Follow Diagnostic
 * Load this in the browser console after loading a custom level
 */

// Run this in browser console
function diagnoseCameraFollow() {
  console.log('=== CAMERA FOLLOW DIAGNOSTIC ===');
  console.log('');
  
  // 1. Check game state
  console.log('1. GAME STATE:');
  if (typeof GameState !== 'undefined') {
    console.log('   Current State:', GameState.getState());
    console.log('   isInGame():', GameState.isInGame());
  } else {
    console.log('   ❌ GameState not available');
  }
  console.log('');
  
  // 2. Check camera manager
  console.log('2. CAMERA MANAGER:');
  if (typeof cameraManager !== 'undefined') {
    console.log('   ✓ CameraManager exists');
    console.log('   Position:', { x: cameraManager.cameraX, y: cameraManager.cameraY });
    console.log('   Zoom:', cameraManager.cameraZoom);
    console.log('   Follow Enabled:', cameraManager.cameraFollowEnabled);
    console.log('   Follow Target:', cameraManager.cameraFollowTarget);
    console.log('   Canvas Size:', { width: cameraManager.canvasWidth, height: cameraManager.canvasHeight });
  } else {
    console.log('   ❌ cameraManager not available');
  }
  console.log('');
  
  // 3. Check queen
  console.log('3. QUEEN:');
  if (typeof queenAnt !== 'undefined' && queenAnt) {
    console.log('   ✓ Queen exists (global queenAnt)');
    console.log('   Position:', { x: queenAnt.x, y: queenAnt.y });
    console.log('   Type:', queenAnt.type);
    console.log('   ID:', queenAnt.id);
  } else if (window.queenAnt) {
    console.log('   ✓ Queen exists (window.queenAnt)');
    console.log('   Position:', { x: window.queenAnt.x, y: window.queenAnt.y });
    console.log('   Type:', window.queenAnt.type);
    console.log('   ID:', window.queenAnt.id);
  } else {
    console.log('   ❌ Queen not found');
  }
  console.log('');
  
  // 4. Test camera centering manually
  console.log('4. MANUAL TEST:');
  if (typeof cameraManager !== 'undefined' && (queenAnt || window.queenAnt)) {
    const queen = queenAnt || window.queenAnt;
    console.log('   Attempting to center on queen...');
    
    const center = cameraManager.getEntityWorldCenter(queen);
    console.log('   Queen center:', center);
    
    if (center) {
      const beforeX = cameraManager.cameraX;
      const beforeY = cameraManager.cameraY;
      
      cameraManager.centerOn(center.x, center.y);
      
      console.log('   Camera before:', { x: beforeX, y: beforeY });
      console.log('   Camera after:', { x: cameraManager.cameraX, y: cameraManager.cameraY });
      console.log('   ✓ Manual centering attempted');
      
      // Try to enable follow
      cameraManager.cameraFollowEnabled = true;
      cameraManager.cameraFollowTarget = queen;
      console.log('   ✓ Follow mode enabled manually');
    } else {
      console.log('   ❌ Failed to get queen center position');
    }
  }
  console.log('');
  
  // 5. Check update loop
  console.log('5. UPDATE LOOP TEST:');
  console.log('   Watch camera position for 3 seconds...');
  let updateCount = 0;
  const startPos = { x: cameraManager.cameraX, y: cameraManager.cameraY };
  
  const interval = setInterval(() => {
    updateCount++;
    const currentPos = { x: cameraManager.cameraX, y: cameraManager.cameraY };
    console.log(`   [${updateCount}] Camera:`, currentPos, 'Follow:', cameraManager.cameraFollowEnabled);
    
    if (updateCount >= 6) {
      clearInterval(interval);
      const endPos = { x: cameraManager.cameraX, y: cameraManager.cameraY };
      const moved = Math.abs(endPos.x - startPos.x) > 1 || Math.abs(endPos.y - startPos.y) > 1;
      console.log('   Camera moved during test:', moved);
      console.log('   Start:', startPos, 'End:', endPos);
    }
  }, 500);
}

console.log('Camera Follow Diagnostic loaded. Run diagnoseCameraFollow() to test.');
