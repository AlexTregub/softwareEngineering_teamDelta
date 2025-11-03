/**
 * E2E Diagnostic: Ants Array vs Global Scope
 * 
 * Checks if ants array is accessible from both window and global scope.
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('[Diagnostic] Loading game...');
    await page.goto('http://localhost:8000?test=1');
    await sleep(2000);
    
    console.log('\n[Diagnostic] Loading custom level...\n');
    
    await page.evaluate(async () => {
      if (typeof loadCustomLevel === 'function') {
        await loadCustomLevel('levels/CaveTutorial.json');
      }
    });
    
    await sleep(1000);
    
    const diagnostic = await page.evaluate(() => {
      return {
        // Check window.ants
        windowAnts: typeof window.ants !== 'undefined',
        windowAntsLength: Array.isArray(window.ants) ? window.ants.length : 0,
        windowAntsType: typeof window.ants,
        
        // Check global ants (without window.)
        globalAnts: typeof ants !== 'undefined',
        globalAntsLength: typeof ants !== 'undefined' && Array.isArray(ants) ? ants.length : 0,
        globalAntsType: typeof ants,
        
        // Check if they're the same reference
        sameReference: typeof window.ants !== 'undefined' && typeof ants !== 'undefined' ? window.ants === ants : null,
        
        // Check EntityRenderer's access
        entityRendererAccess: (() => {
          try {
            // This simulates what EntityRenderer.collectAnts() does
            let count = 0;
            for (let i = 0; i < ants.length; i++) {
              if (ants[i]) count++;
            }
            return { success: true, count };
          } catch (e) {
            return { success: false, error: e.message };
          }
        })(),
        
        // Force EntityRenderer to collect entities
        entityRendererCollect: (() => {
          try {
            if (window.EntityRenderer && typeof window.EntityRenderer.collectEntities === 'function') {
              window.EntityRenderer.collectEntities('IN_GAME');
              return {
                success: true,
                antsGroupLength: window.EntityRenderer.renderGroups.ANTS.length,
                totalEntities: window.EntityRenderer.stats.totalEntities,
                rendered: window.EntityRenderer.stats.renderedEntities,
                culled: window.EntityRenderer.stats.culledEntities
              };
            }
            return { success: false, reason: 'EntityRenderer or collectEntities not found' };
          } catch (e) {
            return { success: false, error: e.message };
          }
        })()
      };
    });
    
    console.log('=== Ants Array Access ===');
    console.log('window.ants exists:', diagnostic.windowAnts);
    console.log('window.ants length:', diagnostic.windowAntsLength);
    console.log('window.ants type:', diagnostic.windowAntsType);
    console.log();
    console.log('global ants exists:', diagnostic.globalAnts);
    console.log('global ants length:', diagnostic.globalAntsLength);
    console.log('global ants type:', diagnostic.globalAntsType);
    console.log();
    console.log('Same reference:', diagnostic.sameReference);
    console.log();
    console.log('=== EntityRenderer Access Test ===');
    console.log('Manual loop test:', JSON.stringify(diagnostic.entityRendererAccess, null, 2));
    console.log();
    console.log('=== EntityRenderer.collectEntities() Test ===');
    console.log('Result:', JSON.stringify(diagnostic.entityRendererCollect, null, 2));
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('[Diagnostic] Error:', error);
    await browser.close();
    process.exit(1);
  }
})();
