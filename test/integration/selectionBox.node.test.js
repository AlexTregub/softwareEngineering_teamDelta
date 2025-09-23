#!/usr/bin/env node

/**
 * Selection Box Test Suite - Node.js Compatible Version
 * Tests for mouse selection, box selection, and entity management
 * Run with: node test/selectionBox.node.test.js
 */

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
    console.log('🧪 Running Selection Box Test Suite (Node.js)...\n');
    
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
      console.log('💥 Some tests failed!');
      process.exit(1);
    }
  }
}

// Mock ant entity for testing
class MockAnt {
  constructor(x, y, width = 32, height = 32, faction = "player") {
    this.posX = x;
    this.posY = y;
    this.sizeX = width;
    this.sizeY = height;
    this.faction = faction;
    this._isSelected = false;
    this.isSelected = false;
    this.isBoxHovered = false;
    this.antObject = null;
  }

  // Mock the isMouseOver function
  isMouseOver(mx, my) {
    return (
      mx >= this.posX &&
      mx <= this.posX + this.sizeX &&
      my >= this.posY &&
      my <= this.posY + this.sizeY
    );
  }

  // Mock movement function
  moveToLocation(x, y) {
    // Silent in Node.js tests
    return true;
  }

  // Mock position getter for compatibility
  getPosition() {
    return { x: this.posX, y: this.posY };
  }

  // Mock size getter for compatibility
  getSize() {
    return { x: this.sizeX, y: this.sizeY };
  }
}

// Mock selection box functions
class SelectionBox {
  constructor() {
    this.entities = [];
    this.selectedEntities = [];
    this.isSelecting = false;
    this.selectionStart = null;
    this.selectionEnd = null;
  }

  // Mock entity under mouse detection
  isEntityUnderMouse(entity, mouseX, mouseY) {
    if (!entity) {
      return false;
    }
    
    const entityObj = entity.antObject ? entity.antObject : entity;
    if (!entityObj || typeof entityObj.isMouseOver !== 'function') {
      return false;
    }
    
    return entityObj.isMouseOver(mouseX, mouseY);
  }

  // Mock box selection logic
  selectEntitiesInBox(startX, startY, endX, endY) {
    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    const minY = Math.min(startY, endY);
    const maxY = Math.max(startY, endY);

    let selectedCount = 0;
    this.selectedEntities = [];

    for (const entity of this.entities) {
      if (!entity) continue;
      
      const entityObj = entity.antObject ? entity.antObject : entity;
      if (!entityObj) continue;
      
      // Check if entity is within selection box
      if (entityObj.posX + entityObj.sizeX >= minX &&
          entityObj.posX <= maxX &&
          entityObj.posY + entityObj.sizeY >= minY &&
          entityObj.posY <= maxY &&
          entityObj.faction === "player") {
        this.selectedEntities.push(entity);
        selectedCount++;
      }
    }

    return selectedCount;
  }

  // Mock faction filtering
  filterByFaction(entities, faction) {
    return entities.filter(entity => {
      if (!entity) return false;
      const entityObj = entity.antObject ? entity.antObject : entity;
      return entityObj && entityObj.faction === faction;
    });
  }
}

// Initialize test suite
const testSuite = new TestSuite();
const selectionBox = new SelectionBox();

// Test 1: Mock Ant Creation
testSuite.test('Mock Ant Creation', () => {
  const ant = new MockAnt(100, 150, 32, 32, "player");
  
  testSuite.assertEqual(ant.posX, 100, 'Ant X position should be 100');
  testSuite.assertEqual(ant.posY, 150, 'Ant Y position should be 150');
  testSuite.assertEqual(ant.sizeX, 32, 'Ant width should be 32');
  testSuite.assertEqual(ant.sizeY, 32, 'Ant height should be 32');
  testSuite.assertEqual(ant.faction, "player", 'Ant faction should be player');
});

