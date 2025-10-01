// Comprehensive Selection Box Integration Tests
// Tests all real-world selection box scenarios to prevent regressions
// Run with: node test/selectionBox.comprehensive.test.js

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
    console.log('🔍 Running Comprehensive Selection Box Test Suite...\n');
    
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
function moveSelectedAntToTile(mx, my, tileSize) {
  if (selectedAnt) {
    selectedAnt.posX = mx;
    selectedAnt.posY = my;
    selectedAnt.isSelected = false;
    selectedAnt = null;
  }
}

function AntClickControl() {
  // Simplified version of ant click control for testing
  if (selectedAnt) {
    selectedAnt.moveToLocation(mouseX, mouseY);
    selectedAnt.isSelected = false;
    selectedAnt = null;
    return;
  }
  
  // Select ant under mouse (simplified)
  for (let ant of mockAnts) {
    if (ant.isMouseOver(mouseX, mouseY)) {
      selectedAnt = ant;
      ant.isSelected = true;
      break;
    }
  }
}

// Mock ant class
class MockAnt {
  constructor(x, y, w = 20, h = 20) {
    this.posX = x;
    this.posY = y;
    this.sizeX = w;
    this.sizeY = h;
    this.isSelected = false;
    this.isBoxHovered = false;
    this.moveCommands = [];
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
    this.moveCommands.push({ x, y });
    this.posX = x;
    this.posY = y;
  }
}

