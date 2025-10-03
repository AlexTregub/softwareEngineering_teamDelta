/**
 * @fileoverview Cucumber.js Configuration for Gherkin/Behave Testing
 * Configures test runner, step definitions, and output formatting
 * 
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 */

module.exports = {
  default: {
    // Feature file locations
    paths: ['test/behavioral/features/**/*.feature'],
    
    // Step definition locations
    require: [
      'test/behavioral/steps/**/*.js',
      'test/behavioral/support/**/*.js'
    ],
    
    // Output formatting
    format: [
      'progress-bar',          // Progress indicator during test run
      'json:test/results/cucumber-report.json', // JSON output for CI/CD
      'html:test/results/cucumber-report.html'  // HTML report for developers
    ],
    
    // Test execution options
    parallel: 1,              // Run tests sequentially for now
    retry: 0,                 // No automatic retries - tests should be reliable
    timeout: 10000,           // 10 second timeout per step
    
    // Tag filtering support
    tags: 'not @skip',        // Skip tests marked with @skip tag
    
    // World parameters
    worldParameters: {
      // Canvas dimensions for positioning tests
      canvasWidth: 1200,
      canvasHeight: 800,
      
      // Snap threshold for drag tests
      snapThreshold: 20
    }
  },
  
  // Profile for CI/CD environments
  ci: {
    paths: ['test/behavioral/features/**/*.feature'],
    require: [
      'test/behavioral/steps/**/*.js',
      'test/behavioral/support/**/*.js'
    ],
    format: [
      'json:test/results/cucumber-report.json'
    ],
    parallel: 1,
    retry: 0,
    timeout: 5000,
    tags: 'not @skip and not @slow'
  },
  
  // Profile for development with detailed output
  dev: {
    paths: ['test/behavioral/features/**/*.feature'],
    require: [
      'test/behavioral/steps/**/*.js',
      'test/behavioral/support/**/*.js'
    ],
    format: [
      'pretty',
      'usage:test/results/cucumber-usage.txt'
    ],
    parallel: 1,
    retry: 0,
    timeout: 30000,
    tags: 'not @skip'
  }
};