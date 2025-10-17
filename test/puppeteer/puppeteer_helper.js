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
// Save screenshot helper: pass=true will overwrite a canonical passing screenshot; pass=false will create a timestamped failure screenshot.
async function saveScreenshot(page, testName, pass = true) {
  try {
    const fs = require('fs');
    const path = require('path');
  const screenshotsDir = path.join(process.cwd(), 'test', 'puppeteer', 'screenshots');
  const successDir = path.join(screenshotsDir, 'success');
  const failureDir = path.join(screenshotsDir, 'failure');
  try { fs.mkdirSync(successDir, { recursive: true }); } catch (e) {}
  try { fs.mkdirSync(failureDir, { recursive: true }); } catch (e) {}
    const pad = (n) => n.toString().padStart(2, '0');
    if (pass) {
      const filePath = path.join(successDir, `${testName}.png`);
      await page.screenshot({ path: filePath });
      if (process.env.TEST_VERBOSE) console.log('Saved passing screenshot:', filePath);
      return filePath;
    } else {
      const d = new Date();
      const ts = `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
      const filePath = path.join(failureDir, `fail_${testName}_${ts}.png`);
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
