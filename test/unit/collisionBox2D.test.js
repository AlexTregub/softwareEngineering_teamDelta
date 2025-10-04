/**
 * @fileoverview Test suite for CollisionBox2D class
 * Tests geometric operations, collision detection, and utility methods.
 * 
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 */

// Load dependencies
global.CollisionBox2D = require('../Classes/systems/CollisionBox2D.js');

// Simple test framework
const testSuite = {
  tests: [],
  passed: 0,
  failed: 0,
  
  test(name, fn) {
    this.tests.push({ name, fn });
  },
  
  assertTrue(condition, message = '') {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  },
  
  assertEqual(actual, expected, message = '') {
    if (actual !== expected) {
      throw new Error(`Assertion failed: Expected "${expected}", got "${actual}". ${message}`);
    }
  },
  
  assertAlmostEqual(actual, expected, tolerance = 0.0001, message = '') {
    if (Math.abs(actual - expected) > tolerance) {
      throw new Error(`Assertion failed: Expected "${expected}", got "${actual}" (tolerance: ${tolerance}). ${message}`);
    }
  },
  
  run() {
    console.log('🧪 Running CollisionBox2D Test Suite...\n');
    
    for (const test of this.tests) {
      try {
        test.fn();
        console.log(`✅ ${test.name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${test.name}`);
        console.log(`   ${error.message}`);
        this.failed++;
      }
    }
    
    console.log(`\n📊 Test Results: ${this.passed} passed, ${this.failed} failed, ${this.tests.length} total`);
    
    if (this.failed > 0) {
      process.exit(1);
    }
  }
};

// Test: Constructor
testSuite.test("Constructor should initialize with correct values", () => {
  const box = new CollisionBox2D(10, 20, 100, 80);
  
  testSuite.assertEqual(box.x, 10);
  testSuite.assertEqual(box.y, 20);
  testSuite.assertEqual(box.width, 100);
  testSuite.assertEqual(box.height, 80);
});

// Test: Contains point
testSuite.test("contains should correctly detect point inside collision box", () => {
  const box = new CollisionBox2D(10, 10, 100, 100);
  
  // Points inside
  testSuite.assertTrue(box.contains(50, 50));
  testSuite.assertTrue(box.contains(10, 10));  // Corner
  testSuite.assertTrue(box.contains(109, 109)); // Near opposite corner
  
  // Points outside
  testSuite.assertTrue(!box.contains(5, 50));   // Left
  testSuite.assertTrue(!box.contains(115, 50)); // Right
  testSuite.assertTrue(!box.contains(50, 5));   // Above
  testSuite.assertTrue(!box.contains(50, 115)); // Below
});

// Test: Intersects with another collision box
testSuite.test("intersects should correctly detect collision box overlap", () => {
  const box1 = new CollisionBox2D(10, 10, 100, 100);
  const box2 = new CollisionBox2D(50, 50, 100, 100); // Overlapping
  const box3 = new CollisionBox2D(150, 150, 50, 50); // Non-overlapping
  
  testSuite.assertTrue(box1.intersects(box2));
  testSuite.assertTrue(box2.intersects(box1)); // Symmetric
  testSuite.assertTrue(!box1.intersects(box3));
  testSuite.assertTrue(!box3.intersects(box1)); // Symmetric
});

// Test: Get center
testSuite.test("getCenter should return correct center point", () => {
  const box = new CollisionBox2D(10, 20, 100, 80);
  const center = box.getCenter();
  
  testSuite.assertEqual(center.x, 60);  // 10 + 100/2
  testSuite.assertEqual(center.y, 60);  // 20 + 80/2
});

// Test: Get area
testSuite.test("getArea should return correct area", () => {
  const box = new CollisionBox2D(0, 0, 10, 20);
  testSuite.assertEqual(box.getArea(), 200);
});

// Test: Get perimeter
testSuite.test("getPerimeter should return correct perimeter", () => {
  const box = new CollisionBox2D(0, 0, 10, 20);
  testSuite.assertEqual(box.getPerimeter(), 60); // 2 * (10 + 20)
});

// Test: Scale collision box
testSuite.test("scale should resize collision box from center", () => {
  const box = new CollisionBox2D(10, 10, 100, 100);
  const scaled = box.scale(0.5);
  
  testSuite.assertEqual(scaled.width, 50);
  testSuite.assertEqual(scaled.height, 50);
  testSuite.assertEqual(scaled.x, 35);  // Centered on original
  testSuite.assertEqual(scaled.y, 35);
});

