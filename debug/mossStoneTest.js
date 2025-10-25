/**
 * Moss & Stone Level Quick Test
 * 
 * Tests the custom moss/stone column level functionality
 */

/**
 * Quick test of moss/stone level generation and terrain detection
 * 
 * Usage: testMossStoneLevel()
 */
window.testMossStoneLevel = function() {
  console.log("🏛️ Testing Moss & Stone Level");
  console.log("==============================");
  
  // Check if custom levels module is loaded
  if (typeof createMossStoneColumnLevel === 'undefined') {
    console.error("❌ customLevels.js not loaded!");
    return;
  }
  
  console.log("✅ Custom levels module loaded");
  
  // Check if MapManager is available
  if (typeof mapManager === 'undefined') {
    console.error("❌ MapManager not available!");
    return;
  }
  
  console.log("✅ MapManager available");
  
  // Load the moss/stone level
  console.log("📦 Creating moss/stone level...");
  const success = loadMossStoneLevel();
  
  if (!success) {
    console.error("❌ Failed to load moss/stone level!");
    return;
  }
  
  console.log("✅ Moss/stone level created and registered as 'mossStone'");
  
  // Verify the level is registered
  const mossStoneMap = mapManager.getMap('mossStone');
  if (!mossStoneMap) {
    console.error("❌ Level not found in MapManager!");
    return;
  }
  
  console.log("✅ Level found in MapManager");
  
  // Check a few tiles to verify pattern
  console.log("");
  console.log("🔍 Checking tile pattern:");
  
  // Sample some tiles at different X positions
  for (let x = 0; x < 10; x++) {
    const tile = mossStoneMap.getTileAtPosition(x * TILE_SIZE + 16, 100);
    if (tile) {
      const material = tile._materialSet;
      const expectedMaterial = (x % 2 === 0) ? 'moss_0' : 'stone';
      const match = material === expectedMaterial ? '✅' : '❌';
      
      console.log(`  Column ${x}: ${material} (expected: ${expectedMaterial}) ${match}`);
    }
  }
  
  console.log("");
  console.log("✅ Moss & Stone Level Test Complete!");
  console.log("");
  console.log("💡 Next steps:");
  console.log("   1. Click 'Moss & Stone Level' button on main menu");
  console.log("   2. Spawn some ants");
  console.log("   3. Watch them move between moss (🟫 30%) and stone (🪨 80%) columns");
  console.log("   4. Use testTerrainIndicators() to cycle through terrain types");
  console.log("   5. Use showAllTerrainEffects() to see all indicators at once");
};

/**
 * Verify terrain mappings for moss and stone
 * 
 * Usage: verifyTerrainMappings()
 */
window.verifyTerrainMappings = function() {
  console.log("🗺️ Verifying Terrain Mappings");
  console.log("==============================");
  
  // Check if we have ants to test with
  const ants = spatialGridManager?.getEntitiesByType('Ant');
  
  if (!ants || ants.length === 0) {
    console.warn("⚠️ No ants found. Spawn ants to test terrain detection.");
    console.log("💡 Testing with mock data instead...");
    
    // Mock test
    console.log("");
    console.log("Expected mappings:");
    console.log("  moss_0 → IN_MUD (🟫 30% speed)");
    console.log("  moss_1 → IN_MUD (🟫 30% speed)");
    console.log("  stone  → ON_ROUGH (🪨 80% speed)");
    console.log("  grass  → DEFAULT (no indicator, 100% speed)");
    console.log("  dirt   → DEFAULT (no indicator, 100% speed)");
    
    return;
  }
  
  // Test with first ant
  const ant = ants[0];
  
  if (!ant._terrainController) {
    console.error("❌ Ant has no TerrainController!");
    return;
  }
  
  console.log(`Testing with ant at (${Math.round(ant.x)}, ${Math.round(ant.y)})`);
  console.log("");
  
  // Get current tile
  const tile = g_activeMap.getTileAtPosition(ant.x, ant.y);
  if (!tile) {
    console.error("❌ No tile found at ant position!");
    return;
  }
  
  const material = tile._materialSet || tile.material || 'unknown';
  const terrainType = ant._stateMachine?.terrainModifier || 'UNKNOWN';
  
  console.log(`📍 Current position:`);
  console.log(`   Material: ${material}`);
  console.log(`   Terrain Type: ${terrainType}`);
  
  // Expected mappings
  const expectedMappings = {
    'moss_0': 'IN_MUD',
    'moss_1': 'IN_MUD',
    'stone': 'ON_ROUGH',
    'grass': 'DEFAULT',
    'dirt': 'DEFAULT'
  };
  
  const expected = expectedMappings[material] || 'UNKNOWN';
  const match = terrainType === expected ? '✅' : '❌';
  
  console.log(`   Expected: ${expected}`);
  console.log(`   Match: ${match}`);
  
  console.log("");
  console.log("📊 All expected mappings:");
  for (const [mat, terrain] of Object.entries(expectedMappings)) {
    console.log(`   ${mat} → ${terrain}`);
  }
  
  console.log("");
  console.log("💡 Move ants around to test different terrain types!");
};

/**
 * Test switching between levels
 * 
 * Usage: testLevelSwitching()
 */
window.testLevelSwitching = function() {
  console.log("🔄 Testing Level Switching");
  console.log("==========================");
  
  if (typeof mapManager === 'undefined') {
    console.error("❌ MapManager not available!");
    return;
  }
  
  // List all available maps
  console.log("📋 Available maps:");
  const maps = mapManager._maps;
  for (const [id, map] of maps.entries()) {
    const isActive = (mapManager.getActiveMap() === map) ? '🟢' : '⚪';
    console.log(`   ${isActive} ${id}`);
  }
  
  console.log("");
  console.log("💡 Switch levels with:");
  console.log("   switchToLevel('level1')    - Normal level");
  console.log("   switchToLevel('mossStone') - Moss & stone columns");
  
  console.log("");
  console.log("🎮 Or use the menu button: 'Moss & Stone Level'");
};

/**
 * Complete test suite for moss/stone level
 * 
 * Usage: fullMossStoneTest()
 */
window.fullMossStoneTest = function() {
  console.log("🧪 Full Moss & Stone Level Test Suite");
  console.log("=====================================");
  console.log("");
  
  // Test 1: Level creation
  console.log("Test 1: Level Creation");
  testMossStoneLevel();
  
  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");
  
  // Test 2: Terrain mappings
  console.log("Test 2: Terrain Mappings");
  verifyTerrainMappings();
  
  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");
  
  // Test 3: Level switching
  console.log("Test 3: Level Switching");
  testLevelSwitching();
  
  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");
  
  console.log("✅ All tests complete!");
  console.log("");
  console.log("🎮 Ready to play!");
  console.log("   1. Return to menu (ESC or game state change)");
  console.log("   2. Click 'Moss & Stone Level' button");
  console.log("   3. Spawn ants and watch them navigate the terrain");
};

// Auto-register on load
console.log("🏛️ Moss & Stone Level Test Suite Loaded");
console.log("Available commands:");
console.log("  - testMossStoneLevel() - Test level creation");
console.log("  - verifyTerrainMappings() - Verify terrain detection");
console.log("  - testLevelSwitching() - Test map switching");
console.log("  - fullMossStoneTest() - Run all tests");
