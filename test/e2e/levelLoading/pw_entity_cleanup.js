/**
 * E2E Test: Entity Cleanup Verification
 * =======================================
 * Verifies procedural entities are cleared before loading custom level
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('[E2E] Starting test: Entity Cleanup Before Level Load');
    
    // Navigate to game
    await page.goto('http://localhost:8000?test=1');
    await sleep(2000);
    
    console.log('[E2E] Game loaded, waiting for main menu...');
    
    // Wait for main menu
    await page.waitForFunction(() => {
      return window.GameState && window.GameState.getState() === 'MENU';
    }, { timeout: 10000 });
    
    console.log('[E2E] Main menu ready');
    await saveScreenshot(page, 'entityCleanup/01_main_menu', true);
    
    // Click Start Game to trigger procedural generation
    console.log('[E2E] Clicking Start Game...');
    await page.evaluate(() => {
      if (window.startGameTransition && typeof window.startGameTransition === 'function') {
        window.startGameTransition();
      }
    });
    
    // Wait for state transition
    await sleep(3000);
    
    // Check entity counts before cleanup
    const beforeCleanup = await page.evaluate(() => {
      return {
        state: window.GameState ? window.GameState.getState() : 'unknown',
        ants: (window.ants && Array.isArray(window.ants)) ? window.ants.length : 0,
        resources: (window.resource_list && Array.isArray(window.resource_list)) ? window.resource_list.length : 0,
        buildings: (window.Buildings && Array.isArray(window.Buildings)) ? window.Buildings.length : 0,
        selectables: (window.selectables && Array.isArray(window.selectables)) ? window.selectables.length : 0
      };
    });
    
    console.log('[E2E] Entity counts after state transition:', beforeCleanup);
    
    // Force multiple redraws
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(500);
    await saveScreenshot(page, 'entityCleanup/02_after_transition', true);
    
    // Verify cleanup happened (entities should be 0 in IN_GAME)
    if (beforeCleanup.state === 'IN_GAME') {
      console.log('[E2E] IN_GAME state confirmed');
      
      // Check if cleanup worked
      const allCleared = beforeCleanup.ants === 0 && 
                         beforeCleanup.resources === 0 && 
                         beforeCleanup.buildings === 0;
      
      if (allCleared) {
        console.log('[E2E] ✅ Initial cleanup successful');
        console.log(`[E2E] - Ants: ${beforeCleanup.ants}`);
        console.log(`[E2E] - Resources: ${beforeCleanup.resources}`);
        console.log(`[E2E] - Buildings: ${beforeCleanup.buildings}`);
        console.log(`[E2E] - Selectables: ${beforeCleanup.selectables}`);
        
        await saveScreenshot(page, 'entityCleanup/03_cleanup_success', true);
        
        // CRITICAL: Wait 5 seconds and verify resources DON'T respawn
        console.log('[E2E] Waiting 5 seconds to verify no auto-spawning...');
        await sleep(5000);
        
        const afterWait = await page.evaluate(() => {
          // Deep inspection of resource spawning system
          const diagnostics = {
            ants: (window.ants && Array.isArray(window.ants)) ? window.ants.length : 0,
            resources: (window.resource_list && Array.isArray(window.resource_list)) ? window.resource_list.length : 0,
            buildings: (window.Buildings && Array.isArray(window.Buildings)) ? window.Buildings.length : 0,
            
            // Check g_resourceManager (might be in global scope, not window)
            resourceManagerExists: typeof g_resourceManager !== 'undefined',
            resourceManagerIsActive: typeof g_resourceManager !== 'undefined' ? g_resourceManager.isActive : 'not found',
            resourceManagerTimer: typeof g_resourceManager !== 'undefined' ? (g_resourceManager.timer !== null) : 'not found',
            
            // Check window.g_resourceManager
            windowResourceManagerExists: typeof window.g_resourceManager !== 'undefined',
            windowResourceManagerIsActive: window.g_resourceManager ? window.g_resourceManager.isActive : 'not found',
            
            // Check resource_list for clues
            resourceListExists: typeof resource_list !== 'undefined',
            resourceListType: typeof resource_list,
            resourceListLength: (typeof resource_list !== 'undefined' && resource_list) ? resource_list.length : 0,
            
            // Check global resource spawning functions
            spawnInitialResourcesExists: typeof spawnInitialResources !== 'undefined',
            
            // List all resources if any exist
            resourceDetails: (window.resource_list && Array.isArray(window.resource_list) && window.resource_list.length > 0) 
              ? window.resource_list.map(r => ({
                  type: r.type || r.constructor.name,
                  x: r.x || (r.getPosition && r.getPosition().x),
                  y: r.y || (r.getPosition && r.getPosition().y)
                }))
              : []
          };
          
          return diagnostics;
        });
        
        console.log('[E2E] ====== RESOURCE SPAWNING DIAGNOSTICS ======');
        console.log('[E2E] Entity counts after 5 seconds:');
        console.log(`[E2E] - Ants: ${afterWait.ants}`);
        console.log(`[E2E] - Resources: ${afterWait.resources}`);
        console.log(`[E2E] - Buildings: ${afterWait.buildings}`);
        console.log('[E2E]');
        console.log('[E2E] Resource Manager Status:');
        console.log(`[E2E] - g_resourceManager exists: ${afterWait.resourceManagerExists}`);
        console.log(`[E2E] - g_resourceManager.isActive: ${afterWait.resourceManagerIsActive}`);
        console.log(`[E2E] - g_resourceManager.timer: ${afterWait.resourceManagerTimer}`);
        console.log(`[E2E] - window.g_resourceManager exists: ${afterWait.windowResourceManagerExists}`);
        console.log('[E2E]');
        console.log('[E2E] Resource List Status:');
        console.log(`[E2E] - resource_list exists: ${afterWait.resourceListExists}`);
        console.log(`[E2E] - resource_list type: ${afterWait.resourceListType}`);
        console.log(`[E2E] - resource_list length: ${afterWait.resourceListLength}`);
        console.log('[E2E]');
        
        if (afterWait.resourceDetails && afterWait.resourceDetails.length > 0) {
          console.log('[E2E] Resource Details (SHOULD BE EMPTY):');
          afterWait.resourceDetails.forEach((r, i) => {
            console.log(`[E2E]   ${i+1}. Type: ${r.type}, Position: (${r.x}, ${r.y})`);
          });
        }
        console.log('[E2E] ==========================================');
        
        // Force redraw
        await page.evaluate(() => {
          if (typeof window.redraw === 'function') {
            window.redraw();
            window.redraw();
            window.redraw();
          }
        });
        
        await sleep(500);
        await saveScreenshot(page, 'entityCleanup/04_after_5_seconds', true);
        
        // Verify still no entities
        const stillCleared = afterWait.ants === 0 && 
                             afterWait.resources === 0 && 
                             afterWait.buildings === 0;
        
        // Check if spawning is properly disabled
        const spawningDisabled = afterWait.resourceManagerIsActive === false || 
                                afterWait.resourceManagerIsActive === 'not found';
        
        if (stillCleared && spawningDisabled) {
          console.log('[E2E] ✅ SUCCESS: No entities spawned and spawning is disabled');
          console.log(`[E2E] - Resource spawning active: ${afterWait.resourceManagerIsActive}`);
          await browser.close();
          process.exit(0);
        } else if (stillCleared && !spawningDisabled) {
          console.log('[E2E] ⚠️ WARNING: No entities spawned BUT spawning is still active!');
          console.log(`[E2E] - This means spawning could resume at any time`);
          console.log(`[E2E] - Resource spawning active: ${afterWait.resourceManagerIsActive}`);
          
          await saveScreenshot(page, 'entityCleanup/05_spawning_still_active', false);
          await browser.close();
          process.exit(1);
        } else {
          console.log('[E2E] ❌ FAILED: Entities spawned during wait period');
          console.log(`[E2E] - Ants: ${afterWait.ants} (should be 0)`);
          console.log(`[E2E] - Resources: ${afterWait.resources} (should be 0)`);
          console.log(`[E2E] - Buildings: ${afterWait.buildings} (should be 0)`);
          console.log(`[E2E] - Resource spawning active: ${afterWait.resourceManagerIsActive}`);
          
          await saveScreenshot(page, 'entityCleanup/06_entities_spawned', false);
          await browser.close();
          process.exit(1);
        }
      } else {
        console.log('[E2E] ❌ FAILED: Some entities remain after cleanup');
        console.log(`[E2E] - Ants remaining: ${beforeCleanup.ants}`);
        console.log(`[E2E] - Resources remaining: ${beforeCleanup.resources}`);
        console.log(`[E2E] - Buildings remaining: ${beforeCleanup.buildings}`);
        
        await saveScreenshot(page, 'entityCleanup/06_cleanup_failed', false);
        await browser.close();
        process.exit(1);
      }
    } else {
      console.log(`[E2E] ❌ FAILED: Expected IN_GAME, got ${beforeCleanup.state}`);
      await saveScreenshot(page, 'entityCleanup/07_wrong_state', false);
      await browser.close();
      process.exit(1);
    }
    
  } catch (error) {
    console.error('[E2E] Error:', error);
    await saveScreenshot(page, 'entityCleanup/error', false);
    await browser.close();
    process.exit(1);
  }
})();
