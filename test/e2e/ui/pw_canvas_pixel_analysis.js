/**
 * E2E Test - Canvas Pixel Analysis
 * 
 * Actually analyzes the canvas pixels to detect if textures are rendering
 * or if it's just solid colors
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:8000?test=1');
    
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
    
    await sleep(500);
    
    // Paint some terrain with different materials
    await page.evaluate(() => {
      const editor = window.levelEditor.editor;
      
      // Paint a large block of moss
      editor.selectMaterial('moss');
      for (let x = 5; x < 10; x++) {
        for (let y = 5; y < 10; y++) {
          editor.paintTile(x * 32, y * 32);
        }
      }
      
      // Paint a large block of stone
      editor.selectMaterial('stone');
      for (let x = 10; x < 15; x++) {
        for (let y = 5; y < 10; y++) {
          editor.paintTile(x * 32, y * 32);
        }
      }
    });
    
    console.log('✓ Painted terrain with moss and stone');
    
    // Force render
    await page.evaluate(() => {
      if (typeof redraw === 'function') {
        for (let i = 0; i < 5; i++) redraw();
      }
    });
    
    await sleep(1000);
    
    // Take screenshot before analysis
    await saveScreenshot(page, 'canvas_analysis/before_pixel_check', true);
    
    // Analyze canvas pixels
    const pixelAnalysis = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return { error: 'Canvas not found' };
      
      const ctx = canvas.getContext('2d');
      
      // Sample pixels from moss area (around 5*32, 5*32 = 160, 160)
      const mossPixels = [];
      for (let x = 160; x < 200; x += 8) {
        for (let y = 160; y < 200; y += 8) {
          const pixel = ctx.getImageData(x, y, 1, 1).data;
          mossPixels.push({
            x, y,
            r: pixel[0],
            g: pixel[1],
            b: pixel[2],
            a: pixel[3]
          });
        }
      }
      
      // Sample pixels from stone area (around 10*32, 5*32 = 320, 160)
      const stonePixels = [];
      for (let x = 320; x < 360; x += 8) {
        for (let y = 160; y < 200; y += 8) {
          const pixel = ctx.getImageData(x, y, 1, 1).data;
          stonePixels.push({
            x, y,
            r: pixel[0],
            g: pixel[1],
            b: pixel[2],
            a: pixel[3]
          });
        }
      }
      
      // Calculate color variance (textures have variation, solid colors don't)
      const calcVariance = (pixels) => {
        const avgR = pixels.reduce((sum, p) => sum + p.r, 0) / pixels.length;
        const avgG = pixels.reduce((sum, p) => sum + p.g, 0) / pixels.length;
        const avgB = pixels.reduce((sum, p) => sum + p.b, 0) / pixels.length;
        
        const varianceR = pixels.reduce((sum, p) => sum + Math.pow(p.r - avgR, 2), 0) / pixels.length;
        const varianceG = pixels.reduce((sum, p) => sum + Math.pow(p.g - avgG, 2), 0) / pixels.length;
        const varianceB = pixels.reduce((sum, p) => sum + Math.pow(p.b - avgB, 2), 0) / pixels.length;
        
        return {
          avgColor: { r: Math.round(avgR), g: Math.round(avgG), b: Math.round(avgB) },
          variance: Math.round(varianceR + varianceG + varianceB),
          stdDev: Math.round(Math.sqrt((varianceR + varianceG + varianceB) / 3))
        };
      };
      
      const mossAnalysis = calcVariance(mossPixels);
      const stoneAnalysis = calcVariance(stonePixels);
      
      // Check if it's the brown background color (139, 90, 43)
      const isBrownBackground = (analysis) => {
        const { r, g, b } = analysis.avgColor;
        return Math.abs(r - 139) < 20 && Math.abs(g - 90) < 20 && Math.abs(b - 43) < 20;
      };
      
      return {
        moss: {
          ...mossAnalysis,
          isBrownBackground: isBrownBackground(mossAnalysis),
          hasTexture: mossAnalysis.variance > 100, // Textures have variance
          sampleSize: mossPixels.length
        },
        stone: {
          ...stoneAnalysis,
          isBrownBackground: isBrownBackground(stoneAnalysis),
          hasTexture: stoneAnalysis.variance > 100,
          sampleSize: stonePixels.length
        },
        canvasDimensions: {
          width: canvas.width,
          height: canvas.height
        }
      };
    });
    
    console.log('\nPixel Analysis:');
    console.log(JSON.stringify(pixelAnalysis, null, 2));
    
    if (pixelAnalysis.error) {
      console.error('✗ ERROR:', pixelAnalysis.error);
      process.exit(1);
    }
    
    // Check results
    let failed = false;
    
    if (pixelAnalysis.moss.isBrownBackground) {
      console.error('✗ FAILED: Moss area is showing BROWN BACKGROUND instead of moss texture!');
      console.error('  Average color:', pixelAnalysis.moss.avgColor);
      console.error('  Expected: Green moss texture');
      failed = true;
    } else {
      console.log('✓ Moss area has different color than brown background');
    }
    
    if (pixelAnalysis.stone.isBrownBackground) {
      console.error('✗ FAILED: Stone area is showing BROWN BACKGROUND instead of stone texture!');
      console.error('  Average color:', pixelAnalysis.stone.avgColor);
      console.error('  Expected: Gray stone texture');
      failed = true;
    } else {
      console.log('✓ Stone area has different color than brown background');
    }
    
    if (!pixelAnalysis.moss.hasTexture) {
      console.error('✗ FAILED: Moss area has NO TEXTURE VARIANCE (solid color)');
      console.error('  Variance:', pixelAnalysis.moss.variance);
      console.error('  Expected: Variance > 100 (textured)');
      failed = true;
    } else {
      console.log('✓ Moss area has texture variance:', pixelAnalysis.moss.variance);
    }
    
    if (!pixelAnalysis.stone.hasTexture) {
      console.error('✗ FAILED: Stone area has NO TEXTURE VARIANCE (solid color)');
      console.error('  Variance:', pixelAnalysis.stone.variance);
      console.error('  Expected: Variance > 100 (textured)');
      failed = true;
    } else {
      console.log('✓ Stone area has texture variance:', pixelAnalysis.stone.variance);
    }
    
    if (failed) {
      console.error('\n✗✗✗ VISUAL RENDERING IS BROKEN! ✗✗✗');
      console.error('Tiles have correct material data, but rendering shows solid brown color!');
      await saveScreenshot(page, 'canvas_analysis/visual_rendering_broken', false);
      await browser.close();
      process.exit(1);
    }
    
    console.log('\n✓ Visual rendering is working correctly');
    await saveScreenshot(page, 'canvas_analysis/visual_rendering_success', true);
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('Test failed:', error);
    await saveScreenshot(page, 'canvas_analysis/error', false);
    await browser.close();
    process.exit(1);
  }
})();
