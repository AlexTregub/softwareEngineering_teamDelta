// faction-statemachine.test.js
// Comprehensive test for faction-state machine integration

const { Faction, createFaction, RELATIONSHIP_STATES } = require('../Classes/ants/faction.js');
const AntStateMachine = require('../Classes/ants/antStateMachine.js');

console.log("🧪 Running Faction-State Machine Integration Test Suite...\n");

// Test counter
let testsPassed = 0;
let testsTotal = 0;

function runTest(testName, testFunction) {
  testsTotal++;
  try {
    testFunction();
    console.log(`✅ ${testName}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${testName}: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

// Mock ant for testing
class MockAnt {
  constructor(faction = null) {
    this.faction = faction;
    this.stateMachine = new AntStateMachine(this);
    
    if (faction && faction.addAnt) {
      faction.addAnt(this);
    }
  }
}

// Test 1: State machine constructor accepts ant reference
runTest("State machine accepts ant reference", () => {
  const ant = new MockAnt();
  const sm = new AntStateMachine(ant);
  assert(sm._ant === ant, "State machine should store ant reference");
});

// Test 2: Backward compatibility with no ant reference
runTest("Backward compatibility - no ant reference", () => {
  const sm = new AntStateMachine();
  assert(sm._ant === null, "State machine should handle null ant reference");
  assert(sm.canPerformAction("move"), "Should still allow basic actions");
});

// Test 3: Faction permission checking
runTest("Faction permission checking - enemies", () => {
  const redFaction = createFaction("Red", "#FF0000");
  const blueFaction = createFaction("Blue", "#0000FF");
  
  // Set hostile relationship
  redFaction.relationships.set("Blue", 10); // Enemies
  
  const redAnt = new MockAnt(redFaction);
  const blueAnt = new MockAnt(blueFaction);
  
  // Should be able to attack enemies
  assert(redAnt.stateMachine._checkFactionPermission("attack", blueAnt), "Should allow attacking enemies");
  
  // Should not be able to socialize with enemies
  assert(!redAnt.stateMachine._checkFactionPermission("socialize", blueAnt), "Should not allow socializing with enemies");
});

// Test 4: Faction permission checking - allies
runTest("Faction permission checking - allies", () => {
  const redFaction = createFaction("Red2", "#FF0000");
  const blueFaction = createFaction("Blue2", "#0000FF");
  
  // Set allied relationship
  redFaction.relationships.set("Blue2", 90); // Allied
  
  const redAnt = new MockAnt(redFaction);
  const blueAnt = new MockAnt(blueFaction);
  
  // Should not be able to attack allies
  assert(!redAnt.stateMachine._checkFactionPermission("attack", blueAnt), "Should not allow attacking allies");
  
  // Should be able to socialize with allies
  assert(redAnt.stateMachine._checkFactionPermission("socialize", blueAnt), "Should allow socializing with allies");
  
  // Should be able to follow allies
  assert(redAnt.stateMachine._checkFactionPermission("follow", blueAnt), "Should allow following allies");
});

// Test 5: Combined state and faction permissions
runTest("Combined state and faction permissions", () => {
  const redFaction = createFaction("Red3", "#FF0000");
  const blueFaction = createFaction("Blue3", "#0000FF");
  
  // Set enemy relationship
  redFaction.relationships.set("Blue3", 5); // Enemies
  
  const redAnt = new MockAnt(redFaction);
  const blueAnt = new MockAnt(blueFaction);
  
  // Out of combat - should not be able to attack despite being enemies
  redAnt.stateMachine.setCombatModifier("OUT_OF_COMBAT");
  assert(!redAnt.stateMachine.canPerformAction("attack", blueAnt), "Should not attack when out of combat");
  
  // In combat - should be able to attack enemies
  redAnt.stateMachine.setCombatModifier("IN_COMBAT");
  assert(redAnt.stateMachine.canPerformAction("attack", blueAnt), "Should attack enemies when in combat");
});

// Test 6: Automatic faction behaviors - auto attack
runTest("Automatic faction behaviors - auto attack", () => {
  const redFaction = createFaction("Red4", "#FF0000");
  const blueFaction = createFaction("Blue4", "#0000FF");
  
  // Set enemy relationship
  redFaction.relationships.set("Blue4", 5); // Enemies (attackOnSight = true)
  
  const redAnt = new MockAnt(redFaction);
  const blueAnt = new MockAnt(blueFaction);
  
  // Should be out of combat initially
  assert(redAnt.stateMachine.isOutOfCombat(), "Should start out of combat");
  
  // Trigger automatic behavior
  redAnt.stateMachine.checkAutomaticFactionBehaviors([blueAnt]);
  
  // Should now be in combat
  assert(redAnt.stateMachine.isInCombat(), "Should enter combat automatically");
});

// Test 7: Automatic faction behaviors - ally assistance
runTest("Automatic faction behaviors - ally assistance", () => {
  const redFaction = createFaction("Red5", "#FF0000");
  const greenFaction = createFaction("Green5", "#00FF00");
  
  // Set allied relationship
  redFaction.relationships.set("Green5", 90); // Allied
  
  const redAnt = new MockAnt(redFaction);
  const greenAnt = new MockAnt(greenFaction);
  
  // Green ant enters combat
  greenAnt.stateMachine.setCombatModifier("IN_COMBAT");
  
  // Red ant should be idle
  redAnt.stateMachine.setPrimaryState("IDLE");
  
  // Trigger automatic behavior
  redAnt.stateMachine.checkAutomaticFactionBehaviors([greenAnt]);
  
  // Red ant should now be following to help
  assert(redAnt.stateMachine.isPrimaryState("FOLLOWING"), "Should follow to help ally");
});

// Test 8: No automatic behaviors for same faction
runTest("No automatic behaviors for same faction", () => {
  const redFaction = createFaction("Red6", "#FF0000");
  
  const redAnt1 = new MockAnt(redFaction);
  const redAnt2 = new MockAnt(redFaction);
  
  // Both should start out of combat and idle
  assert(redAnt1.stateMachine.isOutOfCombat(), "Ant1 should start out of combat");
  assert(redAnt1.stateMachine.isPrimaryState("IDLE"), "Ant1 should start idle");
  
  // Trigger automatic behavior
  redAnt1.stateMachine.checkAutomaticFactionBehaviors([redAnt2]);
  
  // Should remain unchanged
  assert(redAnt1.stateMachine.isOutOfCombat(), "Ant1 should remain out of combat");
  assert(redAnt1.stateMachine.isPrimaryState("IDLE"), "Ant1 should remain idle");
});

// Test 9: Null faction handling
runTest("Null faction handling", () => {
  const redFaction = createFaction("Red7", "#FF0000");
  
  const redAnt = new MockAnt(redFaction);
  const neutralAnt = new MockAnt(); // No faction
  
  // Set combat state to enable attacking
  redAnt.stateMachine.setCombatModifier("IN_COMBAT");
  neutralAnt.stateMachine.setCombatModifier("IN_COMBAT");
  
  // Should allow actions when target has no faction
  assert(redAnt.stateMachine.canPerformAction("attack", neutralAnt), "Should allow actions with null faction target");
  
  // Should allow actions when self has no faction  
  assert(neutralAnt.stateMachine.canPerformAction("attack", redAnt), "Should allow actions with null faction self");
  
  // Should allow socializing without combat state
  redAnt.stateMachine.setCombatModifier("OUT_OF_COMBAT");
  neutralAnt.stateMachine.setCombatModifier("OUT_OF_COMBAT");
  
  assert(redAnt.stateMachine.canPerformAction("socialize", neutralAnt), "Should allow socializing with null faction");
});

// Test 10: Relationship state boundaries
runTest("Relationship state boundaries", () => {
  const testFaction = createFaction("Test", "#FFFFFF");
  
  // Test all relationship boundaries
  testFaction.relationships.set("Other", 100);
  assert(testFaction.getRelationshipState("Other").name === "ALLIED", "100 should be ALLIED");
  
  testFaction.relationships.set("Other", 80);
  assert(testFaction.getRelationshipState("Other").name === "ALLIED", "80 should be ALLIED");
  
  testFaction.relationships.set("Other", 79);
  assert(testFaction.getRelationshipState("Other").name === "NEUTRAL", "79 should be NEUTRAL");
  
  testFaction.relationships.set("Other", 20);
  assert(testFaction.getRelationshipState("Other").name === "NEUTRAL", "20 should be NEUTRAL");
  
  testFaction.relationships.set("Other", 19);
  assert(testFaction.getRelationshipState("Other").name === "ENEMIES", "19 should be ENEMIES");
  
  testFaction.relationships.set("Other", 1);
  assert(testFaction.getRelationshipState("Other").name === "ENEMIES", "1 should be ENEMIES");
  
  testFaction.relationships.set("Other", 0);
  assert(testFaction.getRelationshipState("Other").name === "BLOOD_ENEMIES", "0 should be BLOOD_ENEMIES");
});

// Test 11: Blood enemies cannot improve relations
runTest("Blood enemies cannot improve relations", () => {
  const redFaction = createFaction("Red8", "#FF0000");
  const blueFaction = createFaction("Blue8", "#0000FF");
  
  // Set as blood enemies
  redFaction.relationships.set("Blue8", 0);
  
  // Try to improve relations
  redFaction.modifyRelationship("Blue8", 50, "Peace attempt");
  
  // Should still be blood enemies
  assert(redFaction.getRelationshipValue("Blue8") === 0, "Blood enemies should not improve relations");
});

// Test 12: Faction ant management
runTest("Faction ant management", () => {
  const testFaction = createFaction("AntMgmt", "#FFFFFF");
  
  assert(testFaction.getAntCount() === 0, "Should start with 0 ants");
  
  const ant1 = new MockAnt(testFaction);
  assert(testFaction.getAntCount() === 1, "Should have 1 ant after adding");
  
  const ant2 = new MockAnt(testFaction);
  assert(testFaction.getAntCount() === 2, "Should have 2 ants after adding another");
  
  testFaction.removeAnt(ant1);
  assert(testFaction.getAntCount() === 1, "Should have 1 ant after removing one");
});

// Print results
console.log(`\\n📊 Test Results: ${testsPassed} passed, ${testsTotal - testsPassed} failed`);

if (testsPassed === testsTotal) {
  console.log("🎉 All faction-state machine integration tests passed!");
} else {
  console.log("❌ Some tests failed!");
  process.exit(1);
}