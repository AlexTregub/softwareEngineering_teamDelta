#!/usr/bin/env node

/**
 * Comprehensive Test Runner with Summary Reporting
 * Organizes and executes all test suites with detailed reporting
 */

const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
    this.colors = {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      white: '\x1b[37m',
      gray: '\x1b[90m'
    };
  }

  // Color output helpers
  colorize(text, color) {
    return `${this.colors[color]}${text}${this.colors.reset}`;
  }

  log(message, color = 'white') {
    console.log(this.colorize(message, color));
  }

  // Test suite definitions organized by category
  getTestSuites() {
    return {
      unit: [
        {
          name: 'Ant Class',
          file: 'ant.test.js',
          description: 'Tests core ant class functionality'
        },
        {
          name: 'Ant State Machine',
          file: 'AntStateMachine.test.js',
          description: 'Tests ant behavior state management'
        },
        {
          name: 'Sprite2D',
          file: 'sprite2d.test.js',
          description: 'Tests 2D sprite rendering system'
        },
        {
          name: 'Vector Types',
          file: 'vectorTypeTests.test.js',
          description: 'Tests vector mathematics and types'
        }
      ],
      integration: [
        {
          name: 'Selection Box',
          file: 'selectionBox.node.test.js',
          description: 'Tests ant selection system integration'
        },
        {
          name: 'Selection Comprehensive',
          file: 'selectionBox.comprehensive.test.js',
          description: 'Comprehensive selection system tests'
        },
        {
          name: 'Ant Structure Compatibility',
          file: 'antStructure.test.js',
          description: 'Tests ant creation method compatibility'
        },
        {
          name: 'Faction Integration',
          file: 'faction-integration.test.js',
          description: 'Tests faction system integration'
        },
        {
          name: 'Spawn Interaction',
          file: 'spawn-interaction.regression.test.js',
          description: 'Tests spawning and interaction systems'
        }
      ],
      system: [
        {
          name: 'Script Loader',
          file: 'scriptLoader.node.test.js',
          description: 'Tests script loading and naming conventions'
        },
        {
          name: 'Load Order Verification',
          file: 'scriptLoader.loadOrder.simple.test.js',
          description: 'Tests script dependency loading order'
        },
        {
          name: 'Selection Regression',
          file: 'selectionBox.regression.test.js',
          description: 'Regression tests for selection system'
        }
      ],
      utils: [
        {
          name: 'Selection Simple',
          file: 'selectionBox.simple.test.js',
          description: 'Quick validation tests for selection'
        }
      ]
    };
  }

  // Execute a single test file
  async runTest(testFile, category) {
    const testPath = path.join(process.cwd(), 'test', category, testFile);
    const startTime = Date.now();
    
    try {
      // Check if file exists
      if (!fs.existsSync(testPath)) {
        throw new Error(`Test file not found: ${testPath}`);
      }

      // Execute test with timeout
      const result = execSync(`node "${testPath}"`, {
        encoding: 'utf8',
        timeout: 30000, // 30 second timeout
        stdio: 'pipe'
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Parse test output for pass/fail counts
      const passMatches = result.match(/(\d+)\s+passed/i);
      const failMatches = result.match(/(\d+)\s+failed/i);
      const errorMatches = result.match(/(\d+)\s+error/i);
      
      const passed = passMatches ? parseInt(passMatches[1]) : 0;
      const failed = failMatches ? parseInt(failMatches[1]) : 0;
      const errors = errorMatches ? parseInt(errorMatches[1]) : 0;
      
      // Determine overall status
      const status = (failed > 0 || errors > 0) ? 'FAIL' : 'PASS';
      
      return {
        file: testFile,
        category,
        status,
        duration,
        passed,
        failed,
        errors,
        output: result,
        error: null
      };
      
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      return {
        file: testFile,
        category,
        status: 'ERROR',
        duration,
        passed: 0,
        failed: 0,
        errors: 1,
        output: error.stdout || '',
        error: error.message
      };
    }
  }

  // Run all tests in a category
  async runCategory(categoryName, tests) {
    this.log(`\n${'='.repeat(60)}`, 'cyan');
    this.log(`🧪 RUNNING ${categoryName.toUpperCase()} TESTS`, 'cyan');
    this.log(`${'='.repeat(60)}`, 'cyan');
    
    const categoryResults = [];
    
    for (const test of tests) {
      this.log(`\n📋 ${test.name}`, 'blue');
      this.log(`   ${test.description}`, 'gray');
      this.log(`   File: ${test.file}`, 'gray');
      
      process.stdout.write('   Running... ');
      
      const result = await this.runTest(test.file, categoryName);
      result.name = test.name;
      result.description = test.description;
      
      // Display immediate result
      if (result.status === 'PASS') {
        this.log(`✅ PASSED (${result.duration}ms)`, 'green');
        if (result.passed > 0) {
          this.log(`   ${result.passed} tests passed`, 'green');
        }
      } else if (result.status === 'FAIL') {
        this.log(`❌ FAILED (${result.duration}ms)`, 'red');
        if (result.failed > 0) {
          this.log(`   ${result.failed} tests failed`, 'red');
        }
        if (result.passed > 0) {
          this.log(`   ${result.passed} tests passed`, 'yellow');
        }
      } else {
        this.log(`💥 ERROR (${result.duration}ms)`, 'red');
        this.log(`   ${result.error}`, 'red');
      }
      
      categoryResults.push(result);
      this.results.push(result);
    }
    
    return categoryResults;
  }

  // Generate comprehensive summary report
  generateSummary() {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;
    
    this.log(`\n${'='.repeat(80)}`, 'bright');
    this.log(`📊 COMPREHENSIVE TEST SUMMARY REPORT`, 'bright');
    this.log(`${'='.repeat(80)}`, 'bright');
    
    // Overall statistics
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL').length;
    const errorTests = this.results.filter(r => r.status === 'ERROR').length;
    
    const totalAssertions = this.results.reduce((sum, r) => sum + r.passed + r.failed, 0);
    const passedAssertions = this.results.reduce((sum, r) => sum + r.passed, 0);
    const failedAssertions = this.results.reduce((sum, r) => sum + r.failed, 0);
    
    this.log(`\n🎯 OVERALL RESULTS:`);
    this.log(`   Test Suites: ${passedTests}/${totalTests} passed`, passedTests === totalTests ? 'green' : 'yellow');
    this.log(`   Assertions:  ${passedAssertions}/${totalAssertions} passed`, failedAssertions === 0 ? 'green' : 'yellow');
    this.log(`   Duration:    ${totalDuration}ms`);
    this.log(`   Status:      ${failedTests === 0 && errorTests === 0 ? '✅ ALL PASSED' : '❌ SOME FAILED'}`, 
              failedTests === 0 && errorTests === 0 ? 'green' : 'red');
    
    // Category breakdown
    this.log(`\n📁 RESULTS BY CATEGORY:`);
    const categories = [...new Set(this.results.map(r => r.category))];
    
    categories.forEach(category => {
      const categoryResults = this.results.filter(r => r.category === category);
      const categoryPassed = categoryResults.filter(r => r.status === 'PASS').length;
      const categoryTotal = categoryResults.length;
      
      const status = categoryPassed === categoryTotal ? '✅' : '❌';
      const color = categoryPassed === categoryTotal ? 'green' : 'red';
      
      this.log(`   ${status} ${category.toUpperCase()}: ${categoryPassed}/${categoryTotal}`, color);
    });
    
    // Failed tests details
    const failedResults = this.results.filter(r => r.status === 'FAIL' || r.status === 'ERROR');
    if (failedResults.length > 0) {
      this.log(`\n❌ FAILED TESTS DETAILS:`, 'red');
      failedResults.forEach(result => {
        this.log(`\n   🚨 ${result.name} (${result.file})`, 'red');
        this.log(`      Category: ${result.category}`, 'gray');
        this.log(`      Status: ${result.status}`, 'red');
        this.log(`      Duration: ${result.duration}ms`, 'gray');
        
        if (result.error) {
          this.log(`      Error: ${result.error}`, 'red');
        }
        
        if (result.failed > 0) {
          this.log(`      Failed Assertions: ${result.failed}`, 'red');
        }
        
        // Show last few lines of output for context
        if (result.output) {
          const lines = result.output.split('\n').slice(-5).join('\n');
          if (lines.trim()) {
            this.log(`      Output: ${lines}`, 'gray');
          }
        }
      });
    }
    
    // Performance analysis
    this.log(`\n⚡ PERFORMANCE ANALYSIS:`);
    const slowTests = this.results
      .filter(r => r.duration > 1000)
      .sort((a, b) => b.duration - a.duration);
    
    if (slowTests.length > 0) {
      this.log(`   Slow tests (>1s):`);
      slowTests.forEach(test => {
        this.log(`   ⏱️  ${test.name}: ${test.duration}ms`, 'yellow');
      });
    } else {
      this.log(`   ✅ All tests completed quickly (<1s each)`, 'green');
    }
    
    const avgDuration = Math.round(totalDuration / totalTests);
    this.log(`   Average test duration: ${avgDuration}ms`);
    
    // Recommendations
    this.log(`\n💡 RECOMMENDATIONS:`);
    if (failedTests > 0) {
      this.log(`   🔧 Fix ${failedTests} failing test suite${failedTests > 1 ? 's' : ''}`, 'yellow');
    }
    if (errorTests > 0) {
      this.log(`   🚨 Resolve ${errorTests} test execution error${errorTests > 1 ? 's' : ''}`, 'red');
    }
    if (slowTests.length > 0) {
      this.log(`   ⚡ Optimize ${slowTests.length} slow test${slowTests.length > 1 ? 's' : ''}`, 'yellow');
    }
    if (failedTests === 0 && errorTests === 0) {
      this.log(`   🎉 Excellent! All tests are passing!`, 'green');
    }
    
    this.log(`\n${'='.repeat(80)}`, 'bright');
    
    return {
      totalTests,
      passedTests,
      failedTests,
      errorTests,
      totalAssertions,
      passedAssertions,
      failedAssertions,
      totalDuration,
      success: failedTests === 0 && errorTests === 0
    };
  }

  // Main execution method
  async run(categories = null) {
    this.log('🚀 STARTING COMPREHENSIVE TEST SUITE', 'bright');
    this.log(`Time: ${new Date().toLocaleString()}`, 'gray');
    
    const testSuites = this.getTestSuites();
    const categoriesToRun = categories || Object.keys(testSuites);
    
    for (const categoryName of categoriesToRun) {
      if (testSuites[categoryName]) {
        await this.runCategory(categoryName, testSuites[categoryName]);
      } else {
        this.log(`⚠️ Unknown test category: ${categoryName}`, 'yellow');
      }
    }
    
    const summary = this.generateSummary();
    
    // Exit with appropriate code
    process.exit(summary.success ? 0 : 1);
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const runner = new TestRunner();
  
  if (args.length > 0) {
    // Run specific categories
    runner.run(args);
  } else {
    // Run all tests
    runner.run();
  }
}

module.exports = TestRunner;