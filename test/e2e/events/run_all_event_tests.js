/**
 * Event System E2E Test Runner
 * 
 * Runs all event system E2E tests and provides summary
 */

const { execSync } = require('child_process');
const path = require('path');

const tests = [
  'pw_event_manager_basic.js',
  'pw_time_triggers.js',
  'pw_flag_triggers.js',
  'pw_json_loading.js'
];

console.log('========================================');
console.log('Event System E2E Test Suite');
console.log('========================================\n');

let totalPassed = 0;
let totalFailed = 0;

for (const test of tests) {
  const testPath = path.join(__dirname, test);
  console.log(`Running: ${test}...`);
  
  try {
    execSync(`node "${testPath}"`, { stdio: 'inherit' });
    console.log(`✓ ${test} PASSED\n`);
    totalPassed++;
  } catch (error) {
    console.log(`✗ ${test} FAILED\n`);
    totalFailed++;
  }
}

console.log('========================================');
console.log('Summary:');
console.log(`  Passed: ${totalPassed}/${tests.length}`);
console.log(`  Failed: ${totalFailed}/${tests.length}`);
console.log('========================================');

process.exit(totalFailed > 0 ? 1 : 0);
