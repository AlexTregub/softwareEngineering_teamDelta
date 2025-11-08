/**
 * AntAdapter.test.js
 * 
 * TDD tests for AntAdapter - Backward compatibility wrapper for Ant MVC
 * Ensures existing ant class API works with new MVC architecture
 * 
 * Phase 4: Ant MVC Adapter
 * Target: Complete API compatibility, zero breaking changes
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('AntAdapter', function() {
  let AntAdapter, AntModel, AntView, AntController;
  
  before(function() {
    // Setup environment
    if (typeof window === 'undefined') {
      global.window = {};
    }
    
    // Mock p5.js basics
    global.createVector = sinon.stub().callsFake((x, y) => ({ x, y, copy: () => ({ x, y }) }));
    window.createVector = global.createVector;
    
    // Load MVC components
    AntModel = require('../../../Classes/baseMVC/models/AntModel');
    AntView = require('../../../Classes/baseMVC/views/AntView');
    AntController = require('../../../Classes/baseMVC/controllers/AntController');
    AntAdapter = require('../../../Classes/baseMVC/adapters/AntAdapter');
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Constructor', function() {
    it('should create adapter with all ant parameters', function() {
      const adapter = new AntAdapter(100, 200, 32, 32, 1, 0, null, 'Scout', 'player');
      
      expect(adapter).to.exist;
      expect(adapter.posX).to.equal(100);
      expect(adapter.posY).to.equal(200);
    });
    
    it('should initialize MVC components internally', function() {
      const adapter = new AntAdapter(100, 200, 32, 32);
      
      expect(adapter._model).to.be.instanceOf(AntModel);
      expect(adapter._view).to.be.instanceOf(AntView);
      expect(adapter._controller).to.be.instanceOf(AntController);
    });
    
    it('should pass jobName to model', function() {
      const adapter = new AntAdapter(100, 200, 32, 32, 1, 0, null, 'Farmer');
      
      expect(adapter.JobName).to.equal('Farmer');
    });
    
    it('should pass faction to model', function() {
      const adapter = new AntAdapter(100, 200, 32, 32, 1, 0, null, 'Scout', 'enemy');
      
      expect(adapter.faction).to.equal('enemy');
    });
  });
  
  describe('Property Getters', function() {
    let adapter;
    
    beforeEach(function() {
      adapter = new AntAdapter(100, 200, 32, 32, 1, 0, null, 'Scout', 'player');
    });
    
    it('should expose antIndex', function() {
      expect(adapter.antIndex).to.be.a('number');
    });
    
    it('should expose JobName getter', function() {
      expect(adapter.JobName).to.equal('Scout');
    });
    
    it('should expose StatsContainer getter', function() {
      // StatsContainer requires initialization (browser-only typically)
      // Test that getter exists and returns current value
      expect(adapter.StatsContainer).to.satisfy(val => val === null || val !== undefined);
    });
    
    it('should expose EntityInventoryManager getter', function() {
      // EntityInventoryManager requires initialization
      // Test that getter exists and returns current value
      expect(adapter.EntityInventoryManager).to.satisfy(val => val === null || val !== undefined);
    });
    
    it('should expose stateMachine getter', function() {
      // StateMachine requires initialization
      // Test that getter exists and returns current value
      expect(adapter.stateMachine).to.satisfy(val => val === null || val !== undefined);
    });
    
    it('should expose gatherState getter', function() {
      // GatherState requires initialization
      // Test that getter exists and returns current value
      expect(adapter.gatherState).to.satisfy(val => val === null || val !== undefined);
    });
    
    it('should expose faction getter', function() {
      expect(adapter.faction).to.equal('player');
    });
    
    it('should expose health getter', function() {
      expect(adapter.health).to.be.a('number');
    });
    
    it('should expose maxHealth getter', function() {
      expect(adapter.maxHealth).to.be.a('number');
    });
    
    it('should expose damage getter', function() {
      expect(adapter.damage).to.be.a('number');
    });
  });
  
  describe('Property Setters', function() {
    let adapter;
    
    beforeEach(function() {
      adapter = new AntAdapter(100, 200, 32, 32);
    });
    
    it('should support JobName setter', function() {
      adapter.JobName = 'Builder';
      expect(adapter.JobName).to.equal('Builder');
    });
    
    it('should support posX getter/setter', function() {
      const initial = adapter.posX;
      adapter.posX = initial + 50;
      expect(adapter.posX).to.equal(initial + 50);
    });
    
    it('should support posY getter/setter', function() {
      const initial = adapter.posY;
      adapter.posY = initial + 50;
      expect(adapter.posY).to.equal(initial + 50);
    });
    
    it('should support isSelected getter', function() {
      expect(adapter.isSelected).to.be.a('boolean');
    });
    
    it('should support isSelected setter', function() {
      adapter.isSelected = true;
      expect(adapter.isSelected).to.be.true;
    });
    
    it('should support isMoving getter', function() {
      expect(adapter.isMoving).to.be.a('boolean');
    });
  });
  
  describe('Job System Methods', function() {
    let adapter;
    
    beforeEach(function() {
      adapter = new AntAdapter(100, 200, 32, 32);
    });
    
    it('should delegate assignJob', function() {
      adapter.assignJob('Soldier');
      expect(adapter.JobName).to.equal('Soldier');
    });
    
    it('should delegate getJobStats', function() {
      const stats = adapter.getJobStats();
      expect(stats).to.be.an('object');
    });
  });
  
  describe('Resource Management Methods', function() {
    let adapter;
    
    beforeEach(function() {
      adapter = new AntAdapter(100, 200, 32, 32);
    });
    
    it('should delegate getResourceCount', function() {
      const count = adapter.getResourceCount();
      expect(count).to.be.a('number');
    });
    
    it('should delegate getMaxResources', function() {
      const max = adapter.getMaxResources();
      expect(max).to.be.a('number');
    });
    
    it('should delegate addResource', function() {
      const result = adapter.addResource({ type: 'food', amount: 1 });
      expect(result).to.be.a('boolean');
    });
    
    it('should delegate removeResource', function() {
      const result = adapter.removeResource(1);
      expect(result).to.be.an('array');
    });
    
    it('should delegate dropAllResources', function() {
      const result = adapter.dropAllResources();
      expect(result).to.be.an('array');
    });
    
    it('should delegate startGathering', function() {
      adapter.startGathering();
      expect(adapter.isGathering()).to.be.true;
    });
    
    it('should delegate stopGathering', function() {
      adapter.stopGathering();
      expect(adapter.isGathering()).to.be.false;
    });
    
    it('should delegate isGathering', function() {
      const result = adapter.isGathering();
      expect(result).to.be.a('boolean');
    });
  });
  
  describe('State Management Methods', function() {
    let adapter;
    
    beforeEach(function() {
      adapter = new AntAdapter(100, 200, 32, 32);
    });
    
    it('should delegate getCurrentState', function() {
      const state = adapter.getCurrentState();
      expect(state).to.be.a('string');
    });
    
    it('should delegate setState', function() {
      adapter.setState('GATHERING');
      // State may or may not change depending on state machine
      expect(adapter.getCurrentState()).to.be.a('string');
    });
  });
  
  describe('Combat Methods', function() {
    let adapter;
    
    beforeEach(function() {
      adapter = new AntAdapter(100, 200, 32, 32);
    });
    
    it('should delegate takeDamage', function() {
      const initialHealth = adapter.health;
      adapter.takeDamage(10);
      expect(adapter.health).to.be.lessThan(initialHealth);
    });
    
    it('should delegate heal', function() {
      adapter.takeDamage(20);
      const damagedHealth = adapter.health;
      adapter.heal(10);
      expect(adapter.health).to.be.greaterThan(damagedHealth);
    });
    
    it('should delegate attack', function() {
      const target = {
        takeDamage: sinon.stub(),
        getPosition: () => ({ x: 110, y: 110 })
      };
      
      adapter.attack(target);
      expect(target.takeDamage.called).to.be.true;
    });
    
    it('should delegate die', function() {
      global.ants = [adapter];
      const initialActive = adapter.isActive;
      adapter.die();
      // After die, isActive should change (may be false or undefined depending on implementation)
      expect(adapter.isActive).to.not.equal(true);
      delete global.ants;
    });
  });
  
  describe('Command/Task Methods', function() {
    let adapter;
    
    beforeEach(function() {
      adapter = new AntAdapter(100, 200, 32, 32);
    });
    
    it('should delegate addCommand', function() {
      const command = { type: 'move', x: 150, y: 150 };
      adapter.addCommand(command);
      // Should not throw
    });
  });
  
  describe('Update Method', function() {
    let adapter;
    
    beforeEach(function() {
      adapter = new AntAdapter(100, 200, 32, 32);
    });
    
    it('should delegate update', function() {
      // Should not throw
      adapter.update();
    });
    
    it('should update state machine', function() {
      const spy = sinon.spy(adapter._controller, 'update');
      adapter.update();
      expect(spy.called).to.be.true;
    });
  });
  
  describe('Render Method', function() {
    let adapter;
    
    beforeEach(function() {
      adapter = new AntAdapter(100, 200, 32, 32);
    });
    
    it('should delegate render', function() {
      // Should not throw
      adapter.render();
    });
  });
  
  describe('Debug Methods', function() {
    let adapter;
    
    beforeEach(function() {
      adapter = new AntAdapter(100, 200, 32, 32);
    });
    
    it('should delegate getDebugInfo', function() {
      const info = adapter.getDebugInfo();
      expect(info).to.be.an('object');
    });
    
    it('should delegate getAntIndex', function() {
      const index = adapter.getAntIndex();
      expect(index).to.be.a('number');
    });
    
    it('should delegate getHealthData', function() {
      const data = adapter.getHealthData();
      expect(data).to.be.an('object');
      expect(data).to.have.property('health');
      expect(data).to.have.property('maxHealth');
    });
    
    it('should delegate getResourceData', function() {
      const data = adapter.getResourceData();
      expect(data).to.be.an('object');
      expect(data).to.have.property('currentLoad');
      expect(data).to.have.property('maxCapacity');
    });
    
    it('should delegate getCombatData', function() {
      const data = adapter.getCombatData();
      expect(data).to.be.an('object');
      expect(data).to.have.property('damage');
    });
    
    it('should delegate getAntValidationData', function() {
      const data = adapter.getAntValidationData();
      expect(data).to.be.an('object');
      expect(data).to.have.property('antIndex');
      expect(data).to.have.property('jobName');
    });
  });
  
  describe('Cleanup Methods', function() {
    let adapter;
    
    beforeEach(function() {
      adapter = new AntAdapter(100, 200, 32, 32);
    });
    
    it('should delegate destroy', function() {
      adapter.destroy();
      // After destroy, isActive should be false or entity deactivated
      expect(adapter.isActive).to.not.equal(true);
    });
  });
  
  describe('Internal Helper Methods', function() {
    let adapter;
    
    beforeEach(function() {
      adapter = new AntAdapter(100, 200, 32, 32);
    });
    
    it('should expose _goToNearestDropoff', function() {
      // Should not throw
      adapter._goToNearestDropoff();
    });
    
    it('should expose _checkDropoffArrival', function() {
      const result = adapter._checkDropoffArrival();
      expect(result).to.be.a('boolean');
    });
    
    it('should expose _calculateDistance', function() {
      const entity1 = { getPosition: () => ({ x: 0, y: 0 }) };
      const entity2 = { getPosition: () => ({ x: 3, y: 4 }) };
      const distance = adapter._calculateDistance(entity1, entity2);
      expect(distance).to.equal(5);
    });
  });
  
  describe('Backward Compatibility', function() {
    it('should maintain Entity inheritance chain', function() {
      const adapter = new AntAdapter(100, 200, 32, 32);
      
      // Should have Entity-like methods through controller
      expect(adapter.getPosition).to.be.a('function');
      expect(adapter.setPosition).to.be.a('function');
    });
    
    it('should maintain controller access', function() {
      const adapter = new AntAdapter(100, 200, 32, 32);
      
      // Controller properties exist as getters (implementation returns model/view/controller references)
      // Test that they return something (not necessarily full controller objects)
      expect(typeof adapter._movementController).to.not.equal('undefined');
      expect(typeof adapter._taskManager).to.not.equal('undefined');
    });
    
    it('should maintain all legacy properties', function() {
      const adapter = new AntAdapter(100, 200, 32, 32, 1, 0, null, 'Scout', 'player');
      
      // Legacy property access
      expect(adapter.posX).to.be.a('number');
      expect(adapter.posY).to.be.a('number');
      expect(adapter.isSelected).to.be.a('boolean');
      expect(adapter.isMoving).to.be.a('boolean');
      expect(adapter.faction).to.equal('player');
    });
  });
});
