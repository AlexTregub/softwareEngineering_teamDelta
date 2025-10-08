/**
 * @fileoverview BDD Tests for ButtonGroup Persistence System
 * Tests loadPersistedState(), saveState(), and localStorage integration
 * Following established testing methodology standards
 * 
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 */

// Test dependencies
global.CollisionBox2D = require('../../src/core/systems/CollisionBox2D.js');
global.Button = require('../../src/core/systems/Button.js');
const ButtonGroup = require('../../Classes/systems/ui/components/ButtonGroup.js');

// Simple test framework
const testSuite = {
  tests: [],
  passed: 0,
  failed: 0,
  
  test(name, fn) {
    this.tests.push({ name, fn });
  },
  
  assertEqual(actual, expected, message = '') {
    if (actual !== expected) {
      throw new Error(`Expected ${expected}, got ${actual}. ${message}`);
    }
  },
  
  assertTrue(condition, message = '') {
    if (!condition) {
      throw new Error(`Expected condition to be true. ${message}`);
    }
  },
  
  assertFalse(condition, message = '') {
    if (condition) {
      throw new Error(`Expected condition to be false. ${message}`);
    }
  },
  
  run() {
    console.log('Running ButtonGroup Persistence System tests...');
    
    for (const test of this.tests) {
      try {
        test.fn();
        console.log('✅', test.name);
        this.passed++;
      } catch (e) {
        console.log('❌', test.name);
        console.log('   ', e.message);
        this.failed++;
      }
    }
    
    console.log(`\nResults: ${this.passed} passed, ${this.failed} failed`);
    if (this.failed > 0) process.exit(1);
  }
};

// Mock localStorage with realistic behavior
global.localStorage = {
  storage: {},
  
  getItem(key) {
    return this.storage[key] || null;
  },
  
  setItem(key, value) {
    // Simulate storage quota exceeded error occasionally
    if (key === 'quota-exceeded-test') {
      const error = new Error('QuotaExceededError');
      error.name = 'QuotaExceededError';
      throw error;
    }
    this.storage[key] = value;
  },
  
  removeItem(key) {
    delete this.storage[key];
  },
  
  clear() {
    this.storage = {};
  }
};

// Mock ButtonStyles
global.ButtonStyles = {
  DYNAMIC: {
    backgroundColor: '#4CAF50',
    hoverColor: '#45a049',
    textColor: 'white'
  }
};

// Mock actionFactory
function createMockActionFactory() {
  return {
    executeAction() { return true; }
  };
}

// Helper function to create persistence test configuration
function createPersistenceTestConfig(persistenceOverrides = {}) {
  return {
    id: 'persistence-test-group',
    name: 'Persistence Test Group',
    layout: {
      type: 'horizontal',
      position: { x: 'center', y: 'center' },
      spacing: 10,
      padding: { top: 5, right: 10, bottom: 5, left: 10 }
    },
    appearance: {
      scale: 1.0,
      transparency: 1.0,
      visible: true
    },
    behavior: { draggable: true },
    persistence: {
      savePosition: true,
      saveScale: true,
      saveTransparency: true,
      storageKey: 'test-persistence-key',
      ...persistenceOverrides
    },
    buttons: [
      {
        id: 'test-btn',
        text: 'Test Button',
        size: { width: 60, height: 40 },
        action: { type: 'function', handler: 'test.action' }
      }
    ]
  };
}

// Test: Basic persistence saving
testSuite.test("saveState should save all state properties to localStorage with proper JSON structure", () => {
  localStorage.clear();
  
  const config = createPersistenceTestConfig({ storageKey: 'basic-save-test' });
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  // Modify state values
  buttonGroup.setPosition(200, 300);
  buttonGroup.setScale(1.5);
  buttonGroup.setTransparency(0.7);
  buttonGroup.setVisible(false);
  
  // Verify localStorage contains correct data structure
  const savedData = localStorage.getItem('basic-save-test');
  testSuite.assertTrue(savedData !== null, "Data should be saved to localStorage");
  
  const parsedData = JSON.parse(savedData);
  testSuite.assertEqual(parsedData.position.x, 200);
  testSuite.assertEqual(parsedData.position.y, 300);
  testSuite.assertEqual(parsedData.scale, 1.5); 
  testSuite.assertEqual(parsedData.transparency, 0.7);
  testSuite.assertFalse(parsedData.visible);
  testSuite.assertTrue(typeof parsedData.lastModified === 'string');
  testSuite.assertTrue(parsedData.lastModified.includes('T')); // ISO timestamp format
});