// Test: Translate collision box
testSuite.test("translate should move collision box by offset", () => {
  const box = new CollisionBox2D(10, 20, 100, 80);
  const result = box.translate(5, -10);
  
  // translate modifies original and returns it
  testSuite.assertEqual(box.x, 15);
  testSuite.assertEqual(box.y, 10);
  testSuite.assertEqual(box.width, 100); // Size unchanged
  testSuite.assertEqual(box.height, 80);
  testSuite.assertTrue(result === box); // Same object
});

// Test: Expand collision box
testSuite.test("expand should increase collision box size", () => {
  const box = new CollisionBox2D(10, 10, 100, 100);
  const expanded = box.expand(10);
  
  testSuite.assertEqual(expanded.x, 0);   // 10 - 10
  testSuite.assertEqual(expanded.y, 0);   // 10 - 10
  testSuite.assertEqual(expanded.width, 120);  // 100 + 2*10
  testSuite.assertEqual(expanded.height, 120);
});

// Test: CollisionBox2D containment
testSuite.test("containsRectangle should detect if one collision box contains another", () => {
  const outer = new CollisionBox2D(10, 10, 100, 100);
  const inner = new CollisionBox2D(20, 20, 50, 50);
  const separate = new CollisionBox2D(150, 150, 50, 50);
  
  testSuite.assertTrue(outer.containsRectangle(inner));
  testSuite.assertTrue(!outer.containsRectangle(separate));
  testSuite.assertTrue(!inner.containsRectangle(outer));
});

// Test: Distance to point
testSuite.test("distanceToPoint should calculate correct distance", () => {
  const box = new CollisionBox2D(10, 10, 20, 20); // Center at 20,20
  
  // Distance to center should be 0
  testSuite.assertAlmostEqual(box.distanceToPoint(20, 20), 0);
  
  // Distance to corner
  testSuite.assertAlmostEqual(box.distanceToPoint(10, 10), Math.sqrt(200));
});

// Test: Distance between collision boxes
testSuite.test("distanceToRectangle should calculate distance between centers", () => {
  const box1 = new CollisionBox2D(0, 0, 20, 20);   // Center at 10,10
  const box2 = new CollisionBox2D(30, 40, 20, 20); // Center at 40,50
  
  const expectedDistance = Math.sqrt((40-10)**2 + (50-10)**2);
  testSuite.assertAlmostEqual(box1.distanceToRectangle(box2), expectedDistance);
});

// Test: Static factory methods
testSuite.test("Static factory methods should create correct collision boxes", () => {
  // fromCorners
  const fromCorners = CollisionBox2D.fromCorners(10, 20, 60, 80);
  testSuite.assertEqual(fromCorners.x, 10);
  testSuite.assertEqual(fromCorners.y, 20);
  testSuite.assertEqual(fromCorners.width, 50);
  testSuite.assertEqual(fromCorners.height, 60);
  
  // fromCenter
  const fromCenter = CollisionBox2D.fromCenter(50, 50, 20, 30);
  testSuite.assertEqual(fromCenter.x, 40);
  testSuite.assertEqual(fromCenter.y, 35);
  testSuite.assertEqual(fromCenter.width, 20);
  testSuite.assertEqual(fromCenter.height, 30);
  
  // square
  const square = CollisionBox2D.square(10, 10, 25);
  testSuite.assertEqual(square.x, 10);
  testSuite.assertEqual(square.y, 10);
  testSuite.assertEqual(square.width, 25);
  testSuite.assertEqual(square.height, 25);
});

// Test: Edge cases
testSuite.test("Edge cases should be handled correctly", () => {
  // Zero-size collision box - boundary point is included
  const zeroBox = new CollisionBox2D(10, 10, 0, 0);
  testSuite.assertEqual(zeroBox.getArea(), 0);
  testSuite.assertTrue(zeroBox.contains(10, 10)); // Boundary is included
  testSuite.assertTrue(!zeroBox.contains(11, 11)); // Outside boundary
  
  // Very small collision box
  const smallBox = new CollisionBox2D(10, 10, 1, 1);
  testSuite.assertEqual(smallBox.getArea(), 1);
  testSuite.assertTrue(smallBox.contains(10, 10));
});

// Test: Mutating methods
testSuite.test("CollisionBox2D methods should modify the original (mutable pattern)", () => {
  const original = new CollisionBox2D(10, 10, 100, 100);
  const result = original.translate(5, 5);
  
  // translate modifies the original and returns same object
  testSuite.assertEqual(original.x, 15);
  testSuite.assertEqual(original.y, 15);
  testSuite.assertTrue(original === result); // Same object reference
  
  // Test clone for creating copies
  const original2 = new CollisionBox2D(20, 30, 50, 60);
  const cloned = original2.clone();
  testSuite.assertTrue(original2 !== cloned); // Different objects
  testSuite.assertEqual(cloned.x, 20);
  testSuite.assertEqual(cloned.y, 30);
});

// Run all tests
testSuite.run();