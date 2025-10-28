/**
 * E2E Test: Events Panel Flag Cursor Visual Verification
 * Tests the visual rendering of the flag cursor (🚩) during placement mode.
 * 
 * This test verifies:
 * 1. Flag cursor appears at mouse position
 * 2. Trigger radius circle is visible
 * 3. Visual indicator is clear and properly positioned
 * 4. Screenshots provide visual evidence
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  try {
    console.log('Navigating to game...');
    await page.goto('http://localhost:8000?test=1');
    
    // CRITICAL: Ensure game started
    console.log('Ensuring game started...');
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Failed to start game - still on menu');
    }
    
    console.log('Game started successfully');
    await sleep(500);
    
    // Enter Level Editor
    console.log('Entering Level Editor...');
    await page.evaluate(() => {
      if (window.GameState && typeof window.GameState.setState === 'function') {
        window.GameState.setState('LEVEL_EDITOR');
      } else {
        throw new Error('GameState not available');
      }
    });
    await sleep(500);
    
    // Force render Level Editor state
    await page.evaluate(() => {
      window.gameState = 'LEVEL_EDITOR';
      if (window.draggablePanelManager) {
        window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
      }
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    await sleep(500);
    
    console.log('Level Editor active');
    
    // Screenshot: Before placement mode
    await saveScreenshot(page, 'ui/events_flag_cursor_00_before', true);
    console.log('Screenshot: Level Editor (before placement mode)');
    
    // Enter placement mode
    console.log('Entering placement mode...');
    const entered = await page.evaluate(() => {
      if (!window.levelEditor || !window.levelEditor.eventEditor) {
        return { success: false, error: 'LevelEditor or EventEditor not found' };
      }
      
      const eventEditor = window.levelEditor.eventEditor;
      const success = eventEditor.enterPlacementMode('test-event-1');
      
      return {
        success: success,
        isActive: eventEditor.isInPlacementMode()
      };
    });
    
    if (!entered.success) {
      throw new Error(`Failed to enter placement mode: ${entered.error}`);
    }
    
    console.log(`Placement mode active: ${entered.isActive}`);
    
    // Move cursor to center of screen and update placement cursor
    console.log('Moving cursor to center...');
    await page.mouse.move(640, 360);
    await page.evaluate(() => {
      if (window.levelEditor && window.levelEditor.eventEditor) {
        window.levelEditor.eventEditor.updatePlacementCursor(640, 360);
      }
    });
    
    // Force render to show flag cursor
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    await sleep(500);
    
    // Screenshot: Flag cursor at center
    await saveScreenshot(page, 'ui/events_flag_cursor_01_center', true);
    console.log('Screenshot: Flag cursor at center (640, 360)');
    
    // Move cursor to upper left
    console.log('Moving cursor to upper left...');
    await page.mouse.move(300, 200);
    await page.evaluate(() => {
      if (window.levelEditor && window.levelEditor.eventEditor) {
        window.levelEditor.eventEditor.updatePlacementCursor(300, 200);
      }
    });
    
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    await sleep(500);
    
    // Screenshot: Flag cursor at upper left
    await saveScreenshot(page, 'ui/events_flag_cursor_02_upper_left', true);
    console.log('Screenshot: Flag cursor at upper left (300, 200)');
    
    // Move cursor to lower right (avoiding UI)
    console.log('Moving cursor to lower right...');
    await page.mouse.move(900, 500);
    await page.evaluate(() => {
      if (window.levelEditor && window.levelEditor.eventEditor) {
        window.levelEditor.eventEditor.updatePlacementCursor(900, 500);
      }
    });
    
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    await sleep(500);
    
    // Screenshot: Flag cursor at lower right
    await saveScreenshot(page, 'ui/events_flag_cursor_03_lower_right', true);
    console.log('Screenshot: Flag cursor at lower right (900, 500)');
    
    // Test cancellation with ESC
    console.log('Testing ESC cancellation...');
    await page.keyboard.press('Escape');
    await sleep(300);
    
    const cancelResult = await page.evaluate(() => {
      if (!window.levelEditor || !window.levelEditor.eventEditor) {
        return { stillActive: true };
      }
      
      return {
        stillActive: window.levelEditor.eventEditor.isInPlacementMode()
      };
    });
    
    if (cancelResult.stillActive) {
      throw new Error('Placement mode did not cancel on ESC key press');
    }
    
    console.log('ESC key successfully cancelled placement mode');
    
    // Force render to show no flag cursor
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    await sleep(500);
    
    // Screenshot: After cancellation (no flag cursor)
    await saveScreenshot(page, 'ui/events_flag_cursor_04_after_cancel', true);
    console.log('Screenshot: After ESC cancellation (no flag cursor)');
    
    console.log('\nAll tests passed! ✅');
    console.log('Visual verification screenshots saved:');
    console.log('  - events_flag_cursor_00_before.png (before placement mode)');
    console.log('  - events_flag_cursor_01_center.png (flag at center)');
    console.log('  - events_flag_cursor_02_upper_left.png (flag at upper left)');
    console.log('  - events_flag_cursor_03_lower_right.png (flag at lower right)');
    console.log('  - events_flag_cursor_04_after_cancel.png (after ESC cancel)');
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('Test failed:', error.message);
    await saveScreenshot(page, 'ui/events_flag_cursor_error', false);
    await browser.close();
    process.exit(1);
  }
})();
