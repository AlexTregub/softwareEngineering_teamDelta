// DEPRECATED: This test file checks legacy selectionBox.js logic. The codebase now uses SelectionBoxController and MouseInputController. Update or remove these tests as needed.
// Integration tests for selection box with real game entities
// This file tests the actual selection box functions with real ants

function testRealSelectionBoxIntegration() {
  console.log("🔗 Running Real Selection Box Integration Tests");
  console.log("=" .repeat(50));
  
  if (typeof ants === 'undefined' || !ants || ants.length === 0) {
    console.log("❌ No ants found in game. Make sure ants are spawned first.");
    return false;
  }
  
  let passed = 0;
  let total = 0;
  
  // Test 1: Check if selection box functions exist
  total++;
  if (typeof handleMousePressed === 'function' && 
      typeof handleMouseDragged === 'function' && 
      typeof handleMouseReleased === 'function') {
    console.log("✅ All selection box functions exist");
    passed++;
  } else {
    console.log("❌ Missing selection box functions");
  }
  
  // Test 2: Check if entities have required methods
  total++;
  let validEntities = 0;
  for (let i = 0; i < Math.min(5, ants.length); i++) {
    if (ants[i]) {
      let entity = ants[i].antObject ? ants[i].antObject : ants[i];
      if (typeof entity.isMouseOver === 'function') {
        validEntities++;
      }
    }
  }
  
  if (validEntities > 0) {
    console.log(`✅ Found ${validEntities} valid entities with isMouseOver method`);
    passed++;
  } else {
    console.log("❌ No entities have isMouseOver method");
  }
  
  // Test 3: Test actual mouse collision detection
  total++;
  if (ants.length > 0) {
    let testAnt = ants[0].antObject ? ants[0].antObject : ants[0];
    if (testAnt && typeof testAnt.isMouseOver === 'function') {
      // Test point inside ant bounds
      let testResult = testAnt.isMouseOver(testAnt.posX + 10, testAnt.posY + 10);
      if (testResult === true) {
        console.log("✅ Mouse collision detection working");
        passed++;
      } else {
        console.log("❌ Mouse collision detection failed");
      }
    } else {
      console.log("❌ Cannot test collision - ant object invalid");
    }
  }
  
  // Test 4: Check selection state properties
  total++;
  if (ants.length > 0) {
    let testAnt = ants[0].antObject ? ants[0].antObject : ants[0];
    if (testAnt && ('isSelected' in testAnt || '_isSelected' in testAnt)) {
      console.log("✅ Selection state properties exist");
      passed++;
    } else {
      console.log("❌ Selection state properties missing");
    }
  }
  
  // Test 5: Test global selection variables
  total++;
  if (typeof selectedEntities !== 'undefined' && 
      typeof isSelecting !== 'undefined') {
    console.log("✅ Global selection variables exist");
    passed++;
  } else {
    console.log("❌ Global selection variables missing");
  }
  
  console.log("\n" + "=" .repeat(50));
  console.log(`📊 Integration Tests: ${passed}/${total} passed`);
  
  if (passed === total) {
    console.log("🎉 Selection box integration is working correctly!");
    console.log("💡 You can now safely make changes to the selection system.");
    console.log("💡 Press 'T' to run mock tests, 'P' for performance tests");
  } else {
    console.log("⚠️  Some integration tests failed. Selection box may have issues.");
  }
  
  return passed === total;
}

// Test specific selection scenarios
function testSelectionScenarios() {
  console.log("\n🎯 Testing Selection Scenarios");
  
  if (!ants || ants.length === 0) {
    console.log("❌ No ants available for scenario testing");
    return false;
  }
  
  let scenarios = [
    {
      name: "Single ant selection",
      test: function() {
        // Test selecting a single ant
        let testAnt = ants[0].antObject ? ants[0].antObject : ants[0];
        if (testAnt && typeof testAnt.isMouseOver === 'function') {
          let result = testAnt.isMouseOver(testAnt.posX + 5, testAnt.posY + 5);
          return result;
        }
        return false;
      }
    },
    {
      name: "Out of bounds detection",
      test: function() {
        let testAnt = ants[0].antObject ? ants[0].antObject : ants[0];
        if (testAnt && typeof testAnt.isMouseOver === 'function') {
          let result = testAnt.isMouseOver(testAnt.posX - 100, testAnt.posY - 100);
          return !result; // Should be false for out of bounds
        }
        return false;
      }
    },
    {
      name: "Multiple ants different positions",
      test: function() {
        if (ants.length < 2) return true; // Pass if not enough ants
        
        let ant1 = ants[0].antObject ? ants[0].antObject : ants[0];
        let ant2 = ants[1].antObject ? ants[1].antObject : ants[1];
        
        if (ant1 && ant2 && typeof ant1.isMouseOver === 'function') {
          // Test that different positions give different results
          let pos1 = ant1.isMouseOver(ant1.posX + 5, ant1.posY + 5);
          let pos2 = ant1.isMouseOver(ant2.posX + 5, ant2.posY + 5);
          
          // Should get different results unless ants overlap
          return pos1 !== pos2 || (ant1.posX === ant2.posX && ant1.posY === ant2.posY);
        }
        return false;
      }
    }
  ];
  
  let passed = 0;
  scenarios.forEach((scenario, index) => {
    try {
      let result = scenario.test();
      if (result) {
        console.log(`  ✅ ${scenario.name}: PASS`);
        passed++;
      } else {
        console.log(`  ❌ ${scenario.name}: FAIL`);
      }
    } catch (error) {
      console.log(`  ❌ ${scenario.name}: ERROR - ${error.message}`);
    }
  });
  
  console.log(`\n📊 Scenarios: ${passed}/${scenarios.length} passed`);
  return passed === scenarios.length;
}

// Add to global scope
if (typeof window !== 'undefined') {
  window.testRealSelectionBoxIntegration = testRealSelectionBoxIntegration;
  window.testSelectionScenarios = testSelectionScenarios;
}

// Register with global test runner
if (typeof globalThis !== 'undefined' && typeof globalThis.registerTest === 'function') {
  globalThis.registerTest('Selection Box Integration Tests', testRealSelectionBoxIntegration);
}

// Auto-run integration test only if enabled and dev console is enabled
setTimeout(() => {
  if (typeof globalThis.shouldRunTests === 'function') {
    if (globalThis.shouldRunTests() && typeof devConsoleEnabled !== 'undefined' && devConsoleEnabled && 
        ants && ants.length > 0) {
      globalThis.logNormal("🎮 Game loaded - running automatic selection box integration test");
      testRealSelectionBoxIntegration();
    } else if (!globalThis.shouldRunTests()) {
      globalThis.logNormal("🎮 Selection Box Integration tests available but disabled. Use enableTests() to enable or runTests() to run manually.");
    }
  } else {
    // Legacy behavior when global test runner is not available
    if (typeof devConsoleEnabled !== 'undefined' && devConsoleEnabled && 
        ants && ants.length > 0) {
      globalThis.logNormal("🎮 Game loaded - running automatic selection box integration test");
      testRealSelectionBoxIntegration();
    }
  }
}, 2000); // Wait 2 seconds for game to initialize