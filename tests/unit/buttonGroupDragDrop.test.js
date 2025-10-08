/**
 * @fileoverview BDD Tests for ButtonGroup Drag and Drop System
 * Tests handleDragging(), update(), mouse interaction, and constraint handling
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
    console.log('Running ButtonGroup Drag and Drop tests...');
    
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

// Mock localStorage and ButtonStyles
global.localStorage = {
  storage: {},
  getItem(key) { return this.storage[key] || null; },
  setItem(key, value) { this.storage[key] = value; },
  removeItem(key) { delete this.storage[key]; },
  clear() { this.storage = {}; }
};

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

// Helper function to create drag test configuration
function createDragTestConfig(behaviorOverrides = {}) {
  return {
    id: 'drag-test-group',
    name: 'Drag Test Group',
    layout: {
      type: 'horizontal',
      position: { x: 'center', y: 'center' },
      spacing: 10,
      padding: { top: 10, right: 15, bottom: 10, left: 15 }
    },
    appearance: {
      scale: 1.0,
      transparency: 1.0,
      visible: true,
      background: { color: [60, 60, 60, 200], cornerRadius: 5 }
    },
    behavior: {
      draggable: true,
      resizable: false,
      snapToEdges: false,
      ...behaviorOverrides
    },
    persistence: {
      savePosition: true,
      storageKey: 'drag-test-key'
    },
    buttons: [
      {
        id: 'drag-btn1',
        text: 'Button 1',
        size: { width: 60, height: 40 },
        action: { type: 'function', handler: 'test.action1' }
      },
      {
        id: 'drag-btn2',
        text: 'Button 2',
        size: { width: 80, height: 35 },
        action: { type: 'function', handler: 'test.action2' }
      }
    ]
  };
}

// Test: Initial drag state
testSuite.test("ButtonGroup should initialize with dragging disabled", () => {
  const config = createDragTestConfig();
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  testSuite.assertFalse(buttonGroup.isDragging);
  testSuite.assertFalse(buttonGroup.isDragActive());
  testSuite.assertEqual(buttonGroup.dragOffset.x, 0);
  testSuite.assertEqual(buttonGroup.dragOffset.y, 0);
});

// Test: getBounds calculation
testSuite.test("getBounds should return correct bounding rectangle including padding", () => {
  const config = createDragTestConfig();
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  const bounds = buttonGroup.getBounds();
  
  // Calculate expected bounds
  // Buttons are positioned horizontally starting at center (600, 400) + padding (15, 10)
  const startX = 600 + 15; // center + padding.left  
  const startY = 400 + 10; // center + padding.top
  
  const expectedMinX = startX - 15; // subtract padding.left
  const expectedMinY = startY - 10; // subtract padding.top
  const expectedMaxX = startX + 60 + 10 + 80 + 15; // btn1.width + spacing + btn2.width + padding.right
  const expectedMaxY = startY + 40 + 10; // max button height + padding.bottom
  
  testSuite.assertEqual(bounds.x, expectedMinX);
  testSuite.assertEqual(bounds.y, expectedMinY);
  testSuite.assertEqual(bounds.width, expectedMaxX - expectedMinX);
  testSuite.assertEqual(bounds.height, expectedMaxY - expectedMinY);
});

// Test: Point in bounds detection
testSuite.test("isPointInBounds should correctly detect points within button group bounds", () => {
  const config = createDragTestConfig();
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  const bounds = buttonGroup.getBounds();
  
  // Test point inside bounds
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  testSuite.assertTrue(buttonGroup.isPointInBounds(centerX, centerY));
  
  // Test point outside bounds
  testSuite.assertFalse(buttonGroup.isPointInBounds(bounds.x - 10, centerY));
  testSuite.assertFalse(buttonGroup.isPointInBounds(centerX, bounds.y - 10));
  testSuite.assertFalse(buttonGroup.isPointInBounds(bounds.x + bounds.width + 10, centerY));
  testSuite.assertFalse(buttonGroup.isPointInBounds(centerX, bounds.y + bounds.height + 10));
  
  // Test point on exact boundary
  testSuite.assertTrue(buttonGroup.isPointInBounds(bounds.x, bounds.y));
  testSuite.assertTrue(buttonGroup.isPointInBounds(bounds.x + bounds.width, bounds.y + bounds.height));
});

// Test: Drag initiation
testSuite.test("handleDragging should initiate drag when mouse is pressed within bounds", () => {
  const config = createDragTestConfig();
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  const bounds = buttonGroup.getBounds();
  
  // Mouse press within bounds
  const mouseX = bounds.x + bounds.width / 2;
  const mouseY = bounds.y + bounds.height / 2;
  
  buttonGroup.handleDragging(mouseX, mouseY, true);
  
  testSuite.assertTrue(buttonGroup.isDragging);
  testSuite.assertTrue(buttonGroup.isDragActive());
  testSuite.assertEqual(buttonGroup.dragOffset.x, mouseX - buttonGroup.state.position.x);
  testSuite.assertEqual(buttonGroup.dragOffset.y, mouseY - buttonGroup.state.position.y);
});

// Test: Drag not initiated outside bounds
testSuite.test("handleDragging should not initiate drag when mouse is pressed outside bounds", () => {
  const config = createDragTestConfig();
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  const bounds = buttonGroup.getBounds();
  
  // Mouse press outside bounds
  const mouseX = bounds.x - 50;
  const mouseY = bounds.y - 50;
  
  buttonGroup.handleDragging(mouseX, mouseY, true);
  
  testSuite.assertFalse(buttonGroup.isDragging);
  testSuite.assertFalse(buttonGroup.isDragActive());
});

// Test: Drag movement
testSuite.test("handleDragging should update position during active drag", () => {
  localStorage.clear();
  
  const config = createDragTestConfig();
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  const bounds = buttonGroup.getBounds();
  
  // Start drag
  const startMouseX = bounds.x + bounds.width / 2;
  const startMouseY = bounds.y + bounds.height / 2;
  const initialPosX = buttonGroup.state.position.x;
  const initialPosY = buttonGroup.state.position.y;
  
  buttonGroup.handleDragging(startMouseX, startMouseY, true);
  
  // Move mouse while dragging
  const newMouseX = startMouseX + 50;
  const newMouseY = startMouseY + 30;
  
  buttonGroup.handleDragging(newMouseX, newMouseY, true);
  
  // Position should have changed by the mouse movement amount
  testSuite.assertEqual(buttonGroup.state.position.x, initialPosX + 50);
  testSuite.assertEqual(buttonGroup.state.position.y, initialPosY + 30);
  testSuite.assertTrue(buttonGroup.isDragging); // Still dragging
});

// Test: Drag completion
testSuite.test("handleDragging should stop dragging and save state when mouse is released", () => {
  localStorage.clear();
  
  const config = createDragTestConfig();
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  const bounds = buttonGroup.getBounds();
  
  // Start and complete a drag operation
  const mouseX = bounds.x + bounds.width / 2;
  const mouseY = bounds.y + bounds.height / 2;
  
  buttonGroup.handleDragging(mouseX, mouseY, true);  // Start drag
  buttonGroup.handleDragging(mouseX + 25, mouseY + 15, true); // Move
  buttonGroup.handleDragging(mouseX + 25, mouseY + 15, false); // Release
  
  testSuite.assertFalse(buttonGroup.isDragging);
  testSuite.assertFalse(buttonGroup.isDragActive());
  
  // Check that state was saved to localStorage
  const savedData = localStorage.getItem('drag-test-key');
  testSuite.assertTrue(savedData !== null, "State should be saved after drag completion");
  
  const parsedData = JSON.parse(savedData);
  testSuite.assertEqual(parsedData.position.x, 25);
  testSuite.assertEqual(parsedData.position.y, 15);
});

// Test: Update method integration
testSuite.test("update method should call handleDragging when draggable is enabled", () => {
  const config = createDragTestConfig();
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  // Create mock button.update method to verify it's called
  let buttonUpdateCalled = 0;
  buttonGroup.buttons.forEach(btn => {
    btn.update = () => { buttonUpdateCalled++; };
  });
  
  const bounds = buttonGroup.getBounds();
  const mouseX = bounds.x + bounds.width / 2;
  const mouseY = bounds.y + bounds.height / 2;
  
  // Call update - should trigger handleDragging
  buttonGroup.update(mouseX, mouseY, true);
  
  testSuite.assertTrue(buttonGroup.isDragging, "Dragging should be initiated through update method");
  testSuite.assertEqual(buttonUpdateCalled, 2, "All button update methods should be called");
});

// Test: Update method skips dragging when not draggable
testSuite.test("update method should skip dragging when draggable is disabled", () => {
  const config = createDragTestConfig({ draggable: false });
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  const bounds = buttonGroup.getBounds();
  const mouseX = bounds.x + bounds.width / 2;
  const mouseY = bounds.y + bounds.height / 2;
  
  buttonGroup.update(mouseX, mouseY, true);
  
  testSuite.assertFalse(buttonGroup.isDragging, "Dragging should not be initiated when disabled");
});

// Test: Update method skips when invisible
testSuite.test("update method should skip all processing when group is not visible", () => {
  const config = createDragTestConfig();
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  // Set visibility to false after creation
  buttonGroup.setVisible(false);
  
  // Mock button.update to detect if called
  let buttonUpdateCalled = false;
  buttonGroup.buttons.forEach(btn => {
    btn.update = () => { buttonUpdateCalled = true; };
  });
  
  const bounds = buttonGroup.getBounds();
  const mouseX = bounds.x + bounds.width / 2;
  const mouseY = bounds.y + bounds.height / 2;
  
  buttonGroup.update(mouseX, mouseY, true);
  
  testSuite.assertFalse(buttonGroup.isDragging, "Dragging should not work when invisible");
  testSuite.assertFalse(buttonUpdateCalled, "Button updates should be skipped when invisible");
});

// Test: Snap to edges constraint
testSuite.test("applyDragConstraints should snap to edges when snapToEdges is enabled", () => {
  const config = createDragTestConfig({ snapToEdges: true });
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  // Test snapping to left edge
  let constrained = buttonGroup.applyDragConstraints(15, 100); // Within 20px of left edge (0)
  testSuite.assertEqual(constrained.x, 0);
  testSuite.assertEqual(constrained.y, 100);
  
  // Test snapping to right edge (canvas width = 1200)
  constrained = buttonGroup.applyDragConstraints(1185, 100); // Within 20px of right edge
  testSuite.assertEqual(constrained.x, 1200);
  testSuite.assertEqual(constrained.y, 100);
  
  // Test snapping to top edge
  constrained = buttonGroup.applyDragConstraints(100, 10); // Within 20px of top edge (0)
  testSuite.assertEqual(constrained.x, 100);
  testSuite.assertEqual(constrained.y, 0);
  
  // Test snapping to bottom edge (canvas height = 800)
  constrained = buttonGroup.applyDragConstraints(100, 795); // Within 20px of bottom edge
  testSuite.assertEqual(constrained.x, 100);
  testSuite.assertEqual(constrained.y, 800);
  
  // Test no snapping when far from edges
  constrained = buttonGroup.applyDragConstraints(100, 100);
  testSuite.assertEqual(constrained.x, 100);
  testSuite.assertEqual(constrained.y, 100);
});

// Test: No constraints when snap disabled
testSuite.test("applyDragConstraints should not modify position when snapToEdges is disabled", () => {
  const config = createDragTestConfig({ snapToEdges: false });
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  // Test positions that would normally snap
  let constrained = buttonGroup.applyDragConstraints(15, 10);
  testSuite.assertEqual(constrained.x, 15);
  testSuite.assertEqual(constrained.y, 10);
  
  constrained = buttonGroup.applyDragConstraints(1185, 795);
  testSuite.assertEqual(constrained.x, 1185);
  testSuite.assertEqual(constrained.y, 795);
});

// Test: stopDragging method
testSuite.test("stopDragging should force stop active drag and save state", () => {
  localStorage.clear();
  
  const config = createDragTestConfig();
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  const bounds = buttonGroup.getBounds();
  
  // Start dragging
  const mouseX = bounds.x + bounds.width / 2;
  const mouseY = bounds.y + bounds.height / 2;
  buttonGroup.handleDragging(mouseX, mouseY, true);
  
  testSuite.assertTrue(buttonGroup.isDragging);
  
  // Force stop
  buttonGroup.stopDragging();
  
  testSuite.assertFalse(buttonGroup.isDragging);
  testSuite.assertFalse(buttonGroup.isDragActive());
  
  // Should have saved state
  const savedData = localStorage.getItem('drag-test-key');
  testSuite.assertTrue(savedData !== null);
});

// Test: stopDragging when not dragging
testSuite.test("stopDragging should handle being called when not currently dragging", () => {
  const config = createDragTestConfig();
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  testSuite.assertFalse(buttonGroup.isDragging);
  
  // Should not throw error
  buttonGroup.stopDragging();
  
  testSuite.assertFalse(buttonGroup.isDragging);
});

// Test: Bounds calculation with empty buttons
testSuite.test("getBounds should return zero bounds when no buttons exist", () => {
  const config = createDragTestConfig();
  config.buttons = [];
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  const bounds = buttonGroup.getBounds();
  
  testSuite.assertEqual(bounds.x, 0);
  testSuite.assertEqual(bounds.y, 0);
  testSuite.assertEqual(bounds.width, 0);
  testSuite.assertEqual(bounds.height, 0);
});

// Test: Drag with position persistence disabled
testSuite.test("Dragging should work even when position persistence is disabled", () => {
  const config = createDragTestConfig();
  config.persistence.savePosition = false;
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  const bounds = buttonGroup.getBounds();
  const initialPosX = buttonGroup.state.position.x;
  
  // Perform drag operation
  const mouseX = bounds.x + bounds.width / 2;
  const mouseY = bounds.y + bounds.height / 2;
  
  buttonGroup.handleDragging(mouseX, mouseY, true);
  buttonGroup.handleDragging(mouseX + 50, mouseY, true);
  buttonGroup.handleDragging(mouseX + 50, mouseY, false);
  
  // Position should have changed
  testSuite.assertEqual(buttonGroup.state.position.x, initialPosX + 50);
  testSuite.assertFalse(buttonGroup.isDragging);
});

// Test: Multiple drag sessions
testSuite.test("ButtonGroup should handle multiple consecutive drag sessions correctly", () => {
  const config = createDragTestConfig();
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  const bounds = buttonGroup.getBounds();
  const mouseX = bounds.x + bounds.width / 2;
  const mouseY = bounds.y + bounds.height / 2;
  
  // First drag session
  buttonGroup.handleDragging(mouseX, mouseY, true);
  buttonGroup.handleDragging(mouseX + 30, mouseY + 20, true);
  buttonGroup.handleDragging(mouseX + 30, mouseY + 20, false);
  
  testSuite.assertFalse(buttonGroup.isDragging);
  testSuite.assertEqual(buttonGroup.state.position.x, 30);
  testSuite.assertEqual(buttonGroup.state.position.y, 20);
  
  // Second drag session from new position
  buttonGroup.handleDragging(mouseX + 30, mouseY + 20, true);
  buttonGroup.handleDragging(mouseX + 60, mouseY + 50, true);
  buttonGroup.handleDragging(mouseX + 60, mouseY + 50, false);
  
  testSuite.assertFalse(buttonGroup.isDragging);
  testSuite.assertEqual(buttonGroup.state.position.x, 60);
  testSuite.assertEqual(buttonGroup.state.position.y, 50);
});

// Run all tests
if (require.main === module) {
  // Register with global test runner and run conditionally
  if (typeof globalThis !== 'undefined' && globalThis.registerTest) {
    globalThis.registerTest('ButtonGroup Drag and Drop Tests', () => {
      testSuite.run();
    });
  }

  // Auto-run if tests are enabled
  if (typeof globalThis !== 'undefined' && globalThis.shouldRunTests && globalThis.shouldRunTests()) {
    console.log('🧪 Running ButtonGroup Drag and Drop tests...');
    testSuite.run();
  } else if (typeof globalThis !== 'undefined' && globalThis.shouldRunTests) {
    console.log('🧪 ButtonGroup Drag and Drop tests available but disabled. Use enableTests() to enable or runTests() to run manually.');
  } else {
    // Fallback: run tests if no global test runner
    testSuite.run();
  }
}