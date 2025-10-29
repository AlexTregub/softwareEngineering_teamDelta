/**
 * E2E Test: Eraser Tool Click Functionality
 * 
 * BUG: Eraser shows red cursor preview but clicking doesn't actually erase tiles
 * 
 * This test validates that clicking with eraser tool removes tiles from terrain.
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
  
  // TEST 1: Paint a test tile first
  console.log('\nTEST 1: Paint test tile at (10, 10)...');
  const paintResult = await page.evaluate(() => {
    if (!window.levelEditor || !window.levelEditor.terrain) {
      return { success: false, error: 'Level Editor or terrain not found' };
    }
    
    const terrain = window.levelEditor.terrain;
    
    // Paint a moss tile at (10, 10)
    terrain.setTile(10, 10, 'moss');
    
    // Verify tile exists
    const tile = terrain.getTile(10, 10);
    
    if (typeof window.redraw === 'function') {
      window.redraw(); window.redraw(); window.redraw();
    }
    
    return {
      success: true,
      tileExists: tile !== null,
      tileMaterial: tile ? tile.material : null
    };
  });
  
  console.log('Paint result:', paintResult);
  
  if (!paintResult.success || !paintResult.tileExists) {
    console.error('❌ Failed to paint test tile');
    await saveScreenshot(page, 'levelEditor/eraser_click_paint_fail', false);
    await browser.close();
    process.exit(1);
  }
  
  console.log('✅ Test tile painted successfully');
  await saveScreenshot(page, 'levelEditor/eraser_click_before', true);
  
  // TEST 2: Select eraser tool
  console.log('\nTEST 2: Select eraser tool...');
  const selectEraserResult = await page.evaluate(() => {
    if (!window.levelEditor || !window.levelEditor.toolbar) {
      return { success: false, error: 'Toolbar not found' };
    }
    
    const toolbar = window.levelEditor.toolbar;
    toolbar.selectTool('eraser');
    
    const selectedTool = toolbar.getSelectedTool();
    
    return {
      success: true,
      selectedTool: selectedTool,
      isEraser: selectedTool === 'eraser'
    };
  });
  
  console.log('Select eraser result:', selectEraserResult);
  
  if (!selectEraserResult.success || !selectEraserResult.isEraser) {
    console.error('❌ Failed to select eraser tool');
    await saveScreenshot(page, 'levelEditor/eraser_click', false);
    await browser.close();
    process.exit(1);
  }
  
  console.log('✅ Eraser tool selected');
  
  // TEST 3: Click to erase the tile (THIS IS THE BUG - EXPECTED TO FAIL)
  console.log('\nTEST 3: Click with eraser to remove tile...');
  const eraseClickResult = await page.evaluate(() => {
    if (!window.levelEditor) {
      return { success: false, error: 'Level Editor not found' };
    }
    
    const terrain = window.levelEditor.terrain;
    const editor = window.levelEditor.editor;
    const tileSize = terrain.tileSize || 32;
    
    // Calculate screen coordinates for tile (10, 10)
    const screenX = 10 * tileSize + tileSize / 2;
    const screenY = 10 * tileSize + tileSize / 2;
    
    // Check tile exists BEFORE click
    const tileBefore = terrain.getTile(10, 10);
    
    // Simulate click at tile position
    if (typeof window.levelEditor.handleClick === 'function') {
      window.levelEditor.handleClick(screenX, screenY);
    }
    
    // Check tile exists AFTER click
    const tileAfter = terrain.getTile(10, 10);
    
    if (typeof window.redraw === 'function') {
      window.redraw(); window.redraw(); window.redraw();
    }
    
    return {
      success: true,
      tileBeforeExists: tileBefore !== null,
      tileBeforeMaterial: tileBefore ? tileBefore.material : null,
      tileAfterExists: tileAfter !== null,
      tileAfterMaterial: tileAfter ? tileAfter.material : null,
      wasErased: tileBefore !== null && tileAfter === null
    };
  });
  
  console.log('Erase click result:', eraseClickResult);
  
  // THIS IS THE BUG: Tile should be erased but still exists
  if (!eraseClickResult.wasErased) {
    console.error('❌ BUG CONFIRMED: Tile was NOT erased by click');
    console.error('   Before click: Tile exists =', eraseClickResult.tileBeforeExists, 'Material =', eraseClickResult.tileBeforeMaterial);
    console.error('   After click: Tile exists =', eraseClickResult.tileAfterExists, 'Material =', eraseClickResult.tileAfterMaterial);
    console.error('   Root Cause: LevelEditor.handleClick() does not handle eraser tool');
    await saveScreenshot(page, 'levelEditor/eraser_click_bug', false);
    await browser.close();
    process.exit(1); // Exit with failure to confirm bug
  }
  
  // If we get here, the bug is fixed
  console.log('✅ Tile was erased successfully');
  await saveScreenshot(page, 'levelEditor/eraser_click_after', true);
  
  // TEST 4: Verify undo works
  console.log('\nTEST 4: Undo erase operation...');
  const undoResult = await page.evaluate(() => {
    const editor = window.levelEditor.editor;
    
    editor.undo();
    
    const tileAfterUndo = window.levelEditor.terrain.getTile(10, 10);
    
    if (typeof window.redraw === 'function') {
      window.redraw(); window.redraw(); window.redraw();
    }
    
    return {
      success: true,
      tileRestored: tileAfterUndo !== null,
      tileMaterial: tileAfterUndo ? tileAfterUndo.material : null
    };
  });
  
  console.log('Undo result:', undoResult);
  
  if (!undoResult.success || !undoResult.tileRestored) {
    console.error('❌ Undo failed to restore tile');
    await saveScreenshot(page, 'levelEditor/eraser_click', false);
    await browser.close();
    process.exit(1);
  }
  
  console.log('✅ Undo restored tile successfully');
  
  console.log('\n✅ All eraser click tests passed');
  await browser.close();
  process.exit(0);
})();
