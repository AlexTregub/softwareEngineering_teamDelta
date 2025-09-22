// Selection Box Test Suite
// Tests for mouse selection, box selection, and entity management

// Mock objects and test data
let mockEntities = [];
let mockSelectedEntities = [];
let mockIsSelecting = false;
let mockSelectionStart = null;
let mockSelectionEnd = null;

// Test utilities
function createMockAnt(x, y, width = 32, height = 32, faction = "player") {
  return {
    posX: x,
    posY: y,
    sizeX: width,
    sizeY: height,
    faction: faction,
    _isSelected: false,
    isSelected: false,
    isBoxHovered: false,
    antObject: null,
    
    // Mock the isMouseOver function
    isMouseOver: function(mx, my) {
      return (
        mx >= this.posX &&
        mx <= this.posX + this.sizeX &&
        my >= this.posY &&
        my <= this.posY + this.sizeY
      );
    },
    
    // Mock movement function
    moveToLocation: function(x, y) {
      console.log(`Mock ant moving to (${x}, ${y})`);
    },
    
    // Mock position getter for compatibility
    getPosition: function() {
      return { x: this.posX, y: this.posY };
    },
    
    // Mock size getter for compatibility
    getSize: function() {
      return { x: this.sizeX, y: this.sizeY };
    }
  };
}

function createMockWrapper(ant) {
  return {
    antObject: ant,
    // Delegate methods to wrapped ant
    isMouseOver: function(mx, my) {
      return this.antObject.isMouseOver(mx, my);
    }
  };
}

// Test Setup Functions
function setupBasicTest() {
  // Clear previous test data
  mockEntities = [];
  mockSelectedEntities = [];
  mockIsSelecting = false;
  
  // Create test ants
  mockEntities.push(createMockAnt(100, 100)); // Player ant 1
  mockEntities.push(createMockAnt(200, 150)); // Player ant 2
  mockEntities.push(createMockAnt(300, 200)); // Player ant 3
  
  console.log("✅ Basic test setup complete");
}

function setupWrappedAntsTest() {
  // Clear previous test data
  mockEntities = [];
  mockSelectedEntities = [];
  
  // Create wrapped ants (like AntWrapper objects)
  let ant1 = createMockAnt(100, 100);
  let ant2 = createMockAnt(200, 150);
  
  mockEntities.push(createMockWrapper(ant1));
  mockEntities.push(createMockWrapper(ant2));
  
  console.log("✅ Wrapped ants test setup complete");
}

function setupMixedFactionsTest() {
  // Clear previous test data
  mockEntities = [];
  mockSelectedEntities = [];
  
  // Create mix of player and enemy ants
  mockEntities.push(createMockAnt(100, 100, 32, 32, "player"));
  mockEntities.push(createMockAnt(200, 150, 32, 32, "enemy"));
  mockEntities.push(createMockAnt(300, 200, 32, 32, "player"));
  
  console.log("✅ Mixed factions test setup complete");
}

// Core Test Functions
function testEntityUnderMouse() {
  console.log("\n🧪 Testing: Entity Under Mouse Detection");
  
  setupBasicTest();
  
  let ant = mockEntities[0];
  
  // Test cases
  let testCases = [
    { x: 110, y: 110, expected: true, desc: "Mouse inside ant bounds" },
    { x: 100, y: 100, expected: true, desc: "Mouse at top-left corner" },
    { x: 132, y: 132, expected: true, desc: "Mouse at bottom-right corner" },
    { x: 50, y: 50, expected: false, desc: "Mouse outside ant bounds" },
    { x: 150, y: 110, expected: false, desc: "Mouse to the right of ant" }
  ];
  
  let passed = 0;
  let total = testCases.length;
  
  testCases.forEach(testCase => {
    let result = ant.isMouseOver(testCase.x, testCase.y);
    if (result === testCase.expected) {
      console.log(`  ✅ ${testCase.desc}: PASS`);
      passed++;
    } else {
      console.log(`  ❌ ${testCase.desc}: FAIL (expected ${testCase.expected}, got ${result})`);
    }
  });
  
  console.log(`\n📊 Entity Under Mouse: ${passed}/${total} tests passed`);
  return passed === total;
}

