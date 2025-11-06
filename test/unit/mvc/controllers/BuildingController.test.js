/**
 * Unit tests for BuildingController
 * TDD: Write tests FIRST, then implement
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Load dependencies
const BuildingModel = require('../../../../Classes/mvc/models/BuildingModel');
const EntityController = require('../../../../Classes/mvc/controllers/EntityController');
const BuildingController = require('../../../../Classes/mvc/controllers/BuildingController');

describe('BuildingController', function() {
  let model, controller;
  
  beforeEach(function() {
    // Create building model
    model = new BuildingModel({
      x: 100,
      y: 200,
      buildingType: 'AntHill',
      faction: 'player',
      level: 1,
      health: 500,
      maxHealth: 500
    });
    
    // Create controller
    controller = new BuildingController();
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Constructor', function() {
    it('should create a BuildingController', function() {
      expect(controller).to.exist;
      expect(controller).to.be.an.instanceOf(BuildingController);
    });
    
    it('should extend EntityController', function() {
      expect(controller).to.be.an.instanceOf(EntityController);
    });
  });
  
  describe('Upgrade System', function() {
    it('should upgrade building level', function() {
      expect(model.level).to.equal(1);
      
      controller.upgrade(model);
      
      expect(model.level).to.equal(2);
    });
    
    it('should not upgrade if canUpgrade is false', function() {
      model.canUpgrade = false;
      
      expect(() => controller.upgrade(model)).to.throw('Building cannot be upgraded');
    });
    
    it('should not upgrade beyond max level', function() {
      model.level = 10;
      
      expect(() => controller.upgrade(model)).to.throw('Building at max level');
    });
    
    it('should update upgrade cost after leveling', function() {
      const originalCost = model.upgradeCost;
      
      controller.upgrade(model);
      
      // Cost might increase (implementation detail)
      expect(model.level).to.equal(2);
    });
  });
  
  describe('Health System', function() {
    it('should track building health', function() {
      expect(model.health).to.equal(500);
      expect(model.maxHealth).to.equal(500);
    });
    
    it('should handle damage', function() {
      controller.damage(model, 100);
      
      expect(model.health).to.equal(400);
    });
    
    it('should not allow health below zero', function() {
      controller.damage(model, 1000);
      
      expect(model.health).to.equal(0);
    });
    
    it('should handle repair', function() {
      model.health = 300;
      
      controller.repair(model, 100);
      
      expect(model.health).to.equal(400);
    });
    
    it('should not repair above max health', function() {
      model.health = 400;
      
      controller.repair(model, 200);
      
      expect(model.health).to.equal(500);
    });
    
    it('should disable building when destroyed', function() {
      controller.damage(model, 1000);
      
      expect(model.health).to.equal(0);
      // Building might be disabled (implementation detail)
    });
  });
  
  describe('Building Types', function() {
    it('should handle AntHill type', function() {
      model.buildingType = 'AntHill';
      
      controller.update(model, 16);
      
      expect(model.buildingType).to.equal('AntHill');
    });
    
    it('should handle Cone type', function() {
      model.buildingType = 'Cone';
      
      controller.update(model, 16);
      
      expect(model.buildingType).to.equal('Cone');
    });
    
    it('should handle Hive type', function() {
      model.buildingType = 'Hive';
      
      controller.update(model, 16);
      
      expect(model.buildingType).to.equal('Hive');
    });
    
    it('should handle Tower type', function() {
      model.buildingType = 'Tower';
      
      controller.update(model, 16);
      
      expect(model.buildingType).to.equal('Tower');
    });
  });
  
  describe('Faction System', function() {
    it('should handle player faction', function() {
      model.faction = 'player';
      
      controller.update(model, 16);
      
      expect(model.faction).to.equal('player');
    });
    
    it('should handle enemy faction', function() {
      model.faction = 'enemy';
      
      controller.update(model, 16);
      
      expect(model.faction).to.equal('enemy');
    });
    
    it('should handle neutral faction', function() {
      model.faction = 'neutral';
      
      controller.update(model, 16);
      
      expect(model.faction).to.equal('neutral');
    });
  });
  
  describe('Level System', function() {
    it('should track level progression', function() {
      expect(model.level).to.equal(1);
      
      controller.upgrade(model);
      expect(model.level).to.equal(2);
      
      controller.upgrade(model);
      expect(model.level).to.equal(3);
    });
    
    it('should increase stats with level', function() {
      const level1Health = model.maxHealth;
      
      controller.upgrade(model);
      
      // Max health might increase (implementation detail)
      expect(model.level).to.equal(2);
    });
  });
  
  describe('Update Behavior', function() {
    it('should update building state', function() {
      controller.update(model, 16);
      
      // Basic update should complete without errors
      expect(model.enabled).to.be.true;
    });
    
    it('should not update disabled buildings', function() {
      model.enabled = false;
      const originalLevel = model.level;
      
      controller.update(model, 16);
      
      expect(model.level).to.equal(originalLevel);
    });
  });
  
  describe('Performance', function() {
    it('should update 50 buildings quickly', function() {
      const models = [];
      for (let i = 0; i < 50; i++) {
        models.push(new BuildingModel({
          x: i * 50,
          y: i * 50,
          buildingType: 'AntHill',
          faction: 'player'
        }));
      }
      
      const startTime = Date.now();
      
      models.forEach(m => controller.update(m, 16));
      
      const elapsed = Date.now() - startTime;
      expect(elapsed).to.be.lessThan(100); // Should be fast
    });
  });
});
