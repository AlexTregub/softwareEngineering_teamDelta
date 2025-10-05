#!/usr/bin/env node

/**
 * Highlighting Debug Test Runner
 * Executes comprehensive BDD tests to identify highlighting issues
 */

const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 HIGHLIGHTING SYSTEM DEBUG TEST RUNNER');
console.log('=========================================\n');

// Check if required dependencies are installed
const requiredPackages = ['selenium-webdriver', 'chai'];
console.log('📦 Checking dependencies...');

for (const pkg of requiredPackages) {
  try {
    require.resolve(pkg);
    console.log(`✅ ${pkg} - installed`);
  } catch (error) {
    console.log(`❌ ${pkg} - missing`);
    console.log(`   Installing ${pkg}...`);
    try {
      execSync(`npm install ${pkg}`, { stdio: 'inherit' });
      console.log(`✅ ${pkg} - installed successfully`);
    } catch (installError) {
      console.error(`💥 Failed to install ${pkg}:`, installError.message);
      process.exit(1);
    }
  }
}

console.log('\n🚀 Starting highlighting debug tests...\n');

// Run the tests
const HighlightingDebugTests = require('./selenium/HighlightingDebugTests');
const tester = new HighlightingDebugTests();

tester.runAllTests()
  .then((report) => {
    console.log('\n🎯 HIGHLIGHTING DEBUG COMPLETE');
    console.log('==============================');
    
    if (report && report.summary.failed === 0) {
      console.log('🎉 All tests passed! Highlighting system appears to be working correctly.');
    } else {
      console.log('🔧 Issues found! Check the detailed report for debugging information.');
      
      // Print key findings
      if (report && report.testResults) {
        const failedTests = report.testResults.filter(t => t.status === 'FAIL');
        if (failedTests.length > 0) {
          console.log('\n🚨 KEY ISSUES IDENTIFIED:');
          failedTests.forEach((test, index) => {
            console.log(`${index + 1}. ${test.test}`);
            if (test.error) console.log(`   Error: ${test.error}`);
            if (test.details && test.details.error) console.log(`   Details: ${test.details.error}`);
          });
        }
      }
    }
    
    console.log('\n📁 Check the following locations for detailed results:');
    console.log('   • test/reports/ - JSON reports');
    console.log('   • test/screenshots/ - Visual evidence');
    
  })
  .catch((error) => {
    console.error('\n💥 Test execution failed:');
    console.error(error.message);
    console.error('\n🔧 Troubleshooting tips:');
    console.error('   • Ensure Chrome browser is installed');
    console.error('   • Check that the game loads correctly in browser');
    console.error('   • Verify all JavaScript files are properly loaded');
    process.exit(1);
  });