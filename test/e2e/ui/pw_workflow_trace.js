/**
 * E2E Test: Step-by-step Level Editor workflow with screenshots
 * 
 * This test traces the EXACT workflow the user takes:
 * 1. Main menu (screenshot)
 * 2. Call GameState.goToLevelEditor()
 * 3. Wait for state change (screenshot)
 * 4. Check terrain rendering (screenshot)
 * 5. Sample pixels to find when brown appears
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  console.log('\n🔍 Tracing Level Editor workflow step-by-step...\n');
  
  let browser;
  
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    
    // Listen for console messages and errors
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    // STEP 1: Load main menu and wait for setup
    console.log('STEP 1: Loading main menu...');
    await page.goto('http://localhost:8000');
    
    await sleep(5000);  // Wait for page to load
    
    const step1State = await page.evaluate(() => ({
      gameState: window.gameState,
      hasGameState: typeof GameState !== 'undefined',
      hasMap: typeof g_map2 !== 'undefined',
      hasTerrain: window.g_map2 ? true : false,
      canvasExists: !!document.querySelector('canvas'),
      hasAnts: typeof spatialGridManager !== 'undefined' && spatialGridManager && spatialGridManager.getEntityCountByType('Ant') > 0,
      hasP5: typeof p5 !== 'undefined',
      hasSetup: typeof setup !== 'undefined',
      hasDraw: typeof draw !== 'undefined'
    }));
    
    console.log('  Game State:', step1State.gameState);
    console.log('  GameState object exists:', step1State.hasGameState);
    console.log('  g_map2 exists:', step1State.hasMap);
    console.log('  Canvas exists:', step1State.canvasExists);
    console.log('  Ants array exists:', step1State.hasAnts);
    console.log('  p5 exists:', step1State.hasP5);
    console.log('  setup() exists:', step1State.hasSetup);
    console.log('  draw() exists:', step1State.hasDraw);
    
    await saveScreenshot(page, 'workflow/step1_main_menu', true);
    console.log('  ✅ Screenshot saved\n');
    
    // STEP 2: Call goToLevelEditor()
    console.log('STEP 2: Calling GameState.goToLevelEditor()...');
    const step2Result = await page.evaluate(() => {
      if (typeof GameState === 'undefined' || !GameState.goToLevelEditor) {
        return { error: 'GameState.goToLevelEditor not available' };
      }
      
      GameState.goToLevelEditor();
      
      return {
        success: true,
        gameState: window.gameState
      };
    });
    
    if (step2Result.error) {
      throw new Error(step2Result.error);
    }
    
    console.log('  New Game State:', step2Result.gameState);
    
    // Wait for Level Editor to actually activate
    await page.waitForFunction(() => {
      return window.levelEditor && window.levelEditor.active === true;
    }, { timeout: 5000 });
    
    await sleep(1000);
    await saveScreenshot(page, 'workflow/step2_after_state_change', true);
    console.log('  ✅ Screenshot saved\n');
    
    // STEP 3: Check if Level Editor initialized
    console.log('STEP 3: Checking Level Editor initialization...');
    const step3State = await page.evaluate(() => {
      const result = {
        gameState: window.gameState,
        levelEditorExists: typeof levelEditor !== 'undefined',
        levelEditorActive: window.levelEditor ? window.levelEditor.active : false,
        terrainExists: window.g_map2 ? true : false,
        customTerrainExists: typeof g_customTerrain !== 'undefined',
        draggablePanelsExists: typeof draggablePanelManager !== 'undefined'
      };
      
      if (window.levelEditor) {
        result.terrainType = window.levelEditor.terrain ? window.levelEditor.terrain.constructor.name : 'none';
      }
      
      return result;
    });
    
    console.log('  Game State:', step3State.gameState);
    console.log('  Level Editor exists:', step3State.levelEditorExists);
    console.log('  Level Editor active:', step3State.levelEditorActive);
    console.log('  Terrain exists:', step3State.terrainExists);
    console.log('  CustomTerrain exists:', step3State.customTerrainExists);
    console.log('  Terrain type:', step3State.terrainType);
    
    // Force a redraw
    await page.evaluate(() => {
      if (typeof redraw === 'function') {
        redraw(); redraw(); redraw();
      }
    });
    
    await sleep(500);
    await saveScreenshot(page, 'workflow/step3_after_redraw', true);
    console.log('  ✅ Screenshot saved\n');
    
    // STEP 4: Sample terrain pixels
    console.log('STEP 4: Sampling terrain pixels...');
    const pixelSamples = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return { error: 'Canvas not found' };
      
      const ctx = canvas.getContext('2d');
      const samples = [];
      
      // Sample multiple points across the visible area
      const points = [
        { name: 'top-left', x: 100, y: 100 },
        { name: 'top-center', x: 400, y: 100 },
        { name: 'top-right', x: 700, y: 100 },
        { name: 'center', x: 400, y: 300 },
        { name: 'bottom-left', x: 100, y: 500 },
        { name: 'bottom-right', x: 700, y: 500 }
      ];
      
      for (const pt of points) {
        try {
          const imageData = ctx.getImageData(pt.x, pt.y, 1, 1);
          const [r, g, b, a] = imageData.data;
          samples.push({
            name: pt.name,
            x: pt.x,
            y: pt.y,
            r, g, b, a,
            isBrown: Math.abs(r - 120) < 10 && Math.abs(g - 80) < 10 && Math.abs(b - 40) < 10
          });
        } catch (e) {
          samples.push({
            name: pt.name,
            x: pt.x,
            y: pt.y,
            error: e.message
          });
        }
      }
      
      return { samples };
    });
    
    if (pixelSamples.error) {
      console.error('  ❌', pixelSamples.error);
    } else {
      console.log('  Pixel samples:');
      let brownCount = 0;
      for (const sample of pixelSamples.samples) {
        if (sample.error) {
          console.log(`    ${sample.name}: ERROR - ${sample.error}`);
        } else {
          const brownFlag = sample.isBrown ? '🟤 BROWN!' : '';
          console.log(`    ${sample.name} (${sample.x}, ${sample.y}): RGB(${sample.r}, ${sample.g}, ${sample.b}) ${brownFlag}`);
          if (sample.isBrown) brownCount++;
        }
      }
      console.log(`\n  Brown pixels found: ${brownCount} / ${pixelSamples.samples.length}`);
    }
    console.log('');
    
    // STEP 5: Check what terrain system is being used
    console.log('STEP 5: Checking terrain rendering system...');
    const terrainInfo = await page.evaluate(() => {
      const info = {
        mapExists: typeof g_map2 !== 'undefined',
        mapType: window.g_map2 ? g_map2.constructor.name : 'none',
        customTerrainExists: typeof g_customTerrain !== 'undefined',
        customTerrainType: window.g_customTerrain ? g_customTerrain.constructor.name : 'none'
      };
      
      // Check if terrain has render method
      if (window.g_customTerrain) {
        info.customTerrainHasRender = typeof g_customTerrain.render === 'function';
        
        // Get a sample tile
        if (g_customTerrain.getTile) {
          const tile = g_customTerrain.getTile(10, 10);
          if (tile) {
            info.sampleTileMaterial = tile.getMaterial ? tile.getMaterial() : 'unknown';
            info.sampleTileHasRender = typeof tile.render === 'function';
          }
        }
      }
      
      if (window.g_map2) {
        info.mapHasRender = typeof g_map2.render === 'function';
        
        // Get a sample tile
        if (g_map2.getTileAtGridCoords) {
          const tile = g_map2.getTileAtGridCoords(10, 10);
          if (tile) {
            info.sampleMapTileMaterial = tile.getMaterial ? tile.getMaterial() : 'unknown';
            info.sampleMapTileHasRender = typeof tile.render === 'function';
          }
        }
      }
      
      return info;
    });
    
    console.log('  g_map2:');
    console.log('    Exists:', terrainInfo.mapExists);
    console.log('    Type:', terrainInfo.mapType);
    console.log('    Has render():', terrainInfo.mapHasRender);
    console.log('    Sample tile material:', terrainInfo.sampleMapTileMaterial);
    console.log('    Sample tile has render():', terrainInfo.sampleMapTileHasRender);
    
    console.log('\n  g_customTerrain:');
    console.log('    Exists:', terrainInfo.customTerrainExists);
    console.log('    Type:', terrainInfo.customTerrainType);
    console.log('    Has render():', terrainInfo.customTerrainHasRender);
    console.log('    Sample tile material:', terrainInfo.sampleTileMaterial);
    console.log('    Sample tile has render():', terrainInfo.sampleTileHasRender);
    console.log('');
    
    // STEP 6: Check which render method is being called
    console.log('STEP 6: Checking which terrain render is called in draw loop...');
    const renderCheck = await page.evaluate(() => {
      // Inject logging into draw loop
      const originalDraw = window.draw;
      if (!originalDraw) {
        return { error: 'draw() function not found' };
      }
      
      const drawSource = originalDraw.toString();
      
      return {
        drawExists: true,
        drawLength: drawSource.length,
        callsG_map2Render: drawSource.includes('g_map2') && drawSource.includes('render'),
        callsCustomTerrainRender: drawSource.includes('g_customTerrain') && drawSource.includes('render'),
        callsLevelEditorRender: drawSource.includes('levelEditor') && drawSource.includes('render'),
        drawPreview: drawSource.substring(0, 1000)
      };
    });
    
    if (renderCheck.error) {
      console.error('  ❌', renderCheck.error);
    } else {
      console.log('  draw() function analysis:');
      console.log('    Calls g_map2.render():', renderCheck.callsG_map2Render);
      console.log('    Calls g_customTerrain.render():', renderCheck.callsCustomTerrainRender);
      console.log('    Calls levelEditor.render():', renderCheck.callsLevelEditorRender);
    }
    console.log('');
    
    console.log('='.repeat(80));
    console.log('✅ WORKFLOW TRACE COMPLETE');
    console.log('='.repeat(80));
    console.log('\nCheck screenshots in test/e2e/screenshots/workflow/');
    console.log('  - step1_main_menu.png');
    console.log('  - step2_after_state_change.png');
    console.log('  - step3_after_redraw.png');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    if (browser) {
      await browser.close();
    }
    
    process.exit(0);
  }
})();
