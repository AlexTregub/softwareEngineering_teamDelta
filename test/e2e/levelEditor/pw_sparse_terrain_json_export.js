/**
 * E2E Test: Sparse Terrain - JSON Export (Sparse Format)
 * 
 * Verifies that exporting terrain to JSON only includes painted tiles,
 * not the entire grid (sparse format for disk space savings).
 * 
 * Expected Behavior:
 * - Paint a few scattered tiles
 * - Export to JSON
 * - JSON contains only painted tiles (not 1000x1000 grid)
 * - JSON includes bounds metadata
 * - Reimporting recreates exact terrain
 * 
 * Screenshot: success/sparse_terrain_json_export.png
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
    
    // Test sparse JSON export
    const result = await page.evaluate(() => {
      if (!window.levelEditor) {
        return { success: false, error: 'levelEditor not found' };
      }
      
      window.levelEditor.activate();
      
      if (!window.levelEditor.terrain) {
        return { success: false, error: 'terrain not initialized' };
      }
      
      const terrain = window.levelEditor.terrain;
      
      // Verify SparseTerrain
      if (typeof terrain.exportToJSON !== 'function') {
        return { success: false, error: 'Not using SparseTerrain (no exportToJSON)' };
      }
      
      // Paint 10 scattered tiles (instead of 10,000)
      const paintedTiles = [
        { x: 0, y: 0, material: 'moss' },
        { x: 10, y: 10, material: 'stone' },
        { x: 20, y: 20, material: 'grass' },
        { x: 30, y: 30, material: 'sand' },
        { x: 40, y: 40, material: 'dirt' },
        { x: 50, y: 50, material: 'moss' },
        { x: 60, y: 60, material: 'stone' },
        { x: 70, y: 70, material: 'grass' },
        { x: 80, y: 80, material: 'sand' },
        { x: 90, y: 90, material: 'dirt' }
      ];
      
      paintedTiles.forEach(tile => {
        terrain.setTile(tile.x, tile.y, tile.material);
      });
      
      // Export to JSON
      const json = terrain.exportToJSON();
      
      // Create new terrain and import
      const newTerrain = new SparseTerrain(32, 'dirt');
      newTerrain.importFromJSON(json);
      
      // Verify reimport
      const reimportVerification = paintedTiles.map(tile => ({
        coords: `(${tile.x}, ${tile.y})`,
        original: terrain.getTile(tile.x, tile.y)?.material,
        reimported: newTerrain.getTile(tile.x, tile.y)?.material,
        match: terrain.getTile(tile.x, tile.y)?.material === newTerrain.getTile(tile.x, tile.y)?.material
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
        exportedTileCount: json.tiles.length,
        paintedTileCount: paintedTiles.length,
        jsonVersion: json.version,
        jsonTileSize: json.tileSize,
        jsonDefaultMaterial: json.defaultMaterial,
        jsonBounds: json.bounds,
        jsonSize: JSON.stringify(json).length,
        reimportVerification,
        reimportedCount: newTerrain.getTileCount(),
        // For comparison: what dense storage would be
        denseGridSize: 100 * 100, // If we stored 100x100 grid
        sparseSavingsPercent: Math.round((1 - json.tiles.length / (100 * 100)) * 100)
      };
    });
    
    console.log('JSON Export Result:', result);
    
    if (!result.success) {
      console.error('Test failed:', result.error);
      await saveScreenshot(page, 'levelEditor/sparse_terrain_json_export', false);
      await browser.close();
      process.exit(1);
    }
    
    // Verify sparse export
    const correctExportCount = result.exportedTileCount === result.paintedTileCount;
    const allReimported = result.reimportVerification.every(v => v.match);
    const correctReimportCount = result.reimportedCount === result.paintedTileCount;
    const hasBounds = result.jsonBounds !== null;
    const hasMetadata = result.jsonVersion && result.jsonTileSize;
    
    if (!correctExportCount || !allReimported || !correctReimportCount || !hasBounds || !hasMetadata) {
      console.error('JSON export verification failed:');
      console.error(`  Correct export count (${result.exportedTileCount} === ${result.paintedTileCount}): ${correctExportCount}`);
      console.error(`  All tiles reimported: ${allReimported}`);
      console.error(`  Correct reimport count (${result.reimportedCount} === ${result.paintedTileCount}): ${correctReimportCount}`);
      console.error(`  Has bounds: ${hasBounds}`);
      console.error(`  Has metadata: ${hasMetadata}`);
      console.error('  Reimport verification:', result.reimportVerification);
      await saveScreenshot(page, 'levelEditor/sparse_terrain_json_export', false);
      await browser.close();
      process.exit(1);
    }
    
    await sleep(500);
    
    // Take success screenshot
    await saveScreenshot(page, 'levelEditor/sparse_terrain_json_export', true);
    
    console.log('✅ Test passed: Sparse JSON export working');
    console.log(`   - Painted tiles: ${result.paintedTileCount}`);
    console.log(`   - Exported tiles: ${result.exportedTileCount}`);
    console.log(`   - Dense grid would be: ${result.denseGridSize} tiles`);
    console.log(`   - Sparse savings: ${result.sparseSavingsPercent}%`);
    console.log(`   - JSON size: ${result.jsonSize} bytes`);
    console.log(`   - Bounds: (${result.jsonBounds.minX}, ${result.jsonBounds.minY}) to (${result.jsonBounds.maxX}, ${result.jsonBounds.maxY})`);
    console.log(`   - All tiles reimported correctly: ${allReimported}`);
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('Test error:', error);
    await saveScreenshot(page, 'levelEditor/sparse_terrain_json_export', false);
    await browser.close();
    process.exit(1);
  }
})();
