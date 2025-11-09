/**
 * pw_queen_visibility_debug.js
 * 
 * Comprehensive diagnostic test for queen visibility issue.
 * Tests every component of the rendering pipeline in detail.
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  console.log('🔍 Queen Visibility Diagnostic Test\n');
  console.log('='.repeat(70));
  
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  // Capture all console output
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'log' && text.includes('👑')) {
      console.log(`   📋 ${text}`);
    }
  });
  
  try {
    await page.goto('http://localhost:8000?test=1');
    await sleep(1000);
    
    // ===== DIAGNOSTIC 1: Check Queen Exists =====
    console.log('\n1️⃣  Checking if queen exists...');
    
    const queenExists = await page.evaluate(() => {
      const queen = window.queenAnt || window.getQueen?.();
      
      if (!queen) {
        return { exists: false, reason: 'No queen in window.queenAnt or getQueen()' };
      }
      
      return {
        exists: true,
        type: typeof queen,
        isMVC: !!(queen.model && queen.view && queen.controller),
        position: queen.model ? queen.model.getPosition() : (queen.getPosition ? queen.getPosition() : null),
        active: queen.model ? queen.model.isActive() : (queen.active !== undefined ? queen.active : null),
        size: queen.model ? queen.model.getSize() : null
      };
    });
    
    console.log('   Result:', JSON.stringify(queenExists, null, 2));
    
    if (!queenExists.exists) {
      console.log('\n❌ PROBLEM FOUND: Queen does not exist!');
      console.log('   The queen is not spawning. Check spawnQueen() in ants.js');
      await saveScreenshot(page, 'rendering/queen_debug_not_spawned', false);
      await browser.close();
      process.exit(1);
    }
    
    // ===== DIAGNOSTIC 2: Check Queen in ants[] Array =====
    console.log('\n2️⃣  Checking if queen is in ants[] array...');
    
    const inArray = await page.evaluate(() => {
      if (!window.ants) {
        return { found: false, reason: 'window.ants is undefined' };
      }
      
      if (!Array.isArray(window.ants)) {
        return { found: false, reason: 'window.ants is not an array', type: typeof window.ants };
      }
      
      const queenAnt = window.queenAnt || window.getQueen?.();
      const queenIndex = window.ants.indexOf(queenAnt);
      
      return {
        found: queenIndex >= 0,
        arrayLength: window.ants.length,
        queenIndex,
        allAnts: window.ants.map((a, i) => ({
          index: i,
          isMVC: !!(a && a.model),
          job: a && a.model ? a.model.getJobName() : (a && a.jobName ? a.jobName : 'unknown'),
          active: a && a.model ? a.model.isActive() : (a && a.active !== undefined ? a.active : null)
        }))
      };
    });
    
    console.log('   Result:', JSON.stringify(inArray, null, 2));
    
    if (!inArray.found) {
      console.log('\n❌ PROBLEM FOUND: Queen is not in ants[] array!');
      console.log('   The rendering loop iterates ants[] array. Queen must be added to it.');
      await saveScreenshot(page, 'rendering/queen_debug_not_in_array', false);
      await browser.close();
      process.exit(1);
    }
    
    // ===== DIAGNOSTIC 3: Check Render Loop Registration =====
    console.log('\n3️⃣  Checking if ants render loop is registered...');
    
    const renderLoop = await page.evaluate(() => {
      // Check if updateAnts and antsRender functions exist
      const hasUpdateAnts = typeof window.updateAnts === 'function';
      const hasAntsUpdate = typeof window.antsUpdate === 'function';
      const hasRenderAnts = typeof window.renderAnts === 'function';
      const hasAntsRender = typeof window.antsRender === 'function';
      
      // Check RenderManager
      const hasRenderManager = typeof window.RenderManager !== 'undefined';
      let entityLayer = null;
      
      if (hasRenderManager && window.RenderManager.layers) {
        const drawables = window.RenderManager.getLayerDrawables?.(window.RenderManager.layers.ENTITIES);
        entityLayer = {
          exists: true,
          drawableCount: drawables ? drawables.length : 0
        };
      }
      
      return {
        hasUpdateAnts,
        hasAntsUpdate,
        hasRenderAnts,
        hasAntsRender,
        hasRenderManager,
        entityLayer
      };
    });
    
    console.log('   Result:', JSON.stringify(renderLoop, null, 2));
    
    if (!renderLoop.hasAntsRender && !renderLoop.hasRenderAnts) {
      console.log('\n❌ PROBLEM FOUND: antsRender() or renderAnts() function missing!');
      await saveScreenshot(page, 'rendering/queen_debug_no_render_function', false);
      await browser.close();
      process.exit(1);
    }
    
    // ===== DIAGNOSTIC 4: Test EntityAccessor =====
    console.log('\n4️⃣  Testing EntityAccessor with queen...');
    
    const accessorTest = await page.evaluate(() => {
      if (typeof window.EntityAccessor === 'undefined') {
        return { success: false, reason: 'EntityAccessor not loaded' };
      }
      
      const queen = window.queenAnt || window.getQueen?.();
      if (!queen) {
        return { success: false, reason: 'No queen to test' };
      }
      
      try {
        const pos = window.EntityAccessor.getPosition(queen);
        const size = window.EntityAccessor.getSize(queen);
        
        return {
          success: true,
          position: pos,
          size: size,
          positionValid: pos && typeof pos.x === 'number' && typeof pos.y === 'number',
          sizeValid: size && typeof size.x === 'number' && typeof size.y === 'number'
        };
      } catch (error) {
        return { success: false, reason: 'Exception: ' + error.message, stack: error.stack };
      }
    });
    
    console.log('   Result:', JSON.stringify(accessorTest, null, 2));
    
    if (!accessorTest.success || !accessorTest.positionValid) {
      console.log('\n❌ PROBLEM FOUND: EntityAccessor cannot extract queen position!');
      console.log('   This will cause rendering to fail.');
      await saveScreenshot(page, 'rendering/queen_debug_accessor_fail', false);
      await browser.close();
      process.exit(1);
    }
    
    // ===== DIAGNOSTIC 5: Check Camera Bounds =====
    console.log('\n5️⃣  Checking if queen is within camera viewport...');
    
    const cameraBounds = await page.evaluate(() => {
      const queen = window.queenAnt || window.getQueen?.();
      const pos = queen.model ? queen.model.getPosition() : null;
      
      if (!pos) return { inView: false, reason: 'No position' };
      
      // Get camera position
      let cameraX = 0, cameraY = 0, cameraZoom = 1;
      if (window.cameraManager) {
        const camPos = window.cameraManager.getPosition();
        cameraX = camPos.x;
        cameraY = camPos.y;
        cameraZoom = window.cameraManager.getZoom();
      }
      
      // Get canvas size
      const canvasWidth = window.width || 800;
      const canvasHeight = window.height || 600;
      
      // Calculate viewport bounds in world coordinates
      const viewportLeft = cameraX;
      const viewportRight = cameraX + canvasWidth / cameraZoom;
      const viewportTop = cameraY;
      const viewportBottom = cameraY + canvasHeight / cameraZoom;
      
      const inView = pos.x >= viewportLeft && pos.x <= viewportRight &&
                     pos.y >= viewportTop && pos.y <= viewportBottom;
      
      return {
        inView,
        queenPos: { x: pos.x, y: pos.y },
        viewport: {
          left: viewportLeft,
          right: viewportRight,
          top: viewportTop,
          bottom: viewportBottom,
          width: canvasWidth,
          height: canvasHeight
        },
        camera: { x: cameraX, y: cameraY, zoom: cameraZoom },
        distance: {
          toLeft: pos.x - viewportLeft,
          toRight: viewportRight - pos.x,
          toTop: pos.y - viewportTop,
          toBottom: viewportBottom - pos.y
        }
      };
    });
    
    console.log('   Result:', JSON.stringify(cameraBounds, null, 2));
    
    if (!cameraBounds.inView) {
      console.log('\n⚠️  PROBLEM FOUND: Queen is outside camera viewport!');
      console.log('   Queen needs to be moved into view or camera needs to follow queen.');
    }
    
    // ===== DIAGNOSTIC 6: Manually Call Render =====
    console.log('\n6️⃣  Manually calling render functions...');
    
    const manualRender = await page.evaluate(() => {
      const results = [];
      
      // Call antsRender directly
      if (typeof window.antsRender === 'function') {
        try {
          window.antsRender();
          results.push({ function: 'antsRender', success: true });
        } catch (error) {
          results.push({ function: 'antsRender', success: false, error: error.message });
        }
      } else if (typeof window.renderAnts === 'function') {
        try {
          window.renderAnts();
          results.push({ function: 'renderAnts', success: true });
        } catch (error) {
          results.push({ function: 'renderAnts', success: false, error: error.message });
        }
      }
      
      // Call queen's controller render directly
      const queen = window.queenAnt || window.getQueen?.();
      if (queen && queen.controller && typeof queen.controller.render === 'function') {
        try {
          queen.controller.render();
          results.push({ function: 'queen.controller.render', success: true });
        } catch (error) {
          results.push({ function: 'queen.controller.render', success: false, error: error.message });
        }
      }
      
      // Call p5.js redraw
      if (typeof window.redraw === 'function') {
        try {
          window.redraw();
          window.redraw();
          window.redraw();
          results.push({ function: 'redraw (3x)', success: true });
        } catch (error) {
          results.push({ function: 'redraw', success: false, error: error.message });
        }
      }
      
      return { results };
    });
    
    console.log('   Result:', JSON.stringify(manualRender, null, 2));
    
    await sleep(500);
    await saveScreenshot(page, 'rendering/queen_debug_after_manual_render', true);
    
    // ===== DIAGNOSTIC 7: Check Drawing Context =====
    console.log('\n7️⃣  Checking p5.js drawing context...');
    
    const drawContext = await page.evaluate(() => {
      return {
        p5Loaded: typeof window.p5 !== 'undefined',
        hasCanvas: !!document.querySelector('canvas'),
        hasPush: typeof window.push === 'function',
        hasPop: typeof window.pop === 'function',
        hasFill: typeof window.fill === 'function',
        hasEllipse: typeof window.ellipse === 'function',
        hasImage: typeof window.image === 'function',
        hasTranslate: typeof window.translate === 'function',
        hasRotate: typeof window.rotate === 'function',
        canvasSize: document.querySelector('canvas') ? {
          width: document.querySelector('canvas').width,
          height: document.querySelector('canvas').height
        } : null
      };
    });
    
    console.log('   Result:', JSON.stringify(drawContext, null, 2));
    
    // ===== DIAGNOSTIC 8: Check if Queen Sprite Loads =====
    console.log('\n8️⃣  Checking queen sprite/image...');
    
    const spriteCheck = await page.evaluate(() => {
      const queen = window.queenAnt || window.getQueen?.();
      if (!queen) return { hasView: false };
      
      if (!queen.view) return { hasView: false };
      
      return {
        hasView: true,
        hasSprite: queen.view._sprite !== undefined && queen.view._sprite !== null,
        spriteType: queen.view._sprite ? typeof queen.view._sprite : null,
        hasRenderMethod: typeof queen.view.render === 'function',
        viewColor: queen.view._color || null
      };
    });
    
    console.log('   Result:', JSON.stringify(spriteCheck, null, 2));
    
    // ===== FINAL SUMMARY =====
    console.log('\n' + '='.repeat(70));
    console.log('📊 DIAGNOSTIC SUMMARY\n');
    
    const issues = [];
    const warnings = [];
    
    if (!queenExists.exists) issues.push('Queen does not exist');
    if (!inArray.found) issues.push('Queen not in ants[] array');
    if (!renderLoop.hasAntsRender && !renderLoop.hasRenderAnts) issues.push('antsRender() function missing');
    if (!accessorTest.success || !accessorTest.positionValid) issues.push('EntityAccessor cannot extract position');
    if (!cameraBounds.inView) warnings.push('Queen is outside camera viewport');
    if (!spriteCheck.hasView) warnings.push('Queen has no view component');
    
    if (issues.length > 0) {
      console.log('❌ CRITICAL ISSUES FOUND:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    if (warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      warnings.forEach(warning => console.log(`   - ${warning}`));
    }
    
    if (issues.length === 0 && warnings.length === 0) {
      console.log('✅ All rendering components appear functional!');
      console.log('   The queen should be visible. Check the screenshot.');
    }
    
    console.log('\n📸 Screenshot saved to: test/e2e/screenshots/rendering/');
    console.log('='.repeat(70));
    
    await browser.close();
    process.exit(issues.length > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('\n💥 Test Error:', error.message);
    console.error(error.stack);
    await saveScreenshot(page, 'rendering/queen_debug_error', false);
    await browser.close();
    process.exit(1);
  }
})();
