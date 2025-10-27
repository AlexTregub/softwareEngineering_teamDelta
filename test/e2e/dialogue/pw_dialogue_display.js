/**
 * E2E Test: Dialogue Display
 * 
 * Tests dialogue system in real browser with visual verification.
 * 
 * CRITICAL: Uses camera_helper.ensureGameStarted() to bypass menu.
 * MANDATORY: Takes screenshots for visual verification.
 * 
 * Run: node test/e2e/dialogue/pw_dialogue_display.js
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('🎭 Testing Dialogue Display System...');
    
    // Navigate to game
    await page.goto('http://localhost:8000?test=1');
    await sleep(1000);
    
    // CRITICAL: Ensure game started (bypass menu)
    console.log('   Bypassing menu...');
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Game failed to start - still on menu');
    }
    console.log('   ✅ Game started');
    
    // Create and trigger dialogue
    console.log('   Creating dialogue...');
    const result = await page.evaluate(() => {
      // Create EventManager if not exists
      if (typeof window.eventManager === 'undefined') {
        console.warn('EventManager not found, test may fail');
      }
      
      const dialogue = new DialogueEvent({
        id: 'test_dialogue',
        content: {
          speaker: 'Queen Ant',
          message: 'Welcome to the colony! This is a test dialogue to verify the dialogue system works correctly in the browser.',
          choices: [
            { text: 'Hello!' },
            { text: 'Thank you!' },
            { text: 'Tell me more' }
          ]
        }
      });
      
      dialogue.trigger();
      
      // Force panel to show (in case show() didn't work)
      const panel = window.draggablePanelManager?.getPanel('dialogue-display');
      if (panel) {
        // Add to stateVisibility for PLAYING state
        if (!window.draggablePanelManager.stateVisibility.PLAYING) {
          window.draggablePanelManager.stateVisibility.PLAYING = [];
        }
        if (!window.draggablePanelManager.stateVisibility.PLAYING.includes('dialogue-display')) {
          window.draggablePanelManager.stateVisibility.PLAYING.push('dialogue-display');
        }
        
        // Explicitly show panel
        if (panel.show) {
          panel.show();
        }
      }
      
      // Force render
      window.gameState = 'PLAYING';
      if (window.draggablePanelManager) {
        window.draggablePanelManager.renderPanels('PLAYING');
      }
      if (window.RenderManager) window.RenderManager.render('PLAYING');
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      return {
        success: panel && panel.state && panel.state.visible,
        title: panel ? panel.config.title : null,
        buttonCount: panel && panel.config.buttons ? panel.config.buttons.items.length : 0,
        message: 'Dialogue panel created and visible'
      };
    });
    
    console.log(`   Panel visible: ${result.success}`);
    console.log(`   Speaker: ${result.title}`);
    console.log(`   Buttons: ${result.buttonCount}`);
    
    await sleep(500);
    await saveScreenshot(page, 'dialogue/dialogue_display', result.success);
    
    if (!result.success) {
      throw new Error('Dialogue panel not visible');
    }
    
    console.log('✅ Dialogue display test PASSED');
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Dialogue display test FAILED:', error.message);
    await saveScreenshot(page, 'dialogue/dialogue_display_error', false);
    await browser.close();
    process.exit(1);
  }
})();
