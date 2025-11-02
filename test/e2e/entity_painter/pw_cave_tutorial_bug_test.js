/**
 * E2E Test: Verify bug - entities with gridX/gridY don't load in actual game
 * Tests loading level data in PLAYING mode (actual game)
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
    
    // Start game
    console.log('Starting game...');
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error(`Game failed to start: ${JSON.stringify(gameStarted)}`);
    }
    console.log('✓ Game started successfully');
    
    await sleep(1000);
    
    // Read CaveTutorial.json file
    const levelPath = path.join(__dirname, '../../../levels/CaveTutorial.json');
    const levelDataString = fs.readFileSync(levelPath, 'utf8');
    const levelData = JSON.parse(levelDataString);
    
    console.log(`\n✓ Read CaveTutorial.json (${levelData.entities.length} entities expected)`);
    
    // Count existing ants before loading
    const antsBefore = await page.evaluate(() => {
      return window.ants ? window.ants.length : 0;
    });
    console.log(`Ants in game before load: ${antsBefore}`);
    
    // Test 1: Try loading entities directly with EntityPainter
    console.log('\n=== Test 1: Load with EntityPainter.importFromJSON() ===');
    const test1Result = await page.evaluate((jsonString) => {
      if (typeof EntityPainter === 'undefined') {
        return { success: false, error: 'EntityPainter not loaded' };
      }
      
      const data = JSON.parse(jsonString);
      const painter = new EntityPainter();
      
      // Import entities
      painter.importFromJSON({ entities: data.entities });
      
      // Store for next test
      window.__testPainter = painter;
      
      return {
        success: true,
        loadedCount: painter.placedEntities.length,
        expectedCount: data.entities.length,
        entities: painter.placedEntities.slice(0, 3).map(e => ({
          type: e.type,
          pos: { x: e.posX, y: e.posY },
          jobName: e.JobName
        }))
      };
    }, levelDataString);
    
    console.log(`EntityPainter test: ${test1Result.loadedCount}/${test1Result.expectedCount} entities`);
    console.log('Sample entities:', JSON.stringify(test1Result.entities, null, 2));
    
    if (test1Result.loadedCount === 0) {
      console.error('\n✗ BUG CONFIRMED: EntityPainter.importFromJSON() loaded 0 entities!');
      console.error('This means gridX/gridY format is NOT being read correctly.');
      await saveScreenshot(page, 'entity_painter/bug_no_entities_loaded', false);
      await browser.close();
      process.exit(1);
    }
    
    if (test1Result.loadedCount !== test1Result.expectedCount) {
      console.error(`\n✗ BUG: Only ${test1Result.loadedCount}/${test1Result.expectedCount} entities loaded`);
      await saveScreenshot(page, 'entity_painter/bug_partial_load', false);
      await browser.close();
      process.exit(1);
    }
    
    console.log('✓ EntityPainter loaded all entities correctly');
    
    // Test 2: Check coordinate conversion
    console.log('\n=== Test 2: Verify coordinate conversion ===');
    const test2Result = await page.evaluate(() => {
      const painter = window.__testPainter || new EntityPainter();
      const queen = painter.placedEntities.find(e => e.JobName === 'Queen');
      
      if (!queen) return { success: false, error: 'No queen found' };
      
      // Queen should be at gridX=89, gridY=19
      // World coords: 89*32=2848, 19*32=608 (before centering)
      // With +16 centering: 2864, 624
      const expectedX = (89 * 32) + 16;
      const expectedY = (19 * 32) + 16;
      
      return {
        success: true,
        queenPos: { x: queen.posX, y: queen.posY },
        expectedPos: { x: expectedX, y: expectedY },
        xCorrect: queen.posX === expectedX,
        yCorrect: queen.posY === expectedY
      };
    });
    
    console.log(`Queen position: ${JSON.stringify(test2Result.queenPos)}`);
    console.log(`Expected: ${JSON.stringify(test2Result.expectedPos)}`);
    console.log(`Conversion correct: ${test2Result.xCorrect && test2Result.yCorrect ? '✓' : '✗'}`);
    
    if (!test2Result.xCorrect || !test2Result.yCorrect) {
      console.error('\n✗ BUG: Grid to world coordinate conversion is incorrect!');
      await saveScreenshot(page, 'entity_painter/bug_wrong_coordinates', false);
      await browser.close();
      process.exit(1);
    }
    
    console.log('✓ Coordinate conversion working correctly');
    
    // Force render
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(500);
    await saveScreenshot(page, 'entity_painter/all_tests_pass', true);
    
    console.log('\n✓ SUCCESS: All tests passed!');
    console.log('✓ gridX/gridY format loads correctly');
    console.log('✓ Coordinate conversion works');
    console.log(`✓ All ${test1Result.loadedCount} entities loaded`);
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n✗ FAILED:', error.message);
    console.error(error.stack);
    await saveScreenshot(page, 'entity_painter/test_error', false);
    await browser.close();
    process.exit(1);
  }
})();
