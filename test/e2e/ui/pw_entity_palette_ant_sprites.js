/**
 * E2E Test: Entity Palette Ant Sprite Rendering
 * Verifies that ant sprites load and display correctly in the Entity Palette
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  console.log('🧪 Entity Palette Ant Sprite Rendering Test');
  
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.goto('http://localhost:8000?test=1');
  
  // Enter Level Editor
  console.log('⏳ Entering Level Editor...');
  const editorStarted = await cameraHelper.ensureLevelEditorStarted(page);
  if (!editorStarted.started) {
    throw new Error('Failed to start Level Editor');
  }
  
  // Wait for images to load
  await sleep(1000);
  
  // Open Entity Palette panel
  console.log('📂 Opening Entity Palette panel...');
  await page.evaluate(() => {
    if (window.fileMenuBar) {
      window.fileMenuBar._handleTogglePanel('entity-painter');
    }
    window.gameState = 'LEVEL_EDITOR';
    if (window.draggablePanelManager) {
      window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
    }
    if (typeof window.redraw === 'function') {
      window.redraw(); window.redraw(); window.redraw();
    }
  });
  
  await sleep(500);
  console.log('📸 Screenshot 1: Entity Palette with Entities category (should show ant sprites)');
  await saveScreenshot(page, 'entity_palette_sprites/01_entities_category', true);
  
  // Check if images loaded
  const imageStats = await page.evaluate(() => {
    const palette = window.levelEditor ? window.levelEditor.entityPalette : null;
    if (!palette) return { error: 'EntityPalette not found' };
    
    const cache = palette._imageCache;
    const cacheSize = cache ? cache.size : 0;
    
    // Get list of cached images
    const cachedImages = [];
    if (cache) {
      cache.forEach((img, path) => {
        cachedImages.push({
          path: path,
          loaded: img && img.width > 0,
          width: img ? img.width : 0,
          height: img ? img.height : 0
        });
      });
    }
    
    return {
      cacheSize: cacheSize,
      cachedImages: cachedImages,
      hasWorkerAnt: cachedImages.some(i => i.path.includes('gray_ant.png')),
      allImagesLoaded: cachedImages.every(i => i.loaded)
    };
  });
  
  console.log('\n📊 Image Cache Statistics:');
  console.log(`  Cache Size: ${imageStats.cacheSize} images`);
  console.log(`  Has Worker Ant: ${imageStats.hasWorkerAnt ? '✅' : '❌'}`);
  console.log(`  All Loaded: ${imageStats.allImagesLoaded ? '✅' : '❌'}`);
  
  if (imageStats.cachedImages && imageStats.cachedImages.length > 0) {
    console.log('\n🖼️  Cached Images:');
    imageStats.cachedImages.forEach(img => {
      console.log(`  ${img.loaded ? '✅' : '❌'} ${img.path} (${img.width}x${img.height})`);
    });
  }
  
  // Scroll down to see more entities
  console.log('\n⬇️ Scrolling down to see more entities...');
  await page.evaluate(() => {
    const palette = window.levelEditor ? window.levelEditor.entityPalette : null;
    if (palette && palette.handleMouseWheel) {
      palette.handleMouseWheel(100); // Scroll down
    }
    if (typeof window.redraw === 'function') {
      window.redraw(); window.redraw(); window.redraw();
    }
  });
  
  await sleep(300);
  console.log('📸 Screenshot 2: After scrolling down');
  await saveScreenshot(page, 'entity_palette_sprites/02_scrolled_down', true);
  
  // Switch to Buildings category
  console.log('\n🏠 Switching to Buildings category...');
  await page.evaluate(() => {
    const palette = window.levelEditor ? window.levelEditor.entityPalette : null;
    if (palette) {
      palette.setCategory('buildings');
    }
    if (typeof window.redraw === 'function') {
      window.redraw(); window.redraw(); window.redraw();
    }
  });
  
  await sleep(300);
  console.log('📸 Screenshot 3: Buildings category');
  await saveScreenshot(page, 'entity_palette_sprites/03_buildings_category', true);
  
  // Switch to Resources category
  console.log('\n🌳 Switching to Resources category...');
  await page.evaluate(() => {
    const palette = window.levelEditor ? window.levelEditor.entityPalette : null;
    if (palette) {
      palette.setCategory('resources');
    }
    if (typeof window.redraw === 'function') {
      window.redraw(); window.redraw(); window.redraw();
    }
  });
  
  await sleep(300);
  console.log('📸 Screenshot 4: Resources category');
  await saveScreenshot(page, 'entity_palette_sprites/04_resources_category', true);
  
  // Final check
  const success = imageStats.cacheSize > 0 && imageStats.hasWorkerAnt;
  
  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('✅ ANT SPRITES LOADED AND CACHED');
  } else {
    console.log('❌ SPRITE LOADING FAILED');
    console.log(`   Cache Size: ${imageStats.cacheSize}`);
    console.log(`   Has Worker Ant: ${imageStats.hasWorkerAnt}`);
  }
  console.log('='.repeat(50));
  
  await browser.close();
  process.exit(success ? 0 : 1);
})();
