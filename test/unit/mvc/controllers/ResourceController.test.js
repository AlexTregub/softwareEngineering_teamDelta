/**
 * Unit tests for ResourceController
 * TDD: Write tests FIRST, then implement
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Load dependencies
const ResourceModel = require('../../../../Classes/mvc/models/ResourceModel');
const EntityController = require('../../../../Classes/mvc/controllers/EntityController');
const ResourceController = require('../../../../Classes/mvc/controllers/ResourceController');

describe('ResourceController', function() {
  let model, controller;
  
  beforeEach(function() {
    // Create resource model
    model = new ResourceModel({
      x: 100,
      y: 200,
      resourceType: 'greenLeaf',
      amount: 5,
      weight: 1
    });
    
    // Create controller
    controller = new ResourceController();
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Constructor', function() {
    it('should create a ResourceController', function() {
      expect(controller).to.exist;
      expect(controller).to.be.an.instanceOf(ResourceController);
    });
    
    it('should extend EntityController', function() {
      expect(controller).to.be.an.instanceOf(EntityController);
    });
  });
  
  describe('Pickup Mechanics', function() {
    it('should set carriedBy when picked up', function() {
      expect(model.carriedBy).to.be.null;
      
      controller.pickup(model, 'ant_123');
      
      expect(model.carriedBy).to.equal('ant_123');
    });
    
    it('should throw if already carried', function() {
      model.carriedBy = 'ant_123';
      
      expect(() => controller.pickup(model, 'ant_456')).to.throw('Resource already carried');
    });
    
    it('should throw if carrier ID is null', function() {
      expect(() => controller.pickup(model, null)).to.throw('Carrier ID required');
    });
  });
  
  describe('Drop Mechanics', function() {
    it('should clear carriedBy when dropped', function() {
      model.carriedBy = 'ant_123';
      
      controller.drop(model);
      
      expect(model.carriedBy).to.be.null;
    });
    
    it('should set position when dropped', function() {
      model.carriedBy = 'ant_123';
      
      controller.drop(model, 300, 400);
      
      const pos = model.getPosition();
      expect(pos.x).to.equal(300);
      expect(pos.y).to.equal(400);
      expect(model.carriedBy).to.be.null;
    });
    
    it('should handle drop without position (keep current)', function() {
      model.carriedBy = 'ant_123';
      const originalPos = model.getPosition();
      
      controller.drop(model);
      
      const pos = model.getPosition();
      expect(pos.x).to.equal(originalPos.x);
      expect(pos.y).to.equal(originalPos.y);
    });
  });
  
  describe('Carried State', function() {
    it('should return true if resource is carried', function() {
      model.carriedBy = 'ant_123';
      
      expect(controller.isCarried(model)).to.be.true;
    });
    
    it('should return false if resource is not carried', function() {
      model.carriedBy = null;
      
      expect(controller.isCarried(model)).to.be.false;
    });
  });
  
  describe('Weight System', function() {
    it('should track resource weight', function() {
      expect(model.weight).to.equal(1);
    });
    
    it('should handle heavy resources', function() {
      model.weight = 10;
      
      controller.update(model, 16);
      
      expect(model.weight).to.equal(10);
    });
    
    it('should handle weightless resources', function() {
      model.weight = 0;
      
      controller.update(model, 16);
      
      expect(model.weight).to.equal(0);
    });
  });
  
  describe('Amount System', function() {
    it('should track resource amount', function() {
      expect(model.amount).to.equal(5);
    });
    
    it('should handle amount changes', function() {
      controller.update(model, 16);
      
      // Amount might change due to consumption/collection
      expect(model.amount).to.be.a('number');
    });
    
    it('should handle zero amount (resource depleted)', function() {
      model.amount = 0;
      
      controller.update(model, 16);
      
      // Depleted resources might be disabled
      expect(model.amount).to.equal(0);
    });
  });
  
  describe('Resource Type', function() {
    it('should handle greenLeaf type', function() {
      model.resourceType = 'greenLeaf';
      
      controller.update(model, 16);
      
      expect(model.resourceType).to.equal('greenLeaf');
    });
    
    it('should handle stick type', function() {
      model.resourceType = 'stick';
      
      controller.update(model, 16);
      
      expect(model.resourceType).to.equal('stick');
    });
    
    it('should handle stone type', function() {
      model.resourceType = 'stone';
      
      controller.update(model, 16);
      
      expect(model.resourceType).to.equal('stone');
    });
  });
  
  describe('Update Behavior', function() {
    it('should update resource state', function() {
      controller.update(model, 16);
      
      // Basic update should complete without errors
      expect(model.enabled).to.be.true;
    });
    
    it('should not update disabled resources', function() {
      model.enabled = false;
      const originalPos = model.getPosition();
      
      controller.update(model, 16);
      
      const pos = model.getPosition();
      expect(pos.x).to.equal(originalPos.x);
      expect(pos.y).to.equal(originalPos.y);
    });
  });
  
  describe('Performance', function() {
    it('should update 100 resources quickly', function() {
      const models = [];
      for (let i = 0; i < 100; i++) {
        models.push(new ResourceModel({
          x: i * 10,
          y: i * 10,
          resourceType: 'greenLeaf',
          amount: 5
        }));
      }
      
      const startTime = Date.now();
      
      models.forEach(m => controller.update(m, 16));
      
      const elapsed = Date.now() - startTime;
      expect(elapsed).to.be.lessThan(100); // Should be fast
    });
  });
});
