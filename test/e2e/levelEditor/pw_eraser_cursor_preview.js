/**
 * E2E Test: Eraser Tool Cursor Preview
 * 
 * CRITICAL BUG: Eraser tool doesn't show cursor preview highlight
 * - Paint tool shows green square preview when hovering
 * - Eraser tool should show RED square preview when hovering
 * - HoverPreviewManager.calculateAffectedTiles() doesn't handle 'eraser' case
 * 
 * This test validates that eraser cursor preview works correctly.
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
    await saveScreenshot(page, 'levelEditor/eraser_cursor_preview', false);
    await browser.close();
    process.exit(1);
  }
  
  // Open Level Editor
  const levelEditorResult = await page.evaluate(() => {
    if (!window.levelEditor) {
      return { success: false, error: 'Level Editor not found' };
    }
    
    // Activate Level Editor
    if (typeof window.levelEditor.activate === 'function') {
      window.levelEditor.activate();
    }
    
    // Switch to LEVEL_EDITOR game state
    if (window.GameState && typeof window.GameState.setState === 'function') {
      window.GameState.setState('LEVEL_EDITOR');
    }
    
    // Force render
    if (typeof window.redraw === 'function') {
      window.redraw(); window.redraw(); window.redraw();
    }
    
    return { success: true };
  });
  
  if (!levelEditorResult.success) {
    console.error('❌ Failed to open Level Editor:', levelEditorResult.error);
    await saveScreenshot(page, 'levelEditor/eraser_cursor_preview', false);
    await browser.close();
    process.exit(1);
  }
  
  await sleep(500);
  console.log('✅ Level Editor opened');
  
  // TEST 1: Check that HoverPreviewManager exists and has methods
  const hoverManagerCheck = await page.evaluate(() => {
    if (!window.levelEditor.hoverPreviewManager) {
      return { success: false, error: 'HoverPreviewManager not found' };
    }
    
    const hasUpdateHover = typeof window.levelEditor.hoverPreviewManager.updateHover === 'function';
    const hasGetHoveredTiles = typeof window.levelEditor.hoverPreviewManager.getHoveredTiles === 'function';
    const hasCalculateAffectedTiles = typeof window.levelEditor.hoverPreviewManager.calculateAffectedTiles === 'function';
    
    return {
      success: true,
      hasUpdateHover,
      hasGetHoveredTiles,
      hasCalculateAffectedTiles
    };
  });
  
  if (!hoverManagerCheck.success) {
    console.error('❌', hoverManagerCheck.error);
    await saveScreenshot(page, 'levelEditor/eraser_cursor_preview', false);
    await browser.close();
    process.exit(1);
  }
  
  console.log('✅ HoverPreviewManager found with methods:', hoverManagerCheck);
  
  // TEST 2: Paint tool should show cursor preview (baseline test)
  console.log('\nTEST 2: Paint tool cursor preview (baseline)...');
  const paintPreviewResult = await page.evaluate(() => {
    const toolbar = window.levelEditor.toolbar;
    const hoverManager = window.levelEditor.hoverPreviewManager;
    
    // Select paint tool
    toolbar.selectTool('paint');
    
    // Simulate hover at grid position (5, 5) with brush size 1
    hoverManager.updateHover(5, 5, 'paint', 1);
    
    // Get affected tiles
    const tiles = hoverManager.getHoveredTiles();
    
    return {
      success: true,
      selectedTool: toolbar.getSelectedTool(),
      tilesCount: tiles.length,
      tiles: tiles,
      expectedCount: 1 // Brush size 1 = 1x1 = 1 tile
    };
  });
  
  console.log('Paint tool preview:', paintPreviewResult);
  
  if (paintPreviewResult.tilesCount !== paintPreviewResult.expectedCount) {
    console.error(`❌ Paint tool preview failed: Expected ${paintPreviewResult.expectedCount} tiles, got ${paintPreviewResult.tilesCount}`);
    await saveScreenshot(page, 'levelEditor/eraser_cursor_preview_paint_fail', false);
    await browser.close();
    process.exit(1);
  }
  
  console.log('✅ Paint tool cursor preview works correctly');
  
  // TEST 3: Eraser tool should show cursor preview (BUG TEST - EXPECTED TO FAIL)
  console.log('\nTEST 3: Eraser tool cursor preview (BUG TEST)...');
  const eraserPreviewResult = await page.evaluate(() => {
    const toolbar = window.levelEditor.toolbar;
    const hoverManager = window.levelEditor.hoverPreviewManager;
    
    // Select eraser tool
    toolbar.selectTool('eraser');
    
    // Simulate hover at grid position (5, 5) with brush size 1
    hoverManager.updateHover(5, 5, 'eraser', 1);
    
    // Get affected tiles
    const tiles = hoverManager.getHoveredTiles();
    
    // Also check what calculateAffectedTiles returns directly
    const calculatedTiles = hoverManager.calculateAffectedTiles(5, 5, 'eraser', 1);
    
    return {
      success: true,
      selectedTool: toolbar.getSelectedTool(),
      tilesCount: tiles.length,
      calculatedTilesCount: calculatedTiles.length,
      tiles: tiles,
      calculatedTiles: calculatedTiles,
      expectedCount: 1 // Brush size 1 = 1x1 = 1 tile
    };
  });
  
  console.log('Eraser tool preview:', eraserPreviewResult);
  
  // THIS IS THE BUG: Eraser returns 0 tiles when it should return 1
  if (eraserPreviewResult.tilesCount === 0 && eraserPreviewResult.calculatedTilesCount === 0) {
    console.error('❌ BUG CONFIRMED: Eraser tool returns 0 tiles for cursor preview');
    console.error('   Expected: 1 tile (same as paint tool with brush size 1)');
    console.error('   Got: 0 tiles');
    console.error('   Root Cause: HoverPreviewManager.calculateAffectedTiles() missing case for "eraser"');
    await saveScreenshot(page, 'levelEditor/eraser_cursor_preview_bug', false);
    await browser.close();
    process.exit(1); // Exit with failure code to indicate bug found
  }
  
  // If we get here, the bug is fixed
  console.log('✅ Eraser tool cursor preview works correctly');
  
  // TEST 4: Eraser with brush size 3 should show 3x3 area
  console.log('\nTEST 4: Eraser tool with brush size 3...');
  const eraserBrushSize3Result = await page.evaluate(() => {
    const hoverManager = window.levelEditor.hoverPreviewManager;
    
    // Simulate hover with brush size 3
    hoverManager.updateHover(5, 5, 'eraser', 3);
    
    const tiles = hoverManager.getHoveredTiles();
    
    return {
      success: true,
      tilesCount: tiles.length,
      tiles: tiles,
      expectedCount: 9 // 3x3 = 9 tiles
    };
  });
  
  console.log('Eraser brush size 3:', eraserBrushSize3Result);
  
  if (eraserBrushSize3Result.tilesCount !== eraserBrushSize3Result.expectedCount) {
    console.error(`❌ Eraser brush size 3 failed: Expected ${eraserBrushSize3Result.expectedCount} tiles, got ${eraserBrushSize3Result.tilesCount}`);
    await saveScreenshot(page, 'levelEditor/eraser_cursor_preview', false);
    await browser.close();
    process.exit(1);
  }
  
  console.log('✅ Eraser tool with brush size 3 works correctly');
  
  console.log('\n✅ All cursor preview tests passed');
  await saveScreenshot(page, 'levelEditor/eraser_cursor_preview', true);
  await browser.close();
  process.exit(0);
})();
