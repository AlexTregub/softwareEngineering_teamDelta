const { Builder, By, until, Key } = require('selenium-webdriver');
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');

/**
 * Highlighting System Debug Tests
 * Comprehensive Selenium-based testing to identify highlighting issues
 */
class HighlightingDebugTests {
  constructor() {
    this.driver = null;
    this.testResults = [];
    this.screenshots = [];
    this.consoleErrors = [];
  }

  async setup() {
    console.log('🚀 Setting up Selenium WebDriver for highlighting debug tests...');
    
    this.driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions({
        args: ['--disable-web-security', '--allow-running-insecure-content']
      })
      .build();

    // Navigate to the game
    const gameUrl = `file://${path.resolve(__dirname, '../../index.html')}`;
    console.log(`📂 Loading game from: ${gameUrl}`);
    await this.driver.get(gameUrl);

    // Wait for game to load
    await this.driver.wait(until.elementLocated(By.tagName('canvas')), 10000);
    await this.driver.sleep(2000); // Wait for initialization

    // Capture console logs
    await this.captureConsoleLogs();
  }

  async captureConsoleLogs() {
    const logs = await this.driver.manage().logs().get('browser');
    this.consoleErrors = logs.filter(log => log.level.name === 'SEVERE');
    if (this.consoleErrors.length > 0) {
      console.log('⚠️ Console errors detected:', this.consoleErrors);
    }
  }

  async takeScreenshot(name) {
    const screenshot = await this.driver.takeScreenshot();
    const filename = `highlighting_debug_${name}_${Date.now()}.png`;
    const filepath = path.join(__dirname, '..', 'screenshots', filename);
    
    // Ensure screenshots directory exists
    const screenshotDir = path.dirname(filepath);
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    
    fs.writeFileSync(filepath, screenshot, 'base64');
    this.screenshots.push({ name, filepath });
    console.log(`📸 Screenshot saved: ${filename}`);
  }

  async executeJavaScript(script) {
    try {
      return await this.driver.executeScript(script);
    } catch (error) {
      console.error(`❌ JavaScript execution error:`, error.message);
      throw error;
    }
  }

  // ============================================================================
  // BDD TEST IMPLEMENTATIONS
  // ============================================================================

  async testRenderControllerAvailability() {
    console.log('\n🧪 Testing: RenderController Availability');
    
    const results = await this.executeJavaScript(`
      return {
        renderControllerDefined: typeof RenderController !== 'undefined',
        renderControllerType: typeof RenderController,
        hasPrototype: typeof RenderController !== 'undefined' && !!RenderController.prototype,
        prototypeMethodsCount: typeof RenderController !== 'undefined' ? Object.getOwnPropertyNames(RenderController.prototype).length : 0,
        highlightMethods: typeof RenderController !== 'undefined' ? {
          hasSetHighlight: typeof RenderController.prototype.setHighlight === 'function',
          hasClearHighlight: typeof RenderController.prototype.clearHighlight === 'function',
          hasRenderHighlighting: typeof RenderController.prototype.renderHighlighting === 'function',
          hasHighlightTypes: !!RenderController.prototype.HIGHLIGHT_TYPES
        } : null
      };
    `);

    expect(results.renderControllerDefined).to.be.true;
    expect(results.renderControllerType).to.equal('function');
    expect(results.hasPrototype).to.be.true;
    expect(results.highlightMethods.hasSetHighlight).to.be.true;
    expect(results.highlightMethods.hasClearHighlight).to.be.true;
    expect(results.highlightMethods.hasRenderHighlighting).to.be.true;

    this.testResults.push({
      test: 'RenderController Availability',
      status: 'PASS',
      details: results
    });

    console.log('✅ RenderController availability test passed');
    return results;
  }

