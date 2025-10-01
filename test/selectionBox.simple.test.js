// DEPRECATED: This test file checks legacy selectionBox.js logic. The codebase now uses SelectionBoxController and MouseInputController. Update or remove these tests as needed.
// Simple Selection Box Validation Tests
// Tests the key functionality that keeps breaking
// Run with: node test/selectionBox.simple.test.js

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

  assertTrue(condition, message) {
    this.assert(condition === true, message);
  }

  assertFalse(condition, message) {
    this.assert(condition === false, message);
  }

  run() {
    console.log('✅ Running Simple Selection Box Validation Tests...\n');
    
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
      console.log('🎉 All validation tests passed!');
    } else {
      console.log('❌ Some validation tests failed!');
      process.exit(1);
    }
  }
}

const suite = new TestSuite();

// Test 1: Selection Box Logic Structure
suite.test('Selection box logic exists and is structured correctly', () => {
  const fs = require('fs');
  const content = fs.readFileSync('./Classes/selectionBox.js', 'utf8');
  
  // Check for key functions
  suite.assertTrue(content.includes('function handleMousePressed'), 'handleMousePressed function should exist');
  suite.assertTrue(content.includes('function handleMouseDragged'), 'handleMouseDragged function should exist');
  suite.assertTrue(content.includes('function handleMouseReleased'), 'handleMouseReleased function should exist');
  
  // Check for the fix we implemented
  suite.assertTrue(content.includes('if (!entityWasClicked)'), 'Should allow selection regardless of selectedEntity state');
  
  // Check for click vs drag detection
  suite.assertTrue(content.includes('dragDistance'), 'Should have click vs drag detection');
  suite.assertTrue(content.includes('< 5'), 'Should use 5 pixel threshold for click detection');
});

// Test 2: Function Parameters
suite.test('Functions have correct parameter signatures', () => {
  const fs = require('fs');
  const content = fs.readFileSync('./Classes/selectionBox.js', 'utf8');
  
  // Check handleMousePressed parameters
  const mousePressedMatch = content.match(/function handleMousePressed\((.*?)\)/);
  suite.assertTrue(mousePressedMatch !== null, 'handleMousePressed should have parameters');
  
  const pressedParams = mousePressedMatch[1].split(',').g_map(p => p.trim());
  suite.assertTrue(pressedParams.length >= 7, 'handleMousePressed should have at least 7 parameters');
  
  // Check handleMouseReleased parameters  
  const mouseReleasedMatch = content.match(/function handleMouseReleased\((.*?)\)/);
  suite.assertTrue(mouseReleasedMatch !== null, 'handleMouseReleased should have parameters');
  
  const releasedParams = mouseReleasedMatch[1].split(',').g_map(p => p.trim());
  suite.assertTrue(releasedParams.length >= 4, 'handleMouseReleased should have at least 4 parameters');
});

// Test 3: Selection Logic Fix
suite.test('Selection logic allows drag with pre-selected ant', () => {
  const fs = require('fs');
  const content = fs.readFileSync('./Classes/selectionBox.js', 'utf8');
  
  // Should NOT have the old logic that blocked selection
  suite.assertFalse(content.includes('if (!entityWasClicked && !selectedEntity)'), 
    'Should not block selection when entity is selected');
  
  // Should have the new logic that allows selection
  suite.assertTrue(content.includes('if (!entityWasClicked)'), 
    'Should allow selection regardless of selectedEntity');
    
  // Should start selection box
  suite.assertTrue(content.includes('isSelecting = true'), 'Should set isSelecting flag');
  suite.assertTrue(content.includes('selectionStart = createVector'), 'Should set selection start');
});

// Test 4: Click vs Drag Detection
suite.test('Click vs drag detection is implemented', () => {
  const fs = require('fs');
  const content = fs.readFileSync('./Classes/selectionBox.js', 'utf8');
  
  // Should calculate drag distance
  suite.assertTrue(content.includes('Math.sqrt'), 'Should calculate distance');
  suite.assertTrue(content.includes('Math.pow'), 'Should use power calculation for distance');
  
  // Should have threshold check
  suite.assertTrue(content.includes('< 5'), 'Should have 5-pixel threshold');
  
  // Should handle small drags as clicks
  suite.assertTrue(content.includes('isClick'), 'Should detect clicks vs drags');
  suite.assertTrue(content.includes('moveSelectedEntityToTile'), 'Should move on small drag');
});

