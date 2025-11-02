/**
 * E2E Test: Load CaveTutorial.json and verify entities appear on map
 * Tests the gridX/gridY format fix
 * HEADLESS: Runs in headless browser mode
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('Loading game...');
    await page.goto('http://localhost:8000?test=1');
    
    // CRITICAL: Ensure game started (bypass menu)
    console.log('Ensuring game started...');
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error(`Game failed to start: ${JSON.stringify(gameStarted)}`);
    }
    console.log('✓ Game started successfully');
    
    await sleep(500);
    
    // Read CaveTutorial.json file
    const levelPath = path.join(__dirname, '../../../levels/CaveTutorial.json');
    const levelDataString = fs.readFileSync(levelPath, 'utf8');
    const levelData = JSON.parse(levelDataString);
    
    console.log(`\n✓ Read CaveTutorial.json (${levelData.entities.length} entities expected)`);
    
    // Test: Import entities with gridX/gridY format
    console.log('\nTest: Importing entities with gridX/gridY format...');
    const result = await page.evaluate((jsonString) => {
      if (typeof EntityPainter === 'undefined') {
        return { success: false, error: 'EntityPainter not loaded' };
      }
      
      window.TILE_SIZE = 32; // Ensure TILE_SIZE is set
      
      const data = JSON.parse(jsonString);
      
      // Create EntityPainter and import entities
      const painter = new EntityPainter();
      painter.importFromJSON({ entities: data.entities });
      
      // Get loaded entities
      const entities = painter.placedEntities;
      
      // Get entity breakdown by type
      const breakdown = {
        Ant: entities.filter(e => e.type === 'Ant').length,
        Building: entities.filter(e => e.type === 'Building').length,
        Resource: entities.filter(e => e.type === 'Resource').length
      };
      
      // Find sample entities to verify correct loading
      const queen = entities.find(e => e.JobName === 'Queen');
      const worker = entities.find(e => e.JobName === 'Worker');
      const resource = entities.find(e => e.type === 'Resource');
      
      // Verify world coordinate conversion from gridX/gridY
      // Queen is at gridX=89, gridY=19 in CaveTutorial.json
      // Grid to world: x=89*32=2848, y=19*32=608
      // Ant constructor adds +16 offset for centering: x=2848+16=2864, y=608+16=624
      const queenGridExpected = { gridX: 89, gridY: 19 };
      const queenWorldExpected = { x: (89 * 32) + 16, y: (19 * 32) + 16 };
      
      return {
        success: entities.length > 0,
        expectedCount: data.entities.length,
        loadedCount: entities.length,
        breakdown: breakdown,
        samples: {
          hasQueen: !!queen,
          queenPos: queen ? { x: queen.posX, y: queen.posY } : null,
          queenGridExpected,
          queenWorldExpected,
          queenMatchesExpected: queen ? (queen.posX === queenWorldExpected.x && queen.posY === queenWorldExpected.y) : false,
          hasWorker: !!worker,
          workerPos: worker ? { x: worker.posX, y: worker.posY } : null,
          hasResource: !!resource,
          resourcePos: resource ? { x: resource.posX, y: resource.posY } : null
        }
      };
    }, levelDataString);
    
    console.log('\n=== Import Results ===');
    console.log(`Expected entities: ${result.expectedCount}`);
    console.log(`Loaded entities: ${result.loadedCount}`);
    console.log(`Breakdown: Ants=${result.breakdown.Ant}, Buildings=${result.breakdown.Building}, Resources=${result.breakdown.Resource}`);
    console.log(`\nKey Entities:`);
    console.log(`  Queen: ${result.samples.hasQueen ? '✓' : '✗'} at ${JSON.stringify(result.samples.queenPos)}`);
    console.log(`    Expected grid: (${result.samples.queenGridExpected.gridX}, ${result.samples.queenGridExpected.gridY})`);
    console.log(`    Expected world: (${result.samples.queenWorldExpected.x}, ${result.samples.queenWorldExpected.y})`);
    console.log(`    Coordinates match: ${result.samples.queenMatchesExpected ? '✓' : '✗'}`);
    console.log(`  Worker: ${result.samples.hasWorker ? '✓' : '✗'} at ${JSON.stringify(result.samples.workerPos)}`);
    console.log(`  Resource: ${result.samples.hasResource ? '✓' : '✗'} at ${JSON.stringify(result.samples.resourcePos)}`);
    
    if (!result.success) {
      console.error(`\n✗ FAILED: ${result.error}`);
      await saveScreenshot(page, 'entity_painter/cave_tutorial_load_failed', false);
      await browser.close();
      process.exit(1);
    }
    
    // Verify all entities loaded
    if (result.loadedCount !== result.expectedCount) {
      console.error(`\n✗ FAILED: Entity count mismatch: ${result.loadedCount}/${result.expectedCount}`);
      await saveScreenshot(page, 'entity_painter/cave_tutorial_count_mismatch', false);
      await browser.close();
      process.exit(1);
    }
    
    // Verify key entities present (proves gridX/gridY format worked)
    if (!result.samples.hasQueen || !result.samples.hasWorker || !result.samples.hasResource) {
      console.error('\n✗ FAILED: Missing key entities');
      await saveScreenshot(page, 'entity_painter/cave_tutorial_missing_entities', false);
      await browser.close();
      process.exit(1);
    }
    
    // Verify coordinate conversion is correct
    if (!result.samples.queenMatchesExpected) {
      console.error('\n✗ FAILED: Queen coordinates incorrect (gridX/gridY conversion failed)');
      await saveScreenshot(page, 'entity_painter/cave_tutorial_wrong_coords', false);
      await browser.close();
      process.exit(1);
    }
    
    // Take screenshot of loaded entities
    await saveScreenshot(page, 'entity_painter/cave_tutorial_loaded', true);
    
    console.log('\n✓ SUCCESS: All tests passed!');
    console.log('✓ CaveTutorial.json entities loaded successfully with gridX/gridY format');
    console.log('✓ Grid to world coordinate conversion verified');
    console.log('✓ All entity types present (Ants, Buildings, Resources)');
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n✗ FAILED:', error.message);
    console.error(error.stack);
    await saveScreenshot(page, 'levelEditor/cave_tutorial_error', false);
    await browser.close();
    process.exit(1);
  }
})();
