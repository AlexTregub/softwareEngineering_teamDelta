/**
 * pw_queen_direct_draw.js
 * 
 * Bypass ALL rendering systems and draw queen directly to canvas center.
 * This will prove if the issue is rendering pipeline or queen itself.
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  console.log('🎨 Direct Queen Draw Test (Bypass Rendering Pipeline)\n');
  console.log('='.repeat(70));
  
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:8000?test=1');
    await sleep(1000);
    
    console.log('1️⃣  Spawning queen and getting reference...');
    
    const directDraw = await page.evaluate(() => {
      // Get or create queen
      let queen = window.queenAnt || window.getQueen?.();
      
      if (!queen) {
        // Spawn queen if doesn't exist
        if (typeof window.spawnQueen === 'function') {
          queen = window.spawnQueen();
        }
      }
      
      if (!queen) {
        return { success: false, reason: 'Could not spawn queen' };
      }
      
      // Get canvas
      const canvas = document.querySelector('canvas');
      if (!canvas) {
        return { success: false, reason: 'No canvas found' };
      }
      
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      
      // Move queen to center of screen
      if (queen.model && queen.model.setPosition) {
        queen.model.setPosition(centerX, centerY);
      } else if (queen.setPosition) {
        queen.setPosition(centerX, centerY);
      } else {
        return { success: false, reason: 'Queen has no setPosition method' };
      }
      
      // FORCE a direct manual draw bypassing ALL systems
      try {
        // Save context state
        if (typeof window.push === 'function') window.push();
        
        // Draw a large red circle at center (queen placeholder)
        if (typeof window.fill === 'function') window.fill(255, 0, 0); // Red
        if (typeof window.noStroke === 'function') window.noStroke();
        if (typeof window.ellipse === 'function') {
          window.ellipse(centerX, centerY, 50, 50);
        }
        
        // Draw queen size indicator (white circle)
        if (typeof window.fill === 'function') window.fill(255, 255, 255);
        const queenSize = queen.model ? queen.model.getSize() : { x: 40, y: 40 };
        if (typeof window.ellipse === 'function') {
          window.ellipse(centerX, centerY, queenSize.x, queenSize.y);
        }
        
        // Try to call queen's render method
        if (queen.controller && typeof queen.controller.render === 'function') {
          queen.controller.render();
        } else if (queen.view && typeof queen.view.render === 'function') {
          queen.view.render(queen.model);
        } else if (typeof queen.render === 'function') {
          queen.render();
        }
        
        // Restore context state
        if (typeof window.pop === 'function') window.pop();
        
        // Force p5 redraw
        if (typeof window.redraw === 'function') {
          window.redraw();
          window.redraw();
          window.redraw();
        }
        
        return {
          success: true,
          canvasSize: { width: canvasWidth, height: canvasHeight },
          centerPos: { x: centerX, y: centerY },
          queenPos: queen.model ? queen.model.getPosition() : null,
          queenSize: queenSize,
          hasPush: typeof window.push === 'function',
          hasFill: typeof window.fill === 'function',
          hasEllipse: typeof window.ellipse === 'function',
          hasRedraw: typeof window.redraw === 'function',
          queenHasRender: !!(queen.controller?.render || queen.view?.render || queen.render)
        };
        
      } catch (error) {
        return { success: false, reason: 'Draw error: ' + error.message, stack: error.stack };
      }
    });
    
    console.log('   Result:', JSON.stringify(directDraw, null, 2));
    
    if (!directDraw.success) {
      console.log('\n❌ FAILED:', directDraw.reason);
      await saveScreenshot(page, 'rendering/queen_direct_draw_failed', false);
      await browser.close();
      process.exit(1);
    }
    
    console.log('\n2️⃣  Taking screenshot after direct draw...');
    await sleep(500);
    await saveScreenshot(page, 'rendering/queen_direct_draw_center', true);
    
    console.log('\n3️⃣  Testing p5.js draw() loop...');
    
    // Inject a custom draw function that draws red circle every frame
    const loopTest = await page.evaluate(() => {
      // Override draw to force red circle
      const originalDraw = window.draw;
      let frameCount = 0;
      
      window.draw = function() {
        // Call original draw first
        if (originalDraw && typeof originalDraw === 'function') {
          originalDraw();
        }
        
        // Force draw red circle at center
        const canvas = document.querySelector('canvas');
        if (canvas) {
          const cx = canvas.width / 2;
          const cy = canvas.height / 2;
          
          if (typeof window.push === 'function') window.push();
          if (typeof window.fill === 'function') window.fill(255, 0, 0);
          if (typeof window.noStroke === 'function') window.noStroke();
          if (typeof window.ellipse === 'function') {
            window.ellipse(cx, cy, 80, 80); // Large red circle
          }
          if (typeof window.pop === 'function') window.pop();
          
          frameCount++;
        }
      };
      
      return { 
        success: true, 
        originalDrawExists: !!originalDraw,
        loopActive: typeof window.loop === 'function'
      };
    });
    
    console.log('   Loop override result:', JSON.stringify(loopTest, null, 2));
    
    console.log('\n4️⃣  Waiting for a few frames...');
    await sleep(1000);
    await saveScreenshot(page, 'rendering/queen_direct_draw_with_loop', true);
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ TEST COMPLETE!');
    console.log('\n📸 Check screenshots:');
    console.log('   - test/e2e/screenshots/rendering/queen_direct_draw_center.png');
    console.log('   - test/e2e/screenshots/rendering/queen_direct_draw_with_loop.png');
    console.log('\n🔍 Expected:');
    console.log('   - Large RED circle at center of canvas');
    console.log('   - White circle (queen size) at center');
    console.log('\n⚠️  If you see NO circles:');
    console.log('   - Problem is p5.js drawing context itself');
    console.log('\n⚠️  If you see circles but no queen:');
    console.log('   - Problem is queen.controller.render() method');
    console.log('='.repeat(70));
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n💥 Test Error:', error.message);
    console.error(error.stack);
    await saveScreenshot(page, 'rendering/queen_direct_draw_error', false);
    await browser.close();
    process.exit(1);
  }
})();
