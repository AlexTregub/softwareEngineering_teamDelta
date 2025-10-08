/**
 * Browser Test Runner
 * Runs tests that require DOM/Browser environment using JSDOM
 * Handles tests that need document, window, and other browser globals
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

console.log('🌐 BROWSER ENVIRONMENT TEST RUNNER');
console.log('================================================================================');
console.log('Running tests that require DOM/Browser environment with JSDOM simulation\n');

// Setup browser environment globals
function setupBrowserEnvironment() {
  console.log('🔧 Setting up browser environment...');
  
  // Create JSDOM instance
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Test Environment</title>
      </head>
      <body>
        <canvas id="defaultCanvas0" width="800" height="600"></canvas>
        <div id="ui-container"></div>
      </body>
    </html>
  `, {
    url: 'http://localhost:3000',
    pretendToBeVisual: true,
    resources: 'usable'
  });

  // Expose globals
  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;
  global.HTMLElement = dom.window.HTMLElement;
  global.HTMLCanvasElement = dom.window.HTMLCanvasElement;
  global.CanvasRenderingContext2D = dom.window.CanvasRenderingContext2D;
  global.Image = dom.window.Image;
  global.Event = dom.window.Event;
  global.MouseEvent = dom.window.MouseEvent;
  global.KeyboardEvent = dom.window.KeyboardEvent;
  
  // Mock p5.js globals that tests might expect
  global.width = 800;
  global.height = 600;
  global.mouseX = 0;
  global.mouseY = 0;
  global.keyCode = 0;
  global.key = '';
  
  // Mock canvas context
  const canvas = document.getElementById('defaultCanvas0');
  global.canvas = canvas;
  
  // Mock basic p5.js functions
  global.createCanvas = () => canvas;
  global.background = () => {};
  global.fill = () => {};
  global.stroke = () => {};
  global.rect = () => {};
  global.ellipse = () => {};
  global.text = () => {};
  global.textSize = () => {};
  global.textAlign = () => {};
  global.loadImage = (path) => ({ width: 32, height: 32, path });
  global.image = () => {};
  
  console.log('✅ Browser environment setup complete');
  return dom;
}

// Test results tracking
let totalTests = 0;
let totalPassed = 0;
let totalFailed = 0;
let suiteResults = [];

/**
 * Safe require with browser environment
 */
function safeRequireBrowser(filePath, fileName) {
  try {
    // Clear require cache
    delete require.cache[require.resolve(filePath)];
    return require(filePath);
  } catch (error) {
    console.log(`⚠️  Could not load ${fileName}: ${error.message}`);
    return null;
  }
}

/**
 * Run a browser test suite
 */
function runBrowserTestSuite(testFile) {
  console.log(`📋 Running Browser Test: ${testFile.name}`);
  console.log('------------------------------------------------------------');
  
  let suitePassed = 0;
  let suiteFailed = 0;
  let suiteTests = 0;
  let startTime = Date.now();
  
  try {
    const testModule = safeRequireBrowser(testFile.path, testFile.name);
    
    if (!testModule) {
      console.log(`❌ Failed to load browser test module\n`);
      totalTests++;
      totalFailed++;
      suiteFailed++;
      return;
    }
    
    // Try different browser test formats
    if (testModule.runBrowserTests && typeof testModule.runBrowserTests === 'function') {
      const result = testModule.runBrowserTests();
      if (result && result.testResults) {
        result.testResults.forEach(test => {
          suiteTests++;
          if (test.status === 'PASS') {
            suitePassed++;
            console.log(`✅ ${test.description}`);
          } else {
            suiteFailed++;
            console.log(`❌ ${test.description} - ${test.error || 'Failed'}`);
          }
        });
      }
    } else if (testModule.runTests && typeof testModule.runTests === 'function') {
      const result = testModule.runTests();
      if (result && result.testResults) {
        result.testResults.forEach(test => {
          suiteTests++;
          if (test.status === 'PASS') {
            suitePassed++;
            console.log(`✅ ${test.description}`);
          } else {
            suiteFailed++;
            console.log(`❌ ${test.description} - ${test.error || 'Failed'}`);
          }
        });
      }
    } else if (typeof testModule === 'function') {
      // Try to run the module as a function
      testModule();
      suiteTests = 1;
      suitePassed = 1;
      console.log(`✅ ${testFile.name} - Browser test executed successfully`);
    } else {
      console.log(`⚠️  No recognizable browser test format found in ${testFile.name}`);
      suiteTests = 1;
      suiteFailed = 1;
    }
    
  } catch (error) {
    console.error(`❌ ${testFile.name} failed in browser environment: ${error.message}`);
    suiteTests = 1;
    suiteFailed = 1;
  }
  
  let duration = Date.now() - startTime;
  console.log(`📊 ${testFile.name} Results: ${suitePassed} passed, ${suiteFailed} failed (${duration}ms)\n`);
  
  // Update totals
  totalTests += suiteTests;
  totalPassed += suitePassed;
  totalFailed += suiteFailed;
  
  suiteResults.push({
    name: testFile.name,
    category: 'browser',
    passed: suitePassed,
    failed: suiteFailed,
    total: suiteTests,
    duration: duration
  });
}

