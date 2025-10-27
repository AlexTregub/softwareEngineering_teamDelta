/**
 * E2E Test: Just list all buttons on the menu
 */

const { launchBrowser, sleep } = require('../puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:8000');
  await sleep(3000);
  
  const buttons = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.map(btn => ({
      text: btn.textContent,
      visible: btn.offsetParent !== null,
      id: btn.id,
      className: btn.className
    }));
  });
  
  console.log('\nButtons found on page:');
  console.log(JSON.stringify(buttons, null, 2));
  
  await browser.close();
})();
