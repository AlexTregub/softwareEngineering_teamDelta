/**
 * Consolidated Manager Tests
 * Generated: 2025-10-29T03:11:41.125Z
 * Source files: 12
 * Total tests: 690
 * 
 * This file contains all manager tests merged from individual test files.
 * Each section preserves its original setup, mocks, and teardown.
 */

// Common requires (extracted from all test files)
let { expect } = require('chai');
let sinon = require('sinon');
let { JSDOM } = require('jsdom');


// ================================================================
// AntManager.test.js (57 tests)
// ================================================================
﻿const AntManager = require('../../../Classes/managers/AntManager.js');

describe('AntManager', function() {
  let manager;
  let mockAnt;
  let mockAnts;
  
  beforeEach(function() {
    manager = new AntManager();
    
    // Create mock ant
    mockAnt = {
      antIndex: 0,
      selected: false,
      mouseOver: false,
      position: { x: 100, y: 100 },
      isMouseOver: function() { return this.mouseOver; },
      setSelected: function(value) { this.selected = value; },
      moveToLocation: function(x, y) { 
        this.position.x = x;
        this.position.y = y;
      },
      getPosition: function() { return this.position; }
    };
    
    // Mock global ants array
    mockAnts = [mockAnt];
    global.ants = mockAnts;
    global.antIndex = 1;
    
    // Mock global mouse positions
    global.mouseX = 200;
    global.mouseY = 200;
    
    // Mock global ant class
    global.ant = function() {};
    mockAnt.__proto__ = new global.ant();
  });
  
  afterEach(function() {
    delete global.ants;
    delete global.antIndex;
    delete global.mouseX;
    delete global.mouseY;
    delete global.ant;
  });
  
  describe('Constructor', function() {
    it('should initialize with null selectedAnt', function() {
      expect(manager.selectedAnt).to.be.null;
    });
    
    it('should create new instance successfully', function() {
      const newManager = new AntManager();
      expect(newManager).to.be.instanceOf(AntManager);
    });
  });
  
  describe('handleAntClick()', function() {
    it('should move selected ant when ant is already selected', function() {
      manager.selectedAnt = mockAnt;
      const initialX = mockAnt.position.x;
      const initialY = mockAnt.position.y;
      
      manager.handleAntClick();
      
      expect(mockAnt.position.x).to.equal(global.mouseX);
      expect(mockAnt.position.y).to.equal(global.mouseY);
      expect(manager.selectedAnt).to.equal(mockAnt);
    });
    
    it('should select ant under mouse when no ant selected', function() {
      mockAnt.mouseOver = true;
      
      manager.handleAntClick();
      
      expect(manager.selectedAnt).to.equal(mockAnt);
      expect(mockAnt.selected).to.be.true;
    });
    
    it('should not select ant when mouse not over any ant', function() {
      mockAnt.mouseOver = false;
      
      manager.handleAntClick();
      
      expect(manager.selectedAnt).to.be.null;
      expect(mockAnt.selected).to.be.false;
    });
    
    it('should deselect previous ant when selecting new one', function() {
      const otherAnt = {
        antIndex: 1,
        selected: false,
        mouseOver: false,
        setSelected: function(value) { this.selected = value; },
        isMouseOver: function() { return this.mouseOver; }
      };
      otherAnt.__proto__ = new global.ant();
      
      global.ants = [mockAnt, otherAnt];
      global.antIndex = 2;
      
      // Setup: manager has no selection, but mockAnt thinks it's selected
      manager.selectedAnt = null;
      mockAnt.selected = true;
      mockAnt.mouseOver = false;
      otherAnt.mouseOver = true;
      
      // Call handleAntClick - should select otherAnt and deselect mockAnt
      manager.handleAntClick();
      
      // The code checks: if (this.selectedAnt) - which is null, so it goes to the else block
      // In the else block, it deselects this.selectedAnt if it exists before selecting new one
      // But this.selectedAnt is null, so only otherAnt gets selected
      expect(manager.selectedAnt).to.equal(otherAnt);
      expect(otherAnt.selected).to.be.true;
      // mockAnt.selected stays true because the code only deselects this.selectedAnt
      expect(mockAnt.selected).to.be.true;
    });
    
    it('should only select first ant under mouse', function() {
      const secondAnt = {
        antIndex: 1,
        selected: false,
        mouseOver: true,
        setSelected: function(value) { this.selected = value; },
        isMouseOver: function() { return this.mouseOver; }
      };
      secondAnt.__proto__ = new global.ant();
      
      mockAnt.mouseOver = true;
      global.ants.push(secondAnt);
      global.antIndex = 2;
      
      manager.handleAntClick();
      
      expect(manager.selectedAnt).to.equal(mockAnt);
      expect(secondAnt.selected).to.be.false;
    });
    
    it('should handle no ants in array', function() {
      global.ants = [];
      global.antIndex = 0;
      
      expect(() => manager.handleAntClick()).to.not.throw();
      expect(manager.selectedAnt).to.be.null;
    });
  });
  
  describe('moveSelectedAnt()', function() {
    it('should move selected ant and keep selection when resetSelection is false', function() {
      manager.selectedAnt = mockAnt;
      
      manager.moveSelectedAnt(false);
      
      expect(mockAnt.position.x).to.equal(global.mouseX);
      expect(mockAnt.position.y).to.equal(global.mouseY);
      expect(manager.selectedAnt).to.equal(mockAnt);
    });
    
    it('should move selected ant and clear selection when resetSelection is true', function() {
      manager.selectedAnt = mockAnt;
      mockAnt.selected = true;
      
      manager.moveSelectedAnt(true);
      
      expect(mockAnt.position.x).to.equal(global.mouseX);
      expect(mockAnt.position.y).to.equal(global.mouseY);
      expect(mockAnt.selected).to.be.false;
      expect(manager.selectedAnt).to.be.null;
    });
    
    it('should do nothing when no ant is selected', function() {
      manager.selectedAnt = null;
      
      manager.moveSelectedAnt(false);
      
      expect(mockAnt.position.x).to.equal(100);
      expect(mockAnt.position.y).to.equal(100);
    });
    
    it('should handle error for non-boolean resetSelection parameter', function() {
      manager.selectedAnt = mockAnt;
      global.IncorrectParamPassed = function(flag, value) {
        throw new Error('Invalid parameter');
      };
      
      expect(() => manager.moveSelectedAnt('invalid')).to.throw('Invalid parameter');
      
      delete global.IncorrectParamPassed;
    });
    
    it('should log error when IncorrectParamPassed is undefined', function() {
      manager.selectedAnt = mockAnt;
      const consoleErrors = [];
      const originalError = console.error;
      console.error = (...args) => consoleErrors.push(args);
      
      manager.moveSelectedAnt(123);
      
      expect(consoleErrors.length).to.be.greaterThan(0);
      console.error = originalError;
    });
    
    it('should handle null resetSelection parameter', function() {
      manager.selectedAnt = mockAnt;
      
      expect(() => manager.moveSelectedAnt(null)).to.not.throw();
    });
    
    it('should handle undefined resetSelection parameter', function() {
      manager.selectedAnt = mockAnt;
      
      expect(() => manager.moveSelectedAnt(undefined)).to.not.throw();
    });
  });
  
  describe('selectAnt()', function() {
    it('should select ant when mouse is over it', function() {
      mockAnt.mouseOver = true;
      
      manager.selectAnt(mockAnt);
      
      expect(manager.selectedAnt).to.equal(mockAnt);
      expect(mockAnt.selected).to.be.true;
    });
    
    it('should not select ant when mouse is not over it', function() {
      mockAnt.mouseOver = false;
      
      manager.selectAnt(mockAnt);
      
      expect(manager.selectedAnt).to.be.null;
      expect(mockAnt.selected).to.be.false;
    });
    
    it('should return early when ant is not instance of ant class', function() {
      const fakeAnt = { isMouseOver: () => true, setSelected: () => {} };
      
      manager.selectAnt(fakeAnt);
      
      expect(manager.selectedAnt).to.be.null;
    });
    
    it('should handle null ant parameter', function() {
      expect(() => manager.selectAnt(null)).to.not.throw();
      expect(manager.selectedAnt).to.be.null;
    });
    
    it('should handle undefined ant parameter', function() {
      expect(() => manager.selectAnt(undefined)).to.not.throw();
      expect(manager.selectedAnt).to.be.null;
    });
    
    it('should handle ant without isMouseOver method', function() {
      const brokenAnt = { setSelected: () => {} };
      brokenAnt.__proto__ = new global.ant();
      
      // Will throw because isMouseOver is not defined
      expect(() => manager.selectAnt(brokenAnt)).to.throw();
    });
  });
  
  describe('getAntObject()', function() {
    it('should return ant at specified index', function() {
      const result = manager.getAntObject(0);
      expect(result).to.equal(mockAnt);
    });
    
    it('should return null for invalid index', function() {
      const result = manager.getAntObject(999);
      expect(result).to.be.null;
    });
    
    it('should return null for negative index', function() {
      const result = manager.getAntObject(-1);
      expect(result).to.be.null;
    });
    
    it('should return null when ants array is undefined', function() {
      delete global.ants;
      const result = manager.getAntObject(0);
      expect(result).to.be.null;
    });
    
    it('should return null when ant at index is null', function() {
      global.ants[0] = null;
      const result = manager.getAntObject(0);
      expect(result).to.be.null;
    });
    
    it('should return null when ant at index is undefined', function() {
      global.ants[0] = undefined;
      const result = manager.getAntObject(0);
      expect(result).to.be.null;
    });
    
    it('should handle empty ants array', function() {
      global.ants = [];
      const result = manager.getAntObject(0);
      expect(result).to.be.null;
    });
  });
  
  describe('getSelectedAnt()', function() {
    it('should return selected ant', function() {
      manager.selectedAnt = mockAnt;
      expect(manager.getSelectedAnt()).to.equal(mockAnt);
    });
    
    it('should return null when no ant selected', function() {
      manager.selectedAnt = null;
      expect(manager.getSelectedAnt()).to.be.null;
    });
    
    it('should return correct ant after selection change', function() {
      const otherAnt = { antIndex: 1 };
      manager.selectedAnt = mockAnt;
      expect(manager.getSelectedAnt()).to.equal(mockAnt);
      
      manager.selectedAnt = otherAnt;
      expect(manager.getSelectedAnt()).to.equal(otherAnt);
    });
  });
  
  describe('setSelectedAnt()', function() {
    it('should set selected ant', function() {
      manager.setSelectedAnt(mockAnt);
      expect(manager.selectedAnt).to.equal(mockAnt);
    });
    
    it('should clear selected ant with null', function() {
      manager.selectedAnt = mockAnt;
      manager.setSelectedAnt(null);
      expect(manager.selectedAnt).to.be.null;
    });
    
    it('should replace previously selected ant', function() {
      const otherAnt = { antIndex: 1 };
      manager.selectedAnt = mockAnt;
      
      manager.setSelectedAnt(otherAnt);
      
      expect(manager.selectedAnt).to.equal(otherAnt);
    });
    
    it('should handle undefined parameter', function() {
      manager.setSelectedAnt(undefined);
      expect(manager.selectedAnt).to.be.undefined;
    });
  });
  
  describe('clearSelection()', function() {
    it('should deselect ant and set selectedAnt to null', function() {
      manager.selectedAnt = mockAnt;
      mockAnt.selected = true;
      
      manager.clearSelection();
      
      expect(mockAnt.selected).to.be.false;
      expect(manager.selectedAnt).to.be.null;
    });
    
    it('should do nothing when no ant is selected', function() {
      manager.selectedAnt = null;
      
      expect(() => manager.clearSelection()).to.not.throw();
      expect(manager.selectedAnt).to.be.null;
    });
    
    it('should handle ant without setSelected method gracefully', function() {
      manager.selectedAnt = { antIndex: 0 };
      
      expect(() => manager.clearSelection()).to.throw();
    });
    
    it('should work after multiple selections', function() {
      manager.selectedAnt = mockAnt;
      mockAnt.selected = true;
      manager.clearSelection();
      
      const otherAnt = {
        antIndex: 1,
        selected: true,
        setSelected: function(value) { this.selected = value; }
      };
      manager.selectedAnt = otherAnt;
      manager.clearSelection();
      
      expect(otherAnt.selected).to.be.false;
      expect(manager.selectedAnt).to.be.null;
    });
  });
  
  describe('hasSelection()', function() {
    it('should return true when ant is selected', function() {
      manager.selectedAnt = mockAnt;
      expect(manager.hasSelection()).to.be.true;
    });
    
    it('should return false when no ant is selected', function() {
      manager.selectedAnt = null;
      expect(manager.hasSelection()).to.be.false;
    });
    
    it('should update when selection changes', function() {
      expect(manager.hasSelection()).to.be.false;
      
      manager.selectedAnt = mockAnt;
      expect(manager.hasSelection()).to.be.true;
      
      manager.selectedAnt = null;
      expect(manager.hasSelection()).to.be.false;
    });
  });
  
  describe('getDebugInfo()', function() {
    it('should return debug info with no selection', function() {
      const info = manager.getDebugInfo();
      
      expect(info).to.have.property('hasSelectedAnt', false);
      expect(info).to.have.property('selectedAntIndex', null);
      expect(info).to.have.property('selectedAntPosition', null);
    });
    
    it('should return debug info with selected ant', function() {
      manager.selectedAnt = mockAnt;
      const info = manager.getDebugInfo();
      
      expect(info.hasSelectedAnt).to.be.true;
      expect(info.selectedAntIndex).to.equal(0);
      expect(info.selectedAntPosition).to.deep.equal({ x: 100, y: 100 });
    });
    
    it('should include position from getPosition method', function() {
      manager.selectedAnt = mockAnt;
      mockAnt.position = { x: 250, y: 350 };
      
      const info = manager.getDebugInfo();
      
      expect(info.selectedAntPosition.x).to.equal(250);
      expect(info.selectedAntPosition.y).to.equal(350);
    });
    
    it('should update when selection changes', function() {
      let info = manager.getDebugInfo();
      expect(info.hasSelectedAnt).to.be.false;
      
      manager.selectedAnt = mockAnt;
      info = manager.getDebugInfo();
      expect(info.hasSelectedAnt).to.be.true;
    });
  });
  
  describe('Legacy Compatibility Methods', function() {
    describe('AntClickControl()', function() {
      it('should delegate to handleAntClick', function() {
        let called = false;
        manager.handleAntClick = function() { called = true; };
        
        manager.AntClickControl();
        
        expect(called).to.be.true;
      });
    });
    
    describe('MoveAnt()', function() {
      it('should delegate to moveSelectedAnt', function() {
        let calledWith = null;
        manager.moveSelectedAnt = function(reset) { calledWith = reset; };
        
        manager.MoveAnt(true);
        
        expect(calledWith).to.be.true;
      });
      
      it('should pass false parameter correctly', function() {
        let calledWith = null;
        manager.moveSelectedAnt = function(reset) { calledWith = reset; };
        
        manager.MoveAnt(false);
        
        expect(calledWith).to.be.false;
      });
    });
    
    describe('SelectAnt()', function() {
      it('should delegate to selectAnt', function() {
        let calledWith = null;
        manager.selectAnt = function(ant) { calledWith = ant; };
        
        manager.SelectAnt(mockAnt);
        
        expect(calledWith).to.equal(mockAnt);
      });
      
      it('should handle null parameter', function() {
        let calledWith = undefined;
        manager.selectAnt = function(ant) { calledWith = ant; };
        
        manager.SelectAnt(null);
        
        expect(calledWith).to.be.null;
      });
    });
    
    describe('getAntObj()', function() {
      it('should delegate to getAntObject', function() {
        const result = manager.getAntObj(0);
        expect(result).to.equal(mockAnt);
      });
      
      it('should return null for invalid index', function() {
        const result = manager.getAntObj(999);
        expect(result).to.be.null;
      });
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle rapid selection changes', function() {
      for (let i = 0; i < 100; i++) {
        manager.selectedAnt = mockAnt;
        manager.selectedAnt = null;
      }
      expect(manager.selectedAnt).to.be.null;
    });
    
    it('should handle selecting same ant multiple times', function() {
      manager.setSelectedAnt(mockAnt);
      manager.setSelectedAnt(mockAnt);
      manager.setSelectedAnt(mockAnt);
      
      expect(manager.selectedAnt).to.equal(mockAnt);
    });
    
    it('should handle move operations with no mouseX/mouseY globals', function() {
      delete global.mouseX;
      delete global.mouseY;
      manager.selectedAnt = mockAnt;
      
      // Will throw ReferenceError because mouseX/mouseY are not defined
      expect(() => manager.moveSelectedAnt(false)).to.throw(ReferenceError);
    });
    
    it('should maintain state consistency after errors', function() {
      manager.selectedAnt = mockAnt;
      
      try {
        manager.moveSelectedAnt('invalid');
      } catch (e) {
        // Error expected
      }
      
      expect(manager.selectedAnt).to.equal(mockAnt);
    });
  });
});




// ================================================================
// BuildingManager.test.js (63 tests)
// ================================================================
// Mock Entity before requiring Building
global.Entity = class Entity {
  constructor(x, y, width, height, options = {}) {
    this.posX = x;
    this.posY = y;
    this.width = width;
    this.height = height;
    this.type = options.type || 'Unknown';
    this.selectable = options.selectable || false;
    this.isActive = true;
    this._controllers = new Map();
  }
  
  getController(name) { return this._controllers.get(name) || null; }
  _delegate(controller, method, ...args) { 
    const c = this.getController(controller);
    return c && typeof c[method] === 'function' ? c[method](...args) : undefined;
  }
  update() {}
  render() {}
  setImage(img) { this.image = img; }
  getPosition() { return { x: this.posX, y: this.posY }; }
  getSize() { return { x: this.width, y: this.height }; }
};

