/**
 * BASELINE E2E TEST RUNNER
 * 
 * Purpose: Run all E2E baseline tests in sequence
 * Run with: node test/baseline/e2e/run_all_baseline_e2e.js
 * 
 * This will:
 * 1. Run panel dimensions test
 * 2. Run panel interactions test
 * 3. Run screenshot capture test
 * 4. Generate comprehensive report
 * 
 * NOTE: Requires HTTP server running on port 8000
 * Start with: python -m http.server 8000
 */

const fs = require('fs');
const path = require('path');

// Import test modules
const runDimensionsTest = require('./panel_dimensions.baseline');
const runInteractionsTest = require('./panel_interactions.baseline');
const runScreenshotsTest = require('./panel_screenshots.baseline');

async function runAllBaselineTests() {
  console.log('\n' + '='.repeat(80));
  console.log('🎯 BASELINE E2E TEST SUITE');
  console.log('='.repeat(80));
  console.log('\nPurpose: Capture current panel behavior BEFORE auto-sizing feature');
  console.log('Expected: All tests pass, all panels stable, no growth detected\n');
  console.log('='.repeat(80) + '\n');

  const startTime = Date.now();
  const results = {
    timestamp: new Date().toISOString(),
    duration: 0,
    tests: [],
    summary: {
      total: 3,
      passed: 0,
      failed: 0,
      errors: []
    }
  };

  try {
    // Test 1: Panel Dimensions
    console.log('📏 TEST 1/3: Panel Dimensions');
    console.log('─'.repeat(80) + '\n');
    
    try {
      await runDimensionsTest();
      results.tests.push({
        name: 'panel_dimensions',
        status: 'PASSED',
        duration: 0
      });
      results.summary.passed++;
      console.log('\n✅ Panel Dimensions Test: PASSED\n');
    } catch (error) {
      results.tests.push({
        name: 'panel_dimensions',
        status: 'FAILED',
        error: error.message
      });
      results.summary.failed++;
      results.summary.errors.push({
        test: 'panel_dimensions',
        error: error.message
      });
      console.error('\n❌ Panel Dimensions Test: FAILED');
      console.error('Error:', error.message, '\n');
    }

    console.log('='.repeat(80) + '\n');

    // Test 2: Panel Interactions
    console.log('🖱️  TEST 2/3: Panel Interactions');
    console.log('─'.repeat(80) + '\n');
    
    try {
      await runInteractionsTest();
      results.tests.push({
        name: 'panel_interactions',
        status: 'PASSED',
        duration: 0
      });
      results.summary.passed++;
      console.log('\n✅ Panel Interactions Test: PASSED\n');
    } catch (error) {
      results.tests.push({
        name: 'panel_interactions',
        status: 'FAILED',
        error: error.message
      });
      results.summary.failed++;
      results.summary.errors.push({
        test: 'panel_interactions',
        error: error.message
      });
      console.error('\n❌ Panel Interactions Test: FAILED');
      console.error('Error:', error.message, '\n');
    }

    console.log('='.repeat(80) + '\n');

    // Test 3: Screenshots
    console.log('📷 TEST 3/3: Visual Screenshots');
    console.log('─'.repeat(80) + '\n');
    
    try {
      await runScreenshotsTest();
      results.tests.push({
        name: 'panel_screenshots',
        status: 'PASSED',
        duration: 0
      });
      results.summary.passed++;
      console.log('\n✅ Screenshot Capture Test: PASSED\n');
    } catch (error) {
      results.tests.push({
        name: 'panel_screenshots',
        status: 'FAILED',
        error: error.message
      });
      results.summary.failed++;
      results.summary.errors.push({
        test: 'panel_screenshots',
        error: error.message
      });
      console.error('\n❌ Screenshot Capture Test: FAILED');
      console.error('Error:', error.message, '\n');
    }

    console.log('='.repeat(80) + '\n');

    // Calculate duration
    results.duration = Math.round((Date.now() - startTime) / 1000);

    // Generate summary report
    console.log('\n📊 BASELINE TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`\nTimestamp: ${results.timestamp}`);
    console.log(`Duration: ${results.duration}s`);
    console.log(`\nResults:`);
    console.log(`  Total Tests: ${results.summary.total}`);
    console.log(`  Passed: ${results.summary.passed} ✅`);
    console.log(`  Failed: ${results.summary.failed} ❌`);

    if (results.summary.errors.length > 0) {
      console.log(`\n⚠️  Errors Encountered:`);
      results.summary.errors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.test}: ${err.error}`);
      });
    }

    console.log('\n' + '='.repeat(80));

    // Save results
    const resultsPath = path.join(__dirname, 'baseline_e2e_results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Results saved to: ${resultsPath}`);

    // Check baseline_results.json exists
    const dimensionsResultsPath = path.join(__dirname, 'baseline_results.json');
    if (fs.existsSync(dimensionsResultsPath)) {
      console.log(`✅ Baseline dimensions data: ${dimensionsResultsPath}`);
    }

    // Check screenshots exist
    const screenshotsPath = path.join(__dirname, 'screenshots', 'baseline');
    if (fs.existsSync(screenshotsPath)) {
      const screenshots = fs.readdirSync(screenshotsPath);
      console.log(`✅ Baseline screenshots: ${screenshots.length} files in ${screenshotsPath}`);
    }

    console.log('\n💡 Next Steps:');
    console.log('  1. Review baseline_results.json for panel dimensions');
    console.log('  2. Review screenshots/baseline/ for visual verification');
    console.log('  3. Proceed with auto-sizing feature implementation');
    console.log('  4. Re-run this test suite after implementation');
    console.log('  5. Compare results - expect NO CHANGES (opt-in feature)\n');

    if (results.summary.failed > 0) {
      console.error('❌ Some baseline tests failed. Please review errors above.\n');
      process.exit(1);
    } else {
      console.log('✨ All baseline tests passed! Safe to proceed with implementation.\n');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ Fatal error during baseline test suite:');
    console.error(error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  console.log('\n⚠️  IMPORTANT: Make sure HTTP server is running on port 8000');
  console.log('   Start with: python -m http.server 8000\n');
  
  setTimeout(() => {
    runAllBaselineTests();
  }, 2000); // Give user time to read message
}

module.exports = runAllBaselineTests;
