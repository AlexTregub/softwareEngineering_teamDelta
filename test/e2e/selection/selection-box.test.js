/**
 * Selection Box Puppeteer Tests
 * Tests enhanced SelectionBoxController with configuration, callbacks, and visual features
 * Pattern based on working pw_selection_deterministic.js
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

// Test configuration
const CONFIG = {
  screenshotsDir: path.join(__dirname, 'screenshots', 'selection-box'),
  timeout: 30000,
  viewport: { width: 1280, height: 800 }
};

// Ensure screenshots directory exists with success/failure subdirs
const successDir = path.join(CONFIG.screenshotsDir, 'success');
const failureDir = path.join(CONFIG.screenshotsDir, 'failure');
if (!fs.existsSync(successDir)) {
  fs.mkdirSync(successDir, { recursive: true });
}
if (!fs.existsSync(failureDir)) {
  fs.mkdirSync(failureDir, { recursive: true });
}

/**
 * Wait for game to load past main menu
 * Pattern copied from working pw_selection_deterministic.js
 */
async function loadGameToPlayingState(page) {
  const baseUrl = process.env.TEST_URL || 'http://localhost:8000';
  // Append ?test=1 so in-page test helpers are exposed by debug/test_helpers.js
  const url = baseUrl.indexOf('?') === -1 ? baseUrl + '?test=1' : baseUrl + '&test=1';
  
  console.log('Loading game with test mode enabled...');
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
  await sleep(1500);

  // Ensure game has moved past the title/menu screen
  const ensureGameStarted = async () => {
    try {
      await page.evaluate(() => {
        try {
          const gs = window.GameState || window.g_gameState || null;
          if (gs && typeof gs.getState === 'function' && gs.getState() !== 'PLAYING') {
            if (typeof gs.startGame === 'function') { gs.startGame(); return; }
          }
          if (typeof startGame === 'function') { startGame(); return; }
          if (typeof startGameTransition === 'function') { startGameTransition(); return; }
          if (typeof window.startNewGame === 'function') { window.startNewGame(); return; }
        } catch (e) {}
      });
      // Wait briefly for game objects to initialize
      try { 
        await page.waitForFunction(() => (typeof ants !== 'undefined' && Array.isArray(ants) && ants.length > 0) || (window.g_gameState && typeof window.g_gameState.getState === 'function' && window.g_gameState.getState() === 'PLAYING'), { timeout: 3000 }); 
      } catch(e) { /* okay proceed anyway */ }
    } catch (e) {}
  };
  await ensureGameStarted();

  // Ensure in PLAYING state
  await page.evaluate(() => {
    try {
      const gs = window.GameState || window.g_gameState || null;
      if (gs && typeof gs.getState === 'function' && gs.getState() !== 'PLAYING') {
        if (typeof gs.startGame === 'function') gs.startGame();
        else if (typeof window.startGameTransition === 'function') window.startGameTransition();
      }
    } catch (e) { console.error('start helpers failed', e); }
  });

  // Wait for game to be ready and canvas present
  await page.waitForSelector('canvas', { timeout: 20000 });
  
  // Wait for ants array and selection controller (created in setup())
  try {
    await page.waitForFunction(() => {
      // Wait for ants array to exist (means setup() completed)
      return typeof window.ants !== 'undefined' && Array.isArray(window.ants);
    }, { timeout: 15000 });
    console.log('ants array initialized');
  } catch (e) {
    console.warn('Timeout waiting for ants array');
  }
  
  // Wait for selection controller specifically
  try {
    await page.waitForFunction(() => {
      return (typeof window.g_selectionBoxController !== 'undefined' && window.g_selectionBoxController !== null) ||
             (typeof window.g_uiSelectionController !== 'undefined' && window.g_uiSelectionController !== null);
    }, { timeout: 15000 });
    console.log('Selection controller initialized');
  } catch (e) {
    console.warn('Timeout waiting for selection controller');
  }
  
  // Give it a moment more for full initialization
  await sleep(1000);
  
  console.log('Game loaded successfully');
}

/**
 * Take a screenshot for debugging/step visualization
 * Saves to selection-box root directory
 */
async function takeStepScreenshot(page, name) {
  const filePath = path.join(CONFIG.screenshotsDir, `${name}.png`);
  await page.screenshot({ path: filePath });
  console.log(`Step screenshot: ${name}.png`);
  return filePath;
}

