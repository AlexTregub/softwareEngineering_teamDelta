/**
 * Custom Entities Workflow - E2E Tests with Screenshots
 * 
 * Visual verification of custom entities system:
 * - Custom category empty state
 * - Add new custom entity modal
 * - Entity appears in list
 * - Rename entity modal
 * - Delete confirmation modal
 * - Multiple custom entities
 * 
 * CRITICAL: Uses ensureLevelEditorStarted to bypass main menu
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:8000?test=1');
    
    // CRITICAL: Ensure we're past the main menu (Level Editor state)
    const editorStarted = await cameraHelper.ensureLevelEditorStarted(page);
    
    // Check if we're in Level Editor state
    const inLevelEditor = await page.evaluate(() => {
      const gs = window.GameState || window.g_gameState || null;
      if (gs && typeof gs.getState === 'function') {
        return gs.getState() === 'LEVEL_EDITOR';
      }
      return false;
    });
    
    if (!inLevelEditor && !editorStarted.started) {
      console.error('❌ Failed to enter Level Editor state');
      console.error('Reason:', editorStarted.reason || 'Unknown');
      await saveScreenshot(page, 'ui/custom_entities_error', false);
      await browser.close();
      process.exit(1);
    }
    
    console.log('✅ Level Editor state active (past main menu)');
    
    // Test 1: Create EntityPalette instance with Custom category
    console.log('\n📋 Test 1: Creating EntityPalette with Custom category...');
    const customCategoryOpened = await page.evaluate(() => {
      if (!window.EntityPalette) return { success: false, message: 'EntityPalette class not found' };
      
      // Clear any existing custom entities
      localStorage.removeItem('antGame_customEntities');
      
      // Create EntityPalette instance
      window.testEntityPalette = new window.EntityPalette();
      
      if (!window.testEntityPalette) return { success: false, message: 'Failed to create instance' };
      
      // Switch to custom category
      window.testEntityPalette.setCategory('custom');
      
      // Force render
      window.gameState = 'LEVEL_EDITOR';
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
      
      const templates = window.testEntityPalette.getTemplates('custom');
      return { 
        success: true, 
        customCount: templates.length,
        category: window.testEntityPalette.getCategory()
      };
    });
    
    if (!customCategoryOpened.success) {
      console.error('❌ Failed to open custom category:', customCategoryOpened.message);
      await saveScreenshot(page, 'ui/custom_category_error', false);
      await browser.close();
      process.exit(1);
    }
    
    await sleep(500);
    await saveScreenshot(page, 'ui/custom_category_empty_state', true);
    console.log('✅ Custom category opened (empty state)');
    console.log(`   Custom entities count: ${customCategoryOpened.customCount}`);
    
    // Test 2: Add custom entity programmatically (simulating modal workflow)
    console.log('\n📋 Test 2: Adding custom entity...');
    const entityAdded = await page.evaluate(() => {
      const entityPalette = window.testEntityPalette;
      
      if (!entityPalette) return { success: false, message: 'No palette' };
      
      // Add custom entity
      const entity = entityPalette.addCustomEntity('Elite Worker', 'ant_worker', {
        health: 150,
        movementSpeed: 45,
        faction: 'player'
      });
      
      if (!entity) return { success: false, message: 'Failed to add' };
      
      // Force render
      if (window.draggablePanelManager.renderPanels) {
        window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
      }
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
      
      const templates = entityPalette.getTemplates('custom');
      return {
        success: true,
        entityId: entity.id,
        customName: entity.customName,
        customCount: templates.length
      };
    });
    
    if (!entityAdded.success) {
      console.error('❌ Failed to add custom entity:', entityAdded.message);
      await saveScreenshot(page, 'ui/custom_entity_add_error', false);
      await browser.close();
      process.exit(1);
    }
    
    await sleep(500);
    await saveScreenshot(page, 'ui/custom_entity_added', true);
    console.log('✅ Custom entity added:', entityAdded.customName);
    console.log(`   Entity ID: ${entityAdded.entityId}`);
    console.log(`   Custom entities count: ${entityAdded.customCount}`);
    
    // Test 3: Add second custom entity
    console.log('\n📋 Test 3: Adding second custom entity...');
    const secondEntityAdded = await page.evaluate(() => {
      const entityPalette = window.testEntityPalette;
      
      if (!entityPalette) return { success: false };
      
      const entity = entityPalette.addCustomEntity('Heavy Soldier', 'ant_soldier', {
        health: 250,
        movementSpeed: 40,
        damage: 35,
        faction: 'player'
      });
      
      if (!entity) return { success: false };
      
      // Force render
      if (window.draggablePanelManager.renderPanels) {
        window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
      }
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
      
      const templates = entityPalette.getTemplates('custom');
      return {
        success: true,
        customCount: templates.length,
        allNames: templates.map(t => t.customName)
      };
    });
    
    if (!secondEntityAdded.success) {
      console.error('❌ Failed to add second entity');
      await saveScreenshot(page, 'ui/second_entity_error', false);
      await browser.close();
      process.exit(1);
    }
    
    await sleep(500);
    await saveScreenshot(page, 'ui/multiple_custom_entities', true);
    console.log('✅ Second entity added');
    console.log(`   Total custom entities: ${secondEntityAdded.customCount}`);
    console.log(`   Entity names: ${secondEntityAdded.allNames.join(', ')}`);
    
    // Test 4: Rename entity
    console.log('\n📋 Test 4: Renaming first entity...');
    const entityRenamed = await page.evaluate(() => {
      const entityPalette = window.testEntityPalette;
      
      if (!entityPalette) return { success: false };
      
      const templates = entityPalette.getTemplates('custom');
      if (templates.length === 0) return { success: false, message: 'No entities' };
      
      const firstEntity = templates[0];
      const success = entityPalette.renameCustomEntity(firstEntity.id, 'Super Elite Worker');
      
      if (!success) return { success: false, message: 'Rename failed' };
      
      // Force render
      if (window.draggablePanelManager.renderPanels) {
        window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
      }
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
      
      const updated = entityPalette.getCustomEntity(firstEntity.id);
      return {
        success: true,
        oldName: 'Elite Worker',
        newName: updated.customName
      };
    });
    
    if (!entityRenamed.success) {
      console.error('❌ Failed to rename entity:', entityRenamed.message);
      await saveScreenshot(page, 'ui/rename_error', false);
      await browser.close();
      process.exit(1);
    }
    
    await sleep(500);
    await saveScreenshot(page, 'ui/custom_entity_renamed', true);
    console.log('✅ Entity renamed');
    console.log(`   Old name: ${entityRenamed.oldName}`);
    console.log(`   New name: ${entityRenamed.newName}`);
    
    // Test 5: Delete entity
    console.log('\n📋 Test 5: Deleting second entity...');
    const entityDeleted = await page.evaluate(() => {
      const entityPalette = window.testEntityPalette;
      
      if (!entityPalette) return { success: false };
      
      const templates = entityPalette.getTemplates('custom');
      if (templates.length < 2) return { success: false, message: 'Not enough entities' };
      
      const secondEntity = templates[1];
      const deletedName = secondEntity.customName;
      const success = entityPalette.deleteCustomEntity(secondEntity.id);
      
      if (!success) return { success: false, message: 'Delete failed' };
      
      // Force render
      if (window.draggablePanelManager.renderPanels) {
        window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
      }
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
      
      const remaining = entityPalette.getTemplates('custom');
      return {
        success: true,
        deletedName: deletedName,
        remainingCount: remaining.length,
        remainingNames: remaining.map(t => t.customName)
      };
    });
    
    if (!entityDeleted.success) {
      console.error('❌ Failed to delete entity:', entityDeleted.message);
      await saveScreenshot(page, 'ui/delete_error', false);
      await browser.close();
      process.exit(1);
    }
    
    await sleep(500);
    await saveScreenshot(page, 'ui/custom_entity_deleted', true);
    console.log('✅ Entity deleted');
    console.log(`   Deleted: ${entityDeleted.deletedName}`);
    console.log(`   Remaining: ${entityDeleted.remainingCount} (${entityDeleted.remainingNames.join(', ')})`);
    
    // Test 6: Verify persistence (reload simulation)
    console.log('\n📋 Test 6: Verifying LocalStorage persistence...');
    const persistenceCheck = await page.evaluate(() => {
      const stored = localStorage.getItem('antGame_customEntities');
      if (!stored) return { success: false, message: 'No data in storage' };
      
      const data = JSON.parse(stored);
      return {
        success: true,
        storedCount: data.length,
        storedNames: data.map(e => e.customName),
        hasTimestamps: data.every(e => e.createdAt && e.lastModified)
      };
    });
    
    if (!persistenceCheck.success) {
      console.error('❌ Persistence check failed:', persistenceCheck.message);
      await saveScreenshot(page, 'ui/persistence_error', false);
      await browser.close();
      process.exit(1);
    }
    
    console.log('✅ Persistence verified');
    console.log(`   Stored in LocalStorage: ${persistenceCheck.storedCount} entities`);
    console.log(`   Names: ${persistenceCheck.storedNames.join(', ')}`);
    console.log(`   Has timestamps: ${persistenceCheck.hasTimestamps}`);
    
    // All tests passed
    console.log('\n✅ All custom entities E2E tests passed!');
    console.log('\n📊 Screenshots saved:');
    console.log('   - custom_category_empty_state.png');
    console.log('   - custom_entity_added.png');
    console.log('   - multiple_custom_entities.png');
    console.log('   - custom_entity_renamed.png');
    console.log('   - custom_entity_deleted.png');
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error(error.stack);
    await saveScreenshot(page, 'ui/custom_entities_crash', false);
    await browser.close();
    process.exit(1);
  }
})();
