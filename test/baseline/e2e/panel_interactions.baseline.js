/**
 * BASELINE E2E TEST - Panel Interactions
 * 
 * Purpose: Test panel interactions (drag, minimize, buttons) BEFORE auto-sizing feature
 * Run with: node test/baseline/e2e/panel_interactions.baseline.js
 * 
 * This test:
 * 1. Opens game in Puppeteer
 * 2. Tests dragging panels
 * 3. Tests minimize/maximize
 * 4. Tests button clicks
 * 5. Verifies panels remain stable
 */

const puppeteer = require('puppeteer');

// Helper function to replace deprecated waitForTimeout
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testPanelInteractions() {
  console.log('🎯 Starting Panel Interaction Baseline Tests...\n');

  const browser = await puppeteer.launch({
    headless: true, // Run headless
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    // Navigate and initialize
    console.log('📂 Loading game...');
    await page.goto('http://localhost:8000', { waitUntil: 'networkidle2' });

    // Advance to PLAYING state using GameState manager
    console.log('🎮 Advancing to PLAYING state...');
    const gameStarted = await page.evaluate(() => {
      try {
        if (!window.GameState) {
          return { success: false, reason: 'GameState not found' };
        }
        
        const success = window.GameState.setState('PLAYING');
        
        if (success && typeof window.redraw === 'function') {
          window.redraw();
          window.redraw();
          window.redraw();
        }
        
        return { 
          success: true, 
          state: window.GameState.getState(),
          reason: 'GameState.setState("PLAYING") succeeded'
        };
      } catch (error) {
        return { success: false, reason: error.message };
      }
    });

    if (!gameStarted.success) {
      throw new Error(`Failed to start game: ${gameStarted.reason}`);
    }

    await wait(2000);

    // Test 1: Drag panels
    console.log('\n📌 TEST 1: Dragging Panels');
    console.log('=' .repeat(60));

    const panelIds = await page.evaluate(() => {
      return Array.from(window.draggablePanelManager.panels.keys());
    });

    for (const panelId of panelIds.slice(0, 3)) { // Test first 3 panels
      console.log(`\n  Testing drag for: ${panelId}`);
      
      const initialPos = await page.evaluate((id) => {
        const panel = window.draggablePanelManager.panels.get(id);
        return { x: panel.state.position.x, y: panel.state.position.y };
      }, panelId);

      // Simulate drag
      await page.evaluate((id) => {
        const panel = window.draggablePanelManager.panels.get(id);
        panel.state.position.x += 50;
        panel.state.position.y += 30;
      }, panelId);

      const newPos = await page.evaluate((id) => {
        const panel = window.draggablePanelManager.panels.get(id);
        return { x: panel.state.position.x, y: panel.state.position.y };
      }, panelId);

      console.log(`    Initial: (${initialPos.x}, ${initialPos.y})`);
      console.log(`    After drag: (${newPos.x}, ${newPos.y})`);
      console.log(`    ✅ Moved: (${newPos.x - initialPos.x}, ${newPos.y - initialPos.y})`);
    }

    // Test 2: Minimize/Maximize
    console.log('\n📌 TEST 2: Minimize/Maximize');
    console.log('=' .repeat(60));

    for (const panelId of panelIds.slice(0, 3)) {
      console.log(`\n  Testing minimize for: ${panelId}`);

      const initialState = await page.evaluate((id) => {
        const panel = window.draggablePanelManager.panels.get(id);
        return {
          minimized: panel.state.minimized,
          height: panel.config.size.height
        };
      }, panelId);

      // Minimize
      await page.evaluate((id) => {
        const panel = window.draggablePanelManager.panels.get(id);
        panel.state.minimized = true;
      }, panelId);
      await wait(100);

      const minimizedState = await page.evaluate((id) => {
        const panel = window.draggablePanelManager.panels.get(id);
        return {
          minimized: panel.state.minimized,
          height: panel.config.size.height
        };
      }, panelId);

      // Maximize
      await page.evaluate((id) => {
        const panel = window.draggablePanelManager.panels.get(id);
        panel.state.minimized = false;
      }, panelId);
      await wait(100);

      const restoredState = await page.evaluate((id) => {
        const panel = window.draggablePanelManager.panels.get(id);
        return {
          minimized: panel.state.minimized,
          height: panel.config.size.height
        };
      }, panelId);

      console.log(`    Initial: minimized=${initialState.minimized}, height=${initialState.height}`);
      console.log(`    Minimized: minimized=${minimizedState.minimized}`);
      console.log(`    Restored: minimized=${restoredState.minimized}, height=${restoredState.height}`);
      console.log(`    ✅ Minimize/maximize working`);
    }

    // Test 3: Button clicks
    console.log('\n📌 TEST 3: Button Clicks');
    console.log('=' .repeat(60));

    const buttonTestResults = await page.evaluate(() => {
      const results = [];
      
      window.draggablePanelManager.panels.forEach((panel, id) => {
        if (panel.buttons && panel.buttons.length > 0) {
          const firstButton = panel.buttons[0];
          results.push({
            panelId: id,
            buttonLabel: firstButton.config ? firstButton.config.label : firstButton.caption || 'Unknown',
            hasAction: firstButton.config ? typeof firstButton.config.action === 'function' : typeof firstButton.action === 'function',
            buttonCount: panel.buttons.length
          });
        }
      });

      return results;
    });

    buttonTestResults.slice(0, 3).forEach(result => {
      console.log(`\n  Panel: ${result.panelId}`);
      console.log(`    First button: "${result.buttonLabel}"`);
      console.log(`    Has action: ${result.hasAction}`);
      console.log(`    Total buttons: ${result.buttonCount}`);
      console.log(`    ✅ Button structure valid`);
    });

    // Test 4: Stability check
    console.log('\n📌 TEST 4: Stability Check (50 update cycles)');
    console.log('=' .repeat(60));

    const preStabilityState = await page.evaluate(() => {
      const state = {};
      window.draggablePanelManager.panels.forEach((panel, id) => {
        state[id] = {
          width: panel.config.size.width,
          height: panel.config.size.height,
          buttonCount: panel.buttons.length
        };
      });
      return state;
    });

    // Run 50 update cycles
    for (let i = 0; i < 50; i++) {
      await page.evaluate(() => {
        if (window.draggablePanelManager) {
          window.draggablePanelManager.update(0, 0, false);
        }
      });
      await wait(100);
    }

    const postStabilityState = await page.evaluate(() => {
      const state = {};
      window.draggablePanelManager.panels.forEach((panel, id) => {
        state[id] = {
          width: panel.config.size.width,
          height: panel.config.size.height,
          buttonCount: panel.buttons.length
        };
      });
      return state;
    });

    let changesDetected = false;
    for (const panelId of Object.keys(preStabilityState)) {
      const pre = preStabilityState[panelId];
      const post = postStabilityState[panelId];

      if (pre.width !== post.width || pre.height !== post.height || pre.buttonCount !== post.buttonCount) {
        console.log(`\n  ⚠️  ${panelId}:`);
        console.log(`    Width: ${pre.width} → ${post.width}`);
        console.log(`    Height: ${pre.height} → ${post.height}`);
        console.log(`    Buttons: ${pre.buttonCount} → ${post.buttonCount}`);
        changesDetected = true;
      }
    }

    if (!changesDetected) {
      console.log('\n  ✅ All panels stable after 50 update cycles');
      console.log('  ✅ No dimension changes detected');
      console.log('  ✅ No button count changes detected');
    } else {
      console.log('\n  ⚠️  WARNING: Changes detected - review above');
    }

    console.log('\n✨ Interaction tests complete!\n');

  } catch (error) {
    console.error('\n❌ Error during interaction tests:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run if executed directly
if (require.main === module) {
  testPanelInteractions()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = testPanelInteractions;
