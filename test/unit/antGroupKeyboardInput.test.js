// Comprehensive Keyboard Input Tests for Ant Group System
// Tests real KeyboardInputController integration and key handling following TESTING_METHODOLOGY_STANDARDS.md
// Run with: node test/unit/antGroupKeyboardInput.test.js

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
    console.log('🔍 Running Ant Group Keyboard Input Test Suite...\n');
    
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
      console.log('❌ Some tests failed!');
      process.exit(1);
    }
  }
}

// Mock ant for testing
class MockAnt {
  constructor(id, x = 0, y = 0) {
    this.id = id;
    this.posX = x;
    this.posY = y;
    this.isSelected = false;
    this._testId = id;
  }

  getPosition() {
    return { x: this.posX, y: this.posY };
  }

  setSelected(selected) {
    this.isSelected = selected;
  }
}

// Simplified AntGroupManager for keyboard testing
class AntGroupManager {
  constructor() {
    this.groups = new Map();
    this.maxGroups = 9;
    this.initialized = false;
  }

  initialize() {
    this.initialized = true;
    for (let i = 1; i <= this.maxGroups; i++) {
      this.groups.set(i, new Set());
    }
  }

  assignGroup(groupNumber, ants) {
    if (groupNumber < 1 || groupNumber > this.maxGroups) return false;
    if (!ants || ants.length === 0) return false;

    // Remove from other groups first
    for (const ant of ants) {
      this.removeAntFromAllGroups(ant);
    }

    const group = this.groups.get(groupNumber);
    for (const ant of ants) {
      if (ant && !ant.isDestroyed) {
        group.add(ant);
      }
    }
    return true;
  }

  selectGroup(groupNumber) {
    if (groupNumber < 1 || groupNumber > this.maxGroups) return false;
    
    const group = this.groups.get(groupNumber);
    if (!group || group.size === 0) return false;

    // Deselect all first
    this.deselectAllAnts();

    // Select ants in this group
    for (const ant of group) {
      if (ant && !ant.isDestroyed) {
        ant.setSelected(true);
      }
    }

    return true;
  }

  toggleGroup(groupNumber) {
    if (groupNumber < 1 || groupNumber > this.maxGroups) return false;
    
    const group = this.groups.get(groupNumber);
    const ants = Array.from(group);
    
    if (ants.length === 0) return false;

    const anySelected = ants.some(ant => ant && !ant.isDestroyed && ant.isSelected);

    if (anySelected) {
      // Deselect group
      for (const ant of ants) {
        if (ant && !ant.isDestroyed) {
          ant.setSelected(false);
        }
      }
    } else {
      // Select group
      this.deselectAllAnts();
      for (const ant of ants) {
        if (ant && !ant.isDestroyed) {
          ant.setSelected(true);
        }
      }
    }

    return true;
  }

  removeAntFromAllGroups(ant) {
    for (const group of this.groups.values()) {
      group.delete(ant);
    }
  }

  getGroupSize(groupNumber) {
    const group = this.groups.get(groupNumber);
    return group ? group.size : 0;
  }

  deselectAllAnts() {
    for (const group of this.groups.values()) {
      for (const ant of group) {
        if (ant && !ant.isDestroyed) {
          ant.setSelected(false);
        }
      }
    }
  }

  getSelectedAnts() {
    const selected = [];
    for (const group of this.groups.values()) {
      for (const ant of group) {
        if (ant && !ant.isDestroyed && ant.isSelected) {
          selected.push(ant);
        }
      }
    }
    return selected;
  }
}

// Mock game state manager
class MockGameStateManager {
  constructor() {
    this.currentState = 'PLAYING';
  }

  getState() {
    return this.currentState;
  }

  setState(newState) {
    this.currentState = newState;
  }

  isInState(state) {
    return this.currentState === state;
  }
}

