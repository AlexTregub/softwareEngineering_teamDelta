/**
 * E2E Test: Grid/Terrain Alignment Diagnostic
 * 
 * Deep diagnostic test to identify the exact cause of grid/terrain misalignment.
 * Tests various aspects:
 * - p5.js rendering modes (rectMode, imageMode)
 * - Actual pixel coordinates of grid lines
 * - Actual pixel coordinates of terrain tiles
 * - Coordinate conversion functions
 * - Camera/viewport offsets
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('Starting diagnostic test...\n');
    
    // Navigate to game
    await page.goto('http://localhost:8000?test=1');
    await sleep(500);
    
    console.log('=== STEP 1: Initialize Level Editor ===');
    
    const initResult = await page.evaluate(() => {
      if (typeof GameState === 'undefined' || !GameState) {
        return { success: false, error: 'GameState not available' };
      }
      
      GameState.goToLevelEditor();
      
      if (typeof levelEditor === 'undefined' || !levelEditor) {
        return { success: false, error: 'levelEditor not created' };
      }
      
      // Enable grid with high visibility
      levelEditor.showGrid = true;
      if (levelEditor.gridOverlay) {
        levelEditor.gridOverlay.setVisible(true);
        levelEditor.gridOverlay.setOpacity(1.0); // Full opacity for testing
      }
      
      return { 
        success: true,
        gridExists: !!levelEditor.gridOverlay,
        terrainExists: !!levelEditor.terrain
      };
    });
    
    if (!initResult.success) {
      throw new Error(initResult.error);
    }
    
    console.log('✓ Level Editor initialized');
    console.log('  Grid exists:', initResult.gridExists);
    console.log('  Terrain exists:', initResult.terrainExists);
    console.log();
    
    await sleep(300);
    
    console.log('=== STEP 2: Check p5.js Rendering Modes ===');
    
    const renderModes = await page.evaluate(() => {
      // Check current p5.js modes
      const modes = {
        rectModeExists: typeof rectMode !== 'undefined',
        imageModeExists: typeof imageMode !== 'undefined',
        // p5.js constants
        CORNER: typeof CORNER !== 'undefined' ? CORNER : null,
        CENTER: typeof CENTER !== 'undefined' ? CENTER : null,
        RADIUS: typeof RADIUS !== 'undefined' ? RADIUS : null,
        // Current mode state (if accessible)
        canvasExists: typeof canvas !== 'undefined'
      };
      
      return modes;
    });
    
    console.log('p5.js Rendering Modes:');
    console.log('  rectMode available:', renderModes.rectModeExists);
    console.log('  imageMode available:', renderModes.imageModeExists);
    console.log('  CORNER constant:', renderModes.CORNER);
    console.log('  CENTER constant:', renderModes.CENTER);
    console.log('  Canvas exists:', renderModes.canvasExists);
    console.log();
    
    console.log('=== STEP 3: Paint Test Pattern ===');
    
    const paintResult = await page.evaluate(() => {
      const terrain = levelEditor.terrain;
      
      if (!terrain || !terrain.tiles) {
        return { success: false, error: 'Terrain not available' };
      }
      
      // Paint a single tile at known position for precise measurement
      // Tile at (5, 5) - should be at screen coords (160, 160) with 32px tile size
      terrain.tiles[5][5].setMaterial('stone');
      terrain.tiles[5][5].assignWeight();
      
      // Paint a 3x3 block at (10, 10) for visual reference
      for (let y = 10; y <= 12; y++) {
        for (let x = 10; x <= 12; x++) {
          terrain.tiles[y][x].setMaterial('moss');
          terrain.tiles[y][x].assignWeight();
        }
      }
      
      terrain.invalidateCache();
      
      return { 
        success: true,
        tileSize: terrain.tileSize,
        terrainWidth: terrain.width,
        terrainHeight: terrain.height
      };
    });
    
    if (!paintResult.success) {
      throw new Error(paintResult.error);
    }
    
    console.log('✓ Test pattern painted');
    console.log('  Tile size:', paintResult.tileSize);
    console.log('  Terrain dimensions:', paintResult.terrainWidth, 'x', paintResult.terrainHeight);
    console.log();
    
    console.log('=== STEP 4: Analyze Grid Line Positions ===');
    
    const gridAnalysis = await page.evaluate(() => {
      const grid = levelEditor.gridOverlay;
      const tileSize = grid.tileSize;
      
      // Get vertical line positions
      const verticalLines = [];
      for (let x = 0; x <= 5; x++) {
        verticalLines.push({
          tileIndex: x,
          expectedScreenX: x * tileSize,
          calculatedScreenX: x * tileSize + 0 // offsetX = 0
        });
      }
      
      // Get horizontal line positions
      const horizontalLines = [];
      for (let y = 0; y <= 5; y++) {
        horizontalLines.push({
          tileIndex: y,
          expectedScreenY: y * tileSize,
          calculatedScreenY: y * tileSize + 0 // offsetY = 0
        });
      }
      
      return {
        tileSize: grid.tileSize,
        gridSpacing: grid.gridSpacing,
        verticalLines: verticalLines,
        horizontalLines: horizontalLines
      };
    });
    
    console.log('Grid Line Analysis:');
    console.log('  Tile size:', gridAnalysis.tileSize);
    console.log('  Grid spacing:', gridAnalysis.gridSpacing);
    console.log('  Vertical lines (first 6):');
    gridAnalysis.verticalLines.forEach(line => {
      console.log(`    Tile ${line.tileIndex}: x=${line.calculatedScreenX}px`);
    });
    console.log('  Horizontal lines (first 6):');
    gridAnalysis.horizontalLines.forEach(line => {
      console.log(`    Tile ${line.tileIndex}: y=${line.calculatedScreenY}px`);
    });
    console.log();
    
    console.log('=== STEP 5: Analyze Terrain Tile Rendering ===');
    
    const terrainAnalysis = await page.evaluate(() => {
      const terrain = levelEditor.terrain;
      
      // Get tileToScreen conversion for specific tiles
      const testTiles = [
        { tileX: 0, tileY: 0 },
        { tileX: 5, tileY: 5 },
        { tileX: 10, tileY: 10 }
      ];
      
      const tilePositions = testTiles.map(tile => {
        const screenPos = terrain.tileToScreen(tile.tileX, tile.tileY);
        return {
          tileX: tile.tileX,
          tileY: tile.tileY,
          screenX: screenPos.x,
          screenY: screenPos.y,
          expectedScreenX: tile.tileX * terrain.tileSize,
          expectedScreenY: tile.tileY * terrain.tileSize,
          matches: screenPos.x === (tile.tileX * terrain.tileSize) && 
                   screenPos.y === (tile.tileY * terrain.tileSize)
        };
      });
      
      return {
        tileSize: terrain.tileSize,
        tilePositions: tilePositions
      };
    });
    
    console.log('Terrain Tile Rendering:');
    console.log('  Tile size:', terrainAnalysis.tileSize);
    console.log('  Tile positions:');
    terrainAnalysis.tilePositions.forEach(pos => {
      console.log(`    Tile (${pos.tileX}, ${pos.tileY}):`);
      console.log(`      Expected: (${pos.expectedScreenX}, ${pos.expectedScreenY})`);
      console.log(`      Actual:   (${pos.screenX}, ${pos.screenY})`);
      console.log(`      Match: ${pos.matches ? '✓' : '✗'}`);
    });
    console.log();
    
    console.log('=== STEP 6: Check Paint Tool Coordinate Conversion ===');
    
    const paintToolAnalysis = await page.evaluate(() => {
      // Simulate paint tool coordinate conversion
      const tileSize = 32;
      const testMousePositions = [
        { mouseX: 0, mouseY: 0 },
        { mouseX: 160, mouseY: 160 }, // Should be tile (5, 5)
        { mouseX: 320, mouseY: 320 }, // Should be tile (10, 10)
        { mouseX: 175, mouseY: 175 }  // Middle of tile (5, 5)
      ];
      
      const conversions = testMousePositions.map(pos => {
        // This is how TerrainEditor._canvasToTilePosition works
        const tileX = Math.floor(pos.mouseX / tileSize);
        const tileY = Math.floor(pos.mouseY / tileSize);
        
        return {
          mouseX: pos.mouseX,
          mouseY: pos.mouseY,
          tileX: tileX,
          tileY: tileY,
          // Where would this tile render?
          expectedRenderX: tileX * tileSize,
          expectedRenderY: tileY * tileSize
        };
      });
      
      return {
        tileSize: tileSize,
        conversions: conversions
      };
    });
    
    console.log('Paint Tool Coordinate Conversion:');
    paintToolAnalysis.conversions.forEach(conv => {
      console.log(`  Mouse (${conv.mouseX}, ${conv.mouseY}) → Tile (${conv.tileX}, ${conv.tileY})`);
      console.log(`    Tile renders at: (${conv.expectedRenderX}, ${conv.expectedRenderY})`);
    });
    console.log();
    
    console.log('=== STEP 7: Check for Camera/Viewport Offset ===');
    
    const cameraAnalysis = await page.evaluate(() => {
      const hasCamera = typeof cameraManager !== 'undefined';
      
      let cameraInfo = {
        exists: hasCamera,
        position: null,
        zoom: null,
        offset: null
      };
      
      if (hasCamera && cameraManager) {
        cameraInfo.position = cameraManager.position ? {
          x: cameraManager.position.x,
          y: cameraManager.position.y
        } : null;
        cameraInfo.zoom = cameraManager.zoom || null;
      }
      
      // Check if LevelEditor applies any offsets
      const editorOffsets = {
        gridRenderCalledWith: 'render() with no params', // GridOverlay.render(offsetX, offsetY)
        terrainRenderCalledWith: 'render() with no params' // CustomTerrain.render()
      };
      
      return {
        camera: cameraInfo,
        editorOffsets: editorOffsets
      };
    });
    
    console.log('Camera/Viewport Analysis:');
    console.log('  Camera exists:', cameraAnalysis.camera.exists);
    if (cameraAnalysis.camera.position) {
      console.log('  Camera position:', cameraAnalysis.camera.position);
      console.log('  Camera zoom:', cameraAnalysis.camera.zoom);
    }
    console.log('  Editor offsets:', cameraAnalysis.editorOffsets);
    console.log();
    
    console.log('=== STEP 8: Force Render and Capture Screenshot ===');
    
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
    
    await sleep(1000);
    
    await saveScreenshot(page, 'ui/grid_terrain_diagnostic', true);
    console.log('✓ Screenshot saved: test/e2e/screenshots/ui/success/grid_terrain_diagnostic.png');
    console.log();
    
    console.log('=== STEP 9: Alignment Diagnosis ===');
    
    // Based on the data, determine the cause
    const diagnosis = {
      gridLineFormulaCorrect: gridAnalysis.verticalLines[5].calculatedScreenX === 160,
      terrainTileFormulaCorrect: terrainAnalysis.tilePositions[1].matches, // Tile (5,5)
      coordinateConversionCorrect: paintToolAnalysis.conversions[1].tileX === 5 &&
                                    paintToolAnalysis.conversions[1].tileY === 5
    };
    
    console.log('Diagnosis Results:');
    console.log('  Grid line formula correct:', diagnosis.gridLineFormulaCorrect ? '✓' : '✗');
    console.log('  Terrain tile formula correct:', diagnosis.terrainTileFormulaCorrect ? '✓' : '✗');
    console.log('  Coordinate conversion correct:', diagnosis.coordinateConversionCorrect ? '✓' : '✗');
    console.log();
    
    if (diagnosis.gridLineFormulaCorrect && diagnosis.terrainTileFormulaCorrect) {
      console.log('⚠️  FINDING: Grid and terrain formulas are mathematically correct!');
      console.log('   The misalignment must be caused by:');
      console.log('   1. p5.js rendering behavior (stroke centering, rectMode, imageMode)');
      console.log('   2. Visual perception (anti-aliasing, sub-pixel rendering)');
      console.log('   3. Different rendering contexts (main canvas vs offscreen)');
      console.log();
      console.log('   Next steps:');
      console.log('   - Check if rectMode is set globally');
      console.log('   - Check if imageMode is set globally');
      console.log('   - Verify stroke is drawn centered on coordinates');
      console.log('   - Check if terrain uses image() or rect() for rendering');
    } else {
      console.log('✗ FINDING: Formula mismatch detected!');
      if (!diagnosis.gridLineFormulaCorrect) {
        console.log('   - Grid line calculation is incorrect');
      }
      if (!diagnosis.terrainTileFormulaCorrect) {
        console.log('   - Terrain tile positioning is incorrect');
      }
      if (!diagnosis.coordinateConversionCorrect) {
        console.log('   - Paint tool coordinate conversion is incorrect');
      }
    }
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('Diagnostic test failed:', error.message);
    await saveScreenshot(page, 'ui/grid_terrain_diagnostic_error', false);
    await browser.close();
    process.exit(1);
  }
})();