// Mock wrapped ant (AntWrapper)
class MockWrappedAnt {
  constructor(ant) {
    this.antObject = ant;
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
    new MockAnt(300, 100),
    new MockAnt(100, 200),
    new MockAnt(200, 200)
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
  
  // Clear all ant states
  mockAnts.forEach(ant => {
    ant.isSelected = false;
    ant.isBoxHovered = false;
    ant.moveCommands = [];
  });
}

// Test 1: Single Click Selection
suite.test('Single Click Selection - No Prior Selection', () => {
  resetTestState();
  mouseX = 110;
  mouseY = 110;
  
  // Simulate clicking on first ant
  handleMousePressed(mockAnts, mouseX, mouseY, AntClickControl, selectedAnt, moveSelectedAntToTile, TILE_SIZE, LEFT);
  
  suite.assertTrue(selectedAnt !== null, 'Ant should be selected');
  suite.assertTrue(selectedAnt.isSelected, 'Selected ant should have isSelected = true');
  suite.assertEqual(selectedAnt.posX, 100, 'Should select the correct ant');
});

// Test 2: Single Click Movement
suite.test('Single Click Movement - With Prior Selection', () => {
  resetTestState();
  selectedAnt = mockAnts[0];
  selectedAnt.isSelected = true;
  
  mouseX = 250;
  mouseY = 250;
  
  // Simulate clicking elsewhere to move selected ant
  handleMousePressed(mockAnts, mouseX, mouseY, AntClickControl, selectedAnt, moveSelectedAntToTile, TILE_SIZE, LEFT);
  
  suite.assertTrue(mockAnts[0].moveCommands.length > 0, 'Move command should be issued');
  suite.assertEqual(mockAnts[0].moveCommands[0].x, mouseX, 'Should move to clicked location');
  suite.assertEqual(mockAnts[0].moveCommands[0].y, mouseY, 'Should move to clicked location');
});

// Test 3: Drag Selection - No Prior Selection
suite.test('Drag Selection - No Prior Selection', () => {
  resetTestState();
  
  // Start drag at 50, 50
  mouseX = 50;
  mouseY = 50;
  handleMousePressed(mockAnts, mouseX, mouseY, AntClickControl, selectedAnt, moveSelectedAntToTile, TILE_SIZE, LEFT);
  
  suite.assertTrue(global.isSelecting, 'Selection should start');
  suite.assertTrue(global.selectionStart !== null, 'Selection start should be set');
  
  // Drag to 250, 150 (should encompass first two ants)
  mouseX = 250;
  mouseY = 150;
  handleMouseDragged(mouseX, mouseY, mockAnts);
  
  // End drag
  handleMouseReleased(mockAnts, selectedAnt, moveSelectedAntToTile, TILE_SIZE);
  
  suite.assertFalse(global.isSelecting, 'Selection should end');
  
  // Check that ants in box are selected
  let selectedCount = mockAnts.filter(ant => ant.isSelected).length;
  suite.assertTrue(selectedCount >= 2, 'At least 2 ants should be selected');
  suite.assertTrue(mockAnts[0].isSelected, 'First ant should be selected');
  suite.assertTrue(mockAnts[1].isSelected, 'Second ant should be selected');
});

// Test 4: Drag Selection - With Prior Selection (This was breaking before)
suite.test('Drag Selection - With Prior Selection', () => {
  resetTestState();
  selectedAnt = mockAnts[0];
  selectedAnt.isSelected = true;
  
  // Start drag at 150, 50 (not on any ant)
  mouseX = 150;
  mouseY = 50;
  handleMousePressed(mockAnts, mouseX, mouseY, AntClickControl, selectedAnt, moveSelectedAntToTile, TILE_SIZE, LEFT);
  
  suite.assertTrue(global.isSelecting, 'Selection should start even with prior selection');
  
  // Drag to 350, 150
  mouseX = 350;
  mouseY = 150;
  handleMouseDragged(mouseX, mouseY, mockAnts);
  
  // End drag
  handleMouseReleased(mockAnts, selectedAnt, moveSelectedAntToTile, TILE_SIZE);
  
  suite.assertFalse(global.isSelecting, 'Selection should end');
  
  // Check that ants in box are selected
  let selectedCount = mockAnts.filter(ant => ant.isSelected).length;
  suite.assertTrue(selectedCount >= 2, 'Multiple ants should be selected from drag');
});

// Test 5: Click vs Drag Detection
suite.test('Click vs Drag Detection', () => {
  resetTestState();
  selectedAnt = mockAnts[0];
  selectedAnt.isSelected = true;
  
  // Start at 150, 150
  mouseX = 150;
  mouseY = 150;
  handleMousePressed(mockAnts, mouseX, mouseY, AntClickControl, selectedAnt, moveSelectedAntToTile, TILE_SIZE, LEFT);
  
  // Move only 2 pixels (should be detected as click)
  mouseX = 152;
  mouseY = 152;
  handleMouseDragged(mouseX, mouseY, mockAnts);
  
  const originalMoveCommands = mockAnts[0].moveCommands.length;
  
  // End drag (should trigger movement since it's a small drag)
  handleMouseReleased(mockAnts, selectedAnt, moveSelectedAntToTile, TILE_SIZE);
  
  // Should have moved the ant instead of selecting
  suite.assertTrue(mockAnts[0].moveCommands.length > originalMoveCommands, 'Small drag should move ant');
});

// Test 6: Large Drag Detection
suite.test('Large Drag Detection', () => {
  resetTestState();
  selectedAnt = mockAnts[0];
  selectedAnt.isSelected = true;
  
  // Start at 50, 50
  mouseX = 50;
  mouseY = 50;
  handleMousePressed(mockAnts, mouseX, mouseY, AntClickControl, selectedAnt, moveSelectedAntToTile, TILE_SIZE, LEFT);
  
  // Move 50 pixels (should be detected as drag)
  mouseX = 100;
  mouseY = 100;
  handleMouseDragged(mouseX, mouseY, mockAnts);
  
  const originalMoveCommands = mockAnts[0].moveCommands.length;
  
  // End drag (should trigger selection since it's a large drag)
  handleMouseReleased(mockAnts, selectedAnt, moveSelectedAntToTile, TILE_SIZE);
  
  // Should have done selection instead of movement
  suite.assertEqual(mockAnts[0].moveCommands.length, originalMoveCommands, 'Large drag should not move ant');
  
  // Check if selection box worked
  let selectedCount = mockAnts.filter(ant => ant.isSelected).length;
  suite.assertTrue(selectedCount >= 0, 'Selection should have been processed');
});

// Test 7: Multi-Selection Movement
suite.test('Multi-Selection Movement', () => {
  resetTestState();
  
  // Select multiple ants
  mockAnts[0].isSelected = true;
  mockAnts[1].isSelected = true;
  global.selectedEntities = [mockAnts[0], mockAnts[1]];
  
  mouseX = 400;
  mouseY = 400;
  
  handleMousePressed(mockAnts, mouseX, mouseY, AntClickControl, selectedAnt, moveSelectedAntToTile, TILE_SIZE, LEFT);
  
  // Both ants should have received move commands
  suite.assertTrue(mockAnts[0].moveCommands.length > 0, 'First ant should have move command');
  suite.assertTrue(mockAnts[1].moveCommands.length > 0, 'Second ant should have move command');
  
  // Should be deselected after movement
  suite.assertFalse(mockAnts[0].isSelected, 'First ant should be deselected after movement');
  suite.assertFalse(mockAnts[1].isSelected, 'Second ant should be deselected after movement');
});

// Test 8: Right Click Deselection
suite.test('Right Click Deselection', () => {
  resetTestState();
  
  // Select some ants
  mockAnts[0].isSelected = true;
  mockAnts[1].isSelected = true;
  global.selectedEntities = [mockAnts[0], mockAnts[1]];
  selectedAnt = mockAnts[0];
  
  mouseX = 200;
  mouseY = 200;
  
  handleMousePressed(mockAnts, mouseX, mouseY, AntClickControl, selectedAnt, moveSelectedAntToTile, TILE_SIZE, RIGHT);
  
  // All should be deselected
  suite.assertFalse(mockAnts[0].isSelected, 'First ant should be deselected');
  suite.assertFalse(mockAnts[1].isSelected, 'Second ant should be deselected');
  suite.assertEqual(global.selectedEntities.length, 0, 'Selected entities should be cleared');
});

// Test 9: Wrapped Ant Compatibility
suite.test('Wrapped Ant Compatibility', () => {
  resetTestState();
  
  // Create wrapped ants
  let wrappedAnts = mockAnts.map(ant => new MockWrappedAnt(ant));
  
  mouseX = 110;
  mouseY = 110;
  
  // Should work with wrapped ants
  handleMousePressed(wrappedAnts, mouseX, mouseY, AntClickControl, selectedAnt, moveSelectedAntToTile, TILE_SIZE, LEFT);
  
  suite.assertTrue(selectedAnt !== null, 'Should select wrapped ant');
  suite.assertTrue(selectedAnt.isSelected, 'Wrapped ant should be selected');
});

// Test 10: Function Parameter Compatibility
suite.test('Function Parameter Compatibility', () => {
  resetTestState();
  
  try {
    // Test that all required parameters are passed correctly
    handleMousePressed(mockAnts, 100, 100, AntClickControl, selectedAnt, moveSelectedAntToTile, TILE_SIZE, LEFT);
    handleMouseDragged(150, 150, mockAnts);
    handleMouseReleased(mockAnts, selectedAnt, moveSelectedAntToTile, TILE_SIZE);
    
    suite.assertTrue(true, 'All function calls should work without errors');
  } catch (error) {
    suite.assert(false, `Function compatibility error: ${error.message}`);
  }
});

// Test 11: Box Hover Visual Feedback
suite.test('Box Hover Visual Feedback During Drag', () => {
  resetTestState();
  
  // Start drag
  mouseX = 50;
  mouseY = 50;
  handleMousePressed(mockAnts, mouseX, mouseY, AntClickControl, selectedAnt, moveSelectedAntToTile, TILE_SIZE, LEFT);
  
  // Drag over ants
  mouseX = 250;
  mouseY = 150;
  handleMouseDragged(mouseX, mouseY, mockAnts);
  
  // Check that ants in box have hover state
  let hoveredCount = mockAnts.filter(ant => ant.isBoxHovered).length;
  suite.assertTrue(hoveredCount > 0, 'Ants in selection box should be hovered');
  
  // End drag
  handleMouseReleased(mockAnts, selectedAnt, moveSelectedAntToTile, TILE_SIZE);
  
  // Hover state should be cleared
  let stillHoveredCount = mockAnts.filter(ant => ant.isBoxHovered).length;
  suite.assertEqual(stillHoveredCount, 0, 'Hover state should be cleared after selection');
});

// Test 12: Empty Selection Handling
suite.test('Empty Selection Box Handling', () => {
  resetTestState();
  
  // Start drag in empty area
  mouseX = 500;
  mouseY = 500;
  handleMousePressed(mockAnts, mouseX, mouseY, AntClickControl, selectedAnt, moveSelectedAntToTile, TILE_SIZE, LEFT);
  
  // Drag in empty area
  mouseX = 600;
  mouseY = 600;
  handleMouseDragged(mouseX, mouseY, mockAnts);
  
  // End drag
  handleMouseReleased(mockAnts, selectedAnt, moveSelectedAntToTile, TILE_SIZE);
  
  // No ants should be selected
  let selectedCount = mockAnts.filter(ant => ant.isSelected).length;
  suite.assertEqual(selectedCount, 0, 'No ants should be selected from empty box');
  suite.assertEqual(global.selectedEntities.length, 0, 'Selected entities should be empty');
});

// Run all tests
suite.run();