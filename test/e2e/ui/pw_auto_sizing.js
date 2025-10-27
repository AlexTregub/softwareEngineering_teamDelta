/**
 * E2E Tests for Auto-Sizing Feature
 * Verifies that panels with autoSizeToContent enabled properly resize in the browser
 * Captures screenshots as visual proof
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Import test helpers
const { launchBrowser, saveScreenshot, sleep } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

const BASE_URL = 'http://localhost:8000';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', 'auto_sizing');

describe('Auto-Sizing Feature E2E Tests', function() {
  this.timeout(60000); // 60 second timeout for browser tests

  let browser;
  let page;

  before(async function() {
    // Create screenshot directory
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }

    // Launch browser
    browser = await launchBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('🎯 Starting Auto-Sizing E2E Tests...');
  });

  after(async function() {
    if (browser) {
      await browser.close();
      console.log('✨ Auto-Sizing E2E tests complete!');
    }
  });

  describe('Panel Auto-Sizing Verification', () => {
    it('should load the game and verify auto-sized panels exist', async function() {
      console.log('📂 Loading game...');
      await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
      
      // Ensure game has started
      console.log('🎮 Advancing to PLAYING state...');
      const gameStarted = await cameraHelper.ensureGameStarted(page);
      if (!gameStarted.started) {
        throw new Error('Failed to start game - still on main menu');
      }

      // Force rendering
      await page.evaluate(() => {
        if (typeof window.redraw === 'function') {
          window.redraw();
          window.redraw();
        }
      });
      await sleep(500);

      // Get auto-sized panels
      const panels = await page.evaluate(() => {
        const autoSizedPanels = [];
        const manager = window.draggablePanelManager;
        
        if (manager && manager.panels) {
          const panelIds = ['ant_spawn', 'health_controls', 'buildings'];
          
          panelIds.forEach(id => {
            const panel = manager.panels.get(id);
            if (panel) {
              autoSizedPanels.push({
                id: id,
                title: panel.config.title,
                width: panel.config.size.width,
                height: panel.config.size.height,
                autoSizeEnabled: panel.config.buttons.autoSizeToContent || false,
                buttonCount: panel.buttons.length,
                layout: panel.config.buttons.layout,
                position: panel.getPosition()
              });
            }
          });
        }
        
        return autoSizedPanels;
      });

      console.log('\n📏 Auto-Sized Panels:');
      console.log('='.repeat(80));
      panels.forEach(panel => {
        console.log(`\n${panel.id}:`);
        console.log(`  Title: "${panel.title}"`);
        console.log(`  Dimensions: ${panel.width}x${panel.height}`);
        console.log(`  Position: (${panel.position.x}, ${panel.position.y})`);
        console.log(`  Auto-Size Enabled: ${panel.autoSizeEnabled}`);
        console.log(`  Buttons: ${panel.buttonCount}`);
        console.log(`  Layout: ${panel.layout}`);
      });
      console.log('='.repeat(80) + '\n');

      // Verify all panels have auto-sizing enabled
      const allEnabled = panels.every(p => p.autoSizeEnabled === true);
      if (!allEnabled) {
        throw new Error('Not all panels have autoSizeToContent enabled');
      }

      // Capture screenshot
      await saveScreenshot(page, path.join(SCREENSHOT_DIR, 'all_auto_sized_panels'), true);
      
      console.log(`✅ Found ${panels.length} auto-sized panels`);
    });

    it('should verify ant_spawn panel auto-sized correctly', async function() {
      // Get panel dimensions
      const panelInfo = await page.evaluate(() => {
        const panel = window.draggablePanelManager.panels.get('ant_spawn');
        if (!panel) return null;

        const titleBarHeight = panel.calculateTitleBarHeight();
        const tallestColumnHeight = panel.calculateTallestColumnHeight();
        const verticalPadding = panel.config.buttons.verticalPadding;
        const buttonHeight = panel.config.buttons.buttonHeight;
        const spacing = panel.config.buttons.spacing;
        const buttonCount = panel.buttons.length;

        return {
          actualHeight: panel.config.size.height,
          titleBarHeight: titleBarHeight,
          tallestColumnHeight: tallestColumnHeight,
          verticalPadding: verticalPadding,
          buttonHeight: buttonHeight,
          spacing: spacing,
          buttonCount: buttonCount,
          calculatedHeight: titleBarHeight + tallestColumnHeight + (verticalPadding * 2)
        };
      });

      console.log('\n📐 ant_spawn Panel Calculations:');
      console.log(`  Title Bar Height: ${panelInfo.titleBarHeight}px`);
      console.log(`  Tallest Column Height: ${panelInfo.tallestColumnHeight}px`);
      console.log(`  Vertical Padding (×2): ${panelInfo.verticalPadding * 2}px`);
      console.log(`  ---`);
      console.log(`  Calculated Height: ${panelInfo.calculatedHeight}px`);
      console.log(`  Actual Height: ${panelInfo.actualHeight}px`);
      console.log(`  Match: ${Math.abs(panelInfo.calculatedHeight - panelInfo.actualHeight) < 2 ? '✅' : '❌'}`);

      // Verify height is correct (within 2px tolerance)
      const heightMatch = Math.abs(panelInfo.calculatedHeight - panelInfo.actualHeight) < 2;
      if (!heightMatch) {
        throw new Error(`ant_spawn panel height mismatch: expected ${panelInfo.calculatedHeight}, got ${panelInfo.actualHeight}`);
      }

      // Capture screenshot
      await saveScreenshot(page, path.join(SCREENSHOT_DIR, 'ant_spawn_panel'), true);
    });

    it('should verify health_controls panel auto-sized correctly', async function() {
      const panelInfo = await page.evaluate(() => {
        const panel = window.draggablePanelManager.panels.get('health_controls');
        if (!panel) return null;

        const titleBarHeight = panel.calculateTitleBarHeight();
        const tallestColumnHeight = panel.calculateTallestColumnHeight();
        const verticalPadding = panel.config.buttons.verticalPadding;

        return {
          actualHeight: panel.config.size.height,
          titleBarHeight: titleBarHeight,
          tallestColumnHeight: tallestColumnHeight,
          verticalPadding: verticalPadding,
          buttonCount: panel.buttons.length,
          calculatedHeight: titleBarHeight + tallestColumnHeight + (verticalPadding * 2)
        };
      });

      console.log('\n📐 health_controls Panel Calculations:');
      console.log(`  Title Bar Height: ${panelInfo.titleBarHeight}px`);
      console.log(`  Tallest Column Height: ${panelInfo.tallestColumnHeight}px`);
      console.log(`  Vertical Padding (×2): ${panelInfo.verticalPadding * 2}px`);
      console.log(`  ---`);
      console.log(`  Calculated Height: ${panelInfo.calculatedHeight}px`);
      console.log(`  Actual Height: ${panelInfo.actualHeight}px`);
      console.log(`  Match: ${Math.abs(panelInfo.calculatedHeight - panelInfo.actualHeight) < 2 ? '✅' : '❌'}`);

      const heightMatch = Math.abs(panelInfo.calculatedHeight - panelInfo.actualHeight) < 2;
      if (!heightMatch) {
        throw new Error(`health_controls panel height mismatch`);
      }

      await saveScreenshot(page, path.join(SCREENSHOT_DIR, 'health_controls_panel'), true);
    });

    it('should verify buildings panel auto-sized correctly', async function() {
      const panelInfo = await page.evaluate(() => {
        const panel = window.draggablePanelManager.panels.get('buildings');
        if (!panel) return null;

        const titleBarHeight = panel.calculateTitleBarHeight();
        const tallestColumnHeight = panel.calculateTallestColumnHeight();
        const verticalPadding = panel.config.buttons.verticalPadding;

        return {
          actualHeight: panel.config.size.height,
          titleBarHeight: titleBarHeight,
          tallestColumnHeight: tallestColumnHeight,
          verticalPadding: verticalPadding,
          buttonCount: panel.buttons.length,
          calculatedHeight: titleBarHeight + tallestColumnHeight + (verticalPadding * 2)
        };
      });

      console.log('\n📐 buildings Panel Calculations:');
      console.log(`  Title Bar Height: ${panelInfo.titleBarHeight}px`);
      console.log(`  Tallest Column Height: ${panelInfo.tallestColumnHeight}px`);
      console.log(`  Vertical Padding (×2): ${panelInfo.verticalPadding * 2}px`);
      console.log(`  ---`);
      console.log(`  Calculated Height: ${panelInfo.calculatedHeight}px`);
      console.log(`  Actual Height: ${panelInfo.actualHeight}px`);
      console.log(`  Match: ${Math.abs(panelInfo.calculatedHeight - panelInfo.actualHeight) < 2 ? '✅' : '❌'}`);

      const heightMatch = Math.abs(panelInfo.calculatedHeight - panelInfo.actualHeight) < 2;
      if (!heightMatch) {
        throw new Error(`buildings panel height mismatch`);
      }

      await saveScreenshot(page, path.join(SCREENSHOT_DIR, 'buildings_panel'), true);
    });

    it('should verify panels maintain stable height over time', async function() {
      console.log('\n🔄 Testing panel stability over 50 update cycles...');

      const results = await page.evaluate(() => {
        const results = {};
        const panelIds = ['ant_spawn', 'health_controls', 'buildings'];
        
        // Capture initial heights
        panelIds.forEach(id => {
          const panel = window.draggablePanelManager.panels.get(id);
          if (panel) {
            results[id] = {
              initialHeight: panel.config.size.height,
              heights: [panel.config.size.height]
            };
          }
        });

        // Run 50 update cycles
        for (let i = 0; i < 50; i++) {
          panelIds.forEach(id => {
            const panel = window.draggablePanelManager.panels.get(id);
            if (panel) {
              panel.update(0, 0, false);
              results[id].heights.push(panel.config.size.height);
            }
          });
        }

        // Check if any heights changed
        panelIds.forEach(id => {
          if (results[id]) {
            const heights = results[id].heights;
            const allSame = heights.every(h => h === heights[0]);
            results[id].stable = allSame;
            results[id].finalHeight = heights[heights.length - 1];
          }
        });

        return results;
      });

      console.log('\nStability Test Results:');
      console.log('='.repeat(80));
      Object.entries(results).forEach(([id, data]) => {
        const status = data.stable ? '✅ STABLE' : '❌ GROWING';
        console.log(`  ${id}: ${data.initialHeight}px → ${data.finalHeight}px (${status})`);
      });
      console.log('='.repeat(80));

      // Verify all panels are stable
      const allStable = Object.values(results).every(r => r.stable);
      if (!allStable) {
        throw new Error('Some panels are not stable over time');
      }

      await saveScreenshot(page, path.join(SCREENSHOT_DIR, 'stability_test'), true);
    });

    it('should verify width is NOT resized for vertical layout panels', async function() {
      const widthCheck = await page.evaluate(() => {
        const panelIds = ['ant_spawn', 'health_controls', 'buildings'];
        const results = {};

        panelIds.forEach(id => {
          const panel = window.draggablePanelManager.panels.get(id);
          if (panel) {
            const initialWidth = panel.config.size.width;
            
            // Run update
            panel.update(0, 0, false);
            
            results[id] = {
              layout: panel.config.buttons.layout,
              initialWidth: initialWidth,
              finalWidth: panel.config.size.width,
              widthPreserved: initialWidth === panel.config.size.width
            };
          }
        });

        return results;
      });

      console.log('\nWidth Preservation Test:');
      console.log('='.repeat(80));
      Object.entries(widthCheck).forEach(([id, data]) => {
        const status = data.widthPreserved ? '✅ PRESERVED' : '❌ CHANGED';
        console.log(`  ${id} (${data.layout}): ${data.initialWidth}px → ${data.finalWidth}px (${status})`);
      });
      console.log('='.repeat(80));

      // Verify width is preserved for all vertical layout panels
      const allPreserved = Object.values(widthCheck).every(r => r.widthPreserved);
      if (!allPreserved) {
        throw new Error('Width was resized for vertical layout panels (should only resize height)');
      }
    });
  });
});
