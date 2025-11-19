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
  
  // Check system availability
  if (typeof spatialGridManager === 'undefined' || !spatialGridManager) {
    return;
  }
  
  // Get all ants
  const ants = spatialGridManager.getEntitiesByType('Ant') || [];
  const queens = spatialGridManager.getEntitiesByType('Queen') || [];
  const allAnts = [...ants, ...queens];
  
  if (allAnts.length === 0) {
    return;
  }
  
  
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
    return;
  }
  
  // Store original state
  const originalTerrain = testAnt._stateMachine ? testAnt._stateMachine.terrainModifier : 'DEFAULT';
  const baseSpeed = testAnt.movementSpeed || 1;
  
  
  
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
    
    if (!passed) {
      allPassed = false;
    }
  });
  
  // Restore original terrain
  if (testAnt._stateMachine) {
    testAnt._stateMachine.setTerrainModifier(originalTerrain);
  }
  
}

/**
 * Test specific ant's current speed
 */
function testAntSpeed(antIndex = 0) {
  const ants = spatialGridManager.getEntitiesByType('Ant') || [];
  const queens = spatialGridManager.getEntitiesByType('Queen') || [];
  const allAnts = [...ants, ...queens];
  
  if (antIndex >= allAnts.length) {
    return;
  }
  
  const ant = allAnts[antIndex];
  const movementController = ant.getController('movement');
  
  if (!movementController) {
    return;
  }
  
  
  const pos = ant.getPosition();
  const baseSpeed = ant.movementSpeed || 1;
  const effectiveSpeed = movementController.getEffectiveMovementSpeed();
  const terrain = ant.getCurrentTerrain ? ant.getCurrentTerrain() : 'N/A';
  const terrainModifier = ant._stateMachine ? ant._stateMachine.terrainModifier : 'N/A';
  const material = ant.getCurrentTileMaterial ? ant.getCurrentTileMaterial() : 'N/A';
  
  
  // Show what speed would be on each terrain
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
  });
  
}

// Auto-register functions globally
if (typeof window !== 'undefined') {
  window.testTerrainSpeed = testTerrainSpeed;
  window.testAntSpeed = testAntSpeed;
  
}