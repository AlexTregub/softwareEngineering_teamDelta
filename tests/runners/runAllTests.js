/**
 * Comprehensive Test Runner - Auto-Discovery
 * Automatically discovers and runs ALL test files in the tests directory
 * Provides detailed reporting across unit, integration, and e2e tests
 */

const fs = require('fs');
const path = require('path');

// Load test utilities first
require('../utilities/testHelpers.js');

console.log('🚀 COMPREHENSIVE AUTO-DISCOVERY TEST SUITE');
console.log('================================================================================');
console.log('Automatically discovering and running ALL test files in the tests directory');
console.log('✅ Test utilities and helpers loaded\n');

// Test discovery and results tracking
let allTestFiles = [];
let totalTests = 0;
let totalPassed = 0;
let totalFailed = 0;
let testResults = [];
let suiteResults = [];

/**
 * Recursively discover all .test.js files
 */
function discoverTestFiles(dir, basePath = '') {
  const files = fs.readdirSync(dir);
  let foundFiles = [];
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const relativePath = path.join(basePath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && file !== 'node_modules' && file !== '.git') {
      // Recursively search subdirectories
      foundFiles = foundFiles.concat(discoverTestFiles(filePath, relativePath));
    } else if (file.endsWith('.test.js')) {
      foundFiles.push({
        name: file,
        path: filePath,
        relativePath: relativePath,
        category: basePath.split(path.sep)[0] || 'root'
      });
    }
  });
  
  return foundFiles;
}

/**
 * Safe require with error handling
 */
function safeRequire(filePath, fileName) {
  try {
    // Clear require cache to ensure fresh load
    delete require.cache[require.resolve(filePath)];
    return require(filePath);
  } catch (error) {
    console.log(`⚠️  Could not load ${fileName}: ${error.message}`);
    return null;
  }
}

/**
 * Run a test suite and capture results
 */
function runTestSuite(testFile) {
  console.log(`📋 Running ${testFile.relativePath}`);
  console.log('------------------------------------------------------------');
  
  let suitePassed = 0;
  let suiteFailed = 0;
  let suiteTests = 0;
  let startTime = Date.now();
  
  try {
    const testModule = safeRequire(testFile.path, testFile.name);
    
    if (!testModule) {
      console.log(`❌ Failed to load test module\n`);
      totalTests++;
      totalFailed++;
      suiteFailed++;
      return;
    }
    
    // Try different test suite formats
    if (testModule.runJobComponentTests && typeof testModule.runJobComponentTests === 'function') {
      // JobComponent style tests
      const result = testModule.runJobComponentTests();
      if (result && result.testResults) {
        result.testResults.forEach(test => {
          suiteTests++;
          if (test.status === 'PASS') {
            suitePassed++;
            console.log(`✅ ${test.description}`);
          } else {
            suiteFailed++;
            console.log(`❌ ${test.description} - ${test.error || 'Failed'}`);
          }
        });
      }
    } else if (testModule.runTests && typeof testModule.runTests === 'function') {
      // Generic runTests function
      const result = testModule.runTests();
      if (result && result.testResults) {
        result.testResults.forEach(test => {
          suiteTests++;
          if (test.status === 'PASS') {
            suitePassed++;
            console.log(`✅ ${test.description}`);
          } else {
            suiteFailed++;
            console.log(`❌ ${test.description} - ${test.error || 'Failed'}`);
          }
        });
      }
    } else if (testModule.testResults && Array.isArray(testModule.testResults)) {
      // Direct test results array
      testModule.testResults.forEach(test => {
        suiteTests++;
        if (test.status === 'PASS') {
          suitePassed++;
          console.log(`✅ ${test.description}`);
        } else {
          suiteFailed++;
          console.log(`❌ ${test.description} - ${test.error || 'Failed'}`);
        }
      });
    } else if (typeof testModule === 'function') {
      // Suite is a function, try to run it
      const result = testModule();
      suiteTests = 1;
      suitePassed = 1;
      console.log(`✅ ${testFile.name} - Function executed successfully`);
    } else {
      // Try to run any exported functions that look like tests
      let testsFound = false;
      for (const [key, value] of Object.entries(testModule)) {
        if (typeof value === 'function' && (key.includes('test') || key.includes('Test'))) {
          testsFound = true;
          try {
            value();
            suiteTests++;
            suitePassed++;
            console.log(`✅ ${key}`);
          } catch (error) {
            suiteTests++;
            suiteFailed++;
            console.log(`❌ ${key} - ${error.message}`);
          }
        }
      }
      
      if (!testsFound) {
        console.log(`⚠️  No recognizable test format found in ${testFile.name}`);
        suiteTests = 1;
        suiteFailed = 1;
      }
    }
    
  } catch (error) {
    console.error(`❌ ${testFile.name} failed to execute: ${error.message}`);
    suiteTests = 1;
    suiteFailed = 1;
  }
  
  let duration = Date.now() - startTime;
  console.log(`📊 ${testFile.name} Results: ${suitePassed} passed, ${suiteFailed} failed (${duration}ms)\n`);
  
  // Update totals
  totalTests += suiteTests;
  totalPassed += suitePassed;
  totalFailed += suiteFailed;
  
  suiteResults.push({
    name: testFile.name,
    category: testFile.category,
    passed: suitePassed,
    failed: suiteFailed,
    total: suiteTests,
    duration: duration
  });
}

