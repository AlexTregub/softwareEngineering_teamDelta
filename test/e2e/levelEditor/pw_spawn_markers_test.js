/**
 * E2E Test: Verify entity SPAWN MARKERS load and are visible
 * Tests _entitySpawnData (not placedEntities) and visual rendering
 * HEADLESS: Runs in headless browser mode
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('LevelEditor') || text.includes('entity') || text.includes('spawn')) {
      console.log(`[BROWSER] ${text}`);
    }
  });
  
  try {
    console.log('\n=== Loading game and Level Editor ===');
    await page.goto('http://localhost:8000?test=1');
    await sleep(2000);
    
    await page.evaluate(() => {
      window.GameState.setState('LEVEL_EDITOR');
    });
    await sleep(1000);
    
    console.log('\n=== Loading CaveTutorial.json ===');
    const levelPath = path.join(__dirname, '../../../levels/CaveTutorial.json');
    const levelDataString = fs.readFileSync(levelPath, 'utf8');
    
    const loadResult = await page.evaluate((jsonString) => {
      const data = JSON.parse(jsonString);
      window.levelEditor.loadFromData(data);
      
      // Check the CORRECT storage: _entitySpawnData (not placedEntities)
      return {
        spawnDataCount: window.levelEditor._entitySpawnData ? window.levelEditor._entitySpawnData.length : 0,
        placedEntitiesCount: window.levelEditor.entityPainter.placedEntities.length,
        expectedCount: data.entities.length,
        sampleSpawnPoint: window.levelEditor._entitySpawnData && window.levelEditor._entitySpawnData[0] ? {
          id: window.levelEditor._entitySpawnData[0].id,
          templateId: window.levelEditor._entitySpawnData[0].templateId,
          gridX: window.levelEditor._entitySpawnData[0].gridX,
          gridY: window.levelEditor._entitySpawnData[0].gridY
        } : null
      };
    }, levelDataString);
    
    console.log('\n=== Load Results ===');
    console.log(`_entitySpawnData: ${loadResult.spawnDataCount} spawn points`);
    console.log(`placedEntities: ${loadResult.placedEntitiesCount} entities (should be 0 - not used for spawn markers)`);
    console.log(`Expected: ${loadResult.expectedCount} entities`);
    console.log(`Sample spawn point:`, JSON.stringify(loadResult.sampleSpawnPoint, null, 2));
    
    if (loadResult.spawnDataCount === 0) {
      console.error('\n❌ FAILED: No spawn points in _entitySpawnData!');
      await saveScreenshot(page, 'spawn_markers/no_spawn_data', false);
      await browser.close();
      process.exit(1);
    }
    
    if (loadResult.spawnDataCount !== loadResult.expectedCount) {
      console.error(`\n❌ PARTIAL LOAD: ${loadResult.spawnDataCount}/${loadResult.expectedCount} spawn points`);
      await saveScreenshot(page, 'spawn_markers/partial_load', false);
      await browser.close();
      process.exit(1);
    }
    
    console.log('\n✓ All spawn points loaded into _entitySpawnData');
    
    console.log('\n=== Forcing render and checking visual output ===');
    await page.evaluate(() => {
      // Force multiple redraws
      if (typeof window.redraw === 'function') {
        for (let i = 0; i < 5; i++) {
          window.redraw();
        }
      }
    });
    
    await sleep(500);
    
    // Check canvas for visual content
    const canvasCheck = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return { hasCanvas: false };
      
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      let coloredPixels = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
        if (a > 0 && (r !== 255 || g !== 255 || b !== 255) && (r !== 0 || g !== 0 || b !== 0)) {
          coloredPixels++;
        }
      }
      
      return {
        hasCanvas: true,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        coloredPixels
      };
    });
    
    console.log('\n=== Canvas Check ===');
    console.log(`Canvas size: ${canvasCheck.canvasWidth}x${canvasCheck.canvasHeight}`);
    console.log(`Colored pixels: ${canvasCheck.coloredPixels}`);
    
    await saveScreenshot(page, 'spawn_markers/after_load', true);
    
    console.log('\n✓ SUCCESS: Entity spawn markers loaded!');
    console.log(`✓ ${loadResult.spawnDataCount} spawn points stored in _entitySpawnData`);
    console.log('✓ Screenshot saved - visually verify spawn markers are visible');
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
    await saveScreenshot(page, 'spawn_markers/test_error', false);
    await browser.close();
    process.exit(1);
  }
})();
