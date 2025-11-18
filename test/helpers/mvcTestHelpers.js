/**
 * @fileoverview MVC Test Helpers - Centralized test utilities for MVC tests
 * Eliminates duplicate mock setup across all MVC test files
 * 
 * Usage:
 *   const { setupMVCTest, loadMVCClasses } = require('../../helpers/mvcTestHelpers');
 *   
 *   // At top of test file (before describe)
 *   setupMVCTest();
 *   
 *   beforeEach(function() {
 *     loadMVCClasses(); // Load EntityModel, EntityView, EntityController
 *   });
 * 
 * @author Software Engineering Team Delta
 * @version 1.0.0
 */

const sinon = require('sinon');
const { setupP5Mocks, resetP5Mocks } = require('./p5Mocks');

/**
 * Mock CollisionBox2D class
 */
class MockCollisionBox {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
  }
  
  setPosition(x, y) { 
    this.x = x; 
    this.y = y; 
  }
  
  setSize(w, h) { 
    this.width = w; 
    this.height = h; 
  }
  
  getPosX() { return this.x; }
  getPosY() { return this.y; }
  
  getCenter() { 
    return { x: this.x, y: this.y }; 
  }
  
  contains(x, y) {
    return x >= this.x - this.width/2 && 
           x <= this.x + this.width/2 &&
           y >= this.y - this.height/2 && 
           y <= this.y + this.height/2;
  }
}

/**
 * Mock Sprite2D class
 */
class MockSprite {
  constructor(img, pos, size, rot) {
    this.img = img;
    this.pos = pos || { x: 0, y: 0 };
    this.size = size || { x: 32, y: 32 };
    this.rotation = rot || 0;
    this.alpha = 255;
  }
  
  setPosition(pos) { 
    this.pos = pos; 
  }
  
  setSize(size) { 
    this.size = size; 
  }
  
  render() {}
}

/**
 * Mock TransformController class
 */
class MockTransformController {
  constructor(entity) { 
    this.entity = entity; 
  }
  
  update() {}
  
  getPosition() { 
    return this.entity.model.getPosition(); 
  }
  
  setPosition(x, y) { 
    this.entity.model.setPosition(x, y); 
  }
  
  getSize() { 
    return this.entity.model.getSize(); 
  }
  
  setSize(w, h) { 
    this.entity.model.setSize(w, h); 
  }
}

/**
 * Mock MovementController class
 */
class MockMovementController {
  constructor(entity) { 
    this.entity = entity;
    this.movementSpeed = entity.model ? entity.model.movementSpeed : 1;
    this._isMoving = false;
  }
  
  update() {}
  
  moveToLocation(x, y) { 
    this._isMoving = true; 
  }
  
  getIsMoving() { 
    return this._isMoving; 
  }
  
  stop() { 
    this._isMoving = false; 
  }
}

/**
 * Mock SelectionController class
 */
class MockSelectionController {
  constructor(entity) { 
    this.entity = entity;
    this._isSelected = false;
  }
  
  update() {}
  
  setSelected(val) { 
    this._isSelected = val; 
  }
  
  isSelected() { 
    return this._isSelected; 
  }
  
  setSelectable(val) {}
}

/**
 * Mock CombatController class
 */
class MockCombatController {
  constructor(entity) { 
    this.entity = entity; 
  }
  
  update() {}
  
  setFaction(faction) {}
  
  isInCombat() { 
    return false; 
  }
}

/**
 * Mock SpatialGridManager
 */
const mockSpatialGridManager = {
  addEntity: sinon.stub(),
  removeEntity: sinon.stub(),
  updateEntity: sinon.stub()
};

/**
 * Mock CoordinateConverter
 */
const mockCoordinateConverter = {
  worldToScreen: sinon.stub().callsFake((x, y) => ({ x, y })),
  screenToWorld: sinon.stub().callsFake((x, y) => ({ x, y }))
};

/**
 * Setup all MVC test mocks
 * Call this once at the top of your test file (before describe blocks)
 */