/**
 * Main test runner execution
 */
function runAllDiscoveredTests() {
  console.log('🔍 DISCOVERING TEST FILES');
  console.log('================================================================================');
  
  // Discover all test files
  const testsDir = path.join(__dirname, '..');
  allTestFiles = discoverTestFiles(testsDir);
  
  console.log(`Found ${allTestFiles.length} test files:`);
  
  // Group by category
  const categories = {};
  allTestFiles.forEach(testFile => {
    if (!categories[testFile.category]) {
      categories[testFile.category] = [];
    }
    categories[testFile.category].push(testFile);
  });
  
  // Display discovered files by category
  Object.keys(categories).forEach(category => {
    console.log(`\n📁 ${category.toUpperCase()} (${categories[category].length} files):`);
    categories[category].forEach(file => {
      console.log(`   • ${file.name}`);
    });
  });
  
  console.log('\n🚀 EXECUTING ALL DISCOVERED TESTS');
  console.log('================================================================================\n');
  
  // Run all discovered tests
  allTestFiles.forEach(testFile => {
    runTestSuite(testFile);
  });
  
  // Final summary
  console.log('🎯 COMPREHENSIVE TEST RESULTS SUMMARY');
  console.log('================================================================================');
  console.log(`📊 OVERALL STATISTICS:`);
  console.log(`   Total Test Files: ${allTestFiles.length}`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   ✅ Passed: ${totalPassed} (${totalTests > 0 ? ((totalPassed/totalTests)*100).toFixed(1) : 0}%)`);
  console.log(`   ❌ Failed: ${totalFailed} (${totalTests > 0 ? ((totalFailed/totalTests)*100).toFixed(1) : 0}%)`);
  
  // Summary by category
  console.log(`\n📋 BREAKDOWN BY CATEGORY:`);
  Object.keys(categories).forEach(category => {
    const categoryResults = suiteResults.filter(r => r.category === category);
    const categoryPassed = categoryResults.reduce((sum, r) => sum + r.passed, 0);
    const categoryFailed = categoryResults.reduce((sum, r) => sum + r.failed, 0);
    const categoryTotal = categoryPassed + categoryFailed;
    
    console.log(`   ${category.toUpperCase()}: ${categoryPassed}/${categoryTotal} passed (${categoryResults.length} files)`);
  });
  
  // Performance summary
  console.log(`\n⏱️  PERFORMANCE SUMMARY:`);
  const totalDuration = suiteResults.reduce((sum, r) => sum + r.duration, 0);
  console.log(`   Total Execution Time: ${totalDuration}ms`);
  console.log(`   Average per File: ${suiteResults.length > 0 ? (totalDuration/suiteResults.length).toFixed(0) : 0}ms`);
  
  // Failed tests detail
  if (totalFailed > 0) {
    console.log(`\n❌ FAILED TEST SUITES:`);
    suiteResults.filter(r => r.failed > 0).forEach(result => {
      console.log(`   • ${result.name}: ${result.failed} failures`);
    });
  }
  
  console.log('\n================================================================================');
  console.log(`Test Discovery and Execution Complete! 🎯`);
  console.log(`Files Discovered: ${allTestFiles.length} | Tests Run: ${totalTests} | Pass Rate: ${totalTests > 0 ? ((totalPassed/totalTests)*100).toFixed(1) : 0}%`);
  
  return {
    totalFiles: allTestFiles.length,
    totalTests: totalTests,
    totalPassed: totalPassed,
    totalFailed: totalFailed,
    suiteResults: suiteResults,
    categories: categories
  };
}

// Export for module usage
module.exports = {
  runAllDiscoveredTests,
  discoverTestFiles,
  runTestSuite
};

// Run if called directly
if (require.main === module) {
  runAllDiscoveredTests();
}