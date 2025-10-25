#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 * Executes all test suites in order: Unit → Integration → BDD → E2E
 */

const { exec } = require('child_process');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Test suite configuration
const testSuites = [
  {
    name: 'Unit Tests',
    command: 'npx mocha "test/unit/**/*.test.js" --reporter spec',
    color: colors.cyan,
    description: 'Running Mocha unit tests for all modules...'
  },
  {
    name: 'Integration Tests',
    command: 'npx mocha "test/integration/**/*.test.js" --reporter spec',
    color: colors.blue,
    description: 'Running integration tests...',
    optional: true // Skip if no integration tests exist
  },
  {
    name: 'BDD Tests',
    command: 'python test/bdd/run_bdd_tests.py',
    color: colors.magenta,
    description: 'Running BDD/Behave tests...'
  },
  {
    name: 'E2E Tests',
    command: 'node test/e2e/run-tests.js',
    color: colors.yellow,
    description: 'Running Puppeteer E2E tests...'
  }
];

// Test results tracking
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  suites: []
};

// Current suite index
let currentSuiteIndex = 0;
const startTime = Date.now();

/**
 * Print section header
 */
function printHeader(text, color = colors.bright) {
  const line = '='.repeat(80);
  console.log(`\n${color}${line}${colors.reset}`);
  console.log(`${color}${text}${colors.reset}`);
  console.log(`${color}${line}${colors.reset}\n`);
}

/**
 * Print section footer
 */
function printFooter() {
  const line = '-'.repeat(80);
  console.log(`\n${colors.bright}${line}${colors.reset}\n`);
}

/**
 * Execute a test suite
 */
function runTestSuite(suite) {
  return new Promise((resolve) => {
    printHeader(suite.name, suite.color);
    console.log(`${colors.bright}${suite.description}${colors.reset}\n`);

    const startTime = Date.now();
    const childProcess = exec(suite.command, { 
      cwd: path.resolve(__dirname, '..'),
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large output
    });

    let stdout = '';
    let stderr = '';

    childProcess.stdout.on('data', (data) => {
      stdout += data;
      process.stdout.write(data);
    });

    childProcess.stderr.on('data', (data) => {
      stderr += data;
      process.stderr.write(data);
    });

    childProcess.on('close', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      const passed = code === 0;

      const suiteResult = {
        name: suite.name,
        passed,
        code,
        duration,
        output: stdout + stderr
      };

      results.suites.push(suiteResult);
      results.total++;

      if (passed) {
        results.passed++;
        console.log(`\n${colors.green}${colors.bright}✓ ${suite.name} PASSED${colors.reset} (${duration}s)`);
      } else if (suite.optional && code !== 0) {
        results.skipped++;
        console.log(`\n${colors.yellow}${colors.bright}⊘ ${suite.name} SKIPPED${colors.reset} (${duration}s)`);
      } else {
        results.failed++;
        console.log(`\n${colors.red}${colors.bright}✗ ${suite.name} FAILED${colors.reset} (${duration}s)`);
      }

      printFooter();
      resolve(suiteResult);
    });

    childProcess.on('error', (error) => {
      console.error(`\n${colors.red}Error executing ${suite.name}:${colors.reset}`, error);
      
      const suiteResult = {
        name: suite.name,
        passed: false,
        code: -1,
        duration: 0,
        error: error.message
      };

      results.suites.push(suiteResult);
      results.total++;
      
      if (suite.optional) {
        results.skipped++;
      } else {
        results.failed++;
      }

      resolve(suiteResult);
    });
  });
}

/**
 * Run all test suites sequentially
 */
async function runAllTests() {
  printHeader('COMPREHENSIVE TEST RUNNER', colors.bright + colors.green);
  console.log(`${colors.bright}Running all test suites in sequence...${colors.reset}\n`);
  console.log(`${colors.cyan}Test Order: Unit → Integration → BDD → E2E${colors.reset}\n`);

  for (const suite of testSuites) {
    await runTestSuite(suite);
  }

  printTestSummary();
}

/**
 * Print final test summary
 */
function printTestSummary() {
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  printHeader('TEST SUMMARY', colors.bright + colors.cyan);

  console.log(`${colors.bright}Total Test Suites:${colors.reset} ${results.total}`);
  console.log(`${colors.green}${colors.bright}Passed:${colors.reset} ${results.passed}`);
  console.log(`${colors.red}${colors.bright}Failed:${colors.reset} ${results.failed}`);
  console.log(`${colors.yellow}${colors.bright}Skipped:${colors.reset} ${results.skipped}`);
  console.log(`${colors.bright}Total Duration:${colors.reset} ${totalDuration}s\n`);

  // Individual suite results
  console.log(`${colors.bright}Suite Details:${colors.reset}`);
  results.suites.forEach((suite, index) => {
    const icon = suite.passed ? '✓' : (suite.code === -1 ? '⊘' : '✗');
    const color = suite.passed ? colors.green : (suite.code === -1 ? colors.yellow : colors.red);
    console.log(`  ${color}${icon} ${suite.name}${colors.reset} - ${suite.duration}s`);
  });

  printFooter();

  // Overall result
  if (results.failed === 0) {
    console.log(`${colors.green}${colors.bright}🎉 ALL TESTS PASSED!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}${colors.bright}❌ SOME TESTS FAILED${colors.reset}\n`);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log(`\n\n${colors.yellow}Test run interrupted by user${colors.reset}`);
  printTestSummary();
});

// Run all tests
runAllTests().catch((error) => {
  console.error(`\n${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
