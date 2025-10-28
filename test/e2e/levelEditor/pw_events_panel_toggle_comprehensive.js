/**
 * E2E Test: Events Panel Toggle - Comprehensive State Capture
 * 
 * This test simulates the full user workflow:
 * 1. Start game
 * 2. Click "Level Editor" button to enter Level Editor mode
 * 3. Click Events button (🚩) in toolbar
 * 4. Capture panel state immediately and 1 second after clicking
 * 
 * Captures:
 * - Initial panel visibility (all panels)
 * - State immediately after clicking Events button
 * - State 1 second after clicking (to detect delayed hiding)
 * - All panel positions and configurations
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('=== Events Panel Toggle - Comprehensive Test ===\n');
    
    console.log('Step 1: Loading game...');
    await page.goto('http://localhost:8000?test=1');
    
    // Ensure game started
    console.log('Step 2: Ensuring game started...');
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Game failed to start');
    }
    console.log('✅ Game started successfully\n');
    
    // Wait for terrain
    await page.waitForFunction(() => window.g_activeMap, { timeout: 5000 });
    console.log('✅ Terrain initialized\n');
    
    // Step 3: Click Level Editor button to enter Level Editor mode
    console.log('Step 3: Clicking Level Editor button...');
    const enterEditorResult = await page.evaluate(() => {
      // Find and click the Level Editor button in the main menu
      if (window.GameState && window.GameState.setState) {
        window.GameState.setState('LEVEL_EDITOR');
        
        // Give Level Editor time to initialize
        return { success: true, method: 'GameState.setState' };
      }
      return { success: false, error: 'GameState not available' };
    });
    
    if (!enterEditorResult.success) {
      throw new Error(`Failed to enter Level Editor: ${enterEditorResult.error}`);
    }
    console.log(`✅ Entered Level Editor mode via ${enterEditorResult.method}\n`);
    
    await sleep(500); // Wait for Level Editor to fully initialize
    
    // Step 4: Capture initial state of all panels
    console.log('Step 4: Capturing initial panel states...');
    const initialState = await page.evaluate(() => {
      const manager = window.draggablePanelManager;
      if (!manager) return { success: false, error: 'draggablePanelManager not found' };
      
      const panels = {};
      const panelIds = [
        'level-editor-materials',
        'level-editor-tools',
        'level-editor-brush',
        'level-editor-events',
        'level-editor-properties'
      ];
      
      panelIds.forEach(id => {
        const panel = manager.panels.get(id);
        if (panel) {
          panels[id] = {
            visible: panel.state.visible,
            minimized: panel.state.minimized,
            position: { ...panel.state.position }
          };
        } else {
          panels[id] = { exists: false };
        }
      });
      
      return {
        success: true,
        panels,
        stateVisibility: manager.stateVisibility.LEVEL_EDITOR || []
      };
    });
    
    console.log('Initial Panel States:');
    Object.entries(initialState.panels).forEach(([id, state]) => {
      const shortId = id.replace('level-editor-', '');
      if (state.exists === false) {
        console.log(`  ${shortId}: NOT FOUND`);
      } else {
        console.log(`  ${shortId}: ${state.visible ? 'VISIBLE' : 'HIDDEN'} ${state.minimized ? '(minimized)' : ''}`);
      }
    });
    console.log(`State Visibility: [${initialState.stateVisibility.join(', ')}]\n`);
    
    await saveScreenshot(page, 'levelEditor/events_toggle_01_initial_state', true);
    
    // Step 5: Click Events button in toolbar
    console.log('Step 5: Clicking Events button (🚩) in toolbar...');
    const clickResult = await page.evaluate(() => {
      // Use the global levelEditor instance
      const levelEditor = window.levelEditor;
      
      if (!levelEditor) {
        return { success: false, error: 'window.levelEditor not found' };
      }
      
      if (!levelEditor.toolbar) {
        return { success: false, error: 'levelEditor.toolbar not found' };
      }
      
      if (!levelEditor.isActive || !levelEditor.isActive()) {
        return { success: false, error: 'Level Editor is not active' };
      }
      
      const toolbar = levelEditor.toolbar;
      const tools = toolbar.getAllTools();
      const eventsIndex = tools.indexOf('events');
      
      if (eventsIndex === -1) {
        return { success: false, error: 'Events button not found in toolbar' };
      }
      
      // Get Tools panel to calculate button position
      const toolsPanel = window.draggablePanelManager.panels.get('level-editor-tools');
      if (!toolsPanel) {
        return { success: false, error: 'Tools panel not found' };
      }
      
      const toolPos = toolsPanel.getPosition();
      const titleBarHeight = toolsPanel.calculateTitleBarHeight();
      const contentX = toolPos.x + toolsPanel.config.style.padding;
      const contentY = toolPos.y + titleBarHeight + toolsPanel.config.style.padding;
      
      const buttonSize = 35;
      const spacing = 5;
      const eventsButtonY = contentY + spacing + eventsIndex * (buttonSize + spacing) + buttonSize / 2;
      const eventsButtonX = contentX + spacing + buttonSize / 2;
      
      // Get Events panel state BEFORE click
      const eventsPanel = window.draggablePanelManager.panels.get('level-editor-events');
      const stateBefore = eventsPanel ? eventsPanel.state.visible : null;
      
      // Add debug: Try calling toggleEventsPanel directly first
      let directToggleResult = null;
      if (levelEditor.levelEditorPanels && levelEditor.levelEditorPanels.toggleEventsPanel) {
        levelEditor.levelEditorPanels.toggleEventsPanel();
        directToggleResult = eventsPanel ? eventsPanel.state.visible : null;
        
        // Reset for second test
        if (directToggleResult === true) {
          levelEditor.levelEditorPanels.toggleEventsPanel();
        }
      }
      
      // DEBUG: Check if toolbar contains point and handleClick returns true
      let containsPointResult = null;
      let toolbarHandleClickResult = null;
      let panelHandleClickResult = null;
      
      if (levelEditor.toolbar && levelEditor.toolbar.containsPoint) {
        containsPointResult = levelEditor.toolbar.containsPoint(eventsButtonX, eventsButtonY, contentX, contentY);
      }
      
      if (containsPointResult && levelEditor.toolbar.handleClick) {
        toolbarHandleClickResult = levelEditor.toolbar.handleClick(eventsButtonX, eventsButtonY, contentX, contentY);
      }
      
      if (levelEditor.levelEditorPanels && levelEditor.levelEditorPanels.handleClick) {
        panelHandleClickResult = levelEditor.levelEditorPanels.handleClick(eventsButtonX, eventsButtonY);
      }
      
      // Click Events button via LevelEditor.handleClick (full user flow)
      levelEditor.handleClick(eventsButtonX, eventsButtonY);
      
      // Get state IMMEDIATELY after click
      const stateAfterImmediate = eventsPanel ? eventsPanel.state.visible : null;
      
      // Force redraw
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      return {
        success: true,
        clickCoords: { x: eventsButtonX, y: eventsButtonY },
        eventsIndex,
        stateBefore,
        directToggleResult,
        stateAfterImmediate,
        containsPointResult,
        toolbarHandleClickResult,
        panelHandleClickResult
      };
    });
    
    if (!clickResult.success) {
      throw new Error(`Failed to click Events button: ${clickResult.error}`);
    }
    
    console.log(`✅ Clicked Events button at position (${clickResult.clickCoords.x}, ${clickResult.clickCoords.y})`);
    console.log(`   Direct toggleEventsPanel() call result: ${clickResult.directToggleResult}`);
    console.log(`   Events panel state BEFORE click: ${clickResult.stateBefore}`);
    console.log(`   Events panel state IMMEDIATELY after click: ${clickResult.stateAfterImmediate}`);
    console.log(`   Toolbar containsPoint result: ${clickResult.containsPointResult}`);
    console.log(`   Toolbar handleClick result: ${clickResult.toolbarHandleClickResult}`);
    console.log(`   levelEditorPanels.handleClick result: ${clickResult.panelHandleClickResult}\n`);
    
    await sleep(100);
    await saveScreenshot(page, 'levelEditor/events_toggle_02_immediately_after_click', true);
    
    // Step 6: Wait 1 second and check state again (detect delayed hiding)
    console.log('Step 6: Waiting 1 second to check for delayed state changes...');
    await sleep(1000);
    
    const stateAfter1Second = await page.evaluate(() => {
      const manager = window.draggablePanelManager;
      const eventsPanel = manager.panels.get('level-editor-events');
      
      const panels = {};
      const panelIds = [
        'level-editor-materials',
        'level-editor-tools',
        'level-editor-brush',
        'level-editor-events',
        'level-editor-properties'
      ];
      
      panelIds.forEach(id => {
        const panel = manager.panels.get(id);
        if (panel) {
          panels[id] = {
            visible: panel.state.visible,
            minimized: panel.state.minimized
          };
        }
      });
      
      return {
        eventsVisible: eventsPanel ? eventsPanel.state.visible : null,
        allPanels: panels
      };
    });
    
    console.log(`Events panel state 1 SECOND after click: ${stateAfter1Second.eventsVisible}\n`);
    
    console.log('All Panel States (1 second after click):');
    Object.entries(stateAfter1Second.allPanels).forEach(([id, state]) => {
      const shortId = id.replace('level-editor-', '');
      console.log(`  ${shortId}: ${state.visible ? 'VISIBLE' : 'HIDDEN'} ${state.minimized ? '(minimized)' : ''}`);
    });
    console.log('');
    
    await saveScreenshot(page, 'levelEditor/events_toggle_03_one_second_after', true);
    
    // Step 7: Analysis and Results
    console.log('=== TEST RESULTS ===\n');
    
    const test1 = initialState.panels['level-editor-events'].visible === false;
    const test2 = clickResult.stateAfterImmediate === true;
    const test3 = stateAfter1Second.eventsVisible === true;
    const bugDetected = clickResult.stateAfterImmediate === true && stateAfter1Second.eventsVisible === false;
    
    console.log(`Test 1 - Events panel starts HIDDEN: ${test1 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Test 2 - Panel shows immediately after click: ${test2 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Test 3 - Panel STAYS visible 1 second later: ${test3 ? '✅ PASS' : '❌ FAIL'}`);
    console.log('');
    
    if (bugDetected) {
      console.log('🐛 BUG DETECTED: Panel shows then hides!');
      console.log('   Panel was visible immediately after click but hidden 1 second later.');
    } else if (test1 && test2 && test3) {
      console.log('✅ ALL TESTS PASSED - Bug is FIXED!');
    } else {
      console.log('❌ Some tests failed - see details above');
    }
    
    console.log('\n=== State Flow ===');
    console.log(`Initial: ${initialState.panels['level-editor-events'].visible}`);
    console.log(`After click (immediate): ${clickResult.stateAfterImmediate}`);
    console.log(`After click (1 second): ${stateAfter1Second.eventsVisible}`);
    
    const allPassed = test1 && test2 && test3 && !bugDetected;
    
    await browser.close();
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ E2E Test Error:', error);
    await saveScreenshot(page, 'levelEditor/events_toggle_error', false);
    await browser.close();
    process.exit(1);
  }
})();
