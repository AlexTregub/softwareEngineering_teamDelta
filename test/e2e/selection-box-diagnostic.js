/**
 * Selection Box Simple Diagnostic Test
 * Quick test to verify game loads and selection controller exists
 */

const puppeteer = require('puppeteer');

async function runDiagnostic() {
  console.log('🔍 Running Selection Box Diagnostic...\n');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  // Log console messages
  page.on('console', msg => {
    console.log(`[Browser ${msg.type()}]:`, msg.text());
  });
  
  // Log errors
  page.on('pageerror', error => {
    console.error(`[Page Error]:`, error.message);
  });
  
  console.log('📡 Navigating to http://localhost:8000...');
  await page.goto('http://localhost:8000', { waitUntil: 'networkidle2', timeout: 30000 });
  console.log('✅ Page loaded\n');
  
  // Take screenshot of initial state
  await page.screenshot({ path: './test-screenshots/selection-box/diagnostic-initial.png' });
  console.log('📸 Screenshot saved: diagnostic-initial.png\n');
  
  // Wait a bit for game to initialize
  console.log('⏳ Waiting 5 seconds for game initialization...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Check what's available
  const gameState = await page.evaluate(() => {
    const result = {
      // p5.js
      hasP5: typeof window.p5 !== 'undefined',
      hasSetup: typeof window.setup !== 'undefined',
      hasDraw: typeof window.draw !== 'undefined',
      
      // Game state
      gameState: window.gameState,
      hasGameState: typeof window.gameState !== 'undefined',
      
      // Controllers
      hasSelectionBoxController: typeof window.g_selectionBoxController !== 'undefined',
      selectionBoxControllerType: typeof window.g_selectionBoxController,
      hasMouseController: typeof window.g_mouseController !== 'undefined',
      
      // Entities
      hasAnts: typeof window.ants !== 'undefined',
      antsType: typeof window.ants,
      antsLength: Array.isArray(window.ants) ? window.ants.length : 0,
      
      // Canvas
      hasCanvas: document.querySelector('canvas') !== null,
      canvasCount: document.querySelectorAll('canvas').length
    };
    
    // Try to get selection controller info if it exists
    if (window.g_selectionBoxController) {
      try {
        result.selectionControllerDebug = window.g_selectionBoxController.getDebugInfo ? 
          window.g_selectionBoxController.getDebugInfo() : 
          'getDebugInfo not available';
      } catch (e) {
        result.selectionControllerError = e.message;
      }
    }
    
    return result;
  });
  
  console.log('📊 Game State:');
  console.log(JSON.stringify(gameState, null, 2));
  console.log();
  
  // Take screenshot after waiting
  await page.screenshot({ path: './test-screenshots/selection-box/diagnostic-after-wait.png' });
  console.log('📸 Screenshot saved: diagnostic-after-wait.png\n');
  
  // If game is in menu, try to click start
  if (gameState.gameState === 'MENU') {
    console.log('📋 Game is in MENU state, attempting to transition to PLAYING...');
    
    const transitioned = await page.evaluate(() => {
      if (typeof window.gameState !== 'undefined') {
        window.gameState = 'PLAYING';
        return true;
      }
      return false;
    });
    
    if (transitioned) {
      console.log('✅ Transitioned to PLAYING state');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newState = await page.evaluate(() => window.gameState);
      console.log(`📊 New game state: ${newState}\n`);
      
      await page.screenshot({ path: './test-screenshots/selection-box/diagnostic-playing.png' });
      console.log('📸 Screenshot saved: diagnostic-playing.png\n');
    }
  }
  
  // Check if we can access the selection controller methods
  if (gameState.hasSelectionBoxController) {
    console.log('✅ SelectionBoxController is available!');
    console.log('🧪 Testing selection controller API...\n');
    
    const apiTest = await page.evaluate(() => {
      const controller = window.g_selectionBoxController;
      return {
        hasUpdateConfig: typeof controller.updateConfig === 'function',
        hasSetCallbacks: typeof controller.setCallbacks === 'function',
        hasGetSelectionBounds: typeof controller.getSelectionBounds === 'function',
        hasSetEnabled: typeof controller.setEnabled === 'function',
        hasGetDebugInfo: typeof controller.getDebugInfo === 'function',
        hasGetConfig: typeof controller.getConfig === 'function',
        isEnabled: controller.isEnabled ? controller.isEnabled() : 'method not available',
        currentConfig: controller.getConfig ? controller.getConfig() : 'method not available'
      };
    });
    
    console.log('📊 API Test Results:');
    console.log(JSON.stringify(apiTest, null, 2));
    console.log();
    
    if (apiTest.hasUpdateConfig && apiTest.hasSetCallbacks && apiTest.hasGetSelectionBounds) {
      console.log('✅ All new APIs are available!');
    } else {
      console.log('⚠️  Some APIs are missing');
    }
  } else {
    console.log('❌ SelectionBoxController NOT available');
    console.log('   This could mean:');
    console.log('   1. Game hasn\'t fully initialized yet');
    console.log('   2. SelectionBoxController.js not loaded');
    console.log('   3. Error during initialization');
  }
  
  await browser.close();
  console.log('\n✅ Diagnostic complete!');
}

runDiagnostic().catch(error => {
  console.error('\n❌ Diagnostic failed:', error);
  process.exit(1);
});
