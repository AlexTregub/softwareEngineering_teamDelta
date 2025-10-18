const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Helper to launch a browser: prefer bundled Puppeteer Chromium, fall back to system Chrome
async function launchBrowser(opts = {}) {
  const launchArgs = { headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'], ...opts };
  try {
    return await puppeteer.launch(launchArgs);
  } catch (err) {
    // Try common Windows install locations or TEST_CHROME_PATH env var
    const candidatePaths = [];
    if (process.env.TEST_CHROME_PATH) candidatePaths.push(process.env.TEST_CHROME_PATH);
    candidatePaths.push('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe');
    candidatePaths.push('C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe');
    candidatePaths.push(path.join(process.env['PROGRAMFILES'] || 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'));
    candidatePaths.push(path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe'));

    for (const p of candidatePaths) {
      try { if (p && fs.existsSync(p)) {
        if (process.env.TEST_VERBOSE) console.log('puppeteer_helper: launching system Chrome at', p);
        return await puppeteer.launch({ ...launchArgs, executablePath: p });
      } } catch (e) {}
    }

    // If we got here, none worked
    throw new Error('Could not launch browser for Puppeteer. Ensure puppeteer is installed or set TEST_CHROME_PATH.');
  }
}

// Cross-version sleep helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Save screenshot helper with category support
 * @param {Page} page - Puppeteer page object
 * @param {string} testName - Test name, can include category like 'camera/zoom' or just 'test_name'
 * @param {boolean} pass - true for success/, false for failure/ with timestamp
 * 
 * Examples:
 *   saveScreenshot(page, 'selection_deterministic', true)  -> screenshots/success/selection_deterministic.png
 *   saveScreenshot(page, 'camera/zoom_probe', false)       -> screenshots/failure/fail_camera_zoom_probe_TIMESTAMP.png
 *   saveScreenshot(page, 'camera/zoom_in', true)           -> screenshots/camera/success/zoom_in.png
 * 
 * If testName contains '/', it's treated as category/name:
 *   - Creates category subfolder with success/failure subdirs
 *   - Example: 'camera/zoom' creates screenshots/camera/success/zoom.png
 */
async function saveScreenshot(page, testName, pass = true) {
  try {
    const fs = require('fs');
    const path = require('path');
    const screenshotsDir = path.join(process.cwd(), 'test', 'e2e', 'screenshots');
    
    // Check if testName includes a category (e.g., 'camera/zoom_probe')
    const parts = testName.split('/');
    let category = null;
    let name = testName;
    
    if (parts.length > 1) {
      // Has category: 'camera/zoom_probe' -> category='camera', name='zoom_probe'
      category = parts.slice(0, -1).join('/');
      name = parts[parts.length - 1];
    }
    
    // Determine base directory (with or without category)
    const baseDir = category 
      ? path.join(screenshotsDir, category)
      : screenshotsDir;
    
    const successDir = path.join(baseDir, 'success');
    const failureDir = path.join(baseDir, 'failure');
    
    // Create directories
    try { fs.mkdirSync(successDir, { recursive: true }); } catch (e) {}
    try { fs.mkdirSync(failureDir, { recursive: true }); } catch (e) {}
    
    const pad = (n) => n.toString().padStart(2, '0');
    
    if (pass) {
      const filePath = path.join(successDir, `${name}.png`);
      await page.screenshot({ path: filePath });
      if (process.env.TEST_VERBOSE) console.log('Saved passing screenshot:', filePath);
      return filePath;
    } else {
      const d = new Date();
      const ts = `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
      const filePath = path.join(failureDir, `fail_${name}_${ts}.png`);
      await page.screenshot({ path: filePath });
      if (process.env.TEST_VERBOSE) console.log('Saved failure screenshot:', filePath);
      return filePath;
    }
  } catch (e) {
    try { if (process.env.TEST_VERBOSE) console.error('saveScreenshot failed', e); } catch (ee) {}
    return null;
  }
}

module.exports = { launchBrowser, sleep, saveScreenshot };
