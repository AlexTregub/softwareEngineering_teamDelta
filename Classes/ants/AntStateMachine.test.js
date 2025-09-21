// Test Suite for AntStateMachine
// Run with: node AntStateMachine.test.js

// Import the AntStateMachine class
const AntStateMachine = require('./AntStateMachine.js');

class TestSuite {
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
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(`Assertion failed: ${message}. Expected: ${expected}, Actual: ${actual}`);
    }
  }

  assertTrue(condition, message) {
    this.assert(condition === true, message);
  }

  assertFalse(condition, message) {
    this.assert(condition === false, message);
  }

  run() {
    console.log('🧪 Running AntStateMachine Test Suite...\n');
    
    for (const { name, testFunction } of this.tests) {
      try {
        testFunction();
        console.log(`✅ ${name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${name}: ${error.message}`);
        this.failed++;
      }
    }

    console.log(`\n📊 Test Results: ${this.passed} passed, ${this.failed} failed`);
    
    if (this.failed === 0) {
      console.log('🎉 All tests passed!');
    } else {
      console.log('💥 Some tests failed!');
      process.exit(1);
    }
  }
}

// Initialize test suite
const testSuite = new TestSuite();

// Test 1: Basic Initialization
testSuite.test('Basic Initialization', () => {
  const sm = new AntStateMachine();
  testSuite.assertEqual(sm.primaryState, 'IDLE', 'Should start in IDLE state');
  testSuite.assertEqual(sm.combatModifier, null, 'Should have no combat modifier');
  testSuite.assertEqual(sm.terrainModifier, null, 'Should have no terrain modifier');
  testSuite.assertEqual(sm.getFullState(), 'IDLE', 'Full state should be IDLE');
});

// Test 2: Valid Primary State Transitions
testSuite.test('Valid Primary State Transitions', () => {
  const sm = new AntStateMachine();
  
  // Test all valid primary states
  const validStates = ['IDLE', 'MOVING', 'GATHERING', 'FOLLOWING'];
  
  for (const state of validStates) {
    testSuite.assertTrue(sm.setPrimaryState(state), `Should accept valid state: ${state}`);
    testSuite.assertEqual(sm.primaryState, state, `Primary state should be ${state}`);
  }
});

// Test 3: Invalid Primary State Transitions
testSuite.test('Invalid Primary State Transitions', () => {
  const sm = new AntStateMachine();
  
  const invalidStates = ['INVALID', 'ATTACKING', 'IN_WATER', '', null, undefined, 123];
  
  for (const state of invalidStates) {
    const originalState = sm.primaryState;
    testSuite.assertFalse(sm.setPrimaryState(state), `Should reject invalid state: ${state}`);
    testSuite.assertEqual(sm.primaryState, originalState, 'Primary state should remain unchanged');
  }
});

// Test 4: Valid Combat Modifier Transitions
testSuite.test('Valid Combat Modifier Transitions', () => {
  const sm = new AntStateMachine();
  
  const validCombatStates = ['IN_COMBAT', 'ATTACKING', 'DEFENDING', 'SPITTING', null];
  
  for (const combatState of validCombatStates) {
    testSuite.assertTrue(sm.setCombatModifier(combatState), `Should accept valid combat state: ${combatState}`);
    testSuite.assertEqual(sm.combatModifier, combatState, `Combat modifier should be ${combatState}`);
  }
});

// Test 5: Invalid Combat Modifier Transitions
testSuite.test('Invalid Combat Modifier Transitions', () => {
  const sm = new AntStateMachine();
  
  const invalidCombatStates = ['INVALID', 'IDLE', 'MOVING', '', undefined, 123];
  
  for (const combatState of invalidCombatStates) {
    const originalState = sm.combatModifier;
    testSuite.assertFalse(sm.setCombatModifier(combatState), `Should reject invalid combat state: ${combatState}`);
    testSuite.assertEqual(sm.combatModifier, originalState, 'Combat modifier should remain unchanged');
  }
});

// Test 6: Valid Terrain Modifier Transitions
testSuite.test('Valid Terrain Modifier Transitions', () => {
  const sm = new AntStateMachine();
  
  const validTerrainStates = ['IN_WATER', 'IN_MUD', null];
  
  for (const terrainState of validTerrainStates) {
    testSuite.assertTrue(sm.setTerrainModifier(terrainState), `Should accept valid terrain state: ${terrainState}`);
    testSuite.assertEqual(sm.terrainModifier, terrainState, `Terrain modifier should be ${terrainState}`);
  }
});

