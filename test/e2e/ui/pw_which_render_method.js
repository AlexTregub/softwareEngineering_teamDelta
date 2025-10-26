/**
 * E2E Test - Which Render Method Is Called?
 * 
 * This test determines which Tile.render() method is actually being called
 * when painting terrain in the Level Editor.
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('Loading main menu...');
    await page.goto('http://localhost:8000');
    await sleep(2000);
    
    console.log('Entering Level Editor...');
    await page.evaluate(() => {
      if (typeof GameState !== 'undefined' && GameState.goToLevelEditor) {
        GameState.goToLevelEditor();
      }
    });
    
    await sleep(1500);
    
    // Check Tile class render methods
    const renderInfo = await page.evaluate(() => {
      // Find a tile to inspect
      let tile = null;
      
      if (typeof levelEditor !== 'undefined' && levelEditor.terrain && levelEditor.terrain.getTile) {
        tile = levelEditor.terrain.getTile(10, 10);
      }
      
      if (!tile) {
        return { error: 'Could not find a tile to inspect' };
      }
      
      // Get render method source code
      const renderSource = tile.render.toString();
      
      // Check which variables it references
      const usesTERRAIN_MATERIALS = renderSource.includes('TERRAIN_MATERIALS[');
      const usesTERRAIN_MATERIALS_RANGED = renderSource.includes('TERRAIN_MATERIALS_RANGED[');
      const usesCoordSys = /render\s*\(\s*coordSys\s*\)/.test(renderSource);
      
      // Check if both old and new variables exist
      const TERRAIN_MATERIALS_exists = typeof TERRAIN_MATERIALS !== 'undefined';
      const TERRAIN_MATERIALS_RANGED_exists = typeof TERRAIN_MATERIALS_RANGED !== 'undefined';
      
      return {
        renderSource: renderSource.substring(0, 600),
        usesTERRAIN_MATERIALS,
        usesTERRAIN_MATERIALS_RANGED,
        usesCoordSys,
        TERRAIN_MATERIALS_exists,
        TERRAIN_MATERIALS_RANGED_exists,
        renderLength: tile.render.length // number of parameters
      };
    });
    
    await browser.close();
    
    console.log('\n' + '='.repeat(80));
    console.log('TILE RENDER METHOD ANALYSIS');
    console.log('='.repeat(80));
    console.log('\nRender method info:');
    console.log('  Parameters:', renderInfo.renderLength);
    console.log('  Uses TERRAIN_MATERIALS?', renderInfo.usesTERRAIN_MATERIALS);
    console.log('  Uses TERRAIN_MATERIALS_RANGED?', renderInfo.usesTERRAIN_MATERIALS_RANGED);
    console.log('  Accepts coordSys parameter?', renderInfo.usesCoordSys);
    console.log('\nGlobal variables:');
    console.log('  TERRAIN_MATERIALS exists?', renderInfo.TERRAIN_MATERIALS_exists);
    console.log('  TERRAIN_MATERIALS_RANGED exists?', renderInfo.TERRAIN_MATERIALS_RANGED_exists);
    console.log('\nRender method source (first 600 chars):');
    console.log(renderInfo.renderSource);
    console.log('\n' + '='.repeat(80));
    console.log('DIAGNOSIS:');
    console.log('='.repeat(80));
    
    if (renderInfo.usesTERRAIN_MATERIALS && !renderInfo.TERRAIN_MATERIALS_exists) {
      console.log('🐛 BUG FOUND!');
      console.log('   Tile.render() uses TERRAIN_MATERIALS but it does NOT exist!');
      console.log('   This causes undefined behavior / errors.');
      console.log('   Solution: Use the render(coordSys) method instead, which uses TERRAIN_MATERIALS_RANGED');
    } else if (renderInfo.usesTERRAIN_MATERIALS_RANGED) {
      console.log('✓ Tile.render() correctly uses TERRAIN_MATERIALS_RANGED');
    }
    
    console.log('='.repeat(80));
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n✗ TEST ERROR:', error);
    await browser.close();
    process.exit(1);
  }
})();
