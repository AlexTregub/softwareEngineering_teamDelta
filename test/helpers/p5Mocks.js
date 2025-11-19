/**
 * @fileoverview p5.js Mock Helper - Centralized p5.js mocking for tests
 * Import this to avoid duplicate mock setup across test files
 * 
 * Benefits:
 * - Eliminates 30-40 lines of duplicate mock code per test file
 * - Consistent p5.js mocking across all tests
 * - Easy to extend with new p5 functions
 * - Automatic stub reset between tests
 * 
 * Usage:
 *   const { setupP5Mocks, resetP5Mocks } = require('../helpers/p5Mocks');
 *   
 *   // At top of test file (before describe)
 *   setupP5Mocks();
 *   
 *   beforeEach(function() {
 *     resetP5Mocks(); // Reset call history
 *   });
 * 
 * Advanced Usage:
 *   const { verifyP5Call, getP5Calls } = require('../helpers/p5Mocks');
 *   
 *   // Verify specific function call
 *   expect(verifyP5Call('rect', [100, 200, 32, 32])).to.be.true;
 *   
 *   // Get all calls to a function
 *   const rectCalls = getP5Calls('rect');
 *   expect(rectCalls).to.have.lengthOf(2);
 * 
 * @author Software Engineering Team Delta
 * @version 1.0.0
 */

const sinon = require('sinon');

/**
 * Complete p5.js drawing functions mock
 * Includes all common p5 drawing, color, and transform functions
 */
const mockDrawingFunctions = {
  // Core drawing
  rect: sinon.stub(),
  ellipse: sinon.stub(),
  circle: sinon.stub(),
  line: sinon.stub(),
  point: sinon.stub(),
  triangle: sinon.stub(),
  quad: sinon.stub(),
  arc: sinon.stub(),
  
  // Text
  text: sinon.stub(),
  textSize: sinon.stub(),
  textAlign: sinon.stub(),
  textFont: sinon.stub(),
  
  // Color
  fill: sinon.stub(),
  noFill: sinon.stub(),
  stroke: sinon.stub(),
  noStroke: sinon.stub(),
  strokeWeight: sinon.stub(),
  background: sinon.stub(),
  
  // Transform
  push: sinon.stub(),
  pop: sinon.stub(),
  translate: sinon.stub(),
  rotate: sinon.stub(),
  scale: sinon.stub(),
  
  // Image
  image: sinon.stub(),
  tint: sinon.stub(),
  noTint: sinon.stub(),
  
  // Rendering quality
  smooth: sinon.stub(),
  noSmooth: sinon.stub(),
  
  // Math
  abs: Math.abs,
  ceil: Math.ceil,
  floor: Math.floor,
  round: Math.round,
  sqrt: Math.sqrt,
  pow: Math.pow,
  min: Math.min,
  max: Math.max,
  map: sinon.stub().callsFake((value, start1, stop1, start2, stop2) => {
    return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
  }),
  constrain: sinon.stub().callsFake((value, min, max) => {
    return Math.max(min, Math.min(max, value));
  }),
  lerp: sinon.stub().callsFake((start, stop, amt) => {
    return start + (stop - start) * amt;
  }),
  
  // Constants
  TWO_PI: Math.PI * 2,
  PI: Math.PI,
  HALF_PI: Math.PI / 2,
  QUARTER_PI: Math.PI / 4,
  
  // Color mode
  RGB: 'rgb',
  HSB: 'hsb',
  colorMode: sinon.stub(),
  
  // Blend modes
  BLEND: 'blend',
  ADD: 'add',
  MULTIPLY: 'multiply',
  blendMode: sinon.stub(),
  
  // Shape modes
  CENTER: 'center',
  CORNER: 'corner',
  CORNERS: 'corners',
  RADIUS: 'radius',
  rectMode: sinon.stub(),
  ellipseMode: sinon.stub(),
  imageMode: sinon.stub(),
  
  // Text alignment
  LEFT: 'left',
  RIGHT: 'right',
  TOP: 'top',
  BOTTOM: 'bottom',
  BASELINE: 'baseline',
  
  // Rendering
  redraw: sinon.stub(),
  noLoop: sinon.stub(),
  loop: sinon.stub(),
  
  // Time
  millis: sinon.stub().returns(Date.now()),
  frameCount: 0,
  deltaTime: 16,
  
  // Input
  mouseX: 0,
  mouseY: 0,
  pmouseX: 0,
  pmouseY: 0,
  mouseIsPressed: false,
  keyIsPressed: false,
  key: '',
  keyCode: 0,
  
  // Canvas
  width: 800,
  height: 600,
  createCanvas: sinon.stub(),
  resizeCanvas: sinon.stub()
};

/**
 * Mock p5.Vector class
 */
class MockP5Vector {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  
  set(x, y, z) {
    if (x instanceof MockP5Vector) {
      this.x = x.x;
      this.y = x.y;
      this.z = x.z;
    } else {
      this.x = x || 0;
      this.y = y || 0;
      this.z = z || 0;
    }
    return this;
  }
  
  copy() {
    return new MockP5Vector(this.x, this.y, this.z);
  }
  
  add(x, y, z) {
    if (x instanceof MockP5Vector) {
      this.x += x.x;
      this.y += x.y;
      this.z += x.z;
    } else {
      this.x += x || 0;
      this.y += y || 0;
      this.z += z || 0;
    }
    return this;
  }
  
  sub(x, y, z) {
    if (x instanceof MockP5Vector) {
      this.x -= x.x;
      this.y -= x.y;
      this.z -= x.z;
    } else {
      this.x -= x || 0;
      this.y -= y || 0;
      this.z -= z || 0;
    }
    return this;
  }
  
