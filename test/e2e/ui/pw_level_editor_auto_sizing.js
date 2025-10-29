/**
 * E2E Tests for Level Editor Panel Auto-Sizing
 * Verifies that Materials, Tools, and Brush Size panels auto-resize to their content
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Import test helpers
const { launchBrowser, saveScreenshot, sleep } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

const BASE_URL = 'http://localhost:8000';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', 'level_editor_auto_sizing');

describe('Level Editor Panel Auto-Sizing E2E Tests', function() {
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
    
    console.log('🎯 Starting Level Editor Panel Auto-Sizing E2E Tests...');
  });

  after(async function() {
    if (browser) {
      await browser.close();
      console.log('✨ Level Editor Panel Auto-Sizing E2E tests complete!');
    }
  });

  describe('Level Editor Panel Auto-Sizing Verification', () => {
    it('should load the game and switch to LEVEL_EDITOR state', async function() {
      console.log('📂 Loading game...');
      await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
      
      // Start the game first
      console.log('🎮 Starting game...');
      const gameStarted = await cameraHelper.ensureGameStarted(page);
      if (!gameStarted.started) {
        throw new Error('Failed to start game');
      }

      // Switch to LEVEL_EDITOR state
      console.log('🏗️ Switching to LEVEL_EDITOR state...');
      await page.evaluate(() => {
        if (window.GameState && typeof window.GameState.setState === 'function') {
          window.GameState.setState('LEVEL_EDITOR');
          if (typeof window.redraw === 'function') {
            window.redraw();
            window.redraw();
          }
        }
      });

      await sleep(1000);

      // Verify we're in LEVEL_EDITOR state
      const currentState = await page.evaluate(() => {
        return window.GameState ? window.GameState.current : null;
      });

      console.log(`Current game state: ${currentState}`);
      if (currentState !== 'LEVEL_EDITOR') {
        throw new Error(`Expected LEVEL_EDITOR state, got ${currentState}`);
      }

      await saveScreenshot(page, path.join(SCREENSHOT_DIR, 'level_editor_state'), true);
      console.log('✅ Successfully switched to LEVEL_EDITOR state');
    });

    it('should verify Materials panel auto-sizes to content', async function() {
      const panelInfo = await page.evaluate(() => {
        const manager = window.draggablePanelManager;
        if (!manager) return null;

        const panel = manager.panels.get('level-editor-materials');
        if (!panel) return null;

        // Get the palette to calculate expected size
        const levelEditor = window.levelEditor;
        if (!levelEditor || !levelEditor.palette) return null;

        const expectedSize = levelEditor.palette.getContentSize();
        const titleBarHeight = panel.calculateTitleBarHeight();
        const padding = panel.config.style.padding;

        return {
          actualWidth: panel.config.size.width,
          actualHeight: panel.config.size.height,
          expectedContentWidth: expectedSize.width,
          expectedContentHeight: expectedSize.height,
          titleBarHeight: titleBarHeight,
          padding: padding,
          calculatedWidth: expectedSize.width + (padding * 2),
          calculatedHeight: titleBarHeight + expectedSize.height + (padding * 2),
          autoSizeEnabled: panel.config.behavior.contentSizeCallback ? true : false
        };
      });

      if (!panelInfo) {
        throw new Error('Materials panel not found');
      }

      console.log('\n📐 Materials Panel Calculations:');
      console.log(`  Content Size: ${panelInfo.expectedContentWidth}×${panelInfo.expectedContentHeight}px`);
      console.log(`  Title Bar Height: ${panelInfo.titleBarHeight}px`);
      console.log(`  Padding: ${panelInfo.padding}px`);
      console.log(`  ---`);
      console.log(`  Calculated Width: ${panelInfo.calculatedWidth}px`);
      console.log(`  Calculated Height: ${panelInfo.calculatedHeight}px`);
      console.log(`  Actual Width: ${panelInfo.actualWidth}px`);
      console.log(`  Actual Height: ${panelInfo.actualHeight}px`);
      console.log(`  Auto-Size Enabled: ${panelInfo.autoSizeEnabled ? '✅' : '❌'}`);

      // Verify dimensions match (within 2px tolerance)
      const widthMatch = Math.abs(panelInfo.calculatedWidth - panelInfo.actualWidth) < 2;
      const heightMatch = Math.abs(panelInfo.calculatedHeight - panelInfo.actualHeight) < 2;

      console.log(`  Width Match: ${widthMatch ? '✅' : '❌'}`);
      console.log(`  Height Match: ${heightMatch ? '✅' : '❌'}`);

      if (!widthMatch || !heightMatch) {
        throw new Error(`Materials panel size mismatch: expected ${panelInfo.calculatedWidth}×${panelInfo.calculatedHeight}, got ${panelInfo.actualWidth}×${panelInfo.actualHeight}`);
      }

      await saveScreenshot(page, path.join(SCREENSHOT_DIR, 'materials_panel'), true);
    });

    it('should verify Tools panel auto-sizes to content', async function() {
      const panelInfo = await page.evaluate(() => {
        const manager = window.draggablePanelManager;
        if (!manager) return null;

        const panel = manager.panels.get('level-editor-tools');
        if (!panel) return null;

        const levelEditor = window.levelEditor;
        if (!levelEditor || !levelEditor.toolbar) return null;

        const expectedSize = levelEditor.toolbar.getContentSize();
        const titleBarHeight = panel.calculateTitleBarHeight();
        const padding = panel.config.style.padding;

        return {
          actualWidth: panel.config.size.width,
          actualHeight: panel.config.size.height,
          expectedContentWidth: expectedSize.width,
          expectedContentHeight: expectedSize.height,
          titleBarHeight: titleBarHeight,
          padding: padding,
          calculatedWidth: expectedSize.width + (padding * 2),
          calculatedHeight: titleBarHeight + expectedSize.height + (padding * 2),
          autoSizeEnabled: panel.config.behavior.contentSizeCallback ? true : false
        };
      });

      if (!panelInfo) {
        throw new Error('Tools panel not found');
      }

      console.log('\n📐 Tools Panel Calculations:');
      console.log(`  Content Size: ${panelInfo.expectedContentWidth}×${panelInfo.expectedContentHeight}px`);
      console.log(`  Title Bar Height: ${panelInfo.titleBarHeight}px`);
      console.log(`  Padding: ${panelInfo.padding}px`);
      console.log(`  ---`);
      console.log(`  Calculated Width: ${panelInfo.calculatedWidth}px`);
      console.log(`  Calculated Height: ${panelInfo.calculatedHeight}px`);
      console.log(`  Actual Width: ${panelInfo.actualWidth}px`);
      console.log(`  Actual Height: ${panelInfo.actualHeight}px`);
      console.log(`  Auto-Size Enabled: ${panelInfo.autoSizeEnabled ? '✅' : '❌'}`);

      const widthMatch = Math.abs(panelInfo.calculatedWidth - panelInfo.actualWidth) < 2;
      const heightMatch = Math.abs(panelInfo.calculatedHeight - panelInfo.actualHeight) < 2;

      console.log(`  Width Match: ${widthMatch ? '✅' : '❌'}`);
      console.log(`  Height Match: ${heightMatch ? '✅' : '❌'}`);

      if (!widthMatch || !heightMatch) {
        throw new Error(`Tools panel size mismatch`);
      }

      await saveScreenshot(page, path.join(SCREENSHOT_DIR, 'tools_panel'), true);
    });

    it('should verify Brush Size panel auto-sizes to content', async function() {
      const panelInfo = await page.evaluate(() => {
        const manager = window.draggablePanelManager;
        if (!manager) return null;

        const panel = manager.panels.get('level-editor-brush');
        if (!panel) return null;

        const levelEditor = window.levelEditor;
        if (!levelEditor || !levelEditor.brushControl) return null;

        const expectedSize = levelEditor.brushControl.getContentSize();
        const titleBarHeight = panel.calculateTitleBarHeight();
        const padding = panel.config.style.padding;

        return {
          actualWidth: panel.config.size.width,
          actualHeight: panel.config.size.height,
          expectedContentWidth: expectedSize.width,
          expectedContentHeight: expectedSize.height,
          titleBarHeight: titleBarHeight,
          padding: padding,
          calculatedWidth: expectedSize.width + (padding * 2),
          calculatedHeight: titleBarHeight + expectedSize.height + (padding * 2),
          autoSizeEnabled: panel.config.behavior.contentSizeCallback ? true : false
        };
      });

      if (!panelInfo) {
        throw new Error('Brush Size panel not found');
      }

      console.log('\n📐 Brush Size Panel Calculations:');
      console.log(`  Content Size: ${panelInfo.expectedContentWidth}×${panelInfo.expectedContentHeight}px`);
      console.log(`  Title Bar Height: ${panelInfo.titleBarHeight}px`);
      console.log(`  Padding: ${panelInfo.padding}px`);
      console.log(`  ---`);
      console.log(`  Calculated Width: ${panelInfo.calculatedWidth}px`);
      console.log(`  Calculated Height: ${panelInfo.calculatedHeight}px`);
      console.log(`  Actual Width: ${panelInfo.actualWidth}px`);
      console.log(`  Actual Height: ${panelInfo.actualHeight}px`);
      console.log(`  Auto-Size Enabled: ${panelInfo.autoSizeEnabled ? '✅' : '❌'}`);

      const widthMatch = Math.abs(panelInfo.calculatedWidth - panelInfo.actualWidth) < 2;
      const heightMatch = Math.abs(panelInfo.calculatedHeight - panelInfo.actualHeight) < 2;

      console.log(`  Width Match: ${widthMatch ? '✅' : '❌'}`);
      console.log(`  Height Match: ${heightMatch ? '✅' : '❌'}`);

      if (!widthMatch || !heightMatch) {
        throw new Error(`Brush Size panel size mismatch`);
      }

      await saveScreenshot(page, path.join(SCREENSHOT_DIR, 'brush_size_panel'), true);
    });

    it('should verify panels maintain stable size over time', async function() {
      console.log('\n🔄 Testing panel stability over 50 update cycles...');

      const results = await page.evaluate(() => {
        const results = {};
        const panelIds = ['level-editor-materials', 'level-editor-tools', 'level-editor-brush'];
        const manager = window.draggablePanelManager;
        
        // Capture initial sizes
        panelIds.forEach(id => {
          const panel = manager.panels.get(id);
          if (panel) {
            results[id] = {
              initialWidth: panel.config.size.width,
              initialHeight: panel.config.size.height,
              widths: [panel.config.size.width],
              heights: [panel.config.size.height]
            };
          }
        });

        // Run 50 update cycles
        for (let i = 0; i < 50; i++) {
          panelIds.forEach(id => {
            const panel = manager.panels.get(id);
            if (panel) {
              panel.update(0, 0, false);
              results[id].widths.push(panel.config.size.width);
              results[id].heights.push(panel.config.size.height);
            }
          });
        }

        // Check if any sizes changed
        panelIds.forEach(id => {
          if (results[id]) {
            const widths = results[id].widths;
            const heights = results[id].heights;
            const widthStable = widths.every(w => w === widths[0]);
            const heightStable = heights.every(h => h === heights[0]);
            results[id].stable = widthStable && heightStable;
            results[id].finalWidth = widths[widths.length - 1];
            results[id].finalHeight = heights[heights.length - 1];
          }
        });

        return results;
      });

      console.log('\nStability Test Results:');
      console.log('='.repeat(80));
      Object.entries(results).forEach(([id, data]) => {
        const status = data.stable ? '✅ STABLE' : '❌ GROWING';
        console.log(`  ${id}:`);
        console.log(`    ${data.initialWidth}×${data.initialHeight}px → ${data.finalWidth}×${data.finalHeight}px (${status})`);
      });
      console.log('='.repeat(80));

      // Verify all panels are stable
      const allStable = Object.values(results).every(r => r.stable);
      if (!allStable) {
        throw new Error('Some panels are not stable over time');
      }

      await saveScreenshot(page, path.join(SCREENSHOT_DIR, 'stability_test'), true);
    });

    it('should capture final screenshot of all level editor panels', async function() {
      console.log('\n📷 Capturing final screenshot...');

      // Get all panel info for summary
      const panelSummary = await page.evaluate(() => {
        const manager = window.draggablePanelManager;
        const levelEditor = window.levelEditor;
        const summary = [];

        const panels = [
          { id: 'level-editor-materials', name: 'Materials', component: levelEditor?.palette },
          { id: 'level-editor-tools', name: 'Tools', component: levelEditor?.toolbar },
          { id: 'level-editor-brush', name: 'Brush Size', component: levelEditor?.brushControl }
        ];

        panels.forEach(({ id, name, component }) => {
          const panel = manager.panels.get(id);
          if (panel && component) {
            const contentSize = component.getContentSize();
            summary.push({
              name: name,
              size: `${panel.config.size.width}×${panel.config.size.height}`,
              contentSize: `${contentSize.width}×${contentSize.height}`,
              position: `(${panel.getPosition().x}, ${panel.getPosition().y})`
            });
          }
        });

        return summary;
      });

      console.log('\n📊 Level Editor Panel Summary:');
      console.log('='.repeat(80));
      panelSummary.forEach(panel => {
        console.log(`\n${panel.name}:`);
        console.log(`  Panel Size: ${panel.size}px`);
        console.log(`  Content Size: ${panel.contentSize}px`);
        console.log(`  Position: ${panel.position}`);
      });
      console.log('='.repeat(80));

      await saveScreenshot(page, path.join(SCREENSHOT_DIR, 'all_level_editor_panels'), true);
      console.log('\n✅ All level editor panels auto-sizing correctly!');
    });
  });
});
