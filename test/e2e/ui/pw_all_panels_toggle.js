/**
 * E2E Test: View Menu Panel Toggle (All Panels - PLAYING + LEVEL_EDITOR)
 * 
 * Purpose: Visual proof that View menu panel toggles work correctly
 * Tests ALL draggable panels in both PLAYING and LEVEL_EDITOR states
 * 
 * Before Fix: Panels flash and disappear (stateVisibility not synchronized)
 * After Fix: Panels stay visible (stateVisibility synchronized with visibility flag)
 * 
 * PLAYING state panels: 7 panels
 * LEVEL_EDITOR state panels: 6 panels  
 * Total screenshots: 26 (13 panels × 2 states: on/off)
 * 
 * @author Software Engineering Team Delta
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  let browser;
  let allTestsPassed = true;
  const results = [];

  try {
    console.log('\n🎬 Starting E2E test: View menu panel toggle (ALL panels)');
    console.log('📊 Testing 6 PLAYING panels + 6 LEVEL_EDITOR panels = 12 total panels');
    console.log('📸 Expecting 12 screenshots (toggle test for each panel)\n');

    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.goto('http://localhost:8000?test=1');
    
    // ========================================
    // PART 1: PLAYING State Panels
    // ========================================
    console.log('\n📋 PART 1: Testing PLAYING State Panels (6 panels)');
    
    // Start game
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Game failed to start - still on main menu');
    }
    await sleep(1000);
    
    // Force PLAYING state
    await page.evaluate(() => {
      window.gameState = 'PLAYING';
      if (window.GameState) window.GameState.current = 'PLAYING';
    });
    
    const playingPanels = [
      { id: 'ant_spawn', name: 'Ant Spawn', defaultVisible: true },
      { id: 'health_controls', name: 'Health Controls', defaultVisible: true },
      { id: 'tasks', name: 'Tasks', defaultVisible: true },
      { id: 'buildings', name: 'Buildings', defaultVisible: true },
      { id: 'resources', name: 'Resources', defaultVisible: true },
      { id: 'cheats', name: 'Cheats', defaultVisible: true }
    ];
    
    for (const panel of playingPanels) {
      console.log(`\n  🔍 Testing PLAYING panel: ${panel.name} (${panel.id})`);
      
      // Test 2 toggles in sequence (OFF→ON or ON→OFF→ON depending on start state)
      const toggleTest = await page.evaluate((panelId) => {
        if (!window.draggablePanelManager) {
          return { success: false, error: 'DraggablePanelManager not found' };
        }
        
        const manager = window.draggablePanelManager;
        const panelObj = manager.panels.get(panelId);
        
        if (!panelObj) {
          return { success: false, error: `Panel ${panelId} not found` };
        }
        
        // Get initial state
        const initialVisible = panelObj.state ? panelObj.state.visible : panelObj.visible;
        const initialInState = manager.stateVisibility.PLAYING && 
                              manager.stateVisibility.PLAYING.includes(panelId);
        
        // Toggle 1
        const result1 = manager.togglePanel(panelId);
        const visible1 = panelObj.state ? panelObj.state.visible : panelObj.visible;
        const inState1 = manager.stateVisibility.PLAYING && 
                        manager.stateVisibility.PLAYING.includes(panelId);
        
        if (typeof window.redraw === 'function') {
          window.redraw(); window.redraw(); window.redraw();
        }
        
        // Toggle 2 (back to original)
        const result2 = manager.togglePanel(panelId);
        const visible2 = panelObj.state ? panelObj.state.visible : panelObj.visible;
        const inState2 = manager.stateVisibility.PLAYING && 
                        manager.stateVisibility.PLAYING.includes(panelId);
        
        if (typeof window.redraw === 'function') {
          window.redraw(); window.redraw(); window.redraw();
        }
        
        // Verify toggle worked both ways and state synchronized
        const toggle1Correct = (visible1 === result1) && (visible1 === inState1);
        const toggle2Correct = (visible2 === result2) && (visible2 === inState2);
        const returnedToOriginal = (visible2 === initialVisible) && (inState2 === initialInState);
        
        return {
          success: toggle1Correct && toggle2Correct && returnedToOriginal,
          initial: { visible: initialVisible, inState: initialInState },
          after1: { visible: visible1, inState: inState1, result: result1 },
          after2: { visible: visible2, inState: inState2, result: result2 }
        };
      }, panel.id);
      
      await sleep(300);
      
      if (toggleTest.success) {
        console.log(`    ✅ Toggle test passed`);
        console.log(`       Initial: Visible=${toggleTest.initial.visible}, InState=${toggleTest.initial.inState}`);
        console.log(`       After 1: Visible=${toggleTest.after1.visible}, InState=${toggleTest.after1.inState}`);
        console.log(`       After 2: Visible=${toggleTest.after2.visible}, InState=${toggleTest.after2.inState}`);
        await saveScreenshot(page, `panel_toggle/${panel.id}_PLAYING`, true);
      } else {
        console.log(`    ❌ Toggle test FAILED: ${toggleTest.error || JSON.stringify(toggleTest)}`);
        await saveScreenshot(page, `panel_toggle/${panel.id}_PLAYING`, false);
        allTestsPassed = false;
      }
      
      results.push({ panel: `${panel.name} (PLAYING)`, state: 'Toggle Test', passed: toggleTest.success });
    }
    
    // ========================================
    // PART 2: LEVEL_EDITOR State Panels
    // ========================================
    console.log('\n\n📋 PART 2: Testing LEVEL_EDITOR State Panels (6 panels)');
    
    // Initialize Level Editor
    console.log('  ℹ️  Initializing Level Editor...');
    const editorInit = await page.evaluate(() => {
      try {
        // Initialize Level Editor if not already done
        if (typeof LevelEditor !== 'undefined' && !window.levelEditor) {
          window.levelEditor = new LevelEditor(800, 600);
        }
        
        // Switch to LEVEL_EDITOR state
        window.gameState = 'LEVEL_EDITOR';
        if (window.GameState) window.GameState.current = 'LEVEL_EDITOR';
        
        // Force render for state change
        if (typeof window.redraw === 'function') {
          window.redraw();
          window.redraw();
          window.redraw();
        }
        
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    if (!editorInit.success) {
      console.log(`  ⚠️  Failed to initialize Level Editor: ${editorInit.error}`);
      console.log('  ⚠️  Skipping LEVEL_EDITOR panels');
    } else {
      console.log('  ✅ Level Editor initialized');
    }
    
    await sleep(1000);
    
    const editorPanels = [
      { id: 'level-editor-materials', name: 'Materials Panel', defaultVisible: true },
      { id: 'level-editor-tools', name: 'Tools Panel', defaultVisible: true },
      { id: 'level-editor-brush', name: 'Brush Panel', defaultVisible: false },
      { id: 'level-editor-events', name: 'Events Panel', defaultVisible: false },
      { id: 'level-editor-properties', name: 'Properties Panel', defaultVisible: false },
      { id: 'level-editor-sidebar', name: 'Sidebar', defaultVisible: false }
    ];
    
    for (const panel of editorPanels) {
      console.log(`\n  🔍 Testing LEVEL_EDITOR panel: ${panel.name} (${panel.id})`);
      
      // Test 2 toggles in sequence  
      const toggleTest = await page.evaluate((panelId) => {
        if (!window.draggablePanelManager) {
          return { success: false, error: 'DraggablePanelManager not found' };
        }
        
        const manager = window.draggablePanelManager;
        const panelObj = manager.panels.get(panelId);
        
        if (!panelObj) {
          return { success: false, error: `Panel ${panelId} not found` };
        }
        
        // Get initial state
        const initialVisible = panelObj.state ? panelObj.state.visible : panelObj.visible;
        const initialInState = manager.stateVisibility.LEVEL_EDITOR && 
                              manager.stateVisibility.LEVEL_EDITOR.includes(panelId);
        
        // Toggle 1
        const result1 = manager.togglePanel(panelId);
        const visible1 = panelObj.state ? panelObj.state.visible : panelObj.visible;
        const inState1 = manager.stateVisibility.LEVEL_EDITOR && 
                        manager.stateVisibility.LEVEL_EDITOR.includes(panelId);
        
        if (typeof window.redraw === 'function') {
          window.redraw(); window.redraw(); window.redraw();
        }
        
        // Toggle 2 (back to original)
        const result2 = manager.togglePanel(panelId);
        const visible2 = panelObj.state ? panelObj.state.visible : panelObj.visible;
        const inState2 = manager.stateVisibility.LEVEL_EDITOR && 
                        manager.stateVisibility.LEVEL_EDITOR.includes(panelId);
        
        if (typeof window.redraw === 'function') {
          window.redraw(); window.redraw(); window.redraw();
        }
        
        // Verify toggle worked both ways and state synchronized
        const toggle1Correct = (visible1 === result1) && (visible1 === inState1);
        const toggle2Correct = (visible2 === result2) && (visible2 === inState2);
        const returnedToOriginal = (visible2 === initialVisible) && (inState2 === initialInState);
        
        return {
          success: toggle1Correct && toggle2Correct && returnedToOriginal,
          initial: { visible: initialVisible, inState: initialInState },
          after1: { visible: visible1, inState: inState1, result: result1 },
          after2: { visible: visible2, inState: inState2, result: result2 }
        };
      }, panel.id);
      
      await sleep(300);
      
      if (toggleTest.success) {
        console.log(`    ✅ Toggle test passed`);
        console.log(`       Initial: Visible=${toggleTest.initial.visible}, InState=${toggleTest.initial.inState}`);
        console.log(`       After 1: Visible=${toggleTest.after1.visible}, InState=${toggleTest.after1.inState}`);
        console.log(`       After 2: Visible=${toggleTest.after2.visible}, InState=${toggleTest.after2.inState}`);
        await saveScreenshot(page, `panel_toggle/${panel.id}_LEVEL_EDITOR`, true);
      } else {
        console.log(`    ❌ Toggle test FAILED: ${toggleTest.error || JSON.stringify(toggleTest)}`);
        await saveScreenshot(page, `panel_toggle/${panel.id}_LEVEL_EDITOR`, false);
        allTestsPassed = false;
      }
      
      results.push({ panel: `${panel.name} (LEVEL_EDITOR)`, state: 'Toggle Test', passed: toggleTest.success });
    }
    
    // ========================================
    // Summary
    // ========================================
    console.log('\n\n' + '='.repeat(70));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(70));
    
    console.log('\n📋 PLAYING State Panels (7 panels):');
    results.filter(r => r.panel.includes('(PLAYING)')).forEach(r => {
      const icon = r.passed ? '✅' : '❌';
      console.log(`  ${icon} ${r.panel} - ${r.state}`);
    });
    
    console.log('\n📋 LEVEL_EDITOR State Panels (6 panels):');
    results.filter(r => r.panel.includes('(LEVEL_EDITOR)')).forEach(r => {
      const icon = r.passed ? '✅' : '❌';
      console.log(`  ${icon} ${r.panel} - ${r.state}`);
    });
    
    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    
    console.log('\n' + '='.repeat(70));
    console.log(`📈 Total: ${passedTests}/${totalTests} passed (${failedTests} failed)`);
    console.log(`📸 Screenshots saved: ${totalTests} (6 PLAYING + 6 LEVEL_EDITOR)`);
    console.log('='.repeat(70));
    
    if (allTestsPassed) {
      console.log('\n✅ ALL TESTS PASSED');
      console.log('📁 Screenshots location: test/e2e/screenshots/panel_toggle/');
    } else {
      console.log('\n❌ SOME TESTS FAILED');
      console.log('📁 Check screenshots in: test/e2e/screenshots/panel_toggle/');
    }
    
  } catch (error) {
    console.error('\n❌ TEST ERROR:', error);
    allTestsPassed = false;
  } finally {
    if (browser) {
      await browser.close();
    }
    process.exit(allTestsPassed ? 0 : 1);
  }
})();
