/**
 * E2E Test: Queen Sprite Verification
 * Simple test to check if Queen has a sprite in custom level
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

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
  
  // Check ants array
  console.log('\n=== Checking Ants Array ===');
  const antsData = await page.evaluate(() => {
    // Use bare ants variable (not window.ants)
    if (typeof ants === 'undefined' || !Array.isArray(ants)) {
      return { exists: false };
    }
    
    const results = {
      exists: true,
      count: ants.length,
      ants: []
    };
    
    ants.forEach((ant, index) => {
      const antData = {
        index,
        type: ant.type || ant.constructor.name,
        jobName: ant.JobName || ant.jobName || 'Unknown',
        position: { x: Math.round(ant.x), y: Math.round(ant.y) },
        size: { x: ant.w, y: ant.h },
        hasSprite: !!ant._sprite,
        spriteData: null
      };
      
      if (ant._sprite) {
        antData.spriteData = {
          hasImage: !!ant._sprite.img,
          imageType: ant._sprite.img ? ant._sprite.img.constructor.name : null,
          imageWidth: ant._sprite.img ? ant._sprite.img.width : null,
          imageHeight: ant._sprite.img ? ant._sprite.img.height : null
        };
      }
      
      results.ants.push(antData);
    });
    
    return results;
  });
  
  console.log(`Total ants: ${antsData.count}`);
  console.log('\nAnt Details:');
  antsData.ants.forEach(ant => {
    const isQueen = ant.type === 'Queen' || ant.jobName === 'Queen';
    const marker = isQueen ? '👑' : '🐜';
    console.log(`${marker} ${ant.index}. ${ant.type} (${ant.jobName}) at (${ant.position.x}, ${ant.position.y})`);
    console.log(`   Size: ${ant.size.x}x${ant.size.y}`);
    console.log(`   Has sprite: ${ant.hasSprite}`);
    if (ant.spriteData) {
      console.log(`   Sprite has image: ${ant.spriteData.hasImage}`);
      console.log(`   Image type: ${ant.spriteData.imageType}`);
      console.log(`   Image size: ${ant.spriteData.imageWidth}x${ant.spriteData.imageHeight}`);
    }
    console.log('');
  });
  
  // Find Queen specifically
  const queen = antsData.ants.find(ant => ant.type === 'Queen' || ant.jobName === 'Queen');
  
  console.log('\n=== Queen Analysis ===');
  if (!queen) {
    console.error('❌ No Queen found!');
    await browser.close();
    process.exit(1);
  }
  
  console.log('✅ Queen found!');
  console.log('Position:', queen.position);
  console.log('Size:', queen.size);
  console.log('Has sprite:', queen.hasSprite);
  
  if (!queen.hasSprite) {
    console.error('❌ Queen has NO sprite!');
    await browser.close();
    process.exit(1);
  }
  
  if (!queen.spriteData.hasImage) {
    console.error('❌ Queen sprite has NO image!');
    await browser.close();
    process.exit(1);
  }
  
  console.log('✅ Queen has sprite with image!');
  console.log('Image size:', `${queen.spriteData.imageWidth}x${queen.spriteData.imageHeight}`);
  
  // Force redraw and take screenshot
  await page.evaluate(() => {
    if (typeof window.redraw === 'function') {
      window.redraw();
      window.redraw();
      window.redraw();
    }
  });
  
  await sleep(500);
  await saveScreenshot(page, 'entities/queen_sprite_verification', true);
  console.log('\n✅ Screenshot saved: test/e2e/screenshots/entities/success/queen_sprite_verification.png');
  
  // Summary
  console.log('\n=== SUMMARY ===');
  const allAntsHaveSprites = antsData.ants.every(ant => ant.hasSprite && ant.spriteData?.hasImage);
  
  if (allAntsHaveSprites) {
    console.log('✅ ALL ants have sprites with images');
  } else {
    console.log('⚠️  Some ants missing sprites:');
    antsData.ants.forEach(ant => {
      if (!ant.hasSprite || !ant.spriteData?.hasImage) {
        console.log(`   - ${ant.type} (${ant.jobName}) at (${ant.position.x}, ${ant.position.y})`);
      }
    });
  }
  
  await browser.close();
  process.exit(allAntsHaveSprites ? 0 : 1);
})();
