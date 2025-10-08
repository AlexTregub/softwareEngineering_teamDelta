/**
 * Unit Tests for AntUtilities Enhanced Functionality
 * Tests spawning logic and state management features
 * 
 * Following testing standards: Use system APIs, validate system behavior
 */

// Test suite setup
const AntUtilitiesTestSuite = {
  testResults: [],
  
  test: function(description, testFunction) {
    try {
      testFunction();
      this.testResults.push({ description, status: 'PASS' });
      console.log(`✅ ${description}`);
    } catch (error) {
      this.testResults.push({ description, status: 'FAIL', error: error.message });
      console.error(`❌ ${description}: ${error.message}`);
    }
  },

  assertEqual: function(actual, expected, message = '') {
    if (actual !== expected) {
      throw new Error(`${message} - Expected: ${expected}, Got: ${actual}`);
    }
  },

  assertTrue: function(condition, message = '') {
    if (!condition) {
      throw new Error(`${message} - Expected true, got false`);
    }
  },

  assertNotNull: function(value, message = '') {
    if (value === null || value === undefined) {
      throw new Error(`${message} - Expected non-null value`);
    }
  },

  getSummary: function() {
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    return { passed, failed, total: passed + failed };
  }
};

// Mock dependencies for testing
function createMockJobComponent() {
  return {
    getAllJobs: () => ['Builder', 'Scout', 'Farmer', 'Warrior', 'Spitter', 'DeLozier'],
    getJobStats: (jobName) => {
      const stats = {
        'Builder': { strength: 20, health: 120, gatherSpeed: 15, movementSpeed: 60 },
        'Scout': { strength: 10, health: 80, gatherSpeed: 10, movementSpeed: 80 },
        'Farmer': { strength: 15, health: 100, gatherSpeed: 30, movementSpeed: 60 },
        'Warrior': { strength: 40, health: 150, gatherSpeed: 5, movementSpeed: 60 },
        'Spitter': { strength: 30, health: 90, gatherSpeed: 8, movementSpeed: 60 }
      };
      return stats[jobName] || { strength: 10, health: 100, gatherSpeed: 10, movementSpeed: 60 };
    }
  };
}

function createMockAnt(x, y, job = 'Scout', faction = 'neutral') {
  return {
    // Position
    _x: x,
    _y: y,
    getPosition: function() { return { x: this._x, y: this._y }; },
    
    // Job and faction
    jobName: job,
    _faction: faction,
    
    // Job component
    job: {
      name: job,
      stats: JobComponent.getJobStats(job)
    },
    
    // State machine
    _stateMachine: {
      primaryState: 'IDLE',
      combatModifier: 'OUT_OF_COMBAT', 
      terrainModifier: 'DEFAULT',
      setState: function(primary, combat, terrain) {
        if (primary) this.primaryState = primary;
        if (combat !== null) this.combatModifier = combat;
        if (terrain !== null) this.terrainModifier = terrain;
        return true;
      },
      getFullState: function() {
        let state = this.primaryState;
        if (this.combatModifier) state += `_${this.combatModifier}`;
        if (this.terrainModifier) state += `_${this.terrainModifier}`;
        return state;
      }
    },
    
    // Selection
    _selectionController: {
      _selected: false,
      setSelected: function(selected) { this._selected = selected; },
      isSelected: function() { return this._selected; }
    },
    
    // Methods required by ant constructor
    assignJob: function(jobName, image) {
      this.jobName = jobName;
      this.job.name = jobName;
    },
    
    update: function() {}
  };
}

// Setup test environment
function setupTestEnvironment() {
  // Mock global variables
  global.JobComponent = createMockJobComponent();
  global.ants = [];
  global.JobImages = {
    'Scout': 'scout_image',
    'Builder': 'builder_image',
    'Warrior': 'warrior_image'
  };
  global.antBaseSprite = 'base_sprite';
  
  // Mock ant constructor
  global.ant = function(x, y, sizeX, sizeY, speed, rotation, image, job, faction) {
    return createMockAnt(x, y, job, faction);
  };
}

// Test 1: Spawn ant with valid job and faction
AntUtilitiesTestSuite.test('Spawn ant with valid job and faction', () => {
  setupTestEnvironment();
  
  const spawnedAnt = AntUtilities.spawnAnt(100, 200, 'Warrior', 'red');
  
  AntUtilitiesTestSuite.assertNotNull(spawnedAnt, 'Ant should be spawned');
  AntUtilitiesTestSuite.assertEqual(spawnedAnt.jobName, 'Warrior', 'Ant should have Warrior job');
  AntUtilitiesTestSuite.assertEqual(spawnedAnt._faction, 'red', 'Ant should have red faction');
  AntUtilitiesTestSuite.assertEqual(ants.length, 1, 'Ant should be added to ants array');
});

