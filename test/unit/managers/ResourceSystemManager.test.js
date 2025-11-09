/**
 * Unit Tests for ResourceSystemManager
 * Tests unified resource management: collection, spawning, selection, and registration
 */

const { expect } = require('chai');
const path = require('path');

describe('ResourceSystemManager', function() {
  let ResourceSystemManager;
  let manager;
  let mockResource;
  
  beforeEach(function() {
    // Mock global functions
    global.random = function(min, max) {
      if (arguments.length === 0) return Math.random();
      if (arguments.length === 1) return Math.random() * min;
      return min + Math.random() * (max - min);
    };
    
    global.g_canvasX = 800;
    global.g_canvasY = 600;
    
    global.loadImage = function(path) {
      return { path, _loaded: true };
    };
    
    global.setInterval = function(fn, ms) { return { _id: Math.random(), _fn: fn, _ms: ms }; };
    global.clearInterval = function(id) {};
    
    // Mock logging functions
    global.globalThis = {
      console.log: function() {},
      logVerbose: function() {},
      logDebug: function() {}
    };
    
    global.console = {
      ...console,
      log: function() {},
      warn: function() {}
    };
    
    // Mock Resource class
    global.Resource = class {
      constructor(x, y, w, h, options = {}) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.type = options.resourceType || 'generic';
        this._type = this.type;
        this.resourceType = this.type;
        this.isCarried = false;
        this.canBePickedUp = options.canBePickedUp !== false;
      }
      
      getPosition() { return { x: this.x, y: this.y }; }
      render() {}
      draw() {}
      update() {}
      setSelected(selected) { this._selected = selected; }
      pickUp(antObject) { 
        if (!this.canBePickedUp) return false;
        this.isCarried = true;
        return true;
      }
      
      static createGreenLeaf(x, y) {
        return new Resource(x, y, 20, 20, { resourceType: 'greenLeaf' });
      }
      
      static createMapleLeaf(x, y) {
        return new Resource(x, y, 20, 20, { resourceType: 'mapleLeaf' });
      }
      
      static createStick(x, y) {
        return new Resource(x, y, 20, 20, { resourceType: 'stick' });
      }
      
      static createStone(x, y) {
        return new Resource(x, y, 20, 20, { resourceType: 'stone' });
      }
      
      static _getImageForType(type) {
        return { path: `/images/${type}.png` };
      }
    };
    
    // Load ResourceSystemManager
    const managerPath = path.join(__dirname, '..', '..', '..', 'Classes', 'managers', 'ResourceSystemManager.js');
    delete require.cache[require.resolve(managerPath)];
    ResourceSystemManager = require(managerPath);
    
    // Create manager instance with autoStart disabled for controlled testing
    manager = new ResourceSystemManager(1, 50, { autoStart: false, enableLogging: false });
    
    // Create mock resource
    mockResource = new global.Resource(100, 100, 20, 20, { resourceType: 'wood' });
  });
  
  afterEach(function() {
    if (manager) {
      manager.destroy();
    }
    delete global.random;
    delete global.g_canvasX;
    delete global.g_canvasY;
    delete global.loadImage;
    delete global.Resource;
    delete global.setInterval;
    delete global.clearInterval;
    delete global.globalThis;
  });

  describe('Constructor', function() {
    it('should initialize with default spawn interval', function() {
      expect(manager.spawnInterval).to.equal(1);
    });

    it('should initialize with default max capacity', function() {
      expect(manager.maxCapacity).to.equal(50);
    });

    it('should initialize with custom spawn interval', function() {
      const customManager = new ResourceSystemManager(2, 50, { autoStart: false });
      expect(customManager.spawnInterval).to.equal(2);
      customManager.destroy();
    });

    it('should initialize with custom max capacity', function() {
      const customManager = new ResourceSystemManager(1, 100, { autoStart: false });
      expect(customManager.maxCapacity).to.equal(100);
      customManager.destroy();
    });

    it('should initialize resources array as empty', function() {
      expect(manager.resources).to.be.an('array');
      expect(manager.resources).to.have.lengthOf(0);
    });

    it('should initialize as inactive', function() {
      expect(manager.isActive).to.equal(false);
    });

    it('should have default resource assets configured', function() {
      expect(manager.assets).to.have.property('greenLeaf');
      expect(manager.assets).to.have.property('mapleLeaf');
      expect(manager.assets).to.have.property('stick');
      expect(manager.assets).to.have.property('stone');
    });

    it('should set selectedResourceType to null', function() {
      expect(manager.selectedResourceType).to.equal(null);
    });

    it('should initialize with options', function() {
      const customManager = new ResourceSystemManager(1, 50, { 
        autoStart: false, 
        enableLogging: true 
      });
      expect(customManager.options.autoStart).to.equal(false);
      expect(customManager.options.enableLogging).to.equal(true);
      customManager.destroy();
    });
  });

  describe('getResourceList()', function() {
    it('should return empty array initially', function() {
      const list = manager.getResourceList();
      expect(list).to.be.an('array');
      expect(list).to.have.lengthOf(0);
    });

    it('should return array with resources after adding', function() {
      manager.addResource(mockResource);
      const list = manager.getResourceList();
      expect(list).to.have.lengthOf(1);
      expect(list[0]).to.equal(mockResource);
    });

    it('should return reference to actual array', function() {
      const list1 = manager.getResourceList();
      manager.addResource(mockResource);
      const list2 = manager.getResourceList();
      expect(list1).to.equal(list2);
    });
  });

  describe('addResource()', function() {
    it('should add resource successfully', function() {
      const result = manager.addResource(mockResource);
      expect(result).to.equal(true);
      expect(manager.resources).to.have.lengthOf(1);
    });

    it('should add multiple resources', function() {
      manager.addResource(mockResource);
      manager.addResource(new global.Resource(200, 200, 20, 20));
      expect(manager.resources).to.have.lengthOf(2);
    });

    it('should return false when at capacity', function() {
      // Fill to capacity
      for (let i = 0; i < 50; i++) {
        manager.addResource(new global.Resource(i, i, 20, 20));
      }
      
      const result = manager.addResource(mockResource);
      expect(result).to.equal(false);
      expect(manager.resources).to.have.lengthOf(50);
    });

    it('should handle adding null resource', function() {
      manager.addResource(null);
      expect(manager.resources).to.have.lengthOf(1);
      expect(manager.resources[0]).to.equal(null);
    });

    it('should handle adding undefined resource', function() {
      manager.addResource(undefined);
      expect(manager.resources).to.have.lengthOf(1);
    });
  });

  describe('removeResource()', function() {
    it('should remove resource successfully', function() {
      manager.addResource(mockResource);
      const result = manager.removeResource(mockResource);
      
      expect(result).to.equal(true);
      expect(manager.resources).to.have.lengthOf(0);
    });

    it('should return false for non-existent resource', function() {
      const otherResource = new global.Resource(300, 300, 20, 20);
      const result = manager.removeResource(otherResource);
      
      expect(result).to.equal(false);
    });

    it('should remove correct resource from multiple', function() {
      const res1 = new global.Resource(100, 100, 20, 20);
      const res2 = new global.Resource(200, 200, 20, 20);
      const res3 = new global.Resource(300, 300, 20, 20);
      
      manager.addResource(res1);
      manager.addResource(res2);
      manager.addResource(res3);
      
      manager.removeResource(res2);
      
      expect(manager.resources).to.have.lengthOf(2);
      expect(manager.resources).to.include(res1);
      expect(manager.resources).to.include(res3);
      expect(manager.resources).to.not.include(res2);
    });

    it('should handle removing null', function() {
      const result = manager.removeResource(null);
      expect(result).to.equal(false);
    });

    it('should handle removing from empty array', function() {
      const result = manager.removeResource(mockResource);
      expect(result).to.equal(false);
    });
  });

  describe('clearAllResources()', function() {
    it('should clear all resources', function() {
      manager.addResource(mockResource);
      manager.addResource(new global.Resource(200, 200, 20, 20));
      
      const removed = manager.clearAllResources();
      
      expect(manager.resources).to.have.lengthOf(0);
      expect(removed).to.have.lengthOf(2);
    });

    it('should return removed resources array', function() {
      manager.addResource(mockResource);
      const removed = manager.clearAllResources();
      
      expect(removed).to.be.an('array');
      expect(removed[0]).to.equal(mockResource);
    });

    it('should handle clearing empty array', function() {
      const removed = manager.clearAllResources();
      expect(removed).to.have.lengthOf(0);
    });

    it('should create new empty array', function() {
      manager.addResource(mockResource);
      const oldArray = manager.resources;
      manager.clearAllResources();
      
      expect(manager.resources).to.not.equal(oldArray);
      expect(manager.resources).to.have.lengthOf(0);
    });
  });

  describe('drawAll()', function() {
    it('should call render on resources with render method', function() {
      let renderCalled = false;
      const resource = {
        render: function() { renderCalled = true; }
      };
      
      manager.addResource(resource);
      manager.drawAll();
      
      expect(renderCalled).to.equal(true);
    });

    it('should fallback to draw method if render not available', function() {
      let drawCalled = false;
      const resource = {
        draw: function() { drawCalled = true; }
      };
      
      manager.addResource(resource);
      manager.drawAll();
      
      expect(drawCalled).to.equal(true);
    });

    it('should handle resources without render or draw', function() {
      manager.addResource({});
      expect(() => manager.drawAll()).to.not.throw();
    });

    it('should handle null resources', function() {
      manager.addResource(null);
      expect(() => manager.drawAll()).to.not.throw();
    });

    it('should handle errors in individual renders', function() {
      const badResource = {
        render: function() { throw new Error('Render error'); }
      };
      const goodResource = {
        render: function() { this.rendered = true; }
      };
      
      manager.addResource(badResource);
      manager.addResource(goodResource);
      
      expect(() => manager.drawAll()).to.not.throw();
    });
  });

  describe('updateAll()', function() {
    it('should call update on all resources', function() {
      let updateCount = 0;
      const resource = {
        update: function() { updateCount++; }
      };
      
      manager.addResource(resource);
      manager.addResource(resource);
      manager.updateAll();
      
      expect(updateCount).to.equal(2);
    });

    it('should handle resources without update method', function() {
      manager.addResource({});
      expect(() => manager.updateAll()).to.not.throw();
    });

    it('should handle errors in individual updates', function() {
      const badResource = {
        update: function() { throw new Error('Update error'); }
      };
      
      manager.addResource(badResource);
      expect(() => manager.updateAll()).to.not.throw();
    });
  });

  describe('startSpawning()', function() {
    it('should set isActive to true', function() {
      manager.startSpawning();
      expect(manager.isActive).to.equal(true);
    });

    it('should create timer', function() {
      manager.startSpawning();
      expect(manager.timer).to.not.equal(null);
    });

    it('should not create multiple timers', function() {
      manager.startSpawning();
      const firstTimer = manager.timer;
      manager.startSpawning();
      expect(manager.timer).to.equal(firstTimer);
    });

    it('should handle being called multiple times', function() {
      manager.startSpawning();
      manager.startSpawning();
      manager.startSpawning();
      expect(manager.isActive).to.equal(true);
    });
  });

  describe('stopSpawning()', function() {
    it('should set isActive to false', function() {
      manager.startSpawning();
      manager.stopSpawning();
      expect(manager.isActive).to.equal(false);
    });

    it('should clear timer', function() {
      manager.startSpawning();
      manager.stopSpawning();
      expect(manager.timer).to.equal(null);
    });

    it('should handle being called when not active', function() {
      expect(() => manager.stopSpawning()).to.not.throw();
    });

    it('should handle being called multiple times', function() {
      manager.startSpawning();
      manager.stopSpawning();
      manager.stopSpawning();
      expect(manager.isActive).to.equal(false);
    });
  });

  describe('spawn()', function() {
    it('should not spawn when inactive', function() {
      manager.spawn();
      expect(manager.resources).to.have.lengthOf(0);
    });

    it('should spawn resource when active', function() {
      manager.startSpawning();
      manager.spawn();
      expect(manager.resources.length).to.be.at.least(1);
      manager.stopSpawning();
    });

    it('should not spawn when at capacity', function() {
      manager.startSpawning();
      // Fill to capacity
      for (let i = 0; i < 50; i++) {
        manager.addResource(new global.Resource(i, i, 20, 20));
      }
      
      manager.spawn();
      expect(manager.resources).to.have.lengthOf(50);
      manager.stopSpawning();
    });

    it('should spawn different resource types', function() {
      manager.startSpawning();
      const types = new Set();
      
      for (let i = 0; i < 20; i++) {
        manager.spawn();
      }
      
      manager.resources.forEach(r => types.add(r.type));
      expect(types.size).to.be.at.least(2); // Should have variety
      manager.stopSpawning();
    });
  });

  describe('forceSpawn()', function() {
    it('should spawn even when inactive', function() {
      manager.forceSpawn();
      expect(manager.resources.length).to.be.at.least(1);
    });

    it('should maintain active state', function() {
      const initialState = manager.isActive;
      manager.forceSpawn();
      expect(manager.isActive).to.equal(initialState);
    });

    it('should work multiple times', function() {
      manager.forceSpawn();
      manager.forceSpawn();
      manager.forceSpawn();
      expect(manager.resources.length).to.be.at.least(3);
    });
  });

  describe('selectResource()', function() {
    it('should set selected resource type', function() {
      manager.selectResource('wood');
      expect(manager.selectedResourceType).to.equal('wood');
    });

    it('should change selected resource type', function() {
      manager.selectResource('wood');
      manager.selectResource('stone');
      expect(manager.selectedResourceType).to.equal('stone');
    });

    it('should notify resources with setSelected method', function() {
      const resource = new global.Resource(100, 100, 20, 20, { resourceType: 'wood' });
      manager.addResource(resource);
      
      manager.selectResource('wood');
      expect(resource._selected).to.equal(true);
    });

    it('should handle resources without setSelected', function() {
      manager.addResource({});
      expect(() => manager.selectResource('wood')).to.not.throw();
    });

    it('should handle null resource type', function() {
      manager.selectResource(null);
      expect(manager.selectedResourceType).to.equal(null);
    });
  });

  describe('getSelectedResourceType()', function() {
    it('should return null initially', function() {
      expect(manager.getSelectedResourceType()).to.equal(null);
    });

    it('should return selected type', function() {
      manager.selectResource('wood');
      expect(manager.getSelectedResourceType()).to.equal('wood');
    });

    it('should return latest selection', function() {
      manager.selectResource('wood');
      manager.selectResource('stone');
      expect(manager.getSelectedResourceType()).to.equal('stone');
    });
  });

  describe('clearResourceSelection()', function() {
    it('should clear selected resource type', function() {
      manager.selectResource('wood');
      manager.clearResourceSelection();
      expect(manager.selectedResourceType).to.equal(null);
    });

    it('should notify resources', function() {
      const resource = new global.Resource(100, 100, 20, 20, { resourceType: 'wood' });
      manager.addResource(resource);
      
      manager.selectResource('wood');
      manager.clearResourceSelection();
      expect(resource._selected).to.equal(false);
    });

    it('should handle being called when nothing selected', function() {
      expect(() => manager.clearResourceSelection()).to.not.throw();
    });
  });

  describe('isResourceTypeSelected()', function() {
    it('should return true for selected type', function() {
      manager.selectResource('wood');
      expect(manager.isResourceTypeSelected('wood')).to.equal(true);
    });

    it('should return false for non-selected type', function() {
      manager.selectResource('wood');
      expect(manager.isResourceTypeSelected('stone')).to.equal(false);
    });

    it('should return false when nothing selected', function() {
      expect(manager.isResourceTypeSelected('wood')).to.equal(false);
    });
  });

  describe('getSelectedTypeResources()', function() {
    it('should return empty array when nothing selected', function() {
      const result = manager.getSelectedTypeResources();
      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(0);
    });

    it('should return matching resources', function() {
      const wood1 = new global.Resource(100, 100, 20, 20, { resourceType: 'wood' });
      const wood2 = new global.Resource(200, 200, 20, 20, { resourceType: 'wood' });
      const stone = new global.Resource(300, 300, 20, 20, { resourceType: 'stone' });
      
      manager.addResource(wood1);
      manager.addResource(wood2);
      manager.addResource(stone);
      
      manager.selectResource('wood');
      const result = manager.getSelectedTypeResources();
      
      expect(result).to.have.lengthOf(2);
      expect(result).to.include(wood1);
      expect(result).to.include(wood2);
    });

    it('should handle null resources', function() {
      manager.addResource(null);
      manager.selectResource('wood');
      
      const result = manager.getSelectedTypeResources();
      expect(result).to.have.lengthOf(0);
    });
  });

  describe('getResourcesByType()', function() {
    it('should return resources matching type', function() {
      const wood1 = new global.Resource(100, 100, 20, 20, { resourceType: 'wood' });
      const wood2 = new global.Resource(200, 200, 20, 20, { resourceType: 'wood' });
      const stone = new global.Resource(300, 300, 20, 20, { resourceType: 'stone' });
      
      manager.addResource(wood1);
      manager.addResource(wood2);
      manager.addResource(stone);
      
      const result = manager.getResourcesByType('wood');
      
      expect(result).to.have.lengthOf(2);
      expect(result).to.include(wood1);
      expect(result).to.include(wood2);
    });

    it('should return empty array for non-existent type', function() {
      const result = manager.getResourcesByType('gold');
      expect(result).to.have.lengthOf(0);
    });

    it('should handle null type', function() {
      const result = manager.getResourcesByType(null);
      expect(result).to.be.an('array');
    });
  });

  describe('setFocusedCollection()', function() {
    it('should enable focused collection', function() {
      manager.setFocusedCollection(true);
      expect(manager.focusedCollection).to.equal(true);
    });

    it('should disable focused collection', function() {
      manager.setFocusedCollection(true);
      manager.setFocusedCollection(false);
      expect(manager.focusedCollection).to.equal(false);
    });

    it('should handle boolean values', function() {
      manager.setFocusedCollection(true);
      expect(manager.focusedCollection).to.equal(true);
      manager.setFocusedCollection(false);
      expect(manager.focusedCollection).to.equal(false);
    });
  });

  describe('registerResourceType()', function() {
    it('should register new resource type', function() {
      manager.registerResourceType('gold', {
        imagePath: '/images/gold.png',
        weight: 0.5
      });
      
      expect(manager.registeredResourceTypes).to.have.property('gold');
    });

    it('should require resourceType parameter', function() {
      expect(() => manager.registerResourceType()).to.throw();
    });

    it('should require config parameter', function() {
      expect(() => manager.registerResourceType('gold')).to.throw();
    });

    it('should require imagePath in config', function() {
      expect(() => manager.registerResourceType('gold', {})).to.throw();
    });

    it('should set default values', function() {
      manager.registerResourceType('gold', {
        imagePath: '/images/gold.png'
      });
      
      const config = manager.registeredResourceTypes.gold;
      expect(config.weight).to.equal(0);
      expect(config.canBePickedUp).to.equal(true);
      expect(config.initialSpawnCount).to.equal(0);
    });

    it('should use provided values', function() {
      manager.registerResourceType('gold', {
        imagePath: '/images/gold.png',
        weight: 0.8,
        canBePickedUp: false,
        initialSpawnCount: 10
      });
      
      const config = manager.registeredResourceTypes.gold;
      expect(config.weight).to.equal(0.8);
      expect(config.canBePickedUp).to.equal(false);
      expect(config.initialSpawnCount).to.equal(10);
    });

    it('should add to spawn assets when weight > 0', function() {
      manager.registerResourceType('gold', {
        imagePath: '/images/gold.png',
        weight: 0.5
      });
      
      expect(manager.assets).to.have.property('gold');
    });

    it('should not add to spawn assets when weight is 0', function() {
      manager.registerResourceType('obstacle', {
        imagePath: '/images/obstacle.png',
        weight: 0
      });
      
      expect(manager.assets).to.not.have.property('obstacle');
    });
  });

  describe('getRegisteredResourceTypes()', function() {
    it('should return empty object initially', function() {
      const types = manager.getRegisteredResourceTypes();
      expect(types).to.be.an('object');
    });

    it('should return registered types', function() {
      manager.registerResourceType('gold', {
        imagePath: '/images/gold.png'
      });
      
      const types = manager.getRegisteredResourceTypes();
      expect(types).to.have.property('gold');
    });

    it('should include type configurations', function() {
      manager.registerResourceType('gold', {
        imagePath: '/images/gold.png',
        weight: 0.5
      });
      
      const types = manager.getRegisteredResourceTypes();
      expect(types.gold.weight).to.equal(0.5);
    });
  });

  describe('getSystemStatus()', function() {
    it('should return status object', function() {
      const status = manager.getSystemStatus();
      expect(status).to.be.an('object');
    });

    it('should include totalResources', function() {
      manager.addResource(mockResource);
      const status = manager.getSystemStatus();
      expect(status.totalResources).to.equal(1);
    });

    it('should include maxCapacity', function() {
      const status = manager.getSystemStatus();
      expect(status.maxCapacity).to.equal(50);
    });

    it('should include capacityUsed percentage', function() {
      const status = manager.getSystemStatus();
      expect(status.capacityUsed).to.be.a('string');
      expect(status.capacityUsed).to.include('%');
    });

    it('should include isSpawningActive', function() {
      const status = manager.getSystemStatus();
      expect(status).to.have.property('isSpawningActive');
    });

    it('should include selectedResourceType', function() {
      const status = manager.getSystemStatus();
      expect(status).to.have.property('selectedResourceType');
    });

    it('should include resourceCounts', function() {
      const wood = new global.Resource(100, 100, 20, 20, { resourceType: 'wood' });
      const stone = new global.Resource(200, 200, 20, 20, { resourceType: 'stone' });
      manager.addResource(wood);
      manager.addResource(stone);
      
      const status = manager.getSystemStatus();
      expect(status.resourceCounts).to.have.property('wood');
      expect(status.resourceCounts).to.have.property('stone');
    });
  });

  describe('getDebugInfo()', function() {
    it('should return debug object', function() {
      const debug = manager.getDebugInfo();
      expect(debug).to.be.an('object');
    });

    it('should include system status', function() {
      const debug = manager.getDebugInfo();
      expect(debug).to.have.property('totalResources');
      expect(debug).to.have.property('maxCapacity');
    });

    it('should include resourceDetails array', function() {
      const debug = manager.getDebugInfo();
      expect(debug.resourceDetails).to.be.an('array');
    });

    it('should include details for each resource', function() {
      manager.addResource(mockResource);
      const debug = manager.getDebugInfo();
      
      expect(debug.resourceDetails).to.have.lengthOf(1);
      expect(debug.resourceDetails[0]).to.have.property('type');
      expect(debug.resourceDetails[0]).to.have.property('position');
    });
  });

  describe('update()', function() {
    it('should call updateAll', function() {
      let called = false;
      manager.updateAll = function() { called = true; };
      manager.update();
      expect(called).to.equal(true);
    });
  });

  describe('render()', function() {
    it('should call drawAll', function() {
      let called = false;
      manager.drawAll = function() { called = true; };
      manager.render();
      expect(called).to.equal(true);
    });
  });

  describe('destroy()', function() {
    it('should stop spawning', function() {
      manager.startSpawning();
      manager.destroy();
      expect(manager.isActive).to.equal(false);
    });

    it('should clear all resources', function() {
      manager.addResource(mockResource);
      manager.destroy();
      expect(manager.resources).to.have.lengthOf(0);
    });

    it('should be safe to call multiple times', function() {
      expect(() => {
        manager.destroy();
        manager.destroy();
      }).to.not.throw();
    });
  });

  describe('Edge Cases', function() {
    it('should handle rapid add/remove cycles', function() {
      for (let i = 0; i < 100; i++) {
        const res = new global.Resource(i, i, 20, 20);
        manager.addResource(res);
        manager.removeResource(res);
      }
      expect(manager.resources).to.have.lengthOf(0);
    });

    it('should handle adding at exactly capacity', function() {
      for (let i = 0; i < 50; i++) {
        const result = manager.addResource(new global.Resource(i, i, 20, 20));
        expect(result).to.equal(true);
      }
      expect(manager.resources).to.have.lengthOf(50);
    });

    it('should handle selecting same type multiple times', function() {
      manager.selectResource('wood');
      manager.selectResource('wood');
      manager.selectResource('wood');
      expect(manager.selectedResourceType).to.equal('wood');
    });

    it('should handle empty resource type string', function() {
      manager.selectResource('');
      expect(manager.selectedResourceType).to.equal('');
    });

    it('should handle very long resource type names', function() {
      const longName = 'a'.repeat(1000);
      manager.selectResource(longName);
      expect(manager.selectedResourceType).to.equal(longName);
    });

    it('should handle registering same type twice', function() {
      manager.registerResourceType('gold', { imagePath: '/images/gold.png' });
      manager.registerResourceType('gold', { imagePath: '/images/gold2.png' });
      
      const types = manager.getRegisteredResourceTypes();
      expect(types.gold.imagePath).to.equal('/images/gold2.png');
    });

    it('should handle spawning when capacity is 0', function() {
      const smallManager = new ResourceSystemManager(1, 0, { autoStart: false });
      smallManager.startSpawning();
      smallManager.spawn();
      expect(smallManager.resources).to.have.lengthOf(0);
      smallManager.destroy();
    });

    it('should handle negative capacity', function() {
      const negManager = new ResourceSystemManager(1, -10, { autoStart: false });
      negManager.forceSpawn();
      expect(negManager.resources.length).to.be.at.most(0);
      negManager.destroy();
    });

    it('should handle very large capacity', function() {
      const bigManager = new ResourceSystemManager(1, 1000000, { autoStart: false });
      expect(bigManager.maxCapacity).to.equal(1000000);
      bigManager.destroy();
    });
  });

  describe('Integration Scenarios', function() {
    it('should handle complete lifecycle', function() {
      manager.startSpawning();
      manager.forceSpawn();
      manager.forceSpawn();
      expect(manager.resources.length).to.be.at.least(2);
      
      manager.selectResource('wood');
      const woodResources = manager.getSelectedTypeResources();
      
      manager.stopSpawning();
      manager.clearAllResources();
      expect(manager.resources).to.have.lengthOf(0);
    });

    it('should maintain state across operations', function() {
      manager.setFocusedCollection(true);
      manager.selectResource('wood');
      manager.addResource(mockResource);
      
      expect(manager.focusedCollection).to.equal(true);
      expect(manager.selectedResourceType).to.equal('wood');
      expect(manager.resources).to.have.lengthOf(1);
    });

    it('should handle registration and spawning', function() {
      manager.registerResourceType('gold', {
        imagePath: '/images/gold.png',
        weight: 1.0
      });
      
      manager.startSpawning();
      manager.spawn();
      
      // Should potentially have gold resource
      const status = manager.getSystemStatus();
      expect(status.totalResources).to.be.at.least(1);
      
      manager.stopSpawning();
    });
  });
});
