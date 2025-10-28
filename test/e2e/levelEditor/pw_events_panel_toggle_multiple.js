/**
 * E2E Test: Events Panel Toggle - Multiple Toggle Test
 * 
 * Tests that the Events panel can be toggled ON and OFF multiple times
 * without issues (regression test for the renderPanels hide bug).
 * 
 * Test Flow:
 * 1. Enter Level Editor
 * 2. Toggle Events panel ON → verify VISIBLE
 * 3. Wait 500ms → verify STILL visible
 * 4. Toggle Events panel OFF → verify HIDDEN
 * 5. Wait 500ms → verify STILL hidden
 * 6. Toggle ON again → verify VISIBLE
 * 7. Wait 500ms → verify STILL visible
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  let browser;
  
  try {
    console.log('=== Events Panel Toggle - Multiple Toggle Test ===\n');
    
    // Step 1: Load game and ensure started
    console.log('Step 1: Loading game...');
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.goto('http://localhost:8000?test=1');
    
    console.log('Step 2: Ensuring game started...');
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    
    if (!gameStarted.started) {
      throw new Error(`Game failed to start: ${gameStarted.reason || 'Unknown reason'}`);
    }
    
    console.log('✅ Game started successfully\n');
    
    // Step 2: Enter Level Editor
    console.log('Step 3: Entering Level Editor mode...');
    await page.evaluate(() => {
      if (typeof GameState !== 'undefined' && GameState.setState) {
        GameState.setState('LEVEL_EDITOR');
      }
      
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(500);
    console.log('✅ Entered Level Editor mode\n');
    
    // Wait for Level Editor to fully initialize
    await sleep(500);
    
    // Step 3: Toggle ON (first time)
    console.log('Step 4: Toggle Events panel ON (1st time)...');
    const toggle1 = await page.evaluate(() => {
      if (!window.levelEditor || !window.levelEditor.levelEditorPanels) {
        return { success: false, error: 'Level Editor not found' };
      }
      
      window.levelEditor.levelEditorPanels.toggleEventsPanel();
      
      const panel = window.draggablePanelManager.panels.get('level-editor-events');
      return {
        success: true,
        visible: panel ? panel.isVisible() : null,
        inStateVisibility: window.draggablePanelManager.stateVisibility.LEVEL_EDITOR.includes('level-editor-events')
      };
    });
    
    if (!toggle1.success) {
      throw new Error(`Toggle 1 failed: ${toggle1.error}`);
    }
    
    console.log(`✅ Toggle 1: visible=${toggle1.visible}, in stateVisibility=${toggle1.inStateVisibility}`);
    
    // Wait 500ms and verify still visible
    await sleep(500);
    const check1 = await page.evaluate(() => {
      const panel = window.draggablePanelManager.panels.get('level-editor-events');
      return {
        visible: panel ? panel.isVisible() : null,
        inStateVisibility: window.draggablePanelManager.stateVisibility.LEVEL_EDITOR.includes('level-editor-events')
      };
    });
    
    console.log(`✅ After 500ms: visible=${check1.visible}, in stateVisibility=${check1.inStateVisibility}\n`);
    await saveScreenshot(page, 'levelEditor/events_toggle_multi_01_on', check1.visible === true);
    
    // Step 4: Toggle OFF
    console.log('Step 5: Toggle Events panel OFF...');
    const toggle2 = await page.evaluate(() => {
      window.levelEditor.levelEditorPanels.toggleEventsPanel();
      
      const panel = window.draggablePanelManager.panels.get('level-editor-events');
      return {
        visible: panel ? panel.isVisible() : null,
        inStateVisibility: window.draggablePanelManager.stateVisibility.LEVEL_EDITOR.includes('level-editor-events')
      };
    });
    
    console.log(`✅ Toggle 2 (OFF): visible=${toggle2.visible}, in stateVisibility=${toggle2.inStateVisibility}`);
    
    // Wait 500ms and verify still hidden
    await sleep(500);
    const check2 = await page.evaluate(() => {
      const panel = window.draggablePanelManager.panels.get('level-editor-events');
      return {
        visible: panel ? panel.isVisible() : null,
        inStateVisibility: window.draggablePanelManager.stateVisibility.LEVEL_EDITOR.includes('level-editor-events')
      };
    });
    
    console.log(`✅ After 500ms: visible=${check2.visible}, in stateVisibility=${check2.inStateVisibility}\n`);
    await saveScreenshot(page, 'levelEditor/events_toggle_multi_02_off', check2.visible === false);
    
    // Step 5: Toggle ON again (second time)
    console.log('Step 6: Toggle Events panel ON (2nd time)...');
    const toggle3 = await page.evaluate(() => {
      window.levelEditor.levelEditorPanels.toggleEventsPanel();
      
      const panel = window.draggablePanelManager.panels.get('level-editor-events');
      return {
        visible: panel ? panel.isVisible() : null,
        inStateVisibility: window.draggablePanelManager.stateVisibility.LEVEL_EDITOR.includes('level-editor-events')
      };
    });
    
    console.log(`✅ Toggle 3 (ON again): visible=${toggle3.visible}, in stateVisibility=${toggle3.inStateVisibility}`);
    
    // Wait 500ms and verify still visible
    await sleep(500);
    const check3 = await page.evaluate(() => {
      const panel = window.draggablePanelManager.panels.get('level-editor-events');
      return {
        visible: panel ? panel.isVisible() : null,
        inStateVisibility: window.draggablePanelManager.stateVisibility.LEVEL_EDITOR.includes('level-editor-events')
      };
    });
    
    console.log(`✅ After 500ms: visible=${check3.visible}, in stateVisibility=${check3.inStateVisibility}\n`);
    await saveScreenshot(page, 'levelEditor/events_toggle_multi_03_on_again', check3.visible === true);
    
    // Evaluate results
    console.log('=== TEST RESULTS ===\n');
    
    const test1 = toggle1.visible === true && check1.visible === true;
    const test2 = toggle2.visible === false && check2.visible === false;
    const test3 = toggle3.visible === true && check3.visible === true;
    
    console.log(`Test 1 - Toggle ON (1st): ${test1 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Test 2 - Toggle OFF: ${test2 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Test 3 - Toggle ON (2nd): ${test3 ? '✅ PASS' : '❌ FAIL'}`);
    
    const allPassed = test1 && test2 && test3;
    
    if (allPassed) {
      console.log('\n✅ ALL TESTS PASSED - Multiple toggles work correctly!');
    } else {
      console.log('\n❌ Some tests failed');
    }
    
    await browser.close();
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    if (browser) await browser.close();
    process.exit(1);
  }
})();
