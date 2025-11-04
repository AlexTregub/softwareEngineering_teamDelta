#!/usr/bin/env node

/**
 * BDD Test Runner for Resource MVC System
 * 
 * Runs Cucumber tests with Selenium WebDriver for browser automation.
 * 
 * Usage:
 *   node test/bdd/run_resource_mvc_tests.js              # Run all scenarios
 *   node test/bdd/run_resource_mvc_tests.js --tags @core # Run only @core scenarios
 *   node test/bdd/run_resource_mvc_tests.js --tags @api  # Run only @api scenarios
 */

const { spawn } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
const tagsIndex = args.findIndex(arg => arg === '--tags');
let tagsValue = null;
if (tagsIndex !== -1 && args[tagsIndex + 1]) {
  tagsValue = args[tagsIndex + 1];
}

// Build cucumber command (use relative paths - no spaces issue)
const cucumberArgs = [
  'cucumber-js',
  'test/bdd/features/resource_mvc.feature',
  '--require', 'test/bdd/steps/resource_mvc_steps.js',
  '--format', 'progress'
];

if (tagsValue) {
  cucumberArgs.push('--tags', tagsValue);
}

console.log('\n🥒 Running BDD Tests for Resource MVC System\n');
console.log('Command:', 'npx', cucumberArgs.join(' '), '\n');

// Run cucumber via npx (cross-platform)
const cucumber = spawn('npx', cucumberArgs, {
  stdio: 'inherit',
  shell: true
});

cucumber.on('error', (error) => {
  console.error('❌ Failed to start Cucumber:', error.message);
  process.exit(1);
});

cucumber.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ All BDD tests passed!\n');
  } else {
    console.log(`\n❌ BDD tests failed with exit code ${code}\n`);
  }
  process.exit(code);
});
