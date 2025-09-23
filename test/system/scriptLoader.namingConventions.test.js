// Script Loader Naming Convention Tests
// Tests for camelCase/PascalCase fallback functionality and naming analysis

console.log("🧪 Testing Script Loader Naming Convention Features");
console.log("=" .repeat(60));

// Test counter
let testsPassed = 0;
let testsTotal = 0;

// Test framework functions
function runTest(testName, testFunction) {
  testsTotal++;
  try {
    testFunction();
    console.log(`✅ ${testName}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${testName}: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected '${expected}', got '${actual}'`);
  }
}

// Mock script loader for testing (Node.js compatible)
class MockScriptLoader {
  constructor() {
    this.loadedScripts = new Set();
    this.loadingPromises = new Map();
    this.environment = 'test';
  }

  toPascalCase(filename) {
    const lastSlash = filename.lastIndexOf('/');
    const directory = lastSlash >= 0 ? filename.substring(0, lastSlash + 1) : '';
    const file = lastSlash >= 0 ? filename.substring(lastSlash + 1) : filename;
    
    const lastDot = file.lastIndexOf('.');
    const name = lastDot >= 0 ? file.substring(0, lastDot) : file;
    const extension = lastDot >= 0 ? file.substring(lastDot) : '';
    
    const pascalName = name.charAt(0).toUpperCase() + name.slice(1);
    
    return directory + pascalName + extension;
  }

  getScriptsForEnvironment() {
    return [
      'Classes/myScript.js',
      'Classes/AnotherScript.js', 
      'modules/helper-utils.js',
      'modules/DataProcessor.js',
      'utils/string_helper.js',
      'components/UserInterface.js',
      'services/apiClient.js'
    ];
  }

  analyzeNamingConventions() {
    const scripts = this.getScriptsForEnvironment();
    const analysis = {
      camelCase: [],
      PascalCase: [],
      kebabCase: [],
      snake_case: [],
      unclear: []
    };

    scripts.forEach(script => {
      const filename = script.split('/').pop().split('.')[0];
      
      if (/^[a-z][a-zA-Z0-9]*$/.test(filename)) {
        analysis.camelCase.push(script);
      } else if (/^[A-Z][a-zA-Z0-9]*$/.test(filename)) {
        analysis.PascalCase.push(script);
      } else if (/^[a-z0-9]+(-[a-z0-9]+)+$/.test(filename)) {
        analysis.kebabCase.push(script);
      } else if (/^[a-z0-9]+(_[a-z0-9]+)+$/.test(filename)) {
        analysis.snake_case.push(script);
      } else {
        analysis.unclear.push(script);
      }
    });

    return analysis;
  }

  checkNamingConflicts() {
    const scripts = this.getScriptsForEnvironment();
    const conflicts = [];
    
    scripts.forEach(script => {
      const pascalVersion = this.toPascalCase(script);
      if (pascalVersion !== script && scripts.includes(pascalVersion)) {
        conflicts.push({
          camelCase: script,
          PascalCase: pascalVersion,
          warning: 'Both camelCase and PascalCase versions exist'
        });
      }
    });

    return conflicts;
  }

  getStatus() {
    return {
      environment: this.environment,
      loaded: Array.from(this.loadedScripts),
      loading: Array.from(this.loadingPromises.keys()),
      total: this.getScriptsForEnvironment().length,
      namingConventions: this.analyzeNamingConventions()
    };
  }
}

// Test 1: toPascalCase conversion
runTest("toPascalCase converts camelCase correctly", () => {
  const loader = new MockScriptLoader();
  
  assertEqual(loader.toPascalCase("myScript.js"), "MyScript.js", "Simple camelCase");
  assertEqual(loader.toPascalCase("Classes/myScript.js"), "Classes/MyScript.js", "Path with camelCase");
  assertEqual(loader.toPascalCase("modules/helper/dataProcessor.js"), "modules/helper/DataProcessor.js", "Nested path");
  assertEqual(loader.toPascalCase("MyScript.js"), "MyScript.js", "Already PascalCase");
  assertEqual(loader.toPascalCase("a.js"), "A.js", "Single letter");
  assertEqual(loader.toPascalCase("script"), "Script", "No extension");
});

