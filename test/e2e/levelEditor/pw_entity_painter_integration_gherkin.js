/**
 * E2E Test: Entity Painter Integration (Gherkin-Style)
 * 
 * Purpose: Test complete Entity Painter workflow using BDD-style Gherkin syntax
 * 
 * Corresponds to Feature: level_editor_entity_painting.feature
 * Scenario: "Entity painter integration workflow"
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');
const { given, when, then } = require('../levelEditor/userFlowHelpers');

(async () => {
  let browser;
  let success = false;
  
  try {
    console.log('🔍 Starting Entity Painter Integration Test (Gherkin-Style)...\n');
    
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    await page.goto('http://localhost:8000?test=1', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    await sleep(2000);
    
    // GIVEN: Level Editor is active
    console.log('='.repeat(70));
    console.log('GIVEN: Level Editor is active');
    console.log('='.repeat(70) + '\n');
    
    await given.levelEditorIsOpen(page);
    console.log('✅ Level Editor is active\n');
    await saveScreenshot(page, 'gherkin/painter_01_editor_active', true);
    
    // WHEN: User clicks the entity_painter tool
    console.log('='.repeat(70));
    console.log('WHEN: User clicks the entity_painter tool');
    console.log('='.repeat(70) + '\n');
    
    await when.userClicksToolbarTool(page, 'entity_painter');
    console.log('✅ User clicked entity_painter tool\n');
    
    // THEN: Entity_painter tool should be selected
    console.log('='.repeat(70));
    console.log('THEN: Entity_painter tool should be selected');
    console.log('='.repeat(70) + '\n');
    
    const toolSelected = await then.toolShouldBe(page, 'entity_painter');
    console.log('✅ Entity_painter tool is selected\n');
    await saveScreenshot(page, 'gherkin/painter_02_tool_selected', true);
    
    // WHEN: User selects an entity template from the palette
    console.log('='.repeat(70));
    console.log('WHEN: User selects an entity template from the palette');
    console.log('='.repeat(70) + '\n');
    
    await when.userOpensEntityPalette(page);
    await when.userClicksEntityTemplate(page, 0);
    console.log('✅ User selected entity template\n');
    
    // THEN: Entity template should be selected
    console.log('='.repeat(70));
    console.log('THEN: Entity template should be selected');
    console.log('='.repeat(70) + '\n');
    
    const templateSelected = await page.evaluate(() => {
      const palette = window.levelEditor?.entityPalette;
      return palette && palette.getSelectedTemplateId() !== null;
    });
    
    if (!templateSelected) throw new Error('Entity template not selected');
    console.log('✅ Entity template is selected\n');
    await saveScreenshot(page, 'gherkin/painter_03_template_selected', true);
    
    // WHEN: User clicks on the terrain at grid position (10, 10)
    console.log('='.repeat(70));
    console.log('WHEN: User clicks on the terrain at grid (10, 10)');
    console.log('='.repeat(70) + '\n');
    
    const placeGridX = 10;
    const placeGridY = 10;
    await when.userPlacesEntityAtGrid(page, placeGridX, placeGridY);
    console.log('✅ User placed entity at grid (10, 10)\n');
    
    // THEN: Entity should be placed at grid (10, 10)
    console.log('='.repeat(70));
    console.log('THEN: Entity should be placed at grid (10, 10)');
    console.log('='.repeat(70) + '\n');
    
    const entityPlaced = await then.entityShouldExistAtGrid(page, placeGridX, placeGridY);
    console.log('✅ Entity placed at grid (10, 10)\n');
    await saveScreenshot(page, 'gherkin/painter_04_entity_placed', true);
    
    // AND: Entity should be found at that position
    console.log('='.repeat(70));
    console.log('AND: Entity should be found at that position');
    console.log('='.repeat(70) + '\n');
    
    const entityFound = await page.evaluate(({ gridX, gridY }) => {
      const TILE_SIZE = 32;
      const worldX = gridX * TILE_SIZE + (TILE_SIZE / 2);
      const worldY = gridY * TILE_SIZE + (TILE_SIZE / 2);
      const found = window.levelEditor?.entityPainter?.getEntityAtPosition(worldX, worldY, 32);
      return found !== null && found !== undefined;
    }, { gridX: placeGridX, gridY: placeGridY });
    
    if (!entityFound) throw new Error('Entity not found at position');
    console.log('✅ Entity found at position\n');
    
    // WHEN: User exports the level to JSON
    console.log('='.repeat(70));
    console.log('WHEN: User exports the level to JSON');
    console.log('='.repeat(70) + '\n');
    
    const exportData = await page.evaluate(() => {
      const data = window.levelEditor?.entityPainter?.exportToJSON();
      return {
        success: data?.entities?.length > 0,
        count: data?.entities?.length || 0,
        firstEntity: data?.entities?.[0]
      };
    });
    
    console.log(`✅ Exported ${exportData.count} entities\n`);
    
    // THEN: Exported JSON should contain the placed entity
    console.log('='.repeat(70));
    console.log('THEN: Exported JSON should contain the placed entity');
    console.log('='.repeat(70) + '\n');
    
    if (!exportData.success || exportData.count === 0) {
      throw new Error('Export failed or no entities in export');
    }
    console.log('✅ Export contains placed entity\n');
    await saveScreenshot(page, 'gherkin/painter_05_exported', true);
    
    // WHEN: User clears all entities
    console.log('='.repeat(70));
    console.log('WHEN: User clears all entities');
    console.log('='.repeat(70) + '\n');
    
    await page.evaluate(() => {
      if (window.levelEditor?.entityPainter) {
        window.levelEditor.entityPainter.placedEntities = [];
      }
    });
    console.log('✅ Entities cleared\n');
    
    // AND: User imports the level from JSON
    console.log('='.repeat(70));
    console.log('AND: User imports the level from JSON');
    console.log('='.repeat(70) + '\n');
    
    const importResult = await page.evaluate((firstEntity) => {
      const painter = window.levelEditor?.entityPainter;
      if (!painter) return { success: false };
      
      painter.importFromJSON({ entities: [firstEntity] });
      return { 
        success: painter.placedEntities.length > 0,
        count: painter.placedEntities.length
      };
    }, exportData.firstEntity);
    
    if (!importResult.success) throw new Error('Import failed');
    console.log(`✅ Imported ${importResult.count} entities\n`);
    await saveScreenshot(page, 'gherkin/painter_06_imported', true);
    
    // THEN: Entity should be restored at grid (10, 10)
    console.log('='.repeat(70));
    console.log('THEN: Entity should be restored at grid (10, 10)');
    console.log('='.repeat(70) + '\n');
    
    const entityRestored = await then.entityShouldExistAtGrid(page, placeGridX, placeGridY);
    console.log('✅ Entity restored at grid (10, 10)\n');
    
    // WHEN: User removes the entity
    console.log('='.repeat(70));
    console.log('WHEN: User removes the entity');
    console.log('='.repeat(70) + '\n');
    
    const removeResult = await page.evaluate(() => {
      const painter = window.levelEditor?.entityPainter;
      if (!painter || painter.placedEntities.length === 0) return { success: false };
      
      const entity = painter.placedEntities[0];
      const beforeCount = painter.placedEntities.length;
      painter.removeEntity(entity);
      const afterCount = painter.placedEntities.length;
      
      return { success: afterCount < beforeCount, before: beforeCount, after: afterCount };
    });
    
    if (!removeResult.success) throw new Error('Remove failed');
    console.log(`✅ Removed entity (${removeResult.before} → ${removeResult.after})\n`);
    await saveScreenshot(page, 'gherkin/painter_07_removed', true);
    
    // THEN: No entities should remain
    console.log('='.repeat(70));
    console.log('THEN: No entities should remain');
    console.log('='.repeat(70) + '\n');
    
    const noEntitiesRemain = await page.evaluate(() => {
      const painter = window.levelEditor?.entityPainter;
      return painter?.placedEntities.length === 0;
    });
    
    if (!noEntitiesRemain) throw new Error('Entities still remain');
    console.log('✅ No entities remain\n');
    
    // Summary
    console.log('='.repeat(70));
    console.log('📊 TEST SUMMARY - Entity Painter Integration Gherkin-Style');
    console.log('='.repeat(70));
    console.log('✅ GIVEN: Level Editor active');
    console.log('✅ WHEN: User clicked entity_painter tool');
    console.log('✅ THEN: Tool selected');
    console.log('✅ WHEN: User selected entity template');
    console.log('✅ THEN: Template selected');
    console.log('✅ WHEN: User placed entity at grid (10, 10)');
    console.log('✅ THEN: Entity placed and found');
    console.log('✅ WHEN: User exported to JSON');
    console.log('✅ THEN: Export contains entity');
    console.log('✅ WHEN: User cleared and imported');
    console.log('✅ THEN: Entity restored');
    console.log('✅ WHEN: User removed entity');
    console.log('✅ THEN: No entities remain');
    console.log('\n✅ All Gherkin scenarios passed!\n');
    
    success = true;
    
  } catch (error) {
    console.error(`\n❌ Test error: ${error.message}`);
    console.error(error.stack);
    success = false;
  } finally {
    if (browser) {
      await browser.close();
    }
    process.exit(success ? 0 : 1);
  }
})();
