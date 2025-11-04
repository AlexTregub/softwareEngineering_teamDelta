#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 * Executes all test suites in order: Unit → Integration → BDD → E2E
 */

const { exec, spawn } = require('child_process');
const path = require('path');

// HTTP server process
let httpServer = null;

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
    name: 'Linting (ESLint)',
    command: 'npx eslint test/',
    color: colors.yellow,
    description: 'Running ESLint to enforce test helper usage and code quality...'
  },
  {
    name: 'Unit Tests',
    command: 'npx mocha "test/unit/**/*.test.js" --reporter spec',
    color: colors.cyan,
    description: 'Running Mocha unit tests for all modules...'
  },
  {
    name: 'Integration Tests',
    command: 'npx mocha "test/integration/**/*.test.js" --reporter spec --timeout 10000 --exit',
    color: colors.blue,
    description: 'Running integration tests...',
    requiresServer: false
  },
  {
    name: 'BDD Tests (Resource MVC)',
    command: 'node test/bdd/run_resource_mvc_tests.js',
    color: colors.magenta,
    description: 'Running Cucumber/Selenium BDD tests for Resource MVC...',
    requiresServer: true
  },
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
 * Start HTTP server for BDD/E2E tests
 */
function startHttpServer() {
  return new Promise((resolve, reject) => {
    console.log(`${colors.cyan}${colors.bright}Starting HTTP server on port 8000...${colors.reset}`);
    
    // Use Python's http.server module
    httpServer = spawn('python', ['-m', 'http.server', '8000'], {
      cwd: path.resolve(__dirname, '..'),
      stdio: ['ignore', 'pipe', 'pipe']
    });

    // Wait for server to be ready
    const checkServer = setInterval(() => {
      const http = require('http');
      const options = {
        hostname: 'localhost',
        port: 8000,
        path: '/',
        method: 'GET',
        timeout: 1000
      };

      const req = http.request(options, (res) => {
        if (res.statusCode === 200) {
          clearInterval(checkServer);
          console.log(`${colors.green}${colors.bright}✓ HTTP server started successfully${colors.reset}\n`);
          resolve();
        }
      });

      req.on('error', () => {
        // Server not ready yet, keep checking
      });

      req.end();
    }, 500);

    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkServer);
      reject(new Error('HTTP server failed to start within 10 seconds'));
    }, 10000);

    httpServer.on('error', (error) => {
      clearInterval(checkServer);
      reject(error);
    });
  });
}

/**
 * Stop HTTP server
 */
function stopHttpServer() {
  if (httpServer) {
    console.log(`\n${colors.cyan}${colors.bright}Stopping HTTP server...${colors.reset}`);
    httpServer.kill();
    httpServer = null;
    console.log(`${colors.green}${colors.bright}✓ HTTP server stopped${colors.reset}`);
  }
}

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
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large output
      timeout: 300000 // 5 minute timeout for the entire command
    });

    let stdout = '';
    let stderr = '';
    let killed = false;

    childProcess.stdout.on('data', (data) => {
      stdout += data;
      process.stdout.write(data);
    });

    childProcess.stderr.on('data', (data) => {
      stderr += data;
      process.stderr.write(data);
    });

    // Set a watchdog timer to kill hung processes
    const watchdog = setTimeout(() => {
      if (!killed) {
        console.log(`\n${colors.yellow}⚠️  Test suite exceeded 5 minute timeout, terminating...${colors.reset}`);
        killed = true;
        childProcess.kill('SIGTERM');
        // Force kill after 5 seconds if still alive
        setTimeout(() => {
          try {
            childProcess.kill('SIGKILL');
          } catch (e) {
            // Process already dead
          }
        }, 5000);
      }
    }, 300000); // 5 minutes

    childProcess.on('close', (code) => {
      clearTimeout(watchdog);
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      const passed = code === 0 && !killed;

      const suiteResult = {
        name: suite.name,
        passed,
        code: killed ? -2 : code,
        duration,
        output: stdout + stderr,
        killed
      };

      results.suites.push(suiteResult);
      results.total++;

      if (passed) {
        results.passed++;
        console.log(`\n${colors.green}${colors.bright}✓ ${suite.name} PASSED${colors.reset} (${duration}s)`);
      } else if (killed) {
        results.failed++;
        console.log(`\n${colors.red}${colors.bright}✗ ${suite.name} TIMEOUT${colors.reset} (exceeded 5 minutes)`);
      } else {
        results.failed++;
        console.log(`\n${colors.red}${colors.bright}✗ ${suite.name} FAILED${colors.reset} (${duration}s)`);
      }

      printFooter();
      resolve(suiteResult);
    });

    childProcess.on('error', (error) => {
      clearTimeout(watchdog);
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
      results.failed++;

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
  console.log(`${colors.cyan}Test Order: Linting → Unit → Integration → BDD${colors.reset}\n`);

  let serverStarted = false;

  for (const suite of testSuites) {
    // Start server if needed and not already started
    if (suite.requiresServer && !serverStarted) {
      try {
        await startHttpServer();
        serverStarted = true;
      } catch (error) {
        console.error(`${colors.red}Failed to start HTTP server:${colors.reset}`, error.message);
        console.log(`${colors.yellow}Skipping tests that require HTTP server${colors.reset}\n`);
        // Skip remaining tests that require server
        const remainingSuites = testSuites.slice(testSuites.indexOf(suite));
        remainingSuites.forEach(s => {
          if (s.requiresServer) {
            results.total++;
            results.skipped++;
            results.suites.push({
              name: s.name,
              passed: false,
              code: -1,
              duration: 0,
              error: 'HTTP server not available'
            });
          }
        });
        break;
      }
    }

    await runTestSuite(suite);
  }

  // Stop server if it was started
  if (serverStarted) {
    stopHttpServer();
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
  stopHttpServer();
  printTestSummary();
});

process.on('exit', () => {
  stopHttpServer();
});

// Run all tests
runAllTests().catch((error) => {
  console.error(`\n${colors.red}Fatal error:${colors.reset}`, error);
  stopHttpServer();
  process.exit(1);
});
