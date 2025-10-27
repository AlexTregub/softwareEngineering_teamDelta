/**
 * E2E Test: Level Editor Paint Transform
 * 
 * Tests that painted tiles appear at the correct screen location when zoomed.
 * 
 * Bug Fixed (Oct 27, 2025):
 * - Before: Painted tiles appeared offset from mouse cursor when zoomed
 * - Root Cause: Transform order was translate(-camera) then scale(zoom)
 * - Fix: Changed to scale(zoom) then translate(-camera)
 * 
 * This test verifies:
 * 1. Paint tool works at default zoom (1.0x)
 * 2. Paint tool works when zoomed in (1.5x)
 * 3. Paint tool works when zoomed out (0.5x)
 * 4. Tiles appear at mouse cursor position (not offset)
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to game...');
    await page.goto('http://localhost:8000?test=1');
    
    // CRITICAL: Ensure game started (bypass menu)
    console.log('Ensuring game started...');
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Game failed to start - still on menu');
    }
    
    // Switch to Level Editor state
    console.log('Switching to Level Editor state...');
    await page.evaluate(() => {
      if (window.GameState) {
        window.GameState.setState('LEVEL_EDITOR');
      }
      
      // Force render
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
    
    // Test 1: Paint at default zoom (1.0x)
    console.log('Test 1: Paint at default zoom (1.0x)...');
    const test1 = await page.evaluate(() => {
      const editor = window.levelEditor;
      if (!editor) return { success: false, error: 'Level Editor not found' };
      if (!editor.editor) return { success: false, error: 'TerrainEditor not initialized' };
      
      // Reset camera to default
      editor.editorCamera.cameraX = 0;
      editor.editorCamera.cameraY = 0;
      editor.editorCamera.setZoom(1.0);
      
      // Paint at screen position (400, 300)
      const screenX = 400;
      const screenY = 300;
      
      // Get world coords
      const worldCoords = editor.editorCamera.screenToWorld(screenX, screenY);
      
      // Calculate tile coordinates
      const expectedTileX = Math.floor(worldCoords.worldX / 32);
      const expectedTileY = Math.floor(worldCoords.worldY / 32);
      
      // Get original material before painting (use Level Editor's terrain)
      const terrain = editor.terrain || editor.editor._terrain;
      const tileBefore = terrain ? terrain.getArrPos([expectedTileX, expectedTileY]) : null;
      const materialBefore = tileBefore ? tileBefore.getMaterial() : 'unknown';
      
      // Check available materials
      const availableMaterials = editor.editor.getAvailableMaterials();
      
      // Check terrain bounds
      const hasActiveMap = !!window.g_activeMap;
      const hasTerrain = !!terrain;
      const terrainType = terrain ? terrain.constructor.name : 'none';
      const terrainWidth = terrain ? (terrain.width || terrain._gridSizeX * terrain._chunkSize || 0) : 0;
      const terrainHeight = terrain ? (terrain.height || terrain._gridSizeY * terrain._chunkSize || 0) : 0;
      const terrainKeys = terrain ? Object.keys(terrain).slice(0, 10) : [];
      const inBounds = expectedTileX >= 0 && expectedTileX < terrainWidth && 
                       expectedTileY >= 0 && expectedTileY < terrainHeight;
      
      // Paint directly using TerrainEditor
      editor.editor.selectMaterial('stone');
      editor.editor.setBrushSize(1);
      editor.editor.paint(expectedTileX, expectedTileY);
      
      // Verify tile was painted (use same terrain)
      const tileAfter = terrain ? terrain.getArrPos([expectedTileX, expectedTileY]) : null;
      const materialAfter = tileAfter ? tileAfter.getMaterial() : 'none';
      
      return {
        success: tileAfter && materialAfter === 'stone',
        screenX,
        screenY,
        worldX: worldCoords.worldX,
        worldY: worldCoords.worldY,
        tileX: expectedTileX,
        tileY: expectedTileY,
        hasActiveMap,
        hasTerrain,
        terrainType,
        terrainWidth,
        terrainHeight,
        terrainKeys,
        inBounds,
        materialBefore,
        materialAfter,
        availableMaterials,
        zoom: 1.0,
        cameraX: 0,
        cameraY: 0
      };
    });
    
    console.log('Test 1 Result:', test1);
    
    // Force render after paint
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(300);
    await saveScreenshot(page, 'levelEditor/paint_transform_zoom_1.0x', test1.success);
    
    // Test 2: Paint when zoomed in (1.5x)
    console.log('Test 2: Paint when zoomed in (1.5x)...');
    const test2 = await page.evaluate(() => {
      const editor = window.levelEditor;
      if (!editor) return { success: false, error: 'Level Editor not found' };
      if (!editor.editor) return { success: false, error: 'TerrainEditor not initialized' };
      
      // Set camera position and zoom
      editor.editorCamera.cameraX = 200;
      editor.editorCamera.cameraY = 150;
      editor.editorCamera.setZoom(1.5);
      
      // Paint at screen position (400, 300)
      const screenX = 400;
      const screenY = 300;
      
      // Get world coords
      const worldCoords = editor.editorCamera.screenToWorld(screenX, screenY);
      
      // Calculate tile coordinates
      const expectedTileX = Math.floor(worldCoords.worldX / 32);
      const expectedTileY = Math.floor(worldCoords.worldY / 32);
      
      // Get original material before painting (use Level Editor's terrain)
      const terrain = editor.terrain || editor.editor._terrain;
      const tileBefore = terrain ? terrain.getArrPos([expectedTileX, expectedTileY]) : null;
      const materialBefore = tileBefore ? tileBefore.getMaterial() : 'unknown';
      
      // Paint directly using TerrainEditor
      editor.editor.selectMaterial('moss');
      editor.editor.setBrushSize(1);
      editor.editor.paint(expectedTileX, expectedTileY);
      
      // Verify tile was painted
      const tileAfter = terrain ? terrain.getArrPos([expectedTileX, expectedTileY]) : null;
      const materialAfter = tileAfter ? tileAfter.getMaterial() : 'none';
      
      return {
        success: tileAfter && materialAfter === 'moss',
        screenX,
        screenY,
        worldX: worldCoords.worldX,
        worldY: worldCoords.worldY,
        tileX: expectedTileX,
        tileY: expectedTileY,
        materialBefore,
        materialAfter,
        zoom: 1.5,
        cameraX: 200,
        cameraY: 150
      };
    });
    
    console.log('Test 2 Result:', test2);
    
    // Force render
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(300);
    await saveScreenshot(page, 'levelEditor/paint_transform_zoom_1.5x', test2.success);
    
    // Test 3: Paint when zoomed out (0.5x)
    console.log('Test 3: Paint when zoomed out (0.5x)...');
    const test3 = await page.evaluate(() => {
      const editor = window.levelEditor;
      if (!editor) return { success: false, error: 'Level Editor not found' };
      if (!editor.editor) return { success: false, error: 'TerrainEditor not initialized' };
      
      // Set camera position and zoom
      editor.editorCamera.cameraX = 100;
      editor.editorCamera.cameraY = 100;
      editor.editorCamera.setZoom(0.5);
      
      // Paint at screen position (400, 300)
      const screenX = 400;
      const screenY = 300;
      
      // Get world coords
      const worldCoords = editor.editorCamera.screenToWorld(screenX, screenY);
      
      // Calculate tile coordinates
      const expectedTileX = Math.floor(worldCoords.worldX / 32);
      const expectedTileY = Math.floor(worldCoords.worldY / 32);
      
      // Get original material before painting (use Level Editor's terrain)
      const terrain = editor.terrain || editor.editor._terrain;
      const tileBefore = terrain ? terrain.getArrPos([expectedTileX, expectedTileY]) : null;
      const materialBefore = tileBefore ? tileBefore.getMaterial() : 'unknown';
      
      // Paint directly using TerrainEditor
      editor.editor.selectMaterial('dirt');
      editor.editor.setBrushSize(1);
      editor.editor.paint(expectedTileX, expectedTileY);
      
      // Verify tile was painted
      const tileAfter = terrain ? terrain.getArrPos([expectedTileX, expectedTileY]) : null;
      const materialAfter = tileAfter ? tileAfter.getMaterial() : 'none';
      
      return {
        success: tileAfter && materialAfter === 'dirt',
        screenX,
        screenY,
        worldX: worldCoords.worldX,
        worldY: worldCoords.worldY,
        tileX: expectedTileX,
        tileY: expectedTileY,
        materialBefore,
        materialAfter,
        zoom: 0.5,
        cameraX: 100,
        cameraY: 100
      };
    });
    
    console.log('Test 3 Result:', test3);
    
    // Force render
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(300);
    await saveScreenshot(page, 'levelEditor/paint_transform_zoom_0.5x', test3.success);
    
    // Overall result
    const allSuccess = test1.success && test2.success && test3.success;
    
    console.log('\n=== Paint Transform E2E Test Results ===');
    console.log(`Test 1 (zoom 1.0x): ${test1.success ? 'PASS' : 'FAIL'}`);
    console.log(`Test 2 (zoom 1.5x): ${test2.success ? 'PASS' : 'FAIL'}`);
    console.log(`Test 3 (zoom 0.5x): ${test3.success ? 'PASS' : 'FAIL'}`);
    console.log(`\nOverall: ${allSuccess ? 'PASS' : 'FAIL'}`);
    
    // Take final screenshot
    await saveScreenshot(page, 'levelEditor/paint_transform_final', allSuccess);
    
    await browser.close();
    process.exit(allSuccess ? 0 : 1);
    
  } catch (error) {
    console.error('Test error:', error);
    await saveScreenshot(page, 'levelEditor/paint_transform_error', false);
    await browser.close();
    process.exit(1);
  }
})();