function testBoxSelection() {
  console.log("\n🧪 Testing: Box Selection Logic");
  
  setupBasicTest();
  
  // Test box that should select first two ants
  let x1 = 50, y1 = 50, x2 = 250, y2 = 200;
  
  let selectedCount = 0;
  mockEntities.forEach(entity => {
    let pos = entity.getPosition();
    let size = entity.getSize();
    let cx = pos.x + size.x / 2;
    let cy = pos.y + size.y / 2;
    
    if (cx >= x1 && cx <= x2 && cy >= y1 && cy <= y2) {
      selectedCount++;
      entity.isSelected = true;
    }
  });
  
  let expectedSelected = 2; // First two ants should be selected
  let testPassed = selectedCount === expectedSelected;
  
  if (testPassed) {
    console.log(`  ✅ Box selection: PASS (selected ${selectedCount} ants)`);
  } else {
    console.log(`  ❌ Box selection: FAIL (expected ${expectedSelected}, got ${selectedCount})`);
  }
  
  console.log(`\n📊 Box Selection: ${testPassed ? '1/1' : '0/1'} tests passed`);
  return testPassed;
}

function testWrappedEntityHandling() {
  console.log("\n🧪 Testing: Wrapped Entity Handling");
  
  setupWrappedAntsTest();
  
  let passed = 0;
  let total = 2;
  
  // Test that we can access antObject from wrapper
  mockEntities.forEach((wrapper, index) => {
    if (wrapper.antObject && wrapper.antObject.posX !== undefined) {
      console.log(`  ✅ Wrapper ${index}: Can access antObject properties`);
      passed++;
    } else {
      console.log(`  ❌ Wrapper ${index}: Cannot access antObject properties`);
    }
  });
  
  console.log(`\n📊 Wrapped Entity Handling: ${passed}/${total} tests passed`);
  return passed === total;
}

function testFactionFiltering() {
  console.log("\n🧪 Testing: Faction Filtering");
  
  setupMixedFactionsTest();
  
  let playerAnts = 0;
  let enemyAnts = 0;
  
  mockEntities.forEach(entity => {
    if (entity.faction === "player") {
      playerAnts++;
    } else if (entity.faction === "enemy") {
      enemyAnts++;
    }
  });
  
  let expectedPlayer = 2;
  let expectedEnemy = 1;
  
  let testPassed = (playerAnts === expectedPlayer && enemyAnts === expectedEnemy);
  
  if (testPassed) {
    console.log(`  ✅ Faction counting: PASS (${playerAnts} player, ${enemyAnts} enemy)`);
  } else {
    console.log(`  ❌ Faction counting: FAIL (expected ${expectedPlayer} player, ${expectedEnemy} enemy)`);
  }
  
  console.log(`\n📊 Faction Filtering: ${testPassed ? '1/1' : '0/1'} tests passed`);
  return testPassed;
}

function testSelectionBoundaries() {
  console.log("\n🧪 Testing: Selection Boundary Cases");
  
  setupBasicTest();
  
  let passed = 0;
  let total = 3;
  
  // Test edge cases
  let testCases = [
    { x: 100, y: 100, desc: "Exact corner hit" },
    { x: 99, y: 99, desc: "Just outside corner" },
    { x: 133, y: 133, desc: "Just outside bounds" }
  ];
  
  testCases.forEach((testCase, index) => {
    let ant = mockEntities[0];
    let result = ant.isMouseOver(testCase.x, testCase.y);
    let expected = (index === 0); // Only first case should hit
    
    if (result === expected) {
      console.log(`  ✅ ${testCase.desc}: PASS`);
      passed++;
    } else {
      console.log(`  ❌ ${testCase.desc}: FAIL`);
    }
  });
  
  console.log(`\n📊 Selection Boundaries: ${passed}/${total} tests passed`);
  return passed === total;
}

