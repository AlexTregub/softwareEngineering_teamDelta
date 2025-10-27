/**
 * Terrain System Test Suite
 * =========================
 * Run these functions in the browser console to test terrain detection
 * 
 * Quick Start:
 * 1. Open browser console (F12)
 * 2. Type: testTerrainSystem()
 * 3. Watch for output
 */

/**
 * Enable terrain debug logging
 */
function enableTerrainDebug() {
  window.DEBUG_TERRAIN = true;
  logNormal("✅ Terrain debugging enabled");
  logNormal("Terrain changes will now be logged to console");
}

/**
 * Disable terrain debug logging
 */
function disableTerrainDebug() {
  window.DEBUG_TERRAIN = false;
  logNormal("❌ Terrain debugging disabled");
}

/**
 * Test MapManager is available and has active map
 */
function testMapManager() {
  logNormal("\n=== Testing MapManager ===");
  
  if (typeof mapManager === 'undefined') {
    console.error("❌ MapManager not available");
    return false;
  }
  
  const info = mapManager.getInfo();
  logNormal("✅ MapManager available:", info);
  
  const activeMap = mapManager.getActiveMap();
  if (activeMap) {
    logNormal("✅ Active map:", mapManager.getActiveMapId());
    return true;
  } else {
    console.error("❌ No active map set");
    return false;
  }
}

/**
 * Test terrain tile queries at specific position
 */
function testTerrainQuery(x = 400, y = 400) {
  logNormal(`\n=== Testing Terrain Query at (${x}, ${y}) ===`);
  
  // Test MapManager
  if (typeof mapManager !== 'undefined') {
    const tile = mapManager.getTileAtPosition(x, y);
    if (tile) {
      logNormal("✅ MapManager.getTileAtPosition:", {
        material: tile.material,
        weight: tile.weight,
        entities: tile.entities?.length || 0
      });
    } else {
      console.error("❌ MapManager.getTileAtPosition returned null");
    }
    
    const material = mapManager.getTileMaterial(x, y);
    logNormal("Material:", material);
  }
  
  // Test g_activeMap fallback
  if (typeof g_activeMap !== 'undefined') {
    logNormal("✅ g_activeMap is available");
  } else {
    console.warn("⚠️ g_activeMap not available");
  }
}

/**
 * Test Entity terrain methods
 */
function testEntityTerrainMethods() {
  logNormal("\n=== Testing Entity Terrain Methods ===");
  
  // Find queen or first ant
  let testEntity = null;
  if (typeof queenAnt !== 'undefined') {
    testEntity = queenAnt;
    logNormal("Testing with Queen");
  } else if (typeof g_ants !== 'undefined' && g_ants.length > 0) {
    testEntity = g_ants[0];
    logNormal("Testing with first ant");
  }
  
  if (!testEntity) {
    console.error("❌ No entity available for testing");
    return false;
  }
  
  const pos = testEntity.getPosition();
  logNormal("Entity position:", pos);
  
  // Test getCurrentTerrain
  if (typeof testEntity.getCurrentTerrain === 'function') {
    const terrain = testEntity.getCurrentTerrain();
    logNormal("✅ getCurrentTerrain():", terrain);
  } else {
    console.error("❌ getCurrentTerrain() not available");
  }
  
  // Test getCurrentTileMaterial
  if (typeof testEntity.getCurrentTileMaterial === 'function') {
    const material = testEntity.getCurrentTileMaterial();
    logNormal("✅ getCurrentTileMaterial():", material);
  } else {
    console.error("❌ getCurrentTileMaterial() not available");
  }
  
  return true;
}

/**
 * Test TerrainController directly
 */
function testTerrainController() {
  logNormal("\n=== Testing TerrainController ===");
  
  let testEntity = queenAnt || (g_ants && g_ants[0]);
  if (!testEntity) {
    console.error("❌ No entity available");
    return false;
  }
  
  const terrainController = testEntity._controllers?.get?.('terrain');
  if (!terrainController) {
    console.error("❌ TerrainController not found on entity");
    return false;
  }
  
  logNormal("✅ TerrainController found");
  
  // Force a terrain check
  const currentTerrain = terrainController.getCurrentTerrain();
  logNormal("Current terrain:", currentTerrain);
  
  // Trigger detection
  terrainController.detectAndUpdateTerrain();
  logNormal("✅ Manual terrain detection triggered");
  
  return true;
}

