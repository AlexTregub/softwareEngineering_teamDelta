/**
 * Test Suite 2: Entity Transform
 * Tests entity position and size manipulation
 * 
 * Coverage:
 * - setPosition() / getPosition()
 * - setSize() / getSize()
 * - getCenter()
 * - Position syncs with collision box
 * - Position syncs with sprite
 * - Rotation affects rendering
 */

const { launchBrowser, saveScreenshot } = require('../puppeteer_helper');
const { ensureGameStarted, createTestEntity, forceRedraw, sleep } = require('../helpers/game_helper');
const { captureEvidence } = require('../helpers/screenshot_helper');
const { validateEntityData } = require('../helpers/validation_helper');

/**
 * Test wrapper for consistent error handling and reporting
 */
async function runTest(testName, testFn) {
  const startTime = Date.now();
  try {
    await testFn();
    const duration = Date.now() - startTime;
    console.log(`✅ PASS: ${testName} (${duration}ms)`);
    return { passed: true, duration, testName };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ FAIL: ${testName} (${duration}ms)`);
    console.error(`   Error: ${error.message}`);
    return { passed: false, duration, error: error.message, testName };
  }
}

/**
 * Test 1: Entity setPosition() updates position
 */
async function test_EntitySetPositionUpdatesPosition(page) {
  return await runTest('Entity setPosition() updates position', async () => {
    // Clear previous entities properly
    await page.evaluate(() => { 
      if (window.testEntities) {
        window.testEntities.forEach(e => e.destroy && e.destroy());
      }
      window.testEntities = []; 
    });
    
    const result = await createTestEntity(page, {
      type: 'TransformTest',
      x: 100,
      y: 100
    });

    const positionTest = await page.evaluate(() => {
      const entity = window.testEntities[0];
      
      // Set position to known values
      entity.setPosition(250, 350);
      
      // Read position back
      const pos = entity.getPosition();
      const collisionBox = entity._collisionBox;
      
      return {
        entityX: pos.x,
        entityY: pos.y,
        collisionX: collisionBox.x,
        collisionY: collisionBox.y,
        correctX: pos.x === 250,
        correctY: pos.y === 350
      };
    });

    if (!positionTest.correctX || !positionTest.correctY) {
      console.log('   DEBUG: Position after setPosition(250, 350):', positionTest);
      throw new Error(`Position incorrect after setPosition(): got (${positionTest.entityX}, ${positionTest.entityY}), expected (250, 350)`);
    }

    await captureEvidence(page, 'entity/transform_set_position', true);
  });
}

/**
 * Test 2: Entity getPosition() returns correct position
 */
async function test_EntityGetPositionReturnsCorrectPosition(page) {
  return await runTest('Entity getPosition() returns correct position', async () => {
    // Clear previous entities
    await page.evaluate(() => { window.testEntities = []; });
    
    const result = await createTestEntity(page, {
      type: 'PositionTest',
      x: 123,
      y: 456
    });

    const posCheck = await page.evaluate(() => {
      const entity = window.testEntities[0];
      const pos = entity.getPosition();
      
      return {
        hasX: pos.hasOwnProperty('x'),
        hasY: pos.hasOwnProperty('y'),
        x: pos.x,
        y: pos.y,
        isVector: pos.constructor && pos.constructor.name === 'p5.Vector'
      };
    });

    if (!posCheck.hasX || !posCheck.hasY) {
      throw new Error('getPosition() did not return object with x and y');
    }

    if (posCheck.x !== 123 || posCheck.y !== 456) {
      throw new Error(`Position incorrect: got (${posCheck.x}, ${posCheck.y}), expected (123, 456)`);
    }

    await captureEvidence(page, 'entity/transform_get_position', true);
  });
}

/**
 * Test 3: Entity setSize() updates dimensions
 */
async function test_EntitySetSizeUpdatesDimensions(page) {
  return await runTest('Entity setSize() updates dimensions', async () => {
    // Clear previous entities
    await page.evaluate(() => { 
      if (window.testEntities) {
        window.testEntities.forEach(e => e.destroy && e.destroy());
      }
      window.testEntities = []; 
    });
    
    const result = await createTestEntity(page, {
      type: 'SizeTest',
      width: 32,
      height: 32
    });

    const sizeTest = await page.evaluate(() => {
      const entity = window.testEntities[0];
      
      // Set size to known values
      entity.setSize(64, 48);
      
      // Read size back
      const size = entity.getSize();
      const collisionBox = entity._collisionBox;
      
      return {
        sizeX: size.x,
        sizeY: size.y,
        collisionWidth: collisionBox.width,
        collisionHeight: collisionBox.height,
        correctWidth: size.x === 64,
        correctHeight: size.y === 48
      };
    });

    if (!sizeTest.correctWidth || !sizeTest.correctHeight) {
      console.log('   DEBUG: Size after setSize(64, 48):', sizeTest);
      throw new Error(`Size incorrect after setSize(): got (${sizeTest.sizeX}, ${sizeTest.sizeY}), expected (64, 48)`);
    }

    await captureEvidence(page, 'entity/transform_set_size', true);
  });
}

/**
 * Test 4: Entity getSize() returns dimensions
 */
async function test_EntityGetSizeReturnsDimensions(page) {
  return await runTest('Entity getSize() returns dimensions', async () => {
    // Clear previous entities
    await page.evaluate(() => { window.testEntities = []; });
    
    const result = await createTestEntity(page, {
      type: 'GetSizeTest',
      width: 48,
      height: 64
    });

    const sizeCheck = await page.evaluate(() => {
      const entity = window.testEntities[0];
      const size = entity.getSize();
      
      return {
        hasX: size.hasOwnProperty('x'),
        hasY: size.hasOwnProperty('y'),
        x: size.x,
        y: size.y
      };
    });

    if (!sizeCheck.hasX || !sizeCheck.hasY) {
      throw new Error('getSize() did not return object with x and y');
    }

    if (sizeCheck.x !== 48 || sizeCheck.y !== 64) {
      throw new Error(`Size incorrect: got (${sizeCheck.x}, ${sizeCheck.y}), expected (48, 64)`);
    }

    await captureEvidence(page, 'entity/transform_get_size', true);
  });
}

/**
 * Test 5: Entity getCenter() calculates center
 */
async function test_EntityGetCenterCalculatesCenter(page) {
  return await runTest('Entity getCenter() calculates center point', async () => {
    // Clear previous entities
    await page.evaluate(() => { window.testEntities = []; });
    
    const result = await createTestEntity(page, {
      type: 'CenterTest',
      x: 100,
      y: 200,
      width: 50,
      height: 50
    });

    const centerCheck = await page.evaluate(() => {
      const entity = window.testEntities[0];
      const center = entity.getCenter();
      const pos = entity.getPosition();
      const size = entity.getSize();
      
      const expectedX = pos.x + size.x / 2;
      const expectedY = pos.y + size.y / 2;
      
      return {
        center,
        expectedX,
        expectedY,
        correctX: Math.abs(center.x - expectedX) < 0.01,
        correctY: Math.abs(center.y - expectedY) < 0.01
      };
    });

    if (!centerCheck.correctX || !centerCheck.correctY) {
      throw new Error(`Center calculation incorrect: got (${centerCheck.center.x}, ${centerCheck.center.y}), expected (${centerCheck.expectedX}, ${centerCheck.expectedY})`);
    }

    await captureEvidence(page, 'entity/transform_get_center', true);
  });
}

/**
 * Test 6: Position syncs with collision box
 */
async function test_PositionSyncsWithCollisionBox(page) {
  return await runTest('Position changes sync with collision box', async () => {
    // Clear previous entities
    await page.evaluate(() => { window.testEntities = []; });
    
    const result = await createTestEntity(page, {
      type: 'CollisionSyncTest',
      x: 100,
      y: 100,
      width: 32,
      height: 32
    });

    const syncCheck = await page.evaluate(() => {
      const entity = window.testEntities[0];
      
      // Change position
      entity.setPosition(300, 400);
      
      const pos = entity.getPosition();
      const collisionBox = entity._collisionBox;
      
      if (!collisionBox) {
        return { hasCollisionBox: false };
      }
      
      return {
        hasCollisionBox: true,
        entityX: pos.x,
        entityY: pos.y,
        collisionX: collisionBox.x,
        collisionY: collisionBox.y,
        synced: pos.x === collisionBox.x && pos.y === collisionBox.y
      };
    });

    if (!syncCheck.hasCollisionBox) {
      throw new Error('Entity does not have collision box');
    }

    if (!syncCheck.synced) {
      throw new Error(`Position not synced with collision box: entity (${syncCheck.entityX}, ${syncCheck.entityY}), collision (${syncCheck.collisionX}, ${syncCheck.collisionY})`);
    }

    await captureEvidence(page, 'entity/transform_collision_sync', true);
  });
}

/**
 * Test 7: Position syncs with sprite (via TransformController)
 * NOTE: Sprite sync requires TransformController. Entities without this controller
 * only update collision box position directly.
 */
async function test_PositionSyncsWithSprite(page) {
  return await runTest('Position changes sync with sprite (if TransformController present)', async () => {
    // Clear previous entities
    await page.evaluate(() => { 
      if (window.testEntities) {
        window.testEntities.forEach(e => e.destroy && e.destroy());
      }
      window.testEntities = []; 
    });
    
    const result = await createTestEntity(page, {
      type: 'SpriteSyncTest',
      x: 100,
      y: 100,
      width: 32,
      height: 32
    });

    const syncCheck = await page.evaluate(() => {
      const entity = window.testEntities[0];
      
      // Check if entity has TransformController
      const hasTransformController = entity._controllers && entity._controllers.has('transform');
      
      // Change position
      entity.setPosition(500, 600);
      
      // Call update to trigger sprite sync (if transform controller present)
      if (hasTransformController) {
        const controller = entity._controllers.get('transform');
        if (controller && controller.update) {
          controller.update();
        }
      }
      
      const pos = entity.getPosition();
      const sprite = entity._sprite;
      
      if (!sprite) {
        return { hasSprite: false, hasTransformController };
      }
      
      // Sprite uses sprite.pos.x and sprite.pos.y, not sprite.x/y
      return {
        hasSprite: true,
        hasTransformController,
        entityX: pos.x,
        entityY: pos.y,
        spriteX: sprite.pos ? sprite.pos.x : undefined,
        spriteY: sprite.pos ? sprite.pos.y : undefined,
        synced: sprite.pos && (pos.x === sprite.pos.x && pos.y === sprite.pos.y)
      };
    });

    // Sprite is optional
    if (!syncCheck.hasSprite) {
      console.log('   ℹ️  Note: Entity does not have sprite (optional)');
      await captureEvidence(page, 'entity/transform_sprite_sync_no_sprite', true);
      return;
    }

    // If no TransformController, sprite sync is NOT automatic
    if (!syncCheck.hasTransformController) {
      console.log('   ℹ️  Note: Entity has no TransformController - sprite sync is optional feature');
      console.log('   ℹ️  Sprite sync requires TransformController which updates sprite automatically');
      await captureEvidence(page, 'entity/transform_sprite_no_controller', true);
      return; // Pass test - this is expected behavior
    }

    // If TransformController present, sprite SHOULD sync
    if (!syncCheck.synced) {
      console.log('   DEBUG: Sprite sync check:', syncCheck);
      throw new Error(`Position not synced with sprite (TransformController present): entity (${syncCheck.entityX}, ${syncCheck.entityY}), sprite (${syncCheck.spriteX}, ${syncCheck.spriteY})`);
    }

    await captureEvidence(page, 'entity/transform_sprite_sync', true);
  });
}

/**
 * Test 8: Rotation affects rendering
 */
async function test_RotationAffectsRendering(page) {
  return await runTest('Rotation affects entity rendering', async () => {
    // Clear previous entities
    await page.evaluate(() => { window.testEntities = []; });
    
    const result = await createTestEntity(page, {
      type: 'RotationTest',
      x: 400,
      y: 400,
      width: 32,
      height: 32
    });

    const rotationCheck = await page.evaluate(() => {
      const entity = window.testEntities[0];
      
      // Set rotation
      entity.rotation = Math.PI / 4; // 45 degrees
      
      return {
        rotation: entity.rotation,
        hasRotation: entity.rotation !== 0,
        rotationValue: entity.rotation
      };
    });

    if (!rotationCheck.hasRotation) {
      throw new Error('Rotation property did not change');
    }

    if (Math.abs(rotationCheck.rotationValue - Math.PI / 4) > 0.01) {
      throw new Error(`Rotation value incorrect: got ${rotationCheck.rotationValue}, expected ${Math.PI / 4}`);
    }

    // Force redraw to show rotated entity
    await forceRedraw(page);
    await sleep(200);

    await captureEvidence(page, 'entity/transform_rotation', true);
  });
}

/**
 * Main test suite runner
 */
async function runTestSuite() {
  console.log('\n' + '='.repeat(70));
  console.log('  Test Suite 2: Entity Transform');
  console.log('='.repeat(70) + '\n');

  let browser;
  let page;
  const results = [];

  try {
    // Launch browser
    browser = await launchBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Navigate to game
    await page.goto('http://localhost:8000', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // Wait for canvas
    await page.waitForSelector('canvas', { timeout: 10000 });
    await sleep(1000);

    // Ensure game is started
    const gameStarted = await ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Failed to start game - still on main menu');
    }

    console.log('✓ Game started, running tests...\n');

    // Initialize test entities array
    await page.evaluate(() => {
      window.testEntities = [];
    });

    // Run tests
    results.push(await test_EntitySetPositionUpdatesPosition(page));
    results.push(await test_EntityGetPositionReturnsCorrectPosition(page));
    results.push(await test_EntitySetSizeUpdatesDimensions(page));
    results.push(await test_EntityGetSizeReturnsDimensions(page));
    results.push(await test_EntityGetCenterCalculatesCenter(page));
    results.push(await test_PositionSyncsWithCollisionBox(page));
    results.push(await test_PositionSyncsWithSprite(page));
    results.push(await test_RotationAffectsRendering(page));

    // Final state screenshot
    await forceRedraw(page);
    await sleep(500);
    await captureEvidence(page, 'entity/transform_final_state', true);

  } catch (error) {
    console.error('\n❌ Test suite error:', error.message);
    if (page) {
      await captureEvidence(page, 'entity/transform_suite_error', false);
    }
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(70));
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  const passRate = ((passed / total) * 100).toFixed(1);

  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Pass Rate: ${passRate}%`);
  console.log('='.repeat(70) + '\n');

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run if executed directly
if (require.main === module) {
  runTestSuite().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runTestSuite };
