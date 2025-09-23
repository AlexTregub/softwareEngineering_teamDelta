// Standalone Vector Type Test Runner
// Run with: node test-vector-types-standalone.js

const fs = require('fs');
const path = require('path');

console.log('🧪 VECTOR TYPE TESTS - STANDALONE VERSION');
console.log('='.repeat(60));

// Mock p5.js createVector function for testing
global.createVector = function(x, y, z) {
  const vector = { x, y };
  if (z !== undefined) vector.z = z;
  
  // Mock p5.Vector prototype
  vector.constructor = { name: 'p5.Vector' };
  Object.setPrototypeOf(vector, { constructor: { name: 'p5.Vector' } });
  
  return vector;
};

// Mock p5.Vector class
global.p5 = {
  Vector: function(x, y, z) {
    return global.createVector(x, y, z);
  }
};

// Mock performance.now for Node.js
if (typeof performance === 'undefined') {
  global.performance = {
    now: () => Date.now()
  };
}

// Load the vector type functions
try {
  const vectorTypePath = path.join(__dirname, 'TypeTests', 'vectorTypeTests.js');
  const vectorTypeCode = fs.readFileSync(vectorTypePath, 'utf8');
  eval(vectorTypeCode);
  console.log('✓ Vector type functions loaded successfully');
} catch (error) {
  console.error('❌ Failed to load vector type functions:', error.message);
  process.exit(1);
}

// Load and run the tests
try {
  const testPath = path.join(__dirname, 'test', 'vectorTypeTests.test.js');
  const testCode = fs.readFileSync(testPath, 'utf8');
  eval(testCode);
  console.log('✓ Test code loaded successfully');
} catch (error) {
  console.error('❌ Failed to load test code:', error.message);
  process.exit(1);
}

// Run the tests
console.log('\n🚀 Starting tests...\n');

try {
  const results = runAllVectorTypeTests();
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests completed successfully!');
    process.exit(0);
  } else {
    console.log(`\n⚠️ ${results.failed} test(s) failed.`);
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Test execution failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}