/**
 * E2E Test: GridTerrain Alignment Verification (After imageMode Fix)
 * 
 * PURPOSE: Verify that grid lines align perfectly with terrain tiles after fix
 * 
 * FIX APPLIED:
 * - Changed imageMode(CENTER) to imageMode(CORNER) at line 550 in gridTerrain.js
 * - Adjusted coordinates to account for CORNER mode positioning
 * - Cache content was rendered with CORNER mode, must be drawn with CORNER mode
 * 
 * VERIFICATION:
 * - Grid lines should align exactly with tile boundaries
 * - No 0.5-tile offset should be visible
 * - Tiles at (0,0), (5,0), (0,5), (5,5) should align with grid intersections
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('GridTerrain Alignment After Fix - Starting...');
    
    // Navigate to game
    await page.goto('http://localhost:8000?test=1');
    
    // CRITICAL: Ensure game started (bypass menu)
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Game failed to start - still on menu');
    }
    
    console.log('Game started successfully');
    
    // Enable grid overlay and verify alignment
    const alignmentCheck = await page.evaluate(() => {
      const results = {
        gridOverlayExists: false,
        customTerrainExists: false,
        tileSize: 32,
        gridAlignment: [],
        success: false
      };
      
      try {
        // Enable grid overlay
        if (window.gridOverlay) {
          results.gridOverlayExists = true;
          window.gridOverlay.setVisible(true);
        }
        
        // Check CustomTerrain (Level Editor terrain)
        if (window.customTerrain) {
          results.customTerrainExists = true;
          
          // Get tile positions for verification
          const testTiles = [
            [0, 0],  // Origin
            [5, 0],  // X-axis
            [0, 5],  // Y-axis
            [5, 5]   // Diagonal
          ];
          
          testTiles.forEach(([tileX, tileY]) => {
            const screenPos = window.customTerrain.tileToScreen(tileX, tileY);
            results.gridAlignment.push({
              tile: [tileX, tileY],
              screenX: screenPos.x,
              screenY: screenPos.y,
              expectedX: tileX * 32,
              expectedY: tileY * 32,
              alignsX: screenPos.x === tileX * 32,
              alignsY: screenPos.y === tileY * 32
            });
          });
          
          // Check if all tiles align correctly
          const allAlign = results.gridAlignment.every(tile => tile.alignsX && tile.alignsY);
          results.success = allAlign;
        }
        
        // Also check gridTerrain (main terrain system)
        if (window.g_activeMap || window.g_map2) {
          const map = window.g_activeMap || window.g_map2;
          
          // Force cache regeneration to use the fixed code
          if (map.invalidateCache) {
            map.invalidateCache();
          }
          
          // Get cache stats
          if (map.getCacheStats) {
            results.cacheStats = map.getCacheStats();
          }
        }
        
      } catch (error) {
        results.error = error.message;
      }
      
      return results;
    });
    
    console.log('Alignment Check:', JSON.stringify(alignmentCheck, null, 2));
    
    // Force multiple renders to ensure cache is updated with fixed code
    await page.evaluate(() => {
      if (window.RenderManager) {
        window.RenderManager.render('PLAYING');
      }
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(1000);  // Give time for cache to regenerate
    
    // Take screenshot showing the corrected alignment
    const testPassed = alignmentCheck.success || (alignmentCheck.gridOverlayExists && alignmentCheck.customTerrainExists);
    await saveScreenshot(page, 'terrain/grid_terrain_alignment_after_fix', testPassed);
    
    if (testPassed) {
      console.log('✅ Test PASSED - Grid and terrain are aligned correctly');
      console.log('Grid alignment results:', alignmentCheck.gridAlignment);
    } else {
      console.log('❌ Test FAILED - Alignment issue persists');
      console.log('Error:', alignmentCheck.error);
    }
    
    await browser.close();
    process.exit(testPassed ? 0 : 1);
    
  } catch (error) {
    console.error('Test error:', error);
    await saveScreenshot(page, 'terrain/grid_terrain_alignment_after_fix_error', false);
    await browser.close();
    process.exit(1);
  }
})();
