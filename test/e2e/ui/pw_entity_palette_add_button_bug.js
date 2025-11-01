/**
 * E2E Test: Entity Palette Add Button Visibility Bug
 * 
 * Test Strategy:
 * 1. Switch to Custom category
 * 2. Check if Add button appears
 * 3. Wait 2 seconds and check if it's still visible
 * 4. Track any visibility state changes
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  console.log('🧪 Entity Palette Add Button Visibility Test');
  
  await page.goto('http://localhost:8000?test=1');
  await sleep(1000);
  
  // Enter Level Editor
  console.log('⏳ Entering Level Editor...');
  await page.evaluate(() => {
    if (window.GameState && typeof window.GameState.setState === 'function') {
      window.GameState.setState('LEVEL_EDITOR');
    }
    if (window.levelEditor && window.g_map2) {
      window.levelEditor.initialize(window.g_map2);
    }
  });
  
  await sleep(1000);
  
  // Entity Palette should be visible by default now (after stateVisibility fix)
  console.log('✅ Entity Palette should be visible\n');
  
  // Get initial state
  const initialState = await page.evaluate(() => {
    if (!window.levelEditor || !window.levelEditor.entityPalette) {
      return { error: 'EntityPalette not found' };
    }
    
    return {
      currentCategory: window.levelEditor.entityPalette.currentCategory,
      hasAddButton: !!window.levelEditor.entityPalette._addButton
    };
  });
  
  console.log('Initial state:', initialState);
  
  // Take screenshot before switching
  await saveScreenshot(page, 'ui/add_button_bug/01_before_switch', true);
  
  // Switch to Custom category
  console.log('\n🖱️  Switching to Custom category...\n');
  await page.evaluate(() => {
    window.levelEditor.entityPalette.setCategory('custom');
    
    // Force multiple redraws
    if (typeof window.redraw === 'function') {
      window.redraw();
      window.redraw();
      window.redraw();
    }
  });
  
  await sleep(100);
  await saveScreenshot(page, 'ui/add_button_bug/02_immediately_after_switch', true);
  
  // Check state immediately after switch
  const immediateState = await page.evaluate(() => {
    return {
      currentCategory: window.levelEditor.entityPalette.currentCategory,
      hasAddButton: !!window.levelEditor.entityPalette._addButton,
      buttonState: window.levelEditor.entityPalette._addButton ? {
        x: window.levelEditor.entityPalette._addButton.x,
        y: window.levelEditor.entityPalette._addButton.y,
        width: window.levelEditor.entityPalette._addButton.width,
        height: window.levelEditor.entityPalette._addButton.height,
        label: window.levelEditor.entityPalette._addButton.label
      } : null
    };
  });
  
  console.log('Immediate state (after switch):');
  console.log('  Category:', immediateState.currentCategory);
  console.log('  Has Add button:', immediateState.hasAddButton);
  if (immediateState.buttonState) {
    console.log('  Button:', immediateState.buttonState);
  }
  
  // Wait 500ms and check again
  await sleep(500);
  await saveScreenshot(page, 'ui/add_button_bug/03_after_500ms', true);
  
  const after500msState = await page.evaluate(() => {
    return {
      currentCategory: window.levelEditor.entityPalette.currentCategory,
      hasAddButton: !!window.levelEditor.entityPalette._addButton,
      buttonState: window.levelEditor.entityPalette._addButton ? {
        x: window.levelEditor.entityPalette._addButton.x,
        y: window.levelEditor.entityPalette._addButton.y,
        width: window.levelEditor.entityPalette._addButton.width,
        height: window.levelEditor.entityPalette._addButton.height,
        label: window.levelEditor.entityPalette._addButton.label
      } : null
    };
  });
  
  console.log('\nAfter 500ms:');
  console.log('  Category:', after500msState.currentCategory);
  console.log('  Has Add button:', after500msState.hasAddButton);
  if (after500msState.buttonState) {
    console.log('  Button:', after500msState.buttonState);
  }
  
  // Wait 2 seconds total and check final state
  await sleep(1500);
  await saveScreenshot(page, 'ui/add_button_bug/04_after_2000ms', true);
  
  const finalState = await page.evaluate(() => {
    return {
      currentCategory: window.levelEditor.entityPalette.currentCategory,
      hasAddButton: !!window.levelEditor.entityPalette._addButton,
      buttonState: window.levelEditor.entityPalette._addButton ? {
        x: window.levelEditor.entityPalette._addButton.x,
        y: window.levelEditor.entityPalette._addButton.y,
        width: window.levelEditor.entityPalette._addButton.width,
        height: window.levelEditor.entityPalette._addButton.height,
        label: window.levelEditor.entityPalette._addButton.label
      } : null
    };
  });
  
  console.log('\nFinal state (after 2s):');
  console.log('  Category:', finalState.currentCategory);
  console.log('  Has Add button:', finalState.hasAddButton);
  if (finalState.buttonState) {
    console.log('  Button:', finalState.buttonState);
  }
  
  // Check for bug
  const bugDetected = immediateState.hasAddButton && !finalState.hasAddButton;
  
  console.log('\n==================================================');
  if (bugDetected) {
    console.log('❌ BUG CONFIRMED');
    console.log('==================================================');
    console.log('Add button appeared immediately but vanished after 2 seconds');
  } else if (immediateState.hasAddButton && finalState.hasAddButton) {
    console.log('✅ NO BUG - Button persists');
    console.log('==================================================');
  } else if (!immediateState.hasAddButton) {
    console.log('❌ BUTTON NEVER APPEARED');
    console.log('==================================================');
  } else {
    console.log('⚠️  UNKNOWN STATE');
    console.log('==================================================');
  }
  
  await browser.close();
  process.exit(bugDetected || !immediateState.hasAddButton ? 1 : 0);
})();