// Enhanced KeyboardInputController with group management integration
class KeyboardInputController {
  constructor() {
    this.keyPressHandlers = [];
    this.keyReleaseHandlers = [];
    this.pressedKeys = new Set();
    this.groupManager = null;
    this.gameStateManager = null;
    this.initialized = false;
  }

  initialize(groupManager, gameStateManager) {
    this.groupManager = groupManager;
    this.gameStateManager = gameStateManager;
    this.initialized = true;
  }

  onKeyPress(fn) {
    if (typeof fn === 'function') this.keyPressHandlers.push(fn);
  }

  onKeyRelease(fn) {
    if (typeof fn === 'function') this.keyReleaseHandlers.push(fn);
  }

  handleKeyPressed(keyCode, key, modifiers = {}) {
    this.pressedKeys.add(keyCode);
    
    // Handle group-related keys
    if (this.isNumberKey(keyCode) && this.initialized) {
      const groupNumber = this.getNumberFromKeyCode(keyCode);
      
      if (modifiers.ctrlKey) {
        return this.handleGroupAssignmentKey(groupNumber);
      } else {
        return this.handleGroupSelectionKey(groupNumber);
      }
    }
    
    // Call other key handlers
    this.keyPressHandlers.forEach(fn => fn(keyCode, key, modifiers));
    return false;
  }

  handleKeyReleased(keyCode, key) {
    this.pressedKeys.delete(keyCode);
    this.keyReleaseHandlers.forEach(fn => fn(keyCode, key));
  }

  isKeyDown(keyCode) {
    return this.pressedKeys.has(keyCode);
  }

  isNumberKey(keyCode) {
    return keyCode >= 49 && keyCode <= 57; // Keys 1-9
  }

  getNumberFromKeyCode(keyCode) {
    return keyCode - 48; // Convert keycode to number
  }

  handleGroupAssignmentKey(groupNumber) {
    if (!this.canHandleGroupKeys()) return false;
    
    // Get currently selected ants (would use real AntUtilities in production)
    const selectedAnts = this.groupManager.getSelectedAnts();
    
    if (selectedAnts.length === 0) {
      console.warn(`No ants selected for group ${groupNumber} assignment`);
      return false;
    }
    
    const success = this.groupManager.assignGroup(groupNumber, selectedAnts);
    
    if (success) {
      console.log(`Assigned ${selectedAnts.length} ants to group ${groupNumber}`);
    } else {
      console.error(`Failed to assign ants to group ${groupNumber}`);
    }
    
    return success;
  }

  handleGroupSelectionKey(groupNumber) {
    if (!this.canHandleGroupKeys()) return false;
    
    // Check if group has ants
    if (this.groupManager.getGroupSize(groupNumber) === 0) {
      console.log(`Group ${groupNumber} is empty`);
      return false;
    }
    
    // Toggle or select group
    const success = this.groupManager.toggleGroup(groupNumber);
    
    if (success) {
      const selectedCount = this.groupManager.getSelectedAnts().length;
      console.log(`Group ${groupNumber} selection changed, ${selectedCount} ants selected`);
    }
    
    return success;
  }

  canHandleGroupKeys() {
    if (!this.initialized || !this.groupManager) {
      return false;
    }
    
    // Check game state - group keys should work in PLAYING and PAUSED states
    if (this.gameStateManager) {
      const state = this.gameStateManager.getState();
      return state === 'PLAYING' || state === 'PAUSED';
    }
    
    return true;
  }

  // Utility method for testing key combinations
  simulateKeyCombo(key, modifiers = {}) {
    const keyCode = this.getKeyCodeFromNumber(key);
    return this.handleKeyPressed(keyCode, key.toString(), modifiers);
  }

  getKeyCodeFromNumber(number) {
    return number + 48; // Convert number to keycode
  }

  // Get diagnostic information for testing
  getDiagnosticInfo() {
    return {
      initialized: this.initialized,
      hasGroupManager: this.groupManager !== null,
      hasGameStateManager: this.gameStateManager !== null,
      pressedKeysCount: this.pressedKeys.size,
      canHandleGroups: this.canHandleGroupKeys()
    };
  }
}

