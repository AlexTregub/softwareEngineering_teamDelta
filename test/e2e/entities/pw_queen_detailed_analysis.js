/**
 * E2E Test: Detailed Queen Sprite Analysis
 * Check if Queen has correct sprite and if it's being rendered
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
  await page.evaluate(async () => {
    if (typeof loadCustomLevel === 'function') {
      await loadCustomLevel('levels/CaveTutorial.json');
    }
  });
  
  await sleep(2000);
  
  // Detailed Queen analysis
  const queenAnalysis = await page.evaluate(() => {
    if (typeof ants === 'undefined' || !Array.isArray(ants)) {
      return { found: false, reason: 'ants array not found' };
    }
    
    const queen = ants.find(ant => ant.type === 'Queen' || ant.JobName === 'Queen' || ant.jobName === 'Queen');
    
    if (!queen) {
      return { found: false, reason: 'Queen not in ants array' };
    }
    
    const result = {
      found: true,
      basic: {
        type: queen.type,
        jobName: queen.JobName || queen.jobName,
        position: { x: queen.x, y: queen.y },
        size: { w: queen.w, h: queen.h }
      },
      sprite: {
        hasSprite: !!queen._sprite,
        spriteType: queen._sprite ? queen._sprite.constructor.name : null
      },
      image: {}
    };
    
    if (queen._sprite) {
      result.image = {
        hasImage: !!queen._sprite.img,
        imageType: queen._sprite.img ? queen._sprite.img.constructor.name : null,
        imageWidth: queen._sprite.img ? queen._sprite.img.width : null,
        imageHeight: queen._sprite.img ? queen._sprite.img.height : null,
        spritePosition: { x: queen._sprite.pos.x, y: queen._sprite.pos.y },
        spriteSize: { x: queen._sprite.size.x, y: queen._sprite.size.y }
      };
      
      // Try to get image source/path if available
      if (queen._sprite.img && queen._sprite.img.canvas) {
        result.image.hasCanvas = true;
        result.image.canvasWidth = queen._sprite.img.canvas.width;
        result.image.canvasHeight = queen._sprite.img.canvas.height;
      }
    }
    
    // Check if QueenAnt.getQueenSprite() method exists and what it returns
    result.queenSpriteMethod = {
      exists: typeof QueenAnt !== 'undefined' && typeof QueenAnt.getQueenSprite === 'function',
      result: null
    };
    
    if (result.queenSpriteMethod.exists) {
      const queenSprite = QueenAnt.getQueenSprite();
      result.queenSpriteMethod.result = {
        exists: !!queenSprite,
        type: queenSprite ? queenSprite.constructor.name : null,
        width: queenSprite ? queenSprite.width : null,
        height: queenSprite ? queenSprite.height : null,
        sameAsQueenImage: queen._sprite && queen._sprite.img === queenSprite
      };
    }
    
    return result;
  });
  
  console.log('\n=== QUEEN DETAILED ANALYSIS ===\n');
  console.log('Found:', queenAnalysis.found);
  
  if (!queenAnalysis.found) {
    console.error('❌', queenAnalysis.reason);
    await browser.close();
    process.exit(1);
  }
  
  console.log('\n--- Basic Info ---');
  console.log('Type:', queenAnalysis.basic.type);
  console.log('Job Name:', queenAnalysis.basic.jobName);
  console.log('Position:', queenAnalysis.basic.position);
  console.log('Size:', queenAnalysis.basic.size);
  
  console.log('\n--- Sprite Info ---');
  console.log('Has _sprite:', queenAnalysis.sprite.hasSprite);
  console.log('Sprite type:', queenAnalysis.sprite.spriteType);
  
  console.log('\n--- Image Info ---');
  console.log('Has image:', queenAnalysis.image.hasImage);
  console.log('Image type:', queenAnalysis.image.imageType);
  console.log('Image size:', `${queenAnalysis.image.imageWidth}x${queenAnalysis.image.imageHeight}`);
  console.log('Sprite position:', queenAnalysis.image.spritePosition);
  console.log('Sprite size:', queenAnalysis.image.spriteSize);
  if (queenAnalysis.image.hasCanvas) {
    console.log('Canvas size:', `${queenAnalysis.image.canvasWidth}x${queenAnalysis.image.canvasHeight}`);
  }
  
  console.log('\n--- QueenAnt.getQueenSprite() Method ---');
  console.log('Method exists:', queenAnalysis.queenSpriteMethod.exists);
  if (queenAnalysis.queenSpriteMethod.result) {
    console.log('Returns sprite:', queenAnalysis.queenSpriteMethod.result.exists);
    console.log('Sprite type:', queenAnalysis.queenSpriteMethod.result.type);
    console.log('Sprite size:', `${queenAnalysis.queenSpriteMethod.result.width}x${queenAnalysis.queenSpriteMethod.result.height}`);
    console.log('Same as Queen\'s image:', queenAnalysis.queenSpriteMethod.result.sameAsQueenImage);
  }
  
  // Render and screenshot
  await page.evaluate(() => {
    if (typeof window.redraw === 'function') {
      window.redraw();
      window.redraw();
      window.redraw();
    }
  });
  
  await sleep(500);
  await saveScreenshot(page, 'entities/queen_detailed_analysis', true);
  
  console.log('\n✅ Screenshot saved');
  
  // Check if Queen is visible in viewport
  const visibilityCheck = await page.evaluate(() => {
    const queen = ants.find(ant => ant.type === 'Queen' || ant.JobName === 'Queen');
    if (!queen) return { visible: false };
    
    // Check if camera is following queen
    const camPos = cameraManager && cameraManager.getCameraPosition ? 
                   cameraManager.getCameraPosition() : null;
    
    return {
      visible: true,
      queenPos: { x: queen.x, y: queen.y },
      cameraPos: camPos,
      cameraFollowing: camPos ? (Math.abs(camPos.x - queen.x) < 500 && Math.abs(camPos.y - queen.y) < 500) : null
    };
  });
  
  console.log('\n--- Visibility Check ---');
  console.log('Queen position:', visibilityCheck.queenPos);
  console.log('Camera position:', visibilityCheck.cameraPos);
  console.log('Camera following Queen:', visibilityCheck.cameraFollowing);
  
  await browser.close();
  process.exit(0);
})();
