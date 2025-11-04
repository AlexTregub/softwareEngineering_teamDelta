/**
 * BuildingModel Unit Tests
 * 
 * Tests for BuildingModel (MVC pattern)
 * Following TDD: Write tests FIRST, then implement
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupTestEnvironment, cleanupTestEnvironment, loadMVCBaseClasses } = require('../../helpers/mvcTestHelpers');

// Setup test environment
setupTestEnvironment();

describe('BuildingModel', function() {
  let BaseModel, BuildingModel;
  
  before(function() {
    // Load MVC base classes
    const bases = loadMVCBaseClasses();
    BaseModel = bases.BaseModel;
    
    // BuildingModel will be created after tests are written
    BuildingModel = require('../../../Classes/models/BuildingModel');
  });
  
  afterEach(function() {
    cleanupTestEnvironment();
  });
  
  describe('Constructor', function() {
    it('should extend BaseModel', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      expect(model).to.be.instanceOf(BaseModel);
    });
    
    it('should accept position parameters', function() {
      const model = new BuildingModel(100, 150, 91, 97);
      expect(model.position).to.deep.equal({ x: 100, y: 150 });
    });
    
    it('should accept size parameters', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      expect(model.size).to.deep.equal({ width: 91, height: 97 });
    });
    
    it('should accept type option', function() {
      const model = new BuildingModel(100, 100, 91, 97, { type: 'anthill' });
      expect(model.type).to.equal('anthill');
    });
    
    it('should default type to antcone', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      expect(model.type).to.equal('antcone');
    });
    
    it('should accept faction option', function() {
      const model = new BuildingModel(100, 100, 91, 97, { faction: 'player' });
      expect(model.faction).to.equal('player');
    });
    
    it('should default faction to neutral', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      expect(model.faction).to.equal('neutral');
    });
  });
  
  describe('Health System', function() {
    it('should have health property', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      expect(model.health).to.equal(100);
    });
    
    it('should have maxHealth property', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      expect(model.maxHealth).to.equal(100);
    });
    
    it('should accept custom health', function() {
      const model = new BuildingModel(100, 100, 91, 97, { health: 50 });
      expect(model.health).to.equal(50);
    });
    
    it('should accept custom maxHealth', function() {
      const model = new BuildingModel(100, 100, 91, 97, { maxHealth: 200 });
      expect(model.maxHealth).to.equal(200);
    });
    
    it('should have takeDamage method', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      expect(model.takeDamage).to.be.a('function');
    });
    
    it('should reduce health when taking damage', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      model.takeDamage(30);
      expect(model.health).to.equal(70);
    });
    
    it('should return new health after damage', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      const newHealth = model.takeDamage(20);
      expect(newHealth).to.equal(80);
    });
    
    it('should not go below 0 health', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      model.takeDamage(150);
      expect(model.health).to.equal(0);
    });
    
    it('should notify listeners on health change', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      const listener = sinon.spy();
      model.addChangeListener(listener);
      
      model.takeDamage(25);
      
      expect(listener.calledOnce).to.be.true;
      expect(listener.firstCall.args[0]).to.equal('health');
      expect(listener.firstCall.args[1]).to.equal(75);
    });
    
    it('should have heal method', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      expect(model.heal).to.be.a('function');
    });
    
    it('should increase health when healing', function() {
      const model = new BuildingModel(100, 100, 91, 97, { health: 50 });
      model.heal(30);
      expect(model.health).to.equal(80);
    });
    
    it('should not exceed maxHealth when healing', function() {
      const model = new BuildingModel(100, 100, 91, 97, { health: 90 });
      model.heal(30);
      expect(model.health).to.equal(100);
    });
    
    it('should notify listeners on heal', function() {
      const model = new BuildingModel(100, 100, 91, 97, { health: 50 });
      const listener = sinon.spy();
      model.addChangeListener(listener);
      
      model.heal(25);
      
      expect(listener.calledOnce).to.be.true;
      expect(listener.firstCall.args[0]).to.equal('health');
    });
    
    it('should have isDead property', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      expect(model.isDead).to.be.a('boolean');
    });
    
    it('should return false for isDead when alive', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      expect(model.isDead).to.be.false;
    });
    
    it('should return true for isDead when health is 0', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      model.takeDamage(100);
      expect(model.isDead).to.be.true;
    });
    
    it('should notify died event when health reaches 0', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      const listener = sinon.spy();
      model.addChangeListener(listener);
      
      model.takeDamage(100);
      
      // Should have two calls: health change + died event
      expect(listener.callCount).to.be.at.least(1);
      const diedCall = listener.getCalls().find(call => call.args[0] === 'died');
      expect(diedCall).to.exist;
      expect(diedCall.args[1]).to.be.true;
    });
  });
  
  describe('Spawn System', function() {
    it('should have spawnConfig property', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      expect(model.spawnConfig).to.be.an('object');
    });
    
    it('should default spawnEnabled to false', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      expect(model.spawnConfig.enabled).to.be.false;
    });
    
    it('should accept spawnEnabled option', function() {
      const model = new BuildingModel(100, 100, 91, 97, { spawnEnabled: true });
      expect(model.spawnConfig.enabled).to.be.true;
    });
    
    it('should default spawnInterval to 10', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      expect(model.spawnConfig.interval).to.equal(10);
    });
    
    it('should accept spawnInterval option', function() {
      const model = new BuildingModel(100, 100, 91, 97, { spawnInterval: 5 });
      expect(model.spawnConfig.interval).to.equal(5);
    });
    
    it('should default spawnCount to 1', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      expect(model.spawnConfig.count).to.equal(1);
    });
    
    it('should accept spawnCount option', function() {
      const model = new BuildingModel(100, 100, 91, 97, { spawnCount: 5 });
      expect(model.spawnConfig.count).to.equal(5);
    });
    
    it('should have updateSpawnTimer method', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      expect(model.updateSpawnTimer).to.be.a('function');
    });
    
    it('should increment timer when spawn enabled', function() {
      const model = new BuildingModel(100, 100, 91, 97, { spawnEnabled: true });
      model.updateSpawnTimer(2.5);
      expect(model.spawnConfig.timer).to.equal(2.5);
    });
    
    it('should not increment timer when spawn disabled', function() {
      const model = new BuildingModel(100, 100, 91, 97, { spawnEnabled: false });
      model.updateSpawnTimer(2.5);
      expect(model.spawnConfig.timer).to.equal(0);
    });
    
    it('should notify spawn event when timer exceeds interval', function() {
      const model = new BuildingModel(100, 100, 91, 97, { 
        spawnEnabled: true, 
        spawnInterval: 5,
        spawnCount: 3
      });
      const listener = sinon.spy();
      model.addChangeListener(listener);
      
      model.updateSpawnTimer(6);
      
      const spawnCall = listener.getCalls().find(call => call.args[0] === 'spawn');
      expect(spawnCall).to.exist;
      expect(spawnCall.args[1]).to.equal(3); // spawnCount
    });
    
    it('should reset timer after spawning', function() {
      const model = new BuildingModel(100, 100, 91, 97, { 
        spawnEnabled: true, 
        spawnInterval: 5
      });
      model.updateSpawnTimer(7);
      expect(model.spawnConfig.timer).to.equal(2); // 7 - 5 = 2
    });
  });
  
  describe('Upgrade System', function() {
    it('should have canUpgrade method', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      expect(model.canUpgrade).to.be.a('function');
    });
    
    it('should return false if no upgrade tree', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      expect(model.canUpgrade(100)).to.be.false;
    });
    
    it('should return false if not enough resources', function() {
      const model = new BuildingModel(100, 100, 91, 97, {
        upgradeTree: {
          progressions: {
            1: { cost: 50 }
          }
        }
      });
      expect(model.canUpgrade(30)).to.be.false;
    });
    
    it('should return true if enough resources', function() {
      const model = new BuildingModel(100, 100, 91, 97, {
        upgradeTree: {
          progressions: {
            1: { cost: 50 }
          }
        }
      });
      expect(model.canUpgrade(60)).to.be.true;
    });
    
    it('should have applyUpgrade method', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      expect(model.applyUpgrade).to.be.a('function');
    });
    
    it('should return false if no upgrade available', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      expect(model.applyUpgrade()).to.be.false;
    });
    
    it('should increase level on upgrade', function() {
      const model = new BuildingModel(100, 100, 91, 97, {
        upgradeTree: {
          progressions: {
            1: { cost: 50 }
          }
        }
      });
      model.applyUpgrade();
      expect(model._currentLevel).to.equal(1);
    });
    
    it('should reduce spawn interval on upgrade', function() {
      const model = new BuildingModel(100, 100, 91, 97, {
        spawnInterval: 10,
        upgradeTree: {
          progressions: {
            1: { cost: 50 }
          }
        }
      });
      model.applyUpgrade();
      expect(model.spawnConfig.interval).to.equal(9);
    });
    
    it('should increase spawn count on upgrade', function() {
      const model = new BuildingModel(100, 100, 91, 97, {
        spawnCount: 2,
        upgradeTree: {
          progressions: {
            1: { cost: 50 }
          }
        }
      });
      model.applyUpgrade();
      expect(model.spawnConfig.count).to.equal(3);
    });
    
    it('should notify upgraded event', function() {
      const model = new BuildingModel(100, 100, 91, 97, {
        upgradeTree: {
          progressions: {
            1: { cost: 50 }
          }
        }
      });
      const listener = sinon.spy();
      model.addChangeListener(listener);
      
      model.applyUpgrade();
      
      const upgradeCall = listener.getCalls().find(call => call.args[0] === 'upgraded');
      expect(upgradeCall).to.exist;
      expect(upgradeCall.args[1]).to.equal(1); // new level
    });
  });
  
  describe('Update Lifecycle', function() {
    it('should have update method', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      expect(model.update).to.be.a('function');
    });
    
    it('should call updateSpawnTimer on update', function() {
      const model = new BuildingModel(100, 100, 91, 97, { spawnEnabled: true });
      model.update(1.5);
      expect(model.spawnConfig.timer).to.equal(1.5);
    });
  });
  
  describe('Serialization', function() {
    it('should have toJSON method', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      expect(model.toJSON).to.be.a('function');
    });
    
    it('should serialize position', function() {
      const model = new BuildingModel(100, 150, 91, 97);
      const json = model.toJSON();
      expect(json.position).to.deep.equal({ x: 100, y: 150 });
    });
    
    it('should serialize size', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      const json = model.toJSON();
      expect(json.size).to.deep.equal({ width: 91, height: 97 });
    });
    
    it('should serialize type', function() {
      const model = new BuildingModel(100, 100, 91, 97, { type: 'anthill' });
      const json = model.toJSON();
      expect(json.type).to.equal('anthill');
    });
    
    it('should serialize faction', function() {
      const model = new BuildingModel(100, 100, 91, 97, { faction: 'player' });
      const json = model.toJSON();
      expect(json.faction).to.equal('player');
    });
    
    it('should serialize health', function() {
      const model = new BuildingModel(100, 100, 91, 97, { health: 75 });
      const json = model.toJSON();
      expect(json.health).to.equal(75);
    });
    
    it('should serialize spawn config', function() {
      const model = new BuildingModel(100, 100, 91, 97, { 
        spawnEnabled: true,
        spawnInterval: 5,
        spawnCount: 3
      });
      const json = model.toJSON();
      expect(json.spawnConfig).to.deep.include({
        enabled: true,
        interval: 5,
        count: 3
      });
    });
  });
});