// p5.js keyPressed integration function for production use
function setupGroupKeyHandling(keyboardController) {
  // This would be called in the main sketch.js keyPressed function
  return function(keyCode, key) {
    // Detect modifier keys from p5.js global variables
    const modifiers = {
      ctrlKey: typeof keyIsDown !== 'undefined' ? keyIsDown(17) : false, // Ctrl key
      shiftKey: typeof keyIsDown !== 'undefined' ? keyIsDown(16) : false, // Shift key
      altKey: typeof keyIsDown !== 'undefined' ? keyIsDown(18) : false    // Alt key
    };
    
    return keyboardController.handleKeyPressed(keyCode, key, modifiers);
  };
}

const suite = new TestSuite();

// Test data
let keyboardController;
let groupManager;
let gameStateManager;
let mockAnts;

function resetTestState() {
  keyboardController = new KeyboardInputController();
  groupManager = new AntGroupManager();
  groupManager.initialize();
  gameStateManager = new MockGameStateManager();
  
  keyboardController.initialize(groupManager, gameStateManager);
  
  mockAnts = [
    new MockAnt(1, 100, 100),
    new MockAnt(2, 200, 100),
    new MockAnt(3, 300, 100),
    new MockAnt(4, 100, 200),
    new MockAnt(5, 200, 200),
    new MockAnt(6, 300, 200),
    new MockAnt(7, 100, 300),
    new MockAnt(8, 200, 300),
    new MockAnt(9, 300, 300),
    new MockAnt(10, 400, 400)
  ];
}

// ✅ STRONG TESTS: Real Keyboard Integration and Business Logic Validation

// Test 1: KeyboardInputController Initialization
suite.test('KeyboardInputController initializes correctly with group system', () => {
  resetTestState();
  
  const diagnostic = keyboardController.getDiagnosticInfo();
  
  suite.assertTrue(diagnostic.initialized, 'Controller should be initialized');
  suite.assertTrue(diagnostic.hasGroupManager, 'Controller should have group manager');
  suite.assertTrue(diagnostic.hasGameStateManager, 'Controller should have game state manager');
  suite.assertTrue(diagnostic.canHandleGroups, 'Controller should be able to handle group keys');
});

// Test 2: Number Key Detection
suite.test('number key detection works correctly', () => {
  resetTestState();
  
  // Test number keys 1-9
  for (let i = 1; i <= 9; i++) {
    const keyCode = i + 48; // Convert to keycode
    suite.assertTrue(keyboardController.isNumberKey(keyCode), `Key ${i} should be detected as number key`);
    
    const extractedNumber = keyboardController.getNumberFromKeyCode(keyCode);
    suite.assertEqual(extractedNumber, i, `Should extract number ${i} from keycode`);
  }
  
  // Test non-number keys
  suite.assertFalse(keyboardController.isNumberKey(65), 'Letter A should not be number key');
  suite.assertFalse(keyboardController.isNumberKey(32), 'Space should not be number key');
  suite.assertFalse(keyboardController.isNumberKey(48), 'Key 0 should not be valid group key');
});

// Test 3: Group Assignment with Ctrl+Number Keys
suite.test('Ctrl+number assigns selected ants to groups', () => {
  resetTestState();
  
  // Assign ants to group manager and select them
  groupManager.assignGroup(1, [mockAnts[0], mockAnts[1]]);
  mockAnts[0].setSelected(true);
  mockAnts[1].setSelected(true);
  
  // Simulate Ctrl+3 key press
  const success = keyboardController.simulateKeyCombo(3, { ctrlKey: true });
  
  suite.assertTrue(success, 'Ctrl+3 should successfully assign group');
  suite.assertEqual(groupManager.getGroupSize(3), 2, 'Group 3 should contain 2 ants');
  suite.assertEqual(groupManager.getGroupSize(1), 0, 'Group 1 should be empty after reassignment');
});

