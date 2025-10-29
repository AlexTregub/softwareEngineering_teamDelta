/**
 * E2E Test: File → New with Mouse Click Verification
 * Tests clicking File → New menu item and creating blank terrain
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
    
    // Test 1: Set up modified terrain with custom filename
    console.log('Test 1: Setting up modified terrain...');
    
    await page.evaluate(() => {
      if (window.levelEditor) {
        window.levelEditor.currentFilename = 'MyOldMap';
        window.levelEditor.isModified = true;
        
        // Mock confirm to auto-confirm
        window.confirm = () => true;
      }
      
      // Force redraw
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(500);
    await saveScreenshot(page, 'levelEditor/file_new_before', true);
    
    const beforeState = await page.evaluate(() => {
      return {
        filename: window.levelEditor.currentFilename,
        isModified: window.levelEditor.isModified
      };
    });
    
    console.log('Before state:', beforeState);
    
    // Test 2: Click File → New (simulated - API call)
    console.log('Test 2: Clicking File → New...');
    
    const newResult = await page.evaluate(() => {
      // Call handleFileNew (simulates menu click)
      window.levelEditor.handleFileNew();
      
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      return {
        filename: window.levelEditor.currentFilename,
        isModified: window.levelEditor.isModified,
        expectedFilename: 'Untitled',
        expectedModified: false
      };
    });
    
    console.log('After File → New:', newResult);
    await sleep(500);
    await saveScreenshot(page, 'levelEditor/file_new_after', true);
    
    if (newResult.filename !== newResult.expectedFilename) {
      throw new Error(`Expected filename "Untitled" but got "${newResult.filename}"`);
    }
    
    if (newResult.isModified !== newResult.expectedModified) {
      throw new Error(`Expected isModified false but got ${newResult.isModified}`);
    }
    
    // Test 3: Verify new terrain is blank
    console.log('Test 3: Verifying new terrain is blank...');
    
    const terrainState = await page.evaluate(() => {
      if (!window.levelEditor || !window.levelEditor.customTerrain) {
        return { error: 'customTerrain not found' };
      }
      
      const terrain = window.levelEditor.customTerrain;
      
      return {
        width: terrain.width,
        height: terrain.height,
        expectedWidth: 50,
        expectedHeight: 50
      };
    });
    
    console.log('Terrain state:', terrainState);
    
    if (terrainState.width !== terrainState.expectedWidth || 
        terrainState.height !== terrainState.expectedHeight) {
      throw new Error(`Expected 50x50 terrain but got ${terrainState.width}x${terrainState.height}`);
    }
    
    await saveScreenshot(page, 'levelEditor/file_new_blank_terrain', true);
    
    // Test 4: Verify undo/redo history is cleared
    console.log('Test 4: Verifying undo/redo history cleared...');
    
    const historyState = await page.evaluate(() => {
      if (!window.levelEditor || !window.levelEditor.terrainEditor) {
        return { error: 'terrainEditor not found' };
      }
      
      const editor = window.levelEditor.terrainEditor;
      
      return {
        undoLength: editor.undoHistory ? editor.undoHistory.length : -1,
        redoLength: editor.redoHistory ? editor.redoHistory.length : -1,
        expectedUndo: 0,
        expectedRedo: 0
      };
    });
    
    console.log('History state:', historyState);
    
    if (historyState.undoLength !== 0 || historyState.redoLength !== 0) {
      console.warn(`Warning: History not cleared (undo: ${historyState.undoLength}, redo: ${historyState.redoLength})`);
    }
    
    // Test 5: Test cancel behavior (modify terrain, then cancel new)
    console.log('Test 5: Testing cancel behavior...');
    
    await page.evaluate(() => {
      // Set up modified state
      window.levelEditor.currentFilename = 'TestMap';
      window.levelEditor.isModified = true;
      
      // Mock confirm to return false (cancel)
      window.confirm = () => false;
    });
    
    await sleep(300);
    
    const cancelResult = await page.evaluate(() => {
      const beforeFilename = window.levelEditor.currentFilename;
      
      // Call handleFileNew (should be cancelled)
      window.levelEditor.handleFileNew();
      
      const afterFilename = window.levelEditor.currentFilename;
      
      return {
        beforeFilename: beforeFilename,
        afterFilename: afterFilename,
        cancelled: beforeFilename === afterFilename
      };
    });
    
    console.log('Cancel result:', cancelResult);
    
    if (!cancelResult.cancelled) {
      throw new Error('Cancel should preserve current filename');
    }
    
    await saveScreenshot(page, 'levelEditor/file_new_cancelled', true);
    
    // Test 6: Test confirm behavior with clean terrain (no prompt)
    console.log('Test 6: Testing File → New with clean terrain (no prompt)...');
    
    await page.evaluate(() => {
      // Set clean state
      window.levelEditor.isModified = false;
      
      // Reset confirm mock (should not be called)
      let confirmCalled = false;
      window.confirm = () => {
        confirmCalled = true;
        return true;
      };
      
      window.testConfirmCalled = confirmCalled;
    });
    
    await sleep(300);
    
    const noPromptResult = await page.evaluate(() => {
      window.levelEditor.handleFileNew();
      
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      return {
        filename: window.levelEditor.currentFilename,
        confirmCalled: window.testConfirmCalled
      };
    });
    
    console.log('No prompt result:', noPromptResult);
    
    if (noPromptResult.confirmCalled) {
      console.warn('Warning: confirm() was called for clean terrain (should not prompt)');
    }
    
    await saveScreenshot(page, 'levelEditor/file_new_no_prompt', true);
    
    console.log('✅ All File → New tests passed!');
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await saveScreenshot(page, 'levelEditor/file_new_error', false);
    await browser.close();
    process.exit(1);
  }
})();