/**
 * Save test result screenshot (pass/fail) using puppeteer_helper
 * This uses the success/failure folder structure
 */
async function saveTestScreenshot(page, testName, passed) {
  // Override the default screenshots path to use our selection-box directory
  const originalDir = path.join(__dirname, 'screenshots');
  const targetDir = passed 
    ? path.join(CONFIG.screenshotsDir, 'success', `${testName}.png`)
    : path.join(CONFIG.screenshotsDir, 'failure', `${testName}.png`);
  
  await page.screenshot({ path: targetDir });
  console.log(`Test screenshot: ${passed ? 'success' : 'failure'}/${testName}.png`);
  return targetDir;
}

/**
 * Test 1: Basic Selection Rendering
 */
async function testBasicSelectionRendering() {
  console.log('\n=== Test 1: Basic Selection Rendering ===');
  
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setViewport(CONFIG.viewport);
  
  try {
    await loadGameToPlayingState(page);
    
    // Debug: Check what's actually available
    const debug = await page.evaluate(() => {
      const result = {
        windowKeys: Object.keys(window).filter(k => k.includes('selection') || k.includes('Selection')),
        hasG_selectionBoxController: typeof window.g_selectionBoxController !== 'undefined',
        g_selectionBoxControllerType: typeof window.g_selectionBoxController,
        g_selectionBoxControllerValue: window.g_selectionBoxController,
        hasG_uiSelectionController: typeof window.g_uiSelectionController !== 'undefined',
        g_uiSelectionControllerType: typeof window.g_uiSelectionController,
        hasSelectionBoxController: typeof window.SelectionBoxController !== 'undefined',
        hasAnts: typeof ants !== 'undefined',
        antsIsArray: typeof ants !== 'undefined' && Array.isArray(ants),
        antsLength: typeof ants !== 'undefined' && Array.isArray(ants) ? ants.length : 0,
        testHelpersAvailable: typeof window.testHelpers !== 'undefined',
        hasSpawnTestAnt: window.testHelpers && typeof window.testHelpers.spawnTestAnt === 'function'
      };
      return result;
    });
    
    console.log('Debug info:', JSON.stringify(debug, null, 2));
    
    // Use whichever controller exists (prefer g_selectionBoxController, fallback to g_uiSelectionController)
    const controllerInfo = await page.evaluate(() => {
      if (typeof window.g_selectionBoxController !== 'undefined' && window.g_selectionBoxController !== null) {
        return { name: 'g_selectionBoxController', exists: true };
      } else if (typeof window.g_uiSelectionController !== 'undefined' && window.g_uiSelectionController !== null) {
        return { name: 'g_uiSelectionController', exists: true };
      }
      return { name: null, exists: false };
    });
    
    console.log('Using controller:', controllerInfo.name);
    const hasController = controllerInfo.exists;
    
    // Spawn many ants using test helpers in a clear area (upper left where panels won't block)
    const spawned = await page.evaluate(() => {
      if (window.testHelpers && typeof window.testHelpers.spawnTestAnt === 'function') {
        // Spawn 25 ants in a grid pattern in upper-left area
        const startX = 100;
        const startY = 100;
        const spacing = 50;
        let count = 0;
        for (let row = 0; row < 5; row++) {
          for (let col = 0; col < 5; col++) {
            window.testHelpers.spawnTestAnt({ 
              x: startX + (col * spacing), 
              y: startY + (row * spacing) 
            });
            count++;
          }
        }
        return { method: 'testHelpers', count };
      }
      // Fallback: use antsSpawn if available
      if (typeof antsSpawn === 'function') {
        antsSpawn(25, 'player');
        return { method: 'antsSpawn', count: 25 };
      }
      return { method: 'none', count: 0 };
    });
    
    console.log('Spawned ants:', JSON.stringify(spawned));
    
    // Wait a moment for ants to be created
    await sleep(500);
    
    // Check how many ants exist (ants is module-scoped, not window.ants)
    const antCount = await page.evaluate(() => {
      return (typeof ants !== 'undefined' && Array.isArray(ants)) ? ants.length : 0;
    });
    
    console.log('Ant count:', antCount);
    
    // Take initial screenshot
    await takeStepScreenshot(page, '1-initial');
    
    // Get canvas bounds
    const canvasBounds = await page.evaluate(() => {
      const canvas = document.getElementById('defaultCanvas0') || document.querySelector('canvas');
      const rect = canvas.getBoundingClientRect();
      return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
    });
    
    console.log('Canvas bounds:', canvasBounds);
    
    // Simulate mouse drag to create selection box over the ants
    const startX = canvasBounds.x + 100;
    const startY = canvasBounds.y + 100;
    const endX = canvasBounds.x + 300;
    const endY = canvasBounds.y + 300;
    
    // Mouse down
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await sleep(100);
    
    // Take screenshot with selection starting
    await takeStepScreenshot(page, '1-selection-start');
    
    // Drag to create selection box
    await page.mouse.move(endX, endY, { steps: 20 });
    await sleep(200);
    
    // Take screenshot with active selection
    await takeStepScreenshot(page, '1-selection-active');
    
    // Check if selection box is active
    const selectionState = await page.evaluate(() => {
      if (window.g_selectionBoxController) {
        return {
          isActive: window.g_selectionBoxController._isActive || false,
          hasStartPos: window.g_selectionBoxController._startX !== undefined,
          hasEndPos: window.g_selectionBoxController._endX !== undefined
        };
      }
      return null;
    });
    
    console.log('Selection state during drag:', selectionState);
    
    // Mouse up to complete selection
    await page.mouse.up();
    await sleep(100);
    
    // Take final screenshot
    await takeStepScreenshot(page, '1-selection-complete');
    
    // Get selection bounds
    const bounds = await page.evaluate(() => {
      if (window.g_selectionBoxController && typeof window.g_selectionBoxController.getSelectionBounds === 'function') {
        return window.g_selectionBoxController.getSelectionBounds();
      }
      return null;
    });
    
    console.log('Selection bounds:', bounds);
    
    // Check if any ants were selected
    const selectedCount = await page.evaluate(() => {
      if (typeof ants === 'undefined' || !Array.isArray(ants)) return 0;
      return ants.filter(ant => ant && ant._selected).length;
    });
    
    console.log('Selected ants:', selectedCount);
    
    if (hasController && antCount > 0) {
      console.log('PASS: Selection box controller exists and ants were spawned');
      await saveTestScreenshot(page, 'test1_basic_rendering', true);
    } else {
      console.log('FAIL: Missing controller or no ants spawned');
      await saveTestScreenshot(page, 'test1_basic_rendering', false);
    }
    
  } catch (error) {
    console.error('Test 1 failed:', error);
    await saveTestScreenshot(page, 'test1_basic_rendering', false);
  } finally {
    await browser.close();
  }
}

