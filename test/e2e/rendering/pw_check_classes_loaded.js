/**
 * pw_check_classes_loaded.js
 * 
 * Simple test to check if all MVC classes are loaded in browser.
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  console.log('🔍 Checking if MVC classes are loaded...\n');
  
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  const errors = [];
  const warnings = [];
  
  // Listen to console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.log(`❌ BROWSER ERROR: ${text}`);
      errors.push(text);
    } else if (type === 'warning') {
      console.log(`⚠️ BROWSER WARNING: ${text}`);
      warnings.push(text);
    }
  });
  
  // Listen to page errors
  page.on('pageerror', error => {
    console.log(`💥 PAGE ERROR: ${error.message}`);
    errors.push(error.message);
  });
  
  try {
    await page.goto('http://localhost:8000');
    await sleep(2000);
    
    const classStatus = await page.evaluate(() => {
      const results = {
        EntityModel: typeof window.EntityModel !== 'undefined',
        EntityView: typeof window.EntityView !== 'undefined',
        EntityController: typeof window.EntityController !== 'undefined',
        AntModel: typeof window.AntModel !== 'undefined',
        AntView: typeof window.AntView !== 'undefined',
        AntController: typeof window.AntController !== 'undefined',
        QueenController: typeof window.QueenController !== 'undefined',
        AntFactory: typeof window.AntFactory !== 'undefined',
        queenAnt: typeof window.queenAnt !== 'undefined',
        ants: typeof window.ants !== 'undefined' ? window.ants.length : 'undefined',
      };
      return results;
    });
    
    console.log('📊 Class Load Status:');
    console.log(JSON.stringify(classStatus, null, 2));
    
    const allLoaded = Object.entries(classStatus)
      .filter(([key, val]) => key !== 'queenAnt' && key !== 'ants')
      .every(([key, val]) => val === true);
    
    if (allLoaded) {
      console.log('\n✅ All MVC classes loaded successfully!');
    } else {
      console.log('\n❌ Some classes failed to load');
      const failed = Object.entries(classStatus)
        .filter(([key, val]) => key !== 'queenAnt' && key !== 'ants' && val !== true)
        .map(([key, val]) => key);
      console.log('Failed classes:', failed.join(', '));
    }
    
    await browser.close();
    process.exit(allLoaded ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    await browser.close();
    process.exit(1);
  }
})();
