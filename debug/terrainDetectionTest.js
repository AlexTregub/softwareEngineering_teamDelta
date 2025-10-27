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
  logNormal("✅ Terrain debug logging ENABLED");
  logNormal("   Terrain changes will now be logged to console");
}

/**
 * Disable terrain debug logging
 */
function disableTerrainDebug() {
  window.DEBUG_TERRAIN = false;
  logNormal("❌ Terrain debug logging DISABLED");
}

/**
 * Debug: Show what entity types are registered in SpatialGridManager
 */
function debugSpatialGridTypes() {
  logNormal('\n═══════════════════════════════════════');
  logNormal('🔍 SPATIAL GRID TYPE ANALYSIS');
  logNormal('═══════════════════════════════════════\n');
  
  if (typeof spatialGridManager === 'undefined' || !spatialGridManager) {
    logNormal('❌ SpatialGridManager not available');
    return;
  }
  
  // Get all entities
  const allEntities = spatialGridManager.getAllEntities();
  logNormal(`📊 Total entities in grid: ${allEntities.length}`);
  
  // Count by type
  const typeCounts = {};
  allEntities.forEach(entity => {
    const type = entity._type || entity.type || 'Unknown';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });
  
  logNormal('\n📋 Entities by type:');
  Object.keys(typeCounts).sort().forEach(type => {
    logNormal(`  ${type}: ${typeCounts[type]}`);
  });
  
  // Test getEntitiesByType for each type
  logNormal('\n🔎 Testing getEntitiesByType():');
  Object.keys(typeCounts).sort().forEach(type => {
    const entities = spatialGridManager.getEntitiesByType(type);
    logNormal(`  ${type}: ${entities ? entities.length : 0} entities`);
  });
  
  // Check specific types we care about
  logNormal('\n🎯 Checking specific types:');
  const ants = spatialGridManager.getEntitiesByType('Ant');
  const queens = spatialGridManager.getEntitiesByType('Queen');
  const resources = spatialGridManager.getEntitiesByType('Resource');
  const buildings = spatialGridManager.getEntitiesByType('Building');
  
  logNormal(`  🐜 Ants: ${ants ? ants.length : 0}`);
  logNormal(`  👑 Queens: ${queens ? queens.length : 0}`);
  logNormal(`  📦 Resources: ${resources ? resources.length : 0}`);
  logNormal(`  🏢 Buildings: ${buildings ? buildings.length : 0}`);
  
  logNormal('\n═══════════════════════════════════════\n');
}

/**
 * Test terrain detection for all entities
 */
