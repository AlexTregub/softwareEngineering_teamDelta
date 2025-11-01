/**
 * E2E Test - Entity Spawn Points Data Storage & Export
 * 
 * CRITICAL: Tests that entity spawn data is stored and exported correctly
 * This test verifies:
 * - Spawn data array exists and is accessible
 * - Spawn data format includes required properties (id, templateId, gridX, gridY, properties)
 * - Multiple spawn points can be stored
 * - Export JSON includes entities array with all spawn data
 * - Methods exist for CRUD operations (get, clear, remove)
 * 
 * Tests:
 * 1. Verify spawn data storage API exists
 * 2. Add spawn data entries manually
 * 3. Verify data format correctness
 * 4. Test getEntitySpawnData() method
 * 5. Verify export includes entities array
 * 6. Test removeEntitySpawnData() method
 * 7. Test clearEntitySpawnData() method
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('Loading Level Editor...');
    await page.goto('http://localhost:8000?test=1');
    
    // Navigate to Level Editor state
    await page.evaluate(() => {
      const gs = window.GameState || window.g_gameState;
      if (gs && typeof gs.setState === 'function') {
        gs.setState('LEVEL_EDITOR');
      }
    });
    
    // Wait for Level Editor to initialize
    await sleep(2000);
    
    console.log('Testing entity spawn point rendering...');
    
    const result = await page.evaluate(() => {
      const results = {
        success: true,
        errors: [],
        details: {}
      };
      
      // Check if Level Editor exists
      if (!window.levelEditor) {
        results.success = false;
        results.errors.push('LevelEditor instance not found');
        results.details.availableGlobals = Object.keys(window).filter(k => k.toLowerCase().includes('level')).join(', ');
        return results;
      }
      
      const editor = window.levelEditor;
      
      // Test 1: Verify renderEntitySpawnPoints method exists
      if (typeof editor.renderEntitySpawnPoints !== 'function') {
        results.errors.push('renderEntitySpawnPoints method missing');
        results.success = false;
      }
      
      // Test 2: Verify _entity SpawnData array exists
      if (!Array.isArray(editor._entitySpawnData)) {
        results.errors.push('_entitySpawnData not an array');
        results.success = false;
      }
      
      // Record initial state
      results.details.initialSpawnCount = editor._entitySpawnData ? editor._entitySpawnData.length : 0;
      
      // Test 3: Manually add spawn data to test rendering (bypass EntityPalette requirement)
      const templateId = 'entity_ant';
      const properties = { JobName: 'Worker', faction: 'player' };
      
      results.details.templateId = templateId;
      
      // Manually add spawn entries (simulates what _placeSingleEntity would do)
      editor._entitySpawnData.push({
        id: `entity_test_001`,
        templateId: templateId,
        gridX: 5,
        gridY: 5,
        properties: properties
      });
      
      results.details.spawnCountAfterFirst = editor._entitySpawnData.length;
      
      if (editor._entitySpawnData.length !== 1) {
        results.errors.push(`Expected 1 spawn point, got ${editor._entitySpawnData.length}`);
        results.success = false;
      }
      
      // Test 4: Verify spawn data format
      const spawn1 = editor._entitySpawnData[0];
      if (!spawn1 || !spawn1.id || !spawn1.templateId || typeof spawn1.gridX !== 'number' || typeof spawn1.gridY !== 'number') {
        results.errors.push('Spawn data format incorrect');
        results.success = false;
      } else {
        results.details.spawn1 = {
          id: spawn1.id,
          templateId: spawn1.templateId,
          gridX: spawn1.gridX,
          gridY: spawn1.gridY
        };
      }
      
      // Test 5: Add multiple entities at different locations
      editor._entitySpawnData.push({
        id: `entity_test_002`,
        templateId: templateId,
        gridX: 10,
        gridY: 10,
        properties: {}
      });
      
      editor._entitySpawnData.push({
        id: `entity_test_003`,
        templateId: templateId,
        gridX: 15,
        gridY: 8,
        properties: {}
      });
      
      results.details.spawnCountAfterMultiple = editor._entitySpawnData.length;
      
      if (editor._entitySpawnData.length !== 3) {
        results.errors.push(`Expected 3 spawn points, got ${editor._entitySpawnData.length}`);
        results.success = false;
      }
      
      // Test 6: Check spawn point coordinates
      results.details.allSpawnPoints = editor._entitySpawnData.map(s => ({
        id: s.id,
        templateId: s.templateId,
        gridX: s.gridX,
        gridY: s.gridY
      }));
      
      // Test 7: Verify getEntitySpawnData() method
      const spawnDataCopy = editor.getEntitySpawnData();
      if (!Array.isArray(spawnDataCopy)) {
        results.errors.push('getEntitySpawnData() did not return array');
        results.success = false;
      }
      
      if (spawnDataCopy.length !== 3) {
        results.errors.push(`getEntitySpawnData() returned ${spawnDataCopy.length} items, expected 3`);
        results.success = false;
      }
      
      // Test 8: Verify export includes entity data
      const exportData = editor._getExportData();
      
      if (!exportData.entities) {
        results.errors.push('Export data missing entities array');
        results.success = false;
      }
      
      if (!Array.isArray(exportData.entities)) {
        results.errors.push('Export entities is not an array');
        results.success = false;
      }
      
      if (exportData.entities.length !== 3) {
        results.errors.push(`Export entities has ${exportData.entities.length} items, expected 3`);
        results.success = false;
      }
      
      results.details.exportedEntityCount = exportData.entities ? exportData.entities.length : 0;
      
      // Test 9: Verify export data includes all spawn point properties
      if (exportData.entities && exportData.entities.length > 0) {
        const firstEntity = exportData.entities[0];
        if (!firstEntity.id || !firstEntity.templateId || typeof firstEntity.gridX !== 'number' || typeof firstEntity.gridY !== 'number') {
          results.errors.push('Exported entity missing required properties');
          results.success = false;
        }
      }
      
      // Test 10: Test removeEntitySpawnData() method
      const removeId = editor._entitySpawnData[0].id;
      editor.removeEntitySpawnData(removeId);
      
      const countAfterRemove = editor._entitySpawnData.length;
      results.details.countAfterRemove = countAfterRemove;
      
      if (countAfterRemove !== 2) { // Should have 2 left (3 - 1)
        results.errors.push(`Expected 2 spawn points after remove, got ${countAfterRemove}`);
        results.success = false;
      }
      
      // Test 11: Test clearEntitySpawnData() method
      editor.clearEntitySpawnData();
      
      const countAfterClear = editor._entitySpawnData.length;
      results.details.countAfterClear = countAfterClear;
      
      if (countAfterClear !== 0) {
        results.errors.push(`Expected 0 spawn points after clear, got ${countAfterClear}`);
        results.success = false;
      }
      
      return results;
    });
    
    // Wait for evaluation to complete
    await sleep(500);
    
    // Save screenshot (Level Editor state, no render attempted)
    await saveScreenshot(page, 'levelEditor/entity_spawn_data_storage', result.success);
    
    // Report results
    console.log('\nTest Results:');
    console.log('✓ Initial spawn count:', result.details.initialSpawnCount);
    console.log('✓ Template ID:', result.details.templateId);
    console.log('✓ Spawn count after first:', result.details.spawnCountAfterFirst);
    console.log('✓ First spawn point:', JSON.stringify(result.details.spawn1, null, 2));
    console.log('✓ Spawn count after multiple:', result.details.spawnCountAfterMultiple);
    console.log('✓ All spawn points:', JSON.stringify(result.details.allSpawnPoints, null, 2));
    console.log('✓ Exported entity count:', result.details.exportedEntityCount);
    console.log('✓ Count after remove:', result.details.countAfterRemove);
    console.log('✓ Count after clear:', result.details.countAfterClear);
    
    if (!result.success) {
      console.error('\n❌ ERRORS:');
      result.errors.forEach(err => console.error('  -', err));
      console.error('\nDiagnostics:');
      console.error('  Available globals:', result.details.availableGlobals);
      console.error('  Editor properties:', result.details.editorProperties);
    } else {
      console.log('\n✅ All tests passed!');
      console.log('✅ Spawn data storage API works correctly');
      console.log('✅ Spawn data format is valid');
      console.log('✅ Export includes entity spawn data');
      console.log('✅ CRUD operations work (get, remove, clear)');
    }
    
    await browser.close();
    
    if (result.success) {
      console.log('\n✅ Entity spawn data storage test PASSED');
      process.exit(0);
    } else {
      console.error('\n❌ Entity spawn data storage test FAILED');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Test error:', error);
    await saveScreenshot(page, 'levelEditor/entity_spawn_points_render_error', false);
    await browser.close();
    process.exit(1);
  }
})();
