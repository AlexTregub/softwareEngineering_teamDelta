/**
 * E2E Test: Shift+Scroll Brush Size Shortcut
 * 
 * BUG: Shift+Scroll works for paint tool but NOT for eraser tool
 * 
 * This test validates that Shift+MouseWheel changes brush size for both tools.
 * 
 * User Request: Make this reusable for future shortcuts/parameters.
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  console.log('Loading game...');
  await page.goto('http://localhost:8000?test=1');
  await sleep(1000);
  
  console.log('Starting game and opening Level Editor...');
  const gameStarted = await cameraHelper.ensureGameStarted(page);
  if (!gameStarted.started) {
    console.error('❌ Game failed to start');
    await browser.close();
    process.exit(1);
  }
  
  // Open Level Editor
  await page.evaluate(() => {
    if (window.levelEditor && typeof window.levelEditor.activate === 'function') {
      window.levelEditor.activate();
    }
    if (window.GameState && typeof window.GameState.setState === 'function') {
      window.GameState.setState('LEVEL_EDITOR');
    }
    if (typeof window.redraw === 'function') {
      window.redraw(); window.redraw(); window.redraw();
    }
  });
  
  await sleep(500);
  console.log('✅ Level Editor opened');
  
  // TEST 1: Shift+Scroll with Paint Tool (baseline - should work)
  console.log('\nTEST 1: Paint tool - Shift+Scroll to change brush size...');
  const paintShiftScrollResult = await page.evaluate(() => {
    const levelEditor = window.levelEditor;
    if (!levelEditor || !levelEditor.toolbar || !levelEditor.fileMenuBar) {
      return { success: false, error: 'Components not found' };
    }
    
    // Select paint tool
    levelEditor.toolbar.selectTool('paint');
    
    // Set brush size to 1
    if (levelEditor.fileMenuBar.brushSizeModule) {
      levelEditor.fileMenuBar.brushSizeModule.setSize(1);
    }
    
    const sizeBefore = levelEditor.fileMenuBar.brushSizeModule.getSize();
    
    // Simulate Shift+MouseWheel UP (should increase brush size)
    const shiftHeld = true;
    const mockEvent = { deltaY: -100 }; // Negative = scroll up
    const mouseX = 400; // Middle of canvas
    const mouseY = 300;
    
    if (typeof levelEditor.handleMouseWheel === 'function') {
      levelEditor.handleMouseWheel(mockEvent, shiftHeld, mouseX, mouseY);
    }
    
    const sizeAfter = levelEditor.fileMenuBar.brushSizeModule.getSize();
    
    return {
      success: true,
      tool: 'paint',
      sizeBefore,
      sizeAfter,
      sizeChanged: sizeAfter > sizeBefore,
      expectedBehavior: 'Brush size should increase when scrolling up with Shift'
    };
  });
  
  console.log('Paint Shift+Scroll result:', paintShiftScrollResult);
  
  if (!paintShiftScrollResult.success || !paintShiftScrollResult.sizeChanged) {
    console.error('❌ Paint tool Shift+Scroll not working (baseline failed)');
    await saveScreenshot(page, 'levelEditor/shift_scroll_paint_fail', false);
    await browser.close();
    process.exit(1);
  }
  
  console.log('✅ Paint tool: Shift+Scroll works correctly');
  
  // TEST 2: Shift+Scroll with Eraser Tool (BUG - EXPECTED TO FAIL)
  console.log('\nTEST 2: Eraser tool - Shift+Scroll to change brush size (BUG TEST)...');
  const eraserShiftScrollResult = await page.evaluate(() => {
    const levelEditor = window.levelEditor;
    if (!levelEditor || !levelEditor.toolbar || !levelEditor.fileMenuBar) {
      return { success: false, error: 'Components not found' };
    }
    
    // Select eraser tool
    levelEditor.toolbar.selectTool('eraser');
    
    // Set brush size to 1
    if (levelEditor.fileMenuBar.brushSizeModule) {
      levelEditor.fileMenuBar.brushSizeModule.setSize(1);
    }
    
    const sizeBefore = levelEditor.fileMenuBar.brushSizeModule.getSize();
    
    // Simulate Shift+MouseWheel UP (should increase brush size)
    const shiftHeld = true;
    const mockEvent = { deltaY: -100 }; // Negative = scroll up
    const mouseX = 400; // Middle of canvas
    const mouseY = 300;
    
    if (typeof levelEditor.handleMouseWheel === 'function') {
      levelEditor.handleMouseWheel(mockEvent, shiftHeld, mouseX, mouseY);
    }
    
    const sizeAfter = levelEditor.fileMenuBar.brushSizeModule.getSize();
    
    return {
      success: true,
      tool: 'eraser',
      sizeBefore,
      sizeAfter,
      sizeChanged: sizeAfter > sizeBefore,
      expectedBehavior: 'Brush size should increase when scrolling up with Shift'
    };
  });
  
  console.log('Eraser Shift+Scroll result:', eraserShiftScrollResult);
  
  // THIS IS THE BUG: Eraser Shift+Scroll does NOT change brush size
  if (!eraserShiftScrollResult.sizeChanged) {
    console.error('❌ BUG CONFIRMED: Eraser tool Shift+Scroll does NOT change brush size');
    console.error('   Before: Size =', eraserShiftScrollResult.sizeBefore);
    console.error('   After: Size =', eraserShiftScrollResult.sizeAfter);
    console.error('   Expected: Size should have increased');
    console.error('   Root Cause: LevelEditor.handleMouseWheel() likely only handles paint tool');
    await saveScreenshot(page, 'levelEditor/shift_scroll_eraser_bug', false);
    await browser.close();
    process.exit(1); // Exit with failure to confirm bug
  }
  
  // If we get here, the bug is fixed
  console.log('✅ Eraser tool: Shift+Scroll works correctly');
  
  // TEST 3: Shift+Scroll DOWN decreases size
  console.log('\nTEST 3: Shift+Scroll DOWN decreases brush size...');
  const scrollDownResult = await page.evaluate(() => {
    const levelEditor = window.levelEditor;
    
    // Set brush size to 5
    if (levelEditor.fileMenuBar.brushSizeModule) {
      levelEditor.fileMenuBar.brushSizeModule.setSize(5);
    }
    
    const sizeBefore = levelEditor.fileMenuBar.brushSizeModule.getSize();
    
    // Simulate Shift+MouseWheel DOWN (should decrease brush size)
    const shiftHeld = true;
    const mockEvent = { deltaY: 100 }; // Positive = scroll down
    const mouseX = 400; // Middle of canvas
    const mouseY = 300;
    
    if (typeof levelEditor.handleMouseWheel === 'function') {
      levelEditor.handleMouseWheel(mockEvent, shiftHeld, mouseX, mouseY);
    }
    
    const sizeAfter = levelEditor.fileMenuBar.brushSizeModule.getSize();
    
    return {
      success: true,
      sizeBefore,
      sizeAfter,
      decreased: sizeAfter < sizeBefore
    };
  });
  
  console.log('Scroll down result:', scrollDownResult);
  
  if (!scrollDownResult.success || !scrollDownResult.decreased) {
    console.error('❌ Shift+Scroll DOWN failed to decrease size');
    await saveScreenshot(page, 'levelEditor/shift_scroll', false);
    await browser.close();
    process.exit(1);
  }
  
  console.log('✅ Shift+Scroll DOWN works correctly');
  
  console.log('\n✅ All Shift+Scroll tests passed');
  await browser.close();
  process.exit(0);
})();
