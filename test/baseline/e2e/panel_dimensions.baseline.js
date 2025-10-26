/**
 * BASELINE E2E TEST - Panel Dimensions
 * 
 * Purpose: Capture actual panel dimensions in real browser BEFORE auto-sizing feature
 * Run with: node test/baseline/e2e/panel_dimensions.baseline.js
 * 
 * This test:
 * 1. Opens game in Puppeteer
 * 2. Advances past main menu
 * 3. Measures all panel dimensions
 * 4. Stores results in baseline_results.json
 * 5. Can be compared after implementation
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASELINE_RESULTS_FILE = path.join(__dirname, 'baseline_results.json');

// Helper function to replace deprecated waitForTimeout
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runBaselineTests() {
  console.log('🎯 Starting Baseline E2E Tests...\n');

  const browser = await puppeteer.launch({
    headless: true, // Run headless
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    // Navigate to game
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

    // Wait for panels to initialize
    await wait(2000);

    // Force render
    await page.evaluate(() => {
      if (typeof window.draggablePanelManager !== 'undefined') {
        window.draggablePanelManager.update(0, 0, false);
        window.draggablePanelManager.renderPanels();
      }
    });

    console.log('\n📏 Measuring panel dimensions...\n');

    // Get all panel dimensions
    const panelData = await page.evaluate(() => {
      const results = {};
      
      if (!window.draggablePanelManager) {
        return { error: 'DraggablePanelManager not found' };
      }

      window.draggablePanelManager.panels.forEach((panel, id) => {
        results[id] = {
          id: panel.config.id,
          title: panel.config.title,
          width: panel.config.size.width,
          height: panel.config.size.height,
          position: {
            x: panel.state.position.x,
            y: panel.state.position.y
          },
          layout: panel.config.buttons.layout,
          columns: panel.config.buttons.columns || null,
          buttonCount: panel.buttons.length,
          spacing: panel.config.buttons.spacing,
          visible: panel.state.visible,
          minimized: panel.state.minimized,
          managedExternally: panel.config.behavior.managedExternally || false
        };
      });

      return results;
    });

    // Display results
    console.log('Panel Dimensions (Baseline):');
    console.log('=' .repeat(80));
    
    const panels = Object.entries(panelData);
    for (const [key, data] of panels) {
      console.log(`\n${key}:`);
      console.log(`  Title: ${data.title}`);
      console.log(`  Dimensions: ${data.width}x${data.height}`);
      console.log(`  Position: (${data.position.x}, ${data.position.y})`);
      console.log(`  Layout: ${data.layout}${data.columns ? ` (${data.columns} cols)` : ''}`);
      console.log(`  Buttons: ${data.buttonCount}`);
      console.log(`  Spacing: ${data.spacing}`);
      console.log(`  Managed Externally: ${data.managedExternally}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log(`\n✅ Found ${panels.length} panels`);

    // Save baseline results
    const baselineResults = {
      timestamp: new Date().toISOString(),
      testDescription: 'Baseline panel dimensions before auto-sizing feature',
      totalPanels: panels.length,
      panels: panelData
    };

    fs.writeFileSync(
      BASELINE_RESULTS_FILE,
      JSON.stringify(baselineResults, null, 2)
    );

    console.log(`\n💾 Baseline results saved to: ${BASELINE_RESULTS_FILE}`);

    // Test for growth bug
    console.log('\n🔄 Testing for panel growth over time...');
    
    const initialHeights = {};
    panels.forEach(([key, data]) => {
      initialHeights[key] = data.height;
    });

      // Simulate 20 seconds of updates
      for (let i = 0; i < 40; i++) {
        await page.evaluate(() => {
          if (window.draggablePanelManager) {
            window.draggablePanelManager.update(0, 0, false);
          }
        });
        await wait(500);
      }    // Measure again
    const finalHeights = await page.evaluate(() => {
      const heights = {};
      window.draggablePanelManager.panels.forEach((panel, id) => {
        heights[id] = panel.config.size.height;
      });
      return heights;
    });

    let growthDetected = false;
    console.log('\nGrowth Test Results:');
    panels.forEach(([key]) => {
      const growth = finalHeights[key] - initialHeights[key];
      if (Math.abs(growth) > 0.1) {
        console.log(`  ⚠️  ${key}: ${initialHeights[key]}px → ${finalHeights[key]}px (${growth > 0 ? '+' : ''}${growth.toFixed(1)}px)`);
        growthDetected = true;
      } else {
        console.log(`  ✅ ${key}: ${initialHeights[key]}px (stable)`);
      }
    });

    if (growthDetected) {
      console.log('\n⚠️  WARNING: Panel growth detected! This is a known bug that should be fixed.');
    } else {
      console.log('\n✅ No panel growth detected - all panels stable!');
    }

    console.log('\n✨ Baseline tests complete!\n');

  } catch (error) {
    console.error('\n❌ Error during baseline tests:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run if executed directly
if (require.main === module) {
  runBaselineTests()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = runBaselineTests;
