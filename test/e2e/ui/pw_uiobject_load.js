/**
 * E2E Test: UIObject Browser Load Test
 * 
 * Verifies that UIObject and DynamicGridOverlay load correctly in browser
 * without syntax errors or redeclaration issues.
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  console.log('\n======================================================================');
  console.log('E2E Test: UIObject & DynamicGridOverlay Browser Load');
  console.log('======================================================================\n');

  const browser = await launchBrowser();
  const page = await browser.newPage();

  // Listen for console errors
  const consoleErrors = [];
  const consoleWarnings = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    } else if (msg.type() === 'warning') {
      consoleWarnings.push(msg.text());
    }
  });

  // Listen for page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  // Listen for failed requests
  const failedRequests = [];
  page.on('requestfailed', request => {
    failedRequests.push({
      url: request.url(),
      failure: request.failure().errorText
    });
  });

  try {
    console.log('📄 Loading page...');
    // Use port 5500 (Live Server) or 8000 (http.server)
    const url = 'http://127.0.0.1:5500';
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
    
    await sleep(1000);

    // Check script loading status
    const scriptStatus = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      return {
        total: scripts.length,
        uiObjectLoaded: scripts.some(s => s.src.includes('UIObject.js')),
        gridOverlayLoaded: scripts.some(s => s.src.includes('DynamicGridOverlay.js')),
        allScripts: scripts.slice(0, 10).map(s => ({
          src: s.src.split('/').pop(),
          hasError: s.onerror !== null
        }))
      };
    });

    console.log('\n📜 Script Loading Status:');
    console.log('   Total scripts:', scriptStatus.total);
    console.log('   UIObject.js loaded:', scriptStatus.uiObjectLoaded);
    console.log('   DynamicGridOverlay.js loaded:', scriptStatus.gridOverlayLoaded);

    // Check for UIObject in global scope
    const uiObjectAvailable = await page.evaluate(() => {
      return typeof window.UIObject !== 'undefined';
    });

    // Check for DynamicGridOverlay in global scope
    const gridOverlayAvailable = await page.evaluate(() => {
      return typeof window.DynamicGridOverlay !== 'undefined';
    });

    // Check if DynamicGridOverlay extends UIObject
    const extendsUIObject = await page.evaluate(() => {
      if (typeof window.DynamicGridOverlay === 'undefined' || typeof window.UIObject === 'undefined') {
        return false;
      }
      return window.DynamicGridOverlay.prototype instanceof window.UIObject;
    });

    // Check for redeclaration errors
    const hasRedeclarationError = consoleErrors.some(err => err.includes('redeclaration')) ||
                                   pageErrors.some(err => err.includes('redeclaration'));

    const hasReferenceError = consoleErrors.some(err => err.includes('ReferenceError')) ||
                              pageErrors.some(err => err.includes('ReferenceError'));

    console.log('✅ UIObject available:', uiObjectAvailable);
    console.log('✅ DynamicGridOverlay available:', gridOverlayAvailable);
    console.log('✅ DynamicGridOverlay extends UIObject:', extendsUIObject);
    console.log('✅ No redeclaration errors:', !hasRedeclarationError);
    console.log('✅ No reference errors:', !hasReferenceError);

    if (consoleErrors.length > 0) {
      console.log('\n⚠️  Console Errors:');
      consoleErrors.forEach(err => console.log('   -', err));
    }

    if (pageErrors.length > 0) {
      console.log('\n⚠️  Page Errors:');
      pageErrors.forEach(err => console.log('   -', err));
    }

    if (failedRequests.length > 0) {
      console.log('\n⚠️  Failed Requests:');
      failedRequests.forEach(req => console.log(`   - ${req.url}: ${req.failure}`));
    }

    // Take screenshot
    await saveScreenshot(page, 'ui/uiobject_load', true);

    const allPassed = uiObjectAvailable && 
                      gridOverlayAvailable && 
                      extendsUIObject && 
                      !hasRedeclarationError && 
                      !hasReferenceError;

    console.log('\n======================================================================');
    if (allPassed) {
      console.log('✅ PASS: UIObject and DynamicGridOverlay load correctly');
    } else {
      console.log('❌ FAIL: UIObject/DynamicGridOverlay load issues detected');
    }
    console.log('======================================================================\n');

    await browser.close();
    process.exit(allPassed ? 0 : 1);

  } catch (error) {
    console.error('❌ Test error:', error.message);
    await saveScreenshot(page, 'ui/uiobject_load_error', false);
    await browser.close();
    process.exit(1);
  }
})();
