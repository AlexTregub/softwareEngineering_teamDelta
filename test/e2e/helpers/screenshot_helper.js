/**
 * Screenshot Helper Utilities for E2E Tests
 * Provides screenshot capture and organization
 */

const fs = require('fs');
const path = require('path');

/**
 * Ensure directory exists, create if not
 * @param {string} dirPath - Directory path
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Capture screenshot with evidence categorization
 * @param {Page} page - Puppeteer page
 * @param {string} testName - Test name (e.g., 'entity/construction')
 * @param {boolean} success - Whether test passed
 * @returns {Promise<string>} Screenshot path
 */
async function captureEvidence(page, testName, success = true) {
  const timestamp = Date.now();
  const folder = success ? 'success' : 'failure';
  
  // Parse category from testName
  const parts = testName.split('/');
  const category = parts.length > 1 ? parts[0] : 'general';
  const name = parts.length > 1 ? parts.slice(1).join('_') : parts[0];
  
  const screenshotDir = path.join(
    __dirname,
    '..',
    'screenshots',
    'pre-implementation',
    category,
    folder
  );
  
  ensureDirectoryExists(screenshotDir);
  
  const filename = success 
    ? `${name}.png`
    : `${name}_${timestamp}.png`;
  
  const screenshotPath = path.join(screenshotDir, filename);
  
  await page.screenshot({
    path: screenshotPath,
    fullPage: false
  });
  
  console.log(`📸 Screenshot saved: ${screenshotPath}`);
  return screenshotPath;
}

/**
 * Capture a sequence of screenshots for multi-step tests
 * @param {Page} page - Puppeteer page
 * @param {string} testName - Test name
 * @param {Array<Function>} actions - Array of async action functions
 * @returns {Promise<Array<string>>} Array of screenshot paths
 */
async function captureSequence(page, testName, actions) {
  const screenshots = [];
  
  for (let i = 0; i < actions.length; i++) {
    await actions[i]();
    const stepName = `${testName}_step${i + 1}`;
    const screenshotPath = await captureEvidence(page, `sequences/${stepName}`, true);
    screenshots.push(screenshotPath);
  }
  
  return screenshots;
}

/**
 * Capture comparison screenshots (before/after)
 * @param {Page} page - Puppeteer page
 * @param {string} testName - Test name
 * @param {Function} beforeAction - Action to run before screenshot
 * @param {Function} changeAction - Action that changes state
 * @param {Function} afterAction - Action to run after screenshot
 * @returns {Promise<Object>} Before and after screenshot paths
 */
async function captureComparison(page, testName, beforeAction, changeAction, afterAction = null) {
  // Before state
  if (beforeAction) await beforeAction();
  const beforePath = await captureEvidence(page, `${testName}_before`, true);
  
  // Apply change
  await changeAction();
  
  // After state
  if (afterAction) await afterAction();
  const afterPath = await captureEvidence(page, `${testName}_after`, true);
  
  return {
    before: beforePath,
    after: afterPath
  };
}

/**
 * Capture screenshot with annotations (debug info overlay)
 * @param {Page} page - Puppeteer page
 * @param {string} testName - Test name
 * @param {Object} annotations - Debug info to display
 * @param {boolean} success - Whether test passed
 * @returns {Promise<string>} Screenshot path
 */
async function captureWithAnnotations(page, testName, annotations, success = true) {
  // Inject debug overlay
  await page.evaluate((debugInfo) => {
    const overlay = document.createElement('div');
    overlay.id = 'test-debug-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '10px';
    overlay.style.right = '10px';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    overlay.style.color = '#0f0';
    overlay.style.padding = '10px';
    overlay.style.fontFamily = 'monospace';
    overlay.style.fontSize = '12px';
    overlay.style.zIndex = '99999';
    overlay.style.borderRadius = '5px';
    
    const lines = Object.entries(debugInfo).map(([key, value]) => {
      return `${key}: ${JSON.stringify(value)}`;
    });
    
    overlay.innerHTML = lines.join('<br>');
    document.body.appendChild(overlay);
  }, annotations);
  
  // Capture screenshot
  const screenshotPath = await captureEvidence(page, testName, success);
  
  // Remove overlay
  await page.evaluate(() => {
    const overlay = document.getElementById('test-debug-overlay');
    if (overlay) {
      overlay.remove();
    }
  });
  
  return screenshotPath;
}

/**
 * Clean up old screenshots (older than specified days)
 * @param {number} days - Age threshold in days
 */
function cleanupOldScreenshots(days = 7) {
  const screenshotRoot = path.join(__dirname, '..', 'screenshots');
  const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
  
  function cleanDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        cleanDirectory(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.png')) {
        // Check if filename contains timestamp
        const timestampMatch = entry.name.match(/_(\d{13})\.png$/);
        if (timestampMatch) {
          const timestamp = parseInt(timestampMatch[1]);
          if (timestamp < cutoffTime) {
            fs.unlinkSync(fullPath);
            console.log(`🗑️  Deleted old screenshot: ${fullPath}`);
          }
        }
      }
    }
  }
  
  cleanDirectory(screenshotRoot);
}

/**
 * Generate screenshot report
 * @param {string} category - Test category
 * @returns {Object} Screenshot statistics
 */
function generateScreenshotReport(category = null) {
  const screenshotRoot = path.join(__dirname, '..', 'screenshots', 'pre-implementation');
  const report = {
    total: 0,
    success: 0,
    failure: 0,
    byCategory: {}
  };
  
  function countScreenshots(dir, categoryName) {
    if (!fs.existsSync(dir)) return;
    
    const successDir = path.join(dir, 'success');
    const failureDir = path.join(dir, 'failure');
    
    let successCount = 0;
    let failureCount = 0;
    
    if (fs.existsSync(successDir)) {
      successCount = fs.readdirSync(successDir).filter(f => f.endsWith('.png')).length;
    }
    
    if (fs.existsSync(failureDir)) {
      failureCount = fs.readdirSync(failureDir).filter(f => f.endsWith('.png')).length;
    }
    
    report.byCategory[categoryName] = {
      success: successCount,
      failure: failureCount,
      total: successCount + failureCount
    };
    
    report.success += successCount;
    report.failure += failureCount;
    report.total += successCount + failureCount;
  }
  
  if (category) {
    countScreenshots(path.join(screenshotRoot, category), category);
  } else {
    // Count all categories
    if (fs.existsSync(screenshotRoot)) {
      const categories = fs.readdirSync(screenshotRoot, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);
      
      for (const cat of categories) {
        countScreenshots(path.join(screenshotRoot, cat), cat);
      }
    }
  }
  
  return report;
}

module.exports = {
  captureEvidence,
  captureSequence,
  captureComparison,
  captureWithAnnotations,
  cleanupOldScreenshots,
  generateScreenshotReport,
  ensureDirectoryExists
};
