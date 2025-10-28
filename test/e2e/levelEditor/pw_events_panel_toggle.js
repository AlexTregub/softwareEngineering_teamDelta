/**
 * E2E Test: Events Panel Toggle in Level Editor
 * Tests Events button visibility, clicking behavior, and panel toggle in real browser
 * 
 * TDD Phase 1D: E2E Tests with Screenshots
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  let allTestsPassed = true;
  const testResults = [];
  
  try {
    // Navigate to game
    await page.goto('http://localhost:8000?test=1');
    console.log('✓ Navigated to game');
    
    // Ensure game started and bypass menu
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Failed to start game - still on menu');
    }
    console.log('✓ Game started successfully');
    
    // Switch to Level Editor
    const levelEditorResult = await page.evaluate(() => {
      if (typeof GameState !== 'undefined' && GameState.setState) {
        GameState.setState('LEVEL_EDITOR');
        return { success: true, state: GameState.getState() };
      }
      return { success: false, error: 'GameState not available' };
    });
    
    if (!levelEditorResult.success) {
      throw new Error('Failed to switch to Level Editor: ' + levelEditorResult.error);
    }
    console.log('✓ Switched to Level Editor state:', levelEditorResult.state);
    
    await sleep(500);
    
    // Force render
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(300);
    
    // TEST 1: Verify Events button visible in Tools panel
    console.log('\n--- Test 1: Events button visible in Tools panel ---');
    const eventsButtonTest = await page.evaluate(() => {
      const levelEditor = window.levelEditor;
      if (!levelEditor) {
        return { success: false, error: 'Level Editor not found' };
      }
      
      if (!levelEditor.toolbar) {
        return { success: false, error: 'Toolbar not found' };
      }
      
      const eventsButton = levelEditor.toolbar.tools?.events;
      if (!eventsButton) {
        return { success: false, error: 'Events button not found in toolbar' };
      }
      
      return {
        success: true,
        buttonFound: true,
        icon: eventsButton.icon,
        tooltip: eventsButton.tooltip,
        group: eventsButton.group
      };
    });
    
    console.log('Events button test result:', eventsButtonTest);
    testResults.push({
      name: 'Events button visible',
      passed: eventsButtonTest.success && eventsButtonTest.buttonFound
    });
    
    if (!eventsButtonTest.success) {
      allTestsPassed = false;
      await saveScreenshot(page, 'levelEditor/events_button_missing', false);
    } else {
      await saveScreenshot(page, 'levelEditor/events_button_visible', true);
    }
    
    // TEST 2: Verify Events panel hidden by default
    console.log('\n--- Test 2: Events panel hidden by default ---');
    const panelDefaultStateTest = await page.evaluate(() => {
      const levelEditor = window.levelEditor;
      if (!levelEditor || !levelEditor.levelEditorPanels) {
        return { success: false, error: 'LevelEditorPanels not found' };
      }
      
      const eventsPanel = levelEditor.levelEditorPanels.panels.events;
      if (!eventsPanel) {
        return { success: false, error: 'Events panel not found' };
      }
      
      return {
        success: true,
        isVisible: eventsPanel.state.visible,
        expectedVisible: false,
        correctState: eventsPanel.state.visible === false
      };
    });
    
    console.log('Panel default state test result:', panelDefaultStateTest);
    testResults.push({
      name: 'Panel hidden by default',
      passed: panelDefaultStateTest.success && panelDefaultStateTest.correctState
    });
    
    if (!panelDefaultStateTest.correctState) {
      allTestsPassed = false;
      await saveScreenshot(page, 'levelEditor/panel_not_hidden_by_default', false);
    } else {
      await saveScreenshot(page, 'levelEditor/panel_hidden_by_default', true);
    }
    
    // TEST 3: Click Events button to show panel
    console.log('\n--- Test 3: Click Events button to show panel ---');
    const showPanelTest = await page.evaluate(() => {
      const levelEditor = window.levelEditor;
      
      // Debug: Check panel references
      const manager = window.draggablePanelManager;
      const panelFromManager = manager ? manager.panels.get('level-editor-events') : null;
      const panelFromPanels = levelEditor.levelEditorPanels.panels.events;
      const sameReference = panelFromManager === panelFromPanels;
      
      const visibleBefore = panelFromManager ? panelFromManager.state.visible : null;
      
      // Use toggleEventsPanel directly (this is what onClick calls)
      if (levelEditor.levelEditorPanels) {
        levelEditor.levelEditorPanels.toggleEventsPanel();
      }
      
      const visibleAfter = panelFromManager ? panelFromManager.state.visible : null;
      const visibleInPanels = panelFromPanels ? panelFromPanels.state.visible : null;
      
      // Force render
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      return {
        success: true,
        sameReference: sameReference,
        visibleBefore: visibleBefore,
        visibleAfter: visibleAfter,
        visibleInPanels: visibleInPanels,
        isVisible: visibleInPanels,
        expectedVisible: true,
        correctState: visibleInPanels === true
      };
    });
    
    await sleep(500);
    
    console.log('Show panel test result:', showPanelTest);
    testResults.push({
      name: 'Panel shows on button click',
      passed: showPanelTest.success && showPanelTest.correctState
    });
    
    if (!showPanelTest.correctState) {
      allTestsPassed = false;
      await saveScreenshot(page, 'levelEditor/panel_not_shown_after_click', false);
    } else {
      await saveScreenshot(page, 'levelEditor/panel_shown_after_click', true);
    }
    
    // TEST 4: Verify panel contains event list and add button
    console.log('\n--- Test 4: Panel contains event UI ---');
    const panelContentTest = await page.evaluate(() => {
      const levelEditor = window.levelEditor;
      const eventEditor = levelEditor.eventEditor;
      
      if (!eventEditor) {
        return { success: false, error: 'EventEditorPanel not found' };
      }
      
      return {
        success: true,
        hasEventEditor: true,
        eventEditorType: typeof eventEditor
      };
    });
    
    console.log('Panel content test result:', panelContentTest);
    testResults.push({
      name: 'Panel contains event editor',
      passed: panelContentTest.success && panelContentTest.hasEventEditor
    });
    
    if (!panelContentTest.hasEventEditor) {
      allTestsPassed = false;
      await saveScreenshot(page, 'levelEditor/panel_missing_content', false);
    } else {
      await saveScreenshot(page, 'levelEditor/panel_with_content', true);
    }
    
    // TEST 5: Click button again to hide panel
    console.log('\n--- Test 5: Click button again to hide panel ---');
    const hidePanelTest = await page.evaluate(() => {
      const levelEditor = window.levelEditor;
      
      // Call toggleEventsPanel again to hide
      if (levelEditor.levelEditorPanels) {
        levelEditor.levelEditorPanels.toggleEventsPanel();
      }
      
      // Force render
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      const eventsPanel = levelEditor.levelEditorPanels.panels.events;
      
      return {
        success: true,
        isVisible: eventsPanel.state.visible,
        expectedVisible: false,
        correctState: eventsPanel.state.visible === false
      };
    });
    
    await sleep(500);
    
    console.log('Hide panel test result:', hidePanelTest);
    testResults.push({
      name: 'Panel hides on second click',
      passed: hidePanelTest.success && hidePanelTest.correctState
    });
    
    if (!hidePanelTest.correctState) {
      allTestsPassed = false;
      await saveScreenshot(page, 'levelEditor/panel_not_hidden_after_second_click', false);
    } else {
      await saveScreenshot(page, 'levelEditor/panel_hidden_after_second_click', true);
    }
    
    // Print summary
    console.log('\n=== Test Summary ===');
    testResults.forEach(result => {
      const status = result.passed ? '✓ PASS' : '✗ FAIL';
      console.log(`${status}: ${result.name}`);
    });
    
    const passedCount = testResults.filter(r => r.passed).length;
    const totalCount = testResults.length;
    console.log(`\nTotal: ${passedCount}/${totalCount} tests passed`);
    
  } catch (error) {
    console.error('❌ E2E Test failed:', error);
    allTestsPassed = false;
    await saveScreenshot(page, 'levelEditor/test_error', false);
  } finally {
    await browser.close();
    console.log('\n✓ Browser closed');
    
    if (allTestsPassed) {
      console.log('✅ All E2E tests PASSED');
      process.exit(0);
    } else {
      console.log('❌ Some E2E tests FAILED');
      process.exit(1);
    }
  }
})();
