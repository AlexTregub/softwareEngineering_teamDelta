/**
 * E2E Test: Entity Eraser User Flow (Gherkin-Style)
 * 
 * Purpose: Test entity placement and erasure using BDD-style Gherkin syntax
 * 
 * Corresponds to Feature: level_editor_entity_painting.feature
 * Scenario: "Place and erase an entity using the entity painter"
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const {
  // Given - Setup preconditions
  given,
  
  // When - User actions
  when,
  
  // Then - Assertions
  then
} = require('../levelEditor/userFlowHelpers');

(async () => {
  let browser;
  let success = false;
  
  try {
    console.log('🔍 Starting Entity Eraser User Flow Test (Gherkin-Style)...\n');
    
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    await page.goto('http://localhost:8000?test=1', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    await sleep(2000);
    
    // GIVEN: Level Editor is open
    console.log('='.repeat(70));
    console.log('GIVEN: Level Editor is open');
    console.log('='.repeat(70) + '\n');
    
    await given.levelEditorIsOpen(page);
    console.log('✅ Level Editor is open\n');
    
    // GIVEN: entity_painter tool is selected
    console.log('='.repeat(70));
    console.log('GIVEN: entity_painter tool is selected');
    console.log('='.repeat(70) + '\n');
    
    await given.toolIsSelected(page, 'entity_painter');
    console.log('✅ entity_painter tool is selected\n');
    
    // GIVEN: Entity palette is open
    console.log('='.repeat(70));
    console.log('GIVEN: Entity palette is open');
    console.log('='.repeat(70) + '\n');
    
    await given.panelIsOpen(page, 'level-editor-entity-palette');
    console.log('✅ Entity palette is open\n');
    
    // WHEN: User clicks on an entity template
    console.log('='.repeat(70));
    console.log('WHEN: User clicks on an entity template');
    console.log('='.repeat(70) + '\n');
    
    await when.userOpensEntityPalette(page);
    await when.userClicksEntityTemplate(page, 0); // Click first template
    console.log('✅ User clicked entity template\n');
    
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
    
    await saveScreenshot(page, 'gherkin/entity_eraser_01_template_selected', true);
    
    // WHEN: User clicks on canvas at grid position (15, 15)
    console.log('='.repeat(70));
    console.log('WHEN: User clicks on canvas at grid (15, 15)');
    console.log('='.repeat(70) + '\n');
    
    const placeGridX = 15;
    const placeGridY = 15;
    await when.userPlacesEntityAtGrid(page, placeGridX, placeGridY);
    console.log('✅ User placed entity at grid (15, 15)\n');
    
    // THEN: Entity should exist at grid position (15, 15)
    console.log('='.repeat(70));
    console.log('THEN: Entity should exist at grid (15, 15)');
    console.log('='.repeat(70) + '\n');
    
    const entityExists = await then.entityShouldExistAtGrid(page, placeGridX, placeGridY);
    if (!entityExists) throw new Error('Entity does not exist at grid (15, 15)');
    console.log('✅ Entity exists at grid (15, 15)\n');
    
    await saveScreenshot(page, 'gherkin/entity_eraser_02_entity_placed', true);
    
    // WHEN: User selects the eraser tool
    console.log('='.repeat(70));
    console.log('WHEN: User selects the eraser tool');
    console.log('='.repeat(70) + '\n');
    
    await when.userSelectsTool(page, 'eraser');
    console.log('✅ User selected eraser tool\n');
    
    // THEN: Eraser tool should be active
    console.log('='.repeat(70));
    console.log('THEN: Eraser tool should be active');
    console.log('='.repeat(70) + '\n');
    
    const eraserActive = await then.toolShouldBe(page, 'eraser');
    if (!eraserActive) throw new Error('Eraser tool is not active');
    console.log('✅ Eraser tool is active\n');
    
    await saveScreenshot(page, 'gherkin/entity_eraser_03_eraser_selected', true);
    
    // WHEN: User switches to ENTITY eraser mode
    console.log('='.repeat(70));
    console.log('WHEN: User switches to ENTITY eraser mode');
    console.log('='.repeat(70) + '\n');
    
    await when.userClicksToolMode(page, 'ENTITY');
    console.log('✅ User switched to ENTITY eraser mode\n');
    
    // THEN: ENTITY eraser mode should be active
    console.log('='.repeat(70));
    console.log('THEN: ENTITY eraser mode should be active');
    console.log('='.repeat(70) + '\n');
    
    const entityModeActive = await then.modeShouldBe(page, 'ENTITY');
    if (!entityModeActive) throw new Error('ENTITY mode is not active');
    console.log('✅ ENTITY eraser mode is active\n');
    
    await saveScreenshot(page, 'gherkin/entity_eraser_04_entity_mode', true);
    
    // WHEN: User clicks on entity at grid position (15, 15)
    console.log('='.repeat(70));
    console.log('WHEN: User clicks on entity at grid (15, 15)');
    console.log('='.repeat(70) + '\n');
    
    await when.userErasesEntityAtGrid(page, placeGridX, placeGridY);
    console.log('✅ User clicked to erase entity at grid (15, 15)\n');
    
    // THEN: Entity should be removed from grid position (15, 15)
    console.log('='.repeat(70));
    console.log('THEN: Entity should be removed from grid (15, 15)');
    console.log('='.repeat(70) + '\n');
    
    const entityRemoved = await then.entityShouldNotExistAtGrid(page, placeGridX, placeGridY);
    if (!entityRemoved) throw new Error('Entity still exists at grid (15, 15)');
    console.log('✅ Entity removed from grid (15, 15)\n');
    
    // THEN: Entity should not be in level data
    console.log('='.repeat(70));
    console.log('THEN: Entity should not be in level data');
    console.log('='.repeat(70) + '\n');
    
    const notInLevelData = await page.evaluate(({ gridX, gridY }) => {
      const spawnData = window.levelEditor?._entitySpawnData || [];
      const entity = spawnData.find(e => e.gridX === gridX && e.gridY === gridY);
      return entity === undefined;
    }, { gridX: placeGridX, gridY: placeGridY });
    
    if (!notInLevelData) throw new Error('Entity still in level data');
    console.log('✅ Entity not in level data\n');
    
    await saveScreenshot(page, 'gherkin/entity_eraser_05_entity_erased', true);
    
    // Summary
    console.log('='.repeat(70));
    console.log('📊 TEST SUMMARY - Entity Eraser Gherkin-Style');
    console.log('='.repeat(70));
    console.log('✅ GIVEN: Level Editor opened');
    console.log('✅ GIVEN: entity_painter tool selected');
    console.log('✅ GIVEN: Entity palette opened');
    console.log('✅ WHEN: User clicked entity template');
    console.log('✅ THEN: Template selected');
    console.log('✅ WHEN: User placed entity at grid (15, 15)');
    console.log('✅ THEN: Entity exists at grid (15, 15)');
    console.log('✅ WHEN: User selected eraser tool');
    console.log('✅ THEN: Eraser tool active');
    console.log('✅ WHEN: User switched to ENTITY mode');
    console.log('✅ THEN: ENTITY mode active');
    console.log('✅ WHEN: User erased entity at grid (15, 15)');
    console.log('✅ THEN: Entity removed from grid (15, 15)');
    console.log('✅ THEN: Entity not in level data');
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