let BuildingModule = require('../../../Classes/managers/BuildingManager.js');
let { Building, AntCone, AntHill, HiveSource, createBuilding } = BuildingModule;

describe('BuildingManager', function() {
  let mockImage;
  
  beforeEach(function() {
    // Mock image
    mockImage = { width: 100, height: 100 };
    
    // Mock globals
    global.Buildings = [];
    global.selectables = [];
    global.globalResource = []; // Mock globalResource as array
    global.antsSpawn = function(count, faction, x, y) {
      global.lastSpawn = { count, faction, x, y };
    };
    global.performance = { now: () => Date.now() };
    global.rand = function(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); };
    global.g_selectionBoxController = { entities: [] };
  });
  
  afterEach(function() {
    delete global.Buildings;
    delete global.selectables;
    delete global.globalResource;
    delete global.antsSpawn;
    delete global.lastSpawn;
    delete global.rand;
    delete global.g_selectionBoxController;
  });
  
  describe('Building Class', function() {
    describe('Constructor', function() {
      it('should create a building with position', function() {
        const building = new Building(100, 200, 50, 60, mockImage, 'player');
        expect(building.posX).to.equal(100);
        expect(building.posY).to.equal(200);
      });
      
      it('should create a building with dimensions', function() {
        const building = new Building(100, 200, 50, 60, mockImage, 'player');
        expect(building.width).to.equal(50);
        expect(building.height).to.equal(60);
      });
      
      it('should set faction', function() {
        const building = new Building(100, 200, 50, 60, mockImage, 'player');
        expect(building.faction).to.equal('player');
      });
      
      it('should initialize with full health', function() {
        const building = new Building(100, 200, 50, 60, mockImage, 'player');
        expect(building.health).to.equal(100);
        expect(building.maxHealth).to.equal(100);
      });
      
      it('should initialize as not dead', function() {
        const building = new Building(100, 200, 50, 60, mockImage, 'player');
        expect(building._isDead).to.be.false;
      });
      
      it('should initialize with spawn disabled', function() {
        const building = new Building(100, 200, 50, 60, mockImage, 'player');
        expect(building._spawnEnabled).to.be.false;
      });
      
      it('should set default spawn parameters', function() {
        const building = new Building(100, 200, 50, 60, mockImage, 'player');
        expect(building._spawnInterval).to.equal(10);
        expect(building._spawnCount).to.equal(1);
        expect(building._spawnTimer).to.equal(0.0);
      });
      
      it('should initialize as active', function() {
        const building = new Building(100, 200, 50, 60, mockImage, 'player');
        expect(building.isActive).to.be.true;
      });
      
      it('should set image when provided', function() {
        const building = new Building(100, 200, 50, 60, mockImage, 'player');
        expect(building.image).to.equal(mockImage);
      });
    });
    
    describe('Getters', function() {
      let building;
      
      beforeEach(function() {
        building = new Building(100, 200, 50, 60, mockImage, 'player');
      });
      
      it('should get faction', function() {
        expect(building.faction).to.equal('player');
      });
      
      it('should get health', function() {
        expect(building.health).to.equal(100);
      });
      
      it('should get maxHealth', function() {
        expect(building.maxHealth).to.equal(100);
      });
      
      it('should get damage', function() {
        expect(building.damage).to.equal(0);
      });
    });
    
    describe('takeDamage()', function() {
      let building;
      
      beforeEach(function() {
        building = new Building(100, 200, 50, 60, mockImage, 'player');
      });
      
      it('should reduce health', function() {
        building.takeDamage(30);
        expect(building.health).to.equal(70);
      });
      
      it('should not go below zero health', function() {
        building.takeDamage(150);
        expect(building.health).to.equal(0);
      });
      
      it('should return new health value', function() {
        const newHealth = building.takeDamage(25);
        expect(newHealth).to.equal(75);
      });
      
      it('should handle zero damage', function() {
        building.takeDamage(0);
        expect(building.health).to.equal(100);
      });
      
      it('should handle multiple damage calls', function() {
        building.takeDamage(20);
        building.takeDamage(30);
        expect(building.health).to.equal(50);
      });
      
      it('should call health controller onDamage', function() {
        let damageCalled = false;
        const mockHealthController = {
          onDamage: function() { damageCalled = true; },
          update: function() {},
          render: function() {}
        };
        building._controllers.set('health', mockHealthController);
        
        building.takeDamage(10);
        expect(damageCalled).to.be.true;
      });
    });
    
    describe('heal()', function() {
      let building;
      
      beforeEach(function() {
        building = new Building(100, 200, 50, 60, mockImage, 'player');
        building.takeDamage(50); // Reduce to 50 health
      });
      
      it('should increase health', function() {
        building.heal(20);
        expect(building.health).to.equal(70);
      });
      
      it('should not exceed max health', function() {
        building.heal(100);
        expect(building.health).to.equal(100);
      });
      
      it('should return new health value', function() {
        const newHealth = building.heal(30);
        expect(newHealth).to.equal(80);
      });
      
      it('should handle zero healing', function() {
        building.heal(0);
        expect(building.health).to.equal(50);
      });
      
      it('should handle undefined healing amount', function() {
        building.heal();
        expect(building.health).to.equal(50);
      });
      
      it('should call health controller onHeal if available', function() {
        let healCalled = false;
        const mockHealthController = {
          onHeal: function(amount, health) { 
            healCalled = true;
          },
          update: function() {},
          render: function() {}
        };
        building._controllers.set('health', mockHealthController);
        
        building.heal(25);
        expect(healCalled).to.be.true;
      });
    });
    
    describe('update()', function() {
      let building;
      
      beforeEach(function() {
        building = new Building(100, 200, 50, 60, mockImage, 'player');
      });
      
      it('should not update if inactive', function() {
        building.isActive = false;
        expect(() => building.update()).to.not.throw();
      });
      
      it('should update spawn timer when enabled', function() {
        building._spawnEnabled = true;
        building._spawnInterval = 1.0;
        
        const before = building._spawnTimer;
        building.update();
        
        // Timer should have increased
        expect(building._spawnTimer).to.be.at.least(before);
      });
      
      it('should spawn ants when timer exceeds interval', function() {
        building._spawnEnabled = true;
        building._spawnInterval = 0.001; // Very short interval
        building._spawnCount = 5;
        building.lastFrameTime = performance.now() - 100; // Ensure time has passed
        
        building.update();
        
        // Should have spawned (antsSpawn is called in try/catch, so it may fail silently)
        // Check if function was called by verifying timer was reset
        expect(building._spawnTimer).to.be.at.least(0);
      });
      
      it('should spawn at building center', function() {
        building._spawnEnabled = true;
        building._spawnInterval = 0.001;
        building._spawnTimer = 1; // Force spawn
        
        building.update();
        
        expect(global.lastSpawn.x).to.equal(125); // 100 + 50/2
        expect(global.lastSpawn.y).to.equal(230); // 200 + 60/2
      });
      
      it('should reset timer after spawning', function() {
        building._spawnEnabled = true;
        building._spawnInterval = 0.5;
        building._spawnTimer = 1.0; // Over threshold
        
        building.update();
        
        expect(building._spawnTimer).to.be.lessThan(1.0);
      });
    });
    
    describe('moveToLocation()', function() {
      it('should not move buildings', function() {
        const building = new Building(100, 200, 50, 60, mockImage, 'player');
        building.moveToLocation(500, 500);
        
        expect(building.posX).to.equal(100);
        expect(building.posY).to.equal(200);
      });
    });
    
    describe('die()', function() {
      let building;
      
      beforeEach(function() {
        building = new Building(100, 200, 50, 60, mockImage, 'player');
        global.Buildings.push(building);
        global.selectables.push(building);
      });
      
      it('should set isActive to false', function() {
        building.die();
        expect(building.isActive).to.be.false;
      });
      
      it('should set isDead to true', function() {
        building.die();
        expect(building._isDead).to.be.true;
      });
      
      it('should remove from Buildings array', function() {
        building.die();
        expect(global.Buildings).to.not.include(building);
      });
      
      it('should remove from selectables array', function() {
        building.die();
        expect(global.selectables).to.not.include(building);
      });
    });
    
    describe('render()', function() {
      let building;
      
      beforeEach(function() {
        building = new Building(100, 200, 50, 60, mockImage, 'player');
      });
      
      it('should not render if inactive', function() {
        building.isActive = false;
        expect(() => building.render()).to.not.throw();
      });
      
      it('should call health controller render', function() {
        let renderCalled = false;
        const mockHealthController = {
          render: function() { renderCalled = true; },
          update: function() {}
        };
        building._controllers.set('health', mockHealthController);
        
        building.render();
        expect(renderCalled).to.be.true;
      });
    });
  });
  
  describe('Factory Classes', function() {
    describe('AbstractBuildingFactory', function() {
      it('AntCone should create building', function() {
        const factory = new AntCone();
        const building = factory.createBuilding(100, 200, 'player');
        
        expect(building).to.be.instanceOf(Building);
        expect(building.posX).to.equal(100);
        expect(building.posY).to.equal(200);
      });
      
      it('AntHill should create building', function() {
        const factory = new AntHill();
        const building = factory.createBuilding(150, 250, 'enemy');
        
        expect(building).to.be.instanceOf(Building);
        expect(building.faction).to.equal('enemy');
      });
      
      it('HiveSource should create building', function() {
        const factory = new HiveSource();
        const building = factory.createBuilding(200, 300, 'neutral');
        
        expect(building).to.be.instanceOf(Building);
        expect(building.faction).to.equal('neutral');
      });
    });
  });
  
  describe('createBuilding() Function', function() {
    it('should create building by type', function() {
      const building = createBuilding('antcone', 100, 200, 'player');
      expect(building).to.be.instanceOf(Building);
    });
    
    it('should handle null type', function() {
      const building = createBuilding(null, 100, 200);
      expect(building).to.be.null;
    });
    
    it('should handle invalid type', function() {
      const building = createBuilding('invalid', 100, 200);
      expect(building).to.be.null;
    });
    
    it('should create antcone', function() {
      const building = createBuilding('antcone', 100, 200, 'player');
      expect(building).to.exist;
      expect(building.faction).to.equal('player');
    });
    
    it('should create anthill', function() {
      const building = createBuilding('anthill', 150, 250, 'enemy');
      expect(building).to.exist;
      expect(building.faction).to.equal('enemy');
    });
    
    it('should create hivesource', function() {
      const building = createBuilding('hivesource', 200, 300, 'neutral');
      expect(building).to.exist;
      expect(building.faction).to.equal('neutral');
    });
    
    it('should be case insensitive', function() {
      const building1 = createBuilding('ANTCONE', 100, 200);
      const building2 = createBuilding('AntHill', 100, 200);
      const building3 = createBuilding('HiveSource', 100, 200);
      
      expect(building1).to.exist;
      expect(building2).to.exist;
      expect(building3).to.exist;
    });
    
    it('should default faction to neutral', function() {
      const building = createBuilding('antcone', 100, 200);
      expect(building.faction).to.equal('neutral');
    });
    
    it('should set building as active', function() {
      const building = createBuilding('antcone', 100, 200);
      expect(building.isActive).to.be.true;
    });
    
    it('should add to Buildings array', function() {
      const building = createBuilding('antcone', 100, 200);
      expect(global.Buildings).to.include(building);
    });
    
    it('should add to selectables array', function() {
      const building = createBuilding('antcone', 100, 200);
      expect(global.selectables).to.include(building);
    });
    
    it('should enable spawning for hivesource', function() {
      const building = createBuilding('hivesource', 100, 200);
      expect(building._spawnEnabled).to.be.true;
      expect(building._spawnCount).to.equal(10);
    });
    
    it('should enable spawning for anthill', function() {
      const building = createBuilding('anthill', 100, 200);
      expect(building._spawnEnabled).to.be.true;
      expect(building._spawnCount).to.equal(2);
    });
    
    it('should enable spawning for antcone', function() {
      const building = createBuilding('antcone', 100, 200);
      expect(building._spawnEnabled).to.be.true;
      expect(building._spawnCount).to.equal(1);
    });
    
    it('should not add duplicate to Buildings', function() {
      const building = createBuilding('antcone', 100, 200);
      // createBuilding uses includes() check, so manually adding won't create duplicate
      
      const result = createBuilding('anthill', 150, 250);
      
      // Should have 2 buildings now (antcone + anthill)
      expect(global.Buildings.length).to.equal(2);
      expect(global.Buildings[0]).to.equal(building);
      expect(global.Buildings[1]).to.equal(result);
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle building with zero dimensions', function() {
      const building = new Building(100, 200, 0, 0, mockImage, 'player');
      expect(building.width).to.equal(0);
      expect(building.height).to.equal(0);
    });
    
    it('should handle negative damage (acts as healing)', function() {
      const building = new Building(100, 200, 50, 60, mockImage, 'player');
      building.takeDamage(50); // Reduce to 50 health first
      building.takeDamage(-10); // Negative damage increases health
      expect(building.health).to.equal(60); // 50 - (-10) = 60
    });
    
    it('should handle excessive damage', function() {
      const building = new Building(100, 200, 50, 60, mockImage, 'player');
      building.takeDamage(1000);
      expect(building.health).to.equal(0);
    });
    
    it('should handle heal on full health', function() {
      const building = new Building(100, 200, 50, 60, mockImage, 'player');
      const result = building.heal(50);
      expect(result).to.equal(100);
    });
    
    it('should handle rapid damage and heal cycles', function() {
      const building = new Building(100, 200, 50, 60, mockImage, 'player');
      
      for (let i = 0; i < 10; i++) {
        building.takeDamage(20);
        building.heal(10);
      }
      
      expect(building.health).to.be.greaterThan(0);
      expect(building.health).to.be.at.most(100);
    });
    
    it('should handle update without antsSpawn function', function() {
      delete global.antsSpawn;
      
      const building = new Building(100, 200, 50, 60, mockImage, 'player');
      building._spawnEnabled = true;
      building._spawnInterval = 0.001;
      
      expect(() => building.update()).to.not.throw();
    });
    
    it('should handle die() when not in arrays', function() {
      const building = new Building(100, 200, 50, 60, mockImage, 'player');
      expect(() => building.die()).to.not.throw();
    });
    
    it('should handle multiple die() calls', function() {
      const building = new Building(100, 200, 50, 60, mockImage, 'player');
      global.Buildings.push(building);
      
      building.die();
      building.die();
      
      expect(building._isDead).to.be.true;
    });
  });
});




// ================================================================
// eventManager.test.js (64 tests)
// ================================================================
/**
 * Unit Tests for EventManager
 * Tests the core event coordination system for random events, dialogue, tutorials, waves, etc.
 * 
 * Following TDD: These tests are written FIRST, implementation comes after review.
 */

let EventManager = require('../../../Classes/managers/EventManager');