  async testShareholderDemoInitialization() {
    console.log('\n🧪 Testing: ShareholderDemo Initialization');
    
    const results = await this.executeJavaScript(`
      // Check if ShareholderDemo is available
      const demoAvailable = typeof window.startShareholderDemo === 'function';
      
      if (!demoAvailable) {
        return { available: false, error: 'ShareholderDemo not available' };
      }

      // Initialize if needed
      if (typeof window.shareholderDemo === 'undefined') {
        try {
          if (typeof initializeShareholderDemo === 'function') {
            initializeShareholderDemo();
          }
        } catch (error) {
          return { available: true, initialized: false, error: error.message };
        }
      }

      return {
        available: demoAvailable,
        initialized: typeof window.shareholderDemo !== 'undefined',
        demoObject: typeof window.shareholderDemo,
        hasTestAnt: window.shareholderDemo && !!window.shareholderDemo.testAnt
      };
    `);

    expect(results.available).to.be.true;
    this.testResults.push({
      test: 'ShareholderDemo Initialization',
      status: results.initialized ? 'PASS' : 'FAIL',
      details: results
    });

    console.log('✅ ShareholderDemo initialization test completed');
    return results;
  }

  async testAntControllerSystem() {
    console.log('\n🧪 Testing: Ant Controller System');
    
    // First ensure we have a test ant
    await this.executeJavaScript(`
      if (!window.shareholderDemo) {
        if (typeof initializeShareholderDemo === 'function') {
          initializeShareholderDemo();
        }
      }
      if (window.shareholderDemo && !window.shareholderDemo.testAnt) {
        window.shareholderDemo.spawnTestAnt();
      }
    `);

    const results = await this.executeJavaScript(`
      const demo = window.shareholderDemo;
      if (!demo || !demo.testAnt) {
        return { error: 'No test ant available' };
      }

      const ant = demo.testAnt;
      return {
        hasControllers: !!ant._controllers,
        controllersType: typeof ant._controllers,
        controllersSize: ant._controllers ? ant._controllers.size : 0,
        controllerKeys: ant._controllers ? Array.from(ant._controllers.keys()) : [],
        hasRenderController: !!ant._renderController,
        renderControllerType: typeof ant._renderController,
        renderControllerMethods: ant._renderController ? {
          hasSetHighlight: typeof ant._renderController.setHighlight === 'function',
          hasGetHighlightState: typeof ant._renderController.getHighlightState === 'function',
          hasIsHighlighted: typeof ant._renderController.isHighlighted === 'function',
          hasRender: typeof ant._renderController.render === 'function'
        } : null
      };
    `);

    expect(results.hasControllers).to.be.true;
    expect(results.controllerKeys).to.include('render');
    expect(results.hasRenderController).to.be.true;

    this.testResults.push({
      test: 'Ant Controller System',
      status: 'PASS',
      details: results
    });

    console.log('✅ Ant controller system test passed');
    return results;
  }

  async testEntityHighlightAPI() {
    console.log('\n🧪 Testing: Entity Highlight API');
    
    const results = await this.executeJavaScript(`
      const ant = window.shareholderDemo?.testAnt;
      if (!ant) {
        return { error: 'No test ant available' };
      }

      return {
        hasHighlightAPI: !!ant.highlight,
        highlightType: typeof ant.highlight,
        hasSetMethod: typeof ant.highlight?.set === 'function',
        hasClearMethod: typeof ant.highlight?.clear === 'function',
        hasSelectedMethod: typeof ant.highlight?.selected === 'function',
        hasHoverMethod: typeof ant.highlight?.hover === 'function',
        hasCombatMethod: typeof ant.highlight?.combat === 'function'
      };
    `);

    expect(results.hasHighlightAPI).to.be.true;
    expect(results.hasSetMethod).to.be.true;
    expect(results.hasClearMethod).to.be.true;

    this.testResults.push({
      test: 'Entity Highlight API',
      status: 'PASS',
      details: results
    });

    console.log('✅ Entity Highlight API test passed');
    return results;
  }

