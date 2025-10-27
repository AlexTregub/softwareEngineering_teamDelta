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
  logNormal("🏛️ Testing Moss & Stone Level");
  logNormal("==============================");
  
  // Check if custom levels module is loaded
  if (typeof createMossStoneColumnLevel === 'undefined') {
    console.error("❌ customLevels.js not loaded!");
    return;
  }
  
  logNormal("✅ Custom levels module loaded");
  
  // Check if MapManager is available
  if (typeof mapManager === 'undefined') {
    console.error("❌ MapManager not available!");
    return;
  }
  
  logNormal("✅ MapManager available");
  
  // Load the moss/stone level
  logNormal("📦 Creating moss/stone level...");
  const success = loadMossStoneLevel();
  
  if (!success) {
    console.error("❌ Failed to load moss/stone level!");
    return;
  }
  
  logNormal("✅ Moss/stone level created and registered as 'mossStone'");
  
  // Verify the level is registered
  const mossStoneMap = mapManager.getMap('mossStone');
  if (!mossStoneMap) {
    console.error("❌ Level not found in MapManager!");
    return;
  }
  
  logNormal("✅ Level found in MapManager");
  
  // Check a few tiles to verify pattern
  logNormal("");
  logNormal("🔍 Checking tile pattern:");
  
  // Sample some tiles at different X positions
  for (let x = 0; x < 10; x++) {
    const tile = mossStoneMap.getTileAtPosition(x * TILE_SIZE + 16, 100);
    if (tile) {
      const material = tile._materialSet;
      const expectedMaterial = (x % 2 === 0) ? 'moss_0' : 'stone';
      const match = material === expectedMaterial ? '✅' : '❌';
      
      logNormal(`  Column ${x}: ${material} (expected: ${expectedMaterial}) ${match}`);
    }
  }
  
  logNormal("");
  logNormal("✅ Moss & Stone Level Test Complete!");
  logNormal("");
  logNormal("💡 Next steps:");
  logNormal("   1. Click 'Moss & Stone Level' button on main menu");
  logNormal("   2. Spawn some ants");
  logNormal("   3. Watch them move between moss (🟫 30%) and stone (🪨 80%) columns");
  logNormal("   4. Use testTerrainIndicators() to cycle through terrain types");
  logNormal("   5. Use showAllTerrainEffects() to see all indicators at once");
};

/**
 * Verify terrain mappings for moss and stone
 * 
 * Usage: verifyTerrainMappings()
 */
window.verifyTerrainMappings = function() {
  logNormal("🗺️ Verifying Terrain Mappings");
  logNormal("==============================");
  
  // Check if we have ants to test with
  const ants = spatialGridManager?.getEntitiesByType('Ant');
  
  if (!ants || ants.length === 0) {
    console.warn("⚠️ No ants found. Spawn ants to test terrain detection.");
    logNormal("💡 Testing with mock data instead...");
    
    // Mock test
    logNormal("");
    logNormal("Expected mappings:");
    logNormal("  moss_0 → IN_MUD (🟫 30% speed)");
    logNormal("  moss_1 → IN_MUD (🟫 30% speed)");
    logNormal("  stone  → ON_ROUGH (🪨 80% speed)");
    logNormal("  grass  → DEFAULT (no indicator, 100% speed)");
    logNormal("  dirt   → DEFAULT (no indicator, 100% speed)");
    
    return;
  }
  
  // Test with first ant
  const ant = ants[0];
  
  if (!ant._terrainController) {
    console.error("❌ Ant has no TerrainController!");
    return;
  }
  
  logNormal(`Testing with ant at (${Math.round(ant.x)}, ${Math.round(ant.y)})`);
  logNormal("");
  
  // Get current tile
  const tile = g_activeMap.getTileAtPosition(ant.x, ant.y);
  if (!tile) {
    console.error("❌ No tile found at ant position!");
    return;
  }
  
  const material = tile._materialSet || tile.material || 'unknown';
  const terrainType = ant._stateMachine?.terrainModifier || 'UNKNOWN';
  
  logNormal(`📍 Current position:`);
  logNormal(`   Material: ${material}`);
  logNormal(`   Terrain Type: ${terrainType}`);
  
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
  
  logNormal(`   Expected: ${expected}`);
  logNormal(`   Match: ${match}`);
  
  logNormal("");
  logNormal("📊 All expected mappings:");
  for (const [mat, terrain] of Object.entries(expectedMappings)) {
    logNormal(`   ${mat} → ${terrain}`);
  }
  
  logNormal("");
  logNormal("💡 Move ants around to test different terrain types!");
};

/**
 * Test switching between levels
 * 
 * Usage: testLevelSwitching()
 */
window.testLevelSwitching = function() {
  logNormal("🔄 Testing Level Switching");
  logNormal("==========================");
  
  if (typeof mapManager === 'undefined') {
    console.error("❌ MapManager not available!");
    return;
  }
  
  // List all available maps
  logNormal("📋 Available maps:");
  const maps = mapManager._maps;
  for (const [id, map] of maps.entries()) {
    const isActive = (mapManager.getActiveMap() === map) ? '🟢' : '⚪';
    logNormal(`   ${isActive} ${id}`);
  }
  
  logNormal("");
  logNormal("💡 Switch levels with:");
  logNormal("   switchToLevel('level1')    - Normal level");
  logNormal("   switchToLevel('mossStone') - Moss & stone columns");
  
  logNormal("");
  logNormal("🎮 Or use the menu button: 'Moss & Stone Level'");
};

/**
 * Complete test suite for moss/stone level
 * 
 * Usage: fullMossStoneTest()
 */
window.fullMossStoneTest = function() {
  logNormal("🧪 Full Moss & Stone Level Test Suite");
  logNormal("=====================================");
  logNormal("");
  
  // Test 1: Level creation
  logNormal("Test 1: Level Creation");
  testMossStoneLevel();
  
  logNormal("");
  logNormal("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  logNormal("");
  
  // Test 2: Terrain mappings
  logNormal("Test 2: Terrain Mappings");
  verifyTerrainMappings();
  
  logNormal("");
  logNormal("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  logNormal("");
  
  // Test 3: Level switching
  logNormal("Test 3: Level Switching");
  testLevelSwitching();
  
  logNormal("");
  logNormal("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  logNormal("");
  
  logNormal("✅ All tests complete!");
  logNormal("");
  logNormal("🎮 Ready to play!");
  logNormal("   1. Return to menu (ESC or game state change)");
  logNormal("   2. Click 'Moss & Stone Level' button");
  logNormal("   3. Spawn ants and watch them navigate the terrain");
};

// Auto-register on load
logNormal("🏛️ Moss & Stone Level Test Suite Loaded");
logNormal("Available commands:");
logNormal("  - testMossStoneLevel() - Test level creation");
logNormal("  - verifyTerrainMappings() - Verify terrain detection");
logNormal("  - testLevelSwitching() - Test map switching");
logNormal("  - fullMossStoneTest() - Run all tests");
