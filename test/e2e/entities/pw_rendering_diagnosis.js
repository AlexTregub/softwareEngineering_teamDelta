/**
 * E2E Test: Comprehensive Rendering Diagnosis
 * 
 * Tests multiple scenarios to identify where entity rendering is breaking:
 * 1. EntityRenderer collecting entities
 * 2. Entity.render() being called
 * 3. Canvas drawing operations
 * 4. Camera transform applied correctly
 * 5. Visual verification with screenshots
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  let testResults = {
    antsArrayPopulated: false,
    entityRendererExists: false,
    entitiesCollected: false,
    renderMethodsCalled: false,
    canvasOperations: false,
    cameraTransformApplied: false,
    visualConfirmation: false
  };
  
  try {
    console.log('=== RENDERING DIAGNOSIS TEST ===\n');
    
    // Load game
    console.log('[1/7] Loading game...');
    await page.goto('http://localhost:8000?test=1');
    await sleep(2000);
    
    // Load custom level
    console.log('[2/7] Loading CaveTutorial.json...');
    await page.evaluate(async () => {
      if (typeof loadCustomLevel === 'function') {
        await loadCustomLevel('levels/CaveTutorial.json');
      }
    });
    await sleep(1000);
    
    // TEST 1: Check ants array
    console.log('[3/7] Test 1: Checking ants array...');
    const antsCheck = await page.evaluate(() => {
      return {
        antsLength: Array.isArray(ants) ? ants.length : 0,
        firstAnt: Array.isArray(ants) && ants.length > 0 ? {
          type: ants[0].type,
          x: ants[0].x,
          y: ants[0].y,
          hasRenderMethod: typeof ants[0].render === 'function',
          isActive: ants[0].isActive !== false
        } : null
      };
    });
    testResults.antsArrayPopulated = antsCheck.antsLength > 0;
    console.log(`   ✓ Ants in array: ${antsCheck.antsLength}`);
    console.log(`   ✓ First ant: type=${antsCheck.firstAnt?.type}, pos=(${antsCheck.firstAnt?.x}, ${antsCheck.firstAnt?.y})`);
    console.log(`   ✓ Has render(): ${antsCheck.firstAnt?.hasRenderMethod}`);
    console.log(`   ✓ Is active: ${antsCheck.firstAnt?.isActive}`);
    
    // TEST 2: Check EntityRenderer
    console.log('[4/7] Test 2: Checking EntityRenderer...');
    const rendererCheck = await page.evaluate(() => {
      return {
        exists: typeof EntityRenderer !== 'undefined' && EntityRenderer !== null,
        type: typeof EntityRenderer,
        hasCollectMethod: EntityRenderer && typeof EntityRenderer.collectAnts === 'function',
        hasRenderMethod: EntityRenderer && typeof EntityRenderer.renderAllLayers === 'function',
        cullingEnabled: EntityRenderer && EntityRenderer.config ? EntityRenderer.config.enableFrustumCulling : null
      };
    });
    testResults.entityRendererExists = rendererCheck.exists;
    console.log(`   ✓ EntityRenderer exists: ${rendererCheck.exists}`);
    console.log(`   ✓ Is instance: ${rendererCheck.type === 'object'}`);
    console.log(`   ✓ Has collectAnts(): ${rendererCheck.hasCollectMethod}`);
    console.log(`   ✓ Has renderAllLayers(): ${rendererCheck.hasRenderMethod}`);
    console.log(`   ✓ Frustum culling: ${rendererCheck.cullingEnabled}`);
    
    // TEST 3: Force collection and check
    console.log('[5/7] Test 3: Forcing entity collection...');
    const collectionCheck = await page.evaluate(() => {
      if (!EntityRenderer) return { success: false, reason: 'No EntityRenderer' };
      
      // Manually trigger collection
      EntityRenderer.clearRenderGroups();
      EntityRenderer.collectAnts('IN_GAME');
      
      return {
        success: true,
        totalEntities: EntityRenderer.stats.totalEntities,
        antsGroupLength: EntityRenderer.renderGroups.ANTS.length,
        culledCount: EntityRenderer.stats.culledEntities,
        renderedCount: EntityRenderer.stats.renderedEntities
      };
    });
    testResults.entitiesCollected = collectionCheck.antsGroupLength > 0;
    console.log(`   ✓ Collection success: ${collectionCheck.success}`);
    console.log(`   ✓ Total entities: ${collectionCheck.totalEntities}`);
    console.log(`   ✓ In render groups: ${collectionCheck.antsGroupLength}`);
    console.log(`   ✓ Culled: ${collectionCheck.culledCount}`);
    
    // TEST 4: Intercept render calls
    console.log('[6/7] Test 4: Monitoring render() calls...');
    const renderCheck = await page.evaluate(() => {
      return new Promise((resolve) => {
        let renderCallCount = 0;
        let canvasCallCount = 0;
        
        // Track render calls on first ant
        if (ants.length > 0 && ants[0]) {
          const originalRender = ants[0].render;
          ants[0].render = function() {
            renderCallCount++;
            console.log(`[TEST] Ant.render() called! Count: ${renderCallCount}`);
            if (typeof originalRender === 'function') {
              originalRender.call(this);
            }
          };
        }
        
        // Track canvas operations
        const originalRect = window.rect;
        const originalEllipse = window.ellipse;
        const originalImage = window.image;
        
        window.rect = function() {
          canvasCallCount++;
          if (originalRect) originalRect.apply(this, arguments);
        };
        
        window.ellipse = function() {
          canvasCallCount++;
          if (originalEllipse) originalEllipse.apply(this, arguments);
        };
        
        window.image = function() {
          canvasCallCount++;
          if (originalImage) originalImage.apply(this, arguments);
        };
        
        // Wait for 3 frames
        setTimeout(() => {
          // Restore
          window.rect = originalRect;
          window.ellipse = originalEllipse;
          window.image = originalImage;
          
          resolve({
            renderCallCount,
            canvasCallCount
          });
        }, 200);
      });
    });
    testResults.renderMethodsCalled = renderCheck.renderCallCount > 0;
    testResults.canvasOperations = renderCheck.canvasCallCount > 0;
    console.log(`   ✓ Ant.render() calls: ${renderCheck.renderCallCount}`);
    console.log(`   ✓ Canvas operations: ${renderCheck.canvasCallCount}`);
    
    // TEST 5: Check camera transform
    console.log('[7/7] Test 5: Checking camera transform...');
    const cameraCheck = await page.evaluate(() => {
      const camPos = cameraManager && cameraManager.getCameraPosition ? 
                     cameraManager.getCameraPosition() : null;
      
      let worldToScreenTest = null;
      if (cameraManager && typeof cameraManager.worldToScreen === 'function') {
        const testWorld = { x: 2848, y: 608 }; // Queen position
        const screenPos = cameraManager.worldToScreen(testWorld.x, testWorld.y);
        worldToScreenTest = {
          world: testWorld,
          screen: screenPos,
          shouldBeVisible: (screenPos.screenX >= 0 && screenPos.screenX <= window.innerWidth &&
                           screenPos.screenY >= 0 && screenPos.screenY <= window.innerHeight)
        };
      }
      
      return {
        cameraExists: camPos !== null,
        cameraPos: camPos,
        worldToScreenWorks: worldToScreenTest !== null,
        worldToScreenTest: worldToScreenTest,
        viewport: { width: window.innerWidth, height: window.innerHeight }
      };
    });
    testResults.cameraTransformApplied = cameraCheck.worldToScreenWorks;
    console.log(`   ✓ Camera exists: ${cameraCheck.cameraExists}`);
    console.log(`   ✓ Camera pos: (${cameraCheck.cameraPos?.x}, ${cameraCheck.cameraPos?.y}), zoom=${cameraCheck.cameraPos?.zoom}`);
    console.log(`   ✓ worldToScreen() works: ${cameraCheck.worldToScreenWorks}`);
    if (cameraCheck.worldToScreenTest) {
      console.log(`   ✓ Queen world (${cameraCheck.worldToScreenTest.world.x}, ${cameraCheck.worldToScreenTest.world.y}) → screen (${Math.round(cameraCheck.worldToScreenTest.screen.screenX)}, ${Math.round(cameraCheck.worldToScreenTest.screen.screenY)})`);
      console.log(`   ✓ Should be visible: ${cameraCheck.worldToScreenTest.shouldBeVisible}`);
    }
    
    // Force multiple redraws
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        for (let i = 0; i < 10; i++) window.redraw();
      }
    });
    await sleep(500);
    
    // Take screenshot
    console.log('\n[SCREENSHOT] Capturing current state...');
    await saveScreenshot(page, 'entities/rendering_diagnosis', true);
    testResults.visualConfirmation = true;
    
    // Print summary
    console.log('\n=== TEST RESULTS SUMMARY ===');
    console.log(`1. Ants array populated:      ${testResults.antsArrayPopulated ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`2. EntityRenderer exists:      ${testResults.entityRendererExists ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`3. Entities collected:         ${testResults.entitiesCollected ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`4. Render methods called:      ${testResults.renderMethodsCalled ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`5. Canvas operations:          ${testResults.canvasOperations ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`6. Camera transform applied:   ${testResults.cameraTransformApplied ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`7. Visual confirmation:        ${testResults.visualConfirmation ? '✅ DONE' : '❌ FAIL'}`);
    
    // Determine bottleneck
    console.log('\n=== DIAGNOSIS ===');
    if (!testResults.antsArrayPopulated) {
      console.log('❌ ISSUE: Ants not loading into array');
    } else if (!testResults.entityRendererExists) {
      console.log('❌ ISSUE: EntityRenderer not initialized');
    } else if (!testResults.entitiesCollected) {
      console.log('❌ ISSUE: EntityRenderer not collecting entities (culling problem)');
    } else if (!testResults.renderMethodsCalled) {
      console.log('❌ ISSUE: Entity.render() never called (rendering pipeline broken)');
    } else if (!testResults.canvasOperations) {
      console.log('❌ ISSUE: No canvas drawing operations (render() not drawing)');
    } else if (!testResults.cameraTransformApplied) {
      console.log('❌ ISSUE: Camera transform not applied (entities off-screen)');
    } else {
      console.log('⚠️  All systems working - check screenshot for visual confirmation');
    }
    
    const allPassed = Object.values(testResults).every(v => v === true);
    
    await browser.close();
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ Test error:', error);
    await saveScreenshot(page, 'entities/rendering_diagnosis_error', false);
    await browser.close();
    process.exit(1);
  }
})();
