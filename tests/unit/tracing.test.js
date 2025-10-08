// Test suite for tracing.js functions
// Tests stack tracing, function name extraction, and error reporting utilities

// Mock console.error to capture error messages for testing
let mockConsoleError = [];
const originalConsoleError = console.error;

function mockConsoleErrorCapture() {
  mockConsoleError = [];
  console.error = (...args) => {
    mockConsoleError.push(args.join(' '));
  };
}

function restoreConsoleError() {
  console.error = originalConsoleError;
}

// Simple test framework
const suite = {
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
  
  assertFalse(condition, message = '') {
    if (condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  },
  
  assertEqual(actual, expected, message = '') {
    if (actual !== expected) {
      throw new Error(`Assertion failed: Expected "${expected}", got "${actual}". ${message}`);
    }
  },
  
  assertContains(haystack, needle, message = '') {
    if (!haystack.includes(needle)) {
      throw new Error(`Assertion failed: "${haystack}" should contain "${needle}". ${message}`);
    }
  },
  
  run() {
    console.log('🔍 Running Tracing Test Suite...\n');
    
    for (const test of this.tests) {
      try {
        test.fn();
        console.log(`✅ ${test.name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
        this.failed++;
      }
    }
    
    console.log(`\n📊 Test Results: ${this.passed} passed, ${this.failed} failed`);
    if (this.failed === 0) {
      console.log('🎉 All tests passed!');
    } else {
      console.log('❌ Some tests failed!');
    }
    
    return this.failed === 0;
  }
};

// Import tracing functions (we'll need to fix the exports first)
let tracingModule;
try {
  tracingModule = require('../debug/tracing.js');
} catch (error) {
  console.error('Could not load tracing module:', error.message);
  process.exit(1);
}

// Test 1: Stack Trace Generation
suite.test('getCurrentCallStack returns valid stack trace', () => {
  function testFunction() {
    return tracingModule.getCurrentCallStack();
  }
  
  const stack = testFunction();
  suite.assertTrue(typeof stack === 'string', 'Stack should be a string');
  suite.assertContains(stack, 'testFunction', 'Stack should contain test function name');
  suite.assertTrue(stack.length > 0, 'Stack should not be empty');
  suite.assertTrue(stack.split('\n').length >= 3, 'Stack should have multiple lines');
});

// Test 2: Function Level Extraction
suite.test('getFunction returns correct stack level', () => {
  function levelTwo() {
    return tracingModule.getFunction(2); // Should get levelOne
  }
  
  function levelOne() {
    return levelTwo();
  }
  
  const result = levelOne();
  suite.assertTrue(typeof result === 'string', 'Should return a string');
  suite.assertTrue(result.length > 0, 'Should not be empty');
});

// Test 3: Function Name Extraction
suite.test('getFunctionName extracts names correctly', () => {
  function namedTestFunction() {
    return tracingModule.getFunctionName(2); // Should get the caller of this function
  }
  
  function callerFunction() {
    return namedTestFunction();
  }
  
  const result = callerFunction();
  suite.assertTrue(typeof result === 'string', 'Should return a string');
  suite.assertTrue(result !== 'error', 'Should not return error');
});

// Test 4: Error Handling in getFunctionName
suite.test('getFunctionName handles invalid stack levels', () => {
  const result = tracingModule.getFunctionName(999); // Way beyond stack depth
  suite.assertTrue(result === 'error' || result === 'unknown', 'Should handle invalid levels gracefully');
});

// Test 5: Type Detection Function
suite.test('getType correctly identifies variable types', () => {
  suite.assertEqual(tracingModule.getType(42), 'Number', 'Should identify numbers');
  suite.assertEqual(tracingModule.getType('hello'), 'String', 'Should identify strings');
  suite.assertEqual(tracingModule.getType([1, 2, 3]), 'Array', 'Should identify arrays');
  suite.assertEqual(tracingModule.getType({}), 'Object', 'Should identify objects');
  suite.assertEqual(tracingModule.getType(null), 'Null', 'Should identify null');
  suite.assertEqual(tracingModule.getType(undefined), 'Undefined', 'Should identify undefined');
  suite.assertEqual(tracingModule.getType(true), 'Boolean', 'Should identify booleans');
  suite.assertEqual(tracingModule.getType(() => {}), 'Function', 'Should identify functions');
});

// Test 6: Parameter Error Reporting
suite.test('IncorrectParamPassed generates proper error messages', () => {
  mockConsoleErrorCapture();
  
  function badFunction() {
    tracingModule.IncorrectParamPassed("String", 123);
  }
  
  function callingFunction() {
    badFunction();
  }
  
  callingFunction();
  
  suite.assertTrue(mockConsoleError.length > 0, 'Should generate error message');
  const errorMsg = mockConsoleError[0];
  suite.assertContains(errorMsg, 'Incorrect Param passed', 'Should contain error description');
  suite.assertContains(errorMsg, 'String', 'Should contain expected type');
  suite.assertContains(errorMsg, 'Number', 'Should contain actual type');
  
  restoreConsoleError();
});

// Test 7: Regex Pattern Testing
suite.test('functionNameRegX pattern works correctly', () => {
  const testStrings = [
    'functionName@file.js:10:5',
    '  spacedFunction  @file.js:20:10',
    'simpleFunction',
    'Object.method@file.js:30:15'
  ];
  
  const regex = tracingModule.functionNameRegX; // Use the actual regex from tracing.js
  
  const result1 = testStrings[0].match(regex);
  suite.assertEqual(result1[1], 'functionName', 'Should extract simple function name');
  
  const result2 = testStrings[1].match(regex);
  suite.assertEqual(result2[1], '  spacedFunction  ', 'Should preserve spacing');
  
  const result3 = testStrings[2].match(regex);
  suite.assertEqual(result3[1], 'simpleFunction', 'Should handle strings without @');
  
  const result4 = testStrings[3].match(regex);
  suite.assertEqual(result4[1], 'Object.method', 'Should handle object methods');
});

// Test 8: Stack Depth Consistency
suite.test('Stack depth calculations are consistent', () => {
  function depth3() {
    return {
      current: tracingModule.getFunctionName(1),
      caller: tracingModule.getFunctionName(2),
      callersCaller: tracingModule.getFunctionName(3)
    };
  }
  
  function depth2() {
    return depth3();
  }
  
  function depth1() {
    return depth2();
  }
  
  const result = depth1();
  
  // These should all be strings and not errors
  suite.assertTrue(typeof result.current === 'string', 'Current function should be string');
  suite.assertTrue(typeof result.caller === 'string', 'Caller should be string');
  suite.assertTrue(typeof result.callersCaller === 'string', 'Caller\'s caller should be string');
  
  // None should be 'error'
  suite.assertTrue(result.current !== 'error', 'Current function should not error');
  suite.assertTrue(result.caller !== 'error', 'Caller should not error');
  suite.assertTrue(result.callersCaller !== 'error', 'Caller\'s caller should not error');
});

// Test 9: Edge Cases
suite.test('Functions handle edge cases gracefully', () => {
  // Test with empty/null inputs where applicable
  suite.assertEqual(tracingModule.getType(null), 'Null', 'Should handle null');
  suite.assertEqual(tracingModule.getType(undefined), 'Undefined', 'Should handle undefined');
  
  // Test stack level 0 (should be "Error")
  const level0 = tracingModule.getFunction(0);
  suite.assertContains(level0, 'Error', 'Level 0 should contain Error');
  
  // Test negative stack level (should handle gracefully)
  const negativeLevel = tracingModule.getFunctionName(-1);
  suite.assertTrue(negativeLevel === 'error' || negativeLevel === 'unknown', 'Should handle negative levels');
});

// Test 10: Integration Test
suite.test('Full error reporting workflow', () => {
  mockConsoleErrorCapture();
  
  function correctFunction(expectedString) {
    // This simulates a function that expects a string but gets something else
    if (typeof expectedString !== 'string') {
      tracingModule.IncorrectParamPassed("String", expectedString);
    }
    return expectedString;
  }
  
  function userFunction() {
    // User accidentally passes a number instead of string
    return correctFunction(42);
  }
  
  userFunction();
  
  suite.assertTrue(mockConsoleError.length > 0, 'Should capture error');
  const errorMsg = mockConsoleError[0];
  suite.assertContains(errorMsg, 'correctFunction', 'Should identify the function with the issue');
  suite.assertContains(errorMsg, 'Incorrect Param passed', 'Should contain error description');
  suite.assertContains(errorMsg, 'String', 'Should contain expected type');
  suite.assertContains(errorMsg, 'Number', 'Should contain actual type');
  
  restoreConsoleError();
});

// Test 11: deprecatedWarning with valid function
suite.test('deprecatedWarning executes replacement function correctly', () => {
  // Mock console.warn to capture warnings
  let mockConsoleWarn = [];
  let mockConsoleLog = [];
  const originalWarn = console.warn;
  const originalLog = console.log;
  
  console.warn = (...args) => mockConsoleWarn.push(args.join(' '));
  console.log = (...args) => mockConsoleLog.push(args.join(' '));
  
  // Test replacement function
  function newAdd(a, b) {
    return a + b;
  }
  
  function oldAdd(a, b) {
    return tracingModule.deprecatedWarning(newAdd, a, b);
  }
  
  const result = oldAdd(5, 3);
  
  // Verify function executed correctly
  suite.assertEqual(result, 8, 'Should execute replacement function and return result');
  
  // Verify warning was logged
  suite.assertTrue(mockConsoleWarn.length > 0, 'Should generate deprecation warning');
  suite.assertContains(mockConsoleWarn[0], 'deprecated', 'Warning should mention deprecation');
  suite.assertContains(mockConsoleWarn[0], 'newAdd', 'Warning should mention replacement function');
  
  // Verify paramInfo was called (should generate debug output)
  suite.assertTrue(mockConsoleLog.length > 0, 'Should generate parameter debug info');
  
  // Restore console functions
  console.warn = originalWarn;
  console.log = originalLog;
});

// Test 12: deprecatedWarning with invalid parameter
suite.test('deprecatedWarning handles invalid replacement parameter', () => {
  mockConsoleErrorCapture();
  
  function badDeprecatedFunction() {
    return tracingModule.deprecatedWarning("not a function");
  }
  
  const result = badDeprecatedFunction();
  
  // Should return undefined for invalid input
  suite.assertEqual(result, undefined, 'Should return undefined for invalid replacement');
  
  // Should generate parameter error
  suite.assertTrue(mockConsoleError.length > 0, 'Should generate parameter error');
  suite.assertContains(mockConsoleError[0], 'Incorrect Param passed', 'Should contain error message');
  
  restoreConsoleError();
});

// Test 13: deprecatedWarning with no additional arguments
suite.test('deprecatedWarning works with no additional arguments', () => {
  let mockConsoleWarn = [];
  const originalWarn = console.warn;
  const originalLog = console.log;
  
  console.warn = (...args) => mockConsoleWarn.push(args.join(' '));
  console.log = () => {}; // Suppress paramInfo output for this test
  
  function noArgsFunction() {
    return "no arguments needed";
  }
  
  function oldNoArgs() {
    return tracingModule.deprecatedWarning(noArgsFunction);
  }
  
  const result = oldNoArgs();
  
  suite.assertEqual(result, "no arguments needed", 'Should work with functions that take no arguments');
  suite.assertTrue(mockConsoleWarn.length > 0, 'Should still generate warning');
  
  console.warn = originalWarn;
  console.log = originalLog;
});

// Test 14: paramInfo with function parameter
suite.test('paramInfo provides detailed function analysis', () => {
  let mockConsoleLog = [];
  const originalLog = console.log;
  console.log = (...args) => mockConsoleLog.push(args.join(' '));
  
  function testFunction(x, y, z) {
    return x + y + z;
  }
  
  tracingModule.paramInfo(testFunction);
  
  // Verify comprehensive output
  const output = mockConsoleLog.join('\n');
  suite.assertContains(output, '=== Parameter Debug Info ===', 'Should have header');
  suite.assertContains(output, 'Type: function', 'Should identify as function');
  suite.assertContains(output, 'Is function: true', 'Should confirm function type');
  suite.assertContains(output, 'Function name: testFunction', 'Should extract function name');
  suite.assertContains(output, 'Function length (params): 3', 'Should count parameters');
  suite.assertContains(output, 'Function string preview:', 'Should show code preview');
  suite.assertContains(output, '=============================', 'Should have footer');
  
  console.log = originalLog;
});

// Test 15: paramInfo with object parameter
suite.test('paramInfo provides detailed object analysis', () => {
  let mockConsoleLog = [];
  const originalLog = console.log;
  console.log = (...args) => mockConsoleLog.push(args.join(' '));
  
  const testObject = { name: "test", value: 42, active: true };
  
  tracingModule.paramInfo(testObject);
  
  const output = mockConsoleLog.join('\n');
  suite.assertContains(output, 'Type: object', 'Should identify as object');
  suite.assertContains(output, 'Is function: false', 'Should confirm not function');
  suite.assertContains(output, 'Object keys:', 'Should list object keys');
  suite.assertContains(output, 'Constructor: Object', 'Should identify constructor');
  
  console.log = originalLog;
});

// Test 16: paramInfo with string parameter
suite.test('paramInfo provides detailed string analysis', () => {
  let mockConsoleLog = [];
  const originalLog = console.log;
  console.log = (...args) => mockConsoleLog.push(args.join(' '));
  
  const testString = "hello world";
  
  tracingModule.paramInfo(testString);
  
  const output = mockConsoleLog.join('\n');
  suite.assertContains(output, 'Type: string', 'Should identify as string');
  suite.assertContains(output, 'String value: "hello world"', 'Should show quoted value');
  suite.assertContains(output, 'String length: 11', 'Should show length');
  
  console.log = originalLog;
});

// Test 17: paramInfo with various data types
suite.test('paramInfo handles all data types correctly', () => {
  let mockConsoleLog = [];
  const originalLog = console.log;
  console.log = (...args) => mockConsoleLog.push(args.join(' '));
  
  // Test different types
  const testCases = [
    { value: null, expectedType: 'object' },
    { value: undefined, expectedType: 'undefined' },
    { value: 42, expectedType: 'number' },
    { value: true, expectedType: 'boolean' },
    { value: [], expectedType: 'object' }
  ];
  
  for (const testCase of testCases) {
    mockConsoleLog = []; // Clear for each test
    tracingModule.paramInfo(testCase.value);
    
    const output = mockConsoleLog.join(' ');
    suite.assertContains(output, `Type: ${testCase.expectedType}`, 
      `Should identify ${testCase.value} as ${testCase.expectedType}`);
    suite.assertContains(output, 'Is null:', 'Should check for null');
    suite.assertContains(output, 'Is undefined:', 'Should check for undefined');
  }
  
  console.log = originalLog;
});

// Test 18: Integration test - deprecatedWarning and paramInfo workflow
suite.test('deprecatedWarning and paramInfo integration workflow', () => {
  let mockConsoleWarn = [];
  let mockConsoleLog = [];
  const originalWarn = console.warn;
  const originalLog = console.log;
  
  console.warn = (...args) => mockConsoleWarn.push(args.join(' '));
  console.log = (...args) => mockConsoleLog.push(args.join(' '));
  
  function newCalculate(operation, a, b) {
    if (operation === 'add') return a + b;
    if (operation === 'multiply') return a * b;
    return 0;
  }
  
  function oldCalculate(operation, a, b) {
    return tracingModule.deprecatedWarning(newCalculate, operation, a, b);
  }
  
  const result = oldCalculate('add', 10, 5);
  
  // Verify the complete workflow
  suite.assertEqual(result, 15, 'Should execute replacement function correctly');
  suite.assertTrue(mockConsoleWarn.length > 0, 'Should generate deprecation warning');
  suite.assertTrue(mockConsoleLog.length > 0, 'Should generate parameter debug info');
  
  // Check warning content
  const warningMsg = mockConsoleWarn.join(' ');
  suite.assertContains(warningMsg, 'deprecated', 'Should mention deprecation');
  suite.assertContains(warningMsg, 'newCalculate', 'Should mention replacement function');
  
  // Check debug info was comprehensive
  const debugOutput = mockConsoleLog.join(' ');
  suite.assertContains(debugOutput, 'Parameter Debug Info', 'Should provide debug header');
  suite.assertContains(debugOutput, 'Function name: newCalculate', 'Should identify function in debug');
  
  console.warn = originalWarn;
  console.log = originalLog;
});

// Register with global test runner and run conditionally
if (typeof globalThis !== 'undefined' && globalThis.registerTest) {
  globalThis.registerTest('Tracing Tests', () => {
    const success = suite.run();
    return success;
  });
}

// Auto-run if tests are enabled
if (typeof globalThis !== 'undefined' && globalThis.shouldRunTests && globalThis.shouldRunTests()) {
  console.log('🧪 Running Tracing tests...');
  const success = suite.run();
} else if (typeof globalThis !== 'undefined' && globalThis.shouldRunTests) {
  console.log('🧪 Tracing tests available but disabled. Use enableTests() to enable or runTests() to run manually.');
} else {
  // Fallback: Run the test suite if this file is executed directly
  if (require.main === module) {
    const success = suite.run();
    process.exit(success ? 0 : 1);
  }
}

module.exports = suite;