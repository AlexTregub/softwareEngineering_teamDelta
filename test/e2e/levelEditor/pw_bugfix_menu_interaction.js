/**
 * E2E Test: Menu Bar Interaction Bug Fix (#3)
 * 
 * Tests the complete fix for menu blocking all input:
 * 1. Menu bar remains clickable when dropdown open
 * 2. Can switch between menus
 * 3. Canvas click closes menu and is consumed
 * 4. Terrain interaction works when menu closed
 * 
 * SCREENSHOTS: Visual proof of fix working correctly
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    // Navigate to game
    await page.goto('http://localhost:8000?test=1');
    
    // CRITICAL: Ensure game started (bypass main menu)
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Game failed to start - still on menu');
    }
    
    // Switch to Level Editor state
    await page.evaluate(() => {
      if (window.GameState && typeof window.GameState.setState === 'function') {
        window.GameState.setState('LEVEL_EDITOR');
      }
    });
    
    await sleep(500);
    
    console.log('✅ Test starting: Menu Bar Interaction Fix');
    
    // TEST 1: Open File menu
    const test1 = await page.evaluate(() => {
      const levelEditor = window.levelEditor;
      if (!levelEditor || !levelEditor.fileMenuBar) {
        return { success: false, error: 'LevelEditor or FileMenuBar not found' };
      }
      
      // Click on File menu
      levelEditor.fileMenuBar._calculateMenuPositions();
      const handled = levelEditor.fileMenuBar.handleClick(20, 20);
      
      return {
        success: handled && levelEditor.fileMenuBar.openMenuName === 'File',
        menuOpen: levelEditor.fileMenuBar.openMenuName,
        isMenuOpen: levelEditor.isMenuOpen
      };
    });
    
    if (!test1.success) {
      throw new Error(`Test 1 failed: Could not open File menu. Menu=${test1.menuOpen}, isMenuOpen=${test1.isMenuOpen}`);
    }
    
    console.log('✅ Test 1: File menu opened');
    
    // Force redraw
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    
    await sleep(300);
    await saveScreenshot(page, 'levelEditor/bugfix_menu_interaction_1_file_open', true);
    
    // TEST 2: Switch to Edit menu while File dropdown is open
    const test2 = await page.evaluate(() => {
      const levelEditor = window.levelEditor;
      const fileMenuBar = levelEditor.fileMenuBar;
      
      // File menu should still be open
      if (fileMenuBar.openMenuName !== 'File') {
        return { success: false, error: 'File menu not open' };
      }
      
      // Click on Edit menu (x=70 is inside Edit menu bounds)
      const handled = fileMenuBar.handleClick(70, 20);
      
      return {
        success: handled && fileMenuBar.openMenuName === 'Edit',
        menuOpen: fileMenuBar.openMenuName,
        wasHandled: handled
      };
    });
    
    if (!test2.success) {
      throw new Error(`Test 2 failed: Could not switch to Edit menu. Menu=${test2.menuOpen}, handled=${test2.wasHandled}`);
    }
    
    console.log('✅ Test 2: Switched from File to Edit menu');
    
    // Force redraw
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    
    await sleep(300);
    await saveScreenshot(page, 'levelEditor/bugfix_menu_interaction_2_edit_open', true);
    
    // TEST 3: Click on canvas to close menu
    const test3 = await page.evaluate(() => {
      const levelEditor = window.levelEditor;
      
      // Edit menu should be open
      if (levelEditor.fileMenuBar.openMenuName !== 'Edit') {
        return { success: false, error: 'Edit menu not open before canvas click' };
      }
      
      // Click on canvas (should close menu and consume click)
      levelEditor.handleClick(400, 300);
      
      return {
        success: levelEditor.fileMenuBar.openMenuName === null && !levelEditor.isMenuOpen,
        menuOpen: levelEditor.fileMenuBar.openMenuName,
        isMenuOpen: levelEditor.isMenuOpen
      };
    });
    
    if (!test3.success) {
      throw new Error(`Test 3 failed: Menu not closed. Menu=${test3.menuOpen}, isMenuOpen=${test3.isMenuOpen}`);
    }
    
    console.log('✅ Test 3: Canvas click closed menu');
    
    // Force redraw
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    
    await sleep(300);
    await saveScreenshot(page, 'levelEditor/bugfix_menu_interaction_3_menu_closed', true);
    
    // TEST 4: Verify terrain interaction works now
    const test4 = await page.evaluate(() => {
      const levelEditor = window.levelEditor;
      
      // Verify menu is closed
      if (levelEditor.fileMenuBar.openMenuName !== null || levelEditor.isMenuOpen) {
        return { success: false, error: 'Menu still open' };
      }
      
      // Click on canvas to paint
      // Mock the editor paint to track if it was called
      let paintCalled = false;
      const originalPaint = levelEditor.editor.paint;
      levelEditor.editor.paint = function() {
        paintCalled = true;
        return originalPaint.apply(this, arguments);
      };
      
      levelEditor.handleClick(400, 300);
      
      return {
        success: paintCalled,
        paintCalled: paintCalled
      };
    });
    
    if (!test4.success) {
      throw new Error(`Test 4 failed: Terrain painting not working. PaintCalled=${test4.paintCalled}`);
    }
    
    console.log('✅ Test 4: Terrain interaction works after menu closed');
    
    // Final screenshot showing normal operation
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    
    await sleep(300);
    await saveScreenshot(page, 'levelEditor/bugfix_menu_interaction_4_painting_works', true);
    
    console.log('✅ All tests passed!');
    console.log('📸 Screenshots saved to test/e2e/screenshots/levelEditor/');
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await saveScreenshot(page, 'levelEditor/bugfix_menu_interaction_error', false);
    await browser.close();
    process.exit(1);
  }
})();
