/**
 * @file AntModel-ResourceManager.integration.test.js
 * @description Integration tests for AntModel's ResourceManager integration
 * 
 * Tests the full resource collection, inventory management, and drop-off workflow
 * between AntModel and ResourceManager components.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupTestEnvironment, cleanupTestEnvironment } = require('../../helpers/mvcTestHelpers');

// Setup test environment
setupTestEnvironment();

describe('AntModel - ResourceManager Integration', function() {
  let AntModel, ResourceManager;
  
  before(function() {
    const BaseModel = require('../../../Classes/models/BaseModel');
    AntModel = require('../../../Classes/models/AntModel');
    ResourceManager = require('../../../Classes/managers/ResourceManager');
  });
  
  afterEach(function() {
    cleanupTestEnvironment();
  });
  
  // ========================================
  // Basic Integration Tests
  // ========================================
  
  describe('ResourceManager Integration', function() {
    it('should create ResourceManager on construction', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      expect(model.resourceManager).to.exist;
      expect(model.resourceManager).to.be.instanceOf(ResourceManager);
    });
    
    it('should configure ResourceManager with correct capacity', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      expect(model.resourceManager.maxCapacity).to.equal(2);
    });
    
    it('should configure ResourceManager with correct collection range', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      expect(model.resourceManager.collectionRange).to.equal(25);
    });
    
    it('should set parentEntity reference in ResourceManager', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      expect(model.resourceManager.parentEntity).to.equal(model);
    });
  });
  
  // ========================================
  // Resource Addition Tests
  // ========================================
  
  describe('Adding Resources', function() {
    it('should add resource to inventory', function() {
      const model = new AntModel(100, 100, 32, 32);
      const resource = { type: 'food', amount: 10 };
      
      const result = model.addResource(resource);
      
      expect(result).to.be.true;
      expect(model.getResourceCount()).to.equal(1);
    });
    
    it('should notify listeners when resource added', function() {
      const model = new AntModel(100, 100, 32, 32);
      const listener = sinon.spy();
      model.addChangeListener(listener);
      const resource = { type: 'food', amount: 10 };
      
      model.addResource(resource);
      
      expect(listener.calledOnce).to.be.true;
      expect(listener.firstCall.args[0]).to.equal('resources');
      expect(listener.firstCall.args[1]).to.have.property('action', 'add');
      expect(listener.firstCall.args[1]).to.have.property('resource', resource);
    });
    
    it('should track resource count correctly', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      expect(model.getResourceCount()).to.equal(0);
      
      model.addResource({ type: 'food', amount: 5 });
      expect(model.getResourceCount()).to.equal(1);
      
      model.addResource({ type: 'wood', amount: 3 });
      expect(model.getResourceCount()).to.equal(2);
    });
    
    it('should respect max capacity (2 resources)', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      model.addResource({ type: 'food', amount: 5 });
      model.addResource({ type: 'wood', amount: 3 });
      
      const thirdResource = model.addResource({ type: 'stone', amount: 2 });
      
      expect(thirdResource).to.be.false;
      expect(model.getResourceCount()).to.equal(2);
    });
    
    it('should return false when inventory full', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      model.addResource({ type: 'food', amount: 5 });
      model.addResource({ type: 'wood', amount: 3 });
      
      const result = model.addResource({ type: 'stone', amount: 2 });
      
      expect(result).to.be.false;
    });
    
    it('should include isFull flag in notification when at capacity', function() {
      const model = new AntModel(100, 100, 32, 32);
      let lastNotification;
      model.addChangeListener((prop, data) => { lastNotification = data; });
      
      model.addResource({ type: 'food', amount: 5 });
      model.addResource({ type: 'wood', amount: 3 });
      
      expect(lastNotification).to.have.property('isFull', true);
    });
  });
  
  // ========================================
  // Resource Removal Tests
  // ========================================
  
  describe('Removing Resources', function() {
    it('should remove single resource from inventory', function() {
      const model = new AntModel(100, 100, 32, 32);
      model.addResource({ type: 'food', amount: 5 });
      model.addResource({ type: 'wood', amount: 3 });
      
      model.removeResource(1);
      
      expect(model.getResourceCount()).to.equal(1);
    });
    
    it('should notify listeners when resource removed', function() {
      const model = new AntModel(100, 100, 32, 32);
      model.addResource({ type: 'food', amount: 5 });
      const listener = sinon.spy();
      model.addChangeListener(listener);
      
      model.removeResource(1);
      
      expect(listener.calledOnce).to.be.true;
      expect(listener.firstCall.args[0]).to.equal('resources');
      expect(listener.firstCall.args[1]).to.have.property('action', 'remove');
    });
    
    it('should remove multiple resources', function() {
      const model = new AntModel(100, 100, 32, 32);
      model.addResource({ type: 'food', amount: 5 });
      model.addResource({ type: 'wood', amount: 3 });
      
      model.removeResource(2);
      
      expect(model.getResourceCount()).to.equal(0);
    });
    
    it('should not remove more than available', function() {
      const model = new AntModel(100, 100, 32, 32);
      model.addResource({ type: 'food', amount: 5 });
      
      model.removeResource(5); // Try to remove 5, only 1 resource
      
      expect(model.getResourceCount()).to.equal(0);
    });
    
    it('should return false when removing from empty inventory', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      const result = model.removeResource(1);
      
      expect(result).to.be.false;
    });
  });
  
  // ========================================
  // Drop All Resources Tests
  // ========================================
  
  describe('Dropping All Resources', function() {
    it('should drop all resources', function() {
      const model = new AntModel(100, 100, 32, 32);
      model.addResource({ type: 'food', amount: 5 });
      model.addResource({ type: 'wood', amount: 3 });
      
      const dropped = model.dropAllResources();
      
      expect(dropped).to.be.an('array');
      expect(dropped).to.have.lengthOf(2);
      expect(model.getResourceCount()).to.equal(0);
    });
    
    it('should return dropped resources array', function() {
      const model = new AntModel(100, 100, 32, 32);
      const food = { type: 'food', amount: 5 };
      const wood = { type: 'wood', amount: 3 };
      model.addResource(food);
      model.addResource(wood);
      
      const dropped = model.dropAllResources();
      
      expect(dropped).to.include(food);
      expect(dropped).to.include(wood);
    });
    
    it('should notify listeners when dropping resources', function() {
      const model = new AntModel(100, 100, 32, 32);
      model.addResource({ type: 'food', amount: 5 });
      const listener = sinon.spy();
      model.addChangeListener(listener);
      
      model.dropAllResources();
      
      expect(listener.calledOnce).to.be.true;
      expect(listener.firstCall.args[0]).to.equal('resources');
      expect(listener.firstCall.args[1]).to.have.property('action', 'drop');
    });
    
    it('should handle empty inventory gracefully', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      const dropped = model.dropAllResources();
      
      expect(dropped).to.be.an('array');
      expect(dropped).to.have.lengthOf(0);
    });
    
    it('should clear inventory after drop', function() {
      const model = new AntModel(100, 100, 32, 32);
      model.addResource({ type: 'food', amount: 5 });
      model.addResource({ type: 'wood', amount: 3 });
      
      model.dropAllResources();
      
      expect(model.getResourceCount()).to.equal(0);
      expect(model.resourceManager.isAtMaxLoad()).to.be.false;
    });
  });
  
  // ========================================
  // Resource Capacity Tests
  // ========================================
  
  describe('Resource Capacity Management', function() {
    it('should return correct max capacity', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      expect(model.getMaxResources()).to.equal(2);
    });
    
    it('should track remaining capacity', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      expect(model.resourceManager.getRemainingCapacity()).to.equal(2);
      
      model.addResource({ type: 'food', amount: 5 });
      expect(model.resourceManager.getRemainingCapacity()).to.equal(1);
      
      model.addResource({ type: 'wood', amount: 3 });
      expect(model.resourceManager.getRemainingCapacity()).to.equal(0);
    });
    
    it('should check if at max load', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      expect(model.resourceManager.isAtMaxLoad()).to.be.false;
      
      model.addResource({ type: 'food', amount: 5 });
      expect(model.resourceManager.isAtMaxLoad()).to.be.false;
      
      model.addResource({ type: 'wood', amount: 3 });
      expect(model.resourceManager.isAtMaxLoad()).to.be.true;
    });
    
    it('should reset capacity flags after dropping resources', function() {
      const model = new AntModel(100, 100, 32, 32);
      model.addResource({ type: 'food', amount: 5 });
      model.addResource({ type: 'wood', amount: 3 });
      
      expect(model.resourceManager.isAtMaxLoad()).to.be.true;
      
      model.dropAllResources();
      
      expect(model.resourceManager.isAtMaxLoad()).to.be.false;
    });
  });
  
  // ========================================
  // Workflow Integration Tests
  // ========================================
  
  describe('Complete Resource Workflow', function() {
    it('should complete full collection and drop-off cycle', function() {
      const model = new AntModel(100, 100, 32, 32);
      const listener = sinon.spy();
      model.addChangeListener(listener);
      
      // Collect resources
      model.addResource({ type: 'food', amount: 5 });
      model.addResource({ type: 'wood', amount: 3 });
      
      expect(model.getResourceCount()).to.equal(2);
      expect(listener.callCount).to.equal(2); // 2 add notifications
      
      // Drop off resources
      const dropped = model.dropAllResources();
      
      expect(dropped).to.have.lengthOf(2);
      expect(model.getResourceCount()).to.equal(0);
      expect(listener.callCount).to.equal(3); // +1 drop notification
    });
    
    it('should allow re-collection after dropping', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      // First cycle
      model.addResource({ type: 'food', amount: 5 });
      model.addResource({ type: 'wood', amount: 3 });
      model.dropAllResources();
      
      // Second cycle
      const result1 = model.addResource({ type: 'stone', amount: 2 });
      const result2 = model.addResource({ type: 'food', amount: 8 });
      
      expect(result1).to.be.true;
      expect(result2).to.be.true;
      expect(model.getResourceCount()).to.equal(2);
    });
    
    it('should maintain state across multiple operations', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      // Add one resource
      model.addResource({ type: 'food', amount: 5 });
      expect(model.getResourceCount()).to.equal(1);
      
      // Remove it
      model.removeResource(1);
      expect(model.getResourceCount()).to.equal(0);
      
      // Add two resources
      model.addResource({ type: 'wood', amount: 3 });
      model.addResource({ type: 'stone', amount: 2 });
      expect(model.getResourceCount()).to.equal(2);
      
      // Drop all
      model.dropAllResources();
      expect(model.getResourceCount()).to.equal(0);
    });
  });
  
  // ========================================
  // Update Loop Integration Tests
  // ========================================
  
  describe('Update Loop Integration', function() {
    it('should update ResourceManager during update()', function() {
      const model = new AntModel(100, 100, 32, 32);
      const updateSpy = sinon.spy(model.resourceManager, 'update');
      
      model.update(16);
      
      expect(updateSpy.calledOnce).to.be.true;
    });
    
    it('should not update ResourceManager if inactive', function() {
      const model = new AntModel(100, 100, 32, 32);
      model.die();
      const updateSpy = sinon.spy(model.resourceManager, 'update');
      
      model.update(16);
      
      expect(updateSpy.called).to.be.false;
    });
  });
  
  // ========================================
  // Edge Cases and Error Handling
  // ========================================
  
  describe('Edge Cases', function() {
    it('should handle null resource gracefully', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      const result = model.addResource(null);
      
      // ResourceManager will handle null, result depends on implementation
      expect(model.getResourceCount()).to.be.at.most(1);
    });
    
    it('should handle removing zero resources', function() {
      const model = new AntModel(100, 100, 32, 32);
      model.addResource({ type: 'food', amount: 5 });
      
      model.removeResource(0);
      
      expect(model.getResourceCount()).to.equal(1);
    });
    
    it('should handle negative removal amounts', function() {
      const model = new AntModel(100, 100, 32, 32);
      model.addResource({ type: 'food', amount: 5 });
      
      model.removeResource(-1);
      
      // Should treat as 0 or no-op
      expect(model.getResourceCount()).to.equal(1);
    });
    
    it('should handle resources without type property', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      const result = model.addResource({ amount: 5 }); // No type
      
      expect(result).to.be.true;
      expect(model.getResourceCount()).to.equal(1);
    });
  });
  
  // ========================================
  // Debug and Inspection Tests
  // ========================================
  
  describe('Debug Information', function() {
    it('should provide debug info from ResourceManager', function() {
      const model = new AntModel(100, 100, 32, 32);
      model.addResource({ type: 'food', amount: 5 });
      
      const debugInfo = model.resourceManager.getDebugInfo();
      
      expect(debugInfo).to.be.an('object');
      expect(debugInfo).to.have.property('currentLoad', 1);
      expect(debugInfo).to.have.property('maxCapacity', 2);
      expect(debugInfo).to.have.property('remainingCapacity', 1);
    });
    
    it('should include resource types in debug info', function() {
      const model = new AntModel(100, 100, 32, 32);
      model.addResource({ type: 'food', amount: 5 });
      model.addResource({ type: 'wood', amount: 3 });
      
      const debugInfo = model.resourceManager.getDebugInfo();
      
      expect(debugInfo.resourceTypes).to.be.an('array');
      expect(debugInfo.resourceTypes).to.have.lengthOf(2);
    });
  });
  
  // ========================================
  // Serialization Integration Tests
  // ========================================
  
  describe('Serialization with Resources', function() {
    it('should serialize model with resources', function() {
      const model = new AntModel(100, 100, 32, 32);
      model.addResource({ type: 'food', amount: 5 });
      
      const json = model.toJSON();
      
      expect(json).to.be.an('object');
      expect(json).to.have.property('position');
      expect(json).to.have.property('jobName');
    });
    
    it('should reconstruct model from JSON', function() {
      const original = new AntModel(100, 100, 32, 32);
      original.addResource({ type: 'food', amount: 5 });
      
      const json = original.toJSON();
      const reconstructed = AntModel.fromJSON(json);
      
      expect(reconstructed).to.be.instanceOf(AntModel);
      expect(reconstructed.resourceManager).to.exist;
      expect(reconstructed.getMaxResources()).to.equal(2);
    });
  });
});