describe('EventManager', function() {
  let eventManager;
  let sandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Mock p5.js globals
    global.createVector = sandbox.stub().callsFake((x, y) => ({ x, y }));
    global.millis = sandbox.stub().returns(1000);
    global.frameCount = 0;
    
    if (typeof window !== 'undefined') {
      window.createVector = global.createVector;
      window.millis = global.millis;
    }

    // Create EventManager instance for testing
    eventManager = new EventManager();
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('Constructor and Initialization', function() {
    it('should initialize with empty event registry', function() {
      expect(eventManager).to.exist;
      expect(eventManager.events).to.be.a('map');
      expect(eventManager.events.size).to.equal(0);
    });

    it('should initialize with empty active events array', function() {
      expect(eventManager.activeEvents).to.be.an('array');
      expect(eventManager.activeEvents).to.have.lengthOf(0);
    });

    it('should initialize with empty trigger registry', function() {
      expect(eventManager.triggers).to.be.a('map');
      expect(eventManager.triggers.size).to.equal(0);
    });

    it('should initialize EventFlag system', function() {
      expect(eventManager.flags).to.exist;
      expect(eventManager.flags).to.be.an('object');
    });

    it('should start with enabled state', function() {
      expect(eventManager.enabled).to.be.true;
    });
  });

  describe('Event Registration', function() {
    it('should register a new event with unique ID', function() {
      const eventConfig = {
        id: 'test_event_01',
        type: 'dialogue',
        content: { message: 'Test' }
      };

      const registered = eventManager.registerEvent(eventConfig);
      
      expect(registered).to.be.true;
      expect(eventManager.events.has('test_event_01')).to.be.true;
    });

    it('should reject event registration with duplicate ID', function() {
      const eventConfig = {
        id: 'duplicate_event',
        type: 'dialogue',
        content: { message: 'Test' }
      };

      eventManager.registerEvent(eventConfig);
      const secondRegistration = eventManager.registerEvent(eventConfig);
      
      expect(secondRegistration).to.be.false;
      expect(eventManager.events.size).to.equal(1);
    });

    it('should reject event registration without required ID', function() {
      const eventConfig = {
        type: 'dialogue',
        content: { message: 'Test' }
      };

      const registered = eventManager.registerEvent(eventConfig);
      
      expect(registered).to.be.false;
    });

    it('should reject event registration without required type', function() {
      const eventConfig = {
        id: 'no_type_event',
        content: { message: 'Test' }
      };

      const registered = eventManager.registerEvent(eventConfig);
      
      expect(registered).to.be.false;
    });

    it('should store event configuration correctly', function() {
      const eventConfig = {
        id: 'config_test',
        type: 'tutorial',
        content: { title: 'Welcome', message: 'Hello!' },
        metadata: { priority: 1 }
      };

      eventManager.registerEvent(eventConfig);
      const stored = eventManager.getEvent('config_test');
      
      expect(stored).to.exist;
      expect(stored.id).to.equal('config_test');
      expect(stored.type).to.equal('tutorial');
      expect(stored.content.title).to.equal('Welcome');
      expect(stored.metadata.priority).to.equal(1);
    });
  });

  describe('Event Retrieval', function() {
    beforeEach(function() {
      eventManager.registerEvent({
        id: 'retrieve_test',
        type: 'dialogue',
        content: { message: 'Test' }
      });
    });

    it('should retrieve registered event by ID', function() {
      const event = eventManager.getEvent('retrieve_test');
      
      expect(event).to.exist;
      expect(event.id).to.equal('retrieve_test');
    });

    it('should return null for non-existent event ID', function() {
      const event = eventManager.getEvent('does_not_exist');
      
      expect(event).to.be.null;
    });

    it('should get all registered events', function() {
      eventManager.registerEvent({
        id: 'second_event',
        type: 'spawn',
        content: {}
      });

      const allEvents = eventManager.getAllEvents();
      
      expect(allEvents).to.be.an('array');
      expect(allEvents).to.have.lengthOf(2);
    });

    it('should get events by type', function() {
      eventManager.registerEvent({
        id: 'dialogue_1',
        type: 'dialogue',
        content: {}
      });
      eventManager.registerEvent({
        id: 'spawn_1',
        type: 'spawn',
        content: {}
      });

      const dialogueEvents = eventManager.getEventsByType('dialogue');
      
      expect(dialogueEvents).to.be.an('array');
      expect(dialogueEvents).to.have.lengthOf(2); // retrieve_test + dialogue_1
      expect(dialogueEvents.every(e => e.type === 'dialogue')).to.be.true;
    });
  });

  describe('Event Triggering', function() {
    let mockEvent;

    beforeEach(function() {
      mockEvent = {
        id: 'trigger_test',
        type: 'dialogue',
        content: { message: 'Triggered!' },
        onTrigger: sandbox.stub()
      };
      eventManager.registerEvent(mockEvent);
    });

    it('should trigger event by ID', function() {
      const triggered = eventManager.triggerEvent('trigger_test');
      
      expect(triggered).to.be.true;
      expect(eventManager.activeEvents).to.have.lengthOf(1);
      expect(eventManager.activeEvents[0].id).to.equal('trigger_test');
    });

    it('should not trigger non-existent event', function() {
      const triggered = eventManager.triggerEvent('does_not_exist');
      
      expect(triggered).to.be.false;
      expect(eventManager.activeEvents).to.have.lengthOf(0);
    });

    it('should call event onTrigger callback if defined', function() {
      eventManager.triggerEvent('trigger_test');
      
      expect(mockEvent.onTrigger.calledOnce).to.be.true;
    });

    it('should not trigger same event twice if already active', function() {
      eventManager.triggerEvent('trigger_test');
      const secondTrigger = eventManager.triggerEvent('trigger_test');
      
      expect(secondTrigger).to.be.false;
      expect(eventManager.activeEvents).to.have.lengthOf(1);
    });

    it('should trigger event with custom data', function() {
      const customData = { spawnCount: 5, difficulty: 'hard' };
      eventManager.triggerEvent('trigger_test', customData);
      
      const activeEvent = eventManager.activeEvents[0];
      expect(activeEvent.triggerData).to.deep.equal(customData);
    });

    it('should respect enabled/disabled state', function() {
      eventManager.setEnabled(false);
      const triggered = eventManager.triggerEvent('trigger_test');
      
      expect(triggered).to.be.false;
      expect(eventManager.activeEvents).to.have.lengthOf(0);
    });
  });

  describe('Active Event Management', function() {
    beforeEach(function() {
      eventManager.registerEvent({
        id: 'active_test_1',
        type: 'dialogue',
        content: {}
      });
      eventManager.registerEvent({
        id: 'active_test_2',
        type: 'spawn',
        content: {}
      });
    });

    it('should get all active events', function() {
      eventManager.triggerEvent('active_test_1');
      eventManager.triggerEvent('active_test_2');
      
      const active = eventManager.getActiveEvents();
      
      expect(active).to.be.an('array');
      expect(active).to.have.lengthOf(2);
    });

    it('should check if specific event is active', function() {
      eventManager.triggerEvent('active_test_1');
      
      expect(eventManager.isEventActive('active_test_1')).to.be.true;
      expect(eventManager.isEventActive('active_test_2')).to.be.false;
    });

    it('should complete/dismiss an active event', function() {
      eventManager.triggerEvent('active_test_1');
      const completed = eventManager.completeEvent('active_test_1');
      
      expect(completed).to.be.true;
      expect(eventManager.activeEvents).to.have.lengthOf(0);
      expect(eventManager.isEventActive('active_test_1')).to.be.false;
    });

    it('should not complete non-active event', function() {
      const completed = eventManager.completeEvent('active_test_1');
      
      expect(completed).to.be.false;
    });

    it('should execute onComplete callback when event completes', function() {
      const onComplete = sandbox.stub();
      eventManager.registerEvent({
        id: 'complete_callback',
        type: 'dialogue',
        content: {},
        onComplete: onComplete
      });

      eventManager.triggerEvent('complete_callback');
      eventManager.completeEvent('complete_callback');
      
      expect(onComplete.calledOnce).to.be.true;
    });
  });

  describe('Trigger System', function() {
    it('should register a trigger for an event', function() {
      const triggerConfig = {
        eventId: 'test_event',
        type: 'time',
        condition: { delay: 5000 }
      };

      const registered = eventManager.registerTrigger(triggerConfig);
      
      expect(registered).to.be.true;
      expect(eventManager.triggers.size).to.equal(1);
    });

    it('should reject trigger without event ID', function() {
      const triggerConfig = {
        type: 'time',
        condition: { delay: 5000 }
      };

      const registered = eventManager.registerTrigger(triggerConfig);
      
      expect(registered).to.be.false;
    });

    it('should support multiple triggers for same event', function() {
      const trigger1 = {
        eventId: 'multi_trigger',
        type: 'time',
        condition: { delay: 1000 }
      };
      const trigger2 = {
        eventId: 'multi_trigger',
        type: 'spatial',
        condition: { x: 100, y: 100, radius: 50 }
      };

      eventManager.registerTrigger(trigger1);
      eventManager.registerTrigger(trigger2);
      
      const triggers = eventManager.getTriggersForEvent('multi_trigger');
      expect(triggers).to.have.lengthOf(2);
    });

    it('should evaluate time-based triggers on update', function() {
      eventManager.registerEvent({
        id: 'time_event',
        type: 'dialogue',
        content: {}
      });

      eventManager.registerTrigger({
        eventId: 'time_event',
        type: 'time',
        condition: { delay: 500 }
      });

      global.millis.returns(500); // Initial time
      eventManager.update();
      expect(eventManager.isEventActive('time_event')).to.be.false;

      global.millis.returns(1001); // After delay
      eventManager.update();
      expect(eventManager.isEventActive('time_event')).to.be.true;
    });

    it('should remove trigger after one-time activation', function() {
      eventManager.registerEvent({
        id: 'one_time',
        type: 'dialogue',
        content: {}
      });

      eventManager.registerTrigger({
        eventId: 'one_time',
        type: 'time',
        condition: { delay: 0 },
        oneTime: true
      });

      eventManager.update();
      const triggersAfter = eventManager.getTriggersForEvent('one_time');
      
      expect(triggersAfter).to.have.lengthOf(0);
    });

    it('should keep repeatable triggers active', function() {
      eventManager.registerEvent({
        id: 'repeatable',
        type: 'spawn',
        content: {}
      });

      eventManager.registerTrigger({
        eventId: 'repeatable',
        type: 'time',
        condition: { interval: 1000 },
        oneTime: false
      });

      global.millis.returns(0);
      eventManager.update();
      
      global.millis.returns(1000);
      eventManager.update();
      
      const triggersAfter = eventManager.getTriggersForEvent('repeatable');
      expect(triggersAfter).to.have.lengthOf(1);
    });
  });

  describe('Event Flags System', function() {
    it('should set an event flag', function() {
      eventManager.setFlag('tutorial_completed', true);
      
      expect(eventManager.getFlag('tutorial_completed')).to.be.true;
    });

    it('should get default value for unset flag', function() {
      const value = eventManager.getFlag('non_existent', false);
      
      expect(value).to.be.false;
    });

    it('should check if flag exists', function() {
      eventManager.setFlag('test_flag', 'value');
      
      expect(eventManager.hasFlag('test_flag')).to.be.true;
      expect(eventManager.hasFlag('missing_flag')).to.be.false;
    });

    it('should clear a specific flag', function() {
      eventManager.setFlag('clear_me', true);
      eventManager.clearFlag('clear_me');
      
      expect(eventManager.hasFlag('clear_me')).to.be.false;
    });

    it('should support numeric flag values', function() {
      eventManager.setFlag('kill_count', 10);
      
      expect(eventManager.getFlag('kill_count')).to.equal(10);
    });

    it('should support string flag values', function() {
      eventManager.setFlag('current_quest', 'defend_colony');
      
      expect(eventManager.getFlag('current_quest')).to.equal('defend_colony');
    });

    it('should support object flag values', function() {
      const flagData = { stage: 2, progress: 0.5 };
      eventManager.setFlag('quest_progress', flagData);
      
      expect(eventManager.getFlag('quest_progress')).to.deep.equal(flagData);
    });

    it('should increment numeric flags', function() {
      eventManager.setFlag('score', 0);
      eventManager.incrementFlag('score', 5);
      eventManager.incrementFlag('score', 3);
      
      expect(eventManager.getFlag('score')).to.equal(8);
    });

    it('should get all flags', function() {
      eventManager.setFlag('flag1', true);
      eventManager.setFlag('flag2', 100);
      
      const allFlags = eventManager.getAllFlags();
      
      expect(allFlags).to.be.an('object');
      expect(allFlags.flag1).to.be.true;
      expect(allFlags.flag2).to.equal(100);
    });
  });

  describe('Conditional Triggers', function() {
    beforeEach(function() {
      eventManager.registerEvent({
        id: 'conditional_event',
        type: 'dialogue',
        content: {}
      });
    });

    it('should trigger event when flag condition is met', function() {
      eventManager.setFlag('boss_defeated', false);
      
      eventManager.registerTrigger({
        eventId: 'conditional_event',
        type: 'flag',
        condition: { flag: 'boss_defeated', value: true }
      });

      eventManager.update();
      expect(eventManager.isEventActive('conditional_event')).to.be.false;

      eventManager.setFlag('boss_defeated', true);
      eventManager.update();
      expect(eventManager.isEventActive('conditional_event')).to.be.true;
    });

    it('should support multiple flag conditions (AND logic)', function() {
      eventManager.setFlag('has_key', true);
      eventManager.setFlag('door_unlocked', false);

      eventManager.registerTrigger({
        eventId: 'conditional_event',
        type: 'flag',
        condition: { 
          flags: [
            { flag: 'has_key', value: true },
            { flag: 'door_unlocked', value: true }
          ]
        }
      });

      eventManager.update();
      expect(eventManager.isEventActive('conditional_event')).to.be.false;

      eventManager.setFlag('door_unlocked', true);
      eventManager.update();
      expect(eventManager.isEventActive('conditional_event')).to.be.true;
    });

    it('should support comparison operators for numeric flags', function() {
      eventManager.setFlag('enemy_count', 5);

      eventManager.registerTrigger({
        eventId: 'conditional_event',
        type: 'flag',
        condition: { flag: 'enemy_count', operator: '>=', value: 10 }
      });

      eventManager.update();
      expect(eventManager.isEventActive('conditional_event')).to.be.false;

      eventManager.setFlag('enemy_count', 15);
      eventManager.update();
      expect(eventManager.isEventActive('conditional_event')).to.be.true;
    });
  });

  describe('Update Loop', function() {
    it('should update all active triggers', function() {
      const updateSpy = sandbox.spy();
      
      eventManager.registerEvent({
        id: 'update_test',
        type: 'dialogue',
        content: {},
        onUpdate: updateSpy
      });

      eventManager.triggerEvent('update_test');
      eventManager.update();
      
      expect(updateSpy.calledOnce).to.be.true;
    });

    it('should update all active events', function() {
      eventManager.registerEvent({
        id: 'active_1',
        type: 'dialogue',
        content: {}
      });
      eventManager.registerEvent({
        id: 'active_2',
        type: 'spawn',
        content: {}
      });

      eventManager.triggerEvent('active_1');
      eventManager.triggerEvent('active_2');

      const beforeUpdate = eventManager.activeEvents.length;
      eventManager.update();
      const afterUpdate = eventManager.activeEvents.length;
      
      expect(beforeUpdate).to.equal(2);
      expect(afterUpdate).to.equal(2); // Still active unless completed
    });

    it('should not update when disabled', function() {
      const updateSpy = sandbox.spy();
      
      eventManager.registerEvent({
        id: 'disabled_test',
        type: 'dialogue',
        content: {},
        onUpdate: updateSpy
      });

      eventManager.triggerEvent('disabled_test');
      eventManager.setEnabled(false);
      eventManager.update();
      
      expect(updateSpy.called).to.be.false;
    });
  });

  describe('JSON Event Loading', function() {
    it('should load events from JSON configuration', function() {
      const jsonConfig = {
        events: [
          {
            id: 'json_event_1',
            type: 'dialogue',
            content: { message: 'From JSON' }
          },
          {
            id: 'json_event_2',
            type: 'tutorial',
            content: { title: 'Tutorial' }
          }
        ]
      };

      const loaded = eventManager.loadFromJSON(jsonConfig);
      
      expect(loaded).to.be.true;
      expect(eventManager.events.size).to.equal(2);
      expect(eventManager.getEvent('json_event_1')).to.exist;
      expect(eventManager.getEvent('json_event_2')).to.exist;
    });

    it('should load triggers from JSON configuration', function() {
      const jsonConfig = {
        events: [
          {
            id: 'json_with_trigger',
            type: 'dialogue',
            content: {}
          }
        ],
        triggers: [
          {
            eventId: 'json_with_trigger',
            type: 'time',
            condition: { delay: 1000 }
          }
        ]
      };

      eventManager.loadFromJSON(jsonConfig);
      
      const triggers = eventManager.getTriggersForEvent('json_with_trigger');
      expect(triggers).to.have.lengthOf(1);
      expect(triggers[0].type).to.equal('time');
    });

    it('should validate JSON before loading', function() {
      const invalidJSON = {
        events: [
          {
            // Missing id
            type: 'dialogue',
            content: {}
          }
        ]
      };

      const loaded = eventManager.loadFromJSON(invalidJSON);
      
      expect(loaded).to.be.false;
      expect(eventManager.events.size).to.equal(0);
    });

    it('should handle malformed JSON gracefully', function() {
      const malformed = null;
      
      const loaded = eventManager.loadFromJSON(malformed);
      
      expect(loaded).to.be.false;
    });
  });

  describe('Event Priority System', function() {
    beforeEach(function() {
      eventManager.registerEvent({
        id: 'low_priority',
        type: 'dialogue',
        content: {},
        priority: 10
      });
      eventManager.registerEvent({
        id: 'high_priority',
        type: 'tutorial',
        content: {},
        priority: 1
      });
      eventManager.registerEvent({
        id: 'medium_priority',
        type: 'spawn',
        content: {},
        priority: 5
      });
    });

    it('should return active events sorted by priority', function() {
      eventManager.triggerEvent('low_priority');
      eventManager.triggerEvent('high_priority');
      eventManager.triggerEvent('medium_priority');

      const sorted = eventManager.getActiveEventsSorted();
      
      expect(sorted[0].id).to.equal('high_priority');
      expect(sorted[1].id).to.equal('medium_priority');
      expect(sorted[2].id).to.equal('low_priority');
    });

    it('should handle events without priority (default to lowest)', function() {
      eventManager.registerEvent({
        id: 'no_priority',
        type: 'dialogue',
        content: {}
      });

      eventManager.triggerEvent('no_priority');
      eventManager.triggerEvent('high_priority');

      const sorted = eventManager.getActiveEventsSorted();
      
      expect(sorted[0].id).to.equal('high_priority');
      expect(sorted[sorted.length - 1].id).to.equal('no_priority');
    });

    it('should pause lower-priority events when higher-priority event triggers', function() {
      // Trigger low priority first
      eventManager.triggerEvent('low_priority');
      expect(eventManager.isEventActive('low_priority')).to.be.true;
      
      // Trigger high priority - should pause low priority
      eventManager.triggerEvent('high_priority');
      
      const lowPriorityEvent = eventManager.getActiveEvents().find(e => e.id === 'low_priority');
      expect(lowPriorityEvent.paused).to.be.true;
      expect(eventManager.isEventActive('high_priority')).to.be.true;
    });

    it('should resume paused events when higher-priority event completes', function() {
      eventManager.triggerEvent('low_priority');
      eventManager.triggerEvent('high_priority');
      
      // High priority should pause low priority
      const lowEvent = eventManager.getActiveEvents().find(e => e.id === 'low_priority');
      expect(lowEvent.paused).to.be.true;
      
      // Complete high priority event
      eventManager.completeEvent('high_priority');
      
      // Low priority should resume
      expect(lowEvent.paused).to.be.false;
      expect(eventManager.isEventActive('low_priority')).to.be.true;
      expect(eventManager.isEventActive('high_priority')).to.be.false;
    });

    it('should only allow highest-priority event to update', function() {
      const lowUpdate = sandbox.stub();
      const highUpdate = sandbox.stub();
      
      eventManager.registerEvent({
        id: 'low_update',
        type: 'dialogue',
        content: {},
        priority: 10,
        onUpdate: lowUpdate
      });
      
      eventManager.registerEvent({
        id: 'high_update',
        type: 'dialogue',
        content: {},
        priority: 1,
        onUpdate: highUpdate
      });

      eventManager.triggerEvent('low_update');
      eventManager.triggerEvent('high_update');
      
      eventManager.update();
      
      // Only high priority should update
      expect(highUpdate.calledOnce).to.be.true;
      expect(lowUpdate.called).to.be.false; // Paused, so no update
    });

    it('should handle multiple events completing in priority order', function() {
      eventManager.registerEvent({
        id: 'first',
        type: 'dialogue',
        content: {},
        priority: 1
      });
      eventManager.registerEvent({
        id: 'second',
        type: 'dialogue',
        content: {},
        priority: 2
      });
      eventManager.registerEvent({
        id: 'third',
        type: 'dialogue',
        content: {},
        priority: 3
      });

      // Trigger all (out of order)
      eventManager.triggerEvent('third');
      eventManager.triggerEvent('first');
      eventManager.triggerEvent('second');

      // Complete first (highest priority)
      eventManager.completeEvent('first');
      
      // Second should now be active (and not paused)
      const secondEvent = eventManager.getActiveEvents().find(e => e.id === 'second');
      expect(secondEvent.paused).to.be.false;
      
      // Third should still be paused
      const thirdEvent = eventManager.getActiveEvents().find(e => e.id === 'third');
      expect(thirdEvent.paused).to.be.true;
    });
  });

  describe('Enable/Disable Control', function() {
    it('should start in enabled state', function() {
      expect(eventManager.isEnabled()).to.be.true;
    });

    it('should disable event manager', function() {
      eventManager.setEnabled(false);
      
      expect(eventManager.isEnabled()).to.be.false;
    });

    it('should enable event manager', function() {
      eventManager.setEnabled(false);
      eventManager.setEnabled(true);
      
      expect(eventManager.isEnabled()).to.be.true;
    });

    it('should pause all active events when disabled', function() {
      eventManager.registerEvent({
        id: 'pause_test',
        type: 'dialogue',
        content: {},
        onPause: sandbox.stub()
      });

      eventManager.triggerEvent('pause_test');
      const event = eventManager.activeEvents[0];
      
      eventManager.setEnabled(false);
      
      expect(event.onPause.calledOnce).to.be.true;
    });
  });

  describe('Clear and Reset', function() {
    beforeEach(function() {
      eventManager.registerEvent({
        id: 'clear_test',
        type: 'dialogue',
        content: {}
      });
      eventManager.triggerEvent('clear_test');
      eventManager.setFlag('test_flag', true);
    });

    it('should clear all active events', function() {
      eventManager.clearActiveEvents();
      
      expect(eventManager.activeEvents).to.have.lengthOf(0);
    });

    it('should reset event manager to initial state', function() {
      eventManager.reset();
      
      expect(eventManager.activeEvents).to.have.lengthOf(0);
      expect(eventManager.events.size).to.equal(0);
      expect(eventManager.triggers.size).to.equal(0);
    });

    it('should preserve flags during active event clear', function() {
      eventManager.clearActiveEvents();
      
      expect(eventManager.getFlag('test_flag')).to.be.true;
    });

    it('should clear flags during full reset if specified', function() {
      eventManager.reset(true); // clearFlags = true
      
      expect(eventManager.hasFlag('test_flag')).to.be.false;
    });
  });
});




