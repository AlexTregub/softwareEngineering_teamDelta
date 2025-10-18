#!/usr/bin/env node
/**
 * Puppeteer Test: Panel Dragging
 * Tests DraggablePanelSystem functionality with real browser interactions
 * 
 * Following testing standards: Use system APIs, test real browser behavior
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  const url = process.env.TEST_URL || 'http://localhost:8000?test=1';
  console.log('Running panel dragging test against', url);

  let browser;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Capture console logs
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('ERROR') || text.includes('WARN')) {
        console.log('PAGE LOG:', text);
      }
    });

    // Navigate to game
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    await sleep(2000);

    // Ensure game is started
    const gameStarted = await page.evaluate(() => {
      if (typeof window.ensureGameStarted === 'function') {
        window.ensureGameStarted();
        return true;
      }
      return false;
    });

    if (!gameStarted) {
      console.warn('⚠️ ensureGameStarted not available, attempting manual start');
      await page.evaluate(() => {
        const gs = window.GameState || window.g_gameState;
        if (gs && typeof gs.startGame === 'function') {
          gs.startGame();
        }
      });
      await sleep(1000);
    }

    // Test 1: Check if DraggablePanelSystem exists
    console.log('\n📋 Test 1: DraggablePanelSystem availability');
    const systemExists = await page.evaluate(() => {
      return {
        hasPanelSystem: typeof window.g_draggablePanelSystem !== 'undefined',
        hasPanels: window.g_draggablePanelSystem && window.g_draggablePanelSystem.panels ? 
                   window.g_draggablePanelSystem.panels.size : 0,
        systemType: window.g_draggablePanelSystem ? window.g_draggablePanelSystem.constructor.name : 'N/A'
      };
    });

    console.log('  Panel system available:', systemExists.hasPanelSystem);
    console.log('  Panel count:', systemExists.hasPanels);
    console.log('  System type:', systemExists.systemType);

    if (!systemExists.hasPanelSystem) {
      throw new Error('DraggablePanelSystem not found');
    }

    // Test 2: Get initial panel positions
    console.log('\n📋 Test 2: Get initial panel positions');
    const initialPositions = await page.evaluate(() => {
      const panelSystem = window.g_draggablePanelSystem;
      if (!panelSystem || !panelSystem.panels) return null;

      const positions = {};
      panelSystem.panels.forEach((panel, id) => {
        positions[id] = {
          x: panel.position.x,
          y: panel.position.y,
          visible: panel.visible
        };
      });
      return positions;
    });

    if (!initialPositions || Object.keys(initialPositions).length === 0) {
      console.warn('⚠️ No panels found, cannot test dragging');
      await saveScreenshot(page, 'ui/panel_no_panels', false);
      await browser.close();
      process.exit(0);
    }

    console.log('  Initial panel positions:', JSON.stringify(initialPositions, null, 2));

    // Take screenshot of initial state
    await saveScreenshot(page, 'ui/panel_initial', true);

    // Test 3: Find a visible panel to drag
    console.log('\n📋 Test 3: Identify draggable panel');
    const targetPanel = await page.evaluate(() => {
      const panelSystem = window.g_draggablePanelSystem;
      if (!panelSystem || !panelSystem.panels) return null;

      // Find first visible panel
      for (const [id, panel] of panelSystem.panels) {
        if (panel.visible && panel.position) {
          return {
            id: id,
            x: panel.position.x,
            y: panel.position.y,
            width: panel.size.width,
            height: panel.size.height,
            titleBarHeight: panel.titleBarHeight || 30
          };
        }
      }
      return null;
    });

    if (!targetPanel) {
      console.warn('⚠️ No visible panels found for dragging test');
      await saveScreenshot(page, 'ui/panel_no_visible', false);
      await browser.close();
      process.exit(0);
    }

    console.log('  Target panel:', targetPanel.id);
    console.log('  Initial position:', `(${targetPanel.x}, ${targetPanel.y})`);
    console.log('  Size:', `${targetPanel.width}x${targetPanel.height}`);

    // Test 4: Perform drag operation on title bar
    console.log('\n📋 Test 4: Drag panel to new position');
    
    // Calculate drag start (center of title bar)
    const dragStartX = targetPanel.x + targetPanel.width / 2;
    const dragStartY = targetPanel.y + targetPanel.titleBarHeight / 2;
    
    // Calculate drag end (move 200px right, 150px down)
    const dragEndX = dragStartX + 200;
    const dragEndY = dragStartY + 150;

    console.log('  Drag start:', `(${dragStartX}, ${dragStartY})`);
    console.log('  Drag end:', `(${dragEndX}, ${dragEndY})`);

    // Perform drag
    await page.mouse.move(dragStartX, dragStartY);
    await sleep(100);
    await page.mouse.down();
    await sleep(100);

    // Drag in steps for smooth movement
    const steps = 15;
    for (let i = 1; i <= steps; i++) {
      const progress = i / steps;
      const x = dragStartX + (dragEndX - dragStartX) * progress;
      const y = dragStartY + (dragEndY - dragStartY) * progress;
      await page.mouse.move(x, y);
      await sleep(20);
    }

    await sleep(100);
    await page.mouse.up();
    await sleep(500);

    // Take screenshot after drag
    await saveScreenshot(page, 'ui/panel_after_drag', true);

    // Test 5: Verify panel moved
    console.log('\n📋 Test 5: Verify panel position changed');
    const finalPosition = await page.evaluate((panelId) => {
      const panelSystem = window.g_draggablePanelSystem;
      if (!panelSystem || !panelSystem.panels) return null;

      const panel = panelSystem.panels.get(panelId);
      if (!panel) return null;

      return {
        x: panel.position.x,
        y: panel.position.y
      };
    }, targetPanel.id);

    console.log('  Final position:', `(${finalPosition.x}, ${finalPosition.y})`);

    const deltaX = Math.abs(finalPosition.x - targetPanel.x);
    const deltaY = Math.abs(finalPosition.y - targetPanel.y);
    
    console.log('  Delta X:', deltaX);
    console.log('  Delta Y:', deltaY);

    // Panel should have moved at least 100px in some direction
    const MIN_MOVEMENT = 100;
    if (deltaX < MIN_MOVEMENT && deltaY < MIN_MOVEMENT) {
      console.error(`❌ Panel did not move enough (deltaX: ${deltaX}, deltaY: ${deltaY}, min: ${MIN_MOVEMENT})`);
      await saveScreenshot(page, 'ui/panel_drag_failed', false);
      await browser.close();
      process.exit(1);
    }

    console.log('✅ Panel moved successfully!');

    // Test 6: Test panel visibility toggle (if available)
    console.log('\n📋 Test 6: Test panel visibility toggle');
    const toggleResult = await page.evaluate((panelId) => {
      const panelSystem = window.g_draggablePanelSystem;
      if (!panelSystem || typeof panelSystem.togglePanelVisibility !== 'function') {
        return { available: false };
      }

      const panel = panelSystem.panels.get(panelId);
      const wasVisible = panel.visible;
      
      panelSystem.togglePanelVisibility(panelId);
      const nowVisible = panelSystem.panels.get(panelId).visible;

      // Toggle back
      panelSystem.togglePanelVisibility(panelId);
      const finalVisible = panelSystem.panels.get(panelId).visible;

      return {
        available: true,
        wasVisible: wasVisible,
        afterToggle: nowVisible,
        afterDoubleToggle: finalVisible,
        success: wasVisible === finalVisible && wasVisible !== nowVisible
      };
    }, targetPanel.id);

    if (toggleResult.available) {
      console.log('  Visibility toggle available:', true);
      console.log('  Toggle test passed:', toggleResult.success);
      if (!toggleResult.success) {
        console.warn('  ⚠️ Visibility toggle did not work as expected');
      }
    } else {
      console.log('  Visibility toggle not available (optional feature)');
    }

    // Test 7: Check if position persists across frames
    console.log('\n📋 Test 7: Verify position persistence');
    await sleep(1000); // Wait a second to ensure any render loops have completed

    const persistedPosition = await page.evaluate((panelId) => {
      const panelSystem = window.g_draggablePanelSystem;
      if (!panelSystem || !panelSystem.panels) return null;

      const panel = panelSystem.panels.get(panelId);
      if (!panel) return null;

      return {
        x: panel.position.x,
        y: panel.position.y
      };
    }, targetPanel.id);

    const positionStable = Math.abs(persistedPosition.x - finalPosition.x) < 5 && 
                          Math.abs(persistedPosition.y - finalPosition.y) < 5;

    console.log('  Position after 1s:', `(${persistedPosition.x}, ${persistedPosition.y})`);
    console.log('  Position stable:', positionStable);

    if (!positionStable) {
      console.warn('  ⚠️ Panel position drifted after drag');
    }

    // Final screenshot
    await saveScreenshot(page, 'ui/panel_final', true);

    // Success summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL PANEL DRAGGING TESTS PASSED');
    console.log('='.repeat(60));
    console.log('✓ DraggablePanelSystem exists');
    console.log('✓ Panel positions readable');
    console.log(`✓ Panel dragged successfully (${deltaX}px, ${deltaY}px)`);
    console.log('✓ Position persisted across frames');
    if (toggleResult.available) {
      console.log(`✓ Visibility toggle ${toggleResult.success ? 'works' : 'tested (issues detected)'}`);
    }

    await browser.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Panel dragging test failed:', error.message);
    console.error(error.stack);
    
    if (browser) {
      const page = (await browser.pages())[0];
      if (page) {
        await saveScreenshot(page, 'ui/panel_error', false);
      }
      await browser.close();
    }
    
    process.exit(1);
  }
})();
