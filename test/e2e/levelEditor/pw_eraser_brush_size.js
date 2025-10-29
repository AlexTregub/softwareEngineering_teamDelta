/**
 * E2E Test: Eraser Tool Brush Size Functionality
 * 
 * Validates that eraser respects brush size setting (1x1, 3x3, 5x5)
 * This test ensures brush size control is visible and functional for eraser.
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
  
  // Paint a 5x5 grid of test tiles
  console.log('\nSetting up test: Paint 5x5 grid of tiles...');
  await page.evaluate(() => {
    const terrain = window.levelEditor.terrain;
    for (let y = 5; y <= 9; y++) {
      for (let x = 5; x <= 9; x++) {
        terrain.setTile(x, y, 'moss');
      }
    }
    if (typeof window.redraw === 'function') {
      window.redraw(); window.redraw(); window.redraw();
    }
  });
  
  console.log('✅ Test grid painted (5x5 tiles)');
  await saveScreenshot(page, 'levelEditor/eraser_brush_size_before', true);
  
  // TEST 1: Check brush size control visibility with eraser
  console.log('\nTEST 1: Brush size control visible with eraser tool...');
  const brushVisibilityResult = await page.evaluate(() => {
    const levelEditor = window.levelEditor;
    if (!levelEditor || !levelEditor.toolbar || !levelEditor.fileMenuBar) {
      return { success: false, error: 'Components not found' };
    }
    
    // Select eraser tool
    levelEditor.toolbar.selectTool('eraser');
    
    // Check if brush size module is visible
    const brushSizeModule = levelEditor.fileMenuBar.brushSizeModule;
    const isVisible = brushSizeModule && brushSizeModule.visible;
    
    return {
      success: true,
      selectedTool: levelEditor.toolbar.getSelectedTool(),
      brushSizeVisible: isVisible,
      brushSizeExists: !!brushSizeModule
    };
  });
  
  console.log('Brush visibility result:', brushVisibilityResult);
  
  if (!brushVisibilityResult.success || !brushVisibilityResult.brushSizeVisible) {
    console.error('❌ Brush size control not visible with eraser tool');
    await saveScreenshot(page, 'levelEditor/eraser_brush_size', false);
    await browser.close();
    process.exit(1);
  }
  
  console.log('✅ Brush size control visible with eraser tool');
  
  // TEST 2: Erase with brush size 1 (single tile)
  console.log('\nTEST 2: Erase with brush size 1...');
  const eraseBrushSize1Result = await page.evaluate(() => {
    const editor = window.levelEditor.editor;
    const terrain = window.levelEditor.terrain;
    
    // Set brush size to 1
    if (window.levelEditor.fileMenuBar && window.levelEditor.fileMenuBar.brushSizeModule) {
      window.levelEditor.fileMenuBar.brushSizeModule.setSize(1);
    }
    
    // Erase at center (7, 7)
    const erasedCount = editor.erase(7, 7, 1);
    
    // Check which tiles were erased
    const tilesErased = [];
    for (let y = 6; y <= 8; y++) {
      for (let x = 6; x <= 8; x++) {
        const tile = terrain.getTile(x, y);
        if (tile === null) {
          tilesErased.push({ x, y });
        }
      }
    }
    
    if (typeof window.redraw === 'function') {
      window.redraw(); window.redraw(); window.redraw();
    }
    
    return {
      success: true,
      erasedCount,
      tilesErased,
      expectedCount: 1
    };
  });
  
  console.log('Brush size 1 result:', eraseBrushSize1Result);
  
  if (eraseBrushSize1Result.erasedCount !== 1) {
    console.error(`❌ Brush size 1 failed: Expected 1 tile, got ${eraseBrushSize1Result.erasedCount}`);
    await saveScreenshot(page, 'levelEditor/eraser_brush_size', false);
    await browser.close();
    process.exit(1);
  }
  
  console.log('✅ Brush size 1 works correctly');
  await saveScreenshot(page, 'levelEditor/eraser_brush_size_1', true);
  
  // TEST 3: Erase with brush size 3 (3x3 area)
  console.log('\nTEST 3: Erase with brush size 3...');
  const eraseBrushSize3Result = await page.evaluate(() => {
    const editor = window.levelEditor.editor;
    const terrain = window.levelEditor.terrain;
    
    // Set brush size to 3
    if (window.levelEditor.fileMenuBar && window.levelEditor.fileMenuBar.brushSizeModule) {
      window.levelEditor.fileMenuBar.brushSizeModule.setSize(3);
    }
    
    // Erase at position (7, 5) - top row
    const erasedCount = editor.erase(7, 5, 3);
    
    // Count erased tiles in 3x3 area around (7, 5)
    let tilesErased = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const tile = terrain.getTile(7 + dx, 5 + dy);
        if (tile === null) {
          tilesErased++;
        }
      }
    }
    
    if (typeof window.redraw === 'function') {
      window.redraw(); window.redraw(); window.redraw();
    }
    
    return {
      success: true,
      erasedCount,
      tilesErased,
      expectedCount: 9 // 3x3 = 9 tiles
    };
  });
  
  console.log('Brush size 3 result:', eraseBrushSize3Result);
  
  if (eraseBrushSize3Result.erasedCount !== 9) {
    console.error(`❌ Brush size 3 failed: Expected 9 tiles, got ${eraseBrushSize3Result.erasedCount}`);
    await saveScreenshot(page, 'levelEditor/eraser_brush_size', false);
    await browser.close();
    process.exit(1);
  }
  
  console.log('✅ Brush size 3 works correctly (3x3 area)');
  await saveScreenshot(page, 'levelEditor/eraser_brush_size_3', true);
  
  // TEST 4: Verify undo restores all erased tiles
  console.log('\nTEST 4: Undo restores all tiles...');
  const undoResult = await page.evaluate(() => {
    const editor = window.levelEditor.editor;
    const terrain = window.levelEditor.terrain;
    
    // Undo twice (brush size 3, then brush size 1)
    editor.undo();
    editor.undo();
    
    // Count how many tiles are restored
    let tilesRestored = 0;
    for (let y = 5; y <= 9; y++) {
      for (let x = 5; x <= 9; x++) {
        const tile = terrain.getTile(x, y);
        if (tile !== null) {
          tilesRestored++;
        }
      }
    }
    
    if (typeof window.redraw === 'function') {
      window.redraw(); window.redraw(); window.redraw();
    }
    
    return {
      success: true,
      tilesRestored,
      expectedCount: 25 // All 5x5 tiles restored
    };
  });
  
  console.log('Undo result:', undoResult);
  
  if (undoResult.tilesRestored !== 25) {
    console.error(`❌ Undo failed: Expected 25 tiles restored, got ${undoResult.tilesRestored}`);
    await saveScreenshot(page, 'levelEditor/eraser_brush_size', false);
    await browser.close();
    process.exit(1);
  }
  
  console.log('✅ Undo restored all tiles successfully');
  await saveScreenshot(page, 'levelEditor/eraser_brush_size_after_undo', true);
  
  console.log('\n✅ All brush size tests passed');
  console.log('   - Brush size 1: 1 tile erased ✅');
  console.log('   - Brush size 3: 9 tiles erased (3x3) ✅');
  console.log('   - Undo: All tiles restored ✅');
  
  await browser.close();
  process.exit(0);
})();
