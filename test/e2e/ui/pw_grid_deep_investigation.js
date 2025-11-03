/**
 * E2E Test: Deep Grid Rendering Investigation
 * 
 * Captures actual canvas pixel data and rendering state to determine
 * why the grid is still misaligned after applying the stroke offset.
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('=== Deep Grid Rendering Investigation ===\n');
    
    await page.goto('http://localhost:8000?test=1');
    await sleep(500);
    
    // Initialize Level Editor
    await page.evaluate(() => {
      GameState.goToLevelEditor();
      levelEditor.showGrid = true;
      levelEditor.gridOverlay.setVisible(true);
      levelEditor.gridOverlay.setOpacity(1.0);
    });
    
    await sleep(300);
    
    console.log('STEP 1: Check if GridOverlay code actually has the stroke offset\n');
    
    const gridCode = await page.evaluate(() => {
      // Get the actual render method source code
      const renderSource = levelEditor.gridOverlay.render.toString();
      
      return {
        hasStrokeOffset: renderSource.includes('strokeOffset'),
        strokeOffsetValue: renderSource.match(/strokeOffset\s*=\s*([\d.]+)/)?.[1] || 'NOT FOUND',
        usesStrokeOffset: renderSource.includes('+ strokeOffset'),
        renderSourceSnippet: renderSource.substring(0, 1000)
      };
    });
    
    console.log('GridOverlay.render() Code Analysis:');
    console.log('  Contains strokeOffset variable:', gridCode.hasStrokeOffset);
    console.log('  strokeOffset value:', gridCode.strokeOffsetValue);
    console.log('  Uses strokeOffset in calculations:', gridCode.usesStrokeOffset);
    console.log();
    
    if (!gridCode.hasStrokeOffset || !gridCode.usesStrokeOffset) {
      console.log('⚠️  WARNING: The code changes may not have been loaded!');
      console.log('   Try hard-refreshing the browser (Ctrl+Shift+R)');
      console.log();
    }
    
    console.log('STEP 2: Intercept actual line() calls during rendering\n');
    
    await page.evaluate(() => {
      const terrain = levelEditor.terrain;
      
      // Paint a simple pattern
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          terrain.tiles[y][x].setMaterial('grass');
          terrain.tiles[y][x].assignWeight();
        }
      }
      
      // Paint one tile at (5, 5)
      terrain.tiles[5][5].setMaterial('stone');
      terrain.tiles[5][5].assignWeight();
      
      terrain.invalidateCache();
    });
    
    const renderCalls = await page.evaluate(() => {
      const calls = {
        lines: [],
        images: [],
        rects: []
      };
      
      // Wrap drawing functions
      const originalLine = window.line;
      const originalImage = window.image;
      const originalRect = window.rect;
      
      window.line = function(x1, y1, x2, y2) {
        calls.lines.push({ x1, y1, x2, y2 });
        return originalLine.call(this, x1, y1, x2, y2);
      };
      
      window.image = function(img, x, y, w, h) {
        calls.images.push({ x, y, w, h, type: 'image' });
        return originalImage.call(this, img, x, y, w, h);
      };
      
      window.rect = function(x, y, w, h) {
        calls.rects.push({ x, y, w, h, type: 'rect' });
        return originalRect.call(this, x, y, w, h);
      };
      
      // Trigger a render
      if (typeof redraw === 'function') {
        redraw();
      }
      
      // Restore
      window.line = originalLine;
      window.image = originalImage;
      window.rect = originalRect;
      
      return calls;
    });
    
    console.log('Actual Rendering Calls:');
    console.log(`  line() calls: ${renderCalls.lines.length}`);
    console.log(`  image() calls: ${renderCalls.images.length}`);
    console.log(`  rect() calls: ${renderCalls.rects.length}`);
    console.log();
    
    // Analyze grid lines around tile (5, 5)
    const tileIndex = 5;
    const tileSize = 32;
    const expectedTileLeft = tileIndex * tileSize; // 160
    
    const verticalLines = renderCalls.lines.filter(l => l.x1 === l.x2);
    const lineAtTileLeft = verticalLines.find(l => 
      l.x1 >= expectedTileLeft - 1 && l.x1 <= expectedTileLeft + 1
    );
    
    console.log(`Grid Line Analysis for Tile ${tileIndex}:`);
    console.log(`  Expected tile left edge: ${expectedTileLeft}px`);
    console.log(`  Expected grid line WITH offset: ${expectedTileLeft + 0.5}px`);
    
    if (lineAtTileLeft) {
      console.log(`  Actual grid line position: ${lineAtTileLeft.x1}px`);
      console.log(`  Offset from tile edge: ${lineAtTileLeft.x1 - expectedTileLeft}px`);
      
      if (Math.abs(lineAtTileLeft.x1 - (expectedTileLeft + 0.5)) < 0.01) {
        console.log('  ✓ Grid line HAS the 0.5px offset applied');
      } else if (Math.abs(lineAtTileLeft.x1 - expectedTileLeft) < 0.01) {
        console.log('  ✗ Grid line does NOT have the offset (at exact tile boundary)');
      } else {
        console.log('  ⚠️  Grid line at unexpected position');
      }
    } else {
      console.log('  ⚠️  Could not find grid line near expected position');
      console.log('  First few vertical lines:', verticalLines.slice(0, 8).map(l => l.x1));
    }
    console.log();
    
    console.log('STEP 3: Check tile rendering position\n');
    
    // Find the stone tile at (5, 5)
    const stoneTile = renderCalls.images.find(img => 
      img.x >= expectedTileLeft - 1 && img.x <= expectedTileLeft + 1 &&
      img.y >= expectedTileLeft - 1 && img.y <= expectedTileLeft + 1
    );
    
    console.log(`Tile (${tileIndex}, ${tileIndex}) Rendering:`);
    if (stoneTile) {
      console.log(`  Position: (${stoneTile.x}, ${stoneTile.y})`);
      console.log(`  Size: ${stoneTile.w}x${stoneTile.h}`);
      console.log(`  Expected position: (${expectedTileLeft}, ${expectedTileLeft})`);
      console.log(`  Position matches: ${stoneTile.x === expectedTileLeft && stoneTile.y === expectedTileLeft ? '✓' : '✗'}`);
    } else {
      console.log('  ⚠️  Could not find stone tile in image() calls');
      console.log('  Sample image positions:', renderCalls.images.slice(0, 5).map(i => `(${i.x}, ${i.y})`));
    }
    console.log();
    
    console.log('STEP 4: Check if there are multiple render passes\n');
    
    const multiRenderCheck = await page.evaluate(() => {
      let renderCount = 0;
      const originalRender = levelEditor.gridOverlay.render;
      
      levelEditor.gridOverlay.render = function(...args) {
        renderCount++;
        return originalRender.apply(this, args);
      };
      
      if (typeof redraw === 'function') {
        redraw();
      }
      
      levelEditor.gridOverlay.render = originalRender;
      
      return { renderCount };
    });
    
    console.log(`GridOverlay.render() called ${multiRenderCheck.renderCount} times in one redraw cycle`);
    console.log();
    
    console.log('STEP 5: Check LevelEditor render order\n');
    
    const renderOrder = await page.evaluate(() => {
      const source = levelEditor.render.toString();
      
      const terrainIndex = source.indexOf('terrain.render');
      const gridIndex = source.indexOf('gridOverlay.render');
      
      return {
        terrainFirst: terrainIndex < gridIndex && terrainIndex !== -1,
        terrainIndex,
        gridIndex,
        bothFound: terrainIndex !== -1 && gridIndex !== -1
      };
    });
    
    console.log('LevelEditor.render() Order:');
    console.log('  Both terrain and grid renders found:', renderOrder.bothFound);
    console.log('  Terrain renders before grid:', renderOrder.terrainFirst);
    console.log();
    
    console.log('STEP 6: Capture screenshot and check cache\n');
    
    await page.evaluate(() => {
      if (typeof redraw === 'function') {
        redraw();
        redraw();
        redraw();
      }
    });
    
    await sleep(1000);
    
    const cacheCheck = await page.evaluate(() => {
      return {
        terrainHasCache: levelEditor.terrain._renderCache !== null,
        terrainCacheValid: levelEditor.terrain._cacheValid
      };
    });
    
    console.log('Cache Status:');
    console.log('  Terrain has cache:', cacheCheck.terrainHasCache);
    console.log('  Terrain cache valid:', cacheCheck.terrainCacheValid);
    console.log();
    
    await saveScreenshot(page, 'ui/grid_deep_investigation', true);
    console.log('✓ Screenshot saved\n');
    
    console.log('=== INVESTIGATION SUMMARY ===\n');
    
    if (!gridCode.hasStrokeOffset) {
      console.log('❌ PROBLEM: strokeOffset not found in GridOverlay.render()');
      console.log('   The browser may be using cached JavaScript');
      console.log('   Solutions:');
      console.log('   1. Hard refresh (Ctrl+Shift+R)');
      console.log('   2. Clear browser cache');
      console.log('   3. Restart dev server');
    } else if (lineAtTileLeft && Math.abs(lineAtTileLeft.x1 - expectedTileLeft) < 0.01) {
      console.log('❌ PROBLEM: strokeOffset code exists but is NOT being applied');
      console.log('   The offset value might be 0 or the code path is not executing');
    } else {
      console.log('⚠️  NEEDS MANUAL INSPECTION');
      console.log('   Check the screenshot and compare grid line positions');
    }
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('Investigation failed:', error.message);
    console.error(error.stack);
    await saveScreenshot(page, 'ui/grid_deep_investigation_error', false);
    await browser.close();
    process.exit(1);
  }
})();
