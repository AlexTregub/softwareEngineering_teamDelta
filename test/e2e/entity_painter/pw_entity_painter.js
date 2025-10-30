/**
 * Entity Painter E2E Tests (Puppeteer)
 * Tests Entity Painter in real browser with screenshots
 * CRITICAL: Must call ensureGameStarted() to bypass menu
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

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
      throw new Error(`Game failed to start: ${gameStarted.error}`);
    }
    console.log('Game started successfully');
    
    await sleep(500);
    
    // Test 1: EntityPalette initialization
    console.log('\nTest 1: EntityPalette initialization');
    const paletteTest = await page.evaluate(() => {
      if (typeof EntityPalette === 'undefined') {
        return { success: false, error: 'EntityPalette not loaded' };
      }
      
      const palette = new EntityPalette();
      
      return {
        success: true,
        currentCategory: palette.currentCategory,
        hasTemplates: palette.getTemplates('entities').length > 0,
        entitiesCount: palette.getTemplates('entities').length,
        buildingsCount: palette.getTemplates('buildings').length,
        resourcesCount: palette.getTemplates('resources').length
      };
    });
    
    await saveScreenshot(page, 'entity_painter/palette_init', paletteTest.success);
    console.log('EntityPalette test:', paletteTest);
    
    if (!paletteTest.success) {
      throw new Error('EntityPalette initialization failed');
    }
    
    // Test 2: CategoryRadioButtons
    console.log('\nTest 2: CategoryRadioButtons');
    const radioTest = await page.evaluate(() => {
      if (typeof CategoryRadioButtons === 'undefined') {
        return { success: false, error: 'CategoryRadioButtons not loaded' };
      }
      
      const buttons = new CategoryRadioButtons();
      
      return {
        success: true,
        categoryCount: buttons.categories.length,
        initialSelection: buttons.getSelected(),
        hasIcons: buttons.categories.every(cat => cat.icon && cat.icon.length > 0)
      };
    });
    
    await saveScreenshot(page, 'entity_painter/radio_buttons', radioTest.success);
    console.log('CategoryRadioButtons test:', radioTest);
    
    if (!radioTest.success) {
      throw new Error('CategoryRadioButtons initialization failed');
    }
    
    // Test 3: EntityPropertyEditor
    console.log('\nTest 3: EntityPropertyEditor');
    const editorTest = await page.evaluate(() => {
      if (typeof EntityPropertyEditor === 'undefined') {
        return { success: false, error: 'EntityPropertyEditor not loaded' };
      }
      
      const editor = new EntityPropertyEditor();
      const mockEntity = {
        type: 'Ant',
        JobName: 'Worker',
        faction: 'player',
        health: 100
      };
      
      editor.open(mockEntity);
      const wasVisible = editor.isVisible();
      
      editor.setProperty('faction', 'enemy');
      const hasPending = editor.hasPendingChanges();
      
      editor.save();
      const wasClosedAfterSave = !editor.isVisible();
      
      return {
        success: true,
        wasVisible,
        hasPending,
        wasClosedAfterSave,
        updatedFaction: mockEntity.faction
      };
    });
    
    await saveScreenshot(page, 'entity_painter/property_editor', editorTest.success);
    console.log('EntityPropertyEditor test:', editorTest);
    
    if (!editorTest.success) {
      throw new Error('EntityPropertyEditor test failed');
    }
    
    // Test 4: EntityPainter placement (grid coordinates)
    console.log('\nTest 4: EntityPainter placement with grid coordinates');
    const placementTest = await page.evaluate(() => {
      if (typeof EntityPainter === 'undefined') {
        return { success: false, error: 'EntityPainter not loaded' };
      }
      
      window.TILE_SIZE = 32; // Ensure TILE_SIZE is set
      
      const painter = new EntityPainter();
      
      // Place ant at grid position (10, 15)
      painter.palette.selectTemplate('ant_worker');
      const ant = painter.placeEntity(10, 15);
      
      if (!ant) {
        return { success: false, error: 'Failed to place ant' };
      }
      
      // Entity adds +0.5 tile offset for tile-centered positioning
      const expectedWorldX = (10 * 32) + 16;
      const expectedWorldY = (15 * 32) + 16;
      
      return {
        success: ant.posX === expectedWorldX && ant.posY === expectedWorldY,
        gridX: 10,
        gridY: 15,
        worldX: ant.posX,
        worldY: ant.posY,
        expectedWorldX,
        expectedWorldY,
        antType: ant.type,
        jobName: ant.JobName
      };
    });
    
    await saveScreenshot(page, 'entity_painter/placement', placementTest.success);
    console.log('Placement test:', placementTest);
    
    if (!placementTest.success) {
      throw new Error('EntityPainter placement test failed');
    }
    
    // Test 5: Multiple entity types
    console.log('\nTest 5: Placing multiple entity types');
    const multiTypeTest = await page.evaluate(() => {
      const painter = new EntityPainter();
      
      // Place ant
      painter.palette.setCategory('entities');
      painter.palette.selectTemplate('ant_soldier');
      const ant = painter.placeEntity(5, 5);
      
      // Place building
      painter.palette.setCategory('buildings');
      painter.palette.selectTemplate('building_hill');
      const building = painter.placeEntity(10, 10);
      
      // Place resource
      painter.palette.setCategory('resources');
      painter.palette.selectTemplate('resource_leaf');
      const resource = painter.placeEntity(15, 15);
      
      return {
        success: painter.placedEntities.length === 3,
        entityCount: painter.placedEntities.length,
        antExists: ant !== null,
        buildingExists: building !== null,
        resourceExists: resource !== null,
        antType: ant ? ant.type : null,
        buildingType: building ? building.type : null,
        resourceType: resource ? resource.type : null
      };
    });
    
    await saveScreenshot(page, 'entity_painter/multi_type', multiTypeTest.success);
    console.log('Multiple types test:', multiTypeTest);
    
    if (!multiTypeTest.success) {
      throw new Error('Multiple entity types test failed');
    }
    
    // Test 6: JSON Export with grid coordinates
    console.log('\nTest 6: JSON export with grid coordinates');
    const exportTest = await page.evaluate(() => {
      const painter = new EntityPainter();
      
      // Place entity at known grid position
      painter.palette.selectTemplate('ant_scout');
      const gridX = 20;
      const gridY = 30;
      painter.placeEntity(gridX, gridY);
      
      // Export to JSON
      const json = painter.exportToJSON();
      
      if (!json || !json.entities || json.entities.length === 0) {
        return { success: false, error: 'Export failed' };
      }
      
      const entityData = json.entities[0];
      
      return {
        success: entityData.gridPosition.x === gridX && entityData.gridPosition.y === gridY,
        exportedGridX: entityData.gridPosition.x,
        exportedGridY: entityData.gridPosition.y,
        expectedGridX: gridX,
        expectedGridY: gridY,
        hasProperties: Object.keys(entityData.properties).length > 0,
        entityType: entityData.type
      };
    });
    
    await saveScreenshot(page, 'entity_painter/export_json', exportTest.success);
    console.log('JSON export test:', exportTest);
    
    if (!exportTest.success) {
      throw new Error('JSON export test failed');
    }
    
    // Test 7: JSON Import with grid coordinate conversion
    console.log('\nTest 7: JSON import with grid coordinate conversion');
    const importTest = await page.evaluate(() => {
      const painter1 = new EntityPainter();
      
      // Create and export level - use worker instead of queen
      painter1.palette.selectTemplate('ant_worker');
      painter1.placeEntity(25, 40);
      
      painter1.palette.setCategory('buildings');
      painter1.palette.selectTemplate('building_hive');
      painter1.placeEntity(50, 60);
      
      const json = painter1.exportToJSON();
      
      // Import into new painter
      const painter2 = new EntityPainter();
      painter2.importFromJSON(json);
      
      if (painter2.placedEntities.length !== 2) {
        return { success: false, error: 'Import count mismatch', actualCount: painter2.placedEntities.length };
      }
      
      const ant = painter2.placedEntities.find(e => e.type === 'Ant' || e.type === 'Queen');
      const building = painter2.placedEntities.find(e => e.type === 'Building');
      
      // Account for Entity's +0.5 tile centering offset
      const expectedAntWorldX = (25 * 32) + 16;
      const expectedAntWorldY = (40 * 32) + 16;
      const expectedBuildingWorldX = (50 * 32) + 16;
      const expectedBuildingWorldY = (60 * 32) + 16;
      
      return {
        success: ant && building &&
                 ant.posX === expectedAntWorldX && ant.posY === expectedAntWorldY &&
                 building.posX === expectedBuildingWorldX && building.posY === expectedBuildingWorldY,
        importedCount: painter2.placedEntities.length,
        antWorldX: ant ? ant.posX : null,
        antWorldY: ant ? ant.posY : null,
        buildingWorldX: building ? building.posX : null,
        buildingWorldY: building ? building.posY : null,
        expectedAntWorldX,
        expectedAntWorldY,
        expectedBuildingWorldX,
        expectedBuildingWorldY
      };
    });
    
    await saveScreenshot(page, 'entity_painter/import_json', importTest.success);
    console.log('JSON import test:', importTest);
    
    if (!importTest.success) {
      throw new Error('JSON import test failed');
    }
    
    // Test 8: Property preservation through export/import
    console.log('\nTest 8: Property preservation through export/import');
    const preservationTest = await page.evaluate(() => {
      const painter1 = new EntityPainter();
      const editor = new EntityPropertyEditor();
      
      // Place and customize ant
      painter1.palette.selectTemplate('ant_builder');
      const ant = painter1.placeEntity(12, 18);
      
      editor.open(ant);
      editor.setProperty('faction', 'neutral');
      editor.setProperty('health', 200);
      editor.save();
      
      // Export
      const json = painter1.exportToJSON();
      
      // Import
      const painter2 = new EntityPainter();
      painter2.importFromJSON(json);
      
      const importedAnt = painter2.placedEntities[0];
      
      return {
        success: importedAnt.faction === 'neutral' && importedAnt.health === 200,
        importedFaction: importedAnt.faction,
        importedHealth: importedAnt.health,
        expectedFaction: 'neutral',
        expectedHealth: 200,
        positionCorrect: importedAnt.posX === 12 * 32 && importedAnt.posY === 18 * 32
      };
    });
    
    await saveScreenshot(page, 'entity_painter/property_preservation', preservationTest.success);
    console.log('Property preservation test:', preservationTest);
    
    if (!preservationTest.success) {
      throw new Error('Property preservation test failed');
    }
    
    // Test 9: Category switching workflow
    console.log('\nTest 9: Category switching workflow');
    const categoryWorkflowTest = await page.evaluate(() => {
      const painter = new EntityPainter();
      const radioButtons = new CategoryRadioButtons((categoryId) => {
        painter.palette.setCategory(categoryId);
      });
      
      // Start with entities
      const initialCategory = painter.palette.currentCategory;
      
      // Switch to buildings
      radioButtons.select('buildings');
      const afterBuildingsSwitch = painter.palette.currentCategory;
      
      // Switch to resources
      radioButtons.select('resources');
      const afterResourcesSwitch = painter.palette.currentCategory;
      
      // Place resource
      painter.palette.selectTemplate('resource_stick');
      const resource = painter.placeEntity(8, 12);
      
      return {
        success: initialCategory === 'entities' && 
                 afterBuildingsSwitch === 'buildings' &&
                 afterResourcesSwitch === 'resources' &&
                 resource !== null,
        initialCategory,
        afterBuildingsSwitch,
        afterResourcesSwitch,
        resourcePlaced: resource !== null,
        resourceType: resource ? resource.type : null
      };
    });
    
    await saveScreenshot(page, 'entity_painter/category_workflow', categoryWorkflowTest.success);
    console.log('Category workflow test:', categoryWorkflowTest);
    
    if (!categoryWorkflowTest.success) {
      throw new Error('Category workflow test failed');
    }
    
    // Test 10: Entity removal
    console.log('\nTest 10: Entity removal');
    const removalTest = await page.evaluate(() => {
      const painter = new EntityPainter();
      
      // Place multiple entities
      painter.palette.selectTemplate('ant_worker');
      const ant1 = painter.placeEntity(5, 5);
      const ant2 = painter.placeEntity(10, 10);
      const ant3 = painter.placeEntity(15, 15);
      
      const countBefore = painter.placedEntities.length;
      
      // Remove one
      painter.removeEntity(ant2);
      
      const countAfter = painter.placedEntities.length;
      
      return {
        success: countBefore === 3 && countAfter === 2,
        countBefore,
        countAfter,
        expectedBefore: 3,
        expectedAfter: 2
      };
    });
    
    await saveScreenshot(page, 'entity_painter/removal', removalTest.success);
    console.log('Entity removal test:', removalTest);
    
    if (!removalTest.success) {
      throw new Error('Entity removal test failed');
    }
    
    console.log('\n=== All E2E Tests Passed ===');
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('E2E test failed:', error);
    await saveScreenshot(page, 'entity_painter/error', false);
    await browser.close();
    process.exit(1);
  }
})();
