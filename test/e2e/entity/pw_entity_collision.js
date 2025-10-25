/**
 * Test Suite 3: Entity Collision Detection
 * Tests entity collision detection and boundary checking
 * 
 * Coverage:
 * - collidesWith() detects overlapping entities
 * - collidesWith() returns false for non-overlapping
 * - contains() detects point inside bounds
 * - contains() returns false for point outside
 * - Moving entity triggers collision detection
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
 * Test 1: collidesWith() detects overlapping entities
 */
async function test_CollidesWithDetectsOverlapping(page) {
  return await runTest('Entity.collidesWith() detects overlapping entities', async () => {
    // Clear previous entities
    await page.evaluate(() => { 
      if (window.testEntities) {
        window.testEntities.forEach(e => e.destroy && e.destroy());
      }
      window.testEntities = []; 
    });
    
    // Create two overlapping entities
    await createTestEntity(page, {
      type: 'Entity1',
      x: 100,
      y: 100,
      width: 50,
      height: 50
    });
    
    await createTestEntity(page, {
      type: 'Entity2',
      x: 120,
      y: 120,
      width: 50,
      height: 50
    });

    const collisionTest = await page.evaluate(() => {
      const entity1 = window.testEntities[0];
      const entity2 = window.testEntities[1];
      
      // Test collision detection
      const collision = entity1.collidesWith(entity2);
      
      return {
        entity1Pos: entity1.getPosition(),
        entity2Pos: entity2.getPosition(),
        collision,
        hasMethod: typeof entity1.collidesWith === 'function'
      };
    });

    if (!collisionTest.hasMethod) {
      throw new Error('Entity does not have collidesWith() method');
    }

    if (!collisionTest.collision) {
      throw new Error(`Overlapping entities not detected as colliding: Entity1 at (${collisionTest.entity1Pos.x}, ${collisionTest.entity1Pos.y}), Entity2 at (${collisionTest.entity2Pos.x}, ${collisionTest.entity2Pos.y})`);
    }

    await captureEvidence(page, 'entity/collision_overlapping', true);
  });
}

/**
 * Test 2: collidesWith() returns false for non-overlapping entities
 */
async function test_CollidesWithReturnsFalseForNonOverlapping(page) {
  return await runTest('Entity.collidesWith() returns false for non-overlapping', async () => {
    // Clear previous entities
    await page.evaluate(() => { 
      if (window.testEntities) {
        window.testEntities.forEach(e => e.destroy && e.destroy());
      }
      window.testEntities = []; 
    });
    
    // Create two non-overlapping entities
    await createTestEntity(page, {
      type: 'Entity1',
      x: 100,
      y: 100,
      width: 50,
      height: 50
    });
    
    await createTestEntity(page, {
      type: 'Entity2',
      x: 300,
      y: 300,
      width: 50,
      height: 50
    });

    const collisionTest = await page.evaluate(() => {
      const entity1 = window.testEntities[0];
      const entity2 = window.testEntities[1];
      
      // Test collision detection
      const collision = entity1.collidesWith(entity2);
      
      return {
        entity1Pos: entity1.getPosition(),
        entity2Pos: entity2.getPosition(),
        collision
      };
    });

    if (collisionTest.collision) {
      throw new Error(`Non-overlapping entities incorrectly detected as colliding: Entity1 at (${collisionTest.entity1Pos.x}, ${collisionTest.entity1Pos.y}), Entity2 at (${collisionTest.entity2Pos.x}, ${collisionTest.entity2Pos.y})`);
    }

    await captureEvidence(page, 'entity/collision_non_overlapping', true);
  });
}

/**
 * Test 3: contains() detects point inside bounds
 */
async function test_ContainsDetectsPointInside(page) {
  return await runTest('Entity.contains() detects point inside bounds', async () => {
    // Clear previous entities
    await page.evaluate(() => { 
      if (window.testEntities) {
        window.testEntities.forEach(e => e.destroy && e.destroy());
      }
      window.testEntities = []; 
    });
    
    await createTestEntity(page, {
      type: 'ContainsTest',
      x: 100,
      y: 100,
      width: 100,
      height: 100
    });

    const containsTest = await page.evaluate(() => {
      const entity = window.testEntities[0];
      
      // Test point inside entity bounds
      const pointInside = { x: 150, y: 150 }; // Center of entity
      const contains = entity.contains(pointInside.x, pointInside.y);
      
      return {
        entityPos: entity.getPosition(),
        entitySize: entity.getSize(),
        pointInside,
        contains,
        hasMethod: typeof entity.contains === 'function'
      };
    });

    if (!containsTest.hasMethod) {
      throw new Error('Entity does not have contains() method');
    }

    if (!containsTest.contains) {
      throw new Error(`Point inside bounds not detected: Entity at (${containsTest.entityPos.x}, ${containsTest.entityPos.y}) size (${containsTest.entitySize.x}, ${containsTest.entitySize.y}), Point at (${containsTest.pointInside.x}, ${containsTest.pointInside.y})`);
    }

    await captureEvidence(page, 'entity/collision_contains_inside', true);
  });
}

