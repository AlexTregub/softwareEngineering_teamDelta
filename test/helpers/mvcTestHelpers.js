/**
 * MVC Test Helpers
 * ----------------
 * Reusable test setup utilities for MVC pattern tests.
 * 
 * Provides:
 * - JSDOM environment setup
 * - p5.js mock setup (globals and rendering functions)
 * - CollisionBox2D setup
 * - Sprite2D mock
 * - Common test utilities
 * 
 * Usage:
 * ```javascript
 * const { setupTestEnvironment, mockP5Rendering, mockSprite2D } = require('../helpers/mvcTestHelpers');
 * 
 * describe('MyTest', function() {
 *   setupTestEnvironment(); // Sets up JSDOM, p5.js globals, CollisionBox2D
 *   
 *   before(function() {
 *     MyClass = require('../../Classes/MyClass');
 *   });
 * });
 * ```
 */

const { JSDOM } = require('jsdom');
const sinon = require('sinon');

/**
 * Set up JSDOM environment with window and document globals.
 * Call this at the top of your test file (before describe block).
 */
function setupJSDOM() {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  global.window = dom.window;
  global.document = dom.window.document;
}

/**
 * Set up p5.js core globals (createVector, etc.) and logging functions.
 * Call this after setupJSDOM() or use setupTestEnvironment().
 */
function setupP5Globals() {
  global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));
  global.window.createVector = global.createVector;
  
  // p5.js constants
  global.CENTER = 'center';
  global.window.CENTER = 'center';
  
  // Set up logging functions (used by many game systems)
  global.logNormal = sinon.stub();
  global.logVerbose = sinon.stub();
  global.logDebug = sinon.stub();
  global.window.logNormal = global.logNormal;
  global.window.logVerbose = global.logVerbose;
  global.window.logDebug = global.logDebug;
  
  // globalThis versions for modern code
  global.globalThis = global.globalThis || global;
  global.globalThis.logNormal = global.logNormal;
  global.globalThis.logVerbose = global.logVerbose;
  global.globalThis.logDebug = global.logDebug;
}

/**
 * Set up p5.js rendering function mocks.
 * Call this for tests that need rendering functions.
 * Returns object with all mock functions for easy access.
 */
function setupP5Rendering() {
  const mocks = {
    push: sinon.stub(),
    pop: sinon.stub(),
    fill: sinon.stub(),
    stroke: sinon.stub(),
    strokeWeight: sinon.stub(),
    noStroke: sinon.stub(),
    noFill: sinon.stub(),
    ellipse: sinon.stub(),
    rect: sinon.stub(),
    translate: sinon.stub(),
    rotate: sinon.stub(),
    scale: sinon.stub(),
    tint: sinon.stub(),
    noTint: sinon.stub(),
    image: sinon.stub(),
    line: sinon.stub(),
    circle: sinon.stub(),
    triangle: sinon.stub(),
    text: sinon.stub(),
    textAlign: sinon.stub(),
    textSize: sinon.stub()
  };
  
  // Set as globals
  Object.keys(mocks).forEach(key => {
    global[key] = mocks[key];
    global.window[key] = mocks[key];
  });
  
  return mocks;
}

/**
 * Set up real CollisionBox2D class.
 * Call this for tests that need collision detection.
 */
function setupCollisionBox2D() {
  const CollisionBox2D = require('../../Classes/systems/CollisionBox2D.js');
  global.CollisionBox2D = CollisionBox2D;
  global.window.CollisionBox2D = CollisionBox2D;
  return CollisionBox2D;
}

/**
 * Create mock Sprite2D class and set as global.
 * Call this for tests that need sprite rendering.
 * Returns the mock class for custom assertions.
 */
function setupMockSprite2D() {
  class MockSprite2D {
    constructor(imagePath, position, size, rotation) {
      this.imagePath = imagePath;
      this._image = null; // Internal image property
      this.position = position;
      this.size = size;
      this.rotation = rotation || 0;
    }
    
    render() { /* Mock render */ }
    setPosition(pos) { this.position = pos; }
    setSize(size) { this.size = size; }
    setImage(img) { 
      this._image = img; 
      this.imagePath = img; 
    }
    setRotation(rot) { this.rotation = rot; }
  }
  
  global.Sprite2D = MockSprite2D;
  global.window.Sprite2D = MockSprite2D;
  
  return MockSprite2D;
}

/**
 * Complete test environment setup for MVC tests.
 * Sets up: JSDOM, p5.js globals, CollisionBox2D.
 * 
 * Options:
 * - rendering: true/false (default: false) - Include p5.js rendering functions
 * - sprite: true/false (default: false) - Include Sprite2D mock
 * 
 * Returns object with all setup components for easy access.
 * 
 * Example:
 * ```javascript
 * const { setupTestEnvironment, cleanupTestEnvironment } = require('../../helpers/mvcTestHelpers');
 * 
 * setupTestEnvironment({ rendering: true });
 * 
 * describe('MyTest', function() {
 *   let MyClass;
 *   
 *   before(function() {
 *     MyClass = require('../../../Classes/MyClass');
 *   });
 *   
 *   afterEach(function() {
 *     cleanupTestEnvironment();
 *   });
 * });
 * ```
 */
