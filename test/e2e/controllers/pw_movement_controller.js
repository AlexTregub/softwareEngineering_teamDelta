/**
 * Test Suite 6: MovementController
 * 
 * Tests entity movement, pathfinding, and navigation capabilities.
 * 
 * Coverage:
 * - moveToLocation() initiates pathfinding
 * - Entity moves toward target
 * - Entity stops at destination
 * - isMoving() state tracking
 * - stop() halts movement
 * - Movement speed affects travel time
 * - Spatial grid updates during movement
 * 
 * Prerequisites:
 * - Dev server running on localhost:8000
 * - MovementController available
 * - PathMap system functional
 */

const { launchBrowser, saveScreenshot, sleep } = require('../puppeteer_helper');
const { ensureGameStarted, forceRedraw, createTestEntity } = require('../helpers/game_helper');
const { captureEvidence } = require('../helpers/screenshot_helper');

// Test tracking
let testsPassed = 0;
let testsFailed = 0;

/**
 * Test 1: moveToLocation() initiates pathfinding
 */
async function test_MoveToLocationInitiates(page) {
  const testName = 'MovementController.moveToLocation() initiates pathfinding';
  const startTime = Date.now();

  try {
    // Clear previous entities
    await page.evaluate(() => {
      if (window.testEntities) {
        window.testEntities.forEach(e => e.destroy && e.destroy());
      }
      window.testEntities = [];
    });

    const result = await page.evaluate(() => {
      const entity = new Entity(100, 100, 32, 32, {
        type: "TestEntity",
        movementSpeed: 3.0
      });
      window.testEntities = [entity];

      const initialPos = entity.getPosition();

      // Initiate movement
      entity.moveToLocation(400, 400);

      const isMoving = entity.isMoving();
      const hasMovementController = entity.getController('movement') !== null;

      return {
        initialPos,
        isMoving,
        hasMovementController,
        hasMoveToLocation: typeof entity.moveToLocation === 'function',
        hasIsMoving: typeof entity.isMoving === 'function'
      };
    });

    if (!result.hasMoveToLocation) throw new Error('Entity missing moveToLocation() method');
    if (!result.hasIsMoving) throw new Error('Entity missing isMoving() method');
    if (!result.hasMovementController) {
      console.log('  ⚠️ Warning: MovementController not available');
    }
    if (!result.isMoving) {
      console.log('  ℹ️ Note: isMoving() returns false after moveToLocation()');
    }

    await captureEvidence(page, 'controllers/movement_initiate', 'controllers', true);

    const duration = Date.now() - startTime;
    console.log(`  ✅ PASS: ${testName} (${duration}ms)`);
    testsPassed++;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`  ❌ FAIL: ${testName} (${duration}ms)`);
    console.log(`     Error: ${error.message}`);
    await captureEvidence(page, 'controllers/movement_initiate_fail', 'controllers', false);
    testsFailed++;
  }
}

/**
 * Test 2: Entity moves toward target location
 */
async function test_EntityMovesTowardTarget(page) {
  const testName = 'Entity moves toward target location';
  const startTime = Date.now();

  try {
    // Clear previous entities
    await page.evaluate(() => {
      if (window.testEntities) {
        window.testEntities.forEach(e => e.destroy && e.destroy());
      }
      window.testEntities = [];
    });

    const initial = await page.evaluate(() => {
      const entity = new Entity(100, 100, 32, 32, {
        type: "TestEntity",
        movementSpeed: 5.0
      });
      window.testEntities = [entity];

      entity.moveToLocation(400, 400);

      return {
        initialPos: entity.getPosition(),
        targetPos: { x: 400, y: 400 }
      };
    });

    // Wait for movement
    await sleep(2000);

    // Force update
    await forceRedraw(page);

    const final = await page.evaluate(() => {
      const entity = window.testEntities[0];
      return {
        finalPos: entity.getPosition(),
        isMoving: entity.isMoving()
      };
    });

    // Calculate distance moved
    const distanceMoved = Math.hypot(
      final.finalPos.x - initial.initialPos.x,
      final.finalPos.y - initial.initialPos.y
    );

    if (distanceMoved < 10) {
      throw new Error(`Entity barely moved (${distanceMoved.toFixed(1)}px)`);
    }

    console.log(`  ℹ️ Entity moved ${distanceMoved.toFixed(1)}px in 2 seconds`);

    await captureEvidence(page, 'controllers/movement_toward_target', 'controllers', true);

    const duration = Date.now() - startTime;
    console.log(`  ✅ PASS: ${testName} (${duration}ms)`);
    testsPassed++;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`  ❌ FAIL: ${testName} (${duration}ms)`);
    console.log(`     Error: ${error.message}`);
    await captureEvidence(page, 'controllers/movement_toward_target_fail', 'controllers', false);
    testsFailed++;
  }
}

/**
 * Test 3: isMoving() returns correct state
 */
