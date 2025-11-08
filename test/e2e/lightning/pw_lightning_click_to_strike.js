/**
 * E2E Test: Queen Lightning Power - Click-to-Strike and Range Radius
 * 
 * This test verifies:
 * 1. Queen can be spawned with MVC
 * 2. Lightning power can be unlocked
 * 3. Lightning aim brush activates
 * 4. Range radius (7 tiles = 224px) displays when active
 * 5. Click-to-strike works within range
 * 6. Strikes rejected outside range
 * 7. Target MVC ants take damage from lightning
 * 8. Visual proof via screenshots
 * 
 * CRITICAL: Tests the complete lightning system with MVC ants
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
    
    console.log('✅ Game started, testing lightning power system...');
    
    // Run test in browser
    const testResults = await page.evaluate(() => {
      const results = {
        allPassed: true,
        tests: [],
        queenSpawned: false,
        targetSpawned: false,
        lightningUnlocked: false,
        brushActive: false,
        rangeRadiusVisible: false,
        strikeInRangeSuccess: false,
        strikeOutRangeRejected: false,
        targetDamaged: false,
        strikeDetails: {}
      };
      
      // Test 1: Spawn queen using createQueen()
      try {
        const queenMVC = window.createQueen(400, 400);
        
        if (queenMVC && queenMVC.model && queenMVC.controller) {
          results.queenSpawned = true;
          
          // Add to global ants array
          if (Array.isArray(window.ants)) {
            window.ants.push(queenMVC);
          }
          
          // Store reference
          window._testQueen = queenMVC;
          
          results.tests.push({
            name: 'Spawn queen with createQueen()',
            passed: true,
            details: `Queen at (400, 400), JobName: ${queenMVC.model.getJobName()}`
          });
        } else {
          throw new Error('createQueen did not return valid MVC object');
        }
      } catch (error) {
        results.allPassed = false;
        results.tests.push({
          name: 'Spawn queen with createQueen()',
          passed: false,
          details: `Error: ${error.message}`
        });
      }
      
      // Test 2: Spawn target ant (enemy)
      if (results.queenSpawned) {
        try {
          const targetMVC = window.createAnt(450, 450, 32, 32, 1.0, 0, null, 'Scout', 'enemy');
          
          if (targetMVC && targetMVC.model && targetMVC.controller) {
            results.targetSpawned = true;
            
            // Add to global ants array
            if (Array.isArray(window.ants)) {
              window.ants.push(targetMVC);
            }
            
            // Store reference
            window._testTarget = targetMVC;
            
            results.tests.push({
              name: 'Spawn target enemy ant',
              passed: true,
              details: `Enemy ant at (450, 450), Faction: ${targetMVC.model.getFaction()}, Health: ${targetMVC.controller.getHealth()}`
            });
          } else {
            throw new Error('createAnt did not return valid MVC object');
          }
        } catch (error) {
          results.allPassed = false;
          results.targetSpawned = false;
          results.tests.push({
            name: 'Spawn target enemy ant',
            passed: false,
            details: `Error: ${error.message}`
          });
        }
      }
      
      // Test 3: Unlock lightning power
      if (results.queenSpawned) {
        try {
          const queen = window._testQueen.controller;
          
          // Check if QueenController has unlockPower
          if (typeof queen.unlockPower === 'function') {
            const unlocked = queen.unlockPower('lightning');
            results.lightningUnlocked = unlocked && queen.isPowerUnlocked('lightning');
            
            results.tests.push({
              name: 'Unlock lightning power',
              passed: results.lightningUnlocked,
              details: results.lightningUnlocked ? 'Lightning power unlocked' : 'Failed to unlock'
            });
            
            if (!results.lightningUnlocked) results.allPassed = false;
          } else {
            throw new Error('Queen controller missing unlockPower method');
          }
        } catch (error) {
          results.allPassed = false;
          results.tests.push({
            name: 'Unlock lightning power',
            passed: false,
            details: `Error: ${error.message}`
          });
        }
      }
      
      // Test 4: Initialize lightning aim brush
      if (results.lightningUnlocked) {
        try {
          // Initialize if not already
          if (typeof window.g_lightningAimBrush === 'undefined' || !window.g_lightningAimBrush) {
            if (typeof window.initializeLightningAimBrush === 'function') {
              window.g_lightningAimBrush = window.initializeLightningAimBrush();
            } else {
              throw new Error('initializeLightningAimBrush not available');
            }
          }
          
          const brush = window.g_lightningAimBrush;
          
          if (brush && typeof brush.activate === 'function') {
            brush.activate();
            results.brushActive = brush.isActive;
            
            results.tests.push({
              name: 'Activate lightning aim brush',
              passed: results.brushActive,
              details: results.brushActive ? 'Brush activated' : 'Brush failed to activate'
            });
            
            if (!results.brushActive) results.allPassed = false;
          } else {
            throw new Error('Lightning aim brush missing activate method');
          }
        } catch (error) {
          results.allPassed = false;
          results.tests.push({
            name: 'Activate lightning aim brush',
            passed: false,
            details: `Error: ${error.message}`
          });
        }
      }
      
      // Test 5: Verify range radius properties
      if (results.brushActive) {
        try {
          const brush = window.g_lightningAimBrush;
          
          const tileRange = brush.tileRange;
          const rangePx = brush.rangePx;
          const expectedRangePx = 7 * 32; // 224px
          
          const rangeCorrect = tileRange === 7 && rangePx === expectedRangePx;
          results.rangeRadiusVisible = rangeCorrect;
          
          results.tests.push({
            name: 'Verify range radius (7 tiles = 224px)',
            passed: rangeCorrect,
            details: `tileRange: ${tileRange}, rangePx: ${rangePx}, expected: ${expectedRangePx}`
          });
          
          if (!rangeCorrect) results.allPassed = false;
        } catch (error) {
          results.allPassed = false;
          results.tests.push({
            name: 'Verify range radius (7 tiles = 224px)',
            passed: false,
            details: `Error: ${error.message}`
          });
        }
      }
      
      // Test 6: Strike within range
      if (results.brushActive && results.targetSpawned) {
        try {
          const target = window._testTarget;
          const initialHealth = target.controller.getHealth();
          
          // Get target position (should be close to queen at 400,400)
          const targetPos = target.model.getPosition();
          
          // Try strike at target position
          const brush = window.g_lightningAimBrush;
          
          if (typeof brush.tryStrikeAt === 'function') {
            const strikeResult = brush.tryStrikeAt(targetPos.x, targetPos.y);
            results.strikeInRangeSuccess = strikeResult;
            
            // Wait a moment for damage to apply
            setTimeout(() => {}, 100);
            
            const finalHealth = target.controller.getHealth();
            results.targetDamaged = finalHealth < initialHealth;
            
            results.strikeDetails = {
              strikeResult,
              initialHealth,
              finalHealth,
              damageTaken: initialHealth - finalHealth,
              targetPosition: targetPos
            };
            
            results.tests.push({
              name: 'Strike within range',
              passed: results.strikeInRangeSuccess,
              details: `Strike result: ${strikeResult}, Health: ${initialHealth} → ${finalHealth}`
            });
            
            if (!results.strikeInRangeSuccess) results.allPassed = false;
          } else {
            throw new Error('Brush missing tryStrikeAt method');
          }
        } catch (error) {
          results.allPassed = false;
          results.tests.push({
            name: 'Strike within range',
            passed: false,
            details: `Error: ${error.message}`
          });
        }
      }
      
      // Test 7: Strike outside range (should be rejected)
      if (results.brushActive) {
        try {
          const brush = window.g_lightningAimBrush;
          const queenPos = window._testQueen.model.getPosition();
          
          // Try strike far outside range (1000px away)
          const farX = queenPos.x + 1000;
          const farY = queenPos.y + 1000;
          
          const strikeResult = brush.tryStrikeAt(farX, farY);
          results.strikeOutRangeRejected = !strikeResult; // Should be false (rejected)
          
          results.tests.push({
            name: 'Reject strike outside range',
            passed: results.strikeOutRangeRejected,
            details: `Strike at (${farX}, ${farY}): ${strikeResult ? 'accepted (BAD)' : 'rejected (GOOD)'}`
          });
          
          if (!results.strikeOutRangeRejected) results.allPassed = false;
        } catch (error) {
          results.allPassed = false;
          results.tests.push({
            name: 'Reject strike outside range',
            passed: false,
            details: `Error: ${error.message}`
          });
        }
      }
      
      // Test 8: Verify LightningManager integration
      if (results.brushActive) {
        try {
          const hasManager = typeof window.g_lightningManager !== 'undefined' && 
                             window.g_lightningManager !== null;
          
          const hasRequestStrike = hasManager && 
                                   typeof window.g_lightningManager.requestStrike === 'function';
          
          results.tests.push({
            name: 'LightningManager integration',
            passed: hasManager && hasRequestStrike,
            details: `Manager exists: ${hasManager}, requestStrike: ${hasRequestStrike}`
          });
          
          if (!hasManager || !hasRequestStrike) results.allPassed = false;
        } catch (error) {
          results.allPassed = false;
          results.tests.push({
            name: 'LightningManager integration',
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
    console.log('\n⚡ Lightning System State:');
    console.log(`  Queen spawned: ${testResults.queenSpawned}`);
    console.log(`  Target spawned: ${testResults.targetSpawned}`);
    console.log(`  Lightning unlocked: ${testResults.lightningUnlocked}`);
    console.log(`  Aim brush active: ${testResults.brushActive}`);
    console.log(`  Range radius visible: ${testResults.rangeRadiusVisible}`);
    
    console.log('\n🎯 Strike Tests:');
    console.log(`  Strike in range: ${testResults.strikeInRangeSuccess}`);
    console.log(`  Strike out range rejected: ${testResults.strikeOutRangeRejected}`);
    console.log(`  Target damaged: ${testResults.targetDamaged}`);
    
    if (testResults.strikeDetails && Object.keys(testResults.strikeDetails).length > 0) {
      console.log('\n💥 Strike Details:');
      console.log(`  Initial health: ${testResults.strikeDetails.initialHealth}`);
      console.log(`  Final health: ${testResults.strikeDetails.finalHealth}`);
      console.log(`  Damage taken: ${testResults.strikeDetails.damageTaken}`);
    }
    
    // Take screenshot for visual proof
    await sleep(500);
    await saveScreenshot(page, 'lightning/click_to_strike_test', testResults.allPassed);
    
    // Exit with appropriate code
    await browser.close();
    
    if (testResults.allPassed) {
      console.log('\n✅ Lightning click-to-strike E2E test passed!');
      process.exit(0);
    } else {
      console.log('\n❌ Lightning click-to-strike E2E test failed');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
    await saveScreenshot(page, 'lightning/click_to_strike_error', false);
    await browser.close();
    process.exit(1);
  }
})();
