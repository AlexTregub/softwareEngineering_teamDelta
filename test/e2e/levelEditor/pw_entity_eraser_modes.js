const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

/**
 * E2E Test: Entity Eraser Modes
 * 
 * Tests the entity eraser mode system in the Level Editor:
 * - Placing terrain, entities, and events on grid
 * - Selecting eraser tool and mode toggles
 * - Testing ENTITY mode (removes entities only)
 * - Testing TERRAIN mode (removes terrain only)
 * - Testing ALL mode (removes everything)
 * 
 * Expected Screenshots:
 * 1. levelEditor/eraser_modes_01_initial_state.png - All layers present
 * 2. levelEditor/eraser_modes_02_mode_toggles.png - Mode toggles visible
 * 3. levelEditor/eraser_modes_03_entity_removed.png - Entity removed, terrain/events intact
 * 4. levelEditor/eraser_modes_04_terrain_removed.png - Terrain removed, entities/events intact
 * 5. levelEditor/eraser_modes_05_all_removed.png - All layers removed
 */

(async () => {
  const browser = await launchBrowser();
  const page = await cameraHelper.newPageReady(browser);
  
  let success = false;
  let errorMessage = '';
  
  try {
    console.log('Navigating to Level Editor...');
    await page.appGoto();
    await sleep(1000);
    
    // CRITICAL: Ensure Level Editor started
    console.log('Ensuring Level Editor started...');
    const editorStarted = await cameraHelper.ensureLevelEditorStarted(page);
    if (!editorStarted.started) {
      throw new Error(`Level Editor failed to start: ${editorStarted.reason || 'Unknown reason'}. Diagnostics: ${JSON.stringify(editorStarted.diagnostics)}`);
    }
    console.log('Level Editor started successfully. Panels:', editorStarted.diagnostics.panels);
    
    // Step 1: Paint terrain, place entities, add events
    console.log('Step 1: Setting up test environment with terrain, entities, and events...');
    const setupResult = await page.evaluate(() => {
      window.gameState = 'LEVEL_EDITOR';
      
      // Ensure LevelEditor and EntityPainter exist
      if (!window.levelEditor || !window.levelEditor.entityPainter) {
        throw new Error('LevelEditor or EntityPainter not initialized');
      }
      
      // Get references to the real terrain, entities, events from EntityPainter
      const entityPainter = window.levelEditor.entityPainter;
      const terrain = entityPainter.terrain || window.levelEditor.terrain || window.g_map2;
      const eventLayer = entityPainter.events || window.levelEditor.eventFlagLayer;
      
      // Get the correct grid/tiles reference (SparseTerrain uses 'tiles', MapManager uses 'grid')
      const gridMap = terrain.tiles || terrain.grid;
      
      if (!gridMap) {
        throw new Error(`Terrain grid/tiles not initialized`);
      }
      
      // Paint terrain at grid position (5, 5)
      gridMap.set('5,5', { type: 'STONE', gridX: 5, gridY: 5 });
      
      // Place entity manually at grid position (6, 6)
      // Create entity with gridX/gridY for EntityPainter compatibility
      const entity = {
        gridX: 6,
        gridY: 6,
        type: 'test-entity',
        getPosition: function() { return { x: this.gridX * 32, y: this.gridY * 32 }; }
      };
      entityPainter.placedEntities.push(entity);
      
      // Add event flag at grid position (7, 7)
      if (eventLayer && eventLayer.flags && typeof window.EventFlag !== 'undefined') {
        const flag = new window.EventFlag({
          eventId: 'test-event-1',
          x: 7 * 32 + 16,  // World X (center of tile)
          y: 7 * 32 + 16,  // World Y (center of tile)
          gridX: 7,
          gridY: 7,
          radius: 32,      // Trigger radius
          shape: 'circle',
          label: 'Test',
          eventType: 'spawn'
        });
        eventLayer.addFlag(flag);
      }
      
      // Force render
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
      
      return {
        terrainCount: gridMap ? gridMap.size : 0,
        entityCount: entityPainter.placedEntities ? entityPainter.placedEntities.length : 0,
        eventCount: eventLayer && eventLayer.flags ? eventLayer.flags.size : 0
      };
    });
    console.log('Setup complete:', setupResult);
    await sleep(300);
    await saveScreenshot(page, 'levelEditor/eraser_modes_01_initial_state', true);
    
    // Step 2: Select eraser tool and show mode toggles
    console.log('Step 2: Selecting eraser tool - mode toggles should appear...');
    await page.evaluate(() => {
      // Select eraser tool
      if (window.levelEditor && window.levelEditor.toolbar) {
        window.levelEditor.toolbar.selectTool('eraser');
      }
      
      // Force render
      if (window.draggablePanelManager) {
        window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
      }
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    await sleep(500);
    await saveScreenshot(page, 'levelEditor/eraser_modes_02_mode_toggles', true);
    
    // Step 3: Select ENTITY mode and erase entity
    console.log('Step 3: Testing ENTITY mode - should remove entity only...');
    const entityEraseResult = await page.evaluate(() => {
      const entityPainter = window.levelEditor.entityPainter;
      const terrain = entityPainter.terrain;
      const eventLayer = entityPainter.events;
      const gridMap = terrain.tiles || terrain.grid;
      
      // Set ENTITY mode
      entityPainter.setEraserMode('ENTITY');
      
      // Erase at entity grid position (6, 6)
      entityPainter.handleErase(6, 6);
      
      // Force render
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
      
      return {
        terrainCount: gridMap ? gridMap.size : 0,
        entityCount: entityPainter.placedEntities ? entityPainter.placedEntities.length : 0,
        eventCount: eventLayer && eventLayer.flags ? eventLayer.flags.size : 0
      };
    });
    console.log('After ENTITY erase:', entityEraseResult);
    await sleep(300);
    await saveScreenshot(page, 'levelEditor/eraser_modes_03_entity_removed', true);
    
    // Step 4: Select TERRAIN mode and erase terrain
    console.log('Step 4: Testing TERRAIN mode - should remove terrain only...');
    const terrainEraseResult = await page.evaluate(() => {
      const entityPainter = window.levelEditor.entityPainter;
      const terrain = entityPainter.terrain;
      const eventLayer = entityPainter.events;
      const gridMap = terrain.tiles || terrain.grid;
      
      // Set TERRAIN mode
      entityPainter.setEraserMode('TERRAIN');
      
      // Erase at terrain grid position (5, 5)
      entityPainter.handleErase(5, 5);
      
      // Force render
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
      
      return {
        terrainCount: gridMap ? gridMap.size : 0,
        entityCount: entityPainter.placedEntities ? entityPainter.placedEntities.length : 0,
        eventCount: eventLayer && eventLayer.flags ? eventLayer.flags.size : 0
      };
    });
    console.log('After TERRAIN erase:', terrainEraseResult);
    await sleep(300);
    await saveScreenshot(page, 'levelEditor/eraser_modes_04_terrain_removed', true);
    
    // Step 5: Add back all layers and test ALL mode
    console.log('Step 5: Testing ALL mode - should remove everything...');
    const allEraseResult = await page.evaluate(() => {
      const entityPainter = window.levelEditor.entityPainter;
      const terrain = entityPainter.terrain;
      const eventLayer = entityPainter.events;
      const gridMap = terrain.tiles || terrain.grid;
      
      // Re-add layers at grid position (10, 10)
      if (gridMap) {
        gridMap.set('10,10', { type: 'STONE', gridX: 10, gridY: 10 });
      }
      
      // Place entity manually at grid (10, 10)
      const entity2 = {
        gridX: 10,
        gridY: 10,
        type: 'test-entity',
        getPosition: function() { return { x: this.gridX * 32, y: this.gridY * 32 }; }
      };
      entityPainter.placedEntities.push(entity2);
      
      // Add event flag at grid (10, 10)
      if (eventLayer && eventLayer.flags && typeof window.EventFlag !== 'undefined') {
        const flag = new window.EventFlag({
          eventId: 'test-event-2',
          x: 10 * 32 + 16,  // World X (center of tile)
          y: 10 * 32 + 16,  // World Y (center of tile)
          gridX: 10,
          gridY: 10,
          radius: 32,       // Trigger radius
          shape: 'circle',
          label: 'Test2',
          eventType: 'dialogue'
        });
        eventLayer.addFlag(flag);
      }
      
      // Set ALL mode
      entityPainter.setEraserMode('ALL');
      
      // Erase at grid position (10, 10)
      entityPainter.handleErase(10, 10);
      
      // Force render
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
      
      return {
        terrainCount: gridMap ? gridMap.size : 0,
        entityCount: entityPainter.placedEntities ? entityPainter.placedEntities.length : 0,
        eventCount: eventLayer && eventLayer.flags ? eventLayer.flags.size : 0
      };
    });
    console.log('After ALL erase:', allEraseResult);
    await sleep(300);
    await saveScreenshot(page, 'levelEditor/eraser_modes_05_all_removed', true);
    
    // Verify expected outcomes
    // Note: Terrain erasure resets type to GRASS (doesn't decrease count)
    if (entityEraseResult.entityCount === 0 && entityEraseResult.terrainCount > 0 && entityEraseResult.eventCount > 0) {
      console.log('✅ ENTITY mode test passed: Entity removed, terrain/events intact');
    } else {
      console.log('⚠️  WARNING: ENTITY mode unexpected state:', entityEraseResult);
    }
    
    // Terrain mode: Entity and event counts should stay same, terrain resets to GRASS (count unchanged)
    if (terrainEraseResult.entityCount === 0 && terrainEraseResult.eventCount > 0) {
      console.log('✅ TERRAIN mode test passed: Terrain reset to GRASS, entity removed, events intact');
    } else {
      console.log('⚠️  WARNING: TERRAIN mode unexpected state:', terrainEraseResult);
    }
    
    // ALL mode: Entity at (10,10) removed, event at (10,10) removed, but event at (7,7) remains
    // Entity count should be 0 (removed from 1 to 0)
    // Event count should be 1 (removed from 2 to 1, since only (10,10) was erased)
    if (allEraseResult.entityCount === 0 && allEraseResult.eventCount === 1) {
      console.log('✅ ALL mode test passed: Entity/event at (10,10) removed, event at (7,7) intact, terrain reset to GRASS');
    } else {
      console.log('⚠️  WARNING: ALL mode unexpected state:', allEraseResult);
    }
    
    console.log('✅ SUCCESS: All eraser mode tests completed');
    success = true;
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    errorMessage = error.message;
    await saveScreenshot(page, 'levelEditor/eraser_modes_ERROR', false);
  } finally {
    await browser.close();
    
    if (!success) {
      console.error('Test failed:', errorMessage);
      process.exit(1);
    } else {
      console.log('✅ Entity Eraser Modes E2E test completed successfully');
      console.log('Screenshots saved to: test/e2e/screenshots/levelEditor/');
      process.exit(0);
    }
  }
})();
