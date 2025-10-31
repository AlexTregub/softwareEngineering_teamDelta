/**
 * E2E Test: MaterialPalette Mouse Wheel Scrolling
 * 
 * Bug: MaterialPalette: Mouse Wheel Scrolling Not Working
 * Issue: Mouse wheel doesn't scroll when hovering over Materials panel
 * 
 * Test Strategy:
 * 1. Open Level Editor
 * 2. Ensure Materials panel is visible
 * 3. Hover over Materials panel
 * 4. Scroll with mouse wheel
 * 5. Verify content scrolls (categories become visible)
 * 6. Take screenshots for verification
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const cameraHelper = require('../camera_helper');

// Helper functions
const launchBrowser = async () => {
  return await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const saveScreenshot = async (page, name, success) => {
  const screenshotDir = path.join(__dirname, '../screenshots/ui', success ? 'success' : 'failure');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  const timestamp = success ? '' : `_${Date.now()}`;
  const filename = `material_palette_mouse_wheel_${name}${timestamp}.png`;
  await page.screenshot({ 
    path: path.join(screenshotDir, filename),
    fullPage: true 
  });
  console.log(`Screenshot saved: ${filename}`);
};

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  try {
    console.log('=== E2E Test: MaterialPalette Mouse Wheel Scrolling ===\n');
    
    // Navigate to game
    console.log('1. Loading game...');
    await page.goto('http://localhost:8000?test=1', { waitUntil: 'networkidle0' });
    await sleep(2000);
    
    // Enter Level Editor using camera helper
    console.log('2. Entering Level Editor...');
    const levelEditorResult = await cameraHelper.ensureLevelEditorStarted(page);
    
    if (!levelEditorResult.started) {
      console.error('❌ Failed to start Level Editor');
      console.error('   Reason:', levelEditorResult.reason);
      console.error('   Diagnostics:', JSON.stringify(levelEditorResult.diagnostics, null, 2));
      await saveScreenshot(page, 'level_editor_failed_to_start', false);
      await browser.close();
      process.exit(1);
    }
    
    console.log('✅ Level Editor started successfully');
    console.log('   Panels registered:', levelEditorResult.diagnostics.panels.join(', '));
    console.log('   Actions taken:', levelEditorResult.diagnostics.called.join(', '));
    
    // 3. Ensure Materials panel is visible
    console.log('3. Ensuring Materials panel is visible...');
    const panelVisible = await page.evaluate(() => {
      if (!window.draggablePanelManager) return { success: false, reason: 'No draggablePanelManager' };
      
      // Access panel from Map
      const panelsObj = window.draggablePanelManager.panels;
      const panel = panelsObj instanceof Map ? panelsObj.get('level-editor-materials') : panelsObj['level-editor-materials'];
      
      if (!panel) {
        const availablePanels = panelsObj instanceof Map ? Array.from(panelsObj.keys()) : Object.keys(panelsObj);
        return { success: false, reason: 'No level-editor-materials panel', availablePanels };
      }
      
      // Make sure panel is visible
      if (!panel.state.visible) {
        panel.show();
      }
      
      // Make sure panel is not minimized
      if (panel.state.minimized) {
        panel.state.minimized = false;
      }
      
      // Add to state visibility if needed
      if (window.draggablePanelManager.stateVisibility && window.draggablePanelManager.stateVisibility.LEVEL_EDITOR) {
        if (!window.draggablePanelManager.stateVisibility.LEVEL_EDITOR.includes('level-editor-materials')) {
          window.draggablePanelManager.stateVisibility.LEVEL_EDITOR.push('level-editor-materials');
        }
      }
      
      // Force render
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      return { 
        success: panel.state.visible && !panel.state.minimized,
        visible: panel.state.visible,
        minimized: panel.state.minimized
      };
    });
    
    if (!panelVisible.success) {
      console.error('❌ FAILED: Materials panel not visible');
      console.error('   Reason:', panelVisible.reason || 'Unknown');
      if (panelVisible.availablePanels) {
        console.error('   Available panels:', panelVisible.availablePanels.join(', '));
      }
      console.error('   State:', JSON.stringify(panelVisible, null, 2));
      await saveScreenshot(page, 'panel_not_visible', false);
      testsFailed++;
      await browser.close();
      process.exit(1);
    }
    
    console.log('✓ Materials panel is visible');
    await sleep(500);
    
    // TEST 1: Get initial scroll state
    console.log('\n--- TEST 1: Get Initial Scroll State ---');
    const initialState = await page.evaluate(() => {
      const panelsObj = window.draggablePanelManager.panels;
      const panel = panelsObj instanceof Map ? panelsObj.get('level-editor-materials') : panelsObj['level-editor-materials'];
      
      // Check if MaterialPalette exists
      if (!window.levelEditor || !window.levelEditor.palette) {
        return { error: 'MaterialPalette not found' };
      }
      
      const palette = window.levelEditor.palette;
      
      return {
        panelX: panel.state.position.x,
        panelY: panel.state.position.y,
        scrollOffset: palette.scrollOffset || 0,
        maxScrollOffset: palette.maxScrollOffset || 0,
        viewportHeight: palette.viewportHeight || 0,
        totalContentHeight: palette.getTotalContentHeight ? palette.getTotalContentHeight() : 'unknown',
        categoriesCount: palette.categories ? palette.categories.length : 0,
        hasHandleMouseWheel: typeof palette.handleMouseWheel === 'function'
      };
    });
    
    console.log('Initial State:', JSON.stringify(initialState, null, 2));
    
    if (initialState.error) {
      console.error(`❌ FAILED: ${initialState.error}`);
      await saveScreenshot(page, 'palette_not_found', false);
      testsFailed++;
      await browser.close();
      process.exit(1);
    }
    
    if (!initialState.hasHandleMouseWheel) {
      console.error('❌ FAILED: handleMouseWheel method not found on MaterialPalette');
      testsFailed++;
    } else {
      console.log('✓ handleMouseWheel method exists');
      testsPassed++;
    }
    
    await saveScreenshot(page, 'initial_state', true);
    
    // TEST 2: Simulate mouse wheel scroll (scroll down)
    console.log('\n--- TEST 2: Simulate Mouse Wheel Scroll Down ---');
    
    // Position mouse over Materials panel (use panel position + offset)
    const mouseX = Math.floor(initialState.panelX + 200); // 200px into panel
    const mouseY = Math.floor(initialState.panelY + 100); // 100px down from top
    
    await page.mouse.move(mouseX, mouseY);
    await sleep(200);
    
    // Add event listener to capture wheel events BEFORE scrolling
    await page.evaluate(() => {
      window.__wheelEventCaptured = false;
      window.__wheelEventDetails = null;
      window.__p5WheelCalled = false;
      window.__levelEditorHandleCalled = false;
      
      // Capture at document level
      document.addEventListener('wheel', (e) => {
        window.__wheelEventCaptured = true;
        window.__wheelEventDetails = {
          deltaY: e.deltaY,
          clientX: e.clientX,
          clientY: e.clientY,
          target: e.target.tagName
        };
        console.log('[TEST] Wheel event captured:', e.deltaY, 'at', e.clientX, e.clientY);
      }, { capture: true });
      
      // Instrument p5.js mouseWheel
      if (typeof window.mouseWheel === 'function') {
        const original = window.mouseWheel;
        window.mouseWheel = function(event) {
          console.log('[TEST] p5.js mouseWheel called:', event);
          window.__p5WheelCalled = true;
          return original.call(this, event);
        };
      }
      
      // Instrument LevelEditor.handleMouseWheel
      if (window.levelEditor && typeof window.levelEditor.handleMouseWheel === 'function') {
        const originalHandle = window.levelEditor.handleMouseWheel.bind(window.levelEditor);
        window.levelEditor.handleMouseWheel = function(event, shiftKey, mouseX, mouseY) {
          console.log('[TEST] LevelEditor.handleMouseWheel called:', event, shiftKey, mouseX, mouseY);
          window.__levelEditorHandleCalled = true;
          return originalHandle(event, shiftKey, mouseX, mouseY);
        };
      }
    });
    
    // Scroll down (positive delta)
    console.log(`Scrolling at position (${mouseX}, ${mouseY})...`);
    await page.mouse.wheel({ deltaY: 100 });
    await sleep(500);
    
    // Check if wheel event was captured
    const wheelEventInfo = await page.evaluate(() => {
      return {
        captured: window.__wheelEventCaptured || false,
        details: window.__wheelEventDetails || null,
        p5Called: window.__p5WheelCalled || false,
        levelEditorCalled: window.__levelEditorHandleCalled || false
      };
    });
    
    console.log('Wheel Event Diagnostics:', JSON.stringify(wheelEventInfo, null, 2));
    
    // Force redraw
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    await sleep(500);
    
    // Check if scrollOffset changed
    const afterScrollDownState = await page.evaluate(() => {
      const palette = window.levelEditor.palette;
      return {
        scrollOffset: palette.scrollOffset || 0,
        maxScrollOffset: palette.maxScrollOffset || 0
      };
    });
    
    console.log('After Scroll Down:', JSON.stringify(afterScrollDownState, null, 2));
    
    if (afterScrollDownState.scrollOffset > initialState.scrollOffset) {
      console.log(`✓ Scroll offset increased: ${initialState.scrollOffset} → ${afterScrollDownState.scrollOffset}`);
      testsPassed++;
    } else {
      console.error(`❌ FAILED: Scroll offset did not increase: ${initialState.scrollOffset} → ${afterScrollDownState.scrollOffset}`);
      console.error(`   → Wheel event captured: ${wheelEventInfo.captured}`);
      console.error(`   → p5.js mouseWheel called: ${wheelEventInfo.p5Called}`);
      console.error(`   → LevelEditor.handleMouseWheel called: ${wheelEventInfo.levelEditorCalled}`);
      testsFailed++;
    }
    
    await saveScreenshot(page, 'after_scroll_down', afterScrollDownState.scrollOffset > initialState.scrollOffset);
    
    // TEST 2B: Direct call to palette.handleMouseWheel()
    console.log('\n--- TEST 2B: Direct Call to palette.handleMouseWheel() ---');
    
    const directCallResult = await page.evaluate(() => {
      const palette = window.levelEditor.palette;
      const offsetBefore = palette.scrollOffset;
      
      console.log('[TEST] Before direct call: scrollOffset =', offsetBefore);
      
      // Call handleMouseWheel directly with positive delta (scroll down)
      palette.handleMouseWheel(100);
      
      const offsetAfter = palette.scrollOffset;
      console.log('[TEST] After direct call: scrollOffset =', offsetAfter);
      
      return {
        offsetBefore,
        offsetAfter,
        changed: offsetAfter !== offsetBefore,
        maxScrollOffset: palette.maxScrollOffset || 0
      };
    });
    
    console.log('Direct Call Result:', JSON.stringify(directCallResult, null, 2));
    
    if (directCallResult.changed) {
      console.log(`✓ Direct call worked: ${directCallResult.offsetBefore} → ${directCallResult.offsetAfter}`);
      testsPassed++;
    } else {
      console.error(`❌ Direct call failed: offset stayed at ${directCallResult.offsetBefore}`);
      console.error(`   → maxScrollOffset: ${directCallResult.maxScrollOffset}`);
      testsFailed++;
    }
    
    await saveScreenshot(page, 'after_direct_call', directCallResult.changed);
    
    // TEST 3: Check LevelEditor mouse wheel delegation
    console.log('\n--- TEST 3: Check LevelEditor Mouse Wheel Delegation ---');
    
    const delegationInfo = await page.evaluate(() => {
      if (!window.levelEditor) return { error: 'LevelEditor not found' };
      
      const editor = window.levelEditor;
      
      return {
        hasHandleMouseWheel: typeof editor.handleMouseWheel === 'function',
        hasPalette: !!editor.palette,
        paletteHasHandleMouseWheel: editor.palette && typeof editor.palette.handleMouseWheel === 'function',
        levelEditorPanelsExists: !!editor.levelEditorPanels,
        materialsPanel: editor.levelEditorPanels && editor.levelEditorPanels.panels ? 
          !!editor.levelEditorPanels.panels.materials : false
      };
    });
    
    console.log('Delegation Info:', JSON.stringify(delegationInfo, null, 2));
    
    if (delegationInfo.hasHandleMouseWheel && delegationInfo.hasPalette && delegationInfo.paletteHasHandleMouseWheel) {
      console.log('✓ LevelEditor delegation setup looks correct');
      testsPassed++;
    } else {
      console.error('❌ FAILED: LevelEditor delegation setup incomplete');
      testsFailed++;
    }
    
    // TEST 4: Manually trigger handleMouseWheel (scroll UP from max position)
    console.log('\n--- TEST 4: Manually Trigger handleMouseWheel (Scroll Up) ---');
    
    const manualTriggerResult = await page.evaluate((mx, my) => {
      const editor = window.levelEditor;
      const palette = editor.palette;
      
      // Record initial state (should be at max from TEST 2B)
      const initialScrollOffset = palette.scrollOffset || 0;
      
      // Create mock event with NEGATIVE delta (scroll UP)
      const mockEvent = { deltaY: -50, delta: -50 };
      
      // Try to trigger via LevelEditor
      let delegationResult = 'not_called';
      if (typeof editor.handleMouseWheel === 'function') {
        delegationResult = editor.handleMouseWheel(mockEvent, false, mx, my) ? 'consumed' : 'not_consumed';
      }
      
      // Force redraw
      if (typeof window.redraw === 'function') {
        window.redraw();
      }
      
      const afterScrollOffset = palette.scrollOffset || 0;
      
      return {
        initialScrollOffset,
        afterScrollOffset,
        scrollChanged: afterScrollOffset !== initialScrollOffset,
        delegationResult,
        maxScrollOffset: palette.maxScrollOffset,
        scrolledUp: afterScrollOffset < initialScrollOffset
      };
    }, mouseX, mouseY);
    
    console.log('Manual Trigger Result:', JSON.stringify(manualTriggerResult, null, 2));
    
    if (manualTriggerResult.scrollChanged && manualTriggerResult.scrolledUp) {
      console.log(`✓ Manual trigger worked (scrolled up): ${manualTriggerResult.initialScrollOffset} → ${manualTriggerResult.afterScrollOffset}`);
      testsPassed++;
    } else {
      console.error(`❌ FAILED: Manual trigger did not scroll up`);
      console.error(`   Delegation result: ${manualTriggerResult.delegationResult}`);
      console.error(`   Initial: ${manualTriggerResult.initialScrollOffset}, After: ${manualTriggerResult.afterScrollOffset}`);
      testsFailed++;
    }
    
    await saveScreenshot(page, 'after_manual_trigger', manualTriggerResult.scrollChanged);
    
    // TEST 5: Check if content height exceeds viewport
    console.log('\n--- TEST 5: Check Content Height vs Viewport ---');
    
    const contentInfo = await page.evaluate(() => {
      const palette = window.levelEditor.palette;
      
      const totalHeight = palette.getTotalContentHeight ? palette.getTotalContentHeight() : 0;
      const viewportHeight = palette.viewportHeight || 0;
      const shouldScroll = totalHeight > viewportHeight;
      const maxScroll = Math.max(0, totalHeight - viewportHeight);
      
      return {
        totalContentHeight: totalHeight,
        viewportHeight: viewportHeight,
        shouldScroll: shouldScroll,
        calculatedMaxScroll: maxScroll,
        actualMaxScroll: palette.maxScrollOffset || 0,
        categoriesCount: palette.categories ? palette.categories.length : 0,
        recentlyUsedCount: palette.recentlyUsed ? palette.recentlyUsed.length : 0
      };
    });
    
    console.log('Content Info:', JSON.stringify(contentInfo, null, 2));
    
    if (contentInfo.shouldScroll && contentInfo.actualMaxScroll > 0) {
      console.log('✓ Content height exceeds viewport, scrolling should be possible');
      testsPassed++;
    } else if (!contentInfo.shouldScroll) {
      console.log('⚠ WARNING: Content fits in viewport, scrolling not needed');
      console.log('   This may be why scrolling appears to not work');
    } else {
      console.error('❌ FAILED: maxScrollOffset is 0 despite content exceeding viewport');
      testsFailed++;
    }
    
    await saveScreenshot(page, 'content_height_check', true);
    
    // Final Summary
    console.log('\n=== Test Summary ===');
    console.log(`Tests Passed: ${testsPassed}`);
    console.log(`Tests Failed: ${testsFailed}`);
    console.log(`Total Tests: ${testsPassed + testsFailed}`);
    
    await browser.close();
    process.exit(testsFailed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    await saveScreenshot(page, 'error', false);
    await browser.close();
    process.exit(1);
  }
})();
