/**
 * E2E Test: DraggablePanelManager.getOrCreatePanel() in Browser
 * 
 * Tests the getOrCreatePanel method works correctly in the actual game environment.
 * This validates:
 * - Creating new panels
 * - Returning existing panels
 * - Updating panels with updateIfExists flag
 * - DialogueEvent usage pattern
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
    
    console.log('✅ Game started, running getOrCreatePanel tests...');
    
    // Run tests in browser
    const testResults = await page.evaluate(() => {
      const results = {
        allPassed: true,
        tests: []
      };
      
      // Test 1: Create new panel
      try {
        const panel1 = window.draggablePanelManager.getOrCreatePanel('test-panel', {
          id: 'test-panel',
          title: 'Test Panel',
          position: { x: 100, y: 100 },
          size: { width: 300, height: 200 }
        });
        
        results.tests.push({
          name: 'Create new panel',
          passed: panel1 && panel1.config.id === 'test-panel',
          details: panel1 ? `Created panel: ${panel1.config.id}` : 'Panel creation failed'
        });
      } catch (error) {
        results.allPassed = false;
        results.tests.push({
          name: 'Create new panel',
          passed: false,
          details: `Error: ${error.message}`
        });
      }
      
      // Test 2: Get existing panel (should return same instance)
      try {
        const panel1 = window.draggablePanelManager.getPanel('test-panel');
        const panel2 = window.draggablePanelManager.getOrCreatePanel('test-panel', {
          id: 'test-panel',
          title: 'Different Title',
          position: { x: 200, y: 200 },
          size: { width: 400, height: 300 }
        });
        
        const sameInstance = panel1 === panel2;
        const titleUnchanged = panel2.config.title === 'Test Panel';
        
        results.tests.push({
          name: 'Return existing panel',
          passed: sameInstance && titleUnchanged,
          details: `Same instance: ${sameInstance}, Title unchanged: ${titleUnchanged}`
        });
        
        if (!sameInstance || !titleUnchanged) results.allPassed = false;
      } catch (error) {
        results.allPassed = false;
        results.tests.push({
          name: 'Return existing panel',
          passed: false,
          details: `Error: ${error.message}`
        });
      }
      
      // Test 3: Update existing panel with updateIfExists
      try {
        const panel1 = window.draggablePanelManager.getPanel('test-panel');
        const panel3 = window.draggablePanelManager.getOrCreatePanel('test-panel', {
          id: 'test-panel',
          title: 'Updated Title',
          position: { x: 300, y: 300 },
          size: { width: 500, height: 400 }
        }, true); // updateIfExists = true
        
        const sameInstance = panel1 === panel3;
        const titleUpdated = panel3.config.title === 'Updated Title';
        
        results.tests.push({
          name: 'Update existing panel',
          passed: sameInstance && titleUpdated,
          details: `Same instance: ${sameInstance}, Title updated: ${titleUpdated}`
        });
        
        if (!sameInstance || !titleUpdated) results.allPassed = false;
      } catch (error) {
        results.allPassed = false;
        results.tests.push({
          name: 'Update existing panel',
          passed: false,
          details: `Error: ${error.message}`
        });
      }
      
      // Test 4: DialogueEvent usage pattern
      try {
        const dialogue1 = window.draggablePanelManager.getOrCreatePanel('dialogue-display', {
          id: 'dialogue-display',
          title: 'Queen Ant',
          position: { x: 710, y: 880 },
          size: { width: 500, height: 160 }
        });
        
        const dialogue2 = window.draggablePanelManager.getOrCreatePanel('dialogue-display', {
          id: 'dialogue-display',
          title: 'Worker Ant',
          position: { x: 710, y: 880 },
          size: { width: 500, height: 160 }
        }, true);
        
        const sameInstance = dialogue1 === dialogue2;
        const titleUpdated = dialogue2.config.title === 'Worker Ant';
        
        results.tests.push({
          name: 'DialogueEvent pattern (panel reuse)',
          passed: sameInstance && titleUpdated,
          details: `Panel reused: ${sameInstance}, Speaker updated: ${titleUpdated}`
        });
        
        if (!sameInstance || !titleUpdated) results.allPassed = false;
        
        // Make dialogue panel visible for screenshot
        dialogue2.state.visible = true;
      } catch (error) {
        results.allPassed = false;
        results.tests.push({
          name: 'DialogueEvent pattern (panel reuse)',
          passed: false,
          details: `Error: ${error.message}`
        });
      }
      
      // Force rendering
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
    
    // Take screenshot
    await sleep(500);
    await saveScreenshot(page, 'ui/getOrCreatePanel_in_game', testResults.allPassed);
    
    // Exit with appropriate code
    await browser.close();
    
    if (testResults.allPassed) {
      console.log('\n✅ All getOrCreatePanel browser tests passed!');
      process.exit(0);
    } else {
      console.log('\n❌ Some getOrCreatePanel browser tests failed');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
    await saveScreenshot(page, 'ui/getOrCreatePanel_in_game_error', false);
    await browser.close();
    process.exit(1);
  }
})();
