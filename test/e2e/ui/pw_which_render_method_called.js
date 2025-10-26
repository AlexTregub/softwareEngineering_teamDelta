/**
 * E2E Test: Determine which Tile.render() method is actually called
 * 
 * This test adds logging to BOTH render methods and checks which one executes.
 * This will prove whether the broken render() or correct render(coordSys) is used.
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  console.log('\n🔍 Starting render method detection test...');
  
  let browser;
  let testPassed = false;
  
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    
    // Listen for console messages from the browser
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      console.log('BROWSER:', text);
    });
    
    await page.goto('http://localhost:8000?test=1');
    await sleep(2000);
    
    // Ensure game started
    console.log('Ensuring game started...');
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      console.error('❌ Game failed to start');
      throw new Error('Game did not start properly');
    }
    console.log('✅ Game started successfully');
    
    // Inject logging into BOTH render methods
    const result = await page.evaluate(() => {
      // Get the Tile class
      if (typeof Tile === 'undefined') {
        return { error: 'Tile class not found' };
      }
      
      // Store original methods
      const originalRender = Tile.prototype.render;
      const renderSource = originalRender.toString();
      
      // Check which render method is defined
      const hasNoParamVersion = /render\s*\(\s*\)\s*\{/.test(renderSource);
      const hasCoordSysVersion = /render\s*\(\s*coordSys\s*\)/.test(renderSource);
      
      // Add logging to the prototype
      let noParamCallCount = 0;
      let coordSysCallCount = 0;
      
      // Wrap the render method to detect calls
      Tile.prototype.render = function(...args) {
        if (args.length === 0) {
          console.log('🔴 render() called WITHOUT coordSys parameter!');
          noParamCallCount++;
        } else {
          console.log('🟢 render(coordSys) called WITH parameter!');
          coordSysCallCount++;
        }
        
        // Call original
        try {
          return originalRender.apply(this, args);
        } catch (error) {
          console.log('❌ ERROR in render():', error.message);
          throw error;
        }
      };
      
      return {
        hasNoParamVersion,
        hasCoordSysVersion,
        renderSource: renderSource.substring(0, 500)
      };
    });
    
    console.log('\n📋 Render method analysis:');
    console.log('  Has render() [no params]:', result.hasNoParamVersion);
    console.log('  Has render(coordSys):', result.hasCoordSysVersion);
    console.log('\nFirst 500 chars of render method:');
    console.log(result.renderSource);
    
    if (result.error) {
      console.error('❌', result.error);
      throw new Error(result.error);
    }
    
    // Click Level Editor button
    console.log('\nClicking Level Editor button...');
    const clicked = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        if (btn.textContent.includes('Level Editor')) {
          btn.click();
          return true;
        }
      }
      return false;
    });
    
    if (!clicked) {
      console.error('❌ Level Editor button not found');
      throw new Error('Could not click Level Editor button');
    }
    
    console.log('✅ Level Editor button clicked');
    await sleep(1000);
    
    // Paint a tile to trigger render
    console.log('\nPainting a tile to trigger render...');
    const paintResult = await page.evaluate(() => {
      // Try to paint at a specific location
      const testX = 400;
      const testY = 300;
      
      // Click on material palette first (select moss)
      if (window.draggablePanelManager && window.draggablePanelManager.panels) {
        const matPanel = window.draggablePanelManager.panels.find(p => p.id === 'material-palette-panel');
        if (matPanel && matPanel.content && matPanel.content.selectMaterial) {
          console.log('🎨 Selecting moss material...');
          matPanel.content.selectMaterial('moss');
        }
      }
      
      // Simulate mouse press to paint
      if (typeof mousePressed === 'function') {
        window.mouseX = testX;
        window.mouseY = testY;
        window.mouseIsPressed = true;
        mousePressed();
        console.log('🖌️ Simulated paint at', testX, testY);
      }
      
      // Force redraw
      if (typeof redraw === 'function') {
        redraw();
        redraw();
        redraw();
      }
      
      return { success: true, x: testX, y: testY };
    });
    
    console.log('✅ Paint triggered at', paintResult.x, paintResult.y);
    await sleep(1000);
    
    // Check console logs for which render was called
    console.log('\n📊 CONSOLE LOG ANALYSIS:');
    const noParamCalls = consoleLogs.filter(log => log.includes('render() called WITHOUT')).length;
    const coordSysCalls = consoleLogs.filter(log => log.includes('render(coordSys) called WITH')).length;
    const errors = consoleLogs.filter(log => log.includes('ERROR in render'));
    
    console.log('  render() calls (no param):', noParamCalls);
    console.log('  render(coordSys) calls:', coordSysCalls);
    console.log('  Errors:', errors.length);
    
    if (errors.length > 0) {
      console.log('\n❌ ERRORS DETECTED:');
      errors.forEach(err => console.log('  -', err));
    }
    
    // Save screenshot
    await saveScreenshot(page, 'rendering/which_render_method_called', coordSysCalls > 0);
    
    // Determine result
    if (noParamCalls > 0 && coordSysCalls === 0) {
      console.log('\n🔴 CONFIRMED: render() WITHOUT coordSys is being called!');
      console.log('   This is the BUG - it tries to use undefined TERRAIN_MATERIALS');
      testPassed = false;
    } else if (coordSysCalls > 0) {
      console.log('\n🟢 CONFIRMED: render(coordSys) WITH parameter is being called');
      console.log('   This should work correctly with TERRAIN_MATERIALS_RANGED');
      testPassed = true;
    } else {
      console.log('\n⚠️  WARNING: No render calls detected!');
      testPassed = false;
    }
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    console.error(error.stack);
    testPassed = false;
  } finally {
    if (browser) {
      await browser.close();
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(testPassed ? '✅ TEST COMPLETED' : '❌ TEST FAILED');
    console.log('='.repeat(60));
    
    process.exit(testPassed ? 0 : 1);
  }
})();