function testTerrainDetection() {
  logNormal("\n╔════════════════════════════════════════╗");
  logNormal("║   TERRAIN DETECTION SYSTEM TEST        ║");
  logNormal("╚════════════════════════════════════════╝\n");
  
  // Check if systems are available
  logNormal("📋 System Availability:");
  logNormal("  ✓ mapManager:", typeof mapManager !== 'undefined' && mapManager ? "✅" : "❌");
  logNormal("  ✓ g_activeMap:", typeof g_activeMap !== 'undefined' && g_activeMap ? "✅" : "❌");
  logNormal("  ✓ TerrainController:", typeof TerrainController !== 'undefined' ? "✅" : "❌");
  logNormal("  ✓ spatialGridManager:", typeof spatialGridManager !== 'undefined' && spatialGridManager ? "✅" : "❌");
  
  if (typeof mapManager !== 'undefined' && mapManager) {
    const activeMap = mapManager.getActiveMap();
    logNormal("  ✓ Active Map:", activeMap ? `✅ (${activeMap._gridSizeX}x${activeMap._gridSizeY} chunks)` : "❌");
  }
  
  logNormal("\n� Getting All Entities from SpatialGridManager:\n");
  
  // Get all entities from spatial grid
  let allEntities = [];
  if (typeof spatialGridManager !== 'undefined' && spatialGridManager) {
    // Get entities by type
    const ants = spatialGridManager.getEntitiesByType('Ant') || [];
    const resources = spatialGridManager.getEntitiesByType('Resource') || [];
    const buildings = spatialGridManager.getEntitiesByType('Building') || [];
    const queens = spatialGridManager.getEntitiesByType('Queen') || [];
    
    logNormal(`Found entities:`);
    logNormal(`  🐜 Ants: ${ants.length}`);
    logNormal(`  👑 Queens: ${queens.length}`);
    logNormal(`  📦 Resources: ${resources.length}`);
    logNormal(`  🏢 Buildings: ${buildings.length}`);
    logNormal();
    
    allEntities = [...ants, ...queens, ...resources, ...buildings];
    
    if (allEntities.length === 0) {
      logNormal("❌ No entities found in SpatialGridManager");
      logNormal("   Try spawning some ants or use fullTerrainTest()");
    } else {
      const testCount = Math.min(10, allEntities.length);
      logNormal(`📊 Testing ${testCount} of ${allEntities.length} entities:\n`);
      
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
        
        logNormal(`${type} #${i}:`);
        logNormal(`  Position: (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)})`);
        logNormal(`  Terrain Type: ${terrain}`);
        logNormal(`  Tile Material: ${material || 'null'}`);
        logNormal(`  MapManager Check: ${tileCheck}`);
        logNormal();
      }
    }
  } else {
    logNormal("❌ SpatialGridManager not available");
  }
  
  logNormal("═══════════════════════════════════════\n");
  logNormal("💡 Tips:");
  logNormal("  • Use enableTerrainDebug() to see real-time terrain updates");
  logNormal("  • Use fullTerrainTest() for complete setup + testing");
  logNormal("  • Move entities around to test terrain detection");
  logNormal();
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
  logNormal(`\n🔍 Detailed Terrain Info for ${type} #${entityIndex}:\n`);
  
  const pos = entity.getPosition();
  logNormal(`Position: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)})`);
  logNormal(`Type: ${type}`);
  
  // Terrain controller info
  const terrainController = entity.getController ? entity.getController('terrain') : null;
  if (terrainController) {
    logNormal(`✅ TerrainController exists`);
    logNormal(`  Current Terrain: ${terrainController.getCurrentTerrain()}`);
    logNormal(`  Check Interval: ${terrainController._terrainCheckInterval}ms`);
    logNormal(`  Cache Size: ${terrainController._terrainCache.size} entries`);
    
    // Force a terrain check
    logNormal(`\n🔄 Forcing terrain detection...`);
    terrainController.forceTerrainCheck();
    logNormal(`  Detected Terrain: ${terrainController.getCurrentTerrain()}`);
  } else {
    logNormal(`❌ No TerrainController attached to this ${type}`);
  }
  
  // MapManager tile check
  if (typeof mapManager !== 'undefined' && mapManager) {
    logNormal(`\n🗺️  MapManager Tile Query:`);
    const tile = mapManager.getTileAtPosition(pos.x, pos.y);
    if (tile) {
      logNormal(`  ✅ Tile found`);
      logNormal(`  Material: ${tile.material || tile._materialSet || 'unknown'}`);
      logNormal(`  Tile Position: (${tile._x}, ${tile._y})`);
      logNormal(`  Tile Properties:`, Object.keys(tile));
    } else {
      logNormal(`  ❌ No tile found at this position`);
    }
  }
  
  // Grid coordinate conversion
  if (typeof g_activeMap !== 'undefined' && g_activeMap && g_activeMap.renderConversion) {
    logNormal(`\n📐 Grid Coordinates:`);
    const gridPos = g_activeMap.renderConversion.convCanvasToPos([pos.x, pos.y]);
    const tileGridX = Math.floor(gridPos[0]);
    const tileGridY = Math.floor(gridPos[1]);
    logNormal(`  Continuous: (${gridPos[0].toFixed(2)}, ${gridPos[1].toFixed(2)})`);
    logNormal(`  Tile Index: (${tileGridX}, ${tileGridY})`);
    
    const chunkX = Math.floor(tileGridX / g_activeMap._chunkSize);
    const chunkY = Math.floor(tileGridY / g_activeMap._chunkSize);
    logNormal(`  Chunk: (${chunkX}, ${chunkY})`);
  }
  
  logNormal();
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
    logNormal(`💡 Try showEntityTerrain(${antIndex}) to see all entity types`);
    return;
  }
  
  const entity = allAnts[antIndex];
  if (!entity) {
    console.error(`❌ Ant #${antIndex} is null`);
    return;
  }
  
  const type = entity._type || 'Unknown';
  logNormal(`\n🔍 Detailed Terrain Info for ${type} #${antIndex}:\n`);
  
  const pos = entity.getPosition();
  logNormal(`Position: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)})`);
  
  // Terrain controller info
  const terrainController = entity.getController ? entity.getController('terrain') : null;
  if (terrainController) {
    logNormal(`✅ TerrainController exists`);
    logNormal(`  Current Terrain: ${terrainController.getCurrentTerrain()}`);
    logNormal(`  Check Interval: ${terrainController._terrainCheckInterval}ms`);
    logNormal(`  Cache Size: ${terrainController._terrainCache.size} entries`);
    
    // Force a terrain check
    logNormal(`\n🔄 Forcing terrain detection...`);
    terrainController.forceTerrainCheck();
    logNormal(`  Detected Terrain: ${terrainController.getCurrentTerrain()}`);
  } else {
    logNormal(`❌ No TerrainController attached to this ant`);
  }
  
  // MapManager tile check
  if (typeof mapManager !== 'undefined' && mapManager) {
    logNormal(`\n🗺️  MapManager Tile Query:`);
    const tile = mapManager.getTileAtPosition(pos.x, pos.y);
    if (tile) {
      logNormal(`  ✅ Tile found`);
      logNormal(`  Material: ${tile.material || tile._materialSet || 'unknown'}`);
      logNormal(`  Tile Position: (${tile._x}, ${tile._y})`);
      logNormal(`  Tile Properties:`, Object.keys(tile));
    } else {
      logNormal(`  ❌ No tile found at this position`);
    }
  }
  
  // Grid coordinate conversion
  if (typeof g_activeMap !== 'undefined' && g_activeMap && g_activeMap.renderConversion) {
    logNormal(`\n📐 Grid Coordinates:`);
    const gridPos = g_activeMap.renderConversion.convCanvasToPos([pos.x, pos.y]);
    const tileGridX = Math.floor(gridPos[0]);
    const tileGridY = Math.floor(gridPos[1]);
    logNormal(`  Continuous: (${gridPos[0].toFixed(2)}, ${gridPos[1].toFixed(2)})`);
    logNormal(`  Tile Index: (${tileGridX}, ${tileGridY})`);
    
    const chunkX = Math.floor(tileGridX / g_activeMap._chunkSize);
    const chunkY = Math.floor(tileGridY / g_activeMap._chunkSize);
    logNormal(`  Chunk: (${chunkX}, ${chunkY})`);
  }
  
  logNormal();
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
  
  logNormal(`✅ Forced terrain check on ${count} entities`);
}

