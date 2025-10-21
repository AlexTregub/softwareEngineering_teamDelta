/**
 * Terrain Indicator Visual Test Suite
 * 
 * Tests visual terrain effect indicators that appear above entities
 * when terrain is affecting their movement speed.
 * 
 * Available Console Commands:
 * - testTerrainIndicators() - Cycles through all terrain types with visual feedback
 * - setAntTerrain(antIndex, terrainType) - Set specific ant to specific terrain
 * - showAllTerrainEffects() - Set different ants to different terrains for comparison
 * - clearTerrainEffects() - Reset all ants to DEFAULT terrain
 */

/**
 * Test terrain indicators by cycling through all terrain types
 * 
 * Usage: testTerrainIndicators()
 * 
 * This will automatically cycle through:
 * - DEFAULT (no indicator)
 * - IN_WATER (💧 blue)
 * - IN_MUD (🟫 brown)
 * - ON_SLIPPERY (❄️ light blue)
 * - ON_ROUGH (🪨 gray)
 */
window.testTerrainIndicators = function() {
  console.log("🎨 Testing Terrain Visual Indicators");
  console.log("====================================");
  
  // Get all ants from spatial grid
  const ants = spatialGridManager.getEntitiesByType('Ant');
  
  if (!ants || ants.length === 0) {
    console.warn("⚠️ No ants found! Spawn some ants first.");
    return;
  }
  
  // Use first ant for testing
  const testAnt = ants[0];
  
  if (!testAnt._stateMachine) {
    console.error("❌ Test ant has no state machine!");
    return;
  }
  
  console.log(`📍 Testing with ant at position (${Math.round(testAnt.x)}, ${Math.round(testAnt.y)})`);
  console.log("");
  
  // Define terrain types to test
  const terrainTypes = ['DEFAULT', 'IN_WATER', 'IN_MUD', 'ON_SLIPPERY', 'ON_ROUGH'];
  const terrainInfo = {
    'DEFAULT': { icon: '🟢', description: 'Normal terrain (no indicator shown)', speed: '100%' },
    'IN_WATER': { icon: '💧', description: 'Water terrain', speed: '50%' },
    'IN_MUD': { icon: '🟫', description: 'Muddy terrain', speed: '30%' },
    'ON_SLIPPERY': { icon: '❄️', description: 'Slippery/ice terrain', speed: '0%' },
    'ON_ROUGH': { icon: '🪨', description: 'Rough/rocky terrain', speed: '80%' }
  };
  
  let currentIndex = 0;
  
  console.log("⏱️ Cycling through terrain types every 2 seconds...");
  console.log("   Watch the indicator above the ant change!");
  console.log("");
  
  // Cycle through terrains
  const interval = setInterval(() => {
    const terrain = terrainTypes[currentIndex];
    const info = terrainInfo[terrain];
    
    // Set terrain modifier
    testAnt._stateMachine.setTerrainModifier(terrain);
    
    // Log current terrain
    console.log(`${info.icon} ${terrain}: ${info.description} (Speed: ${info.speed})`);
    
    // Check if ant has render controller
    if (testAnt.getController && testAnt.getController('RenderController')) {
      const renderController = testAnt.getController('RenderController');
      const currentModifier = testAnt._stateMachine.terrainModifier;
      console.log(`   ✓ Visual indicator active: ${currentModifier !== 'DEFAULT'}`);
    }
    
    currentIndex++;
    
    // Stop after cycling through all terrains
    if (currentIndex >= terrainTypes.length) {
      clearInterval(interval);
      console.log("");
      console.log("✅ Test complete!");
      console.log("💡 Try these commands:");
      console.log("   - setAntTerrain(0, 'IN_WATER') - Set first ant to water");
      console.log("   - showAllTerrainEffects() - Show all terrain types at once");
      console.log("   - clearTerrainEffects() - Reset all to normal");
    }
  }, 2000);
};

/**
 * Set specific ant to specific terrain type
 * 
 * @param {number} antIndex - Index of ant in spatial grid (0 = first ant)
 * @param {string} terrainType - Terrain type: 'DEFAULT', 'IN_WATER', 'IN_MUD', 'ON_SLIPPERY', 'ON_ROUGH'
 * 
 * Usage: setAntTerrain(0, 'IN_WATER')
 */
window.setAntTerrain = function(antIndex, terrainType) {
  const ants = spatialGridManager.getEntitiesByType('Ant');
  
  if (!ants || ants.length === 0) {
    console.warn("⚠️ No ants found!");
    return;
  }
  
  if (antIndex < 0 || antIndex >= ants.length) {
    console.error(`❌ Invalid ant index ${antIndex}. Valid range: 0-${ants.length - 1}`);
    return;
  }
  
  const ant = ants[antIndex];
  
  if (!ant._stateMachine) {
    console.error(`❌ Ant ${antIndex} has no state machine!`);
    return;
  }
  
  const validTerrains = ['DEFAULT', 'IN_WATER', 'IN_MUD', 'ON_SLIPPERY', 'ON_ROUGH'];
  if (!validTerrains.includes(terrainType)) {
    console.error(`❌ Invalid terrain type '${terrainType}'. Valid: ${validTerrains.join(', ')}`);
    return;
  }
  
  // Set terrain
  ant._stateMachine.setTerrainModifier(terrainType);
  
  // Get movement speed if available
  let speedInfo = '';
  if (ant.getController && ant.getController('MovementController')) {
    const movementController = ant.getController('MovementController');
    const effectiveSpeed = movementController.getEffectiveMovementSpeed();
    speedInfo = ` (Speed: ${effectiveSpeed.toFixed(2)})`;
  }
  
  console.log(`✅ Ant ${antIndex} set to ${terrainType}${speedInfo}`);
  console.log(`   Position: (${Math.round(ant.x)}, ${Math.round(ant.y)})`);
  console.log(`   Visual indicator: ${terrainType !== 'DEFAULT' ? 'ACTIVE' : 'HIDDEN'}`);
};

