/**
 * E2E Test: Level Editor Initialization with DynamicGridOverlay
 * 
 * Verifies that Level Editor can initialize DynamicGridOverlay
 * without crashing when terrain bounds are null/undefined.
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  console.log('\n======================================================================');
  console.log('E2E Test: Level Editor DynamicGridOverlay Initialization');
  console.log('======================================================================\n');

  const browser = await launchBrowser();
  const page = await browser.newPage();

  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  try {
    console.log('📄 Loading page...');
    await page.goto('http://127.0.0.1:5500', { waitUntil: 'domcontentloaded', timeout: 10000 });
    
    await sleep(1000);

    // Try to click "Level Editor" button
    console.log('🖱️  Attempting to enter Level Editor...');
    
    const levelEditorResult = await page.evaluate(() => {
      // Check if we can navigate to level editor
      if (typeof window.GameStateManager !== 'undefined' && 
          typeof window.GameStateManager.goToLevelEditor === 'function') {
        try {
          window.GameStateManager.goToLevelEditor();
          return { 
            success: true, 
            state: window.GameStateManager.currentState || 'unknown',
            gridOverlayExists: typeof window.DynamicGridOverlay !== 'undefined'
          };
        } catch (err) {
          return { success: false, error: err.message };
        }
      }
      return { success: false, error: 'GameStateManager not available' };
    });

    console.log('Level Editor navigation:', JSON.stringify(levelEditorResult, null, 2));

    await sleep(2000);

    // Check for errors
    const hasBoundsError = consoleErrors.some(err => err.includes('bounds is null')) ||
                           pageErrors.some(err => err.includes('bounds is null'));

    const hasCannotAccessError = consoleErrors.some(err => err.includes("can't access property")) ||
                                 pageErrors.some(err => err.includes("can't access property"));

    const hasTypeError = consoleErrors.some(err => err.includes('TypeError')) ||
                         pageErrors.some(err => err.includes('TypeError'));

    console.log('\n✅ No "bounds is null" error:', !hasBoundsError);
    console.log('✅ No "can\'t access property" error:', !hasCannotAccessError);
    console.log('✅ No TypeError:', !hasTypeError);

    if (consoleErrors.length > 0) {
      console.log('\n⚠️  Console Errors:');
      consoleErrors.slice(0, 5).forEach(err => console.log('   -', err.substring(0, 100)));
    }

    if (pageErrors.length > 0) {
      console.log('\n⚠️  Page Errors:');
      pageErrors.slice(0, 5).forEach(err => console.log('   -', err.substring(0, 100)));
    }

    // Take screenshot
    await saveScreenshot(page, 'ui/level_editor_init', true);

    const allPassed = !hasBoundsError && !hasCannotAccessError && !hasTypeError;

    console.log('\n======================================================================');
    if (allPassed) {
      console.log('✅ PASS: Level Editor initializes without bounds errors');
    } else {
      console.log('❌ FAIL: Level Editor has initialization errors');
    }
    console.log('======================================================================\n');

    await browser.close();
    process.exit(allPassed ? 0 : 1);

  } catch (error) {
    console.error('❌ Test error:', error.message);
    await saveScreenshot(page, 'ui/level_editor_init_error', false);
    await browser.close();
    process.exit(1);
  }
})();
