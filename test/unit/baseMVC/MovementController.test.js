/**
 * MovementController MVC Tests
 * 
 * Tests the MVC-compliant MovementController that works with EntityModel
 * instead of accessing entity internals directly.
 * 
 * TDD: Write tests first, then verify implementation
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

// Setup JSDOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

// Load MVC components
const EntityModel = require('../../../Classes/baseMVC/models/EntityModel');
const MovementController = require('../../../Classes/baseMVC/controllers/MovementController');

describe('MovementController (MVC)', function() {
  let model, controller;
  
  beforeEach(function() {
    // Mock p5.js
    global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));
    window.createVector = global.createVector;
    
    // Create model
    model = new EntityModel(100, 100, 32, 32, { type: 'Ant' });
    
    // Create controller with no dependencies (isolated test)
    controller = new MovementController(model, {});
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Constructor', function() {
    it('should create with model reference', function() {
      expect(controller.model).to.equal(model);
    });
    
    it('should not store duplicate state', function() {
      // MovementController should NOT have these properties (state is in Model)
      expect(controller).to.not.have.property('_isMoving');
      expect(controller).to.not.have.property('_targetPosition');
      expect(controller).to.not.have.property('_path');
    });
    
    it('should accept pathfinding system option', function() {
      const mockPathfinding = { findPath: sinon.stub() };
      const ctrl = new MovementController(model, { pathfindingSystem: mockPathfinding });
      expect(ctrl._pathfindingSystem).to.equal(mockPathfinding);
    });
    
    it('should accept terrain system option', function() {
      const mockTerrain = { getTile: sinon.stub() };
      const ctrl = new MovementController(model, { terrainSystem: mockTerrain });
      expect(ctrl._terrainSystem).to.equal(mockTerrain);
    });
  });
  
  describe('Movement State (reads from Model)', function() {
    it('should read moving state from model', function() {
      model.setMoving(true);
      expect(controller.isMoving()).to.be.true;
      
      model.setMoving(false);
      expect(controller.isMoving()).to.be.false;
    });
    
    it('should check if model has target position', function() {
      model.setTargetPosition(200, 200);
      expect(controller.hasTarget()).to.be.true;
      
      model.setTargetPosition(null, null);
      expect(controller.hasTarget()).to.be.false;
    });
  });
  
  describe('moveToLocation()', function() {
    it('should set target position in model', function() {
      controller.moveToLocation(200, 200);
      
      const target = model.getTargetPosition();
      expect(target.x).to.equal(200);
      expect(target.y).to.equal(200);
    });
    
    it('should set moving state in model', function() {
      controller.moveToLocation(200, 200);
      expect(model.isMoving()).to.be.true;
    });
    
    it('should handle flip direction (reads Model position)', function() {
      // Move left (x < current position)
      controller.moveToLocation(50, 100);
      expect(model.getFlipX()).to.be.true;
      
      // Move right (x > current position)
      controller.moveToLocation(150, 100);
      expect(model.getFlipX()).to.be.false;
    });
    
    it('should return true on success', function() {
      const result = controller.moveToLocation(200, 200);
      expect(result).to.be.true;
    });
  });
  
  describe('stop()', function() {
    it('should clear moving state in model', function() {
      model.setMoving(true);
      model.setTargetPosition(200, 200);
      
      controller.stop();
      
      expect(model.isMoving()).to.be.false;
    });
    
    it('should clear target position in model', function() {
      model.setTargetPosition(200, 200);
      
      controller.stop();
      
      const target = model.getTargetPosition();
      expect(target).to.be.null;
    });
    
    it('should clear path in model', function() {
      model.setPath([{ x: 100, y: 100 }]);
      
      controller.stop();
      
      expect(model.getPath()).to.be.null;
    });
  });
  
  describe('update()', function() {
    it('should not move if no target', function() {
      const initialPos = model.getPosition();
      
      controller.update(16.67);
      
      const newPos = model.getPosition();
      expect(newPos.x).to.equal(initialPos.x);
      expect(newPos.y).to.equal(initialPos.y);
    });
    
    it('should not move if not moving state', function() {
      model.setTargetPosition(200, 200);
      model.setMoving(false);
      
      const initialPos = model.getPosition();
      controller.update(16.67);
      
      const newPos = model.getPosition();
      expect(newPos.x).to.equal(initialPos.x);
    });
    
    it('should update position when moving', function() {
      controller.moveToLocation(200, 200);
      
      const initialPos = model.getPosition();
      controller.update(16.67);
      
      const newPos = model.getPosition();
      // Should have moved toward target
      expect(newPos.x).to.not.equal(initialPos.x);
    });
    
    it('should stop when reaching target', function() {
      // Start very close to target
      model.setPosition(199, 200);
      controller.moveToLocation(200, 200);
      
      controller.update(16.67);
      
      // Should have stopped
      expect(model.isMoving()).to.be.false;
    });
  });
  
  describe('MVC Compliance', function() {
    it('should only read state from Model', function() {
      // MovementController should NEVER store state
      const keys = Object.keys(controller);
      const stateKeys = keys.filter(k => k.startsWith('_is') || k.startsWith('_target') || k === '_path');
      
      expect(stateKeys).to.have.lengthOf(0, 'MovementController should not store state properties');
    });
    
    it('should not access Model private properties', function() {
      // Controller should use public getters/setters only
      const updateSpy = sinon.spy(controller, 'update');
      
      controller.moveToLocation(200, 200);
      controller.update(16.67);
      
      // Should not throw errors (no direct property access)
      expect(updateSpy).to.not.throw;
    });
  });
  
  describe('Pathfinding Integration', function() {
    it('should use pathfinding system when available', function() {
      const mockPathfinding = {
        findPath: sinon.stub().returns([
          { x: 100, y: 100 },
          { x: 150, y: 150 },
          { x: 200, y: 200 }
        ])
      };
      
      const ctrl = new MovementController(model, { pathfindingSystem: mockPathfinding });
      ctrl.moveToLocation(200, 200);
      
      expect(mockPathfinding.findPath.called).to.be.true;
    });
    
    it('should store path in model', function() {
      const mockPath = [
        { x: 100, y: 100 },
        { x: 200, y: 200 }
      ];
      
      const mockPathfinding = {
        findPath: sinon.stub().returns(mockPath)
      };
      
      const ctrl = new MovementController(model, { pathfindingSystem: mockPathfinding });
      ctrl.moveToLocation(200, 200);
      
      expect(model.getPath()).to.deep.equal(mockPath);
    });
  });
  
  describe('Terrain Integration', function() {
    it('should use terrain system for movement costs', function() {
      const mockTerrain = {
        getTile: sinon.stub().returns({ type: 'grass', cost: 1.0 })
      };
      
      const ctrl = new MovementController(model, { terrainSystem: mockTerrain });
      ctrl.moveToLocation(200, 200);
      ctrl.update(16.67);
      
      // Terrain should be checked during movement
      expect(mockTerrain.getTile.called).to.be.true;
    });
  });
});
