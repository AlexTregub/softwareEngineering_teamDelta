const { expect } = require('chai');
const ResourceManager = require('../../../Classes/managers/ResourceManager.js');

describe('ResourceManager', function() {
  let manager;
  let mockEntity;
  let mockResource;
  
  beforeEach(function() {
    mockEntity = {
      posX: 100,
      posY: 100,
      moveToLocation: function(x, y) { this.posX = x; this.posY = y; },
      jobName: 'Worker'
    };
    
    mockResource = {
      type: 'food',
      x: 100,
      y: 100,
      amount: 1,
      pickUp: function() {},
      drop: function() {}
    };
    
    manager = new ResourceManager(mockEntity);
  });
  
  describe('Constructor', function() {
    it('should initialize with parent entity', function() {
      expect(manager.parentEntity).to.equal(mockEntity);
    });
    
    it('should initialize with default maxCapacity of 2', function() {
      expect(manager.maxCapacity).to.equal(2);
    });
    
    it('should initialize with custom maxCapacity', function() {
      const customManager = new ResourceManager(mockEntity, 10);
      expect(customManager.maxCapacity).to.equal(10);
    });
    
    it('should initialize with default collectionRange of 25', function() {
      expect(manager.collectionRange).to.equal(25);
    });
    
    it('should initialize with custom collectionRange', function() {
      const customManager = new ResourceManager(mockEntity, 2, 50);
      expect(customManager.collectionRange).to.equal(50);
    });
    
    it('should initialize empty resources array', function() {
      expect(manager.resources).to.be.an('array').that.is.empty;
    });
    
    it('should initialize isDroppingOff to false', function() {
      expect(manager.isDroppingOff).to.be.false;
    });
    
    it('should initialize isAtMaxCapacity to false', function() {
      expect(manager.isAtMaxCapacity).to.be.false;
    });
    
    it('should initialize selectedResourceType to null', function() {
      expect(manager.selectedResourceType).to.be.null;
    });
    
    it('should initialize highlightSelectedType to true', function() {
      expect(manager.highlightSelectedType).to.be.true;
    });
    
    it('should initialize focusedCollection to false', function() {
      expect(manager.focusedCollection).to.be.false;
    });
  });
  
  describe('getCurrentLoad()', function() {
    it('should return 0 when no resources', function() {
      expect(manager.getCurrentLoad()).to.equal(0);
    });
    
    it('should return correct count with resources', function() {
      manager.resources = [mockResource, mockResource, mockResource];
      expect(manager.getCurrentLoad()).to.equal(3);
    });
    
    it('should update when resources are added', function() {
      expect(manager.getCurrentLoad()).to.equal(0);
      manager.addResource(mockResource);
      expect(manager.getCurrentLoad()).to.equal(1);
    });
    
    it('should update when resources are removed', function() {
      manager.resources = [mockResource, mockResource];
      expect(manager.getCurrentLoad()).to.equal(2);
      manager.dropAllResources();
      expect(manager.getCurrentLoad()).to.equal(0);
    });
  });
  
  describe('isAtMaxLoad()', function() {
    it('should return false when empty', function() {
      expect(manager.isAtMaxLoad()).to.be.false;
    });
    
    it('should return false when below capacity', function() {
      manager.addResource(mockResource);
      expect(manager.isAtMaxLoad()).to.be.false;
    });
    
    it('should return true when at capacity', function() {
      manager.addResource(mockResource);
      manager.addResource(mockResource);
      expect(manager.isAtMaxLoad()).to.be.true;
    });
    
    it('should return false after dropping resources', function() {
      manager.addResource(mockResource);
      manager.addResource(mockResource);
      manager.dropAllResources();
      expect(manager.isAtMaxLoad()).to.be.false;
    });
    
    it('should respect custom capacity limits', function() {
      const customManager = new ResourceManager(mockEntity, 5);
      for (let i = 0; i < 4; i++) {
        customManager.addResource({ ...mockResource });
      }
      expect(customManager.isAtMaxLoad()).to.be.false;
      customManager.addResource({ ...mockResource });
      expect(customManager.isAtMaxLoad()).to.be.true;
    });
  });
  
  describe('getRemainingCapacity()', function() {
    it('should return maxCapacity when empty', function() {
      expect(manager.getRemainingCapacity()).to.equal(2);
    });
    
    it('should return correct remaining capacity', function() {
      manager.addResource(mockResource);
      expect(manager.getRemainingCapacity()).to.equal(1);
    });
    
    it('should return 0 when at max capacity', function() {
      manager.addResource(mockResource);
      manager.addResource(mockResource);
      expect(manager.getRemainingCapacity()).to.equal(0);
    });
    
    it('should update after dropping resources', function() {
      manager.addResource(mockResource);
      manager.addResource(mockResource);
      expect(manager.getRemainingCapacity()).to.equal(0);
      manager.dropAllResources();
      expect(manager.getRemainingCapacity()).to.equal(2);
    });
    
    it('should handle custom capacity correctly', function() {
      const customManager = new ResourceManager(mockEntity, 10);
      customManager.addResource(mockResource);
      expect(customManager.getRemainingCapacity()).to.equal(9);
    });
  });
  
  describe('addResource()', function() {
    it('should add resource successfully', function() {
      const result = manager.addResource(mockResource);
      expect(result).to.be.true;
      expect(manager.resources).to.include(mockResource);
    });
    
    it('should return false when at max capacity', function() {
      manager.addResource(mockResource);
      manager.addResource(mockResource);
      const result = manager.addResource(mockResource);
      expect(result).to.be.false;
    });
    
    it('should not add resource when at max capacity', function() {
      manager.addResource(mockResource);
      manager.addResource(mockResource);
      const initialLength = manager.resources.length;
      manager.addResource(mockResource);
      expect(manager.resources.length).to.equal(initialLength);
    });
    
    it('should update isAtMaxCapacity when reaching limit', function() {
      expect(manager.isAtMaxCapacity).to.be.false;
      manager.addResource(mockResource);
      expect(manager.isAtMaxCapacity).to.be.false;
      manager.addResource(mockResource);
      expect(manager.isAtMaxCapacity).to.be.true;
    });
    
    it('should handle null resource', function() {
      // addResource checks isAtMaxLoad() first, which doesn't care about null
      // But it will try to push null into the array
      const result = manager.addResource(null);
      expect(result).to.be.true; // Returns true because not at max capacity
      expect(manager.resources).to.include(null);
    });
    
    it('should add multiple different resources', function() {
      const resource1 = { type: 'food', x: 100, y: 100 };
      const resource2 = { type: 'wood', x: 110, y: 110 };
      
      manager.addResource(resource1);
      manager.addResource(resource2);
      
      expect(manager.resources).to.include(resource1);
      expect(manager.resources).to.include(resource2);
    });
    
    it('should maintain resource order', function() {
      const resource1 = { type: 'food' };
      const resource2 = { type: 'wood' };
      
      manager.addResource(resource1);
      manager.addResource(resource2);
      
      expect(manager.resources[0]).to.equal(resource1);
      expect(manager.resources[1]).to.equal(resource2);
    });
  });
  
  describe('dropAllResources()', function() {
    it('should return empty array when no resources', function() {
      const dropped = manager.dropAllResources();
      expect(dropped).to.be.an('array').that.is.empty;
    });
    
    it('should return all carried resources', function() {
      const resource1 = { type: 'food' };
      const resource2 = { type: 'wood' };
      manager.resources = [resource1, resource2];
      
      const dropped = manager.dropAllResources();
      
      expect(dropped).to.have.lengthOf(2);
      expect(dropped).to.include(resource1);
      expect(dropped).to.include(resource2);
    });
    
    it('should clear resources array', function() {
      manager.resources = [mockResource, mockResource];
      manager.dropAllResources();
      expect(manager.resources).to.be.empty;
    });
    
    it('should set isDroppingOff to false', function() {
      manager.isDroppingOff = true;
      manager.dropAllResources();
      expect(manager.isDroppingOff).to.be.false;
    });
    
    it('should set isAtMaxCapacity to false', function() {
      manager.isAtMaxCapacity = true;
      manager.dropAllResources();
      expect(manager.isAtMaxCapacity).to.be.false;
    });
    
    it('should return copy of resources not reference', function() {
      manager.resources = [mockResource];
      const dropped = manager.dropAllResources();
      
      dropped.push(mockResource);
      expect(manager.resources).to.be.empty;
    });
  });
  
  describe('startDropOff()', function() {
    it('should set isDroppingOff to true', function() {
      manager.startDropOff(0, 0);
      expect(manager.isDroppingOff).to.be.true;
    });
    
    it('should set isAtMaxCapacity to true', function() {
      manager.startDropOff(0, 0);
      expect(manager.isAtMaxCapacity).to.be.true;
    });
    
    it('should call moveToLocation on parent entity', function() {
      let movedTo = null;
      mockEntity.moveToLocation = function(x, y) { movedTo = { x, y }; };
      
      manager.startDropOff(50, 75);
      
      expect(movedTo).to.deep.equal({ x: 50, y: 75 });
    });
    
    it('should handle entity without moveToLocation', function() {
      delete mockEntity.moveToLocation;
      expect(() => manager.startDropOff(0, 0)).to.not.throw();
    });
    
    it('should handle null entity', function() {
      manager.parentEntity = null;
      expect(() => manager.startDropOff(0, 0)).to.not.throw();
    });
    
    it('should handle negative coordinates', function() {
      let movedTo = null;
      mockEntity.moveToLocation = function(x, y) { movedTo = { x, y }; };
      
      manager.startDropOff(-10, -20);
      
      expect(movedTo).to.deep.equal({ x: -10, y: -20 });
    });
  });
  
  describe('processDropOff()', function() {
    it('should drop all resources into global array', function() {
      const globalArray = [];
      manager.resources = [mockResource, mockResource];
      
      manager.processDropOff(globalArray);
      
      expect(globalArray).to.have.lengthOf(2);
    });
    
    it('should call drop() on each resource', function() {
      let dropCalled = 0;
      const resource = {
        ...mockResource,
        drop: function() { dropCalled++; }
      };
      manager.resources = [resource, resource];
      
      manager.processDropOff([]);
      
      expect(dropCalled).to.equal(2);
    });
    
    it('should return dropped resources', function() {
      const resource1 = { ...mockResource };
      const resource2 = { ...mockResource };
      manager.resources = [resource1, resource2];
      
      const dropped = manager.processDropOff([]);
      
      expect(dropped).to.include(resource1);
      expect(dropped).to.include(resource2);
    });
    
    it('should handle null globalResourceArray', function() {
      manager.resources = [mockResource];
      const result = manager.processDropOff(null);
      expect(result).to.be.empty;
    });
    
    it('should handle undefined globalResourceArray', function() {
      manager.resources = [mockResource];
      const result = manager.processDropOff(undefined);
      expect(result).to.be.empty;
    });
    
    it('should handle resources without drop method', function() {
      const resource = { type: 'food' };
      manager.resources = [resource];
      
      expect(() => manager.processDropOff([])).to.not.throw();
    });
    
    it('should handle drop() method throwing error', function() {
      const resource = {
        ...mockResource,
        drop: function() { throw new Error('Drop failed'); }
      };
      manager.resources = [resource];
      
      expect(() => manager.processDropOff([])).to.not.throw();
    });
    
    it('should clear manager resources after processing', function() {
      manager.resources = [mockResource, mockResource];
      manager.processDropOff([]);
      expect(manager.resources).to.be.empty;
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle capacity of 0', function() {
      const zeroCapManager = new ResourceManager(mockEntity, 0);
      expect(zeroCapManager.isAtMaxLoad()).to.be.true;
      expect(zeroCapManager.addResource(mockResource)).to.be.false;
    });
    
    it('should handle capacity of 1', function() {
      const oneCapManager = new ResourceManager(mockEntity, 1);
      expect(oneCapManager.addResource(mockResource)).to.be.true;
      expect(oneCapManager.isAtMaxLoad()).to.be.true;
    });
    
    it('should handle very large capacity', function() {
      const largeCapManager = new ResourceManager(mockEntity, 1000);
      expect(largeCapManager.maxCapacity).to.equal(1000);
      expect(largeCapManager.getRemainingCapacity()).to.equal(1000);
    });
    
    it('should handle negative collection range', function() {
      const negRangeManager = new ResourceManager(mockEntity, 2, -10);
      expect(negRangeManager.collectionRange).to.equal(-10);
    });
    
    it('should handle adding same resource multiple times', function() {
      manager.addResource(mockResource);
      manager.addResource(mockResource);
      expect(manager.resources).to.have.lengthOf(2);
    });
    
    it('should maintain state after rapid add/drop cycles', function() {
      for (let i = 0; i < 10; i++) {
        manager.addResource(mockResource);
        manager.dropAllResources();
      }
      expect(manager.resources).to.be.empty;
      expect(manager.isAtMaxCapacity).to.be.false;
    });
    
    it('should handle entity with only posX', function() {
      const partialEntity = { posX: 50 };
      const partialManager = new ResourceManager(partialEntity);
      expect(partialManager.parentEntity.posX).to.equal(50);
    });
    
    it('should handle entity with getPosition method', function() {
      const advEntity = {
        getPosition: function() { return { x: 200, y: 300 }; }
      };
      const advManager = new ResourceManager(advEntity);
      expect(advManager.parentEntity.getPosition()).to.deep.equal({ x: 200, y: 300 });
    });
  });
});
