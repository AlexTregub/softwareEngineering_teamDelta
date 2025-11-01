/**
 * Browser Console Test for Entity Palette Scrolling
 * 
 * Instructions:
 * 1. Start dev server: npm run dev
 * 2. Open http://localhost:8000 in browser
 * 3. Open Level Editor (press 'E' or click Level Editor button)
 * 4. Show Entity Palette panel (View menu → Entity Palette)
 * 5. Open browser console (F12)
 * 6. Copy and paste this entire script
 * 7. Press Enter to run
 * 
 * Expected Results:
 * - Panel height should be capped (~380px, not full content ~662px)
 * - maxScrollOffset > 0 (scrolling possible)
 * - Scroll wheel events should change scrollOffset
 * - Console should show ✅ for all checks
 */

(function testEntityPaletteScrolling() {
  console.log('🧪 Entity Palette Scrolling Test');
  console.log('='.repeat(50));
  
  // Check if in Level Editor
  if (window.gameState !== 'LEVEL_EDITOR') {
    console.error('❌ Not in Level Editor mode');
    console.log('💡 Press "E" key or click Level Editor button to enter Level Editor');
    return;
  }
  console.log('✅ In Level Editor mode');
  
  // Check panel exists
  const panel = window.draggablePanelManager?.panels.get('level-editor-entity-palette');
  if (!panel) {
    console.error('❌ Entity Palette panel not found');
    console.log('💡 Check if draggablePanelManager exists');
    return;
  }
  console.log('✅ Entity Palette panel found');
  
  // Check panel is visible
  if (!panel.state.visible) {
    console.warn('⚠️ Panel is hidden, showing it...');
    panel.show();
    if (typeof window.redraw === 'function') {
      window.redraw(); window.redraw(); window.redraw();
    }
  }
  console.log('✅ Panel is visible');
  
  // Check EntityPalette exists
  const palette = window.levelEditor?.entityPalette;
  if (!palette) {
    console.error('❌ EntityPalette not found in levelEditor');
    return;
  }
  console.log('✅ EntityPalette found');
  
  console.log('');
  console.log('📏 Panel Dimensions:');
  console.log('='.repeat(50));
  
  // Get template count
  const templates = palette.getCurrentTemplates();
  console.log(`Templates: ${templates.length}`);
  
  // Get content size
  const contentSize = palette.getContentSize(220);
  console.log(`Content Size: ${contentSize.width}x${contentSize.height}`);
  
  // Get viewport height
  console.log(`Viewport Height: ${palette.viewportHeight}`);
  
  // Check if height is capped
  const maxExpectedHeight = palette.viewportHeight + 100; // viewport + fixed elements
  const heightCapped = contentSize.height <= maxExpectedHeight;
  console.log(`${heightCapped ? '✅' : '❌'} Height Capped: ${contentSize.height} <= ${maxExpectedHeight}`);
  
  console.log('');
  console.log('📊 Scrolling State:');
  console.log('='.repeat(50));
  
  // Get scroll state
  console.log(`Scroll Offset: ${palette.scrollOffset}`);
  console.log(`Max Scroll Offset: ${palette.maxScrollOffset}`);
  
  // Check if scrolling is possible
  const scrollPossible = palette.maxScrollOffset > 0;
  console.log(`${scrollPossible ? '✅' : '❌'} Scrolling Possible: ${scrollPossible}`);
  
  // Calculate full content height
  const itemHeight = 80;
  const padding = 8;
  const listHeight = templates.length * (itemHeight + padding);
  const radioButtonsHeight = 30;
  const fullHeight = radioButtonsHeight + listHeight + 16;
  console.log(`Full Content Height (uncapped): ${fullHeight}`);
  console.log(`Capped Panel Height: ${contentSize.height}`);
  console.log(`Difference (scrollable): ${fullHeight - contentSize.height}`);
  
  console.log('');
  console.log('🖱️ Testing Scroll Wheel:');
  console.log('='.repeat(50));
  
  // Get panel position
  const pos = panel.getPosition();
  const titleBarHeight = panel.calculateTitleBarHeight();
  const contentX = pos.x + panel.config.style.padding;
  const contentY = pos.y + titleBarHeight + panel.config.style.padding;
  
  // Mouse position in middle of panel
  const mouseX = contentX + 100;
  const mouseY = contentY + 100;
  
  console.log(`Panel Position: (${pos.x}, ${pos.y})`);
  console.log(`Content Position: (${contentX}, ${contentY})`);
  console.log(`Test Mouse Position: (${mouseX}, ${mouseY})`);
  
  // Test scroll down
  const beforeScroll = palette.scrollOffset;
  const handled = palette.handleMouseWheel(1, mouseX, mouseY, contentX, contentY, 200);
  const afterScroll = palette.scrollOffset;
  
  console.log(`${handled ? '✅' : '❌'} Scroll Handled: ${handled}`);
  console.log(`Scroll Before: ${beforeScroll}`);
  console.log(`Scroll After: ${afterScroll}`);
  console.log(`${afterScroll > beforeScroll ? '✅' : '❌'} Scroll Changed: ${afterScroll > beforeScroll}`);
  
  // Force redraw
  if (typeof window.redraw === 'function') {
    window.redraw(); window.redraw(); window.redraw();
  }
  
  console.log('');
  console.log('='.repeat(50));
  
  const allPassed = heightCapped && scrollPossible && handled && (afterScroll > beforeScroll);
  
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED - Scrolling is working!');
  } else {
    console.error('❌ SOME TESTS FAILED');
    if (!heightCapped) console.error('  - Panel height not capped correctly');
    if (!scrollPossible) console.error('  - Scrolling not possible (maxScrollOffset = 0)');
    if (!handled) console.error('  - Scroll event not handled');
    if (afterScroll <= beforeScroll) console.error('  - Scroll offset did not change');
  }
  
  console.log('='.repeat(50));
  
  console.log('');
  console.log('💡 Try scrolling manually:');
  console.log('  - Move mouse over Entity Palette panel');
  console.log('  - Use mouse wheel to scroll up/down');
  console.log('  - Templates should scroll, category buttons stay fixed');
})();