// Test 2: Mouse Over Detection
testSuite.test('Mouse Over Detection', () => {
  const ant = new MockAnt(100, 100, 32, 32);
  
  // Test inside bounds
  testSuite.assertTrue(ant.isMouseOver(116, 116), 'Mouse should be over ant at center');
  testSuite.assertTrue(ant.isMouseOver(100, 100), 'Mouse should be over ant at top-left');
  testSuite.assertTrue(ant.isMouseOver(132, 132), 'Mouse should be over ant at bottom-right');
  
  // Test outside bounds
  testSuite.assertFalse(ant.isMouseOver(99, 116), 'Mouse should not be over ant to the left');
  testSuite.assertFalse(ant.isMouseOver(133, 116), 'Mouse should not be over ant to the right');
  testSuite.assertFalse(ant.isMouseOver(116, 99), 'Mouse should not be over ant above');
  testSuite.assertFalse(ant.isMouseOver(116, 133), 'Mouse should not be over ant below');
});

// Test 3: Entity Under Mouse Detection
testSuite.test('Entity Under Mouse Detection', () => {
  const ant1 = new MockAnt(100, 100, 32, 32);
  const ant2 = new MockAnt(200, 200, 32, 32);
  
  testSuite.assertTrue(selectionBox.isEntityUnderMouse(ant1, 116, 116), 'Should detect ant1 under mouse');
  testSuite.assertFalse(selectionBox.isEntityUnderMouse(ant1, 250, 250), 'Should not detect ant1 at distant point');
  testSuite.assertTrue(selectionBox.isEntityUnderMouse(ant2, 216, 216), 'Should detect ant2 under mouse');
  testSuite.assertFalse(selectionBox.isEntityUnderMouse(null, 116, 116), 'Should handle null entity');
});

// Test 4: Box Selection Logic
testSuite.test('Box Selection Logic', () => {
  // Setup entities
  selectionBox.entities = [
    new MockAnt(50, 50, 32, 32, "player"),    // Inside selection
    new MockAnt(100, 100, 32, 32, "player"),  // Inside selection
    new MockAnt(200, 200, 32, 32, "player"),  // Outside selection
    new MockAnt(75, 75, 32, 32, "enemy")      // Wrong faction
  ];
  
  // Select box from (40, 40) to (150, 150)
  const selectedCount = selectionBox.selectEntitiesInBox(40, 40, 150, 150);
  
  testSuite.assertEqual(selectedCount, 2, 'Should select 2 player ants in box');
  testSuite.assertEqual(selectionBox.selectedEntities.length, 2, 'Selected entities array should have 2 items');
});

// Test 5: Wrapped Entity Handling
testSuite.test('Wrapped Entity Handling', () => {
  const mockAnt = new MockAnt(100, 100, 32, 32, "player");
  const wrappedAnt = {
    antObject: mockAnt,
    someOtherProperty: "test"
  };
  
  selectionBox.entities = [wrappedAnt];
  const selectedCount = selectionBox.selectEntitiesInBox(50, 50, 150, 150);
  
  testSuite.assertEqual(selectedCount, 1, 'Should handle wrapped ant entities');
  testSuite.assertTrue(selectionBox.isEntityUnderMouse(wrappedAnt, 116, 116), 'Should detect wrapped ant under mouse');
});

// Test 6: Faction Filtering
testSuite.test('Faction Filtering', () => {
  const entities = [
    new MockAnt(50, 50, 32, 32, "player"),
    new MockAnt(100, 100, 32, 32, "enemy"),
    new MockAnt(150, 150, 32, 32, "player"),
    new MockAnt(200, 200, 32, 32, "enemy")
  ];
  
  const playerEntities = selectionBox.filterByFaction(entities, "player");
  const enemyEntities = selectionBox.filterByFaction(entities, "enemy");
  
  testSuite.assertEqual(playerEntities.length, 2, 'Should filter 2 player entities');
  testSuite.assertEqual(enemyEntities.length, 2, 'Should filter 2 enemy entities');
  
  // Verify faction correctness
  for (const entity of playerEntities) {
    testSuite.assertEqual(entity.faction, "player", 'Filtered player entity should have player faction');
  }
  
  for (const entity of enemyEntities) {
    testSuite.assertEqual(entity.faction, "enemy", 'Filtered enemy entity should have enemy faction');
  }
});