function setupMVCTest() {
  // Setup p5.js mocks
  setupP5Mocks();
  
  // Setup window if missing
  if (typeof global.window === 'undefined') {
    global.window = {};
  }
  
  // Setup game constants
  global.TILE_SIZE = 32;
  global.window.TILE_SIZE = 32;
  
  // Setup mock classes
  global.CollisionBox2D = MockCollisionBox;
  global.window.CollisionBox2D = MockCollisionBox;
  
  global.Sprite2D = MockSprite;
  global.window.Sprite2D = MockSprite;
  
  global.TransformController = MockTransformController;
  global.window.TransformController = MockTransformController;
  
  global.MovementController = MockMovementController;
  global.window.MovementController = MockMovementController;
  
  global.SelectionController = MockSelectionController;
  global.window.SelectionController = MockSelectionController;
  
  global.CombatController = MockCombatController;
  global.window.CombatController = MockCombatController;
  
  // Setup spatial grid manager
  global.spatialGridManager = mockSpatialGridManager;
  global.window.spatialGridManager = mockSpatialGridManager;
  
  // Setup coordinate converter
  global.CoordinateConverter = mockCoordinateConverter;
  global.window.CoordinateConverter = mockCoordinateConverter;
}

/**
 * Load MVC classes (EntityModel, EntityView, EntityController, EntityFactory)
 * Call this in beforeEach() to ensure classes are loaded
 */
function loadMVCClasses() {
  // Load EntityModel
  if (typeof global.EntityModel === 'undefined') {
    global.EntityModel = require('../../Classes/mvc/models/EntityModel.js');
    global.window.EntityModel = global.EntityModel;
  }
  
  // Load EntityView
  if (typeof global.EntityView === 'undefined') {
    global.EntityView = require('../../Classes/mvc/views/EntityView.js');
    global.window.EntityView = global.EntityView;
  }
  
  // Load EntityController
  if (typeof global.EntityController === 'undefined') {
    global.EntityController = require('../../Classes/mvc/controllers/EntityController.js');
    global.window.EntityController = global.EntityController;
  }
  
  // Load EntityFactory
  if (typeof global.EntityFactory === 'undefined') {
    global.EntityFactory = require('../../Classes/mvc/factories/EntityFactory.js');
    global.window.EntityFactory = global.EntityFactory;
  }
}

/**
 * Load AntModel class
 * Call this in beforeEach() for ant-specific tests
 */
function loadAntModel() {
  if (typeof global.AntModel === 'undefined') {
    global.AntModel = require('../../Classes/mvc/models/AntModel.js');
    global.window.AntModel = global.AntModel;
  }
}

/**
 * Reset all test mocks
 * Call this in beforeEach() to clear call history
 */
function resetMVCMocks() {
  // Reset p5.js mocks
  resetP5Mocks();
  
  // Reset spatial grid stubs
  if (mockSpatialGridManager.addEntity.resetHistory) {
    mockSpatialGridManager.addEntity.resetHistory();
  }
  if (mockSpatialGridManager.removeEntity.resetHistory) {
    mockSpatialGridManager.removeEntity.resetHistory();
  }
  if (mockSpatialGridManager.updateEntity.resetHistory) {
    mockSpatialGridManager.updateEntity.resetHistory();
  }
  
  // Reset coordinate converter stubs
  if (mockCoordinateConverter.worldToScreen.resetHistory) {
    mockCoordinateConverter.worldToScreen.resetHistory();
  }
  if (mockCoordinateConverter.screenToWorld.resetHistory) {
    mockCoordinateConverter.screenToWorld.resetHistory();
  }
}

/**
 * Create a basic MVC entity for testing
 * @param {Object} options - Entity options
 * @returns {Object} Object with model, view, controller
 */
function createTestEntity(options = {}) {
  const defaults = {
    x: 100,
    y: 200,
    width: 32,
    height: 32,
    imagePath: 'test/sprite.png' // Default sprite for tests
  };
  
  const config = { ...defaults, ...options };
  
  const EntityModel = global.EntityModel;
  const EntityView = global.EntityView;
  const EntityController = global.EntityController;
  
  const model = new EntityModel(config);
  const view = new EntityView(model);
  const controller = new EntityController(model, view);
  
  return { model, view, controller };
}

// Export all utilities
module.exports = {
  // Setup functions
  setupMVCTest,
  loadMVCClasses,
  loadAntModel,
  resetMVCMocks,
  
  // Helper functions
  createTestEntity,
  
  // Mock classes (for advanced usage)
  MockCollisionBox,
  MockSprite,
  MockTransformController,
  MockMovementController,
  MockSelectionController,
  MockCombatController,
  
  // Mock objects
  mockSpatialGridManager,
  mockCoordinateConverter
};
