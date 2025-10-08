/**
 * Faction System Demo
 * Simple demonstration of the new faction system functionality
 * Shows faction creation, relationship management, and territorial interactions
 */

function demonstrateFactionSystem() {
  console.log('🏴 === FACTION SYSTEM DEMONSTRATION ===');
  
  // Initialize faction manager if not already done
  if (!g_factionManager) {
    initializeFactionManager();
  }
  
  const fm = g_factionManager;
  
  console.log('📊 Creating test factions...');
  
  // Create test factions
  const playerFaction = fm.createFaction('Red Empire', {r: 200, g: 50, b: 50}, 'player', {x: 200, y: 200});
  const aiFaction1 = fm.createFaction('Blue Alliance', {r: 50, g: 50, b: 200}, 'ai', {x: 600, y: 200});
  const aiFaction2 = fm.createFaction('Green Collective', {r: 50, g: 200, b: 50}, 'ai', {x: 400, y: 600});
  const neutralFaction = fm.createFaction('Gray Merchants', {r: 128, g: 128, b: 128}, 'neutral', {x: 400, y: 100});
  
  console.log(`✅ Created ${fm.getAllFactions().length} factions`);
  
  // Test relationship management
  console.log('🤝 Testing relationship management...');
  
  // Set initial relationships
  fm.setRelationship(playerFaction, aiFaction1, RELATIONSHIP_TIERS.ENEMY, 'Initial hostility');
  fm.setRelationship(playerFaction, aiFaction2, RELATIONSHIP_TIERS.NEUTRAL, 'Unknown faction');
  fm.setRelationship(playerFaction, neutralFaction, RELATIONSHIP_TIERS.ALLIED, 'Trade partners');
  fm.setRelationship(aiFaction1, aiFaction2, RELATIONSHIP_TIERS.ENEMY, 'Territorial dispute');
  
  // Test relationship actions
  console.log('🎁 Testing gift giving...');
  fm.handleRelationshipAction(playerFaction, aiFaction2, 'GIFT_RESOURCES', {
    intensity: 1.0,
    resources: {food: 50, materials: 25}
  });
  
  console.log('⚔️ Testing combat actions...');
  fm.handleRelationshipAction(aiFaction1, playerFaction, 'ATTACK_ANT', {
    intensity: 0.5
  });
  
  console.log('🏴 Testing queen attack (should create blood enemy)...');
  fm.handleRelationshipAction(aiFaction2, neutralFaction, 'ATTACK_QUEEN', {
    inOwnTerritory: true,
    intensity: 1.0
  });
  
  // Test discovery system
  console.log('🔍 Testing faction discovery...');
  fm.discoverFaction(playerFaction, aiFaction1);
  fm.discoverFaction(playerFaction, neutralFaction);
  fm.discoverFaction(aiFaction1, playerFaction);
  
  // Test territorial system
  console.log('🗺️ Testing territorial system...');
  
  // Test if positions are in territories
  console.log(`Player position (200,200) in own territory: ${fm.isInTerritory(playerFaction, {x: 200, y: 200})}`);
  console.log(`Player position (200,200) in Blue territory: ${fm.isInTerritory(aiFaction1, {x: 200, y: 200})}`);
  console.log(`Position (580,180) in Blue territory: ${fm.isInTerritory(aiFaction1, {x: 580, y: 180})}`);
  
  // Test encroachment
  fm.handleTerritorialEncroachment(playerFaction, aiFaction1, {x: 580, y: 180});
  
  // Get diplomatic status
  console.log('📋 Getting diplomatic status...');
  const diplomaticStatus = fm.getDiplomaticStatus(playerFaction);
  
  if (diplomaticStatus) {
    console.log(`🏴 ${diplomaticStatus.playerFaction.name} diplomatic report:`);
    console.log(`📊 Known factions: ${diplomaticStatus.discoveredCount}/${diplomaticStatus.totalFactions}`);
    
    diplomaticStatus.knownFactions.forEach(factionInfo => {
      const tierName = factionInfo.relationshipTier;
      const relationship = factionInfo.relationship.toFixed(2);
      const canChange = factionInfo.canChangeRelationship ? '✏️' : '🔒';
      
      console.log(`  • ${factionInfo.faction.name}: ${tierName} (${relationship}) ${canChange}`);
    });
  }
  
  // Show relationship history
  console.log('📜 Recent relationship changes:');
  const history = fm.getRelationshipHistory(5);
  history.forEach(entry => {
    const timeAgo = Math.floor(entry.timeAgo / 1000);
    console.log(`  ${entry.faction1Name} ↔ ${entry.faction2Name}: ${entry.oldValue.toFixed(2)} → ${entry.newValue.toFixed(2)} (${entry.reason}) ${timeAgo}s ago`);
  });
  
  // Debug info
  console.log('🐛 System debug info:', fm.getDebugInfo());
  
  console.log('🏴 === FACTION SYSTEM DEMO COMPLETE ===');
  
  return {
    factionManager: fm,
    factions: {
      player: playerFaction,
      ai1: aiFaction1,
      ai2: aiFaction2,
      neutral: neutralFaction
    },
    diplomaticStatus: diplomaticStatus
  };
}

