/**
 * E2E Test: New Map Dialog
 * Tests NewMapDialog integration with Level Editor in real browser
 * 
 * Prerequisites:
 * - Server running on localhost:8000 (npm run dev)
 * 
 * Test Scenarios:
 * 1. Dialog opens on File → New
 * 2. Default values (50x50) pre-populated
 * 3. Valid dimensions accepted
 * 4. Invalid dimensions - too small (error message)
 * 5. Invalid dimensions - too large (error message)
 * 6. Terrain created with custom dimensions
 * 7. Cancel doesn't create terrain
 * 8. Escape key cancels
 * 
 * Screenshots saved to: test/e2e/screenshots/levelEditor/
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  let browser;
  let testsPassed = 0;
  let testsFailed = 0;
  const results = [];

  try {
    console.log('\n=== New Map Dialog E2E Tests ===\n');

    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto('http://localhost:8000?test=1');

    // CRITICAL: Ensure game started (bypass main menu)
    console.log('Ensuring game started...');
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Game failed to start - still on menu');
    }
    console.log('✓ Game started successfully\n');

    // CRITICAL: Activate Level Editor mode (initializes newMapDialog)
    console.log('Activating Level Editor mode...');
    const activationResult = await page.evaluate(() => {
      if (typeof GameState === 'undefined') {
        return { success: false, error: 'GameState not found' };
      }
      if (typeof levelEditor === 'undefined') {
        return { success: false, error: 'levelEditor not found' };
      }

      // Transition to LEVEL_EDITOR state (triggers initialize())
      GameState.goToLevelEditor();

      // Wait for initialization
      const active = levelEditor.isActive();
      const dialogExists = levelEditor.newMapDialog !== null && levelEditor.newMapDialog !== undefined;

      return {
        success: active && dialogExists,
        active: active,
        dialogExists: dialogExists
      };
    });

    if (!activationResult.success) {
      throw new Error(`Failed to activate Level Editor - active: ${activationResult.active}, dialog: ${activationResult.dialogExists}`);
    }
    console.log('✓ Level Editor activated\n');

    await sleep(1000);

    // ==================================================================
    // Test 1: Dialog opens on File → New
    // ==================================================================
    console.log('Test 1: Dialog opens on File → New');
    const test1Result = await page.evaluate(() => {
      // Trigger File → New
      const opened = window.levelEditor.handleFileNew();

      // Check if dialog is visible
      const dialogVisible = window.levelEditor.newMapDialog && 
                           window.levelEditor.newMapDialog.isVisible();

      // Force redraw
      if (window.RenderManager) window.RenderManager.render('PLAYING');
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }

      return {
        success: opened && dialogVisible,
        opened: opened,
        dialogVisible: dialogVisible
      };
    });

    await sleep(500);
    await saveScreenshot(page, 'levelEditor/new_map_dialog_open', test1Result.success);

    if (test1Result.success) {
      console.log('✓ Test 1 PASSED - Dialog opens\n');
      testsPassed++;
    } else {
      console.log(`✗ Test 1 FAILED - opened: ${test1Result.opened}, visible: ${test1Result.dialogVisible}\n`);
      testsFailed++;
    }
    results.push({ test: 'Dialog opens on File → New', passed: test1Result.success });

    // ==================================================================
    // Test 2: Default values (50x50) pre-populated
    // ==================================================================
    console.log('Test 2: Default values (50x50) pre-populated');
    const test2Result = await page.evaluate(() => {
      const dialog = window.levelEditor.newMapDialog;
      if (!dialog) {
        return { success: false, error: 'Dialog not found' };
      }

      const dimensions = dialog.getDimensions();
      const success = dimensions.width === 50 && dimensions.height === 50;

      return {
        success: success,
        width: dimensions.width,
        height: dimensions.height
      };
    });

    await saveScreenshot(page, 'levelEditor/new_map_dialog_defaults', test2Result.success);

    if (test2Result.success) {
      console.log('✓ Test 2 PASSED - Defaults: 50x50\n');
      testsPassed++;
    } else {
      console.log(`✗ Test 2 FAILED - Defaults: ${test2Result.width}x${test2Result.height}\n`);
      testsFailed++;
    }
    results.push({ test: 'Default values 50x50', passed: test2Result.success });

    // ==================================================================
    // Test 3: Valid dimensions accepted
    // ==================================================================
    console.log('Test 3: Valid dimensions accepted (100x100)');
    const test3Result = await page.evaluate(() => {
      const dialog = window.levelEditor.newMapDialog;
      
      // Set width to 100
      dialog._width = 100;
      dialog._height = 100;
      dialog._activeField = 'width';
      dialog.markDirty();

      const validation = dialog.validateDimensions();

      // Force redraw
      if (window.RenderManager) window.RenderManager.render('PLAYING');
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }

      return {
        success: validation.valid === true,
        valid: validation.valid,
        error: validation.error
      };
    });

    await sleep(500);
    await saveScreenshot(page, 'levelEditor/new_map_dialog_valid', test3Result.success);

    if (test3Result.success) {
      console.log('✓ Test 3 PASSED - Valid dimensions accepted\n');
      testsPassed++;
    } else {
      console.log(`✗ Test 3 FAILED - valid: ${test3Result.valid}, error: ${test3Result.error}\n`);
      testsFailed++;
    }
    results.push({ test: 'Valid dimensions accepted', passed: test3Result.success });

    // ==================================================================
    // Test 4: Invalid dimensions - too small
    // ==================================================================
    console.log('Test 4: Invalid dimensions - too small (5x5)');
    const test4Result = await page.evaluate(() => {
      const dialog = window.levelEditor.newMapDialog;
      
      // Set dimensions below minimum (10)
      dialog._width = 5;
      dialog._height = 5;
      dialog.markDirty();

      const validation = dialog.validateDimensions();

      // Force redraw
      if (window.RenderManager) window.RenderManager.render('PLAYING');
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }

      return {
        success: validation.valid === false && validation.error,
        valid: validation.valid,
        error: validation.error
      };
    });

    await sleep(500);
    await saveScreenshot(page, 'levelEditor/new_map_dialog_error_small', test4Result.success);

    if (test4Result.success) {
      console.log(`✓ Test 4 PASSED - Error shown: "${test4Result.error}"\n`);
      testsPassed++;
    } else {
      console.log(`✗ Test 4 FAILED - valid: ${test4Result.valid}, error: ${test4Result.error}\n`);
      testsFailed++;
    }
    results.push({ test: 'Invalid dimensions too small', passed: test4Result.success });

    // ==================================================================
    // Test 5: Invalid dimensions - too large
    // ==================================================================
    console.log('Test 5: Invalid dimensions - too large (250x250)');
    const test5Result = await page.evaluate(() => {
      const dialog = window.levelEditor.newMapDialog;
      
      // Set dimensions above maximum (200)
      dialog._width = 250;
      dialog._height = 250;
      dialog.markDirty();

      const validation = dialog.validateDimensions();

      // Force redraw
      if (window.RenderManager) window.RenderManager.render('PLAYING');
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }

      return {
        success: validation.valid === false && validation.error,
        valid: validation.valid,
        error: validation.error
      };
    });

    await sleep(500);
    await saveScreenshot(page, 'levelEditor/new_map_dialog_error_large', test5Result.success);

    if (test5Result.success) {
      console.log(`✓ Test 5 PASSED - Error shown: "${test5Result.error}"\n`);
      testsPassed++;
    } else {
      console.log(`✗ Test 5 FAILED - valid: ${test5Result.valid}, error: ${test5Result.error}\n`);
      testsFailed++;
    }
    results.push({ test: 'Invalid dimensions too large', passed: test5Result.success });

    // ==================================================================
    // Test 6: Terrain created with custom dimensions
    // ==================================================================
    console.log('Test 6: Terrain created with custom dimensions (80x60)');
    const test6Result = await page.evaluate(() => {
      const dialog = window.levelEditor.newMapDialog;
      
      // Set valid custom dimensions
      dialog._width = 80;
      dialog._height = 60;
      dialog.markDirty();

      // Confirm dialog (creates terrain)
      dialog.confirm();

      // Check if terrain was created (dialog should be hidden)
      const dialogHidden = !dialog.isVisible();
      const terrainExists = window.levelEditor.terrain !== null;

      // Force redraw
      if (window.RenderManager) window.RenderManager.render('PLAYING');
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }

      return {
        success: dialogHidden && terrainExists,
        dialogHidden: dialogHidden,
        terrainExists: terrainExists
      };
    });

    await sleep(500);
    await saveScreenshot(page, 'levelEditor/new_map_created', test6Result.success);

    if (test6Result.success) {
      console.log('✓ Test 6 PASSED - Terrain created\n');
      testsPassed++;
    } else {
      console.log(`✗ Test 6 FAILED - hidden: ${test6Result.dialogHidden}, terrain: ${test6Result.terrainExists}\n`);
      testsFailed++;
    }
    results.push({ test: 'Terrain created with dimensions', passed: test6Result.success });

    // ==================================================================
    // Test 7: Cancel doesn't create terrain
    // ==================================================================
    console.log('Test 7: Cancel doesn\'t create terrain');
    const test7Result = await page.evaluate(() => {
      // Open dialog again
      window.levelEditor.handleFileNew();
      const dialog = window.levelEditor.newMapDialog;

      // Store current terrain reference
      const terrainBefore = window.levelEditor.terrain;

      // Cancel dialog
      dialog.hide();

      // Check terrain unchanged
      const terrainAfter = window.levelEditor.terrain;
      const terrainUnchanged = terrainBefore === terrainAfter;
      const dialogHidden = !dialog.isVisible();

      // Force redraw
      if (window.RenderManager) window.RenderManager.render('PLAYING');
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }

      return {
        success: terrainUnchanged && dialogHidden,
        terrainUnchanged: terrainUnchanged,
        dialogHidden: dialogHidden
      };
    });

    await sleep(500);
    await saveScreenshot(page, 'levelEditor/new_map_cancelled', test7Result.success);

    if (test7Result.success) {
      console.log('✓ Test 7 PASSED - Cancel preserves terrain\n');
      testsPassed++;
    } else {
      console.log(`✗ Test 7 FAILED - unchanged: ${test7Result.terrainUnchanged}, hidden: ${test7Result.dialogHidden}\n`);
      testsFailed++;
    }
    results.push({ test: 'Cancel preserves terrain', passed: test7Result.success });

    // ==================================================================
    // Test 8: Escape key cancels
    // ==================================================================
    console.log('Test 8: Escape key cancels');
    const test8Result = await page.evaluate(() => {
      // Open dialog again
      window.levelEditor.handleFileNew();
      const dialog = window.levelEditor.newMapDialog;

      // Simulate Escape key press (keyCode 27)
      const ESC = 27;
      dialog.handleKeyPress('Escape', ESC);

      // Check dialog hidden
      const dialogHidden = !dialog.isVisible();

      // Force redraw
      if (window.RenderManager) window.RenderManager.render('PLAYING');
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }

      return {
        success: dialogHidden,
        dialogHidden: dialogHidden
      };
    });

    await sleep(500);
    await saveScreenshot(page, 'levelEditor/new_map_escape', test8Result.success);

    if (test8Result.success) {
      console.log('✓ Test 8 PASSED - Escape cancels dialog\n');
      testsPassed++;
    } else {
      console.log(`✗ Test 8 FAILED - hidden: ${test8Result.dialogHidden}\n`);
      testsFailed++;
    }
    results.push({ test: 'Escape key cancels', passed: test8Result.success });

    // ==================================================================
    // Summary
    // ==================================================================
    console.log('\n=== Test Summary ===');
    console.log(`Total: ${testsPassed + testsFailed}`);
    console.log(`Passed: ${testsPassed}`);
    console.log(`Failed: ${testsFailed}`);
    console.log('\nDetailed Results:');
    results.forEach((r, i) => {
      const icon = r.passed ? '✓' : '✗';
      console.log(`  ${icon} Test ${i + 1}: ${r.test}`);
    });

    await browser.close();

    // Exit with appropriate code
    process.exit(testsFailed > 0 ? 1 : 0);

  } catch (error) {
    console.error('\n✗ E2E Test Error:', error.message);
    console.error(error.stack);
    if (browser) await browser.close();
    process.exit(1);
  }
})();