/**
 * ALL-IN-ONE TERRAIN TEST
 * Enables debug, spawns ants, tests detection, shows results
 */
function fullTerrainTest() {
  logNormal("\n╔════════════════════════════════════════╗");
  logNormal("║   FULL TERRAIN DETECTION TEST          ║");
  logNormal("╚════════════════════════════════════════╝\n");
  
  // Step 1: Enable debug logging
  logNormal("📝 Step 1: Enabling terrain debug logging...");
  window.DEBUG_TERRAIN = true;
  logNormal("   ✅ Debug logging enabled\n");
  
  // Step 2: Check entity count
  logNormal("🎯 Step 2: Checking entities...");
  if (typeof spatialGridManager !== 'undefined' && spatialGridManager) {
    const ants = spatialGridManager.getEntitiesByType('Ant') || [];
    const queens = spatialGridManager.getEntitiesByType('Queen') || [];
    const resources = spatialGridManager.getEntitiesByType('Resource') || [];
    const buildings = spatialGridManager.getEntitiesByType('Building') || [];
    const total = ants.length + queens.length + resources.length + buildings.length;
    logNormal(`   Found ${total} entities (${ants.length} ants, ${queens.length} queens, ${resources.length} resources, ${buildings.length} buildings)\n`);
  } else {
    logNormal("   ⚠️  SpatialGridManager not available\n");
  }
  
  // Step 3: Force terrain detection
  logNormal("🔍 Step 3: Forcing terrain detection...");
  forceAllTerrainChecks();
  logNormal();
  
  // Step 4: Run main test
  logNormal("📊 Step 4: Testing terrain detection...\n");
  testTerrainDetection();
  
  // Step 5: Summary
  logNormal("\n╔════════════════════════════════════════╗");
  logNormal("║   TEST COMPLETE                        ║");
  logNormal("╚════════════════════════════════════════╝\n");
  logNormal("✅ Terrain debug logging is NOW ENABLED");
  logNormal("   You will see terrain changes in console as entities move\n");
  logNormal("💡 Try these commands:");
  logNormal("   • showEntityTerrain(0) - Detailed info for first entity");
  logNormal("   • disableTerrainDebug() - Turn off logging");
  logNormal();
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
  
  logNormal("🧪 Terrain Detection Test Helper loaded!");
  logNormal("   Quick start: fullTerrainTest()");
  logNormal("   Debug types: debugSpatialGridTypes()");
  logNormal("   Commands: testTerrainDetection(), showEntityTerrain(index), enableTerrainDebug()");
}
