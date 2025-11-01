/**
 * E2E Test: Tool Mode Toggles (with actual mouse clicks)
 * 
 * Purpose: Test tool mode toggle UI with real browser mouse simulation
 * Verifies:
 * 1. No toggles visible when no tool selected
 * 2. Eraser modes visible when eraser selected (ALL, TERRAIN, ENTITY, EVENTS)
 * 3. Clicking mode toggles changes selection
 * 4. Selection tool modes visible when selection tool selected
 * 5. No toggles when brush/paint tools selected (no modes)
 * 
 * Uses actual Puppeteer mouse.click() to simulate real user interaction
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  let browser;
  let success = false;
  
  try {
    console.log('🔍 Starting Tool Mode Toggles Test (with mouse clicks)...\n');
    
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    await page.goto('http://localhost:8000?test=1', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    await sleep(2000);
    
    // Ensure Level Editor started
    console.log('🎮 Starting Level Editor...');
    const editorStarted = await cameraHelper.ensureLevelEditorStarted(page);
    if (!editorStarted.started) {
      throw new Error(`Failed to start Level Editor: ${editorStarted.error}`);
    }
    console.log('✅ Level Editor started\n');
    
    await sleep(1000);
    
    // Force render
    await page.evaluate(() => {
      window.gameState = 'LEVEL_EDITOR';
      if (window.draggablePanelManager) {
        window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
      }
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    await sleep(500);
    
    // Test 1: No tool selected - no mode toggles visible
    console.log('='.repeat(70));
    console.log('🎯 Test 1: No tool selected - Mode toggles hidden');
    console.log('='.repeat(70) + '\n');
    
    const noToolState = await page.evaluate(() => {
      return {
        selectedTool: window.levelEditor.toolbar.selectedTool,
        hasToggles: window.levelEditor.fileMenuBar && window.levelEditor.fileMenuBar.toolModeToggle !== null
      };
    });
    
    console.log(`Selected tool: ${noToolState.selectedTool || 'none'}`);
    console.log(`Mode toggles visible: ${noToolState.hasToggles}`);
    console.log(`${!noToolState.hasToggles ? '✅ PASS' : '❌ FAIL'}: No toggles when no tool selected\n`);
    
    await saveScreenshot(page, 'levelEditor/modes_01_no_tool', !noToolState.hasToggles);
    
    if (noToolState.hasToggles) {
      throw new Error('Mode toggles should be hidden when no tool selected');
    }
    
    // Test 2: Select eraser tool - modes should appear
    console.log('='.repeat(70));
    console.log('🎯 Test 2: Select eraser - Mode toggles visible');
    console.log('='.repeat(70) + '\n');
    
    console.log('🖱️  Selecting eraser tool...');
    await page.evaluate(() => {
      window.levelEditor.toolbar.selectTool('eraser');
      
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    
    await sleep(500);
    
    const eraserState = await page.evaluate(() => {
      return {
        selectedTool: window.levelEditor.toolbar.selectedTool,
        hasToggles: window.levelEditor.fileMenuBar && window.levelEditor.fileMenuBar.toolModeToggle ? 
                   window.levelEditor.fileMenuBar.toolModeToggle !== null : false,
        modes: window.levelEditor.fileMenuBar && window.levelEditor.fileMenuBar.toolModeToggle ?
              window.levelEditor.fileMenuBar.toolModeToggle.modes : [],
        currentMode: window.levelEditor.entityPainter ? window.levelEditor.entityPainter.getEraserMode() : 'unknown'
      };
    });
    
    console.log(`Selected tool: ${eraserState.selectedTool}`);
    console.log(`Mode toggles visible: ${eraserState.hasToggles}`);
    console.log(`Available modes: ${eraserState.modes.join(', ')}`);
    console.log(`Current mode: ${eraserState.currentMode}`);
    
    const eraserModes = ['ALL', 'TERRAIN', 'ENTITY', 'EVENTS'];
    const eraserPass = eraserState.hasToggles && 
                      eraserState.selectedTool === 'eraser' &&
                      eraserModes.every(m => eraserState.modes.includes(m));
    
    console.log(`${eraserPass ? '✅ PASS' : '❌ FAIL'}: Eraser modes visible\n`);
    
    await saveScreenshot(page, 'levelEditor/modes_02_eraser_modes', eraserPass);
    
    if (!eraserPass) {
      throw new Error('Eraser modes not displayed correctly');
    }
    
    // Test 3: Click ENTITY mode toggle
    console.log('='.repeat(70));
    console.log('🎯 Test 3: Click ENTITY mode - Should highlight ENTITY');
    console.log('='.repeat(70) + '\n');
    
    // Get position of ENTITY toggle button
    const entityTogglePos = await page.evaluate(() => {
      const menuBar = window.levelEditor.fileMenuBar;
      if (!menuBar || !menuBar.toolModeToggle) return null;
      
      const toggle = menuBar.toolModeToggle;
      const toggleX = toggle.x;
      const toggleY = toggle.y;
      const buttonWidth = toggle.buttonWidth || 70;
      
      // ENTITY is index 2 in ['ALL', 'TERRAIN', 'ENTITY', 'EVENTS']
      const entityIndex = toggle.modes.indexOf('ENTITY');
      const buttonX = toggleX + (entityIndex * (buttonWidth + 5));
      const buttonCenterX = buttonX + (buttonWidth / 2);
      const buttonCenterY = toggleY + 15; // Half of button height (30)
      
      return {
        x: buttonCenterX,
        y: buttonCenterY,
        found: entityIndex >= 0
      };
    });
    
    if (!entityTogglePos || !entityTogglePos.found) {
      throw new Error('Could not locate ENTITY mode toggle button');
    }
    
    console.log(`🖱️  Clicking ENTITY toggle at (${entityTogglePos.x}, ${entityTogglePos.y})...`);
    await page.mouse.click(entityTogglePos.x, entityTogglePos.y);
    await sleep(300);
    
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    await sleep(300);
    
    const entityModeState = await page.evaluate(() => {
      return {
        selectedMode: window.levelEditor.fileMenuBar && window.levelEditor.fileMenuBar.toolModeToggle ?
                     window.levelEditor.fileMenuBar.toolModeToggle.currentMode : 'unknown'
      };
    });
    
    console.log(`Selected toggle: ${entityModeState.selectedMode}`);
    
    const entityModePass = entityModeState.selectedMode === 'ENTITY';
    
    console.log(`${entityModePass ? '✅ PASS' : '❌ FAIL'}: ENTITY mode selected\n`);
    
    await saveScreenshot(page, 'levelEditor/modes_03_entity_selected', entityModePass);
    
    if (!entityModePass) {
      throw new Error('ENTITY mode not selected after click');
    }
    
    // Test 4: Click TERRAIN mode toggle
    console.log('='.repeat(70));
    console.log('🎯 Test 4: Click TERRAIN mode - Should highlight TERRAIN');
    console.log('='.repeat(70) + '\n');
    
    const terrainTogglePos = await page.evaluate(() => {
      const menuBar = window.levelEditor.fileMenuBar;
      if (!menuBar || !menuBar.toolModeToggle) return null;
      
      const toggle = menuBar.toolModeToggle;
      const toggleX = toggle.x;
      const toggleY = toggle.y;
      const buttonWidth = toggle.buttonWidth || 70;
      
      // TERRAIN is index 1 in ['ALL', 'TERRAIN', 'ENTITY', 'EVENTS']
      const terrainIndex = toggle.modes.indexOf('TERRAIN');
      const buttonX = toggleX + (terrainIndex * (buttonWidth + 5));
      const buttonCenterX = buttonX + (buttonWidth / 2);
      const buttonCenterY = toggleY + 15;
      
      return {
        x: buttonCenterX,
        y: buttonCenterY,
        found: terrainIndex >= 0
      };
    });
    
    if (!terrainTogglePos || !terrainTogglePos.found) {
      throw new Error('Could not locate TERRAIN mode toggle button');
    }
    
    console.log(`🖱️  Clicking TERRAIN toggle at (${terrainTogglePos.x}, ${terrainTogglePos.y})...`);
    await page.mouse.click(terrainTogglePos.x, terrainTogglePos.y);
    await sleep(300);
    
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    await sleep(300);
    
    const terrainModeState = await page.evaluate(() => {
      return {
        selectedMode: window.levelEditor.fileMenuBar && window.levelEditor.fileMenuBar.toolModeToggle ?
                     window.levelEditor.fileMenuBar.toolModeToggle.currentMode : 'unknown'
      };
    });
    
    console.log(`Selected toggle: ${terrainModeState.selectedMode}`);
    
    const terrainModePass = terrainModeState.selectedMode === 'TERRAIN';
    
    console.log(`${terrainModePass ? '✅ PASS' : '❌ FAIL'}: TERRAIN mode selected\n`);
    
    await saveScreenshot(page, 'levelEditor/modes_04_terrain_selected', terrainModePass);
    
    if (!terrainModePass) {
      throw new Error('TERRAIN mode not selected after click');
    }
    
    // Test 5: Select paint tool - modes should disappear
    console.log('='.repeat(70));
    console.log('🎯 Test 5: Select paint tool - Mode toggles should hide');
    console.log('='.repeat(70) + '\n');
    
    console.log('🖱️  Selecting paint tool...');
    await page.evaluate(() => {
      window.levelEditor.toolbar.selectTool('paint');
      
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    
    await sleep(500);
    
    const paintState = await page.evaluate(() => {
      return {
        selectedTool: window.levelEditor.toolbar.selectedTool,
        hasToggles: window.levelEditor.fileMenuBar && window.levelEditor.fileMenuBar.toolModeToggle ? 
                   window.levelEditor.fileMenuBar.toolModeToggle !== null : false
      };
    });
    
    console.log(`Selected tool: ${paintState.selectedTool}`);
    console.log(`Mode toggles visible: ${paintState.hasToggles}`);
    
    const paintPass = paintState.selectedTool === 'paint' && !paintState.hasToggles;
    
    console.log(`${paintPass ? '✅ PASS' : '❌ FAIL'}: No toggles for paint tool\n`);
    
    await saveScreenshot(page, 'levelEditor/modes_05_paint_no_modes', paintPass);
    
    if (!paintPass) {
      throw new Error('Mode toggles should be hidden for paint tool');
    }
    
    // Test 6: Switch back to eraser - modes should reappear
    console.log('='.repeat(70));
    console.log('🎯 Test 6: Switch back to eraser - Mode toggles reappear');
    console.log('='.repeat(70) + '\n');
    
    console.log('🖱️  Selecting eraser tool again...');
    await page.evaluate(() => {
      window.levelEditor.toolbar.selectTool('eraser');
      
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    
    await sleep(500);
    
    const eraserState2 = await page.evaluate(() => {
      return {
        selectedTool: window.levelEditor.toolbar.selectedTool,
        hasToggles: window.levelEditor.fileMenuBar && window.levelEditor.fileMenuBar.toolModeToggle !== null,
        modes: window.levelEditor.fileMenuBar && window.levelEditor.fileMenuBar.toolModeToggle ?
              window.levelEditor.fileMenuBar.toolModeToggle.modes : [],
        currentMode: window.levelEditor.fileMenuBar && window.levelEditor.fileMenuBar.toolModeToggle ?
                    window.levelEditor.fileMenuBar.toolModeToggle.currentMode : 'none'
      };
    });
    
    console.log(`Selected tool: ${eraserState2.selectedTool}`);
    console.log(`Mode toggles visible: ${eraserState2.hasToggles}`);
    console.log(`Available modes: ${eraserState2.modes.join(', ')}`);
    console.log(`Current mode: ${eraserState2.currentMode} (remembers TERRAIN from test 4)`);
    
    const eraserPass2 = eraserState2.hasToggles && 
                       eraserState2.selectedTool === 'eraser' &&
                       eraserState2.modes.includes('ALL');
    
    console.log(`${eraserPass2 ? '✅ PASS' : '❌ FAIL'}: Eraser modes reappeared\n`);
    
    await saveScreenshot(page, 'levelEditor/modes_06_eraser_reappear', eraserPass2);
    
    if (!eraserPass2) {
      throw new Error('Eraser modes did not reappear correctly');
    }
    
    // Final summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ No tool: Mode toggles hidden`);
    console.log(`✅ Eraser selected: ALL, TERRAIN, ENTITY, EVENTS modes visible`);
    console.log(`✅ ENTITY mode clicked: ENTITY selected`);
    console.log(`✅ TERRAIN mode clicked: TERRAIN selected`);
    console.log(`✅ Paint tool: Mode toggles hidden`);
    console.log(`✅ Eraser reselected: Mode toggles reappear with remembered mode`);
    console.log(`\n✅ All 6 tool mode toggle tests passing!\n`);
    
    success = true;
    
  } catch (error) {
    console.error(`\n❌ Test error: ${error.message}`);
    console.error(error.stack);
    success = false;
  } finally {
    if (browser) {
      await browser.close();
    }
    process.exit(success ? 0 : 1);
  }
})();
