/**
 * Comprehensive Test Utilities and Helper Functions
 * Provides missing utility functions for test suites
 * Implements common test patterns and assertions
 */

/**
 * Enhanced Assertion Library
 */
class TestAssertions {
  static assertEqual(actual, expected, message = '') {
    if (actual === expected) {
      return { status: 'PASS', message: message || `${actual} === ${expected}` };
    } else {
      return { 
        status: 'FAIL', 
        message: message || `Expected: ${expected}, Got: ${actual}`,
        error: `Assertion failed: ${actual} !== ${expected}`
      };
    }
  }
  
  static assertNotEqual(actual, expected, message = '') {
    if (actual !== expected) {
      return { status: 'PASS', message: message || `${actual} !== ${expected}` };
    } else {
      return { 
        status: 'FAIL', 
        message: message || `Expected ${actual} to not equal ${expected}`,
        error: `Assertion failed: ${actual} === ${expected}`
      };
    }
  }
  
  static assertTrue(value, message = '') {
    if (value === true) {
      return { status: 'PASS', message: message || `${value} is true` };
    } else {
      return { 
        status: 'FAIL', 
        message: message || `Expected true, got ${value}`,
        error: `Assertion failed: ${value} is not true`
      };
    }
  }
  
  static assertFalse(value, message = '') {
    if (value === false) {
      return { status: 'PASS', message: message || `${value} is false` };
    } else {
      return { 
        status: 'FAIL', 
        message: message || `Expected false, got ${value}`,
        error: `Assertion failed: ${value} is not false`
      };
    }
  }
  
  static assertGreaterThan(actual, expected, message = '') {
    if (actual > expected) {
      return { status: 'PASS', message: message || `${actual} > ${expected}` };
    } else {
      return { 
        status: 'FAIL', 
        message: message || `Expected ${actual} > ${expected}`,
        error: `Assertion failed: ${actual} is not greater than ${expected}`
      };
    }
  }
  
  static assertLessThan(actual, expected, message = '') {
    if (actual < expected) {
      return { status: 'PASS', message: message || `${actual} < ${expected}` };
    } else {
      return { 
        status: 'FAIL', 
        message: message || `Expected ${actual} < ${expected}`,
        error: `Assertion failed: ${actual} is not less than ${expected}`
      };
    }
  }
  
  static assertExists(value, message = '') {
    if (value !== null && value !== undefined) {
      return { status: 'PASS', message: message || `Value exists: ${value}` };
    } else {
      return { 
        status: 'FAIL', 
        message: message || `Expected non-null value`,
        error: `Assertion failed: value is ${value}`
      };
    }
  }
  
  static assertType(value, expectedType, message = '') {
    const actualType = typeof value;
    if (actualType === expectedType) {
      return { status: 'PASS', message: message || `${value} is type ${expectedType}` };
    } else {
      return { 
        status: 'FAIL', 
        message: message || `Expected type ${expectedType}, got ${actualType}`,
        error: `Type assertion failed: ${actualType} !== ${expectedType}`
      };
    }
  }
  
  static assertContains(array, item, message = '') {
    if (Array.isArray(array) && array.includes(item)) {
      return { status: 'PASS', message: message || `Array contains ${item}` };
    } else {
      return { 
        status: 'FAIL', 
        message: message || `Expected array to contain ${item}`,
        error: `Contains assertion failed: ${item} not found in array`
      };
    }
  }
  
  static assertThrows(fn, message = '') {
    try {
      fn();
      return { 
        status: 'FAIL', 
        message: message || `Expected function to throw an error`,
        error: `Function did not throw as expected`
      };
    } catch (error) {
      return { status: 'PASS', message: message || `Function threw: ${error.message}` };
    }
  }
}

/**
 * Mock Implementation Helpers
 */
class MockHelpers {
  static createMockAnt(job = 'Scout', faction = 'neutral') {
    return {
      id: Math.random().toString(36).substr(2, 9),
      job: job,
      faction: faction,
      x: Math.random() * 800,
      y: Math.random() * 600,
      state: 'IDLE',
      selected: false,
      health: 100,
      energy: 100,
      jobComponent: null,
      
      // Mock methods
      setState: function(newState) { this.state = newState; },
      setSelected: function(selected) { this.selected = selected; },
      update: function() {},
      render: function() {}
    };
  }
  
  static createMockJobComponent(job = 'Scout') {
    return {
      job: job,
      level: 1,
      experience: 0,
      stats: { speed: 30, strength: 10, intelligence: 15 },
      
      addExperience: function(amount) { 
        this.experience += amount;
        // Simple level calculation
        this.level = Math.floor(this.experience / 100) + 1;
      },
      getLevel: function() { return this.level; },
      getExperience: function() { return this.experience; }
    };
  }
  
  static createMockResourceManager() {
    return {
      resources: [],
      
      addResource: function(type, amount) {
        this.resources.push({ type, amount, x: 0, y: 0 });
      },
      
      getResourceCount: function(type) {
        return this.resources.filter(r => r.type === type).length;
      },
      
      clear: function() {
        this.resources = [];
      }
    };
  }
  
  static createMockCanvas() {
    return {
      width: 800,
      height: 600,
      getContext: function() {
        return {
          fillRect: () => {},
          strokeRect: () => {},
          clearRect: () => {},
          fillText: () => {},
          drawImage: () => {},
          save: () => {},
          restore: () => {},
          translate: () => {},
          scale: () => {},
          rotate: () => {}
        };
      }
    };
  }
}

/**
 * Performance Testing Utilities
 */
class PerformanceHelpers {
  static measureExecutionTime(fn, iterations = 1000) {
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      fn();
    }
    
    const end = performance.now();
    const totalTime = end - start;
    const avgTime = totalTime / iterations;
    