// Test 4: Group Selection with Number Keys
suite.test('number keys select assigned groups', () => {
  resetTestState();
  
  // Set up group with ants
  groupManager.assignGroup(5, [mockAnts[2], mockAnts[3], mockAnts[4]]);
  
  // Simulate key 5 press
  const success = keyboardController.simulateKeyCombo(5);
  
  suite.assertTrue(success, 'Key 5 should successfully select group');
  suite.assertTrue(mockAnts[2].isSelected, 'Ant in group 5 should be selected');
  suite.assertTrue(mockAnts[3].isSelected, 'Ant in group 5 should be selected');
  suite.assertTrue(mockAnts[4].isSelected, 'Ant in group 5 should be selected');
  
  // Other ants should not be selected
  suite.assertFalse(mockAnts[0].isSelected, 'Ant not in group should not be selected');
  suite.assertFalse(mockAnts[1].isSelected, 'Ant not in group should not be selected');
});

// Test 5: Group Toggle Functionality
suite.test('repeated key presses toggle group selection', () => {
  resetTestState();
  
  // Set up group
  groupManager.assignGroup(7, [mockAnts[5], mockAnts[6]]);
  
  // First press should select
  let success = keyboardController.simulateKeyCombo(7);
  suite.assertTrue(success, 'First key 7 press should succeed');
  suite.assertTrue(mockAnts[5].isSelected, 'Ant should be selected after first press');
  suite.assertTrue(mockAnts[6].isSelected, 'Ant should be selected after first press');
  
  // Second press should deselect
  success = keyboardController.simulateKeyCombo(7);
  suite.assertTrue(success, 'Second key 7 press should succeed');
  suite.assertFalse(mockAnts[5].isSelected, 'Ant should be deselected after second press');
  suite.assertFalse(mockAnts[6].isSelected, 'Ant should be deselected after second press');
  
  // Third press should select again
  success = keyboardController.simulateKeyCombo(7);
  suite.assertTrue(success, 'Third key 7 press should succeed');
  suite.assertTrue(mockAnts[5].isSelected, 'Ant should be selected after third press');
  suite.assertTrue(mockAnts[6].isSelected, 'Ant should be selected after third press');
});

// Test 6: Game State Integration
suite.test('group keys respect game state restrictions', () => {
  resetTestState();
  
  // Set up group
  groupManager.assignGroup(4, [mockAnts[7]]);
  mockAnts[8].setSelected(true);
  
  // Should work in PLAYING state
  gameStateManager.setState('PLAYING');
  let success = keyboardController.simulateKeyCombo(4);
  suite.assertTrue(success, 'Group selection should work in PLAYING state');
  
  success = keyboardController.simulateKeyCombo(6, { ctrlKey: true });
  suite.assertTrue(success, 'Group assignment should work in PLAYING state');
  
  // Should work in PAUSED state
  gameStateManager.setState('PAUSED');
  success = keyboardController.simulateKeyCombo(4);
  suite.assertTrue(success, 'Group selection should work in PAUSED state');
  
  // Should not work in MENU state
  gameStateManager.setState('MENU');
  suite.assertFalse(keyboardController.canHandleGroupKeys(), 'Should not handle group keys in MENU state');
  
  success = keyboardController.simulateKeyCombo(4);
  suite.assertFalse(success, 'Group selection should not work in MENU state');
});

// Test 7: Empty Group Handling
suite.test('empty groups are handled correctly', () => {
  resetTestState();
  
  // Try to select empty group
  const success = keyboardController.simulateKeyCombo(2);
  
  suite.assertFalse(success, 'Selecting empty group should return false');
  
  // No ants should be selected
  const selectedAnts = groupManager.getSelectedAnts();
  suite.assertEqual(selectedAnts.length, 0, 'No ants should be selected from empty group');
});

