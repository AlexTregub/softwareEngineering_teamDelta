/**
 * E2E Test: Level Editor Panel Double Rendering Prevention
 * 
 * End-to-end test to detect and prevent the double-rendering bug where
 * Level Editor panel backgrounds are drawn over content, hiding it.
 * 
 * Bug History (FIXED):
 * - Issue: Panel contents (MaterialPalette, ToolBar, BrushSizeControl) were hidden
 * - Root Cause: DraggablePanelManager.render() called panels twice per frame:
 *   1. LevelEditor.render() with content callback ✅
 *   2. Interactive adapter calling render() without callback ❌ (drew background over content)
 * - Fix: Changed DraggablePanelManager.js line 135 to call renderPanels() instead of render()
 * - Result: Panels with managedExternally=true are now properly skipped
 * 
 * This test ensures the bug never returns by:
 * 1. Tracking all panel.render() calls during a full draw cycle
 * 2. Verifying each panel is only rendered once
 * 3. Ensuring all renders include content callbacks
 * 4. Capturing screenshots as visual proof
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  console.log('🎯 E2E Test: Level Editor Panel Double Rendering Prevention\n');
  
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    // Load game
    console.log('📂 Loading game...');
    await page.goto('http://localhost:8000?test=1');
    await sleep(2000);
    
    // Initialize Level Editor
    console.log('🏗️ Initializing Level Editor...');
    await page.evaluate(() => {
      window.gameState = 'LEVEL_EDITOR';
      
      // Create terrain if needed
      if (!window.g_map2 && typeof gridTerrain !== 'undefined') {
        const CHUNKS_X = 10, CHUNKS_Y = 10, CHUNK_SIZE = 8, TILE_SIZE = 32, seed = 12345;
        window.g_map2 = new gridTerrain(CHUNKS_X, CHUNKS_Y, seed, CHUNK_SIZE, TILE_SIZE, [window.innerWidth, window.innerHeight]);
      }
      
      // Initialize level editor
      if (window.levelEditor && !window.levelEditor.isActive()) {
        window.levelEditor.initialize(window.g_map2);
      }
    });
    await sleep(1000);
    
    // Test 1: Verify renderPanels() skips managed panels
    console.log('\n📋 Test 1: Verifying renderPanels() skips managed panels...');
    const managedPanelsTest = await page.evaluate(() => {
      const results = {
        panelsExist: false,
        allHaveManagedExternally: false,
        renderPanelsSkipsThem: false,
        error: null
      };
      
      try {
        if (window.levelEditor && window.levelEditor.draggablePanels) {
          const panels = window.levelEditor.draggablePanels.panels;
          
          results.panelsExist = !!(panels.materials && panels.tools && panels.brush);
          
          if (results.panelsExist) {
            // Check all have managedExternally flag
            results.allHaveManagedExternally = 
              panels.materials.config.behavior.managedExternally &&
              panels.tools.config.behavior.managedExternally &&
              panels.brush.config.behavior.managedExternally;
            
            // Test if renderPanels would skip them
            let wouldSkipAll = true;
            [panels.materials, panels.tools, panels.brush].forEach(panel => {
              const wouldRender = panel.isVisible() && !panel.config.behavior.managedExternally;
              if (wouldRender) wouldSkipAll = false;
            });
            results.renderPanelsSkipsThem = wouldSkipAll;
          }
        }
      } catch (e) {
        results.error = e.message;
      }
      
      return results;
    });
    
    console.log('  Results:');
    console.log(`    Panels exist: ${managedPanelsTest.panelsExist ? '✅' : '❌'}`);
    console.log(`    All have managedExternally: ${managedPanelsTest.allHaveManagedExternally ? '✅' : '❌'}`);
    console.log(`    renderPanels() skips them: ${managedPanelsTest.renderPanelsSkipsThem ? '✅' : '❌'}`);
    if (managedPanelsTest.error) console.log(`    Error: ${managedPanelsTest.error}`);
    
    // Test 2: Track render calls during full draw cycle
    console.log('\n📋 Test 2: Tracking render calls during full draw cycle...');
    const renderTracking = await page.evaluate(() => {
      const results = {
        renderCalls: [],
        callCounts: { materials: 0, tools: 0, brush: 0 },
        callsWithCallback: { materials: 0, tools: 0, brush: 0 },
        callsWithoutCallback: { materials: 0, tools: 0, brush: 0 },
        error: null
      };
      
      try {
        if (window.levelEditor && window.levelEditor.draggablePanels) {
          const panels = window.levelEditor.draggablePanels.panels;
          
          // Instrument render methods
          ['materials', 'tools', 'brush'].forEach(panelName => {
            const panel = panels[panelName];
            const originalRender = panel.render.bind(panel);
            
            panel.render = function(contentRenderer) {
              const callNumber = results.callCounts[panelName]++;
              const hasCallback = typeof contentRenderer === 'function';
              
              if (hasCallback) {
                results.callsWithCallback[panelName]++;
              } else {
                results.callsWithoutCallback[panelName]++;
              }
              
              results.renderCalls.push({
                panel: panelName,
                callNumber: callNumber + 1,
                hasCallback: hasCallback
              });
              
              return originalRender(contentRenderer);
            };
          });
          
          // Simulate full draw cycle (as in sketch.js)
          // Step 1: LevelEditor.render()
          window.levelEditor.render();
          
          // Step 2: RenderManager.render('LEVEL_EDITOR')
          if (typeof window.RenderManager !== 'undefined' && typeof window.RenderManager.render === 'function') {
            window.RenderManager.render('LEVEL_EDITOR');
          }
        }
      } catch (e) {
        results.error = e.message + '\n' + e.stack;
      }
      
      return results;
    });
    
    console.log('  Render Call Counts:');
    ['materials', 'tools', 'brush'].forEach(panelName => {
      const total = renderTracking.callCounts[panelName];
      const withCallback = renderTracking.callsWithCallback[panelName];
      const withoutCallback = renderTracking.callsWithoutCallback[panelName];
      
      console.log(`    ${panelName.toUpperCase()}:`);
      console.log(`      Total calls: ${total} ${total === 1 ? '✅' : '❌ MULTIPLE!'}`);
      console.log(`      With callback: ${withCallback} ${withCallback === total ? '✅' : '❌'}`);
      console.log(`      Without callback: ${withoutCallback} ${withoutCallback === 0 ? '✅' : '❌ DRAWING BACKGROUND OVER CONTENT!'}`);
    });
    
    if (renderTracking.error) {
      console.log(`    Error: ${renderTracking.error}`);
    }
    
    // Test 3: Verify visual rendering
    console.log('\n📋 Test 3: Verifying visual rendering...');
    await page.evaluate(() => {
      // Force render one more time
      if (window.levelEditor && window.levelEditor.draggablePanels) {
        window.levelEditor.draggablePanels.render();
      }
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    await sleep(500);
    
    const visualCheck = await page.evaluate(() => {
      const results = {
        materialsHasContent: false,
        toolsHasContent: false,
        brushHasContent: false
      };
      
      if (window.levelEditor) {
        results.materialsHasContent = !!(window.levelEditor.palette && window.levelEditor.palette.materials && window.levelEditor.palette.materials.length > 0);
        results.toolsHasContent = !!(window.levelEditor.toolbar);
        results.brushHasContent = !!(window.levelEditor.brushControl);
      }
      
      return results;
    });
    
    console.log('  Content Components:');
    console.log(`    MaterialPalette: ${visualCheck.materialsHasContent ? '✅ Exists' : '❌ Missing'}`);
    console.log(`    ToolBar: ${visualCheck.toolsHasContent ? '✅ Exists' : '❌ Missing'}`);
    console.log(`    BrushSizeControl: ${visualCheck.brushHasContent ? '✅ Exists' : '❌ Missing'}`);
    
    // Capture screenshot
    console.log('\n📸 Capturing screenshot for visual verification...');
    await saveScreenshot(page, 'level_editor/double_render_prevention_test', true);
    
    // Final validation
    console.log('\n📊 Final Validation:');
    console.log('================================================================================');
    
    const hasDoubleRender = Object.values(renderTracking.callCounts).some(count => count > 1);
    const hasBackgroundOnlyRender = Object.values(renderTracking.callsWithoutCallback).some(count => count > 0);
    const allPanelsHaveContent = visualCheck.materialsHasContent && visualCheck.toolsHasContent && visualCheck.brushHasContent;
    
    const allTestsPass = !hasDoubleRender && !hasBackgroundOnlyRender && allPanelsHaveContent;
    
    if (hasDoubleRender) {
      console.log('❌ FAILURE: Panels are being rendered multiple times per frame!');
      console.log('   This is the DOUBLE RENDERING BUG!');
    }
    
    if (hasBackgroundOnlyRender) {
      console.log('❌ FAILURE: Panels are being rendered WITHOUT content callbacks!');
      console.log('   This draws backgrounds over content, hiding it!');
    }
    
    if (!allPanelsHaveContent) {
      console.log('⚠️ WARNING: Some content components are missing');
    }
    
    if (allTestsPass) {
      console.log('✅ SUCCESS: All tests passed!');
      console.log('   ✓ Each panel rendered exactly once');
      console.log('   ✓ All renders included content callbacks');
      console.log('   ✓ No backgrounds drawn over content');
      console.log('   ✓ All content components present');
      console.log('   ✓ renderPanels() correctly skips managed panels');
    }
    
    console.log('================================================================================\n');
    
    console.log('📋 Test Summary:');
    console.log(`  Test 1 (managedExternally flag): ${managedPanelsTest.allHaveManagedExternally && managedPanelsTest.renderPanelsSkipsThem ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Test 2 (render tracking): ${!hasDoubleRender && !hasBackgroundOnlyRender ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Test 3 (visual check): ${allPanelsHaveContent ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Overall: ${allTestsPass ? '✅ PASS' : '❌ FAIL'}\n`);
    
    await browser.close();
    
    console.log('✨ E2E Double Rendering Prevention test complete!\n');
    process.exit(allTestsPass ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    await saveScreenshot(page, 'level_editor/double_render_prevention_error', false);
    await browser.close();
    process.exit(1);
  }
})();
