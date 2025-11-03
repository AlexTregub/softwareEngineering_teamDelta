/**
 * E2E Test: Inline Brush Size Controls in Menu Bar
 * Tests the +/- buttons that appear when paint tool is active
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
    
    // Test 1: Verify brush size module exists and is visible with paint tool
    console.log('Test 1: Verifying brush size module visible with paint tool...');
    const initialState = await page.evaluate(() => {
      if (!window.levelEditor || !window.levelEditor.fileMenuBar || !window.levelEditor.fileMenuBar.brushSizeModule) {
        return { exists: false, error: 'BrushSizeMenuModule not found' };
      }
      
      const module = window.levelEditor.fileMenuBar.brushSizeModule;
      const currentTool = window.levelEditor.toolbar ? window.levelEditor.toolbar.getSelectedTool() : null;
      
      return {
        exists: true,
        visible: module.isVisible(),
        currentSize: module.getSize(),
        currentTool: currentTool
      };
    });
    
    console.log('Initial state:', initialState);
    
    if (!initialState.exists) {
      throw new Error('BrushSizeMenuModule not found');
    }
    
    if (!initialState.visible) {
      throw new Error('BrushSizeModule should be visible with paint tool');
    }
    
    await sleep(300);
    await saveScreenshot(page, 'levelEditor/brush_size_inline_visible', true);
    
    // Test 2: Switch to fill tool - module should disappear
    console.log('Test 2: Switching to fill tool (module should hide)...');
    const fillToolState = await page.evaluate(() => {
      if (window.levelEditor && window.levelEditor.toolbar) {
        window.levelEditor.toolbar.selectTool('fill');
      }
      
      // Force redraw
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
      }
      
      const module = window.levelEditor.fileMenuBar.brushSizeModule;
      const currentTool = window.levelEditor.toolbar.getSelectedTool();
      
      return {
        visible: module.isVisible(),
        currentTool: currentTool,
        expectedVisible: false
      };
    });
    
    console.log('Fill tool state:', fillToolState);
    
    if (fillToolState.visible !== fillToolState.expectedVisible) {
      throw new Error(`Module should be hidden with fill tool, but visible=${fillToolState.visible}`);
    }
    
    await sleep(300);
    await saveScreenshot(page, 'levelEditor/brush_size_inline_hidden', true);
    
    // Test 3: Switch back to paint tool - module should reappear
    console.log('Test 3: Switching back to paint tool (module should show)...');
    const paintToolState = await page.evaluate(() => {
      if (window.levelEditor && window.levelEditor.toolbar) {
        window.levelEditor.toolbar.selectTool('paint');
      }
      
      // Force redraw
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
      }
      
      const module = window.levelEditor.fileMenuBar.brushSizeModule;
      const currentTool = window.levelEditor.toolbar.getSelectedTool();
      
      return {
        visible: module.isVisible(),
        currentTool: currentTool,
        expectedVisible: true
      };
    });
    
    console.log('Paint tool state:', paintToolState);
    
    if (paintToolState.visible !== paintToolState.expectedVisible) {
      throw new Error(`Module should be visible with paint tool, but visible=${paintToolState.visible}`);
    }
    
    await sleep(300);
    await saveScreenshot(page, 'levelEditor/brush_size_inline_reappeared', true);
    
    // Test 4: Click + button to increase size
    console.log('Test 4: Clicking + button to increase size...');
    const increaseResult = await page.evaluate(() => {
      const module = window.levelEditor.fileMenuBar.brushSizeModule;
      const beforeSize = module.getSize();
      
      module.increase();
      
      const afterSize = module.getSize();
      
      return {
        beforeSize: beforeSize,
        afterSize: afterSize,
        expected: beforeSize + 1
      };
    });
    
    console.log('Increase result:', increaseResult);
    
    if (increaseResult.afterSize !== increaseResult.expected) {
      throw new Error(`Expected size ${increaseResult.expected}, got ${increaseResult.afterSize}`);
    }
    
    await sleep(300);
    await saveScreenshot(page, 'levelEditor/brush_size_increased', true);
    
    // Test 5: Click - button to decrease size
    console.log('Test 5: Clicking - button to decrease size...');
    const decreaseResult = await page.evaluate(() => {
      const module = window.levelEditor.fileMenuBar.brushSizeModule;
      const beforeSize = module.getSize();
      
      module.decrease();
      
      const afterSize = module.getSize();
      
      return {
        beforeSize: beforeSize,
        afterSize: afterSize,
        expected: beforeSize - 1
      };
    });
    
    console.log('Decrease result:', decreaseResult);
    
    if (decreaseResult.afterSize !== decreaseResult.expected) {
      throw new Error(`Expected size ${decreaseResult.expected}, got ${decreaseResult.afterSize}`);
    }
    
    await sleep(300);
    await saveScreenshot(page, 'levelEditor/brush_size_decreased', true);
    
    // Test 6: Verify max size clamping
    console.log('Test 6: Testing max size (9)...');
    const maxSizeResult = await page.evaluate(() => {
      const module = window.levelEditor.fileMenuBar.brushSizeModule;
      module.setSize(9);
      module.increase(); // Try to go above 9
      
      return {
        size: module.getSize(),
        expected: 9
      };
    });
    
    console.log('Max size result:', maxSizeResult);
    
    if (maxSizeResult.size !== maxSizeResult.expected) {
      throw new Error(`Expected max size 9, got ${maxSizeResult.size}`);
    }
    
    await sleep(300);
    await saveScreenshot(page, 'levelEditor/brush_size_max', true);
    
    // Test 7: Verify min size clamping
    console.log('Test 7: Testing min size (1)...');
    const minSizeResult = await page.evaluate(() => {
      const module = window.levelEditor.fileMenuBar.brushSizeModule;
      module.setSize(1);
      module.decrease(); // Try to go below 1
      
      return {
        size: module.getSize(),
        expected: 1
      };
    });
    
    console.log('Min size result:', minSizeResult);
    
    if (minSizeResult.size !== minSizeResult.expected) {
      throw new Error(`Expected min size 1, got ${minSizeResult.size}`);
    }
    
    await sleep(300);
    await saveScreenshot(page, 'levelEditor/brush_size_min', true);
    
    console.log('✅ All inline brush size tests passed!');
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await saveScreenshot(page, 'levelEditor/brush_inline_error', false);
    await browser.close();
    process.exit(1);
  }
})();
