/**
 * E2E Test: Check what type of objects are in placedEntities
 * Diagnose why entities don't have render() methods
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('Loading game and Level Editor...');
    await page.goto('http://localhost:8000?test=1');
    await sleep(2000);
    
    await page.evaluate(() => {
      window.GameState.setState('LEVEL_EDITOR');
    });
    await sleep(1000);
    
    console.log('Loading CaveTutorial.json...');
    const levelPath = path.join(__dirname, '../../../levels/CaveTutorial.json');
    const levelDataString = fs.readFileSync(levelPath, 'utf8');
    
    const entityInspection = await page.evaluate((jsonString) => {
      const data = JSON.parse(jsonString);
      window.levelEditor.loadFromData(data);
      
      const entities = window.levelEditor.entityPainter.placedEntities;
      
      if (entities.length === 0) {
        return { error: 'No entities loaded' };
      }
      
      const sampleEntity = entities[0];
      
      return {
        totalEntities: entities.length,
        sampleEntity: {
          type: sampleEntity.type,
          constructor: sampleEntity.constructor ? sampleEntity.constructor.name : 'N/A',
          hasRender: typeof sampleEntity.render === 'function',
          hasUpdate: typeof sampleEntity.update === 'function',
          isPlainObject: sampleEntity.constructor === Object,
          keys: Object.keys(sampleEntity).slice(0, 15),
          posX: sampleEntity.posX,
          posY: sampleEntity.posY,
          templateId: sampleEntity.templateId
        },
        allEntitiesHaveRender: entities.every(e => typeof e.render === 'function'),
        entitiesWithRender: entities.filter(e => typeof e.render === 'function').length,
        entitiesWithoutRender: entities.filter(e => typeof e.render !== 'function').length
      };
    }, levelDataString);
    
    console.log('\n=== ENTITY INSPECTION ===');
    console.log(JSON.stringify(entityInspection, null, 2));
    
    console.log('\n=== DIAGNOSIS ===');
    if (entityInspection.sampleEntity.isPlainObject) {
      console.error('❌ BUG CONFIRMED: Entities are PLAIN OBJECTS, not Entity instances!');
      console.error('❌ Plain objects have NO render() method.');
      console.error('❌ EntityPainter.importFromJSON() creates plain objects instead of Ant/Resource/Building instances.');
      console.error('\nROOT CAUSE: importFromJSON() needs to create actual Ant/Resource instances, not plain objects.');
    }
    
    if (entityInspection.entitiesWithoutRender > 0) {
      console.error(`\n❌ ${entityInspection.entitiesWithoutRender}/${entityInspection.totalEntities} entities have NO render() method!`);
    }
    
    await saveScreenshot(page, 'diagnosis/plain_objects_bug', false);
    await browser.close();
    process.exit(entityInspection.sampleEntity.isPlainObject ? 1 : 0);
    
  } catch (error) {
    console.error('Test failed:', error.message);
    await browser.close();
    process.exit(1);
  }
})();