/**
 * Test 4: contains() returns false for point outside bounds
 */
async function test_ContainsReturnsFalseForPointOutside(page) {
  return await runTest('Entity.contains() returns false for point outside', async () => {
    // Clear previous entities
    await page.evaluate(() => { 
      if (window.testEntities) {
        window.testEntities.forEach(e => e.destroy && e.destroy());
      }
      window.testEntities = []; 
    });
    
    await createTestEntity(page, {
      type: 'ContainsTest',
      x: 100,
      y: 100,
      width: 100,
      height: 100
    });

    const containsTest = await page.evaluate(() => {
      const entity = window.testEntities[0];
      
      // Test point outside entity bounds
      const pointOutside = { x: 300, y: 300 }; // Far from entity
      const contains = entity.contains(pointOutside.x, pointOutside.y);
      
      return {
        entityPos: entity.getPosition(),
        entitySize: entity.getSize(),
        pointOutside,
        contains
      };
    });

    if (containsTest.contains) {
      throw new Error(`Point outside bounds incorrectly detected as inside: Entity at (${containsTest.entityPos.x}, ${containsTest.entityPos.y}) size (${containsTest.entitySize.x}, ${containsTest.entitySize.y}), Point at (${containsTest.pointOutside.x}, ${containsTest.pointOutside.y})`);
    }

    await captureEvidence(page, 'entity/collision_contains_outside', true);
  });
}

/**
 * Test 5: Moving entity triggers collision detection
 */
async function test_MovingEntityTriggersCollisionDetection(page) {
  return await runTest('Moving entity triggers collision detection', async () => {
    // Clear previous entities
    await page.evaluate(() => { 
      if (window.testEntities) {
        window.testEntities.forEach(e => e.destroy && e.destroy());
      }
      window.testEntities = []; 
    });
    
    // Create two entities that will collide after movement
    await createTestEntity(page, {
      type: 'MovingEntity',
      x: 100,
      y: 100,
      width: 50,
      height: 50
    });
    
    await createTestEntity(page, {
      type: 'StaticEntity',
      x: 200,
      y: 100,
      width: 50,
      height: 50
    });

    const movementTest = await page.evaluate(() => {
      const entity1 = window.testEntities[0];
      const entity2 = window.testEntities[1];
      
      // Check initial state - should not collide
      const initialCollision = entity1.collidesWith(entity2);
      
      // Move entity1 toward entity2
      entity1.setPosition(190, 100); // Move close to entity2
      
      // Check collision after movement
      const finalCollision = entity1.collidesWith(entity2);
      
      return {
        initialCollision,
        finalCollision,
        entity1Pos: entity1.getPosition(),
        entity2Pos: entity2.getPosition()
      };
    });

    if (movementTest.initialCollision) {
      throw new Error('Entities incorrectly colliding before movement');
    }

    if (!movementTest.finalCollision) {
      throw new Error(`Movement did not trigger collision detection: Entity1 at (${movementTest.entity1Pos.x}, ${movementTest.entity1Pos.y}), Entity2 at (${movementTest.entity2Pos.x}, ${movementTest.entity2Pos.y})`);
    }

    await captureEvidence(page, 'entity/collision_movement', true);
  });
}

/**
 * Main test suite runner
 */
async function runTestSuite() {
  console.log('\n' + '='.repeat(70));
  console.log('  Test Suite 3: Entity Collision Detection');
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
    results.push(await test_CollidesWithDetectsOverlapping(page));
    results.push(await test_CollidesWithReturnsFalseForNonOverlapping(page));
    results.push(await test_ContainsDetectsPointInside(page));
    results.push(await test_ContainsReturnsFalseForPointOutside(page));
    results.push(await test_MovingEntityTriggersCollisionDetection(page));

    // Final state screenshot
    await forceRedraw(page);
    await sleep(500);
    await captureEvidence(page, 'entity/collision_final_state', true);

  } catch (error) {
    console.error('\n❌ Test suite error:', error.message);
    if (page) {
      await captureEvidence(page, 'entity/collision_suite_error', false);
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
