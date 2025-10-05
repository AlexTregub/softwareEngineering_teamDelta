// Selection Box Regression Tests
// Tests specific scenarios that have broken in the past
// Run with: node test/selectionBox.regression.test.js

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
    console.log('🔙 Running Selection Box Regression Test Suite...\n');
    
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
      console.log('🎉 All regression tests passed!');
    } else {
      console.log('❌ Some regression tests failed!');
      process.exit(1);
    }
  }
}

// Mock p5.js functions
global.createVector = (x, y) => ({ x, y, copy: function() { return { x: this.x, y: this.y }; } });
global.LEFT = 37;
global.RIGHT = 39;

// Import selection box functions
const selectionBoxFunctions = require('../Classes/selectionBox.js');
const {
  handleMousePressed,
  handleMouseDragged,
  handleMouseReleased,
  drawSelectionBox,
  deselectAllEntities,
  isEntityInBox,
  isEntityUnderMouse,
  renderDebugInfo
} = selectionBoxFunctions;

// Set up global variables that selection box functions expect
global.isSelecting = false;
global.selectionStart = null;
global.selectionEnd = null;
global.selectedEntities = [];

// Global variables that need to be accessible
let selectedAnt = null;
let TILE_SIZE = 32;

// Mock functions
function moveSelectedEntityToTile(mx, my, tileSize) {
  if (selectedAnt) {
    selectedAnt.moveCommands = selectedAnt.moveCommands || [];
    selectedAnt.moveCommands.push({ x: mx, y: my, type: 'tile' });
    selectedAnt.posX = mx;
    selectedAnt.posY = my;
    selectedAnt.isSelected = false;
    selectedAnt = null;
  }
}

function AntClickControl() {
  // Track calls to this function
  AntClickControl.callCount = (AntClickControl.callCount || 0) + 1;
  
  if (selectedAnt) {
    selectedAnt.moveToLocation(mouseX, mouseY);
    selectedAnt.isSelected = false;
    selectedAnt = null;
    return;
  }
  
  // Select ant under mouse
  for (let ant of mockAnts) {
    if (ant.isMouseOver(mouseX, mouseY)) {
      selectedAnt = ant;
      ant.isSelected = true;
      break;
    }
  }
}

// Mock ant class with detailed tracking
class MockAnt {
  constructor(x, y, w = 20, h = 20) {
    this.posX = x;
    this.posY = y;
    this.sizeX = w;
    this.sizeY = h;
    this.isSelected = false;
    this.isBoxHovered = false;
    this.moveCommands = [];
    this.selections = [];
  }

  getPosition() {
    return { x: this.posX, y: this.posY };
  }

  getSize() {
    return { x: this.sizeX, y: this.sizeY };
  }

  isMouseOver(mx, my) {
    return mx >= this.posX && mx <= this.posX + this.sizeX && 
           my >= this.posY && my <= this.posY + this.sizeY;
  }

  moveToLocation(x, y) {
    this.moveCommands.push({ x, y, type: 'direct' });
    this.posX = x;
    this.posY = y;
  }

  set isSelected(value) {
    this._isSelected = value;
    this.selections.push({ selected: value, timestamp: Date.now() });
  }

  get isSelected() {
    return this._isSelected;
  }
}

// Test data
let mockAnts = [];
let mouseX = 0;
let mouseY = 0;

const suite = new TestSuite();

// Reset function for each test
function resetTestState() {
  mockAnts = [
    new MockAnt(100, 100),
    new MockAnt(200, 100),
    new MockAnt(300, 100)
  ];
  selectedAnt = null;
  if (typeof deselectAllEntities === 'function') {
    deselectAllEntities();
  }
  // Reset selection box state manually
  global.isSelecting = false;
  global.selectionStart = null;
  global.selectionEnd = null;
  global.selectedEntities = [];
  AntClickControl.callCount = 0;
  
  // Clear all ant states
  mockAnts.forEach(ant => {
    ant.isSelected = false;
    ant.isBoxHovered = false;
    ant.moveCommands = [];
    ant.selections = [];
  });
}

