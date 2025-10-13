/**
 * @fileoverview BDD Tests for ButtonGroup Layout Positioning System
 * Tests calculatePosition() and layoutButtons() methods with all layout types
 * Following established testing methodology standards
 * 
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 */

// Test dependencies
global.CollisionBox2D = require('../Classes/systems/CollisionBox2D.js');
global.Button = require('../Classes/systems/Button.js');
const ButtonGroup = require('../Classes/systems/ui/ButtonGroup.js');

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
    console.log('Running ButtonGroup Layout Positioning tests...');
    
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

// Helper function to create base test configuration
function createLayoutTestConfig(layoutOverrides = {}) {
  return {
    id: 'layout-test-group',
    name: 'Layout Test Group',
    layout: {
      type: 'horizontal',
      position: { x: 'center', y: 'center' },
      spacing: 10,
      padding: { top: 5, right: 10, bottom: 5, left: 10 },
      ...layoutOverrides
    },
    appearance: {
      scale: 1.0,
      transparency: 1.0,
      visible: true
    },
    behavior: { draggable: false },
    persistence: { savePosition: false },
    buttons: [
      {
        id: 'btn1',
        text: 'Button 1',
        size: { width: 50, height: 30 },
        action: { type: 'function', handler: 'test.action1' }
      },
      {
        id: 'btn2', 
        text: 'Button 2',
        size: { width: 60, height: 40 },
        action: { type: 'function', handler: 'test.action2' }
      },
      {
        id: 'btn3',
        text: 'Button 3', 
        size: { width: 70, height: 35 },
        action: { type: 'function', handler: 'test.action3' }
      }
    ]
  };
}

// Test: Horizontal layout positioning
testSuite.test("Horizontal layout should position buttons in a row with proper spacing", () => {
  const config = createLayoutTestConfig({ 
    type: 'horizontal',
    spacing: 15,
    padding: { top: 10, right: 0, bottom: 0, left: 20 }
  });
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  // Calculate expected positions (center of 1200x800 canvas)
  const centerX = 600; // 1200 / 2
  const centerY = 400; // 800 / 2
  const startX = centerX + 20; // padding.left
  const startY = centerY + 10; // padding.top
  
  // Check button positions
  testSuite.assertEqual(buttonGroup.buttons[0].x, startX);
  testSuite.assertEqual(buttonGroup.buttons[0].y, startY);
  
  testSuite.assertEqual(buttonGroup.buttons[1].x, startX + 50 + 15); // width + spacing
  testSuite.assertEqual(buttonGroup.buttons[1].y, startY);
  
  testSuite.assertEqual(buttonGroup.buttons[2].x, startX + 50 + 15 + 60 + 15); // accumulated widths + spacing
  testSuite.assertEqual(buttonGroup.buttons[2].y, startY);
});

// Test: Vertical layout positioning
testSuite.test("Vertical layout should position buttons in a column with proper spacing", () => {
  const config = createLayoutTestConfig({
    type: 'vertical',
    spacing: 12,
    padding: { top: 15, right: 0, bottom: 0, left: 25 }
  });
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  // Calculate expected positions
  const centerX = 600;
  const centerY = 400;
  const startX = centerX + 25; // padding.left
  const startY = centerY + 15; // padding.top
  
  // Check button positions
  testSuite.assertEqual(buttonGroup.buttons[0].x, startX);
  testSuite.assertEqual(buttonGroup.buttons[0].y, startY);
  
  testSuite.assertEqual(buttonGroup.buttons[1].x, startX);
  testSuite.assertEqual(buttonGroup.buttons[1].y, startY + 30 + 12); // height + spacing
  
  testSuite.assertEqual(buttonGroup.buttons[2].x, startX);  
  testSuite.assertEqual(buttonGroup.buttons[2].y, startY + 30 + 12 + 40 + 12); // accumulated heights + spacing
});