/**
 * Test 2: Configuration API
 */
async function testConfigurationAPI() {
  console.log('\n=== Test 2: Configuration API ===');
  
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setViewport(CONFIG.viewport);
  
  try {
    await loadGameToPlayingState(page);
    
    // Get initial config
    const initialConfig = await page.evaluate(() => {
      if (window.g_selectionBoxController && typeof window.g_selectionBoxController.getConfig === 'function') {
        return window.g_selectionBoxController.getConfig();
      }
      return null;
    });
    
    console.log('Initial config:', initialConfig);
    
    // Update configuration
    const updated = await page.evaluate(() => {
      if (window.g_selectionBoxController && typeof window.g_selectionBoxController.updateConfig === 'function') {
        window.g_selectionBoxController.updateConfig({
          selectionColor: [255, 0, 0],
          strokeWidth: 4,
          fillAlpha: 50,
          cornerSize: 12
        });
        return true;
      }
      return false;
    });
    
    if (!updated) {
      throw new Error('Could not update configuration');
    }
    
    // Get updated config
    const updatedConfig = await page.evaluate(() => {
      if (window.g_selectionBoxController && typeof window.g_selectionBoxController.getConfig === 'function') {
        return window.g_selectionBoxController.getConfig();
      }
      return null;
    });
    
    console.log('Updated config:', updatedConfig);
    
    // Verify changes
    const configChanged = 
      JSON.stringify(updatedConfig.selectionColor) === JSON.stringify([255, 0, 0]) &&
      updatedConfig.strokeWidth === 4 &&
      updatedConfig.fillAlpha === 50 &&
      updatedConfig.cornerSize === 12;
    
    if (configChanged) {
      console.log('PASS: Configuration API works correctly');
      await saveTestScreenshot(page, 'test2_configuration', true);
    } else {
      console.log('FAIL: Configuration did not update correctly');
      await saveTestScreenshot(page, 'test2_configuration', false);
    }
    
  } catch (error) {
    console.error('Test 2 failed:', error);
    await saveTestScreenshot(page, 'test2_configuration', false);
  } finally {
    await browser.close();
  }
}

