/**
 * E2E Test: Queen Camera Centering
 * 
 * Tests that when loading a custom level:
 * 1. Camera starts centered on the Queen
 * 2. Queen is visible in the viewport center
 * 3. Camera zoom is at expected level (2.0x)
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  console.log('🎮 [E2E] Loading custom level...');
  await page.goto('http://localhost:8000');
  
  // Wait for page to load
  await sleep(2000);
  
  // Load the custom level via console
  console.log('🎮 [E2E] Executing loadCustomLevel()...');
  await page.evaluate(() => {
    if (typeof loadCustomLevel === 'function') {
      loadCustomLevel('levels/CaveTutorial.json');
    }
  });
  
  // Wait for level to load completely
  await sleep(3000);
  
  console.log('🎮 [E2E] Checking game state...');
  
  // Get camera and Queen positions
  const result = await page.evaluate(() => {
    // Check if we're in the game
    if (typeof GameState === 'undefined' || GameState.getState() !== 'IN_GAME') {
      return { 
        success: false, 
        error: 'Not in IN_GAME state',
        state: typeof GameState !== 'undefined' ? GameState.getState() : 'undefined'
      };
    }
    
    // Find the Queen
    if (typeof ants === 'undefined' || !Array.isArray(ants)) {
      return { success: false, error: 'ants array not available' };
    }
    
    const queen = ants.find(ant => 
      ant.type === 'Queen' || ant.JobName === 'Queen' || ant.jobName === 'Queen'
    );
    
    if (!queen) {
      return { 
        success: false, 
        error: 'Queen not found',
        antsCount: ants.length
      };
    }
    
    // Get camera position
    if (typeof cameraManager === 'undefined' || !cameraManager) {
      return { success: false, error: 'cameraManager not available' };
    }
    
    const camPos = cameraManager.getCameraPosition();
    if (!camPos) {
      return { success: false, error: 'Camera position not available' };
    }
    
    // Calculate viewport dimensions (accounting for zoom)
    const viewportWidth = window.innerWidth / camPos.zoom;
    const viewportHeight = window.innerHeight / camPos.zoom;
    
    // Calculate viewport center in world coordinates
    const viewportCenterX = camPos.x + (viewportWidth / 2);
    const viewportCenterY = camPos.y + (viewportHeight / 2);
    
    // Calculate distance from Queen to viewport center
    const dx = queen.x - viewportCenterX;
    const dy = queen.y - viewportCenterY;
    const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
    
    // Check if Queen is in viewport
    const inViewport = queen.x >= camPos.x && 
                      queen.x <= camPos.x + viewportWidth &&
                      queen.y >= camPos.y && 
                      queen.y <= camPos.y + viewportHeight;
    
    // ACCEPTANCE CRITERIA:
    // 1. Queen should be within 100 pixels of viewport center
    // 2. Camera zoom should be 2.0x (initial setting)
    // 3. Queen should be in viewport
    
    const isCentered = distanceFromCenter < 100;
    const correctZoom = Math.abs(camPos.zoom - 2.0) < 0.1;
    
    return {
      success: isCentered && correctZoom && inViewport,
      queenPosition: { x: Math.round(queen.x), y: Math.round(queen.y) },
      cameraPosition: { x: Math.round(camPos.x), y: Math.round(camPos.y) },
      cameraZoom: camPos.zoom,
      viewportCenter: { x: Math.round(viewportCenterX), y: Math.round(viewportCenterY) },
      distanceFromCenter: Math.round(distanceFromCenter),
      inViewport: inViewport,
      isCentered: isCentered,
      correctZoom: correctZoom,
      expectedZoom: 2.0,
      viewportDimensions: { 
        width: Math.round(viewportWidth), 
        height: Math.round(viewportHeight) 
      }
    };
  });
  
  // Log results
  console.log('\n📊 [E2E] Test Results:');
  console.log('═══════════════════════════════════════');
  
  if (result.error) {
    console.log(`❌ ERROR: ${result.error}`);
    if (result.state) console.log(`   Game State: ${result.state}`);
    if (result.antsCount !== undefined) console.log(`   Ants Count: ${result.antsCount}`);
  } else {
    console.log(`👑 Queen Position: (${result.queenPosition.x}, ${result.queenPosition.y})`);
    console.log(`📸 Camera Position: (${result.cameraPosition.x}, ${result.cameraPosition.y})`);
    console.log(`🔍 Camera Zoom: ${result.cameraZoom.toFixed(2)}x (expected: ${result.expectedZoom.toFixed(2)}x)`);
    console.log(`📐 Viewport Center: (${result.viewportCenter.x}, ${result.viewportCenter.y})`);
    console.log(`📏 Viewport Size: ${result.viewportDimensions.width} x ${result.viewportDimensions.height}`);
    console.log(`📍 Distance from Center: ${result.distanceFromCenter} pixels (max: 100)`);
    console.log(`\n✓ Tests:`);
    console.log(`  ${result.inViewport ? '✅' : '❌'} Queen in viewport`);
    console.log(`  ${result.isCentered ? '✅' : '❌'} Queen centered (within 100px of viewport center)`);
    console.log(`  ${result.correctZoom ? '✅' : '❌'} Correct zoom level (2.0x ±0.1)`);
  }
  
  console.log('═══════════════════════════════════════\n');
  
  // Take screenshot
  await saveScreenshot(page, 'camera/queen_centering', result.success);
  
  await browser.close();
  
  if (result.success) {
    console.log('✅ [E2E] Test PASSED: Queen is properly centered on load');
    process.exit(0);
  } else {
    console.log('❌ [E2E] Test FAILED: Queen centering issue detected');
    process.exit(1);
  }
})();
