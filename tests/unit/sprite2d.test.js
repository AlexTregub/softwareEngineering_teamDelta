// Test Suite for Sprite2D Class
// Run with: node test/sprite2d.test.js

// Mock global variables and dependencies
global.createVector = (x, y) => ({ 
  x: x || 0, 
  y: y || 0, 
  copy: function() { return { x: this.x, y: this.y, copy: this.copy }; }
});

// Mock p5.js rendering functions
global.push = () => {};
global.pop = () => {};
global.translate = (x, y) => {};
global.rotate = (angle) => {};
global.radians = (degrees) => degrees * (Math.PI / 180);
global.imageMode = (mode) => {};
global.image = (img, x, y, width, height) => {};
global.CENTER = 'center';

// Import the Sprite2D class
const Sprite2D = require('../../src/core/systems/Sprite2d.js');

class TestSuite {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, testFunction) {
    this.tests.push({ name, testFunction });
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(`Assertion failed: ${message}. Expected: ${expected}, Actual: ${actual}`);
    }
  }

  assertTrue(condition, message) {
    this.assert(condition === true, message);
  }

  assertFalse(condition, message) {
    this.assert(condition === false, message);
  }

  assertVectorEqual(actual, expected, message) {
    if (actual.x !== expected.x || actual.y !== expected.y) {
      throw new Error(`Assertion failed: ${message}. Expected: (${expected.x}, ${expected.y}), Actual: (${actual.x}, ${actual.y})`);
    }
  }

  assertNotEqual(actual, expected, message) {
    if (actual === expected) {
      throw new Error(`Assertion failed: ${message}. Expected values to be different, but both were: ${actual}`);
    }
  }

  run() {
    console.log('🖼️  Running Sprite2D Test Suite...\n');
    
    for (const { name, testFunction } of this.tests) {
      try {
        testFunction();
        console.log(`✅ ${name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${name}: ${error.message}`);
        this.failed++;
      }
    }

    console.log(`\n📊 Test Results: ${this.passed} passed, ${this.failed} failed`);
    if (this.failed === 0) {
      console.log('🎉 All tests passed!');
    }
    
    return this.failed === 0;
  }
}

// Test Suite
const suite = new TestSuite();

// --- Constructor Tests ---
suite.test('Constructor - Basic initialization', () => {
  const mockImg = { src: 'test-image.png' };
  const pos = createVector(10, 20);
  const size = createVector(30, 40);
  const rotation = 45;
  
  const sprite = new Sprite2D(mockImg, pos, size, rotation);
  
  suite.assertEqual(sprite.img, mockImg, 'Image should be set correctly');
  suite.assertVectorEqual(sprite.pos, { x: 10, y: 20 }, 'Position should be set correctly');
  suite.assertVectorEqual(sprite.size, { x: 30, y: 40 }, 'Size should be set correctly');
  suite.assertEqual(sprite.rotation, 45, 'Rotation should be set correctly');
});

suite.test('Constructor - Default rotation', () => {
  const mockImg = { src: 'test-image.png' };
  const pos = createVector(0, 0);
  const size = createVector(50, 50);
  
  const sprite = new Sprite2D(mockImg, pos, size);
  
  suite.assertEqual(sprite.rotation, 0, 'Default rotation should be 0');
});

suite.test('Constructor - Vector copying', () => {
  const mockImg = { src: 'test-image.png' };
  const originalPos = createVector(100, 200);
  const originalSize = createVector(60, 80);
  
  const sprite = new Sprite2D(mockImg, originalPos, originalSize);
  
  // Modify original vectors
  originalPos.x = 999;
  originalPos.y = 999;
  originalSize.x = 999;
  originalSize.y = 999;
  
  // Sprite should have copied values, not references
  suite.assertVectorEqual(sprite.pos, { x: 100, y: 200 }, 'Position should be copied, not referenced');
  suite.assertVectorEqual(sprite.size, { x: 60, y: 80 }, 'Size should be copied, not referenced');
});

suite.test('Constructor - Plain object vectors', () => {
  const mockImg = { src: 'test-image.png' };
  const pos = { x: 15, y: 25 }; // Plain object without copy method
  const size = { x: 35, y: 45 };
  
  const sprite = new Sprite2D(mockImg, pos, size);
  
  suite.assertVectorEqual(sprite.pos, { x: 15, y: 25 }, 'Should handle plain object position');
  suite.assertVectorEqual(sprite.size, { x: 35, y: 45 }, 'Should handle plain object size');
});

// --- Setter Method Tests ---
suite.test('setImage method', () => {
  const mockImg1 = { src: 'image1.png' };
  const mockImg2 = { src: 'image2.png' };
  const sprite = new Sprite2D(mockImg1, createVector(0, 0), createVector(50, 50));
  
  sprite.setImage(mockImg2);
  
  suite.assertEqual(sprite.img, mockImg2, 'Image should be updated');
});

