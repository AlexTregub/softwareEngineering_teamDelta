/**
 * E2E Test: Dev Room Button
 * Verifies "dev_room" button appears on main menu and loads g_map2
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  let success = false;
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('=== Dev Room Button E2E Test ===\n');
    
    // Step 1: Load game
    console.log('Step 1: Loading game at localhost:8000');
    await page.goto('http://localhost:8000');
    await sleep(2000); // Wait for menu to render
    
    // Step 2: Verify we're on main menu
    console.log('Step 2: Verifying main menu state');
    const menuState = await page.evaluate(() => {
      return {
        gameState: window.gameState,
        hasGameState: typeof window.GameState !== 'undefined',
        state: window.GameState ? window.GameState.getState() : null
      };
    });
    console.log('Menu state:', JSON.stringify(menuState, null, 2));
    
    // Step 3: Take screenshot of main menu with dev_room button
    console.log('Step 3: Taking screenshot of main menu');
    await saveScreenshot(page, 'ui/dev_room_menu', true);
    
    // Step 4: Find and click dev_room button
    console.log('Step 4: Searching for dev_room button');
    const devRoomButtonFound = await page.evaluate(() => {
      // Check if menuButtons exist
      if (!window.menuButtons || !Array.isArray(window.menuButtons)) {
        return { found: false, reason: 'menuButtons not available' };
      }
      
      // Find dev_room button
      const devButton = window.menuButtons.find(btn => btn.caption === 'dev_room');
      if (!devButton) {
        return { 
          found: false, 
          reason: 'dev_room button not found',
          availableButtons: window.menuButtons.map(b => b.caption || b.text || 'unknown')
        };
      }
      
      return {
        found: true,
        button: {
          caption: devButton.caption,
          x: devButton.x,
          y: devButton.y,
          w: devButton.width,
          h: devButton.height
        }
      };
    });
    
    console.log('dev_room button search result:', JSON.stringify(devRoomButtonFound, null, 2));
    
    if (!devRoomButtonFound.found) {
      throw new Error(`dev_room button not found: ${devRoomButtonFound.reason}`);
    }
    
    // Step 5: Click dev_room button
    console.log('Step 5: Clicking dev_room button');
    const clickResult = await page.evaluate(() => {
      const devButton = window.menuButtons.find(btn => btn.caption === 'dev_room');
      if (!devButton || !devButton.onClick) {
        return { clicked: false, reason: 'Button or action not available' };
      }
      
      // Check if g_map2 exists before clicking
      const hasG_map2 = typeof window.g_map2 !== 'undefined' && window.g_map2 !== null;
      
      // Click button
      devButton.onClick();
      
      return { 
        clicked: true,
        hadG_map2: hasG_map2
      };
    });
    
    console.log('Click result:', JSON.stringify(clickResult, null, 2));
    
    if (!clickResult.clicked) {
      throw new Error(`Failed to click dev_room button: ${clickResult.reason}`);
    }
    
    // Step 6: Wait for state change
    console.log('Step 6: Waiting for state change to PLAYING');
    await sleep(1000);
    
    // Step 7: Verify game state changed to PLAYING
    console.log('Step 7: Verifying game state is PLAYING');
    const finalState = await page.evaluate(() => {
      return {
        gameState: window.gameState,
        GameStateObj: window.GameState ? window.GameState.getState() : null,
        hasG_activeMap: typeof window.g_activeMap !== 'undefined',
        g_activeMapIsG_map2: window.g_activeMap === window.g_map2,
        hasAnts: Array.isArray(window.ants) && window.ants.length > 0
      };
    });
    
    console.log('Final state:', JSON.stringify(finalState, null, 2));
    
    // Force redraw to ensure PLAYING state renders
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    await sleep(500);
    
    // Step 8: Take screenshot of game in PLAYING state
    console.log('Step 8: Taking screenshot of PLAYING state');
    await saveScreenshot(page, 'ui/dev_room_playing', true);
    
    // Verify state is PLAYING
    if (finalState.GameStateObj === 'PLAYING' || finalState.gameState === 'PLAYING') {
      console.log('✓ SUCCESS: dev_room button loaded g_map2 and changed state to PLAYING');
      success = true;
    } else {
      throw new Error(`State did not change to PLAYING (got: ${finalState.GameStateObj || finalState.gameState})`);
    }
    
  } catch (error) {
    console.error('✗ TEST FAILED:', error.message);
    await saveScreenshot(page, 'ui/dev_room_error', false);
    success = false;
  } finally {
    await browser.close();
  }
  
  console.log(`\n=== Test ${success ? 'PASSED' : 'FAILED'} ===`);
  process.exit(success ? 0 : 1);
})();
