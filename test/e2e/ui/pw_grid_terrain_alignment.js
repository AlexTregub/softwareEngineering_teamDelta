/**
 * E2E Test: Grid/Terrain Alignment Verification
 * 
 * Tests that the grid overlay aligns perfectly with terrain tiles.
 * Captures screenshot showing grid lines and painted terrain for visual verification.
 * 
 * Expected behavior:
 * - Grid lines should align with tile edges
 * - No 0.5 tile offset in x or y direction
 * - Painted tiles should be bounded by grid lines
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
      
      // Ensure grid is visible
      levelEditor.showGrid = true;
      if (levelEditor.gridOverlay) {
        levelEditor.gridOverlay.setVisible(true);
        levelEditor.gridOverlay.setOpacity(0.5); // Higher opacity for visibility
      }
      
      return { success: true };
    })
    
    if (!initResult.success) {
      throw new Error('Failed to initialize Level Editor: ' + (initResult.error || 'unknown error'));
    }
    
    await sleep(500); // Wait for initialization
    
    console.log('Painting test pattern...');
    
    // Paint a distinctive pattern to show alignment
    const paintResult = await page.evaluate(() => {
      const terrain = levelEditor.terrain;
      
      if (!terrain || !terrain.tiles) {
        return { success: false, error: 'No terrain available' };
      }
      
      const tileSize = terrain.tileSize;
      
      // Paint directly on terrain tiles instead of using terrainEditor
      const materials = ['moss', 'stone', 'dirt'];
      let materialIndex = 0;
      
      for (let y = 2; y < 8; y++) {
        for (let x = 2; x < 8; x++) {
          // Create checkerboard
          if ((x + y) % 2 === 0) {
            const material = materials[materialIndex % materials.length];
            terrain.tiles[y][x].setMaterial(material);
            terrain.tiles[y][x].assignWeight();
            materialIndex++;
          }
        }
      }
      
      // Paint a single row and column for precise alignment check
      for (let x = 10; x < 15; x++) {
        terrain.tiles[10][x].setMaterial('stone');
        terrain.tiles[10][x].assignWeight();
      }
      
      for (let y = 10; y < 15; y++) {
        terrain.tiles[y][10].setMaterial('moss');
        terrain.tiles[y][10].assignWeight();
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
        // Ensure grid is visible
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
    
    console.log('Capturing alignment screenshot...');
    
    // Capture screenshot showing grid/terrain alignment
    await saveScreenshot(page, 'ui/grid_terrain_alignment_before_fix', true);
    
    console.log('Verifying alignment...');
    
    // Get diagnostic information
    const diagnostics = await page.evaluate(() => {
      const grid = levelEditor.gridOverlay;
      const terrain = levelEditor.terrain;
      
      return {
        gridVisible: grid ? grid.visible : false,
        gridTileSize: grid ? grid.tileSize : null,
        gridWidth: grid ? grid.width : null,
        gridHeight: grid ? grid.height : null,
        gridOpacity: grid ? grid.opacity : null,
        terrainTileSize: terrain ? terrain.tileSize : null,
        terrainWidth: terrain ? terrain.width : null,
        terrainHeight: terrain ? terrain.height : null,
        // Check if grid lines are at expected positions
        firstVerticalLine: grid ? (0 * grid.tileSize) : null,
        secondVerticalLine: grid ? (1 * grid.tileSize) : null,
        firstHorizontalLine: grid ? (0 * grid.tileSize) : null,
        secondHorizontalLine: grid ? (1 * grid.tileSize) : null,
      };
    });
    
    console.log('\n=== Alignment Diagnostics ===');
    console.log('Grid visible:', diagnostics.gridVisible);
    console.log('Grid tile size:', diagnostics.gridTileSize);
    console.log('Grid dimensions:', diagnostics.gridWidth, 'x', diagnostics.gridHeight);
    console.log('Grid opacity:', diagnostics.gridOpacity);
    console.log('Terrain tile size:', diagnostics.terrainTileSize);
    console.log('Terrain dimensions:', diagnostics.terrainWidth, 'x', diagnostics.terrainHeight);
    console.log('\nGrid line positions:');
    console.log('  First vertical line (x=0):', diagnostics.firstVerticalLine);
    console.log('  Second vertical line (x=1):', diagnostics.secondVerticalLine);
    console.log('  First horizontal line (y=0):', diagnostics.firstHorizontalLine);
    console.log('  Second horizontal line (y=1):', diagnostics.secondHorizontalLine);
    console.log('============================\n');
    
    // Validation
    const aligned = 
      diagnostics.gridTileSize === diagnostics.terrainTileSize &&
      diagnostics.gridVisible === true;
    
    if (aligned) {
      console.log('✓ Grid and terrain have matching tile sizes');
      console.log('✓ Grid is visible');
      console.log('\n⚠️  Visual inspection required:');
      console.log('   Check screenshot at: test/e2e/screenshots/ui/success/grid_terrain_alignment_before_fix.png');
      console.log('   Grid lines should align with tile boundaries');
      console.log('   If grid lines appear offset by ~0.5 tiles, this confirms the stroke centering issue');
    } else {
      console.log('✗ Configuration mismatch detected');
    }
    
    await browser.close();
    process.exit(aligned ? 0 : 1);
    
  } catch (error) {
    console.error('Test failed:', error.message);
    await saveScreenshot(page, 'ui/grid_terrain_alignment_error', false);
    await browser.close();
    process.exit(1);
  }
})();
