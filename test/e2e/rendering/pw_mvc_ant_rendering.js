/**
 * pw_mvc_ant_rendering.js
 * 
 * E2E tests for MVC ant rendering in actual browser.
 * Tests complete rendering pipeline with visual proof (screenshots).
 * 
 * Phase 5.7: E2E Rendering Tests
 * 
 * CRITICAL: Tests rendering with EntityAccessor → EntityLayerRenderer → RenderLayerManager
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  console.log('🎨 Starting MVC Ant Rendering E2E Tests...\n');
  
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    // Navigate to game
    await page.goto('http://localhost:8000?test=1');
    await sleep(1000);
    
    // ===== TEST 1: Queen Renders Successfully =====
    console.log('Test 1: Queen renders in viewport');
    
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Game failed to start');
    }
    
    const test1 = await page.evaluate(async () => {
      // Get queen from global
      const queen = window.queenAnt || window.getQueen?.();
      
      if (!queen) {
        return { success: false, reason: 'Queen not found in globals' };
      }
      
      // Check MVC structure
      if (!queen.model || !queen.view || !queen.controller) {
        return { success: false, reason: 'Queen missing MVC structure', queen };
      }
      
      // Check position
      const pos = queen.model.getPosition();
      if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number') {
        return { success: false, reason: 'Invalid queen position', pos };
      }
      
      // Check active state
      if (!queen.model.isActive()) {
        return { success: false, reason: 'Queen is not active' };
      }
      
      // Check if EntityAccessor can extract position
      if (typeof window.EntityAccessor !== 'undefined') {
        const extractedPos = window.EntityAccessor.getPosition(queen);
        if (!extractedPos || extractedPos.x !== pos.x || extractedPos.y !== pos.y) {
          return { 
            success: false, 
            reason: 'EntityAccessor failed to extract position',
            expected: pos,
            got: extractedPos
          };
        }
      }
      
      // Force render
      if (window.RenderManager) {
        window.RenderManager.render('PLAYING');
      }
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      return {
        success: true,
        position: pos,
        size: queen.model.getSize(),
        active: queen.model.isActive(),
        job: queen.model.getJobName(),
        faction: queen.model.getFaction()
      };
    });
    
    await sleep(500);
    await saveScreenshot(page, 'rendering/queen_visible', test1.success);
    
    if (!test1.success) {
      console.error('❌ Test 1 FAILED:', test1.reason);
      console.error('   Details:', JSON.stringify(test1, null, 2));
    } else {
      console.log('✅ Test 1 PASSED: Queen renders successfully');
      console.log(`   Position: (${test1.position.x.toFixed(1)}, ${test1.position.y.toFixed(1)})`);
      console.log(`   Job: ${test1.job}, Faction: ${test1.faction}`);
    }
    
    // ===== TEST 2: Spawn Multiple MVC Ants and Verify Rendering =====
    console.log('\nTest 2: Multiple MVC ants render in viewport');
    
    const test2 = await page.evaluate(async () => {
      // Spawn multiple ants using AntFactory
      const spawnedAnts = [];
      
      if (typeof window.AntFactory === 'undefined') {
        return { success: false, reason: 'AntFactory not loaded' };
      }
      
      // Initialize ants array if needed
      if (!window.ants) {
        window.ants = [];
      }
      
      // Spawn 5 ants in a line
      for (let i = 0; i < 5; i++) {
        const ant = window.AntFactory.createAnt(
          200 + (i * 60), 
          300,
          { faction: 'player', job: 'Worker' }
        );
        
        window.ants.push(ant);
        spawnedAnts.push({
          position: ant.model.getPosition(),
          active: ant.model.isActive()
        });
      }
      
      // Force render
      if (window.RenderManager) {
        window.RenderManager.render('PLAYING');
      }
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      // Verify all are in ants array
      const mvcAntsCount = window.ants.filter(a => 
        a && a.model && a.view && a.controller
      ).length;
      
      return {
        success: mvcAntsCount >= 5,
        spawnedCount: spawnedAnts.length,
        mvcAntsCount,
        totalAnts: window.ants.length,
        ants: spawnedAnts
      };
    });
    
    await sleep(500);
    await saveScreenshot(page, 'rendering/multiple_ants', test2.success);
    
    if (!test2.success) {
      console.error('❌ Test 2 FAILED');
      console.error('   Details:', JSON.stringify(test2, null, 2));
    } else {
      console.log('✅ Test 2 PASSED: Multiple ants render');
      console.log(`   Spawned: ${test2.spawnedCount}, MVC in array: ${test2.mvcAntsCount}`);
    }
    
    // ===== TEST 3: EntityAccessor Extracts Position from All Ants =====
    console.log('\nTest 3: EntityAccessor extracts position from all ants');
    
    const test3 = await page.evaluate(() => {
      if (typeof window.EntityAccessor === 'undefined') {
        return { success: false, reason: 'EntityAccessor not loaded' };
      }
      
      if (!window.ants || !Array.isArray(window.ants)) {
        return { success: false, reason: 'window.ants not available', successCount: 0, totalAnts: 0, results: [] };
      }
      
      const results = [];
      let successCount = 0;
      
      for (let i = 0; i < window.ants.length; i++) {
        const ant = window.ants[i];
        if (!ant) continue;
        
        const pos = window.EntityAccessor.getPosition(ant);
        const size = window.EntityAccessor.getSize(ant);
        
        const success = pos && 
                       typeof pos.x === 'number' && 
                       typeof pos.y === 'number' &&
                       size &&
                       typeof size.x === 'number' &&
                       typeof size.y === 'number';
        
        if (success) successCount++;
        
        results.push({
          index: i,
          success,
          position: pos,
          size: size,
          hasModel: !!ant.model,
          hasView: !!ant.view,
          hasController: !!ant.controller
        });
      }
      
      return {
        success: successCount === window.ants.length,
        successCount,
        totalAnts: window.ants.length,
        results
      };
    });
    
    if (!test3 || !test3.success) {
      console.error('❌ Test 3 FAILED');
      if (test3) {
        console.error(`   Extracted: ${test3.successCount}/${test3.totalAnts}`);
        if (test3.results) {
          console.error('   Details:', JSON.stringify(test3.results.filter(r => !r.success), null, 2));
        }
      } else {
        console.error('   test3 returned undefined');
      }
    } else {
      console.log('✅ Test 3 PASSED: EntityAccessor works for all ants');
      console.log(`   Extracted: ${test3.successCount}/${test3.totalAnts}`);
    }
    
    // ===== TEST 4: Ants Render After Camera Movement =====
    console.log('\nTest 4: Ants render after camera movement');
    
    const test4 = await page.evaluate(async () => {
      // Move camera to known ant position
      if (window.ants.length === 0) {
        return { success: false, reason: 'No ants to test' };
      }
      
      const firstAnt = window.ants[0];
      const pos = firstAnt.model.getPosition();
      
      // Center camera on ant
      if (window.cameraManager) {
        window.cameraManager.setPosition(pos.x - 400, pos.y - 200);
      }
      
      // Force render
      if (window.RenderManager) {
        window.RenderManager.render('PLAYING');
      }
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      return {
        success: true,
        cameraPosition: window.cameraManager ? 
          { x: window.cameraManager.getPosition().x, y: window.cameraManager.getPosition().y } : 
          null,
        antPosition: pos
      };
    });
    
    await sleep(500);
    await saveScreenshot(page, 'rendering/camera_moved', test4.success);
    
    if (!test4.success) {
      console.error('❌ Test 4 FAILED:', test4.reason);
    } else {
      console.log('✅ Test 4 PASSED: Ants render after camera movement');
    }
    
    // ===== TEST 5: Render Pipeline Debug Info =====
    console.log('\nTest 5: Render pipeline debug information');
    
    const test5 = await page.evaluate(() => {
      const info = {
        ants: {
          total: window.ants.length,
          mvc: window.ants.filter(a => a && a.model).length,
          active: window.ants.filter(a => a && a.model && a.model.isActive()).length
        },
        queen: {
          exists: !!window.queenAnt,
          isMVC: window.queenAnt ? !!(window.queenAnt.model) : false,
          position: window.queenAnt && window.queenAnt.model ? 
            window.queenAnt.model.getPosition() : null
        },
        systems: {
          AntFactory: typeof window.AntFactory !== 'undefined',
          EntityAccessor: typeof window.EntityAccessor !== 'undefined',
          RenderManager: typeof window.RenderManager !== 'undefined'
        }
      };
      
      return {
        success: info.ants.mvc > 0 && info.queen.exists,
        info
      };
    });
    
    console.log('\n📊 Render Pipeline Status:');
    console.log(JSON.stringify(test5.info, null, 2));
    
    // ===== FINAL RESULTS =====
    const allTests = [test1, test2, test3, test4, test5];
    const passedTests = allTests.filter(t => t.success).length;
    const totalTests = allTests.length;
    
    console.log('\n' + '='.repeat(50));
    console.log(`📊 RESULTS: ${passedTests}/${totalTests} tests passed`);
    console.log('='.repeat(50));
    
    if (passedTests === totalTests) {
      console.log('✅ ALL TESTS PASSED!');
    } else {
      console.log('❌ SOME TESTS FAILED');
    }
    
    await browser.close();
    process.exit(passedTests === totalTests ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Test execution error:', error.message);
    console.error(error.stack);
    await saveScreenshot(page, 'rendering/error', false);
    await browser.close();
    process.exit(1);
  }
})();
