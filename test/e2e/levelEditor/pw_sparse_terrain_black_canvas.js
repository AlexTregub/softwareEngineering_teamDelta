/**
 * E2E Test: Sparse Terrain - Black Canvas on Startup
 * 
 * Verifies that Level Editor starts with black canvas (zero tiles)
 * when using SparseTerrain instead of CustomTerrain.
 * 
 * Expected Behavior:
 * - Level Editor activates successfully
 * - Canvas shows NO tiles (black background)
 * - Terrain.getTileCount() returns 0
 * - Bounds are null (no painted region)
 * 
 * Screenshot: success/sparse_terrain_black_canvas.png
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:8000?test=1');
    
    // CRITICAL: Ensure game started (bypass menu)
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Game failed to start - still on menu');
    }
    
    console.log('Game started successfully');
    
    // Activate Level Editor
    const result = await page.evaluate(() => {
      // Activate Level Editor
      if (!window.levelEditor) {
        return { success: false, error: 'levelEditor not found' };
      }
      
      window.levelEditor.activate();
      
      // Wait for activation
      if (!window.levelEditor.terrain) {
        return { success: false, error: 'terrain not initialized' };
      }
      
      // Check if SparseTerrain is being used
      const isSparseTerrain = typeof window.levelEditor.terrain.getTileCount === 'function';
      
      if (!isSparseTerrain) {
        return { success: false, error: 'Not using SparseTerrain (getTileCount missing)' };
      }
      
      // Verify black canvas (zero tiles)
      const tileCount = window.levelEditor.terrain.getTileCount();
      const bounds = window.levelEditor.terrain.getBounds();
      const isEmpty = window.levelEditor.terrain.isEmpty();
      
      // Set game state to LEVEL_EDITOR
      window.gameState = 'LEVEL_EDITOR';
      
      // Force render
      if (window.draggablePanelManager) {
        window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
      }
      
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      return {
        success: true,
        tileCount,
        bounds,
        isEmpty,
        terrainType: window.levelEditor.terrain.constructor.name
      };
    });
    
    console.log('Level Editor Result:', result);
    
    // Verify results
    if (!result.success) {
      console.error('Test failed:', result.error);
      await saveScreenshot(page, 'levelEditor/sparse_terrain_black_canvas', false);
      await browser.close();
      process.exit(1);
    }
    
    // Verify black canvas conditions
    const testPassed = result.tileCount === 0 && 
                      result.bounds === null && 
                      result.isEmpty === true &&
                      result.terrainType === 'SparseTerrain';
    
    if (!testPassed) {
      console.error('Black canvas verification failed:');
      console.error('  Expected: tileCount=0, bounds=null, isEmpty=true, terrainType=SparseTerrain');
      console.error(`  Actual: tileCount=${result.tileCount}, bounds=${result.bounds}, isEmpty=${result.isEmpty}, terrainType=${result.terrainType}`);
      await saveScreenshot(page, 'levelEditor/sparse_terrain_black_canvas', false);
      await browser.close();
      process.exit(1);
    }
    
    await sleep(500);
    
    // Take success screenshot
    await saveScreenshot(page, 'levelEditor/sparse_terrain_black_canvas', true);
    
    console.log('✅ Test passed: Level Editor starts with black canvas (SparseTerrain)');
    console.log(`   - Tile count: ${result.tileCount}`);
    console.log(`   - Bounds: ${result.bounds}`);
    console.log(`   - Empty: ${result.isEmpty}`);
    console.log(`   - Terrain type: ${result.terrainType}`);
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('Test error:', error);
    await saveScreenshot(page, 'levelEditor/sparse_terrain_black_canvas', false);
    await browser.close();
    process.exit(1);
  }
})();
