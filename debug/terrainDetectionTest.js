/**
 * Terrain Detection Test Helper
 * 
 * Console commands to test and verify terrain detection is working:
 * - testTerrainDetection() - Test all ants' terrain detection
 * - enableTerrainDebug() - Turn on terrain logging
 * - disableTerrainDebug() - Turn off terrain logging
 * - showAntTerrain(antIndex) - Show specific ant's terrain info
 */

/**
 * Enable terrain debug logging
 */
function enableTerrainDebug() {
  window.DEBUG_TERRAIN = true;
  console.log("✅ Terrain debug logging ENABLED");
  console.log("   Terrain changes will now be logged to console");
}

/**
 * Disable terrain debug logging
 */
function disableTerrainDebug() {
  window.DEBUG_TERRAIN = false;
  console.log("❌ Terrain debug logging DISABLED");
}

/**
 * Debug: Show what entity types are registered in SpatialGridManager
 */
function debugSpatialGridTypes() {
  console.log('\n═══════════════════════════════════════');
  console.log('🔍 SPATIAL GRID TYPE ANALYSIS');
  console.log('═══════════════════════════════════════\n');
  
  if (typeof spatialGridManager === 'undefined' || !spatialGridManager) {
    console.log('❌ SpatialGridManager not available');
    return;
  }
  
  // Get all entities
  const allEntities = spatialGridManager.getAllEntities();
  console.log(`📊 Total entities in grid: ${allEntities.length}`);
  
  // Count by type
  const typeCounts = {};
  allEntities.forEach(entity => {
    const type = entity._type || entity.type || 'Unknown';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });
  
  console.log('\n📋 Entities by type:');
  Object.keys(typeCounts).sort().forEach(type => {
    console.log(`  ${type}: ${typeCounts[type]}`);
  });
  
  // Test getEntitiesByType for each type
  console.log('\n🔎 Testing getEntitiesByType():');
  Object.keys(typeCounts).sort().forEach(type => {
    const entities = spatialGridManager.getEntitiesByType(type);
    console.log(`  ${type}: ${entities ? entities.length : 0} entities`);
  });
  
  // Check specific types we care about
  console.log('\n🎯 Checking specific types:');
  const ants = spatialGridManager.getEntitiesByType('Ant');
  const queens = spatialGridManager.getEntitiesByType('Queen');
  const resources = spatialGridManager.getEntitiesByType('Resource');
  const buildings = spatialGridManager.getEntitiesByType('Building');
  
  console.log(`  🐜 Ants: ${ants ? ants.length : 0}`);
  console.log(`  👑 Queens: ${queens ? queens.length : 0}`);
  console.log(`  📦 Resources: ${resources ? resources.length : 0}`);
  console.log(`  🏢 Buildings: ${buildings ? buildings.length : 0}`);
  
  console.log('\n═══════════════════════════════════════\n');
}

/**
 * Test terrain detection for all entities
 */
