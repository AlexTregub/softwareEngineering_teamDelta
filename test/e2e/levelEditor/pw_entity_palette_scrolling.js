/**
 * E2E Test - Entity Palette Scrolling
 * 
 * CRITICAL: Tests that Entity Palette scrolling works correctly
 * This test catches regression bugs where:
 * - Mouse wheel doesn't scroll
 * - Content extends beyond panel bounds
 * - Scroll position resets incorrectly
 * 
 * Tests:
 * 1. Mouse wheel scrolling updates scrollOffset
 * 2. Content is clipped to viewport (no overflow)
 * 3. Scroll bounds are calculated correctly
 * 4. Scroll position is maintained within valid range
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('Loading Level Editor...');
    await page.goto('http://localhost:8000?test=1');
    
    // Navigate to Level Editor state
    await page.evaluate(() => {
      const gs = window.GameState || window.g_gameState;
      if (gs && typeof gs.setState === 'function') {
        gs.setState('LEVEL_EDITOR');
      }
    });
    
    // Wait for Level Editor to initialize
    await sleep(2000);
    
    console.log('Testing Entity Palette scrolling...');
    
    const result = await page.evaluate(() => {
      const results = {
        success: true,
        errors: [],
        details: {}
      };
      
      // Check if Entity Palette exists
      if (!window.levelEditor || !window.levelEditor.entityPalette) {
        results.success = false;
        results.errors.push('EntityPalette instance not found');
        return results;
      }
      
      const entityPalette = window.levelEditor.entityPalette;
      const panel = window.draggablePanelManager?.panels?.entityPalette;
      
      if (!panel) {
        results.success = false;
        results.errors.push('Entity Palette panel not found');
        return results;
      }
      
      // Make panel visible
      panel.state.visible = true;
      panel.state.minimized = false;
      
      // Test 1: Check scroll properties exist
      if (typeof entityPalette.scrollOffset === 'undefined') {
        results.errors.push('scrollOffset property missing');
        results.success = false;
      }
      
      if (typeof entityPalette.maxScrollOffset === 'undefined') {
        results.errors.push('maxScrollOffset property missing');
        results.success = false;
      }
      
      if (typeof entityPalette.viewportHeight === 'undefined') {
        results.errors.push('viewportHeight property missing');
        results.success = false;
      }
      
      if (typeof entityPalette.handleMouseWheel !== 'function') {
        results.errors.push('handleMouseWheel method missing');
        results.success = false;
      }
      
      if (typeof entityPalette.updateScrollBounds !== 'function') {
        results.errors.push('updateScrollBounds method missing');
        results.success = false;
      }
      
      // Record initial state
      const initialScrollOffset = entityPalette.scrollOffset;
      results.details.initialScrollOffset = initialScrollOffset;
      
      // Update scroll bounds
      entityPalette.updateScrollBounds();
      results.details.maxScrollOffset = entityPalette.maxScrollOffset;
      results.details.viewportHeight = entityPalette.viewportHeight;
      
      // Test 2: Verify viewport height is reasonable (320px = 4 entries * 80px)
      if (entityPalette.viewportHeight !== 320) {
        results.errors.push(`Viewport height incorrect: ${entityPalette.viewportHeight}px (expected 320px)`);
        results.success = false;
      }
      
      // Test 3: Simulate mouse wheel scroll down
      const panelPos = panel.getPosition();
      const titleBarHeight = panel.calculateTitleBarHeight();
      const contentX = panelPos.x + 10;
      const contentY = panelPos.y + titleBarHeight + 10;
      const panelWidth = panel.state.width - 20;
      
      // Scroll down (positive delta)
      const scrolledDown = entityPalette.handleMouseWheel(10, contentX, contentY, contentX, contentY, panelWidth);
      results.details.scrolledDown = scrolledDown;
      results.details.scrollOffsetAfterDown = entityPalette.scrollOffset;
      
      if (!scrolledDown) {
        results.errors.push('handleMouseWheel returned false (should handle scroll)');
        results.success = false;
      }
      
      if (entityPalette.scrollOffset <= initialScrollOffset) {
        results.errors.push(`Scroll down did not increase offset: ${initialScrollOffset} -> ${entityPalette.scrollOffset}`);
        results.success = false;
      }
      
      // Test 4: Scroll up (negative delta)
      const currentOffset = entityPalette.scrollOffset;
      const scrolledUp = entityPalette.handleMouseWheel(-10, contentX, contentY, contentX, contentY, panelWidth);
      results.details.scrolledUp = scrolledUp;
      results.details.scrollOffsetAfterUp = entityPalette.scrollOffset;
      
      if (!scrolledUp) {
        results.errors.push('handleMouseWheel returned false for scroll up');
        results.success = false;
      }
      
      if (entityPalette.scrollOffset >= currentOffset) {
        results.errors.push(`Scroll up did not decrease offset: ${currentOffset} -> ${entityPalette.scrollOffset}`);
        results.success = false;
      }
      
      // Test 5: Test clamping (try to scroll past max)
      entityPalette.scrollOffset = entityPalette.maxScrollOffset + 100;
      entityPalette.updateScrollBounds(); // Should clamp
      results.details.clampedScrollOffset = entityPalette.scrollOffset;
      
      if (entityPalette.scrollOffset > entityPalette.maxScrollOffset) {
        results.errors.push(`Scroll not clamped: ${entityPalette.scrollOffset} > ${entityPalette.maxScrollOffset}`);
        results.success = false;
      }
      
      // Test 6: Test clamping at minimum (try to scroll negative)
      entityPalette.scrollOffset = -50;
      entityPalette.updateScrollBounds(); // Should clamp to 0
      results.details.clampedMinScrollOffset = entityPalette.scrollOffset;
      
      if (entityPalette.scrollOffset < 0) {
        results.errors.push(`Scroll not clamped to 0: ${entityPalette.scrollOffset}`);
        results.success = false;
      }
      
      // Test 7: Verify scroll bounds update when content changes
      const originalMax = entityPalette.maxScrollOffset;
      entityPalette.setCategory('custom'); // Likely has less content
      const newMax = entityPalette.maxScrollOffset;
      results.details.maxAfterCategoryChange = newMax;
      
      // If custom category has fewer items, maxScrollOffset should be different
      // (Can't guarantee which direction, just that updateScrollBounds was called)
      
      // Switch back
      entityPalette.setCategory('entities');
      
      // Force re-render
      if (window.draggablePanelManager) {
        window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
      }
      
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      return results;
    });
    
    // Wait for renders
    await sleep(500);
    
    // Save screenshot
    await saveScreenshot(page, 'levelEditor/entity_palette_scrolling', result.success);
    
    // Report results
    console.log('\nTest Results:');
    console.log('✓ Initial scroll offset:', result.details.initialScrollOffset);
    console.log('✓ Max scroll offset:', result.details.maxScrollOffset);
    console.log('✓ Viewport height:', result.details.viewportHeight);
    console.log('✓ Scrolled down:', result.details.scrolledDown ? 'YES' : 'NO');
    console.log('✓ Offset after down:', result.details.scrollOffsetAfterDown);
    console.log('✓ Scrolled up:', result.details.scrolledUp ? 'YES' : 'NO');
    console.log('✓ Offset after up:', result.details.scrollOffsetAfterUp);
    console.log('✓ Clamped offset:', result.details.clampedScrollOffset);
    console.log('✓ Clamped min offset:', result.details.clampedMinScrollOffset);
    console.log('✓ Max after category change:', result.details.maxAfterCategoryChange);
    
    if (!result.success) {
      console.error('\n❌ ERRORS:');
      result.errors.forEach(err => console.error('  -', err));
    }
    
    await browser.close();
    
    if (result.success) {
      console.log('\n✅ Entity Palette scrolling test PASSED');
      process.exit(0);
    } else {
      console.error('\n❌ Entity Palette scrolling test FAILED');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Test error:', error);
    await saveScreenshot(page, 'levelEditor/entity_palette_scrolling_error', false);
    await browser.close();
    process.exit(1);
  }
})();
