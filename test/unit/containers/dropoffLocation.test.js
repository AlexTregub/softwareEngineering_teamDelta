const { expect } = require('chai');

// Mock p5.js globals
global.TILE_SIZE = 32;
global.NONE = null;
global.push = function() {};
global.pop = function() {};
global.noStroke = function() {};
global.stroke = function() {};
global.strokeWeight = function() {};
global.noFill = function() {};
global.fill = function() {};
global.rect = function() {};

// Mock InventoryController
class MockInventoryController {
  constructor(owner, capacity = 2) {
    this.owner = owner;
    this.capacity = capacity;
    this.items = [];
  }
  
  addResource(resource) {
    if (this.items.length >= this.capacity) return false;
    this.items.push(resource);
    return true;
  }
  
  transferAllTo(targetInventory) {
    let transferred = 0;
    while (this.items.length > 0 && targetInventory.items.length < targetInventory.capacity) {
      const item = this.items.shift();
      if (targetInventory.addResource(item)) transferred++;
    }
    return transferred;
  }
  
  getResources() {
    return this.items;
  }
}

global.InventoryController = MockInventoryController;

// Mock Grid class
class MockGrid {
  constructor() {
    this.data = new Map();
  }
  
  set(coords, value) {
    const key = `${coords[0]},${coords[1]}`;
    this.data.set(key, value);
  }
  
  get(coords) {
    const key = `${coords[0]},${coords[1]}`;
    return this.data.get(key);
  }
}

// Load the module
const DropoffLocation = require('../../../Classes/containers/DropoffLocation.js');

