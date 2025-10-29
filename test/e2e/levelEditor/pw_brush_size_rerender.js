/**
 * E2E Test: Brush Size Rerender
 * 
 * Tests that cursor preview updates immediately when brush size changes
 * via Shift+Scroll shortcut (no need to move mouse).
 * 
 * Expected Behavior:
 * - Initial: Size 1 shows 1x1 preview
 * - After Shift+Scroll Up: Preview immediately updates to show larger area
 * - No mouse movement required
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('Loading game...');
    await page.goto('http://localhost:8000?test=1');
    await sleep(2000);
    
    // Open Level Editor
    console.log('Starting game and opening Level Editor...');
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Failed to start game: ' + gameStarted.error);
    }
    
    // Open Level Editor
    await page.evaluate(() => {
      if (typeof window.openLevelEditor === 'function') {
        window.openLevelEditor();
      } else if (window.levelEditor) {
        window.levelEditor.activate();
      }
    });
    
    await sleep(500);
    console.log('✅ Level Editor opened');
    
    // TEST: Brush size change triggers immediate rerender
    console.log('\nTEST: Brush size change should update preview immediately...');
    const result = await page.evaluate(() => {
      const levelEditor = window.levelEditor;
      if (!levelEditor || !levelEditor.toolbar || !levelEditor.fileMenuBar) {
        return { success: false, error: 'Components not found' };
      }
      
      // Select paint tool
      levelEditor.toolbar.selectTool('paint');
      
      // Set brush size to 1
      if (levelEditor.fileMenuBar.brushSizeModule) {
        levelEditor.fileMenuBar.brushSizeModule.setSize(1);
      }
      
      // Position mouse at center of canvas (don't move it)
      const mouseX = 400;
      const mouseY = 300;
      
      // Trigger hover to generate initial preview (size 1)
      levelEditor.handleHover(mouseX, mouseY);
      
      // Store mouse position in levelEditor for later reuse
      levelEditor._lastHoverX = mouseX;
      levelEditor._lastHoverY = mouseY;
      
      // Get initial brush size
      const initialSize = levelEditor.fileMenuBar.brushSizeModule.getSize();
      
      // Change brush size via Shift+Scroll (simulate shortcut action)
      const mockEvent = { deltaY: -100 }; // Scroll up
      const modifiers = { shift: true, ctrl: false, alt: false };
      
      // This should trigger brush size change AND rerender
      const handled = levelEditor.handleMouseWheel(mockEvent, true, mouseX, mouseY);
      
      // Get final brush size (should have increased)
      const finalSize = levelEditor.fileMenuBar.brushSizeModule.getSize();
      
      // Check if handleHover was called after size change
      // (we'll add a flag in the implementation to track this)
      const hoverRecalledAfterSizeChange = levelEditor._hoverRecalledAfterSizeChange || false;
      
      return {
        success: true,
        initialSize: initialSize,
        finalSize: finalSize,
        handled: handled,
        sizeChanged: finalSize > initialSize,
        hoverRecalledAfterSizeChange: hoverRecalledAfterSizeChange,
        expectedBehavior: 'Preview should update immediately after brush size change (no mouse move required)'
      };
    });
    
    console.log('Brush size rerender result:', result);
    
    if (!result.success) {
      console.error('❌ Test failed:', result.error);
      await saveScreenshot(page, 'levelEditor/brush_size_rerender_error', false);
      await browser.close();
      process.exit(1);
    }
    
    // Check if size changed
    if (!result.sizeChanged) {
      console.error('❌ Brush size did not change (test setup issue)');
      console.error('   Initial size:', result.initialSize);
      console.error('   Final size:', result.finalSize);
      await saveScreenshot(page, 'levelEditor/brush_size_rerender_error', false);
      await browser.close();
      process.exit(1);
    }
    
    // BUG: Preview does NOT update automatically (need to move mouse)
    if (!result.hoverRecalledAfterSizeChange) {
      console.error('❌ BUG CONFIRMED: Preview did NOT update immediately after brush size change');
      console.error('   Initial size:', result.initialSize);
      console.error('   Final size:', result.finalSize);
      console.error('   Hover recalled:', result.hoverRecalledAfterSizeChange);
      console.error('   Root Cause: Brush size change does not trigger handleHover() automatically');
      await saveScreenshot(page, 'levelEditor/brush_size_rerender_bug', false);
      await browser.close();
      process.exit(1);
    }
    
    console.log('✅ Preview updated immediately after brush size change');
    console.log('   Initial size:', result.initialSize);
    console.log('   Final size:', result.finalSize);
    console.log('   Hover recalled:', result.hoverRecalledAfterSizeChange);
    
    await saveScreenshot(page, 'levelEditor/brush_size_rerender', true);
    await browser.close();
    
    console.log('\n✅ All brush size rerender tests passed');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test error:', error);
    await saveScreenshot(page, 'levelEditor/brush_size_rerender_error', false);
    await browser.close();
    process.exit(1);
  }
})();
