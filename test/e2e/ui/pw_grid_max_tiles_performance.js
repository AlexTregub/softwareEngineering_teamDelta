/**
 * E2E Test: Grid Performance with Maximum Painted Tiles
 * 
 * Tests grid overlay performance when the entire visible area is painted.
 * Measures frame rate and identifies performance bottlenecks.
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
    
    // Paint maximum tiles in visible area
    const paintResult = await page.evaluate(() => {
      // Access terrain editor
      const terrainEditor = window.terrainEditorPanel?.terrainEditor;
      if (!terrainEditor) {
        return { success: false, error: 'TerrainEditor not found' };
      }
      
      // Get visible region from camera
      const cam = window.cameraManager;
      if (!cam) {
        return { success: false, error: 'CameraManager not found' };
      }
      
      // Calculate visible tile range
      const tileSize = 32;
      const screenMinX = cam.position.x - (window.width / 2) / cam.zoom;
      const screenMaxX = cam.position.x + (window.width / 2) / cam.zoom;
      const screenMinY = cam.position.y - (window.height / 2) / cam.zoom;
      const screenMaxY = cam.position.y + (window.height / 2) / cam.zoom;
      
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
    
    // Get cache statistics
    const cacheStats = await page.evaluate(() => {
      if (!window.dynamicGridOverlay || !window.dynamicGridOverlay._gridCache) {
        return null;
      }
      
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
          0
      };
    });
    
    if (cacheStats) {
      console.log(`\nCache Statistics:`);
      console.log(`  Cache Active: ${cacheStats.hasCacheKey}`);
      console.log(`  Cached Lines: ${cacheStats.cachedLinesCount}`);
      console.log(`  Current Lines: ${cacheStats.currentLinesCount}`);
      console.log(`  Cache Key: ${cacheStats.cacheKeyPreview}`);
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
