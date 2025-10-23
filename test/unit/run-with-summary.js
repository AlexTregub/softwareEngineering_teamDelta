/**
 * Unit Test Runner with Summary Display
 * 
 * Runs all manager tests using Mocha's programmatic API and displays
 * a formatted summary of test results.
 * 
 * Usage: npm run test:unit
 * 
 * Features:
 * - Displays all test output in real-time with spec reporter
 * - Shows comprehensive summary box with total/passed/failed/pending counts
 * - Returns proper exit codes for CI/CD integration
 */

const Mocha = require('mocha');
const glob = require('glob');
const path = require('path');

// Run all manager tests (comprehensive tests created in this session)
const testFiles = glob.sync('test/unit/managers/*.test.js', {
  cwd: path.join(__dirname, '..', '..')
});

if (testFiles.length === 0) {
  console.error('No test files found!');
  process.exit(1);
}

console.log(`\nFound ${testFiles.length} test files\n`);

// Create a Mocha instance with spec reporter
const mocha = new Mocha({
  reporter: 'spec',
  timeout: 5000,
  slow: 200,
  color: true
});

// Add all test files
testFiles.forEach(file => {
  const absolutePath = path.join(__dirname, '..', '..', file);
  mocha.addFile(absolutePath);
});

// Run tests
const runner = mocha.run((failures) => {
  // Get stats from the runner
  const stats = runner.stats || {};
  
  // Display summary
  console.log('\n' + '='.repeat(60));
  console.log('                  UNIT TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`  Total Tests:    ${stats.tests || 0}`);
  console.log(`  ✅ Passed:       ${stats.passes || 0}`);
  console.log(`  ❌ Failed:       ${stats.failures || 0}`);
  console.log(`  ⏭️  Pending:      ${stats.pending || 0}`);
  console.log(`  ⏱️  Duration:     ${stats.duration || 0}ms`);
  console.log('='.repeat(60));
  
  if (failures > 0) {
    console.log('\n⚠️  Some tests failed!');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }
});
