/**
 * E2E Test: Double Rendering Detection
 * 
 * Detects if Level Editor panels are being rendered multiple times per frame,
 * causing the background to be drawn over the content.
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  console.log('🎯 Starting Double Rendering Detection Test...\n');
  
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:8000?test=1');
    await sleep(2000);
    
    // Initialize Level Editor
    console.log('🏗️ Initializing Level Editor...');
    await page.evaluate(() => {
      window.gameState = 'LEVEL_EDITOR';
      
      if (!window.g_map2 && typeof gridTerrain !== 'undefined') {
        const CHUNKS_X = 10, CHUNKS_Y = 10, CHUNK_SIZE = 8, TILE_SIZE = 32, seed = 12345;
        window.g_map2 = new gridTerrain(CHUNKS_X, CHUNKS_Y, seed, CHUNK_SIZE, TILE_SIZE, [window.innerWidth, window.innerHeight]);
      }
      
      if (window.levelEditor && !window.levelEditor.isActive()) {
        window.levelEditor.initialize(window.g_map2);
      }
    });
    await sleep(1000);
    
    // Track render calls
    console.log('\n🔍 Tracking panel render calls...');
    const renderInfo = await page.evaluate(() => {
      const results = {
        panelsHaveManagedExternally: {},
        renderCallCounts: {},
        draggablePanelManagerRendersPanels: false
      };
      
      if (window.levelEditor && window.levelEditor.draggablePanels) {
        const panels = window.levelEditor.draggablePanels.panels;
        
        // Check managedExternally flag
        results.panelsHaveManagedExternally.materials = !!panels.materials?.config?.behavior?.managedExternally;
        results.panelsHaveManagedExternally.tools = !!panels.tools?.config?.behavior?.managedExternally;
        results.panelsHaveManagedExternally.brush = !!panels.brush?.config?.behavior?.managedExternally;
        
        // Instrument the render methods to count calls
        let materialsRenderCount = 0;
        let toolsRenderCount = 0;
        let brushRenderCount = 0;
        
        const originalMaterialsRender = panels.materials.render.bind(panels.materials);
        const originalToolsRender = panels.tools.render.bind(panels.tools);
        const originalBrushRender = panels.brush.render.bind(panels.brush);
        
        panels.materials.render = function(...args) {
          materialsRenderCount++;
          return originalMaterialsRender(...args);
        };
        
        panels.tools.render = function(...args) {
          toolsRenderCount++;
          return originalToolsRender(...args);
        };
        
        panels.brush.render = function(...args) {
          brushRenderCount++;
          return originalBrushRender(...args);
        };
        
        // Trigger one frame of rendering
        window.levelEditor.render(); // Should call each panel.render() once
        
        results.renderCallCounts.materials = materialsRenderCount;
        results.renderCallCounts.tools = toolsRenderCount;
        results.renderCallCounts.brush = brushRenderCount;
        
        // Check if DraggablePanelManager.renderPanels would render these panels
        if (window.draggablePanelManager) {
          const visiblePanelIds = window.draggablePanelManager.stateVisibility.LEVEL_EDITOR || [];
          results.levelEditorPanelsInVisibility = visiblePanelIds.filter(id => id.startsWith('level-editor-'));
          
          // Check if renderPanels would skip them
          let wouldRenderMaterials = false;
          let wouldRenderTools = false;
          let wouldRenderBrush = false;
          
          if (panels.materials.isVisible() && !panels.materials.config.behavior.managedExternally) {
            wouldRenderMaterials = true;
          }
          if (panels.tools.isVisible() && !panels.tools.config.behavior.managedExternally) {
            wouldRenderTools = true;
          }
          if (panels.brush.isVisible() && !panels.brush.config.behavior.managedExternally) {
            wouldRenderBrush = true;
          }
          
          results.draggablePanelManagerWouldRender = {
            materials: wouldRenderMaterials,
            tools: wouldRenderTools,
            brush: wouldRenderBrush
          };
        }
      }
      
      return results;
    });
    
    console.log('\n📊 Rendering Analysis:');
    console.log('================================================================================');
    console.log('Panels have managedExternally flag:');
    console.log(`  Materials: ${renderInfo.panelsHaveManagedExternally.materials ? '✅ YES' : '❌ NO'}`);
    console.log(`  Tools: ${renderInfo.panelsHaveManagedExternally.tools ? '✅ YES' : '❌ NO'}`);
    console.log(`  Brush: ${renderInfo.panelsHaveManagedExternally.brush ? '✅ YES' : '❌ NO'}`);
    
    console.log('\nRender call counts (from LevelEditor.render()):');
    console.log(`  Materials: ${renderInfo.renderCallCounts.materials} ${renderInfo.renderCallCounts.materials === 1 ? '✅' : '⚠️ MULTIPLE CALLS!'}`);
    console.log(`  Tools: ${renderInfo.renderCallCounts.tools} ${renderInfo.renderCallCounts.tools === 1 ? '✅' : '⚠️ MULTIPLE CALLS!'}`);
    console.log(`  Brush: ${renderInfo.renderCallCounts.brush} ${renderInfo.renderCallCounts.brush === 1 ? '✅' : '⚠️ MULTIPLE CALLS!'}`);
    
    if (renderInfo.levelEditorPanelsInVisibility) {
      console.log('\nPanels in LEVEL_EDITOR state visibility:');
      console.log(`  ${renderInfo.levelEditorPanelsInVisibility.join(', ')}`);
    }
    
    if (renderInfo.draggablePanelManagerWouldRender) {
      console.log('\nDraggablePanelManager.renderPanels() would render:');
      console.log(`  Materials: ${renderInfo.draggablePanelManagerWouldRender.materials ? '❌ YES (PROBLEM!)' : '✅ NO (skipped)'}`);
      console.log(`  Tools: ${renderInfo.draggablePanelManagerWouldRender.tools ? '❌ YES (PROBLEM!)' : '✅ NO (skipped)'}`);
      console.log(`  Brush: ${renderInfo.draggablePanelManagerWouldRender.brush ? '❌ YES (PROBLEM!)' : '✅ NO (skipped)'}`);
    }
    console.log('================================================================================\n');
    
    // Now test what happens when RenderManager.render() is called
    console.log('🔍 Testing RenderManager.render() behavior...\n');
    const renderManagerTest = await page.evaluate(() => {
      const results = {
        renderCallsBefore: {},
        renderCallsAfter: {},
        renderManagerCalled: false,
        error: null
      };
      
      if (window.levelEditor && window.levelEditor.draggablePanels) {
        const panels = window.levelEditor.draggablePanels.panels;
        
        // Reset counters
        let materialsRenderCount = 0;
        let toolsRenderCount = 0;
        let brushRenderCount = 0;
        
        const originalMaterialsRender = panels.materials.render.bind(panels.materials);
        const originalToolsRender = panels.tools.render.bind(panels.tools);
        const originalBrushRender = panels.brush.render.bind(panels.brush);
        
        panels.materials.render = function(...args) {
          materialsRenderCount++;
          console.log(`Materials.render() called! Count: ${materialsRenderCount}, args:`, args);
          return originalMaterialsRender(...args);
        };
        
        panels.tools.render = function(...args) {
          toolsRenderCount++;
          console.log(`Tools.render() called! Count: ${toolsRenderCount}, args:`, args);
          return originalToolsRender(...args);
        };
        
        panels.brush.render = function(...args) {
          brushRenderCount++;
          console.log(`Brush.render() called! Count: ${brushRenderCount}, args:`, args);
          return originalBrushRender(...args);
        };
        
        results.renderCallsBefore = {
          materials: materialsRenderCount,
          tools: toolsRenderCount,
          brush: brushRenderCount
        };
        
        // Call RenderManager.render()
        try {
          if (typeof window.RenderManager !== 'undefined' && typeof window.RenderManager.render === 'function') {
            window.RenderManager.render('LEVEL_EDITOR');
            results.renderManagerCalled = true;
          }
        } catch (e) {
          results.error = e.message;
        }
        
        results.renderCallsAfter = {
          materials: materialsRenderCount,
          tools: toolsRenderCount,
          brush: brushRenderCount
        };
      }
      
      return results;
    });
    
    console.log('📊 RenderManager.render() Test Results:');
    console.log('================================================================================');
    console.log(`RenderManager.render('LEVEL_EDITOR') called: ${renderManagerTest.renderManagerCalled ? '✅' : '❌'}`);
    if (renderManagerTest.error) console.log(`Error: ${renderManagerTest.error}`);
    
    console.log('\nRender calls AFTER RenderManager.render():');
    console.log(`  Materials: ${renderManagerTest.renderCallsAfter.materials} (${renderManagerTest.renderCallsAfter.materials > renderManagerTest.renderCallsBefore.materials ? '⚠️ INCREASED' : '✅ unchanged'})`);
    console.log(`  Tools: ${renderManagerTest.renderCallsAfter.tools} (${renderManagerTest.renderCallsAfter.tools > renderManagerTest.renderCallsBefore.tools ? '⚠️ INCREASED' : '✅ unchanged'})`);
    console.log(`  Brush: ${renderManagerTest.renderCallsAfter.brush} (${renderManagerTest.renderCallsAfter.brush > renderManagerTest.renderCallsBefore.brush ? '⚠️ INCREASED' : '✅ unchanged'})`);
    
    const doubleRenderDetected = 
      renderManagerTest.renderCallsAfter.materials > renderManagerTest.renderCallsBefore.materials ||
      renderManagerTest.renderCallsAfter.tools > renderManagerTest.renderCallsBefore.tools ||
      renderManagerTest.renderCallsAfter.brush > renderManagerTest.renderCallsBefore.brush;
    
    if (doubleRenderDetected) {
      console.log('\n❌ PROBLEM DETECTED: Panels are being rendered multiple times!');
      console.log('   RenderManager.render() is calling panel.render() even though managedExternally=true');
    } else {
      console.log('\n✅ NO DOUBLE RENDERING: Panels are only rendered once');
      console.log('   RenderManager.render() correctly skips panels with managedExternally=true');
    }
    console.log('================================================================================\n');
    
    await saveScreenshot(page, 'level_editor/double_render_test', !doubleRenderDetected);
    
    await browser.close();
    
    console.log('✨ Double Rendering Detection test complete!\n');
    process.exit(doubleRenderDetected ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await saveScreenshot(page, 'level_editor/double_render_error', false);
    await browser.close();
    process.exit(1);
  }
})();
