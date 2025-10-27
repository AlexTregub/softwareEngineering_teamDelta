/**
 * Terrain-Based Speed Modification Test
 * 
 * Tests that MovementController applies speed modifiers based on terrain type.
 * Console commands:
 * - testTerrainSpeed() - Test speed modification across all terrain types
 * - testAntSpeed(index) - Test specific ant's speed
 */

/**
 * Test terrain-based speed modification for all ants
 */
function testTerrainSpeed() {
  logNormal('\n╔════════════════════════════════════════╗');
  logNormal('║   TERRAIN SPEED MODIFICATION TEST      ║');
  logNormal('╚════════════════════════════════════════╝\n');
  
  // Check system availability
  if (typeof spatialGridManager === 'undefined' || !spatialGridManager) {
    logNormal('❌ SpatialGridManager not available');
    return;
  }
  
  // Get all ants
  const ants = spatialGridManager.getEntitiesByType('Ant') || [];
  const queens = spatialGridManager.getEntitiesByType('Queen') || [];
  const allAnts = [...ants, ...queens];
  
  if (allAnts.length === 0) {
    logNormal('❌ No ants found to test');
    return;
  }
  
  logNormal(`📊 Testing ${allAnts.length} ants\n`);
  
  // Test each terrain type
  const terrainTypes = ['DEFAULT', 'IN_WATER', 'IN_MUD', 'ON_SLIPPERY', 'ON_ROUGH'];
  const expectedModifiers = {
    'DEFAULT': 1.0,
    'IN_WATER': 0.5,
    'IN_MUD': 0.3,
    'ON_SLIPPERY': 0.0,
    'ON_ROUGH': 0.8
  };
  
  // Test first ant with all terrain types
  const testAnt = allAnts[0];
  const movementController = testAnt.getController('movement');
  
  if (!movementController) {
    logNormal('❌ Ant has no MovementController');
    return;
  }
  
  // Store original state
  const originalTerrain = testAnt._stateMachine ? testAnt._stateMachine.terrainModifier : 'DEFAULT';
  const baseSpeed = testAnt.movementSpeed || 1;
  
  logNormal(`🐜 Test Ant: ${testAnt._type || 'Unknown'}`);
  logNormal(`   Base Speed: ${baseSpeed}`);
  logNormal(`   Original Terrain: ${originalTerrain}\n`);
  
  logNormal('🧪 Testing terrain modifiers:\n');
  
  let allPassed = true;
  
  terrainTypes.forEach(terrain => {
    // Set terrain modifier
    if (testAnt._stateMachine) {
      testAnt._stateMachine.setTerrainModifier(terrain);
    }
    
    // Get effective speed
    const effectiveSpeed = movementController.getEffectiveMovementSpeed();
    const expectedSpeed = baseSpeed * expectedModifiers[terrain];
    const passed = Math.abs(effectiveSpeed - expectedSpeed) < 0.01;
    
    const status = passed ? '✅' : '❌';
    logNormal(`  ${status} ${terrain}:`);
    logNormal(`     Expected: ${expectedSpeed.toFixed(2)}`);
    logNormal(`     Actual: ${effectiveSpeed.toFixed(2)}`);
    logNormal(`     Modifier: ${expectedModifiers[terrain] * 100}%`);
    
    if (!passed) {
      allPassed = false;
      logNormal(`     ⚠️  MISMATCH!`);
    }
    logNormal();
  });
  
  // Restore original terrain
  if (testAnt._stateMachine) {
    testAnt._stateMachine.setTerrainModifier(originalTerrain);
  }
  
  logNormal('═══════════════════════════════════════\n');
  logNormal(allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  logNormal('\n💡 Note: Terrain types need to be added to terrain generation');
  logNormal('   Current tiles (grass/dirt/stone) all map to DEFAULT');
  logNormal('\n╚════════════════════════════════════════╝\n');
}

/**
 * Test specific ant's current speed
 */
function testAntSpeed(antIndex = 0) {
  const ants = spatialGridManager.getEntitiesByType('Ant') || [];
  const queens = spatialGridManager.getEntitiesByType('Queen') || [];
  const allAnts = [...ants, ...queens];
  
  if (antIndex >= allAnts.length) {
    logNormal(`❌ Ant #${antIndex} not found (only ${allAnts.length} ants available)`);
    return;
  }
  
  const ant = allAnts[antIndex];
  const movementController = ant.getController('movement');
  
  if (!movementController) {
    logNormal('❌ Ant has no MovementController');
    return;
  }
  
  logNormal('\n═══════════════════════════════════════');
  logNormal(`🐜 Ant #${antIndex} Speed Analysis`);
  logNormal('═══════════════════════════════════════\n');
  
  const pos = ant.getPosition();
  const baseSpeed = ant.movementSpeed || 1;
  const effectiveSpeed = movementController.getEffectiveMovementSpeed();
  const terrain = ant.getCurrentTerrain ? ant.getCurrentTerrain() : 'N/A';
  const terrainModifier = ant._stateMachine ? ant._stateMachine.terrainModifier : 'N/A';
  const material = ant.getCurrentTileMaterial ? ant.getCurrentTileMaterial() : 'N/A';
  
  logNormal(`Position: (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)})`);
  logNormal(`Type: ${ant._type || 'Unknown'}`);
  logNormal();
  logNormal(`Base Speed: ${baseSpeed}`);
  logNormal(`Effective Speed: ${effectiveSpeed.toFixed(2)}`);
  logNormal(`Speed Modifier: ${((effectiveSpeed / baseSpeed) * 100).toFixed(0)}%`);
  logNormal();
  logNormal(`Current Terrain: ${terrain}`);
  logNormal(`Terrain Modifier: ${terrainModifier}`);
  logNormal(`Tile Material: ${material}`);
  logNormal();
  
  // Show what speed would be on each terrain
  logNormal('💡 Speed on different terrains:');
  const terrainTypes = ['DEFAULT', 'IN_WATER', 'IN_MUD', 'ON_SLIPPERY', 'ON_ROUGH'];
  const modifiers = {
    'DEFAULT': 1.0,
    'IN_WATER': 0.5,
    'IN_MUD': 0.3,
    'ON_SLIPPERY': 0.0,
    'ON_ROUGH': 0.8
  };
  
  terrainTypes.forEach(t => {
    const speed = baseSpeed * modifiers[t];
    const current = t === terrainModifier ? ' ← CURRENT' : '';
    logNormal(`  ${t}: ${speed.toFixed(2)}${current}`);
  });
  
  logNormal('\n═══════════════════════════════════════\n');
}

// Auto-register functions globally
if (typeof window !== 'undefined') {
  window.testTerrainSpeed = testTerrainSpeed;
  window.testAntSpeed = testAntSpeed;
  
  logNormal("🧪 Terrain Speed Test Helper loaded!");
  logNormal("   Commands: testTerrainSpeed(), testAntSpeed(index)");
}
