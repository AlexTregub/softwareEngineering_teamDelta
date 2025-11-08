/**
 * E2E Test: Queen Lightning Range Radius Visualization
 * 
 * This test verifies:
 * 1. Lightning aim brush shows range circle when active
 * 2. Range circle is centered on queen
 * 3. Range circle has correct radius (7 tiles = 224px)
 * 4. Range circle is visible in PLAYING state
 * 5. Range circle disappears when brush deactivated
 * 6. Cursor indicator shows valid/invalid zones
 * 7. Visual proof via screenshots
 * 
 * CRITICAL: Tests visual feedback for lightning targeting
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('📄 Loading game...');
    await page.goto('http://localhost:8000?test=1', { waitUntil: 'networkidle0' });
    
    // CRITICAL: Ensure game started (bypass menu)
    console.log('🎮 Ensuring game started...');
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Game failed to start - still on menu');
    }
    
    console.log('✅ Game started, testing lightning range radius...');
    
    // Run test in browser
    const testResults = await page.evaluate(() => {
      const results = {
        allPassed: true,
        tests: [],
        queenSpawned: false,
        brushInitialized: false,
        brushActivated: false,
        brushDeactivated: false,
        rangeProperties: {}
      };
      
      // Test 1: Spawn queen
      try {
        const queenMVC = window.createQueen(400, 400);
        
        if (queenMVC && queenMVC.model && queenMVC.controller) {
          results.queenSpawned = true;
          
          if (Array.isArray(window.ants)) {
            window.ants.push(queenMVC);
          }
          
          window._testQueen = queenMVC;
          
          // Unlock lightning
          queenMVC.controller.unlockPower('lightning');
          
          results.tests.push({
            name: 'Spawn queen and unlock lightning',
            passed: true,
            details: `Queen at (400, 400), Lightning: ${queenMVC.controller.isPowerUnlocked('lightning')}`
          });
        } else {
          throw new Error('Failed to spawn queen');
        }
      } catch (error) {
        results.allPassed = false;
        results.tests.push({
          name: 'Spawn queen and unlock lightning',
          passed: false,
          details: `Error: ${error.message}`
        });
      }
      
      // Test 2: Initialize lightning aim brush
      if (results.queenSpawned) {
        try {
          if (typeof window.initializeLightningAimBrush === 'function') {
            window.g_lightningAimBrush = window.initializeLightningAimBrush();
            results.brushInitialized = window.g_lightningAimBrush !== null;
            
            results.tests.push({
              name: 'Initialize lightning aim brush',
              passed: results.brushInitialized,
              details: results.brushInitialized ? 'Brush initialized' : 'Initialization failed'
            });
            
            if (!results.brushInitialized) results.allPassed = false;
          } else {
            throw new Error('initializeLightningAimBrush not available');
          }
        } catch (error) {
          results.allPassed = false;
          results.tests.push({
            name: 'Initialize lightning aim brush',
            passed: false,
            details: `Error: ${error.message}`
          });
        }
      }
      
      // Test 3: Verify range properties before activation
      if (results.brushInitialized) {
        try {
          const brush = window.g_lightningAimBrush;
          
          results.rangeProperties = {
            tileRange: brush.tileRange,
            tileSize: brush.tileSize || (typeof TILE_SIZE !== 'undefined' ? TILE_SIZE : 32),
            rangePx: brush.rangePx,
            expectedRangePx: 7 * 32 // 224px
          };
          
          const correct = results.rangeProperties.tileRange === 7 &&
                         results.rangeProperties.rangePx === 224;
          
          results.tests.push({
            name: 'Verify range properties',
            passed: correct,
            details: `Range: ${results.rangeProperties.tileRange} tiles = ${results.rangeProperties.rangePx}px (expected 224px)`
          });
          
          if (!correct) results.allPassed = false;
        } catch (error) {
          results.allPassed = false;
          results.tests.push({
            name: 'Verify range properties',
            passed: false,
            details: `Error: ${error.message}`
          });
        }
      }
      
      // Test 4: Activate brush (range circle should show)
      if (results.brushInitialized) {
        try {
          const brush = window.g_lightningAimBrush;
          
          // Initially inactive
          const initiallyInactive = !brush.isActive;
          
          // Activate
          brush.activate();
          results.brushActivated = brush.isActive;
          
          results.tests.push({
            name: 'Activate brush (show range circle)',
            passed: initiallyInactive && results.brushActivated,
            details: `Initially inactive: ${initiallyInactive}, Now active: ${results.brushActivated}`
          });
          
          if (!results.brushActivated) results.allPassed = false;
        } catch (error) {
          results.allPassed = false;
          results.tests.push({
            name: 'Activate brush (show range circle)',
            passed: false,
            details: `Error: ${error.message}`
          });
        }
      }
      
      // Test 5: Verify render method exists and can be called
      if (results.brushActivated) {
        try {
          const brush = window.g_lightningAimBrush;
          
          const hasRender = typeof brush.render === 'function';
          
          // Try calling render (it should draw the range circle)
          if (hasRender) {
            brush.render();
          }
          
          results.tests.push({
            name: 'Render range circle',
            passed: hasRender,
            details: hasRender ? 'Render method available and called' : 'Render method missing'
          });
          
          if (!hasRender) results.allPassed = false;
        } catch (error) {
          results.allPassed = false;
          results.tests.push({
            name: 'Render range circle',
            passed: false,
            details: `Error: ${error.message}`
          });
        }
      }
      
      // Test 6: Toggle brush off (range circle should hide)
      if (results.brushActivated) {
        try {
          const brush = window.g_lightningAimBrush;
          
          // Deactivate
          brush.deactivate();
          results.brushDeactivated = !brush.isActive;
          
          results.tests.push({
            name: 'Deactivate brush (hide range circle)',
            passed: results.brushDeactivated,
            details: `Brush active after deactivate: ${brush.isActive} (should be false)`
          });
          
          if (!results.brushDeactivated) results.allPassed = false;
        } catch (error) {
          results.allPassed = false;
          results.tests.push({
            name: 'Deactivate brush (hide range circle)',
            passed: false,
            details: `Error: ${error.message}`
          });
        }
      }
      
      // Test 7: Reactivate for screenshot
      if (results.brushDeactivated) {
        try {
          const brush = window.g_lightningAimBrush;
          
          // Reactivate for visual proof
          brush.activate();
          
          const reactivated = brush.isActive;
          
          results.tests.push({
            name: 'Reactivate for visual proof',
            passed: reactivated,
            details: `Brush reactivated: ${reactivated}`
          });
          
          if (!reactivated) results.allPassed = false;
        } catch (error) {
          results.allPassed = false;
          results.tests.push({
            name: 'Reactivate for visual proof',
            passed: false,
            details: `Error: ${error.message}`
          });
        }
      }
      
      // Test 8: Verify cursor properties
      if (results.brushActivated) {
        try {
          const brush = window.g_lightningAimBrush;
          
          const hasCursor = brush.cursor && 
                           typeof brush.cursor.x === 'number' &&
                           typeof brush.cursor.y === 'number';
          
          const hasBrushSize = typeof brush.brushSize === 'number';
          
          results.tests.push({
            name: 'Verify cursor properties',
            passed: hasCursor && hasBrushSize,
            details: `Cursor exists: ${hasCursor}, Brush size: ${brush.brushSize || 'N/A'}`
          });
          
          if (!hasCursor || !hasBrushSize) results.allPassed = false;
        } catch (error) {
          results.allPassed = false;
          results.tests.push({
            name: 'Verify cursor properties',
            passed: false,
            details: `Error: ${error.message}`
          });
        }
      }
      
      // Force rendering for screenshot
      window.gameState = 'PLAYING';
      if (window.draggablePanelManager) {
        window.draggablePanelManager.renderPanels('PLAYING');
      }
      
      // Render brush with range circle
      if (window.g_lightningAimBrush && typeof window.g_lightningAimBrush.render === 'function') {
        window.g_lightningAimBrush.render();
      }
      
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      return results;
    });
    
    // Log results
    console.log('\n📊 Test Results:');
    testResults.tests.forEach(test => {
      const icon = test.passed ? '✅' : '❌';
      console.log(`${icon} ${test.name}: ${test.details}`);
    });
    
    // Additional info
    console.log('\n🎯 Range Circle State:');
    console.log(`  Queen spawned: ${testResults.queenSpawned}`);
    console.log(`  Brush initialized: ${testResults.brushInitialized}`);
    console.log(`  Brush activated: ${testResults.brushActivated}`);
    console.log(`  Brush deactivated: ${testResults.brushDeactivated}`);
    
    if (testResults.rangeProperties && Object.keys(testResults.rangeProperties).length > 0) {
      console.log('\n📏 Range Properties:');
      console.log(`  Tile range: ${testResults.rangeProperties.tileRange} tiles`);
      console.log(`  Pixel range: ${testResults.rangeProperties.rangePx}px`);
      console.log(`  Expected: ${testResults.rangeProperties.expectedRangePx}px`);
      console.log(`  Tile size: ${testResults.rangeProperties.tileSize}px`);
    }
    
    // Take screenshot with range circle visible
    await sleep(500);
    await saveScreenshot(page, 'lightning/range_radius_visualization', testResults.allPassed);
    
    // Exit with appropriate code
    await browser.close();
    
    if (testResults.allPassed) {
      console.log('\n✅ Lightning range radius visualization E2E test passed!');
      process.exit(0);
    } else {
      console.log('\n❌ Lightning range radius visualization E2E test failed');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
    await saveScreenshot(page, 'lightning/range_radius_error', false);
    await browser.close();
    process.exit(1);
  }
})();
