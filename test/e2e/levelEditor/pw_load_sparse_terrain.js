/**
 * E2E Test: Load Sparse Terrain JSON into Level Editor
 * 
 * Verifies that exported SparseTerrain JSON can be loaded back
 * into the Level Editor without validation errors.
 * 
 * Tests:
 * - Export sparse terrain
 * - Load it back
 * - Verify tiles are restored
 * - Verify no console errors
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  // Capture console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  try {
    console.log('Loading game...');
    await page.goto('http://localhost:8000?test=1');
    await sleep(1000);
    
    console.log('Opening Level Editor...');
    const result = await page.evaluate(() => {
      // Open Level Editor directly
      if (!window.levelEditor) {
        return { success: false, error: 'Level Editor not available' };
      }
      
      window.levelEditor.activate();
      
      // Wait for terrain to be available
      if (!window.levelEditor.terrain) {
        return { success: false, error: 'Terrain not initialized' };
      }
      
      const terrain = window.levelEditor.terrain;
      
      // Check if it's SparseTerrain
      if (typeof terrain.exportToJSON !== 'function') {
        return { success: false, error: 'Not using SparseTerrain' };
      }
      
      // Paint some tiles
      terrain.setTile(0, 0, 'moss');
      terrain.setTile(10, 10, 'stone');
      terrain.setTile(20, 20, 'water');
      terrain.setTile(30, 30, 'sand');
      terrain.setTile(40, 40, 'dirt');
      
      // Export
      const exported = terrain.exportToJSON();
      
      // Create new terrain for import
      const newTerrain = new SparseTerrain(32, 'grass');
      
      // Load using TerrainImporter
      const importer = new TerrainImporter(newTerrain);
      const importSuccess = importer.importFromJSON(exported);
      
      if (!importSuccess) {
        return { success: false, error: 'Import failed' };
      }
      
      // Verify tiles were restored
      const verification = [
        { x: 0, y: 0, expected: 'moss', actual: newTerrain.getTile(0, 0)?.material },
        { x: 10, y: 10, expected: 'stone', actual: newTerrain.getTile(10, 10)?.material },
        { x: 20, y: 20, expected: 'water', actual: newTerrain.getTile(20, 20)?.material },
        { x: 30, y: 30, expected: 'sand', actual: newTerrain.getTile(30, 30)?.material },
        { x: 40, y: 40, expected: 'dirt', actual: newTerrain.getTile(40, 40)?.material }
      ];
      
      const allMatch = verification.every(v => v.expected === v.actual);
      
      // Verify empty tiles are null
      const emptyTile = newTerrain.getTile(5, 5);
      const emptyIsNull = emptyTile === null;
      
      // Force render
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      return {
        success: true,
        exportedCount: exported.tiles.length,
        importedCount: newTerrain.getTileCount(),
        verification,
        allMatch,
        emptyIsNull
      };
    });
    
    console.log('Load Test Result:', result);
    
    if (!result.success) {
      console.error('Test failed:', result.error);
      await saveScreenshot(page, 'levelEditor/load_sparse_terrain', false);
      await browser.close();
      process.exit(1);
    }
    
    // Check for console errors
    const validationErrors = consoleErrors.filter(err => 
      err.includes('Import validation failed') ||
      err.includes('Missing version') ||
      err.includes('Invalid gridSizeX')
    );
    
    if (validationErrors.length > 0) {
      console.error('❌ Validation errors detected:');
      validationErrors.forEach(err => console.error('  -', err));
      await saveScreenshot(page, 'levelEditor/load_sparse_terrain', false);
      await browser.close();
      process.exit(1);
    }
    
    // Verify results
    if (!result.allMatch) {
      console.error('❌ Tile verification failed');
      console.error('  Verification:', result.verification);
      await saveScreenshot(page, 'levelEditor/load_sparse_terrain', false);
      await browser.close();
      process.exit(1);
    }
    
    if (!result.emptyIsNull) {
      console.error('❌ Empty tiles should be null, not default material');
      await saveScreenshot(page, 'levelEditor/load_sparse_terrain', false);
      await browser.close();
      process.exit(1);
    }
    
    if (result.exportedCount !== result.importedCount) {
      console.error(`❌ Tile count mismatch: exported ${result.exportedCount}, imported ${result.importedCount}`);
      await saveScreenshot(page, 'levelEditor/load_sparse_terrain', false);
      await browser.close();
      process.exit(1);
    }
    
    await sleep(500);
    await saveScreenshot(page, 'levelEditor/load_sparse_terrain', true);
    
    console.log('✅ Test passed: SparseTerrain load successful');
    console.log(`   - Exported: ${result.exportedCount} tiles`);
    console.log(`   - Imported: ${result.importedCount} tiles`);
    console.log(`   - All tiles verified: ${result.allMatch}`);
    console.log(`   - Empty tiles are null: ${result.emptyIsNull}`);
    console.log(`   - No validation errors`);
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('Test error:', error);
    await saveScreenshot(page, 'levelEditor/load_sparse_terrain', false);
    await browser.close();
    process.exit(1);
  }
})();
