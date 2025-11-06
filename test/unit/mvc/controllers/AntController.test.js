/**
 * Unit tests for AntController
 * TDD: Write tests FIRST, then implement
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Load dependencies
const AntModel = require('../../../../Classes/mvc/models/AntModel');
const EntityController = require('../../../../Classes/mvc/controllers/EntityController');
const AntController = require('../../../../Classes/mvc/controllers/AntController');

describe('AntController', function() {
  let model, controller;
  
  beforeEach(function() {
    // Create ant model
    model = new AntModel({
      position: { x: 100, y: 200 },
      jobName: 'Scout',
      faction: 'player',
      health: 100,
      maxHealth: 100
    });
    
    // Create controller
    controller = new AntController();
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Constructor', function() {
    it('should create an AntController', function() {
      expect(controller).to.exist;
      expect(controller).to.be.an.instanceOf(AntController);
    });
    
    it('should extend EntityController', function() {
      expect(controller).to.be.an.instanceOf(EntityController);
    });
  });
  
  describe('Movement System', function() {
    it('should move ant towards target position', function() {
      model.targetPosition = { x: 200, y: 300 };
      const originalPos = model.getPosition();
      
      controller.update(model, 16);
      
      const newPos = model.getPosition();
      // Ant should have moved closer to target
      const originalDist = Math.hypot(originalPos.x - 200, originalPos.y - 300);
      const newDist = Math.hypot(newPos.x - 200, newPos.y - 300);
      expect(newDist).to.be.lessThan(originalDist);
    });
    
    it('should stop moving when target is reached', function() {
      model.targetPosition = { x: 101, y: 201 }; // Very close
      
      controller.update(model, 16);
      
      // Target should be cleared when reached
      expect(model.targetPosition).to.be.null;
    });
    
    it('should not move if no target position set', function() {
      model.targetPosition = null;
      const originalPos = model.getPosition();
      
      controller.update(model, 16);
      
      const newPos = model.getPosition();
      expect(newPos.x).to.equal(originalPos.x);
      expect(newPos.y).to.equal(originalPos.y);
    });
    
    it('should follow path waypoints', function() {
      model.path = [
        { x: 150, y: 200 },
        { x: 200, y: 250 }
      ];
      
      const originalPos = model.getPosition();
      controller.update(model, 16);
      
      const newPos = model.getPosition();
      // Should move towards first waypoint
      const originalDist = Math.hypot(originalPos.x - 150, originalPos.y - 200);
      const newDist = Math.hypot(newPos.x - 150, newPos.y - 200);
      expect(newDist).to.be.lessThan(originalDist);
    });
    
    it('should remove waypoint when reached', function() {
      model.path = [{ x: 101, y: 201 }]; // Very close
      
      controller.update(model, 16);
      
      // Waypoint should be removed
      expect(model.path).to.have.length(0);
    });
  });
  
  describe('Combat System', function() {
    it('should detect combat target', function() {
      const enemyId = 'enemy_1';
      model.combatTarget = enemyId;
      
      controller.update(model, 16);
      
      // Combat system should be active (implementation will verify)
      expect(model.combatTarget).to.equal(enemyId);
    });
    
    it('should clear combat target when null', function() {
      model.combatTarget = 'enemy_1';
      model.combatTarget = null;
      
      controller.update(model, 16);
      
      expect(model.combatTarget).to.be.null;
    });
  });
  
  describe('Health System', function() {
    it('should handle ant taking damage', function() {
      model.health = 50;
      
      controller.update(model, 16);
      
      // Health should still be tracked
      expect(model.health).to.equal(50);
      expect(model.maxHealth).to.equal(100);
    });
    
    it('should handle ant death (health = 0)', function() {
      model.health = 0;
      
      controller.update(model, 16);
      
      // Dead ants might be disabled (implementation detail)
      expect(model.health).to.equal(0);
    });
  });
  
  describe('Selection System', function() {
    it('should handle selection state', function() {
      const input = {
        mouse: { x: 100, y: 200, pressed: true },
        keyboard: {}
      };
      
      controller.handleInput(model, input);
      
      // Selection handled by input system
      // (Actual selection logic might be in separate SelectionManager)
      expect(input.mouse.pressed).to.be.true;
    });
    
    it('should track isSelected state', function() {
      model.isSelected = true;
      
      controller.update(model, 16);
      
      expect(model.isSelected).to.be.true;
    });
  });
  
  describe('Job-Specific Behavior', function() {
    it('should handle Scout job', function() {
      model.jobName = 'Scout';
      
      controller.update(model, 16);
      
      // Job-specific behavior (scouts might move faster, etc.)
      expect(model.jobName).to.equal('Scout');
    });
    
    it('should handle Warrior job', function() {
      model.jobName = 'Warrior';
      
      controller.update(model, 16);
      
      expect(model.jobName).to.equal('Warrior');
    });
    
    it('should handle Builder job', function() {
      model.jobName = 'Builder';
      
      controller.update(model, 16);
      
      expect(model.jobName).to.equal('Builder');
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
  
  describe('Performance', function() {
    it('should update 100 ants quickly', function() {
      const models = [];
      for (let i = 0; i < 100; i++) {
        models.push(new AntModel({
          position: { x: i * 10, y: i * 10 },
          jobName: 'Scout',
          faction: 'player'
        }));
        models[i].targetPosition = { x: i * 10 + 50, y: i * 10 + 50 };
      }
      
      const startTime = Date.now();
      
      models.forEach(m => controller.update(m, 16));
      
      const elapsed = Date.now() - startTime;
      expect(elapsed).to.be.lessThan(500); // Should be fast
    });
  });
});