// Test 7: Edge Cases
testSuite.test('Edge Cases and Error Handling', () => {
  const ant = new MockAnt(0, 0, 1, 1);  // Minimal size ant
  
  // Test edge coordinates
  testSuite.assertTrue(ant.isMouseOver(0, 0), 'Should detect mouse at exact corner');
  testSuite.assertTrue(ant.isMouseOver(1, 1), 'Should detect mouse at opposite corner');
  testSuite.assertFalse(ant.isMouseOver(-1, 0), 'Should not detect mouse outside bounds');
  
  // Test empty selection
  selectionBox.entities = [];
  const selectedCount = selectionBox.selectEntitiesInBox(0, 0, 100, 100);
  testSuite.assertEqual(selectedCount, 0, 'Should select 0 entities from empty array');
  
  // Test malformed entities
  selectionBox.entities = [null, undefined, {}];
  const selectedCount2 = selectionBox.selectEntitiesInBox(0, 0, 100, 100);
  testSuite.assertEqual(selectedCount2, 0, 'Should handle malformed entities gracefully');
});

// Test 8: Performance Test (Simplified for Node.js)
testSuite.test('Performance Test', () => {
  const startTime = Date.now();
  
  // Create many entities
  const entities = [];
  for (let i = 0; i < 1000; i++) {
    entities.push(new MockAnt(
      Math.random() * 800,
      Math.random() * 600,
      32, 32, "player"
    ));
  }
  
  selectionBox.entities = entities;
  
  // Perform selection
  const selectedCount = selectionBox.selectEntitiesInBox(0, 0, 400, 300);
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  testSuite.assertTrue(duration < 100, `Performance test should complete in <100ms (took ${duration}ms)`);
  testSuite.assertTrue(selectedCount >= 0, 'Should return valid selection count');
  
  console.log(`    Performance: Selected ${selectedCount} entities in ${duration}ms`);
});

// Test 9: Complex Scenarios
testSuite.test('Complex Selection Scenarios', () => {
  // Mixed faction scenario
  selectionBox.entities = [
    new MockAnt(10, 10, 32, 32, "player"),
    new MockAnt(20, 20, 32, 32, "enemy"),
    new MockAnt(30, 30, 32, 32, "player"),
    new MockAnt(40, 40, 32, 32, "neutral")
  ];
  
  // Select large area that contains all entities
  const selectedCount = selectionBox.selectEntitiesInBox(0, 0, 100, 100);
  
  // Should only select player entities
  testSuite.assertEqual(selectedCount, 2, 'Should only select player faction entities');
  
  // Verify all selected are player faction
  for (const entity of selectionBox.selectedEntities) {
    const entityObj = entity.antObject ? entity.antObject : entity;
    testSuite.assertEqual(entityObj.faction, "player", 'All selected entities should be player faction');
  }
});

// Test 10: Boundary Testing
testSuite.test('Selection Boundary Testing', () => {
  const ant = new MockAnt(100, 100, 32, 32, "player");
  selectionBox.entities = [ant];
  
  // Test selections that just touch the ant
  const test1 = selectionBox.selectEntitiesInBox(50, 50, 100, 100);  // Just touches top-left
  const test2 = selectionBox.selectEntitiesInBox(132, 132, 200, 200); // Just touches bottom-right
  const test3 = selectionBox.selectEntitiesInBox(50, 50, 131, 131);   // Overlaps
  const test4 = selectionBox.selectEntitiesInBox(133, 133, 200, 200); // Completely outside
  
  testSuite.assertEqual(test1, 1, 'Should select ant when box touches top-left');
  testSuite.assertEqual(test2, 1, 'Should select ant when box touches bottom-right');
  testSuite.assertEqual(test3, 1, 'Should select ant when box overlaps');
  testSuite.assertEqual(test4, 0, 'Should not select ant when box is completely outside');
});

console.log('🚀 Starting Selection Box Test Suite (Node.js)\n');
console.log('=' .repeat(50));

// Run all tests
testSuite.run();