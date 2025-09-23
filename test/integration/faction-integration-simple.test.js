// Faction Integration Tests
// Tests for faction system integration and interactions

// Set testing environment flag
global.__TESTING__ = true;

// Mock p5.js functions for Node.js environment
global.createVector = (x, y, z) => ({ x, y, z });
global.random = (min, max) => {
  if (arguments.length === 0) return Math.random();
  if (arguments.length === 1) return Math.random() * min;
  return Math.random() * (max - min) + min;
};

// Import required modules
const { globalFactionRegistry, FactionRegistry, createFaction } = require('../../Classes/ants/faction.js');

// Mock ant class for testing
class MockAnt {
  constructor(faction) {
    this.faction = faction;
    this._faction = faction;
  }
  
  onFactionRelationshipChange(factionName, oldState, newState, reason) {
    console.log(`Ant notified: ${factionName} relationship changed from ${oldState.name} to ${newState.name} (${reason})`);
  }
}

// Simple test framework
class FactionTestSuite {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, testFunction) {
    this.tests.push({ name, testFunction });
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  async run() {
    console.log('🧪 Running Faction System Integration Tests...\n');
    
    for (const test of this.tests) {
      try {
        console.log(`📋 ${test.name}`);
        await test.testFunction();
        console.log(`✅ PASSED`);
        this.passed++;
      } catch (error) {
        console.error(`❌ FAILED: ${error.message}`);
        this.failed++;
      }
    }

    console.log(`\\n📊 Test Results: ${this.passed} passed, ${this.failed} failed`);
    
    if (this.failed > 0) {
      console.log('❌ Some faction integration tests failed!');
      process.exit(1);
    } else {
      console.log('🎉 All faction integration tests passed!');
      process.exit(0);
    }
  }
}

const suite = new FactionTestSuite();

// Test 1: Basic faction creation
suite.test('Basic faction creation', () => {
  const redFaction = createFaction("Red", "#FF0000");
  const blueFaction = createFaction("Blue", "#0000FF");
  
  suite.assert(redFaction.name === "Red", "Red faction should have correct name");
  suite.assert(redFaction.color === "#FF0000", "Red faction should have correct color");
  suite.assert(blueFaction.name === "Blue", "Blue faction should have correct name");
  suite.assert(blueFaction.color === "#0000FF", "Blue faction should have correct color");
});

// Test 2: Faction relationship management
suite.test('Faction relationship management', () => {
  const redFaction = createFaction("RedTest", "#FF0000");
  const blueFaction = createFaction("BlueTest", "#0000FF");
  
  // Test initial neutral state
  const initialRelation = redFaction.getRelationshipState("BlueTest");
  suite.assert(initialRelation.name === "NEUTRAL", "Initial relationship should be NEUTRAL");
  
  // Test setting alliance (80+ = allied)
  redFaction.modifyRelationship("BlueTest", 40); // 50 + 40 = 90 (allied)
  const allyRelation = redFaction.getRelationshipState("BlueTest");
  suite.assert(allyRelation.name === "ALLIED", "Relationship should be ALLIED after modification");
  
  // Test setting hostility (1-19 = enemies)
  redFaction.modifyRelationship("BlueTest", -80); // 90 - 80 = 10 (enemies)
  const hostileRelation = redFaction.getRelationshipState("BlueTest");
  suite.assert(hostileRelation.name === "ENEMIES", "Relationship should be ENEMIES after modification");
});

// Test 3: Faction encounter system
suite.test('Faction encounter system', () => {
  const redFaction = createFaction("RedEnc", "#FF0000");
  const blueFaction = createFaction("BlueEnc", "#0000FF");
  
  // Test mutual encounter
  redFaction.encounterFaction(blueFaction);
  blueFaction.encounterFaction(redFaction);
  
  // Both factions should have relationship entries for each other
  const redToBlue = redFaction.getRelationshipValue("BlueEnc");
  const blueToRed = blueFaction.getRelationshipValue("RedEnc");
  
  suite.assert(typeof redToBlue === 'number', "Red faction should have relationship value for Blue");
  suite.assert(typeof blueToRed === 'number', "Blue faction should have relationship value for Red");
});

// Test 4: Global faction registry
suite.test('Global faction registry functionality', () => {
  const initialCount = globalFactionRegistry.getFactionCount();
  
  const redFaction = createFaction("RedReg", "#FF0000");
  const blueFaction = createFaction("BlueReg", "#0000FF");
  
  const afterCount = globalFactionRegistry.getFactionCount();
  suite.assert(afterCount === initialCount + 2, "Registry should have 2 more factions after creation");
  
  const retrievedRed = globalFactionRegistry.getFaction("RedReg");
  suite.assert(retrievedRed === redFaction, "Should retrieve the same red faction instance");
});

// Test 5: Ant faction integration
suite.test('Ant faction integration', () => {
  const redFaction = createFaction("RedAnt", "#FF0000");
  const blueFaction = createFaction("BlueAnt", "#0000FF");
  
  const redAnt = new MockAnt(redFaction);
  const blueAnt = new MockAnt(blueFaction);
  
  suite.assert(redAnt.faction === redFaction, "Red ant should have red faction");
  suite.assert(blueAnt.faction === blueFaction, "Blue ant should have blue faction");
});

// Run all tests
suite.run();