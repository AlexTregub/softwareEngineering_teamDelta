/**
 * E2E Test - Visual Terrain Paint Test
 * 
 * Actually paints terrain and takes screenshots to verify visual appearance
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:8000?test=1');
    
    // Ensure game started
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Game failed to start');
    }
    
    console.log('✓ Game started');
    await sleep(500);
    
    // Open level editor
    await page.evaluate(() => {
      if (typeof levelEditor !== 'undefined') {
        levelEditor.activate();
      }
    });
    
    console.log('✓ Level editor activated');
    await sleep(500);
    
    // Take screenshot of initial state
    await saveScreenshot(page, 'terrain_paint/01_initial_state', true);
    console.log('✓ Screenshot: initial state');
    
    // Paint a pattern with different materials
    await page.evaluate(() => {
      const editor = window.levelEditor.editor;
      
      // Paint a row of moss
      editor.selectMaterial('moss');
      for (let i = 0; i < 5; i++) {
        editor.paintTile((10 + i) * 32, 10 * 32);
      }
      
      // Paint a row of stone
      editor.selectMaterial('stone');
      for (let i = 0; i < 5; i++) {
        editor.paintTile((10 + i) * 32, 11 * 32);
      }
      
      // Paint a row of dirt
      editor.selectMaterial('dirt');
      for (let i = 0; i < 5; i++) {
        editor.paintTile((10 + i) * 32, 12 * 32);
      }
      
      // Paint a row of grass
      editor.selectMaterial('grass');
      for (let i = 0; i < 5; i++) {
        editor.paintTile((10 + i) * 32, 13 * 32);
      }
    });
    
    console.log('✓ Painted pattern with 4 different materials');
    
    // Force render
    await page.evaluate(() => {
      if (typeof redraw === 'function') {
        redraw();
        redraw();
        redraw();
      }
    });
    
    await sleep(500);
    
    // Take screenshot of painted terrain
    await saveScreenshot(page, 'terrain_paint/02_after_painting', true);
    console.log('✓ Screenshot: after painting');
    
    // Get detailed info about what was painted
    const paintInfo = await page.evaluate(() => {
      const terrain = window.levelEditor.terrain;
      const results = [];
      
      // Check the painted tiles
      const positions = [
        { x: 10, y: 10, expected: 'moss' },
        { x: 10, y: 11, expected: 'stone' },
        { x: 10, y: 12, expected: 'dirt' },
        { x: 10, y: 13, expected: 'grass' }
      ];
      
      for (const pos of positions) {
        const tile = terrain.getArrPos([pos.x, pos.y]);
        if (tile) {
          const actualMaterial = tile.getMaterial();
          const hasTERRAIN_MATERIALS_RANGED = typeof TERRAIN_MATERIALS_RANGED !== 'undefined' && 
                                               TERRAIN_MATERIALS_RANGED[actualMaterial];
          
          results.push({
            position: `[${pos.x}, ${pos.y}]`,
            expected: pos.expected,
            actual: actualMaterial,
            matches: actualMaterial === pos.expected,
            hasTERRAIN_MATERIALS_RANGED: !!hasTERRAIN_MATERIALS_RANGED,
            isColorCode: /^#[0-9A-F]{6}$/i.test(actualMaterial)
          });
        }
      }
      
      return {
        results,
        allCorrect: results.every(r => r.matches),
        anyColorCodes: results.some(r => r.isColorCode),
        allHaveTERRAIN_MATERIALS_RANGED: results.every(r => r.hasTERRAIN_MATERIALS_RANGED)
      };
    });
    
    console.log('\nPaint Info:', JSON.stringify(paintInfo, null, 2));
    
    if (paintInfo.anyColorCodes) {
      console.error('✗ FAILED: Some tiles have color codes instead of material names!');
      await saveScreenshot(page, 'terrain_paint/error_color_codes', false);
      process.exit(1);
    }
    
    if (!paintInfo.allCorrect) {
      console.error('✗ FAILED: Not all tiles have the correct material!');
      await saveScreenshot(page, 'terrain_paint/error_wrong_materials', false);
      process.exit(1);
    }
    
    if (!paintInfo.allHaveTERRAIN_MATERIALS_RANGED) {
      console.error('✗ FAILED: Some materials are not in TERRAIN_MATERIALS_RANGED!');
      await saveScreenshot(page, 'terrain_paint/error_missing_from_range', false);
      process.exit(1);
    }
    
    console.log('✓ All tiles painted with correct materials');
    console.log('✓ All materials exist in TERRAIN_MATERIALS_RANGED');
    console.log('✓ No color codes found');
    
    // Move camera to painted area
    await page.evaluate(() => {
      if (window.cameraManager) {
        window.cameraManager.setPosition(10 * 32, 11 * 32);
        window.cameraManager.setZoom(2.0);
      }
      
      if (typeof redraw === 'function') {
        redraw();
        redraw();
        redraw();
      }
    });
    
    await sleep(500);
    
    // Take zoomed screenshot
    await saveScreenshot(page, 'terrain_paint/03_zoomed_painted_area', true);
    console.log('✓ Screenshot: zoomed on painted area');
    
    console.log('\n=== VISUAL PAINT TEST COMPLETE ===');
    console.log('Check screenshots in test/e2e/screenshots/terrain_paint/');
    console.log('✓ 01_initial_state.png - before painting');
    console.log('✓ 02_after_painting.png - after painting pattern');
    console.log('✓ 03_zoomed_painted_area.png - zoomed view of painted tiles');
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('Test failed:', error);
    await saveScreenshot(page, 'terrain_paint/error', false);
    await browser.close();
    process.exit(1);
  }
})();
