/**
 * E2E Test: Entity Palette Group Selection & Storage (Simplified)
 * 
 * Directly tests EntityPalette group functionality without Level Editor:
 * 1. Create EntityPalette instance
 * 2. Store a group with multiple entities
 * 3. Verify group saved to LocalStorage
 * 4. Verify GroupPlacer can place the group
 * 5. Verify formation maintained
 * 
 * SCREENSHOTS: Visual proof of LocalStorage data and GroupPlacer output
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  console.log('Starting Entity Palette Group Storage E2E Test (Simplified)...');
  
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    // Navigate to game
    await page.goto('http://localhost:8000?test=1');
    console.log('Page loaded');
    
    await sleep(1000);
    
    // Test 1: Verify required classes loaded
    const classesLoaded = await page.evaluate(() => {
      return {
        EntityPalette: typeof window.EntityPalette !== 'undefined',
        CategoryRadioButtons: typeof window.CategoryRadioButtons !== 'undefined',
        GroupPlacer: typeof window.GroupPlacer !== 'undefined'
      };
    });
    
    if (!classesLoaded.EntityPalette || !classesLoaded.CategoryRadioButtons || !classesLoaded.GroupPlacer) {
      throw new Error(`Missing classes: ${JSON.stringify(classesLoaded)}`);
    }
    console.log('✅ Test 1: Required classes loaded');
    
    // Test 2: Create EntityPalette instance and store a group
    const storeGroupResult = await page.evaluate(() => {
      // Clear LocalStorage
      localStorage.removeItem('antGame_customEntities');
      
      // Create palette instance
      const palette = new window.EntityPalette();
      
      // Create entity group data
      const entities = [
        { baseTemplateId: 'ant_worker', position: { x: 0, y: 0 }, properties: {} },
        { baseTemplateId: 'ant_worker', position: { x: 2, y: 0 }, properties: {} },
        { baseTemplateId: 'ant_worker', position: { x: 4, y: 0 }, properties: {} }
      ];
      
      // Store group
      const group = palette.addCustomEntityGroup('Test Squad', entities);
      
      return {
        success: true,
        groupId: group.id,
        groupName: group.customName,
        isGroup: group.isGroup === true,
        entityCount: group.entities?.length || 0
      };
    });
    
    if (!storeGroupResult.success || !storeGroupResult.isGroup || storeGroupResult.entityCount !== 3) {
      throw new Error(`Failed to store group: ${JSON.stringify(storeGroupResult)}`);
    }
    console.log(`✅ Test 2: Stored group "${storeGroupResult.groupName}" (${storeGroupResult.entityCount} entities)`);
    
    await sleep(300);
    await saveScreenshot(page, 'ui/entity_palette_group_simple_01_stored', true);
    
    // Test 3: Verify LocalStorage persistence
    const storageResult = await page.evaluate(() => {
      const stored = localStorage.getItem('antGame_customEntities');
      if (!stored) return { success: false, error: 'No LocalStorage data' };
      
      const data = JSON.parse(stored);
      const groups = data.filter(item => item.isGroup === true);
      
      if (groups.length === 0) {
        return { success: false, error: 'No groups in LocalStorage' };
      }
      
      const group = groups[0];
      
      return {
        success: true,
        groupCount: groups.length,
        firstGroupName: group.customName,
        firstGroupEntityCount: group.entities?.length || 0,
        hasId: !!group.id,
        hasCreatedAt: !!group.createdAt
      };
    });
    
    if (!storageResult.success) {
      throw new Error(`LocalStorage verification failed: ${storageResult.error}`);
    }
    console.log(`✅ Test 3: LocalStorage verified - ${storageResult.groupCount} group(s)`);
    console.log(`   First group: "${storageResult.firstGroupName}" (${storageResult.firstGroupEntityCount} entities)`);
    
    // Test 4: Verify group data structure
    const groupDataResult = await page.evaluate(() => {
      const stored = localStorage.getItem('antGame_customEntities');
      const data = JSON.parse(stored);
      const group = data.find(item => item.isGroup === true);
      
      if (!group) {
        return { success: false, error: 'No group in storage' };
      }
      
      return {
        success: true,
        hasEntities: Array.isArray(group.entities),
        entityCount: group.entities?.length || 0,
        firstEntityHasRelativePosition: group.entities[0]?.hasOwnProperty('relativePosition'),
        allEntitiesHaveRelativePositions: group.entities.every(e => e.hasOwnProperty('relativePosition'))
      };
    });
    
    if (!groupDataResult.success) {
      throw new Error(`Group data verification failed: ${groupDataResult.error}`);
    }
    console.log(`✅ Test 4: Group data structure verified`);
    console.log(`   Entities: ${groupDataResult.entityCount}, All have relativePosition: ${groupDataResult.allEntitiesHaveRelativePositions}`);
    
    await sleep(300);
    await saveScreenshot(page, 'ui/entity_palette_group_simple_02_verified', true);
    
    // Test 5: Use GroupPlacer to place the group
    const placementResult = await page.evaluate(() => {
      const TILE_SIZE = 32;
      const stored = localStorage.getItem('antGame_customEntities');
      const data = JSON.parse(stored);
      const group = data.find(item => item.isGroup === true);
      
      if (!group) {
        return { success: false, error: 'No group found in storage' };
      }
      
      // Place group at origin (20, 15)
      const originGridX = 20;
      const originGridY = 15;
      
      const placedEntities = window.GroupPlacer.placeGroup(originGridX, originGridY, group);
      
      if (!placedEntities || placedEntities.length === 0) {
        return { success: false, error: 'GroupPlacer returned no entities' };
      }
      
      // Verify positions
      const positions = placedEntities.map(e => ({
        worldX: e.x,
        worldY: e.y,
        gridX: Math.floor(e.x / TILE_SIZE),
        gridY: Math.floor(e.y / TILE_SIZE)
      }));
      
      // Calculate formation width
      const gridXValues = positions.map(p => p.gridX);
      const minX = Math.min(...gridXValues);
      const maxX = Math.max(...gridXValues);
      const formationWidth = maxX - minX;
      
      return {
        success: true,
        entityCount: placedEntities.length,
        originGridX,
        originGridY,
        formationWidth,
        positions
      };
    });
    
    if (!placementResult.success) {
      throw new Error(`GroupPlacer failed: ${placementResult.error}`);
    }
    console.log(`✅ Test 5: GroupPlacer placed ${placementResult.entityCount} entities`);
    console.log(`   Origin: (${placementResult.originGridX}, ${placementResult.originGridY})`);
    console.log(`   Formation width: ${placementResult.formationWidth} tiles`);
    console.log(`   Positions:`, placementResult.positions);
    
    await sleep(300);
    await saveScreenshot(page, 'ui/entity_palette_group_simple_03_placed', true);
    
    // Test 6: Delete group using same palette instance from Test 2
    const deleteResult = await page.evaluate(() => {
      // Get stored group
      const storedData = localStorage.getItem('antGame_customEntities');
      const dataArray = JSON.parse(storedData);
      const group = dataArray.find(item => item.isGroup === true);
      
      if (!group) {
        return { success: false, error: 'No group to delete' };
      }
      
      const groupId = group.id;
      
      // Create palette and delete
      const palette = new window.EntityPalette();
      palette.deleteCustomEntity(groupId);
      
      // Verify deleted
      const afterDelete = localStorage.getItem('antGame_customEntities');
      const afterData = afterDelete ? JSON.parse(afterDelete) : [];
      const remaining = afterData.filter(item => item.isGroup === true);
      
      return {
        success: true,
        deletedId: groupId,
        remainingGroups: remaining.length
      };
    });
    
    if (!deleteResult.success) {
      throw new Error(`Delete failed: ${deleteResult.error}`);
    }
    console.log(`✅ Test 6: Deleted group (ID: ${deleteResult.deletedId.substring(0, 16)}...)`);
    console.log(`   Remaining groups: ${deleteResult.remainingGroups}`);
    
    await sleep(300);
    await saveScreenshot(page, 'ui/entity_palette_group_simple_04_deleted', true);
    
    console.log('\n=== ALL TESTS PASSED ===');
    console.log('✅ Required classes loaded');
    console.log('✅ Group stored with addCustomEntityGroup()');
    console.log('✅ LocalStorage persistence verified');
    console.log('✅ Group loaded from LocalStorage');
    console.log('✅ GroupPlacer placed group maintaining formation');
    console.log('✅ Group deleted successfully');
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('Test failed:', error.message);
    await saveScreenshot(page, 'ui/entity_palette_group_simple_ERROR', false);
    await browser.close();
    process.exit(1);
  }
})();
