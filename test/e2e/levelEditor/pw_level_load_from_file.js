/**
 * E2E Test: Load level file in Level Editor and verify entities appear on screen
 * Tests actual level loading workflow through LevelEditor.loadFromData()
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
    
    // Start Level Editor
    console.log('Starting Level Editor...');
    const editorStarted = await cameraHelper.ensureLevelEditorStarted(page);
    if (!editorStarted.started) {
      throw new Error(`Level Editor failed to start: ${JSON.stringify(editorStarted)}`);
    }
    console.log('✓ Level Editor started successfully');
    
    await sleep(1000);
    
    // Read CaveTutorial.json file
    const levelPath = path.join(__dirname, '../../../levels/CaveTutorial.json');
    const levelDataString = fs.readFileSync(levelPath, 'utf8');
    const levelData = JSON.parse(levelDataString);
    
    console.log(`\n✓ Read CaveTutorial.json (${levelData.entities.length} entities expected)`);
    
    // Test: Load level through LevelEditor.loadFromData() (real user flow)
    console.log('\nTest: Loading level through LevelEditor.loadFromData()...');
    const result = await page.evaluate((jsonString) => {
      const levelEditor = window.levelEditor;
      if (!levelEditor) return { success: false, error: 'Level Editor not found' };
      
      const data = JSON.parse(jsonString);
      
      // REAL USER FLOW: This is what LoadDialog calls
      levelEditor.loadFromData(data);
      
      // Wait for load to complete
      return new Promise((resolve) => {
        setTimeout(() => {
          // Check if entities loaded
          const entityPainter = levelEditor.entityPainter;
          if (!entityPainter) {
            return resolve({ success: false, error: 'EntityPainter not found' });
          }
          
          const entities = entityPainter.placedEntities || [];
          
          // Get entity breakdown by type
          const breakdown = {
            Ant: entities.filter(e => e.type === 'Ant').length,
            Building: entities.filter(e => e.type === 'Building').length,
            Resource: entities.filter(e => e.type === 'Resource').length
          };
          
          // Find sample entities
          const queen = entities.find(e => e.JobName === 'Queen');
          const worker = entities.find(e => e.JobName === 'Worker');
          const resource = entities.find(e => e.type === 'Resource');
          
          resolve({
            success: true,
            expectedCount: data.entities.length,
            loadedCount: entities.length,
            breakdown: breakdown,
            samples: {
              hasQueen: !!queen,
              queenPos: queen ? { x: queen.posX, y: queen.posY } : null,
              hasWorker: !!worker,
              workerPos: worker ? { x: worker.posX, y: worker.posY } : null,
              hasResource: !!resource,
              resourcePos: resource ? { x: resource.posX, y: resource.posY } : null
            }
          });
        }, 1000);
      });
    }, levelDataString);
    
    console.log('\n=== Load Results ===');
    console.log(`Expected entities: ${result.expectedCount}`);
    console.log(`Loaded entities: ${result.loadedCount}`);
    console.log(`Breakdown: Ants=${result.breakdown.Ant}, Buildings=${result.breakdown.Building}, Resources=${result.breakdown.Resource}`);
    console.log(`\nKey Entities:`);
    console.log(`  Queen: ${result.samples.hasQueen ? '✓' : '✗'} at ${JSON.stringify(result.samples.queenPos)}`);
    console.log(`  Worker: ${result.samples.hasWorker ? '✓' : '✗'} at ${JSON.stringify(result.samples.workerPos)}`);
    console.log(`  Resource: ${result.samples.hasResource ? '✓' : '✗'} at ${JSON.stringify(result.samples.resourcePos)}`);
    
    if (!result.success) {
      console.error(`\n✗ FAILED: ${result.error}`);
      await saveScreenshot(page, 'levelEditor/level_load_failed', false);
      await browser.close();
      process.exit(1);
    }
    
    // CRITICAL: Verify entities actually loaded
    if (result.loadedCount === 0) {
      console.error(`\n✗ FAILED: No entities loaded! loadFromData() did not load entities.`);
      console.error('This confirms the bug: entities with gridX/gridY format are not loading.');
      await saveScreenshot(page, 'levelEditor/no_entities_loaded', false);
      await browser.close();
      process.exit(1);
    }
    
    if (result.loadedCount !== result.expectedCount) {
      console.error(`\n✗ FAILED: Entity count mismatch: ${result.loadedCount}/${result.expectedCount}`);
      await saveScreenshot(page, 'levelEditor/entity_count_mismatch', false);
      await browser.close();
      process.exit(1);
    }
    
    // Force render to show loaded level
    await page.evaluate(() => {
      window.gameState = 'LEVEL_EDITOR';
      
      if (window.draggablePanelManager) {
        window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
      }
      
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(500);
    await saveScreenshot(page, 'levelEditor/level_loaded_via_loadFromData', true);
    
    console.log('\n✓ SUCCESS: Level loaded through LevelEditor.loadFromData()!');
    console.log(`✓ All ${result.loadedCount} entities loaded correctly`);
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n✗ FAILED:', error.message);
    console.error(error.stack);
    await saveScreenshot(page, 'levelEditor/level_load_error', false);
    await browser.close();
    process.exit(1);
  }
})();
