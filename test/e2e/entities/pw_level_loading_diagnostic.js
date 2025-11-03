/**
 * E2E Diagnostic: Custom Level Loading
 * 
 * Traces the entire custom level loading process step by step.
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('[Diagnostic] Loading game...');
    await page.goto('http://localhost:8000?test=1');
    await sleep(2000);
    
    // Capture console logs from the page
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[loadCustomLevel]') || text.includes('[registerEntitiesWithGameWorld]')) {
        console.log('[PAGE]', text);
      }
    });
    
    console.log('\n[Diagnostic] Attempting to load CaveTutorial.json...\n');
    
    const result = await page.evaluate(async () => {
      // Load custom level
      if (typeof loadCustomLevel === 'function') {
        await loadCustomLevel('levels/CaveTutorial.json');
      }
      
      // Return diagnostic info
      return {
        antsCount: Array.isArray(window.ants) ? window.ants.length : 0,
        resourcesCount: Array.isArray(window.resource_list) ? window.resource_list.length : 0,
        buildingsCount: Array.isArray(window.Buildings) ? window.Buildings.length : 0,
        gameState: typeof GameState !== 'undefined' ? GameState.getState() : 'unknown',
        levelLoaderExists: typeof LevelLoader !== 'undefined',
        registerFunctionExists: typeof registerEntitiesWithGameWorld === 'function'
      };
    });
    
    await sleep(2000);
    
    console.log('\n=== Loading Results ===');
    console.log('Ants loaded:', result.antsCount);
    console.log('Resources loaded:', result.resourcesCount);
    console.log('Buildings loaded:', result.buildingsCount);
    console.log('Game state:', result.gameState);
    console.log('LevelLoader available:', result.levelLoaderExists);
    console.log('registerEntitiesWithGameWorld available:', result.registerFunctionExists);
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('[Diagnostic] Error:', error);
    await browser.close();
    process.exit(1);
  }
})();