/**
 * Discover browser-specific tests
 */
function discoverBrowserTests() {
  const testsDir = path.join(__dirname, '..');
  const browserTestPatterns = [
    'browser.test.js',
    'dom.test.js',
    'tooltip.test.js',
    'ui.test.js',
    'canvas.test.js'
  ];
  
  let browserTests = [];
  
  function findBrowserTests(dir, basePath = '') {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const relativePath = path.join(basePath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && file !== 'node_modules' && file !== '.git') {
        findBrowserTests(filePath, relativePath);
      } else if (file.endsWith('.test.js')) {
        // Check if it's a browser test by pattern or content
        const isBrowserTest = browserTestPatterns.some(pattern => file.includes(pattern.replace('.test.js', '')));
        
        if (isBrowserTest) {
          browserTests.push({
            name: file,
            path: filePath,
            relativePath: relativePath
          });
        } else {
          // Check file content for browser dependencies
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            if (content.includes('document') || content.includes('window') || 
                content.includes('DOM') || content.includes('canvas') ||
                content.includes('HTMLElement')) {
              browserTests.push({
                name: file,
                path: filePath,
                relativePath: relativePath
              });
            }
          } catch (error) {
            // Skip files we can't read
          }
        }
      }
    });
  }
  
  findBrowserTests(testsDir);
  return browserTests;
}

/**
 * Main browser test runner
 */
function runBrowserTests() {
  // Setup browser environment
  const dom = setupBrowserEnvironment();
  
  console.log('\n🔍 DISCOVERING BROWSER TESTS');
  console.log('================================================================================');
  
  const browserTests = discoverBrowserTests();
  
  console.log(`Found ${browserTests.length} browser-dependent test files:`);
  browserTests.forEach(test => {
    console.log(`   • ${test.relativePath}`);
  });
  
  if (browserTests.length === 0) {
    console.log('\n⚠️  No browser-specific tests found');
    return { totalTests: 0, totalPassed: 0, totalFailed: 0 };
  }
  
  console.log('\n🚀 EXECUTING BROWSER TESTS');
  console.log('================================================================================\n');
  
  // Run all browser tests
  browserTests.forEach(testFile => {
    runBrowserTestSuite(testFile);
  });
  
  // Final summary
  console.log('🎯 BROWSER TEST RESULTS SUMMARY');
  console.log('================================================================================');
  console.log(`📊 BROWSER TEST STATISTICS:`);
  console.log(`   Browser Test Files: ${browserTests.length}`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   ✅ Passed: ${totalPassed} (${totalTests > 0 ? ((totalPassed/totalTests)*100).toFixed(1) : 0}%)`);
  console.log(`   ❌ Failed: ${totalFailed} (${totalTests > 0 ? ((totalFailed/totalTests)*100).toFixed(1) : 0}%)`);
  
  console.log('\n================================================================================');
  console.log(`Browser Test Execution Complete! 🌐`);
  
  // Cleanup
  dom.window.close();
  
  return {
    totalTests: totalTests,
    totalPassed: totalPassed,
    totalFailed: totalFailed,
    suiteResults: suiteResults
  };
}

// Export for module usage
module.exports = {
  runBrowserTests,
  setupBrowserEnvironment,
  discoverBrowserTests
};

// Run if called directly
if (require.main === module) {
  runBrowserTests();
}