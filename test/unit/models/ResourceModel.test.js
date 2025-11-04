/**
 * ResourceModel Unit Tests
 * ------------------------
 * Tests for the Resource model class (MVC pattern).
 * 
 * ResourceModel represents game resources (Food, Wood, Stone) with:
 * - Position and size
 * - Resource type and amount
 * - Depletion tracking
 * - Serialization support
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupTestEnvironment, cleanupTestEnvironment } = require('../../helpers/mvcTestHelpers');

// Set up test environment (includes CollisionBox2D)
setupTestEnvironment();

describe('ResourceModel', function() {
  let BaseModel, ResourceModel;
  
  before(function() {
    // Load classes
    BaseModel = require('../../../Classes/models/BaseModel');
    ResourceModel = require('../../../Classes/models/ResourceModel');
  });
  
  afterEach(function() {
    cleanupTestEnvironment();
  });
  
  describe('Constructor', function() {
    it('should extend BaseModel', function() {
      const model = new ResourceModel(100, 100, 32, 32);
      expect(model).to.be.instanceOf(BaseModel);
      expect(model).to.be.instanceOf(ResourceModel);
    });
    
    it('should initialize with position', function() {
      const model = new ResourceModel(100, 150, 32, 32);
      expect(model.position.x).to.equal(100);
      expect(model.position.y).to.equal(150);
    });
    
    it('should initialize with size', function() {
      const model = new ResourceModel(100, 100, 48, 64);
      expect(model.size.width).to.equal(48);
      expect(model.size.height).to.equal(64);
    });
    
    it('should have default resource type', function() {
      const model = new ResourceModel(100, 100, 32, 32);
      expect(model.type).to.equal('Food');
    });
    
    it('should accept custom resource type', function() {
      const model = new ResourceModel(100, 100, 32, 32, { type: 'Wood' });
      expect(model.type).to.equal('Wood');
    });
    
    it('should initialize with default amount', function() {
      const model = new ResourceModel(100, 100, 32, 32);
      expect(model.amount).to.equal(100);
    });
    
    it('should accept custom amount', function() {
      const model = new ResourceModel(100, 100, 32, 32, { amount: 250 });
      expect(model.amount).to.equal(250);
    });
    
    it('should generate unique ID', function() {
      const model1 = new ResourceModel(100, 100, 32, 32);
      const model2 = new ResourceModel(100, 100, 32, 32);
      expect(model1.id).to.not.equal(model2.id);
      expect(model1.id).to.include('resource_');
    });
    
    it('should be active by default', function() {
      const model = new ResourceModel(100, 100, 32, 32);
      expect(model.isActive).to.be.true;
    });
  });
  
  describe('Position Management', function() {
    it('should update position', function() {
      const model = new ResourceModel(100, 100, 32, 32);
      model.setPosition(200, 250);
      
      expect(model.position.x).to.equal(200);
      expect(model.position.y).to.equal(250);
    });
    
    it('should notify listeners on position change', function() {
      const model = new ResourceModel(100, 100, 32, 32);
      const listener = sinon.spy();
      
      model.addChangeListener(listener);
      model.setPosition(200, 200);
      
      expect(listener.calledOnce).to.be.true;
      expect(listener.firstCall.args[0]).to.equal('position');
      expect(listener.firstCall.args[1]).to.deep.equal({ x: 200, y: 200 });
    });
    
    it('should not notify if position unchanged', function() {
      const model = new ResourceModel(100, 100, 32, 32);
      const listener = sinon.spy();
      
      model.addChangeListener(listener);
      model.setPosition(100, 100);
      
      expect(listener.called).to.be.false;
    });
  });
  
  describe('Resource Amount Management', function() {
    it('should reduce amount', function() {
      const model = new ResourceModel(100, 100, 32, 32, { amount: 100 });
      model.reduceAmount(30);
      
      expect(model.amount).to.equal(70);
    });
    
    it('should notify listeners on amount change', function() {
      const model = new ResourceModel(100, 100, 32, 32, { amount: 100 });
      const listener = sinon.spy();
      
      model.addChangeListener(listener);
      model.reduceAmount(25);
      
      expect(listener.calledOnce).to.be.true;
      expect(listener.firstCall.args[0]).to.equal('amount');
      expect(listener.firstCall.args[1].amount).to.equal(75);
      expect(listener.firstCall.args[1].delta).to.equal(-25);
    });
    
    it('should not reduce below zero', function() {
      const model = new ResourceModel(100, 100, 32, 32, { amount: 50 });
      model.reduceAmount(100);
      
      expect(model.amount).to.equal(0);
    });
    
    it('should mark as depleted when amount reaches zero', function() {
      const model = new ResourceModel(100, 100, 32, 32, { amount: 30 });
      model.reduceAmount(30);
      
      expect(model.amount).to.equal(0);
      expect(model.isDepleted()).to.be.true;
    });
    
    it('should notify depleted event', function() {
      const model = new ResourceModel(100, 100, 32, 32, { amount: 20 });
      const listener = sinon.spy();
      
      model.addChangeListener(listener);
      model.reduceAmount(20);
      
      // Should have two notifications: amount change and depleted
      expect(listener.calledTwice).to.be.true;
      expect(listener.secondCall.args[0]).to.equal('depleted');
    });
    
    it('should mark as inactive when depleted', function() {
      const model = new ResourceModel(100, 100, 32, 32, { amount: 10 });
      model.reduceAmount(10);
      
      expect(model.isActive).to.be.false;
    });
  });
  
  describe('Collision Detection', function() {
    it('should detect point containment', function() {
      const model = new ResourceModel(100, 100, 32, 32);
      
      expect(model.contains(100, 100)).to.be.true;
      expect(model.contains(110, 110)).to.be.true;
      expect(model.contains(200, 200)).to.be.false;
    });
    
    it('should detect collision with other resources', function() {
      const model1 = new ResourceModel(100, 100, 32, 32);
      const model2 = new ResourceModel(110, 110, 32, 32);
      const model3 = new ResourceModel(200, 200, 32, 32);
      
      expect(model1.collidesWith(model2)).to.be.true;
      expect(model1.collidesWith(model3)).to.be.false;
    });
  });
  
  describe('Serialization', function() {
    it('should serialize to JSON', function() {
      const model = new ResourceModel(100, 150, 32, 48, { 
        type: 'Wood', 
        amount: 75 
      });
      const json = model.toJSON();
      
      expect(json.id).to.exist;
      expect(json.type).to.equal('Wood');
      expect(json.position.x).to.equal(100);
      expect(json.position.y).to.equal(150);
      expect(json.size.width).to.equal(32);
      expect(json.size.height).to.equal(48);
      expect(json.amount).to.equal(75);
    });
    
    it('should deserialize from JSON', function() {
      const json = {
        id: 'resource_test_123',
        type: 'Stone',
        position: { x: 200, y: 250 },
        size: { width: 40, height: 40 },
        amount: 150
      };
      
      const model = ResourceModel.fromJSON(json);
      
      expect(model.id).to.equal('resource_test_123');
      expect(model.type).to.equal('Stone');
      expect(model.position.x).to.equal(200);
      expect(model.position.y).to.equal(250);
      expect(model.size.width).to.equal(40);
      expect(model.size.height).to.equal(40);
      expect(model.amount).to.equal(150);
    });
  });
  
  describe('Resource Types', function() {
    it('should support Food type', function() {
      const model = new ResourceModel(100, 100, 32, 32, { type: 'Food' });
      expect(model.type).to.equal('Food');
    });
    
    it('should support Wood type', function() {
      const model = new ResourceModel(100, 100, 32, 32, { type: 'Wood' });
      expect(model.type).to.equal('Wood');
    });
    
    it('should support Stone type', function() {
      const model = new ResourceModel(100, 100, 32, 32, { type: 'Stone' });
      expect(model.type).to.equal('Stone');
    });
  });
  
  describe('Update Lifecycle', function() {
    it('should have update method', function() {
      const model = new ResourceModel(100, 100, 32, 32);
      expect(model.update).to.be.a('function');
    });
    
    it('should call update without errors', function() {
      const model = new ResourceModel(100, 100, 32, 32);
      expect(() => model.update(16.67)).to.not.throw();
    });
    
    it('should not update if inactive', function() {
      const model = new ResourceModel(100, 100, 32, 32, { amount: 10 });
      model.reduceAmount(10); // Depletes and makes inactive
      
      const listener = sinon.spy();
      model.addChangeListener(listener);
      
      model.update(16.67);
      
      // No updates should happen
      expect(listener.called).to.be.false;
    });
  });
  
  describe('Cleanup', function() {
    it('should destroy properly', function() {
      const model = new ResourceModel(100, 100, 32, 32);
      model.destroy();
      
      expect(model.isActive).to.be.false;
      expect(model._changeListeners.length).to.equal(0);
    });
  });
});
