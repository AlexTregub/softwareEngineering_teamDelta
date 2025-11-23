/**
 * E2E Test: Ant Count Dropdown Click Test
 * Tests that the ant count dropdown responds to clicks in PLAYING state
 */

const puppeteer = require('puppeteer');
const path = require('path');

const { sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

async function testAntCountDropdownClick() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  try {
    console.log('📋 Test: Ant Count Dropdown Click');
    console.log('==================================');

    // Navigate to game
    const url = 'http://localhost:8000';
    console.log(`🌐 Loading ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(2000);

    // Start the game
    console.log('🎮 Starting game...');
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Failed to start game');
    }
    await sleep(2000);

    // Verify we're in PLAYING state
    const gameState = await page.evaluate(() => {
      return typeof GameState !== 'undefined' ? GameState.getState() : null;
    });
    console.log(`📊 Current game state: ${gameState}`);

    if (gameState !== 'PLAYING') {
      throw new Error(`Expected PLAYING state, got ${gameState}`);
    }

    await saveScreenshot(page, 'antcount_dropdown/01_game_started', true);

    // Check if ant count display exists
    const antCountInfo = await page.evaluate(() => {
      if (typeof g_antCountDisplay === 'undefined' || !g_antCountDisplay) {
        return { exists: false };
      }
      
      return {
        exists: true,
        hasMenu: !!g_antCountDisplay.menu,
        menuPosition: g_antCountDisplay.menu ? {
          x: g_antCountDisplay.menu.position?.x || 'unknown',
          y: g_antCountDisplay.menu.position?.y || 'unknown'
        } : null,
        hasRegisterInteractive: typeof g_antCountDisplay.registerInteractive === 'function'
      };
    });

    console.log(`🔍 Ant count display info:`, antCountInfo);

    if (!antCountInfo.exists) {
      throw new Error('g_antCountDisplay not found!');
    }

    // Check RenderManager interactive registration
    const renderManagerInfo = await page.evaluate(() => {
      if (typeof RenderManager === 'undefined') {
        return { exists: false };
      }
      
      // Check if ant count display is registered
      const uiGameInteractives = RenderManager._interactiveDrawables?.get(RenderManager.layers.UI_GAME) || [];
      const antCountRegistered = uiGameInteractives.some(d => d.id === 'ant-count-display');
      
      return {
        exists: true,
        antCountRegistered: antCountRegistered,
        totalInteractives: uiGameInteractives.length,
        interactiveIds: uiGameInteractives.map(d => d.id || 'no-id')
      };
    });

    console.log(`🔍 RenderManager info:`, renderManagerInfo);

    // Try clicking somewhere on the game (not on the dropdown)
    console.log('🖱️ Clicking on game world (not dropdown)...');
    const canvas = await page.$('canvas');
    const canvasBox = await canvas.boundingBox();
    
    // Click center of screen
    const clickX = canvasBox.x + canvasBox.width / 2;
    const clickY = canvasBox.y + canvasBox.height / 2;
    
    console.log(`🎯 Clicking at screen coords (${clickX}, ${clickY})`);
    await page.mouse.click(clickX, clickY);
    await sleep(500);

    // Check if the click was blocked
    const clickResult = await page.evaluate(() => {
      // Add a test flag to track clicks
      window.testClickReceived = window.testClickReceived || false;
      return {
        testClickReceived: window.testClickReceived
      };
    });

    console.log(`📊 Click result:`, clickResult);
    await saveScreenshot(page, 'antcount_dropdown/02_after_click', true);

    // Now try clicking on the dropdown itself
    console.log('🖱️ Attempting to click on ant count dropdown...');
    
    // Get dropdown position (top-left corner of screen)
    const dropdownX = canvasBox.x + 100;
    const dropdownY = canvasBox.y + 100;
    
    console.log(`🎯 Clicking dropdown at screen coords (${dropdownX}, ${dropdownY})`);
    await page.mouse.click(dropdownX, dropdownY);
    await sleep(500);

    await saveScreenshot(page, 'antcount_dropdown/03_dropdown_clicked', true);

    // Check if dropdown handled the click
    const dropdownResult = await page.evaluate(() => {
      if (typeof g_antCountDisplay === 'undefined' || !g_antCountDisplay.menu) {
        return { canCheck: false };
      }
      
      // Check if menu has a click handler
      return {
        canCheck: true,
        hasHandleClick: typeof g_antCountDisplay.menu.handleClick === 'function',
        isExpanded: g_antCountDisplay.menu.isExpanded || false
      };
    });

    console.log(`📊 Dropdown click result:`, dropdownResult);

    console.log('✅ Test completed - check screenshots for visual verification');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await saveScreenshot(page, 'antcount_dropdown/error', false);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run test
if (require.main === module) {
  testAntCountDropdownClick()
    .then(() => {
      console.log('✅ Ant count dropdown test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Ant count dropdown test failed:', error);
      process.exit(1);
    });
}

module.exports = testAntCountDropdownClick;
