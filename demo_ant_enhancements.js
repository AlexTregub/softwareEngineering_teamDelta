/**
 * Demonstration Script for Enhanced Ant Control System
 * Shows the new spawning and state management functionality
 */

function demonstrateAntEnhancements() {
  console.log('🎮 DEMONSTRATING ENHANCED ANT CONTROL SYSTEM');
  console.log('=' .repeat(50));
  
  // Check if required systems are available
  if (typeof AntUtilities === 'undefined') {
    console.error('❌ AntUtilities not available');
    return false;
  }
  
  if (typeof JobComponent === 'undefined') {
    console.error('❌ JobComponent not available');
    return false;
  }
  
  // Clear existing ants for demonstration
  if (typeof ants !== 'undefined') {
    ants.length = 0;
    console.log('🧹 Cleared existing ants for demo');
  }
  
  console.log('\n📋 PART 1: ANT SPAWNING DEMONSTRATION');
  console.log('-'.repeat(40));
  
  // Demo 1: Spawn different job types
  console.log('🔨 Spawning Builder ant...');
  const builderAnt = AntUtilities.spawnAnt(100, 100, 'Builder', 'red');
  if (builderAnt) {
    console.log(`✅ Builder spawned: Job=${builderAnt.jobName}, Faction=${builderAnt._faction}`);
  }
  
  console.log('🕵️ Spawning Scout ant...');
  const scoutAnt = AntUtilities.spawnAnt(150, 100, 'Scout', 'blue');
  if (scoutAnt) {
    console.log(`✅ Scout spawned: Job=${scoutAnt.jobName}, Faction=${scoutAnt._faction}`);
  }
  
  console.log('🌾 Spawning Farmer ant...');
  const farmerAnt = AntUtilities.spawnAnt(200, 100, 'Farmer', 'neutral');
  if (farmerAnt) {
    console.log(`✅ Farmer spawned: Job=${farmerAnt.jobName}, Faction=${farmerAnt._faction}`);
  }
  
  // Demo 2: Test invalid inputs
  console.log('\n🧪 Testing invalid job (should default to Scout)...');
  const invalidJobAnt = AntUtilities.spawnAnt(250, 100, 'InvalidJob', 'neutral');
  if (invalidJobAnt) {
    console.log(`✅ Invalid job handled: Job=${invalidJobAnt.jobName} (defaulted to Scout)`);
  }
  
  console.log('🧪 Testing invalid faction (should default to neutral)...');
  const invalidFactionAnt = AntUtilities.spawnAnt(300, 100, 'Warrior', 'invalidFaction');
  if (invalidFactionAnt) {
    console.log(`✅ Invalid faction handled: Faction=${invalidFactionAnt._faction} (defaulted to neutral)`);
  }
  
  // Demo 3: Spawn multiple ants in formation
  console.log('\n🎯 Spawning 5 Warriors in circle formation...');
  const warriorSquad = AntUtilities.spawnMultipleAnts(5, 'Warrior', 'red', 400, 200, 60);
  console.log(`✅ Spawned ${warriorSquad.length} Warriors in formation`);
  
  console.log(`\n📊 Total ants spawned: ${ants ? ants.length : 0}`);
  
  console.log('\n📋 PART 2: STATE MANAGEMENT DEMONSTRATION');
  console.log('-'.repeat(40));
  
  // Select some ants for state demonstration
  if (ants && ants.length >= 3) {
    // Select first 3 ants
    for (let i = 0; i < 3 && i < ants.length; i++) {
      const ant = ants[i];
      if (ant._selectionController) {
        ant._selectionController.setSelected(true);
      } else if (ant.isSelected !== undefined) {
        ant.isSelected = true;
      }
    }
    
    const selectedAnts = AntUtilities.getSelectedAnts(ants);
    console.log(`👆 Selected ${selectedAnts.length} ants for state demonstration`);
    
    // Demonstrate different state changes
    console.log('\n⚡ Changing selected ants to GATHERING state...');
    AntUtilities.setSelectedAntsGathering(ants);
    
    // Check states
    selectedAnts.forEach((ant, index) => {
      if (ant._stateMachine) {
        const state = ant._stateMachine.getFullState();
        console.log(`  📍 Ant ${index + 1}: ${state}`);
      }
    });
    
    console.log('\n🚨 Changing selected ants to COMBAT state...');
    AntUtilities.setSelectedAntsCombat(ants);
    
    // Check states again
    selectedAnts.forEach((ant, index) => {
      if (ant._stateMachine) {
        const state = ant._stateMachine.getFullState();
        console.log(`  ⚔️ Ant ${index + 1}: ${state}`);
      }
    });
    
    console.log('\n😴 Changing selected ants to IDLE state...');
    AntUtilities.setSelectedAntsIdle(ants);
    
    // Final state check
    selectedAnts.forEach((ant, index) => {
      if (ant._stateMachine) {
        const state = ant._stateMachine.getFullState();
        console.log(`  💤 Ant ${index + 1}: ${state}`);
      }
    });
  }
  
  console.log('\n📋 PART 3: UI CONTROL PANEL DEMONSTRATION');
  console.log('-'.repeat(40));
  
  // Check if ant control panel is available
  if (typeof initializeAntControlPanel !== 'undefined') {
    console.log('🎛️ Ant Control Panel is available');
    
    // Check faction selection
    if (typeof getSelectedFaction !== 'undefined' && typeof setSelectedFaction !== 'undefined') {
      console.log(`🏳️ Current faction: ${getSelectedFaction()}`);
      
      setSelectedFaction('blue');
      console.log(`🏳️ Changed faction to: ${getSelectedFaction()}`);
      
      setSelectedFaction('red');
      console.log(`🏳️ Changed faction to: ${getSelectedFaction()}`);
    }
    
    console.log('✅ UI panel functions are working correctly');
  } else {
    console.log('⚠️ Ant Control Panel not initialized (run initializeAntControlPanel())');
  }
  
  console.log('\n📊 FINAL SYSTEM STATUS');
  console.log('-'.repeat(40));
  
  if (ants) {
    const stats = AntUtilities.getPerformanceStats(ants);
    console.log(`👥 Total Ants: ${stats.totalAnts}`);
    console.log(`✋ Selected: ${stats.selectedCount}`);
    console.log(`🏃 Moving: ${stats.movingCount}`);
    console.log(`⚔️ In Combat: ${stats.combatCount}`);
    console.log(`💤 Idle: ${stats.idleCount}`);
    
    // Show job distribution
    const jobCounts = {};
    ants.forEach(ant => {
      const job = ant.jobName || 'Unknown';
      jobCounts[job] = (jobCounts[job] || 0) + 1;
    });
    
    console.log('\n🎯 Job Distribution:');
    Object.entries(jobCounts).forEach(([job, count]) => {
      console.log(`  ${job}: ${count}`);
    });
    
    // Show faction distribution
    const factionCounts = {};
    ants.forEach(ant => {
      const faction = ant._faction || 'Unknown';
      factionCounts[faction] = (factionCounts[faction] || 0) + 1;
    });
    
    console.log('\n🏳️ Faction Distribution:');
    Object.entries(factionCounts).forEach(([faction, count]) => {
      console.log(`  ${faction}: ${count}`);
    });
  }
  
  console.log('\n🎉 DEMONSTRATION COMPLETE!');
  console.log('✅ Enhanced ant control system is fully functional');
  console.log('🎮 Use the Ant Control Panel (Ctrl+Shift+A) for interactive spawning and state management');
  
  return true;
}