/**
 * Show all terrain effects at once on different ants for comparison
 * 
 * Usage: showAllTerrainEffects()
 */
window.showAllTerrainEffects = function() {
  console.log("🌈 Showing All Terrain Effects");
  console.log("===============================");
  
  const ants = spatialGridManager.getEntitiesByType('Ant');
  
  if (!ants || ants.length === 0) {
    console.warn("⚠️ No ants found!");
    return;
  }
  
  if (ants.length < 4) {
    console.warn(`⚠️ Only ${ants.length} ants found. Spawn at least 4 ants for best results.`);
  }
  
  const terrainTypes = ['IN_WATER', 'IN_MUD', 'ON_SLIPPERY', 'ON_ROUGH'];
  const terrainIcons = {
    'IN_WATER': '💧',
    'IN_MUD': '🟫',
    'ON_SLIPPERY': '❄️',
    'ON_ROUGH': '🪨'
  };
  
  // Set first 4 ants to different terrains
  for (let i = 0; i < Math.min(4, ants.length); i++) {
    const ant = ants[i];
    const terrain = terrainTypes[i];
    
    if (ant._stateMachine) {
      ant._stateMachine.setTerrainModifier(terrain);
      
      let speedInfo = '';
      if (ant.getController && ant.getController('MovementController')) {
        const movementController = ant.getController('MovementController');
        const effectiveSpeed = movementController.getEffectiveMovementSpeed();
        speedInfo = ` - Speed: ${effectiveSpeed.toFixed(2)}`;
      }
      
      console.log(`${terrainIcons[terrain]} Ant ${i}: ${terrain}${speedInfo}`);
    }
  }
  
  console.log("");
  console.log("✅ Terrain effects applied!");
  console.log("💡 Look for icons above the ants:");
  console.log("   💧 = Water (blue)");
  console.log("   🟫 = Mud (brown)");
  console.log("   ❄️ = Ice (light blue)");
  console.log("   🪨 = Rough (gray)");
};

/**
 * Clear all terrain effects (reset to DEFAULT)
 * 
 * Usage: clearTerrainEffects()
 */
window.clearTerrainEffects = function() {
  console.log("🧹 Clearing All Terrain Effects");
  console.log("================================");
  
  const ants = spatialGridManager.getEntitiesByType('Ant');
  
  if (!ants || ants.length === 0) {
    console.warn("⚠️ No ants found!");
    return;
  }
  
  let cleared = 0;
  
  for (const ant of ants) {
    if (ant._stateMachine) {
      ant._stateMachine.setTerrainModifier('DEFAULT');
      cleared++;
    }
  }
  
  console.log(`✅ Cleared terrain effects from ${cleared} ants`);
  console.log("   All ants now at normal speed (no visual indicators)");
};

/**
 * Get current terrain indicator status for all ants
 * 
 * Usage: getTerrainIndicatorStatus()
 */
window.getTerrainIndicatorStatus = function() {
  console.log("📊 Terrain Indicator Status Report");
  console.log("===================================");
  
  const ants = spatialGridManager.getEntitiesByType('Ant');
  
  if (!ants || ants.length === 0) {
    console.warn("⚠️ No ants found!");
    return;
  }
  
  const terrainCounts = {
    'DEFAULT': 0,
    'IN_WATER': 0,
    'IN_MUD': 0,
    'ON_SLIPPERY': 0,
    'ON_ROUGH': 0
  };
  
  let totalWithIndicators = 0;
  
  for (let i = 0; i < ants.length; i++) {
    const ant = ants[i];
    
    if (ant._stateMachine) {
      const terrain = ant._stateMachine.terrainModifier || 'DEFAULT';
      terrainCounts[terrain] = (terrainCounts[terrain] || 0) + 1;
      
      if (terrain !== 'DEFAULT') {
        totalWithIndicators++;
      }
    }
  }
  
  console.log(`📈 Total ants: ${ants.length}`);
  console.log(`🎨 Ants with visible indicators: ${totalWithIndicators}`);
  console.log("");
  console.log("Breakdown by terrain:");
  console.log(`  🟢 DEFAULT (no indicator): ${terrainCounts['DEFAULT']}`);
  console.log(`  💧 IN_WATER: ${terrainCounts['IN_WATER']}`);
  console.log(`  🟫 IN_MUD: ${terrainCounts['IN_MUD']}`);
  console.log(`  ❄️ ON_SLIPPERY: ${terrainCounts['ON_SLIPPERY']}`);
  console.log(`  🪨 ON_ROUGH: ${terrainCounts['ON_ROUGH']}`);
};

// Auto-register functions on load
console.log("🎨 Terrain Indicator Test Suite Loaded");
console.log("Available commands:");
console.log("  - testTerrainIndicators() - Cycle through all terrain types");
console.log("  - setAntTerrain(index, type) - Set specific ant terrain");
console.log("  - showAllTerrainEffects() - Show all effects at once");
console.log("  - clearTerrainEffects() - Reset all to normal");
console.log("  - getTerrainIndicatorStatus() - Show current status");
