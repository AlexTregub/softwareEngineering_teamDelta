/**
 * Entity Palette UI Rendering - E2E Tests
 * Tests CategoryRadioButtons and template grid rendering in real browser
 * CRITICAL: Uses ensureLevelEditorStarted to bypass main menu
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  let allTestsPassed = true;
  const testResults = [];

  try {
    await page.goto('http://localhost:8000?test=1');
    console.log('Page loaded');
    await sleep(1000); // Wait for initial load

    // CRITICAL: Ensure Level Editor started (not main menu)
    const editorStarted = await cameraHelper.ensureLevelEditorStarted(page);
    if (!editorStarted.started) {
      throw new Error(`Level Editor failed to start: ${editorStarted.reason || 'Unknown reason'}`);
    }
    console.log('Level Editor started successfully');
    await sleep(1000); // Wait for editor to stabilize

    // ============================================================================
    // TEST 1: Panel shows CategoryRadioButtons (🐜🏠🌳 visible)
    // ============================================================================
    console.log('\nTest 1: Panel shows CategoryRadioButtons...');
    const test1Result = await page.evaluate(() => {
      // Open Entity Painter panel via View menu
      if (window.levelEditor && window.levelEditor.fileMenuBar) {
        window.levelEditor.fileMenuBar._handleTogglePanel('entity-painter');
      }
      
      // Force rendering
      window.gameState = 'LEVEL_EDITOR';
      if (window.draggablePanelManager) {
        window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
      }
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
      
      // Check CategoryRadioButtons exists - CORRECT PATH
      const palette = window.levelEditor?.entityPalette;
      if (!palette) return { success: false, error: 'EntityPalette not found at window.levelEditor.entityPalette' };
      if (!palette.categoryButtons) return { success: false, error: 'CategoryRadioButtons not found' };
      
      return { success: true, categories: palette.categoryButtons.categories.length };
    });
    
    await sleep(500);
    await saveScreenshot(page, 'entity_palette_ui/category_radio_buttons', test1Result.success);
    testResults.push({ test: 1, name: 'CategoryRadioButtons visible', ...test1Result });
    if (!test1Result.success) allTestsPassed = false;
    console.log(`Test 1: ${test1Result.success ? 'PASS' : 'FAIL'} - ${test1Result.error || ''}`);

    // ============================================================================
    // TEST 2: Panel shows template grid with entity templates
    // ============================================================================
    console.log('\nTest 2: Panel shows template grid...');
    const test2Result = await page.evaluate(() => {
      const palette = window.levelEditor?.entityPalette;
      if (!palette) return { success: false, error: 'EntityPalette not found' };
      
      const templates = palette.getCurrentTemplates();
      if (templates.length === 0) return { success: false, error: 'No templates found' };
      
      // Verify category is entities
      if (palette.getCategory() !== 'entities') {
        return { success: false, error: 'Not in entities category' };
      }
      
      return { success: true, templateCount: templates.length };
    });
    
    await sleep(500);
    await saveScreenshot(page, 'entity_palette_ui/template_grid', test2Result.success);
    testResults.push({ test: 2, name: 'Template grid rendered', ...test2Result });
    if (!test2Result.success) allTestsPassed = false;
    console.log(`Test 2: ${test2Result.success ? 'PASS' : 'FAIL'} - ${test2Result.error || ''}`);

    // ============================================================================
    // TEST 3: Clicking 🏠 button switches to buildings category
    // ============================================================================
    console.log('\nTest 3: Clicking buildings button...');
    const test3Result = await page.evaluate(() => {
      const palette = window.levelEditor?.entityPalette;
      if (!palette) return { success: false, error: 'EntityPalette not found' };
      
      // Click buildings button
      palette.categoryButtons.select('buildings');
      
      // Force redraw
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
      
      // Verify category changed
      const category = palette.getCategory();
      const templates = palette.getCurrentTemplates();
      
      return { 
        success: category === 'buildings' && templates.length === 3,
        category: category,
        templateCount: templates.length
      };
    });
    
    await sleep(500);
    await saveScreenshot(page, 'entity_palette_ui/buildings_category', test3Result.success);
    testResults.push({ test: 3, name: 'Buildings category switch', ...test3Result });
    if (!test3Result.success) allTestsPassed = false;
    console.log(`Test 3: ${test3Result.success ? 'PASS' : 'FAIL'}`);

    // ============================================================================
    // TEST 4: Clicking template highlights it with yellow border
    // ============================================================================
    console.log('\nTest 4: Clicking template for selection...');
    const test4Result = await page.evaluate(() => {
      const palette = window.levelEditor?.entityPalette;
      if (!palette) return { success: false, error: 'EntityPalette not found' };
      
      // Switch back to entities
      palette.setCategory('entities');
      
      // Select first template
      palette.selectTemplate('ant_worker');
      
      // Force redraw
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
      
      // Verify selection
      const selectedId = palette.getSelectedTemplateId();
      const hasSelection = palette.hasSelection();
      
      return { 
        success: selectedId === 'ant_worker' && hasSelection,
        selectedId: selectedId
      };
    });
    
    await sleep(500);
    await saveScreenshot(page, 'entity_palette_ui/template_selected', test4Result.success);
    testResults.push({ test: 4, name: 'Template selection highlight', ...test4Result });
    if (!test4Result.success) allTestsPassed = false;
    console.log(`Test 4: ${test4Result.success ? 'PASS' : 'FAIL'}`);

    // ============================================================================
    // TEST 5: Panel resizes when switching categories
    // ============================================================================
    console.log('\nTest 5: Panel auto-resizing...');
    const test5Result = await page.evaluate(() => {
      const palette = window.levelEditor?.entityPalette;
      if (!palette) return { success: false, error: 'EntityPalette not found' };
      
      // Get size for entities (7 templates)
      palette.setCategory('entities');
      const entitiesSize = palette.getContentSize(300);
      
      // Get size for buildings (3 templates)
      palette.setCategory('buildings');
      const buildingsSize = palette.getContentSize(300);
      
      // Force redraw
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
      
      // Sizes should be the same (both fit in 1 row)
      return { 
        success: entitiesSize.height === buildingsSize.height,
        entitiesHeight: entitiesSize.height,
        buildingsHeight: buildingsSize.height
      };
    });
    
    await sleep(500);
    await saveScreenshot(page, 'entity_palette_ui/panel_resizing', test5Result.success);
    testResults.push({ test: 5, name: 'Panel auto-resizing', ...test5Result });
    if (!test5Result.success) allTestsPassed = false;
    console.log(`Test 5: ${test5Result.success ? 'PASS' : 'FAIL'}`);

    // ============================================================================
    // TEST 6: Multiple template clicks work correctly
    // ============================================================================
    console.log('\nTest 6: Multiple template clicks...');
    const test6Result = await page.evaluate(() => {
      const palette = window.levelEditor?.entityPalette;
      if (!palette) return { success: false, error: 'EntityPalette not found' };
      
      palette.setCategory('entities');
      
      // Click multiple templates
      palette.selectTemplate('ant_worker');
      palette.selectTemplate('ant_soldier');
      palette.selectTemplate('ant_scout');
      
      // Force redraw
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
      
      // Last clicked should be selected
      const selectedId = palette.getSelectedTemplateId();
      
      return { 
        success: selectedId === 'ant_scout',
        selectedId: selectedId
      };
    });
    
    await sleep(500);
    await saveScreenshot(page, 'entity_palette_ui/multiple_clicks', test6Result.success);
    testResults.push({ test: 6, name: 'Multiple template clicks', ...test6Result });
    if (!test6Result.success) allTestsPassed = false;
    console.log(`Test 6: ${test6Result.success ? 'PASS' : 'FAIL'}`);

    // ============================================================================
    // TEST 7: Clicking 🌳 button switches to resources category
    // ============================================================================
    console.log('\nTest 7: Clicking resources button...');
    const test7Result = await page.evaluate(() => {
      const palette = window.levelEditor?.entityPalette;
      if (!palette) return { success: false, error: 'EntityPalette not found' };
      
      // Click resources button
      palette.categoryButtons.select('resources');
      
      // Force redraw
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
      
      // Verify category changed
      const category = palette.getCategory();
      const templates = palette.getCurrentTemplates();
      
      return { 
        success: category === 'resources' && templates.length === 4,
        category: category,
        templateCount: templates.length
      };
    });
    
    await sleep(500);
    await saveScreenshot(page, 'entity_palette_ui/resources_category', test7Result.success);
    testResults.push({ test: 7, name: 'Resources category switch', ...test7Result });
    if (!test7Result.success) allTestsPassed = false;
    console.log(`Test 7: ${test7Result.success ? 'PASS' : 'FAIL'}`);

    // ============================================================================
    // Print Summary
    // ============================================================================
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    testResults.forEach(result => {
      console.log(`Test ${result.test} (${result.name}): ${result.success ? 'PASS ✓' : 'FAIL ✗'}`);
    });
    console.log('='.repeat(60));
    console.log(`Overall: ${allTestsPassed ? 'ALL TESTS PASSED ✓' : 'SOME TESTS FAILED ✗'}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Fatal error during tests:', error);
    allTestsPassed = false;
    await saveScreenshot(page, 'entity_palette_ui/fatal_error', false);
  } finally {
    await browser.close();
    process.exit(allTestsPassed ? 0 : 1);
  }
})();
