/**
 * E2E Test: Entity Selection Box (Gherkin-Style)
 * 
 * Purpose: Test EntitySelectionTool component using BDD-style Gherkin syntax
 * 
 * Corresponds to Feature: level_editor_entity_painting.feature
 * Scenario: "Entity selection box functionality"
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');
const { given, when, then } = require('../levelEditor/userFlowHelpers');

(async () => {
  let browser;
  let success = false;
  
  try {
    console.log('🔍 Starting Entity Selection Box Test (Gherkin-Style)...\n');
    
    browser = await launchBrowser();
    const page = await cameraHelper.newPageReady(browser);
    
    await page.appGoto();
    await sleep(1000);
    
    // GIVEN: EntitySelectionTool is created
    console.log('='.repeat(70));
    console.log('GIVEN: EntitySelectionTool is created');
    console.log('='.repeat(70) + '\n');
    
    await page.evaluate(() => {
      window.gameState = 'LEVEL_EDITOR';
    });
    await sleep(500);
    
    const toolCreated = await page.evaluate(() => {
      // Initialize arrays
      window.placedEntities = [];
      window.placedEvents = [];
      
      // Create Entity class mock if needed
      if (typeof window.Entity === 'undefined') {
        window.Entity = class {
          constructor(x, y, w, h) {
            this.x = x; this.y = y; this.w = w; this.h = h;
            this.isSelected = false;
            this.isBoxHovered = false;
          }
          getPosition() {
            return { x: this.x, y: this.y };
          }
          getSize() {
            return { x: this.w, y: this.h };
          }
          getWidth() {
            return this.w;
          }
          getHeight() {
            return this.h;
          }
        };
      }
      
      // Check if EntitySelectionTool class is available
      if (typeof window.EntitySelectionTool === 'undefined') {
        return { success: false, error: 'EntitySelectionTool class not loaded' };
      }
      
      // Create EntitySelectionTool instance
      window.testSelectionTool = new EntitySelectionTool(
        window.placedEntities,
        window.placedEvents,
        'ENTITY'
      );
      
      return { 
        success: true, 
        mode: window.testSelectionTool.getMode(),
        hasArrays: Array.isArray(window.placedEntities) && Array.isArray(window.placedEvents)
      };
    });
    
    if (!toolCreated.success) {
      throw new Error(toolCreated.error);
    }
    console.log('✅ EntitySelectionTool is created');
    console.log(`   - Mode: ${toolCreated.mode}`);
    console.log(`   - Arrays initialized: ${toolCreated.hasArrays}\n`);
    
    await saveScreenshot(page, 'gherkin/selection_01_tool_created', true);
    
    // AND: Multiple entities are placed on the grid
    console.log('='.repeat(70));
    console.log('AND: Multiple entities are placed on the grid');
    console.log('='.repeat(70) + '\n');
    
    const placementResult = await page.evaluate(() => {
      // Place 3 entities in a row
      const positions = [
        { x: 100, y: 100 },
        { x: 200, y: 100 },
        { x: 300, y: 100 }
      ];
      
      positions.forEach(pos => {
        const entity = new window.Entity(pos.x, pos.y, 32, 32);
        window.placedEntities.push(entity);
      });
      
      return { 
        count: window.placedEntities.length, 
        positions: window.placedEntities.map(e => ({ x: e.x, y: e.y }))
      };
    });
    
    console.log(`✅ Placed ${placementResult.count} entities on grid:`);
    placementResult.positions.forEach((pos, i) => {
      console.log(`   - Entity ${i + 1}: (${pos.x}, ${pos.y})`);
    });
    console.log('');
    
    await saveScreenshot(page, 'gherkin/selection_02_entities_placed', true);
    
    // WHEN: User drags a selection box over the entities
    console.log('='.repeat(70));
    console.log('WHEN: User drags a selection box over the entities');
    console.log('='.repeat(70) + '\n');
    
    const selectionResult = await page.evaluate(() => {
      const tool = window.testSelectionTool;
      if (!tool) return { error: 'Tool not found' };
      
      // Entities are at (100,100), (200,100), (300,100) with size 32x32
      // Selection box from (50,50) to (350,150) should encompass all
      tool.handleMousePressed(50, 50);
      tool.handleMouseDragged(350, 150);
      tool.handleMouseReleased(350, 150);
      
      // Count selected entities
      const selectedCount = window.placedEntities.filter(e => e.isSelected === true).length;
      
      // Debug info
      const entityInfo = window.placedEntities.map(e => {
        const pos = e.getPosition();
        const size = e.getSize();
        return {
          pos,
          size,
          center: { x: pos.x + size.x / 2, y: pos.y + size.y / 2 },
          isSelected: e.isSelected
        };
      });
      
      return { 
        success: true,
        selectedCount, 
        totalCount: window.placedEntities.length,
        mode: tool.getMode(),
        entityInfo,
        selectionBox: { x1: 50, y1: 50, x2: 350, y2: 150 }
      };
    });
    
    if (selectionResult.error) {
      throw new Error(selectionResult.error);
    }
    
    console.log('✅ User dragged selection box');
    console.log(`   - Box: (${selectionResult.selectionBox.x1},${selectionResult.selectionBox.y1}) to (${selectionResult.selectionBox.x2},${selectionResult.selectionBox.y2})`);
    console.log(`   - Mode: ${selectionResult.mode}\n`);
    
    // THEN: All entities within the box should be selected
    console.log('='.repeat(70));
    console.log('THEN: All entities within the box should be selected');
    console.log('='.repeat(70) + '\n');
    
    if (selectionResult.selectedCount !== 3) {
      console.log('Entity details:');
      selectionResult.entityInfo.forEach((e, i) => {
        console.log(`   Entity ${i + 1}:`, JSON.stringify(e, null, 2));
      });
      throw new Error(`Expected 3 entities selected, got ${selectionResult.selectedCount}`);
    }
    
    console.log(`✅ All ${selectionResult.selectedCount}/${selectionResult.totalCount} entities selected\n`);
    
    // AND: Selected state should be visible
    console.log('='.repeat(70));
    console.log('AND: Selected state should be visible');
    console.log('='.repeat(70) + '\n');
    
    const selectedStates = await page.evaluate(() => {
      return window.placedEntities.map(e => e.isSelected);
    });
    
    const allSelected = selectedStates.every(s => s === true);
    if (!allSelected) {
      throw new Error('Not all entities have isSelected=true');
    }
    
    console.log('✅ Selected state is visible (all entities have isSelected=true)\n');
    await saveScreenshot(page, 'gherkin/selection_03_entities_selected', true);
    
    // WHEN: User deletes selected entities
    console.log('='.repeat(70));
    console.log('WHEN: User deletes selected entities');
    console.log('='.repeat(70) + '\n');
    
    const deletionResult = await page.evaluate(() => {
      const beforeCount = window.placedEntities.length;
      window.placedEntities = window.placedEntities.filter(e => !e.isSelected);
      const afterCount = window.placedEntities.length;
      
      return { 
        beforeCount,
        afterCount,
        deletedCount: beforeCount - afterCount
      };
    });
    
    console.log(`✅ Deleted ${deletionResult.deletedCount} selected entities`);
    console.log(`   - Before: ${deletionResult.beforeCount} entities`);
    console.log(`   - After: ${deletionResult.afterCount} entities\n`);
    
    // THEN: All selected entities should be removed
    console.log('='.repeat(70));
    console.log('THEN: All selected entities should be removed');
    console.log('='.repeat(70) + '\n');
    
    if (deletionResult.deletedCount !== 3) {
      throw new Error(`Expected 3 entities deleted, got ${deletionResult.deletedCount}`);
    }
    console.log('✅ All selected entities removed\n');
    
    // AND: No entities should remain in the array
    console.log('='.repeat(70));
    console.log('AND: No entities should remain in the array');
    console.log('='.repeat(70) + '\n');
    
    if (deletionResult.afterCount !== 0) {
      throw new Error(`Expected 0 entities remaining, got ${deletionResult.afterCount}`);
    }
    console.log('✅ No entities remain in array\n');
    
    await saveScreenshot(page, 'gherkin/selection_04_entities_deleted', true);
    
    // Summary
    console.log('='.repeat(70));
    console.log('📊 TEST SUMMARY - Entity Selection Box Gherkin-Style');
    console.log('='.repeat(70));
    console.log('✅ GIVEN: EntitySelectionTool created');
    console.log('✅ AND: 3 entities placed on grid');
    console.log('✅ WHEN: User dragged selection box');
    console.log('✅ THEN: All 3 entities selected');
    console.log('✅ AND: Selected state visible');
    console.log('✅ WHEN: User deleted selected entities');
    console.log('✅ THEN: All entities removed');
    console.log('✅ AND: No entities remain');
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
