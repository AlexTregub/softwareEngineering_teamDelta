/**
 * Selenium WebDriver automation for Shareholder Demo BDD tests
 * 
 * This file contains step definitions and automation code for validating
 * the visual shareholder demonstration using Selenium WebDriver.
 * 
 * @author Software Engineering Team Delta
 * @version 1.0.0
 */

const { Builder, By, until, Key } = require('selenium-webdriver');
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');

/**
 * Selenium ShareholderDemo Test Suite
 */
class ShareholderDemoSeleniumTests {
  constructor(options = {}) {
    this.driver = null;
    this.baseUrl = options.baseUrl || 'http://localhost:3000';
    this.timeout = options.timeout || 30000;
    this.screenshotDir = options.screenshotDir || './test-screenshots';
    this.testResults = {
      startTime: new Date(),
      scenarios: [],
      screenshots: [],
      errors: []
    };
    
    // Ensure screenshot directory exists
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }
  }

  /**
   * Initialize Selenium WebDriver
   */
  async initialize() {
    try {
      this.driver = await new Builder()
        .forBrowser('chrome')
        .build();
      
      await this.driver.manage().setTimeouts({
        implicit: this.timeout,
        pageLoad: this.timeout,
        script: this.timeout
      });
      
      console.log('✅ Selenium WebDriver initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Selenium:', error);
      return false;
    }
  }

  /**
   * Navigate to the game and wait for it to load
   */
  async navigateToGame() {
    await this.driver.get(this.baseUrl);
    
    // Wait for game to load (look for canvas element)
    await this.driver.wait(until.elementLocated(By.css('canvas')), this.timeout);
    
    // Wait for game state to be ready
    await this.driver.wait(async () => {
      const gameReady = await this.driver.executeScript(`
        return typeof GameState !== 'undefined' && 
               GameState.getState() === 'PLAYING' &&
               typeof shareholderDemo !== 'undefined';
      `);
      return gameReady;
    }, this.timeout);
    
    console.log('✅ Game loaded and ready');
  }

  /**
   * Take a screenshot with timestamp
   */
  async takeScreenshot(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    const filepath = path.join(this.screenshotDir, filename);
    
    const screenshot = await this.driver.takeScreenshot();
    fs.writeFileSync(filepath, screenshot, 'base64');
    
    this.testResults.screenshots.push({
      name: name,
      filename: filename,
      timestamp: new Date()
    });
    
    console.log(`📸 Screenshot saved: ${filename}`);
    return filepath;
  }

  /**
   * Wait for demo to be ready
   */
  async waitForDemo() {
    await this.driver.wait(async () => {
      return await this.driver.executeScript(`
        return typeof shareholderDemo !== 'undefined' && 
               typeof startShareholderDemo === 'function';
      `);
    }, this.timeout);
  }

  /**
   * Start the shareholder demo
   */
  async startDemo() {
    await this.takeScreenshot('before-demo-start');
    
    // Click the demo button
    const demoButton = await this.driver.wait(
      until.elementLocated(By.css('button[data-id="shareholder-demo"], .button[data-action*="demo"]')),
      this.timeout
    );
    
    await demoButton.click();
    
    // Verify demo started
    await this.driver.wait(async () => {
      const isRunning = await this.driver.executeScript(`
        return shareholderDemo && shareholderDemo.isRunning;
      `);
      return isRunning;
    }, 5000);
    
    await this.takeScreenshot('demo-started');
    console.log('🎭 Demo started successfully');
  }

  /**
   * Validate environment cleanup
   */
  async validateCleanup() {
    // Wait for cleanup phase
    await this.driver.wait(async () => {
      const phase = await this.driver.executeScript(`
        return shareholderDemo ? shareholderDemo.getCurrentPhase() : '';
      `);
      return phase.includes('Clearing') || phase.includes('Stopping') || phase.includes('Hiding');
    }, 10000);
    
    await this.takeScreenshot('cleanup-phase');
    
    // Verify entities are cleared
    const entityCount = await this.driver.executeScript(`
      return (typeof ants !== 'undefined' ? ants.length : 0) +
             (typeof g_resourceList !== 'undefined' && g_resourceList.resources ? g_resourceList.resources.length : 0);
    `);
    
    // Should have only the test ant
    expect(entityCount).to.be.at.most(1, 'Should have at most 1 entity (test ant) after cleanup');
    
    console.log('✅ Environment cleanup validated');
  }

  /**
   * Validate highlight effects
   */
  async validateHighlights() {
    const highlights = await this.driver.executeScript(`
      return shareholderDemo ? shareholderDemo.availableHighlights : [];
    `);
    
    for (const highlight of highlights) {
      // Wait for this highlight phase
      await this.driver.wait(async () => {
        const currentHighlight = await this.driver.executeScript(`
          return shareholderDemo ? shareholderDemo.getCurrentHighlightState() : null;
        `);
        return currentHighlight === highlight;
      }, 15000);
      
      await this.takeScreenshot(`highlight-${highlight.toLowerCase()}`);
      
      // Validate highlight is applied
      const highlightState = await this.driver.executeScript(`
        return shareholderDemo ? shareholderDemo.getCurrentHighlightState() : null;
      `);
      
      expect(highlightState).to.equal(highlight, `Highlight should be set to ${highlight}`);
      console.log(`✅ Highlight ${highlight} validated`);
      
      // Small delay to observe the effect
      await this.driver.sleep(1000);
    }
  }

  /**
   * Validate job cycling
   */
  async validateJobs() {
    const jobs = await this.driver.executeScript(`
      return shareholderDemo ? shareholderDemo.availableJobs : [];
    `);
    
    for (const job of jobs) {
      // Wait for this job phase
      await this.driver.wait(async () => {
        const currentJob = await this.driver.executeScript(`
          return shareholderDemo ? shareholderDemo.getCurrentJob() : null;
        `);
        return currentJob === job;
      }, 15000);
      
      await this.takeScreenshot(`job-${job.toLowerCase()}`);
      
      // Validate job is applied
      const jobState = await this.driver.executeScript(`
        return shareholderDemo ? shareholderDemo.getCurrentJob() : null;
      `);
      
      expect(jobState).to.equal(job, `Job should be set to ${job}`);
      console.log(`✅ Job ${job} validated`);
      
      await this.driver.sleep(1000);
    }
  }

  /**
   * Validate state machine cycling
   */
  async validateStates() {
    const states = await this.driver.executeScript(`
      return shareholderDemo ? shareholderDemo.availableStates : [];
    `);
    
    for (const state of states) {
      // Wait for this state phase
      await this.driver.wait(async () => {
        const currentState = await this.driver.executeScript(`
          return shareholderDemo ? shareholderDemo.getCurrentState() : null;
        `);
        return currentState === state;
      }, 15000);
      
      await this.takeScreenshot(`state-${state.toLowerCase()}`);
      
      // Validate state is applied
      const stateValue = await this.driver.executeScript(`
        return shareholderDemo ? shareholderDemo.getCurrentState() : null;
      `);
      
      expect(stateValue).to.equal(state, `State should be set to ${state}`);
      console.log(`✅ State ${state} validated`);
      
      await this.driver.sleep(1000);
    }
  }

  /**
   * Wait for demo completion
   */
  async waitForCompletion() {
    await this.driver.wait(async () => {
      const isRunning = await this.driver.executeScript(`
        return shareholderDemo ? shareholderDemo.isRunning : true;
      `);
      return !isRunning;
    }, 120000); // 2 minutes max
    
    await this.takeScreenshot('demo-completed');
    console.log('🏁 Demo completed');
  }

  /**
   * Validate generated report
   */
  async validateReport() {
    // Check if report was generated in localStorage
    const reportKeys = await this.driver.executeScript(`
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('shareholder-demo-')) {
          keys.push(key);
        }
      }
      return keys;
    `);
    
    expect(reportKeys.length).to.be.at.least(1, 'At least one demo report should be generated');
    
    // Get the latest report
    const latestReportKey = reportKeys[reportKeys.length - 1];
    const reportContent = await this.driver.executeScript(`
      return localStorage.getItem('${latestReportKey}');
    `);
    
    expect(reportContent).to.be.a('string');
    expect(reportContent).to.include('Shareholder Demo Report');
    expect(reportContent).to.include('Summary');
    
    console.log(`✅ Report validated: ${latestReportKey}`);
    
    // Save report to file for inspection
    const reportPath = path.join(this.screenshotDir, `${latestReportKey}.html`);
    fs.writeFileSync(reportPath, reportContent);
    console.log(`📄 Report saved to: ${reportPath}`);
  }

  /**
   * Run all BDD scenarios
   */
  async runAllScenarios() {
    try {
      console.log('🎭 Starting Shareholder Demo Selenium Tests...');
      
      await this.initialize();
      await this.navigateToGame();
      await this.waitForDemo();
      
      // Scenario: Environment Setup and Cleanup
      console.log('\n📋 Scenario: Environment Setup and Cleanup');
      await this.startDemo();
      await this.validateCleanup();
      
      // Scenario: Highlight System Demonstration
      console.log('\n📋 Scenario: Highlight System Demonstration');
      await this.validateHighlights();
      
      // Scenario: Job System Demonstration
      console.log('\n📋 Scenario: Job System Demonstration');
      await this.validateJobs();
      
      // Scenario: State Machine Demonstration
      console.log('\n📋 Scenario: State Machine Demonstration');
      await this.validateStates();
      
      // Wait for completion and validate report
      console.log('\n📋 Scenario: Demo Completion and Reporting');
      await this.waitForCompletion();
      await this.validateReport();
      
      this.testResults.endTime = new Date();
      this.testResults.success = true;
      
      await this.generateSeleniumReport();
      
      console.log('✅ All Selenium tests passed!');
      
    } catch (error) {
      console.error('❌ Selenium test failed:', error);
      this.testResults.errors.push({
        error: error.message,
        timestamp: new Date()
      });
      this.testResults.success = false;
      
      await this.takeScreenshot('error-state');
      throw error;
    }
  }

  /**
   * Generate Selenium test report
   */
  async generateSeleniumReport() {
    const duration = this.testResults.endTime - this.testResults.startTime;
    
    const reportHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Selenium Shareholder Demo Test Report</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { background: #e8f4f8; padding: 20px; border-radius: 5px; }
            .success { background: #d4edda; color: #155724; padding: 10px; border-radius: 5px; }
            .error { background: #f8d7da; color: #721c24; padding: 10px; border-radius: 5px; }
            .screenshot { margin: 10px 0; }
            .screenshot img { max-width: 300px; border: 1px solid #ccc; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🤖 Selenium Shareholder Demo Test Report</h1>
            <p><strong>Date:</strong> ${this.testResults.startTime.toLocaleString()}</p>
            <p><strong>Duration:</strong> ${Math.round(duration / 1000)} seconds</p>
            <p><strong>Status:</strong> ${this.testResults.success ? '✅ PASSED' : '❌ FAILED'}</p>
        </div>
        
        <div class="${this.testResults.success ? 'success' : 'error'}">
            <h2>Test Result</h2>
            <p>${this.testResults.success ? 'All automated tests passed successfully!' : 'Some tests failed. Check errors below.'}</p>
        </div>
        
        <h2>📸 Screenshots</h2>
        ${this.testResults.screenshots.map(screenshot => `
            <div class="screenshot">
                <h3>${screenshot.name}</h3>
                <p><em>${screenshot.timestamp.toLocaleString()}</em></p>
                <img src="${screenshot.filename}" alt="${screenshot.name}" />
            </div>
        `).join('')}
        
        ${this.testResults.errors.length > 0 ? `
            <h2>❌ Errors</h2>
            ${this.testResults.errors.map(error => `
                <div class="error">
                    <strong>Error:</strong> ${error.error}<br>
                    <small>${error.timestamp.toLocaleString()}</small>
                </div>
            `).join('')}
        ` : ''}
    </body>
    </html>`;
    
    const reportPath = path.join(this.screenshotDir, 'selenium-test-report.html');
    fs.writeFileSync(reportPath, reportHtml);
    console.log(`📄 Selenium report saved to: ${reportPath}`);
  }

  /**
   * Cleanup and close driver
   */
  async cleanup() {
    if (this.driver) {
      await this.driver.quit();
      console.log('🧹 Selenium driver closed');
    }
  }
}

// Export for use in test runner
module.exports = ShareholderDemoSeleniumTests;

// CLI runner
if (require.main === module) {
  (async () => {
    const tester = new ShareholderDemoSeleniumTests();
    try {
      await tester.runAllScenarios();
      process.exit(0);
    } catch (error) {
      console.error('Test suite failed:', error);
      process.exit(1);
    } finally {
      await tester.cleanup();
    }
  })();
}