  async testDirectRenderControllerHighlighting() {
    console.log('\n🧪 Testing: Direct RenderController Highlighting');
    
    const results = await this.executeJavaScript(`
      const ant = window.shareholderDemo?.testAnt;
      if (!ant || !ant._renderController) {
        return { error: 'No test ant or render controller available' };
      }

      const controller = ant._renderController;
      
      // Test direct highlight setting
      controller.setHighlight('SELECTED', 1.0);
      
      return {
        highlightState: controller.getHighlightState(),
        isHighlighted: controller.isHighlighted(),
        highlightIntensity: controller.getHighlightIntensity(),
        highlightColor: controller.getHighlightColor(),
        availableHighlights: controller.getAvailableHighlights()
      };
    `);

    expect(results.highlightState).to.equal('SELECTED');
    expect(results.isHighlighted).to.be.true;
    expect(results.highlightIntensity).to.equal(1.0);
    expect(results.highlightColor).to.be.an('array');

    this.testResults.push({
      test: 'Direct RenderController Highlighting',
      status: 'PASS',
      details: results
    });

    console.log('✅ Direct RenderController highlighting test passed');
    return results;
  }

  async testEntityAPIHighlighting() {
    console.log('\n🧪 Testing: Entity API Highlighting');
    
    const results = await this.executeJavaScript(`
      const ant = window.shareholderDemo?.testAnt;
      if (!ant) {
        return { error: 'No test ant available' };
      }

      // Clear any existing highlight
      ant.highlight.clear();
      
      // Test Entity API highlight setting
      ant.highlight.set('HOVER', 0.8);
      
      return {
        highlightState: ant._renderController?.getHighlightState(),
        isHighlighted: ant._renderController?.isHighlighted(),
        highlightIntensity: ant._renderController?.getHighlightIntensity(),
        apiWorked: ant._renderController?.getHighlightState() === 'HOVER'
      };
    `);

    expect(results.highlightState).to.equal('HOVER');
    expect(results.isHighlighted).to.be.true;
    expect(results.apiWorked).to.be.true;

    this.testResults.push({
      test: 'Entity API Highlighting',
      status: 'PASS',
      details: results
    });

    console.log('✅ Entity API highlighting test passed');
    return results;
  }

  async testP5JSFunctionAvailability() {
    console.log('\n🧪 Testing: P5.js Function Availability');
    
    const results = await this.executeJavaScript(`
      return {
        stroke: typeof stroke,
        fill: typeof fill,
        rect: typeof rect,
        strokeWeight: typeof strokeWeight,
        noFill: typeof noFill,
        noStroke: typeof noStroke,
        push: typeof push,
        pop: typeof pop,
        translate: typeof translate
      };
    `);

    const requiredFunctions = ['stroke', 'fill', 'rect', 'strokeWeight', 'noFill', 'noStroke'];
    const missingFunctions = requiredFunctions.filter(func => results[func] !== 'function');

    expect(missingFunctions).to.have.lengthOf(0, `Missing p5.js functions: ${missingFunctions.join(', ')}`);

    this.testResults.push({
      test: 'P5.js Function Availability',
      status: missingFunctions.length === 0 ? 'PASS' : 'FAIL',
      details: results,
      missingFunctions
    });

    console.log('✅ P5.js function availability test passed');
    return results;
  }

  async testHighlightRendering() {
    console.log('\n🧪 Testing: Highlight Rendering');
    
    // Take before screenshot
    await this.takeScreenshot('before_highlight_render');
    
    const results = await this.executeJavaScript(`
      const ant = window.shareholderDemo?.testAnt;
      if (!ant || !ant._renderController) {
        return { error: 'No test ant or render controller available' };
      }

      const controller = ant._renderController;
      
      // Set a visible highlight
      controller.setHighlight('SELECTED', 1.0);
      
      // Force render
      let renderError = null;
      try {
        ant.render();
      } catch (error) {
        renderError = error.message;
      }
      
      return {
        highlightSet: controller.getHighlightState() === 'SELECTED',
        renderError: renderError,
        antPosition: ant.getPosition(),
        antSize: ant.getSize(),
        isActive: ant.isActive
      };
    `);

    // Take after screenshot
    await this.takeScreenshot('after_highlight_render');

    expect(results.highlightSet).to.be.true;
    expect(results.renderError).to.be.null;
    expect(results.isActive).to.be.true;

    this.testResults.push({
      test: 'Highlight Rendering',
      status: results.renderError ? 'FAIL' : 'PASS',
      details: results
    });

    console.log('✅ Highlight rendering test completed');
    return results;
  }

