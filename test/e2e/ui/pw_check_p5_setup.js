/**
 * Simple test: Does p5.js auto-run setup()?
 */

const { launchBrowser, sleep } = require('../puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', error => console.log('ERROR:', error.message));
  
  await page.goto('http://localhost:8000');
  await sleep(5000);
  
  const result = await page.evaluate(() => {
    return {
      hasP5: typeof p5 !== 'undefined',
      hasSetup: typeof setup !== 'undefined',
      setupCalled: window._SETUP_CALLED || false,  // We can check if sketch sets this
      canvasExists: !!document.querySelector('canvas'),
      bodyHTML: document.body.innerHTML.substring(0, 500)
    };
  });
  
  console.log('\nResult:');
  console.log(JSON.stringify(result, null, 2));
  
  await browser.close();
})();
