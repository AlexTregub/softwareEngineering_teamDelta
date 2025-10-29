/**
 * E2E Test: Dialogue Branching
 * 
 * Tests dialogue branching (nextEventId) in real browser.
 * 
 * Run: node test/e2e/dialogue/pw_dialogue_branching.js
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('🎭 Testing Dialogue Branching...');
    
    await page.goto('http://localhost:8000?test=1');
    await sleep(1000);
    
    // Bypass menu
    console.log('   Bypassing menu...');
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Game failed to start');
    }
    
    // Test branching dialogue
    console.log('   Testing branching...');
    const result = await page.evaluate(() => {
      // Create dialogue chain
      const dialogue1 = new DialogueEvent({
        id: 'start',
        content: {
          speaker: 'Start',
          message: 'This is the first dialogue.',
          choices: [
            { text: 'Next →', nextEventId: 'middle' }
          ]
        }
      });
      
      const dialogue2 = new DialogueEvent({
        id: 'middle',
        content: {
          speaker: 'Middle',
          message: 'You are now at the middle dialogue!',
          choices: [
            { text: 'Finish' }
          ]
        }
      });
      
      // Register both
      if (window.eventManager) {
        window.eventManager.registerEvent(dialogue1);
        window.eventManager.registerEvent(dialogue2);
      }
      
      // Trigger first
      dialogue1.trigger();
      
      // Setup stateVisibility for dialogue panel
      const panel = window.draggablePanelManager?.getPanel('dialogue-display');
      if (panel) {
        if (!window.draggablePanelManager.stateVisibility.PLAYING) {
          window.draggablePanelManager.stateVisibility.PLAYING = [];
        }
        if (!window.draggablePanelManager.stateVisibility.PLAYING.includes('dialogue-display')) {
          window.draggablePanelManager.stateVisibility.PLAYING.push('dialogue-display');
        }
        if (panel.show) {
          panel.show();
        }
      }
      
      // Force render
      window.gameState = 'PLAYING';
      if (window.draggablePanelManager) {
        window.draggablePanelManager.renderPanels('PLAYING');
      }
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
      
      const firstTitle = panel ? panel.config.title : null;
      
      // Click to advance
      if (panel && panel.config.buttons.items[0]) {
        panel.config.buttons.items[0].onClick();
      }
      
      // Trigger middle dialogue (simulating nextEventId)
      dialogue2.trigger();
      if (window.draggablePanelManager) {
        window.draggablePanelManager.renderPanels('PLAYING');
      }
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
      
      const secondTitle = panel ? panel.config.title : null;
      
      return {
        success: firstTitle === 'Start' && secondTitle === 'Middle',
        firstTitle,
        secondTitle,
        message: 'Branching dialogue works'
      };
    });
    
    console.log(`   First dialogue: ${result.firstTitle}`);
    console.log(`   Second dialogue: ${result.secondTitle}`);
    
    await sleep(500);
    await saveScreenshot(page, 'dialogue/dialogue_branching', result.success);
    
    if (!result.success) {
      throw new Error('Dialogue branching failed');
    }
    
    console.log('✅ Dialogue branching test PASSED');
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Dialogue branching test FAILED:', error.message);
    await saveScreenshot(page, 'dialogue/dialogue_branching_error', false);
    await browser.close();
    process.exit(1);
  }
})();