// Test 2: Spawn ant with invalid job defaults to Scout
AntUtilitiesTestSuite.test('Spawn ant with invalid job defaults to Scout', () => {
  setupTestEnvironment();
  
  const spawnedAnt = AntUtilities.spawnAnt(100, 200, 'InvalidJob', 'neutral');
  
  AntUtilitiesTestSuite.assertNotNull(spawnedAnt, 'Ant should still be spawned');
  AntUtilitiesTestSuite.assertEqual(spawnedAnt.jobName, 'Scout', 'Invalid job should default to Scout');
});

// Test 3: Spawn ant with invalid faction defaults to neutral
AntUtilitiesTestSuite.test('Spawn ant with invalid faction defaults to neutral', () => {
  setupTestEnvironment();
  
  const spawnedAnt = AntUtilities.spawnAnt(100, 200, 'Builder', 'invalidFaction');
  
  AntUtilitiesTestSuite.assertNotNull(spawnedAnt, 'Ant should still be spawned');
  AntUtilities.assertEqual(spawnedAnt._faction, 'neutral', 'Invalid faction should default to neutral');
});

// Test 4: Spawn multiple ants in formation
AntUtilitiesTestSuite.test('Spawn multiple ants in formation', () => {
  setupTestEnvironment();
  
  const spawnedAnts = AntUtilities.spawnMultipleAnts(5, 'Builder', 'blue', 400, 300, 50);
  
  AntUtilitiesTestSuite.assertEqual(spawnedAnts.length, 5, 'Should spawn 5 ants');
  AntUtilitiesTestSuite.assertEqual(ants.length, 5, 'All ants should be in global array');
  
  // Check all ants have correct job and faction
  spawnedAnts.forEach((ant, index) => {
    AntUtilitiesTestSuite.assertEqual(ant.jobName, 'Builder', `Ant ${index} should have Builder job`);
    AntUtilitiesTestSuite.assertEqual(ant._faction, 'blue', `Ant ${index} should have blue faction`);
  });
});

// Test 5: Change selected ants to IDLE state
AntUtilitiesTestSuite.test('Change selected ants to IDLE state', () => {
  setupTestEnvironment();
  
  // Create and select ants
  const ant1 = createMockAnt(100, 100);
  const ant2 = createMockAnt(200, 200);
  ant1._selectionController.setSelected(true);
  ant2._selectionController.setSelected(true);
  ants.push(ant1, ant2);
  
  AntUtilities.setSelectedAntsIdle(ants);
  
  AntUtilitiesTestSuite.assertEqual(ant1._stateMachine.primaryState, 'IDLE', 'Ant1 should be IDLE');
  AntUtilitiesTestSuite.assertEqual(ant2._stateMachine.primaryState, 'IDLE', 'Ant2 should be IDLE');
  AntUtilitiesTestSuite.assertEqual(ant1._stateMachine.combatModifier, 'OUT_OF_COMBAT', 'Ant1 should be out of combat');
});

// Test 6: Change selected ants to GATHERING state
AntUtilitiesTestSuite.test('Change selected ants to GATHERING state', () => {
  setupTestEnvironment();
  
  const ant1 = createMockAnt(100, 100);
  ant1._selectionController.setSelected(true);
  ants.push(ant1);
  
  AntUtilities.setSelectedAntsGathering(ants);
  
  AntUtilitiesTestSuite.assertEqual(ant1._stateMachine.primaryState, 'GATHERING', 'Ant should be GATHERING');
});

// Test 7: Change selected ants to PATROL state
AntUtilitiesTestSuite.test('Change selected ants to PATROL state', () => {
  setupTestEnvironment();
  
  const ant1 = createMockAnt(100, 100);
  ant1._selectionController.setSelected(true);
  ants.push(ant1);
  
  AntUtilities.setSelectedAntsPatrol(ants);
  
  AntUtilitiesTestSuite.assertEqual(ant1._stateMachine.primaryState, 'PATROL', 'Ant should be PATROL');
});

// Test 8: Change selected ants to COMBAT state  
AntUtilitiesTestSuite.test('Change selected ants to COMBAT state', () => {
  setupTestEnvironment();
  
  const ant1 = createMockAnt(100, 100);
  ant1._selectionController.setSelected(true);
  ants.push(ant1);
  
  AntUtilities.setSelectedAntsCombat(ants);
  
  AntUtilitiesTestSuite.assertEqual(ant1._stateMachine.primaryState, 'MOVING', 'Ant should be MOVING');
  AntUtilitiesTestSuite.assertEqual(ant1._stateMachine.combatModifier, 'IN_COMBAT', 'Ant should be IN_COMBAT');
});