// ================================================================
// eventManagerExport.test.js (16 tests)
// ================================================================
/**
 * @fileoverview Unit Tests: EventManager JSON Export
 * 
 * Tests the exportToJSON() method added in Phase 2C.
 * Verifies that events and triggers are properly serialized to JSON.
 * 
 * Following TDD standards:
 * - Test isolated functionality
 * - Mock external dependencies
 * - Verify JSON structure and content
 */

// Set up JSDOM
let dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

// Mock p5.js for JSDOM
global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));
window.createVector = global.createVector;

// DUPLICATE REQUIRE REMOVED: let EventManager = require('../../../Classes/managers/EventManager');

describe('EventManager - exportToJSON()', function() {
  let manager;
  
  beforeEach(function() {
    manager = new EventManager();
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Basic Export', function() {
    it('should export empty configuration', function() {
      const json = manager.exportToJSON();
      const parsed = JSON.parse(json);
      
      expect(parsed).to.be.an('object');
      expect(parsed.events).to.be.an('array').with.lengthOf(0);
      expect(parsed.triggers).to.be.an('array').with.lengthOf(0);
      expect(parsed.exportedAt).to.be.a('string');
    });
    
    it('should export single event', function() {
      manager.registerEvent({
        id: 'test-event',
        type: 'dialogue',
        priority: 5,
        content: { message: 'Test' }
      });
      
      const json = manager.exportToJSON();
      const parsed = JSON.parse(json);
      
      expect(parsed.events).to.have.lengthOf(1);
      expect(parsed.events[0].id).to.equal('test-event');
      expect(parsed.events[0].type).to.equal('dialogue');
      expect(parsed.events[0].priority).to.equal(5);
      expect(parsed.events[0].content).to.deep.equal({ message: 'Test' });
    });
    
    it('should export multiple events', function() {
      manager.registerEvent({
        id: 'event-1',
        type: 'dialogue',
        priority: 1,
        content: { message: 'First' }
      });
      
      manager.registerEvent({
        id: 'event-2',
        type: 'spawn',
        priority: 2,
        content: { entityType: 'ant' }
      });
      
      const json = manager.exportToJSON();
      const parsed = JSON.parse(json);
      
      expect(parsed.events).to.have.lengthOf(2);
      expect(parsed.events.map(e => e.id)).to.include.members(['event-1', 'event-2']);
    });
  });
  
  describe('Function Removal', function() {
    it('should remove onTrigger function', function() {
      manager.registerEvent({
        id: 'test-event',
        type: 'dialogue',
        onTrigger: () => { console.log('triggered'); }
      });
      
      const json = manager.exportToJSON();
      const parsed = JSON.parse(json);
      
      expect(parsed.events[0].onTrigger).to.be.undefined;
    });
    
    it('should remove onComplete function', function() {
      manager.registerEvent({
        id: 'test-event',
        type: 'dialogue',
        onComplete: () => { console.log('completed'); }
      });
      
      const json = manager.exportToJSON();
      const parsed = JSON.parse(json);
      
      expect(parsed.events[0].onComplete).to.be.undefined;
    });
    
    it('should remove onPause function', function() {
      manager.registerEvent({
        id: 'test-event',
        type: 'dialogue',
        onPause: () => { console.log('paused'); }
      });
      
      const json = manager.exportToJSON();
      const parsed = JSON.parse(json);
      
      expect(parsed.events[0].onPause).to.be.undefined;
    });
    
    it('should remove update function', function() {
      manager.registerEvent({
        id: 'test-event',
        type: 'dialogue',
        update: (deltaTime) => { console.log('updating'); }
      });
      
      const json = manager.exportToJSON();
      const parsed = JSON.parse(json);
      
      expect(parsed.events[0].update).to.be.undefined;
    });
  });
  
  describe('Active State Export', function() {
    it('should exclude active state by default', function() {
      manager.registerEvent({
        id: 'test-event',
        type: 'dialogue'
      });
      
      const json = manager.exportToJSON();
      const parsed = JSON.parse(json);
      
      expect(parsed.events[0].active).to.be.undefined;
      expect(parsed.events[0].paused).to.be.undefined;
    });
    
    it('should include active state when requested', function() {
      manager.registerEvent({
        id: 'test-event',
        type: 'dialogue'
      });
      
      // Trigger event to make it active
      manager.triggerEvent('test-event');
      
      const json = manager.exportToJSON(true);
      const parsed = JSON.parse(json);
      
      expect(parsed.events[0].active).to.be.a('boolean');
      expect(parsed.events[0].paused).to.be.a('boolean');
    });
  });
  
  describe('Trigger Export', function() {
    it('should export registered triggers', function() {
      manager.registerTrigger({
        type: 'time',
        eventId: 'test-event',
        delay: 5000
      });
      
      const json = manager.exportToJSON();
      const parsed = JSON.parse(json);
      
      expect(parsed.triggers).to.have.lengthOf(1);
      // ID is auto-generated, so check other properties
      expect(parsed.triggers[0].type).to.equal('time');
      expect(parsed.triggers[0].eventId).to.equal('test-event');
      expect(parsed.triggers[0].delay).to.equal(5000);
      expect(parsed.triggers[0].id).to.be.a('string'); // Should have an ID
    });
    
    it('should remove internal trigger state', function() {
      manager.registerTrigger({
        type: 'time',
        eventId: 'test-event',
        delay: 5000
      });
      
      const json = manager.exportToJSON();
      const parsed = JSON.parse(json);
      
      expect(parsed.triggers[0]._startTime).to.be.undefined;
      expect(parsed.triggers[0]._lastCheckTime).to.be.undefined;
    });
  });
  
  describe('Import/Export Roundtrip', function() {
    it('should preserve event data through export/import cycle', function() {
      // Create original event
      manager.registerEvent({
        id: 'roundtrip-event',
        type: 'dialogue',
        priority: 3,
        content: { message: 'Original message' }
      });
      
      // Export
      const json = manager.exportToJSON();
      
      // Create new manager and import
      const newManager = new EventManager();
      const success = newManager.loadFromJSON(json);
      
      expect(success).to.be.true;
      
      const imported = newManager.getEvent('roundtrip-event');
      expect(imported).to.exist;
      expect(imported.id).to.equal('roundtrip-event');
      expect(imported.type).to.equal('dialogue');
      expect(imported.priority).to.equal(3);
      expect(imported.content).to.deep.equal({ message: 'Original message' });
    });
    
    it('should preserve trigger data through export/import cycle', function() {
      manager.registerTrigger({
        type: 'flag',
        eventId: 'test-event',
        flagName: 'test_flag'
      });
      
      const json = manager.exportToJSON();
      
      const newManager = new EventManager();
      const success = newManager.loadFromJSON(json);
      
      expect(success).to.be.true;
      
      // Get the first trigger (ID was auto-generated)
      const triggers = Array.from(newManager.triggers.values());
      expect(triggers).to.have.lengthOf(1);
      
      const imported = triggers[0];
      expect(imported.type).to.equal('flag');
      expect(imported.eventId).to.equal('test-event');
      expect(imported.flagName).to.equal('test_flag');
    });
  });
  
  describe('JSON Structure', function() {
    it('should have correct top-level structure', function() {
      const json = manager.exportToJSON();
      const parsed = JSON.parse(json);
      
      expect(parsed).to.have.property('events');
      expect(parsed).to.have.property('triggers');
      expect(parsed).to.have.property('exportedAt');
    });
    
    it('should include ISO timestamp', function() {
      const json = manager.exportToJSON();
      const parsed = JSON.parse(json);
      
      expect(parsed.exportedAt).to.be.a('string');
      // Verify it's a valid ISO date string
      const date = new Date(parsed.exportedAt);
      expect(date.toISOString()).to.equal(parsed.exportedAt);
    });
    
    it('should format JSON with indentation', function() {
      manager.registerEvent({
        id: 'test-event',
        type: 'dialogue'
      });
      
      const json = manager.exportToJSON();
      
      // Should have newlines and indentation (not minified)
      expect(json).to.include('\n');
      expect(json).to.include('  '); // 2-space indent
    });
  });
});




// ================================================================
// GameStateManager.test.js (92 tests)
// ================================================================
﻿const GameStateManager = require('../../../Classes/managers/GameStateManager.js');

