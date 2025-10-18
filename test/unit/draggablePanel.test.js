/**
 * @fileoverview Test suite for DraggablePanel class - USING REAL IMPLEMENTATION
 * Tests panel creation, dragging, minimizing, visibility, state persistence, and interaction.
 * 
 * ✅ This test uses the REAL DraggablePanel.js from Classes/systems/ui/
 * ❌ No mocks - tests the actual production code!
 */

// Mock p5.js globals and other dependencies for Node.js testing
if (typeof window === 'undefined') {
  global.window = {};
  global.localStorage = {
    _storage: {},
    getItem(key) { return this._storage[key] || null; },
    setItem(key, value) { this._storage[key] = String(value); },
    removeItem(key) { delete this._storage[key]; },
    clear() { this._storage = {}; }
  };
}

// Mock p5.js functions needed by DraggablePanel
global.textWidth = (text) => text.length * 8; // Rough approximation
global.textSize = () => {};
global.push = () => {};
global.pop = () => {};
global.fill = () => {};
global.noStroke = () => {};
global.stroke = () => {};
global.strokeWeight = () => {};
global.rect = () => {};
global.text = () => {};
global.textAlign = () => {};
global.devConsoleEnabled = false; // Suppress debug logs

// Load real classes
const Button = require('../../Classes/systems/Button.js');
const DraggablePanel = require('../../Classes/systems/ui/DraggablePanel.js');

// Simple test framework
const testSuite = {
  tests: [],
  passed: 0,
  failed: 0,
  
  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(`${message || 'Assertion failed'}: expected ${expected}, got ${actual}`);
    }
  },
  
  assertTrue(condition, message) {
    if (!condition) {
      throw new Error(message || 'Expected condition to be true');
    }
  },
  
  assertFalse(condition, message) {
    if (condition) {
      throw new Error(message || 'Expected condition to be false');
    }
  },
  
  assertDefined(value, message) {
    if (value === undefined || value === null) {
      throw new Error(message || 'Expected value to be defined');
    }
  },
  
  test(name, fn) {
    this.tests.push({ name, fn });
  },
  
  run() {
    this.passed = 0;
    this.failed = 0;
    
    console.log('🧪 Running DraggablePanel Test Suite (✅ REAL IMPLEMENTATION)...\n');
    
    for (const test of this.tests) {
      try {
        // Clear localStorage before each test for isolation
        global.localStorage.clear();
        test.fn();
        console.log(`✅ ${test.name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${test.name}`);
        console.error(`   ${error.message}`);
        this.failed++;
      }
    }
    
    console.log(`\n📊 Test Results: ${this.passed} passed, ${this.failed} failed, ${this.tests.length} total`);
    console.log(`\n💡 Note: These tests use the REAL DraggablePanel class from Classes/systems/ui/`);
    return this.failed === 0;
  }
};

// ===========================
// CONSTRUCTOR TESTS
// ===========================

testSuite.test("Constructor should initialize with default config", () => {
  const panel = new DraggablePanel({ id: 'test-panel', behavior: { persistent: false } });
  
  testSuite.assertEqual(panel.config.id, 'test-panel');
  testSuite.assertDefined(panel.config.position);
  testSuite.assertDefined(panel.config.size);
  testSuite.assertDefined(panel.state);
});

testSuite.test("Constructor should accept custom position", () => {
  const panel = new DraggablePanel({
    id: 'custom-panel',
    position: { x: 200, y: 300 },
    behavior: { persistent: false }
  });
  
  testSuite.assertEqual(panel.state.position.x, 200);
  testSuite.assertEqual(panel.state.position.y, 300);
});

testSuite.test("Constructor should initialize state correctly", () => {
  const panel = new DraggablePanel({ id: 'state-test', behavior: { persistent: false } });
  
  testSuite.assertDefined(panel.state.position);
  testSuite.assertTrue(panel.state.visible);
  testSuite.assertFalse(panel.state.minimized);
});

// ===========================
// VISIBILITY TESTS
// ===========================

testSuite.test("toggleVisibility should toggle visible state", () => {
  const panel = new DraggablePanel({ id: 'vis-test', behavior: { persistent: false } });
  
  const initialState = panel.state.visible;
  panel.toggleVisibility();
  testSuite.assertEqual(panel.state.visible, !initialState);
  
  panel.toggleVisibility();
  testSuite.assertEqual(panel.state.visible, initialState);
});

testSuite.test("show() should make panel visible", () => {
  const panel = new DraggablePanel({ id: 'show-test', behavior: { persistent: false } });
  
  panel.state.visible = false;
  panel.show();
  
  testSuite.assertTrue(panel.state.visible);
});

testSuite.test("hide() should make panel invisible", () => {
  const panel = new DraggablePanel({ id: 'hide-test', behavior: { persistent: false } });
  
  panel.state.visible = true;
  panel.hide();
  
  testSuite.assertFalse(panel.state.visible);
});

// ===========================
// MINIMIZE TESTS
// ===========================

testSuite.test("toggleMinimized should toggle minimized state", () => {
  const panel = new DraggablePanel({ id: 'minimize-test', behavior: { persistent: false } });
  
  testSuite.assertFalse(panel.state.minimized);
  
  panel.toggleMinimized();
  testSuite.assertTrue(panel.state.minimized);
  
  panel.toggleMinimized();
  testSuite.assertFalse(panel.state.minimized);
});

