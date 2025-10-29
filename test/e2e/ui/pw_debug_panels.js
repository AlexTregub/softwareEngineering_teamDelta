/**
 * Debug script to inspect what panels actually exist in the browser
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  let browser;

  try {
    console.log('\n🔍 Debugging panel state...\n');

    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.goto('http://localhost:8000?test=1');
    
    // Start game
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Game failed to start');
    }
    await sleep(1000);
    
    // Check PLAYING state panels
    console.log('📋 PLAYING State:');
    const playingInfo = await page.evaluate(() => {
      const manager = window.draggablePanelManager;
      if (!manager) return { error: 'No manager' };
      
      return {
        gameState: window.gameState,
        GameState: window.GameState ? window.GameState.current : 'undefined',
        panelIds: Array.from(manager.panels.keys()),
        stateVisibility: manager.stateVisibility,
        panelStates: Array.from(manager.panels.entries()).map(([id, panel]) => ({
          id,
          visible: panel.state ? panel.state.visible : panel.visible,
          hasState: !!panel.state,
          hasVisible: panel.visible !== undefined
        }))
      };
    });
    
    console.log('  gameState:', playingInfo.gameState);
    console.log('  GameState.current:', playingInfo.GameState);
    console.log('\n  All Panel IDs:', playingInfo.panelIds.join(', '));
    console.log('\n  stateVisibility.PLAYING:', playingInfo.stateVisibility.PLAYING);
    console.log('\n  Panel Details:');
    playingInfo.panelStates.forEach(p => {
      console.log(`    - ${p.id}: visible=${p.visible}, hasState=${p.hasState}`);
    });
    
    // Test a single toggle
    console.log('\n\n🧪 Testing single toggle on "ant_spawn":');
    const toggleResult = await page.evaluate(() => {
      const manager = window.draggablePanelManager;
      const panel = manager.panels.get('ant_spawn');
      
      const before = {
        visible: panel.state ? panel.state.visible : panel.visible,
        inStateVisibility: manager.stateVisibility.PLAYING.includes('ant_spawn')
      };
      
      const result = manager.togglePanel('ant_spawn');
      
      const after = {
        visible: panel.state ? panel.state.visible : panel.visible,
        inStateVisibility: manager.stateVisibility.PLAYING.includes('ant_spawn')
      };
      
      return { before, result, after };
    });
    
    console.log('  Before toggle:', JSON.stringify(toggleResult.before));
    console.log('  Toggle returned:', toggleResult.result);
    console.log('  After toggle:', JSON.stringify(toggleResult.after));
    
    await saveScreenshot(page, 'debug/panel_toggle_debug', true);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
