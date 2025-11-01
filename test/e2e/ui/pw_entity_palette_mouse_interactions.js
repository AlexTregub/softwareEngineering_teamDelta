/**
 * E2E Test: Entity Palette User Mouse Interactions
 * Tests ACTUAL user mouse clicks and scrolls (not programmatic)
 * 
 * Purpose: Simulate real user behavior:
 * 1. User clicks on category button with mouse
 * 2. User scrolls with mouse wheel
 * 3. Check if events are captured by browser
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('[E2E] Loading Level Editor...');
    await page.goto('http://localhost:8000?test=1');
    
    const editorStarted = await cameraHelper.ensureLevelEditorStarted(page);
    if (!editorStarted.started) {
      throw new Error(`Failed to start Level Editor: ${editorStarted.message}`);
    }
    console.log('[E2E] ✓ Level Editor started');
    await sleep(500);
    
    // Open Entity Palette panel
    console.log('\n[SETUP] Opening Entity Palette panel...');
    await page.evaluate(() => {
      if (window.FileMenuBar && window.FileMenuBar._handleTogglePanel) {
        window.FileMenuBar._handleTogglePanel('entity-painter');
      } else if (window.levelEditor && window.levelEditor.panels && window.levelEditor.panels.entityPalette) {
        window.levelEditor.panels.entityPalette.state.visible = true;
      }
    });
    
    await sleep(300);
    await page.evaluate(() => {
      if (window.draggablePanelManager) {
        window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
      }
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    await sleep(500);
    
    await saveScreenshot(page, 'entity_palette_mouse/setup_panel_opened', true);
    
    // Test 1: Get panel position for clicking
    console.log('\n[TEST 1] Getting panel position...');
    const panelInfo = await page.evaluate(() => {
      if (!window.levelEditor || !window.levelEditor.panels || !window.levelEditor.panels.entityPalette) {
        return { found: false };
      }
      
      const panel = window.levelEditor.panels.entityPalette;
      if (!panel.state || !panel.state.visible) {
        return { found: false, reason: 'Panel not visible' };
      }
      
      const pos = panel.state.position;
      return {
        found: true,
        x: pos.x,
        y: pos.y,
        width: panel.width,
        height: panel.height,
        
        // Calculate click targets
        categoryButtonY: pos.y + 15,  // Middle of category button area (30px tall)
        categoryButton1X: pos.x + 55,  // First button (Entities)
        categoryButton2X: pos.x + 110, // Second button (Buildings)
        categoryButton3X: pos.x + 165, // Third button (Resources)
        
        scrollAreaY: pos.y + 100 // Middle of scrollable area
      };
    });
    
    console.log('[TEST 1] Panel info:', JSON.stringify(panelInfo, null, 2));
    
    if (!panelInfo.found) {
      await saveScreenshot(page, 'entity_palette_mouse/test1_panel_not_found', false);
      throw new Error('TEST 1 FAILED: Panel not found or not visible');
    }
    
    // Test 2: Record initial state before clicking
    console.log('\n[TEST 2] Recording initial state...');
    const initialState = await page.evaluate(() => {
      if (!window.levelEditor || !window.levelEditor.entityPalette) {
        return { found: false };
      }
      
      const palette = window.levelEditor.entityPalette;
      return {
        found: true,
        currentCategory: palette.currentCategory,
        scrollOffset: palette.scrollOffset || 0
      };
    });
    
    console.log('[TEST 2] Initial state:', JSON.stringify(initialState, null, 2));
    
    // Test 3: Click on second category button (Buildings)
    console.log('\n[TEST 3] Clicking on Buildings category button...');
    console.log(`[TEST 3] Click coordinates: (${panelInfo.categoryButton2X}, ${panelInfo.categoryButtonY})`);
    
    // Use Puppeteer's actual mouse click
    await page.mouse.click(panelInfo.categoryButton2X, panelInfo.categoryButtonY);
    await sleep(200);
    
    // Force redraw after click
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    await sleep(300);
    
    await saveScreenshot(page, 'entity_palette_mouse/test3_after_buildings_click', true);
    
    // Check if category changed
    const afterClick = await page.evaluate(() => {
      if (!window.levelEditor || !window.levelEditor.entityPalette) {
        return { found: false };
      }
      
      const palette = window.levelEditor.entityPalette;
      return {
        found: true,
        currentCategory: palette.currentCategory,
        changed: palette.currentCategory !== 'entities'
      };
    });
    
    console.log('[TEST 3] After click:', JSON.stringify(afterClick, null, 2));
    
    if (!afterClick.changed) {
      console.error('[TEST 3] ✗ FAILED: Category did not change from "entities"');
      await saveScreenshot(page, 'entity_palette_mouse/test3_click_failed', false);
    } else {
      console.log('[TEST 3] ✓ PASSED: Category changed to', afterClick.currentCategory);
    }
    
    // Test 4: Click on third category button (Resources)
    console.log('\n[TEST 4] Clicking on Resources category button...');
    console.log(`[TEST 4] Click coordinates: (${panelInfo.categoryButton3X}, ${panelInfo.categoryButtonY})`);
    
    await page.mouse.click(panelInfo.categoryButton3X, panelInfo.categoryButtonY);
    await sleep(200);
    
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    await sleep(300);
    
    await saveScreenshot(page, 'entity_palette_mouse/test4_after_resources_click', true);
    
    const afterClick2 = await page.evaluate(() => {
      if (!window.levelEditor || !window.levelEditor.entityPalette) {
        return { found: false };
      }
      
      const palette = window.levelEditor.entityPalette;
      return {
        found: true,
        currentCategory: palette.currentCategory,
        changed: palette.currentCategory === 'resources'
      };
    });
    
    console.log('[TEST 4] After click:', JSON.stringify(afterClick2, null, 2));
    
    if (!afterClick2.changed) {
      console.error('[TEST 4] ✗ FAILED: Category did not change to "resources"');
      await saveScreenshot(page, 'entity_palette_mouse/test4_click_failed', false);
    } else {
      console.log('[TEST 4] ✓ PASSED: Category changed to resources');
    }
    
    // Test 5: Try mouse wheel scrolling
    console.log('\n[TEST 5] Testing mouse wheel scroll...');
    
    const beforeScroll = await page.evaluate(() => {
      if (!window.levelEditor || !window.levelEditor.entityPalette) {
        return { found: false };
      }
      
      const palette = window.levelEditor.entityPalette;
      return {
        found: true,
        scrollOffset: palette.scrollOffset || 0
      };
    });
    
    console.log('[TEST 5] Before scroll:', JSON.stringify(beforeScroll, null, 2));
    
    // Move mouse to scroll area and scroll
    await page.mouse.move(panelInfo.x + panelInfo.width / 2, panelInfo.scrollAreaY);
    await sleep(100);
    
    // Scroll down (positive deltaY)
    await page.mouse.wheel({ deltaY: 100 });
    await sleep(200);
    
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    await sleep(300);
    
    await saveScreenshot(page, 'entity_palette_mouse/test5_after_scroll', true);
    
    const afterScroll = await page.evaluate(() => {
      if (!window.levelEditor || !window.levelEditor.entityPalette) {
        return { found: false };
      }
      
      const palette = window.levelEditor.entityPalette;
      return {
        found: true,
        scrollOffset: palette.scrollOffset || 0,
        changed: (palette.scrollOffset || 0) !== (beforeScroll.scrollOffset || 0)
      };
    });
    
    console.log('[TEST 5] After scroll:', JSON.stringify(afterScroll, null, 2));
    
    if (!afterScroll.found) {
      console.error('[TEST 5] ✗ FAILED: Palette not found after scroll');
    } else if (!afterScroll.changed) {
      console.error('[TEST 5] ✗ FAILED: Scroll offset did not change');
      await saveScreenshot(page, 'entity_palette_mouse/test5_scroll_failed', false);
    } else {
      console.log('[TEST 5] ✓ PASSED: Scroll offset changed from', beforeScroll.scrollOffset, 'to', afterScroll.scrollOffset);
    }
    
    // Test 6: Check if mousePressed/mouseWheel events are wired
    console.log('\n[TEST 6] Checking event wiring in sketch.js...');
    const eventWiring = await page.evaluate(() => {
      const results = {
        hasMousePressed: typeof window.mousePressed === 'function',
        hasMouseWheel: typeof window.mouseWheel === 'function',
        gameState: window.gameState
      };
      
      if (results.hasMousePressed) {
        const mousePressedSource = window.mousePressed.toString();
        results.callsLevelEditor = mousePressedSource.includes('levelEditor');
      }
      
      if (results.hasMouseWheel) {
        const mouseWheelSource = window.mouseWheel.toString();
        results.wheelCallsLevelEditor = mouseWheelSource.includes('levelEditor');
      }
      
      return results;
    });
    
    console.log('[TEST 6] Event wiring:', JSON.stringify(eventWiring, null, 2));
    
    console.log('\n[E2E] ✓ All mouse interaction tests completed');
    console.log('[E2E] Check screenshots in test/e2e/screenshots/entity_palette_mouse/');
    
    // Determine overall success
    const allPassed = afterClick.changed && afterClick2.changed && afterScroll.changed;
    
    await browser.close();
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    console.error('[E2E] ✗ Test failed:', error.message);
    await saveScreenshot(page, 'entity_palette_mouse/error', false);
    await browser.close();
    process.exit(1);
  }
})();
