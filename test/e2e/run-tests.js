#!/usr/bin/env node
/**
 * Puppeteer Test Runner
 * Organizes and runs all Puppeteer tests by category
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Test categories and their test files
const TEST_CATEGORIES = {
  camera: [
    'pw_camera_zoom.js',
    'pw_camera_zoom_probe.js',
    'pw_camera_transforms.js'
  ],
  spawn: [
    'pw_ant_spawn_types.js',
    'pw_resource_spawn_types.js'
  ],
  combat: [
    'pw_combat_initiation.js'
  ],
  selection: [
    'pw_selection_deterministic.js',
    'selection-box.test.js'
  ],
  ui: [
    'pw_panel_dragging.js',
    'pw_draggable_panel_growth.js'
  ]
};

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runTest(category, testFile) {
  return new Promise((resolve) => {
    const testPath = path.join(__dirname, category, testFile);
    
    log(`\n${colors.cyan}▶ Running: ${category}/${testFile}${colors.reset}`);
    
    const child = spawn('node', [testPath], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    let killed = false;
    
    // Set a 2-minute timeout per test to prevent hanging
    const timeout = setTimeout(() => {
      if (!killed) {
        log(`${colors.yellow}⚠️  Test timeout (2 min), terminating: ${category}/${testFile}${colors.reset}`);
        killed = true;
        child.kill('SIGTERM');
        // Force kill after 5 seconds
        setTimeout(() => {
          try {
            child.kill('SIGKILL');
          } catch (e) {
            // Already dead
          }
        }, 5000);
      }
    }, 120000); // 2 minutes

    child.on('close', (code) => {
      clearTimeout(timeout);
      if (killed) {
        log(`${colors.red}✗ TIMEOUT: ${category}/${testFile}${colors.reset}`);
        resolve({ category, testFile, passed: false, code: -2, timeout: true });
      } else if (code === 0) {
        log(`${colors.green}✓ PASS: ${category}/${testFile}${colors.reset}`);
        resolve({ category, testFile, passed: true, code });
      } else {
        log(`${colors.red}✗ FAIL: ${category}/${testFile} (exit code: ${code})${colors.reset}`);
        resolve({ category, testFile, passed: false, code });
      }
    });

    child.on('error', (err) => {
      clearTimeout(timeout);
      log(`${colors.red}✗ ERROR: ${category}/${testFile} - ${err.message}${colors.reset}`);
      resolve({ category, testFile, passed: false, error: err.message });
    });
  });
}

async function runCategoryTests(category, tests) {
  log(`\n${colors.bright}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  log(`${colors.bright}${colors.blue}  Category: ${category.toUpperCase()}${colors.reset}`);
  log(`${colors.bright}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  
  const results = [];
  
  for (const testFile of tests) {
    const result = await runTest(category, testFile);
    results.push(result);
  }
  
  return results;
}

async function runAllTests(specificCategory = null) {
  const startTime = Date.now();
  const allResults = [];
  
  log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);
  log(`${colors.bright}${colors.cyan}   PUPPETEER TEST SUITE${colors.reset}`);
  log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);
  
  if (specificCategory) {
    if (TEST_CATEGORIES[specificCategory]) {
      const results = await runCategoryTests(specificCategory, TEST_CATEGORIES[specificCategory]);
      allResults.push(...results);
    } else {
      log(`${colors.red}Error: Unknown category "${specificCategory}"${colors.reset}`);
      log(`Available categories: ${Object.keys(TEST_CATEGORIES).join(', ')}`);
      process.exit(1);
    }
  } else {
    // Run all categories
    for (const [category, tests] of Object.entries(TEST_CATEGORIES)) {
      const results = await runCategoryTests(category, tests);
      allResults.push(...results);
    }
  }
  
  // Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  const passed = allResults.filter(r => r.passed).length;
  const failed = allResults.filter(r => !r.passed).length;
  const total = allResults.length;
  
  log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);
  log(`${colors.bright}${colors.cyan}   TEST SUMMARY${colors.reset}`);
  log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);
  
  if (specificCategory) {
    log(`Category: ${specificCategory}`);
  }
  
  log(`${colors.green}Passed:  ${passed}/${total}${colors.reset}`);
  if (failed > 0) {
    log(`${colors.red}Failed:  ${failed}/${total}${colors.reset}`);
  }
  log(`Duration: ${duration}s`);
  
  if (failed > 0) {
    log(`\n${colors.red}Failed tests:${colors.reset}`);
    allResults.filter(r => !r.passed).forEach(r => {
      log(`  ${colors.red}✗${colors.reset} ${r.category}/${r.testFile}`);
    });
  }
  
  log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════${colors.reset}\n`);
  
  // Exit with error code if any tests failed
  process.exit(failed > 0 ? 1 : 0);
}

// Parse command line arguments
const args = process.argv.slice(2);
const category = args[0];

// Show usage if help requested
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Puppeteer Test Runner

Usage:
  node run-tests.js [category]

Categories:
  camera     - Camera zoom and transform tests
  spawn      - Ant and resource spawning tests  
  combat     - Combat initiation tests
  selection  - Selection box and deterministic tests
  ui         - UI panel dragging and interaction tests

Examples:
  node run-tests.js              # Run all tests
  node run-tests.js camera       # Run only camera tests
  node run-tests.js selection    # Run only selection tests

Available tests by category:
${Object.entries(TEST_CATEGORIES).map(([cat, tests]) => 
  `  ${cat}:\n${tests.map(t => `    - ${t}`).join('\n')}`
).join('\n\n')}
  `);
  process.exit(0);
}

// Run tests
runAllTests(category).catch(err => {
  log(`${colors.red}Fatal error: ${err.message}${colors.reset}`, colors.red);
  console.error(err);
  process.exit(1);
});
