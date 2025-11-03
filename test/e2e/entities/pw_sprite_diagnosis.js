/**
 * E2E Test: Sprite System Diagnosis
 * Tests sprite loading, assignment, and rendering for different entity types
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
  
  // Test 1: Check sprite loading for all ants
  console.log('\n=== TEST 1: Sprite Loading ===');
  const spriteData = await page.evaluate(() => {
    const results = {
      antBaseSprite: {
        exists: typeof window.antBaseSprite !== 'undefined',
        isImage: window.antBaseSprite instanceof p5.Image,
        width: window.antBaseSprite ? window.antBaseSprite.width : null,
        height: window.antBaseSprite ? window.antBaseSprite.height : null
      },
      jobImages: {
        exists: typeof window.JobImages !== 'undefined',
        isArray: Array.isArray(window.JobImages),
        length: window.JobImages ? window.JobImages.length : 0,
        names: []
      },
      ants: []
    };
    
    // Check JobImages array
    if (window.JobImages && Array.isArray(window.JobImages)) {
      window.JobImages.forEach((img, index) => {
        results.jobImages.names.push({
          index,
          exists: !!img,
          isImage: img instanceof p5.Image,
          width: img ? img.width : null,
          height: img ? img.height : null
        });
      });
    }
    
    // Check each ant's sprite
    if (Array.isArray(window.ants)) {
      window.ants.forEach((ant, index) => {
        const sprite = ant._sprite;
        const antData = {
          index,
          type: ant.type || ant.constructor.name,
          jobName: ant.JobName || ant.jobName || 'Unknown',
          position: { x: Math.round(ant.x), y: Math.round(ant.y) },
          hasSprite: !!sprite,
          spriteData: null
        };
        
        if (sprite) {
          antData.spriteData = {
            hasImage: !!sprite.img,
            isP5Image: sprite.img instanceof p5.Image,
            imageWidth: sprite.img ? sprite.img.width : null,
            imageHeight: sprite.img ? sprite.img.height : null,
            position: { x: sprite.pos.x, y: sprite.pos.y },
            size: { x: sprite.size.x, y: sprite.size.y }
          };
        }
        
        results.ants.push(antData);
      });
    }
    
    return results;
  });
  
  console.log('antBaseSprite:', spriteData.antBaseSprite);
  console.log('JobImages array:', spriteData.jobImages);
  console.log('\nAnts:');
  spriteData.ants.forEach(ant => {
    console.log(`  ${ant.index}. ${ant.type} (${ant.jobName}) at (${ant.position.x}, ${ant.position.y})`);
    console.log(`     hasSprite: ${ant.hasSprite}`);
    if (ant.spriteData) {
      console.log(`     hasImage: ${ant.spriteData.hasImage}, isP5Image: ${ant.spriteData.isP5Image}`);
      console.log(`     imageSize: ${ant.spriteData.imageWidth}x${ant.spriteData.imageHeight}`);
    }
  });
  
  // Test 2: Check Queen specifically
  console.log('\n=== TEST 2: Queen Sprite ===');
  const queenData = await page.evaluate(() => {
    const queen = window.ants.find(ant => 
      ant.type === 'Queen' || ant.JobName === 'Queen' || ant.jobName === 'Queen'
    );
    
    if (!queen) {
      return { found: false };
    }
    
    const result = {
      found: true,
      type: queen.type,
      jobName: queen.JobName || queen.jobName,
      position: { x: queen.x, y: queen.y },
      size: { x: queen.w, y: queen.h },
      hasSprite: !!queen._sprite,
      spriteImage: null,
      expectedQueenImage: null
    };
    
    if (queen._sprite) {
      result.spriteImage = {
        exists: !!queen._sprite.img,
        isP5Image: queen._sprite.img instanceof p5.Image,
        width: queen._sprite.img ? queen._sprite.img.width : null,
        height: queen._sprite.img ? queen._sprite.img.height : null
      };
    }
    
    // Check what the Queen sprite SHOULD be (JobImages[3] = Builder/Queen)
    if (window.JobImages && window.JobImages[3]) {
      result.expectedQueenImage = {
        exists: true,
        isP5Image: window.JobImages[3] instanceof p5.Image,
        width: window.JobImages[3].width,
        height: window.JobImages[3].height
      };
      
      // Check if queen actually has the correct image
      if (queen._sprite && queen._sprite.img) {
        result.hasCorrectImage = queen._sprite.img === window.JobImages[3];
      }
    }
    
    return result;
  });
  
  console.log('Queen found:', queenData.found);
  if (queenData.found) {
    console.log('Queen type:', queenData.type);
    console.log('Queen jobName:', queenData.jobName);
    console.log('Queen position:', queenData.position);
    console.log('Queen size:', queenData.size);
    console.log('Queen hasSprite:', queenData.hasSprite);
    console.log('Queen sprite image:', queenData.spriteImage);
    console.log('Expected Queen image (JobImages[3]):', queenData.expectedQueenImage);
    console.log('Has CORRECT image:', queenData.hasCorrectImage);
  }
  
  // Test 3: Check Sprite2D rendering conditions
  console.log('\n=== TEST 3: Sprite2D Rendering Conditions ===');
  const renderingData = await page.evaluate(() => {
    return {
      gameState: window.GameState ? window.GameState.getState() : 'Unknown',
      hasActiveMap: typeof window.g_activeMap !== 'undefined' && !!window.g_activeMap,
      hasRenderConversion: window.g_activeMap && !!window.g_activeMap.renderConversion,
      usingGridTerrain: window.g_activeMap && window.g_activeMap.renderConversion && typeof window.TILE_SIZE !== 'undefined',
      cameraType: window.cameraManager && window.cameraManager.activeCamera ? 
        window.cameraManager.activeCamera.constructor.name : 'Unknown'
    };
  });
  
  console.log('Game state:', renderingData.gameState);
  console.log('Has g_activeMap:', renderingData.hasActiveMap);
  console.log('Has renderConversion:', renderingData.hasRenderConversion);
  console.log('Using GridTerrain coord system:', renderingData.usingGridTerrain);
  console.log('Active camera:', renderingData.cameraType);
  
  // Test 4: Screenshot for visual confirmation
  console.log('\n=== TEST 4: Visual Confirmation ===');
  await sleep(500);
  await saveScreenshot(page, 'entities/sprite_diagnosis', true);
  console.log('Screenshot saved: test/e2e/screenshots/entities/success/sprite_diagnosis.png');
  
  // Summary
  console.log('\n=== SUMMARY ===');
  const allPass = spriteData.antBaseSprite.exists && 
                  spriteData.ants.every(ant => ant.hasSprite) &&
                  queenData.found &&
                  queenData.hasSprite;
  
  if (allPass) {
    console.log('✅ All ants have sprites');
    if (queenData.hasCorrectImage === false) {
      console.log('⚠️  WARNING: Queen has sprite but WRONG image!');
      console.log('   Queen should use JobImages[3] (Builder/Queen sprite)');
    }
  } else {
    console.log('❌ Sprite issues detected:');
    if (!spriteData.antBaseSprite.exists) console.log('   - antBaseSprite not loaded');
    spriteData.ants.forEach(ant => {
      if (!ant.hasSprite) console.log(`   - Ant ${ant.index} (${ant.type}) missing sprite`);
    });
    if (!queenData.found) console.log('   - Queen not found');
    if (queenData.found && !queenData.hasSprite) console.log('   - Queen missing sprite');
  }
  
  await browser.close();
  process.exit(allPass ? 0 : 1);
})();