/**
 * Monitor entity terrain for a few seconds
 */
function monitorEntityTerrain(durationSeconds = 5) {
  logNormal(`\n=== Monitoring Entity Terrain for ${durationSeconds} seconds ===`);
  
  let testEntity = queenAnt || (g_ants && g_ants[0]);
  if (!testEntity) {
    console.error("❌ No entity available");
    return;
  }
  
  logNormal("Enable DEBUG_TERRAIN and move the entity around...");
  enableTerrainDebug();
  
  let checks = 0;
  const interval = setInterval(() => {
    const pos = testEntity.getPosition();
    const terrain = testEntity.getCurrentTerrain();
    const material = testEntity.getCurrentTileMaterial();
    
    logNormal(`[${checks}s] Position: (${Math.floor(pos.x)}, ${Math.floor(pos.y)}) | Terrain: ${terrain} | Material: ${material}`);
    
    checks++;
    if (checks >= durationSeconds) {
      clearInterval(interval);
      logNormal("✅ Monitoring complete");
      disableTerrainDebug();
    }
  }, 1000);
}

/**
 * Run complete terrain system test
 */
function testTerrainSystem() {
  logNormal("╔═══════════════════════════════════════╗");
  logNormal("║   TERRAIN SYSTEM TEST SUITE           ║");
  logNormal("╚═══════════════════════════════════════╝");
  
  let allPassed = true;
  
  // Test 1: MapManager
  if (!testMapManager()) {
    allPassed = false;
  }
  
  // Test 2: Terrain queries
  testTerrainQuery(400, 400);
  
  // Test 3: Entity methods
  if (!testEntityTerrainMethods()) {
    allPassed = false;
  }
  
  // Test 4: TerrainController
  if (!testTerrainController()) {
    allPassed = false;
  }
  
  // Summary
  logNormal("\n╔═══════════════════════════════════════╗");
  if (allPassed) {
    logNormal("║   ✅ ALL TESTS PASSED                 ║");
    logNormal("╚═══════════════════════════════════════╝");
    logNormal("\nNext steps:");
    logNormal("1. Run: monitorEntityTerrain(5) to watch live updates");
    logNormal("2. Run: enableTerrainDebug() to see all terrain changes");
    logNormal("3. Move entities around to see terrain detection in action");
  } else {
    logNormal("║   ❌ SOME TESTS FAILED                ║");
    logNormal("╚═══════════════════════════════════════╝");
    logNormal("\nCheck errors above for details");
  }
  
  return allPassed;
}

/**
 * Quick test of specific entity
 */
function testEntityTerrain(entity) {
  if (!entity) {
    console.error("Usage: testEntityTerrain(entity)");
    return;
  }
  
  logNormal("Testing entity:", entity._type, entity._id);
  logNormal("Position:", entity.getPosition());
  logNormal("Current terrain:", entity.getCurrentTerrain());
  logNormal("Tile material:", entity.getCurrentTileMaterial());
  
  const controller = entity._controllers?.get('terrain');
  if (controller) {
    logNormal("TerrainController current terrain:", controller.getCurrentTerrain());
  }
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.testTerrainSystem = testTerrainSystem;
  window.testMapManager = testMapManager;
  window.testTerrainQuery = testTerrainQuery;
  window.testEntityTerrainMethods = testEntityTerrainMethods;
  window.testTerrainController = testTerrainController;
  window.monitorEntityTerrain = monitorEntityTerrain;
  window.enableTerrainDebug = enableTerrainDebug;
  window.disableTerrainDebug = disableTerrainDebug;
  window.testEntityTerrain = testEntityTerrain;
  
  logNormal("Terrain test suite loaded. Type 'testTerrainSystem()' to run tests.");
}