  mult(n) {
    this.x *= n;
    this.y *= n;
    this.z *= n;
    return this;
  }
  
  div(n) {
    this.x /= n;
    this.y /= n;
    this.z /= n;
    return this;
  }
  
  mag() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }
  
  normalize() {
    const m = this.mag();
    if (m !== 0) {
      this.div(m);
    }
    return this;
  }
  
  limit(max) {
    if (this.mag() > max) {
      this.normalize();
      this.mult(max);
    }
    return this;
  }
  
  dist(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    const dz = this.z - v.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  
  static dist(v1, v2) {
    return v1.dist(v2);
  }
  
  static add(v1, v2) {
    return new MockP5Vector(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z);
  }
  
  static sub(v1, v2) {
    return new MockP5Vector(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z);
  }
}

/**
 * Mock p5.Image class
 */
class MockP5Image {
  constructor(width = 100, height = 100) {
    this.width = width;
    this.height = height;
    this.pixels = [];
  }
  
  loadPixels() {}
  updatePixels() {}
  get(x, y) { return [0, 0, 0, 255]; }
  set(x, y, c) {}
  resize(width, height) {
    this.width = width;
    this.height = height;
  }
  copy(...args) {}
  mask(img) {}
  filter(type, value) {}
}

/**
 * Mock createVector function
 */
function createVector(x = 0, y = 0, z = 0) {
  return new MockP5Vector(x, y, z);
}

/**
 * Mock loadImage function
 */
function loadImage(path, callback) {
  const img = new MockP5Image();
  if (callback) {
    setTimeout(() => callback(img), 0);
  }
  return img;
}

/**
 * Complete p5 object mock
 */
const mockP5 = {
  ...mockDrawingFunctions,
  Vector: MockP5Vector,
  Image: MockP5Image,
  createVector,
  loadImage,
  
  // Color functions
  color: sinon.stub().callsFake((...args) => {
    return { r: args[0] || 0, g: args[1] || 0, b: args[2] || 0, a: args[3] || 255 };
  }),
  red: sinon.stub().returns(255),
  green: sinon.stub().returns(0),
  blue: sinon.stub().returns(0),
  alpha: sinon.stub().returns(255),
  
  // Random
  random: sinon.stub().callsFake((...args) => {
    if (args.length === 0) return Math.random();
    if (args.length === 1) return Math.random() * args[0];
    return args[0] + Math.random() * (args[1] - args[0]);
  }),
  randomSeed: sinon.stub(),
  noise: sinon.stub().returns(0.5),
  noiseSeed: sinon.stub()
};

/**
 * Setup all p5.js mocks in global scope
 * Call this in your test's before() hook
 */
function setupP5Mocks() {
  // Ensure global and window are synchronized
  if (typeof global !== 'undefined') {
    global.window = global.window || {};
    
    // Copy all mock properties to global
    Object.keys(mockP5).forEach(key => {
      global[key] = mockP5[key];
      global.window[key] = mockP5[key];
    });
    
    // Set p5 global
    global.p5 = mockP5;
    global.window.p5 = mockP5;
    
    // Setup logging functions
    global.console.log = sinon.stub();
    global.logQuiet = sinon.stub();
    global.logVerbose = sinon.stub();
    global.logWarn = sinon.stub();
    global.logError = sinon.stub();
    
    global.window.console.log = global.console.log;
    global.window.logQuiet = global.logQuiet;
    global.window.logVerbose = global.logVerbose;
    global.window.logWarn = global.logWarn;
    global.window.logError = global.logError;
  }
}

/**
 * Reset all p5.js stub call history
 * Call this in your test's beforeEach() or afterEach() hook
 */
function resetP5Mocks() {
  Object.keys(mockDrawingFunctions).forEach(key => {
    if (mockDrawingFunctions[key] && typeof mockDrawingFunctions[key].resetHistory === 'function') {
      mockDrawingFunctions[key].resetHistory();
    }
  });
  
  // Reset other stubs
  if (mockP5.color.resetHistory) mockP5.color.resetHistory();
  if (mockP5.random.resetHistory) mockP5.random.resetHistory();
  if (mockP5.loadImage.resetHistory) mockP5.loadImage.resetHistory();
}

/**
 * Verify p5 drawing function was called with specific arguments
 * @param {string} fnName - Function name (e.g., 'rect', 'ellipse')
 * @param {Array} expectedArgs - Expected arguments
 * @returns {boolean} True if function was called with those args
 */
function verifyP5Call(fnName, expectedArgs) {
  const fn = mockP5[fnName];
  if (!fn || !fn.getCalls) return false;
  
  return fn.getCalls().some(call => {
    if (call.args.length !== expectedArgs.length) return false;
    return call.args.every((arg, i) => arg === expectedArgs[i]);
  });
}

/**
 * Get all calls to a p5 drawing function
 * @param {string} fnName - Function name
 * @returns {Array} Array of call objects with args
 */
function getP5Calls(fnName) {
  const fn = mockP5[fnName];
  if (!fn || !fn.getCalls) return [];
  return fn.getCalls().map(call => ({ args: call.args }));
}

// Export all utilities
module.exports = {
  // Main functions
  setupP5Mocks,
  resetP5Mocks,
  
  // Mock objects
  mockP5,
  mockDrawingFunctions,
  MockP5Vector,
  MockP5Image,
  
  // Helper functions
  createVector,
  loadImage,
  verifyP5Call,
  getP5Calls
};
