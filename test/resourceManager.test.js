/**
 * @fileoverview Test suite for ResourceManager class
 * Tests resource collection, capacity management, and drop-off behavior.
 * 
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 */

// Simple test framework
const testSuite = {
  tests: [],
  passed: 0,
  failed: 0,
  
  test(name, fn) {
    this.tests.push({ name, fn });
  },
  
  assertTrue(condition, message = '') {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  },
  
  assertEqual(actual, expected, message = '') {
    if (actual !== expected) {
      throw new Error(`Assertion failed: Expected "${expected}", got "${actual}". ${message}`);
    }
  },
  
  assertArrayEqual(actual, expected, message = '') {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`Assertion failed: Expected "${JSON.stringify(expected)}", got "${JSON.stringify(actual)}". ${message}`);
    }
  },
  
  run() {
    console.log('🧪 Running ResourceManager Test Suite...\n');
    
    for (const test of this.tests) {
      try {
        test.fn();
        console.log(`✅ ${test.name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${test.name}`);
        console.log(`   Error: ${error.message}`);
        this.failed++;
      }
    }
    
    console.log(`\n📊 Test Results: ${this.passed} passed, ${this.failed} failed, ${this.tests.length} total`);
    
    if (this.failed > 0) {
      process.exit(1);
    }
  }
};

// Import ResourceManager for testing
const ResourceManager = require("../Classes/systems/ResourceManager.js");

/**
 * Mock entity class for testing ResourceManager
 */
class MockEntity {
  constructor() {
    this.posX = 100;
    this.posY = 100;
    this.moveToLocationCalled = false;
    this.moveToLocationArgs = null;
  }
  
  moveToLocation(x, y) {
    this.moveToLocationCalled = true;
    this.moveToLocationArgs = { x, y };
  }
}

// Test: Constructor with default values
testSuite.test("Constructor should initialize with correct default values", () => {
  const mockEntity = new MockEntity();
  const rm = new ResourceManager(mockEntity);
  
  testSuite.assertEqual(rm.maxCapacity, 2);
  testSuite.assertEqual(rm.collectionRange, 25);
  testSuite.assertEqual(rm.resources.length, 0);
  testSuite.assertEqual(rm.isDroppingOff, false);
  testSuite.assertEqual(rm.isAtMaxCapacity, false);
});

// Test: Constructor with custom values
testSuite.test("Constructor should initialize with custom values", () => {
  const mockEntity = new MockEntity();
  const rm = new ResourceManager(mockEntity, 5, 50);
  
  testSuite.assertEqual(rm.maxCapacity, 5);
  testSuite.assertEqual(rm.collectionRange, 50);
});

// Test: getCurrentLoad
testSuite.test("getCurrentLoad should return correct resource count", () => {
  const mockEntity = new MockEntity();
  const rm = new ResourceManager(mockEntity, 2, 25);
  
  testSuite.assertEqual(rm.getCurrentLoad(), 0);
  
  rm.addResource({ type: "leaf" });
  testSuite.assertEqual(rm.getCurrentLoad(), 1);
  
  rm.addResource({ type: "stick" });
  testSuite.assertEqual(rm.getCurrentLoad(), 2);
});

// Test: isAtMaxLoad
testSuite.test("isAtMaxLoad should return correct capacity status", () => {
  const mockEntity = new MockEntity();
  const rm = new ResourceManager(mockEntity, 2, 25);
  
  testSuite.assertEqual(rm.isAtMaxLoad(), false);
  
  rm.addResource({ type: "leaf" });
  testSuite.assertEqual(rm.isAtMaxLoad(), false);
  
  rm.addResource({ type: "stick" });
  testSuite.assertEqual(rm.isAtMaxLoad(), true);
});

// Test: getRemainingCapacity
testSuite.test("getRemainingCapacity should return correct remaining space", () => {
  const mockEntity = new MockEntity();
  const rm = new ResourceManager(mockEntity, 2, 25);
  
  testSuite.assertEqual(rm.getRemainingCapacity(), 2);
  
  rm.addResource({ type: "leaf" });
  testSuite.assertEqual(rm.getRemainingCapacity(), 1);
  
  rm.addResource({ type: "stick" });
  testSuite.assertEqual(rm.getRemainingCapacity(), 0);
});

// Test: addResource success
testSuite.test("addResource should add resource when capacity available", () => {
  const mockEntity = new MockEntity();
  const rm = new ResourceManager(mockEntity, 2, 25);
  const resource = { type: "leaf", value: 10 };
  
  const result = rm.addResource(resource);
  
  testSuite.assertEqual(result, true);
  testSuite.assertEqual(rm.getCurrentLoad(), 1);
  testSuite.assertTrue(rm.resources.includes(resource));
});

// Test: addResource failure at capacity
testSuite.test("addResource should reject resource when at max capacity", () => {
  const mockEntity = new MockEntity();
  const rm = new ResourceManager(mockEntity, 2, 25);
  
  // Fill to capacity
  rm.addResource({ type: "leaf" });
  rm.addResource({ type: "stick" });
  
  const result = rm.addResource({ type: "berry" });
  
  testSuite.assertEqual(result, false);
  testSuite.assertEqual(rm.getCurrentLoad(), 2);
});