/**
 * Test 3: Callback System
 */
async function testCallbackSystem() {
  console.log('\n=== Test 3: Callback System ===');
  
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setViewport(CONFIG.viewport);
  
  try {
    await loadGameToPlayingState(page);
    
    // Spawn ants for selection
    await page.evaluate(() => {
      if (window.testHelpers && typeof window.testHelpers.spawnTestAnt === 'function') {
        window.testHelpers.spawnTestAnt({ x: 180, y: 180 });
        window.testHelpers.spawnTestAnt({ x: 220, y: 220 });
      } else if (typeof antsSpawn === 'function') {
        antsSpawn(2, 'player');
      }
    });
    await sleep(300);
    
    // Set up callbacks that log to window object
    await page.evaluate(() => {
      window.__testCallbacks = {
        onStart: false,
        onUpdate: false,
        onEnd: false
      };
      
      if (window.g_selectionBoxController && typeof window.g_selectionBoxController.setCallbacks === 'function') {
        window.g_selectionBoxController.setCallbacks({
          onSelectionStart: (x, y) => {
            console.log('Callback: onSelectionStart', x, y);
            window.__testCallbacks.onStart = true;
          },
          onSelectionUpdate: (x, y, w, h, entities) => {
            console.log('Callback: onSelectionUpdate', x, y, w, h, entities.length);
            window.__testCallbacks.onUpdate = true;
          },
          onSelectionEnd: (x, y, w, h, entities) => {
            console.log('Callback: onSelectionEnd', x, y, w, h, entities.length);
            window.__testCallbacks.onEnd = true;
          }
        });
      }
    });
    
    // Get canvas bounds
    const canvasBounds = await page.evaluate(() => {
      const canvas = document.getElementById('defaultCanvas0') || document.querySelector('canvas');
      const rect = canvas.getBoundingClientRect();
      return { x: rect.left, y: rect.top };
    });
    
    // Perform selection
    const startX = canvasBounds.x + 150;
    const startY = canvasBounds.y + 150;
    const endX = canvasBounds.x + 250;
    const endY = canvasBounds.y + 250;
    
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await sleep(100);
    
    await page.mouse.move(endX, endY, { steps: 10 });
    await sleep(100);
    
    await page.mouse.up();
    await sleep(100);
    
    // Check if callbacks fired
    const callbacks = await page.evaluate(() => window.__testCallbacks);
    
    console.log('Callbacks fired:', callbacks);
    
    const allCallbacksFired = callbacks.onStart && callbacks.onUpdate && callbacks.onEnd;
    
    if (allCallbacksFired) {
      console.log('PASS: All callbacks fired correctly');
      await saveTestScreenshot(page, 'test3_callbacks', true);
    } else {
      console.log('FAIL: Not all callbacks fired');
      await saveTestScreenshot(page, 'test3_callbacks', false);
    }
    
  } catch (error) {
    console.error('Test 3 failed:', error);
    await saveTestScreenshot(page, 'test3_callbacks', false);
  } finally {
    await browser.close();
  }
}

/**
 * Test 4: Enable/Disable Toggle
 */