function testTerrainDetection() {
  console.log("\n╔════════════════════════════════════════╗");
  console.log("║   TERRAIN DETECTION SYSTEM TEST        ║");
  console.log("╚════════════════════════════════════════╝\n");
  
  // Check if systems are available
  console.log("📋 System Availability:");
  console.log("  ✓ mapManager:", typeof mapManager !== 'undefined' && mapManager ? "✅" : "❌");
  console.log("  ✓ g_activeMap:", typeof g_activeMap !== 'undefined' && g_activeMap ? "✅" : "❌");
  console.log("  ✓ TerrainController:", typeof TerrainController !== 'undefined' ? "✅" : "❌");
  console.log("  ✓ spatialGridManager:", typeof spatialGridManager !== 'undefined' && spatialGridManager ? "✅" : "❌");
  
  if (typeof mapManager !== 'undefined' && mapManager) {
    const activeMap = mapManager.getActiveMap();
    console.log("  ✓ Active Map:", activeMap ? `✅ (${activeMap._gridSizeX}x${activeMap._gridSizeY} chunks)` : "❌");
  }
  
  console.log("\n� Getting All Entities from SpatialGridManager:\n");
  
  // Get all entities from spatial grid
  let allEntities = [];
  if (typeof spatialGridManager !== 'undefined' && spatialGridManager) {
    // Get entities by type
    const ants = spatialGridManager.getEntitiesByType('Ant') || [];
    const resources = spatialGridManager.getEntitiesByType('Resource') || [];
    const buildings = spatialGridManager.getEntitiesByType('Building') || [];
    const queens = spatialGridManager.getEntitiesByType('Queen') || [];
    
    console.log(`Found entities:`);
    console.log(`  🐜 Ants: ${ants.length}`);
    console.log(`  👑 Queens: ${queens.length}`);
    console.log(`  📦 Resources: ${resources.length}`);
    console.log(`  🏢 Buildings: ${buildings.length}`);
    console.log();
    
    allEntities = [...ants, ...queens, ...resources, ...buildings];
    
    if (allEntities.length === 0) {
      console.log("❌ No entities found in SpatialGridManager");
      console.log("   Try spawning some ants or use fullTerrainTest()");
    } else {
      const testCount = Math.min(10, allEntities.length);
      console.log(`📊 Testing ${testCount} of ${allEntities.length} entities:\n`);
      
      for (let i = 0; i < testCount; i++) {
        const entity = allEntities[i];
        if (!entity) continue;
        
        const pos = entity.getPosition();
        const type = entity._type || 'Unknown';
        const terrain = entity.getCurrentTerrain ? entity.getCurrentTerrain() : 'N/A';
        const material = entity.getCurrentTileMaterial ? entity.getCurrentTileMaterial() : 'N/A';
        
        // Get tile directly via MapManager
        let tileCheck = "N/A";
        if (typeof mapManager !== 'undefined' && mapManager) {
          const tile = mapManager.getTileAtPosition(pos.x, pos.y);
          tileCheck = tile ? `Found (${tile.material || tile._materialSet || 'no material'})` : "Not found";
        }
        
        console.log(`${type} #${i}:`);
        console.log(`  Position: (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)})`);
        console.log(`  Terrain Type: ${terrain}`);
        console.log(`  Tile Material: ${material || 'null'}`);
        console.log(`  MapManager Check: ${tileCheck}`);
        console.log();
      }
    }
  } else {
    console.log("❌ SpatialGridManager not available");
  }
  
  console.log("═══════════════════════════════════════\n");
  console.log("💡 Tips:");
  console.log("  • Use enableTerrainDebug() to see real-time terrain updates");
  console.log("  • Use fullTerrainTest() for complete setup + testing");
  console.log("  • Move entities around to test terrain detection");
  console.log();
}

/**
 * Show detailed terrain info for a specific entity
 */
function showEntityTerrain(entityIndex) {
  if (typeof spatialGridManager === 'undefined' || !spatialGridManager) {
    console.error("❌ SpatialGridManager not available");
    return;
  }
  
  // Get all entities
  const ants = spatialGridManager.getEntitiesByType('Ant') || [];
  const queens = spatialGridManager.getEntitiesByType('Queen') || [];
  const resources = spatialGridManager.getEntitiesByType('Resource') || [];
  const buildings = spatialGridManager.getEntitiesByType('Building') || [];
  const allEntities = [...ants, ...queens, ...resources, ...buildings];
  
  if (entityIndex >= allEntities.length) {
    console.error(`❌ Entity #${entityIndex} not found (only ${allEntities.length} entities exist)`);
    return;
  }
  
  const entity = allEntities[entityIndex];
  if (!entity) {
    console.error(`❌ Entity #${entityIndex} is null`);
    return;
  }
  
  const type = entity._type || 'Unknown';
  console.log(`\n🔍 Detailed Terrain Info for ${type} #${entityIndex}:\n`);
  
  const pos = entity.getPosition();
  console.log(`Position: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)})`);
  console.log(`Type: ${type}`);
  
  // Terrain controller info
  const terrainController = entity.getController ? entity.getController('terrain') : null;
  if (terrainController) {
    console.log(`✅ TerrainController exists`);
    console.log(`  Current Terrain: ${terrainController.getCurrentTerrain()}`);
    console.log(`  Check Interval: ${terrainController._terrainCheckInterval}ms`);
    console.log(`  Cache Size: ${terrainController._terrainCache.size} entries`);
    
    // Force a terrain check
    console.log(`\n🔄 Forcing terrain detection...`);
    terrainController.forceTerrainCheck();
    console.log(`  Detected Terrain: ${terrainController.getCurrentTerrain()}`);
  } else {
    console.log(`❌ No TerrainController attached to this ${type}`);
  }
  
  // MapManager tile check
  if (typeof mapManager !== 'undefined' && mapManager) {
    console.log(`\n🗺️  MapManager Tile Query:`);
    const tile = mapManager.getTileAtPosition(pos.x, pos.y);
    if (tile) {
      console.log(`  ✅ Tile found`);
      console.log(`  Material: ${tile.material || tile._materialSet || 'unknown'}`);
      console.log(`  Tile Position: (${tile._x}, ${tile._y})`);
      console.log(`  Tile Properties:`, Object.keys(tile));
    } else {
      console.log(`  ❌ No tile found at this position`);
    }
  }
  
  // Grid coordinate conversion
  if (typeof g_activeMap !== 'undefined' && g_activeMap && g_activeMap.renderConversion) {
    console.log(`\n📐 Grid Coordinates:`);
    const gridPos = g_activeMap.renderConversion.convCanvasToPos([pos.x, pos.y]);
    const tileGridX = Math.floor(gridPos[0]);
    const tileGridY = Math.floor(gridPos[1]);
    console.log(`  Continuous: (${gridPos[0].toFixed(2)}, ${gridPos[1].toFixed(2)})`);
    console.log(`  Tile Index: (${tileGridX}, ${tileGridY})`);
    
    const chunkX = Math.floor(tileGridX / g_activeMap._chunkSize);
    const chunkY = Math.floor(tileGridY / g_activeMap._chunkSize);
    console.log(`  Chunk: (${chunkX}, ${chunkY})`);
  }
  
  console.log();
}

