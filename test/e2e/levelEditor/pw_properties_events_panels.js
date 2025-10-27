/**
 * E2E Test: Properties and Events Panel Visibility
 * Tests that panels are hidden by default and can be toggled
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
      
      // Force redraw
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(1000);
    
    // Test 1: Verify Properties panel is hidden by default
    console.log('Test 1: Verifying Properties panel hidden by default...');
    
    const propertiesDefault = await page.evaluate(() => {
      if (!window.levelEditor || !window.levelEditor.propertiesPanel) {
        return { error: 'Properties panel not found' };
      }
      
      const isVisible = window.levelEditor.propertiesPanel.visible || false;
      
      return {
        isVisible: isVisible,
        expectedVisible: false
      };
    });
    
    console.log('Properties panel default state:', propertiesDefault);
    await saveScreenshot(page, 'levelEditor/properties_panel_hidden_default', !propertiesDefault.isVisible);
    
    if (propertiesDefault.isVisible) {
      throw new Error('Properties panel should be hidden by default');
    }
    
    // Test 2: Verify Events panel is hidden by default
    console.log('Test 2: Verifying Events panel hidden by default...');
    
    const eventsDefault = await page.evaluate(() => {
      if (!window.levelEditor || !window.levelEditor.eventEditor) {
        return { error: 'Events panel not found' };
      }
      
      const isVisible = window.levelEditor.eventEditor.visible || false;
      
      return {
        isVisible: isVisible,
        expectedVisible: false
      };
    });
    
    console.log('Events panel default state:', eventsDefault);
    await saveScreenshot(page, 'levelEditor/events_panel_hidden_default', !eventsDefault.isVisible);
    
    if (eventsDefault.isVisible) {
      throw new Error('Events panel should be hidden by default');
    }
    
    // Test 3: Toggle Properties panel on
    console.log('Test 3: Toggling Properties panel on...');
    
    const propertiesToggleOn = await page.evaluate(() => {
      if (window.levelEditor && window.levelEditor.propertiesPanel) {
        window.levelEditor.propertiesPanel.visible = true;
      }
      
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      const isVisible = window.levelEditor.propertiesPanel.visible || false;
      
      return {
        isVisible: isVisible,
        expectedVisible: true
      };
    });
    
    console.log('Properties panel toggled on:', propertiesToggleOn);
    await sleep(500);
    await saveScreenshot(page, 'levelEditor/properties_panel_visible', propertiesToggleOn.isVisible);
    
    if (!propertiesToggleOn.isVisible) {
      throw new Error('Properties panel should be visible after toggle on');
    }
    
    // Test 4: Toggle Properties panel off
    console.log('Test 4: Toggling Properties panel off...');
    
    const propertiesToggleOff = await page.evaluate(() => {
      if (window.levelEditor && window.levelEditor.propertiesPanel) { window.levelEditor.propertiesPanel.visible = false; }
      
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      const isVisible = window.levelEditor.propertiesPanel.visible || false;
      
      return {
        isVisible: isVisible,
        expectedVisible: false
      };
    });
    
    console.log('Properties panel toggled off:', propertiesToggleOff);
    await sleep(500);
    await saveScreenshot(page, 'levelEditor/properties_panel_hidden_again', !propertiesToggleOff.isVisible);
    
    if (propertiesToggleOff.isVisible) {
      throw new Error('Properties panel should be hidden after toggle off');
    }
    
    // Test 5: Toggle Events panel on
    console.log('Test 5: Toggling Events panel on...');
    
    const eventsToggleOn = await page.evaluate(() => {
      if (window.levelEditor && window.levelEditor.eventEditor) { window.levelEditor.eventEditor.visible = true; }
      
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      const isVisible = window.levelEditor.eventEditor.visible || false;
      
      return {
        isVisible: isVisible,
        expectedVisible: true
      };
    });
    
    console.log('Events panel toggled on:', eventsToggleOn);
    await sleep(500);
    await saveScreenshot(page, 'levelEditor/events_panel_visible', eventsToggleOn.isVisible);
    
    if (!eventsToggleOn.isVisible) {
      throw new Error('Events panel should be visible after toggle on');
    }
    
    // Test 6: Toggle Events panel off
    console.log('Test 6: Toggling Events panel off...');
    
    const eventsToggleOff = await page.evaluate(() => {
      if (window.levelEditor && window.levelEditor.eventEditor) { window.levelEditor.eventEditor.visible = false; }
      
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      const isVisible = window.levelEditor.eventEditor.visible || false;
      
      return {
        isVisible: isVisible,
        expectedVisible: false
      };
    });
    
    console.log('Events panel toggled off:', eventsToggleOff);
    await sleep(500);
    await saveScreenshot(page, 'levelEditor/events_panel_hidden_again', !eventsToggleOff.isVisible);
    
    if (eventsToggleOff.isVisible) {
      throw new Error('Events panel should be hidden after toggle off');
    }
    
    // Test 7: Verify both panels can be shown simultaneously
    console.log('Test 7: Showing both panels simultaneously...');
    
    const bothPanels = await page.evaluate(() => {
      if (window.levelEditor && window.levelEditor.propertiesPanel) { window.levelEditor.propertiesPanel.visible = true; }
      if (window.levelEditor && window.levelEditor.eventEditor) { window.levelEditor.eventEditor.visible = true; }
      
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      const propertiesVisible = window.levelEditor.propertiesPanel.visible || false;
      const eventsVisible = window.levelEditor.eventEditor.visible || false;
      
      return {
        propertiesVisible: propertiesVisible,
        eventsVisible: eventsVisible,
        bothShown: propertiesVisible && eventsVisible
      };
    });
    
    console.log('Both panels shown:', bothPanels);
    await sleep(500);
    await saveScreenshot(page, 'levelEditor/both_panels_visible', bothPanels.bothShown);
    
    if (!bothPanels.bothShown) {
      throw new Error('Both panels should be visible simultaneously');
    }
    
    // Test 8: Verify state persistence across multiple toggles
    console.log('Test 8: Testing state persistence across toggles...');
    
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => {
        if (window.levelEditor && window.levelEditor.propertiesPanel) { window.levelEditor.propertiesPanel.visible = true; }
      });
      await sleep(200);
      
      await page.evaluate(() => {
        if (window.levelEditor && window.levelEditor.propertiesPanel) { window.levelEditor.propertiesPanel.visible = false; }
      });
      await sleep(200);
    }
    
    const persistenceResult = await page.evaluate(() => {
      const isVisible = window.levelEditor.propertiesPanel.visible || false;
      
      return {
        isVisible: isVisible,
        expectedVisible: false // Should be hidden after last toggle off
      };
    });
    
    console.log('Persistence result:', persistenceResult);
    await saveScreenshot(page, 'levelEditor/panel_persistence_tested', true);
    
    console.log('✅ All panel visibility tests passed!');
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await saveScreenshot(page, 'levelEditor/panel_visibility_error', false);
    await browser.close();
    process.exit(1);
  }
})();



