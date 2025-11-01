/**
 * E2E Test: Level Editor Initialization Debug
 * Specifically checks WHY Level Editor panels are not being registered
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('[E2E] Loading page...');
    await page.goto('http://localhost:8000?test=1');
    await sleep(1000);
    
    // Test 1: Check initial state
    console.log('\n[TEST 1] Checking initial game state...');
    const initialState = await page.evaluate(() => {
      const gs = window.GameState || window.g_gameState;
      return {
        exists: !!gs,
        state: gs ? (typeof gs.getState === 'function' ? gs.getState() : 'unknown') : 'no GameState',
        levelEditorExists: !!window.levelEditor,
        draggablePanelManagerExists: !!window.draggablePanelManager
      };
    });
    console.log('[TEST 1] Initial state:', JSON.stringify(initialState, null, 2));
    
    // Test 2: Check what panels are registered BEFORE entering Level Editor
    console.log('\n[TEST 2] Panels BEFORE entering Level Editor...');
    const panelsBefore = await page.evaluate(() => {
      if (!window.draggablePanelManager || !window.draggablePanelManager.panels) {
        return { found: false };
      }
      const panelsObj = window.draggablePanelManager.panels;
      const panelIds = panelsObj instanceof Map ? Array.from(panelsObj.keys()) : Object.keys(panelsObj);
      return { found: true, panelIds };
    });
    console.log('[TEST 2] Panels before:', JSON.stringify(panelsBefore, null, 2));
    
    // Test 3: Enter Level Editor via GameState.setState
    console.log('\n[TEST 3] Entering Level Editor via GameState.setState...');
    const enterResult = await page.evaluate(() => {
      const gs = window.GameState || window.g_gameState;
      if (!gs || typeof gs.setState !== 'function') {
        return { success: false, reason: 'GameState.setState not available' };
      }
      
      console.log('[DEBUG] Calling GameState.setState(LEVEL_EDITOR)...');
      gs.setState('LEVEL_EDITOR');
      
      return { success: true };
    });
    console.log('[TEST 3] Enter result:', JSON.stringify(enterResult, null, 2));
    
    await sleep(1000); // Wait for initialization
    
    // Test 4: Check if levelEditor.initialize() was called
    console.log('\n[TEST 4] Checking if levelEditor was initialized...');
    const initCheck = await page.evaluate(() => {
      if (!window.levelEditor) {
        return { initialized: false, reason: 'levelEditor not found' };
      }
      
      return {
        initialized: true,
        hasTerrain: !!window.levelEditor.terrain,
        hasPanels: !!window.levelEditor.panels,
        hasLevelEditorPanels: !!window.levelEditor.levelEditorPanels,
        panelsType: window.levelEditor.panels ? window.levelEditor.panels.constructor.name : 'none'
      };
    });
    console.log('[TEST 4] Init check:', JSON.stringify(initCheck, null, 2));
    
    // Test 5: Check panels AFTER entering Level Editor
    console.log('\n[TEST 5] Panels AFTER entering Level Editor...');
    const panelsAfter = await page.evaluate(() => {
      if (!window.draggablePanelManager || !window.draggablePanelManager.panels) {
        return { found: false };
      }
      const panelsObj = window.draggablePanelManager.panels;
      const panelIds = panelsObj instanceof Map ? Array.from(panelsObj.keys()) : Object.keys(panelsObj);
      
      // Also check levelEditor.panels if it exists
      let levelEditorPanelsList = [];
      if (window.levelEditor && window.levelEditor.panels) {
        if (window.levelEditor.panels.panels) {
          const lpObj = window.levelEditor.panels.panels;
          levelEditorPanelsList = Object.keys(lpObj);
        }
      }
      
      return { 
        found: true, 
        draggablePanelIds: panelIds,
        levelEditorPanelIds: levelEditorPanelsList
      };
    });
    console.log('[TEST 5] Panels after:', JSON.stringify(panelsAfter, null, 2));
    
    await saveScreenshot(page, 'level_editor_init/after_enter', true);
    
    // Test 6: Check if LevelEditorPanels.initialize() was called
    console.log('\n[TEST 6] Checking LevelEditorPanels initialization...');
    const panelsInitCheck = await page.evaluate(() => {
      if (!window.levelEditor || !window.levelEditor.levelEditorPanels) {
        return { initialized: false, reason: 'levelEditorPanels not found' };
      }
      
      const lep = window.levelEditor.levelEditorPanels;
      
      return {
        initialized: true,
        hasPanelsObject: !!lep.panels,
        panelKeys: lep.panels ? Object.keys(lep.panels) : []
      };
    });
    console.log('[TEST 6] Panels init check:', JSON.stringify(panelsInitCheck, null, 2));
    
    // Test 7: Try to manually call initialize if not called
    if (!panelsInitCheck.initialized || panelsInitCheck.panelKeys.length === 0) {
      console.log('\n[TEST 7] Manually calling levelEditor.initialize()...');
      const manualInit = await page.evaluate(() => {
        if (!window.levelEditor) {
          return { success: false, reason: 'levelEditor not found' };
        }
        
        try {
          // Check if terrain exists
          if (!window.levelEditor.terrain) {
            // Create terrain
            if (typeof SparseTerrain !== 'undefined') {
              window.levelEditor.terrain = new SparseTerrain(32, 'dirt');
            } else if (typeof CustomTerrain !== 'undefined') {
              window.levelEditor.terrain = new CustomTerrain(50, 50, 32, 'dirt');
            } else {
              return { success: false, reason: 'No terrain class available' };
            }
          }
          
          // Call initialize
          if (typeof window.levelEditor.initialize === 'function') {
            window.levelEditor.initialize(window.levelEditor.terrain);
            return { success: true, method: 'initialize' };
          } else {
            return { success: false, reason: 'initialize() not found' };
          }
        } catch (e) {
          return { success: false, reason: 'Exception: ' + e };
        }
      });
      console.log('[TEST 7] Manual init:', JSON.stringify(manualInit, null, 2));
      
      await sleep(500);
      
      // Check panels again
      const panelsAfterManualInit = await page.evaluate(() => {
        if (!window.draggablePanelManager || !window.draggablePanelManager.panels) {
          return { found: false };
        }
        const panelsObj = window.draggablePanelManager.panels;
        const panelIds = panelsObj instanceof Map ? Array.from(panelsObj.keys()) : Object.keys(panelsObj);
        return { found: true, panelIds };
      });
      console.log('[TEST 7] Panels after manual init:', JSON.stringify(panelsAfterManualInit, null, 2));
      
      await saveScreenshot(page, 'level_editor_init/after_manual_init', true);
    }
    
    console.log('\n[E2E] ✓ Initialization debug complete');
    console.log('[E2E] Check screenshots in test/e2e/screenshots/level_editor_init/');
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('[E2E] ✗ Test failed:', error.message);
    await saveScreenshot(page, 'level_editor_init/error', false);
    await browser.close();
    process.exit(1);
  }
})();