suite.test('setPosition method - with copy', () => {
  const sprite = new Sprite2D({ src: 'test.png' }, createVector(0, 0), createVector(50, 50));
  const newPos = createVector(100, 150);
  
  sprite.setPosition(newPos);
  
  suite.assertVectorEqual(sprite.pos, { x: 100, y: 150 }, 'Position should be updated');
  
  // Verify it was copied, not referenced
  newPos.x = 999;
  suite.assertVectorEqual(sprite.pos, { x: 100, y: 150 }, 'Position should be copied, not referenced');
});

suite.test('setPosition method - plain object', () => {
  const sprite = new Sprite2D({ src: 'test.png' }, createVector(0, 0), createVector(50, 50));
  const newPos = { x: 200, y: 250 };
  
  sprite.setPosition(newPos);
  
  suite.assertVectorEqual(sprite.pos, { x: 200, y: 250 }, 'Should handle plain object position');
});

suite.test('setSize method - with copy', () => {
  const sprite = new Sprite2D({ src: 'test.png' }, createVector(0, 0), createVector(50, 50));
  const newSize = createVector(80, 120);
  
  sprite.setSize(newSize);
  
  suite.assertVectorEqual(sprite.size, { x: 80, y: 120 }, 'Size should be updated');
  
  // Verify it was copied, not referenced
  newSize.x = 999;
  suite.assertVectorEqual(sprite.size, { x: 80, y: 120 }, 'Size should be copied, not referenced');
});

suite.test('setSize method - plain object', () => {
  const sprite = new Sprite2D({ src: 'test.png' }, createVector(0, 0), createVector(50, 50));
  const newSize = { x: 90, y: 110 };
  
  sprite.setSize(newSize);
  
  suite.assertVectorEqual(sprite.size, { x: 90, y: 110 }, 'Should handle plain object size');
});

suite.test('setRotation method', () => {
  const sprite = new Sprite2D({ src: 'test.png' }, createVector(0, 0), createVector(50, 50));
  
  sprite.setRotation(90);
  suite.assertEqual(sprite.rotation, 90, 'Rotation should be updated to 90');
  
  sprite.setRotation(-45);
  suite.assertEqual(sprite.rotation, -45, 'Rotation should handle negative values');
  
  sprite.setRotation(0);
  suite.assertEqual(sprite.rotation, 0, 'Rotation should be reset to 0');
});

// --- Render Method Tests ---
suite.test('render method - executes without error', () => {
  const sprite = new Sprite2D({ src: 'test.png' }, createVector(10, 20), createVector(50, 60), 30);
  
  // Track function calls
  let pushCalled = false;
  let popCalled = false;
  let translateCalled = false;
  let rotateCalled = false;
  let imageCalled = false;
  let imageModeSet = false;
  
  // Override globals to track calls
  global.push = () => { pushCalled = true; };
  global.pop = () => { popCalled = true; };
  global.translate = (x, y) => { 
    translateCalled = true;
    // Should translate to center of sprite (pos + size/2)
    suite.assertEqual(x, 35, 'Translate X should be pos.x + size.x/2'); // 10 + 50/2 = 35
    suite.assertEqual(y, 50, 'Translate Y should be pos.y + size.y/2'); // 20 + 60/2 = 50
  };
  global.rotate = (angle) => { 
    rotateCalled = true;
    // Should convert degrees to radians
    const expectedRadians = 30 * (Math.PI / 180);
    suite.assertEqual(angle, expectedRadians, 'Should rotate by angle in radians');
  };
  global.image = (img, x, y, width, height) => { 
    imageCalled = true;
    suite.assertEqual(img, sprite.img, 'Should draw the correct image');
    suite.assertEqual(x, 0, 'Image X should be 0 (centered)');
    suite.assertEqual(y, 0, 'Image Y should be 0 (centered)');
    suite.assertEqual(width, 50, 'Image width should match sprite size');
    suite.assertEqual(height, 60, 'Image height should match sprite size');
  };
  global.imageMode = (mode) => { 
    imageModeSet = true;
    suite.assertEqual(mode, 'center', 'Should set image mode to CENTER');
  };
  
  sprite.render();
  
  suite.assertTrue(pushCalled, 'push() should be called');
  suite.assertTrue(popCalled, 'pop() should be called');
  suite.assertTrue(translateCalled, 'translate() should be called');
  suite.assertTrue(rotateCalled, 'rotate() should be called');
  suite.assertTrue(imageCalled, 'image() should be called');
  suite.assertTrue(imageModeSet, 'imageMode() should be called');
});

suite.test('render method - zero rotation', () => {
  const sprite = new Sprite2D({ src: 'test.png' }, createVector(0, 0), createVector(40, 40), 0);
  
  let rotateAngle = null;
  // Reset all render functions to prevent interference from previous test
  global.push = () => {};
  global.pop = () => {};
  global.translate = (x, y) => {};
  global.rotate = (angle) => { rotateAngle = angle; };
  global.imageMode = () => {};
  global.image = () => {};
  
  sprite.render();
  
  suite.assertEqual(rotateAngle, 0, 'Should rotate by 0 radians when rotation is 0');
});