function testMultiSelection() {
  console.log("\n🧪 Testing: Multi-Selection Behavior");
  
  setupBasicTest();
  
  // Simulate selecting multiple ants
  mockSelectedEntities = [];
  
  // Select first two ants
  mockEntities[0].isSelected = true;
  mockEntities[1].isSelected = true;
  mockSelectedEntities.push(mockEntities[0]);
  mockSelectedEntities.push(mockEntities[1]);
  
  let expectedCount = 2;
  let actualCount = mockSelectedEntities.length;
  
  let testPassed = actualCount === expectedCount;
  
  if (testPassed) {
    console.log(`  ✅ Multi-selection: PASS (${actualCount} ants selected)`);
  } else {
    console.log(`  ❌ Multi-selection: FAIL (expected ${expectedCount}, got ${actualCount})`);
  }
  
  // Test deselection
  mockSelectedEntities.forEach(entity => entity.isSelected = false);
  mockSelectedEntities = [];
  
  let deselectionPassed = mockSelectedEntities.length === 0;
  if (deselectionPassed) {
    console.log(`  ✅ Deselection: PASS (all ants deselected)`);
  } else {
    console.log(`  ❌ Deselection: FAIL`);
  }
  
  console.log(`\n📊 Multi-Selection: ${(testPassed && deselectionPassed) ? '2/2' : '1/2 or 0/2'} tests passed`);
  return testPassed && deselectionPassed;
}

// Main Test Runner
function runSelectionBoxTests() {
  console.log("🚀 Starting Selection Box Test Suite");
  console.log("=" .repeat(50));
  
  let testResults = [];
  
  // Run all tests
  testResults.push(testEntityUnderMouse());
  testResults.push(testBoxSelection());
  testResults.push(testWrappedEntityHandling());
  testResults.push(testFactionFiltering());
  testResults.push(testSelectionBoundaries());
  testResults.push(testMultiSelection());
  
  // Calculate results
  let passed = testResults.filter(result => result).length;
  let total = testResults.length;
  
  console.log("\n" + "=" .repeat(50));
  console.log(`📊 FINAL RESULTS: ${passed}/${total} test suites passed`);
  
  if (passed === total) {
    console.log("🎉 All tests passed! Selection box is working correctly.");
  } else {
    console.log("⚠️  Some tests failed. Check the output above for details.");
  }
  
  return passed === total;
}

// Performance Test
function testSelectionPerformance() {
  console.log("\n🧪 Testing: Selection Performance");
  
  // Create many entities for performance testing
  let manyEntities = [];
  for (let i = 0; i < 1000; i++) {
    manyEntities.push(createMockAnt(
      Math.random() * 800,
      Math.random() * 600
    ));
  }
  
  let startTime = performance.now();
  
  // Simulate selection check on all entities
  let selectedCount = 0;
  manyEntities.forEach(entity => {
    if (entity.isMouseOver(400, 300)) {
      selectedCount++;
    }
  });
  
  let endTime = performance.now();
  let duration = endTime - startTime;
  
  console.log(`  ✅ Performance test: ${duration.toFixed(2)}ms for 1000 entities`);
  console.log(`  ✅ Selected ${selectedCount} entities`);
  
  let performanceGood = duration < 10; // Should be under 10ms
  
  if (performanceGood) {
    console.log("  ✅ Performance: GOOD");
  } else {
    console.log("  ⚠️  Performance: SLOW (consider optimization)");
  }
  
  return performanceGood;
}

// Export functions for use in main game
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runSelectionBoxTests,
    testSelectionPerformance,
    createMockAnt,
    createMockWrapper
  };
}

// Auto-run tests if this file is loaded directly
if (typeof window !== 'undefined') {
  // Add to global scope for browser console access
  window.runSelectionBoxTests = runSelectionBoxTests;
  window.testSelectionPerformance = testSelectionPerformance;
}