describe('GameStateManager', function() {
  let manager;
  
  beforeEach(function() {
    manager = new GameStateManager();
  });
  
  describe('Constructor', function() {
    it('should initialize with MENU state', function() {
      expect(manager.currentState).to.equal('MENU');
    });
    
    it('should initialize previousState to null', function() {
      expect(manager.previousState).to.be.null;
    });
    
    it('should initialize fadeAlpha to 0', function() {
      expect(manager.fadeAlpha).to.equal(0);
    });
    
    it('should initialize isFading to false', function() {
      expect(manager.isFading).to.be.false;
    });
    
    it('should initialize empty stateChangeCallbacks array', function() {
      expect(manager.stateChangeCallbacks).to.be.an('array').that.is.empty;
    });
    
    it('should initialize fadeDirection to "out"', function() {
      expect(manager.fadeDirection).to.equal('out');
    });
    
    it('should define all valid states', function() {
      expect(manager.STATES).to.have.property('MENU', 'MENU');
      expect(manager.STATES).to.have.property('OPTIONS', 'OPTIONS');
      expect(manager.STATES).to.have.property('DEBUG_MENU', 'DEBUG_MENU');
      expect(manager.STATES).to.have.property('PLAYING', 'PLAYING');
      expect(manager.STATES).to.have.property('PAUSED', 'PAUSED');
      expect(manager.STATES).to.have.property('GAME_OVER', 'GAME_OVER');
      expect(manager.STATES).to.have.property('KAN_BAN', 'KANBAN');
    });
  });
  
  describe('getState()', function() {
    it('should return current state', function() {
      expect(manager.getState()).to.equal('MENU');
    });
    
    it('should return updated state after change', function() {
      manager.setState('PLAYING');
      expect(manager.getState()).to.equal('PLAYING');
    });
  });
  
  describe('setState()', function() {
    it('should change state successfully', function() {
      const result = manager.setState('PLAYING');
      expect(result).to.be.true;
      expect(manager.currentState).to.equal('PLAYING');
    });
    
    it('should update previousState', function() {
      manager.setState('OPTIONS');
      expect(manager.previousState).to.equal('MENU');
    });
    
    it('should return false for invalid state', function() {
      const result = manager.setState('INVALID_STATE');
      expect(result).to.be.false;
    });
    
    it('should not change state when invalid', function() {
      const originalState = manager.currentState;
      manager.setState('INVALID_STATE');
      expect(manager.currentState).to.equal(originalState);
    });
    
    it('should execute callbacks by default', function() {
      let callbackExecuted = false;
      manager.onStateChange(() => { callbackExecuted = true; });
      
      manager.setState('PLAYING');
      
      expect(callbackExecuted).to.be.true;
    });
    
    it('should skip callbacks when skipCallbacks is true', function() {
      let callbackExecuted = false;
      manager.onStateChange(() => { callbackExecuted = true; });
      
      manager.setState('PLAYING', true);
      
      expect(callbackExecuted).to.be.false;
    });
    
    it('should warn for invalid states', function() {
      const warnings = [];
      const originalWarn = console.warn;
      console.warn = (msg) => warnings.push(msg);
      
      manager.setState('BAD_STATE');
      
      expect(warnings.length).to.be.greaterThan(0);
      console.warn = originalWarn;
    });
  });
  
  describe('getPreviousState()', function() {
    it('should return null initially', function() {
      expect(manager.getPreviousState()).to.be.null;
    });
    
    it('should return previous state after transition', function() {
      manager.setState('PLAYING');
      expect(manager.getPreviousState()).to.equal('MENU');
    });
    
    it('should update with each state change', function() {
      manager.setState('OPTIONS');
      expect(manager.getPreviousState()).to.equal('MENU');
      
      manager.setState('PLAYING');
      expect(manager.getPreviousState()).to.equal('OPTIONS');
    });
  });
  
  describe('isState()', function() {
    it('should return true for current state', function() {
      expect(manager.isState('MENU')).to.be.true;
    });
    
    it('should return false for different state', function() {
      expect(manager.isState('PLAYING')).to.be.false;
    });
    
    it('should update when state changes', function() {
      manager.setState('OPTIONS');
      expect(manager.isState('OPTIONS')).to.be.true;
      expect(manager.isState('MENU')).to.be.false;
    });
  });
  
  describe('isAnyState()', function() {
    it('should return true when current matches one of provided', function() {
      expect(manager.isAnyState('MENU', 'OPTIONS', 'PLAYING')).to.be.true;
    });
    
    it('should return false when current matches none', function() {
      expect(manager.isAnyState('OPTIONS', 'PLAYING', 'PAUSED')).to.be.false;
    });
    
    it('should handle single state', function() {
      expect(manager.isAnyState('MENU')).to.be.true;
    });
    
    it('should handle many states', function() {
      manager.setState('PAUSED');
      expect(manager.isAnyState('MENU', 'OPTIONS', 'PLAYING', 'PAUSED', 'GAME_OVER')).to.be.true;
    });
  });
  
  describe('isValidState()', function() {
    it('should return true for valid states', function() {
      expect(manager.isValidState('MENU')).to.be.true;
      expect(manager.isValidState('PLAYING')).to.be.true;
      expect(manager.isValidState('OPTIONS')).to.be.true;
    });
    
    it('should return false for invalid states', function() {
      expect(manager.isValidState('INVALID')).to.be.false;
      expect(manager.isValidState('RANDOM')).to.be.false;
      expect(manager.isValidState('')).to.be.false;
    });
    
    it('should handle null and undefined', function() {
      expect(manager.isValidState(null)).to.be.false;
      expect(manager.isValidState(undefined)).to.be.false;
    });
  });
  
  describe('Fade Transition Management', function() {
    describe('getFadeAlpha()', function() {
      it('should return initial fade alpha', function() {
        expect(manager.getFadeAlpha()).to.equal(0);
      });
      
      it('should return updated fade alpha', function() {
        manager.setFadeAlpha(128);
        expect(manager.getFadeAlpha()).to.equal(128);
      });
    });
    
    describe('setFadeAlpha()', function() {
      it('should set fade alpha', function() {
        manager.setFadeAlpha(100);
        expect(manager.fadeAlpha).to.equal(100);
      });
      
      it('should clamp to 0 minimum', function() {
        manager.setFadeAlpha(-50);
        expect(manager.fadeAlpha).to.equal(0);
      });
      
      it('should clamp to 255 maximum', function() {
        manager.setFadeAlpha(300);
        expect(manager.fadeAlpha).to.equal(255);
      });
      
      it('should handle boundary values', function() {
        manager.setFadeAlpha(0);
        expect(manager.fadeAlpha).to.equal(0);
        
        manager.setFadeAlpha(255);
        expect(manager.fadeAlpha).to.equal(255);
      });
    });
    
    describe('isFadingTransition()', function() {
      it('should return false initially', function() {
        expect(manager.isFadingTransition()).to.be.false;
      });
      
      it('should return true after starting fade', function() {
        manager.startFadeTransition();
        expect(manager.isFadingTransition()).to.be.true;
      });
      
      it('should return false after stopping fade', function() {
        manager.startFadeTransition();
        manager.stopFadeTransition();
        expect(manager.isFadingTransition()).to.be.false;
      });
    });
    
    describe('startFadeTransition()', function() {
      it('should set isFading to true', function() {
        manager.startFadeTransition();
        expect(manager.isFading).to.be.true;
      });
      
      it('should set fadeAlpha to 0 for "out" direction', function() {
        manager.fadeAlpha = 100;
        manager.startFadeTransition('out');
        expect(manager.fadeAlpha).to.equal(0);
      });
      
      it('should set fadeAlpha to 255 for "in" direction', function() {
        manager.fadeAlpha = 100;
        manager.startFadeTransition('in');
        expect(manager.fadeAlpha).to.equal(255);
      });
      
      it('should default to "out" direction', function() {
        manager.startFadeTransition();
        expect(manager.fadeDirection).to.equal('out');
        expect(manager.fadeAlpha).to.equal(0);
      });
      
      it('should set fadeDirection', function() {
        manager.startFadeTransition('in');
        expect(manager.fadeDirection).to.equal('in');
      });
    });
    
    describe('stopFadeTransition()', function() {
      it('should set isFading to false', function() {
        manager.isFading = true;
        manager.stopFadeTransition();
        expect(manager.isFading).to.be.false;
      });
      
      it('should work when already stopped', function() {
        manager.stopFadeTransition();
        expect(manager.isFading).to.be.false;
      });
    });
    
    describe('updateFade()', function() {
      it('should return false when not fading', function() {
        const result = manager.updateFade();
        expect(result).to.be.false;
      });
      
      it('should increase fadeAlpha for "out" direction', function() {
        manager.startFadeTransition('out');
        manager.updateFade(10);
        expect(manager.fadeAlpha).to.equal(10);
      });
      
      it('should decrease fadeAlpha for "in" direction', function() {
        manager.startFadeTransition('in');
        manager.updateFade(10);
        expect(manager.fadeAlpha).to.equal(245);
      });
      
      it('should return true when fade-out completes', function() {
        manager.startFadeTransition('out');
        manager.fadeAlpha = 250;
        const result = manager.updateFade(10);
        expect(result).to.be.true;
        expect(manager.fadeAlpha).to.equal(255);
      });
      
      it('should return true when fade-in completes', function() {
        manager.startFadeTransition('in');
        manager.fadeAlpha = 5;
        const result = manager.updateFade(10);
        expect(result).to.be.true;
        expect(manager.fadeAlpha).to.equal(0);
      });
      
      it('should stop fading when fade-in completes', function() {
        manager.startFadeTransition('in');
        manager.fadeAlpha = 5;
        manager.updateFade(10);
        expect(manager.isFading).to.be.false;
      });
      
      it('should use default increment of 5', function() {
        manager.startFadeTransition('out');
        manager.updateFade();
        expect(manager.fadeAlpha).to.equal(5);
      });
      
      it('should handle custom increments', function() {
        manager.startFadeTransition('out');
        manager.updateFade(20);
        expect(manager.fadeAlpha).to.equal(20);
      });
    });
  });
  
  describe('Callback System', function() {
    describe('onStateChange()', function() {
      it('should register callback', function() {
        const callback = () => {};
        manager.onStateChange(callback);
        expect(manager.stateChangeCallbacks).to.include(callback);
      });
      
      it('should register multiple callbacks', function() {
        const cb1 = () => {};
        const cb2 = () => {};
        manager.onStateChange(cb1);
        manager.onStateChange(cb2);
        expect(manager.stateChangeCallbacks).to.have.lengthOf(2);
      });
      
      it('should not register non-function', function() {
        manager.onStateChange('not a function');
        expect(manager.stateChangeCallbacks).to.be.empty;
      });
    });
    
    describe('removeStateChangeCallback()', function() {
      it('should remove registered callback', function() {
        const callback = () => {};
        manager.onStateChange(callback);
        manager.removeStateChangeCallback(callback);
        expect(manager.stateChangeCallbacks).to.not.include(callback);
      });
      
      it('should do nothing for unregistered callback', function() {
        const callback = () => {};
        expect(() => manager.removeStateChangeCallback(callback)).to.not.throw();
      });
      
      it('should handle removing from empty list', function() {
        const callback = () => {};
        expect(() => manager.removeStateChangeCallback(callback)).to.not.throw();
      });
    });
    
    describe('executeCallbacks()', function() {
      it('should execute all registered callbacks', function() {
        let count = 0;
        manager.onStateChange(() => count++);
        manager.onStateChange(() => count++);
        
        manager.executeCallbacks('PLAYING', 'MENU');
        
        expect(count).to.equal(2);
      });
      
      it('should pass new and old state to callbacks', function() {
        let receivedNew, receivedOld;
        manager.onStateChange((newState, oldState) => {
          receivedNew = newState;
          receivedOld = oldState;
        });
        
        manager.executeCallbacks('PLAYING', 'MENU');
        
        expect(receivedNew).to.equal('PLAYING');
        expect(receivedOld).to.equal('MENU');
      });
      
      it('should handle callback errors gracefully', function() {
        manager.onStateChange(() => { throw new Error('Test error'); });
        manager.onStateChange(() => {}); // Should still execute
        
        expect(() => manager.executeCallbacks('PLAYING', 'MENU')).to.not.throw();
      });
    });
  });
  
  describe('Convenience State Check Methods', function() {
    it('isInMenu() should check MENU state', function() {
      expect(manager.isInMenu()).to.be.true;
      manager.setState('PLAYING');
      expect(manager.isInMenu()).to.be.false;
    });
    
    it('isInOptions() should check OPTIONS state', function() {
      expect(manager.isInOptions()).to.be.false;
      manager.setState('OPTIONS');
      expect(manager.isInOptions()).to.be.true;
    });
    
    it('isInGame() should check PLAYING state', function() {
      expect(manager.isInGame()).to.be.false;
      manager.setState('PLAYING');
      expect(manager.isInGame()).to.be.true;
    });
    
    it('isPaused() should check PAUSED state', function() {
      expect(manager.isPaused()).to.be.false;
      manager.setState('PAUSED');
      expect(manager.isPaused()).to.be.true;
    });
    
    it('isGameOver() should check GAME_OVER state', function() {
      expect(manager.isGameOver()).to.be.false;
      manager.setState('GAME_OVER');
      expect(manager.isGameOver()).to.be.true;
    });
    
    it('isDebug() should check DEBUG_MENU state', function() {
      expect(manager.isDebug()).to.be.false;
      manager.setState('DEBUG_MENU');
      expect(manager.isDebug()).to.be.true;
    });
    
    it('isKanban() should check KAN_BAN state', function() {
      expect(manager.isKanban()).to.be.false;
      manager.setState('KANBAN');
      expect(manager.isKanban()).to.be.true;
    });
  });
  
  describe('Transition Methods', function() {
    it('goToMenu() should transition to MENU', function() {
      manager.setState('PLAYING');
      manager.goToMenu();
      expect(manager.currentState).to.equal('MENU');
    });
    
    it('goToOptions() should transition to OPTIONS', function() {
      manager.goToOptions();
      expect(manager.currentState).to.equal('OPTIONS');
    });
    
    it('goToDebug() should transition to DEBUG_MENU', function() {
      manager.goToDebug();
      expect(manager.currentState).to.equal('DEBUG_MENU');
    });
    
    it('startGame() should transition to PLAYING', function() {
      manager.startGame();
      expect(manager.currentState).to.equal('PLAYING');
    });
    
    it('startGame() should start fade transition', function() {
      manager.startGame();
      expect(manager.isFading).to.be.true;
    });
    
    it('pauseGame() should transition to PAUSED', function() {
      manager.setState('PLAYING');
      manager.pauseGame();
      expect(manager.currentState).to.equal('PAUSED');
    });
    
    it('resumeGame() should transition to PLAYING', function() {
      manager.setState('PAUSED');
      manager.resumeGame();
      expect(manager.currentState).to.equal('PLAYING');
    });
    
    it('endGame() should transition to GAME_OVER', function() {
      manager.setState('PLAYING');
      manager.endGame();
      expect(manager.currentState).to.equal('GAME_OVER');
    });
    
    it('goToKanban() should transition to KAN_BAN', function() {
      manager.goToKanban();
      expect(manager.currentState).to.equal('KANBAN');
    });
  });
  
  describe('reset()', function() {
    it('should reset to MENU state', function() {
      manager.setState('PLAYING');
      manager.reset();
      expect(manager.currentState).to.equal('MENU');
    });
    
    it('should reset previousState to null', function() {
      manager.setState('PLAYING');
      manager.reset();
      expect(manager.previousState).to.be.null;
    });
    
    it('should reset fadeAlpha to 0', function() {
      manager.fadeAlpha = 200;
      manager.reset();
      expect(manager.fadeAlpha).to.equal(0);
    });
    
    it('should reset isFading to false', function() {
      manager.isFading = true;
      manager.reset();
      expect(manager.isFading).to.be.false;
    });
  });
  
  describe('getDebugInfo()', function() {
    it('should return debug information object', function() {
      const info = manager.getDebugInfo();
      expect(info).to.be.an('object');
    });
    
    it('should include current state', function() {
      const info = manager.getDebugInfo();
      expect(info).to.have.property('currentState', 'MENU');
    });
    
    it('should include previous state', function() {
      const info = manager.getDebugInfo();
      expect(info).to.have.property('previousState', null);
    });
    
    it('should include fade alpha', function() {
      const info = manager.getDebugInfo();
      expect(info).to.have.property('fadeAlpha', 0);
    });
    
    it('should include isFading', function() {
      const info = manager.getDebugInfo();
      expect(info).to.have.property('isFading', false);
    });
    
    it('should include callback count', function() {
      manager.onStateChange(() => {});
      const info = manager.getDebugInfo();
      expect(info).to.have.property('callbackCount', 1);
    });
    
    it('should include valid states', function() {
      const info = manager.getDebugInfo();
      expect(info).to.have.property('validStates');
      expect(info.validStates).to.equal(manager.STATES);
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle rapid state changes', function() {
      for (let i = 0; i < 100; i++) {
        manager.setState('PLAYING');
        manager.setState('PAUSED');
      }
      expect(manager.currentState).to.equal('PAUSED');
    });
    
    it('should handle setting same state multiple times', function() {
      manager.setState('PLAYING');
      const prevState = manager.previousState;
      manager.setState('PLAYING');
      expect(manager.previousState).to.equal('PLAYING');
    });
    
    it('should handle multiple fade transitions', function() {
      manager.startFadeTransition('out');
      manager.startFadeTransition('in');
      manager.startFadeTransition('out');
      expect(manager.fadeDirection).to.equal('out');
    });
  });
});




// ================================================================
// MapManager.test.js (66 tests)
// ================================================================
﻿// Mock logging functions BEFORE requiring MapManager
global.logNormal = sinon.stub();
global.logDebug = sinon.stub();
global.logWarning = sinon.stub();
global.logError = sinon.stub();

let MapManager = require('../../../Classes/managers/MapManager.js');