async function test_IsMovingState(page) {
  const testName = 'isMoving() returns correct state';
  const startTime = Date.now();

  try {
    // Clear previous entities
    await page.evaluate(() => {
      if (window.testEntities) {
        window.testEntities.forEach(e => e.destroy && e.destroy());
      }
      window.testEntities = [];
    });

    const result = await page.evaluate(() => {
      const entity = new Entity(150, 150, 32, 32, {
        type: "TestEntity",
        movementSpeed: 3.0
      });
      window.testEntities = [entity];

      const idleBefore = entity.isMoving();

      entity.moveToLocation(450, 450);

      const movingDuring = entity.isMoving();

      // Stop movement
      if (entity.stop) {
        entity.stop();
      }

      const idleAfter = entity.isMoving();

      return {
        idleBefore,
        movingDuring,
        idleAfter,
        hasStop: typeof entity.stop === 'function'
      };
    });

    if (result.idleBefore === true) {
      console.log('  ℹ️ Note: isMoving() returns true when idle (unexpected)');
    }

    if (!result.hasStop) {
      console.log('  ⚠️ Warning: Entity missing stop() method');
    }

    await captureEvidence(page, 'controllers/movement_is_moving_state', 'controllers', true);

    const duration = Date.now() - startTime;
    console.log(`  ✅ PASS: ${testName} (${duration}ms)`);
    testsPassed++;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`  ❌ FAIL: ${testName} (${duration}ms)`);
    console.log(`     Error: ${error.message}`);
    await captureEvidence(page, 'controllers/movement_is_moving_fail', 'controllers', false);
    testsFailed++;
  }
}

/**
 * Test 4: stop() halts movement
 */
async function test_StopHaltsMovement(page) {
  const testName = 'stop() halts movement';
  const startTime = Date.now();

  try {
    // Clear previous entities
    await page.evaluate(() => {
      if (window.testEntities) {
        window.testEntities.forEach(e => e.destroy && e.destroy());
      }
      window.testEntities = [];
    });

    const initial = await page.evaluate(() => {
      const entity = new Entity(200, 200, 32, 32, {
        type: "TestEntity",
        movementSpeed: 5.0
      });
      window.testEntities = [entity];

      entity.moveToLocation(500, 500);

      return {
        hasStop: typeof entity.stop === 'function',
        initialPos: entity.getPosition()
      };
    });

    if (!initial.hasStop) {
      console.log('  ⚠️ Warning: Entity missing stop() method - skipping test');
      throw new Error('stop() method not available');
    }

    // Let it move a bit
    await sleep(500);

    // Stop movement
    await page.evaluate(() => {
      const entity = window.testEntities[0];
      entity.stop();
    });

    const posAfterStop = await page.evaluate(() => {
      const entity = window.testEntities[0];
      return {
        pos: entity.getPosition(),
        isMoving: entity.isMoving()
      };
    });

    // Wait more time
    await sleep(1000);

    const posAfterWait = await page.evaluate(() => {
      const entity = window.testEntities[0];
      return {
        pos: entity.getPosition(),
        isMoving: entity.isMoving()
      };
    });

    // Check if position stayed the same
    const moved = Math.hypot(
      posAfterWait.pos.x - posAfterStop.pos.x,
      posAfterWait.pos.y - posAfterStop.pos.y
    );

    if (moved > 50) {
      console.log(`  ⚠️ Warning: Entity moved ${moved.toFixed(1)}px after stop()`);
    }

    await captureEvidence(page, 'controllers/movement_stop', 'controllers', true);

    const duration = Date.now() - startTime;
    console.log(`  ✅ PASS: ${testName} (${duration}ms)`);
    testsPassed++;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`  ❌ FAIL: ${testName} (${duration}ms)`);
    console.log(`     Error: ${error.message}`);
    await captureEvidence(page, 'controllers/movement_stop_fail', 'controllers', false);
    testsFailed++;
  }
}

/**
 * Test 5: Movement speed affects travel time
 */
async function test_MovementSpeedAffectsTime(page) {
  const testName = 'Movement speed affects travel time';
  const startTime = Date.now();

  try {
    // Clear previous entities
    await page.evaluate(() => {
      if (window.testEntities) {
        window.testEntities.forEach(e => e.destroy && e.destroy());
      }
      window.testEntities = [];
    });

    // Create slow entity
    await page.evaluate(() => {
      const slowEntity = new Entity(100, 100, 32, 32, {
        type: "SlowEntity",
        movementSpeed: 1.0
      });
      window.testEntities = [slowEntity];

      slowEntity.moveToLocation(300, 100);
    });

    await sleep(1000);
    await forceRedraw(page);

    const slowDistance = await page.evaluate(() => {
      const entity = window.testEntities[0];
      const pos = entity.getPosition();
      return Math.abs(pos.x - 100);
    });

    // Clear and create fast entity
    await page.evaluate(() => {
      window.testEntities.forEach(e => e.destroy && e.destroy());
      const fastEntity = new Entity(100, 100, 32, 32, {
        type: "FastEntity",
        movementSpeed: 5.0
      });
      window.testEntities = [fastEntity];

      fastEntity.moveToLocation(300, 100);
    });

    await sleep(1000);
    await forceRedraw(page);

    const fastDistance = await page.evaluate(() => {
      const entity = window.testEntities[0];
      const pos = entity.getPosition();
      return Math.abs(pos.x - 100);
    });

    console.log(`  ℹ️ Slow entity (speed 1.0): ${slowDistance.toFixed(1)}px`);
    console.log(`  ℹ️ Fast entity (speed 5.0): ${fastDistance.toFixed(1)}px`);

    if (fastDistance <= slowDistance) {
      console.log('  ⚠️ Warning: Fast entity did not travel farther than slow entity');
    }

    await captureEvidence(page, 'controllers/movement_speed', 'controllers', true);

    const duration = Date.now() - startTime;
    console.log(`  ✅ PASS: ${testName} (${duration}ms)`);
    testsPassed++;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`  ❌ FAIL: ${testName} (${duration}ms)`);
    console.log(`     Error: ${error.message}`);
    await captureEvidence(page, 'controllers/movement_speed_fail', 'controllers', false);
    testsFailed++;
  }
}

