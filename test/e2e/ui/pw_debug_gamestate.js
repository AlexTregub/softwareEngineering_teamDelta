/**
 * Debug script to check gameState vs GameState.current
 */

const { launchBrowser, sleep } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  let browser;

  try {
    console.log('\n🔍 Checking game state...\n');

    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.goto('http://localhost:8000?test=1');
    
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Game failed to start');
    }
    await sleep(1000);
    
    const stateInfo = await page.evaluate(() => {
      const manager = window.draggablePanelManager;
      
      return {
        windowGameState: window.gameState,
        windowGameStateCurrent: window.GameState ? window.GameState.current : 'undefined',
        managerGameState: manager ? manager.gameState : 'no manager',
        typeofWindowGameState: typeof window.GameState,
        typeofGlobalGameState: typeof global !== 'undefined' ? typeof global.GameState : 'no global'
      };
    });
    
    console.log('State Information:');
    console.log('  window.gameState:', stateInfo.windowGameState);
    console.log('  window.GameState.current:', stateInfo.windowGameStateCurrent);
    console.log('  manager.gameState:', stateInfo.managerGameState);
    console.log('  typeof window.GameState:', stateInfo.typeofWindowGameState);
    
    // Now test what the togglePanel code sees
    const toggleDebug = await page.evaluate(() => {
      const currentState = (typeof window !== 'undefined' && window.GameState) 
        ? window.GameState.current 
        : (typeof global !== 'undefined' && global.GameState) 
          ? global.GameState.current 
          : 'LEVEL_EDITOR';
      
      return {
        currentState: currentState,
        conditionCheck1: typeof window !== 'undefined',
        conditionCheck2: typeof window !== 'undefined' && window.GameState,
        conditionCheck3: window.GameState ? window.GameState.current : 'no GameState',
        managerGameState: window.draggablePanelManager.gameState
      };
    });
    
    console.log('\nTogglePanel code evaluation:');
    console.log('  Computed currentState:', toggleDebug.currentState);
    console.log('  window !== undefined:', toggleDebug.conditionCheck1);
    console.log('  window.GameState exists:', toggleDebug.conditionCheck2);
    console.log('  window.GameState.current:', toggleDebug.conditionCheck3);
    console.log('  manager.gameState:', toggleDebug.managerGameState);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