/**
 * Show detailed terrain info for a specific ant (legacy compatibility)
 */
function showAntTerrain(antIndex) {
  // Just redirect to the entity version with ants only
  if (typeof spatialGridManager === 'undefined' || !spatialGridManager) {
    console.error("❌ SpatialGridManager not available");
    return;
  }
  
  const ants = spatialGridManager.getEntitiesByType('Ant') || [];
  const queens = spatialGridManager.getEntitiesByType('Queen') || [];
  const allAnts = [...ants, ...queens];
  
  if (antIndex >= allAnts.length) {
    console.error(`❌ Ant #${antIndex} not found (only ${allAnts.length} ants exist)`);
    console.log(`💡 Try showEntityTerrain(${antIndex}) to see all entity types`);
    return;
  }
  
  const entity = allAnts[antIndex];
  if (!entity) {
    console.error(`❌ Ant #${antIndex} is null`);
    return;
  }
  
  const type = entity._type || 'Unknown';
  console.log(`\n🔍 Detailed Terrain Info for ${type} #${antIndex}:\n`);
  
  const pos = entity.getPosition();
  console.log(`Position: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)})`);
  
  // Terrain controller info
  const terrainController = entity.getController ? entity.getController('terrain') : null;
  if (terrainController) {
    console.log(`✅ TerrainController exists`);
    console.log(`  Current Terrain: ${terrainController.getCurrentTerrain()}`);
    console.log(`  Check Interval: ${terrainController._terrainCheckInterval}ms`);
    console.log(`  Cache Size: ${terrainController._terrainCache.size} entries`);
    
    // Force a terrain check
    console.log(`\n🔄 Forcing terrain detection...`);
    terrainController.forceTerrainCheck();
    console.log(`  Detected Terrain: ${terrainController.getCurrentTerrain()}`);
  } else {
    console.log(`❌ No TerrainController attached to this ant`);
  }
  
  // MapManager tile check
  if (typeof mapManager !== 'undefined' && mapManager) {
    console.log(`\n🗺️  MapManager Tile Query:`);
    const tile = mapManager.getTileAtPosition(pos.x, pos.y);
    if (tile) {
      console.log(`  ✅ Tile found`);
      console.log(`  Material: ${tile.material || tile._materialSet || 'unknown'}`);
      console.log(`  Tile Position: (${tile._x}, ${tile._y})`);
      console.log(`  Tile Properties:`, Object.keys(tile));
    } else {
      console.log(`  ❌ No tile found at this position`);
    }
  }
  
  // Grid coordinate conversion
  if (typeof g_activeMap !== 'undefined' && g_activeMap && g_activeMap.renderConversion) {
    console.log(`\n📐 Grid Coordinates:`);
    const gridPos = g_activeMap.renderConversion.convCanvasToPos([pos.x, pos.y]);
    const tileGridX = Math.floor(gridPos[0]);
    const tileGridY = Math.floor(gridPos[1]);
    console.log(`  Continuous: (${gridPos[0].toFixed(2)}, ${gridPos[1].toFixed(2)})`);
    console.log(`  Tile Index: (${tileGridX}, ${tileGridY})`);
    
    const chunkX = Math.floor(tileGridX / g_activeMap._chunkSize);
    const chunkY = Math.floor(tileGridY / g_activeMap._chunkSize);
    console.log(`  Chunk: (${chunkX}, ${chunkY})`);
  }
  
  console.log();
}