testSuite.test("isMouseOver should respect minimized height", () => {
  const panel = new DraggablePanel({
    id: 'minimize-mouseover',
    position: { x: 0, y: 0 },
    size: { width: 300, height: 200 },
    style: { titleBarHeight: 40 },
    behavior: { persistent: false },
    content: { autoResize: false } // Disable auto-resize for predictable testing
  });
  
  // Manually set exact size for testing (since autoResize may have changed it)
  panel.config.size.height = 200;
  
  // Not minimized - full height (y: 0 to 199, exclusive at 200)
  testSuite.assertTrue(panel.isMouseOver(150, 100), "Should be inside full height");
  testSuite.assertTrue(panel.isMouseOver(150, 199), "Should be at bottom edge (inclusive)");
  testSuite.assertFalse(panel.isMouseOver(150, 200), "Should be at/beyond full height");
  
  // Minimized - only title bar height (y: 0 to titleBarHeight-1)
  panel.toggleMinimized();
  const titleBarHeight = panel.calculateTitleBarHeight();
  testSuite.assertTrue(panel.isMouseOver(150, 20), "Should be inside minimized height");
  testSuite.assertTrue(panel.isMouseOver(150, titleBarHeight - 1), "Should be at minimized bottom edge");
  testSuite.assertFalse(panel.isMouseOver(150, titleBarHeight), "Should be at/beyond minimized height");
});

// ===========================
// MOUSE INTERACTION TESTS
// ===========================

testSuite.test("isMouseOver should correctly detect mouse position", () => {
  const panel = new DraggablePanel({
    id: 'mouseover-test',
    position: { x: 100, y: 100 },
    size: { width: 200, height: 150 },
    behavior: { persistent: false },
    content: { autoResize: false }
  });
  
  // Manually set exact size for testing
  panel.config.size.width = 200;
  panel.config.size.height = 150;
  
  // Inside bounds (x: 100-299, y: 100-249)
  testSuite.assertTrue(panel.isMouseOver(150, 125));
  testSuite.assertTrue(panel.isMouseOver(100, 100)); // Top-left corner
  testSuite.assertTrue(panel.isMouseOver(299, 249)); // Bottom-right corner (exclusive boundary)
  
  // Outside bounds
  testSuite.assertFalse(panel.isMouseOver(99, 125)); // Left of left edge
  testSuite.assertFalse(panel.isMouseOver(300, 125)); // At/beyond right edge
  testSuite.assertFalse(panel.isMouseOver(150, 99)); // Above top edge
  testSuite.assertFalse(panel.isMouseOver(150, 250)); // At/beyond bottom edge
});

testSuite.test("isPointInTitleBar should detect title bar area", () => {
  const panel = new DraggablePanel({
    id: 'titlebar-test',
    position: { x: 0, y: 0 },
    size: { width: 300, height: 200 },
    style: { titleBarHeight: 30 },
    behavior: { persistent: false }
  });
  
  const titleBarBounds = panel.getTitleBarBounds();
  
  // Inside title bar
  testSuite.assertTrue(panel.isPointInBounds(150, 15, titleBarBounds));
  
  // Below title bar
  testSuite.assertFalse(panel.isPointInBounds(150, 35, titleBarBounds));
});

testSuite.test("getTitleBarBounds should return correct dimensions", () => {
  const panel = new DraggablePanel({
    id: 'bounds-test',
    position: { x: 100, y: 50 },
    size: { width: 250, height: 180 },
    style: { titleBarHeight: 28 },
    behavior: { persistent: false }
  });
  
  const bounds = panel.getTitleBarBounds();
  
  testSuite.assertEqual(bounds.x, 100);
  testSuite.assertEqual(bounds.y, 50);
  testSuite.assertEqual(bounds.width, 250);
  // Note: Real implementation calculates dynamic height based on text wrapping
  testSuite.assertDefined(bounds.height);
});

// ===========================
// DRAGGING TESTS
// ===========================

testSuite.test("update should not crash when called", () => {
  const panel = new DraggablePanel({
    id: 'update-test',
    behavior: { persistent: false }
  });
  
  // Should not throw
  panel.update(100, 100, false);
  panel.update(150, 150, true);
  panel.update(200, 200, false);
});

testSuite.test("Panel should not move when invisible", () => {
  const panel = new DraggablePanel({
    id: 'invisible-test',
    position: { x: 100, y: 100 },
    behavior: { persistent: false }
  });
  
  const initialX = panel.state.position.x;
  const initialY = panel.state.position.y;
  
  panel.hide();
  
  // Try to drag while invisible
  panel.update(110, 110, true);
  
  testSuite.assertEqual(panel.state.position.x, initialX);
  testSuite.assertEqual(panel.state.position.y, initialY);
});

// ===========================
// PERSISTENCE TESTS
// ===========================

testSuite.test("Panel with persistent=false should not save to localStorage", () => {
  global.localStorage.clear();
  
  const panel = new DraggablePanel({
    id: 'no-persist-test',
    position: { x: 123, y: 456 },
    behavior: { persistent: false }
  });
  
  panel.saveState();
  
  const saved = global.localStorage.getItem(`draggable-panel-${panel.config.id}`);
  testSuite.assertEqual(saved, null, "Should not save when persistent is false");
});

testSuite.test("Panel with persistent=true should save to localStorage", () => {
  global.localStorage.clear();
  
  const panel = new DraggablePanel({
    id: 'persist-test',
    position: { x: 789, y: 101 },
    behavior: { persistent: true }
  });
  
  panel.saveState();
  
  const saved = global.localStorage.getItem(`draggable-panel-${panel.config.id}`);
  testSuite.assertDefined(saved, "Should save when persistent is true");
  
  const state = JSON.parse(saved);
  testSuite.assertEqual(state.position.x, 789);
  testSuite.assertEqual(state.position.y, 101);
});

// ===========================
// RUN ALL TESTS
// ===========================

const success = testSuite.run();
process.exit(success ? 0 : 1);
