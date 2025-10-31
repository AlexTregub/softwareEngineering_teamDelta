/**
 * Comprehensive E2E Click Tests for EntityPalette
 * Tests clicking on category buttons and templates
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
    const panelOpened = await page.evaluate(() => {
      // Try toggling via menu bar
      if (window.levelEditor && window.levelEditor.fileMenuBar) {
        window.levelEditor.fileMenuBar._handleTogglePanel('entity-painter');
      }
      
      // Force panel visible
      if (window.draggablePanelManager) {
        const panel = window.draggablePanelManager.panels.get('level-editor-entity-palette');
        if (panel) {
          panel.visible = true;
        }
      }
      
      window.gameState = 'LEVEL_EDITOR';
      if (window.draggablePanelManager) {
        window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
      }
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
      
      // Check if panel is now visible
      const panel = window.draggablePanelManager?.panels?.get('level-editor-entity-palette');
      return {
        panelExists: !!panel,
        panelVisible: panel?.visible || false
      };
    });
    
    await sleep(500);
    console.log(`Entity Painter panel opened - exists: ${panelOpened.panelExists}, visible: ${panelOpened.panelVisible}\n`);
    
    let allPassed = true;
    const results = [];
    
    // ============================================================
    // Test 1: Verify panel is visible and accessible
    // ============================================================
    console.log('Test 1: Verify panel is visible...');
    const test1 = await page.evaluate(() => {
      if (!window.levelEditor || !window.levelEditor.entityPalette) {
        return { success: false, error: 'EntityPalette not found' };
      }
      
      if (!window.draggablePanelManager || !window.draggablePanelManager.panels) {
        return { success: false, error: 'DraggablePanelManager not found' };
      }
      
      const panel = window.draggablePanelManager.panels.get('level-editor-entity-palette');
      if (!panel) {
        return { success: false, error: 'Panel not found with ID: level-editor-entity-palette' };
      }
      
      if (!panel.visible) {
        return { success: false, error: 'Panel exists but is not visible' };
      }
      
      return {
        success: true,
        panelInfo: {
          x: panel.config?.position?.x,
          y: panel.config?.position?.y,
          width: panel.config?.size?.width,
          height: panel.config?.size?.height,
          titleBarHeight: 30 // Standard title bar height
        }
      };
    });
    
    if (!test1.success) {
      console.log(`Test 1: FAIL - ${test1.error}\n`);
      results.push({ test: 1, name: 'Panel Visibility', passed: false });
      allPassed = false;
    } else {
      console.log(`Panel info: ${JSON.stringify(test1.panelInfo)}`);
      console.log('Test 1: PASS\n');
      results.push({ test: 1, name: 'Panel Visibility', passed: true });
    }
    
    await saveScreenshot(page, 'entity_palette_click/test1_panel_visible', test1.success);
    await sleep(300);
    
    // ============================================================
    // Test 2: Click entities button (should already be selected)
    // ============================================================
    console.log('Test 2: Click entities button (left button)...');
    const test2 = await page.evaluate(() => {
      const palette = window.levelEditor.entityPalette;
      const panel = window.draggablePanelManager.panels.get('level-editor-entity-palette');
      
      const initialCategory = palette.getCategory();
      
      // Calculate click position for entities button (left third)
      const contentX = panel.config.position.x + 30;
      const contentY = panel.config.position.y + 30; // 30px title bar
      const panelWidth = panel.config.size.width - 60;
      const buttonWidth = panelWidth / 3;
      
      // Click in middle of first button
      const clickX = contentX + (buttonWidth / 2);
      const clickY = contentY + 15; // Middle of 30px button
      
      const result = palette.handleClick(clickX, clickY, contentX, contentY, panelWidth);
      
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
      
      return {
        success: true,
        initialCategory,
        newCategory: palette.getCategory(),
        result: result,
        clickCoords: { clickX, clickY, contentX, contentY, panelWidth, buttonWidth }
      };
    });
    
    console.log(`Initial category: ${test2.initialCategory}`);
    console.log(`New category: ${test2.newCategory}`);
    console.log(`Result: ${JSON.stringify(test2.result)}`);
    console.log(`Click coords: ${JSON.stringify(test2.clickCoords)}`);
    
    const test2Passed = test2.newCategory === 'entities';
    if (!test2Passed) {
      console.log('Test 2: FAIL - Category is not entities\n');
      results.push({ test: 2, name: 'Entities Button Click', passed: false });
      allPassed = false;
    } else {
      console.log('Test 2: PASS\n');
      results.push({ test: 2, name: 'Entities Button Click', passed: true });
    }
    
    await saveScreenshot(page, 'entity_palette_click/test2_entities_click', test2Passed);
    await sleep(300);
    
    // ============================================================
    // Test 3: Click buildings button
    // ============================================================
    console.log('Test 3: Click buildings button (middle button)...');
    const test3 = await page.evaluate(() => {
      const palette = window.levelEditor.entityPalette;
      const panel = window.draggablePanelManager.panels.get('level-editor-entity-palette');
      
      const initialCategory = palette.getCategory();
      
      const contentX = panel.config.position.x + 30;
      const contentY = panel.config.position.y + 30;
      const panelWidth = panel.config.size.width - 60;
      const buttonWidth = panelWidth / 3;
      
      // Click in middle of second button
      const clickX = contentX + buttonWidth + (buttonWidth / 2);
      const clickY = contentY + 15;
      
      const result = palette.handleClick(clickX, clickY, contentX, contentY, panelWidth);
      
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
      
      return {
        success: true,
        initialCategory,
        newCategory: palette.getCategory(),
        result: result,
        clickCoords: { clickX, clickY, buttonWidth }
      };
    });
    
    console.log(`Initial category: ${test3.initialCategory}`);
    console.log(`New category: ${test3.newCategory}`);
    console.log(`Result: ${JSON.stringify(test3.result)}`);
    
    const test3Passed = test3.newCategory === 'buildings' && test3.result?.type === 'category';
    if (!test3Passed) {
      console.log('Test 3: FAIL - Category did not change to buildings\n');
      results.push({ test: 3, name: 'Buildings Button Click', passed: false });
      allPassed = false;
    } else {
      console.log('Test 3: PASS\n');
      results.push({ test: 3, name: 'Buildings Button Click', passed: true });
    }
    
    await saveScreenshot(page, 'entity_palette_click/test3_buildings_click', test3Passed);
    await sleep(300);
    
    // ============================================================
    // Test 4: Click resources button
    // ============================================================
    console.log('Test 4: Click resources button (right button)...');
    const test4 = await page.evaluate(() => {
      const palette = window.levelEditor.entityPalette;
      const panel = window.draggablePanelManager.panels.get('level-editor-entity-palette');
      
      const initialCategory = palette.getCategory();
      
      const contentX = panel.config.position.x + 30;
      const contentY = panel.config.position.y + 30;
      const panelWidth = panel.config.size.width - 60;
      const buttonWidth = panelWidth / 3;
      
      // Click in middle of third button
      const clickX = contentX + (buttonWidth * 2) + (buttonWidth / 2);
      const clickY = contentY + 15;
      
      const result = palette.handleClick(clickX, clickY, contentX, contentY, panelWidth);
      
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
      
      return {
        success: true,
        initialCategory,
        newCategory: palette.getCategory(),
        result: result
      };
    });
    
    console.log(`Initial category: ${test4.initialCategory}`);
    console.log(`New category: ${test4.newCategory}`);
    console.log(`Result: ${JSON.stringify(test4.result)}`);
    
    const test4Passed = test4.newCategory === 'resources' && test4.result?.type === 'category';
    if (!test4Passed) {
      console.log('Test 4: FAIL - Category did not change to resources\n');
      results.push({ test: 4, name: 'Resources Button Click', passed: false });
      allPassed = false;
    } else {
      console.log('Test 4: PASS\n');
      results.push({ test: 4, name: 'Resources Button Click', passed: true });
    }
    
    await saveScreenshot(page, 'entity_palette_click/test4_resources_click', test4Passed);
    await sleep(300);
    
    // ============================================================
    // Test 5: Click template in grid
    // ============================================================
    console.log('Test 5: Click first template in entities category...');
    const test5 = await page.evaluate(() => {
      const palette = window.levelEditor.entityPalette;
      const panel = window.draggablePanelManager.panels.get('level-editor-entity-palette');
      
      // Switch back to entities
      palette.setCategory('entities');
      const initialSelected = palette.getSelectedTemplateId();
      
      const contentX = panel.config.position.x + 30;
      const contentY = panel.config.position.y + 30;
      const panelWidth = panel.config.size.width - 60;
      const buttonHeight = palette.categoryButtons ? palette.categoryButtons.height : 30;
      
      // Click first template (below buttons + padding)
      const clickX = contentX + 4 + 16; // padding + half swatch
      const clickY = contentY + buttonHeight + 4 + 16; // button + padding + half swatch
      
      const result = palette.handleClick(clickX, clickY, contentX, contentY, panelWidth);
      
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
      
      return {
        success: true,
        initialSelected,
        newSelected: palette.getSelectedTemplateId(),
        result: result,
        clickCoords: { clickX, clickY, buttonHeight }
      };
    });
    
    console.log(`Initial selected: ${test5.initialSelected}`);
    console.log(`New selected: ${test5.newSelected}`);
    console.log(`Result: ${JSON.stringify(test5.result)}`);
    
    const test5Passed = test5.newSelected !== null && test5.result?.type === 'template';
    if (!test5Passed) {
      console.log('Test 5: FAIL - Template was not selected\n');
      results.push({ test: 5, name: 'Template Click', passed: false });
      allPassed = false;
    } else {
      console.log('Test 5: PASS\n');
      results.push({ test: 5, name: 'Template Click', passed: true });
    }
    
    await saveScreenshot(page, 'entity_palette_click/test5_template_click', test5Passed);
    await sleep(300);
    
    // ============================================================
    // Print Summary
    // ============================================================
    console.log('\n============================================================');
    console.log('TEST SUMMARY');
    console.log('============================================================');
    results.forEach(r => {
      console.log(`Test ${r.test} (${r.name}): ${r.passed ? 'PASS ✓' : 'FAIL ✗'}`);
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
