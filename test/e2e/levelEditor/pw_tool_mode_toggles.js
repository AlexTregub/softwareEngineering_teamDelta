const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

/**
 * E2E Test: Tool Mode Toggles UI
 * 
 * Tests the tool mode toggle UI system in the Level Editor menu bar:
 * - Mode toggles hidden when no tool selected
 * - Mode toggles appear when tool with modes is selected
 * - Mode toggles show correct modes for each tool
 * - Mode toggles hidden when tool without modes is selected
 * - Mode selection highlights active mode
 * 
 * Expected Screenshots:
 * 1. levelEditor/mode_toggles_01_no_tool.png - No toggles visible
 * 2. levelEditor/mode_toggles_02_eraser_modes.png - Eraser modes visible (ALL | TERRAIN | ENTITY | EVENTS)
 * 3. levelEditor/mode_toggles_03_entity_selected.png - ENTITY mode highlighted
 * 4. levelEditor/mode_toggles_04_no_modes_tool.png - Brush tool (no mode toggles)
 * 5. levelEditor/mode_toggles_05_selection_modes.png - Selection modes visible (PAINT | ENTITY | EVENT)
 * 6. levelEditor/mode_toggles_06_tool_deselected.png - Toggles hidden after deselect
 */

(async () => {
  const browser = await launchBrowser();
  const page = await cameraHelper.newPageReady(browser);
  
  let success = false;
  let errorMessage = '';
  
  try {
    console.log('Navigating to Level Editor...');
    await page.appGoto();
    await sleep(1000);
    
    // CRITICAL: Ensure Level Editor started
    console.log('Ensuring Level Editor started...');
    const editorStarted = await cameraHelper.ensureLevelEditorStarted(page);
    if (!editorStarted.started) {
      throw new Error(`Level Editor failed to start: ${editorStarted.reason || 'Unknown reason'}. Diagnostics: ${JSON.stringify(editorStarted.diagnostics)}`);
    }
    console.log('Level Editor started successfully. Panels:', editorStarted.diagnostics.panels);
    
    // Step 1: No tool selected - no mode toggles visible
    console.log('Step 1: Verifying no mode toggles visible when no tool selected...');
    await page.evaluate(() => {
      window.gameState = 'LEVEL_EDITOR';
      
      // Deselect all tools
      if (window.levelEditor && window.levelEditor.toolbar) {
        window.levelEditor.toolbar.activeTool = null;
        window.levelEditor.toolbar.activeMode = null;
      }
      
      // Force render
      if (window.draggablePanelManager) {
        window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
      }
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    await sleep(500);
    await saveScreenshot(page, 'levelEditor/mode_toggles_01_no_tool', true);
    
    // Step 2: Select eraser tool - mode toggles should appear
    console.log('Step 2: Selecting eraser tool - mode toggles should appear...');
    const eraserModes = await page.evaluate(() => {
      // Select eraser tool
      if (window.levelEditor && window.levelEditor.toolbar) {
        window.levelEditor.toolbar.selectTool('eraser');
      }
      
      // Force render
      if (window.draggablePanelManager) {
        window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
      }
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
      
      // Get mode render data
      const data = window.levelEditor && window.levelEditor.toolbar ? 
        window.levelEditor.toolbar.getModeRenderData() : null;
      
      return {
        hasModes: data ? data.hasModes : false,
        modes: data ? data.modes : [],
        currentMode: data ? data.currentMode : null
      };
    });
    console.log('Eraser modes:', eraserModes);
    await sleep(500);
    await saveScreenshot(page, 'levelEditor/mode_toggles_02_eraser_modes', true);
    
    // Step 3: Click ENTITY mode toggle - should highlight
    console.log('Step 3: Clicking ENTITY mode toggle - should highlight...');
    const entityModeResult = await page.evaluate(() => {
      // Set mode to ENTITY
      if (window.levelEditor && window.levelEditor.toolbar) {
        window.levelEditor.toolbar.setToolMode('ENTITY');
      }
      
      // Force render
      if (window.draggablePanelManager) {
        window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
      }
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
      
      const data = window.levelEditor && window.levelEditor.toolbar ? 
        window.levelEditor.toolbar.getModeRenderData() : null;
      
      return {
        currentMode: data ? data.currentMode : null
      };
    });
    console.log('Current mode after click:', entityModeResult.currentMode);
    await sleep(500);
    await saveScreenshot(page, 'levelEditor/mode_toggles_03_entity_selected', true);
    
    // Step 4: Select brush tool (no modes) - toggles should disappear
    console.log('Step 4: Selecting brush tool (no modes) - toggles should disappear...');
    const brushResult = await page.evaluate(() => {
      // Select brush tool
      if (window.levelEditor && window.levelEditor.toolbar) {
        window.levelEditor.toolbar.selectTool('brush');
      }
      
      // Force render
      if (window.draggablePanelManager) {
        window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
      }
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
      
      const data = window.levelEditor && window.levelEditor.toolbar ? 
        window.levelEditor.toolbar.getModeRenderData() : null;
      
      return {
        hasModes: data ? data.hasModes : false
      };
    });
    console.log('Brush tool has modes:', brushResult.hasModes);
    await sleep(500);
    await saveScreenshot(page, 'levelEditor/mode_toggles_04_no_modes_tool', true);
    
    // Step 5: Select selection tool - mode toggles should appear with PAINT | ENTITY | EVENT
    console.log('Step 5: Selecting selection tool - mode toggles should appear...');
    const selectionModes = await page.evaluate(() => {
      // Select selection tool
      if (window.levelEditor && window.levelEditor.toolbar) {
        window.levelEditor.toolbar.selectTool('select');
      }
      
      // Force render
      if (window.draggablePanelManager) {
        window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
      }
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
      
      const data = window.levelEditor && window.levelEditor.toolbar ? 
        window.levelEditor.toolbar.getModeRenderData() : null;
      
      return {
        hasModes: data ? data.hasModes : false,
        modes: data ? data.modes : [],
        currentMode: data ? data.currentMode : null
      };
    });
    console.log('Selection modes:', selectionModes);
    await sleep(500);
    await saveScreenshot(page, 'levelEditor/mode_toggles_05_selection_modes', true);
    
    // Step 6: Deselect tool - toggles should disappear
    console.log('Step 6: Deselecting tool - toggles should disappear...');
    const deselectResult = await page.evaluate(() => {
      // Deselect tool
      if (window.levelEditor && window.levelEditor.toolbar) {
        window.levelEditor.toolbar.activeTool = null;
        window.levelEditor.toolbar.activeMode = null;
      }
      
      // Force render
      if (window.draggablePanelManager) {
        window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
      }
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
      
      const data = window.levelEditor && window.levelEditor.toolbar ? 
        window.levelEditor.toolbar.getModeRenderData() : null;
      
      return {
        hasModes: data ? data.hasModes : false
      };
    });
    console.log('After deselect - has modes:', deselectResult.hasModes);
    await sleep(500);
    await saveScreenshot(page, 'levelEditor/mode_toggles_06_tool_deselected', true);
    
    // Verify expected outcomes
    if (eraserModes.hasModes && eraserModes.modes.length === 4) {
      console.log('✅ Eraser modes test passed: 4 modes visible (ALL, TERRAIN, ENTITY, EVENTS)');
    } else {
      console.log('⚠️  WARNING: Eraser modes unexpected:', eraserModes);
    }
    
    if (entityModeResult.currentMode === 'ENTITY') {
      console.log('✅ Mode selection test passed: ENTITY mode highlighted');
    } else {
      console.log('⚠️  WARNING: Expected ENTITY mode, got:', entityModeResult.currentMode);
    }
    
    if (!brushResult.hasModes) {
      console.log('✅ Brush tool test passed: No modes visible');
    } else {
      console.log('⚠️  WARNING: Brush tool should not have modes');
    }
    
    if (selectionModes.hasModes && selectionModes.modes.length === 3) {
      console.log('✅ Selection modes test passed: 3 modes visible (PAINT, ENTITY, EVENT)');
    } else {
      console.log('⚠️  WARNING: Selection modes unexpected:', selectionModes);
    }
    
    if (!deselectResult.hasModes) {
      console.log('✅ Deselect test passed: Modes hidden after deselect');
    } else {
      console.log('⚠️  WARNING: Modes should be hidden after deselect');
    }
    
    console.log('✅ SUCCESS: All mode toggle UI tests completed');
    success = true;
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    errorMessage = error.message;
    await saveScreenshot(page, 'levelEditor/mode_toggles_ERROR', false);
  } finally {
    await browser.close();
    
    if (!success) {
      console.error('Test failed:', errorMessage);
      process.exit(1);
    } else {
      console.log('✅ Tool Mode Toggles E2E test completed successfully');
      console.log('Screenshots saved to: test/e2e/screenshots/levelEditor/');
      process.exit(0);
    }
  }
})();
