/**
 * Debug script to check when setup() runs and when g_selectionBoxController is created
 */

const { launchBrowser, sleep } = require('./puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  // Log page console messages
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  try {
    const baseUrl = process.env.TEST_URL || 'http://localhost:8000';
    const url = baseUrl + '?test=1';
    
    console.log('Loading:', url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    
    // Wait for p5.js to actually call setup() by checking if ants array exists
    console.log('\nWaiting for p5.js setup() to run...');
    try {
      await page.waitForFunction(() => {
        // ants array is created in initializeWorld() which is called in setup()
        return typeof window.ants !== 'undefined';
      }, { timeout: 15000 });
      console.log('ants array exists - setup() has run!');
    } catch (e) {
      console.warn('Timeout waiting for setup() to run');
    }
    
    await sleep(2000);
    
    // Check initial state
    const initial = await page.evaluate(() => {
      return {
        hasSetup: typeof window.setup === 'function',
        hasDraw: typeof window.draw === 'function',
        hasGameState: typeof window.gameState !== 'undefined',
        gameState: window.gameState,
        hasController: typeof window.g_selectionBoxController !== 'undefined',
        controllerValue: window.g_selectionBoxController,
        hasAnts: typeof window.ants !== 'undefined',
        antsLength: window.ants ? window.ants.length : 0
      };
    });
    
    console.log('Initial state:', JSON.stringify(initial, null, 2));
    
    // Try to start the game
    console.log('\nAttempting to start game...');
    await page.evaluate(() => {
      try {
        const gs = window.GameState || window.g_gameState || null;
        if (gs && typeof gs.getState === 'function') {
          console.log('GameState.getState():', gs.getState());
          if (gs.getState() !== 'PLAYING') {
            if (typeof gs.startGame === 'function') {
              console.log('Calling GameState.startGame()');
              gs.startGame();
            }
          }
        }
        if (typeof startGame === 'function') {
          console.log('Calling startGame()');
          startGame();
        }
        if (typeof startGameTransition === 'function') {
          console.log('Calling startGameTransition()');
          startGameTransition();
        }
        if (typeof window.startNewGame === 'function') {
          console.log('Calling startNewGame()');
          window.startNewGame();
        }
      } catch (e) {
        console.error('Error starting game:', e);
      }
    });
    
    // Wait a bit
    await sleep(3000);
    
    // Check again
    const after = await page.evaluate(() => {
      return {
        hasGameState: typeof window.gameState !== 'undefined',
        gameState: window.gameState,
        hasController: typeof window.g_selectionBoxController !== 'undefined',
        controllerValue: window.g_selectionBoxController,
        controllerType: window.g_selectionBoxController ? typeof window.g_selectionBoxController : null,
        hasAnts: typeof window.ants !== 'undefined',
        antsLength: window.ants ? window.ants.length : 0,
        hasMouseController: typeof window.g_mouseController !== 'undefined',
        hasTileManager: typeof window.g_tileInteractionManager !== 'undefined'
      };
    });
    
    console.log('\nAfter start attempt:', JSON.stringify(after, null, 2));
    
    // Check if SelectionBoxController class exists
    const classCheck = await page.evaluate(() => {
      return {
        hasClass: typeof SelectionBoxController !== 'undefined',
        hasGetInstance: typeof SelectionBoxController !== 'undefined' && typeof SelectionBoxController.getInstance === 'function',
        canInstantiate: typeof SelectionBoxController !== 'undefined' ? 'yes' : 'no'
      };
    });
    
    console.log('\nClass check:', JSON.stringify(classCheck, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();
