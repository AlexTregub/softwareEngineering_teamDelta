const { expect } = require('chai');

// Mock p5.js random function
global.random = (min, max) => min + Math.random() * (max - min);

// Mock global resources array
global.resources = [];

// Load the module
const InventoryController = require('../../../Classes/controllers/InventoryController.js');

describe('InventoryController', function() {
  let owner;
  let inventory;
  
  beforeEach(function() {
    global.resources = [];
    
    owner = {
      id: 'test-owner',
      posX: 100,
      posY: 100,
      getPosition: function() { return { x: this.posX, y: this.posY }; }
    };
    
    inventory = new InventoryController(owner, 2);
  });
  
  describe('Constructor', function() {
    it('should initialize with owner reference', function() {
      expect(inventory.owner).to.equal(owner);
    });
    
    it('should set default capacity to 2', function() {
      const inv = new InventoryController(owner);
      expect(inv.capacity).to.equal(2);
    });
    
    it('should accept custom capacity', function() {
      const inv = new InventoryController(owner, 5);
      expect(inv.capacity).to.equal(5);
    });
    
    it('should enforce minimum capacity of 1', function() {
      const inv = new InventoryController(owner, 0);
      expect(inv.capacity).to.equal(1);
    });
    
    it('should initialize empty slots array', function() {
      expect(inventory.slots).to.be.an('array').with.lengthOf(2);
      expect(inventory.slots.every(s => s === null)).to.be.true;
    });
  });
  
  describe('getCount()', function() {
    it('should return 0 for empty inventory', function() {
      expect(inventory.getCount()).to.equal(0);
    });
    
    it('should count occupied slots', function() {
      inventory.slots[0] = { type: 'wood' };
      expect(inventory.getCount()).to.equal(1);
    });
    
    it('should ignore null slots', function() {
      inventory.slots[0] = { type: 'wood' };
      inventory.slots[1] = null;
      expect(inventory.getCount()).to.equal(1);
    });
    
    it('should count multiple occupied slots', function() {
      inventory.slots[0] = { type: 'wood' };
      inventory.slots[1] = { type: 'stone' };
      expect(inventory.getCount()).to.equal(2);
    });
  });
  
  describe('isFull()', function() {
    it('should return false when empty', function() {
      expect(inventory.isFull()).to.be.false;
    });
    
    it('should return false when partially full', function() {
      inventory.slots[0] = { type: 'wood' };
      expect(inventory.isFull()).to.be.false;
    });
    
    it('should return true when all slots occupied', function() {
      inventory.slots[0] = { type: 'wood' };
      inventory.slots[1] = { type: 'stone' };
      expect(inventory.isFull()).to.be.true;
    });
  });
  
  describe('isEmpty()', function() {
    it('should return true when empty', function() {
      expect(inventory.isEmpty()).to.be.true;
    });
    
    it('should return false when any slot occupied', function() {
      inventory.slots[0] = { type: 'wood' };
      expect(inventory.isEmpty()).to.be.false;
    });
  });
  
  describe('getSlot()', function() {
    it('should return null for empty slot', function() {
      expect(inventory.getSlot(0)).to.be.null;
    });
    
    it('should return resource from slot', function() {
      const resource = { type: 'wood' };
      inventory.slots[0] = resource;
      expect(inventory.getSlot(0)).to.equal(resource);
    });
    
    it('should return null for invalid index', function() {
      expect(inventory.getSlot(10)).to.be.null;
    });
    
    it('should return null for negative index', function() {
      expect(inventory.getSlot(-1)).to.be.null;
    });
  });
  
  describe('getResources()', function() {
    it('should return shallow copy of slots', function() {
      const resources = inventory.getResources();
      expect(resources).to.be.an('array');
      expect(resources).to.not.equal(inventory.slots);
    });
    
    it('should include all slots', function() {
      inventory.slots[0] = { type: 'wood' };
      const resources = inventory.getResources();
      expect(resources).to.have.lengthOf(2);
      expect(resources[0]).to.deep.equal({ type: 'wood' });
    });
  });
  
  describe('addResource()', function() {
    it('should add resource to first empty slot', function() {
      const resource = { type: 'wood', pickUp: function() {} };
      const result = inventory.addResource(resource);
      
      expect(result).to.be.true;
      expect(inventory.slots[0]).to.equal(resource);
    });
    
    it('should call pickUp method on resource', function() {
      let pickUpCalled = false;
      let pickUpOwner = null;
      
      const resource = {
        type: 'wood',
        pickUp: function(owner) {
          pickUpCalled = true;
          pickUpOwner = owner;
        }
      };
      
      inventory.addResource(resource);
      expect(pickUpCalled).to.be.true;
      expect(pickUpOwner).to.equal(owner);
    });
    
    it('should return false when inventory full', function() {
      inventory.slots[0] = { type: 'wood' };
      inventory.slots[1] = { type: 'stone' };
      
      const resource = { type: 'iron' };
      const result = inventory.addResource(resource);
      expect(result).to.be.false;
    });
    
    it('should return false for null resource', function() {
      expect(inventory.addResource(null)).to.be.false;
    });
    
    it('should return false for undefined resource', function() {
      expect(inventory.addResource(undefined)).to.be.false;
    });
    
    it('should handle resource without pickUp method', function() {
      const resource = { type: 'wood' };
      expect(() => inventory.addResource(resource)).to.not.throw();
      expect(inventory.slots[0]).to.equal(resource);
    });
    
    it('should fill slots sequentially', function() {
      const res1 = { type: 'wood' };
      const res2 = { type: 'stone' };
      
      inventory.addResource(res1);
      inventory.addResource(res2);
      
      expect(inventory.slots[0]).to.equal(res1);
      expect(inventory.slots[1]).to.equal(res2);
    });
  });
  
  describe('addResourceToSlot()', function() {
    it('should add resource to specific slot', function() {
      const resource = { type: 'wood', pickUp: function() {} };
      const result = inventory.addResourceToSlot(1, resource);
      
      expect(result).to.be.true;
      expect(inventory.slots[1]).to.equal(resource);
    });
    
    it('should call pickUp method', function() {
      let called = false;
      const resource = {
        type: 'wood',
        pickUp: function() { called = true; }
      };
      
      inventory.addResourceToSlot(0, resource);
      expect(called).to.be.true;
    });
    
    it('should return false if slot occupied', function() {
      inventory.slots[0] = { type: 'wood' };
      const resource = { type: 'stone' };
      
      expect(inventory.addResourceToSlot(0, resource)).to.be.false;
    });
    
    it('should return false for invalid index', function() {
      const resource = { type: 'wood' };
      expect(inventory.addResourceToSlot(10, resource)).to.be.false;
    });
    
    it('should return false for negative index', function() {
      const resource = { type: 'wood' };
      expect(inventory.addResourceToSlot(-1, resource)).to.be.false;
    });
    
    it('should return false for null resource', function() {
      expect(inventory.addResourceToSlot(0, null)).to.be.false;
    });
  });
  
  describe('removeResource()', function() {
    beforeEach(function() {
      global.resources = [];
    });
    
    it('should remove resource from slot', function() {
      const resource = { type: 'wood', drop: function() {} };
      inventory.slots[0] = resource;
      
      const removed = inventory.removeResource(0, false);
      expect(removed).to.equal(resource);
      expect(inventory.slots[0]).to.be.null;
    });
    
    it('should call drop method on resource', function() {
      let dropCalled = false;
      const resource = {
        type: 'wood',
        drop: function() { dropCalled = true; }
      };
      
      inventory.slots[0] = resource;
      inventory.removeResource(0, false);
      expect(dropCalled).to.be.true;
    });
    
    it('should return null for empty slot', function() {
      expect(inventory.removeResource(0, false)).to.be.null;
    });
    
    it('should return null for invalid index', function() {
      expect(inventory.removeResource(10, false)).to.be.null;
    });
    
    it('should return null for negative index', function() {
      expect(inventory.removeResource(-1, false)).to.be.null;
    });
    
    it('should drop resource to ground when dropToGround=true', function() {
      const resource = {
        type: 'wood',
        posX: 0,
        posY: 0,
        drop: function() {}
      };
      
      inventory.slots[0] = resource;
      inventory.removeResource(0, true);
      
      expect(global.resources).to.have.lengthOf(1);
      expect(global.resources[0]).to.equal(resource);
    });
    
    it('should position dropped resource near owner', function() {
      const resource = {
        type: 'wood',
        posX: 0,
        posY: 0,
        drop: function() {}
      };
      
      inventory.slots[0] = resource;
      inventory.removeResource(0, true);
      
      expect(resource.posX).to.be.closeTo(100, 10);
      expect(resource.posY).to.be.closeTo(100, 10);
    });
    
    it('should not drop when dropToGround=false', function() {
      const resource = {
        type: 'wood',
        posX: 0,
        posY: 0,
        drop: function() {}
      };
      
      inventory.slots[0] = resource;
      inventory.removeResource(0, false);
      
      expect(global.resources).to.be.empty;
    });
    
    it('should handle resource without drop method', function() {
      const resource = { type: 'wood' };
      inventory.slots[0] = resource;
      
      expect(() => inventory.removeResource(0, false)).to.not.throw();
    });
  });
  
  describe('dropAll()', function() {
    it('should remove all resources', function() {
      inventory.slots[0] = { type: 'wood', drop: function() {} };
      inventory.slots[1] = { type: 'stone', drop: function() {} };
      
      inventory.dropAll();
      
      expect(inventory.isEmpty()).to.be.true;
    });
    
    it('should call drop on all resources', function() {
      let dropCount = 0;
      
      inventory.slots[0] = { type: 'wood', drop: () => dropCount++ };
      inventory.slots[1] = { type: 'stone', drop: () => dropCount++ };
      
      inventory.dropAll();
      expect(dropCount).to.equal(2);
    });
    
    it('should handle empty inventory', function() {
      expect(() => inventory.dropAll()).to.not.throw();
    });
  });
  
  describe('containsType()', function() {
    it('should return true when type exists', function() {
      inventory.slots[0] = { type: 'wood' };
      expect(inventory.containsType('wood')).to.be.true;
    });
    
    it('should return false when type not found', function() {
      inventory.slots[0] = { type: 'wood' };
      expect(inventory.containsType('stone')).to.be.false;
    });
    
    it('should return false for empty inventory', function() {
      expect(inventory.containsType('wood')).to.be.false;
    });
    
    it('should handle null slots', function() {
      inventory.slots[0] = null;
      inventory.slots[1] = { type: 'wood' };
      expect(inventory.containsType('wood')).to.be.true;
    });
  });
  
  describe('transferAllTo()', function() {
    let targetInventory;
    
    beforeEach(function() {
      targetInventory = new InventoryController({ id: 'target' }, 3);
    });
    
    it('should transfer all resources to target', function() {
      inventory.slots[0] = { type: 'wood', pickUp: function() {} };
      inventory.slots[1] = { type: 'stone', pickUp: function() {} };
      
      const transferred = inventory.transferAllTo(targetInventory);
      
      expect(transferred).to.equal(2);
      expect(inventory.isEmpty()).to.be.true;
      expect(targetInventory.getCount()).to.equal(2);
    });
    
    it('should return 0 for null target', function() {
      inventory.slots[0] = { type: 'wood' };
      expect(inventory.transferAllTo(null)).to.equal(0);
    });
    
    it('should return 0 for invalid target', function() {
      inventory.slots[0] = { type: 'wood' };
      expect(inventory.transferAllTo({})).to.equal(0);
    });
    
    it('should stop when target full', function() {
      inventory.slots[0] = { type: 'wood', pickUp: function() {} };
      inventory.slots[1] = { type: 'stone', pickUp: function() {} };
      
      const smallTarget = new InventoryController({ id: 'small' }, 1);
      const transferred = inventory.transferAllTo(smallTarget);
      
      expect(transferred).to.equal(1);
      expect(inventory.getCount()).to.equal(1);
    });
    
    it('should handle empty inventory', function() {
      expect(inventory.transferAllTo(targetInventory)).to.equal(0);
    });
    
    it('should preserve resource references', function() {
      const resource = { type: 'wood', pickUp: function() {} };
      inventory.slots[0] = resource;
      
      inventory.transferAllTo(targetInventory);
      expect(targetInventory.slots[0]).to.equal(resource);
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle very large capacity', function() {
      const largeInv = new InventoryController(owner, 1000);
      expect(largeInv.capacity).to.equal(1000);
      expect(largeInv.slots).to.have.lengthOf(1000);
    });
    
    it('should handle negative capacity', function() {
      const inv = new InventoryController(owner, -5);
      expect(inv.capacity).to.equal(1);
    });
    
    it('should reject fractional capacity', function() {
      // Array() doesn't accept fractional lengths
      expect(() => new InventoryController(owner, 2.7)).to.throw();
    });
    
    it('should handle resource without type', function() {
      const resource = { value: 10 };
      inventory.addResource(resource);
      expect(inventory.getCount()).to.equal(1);
    });
    
    it('should require global resources array for dropToGround', function() {
      const originalResources = global.resources;
      delete global.resources;
      
      const resource = { type: 'wood', posX: 0, posY: 0, drop: function() {} };
      inventory.slots[0] = resource;
      
      // Will throw because it references global resources
      expect(() => inventory.removeResource(0, true)).to.throw();
      
      // Restore global
      global.resources = originalResources;
    });
    
    it('should handle owner without position', function() {
      const noPositionOwner = { id: 'test' };
      const inv = new InventoryController(noPositionOwner, 2);
      
      const resource = { type: 'wood', posX: 0, posY: 0, drop: function() {} };
      inv.slots[0] = resource;
      
      expect(() => inv.removeResource(0, true)).to.not.throw();
    });
  });
});
