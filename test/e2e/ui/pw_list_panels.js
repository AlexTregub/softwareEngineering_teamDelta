/**
 * Debug test to list all registered panels
 */

const { launchBrowser, sleep } = require('../puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:8000?test=1');
  await sleep(1000);
  
  // Enter Level Editor
  await page.evaluate(() => {
    if (window.GameState && typeof window.GameState.setState === 'function') {
      window.GameState.setState('LEVEL_EDITOR');
    }
    if (window.levelEditor && window.g_map2) {
      window.levelEditor.initialize(window.g_map2);
    }
  });
  
  await sleep(1000);
  
  // List all panels
  const panels = await page.evaluate(() => {
    if (!window.draggablePanelManager || !window.draggablePanelManager.panels) {
      return { error: 'draggablePanelManager or panels not found' };
    }
    
    const panelsObj = window.draggablePanelManager.panels;
    
    if (panelsObj instanceof Map) {
      return {
        type: 'Map',
        keys: Array.from(panelsObj.keys()),
        count: panelsObj.size
      };
    } else if (typeof panelsObj === 'object') {
      return {
        type: 'Object',
        keys: Object.keys(panelsObj),
        count: Object.keys(panelsObj).length
      };
    }
    
    return { error: 'Unknown type: ' + typeof panelsObj };
  });
  
  console.log('Registered Panels:');
  console.log(JSON.stringify(panels, null, 2));
  
  await browser.close();
})();
