#!/usr/bin/env node

/**
 * E2E Test: Panel Drag Bounds (Minimized vs Non-Minimized)
 * 
 * Tests whether panels can be dragged to the bottom of the screen
 * in both minimized and non-minimized states.
 * 
 * Expected Results (AFTER FIX):
 * - Minimized panel: SHOULD be able to drag near bottom (only title bar height constraint)
 * - Non-minimized panel: SHOULD be able to drag near bottom (full panel height constraint)
 * 
 * Bug History:
 * - Before fix: applyDragConstraints() used config.size.height for both states
 * - After fix: Uses currentHeight = minimized ? calculateTitleBarHeight() : config.size.height
 * 
 * This test verifies the fix allows minimized panels to utilize the full screen vertically.
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const url = process.env.TEST_URL || 'http://localhost:8000?test=1';
  console.log('\n🧪 Running Panel Drag Bounds E2E Test');
  console.log('📋 Testing: Minimized vs Non-Minimized drag bounds');

  let browser, page;
  let testResults = {
    minimizedDrag: { passed: false, reason: '' },
    nonMinimizedDrag: { passed: false, reason: '' }
  };

  try {
    browser = await launchBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    console.log('📡 Loading game...');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    await sleep(2000);

    // ========================================
    // CRITICAL: Advance past main menu
    // ========================================
    console.log('▶️  Starting game and advancing past menu...');
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    console.log('   ✅ Game started:', gameStarted.started);
    
    if (!gameStarted.started) {
      throw new Error('Failed to start game - still on main menu');
    }
    await sleep(1000);

    // ========================================
    // Test Setup: Create Test Panels
    // ========================================
    console.log('\n📦 Creating test panels...');
    
    const panelSetup = await page.evaluate(() => {
      try {
        // Force PLAYING state
        window.gameState = 'PLAYING';
        
        // Add test panels to PLAYING state visibility
        if (window.draggablePanelManager && window.draggablePanelManager.stateVisibility) {
          if (!window.draggablePanelManager.stateVisibility.PLAYING) {
            window.draggablePanelManager.stateVisibility.PLAYING = [];
          }
          
          const panelIds = ['test-drag-bounds-minimized', 'test-drag-bounds-full'];
          panelIds.forEach(id => {
            if (!window.draggablePanelManager.stateVisibility.PLAYING.includes(id)) {
              window.draggablePanelManager.stateVisibility.PLAYING.push(id);
              console.log('✅ Added', id, 'to PLAYING state visibility');
            }
          });
        }
        
        // Create panel 1: Will be minimized
        const minimizedPanel = window.draggablePanelManager.addPanel({
          id: 'test-drag-bounds-minimized',
          title: '🔽 MINIMIZED DRAG TEST',
          position: { x: 100, y: 100 },
          size: { width: 400, height: 250 },
          style: {
            backgroundColor: [50, 150, 220, 230], // Blue
            titleColor: [255, 255, 255],
          },
          buttons: {
            items: [
              { caption: 'Content Line 1', width: 350, height: 40 },
              { caption: 'Content Line 2', width: 350, height: 40 },
              { caption: 'Content Line 3', width: 350, height: 40 },
            ]
          }
        });
        
        // Create panel 2: Will stay non-minimized
        const fullPanel = window.draggablePanelManager.addPanel({
          id: 'test-drag-bounds-full',
          title: '📦 NON-MINIMIZED DRAG TEST',
          position: { x: 550, y: 100 },
          size: { width: 400, height: 250 },
          style: {
            backgroundColor: [220, 50, 50, 230], // Red
            titleColor: [255, 255, 255],
          },
          buttons: {
            items: [
              { caption: 'Content Line 1', width: 350, height: 40 },
              { caption: 'Content Line 2', width: 350, height: 40 },
              { caption: 'Content Line 3', width: 350, height: 40 },
            ]
          }
        });
        
        minimizedPanel.show();
        fullPanel.show();
        
        return { 
          success: true,
          canvasHeight: window.height || 720
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    if (!panelSetup.success) {
      throw new Error('Failed to create panels: ' + panelSetup.error);
    }
    
    console.log('   Canvas height:', panelSetup.canvasHeight);
    await sleep(1000);

    // Force initial render
    await page.evaluate(() => {
      window.gameState = 'PLAYING';
      if (window.draggablePanelManager) {
        window.draggablePanelManager.gameState = 'PLAYING';
        if (typeof window.draggablePanelManager.renderPanels === 'function') {
          window.draggablePanelManager.renderPanels('PLAYING');
        }
      }
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(500);
    await saveScreenshot(page, 'ui/drag_bounds_initial', true);
    console.log('📸 Screenshot: Initial state (both panels visible)');

    // ========================================
    // TEST 1: Drag Minimized Panel to Bottom
    // ========================================
    console.log('\n🧪 TEST 1: Minimizing and dragging panel to bottom...');
    
    // First minimize the blue panel
    const minimizeResult = await page.evaluate(() => {
      const panel = window.draggablePanelManager.getPanel('test-drag-bounds-minimized');
      if (!panel) return { success: false, error: 'Panel not found' };
      
      panel.toggleMinimized();
      
      return {
        success: true,
        isMinimized: panel.state.isMinimized,
        currentY: panel.state.position.y
      };
    });
    
    console.log('   Minimized:', minimizeResult.isMinimized);
    
    // Force render after minimize
    await page.evaluate(() => {
      window.gameState = 'PLAYING';
      if (window.draggablePanelManager) {
        window.draggablePanelManager.gameState = 'PLAYING';
        if (typeof window.draggablePanelManager.renderPanels === 'function') {
          window.draggablePanelManager.renderPanels('PLAYING');
        }
      }
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(500);
    await saveScreenshot(page, 'ui/drag_bounds_minimized', true);
    console.log('📸 Screenshot: Blue panel minimized');
    
    // Attempt to drag minimized panel to near bottom
    // IMPORTANT: Use applyDragConstraints to simulate real dragging behavior
    const minimizedDragResult = await page.evaluate(() => {
      const panel = window.draggablePanelManager.getPanel('test-drag-bounds-minimized');
      if (!panel) return { success: false, error: 'Panel not found' };
      
      const canvasHeight = window.height || 720;
      const titleBarHeight = panel.calculateTitleBarHeight(); // Get actual minimized height
      const targetY = canvasHeight - titleBarHeight - 10; // 10px from bottom
      
      // Simulate drag by calling applyDragConstraints (what handleDragging does)
      const constrainedPosition = panel.applyDragConstraints(panel.state.position.x, targetY);
      panel.state.position.y = constrainedPosition.y;
      
      // Get actual position after clamping
      const actualY = panel.state.position.y;
      const fullPanelHeight = panel.config.size.height; // Full height used in constraints
      const expectedMaxY = canvasHeight - titleBarHeight;
      
      // Check if panel can be positioned near bottom
      const canReachBottom = actualY >= (canvasHeight - titleBarHeight - 50);
      
      return {
        success: true,
        targetY: targetY,
        actualY: actualY,
        canvasHeight: canvasHeight,
        titleBarHeight: titleBarHeight,
        fullPanelHeight: fullPanelHeight,
        expectedMaxY: expectedMaxY,
        canReachBottom: canReachBottom,
        distanceFromBottom: canvasHeight - actualY,
        bugDetected: actualY < (canvasHeight - fullPanelHeight + 50) // Clamped to full height
      };
    });
    
    console.log('   Target Y:', minimizedDragResult.targetY);
    console.log('   Actual Y:', minimizedDragResult.actualY);
    console.log('   Title bar height:', minimizedDragResult.titleBarHeight, 'px');
    console.log('   Full panel height:', minimizedDragResult.fullPanelHeight, 'px');
    console.log('   Distance from bottom:', minimizedDragResult.distanceFromBottom, 'px');
    console.log('   Can reach bottom:', minimizedDragResult.canReachBottom);
    console.log('   Bug detected (clamped to full height):', minimizedDragResult.bugDetected);
    
    // Force render after drag
    await page.evaluate(() => {
      window.gameState = 'PLAYING';
      if (window.draggablePanelManager) {
        window.draggablePanelManager.gameState = 'PLAYING';
        if (typeof window.draggablePanelManager.renderPanels === 'function') {
          window.draggablePanelManager.renderPanels('PLAYING');
        }
      }
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(500);
    await saveScreenshot(page, 'ui/drag_bounds_minimized_bottom', minimizedDragResult.canReachBottom);
    console.log('📸 Screenshot: Blue panel dragged to bottom (minimized)');
    
    // Evaluate test 1
    if (minimizedDragResult.canReachBottom) {
      testResults.minimizedDrag.passed = true;
      testResults.minimizedDrag.reason = `✅ PASS: Minimized panel can be dragged to bottom (${minimizedDragResult.distanceFromBottom}px from edge)`;
    } else {
      testResults.minimizedDrag.passed = false;
      testResults.minimizedDrag.reason = `❌ FAIL: Minimized panel blocked ${minimizedDragResult.distanceFromBottom}px from bottom (should allow closer)`;
    }

    // ========================================
    // TEST 2: Drag Non-Minimized Panel to Bottom
    // ========================================
    console.log('\n🧪 TEST 2: Dragging non-minimized panel to bottom...');
    
    const nonMinimizedDragResult = await page.evaluate(() => {
      const panel = window.draggablePanelManager.getPanel('test-drag-bounds-full');
      if (!panel) return { success: false, error: 'Panel not found' };
      
      const canvasHeight = window.height || 720;
      const fullHeight = panel.config.size.height; // Non-minimized height
      const targetY = canvasHeight - fullHeight - 10; // 10px from bottom
      
      // Simulate drag by calling applyDragConstraints (what handleDragging does)
      const constrainedPosition = panel.applyDragConstraints(panel.state.position.x, targetY);
      panel.state.position.y = constrainedPosition.y;
      
      // Get actual position after clamping
      const actualY = panel.state.position.y;
      const expectedMaxY = canvasHeight - fullHeight;
      
      // Check if panel can be positioned near bottom
      const canReachBottom = actualY >= (canvasHeight - fullHeight - 50);
      
      return {
        success: true,
        targetY: targetY,
        actualY: actualY,
        canvasHeight: canvasHeight,
        fullHeight: fullHeight,
        expectedMaxY: expectedMaxY,
        canReachBottom: canReachBottom,
        distanceFromBottom: canvasHeight - actualY
      };
    });
    
    console.log('   Target Y:', nonMinimizedDragResult.targetY);
    console.log('   Actual Y:', nonMinimizedDragResult.actualY);
    console.log('   Distance from bottom:', nonMinimizedDragResult.distanceFromBottom, 'px');
    console.log('   Can reach bottom:', nonMinimizedDragResult.canReachBottom);
    
    // Force render after drag
    await page.evaluate(() => {
      window.gameState = 'PLAYING';
      if (window.draggablePanelManager) {
        window.draggablePanelManager.gameState = 'PLAYING';
        if (typeof window.draggablePanelManager.renderPanels === 'function') {
          window.draggablePanelManager.renderPanels('PLAYING');
        }
      }
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(500);
    await saveScreenshot(page, 'ui/drag_bounds_full_bottom', nonMinimizedDragResult.canReachBottom);
    console.log('📸 Screenshot: Red panel dragged to bottom (non-minimized)');
    
    // Evaluate test 2
    if (nonMinimizedDragResult.canReachBottom) {
      testResults.nonMinimizedDrag.passed = true;
      testResults.nonMinimizedDrag.reason = `✅ PASS: Non-minimized panel can be dragged to bottom (${nonMinimizedDragResult.distanceFromBottom}px from edge)`;
    } else {
      testResults.nonMinimizedDrag.passed = false;
      testResults.nonMinimizedDrag.reason = `❌ FAIL: Non-minimized panel blocked ${nonMinimizedDragResult.distanceFromBottom}px from bottom (expected behavior)`;
    }

    // ========================================
    // Results Summary
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    
    console.log('\n1️⃣  Minimized Panel Drag:');
    console.log('   ', testResults.minimizedDrag.reason);
    
    console.log('\n2️⃣  Non-Minimized Panel Drag:');
    console.log('   ', testResults.nonMinimizedDrag.reason);
    
    console.log('\n' + '='.repeat(60));
    
    // Expected outcome: Bug is present
    // - Minimized panel SHOULD reach bottom but is blocked (BUG)
    // - Non-minimized panel correctly blocked at bottom (CORRECT BEHAVIOR)
    const bugDetected = !testResults.minimizedDrag.passed && testResults.nonMinimizedDrag.passed;
    
    if (bugDetected) {
      console.log('🐛 BUG CONFIRMED: Minimized panels cannot reach bottom!');
      console.log('   - Minimized panel CANNOT reach bottom (BUG!) ❌');
      console.log('   - Non-minimized panel correctly stops at bottom edge ✅');
      console.log('\n   Issue: applyDragConstraints() uses config.size.height instead of current height');
      console.log('   Fix needed: Use calculateTitleBarHeight() for minimized state');
    } else if (testResults.minimizedDrag.passed && testResults.nonMinimizedDrag.passed) {
      console.log('✅ BUG FIXED: Both states work correctly!');
      console.log('   - Minimized panel CAN reach bottom (correct) ✅');
      console.log('   - Non-minimized panel stops at bottom edge ✅');
    } else {
      console.log('⚠️  UNEXPECTED OUTCOME');
      console.log('   Minimized:', testResults.minimizedDrag.passed ? 'PASS' : 'FAIL');
      console.log('   Non-minimized:', testResults.nonMinimizedDrag.passed ? 'PASS' : 'FAIL');
    }
    
    console.log('='.repeat(60));
    console.log('\n📸 Screenshots saved to test/e2e/screenshots/ui/');
    console.log('   - drag_bounds_initial.png (both panels visible)');
    console.log('   - drag_bounds_minimized.png (blue panel minimized)');
    console.log('   - drag_bounds_minimized_bottom.png (minimized at bottom)');
    console.log('   - drag_bounds_full_bottom.png (non-minimized at bottom)');

    await browser.close();
    
    // Exit with appropriate code
    // After fix: Both tests should pass (minimized can reach bottom, non-minimized correctly blocked)
    // Before fix: Minimized would fail (blocked at full height)
    const bothTestsPass = testResults.minimizedDrag.passed && testResults.nonMinimizedDrag.passed;
    const bugFixed = bothTestsPass;
    
    process.exit(bugFixed ? 0 : 1);

  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
    console.error(error.stack);
    
    if (browser) {
      const pages = await browser.pages();
      if (pages && pages[0]) {
        await saveScreenshot(pages[0], 'ui/drag_bounds_error', false);
      }
      await browser.close();
    }
    process.exit(1);
  }
})();