// Test 7: Invalid Terrain Modifier Transitions
testSuite.test('Invalid Terrain Modifier Transitions', () => {
  const sm = new AntStateMachine();
  
  const invalidTerrainStates = ['INVALID', 'IDLE', 'ATTACKING', '', undefined, 123];
  
  for (const terrainState of invalidTerrainStates) {
    const originalState = sm.terrainModifier;
    testSuite.assertFalse(sm.setTerrainModifier(terrainState), `Should reject invalid terrain state: ${terrainState}`);
    testSuite.assertEqual(sm.terrainModifier, originalState, 'Terrain modifier should remain unchanged');
  }
});

// Test 8: Complex State Combinations
testSuite.test('Complex State Combinations', () => {
  const sm = new AntStateMachine();
  
  // Test valid combinations
  testSuite.assertTrue(sm.setState('MOVING', 'IN_COMBAT', 'IN_WATER'), 'Should accept complex valid state');
  testSuite.assertEqual(sm.getFullState(), 'MOVING_IN_COMBAT_IN_WATER', 'Full state should combine all modifiers');
  
  testSuite.assertTrue(sm.setState('GATHERING', 'DEFENDING', null), 'Should accept state with null terrain');
  testSuite.assertEqual(sm.getFullState(), 'GATHERING_DEFENDING', 'Full state should combine primary and combat');
  
  testSuite.assertTrue(sm.setState('IDLE', null, 'IN_MUD'), 'Should accept state with null combat');
  testSuite.assertEqual(sm.getFullState(), 'IDLE_IN_MUD', 'Full state should combine primary and terrain');
});

// Test 9: Invalid Complex State Combinations
testSuite.test('Invalid Complex State Combinations', () => {
  const sm = new AntStateMachine();
  const originalState = sm.getFullState();
  
  // Test invalid combinations
  testSuite.assertFalse(sm.setState('INVALID', 'IN_COMBAT', 'IN_WATER'), 'Should reject invalid primary state');
  testSuite.assertEqual(sm.getFullState(), originalState, 'State should remain unchanged');
  
  testSuite.assertFalse(sm.setState('MOVING', 'INVALID', 'IN_WATER'), 'Should reject invalid combat state');
  testSuite.assertEqual(sm.getFullState(), originalState, 'State should remain unchanged');
  
  testSuite.assertFalse(sm.setState('MOVING', 'IN_COMBAT', 'INVALID'), 'Should reject invalid terrain state');
  testSuite.assertEqual(sm.getFullState(), originalState, 'State should remain unchanged');
});

// Test 10: Action Permissions - Movement
testSuite.test('Action Permissions - Movement', () => {
  const sm = new AntStateMachine();
  
  // Movement should be allowed in most states
  sm.setState('IDLE', null, null);
  testSuite.assertTrue(sm.canPerformAction('move'), 'Should allow movement when idle');
  
  sm.setState('MOVING', 'IN_COMBAT', null);
  testSuite.assertTrue(sm.canPerformAction('move'), 'Should allow movement during combat');
  
  sm.setState('GATHERING', 'DEFENDING', 'IN_WATER');
  testSuite.assertTrue(sm.canPerformAction('move'), 'Should allow movement while defending');
  
  // Movement should be restricted during attacking/spitting
  sm.setState('MOVING', 'ATTACKING', null);
  testSuite.assertFalse(sm.canPerformAction('move'), 'Should not allow movement while attacking');
  
  sm.setState('IDLE', 'SPITTING', null);
  testSuite.assertFalse(sm.canPerformAction('move'), 'Should not allow movement while spitting');
});

