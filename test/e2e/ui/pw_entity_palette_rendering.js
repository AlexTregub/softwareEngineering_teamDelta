/**
 * E2E Test: Entity Palette Rendering
 * Tests if the Entity Palette is actually being rendered on screen
 * 
 * Purpose: Verify rendering pipeline:
 * 1. Is render() being called?
 * 2. Are category buttons visible?
 * 3. Are entity templates visible?
 * 4. Is the panel actually drawing to canvas?
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('[E2E] Loading Level Editor...');
    await page.goto('http://localhost:8000?test=1');
    
    const editorStarted = await cameraHelper.ensureLevelEditorStarted(page);
    if (!editorStarted.started) {
      throw new Error(`Failed to start Level Editor: ${editorStarted.message}`);
    }
    console.log('[E2E] ✓ Level Editor started');
    await sleep(500);
    
    // Test 1: Open Entity Palette panel
    console.log('\n[TEST 1] Opening Entity Palette panel...');
    const opened = await page.evaluate(() => {
      // Try to open via FileMenuBar
      if (window.FileMenuBar && window.FileMenuBar._handleTogglePanel) {
        window.FileMenuBar._handleTogglePanel('entity-painter');
        return { success: true, method: 'FileMenuBar' };
      }
      
      // Fallback: direct panel state
      if (window.levelEditor && window.levelEditor.panels && window.levelEditor.panels.entityPalette) {
        const panel = window.levelEditor.panels.entityPalette;
        if (panel.state) {
          panel.state.visible = true;
          return { success: true, method: 'Direct' };
        }
      }
      
      return { success: false };
    });
    
    console.log('[TEST 1] Opened:', opened.success);
    
    if (!opened.success) {
      await saveScreenshot(page, 'entity_palette_rendering/test1_cannot_open', false);
      throw new Error('TEST 1 FAILED: Cannot open panel');
    }
    
    await sleep(300);
    
    // Force redraw
    await page.evaluate(() => {
      if (window.draggablePanelManager) {
        window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
      }
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    await sleep(500);
    
    await saveScreenshot(page, 'entity_palette_rendering/test1_panel_opened', true);
    
    // Test 2: Check if render() method is being called
    console.log('\n[TEST 2] Checking if render() is called...');
    const renderCalled = await page.evaluate(() => {
      if (!window.levelEditor || !window.levelEditor.entityPalette) {
        return { called: false, reason: 'EntityPalette not found' };
      }
      
      const palette = window.levelEditor.entityPalette;
      
      // Spy on render method
      let renderCallCount = 0;
      const originalRender = palette.render;
      
      if (typeof originalRender !== 'function') {
        return { called: false, reason: 'render() not a function' };
      }
      
      palette.render = function(...args) {
        renderCallCount++;
        console.log('[EntityPalette] render() called with:', args);
        return originalRender.apply(this, args);
      };
      
      // Force a redraw
      if (window.levelEditor.panels && window.levelEditor.panels.render) {
        window.levelEditor.panels.render();
      }
      
      return {
        called: renderCallCount > 0,
        callCount: renderCallCount
      };
    });
    
    console.log('[TEST 2] Render called:', JSON.stringify(renderCalled, null, 2));
    await saveScreenshot(page, 'entity_palette_rendering/test2_render_check', renderCalled.called);
    
    // Test 3: Check LevelEditorPanels render integration
    console.log('\n[TEST 3] Checking LevelEditorPanels render integration...');
    const panelsRender = await page.evaluate(() => {
      if (!window.levelEditor || !window.levelEditor.panels) {
        return { integrated: false, reason: 'LevelEditorPanels not found' };
      }
      
      const panels = window.levelEditor.panels;
      
      // Check if entityPalette is in panels object
      const hasPanel = !!panels.entityPalette;
      const panelVisible = hasPanel && panels.entityPalette.state && panels.entityPalette.state.visible;
      
      // Check if render() method exists on panels
      const hasRenderMethod = typeof panels.render === 'function';
      
      // Try to find where EntityPalette.render() is called in LevelEditorPanels.render()
      let renderMethodCalls = false;
      if (hasRenderMethod) {
        const renderSource = panels.render.toString();
        renderMethodCalls = renderSource.includes('entityPalette');
      }
      
      return {
        integrated: hasPanel && panelVisible && hasRenderMethod,
        hasPanel,
        panelVisible,
        hasRenderMethod,
        renderMethodCalls,
        panelPosition: hasPanel && panels.entityPalette.state ? panels.entityPalette.state.position : null
      };
    });
    
    console.log('[TEST 3] Panels render:', JSON.stringify(panelsRender, null, 2));
    
    if (!panelsRender.integrated) {
      await saveScreenshot(page, 'entity_palette_rendering/test3_not_integrated', false);
      throw new Error(`TEST 3 FAILED: ${panelsRender.reason || 'Not integrated'}`);
    }
    
    // Test 4: Check what's actually being rendered
    console.log('\n[TEST 4] Checking rendered content...');
    const renderedContent = await page.evaluate(() => {
      if (!window.levelEditor || !window.levelEditor.entityPalette) {
        return { hasContent: false, reason: 'EntityPalette not found' };
      }
      
      const palette = window.levelEditor.entityPalette;
      
      return {
        hasContent: true,
        currentCategory: palette.currentCategory,
        hasCategoryButtons: !!palette.categoryButtons,
        categoryCount: palette.categories ? palette.categories.length : 0,
        hasTemplates: palette.templates && palette.templates.length > 0,
        templateCount: palette.templates ? palette.templates.length : 0,
        scrollOffset: palette.scrollOffset || 0,
        viewportHeight: palette.viewportHeight || 0
      };
    });
    
    console.log('[TEST 4] Rendered content:', JSON.stringify(renderedContent, null, 2));
    await saveScreenshot(page, 'entity_palette_rendering/test4_content_check', renderedContent.hasContent);
    
    // Test 5: Check category buttons specifically
    console.log('\n[TEST 5] Checking category buttons...');
    const categoryButtons = await page.evaluate(() => {
      if (!window.levelEditor || !window.levelEditor.entityPalette) {
        return { exists: false, reason: 'EntityPalette not found' };
      }
      
      const palette = window.levelEditor.entityPalette;
      const buttons = palette.categoryButtons;
      
      if (!buttons) {
        return { exists: false, reason: 'categoryButtons not found' };
      }
      
      return {
        exists: true,
        hasRender: typeof buttons.render === 'function',
        hasHandleClick: typeof buttons.handleClick === 'function',
        height: buttons.height || 'unknown',
        categories: buttons.categories ? buttons.categories.map(c => ({
          id: c.id,
          label: c.label,
          selected: c.id === buttons.selectedCategory
        })) : []
      };
    });
    
    console.log('[TEST 5] Category buttons:', JSON.stringify(categoryButtons, null, 2));
    await saveScreenshot(page, 'entity_palette_rendering/test5_category_buttons', categoryButtons.exists);
    
    console.log('\n[E2E] ✓ All rendering tests completed');
    console.log('[E2E] Check screenshots in test/e2e/screenshots/entity_palette_rendering/');
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('[E2E] ✗ Test failed:', error.message);
    await saveScreenshot(page, 'entity_palette_rendering/error', false);
    await browser.close();
    process.exit(1);
  }
})();