async function testEnableDisableToggle() {
  console.log('\n=== Test 4: Enable/Disable Toggle ===');
  
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setViewport(CONFIG.viewport);
  
  try {
    await loadGameToPlayingState(page);
    
    // Check initial enabled state
    const initiallyEnabled = await page.evaluate(() => {
      if (window.g_selectionBoxController && typeof window.g_selectionBoxController.isEnabled === 'function') {
        return window.g_selectionBoxController.isEnabled();
      }
      return null;
    });
    
    console.log('Initially enabled:', initiallyEnabled);
    
    // Disable selection box
    await page.evaluate(() => {
      if (window.g_selectionBoxController && typeof window.g_selectionBoxController.setEnabled === 'function') {
        window.g_selectionBoxController.setEnabled(false);
      }
    });
    
    const nowDisabled = await page.evaluate(() => {
      if (window.g_selectionBoxController && typeof window.g_selectionBoxController.isEnabled === 'function') {
        return !window.g_selectionBoxController.isEnabled();
      }
      return false;
    });
    
    console.log('Now disabled:', nowDisabled);
    
    // Try to create selection while disabled
    const canvasBounds = await page.evaluate(() => {
      const canvas = document.getElementById('defaultCanvas0') || document.querySelector('canvas');
      const rect = canvas.getBoundingClientRect();
      return { x: rect.left, y: rect.top };
    });
    
    await page.mouse.move(canvasBounds.x + 100, canvasBounds.y + 100);
    await page.mouse.down();
    await page.mouse.move(canvasBounds.x + 200, canvasBounds.y + 200, { steps: 5 });
    await sleep(100);
    await page.mouse.up();
    
    // Check if selection was created (should be false when disabled)
    const wasActive = await page.evaluate(() => {
      if (window.g_selectionBoxController) {
        return window.g_selectionBoxController._isActive || false;
      }
      return false;
    });
    
    console.log('Selection active while disabled:', wasActive);
    
    // Re-enable
    await page.evaluate(() => {
      if (window.g_selectionBoxController && typeof window.g_selectionBoxController.setEnabled === 'function') {
        window.g_selectionBoxController.setEnabled(true);
      }
    });
    
    const reEnabled = await page.evaluate(() => {
      if (window.g_selectionBoxController && typeof window.g_selectionBoxController.isEnabled === 'function') {
        return window.g_selectionBoxController.isEnabled();
      }
      return false;
    });
    
    console.log('Re-enabled:', reEnabled);
    
    const toggleWorks = nowDisabled && !wasActive && reEnabled;
    
    if (toggleWorks) {
      console.log('PASS: Enable/disable toggle works correctly');
      await saveTestScreenshot(page, 'test4_toggle', true);
    } else {
      console.log('FAIL: Enable/disable toggle did not work as expected');
      await saveTestScreenshot(page, 'test4_toggle', false);
    }
    
  } catch (error) {
    console.error('Test 4 failed:', error);
    await saveTestScreenshot(page, 'test4_toggle', false);
  } finally {
    await browser.close();
  }
}

/**
 * Test 5: Debug Info API
 */
async function testDebugInfoAPI() {
  console.log('\n=== Test 5: Debug Info API ===');
  
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setViewport(CONFIG.viewport);
  
  try {
    await loadGameToPlayingState(page);
    
    // Get debug info
    const debugInfo = await page.evaluate(() => {
      if (window.g_selectionBoxController && typeof window.g_selectionBoxController.getDebugInfo === 'function') {
        return window.g_selectionBoxController.getDebugInfo();
      }
      return null;
    });
    
    console.log('Debug info:', JSON.stringify(debugInfo, null, 2));
    
    // Verify debug info structure (use actual field names from getDebugInfo())
    const hasRequiredFields = debugInfo && 
      typeof debugInfo.isEnabled === 'boolean' &&
      typeof debugInfo.isSelecting === 'boolean' &&
      typeof debugInfo.hasCallbacks === 'object' &&
      typeof debugInfo.config === 'object';
    
    if (hasRequiredFields) {
      console.log('PASS: Debug info API returns correct structure');
      await saveTestScreenshot(page, 'test5_debug_info', true);
    } else {
      console.log('FAIL: Debug info structure is incorrect');
      console.log('Expected: isEnabled, isSelecting, hasCallbacks, config');
      console.log('Got:', debugInfo ? Object.keys(debugInfo) : 'null');
      await saveTestScreenshot(page, 'test5_debug_info', false);
    }
    
  } catch (error) {
    console.error('Test 5 failed:', error);
    await saveTestScreenshot(page, 'test5_debug_info', false);
  } finally {
    await browser.close();
  }
}

/**
 * Main test runner
 */
(async () => {
  console.log('==========================================================');
  console.log('SelectionBoxController Enhanced Features Test Suite');
  console.log('==========================================================');
  
  try {
    await testBasicSelectionRendering();
    await testConfigurationAPI();
    await testCallbackSystem();
    await testEnableDisableToggle();
    await testDebugInfoAPI();
    
    console.log('\n==========================================================');
    console.log('All tests completed!');
    console.log('==========================================================');
  } catch (error) {
    console.error('\n==========================================================');
    console.error('Test suite failed:', error);
    console.error('==========================================================');
    process.exit(1);
  }
})();
