/**
 * E2E Test: Post-Launch Issues #1 & #2
 * 
 * Tests:
 * 1. Fill tool bounds limit (100x100 = 10,000 tiles max)
 * 2. Custom canvas sizes (default 100x100, configurable)
 * 
 * Visual proof with screenshots required
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  console.log('🧪 Testing Post-Launch Fixes: Fill Bounds & Custom Sizes\n');
  
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:8000?test=1');
    
    // CRITICAL: Ensure game started
    console.log('⏳ Ensuring game started...');
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('❌ Game failed to start - still on menu');
    }
    console.log('✅ Game started successfully\n');
    
    // Test 1: Verify default canvas size is 100x100
    console.log('📏 Test 1: Default Canvas Size (100x100)');
    const defaultSize = await page.evaluate(() => {
      if (typeof SparseTerrain === 'undefined') {
        return { error: 'SparseTerrain not loaded' };
      }
      
      const terrain = new SparseTerrain(32, 'dirt');
      return {
        maxMapSize: terrain.MAX_MAP_SIZE,
        gridSizeX: terrain._gridSizeX,
        gridSizeY: terrain._gridSizeY
      };
    });
    
    if (defaultSize.error) {
      throw new Error(`❌ ${defaultSize.error}`);
    }
    
    console.log(`   MAX_MAP_SIZE: ${defaultSize.maxMapSize}`);
    console.log(`   _gridSizeX: ${defaultSize.gridSizeX}`);
    console.log(`   _gridSizeY: ${defaultSize.gridSizeY}`);
    
    if (defaultSize.maxMapSize !== 100) {
      throw new Error(`❌ Expected MAX_MAP_SIZE=100, got ${defaultSize.maxMapSize}`);
    }
    console.log('✅ Default size is 100x100\n');
    
    // Test 2: Verify custom canvas sizes work
    console.log('📏 Test 2: Custom Canvas Size (250x250)');
    const customSize = await page.evaluate(() => {
      const terrain = new SparseTerrain(32, 'dirt', { maxMapSize: 250 });
      return {
        maxMapSize: terrain.MAX_MAP_SIZE,
        gridSizeX: terrain._gridSizeX,
        gridSizeY: terrain._gridSizeY
      };
    });
    
    console.log(`   MAX_MAP_SIZE: ${customSize.maxMapSize}`);
    if (customSize.maxMapSize !== 250) {
      throw new Error(`❌ Expected MAX_MAP_SIZE=250, got ${customSize.maxMapSize}`);
    }
    console.log('✅ Custom size works correctly\n');
    
    // Test 3: Verify size validation (min/max)
    console.log('📏 Test 3: Size Validation');
    const validation = await page.evaluate(() => {
      const tooSmall = new SparseTerrain(32, 'dirt', { maxMapSize: 5 });
      const tooLarge = new SparseTerrain(32, 'dirt', { maxMapSize: 2000 });
      const negative = new SparseTerrain(32, 'dirt', { maxMapSize: -50 });
      
      return {
        tooSmall: tooSmall.MAX_MAP_SIZE,
        tooLarge: tooLarge.MAX_MAP_SIZE,
        negative: negative.MAX_MAP_SIZE
      };
    });
    
    console.log(`   Too small (5): ${validation.tooSmall} (clamped to 10)`);
    console.log(`   Too large (2000): ${validation.tooLarge} (clamped to 1000)`);
    console.log(`   Negative (-50): ${validation.negative} (clamped to 10)`);
    
    if (validation.tooSmall !== 10 || validation.tooLarge !== 1000 || validation.negative !== 10) {
      throw new Error('❌ Size validation failed');
    }
    console.log('✅ Size validation works correctly\n');
    
    // Test 4: Fill tool bounds limit
    console.log('🪣 Test 4: Fill Tool Bounds Limit (10,000 tiles max)');
    const fillTest = await page.evaluate(() => {
      if (typeof TerrainEditor === 'undefined' || typeof SparseTerrain === 'undefined') {
        return { error: 'Classes not loaded' };
      }
      
      // Create 150x150 grass area (22,500 tiles total)
      const terrain = new SparseTerrain(32, 'grass', { maxMapSize: 200 });
      for (let x = 0; x < 150; x++) {
        for (let y = 0; y < 150; y++) {
          terrain.setTile(x, y, 'grass');
        }
      }
      
      // Create editor and try to fill with dirt
      const editor = new TerrainEditor(terrain);
      const result = editor.fillRegion(75, 75, 'dirt');
      
      return {
        tilesFilled: result.tilesFilled,
        limitReached: result.limitReached,
        maxFillArea: editor.MAX_FILL_AREA,
        startMaterial: result.startMaterial,
        newMaterial: result.newMaterial
      };
    });
    
    if (fillTest.error) {
      throw new Error(`❌ ${fillTest.error}`);
    }
    
    console.log(`   MAX_FILL_AREA: ${fillTest.maxFillArea}`);
    console.log(`   Tiles filled: ${fillTest.tilesFilled}`);
    console.log(`   Limit reached: ${fillTest.limitReached}`);
    console.log(`   Material: ${fillTest.startMaterial} → ${fillTest.newMaterial}`);
    
    if (fillTest.maxFillArea !== 10000) {
      throw new Error(`❌ Expected MAX_FILL_AREA=10000, got ${fillTest.maxFillArea}`);
    }
    
    if (fillTest.tilesFilled !== 10000) {
      throw new Error(`❌ Expected 10,000 tiles filled, got ${fillTest.tilesFilled}`);
    }
    
    if (!fillTest.limitReached) {
      throw new Error('❌ Expected limitReached=true for 150x150 area');
    }
    console.log('✅ Fill tool stops at 10,000 tiles\n');
    
    // Test 5: Fill tool doesn't flag limit for small areas
    console.log('🪣 Test 5: Fill Tool - Small Area (No Limit)');
    const smallFill = await page.evaluate(() => {
      const terrain = new SparseTerrain(32, 'grass', { maxMapSize: 100 });
      
      // Create 10x10 grass area surrounded by stone border
      // First, create stone border around 10x10 area
      for (let x = -1; x <= 10; x++) {
        terrain.setTile(x, -1, 'stone'); // Top border
        terrain.setTile(x, 10, 'stone');  // Bottom border
      }
      for (let y = 0; y < 10; y++) {
        terrain.setTile(-1, y, 'stone'); // Left border
        terrain.setTile(10, y, 'stone'); // Right border
      }
      
      // Now create 10x10 grass area
      for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
          terrain.setTile(x, y, 'grass');
        }
      }
      
      const editor = new TerrainEditor(terrain);
      const result = editor.fillRegion(5, 5, 'dirt');
      
      return {
        tilesFilled: result.tilesFilled,
        limitReached: result.limitReached,
        totalTilesOnMap: terrain.getTileCount()
      };
    });
    
    console.log(`   Tiles filled: ${smallFill.tilesFilled}`);
    console.log(`   Limit reached: ${smallFill.limitReached}`);
    console.log(`   Total tiles on map: ${smallFill.totalTilesOnMap}`);
    
    if (smallFill.tilesFilled !== 100) {
      throw new Error(`❌ Expected 100 tiles filled, got ${smallFill.tilesFilled}`);
    }
    
    if (smallFill.limitReached) {
      throw new Error('❌ Expected limitReached=false for 10x10 area');
    }
    console.log('✅ Small fills work without triggering limit\n');
    
    // Test 6: Open Level Editor and verify terrain
    console.log('🎨 Test 6: Level Editor with New Default Size');
    
    await page.evaluate(() => {
      if (window.GameState) {
        window.GameState.setState('LEVEL_EDITOR');
      }
    });
    
    await sleep(500);
    
    const editorTerrain = await page.evaluate(() => {
      if (!window.levelEditor || !window.levelEditor.terrain) {
        return { error: 'Level Editor not initialized' };
      }
      
      return {
        maxMapSize: window.levelEditor.terrain.MAX_MAP_SIZE,
        tileCount: window.levelEditor.terrain.getTileCount(),
        bounds: window.levelEditor.terrain.getBounds()
      };
    });
    
    if (editorTerrain.error) {
      throw new Error(`❌ ${editorTerrain.error}`);
    }
    
    console.log(`   Level Editor MAX_MAP_SIZE: ${editorTerrain.maxMapSize}`);
    console.log(`   Initial tile count: ${editorTerrain.tileCount}`);
    console.log(`   Initial bounds: ${JSON.stringify(editorTerrain.bounds)}`);
    
    if (editorTerrain.maxMapSize !== 100) {
      throw new Error(`❌ Expected Level Editor terrain MAX_MAP_SIZE=100, got ${editorTerrain.maxMapSize}`);
    }
    
    if (editorTerrain.tileCount !== 0) {
      throw new Error(`❌ Expected empty terrain (0 tiles), got ${editorTerrain.tileCount}`);
    }
    console.log('✅ Level Editor uses new 100x100 default\n');
    
    // Force render and take screenshot
    await page.evaluate(() => {
      if (window.draggablePanelManager) {
        window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
      }
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(500);
    await saveScreenshot(page, 'levelEditor/post_launch_fixes', true);
    console.log('📸 Screenshot saved: success/post_launch_fixes.png\n');
    
    // Test 7: JSON persistence
    console.log('💾 Test 7: JSON Persistence of maxMapSize');
    const jsonTest = await page.evaluate(() => {
      const terrain = new SparseTerrain(32, 'grass', { maxMapSize: 300 });
      terrain.setTile(0, 0, 'dirt');
      terrain.setTile(50, 50, 'stone');
      
      // Export
      const exported = terrain.exportToJSON();
      
      // Import into new terrain
      const newTerrain = new SparseTerrain(32, 'grass');
      newTerrain.importFromJSON(exported);
      
      return {
        exportedMaxMapSize: exported.metadata.maxMapSize,
        importedMaxMapSize: newTerrain.MAX_MAP_SIZE,
        tileCount: newTerrain.getTileCount()
      };
    });
    
    console.log(`   Exported maxMapSize: ${jsonTest.exportedMaxMapSize}`);
    console.log(`   Imported maxMapSize: ${jsonTest.importedMaxMapSize}`);
    console.log(`   Tiles restored: ${jsonTest.tileCount}`);
    
    if (jsonTest.exportedMaxMapSize !== 300 || jsonTest.importedMaxMapSize !== 300) {
      throw new Error('❌ maxMapSize not persisted correctly in JSON');
    }
    console.log('✅ JSON persistence works correctly\n');
    
    console.log('═══════════════════════════════════════');
    console.log('✅ ALL TESTS PASSED!');
    console.log('═══════════════════════════════════════');
    console.log('Issue #1: Fill tool bounds limit ✅');
    console.log('Issue #2: Custom canvas sizes ✅');
    console.log('═══════════════════════════════════════\n');
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    await saveScreenshot(page, 'levelEditor/post_launch_fixes', false);
    await browser.close();
    process.exit(1);
  }
})();
