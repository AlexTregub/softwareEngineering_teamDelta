/**
 * E2E Test: Canvas Transform and Cache Investigation
 * 
 * Investigates if canvas transforms or cached rendering is causing
 * the visual misalignment despite correct coordinates.
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('=== Canvas Transform Investigation ===\n');
    
    await page.goto('http://localhost:8000?test=1');
    await sleep(500);
    
    await page.evaluate(() => {
      GameState.goToLevelEditor();
      levelEditor.showGrid = true;
      levelEditor.gridOverlay.setVisible(true);
      levelEditor.gridOverlay.setOpacity(1.0);
    });
    
    await sleep(300);
    
    console.log('STEP 1: Check for canvas transforms\n');
    
    const transformCheck = await page.evaluate(() => {
      // Check if there are any transforms applied to the canvas
      const canvas = document.querySelector('canvas');
      
      if (!canvas) {
        return { error: 'No canvas found' };
      }
      
      const ctx = canvas.getContext('2d');
      const transform = ctx.getTransform();
      
      return {
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        styleWidth: canvas.style.width,
        styleHeight: canvas.style.height,
        transform: {
          a: transform.a,  // horizontal scaling
          b: transform.b,  // horizontal skewing
          c: transform.c,  // vertical skewing
          d: transform.d,  // vertical scaling
          e: transform.e,  // horizontal translation
          f: transform.f   // vertical translation
        },
        isIdentity: transform.a === 1 && transform.b === 0 && transform.c === 0 && 
                    transform.d === 1 && transform.e === 0 && transform.f === 0
      };
    });
    
    console.log('Canvas State:');
    console.log('  Canvas dimensions:', transformCheck.canvasWidth, 'x', transformCheck.canvasHeight);
    console.log('  Style dimensions:', transformCheck.styleWidth || 'not set', 'x', transformCheck.styleHeight || 'not set');
    console.log('  Transform matrix:', transformCheck.transform);
    console.log('  Is identity transform:', transformCheck.isIdentity ? '✓' : '✗');
    console.log();
    
    if (!transformCheck.isIdentity) {
      console.log('⚠️  WARNING: Canvas has a non-identity transform!');
      console.log('   This could cause sub-pixel rendering issues');
      console.log();
    }
    
    console.log('STEP 2: Check terrain cache rendering\n');
    
    const cacheAnalysis = await page.evaluate(() => {
      const terrain = levelEditor.terrain;
      
      // Disable cache temporarily and render
      const hadCache = terrain._renderCache !== null;
      const cacheWasValid = terrain._cacheValid;
      
      // Force cache invalidation
      terrain.invalidateCache();
      
      return {
        hadCache: hadCache,
        cacheWasValid: cacheWasValid,
        usesCache: terrain.render.toString().includes('_renderCache'),
        cacheNowInvalid: !terrain._cacheValid
      };
    });
    
    console.log('Terrain Cache Analysis:');
    console.log('  Had cache:', cacheAnalysis.hadCache);
    console.log('  Cache was valid:', cacheAnalysis.cacheWasValid);
    console.log('  render() uses cache:', cacheAnalysis.usesCache);
    console.log('  Cache now invalidated:', cacheAnalysis.cacheNowInvalid);
    console.log();
    
    console.log('STEP 3: Test with cache disabled\n');
    
    await page.evaluate(() => {
      const terrain = levelEditor.terrain;
      
      // Paint pattern
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          terrain.tiles[y][x].setMaterial('grass');
          terrain.tiles[y][x].assignWeight();
        }
      }
      
      // Paint 3x3 block at (5,5)
      for (let y = 5; y <= 7; y++) {
        for (let x = 5; x <= 7; x++) {
          terrain.tiles[y][x].setMaterial('stone');
          terrain.tiles[y][x].assignWeight();
        }
      }
      
      // Force cache rebuild
      terrain.invalidateCache();
      
      if (typeof redraw === 'function') {
        redraw();
        redraw();
      }
    });
    
    await sleep(500);
    await saveScreenshot(page, 'ui/grid_cache_invalidated', true);
    console.log('✓ Screenshot with cache invalidated\n');
    
    console.log('STEP 4: Check imageSmoothing and pixel alignment\n');
    
    const smoothingCheck = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      const ctx = canvas.getContext('2d');
      
      return {
        imageSmoothingEnabled: ctx.imageSmoothingEnabled,
        imageSmoothingQuality: ctx.imageSmoothingQuality
      };
    });
    
    console.log('Canvas Rendering Settings:');
    console.log('  imageSmoothingEnabled:', smoothingCheck.imageSmoothingEnabled);
    console.log('  imageSmoothingQuality:', smoothingCheck.imageSmoothingQuality);
    console.log();
    
    if (smoothingCheck.imageSmoothingEnabled) {
      console.log('ℹ️  Image smoothing is enabled');
      console.log('   This can cause sub-pixel blurring at tile boundaries');
      console.log();
    }
    
    console.log('STEP 5: Disable image smoothing and test\n');
    
    await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      const ctx = canvas.getContext('2d');
      
      // Disable smoothing for crisp pixel edges
      ctx.imageSmoothingEnabled = false;
      
      if (typeof redraw === 'function') {
        redraw();
        redraw();
      }
    });
    
    await sleep(500);
    await saveScreenshot(page, 'ui/grid_no_smoothing', true);
    console.log('✓ Screenshot with smoothing disabled\n');
    
    console.log('STEP 6: Check actual pixel data at tile boundary\n');
    
    const pixelData = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      const ctx = canvas.getContext('2d');
      
      // Sample pixels around tile boundary at x=160
      const x = 160;
      const y = 160;
      
      const samples = [];
      for (let dx = -2; dx <= 2; dx++) {
        const pixel = ctx.getImageData(x + dx, y, 1, 1).data;
        samples.push({
          x: x + dx,
          r: pixel[0],
          g: pixel[1],
          b: pixel[2],
          a: pixel[3]
        });
      }
      
      return samples;
    });
    
    console.log('Pixel Data at tile boundary (x=160, y=160):');
    pixelData.forEach(p => {
      const isWhite = p.r > 200 && p.g > 200 && p.b > 200;
      console.log(`  x=${p.x}: RGB(${p.r}, ${p.g}, ${p.b}) ${isWhite ? '← Grid line' : ''}`);
    });
    console.log();
    
    console.log('STEP 7: Compare grid line rendering methods\n');
    
    // Test alternative rendering: rect instead of line
    await page.evaluate(() => {
      // Temporarily replace grid rendering
      const originalRender = levelEditor.gridOverlay.render;
      
      levelEditor.gridOverlay.render = function(offsetX = 0, offsetY = 0) {
        if (typeof push === 'undefined') return;
        if (!this.visible) return;
        
        push();
        
        // Draw grid using FILLED RECTS instead of LINES
        fill(255, 255, 255, this.alpha * 255);
        noStroke();
        
        const lineWidth = 1;
        
        // Vertical lines as thin rects
        for (let x = 0; x <= this.width; x += this.gridSpacing) {
          const screenX = x * this.tileSize + offsetX;
          rect(screenX, offsetY, lineWidth, this.height * this.tileSize);
        }
        
        // Horizontal lines as thin rects
        for (let y = 0; y <= this.height; y += this.gridSpacing) {
          const screenY = y * this.tileSize + offsetY;
          rect(offsetX, screenY, this.width * this.tileSize, lineWidth);
        }
        
        pop();
      };
      
      if (typeof redraw === 'function') {
        redraw();
        redraw();
      }
      
      // Restore original
      levelEditor.gridOverlay.render = originalRender;
    });
    
    await sleep(500);
    await saveScreenshot(page, 'ui/grid_using_rects', true);
    console.log('✓ Screenshot with grid drawn using rect() instead of line()\n');
    
    console.log('=== INVESTIGATION COMPLETE ===\n');
    console.log('Compare screenshots:');
    console.log('  1. grid_cache_invalidated.png - Normal rendering');
    console.log('  2. grid_no_smoothing.png - With smoothing disabled');
    console.log('  3. grid_using_rects.png - Grid drawn with rect() instead of line()');
    console.log();
    console.log('If grid_using_rects.png looks better aligned, the issue is stroke centering');
    console.log('If grid_no_smoothing.png looks better, the issue is image smoothing/anti-aliasing');
    console.log('If all look the same, the issue may be in your original screenshot interpretation');
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('Investigation failed:', error.message);
    console.error(error.stack);
    await saveScreenshot(page, 'ui/grid_transform_investigation_error', false);
    await browser.close();
    process.exit(1);
  }
})();