describe('DropoffLocation', function() {
  
  describe('Constructor', function() {
    it('should initialize with default values', function() {
      const dropoff = new DropoffLocation(5, 4);
      expect(dropoff.x).to.equal(5);
      expect(dropoff.y).to.equal(4);
      expect(dropoff.width).to.equal(1);
      expect(dropoff.height).to.equal(1);
      expect(dropoff.tileSize).to.equal(32);
    });
    
    it('should initialize with custom dimensions', function() {
      const dropoff = new DropoffLocation(10, 20, 3, 2);
      expect(dropoff.x).to.equal(10);
      expect(dropoff.y).to.equal(20);
      expect(dropoff.width).to.equal(3);
      expect(dropoff.height).to.equal(2);
    });
    
    it('should initialize with custom tile size', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { tileSize: 64 });
      expect(dropoff.tileSize).to.equal(64);
    });
    
    it('should floor grid coordinates', function() {
      const dropoff = new DropoffLocation(5.7, 4.2, 2.9, 3.1);
      expect(dropoff.x).to.equal(5);
      expect(dropoff.y).to.equal(4);
      expect(dropoff.width).to.equal(2);
      expect(dropoff.height).to.equal(3);
    });
    
    it('should enforce minimum size of 1x1', function() {
      const dropoff = new DropoffLocation(0, 0, 0, 0);
      expect(dropoff.width).to.equal(1);
      expect(dropoff.height).to.equal(1);
    });
    
    it('should create inventory with default capacity', function() {
      const dropoff = new DropoffLocation(0, 0);
      expect(dropoff.inventory).to.not.be.null;
      expect(dropoff.inventory.capacity).to.equal(2);
    });
    
    it('should create inventory with custom capacity', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { capacity: 10 });
      expect(dropoff.inventory.capacity).to.equal(10);
    });
    
    it('should mark grid on construction if provided', function() {
      const grid = new MockGrid();
      const dropoff = new DropoffLocation(2, 3, 2, 2, { grid });
      expect(dropoff._filledOnGrid).to.be.true;
      expect(grid.get([2, 3])).to.equal(dropoff);
      expect(grid.get([3, 4])).to.equal(dropoff);
    });
  });
  
  describe('tiles()', function() {
    it('should return single tile for 1x1 dropoff', function() {
      const dropoff = new DropoffLocation(5, 4, 1, 1);
      const tiles = dropoff.tiles();
      expect(tiles).to.have.lengthOf(1);
      expect(tiles[0]).to.deep.equal([5, 4]);
    });
    
    it('should return all tiles for 2x2 dropoff', function() {
      const dropoff = new DropoffLocation(0, 0, 2, 2);
      const tiles = dropoff.tiles();
      expect(tiles).to.have.lengthOf(4);
      expect(tiles).to.deep.include.members([[0, 0], [1, 0], [0, 1], [1, 1]]);
    });
    
    it('should return all tiles for 3x2 dropoff', function() {
      const dropoff = new DropoffLocation(10, 20, 3, 2);
      const tiles = dropoff.tiles();
      expect(tiles).to.have.lengthOf(6);
      expect(tiles).to.deep.include.members([
        [10, 20], [11, 20], [12, 20],
        [10, 21], [11, 21], [12, 21]
      ]);
    });
    
    it('should handle large dropoff areas', function() {
      const dropoff = new DropoffLocation(0, 0, 10, 10);
      const tiles = dropoff.tiles();
      expect(tiles).to.have.lengthOf(100);
    });
  });
  
  describe('expand()', function() {
    it('should expand width by positive delta', function() {
      const dropoff = new DropoffLocation(0, 0, 2, 2);
      dropoff.expand(1, 0);
      expect(dropoff.width).to.equal(3);
      expect(dropoff.height).to.equal(2);
    });
    
    it('should expand height by positive delta', function() {
      const dropoff = new DropoffLocation(0, 0, 2, 2);
      dropoff.expand(0, 2);
      expect(dropoff.width).to.equal(2);
      expect(dropoff.height).to.equal(4);
    });
    
    it('should expand both dimensions', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1);
      dropoff.expand(2, 3);
      expect(dropoff.width).to.equal(3);
      expect(dropoff.height).to.equal(4);
    });
    
    it('should handle negative delta (retraction)', function() {
      const dropoff = new DropoffLocation(0, 0, 5, 5);
      dropoff.expand(-2, -1);
      expect(dropoff.width).to.equal(3);
      expect(dropoff.height).to.equal(4);
    });
    
    it('should enforce minimum size of 1x1 when retracting', function() {
      const dropoff = new DropoffLocation(0, 0, 2, 2);
      dropoff.expand(-5, -5);
      expect(dropoff.width).to.equal(1);
      expect(dropoff.height).to.equal(1);
    });
    
    it('should do nothing when both deltas are zero', function() {
      const dropoff = new DropoffLocation(0, 0, 3, 3);
      dropoff.expand(0, 0);
      expect(dropoff.width).to.equal(3);
      expect(dropoff.height).to.equal(3);
    });
    
    it('should update grid when expanding', function() {
      const grid = new MockGrid();
      const dropoff = new DropoffLocation(0, 0, 1, 1, { grid });
      dropoff.expand(1, 0);
      expect(grid.get([1, 0])).to.equal(dropoff);
    });
  });
  
  describe('retract()', function() {
    it('should retract width', function() {
      const dropoff = new DropoffLocation(0, 0, 5, 5);
      dropoff.retract(2, 0);
      expect(dropoff.width).to.equal(3);
      expect(dropoff.height).to.equal(5);
    });
    
    it('should retract height', function() {
      const dropoff = new DropoffLocation(0, 0, 5, 5);
      dropoff.retract(0, 3);
      expect(dropoff.width).to.equal(5);
      expect(dropoff.height).to.equal(2);
    });
    
    it('should retract both dimensions', function() {
      const dropoff = new DropoffLocation(0, 0, 10, 10);
      dropoff.retract(3, 4);
      expect(dropoff.width).to.equal(7);
      expect(dropoff.height).to.equal(6);
    });
    
    it('should enforce minimum size of 1x1', function() {
      const dropoff = new DropoffLocation(0, 0, 2, 2);
      dropoff.retract(10, 10);
      expect(dropoff.width).to.equal(1);
      expect(dropoff.height).to.equal(1);
    });
    
    it('should convert positive arguments to absolute values', function() {
      const dropoff = new DropoffLocation(0, 0, 5, 5);
      dropoff.retract(2, 1);
      expect(dropoff.width).to.equal(3);
      expect(dropoff.height).to.equal(4);
    });
  });
  
  describe('setSize()', function() {
    it('should set absolute width and height', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1);
      dropoff.setSize(5, 7);
      expect(dropoff.width).to.equal(5);
      expect(dropoff.height).to.equal(7);
    });
    
    it('should floor fractional values', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1);
      dropoff.setSize(4.9, 6.1);
      expect(dropoff.width).to.equal(4);
      expect(dropoff.height).to.equal(6);
    });
    
    it('should enforce minimum size of 1x1', function() {
      const dropoff = new DropoffLocation(0, 0, 5, 5);
      dropoff.setSize(0, 0);
      expect(dropoff.width).to.equal(1);
      expect(dropoff.height).to.equal(1);
    });
    
    it('should update grid when resizing', function() {
      const grid = new MockGrid();
      const dropoff = new DropoffLocation(0, 0, 1, 1, { grid });
      dropoff.setSize(3, 3);
      expect(dropoff.tiles()).to.have.lengthOf(9);
    });
  });
  
  describe('depositResource()', function() {
    it('should add resource to inventory', function() {
      const dropoff = new DropoffLocation(0, 0);
      const resource = { type: 'wood' };
      const result = dropoff.depositResource(resource);
      expect(result).to.be.true;
      expect(dropoff.inventory.items).to.include(resource);
    });
    
    it('should return false when inventory is full', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { capacity: 2 });
      dropoff.depositResource({ type: 'wood' });
      dropoff.depositResource({ type: 'stone' });
      const result = dropoff.depositResource({ type: 'food' });
      expect(result).to.be.false;
    });
    
    it('should return false when no inventory exists', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { InventoryController: null });
      dropoff.inventory = null;
      const result = dropoff.depositResource({ type: 'wood' });
      expect(result).to.be.false;
    });
    
    it('should handle multiple deposits', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { capacity: 5 });
      expect(dropoff.depositResource({ type: 'a' })).to.be.true;
      expect(dropoff.depositResource({ type: 'b' })).to.be.true;
      expect(dropoff.depositResource({ type: 'c' })).to.be.true;
      expect(dropoff.inventory.items).to.have.lengthOf(3);
    });
  });
  
  describe('acceptFromCarrier()', function() {
    it('should transfer resources from carrier with transferAllTo', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { capacity: 10 });
      const carrier = {
        inventory: new MockInventoryController(null, 5)
      };
      carrier.inventory.addResource({ type: 'wood' });
      carrier.inventory.addResource({ type: 'stone' });
      
      const transferred = dropoff.acceptFromCarrier(carrier);
      expect(transferred).to.equal(2);
      expect(dropoff.inventory.items).to.have.lengthOf(2);
      expect(carrier.inventory.items).to.have.lengthOf(0);
    });
    
    it('should transfer resources from carrier with getResources', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { capacity: 10 });
      const carrier = {
        getResources: () => [{ type: 'wood' }, { type: 'stone' }],
        removeResource: function(index) { this.getResources()[index] = null; }
      };
      
      const transferred = dropoff.acceptFromCarrier(carrier);
      expect(transferred).to.equal(2);
      expect(dropoff.inventory.items).to.have.lengthOf(2);
    });
    
    it('should return 0 when carrier is null', function() {
      const dropoff = new DropoffLocation(0, 0);
      const transferred = dropoff.acceptFromCarrier(null);
      expect(transferred).to.equal(0);
    });
    
    it('should return 0 when dropoff has no inventory', function() {
      const dropoff = new DropoffLocation(0, 0);
      dropoff.inventory = null;
      const carrier = { inventory: new MockInventoryController(null, 5) };
      const transferred = dropoff.acceptFromCarrier(carrier);
      expect(transferred).to.equal(0);
    });
    
    it('should handle partial transfers when dropoff is nearly full', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { capacity: 3 });
      dropoff.depositResource({ type: 'existing' });
      
      const carrier = {
        inventory: new MockInventoryController(null, 5)
      };
      carrier.inventory.addResource({ type: 'a' });
      carrier.inventory.addResource({ type: 'b' });
      carrier.inventory.addResource({ type: 'c' });
      
      const transferred = dropoff.acceptFromCarrier(carrier);
      expect(transferred).to.equal(2);
      expect(dropoff.inventory.items).to.have.lengthOf(3);
      expect(carrier.inventory.items).to.have.lengthOf(1);
    });
    
    it('should handle empty carrier inventory', function() {
      const dropoff = new DropoffLocation(0, 0);
      const carrier = { inventory: new MockInventoryController(null, 5) };
      const transferred = dropoff.acceptFromCarrier(carrier);
      expect(transferred).to.equal(0);
    });
  });
  
  describe('getCenterPx()', function() {
    it('should return center of 1x1 dropoff', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { tileSize: 32 });
      const center = dropoff.getCenterPx();
      expect(center.x).to.equal(16);
      expect(center.y).to.equal(16);
    });
    
    it('should return center of 2x2 dropoff', function() {
      const dropoff = new DropoffLocation(0, 0, 2, 2, { tileSize: 32 });
      const center = dropoff.getCenterPx();
      expect(center.x).to.equal(32);
      expect(center.y).to.equal(32);
    });
    
    it('should return center with custom tile size', function() {
      const dropoff = new DropoffLocation(5, 5, 3, 3, { tileSize: 64 });
      const center = dropoff.getCenterPx();
      expect(center.x).to.equal(416); // (5 + 3/2) * 64 = 6.5 * 64
      expect(center.y).to.equal(416);
    });
    
    it('should return center at non-zero grid position', function() {
      const dropoff = new DropoffLocation(10, 20, 4, 2, { tileSize: 32 });
      const center = dropoff.getCenterPx();
      expect(center.x).to.equal(384); // (10 + 4/2) * 32 = 12 * 32
      expect(center.y).to.equal(672); // (20 + 2/2) * 32 = 21 * 32
    });
  });
  
  describe('draw()', function() {
    it('should not throw when p5 functions are available', function() {
      const dropoff = new DropoffLocation(0, 0, 2, 2);
      expect(() => dropoff.draw()).to.not.throw();
    });
    
    it('should handle missing p5 gracefully', function() {
      const originalPush = global.push;
      global.push = undefined;
      const dropoff = new DropoffLocation(0, 0);
      expect(() => dropoff.draw()).to.not.throw();
      global.push = originalPush;
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle negative grid coordinates', function() {
      const dropoff = new DropoffLocation(-5, -10, 2, 2);
      expect(dropoff.x).to.equal(-5);
      expect(dropoff.y).to.equal(-10);
      const tiles = dropoff.tiles();
      expect(tiles).to.deep.include.members([[-5, -10], [-4, -10], [-5, -9], [-4, -9]]);
    });
    
    it('should handle very large dimensions', function() {
      const dropoff = new DropoffLocation(0, 0, 100, 100);
      expect(dropoff.width).to.equal(100);
      expect(dropoff.height).to.equal(100);
      expect(dropoff.tiles()).to.have.lengthOf(10000);
    });
    
    it('should handle grid operations without grid instance', function() {
      const dropoff = new DropoffLocation(0, 0, 2, 2);
      expect(() => dropoff.expand(1, 1)).to.not.throw();
      expect(() => dropoff.retract(1, 1)).to.not.throw();
    });
    
    it('should handle carrier without removeResource method', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { capacity: 10 });
      const resources = [{ type: 'wood' }, { type: 'stone' }];
      const carrier = {
        getResources: () => resources
      };
      
      const transferred = dropoff.acceptFromCarrier(carrier);
      expect(transferred).to.equal(2);
      expect(resources[0]).to.be.null;
      expect(resources[1]).to.be.null;
    });
  });
  
  describe('Integration', function() {
    it('should maintain grid consistency through multiple operations', function() {
      const grid = new MockGrid();
      const dropoff = new DropoffLocation(0, 0, 2, 2, { grid });
      
      dropoff.expand(1, 0);
      expect(dropoff.tiles()).to.have.lengthOf(6);
      
      dropoff.setSize(4, 4);
      expect(dropoff.tiles()).to.have.lengthOf(16);
      
      dropoff.retract(2, 2);
      expect(dropoff.tiles()).to.have.lengthOf(4);
    });
    
    it('should handle resource workflow', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { capacity: 5 });
      
      // Deposit individual resources
      expect(dropoff.depositResource({ type: 'a' })).to.be.true;
      expect(dropoff.depositResource({ type: 'b' })).to.be.true;
      
      // Accept from carrier
      const carrier = {
        inventory: new MockInventoryController(null, 5)
      };
      carrier.inventory.addResource({ type: 'c' });
      carrier.inventory.addResource({ type: 'd' });
      
      dropoff.acceptFromCarrier(carrier);
      expect(dropoff.inventory.items).to.have.lengthOf(4);
    });
  });
});
