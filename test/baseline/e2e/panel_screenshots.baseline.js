/**
 * BASELINE E2E TEST - Visual Screenshots
 * 
 * Purpose: Capture visual screenshots of all panels BEFORE auto-sizing feature
 * Run with: node test/baseline/e2e/panel_screenshots.baseline.js
 * 
 * This test:
 * 1. Opens game in Puppeteer
 * 2. Captures full-screen screenshot
 * 3. Captures individual panel screenshots
 * 4. Saves to test/baseline/e2e/screenshots/
 * 5. Can be compared visually after implementation
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots', 'baseline');

// Helper function to replace deprecated waitForTimeout
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function captureScreenshots() {
  console.log('🎯 Starting Visual Screenshot Baseline Tests...\n');

  // Ensure screenshots directory exists
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    console.log(`📁 Created directory: ${SCREENSHOTS_DIR}\n`);
  }

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

    // Force render all panels
    await page.evaluate(() => {
      if (window.draggablePanelManager) {
        window.draggablePanelManager.update(0, 0, false);
        window.draggablePanelManager.renderPanels();
      }
    });
    await wait(500);

    // Get panel information
    const panels = await page.evaluate(() => {
      const panelData = [];
      window.draggablePanelManager.panels.forEach((panel, id) => {
        panelData.push({
          id: id,
          title: panel.config.title,
          x: panel.state.position.x,
          y: panel.state.position.y,
          width: panel.config.size.width,
          height: panel.config.size.height,
          visible: panel.state.visible,
          minimized: panel.state.minimized
        });
      });
      return panelData;
    });

    console.log(`📷 Found ${panels.length} panels to capture\n`);

    // Capture full screen
    console.log('📸 Capturing full-screen view...');
    const fullScreenPath = path.join(SCREENSHOTS_DIR, '00_full_screen.png');
    await page.screenshot({
      path: fullScreenPath,
      fullPage: true
    });
    console.log(`  ✅ Saved: ${fullScreenPath}`);

    // Capture all panels visible
    console.log('\n📸 Capturing all panels (visible state)...');
    await page.evaluate(() => {
      // Make all panels visible
      window.draggablePanelManager.panels.forEach((panel) => {
        panel.state.visible = true;
        panel.state.minimized = false;
      });
      window.draggablePanelManager.renderPanels();
    });
    await wait(500);

    const allPanelsPath = path.join(SCREENSHOTS_DIR, '01_all_panels_visible.png');
    await page.screenshot({
      path: allPanelsPath,
      fullPage: true
    });
    console.log(`  ✅ Saved: ${allPanelsPath}`);

    // Capture each panel individually
    console.log('\n📸 Capturing individual panels...\n');

    for (let i = 0; i < panels.length; i++) {
      const panel = panels[i];
      
      console.log(`  Panel ${i + 1}/${panels.length}: ${panel.id} (${panel.title})`);
      
      if (!panel.visible) {
        console.log(`    ⏭️  Skipped (not visible)`);
        continue;
      }

      // Calculate clip region with padding
      const padding = 10;
      const clip = {
        x: Math.max(0, panel.x - padding),
        y: Math.max(0, panel.y - padding),
        width: panel.width + (padding * 2),
        height: panel.height + (padding * 2)
      };

      // Ensure clip doesn't exceed viewport
      if (clip.x + clip.width > 1920) {
        clip.width = 1920 - clip.x;
      }
      if (clip.y + clip.height > 1080) {
        clip.height = 1080 - clip.y;
      }

      const filename = `panel_${String(i + 2).padStart(2, '0')}_${panel.id.replace(/[^a-z0-9]/gi, '_')}.png`;
      const screenshotPath = path.join(SCREENSHOTS_DIR, filename);

      await page.screenshot({
        path: screenshotPath,
        clip: clip
      });

      console.log(`    ✅ Saved: ${filename}`);
      console.log(`    📐 Size: ${panel.width}x${panel.height} at (${panel.x}, ${panel.y})`);
    }

    // Capture minimized state
    console.log('\n📸 Capturing minimized panels...');
    await page.evaluate(() => {
      // Minimize all panels
      window.draggablePanelManager.panels.forEach((panel) => {
        panel.state.minimized = true;
      });
      window.draggablePanelManager.renderPanels();
    });
    await wait(500);

    const minimizedPath = path.join(SCREENSHOTS_DIR, 'z_all_panels_minimized.png');
    await page.screenshot({
      path: minimizedPath,
      fullPage: true
    });
    console.log(`  ✅ Saved: ${minimizedPath}`);

    // Generate screenshot index
    console.log('\n📝 Generating screenshot index...');
    const indexPath = path.join(SCREENSHOTS_DIR, 'INDEX.md');
    
    let indexContent = `# Baseline Screenshot Index\n\n`;
    indexContent += `**Generated:** ${new Date().toISOString()}\n\n`;
    indexContent += `**Purpose:** Visual baseline BEFORE auto-sizing feature implementation\n\n`;
    indexContent += `**Total Panels:** ${panels.length}\n\n`;
    indexContent += `## Screenshots\n\n`;
    
    indexContent += `### Full Views\n\n`;
    indexContent += `- **00_full_screen.png** - Full game view (initial state)\n`;
    indexContent += `- **01_all_panels_visible.png** - All panels visible and expanded\n`;
    indexContent += `- **z_all_panels_minimized.png** - All panels minimized\n\n`;
    
    indexContent += `### Individual Panels\n\n`;
    panels.forEach((panel, i) => {
      const filename = `panel_${String(i + 2).padStart(2, '0')}_${panel.id.replace(/[^a-z0-9]/gi, '_')}.png`;
      indexContent += `${i + 1}. **${filename}**\n`;
      indexContent += `   - ID: \`${panel.id}\`\n`;
      indexContent += `   - Title: "${panel.title}"\n`;
      indexContent += `   - Size: ${panel.width}x${panel.height}\n`;
      indexContent += `   - Position: (${panel.x}, ${panel.y})\n`;
      indexContent += `   - Visible: ${panel.visible}\n\n`;
    });

    indexContent += `## Comparison Instructions\n\n`;
    indexContent += `After implementing auto-sizing feature:\n\n`;
    indexContent += `1. Run this script again to generate post-implementation screenshots\n`;
    indexContent += `2. They will be saved to \`screenshots/post_implementation/\`\n`;
    indexContent += `3. Use a visual diff tool to compare:\n`;
    indexContent += `   - Full screen views should be IDENTICAL (opt-in feature)\n`;
    indexContent += `   - Individual panels should be IDENTICAL (default disabled)\n`;
    indexContent += `   - Any differences indicate regression or unexpected behavior\n\n`;
    indexContent += `4. Expected result: **NO VISUAL CHANGES**\n`;
    indexContent += `   - Feature defaults to \`autoSizeToContent: false\`\n`;
    indexContent += `   - Only panels with explicit config change should differ\n`;

    fs.writeFileSync(indexPath, indexContent);
    console.log(`  ✅ Saved: ${indexPath}\n`);

    // Summary
    console.log('=' .repeat(80));
    console.log('\n✨ Screenshot capture complete!\n');
    console.log(`📁 Location: ${SCREENSHOTS_DIR}`);
    console.log(`📷 Total screenshots: ${panels.length + 3} (${panels.length} panels + 3 full views)`);
    console.log(`📝 Index: ${indexPath}\n`);
    console.log('💡 Use these screenshots to verify NO CHANGES after implementation');
    console.log('   (auto-sizing is opt-in, all panels should look identical)\n');

  } catch (error) {
    console.error('\n❌ Error during screenshot capture:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run if executed directly
if (require.main === module) {
  captureScreenshots()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = captureScreenshots;