/**
 * Force all entities to check terrain NOW
 */
function forceAllTerrainChecks() {
  let count = 0;
  
  if (typeof spatialGridManager !== 'undefined' && spatialGridManager) {
    // Get all entities from spatial grid
    const ants = spatialGridManager.getEntitiesByType('Ant') || [];
    const queens = spatialGridManager.getEntitiesByType('Queen') || [];
    const resources = spatialGridManager.getEntitiesByType('Resource') || [];
    const buildings = spatialGridManager.getEntitiesByType('Building') || [];
    const allEntities = [...ants, ...queens, ...resources, ...buildings];
    
    allEntities.forEach(entity => {
      if (entity && entity.getController) {
        const terrainController = entity.getController('terrain');
        if (terrainController && typeof terrainController.forceTerrainCheck === 'function') {
          terrainController.forceTerrainCheck();
          count++;
        }
      }
    });
  }
  
  console.log(`✅ Forced terrain check on ${count} entities`);
}

/**
 * ALL-IN-ONE TERRAIN TEST
 * Enables debug, spawns ants, tests detection, shows results
 */
function fullTerrainTest() {
  console.log("\n╔════════════════════════════════════════╗");
  console.log("║   FULL TERRAIN DETECTION TEST          ║");
  console.log("╚════════════════════════════════════════╝\n");
  
  // Step 1: Enable debug logging
  console.log("📝 Step 1: Enabling terrain debug logging...");
  window.DEBUG_TERRAIN = true;
  console.log("   ✅ Debug logging enabled\n");
  
  // Step 2: Check entity count
  console.log("🎯 Step 2: Checking entities...");
  if (typeof spatialGridManager !== 'undefined' && spatialGridManager) {
    const ants = spatialGridManager.getEntitiesByType('Ant') || [];
    const queens = spatialGridManager.getEntitiesByType('Queen') || [];
    const resources = spatialGridManager.getEntitiesByType('Resource') || [];
    const buildings = spatialGridManager.getEntitiesByType('Building') || [];
    const total = ants.length + queens.length + resources.length + buildings.length;
    console.log(`   Found ${total} entities (${ants.length} ants, ${queens.length} queens, ${resources.length} resources, ${buildings.length} buildings)\n`);
  } else {
    console.log("   ⚠️  SpatialGridManager not available\n");
  }
  
  // Step 3: Force terrain detection
  console.log("🔍 Step 3: Forcing terrain detection...");
  forceAllTerrainChecks();
  console.log();
  
  // Step 4: Run main test
  console.log("📊 Step 4: Testing terrain detection...\n");
  testTerrainDetection();
  
  // Step 5: Summary
  console.log("\n╔════════════════════════════════════════╗");
  console.log("║   TEST COMPLETE                        ║");
  console.log("╚════════════════════════════════════════╝\n");
  console.log("✅ Terrain debug logging is NOW ENABLED");
  console.log("   You will see terrain changes in console as entities move\n");
  console.log("💡 Try these commands:");
  console.log("   • showEntityTerrain(0) - Detailed info for first entity");
  console.log("   • disableTerrainDebug() - Turn off logging");
  console.log();
}

// Auto-register functions globally
if (typeof window !== 'undefined') {
  window.testTerrainDetection = testTerrainDetection;
  window.enableTerrainDebug = enableTerrainDebug;
  window.disableTerrainDebug = disableTerrainDebug;
  window.showAntTerrain = showAntTerrain;
  window.showEntityTerrain = showEntityTerrain;
  window.forceAllTerrainChecks = forceAllTerrainChecks;
  window.fullTerrainTest = fullTerrainTest;
  window.debugSpatialGridTypes = debugSpatialGridTypes;
  
  console.log("🧪 Terrain Detection Test Helper loaded!");
  console.log("   Quick start: fullTerrainTest()");
  console.log("   Debug types: debugSpatialGridTypes()");
  console.log("   Commands: testTerrainDetection(), showEntityTerrain(index), enableTerrainDebug()");
}
