/**
 * E2E Test: Entity Palette Real User Scrolling
 * 
 * Simulates actual user mouse wheel scrolling over the Entity Palette panel
 * Tests the complete flow:
 * 1. Open Level Editor
 * 2. Show Entity Palette
 * 3. Move mouse over panel
 * 4. Scroll with mouse wheel
 * 5. Verify content scrolls visually
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  console.log('🧪 Entity Palette Real User Scrolling Test');
  
  const browser = await launchBrowser(); // Headless
  const page = await browser.newPage();
  
  // Set viewport
  await page.setViewport({ width: 1280, height: 720 });
  
  await page.goto('http://localhost:8000?test=1');
  await sleep(1000);
  
  // Enter Level Editor
  console.log('⏳ Entering Level Editor...');
  await page.evaluate(() => {
    if (window.GameState && typeof window.GameState.setState === 'function') {
      window.GameState.setState('LEVEL_EDITOR');
    } else {
      window.gameState = 'LEVEL_EDITOR';
    }
    
    if (window.levelEditor && window.g_map2) {
      window.levelEditor.initialize(window.g_map2);
    }
  });
  
  await sleep(500);
  
  // Show Entity Palette panel
  console.log('⏳ Showing Entity Palette panel...');
  await page.evaluate(() => {
    const panel = window.draggablePanelManager?.panels.get('level-editor-entity-palette');
    if (panel) {
      panel.show();
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
  await saveScreenshot(page, 'entity_palette_real_scroll/01_panel_shown', true);
  
  // Get panel position for mouse movement
  const panelInfo = await page.evaluate(() => {
    const panel = window.draggablePanelManager?.panels.get('level-editor-entity-palette');
    if (!panel) return null;
    
    const palette = window.levelEditor?.entityPalette;
    if (!palette) return null;
    
    const pos = panel.getPosition();
    const titleBarHeight = panel.calculateTitleBarHeight();
    const padding = panel.config.style.padding;
    
    const contentX = pos.x + padding;
    const contentY = pos.y + titleBarHeight + padding;
    const size = palette.getContentSize(220);
    
    return {
      panelX: pos.x,
      panelY: pos.y,
      contentX,
      contentY,
      contentWidth: size.width,
      contentHeight: size.height,
      centerX: contentX + size.width / 2,
      centerY: contentY + size.height / 2,
      scrollOffset: palette.scrollOffset,
      maxScrollOffset: palette.maxScrollOffset
    };
  });
  
  if (!panelInfo) {
    console.error('❌ Failed to get panel info');
    await browser.close();
    process.exit(1);
  }
  
  console.log('');
  console.log('📏 Panel Info:');
  console.log(`  Position: (${panelInfo.panelX}, ${panelInfo.panelY})`);
  console.log(`  Content Center: (${Math.round(panelInfo.centerX)}, ${Math.round(panelInfo.centerY)})`);
  console.log(`  Content Size: ${panelInfo.contentWidth}x${panelInfo.contentHeight}`);
  console.log(`  Scroll: ${panelInfo.scrollOffset} / ${panelInfo.maxScrollOffset}`);
  console.log('');
  
  // Move mouse to panel center
  console.log('🖱️  Moving mouse to panel center...');
  await page.mouse.move(panelInfo.centerX, panelInfo.centerY);
  await sleep(500);
  
  // Take screenshot with mouse over panel
  await saveScreenshot(page, 'entity_palette_real_scroll/02_mouse_over_panel', true);
  
  // Check initial scroll state
  const beforeScroll = await page.evaluate(() => {
    const palette = window.levelEditor?.entityPalette;
    return palette ? palette.scrollOffset : null;
  });
  
  console.log(`Initial scrollOffset: ${beforeScroll}`);
  
  // Scroll down with mouse wheel (multiple times)
  console.log('🖱️  Scrolling down (3 wheel events)...');
  for (let i = 0; i < 3; i++) {
    await page.mouse.wheel({ deltaY: 100 }); // Positive = scroll down
    await sleep(200);
    
    const currentScroll = await page.evaluate(() => {
      const palette = window.levelEditor?.entityPalette;
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
      return palette ? palette.scrollOffset : null;
    });
    
    console.log(`  After wheel ${i + 1}: scrollOffset = ${currentScroll}`);
  }
  
  await sleep(500);
  await saveScreenshot(page, 'entity_palette_real_scroll/03_after_scroll_down', true);
  
  // Check final scroll state
  const afterScrollDown = await page.evaluate(() => {
    const palette = window.levelEditor?.entityPalette;
    return {
      scrollOffset: palette ? palette.scrollOffset : null,
      maxScrollOffset: palette ? palette.maxScrollOffset : null
    };
  });
  
  console.log(`After scroll down: ${afterScrollDown.scrollOffset} / ${afterScrollDown.maxScrollOffset}`);
  
  // Scroll back up
  console.log('🖱️  Scrolling up (3 wheel events)...');
  for (let i = 0; i < 3; i++) {
    await page.mouse.wheel({ deltaY: -100 }); // Negative = scroll up
    await sleep(200);
    
    const currentScroll = await page.evaluate(() => {
      const palette = window.levelEditor?.entityPalette;
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
      return palette ? palette.scrollOffset : null;
    });
    
    console.log(`  After wheel ${i + 1}: scrollOffset = ${currentScroll}`);
  }
  
  await sleep(500);
  await saveScreenshot(page, 'entity_palette_real_scroll/04_after_scroll_up', true);
  
  // Final state
  const finalScroll = await page.evaluate(() => {
    const palette = window.levelEditor?.entityPalette;
    return palette ? palette.scrollOffset : null;
  });
  
  console.log(`Final scrollOffset: ${finalScroll}`);
  
  // Verify scrolling worked
  const scrollWorked = afterScrollDown.scrollOffset > beforeScroll;
  const scrollBackWorked = finalScroll < afterScrollDown.scrollOffset;
  
  console.log('');
  console.log('='.repeat(50));
  console.log('📊 Test Results');
  console.log('='.repeat(50));
  console.log(`Initial scroll: ${beforeScroll}`);
  console.log(`After scroll down: ${afterScrollDown.scrollOffset}`);
  console.log(`After scroll up: ${finalScroll}`);
  console.log(`Max scroll: ${afterScrollDown.maxScrollOffset}`);
  console.log('');
  console.log(`Scroll down worked: ${scrollWorked ? '✅' : '❌'} (${beforeScroll} → ${afterScrollDown.scrollOffset})`);
  console.log(`Scroll up worked: ${scrollBackWorked ? '✅' : '❌'} (${afterScrollDown.scrollOffset} → ${finalScroll})`);
  console.log('='.repeat(50));
  
  const allPassed = scrollWorked && scrollBackWorked;
  console.log(allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  console.log('='.repeat(50));
  
  await browser.close();
  
  process.exit(allPassed ? 0 : 1);
})();