// Test: dropAllResources
testSuite.test("dropAllResources should remove all resources and return them", () => {
  const mockEntity = new MockEntity();
  const rm = new ResourceManager(mockEntity, 2, 25);
  
  const leaf = { type: "leaf", value: 5 };
  const stick = { type: "stick", value: 3 };
  rm.addResource(leaf);
  rm.addResource(stick);
  
  const droppedResources = rm.dropAllResources();
  
  testSuite.assertEqual(droppedResources.length, 2);
  testSuite.assertEqual(droppedResources[0].type, "leaf");
  testSuite.assertEqual(droppedResources[1].type, "stick");
  testSuite.assertEqual(rm.getCurrentLoad(), 0);
  testSuite.assertEqual(rm.isDroppingOff, false);
  testSuite.assertEqual(rm.isAtMaxCapacity, false);
});

// Test: startDropOff
testSuite.test("startDropOff should set drop-off state and move entity", () => {
  const mockEntity = new MockEntity();
  const rm = new ResourceManager(mockEntity, 2, 25);
  
  rm.startDropOff(50, 60);
  
  testSuite.assertEqual(rm.isDroppingOff, true);
  testSuite.assertEqual(rm.isAtMaxCapacity, true);
  testSuite.assertTrue(mockEntity.moveToLocationCalled);
  testSuite.assertEqual(mockEntity.moveToLocationArgs.x, 50);
  testSuite.assertEqual(mockEntity.moveToLocationArgs.y, 60);
});

// Test: processDropOff when dropping off
testSuite.test("processDropOff should add resources to global array when dropping off", () => {
  const mockEntity = new MockEntity();
  const rm = new ResourceManager(mockEntity, 2, 25);
  const globalResourceArray = [];
  
  rm.addResource({ type: "leaf", value: 5 });
  rm.addResource({ type: "stick", value: 3 });
  rm.isDroppingOff = true;
  
  const dropped = rm.processDropOff(globalResourceArray);
  
  testSuite.assertEqual(dropped.length, 2);
  testSuite.assertEqual(globalResourceArray.length, 2);
  testSuite.assertEqual(globalResourceArray[0].type, "leaf");
  testSuite.assertEqual(globalResourceArray[1].type, "stick");
  testSuite.assertEqual(rm.getCurrentLoad(), 0);
});

// Test: processDropOff when not dropping off
testSuite.test("processDropOff should do nothing when not dropping off", () => {
  const mockEntity = new MockEntity();
  const rm = new ResourceManager(mockEntity, 2, 25);
  const globalResourceArray = [];
  
  rm.addResource({ type: "leaf", value: 5 });
  rm.addResource({ type: "stick", value: 3 });
  rm.isDroppingOff = false;
  
  const dropped = rm.processDropOff(globalResourceArray);
  
  testSuite.assertEqual(dropped.length, 0);
  testSuite.assertEqual(globalResourceArray.length, 0);
  testSuite.assertEqual(rm.getCurrentLoad(), 2);
});

// Test: getDebugInfo
testSuite.test("getDebugInfo should return comprehensive state information", () => {
  const mockEntity = new MockEntity();
  const rm = new ResourceManager(mockEntity, 2, 25);
  
  rm.addResource({ type: "leaf" });
  rm.isDroppingOff = true;
  
  const debugInfo = rm.getDebugInfo();
  
  testSuite.assertEqual(debugInfo.currentLoad, 1);
  testSuite.assertEqual(debugInfo.maxCapacity, 2);
  testSuite.assertEqual(debugInfo.remainingCapacity, 1);
  testSuite.assertEqual(debugInfo.isDroppingOff, true);
  testSuite.assertEqual(debugInfo.isAtMaxCapacity, false);
  testSuite.assertEqual(debugInfo.collectionRange, 25);
});

// Test: forceDropAll
testSuite.test("forceDropAll should immediately drop all resources", () => {
  const mockEntity = new MockEntity();
  const rm = new ResourceManager(mockEntity, 2, 25);
  
  rm.addResource({ type: "leaf" });
  rm.addResource({ type: "stick" });
  
  // Mock console.log to capture output
  const originalLog = console.log;
  let logMessage = '';
  console.log = (msg) => { logMessage = msg; };
  
  const dropped = rm.forceDropAll();
  
  // Restore console.log
  console.log = originalLog;
  
  testSuite.assertEqual(dropped.length, 2);
  testSuite.assertEqual(rm.getCurrentLoad(), 0);
  testSuite.assertTrue(logMessage.includes("Force dropped 2 resources"));
});

// Test: Edge case - entity without moveToLocation
testSuite.test("should handle entity without moveToLocation method gracefully", () => {
  const entityWithoutMove = { posX: 100, posY: 100 };
  const rm = new ResourceManager(entityWithoutMove);
  
  // Should not throw an error
  try {
    rm.startDropOff(50, 60);
    testSuite.assertTrue(true); // Test passes if no error thrown
  } catch (error) {
    testSuite.assertTrue(false, `Unexpected error: ${error.message}`);
  }
});

// Test: Edge case - null global resource array
testSuite.test("should handle null global resource array in processDropOff", () => {
  const mockEntity = new MockEntity();
  const rm = new ResourceManager(mockEntity, 2, 25);
  
  rm.addResource({ type: "leaf" });
  rm.isDroppingOff = true;
  
  const result = rm.processDropOff(null);
  
  testSuite.assertEqual(result.length, 0);
});

// Run all tests
testSuite.run();

// Export for module compatibility
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    ResourceManager,
    MockEntity
  };
}
