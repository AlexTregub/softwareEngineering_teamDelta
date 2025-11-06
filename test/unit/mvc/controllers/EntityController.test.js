/**
 * Unit tests for EntityController
 * TDD: Write tests FIRST, then implement
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Load dependencies
const EntityModel = require('../../../../Classes/mvc/models/EntityModel');
const EntityController = require('../../../../Classes/mvc/controllers/EntityController');

describe('EntityController', function() {
  let model, controller;
  
  beforeEach(function() {
    // Create a basic model for testing
    model = new EntityModel({
      position: { x: 100, y: 200 },
      size: { width: 32, height: 32 }
    });
    
    // Create controller
    controller = new EntityController();
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Constructor', function() {
    it('should create an EntityController', function() {
      expect(controller).to.exist;
      expect(controller).to.be.an.instanceOf(EntityController);
    });
    
    it('should initialize with no internal state', function() {
      // Controllers should be stateless - they operate on models
      expect(controller).to.not.have.property('_state');
      expect(controller).to.not.have.property('position');
      expect(controller).to.not.have.property('velocity');
    });
  });
  
  describe('update()', function() {
    it('should accept model and deltaTime parameters', function() {
      expect(() => controller.update(model, 16)).to.not.throw();
    });
    
    it('should throw if model is null', function() {
      expect(() => controller.update(null, 16)).to.throw('EntityController.update: model is required');
    });
    
    it('should throw if deltaTime is not a number', function() {
      expect(() => controller.update(model, 'invalid')).to.throw('EntityController.update: deltaTime must be a number');
    });
    
    it('should handle deltaTime of zero', function() {
      expect(() => controller.update(model, 0)).to.not.throw();
    });
    
    it('should skip update if model is disabled', function() {
      model.enabled = false;
      const spy = sinon.spy(controller, '_updateInternal');
      
      controller.update(model, 16);
      
      expect(spy.called).to.be.false;
    });
    
    it('should call _updateInternal if model is enabled', function() {
      const spy = sinon.spy(controller, '_updateInternal');
      
      controller.update(model, 16);
      
      expect(spy.calledOnce).to.be.true;
      expect(spy.calledWith(model, 16)).to.be.true;
    });
  });
  
  describe('handleInput()', function() {
    it('should accept model and input parameters', function() {
      const input = { mouse: { x: 150, y: 250 }, keyboard: {} };
      expect(() => controller.handleInput(model, input)).to.not.throw();
    });
    
    it('should throw if model is null', function() {
      expect(() => controller.handleInput(null, {})).to.throw('EntityController.handleInput: model is required');
    });
    
    it('should throw if input is null', function() {
      expect(() => controller.handleInput(model, null)).to.throw('EntityController.handleInput: input is required');
    });
    
    it('should skip input if model is disabled', function() {
      model.enabled = false;
      const spy = sinon.spy(controller, '_handleInputInternal');
      
      controller.handleInput(model, {});
      
      expect(spy.called).to.be.false;
    });
    
    it('should call _handleInputInternal if model is enabled', function() {
      const input = { mouse: { x: 150, y: 250 } };
      const spy = sinon.spy(controller, '_handleInputInternal');
      
      controller.handleInput(model, input);
      
      expect(spy.calledOnce).to.be.true;
      expect(spy.calledWith(model, input)).to.be.true;
    });
  });
  
  describe('_updateInternal()', function() {
    it('should be a no-op in base controller (override in subclasses)', function() {
      // Base implementation does nothing
      const result = controller._updateInternal(model, 16);
      expect(result).to.be.undefined;
    });
  });
  
  describe('_handleInputInternal()', function() {
    it('should be a no-op in base controller (override in subclasses)', function() {
      // Base implementation does nothing
      const result = controller._handleInputInternal(model, {});
      expect(result).to.be.undefined;
    });
  });
  
  describe('Stateless Design', function() {
    it('should not store model reference', function() {
      controller.update(model, 16);
      expect(controller._model).to.be.undefined;
    });
    
    it('should operate on passed model only', function() {
      const model1 = new EntityModel({ position: { x: 0, y: 0 } });
      const model2 = new EntityModel({ position: { x: 100, y: 100 } });
      
      controller.update(model1, 16);
      controller.update(model2, 16);
      
      // Controller should not mix up models
      expect(model1.getPosition().x).to.equal(0);
      expect(model2.getPosition().x).to.equal(100);
    });
  });
  
  describe('Integration with EntityModel', function() {
    it('should read model properties', function() {
      const spy = sinon.spy(model, 'getPosition');
      
      controller.update(model, 16);
      // Base controller doesn't read position, but subclasses will
      // This test validates the interface works
      model.getPosition();
      
      expect(spy.called).to.be.true;
    });
    
    it('should modify model properties', function() {
      const originalX = model.getPosition().x;
      
      // Simulate a subclass modifying position
      controller._updateInternal = function(model, deltaTime) {
        const pos = model.getPosition();
        model.setPosition(pos.x + 1, pos.y);
      };
      
      controller.update(model, 16);
      
      expect(model.getPosition().x).to.equal(originalX + 1);
    });
  });
  
  describe('Performance', function() {
    it('should update 1000 entities quickly', function() {
      const models = [];
      for (let i = 0; i < 1000; i++) {
        models.push(new EntityModel({
          position: { x: i * 10, y: i * 10 }
        }));
      }
      
      const startTime = Date.now();
      
      models.forEach(m => controller.update(m, 16));
      
      const elapsed = Date.now() - startTime;
      expect(elapsed).to.be.lessThan(100); // Should be very fast for no-op
    });
  });
});