// Test: Grid layout positioning
testSuite.test("Grid layout should position buttons in a grid with specified columns", () => {
  const config = createLayoutTestConfig({
    type: 'grid',
    columns: 2,
    spacing: 8,
    padding: { top: 5, right: 0, bottom: 0, left: 10 }
  });
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  // Calculate expected positions
  const centerX = 600;
  const centerY = 400;
  const startX = centerX + 10; // padding.left
  const startY = centerY + 5;  // padding.top
  
  // Button 0: Row 0, Col 0
  testSuite.assertEqual(buttonGroup.buttons[0].x, startX);
  testSuite.assertEqual(buttonGroup.buttons[0].y, startY);
  
  // Button 1: Row 0, Col 1
  testSuite.assertEqual(buttonGroup.buttons[1].x, startX + 50 + 8); // width + spacing
  testSuite.assertEqual(buttonGroup.buttons[1].y, startY);
  
  // Button 2: Row 1, Col 0 (wrap to next row)
  testSuite.assertEqual(buttonGroup.buttons[2].x, startX);
  testSuite.assertEqual(buttonGroup.buttons[2].y, startY + 30 + 8); // height + spacing
});

// Test: Position anchoring - left/top
testSuite.test("Position anchoring to left/top should calculate coordinates correctly", () => {
  const config = createLayoutTestConfig({
    position: { x: 'left', y: 'top', offsetX: 50, offsetY: 30 }
  });
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  // Expected: x = 0 + 50 + padding.left, y = 0 + 30 + padding.top
  const expectedX = 0 + 50 + 10; // offsetX + padding.left
  const expectedY = 0 + 30 + 5;  // offsetY + padding.top
  
  testSuite.assertEqual(buttonGroup.buttons[0].x, expectedX);
  testSuite.assertEqual(buttonGroup.buttons[0].y, expectedY);
});

// Test: Position anchoring - right/bottom
testSuite.test("Position anchoring to right/bottom should calculate coordinates correctly", () => {
  const config = createLayoutTestConfig({
    position: { x: 'right', y: 'bottom', offsetX: -100, offsetY: -60 }
  });
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  // Expected: x = 1200 + (-100) + padding.left, y = 800 + (-60) + padding.top
  const expectedX = 1200 - 100 + 10; // canvas.width + offsetX + padding.left
  const expectedY = 800 - 60 + 5;    // canvas.height + offsetY + padding.top
  
  testSuite.assertEqual(buttonGroup.buttons[0].x, expectedX);
  testSuite.assertEqual(buttonGroup.buttons[0].y, expectedY);
});

// Test: Numeric position values
testSuite.test("Numeric position values should be used directly", () => {
  const config = createLayoutTestConfig({
    position: { x: 150, y: 250, offsetX: 25, offsetY: 35 }
  });
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  // Expected: x = 150 + 25 + padding.left, y = 250 + 35 + padding.top
  const expectedX = 150 + 25 + 10;
  const expectedY = 250 + 35 + 5;
  
  testSuite.assertEqual(buttonGroup.buttons[0].x, expectedX);
  testSuite.assertEqual(buttonGroup.buttons[0].y, expectedY);
});

// Test: Default layout behavior
testSuite.test("Default layout (no type specified) should behave as horizontal", () => {
  const config = createLayoutTestConfig({
    // No type specified - should default to horizontal-like behavior
    spacing: 20
  });
  delete config.layout.type;
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  const centerX = 600;
  const centerY = 400;
  const startX = centerX + 10; // padding.left
  const startY = centerY + 5;  // padding.top
  
  // Should position buttons horizontally like default case
  testSuite.assertEqual(buttonGroup.buttons[0].x, startX);
  testSuite.assertEqual(buttonGroup.buttons[0].y, startY);
  
  testSuite.assertEqual(buttonGroup.buttons[1].x, startX + 50 + 20); // width + spacing
  testSuite.assertEqual(buttonGroup.buttons[1].y, startY);
});

// Test: Layout with no buttons
testSuite.test("Layout calculation should handle empty button arrays gracefully", () => {
  const config = createLayoutTestConfig();
  config.buttons = [];
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  // Should not crash and should have no buttons
  testSuite.assertEqual(buttonGroup.buttons.length, 0);
  
  // calculatePosition should not throw errors
  buttonGroup.calculatePosition(); // Should not throw
});

// Test: Layout with missing layout configuration
testSuite.test("Layout should use sensible defaults when layout config is missing", () => {
  const config = createLayoutTestConfig();
  delete config.layout;
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  // Should not crash and should position buttons
  testSuite.assertTrue(buttonGroup.buttons.length > 0);
  testSuite.assertTrue(typeof buttonGroup.buttons[0].x === 'number');
  testSuite.assertTrue(typeof buttonGroup.buttons[0].y === 'number');
});

