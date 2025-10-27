/**
 * E2E Test: Shift + Mouse Wheel for Brush Size
 * Tests using Shift + scroll to change brush size while painting
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to app...');
    await page.goto('http://localhost:8000?test=1');
    
    // CRITICAL: Ensure game started
    console.log('Ensuring game started...');
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Game failed to start - still on menu');
    }
    
    console.log('Switching to LEVEL_EDITOR state...');
    await page.evaluate(() => {
      if (window.GameState && window.GameState.setState) {
        window.GameState.setState('LEVEL_EDITOR');
      } else {
        window.gameState = 'LEVEL_EDITOR';
      }
    });
    
    await sleep(1000);
    
    // Test 1: Set up initial brush size
    console.log('Test 1: Setting initial brush size to 5...');
    
    await page.evaluate(() => {
      // Use the actual live system API
      if (window.levelEditor && window.levelEditor.brushControl) {
        window.levelEditor.brushControl.setSize(5);
        window.levelEditor.toolbar.selectTool('paint');
        window.levelEditor.active = true;
      }
      
      // Force redraw
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(500);
    await saveScreenshot(page, 'levelEditor/shift_scroll_initial_size_5', true);
    
    const initialSize = await page.evaluate(() => {
      return {
        size: window.levelEditor && window.levelEditor.brushControl ? window.levelEditor.brushControl.getSize() : null,
        expected: 5
      };
    });
    
    console.log('Initial size:', initialSize);
    
    if (initialSize.size !== initialSize.expected) {
      throw new Error(`Expected size 5 but got ${initialSize.size}`);
    }
    
    // Test 2: Shift + Scroll Up to increase size
    console.log('Test 2: Shift + Scroll Up to increase size...');
    
    const scrollUpResult = await page.evaluate(() => {
      const beforeSize = window.levelEditor.brushControl.getSize();
      
      // Simulate Shift + Scroll Up (delta positive)
      const event = { delta: 1 };
      const shiftKey = true;
      const handled = window.levelEditor.handleMouseWheel(event, shiftKey);
      
      const afterSize = window.levelEditor.brushControl.getSize();
      
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      return {
        beforeSize: beforeSize,
        afterSize: afterSize,
        handled: handled,
        expected: beforeSize + 1
      };
    });
    
    console.log('Scroll up result:', scrollUpResult);
    await sleep(500);
    await saveScreenshot(page, 'levelEditor/shift_scroll_up_size_6', true);
    
    if (scrollUpResult.afterSize !== scrollUpResult.expected) {
      throw new Error(`Expected size ${scrollUpResult.expected} but got ${scrollUpResult.afterSize}`);
    }
    
    if (!scrollUpResult.handled) {
      throw new Error('Shift + scroll should be handled (return true)');
    }
    
    // Test 3: Multiple Shift + Scroll Ups
    console.log('Test 3: Multiple Shift + Scroll Up to reach size 9...');
    
    const multiScrollResult = await page.evaluate(() => {
      // Scroll up 3 more times (6 -> 7 -> 8 -> 9)
      window.levelEditor.handleMouseWheel({ delta: 1 }, true);
      window.levelEditor.handleMouseWheel({ delta: 1 }, true);
      window.levelEditor.handleMouseWheel({ delta: 1 }, true);
      
      const finalSize = window.levelEditor.brushControl.getSize();
      
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      return {
        finalSize: finalSize,
        expected: 9
      };
    });
    
    console.log('Multi-scroll result:', multiScrollResult);
    await sleep(500);
    await saveScreenshot(page, 'levelEditor/shift_scroll_max_size_9', true);
    
    if (multiScrollResult.finalSize !== multiScrollResult.expected) {
      throw new Error(`Expected max size 9 but got ${multiScrollResult.finalSize}`);
    }
    
    // Test 4: Try to exceed max (should clamp at 9)
    console.log('Test 4: Trying to exceed max size...');
    
    const clampMaxResult = await page.evaluate(() => {
      // Try to scroll up beyond 9
      const handled1 = window.levelEditor.handleMouseWheel({ delta: 1 }, true);
      const handled2 = window.levelEditor.handleMouseWheel({ delta: 1 }, true);
      
      const size = window.levelEditor.brushControl.getSize();
      
      return {
        size: size,
        expected: 9,
        handled1: handled1,
        handled2: handled2
      };
    });
    
    console.log('Clamp max result:', clampMaxResult);
    
    if (clampMaxResult.size !== clampMaxResult.expected) {
      throw new Error(`Size should clamp at 9 but got ${clampMaxResult.size}`);
    }
    
    if (clampMaxResult.handled1 || clampMaxResult.handled2) {
      console.warn('Warning: Scroll beyond max should return false');
    }
    
    // Test 5: Shift + Scroll Down to decrease size
    console.log('Test 5: Shift + Scroll Down to decrease size...');
    
    const scrollDownResult = await page.evaluate(() => {
      const beforeSize = window.levelEditor.brushControl.getSize();
      
      // Simulate Shift + Scroll Down (delta negative)
      const event = { delta: -1 };
      const shiftKey = true;
      const handled = window.levelEditor.handleMouseWheel(event, shiftKey);
      
      const afterSize = window.levelEditor.brushControl.getSize();
      
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      return {
        beforeSize: beforeSize,
        afterSize: afterSize,
        handled: handled,
        expected: beforeSize - 1
      };
    });
    
    console.log('Scroll down result:', scrollDownResult);
    await sleep(500);
    await saveScreenshot(page, 'levelEditor/shift_scroll_down_size_8', true);
    
    if (scrollDownResult.afterSize !== scrollDownResult.expected) {
      throw new Error(`Expected size ${scrollDownResult.expected} but got ${scrollDownResult.afterSize}`);
    }
    
    // Test 6: Scroll down to minimum
    console.log('Test 6: Scrolling down to minimum size 1...');
    
    const minSizeResult = await page.evaluate(() => {
      // Scroll down multiple times to reach 1
      for (let i = 0; i < 10; i++) {
        window.levelEditor.handleMouseWheel({ delta: -1 }, true);
      }
      
      const finalSize = window.levelEditor.brushControl.getSize();
      
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      return {
        finalSize: finalSize,
        expected: 1
      };
    });
    
    console.log('Min size result:', minSizeResult);
    await sleep(500);
    await saveScreenshot(page, 'levelEditor/shift_scroll_min_size_1', true);
    
    if (minSizeResult.finalSize !== minSizeResult.expected) {
      throw new Error(`Expected min size 1 but got ${minSizeResult.finalSize}`);
    }
    
    // Test 7: Normal scroll without Shift (should not change size)
    console.log('Test 7: Testing normal scroll without Shift...');
    
    await page.evaluate(() => {
      window.levelEditor.brushControl.setSize(5);
    });
    await sleep(200);
    
    const normalScrollResult = await page.evaluate(() => {
      const beforeSize = window.levelEditor.brushControl.getSize();
      
      // Simulate normal scroll (no shift)
      const event = { delta: 1 };
      const shiftKey = false;
      const handled = window.levelEditor.handleMouseWheel(event, shiftKey);
      
      const afterSize = window.levelEditor.brushControl.getSize();
      
      return {
        beforeSize: beforeSize,
        afterSize: afterSize,
        handled: handled,
        shouldBeUnchanged: beforeSize === afterSize
      };
    });
    
    console.log('Normal scroll result:', normalScrollResult);
    await saveScreenshot(page, 'levelEditor/normal_scroll_no_change', true);
    
    if (!normalScrollResult.shouldBeUnchanged) {
      throw new Error('Normal scroll should not change brush size');
    }
    
    if (normalScrollResult.handled) {
      throw new Error('Normal scroll should return false (allow zoom)');
    }
    
    // Test 8: Test with different tool (should not work)
    console.log('Test 8: Testing Shift + scroll with fill tool (should not work)...');
    
    const otherToolResult = await page.evaluate(() => {
      // Select fill tool on the toolbar
      window.levelEditor.toolbar.selectTool('fill');
      window.levelEditor.brushControl.setSize(5);
      
      const beforeSize = window.levelEditor.brushControl.getSize();
      const handled = window.levelEditor.handleMouseWheel({ delta: 1 }, true);
      const afterSize = window.levelEditor.brushControl.getSize();
      
      return {
        beforeSize: beforeSize,
        afterSize: afterSize,
        handled: handled,
        shouldBeUnchanged: beforeSize === afterSize,
        tool: window.levelEditor.toolbar.getSelectedTool()
      };
    });
    
    console.log('Other tool result:', otherToolResult);
    
    if (!otherToolResult.shouldBeUnchanged) {
      throw new Error('Shift + scroll should not work with non-paint tools');
    }
    
    await saveScreenshot(page, 'levelEditor/shift_scroll_other_tool_blocked', true);
    
    console.log('✅ All Shift + Mouse Wheel tests passed!');
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await saveScreenshot(page, 'levelEditor/shift_scroll_error', false);
    await browser.close();
    process.exit(1);
  }
})();