// Test: Persistence loading from localStorage
testSuite.test("loadPersistedState should restore state from valid localStorage data", () => {
  localStorage.clear();
  
  // Pre-populate localStorage with test data
  const testData = {
    position: { x: 150, y: 250 },
    scale: 2.0,
    transparency: 0.4,
    visible: true,
    lastModified: '2025-01-01T12:00:00.000Z'
  };
  localStorage.setItem('load-test-key', JSON.stringify(testData));
  
  const config = createPersistenceTestConfig({ storageKey: 'load-test-key' });
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  // Verify state was loaded correctly
  testSuite.assertEqual(buttonGroup.state.position.x, 150);
  testSuite.assertEqual(buttonGroup.state.position.y, 250);
  testSuite.assertEqual(buttonGroup.state.scale, 2.0);
  testSuite.assertEqual(buttonGroup.state.transparency, 0.4);
  testSuite.assertTrue(buttonGroup.state.visible);
});

// Test: Persistence with partial data
testSuite.test("loadPersistedState should handle partial data gracefully", () => {
  localStorage.clear();
  
  // Save partial data (missing some properties)
  const partialData = {
    position: { x: 100, y: 200 },
    scale: 1.2
    // Missing transparency and visible
  };
  localStorage.setItem('partial-test-key', JSON.stringify(partialData));
  
  const config = createPersistenceTestConfig({ storageKey: 'partial-test-key' });
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  // Should load available data and use config defaults for missing data
  testSuite.assertEqual(buttonGroup.state.position.x, 100);
  testSuite.assertEqual(buttonGroup.state.position.y, 200);
  testSuite.assertEqual(buttonGroup.state.scale, 1.2);
  testSuite.assertEqual(buttonGroup.state.transparency, 1.0); // From config default
  testSuite.assertTrue(buttonGroup.state.visible); // From config default
});

// Test: Invalid JSON handling
testSuite.test("loadPersistedState should handle invalid JSON gracefully", () => {
  localStorage.clear();
  
  // Store invalid JSON
  localStorage.setItem('invalid-json-key', '{invalid json syntax}');
  
  const config = createPersistenceTestConfig({ storageKey: 'invalid-json-key' });
  const actionFactory = createMockActionFactory();
  
  // Should not throw error and should use config defaults
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  testSuite.assertEqual(buttonGroup.state.position.x, 0);
  testSuite.assertEqual(buttonGroup.state.position.y, 0);
  testSuite.assertEqual(buttonGroup.state.scale, 1.0);
  testSuite.assertEqual(buttonGroup.state.transparency, 1.0);
  testSuite.assertTrue(buttonGroup.state.visible);
});

// Test: Invalid data types handling
testSuite.test("loadPersistedState should validate data types and reject invalid values", () => {
  localStorage.clear();
  
  // Store data with invalid types
  const invalidData = {
    position: "not an object",
    scale: "not a number",
    transparency: -5, // Out of range
    visible: "not a boolean"
  };
  localStorage.setItem('invalid-types-key', JSON.stringify(invalidData));
  
  const config = createPersistenceTestConfig({ storageKey: 'invalid-types-key' });
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  // Should reject invalid values and use defaults
  testSuite.assertEqual(buttonGroup.state.position.x, 0);
  testSuite.assertEqual(buttonGroup.state.position.y, 0);
  testSuite.assertEqual(buttonGroup.state.scale, 1.0); // Config default
  testSuite.assertEqual(buttonGroup.state.transparency, 1.0); // Config default
  testSuite.assertTrue(buttonGroup.state.visible); // Config default
});

// Test: Persistence disabled
testSuite.test("Persistence operations should be skipped when savePosition is false", () => {
  localStorage.clear();
  
  const config = createPersistenceTestConfig({ 
    savePosition: false,
    storageKey: 'disabled-persistence-key' 
  });
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  buttonGroup.setPosition(999, 888);
  
  // Should not save to localStorage
  testSuite.assertEqual(localStorage.getItem('disabled-persistence-key'), null);
});

// Test: Missing storage key
testSuite.test("Persistence should be skipped when storageKey is missing", () => {
  localStorage.clear();
  
  const config = createPersistenceTestConfig();
  delete config.persistence.storageKey;
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  buttonGroup.setPosition(777, 666);
  
  // Should not attempt to save (no storage key)
  testSuite.assertEqual(Object.keys(localStorage.storage).length, 0);
});

// Test: Storage error handling
testSuite.test("saveState should handle localStorage errors gracefully", () => {
  localStorage.clear();
  
  const config = createPersistenceTestConfig({ storageKey: 'quota-exceeded-test' });
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  // Should not throw error when localStorage.setItem fails
  buttonGroup.setPosition(123, 456); // This triggers saveState internally
  
  // Test passes if no exception is thrown
  testSuite.assertTrue(true, "saveState handled storage error gracefully");
});