// Test 9: Change selected ants to BUILDING state
AntUtilitiesTestSuite.test('Change selected ants to BUILDING state', () => {
  setupTestEnvironment();
  
  const ant1 = createMockAnt(100, 100);
  ant1._selectionController.setSelected(true);
  ants.push(ant1);
  
  AntUtilities.setSelectedAntsBuilding(ants);
  
  AntUtilitiesTestSuite.assertEqual(ant1._stateMachine.primaryState, 'BUILDING', 'Ant should be BUILDING');
});

// Test 10: No state change when no ants selected
AntUtilitiesTestSuite.test('No state change when no ants selected', () => {
  setupTestEnvironment();
  
  // Create ants but don't select them
  const ant1 = createMockAnt(100, 100);
  const ant2 = createMockAnt(200, 200);
  ant1._stateMachine.primaryState = 'MOVING';
  ant2._stateMachine.primaryState = 'MOVING';
  ants.push(ant1, ant2);
  
  // Capture console output
  const originalLog = console.log;
  let loggedMessage = '';
  console.log = (message) => { loggedMessage = message; };
  
  AntUtilities.setSelectedAntsPatrol(ants);
  
  console.log = originalLog;
  
  // States should be unchanged
  AntUtilitiesTestSuite.assertEqual(ant1._stateMachine.primaryState, 'MOVING', 'Ant1 state should be unchanged');
  AntUtilitiesTestSuite.assertEqual(ant2._stateMachine.primaryState, 'MOVING', 'Ant2 state should be unchanged');
  AntUtilitiesTestSuite.assertTrue(loggedMessage.includes('No ants selected'), 'Should log message about no selected ants');
});

// Test 11: Test job stats integration
AntUtilitiesTestSuite.test('Spawned ant has correct job stats', () => {
  setupTestEnvironment();
  
  const spawnedAnt = AntUtilities.spawnAnt(100, 200, 'Warrior', 'neutral');
  
  AntUtilitiesTestSuite.assertNotNull(spawnedAnt.job, 'Ant should have job component');
  AntUtilitiesTestSuite.assertEqual(spawnedAnt.job.name, 'Warrior', 'Job component should have correct name');
  
  const expectedStats = JobComponent.getJobStats('Warrior');
  AntUtilitiesTestSuite.assertEqual(spawnedAnt.job.stats.strength, expectedStats.strength, 'Warrior should have correct strength');
  AntUtilitiesTestSuite.assertEqual(spawnedAnt.job.stats.health, expectedStats.health, 'Warrior should have correct health');
});

// Test 12: Custom image handling
AntUtilitiesTestSuite.test('Spawn ant with custom image', () => {
  setupTestEnvironment();
  
  const customImage = 'custom_ant_image';
  const spawnedAnt = AntUtilities.spawnAnt(100, 200, 'Scout', 'neutral', customImage);
  
  AntUtilitiesTestSuite.assertNotNull(spawnedAnt, 'Ant should be spawned with custom image');
  AntUtilitiesTestSuite.assertEqual(spawnedAnt.jobName, 'Scout', 'Ant should still have correct job');
});

// Run all tests and show results
function runAntUtilitiesTests() {
  console.log('🧪 Running AntUtilities Enhanced Functionality Tests');
  console.log('=' .repeat(60));
  
  // Run all tests
  const summary = AntUtilitiesTestSuite.getSummary();
  
  console.log('\\n📊 Test Summary:');
  console.log(`✅ Passed: ${summary.passed}`);
  console.log(`❌ Failed: ${summary.failed}`);
  console.log(`📋 Total: ${summary.total}`);
  
  if (summary.failed > 0) {
    console.log('\\n❌ Failed tests:');
    AntUtilitiesTestSuite.testResults
      .filter(r => r.status === 'FAIL')
      .forEach(result => {
        console.log(`  • ${result.description}: ${result.error}`);
      });
  }
  
  return summary.failed === 0;
}

// Export for browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AntUtilitiesTestSuite,
    runAntUtilitiesTests,
    setupTestEnvironment
  };
} else if (typeof window !== 'undefined') {
  window.AntUtilitiesTestSuite = AntUtilitiesTestSuite;
  window.runAntUtilitiesTests = runAntUtilitiesTests;
}