// Test 11: Action Permissions - Gathering
testSuite.test('Action Permissions - Gathering', () => {
  const sm = new AntStateMachine();
  
  // Gathering should be allowed in peaceful states
  sm.setState('IDLE', null, null);
  testSuite.assertTrue(sm.canPerformAction('gather'), 'Should allow gathering when idle');
  
  sm.setState('GATHERING', null, 'IN_WATER');
  testSuite.assertTrue(sm.canPerformAction('gather'), 'Should allow gathering in water');
  
  sm.setState('MOVING', 'DEFENDING', null);
  testSuite.assertTrue(sm.canPerformAction('gather'), 'Should allow gathering while defending');
  
  // Gathering should be restricted during aggressive actions
  sm.setState('IDLE', 'ATTACKING', null);
  testSuite.assertFalse(sm.canPerformAction('gather'), 'Should not allow gathering while attacking');
  
  sm.setState('GATHERING', 'SPITTING', null);
  testSuite.assertFalse(sm.canPerformAction('gather'), 'Should not allow gathering while spitting');
  
  sm.setState('FOLLOWING', null, null);
  testSuite.assertFalse(sm.canPerformAction('gather'), 'Should not allow gathering while following');
});

// Test 12: Action Permissions - Combat Actions
testSuite.test('Action Permissions - Combat Actions', () => {
  const sm = new AntStateMachine();
  
  // Combat actions should only be allowed in combat states
  sm.setState('IDLE', null, null);
  testSuite.assertFalse(sm.canPerformAction('attack'), 'Should not allow attack when not in combat');
  testSuite.assertFalse(sm.canPerformAction('defend'), 'Should not allow defend when not in combat');
  testSuite.assertFalse(sm.canPerformAction('spit'), 'Should not allow spit when not in combat');
  
  sm.setState('MOVING', 'IN_COMBAT', null);
  testSuite.assertTrue(sm.canPerformAction('attack'), 'Should allow attack when in combat');
  testSuite.assertTrue(sm.canPerformAction('defend'), 'Should allow defend when in combat');
  testSuite.assertTrue(sm.canPerformAction('spit'), 'Should allow spit when in combat');
  
  sm.setState('GATHERING', 'ATTACKING', null);
  testSuite.assertTrue(sm.canPerformAction('attack'), 'Should allow attack when attacking');
  
  sm.setState('IDLE', 'DEFENDING', null);
  testSuite.assertTrue(sm.canPerformAction('defend'), 'Should allow defend when defending');
  
  sm.setState('MOVING', 'SPITTING', null);
  testSuite.assertTrue(sm.canPerformAction('spit'), 'Should allow spit when spitting');
});

// Test 13: State Query Methods
testSuite.test('State Query Methods', () => {
  const sm = new AntStateMachine();
  
  // Test idle state
  sm.setState('IDLE', null, null);
  testSuite.assertTrue(sm.isIdle(), 'Should be idle when in IDLE state with no modifiers');
  testSuite.assertTrue(sm.isPrimaryState('IDLE'), 'Should be in IDLE primary state');
  testSuite.assertFalse(sm.isInCombat(), 'Should not be in combat');
  
  // Test non-idle state
  sm.setState('IDLE', 'IN_COMBAT', null);
  testSuite.assertFalse(sm.isIdle(), 'Should not be idle when in combat');
  testSuite.assertTrue(sm.isInCombat(), 'Should be in combat');
  
  // Test terrain queries
  sm.setState('MOVING', null, 'IN_WATER');
  testSuite.assertTrue(sm.isOnTerrain('IN_WATER'), 'Should be on water terrain');
  testSuite.assertFalse(sm.isOnTerrain('IN_MUD'), 'Should not be on mud terrain');
  
  // Test specific state queries
  sm.setState('MOVING', null, null);
  testSuite.assertTrue(sm.isMoving(), 'Should be moving');
  testSuite.assertFalse(sm.isGathering(), 'Should not be gathering');
  
  sm.setState('GATHERING', null, null);
  testSuite.assertTrue(sm.isGathering(), 'Should be gathering');
  testSuite.assertFalse(sm.isFollowing(), 'Should not be following');
  
  sm.setState('FOLLOWING', null, null);
  testSuite.assertTrue(sm.isFollowing(), 'Should be following');
  testSuite.assertFalse(sm.isMoving(), 'Should not be moving');
});

