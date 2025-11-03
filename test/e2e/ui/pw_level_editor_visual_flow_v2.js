/**
 * E2E Test - Full Level Editor Visual Flow (From Main Menu)
 * 
 * Tests the complete user flow:
 * 1. Load main menu (no ?test=1 parameter)
 * 2. Enter Level Editor (via GameState, same as clicking button)
 * 3. Verify material palette shows textures
 * 4. Paint terrain with different materials
 * 5. Analyze canvas pixels to verify textures (not solid colors)
 * 
 * This replicates the exact path a user takes, which may differ from
 * tests that use ?test=1 parameter.
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    // ==================================================================
    // STEP 1: Load main menu (NO test parameter - real user flow)
    // ==================================================================
    console.log('Step 1: Loading main menu...');
    await page.goto('http://localhost:8000'); // No ?test=1 parameter
    await sleep(2000); // Wait for p5.js and menu to initialize
    
    await saveScreenshot(page, 'level_editor_flow_v2/01_main_menu', true);
    console.log('✓ Screenshot: Main menu');
    
    // ==================================================================
    // STEP 2: Enter Level Editor (same as clicking the button)
    // ==================================================================
    console.log('\nStep 2: Entering Level Editor...');
    const levelEditorStarted = await page.evaluate(() => {
      if (typeof GameState === 'undefined' || !GameState || typeof GameState.goToLevelEditor !== 'function') {
        return { success: false, error: 'GameState.goToLevelEditor not available' };
      }
      
      // Call the same function the menu button calls
      GameState.goToLevelEditor();
      
      return { 
        success: true, 
        state: GameState.getState(),
        levelEditorExists: typeof levelEditor !== 'undefined'
      };
    });
    
    console.log('Level Editor Triggered:', JSON.stringify(levelEditorStarted, null, 2));
    
    if (!levelEditorStarted.success) {
      await saveScreenshot(page, 'level_editor_flow_v2/error_no_gamestate', false);
      await browser.close();
      console.log('\n✗ FAILED:', levelEditorStarted.error);
      process.exit(1);
    }
    
    console.log('✓ Level Editor state set to:', levelEditorStarted.state);
    
    // Wait for level editor to initialize and render
    await sleep(1500);
    
    // Force multiple redraws to ensure all rendering layers update
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(500);
    
    await saveScreenshot(page, 'level_editor_flow_v2/02_level_editor_loaded', true);
    console.log('✓ Screenshot: Level editor loaded');
    
    // ==================================================================
    // STEP 3: Verify level editor components
    // ==================================================================
    console.log('\nStep 3: Verifying level editor components...');
    
    const editorState = await page.evaluate(() => {
      const state = {
        gameState: typeof GameState !== 'undefined' ? GameState.getState() : 'unknown',
        levelEditorExists: typeof levelEditor !== 'undefined',
        isActive: false,
        hasPalette: false,
        hasTerrain: false,
        hasEditor: false,
        paletteDetails: null,
        terrainMaterialsRanged: typeof TERRAIN_MATERIALS_RANGED !== 'undefined'
      };
      
      if (typeof levelEditor !== 'undefined' && levelEditor) {
        state.isActive = typeof levelEditor.isActive === 'function' ? levelEditor.isActive() : false;
        state.hasPalette = levelEditor.palette !== null && levelEditor.palette !== undefined;
        state.hasTerrain = levelEditor.terrain !== null && levelEditor.terrain !== undefined;
        state.hasEditor = levelEditor.editor !== null && levelEditor.editor !== undefined;
        
        if (state.hasPalette && levelEditor.palette) {
          state.paletteDetails = {
            swatchCount: levelEditor.palette.swatches ? levelEditor.palette.swatches.length : 0,
            selectedMaterial: levelEditor.palette.selectedMaterial
          };
        }
      }
      
      return state;
    });
    
    console.log('Editor State:', JSON.stringify(editorState, null, 2));
    
    if (!editorState.isActive) {
      console.error('✗ FAILED: Level editor is not active!');
      console.error('  Game state:', editorState.gameState);
      await saveScreenshot(page, 'level_editor_flow_v2/error_editor_not_active', false);
      await browser.close();
      process.exit(1);
    }
    
    if (!editorState.hasPalette) {
      console.error('✗ FAILED: Material palette not loaded!');
      await saveScreenshot(page, 'level_editor_flow_v2/error_no_palette', false);
      await browser.close();
      process.exit(1);
    }
    
    console.log('✓ Level editor active with', editorState.paletteDetails.swatchCount, 'materials');
    
    // ==================================================================
    // STEP 4: Paint terrain with different materials
    // ==================================================================
    console.log('\nStep 4: Painting terrain...');
    
    const paintingResult = await page.evaluate(() => {
      const results = {
        success: false,
        materialsPainted: [],
        tilesPainted: 0,
        errors: []
      };
      
      if (!levelEditor || !levelEditor.palette || !levelEditor.editor || !levelEditor.terrain) {
        results.errors.push('Level editor components not available');
        return results;
      }
      
      // Get available materials from palette
      const materials = ['moss', 'stone', 'dirt', 'grass'];
      
      // Paint a vertical stripe for each material
      materials.forEach((materialName, index) => {
        try {
          // Select material in palette
          levelEditor.palette.selectMaterial(materialName);
          
          // Paint a 4-tile wide vertical stripe
          const startX = 10 + (index * 5);
          for (let x = startX; x < startX + 4; x++) {
            for (let y = 10; y < 20; y++) {
              levelEditor.editor.paintTile(x, y, materialName);
              results.tilesPainted++;
            }
          }
          
          results.materialsPainted.push(materialName);
        } catch (err) {
          results.errors.push(`Error painting ${materialName}: ${err.message}`);
        }
      });
      
      results.success = results.materialsPainted.length > 0 && results.errors.length === 0;
      return results;
    });
    
    console.log('Painting Result:', JSON.stringify(paintingResult, null, 2));
    
    if (!paintingResult.success) {
      console.error('✗ FAILED to paint terrain:');
      paintingResult.errors.forEach(err => console.error('  -', err));
      await saveScreenshot(page, 'level_editor_flow_v2/error_painting_failed', false);
      await browser.close();
      process.exit(1);
    }
    
    console.log('✓ Painted', paintingResult.tilesPainted, 'tiles with', paintingResult.materialsPainted.length, 'materials');
    
    // Force redraw after painting
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(500);
    
    await saveScreenshot(page, 'level_editor_flow_v2/03_after_painting', true);
    console.log('✓ Screenshot: After painting');
    
    // ==================================================================
    // STEP 5: Analyze canvas pixels to verify textures
    // ==================================================================
    console.log('\nStep 5: Analyzing canvas pixels for textures...');
    
    const pixelAnalysis = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) {
        return { error: 'Canvas not found' };
      }
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return { error: 'Canvas context not available' };
      }
      
      // Sample pixels from each painted area
      const materials = ['moss', 'stone', 'dirt', 'grass'];
      const results = {
        materials: {},
        hasBrownBackground: false,
        hasTextureVariance: false
      };
      
      materials.forEach((material, index) => {
        const startX = 10 + (index * 5);
        const sampleX = startX + 2; // Center of stripe
        const sampleY = 15; // Middle of painted area
        
        // Convert grid coords to screen coords (32px tiles)
        const screenX = sampleX * 32;
        const screenY = sampleY * 32;
        
        // Sample 25 pixels in a 5x5 grid
        const samples = [];
        for (let dx = 0; dx < 5; dx++) {
          for (let dy = 0; dy < 5; dy++) {
            const pixelData = ctx.getImageData(screenX + dx * 6, screenY + dy * 6, 1, 1).data;
            samples.push({
              r: pixelData[0],
              g: pixelData[1],
              b: pixelData[2]
            });
          }
        }
        
        // Calculate average color and variance
        const avgColor = {
          r: Math.round(samples.reduce((sum, s) => sum + s.r, 0) / samples.length),
          g: Math.round(samples.reduce((sum, s) => sum + s.g, 0) / samples.length),
          b: Math.round(samples.reduce((sum, s) => sum + s.b, 0) / samples.length)
        };
        
        // Calculate color variance (standard deviation)
        const rVariance = Math.sqrt(samples.reduce((sum, s) => sum + Math.pow(s.r - avgColor.r, 2), 0) / samples.length);
        const gVariance = Math.sqrt(samples.reduce((sum, s) => sum + Math.pow(s.g - avgColor.g, 2), 0) / samples.length);
        const bVariance = Math.sqrt(samples.reduce((sum, s) => sum + Math.pow(s.b - avgColor.b, 2), 0) / samples.length);
        const totalVariance = rVariance + gVariance + bVariance;
        
        results.materials[material] = {
          avgColor,
          variance: Math.round(totalVariance),
          samples: samples.length
        };
        
        // Check for brown background color (roughly 139, 69, 19)
        if (avgColor.r > 100 && avgColor.r < 180 &&
            avgColor.g > 40 && avgColor.g < 100 &&
            avgColor.b > 0 && avgColor.b < 50) {
          results.hasBrownBackground = true;
        }
        
        // Texture should have variance > 50
        if (totalVariance > 50) {
          results.hasTextureVariance = true;
        }
      });
      
      return results;
    });
    
    console.log('Pixel Analysis:', JSON.stringify(pixelAnalysis, null, 2));
    
    if (pixelAnalysis.error) {
      console.error('✗ FAILED:', pixelAnalysis.error);
      await saveScreenshot(page, 'level_editor_flow_v2/error_pixel_analysis', false);
      await browser.close();
      process.exit(1);
    }
    
    // ==================================================================
    // STEP 6: Verify results
    // ==================================================================
    console.log('\nStep 6: Verifying visual rendering...');
    
    let allTestsPassed = true;
    const issues = [];
    
    // Check for brown background (indicates solid color instead of texture)
    if (pixelAnalysis.hasBrownBackground) {
      issues.push('ISSUE: Brown background color detected (solid color instead of texture)');
      allTestsPassed = false;
    }
    
    // Check for texture variance
    if (!pixelAnalysis.hasTextureVariance) {
      issues.push('ISSUE: No texture variance detected (materials may be solid colors)');
      allTestsPassed = false;
    }
    
    // Check each material
    Object.keys(pixelAnalysis.materials).forEach(material => {
      const data = pixelAnalysis.materials[material];
      if (data.variance < 50) {
        issues.push(`ISSUE: ${material} has low variance (${data.variance}) - may be solid color`);
        allTestsPassed = false;
      } else {
        console.log(`✓ ${material}: variance ${data.variance} (has texture)`);
      }
    });
    
    await saveScreenshot(page, 'level_editor_flow_v2/04_final_analysis', true);
    console.log('✓ Screenshot: Final analysis');
    
    await browser.close();
    
    console.log('\n' + '='.repeat(60));
    console.log('TEST COMPLETE');
    console.log('='.repeat(60));
    
    if (allTestsPassed) {
      console.log('✓✓✓ ALL TESTS PASSED ✓✓✓');
      console.log('\nTerrains are rendering with TEXTURES (not solid colors)');
      process.exit(0);
    } else {
      console.log('✗✗✗ SOME TESTS FAILED ✗✗✗');
      console.log('\nIssues found:');
      issues.forEach(issue => console.log('  ' + issue));
      console.log('\nUser experience issue replicated!');
      console.log('Screenshots saved to: test/e2e/screenshots/level_editor_flow_v2/');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n✗✗✗ TEST FAILED WITH ERROR ✗✗✗');
    console.error(error);
    await saveScreenshot(page, 'level_editor_flow_v2/error_exception', false);
    await browser.close();
    process.exit(1);
  }
})();
