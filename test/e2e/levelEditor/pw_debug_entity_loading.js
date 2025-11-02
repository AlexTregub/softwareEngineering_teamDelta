/**
 * E2E Test: Debug why entities aren't loading in actual Level Editor
 * Adds extensive logging to trace the loading process
 * HEADLESS: Runs in headless browser mode
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.error(`[BROWSER ERROR] ${text}`);
    } else if (text.includes('Entity') || text.includes('grid') || text.includes('load')) {
      console.log(`[BROWSER] ${text}`);
    }
  });
  
  try {
    console.log('Loading game...');
    await page.goto('http://localhost:8000?test=1');
    
    // Start game (bypass menu)
    console.log('Starting game...');
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error(`Game failed to start: ${JSON.stringify(gameStarted)}`);
    }
    console.log('✓ Game started');
    
    // Check if Level Editor is available (user should start it from menu)
    console.log('Checking for Level Editor...');
    const editorReady = await page.evaluate(() => {
      // Check if Level Editor instance exists
      if (!window.levelEditor) {
        return { 
          ready: false, 
          reason: 'No levelEditor instance found. User must start Level Editor from menu.' 
        };
      }
      
      // Check entityPainter
      const hasEntityPainter = !!(window.levelEditor && window.levelEditor.entityPainter);
      
      return {
        ready: true,
        hasEntityPainter,
        entityPainterType: window.levelEditor.entityPainter ? 
          typeof window.levelEditor.entityPainter : 'undefined'
      };
    });
    
    console.log('Level Editor status:', JSON.stringify(editorReady, null, 2));
    
    if (!editorReady.ready) {
      console.error(`\n❌ ${editorReady.reason}`);
      console.error('This test requires the user to manually start the Level Editor from the main menu.');
      await browser.close();
      process.exit(1);
    }
    
    await sleep(1000);
    
    // Check if Level Editor has entityPainter
    const hasEntityPainter = await page.evaluate(() => {
      return {
        hasLevelEditor: !!window.levelEditor,
        hasEntityPainter: !!(window.levelEditor && window.levelEditor.entityPainter),
        entityPainterType: window.levelEditor && window.levelEditor.entityPainter ? 
          typeof window.levelEditor.entityPainter : 'N/A'
      };
    });
    
    console.log('Level Editor components:', JSON.stringify(hasEntityPainter, null, 2));
    
    if (!hasEntityPainter.hasEntityPainter) {
      console.error('✗ Level Editor has no entityPainter!');
      await saveScreenshot(page, 'levelEditor/no_entity_painter', false);
      await browser.close();
      process.exit(1);
    }
    
    // Read CaveTutorial.json file
    const levelPath = path.join(__dirname, '../../../levels/CaveTutorial.json');
    const levelDataString = fs.readFileSync(levelPath, 'utf8');
    const levelData = JSON.parse(levelDataString);
    
    console.log(`\n✓ Read CaveTutorial.json (${levelData.entities.length} entities expected)`);
    console.log('First entity sample:', JSON.stringify(levelData.entities[0], null, 2));
    
    // Test: Call loadFromData like the UI does
    console.log('\n=== Calling levelEditor.loadFromData() ===');
    const result = await page.evaluate((jsonString) => {
      const levelEditor = window.levelEditor;
      const data = JSON.parse(jsonString);
      
      console.log('[TEST] Calling loadFromData with', data.entities.length, 'entities');
      console.log('[TEST] First entity:', JSON.stringify(data.entities[0]));
      
      // Check before
      const beforeCount = levelEditor.entityPainter.placedEntities.length;
      console.log('[TEST] Entities before load:', beforeCount);
      
      // Call loadFromData (real user flow)
      levelEditor.loadFromData(data);
      
      // Check after
      const afterCount = levelEditor.entityPainter.placedEntities.length;
      console.log('[TEST] Entities after load:', afterCount);
      
      // Get details
      const entities = levelEditor.entityPainter.placedEntities;
      const breakdown = {
        Ant: entities.filter(e => e.type === 'Ant').length,
        Building: entities.filter(e => e.type === 'Building').length,
        Resource: entities.filter(e => e.type === 'Resource').length
      };
      
      return {
        success: true,
        beforeCount,
        afterCount,
        loadedCount: afterCount,
        expectedCount: data.entities.length,
        breakdown,
        sampleEntity: entities[0] ? {
          type: entities[0].type,
          pos: { x: entities[0].posX, y: entities[0].posY },
          jobName: entities[0].JobName
        } : null
      };
    }, levelDataString);
    
    console.log('\n=== Load Results ===');
    console.log(`Before load: ${result.beforeCount} entities`);
    console.log(`After load: ${result.afterCount} entities`);
    console.log(`Expected: ${result.expectedCount} entities`);
    console.log(`Breakdown:`, JSON.stringify(result.breakdown));
    console.log(`Sample entity:`, JSON.stringify(result.sampleEntity, null, 2));
    
    if (result.loadedCount === 0) {
      console.error('\n✗ BUG CONFIRMED: loadFromData() resulted in 0 entities!');
      console.error('The entities are NOT loading through the actual Level Editor workflow.');
      await saveScreenshot(page, 'levelEditor/entities_not_loading', false);
      await browser.close();
      process.exit(1);
    }
    
    if (result.loadedCount !== result.expectedCount) {
      console.error(`\n✗ PARTIAL LOAD: ${result.loadedCount}/${result.expectedCount} entities`);
      await saveScreenshot(page, 'levelEditor/partial_entity_load', false);
      await browser.close();
      process.exit(1);
    }
    
    // Force render
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
    await saveScreenshot(page, 'levelEditor/entities_loaded_success', true);
    
    console.log('\n✓ SUCCESS: All entities loaded through Level Editor!');
    console.log(`✓ ${result.loadedCount} entities present in entityPainter`);
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n✗ FAILED:', error.message);
    console.error(error.stack);
    await saveScreenshot(page, 'levelEditor/debug_error', false);
    await browser.close();
    process.exit(1);
  }
})();