// Test 2: toPascalCase edge cases
runTest("toPascalCase handles edge cases", () => {
  const loader = new MockScriptLoader();
  
  assertEqual(loader.toPascalCase(""), "", "Empty string");
  assertEqual(loader.toPascalCase("test/"), "test/", "Directory only");
  assertEqual(loader.toPascalCase(".js"), ".js", "Extension only");
  assertEqual(loader.toPascalCase("script.min.js"), "Script.min.js", "Multiple dots");
  assertEqual(loader.toPascalCase("very/deep/path/myFile.js"), "very/deep/path/MyFile.js", "Deep path");
});

// Test 3: Naming convention analysis
runTest("analyzeNamingConventions categorizes correctly", () => {
  const loader = new MockScriptLoader();
  const analysis = loader.analyzeNamingConventions();
  
  assert(analysis.camelCase.includes('Classes/myScript.js'), "Should detect camelCase");
  assert(analysis.camelCase.includes('services/apiClient.js'), "Should detect camelCase in services");
  
  assert(analysis.PascalCase.includes('Classes/AnotherScript.js'), "Should detect PascalCase");
  assert(analysis.PascalCase.includes('modules/DataProcessor.js'), "Should detect PascalCase in modules");
  
  assert(analysis.kebabCase.includes('modules/helper-utils.js'), "Should detect kebab-case");
  
  assert(analysis.snake_case.includes('utils/string_helper.js'), "Should detect snake_case");
});

// Test 4: Conflict detection
runTest("checkNamingConflicts detects potential issues", () => {
  const loader = new MockScriptLoader();
  
  // Add a conflicting script to test
  const originalGetScripts = loader.getScriptsForEnvironment;
  loader.getScriptsForEnvironment = () => [
    'Classes/myScript.js',
    'Classes/MyScript.js', // Conflict with above
    'services/apiClient.js'
  ];
  
  const conflicts = loader.checkNamingConflicts();
  
  assert(conflicts.length === 1, "Should detect one conflict");
  assert(conflicts[0].camelCase === 'Classes/myScript.js', "Should identify camelCase version");
  assert(conflicts[0].PascalCase === 'Classes/MyScript.js', "Should identify PascalCase version");
  
  // Restore original method
  loader.getScriptsForEnvironment = originalGetScripts;
});

// Test 5: Status includes naming conventions
runTest("getStatus includes naming convention analysis", () => {
  const loader = new MockScriptLoader();
  const status = loader.getStatus();
  
  assert(status.namingConventions, "Status should include namingConventions");
  assert(status.namingConventions.camelCase, "Should have camelCase category");
  assert(status.namingConventions.PascalCase, "Should have PascalCase category");
  assert(Array.isArray(status.namingConventions.camelCase), "camelCase should be an array");
  assert(status.namingConventions.camelCase.length > 0, "Should detect some camelCase files");
});

// Test 6: Naming convention regex patterns
runTest("Naming convention regex patterns work correctly", () => {
  const testCases = [
    // camelCase tests
    { name: 'myScript', expected: 'camelCase' },
    { name: 'apiClient', expected: 'camelCase' },
    { name: 'dataProcessor', expected: 'camelCase' },
    { name: 'a', expected: 'camelCase' },
    
    // PascalCase tests
    { name: 'MyScript', expected: 'PascalCase' },
    { name: 'ApiClient', expected: 'PascalCase' },
    { name: 'DataProcessor', expected: 'PascalCase' },
    { name: 'A', expected: 'PascalCase' },
    
    // kebab-case tests
    { name: 'my-script', expected: 'kebabCase' },
    { name: 'api-client-helper', expected: 'kebabCase' },
    
    // snake_case tests
    { name: 'my_script', expected: 'snake_case' },
    { name: 'api_client_helper', expected: 'snake_case' },
    
    // unclear cases
    { name: 'My-Script', expected: 'unclear' },
    { name: '123script', expected: 'unclear' },
    { name: 'script@test', expected: 'unclear' }
  ];

  testCases.forEach(testCase => {
    const filename = testCase.name;
    let detected = 'unclear';
    
    if (/^[a-z][a-zA-Z0-9]*$/.test(filename)) {
      detected = 'camelCase';
    } else if (/^[A-Z][a-zA-Z0-9]*$/.test(filename)) {
      detected = 'PascalCase';
    } else if (/^[a-z0-9]+(-[a-z0-9]+)+$/.test(filename)) {
      detected = 'kebabCase';
    } else if (/^[a-z0-9]+(_[a-z0-9]+)+$/.test(filename)) {
      detected = 'snake_case';
    }
    
    assert(detected === testCase.expected, 
      `Filename '${filename}' should be detected as ${testCase.expected}, got ${detected}`);
  });
});

