/**
 * E2E Test: Custom Terrain Rendering
 * ===================================
 * Verifies CaveTutorial terrain renders correctly with water_cave tiles
 * 
 * Test Steps:
 * 1. Load custom level
 * 2. Verify IN_GAME state
 * 3. Verify SparseTerrain loaded
 * 4. Sample terrain tiles at known water_cave coordinates
 * 5. Verify tiles have correct material
 * 6. Screenshot proof of terrain rendering
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('[E2E] Starting test: Custom Terrain Rendering');
    
    // Navigate and load level
    await page.goto('http://localhost:8000?test=1');
    await sleep(2000);
    
    // Wait for menu
    await page.waitForFunction(() => {
      return window.GameState && window.GameState.getState() === 'MENU';
    }, { timeout: 10000 });
    
    // Start game (loads CaveTutorial)
    await page.evaluate(() => {
      if (window.startGameTransition) {
        window.startGameTransition();
      }
    });
    
    await sleep(3000); // Wait for level to load
    
    // Verify IN_GAME state
    const gameState = await page.evaluate(() => {
      return window.GameState ? window.GameState.getState() : null;
    });
    
    if (gameState !== 'IN_GAME') {
      console.error(`[E2E] FAILED: Expected IN_GAME, got ${gameState}`);
      await saveScreenshot(page, 'terrainRendering/01_state_error', false);
      await browser.close();
      process.exit(1);
    }
    
    console.log('[E2E] IN_GAME state confirmed');
    
    // Verify terrain loaded
    const terrainInfo = await page.evaluate(() => {
      if (!window.g_activeMap) {
        return { loaded: false };
      }
      
      // Get terrain type
      const terrainType = window.g_activeMap.constructor.name;
      
      // Sample some known water_cave coordinates from CaveTutorial.json
      // Center of lake is around (42, 42)
      const sampleCoords = [
        { x: 42, y: 42 },
        { x: 43, y: 42 },
        { x: 42, y: 43 },
        { x: 45, y: 45 }
      ];
      
      const samples = [];
      for (const coord of sampleCoords) {
        const tile = window.g_activeMap.getTile ? 
          window.g_activeMap.getTile(coord.x, coord.y) : null;
        
        samples.push({
          x: coord.x,
          y: coord.y,
          found: tile !== null && tile !== undefined,
          material: tile ? tile.material : null
        });
      }
      
      return {
        loaded: true,
        terrainType: terrainType,
        tileCount: window.g_activeMap.tiles ? window.g_activeMap.tiles.size : 0,
        defaultMaterial: window.g_activeMap.defaultMaterial || null,
        samples: samples
      };
    });
    
    if (!terrainInfo.loaded) {
      console.error('[E2E] FAILED: Terrain not loaded');
      await saveScreenshot(page, 'terrainRendering/02_terrain_error', false);
      await browser.close();
      process.exit(1);
    }
    
    console.log('[E2E] Terrain type:', terrainInfo.terrainType);
    console.log('[E2E] Tile count:', terrainInfo.tileCount);
    console.log('[E2E] Default material:', terrainInfo.defaultMaterial);
    console.log('[E2E] Tile samples:', terrainInfo.samples);
    
    // Verify we got SparseTerrain
    if (terrainInfo.terrainType !== 'SparseTerrain') {
      console.error(`[E2E] FAILED: Expected SparseTerrain, got ${terrainInfo.terrainType}`);
      await saveScreenshot(page, 'terrainRendering/03_wrong_terrain_type', false);
      await browser.close();
      process.exit(1);
    }
    
    // Verify tiles loaded (should be 10,000 from CaveTutorial)
    if (terrainInfo.tileCount === 0) {
      console.error('[E2E] FAILED: No tiles loaded');
      await saveScreenshot(page, 'terrainRendering/04_no_tiles_error', false);
      await browser.close();
      process.exit(1);
    }
    
    // Verify at least some water_cave tiles found
    const waterCaveTiles = terrainInfo.samples.filter(s => s.material === 'water_cave');
    if (waterCaveTiles.length === 0) {
      console.error('[E2E] FAILED: No water_cave tiles found at sampled coordinates');
      console.error('[E2E] Samples:', terrainInfo.samples);
      await saveScreenshot(page, 'terrainRendering/05_no_water_cave_error', false);
      await browser.close();
      process.exit(1);
    }
    
    console.log('[E2E] Found', waterCaveTiles.length, 'water_cave tiles in samples');
    
    // Center camera on water lake area (42, 42) in grid coords
    await page.evaluate(() => {
      if (window.cameraManager) {
        // Convert grid to world coordinates (42 * 32 = 1344)
        const centerX = 42 * 32;
        const centerY = 42 * 32;
        window.cameraManager.setPosition(centerX, centerY);
        window.cameraManager.centerOnPosition(centerX, centerY);
      }
    });
    
    await sleep(500);
    
    // Force render
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    
    await sleep(1000);
    
    // Take screenshot of terrain
    await saveScreenshot(page, 'terrainRendering/06_water_cave_area', true);
    
    // Zoom in for detailed view
    await page.evaluate(() => {
      if (window.cameraManager && window.cameraManager.setZoom) {
        window.cameraManager.setZoom(2.0); // 2x zoom
      }
    });
    
    await sleep(500);
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    await sleep(500);
    
    // Take zoomed screenshot
    await saveScreenshot(page, 'terrainRendering/07_water_cave_zoomed', true);
    
    console.log('[E2E] SUCCESS: Terrain rendering verified');
    console.log('[E2E] - Terrain type: SparseTerrain');
    console.log('[E2E] - Total tiles:', terrainInfo.tileCount);
    console.log('[E2E] - Water cave tiles found:', waterCaveTiles.length, '/', terrainInfo.samples.length, 'samples');
    console.log('[E2E] ✅ All checks passed');
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('[E2E] Test failed with error:', error);
    await saveScreenshot(page, 'terrainRendering/error', false);
    await browser.close();
    process.exit(1);
  }
})();
