/**
 * E2E Test: Bug Fix - Shift+Scroll Not Working for Brush Size
 * 
 * ISSUE: Shift+scroll just zooms instead of changing brush size
 * EXPECTED: Shift+scroll should change brush size, normal scroll should zoom
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to app...');
    await page.goto('http://localhost:8000?test=1');
    
    console.log('Ensuring game started...');
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Game failed to start');
    }
    
    console.log('Switching to LEVEL_EDITOR state...');
    await page.evaluate(() => {
      if (window.GameState && window.GameState.setState) {
        window.GameState.setState('LEVEL_EDITOR');
      }
    });
    
    await sleep(1000);
    
    // Test 1: Normal scroll should zoom (not change brush size)
    console.log('Test 1: Normal scroll (no Shift) should zoom, not change brush size...');
    const normalScrollResult = await page.evaluate(() => {
      // Set initial state
      if (window.levelEditor.fileMenuBar && window.levelEditor.fileMenuBar.brushSizeModule) {
        window.levelEditor.fileMenuBar.brushSizeModule.setSize(5);
      }
      if (window.levelEditor.toolbar) {
        window.levelEditor.toolbar.selectTool('paint');
      }
      
      const beforeSize = window.levelEditor.fileMenuBar.brushSizeModule.getSize();
      const beforeZoom = window.cameraManager ? window.cameraManager.getZoom() : 1;
      
      // Simulate normal scroll (no shift)
      const event = new WheelEvent('wheel', {
        deltaY: -100, // Scroll up
        shiftKey: false,
        bubbles: true,
        cancelable: true
      });
      
      window.dispatchEvent(event);
      
      const afterSize = window.levelEditor.fileMenuBar.brushSizeModule.getSize();
      const afterZoom = window.cameraManager ? window.cameraManager.getZoom() : 1;
      
      return {
        beforeSize,
        afterSize,
        beforeZoom,
        afterZoom,
        sizeChanged: beforeSize !== afterSize,
        zoomChanged: beforeZoom !== afterZoom
      };
    });
    
    console.log('Normal scroll result:', normalScrollResult);
    
    // Normal scroll should NOT change brush size
    if (normalScrollResult.sizeChanged) {
      console.warn('⚠️ WARNING: Normal scroll changed brush size (should only zoom)');
    }
    
    await sleep(300);
    await saveScreenshot(page, 'levelEditor/bugfix_normal_scroll', true);
    
    // Test 2: Shift+scroll should change brush size (not zoom)
    console.log('Test 2: Shift+scroll should change brush size, not zoom...');
    const shiftScrollResult = await page.evaluate(() => {
      // Reset state
      if (window.levelEditor.fileMenuBar && window.levelEditor.fileMenuBar.brushSizeModule) {
        window.levelEditor.fileMenuBar.brushSizeModule.setSize(5);
      }
      
      const beforeSize = window.levelEditor.fileMenuBar.brushSizeModule.getSize();
      const beforeZoom = window.cameraManager ? window.cameraManager.getZoom() : 1;
      
      // Simulate Shift+scroll up
      const event = new WheelEvent('wheel', {
        deltaY: -100, // Scroll up (should increase size)
        shiftKey: true,
        bubbles: true,
        cancelable: true
      });
      
      window.dispatchEvent(event);
      
      const afterSize = window.levelEditor.fileMenuBar.brushSizeModule.getSize();
      const afterZoom = window.cameraManager ? window.cameraManager.getZoom() : 1;
      
      return {
        beforeSize,
        afterSize,
        expectedSize: 6, // Should increase from 5 to 6
        beforeZoom,
        afterZoom,
        sizeChanged: beforeSize !== afterSize,
        zoomChanged: beforeZoom !== afterZoom
      };
    });
    
    console.log('Shift+scroll result:', shiftScrollResult);
    
    // THIS TEST SHOULD FAIL INITIALLY (bug not fixed yet)
    if (!shiftScrollResult.sizeChanged) {
      console.error('❌ BUG CONFIRMED: Shift+scroll did NOT change brush size');
      await saveScreenshot(page, 'levelEditor/bugfix_shift_scroll_failed', false);
      throw new Error('Shift+scroll should change brush size but did not - BUG CONFIRMED');
    }
    
    if (shiftScrollResult.afterSize !== shiftScrollResult.expectedSize) {
      throw new Error(`Expected size ${shiftScrollResult.expectedSize}, got ${shiftScrollResult.afterSize}`);
    }
    
    // Shift+scroll should NOT change zoom
    if (shiftScrollResult.zoomChanged) {
      console.warn('⚠️ WARNING: Shift+scroll changed zoom (should only change brush size)');
    }
    
    await sleep(300);
    await saveScreenshot(page, 'levelEditor/bugfix_shift_scroll_working', true);
    
    console.log('✅ Shift+scroll bug fix verified!');
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await saveScreenshot(page, 'levelEditor/bugfix_shift_scroll_error', false);
    await browser.close();
    process.exit(1);
  }
})();
