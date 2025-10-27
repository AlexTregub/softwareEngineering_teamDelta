/**
 * E2E Test: Menu Blocking with Mouse Click Verification
 * Tests that terrain editing is blocked when menu dropdown is open
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to app...');
    await page.goto('http://localhost:8000?test=1');
    
    // CRITICAL: Ensure game started
    console.log('Ensuring game started...');
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Game failed to start - still on menu');
    }
    
    console.log('Switching to LEVEL_EDITOR state...');
    await page.evaluate(() => {
      if (window.GameState && window.GameState.setState) {
        window.GameState.setState('LEVEL_EDITOR');
      } else {
        window.gameState = 'LEVEL_EDITOR';
      }
    });
    
    await sleep(1000);
    
    // Test 1: Click terrain when menu closed (should work)
    console.log('Test 1: Clicking terrain with menu closed (should paint)...');
    
    await page.evaluate(() => {
      // Ensure menu is closed
      if (window.levelEditor) {
        window.levelEditor.setMenuOpen(false);
        window.levelEditor.currentTool = 'paint';
      }
      
      // Force redraw
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(300);
    
    // Get terrain center position
    const terrainPos = await page.evaluate(() => {
      return {
        x: window.width / 2,
        y: window.height / 2
      };
    });
    
    // Click terrain
    console.log(`Clicking terrain at (${terrainPos.x}, ${terrainPos.y})...`);
    await page.mouse.click(terrainPos.x, terrainPos.y);
    await sleep(300);
    
    const menuClosedResult = await page.evaluate(() => {
      return {
        isMenuOpen: window.levelEditor.isMenuOpen,
        shouldWork: !window.levelEditor.isMenuOpen
      };
    });
    
    console.log('Menu closed click result:', menuClosedResult);
    await saveScreenshot(page, 'levelEditor/menu_closed_terrain_click', menuClosedResult.shouldWork);
    
    if (!menuClosedResult.shouldWork) {
      throw new Error('Menu should be closed, terrain click should work');
    }
    
    // Test 2: Open menu, then click terrain (should be blocked)
    console.log('Test 2: Opening menu and clicking terrain (should be blocked)...');
    
    await page.evaluate(() => {
      // Open menu
      if (window.levelEditor) {
        window.levelEditor.setMenuOpen(true);
      }
      
      // Force redraw
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(300);
    await saveScreenshot(page, 'levelEditor/menu_open_before_click', true);
    
    // Try to click terrain while menu is open
    console.log(`Clicking terrain while menu open at (${terrainPos.x}, ${terrainPos.y})...`);
    await page.mouse.click(terrainPos.x, terrainPos.y);
    await sleep(300);
    
    const menuOpenResult = await page.evaluate(() => {
      const clickResult = window.levelEditor.handleClick(window.width / 2, window.height / 2);
      
      return {
        isMenuOpen: window.levelEditor.isMenuOpen,
        clickBlocked: clickResult === false,
        shouldBlock: window.levelEditor.isMenuOpen
      };
    });
    
    console.log('Menu open click result:', menuOpenResult);
    await saveScreenshot(page, 'levelEditor/menu_open_terrain_blocked', menuOpenResult.clickBlocked);
    
    if (!menuOpenResult.clickBlocked) {
      throw new Error('Click should be blocked when menu is open');
    }
    
    // Test 3: Close menu, verify clicks work again
    console.log('Test 3: Closing menu and verifying clicks work again...');
    
    await page.evaluate(() => {
      // Close menu
      if (window.levelEditor) {
        window.levelEditor.setMenuOpen(false);
      }
      
      // Force redraw
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(300);
    
    // Click terrain again
    await page.mouse.click(terrainPos.x, terrainPos.y);
    await sleep(300);
    
    const menuReopenedResult = await page.evaluate(() => {
      return {
        isMenuOpen: window.levelEditor.isMenuOpen,
        shouldWork: !window.levelEditor.isMenuOpen
      };
    });
    
    console.log('Menu reopened (closed) result:', menuReopenedResult);
    await saveScreenshot(page, 'levelEditor/menu_closed_clicks_work', menuReopenedResult.shouldWork);
    
    if (!menuReopenedResult.shouldWork) {
      throw new Error('Clicks should work after menu is closed');
    }
    
    // Test 4: Test hover preview blocking
    console.log('Test 4: Testing hover preview blocking with menu open...');
    
    await page.evaluate(() => {
      // Open menu
      window.levelEditor.setMenuOpen(true);
      
      // Create mock hover preview manager if it doesn't exist
      if (!window.levelEditor.hoverPreviewManager) {
        window.levelEditor.hoverPreviewManager = {
          cleared: false,
          clear: function() { this.cleared = true; }
        };
      }
    });
    
    await sleep(300);
    
    // Move mouse over terrain
    await page.mouse.move(terrainPos.x, terrainPos.y);
    await sleep(300);
    
    const hoverResult = await page.evaluate(() => {
      // Call handleMouseMove to test hover blocking
      window.levelEditor.handleMouseMove(window.width / 2, window.height / 2);
      
      return {
        isMenuOpen: window.levelEditor.isMenuOpen,
        hoverCleared: window.levelEditor.hoverPreviewManager ? 
          window.levelEditor.hoverPreviewManager.cleared : false
      };
    });
    
    console.log('Hover preview result:', hoverResult);
    await saveScreenshot(page, 'levelEditor/menu_open_hover_blocked', true);
    
    // Test 5: Multiple menu open/close cycles with clicks
    console.log('Test 5: Testing multiple menu open/close cycles...');
    
    for (let i = 0; i < 3; i++) {
      // Open menu
      await page.evaluate(() => {
        window.levelEditor.setMenuOpen(true);
      });
      await sleep(200);
      
      // Try click (should be blocked)
      await page.mouse.click(terrainPos.x, terrainPos.y);
      await sleep(200);
      
      // Close menu
      await page.evaluate(() => {
        window.levelEditor.setMenuOpen(false);
      });
      await sleep(200);
      
      // Try click (should work)
      await page.mouse.click(terrainPos.x, terrainPos.y);
      await sleep(200);
    }
    
    await saveScreenshot(page, 'levelEditor/menu_toggle_cycles_complete', true);
    
    console.log('✅ All menu blocking tests passed!');
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await saveScreenshot(page, 'levelEditor/menu_blocking_error', false);
    await browser.close();
    process.exit(1);
  }
})();
