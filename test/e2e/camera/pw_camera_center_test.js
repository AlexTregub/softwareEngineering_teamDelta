/**
 * Test camera following when queen moves to map center
 * (away from bounds constraints)
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  let browser, page;
  
  try {
    console.log('[CENTER TEST] Testing camera follow when queen at map center...\n');
    
    browser = await launchBrowser();
    page = await browser.newPage();
    
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[CameraManager') || text.includes('[TEST]')) {
        console.log(`[PAGE] ${text}`);
      }
    });
    
    await page.goto('http://localhost:8000?test=1');
    await sleep(1000);
    
    const levelLoaded = await cameraHelper.ensureGameStarted(page);
    if (!levelLoaded.started) {
      throw new Error('Failed to load game');
    }
    
    await sleep(1000);
    
    console.log('[CENTER TEST] Moving queen to map center (1600, 1600)...\n');
    
    const result = await page.evaluate(() => {
      console.log('[TEST] Getting queen and camera references...');
      const queen = cameraManager.cameraFollowTarget;
      
      if (!queen) {
        return { error: 'No follow target' };
      }
      
      console.log('[TEST] Queen current position:', queen.x, queen.y);
      console.log('[TEST] Camera current position:', cameraManager.cameraX, cameraManager.cameraY);
      console.log('[TEST] Follow enabled:', cameraManager.cameraFollowEnabled);
      
      // Move queen to center of 3200x3200 map
      queen.x = 1600 - 30; // Center minus half queen width
      queen.y = 1600 - 30;
      
      console.log('[TEST] Queen moved to:', queen.x, queen.y);
      console.log('[TEST] Waiting for camera to update...');
      
      // Force multiple updates
      for (let i = 0; i < 5; i++) {
        if (typeof cameraManager.update === 'function') {
          cameraManager.update();
        }
      }
      
      console.log('[TEST] Camera after updates:', cameraManager.cameraX, cameraManager.cameraY);
      
      const queenCenterX = queen.x + 30;
      const queenCenterY = queen.y + 30;
      const expectedCamX = queenCenterX - (cameraManager.canvasWidth / cameraManager.cameraZoom / 2);
      const expectedCamY = queenCenterY - (cameraManager.canvasHeight / cameraManager.cameraZoom / 2);
      
      return {
        success: true,
        queenPosition: { x: queen.x, y: queen.y, centerX: queenCenterX, centerY: queenCenterY },
        cameraPosition: { x: cameraManager.cameraX, y: cameraManager.cameraY },
        expectedCamera: { x: expectedCamX, y: expectedCamY },
        delta: {
          x: Math.abs(cameraManager.cameraX - expectedCamX),
          y: Math.abs(cameraManager.cameraY - expectedCamY)
        },
        followEnabled: cameraManager.cameraFollowEnabled,
        canvasSize: { width: cameraManager.canvasWidth, height: cameraManager.canvasHeight }
      };
    });
    
    console.log('\n[CENTER TEST] Results:');
    console.log('  Queen Position:', result.queenPosition);
    console.log('  Camera Position:', result.cameraPosition);
    console.log('  Expected Camera:', result.expectedCamera);
    console.log('  Delta:', result.delta);
    console.log('  Canvas Size:', result.canvasSize);
    console.log('  Follow Enabled:', result.followEnabled);
    
    const isCentered = result.delta.x < 10 && result.delta.y < 10;
    console.log('\n' + '='.repeat(50));
    if (isCentered) {
      console.log('✅ CAMERA IS FOLLOWING - Centered on queen at map center');
    } else {
      console.log('❌ CAMERA NOT FOLLOWING - Delta too large');
      console.log('   Expected delta < 10 pixels, got:', result.delta);
    }
    console.log('='.repeat(50));
    
    await saveScreenshot(page, 'camera/follow_center_test', isCentered);
    
    await browser.close();
    process.exit(isCentered ? 0 : 1);
    
  } catch (error) {
    console.error('[CENTER TEST] Error:', error);
    if (browser) await browser.close();
    process.exit(1);
  }
})();