// REGRESSION TEST 1: "Drag selection broken when ant is selected"
// This was the main bug we just fixed
suite.test('REGRESSION: Drag selection with pre-selected ant', () => {
  resetTestState();
  
  // Pre-select an ant (simulate previous single-click)
  selectedAnt = mockAnts[0];
  selectedAnt.isSelected = true;
  
  // Try to start a drag selection in empty space
  mouseX = 50; // Empty space
  mouseY = 50;
  
  // This should start a selection box, not try to move the ant
  handleMousePressed(mockAnts, mouseX, mouseY, AntClickControl, selectedAnt, moveSelectedAntToTile, TILE_SIZE, LEFT);
  
  suite.assertTrue(global.isSelecting, 'Should start selection box even with pre-selected ant');
  suite.assertTrue(global.selectionStart !== null, 'Selection start should be set');
  
  // Complete the drag to select other ants
  mouseX = 350; // Covers all ants
  mouseY = 150;
  handleMouseDragged(mouseX, mouseY, mockAnts);
  handleMouseReleased(mockAnts, selectedAnt, moveSelectedAntToTile, TILE_SIZE);
  
  // Should have selected multiple ants
  let selectedCount = mockAnts.filter(ant => ant.isSelected).length;
  suite.assertTrue(selectedCount > 1, 'Should select multiple ants via drag even with pre-selection');
});

// REGRESSION TEST 2: "Click vs drag detection failing"
// Small drags were sometimes treated as selections instead of clicks
suite.test('REGRESSION: Small drag treated as click for movement', () => {
  resetTestState();
  
  selectedAnt = mockAnts[0];
  selectedAnt.isSelected = true;
  
  // Start drag
  mouseX = 250;
  mouseY = 250;
  handleMousePressed(mockAnts, mouseX, mouseY, AntClickControl, selectedAnt, moveSelectedAntToTile, TILE_SIZE, LEFT);
  
  // Very small drag (3 pixels - should be treated as click)
  mouseX = 253;
  mouseY = 253;
  handleMouseDragged(mouseX, mouseY, mockAnts);
  
  const originalMoveCount = mockAnts[0].moveCommands.length;
  
  // End drag
  handleMouseReleased(mockAnts, selectedAnt, moveSelectedAntToTile, TILE_SIZE);
  
  // Should have moved the ant, not done selection
  suite.assertTrue(mockAnts[0].moveCommands.length > originalMoveCount, 'Small drag should move ant');
  
  // Should not have created a multi-selection
  let selectedCount = mockAnts.filter(ant => ant.isSelected).length;
  suite.assertTrue(selectedCount <= 1, 'Small drag should not create multi-selection');
});

// REGRESSION TEST 3: "handleMouseReleased parameter mismatch"
// Function calls with wrong number/type of parameters
suite.test('REGRESSION: Function parameter compatibility', () => {
  resetTestState();
  
  let originalHandleMouseReleased = global.handleMouseReleased;
  let parameterCalls = [];
  
  // Override function to track parameters
  global.handleMouseReleased = function() {
    parameterCalls.push(Array.from(arguments));
    return originalHandleMouseReleased.apply(this, arguments);
  };
  
  try {
    // Simulate the full interaction that broke before
    selectedAnt = mockAnts[0];
    selectedAnt.isSelected = true;
    
    mouseX = 150;
    mouseY = 150;
    handleMousePressed(mockAnts, mouseX, mouseY, AntClickControl, selectedAnt, moveSelectedAntToTile, TILE_SIZE, LEFT);
    
    mouseX = 200;
    mouseY = 200;
    handleMouseDragged(mouseX, mouseY, mockAnts);
    
    // This call should work with correct parameters
    handleMouseReleased(mockAnts, selectedAnt, moveSelectedAntToTile, TILE_SIZE);
    
    suite.assertTrue(parameterCalls.length > 0, 'handleMouseReleased should be called');
    suite.assertEqual(parameterCalls[0].length, 4, 'Should have correct number of parameters');
    
  } finally {
    global.handleMouseReleased = originalHandleMouseReleased;
  }
});

