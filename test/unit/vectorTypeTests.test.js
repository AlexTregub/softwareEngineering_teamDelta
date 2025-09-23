// Vector Type Tests
// Comprehensive tests for vector type checking functions

// Import the vector type functions if in Node.js environment
let vectorFunctions;
if (typeof module !== 'undefined' && typeof require !== 'undefined') {
  try {
    vectorFunctions = require('../../TypeTests/vectorTypeTests.js');
  } catch (e) {
    console.log('Running in browser environment');
  }
}

// Test framework functions
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function runTest(testName, testFunction) {
  try {
    testFunction();
    console.log(`✓ ${testName}`);
    return true;
  } catch (error) {
    console.error(`✗ ${testName}: ${error.message}`);
    return false;
  }
}

// Test data setup
function setupTestData() {
  const testData = {
    // Valid vectors
    p5Vector2D: typeof createVector !== 'undefined' ? createVector(1, 2) : null,
    p5Vector3D: typeof createVector !== 'undefined' ? createVector(1, 2, 3) : null,
    object2D: { x: 1, y: 2 },
    object3D: { x: 1, y: 2, z: 3 },
    array2D: [1, 2],
    array3D: [1, 2, 3],
    
    // Edge cases
    zeroVector2D: { x: 0, y: 0 },
    zeroVector3D: { x: 0, y: 0, z: 0 },
    negativeVector: { x: -1, y: -2, z: -3 },
    floatVector: { x: 1.5, y: 2.7 },
    
    // Invalid vectors
    stringVector: { x: "1", y: "2" },
    missingY: { x: 1 },
    missingX: { y: 2 },
    nullValue: null,
    undefinedValue: undefined,
    emptyObject: {},
    string: "not a vector",
    number: 42,
    boolean: true,
    array1D: [1],
    array4D: [1, 2, 3, 4],
    arrayWithStrings: ["1", "2"],
    objectWithExtra: { x: 1, y: 2, z: 3, w: 4 }
  };
  
  return testData;
}

// Tests for isVector function
function testIsVector() {
  const data = setupTestData();
  
  // Valid vectors should return true
  if (data.p5Vector2D) assert(isVector(data.p5Vector2D), 'p5Vector2D should be valid');
  if (data.p5Vector3D) assert(isVector(data.p5Vector3D), 'p5Vector3D should be valid');
  assert(isVector(data.object2D), 'object2D should be valid');
  assert(isVector(data.object3D), 'object3D should be valid');
  assert(isVector(data.array2D), 'array2D should be valid');
  assert(isVector(data.array3D), 'array3D should be valid');
  assert(isVector(data.zeroVector2D), 'zeroVector2D should be valid');
  assert(isVector(data.zeroVector3D), 'zeroVector3D should be valid');
  assert(isVector(data.negativeVector), 'negativeVector should be valid');
  assert(isVector(data.floatVector), 'floatVector should be valid');
  
  // Invalid vectors should return false
  assert(!isVector(data.stringVector), 'stringVector should be invalid');
  assert(!isVector(data.missingY), 'missingY should be invalid');
  assert(!isVector(data.missingX), 'missingX should be invalid');
  assert(!isVector(data.nullValue), 'nullValue should be invalid');
  assert(!isVector(data.undefinedValue), 'undefinedValue should be invalid');
  assert(!isVector(data.emptyObject), 'emptyObject should be invalid');
  assert(!isVector(data.string), 'string should be invalid');
  assert(!isVector(data.number), 'number should be invalid');
  assert(!isVector(data.boolean), 'boolean should be invalid');
  assert(!isVector(data.array1D), 'array1D should be invalid');
  assert(!isVector(data.array4D), 'array4D should be invalid');
  assert(!isVector(data.arrayWithStrings), 'arrayWithStrings should be invalid');
}

// Tests for isVector2D function
function testIsVector2D() {
  const data = setupTestData();
  
  // 2D vectors should return true
  if (data.p5Vector2D) assert(isVector2D(data.p5Vector2D), 'p5Vector2D should be 2D');
  assert(isVector2D(data.object2D), 'object2D should be 2D');
  assert(isVector2D(data.array2D), 'array2D should be 2D');
  assert(isVector2D(data.zeroVector2D), 'zeroVector2D should be 2D');
  assert(isVector2D(data.floatVector), 'floatVector should be 2D');
  
  // 3D vectors should return false
  if (data.p5Vector3D) assert(!isVector2D(data.p5Vector3D), 'p5Vector3D should not be 2D');
  assert(!isVector2D(data.object3D), 'object3D should not be 2D');
  assert(!isVector2D(data.array3D), 'array3D should not be 2D');
  assert(!isVector2D(data.zeroVector3D), 'zeroVector3D should not be 2D');
  
  // Invalid vectors should return false
  assert(!isVector2D(data.string), 'string should not be 2D');
  assert(!isVector2D(data.nullValue), 'nullValue should not be 2D');
}

// Tests for isVector3D function
function testIsVector3D() {
  const data = setupTestData();
  
  // 3D vectors should return true
  if (data.p5Vector3D) assert(isVector3D(data.p5Vector3D), 'p5Vector3D should be 3D');
  assert(isVector3D(data.object3D), 'object3D should be 3D');
  assert(isVector3D(data.array3D), 'array3D should be 3D');
  assert(isVector3D(data.zeroVector3D), 'zeroVector3D should be 3D');
  assert(isVector3D(data.negativeVector), 'negativeVector should be 3D');
  
  // 2D vectors should return false
  if (data.p5Vector2D) assert(!isVector3D(data.p5Vector2D), 'p5Vector2D should not be 3D');
  assert(!isVector3D(data.object2D), 'object2D should not be 3D');
  assert(!isVector3D(data.array2D), 'array2D should not be 3D');
  assert(!isVector3D(data.zeroVector2D), 'zeroVector2D should not be 3D');
  
  // Invalid vectors should return false
  assert(!isVector3D(data.string), 'string should not be 3D');
  assert(!isVector3D(data.nullValue), 'nullValue should not be 3D');
}

