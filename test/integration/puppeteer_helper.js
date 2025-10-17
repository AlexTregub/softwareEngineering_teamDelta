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
        console.log('puppeteer_helper: launching system Chrome at', p);
        return await puppeteer.launch({ ...launchArgs, executablePath: p });
      } } catch (e) {}
    }

    // If we got here, none worked
    throw new Error('Could not launch browser for Puppeteer. Ensure puppeteer is installed or set TEST_CHROME_PATH.');
  }
}

// Cross-version sleep helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = { launchBrowser, sleep };
