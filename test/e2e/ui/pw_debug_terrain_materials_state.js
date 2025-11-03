/**
 * E2E Test - Debug TERRAIN_MATERIALS_RANGED State
 * 
 * This test captures the EXACT state of TERRAIN_MATERIALS_RANGED
 * when MaterialPalette is created from the menu flow.
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('Loading main menu (no ?test=1)...');
    await page.goto('http://localhost:8000');
    await sleep(2000);
    
    console.log('\nTriggering Level Editor...');
    const debugInfo = await page.evaluate(() => {
      // Capture state BEFORE entering level editor
      const beforeState = {
        TERRAIN_MATERIALS_RANGED_type: typeof TERRAIN_MATERIALS_RANGED,
        TERRAIN_MATERIALS_RANGED_exists: typeof TERRAIN_MATERIALS_RANGED !== 'undefined',
        TERRAIN_MATERIALS_RANGED_keys: typeof TERRAIN_MATERIALS_RANGED !== 'undefined' ? Object.keys(TERRAIN_MATERIALS_RANGED) : [],
        TERRAIN_MATERIALS_RANGED_keyCount: typeof TERRAIN_MATERIALS_RANGED !== 'undefined' ? Object.keys(TERRAIN_MATERIALS_RANGED).length : 0,
        MOSS_IMAGE_exists: typeof MOSS_IMAGE !== 'undefined',
        STONE_IMAGE_exists: typeof STONE_IMAGE !== 'undefined',
        DIRT_IMAGE_exists: typeof DIRT_IMAGE !== 'undefined',
        GRASS_IMAGE_exists: typeof GRASS_IMAGE !== 'undefined'
      };
      
      // Enter level editor
      if (typeof GameState !== 'undefined' && GameState.goToLevelEditor) {
        GameState.goToLevelEditor();
      }
      
      return { beforeState };
    });
    
    await sleep(1500);
    
    // Force redraws
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    
    await sleep(500);
    
    // Capture state AFTER level editor opened
    const afterState = await page.evaluate(() => {
      const state = {
        gameState: typeof GameState !== 'undefined' ? GameState.getState() : 'unknown',
        levelEditorActive: typeof levelEditor !== 'undefined' && levelEditor.isActive ? levelEditor.isActive() : false,
        paletteExists: typeof levelEditor !== 'undefined' && levelEditor.palette !== null,
        paletteSwatchCount: 0,
        paletteMaterials: [],
        paletteSelectedMaterial: null,
        TERRAIN_MATERIALS_RANGED_keys: typeof TERRAIN_MATERIALS_RANGED !== 'undefined' ? Object.keys(TERRAIN_MATERIALS_RANGED) : [],
        TERRAIN_MATERIALS_RANGED_sample: null
      };
      
      if (typeof levelEditor !== 'undefined' && levelEditor.palette) {
        // Note: MaterialPalette doesn't have a 'swatches' property!
        // Materials are in palette.materials array
        state.paletteMaterialsCount = levelEditor.palette.materials ? levelEditor.palette.materials.length : 0;
        state.paletteMaterials = levelEditor.palette.materials || [];
        state.paletteSelectedMaterial = levelEditor.palette.selectedMaterial;
      }
      
      // Sample TERRAIN_MATERIALS_RANGED content
      if (typeof TERRAIN_MATERIALS_RANGED !== 'undefined') {
        state.TERRAIN_MATERIALS_RANGED_sample = {};
        Object.keys(TERRAIN_MATERIALS_RANGED).forEach(key => {
          const entry = TERRAIN_MATERIALS_RANGED[key];
          state.TERRAIN_MATERIALS_RANGED_sample[key] = {
            hasRange: Array.isArray(entry) && Array.isArray(entry[0]),
            range: Array.isArray(entry) ? entry[0] : null,
            hasRenderFunc: Array.isArray(entry) && typeof entry[1] === 'function',
            renderFuncSource: Array.isArray(entry) && typeof entry[1] === 'function' ? entry[1].toString().substring(0, 100) : null
          };
        });
      }
      
      return state;
    });
    
    await saveScreenshot(page, 'debug_terrain_materials/level_editor', true);
    
    await browser.close();
    
    console.log('\n' + '='.repeat(80));
    console.log('DEBUG INFO - TERRAIN_MATERIALS_RANGED STATE');
    console.log('='.repeat(80));
    console.log('\nBEFORE Level Editor Opened:');
    console.log(JSON.stringify(debugInfo.beforeState, null, 2));
    console.log('\nAFTER Level Editor Opened:');
    console.log(JSON.stringify(afterState, null, 2));
    console.log('\n' + '='.repeat(80));
    console.log('KEY FINDINGS:');
    console.log('='.repeat(80));
    
    if (debugInfo.beforeState.TERRAIN_MATERIALS_RANGED_keyCount === 0) {
      console.log('🐛 TERRAIN_MATERIALS_RANGED has 0 keys BEFORE level editor opens!');
      console.log('   This means terrianGen.js did not populate it correctly.');
    } else {
      console.log('✓ TERRAIN_MATERIALS_RANGED has', debugInfo.beforeState.TERRAIN_MATERIALS_RANGED_keyCount, 'keys before level editor');
    }
    
    if (afterState.paletteMaterialsCount === 0) {
      console.log('🐛 MaterialPalette has 0 materials!');
      console.log('   Palette materials array:', afterState.paletteMaterials);
      console.log('   TERRAIN_MATERIALS_RANGED keys:', afterState.TERRAIN_MATERIALS_RANGED_keys);
    } else {
      console.log('✓ MaterialPalette has', afterState.paletteMaterialsCount, 'materials');
    }
    
    if (afterState.TERRAIN_MATERIALS_RANGED_sample) {
      console.log('\nTERRAIN_MATERIALS_RANGED Content Sample:');
      Object.keys(afterState.TERRAIN_MATERIALS_RANGED_sample).slice(0, 2).forEach(key => {
        console.log(`  ${key}:`, afterState.TERRAIN_MATERIALS_RANGED_sample[key]);
      });
    }
    
    console.log('\n' + '='.repeat(80));
    
    // Exit code based on whether we found the issue
    if (afterState.paletteMaterialsCount === 0) {
      console.log('\n🐛 ISSUE FOUND - MaterialPalette has 0 materials from menu flow');
      process.exit(0); // Success - we found an issue!
    } else if (afterState.paletteMaterialsCount > 0) {
      console.log('\n✓ MaterialPalette has materials! Issue might be in rendering...');
      console.log('   Run pw_level_editor_visual_flow_v2.js to check visual rendering');
      process.exit(0); // Success - palette is loaded, issue is elsewhere
    } else {
      console.log('\n? Unexpected state');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n✗ TEST ERROR:', error);
    await saveScreenshot(page, 'debug_terrain_materials/error', false);
    await browser.close();
    process.exit(1);
  }
})();
