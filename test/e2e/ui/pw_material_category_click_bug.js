const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

/**
 * E2E Test: Material Category Click Bug Documentation
 * 
 * This test simulates ACTUAL MOUSE CLICKS on material category headers
 * to verify that categories expand/collapse correctly when clicked.
 * 
 * Bug Report:
 * - Categories render correctly
 * - palette.toggleCategory() works programmatically
 * - BUT: Mouse clicks on category headers do nothing
 * 
 * Expected: Click on category header should toggle expand/collapse
 * Actual: Categories don't respond to mouse clicks
 */

(async () => {
  const browser = await launchBrowser();
  const page = await cameraHelper.newPageReady(browser);
  
  let success = false;
  let errorMessage = '';
  
  try {
    console.log('Navigating to Level Editor...');
    await page.appGoto();
    
    console.log('Ensuring Level Editor started...');
    const editorStarted = await cameraHelper.ensureLevelEditorStarted(page);
    
    if (!editorStarted.started) {
      throw new Error('Failed to start Level Editor');
    }
    
    console.log('Level Editor started successfully');
    
    // Step 1: Find the Material Palette panel
    console.log('\nStep 1: Locating Material Palette panel...');
    const panelInfo = await page.evaluate(() => {
      const panelManager = window.draggablePanelManager;
      if (!panelManager) {
        return { found: false, error: 'DraggablePanelManager not found' };
      }
      
      // List all panels for debugging
      const allPanelIds = Array.from(panelManager.panels.keys());
      
      // Find the material palette panel
      let materialPanel = panelManager.panels.get('level-editor-materials');
      
      if (!materialPanel) {
        return { 
          found: false, 
          error: 'Material palette panel not found',
          availablePanels: allPanelIds
        };
      }
      
      // Make sure it's visible and in the correct state
      if (!panelManager.stateVisibility['LEVEL_EDITOR']) {
        panelManager.stateVisibility['LEVEL_EDITOR'] = [];
      }
      if (!panelManager.stateVisibility['LEVEL_EDITOR'].includes('level-editor-materials')) {
        panelManager.stateVisibility['LEVEL_EDITOR'].push('level-editor-materials');
      }
      
      materialPanel.visible = true;
      
      // Force render
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      // Get actual panel position
      const panelX = materialPanel.x || 100;
      const panelY = materialPanel.y || 100;
      const panelWidth = materialPanel.width || 250;
      const panelHeight = materialPanel.height || 400;
      
      return {
        found: true,
        x: panelX,
        y: panelY,
        width: panelWidth,
        height: panelHeight,
        contentX: panelX + 10,
        contentY: panelY + 30, // Below header
        visible: materialPanel.visible,
        hasContent: !!materialPanel.content
      };
    });
    
    if (!panelInfo.found) {
      throw new Error(panelInfo.error || 'Material panel not found');
    }
    
    console.log('Material panel found:', panelInfo);
    await sleep(500);
    await saveScreenshot(page, 'ui/category_click_01_panel_visible', true);
    
    // Step 2: Get category information
    console.log('\nStep 2: Getting category information...');
    const categoryInfo = await page.evaluate(() => {
      // Get palette from levelEditor, not from panel
      if (!window.levelEditor || !window.levelEditor.palette) {
        return { found: false, error: 'LevelEditor.palette not found' };
      }
      
      const palette = window.levelEditor.palette;
      
      if (!palette.categories || palette.categories.length === 0) {
        return { found: false, error: 'No categories loaded' };
      }
      
      // Get first category info
      const category = palette.categories[0];
      
      return {
        found: true,
        categoryId: category.id,
        categoryName: category.name,
        isExpanded: category.isExpanded(),
        headerHeight: category.headerHeight || 30,
        totalCategories: palette.categories.length,
        categoryNames: palette.categories.map(c => c.name)
      };
    });
    
    if (!categoryInfo.found) {
      throw new Error(categoryInfo.error || 'Categories not found');
    }
    
    console.log('Category info:', categoryInfo);
    console.log(`First category: "${categoryInfo.categoryName}" - Expanded: ${categoryInfo.isExpanded}`);
    
    // Step 3: Calculate click coordinates for category header
    console.log('\nStep 3: Calculating click coordinates...');
    
    // Account for search bar (45px) and panel header (30px)
    const searchBarHeight = 45;
    const firstCategoryHeaderY = panelInfo.contentY + searchBarHeight;
    const clickX = panelInfo.contentX + 50; // Middle of category header
    const clickY = firstCategoryHeaderY + 15; // Middle of header (30px / 2)
    
    console.log(`Click coordinates: (${clickX}, ${clickY})`);
    console.log(`Panel content starts at: (${panelInfo.contentX}, ${panelInfo.contentY})`);
    console.log(`Category header should be at Y: ${firstCategoryHeaderY}`);
    
    // Step 4: Click on category header
    console.log('\nStep 4: Clicking on category header...');
    const initialState = categoryInfo.isExpanded;
    console.log(`Initial state: ${initialState ? 'EXPANDED' : 'COLLAPSED'}`);
    
    await page.mouse.click(clickX, clickY);
    await sleep(500);
    
    // Check if state changed
    const afterClickInfo = await page.evaluate(() => {
      if (!window.levelEditor || !window.levelEditor.palette) {
        return { found: false };
      }
      
      const palette = window.levelEditor.palette;
      const category = palette.categories[0];
      
      return {
        found: true,
        isExpanded: category.isExpanded(),
        categoryName: category.name
      };
    });
    
    console.log(`After click state: ${afterClickInfo.isExpanded ? 'EXPANDED' : 'COLLAPSED'}`);
    
    await saveScreenshot(page, 'ui/category_click_02_after_first_click', afterClickInfo.isExpanded !== initialState);
    
    // Step 5: Verify state changed
    console.log('\nStep 5: Verifying state change...');
    if (afterClickInfo.isExpanded === initialState) {
      console.log('⚠️  BUG CONFIRMED: Category state did NOT change after click!');
      console.log(`Expected: ${!initialState ? 'EXPANDED' : 'COLLAPSED'}`);
      console.log(`Actual: ${afterClickInfo.isExpanded ? 'EXPANDED' : 'COLLAPSED'}`);
      throw new Error('Category did not respond to mouse click - BUG CONFIRMED');
    }
    
    console.log('✅ Category state changed correctly!');
    
    // Step 6: Click again to toggle back
    console.log('\nStep 6: Clicking again to toggle back...');
    await page.mouse.click(clickX, clickY);
    await sleep(500);
    
    const afterSecondClickInfo = await page.evaluate(() => {
      const palette = window.levelEditor.palette;
      const category = palette.categories[0];
      
      return {
        isExpanded: category.isExpanded()
      };
    });
    
    console.log(`After second click state: ${afterSecondClickInfo.isExpanded ? 'EXPANDED' : 'COLLAPSED'}`);
    
    if (afterSecondClickInfo.isExpanded !== initialState) {
      console.log('⚠️  BUG: Category did not toggle back to initial state!');
      throw new Error('Category toggle not working correctly');
    }
    
    await saveScreenshot(page, 'ui/category_click_03_after_second_click', true);
    
    console.log('✅ SUCCESS: Category click handling works correctly!');
    success = true;
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    errorMessage = error.message;
    await saveScreenshot(page, 'ui/category_click_ERROR', false);
  } finally {
    await browser.close();
    
    if (!success) {
      console.error('\n🐛 BUG CONFIRMED:', errorMessage);
      console.log('\nExpected Behavior:');
      console.log('- Click on category header should toggle expand/collapse');
      console.log('- Category state should change after each click');
      console.log('\nActual Behavior:');
      console.log('- Category state does NOT change when clicking header');
      console.log('- Mouse clicks are not being handled by MaterialPalette.handleClick()');
      console.log('\nRoot Cause:');
      console.log('- MaterialPalette.handleClick() does not delegate to category.handleClick()');
      console.log('- Click coordinates need to account for panel position and scroll offset');
      process.exit(1);
    } else {
      console.log('\n✅ Material Category Click test completed successfully');
      console.log('Screenshots saved to: test/e2e/screenshots/ui/');
      process.exit(0);
    }
  }
})();