// Test: Position persistence integration
testSuite.test("Position changes should automatically save when persistence is enabled", () => {
  localStorage.clear();
  
  const config = createPersistenceTestConfig({ storageKey: 'position-auto-save' });
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  // Change position - should automatically save
  buttonGroup.setPosition(555, 444);
  
  const savedData = JSON.parse(localStorage.getItem('position-auto-save'));
  testSuite.assertEqual(savedData.position.x, 555);
  testSuite.assertEqual(savedData.position.y, 444);
});

// Test: Scale persistence integration
testSuite.test("Scale changes should automatically save when persistence is enabled", () => {
  localStorage.clear();
  
  const config = createPersistenceTestConfig({ storageKey: 'scale-auto-save' });
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  // Change scale - should automatically save
  buttonGroup.setScale(1.8);
  
  const savedData = JSON.parse(localStorage.getItem('scale-auto-save'));
  testSuite.assertEqual(savedData.scale, 1.8);
});

// Test: Transparency persistence integration
testSuite.test("Transparency changes should automatically save when saveTransparency is enabled", () => {
  localStorage.clear();
  
  const config = createPersistenceTestConfig({ 
    saveTransparency: true,
    storageKey: 'transparency-auto-save' 
  });
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  // Change transparency - should automatically save
  buttonGroup.setTransparency(0.3);
  
  const savedData = JSON.parse(localStorage.getItem('transparency-auto-save'));
  testSuite.assertEqual(savedData.transparency, 0.3);
});

// Test: Visibility persistence integration
testSuite.test("Visibility changes should automatically save to localStorage", () => {
  localStorage.clear();
  
  const config = createPersistenceTestConfig({ storageKey: 'visibility-auto-save' });
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  // Change visibility - should automatically save
  buttonGroup.setVisible(false);
  
  const savedData = JSON.parse(localStorage.getItem('visibility-auto-save'));
  testSuite.assertFalse(savedData.visible);
  
  buttonGroup.setVisible(true);
  
  const updatedData = JSON.parse(localStorage.getItem('visibility-auto-save'));
  testSuite.assertTrue(updatedData.visible);
});

// Test: Data immutability 
testSuite.test("Saved position data should be properly copied to prevent reference issues", () => {
  localStorage.clear();
  
  const config = createPersistenceTestConfig({ storageKey: 'immutability-test' });
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  buttonGroup.setPosition(100, 200);
  
  // Modify the state directly
  buttonGroup.state.position.x = 999;
  
  // Saved data should not be affected by subsequent state modifications
  const savedData = JSON.parse(localStorage.getItem('immutability-test'));
  testSuite.assertEqual(savedData.position.x, 100, "Saved data should be immutable copy");
});

// Test: Loading with object validation
testSuite.test("loadPersistedState should validate position object structure", () => {
  localStorage.clear();
  
  // Store data with invalid position structure
  const invalidPositionData = {
    position: { x: 50 }, // Missing y property
    scale: 1.0,
    transparency: 1.0,
    visible: true
  };
  localStorage.setItem('position-validation-test', JSON.stringify(invalidPositionData));
  
  const config = createPersistenceTestConfig({ storageKey: 'position-validation-test' });
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  // Should only load valid position data
  testSuite.assertEqual(buttonGroup.state.position.x, 50);
  testSuite.assertEqual(buttonGroup.state.position.y, 0); // Should use default
});

// Test: Timestamp persistence
testSuite.test("saveState should include lastModified timestamp in ISO format", () => {
  localStorage.clear();
  
  const config = createPersistenceTestConfig({ storageKey: 'timestamp-test' });
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  const beforeSave = new Date().toISOString();
  buttonGroup.setPosition(50, 75);
  const afterSave = new Date().toISOString();
  
  const savedData = JSON.parse(localStorage.getItem('timestamp-test'));
  testSuite.assertTrue(savedData.lastModified >= beforeSave);
  testSuite.assertTrue(savedData.lastModified <= afterSave);
  testSuite.assertTrue(savedData.lastModified.includes('T'));
  testSuite.assertTrue(savedData.lastModified.endsWith('Z'));
});

// Run all tests
if (require.main === module) {
  // Register with global test runner and run conditionally
  if (typeof globalThis !== 'undefined' && globalThis.registerTest) {
    globalThis.registerTest('ButtonGroup Persistence Tests', () => {
      testSuite.run();
    });
  }

  // Auto-run if tests are enabled
  if (typeof globalThis !== 'undefined' && globalThis.shouldRunTests && globalThis.shouldRunTests()) {
    console.log('🧪 Running ButtonGroup Persistence tests...');
    testSuite.run();
  } else if (typeof globalThis !== 'undefined' && globalThis.shouldRunTests) {
    console.log('🧪 ButtonGroup Persistence tests available but disabled. Use enableTests() to enable or runTests() to run manually.');
  } else {
    // Fallback: run tests if no global test runner
    testSuite.run();
  }
}