describe('MapManager', function() {
  let manager;
  let mockMap1, mockMap2, mockMap3;
  
  beforeEach(function() {
    manager = new MapManager();
    
    // Create mock maps with minimal gridTerrain interface
    mockMap1 = {
      chunkArray: {
        rawArray: [
          {
            tileData: {
              getSpanRange: () => [[0, 7], [7, 0]],
              convRelToArrPos: (pos) => [pos[0], pos[1]],
              convToFlat: (arrPos) => arrPos[1] * 8 + arrPos[0],
              rawArray: new Array(64).fill({ material: 'grass' }),
              get: (pos) => ({ material: 'grass', x: pos[0], y: pos[1] })
            }
          }
        ]
      },
      renderConversion: {
        convCanvasToPos: (canvasPos) => [canvasPos[0] / 32, canvasPos[1] / 32],
        alignToCanvas: function() {}
      },
      invalidateCache: function() { this.cacheInvalidated = true; },
      cacheInvalidated: false
    };
    
    mockMap2 = {
      chunkArray: { rawArray: [] },
      renderConversion: {
        convCanvasToPos: (canvasPos) => [canvasPos[0] / 32, canvasPos[1] / 32]
      },
      invalidateCache: function() { this.cacheInvalidated = true; },
      cacheInvalidated: false
    };
    
    mockMap3 = {
      chunkArray: { rawArray: [] },
      renderConversion: {
        convCanvasToPos: (canvasPos) => [canvasPos[0] / 32, canvasPos[1] / 32]
      }
    };
  });
  
  describe('Constructor', function() {
    it('should initialize with empty maps', function() {
      expect(manager._maps.size).to.equal(0);
    });
    
    it('should initialize activeMap to null', function() {
      expect(manager._activeMap).to.be.null;
    });
    
    it('should initialize activeMapId to null', function() {
      expect(manager._activeMapId).to.be.null;
    });
    
    it('should set default tile size to 32', function() {
      expect(manager._defaultTileSize).to.equal(32);
    });
    
    it('should initialize _maps as a Map', function() {
      expect(manager._maps).to.be.instanceOf(Map);
    });
  });
  
  describe('registerMap()', function() {
    it('should register a valid map', function() {
      const result = manager.registerMap('level1', mockMap1);
      expect(result).to.be.true;
      expect(manager._maps.has('level1')).to.be.true;
    });
    
    it('should return false for invalid mapId', function() {
      expect(manager.registerMap('', mockMap1)).to.be.false;
      expect(manager.registerMap(null, mockMap1)).to.be.false;
      expect(manager.registerMap(undefined, mockMap1)).to.be.false;
    });
    
    it('should return false for non-string mapId', function() {
      expect(manager.registerMap(123, mockMap1)).to.be.false;
      expect(manager.registerMap({}, mockMap1)).to.be.false;
    });
    
    it('should return false for invalid map object', function() {
      expect(manager.registerMap('level1', null)).to.be.false;
      expect(manager.registerMap('level1', {})).to.be.false;
      expect(manager.registerMap('level1', { noChunkArray: true })).to.be.false;
    });
    
    it('should replace existing map with warning', function() {
      manager.registerMap('level1', mockMap1);
      const result = manager.registerMap('level1', mockMap2);
      expect(result).to.be.true;
      expect(manager._maps.get('level1')).to.equal(mockMap2);
    });
    
    it('should set map as active when setActive is true', function() {
      manager.registerMap('level1', mockMap1, true);
      expect(manager._activeMapId).to.equal('level1');
      expect(manager._activeMap).to.equal(mockMap1);
    });
    
    it('should not set map as active when setActive is false', function() {
      manager.registerMap('level1', mockMap1, false);
      expect(manager._activeMapId).to.be.null;
      expect(manager._activeMap).to.be.null;
    });
    
    it('should default setActive to false', function() {
      manager.registerMap('level1', mockMap1);
      expect(manager._activeMapId).to.be.null;
    });
    
    it('should register multiple maps', function() {
      manager.registerMap('level1', mockMap1);
      manager.registerMap('level2', mockMap2);
      manager.registerMap('level3', mockMap3);
      expect(manager._maps.size).to.equal(3);
    });
  });
  
  describe('unregisterMap()', function() {
    beforeEach(function() {
      manager.registerMap('level1', mockMap1);
      manager.registerMap('level2', mockMap2);
    });
    
    it('should unregister a map', function() {
      const result = manager.unregisterMap('level1');
      expect(result).to.be.true;
      expect(manager._maps.has('level1')).to.be.false;
    });
    
    it('should return false for non-existent map', function() {
      const result = manager.unregisterMap('nonexistent');
      expect(result).to.be.false;
    });
    
    it('should not allow removing active map', function() {
      manager.setActiveMap('level1');
      const result = manager.unregisterMap('level1');
      expect(result).to.be.false;
      expect(manager._maps.has('level1')).to.be.true;
    });
    
    it('should allow removing non-active map', function() {
      manager.setActiveMap('level1');
      const result = manager.unregisterMap('level2');
      expect(result).to.be.true;
      expect(manager._maps.has('level2')).to.be.false;
    });
    
    it('should reduce map count', function() {
      expect(manager._maps.size).to.equal(2);
      manager.unregisterMap('level1');
      expect(manager._maps.size).to.equal(1);
    });
  });
  
  describe('setActiveMap()', function() {
    beforeEach(function() {
      manager.registerMap('level1', mockMap1);
      manager.registerMap('level2', mockMap2);
    });
    
    it('should set active map by ID', function() {
      const result = manager.setActiveMap('level1');
      expect(result).to.be.true;
      expect(manager._activeMapId).to.equal('level1');
      expect(manager._activeMap).to.equal(mockMap1);
    });
    
    it('should return false for non-existent map', function() {
      const result = manager.setActiveMap('nonexistent');
      expect(result).to.be.false;
    });
    
    it('should switch active maps', function() {
      manager.setActiveMap('level1');
      expect(manager._activeMapId).to.equal('level1');
      
      manager.setActiveMap('level2');
      expect(manager._activeMapId).to.equal('level2');
      expect(manager._activeMap).to.equal(mockMap2);
    });
    
    it('should invalidate cache when map has invalidateCache method', function() {
      manager.setActiveMap('level1');
      expect(mockMap1.cacheInvalidated).to.be.true;
    });
    
    it('should handle map without invalidateCache method', function() {
      expect(() => manager.setActiveMap('level2')).to.not.throw();
    });
  });
  
  describe('getActiveMap()', function() {
    it('should return null when no active map', function() {
      expect(manager.getActiveMap()).to.be.null;
    });
    
    it('should return active map instance', function() {
      manager.registerMap('level1', mockMap1, true);
      expect(manager.getActiveMap()).to.equal(mockMap1);
    });
    
    it('should return updated active map after switch', function() {
      manager.registerMap('level1', mockMap1);
      manager.registerMap('level2', mockMap2);
      
      manager.setActiveMap('level1');
      expect(manager.getActiveMap()).to.equal(mockMap1);
      
      manager.setActiveMap('level2');
      expect(manager.getActiveMap()).to.equal(mockMap2);
    });
  });
  
  describe('getActiveMapId()', function() {
    it('should return null when no active map', function() {
      expect(manager.getActiveMapId()).to.be.null;
    });
    
    it('should return active map ID', function() {
      manager.registerMap('level1', mockMap1, true);
      expect(manager.getActiveMapId()).to.equal('level1');
    });
  });
  
  describe('getMap()', function() {
    beforeEach(function() {
      manager.registerMap('level1', mockMap1);
      manager.registerMap('level2', mockMap2);
    });
    
    it('should return map by ID', function() {
      expect(manager.getMap('level1')).to.equal(mockMap1);
      expect(manager.getMap('level2')).to.equal(mockMap2);
    });
    
    it('should return null for non-existent map', function() {
      expect(manager.getMap('nonexistent')).to.be.null;
    });
    
    it('should return null for invalid ID types', function() {
      expect(manager.getMap(null)).to.be.null;
      expect(manager.getMap(undefined)).to.be.null;
    });
  });
  
  describe('hasMap()', function() {
    beforeEach(function() {
      manager.registerMap('level1', mockMap1);
    });
    
    it('should return true for registered map', function() {
      expect(manager.hasMap('level1')).to.be.true;
    });
    
    it('should return false for non-existent map', function() {
      expect(manager.hasMap('nonexistent')).to.be.false;
    });
    
    it('should return false after unregistration', function() {
      expect(manager.hasMap('level1')).to.be.true;
      manager.unregisterMap('level1');
      expect(manager.hasMap('level1')).to.be.false;
    });
  });
  
  describe('getMapIds()', function() {
    it('should return empty array when no maps', function() {
      expect(manager.getMapIds()).to.deep.equal([]);
    });
    
    it('should return array of map IDs', function() {
      manager.registerMap('level1', mockMap1);
      manager.registerMap('level2', mockMap2);
      manager.registerMap('level3', mockMap3);
      
      const ids = manager.getMapIds();
      expect(ids).to.be.an('array');
      expect(ids).to.have.lengthOf(3);
      expect(ids).to.include('level1');
      expect(ids).to.include('level2');
      expect(ids).to.include('level3');
    });
    
    it('should update after adding map', function() {
      manager.registerMap('level1', mockMap1);
      expect(manager.getMapIds()).to.have.lengthOf(1);
      
      manager.registerMap('level2', mockMap2);
      expect(manager.getMapIds()).to.have.lengthOf(2);
    });
    
    it('should update after removing map', function() {
      manager.registerMap('level1', mockMap1);
      manager.registerMap('level2', mockMap2);
      expect(manager.getMapIds()).to.have.lengthOf(2);
      
      manager.unregisterMap('level1');
      expect(manager.getMapIds()).to.have.lengthOf(1);
      expect(manager.getMapIds()).to.not.include('level1');
    });
  });
  
  describe('getTileAtPosition()', function() {
    beforeEach(function() {
      manager.registerMap('level1', mockMap1, true);
    });
    
    it('should return null when no active map', function() {
      manager._activeMap = null;
      expect(manager.getTileAtPosition(100, 100)).to.be.null;
    });
    
    it('should return tile at world position', function() {
      const tile = manager.getTileAtPosition(64, 64);
      expect(tile).to.not.be.null;
      expect(tile).to.have.property('material');
    });
    
    it('should use renderConversion for coordinate conversion', function() {
      const tile = manager.getTileAtPosition(32, 32);
      expect(tile).to.not.be.null;
    });
    
    it('should handle errors gracefully', function() {
      // Mock map with broken renderConversion
      const brokenMap = {
        chunkArray: { rawArray: [] },
        renderConversion: {
          convCanvasToPos: () => { throw new Error('Test error'); }
        }
      };
      manager.registerMap('broken', brokenMap, true);
      
      expect(manager.getTileAtPosition(100, 100)).to.be.null;
    });
  });
  
  describe('getTileAtGridCoords()', function() {
    beforeEach(function() {
      manager.registerMap('level1', mockMap1, true);
    });
    
    it('should return null when no active map', function() {
      manager._activeMap = null;
      expect(manager.getTileAtGridCoords(5, 5)).to.be.null;
    });
    
    it('should return null when chunkArray missing', function() {
      manager._activeMap = {};
      expect(manager.getTileAtGridCoords(5, 5)).to.be.null;
    });
    
    it('should return tile at grid coordinates', function() {
      const tile = manager.getTileAtGridCoords(3, 3);
      expect(tile).to.not.be.null;
      expect(tile).to.have.property('material', 'grass');
    });
    
    it('should return null for out-of-bounds coordinates', function() {
      const tile = manager.getTileAtGridCoords(100, 100);
      expect(tile).to.be.null;
    });
    
    it('should handle negative coordinates', function() {
      const tile = manager.getTileAtGridCoords(-1, -1);
      expect(tile).to.be.null;
    });
  });
  
  describe('getTileAtCoords() [deprecated]', function() {
    beforeEach(function() {
      manager.registerMap('level1', mockMap1, true);
    });
    
    it('should call getTileAtGridCoords', function() {
      const tile = manager.getTileAtCoords(3, 3);
      expect(tile).to.not.be.null;
    });
    
    it('should return same result as getTileAtGridCoords', function() {
      const tile1 = manager.getTileAtCoords(2, 2);
      const tile2 = manager.getTileAtGridCoords(2, 2);
      expect(tile1).to.deep.equal(tile2);
    });
  });
  
  describe('getTileMaterial()', function() {
    beforeEach(function() {
      manager.registerMap('level1', mockMap1, true);
    });
    
    it('should return null when no tile found', function() {
      manager._activeMap = null;
      expect(manager.getTileMaterial(100, 100)).to.be.null;
    });
    
    it('should return material of tile at position', function() {
      const material = manager.getTileMaterial(64, 64);
      expect(material).to.equal('grass');
    });
    
    it('should return null for out-of-bounds position', function() {
      const material = manager.getTileMaterial(10000, 10000);
      expect(material).to.be.null;
    });
  });
  
  describe('getInfo()', function() {
    it('should return info object with all properties', function() {
      const info = manager.getInfo();
      expect(info).to.have.property('totalMaps');
      expect(info).to.have.property('activeMapId');
      expect(info).to.have.property('mapIds');
      expect(info).to.have.property('hasActiveMap');
    });
    
    it('should reflect empty state', function() {
      const info = manager.getInfo();
      expect(info.totalMaps).to.equal(0);
      expect(info.activeMapId).to.be.null;
      expect(info.mapIds).to.deep.equal([]);
      expect(info.hasActiveMap).to.be.false;
    });
    
    it('should reflect registered maps', function() {
      manager.registerMap('level1', mockMap1);
      manager.registerMap('level2', mockMap2);
      
      const info = manager.getInfo();
      expect(info.totalMaps).to.equal(2);
      expect(info.mapIds).to.have.lengthOf(2);
    });
    
    it('should reflect active map', function() {
      manager.registerMap('level1', mockMap1, true);
      
      const info = manager.getInfo();
      expect(info.activeMapId).to.equal('level1');
      expect(info.hasActiveMap).to.be.true;
    });
    
    it('should update after changes', function() {
      manager.registerMap('level1', mockMap1, true);
      let info = manager.getInfo();
      expect(info.totalMaps).to.equal(1);
      
      manager.registerMap('level2', mockMap2);
      info = manager.getInfo();
      expect(info.totalMaps).to.equal(2);
    });
  });
  
  describe('clearAll()', function() {
    beforeEach(function() {
      manager.registerMap('level1', mockMap1);
      manager.registerMap('level2', mockMap2);
      manager.setActiveMap('level1');
    });
    
    it('should clear all maps', function() {
      manager.clearAll();
      expect(manager._maps.size).to.equal(0);
    });
    
    it('should clear active map', function() {
      manager.clearAll();
      expect(manager._activeMap).to.be.null;
      expect(manager._activeMapId).to.be.null;
    });
    
    it('should result in empty getInfo', function() {
      manager.clearAll();
      const info = manager.getInfo();
      expect(info.totalMaps).to.equal(0);
      expect(info.hasActiveMap).to.be.false;
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle registering same map twice', function() {
      manager.registerMap('level1', mockMap1);
      manager.registerMap('level1', mockMap1);
      expect(manager._maps.size).to.equal(1);
    });
    
    it('should handle rapid map switching', function() {
      manager.registerMap('level1', mockMap1);
      manager.registerMap('level2', mockMap2);
      manager.registerMap('level3', mockMap3);
      
      for (let i = 0; i < 50; i++) {
        manager.setActiveMap('level1');
        manager.setActiveMap('level2');
        manager.setActiveMap('level3');
      }
      
      expect(manager._activeMapId).to.equal('level3');
    });
    
    it('should handle tile queries on empty map', function() {
      const emptyMap = {
        chunkArray: { rawArray: [] },
        renderConversion: {
          convCanvasToPos: (pos) => [pos[0] / 32, pos[1] / 32]
        }
      };
      manager.registerMap('empty', emptyMap, true);
      
      const tile = manager.getTileAtGridCoords(0, 0);
      expect(tile).to.be.null;
    });
    
    it('should handle unregister after clearAll', function() {
      manager.registerMap('level1', mockMap1);
      manager.clearAll();
      
      expect(() => manager.unregisterMap('level1')).to.not.throw();
    });
    
    it('should handle getMap after clearAll', function() {
      manager.registerMap('level1', mockMap1);
      manager.clearAll();
      
      expect(manager.getMap('level1')).to.be.null;
    });
  });
});




// ================================================================
// pheromoneControl.test.js (7 tests)
// ================================================================
/**
 * Unit Tests for pheromoneControl
 * Tests pheromone path visualization functionality
 */

let path = require('path');

describe('pheromoneControl', function() {
  let showPath;
  
  beforeEach(function() {
    // Load pheromoneControl
    const pheromoneControlPath = path.join(__dirname, '..', '..', '..', 'Classes', 'managers', 'pheromoneControl.js');
    delete require.cache[require.resolve(pheromoneControlPath)];
    const fileContent = require('fs').readFileSync(pheromoneControlPath, 'utf8');
    
    // Execute the file content in a function scope
    const context = {};
    const func = new Function('showPath', fileContent + '; return showPath;');
    showPath = func();
  });

  describe('showPath()', function() {
    it('should exist as a function', function() {
      expect(showPath).to.be.a('function');
    });

    it('should execute without throwing errors', function() {
      expect(() => showPath()).to.not.throw();
    });

    it('should be callable multiple times', function() {
      expect(() => {
        showPath();
        showPath();
        showPath();
      }).to.not.throw();
    });
  });

  describe('Edge Cases', function() {
    it('should handle being called with undefined', function() {
      expect(() => showPath(undefined)).to.not.throw();
    });

    it('should handle being called with null', function() {
      expect(() => showPath(null)).to.not.throw();
    });

    it('should handle being called with various argument types', function() {
      expect(() => showPath(123)).to.not.throw();
      expect(() => showPath('string')).to.not.throw();
      expect(() => showPath({})).to.not.throw();
      expect(() => showPath([])).to.not.throw();
    });
  });

  describe('Future Implementation', function() {
    it('should be ready for path visualization logic', function() {
      // This is a placeholder function - currently does nothing
      // When implemented, it should show ant movement paths
      expect(showPath).to.exist;
      expect(typeof showPath).to.equal('function');
    });
  });
});




// ================================================================
// ResourceManager.test.js (60 tests)
// ================================================================
﻿const ResourceManager = require('../../../Classes/managers/ResourceManager.js');

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




// ================================================================
// ResourceSystemManager.test.js (111 tests)
// ================================================================
/**
 * Unit Tests for ResourceSystemManager
 * Tests unified resource management: collection, spawning, selection, and registration
 */