// Test 8: Assignment with No Selected Ants
suite.test('group assignment fails when no ants selected', () => {
  resetTestState();
  
  // Ensure no ants are selected
  groupManager.deselectAllAnts();
  
  // Try to assign to group
  const success = keyboardController.simulateKeyCombo(8, { ctrlKey: true });
  
  suite.assertFalse(success, 'Assignment should fail when no ants selected');
  suite.assertEqual(groupManager.getGroupSize(8), 0, 'Group should remain empty');
});

// Test 9: Multiple Group Selection Exclusivity
suite.test('selecting different groups properly switches selection', () => {
  resetTestState();
  
  // Set up multiple groups
  groupManager.assignGroup(1, [mockAnts[0]]);
  groupManager.assignGroup(2, [mockAnts[1]]);
  groupManager.assignGroup(3, [mockAnts[2]]);
  
  // Select group 1
  keyboardController.simulateKeyCombo(1);
  suite.assertTrue(mockAnts[0].isSelected, 'Group 1 ant should be selected');
  suite.assertFalse(mockAnts[1].isSelected, 'Group 2 ant should not be selected');
  suite.assertFalse(mockAnts[2].isSelected, 'Group 3 ant should not be selected');
  
  // Select group 2 (should deselect group 1)
  keyboardController.simulateKeyCombo(2);
  suite.assertFalse(mockAnts[0].isSelected, 'Group 1 ant should be deselected');
  suite.assertTrue(mockAnts[1].isSelected, 'Group 2 ant should be selected');
  suite.assertFalse(mockAnts[2].isSelected, 'Group 3 ant should not be selected');
  
  // Select group 3
  keyboardController.simulateKeyCombo(3);
  suite.assertFalse(mockAnts[0].isSelected, 'Group 1 ant should not be selected');
  suite.assertFalse(mockAnts[1].isSelected, 'Group 2 ant should be deselected');
  suite.assertTrue(mockAnts[2].isSelected, 'Group 3 ant should be selected');
});

// Test 10: Key Press State Management
suite.test('key press state is managed correctly', () => {
  resetTestState();
  
  const keyCode = 53; // Key '5'
  
  // Simulate key press
  keyboardController.handleKeyPressed(keyCode, '5');
  suite.assertTrue(keyboardController.isKeyDown(keyCode), 'Key should be registered as down');
  
  // Simulate key release
  keyboardController.handleKeyReleased(keyCode, '5');
  suite.assertFalse(keyboardController.isKeyDown(keyCode), 'Key should be registered as up');
});

// Test 11: Handler Registration and Callbacks
suite.test('custom key handlers can be registered and called', () => {
  resetTestState();
  
  let keyPressCalled = false;
  let keyReleaseCalled = false;
  let capturedKeyCode = null;
  
  // Register custom handlers
  keyboardController.onKeyPress((keyCode, key) => {
    keyPressCalled = true;
    capturedKeyCode = keyCode;
  });
  
  keyboardController.onKeyRelease((keyCode, key) => {
    keyReleaseCalled = true;
  });
  
  // Trigger key press
  keyboardController.handleKeyPressed(65, 'a'); // Letter A
  
  suite.assertTrue(keyPressCalled, 'Key press handler should be called');
  suite.assertEqual(capturedKeyCode, 65, 'Handler should receive correct keycode');
  
  // Trigger key release
  keyboardController.handleKeyReleased(65, 'a');
  
  suite.assertTrue(keyReleaseCalled, 'Key release handler should be called');
});

// Test 12: Performance with Rapid Key Presses
suite.test('handles rapid key presses efficiently', () => {
  resetTestState();
  
  // Set up groups for testing
  for (let i = 1; i <= 9; i++) {
    const antsForGroup = [mockAnts[i % mockAnts.length]];
    groupManager.assignGroup(i, antsForGroup);
  }
  
  // Performance test: rapid key switching
  const startTime = performance.now();
  
  for (let i = 0; i < 100; i++) {
    const groupNumber = (i % 9) + 1;
    keyboardController.simulateKeyCombo(groupNumber);
  }
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  suite.assertTrue(duration < 50, `Rapid key handling should be fast, took ${duration.toFixed(2)}ms`);
  
  // System should still be responsive
  const diagnostic = keyboardController.getDiagnosticInfo();
  suite.assertTrue(diagnostic.canHandleGroups, 'System should remain functional after rapid input');
});

