// Test suite for AntManager class
// Tests ant management functionality in isolation

// Simple test framework
const testSuite = {
  tests: [],
  passed: 0,
  failed: 0,
  
  test(name, fn) {
    this.tests.push({ name, fn });
  },
  
  assertTrue(condition, message = '') {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  },
  
  assertEqual(actual, expected, message = '') {
    if (actual !== expected) {
      throw new Error(`Assertion failed: Expected "${expected}", got "${actual}". ${message}`);
    }
  },
  
  run() {
    console.log('🧪 Running AntManager Test Suite...\n');
    
    for (const test of this.tests) {
      try {
        test.fn();
        console.log(`✅ ${test.name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
        this.failed++;
      }
    }
    
    console.log(`\n📊 Test Results: ${this.passed} passed, ${this.failed} failed`);
    if (this.failed === 0) {
      console.log('🎉 All tests passed!');
    }
    
    return this.failed === 0;
  }
};

// Import AntManager
const AntManager = require('../Classes/managers/AntManager.js');

// Test 1: Constructor
testSuite.test('AntManager constructor initializes correctly', () => {
  const manager = new AntManager();
  testSuite.assertEqual(manager.selectedAnt, null, 'Should initialize with no selected ant');
  testSuite.assertEqual(manager.hasSelection(), false, 'Should have no selection initially');
});

// Test 2: Set and get selected ant
testSuite.test('AntManager set and get selected ant', () => {
  const manager = new AntManager();
  const mockAnt = { antIndex: 1, isSelected: false };
  
  manager.setSelectedAnt(mockAnt);
  testSuite.assertEqual(manager.getSelectedAnt(), mockAnt, 'Should return the set ant');
  testSuite.assertTrue(manager.hasSelection(), 'Should have a selection');
});

// Test 3: Clear selection
testSuite.test('AntManager clear selection', () => {
  const manager = new AntManager();
  const mockAnt = { antIndex: 1, isSelected: true };
  
  manager.setSelectedAnt(mockAnt);
  manager.clearSelection();
  
  testSuite.assertEqual(manager.getSelectedAnt(), null, 'Should clear selected ant');
  testSuite.assertEqual(mockAnt.isSelected, false, 'Should set ant isSelected to false');
  testSuite.assertEqual(manager.hasSelection(), false, 'Should have no selection');
});

// Test 4: Debug info
testSuite.test('AntManager debug info', () => {
  const manager = new AntManager();
  
  // Test with no selection
  let debug = manager.getDebugInfo();
  testSuite.assertEqual(debug.hasSelectedAnt, false, 'Should show no selected ant');
  testSuite.assertEqual(debug.selectedAntIndex, null, 'Should show null ant index');
  
  // Test with selection
  const mockAnt = { antIndex: 5, posX: 100, posY: 200 };
  manager.setSelectedAnt(mockAnt);
  
  debug = manager.getDebugInfo();
  testSuite.assertEqual(debug.hasSelectedAnt, true, 'Should show selected ant');
  testSuite.assertEqual(debug.selectedAntIndex, 5, 'Should show correct ant index');
  testSuite.assertEqual(debug.selectedAntPosition.x, 100, 'Should show correct x position');
  testSuite.assertEqual(debug.selectedAntPosition.y, 200, 'Should show correct y position');
});

// Test 5: Get ant object with null handling
testSuite.test('AntManager getAntObject handles null cases', () => {
  const manager = new AntManager();
  
  // Mock global ants array as undefined
  global.ants = undefined;
  let result = manager.getAntObject(0);
  testSuite.assertEqual(result, null, 'Should return null when ants array is undefined');
  
  // Mock empty ants array
  global.ants = [];
  result = manager.getAntObject(0);
  testSuite.assertEqual(result, null, 'Should return null when ant index doesn\'t exist');
  
  // Mock ants array with wrapped ant
  global.ants = [{ antObject: { id: 'wrapped' } }];
  result = manager.getAntObject(0);
  testSuite.assertEqual(result.id, 'wrapped', 'Should return wrapped ant object');
  
  // Mock ants array with direct ant
  global.ants = [{ id: 'direct' }];
  result = manager.getAntObject(0);
  testSuite.assertEqual(result.id, 'direct', 'Should return direct ant object');
});

// Test 6: Legacy compatibility methods
testSuite.test('AntManager legacy compatibility methods work correctly', () => {
  const manager = new AntManager();
  
  // Test legacy getAntObj method
  global.ants = [{ id: 'test-ant' }];
  const result = manager.getAntObj(0);
  testSuite.assertEqual(result.id, 'test-ant', 'Legacy getAntObj should work like getAntObject');
  
  // Test legacy methods exist and are functions
  testSuite.assertTrue(typeof manager.AntClickControl === 'function', 'AntClickControl should be a function');
  testSuite.assertTrue(typeof manager.MoveAnt === 'function', 'MoveAnt should be a function');
  testSuite.assertTrue(typeof manager.SelectAnt === 'function', 'SelectAnt should be a function');
  testSuite.assertTrue(typeof manager.getAntObj === 'function', 'getAntObj should be a function');
});

// Run the test suite if this file is executed directly
if (require.main === module) {
  const success = testSuite.run();
  process.exit(success ? 0 : 1);
}

module.exports = testSuite;