// REGRESSION TEST 4: "Selection state not cleared properly"
// Selection box state persisting between interactions
suite.test('REGRESSION: Selection state cleanup', () => {
  resetTestState();
  
  // Start and complete a selection
  mouseX = 50;
  mouseY = 50;
  handleMousePressed(mockAnts, mouseX, mouseY, AntClickControl, selectedAnt, moveSelectedAntToTile, TILE_SIZE, LEFT);
  
  mouseX = 350;
  mouseY = 150;
  handleMouseDragged(mouseX, mouseY, mockAnts);
  handleMouseReleased(mockAnts, selectedAnt, moveSelectedAntToTile, TILE_SIZE);
  
  // State should be completely clean
  suite.assertFalse(global.isSelecting, 'isSelecting should be false after completion');
  suite.assertTrue(global.selectionStart === null, 'selectionStart should be null after completion');
  suite.assertTrue(global.selectionEnd === null, 'selectionEnd should be null after completion');
  
  // No hover states should remain
  let hoveredCount = mockAnts.filter(ant => ant.isBoxHovered).length;
  suite.assertEqual(hoveredCount, 0, 'No ants should have hover state after selection');
});

// REGRESSION TEST 5: "Right-click not clearing single selection"
// Right-click deselection not working with selectedAnt
suite.test('REGRESSION: Right-click clearing single selection', () => {
  resetTestState();
  
  // Set up single selection
  selectedAnt = mockAnts[0];
  selectedAnt.isSelected = true;
  
  mouseX = 200;
  mouseY = 200;
  
  // Right-click should clear everything
  handleMousePressed(mockAnts, mouseX, mouseY, AntClickControl, selectedAnt, moveSelectedAntToTile, TILE_SIZE, RIGHT);
  
  suite.assertTrue(selectedAnt === null || selectedAnt === undefined, 'selectedAnt should be cleared by right-click');
  suite.assertFalse(mockAnts[0].isSelected, 'Ant should be deselected by right-click');
  suite.assertEqual(global.selectedEntities.length, 0, 'selectedEntities should be empty after right-click');
});

// REGRESSION TEST 6: "Multi-selection not clearing selectedAnt"
// Box selection not properly clearing single selection state
suite.test('REGRESSION: Box selection clearing single selection', () => {
  resetTestState();
  
  // Start with single selection
  selectedAnt = mockAnts[0];
  selectedAnt.isSelected = true;
  
  // Do box selection
  mouseX = 150;
  mouseY = 50;
  handleMousePressed(mockAnts, mouseX, mouseY, AntClickControl, selectedAnt, moveSelectedAntToTile, TILE_SIZE, LEFT);
  
  mouseX = 350;
  mouseY = 150;
  handleMouseDragged(mouseX, mouseY, mockAnts);
  handleMouseReleased(mockAnts, selectedAnt, moveSelectedAntToTile, TILE_SIZE);
  
  // Should properly transition to multi-selection
  suite.assertTrue(global.selectedEntities.length > 1, 'Should have multi-selection');
  
  // Single selection state should be consistent
  let selectedCount = mockAnts.filter(ant => ant.isSelected).length;
  suite.assertEqual(selectedCount, global.selectedEntities.length, 'Single and multi selection states should be consistent');
});

// REGRESSION TEST 7: "Wrapped ants breaking selection"
// AntWrapper objects not being handled correctly
suite.test('REGRESSION: Wrapped ant selection compatibility', () => {
  resetTestState();
  
  // Create wrapped versions
  let wrappedAnts = mockAnts.map(ant => ({ antObject: ant }));
  
  // Try single selection on wrapped ant
  mouseX = 110;
  mouseY = 110;
  handleMousePressed(wrappedAnts, mouseX, mouseY, AntClickControl, selectedAnt, moveSelectedAntToTile, TILE_SIZE, LEFT);
  
  suite.assertTrue(selectedAnt !== null, 'Should select wrapped ant');
  
  // Try box selection with wrapped ants
  selectedAnt = null;
  mouseX = 50;
  mouseY = 50;
  handleMousePressed(wrappedAnts, mouseX, mouseY, AntClickControl, selectedAnt, moveSelectedAntToTile, TILE_SIZE, LEFT);
  
  mouseX = 350;
  mouseY = 150;
  handleMouseDragged(mouseX, mouseY, wrappedAnts);
  handleMouseReleased(wrappedAnts, selectedAnt, moveSelectedAntToTile, TILE_SIZE);
  
  // Should work with wrapped ants
  let selectedCount = mockAnts.filter(ant => ant.isSelected).length;
  suite.assertTrue(selectedCount > 0, 'Box selection should work with wrapped ants');
});

