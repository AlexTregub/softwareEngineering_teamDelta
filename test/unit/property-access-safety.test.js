// Property Access Safety Tests
// Tests for undefined property access and array operations
// Run with: node test/unit/property-access-safety.test.js

class PropertyAccessTestSuite {
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

  async run() {
    console.log('🧪 Running Property Access Safety Tests');
    console.log('='.repeat(50));

    for (const { name, testFunction } of this.tests) {
      try {
        console.log(`\n📋 ${name}`);
        await testFunction();
        console.log(`✅ PASSED`);
        this.passed++;
      } catch (error) {
        console.error(`❌ FAILED: ${error.message}`);
        this.failed++;
      }
    }

    console.log(`\n📊 Test Results: ${this.passed} passed, ${this.failed} failed`);
    
    if (this.failed > 0) {
      console.log('❌ Some property access tests failed!');
      process.exit(1);
    } else {
      console.log('🎉 All property access tests passed!');
      process.exit(0);
    }
  }
}

const suite = new PropertyAccessTestSuite();

// Test 1: Safe array initialization patterns
suite.test('Safe array initialization patterns', () => {
  // Common patterns that should be safe
  const safeArrays = [
    [],
    new Array(),
    Array.from([]),
    [1, 2, 3],
    ['a', 'b', 'c']
  ];
  
  safeArrays.forEach((arr, index) => {
    suite.assert(Array.isArray(arr), `Array ${index} should be valid array`);
    suite.assert(typeof arr.push === 'function', `Array ${index} should have push method`);
    
    // Test push operation
    const originalLength = arr.length;
    arr.push('test');
    suite.assert(arr.length === originalLength + 1, `Array ${index} push should work`);
  });
});

// Test 2: Unsafe property access patterns
suite.test('Detect unsafe property access patterns', () => {
  // These patterns commonly cause "Cannot read properties of undefined" errors
  const unsafeObjects = [
    undefined,
    null,
    false,
    0,
    ''
  ];
  
  unsafeObjects.forEach((obj, index) => {
    let errorCaught = false;
    
    try {
      // This should throw an error
      obj.push('test');
    } catch (error) {
      errorCaught = true;
      suite.assert(error.message.includes('Cannot read properties') || 
                   error.message.includes('Cannot read property') ||
                   error.message.includes('is not a function'),
        `Object ${index} should throw property access error`);
    }
    
    suite.assert(errorCaught, `Object ${index} (${obj}) should throw error when accessing push`);
  });
});

// Test 3: Safe object property checking patterns
suite.test('Safe object property checking patterns', () => {
  const testObject = {
    validArray: [],
    validString: 'test',
    validNumber: 42
  };
  
  // Safe access patterns
  suite.assert(testObject?.validArray?.push !== undefined, 'Optional chaining should work');
  suite.assert(testObject.hasOwnProperty('validArray'), 'hasOwnProperty should work');
  suite.assert('validArray' in testObject, 'in operator should work');
  suite.assert(testObject.validArray && typeof testObject.validArray.push === 'function', 
    'Type checking should work');
});

// Test 4: Mock object initialization safety
suite.test('Mock object initialization safety', () => {
  // Common mock patterns used in tests
  const mockAnt = {
    moveCommands: [],
    selections: [],
    stats: {
      position: { x: 0, y: 0 }
    }
  };
  
  // Verify mock is properly initialized
  suite.assert(Array.isArray(mockAnt.moveCommands), 'moveCommands should be array');
  suite.assert(Array.isArray(mockAnt.selections), 'selections should be array');
  suite.assert(typeof mockAnt.stats === 'object', 'stats should be object');
  
  // Test operations that commonly fail
  mockAnt.moveCommands.push({ x: 100, y: 100, type: 'test' });
  mockAnt.selections.push({ selected: true, timestamp: Date.now() });
  
  suite.assert(mockAnt.moveCommands.length === 1, 'moveCommands push should work');
  suite.assert(mockAnt.selections.length === 1, 'selections push should work');
});

// Test 5: Function parameter validation
suite.test('Function parameter validation', () => {
  function safeArrayOperation(arr) {
    // Safe validation pattern
    if (!Array.isArray(arr)) {
      throw new Error('Parameter must be an array');
    }
    return arr.push('safe');
  }
  
  function unsafeArrayOperation(arr) {
    // Unsafe pattern that commonly fails
    return arr.push('unsafe');
  }
  
  // Test safe function
  const testArray = [];
  suite.assert(safeArrayOperation(testArray) === 1, 'Safe function should work');
  
  // Test unsafe function with invalid input
  let errorCaught = false;
  try {
    safeArrayOperation(undefined);
  } catch (error) {
    errorCaught = true;
    suite.assert(error.message.includes('must be an array'), 'Should throw descriptive error');
  }
  suite.assert(errorCaught, 'Safe function should validate parameters');
  
  // Unsafe function should fail with undefined
  errorCaught = false;
  try {
    unsafeArrayOperation(undefined);
  } catch (error) {
    errorCaught = true;
  }
  suite.assert(errorCaught, 'Unsafe function should fail with undefined');
});

// Test 6: Defensive programming patterns
suite.test('Defensive programming patterns', () => {
  function defensiveObjectAccess(obj, property, defaultValue = []) {
    return obj && obj[property] ? obj[property] : defaultValue;
  }
  
  // Test with valid object
  const validObj = { myArray: [1, 2, 3] };
  const result1 = defensiveObjectAccess(validObj, 'myArray');
  suite.assert(Array.isArray(result1), 'Should return valid array');
  suite.assert(result1.length === 3, 'Should return correct array');
  
  // Test with undefined object
  const result2 = defensiveObjectAccess(undefined, 'myArray');
  suite.assert(Array.isArray(result2), 'Should return default array for undefined');
  suite.assert(result2.length === 0, 'Default should be empty array');
  
  // Test with object missing property
  const result3 = defensiveObjectAccess({}, 'myArray');
  suite.assert(Array.isArray(result3), 'Should return default array for missing property');
});

// Test 7: Test for common regression patterns
suite.test('Test for common regression patterns', () => {
  // Pattern 1: Uninitialized arrays in objects
  class TestClass {
    constructor() {
      // Common mistake: forgetting to initialize arrays
      // this.commands = []; // Correct
      // this.commands is undefined by default // Incorrect
    }
    
    addCommand(cmd) {
      // This pattern commonly fails if constructor doesn't initialize arrays
      if (!this.commands) {
        this.commands = [];
      }
      this.commands.push(cmd);
    }
  }
  
  const testInstance = new TestClass();
  testInstance.addCommand('test');
  suite.assert(Array.isArray(testInstance.commands), 'Commands should be initialized');
  suite.assert(testInstance.commands.length === 1, 'Command should be added');
  
  // Pattern 2: Checking for method existence before calling
  function safeMethodCall(obj, methodName, ...args) {
    if (obj && typeof obj[methodName] === 'function') {
      return obj[methodName](...args);
    }
    return undefined;
  }
  
  const objWithMethod = { test: () => 'success' };
  const objWithoutMethod = {};
  
  suite.assert(safeMethodCall(objWithMethod, 'test') === 'success', 'Should call existing method');
  suite.assert(safeMethodCall(objWithoutMethod, 'test') === undefined, 'Should handle missing method');
  suite.assert(safeMethodCall(undefined, 'test') === undefined, 'Should handle undefined object');
});

// Run the tests
suite.run();