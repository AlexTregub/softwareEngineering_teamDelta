/**
 * E2E Test - Material Palette Painting
 * 
 * Tests that clicking materials in the palette and painting terrain
 * uses actual terrain materials (moss, stone, dirt, grass) not colors
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
    const editorOpened = await page.evaluate(() => {
      if (typeof levelEditor !== 'undefined' && levelEditor) {
        levelEditor.activate();
        return true;
      }
      return false;
    });
    
    if (!editorOpened) {
      throw new Error('Level editor not available');
    }
    
    console.log('✓ Level editor opened');
    await sleep(500);
    
    // Get initial state - what material type is being used?
    const initialState = await page.evaluate(() => {
      const palette = window.levelEditor?.palette;
      const editor = window.levelEditor?.editor;
      
      if (!palette || !editor) {
        return { error: 'Palette or editor not found' };
      }
      
      return {
        paletteAvailable: !!palette,
        editorAvailable: !!editor,
        selectedMaterial: palette.getSelectedMaterial(),
        editorMaterial: editor._selectedMaterial,
        materialsInPalette: palette.getMaterials(),
        terrainMaterialsRanged: typeof TERRAIN_MATERIALS_RANGED !== 'undefined' ? Object.keys(TERRAIN_MATERIALS_RANGED) : []
      };
    });
    
    console.log('Initial State:', JSON.stringify(initialState, null, 2));
    
    // Test 1: Select a different material in palette
    const materialSelectionTest = await page.evaluate(() => {
      const palette = window.levelEditor.palette;
      
      // Select 'stone' material
      palette.selectMaterial('stone');
      
      const selectedAfter = palette.getSelectedMaterial();
      
      return {
        success: selectedAfter === 'stone',
        selectedMaterial: selectedAfter,
        isColorCode: /^#[0-9A-F]{6}$/i.test(selectedAfter),
        isMaterialName: typeof selectedAfter === 'string' && !selectedAfter.startsWith('#')
      };
    });
    
    console.log('Material Selection Test:', JSON.stringify(materialSelectionTest, null, 2));
    
    if (!materialSelectionTest.success) {
      console.error('✗ FAILED: Could not select stone material');
      await saveScreenshot(page, 'ui/material_selection_failed', false);
      process.exit(1);
    }
    
    console.log('✓ Material selection works - selected:', materialSelectionTest.selectedMaterial);
    
    // Test 2: Check if TerrainEditor receives material name or color
    const editorMaterialTest = await page.evaluate(() => {
      const palette = window.levelEditor.palette;
      const editor = window.levelEditor.editor;
      
      // Select dirt
      palette.selectMaterial('dirt');
      const selectedMaterial = palette.getSelectedMaterial();
      
      // Pass to editor (simulating what happens when painting)
      editor.selectMaterial(selectedMaterial);
      
      return {
        paletteSelection: selectedMaterial,
        editorSelection: editor._selectedMaterial,
        areEqual: selectedMaterial === editor._selectedMaterial,
        editorIsColorCode: /^#[0-9A-F]{6}$/i.test(editor._selectedMaterial),
        editorIsMaterialName: typeof editor._selectedMaterial === 'string' && !editor._selectedMaterial.startsWith('#')
      };
    });
    
    console.log('Editor Material Test:', JSON.stringify(editorMaterialTest, null, 2));
    
    if (editorMaterialTest.editorIsColorCode) {
      console.error('✗ FAILED: TerrainEditor is receiving COLOR CODE instead of material name!');
      console.error('  Expected: "dirt"');
      console.error('  Got:', editorMaterialTest.editorSelection);
      await saveScreenshot(page, 'ui/editor_receives_color_code', false);
      process.exit(1);
    }
    
    console.log('✓ TerrainEditor receives material name:', editorMaterialTest.editorSelection);
    
    // Test 3: Paint a tile and check what material is set
    const paintingTest = await page.evaluate(() => {
      const editor = window.levelEditor.editor;
      const terrain = window.levelEditor.terrain;
      
      if (!terrain || !terrain.getArrPos) {
        return { error: 'Terrain not available or missing getArrPos method' };
      }
      
      // Select moss
      editor.selectMaterial('moss');
      
      const materialBeforePaint = editor._selectedMaterial;
      
      // Try to get a tile to check what material it would be set to
      try {
        const tile = terrain.getArrPos([5, 5]);
        if (!tile) {
          return { error: 'Could not get tile at [5, 5]' };
        }
        
        const materialBefore = tile.getMaterial ? tile.getMaterial() : 'unknown';
        
        // Paint the tile
        editor.paintTile(5 * 32, 5 * 32);
        
        const materialAfter = tile.getMaterial ? tile.getMaterial() : 'unknown';
        
        return {
          success: true,
          editorSelectedMaterial: materialBeforePaint,
          tileMaterialBefore: materialBefore,
          tileMaterialAfter: materialAfter,
          paintedWithCorrectMaterial: materialAfter === 'moss',
          paintedWithColorCode: /^#[0-9A-F]{6}$/i.test(materialAfter)
        };
      } catch (error) {
        return {
          error: 'Error during painting: ' + error.message,
          editorSelectedMaterial: materialBeforePaint
        };
      }
    });
    
    console.log('Painting Test:', JSON.stringify(paintingTest, null, 2));
    
    if (paintingTest.error) {
      console.error('✗ ERROR during painting test:', paintingTest.error);
      await saveScreenshot(page, 'ui/painting_test_error', false);
      process.exit(1);
    }
    
    if (paintingTest.paintedWithColorCode) {
      console.error('✗ FAILED: Tile was painted with COLOR CODE instead of material name!');
      console.error('  Expected: "moss"');
      console.error('  Got:', paintingTest.tileMaterialAfter);
      await saveScreenshot(page, 'ui/tile_painted_with_color', false);
      process.exit(1);
    }
    
    if (!paintingTest.paintedWithCorrectMaterial) {
      console.error('✗ FAILED: Tile was not painted with the correct material!');
      console.error('  Expected: "moss"');
      console.error('  Got:', paintingTest.tileMaterialAfter);
      await saveScreenshot(page, 'ui/tile_painted_incorrectly', false);
      process.exit(1);
    }
    
    console.log('✓ Tile painted with correct material:', paintingTest.tileMaterialAfter);
    
    // Test 4: Check all materials in the flow
    const allMaterialsTest = await page.evaluate(() => {
      const palette = window.levelEditor.palette;
      const editor = window.levelEditor.editor;
      const materials = palette.getMaterials();
      
      const results = [];
      
      for (const material of materials) {
        palette.selectMaterial(material);
        const paletteSelection = palette.getSelectedMaterial();
        
        editor.selectMaterial(paletteSelection);
        const editorSelection = editor._selectedMaterial;
        
        results.push({
          material,
          paletteSelects: paletteSelection,
          editorReceives: editorSelection,
          isCorrect: paletteSelection === material && editorSelection === material,
          paletteIsColorCode: /^#[0-9A-F]{6}$/i.test(paletteSelection),
          editorIsColorCode: /^#[0-9A-F]{6}$/i.test(editorSelection)
        });
      }
      
      const allCorrect = results.every(r => r.isCorrect);
      const anyColorCodes = results.some(r => r.paletteIsColorCode || r.editorIsColorCode);
      
      return {
        results,
        allCorrect,
        anyColorCodes,
        summary: allCorrect ? 'All materials work correctly' : 'Some materials have issues'
      };
    });
    
    console.log('All Materials Test:', JSON.stringify(allMaterialsTest, null, 2));
    
    if (allMaterialsTest.anyColorCodes) {
      console.error('✗ FAILED: Some materials are being converted to color codes!');
      const problematic = allMaterialsTest.results.filter(r => r.paletteIsColorCode || r.editorIsColorCode);
      console.error('Problematic materials:', problematic);
      await saveScreenshot(page, 'ui/materials_converted_to_colors', false);
      process.exit(1);
    }
    
    if (!allMaterialsTest.allCorrect) {
      console.error('✗ FAILED: Not all materials are being passed correctly!');
      const incorrect = allMaterialsTest.results.filter(r => !r.isCorrect);
      console.error('Incorrect materials:', incorrect);
      await saveScreenshot(page, 'ui/materials_incorrect', false);
      process.exit(1);
    }
    
    console.log('✓ All materials work correctly through the entire flow');
    
    // Success screenshot
    await saveScreenshot(page, 'ui/material_palette_painting_success', true);
    
    console.log('\n=== ALL TESTS PASSED ===');
    console.log('✓ Materials are material names, not color codes');
    console.log('✓ TerrainEditor receives material names');
    console.log('✓ Tiles are painted with material names');
    console.log('✓ All materials work correctly');
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('Test failed with error:', error);
    await saveScreenshot(page, 'ui/material_palette_painting_error', false);
    await browser.close();
    process.exit(1);
  }
})();
