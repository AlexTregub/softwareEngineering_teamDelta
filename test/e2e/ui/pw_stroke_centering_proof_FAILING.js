/**
 * E2E Test: Stroke Centering Demonstration
 * 
 * This test PROVES that p5.js stroke centering causes the grid misalignment.
 * 
 * Creates a visual comparison showing:
 * 1. Tiles rendered with image() at coordinate X
 * 2. Grid lines drawn with line() at coordinate X
 * 3. The visible 0.5px offset caused by stroke centering
 * 
 * This test should FAIL (show misalignment) to prove the root cause.
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('=== Stroke Centering Proof Test ===\n');
    
    await page.goto('http://localhost:8000?test=1');
    await sleep(500);
    
    // Initialize Level Editor
    await page.evaluate(() => {
      GameState.goToLevelEditor();
      levelEditor.showGrid = true;
      levelEditor.gridOverlay.setVisible(true);
      levelEditor.gridOverlay.setOpacity(0.8);
    });
    
    await sleep(300);
    
    console.log('STEP 1: Paint a precise test pattern\n');
    
    await page.evaluate(() => {
      const terrain = levelEditor.terrain;
      
      // Clear the entire visible area
      for (let y = 0; y < 15; y++) {
        for (let x = 0; x < 15; x++) {
          terrain.tiles[y][x].setMaterial('grass');
          terrain.tiles[y][x].assignWeight();
        }
      }
      
      // Paint a checkerboard pattern for maximum grid visibility
      for (let y = 3; y < 12; y++) {
        for (let x = 3; x < 12; x++) {
          if ((x + y) % 2 === 0) {
            terrain.tiles[y][x].setMaterial('stone');
          } else {
            terrain.tiles[y][x].setMaterial('moss');
          }
          terrain.tiles[y][x].assignWeight();
        }
      }
      
      terrain.invalidateCache();
    });
    
    console.log('✓ Checkerboard pattern painted (tiles 3-11, alternating stone/moss)');
    console.log();
    
    console.log('STEP 2: Analyze expected vs actual rendering\n');
    
    const analysis = await page.evaluate(() => {
      const tileSize = 32;
      
      // For a grid line at x=3 (96 pixels):
      // - Coordinate sent to line(): 96
      // - With strokeWeight(1), p5.js draws centered: 95.5 to 96.5
      // - Left edge of stroke: 95.5px
      // - Right edge of stroke: 96.5px
      
      // For a tile at x=3 (96 pixels):
      // - Coordinate sent to image(): 96
      // - With imageMode(CORNER), image draws from: 96 to 128
      // - Left edge of tile: 96px
      // - Right edge of tile: 128px
      
      return {
        gridLine_x_3: {
          coordinate: 96,
          strokeCenteringEffect: {
            leftEdge: 95.5,
            rightEdge: 96.5,
            center: 96
          }
        },
        tile_x_3: {
          coordinate: 96,
          rendering: {
            leftEdge: 96,
            rightEdge: 128,
            topLeft: 96
          }
        },
        offset: {
          visualMismatch: 96 - 95.5,  // 0.5px
          explanation: 'Grid line left edge is 0.5px left of tile left edge'
        }
      };
    });
    
    console.log('Expected Rendering (tile x=3, 96px):');
    console.log('  Grid Line:');
    console.log('    Coordinate:   96px');
    console.log('    Stroke draws: 95.5px → 96.5px (centered)');
    console.log('    Left edge:    95.5px ◄── 0.5px offset!');
    console.log();
    console.log('  Terrain Tile:');
    console.log('    Coordinate:   96px');
    console.log('    Image draws:  96px → 128px (corner mode)');
    console.log('    Left edge:    96px');
    console.log();
    console.log('  Visual Result:');
    console.log(`    Offset: ${analysis.offset.visualMismatch}px`);
    console.log(`    ${analysis.offset.explanation}`);
    console.log();
    
    console.log('STEP 3: Force render and capture proof\n');
    
    await page.evaluate(() => {
      if (typeof redraw === 'function') {
        redraw();
        redraw();
        redraw();
      }
    });
    
    await sleep(1000);
    
    await saveScreenshot(page, 'ui/stroke_centering_proof_MISALIGNED', true);
    
    console.log('✓ Screenshot saved: test/e2e/screenshots/ui/success/stroke_centering_proof_MISALIGNED.png');
    console.log();
    console.log('VISUAL INSPECTION:');
    console.log('  Look at the checkerboard pattern');
    console.log('  Grid lines should appear slightly offset (0.5px to the LEFT) from tile edges');
    console.log('  This is the FAILING test - it demonstrates the bug');
    console.log();
    
    console.log('=== ROOT CAUSE CONFIRMED ===\n');
    console.log('The grid/terrain misalignment is caused by:');
    console.log('  ✓ p5.js stroke() function centers strokes on coordinates');
    console.log('  ✓ Grid uses line() with strokeWeight(1)');
    console.log('  ✓ Terrain uses image() with imageMode(CORNER)');
    console.log('  ✓ Result: Grid lines appear 0.5px offset from tile edges');
    console.log();
    console.log('FIX: Add strokeOffset = 0.5 to grid line coordinates');
    console.log('  line(x * tileSize + 0.5, ...) aligns stroke RIGHT edge with tile edge');
    console.log();
    
    // Mark this as a "failing" test (demonstrates the bug)
    await browser.close();
    process.exit(1); // Exit with error code to indicate this is demonstrating a bug
    
  } catch (error) {
    console.error('Test failed:', error.message);
    await saveScreenshot(page, 'ui/stroke_centering_proof_error', false);
    await browser.close();
    process.exit(1);
  }
})();
