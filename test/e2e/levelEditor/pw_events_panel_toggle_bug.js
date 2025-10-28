/**
 * E2E Test: Events Panel Toggle Bug Fix Verification
 * 
 * Bug: Events panel appears briefly then disappears when clicking Events button
 * Root Cause: LevelEditorPanels.show() was showing ALL panels instead of only
 *             panels in stateVisibility.LEVEL_EDITOR (Events should start hidden)
 * 
 * Fix: Updated show() to respect stateVisibility configuration
 * 
 * This test verifies:
 * 1. Events panel starts HIDDEN when Level Editor activates
 * 2. Clicking Events button SHOWS the panel
 * 3. Panel STAYS VISIBLE after clicking (no immediate hide)
 * 4. Clicking again HIDES the panel
 * 5. Multiple toggles work correctly
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('Loading game...');
    await page.goto('http://localhost:8000?test=1');
    
    // Ensure game started
    console.log('Ensuring game started...');
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Game failed to start');
    }
    console.log('Game started successfully');
    
    // Wait for terrain
    await page.waitForFunction(() => window.g_activeMap, { timeout: 5000 });
    console.log('Terrain initialized');
    
    // Enter Level Editor mode using proper initialization
    console.log('Entering Level Editor mode...');
    const editorResult = await page.evaluate(() => {
      if (!window.LevelEditor) return { success: false, error: 'LevelEditor not found' };
      
      window.testLevelEditor = new window.LevelEditor();
      if (!window.g_activeMap) return { success: false, error: 'Terrain not found' };
      
      window.testLevelEditor.initialize(window.g_activeMap);
      window.testLevelEditor.active = true;
      
      // Show panels (should only show Materials and Tools, NOT Events)
      window.testLevelEditor.levelEditorPanels.show();
      
      // Check which panels are visible after show()
      const materialsPanel = window.draggablePanelManager.panels.get('level-editor-materials');
      const toolsPanel = window.draggablePanelManager.panels.get('level-editor-tools');
      const eventsPanel = window.draggablePanelManager.panels.get('level-editor-events');
      
      return { 
        success: true,
        panelsAfterShow: {
          materials: materialsPanel ? materialsPanel.state.visible : null,
          tools: toolsPanel ? toolsPanel.state.visible : null,
          events: eventsPanel ? eventsPanel.state.visible : null
        }
      };
    });
    
    if (!editorResult.success) {
      throw new Error(`Level Editor setup failed: ${editorResult.error}`);
    }
    console.log('Level Editor initialized');
    console.log('Panels visibility after show():', editorResult.panelsAfterShow);
    
    // Test 1: Verify Events panel starts HIDDEN (fix verification)
    console.log('\nTest 1: Verify Events panel starts HIDDEN...');
    const test1Pass = editorResult.panelsAfterShow.events === false;
    const test1ToolsVisible = editorResult.panelsAfterShow.tools === true;
    console.log(`  Events panel hidden: ${test1Pass ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Tools panel visible: ${test1ToolsVisible ? '✅ PASS' : '❌ FAIL'}`);
    
    await sleep(500);
    await saveScreenshot(page, 'levelEditor/events_panel_initial_state', test1Pass && test1ToolsVisible);
    
    // Test 2: Click Events button to SHOW panel
    console.log('\nTest 2: Click Events button to SHOW panel...');
    const test2Result = await page.evaluate(() => {
      // Find Events button coordinates
      const toolbar = window.testLevelEditor.toolbar;
      const tools = toolbar.getAllTools();
      const eventsIndex = tools.indexOf('events');
      
      if (eventsIndex === -1) {
        return { success: false, error: 'Events button not found' };
      }
      
      const toolsPanel = window.draggablePanelManager.panels.get('level-editor-tools');
      const toolPos = toolsPanel.getPosition();
      const titleBarHeight = toolsPanel.calculateTitleBarHeight();
      const contentX = toolPos.x + toolsPanel.config.style.padding;
      const contentY = toolPos.y + titleBarHeight + toolsPanel.config.style.padding;
      
      const buttonSize = 35;
      const spacing = 5;
      const eventsButtonY = contentY + spacing + eventsIndex * (buttonSize + spacing) + buttonSize / 2;
      const eventsButtonX = contentX + spacing + buttonSize / 2;
      
      // Get state before click
      const eventsPanel = window.draggablePanelManager.panels.get('level-editor-events');
      const stateBefore = eventsPanel.state.visible;
      
      // Click Events button via LevelEditor.handleClick (full user flow)
      window.testLevelEditor.handleClick(eventsButtonX, eventsButtonY);
      
      // Get state immediately after click
      const stateAfter = eventsPanel.state.visible;
      
      // Force redraw
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      return {
        success: true,
        stateBefore,
        stateAfter,
        expectedAfter: true,
        testPassed: stateBefore === false && stateAfter === true
      };
    });
    
    console.log(`  State before click: ${test2Result.stateBefore}`);
    console.log(`  State after click: ${test2Result.stateAfter}`);
    console.log(`  Test 2: ${test2Result.testPassed ? '✅ PASS' : '❌ FAIL'}`);
    
    await sleep(500);
    await saveScreenshot(page, 'levelEditor/events_panel_after_first_click', test2Result.testPassed);
    
    // Test 3: Wait briefly and verify panel STAYS visible (no immediate hide bug)
    console.log('\nTest 3: Verify panel STAYS visible...');
    await sleep(200);
    const test3Result = await page.evaluate(() => {
      const eventsPanel = window.draggablePanelManager.panels.get('level-editor-events');
      return {
        stillVisible: eventsPanel.state.visible,
        testPassed: eventsPanel.state.visible === true
      };
    });
    
    console.log(`  Panel still visible: ${test3Result.stillVisible}`);
    console.log(`  Test 3: ${test3Result.testPassed ? '✅ PASS' : '❌ FAIL'}`);
    
    await saveScreenshot(page, 'levelEditor/events_panel_stays_visible', test3Result.testPassed);
    
    // Test 4: Click Events button again to HIDE panel
    console.log('\nTest 4: Click Events button to HIDE panel...');
    const test4Result = await page.evaluate(() => {
      const toolbar = window.testLevelEditor.toolbar;
      const tools = toolbar.getAllTools();
      const eventsIndex = tools.indexOf('events');
      
      const toolsPanel = window.draggablePanelManager.panels.get('level-editor-tools');
      const toolPos = toolsPanel.getPosition();
      const titleBarHeight = toolsPanel.calculateTitleBarHeight();
      const contentX = toolPos.x + toolsPanel.config.style.padding;
      const contentY = toolPos.y + titleBarHeight + toolsPanel.config.style.padding;
      
      const buttonSize = 35;
      const spacing = 5;
      const eventsButtonY = contentY + spacing + eventsIndex * (buttonSize + spacing) + buttonSize / 2;
      const eventsButtonX = contentX + spacing + buttonSize / 2;
      
      const eventsPanel = window.draggablePanelManager.panels.get('level-editor-events');
      const stateBefore = eventsPanel.state.visible;
      
      // Click again to hide
      window.testLevelEditor.handleClick(eventsButtonX, eventsButtonY);
      
      const stateAfter = eventsPanel.state.visible;
      
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      return {
        stateBefore,
        stateAfter,
        testPassed: stateBefore === true && stateAfter === false
      };
    });
    
    console.log(`  State before click: ${test4Result.stateBefore}`);
    console.log(`  State after click: ${test4Result.stateAfter}`);
    console.log(`  Test 4: ${test4Result.testPassed ? '✅ PASS' : '❌ FAIL'}`);
    
    await sleep(500);
    await saveScreenshot(page, 'levelEditor/events_panel_after_hide_click', test4Result.testPassed);
    
    // Test 5: Multiple toggle cycles
    console.log('\nTest 5: Multiple toggle cycles...');
    const test5Result = await page.evaluate(() => {
      const toolbar = window.testLevelEditor.toolbar;
      const tools = toolbar.getAllTools();
      const eventsIndex = tools.indexOf('events');
      
      const toolsPanel = window.draggablePanelManager.panels.get('level-editor-tools');
      const toolPos = toolsPanel.getPosition();
      const titleBarHeight = toolsPanel.calculateTitleBarHeight();
      const contentX = toolPos.x + toolsPanel.config.style.padding;
      const contentY = toolPos.y + titleBarHeight + toolsPanel.config.style.padding;
      
      const buttonSize = 35;
      const spacing = 5;
      const eventsButtonY = contentY + spacing + eventsIndex * (buttonSize + spacing) + buttonSize / 2;
      const eventsButtonX = contentX + spacing + buttonSize / 2;
      
      const eventsPanel = window.draggablePanelManager.panels.get('level-editor-events');
      const states = [];
      
      // Current state (should be hidden from Test 4)
      states.push(eventsPanel.state.visible);
      
      // Click 1: Show
      window.testLevelEditor.handleClick(eventsButtonX, eventsButtonY);
      states.push(eventsPanel.state.visible);
      
      // Click 2: Hide
      window.testLevelEditor.handleClick(eventsButtonX, eventsButtonY);
      states.push(eventsPanel.state.visible);
      
      // Click 3: Show
      window.testLevelEditor.handleClick(eventsButtonX, eventsButtonY);
      states.push(eventsPanel.state.visible);
      
      return {
        states,
        expected: [false, true, false, true],
        testPassed: states[0] === false && states[1] === true && 
                   states[2] === false && states[3] === true
      };
    });
    
    console.log(`  Toggle states: ${test5Result.states.join(' → ')}`);
    console.log(`  Expected:      ${test5Result.expected.join(' → ')}`);
    console.log(`  Test 5: ${test5Result.testPassed ? '✅ PASS' : '❌ FAIL'}`);
    
    await sleep(500);
    await saveScreenshot(page, 'levelEditor/events_panel_multiple_toggles', test5Result.testPassed);
    
    // Summary
    const allTestsPassed = test1Pass && test1ToolsVisible && 
                          test2Result.testPassed && 
                          test3Result.testPassed && 
                          test4Result.testPassed && 
                          test5Result.testPassed;
    
    console.log('\n=== E2E Test Summary ===');
    console.log(`Test 1 - Events panel starts hidden: ${test1Pass && test1ToolsVisible ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Test 2 - Click to show panel: ${test2Result.testPassed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Test 3 - Panel stays visible: ${test3Result.testPassed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Test 4 - Click to hide panel: ${test4Result.testPassed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Test 5 - Multiple toggles: ${test5Result.testPassed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`\nOverall: ${allTestsPassed ? 'ALL TESTS PASSED ✅' : 'SOME TESTS FAILED ❌'}`);
    
    if (allTestsPassed) {
      console.log('\n✅ Events Panel Toggle Bug is FIXED!');
      console.log('   - Events panel starts hidden when Level Editor activates');
      console.log('   - Clicking Events button shows the panel');
      console.log('   - Panel stays visible (no immediate hide)');
      console.log('   - Toggle behavior works correctly');
    }
    
    await browser.close();
    process.exit(allTestsPassed ? 0 : 1);
    
  } catch (error) {
    console.error('E2E Test Error:', error);
    await saveScreenshot(page, 'levelEditor/events_panel_toggle_error', false);
    await browser.close();
    process.exit(1);
  }
})();
      
      const stateAfter = panel.state.visible;
      
      // Force rendering
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      return {
        success: true,
        stateBefore,
        stateAfter,
        expectedState: true,
        testPassed: stateAfter === true
      };
    
    
    await sleep(500);
    await saveScreenshot(page, 'levelEditor/events_panel_full_flow', fullFlowResult.testPassed);
    console.log('Test 3 complete:', fullFlowResult);
    
    // Test 4: Multiple toggles
    console.log('Test 4: Testing multiple toggles...');
    const multiToggleResult = await page.evaluate(() => {
      const toolbar = window.testLevelEditor.toolbar;
      const tools = toolbar.getAllTools();
      const eventsIndex = tools.indexOf('events');
      
      const toolsPanel = window.draggablePanelManager.panels.get('level-editor-tools');
      const toolPos = toolsPanel.getPosition();
      const titleBarHeight = toolsPanel.calculateTitleBarHeight();
      const contentX = toolPos.x + toolsPanel.config.style.padding;
      const contentY = toolPos.y + titleBarHeight + toolsPanel.config.style.padding;
      
      const buttonSize = 35;
      const spacing = 5;
      const eventsButtonY = contentY + spacing + eventsIndex * (buttonSize + spacing) + buttonSize / 2;
      const eventsButtonX = contentX + spacing + buttonSize / 2;
      
      const panel = window.draggablePanelManager.panels.get('level-editor-events');
      
      const states = [];
      
      // Reset to hidden
      window.draggablePanelManager.hidePanel('level-editor-events');
      states.push(panel.state.visible); // Should be false
      
      // Click 1: Show
      window.testLevelEditor.handleClick(eventsButtonX, eventsButtonY);
      states.push(panel.state.visible); // Should be true
      
      // Click 2: Hide
      window.testLevelEditor.handleClick(eventsButtonX, eventsButtonY);
      states.push(panel.state.visible); // Should be false
      
      // Click 3: Show
      window.testLevelEditor.handleClick(eventsButtonX, eventsButtonY);
      states.push(panel.state.visible); // Should be true
      
      return {
        success: true,
        states,
        expected: [false, true, false, true],
        testPassed: states[0] === false && states[1] === true && states[2] === false && states[3] === true
      };
    });
    
    await sleep(500);
    await saveScreenshot(page, 'levelEditor/events_panel_multi_toggle', multiToggleResult.testPassed);
    console.log('Test 4 complete:', multiToggleResult);
    
    // Summary
    console.log('\n=== E2E Test Summary ===');
    console.log('Test 1 - Initial state hidden:', initialState.success && !initialState.visible ? 'PASS' : 'FAIL');
    console.log('Test 2 - Click handlers:');
    console.log('  - stateBefore:', clickResult.stateBefore);
    console.log('  - stateAfterPanelClick:', clickResult.stateAfterPanelClick);
    console.log('  - stateAfterBothHandlers:', clickResult.stateAfterBothHandlers);
    console.log('  - BUG DETECTED:', clickResult.bugDetected ? 'YES ❌' : 'NO ✅');
    console.log('Test 3 - Full handleClick flow:', fullFlowResult.testPassed ? 'PASS ✅' : 'FAIL ❌');
    console.log('Test 4 - Multiple toggles:', multiToggleResult.testPassed ? 'PASS ✅' : 'FAIL ❌');
    
    const allPassed = initialState.success && 
                     !initialState.visible &&
                     fullFlowResult.testPassed &&
                     multiToggleResult.testPassed &&
                     !clickResult.bugDetected;
    
    console.log('\nOverall:', allPassed ? 'ALL TESTS PASSED ✅' : 'SOME TESTS FAILED ❌');
    
    if (clickResult.bugDetected) {
      console.log('\n⚠️ BUG CONFIRMED: draggablePanelManager toggles panel off after levelEditorPanels toggles it on!');
    }
    
    try{
    await browser.close();
    process.exit(allPassed ? 0 : 1);
    } catch (error) {
    console.error('E2E Test Error:', error);
    await saveScreenshot(page, 'levelEditor/events_panel_toggle_error', false);
    await browser.close();
    process.exit(1);
  }