// Test 5: Multi-Selection Movement
suite.test('Multi-selection movement is implemented', () => {
  const fs = require('fs');
  const selectionContent = fs.readFileSync('./Classes/selectionBox.js', 'utf8');
  const antsContent = fs.readFileSync('./Classes/ants/ants.js', 'utf8');
  
  // Should handle multiple selected entities in selection box
  suite.assertTrue(selectionContent.includes('selectedEntities.length > 1'), 'Should detect multi-selection');
  
  // Should call moveSelectedEntitiesToTile function
  suite.assertTrue(selectionContent.includes('moveSelectedEntitiesToTile'), 'Should call multi-entity movement function');
  
  // Should spread ants in circle (in ants.js)
  suite.assertTrue(antsContent.includes('angleStep'), 'Should calculate angle steps for spreading');
  suite.assertTrue(antsContent.includes('Math.cos'), 'Should use cosine for circle positioning');
  suite.assertTrue(antsContent.includes('Math.sin'), 'Should use sine for circle positioning');
  
  // Should call setPath on each ant (in ants.js)
  suite.assertTrue(antsContent.includes('setPath'), 'Should set path for individual ants');
});

// Test 6: State Cleanup
suite.test('Selection state is properly cleaned up', () => {
  const fs = require('fs');
  const content = fs.readFileSync('./Classes/selectionBox.js', 'utf8');
  
  // Should reset selection state
  suite.assertTrue(content.includes('isSelecting = false'), 'Should reset isSelecting');
  suite.assertTrue(content.includes('selectionStart = null'), 'Should reset selectionStart');
  suite.assertTrue(content.includes('selectionEnd = null'), 'Should reset selectionEnd');
  
  // Should clear hover states
  suite.assertTrue(content.includes('isBoxHovered = false'), 'Should clear hover states');
});

// Test 7: Right-Click Deselection
suite.test('Right-click deselection is implemented', () => {
  const fs = require('fs');
  const content = fs.readFileSync('./Classes/selectionBox.js', 'utf8');
  
  // Should check for right click
  suite.assertTrue(content.includes('RIGHT'), 'Should check for right mouse button');
  
  // Should call deselectAllEntities
  suite.assertTrue(content.includes('deselectAllEntities'), 'Should deselect all entities on right click');
});

// Test 8: Exports for Testing
suite.test('Functions are exported for testing', () => {
  const fs = require('fs');
  const content = fs.readFileSync('./Classes/selectionBox.js', 'utf8');
  
  // Should have module exports
  suite.assertTrue(content.includes('module.exports'), 'Should export functions for testing');
  suite.assertTrue(content.includes('handleMousePressed'), 'Should export handleMousePressed');
  suite.assertTrue(content.includes('handleMouseDragged'), 'Should export handleMouseDragged');
  suite.assertTrue(content.includes('handleMouseReleased'), 'Should export handleMouseReleased');
});

// Test 9: Sketch.js Integration
suite.test('Sketch.js calls selection functions correctly', () => {
  const fs = require('fs');
  const content = fs.readFileSync('./sketch.js', 'utf8');
  
  // Should call handleMousePressed with correct parameters
  suite.assertTrue(content.includes('handleMousePressed'), 'sketch.js should call handleMousePressed');
  suite.assertTrue(content.includes('handleMouseDragged'), 'sketch.js should call handleMouseDragged');
  suite.assertTrue(content.includes('handleMouseReleased'), 'sketch.js should call handleMouseReleased');
  
  // Should pass the right parameters to handleMouseReleased
  const mouseReleasedCall = content.match(/handleMouseReleased\((.*?)\)/);
  if (mouseReleasedCall) {
    const params = mouseReleasedCall[1].split(',').map(p => p.trim());
    suite.assertTrue(params.length >= 4, 'handleMouseReleased should be called with at least 4 parameters');
    suite.assertTrue(params.includes('selectedAnt'), 'Should pass selectedAnt parameter');
    suite.assertTrue(params.includes('TILE_SIZE'), 'Should pass TILE_SIZE parameter');
  }
});

// Test 10: Key Bug Prevention
suite.test('Key regression bugs are prevented', () => {
  const fs = require('fs');
  const selectionContent = fs.readFileSync('./Classes/selectionBox.js', 'utf8');
  
  // BUG 1: Selection blocked when ant selected
  suite.assertFalse(selectionContent.includes('!selectedEntity') && selectionContent.includes('isSelecting = true'), 
    'Should not block selection based on selectedEntity');
  
  // BUG 2: Missing parameters in function calls
  const sketchContent = fs.readFileSync('./sketch.js', 'utf8');
  const mouseReleasedMatch = sketchContent.match(/handleMouseReleased\([^)]+\)/);
  if (mouseReleasedMatch) {
    const paramCount = mouseReleasedMatch[0].split(',').length;
    suite.assertTrue(paramCount >= 4, 'handleMouseReleased should have enough parameters');
  }
  
  // BUG 3: Click vs drag not detected
  suite.assertTrue(selectionContent.includes('dragDistance'), 'Should detect drag distance');
  
  // BUG 4: State not cleaned up
  suite.assertTrue(selectionContent.includes('isSelecting = false'), 'Should clean up selection state');
});

// Run all tests
suite.run();