// Test: Layout with missing padding configuration
testSuite.test("Layout should handle missing padding configuration gracefully", () => {
  const config = createLayoutTestConfig();
  delete config.layout.padding;
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  // Should position buttons at base coordinates (padding defaults to 0)
  const centerX = 600;
  const centerY = 400;
  
  testSuite.assertEqual(buttonGroup.buttons[0].x, centerX);
  testSuite.assertEqual(buttonGroup.buttons[0].y, centerY);
});

// Test: Scale effect on layout
testSuite.test("Button scale should affect layout spacing and dimensions", () => {
  const config = createLayoutTestConfig({ spacing: 10 });
  config.appearance.scale = 2.0;
  const actionFactory = createMockActionFactory();
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  // Buttons should have scaled dimensions
  testSuite.assertEqual(buttonGroup.buttons[0].width, 100); // 50 * 2.0
  testSuite.assertEqual(buttonGroup.buttons[0].height, 60); // 30 * 2.0
  
  testSuite.assertEqual(buttonGroup.buttons[1].width, 120); // 60 * 2.0  
  testSuite.assertEqual(buttonGroup.buttons[1].height, 80); // 40 * 2.0
  
  // Layout should account for scaled button widths
  const centerX = 600;
  const startX = centerX + 10; // padding.left
  
  testSuite.assertEqual(buttonGroup.buttons[1].x, startX + 100 + 10); // scaled width + spacing
});

// Test: Mouse position handling
testSuite.test("Mouse position anchoring should use fallback values when mouse coords unavailable", () => {
  const config = createLayoutTestConfig({
    position: { x: 'mouse', y: 'mouse' }
  });
  const actionFactory = createMockActionFactory();
  
  // Mock window without mouse coordinates
  global.window = {}; 
  
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  // Should fallback to 0,0 when mouse coordinates are not available
  const expectedX = 0 + 10; // 0 + padding.left
  const expectedY = 0 + 5;  // 0 + padding.top
  
  testSuite.assertEqual(buttonGroup.buttons[0].x, expectedX);
  testSuite.assertEqual(buttonGroup.buttons[0].y, expectedY);
  
  // Clean up
  delete global.window;
});

// Test: Position persistence effect on layout
testSuite.test("Saved position should be added to calculated base position", () => {
  const config = createLayoutTestConfig({
    position: { x: 'center', y: 'center' }
  });
  config.persistence.savePosition = true;
  config.persistence.storageKey = 'position-test';
  
  // Pre-populate localStorage with saved position
  localStorage.setItem('position-test', JSON.stringify({
    position: { x: 100, y: 150 },
    scale: 1.0,
    transparency: 1.0,
    visible: true
  }));
  
  const actionFactory = createMockActionFactory();
  const buttonGroup = new ButtonGroup(config, actionFactory);
  
  // Expected: base center position + saved offset + padding
  const baseCenterX = 600; // 1200 / 2
  const baseCenterY = 400; // 800 / 2
  const expectedX = baseCenterX + 100 + 10; // center + saved.x + padding.left
  const expectedY = baseCenterY + 150 + 5;  // center + saved.y + padding.top
  
  testSuite.assertEqual(buttonGroup.buttons[0].x, expectedX);
  testSuite.assertEqual(buttonGroup.buttons[0].y, expectedY);
  
  localStorage.clear();
});

// Run all tests
if (require.main === module) {
  // Register with global test runner and run conditionally
  if (typeof globalThis !== 'undefined' && globalThis.registerTest) {
    globalThis.registerTest('ButtonGroup Layout Tests', () => {
      testSuite.run();
    });
  }

  // Auto-run if tests are enabled
  if (typeof globalThis !== 'undefined' && globalThis.shouldRunTests && globalThis.shouldRunTests()) {
    console.log('🧪 Running ButtonGroup Layout tests...');
    testSuite.run();
  } else if (typeof globalThis !== 'undefined' && globalThis.shouldRunTests) {
    console.log('🧪 ButtonGroup Layout tests available but disabled. Use enableTests() to enable or runTests() to run manually.');
  } else {
    // Fallback: run tests if no global test runner
    testSuite.run();
  }
}