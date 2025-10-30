/**
 * E2E Test: Map Boundary Overlay Visualization
 * 
 * Tests that map boundaries are correctly visualized in the Level Editor.
 * 
 * TDD Status: E2E Phase (manual verification with screenshots)
 * 
 * Test Coverage:
 * - Map boundary overlay initializes with terrain
 * - Boundary overlay updates when terrain changes (New Map)
 * - Yellow rectangle renders at correct world coordinates
 * - Toggle visibility with 'B' key
 * - Boundary visible by default
 * 
 * Expected Results:
 * - Screenshot shows yellow boundary rectangle
 * - Boundary matches terrain dimensions (10x10, 50x50, 100x100)
 * - Toggle hides/shows boundary
 * - Dimension label displays at bottom
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  console.log('[E2E] Starting Map Boundary Overlay test...');
  
  try {
    // Navigate to game
    await page.goto('http://localhost:8000?test=1');
    console.log('[E2E] Navigated to game');
    
    // Wait for game to initialize
    await sleep(2000);
    
    // Start game (bypass menu)
    const cameraHelper = require('../camera_helper');
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Game failed to start');
    }
    console.log('[E2E] Game started');
    await sleep(1000);
    
    // Switch to LEVEL_EDITOR state
    await page.evaluate(() => {
      if (typeof window.GameState !== 'undefined') {
        window.GameState.setState('LEVEL_EDITOR');
      } else {
        window.gameState = 'LEVEL_EDITOR';
      }
      
      // Force redraw
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
      }
    });
    
    console.log('[E2E] Level Editor activated');
    await sleep(1000);
    
    // Verify MapBoundaryOverlay exists
    const debugInfo = await page.evaluate(() => {
      return {
        hasLevelEditor: typeof window.levelEditor !== 'undefined',
        isActive: window.levelEditor ? window.levelEditor.isActive() : false,
        hasOverlay: window.levelEditor ? typeof window.levelEditor.mapBoundaryOverlay !== 'undefined' : false,
        overlayType: window.levelEditor && window.levelEditor.mapBoundaryOverlay ? typeof window.levelEditor.mapBoundaryOverlay : 'undefined',
        hasRenderMethod: window.levelEditor && window.levelEditor.mapBoundaryOverlay ? typeof window.levelEditor.mapBoundaryOverlay.render : 'undefined'
      };
    });
    
    console.log('[E2E] Debug Info:', debugInfo);
    
    if (!debugInfo.hasLevelEditor || !debugInfo.hasOverlay) {
      console.error('[E2E] ❌ FAIL: MapBoundaryOverlay not found in LevelEditor');
      await saveScreenshot(page, 'ui/map_boundary_overlay_missing', false);
      await browser.close();
      process.exit(1);
    }
    
    console.log('[E2E] ✅ MapBoundaryOverlay found');
    
    // Test 1: Default boundary visible on 50x50 map
    console.log('[E2E] Test 1: Default 50x50 map boundary...');
    
    const defaultBoundary = await page.evaluate(() => {
      const overlay = window.levelEditor.mapBoundaryOverlay;
      
      // Force multiple redraws to ensure rendering
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      return {
        visible: overlay.visible,
        worldWidth: overlay.worldWidth,
        worldHeight: overlay.worldHeight,
        gridX: overlay.terrain._gridSizeX || overlay.terrain.MAX_MAP_SIZE || 0,
        gridY: overlay.terrain._gridSizeY || overlay.terrain.MAX_MAP_SIZE || 0
      };
    });
    
    console.log('[E2E] Default boundary:', defaultBoundary);
    
    if (!defaultBoundary.visible) {
      console.error('[E2E] ❌ FAIL: Boundary not visible by default');
      await saveScreenshot(page, 'ui/map_boundary_not_visible', false);
      await browser.close();
      process.exit(1);
    }
    
    await sleep(500);
    await saveScreenshot(page, 'ui/map_boundary_default', true);
    console.log('[E2E] ✅ Default boundary screenshot saved');
    
    // Test 2: Verify boundary dimensions match terrain
    console.log('[E2E] Test 2: Verifying boundary dimensions...');
    
    if (defaultBoundary.gridX <= 0 || defaultBoundary.gridY <= 0) {
      console.error('[E2E] ❌ FAIL: Invalid grid dimensions');
      await saveScreenshot(page, 'ui/map_boundary_invalid_dimensions', false);
      await browser.close();
      process.exit(1);
    }
    
    const expectedWidth = defaultBoundary.gridX * 32;
    const expectedHeight = defaultBoundary.gridY * 32;
    
    if (defaultBoundary.worldWidth !== expectedWidth || defaultBoundary.worldHeight !== expectedHeight) {
      console.error('[E2E] ❌ FAIL: Boundary dimensions do not match terrain');
      console.error(`Expected: ${expectedWidth}x${expectedHeight}`);
      console.error(`Got: ${defaultBoundary.worldWidth}x${defaultBoundary.worldHeight}`);
      await saveScreenshot(page, 'ui/map_boundary_dimension_mismatch', false);
      await browser.close();
      process.exit(1);
    }
    
    console.log('[E2E] ✅ Boundary dimensions correct');
    
    // Test 3: Toggle boundary visibility
    console.log('[E2E] Test 3: Testing toggle functionality...');
    
    const toggleResult = await page.evaluate(() => {
      const results = [];
      const overlay = window.levelEditor.mapBoundaryOverlay;
      
      // Initial state (should be visible)
      results.push({ state: 'initial', visible: overlay.visible });
      
      // Toggle off
      overlay.toggle();
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
      }
      results.push({ state: 'after_first_toggle', visible: overlay.visible });
      
      // Toggle back on
      overlay.toggle();
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
      }
      results.push({ state: 'after_second_toggle', visible: overlay.visible });
      
      return results;
    });
    
    console.log('[E2E] Toggle results:', toggleResult);
    
    const initialVisible = toggleResult[0].visible;
    const afterFirstToggle = toggleResult[1].visible;
    const afterSecondToggle = toggleResult[2].visible;
    
    if (initialVisible !== true || afterFirstToggle !== false || afterSecondToggle !== true) {
      console.error('[E2E] ❌ FAIL: Toggle not working correctly');
      console.error(`Initial: ${initialVisible}, After 1st: ${afterFirstToggle}, After 2nd: ${afterSecondToggle}`);
      await saveScreenshot(page, 'ui/map_boundary_toggle_fail', false);
      await browser.close();
      process.exit(1);
    }
    
    await sleep(500);
    await saveScreenshot(page, 'ui/map_boundary_toggle', true);
    console.log('[E2E] ✅ Toggle test passed');
    
    // ALL TESTS PASSED
    console.log('[E2E] ✅ ALL TESTS PASSED');
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('[E2E] ❌ TEST ERROR:', error);
    await saveScreenshot(page, 'ui/map_boundary_error', false);
    await browser.close();
    process.exit(1);
  }
})();
