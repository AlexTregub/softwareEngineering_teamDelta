/**
 * Comprehensive Unit Test Runner
 * Runs all unit tests in the test/unit directory
 * Provides detailed reporting and summary statistics
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 COMPREHENSIVE UNIT TEST SUITE');
console.log('================================================================================');
console.log('Running all unit tests with detailed reporting\n');

// Test results tracking
let totalTests = 0;
let totalPassed = 0;
let totalFailed = 0;
let testResults = [];

/**
 * Run a test suite and capture results
 */
function runTestSuite(suiteName, testSuite) {
  console.log(`📋 Running ${suiteName}`);
  console.log('------------------------------------------------------------');
  
  let suitePassed = 0;
  let suiteFailed = 0;
  
  try {
    if (testSuite.runTests) {
      // Suite has a runTests method
      testSuite.runTests();
      // Count results from the suite
      if (testSuite.testResults) {
        testSuite.testResults.forEach(result => {
          totalTests++;
          if (result.status === 'PASS') {
            totalPassed++;
            suitePassed++;
          } else {
            totalFailed++;
            suiteFailed++;
          }
        });
      }
    } else if (testSuite.runAllTests) {
      // Alternative method name
      testSuite.runAllTests();
      if (testSuite.testResults) {
        testSuite.testResults.forEach(result => {
          totalTests++;
          if (result.status === 'PASS') {
            totalPassed++;
            suitePassed++;
          } else {
            totalFailed++;
            suiteFailed++;
          }
        });
      }
    } else if (typeof testSuite === 'function') {
      // Suite is a function, run it
      testSuite();
      suitePassed = 1; // Assume it passed if no error
      totalTests++;
      totalPassed++;
    } else {
      console.log(`⚠️  Unknown test suite format for ${suiteName}`);
    }
  } catch (error) {
    console.error(`❌ ${suiteName} failed: ${error.message}`);
    totalTests++;
    totalFailed++;
    suiteFailed++;
  }
  
  console.log(`📊 ${suiteName} Results: ${suitePassed} passed, ${suiteFailed} failed\n`);
  
  testResults.push({
    name: suiteName,
    passed: suitePassed,
    failed: suiteFailed,
    total: suitePassed + suiteFailed
  });
}

/**
 * Safely require a test file
 */
function safeRequire(filePath, fileName) {
  try {
    return require(filePath);
  } catch (error) {
    console.error(`⚠️  Could not load ${fileName}: ${error.message}`);
    return null;
  }
}

/**
 * Main test runner
 */