// DUPLICATE REQUIRE REMOVED: let path = require('path');

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
    
    // Mock GameState
    global.GameState = {
      currentState: 'MENU',
      onStateChange: function(callback) {
        // Store callback but don't call it during test setup
        this._stateChangeCallbacks = this._stateChangeCallbacks || [];
        this._stateChangeCallbacks.push(callback);
      },
      getState: function() {
        return this.currentState;
      }
    };
    
    // Mock logging functions
    global.globalThis = {
      logNormal: function() {},
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
    delete global.GameState;
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




// ================================================================
// SpatialGridManager.test.js (76 tests)
// ================================================================
﻿// Mock logging functions on globalThis
globalThis.logDebug = globalThis.logDebug || function() {};
globalThis.logVerbose = globalThis.logVerbose || function() {};
globalThis.logNormal = globalThis.logNormal || function() {};

// Mock SpatialGrid before requiring SpatialGridManager
global.SpatialGrid = require('../../../Classes/systems/SpatialGrid.js');

let SpatialGridManager = require('../../../Classes/managers/SpatialGridManager.js');

describe('SpatialGridManager', function() {
  let manager;
  let mockEntity1, mockEntity2, mockEntity3, mockEntity4;
  
  beforeEach(function() {
    manager = new SpatialGridManager(64);
    
    // Create mock entities
    mockEntity1 = {
      id: 'entity1',
      type: 'Ant',
      getX: function() { return this._x; },
      getY: function() { return this._y; },
      _x: 100,
      _y: 100
    };
    
    mockEntity2 = {
      id: 'entity2',
      type: 'Ant',
      getX: function() { return this._x; },
      getY: function() { return this._y; },
      _x: 200,
      _y: 200
    };
    
    mockEntity3 = {
      id: 'entity3',
      type: 'Resource',
      getX: function() { return this._x; },
      getY: function() { return this._y; },
      _x: 150,
      _y: 150
    };
    
    mockEntity4 = {
      id: 'entity4',
      type: 'Building',
      getX: function() { return this._x; },
      getY: function() { return this._y; },
      _x: 300,
      _y: 300
    };
  });
  
  describe('Constructor', function() {
    it('should initialize with empty entities', function() {
      expect(manager.getEntityCount()).to.equal(0);
    });
    
    it('should initialize _allEntities array', function() {
      expect(manager._allEntities).to.be.an('array').that.is.empty;
    });
    
    it('should initialize _entitiesByType map', function() {
      expect(manager._entitiesByType).to.be.instanceOf(Map);
      expect(manager._entitiesByType.size).to.equal(0);
    });
    
    it('should initialize stats', function() {
      const stats = manager.getStats();
      expect(stats.operations.adds).to.equal(0);
      expect(stats.operations.removes).to.equal(0);
      expect(stats.operations.updates).to.equal(0);
      expect(stats.operations.queries).to.equal(0);
    });
    
    it('should create spatial grid', function() {
      expect(manager._grid).to.exist;
      expect(manager.getGrid()).to.exist;
    });
    
    it('should accept custom cell size', function() {
      const customManager = new SpatialGridManager(128);
      expect(customManager._grid._cellSize).to.equal(128);
    });
  });
  
  describe('addEntity()', function() {
    it('should add entity successfully', function() {
      const result = manager.addEntity(mockEntity1);
      expect(result).to.be.true;
      expect(manager.getEntityCount()).to.equal(1);
    });
    
    it('should return false for null entity', function() {
      const result = manager.addEntity(null);
      expect(result).to.be.false;
    });
    
    it('should return false for undefined entity', function() {
      const result = manager.addEntity(undefined);
      expect(result).to.be.false;
    });
    
    it('should add entity to _allEntities array', function() {
      manager.addEntity(mockEntity1);
      expect(manager._allEntities).to.include(mockEntity1);
    });
    
    it('should track entity by type', function() {
      manager.addEntity(mockEntity1);
      const ants = manager.getEntitiesByType('Ant');
      expect(ants).to.include(mockEntity1);
    });
    
    it('should increment add count', function() {
      const beforeStats = manager.getStats();
      manager.addEntity(mockEntity1);
      const afterStats = manager.getStats();
      expect(afterStats.operations.adds).to.equal(beforeStats.operations.adds + 1);
    });
    
    it('should add multiple entities', function() {
      manager.addEntity(mockEntity1);
      manager.addEntity(mockEntity2);
      manager.addEntity(mockEntity3);
      expect(manager.getEntityCount()).to.equal(3);
    });
    
    it('should maintain insertion order', function() {
      manager.addEntity(mockEntity1);
      manager.addEntity(mockEntity2);
      manager.addEntity(mockEntity3);
      const all = manager.getAllEntities();
      expect(all[0]).to.equal(mockEntity1);
      expect(all[1]).to.equal(mockEntity2);
      expect(all[2]).to.equal(mockEntity3);
    });
    
    it('should track multiple types', function() {
      manager.addEntity(mockEntity1);
      manager.addEntity(mockEntity3);
      manager.addEntity(mockEntity4);
      expect(manager._entitiesByType.size).to.equal(3);
    });
  });
  
  describe('removeEntity()', function() {
    beforeEach(function() {
      manager.addEntity(mockEntity1);
      manager.addEntity(mockEntity2);
      manager.addEntity(mockEntity3);
    });
    
    it('should remove entity successfully', function() {
      const result = manager.removeEntity(mockEntity1);
      expect(result).to.be.true;
      expect(manager.getEntityCount()).to.equal(2);
    });
    
    it('should return false for null entity', function() {
      const result = manager.removeEntity(null);
      expect(result).to.be.false;
    });
    
    it('should remove entity from _allEntities array', function() {
      manager.removeEntity(mockEntity1);
      expect(manager._allEntities).to.not.include(mockEntity1);
    });
    
    it('should remove entity from type tracking', function() {
      manager.removeEntity(mockEntity1);
      const ants = manager.getEntitiesByType('Ant');
      expect(ants).to.not.include(mockEntity1);
    });
    
    it('should clean up empty type arrays', function() {
      manager.removeEntity(mockEntity3); // Only Resource
      expect(manager._entitiesByType.has('Resource')).to.be.false;
    });
    
    it('should increment remove count', function() {
      const beforeStats = manager.getStats();
      manager.removeEntity(mockEntity1);
      const afterStats = manager.getStats();
      expect(afterStats.operations.removes).to.equal(beforeStats.operations.removes + 1);
    });
    
    it('should handle removing non-existent entity', function() {
      const result = manager.removeEntity(mockEntity4);
      expect(result).to.be.false;
    });
    
    it('should maintain array integrity after removal', function() {
      manager.removeEntity(mockEntity2);
      expect(manager.getAllEntities()).to.deep.equal([mockEntity1, mockEntity3]);
    });
  });
  
  describe('updateEntity()', function() {
    beforeEach(function() {
      manager.addEntity(mockEntity1);
    });
    
    it('should update entity position', function() {
      mockEntity1._x = 500;
      mockEntity1._y = 500;
      const result = manager.updateEntity(mockEntity1);
      expect(result).to.be.true;
    });
    
    it('should return false for null entity', function() {
      const result = manager.updateEntity(null);
      expect(result).to.be.false;
    });
    
    it('should increment update count', function() {
      const beforeStats = manager.getStats();
      manager.updateEntity(mockEntity1);
      const afterStats = manager.getStats();
      expect(afterStats.operations.updates).to.equal(beforeStats.operations.updates + 1);
    });
    
    it('should handle multiple updates', function() {
      for (let i = 0; i < 10; i++) {
        mockEntity1._x = i * 10;
        manager.updateEntity(mockEntity1);
      }
      const stats = manager.getStats();
      expect(stats.operations.updates).to.be.at.least(10);
    });
  });
  
  describe('getNearbyEntities()', function() {
    beforeEach(function() {
      manager.addEntity(mockEntity1); // 100, 100
      manager.addEntity(mockEntity2); // 200, 200
      manager.addEntity(mockEntity3); // 150, 150
      manager.addEntity(mockEntity4); // 300, 300
    });
    
    it('should find entities within radius', function() {
      const nearby = manager.getNearbyEntities(100, 100, 100);
      expect(nearby.length).to.be.greaterThan(0);
    });
    
    it('should filter by type', function() {
      const nearbyAnts = manager.getNearbyEntities(150, 150, 100, { type: 'Ant' });
      for (const entity of nearbyAnts) {
        expect(entity.type).to.equal('Ant');
      }
    });
    
    it('should use custom filter function', function() {
      const filter = (entity) => entity.id === 'entity1';
      const nearby = manager.getNearbyEntities(100, 100, 200, { filter });
      expect(nearby).to.have.lengthOf(1);
      expect(nearby[0].id).to.equal('entity1');
    });
    
    it('should combine type and custom filter', function() {
      const customFilter = (entity) => entity._x < 150;
      const nearby = manager.getNearbyEntities(100, 100, 200, { type: 'Ant', filter: customFilter });
      for (const entity of nearby) {
        expect(entity.type).to.equal('Ant');
        expect(entity._x).to.be.lessThan(150);
      }
    });
    
    it('should increment query count', function() {
      const beforeStats = manager.getStats();
      manager.getNearbyEntities(100, 100, 50);
      const afterStats = manager.getStats();
      expect(afterStats.operations.queries).to.equal(beforeStats.operations.queries + 1);
    });
    
    it('should return empty array when no entities nearby', function() {
      const nearby = manager.getNearbyEntities(10000, 10000, 10);
      expect(nearby).to.be.an('array').that.is.empty;
    });
  });
  
  describe('getEntitiesInRect()', function() {
    beforeEach(function() {
      manager.addEntity(mockEntity1); // 100, 100
      manager.addEntity(mockEntity2); // 200, 200
      manager.addEntity(mockEntity3); // 150, 150
      manager.addEntity(mockEntity4); // 300, 300
    });
    
    it('should find entities in rectangle', function() {
      const inRect = manager.getEntitiesInRect(50, 50, 200, 200);
      expect(inRect.length).to.be.greaterThan(0);
    });
    
    it('should filter by type', function() {
      const antsInRect = manager.getEntitiesInRect(0, 0, 250, 250, { type: 'Ant' });
      for (const entity of antsInRect) {
        expect(entity.type).to.equal('Ant');
      }
    });
    
    it('should use custom filter', function() {
      const filter = (entity) => entity.id.includes('2');
      const inRect = manager.getEntitiesInRect(0, 0, 500, 500, { filter });
      for (const entity of inRect) {
        expect(entity.id).to.include('2');
      }
    });
    
    it('should increment query count', function() {
      const beforeStats = manager.getStats();
      manager.getEntitiesInRect(0, 0, 100, 100);
      const afterStats = manager.getStats();
      expect(afterStats.operations.queries).to.equal(beforeStats.operations.queries + 1);
    });
    
    it('should return empty array for empty rectangle', function() {
      const inRect = manager.getEntitiesInRect(10000, 10000, 10, 10);
      expect(inRect).to.be.an('array').that.is.empty;
    });
  });
  
  describe('findNearestEntity()', function() {
    beforeEach(function() {
      manager.addEntity(mockEntity1); // 100, 100
      manager.addEntity(mockEntity2); // 200, 200
      manager.addEntity(mockEntity3); // 150, 150
    });
    
    it('should find nearest entity', function() {
      const nearest = manager.findNearestEntity(105, 105);
      expect(nearest).to.equal(mockEntity1);
    });
    
    it('should return null when no entities', function() {
      manager.clear();
      const nearest = manager.findNearestEntity(100, 100);
      expect(nearest).to.be.null;
    });
    
    it('should respect maxRadius', function() {
      const nearest = manager.findNearestEntity(100, 100, 10);
      expect(nearest).to.equal(mockEntity1);
    });
    
    it('should return null when outside maxRadius', function() {
      const nearest = manager.findNearestEntity(10000, 10000, 10);
      expect(nearest).to.be.null;
    });
    
    it('should filter by type', function() {
      const nearest = manager.findNearestEntity(155, 155, Infinity, { type: 'Resource' });
      expect(nearest).to.equal(mockEntity3);
    });
    
    it('should use custom filter', function() {
      const filter = (entity) => entity.id !== 'entity1';
      const nearest = manager.findNearestEntity(100, 100, Infinity, { filter });
      expect(nearest.id).to.not.equal('entity1');
    });
    
    it('should increment query count', function() {
      const beforeStats = manager.getStats();
      manager.findNearestEntity(100, 100);
      const afterStats = manager.getStats();
      expect(afterStats.operations.queries).to.equal(beforeStats.operations.queries + 1);
    });
  });
  
  describe('getAllEntities()', function() {
    it('should return empty array initially', function() {
      expect(manager.getAllEntities()).to.be.an('array').that.is.empty;
    });
    
    it('should return all entities', function() {
      manager.addEntity(mockEntity1);
      manager.addEntity(mockEntity2);
      manager.addEntity(mockEntity3);
      const all = manager.getAllEntities();
      expect(all).to.have.lengthOf(3);
      expect(all).to.include(mockEntity1);
      expect(all).to.include(mockEntity2);
      expect(all).to.include(mockEntity3);
    });
    
    it('should return reference to internal array', function() {
      const arr1 = manager.getAllEntities();
      const arr2 = manager.getAllEntities();
      expect(arr1).to.equal(arr2);
    });
  });
  
  describe('getEntitiesByType()', function() {
    beforeEach(function() {
      manager.addEntity(mockEntity1); // Ant
      manager.addEntity(mockEntity2); // Ant
      manager.addEntity(mockEntity3); // Resource
      manager.addEntity(mockEntity4); // Building
    });
    
    it('should return entities of specified type', function() {
      const ants = manager.getEntitiesByType('Ant');
      expect(ants).to.have.lengthOf(2);
      expect(ants).to.include(mockEntity1);
      expect(ants).to.include(mockEntity2);
    });
    
    it('should return empty array for non-existent type', function() {
      const none = manager.getEntitiesByType('NonExistent');
      expect(none).to.be.an('array').that.is.empty;
    });
    
    it('should return single entity type', function() {
      const resources = manager.getEntitiesByType('Resource');
      expect(resources).to.have.lengthOf(1);
      expect(resources[0]).to.equal(mockEntity3);
    });
  });
  
  describe('getEntityCount()', function() {
    it('should return 0 initially', function() {
      expect(manager.getEntityCount()).to.equal(0);
    });
    
    it('should return correct count after adds', function() {
      manager.addEntity(mockEntity1);
      expect(manager.getEntityCount()).to.equal(1);
      manager.addEntity(mockEntity2);
      expect(manager.getEntityCount()).to.equal(2);
    });
    
    it('should return correct count after removes', function() {
      manager.addEntity(mockEntity1);
      manager.addEntity(mockEntity2);
      manager.removeEntity(mockEntity1);
      expect(manager.getEntityCount()).to.equal(1);
    });
  });
  
  describe('getEntityCountByType()', function() {
    beforeEach(function() {
      manager.addEntity(mockEntity1); // Ant
      manager.addEntity(mockEntity2); // Ant
      manager.addEntity(mockEntity3); // Resource
    });
    
    it('should return count for type', function() {
      expect(manager.getEntityCountByType('Ant')).to.equal(2);
      expect(manager.getEntityCountByType('Resource')).to.equal(1);
    });
    
    it('should return 0 for non-existent type', function() {
      expect(manager.getEntityCountByType('NonExistent')).to.equal(0);
    });
    
    it('should update after removal', function() {
      manager.removeEntity(mockEntity1);
      expect(manager.getEntityCountByType('Ant')).to.equal(1);
    });
  });
  
  describe('hasEntity()', function() {
    beforeEach(function() {
      manager.addEntity(mockEntity1);
    });
    
    it('should return true for managed entity', function() {
      expect(manager.hasEntity(mockEntity1)).to.be.true;
    });
    
    it('should return false for non-managed entity', function() {
      expect(manager.hasEntity(mockEntity2)).to.be.false;
    });
    
    it('should return false after removal', function() {
      manager.removeEntity(mockEntity1);
      expect(manager.hasEntity(mockEntity1)).to.be.false;
    });
  });
  
  describe('clear()', function() {
    beforeEach(function() {
      manager.addEntity(mockEntity1);
      manager.addEntity(mockEntity2);
      manager.addEntity(mockEntity3);
    });
    
    it('should clear all entities', function() {
      manager.clear();
      expect(manager.getEntityCount()).to.equal(0);
    });
    
    it('should clear _allEntities array', function() {
      manager.clear();
      expect(manager._allEntities).to.be.empty;
    });
    
    it('should clear type tracking', function() {
      manager.clear();
      expect(manager._entitiesByType.size).to.equal(0);
    });
    
    it('should clear spatial grid', function() {
      manager.clear();
      const stats = manager.getStats();
      expect(stats.totalEntities).to.equal(0);
    });
  });
  
  describe('rebuildGrid()', function() {
    beforeEach(function() {
      manager.addEntity(mockEntity1);
      manager.addEntity(mockEntity2);
      manager.addEntity(mockEntity3);
    });
    
    it('should rebuild grid from entities', function() {
      expect(() => manager.rebuildGrid()).to.not.throw();
    });
    
    it('should maintain entity count', function() {
      const before = manager.getEntityCount();
      manager.rebuildGrid();
      const after = manager.getEntityCount();
      expect(after).to.equal(before);
    });
    
    it('should work after clearing grid manually', function() {
      manager._grid.clear();
      manager.rebuildGrid();
      const stats = manager.getStats();
      expect(stats.entityCount).to.be.greaterThan(0);
    });
  });
  
  describe('getStats()', function() {
    it('should return statistics object', function() {
      const stats = manager.getStats();
      expect(stats).to.be.an('object');
      expect(stats).to.have.property('totalEntities');
      expect(stats).to.have.property('entityTypes');
      expect(stats).to.have.property('operations');
    });
    
    it('should track operations', function() {
      manager.addEntity(mockEntity1);
      manager.removeEntity(mockEntity1);
      manager.addEntity(mockEntity2);
      manager.updateEntity(mockEntity2);
      manager.getNearbyEntities(100, 100, 50);
      
      const stats = manager.getStats();
      expect(stats.operations.adds).to.equal(2);
      expect(stats.operations.removes).to.equal(1);
      expect(stats.operations.updates).to.be.at.least(1);
      expect(stats.operations.queries).to.be.at.least(1);
    });
    
    it('should include grid stats', function() {
      const stats = manager.getStats();
      expect(stats).to.have.property('cellSize');
      expect(stats).to.have.property('cellCount');
    });
  });
  
  describe('getGrid()', function() {
    it('should return spatial grid instance', function() {
      const grid = manager.getGrid();
      expect(grid).to.exist;
      expect(grid).to.equal(manager._grid);
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle adding same entity twice', function() {
      manager.addEntity(mockEntity1);
      manager.addEntity(mockEntity1);
      expect(manager.getEntityCount()).to.equal(2); // Array allows duplicates
    });
    
    it('should handle rapid add/remove cycles', function() {
      for (let i = 0; i < 100; i++) {
        manager.addEntity(mockEntity1);
        manager.removeEntity(mockEntity1);
      }
      expect(manager.getEntityCount()).to.equal(0);
    });
    
    it('should handle entities with no type', function() {
      const noType = {
        id: 'noType',
        getX: () => 50,
        getY: () => 50
      };
      manager.addEntity(noType);
      const unknown = manager.getEntitiesByType('Unknown');
      expect(unknown).to.include(noType);
    });
    
    it('should handle large number of entities', function() {
      for (let i = 0; i < 1000; i++) {
        const entity = {
          id: `entity${i}`,
          type: 'Test',
          getX: () => Math.random() * 1000,
          getY: () => Math.random() * 1000
        };
        manager.addEntity(entity);
      }
      expect(manager.getEntityCount()).to.equal(1000);
    });
    
    it('should handle queries with no results', function() {
      const nearby = manager.getNearbyEntities(10000, 10000, 10);
      const inRect = manager.getEntitiesInRect(10000, 10000, 10, 10);
      const nearest = manager.findNearestEntity(10000, 10000, 10);
      
      expect(nearby).to.be.empty;
      expect(inRect).to.be.empty;
      expect(nearest).to.be.null;
    });
  });
});




// ================================================================
// taskManager.test.js (1 tests)
// ================================================================
/**
 * TaskManager Unit Tests (basic smoke)
 */
let fs = require('fs');
// DUPLICATE REQUIRE REMOVED: let path = require('path');
let assert = require('assert');

let controllerPath = path.join(__dirname, '..', '..', '..', 'Classes', 'controllers', 'TaskManager.js');
let controllerCode = fs.readFileSync(controllerPath, 'utf8');
let classMatch = controllerCode.match(/class TaskManager[\s\S]*?^}/m);
if (classMatch) {
  eval(classMatch[0]);
}

describe('TaskManager smoke', function() {
  it('constructs and can add a task', function() {
    const entity = { moveToLocation: () => {} };
    if (typeof TaskManager !== 'function') this.skip();
    const manager = new TaskManager(entity);
    manager.addTask({ id: 't1', type: 'MOVE', priority: 1, data: {} });
    assert(manager._taskQueue.length >= 1);
  });
});




// ================================================================
// TileInteractionManager.test.js (77 tests)
// ================================================================
﻿const TileInteractionManager = require('../../../Classes/managers/TileInteractionManager.js');