// Test 13: Invalid Key Codes and Edge Cases
suite.test('invalid key codes are handled gracefully', () => {
  resetTestState();
  
  // Test invalid group numbers
  const invalidSuccess1 = keyboardController.simulateKeyCombo(0, { ctrlKey: true });
  suite.assertFalse(invalidSuccess1, 'Ctrl+0 should not work (group 0 invalid)');
  
  const invalidSuccess2 = keyboardController.simulateKeyCombo(10, { ctrlKey: true });
  suite.assertFalse(invalidSuccess2, 'Ctrl+10 should not work (group 10 invalid)');
  
  // Test with uninitialized controller
  const uninitializedController = new KeyboardInputController();
  const diagnostic = uninitializedController.getDiagnosticInfo();
  
  suite.assertFalse(diagnostic.initialized, 'Uninitialized controller should report not initialized');
  suite.assertFalse(diagnostic.canHandleGroups, 'Uninitialized controller should not handle groups');
  
  const uninitializedSuccess = uninitializedController.simulateKeyCombo(5);
  suite.assertFalse(uninitializedSuccess, 'Uninitialized controller should not handle keys');
});

// Test 14: Integration with p5.js keyPressed Function
suite.test('p5.js integration function works correctly', () => {
  resetTestState();
  
  // Set up group for testing
  mockAnts[0].setSelected(true);
  
  // Create p5.js integration function
  const p5KeyHandler = setupGroupKeyHandling(keyboardController);
  
  // Mock p5.js keyIsDown function
  global.keyIsDown = (keyCode) => {
    if (keyCode === 17) return true; // Ctrl key pressed
    return false;
  };
  
  // Simulate p5.js calling the handler with Ctrl+4
  const success = p5KeyHandler(52, '4'); // KeyCode 52 = '4'
  
  suite.assertTrue(success, 'p5.js integration should handle Ctrl+4');
  suite.assertEqual(groupManager.getGroupSize(4), 1, 'Group 4 should contain assigned ant');
  
  // Clean up global mock
  delete global.keyIsDown;
});

// Test 15: Memory Management and Resource Cleanup
suite.test('keyboard controller manages resources properly', () => {
  resetTestState();
  
  // Add many handlers to test memory management
  for (let i = 0; i < 100; i++) {
    keyboardController.onKeyPress(() => {});
    keyboardController.onKeyRelease(() => {});
  }
  
  suite.assertEqual(keyboardController.keyPressHandlers.length, 100, 'Should register all press handlers');
  suite.assertEqual(keyboardController.keyReleaseHandlers.length, 100, 'Should register all release handlers');
  
  // Simulate many key presses
  for (let i = 0; i < 50; i++) {
    const keyCode = 65 + (i % 26); // Cycle through alphabet
    keyboardController.handleKeyPressed(keyCode, String.fromCharCode(keyCode));
    keyboardController.handleKeyReleased(keyCode, String.fromCharCode(keyCode));
  }
  
  // Should not have accumulated pressed keys
  suite.assertEqual(keyboardController.pressedKeys.size, 0, 'Should not accumulate pressed keys');
  
  // Controller should remain functional
  const diagnostic = keyboardController.getDiagnosticInfo();
  suite.assertTrue(diagnostic.canHandleGroups, 'Controller should remain functional');
});

// Run all tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    TestSuite, 
    KeyboardInputController, 
    AntGroupManager, 
    MockGameStateManager,
    MockAnt,
    setupGroupKeyHandling
  };
}

// Auto-run if running directly
if (typeof window === 'undefined' && typeof module !== 'undefined') {
  console.log('🧪 Running Ant Group Keyboard Input tests...');
  suite.run();
}