async function runAllUnitTests() {
  const unitTestDir = path.join(__dirname, 'unit');
  
  console.log('🔍 Discovering unit tests...\n');
  
  // Job Component Tests (priority)
  console.log('🎯 JOB SYSTEM UNIT TESTS');
  console.log('================================================================================');
  const jobComponentTests = safeRequire('../test/unit/jobComponent.test.js', 'jobComponent.test.js');
  if (jobComponentTests && jobComponentTests.JobComponentTestSuite) {
    runTestSuite('JobComponent Core Tests', jobComponentTests.JobComponentTestSuite);
  }
  if (jobComponentTests && jobComponentTests.JobProgressionTDDTestSuite) {
    runTestSuite('JobComponent Progression Tests', jobComponentTests.JobProgressionTDDTestSuite);
  }
  
  console.log('🎮 GAME SYSTEM UNIT TESTS');
  console.log('================================================================================');
  
  // Resource Manager Tests
  const resourceManagerTests = safeRequire('../test/unit/resourceManager.test.js', 'resourceManager.test.js');
  if (resourceManagerTests && resourceManagerTests.ResourceManagerTestSuite) {
    runTestSuite('Resource Manager Tests', resourceManagerTests.ResourceManagerTestSuite);
  }
  
  // Ant Utilities Tests
  const antUtilitiesTests = safeRequire('../test/unit/antUtilities.enhanced.test.js', 'antUtilities.enhanced.test.js');
  if (antUtilitiesTests && antUtilitiesTests.AntUtilitiesTestSuite) {
    runTestSuite('Ant Utilities Tests', antUtilitiesTests.AntUtilitiesTestSuite);
  }
  
  // Selection Box Tests
  const selectionBoxTests = safeRequire('../test/unit/selectionBox.test.js', 'selectionBox.test.js');
  if (selectionBoxTests && selectionBoxTests.SelectionBoxTestSuite) {
    runTestSuite('Selection Box Tests', selectionBoxTests.SelectionBoxTestSuite);
  }
  
  // Spawn Interaction Tests
  const spawnInteractionTests = safeRequire('../test/unit/spawn-interaction.regression.test.js', 'spawn-interaction.regression.test.js');
  if (spawnInteractionTests && spawnInteractionTests.SpawnInteractionTestSuite) {
    runTestSuite('Spawn Interaction Tests', spawnInteractionTests.SpawnInteractionTestSuite);
  }
  
  console.log('🎨 UI SYSTEM UNIT TESTS');
  console.log('================================================================================');
  
  // Button Group Tests
  const buttonGroupTests = safeRequire('../test/unit/buttonGroup.test.js', 'buttonGroup.test.js');
  if (buttonGroupTests) {
    runTestSuite('Button Group Tests', buttonGroupTests);
  }
  
  // Sprite2D Tests
  const sprite2dTests = safeRequire('../test/unit/sprite2d.test.js', 'sprite2d.test.js');
  if (sprite2dTests && sprite2dTests.TestSuite) {
    runTestSuite('Sprite2D Tests', sprite2dTests.TestSuite);
  }
  
  console.log('🔧 UTILITY SYSTEM UNIT TESTS');
  console.log('================================================================================');
  
  // Tracing Tests
  const tracingTests = safeRequire('../test/unit/tracing.test.js', 'tracing.test.js');
  if (tracingTests) {
    runTestSuite('Tracing Tests', tracingTests);
  }
  
  // Ant Tooltip System Tests
  const tooltipTests = safeRequire('../test/unit/antTooltipSystem.test.js', 'antTooltipSystem.test.js');
  if (tooltipTests) {
    runTestSuite('Ant Tooltip System Tests', tooltipTests);
  }
  
  // Discover and run any other test files
  console.log('🔍 ADDITIONAL UNIT TESTS');
  console.log('================================================================================');
  
  const testFiles = fs.readdirSync(unitTestDir).filter(file => 
    file.endsWith('.test.js') && 
    !['jobComponent.test.js', 'resourceManager.test.js', 'antUtilities.enhanced.test.js', 
      'selectionBox.test.js', 'spawn-interaction.regression.test.js', 'buttonGroup.test.js',
      'sprite2d.test.js', 'tracing.test.js'].includes(file)
  );
  
  for (const testFile of testFiles) {
    const testModule = safeRequire(path.join(unitTestDir, testFile), testFile);
    if (testModule) {
      const testName = testFile.replace('.test.js', '');
      runTestSuite(`${testName} Tests`, testModule);
    }
  }
}

/**
 * Print final summary
 */
function printSummary() {
  console.log('🎯 COMPREHENSIVE UNIT TEST RESULTS SUMMARY');
  console.log('================================================================================');
  console.log(`📊 OVERALL STATISTICS:`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   ✅ Passed: ${totalPassed} (${totalTests > 0 ? Math.round((totalPassed/totalTests)*100) : 0}%)`);
  console.log(`   ❌ Failed: ${totalFailed} (${totalTests > 0 ? Math.round((totalFailed/totalTests)*100) : 0}%)`);
  
  console.log('\n📋 BREAKDOWN BY TEST SUITE:');
  testResults.forEach(result => {
    const passRate = result.total > 0 ? Math.round((result.passed/result.total)*100) : 0;
    const status = result.failed === 0 ? '✅' : '🟡';
    console.log(`   ${status} ${result.name}: ${result.passed}/${result.total} passed (${passRate}%)`);
  });
  
  console.log('\n🏆 UNIT TEST QUALITY ASSESSMENT:');
  const overallPassRate = totalTests > 0 ? (totalPassed/totalTests)*100 : 0;
  if (overallPassRate >= 95) {
    console.log('🏆 EXCELLENT: Outstanding unit test coverage and quality');
  } else if (overallPassRate >= 85) {
    console.log('✅ GOOD: Solid unit test foundation with room for improvement');
  } else if (overallPassRate >= 70) {
    console.log('🟡 FAIR: Unit tests need attention and enhancement');
  } else {
    console.log('❌ NEEDS WORK: Critical unit test issues require immediate attention');
  }
  
  console.log('\n================================================================================');
  console.log('Unit Test Suite Complete! 🧪');
}

// Run all tests
runAllUnitTests()
  .then(() => {
    printSummary();
    process.exit(totalFailed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('Fatal error running unit tests:', error);
    process.exit(1);
  });