// Test faction controller integration with ants
function demonstrateFactionControllerIntegration() {
  console.log('🐜 === FACTION CONTROLLER INTEGRATION TEST ===');
  
  // Make sure we have some ants
  if (typeof ants === 'undefined' || ants.length === 0) {
    console.log('📦 Spawning test ants...');
    antsSpawn(4, 'player');
    antsSpawn(2, 'enemy');
    antsSpawn(1, 'neutral');
  }
  
  console.log(`🐜 Testing with ${ants.length} ants`);
  
  // Test faction controller functionality
  ants.forEach((antWrapper, index) => {
    const ant = antWrapper.antObject || antWrapper;
    const factionController = ant.getController ? ant.getController('faction') : null;
    
    if (factionController) {
      const factionId = factionController.getFactionId();
      const isInOwnTerritory = factionController.isInOwnTerritory();
      const encroachingTerritory = factionController.getEncroachingTerritory();
      const discovered = Array.from(factionController.getDiscoveredFactions());
      
      console.log(`🐜 Ant ${index}: Faction=${factionId}, InOwnTerritory=${isInOwnTerritory}, Encroaching=${encroachingTerritory || 'none'}, Discovered=[${discovered.join(', ')}]`);
      
      // Test combat decisions
      const otherAnts = ants.filter((other, otherIndex) => otherIndex !== index);
      otherAnts.forEach((otherWrapper, otherIndex) => {
        const otherAnt = otherWrapper.antObject || otherWrapper;
        const shouldAttack = factionController.shouldAttackOnSight(otherAnt);
        const shouldAssist = factionController.shouldAssistInCombat(otherAnt, ant);
        
        if (shouldAttack || shouldAssist) {
          const otherFaction = otherAnt._faction || otherAnt.faction || 'unknown';
          console.log(`  💥 Ant ${index} → Ant ${otherIndex} (${otherFaction}): Attack=${shouldAttack}, Assist=${shouldAssist}`);
        }
      });
    } else {
      console.log(`⚠️ Ant ${index}: No faction controller found`);
    }
  });
  
  console.log('🐜 === FACTION CONTROLLER INTEGRATION TEST COMPLETE ===');
}

// Run demo when requested
if (typeof window !== 'undefined') {
  window.demonstrateFactionSystem = demonstrateFactionSystem;
  window.demonstrateFactionControllerIntegration = demonstrateFactionControllerIntegration;
  
  // Auto-run demo in 2 seconds if in development mode
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    setTimeout(() => {
      console.log('🚀 Auto-running faction system demo...');
      demonstrateFactionSystem();
      
      // Run controller integration test after 1 second
      setTimeout(() => {
        demonstrateFactionControllerIntegration();
      }, 1000);
    }, 2000);
  }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    demonstrateFactionSystem, 
    demonstrateFactionControllerIntegration 
  };
}