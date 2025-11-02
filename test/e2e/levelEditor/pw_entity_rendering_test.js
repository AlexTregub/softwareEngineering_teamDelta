/**
 * E2E Test: Verify entities are VISIBLE after loading
 * Tests if loaded entities actually render to the canvas
 * HEADLESS: Runs in headless browser mode
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (text.includes('render') || text.includes('Entity') || text.includes('draw')) {
      console.log(`[BROWSER ${type.toUpperCase()}] ${text}`);
    }
  });
  
  try {
    console.log('\n=== STEP 1: Load Game & Start Level Editor ===');
    await page.goto('http://localhost:8000?test=1');
    await sleep(2000);
    
    // Start Level Editor
    await page.evaluate(() => {
      window.GameState.setState('LEVEL_EDITOR');
    });
    await sleep(1000);
    
    console.log('✓ Level Editor started');
    
    console.log('\n=== STEP 2: Load CaveTutorial.json ===');
    const levelPath = path.join(__dirname, '../../../levels/CaveTutorial.json');
    const levelDataString = fs.readFileSync(levelPath, 'utf8');
    const levelData = JSON.parse(levelDataString);
    
    const loadResult = await page.evaluate((jsonString) => {
      const data = JSON.parse(jsonString);
      window.levelEditor.loadFromData(data);
      
      return {
        entitiesLoaded: window.levelEditor.entityPainter.placedEntities.length,
        expectedCount: data.entities.length
      };
    }, levelDataString);
    
    console.log(`✓ Loaded ${loadResult.entitiesLoaded}/${loadResult.expectedCount} entities`);
    
    if (loadResult.entitiesLoaded === 0) {
      throw new Error('No entities loaded - cannot test rendering');
    }
    
    console.log('\n=== STEP 3: Check Rendering System ===');
    const renderingState = await page.evaluate(() => {
      const results = {
        hasRenderManager: typeof window.RenderManager !== 'undefined',
        hasEntityPainter: !!window.levelEditor.entityPainter,
        entityPainterHasRender: !!(window.levelEditor.entityPainter && 
          typeof window.levelEditor.entityPainter.render === 'function'),
        gameState: window.gameState,
        
        // Check if entities have sprites/images
        sampleEntities: window.levelEditor.entityPainter.placedEntities.slice(0, 3).map(e => ({
          type: e.type,
          hasSprite: !!e.sprite,
          spriteType: e.sprite ? typeof e.sprite : 'N/A',
          hasImage: !!e.image,
          imageType: e.image ? typeof e.image : 'N/A',
          posX: e.posX,
          posY: e.posY
        }))
      };
      
      // Check RenderManager structure
      if (window.RenderManager) {
        results.renderManagerType = typeof window.RenderManager;
        results.renderManagerMethods = Object.keys(window.RenderManager).filter(k => 
          typeof window.RenderManager[k] === 'function'
        );
      }
      
      return results;
    });
    
    console.log('\n=== Rendering State ===');
    console.log(JSON.stringify(renderingState, null, 2));
    
    console.log('\n=== STEP 4: Force Multiple Redraws ===');
    await page.evaluate(() => {
      console.log('[REDRAW] Forcing multiple redraws...');
      
      // Force render state
      window.gameState = 'LEVEL_EDITOR';
      
      // Call redraw multiple times (for all layers)
      if (typeof window.redraw === 'function') {
        for (let i = 0; i < 5; i++) {
          window.redraw();
          console.log(`[REDRAW] Redraw call ${i + 1}/5`);
        }
      }
      
      // If RenderManager exists, force render
      if (window.RenderManager && typeof window.RenderManager.render === 'function') {
        window.RenderManager.render('LEVEL_EDITOR');
        console.log('[REDRAW] RenderManager.render() called');
      }
      
      // Manually call entityPainter render if available
      if (window.levelEditor && window.levelEditor.entityPainter && 
          typeof window.levelEditor.entityPainter.render === 'function') {
        console.log('[REDRAW] Calling entityPainter.render() directly...');
        window.levelEditor.entityPainter.render();
        console.log('[REDRAW] entityPainter.render() completed');
      }
    });
    
    await sleep(1000);
    
    console.log('\n=== STEP 5: Check Canvas Content ===');
    // Take screenshot to see what's visible
    await saveScreenshot(page, 'rendering/entities_after_load', true);
    
    // Check if canvas has any drawn content
    const canvasAnalysis = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) {
        return { hasCanvas: false };
      }
      
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Count non-transparent pixels
      let nonTransparentPixels = 0;
      let coloredPixels = 0;
      
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha > 0) {
          nonTransparentPixels++;
          
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Check if it's not just white/black
          if ((r !== 255 || g !== 255 || b !== 255) && 
              (r !== 0 || g !== 0 || b !== 0)) {
            coloredPixels++;
          }
        }
      }
      
      return {
        hasCanvas: true,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        totalPixels: data.length / 4,
        nonTransparentPixels,
        coloredPixels,
        percentageVisible: ((nonTransparentPixels / (data.length / 4)) * 100).toFixed(2)
      };
    });
    
    console.log('\n=== Canvas Analysis ===');
    console.log(JSON.stringify(canvasAnalysis, null, 2));
    
    console.log('\n=== STEP 6: Check if EntityPainter render is called ===');
    const renderCallCheck = await page.evaluate(() => {
      const checks = {
        entityPainterExists: !!window.levelEditor.entityPainter,
        hasRenderMethod: false,
        renderMethodCode: null,
        levelEditorHasRender: false
      };
      
      // Check EntityPainter render method
      if (window.levelEditor.entityPainter) {
        checks.hasRenderMethod = typeof window.levelEditor.entityPainter.render === 'function';
        
        if (checks.hasRenderMethod) {
          checks.renderMethodCode = window.levelEditor.entityPainter.render.toString().substring(0, 200);
        }
      }
      
      // Check if LevelEditor has a render method that calls entityPainter.render()
      if (window.levelEditor && typeof window.levelEditor.render === 'function') {
        checks.levelEditorHasRender = true;
        const renderCode = window.levelEditor.render.toString();
        checks.levelEditorCallsEntityPainter = renderCode.includes('entityPainter');
      }
      
      return checks;
    });
    
    console.log('\n=== Render Method Check ===');
    console.log(JSON.stringify(renderCallCheck, null, 2));
    
    // ANALYSIS
    console.log('\n=== DIAGNOSIS ===');
    
    if (canvasAnalysis.coloredPixels === 0) {
      console.error('❌ BUG CONFIRMED: Canvas has NO colored pixels!');
      console.error('Entities are loaded but NOT rendering to canvas.');
      
      if (!renderCallCheck.hasRenderMethod) {
        console.error('\n❌ ROOT CAUSE: EntityPainter has no render() method!');
      }
      
      if (!renderCallCheck.levelEditorHasRender) {
        console.error('\n❌ ROOT CAUSE: LevelEditor has no render() method!');
      } else if (!renderCallCheck.levelEditorCallsEntityPainter) {
        console.error('\n❌ ROOT CAUSE: LevelEditor.render() does NOT call entityPainter.render()!');
        console.error('The EntityPainter entities will never be drawn.');
      }
      
      await saveScreenshot(page, 'rendering/bug_entities_not_visible', false);
      await browser.close();
      process.exit(1);
    }
    
    console.log(`✓ SUCCESS: Canvas has ${canvasAnalysis.coloredPixels} colored pixels`);
    console.log(`✓ ${canvasAnalysis.percentageVisible}% of canvas is non-transparent`);
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
    await saveScreenshot(page, 'rendering/test_error', false);
    await browser.close();
    process.exit(1);
  }
})();
