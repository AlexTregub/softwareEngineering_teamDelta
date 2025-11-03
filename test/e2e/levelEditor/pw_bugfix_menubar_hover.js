/**
 * E2E Test: Bug Fix - Menu Bar Hover Should Disable Terrain Painting
 * 
 * ISSUE: When hovering over menu bar, terrain highlight still shows and painting is still active
 * EXPECTED: Menu bar hover should disable terrain interaction and hide highlight
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to app...');
    await page.goto('http://localhost:8000?test=1');
    
    console.log('Ensuring game started...');
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Game failed to start');
    }
    
    console.log('Switching to LEVEL_EDITOR state...');
    await page.evaluate(() => {
      if (window.GameState && window.GameState.setState) {
        window.GameState.setState('LEVEL_EDITOR');
      }
    });
    
    await sleep(1000);
    
    // Test 1: Verify menu bar blocks clicks
    console.log('Test 1: Clicking on menu bar should not paint terrain...');
    const menuClickResult = await page.evaluate(() => {
      // Set up paint tool
      if (window.levelEditor.toolbar) {
        window.levelEditor.toolbar.selectTool('paint');
      }
      
      // Get menu bar position
      const menuBarY = window.levelEditor.fileMenuBar ? window.levelEditor.fileMenuBar.position.y : 0;
      const menuBarHeight = window.levelEditor.fileMenuBar ? window.levelEditor.fileMenuBar.height : 40;
      
      // Click in the middle of menu bar
      const clickX = 100;
      const clickY = menuBarY + menuBarHeight / 2;
      
      // Try to click (should be blocked by menu bar)
      const result = window.levelEditor.handleClick(clickX, clickY);
      
      return {
        clickX,
        clickY,
        menuBarY,
        menuBarHeight,
        clickHandled: result !== false // If handleClick returned false, click was blocked
      };
    });
    
    console.log('Menu click result:', menuClickResult);
    
    // Click on menu bar should be blocked (not paint terrain)
    // This test will likely FAIL initially (bug not fixed yet)
    if (menuClickResult.clickHandled) {
      console.error('❌ BUG CONFIRMED: Menu bar did not block terrain click');
      await saveScreenshot(page, 'levelEditor/bugfix_menubar_click_failed', false);
    }
    
    await sleep(300);
    await saveScreenshot(page, 'levelEditor/bugfix_menubar_click', true);
    
    // Test 2: Verify mouse move over menu bar disables hover preview
    console.log('Test 2: Mouse over menu bar should disable hover preview...');
    const menuHoverResult = await page.evaluate(() => {
      // Get menu bar position
      const menuBarY = window.levelEditor.fileMenuBar ? window.levelEditor.fileMenuBar.position.y : 0;
      const menuBarHeight = window.levelEditor.fileMenuBar ? window.levelEditor.fileMenuBar.height : 40;
      
      // Move mouse over menu bar
      const hoverX = 150;
      const hoverY = menuBarY + menuBarHeight / 2;
      
      window.levelEditor.handleMouseMove(hoverX, hoverY);
      
      // Check if hover preview is active
      const hoverPreviewActive = window.levelEditor.hoverPreviewManager ? 
        window.levelEditor.hoverPreviewManager.getHoveredTiles && 
        window.levelEditor.hoverPreviewManager.getHoveredTiles().length > 0 : false;
      
      return {
        hoverX,
        hoverY,
        menuBarY,
        menuBarHeight,
        hoverPreviewActive,
        expectedActive: false // Should be disabled over menu bar
      };
    });
    
    console.log('Menu hover result:', menuHoverResult);
    
    // Hover preview should be disabled over menu bar
    if (menuHoverResult.hoverPreviewActive) {
      console.error('❌ BUG CONFIRMED: Hover preview still active over menu bar');
      await saveScreenshot(page, 'levelEditor/bugfix_menubar_hover_failed', false);
      throw new Error('Hover preview should be disabled over menu bar - BUG CONFIRMED');
    }
    
    await sleep(300);
    await saveScreenshot(page, 'levelEditor/bugfix_menubar_hover', true);
    
    // Test 3: Verify terrain interaction works when NOT over menu bar
    console.log('Test 3: Terrain interaction should work away from menu bar...');
    const terrainClickResult = await page.evaluate(() => {
      // Click on terrain (below menu bar)
      const clickX = 400;
      const clickY = 300;
      
      const result = window.levelEditor.handleClick(clickX, clickY);
      
      return {
        clickX,
        clickY,
        clickHandled: result !== false
      };
    });
    
    console.log('Terrain click result:', terrainClickResult);
    
    // Terrain click should work normally
    if (!terrainClickResult.clickHandled) {
      console.warn('⚠️ WARNING: Terrain click was blocked (should work normally)');
    }
    
    await sleep(300);
    await saveScreenshot(page, 'levelEditor/bugfix_terrain_click', true);
    
    // Test 4: Verify drag painting blocked over menu bar (Bug Fix #4)
    console.log('Test 4: Drag painting should be blocked over menu bar...');
    const dragMenuBarResult = await page.evaluate(() => {
      // Get menu bar position
      const menuBarY = window.levelEditor.fileMenuBar ? window.levelEditor.fileMenuBar.position.y : 0;
      const menuBarHeight = window.levelEditor.fileMenuBar ? window.levelEditor.fileMenuBar.height : 40;
      
      // Select paint tool
      if (window.levelEditor.toolbar) {
        window.levelEditor.toolbar.selectTool('paint');
      }
      
      // Track paint calls
      let paintCalled = false;
      const originalPaint = window.levelEditor.editor.paint;
      window.levelEditor.editor.paint = function(...args) {
        paintCalled = true;
        return originalPaint.apply(this, args);
      };
      
      // Simulate drag over menu bar
      const dragX = 200;
      const dragY = menuBarY + menuBarHeight / 2;
      
      window.levelEditor.handleDrag(dragX, dragY);
      
      // Restore original paint function
      window.levelEditor.editor.paint = originalPaint;
      
      return {
        dragX,
        dragY,
        menuBarY,
        menuBarHeight,
        paintCalled,
        expectedPaintCalled: false // Should NOT paint over menu bar
      };
    });
    
    console.log('Drag menu bar result:', dragMenuBarResult);
    
    if (dragMenuBarResult.paintCalled) {
      console.error('❌ BUG CONFIRMED: Drag painting still active over menu bar');
      await saveScreenshot(page, 'levelEditor/bugfix_drag_menubar_failed', false);
      throw new Error('Drag painting should be blocked over menu bar - BUG CONFIRMED');
    }
    
    await sleep(300);
    await saveScreenshot(page, 'levelEditor/bugfix_drag_menubar_blocked', true);
    
    // Test 5: Verify drag painting works on canvas (not over menu bar)
    console.log('Test 5: Drag painting should work on canvas...');
    const dragCanvasResult = await page.evaluate(() => {
      // Track paint calls
      let paintCalled = false;
      const originalPaint = window.levelEditor.editor.paint;
      window.levelEditor.editor.paint = function(...args) {
        paintCalled = true;
        return originalPaint.apply(this, args);
      };
      
      // Simulate drag on canvas (away from menu bar)
      const dragX = 400;
      const dragY = 300;
      
      window.levelEditor.handleDrag(dragX, dragY);
      
      // Restore original paint function
      window.levelEditor.editor.paint = originalPaint;
      
      return {
        dragX,
        dragY,
        paintCalled,
        expectedPaintCalled: true // SHOULD paint on canvas
      };
    });
    
    console.log('Drag canvas result:', dragCanvasResult);
    
    if (!dragCanvasResult.paintCalled) {
      console.error('❌ ERROR: Drag painting not working on canvas (should work normally)');
      await saveScreenshot(page, 'levelEditor/bugfix_drag_canvas_failed', false);
      throw new Error('Drag painting should work on canvas');
    }
    
    await sleep(300);
    await saveScreenshot(page, 'levelEditor/bugfix_drag_canvas_works', true);
    
    // Test 6: Verify click on menu bar does NOT paint terrain (Bug Fix #4 extension)
    console.log('Test 6: Click on menu bar should NOT paint terrain...');
    const clickMenuBarResult = await page.evaluate(() => {
      // Get menu bar position
      const menuBarY = window.levelEditor.fileMenuBar ? window.levelEditor.fileMenuBar.position.y : 0;
      const menuBarHeight = window.levelEditor.fileMenuBar ? window.levelEditor.fileMenuBar.height : 40;
      
      // Select paint tool
      if (window.levelEditor.toolbar) {
        window.levelEditor.toolbar.selectTool('paint');
      }
      
      // Track paint calls
      let paintCalled = false;
      const originalPaint = window.levelEditor.editor.paint;
      window.levelEditor.editor.paint = function(...args) {
        paintCalled = true;
        return originalPaint.apply(this, args);
      };
      
      // Click on menu bar
      const clickX = 100;
      const clickY = menuBarY + menuBarHeight / 2;
      
      window.levelEditor.handleClick(clickX, clickY);
      
      // Restore original paint function
      window.levelEditor.editor.paint = originalPaint;
      
      return {
        clickX,
        clickY,
        menuBarY,
        menuBarHeight,
        paintCalled,
        expectedPaintCalled: false // Should NOT paint over menu bar
      };
    });
    
    console.log('Click menu bar result:', clickMenuBarResult);
    
    if (clickMenuBarResult.paintCalled) {
      console.error('❌ BUG CONFIRMED: Click on menu bar still paints terrain');
      await saveScreenshot(page, 'levelEditor/bugfix_click_menubar_failed', false);
      throw new Error('Click on menu bar should NOT paint terrain - BUG CONFIRMED');
    }
    
    await sleep(300);
    await saveScreenshot(page, 'levelEditor/bugfix_click_menubar_blocked', true);
    
    console.log('✅ Menu bar hover bug fix verified!');
    console.log('✅ Drag painting over menu bar bug fix verified!');
    console.log('✅ Click on menu bar does NOT paint terrain verified!');
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await saveScreenshot(page, 'levelEditor/bugfix_menubar_error', false);
    await browser.close();
    process.exit(1);
  }
})();
