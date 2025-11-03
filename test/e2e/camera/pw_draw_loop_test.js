/**
 * Check if the game draw() loop is running
 */

const { launchBrowser, sleep } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  let browser, page;
  
  try {
    console.log('[DRAW LOOP TEST] Checking if game loop is running...\n');
    
    browser = await launchBrowser();
    page = await browser.newPage();
    
    await page.goto('http://localhost:8000?test=1');
    await sleep(1000);
    
    const levelLoaded = await cameraHelper.ensureGameStarted(page);
    if (!levelLoaded.started) {
      throw new Error('Failed to load game');
    }
    
    await sleep(1000);
    
    // Check if draw() is being called
    const drawLoopTest = await page.evaluate(() => {
      return new Promise((resolve) => {
        let drawCount = 0;
        const originalDraw = window.draw;
        
        if (typeof window.draw !== 'function') {
          resolve({ error: 'draw() function not found' });
          return;
        }
        
        // Override draw to count calls
        window.draw = function() {
          drawCount++;
          originalDraw.call(this);
        };
        
        // Wait 1 second and count draw calls
        setTimeout(() => {
          window.draw = originalDraw;
          resolve({
            drawCallsPerSecond: drawCount,
            expectedFPS: 60,
            isRunning: drawCount > 0
          });
        }, 1000);
      });
    });
    
    console.log('[DRAW LOOP TEST] Results:', drawLoopTest);
    
    if (drawLoopTest.error) {
      console.log('❌ Error:', drawLoopTest.error);
    } else if (drawLoopTest.isRunning) {
      console.log(`✅ Draw loop IS running (${drawLoopTest.drawCallsPerSecond} calls/sec)`);
    } else {
      console.log('❌ Draw loop is NOT running');
    }
    
    // Check if cameraManager.update() is being called
    const updateLoopTest = await page.evaluate(() => {
      return new Promise((resolve) => {
        if (typeof cameraManager === 'undefined') {
          resolve({ error: 'cameraManager not found' });
          return;
        }
        
        let updateCount = 0;
        const originalUpdate = cameraManager.update;
        
        if (typeof originalUpdate !== 'function') {
          resolve({ error: 'cameraManager.update is not a function' });
          return;
        }
        
        // Override update to count calls
        cameraManager.update = function() {
          updateCount++;
          originalUpdate.call(this);
        };
        
        // Wait 1 second and count update calls
        setTimeout(() => {
          cameraManager.update = originalUpdate;
          resolve({
            updateCallsPerSecond: updateCount,
            isRunning: updateCount > 0
          });
        }, 1000);
      });
    });
    
    console.log('[UPDATE LOOP TEST] Results:', updateLoopTest);
    
    if (updateLoopTest.error) {
      console.log('❌ Error:', updateLoopTest.error);
    } else if (updateLoopTest.isRunning) {
      console.log(`✅ cameraManager.update() IS being called (${updateLoopTest.updateCallsPerSecond} calls/sec)`);
    } else {
      console.log('❌ cameraManager.update() is NOT being called');
    }
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('[DRAW LOOP TEST] Error:', error);
    if (browser) await browser.close();
    process.exit(1);
  }
})();
