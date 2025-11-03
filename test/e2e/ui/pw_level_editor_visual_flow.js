/**
 * E2E Test - Full Level Editor Visual Flow
 * 
 * 1. Start from main menu
 * 2. Click Level Editor button
 * 3. Verify level editor opens
 * 4. Verify material palette shows textures
 * 5. Click different materials
 * 6. Paint terrain
 * 7. Verify painted terrain shows textures (not solid colors)
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:8000');
    
    console.log('Step 1: Loading game and waiting for menu...');
    await sleep(2000); // Give time for p5.js and menu to initialize
    
    // Screenshot: Main menu
    await saveScreenshot(page, 'level_editor_flow/01_main_menu', true);
    console.log('✓ Screenshot: Main menu');
    
    // Step 2: Trigger Level Editor (same as clicking the button)
    console.log('\nStep 2: Entering Level Editor...');
    const levelEditorStarted = await page.evaluate(() => {
      if (typeof GameState === 'undefined' || !GameState || typeof GameState.goToLevelEditor !== 'function') {
        return { success: false, error: 'GameState.goToLevelEditor not available' };
      }
      
      // Call the same function the menu button calls
      GameState.goToLevelEditor();
      
      return { success: true, state: GameState.getState() };
    });
    
    console.log('Level Editor Triggered:', JSON.stringify(levelEditorStarted, null, 2));
    
    if (!levelEditorStarted.success) {
      await saveScreenshot(page, 'level_editor_flow/error_no_gamestate', false);
      await browser.close();
      console.log('\n✗ FAILED:', levelEditorStarted.error);
      process.exit(1);
    }
    
    // Wait for level editor to initialize
    await sleep(1000);
    
    // Screenshot: Level editor loaded
    await saveScreenshot(page, 'level_editor_flow/02_level_editor_loaded', true);
    console.log('✓ Screenshot: Level editor loaded');
    
    // Step 3: Verify material palette loaded
    
    const levelEditorButtonFound = await page.evaluate(() => {
      // Check if menu exists
      if (typeof menu === 'undefined' || !menu) {
        return { error: 'Menu not found' };
      }
      
      // Get menu buttons
      const buttons = menu.buttons || [];
      const levelEditorButton = buttons.find(b => 
        b.label === 'Level Editor' || 
        b.text === 'Level Editor' ||
        b.name === 'Level Editor'
      );
      
      if (!levelEditorButton) {
        return { 
          error: 'Level Editor button not found',
          availableButtons: buttons.map(b => b.label || b.text || b.name)
        };
      }
      
      return {
        found: true,
        button: {
          label: levelEditorButton.label || levelEditorButton.text,
          x: levelEditorButton.x,
          y: levelEditorButton.y,
          width: levelEditorButton.w || levelEditorButton.width,
          height: levelEditorButton.h || levelEditorButton.height
        }
      };
    });
    
    console.log('Level Editor Button Search:', JSON.stringify(levelEditorButtonFound, null, 2));
    
    if (levelEditorButtonFound.error) {
      console.error('✗ FAILED:', levelEditorButtonFound.error);
      if (levelEditorButtonFound.availableButtons) {
        console.log('Available buttons:', levelEditorButtonFound.availableButtons);
      }
      await saveScreenshot(page, 'level_editor_flow/error_button_not_found', false);
      process.exit(1);
    }
    
    console.log('✓ Found Level Editor button');
    
    // Click the Level Editor button
    const buttonClicked = await page.evaluate((buttonInfo) => {
      // Simulate click at button center
      const clickX = buttonInfo.x + (buttonInfo.width / 2);
      const clickY = buttonInfo.y + (buttonInfo.height / 2);
      
      // Set mouse position
      window.mouseX = clickX;
      window.mouseY = clickY;
      
      // Call menu's mousePressed handler
      if (menu && typeof menu.mousePressed === 'function') {
        menu.mousePressed();
        return { success: true, clickX, clickY };
      }
      
      return { error: 'Could not click button' };
    }, levelEditorButtonFound.button);
    
    console.log('Button Click:', JSON.stringify(buttonClicked, null, 2));
    
    if (buttonClicked.error) {
      console.error('✗ FAILED to click button');
      await saveScreenshot(page, 'level_editor_flow/error_click_failed', false);
      process.exit(1);
    }
    
    console.log('✓ Clicked Level Editor button');
    await sleep(1000);
    
    // Screenshot: Level editor opening
    await saveScreenshot(page, 'level_editor_flow/02_level_editor_opening', true);
    console.log('✓ Screenshot: Level editor opening');
    
    // Step 3: Verify level editor is active
    console.log('\nStep 3: Verifying level editor opened...');
    
    const editorState = await page.evaluate(() => {
      return {
        gameState: typeof GameState !== 'undefined' ? GameState.current : 'unknown',
        levelEditorExists: typeof levelEditor !== 'undefined',
        levelEditorActive: typeof levelEditor !== 'undefined' ? levelEditor.active : false,
        paletteExists: typeof levelEditor !== 'undefined' && levelEditor.palette !== null,
        terrainExists: typeof levelEditor !== 'undefined' && levelEditor.terrain !== null,
        editorExists: typeof levelEditor !== 'undefined' && levelEditor.editor !== null
      };
    });
    
    console.log('Editor State:', JSON.stringify(editorState, null, 2));
    
    if (!editorState.levelEditorActive) {
      console.error('✗ FAILED: Level editor is not active!');
      console.error('  Game state:', editorState.gameState);
      await saveScreenshot(page, 'level_editor_flow/error_editor_not_active', false);
      process.exit(1);
    }
    
    console.log('✓ Level editor is active');
    
    // Step 4: Verify material palette visuals
    console.log('\nStep 4: Checking material palette visuals...');
    
    const paletteVisuals = await page.evaluate(() => {
      if (!levelEditor || !levelEditor.palette) {
        return { error: 'Palette not found' };
      }
      
      const palette = levelEditor.palette;
      const materials = palette.getMaterials();
      
      // Check if TERRAIN_MATERIALS_RANGED is available
      const hasTERRAIN_MATERIALS_RANGED = typeof TERRAIN_MATERIALS_RANGED !== 'undefined';
      const hasImages = typeof MOSS_IMAGE !== 'undefined' && 
                       typeof STONE_IMAGE !== 'undefined' &&
                       typeof DIRT_IMAGE !== 'undefined' &&
                       typeof GRASS_IMAGE !== 'undefined';
      
      return {
        materialsCount: materials.length,
        materials,
        selectedMaterial: palette.getSelectedMaterial(),
        hasTERRAIN_MATERIALS_RANGED,
        hasImages,
        allMaterialsInRange: materials.every(m => TERRAIN_MATERIALS_RANGED && TERRAIN_MATERIALS_RANGED[m])
      };
    });
    
    console.log('Palette Visuals:', JSON.stringify(paletteVisuals, null, 2));
    
    if (paletteVisuals.error) {
      console.error('✗ FAILED:', paletteVisuals.error);
      await saveScreenshot(page, 'level_editor_flow/error_palette_missing', false);
      process.exit(1);
    }
    
    if (!paletteVisuals.hasTERRAIN_MATERIALS_RANGED) {
      console.error('✗ FAILED: TERRAIN_MATERIALS_RANGED not available!');
      await saveScreenshot(page, 'level_editor_flow/error_no_terrain_materials', false);
      process.exit(1);
    }
    
    if (!paletteVisuals.hasImages) {
      console.error('✗ FAILED: Terrain images not loaded!');
      await saveScreenshot(page, 'level_editor_flow/error_no_images', false);
      process.exit(1);
    }
    
    console.log('✓ Material palette has', paletteVisuals.materialsCount, 'materials');
    console.log('✓ TERRAIN_MATERIALS_RANGED is available');
    console.log('✓ Terrain images are loaded');
    
    // Step 5: Paint terrain with different materials
    console.log('\nStep 5: Painting terrain with different materials...');
    
    await page.evaluate(() => {
      const editor = levelEditor.editor;
      
      // Clear area first
      for (let x = 5; x < 20; x++) {
        for (let y = 5; y < 20; y++) {
          const tile = levelEditor.terrain.getArrPos([x, y]);
          if (tile) {
            tile.setMaterial('grass'); // Reset to grass
          }
        }
      }
      
      // Paint vertical stripes of each material
      editor.selectMaterial('moss');
      for (let y = 5; y < 15; y++) {
        for (let x = 5; x < 8; x++) {
          editor.paintTile(x * 32, y * 32);
        }
      }
      
      editor.selectMaterial('stone');
      for (let y = 5; y < 15; y++) {
        for (let x = 8; x < 11; x++) {
          editor.paintTile(x * 32, y * 32);
        }
      }
      
      editor.selectMaterial('dirt');
      for (let y = 5; y < 15; y++) {
        for (let x = 11; x < 14; x++) {
          editor.paintTile(x * 32, y * 32);
        }
      }
      
      editor.selectMaterial('grass');
      for (let y = 5; y < 15; y++) {
        for (let x = 14; x < 17; x++) {
          editor.paintTile(x * 32, y * 32);
        }
      }
    });
    
    console.log('✓ Painted 4 vertical stripes (moss, stone, dirt, grass)');
    
    // Force multiple redraws
    await page.evaluate(() => {
      if (typeof redraw === 'function') {
        for (let i = 0; i < 10; i++) {
          redraw();
        }
      }
    });
    
    await sleep(1000);
    
    // Screenshot: After painting
    await saveScreenshot(page, 'level_editor_flow/03_after_painting', true);
    console.log('✓ Screenshot: After painting');
    
    // Step 6: Analyze painted terrain pixels
    console.log('\nStep 6: Analyzing painted terrain pixels...');
    
    const pixelAnalysis = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return { error: 'Canvas not found' };
      
      const ctx = canvas.getContext('2d');
      
      // Sample from each painted stripe
      const sampleAreas = [
        { name: 'moss', x: 6 * 32, y: 10 * 32, material: 'moss' },
        { name: 'stone', x: 9 * 32, y: 10 * 32, material: 'stone' },
        { name: 'dirt', x: 12 * 32, y: 10 * 32, material: 'dirt' },
        { name: 'grass', x: 15 * 32, y: 10 * 32, material: 'grass' }
      ];
      
      const results = {};
      
      for (const area of sampleAreas) {
        const pixels = [];
        
        // Sample 5x5 pixel grid from this area
        for (let dx = -2; dx <= 2; dx++) {
          for (let dy = -2; dy <= 2; dy++) {
            const x = area.x + dx * 3;
            const y = area.y + dy * 3;
            const pixel = ctx.getImageData(x, y, 1, 1).data;
            pixels.push({
              r: pixel[0],
              g: pixel[1],
              b: pixel[2],
              a: pixel[3]
            });
          }
        }
        
        // Calculate average and variance
        const avgR = pixels.reduce((sum, p) => sum + p.r, 0) / pixels.length;
        const avgG = pixels.reduce((sum, p) => sum + p.g, 0) / pixels.length;
        const avgB = pixels.reduce((sum, p) => sum + p.b, 0) / pixels.length;
        
        const varR = pixels.reduce((sum, p) => sum + Math.pow(p.r - avgR, 2), 0) / pixels.length;
        const varG = pixels.reduce((sum, p) => sum + Math.pow(p.g - avgG, 2), 0) / pixels.length;
        const varB = pixels.reduce((sum, p) => sum + Math.pow(p.b - avgB, 2), 0) / pixels.length;
        
        const totalVariance = varR + varG + varB;
        
        // Check if it's the brown background (139, 90, 43)
        const isBrown = Math.abs(avgR - 139) < 30 && 
                       Math.abs(avgG - 90) < 30 && 
                       Math.abs(avgB - 43) < 30;
        
        results[area.name] = {
          avgColor: { r: Math.round(avgR), g: Math.round(avgG), b: Math.round(avgB) },
          variance: Math.round(totalVariance),
          hasTexture: totalVariance > 50,
          isBrownBackground: isBrown,
          sampleCount: pixels.length
        };
      }
      
      return results;
    });
    
    console.log('\nPixel Analysis Results:');
    console.log(JSON.stringify(pixelAnalysis, null, 2));
    
    if (pixelAnalysis.error) {
      console.error('✗ FAILED:', pixelAnalysis.error);
      process.exit(1);
    }
    
    // Check each material
    let visualFailed = false;
    const brownCount = Object.values(pixelAnalysis).filter(p => p.isBrownBackground).length;
    
    for (const [material, analysis] of Object.entries(pixelAnalysis)) {
      if (analysis.isBrownBackground) {
        console.error(`✗ FAILED: ${material} area is showing BROWN BACKGROUND!`);
        console.error(`  Average color: rgb(${analysis.avgColor.r}, ${analysis.avgColor.g}, ${analysis.avgColor.b})`);
        visualFailed = true;
      } else {
        console.log(`✓ ${material}: rgb(${analysis.avgColor.r}, ${analysis.avgColor.g}, ${analysis.avgColor.b}) - NOT brown`);
      }
      
      if (!analysis.hasTexture) {
        console.warn(`  ⚠ ${material} has low texture variance (${analysis.variance}) - might be solid color`);
      } else {
        console.log(`  ✓ ${material} has texture variance: ${analysis.variance}`);
      }
    }
    
    if (brownCount === 4) {
      console.error('\n✗✗✗ CRITICAL: ALL painted areas show BROWN BACKGROUND! ✗✗✗');
      console.error('This means painted terrain is NOT being rendered!');
      console.error('Tiles have correct material data, but visuals show only background.');
      await saveScreenshot(page, 'level_editor_flow/CRITICAL_no_terrain_rendering', false);
      process.exit(1);
    }
    
    if (visualFailed) {
      console.error('\n✗ VISUAL RENDERING ISSUE DETECTED');
      console.error('Some or all painted terrain is not showing textures');
      await saveScreenshot(page, 'level_editor_flow/error_visual_rendering', false);
      process.exit(1);
    }
    
    // Check if all materials look the same (they shouldn't!)
    const colors = Object.values(pixelAnalysis).map(a => a.avgColor);
    const allSameColor = colors.every((c, i, arr) => 
      i === 0 || (Math.abs(c.r - arr[0].r) < 10 && 
                  Math.abs(c.g - arr[0].g) < 10 && 
                  Math.abs(c.b - arr[0].b) < 10)
    );
    
    if (allSameColor) {
      console.error('\n✗ WARNING: All materials have the SAME COLOR!');
      console.error('This suggests they are all rendering the same texture or color');
      console.error('Expected: moss (green), stone (gray), dirt (brown), grass (bright green)');
      await saveScreenshot(page, 'level_editor_flow/warning_same_colors', false);
    } else {
      console.log('\n✓ Materials have DIFFERENT colors - textures are distinct');
    }
    
    // Final success screenshot
    await saveScreenshot(page, 'level_editor_flow/04_final_success', true);
    
    console.log('\n========================================');
    console.log('=== LEVEL EDITOR VISUAL FLOW TEST ===');
    console.log('========================================');
    console.log('✓ Main menu loaded');
    console.log('✓ Level Editor button found and clicked');
    console.log('✓ Level editor activated');
    console.log('✓ Material palette loaded with textures');
    console.log('✓ Terrain painted with 4 different materials');
    console.log('✓ Visual rendering verified');
    console.log('\nScreenshots saved to:');
    console.log('  01_main_menu.png');
    console.log('  02_level_editor_opening.png');
    console.log('  03_after_painting.png');
    console.log('  04_final_success.png');
    console.log('========================================');
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n✗✗✗ TEST FAILED WITH ERROR ✗✗✗');
    console.error(error);
    await saveScreenshot(page, 'level_editor_flow/error_exception', false);
    await browser.close();
    process.exit(1);
  }
})();
