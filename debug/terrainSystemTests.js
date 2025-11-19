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
}

/**
 * Disable terrain debug logging
 */
function disableTerrainDebug() {
  window.DEBUG_TERRAIN = false;
}

/**
 * Test MapManager is available and has active map
 */
function testMapManager() {
  
  if (typeof mapManager === 'undefined') {
    console.error("❌ MapManager not available");
    return false;
  }
  
  const info = mapManager.getInfo();
  
  const activeMap = mapManager.getActiveMap();
  if (activeMap) {
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
  
  // Test MapManager
  if (typeof mapManager !== 'undefined') {
    const tile = mapManager.getTileAtPosition(x, y);
    if (tile) {
      // Tile found
    } else {
      console.error("❌ MapManager.getTileAtPosition returned null");
    }
    
    const material = mapManager.getTileMaterial(x, y);
  }
  
  // Test g_activeMap fallback
  if (typeof g_activeMap !== 'undefined') {
  } else {
    console.warn("⚠️ g_activeMap not available");
  }
}

/**
 * Test Entity terrain methods
 */
function testEntityTerrainMethods() {
  
  // Find queen or first ant
  let testEntity = null;
  if (typeof queenAnt !== 'undefined') {
    testEntity = queenAnt;
  } else if (typeof g_ants !== 'undefined' && g_ants.length > 0) {
    testEntity = g_ants[0];
  }
  
  if (!testEntity) {
    console.error("❌ No entity available for testing");
    return false;
  }
  
  const pos = testEntity.getPosition();
  
  // Test getCurrentTerrain
  if (typeof testEntity.getCurrentTerrain === 'function') {
    const terrain = testEntity.getCurrentTerrain();
  } else {
    console.error("❌ getCurrentTerrain() not available");
  }
  
  // Test getCurrentTileMaterial
  if (typeof testEntity.getCurrentTileMaterial === 'function') {
    const material = testEntity.getCurrentTileMaterial();
  } else {
    console.error("❌ getCurrentTileMaterial() not available");
  }
  
  return true;
}

/**
 * Test TerrainController directly
 */
function testTerrainController() {
  
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
  
  
  // Force a terrain check
  const currentTerrain = terrainController.getCurrentTerrain();
  
  // Trigger detection
  terrainController.detectAndUpdateTerrain();
  
  return true;
}

/**
 * Monitor entity terrain for a few seconds
 */
function monitorEntityTerrain(durationSeconds = 5) {
  
  let testEntity = queenAnt || (g_ants && g_ants[0]);
  if (!testEntity) {
    console.error("❌ No entity available");
    return;
  }
  
  enableTerrainDebug();
  
  let checks = 0;
  const interval = setInterval(() => {
    const pos = testEntity.getPosition();
    const terrain = testEntity.getCurrentTerrain();
    const material = testEntity.getCurrentTileMaterial();
    
    
    checks++;
    if (checks >= durationSeconds) {
      clearInterval(interval);
      disableTerrainDebug();
    }
  }, 1000);
}

/**
 * Run complete terrain system test
 */
function testTerrainSystem() {
  
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
  if (allPassed) {
  } else {
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
  
  
  const controller = entity._controllers?.get('terrain');
  if (controller) {
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
  
}