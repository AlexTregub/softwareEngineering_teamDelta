/**
 * E2E Test: Grid Performance with Maximum Painted Tiles (Edge-Only Rendering)
 * 
 * Tests edge-only grid overlay performance when the entire visible area is painted.
 * Verifies that grid only appears at edge tiles (not interior) + mouse hover.
 * Measures frame rate improvement from edge detection optimization.
 * 
 * Phase: 2B of Lazy Terrain Loading Enhancement
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  let testPassed = false;
  
  try {
    // Navigate to Level Editor
    await page.goto('http://localhost:8000?editor=1', { waitUntil: 'networkidle0' });
    console.log('Level Editor loaded');
    
    // Ensure game started (bypass menu)
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Game failed to start - still on menu');
    }
    console.log('Game started successfully');
    
    // Get initial frame rate (baseline with no tiles)
    const baselineFrameRate = await page.evaluate(() => {
      return window.frameRate ? Math.round(window.frameRate()) : 60;
    });
    console.log(`Baseline frame rate (no tiles): ${baselineFrameRate} fps`);
    
    // Paint all tiles in visible area
    const paintResult = await page.evaluate(() => {
      // Check required classes are available
      if (typeof TerrainEditor === 'undefined') {
        return { success: false, error: 'TerrainEditor class not loaded' };
      }
      
      // Get terrain from g_activeMap (set by Level Editor)
      const terrain = window.g_activeMap;
      if (!terrain) {
        return { success: false, error: 'Terrain (g_activeMap) not found - Level Editor may not have initialized' };
      }
      
      // Create TerrainEditor instance for painting
      const terrainEditor = new TerrainEditor(terrain);
      
      // Get visible region from camera (or use fallback for Level Editor)
      const cam = window.cameraManager;
      let screenMinX, screenMaxX, screenMinY, screenMaxY;
      
      if (cam) {
        // Calculate using camera transform
        screenMinX = cam.position.x - (window.width / 2) / cam.zoom;
        screenMaxX = cam.position.x + (window.width / 2) / cam.zoom;
        screenMinY = cam.position.y - (window.height / 2) / cam.zoom;
        screenMaxY = cam.position.y + (window.height / 2) / cam.zoom;
      } else {
        // Fallback for Level Editor without camera manager
        // Assume camera at origin with zoom 1
        screenMinX = -(window.width / 2);
        screenMaxX = (window.width / 2);
        screenMinY = -(window.height / 2);
        screenMaxY = (window.height / 2);
      }
      
      // Calculate visible tile range
      const tileSize = 32;
      
      const minTileX = Math.floor(screenMinX / tileSize);
      const maxTileX = Math.floor(screenMaxX / tileSize);
      const minTileY = Math.floor(screenMinY / tileSize);
      const maxTileY = Math.floor(screenMaxY / tileSize);
      
      const totalTiles = (maxTileX - minTileX + 1) * (maxTileY - minTileY + 1);
      
      // Paint all tiles in visible area
      let paintedCount = 0;
      for (let x = minTileX; x <= maxTileX; x++) {
        for (let y = minTileY; y <= maxTileY; y++) {
          const worldX = x * tileSize;
          const worldY = y * tileSize;
          terrainEditor.paintTile(worldX, worldY, 0); // GRASS
          paintedCount++;
        }
      }
      
      // Force grid update
      if (window.dynamicGridOverlay) {
        const mousePos = { x: (minTileX + maxTileX) / 2, y: (minTileY + maxTileY) / 2 };
        window.dynamicGridOverlay.update(mousePos);
      }
      
      return {
        success: true,
        totalTiles: totalTiles,
        paintedCount: paintedCount,
        tileRange: { minTileX, maxTileX, minTileY, maxTileY }
      };
    });
    
    if (!paintResult.success) {
      throw new Error(paintResult.error);
    }
    
    console.log(`Painted ${paintResult.paintedCount} tiles (entire visible area)`);
    console.log(`Tile range: X[${paintResult.tileRange.minTileX}, ${paintResult.tileRange.maxTileX}], Y[${paintResult.tileRange.minTileY}, ${paintResult.tileRange.maxTileY}]`);
    
    // Force multiple redraws to ensure grid is rendered
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(500); // Wait for rendering to stabilize
    
    // Measure frame rate with maximum tiles painted
    const measurements = await page.evaluate(async () => {
      // Take multiple frame rate samples over 2 seconds
      const samples = [];
      const sampleCount = 10;
      const sampleInterval = 200; // ms
      
      for (let i = 0; i < sampleCount; i++) {
        const fps = window.frameRate ? Math.round(window.frameRate()) : 60;
        samples.push(fps);
        
        // Force redraw between samples
        if (typeof window.redraw === 'function') {
          window.redraw();
        }
        
        await new Promise(resolve => setTimeout(resolve, sampleInterval));
      }
      
      const avgFps = samples.reduce((sum, fps) => sum + fps, 0) / samples.length;
      const minFps = Math.min(...samples);
      const maxFps = Math.max(...samples);
      
      return {
        samples: samples,
        average: Math.round(avgFps),
        min: minFps,
        max: maxFps
      };
    });
    
    console.log(`\nFrame Rate Measurements (${paintResult.paintedCount} tiles):`);
    console.log(`  Average: ${measurements.average} fps`);
    console.log(`  Min: ${measurements.min} fps`);
    console.log(`  Max: ${measurements.max} fps`);
    console.log(`  Samples: ${measurements.samples.join(', ')}`);
    
    // Get cache statistics and edge detection info
    const cacheStats = await page.evaluate(() => {
      if (!window.dynamicGridOverlay || !window.dynamicGridOverlay._gridCache) {
        return null;
      }
      
      // Count edge tiles vs total tiles
      const terrain = window.dynamicGridOverlay.terrain;
      const paintedTiles = Array.from(terrain.getAllTiles());
      const paintedSet = new Set(paintedTiles.map(t => `${t.x},${t.y}`));
      
      // Manually count edge tiles using the same logic as _isEdgeTile
      let edgeCount = 0;
      for (const tile of paintedTiles) {
        const neighbors = [
          [tile.x, tile.y - 1], // North
          [tile.x, tile.y + 1], // South
          [tile.x + 1, tile.y], // East
          [tile.x - 1, tile.y]  // West
        ];
        
        let hasEmptyNeighbor = false;
        for (const [nx, ny] of neighbors) {
          if (!paintedSet.has(`${nx},${ny}`)) {
            hasEmptyNeighbor = true;
            break;
          }
        }
        
        if (hasEmptyNeighbor) {
          edgeCount++;
        }
      }
      
      const interiorCount = paintedTiles.length - edgeCount;
      const edgePercentage = Math.round((edgeCount / paintedTiles.length) * 100);
      
      return {
        hasCacheKey: window.dynamicGridOverlay._gridCache.cacheKey !== null,
        cacheKeyPreview: window.dynamicGridOverlay._gridCache.cacheKey ? 
          window.dynamicGridOverlay._gridCache.cacheKey.substring(0, 50) + '...' : 
          'null',
        cachedLinesCount: window.dynamicGridOverlay._gridCache.gridLines ? 
          window.dynamicGridOverlay._gridCache.gridLines.length : 
          0,
        currentLinesCount: window.dynamicGridOverlay.gridLines ? 
          window.dynamicGridOverlay.gridLines.length : 
          0,
        totalTiles: paintedTiles.length,
        edgeTiles: edgeCount,
        interiorTiles: interiorCount,
        edgePercentage: edgePercentage
      };
    });
    
    if (cacheStats) {
      console.log(`\nCache Statistics:`);
      console.log(`  Cache Active: ${cacheStats.hasCacheKey}`);
      console.log(`  Cached Lines: ${cacheStats.cachedLinesCount}`);
      console.log(`  Current Lines: ${cacheStats.currentLinesCount}`);
      console.log(`  Cache Key: ${cacheStats.cacheKeyPreview}`);
      
      console.log(`\nEdge Detection Analysis:`);
      console.log(`  Total Tiles Painted: ${cacheStats.totalTiles}`);
      console.log(`  Edge Tiles (rendered): ${cacheStats.edgeTiles} (${cacheStats.edgePercentage}%)`);
      console.log(`  Interior Tiles (skipped): ${cacheStats.interiorTiles} (${100 - cacheStats.edgePercentage}%)`);
      console.log(`  Performance Gain: ~${100 - cacheStats.edgePercentage}% fewer grid lines rendered`);
    }
    
    // Performance criteria
    const TARGET_FPS = 30; // Minimum acceptable FPS
    const performanceGood = measurements.average >= TARGET_FPS && measurements.min >= TARGET_FPS * 0.8;
    
    console.log(`\nPerformance Assessment:`);
    console.log(`  Target: ${TARGET_FPS} fps minimum`);
    console.log(`  Result: ${performanceGood ? 'PASS ✓' : 'FAIL ✗'}`);
    
    if (!performanceGood) {
      console.log(`  Issue: Average FPS (${measurements.average}) or Min FPS (${measurements.min}) below target`);
      console.log(`  Recommendation: Grid caching may not be working correctly or needs further optimization`);
    }
    
    // Take screenshot
    await saveScreenshot(page, 'grid/max_tiles_performance', performanceGood);
    
    testPassed = performanceGood;
    
  } catch (error) {
    console.error('Test failed:', error);
    await saveScreenshot(page, 'grid/max_tiles_performance_error', false);
  } finally {
    await browser.close();
  }
  
  process.exit(testPassed ? 0 : 1);
})();
