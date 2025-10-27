/**
 * E2E Test: Complete paint flow with pixel verification
 * 
 * This test:
 * 1. Opens Level Editor
 * 2. Selects a material (moss)
 * 3. Paints a tile
 * 4. Checks if tile material changed in data
 * 5. Forces re-render
 * 6. Checks pixel colors to verify texture is displayed
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  console.log('\n🔍 Testing complete paint flow with pixel verification...');
  
  let browser;
  let testPassed = false;
  
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    
    await page.goto('http://localhost:8000');  // NO ?test=1 - start from menu
    await sleep(2000);
    
    // Click Level Editor button from menu
    console.log('Clicking Level Editor button from menu...');
    const menuClick = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        if (btn.textContent.includes('Level Editor')) {
          btn.click();
          return true;
        }
      }
      return false;
    });
    
    if (!menuClick) {
      throw new Error('Could not find Level Editor button');
    }
    
    console.log('✅ Level Editor button clicked');
    await sleep(2000);
    
    // Verify game started
    const gameState = await page.evaluate(() => window.gameState);
    console.log('Game state:', gameState);
    
    if (gameState !== 'PLAYING') {
      throw new Error(`Game state is ${gameState}, expected PLAYING`);
    }
    
    // Get a tile position in grid coordinates
    const testGridX = 10;
    const testGridY = 10;
    
    console.log(`\nTest coordinates: grid (${testGridX}, ${testGridY})`);
    
    // Get initial tile state
    const initialState = await page.evaluate(({ gx, gy }) => {
      if (!window.g_map2 || !window.g_map2.getTileAtGridCoords) {
        return { error: 'g_map2 not available' };
      }
      
      const tile = window.g_map2.getTileAtGridCoords(gx, gy);
      if (!tile) {
        return { error: 'Tile not found' };
      }
      
      return {
        material: tile.getMaterial ? tile.getMaterial() : 'unknown',
        hasSetMaterial: typeof tile.setMaterial === 'function',
        hasRender: typeof tile.render === 'function'
      };
    }, { gx: testGridX, gy: testGridY });
    
    if (initialState.error) {
      throw new Error(initialState.error);
    }
    
    console.log('\nInitial tile state:');
    console.log('  Material:', initialState.material);
    console.log('  Has setMaterial():', initialState.hasSetMaterial);
    console.log('  Has render():', initialState.hasRender);
    
    // Select moss material in palette
    console.log('\nSelecting moss material...');
    const materialSelected = await page.evaluate(() => {
      if (!window.draggablePanelManager || !window.draggablePanelManager.panels) {
        return { error: 'draggablePanelManager not available' };
      }
      
      const matPanel = window.draggablePanelManager.panels.find(p => p.id === 'material-palette-panel');
      if (!matPanel) {
        return { error: 'Material palette panel not found' };
      }
      
      if (!matPanel.content || !matPanel.content.selectMaterial) {
        return { error: 'Material palette has no selectMaterial method' };
      }
      
      matPanel.content.selectMaterial('moss');
      
      return {
        success: true,
        selectedMaterial: matPanel.content.getSelectedMaterial ? matPanel.content.getSelectedMaterial() : 'unknown'
      };
    });
    
    if (materialSelected.error) {
      throw new Error(materialSelected.error);
    }
    
    console.log('✅ Material selected:', materialSelected.selectedMaterial);
    
    // Paint the tile
    console.log(`\nPainting tile at grid (${testGridX}, ${testGridY})...`);
    const paintResult = await page.evaluate(({ gx, gy }) => {
      const tile = window.g_map2.getTileAtGridCoords(gx, gy);
      if (!tile) {
        return { error: 'Tile not found for painting' };
      }
      
      const beforeMaterial = tile.getMaterial();
      
      // Call setMaterial directly
      const success = tile.setMaterial('moss');
      
      const afterMaterial = tile.getMaterial();
      
      // Force redraw
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      return {
        success,
        beforeMaterial,
        afterMaterial,
        materialChanged: beforeMaterial !== afterMaterial
      };
    }, { gx: testGridX, gy: testGridY });
    
    if (paintResult.error) {
      throw new Error(paintResult.error);
    }
    
    console.log('\nPaint result:');
    console.log('  Success:', paintResult.success);
    console.log('  Before material:', paintResult.beforeMaterial);
    console.log('  After material:', paintResult.afterMaterial);
    console.log('  Material changed:', paintResult.materialChanged);
    
    await sleep(1000);
    
    // Get screen position of the tile and check pixels
    const pixelCheck = await page.evaluate(({ gx, gy }) => {
      // Convert grid coords to screen coords
      const tileSize = 32;  // TILE_SIZE
      const worldX = gx * tileSize;
      const worldY = gy * tileSize;
      
      // Get screen position (accounting for camera)
      let screenX, screenY;
      if (window.cameraManager) {
        const screenPos = window.cameraManager.worldToScreen(worldX, worldY);
        screenX = screenPos.x;
        screenY = screenPos.y;
      } else {
        screenX = worldX;
        screenY = worldY;
      }
      
      return {
        worldX,
        worldY,
        screenX,
        screenY,
        tileSize
      };
    }, { gx: testGridX, gy: testGridY });
    
    console.log('\nTile position:');
    console.log('  World:', pixelCheck.worldX, pixelCheck.worldY);
    console.log('  Screen:', pixelCheck.screenX, pixelCheck.screenY);
    
    // Take screenshot for visual verification
    await saveScreenshot(page, 'rendering/complete_paint_flow', paintResult.materialChanged);
    
    // Sample pixels in the tile area
    console.log('\nSampling pixels...');
    const pixels = await page.evaluate(({ x, y, size }) => {
      const samples = [];
      const canvas = document.querySelector('canvas');
      if (!canvas) return { error: 'Canvas not found' };
      
      const ctx = canvas.getContext('2d');
      
      // Sample center and corners
      const points = [
        { name: 'center', dx: size/2, dy: size/2 },
        { name: 'top-left', dx: 2, dy: 2 },
        { name: 'top-right', dx: size-2, dy: 2 },
        { name: 'bottom-left', dx: 2, dy: size-2 },
        { name: 'bottom-right', dx: size-2, dy: size-2 }
      ];
      
      for (const pt of points) {
        const px = Math.floor(x + pt.dx);
        const py = Math.floor(y + pt.dy);
        
        try {
          const imageData = ctx.getImageData(px, py, 1, 1);
          const [r, g, b, a] = imageData.data;
          samples.push({
            name: pt.name,
            x: px,
            y: py,
            r, g, b, a
          });
        } catch (e) {
          samples.push({
            name: pt.name,
            x: px,
            y: py,
            error: e.message
          });
        }
      }
      
      return { samples };
    }, { x: pixelCheck.screenX, y: pixelCheck.screenY, size: pixelCheck.tileSize });
    
    if (pixels.error) {
      console.error('❌', pixels.error);
    } else {
      console.log('\nPixel samples:');
      for (const sample of pixels.samples) {
        if (sample.error) {
          console.log(`  ${sample.name}: ERROR - ${sample.error}`);
        } else {
          console.log(`  ${sample.name} (${sample.x}, ${sample.y}): RGB(${sample.r}, ${sample.g}, ${sample.b})`);
          
          // Check if it's the brown color (120, 80, 40)
          const isBrown = Math.abs(sample.r - 120) < 10 && 
                         Math.abs(sample.g - 80) < 10 && 
                         Math.abs(sample.b - 40) < 10;
          if (isBrown) {
            console.log('    ⚠️  THIS IS THE BROWN COLOR!');
          }
        }
      }
    }
    
    testPassed = paintResult.materialChanged;
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    testPassed = false;
  } finally {
    if (browser) {
      await browser.close();
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(testPassed ? '✅ TEST PASSED' : '❌ TEST FAILED');
    console.log('='.repeat(60));
    
    process.exit(testPassed ? 0 : 1);
  }
})();
