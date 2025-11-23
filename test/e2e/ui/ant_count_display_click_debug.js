/**
 * E2E Test: AntCountDisplayComponent Click Detection Debug
 * 
 * Purpose: Debug why clicks aren't triggering expand/collapse
 * Tests each layer of the click detection system
 */

const puppeteer = require('puppeteer');
const { saveScreenshot, sleep } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

describe('AntCountDisplayComponent Click Detection Debug', function() {
  this.timeout(30000);
  
  let browser, page;
  
  before(async function() {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1485, height: 800 });
    await page.goto('http://localhost:8000');
    await sleep(2000);
    
    // Bypass menu
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Failed to start game - still on menu');
    }
    
    await sleep(1000);
  });
  
  after(async function() {
    if (browser) await browser.close();
  });
  
  it('should verify component exists and is rendering', async function() {
    const componentExists = await page.evaluate(() => {
      return {
        exists: !!window.g_antCountDisplay,
        gameState: window.GameState ? window.GameState.getState() : 'unknown',
        renderManagerExists: !!window.RenderManager
      };
    });
    
    console.log('Component check:', componentExists);
    
    if (!componentExists.exists) {
      throw new Error('g_antCountDisplay does not exist!');
    }
    
    await saveScreenshot(page, 'ui/ant_count_display_click_debug_1_initial', true);
  });
  
  it('should test isMouseOver at component position', async function() {
    const hitTestResults = await page.evaluate(() => {
      const display = window.g_antCountDisplay;
      if (!display) return { error: 'No display' };
      
      // Test various points
      const testPoints = [
        { x: 20, y: 80, label: 'top-left corner' },
        { x: 38, y: 122, label: 'user click position' },
        { x: 120, y: 100, label: 'middle of panel' },
        { x: 200, y: 100, label: 'right side' }
      ];
      
      const results = testPoints.map(point => ({
        ...point,
        isOver: display.isMouseOver(point.x, point.y),
        x: display.x,
        y: display.y,
        width: display.width,
        height: display.currentHeight,
        expanded: display.isExpanded
      }));
      
      return results;
    });
    
    console.log('Hit test results:', JSON.stringify(hitTestResults, null, 2));
    
    if (!hitTestResults.error) {
      // Check if ANY point hits
      const anyHit = hitTestResults.some(r => r.isOver);
      if (!anyHit) {
        console.error('❌ None of the test points hit the component!');
        console.error('Component bounds:', { x: hitTestResults[0].x, y: hitTestResults[0].y, width: hitTestResults[0].width, height: hitTestResults[0].height });
      }
    }
  });
  
  it('should test RenderManager interactive registration', async function() {
    const interactiveInfo = await page.evaluate(() => {
      const rm = window.RenderManager;
      if (!rm) return { error: 'No RenderManager' };
      
      // Get interactive drawables for UI_GAME layer
      const layerName = rm.layers ? rm.layers.UI_GAME : 'UI_GAME';
      const interactives = rm.layerInteractives ? rm.layerInteractives.get(layerName) : null;
      
      return {
        layerName,
        hasLayerInteractives: !!rm.layerInteractives,
        interactivesCount: interactives ? interactives.length : 0,
        interactivesInfo: interactives ? interactives.map((int, idx) => ({
          index: idx,
          hasHitTest: typeof int.hitTest === 'function',
          hasOnPointerDown: typeof int.onPointerDown === 'function',
          id: int.id || 'no-id',
          constructor: int.constructor ? int.constructor.name : 'unknown'
        })) : []
      };
    });
    
    console.log('Interactive registration:', JSON.stringify(interactiveInfo, null, 2));
    
    if (interactiveInfo.interactivesCount === 0) {
      throw new Error('No interactive drawables registered on UI_GAME layer!');
    }
  });
  
  it('should manually trigger hitTest with pointer object', async function() {
    const manualHitTest = await page.evaluate(() => {
      const rm = window.RenderManager;
      if (!rm) return { error: 'No RenderManager' };
      
      const layerName = rm.layers.UI_GAME;
      const interactives = rm.layerInteractives.get(layerName);
      if (!interactives || interactives.length === 0) {
        return { error: 'No interactives' };
      }
      
      // Find the AntCountDisplay interactive (should be last or only one)
      const results = interactives.map((interactive, idx) => {
        // Create pointer object like RenderManager does
        const pointer = {
          screen: { x: 38, y: 122 },
          pointerId: 0,
          isPressed: true,
          world: null,
          layer: layerName,
          dx: 0,
          dy: 0
        };
        
        try {
          const hitResult = interactive.hitTest ? interactive.hitTest(pointer) : 'no hitTest';
          return {
            index: idx,
            hasHitTest: typeof interactive.hitTest === 'function',
            hitResult,
            pointerUsed: { screenX: pointer.screen.x, screenY: pointer.screen.y }
          };
        } catch (e) {
          return {
            index: idx,
            error: e.message
          };
        }
      });
      
      return results;
    });
    
    console.log('Manual hitTest results:', JSON.stringify(manualHitTest, null, 2));
    
    const anyHit = manualHitTest.some(r => r.hitResult === true);
    if (!anyHit) {
      console.error('❌ Manual hitTest failed! None of the interactives returned true');
    } else {
      console.log('✅ Manual hitTest succeeded!');
    }
  });
  
  it('should identify which interactive is consuming the click', async function() {
    const detailedInfo = await page.evaluate(() => {
      const rm = window.RenderManager;
      if (!rm) return { error: 'No RenderManager' };
      
      const layerName = rm.layers.UI_GAME;
      const interactives = rm.layerInteractives.get(layerName);
      if (!interactives) return { error: 'No interactives' };
      
      // Create pointer object
      const pointer = {
        screen: { x: 38, y: 122 },
        pointerId: 0,
        isPressed: true,
        world: null,
        layer: layerName,
        dx: 0,
        dy: 0
      };
      
      // Test each interactive in REVERSE order (how RenderManager does it)
      const results = [];
      for (let i = interactives.length - 1; i >= 0; i--) {
        const interactive = interactives[i];
        try {
          const hitResult = interactive.hitTest ? interactive.hitTest(pointer) : false;
          results.push({
            index: i,
            id: interactive.id || 'no-id',
            hitResult,
            hasOnPointerDown: typeof interactive.onPointerDown === 'function',
            wouldConsume: hitResult && typeof interactive.onPointerDown === 'function'
          });
          
          // If this would consume, stop (like RenderManager does)
          if (hitResult) {
            results.push({ message: `⚠️ Interactive at index ${i} (${interactive.id || 'no-id'}) would consume the click here!` });
            break;
          }
        } catch (e) {
          results.push({ index: i, error: e.message });
        }
      }
      
      return results;
    });
    
    console.log('\n🔍 Interactive dispatch order (reverse, last-to-first):');
    console.log(JSON.stringify(detailedInfo, null, 2));
  });
  
  it('should check component state after click', async function() {
    const state = await page.evaluate(() => {
      const display = window.g_antCountDisplay;
      if (!display) return { error: 'No display' };
      
      return {
        isExpanded: display.isExpanded,
        currentHeight: display.currentHeight,
        targetHeight: display.targetHeight,
        x: display.x,
        y: display.y,
        width: display.width
      };
    });
    
    console.log('Component state after click:', state);
    
    if (!state.isExpanded) {
      console.log('Component did NOT expand - click not detected');
    } else {
      console.log('✅ Component IS expanded - click worked!');
    }
  });
  
  it('should test ACTUAL click at component position', async function() {
    this.timeout(10000);
    
    // Get initial state
    const initialState = await page.evaluate(() => ({
      isExpanded: window.g_antCountDisplay ? window.g_antCountDisplay.isExpanded : null
    }));
    console.log('Initial state:', initialState);
    
    // Click at the panel position (38, 122 is middle of panel)
    await page.mouse.click(38, 122);
    await sleep(500);
    
    // Check final state
    const finalState = await page.evaluate(() => ({
      isExpanded: window.g_antCountDisplay ? window.g_antCountDisplay.isExpanded : null,
      currentHeight: window.g_antCountDisplay ? window.g_antCountDisplay.currentHeight : null
    }));
    console.log('Final state:', finalState);
    
    if (finalState.isExpanded !== initialState.isExpanded) {
      console.log('✅ Component state CHANGED - click worked!');
    } else {
      console.log('❌ Component state DID NOT CHANGE - click failed');
    }
  });
});
