/**
 * ResourceController Unit Tests
 * -----------------------------
 * Tests for the Resource controller class (MVC pattern).
 * 
 * ResourceController coordinates ResourceModel and ResourceView:
 * - Public API for resource operations
 * - Input handling (selection, gathering)
 * - Update/render lifecycle delegation
 * - Proper cleanup and lifecycle management
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupTestEnvironment, cleanupTestEnvironment, loadMVCBaseClasses } = require('../../helpers/mvcTestHelpers');

// Setup test environment with rendering and sprite support
setupTestEnvironment({ rendering: true, sprite: true });

describe('ResourceController', function() {
  let BaseController, ResourceModel, ResourceView, ResourceController;
  
  before(function() {
    // Load MVC base classes
    const classes = loadMVCBaseClasses();
    BaseController = classes.BaseController;
    
    // Load Resource classes
    ResourceModel = require('../../../Classes/models/ResourceModel');
    ResourceView = require('../../../Classes/views/ResourceView');
    ResourceController = require('../../../Classes/controllers/mvc/ResourceController');
  });
  
  afterEach(function() {
    cleanupTestEnvironment();
  });
  
  describe('Constructor', function() {
    it('should extend BaseController', function() {
      const controller = new ResourceController(100, 100, 32, 32);
      expect(controller).to.be.instanceOf(BaseController);
      expect(controller).to.be.instanceOf(ResourceController);
    });
    
    it('should create model and view', function() {
      const controller = new ResourceController(100, 100, 32, 32);
      expect(controller.model).to.be.instanceOf(ResourceModel);
      expect(controller.view).to.be.instanceOf(ResourceView);
    });
    
    it('should pass position to model', function() {
      const controller = new ResourceController(150, 200, 32, 32);
      expect(controller.model.position.x).to.equal(150);
      expect(controller.model.position.y).to.equal(200);
    });
    
    it('should pass size to model', function() {
      const controller = new ResourceController(100, 100, 48, 64);
      expect(controller.model.size.width).to.equal(48);
      expect(controller.model.size.height).to.equal(64);
    });
    
    it('should pass options to model', function() {
      const controller = new ResourceController(100, 100, 32, 32, { 
        type: 'Wood', 
        amount: 75 
      });
      expect(controller.model.type).to.equal('Wood');
      expect(controller.model.amount).to.equal(75);
    });
    
    it('should pass options to view', function() {
      const controller = new ResourceController(100, 100, 32, 32, { 
        imagePath: 'test.png' 
      });
      expect(controller.view._sprite).to.exist;
      expect(controller.view._sprite.imagePath).to.equal('test.png');
    });
  });
  
  describe('Public API - Position', function() {
    it('should have getPosition method', function() {
      const controller = new ResourceController(100, 100, 32, 32);
      expect(controller.getPosition).to.be.a('function');
    });
    
    it('should return position from model', function() {
      const controller = new ResourceController(150, 200, 32, 32);
      const position = controller.getPosition();
      expect(position.x).to.equal(150);
      expect(position.y).to.equal(200);
    });
    
    it('should have setPosition method', function() {
      const controller = new ResourceController(100, 100, 32, 32);
      expect(controller.setPosition).to.be.a('function');
    });
    
    it('should update model position', function() {
      const controller = new ResourceController(100, 100, 32, 32);
      controller.setPosition(200, 250);
      expect(controller.model.position.x).to.equal(200);
      expect(controller.model.position.y).to.equal(250);
    });
    
    it('should trigger view update on position change', function() {
      const controller = new ResourceController(100, 100, 32, 32, { imagePath: 'test.png' });
      controller.setPosition(200, 250);
      expect(controller.view._sprite.position.x).to.equal(200);
      expect(controller.view._sprite.position.y).to.equal(250);
    });
  });
  
  describe('Public API - Resource Type', function() {
    it('should have getType method', function() {
      const controller = new ResourceController(100, 100, 32, 32);
      expect(controller.getType).to.be.a('function');
    });
    
    it('should return type from model', function() {
      const controller = new ResourceController(100, 100, 32, 32, { type: 'Stone' });
      expect(controller.getType()).to.equal('Stone');
    });
  });
  
  describe('Public API - Resource Amount', function() {
    it('should have getAmount method', function() {
      const controller = new ResourceController(100, 100, 32, 32);
      expect(controller.getAmount).to.be.a('function');
    });
    
    it('should return amount from model', function() {
      const controller = new ResourceController(100, 100, 32, 32, { amount: 75 });
      expect(controller.getAmount()).to.equal(75);
    });
    
    it('should have gather method', function() {
      const controller = new ResourceController(100, 100, 32, 32);
      expect(controller.gather).to.be.a('function');
    });
    
    it('should reduce amount when gathering', function() {
      const controller = new ResourceController(100, 100, 32, 32, { amount: 100 });
      controller.gather(30);
      expect(controller.getAmount()).to.equal(70);
    });
    
    it('should return gathered amount', function() {
      const controller = new ResourceController(100, 100, 32, 32, { amount: 100 });
      const gathered = controller.gather(30);
      expect(gathered).to.equal(30);
    });
    
    it('should not gather more than available', function() {
      const controller = new ResourceController(100, 100, 32, 32, { amount: 20 });
      const gathered = controller.gather(50);
      expect(gathered).to.equal(20);
      expect(controller.getAmount()).to.equal(0);
    });
  });
  
  describe('Public API - Depletion', function() {
    it('should have isDepleted method', function() {
      const controller = new ResourceController(100, 100, 32, 32);
      expect(controller.isDepleted).to.be.a('function');
    });
    
    it('should return false when not depleted', function() {
      const controller = new ResourceController(100, 100, 32, 32, { amount: 50 });
      expect(controller.isDepleted()).to.be.false;
    });
    
    it('should return true when depleted', function() {
      const controller = new ResourceController(100, 100, 32, 32, { amount: 10 });
      controller.gather(10);
      expect(controller.isDepleted()).to.be.true;
    });
    
    it('should be inactive when depleted', function() {
      const controller = new ResourceController(100, 100, 32, 32, { amount: 10 });
      controller.gather(10);
      expect(controller.model.isActive).to.be.false;
    });
  });
  
  describe('Public API - Collision', function() {
    it('should have contains method', function() {
      const controller = new ResourceController(100, 100, 32, 32);
      expect(controller.contains).to.be.a('function');
    });
    
    it('should detect point inside bounds', function() {
      const controller = new ResourceController(100, 100, 32, 32);
      expect(controller.contains(110, 110)).to.be.true;
    });
    
    it('should detect point outside bounds', function() {
      const controller = new ResourceController(100, 100, 32, 32);
      expect(controller.contains(200, 200)).to.be.false;
    });
    
    it('should have collidesWith method', function() {
      const controller = new ResourceController(100, 100, 32, 32);
      expect(controller.collidesWith).to.be.a('function');
    });
    
    it('should detect collision with another resource', function() {
      const controller1 = new ResourceController(100, 100, 32, 32);
      const controller2 = new ResourceController(110, 110, 32, 32);
      expect(controller1.collidesWith(controller2)).to.be.true;
    });
    
    it('should detect no collision when far apart', function() {
      const controller1 = new ResourceController(100, 100, 32, 32);
      const controller2 = new ResourceController(200, 200, 32, 32);
      expect(controller1.collidesWith(controller2)).to.be.false;
    });
  });
  
  describe('Update/Render Lifecycle', function() {
    it('should delegate update to model', function() {
      const controller = new ResourceController(100, 100, 32, 32);
      const updateSpy = sinon.spy(controller.model, 'update');
      
      controller.update(16);
      
      expect(updateSpy.calledOnce).to.be.true;
      expect(updateSpy.firstCall.args[0]).to.equal(16);
    });
    
    it('should delegate render to view', function() {
      const controller = new ResourceController(100, 100, 32, 32);
      const renderSpy = sinon.spy(controller.view, 'render');
      
      controller.render();
      
      expect(renderSpy.calledOnce).to.be.true;
    });
    
    it('should not update when inactive', function() {
      const controller = new ResourceController(100, 100, 32, 32, { amount: 10 });
      controller.gather(10); // Deplete
      
      const updateSpy = sinon.spy(controller.model, 'update');
      controller.update(16);
      
      expect(updateSpy.called).to.be.false;
    });
    
    it('should not render when inactive', function() {
      const controller = new ResourceController(100, 100, 32, 32, { amount: 10 });
      controller.gather(10); // Deplete
      
      const renderSpy = sinon.spy(controller.view, 'render');
      controller.render();
      
      expect(renderSpy.called).to.be.false;
    });
  });
  
  describe('Input Handling', function() {
    it('should have handleInput method', function() {
      const controller = new ResourceController(100, 100, 32, 32);
      expect(controller.handleInput).to.be.a('function');
    });
    
    it('should handle click input within bounds', function() {
      const controller = new ResourceController(100, 100, 32, 32);
      const result = controller.handleInput('click', { x: 110, y: 110 });
      expect(result).to.be.an('object');
      expect(result).to.have.property('onGather');
    });
    
    it('should ignore click input outside bounds', function() {
      const controller = new ResourceController(100, 100, 32, 32);
      const result = controller.handleInput('click', { x: 200, y: 200 });
      expect(result).to.be.false;
    });
    
    it('should return gathering callback on click', function() {
      const controller = new ResourceController(100, 100, 32, 32);
      const result = controller.handleInput('click', { x: 110, y: 110 });
      expect(result).to.have.property('onGather');
      expect(result.onGather).to.be.a('function');
    });
    
    it('should execute gather via callback', function() {
      const controller = new ResourceController(100, 100, 32, 32, { amount: 100 });
      const result = controller.handleInput('click', { x: 110, y: 110 });
      const gathered = result.onGather(25);
      expect(gathered).to.equal(25);
      expect(controller.getAmount()).to.equal(75);
    });
  });
  
  describe('Serialization', function() {
    it('should have toJSON method', function() {
      const controller = new ResourceController(100, 100, 32, 32);
      expect(controller.toJSON).to.be.a('function');
    });
    
    it('should serialize controller state', function() {
      const controller = new ResourceController(150, 200, 48, 64, { 
        type: 'Wood', 
        amount: 75 
      });
      const json = controller.toJSON();
      
      expect(json).to.have.property('position');
      expect(json.position.x).to.equal(150);
      expect(json.position.y).to.equal(200);
      expect(json).to.have.property('size');
      expect(json.size.width).to.equal(48);
      expect(json.size.height).to.equal(64);
      expect(json).to.have.property('type', 'Wood');
      expect(json).to.have.property('amount', 75);
    });
    
    it('should have static fromJSON method', function() {
      expect(ResourceController.fromJSON).to.be.a('function');
    });
    
    it('should deserialize from JSON', function() {
      const json = {
        position: { x: 150, y: 200 },
        size: { width: 48, height: 64 },
        type: 'Stone',
        amount: 50
      };
      
      const controller = ResourceController.fromJSON(json);
      
      expect(controller).to.be.instanceOf(ResourceController);
      expect(controller.getPosition().x).to.equal(150);
      expect(controller.getPosition().y).to.equal(200);
      expect(controller.model.size.width).to.equal(48);
      expect(controller.model.size.height).to.equal(64);
      expect(controller.getType()).to.equal('Stone');
      expect(controller.getAmount()).to.equal(50);
    });
  });
  
  describe('Lifecycle', function() {
    it('should have destroy method', function() {
      const controller = new ResourceController(100, 100, 32, 32);
      expect(controller.destroy).to.be.a('function');
    });
    
    it('should destroy model and view', function() {
      const controller = new ResourceController(100, 100, 32, 32);
      const modelDestroySpy = sinon.spy(controller.model, 'destroy');
      const viewDestroySpy = sinon.spy(controller.view, 'destroy');
      
      controller.destroy();
      
      expect(modelDestroySpy.calledOnce).to.be.true;
      expect(viewDestroySpy.calledOnce).to.be.true;
    });
    
    it('should clear references on destroy', function() {
      const controller = new ResourceController(100, 100, 32, 32);
      controller.destroy();
      
      expect(controller.model).to.be.null;
      expect(controller.view).to.be.null;
    });
  });
});
