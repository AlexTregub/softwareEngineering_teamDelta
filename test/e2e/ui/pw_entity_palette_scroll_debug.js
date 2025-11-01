/**
 * E2E Test: Entity Palette Mouse Position Detection
 * 
 * Diagnoses why scrolling isn't working:
 * 1. Check if mouse position is correctly detected
 * 2. Check if containsPoint returns true when over panel
 * 3. Check if handleMouseWheel is called with correct parameters
 * 4. Check if panel dimensions are correct
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  console.log('🧪 Entity Palette Mouse Position Detection Test');
  
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  // Set viewport to known size
  await page.setViewport({ width: 1280, height: 720 });
  
  await page.goto('http://localhost:8000?test=1');
  await sleep(1000);
  
  // Enter Level Editor via game state transition
  console.log('⏳ Entering Level Editor...');
  const editorInit = await page.evaluate(() => {
    // Check if levelEditor exists
    if (!window.levelEditor) {
      return { success: false, error: 'levelEditor not found in window' };
    }
    
    // Initialize Level Editor if not already active
    if (!window.levelEditor.isActive()) {
      // Trigger Level Editor initialization
      if (window.GameState && typeof window.GameState.setState === 'function') {
        window.GameState.setState('LEVEL_EDITOR');
      } else {
        window.gameState = 'LEVEL_EDITOR';
      }
      
      // Initialize with current terrain if available
      if (window.g_map2) {
        window.levelEditor.initialize(window.g_map2);
      }
    }
    
    return { 
      success: true, 
      active: window.levelEditor.isActive(),
      hasPanels: !!window.levelEditor.levelEditorPanels,
      hasPalette: !!window.levelEditor.entityPalette
    };
  });
  
  console.log('Editor init result:', editorInit);
  
  if (!editorInit.success) {
    console.error('❌ Failed to initialize Level Editor:', editorInit.error);
    await saveScreenshot(page, 'entity_palette_scroll_debug/error_no_editor', false);
    await browser.close();
    process.exit(1);
  }
  
  await sleep(500);
  
  // Show Entity Palette panel
  console.log('⏳ Showing Entity Palette panel...');
  const panelShown = await page.evaluate(() => {
    const panel = window.draggablePanelManager?.panels.get('level-editor-entity-palette');
    if (!panel) {
      return { success: false, error: 'Panel not found' };
    }
    
    panel.show();
    
    // Force render
    if (window.draggablePanelManager) {
      window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
    }
    if (typeof window.redraw === 'function') {
      window.redraw(); window.redraw(); window.redraw();
    }
    
    return { success: true, visible: panel.state.visible };
  });
  
  console.log('Panel shown result:', panelShown);
  
  if (!panelShown.success) {
    console.error('❌ Failed to show panel:', panelShown.error);
    await saveScreenshot(page, 'entity_palette_scroll_debug/error_panel_not_shown', false);
    await browser.close();
    process.exit(1);
  }
  
  await sleep(300);
  await saveScreenshot(page, 'entity_palette_scroll_debug/01_panel_shown', true);
  
  // Get panel position and dimensions
  console.log('');
  console.log('📏 Panel Dimensions:');
  console.log('='.repeat(50));
  
  const panelInfo = await page.evaluate(() => {
    const panel = window.draggablePanelManager?.panels.get('level-editor-entity-palette');
    if (!panel) return { error: 'Panel not found' };
    
    const palette = window.levelEditor?.entityPalette;
    if (!palette) return { error: 'EntityPalette not found' };
    
    const pos = panel.getPosition();
    const titleBarHeight = panel.calculateTitleBarHeight();
    const padding = panel.config.style.padding;
    
    const contentX = pos.x + padding;
    const contentY = pos.y + titleBarHeight + padding;
    
    const size = palette.getContentSize(220);
    
    return {
      panelX: pos.x,
      panelY: pos.y,
      titleBarHeight,
      padding,
      contentX,
      contentY,
      contentWidth: size.width,
      contentHeight: size.height,
      viewportHeight: palette.viewportHeight,
      scrollOffset: palette.scrollOffset,
      maxScrollOffset: palette.maxScrollOffset
    };
  });
  
  console.log(JSON.stringify(panelInfo, null, 2));
  
  if (panelInfo.error) {
    console.error('❌ Error:', panelInfo.error);
    await browser.close();
    process.exit(1);
  }
  
  // Test 1: containsPoint at panel center
  console.log('');
  console.log('🎯 Test 1: containsPoint at Panel Center');
  console.log('='.repeat(50));
  
  const centerX = panelInfo.contentX + panelInfo.contentWidth / 2;
  const centerY = panelInfo.contentY + panelInfo.contentHeight / 2;
  
  console.log(`Testing at (${Math.round(centerX)}, ${Math.round(centerY)})`);
  
  const containsTest1 = await page.evaluate((mouseX, mouseY, contentX, contentY) => {
    const palette = window.levelEditor?.entityPalette;
    if (!palette) return { error: 'Palette not found' };
    
    const result = palette.containsPoint(mouseX, mouseY, contentX, contentY);
    
    return {
      mouseX,
      mouseY,
      contentX,
      contentY,
      result,
      size: palette.getContentSize()
    };
  }, centerX, centerY, panelInfo.contentX, panelInfo.contentY);
  
  console.log('containsPoint result:', containsTest1.result);
  console.log('Expected: true (mouse at panel center)');
  console.log(containsTest1.result ? '✅ PASS' : '❌ FAIL');
  
  // Test 2: containsPoint just inside top-left corner
  console.log('');
  console.log('🎯 Test 2: containsPoint at Top-Left Corner');
  console.log('='.repeat(50));
  
  const topLeftX = panelInfo.contentX + 5;
  const topLeftY = panelInfo.contentY + 5;
  
  console.log(`Testing at (${Math.round(topLeftX)}, ${Math.round(topLeftY)})`);
  
  const containsTest2 = await page.evaluate((mouseX, mouseY, contentX, contentY) => {
    const palette = window.levelEditor?.entityPalette;
    if (!palette) return { error: 'Palette not found' };
    
    const result = palette.containsPoint(mouseX, mouseY, contentX, contentY);
    
    return {
      mouseX,
      mouseY,
      contentX,
      contentY,
      result
    };
  }, topLeftX, topLeftY, panelInfo.contentX, panelInfo.contentY);
  
  console.log('containsPoint result:', containsTest2.result);
  console.log('Expected: true (inside panel)');
  console.log(containsTest2.result ? '✅ PASS' : '❌ FAIL');
  
  // Test 3: containsPoint outside panel (to the right)
  console.log('');
  console.log('🎯 Test 3: containsPoint Outside Panel (Right)');
  console.log('='.repeat(50));
  
  const outsideX = panelInfo.contentX + panelInfo.contentWidth + 50;
  const outsideY = panelInfo.contentY + 50;
  
  console.log(`Testing at (${Math.round(outsideX)}, ${Math.round(outsideY)})`);
  
  const containsTest3 = await page.evaluate((mouseX, mouseY, contentX, contentY) => {
    const palette = window.levelEditor?.entityPalette;
    if (!palette) return { error: 'Palette not found' };
    
    const result = palette.containsPoint(mouseX, mouseY, contentX, contentY);
    
    return {
      mouseX,
      mouseY,
      contentX,
      contentY,
      contentWidth: palette.getContentSize().width,
      result
    };
  }, outsideX, outsideY, panelInfo.contentX, panelInfo.contentY);
  
  console.log('containsPoint result:', containsTest3.result);
  console.log('Expected: false (outside panel)');
  console.log(!containsTest3.result ? '✅ PASS' : '❌ FAIL');
  
  // Test 4: handleMouseWheel at panel center
  console.log('');
  console.log('🖱️ Test 4: handleMouseWheel at Panel Center');
  console.log('='.repeat(50));
  
  const wheelTest = await page.evaluate((mouseX, mouseY, contentX, contentY, panelWidth) => {
    const palette = window.levelEditor?.entityPalette;
    if (!palette) return { error: 'Palette not found' };
    
    const beforeScroll = palette.scrollOffset;
    
    // Simulate wheel down (delta = 1)
    const handled = palette.handleMouseWheel(1, mouseX, mouseY, contentX, contentY, panelWidth);
    
    const afterScroll = palette.scrollOffset;
    
    return {
      handled,
      beforeScroll,
      afterScroll,
      scrollChanged: afterScroll !== beforeScroll,
      mouseX,
      mouseY,
      contentX,
      contentY,
      panelWidth,
      containsCheck: palette.containsPoint(mouseX, mouseY, contentX, contentY)
    };
  }, centerX, centerY, panelInfo.contentX, panelInfo.contentY, panelInfo.contentWidth);
  
  console.log('handleMouseWheel result:');
  console.log('  handled:', wheelTest.handled);
  console.log('  scrollOffset:', wheelTest.beforeScroll, '→', wheelTest.afterScroll);
  console.log('  containsPoint:', wheelTest.containsCheck);
  console.log('  Expected: handled=true, scrollChanged=true');
  console.log(wheelTest.handled && wheelTest.scrollChanged ? '✅ PASS' : '❌ FAIL');
  
  // Test 5: Check maxScrollOffset after updating bounds
  console.log('');
  console.log('🔄 Test 5: maxScrollOffset Calculation');
  console.log('='.repeat(50));
  
  const scrollBoundsTest = await page.evaluate(() => {
    const palette = window.levelEditor?.entityPalette;
    if (!palette) return { error: 'Palette not found' };
    
    // Update scroll bounds (should recalculate maxScrollOffset)
    palette.updateScrollBounds();
    
    const fullHeight = palette.getFullContentHeight();
    const cappedHeight = palette.getContentSize(220).height;
    
    return {
      fullContentHeight: fullHeight,
      cappedContentHeight: cappedHeight,
      viewportHeight: palette.viewportHeight,
      maxScrollOffset: palette.maxScrollOffset,
      expectedMaxScroll: Math.max(0, fullHeight - palette.viewportHeight),
      scrollPossible: palette.maxScrollOffset > 0
    };
  });
  
  console.log('Scroll bounds:');
  console.log('  Full content height:', scrollBoundsTest.fullContentHeight);
  console.log('  Capped content height:', scrollBoundsTest.cappedContentHeight);
  console.log('  Viewport height:', scrollBoundsTest.viewportHeight);
  console.log('  maxScrollOffset:', scrollBoundsTest.maxScrollOffset);
  console.log('  Expected:', scrollBoundsTest.expectedMaxScroll);
  console.log('  Scrolling possible:', scrollBoundsTest.scrollPossible);
  console.log(scrollBoundsTest.maxScrollOffset === scrollBoundsTest.expectedMaxScroll ? '✅ PASS' : '❌ FAIL');
  
  await saveScreenshot(page, 'entity_palette_scroll_debug/02_after_wheel_test', true);
  
  await browser.close();
  
  // Summary
  console.log('');
  console.log('='.repeat(50));
  console.log('📊 Test Summary');
  console.log('='.repeat(50));
  
  const allPassed = 
    containsTest1.result === true &&
    containsTest2.result === true &&
    containsTest3.result === false &&
    wheelTest.handled === true &&
    wheelTest.scrollChanged === true &&
    scrollBoundsTest.maxScrollOffset === scrollBoundsTest.expectedMaxScroll &&
    scrollBoundsTest.scrollPossible === true;
  
  console.log(`containsPoint (center):     ${containsTest1.result === true ? '✅' : '❌'}`);
  console.log(`containsPoint (top-left):   ${containsTest2.result === true ? '✅' : '❌'}`);
  console.log(`containsPoint (outside):    ${containsTest3.result === false ? '✅' : '❌'}`);
  console.log(`handleMouseWheel:           ${wheelTest.handled && wheelTest.scrollChanged ? '✅' : '❌'}`);
  console.log(`maxScrollOffset calc:       ${scrollBoundsTest.maxScrollOffset === scrollBoundsTest.expectedMaxScroll ? '✅' : '❌'}`);
  console.log('='.repeat(50));
  console.log(allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  console.log('='.repeat(50));
  
  process.exit(allPassed ? 0 : 1);
})();
