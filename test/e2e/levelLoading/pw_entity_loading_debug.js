/**
 * E2E Test: Entity Loading Debug
 * ================================
 * Debug test to identify why entities from CaveTutorial.json are not appearing in-game
 * 
 * BUG REPORT:
 * 1. Entities from JSON not being loaded into game world
 * 2. Camera not tracking queen (may be related to #1)
 * 
 * TEST STRATEGY:
 * - Add console logs at each step of entity loading process
 * - Verify LevelLoader.loadLevel() returns entities
 * - Verify entities have correct structure
 * - Verify entities are registered with global ants[] array
 * - Verify queen is found and tracked
 * - Screenshot proof at each stage
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('\n=== E2E Test: Entity Loading Debug ===\n');
    
    // Enable console logging from page
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[loadCustomLevel]') || 
          text.includes('[EntityFactory]') || 
          text.includes('[LevelLoader]') ||
          text.includes('Entity')) {
        console.log(`[PAGE] ${text}`);
      }
    });
    
    // Navigate and wait for menu
    await page.goto('http://localhost:8000?test=1');
    await sleep(2000);
    
    console.log('[E2E] Step 1: Waiting for main menu...');
    await page.waitForFunction(() => {
      return window.GameState && window.GameState.getState() === 'MENU';
    }, { timeout: 10000 });
    console.log('[E2E] ✅ Main menu ready\n');
    
    // Take screenshot of main menu
    await saveScreenshot(page, 'entityLoadingDebug/01_main_menu', true);
    
    // Start game (loads CaveTutorial)
    console.log('[E2E] Step 2: Starting game (loading custom level)...');
    await page.evaluate(() => {
      if (window.startGameTransition) {
        window.startGameTransition();
      }
    });
    
    await sleep(3000); // Wait for level to load
    
    // Check game state
    const gameState = await page.evaluate(() => {
      return window.GameState ? window.GameState.getState() : null;
    });
    
    console.log(`[E2E] Game state: ${gameState}`);
    
    if (gameState !== 'IN_GAME') {
      console.error(`[E2E] ❌ FAILED: Expected IN_GAME, got ${gameState}`);
      await saveScreenshot(page, 'entityLoadingDebug/02_state_error', false);
      await browser.close();
      process.exit(1);
    }
    
    console.log('[E2E] ✅ IN_GAME state confirmed\n');
    
    // DEBUG STEP 1: Check if LevelLoader exists
    console.log('[E2E] Step 3: Checking LevelLoader availability...');
    const loaderCheck = await page.evaluate(() => {
      return {
        levelLoaderExists: typeof window.LevelLoader !== 'undefined',
        entityFactoryExists: typeof window.EntityFactory !== 'undefined',
        findQueenExists: typeof window.queenDetection !== 'undefined'
      };
    });
    
    console.log('[E2E] LevelLoader exists:', loaderCheck.levelLoaderExists);
    console.log('[E2E] EntityFactory exists:', loaderCheck.entityFactoryExists);
    console.log('[E2E] queenDetection exists:', loaderCheck.findQueenExists);
    
    if (!loaderCheck.levelLoaderExists) {
      console.error('[E2E] ❌ CRITICAL: LevelLoader not loaded!');
      await saveScreenshot(page, 'entityLoadingDebug/03_loader_missing', false);
    }
    
    // DEBUG STEP 2: Check entity arrays
    console.log('\n[E2E] Step 4: Checking entity arrays...');
    const entityArrays = await page.evaluate(() => {
      return {
        antsExists: typeof window.ants !== 'undefined',
        antsIsArray: Array.isArray(window.ants),
        antsLength: Array.isArray(window.ants) ? window.ants.length : 'N/A',
        resourcesExists: typeof window.resource_list !== 'undefined',
        resourcesLength: Array.isArray(window.resource_list) ? window.resource_list.length : 'N/A',
        buildingsExists: typeof window.Buildings !== 'undefined',
        buildingsLength: Array.isArray(window.Buildings) ? window.Buildings.length : 'N/A',
        queenAntExists: typeof window.queenAnt !== 'undefined',
        queenAntValue: window.queenAnt || null
      };
    });
    
    console.log('[E2E] ants[] exists:', entityArrays.antsExists, '| Length:', entityArrays.antsLength);
    console.log('[E2E] resource_list[] exists:', entityArrays.resourcesExists, '| Length:', entityArrays.resourcesLength);
    console.log('[E2E] Buildings[] exists:', entityArrays.buildingsExists, '| Length:', entityArrays.buildingsLength);
    console.log('[E2E] window.queenAnt exists:', entityArrays.queenAntExists);
    
    if (entityArrays.antsLength === 0) {
      console.error('[E2E] ❌ BUG CONFIRMED: ants[] array is empty! Entities not loaded.');
    } else {
      console.log('[E2E] ✅ Entities found in ants[] array');
    }
    
    // DEBUG STEP 3: Manually call LevelLoader to see what it returns
    console.log('\n[E2E] Step 5: Testing LevelLoader directly...');
    const levelLoaderTest = await page.evaluate(async () => {
      try {
        // Fetch level JSON
        const response = await fetch('levels/CaveTutorial.json');
        const levelData = await response.json();
        
        console.log('[DEBUG] Level JSON fetched, tiles:', levelData.tiles?.length, 'entities:', levelData.entities?.length);
        
        // Test LevelLoader
        if (typeof window.LevelLoader !== 'undefined') {
          const loader = new window.LevelLoader();
          const result = loader.loadLevel(levelData);
          
          console.log('[DEBUG] LevelLoader result:', result);
          console.log('[DEBUG] Entities returned:', result.entities?.length);
          
          // Log first few entities
          if (result.entities && result.entities.length > 0) {
            console.log('[DEBUG] First entity:', JSON.stringify(result.entities[0], null, 2));
          }
          
          return {
            success: result.success,
            entityCount: result.entities ? result.entities.length : 0,
            firstEntity: result.entities && result.entities.length > 0 ? result.entities[0] : null,
            errors: result.errors || []
          };
        }
        
        return { error: 'LevelLoader not defined' };
      } catch (err) {
        return { error: err.message };
      }
    });
    
    console.log('[E2E] LevelLoader test result:', JSON.stringify(levelLoaderTest, null, 2));
    
    if (levelLoaderTest.error) {
      console.error('[E2E] ❌ LevelLoader test failed:', levelLoaderTest.error);
    } else if (levelLoaderTest.entityCount === 0) {
      console.error('[E2E] ❌ LevelLoader returned 0 entities!');
    } else {
      console.log(`[E2E] ✅ LevelLoader successfully created ${levelLoaderTest.entityCount} entities`);
      console.log('[E2E] First entity type:', levelLoaderTest.firstEntity?.type);
      console.log('[E2E] First entity position:', levelLoaderTest.firstEntity?.position);
    }
    
    // DEBUG STEP 4: Check camera tracking
    console.log('\n[E2E] Step 6: Checking camera tracking...');
    const cameraCheck = await page.evaluate(() => {
      const camera = window.cameraManager;
      if (!camera) return { exists: false };
      
      return {
        exists: true,
        followEnabled: camera.cameraFollowEnabled || false,
        hasTarget: camera.cameraFollowTarget ? true : false,
        targetType: camera.cameraFollowTarget?.type || null,
        cameraX: camera.x || 0,
        cameraY: camera.y || 0
      };
    });
    
    console.log('[E2E] CameraManager exists:', cameraCheck.exists);
    console.log('[E2E] Camera follow enabled:', cameraCheck.followEnabled);
    console.log('[E2E] Camera has target:', cameraCheck.hasTarget);
    console.log('[E2E] Target type:', cameraCheck.targetType);
    console.log('[E2E] Camera position:', cameraCheck.cameraX, cameraCheck.cameraY);
    
    if (!cameraCheck.followEnabled) {
      console.error('[E2E] ❌ BUG CONFIRMED: Camera following not enabled!');
    }
    
    if (!cameraCheck.hasTarget) {
      console.error('[E2E] ❌ BUG CONFIRMED: Camera has no follow target (queen not found)!');
    }
    
    // Take final screenshot
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    await sleep(500);
    await saveScreenshot(page, 'entityLoadingDebug/04_final_state', true);
    
    // Summary
    console.log('\n=== DEBUG SUMMARY ===');
    console.log('LevelLoader exists:', loaderCheck.levelLoaderExists);
    console.log('Entities in ants[]:', entityArrays.antsLength);
    console.log('LevelLoader created entities:', levelLoaderTest.entityCount);
    console.log('Camera following enabled:', cameraCheck.followEnabled);
    console.log('Camera has queen target:', cameraCheck.hasTarget);
    
    // Determine test result
    const bugFound = entityArrays.antsLength === 0 || !cameraCheck.followEnabled;
    
    if (bugFound) {
      console.log('\n❌ TEST RESULT: BUGS CONFIRMED');
      console.log('Issue 1: Entities not registered with game world (ants[] array)');
      console.log('Issue 2: Camera not tracking queen (followEntity not called or queen not found)');
      console.log('\nROOT CAUSE: loadCustomLevel() creates entities but does NOT add them to global ants[] array');
      console.log('FIX NEEDED: After LevelLoader.loadLevel(), add entities to ants[] and register with spatialGridManager');
    } else {
      console.log('\n✅ TEST RESULT: Entities loaded correctly');
    }
    
    await browser.close();
    process.exit(bugFound ? 1 : 0);
    
  } catch (error) {
    console.error('[E2E] Error:', error);
    await saveScreenshot(page, 'entityLoadingDebug/99_error', false);
    await browser.close();
    process.exit(1);
  }
})();