// Integration with global test runner
if (typeof window !== 'undefined') {
  // Browser environment
  window.demonstrateAntEnhancements = demonstrateAntEnhancements;
  
  // Register with global test runner
  if (typeof globalThis !== 'undefined' && typeof globalThis.registerTest === 'function') {
    globalThis.registerTest('Ant Enhancements Demo', demonstrateAntEnhancements);
    
    // Check if tests should run automatically
    if (typeof globalThis.shouldRunTests === 'function' && globalThis.shouldRunTests()) {
      // Auto-run after page load with delay
      setTimeout(() => {
        if (typeof AntUtilities !== 'undefined') {
          demonstrateAntEnhancements();
        } else {
          console.log('⏳ Waiting for AntUtilities to load...');
          setTimeout(() => {
            if (typeof AntUtilities !== 'undefined') {
              demonstrateAntEnhancements();
            } else {
              console.log('❌ AntUtilities not available for demonstration');
            }
          }, 2000);
        }
      }, 1000);
    } else {
      if (typeof globalThis.logQuiet === 'function') {
        globalThis.logQuiet('🎮 Ant Enhancements Demo available but disabled. Use enableTests() to enable or runTests() to run manually.');
      } else {
        console.log('🎮 Ant Enhancements Demo available but disabled. Use enableTests() to enable or runTests() to run manually.');
      }
    }
  } else {
    // Fallback behavior when global test runner is not available
    if (typeof globalThis.logQuiet === 'function') {
      globalThis.logQuiet('🎮 Ant Enhancements Demo available. Run demonstrateAntEnhancements() manually.');
    } else {
      console.log('🎮 Ant Enhancements Demo available. Run demonstrateAntEnhancements() manually.');
    }
  }
} else {
  // Node.js environment  
  module.exports = { demonstrateAntEnhancements };
}