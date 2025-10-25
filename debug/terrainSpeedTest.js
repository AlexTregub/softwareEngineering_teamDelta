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
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   TERRAIN SPEED MODIFICATION TEST      ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  // Check system availability
  if (typeof spatialGridManager === 'undefined' || !spatialGridManager) {
    console.log('❌ SpatialGridManager not available');
    return;
  }
  
  // Get all ants
  const ants = spatialGridManager.getEntitiesByType('Ant') || [];
  const queens = spatialGridManager.getEntitiesByType('Queen') || [];
  const allAnts = [...ants, ...queens];
  
  if (allAnts.length === 0) {
    console.log('❌ No ants found to test');
    return;
  }
  
  console.log(`📊 Testing ${allAnts.length} ants\n`);
  
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
    console.log('❌ Ant has no MovementController');
    return;
  }
  
  // Store original state
  const originalTerrain = testAnt._stateMachine ? testAnt._stateMachine.terrainModifier : 'DEFAULT';
  const baseSpeed = testAnt.movementSpeed || 1;
  
  console.log(`🐜 Test Ant: ${testAnt._type || 'Unknown'}`);
  console.log(`   Base Speed: ${baseSpeed}`);
  console.log(`   Original Terrain: ${originalTerrain}\n`);
  
  console.log('🧪 Testing terrain modifiers:\n');
  
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
    console.log(`  ${status} ${terrain}:`);
    console.log(`     Expected: ${expectedSpeed.toFixed(2)}`);
    console.log(`     Actual: ${effectiveSpeed.toFixed(2)}`);
    console.log(`     Modifier: ${expectedModifiers[terrain] * 100}%`);
    
    if (!passed) {
      allPassed = false;
      console.log(`     ⚠️  MISMATCH!`);
    }
    console.log();
  });
  
  // Restore original terrain
  if (testAnt._stateMachine) {
    testAnt._stateMachine.setTerrainModifier(originalTerrain);
  }
  
  console.log('═══════════════════════════════════════\n');
  console.log(allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  console.log('\n💡 Note: Terrain types need to be added to terrain generation');
  console.log('   Current tiles (grass/dirt/stone) all map to DEFAULT');
  console.log('\n╚════════════════════════════════════════╝\n');
}

/**
 * Test specific ant's current speed
 */
function testAntSpeed(antIndex = 0) {
  const ants = spatialGridManager.getEntitiesByType('Ant') || [];
  const queens = spatialGridManager.getEntitiesByType('Queen') || [];
  const allAnts = [...ants, ...queens];
  
  if (antIndex >= allAnts.length) {
    console.log(`❌ Ant #${antIndex} not found (only ${allAnts.length} ants available)`);
    return;
  }
  
  const ant = allAnts[antIndex];
  const movementController = ant.getController('movement');
  
  if (!movementController) {
    console.log('❌ Ant has no MovementController');
    return;
  }
  
  console.log('\n═══════════════════════════════════════');
  console.log(`🐜 Ant #${antIndex} Speed Analysis`);
  console.log('═══════════════════════════════════════\n');
  
  const pos = ant.getPosition();
  const baseSpeed = ant.movementSpeed || 1;
  const effectiveSpeed = movementController.getEffectiveMovementSpeed();
  const terrain = ant.getCurrentTerrain ? ant.getCurrentTerrain() : 'N/A';
  const terrainModifier = ant._stateMachine ? ant._stateMachine.terrainModifier : 'N/A';
  const material = ant.getCurrentTileMaterial ? ant.getCurrentTileMaterial() : 'N/A';
  
  console.log(`Position: (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)})`);
  console.log(`Type: ${ant._type || 'Unknown'}`);
  console.log();
  console.log(`Base Speed: ${baseSpeed}`);
  console.log(`Effective Speed: ${effectiveSpeed.toFixed(2)}`);
  console.log(`Speed Modifier: ${((effectiveSpeed / baseSpeed) * 100).toFixed(0)}%`);
  console.log();
  console.log(`Current Terrain: ${terrain}`);
  console.log(`Terrain Modifier: ${terrainModifier}`);
  console.log(`Tile Material: ${material}`);
  console.log();
  
  // Show what speed would be on each terrain
  console.log('💡 Speed on different terrains:');
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
    console.log(`  ${t}: ${speed.toFixed(2)}${current}`);
  });
  
  console.log('\n═══════════════════════════════════════\n');
}

// Auto-register functions globally
if (typeof window !== 'undefined') {
  window.testTerrainSpeed = testTerrainSpeed;
  window.testAntSpeed = testAntSpeed;
  
  console.log("🧪 Terrain Speed Test Helper loaded!");
  console.log("   Commands: testTerrainSpeed(), testAntSpeed(index)");
}
