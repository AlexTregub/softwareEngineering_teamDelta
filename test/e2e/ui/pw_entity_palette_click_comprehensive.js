/**
 * Comprehensive E2E Click Tests for EntityPalette
 * Tests all clicking scenarios to find failures
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('Loading page...');
    await page.goto('http://localhost:8000?test=1');
    await sleep(1000);
    
    // Ensure Level Editor started
    const editorStarted = await cameraHelper.ensureLevelEditorStarted(page);
    if (!editorStarted.started) {
      throw new Error('Level Editor failed to start: ' + editorStarted.error);
    }
    console.log('Level Editor started successfully\n');
    
    // Open Entity Painter panel
    await page.evaluate(() => {
      if (window.levelEditor && window.levelEditor.fileMenuBar) {
        window.levelEditor.fileMenuBar._handleTogglePanel('entity-painter');
      }
      
      window.gameState = 'LEVEL_EDITOR';
      if (window.draggablePanelManager) {
        window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
      }
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    
    await sleep(500);
    console.log('Entity Painter panel opened\n');
    
    let allPassed = true;
    const results = [];
    
    // Helper function to get panel and palette
    const getPanelAndPalette = () => {
      if (!window.levelEditor || !window.levelEditor.entityPalette) {
        return { error: 'EntityPalette not found at window.levelEditor.entityPalette' };
      }
      
      if (!window.draggablePanelManager || !window.draggablePanelManager.panels) {
        return { error: 'DraggablePanelManager not found' };
      }
      
      const panel = window.draggablePanelManager.panels.get('level-editor-entity-palette');
      if (!panel) {
        return { error: 'Panel not found with ID: level-editor-entity-palette' };
      }
      
      if (!panel.visible) {
        return { error: 'Panel exists but is not visible' };
      }
      
      return { palette: window.levelEditor.entityPalette, panel };
    };
    
    // ============================================================
    // Test 1: Click entities button (should already be selected)
    // ============================================================
    console.log('Test 1: Click entities button (should already be selected)...');
    const test1 = await page.evaluate(() => {
      // Inline helper function
      const getPanelAndPalette = () => {
        if (!window.levelEditor || !window.levelEditor.entityPalette) {
          return { error: 'EntityPalette not found' };
        }
        
        if (!window.draggablePanelManager || !window.draggablePanelManager.panels) {
          return { error: 'DraggablePanelManager not found' };
        }
        
        const panel = window.draggablePanelManager.panels.get('level-editor-entity-palette');
        if (!panel) {
          return { error: 'Panel not found with ID: level-editor-entity-palette' };
        }
        
        if (!panel.visible) {
          return { error: 'Panel exists but is not visible' };
        }
        
        return { palette: window.levelEditor.entityPalette, panel };
      };
      
      const { palette, panel, error } = getPanelAndPalette();
      if (error) {
        return { success: false, error };
      }
      
      const initialCategory = palette.getCategory();
      
      // Simulate click on entities button (left third of button row)
      const contentX = panel.x + 30; // Title bar offset
      const contentY = panel.y + panel.titleBarHeight;
      const clickX = contentX + 50; // Left side of button row
      const clickY = contentY + 15; // Middle of 30px button height
      
      const result = palette.handleClick(clickX, clickY, contentX, contentY, panel.width - 60);
      
      return {
        success: true,
        initialCategory: initialCategory,
        newCategory: palette.getCategory(),
        result: result,
        clickCoords: { x: clickX, y: clickY, contentX, contentY }
      };
    });
    
    if (!test1.success) {
      console.log(`Test 1: FAIL - ${test1.error}\n`);
      results.push({ test: 1, passed: false });
      allPassed = false;
    } else {
      console.log(`Initial category: ${test1.initialCategory}`);
      console.log(`Result: ${JSON.stringify(test1.result)}`);
      console.log(`New category: ${test1.newCategory}`);
      console.log(`Click coords: ${JSON.stringify(test1.clickCoords)}`);
      console.log('Test 1: PASS\n');
      results.push({ test: 1, passed: true });
    }
    
    await saveScreenshot(page, 'entity_palette_click/test1_entities_click', test1.success);
    await sleep(500);
    
    // ============================================================
    // Test 2: Click buildings button
    // ============================================================
    console.log('Test 2: Click buildings button (middle third)...');
    const test2 = await page.evaluate(() => {
      const palette = window.levelEditor.entityPalette;
      const initialCategory = palette.getCategory();
      
      let palettePanel = null;
      if (window.draggablePanelManager && window.draggablePanelManager.panels) {
        for (const panel of window.draggablePanelManager.panels) {
          if (panel.id === 'entity-palette-panel') {
            palettePanel = panel;
            break;
          }
        }
      }
      
      const contentX = palettePanel.x + 30;
      const contentY = palettePanel.y + palettePanel.titleBarHeight;
      const panelWidth = palettePanel.width - 60;
      const clickX = contentX + (panelWidth / 2); // Middle third
      const clickY = contentY + 15;
      
      const result = palette.handleClick(clickX, clickY, contentX, contentY, panelWidth);
      
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
      
      return {
        success: true,
        initialCategory: initialCategory,
        newCategory: palette.getCategory(),
        result: result,
        clickCoords: { x: clickX, y: clickY, contentX, contentY, panelWidth }
      };
    });
    
    console.log(`Initial category: ${test2.initialCategory}`);
    console.log(`Result: ${JSON.stringify(test2.result)}`);
    console.log(`New category: ${test2.newCategory}`);
    console.log(`Click coords: ${JSON.stringify(test2.clickCoords)}`);
    
    const test2Passed = test2.newCategory === 'buildings' && test2.result && test2.result.type === 'category';
    if (!test2Passed) {
      console.log('Test 2: FAIL - Category did not change to buildings\n');
      results.push({ test: 2, passed: false });
      allPassed = false;
    } else {
      console.log('Test 2: PASS\n');
      results.push({ test: 2, passed: true });
    }
    
    await saveScreenshot(page, 'entity_palette_click/test2_buildings_click', test2Passed);
    await sleep(500);
    
    // ============================================================
    // Test 3: Click resources button
    // ============================================================
    console.log('Test 3: Click resources button (right third)...');
    const test3 = await page.evaluate(() => {
      const palette = window.levelEditor.entityPalette;
      const initialCategory = palette.getCategory();
      
      let palettePanel = null;
      if (window.draggablePanelManager && window.draggablePanelManager.panels) {
        for (const panel of window.draggablePanelManager.panels) {
          if (panel.id === 'entity-palette-panel') {
            palettePanel = panel;
            break;
          }
        }
      }
      
      const contentX = palettePanel.x + 30;
      const contentY = palettePanel.y + palettePanel.titleBarHeight;
      const panelWidth = palettePanel.width - 60;
      const clickX = contentX + panelWidth - 50; // Right third
      const clickY = contentY + 15;
      
      const result = palette.handleClick(clickX, clickY, contentX, contentY, panelWidth);
      
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
      
      return {
        success: true,
        initialCategory: initialCategory,
        newCategory: palette.getCategory(),
        result: result,
        clickCoords: { x: clickX, y: clickY, contentX, contentY, panelWidth }
      };
    });
    
    console.log(`Initial category: ${test3.initialCategory}`);
    console.log(`Result: ${JSON.stringify(test3.result)}`);
    console.log(`New category: ${test3.newCategory}`);
    console.log(`Click coords: ${JSON.stringify(test3.clickCoords)}`);
    
    const test3Passed = test3.newCategory === 'resources' && test3.result && test3.result.type === 'category';
    if (!test3Passed) {
      console.log('Test 3: FAIL - Category did not change to resources\n');
      results.push({ test: 3, passed: false });
      allPassed = false;
    } else {
      console.log('Test 3: PASS\n');
      results.push({ test: 3, passed: true });
    }
    
    await saveScreenshot(page, 'entity_palette_click/test3_resources_click', test3Passed);
    await sleep(500);
    
    // ============================================================
    // Test 4: Click template in grid
    // ============================================================
    console.log('Test 4: Click first template in grid...');
    const test4 = await page.evaluate(() => {
      const palette = window.levelEditor.entityPalette;
      palette.setCategory('entities'); // Reset to entities
      const initialSelected = palette.getSelectedTemplateId();
      
      let palettePanel = null;
      if (window.draggablePanelManager && window.draggablePanelManager.panels) {
        for (const panel of window.draggablePanelManager.panels) {
          if (panel.id === 'entity-palette-panel') {
            palettePanel = panel;
            break;
          }
        }
      }
      
      const contentX = palettePanel.x + 30;
      const contentY = palettePanel.y + palettePanel.titleBarHeight;
      const panelWidth = palettePanel.width - 60;
      
      // Click first template (below 30px buttons + 4px padding)
      const clickX = contentX + 4 + 16; // Padding + half of 32px swatch
      const clickY = contentY + 30 + 4 + 16; // Button height + padding + half of swatch
      
      const result = palette.handleClick(clickX, clickY, contentX, contentY, panelWidth);
      
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
      
      return {
        success: true,
        initialSelected: initialSelected,
        newSelected: palette.getSelectedTemplateId(),
        result: result,
        clickCoords: { x: clickX, y: clickY, contentX, contentY }
      };
    });
    
    console.log(`Initial selected: ${test4.initialSelected}`);
    console.log(`Result: ${JSON.stringify(test4.result)}`);
    console.log(`New selected: ${test4.newSelected}`);
    console.log(`Click coords: ${JSON.stringify(test4.clickCoords)}`);
    
    const test4Passed = test4.newSelected !== null && test4.result && test4.result.type === 'template';
    if (!test4Passed) {
      console.log('Test 4: FAIL - Template was not selected\n');
      results.push({ test: 4, passed: false });
      allPassed = false;
    } else {
      console.log('Test 4: PASS\n');
      results.push({ test: 4, passed: true });
    }
    
    await saveScreenshot(page, 'entity_palette_click/test4_template_click', test4Passed);
    await sleep(500);
    
    // ============================================================
    // Test 5: Click outside panel (should return null)
    // ============================================================
    console.log('Test 5: Click outside panel bounds...');
    const test5 = await page.evaluate(() => {
      const palette = window.levelEditor.entityPalette;
      
      let palettePanel = null;
      if (window.draggablePanelManager && window.draggablePanelManager.panels) {
        for (const panel of window.draggablePanelManager.panels) {
          if (panel.id === 'entity-palette-panel') {
            palettePanel = panel;
            break;
          }
        }
      }
      
      const contentX = palettePanel.x + 30;
      const contentY = palettePanel.y + palettePanel.titleBarHeight;
      const panelWidth = palettePanel.width - 60;
      
      // Click way outside
      const clickX = contentX + panelWidth + 100;
      const clickY = contentY + 100;
      
      const result = palette.handleClick(clickX, clickY, contentX, contentY, panelWidth);
      
      return {
        success: true,
        result: result,
        clickCoords: { x: clickX, y: clickY, contentX, contentY }
      };
    });
    
    console.log(`Result: ${JSON.stringify(test5.result)}`);
    console.log(`Click coords: ${JSON.stringify(test5.clickCoords)}`);
    
    const test5Passed = test5.result === null;
    if (!test5Passed) {
      console.log('Test 5: FAIL - Should return null for outside click\n');
      results.push({ test: 5, passed: false });
      allPassed = false;
    } else {
      console.log('Test 5: PASS\n');
      results.push({ test: 5, passed: true });
    }
    
    await saveScreenshot(page, 'entity_palette_click/test5_outside_click', test5Passed);
    
    // ============================================================
    // Print Summary
    // ============================================================
    console.log('\n============================================================');
    console.log('TEST SUMMARY');
    console.log('============================================================');
    results.forEach(r => {
      console.log(`Test ${r.test}: ${r.passed ? 'PASS ✓' : 'FAIL ✗'}`);
    });
    console.log('============================================================');
    console.log(`Overall: ${allPassed ? 'ALL TESTS PASSED ✓' : 'SOME TESTS FAILED ✗'}`);
    console.log('============================================================');
    
    await browser.close();
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    console.error('Test error:', error);
    await saveScreenshot(page, 'entity_palette_click/error', false);
    await browser.close();
    process.exit(1);
  }
})();