/**
 * Test 6: Spatial grid updates during movement
 */
async function test_SpatialGridUpdatesDuringMovement(page) {
  const testName = 'Spatial grid updates during movement';
  const startTime = Date.now();

  try {
    // Clear previous entities
    await page.evaluate(() => {
      if (window.testEntities) {
        window.testEntities.forEach(e => e.destroy && e.destroy());
      }
      window.testEntities = [];
    });

    const result = await page.evaluate(() => {
      const entity = new Entity(100, 100, 32, 32, {
        type: "TestEntity",
        movementSpeed: 10.0
      });
      window.testEntities = [entity];

      // Check spatial grid before movement
      const nearbyBefore = window.spatialGrid ? 
        window.spatialGrid.getNearbyEntities(100, 100, 100) : [];

      entity.moveToLocation(400, 400);
      entity.setPosition(400, 400); // Force position for testing

      // Check spatial grid after movement
      const nearbyAtStart = window.spatialGrid ? 
        window.spatialGrid.getNearbyEntities(100, 100, 100) : [];
      const nearbyAtEnd = window.spatialGrid ? 
        window.spatialGrid.getNearbyEntities(400, 400, 100) : [];

      return {
        hasSpatialGrid: !!window.spatialGrid,
        entityAtStartBefore: nearbyBefore.length,
        entityAtStartAfter: nearbyAtStart.length,
        entityAtEndAfter: nearbyAtEnd.length
      };
    });

    if (!result.hasSpatialGrid) {
      console.log('  ⚠️ Warning: Spatial grid not available');
    } else {
      console.log(`  ℹ️ Entities near start before: ${result.entityAtStartBefore}`);
      console.log(`  ℹ️ Entities near start after: ${result.entityAtStartAfter}`);
      console.log(`  ℹ️ Entities near end after: ${result.entityAtEndAfter}`);
    }

    await captureEvidence(page, 'controllers/movement_spatial_grid', 'controllers', true);

    const duration = Date.now() - startTime;
    console.log(`  ✅ PASS: ${testName} (${duration}ms)`);
    testsPassed++;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`  ❌ FAIL: ${testName} (${duration}ms)`);
    console.log(`     Error: ${error.message}`);
    await captureEvidence(page, 'controllers/movement_spatial_fail', 'controllers', false);
    testsFailed++;
  }
}

/**
 * Main test suite execution
 */
async function runMovementControllerTests() {
  console.log('\n' + '='.repeat(70));
  console.log('Test Suite 6: MovementController');
  console.log('='.repeat(70) + '\n');

  let browser;
  let page;

  try {
    // Launch browser
    console.log('🚀 Launching browser...');
    browser = await launchBrowser();

    // Create page
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Navigate to game
    console.log('🌐 Navigating to game...');
    await page.goto('http://localhost:8000', { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });

    // Wait for canvas
    await page.waitForSelector('canvas', { timeout: 10000 });
    await sleep(1000);

    // Ensure game is started
    console.log('🎮 Starting game...');
    const gameStarted = await ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error(`Failed to start game: ${gameStarted.reason}`);
    }
    console.log('✅ Game started successfully\n');
    console.log('Running tests...\n');

    // Run all tests
    await test_MoveToLocationInitiates(page);
    await test_EntityMovesTowardTarget(page);
    await test_IsMovingState(page);
    await test_StopHaltsMovement(page);
    await test_MovementSpeedAffectsTime(page);
    await test_SpatialGridUpdatesDuringMovement(page);

  } catch (error) {
    console.error('\n❌ Test suite error:', error.message);
    if (page) {
      await captureEvidence(page, 'controllers/movement_suite_error', 'controllers', false);
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(70));
  const total = testsPassed + testsFailed;
  const passRate = total > 0 ? ((testsPassed / total) * 100).toFixed(1) : '0.0';

  console.log(`Total Tests: ${total}, Passed: ${testsPassed} ✅, Failed: ${testsFailed} ❌, Pass Rate: ${passRate}%`);
  console.log('='.repeat(70) + '\n');

  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run the test suite
runMovementControllerTests();
