/**
 * Debug script to test game state and play button interaction
 * Run with: node test/bdd/debug_game_state.js
 */

const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function debugGameState() {
  console.log('🔍 Starting game state debugging...\n');
  
  let driver;
  
  try {
    // Step 1: Create browser
    console.log('1️⃣  Creating Chrome driver...');
    const options = new chrome.Options();
    options.addArguments('--headless=new');
    options.addArguments('--disable-gpu');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--window-size=1920,1080');
    
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
    
    console.log('✅ Chrome driver created\n');
    
    // Step 2: Load game
    console.log('2️⃣  Loading game at http://localhost:8000...');
    await driver.get('http://localhost:8000');
    await driver.sleep(3000); // Wait longer for initialization
    console.log('✅ Game loaded\n');
    
    // Check browser console logs for SEVERE errors
    const browserLogs = await driver.manage().logs().get('browser');
    const severeErrors = browserLogs.filter(log => log.level.name_ === 'SEVERE');
    if (severeErrors.length > 0) {
      console.log(`⚠️  ${severeErrors.length} SEVERE JavaScript errors detected:`);
      severeErrors.forEach(err => console.log('   ', err.message));
      console.log('');
    } else {
      console.log('✅ No SEVERE JavaScript errors\n');
    }
    
    // Step 3: Check initial game state
    console.log('3️⃣  Checking initial game state and waiting for initialization...');
    
    // Wait up to 10 seconds for gameState to be defined
    let attempts = 0;
    let state;
    while (attempts < 20) {
      state = await driver.executeScript(() => {
        return {
          gameState: typeof window.gameState !== 'undefined' ? window.gameState : 'UNDEFINED',
          menuManagerExists: typeof window.menuManager !== 'undefined',
          GameStateEnum: typeof window.GameState !== 'undefined',
          playButtonExists: document.getElementById('play-button') !== null,
          setupComplete: typeof window.setup === 'function'
        };
      });
      
      if (state.gameState !== 'UNDEFINED') {
        console.log(`   ✅ Game state initialized after ${(attempts + 1) * 500}ms`);
        break;
      }
      
      await driver.sleep(500);
      attempts++;
    }
    
    console.log('   Game State:', state.gameState);
    console.log('   MenuManager exists:', state.menuManagerExists);
    console.log('   GameState enum exists:', state.GameStateEnum);
    console.log('   Play button exists:', state.playButtonExists);
    console.log('   setup() function exists:', state.setupComplete);
    
    // Check if setup() was actually called
    const runtimeInfo = await driver.executeScript(() => {
      return {
        p5Exists: typeof window.p5 !== 'undefined',
        canvasExists: document.getElementById('defaultCanvas0') !== null,
        frameCountExists: typeof window.frameCount !== 'undefined',
        frameCount: window.frameCount || 0,
        drawExists: typeof window.draw === 'function'
      };
    });
    
    console.log('   p5.js loaded:', runtimeInfo.p5Exists);
    console.log('   Canvas exists:', runtimeInfo.canvasExists);
    console.log('   frameCount variable exists:', runtimeInfo.frameCountExists);
    console.log('   frameCount value:', runtimeInfo.frameCount);
    console.log('   draw() function exists:', runtimeInfo.drawExists);
    console.log('');
    
    // Step 4: Try to click play button
    console.log('4️⃣  Attempting to click play button...');
    const clickResult = await driver.executeScript(() => {
      const playButton = document.getElementById('play-button');
      if (playButton) {
        playButton.click();
        return {
          success: true,
          message: 'Play button clicked'
        };
      } else {
        return {
          success: false,
          message: 'Play button not found'
        };
      }
    });
    
    console.log('   Click result:', clickResult.message);
    console.log('');
    
    // Step 5: Wait and check game state after click
    if (clickResult.success) {
      console.log('5️⃣  Waiting 2 seconds for game state change...');
      await driver.sleep(2000);
      
      const afterClickState = await driver.executeScript(() => {
        return {
          gameState: typeof window.gameState !== 'undefined' ? window.gameState : 'UNDEFINED',
          menuVisible: document.getElementById('menu-screen')?.style.display || 'unknown',
          canvasExists: document.getElementById('canvas-container') !== null
        };
      });
      
      console.log('   Game State after click:', afterClickState.gameState);
      console.log('   Menu visibility:', afterClickState.menuVisible);
      console.log('   Canvas exists:', afterClickState.canvasExists);
      console.log('');
    }
    
    console.log('✅ Debug complete!\n');
    
  } catch (error) {
    console.error('❌ Error during debugging:', error.message);
    console.error(error.stack);
  } finally {
    if (driver) {
      console.log('🧹 Closing browser...');
      await driver.quit();
      console.log('✅ Browser closed');
    }
  }
}

// Run the debug
debugGameState();