// Test 14: State Reset and Clear Operations
testSuite.test('State Reset and Clear Operations', () => {
  const sm = new AntStateMachine();
  
  // Set complex state
  sm.setState('GATHERING', 'ATTACKING', 'IN_MUD');
  testSuite.assertEqual(sm.getFullState(), 'GATHERING_ATTACKING_IN_MUD', 'Should have complex state');
  
  // Clear modifiers
  sm.clearModifiers();
  testSuite.assertEqual(sm.getFullState(), 'GATHERING', 'Should only have primary state after clearing modifiers');
  testSuite.assertEqual(sm.combatModifier, null, 'Combat modifier should be null');
  testSuite.assertEqual(sm.terrainModifier, null, 'Terrain modifier should be null');
  
  // Reset completely
  sm.setState('FOLLOWING', 'SPITTING', 'IN_WATER');
  sm.reset();
  testSuite.assertEqual(sm.getFullState(), 'IDLE', 'Should be IDLE after reset');
  testSuite.assertEqual(sm.primaryState, 'IDLE', 'Primary state should be IDLE');
  testSuite.assertEqual(sm.combatModifier, null, 'Combat modifier should be null after reset');
  testSuite.assertEqual(sm.terrainModifier, null, 'Terrain modifier should be null after reset');
});

// Test 15: State Change Callbacks
testSuite.test('State Change Callbacks', () => {
  const sm = new AntStateMachine();
  let callbackCalled = false;
  let oldStateReceived = null;
  let newStateReceived = null;
  
  // Set callback
  sm.setStateChangeCallback((oldState, newState) => {
    callbackCalled = true;
    oldStateReceived = oldState;
    newStateReceived = newState;
  });
  
  // Change state
  sm.setPrimaryState('MOVING');
  
  testSuite.assertTrue(callbackCalled, 'Callback should be called on state change');
  testSuite.assertEqual(oldStateReceived, 'IDLE', 'Should receive correct old state');
  testSuite.assertEqual(newStateReceived, 'MOVING', 'Should receive correct new state');
  
  // Reset callback tracking
  callbackCalled = false;
  
  // No change should not trigger callback
  sm.setPrimaryState('MOVING');
  testSuite.assertFalse(callbackCalled, 'Callback should not be called when state doesn\'t change');
});

// Test 16: Edge Cases and Error Handling
testSuite.test('Edge Cases and Error Handling', () => {
  const sm = new AntStateMachine();
  
  // Test with various falsy values
  testSuite.assertFalse(sm.setPrimaryState(''), 'Should reject empty string');
  testSuite.assertFalse(sm.setPrimaryState(null), 'Should reject null');
  testSuite.assertFalse(sm.setPrimaryState(undefined), 'Should reject undefined');
  testSuite.assertFalse(sm.setPrimaryState(0), 'Should reject number 0');
  testSuite.assertFalse(sm.setPrimaryState(false), 'Should reject boolean false');
  
  // Test action permission with case variations
  sm.setState('MOVING', 'ATTACKING', null);
  testSuite.assertFalse(sm.canPerformAction('MOVE'), 'Should handle uppercase action names');
  testSuite.assertFalse(sm.canPerformAction('Move'), 'Should handle mixed case action names');
  testSuite.assertTrue(sm.canPerformAction('unknown_action'), 'Should return true for unknown actions');
  
  // Test state summary
  const summary = sm.getStateSummary();
  testSuite.assertEqual(typeof summary, 'object', 'State summary should be an object');
  testSuite.assertTrue('fullState' in summary, 'Summary should include fullState');
  testSuite.assertTrue('canMove' in summary, 'Summary should include canMove');
  testSuite.assertTrue('canGather' in summary, 'Summary should include canGather');
  testSuite.assertTrue('canAttack' in summary, 'Summary should include canAttack');
});

// Test 17: All State Combinations Test
testSuite.test('All Valid State Combinations', () => {
  const sm = new AntStateMachine();
  
  const primaryStates = ['IDLE', 'MOVING', 'GATHERING', 'FOLLOWING'];
  const combatStates = [null, 'IN_COMBAT', 'ATTACKING', 'DEFENDING', 'SPITTING'];
  const terrainStates = [null, 'IN_WATER', 'IN_MUD'];
  
  let combinationCount = 0;
  
  for (const primary of primaryStates) {
    for (const combat of combatStates) {
      for (const terrain of terrainStates) {
        testSuite.assertTrue(
          sm.setState(primary, combat, terrain),
          `Should accept combination: ${primary}, ${combat}, ${terrain}`
        );
        
        const expectedState = [primary, combat, terrain].filter(s => s !== null).join('_');
        testSuite.assertEqual(
          sm.getFullState(),
          expectedState,
          `Full state should match expected: ${expectedState}`
        );
        
        combinationCount++;
      }
    }
  }
  
  console.log(`    Tested ${combinationCount} valid state combinations`);
});

// Run all tests
testSuite.run();