/**
 * E2E Test: Power Button Hover Highlight Debug
 * 
 * Diagnose why hover highlights are not working:
 * - Check if RenderManager is receiving mouse events
 * - Verify hitTest is being called
 * - Test if hover state is being set
 * - Check if renderHoverHighlight flag is working
 * - Verify view._renderHoverHighlight() is rendering
 */

const puppeteer = require('puppeteer');
const { saveScreenshot, sleep } = require('../puppeteer_helper');

async function testHoverHighlightDebug() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    console.log('🎮 Loading game...');
    
    // Capture ALL console messages
    page.on('console', msg => {
      console.log(`[${msg.type().toUpperCase()}]`, msg.text());
    });
    
    page.on('pageerror', error => {
      console.log('💥 Page error:', error.message);
    });
    
    await page.goto('http://localhost:8000', { waitUntil: 'networkidle0' });
    await page.waitForSelector('canvas', { timeout: 10000 });
    await sleep(2000);
    
    // Start game
    console.log('🚀 Starting game and unlocking powers...');
    const initResult = await page.evaluate(() => {
      // Force PLAYING state
      if (window.GameState && typeof window.GameState.setState === 'function') {
        window.GameState.setState('PLAYING');
      }
      
      // Unlock all powers
      if (window.queenAnt && window.queenAnt.unlockedPowers) {
        window.queenAnt.unlockedPowers = { lightning: true, fireball: true };
      }
      
      // Force render
      if (window.powerButtonPanel && window.powerButtonPanel.update) {
        window.powerButtonPanel.update();
      }
      if (window.RenderManager) {
        window.RenderManager.render('PLAYING');
      }
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
      
      return {
        panelExists: window.powerButtonPanel !== undefined,
        renderManagerExists: window.RenderManager !== undefined,
        gameState: window.GameState ? window.GameState.getState() : window.gameState
      };
    });
    
    console.log('🔍 Init result:', JSON.stringify(initResult, null, 2));
    await sleep(500);
    
    // Test 1: Check panel bounds and button positions
    console.log('📊 Test 1: Panel and button positions...');
    const positions = await page.evaluate(() => {
      if (!window.powerButtonPanel) return { error: 'Panel not found' };
      
      const panel = window.powerButtonPanel;
      return {
        panel: {
          x: panel.x,
          y: panel.y,
          width: panel.width,
          height: panel.height
        },
        buttons: panel.buttons.map(btn => ({
          name: btn.powerName,
          x: btn.view.x,
          y: btn.view.y,
          size: btn.view.size,
          isLocked: btn.model.getIsLocked(),
          cooldownProgress: btn.model.getCooldownProgress()
        }))
      };
    });
    console.log('📐 Positions:', JSON.stringify(positions, null, 2));
    await saveScreenshot(page, 'ui/power_button_hover_debug_initial', true);
    
    // Test 2: Simulate mouse movement over first button
    console.log('🖱️ Test 2: Moving mouse over lightning button...');
    const lightningBtn = positions.buttons[0];
    const buttonCenterX = lightningBtn.x;
    const buttonCenterY = lightningBtn.y;
    
    console.log(`   Moving to (${buttonCenterX}, ${buttonCenterY})...`);
    
    // Move mouse to button center
    await page.mouse.move(buttonCenterX, buttonCenterY);
    await sleep(200);
    
    // Check if hover state was set
    const hoverState1 = await page.evaluate(() => {
      if (!window.powerButtonPanel) return { error: 'Panel not found' };
      
      const lightningButton = window.powerButtonPanel.buttons[0];
      return {
        controllerHovered: lightningButton.controller.isHovered,
        viewRenderFlag: lightningButton.view.renderHoverHighlight,
        panelEnabled: window.powerButtonPanel.enabled,
        renderManagerInteractives: window.RenderManager ? 
          Object.keys(window.RenderManager.interactiveDrawables || {}).length : 0
      };
    });
    console.log('🔍 Hover state after mouse move:', JSON.stringify(hoverState1, null, 2));
    
    // Force render
    await page.evaluate(() => {
      if (window.RenderManager) {
        window.RenderManager.render('PLAYING');
      }
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    await sleep(200);
    await saveScreenshot(page, 'ui/power_button_hover_debug_mouse_over', true);
    
    // Test 3: Manually trigger hover state to verify rendering works
    console.log('🎨 Test 3: Manually setting hover state and highlight flag...');
    await page.evaluate(() => {
      if (!window.powerButtonPanel) return;
      
      const lightningButton = window.powerButtonPanel.buttons[0];
      lightningButton.controller.setHovered(true);
      lightningButton.view.renderHoverHighlight = true;
      
      console.log('✅ Manually set isHovered=true, renderHoverHighlight=true');
      
      if (window.RenderManager) {
        window.RenderManager.render('PLAYING');
      }
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    await sleep(200);
    await saveScreenshot(page, 'ui/power_button_hover_debug_manual_hover', true);
    
    // Test 4: Check if RenderManager has interactive registered
    console.log('🔍 Test 4: Checking RenderManager registration...');
    const renderManagerDebug = await page.evaluate(() => {
      if (!window.RenderManager) return { error: 'RenderManager not found' };
      
      const layers = window.RenderManager.layers;
      const uiGameLayer = layers ? layers.UI_GAME : null;
      
      // Get interactive drawables for UI_GAME layer
      let interactives = [];
      if (window.RenderManager.interactiveDrawables && uiGameLayer !== null) {
        const layerInteractives = window.RenderManager.interactiveDrawables[uiGameLayer];
        if (layerInteractives && Array.isArray(layerInteractives)) {
          interactives = layerInteractives.map(d => ({
            id: d.id,
            hasHitTest: typeof d.hitTest === 'function',
            hasOnPointerDown: typeof d.onPointerDown === 'function'
          }));
        }
      }
      
      return {
        layers: layers,
        uiGameLayer: uiGameLayer,
        interactiveCount: interactives.length,
        interactives: interactives,
        powerButtonRegistered: interactives.some(d => d.id === 'power-button-panel')
      };
    });
    console.log('🔍 RenderManager debug:', JSON.stringify(renderManagerDebug, null, 2));
    
    // Test 5: Test hitTest function directly
    console.log('🎯 Test 5: Testing hitTest directly...');
    const hitTestResult = await page.evaluate((x, y) => {
      if (!window.RenderManager || !window.RenderManager.interactiveDrawables) {
        return { error: 'RenderManager or interactiveDrawables not found' };
      }
      
      const uiGameLayer = window.RenderManager.layers.UI_GAME;
      const layerInteractives = window.RenderManager.interactiveDrawables[uiGameLayer];
      
      if (!layerInteractives || !Array.isArray(layerInteractives)) {
        return { error: 'No interactives in UI_GAME layer' };
      }
      
      const powerButtonDrawable = layerInteractives.find(d => d.id === 'power-button-panel');
      if (!powerButtonDrawable) {
        return { error: 'power-button-panel not found in interactives' };
      }
      
      // Call hitTest with screen coordinates
      const pointer = { screen: { x, y }, x, y };
      const hit = powerButtonDrawable.hitTest(pointer);
      
      return {
        testCoords: { x, y },
        hitTestResult: hit,
        hasHitTest: typeof powerButtonDrawable.hitTest === 'function'
      };
    }, buttonCenterX, buttonCenterY);
    console.log('🎯 Direct hitTest result:', JSON.stringify(hitTestResult, null, 2));
    
    // Test 6: Click button and check console output
    console.log('👆 Test 6: Clicking lightning button...');
    await page.mouse.click(buttonCenterX, buttonCenterY);
    await sleep(500);
    await saveScreenshot(page, 'ui/power_button_hover_debug_clicked', true);
    
    // Test 7: Check if RenderManager is processing pointer events
    console.log('🔍 Test 7: Checking RenderManager pointer event handling...');
    const pointerDebug = await page.evaluate(() => {
      if (!window.RenderManager) return { error: 'RenderManager not found' };
      
      return {
        hasDispatchPointerEvent: typeof window.RenderManager.dispatchPointerEvent === 'function',
        hasHandlePointerMove: typeof window.RenderManager.handlePointerMove === 'function',
        hasHandlePointerDown: typeof window.RenderManager.handlePointerDown === 'function'
      };
    });
    console.log('🔍 Pointer event methods:', JSON.stringify(pointerDebug, null, 2));
    
    console.log('✅ Hover debug tests completed!');
    console.log('📁 Check screenshots in test/e2e/screenshots/ui/success/');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await saveScreenshot(page, 'ui/power_button_hover_debug_error', false);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run if executed directly
if (require.main === module) {
  testHoverHighlightDebug()
    .then(() => {
      console.log('🎉 Debug tests complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Tests failed:', error);
      process.exit(1);
    });
}

module.exports = { testHoverHighlightDebug };
