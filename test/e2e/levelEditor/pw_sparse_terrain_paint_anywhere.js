/**
 * E2E Test: Sparse Terrain - Paint Anywhere
 * 
 * Verifies that user can paint tiles at any coordinate within 1000x1000 bounds,
 * including negative coordinates and scattered locations.
 * 
 * Expected Behavior:
 * - Can paint at positive coordinates
 * - Can paint at negative coordinates
 * - Can paint at scattered locations (not contiguous)
 * - Bounds update dynamically to include all painted tiles
 * - Tile count reflects only painted tiles (sparse storage)
 * 
 * Screenshot: success/sparse_terrain_paint_anywhere.png
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:8000?test=1');
    
    // CRITICAL: Ensure game started
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Game failed to start');
    }
    
    console.log('Game started successfully');
    
    // Activate Level Editor and paint scattered tiles
    const result = await page.evaluate(() => {
      if (!window.levelEditor) {
        return { success: false, error: 'levelEditor not found' };
      }
      
      window.levelEditor.activate();
      
      if (!window.levelEditor.terrain) {
        return { success: false, error: 'terrain not initialized' };
      }
      
      // Verify SparseTerrain
      if (typeof window.levelEditor.terrain.setTile !== 'function') {
        return { success: false, error: 'Not using SparseTerrain' };
      }
      
      const terrain = window.levelEditor.terrain;
      
      // Paint scattered tiles at various coordinates
      const paintedTiles = [
        { x: 10, y: 10, material: 'moss' },    // Positive
        { x: -5, y: -5, material: 'stone' },   // Negative
        { x: 50, y: 50, material: 'grass' },   // Far positive
        { x: -20, y: 30, material: 'sand' },   // Mixed
        { x: 100, y: 100, material: 'dirt' }   // Very far
      ];
      
      // Paint tiles
      paintedTiles.forEach(tile => {
        terrain.setTile(tile.x, tile.y, tile.material);
      });
      
      // Verify results
      const tileCount = terrain.getTileCount();
      const bounds = terrain.getBounds();
      const isEmpty = terrain.isEmpty();
      
      // Verify each tile was painted
      const verification = paintedTiles.map(tile => ({
        coords: `(${tile.x}, ${tile.y})`,
        expected: tile.material,
        actual: terrain.getTile(tile.x, tile.y)?.material || null,
        success: terrain.getTile(tile.x, tile.y)?.material === tile.material
      }));
      
      // Set game state and render
      window.gameState = 'LEVEL_EDITOR';
      
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
        paintedCount: paintedTiles.length,
        verification,
        boundsWidth: bounds ? bounds.maxX - bounds.minX + 1 : 0,
        boundsHeight: bounds ? bounds.maxY - bounds.minY + 1 : 0
      };
    });
    
    console.log('Paint Anywhere Result:', result);
    
    if (!result.success) {
      console.error('Test failed:', result.error);
      await saveScreenshot(page, 'levelEditor/sparse_terrain_paint_anywhere', false);
      await browser.close();
      process.exit(1);
    }
    
    // Verify results
    const allTilesPainted = result.verification.every(v => v.success);
    const correctCount = result.tileCount === result.paintedCount;
    const notEmpty = !result.isEmpty;
    const hasBounds = result.bounds !== null;
    
    if (!allTilesPainted || !correctCount || !notEmpty || !hasBounds) {
      console.error('Paint anywhere verification failed:');
      console.error(`  All tiles painted: ${allTilesPainted}`);
      console.error(`  Correct count (${result.tileCount} === ${result.paintedCount}): ${correctCount}`);
      console.error(`  Not empty: ${notEmpty}`);
      console.error(`  Has bounds: ${hasBounds}`);
      console.error('  Tile verification:', result.verification);
      await saveScreenshot(page, 'levelEditor/sparse_terrain_paint_anywhere', false);
      await browser.close();
      process.exit(1);
    }
    
    await sleep(500);
    
    // Take success screenshot
    await saveScreenshot(page, 'levelEditor/sparse_terrain_paint_anywhere', true);
    
    console.log('✅ Test passed: Can paint anywhere (including negative coords)');
    console.log(`   - Tiles painted: ${result.tileCount}`);
    console.log(`   - Bounds: (${result.bounds.minX}, ${result.bounds.minY}) to (${result.bounds.maxX}, ${result.bounds.maxY})`);
    console.log(`   - Bounds size: ${result.boundsWidth}x${result.boundsHeight}`);
    console.log('   - Tile verification:');
    result.verification.forEach(v => {
      console.log(`     ${v.coords}: ${v.actual} (${v.success ? '✓' : '✗'})`);
    });
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('Test error:', error);
    await saveScreenshot(page, 'levelEditor/sparse_terrain_paint_anywhere', false);
    await browser.close();
    process.exit(1);
  }
})();
