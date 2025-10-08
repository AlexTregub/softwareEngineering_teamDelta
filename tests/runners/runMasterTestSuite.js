/**
 * Master Test Suite Runner
 * Runs all test categories and provides comprehensive reporting
 * Combines Job System, Unit, Integration, and BDD tests
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 MASTER TEST SUITE - ANT GAME PROJECT');
console.log('================================================================================');
console.log('Running complete test suite: Job System → Unit → Integration → BDD');
console.log('This comprehensive test run will take several minutes...\n');

// Test results tracking
const testResults = {
  jobs: { passed: 0, total: 0, duration: 0 },
  unit: { passed: 0, total: 0, duration: 0 },
  integration: { passed: 0, total: 0, duration: 0 },
  bdd: { passed: 0, total: 0, duration: 0 }
};

/**
 * Run a command and capture results
 */
function runCommand(command, args, testType) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    console.log(`🔄 Starting ${testType.toUpperCase()} tests...`);
    console.log(`Command: ${command} ${args.join(' ')}\n`);
    
    const child = spawn(command, args, {
      cwd: process.cwd(),
      stdio: 'pipe',
      shell: true
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      process.stdout.write(output);
    });
    
    child.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      process.stderr.write(output);
    });
    
    child.on('close', (code) => {
      const duration = Date.now() - startTime;
      testResults[testType].duration = duration;
      
      // Parse results from output
      const passedMatches = stdout.match(/✅ Passed: (\\d+)/);
      const totalMatches = stdout.match(/Total Tests?: (\\d+)/) || stdout.match(/Total: (\\d+)/);
      
      if (passedMatches) testResults[testType].passed = parseInt(passedMatches[1]);
      if (totalMatches) testResults[testType].total = parseInt(totalMatches[1]);
      
      console.log(`\\n⏱️  ${testType.toUpperCase()} tests completed in ${Math.round(duration/1000)}s\\n`);
      
      if (code === 0) {
        resolve({ success: true, code, stdout, stderr });
      } else {
        resolve({ success: false, code, stdout, stderr });
      }
    });
    
    child.on('error', (error) => {
      reject({ success: false, error: error.message });
    });
  });
}

/**
 * Main test execution
 */
async function runMasterTestSuite() {
  const startTime = Date.now();
  let allResults = [];
  
  try {
    // 1. Job System Tests
    console.log('🎯 PHASE 1: JOB SYSTEM TESTS');
    console.log('================================================================================');
    const jobsResult = await runCommand('node', ['test/runAllJobTests.js'], 'jobs');
    allResults.push({ name: 'Job System', ...jobsResult });
    
    // 2. Unit Tests
    console.log('🧪 PHASE 2: UNIT TESTS');
    console.log('================================================================================');
    const unitResult = await runCommand('node', ['test/runAllUnitTests.js'], 'unit');
    allResults.push({ name: 'Unit Tests', ...unitResult });
    
    // 3. Integration Tests
    console.log('🔗 PHASE 3: INTEGRATION TESTS');
    console.log('================================================================================');
    try {
      const integrationResult1 = await runCommand('node', ['test/integration/jobSystemIntegration.test.js'], 'integration');
      const integrationResult2 = await runCommand('node', ['test/integration/gameplayIntegration.test.js'], 'integration');
      allResults.push({ name: 'Integration Tests', success: integrationResult1.success && integrationResult2.success });
    } catch (error) {
      console.log('⚠️  Integration tests encountered issues, continuing...');
      allResults.push({ name: 'Integration Tests', success: false });
    }
    
    // 4. BDD Tests
    console.log('🎭 PHASE 4: BDD TESTS (Behavior-Driven Development)');
    console.log('================================================================================');
    try {
      const bddResult = await runCommand('python', ['test/bdd_new/run_bdd_tests.py'], 'bdd');
      allResults.push({ name: 'BDD Tests', ...bddResult });
    } catch (error) {
      console.log('⚠️  BDD tests encountered issues (may require Python setup), continuing...');
      allResults.push({ name: 'BDD Tests', success: false });
    }
    
  } catch (error) {
    console.error('❌ Fatal error in master test suite:', error);
  }
  
  // Generate comprehensive report
  const totalDuration = Date.now() - startTime;
  printMasterSummary(allResults, totalDuration);
}