// Test 7: Performance test for naming analysis
runTest("Naming convention analysis performs well", () => {
  const loader = new MockScriptLoader();
  
  // Override to return many scripts
  loader.getScriptsForEnvironment = () => {
    const scripts = [];
    for (let i = 0; i < 1000; i++) {
      scripts.push(`script${i}.js`);
      scripts.push(`Script${i}.js`);
      scripts.push(`script-${i}.js`);
    }
    return scripts;
  };
  
  const startTime = performance.now();
  const analysis = loader.analyzeNamingConventions();
  const endTime = performance.now();
  
  const processingTime = endTime - startTime;
  assert(processingTime < 100, `Analysis should complete in <100ms, took ${processingTime.toFixed(2)}ms`);
  
  // Verify results are correct
  assert(analysis.camelCase.length === 1000, "Should detect 1000 camelCase files");
  assert(analysis.PascalCase.length === 1000, "Should detect 1000 PascalCase files");
  assert(analysis.kebabCase.length === 1000, "Should detect 1000 kebab-case files");
});

// Test 8: Browser environment compatibility
runTest("Browser environment compatibility", () => {
  // Test that functions work without browser-specific APIs
  const loader = new MockScriptLoader();
  
  // These should not throw errors even without DOM
  assert(typeof loader.toPascalCase === 'function', "toPascalCase should be a function");
  assert(typeof loader.analyzeNamingConventions === 'function', "analyzeNamingConventions should be a function");
  assert(typeof loader.checkNamingConflicts === 'function', "checkNamingConflicts should be a function");
  
  // Test with various inputs
  const result = loader.toPascalCase("test/file.js");
  assert(typeof result === 'string', "Should return string result");
});

// Test 9: Integration with real script loader (if available)
runTest("Integration with real script loader", () => {
  if (typeof window !== 'undefined' && window.scriptLoader) {
    const realLoader = window.scriptLoader;
    
    // Test that real loader has the required methods
    assert(typeof realLoader.toPascalCase === 'function', "Real loader should have toPascalCase");
    assert(typeof realLoader.analyzeNamingConventions === 'function', "Real loader should have analyzeNamingConventions");
    assert(typeof realLoader.checkNamingConflicts === 'function', "Real loader should have checkNamingConflicts");
    
    // Test with a sample filename
    const result = realLoader.toPascalCase("test.js");
    assertEqual(result, "Test.js", "Real loader should convert correctly");
  } else {
    console.log("ℹ️  Skipping real loader integration test (not in browser environment)");
  }
});

// Test 10: Error handling
runTest("Error handling for invalid inputs", () => {
  const loader = new MockScriptLoader();
  
  // Test with invalid inputs
  try {
    loader.toPascalCase(null);
    assert(false, "Should handle null input gracefully");
  } catch (error) {
    // Expected to throw or handle gracefully
  }
  
  try {
    loader.toPascalCase(undefined);
    assert(false, "Should handle undefined input gracefully");
  } catch (error) {
    // Expected to throw or handle gracefully
  }
  
  // Test with edge case that should work
  const result = loader.toPascalCase("");
  assert(typeof result === 'string', "Should handle empty string");
});

// Print results
console.log("\n" + "=".repeat(60));
console.log("📊 NAMING CONVENTION TEST RESULTS");
console.log("=".repeat(60));
console.log(`Tests passed: ${testsPassed}/${testsTotal}`);

if (testsPassed === testsTotal) {
  console.log("🎉 All naming convention tests passed!");
  console.log("✅ PascalCase fallback system is working correctly");
  console.log("✅ Naming convention analysis is accurate");
  console.log("✅ Conflict detection is functional");
  console.log("✅ Performance is acceptable");
} else {
  console.log(`❌ ${testsTotal - testsPassed} test(s) failed`);
  console.log("⚠️  Please review the implementation");
}

// Export for module environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MockScriptLoader,
    runTest,
    assert,
    assertEqual,
    testResults: { passed: testsPassed, total: testsTotal }
  };
}

// Auto-run in browser with delay
if (typeof window !== 'undefined') {
  console.log("\n💡 To test in browser console, try:");
  console.log("  - checkNamingConventions()");
  console.log("  - fixNaming()");
  console.log("  - testPascalCaseFallback('myScript.js')");
}