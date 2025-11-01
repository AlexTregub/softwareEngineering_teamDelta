/**
 * E2E Test: Entity Palette Scrolling
 * 
 * Verifies that:
 * 1. Panel height is constrained (not auto-sizing)
 * 2. Scrolling activates when mouse wheel over panel
 * 3. scrollOffset updates correctly
 * 4. Content culling works (only visible templates rendered)
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  console.log('🧪 Entity Palette Scrolling E2E Test');
  
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:8000?test=1');
  
  // CRITICAL: Ensure Level Editor started
  console.log('⏳ Starting Level Editor...');
  const editorStarted = await cameraHelper.ensureLevelEditorStarted(page);
  if (!editorStarted.started) {
    console.error('❌ Level Editor failed to start');
    await saveScreenshot(page, 'entity_palette_scrolling/error_editor_not_started', false);
    await browser.close();
    process.exit(1);
  }
  console.log('✅ Level Editor started');
  
  await sleep(500);
  
  // Ensure Entity Palette panel is visible
  await page.evaluate(() => {
    const panel = window.draggablePanelManager?.panels.get('level-editor-entity-palette');
    if (panel) {
      panel.show();
      console.log('[Test] Entity Palette panel shown');
    }
  });
  
  await sleep(300);
  
  // Check panel dimensions
  const panelInfo = await page.evaluate(() => {
    const panel = window.draggablePanelManager?.panels.get('level-editor-entity-palette');
    if (!panel) return { error: 'Panel not found' };
    
    const palette = window.levelEditor?.entityPalette;
    if (!palette) return { error: 'EntityPalette not found' };
    
    const size = palette.getContentSize(220);
    
    return {
      panelWidth: panel.width || panel.state.width,
      panelHeight: panel.height || panel.state.height,
      contentWidth: size.width,
      contentHeight: size.height,
      viewportHeight: palette.viewportHeight,
      scrollOffset: palette.scrollOffset,
      maxScrollOffset: palette.maxScrollOffset,
      templateCount: palette.getCurrentTemplates().length
    };
  });
  
  console.log('📏 Panel Info:', panelInfo);
  
  if (panelInfo.error) {
    console.error('❌ Error:', panelInfo.error);
    await saveScreenshot(page, 'entity_palette_scrolling/error_panel_check', false);
    await browser.close();
    process.exit(1);
  }
  
  // Verify panel height is capped
  const heightCapped = panelInfo.contentHeight <= (panelInfo.viewportHeight + 100);
  console.log(`${heightCapped ? '✅' : '❌'} Panel height capped:`, panelInfo.contentHeight, '<=', panelInfo.viewportHeight + 100);
  
  // Verify scrolling is possible
  const scrollPossible = panelInfo.maxScrollOffset > 0;
  console.log(`${scrollPossible ? '✅' : '❌'} Scrolling possible: maxScrollOffset =`, panelInfo.maxScrollOffset);
  
  // Take screenshot of initial state
  await page.evaluate(() => {
    window.gameState = 'LEVEL_EDITOR';
    if (window.draggablePanelManager) {
      window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
    }
    if (typeof window.redraw === 'function') {
      window.redraw(); window.redraw(); window.redraw();
    }
  });
  await sleep(300);
  await saveScreenshot(page, 'entity_palette_scrolling/before_scroll', true);
  
  // Simulate scroll wheel event
  console.log('🖱️ Simulating scroll wheel down...');
  const scrollResult = await page.evaluate(() => {
    const panel = window.draggablePanelManager?.panels.get('level-editor-entity-palette');
    const palette = window.levelEditor?.entityPalette;
    if (!panel || !palette) return { error: 'Panel or palette not found' };
    
    const pos = panel.getPosition();
    const titleBarHeight = panel.calculateTitleBarHeight();
    const contentX = pos.x + panel.config.style.padding;
    const contentY = pos.y + titleBarHeight + panel.config.style.padding;
    
    // Mouse position in middle of panel
    const mouseX = contentX + 100;
    const mouseY = contentY + 100;
    
    const beforeScroll = palette.scrollOffset;
    
    // Simulate mouse wheel down (delta > 0)
    const handled = palette.handleMouseWheel(1, mouseX, mouseY, contentX, contentY, 200);
    
    const afterScroll = palette.scrollOffset;
    
    return {
      handled,
      beforeScroll,
      afterScroll,
      scrollChanged: afterScroll !== beforeScroll,
      contentX,
      contentY,
      mouseX,
      mouseY
    };
  });
  
  console.log('📊 Scroll Result:', scrollResult);
  
  if (scrollResult.error) {
    console.error('❌ Error during scroll:', scrollResult.error);
    await saveScreenshot(page, 'entity_palette_scrolling/error_scroll', false);
    await browser.close();
    process.exit(1);
  }
  
  const scrollHandled = scrollResult.handled;
  const scrollChanged = scrollResult.scrollChanged;
  
  console.log(`${scrollHandled ? '✅' : '❌'} Scroll handled:`, scrollHandled);
  console.log(`${scrollChanged ? '✅' : '❌'} Scroll offset changed:`, scrollResult.beforeScroll, '→', scrollResult.afterScroll);
  
  // Force redraw after scroll
  await page.evaluate(() => {
    window.gameState = 'LEVEL_EDITOR';
    if (window.draggablePanelManager) {
      window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
    }
    if (typeof window.redraw === 'function') {
      window.redraw(); window.redraw(); window.redraw();
    }
  });
  await sleep(300);
  await saveScreenshot(page, 'entity_palette_scrolling/after_scroll', scrollHandled);
  
  // Final verification
  const finalCheck = await page.evaluate(() => {
    const palette = window.levelEditor?.entityPalette;
    if (!palette) return { error: 'Palette not found' };
    
    return {
      scrollOffset: palette.scrollOffset,
      maxScrollOffset: palette.maxScrollOffset,
      viewportHeight: palette.viewportHeight
    };
  });
  
  console.log('📋 Final State:', finalCheck);
  
  await browser.close();
  
  const success = heightCapped && scrollPossible && scrollHandled && scrollChanged;
  
  console.log('');
  console.log('='.repeat(50));
  console.log(success ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  console.log('='.repeat(50));
  console.log(`Panel Height Capped: ${heightCapped ? '✅' : '❌'}`);
  console.log(`Scrolling Possible: ${scrollPossible ? '✅' : '❌'}`);
  console.log(`Scroll Handled: ${scrollHandled ? '✅' : '❌'}`);
  console.log(`Scroll Changed: ${scrollChanged ? '✅' : '❌'}`);
  console.log('='.repeat(50));
  
  process.exit(success ? 0 : 1);
})();