/**
 * Print comprehensive test summary
 */
function printMasterSummary(results, totalDuration) {
  console.log('\\n🏆 MASTER TEST SUITE RESULTS');
  console.log('================================================================================');
  
  const totalTests = Object.values(testResults).reduce((sum, result) => sum + result.total, 0);
  const totalPassed = Object.values(testResults).reduce((sum, result) => sum + result.passed, 0);
  const totalFailed = totalTests - totalPassed;
  const overallPassRate = totalTests > 0 ? Math.round((totalPassed/totalTests)*100) : 0;
  
  console.log(`📊 COMPREHENSIVE STATISTICS:`);
  console.log(`   🔢 Total Tests Executed: ${totalTests}`);
  console.log(`   ✅ Total Passed: ${totalPassed} (${overallPassRate}%)`);
  console.log(`   ❌ Total Failed: ${totalFailed} (${Math.round((totalFailed/totalTests)*100)}%)`);
  console.log(`   ⏱️  Total Duration: ${Math.round(totalDuration/1000)}s (${Math.round(totalDuration/60000)}m)`);
  
  console.log('\\n📋 BREAKDOWN BY TEST CATEGORY:');
  Object.entries(testResults).forEach(([category, result]) => {
    const passRate = result.total > 0 ? Math.round((result.passed/result.total)*100) : 0;
    const status = result.passed === result.total ? '✅' : result.passed > 0 ? '🟡' : '❌';
    const duration = Math.round(result.duration/1000);
    console.log(`   ${status} ${category.toUpperCase()}: ${result.passed}/${result.total} passed (${passRate}%) - ${duration}s`);
  });
  
  console.log('\\n🎯 SYSTEM HEALTH ASSESSMENT:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`   ${status} ${result.name}: ${result.success ? 'PASSED' : 'NEEDS ATTENTION'}`);
  });
  
  console.log('\\n🏆 OVERALL PROJECT QUALITY:');
  if (overallPassRate >= 95) {
    console.log('🏆 EXCEPTIONAL: Project has outstanding test coverage and quality!');
  } else if (overallPassRate >= 85) {
    console.log('✅ EXCELLENT: Strong project foundation with comprehensive testing');
  } else if (overallPassRate >= 75) {
    console.log('🟡 GOOD: Solid project base, some areas need enhancement');
  } else if (overallPassRate >= 60) {
    console.log('⚠️  FAIR: Project needs focused testing improvements');
  } else {
    console.log('❌ NEEDS WORK: Critical testing gaps require immediate attention');
  }
  
  console.log('\\n📈 NEXT STEPS RECOMMENDATIONS:');
  const failedCategories = Object.entries(testResults).filter(([_, result]) => result.passed < result.total);
  if (failedCategories.length === 0) {
    console.log('🎉 All test categories passing! Focus on adding new features and tests.');
  } else {
    console.log('🔧 Priority areas for improvement:');
    failedCategories.forEach(([category, result]) => {
      const failedCount = result.total - result.passed;
      console.log(`   • ${category.toUpperCase()}: ${failedCount} failing tests need attention`);
    });
  }
  
  console.log('\\n================================================================================');
  console.log('🚀 Master Test Suite Complete!');
  console.log(`📊 Final Score: ${overallPassRate}% (${totalPassed}/${totalTests} tests passing)`);
  console.log('================================================================================');
}

// Execute master test suite
console.log('🚀 Initializing comprehensive test execution...');
runMasterTestSuite().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});