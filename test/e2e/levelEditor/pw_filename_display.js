/**
 * E2E Test: Filename Display
 * Tests filename display rendering and updates in Level Editor
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to app...');
    await page.goto('http://localhost:8000?test=1');
    
    // CRITICAL: Ensure game started
    console.log('Ensuring game started...');
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Game failed to start - still on menu');
    }
    
    console.log('Switching to LEVEL_EDITOR state...');
    await page.evaluate(() => {
      if (window.GameState && window.GameState.setState) {
        window.GameState.setState('LEVEL_EDITOR');
      } else {
        window.gameState = 'LEVEL_EDITOR';
      }
    });
    
    await sleep(1000);
    
    // Test 1: Default "Untitled" filename display
    console.log('Test 1: Checking default "Untitled" filename...');
    const defaultFilename = await page.evaluate(() => {
      if (!window.levelEditor) {
        return { error: 'levelEditor not found' };
      }
      
      const filename = window.levelEditor.getFilename();
      
      // Force render to ensure display is shown
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      return {
        filename: filename,
        expected: 'Untitled',
        match: filename === 'Untitled'
      };
    });
    
    console.log('Default filename result:', defaultFilename);
    await saveScreenshot(page, 'levelEditor/filename_display_default', defaultFilename.match);
    
    if (!defaultFilename.match) {
      throw new Error(`Expected "Untitled" but got "${defaultFilename.filename}"`);
    }
    
    // Test 2: Filename updates after setting
    console.log('Test 2: Setting filename to "TestMap"...');
    const updatedFilename = await page.evaluate(() => {
      window.levelEditor.setFilename('TestMap');
      
      const filename = window.levelEditor.getFilename();
      
      // Force render
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      return {
        filename: filename,
        expected: 'TestMap',
        match: filename === 'TestMap'
      };
    });
    
    console.log('Updated filename result:', updatedFilename);
    await saveScreenshot(page, 'levelEditor/filename_display_updated', updatedFilename.match);
    
    if (!updatedFilename.match) {
      throw new Error(`Expected "TestMap" but got "${updatedFilename.filename}"`);
    }
    
    // Test 3: .json extension stripping
    console.log('Test 3: Setting filename with .json extension...');
    const strippedFilename = await page.evaluate(() => {
      window.levelEditor.setFilename('MyLevel.json');
      
      const filename = window.levelEditor.getFilename();
      
      // Force render
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      return {
        filename: filename,
        expected: 'MyLevel',
        match: filename === 'MyLevel'
      };
    });
    
    console.log('Stripped filename result:', strippedFilename);
    await saveScreenshot(page, 'levelEditor/filename_extension_stripped', strippedFilename.match);
    
    if (!strippedFilename.match) {
      throw new Error(`Expected "MyLevel" but got "${strippedFilename.filename}"`);
    }
    
    // Test 4: Visual verification - filename at top-center
    console.log('Test 4: Visual verification of filename display position...');
    await page.evaluate(() => {
      // Set a distinctive filename
      window.levelEditor.setFilename('VISUAL_TEST');
      
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(500);
    await saveScreenshot(page, 'levelEditor/filename_display_visual', true);
    
    console.log('✅ All filename display tests passed!');
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await saveScreenshot(page, 'levelEditor/filename_display_error', false);
    await browser.close();
    process.exit(1);
  }
})();