// Tests for isP5Vector function
function testIsP5Vector() {
  const data = setupTestData();
  
  // Only p5.js vectors should return true
  if (data.p5Vector2D) assert(isP5Vector(data.p5Vector2D), 'p5Vector2D should be p5Vector');
  if (data.p5Vector3D) assert(isP5Vector(data.p5Vector3D), 'p5Vector3D should be p5Vector');
  
  // Other vector types should return false
  assert(!isP5Vector(data.object2D), 'object2D should not be p5Vector');
  assert(!isP5Vector(data.object3D), 'object3D should not be p5Vector');
  assert(!isP5Vector(data.array2D), 'array2D should not be p5Vector');
  assert(!isP5Vector(data.array3D), 'array3D should not be p5Vector');
  
  // Invalid vectors should return false
  assert(!isP5Vector(data.string), 'string should not be p5Vector');
  assert(!isP5Vector(data.nullValue), 'nullValue should not be p5Vector');
}

// Tests for getVectorType function
function testGetVectorType() {
  const data = setupTestData();
  
  // Test correct type identification
  if (data.p5Vector2D) assertEqual(getVectorType(data.p5Vector2D), "p5Vector", 'p5Vector2D type');
  if (data.p5Vector3D) assertEqual(getVectorType(data.p5Vector3D), "p5Vector", 'p5Vector3D type');
  assertEqual(getVectorType(data.object2D), "object2D", 'object2D type');
  assertEqual(getVectorType(data.object3D), "object3D", 'object3D type');
  assertEqual(getVectorType(data.array2D), "array2D", 'array2D type');
  assertEqual(getVectorType(data.array3D), "array3D", 'array3D type');
  
  // Test non-vector types
  assertEqual(getVectorType(data.string), "notVector", 'string type');
  assertEqual(getVectorType(data.nullValue), "notVector", 'null type');
  assertEqual(getVectorType(data.undefinedValue), "notVector", 'undefined type');
  assertEqual(getVectorType(data.number), "notVector", 'number type');
}

// Test edge cases and special scenarios
function testEdgeCases() {
  // Test vectors with special values
  assert(!isVector({ x: Infinity, y: -Infinity }), 'Infinity values should be invalid');
  assert(isVector({ x: 0, y: 0 }), 'Zero vector should be valid');
  assert(!isVector({ x: NaN, y: 2 }), 'NaN values should be invalid');
  assert(!isVector({ x: 1, y: null }), 'null component should be invalid');
  assert(!isVector({ x: 1, y: undefined }), 'undefined component should be invalid');
  
  // Test objects with extra properties
  assert(isVector({ x: 1, y: 2, extraProp: "ignored" }), 'Extra properties should be ignored for 2D');
  assert(isVector({ x: 1, y: 2, z: 3, extraProp: "ignored" }), 'Extra properties should be ignored for 3D');
  
  // Test array edge cases
  assert(!isVector([]), 'Empty array should be invalid');
  assert(!isVector([1]), 'Single element array should be invalid');
  assert(!isVector([1, 2, 3, 4]), 'Four element array should be invalid');
  assert(!isVector([1, null]), 'Array with null should be invalid');
  assert(!isVector([1, undefined]), 'Array with undefined should be invalid');
}

// Performance test
function testPerformance() {
  const testVector = { x: 1, y: 2 };
  const iterations = 10000;
  
  const startTime = performance.now();
  for (let i = 0; i < iterations; i++) {
    isVector(testVector);
  }
  const endTime = performance.now();
  
  const timePerCall = (endTime - startTime) / iterations;
  console.log(`Performance: ${timePerCall.toFixed(4)}ms per call (${iterations} iterations)`);
  
  // Performance should be reasonable (less than 0.1ms per call)
  assert(timePerCall < 0.1, 'Performance should be acceptable');
}

// Main test runner
function runAllVectorTypeTests() {
  console.log('🧪 Running Vector Type Tests...');
  console.log('='.repeat(40));
  
  const tests = [
    ['isVector() function', testIsVector],
    ['isVector2D() function', testIsVector2D],
    ['isVector3D() function', testIsVector3D],
    ['isP5Vector() function', testIsP5Vector],
    ['getVectorType() function', testGetVectorType],
    ['Edge cases', testEdgeCases],
    ['Performance', testPerformance]
  ];
  
  let passed = 0;
  let failed = 0;
  
  tests.forEach(([testName, testFunction]) => {
    if (runTest(testName, testFunction)) {
      passed++;
    } else {
      failed++;
    }
  });
  
  console.log('='.repeat(40));
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All vector type tests passed!');
  } else {
    console.log('⚠️ Some tests failed. Check implementation.');
  }
  
  return { passed, failed };
}

// Auto-run tests
if (typeof window !== 'undefined') {
  // Browser environment - run after page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(runAllVectorTypeTests, 1000);
    });
  } else {
    setTimeout(runAllVectorTypeTests, 1000);
  }
} else {
  // Node.js environment - run immediately
  runAllVectorTypeTests();
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runAllVectorTypeTests,
    testIsVector,
    testIsVector2D,
    testIsVector3D,
    testIsP5Vector,
    testGetVectorType,
    testEdgeCases,
    testPerformance
  };
}