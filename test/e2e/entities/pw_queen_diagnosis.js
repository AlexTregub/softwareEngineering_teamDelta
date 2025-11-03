/**
 * E2E Test: Queen Creation Diagnosis
 * Tests how Queen entities are created from JSON and what image they receive
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  console.log('Loading game...');
  await page.goto('http://localhost:8000?test=1');
  await sleep(2000);
  
  // Load custom level
  console.log('Loading CaveTutorial.json...');
  const loadResult = await page.evaluate(async () => {
    if (typeof loadCustomLevel === 'function') {
      const result = await loadCustomLevel('levels/CaveTutorial.json');
      return {
        success: result,
        gameState: typeof GameState !== 'undefined' ? GameState.getState() : 'unknown'
      };
    }
    return { success: false, error: 'loadCustomLevel not available' };
  });
  
  console.log('Load result:', loadResult);
  if (!loadResult.success) {
    console.error('❌ Failed to load custom level');
    await browser.close();
    process.exit(1);
  }
  
  await sleep(1000);
  
  // Test 1: Check Queen constructor defaults
  console.log('\n=== TEST 1: Queen Constructor Analysis ===');
  const constructorData = await page.evaluate(() => {
    // Check what JobImages[3] (Builder/Queen sprite) looks like
    const builderImage = window.JobImages && window.JobImages[3] ? {
      exists: true,
      isP5Image: window.JobImages[3] instanceof p5.Image,
      width: window.JobImages[3].width,
      height: window.JobImages[3].height
    } : { exists: false };
    
    return {
      builderImage,
      hasQueenClass: typeof window.QueenAnt !== 'undefined',
      queenClassName: window.QueenAnt ? window.QueenAnt.name : null
    };
  });
  
  console.log('JobImages[3] (Builder/Queen sprite):', constructorData.builderImage);
  console.log('QueenAnt class exists:', constructorData.hasQueenClass);
  console.log('QueenAnt class name:', constructorData.queenClassName);
  
  // Test 2: Check EntityFactory Queen creation logic
  console.log('\n=== TEST 2: EntityFactory Queen Creation ===');
  const factoryData = await page.evaluate(() => {
    const factory = window.entityFactory || window.EntityFactory;
    
    if (!factory) {
      return { hasFactory: false };
    }
    
    // Check the _createEntityInstance method for Queen case
    const factoryString = factory.constructor ? factory.constructor.toString() : null;
    
    return {
      hasFactory: true,
      factoryType: factory.constructor ? factory.constructor.name : 'Unknown'
    };
  });
  
  console.log('EntityFactory exists:', factoryData.hasFactory);
  console.log('Factory type:', factoryData.factoryType);
  
  // Test 3: Create a test Queen manually and compare
  console.log('\n=== TEST 3: Manual Queen Creation Test ===');
  const manualQueenData = await page.evaluate(() => {
    // Create a Queen manually using the same method EntityFactory should use
    if (typeof window.QueenAnt === 'undefined') {
      return { created: false, reason: 'QueenAnt class not available' };
    }
    
    // Create with null (uses defaults)
    const testQueen = new QueenAnt(null);
    
    const result = {
      created: true,
      type: testQueen.type,
      jobName: testQueen.JobName || testQueen.jobName,
      position: { x: testQueen.x, y: testQueen.y },
      size: { x: testQueen.w, y: testQueen.h },
      hasSprite: !!testQueen._sprite,
      spriteImage: null
    };
    
    if (testQueen._sprite) {
      result.spriteImage = {
        exists: !!testQueen._sprite.img,
        isP5Image: testQueen._sprite.img instanceof p5.Image,
        width: testQueen._sprite.img ? testQueen._sprite.img.width : null,
        height: testQueen._sprite.img ? testQueen._sprite.img.height : null,
        isBuilderImage: testQueen._sprite.img === window.JobImages[3]
      };
    }
    
    return result;
  });
  
  console.log('Manual Queen created:', manualQueenData.created);
  if (manualQueenData.created) {
    console.log('Type:', manualQueenData.type);
    console.log('JobName:', manualQueenData.jobName);
    console.log('Size:', manualQueenData.size);
    console.log('Has sprite:', manualQueenData.hasSprite);
    console.log('Sprite image:', manualQueenData.spriteImage);
    console.log('Is using Builder/Queen sprite:', manualQueenData.spriteImage?.isBuilderImage);
  }
  
  // Test 4: Compare JSON-loaded Queen vs Manual Queen
  console.log('\n=== TEST 4: JSON Queen vs Manual Queen ===');
  const comparisonData = await page.evaluate(() => {
    const jsonQueen = window.ants.find(ant => 
      ant.type === 'Queen' || ant.JobName === 'Queen' || ant.jobName === 'Queen'
    );
    
    if (!jsonQueen) {
      return { jsonQueenFound: false };
    }
    
    const jsonQueenData = {
      hasSprite: !!jsonQueen._sprite,
      spriteImageExists: jsonQueen._sprite && !!jsonQueen._sprite.img,
      imageIsP5: jsonQueen._sprite && jsonQueen._sprite.img instanceof p5.Image,
      imageWidth: jsonQueen._sprite && jsonQueen._sprite.img ? jsonQueen._sprite.img.width : null,
      imageHeight: jsonQueen._sprite && jsonQueen._sprite.img ? jsonQueen._sprite.img.height : null
    };
    
    // Create manual queen for comparison
    const manualQueen = new QueenAnt(null);
    const manualQueenData = {
      hasSprite: !!manualQueen._sprite,
      spriteImageExists: manualQueen._sprite && !!manualQueen._sprite.img,
      imageIsP5: manualQueen._sprite && manualQueen._sprite.img instanceof p5.Image,
      imageWidth: manualQueen._sprite && manualQueen._sprite.img ? manualQueen._sprite.img.width : null,
      imageHeight: manualQueen._sprite && manualQueen._sprite.img ? manualQueen._sprite.img.height : null
    };
    
    return {
      jsonQueenFound: true,
      jsonQueen: jsonQueenData,
      manualQueen: manualQueenData,
      imagesMatch: jsonQueen._sprite && manualQueen._sprite && 
                   jsonQueen._sprite.img === manualQueen._sprite.img
    };
  });
  
  if (comparisonData.jsonQueenFound) {
    console.log('JSON Queen sprite:', comparisonData.jsonQueen);
    console.log('Manual Queen sprite:', comparisonData.manualQueen);
    console.log('Images match:', comparisonData.imagesMatch);
    
    if (!comparisonData.imagesMatch) {
      console.log('\n⚠️  ISSUE: JSON Queen and Manual Queen have DIFFERENT images!');
      console.log('   This suggests EntityFactory is not creating Queen correctly');
    }
  }
  
  // Test 5: Check Queen.js constructor to see default image
  console.log('\n=== TEST 5: QueenAnt Constructor Default Image ===');
  const queenConstructorData = await page.evaluate(() => {
    // Try to inspect the QueenAnt constructor
    if (typeof window.QueenAnt === 'undefined') {
      return { available: false };
    }
    
    // Get the constructor signature
    const constructorStr = window.QueenAnt.toString();
    
    // Look for the default image parameter
    const imgParamMatch = constructorStr.match(/img\s*=\s*([^,\)]+)/);
    
    return {
      available: true,
      constructorSignature: constructorStr.substring(0, 500), // First 500 chars
      defaultImageParam: imgParamMatch ? imgParamMatch[1].trim() : 'Not found'
    };
  });
  
  console.log('QueenAnt constructor available:', queenConstructorData.available);
  if (queenConstructorData.available) {
    console.log('Default img parameter:', queenConstructorData.defaultImageParam);
  }
  
  // Screenshot
  await sleep(500);
  await saveScreenshot(page, 'entities/queen_diagnosis', true);
  
  // Summary
  console.log('\n=== DIAGNOSIS SUMMARY ===');
  
  if (!comparisonData.jsonQueenFound) {
    console.log('❌ CRITICAL: No Queen found in ants array');
  } else {
    if (!comparisonData.jsonQueen.spriteImageExists) {
      console.log('❌ ISSUE: JSON Queen has no sprite image');
      console.log('   Likely cause: EntityFactory not passing correct image parameter');
    } else if (!comparisonData.imagesMatch) {
      console.log('⚠️  ISSUE: JSON Queen has different image than manual Queen');
      console.log('   Likely cause: EntityFactory overriding Queen\'s default image');
    } else {
      console.log('✅ JSON Queen sprite matches manual Queen sprite');
    }
  }
  
  await browser.close();
  process.exit(0);
})();