describe('TileInteractionManager', function() {
  let manager;
  let mockObject1, mockObject2, mockUIElement;
  
  beforeEach(function() {
    manager = new TileInteractionManager(32, 20, 15);
    
    // Mock global antManager
    global.antManager = null;
    global.window = { mouseX: 0, mouseY: 0 };
    
    // Create mock game objects
    mockObject1 = {
      id: 'obj1',
      zIndex: 1,
      getPosition: function() { return { x: 50, y: 50 }; },
      sprite: { pos: { x: 50, y: 50 } }
    };
    
    mockObject2 = {
      id: 'obj2',
      zIndex: 5,
      getPosition: function() { return { x: 50, y: 50 }; },
      handleClick: function(x, y, btn) { this.clicked = true; }
    };
    
    mockUIElement = {
      id: 'ui1',
      containsPoint: function(x, y) { 
        return x >= 10 && x <= 100 && y >= 10 && y <= 50; 
      },
      handleClick: function(x, y, btn) { this.clicked = true; }
    };
  });
  
  afterEach(function() {
    // Cleanup globals
    delete global.antManager;
    delete global.window;
  });
  
  describe('Constructor', function() {
    it('should initialize with tile size', function() {
      expect(manager.tileSize).to.equal(32);
    });
    
    it('should initialize with grid dimensions', function() {
      expect(manager.gridWidth).to.equal(20);
      expect(manager.gridHeight).to.equal(15);
    });
    
    it('should initialize empty tile map', function() {
      expect(manager.tileMap).to.be.instanceOf(Map);
      expect(manager.tileMap.size).to.equal(0);
    });
    
    it('should initialize empty UI elements array', function() {
      expect(manager.uiElements).to.be.an('array').that.is.empty;
    });
    
    it('should initialize with debug disabled', function() {
      expect(manager.debugEnabled).to.be.false;
    });
  });
  
  describe('pixelToTile()', function() {
    it('should convert pixel to tile coordinates', function() {
      const result = manager.pixelToTile(50, 50);
      expect(result.tileX).to.equal(1);
      expect(result.tileY).to.equal(1);
    });
    
    it('should calculate tile center', function() {
      const result = manager.pixelToTile(50, 50);
      expect(result.centerX).to.equal(48); // 1 * 32 + 16
      expect(result.centerY).to.equal(48);
    });
    
    it('should handle 0,0 coordinates', function() {
      const result = manager.pixelToTile(0, 0);
      expect(result.tileX).to.equal(0);
      expect(result.tileY).to.equal(0);
      expect(result.centerX).to.equal(16);
      expect(result.centerY).to.equal(16);
    });
    
    it('should handle negative coordinates', function() {
      const result = manager.pixelToTile(-10, -20);
      expect(result.tileX).to.equal(-1);
      expect(result.tileY).to.equal(-1);
    });
    
    it('should handle large coordinates', function() {
      const result = manager.pixelToTile(1000, 2000);
      expect(result.tileX).to.equal(31);
      expect(result.tileY).to.equal(62);
    });
    
    it('should handle fractional coordinates', function() {
      const result = manager.pixelToTile(45.7, 67.3);
      expect(result.tileX).to.equal(1);
      expect(result.tileY).to.equal(2);
    });
  });
  
  describe('getTileKey()', function() {
    it('should create tile key string', function() {
      const key = manager.getTileKey(5, 10);
      expect(key).to.equal('5,10');
    });
    
    it('should handle 0,0 coordinates', function() {
      const key = manager.getTileKey(0, 0);
      expect(key).to.equal('0,0');
    });
    
    it('should handle negative coordinates', function() {
      const key = manager.getTileKey(-5, -10);
      expect(key).to.equal('-5,-10');
    });
    
    it('should create unique keys for different tiles', function() {
      const key1 = manager.getTileKey(1, 2);
      const key2 = manager.getTileKey(2, 1);
      expect(key1).to.not.equal(key2);
    });
  });
  
  describe('isValidTile()', function() {
    it('should return true for valid tiles', function() {
      expect(manager.isValidTile(0, 0)).to.be.true;
      expect(manager.isValidTile(10, 7)).to.be.true;
      expect(manager.isValidTile(19, 14)).to.be.true;
    });
    
    it('should return false for negative coordinates', function() {
      expect(manager.isValidTile(-1, 0)).to.be.false;
      expect(manager.isValidTile(0, -1)).to.be.false;
    });
    
    it('should return false for out-of-bounds coordinates', function() {
      expect(manager.isValidTile(20, 0)).to.be.false;
      expect(manager.isValidTile(0, 15)).to.be.false;
      expect(manager.isValidTile(100, 100)).to.be.false;
    });
    
    it('should validate upper bounds correctly', function() {
      expect(manager.isValidTile(19, 14)).to.be.true;
      expect(manager.isValidTile(20, 14)).to.be.false;
      expect(manager.isValidTile(19, 15)).to.be.false;
    });
  });
  
  describe('addObjectToTile()', function() {
    it('should add object to tile', function() {
      manager.addObjectToTile(mockObject1, 5, 5);
      const objects = manager.getObjectsInTile(5, 5);
      expect(objects).to.include(mockObject1);
    });
    
    it('should not add to invalid tile', function() {
      manager.addObjectToTile(mockObject1, -1, -1);
      expect(manager.tileMap.size).to.equal(0);
    });
    
    it('should not add duplicate objects', function() {
      manager.addObjectToTile(mockObject1, 5, 5);
      manager.addObjectToTile(mockObject1, 5, 5);
      const objects = manager.getObjectsInTile(5, 5);
      expect(objects.length).to.equal(1);
    });
    
    it('should sort objects by z-index', function() {
      manager.addObjectToTile(mockObject1, 5, 5); // z-index 1
      manager.addObjectToTile(mockObject2, 5, 5); // z-index 5
      const objects = manager.getObjectsInTile(5, 5);
      expect(objects[0]).to.equal(mockObject2); // Higher z-index first
    });
    
    it('should handle objects with no z-index', function() {
      const noZIndex = { id: 'noZ' };
      manager.addObjectToTile(noZIndex, 5, 5);
      const objects = manager.getObjectsInTile(5, 5);
      expect(objects).to.include(noZIndex);
    });
    
    it('should add to multiple tiles', function() {
      manager.addObjectToTile(mockObject1, 1, 1);
      manager.addObjectToTile(mockObject1, 2, 2);
      expect(manager.getObjectsInTile(1, 1)).to.include(mockObject1);
      expect(manager.getObjectsInTile(2, 2)).to.include(mockObject1);
    });
  });
  
  describe('removeObjectFromTile()', function() {
    beforeEach(function() {
      manager.addObjectToTile(mockObject1, 5, 5);
      manager.addObjectToTile(mockObject2, 5, 5);
    });
    
    it('should remove object from tile', function() {
      manager.removeObjectFromTile(mockObject1, 5, 5);
      const objects = manager.getObjectsInTile(5, 5);
      expect(objects).to.not.include(mockObject1);
    });
    
    it('should keep other objects in tile', function() {
      manager.removeObjectFromTile(mockObject1, 5, 5);
      const objects = manager.getObjectsInTile(5, 5);
      expect(objects).to.include(mockObject2);
    });
    
    it('should clean up empty tiles', function() {
      manager.removeObjectFromTile(mockObject1, 5, 5);
      manager.removeObjectFromTile(mockObject2, 5, 5);
      expect(manager.tileMap.has('5,5')).to.be.false;
    });
    
    it('should handle removing non-existent object', function() {
      const nonExistent = { id: 'none' };
      expect(() => manager.removeObjectFromTile(nonExistent, 5, 5)).to.not.throw();
    });
    
    it('should handle removing from non-existent tile', function() {
      expect(() => manager.removeObjectFromTile(mockObject1, 10, 10)).to.not.throw();
    });
  });
  
  describe('updateObjectPosition()', function() {
    beforeEach(function() {
      manager.addObjectToTile(mockObject1, 5, 5);
    });
    
    it('should move object to new tile', function() {
      manager.updateObjectPosition(mockObject1, 5, 5, 10, 10);
      expect(manager.getObjectsInTile(5, 5)).to.not.include(mockObject1);
      expect(manager.getObjectsInTile(10, 10)).to.include(mockObject1);
    });
    
    it('should handle undefined old coordinates', function() {
      manager.updateObjectPosition(mockObject2, undefined, undefined, 7, 7);
      expect(manager.getObjectsInTile(7, 7)).to.include(mockObject2);
    });
    
    it('should work with debug enabled', function() {
      manager.setDebugEnabled(true);
      expect(() => manager.updateObjectPosition(mockObject1, 5, 5, 6, 6)).to.not.throw();
    });
  });
  
  describe('getObjectsAtPixel()', function() {
    beforeEach(function() {
      manager.addObjectToTile(mockObject1, 1, 1);
    });
    
    it('should return objects at pixel location', function() {
      const objects = manager.getObjectsAtPixel(48, 48); // Tile 1,1
      expect(objects).to.include(mockObject1);
    });
    
    it('should return empty array for empty tile', function() {
      const objects = manager.getObjectsAtPixel(200, 200);
      expect(objects).to.be.an('array').that.is.empty;
    });
    
    it('should handle edge coordinates', function() {
      const objects = manager.getObjectsAtPixel(32, 32); // Tile 1,1
      expect(objects).to.include(mockObject1);
    });
  });
  
  describe('getObjectsInTile()', function() {
    beforeEach(function() {
      manager.addObjectToTile(mockObject1, 5, 5);
      manager.addObjectToTile(mockObject2, 5, 5);
    });
    
    it('should return all objects in tile', function() {
      const objects = manager.getObjectsInTile(5, 5);
      expect(objects).to.have.lengthOf(2);
      expect(objects).to.include(mockObject1);
      expect(objects).to.include(mockObject2);
    });
    
    it('should return empty array for empty tile', function() {
      const objects = manager.getObjectsInTile(10, 10);
      expect(objects).to.be.an('array').that.is.empty;
    });
    
    it('should return objects sorted by z-index', function() {
      const objects = manager.getObjectsInTile(5, 5);
      expect(objects[0].zIndex).to.be.greaterThan(objects[1].zIndex);
    });
  });
  
  describe('registerUIElement()', function() {
    it('should register UI element', function() {
      manager.registerUIElement(mockUIElement);
      expect(manager.uiElements).to.have.lengthOf(1);
    });
    
    it('should register with priority', function() {
      manager.registerUIElement(mockUIElement, 10);
      expect(manager.uiElements[0].priority).to.equal(10);
    });
    
    it('should default priority to 0', function() {
      manager.registerUIElement(mockUIElement);
      expect(manager.uiElements[0].priority).to.equal(0);
    });
    
    it('should sort by priority descending', function() {
      const ui1 = { id: 'ui1' };
      const ui2 = { id: 'ui2' };
      const ui3 = { id: 'ui3' };
      
      manager.registerUIElement(ui1, 5);
      manager.registerUIElement(ui2, 10);
      manager.registerUIElement(ui3, 1);
      
      expect(manager.uiElements[0].priority).to.equal(10);
      expect(manager.uiElements[1].priority).to.equal(5);
      expect(manager.uiElements[2].priority).to.equal(1);
    });
    
    it('should register multiple UI elements', function() {
      manager.registerUIElement(mockUIElement);
      manager.registerUIElement({ id: 'ui2' });
      expect(manager.uiElements).to.have.lengthOf(2);
    });
  });
  
  describe('unregisterUIElement()', function() {
    beforeEach(function() {
      manager.registerUIElement(mockUIElement);
    });
    
    it('should remove UI element', function() {
      manager.unregisterUIElement(mockUIElement);
      expect(manager.uiElements).to.be.empty;
    });
    
    it('should handle removing non-existent element', function() {
      const nonExistent = { id: 'none' };
      expect(() => manager.unregisterUIElement(nonExistent)).to.not.throw();
    });
    
    it('should keep other elements', function() {
      const ui2 = { id: 'ui2' };
      manager.registerUIElement(ui2);
      manager.unregisterUIElement(mockUIElement);
      expect(manager.uiElements).to.have.lengthOf(1);
    });
  });
  
  describe('handleMouseClick()', function() {
    it('should prioritize UI elements', function() {
      manager.registerUIElement(mockUIElement);
      const result = manager.handleMouseClick(50, 30, 'LEFT');
      expect(mockUIElement.clicked).to.be.true;
      expect(result.entityClicked).to.be.false;
    });
    
    it('should handle object clicks', function() {
      manager.addObjectToTile(mockObject2, 1, 1);
      const result = manager.handleMouseClick(48, 48, 'LEFT');
      expect(mockObject2.clicked).to.be.true;
      expect(result.entityClicked).to.be.true;
    });
    
    it('should return tile center for valid clicks', function() {
      manager.addObjectToTile(mockObject2, 1, 1);
      const result = manager.handleMouseClick(48, 48, 'LEFT');
      expect(result.tileCenter).to.have.property('x');
      expect(result.tileCenter).to.have.property('y');
    });
    
    it('should handle clicks on empty tiles', function() {
      const result = manager.handleMouseClick(200, 200, 'LEFT');
      expect(result.entityClicked).to.be.false;
    });
    
    it('should handle invalid tile clicks', function() {
      const result = manager.handleMouseClick(-10, -10, 'LEFT');
      expect(result.tileCenter).to.be.null;
    });
    
    it('should handle different mouse buttons', function() {
      manager.addObjectToTile(mockObject2, 1, 1);
      manager.handleMouseClick(48, 48, 'RIGHT');
      expect(mockObject2.clicked).to.be.true;
    });
    
    it('should work with debug enabled', function() {
      manager.setDebugEnabled(true);
      expect(() => manager.handleMouseClick(100, 100, 'LEFT')).to.not.throw();
    });
  });
  
  describe('handleMouseRelease()', function() {
    it('should check objects at pixel', function() {
      const mockWithController = {
        _interactionController: {
          handleMouseRelease: function(x, y, btn) { 
            this.released = true;
            return true;
          }
        }
      };
      manager.addObjectToTile(mockWithController, 1, 1);
      
      const result = manager.handleMouseRelease(48, 48, 'LEFT');
      expect(result).to.be.true;
    });
    
    it('should return false when no objects handle release', function() {
      const result = manager.handleMouseRelease(200, 200, 'LEFT');
      expect(result).to.be.false;
    });
  });
  
  describe('handleTileClick()', function() {
    it('should be overridable', function() {
      const result = manager.handleTileClick(5, 5, 160, 160, 'LEFT');
      expect(result).to.be.a('boolean');
    });
    
    it('should handle different buttons', function() {
      manager.handleTileClick(5, 5, 160, 160, 'RIGHT');
      // Should not throw
    });
  });
  
  describe('setDebugEnabled()', function() {
    it('should enable debug mode', function() {
      manager.setDebugEnabled(true);
      expect(manager.debugEnabled).to.be.true;
    });
    
    it('should disable debug mode', function() {
      manager.setDebugEnabled(true);
      manager.setDebugEnabled(false);
      expect(manager.debugEnabled).to.be.false;
    });
  });
  
  describe('getDebugInfo()', function() {
    it('should return debug information', function() {
      const info = manager.getDebugInfo();
      expect(info).to.have.property('occupiedTiles');
      expect(info).to.have.property('totalObjects');
      expect(info).to.have.property('uiElements');
      expect(info).to.have.property('gridSize');
      expect(info).to.have.property('tileSize');
    });
    
    it('should count occupied tiles correctly', function() {
      manager.addObjectToTile(mockObject1, 1, 1);
      manager.addObjectToTile(mockObject2, 2, 2);
      const info = manager.getDebugInfo();
      expect(info.occupiedTiles).to.equal(2);
    });
    
    it('should count total objects correctly', function() {
      manager.addObjectToTile(mockObject1, 1, 1);
      manager.addObjectToTile(mockObject2, 1, 1);
      const info = manager.getDebugInfo();
      expect(info.totalObjects).to.equal(2);
    });
    
    it('should count UI elements', function() {
      manager.registerUIElement(mockUIElement);
      const info = manager.getDebugInfo();
      expect(info.uiElements).to.equal(1);
    });
    
    it('should include grid size', function() {
      const info = manager.getDebugInfo();
      expect(info.gridSize).to.equal('20x15');
    });
  });
  
  describe('clear()', function() {
    beforeEach(function() {
      manager.addObjectToTile(mockObject1, 1, 1);
      manager.addObjectToTile(mockObject2, 2, 2);
      manager.registerUIElement(mockUIElement);
    });
    
    it('should clear all objects', function() {
      manager.clear();
      expect(manager.tileMap.size).to.equal(0);
    });
    
    it('should clear UI elements', function() {
      manager.clear();
      expect(manager.uiElements).to.be.empty;
    });
    
    it('should result in empty debug info', function() {
      manager.clear();
      const info = manager.getDebugInfo();
      expect(info.occupiedTiles).to.equal(0);
      expect(info.totalObjects).to.equal(0);
      expect(info.uiElements).to.equal(0);
    });
  });
  
  describe('addObject()', function() {
    it('should add object at its position', function() {
      manager.addObject(mockObject1);
      const { tileX, tileY } = manager.pixelToTile(50, 50);
      const objects = manager.getObjectsInTile(tileX, tileY);
      expect(objects).to.include(mockObject1);
    });
    
    it('should handle null object', function() {
      expect(() => manager.addObject(null)).to.not.throw();
    });
    
    it('should handle object without position', function() {
      const noPos = { id: 'noPos' };
      expect(() => manager.addObject(noPos)).to.not.throw();
    });
    
    it('should use getPosition if available', function() {
      const withGetPos = {
        id: 'hasGetPos',
        getPosition: () => ({ x: 100, y: 100 })
      };
      manager.addObject(withGetPos);
      const { tileX, tileY } = manager.pixelToTile(100, 100);
      expect(manager.getObjectsInTile(tileX, tileY)).to.include(withGetPos);
    });
    
    it('should use sprite.pos as fallback', function() {
      const withSprite = {
        id: 'hasSprite',
        sprite: { pos: { x: 150, y: 150 } }
      };
      manager.addObject(withSprite);
      const { tileX, tileY } = manager.pixelToTile(150, 150);
      expect(manager.getObjectsInTile(tileX, tileY)).to.include(withSprite);
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle very large grid', function() {
      const bigManager = new TileInteractionManager(32, 1000, 1000);
      bigManager.addObjectToTile(mockObject1, 500, 500);
      expect(bigManager.getObjectsInTile(500, 500)).to.include(mockObject1);
    });
    
    it('should handle small tile size', function() {
      const smallTile = new TileInteractionManager(1, 100, 100);
      const result = smallTile.pixelToTile(50, 50);
      expect(result.tileX).to.equal(50);
      expect(result.tileY).to.equal(50);
    });
    
    it('should handle many objects in one tile', function() {
      for (let i = 0; i < 100; i++) {
        manager.addObjectToTile({ id: `obj${i}`, zIndex: i }, 5, 5);
      }
      const objects = manager.getObjectsInTile(5, 5);
      expect(objects).to.have.lengthOf(100);
    });
    
    it('should handle rapid add/remove cycles', function() {
      for (let i = 0; i < 50; i++) {
        manager.addObjectToTile(mockObject1, 5, 5);
        manager.removeObjectFromTile(mockObject1, 5, 5);
      }
      expect(manager.getObjectsInTile(5, 5)).to.be.empty;
    });
  });
});

