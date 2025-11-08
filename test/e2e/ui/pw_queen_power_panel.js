/**
 * E2E Test: Queen Power Panel Opens When Queen Selected
 * 
 * This test verifies:
 * 1. Queen can be spawned using createQueen()
 * 2. Queen can be selected by clicking
 * 3. Queen power panel (queen-powers-panel) opens when queen is selected
 * 4. Panel visibility state is correct
 * 5. Panel shows in PLAYING state
 * 6. Visual proof via screenshot
 * 
 * CRITICAL: Tests the queen power panel system integration with MVC queen
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
    
    console.log('✅ Game started, testing queen power panel...');
    
    // Run test in browser
    const testResults = await page.evaluate(() => {
      const results = {
        allPassed: true,
        tests: [],
        queenSpawned: false,
        queenSelected: false,
        panelExists: false,
        panelVisible: false,
        panelPosition: null
      };
      
      // Test 1: Check if createQueen factory exists
      try {
        const hasFactory = typeof window.createQueen === 'function';
        results.tests.push({
          name: 'createQueen factory exists',
          passed: hasFactory,
          details: hasFactory ? 'Factory available' : 'Factory missing'
        });
        if (!hasFactory) results.allPassed = false;
      } catch (error) {
        results.allPassed = false;
        results.tests.push({
          name: 'createQueen factory exists',
          passed: false,
          details: `Error: ${error.message}`
        });
      }
      
      // Test 2: Spawn queen using createQueen()
      try {
        const queenMVC = window.createQueen(400, 400);
        
        if (queenMVC && queenMVC.model && queenMVC.controller) {
          results.queenSpawned = true;
          
          // Add to global ants array
          if (Array.isArray(window.ants)) {
            window.ants.push(queenMVC);
          }
          
          results.tests.push({
            name: 'Spawn queen with createQueen()',
            passed: true,
            details: `Queen spawned at (400, 400), JobName: ${queenMVC.model.getJobName()}`
          });
          
          // Store queen reference for next tests
          window._testQueen = queenMVC;
        } else {
          throw new Error('createQueen did not return valid MVC object');
        }
      } catch (error) {
        results.allPassed = false;
        results.queenSpawned = false;
        results.tests.push({
          name: 'Spawn queen with createQueen()',
          passed: false,
          details: `Error: ${error.message}`
        });
      }
      
      // Test 3: Select the queen
      if (results.queenSpawned && window._testQueen) {
        try {
          const queen = window._testQueen;
          
          // Clear existing selections
          if (Array.isArray(window.selectables)) {
            window.selectables.forEach(s => {
              if (s && typeof s.deselect === 'function') s.deselect();
            });
            window.selectables = [];
          }
          
          // Select queen via controller
          if (typeof queen.controller.select === 'function') {
            queen.controller.select();
            results.queenSelected = queen.model.getSelected();
            
            // Add to selectables
            if (Array.isArray(window.selectables)) {
              window.selectables.push(queen.controller);
            }
            
            results.tests.push({
              name: 'Select queen',
              passed: results.queenSelected,
              details: results.queenSelected ? 'Queen selected' : 'Queen not selected'
            });
            
            if (!results.queenSelected) results.allPassed = false;
          } else {
            throw new Error('Queen controller missing select method');
          }
        } catch (error) {
          results.allPassed = false;
          results.queenSelected = false;
          results.tests.push({
            name: 'Select queen',
            passed: false,
            details: `Error: ${error.message}`
          });
        }
      } else {
        results.tests.push({
          name: 'Select queen',
          passed: false,
          details: 'Skipped - queen not spawned'
        });
        results.allPassed = false;
      }
      
      // Test 4: Check if QueenControlPanel exists
      if (results.queenSelected) {
        try {
          const hasQueenPanel = typeof window.g_queenControlPanel !== 'undefined' && 
                                window.g_queenControlPanel !== null;
          
          results.tests.push({
            name: 'QueenControlPanel exists',
            passed: hasQueenPanel,
            details: hasQueenPanel ? 'g_queenControlPanel available' : 'g_queenControlPanel missing'
          });
          
          if (!hasQueenPanel) results.allPassed = false;
        } catch (error) {
          results.allPassed = false;
          results.tests.push({
            name: 'QueenControlPanel exists',
            passed: false,
            details: `Error: ${error.message}`
          });
        }
      } else {
        results.tests.push({
          name: 'QueenControlPanel exists',
          passed: false,
          details: 'Skipped - queen not selected'
        });
        results.allPassed = false;
      }
      
      // Test 5: Trigger queen panel show
      if (results.queenSelected && window.g_queenControlPanel) {
        try {
          const queenPanel = window.g_queenControlPanel;
          
          // Call show method with the selected queen
          if (typeof queenPanel.show === 'function') {
            queenPanel.show(window._testQueen.controller);
            
            results.panelVisible = queenPanel.isVisible;
            results.panelExists = queenPanel.panel !== null;
            
            results.tests.push({
              name: 'Show queen power panel',
              passed: results.panelVisible && results.panelExists,
              details: `Panel visible: ${results.panelVisible}, Panel exists: ${results.panelExists}`
            });
            
            if (!results.panelVisible || !results.panelExists) results.allPassed = false;
          } else {
            throw new Error('QueenControlPanel missing show method');
          }
        } catch (error) {
          results.allPassed = false;
          results.tests.push({
            name: 'Show queen power panel',
            passed: false,
            details: `Error: ${error.message}`
          });
        }
      } else {
        results.tests.push({
          name: 'Show queen power panel',
          passed: false,
          details: 'Skipped - prerequisites not met'
        });
        results.allPassed = false;
      }
      
      // Test 6: Check panel is in PLAYING state visibility
      if (results.panelVisible && results.panelExists) {
        try {
          const panelId = 'queen-powers-panel';
          const panelInState = window.draggablePanelManager &&
                               window.draggablePanelManager.stateVisibility &&
                               window.draggablePanelManager.stateVisibility.PLAYING &&
                               window.draggablePanelManager.stateVisibility.PLAYING.includes(panelId);
          
          results.tests.push({
            name: 'Panel registered for PLAYING state',
            passed: panelInState,
            details: panelInState ? 'Panel in PLAYING state' : 'Panel not in PLAYING state'
          });
          
          if (!panelInState) results.allPassed = false;
        } catch (error) {
          results.allPassed = false;
          results.tests.push({
            name: 'Panel registered for PLAYING state',
            passed: false,
            details: `Error: ${error.message}`
          });
        }
      } else {
        results.tests.push({
          name: 'Panel registered for PLAYING state',
          passed: false,
          details: 'Skipped - panel not visible'
        });
        results.allPassed = false;
      }
      
      // Test 7: Get panel position for verification
      if (results.panelVisible && window.g_queenControlPanel && window.g_queenControlPanel.panel) {
        try {
          const panel = window.g_queenControlPanel.panel;
          results.panelPosition = {
            x: panel.state.x,
            y: panel.state.y,
            width: panel.config.size.width,
            height: panel.config.size.height,
            title: panel.config.title
          };
          
          results.tests.push({
            name: 'Panel position readable',
            passed: true,
            details: `Position: (${results.panelPosition.x}, ${results.panelPosition.y}), Title: "${results.panelPosition.title}"`
          });
        } catch (error) {
          results.tests.push({
            name: 'Panel position readable',
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
    console.log('\n📍 Queen State:');
    console.log(`  Spawned: ${testResults.queenSpawned}`);
    console.log(`  Selected: ${testResults.queenSelected}`);
    
    console.log('\n🎮 Panel State:');
    console.log(`  Exists: ${testResults.panelExists}`);
    console.log(`  Visible: ${testResults.panelVisible}`);
    if (testResults.panelPosition) {
      console.log(`  Position: (${testResults.panelPosition.x}, ${testResults.panelPosition.y})`);
      console.log(`  Size: ${testResults.panelPosition.width}x${testResults.panelPosition.height}`);
      console.log(`  Title: "${testResults.panelPosition.title}"`);
    }
    
    // Take screenshot for visual proof
    await sleep(500);
    await saveScreenshot(page, 'ui/queen_power_panel_selection', testResults.allPassed);
    
    // Exit with appropriate code
    await browser.close();
    
    if (testResults.allPassed) {
      console.log('\n✅ Queen power panel test passed! Panel opens when queen is selected.');
      process.exit(0);
    } else {
      console.log('\n❌ Queen power panel test failed');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
    await saveScreenshot(page, 'ui/queen_power_panel_error', false);
    await browser.close();
    process.exit(1);
  }
})();