// --- Edge Cases and Error Handling ---
suite.test('Constructor - null/undefined handling', () => {
  const mockImg = { src: 'test.png' };
  
  // Test with minimal valid inputs
  try {
    const sprite1 = new Sprite2D(mockImg, { x: 0, y: 0 }, { x: 10, y: 10 });
    suite.assertTrue(true, 'Should handle minimal valid inputs');
  } catch (error) {
    suite.assertTrue(false, `Should not throw error with valid inputs: ${error.message}`);
  }
});

suite.test('Property immutability through setters', () => {
  const sprite = new Sprite2D({ src: 'test.png' }, createVector(10, 20), createVector(30, 40));
  const originalPos = sprite.pos;
  const originalSize = sprite.size;
  
  sprite.setPosition(createVector(100, 200));
  sprite.setSize(createVector(50, 60));
  
  // Original references should be different (new objects created)
  suite.assertNotEqual(sprite.pos, originalPos, 'setPosition should create new position object');
  suite.assertNotEqual(sprite.size, originalSize, 'setSize should create new size object');
});

// --- Integration Tests ---
suite.test('Full sprite lifecycle', () => {
  const mockImg1 = { src: 'initial.png' };
  const mockImg2 = { src: 'updated.png' };
  
  // Create sprite
  const sprite = new Sprite2D(mockImg1, createVector(0, 0), createVector(32, 32));
  
  // Update all properties
  sprite.setImage(mockImg2);
  sprite.setPosition(createVector(100, 150));
  sprite.setSize(createVector(64, 48));
  sprite.setRotation(45);
  
  // Verify final state
  suite.assertEqual(sprite.img, mockImg2, 'Image should be updated');
  suite.assertVectorEqual(sprite.pos, { x: 100, y: 150 }, 'Position should be updated');
  suite.assertVectorEqual(sprite.size, { x: 64, y: 48 }, 'Size should be updated');
  suite.assertEqual(sprite.rotation, 45, 'Rotation should be updated');
  
  // Verify render works with updated state
  try {
    // Reset render functions to prevent interference
    global.push = () => {};
    global.pop = () => {};
    global.translate = () => {};
    global.rotate = () => {};
    global.imageMode = () => {};
    global.image = () => {};
    
    sprite.render();
    suite.assertTrue(true, 'Render should work after property updates');
  } catch (error) {
    suite.assertTrue(false, `Render should not throw after updates: ${error.message}`);
  }
});

suite.test('Vector method compatibility', () => {
  // Test with objects that have copy methods (like p5.Vector)
  const posWithCopy = { x: 10, y: 20, copy: function() { return { x: this.x, y: this.y, copy: this.copy }; }};
  const sizeWithCopy = { x: 30, y: 40, copy: function() { return { x: this.x, y: this.y, copy: this.copy }; }};
  
  const sprite = new Sprite2D({ src: 'test.png' }, posWithCopy, sizeWithCopy);
  
  suite.assertVectorEqual(sprite.pos, { x: 10, y: 20 }, 'Should handle vectors with copy method');
  suite.assertVectorEqual(sprite.size, { x: 30, y: 40 }, 'Should handle vectors with copy method');
  
  // Test with plain objects (no copy method)
  const plainPos = { x: 50, y: 60 };
  const plainSize = { x: 70, y: 80 };
  
  sprite.setPosition(plainPos);
  sprite.setSize(plainSize);
  
  suite.assertVectorEqual(sprite.pos, { x: 50, y: 60 }, 'Should handle plain objects');
  suite.assertVectorEqual(sprite.size, { x: 70, y: 80 }, 'Should handle plain objects');
});

// --- Performance and Memory Tests ---
suite.test('Memory efficiency - object creation', () => {
  const mockImg = { src: 'test.png' };
  const sprites = [];
  
  // Create multiple sprites to test for memory leaks or issues
  for (let i = 0; i < 100; i++) {
    sprites.push(new Sprite2D(mockImg, createVector(i, i), createVector(20, 20), i));
  }
  
  suite.assertEqual(sprites.length, 100, 'Should create 100 sprites without error');
  
  // Verify each sprite has independent properties
  sprites[0].setPosition(createVector(999, 999));
  suite.assertVectorEqual(sprites[1].pos, { x: 1, y: 1 }, 'Sprites should have independent positions');
});

// Register with global test runner and run conditionally
if (typeof globalThis !== 'undefined' && globalThis.registerTest) {
  globalThis.registerTest('Sprite2D Tests', () => {
    const success = suite.run();
    return success;
  });
}

// Auto-run if tests are enabled
if (typeof globalThis !== 'undefined' && globalThis.shouldRunTests && globalThis.shouldRunTests()) {
  console.log('🧪 Running Sprite2D tests...');
  const success = suite.run();
  if (typeof process !== 'undefined') {
    process.exit(success ? 0 : 1);
  }
} else if (typeof globalThis !== 'undefined' && globalThis.shouldRunTests) {
  console.log('🧪 Sprite2D tests available but disabled. Use enableTests() to enable or runTests() to run manually.');
} else {
  // Fallback: Run all tests
  if (require.main === module) {
    const success = suite.run();
    process.exit(success ? 0 : 1);
  }
}

module.exports = { TestSuite, Sprite2D };