    return {
      totalTime: totalTime,
      averageTime: avgTime,
      iterations: iterations,
      opsPerSecond: 1000 / avgTime
    };
  }
  
  static memoryUsage() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage();
    } else {
      // Browser environment approximation
      return {
        rss: 0,
        heapTotal: performance.memory?.totalJSHeapSize || 0,
        heapUsed: performance.memory?.usedJSHeapSize || 0,
        external: 0,
        arrayBuffers: 0
      };
    }
  }
  
  static createLoadTest(fn, duration = 5000) {
    const startTime = Date.now();
    let operations = 0;
    const errors = [];
    
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        try {
          fn();
          operations++;
        } catch (error) {
          errors.push(error);
        }
        
        if (Date.now() - startTime >= duration) {
          clearInterval(interval);
          resolve({
            operations: operations,
            duration: duration,
            opsPerSecond: (operations / duration) * 1000,
            errors: errors,
            errorRate: errors.length / operations
          });
        }
      }, 1);
    });
  }
}

/**
 * Test Environment Setup
 */
class TestEnvironment {
  static setupGlobals() {
    // Make assertions available globally
    global.assertEqual = TestAssertions.assertEqual;
    global.assertNotEqual = TestAssertions.assertNotEqual;
    global.assertTrue = TestAssertions.assertTrue;
    global.assertFalse = TestAssertions.assertFalse;
    global.assertGreaterThan = TestAssertions.assertGreaterThan;
    global.assertLessThan = TestAssertions.assertLessThan;
    global.assertExists = TestAssertions.assertExists;
    global.assertType = TestAssertions.assertType;
    global.assertContains = TestAssertions.assertContains;
    global.assertThrows = TestAssertions.assertThrows;
    
    // Make mock helpers available globally
    global.createMockAnt = MockHelpers.createMockAnt;
    global.createMockJobComponent = MockHelpers.createMockJobComponent;
    global.createMockResourceManager = MockHelpers.createMockResourceManager;
    global.createMockCanvas = MockHelpers.createMockCanvas;
    
    // Performance helpers
    global.measureExecutionTime = PerformanceHelpers.measureExecutionTime;
    global.memoryUsage = PerformanceHelpers.memoryUsage;
    global.createLoadTest = PerformanceHelpers.createLoadTest;
    
    console.log('✅ Test utilities and globals initialized');
  }
  
  static setupAntUtilities() {
    // Mock AntUtilities functions that tests expect
    global.AntUtilities = {
      assertEqual: TestAssertions.assertEqual,
      assertLessThan: TestAssertions.assertLessThan,
      assertGreaterThan: TestAssertions.assertGreaterThan,
      
      spawnMultipleAnts: function(count, job = 'Scout', faction = 'neutral') {
        const ants = [];
        for (let i = 0; i < count; i++) {
          ants.push(MockHelpers.createMockAnt(job, faction));
        }
        return ants;
      },
      
      // Mock game state functions
      getSelectedAnts: function() {
        return global.mockAnts?.filter(ant => ant.selected) || [];
      },
      
      setSelectedAnts: function(ants) {
        if (global.mockAnts) {
          global.mockAnts.forEach(ant => ant.selected = false);
          ants.forEach(ant => ant.selected = true);
        }
      }
    };
    
    console.log('✅ AntUtilities mock initialized');
  }
  
  static setupGameplayIntegrationTestSuite() {
    // Mock the missing GameplayIntegrationTestSuite functions
    global.GameplayIntegrationTestSuite = {
      assertLessThan: TestAssertions.assertLessThan,
      assertGreaterThan: TestAssertions.assertGreaterThan,
      assertEqual: TestAssertions.assertEqual,
      assertTrue: TestAssertions.assertTrue,
      assertExists: TestAssertions.assertExists
    };
    
    console.log('✅ GameplayIntegrationTestSuite mock initialized');
  }
}

/**
 * Test Data Generators
 */
class TestDataGenerators {
  static generateAntColony(size = 10) {
    const jobs = ['Scout', 'Builder', 'Farmer', 'Warrior'];
    const factions = ['red', 'blue', 'green', 'neutral'];
    const colony = [];
    
    for (let i = 0; i < size; i++) {
      const ant = MockHelpers.createMockAnt(
        jobs[Math.floor(Math.random() * jobs.length)],
        factions[Math.floor(Math.random() * factions.length)]
      );
      colony.push(ant);
    }
    
    return colony;
  }
  
  static generateResourceField(types = ['food', 'wood', 'stone'], count = 20) {
    const resources = [];
    
    for (let i = 0; i < count; i++) {
      resources.push({
        type: types[Math.floor(Math.random() * types.length)],
        amount: Math.floor(Math.random() * 100) + 10,
        x: Math.random() * 800,
        y: Math.random() * 600,
        id: `resource_${i}`
      });
    }
    
    return resources;
  }
  
  static generateTestScenarios() {
    return {
      earlyGame: {
        ants: TestDataGenerators.generateAntColony(5),
        resources: TestDataGenerators.generateResourceField(['food'], 10)
      },
      midGame: {
        ants: TestDataGenerators.generateAntColony(15),
        resources: TestDataGenerators.generateResourceField(['food', 'wood'], 25)
      },
      lateGame: {
        ants: TestDataGenerators.generateAntColony(30),
        resources: TestDataGenerators.generateResourceField(['food', 'wood', 'stone'], 50)
      }
    };
  }
}

// Initialize test environment when loaded
TestEnvironment.setupGlobals();
TestEnvironment.setupAntUtilities();
TestEnvironment.setupGameplayIntegrationTestSuite();

// Export all utilities
module.exports = {
  TestAssertions,
  MockHelpers,
  PerformanceHelpers,
  TestEnvironment,
  TestDataGenerators
};