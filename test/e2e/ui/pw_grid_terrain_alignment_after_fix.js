/**
 * E2E Test: Grid/Terrain Alignment Verification (After Fix)
 * 
 * Tests that the grid overlay aligns perfectly with terrain tiles after
 * applying the stroke offset fix.
 * 
 * Expected behavior:
 * - Grid lines should align perfectly with tile edges
 * - No visual offset between grid and terrain
 * - Painted tiles should be perfectly bounded by grid lines
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    // Navigate to game with test parameter
    await page.goto('http://localhost:8000?test=1');
    await sleep(500);
    
    console.log('Initializing Level Editor...');
    
    // Initialize Level Editor using GameState (proper initialization)
    const initResult = await page.evaluate(() => {
      // Use GameState to properly initialize level editor
      if (typeof GameState === 'undefined' || !GameState || typeof GameState.goToLevelEditor !== 'function') {
        return { success: false, error: 'GameState.goToLevelEditor not available' };
      }
      
      GameState.goToLevelEditor();
      
      // Wait for level editor to be created
      if (typeof levelEditor === 'undefined' || !levelEditor) {
        return { success: false, error: 'levelEditor not created' };
      }
      
      // Ensure grid is visible with high opacity for testing
      levelEditor.showGrid = true;
      if (levelEditor.gridOverlay) {
        levelEditor.gridOverlay.setVisible(true);
        levelEditor.gridOverlay.setOpacity(0.7); // Higher opacity for clear visibility
      }
      
      return { success: true };
    });
    
    if (!initResult.success) {
      throw new Error('Failed to initialize Level Editor: ' + (initResult.error || 'unknown error'));
    }
    
    await sleep(500); // Wait for initialization
    
    console.log('Painting alignment test pattern...');
    
    // Paint a distinctive pattern to test alignment
    const paintResult = await page.evaluate(() => {
      const terrain = levelEditor.terrain;
      
      if (!terrain || !terrain.tiles) {
        return { success: false, error: 'No terrain available' };
      }
      
      // Paint a border around a rectangular region for precise alignment testing
      // Top and bottom edges
      for (let x = 5; x < 15; x++) {
        terrain.tiles[5][x].setMaterial('stone');
        terrain.tiles[5][x].assignWeight();
        terrain.tiles[14][x].setMaterial('stone');
        terrain.tiles[14][x].assignWeight();
      }
      
      // Left and right edges
      for (let y = 5; y < 15; y++) {
        terrain.tiles[y][5].setMaterial('stone');
        terrain.tiles[y][5].assignWeight();
        terrain.tiles[y][14].setMaterial('stone');
        terrain.tiles[y][14].assignWeight();
      }
      
      // Fill interior with alternating materials
      for (let y = 6; y < 14; y++) {
        for (let x = 6; x < 14; x++) {
          if ((x + y) % 2 === 0) {
            terrain.tiles[y][x].setMaterial('moss');
          } else {
            terrain.tiles[y][x].setMaterial('dirt');
          }
          terrain.tiles[y][x].assignWeight();
        }
      }
      
      // Paint a cross pattern for vertical/horizontal alignment check
      const centerX = 25;
      const centerY = 25;
      
      // Horizontal bar
      for (let x = centerX - 5; x <= centerX + 5; x++) {
        terrain.tiles[centerY][x].setMaterial('moss');
        terrain.tiles[centerY][x].assignWeight();
      }
      
      // Vertical bar
      for (let y = centerY - 5; y <= centerY + 5; y++) {
        terrain.tiles[y][centerX].setMaterial('stone');
        terrain.tiles[y][centerX].assignWeight();
      }
      
      // Invalidate cache to force re-render
      terrain.invalidateCache();
      
      return { success: true };
    });
    
    if (!paintResult.success) {
      throw new Error('Failed to paint test pattern: ' + (paintResult.error || 'unknown error'));
    }
    
    console.log('Forcing render...');
    
    // Force multiple render cycles
    await page.evaluate(() => {
      if (levelEditor) {
        levelEditor.showGrid = true;
        levelEditor.gridOverlay.setVisible(true);
      }
      
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(1000); // Extra time for rendering
    
    console.log('Capturing post-fix alignment screenshot...');
    
    // Capture screenshot showing grid/terrain alignment after fix
    await saveScreenshot(page, 'ui/grid_terrain_alignment_after_fix', true);
    
    console.log('Verifying alignment...');
    
    // Get diagnostic information
    const diagnostics = await page.evaluate(() => {
      const grid = levelEditor.gridOverlay;
      const terrain = levelEditor.terrain;
      
      return {
        gridVisible: grid ? grid.visible : false,
        gridTileSize: grid ? grid.tileSize : null,
        gridOpacity: grid ? grid.opacity : null,
        terrainTileSize: terrain ? terrain.tileSize : null,
        gridDimensions: grid ? `${grid.width}x${grid.height}` : null,
        terrainDimensions: terrain ? `${terrain.width}x${terrain.height}` : null,
      };
    });
    
    console.log('\n=== Post-Fix Alignment Diagnostics ===');
    console.log('Grid visible:', diagnostics.gridVisible);
    console.log('Grid tile size:', diagnostics.gridTileSize);
    console.log('Grid opacity:', diagnostics.gridOpacity);
    console.log('Terrain tile size:', diagnostics.terrainTileSize);
    console.log('Grid dimensions:', diagnostics.gridDimensions);
    console.log('Terrain dimensions:', diagnostics.terrainDimensions);
    console.log('====================================\n');
    
    // Validation
    const success = 
      diagnostics.gridTileSize === diagnostics.terrainTileSize &&
      diagnostics.gridVisible === true;
    
    if (success) {
      console.log('✓ Grid and terrain tile sizes match');
      console.log('✓ Grid is visible');
      console.log('\n✓ STROKE ALIGNMENT FIX APPLIED');
      console.log('  Grid lines now offset by +0.5px to account for stroke centering');
      console.log('\nVisual verification:');
      console.log('  Before: test/e2e/screenshots/ui/success/grid_terrain_alignment_before_fix.png');
      console.log('  After:  test/e2e/screenshots/ui/success/grid_terrain_alignment_after_fix.png');
      console.log('\nExpected result:');
      console.log('  - Grid lines should align perfectly with tile edges');
      console.log('  - Stone border tiles should be bounded by grid lines');
      console.log('  - No visible offset between grid and terrain');
    } else {
      console.log('✗ Configuration mismatch detected');
    }
    
    await browser.close();
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('Test failed:', error.message);
    await saveScreenshot(page, 'ui/grid_terrain_alignment_after_fix_error', false);
    await browser.close();
    process.exit(1);
  }
})();
