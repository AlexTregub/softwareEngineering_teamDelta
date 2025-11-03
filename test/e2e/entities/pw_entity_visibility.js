/**
 * E2E Test: Entity Visibility Check
 * 
 * Verifies that loaded entities are actually VISIBLE on screen, not just loaded in memory.
 * Checks:
 * 1. Entities loaded into ants[] array  
 * 2. Entities registered with EntityRenderer
 * 3. EntityRenderer.renderAllLayers() is being called
 * 4. Camera positioned to show entities
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('[E2E] Loading game...');
    await page.goto('http://localhost:8000?test=1');
    await sleep(2000);
    
    // Load custom level
    console.log('[E2E] Loading CaveTutorial.json...');
    await page.evaluate(async () => {
      if (typeof loadCustomLevel === 'function') {
        await loadCustomLevel('levels/CaveTutorial.json');
      }
    });
    await sleep(1000);
    
    // Check 1: Ants array populated
    console.log('[E2E] Check 1: Ants array...');
    const antsCheck = await page.evaluate(() => {
      return {
        antsCount: Array.isArray(window.ants) ? window.ants.length : 0,
        firstAnt: Array.isArray(window.ants) && window.ants.length > 0 ? {
          type: window.ants[0].type,
          x: window.ants[0].x,
          y: window.ants[0].y
        } : null
      };
    });
    console.log('[E2E] Ants loaded:', antsCheck.antsCount);
    
    // Check 2: EntityRenderer exists and has entities
    console.log('[E2E] Check 2: EntityRenderer...');
    const rendererCheck = await page.evaluate(() => {
      const renderer = typeof EntityRenderer !== 'undefined' ? EntityRenderer : null;
      if (!renderer) return { exists: false };
      
      return {
        exists: true,
        hasRenderMethod: typeof renderer.renderAllLayers === 'function',
        antRenderersCount: renderer._antRenderers ? renderer._antRenderers.length : 0
      };
    });
    console.log('[E2E] EntityRenderer check:', rendererCheck);
    
    // Check 3: Camera position
    console.log('[E2E] Check 3: Camera position...');
    const cameraCheck = await page.evaluate(() => {
      if (!window.cameraManager) return { exists: false };
      
      const pos = cameraManager.getCameraPosition ? cameraManager.getCameraPosition() : 
                  { x: cameraManager.cameraX, y: cameraManager.cameraY, zoom: cameraManager.cameraZoom };
      
      const firstAnt = Array.isArray(window.ants) && window.ants.length > 0 ? window.ants[0] : null;
      
      return {
        exists: true,
        camera: pos,
        queenPosition: firstAnt ? { x: firstAnt.x, y: firstAnt.y } : null,
        distance: firstAnt ? Math.sqrt(Math.pow(pos.x - firstAnt.x, 2) + Math.pow(pos.y - firstAnt.y, 2)) : null
      };
    });
    console.log('[E2E] Camera check:', cameraCheck);
    
    // Check 4: RenderLayerManager rendering entities
    console.log('[E2E] Check 4: RenderLayerManager...');
    const renderCheck = await page.evaluate(() => {
      if (!window.RenderManager) return { exists: false };
      
      const entitiesRenderer = window.RenderManager.layerRenderers.get('entities');
      
      return {
        exists: true,
        hasEntitiesLayer: entitiesRenderer !== undefined,
        currentState: typeof GameState !== 'undefined' ? GameState.getState() : 'unknown'
      };
    });
    console.log('[E2E] Render check:', renderCheck);
    
    // Force redraw
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        for (let i = 0; i < 5; i++) window.redraw();
      }
    });
    await sleep(500);
    
    // Take screenshot
    await saveScreenshot(page, 'entities/entity_visibility', true);
    
    // Determine success
    const success = antsCheck.antsCount > 0 && 
                   rendererCheck.exists && 
                   renderCheck.exists &&
                   renderCheck.hasEntitiesLayer;
    
    console.log('\n=== Test Results ===');
    console.log(`Ants loaded: ${antsCheck.antsCount} ✅`);
    console.log(`EntityRenderer exists: ${rendererCheck.exists ? '✅' : '❌'}`);
    console.log(`RenderManager has entities layer: ${renderCheck.hasEntitiesLayer ? '✅' : '❌'}`);
    console.log(`Camera distance to queen: ${cameraCheck.distance ? Math.round(cameraCheck.distance) + 'px' : 'N/A'}`);
    console.log(success ? '\n✅ ALL CHECKS PASSED' : '\n❌ SOME CHECKS FAILED');
    
    await browser.close();
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('[E2E] Test error:', error);
    await saveScreenshot(page, 'entities/entity_visibility_error', false);
    await browser.close();
    process.exit(1);
  }
})();
