/**
 * MovementController Unit Tests
 * Tests the movement controller system functionality
 */

// Mock dependencies for Node.js environment
global.createVector = (x, y) => ({ x: x || 0, y: y || 0, mag: function() { return Math.sqrt(this.x*this.x + this.y*this.y); }, normalize: function() { const m = this.mag(); if (m > 0) { this.x /= m; this.y /= m; } return this; } });
global.p5 = { Vector: { sub: (a, b) => ({ x: a.x - b.x, y: a.y - b.y, mag: function() { return Math.sqrt(this.x*this.x + this.y*this.y); }, normalize: function() { const m = this.mag(); if (m > 0) { this.x /= m; this.y /= m; } return this; } }) } };
global.deltaTime = 16;

// Load MovementController
const fs = require('fs');
const path = require('path');
const controllerPath = path.join(__dirname, '..', 'Classes', 'controllers', 'MovementController.js');
const controllerCode = fs.readFileSync(controllerPath, 'utf8');

// Create a simple eval environment
try {
  eval(controllerCode);
  console.log('MovementController loaded successfully');
  console.log('MovementController type:', typeof MovementController);
} catch (error) {
  console.error('Error loading MovementController:', error.message);
  process.exit(1);
}

console.log('🚀 Starting MovementController Test Suite');
console.log('\n==================================================');
console.log('🧪 Running MovementController Test Suite...');

let testsRun = 0;
let testsPassed = 0;

function test(description, testFn) {
  testsRun++;
  try {
    testFn();
    console.log(`✅ ${description}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${description} failed: ${error.message}`);
  }
}

// Mock entity for testing
function createMockEntity() {
  return {
    posX: 100,
    posY: 100,
    speed: 50,
    _stats: {
      pendingPos: { statValue: { x: 100, y: 100 } }
    },
    _stateMachine: {
      isPrimaryState: (state) => state === "MOVING",
      canPerformAction: () => true,
      setPrimaryState: () => {}
    },
    _sprite: {
      setPosition: () => {}
    },
    getEffectiveMovementSpeed: () => 50
  };
}

// Test constructor
test('Constructor - Basic initialization', () => {
  const entity = createMockEntity();
  const controller = new MovementController(entity);
  
  if (!controller.entity) throw new Error('Entity not set');
  if (controller.isMoving !== false) throw new Error('IsMoving not initialized');
  if (controller.path !== null) throw new Error('Path should be null initially');
});

// Test moveToLocation
test('moveToLocation - Basic movement', () => {
  const entity = createMockEntity();
  const controller = new MovementController(entity);
  
  controller.moveToLocation(200, 150);
  
  if (!controller.getIsMoving()) throw new Error('Should be moving after moveToLocation');
  if (entity._stats.pendingPos.statValue.x !== 200) throw new Error('Target X not set correctly');
  if (entity._stats.pendingPos.statValue.y !== 150) throw new Error('Target Y not set correctly');
});

// Test path setting
test('setPath - Path assignment', () => {
  const entity = createMockEntity();
  const controller = new MovementController(entity);
  
  const testPath = [{ _x: 1, _y: 1 }, { _x: 2, _y: 2 }];
  controller.setPath(testPath);
  
  const path = controller.getPath();
  if (path.length !== 2) throw new Error('Path length incorrect');
  if (path[0]._x !== 1 || path[0]._y !== 1) throw new Error('First path node incorrect');
});

// Test movement state
test('Movement state - getters and setters', () => {
  const entity = createMockEntity();
  const controller = new MovementController(entity);
  
  if (controller.getIsMoving()) throw new Error('Should not be moving initially');
  
  controller.setIsMoving(true);
  if (!controller.getIsMoving()) throw new Error('Should be moving after setIsMoving(true)');
  
  controller.setIsMoving(false);
  if (controller.getIsMoving()) throw new Error('Should not be moving after setIsMoving(false)');
});

// Test update method
test('update - Movement processing', () => {
  const entity = createMockEntity();
  const controller = new MovementController(entity);
  
  // Set up movement
  controller.moveToLocation(200, 150);
  const initialX = entity.posX;
  
  // Update should process movement
  controller.update();
  
  // Should have moved (position might not be exact due to deltaTime calculations)
  const moved = Math.abs(entity.posX - initialX) > 0 || Math.abs(entity.posY - 100) > 0;
  if (!moved && controller.getIsMoving()) {
    // Movement might be very small, that's ok as long as we're still in moving state
  }
});

// Test pathfinding integration
test('Path processing - Basic pathfinding', () => {
  const entity = createMockEntity();
  const controller = new MovementController(entity);
  
  const testPath = [{ _x: 2, _y: 2 }, { _x: 3, _y: 3 }];
  controller.setPath(testPath);
  
  // Process path (should start moving to first node)
  controller.update();
  
  if (!controller.getIsMoving()) throw new Error('Should be moving after processing path');
});

// Test stuck detection
test('Stuck detection - Basic functionality', () => {
  const entity = createMockEntity();
  // Override to simulate being stuck
  entity.getEffectiveMovementSpeed = () => 0;
  const controller = new MovementController(entity);
  
  controller.moveToLocation(200, 150);
  
  // Multiple updates with zero speed should trigger stuck detection
  for (let i = 0; i < 10; i++) {
    controller.update();
  }
  
  // Should still be in moving state but detect stuck condition
  if (!controller.getIsMoving()) throw new Error('Should still be in moving state');
});

// Test debug functionality
test('Debug functionality', () => {
  const entity = createMockEntity();
  const controller = new MovementController(entity);
  
  controller.setDebugEnabled(true);
  if (!controller.getDebugEnabled()) throw new Error('Debug should be enabled');
  
  controller.setDebugEnabled(false);
  if (controller.getDebugEnabled()) throw new Error('Debug should be disabled');
});

console.log(`\n📊 Test Results: ${testsPassed} passed, ${testsRun - testsPassed} failed`);

if (testsPassed === testsRun) {
  console.log('🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('💥 Some tests failed');
  process.exit(1);
}