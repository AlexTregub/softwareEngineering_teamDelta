/**
 * E2E Test: Full Draw Loop Render Tracking
 * 
 * Simulates the actual draw() loop to detect double rendering
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  console.log('🎯 Starting Full Draw Loop Render Tracking Test...\n');
  
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
    
    // Instrument and track render calls during a full draw cycle
    console.log('\n🔍 Tracking render calls during full draw cycle...\n');
    const renderTracking = await page.evaluate(() => {
      const results = {
        renderSequence: [],
        totalRenderCalls: {},
        hasContentCallback: {},
        error: null
      };
      
      if (window.levelEditor && window.levelEditor.draggablePanels) {
        const panels = window.levelEditor.draggablePanels.panels;
        
        // Instrument each panel's render method
        ['materials', 'tools', 'brush'].forEach(panelName => {
          const panel = panels[panelName];
          if (!panel) return;
          
          results.totalRenderCalls[panelName] = 0;
          results.hasContentCallback[panelName] = [];
          
          const originalRender = panel.render.bind(panel);
          panel.render = function(contentRenderer) {
            const callNumber = results.totalRenderCalls[panelName];
            results.totalRenderCalls[panelName]++;
            
            const hasCallback = typeof contentRenderer === 'function';
            results.hasContentCallback[panelName].push(hasCallback);
            
            const caller = hasCallback ? 'WITH callback (LevelEditor)' : 'NO callback (DraggablePanelManager?)';
            results.renderSequence.push(`${panelName}.render() call #${callNumber + 1} - ${caller}`);
            
            return originalRender(contentRenderer);
          };
        });
        
        try {
          // Simulate the full draw loop sequence from sketch.js
          // Step 1: LevelEditor.render()
          results.renderSequence.push('--- STEP 1: levelEditor.render() ---');
          window.levelEditor.render();
          
          // Step 2: RenderManager.render('LEVEL_EDITOR')
          results.renderSequence.push('--- STEP 2: RenderManager.render(LEVEL_EDITOR) ---');
          if (typeof window.RenderManager !== 'undefined' && typeof window.RenderManager.render === 'function') {
            window.RenderManager.render('LEVEL_EDITOR');
          }
          
          results.renderSequence.push('--- END OF DRAW CYCLE ---');
        } catch (e) {
          results.error = e.message + '\n' + e.stack;
        }
      }
      
      return results;
    });
    
    console.log('📊 Render Sequence:');
    console.log('================================================================================');
    renderTracking.renderSequence.forEach(line => console.log(line));
    console.log('================================================================================\n');
    
    console.log('📊 Render Call Summary:');
    console.log('================================================================================');
    Object.keys(renderTracking.totalRenderCalls).forEach(panelName => {
      const count = renderTracking.totalRenderCalls[panelName];
      const callbacks = renderTracking.hasContentCallback[panelName];
      const withCallback = callbacks.filter(c => c).length;
      const withoutCallback = callbacks.filter(c => !c).length;
      
      console.log(`${panelName.toUpperCase()} Panel:`);
      console.log(`  Total render() calls: ${count} ${count === 1 ? '✅' : '❌ MULTIPLE!'}`);
      console.log(`  With callback (content): ${withCallback}`);
      console.log(`  Without callback (background only): ${withoutCallback} ${withoutCallback > 0 ? '❌ PROBLEM!' : '✅'}`);
      console.log('');
    });
    
    if (renderTracking.error) {
      console.log(`Error during test: ${renderTracking.error}\n`);
    }
    
    // Determine if there's a problem
    const hasDoubleRender = Object.values(renderTracking.totalRenderCalls).some(count => count > 1);
    const hasBackgroundOnlyRender = Object.values(renderTracking.hasContentCallback).some(callbacks => callbacks.includes(false));
    
    if (hasDoubleRender) {
      console.log('❌ PROBLEM: Panels are being rendered multiple times per frame!');
    } else if (hasBackgroundOnlyRender) {
      console.log('⚠️ WARNING: Panels are being rendered without content callbacks (background only)');
      console.log('   This would draw the background OVER the content, hiding it!');
    } else {
      console.log('✅ NO ISSUES: Each panel rendered exactly once with content callback');
    }
    console.log('================================================================================\n');
    
    await saveScreenshot(page, 'level_editor/full_draw_loop_test', !hasDoubleRender && !hasBackgroundOnlyRender);
    
    await browser.close();
    
    const testFailed = hasDoubleRender || hasBackgroundOnlyRender;
    console.log(`✨ Full Draw Loop test complete! ${testFailed ? '❌ FAILED' : '✅ PASSED'}\n`);
    process.exit(testFailed ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await saveScreenshot(page, 'level_editor/draw_loop_error', false);
    await browser.close();
    process.exit(1);
  }
})();
