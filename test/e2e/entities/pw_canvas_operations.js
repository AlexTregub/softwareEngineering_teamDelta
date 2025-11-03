/**
 * E2E Test: Monitor Canvas Drawing Operations
 * 
 * Intercepts p5.js drawing functions to see if anything is actually being drawn
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('Loading game...\n');
    await page.goto('http://localhost:8000?test=1');
    await sleep(2000);
    
    // Load custom level
    await page.evaluate(async () => {
      if (typeof loadCustomLevel === 'function') {
        await loadCustomLevel('levels/CaveTutorial.json');
      }
    });
    await sleep(1000);
    
    // Monitor canvas operations for 2 seconds
    console.log('Monitoring canvas drawing operations...\n');
    
    const canvasOps = await page.evaluate(() => {
      return new Promise((resolve) => {
        const ops = {
          rect: 0,
          ellipse: 0,
          circle: 0,
          image: 0,
          line: 0,
          triangle: 0,
          fill: 0,
          stroke: 0,
          push: 0,
          pop: 0,
          translate: 0,
          scale: 0,
          operations: []
        };
        
        // Intercept drawing functions
        const originalRect = window.rect;
        const originalEllipse = window.ellipse;
        const originalCircle = window.circle;
        const originalImage = window.image;
        const originalLine = window.line;
        const originalTriangle = window.triangle;
        const originalFill = window.fill;
        const originalStroke = window.stroke;
        const originalPush = window.push;
        const originalPop = window.pop;
        const originalTranslate = window.translate;
        const originalScale = window.scale;
        
        window.rect = function(x, y, w, h) {
          ops.rect++;
          ops.operations.push(`rect(${Math.round(x)}, ${Math.round(y)}, ${Math.round(w)}, ${Math.round(h)})`);
          if (ops.operations.length <= 50) console.log(`[DRAW] rect(${Math.round(x)}, ${Math.round(y)}, ${Math.round(w)}, ${Math.round(h)})`);
          if (originalRect) return originalRect.apply(this, arguments);
        };
        
        window.ellipse = function(x, y, w, h) {
          ops.ellipse++;
          ops.operations.push(`ellipse(${Math.round(x)}, ${Math.round(y)}, ${Math.round(w)}, ${Math.round(h || w)})`);
          if (ops.operations.length <= 50) console.log(`[DRAW] ellipse(${Math.round(x)}, ${Math.round(y)}, ${Math.round(w)}, ${Math.round(h || w)})`);
          if (originalEllipse) return originalEllipse.apply(this, arguments);
        };
        
        window.circle = function(x, y, d) {
          ops.circle++;
          ops.operations.push(`circle(${Math.round(x)}, ${Math.round(y)}, ${Math.round(d)})`);
          if (ops.operations.length <= 50) console.log(`[DRAW] circle(${Math.round(x)}, ${Math.round(y)}, ${Math.round(d)})`);
          if (originalCircle) return originalCircle.apply(this, arguments);
        };
        
        window.image = function(img, x, y, w, h) {
          ops.image++;
          ops.operations.push(`image(${Math.round(x)}, ${Math.round(y)}, ${Math.round(w)}, ${Math.round(h)})`);
          if (ops.operations.length <= 50) console.log(`[DRAW] image(${Math.round(x)}, ${Math.round(y)}, ${Math.round(w)}, ${Math.round(h)})`);
          if (originalImage) return originalImage.apply(this, arguments);
        };
        
        window.push = function() {
          ops.push++;
          if (originalPush) return originalPush.apply(this, arguments);
        };
        
        window.pop = function() {
          ops.pop++;
          if (originalPop) return originalPop.apply(this, arguments);
        };
        
        window.translate = function(x, y) {
          ops.translate++;
          if (originalTranslate) return originalTranslate.apply(this, arguments);
        };
        
        window.scale = function(s) {
          ops.scale++;
          if (originalScale) return originalScale.apply(this, arguments);
        };
        
        // Monitor for 2 seconds
        setTimeout(() => {
          // Restore
          window.rect = originalRect;
          window.ellipse = originalEllipse;
          window.circle = originalCircle;
          window.image = originalImage;
          window.line = originalLine;
          window.triangle = originalTriangle;
          window.fill = originalFill;
          window.stroke = originalStroke;
          window.push = originalPush;
          window.pop = originalPop;
          window.translate = originalTranslate;
          window.scale = originalScale;
          
          resolve(ops);
        }, 2000);
      });
    });
    
    console.log('=== Canvas Operations Summary ===');
    console.log(`rect():      ${canvasOps.rect}`);
    console.log(`ellipse():   ${canvasOps.ellipse}`);
    console.log(`circle():    ${canvasOps.circle}`);
    console.log(`image():     ${canvasOps.image}`);
    console.log(`push():      ${canvasOps.push}`);
    console.log(`pop():       ${canvasOps.pop}`);
    console.log(`translate(): ${canvasOps.translate}`);
    console.log(`scale():     ${canvasOps.scale}`);
    console.log(`\nTotal drawing operations: ${canvasOps.rect + canvasOps.ellipse + canvasOps.circle + canvasOps.image}`);
    
    console.log(`\nFirst 20 operations:`);
    canvasOps.operations.slice(0, 20).forEach((op, i) => {
      console.log(`  ${i + 1}. ${op}`);
    });
    
    await saveScreenshot(page, 'entities/canvas_operations', true);
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('Test error:', error);
    await browser.close();
    process.exit(1);
  }
})();
