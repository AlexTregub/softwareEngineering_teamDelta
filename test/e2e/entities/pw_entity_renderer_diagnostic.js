/**
 * E2E Diagnostic: EntityRenderer Instance Check
 * 
 * Checks if window.EntityRenderer is correctly instantiated and has required methods.
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('[Diagnostic] Loading game...');
    await page.goto('http://localhost:8000?test=1');
    await sleep(2000);
    
    const diagnostic = await page.evaluate(() => {
      return {
        // Check if EntityRenderer exists
        entityRendererExists: typeof window.EntityRenderer !== 'undefined',
        entityRendererType: typeof window.EntityRenderer,
        
        // Check if it's a class or instance
        isFunction: typeof window.EntityRenderer === 'function',
        isObject: typeof window.EntityRenderer === 'object',
        
        // Check for methods
        hasRenderAllLayers: window.EntityRenderer && typeof window.EntityRenderer.renderAllLayers === 'function',
        hasCollectEntities: window.EntityRenderer && typeof window.EntityRenderer.collectEntities === 'function',
        hasRenderGroup: window.EntityRenderer && typeof window.EntityRenderer.renderGroup === 'function',
        
        // Check properties
        hasRenderGroups: window.EntityRenderer && typeof window.EntityRenderer.renderGroups !== 'undefined',
        hasConfig: window.EntityRenderer && typeof window.EntityRenderer.config !== 'undefined',
        hasStats: window.EntityRenderer && typeof window.EntityRenderer.stats !== 'undefined',
        
        // Get constructor name
        constructorName: window.EntityRenderer && window.EntityRenderer.constructor ? window.EntityRenderer.constructor.name : null,
        
        // List all own properties
        ownProperties: window.EntityRenderer ? Object.getOwnPropertyNames(window.EntityRenderer) : [],
        
        // Check ants array
        antsCount: Array.isArray(window.ants) ? window.ants.length : 0
      };
    });
    
    console.log('\n=== EntityRenderer Diagnostic ===');
    console.log('Exists:', diagnostic.entityRendererExists);
    console.log('Type:', diagnostic.entityRendererType);
    console.log('Is Function (class):', diagnostic.isFunction);
    console.log('Is Object (instance):', diagnostic.isObject);
    console.log('Constructor name:', diagnostic.constructorName);
    console.log('\n=== Methods ===');
    console.log('Has renderAllLayers():', diagnostic.hasRenderAllLayers);
    console.log('Has collectEntities():', diagnostic.hasCollectEntities);
    console.log('Has renderGroup():', diagnostic.hasRenderGroup);
    console.log('\n=== Properties ===');
    console.log('Has renderGroups:', diagnostic.hasRenderGroups);
    console.log('Has config:', diagnostic.hasConfig);
    console.log('Has stats:', diagnostic.hasStats);
    console.log('\n=== Own Properties ===');
    console.log('Properties:', diagnostic.ownProperties.slice(0, 20).join(', '));
    console.log('\n=== Game State ===');
    console.log('Ants loaded:', diagnostic.antsCount);
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('[Diagnostic] Error:', error);
    await browser.close();
    process.exit(1);
  }
})();
