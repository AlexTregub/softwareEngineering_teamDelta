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
  logNormal("🎨 Testing Terrain Visual Indicators");
  logNormal("====================================");
  
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
  
  logNormal(`📍 Testing with ant at position (${Math.round(testAnt.x)}, ${Math.round(testAnt.y)})`);
  logNormal("");
  
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
  
  logNormal("⏱️ Cycling through terrain types every 2 seconds...");
  logNormal("   Watch the indicator above the ant change!");
  logNormal("");
  
  // Cycle through terrains
  const interval = setInterval(() => {
    const terrain = terrainTypes[currentIndex];
    const info = terrainInfo[terrain];
    
    // Set terrain modifier
    testAnt._stateMachine.setTerrainModifier(terrain);
    
    // Log current terrain
    logNormal(`${info.icon} ${terrain}: ${info.description} (Speed: ${info.speed})`);
    
    // Check if ant has render controller
    if (testAnt.getController && testAnt.getController('RenderController')) {
      const renderController = testAnt.getController('RenderController');
      const currentModifier = testAnt._stateMachine.terrainModifier;
      logNormal(`   ✓ Visual indicator active: ${currentModifier !== 'DEFAULT'}`);
    }
    
    currentIndex++;
    
    // Stop after cycling through all terrains
    if (currentIndex >= terrainTypes.length) {
      clearInterval(interval);
      logNormal("");
      logNormal("✅ Test complete!");
      logNormal("💡 Try these commands:");
      logNormal("   - setAntTerrain(0, 'IN_WATER') - Set first ant to water");
      logNormal("   - showAllTerrainEffects() - Show all terrain types at once");
      logNormal("   - clearTerrainEffects() - Reset all to normal");
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
  
  logNormal(`✅ Ant ${antIndex} set to ${terrainType}${speedInfo}`);
  logNormal(`   Position: (${Math.round(ant.x)}, ${Math.round(ant.y)})`);
  logNormal(`   Visual indicator: ${terrainType !== 'DEFAULT' ? 'ACTIVE' : 'HIDDEN'}`);
};

/**
 * Show all terrain effects at once on different ants for comparison
 * 
 * Usage: showAllTerrainEffects()
 */
window.showAllTerrainEffects = function() {
  logNormal("🌈 Showing All Terrain Effects");
  logNormal("===============================");
  
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
      
      logNormal(`${terrainIcons[terrain]} Ant ${i}: ${terrain}${speedInfo}`);
    }
  }
  
  logNormal("");
  logNormal("✅ Terrain effects applied!");
  logNormal("💡 Look for icons above the ants:");
  logNormal("   💧 = Water (blue)");
  logNormal("   🟫 = Mud (brown)");
  logNormal("   ❄️ = Ice (light blue)");
  logNormal("   🪨 = Rough (gray)");
};

/**
 * Clear all terrain effects (reset to DEFAULT)
 * 
 * Usage: clearTerrainEffects()
 */
window.clearTerrainEffects = function() {
  logNormal("🧹 Clearing All Terrain Effects");
  logNormal("================================");
  
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
  
  logNormal(`✅ Cleared terrain effects from ${cleared} ants`);
  logNormal("   All ants now at normal speed (no visual indicators)");
};

/**
 * Get current terrain indicator status for all ants
 * 
 * Usage: getTerrainIndicatorStatus()
 */
window.getTerrainIndicatorStatus = function() {
  logNormal("📊 Terrain Indicator Status Report");
  logNormal("===================================");
  
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
  
  logNormal(`📈 Total ants: ${ants.length}`);
  logNormal(`🎨 Ants with visible indicators: ${totalWithIndicators}`);
  logNormal("");
  logNormal("Breakdown by terrain:");
  logNormal(`  🟢 DEFAULT (no indicator): ${terrainCounts['DEFAULT']}`);
  logNormal(`  💧 IN_WATER: ${terrainCounts['IN_WATER']}`);
  logNormal(`  🟫 IN_MUD: ${terrainCounts['IN_MUD']}`);
  logNormal(`  ❄️ ON_SLIPPERY: ${terrainCounts['ON_SLIPPERY']}`);
  logNormal(`  🪨 ON_ROUGH: ${terrainCounts['ON_ROUGH']}`);
};

// Auto-register functions on load
logNormal("🎨 Terrain Indicator Test Suite Loaded");
logNormal("Available commands:");
logNormal("  - testTerrainIndicators() - Cycle through all terrain types");
logNormal("  - setAntTerrain(index, type) - Set specific ant terrain");
logNormal("  - showAllTerrainEffects() - Show all effects at once");
logNormal("  - clearTerrainEffects() - Reset all to normal");
logNormal("  - getTerrainIndicatorStatus() - Show current status");
