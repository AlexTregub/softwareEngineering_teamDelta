/**
 * E2E Test: Check what TERRAIN_MATERIALS_RANGED actually contains at runtime
 * 
 * We know:
 * - render(coordSys) is the only render method at runtime ✅
 * - It uses TERRAIN_MATERIALS_RANGED ✅  
 * - But tiles are still brown ❌
 * 
 * This test checks: What are the actual render FUNCTIONS in TERRAIN_MATERIALS_RANGED?
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  console.log('\n🔍 Checking TERRAIN_MATERIALS_RANGED render functions...');
  
  let browser;
  let testPassed = false;
  
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    
    await page.goto('http://localhost:8000?test=1');
    await sleep(2000);
    
    // Ensure game started
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Game did not start');
    }
    
    // Inspect TERRAIN_MATERIALS_RANGED
    const analysis = await page.evaluate(() => {
      const results = {
        exists: typeof TERRAIN_MATERIALS_RANGED !== 'undefined',
        type: typeof TERRAIN_MATERIALS_RANGED,
        materials: {}
      };
      
      if (!results.exists) {
        return results;
      }
      
      // Check each material
      for (const [key, value] of Object.entries(TERRAIN_MATERIALS_RANGED)) {
        const materialInfo = {
          exists: true,
          isArray: Array.isArray(value),
          length: Array.isArray(value) ? value.length : 0
        };
        
        if (Array.isArray(value) && value.length >= 2) {
          // value[0] is range array
          // value[1] is render function
          materialInfo.hasRange = Array.isArray(value[0]);
          materialInfo.rangeLength = Array.isArray(value[0]) ? value[0].length : 0;
          
          materialInfo.hasRenderFunc = typeof value[1] === 'function';
          
          if (typeof value[1] === 'function') {
            // Get the function source
            const funcSource = value[1].toString();
            materialInfo.funcLength = funcSource.length;
            materialInfo.funcPreview = funcSource.substring(0, 200);
            
            // Check what the function does
            materialInfo.usesImage = funcSource.includes('image(');
            materialInfo.usesFill = funcSource.includes('fill(');
            materialInfo.usesRect = funcSource.includes('rect(');
            
            // Check which images it references
            materialInfo.referencesMOSS = funcSource.includes('MOSS_IMAGE');
            materialInfo.referencesSTONE = funcSource.includes('STONE_IMAGE');
            materialInfo.referencesDIRT = funcSource.includes('DIRT_IMAGE');
            materialInfo.referencesGRASS = funcSource.includes('GRASS_IMAGE');
          }
        }
        
        results.materials[key] = materialInfo;
      }
      
      return results;
    });
    
    console.log('\n📊 TERRAIN_MATERIALS_RANGED Analysis:');
    console.log('='.repeat(80));
    console.log('Exists:', analysis.exists);
    console.log('Type:', analysis.type);
    console.log('');
    
    for (const [material, info] of Object.entries(analysis.materials)) {
      console.log(`\n${material}:`);
      console.log('  Is Array:', info.isArray);
      console.log('  Length:', info.length);
      console.log('  Has Range:', info.hasRange);
      console.log('  Has Render Function:', info.hasRenderFunc);
      
      if (info.hasRenderFunc) {
        console.log('  Function uses:');
        console.log('    image():', info.usesImage ? '✅' : '❌');
        console.log('    fill():', info.usesFill ? '✅' : '❌');
        console.log('    rect():', info.usesRect ? '✅' : '❌');
        console.log('  References:');
        console.log('    MOSS_IMAGE:', info.referencesMOSS ? '✅' : '❌');
        console.log('    STONE_IMAGE:', info.referencesSTONE ? '✅' : '❌');
        console.log('    DIRT_IMAGE:', info.referencesDIRT ? '✅' : '❌');
        console.log('    GRASS_IMAGE:', info.referencesGRASS ? '✅' : '❌');
        console.log('  Preview:');
        console.log('   ', info.funcPreview.replace(/\n/g, '\n    '));
      }
    }
    
    console.log('\n' + '='.repeat(80));
    
    // Save screenshot
    await saveScreenshot(page, 'rendering/terrain_materials_ranged_functions', analysis.exists);
    
    testPassed = analysis.exists;
    
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