  async testShareholderDemoHighlighting() {
    console.log('\n🧪 Testing: ShareholderDemo Highlighting Integration');
    
    const results = await this.executeJavaScript(`
      const demo = window.shareholderDemo;
      if (!demo) {
        return { error: 'ShareholderDemo not available' };
      }

      let results = [];
      const highlightTypes = ['SELECTED', 'HOVER', 'COMBAT', 'BOX_HOVERED'];
      
      for (let highlightType of highlightTypes) {
        try {
          await demo.setHighlight(highlightType);
          const state = demo.testAnt?._renderController?.getHighlightState();
          const isHighlighted = demo.testAnt?._renderController?.isHighlighted();
          
          results.push({
            type: highlightType,
            success: state === highlightType,
            actualState: state,
            isHighlighted: isHighlighted
          });
          
          // Small delay between highlights
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          results.push({
            type: highlightType,
            success: false,
            error: error.message
          });
        }
      }
      
      return { highlightTests: results };
    `);

    const failedTests = results.highlightTests?.filter(test => !test.success) || [];
    
    this.testResults.push({
      test: 'ShareholderDemo Highlighting Integration',
      status: failedTests.length === 0 ? 'PASS' : 'FAIL',
      details: results,
      failedTests
    });

    console.log('✅ ShareholderDemo highlighting integration test completed');
    return results;
  }

  async runAllTests() {
    console.log('\n🎯 Starting Comprehensive Highlighting Debug Tests\n');
    
    try {
      await this.setup();
      
      // Run all test scenarios
      await this.testRenderControllerAvailability();
      await this.testShareholderDemoInitialization();
      await this.testAntControllerSystem();
      await this.testEntityHighlightAPI();
      await this.testDirectRenderControllerHighlighting();
      await this.testEntityAPIHighlighting();
      await this.testP5JSFunctionAvailability();
      await this.testHighlightRendering();
      await this.testShareholderDemoHighlighting();
      
      // Generate comprehensive report
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ Test execution failed:', error);
      this.testResults.push({
        test: 'Test Execution',
        status: 'FAIL',
        error: error.message
      });
    } finally {
      if (this.driver) {
        await this.driver.quit();
      }
    }
  }

  async generateReport() {
    const passedTests = this.testResults.filter(t => t.status === 'PASS').length;
    const failedTests = this.testResults.filter(t => t.status === 'FAIL').length;
    
    const report = {
      summary: {
        total: this.testResults.length,
        passed: passedTests,
        failed: failedTests,
        passRate: (passedTests / this.testResults.length * 100).toFixed(1)
      },
      testResults: this.testResults,
      screenshots: this.screenshots,
      consoleErrors: this.consoleErrors,
      timestamp: new Date().toISOString()
    };

    const reportPath = path.join(__dirname, '..', 'reports', `highlighting_debug_report_${Date.now()}.json`);
    
    // Ensure reports directory exists
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('=====================');
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`📈 Pass Rate: ${report.summary.passRate}%`);
    console.log(`📄 Report saved: ${reportPath}`);
    
    if (failedTests > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults.filter(t => t.status === 'FAIL').forEach(test => {
        console.log(`   • ${test.test}: ${test.error || 'See details in report'}`);
      });
    }
    
    return report;
  }
}

// Export for use in test runners
module.exports = HighlightingDebugTests;

// Run tests if called directly
if (require.main === module) {
  const tester = new HighlightingDebugTests();
  tester.runAllTests().then(() => {
    console.log('\n🎉 Highlighting debug tests completed!');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });
}