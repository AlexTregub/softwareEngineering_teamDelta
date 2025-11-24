/**
 * E2E Test: Menu Click Functionality
 * Tests that menu buttons respond to clicks after refactoring
 */

const puppeteer = require('puppeteer');
const path = require('path');

const { sleep, saveScreenshot } = require('../puppeteer_helper');

async function testMenuClicks() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  try {
    console.log('📋 Test: Menu Click Functionality');
    console.log('================================');

    // Navigate to game
    const url = 'http://localhost:8000';
    console.log(`🌐 Loading ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(2000);

    // Verify we're on menu
    const gameState = await page.evaluate(() => {
      return typeof GameState !== 'undefined' ? GameState.getState() : null;
    });
    console.log(`📊 Current game state: ${gameState}`);

    if (gameState !== 'MENU') {
      throw new Error(`Expected MENU state, got ${gameState}`);
    }

    // Take screenshot of menu
    await saveScreenshot(page, 'menu_click/01_initial_menu', true);

    // Check if menu buttons exist
    const menuButtonInfo = await page.evaluate(() => {
      if (typeof menuButtons === 'undefined' || !Array.isArray(menuButtons)) {
        return { exists: false, count: 0 };
      }
      return { 
        exists: true, 
        count: menuButtons.length,
        buttons: menuButtons.map(btn => ({
          text: btn.caption || btn.text || 'Unknown',
          x: btn.x,
          y: btn.y,
          width: btn.width,
          height: btn.height,
          isHovered: btn.isHovered
        }))
      };
    });

    console.log(`🔘 Menu buttons found: ${menuButtonInfo.count}`);
    if (menuButtonInfo.buttons) {
      menuButtonInfo.buttons.forEach((btn, i) => {
        console.log(`   ${i + 1}. "${btn.text}" at (${btn.x}, ${btn.y}) ${btn.width}x${btn.height}`);
      });
    }

    if (!menuButtonInfo.exists || menuButtonInfo.count === 0) {
      throw new Error('No menu buttons found!');
    }

    // Check if handleButtonsClick function exists
    const handleButtonsClickExists = await page.evaluate(() => {
      return typeof handleButtonsClick === 'function';
    });
    console.log(`🔧 handleButtonsClick function exists: ${handleButtonsClickExists}`);

    // Try to hover and click a button
    console.log('🖱️ Testing button hover and click...');
    
    // Get canvas element
    const canvas = await page.$('canvas');
    if (!canvas) {
      throw new Error('Canvas not found!');
    }

    // Get canvas bounding box
    const canvasBox = await canvas.boundingBox();
    console.log(`📐 Canvas: ${canvasBox.width}x${canvasBox.height} at (${canvasBox.x}, ${canvasBox.y})`);

    // Calculate button center in screen coordinates
    const firstButton = menuButtonInfo.buttons[0];
    const buttonScreenX = canvasBox.x + (canvasBox.width / 2) + firstButton.x + (firstButton.width / 2);
    const buttonScreenY = canvasBox.y + (canvasBox.height / 2) + firstButton.y + (firstButton.height / 2);

    console.log(`🎯 Clicking button "${firstButton.text}" at screen coords (${buttonScreenX}, ${buttonScreenY})`);

    // Move mouse to button (to trigger hover)
    await page.mouse.move(buttonScreenX, buttonScreenY);
    await sleep(200);

    // Check if button is now hovered
    const isHovered = await page.evaluate(() => {
      return typeof menuButtons !== 'undefined' && menuButtons[0] ? menuButtons[0].isHovered : false;
    });
    console.log(`🔍 Button hover state: ${isHovered}`);

    await saveScreenshot(page, 'menu_click/02_button_hover', true);

    // Click the button
    await page.mouse.click(buttonScreenX, buttonScreenY);
    console.log('✅ Button clicked');
    
    // Check if mousePressed was called
    const mousePressedCalled = await page.evaluate(() => {
      // Check if our mousePressed function was executed
      return window.lastMousePressedCall || 'not tracked';
    });
    console.log(`📞 mousePressed called: ${mousePressedCalled}`);
    
    // Check if handleButtonsClick was called
    const handleButtonsClickCalled = await page.evaluate(() => {
      // Temporarily add tracking
      const originalHandleButtonsClick = handleButtonsClick;
      let callCount = 0;
      window.handleButtonsClick = function() {
        callCount++;
        return originalHandleButtonsClick();
      };
      return callCount;
    });
    console.log(`📞 handleButtonsClick calls: ${handleButtonsClickCalled}`);
    
    await sleep(1000);

    // Check if state changed
    const newGameState = await page.evaluate(() => {
      return typeof GameState !== 'undefined' ? GameState.getState() : null;
    });
    console.log(`📊 Game state after click: ${newGameState}`);

    await saveScreenshot(page, 'menu_click/03_after_click', true);

    // Verify state transition (Start Game button should change state)
    if (firstButton.text && firstButton.text.toLowerCase().includes('start') && newGameState === 'MENU') {
      console.log('⚠️ WARNING: Clicked Start Game but still in MENU state');
      console.log('   This suggests the button click was not processed');
      throw new Error('Button click did not trigger state change');
    }

    console.log('✅ Test passed: Menu buttons are clickable');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await saveScreenshot(page, 'menu_click/error', false);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run test
if (require.main === module) {
  testMenuClicks()
    .then(() => {
      console.log('✅ All menu click tests passed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Menu click tests failed:', error);
      process.exit(1);
    });
}

module.exports = testMenuClicks;
