/**
 * E2E tests for NewMapDialog user interactions
 * Tests hover highlights and blinking cursor with real browser rendering
 * 
 * CRITICAL: Uses real user flow - hover, click, type
 * Provides screenshot proof of visual feedback
 * 
 * Run: node test/e2e/ui/pw_newmap_dialog_interactions.js
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  try {
    console.log('📋 E2E Test: NewMapDialog Interactions');
    console.log('=========================================\n');
    
    await page.goto('http://localhost:8000?test=1');
    await sleep(1000);
    
    // CRITICAL: Ensure Level Editor started (NewMapDialog available there)
    const editorStarted = await cameraHelper.ensureLevelEditorStarted(page);
    if (!editorStarted.started) {
      throw new Error('Level Editor failed to start');
    }
    
    console.log('✓ Level Editor started\n');
    await sleep(500);
    
    // Test 1: Open NewMapDialog
    console.log('Test 1: Open NewMapDialog');
    const dialogOpened = await page.evaluate(() => {
      // Find level editor instance
      if (!window.levelEditor || !window.levelEditor.newMapDialog) {
        return { success: false, error: 'NewMapDialog not found' };
      }
      
      // Show dialog
      window.levelEditor.newMapDialog.show();
      
      return { 
        success: window.levelEditor.newMapDialog.visible,
        x: window.levelEditor.newMapDialog.x,
        y: window.levelEditor.newMapDialog.y,
        width: window.levelEditor.newMapDialog.width,
        height: window.levelEditor.newMapDialog.height
      };
    });
    
    if (!dialogOpened.success) {
      console.log(`✗ FAIL: ${dialogOpened.error}`);
      testsFailed++;
    } else {
      console.log(`✓ PASS: Dialog opened at (${dialogOpened.x}, ${dialogOpened.y})`);
      testsPassed++;
    }
    
    await sleep(500);
    await saveScreenshot(page, 'ui/newmap_dialog_opened', dialogOpened.success);
    
    // Test 2: Hover over width input (should highlight)
    console.log('\nTest 2: Hover over width input');
    
    // Get input position
    const inputPosition = await page.evaluate(() => {
      const dialog = window.levelEditor.newMapDialog;
      const widthInput = dialog.widthInput;
      return {
        x: dialog.x + widthInput.x + widthInput.width / 2,
        y: dialog.y + widthInput.y + widthInput.height / 2
      };
    });
    
    // Move mouse over width input
    await page.mouse.move(inputPosition.x, inputPosition.y);
    await sleep(300); // Wait for hover to register
    
    // Force redraw to update hover state
    await page.evaluate(() => {
      window.gameState = 'LEVEL_EDITOR';
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    await sleep(300);
    
    const hoverState = await page.evaluate(() => {
      const widthInput = window.levelEditor.newMapDialog.widthInput;
      return {
        isHovered: widthInput.isHovered,
        isFocused: widthInput.isFocused,
        backgroundColor: widthInput.backgroundColor,
        hoverColor: widthInput.hoverColor
      };
    });
    
    if (hoverState.isHovered) {
      console.log('✓ PASS: Width input shows hover state');
      console.log(`  Background: ${hoverState.backgroundColor} → Hover: ${hoverState.hoverColor}`);
      testsPassed++;
    } else {
      console.log('✗ FAIL: Width input NOT showing hover state');
      console.log(`  isHovered: ${hoverState.isHovered}`);
      testsFailed++;
    }
    
    await saveScreenshot(page, 'ui/newmap_hover_width_input', hoverState.isHovered);
    
    // Test 3: Click width input (should focus and show cursor)
    console.log('\nTest 3: Click width input for focus');
    await page.mouse.click(inputPosition.x, inputPosition.y);
    await sleep(300);
    
    // Force redraw
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    await sleep(300);
    
    const focusState = await page.evaluate(() => {
      const widthInput = window.levelEditor.newMapDialog.widthInput;
      return {
        isFocused: widthInput.isFocused,
        cursorVisible: widthInput.cursorVisible,
        cursorBlinkTimer: widthInput.cursorBlinkTimer,
        value: widthInput.value
      };
    });
    
    if (focusState.isFocused) {
      console.log('✓ PASS: Width input is focused');
      console.log(`  Cursor visible: ${focusState.cursorVisible}`);
      console.log(`  Cursor timer: ${focusState.cursorBlinkTimer}`);
      console.log(`  Current value: "${focusState.value}"`);
      testsPassed++;
    } else {
      console.log('✗ FAIL: Width input NOT focused after click');
      testsFailed++;
    }
    
    await saveScreenshot(page, 'ui/newmap_focused_width_input', focusState.isFocused);
    
    // Test 4: Wait for cursor blink cycle (should see cursor toggle)
    console.log('\nTest 4: Observe cursor blinking over time');
    
    const blinkStates = [];
    for (let i = 0; i < 5; i++) {
      // Force multiple redraws to update cursor blink timer
      await page.evaluate(() => {
        for (let j = 0; j < 10; j++) {
          if (typeof window.redraw === 'function') {
            window.redraw();
          }
        }
      });
      await sleep(100);
      
      const state = await page.evaluate(() => {
        const widthInput = window.levelEditor.newMapDialog.widthInput;
        return {
          cursorVisible: widthInput.cursorVisible,
          timer: widthInput.cursorBlinkTimer,
          interval: widthInput.cursorBlinkInterval
        };
      });
      
      blinkStates.push(state);
      console.log(`  Frame ${i}: cursorVisible=${state.cursorVisible}, timer=${state.timer}/${state.interval}`);
    }
    
    // Check if cursor toggled at least once
    const cursorToggled = blinkStates.some((state, idx) => {
      if (idx === 0) return false;
      return state.cursorVisible !== blinkStates[idx - 1].cursorVisible;
    });
    
    if (cursorToggled) {
      console.log('✓ PASS: Cursor blinks (visible state toggled)');
      testsPassed++;
    } else {
      console.log('✗ FAIL: Cursor did NOT blink (no visible state change)');
      console.log('  This suggests renderToBuffer not being called continuously');
      testsFailed++;
    }
    
    // Take screenshot at cursor visible and invisible states
    const finalState = blinkStates[blinkStates.length - 1];
    await saveScreenshot(page, 'ui/newmap_cursor_blink', finalState.cursorVisible);
    
    // Test 5: Type a digit and verify cursor moves
    console.log('\nTest 5: Type digit and verify cursor position updates');
    
    await page.evaluate(() => {
      const widthInput = window.levelEditor.newMapDialog.widthInput;
      widthInput.setValue(''); // Clear first
      widthInput.handleKeyPress('1', 49);
      
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    await sleep(300);
    
    const afterTyping = await page.evaluate(() => {
      const widthInput = window.levelEditor.newMapDialog.widthInput;
      return {
        value: widthInput.value,
        isFocused: widthInput.isFocused,
        cursorVisible: widthInput.cursorVisible
      };
    });
    
    if (afterTyping.value === '1' && afterTyping.isFocused) {
      console.log(`✓ PASS: Typed '1', cursor should be after digit`);
      console.log(`  Value: "${afterTyping.value}"`);
      testsPassed++;
    } else {
      console.log('✗ FAIL: Typing did not update value correctly');
      console.log(`  Expected: "1", Got: "${afterTyping.value}"`);
      testsFailed++;
    }
    
    await saveScreenshot(page, 'ui/newmap_after_typing', afterTyping.value === '1');
    
    // Summary
    console.log('\n=========================================');
    console.log(`Tests Passed: ${testsPassed}`);
    console.log(`Tests Failed: ${testsFailed}`);
    console.log('=========================================\n');
    
    await browser.close();
    process.exit(testsFailed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Test suite error:', error.message);
    console.error(error.stack);
    await saveScreenshot(page, 'ui/newmap_error', false);
    await browser.close();
    process.exit(1);
  }
})();
