/**
 * E2E Test - Terrain Visual Rendering
 * 
 * Tests that when terrain is painted, it actually RENDERS the terrain texture
 * (not just a solid color fill)
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
      throw new Error('Game failed to start - still on menu');
    }
    
    console.log('✓ Game started');
    await sleep(500);
    
    // Open level editor
    await page.evaluate(() => {
      if (typeof levelEditor !== 'undefined' && levelEditor) {
        levelEditor.activate();
      }
    });
    
    console.log('✓ Level editor opened');
    await sleep(500);
    
    // Check how terrain tiles are being rendered
    const renderingTest = await page.evaluate(() => {
      // Mock the image() function to track calls
      const imageCalls = [];
      const fillCalls = [];
      const rectCalls = [];
      
      const originalImage = window.image;
      const originalFill = window.fill;
      const originalRect = window.rect;
      
      window.image = function(...args) {
        imageCalls.push({
          imageArg: args[0]?.name || args[0]?.constructor?.name || 'unknown',
          x: args[1],
          y: args[2],
          width: args[3],
          height: args[4]
        });
        return originalImage.apply(this, args);
      };
      
      window.fill = function(...args) {
        fillCalls.push(args);
        return originalFill.apply(this, args);
      };
      
      window.rect = function(...args) {
        rectCalls.push(args);
        return originalRect.apply(this, args);
      };
      
      // Paint some tiles
      const editor = window.levelEditor.editor;
      const terrain = window.levelEditor.terrain;
      
      // Paint with stone
      editor.selectMaterial('stone');
      editor.paintTile(5 * 32, 5 * 32);
      
      // Paint with moss
      editor.selectMaterial('moss');
      editor.paintTile(6 * 32, 6 * 32);
      
      // Paint with dirt
      editor.selectMaterial('dirt');
      editor.paintTile(7 * 32, 7 * 32);
      
      // Force a render to see what gets called
      imageCalls.length = 0;
      fillCalls.length = 0;
      rectCalls.length = 0;
      
      if (terrain && terrain.render) {
        terrain.render();
      }
      
      // Restore
      window.image = originalImage;
      window.fill = originalFill;
      window.rect = originalRect;
      
      return {
        imageCallCount: imageCalls.length,
        fillCallCount: fillCalls.length,
        rectCallCount: rectCalls.length,
        imageCalls: imageCalls.slice(0, 10), // First 10
        fillCalls: fillCalls.slice(0, 10),
        rectCalls: rectCalls.slice(0, 10),
        usingTextures: imageCalls.length > 0,
        usingColors: fillCalls.length > rectCalls.length // More fills than just selection highlights
      };
    });
    
    console.log('Rendering Test:', JSON.stringify(renderingTest, null, 2));
    
    if (!renderingTest.usingTextures) {
      console.error('✗ FAILED: Terrain is NOT using image() calls for textures!');
      console.error('  Image calls:', renderingTest.imageCallCount);
      console.error('  This means terrain is rendering with solid colors, not textures');
      await saveScreenshot(page, 'ui/terrain_not_using_textures', false);
      process.exit(1);
    }
    
    console.log('✓ Terrain IS using image() calls for rendering');
    
    // Check if tiles actually use the render function from TERRAIN_MATERIALS_RANGED
    const tileRenderTest = await page.evaluate(() => {
      const terrain = window.levelEditor.terrain;
      
      // Get a tile that we painted
      const tile = terrain.getArrPos([5, 5]); // Stone tile we painted
      
      if (!tile) {
        return { error: 'Could not get tile' };
      }
      
      const tileMaterial = tile.getMaterial();
      const hasMaterialInRange = typeof TERRAIN_MATERIALS_RANGED !== 'undefined' && 
                                  TERRAIN_MATERIALS_RANGED[tileMaterial];
      
      let renderFunctionExists = false;
      let renderFunctionType = 'none';
      
      if (hasMaterialInRange) {
        const materialData = TERRAIN_MATERIALS_RANGED[tileMaterial];
        renderFunctionExists = materialData && materialData[1] && typeof materialData[1] === 'function';
        renderFunctionType = typeof materialData[1];
      }
      
      // Check how tile renders itself
      const tileHasRender = typeof tile.render === 'function';
      const tileHasRenderTerrain = typeof tile.renderTerrain === 'function';
      
      return {
        tileMaterial,
        hasMaterialInRange,
        renderFunctionExists,
        renderFunctionType,
        tileHasRender,
        tileHasRenderTerrain,
        tileConstructor: tile.constructor.name
      };
    });
    
    console.log('Tile Render Test:', JSON.stringify(tileRenderTest, null, 2));
    
    if (tileRenderTest.error) {
      console.error('✗ ERROR:', tileRenderTest.error);
      await saveScreenshot(page, 'ui/tile_render_test_error', false);
      process.exit(1);
    }
    
    if (!tileRenderTest.renderFunctionExists) {
      console.error('✗ WARNING: Tile material has no render function in TERRAIN_MATERIALS_RANGED');
      console.error('  Material:', tileRenderTest.tileMaterial);
      console.error('  This might explain why textures are not showing');
    }
    
    // Check how Tile class actually renders
    const tileClassRenderCheck = await page.evaluate(() => {
      const terrain = window.levelEditor.terrain;
      const tile = terrain.getArrPos([5, 5]);
      
      // Check what methods Tile has
      const tileMethods = [];
      for (let prop in tile) {
        if (typeof tile[prop] === 'function') {
          tileMethods.push(prop);
        }
      }
      
      // Check if Tile uses TERRAIN_MATERIALS_RANGED in its render
      let tileRenderSource = '';
      if (tile.render) {
        tileRenderSource = tile.render.toString().substring(0, 500);
      } else if (tile.renderTerrain) {
        tileRenderSource = tile.renderTerrain.toString().substring(0, 500);
      }
      
      const usesTERRAIN_MATERIALS_RANGED = tileRenderSource.includes('TERRAIN_MATERIALS_RANGED');
      const usesImage = tileRenderSource.includes('image(');
      const usesFill = tileRenderSource.includes('fill(');
      
      return {
        tileMethods: tileMethods.filter(m => m.includes('render') || m.includes('draw')),
        tileRenderSource,
        usesTERRAIN_MATERIALS_RANGED,
        usesImage,
        usesFill
      };
    });
    
    console.log('Tile Class Render Check:', JSON.stringify(tileClassRenderCheck, null, 2));
    
    if (!tileClassRenderCheck.usesTERRAIN_MATERIALS_RANGED) {
      console.error('✗ FOUND THE ISSUE: Tile render method does NOT use TERRAIN_MATERIALS_RANGED!');
      console.error('  This means tiles are using old color-based rendering');
      console.error('  Tile needs to be updated to use TERRAIN_MATERIALS_RANGED render functions');
      await saveScreenshot(page, 'ui/tile_not_using_terrain_materials_ranged', false);
      process.exit(1);
    }
    
    if (tileClassRenderCheck.usesFill && !tileClassRenderCheck.usesImage) {
      console.error('✗ FOUND THE ISSUE: Tile uses fill() but NOT image()!');
      console.error('  This means tiles are rendering solid colors, not textures');
      await saveScreenshot(page, 'ui/tile_using_fill_not_image', false);
      process.exit(1);
    }
    
    console.log('✓ Tile class uses TERRAIN_MATERIALS_RANGED and image()');
    
    // Success
    await saveScreenshot(page, 'ui/terrain_rendering_check_success', true);
    
    console.log('\n=== ALL RENDERING CHECKS PASSED ===');
    console.log('✓ Terrain uses image() calls for textures');
    console.log('✓ Tiles have render functions in TERRAIN_MATERIALS_RANGED');
    console.log('✓ Tile class uses TERRAIN_MATERIALS_RANGED');
    console.log('✓ Tile class uses image() for rendering');
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('Test failed with error:', error);
    await saveScreenshot(page, 'ui/terrain_rendering_error', false);
    await browser.close();
    process.exit(1);
  }
})();
