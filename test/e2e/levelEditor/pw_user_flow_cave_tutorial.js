/**
 * E2E Test: Real User Flow - Loading CaveTutorial.json
 * Step-by-step user workflow with detailed logging at each stage
 * HEADLESS: Runs in headless browser mode
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  // Capture ALL console logs
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    console.log(`[BROWSER ${type.toUpperCase()}] ${text}`);
  });
  
  // Capture errors
  page.on('pageerror', error => {
    console.error(`[PAGE ERROR] ${error.message}`);
  });
  
  try {
    console.log('\n=== STEP 1: Load Game ===');
    await page.goto('http://localhost:8000?test=1');
    await sleep(2000);
    await saveScreenshot(page, 'userflow/step1_game_loaded', true);
    console.log('✓ Game loaded');
    
    console.log('\n=== STEP 2: Check Main Menu ===');
    const menuState = await page.evaluate(() => {
      return {
        gameState: window.gameState,
        hasMainMenu: !!window.mainMenu,
        hasLevelEditor: typeof window.LevelEditor !== 'undefined'
      };
    });
    console.log('Menu state:', JSON.stringify(menuState, null, 2));
    
    if (menuState.gameState !== 'MENU') {
      console.log('Not on menu - clicking to get to menu...');
      // Implementation depends on your menu system
    }
    
    console.log('\n=== STEP 3: Click Level Editor Button ===');
    const editorButtonClicked = await page.evaluate(() => {
      // Find and click Level Editor button in main menu
      if (window.mainMenu && typeof window.mainMenu.handleLevelEditorClick === 'function') {
        console.log('[USER ACTION] Clicking Level Editor button');
        window.mainMenu.handleLevelEditorClick();
        return { clicked: true, method: 'mainMenu.handleLevelEditorClick()' };
      } else if (window.GameState && typeof window.GameState.setState === 'function') {
        console.log('[USER ACTION] Setting state to LEVEL_EDITOR');
        window.GameState.setState('LEVEL_EDITOR');
        return { clicked: true, method: 'GameState.setState()' };
      }
      return { clicked: false, reason: 'No method found to start Level Editor' };
    });
    
    console.log('Editor button click:', JSON.stringify(editorButtonClicked, null, 2));
    
    if (!editorButtonClicked.clicked) {
      throw new Error('Failed to start Level Editor');
    }
    
    await sleep(1000);
    await saveScreenshot(page, 'userflow/step3_editor_started', true);
    
    console.log('\n=== STEP 4: Verify Level Editor Active ===');
    const editorActive = await page.evaluate(() => {
      return {
        gameState: window.gameState,
        hasLevelEditor: !!window.levelEditor,
        hasEntityPainter: !!(window.levelEditor && window.levelEditor.entityPainter),
        hasTerrain: !!(window.levelEditor && window.levelEditor.terrain),
        beforeEntityCount: window.levelEditor && window.levelEditor.entityPainter ? 
          window.levelEditor.entityPainter.placedEntities.length : 0
      };
    });
    
    console.log('Level Editor state:', JSON.stringify(editorActive, null, 2));
    
    if (!editorActive.hasLevelEditor) {
      throw new Error('Level Editor not initialized after clicking button');
    }
    
    if (!editorActive.hasEntityPainter) {
      throw new Error('❌ CRITICAL: Level Editor has no entityPainter! Bug in LevelEditor constructor.');
    }
    
    console.log(`✓ Level Editor active with ${editorActive.beforeEntityCount} entities`);
    
    console.log('\n=== STEP 5: Click Load Button (File Menu) ===');
    const loadButtonClicked = await page.evaluate(() => {
      // Find Load button in file menu or toolbar
      if (window.levelEditor && window.levelEditor.loadDialog && 
          typeof window.levelEditor.loadDialog.openNativeFileDialog === 'function') {
        console.log('[USER ACTION] Opening Load Dialog');
        // We can't actually click the file dialog in headless, so we'll simulate loading
        return { clicked: true, method: 'loadDialog.openNativeFileDialog()' };
      }
      return { clicked: false, reason: 'No loadDialog found' };
    });
    
    console.log('Load button:', JSON.stringify(loadButtonClicked, null, 2));
    
    if (!loadButtonClicked.clicked) {
      throw new Error('Failed to find Load button');
    }
    
    console.log('\n=== STEP 6: Simulate File Selection (CaveTutorial.json) ===');
    // Read the actual file
    const levelPath = path.join(__dirname, '../../../levels/CaveTutorial.json');
    const levelDataString = fs.readFileSync(levelPath, 'utf8');
    const levelData = JSON.parse(levelDataString);
    
    console.log(`✓ Read CaveTutorial.json: ${levelData.entities.length} entities in JSON`);
    console.log('Sample entity:', JSON.stringify(levelData.entities[0], null, 2));
    
    console.log('\n=== STEP 7: Simulate LoadDialog Callback (Real User Flow) ===');
    const loadResult = await page.evaluate((jsonString) => {
      const data = JSON.parse(jsonString);
      const levelEditor = window.levelEditor;
      
      console.log('[LOAD CALLBACK] LoadDialog callback invoked with data');
      console.log('[LOAD CALLBACK] Terrain keys:', Object.keys(data.terrain || {}).join(', '));
      console.log('[LOAD CALLBACK] Entities array length:', data.entities ? data.entities.length : 0);
      console.log('[LOAD CALLBACK] First entity:', JSON.stringify(data.entities[0]));
      
      // Check before state
      const beforeCount = levelEditor.entityPainter.placedEntities.length;
      console.log('[LOAD CALLBACK] Entities before loadFromData:', beforeCount);
      
      // Call loadFromData (EXACT user flow)
      console.log('[LOAD CALLBACK] Calling levelEditor.loadFromData()...');
      levelEditor.loadFromData(data);
      
      // Check after state
      const afterCount = levelEditor.entityPainter.placedEntities.length;
      console.log('[LOAD CALLBACK] Entities after loadFromData:', afterCount);
      
      // Get breakdown
      const entities = levelEditor.entityPainter.placedEntities;
      const breakdown = {
        Ant: entities.filter(e => e.type === 'Ant').length,
        Building: entities.filter(e => e.type === 'Building').length,
        Resource: entities.filter(e => e.type === 'Resource').length
      };
      
      // Get notification message
      const notification = levelEditor.notifications && levelEditor.notifications.current ? 
        levelEditor.notifications.current.message : 'No notification';
      
      return {
        beforeCount,
        afterCount,
        expectedCount: data.entities.length,
        breakdown,
        notification,
        sampleEntity: entities[0] ? {
          type: entities[0].type,
          posX: entities[0].posX,
          posY: entities[0].posY,
          templateId: entities[0].templateId
        } : null
      };
    }, levelDataString);
    
    console.log('\n=== LOAD RESULTS ===');
    console.log(`Before load: ${loadResult.beforeCount} entities`);
    console.log(`After load: ${loadResult.afterCount} entities`);
    console.log(`Expected: ${loadResult.expectedCount} entities`);
    console.log(`Notification: "${loadResult.notification}"`);
    console.log(`Breakdown:`, JSON.stringify(loadResult.breakdown, null, 2));
    
    if (loadResult.sampleEntity) {
      console.log(`Sample loaded entity:`, JSON.stringify(loadResult.sampleEntity, null, 2));
    }
    
    await sleep(500);
    await saveScreenshot(page, 'userflow/step7_after_load', true);
    
    console.log('\n=== ANALYSIS ===');
    
    if (loadResult.afterCount === 0) {
      console.error('❌ BUG CONFIRMED: Zero entities loaded!');
      console.error('The loadFromData() flow is not working.');
      
      // Additional diagnostics
      const diagnostics = await page.evaluate(() => {
        const levelEditor = window.levelEditor;
        return {
          hasTerrainImporter: typeof window.TerrainImporter !== 'undefined',
          terrainExists: !!levelEditor.terrain,
          entityPainterExists: !!levelEditor.entityPainter,
          entityPainterHasImport: !!(levelEditor.entityPainter && 
            typeof levelEditor.entityPainter.importFromJSON === 'function')
        };
      });
      
      console.error('Diagnostics:', JSON.stringify(diagnostics, null, 2));
      
      await saveScreenshot(page, 'userflow/bug_confirmed_zero_entities', false);
      await browser.close();
      process.exit(1);
    }
    
    if (loadResult.afterCount !== loadResult.expectedCount) {
      console.error(`❌ PARTIAL LOAD: ${loadResult.afterCount}/${loadResult.expectedCount} entities`);
      await saveScreenshot(page, 'userflow/partial_load', false);
      await browser.close();
      process.exit(1);
    }
    
    console.log(`✓ SUCCESS: All ${loadResult.afterCount} entities loaded correctly!`);
    await saveScreenshot(page, 'userflow/success_all_entities_loaded', true);
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
    await saveScreenshot(page, 'userflow/test_error', false);
    await browser.close();
    process.exit(1);
  }
})();
