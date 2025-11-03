/**
 * E2E Test: Check if terrain images are actually loaded
 * 
 * We know:
 * - render functions use image() ✅
 * - They reference correct image variables ✅
 * - But are the images themselves loaded?
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  console.log('\n🔍 Checking if terrain images are loaded...');
  
  let browser;
  let testPassed = false;
  
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    
    await page.goto('http://localhost:8000?test=1');
    await sleep(2000);
    
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Game did not start');
    }
    
    // Check image objects
    const imageCheck = await page.evaluate(() => {
      const images = {
        MOSS_IMAGE: {
          exists: typeof MOSS_IMAGE !== 'undefined',
          type: typeof MOSS_IMAGE,
          isP5Image: MOSS_IMAGE && MOSS_IMAGE.constructor && MOSS_IMAGE.constructor.name === 'p5.Image',
          loaded: MOSS_IMAGE && MOSS_IMAGE.width > 0 && MOSS_IMAGE.height > 0,
          width: MOSS_IMAGE ? MOSS_IMAGE.width : 0,
          height: MOSS_IMAGE ? MOSS_IMAGE.height : 0
        },
        STONE_IMAGE: {
          exists: typeof STONE_IMAGE !== 'undefined',
          type: typeof STONE_IMAGE,
          isP5Image: STONE_IMAGE && STONE_IMAGE.constructor && STONE_IMAGE.constructor.name === 'p5.Image',
          loaded: STONE_IMAGE && STONE_IMAGE.width > 0 && STONE_IMAGE.height > 0,
          width: STONE_IMAGE ? STONE_IMAGE.width : 0,
          height: STONE_IMAGE ? STONE_IMAGE.height : 0
        },
        DIRT_IMAGE: {
          exists: typeof DIRT_IMAGE !== 'undefined',
          type: typeof DIRT_IMAGE,
          isP5Image: DIRT_IMAGE && DIRT_IMAGE.constructor && DIRT_IMAGE.constructor.name === 'p5.Image',
          loaded: DIRT_IMAGE && DIRT_IMAGE.width > 0 && DIRT_IMAGE.height > 0,
          width: DIRT_IMAGE ? DIRT_IMAGE.width : 0,
          height: DIRT_IMAGE ? DIRT_IMAGE.height : 0
        },
        GRASS_IMAGE: {
          exists: typeof GRASS_IMAGE !== 'undefined',
          type: typeof GRASS_IMAGE,
          isP5Image: GRASS_IMAGE && GRASS_IMAGE.constructor && GRASS_IMAGE.constructor.name === 'p5.Image',
          loaded: GRASS_IMAGE && GRASS_IMAGE.width > 0 && GRASS_IMAGE.height > 0,
          width: GRASS_IMAGE ? GRASS_IMAGE.width : 0,
          height: GRASS_IMAGE ? GRASS_IMAGE.height : 0
        }
      };
      
      return images;
    });
    
    console.log('\n📊 Terrain Image Check:');
    console.log('='.repeat(80));
    
    let allLoaded = true;
    
    for (const [name, info] of Object.entries(imageCheck)) {
      console.log(`\n${name}:`);
      console.log('  Exists:', info.exists ? '✅' : '❌');
      console.log('  Type:', info.type);
      console.log('  Is p5.Image:', info.isP5Image ? '✅' : '❌');
      console.log('  Loaded (width/height > 0):', info.loaded ? '✅' : '❌');
      console.log('  Dimensions:', info.width, 'x', info.height);
      
      if (!info.loaded) {
        allLoaded = false;
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log(allLoaded ? '✅ ALL IMAGES LOADED' : '❌ SOME IMAGES NOT LOADED');
    
    await saveScreenshot(page, 'rendering/terrain_images_loaded', allLoaded);
    
    testPassed = allLoaded;
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    testPassed = false;
  } finally {
    if (browser) {
      await browser.close();
    }
    
    process.exit(testPassed ? 0 : 1);
  }
})();