function setupTestEnvironment(options = {}) {
  const { rendering = false, sprite = false } = options;
  
  setupJSDOM();
  setupP5Globals();
  const CollisionBox2D = setupCollisionBox2D();
  
  const result = {
    CollisionBox2D,
    window: global.window,
    document: global.document
  };
  
  if (rendering) {
    result.renderingMocks = setupP5Rendering();
  }
  
  if (sprite) {
    result.Sprite2D = setupMockSprite2D();
  }
  
  return result;
}

/**
 * Create a Mocha hook that runs setupTestEnvironment().
 * Use this as a function call in your describe block.
 * 
 * Example:
 * ```javascript
 * describe('MyTest', function() {
 *   setupTestEnvironment(); // Automatically runs before tests
 *   
 *   it('should work', function() {
 *     // Test code
 *   });
 * });
 * ```
 */
function setupTestEnvironmentHook(options = {}) {
  // This function is called immediately in the describe block
  // It sets up the environment synchronously
  return setupTestEnvironment(options);
}

/**
 * Clean up Sinon stubs/spies after each test.
 * Use in afterEach() hook.
 */
function cleanupTestEnvironment() {
  sinon.restore();
}

/**
 * Load MVC base classes for testing.
 * Returns object with BaseModel, BaseView, BaseController.
 */
function loadMVCBaseClasses() {
  return {
    BaseModel: require('../../Classes/models/BaseModel'),
    BaseView: require('../../Classes/views/BaseView'),
    BaseController: require('../../Classes/controllers/mvc/BaseController')
  };
}

/**
 * Create a simple test model that extends BaseModel.
 * Useful for testing views and controllers.
 */
function createTestModel(BaseModel) {
  class TestModel extends BaseModel {
    constructor(x = 0, y = 0) {
      super();
      this._position = { x, y };
      this._testValue = 0;
    }
    
    get position() { return this._position; }
    get testValue() { return this._testValue; }
    
    setPosition(x, y) {
      this._position = { x, y };
      this._notifyChange('position', this._position);
    }
    
    setTestValue(value) {
      this._testValue = value;
      this._notifyChange('testValue', this._testValue);
    }
  }
  
  return TestModel;
}

/**
 * Create a simple test view that extends BaseView.
 * Useful for testing controllers.
 */
function createTestView(BaseView) {
  class TestView extends BaseView {
    constructor(model, options) {
      super(model, options);
      this.renderCalled = false;
      this.changeCount = 0;
    }
    
    _onModelChange(property, data) {
      this.changeCount++;
    }
    
    _renderContent() {
      this.renderCalled = true;
    }
  }
  
  return TestView;
}

/**
 * Assert that a change listener was called with expected arguments.
 * Convenience wrapper for common assertion pattern.
 */
function assertChangeListenerCalled(spy, property, data) {
  const { expect } = require('chai');
  expect(spy.calledOnce).to.be.true;
  expect(spy.firstCall.args[0]).to.equal(property);
  if (data !== undefined) {
    expect(spy.firstCall.args[1]).to.deep.equal(data);
  }
}

/**
 * Create a mock pointer/mouse event object.
 * Useful for input handling tests.
 */
function createMockPointer(x, y, pressed = false) {
  return {
    x,
    y,
    pressed,
    button: 0
  };
}

/**
 * Load a class with cache clearing (ensures fresh instance).
 * Use this to reload classes after environment setup.
 * 
 * Example:
 * ```javascript
 * const MyClass = loadClassWithCacheClear('../../../Classes/MyClass');
 * ```
 */
function loadClassWithCacheClear(relativePath) {
  delete require.cache[require.resolve(relativePath)];
  const LoadedClass = require(relativePath);
  global[LoadedClass.name] = LoadedClass;
  global.window[LoadedClass.name] = LoadedClass;
  return LoadedClass;
}

/**
 * Setup test environment and load multiple classes in one call.
 * Convenience function for integration tests.
 * 
 * Example:
 * ```javascript
 * const { CategoryRadioButtons, EntityPalette } = setupAndLoadClasses(
 *   { rendering: true },
 *   {
 *     CategoryRadioButtons: '../../../Classes/ui/UIComponents/radioButton/CategoryRadioButtons',
 *     EntityPalette: '../../../Classes/ui/painter/entity/EntityPalette'
 *   }
 * );
 * ```
 */
function setupAndLoadClasses(options = {}, classPaths = {}) {
  const env = setupTestEnvironment(options);
  
  const loadedClasses = {};
  Object.keys(classPaths).forEach(className => {
    loadedClasses[className] = loadClassWithCacheClear(classPaths[className]);
  });
  
  return { ...env, ...loadedClasses };
}

// Export all helpers
module.exports = {
  // Setup functions
  setupJSDOM,
  setupP5Globals,
  setupP5Rendering,
  setupCollisionBox2D,
  setupMockSprite2D,
  setupTestEnvironment,
  setupTestEnvironmentHook,
  cleanupTestEnvironment,
  
  // Class loaders
  loadMVCBaseClasses,
  loadClassWithCacheClear,
  setupAndLoadClasses,
  
  // Test utilities
  createTestModel,
  createTestView,
  assertChangeListenerCalled,
  createMockPointer
};
