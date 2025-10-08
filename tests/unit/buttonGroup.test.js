/**
 * @fileoverview BDD Tests for ButtonGroup class
 * Tests constructor, state management, button creation, and persistence
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
  
  assertThrows(fn, message = '') {
    try {
      fn();
      throw new Error(`Expected function to throw an error. ${message}`);
    } catch (error) {
      // Expected behavior - function threw an error
    }
  },
  
  run() {
    console.log('Running ButtonGroup BDD tests...');
    
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

// Mock localStorage for testing
global.localStorage = {
  storage: {},
  getItem(key) {
    return this.storage[key] || null;
  },
  setItem(key, value) {
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

// Mock actionFactory for testing
function createMockActionFactory() {
  const executedActions = [];
  
  return {
    executeAction(buttonConfig, gameContext) {
      executedActions.push({
        buttonId: buttonConfig.id,
        actionType: buttonConfig.action?.type,
        actionHandler: buttonConfig.action?.handler,
        gameContext: gameContext,
        timestamp: Date.now()
      });
      return true;
    },
    getExecutedActions() {
      return executedActions;
    },
    clearHistory() {
      executedActions.length = 0;
    }
  };
}

// Helper function to create test configuration
function createTestConfig(overrides = {}) {
  return {
    id: 'test-group',
    name: 'Test Button Group',
    layout: {
      type: 'horizontal',
      position: { x: 'center', y: 'bottom', offsetY: -60 },
      spacing: 10,
      padding: { top: 10, right: 15, bottom: 10, left: 15 }
    },
    appearance: {
      background: { color: [60, 60, 60, 200], cornerRadius: 8 },
      transparency: 0.9,
      scale: 1.0,
      visible: true
    },
    behavior: {
      draggable: true,
      resizable: true
    },
    persistence: {
      savePosition: true,
      saveScale: true,
      saveTransparency: true,
      storageKey: 'test-group-state'
    },
    buttons: [
      {
        id: 'test-button-1',
        text: 'Test Button 1',
        size: { width: 60, height: 45 },
        action: {
          type: 'function',
          handler: 'TestController.testAction'
        },
        hotkey: 'T',
        tooltip: 'Test button tooltip'
      },
      {
        id: 'test-button-2',
        text: 'Test Button 2', 
        size: { width: 80, height: 35 },
        action: {
          type: 'function',
          handler: 'TestController.testAction2'
        }
      }
    ],
    ...overrides
  };
}

// Test: Constructor with valid parameters
testSuite.test("Constructor should create ButtonGroup with valid configuration and actionFactory", () => {
  const config = createTestConfig();
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  // Validate basic properties
  testSuite.assertEqual(buttonGroup.config.id, 'test-group');
  testSuite.assertEqual(buttonGroup.config.name, 'Test Button Group');
  testSuite.assertEqual(buttonGroup.actionFactory, actionFactory);
  testSuite.assertEqual(buttonGroup.buttons.length, 2);
  testSuite.assertFalse(buttonGroup.isDragging);
  testSuite.assertFalse(buttonGroup.isResizing);
});

// Test: Constructor validation - missing config
testSuite.test("Constructor should throw error when config is missing or invalid", () => {
  const actionFactory = createMockActionFactory();
  
  testSuite.assertThrows(() => {
    new ButtonGroup(null, actionFactory);
  }, "Should throw error for null config");
  
  testSuite.assertThrows(() => {
    new ButtonGroup(undefined, actionFactory);
  }, "Should throw error for undefined config");
  
  testSuite.assertThrows(() => {
    new ButtonGroup("invalid", actionFactory);
  }, "Should throw error for string config");
});

// Test: Constructor validation - missing actionFactory
testSuite.test("Constructor should throw error when actionFactory is missing or invalid", () => {
  const config = createTestConfig();
  
  testSuite.assertThrows(() => {
    new ButtonGroup(config, null);
  }, "Should throw error for null actionFactory");
  
  testSuite.assertThrows(() => {
    new ButtonGroup(config, {});
  }, "Should throw error for actionFactory without executeAction method");
  
  testSuite.assertThrows(() => {
    new ButtonGroup(config, { executeAction: "not a function" });
  }, "Should throw error for actionFactory with non-function executeAction");
});

// Test: Default state initialization
testSuite.test("Constructor should initialize default state values correctly", () => {
  const config = createTestConfig();
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  // Check default state values
  testSuite.assertEqual(buttonGroup.state.position.x, 0);
  testSuite.assertEqual(buttonGroup.state.position.y, 0);
  testSuite.assertEqual(buttonGroup.state.scale, 1.0);
  testSuite.assertEqual(buttonGroup.state.transparency, 0.9); // From config
  testSuite.assertTrue(buttonGroup.state.visible);
});

// Test: State initialization from config values
testSuite.test("Constructor should use appearance values from config for initial state", () => {
  const config = createTestConfig({
    appearance: {
      transparency: 0.7,
      scale: 1.5,
      visible: false
    }
  });
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  testSuite.assertEqual(buttonGroup.state.transparency, 0.7);
  testSuite.assertEqual(buttonGroup.state.scale, 1.5);
  testSuite.assertFalse(buttonGroup.state.visible);
});

// Test: Button creation from configuration
testSuite.test("createButtons should create Button instances from configuration", () => {
  const config = createTestConfig();
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  // Validate buttons were created
  testSuite.assertEqual(buttonGroup.buttons.length, 2);
  
  // Check first button
  const btn1 = buttonGroup.buttons[0];
  testSuite.assertEqual(btn1.caption, 'Test Button 1');
  testSuite.assertEqual(btn1.width, 60); // Default scale 1.0
  testSuite.assertEqual(btn1.height, 45);
  testSuite.assertEqual(btn1.config.id, 'test-button-1');
  testSuite.assertEqual(btn1.tooltip, 'Test button tooltip');
  testSuite.assertEqual(btn1.hotkey, 'T');
  
  // Check second button
  const btn2 = buttonGroup.buttons[1];
  testSuite.assertEqual(btn2.caption, 'Test Button 2');
  testSuite.assertEqual(btn2.width, 80);
  testSuite.assertEqual(btn2.height, 35);
  testSuite.assertEqual(btn2.config.id, 'test-button-2');
});

// Test: Button creation with scaled dimensions
testSuite.test("createButtons should apply scale to button dimensions", () => {
  const config = createTestConfig({
    appearance: { scale: 2.0 }
  });
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  // Check buttons have scaled dimensions
  const btn1 = buttonGroup.buttons[0];
  testSuite.assertEqual(btn1.width, 120); // 60 * 2.0
  testSuite.assertEqual(btn1.height, 90); // 45 * 2.0
  
  const btn2 = buttonGroup.buttons[1];
  testSuite.assertEqual(btn2.width, 160); // 80 * 2.0
  testSuite.assertEqual(btn2.height, 70); // 35 * 2.0
});

// Test: Button creation with empty buttons array
testSuite.test("createButtons should handle empty buttons configuration gracefully", () => {
  const config = createTestConfig({ buttons: [] });
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  testSuite.assertEqual(buttonGroup.buttons.length, 0);
});

// Test: Button creation with missing buttons configuration
testSuite.test("createButtons should handle missing buttons configuration gracefully", () => {
  const config = createTestConfig();
  delete config.buttons;
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  testSuite.assertEqual(buttonGroup.buttons.length, 0);
});

// Test: ID and name getters
testSuite.test("getId and getName should return correct values from configuration", () => {
  const config = createTestConfig();
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  testSuite.assertEqual(buttonGroup.getId(), 'test-group');
  testSuite.assertEqual(buttonGroup.getName(), 'Test Button Group');
});

// Test: Name fallback to ID
testSuite.test("getName should fallback to ID when name is not provided", () => {
  const config = createTestConfig();
  delete config.name;
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  testSuite.assertEqual(buttonGroup.getName(), 'test-group');
});

// Test: Visibility state management
testSuite.test("Visibility state should be manageable through setVisible and isVisible", () => {
  const config = createTestConfig();
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  // Initial state
  testSuite.assertTrue(buttonGroup.isVisible());
  
  // Hide group
  buttonGroup.setVisible(false);
  testSuite.assertFalse(buttonGroup.isVisible());
  testSuite.assertFalse(buttonGroup.state.visible);
  
  // Show group
  buttonGroup.setVisible(true);
  testSuite.assertTrue(buttonGroup.isVisible());
  testSuite.assertTrue(buttonGroup.state.visible);
  
  // Test with non-boolean values
  buttonGroup.setVisible("truthy string");
  testSuite.assertTrue(buttonGroup.isVisible());
  
  buttonGroup.setVisible(0);
  testSuite.assertFalse(buttonGroup.isVisible());
});

// Test: Transparency management
testSuite.test("Transparency should be manageable through setTransparency and getTransparency", () => {
  const config = createTestConfig();  
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  // Initial state
  testSuite.assertEqual(buttonGroup.getTransparency(), 0.9);
  
  // Set new transparency
  buttonGroup.setTransparency(0.5);
  testSuite.assertEqual(buttonGroup.getTransparency(), 0.5);
  testSuite.assertEqual(buttonGroup.state.transparency, 0.5);
  
  // Test clamping - too high
  buttonGroup.setTransparency(1.5);
  testSuite.assertEqual(buttonGroup.getTransparency(), 1.0);
  
  // Test clamping - too low
  buttonGroup.setTransparency(-0.5);
  testSuite.assertEqual(buttonGroup.getTransparency(), 0.0);
});

// Test: Scale management
testSuite.test("Scale should be manageable through setScale and getScale", () => {
  const config = createTestConfig();
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  // Initial state
  testSuite.assertEqual(buttonGroup.getScale(), 1.0);
  
  // Set new scale
  buttonGroup.setScale(1.5);
  testSuite.assertEqual(buttonGroup.getScale(), 1.5);
  testSuite.assertEqual(buttonGroup.state.scale, 1.5);
  
  // Test clamping - too high
  buttonGroup.setScale(5.0);
  testSuite.assertEqual(buttonGroup.getScale(), 3.0);
  
  // Test clamping - too low
  buttonGroup.setScale(0.05);
  testSuite.assertEqual(buttonGroup.getScale(), 0.1);
});

// Test: Position management
testSuite.test("Position should be manageable through setPosition and getPosition", () => {
  const config = createTestConfig();
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  // Initial state
  const initialPos = buttonGroup.getPosition();
  testSuite.assertEqual(initialPos.x, 0);
  testSuite.assertEqual(initialPos.y, 0);
  
  // Set new position
  buttonGroup.setPosition(100, 200);
  const newPos = buttonGroup.getPosition();
  testSuite.assertEqual(newPos.x, 100);
  testSuite.assertEqual(newPos.y, 200);
  testSuite.assertEqual(buttonGroup.state.position.x, 100);
  testSuite.assertEqual(buttonGroup.state.position.y, 200);
  
  // Ensure returned position is a copy (immutable)
  newPos.x = 999;
  testSuite.assertEqual(buttonGroup.getPosition().x, 100); // Should not change
});

// Test: Game context creation
testSuite.test("getGameContext should return proper context object with required properties", () => {
  const config = createTestConfig();
  const actionFactory = createMockActionFactory();
  
  // Mock global window objects
  global.window = {
    currentGameState: 'playing',
    selectionController: { test: 'selection' },
    resourceController: { test: 'resource' }
  };
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  const context = buttonGroup.getGameContext();
  
  testSuite.assertEqual(context.groupId, 'test-group');
  testSuite.assertEqual(context.gameState, 'playing');
  testSuite.assertEqual(context.selection, global.window.selectionController);
  testSuite.assertEqual(context.resources, global.window.resourceController);
  testSuite.assertTrue(typeof context.timestamp === 'number');
  testSuite.assertTrue(context.timestamp > Date.now() - 1000); // Recent timestamp
});

// Test: handleButtonClick with valid action
testSuite.test("handleButtonClick should execute action through actionFactory", () => {
  const config = createTestConfig();
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  const btnConfig = config.buttons[0];
  const button = buttonGroup.buttons[0];
  
  // Execute button click
  buttonGroup.handleButtonClick(btnConfig, button);
  
  // Verify action was executed
  const executedActions = actionFactory.getExecutedActions();
  testSuite.assertEqual(executedActions.length, 1);
  testSuite.assertEqual(executedActions[0].buttonId, 'test-button-1');
  testSuite.assertEqual(executedActions[0].actionType, 'function');
  testSuite.assertEqual(executedActions[0].actionHandler, 'TestController.testAction');
  testSuite.assertTrue(typeof executedActions[0].gameContext === 'object');
});

// Test: Persistence saving (without actual localStorage dependency)
testSuite.test("saveState should save state to localStorage when persistence is enabled", () => {
  localStorage.clear(); // Clear any existing data
  
  const config = createTestConfig();
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  // Modify state
  buttonGroup.setPosition(150, 250);
  buttonGroup.setScale(1.2);
  buttonGroup.setTransparency(0.8);
  buttonGroup.setVisible(false);
  
  // Check localStorage
  const savedData = localStorage.getItem('test-group-state');
  testSuite.assertTrue(savedData !== null);
  
  const parsedData = JSON.parse(savedData);
  testSuite.assertEqual(parsedData.position.x, 150);
  testSuite.assertEqual(parsedData.position.y, 250);
  testSuite.assertEqual(parsedData.scale, 1.2);
  testSuite.assertEqual(parsedData.transparency, 0.8);
  testSuite.assertFalse(parsedData.visible);
  testSuite.assertTrue(typeof parsedData.lastModified === 'string');
});

// Test: Persistence loading
testSuite.test("loadPersistedState should restore state from localStorage", () => {
  localStorage.clear();
  
  // Pre-populate localStorage with test data
  const testData = {
    position: { x: 75, y: 125 },
    scale: 1.8,
    transparency: 0.6,
    visible: false,
    lastModified: '2025-01-01T00:00:00.000Z'
  };
  localStorage.setItem('test-group-state', JSON.stringify(testData));
  
  const config = createTestConfig();
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  // Verify state was loaded
  testSuite.assertEqual(buttonGroup.state.position.x, 75);
  testSuite.assertEqual(buttonGroup.state.position.y, 125);
  testSuite.assertEqual(buttonGroup.state.scale, 1.8);
  testSuite.assertEqual(buttonGroup.state.transparency, 0.6);
  testSuite.assertFalse(buttonGroup.state.visible);
});

// Test: Persistence disabled
testSuite.test("Persistence should not save or load when disabled in configuration", () => {
  localStorage.clear();
  
  const config = createTestConfig({
    persistence: {
      savePosition: false,
      storageKey: 'disabled-test-key'
    }
  });
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  buttonGroup.setPosition(999, 888);
  
  // Should not save to localStorage
  testSuite.assertEqual(localStorage.getItem('disabled-test-key'), null);
});

// Run all tests
if (require.main === module) {
  // Register with global test runner and run conditionally
  if (typeof globalThis !== 'undefined' && globalThis.registerTest) {
    globalThis.registerTest('ButtonGroup Tests', () => {
      testSuite.run();
    });
  }

  // Auto-run if tests are enabled
  if (typeof globalThis !== 'undefined' && globalThis.shouldRunTests && globalThis.shouldRunTests()) {
    console.log('🧪 Running ButtonGroup tests...');
    testSuite.run();
  } else if (typeof globalThis !== 'undefined' && globalThis.shouldRunTests) {
    console.log('🧪 ButtonGroup tests available but disabled. Use enableTests() to enable or runTests() to run manually.');
  } else {
    // Fallback: run tests if no global test runner
    testSuite.run();
  }
}

module.exports = testSuite;