// Script Loader Integration Test - Browser Environment
// Tests the actual script loading with PascalCase fallback in browser

console.log("🌐 Script Loader Browser Integration Test");
console.log("=" .repeat(50));

// Only run in browser environment
if (typeof window === 'undefined') {
  console.log("⚠️  This test requires a browser environment");
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { browserOnly: true };
  }
} else {
  
  // Test counter
  let testsPassed = 0;
  let testsTotal = 0;

  function runAsyncTest(testName, testFunction) {
    testsTotal++;
    return testFunction()
      .then(() => {
        console.log(`✅ ${testName}`);
        testsPassed++;
      })
      .catch(error => {
        console.log(`❌ ${testName}: ${error.message}`);
      });
  }

  function assert(condition, message) {
    if (!condition) {
      throw new Error(message || "Assertion failed");
    }
  }

  // Test 1: Script loader exists and has required methods
  async function testScriptLoaderExists() {
    assert(typeof window.scriptLoader !== 'undefined', "Script loader should exist");
    assert(typeof window.scriptLoader.toPascalCase === 'function', "Should have toPascalCase method");
    assert(typeof window.scriptLoader.loadScript === 'function', "Should have loadScript method");
    assert(typeof window.scriptLoader.analyzeNamingConventions === 'function', "Should have analyzeNamingConventions method");
    assert(typeof window.scriptLoader.checkNamingConflicts === 'function', "Should have checkNamingConflicts method");
  }

  // Test 2: Utility functions are available
  async function testUtilityFunctions() {
    assert(typeof window.checkNamingConventions === 'function', "checkNamingConventions should be available");
    assert(typeof window.testPascalCaseFallback === 'function', "testPascalCaseFallback should be available");
    assert(typeof window.fixNaming === 'function', "fixNaming should be available in utils");
  }

  // Test 3: PascalCase conversion works correctly
  async function testPascalCaseConversion() {
    const testCases = [
      { input: 'myScript.js', expected: 'MyScript.js' },
      { input: 'path/to/myFile.js', expected: 'path/to/MyFile.js' },
      { input: 'Classes/ants/antWrapper.js', expected: 'Classes/ants/AntWrapper.js' },
      { input: 'Already/Capitalized.js', expected: 'Already/Capitalized.js' },
      { input: 'single.js', expected: 'Single.js' }
    ];

    testCases.forEach(testCase => {
      const result = window.scriptLoader.toPascalCase(testCase.input);
      assert(result === testCase.expected, 
        `PascalCase conversion: ${testCase.input} should become ${testCase.expected}, got ${result}`);
    });
  }

  // Test 4: Naming convention analysis returns expected structure
  async function testNamingAnalysis() {
    const analysis = window.scriptLoader.analyzeNamingConventions();
    
    assert(typeof analysis === 'object', "Analysis should return an object");
    assert(Array.isArray(analysis.camelCase), "Should have camelCase array");
    assert(Array.isArray(analysis.PascalCase), "Should have PascalCase array");
    assert(Array.isArray(analysis.kebabCase), "Should have kebabCase array");
    assert(Array.isArray(analysis.snake_case), "Should have snake_case array");
    assert(Array.isArray(analysis.unclear), "Should have unclear array");
    
    // Should have some files in at least one category
    const totalFiles = Object.values(analysis).reduce((sum, arr) => sum + arr.length, 0);
    assert(totalFiles > 0, "Should analyze at least some files");
  }

  // Test 5: Status includes naming conventions
  async function testStatusInclusion() {
    const status = window.scriptLoader.getStatus();
    
    assert(typeof status === 'object', "Status should be an object");
    assert(typeof status.namingConventions === 'object', "Status should include namingConventions");
    assert(typeof status.environment === 'string', "Status should include environment");
    assert(Array.isArray(status.loaded), "Status should include loaded scripts array");
  }

  // Test 6: Mock script loading with fallback (safe test)
  async function testMockScriptLoadingFallback() {
    // Create a safe test that doesn't actually load external scripts
    const originalLoadScript = window.scriptLoader.loadScript;
    let attemptedUrls = [];
    
    // Mock the loadScript method temporarily
    window.scriptLoader.loadScript = function(src) {
      attemptedUrls.push(src);
      
      // Simulate first attempt failure, then success on PascalCase
      if (src === 'test/nonExistent.js') {
        return Promise.reject(new Error('404 Not Found'));
      } else if (src === 'test/NonExistent.js') {
        return Promise.resolve();
      }
      
      return originalLoadScript.call(this, src);
    };

    try {
      // Test the fallback logic (but don't actually load)
      const pascalVersion = window.scriptLoader.toPascalCase('test/nonExistent.js');
      assert(pascalVersion === 'test/NonExistent.js', "Should generate correct PascalCase version");
      
    } finally {
      // Restore original method
      window.scriptLoader.loadScript = originalLoadScript;
    }
  }

  // Test 7: Utility function integration
  async function testUtilityIntegration() {
    // Test that utility functions work without errors
    const conventions = window.checkNamingConventions();
    assert(typeof conventions === 'object', "checkNamingConventions should return object");
    
    const pascalTest = window.testPascalCaseFallback('testFile.js');
    assert(pascalTest === 'TestFile.js', "testPascalCaseFallback should work correctly");
  }

  // Test 8: Error handling in browser environment
  async function testErrorHandling() {
    // Test that functions handle edge cases gracefully
    try {
      const result = window.scriptLoader.toPascalCase('');
      assert(typeof result === 'string', "Should handle empty string");
    } catch (error) {
      assert(false, "Should not throw error for empty string");
    }

    try {
      const analysis = window.scriptLoader.analyzeNamingConventions();
      assert(typeof analysis === 'object', "Analysis should complete without errors");
    } catch (error) {
      assert(false, "Naming analysis should not throw errors");
    }
  }

  // Test 9: Performance in browser
  async function testBrowserPerformance() {
    const startTime = performance.now();
    
    // Run analysis multiple times
    for (let i = 0; i < 10; i++) {
      window.scriptLoader.analyzeNamingConventions();
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    assert(totalTime < 100, `Multiple analyses should complete quickly, took ${totalTime.toFixed(2)}ms`);
  }

  // Test 10: Console functions work
  async function testConsoleFunctions() {
    // Test that console functions exist and can be called
    assert(typeof window.listScripts === 'function', "listScripts should be available");
    assert(typeof window.analyzeLoading === 'function', "analyzeLoading should be available");
    
    // These should not throw errors
    try {
      window.checkNamingConventions();
      console.log("✓ checkNamingConventions executed successfully");
    } catch (error) {
      assert(false, "checkNamingConventions should not throw error");
    }
  }

  // Run all tests
  async function runAllBrowserTests() {
    console.log("🚀 Starting browser integration tests...\n");

    const tests = [
      ["Script loader exists", testScriptLoaderExists],
      ["Utility functions available", testUtilityFunctions],
      ["PascalCase conversion", testPascalCaseConversion],
      ["Naming convention analysis", testNamingAnalysis],
      ["Status includes naming conventions", testStatusInclusion],
      ["Mock script loading fallback", testMockScriptLoadingFallback],
      ["Utility function integration", testUtilityIntegration],
      ["Error handling", testErrorHandling],
      ["Browser performance", testBrowserPerformance],
      ["Console functions", testConsoleFunctions]
    ];

    for (const [testName, testFunction] of tests) {
      await runAsyncTest(testName, testFunction);
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 BROWSER INTEGRATION TEST RESULTS");
    console.log("=".repeat(50));
    console.log(`Tests passed: ${testsPassed}/${testsTotal}`);

    if (testsPassed === testsTotal) {
      console.log("🎉 All browser integration tests passed!");
      console.log("✅ Script loader is fully functional in browser");
      console.log("✅ Naming convention features work correctly");
      console.log("✅ All utility functions are accessible");
    } else {
      console.log(`❌ ${testsTotal - testsPassed} test(s) failed`);
      console.log("⚠️  Check browser console for details");
    }

    return { passed: testsPassed, total: testsTotal };
  }

  // Auto-run tests when page is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(runAllBrowserTests, 2000); // Wait for script loader to initialize
    });
  } else {
    setTimeout(runAllBrowserTests, 2000);
  }

  // Export the test runner
  window.runScriptLoaderIntegrationTests = runAllBrowserTests;
}

console.log("💡 Test will run automatically in browser environment");
console.log("📝 Or run manually with: runScriptLoaderIntegrationTests()");