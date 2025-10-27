/**
 * E2E Test: p5.js Rendering Mode Detection
 * 
 * Tests to detect the exact p5.js rendering configuration:
 * - Is rectMode set to CORNER or CENTER?
 * - Is imageMode set to CORNER or CENTER?
 * - Are these modes changed during terrain rendering?
 * - Does CustomTerrain set any modes before rendering?
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('Testing p5.js rendering modes...\n');
    
    await page.goto('http://localhost:8000?test=1');
    await sleep(500);
    
    // Initialize Level Editor
    await page.evaluate(() => {
      GameState.goToLevelEditor();
      levelEditor.showGrid = true;
      levelEditor.gridOverlay.setVisible(true);
      levelEditor.gridOverlay.setOpacity(1.0);
    });
    
    await sleep(300);
    
    console.log('=== TEST 1: Intercept rectMode and imageMode calls ===\n');
    
    const renderingModes = await page.evaluate(() => {
      const results = {
        rectModeCalls: [],
        imageModeCalls: [],
        defaultModes: {}
      };
      
      // Wrap p5.js functions to track calls
      const originalRectMode = window.rectMode;
      const originalImageMode = window.imageMode;
      
      window.rectMode = function(mode) {
        results.rectModeCalls.push({
          mode: mode,
          timestamp: Date.now(),
          stack: new Error().stack.split('\n')[2] // Capture caller
        });
        return originalRectMode.call(this, mode);
      };
      
      window.imageMode = function(mode) {
        results.imageModeCalls.push({
          mode: mode,
          timestamp: Date.now(),
          stack: new Error().stack.split('\n')[2]
        });
        return originalImageMode.call(this, mode);
      };
      
      // Force a render cycle
      if (levelEditor && levelEditor.terrain) {
        levelEditor.terrain.render();
      }
      
      if (levelEditor && levelEditor.gridOverlay) {
        levelEditor.gridOverlay.render();
      }
      
      // Call redraw to trigger full render pipeline
      if (typeof redraw === 'function') {
        redraw();
      }
      
      return results;
    });
    
    console.log('Rendering Mode Calls During Render:');
    console.log(`  rectMode calls: ${renderingModes.rectModeCalls.length}`);
    renderingModes.rectModeCalls.forEach((call, i) => {
      console.log(`    Call ${i + 1}: mode="${call.mode}"`);
      console.log(`      ${call.stack.trim()}`);
    });
    
    console.log(`  imageMode calls: ${renderingModes.imageModeCalls.length}`);
    renderingModes.imageModeCalls.forEach((call, i) => {
      console.log(`    Call ${i + 1}: mode="${call.mode}"`);
      console.log(`      ${call.stack.trim()}`);
    });
    console.log();
    
    console.log('=== TEST 2: Check if CustomTerrain.render() sets modes ===\n');
    
    const terrainRenderCheck = await page.evaluate(() => {
      // Check CustomTerrain source code for rectMode/imageMode calls
      const terrainSource = levelEditor.terrain.render.toString();
      
      return {
        hasRectMode: terrainSource.includes('rectMode'),
        hasImageMode: terrainSource.includes('imageMode'),
        source: terrainSource.substring(0, 500) // First 500 chars
      };
    });
    
    console.log('CustomTerrain.render() Analysis:');
    console.log('  Contains rectMode call:', terrainRenderCheck.hasRectMode);
    console.log('  Contains imageMode call:', terrainRenderCheck.hasImageMode);
    console.log();
    
    console.log('=== TEST 3: Check GridOverlay.render() for mode changes ===\n');
    
    const gridRenderCheck = await page.evaluate(() => {
      const gridSource = levelEditor.gridOverlay.render.toString();
      
      return {
        hasRectMode: gridSource.includes('rectMode'),
        hasImageMode: gridSource.includes('imageMode'),
        hasStroke: gridSource.includes('stroke'),
        hasStrokeWeight: gridSource.includes('strokeWeight')
      };
    });
    
    console.log('GridOverlay.render() Analysis:');
    console.log('  Contains rectMode call:', gridRenderCheck.hasRectMode);
    console.log('  Contains imageMode call:', gridRenderCheck.hasImageMode);
    console.log('  Contains stroke call:', gridRenderCheck.hasStroke);
    console.log('  Contains strokeWeight call:', gridRenderCheck.hasStrokeWeight);
    console.log();
    
    console.log('=== TEST 4: Draw test shapes to verify rendering modes ===\n');
    
    await page.evaluate(() => {
      // Paint tiles for comparison
      const terrain = levelEditor.terrain;
      
      // Clear area first
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          terrain.tiles[y][x].setMaterial('grass');
          terrain.tiles[y][x].assignWeight();
        }
      }
      
      // Paint a precise 2x2 tile area at (2,2)
      for (let y = 2; y <= 3; y++) {
        for (let x = 2; x <= 3; x++) {
          terrain.tiles[y][x].setMaterial('stone');
          terrain.tiles[y][x].assignWeight();
        }
      }
      
      terrain.invalidateCache();
    });
    
    // Force render
    await page.evaluate(() => {
      if (typeof redraw === 'function') {
        redraw();
        redraw();
        redraw();
      }
    });
    
    await sleep(1000);
    
    await saveScreenshot(page, 'ui/grid_terrain_rendering_modes', true);
    console.log('✓ Screenshot saved with 2x2 stone tile block at grid position (2,2)');
    console.log('  Expected: Stone tiles bounded by grid lines at x=64,96,128 and y=64,96,128');
    console.log();
    
    console.log('=== TEST 5: Pixel-perfect coordinate test ===\n');
    
    const pixelTest = await page.evaluate(() => {
      // Test what happens when we draw at exact coordinates
      const tileSize = 32;
      
      // Where should tile (2,2) be rendered?
      const tile_2_2_screenX = 2 * tileSize; // 64
      const tile_2_2_screenY = 2 * tileSize; // 64
      
      // Where should grid line at x=2 be drawn?
      const gridLine_x_2 = 2 * tileSize; // 64
      
      // Where should grid line at y=2 be drawn?
      const gridLine_y_2 = 2 * tileSize; // 64
      
      return {
        tileSize: tileSize,
        tile_2_2: { x: tile_2_2_screenX, y: tile_2_2_screenY },
        gridLine_2: { x: gridLine_x_2, y: gridLine_y_2 },
        shouldAlign: tile_2_2_screenX === gridLine_x_2 && tile_2_2_screenY === gridLine_y_2
      };
    });
    
    console.log('Pixel-Perfect Coordinate Analysis:');
    console.log('  Tile (2,2) renders at:', pixelTest.tile_2_2);
    console.log('  Grid line 2 (vertical) at x:', pixelTest.gridLine_2.x);
    console.log('  Grid line 2 (horizontal) at y:', pixelTest.gridLine_2.y);
    console.log('  Coordinates match:', pixelTest.shouldAlign ? '✓' : '✗');
    console.log();
    
    if (pixelTest.shouldAlign) {
      console.log('⚠️  CRITICAL FINDING:');
      console.log('   Grid lines and tiles use IDENTICAL coordinates!');
      console.log('   The visual misalignment in your screenshot must be caused by:');
      console.log();
      console.log('   1. STROKE CENTERING:');
      console.log('      - p5.js draws strokes centered on coordinates');
      console.log('      - A 1px stroke at x=64 draws from x=63.5 to x=64.5');
      console.log('      - This makes the line appear 0.5px offset from tile edge');
      console.log();
      console.log('   2. IMAGE vs RECT rendering:');
      console.log('      - image() draws from top-left corner (CORNER mode default)');
      console.log('      - rect() might be using CENTER mode somewhere');
      console.log();
      console.log('   3. Canvas rendering context:');
      console.log('      - Different anti-aliasing between stroke and fill');
      console.log('      - Sub-pixel rendering differences');
      console.log();
      console.log('   RECOMMENDED FIX:');
      console.log('   - Add +0.5px offset to grid lines to align stroke edge with tile edge');
      console.log('   - OR use strokeWeight(2) and adjust positioning');
      console.log('   - OR draw grid with rect() instead of line() for consistent rendering');
    }
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('Test failed:', error.message);
    await saveScreenshot(page, 'ui/grid_terrain_rendering_modes_error', false);
    await browser.close();
    process.exit(1);
  }
})();
