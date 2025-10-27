/**
 * E2E Test: Offset Value Calibration
 * 
 * Tests different stroke offset values to find the optimal alignment.
 * Creates side-by-side comparisons with different offsets.
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('=== Stroke Offset Calibration Test ===\n');
    
    await page.goto('http://localhost:8000?test=1');
    await sleep(500);
    
    await page.evaluate(() => {
      GameState.goToLevelEditor();
    });
    
    await sleep(300);
    
    // Test offsets: -0.5, 0, 0.5, 1.0
    const offsets = [-0.5, 0, 0.5, 1.0];
    
    for (const offset of offsets) {
      console.log(`\nTesting offset: ${offset}px\n`);
      
      await page.evaluate((offsetValue) => {
        const terrain = levelEditor.terrain;
        
        // Clear and paint pattern
        for (let y = 0; y < 10; y++) {
          for (let x = 0; x < 10; x++) {
            terrain.tiles[y][x].setMaterial('grass');
            terrain.tiles[y][x].assignWeight();
          }
        }
        
        // Paint checkerboard
        for (let y = 3; y < 9; y++) {
          for (let x = 3; x < 9; x++) {
            if ((x + y) % 2 === 0) {
              terrain.tiles[y][x].setMaterial('stone');
            } else {
              terrain.tiles[y][x].setMaterial('moss');
            }
            terrain.tiles[y][x].assignWeight();
          }
        }
        
        terrain.invalidateCache();
        
        // Override grid render with custom offset
        const originalRender = levelEditor.gridOverlay.render;
        levelEditor.gridOverlay.render = function(offsetX = 0, offsetY = 0) {
          if (typeof push === 'undefined') return;
          if (!this.visible) return;
          
          push();
          
          stroke(255, 255, 255, this.alpha * 255);
          strokeWeight(1);
          
          const strokeOffset = offsetValue; // Use test offset
          
          // Vertical lines
          for (let x = 0; x <= this.width; x += this.gridSpacing) {
            const screenX = x * this.tileSize + offsetX + strokeOffset;
            line(screenX, offsetY, screenX, this.height * this.tileSize + offsetY);
          }
          
          // Horizontal lines
          for (let y = 0; y <= this.height; y += this.gridSpacing) {
            const screenY = y * this.tileSize + offsetY + strokeOffset;
            line(offsetX, screenY, this.width * this.tileSize + offsetX, screenY);
          }
          
          pop();
        };
        
        levelEditor.showGrid = true;
        levelEditor.gridOverlay.setVisible(true);
        levelEditor.gridOverlay.setOpacity(0.8);
        
        if (typeof redraw === 'function') {
          redraw();
          redraw();
        }
        
        // Restore
        levelEditor.gridOverlay.render = originalRender;
        
      }, offset);
      
      await sleep(500);
      
      const offsetLabel = offset >= 0 ? `plus${offset}` : `minus${Math.abs(offset)}`;
      await saveScreenshot(page, `ui/grid_offset_${offsetLabel}`, true);
      console.log(`✓ Screenshot saved: grid_offset_${offsetLabel}.png`);
    }
    
    console.log('\n\n=== CALIBRATION COMPLETE ===\n');
    console.log('Compare these screenshots to find the best alignment:');
    console.log('  grid_offset_minus0.5.png - Offset: -0.5px (line left of tile)');
    console.log('  grid_offset_0.png        - Offset: 0px (centered on boundary)');
    console.log('  grid_offset_plus0.5.png  - Offset: +0.5px (current fix)');
    console.log('  grid_offset_plus1.0.png  - Offset: +1.0px (line right of tile)');
    console.log();
    console.log('The screenshot with perfect alignment shows which offset value is correct.');
    console.log('If NONE look perfect, the issue may be:');
    console.log('  - Browser zoom level (should be 100%)');
    console.log('  - Display scaling (check Windows display settings)');
    console.log('  - Anti-aliasing making crisp alignment impossible');
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('Test failed:', error.message);
    console.error(error.stack);
    await saveScreenshot(page, 'ui/grid_offset_calibration_error', false);
    await browser.close();
    process.exit(1);
  }
})();
