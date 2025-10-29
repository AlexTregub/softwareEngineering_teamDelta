/**
 * E2E Test: Complete Rendering Pipeline Trace
 * 
 * PURPOSE: Trace EVERY step of the terrain rendering process to find the offset
 * 
 * STEPS TO TRACE:
 * 1. Tile world coordinates → cache buffer coordinates
 * 2. Cache buffer → screen coordinates
 * 3. Grid overlay rendering
 * 4. Actual pixel positions on screen
 * 
 * This test will log EVERY transformation to identify where the 0.5-tile offset appears
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('=== RENDERING PIPELINE TRACE TEST ===\n');
    
    await page.goto('http://localhost:8000?test=1');
    
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Game failed to start');
    }
    
    console.log('✅ Game started\n');
    
    // COMPREHENSIVE TRACE OF ENTIRE RENDERING PIPELINE
    const trace = await page.evaluate(() => {
      const results = {
        step1_worldCoordinates: {},
        step2_cacheRendering: {},
        step3_cacheDrawing: {},
        step4_gridOverlay: {},
        step5_actualPixels: {},
        errors: []
      };
      
      try {
        // ===== STEP 1: World Coordinates =====
        console.log('\n=== STEP 1: WORLD COORDINATES ===');
        
        const map = window.g_activeMap || window.g_map2;
        if (!map) {
          results.errors.push('No active map found');
          return results;
        }
        
        results.step1_worldCoordinates = {
          tileSize: map._tileSize || 32,
          gridSizeX: map._gridSizeX,
          gridSizeY: map._gridSizeY,
          chunkSize: map._chunkSize,
          cameraPosition: map.renderConversion ? [...map.renderConversion._camPosition] : null,
          canvasCenter: map.renderConversion ? [...map.renderConversion._canvasCenter] : null
        };
        
        console.log('Tile size:', results.step1_worldCoordinates.tileSize);
        console.log('Camera position:', results.step1_worldCoordinates.cameraPosition);
        console.log('Canvas center:', results.step1_worldCoordinates.canvasCenter);
        
        // ===== STEP 2: Cache Rendering (tiles → cache buffer) =====
        console.log('\n=== STEP 2: CACHE RENDERING ===');
        
        if (map._cacheRenderConverter) {
          results.step2_cacheRendering = {
            converterExists: true,
            cacheCanvasCenter: [...map._cacheRenderConverter._canvasCenter],
            cacheCameraPosition: [...map._cacheRenderConverter._camPosition],
            cacheTileSize: map._cacheRenderConverter._tileSize,
            
            // Test tile at origin
            testTileWorld: [0, 0],
            testTileCachePos: map._cacheRenderConverter.convPosToCanvas([0, 0])
          };
          
          console.log('Cache converter exists:', true);
          console.log('Cache canvas center:', results.step2_cacheRendering.cacheCanvasCenter);
          console.log('Tile [0,0] in cache at:', results.step2_cacheRendering.testTileCachePos);
        } else {
          results.step2_cacheRendering.converterExists = false;
        }
        
        // ===== STEP 3: Cache Drawing (cache buffer → screen) =====
        console.log('\n=== STEP 3: CACHE DRAWING ===');
        
        if (map._terrainCache) {
          const cacheWidth = map._terrainCache.width;
          const cacheHeight = map._terrainCache.height;
          const canvasCenter = map.renderConversion._canvasCenter;
          
          // THIS IS THE FIXED CODE - verify it's calculating correctly
          const cacheX = canvasCenter[0] - cacheWidth / 2;
          const cacheY = canvasCenter[1] - cacheHeight / 2;
          
          results.step3_cacheDrawing = {
            cacheExists: true,
            cacheWidth: cacheWidth,
            cacheHeight: cacheHeight,
            canvasCenter: [...canvasCenter],
            calculatedCacheX: cacheX,
            calculatedCacheY: cacheY,
            // The cache should be drawn at (cacheX, cacheY) with CORNER mode
            expectedCachePosition: [cacheX, cacheY]
          };
          
          console.log('Cache size:', cacheWidth, 'x', cacheHeight);
          console.log('Canvas center:', canvasCenter);
          console.log('Cache drawn at (CORNER mode):', [cacheX, cacheY]);
        } else {
          results.step3_cacheDrawing.cacheExists = false;
        }
        
        // ===== STEP 4: Grid Overlay =====
        console.log('\n=== STEP 4: GRID OVERLAY ===');
        
        if (window.gridOverlay) {
          results.step4_gridOverlay = {
            exists: true,
            visible: window.gridOverlay.visible,
            tileSize: window.gridOverlay.tileSize,
            strokeOffset: 0.5,  // From GridOverlay.js
            
            // Test grid line positions
            testGridLines: []
          };
          
          // Calculate where grid lines SHOULD be
          for (let x = 0; x <= 10; x++) {
            const gridLineX = x * 32 + 0.5;  // tileSize + strokeOffset
            results.step4_gridOverlay.testGridLines.push({
              tileX: x,
              gridLineX: gridLineX,
              expectedTileX: x * 32  // Tile should be at this position
            });
          }
          
          console.log('Grid overlay exists:', true);
          console.log('Grid lines (first 3):', results.step4_gridOverlay.testGridLines.slice(0, 3));
        } else {
          results.step4_gridOverlay.exists = false;
        }
        
        // ===== STEP 5: CustomTerrain (Level Editor) =====
        console.log('\n=== STEP 5: CUSTOM TERRAIN (Level Editor) ===');
        
        if (window.customTerrain) {
          results.step5_actualPixels = {
            exists: true,
            
            // Test tile positions
            testTiles: []
          };
          
          // Get actual screen positions for test tiles
          for (let x = 0; x <= 5; x++) {
            for (let y = 0; y <= 5; y++) {
              const screenPos = window.customTerrain.tileToScreen(x, y);
              results.step5_actualPixels.testTiles.push({
                tile: [x, y],
                screenX: screenPos.x,
                screenY: screenPos.y,
                expectedX: x * 32,
                expectedY: y * 32,
                offsetX: screenPos.x - (x * 32),
                offsetY: screenPos.y - (y * 32)
              });
            }
          }
          
          console.log('CustomTerrain exists:', true);
          console.log('Test tiles (first 5):', results.step5_actualPixels.testTiles.slice(0, 5));
          
          // Check for any non-zero offsets
          const hasOffset = results.step5_actualPixels.testTiles.some(t => t.offsetX !== 0 || t.offsetY !== 0);
          results.step5_actualPixels.hasOffset = hasOffset;
          
        } else {
          results.step5_actualPixels.exists = false;
          console.log('CustomTerrain: NOT FOUND (Level Editor not active)');
        }
        
        // ===== ANALYSIS =====
        console.log('\n=== ANALYSIS ===');
        
        // Check if gridTerrain is using direct rendering or cached rendering
        if (map._shouldUseCache && map._shouldUseCache()) {
          console.log('Rendering mode: CACHED');
          results.renderingMode = 'cached';
        } else {
          console.log('Rendering mode: DIRECT');
          results.renderingMode = 'direct';
        }
        
        // Check cache validity
        if (map.getCacheStats) {
          const stats = map.getCacheStats();
          console.log('Cache valid:', stats.cacheValid);
          console.log('Cache exists:', stats.cacheExists);
          results.cacheStats = stats;
        }
        
      } catch (error) {
        results.errors.push(error.message);
        console.error('Trace error:', error);
      }
      
      return results;
    });
    
    console.log('\n=== TRACE RESULTS ===');
    console.log(JSON.stringify(trace, null, 2));
    
    // Force render
    await page.evaluate(() => {
      if (window.RenderManager) {
        window.RenderManager.render('PLAYING');
      }
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(1000);
    
    // Take screenshot
    const testPassed = trace.errors.length === 0;
    await saveScreenshot(page, 'terrain/rendering_pipeline_trace', testPassed);
    
    // DETAILED ANALYSIS
    console.log('\n=== OFFSET ANALYSIS ===');
    
    if (trace.step5_actualPixels.exists && trace.step5_actualPixels.testTiles) {
      const offsetTiles = trace.step5_actualPixels.testTiles.filter(t => t.offsetX !== 0 || t.offsetY !== 0);
      
      if (offsetTiles.length > 0) {
        console.log('❌ OFFSET DETECTED in', offsetTiles.length, 'tiles');
        console.log('Example offsets:', offsetTiles.slice(0, 3));
      } else {
        console.log('✅ NO OFFSET in CustomTerrain tiles');
      }
    }
    
    // Check if the issue is in gridTerrain (main game terrain)
    if (trace.step3_cacheDrawing.cacheExists) {
      console.log('\n=== CACHE DRAWING COORDINATES ===');
      console.log('Cache position (CORNER mode):', trace.step3_cacheDrawing.expectedCachePosition);
      console.log('Cache size:', [trace.step3_cacheDrawing.cacheWidth, trace.step3_cacheDrawing.cacheHeight]);
    }
    
    await browser.close();
    process.exit(testPassed ? 0 : 1);
    
  } catch (error) {
    console.error('Test error:', error);
    await saveScreenshot(page, 'terrain/rendering_pipeline_trace_error', false);
    await browser.close();
    process.exit(1);
  }
})();
