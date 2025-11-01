/**
 * E2E Test: Entity Spawn Data Storage (Gherkin-Style)
 * 
 * Purpose: Test entity spawn data storage and export using BDD-style Gherkin syntax
 * 
 * Corresponds to Feature: level_editor_entity_painting.feature
 * Scenario: "Entity spawn data storage and export"
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const { given, when, then } = require('../levelEditor/userFlowHelpers');

(async () => {
  let browser;
  let success = false;
  
  try {
    console.log('🔍 Starting Entity Spawn Data Storage Test (Gherkin-Style)...\n');
    
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    await page.goto('http://localhost:8000?test=1', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    await sleep(2000);
    
    // GIVEN: Level Editor has spawn data storage
    console.log('='.repeat(70));
    console.log('GIVEN: Level Editor has spawn data storage');
    console.log('='.repeat(70) + '\n');
    
    await given.levelEditorIsOpen(page);
    
    const hasSpawnData = await page.evaluate(() => {
      return {
        hasEditor: !!window.levelEditor,
        hasSpawnDataArray: Array.isArray(window.levelEditor?._entitySpawnData),
        hasGetMethod: typeof window.levelEditor?.getEntitySpawnData === 'function',
        hasRemoveMethod: typeof window.levelEditor?.removeEntitySpawnData === 'function',
        hasClearMethod: typeof window.levelEditor?.clearEntitySpawnData === 'function'
      };
    });
    
    if (!hasSpawnData.hasEditor || !hasSpawnData.hasSpawnDataArray) {
      throw new Error('Level Editor spawn data storage not available');
    }
    console.log('✅ Level Editor has spawn data storage');
    console.log(`   - _entitySpawnData array: ${hasSpawnData.hasSpawnDataArray}`);
    console.log(`   - getEntitySpawnData(): ${hasSpawnData.hasGetMethod}`);
    console.log(`   - removeEntitySpawnData(): ${hasSpawnData.hasRemoveMethod}`);
    console.log(`   - clearEntitySpawnData(): ${hasSpawnData.hasClearMethod}\n`);
    
    await saveScreenshot(page, 'gherkin/spawn_data_01_storage_ready', true);
    
    // WHEN: Spawn data entries are added manually
    console.log('='.repeat(70));
    console.log('WHEN: Spawn data entries are added manually');
    console.log('='.repeat(70) + '\n');
    
    const addResult = await page.evaluate(() => {
      const editor = window.levelEditor;
      const templateId = 'entity_ant';
      
      // Add 3 spawn data entries
      editor._entitySpawnData.push({
        id: 'entity_test_001',
        templateId: templateId,
        gridX: 5,
        gridY: 5,
        properties: { JobName: 'Worker', faction: 'player' }
      });
      
      editor._entitySpawnData.push({
        id: 'entity_test_002',
        templateId: templateId,
        gridX: 10,
        gridY: 10,
        properties: {}
      });
      
      editor._entitySpawnData.push({
        id: 'entity_test_003',
        templateId: templateId,
        gridX: 15,
        gridY: 8,
        properties: {}
      });
      
      return {
        count: editor._entitySpawnData.length,
        entries: editor._entitySpawnData.map(e => ({
          id: e.id,
          templateId: e.templateId,
          gridX: e.gridX,
          gridY: e.gridY
        }))
      };
    });
    
    console.log(`✅ Added ${addResult.count} spawn data entries:`);
    addResult.entries.forEach(e => {
      console.log(`   - ${e.id} at grid (${e.gridX}, ${e.gridY})`);
    });
    console.log('');
    
    // THEN: Spawn data format should be correct
    console.log('='.repeat(70));
    console.log('THEN: Spawn data format should be correct');
    console.log('='.repeat(70) + '\n');
    
    const formatCheck = await page.evaluate(() => {
      const spawn = window.levelEditor._entitySpawnData[0];
      return {
        hasId: !!spawn.id,
        hasTemplateId: !!spawn.templateId,
        hasGridX: typeof spawn.gridX === 'number',
        hasGridY: typeof spawn.gridY === 'number',
        hasProperties: !!spawn.properties,
        spawn: spawn
      };
    });
    
    if (!formatCheck.hasId || !formatCheck.hasTemplateId || !formatCheck.hasGridX || !formatCheck.hasGridY) {
      throw new Error('Spawn data format is incorrect');
    }
    console.log('✅ Spawn data format is correct');
    console.log(`   - Has id: ${formatCheck.hasId}`);
    console.log(`   - Has templateId: ${formatCheck.hasTemplateId}`);
    console.log(`   - Has gridX (number): ${formatCheck.hasGridX}`);
    console.log(`   - Has gridY (number): ${formatCheck.hasGridY}`);
    console.log(`   - Has properties: ${formatCheck.hasProperties}\n`);
    
    await saveScreenshot(page, 'gherkin/spawn_data_02_format_correct', true);
    
    // AND: getEntitySpawnData method should return all entries
    console.log('='.repeat(70));
    console.log('AND: getEntitySpawnData method should return all entries');
    console.log('='.repeat(70) + '\n');
    
    const getResult = await page.evaluate(() => {
      const data = window.levelEditor.getEntitySpawnData();
      return {
        isArray: Array.isArray(data),
        count: data?.length || 0
      };
    });
    
    if (!getResult.isArray || getResult.count !== 3) {
      throw new Error(`getEntitySpawnData failed: returned ${getResult.count} entries, expected 3`);
    }
    console.log(`✅ getEntitySpawnData() returned ${getResult.count} entries\n`);
    
    // WHEN: Level is exported to JSON
    console.log('='.repeat(70));
    console.log('WHEN: Level is exported to JSON');
    console.log('='.repeat(70) + '\n');
    
    const exportResult = await page.evaluate(() => {
      const exportData = window.levelEditor._getExportData();
      return {
        hasEntities: !!exportData.entities,
        isArray: Array.isArray(exportData.entities),
        count: exportData.entities?.length || 0,
        firstEntity: exportData.entities?.[0]
      };
    });
    
    console.log(`✅ Exported to JSON: ${exportResult.count} entities\n`);
    
    // THEN: Entities array should contain all spawn data
    console.log('='.repeat(70));
    console.log('THEN: Entities array should contain all spawn data');
    console.log('='.repeat(70) + '\n');
    
    if (!exportResult.hasEntities || !exportResult.isArray || exportResult.count !== 3) {
      throw new Error(`Export failed: got ${exportResult.count} entities, expected 3`);
    }
    console.log('✅ Export contains all 3 spawn data entries\n');
    
    // AND: Each entity should have required properties
    console.log('='.repeat(70));
    console.log('AND: Each entity should have required properties');
    console.log('='.repeat(70) + '\n');
    
    const propsCheck = await page.evaluate(() => {
      const exportData = window.levelEditor._getExportData();
      const entity = exportData.entities[0];
      return {
        hasId: !!entity.id,
        hasTemplateId: !!entity.templateId,
        hasGridX: typeof entity.gridX === 'number',
        hasGridY: typeof entity.gridY === 'number',
        entity: entity
      };
    });
    
    if (!propsCheck.hasId || !propsCheck.hasTemplateId || !propsCheck.hasGridX || !propsCheck.hasGridY) {
      throw new Error('Exported entity missing required properties');
    }
    console.log('✅ Each entity has required properties');
    console.log(`   - id: ${propsCheck.hasId}`);
    console.log(`   - templateId: ${propsCheck.hasTemplateId}`);
    console.log(`   - gridX: ${propsCheck.hasGridX}`);
    console.log(`   - gridY: ${propsCheck.hasGridY}\n`);
    
    await saveScreenshot(page, 'gherkin/spawn_data_03_export_valid', true);
    
    // WHEN: An entity spawn data entry is removed by ID
    console.log('='.repeat(70));
    console.log('WHEN: An entity spawn data entry is removed by ID');
    console.log('='.repeat(70) + '\n');
    
    const removeResult = await page.evaluate(() => {
      const removeId = window.levelEditor._entitySpawnData[0].id;
      const beforeCount = window.levelEditor._entitySpawnData.length;
      window.levelEditor.removeEntitySpawnData(removeId);
      const afterCount = window.levelEditor._entitySpawnData.length;
      
      return {
        removeId: removeId,
        beforeCount: beforeCount,
        afterCount: afterCount
      };
    });
    
    console.log(`✅ Removed entity '${removeResult.removeId}'`);
    console.log(`   - Before: ${removeResult.beforeCount} entries`);
    console.log(`   - After: ${removeResult.afterCount} entries\n`);
    
    // THEN: Spawn data count should decrease by one
    console.log('='.repeat(70));
    console.log('THEN: Spawn data count should decrease by one');
    console.log('='.repeat(70) + '\n');
    
    if (removeResult.afterCount !== 2) {
      throw new Error(`Expected 2 entries after remove, got ${removeResult.afterCount}`);
    }
    console.log('✅ Spawn data count decreased by one\n');
    
    await saveScreenshot(page, 'gherkin/spawn_data_04_removed', true);
    
    // WHEN: All spawn data is cleared
    console.log('='.repeat(70));
    console.log('WHEN: All spawn data is cleared');
    console.log('='.repeat(70) + '\n');
    
    await page.evaluate(() => {
      window.levelEditor.clearEntitySpawnData();
    });
    console.log('✅ Cleared all spawn data\n');
    
    // THEN: Spawn data count should be zero
    console.log('='.repeat(70));
    console.log('THEN: Spawn data count should be zero');
    console.log('='.repeat(70) + '\n');
    
    const clearResult = await page.evaluate(() => {
      return {
        count: window.levelEditor._entitySpawnData.length
      };
    });
    
    if (clearResult.count !== 0) {
      throw new Error(`Expected 0 entries after clear, got ${clearResult.count}`);
    }
    console.log('✅ Spawn data count is zero\n');
    
    await saveScreenshot(page, 'gherkin/spawn_data_05_cleared', true);
    
    // Summary
    console.log('='.repeat(70));
    console.log('📊 TEST SUMMARY - Entity Spawn Data Storage Gherkin-Style');
    console.log('='.repeat(70));
    console.log('✅ GIVEN: Level Editor has spawn data storage');
    console.log('✅ WHEN: Added 3 spawn data entries');
    console.log('✅ THEN: Format is correct');
    console.log('✅ AND: getEntitySpawnData() returns all entries');
    console.log('✅ WHEN: Exported to JSON');
    console.log('✅ THEN: Export contains all spawn data');
    console.log('✅ AND: Each entity has required properties');
    console.log('✅ WHEN: Removed entry by ID');
    console.log('✅ THEN: Count decreased by one');
    console.log('✅ WHEN: Cleared all spawn data');
    console.log('✅ THEN: Count is zero');
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
