/**
 * E2E Test: Stack Trace Render Detection
 * 
 * Captures stack traces to find EXACTLY where panel.render() is being called from
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  console.log('🎯 Starting Stack Trace Render Detection Test...\n');
  
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
    
    // Instrument with stack trace capture
    console.log('\n🔍 Capturing stack traces for render calls...\n');
    const stackTraces = await page.evaluate(() => {
      const results = {
        renderCalls: [],
        error: null
      };
      
      if (window.levelEditor && window.levelEditor.draggablePanels) {
        const panels = window.levelEditor.draggablePanels.panels;
        
        // Instrument each panel
        ['materials', 'tools', 'brush'].forEach(panelName => {
          const panel = panels[panelName];
          if (!panel) return;
          
          const originalRender = panel.render.bind(panel);
          let callCount = 0;
          
          panel.render = function(contentRenderer) {
            callCount++;
            const hasCallback = typeof contentRenderer === 'function';
            
            // Capture stack trace
            const stack = new Error().stack;
            const stackLines = stack.split('\n').slice(2, 10); // Skip Error and this function
            
            results.renderCalls.push({
              panel: panelName,
              callNumber: callCount,
              hasCallback: hasCallback,
              stack: stackLines.join('\n')
            });
            
            return originalRender(contentRenderer);
          };
        });
        
        try {
          // Simulate the full draw loop
          window.levelEditor.render();
          if (typeof window.RenderManager !== 'undefined' && typeof window.RenderManager.render === 'function') {
            window.RenderManager.render('LEVEL_EDITOR');
          }
        } catch (e) {
          results.error = e.message + '\n' + e.stack;
        }
      }
      
      return results;
    });
    
    console.log('📊 Render Call Stack Traces:');
    console.log('================================================================================');
    
    stackTraces.renderCalls.forEach((call, index) => {
      console.log(`\n${index + 1}. ${call.panel.toUpperCase()} Panel - Call #${call.callNumber}`);
      console.log(`   Has Callback: ${call.hasCallback ? 'YES (draws content)' : 'NO (background only!) ⚠️'}`);
      console.log('   Stack Trace:');
      console.log(call.stack.split('\n').map(line => '      ' + line).join('\n'));
    });
    
    console.log('\n================================================================================\n');
    
    if (stackTraces.error) {
      console.log(`Error: ${stackTraces.error}\n`);
    }
    
    // Count calls without callbacks
    const callsWithoutCallback = stackTraces.renderCalls.filter(c => !c.hasCallback);
    
    if (callsWithoutCallback.length > 0) {
      console.log(`❌ PROBLEM: ${callsWithoutCallback.length} render() calls WITHOUT callbacks!`);
      console.log('   These are drawing backgrounds over content, hiding it!\n');
      
      callsWithoutCallback.forEach(call => {
        console.log(`   ${call.panel} panel call #${call.callNumber}`);
      });
    } else {
      console.log('✅ All render() calls have callbacks - content should be visible');
    }
    
    console.log('');
    
    await saveScreenshot(page, 'level_editor/stack_trace_test', callsWithoutCallback.length === 0);
    
    await browser.close();
    
    console.log('✨ Stack trace detection complete!\n');
    process.exit(callsWithoutCallback.length > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await saveScreenshot(page, 'level_editor/stack_trace_error', false);
    await browser.close();
    process.exit(1);
  }
})();