// REGRESSION TEST 8: "Movement commands not being issued"
// Click-to-move functionality breaking
suite.test('REGRESSION: Click-to-move functionality', () => {
  resetTestState();
  
  // Select ant
  selectedAnt = mockAnts[0];
  selectedAnt.isSelected = true;
  
  mouseX = 400;
  mouseY = 400;
  
  // Click to move (not on any ant)
  const originalMoveCount = mockAnts[0].moveCommands.length;
  
  handleMousePressed(mockAnts, mouseX, mouseY, AntClickControl, selectedAnt, moveSelectedAntToTile, TILE_SIZE, LEFT);
  
  // Should have issued movement command
  suite.assertTrue(mockAnts[0].moveCommands.length > originalMoveCount, 'Click should issue movement command');
  
  // Should have called AntClickControl
  suite.assertTrue(AntClickControl.callCount > 0, 'AntClickControl should be called');
});

// REGRESSION TEST 9: "Multi-ant movement spreading"
// Multi-selection movement not spreading ants in circle
suite.test('REGRESSION: Multi-ant movement spreading', () => {
  resetTestState();
  
  // Set up multi-selection
  mockAnts[0].isSelected = true;
  mockAnts[1].isSelected = true;
  global.selectedEntities = [mockAnts[0], mockAnts[1]];
  
  mouseX = 500;
  mouseY = 500;
  
  handleMousePressed(mockAnts, mouseX, mouseY, AntClickControl, selectedAnt, moveSelectedAntToTile, TILE_SIZE, LEFT);
  
  // Both ants should have move commands
  suite.assertTrue(mockAnts[0].moveCommands.length > 0, 'First ant should have move command');
  suite.assertTrue(mockAnts[1].moveCommands.length > 0, 'Second ant should have move command');
  
  // Commands should be different (spread in circle)
  let firstCommand = mockAnts[0].moveCommands[mockAnts[0].moveCommands.length - 1];
  let secondCommand = mockAnts[1].moveCommands[mockAnts[1].moveCommands.length - 1];
  
  let distance = Math.sqrt(Math.pow(firstCommand.x - secondCommand.x, 2) + Math.pow(firstCommand.y - secondCommand.y, 2));
  suite.assertTrue(distance > 10, 'Multi-ant movement should spread ants apart');
});

// REGRESSION TEST 10: "Function existence checks failing"
// typeof checks for functions failing
suite.test('REGRESSION: Function existence validation', () => {
  resetTestState();
  
  // Test all function existence checks that appear in the code
  suite.assertTrue(typeof handleMousePressed === 'function', 'handleMousePressed should exist');
  suite.assertTrue(typeof handleMouseDragged === 'function', 'handleMouseDragged should exist');
  suite.assertTrue(typeof handleMouseReleased === 'function', 'handleMouseReleased should exist');
  suite.assertTrue(typeof moveSelectedAntToTile === 'function', 'moveSelectedAntToTile should exist');
  
  // deselectAllEntities might not be available in test environment
  if (typeof deselectAllEntities !== 'undefined') {
    suite.assertTrue(typeof deselectAllEntities === 'function', 'deselectAllEntities should exist');
  }
  
  // Test that they can be called without errors
  try {
    handleMousePressed(mockAnts, 100, 100, AntClickControl, selectedAnt, moveSelectedAntToTile, TILE_SIZE, LEFT);
    handleMouseDragged(150, 150, mockAnts);
    handleMouseReleased(mockAnts, selectedAnt, moveSelectedAntToTile, TILE_SIZE);
    if (typeof deselectAllEntities === 'function') {
      deselectAllEntities();
    }
    
    suite.assertTrue(true, 'All functions should be callable without errors');
  } catch (error) {
    suite.assert(false, `Function call error: ${error.message}`);
  }
});

// Run all regression tests
suite.run();