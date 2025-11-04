/**
 * BuildingController Unit Tests
 * ------------------------------
 * Test-driven development for BuildingController MVC pattern.
 * 
 * Tests BEFORE implementation (TDD Red Phase).
 * 
 * Test Structure:
 * - Constructor (creates model + view)
 * - Extends BaseController
 * - Position/Size API
 * - Health API (getHealth, takeDamage, heal, isDead)
 * - Spawn API (getSpawnConfig, updateSpawnTimer, update)
 * - Upgrade API (canUpgrade, upgrade with image callback)
 * - Faction/Type API
 * - Input handling (click detection)
 * - Serialization (toJSON)
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupTestEnvironment, cleanupTestEnvironment } = require('../../helpers/mvcTestHelpers');

// Setup environment (JSDOM, p5.js, CollisionBox2D, Sprite2D)
setupTestEnvironment({ rendering: true, sprite: true });

describe('BuildingController', function() {
  let BuildingModel, BuildingView, BaseController, BuildingController;
  
  before(function() {
    BuildingModel = require('../../../Classes/models/BuildingModel');
    BuildingView = require('../../../Classes/views/BuildingView');
    BaseController = require('../../../Classes/controllers/mvc/BaseController');
    BuildingController = require('../../../Classes/controllers/mvc/BuildingController');
  });
  
  afterEach(function() {
    cleanupTestEnvironment();
    sinon.restore();
  });
  
  describe('Constructor', function() {
    it('should create a BuildingController instance', function() {
      const controller = new BuildingController(100, 100, 64, 64);
      expect(controller).to.be.instanceOf(BuildingController);
    });
    
    it('should extend BaseController', function() {
      const controller = new BuildingController(100, 100, 64, 64);
      expect(controller).to.be.instanceOf(BaseController);
    });
    
    it('should create internal model', function() {
      const controller = new BuildingController(100, 100, 64, 64);
      expect(controller._model).to.be.instanceOf(BuildingModel);
    });
    
    it('should create internal view', function() {
      const controller = new BuildingController(100, 100, 64, 64);
      expect(controller._view).to.be.instanceOf(BuildingView);
    });
    
    it('should accept options', function() {
      const controller = new BuildingController(100, 100, 64, 64, {
        type: 'AntCone',
        faction: 'player',
        health: 80
      });
      expect(controller.getType()).to.equal('AntCone');
      expect(controller.getFaction()).to.equal('player');
      expect(controller.getHealth()).to.equal(80);
    });
  });
  
  describe('Position and Size API', function() {
    it('should have getPosition method', function() {
      const controller = new BuildingController(100, 150, 64, 64);
      expect(controller.getPosition).to.be.a('function');
    });
    
    it('should return building position', function() {
      const controller = new BuildingController(100, 150, 64, 64);
      const pos = controller.getPosition();
      expect(pos).to.deep.equal({ x: 100, y: 150 });
    });
    
    it('should have getSize method', function() {
      const controller = new BuildingController(100, 150, 64, 96);
      expect(controller.getSize).to.be.a('function');
    });
    
    it('should return building size', function() {
      const controller = new BuildingController(100, 150, 64, 96);
      const size = controller.getSize();
      expect(size).to.deep.equal({ width: 64, height: 96 });
    });
  });
  
  describe('Health API', function() {
    it('should have getHealth method', function() {
      const controller = new BuildingController(100, 100, 64, 64);
      expect(controller.getHealth).to.be.a('function');
    });
    
    it('should return current health', function() {
      const controller = new BuildingController(100, 100, 64, 64, { health: 80 });
      expect(controller.getHealth()).to.equal(80);
    });
    
    it('should have getMaxHealth method', function() {
      const controller = new BuildingController(100, 100, 64, 64);
      expect(controller.getMaxHealth).to.be.a('function');
    });
    
    it('should return max health', function() {
      const controller = new BuildingController(100, 100, 64, 64, { maxHealth: 150 });
      expect(controller.getMaxHealth()).to.equal(150);
    });
    
    it('should have takeDamage method', function() {
      const controller = new BuildingController(100, 100, 64, 64);
      expect(controller.takeDamage).to.be.a('function');
    });
    
    it('should reduce health on damage', function() {
      const controller = new BuildingController(100, 100, 64, 64, { health: 100 });
      controller.takeDamage(30);
      expect(controller.getHealth()).to.equal(70);
    });
    
    it('should have heal method', function() {
      const controller = new BuildingController(100, 100, 64, 64);
      expect(controller.heal).to.be.a('function');
    });
    
    it('should increase health on heal', function() {
      const controller = new BuildingController(100, 100, 64, 64, { health: 60, maxHealth: 100 });
      controller.heal(20);
      expect(controller.getHealth()).to.equal(80);
    });
    
    it('should have isDead method', function() {
      const controller = new BuildingController(100, 100, 64, 64);
      expect(controller.isDead).to.be.a('function');
    });
    
    it('should return false when alive', function() {
      const controller = new BuildingController(100, 100, 64, 64, { health: 50 });
      expect(controller.isDead()).to.be.false;
    });
    
    it('should return true when dead', function() {
      const controller = new BuildingController(100, 100, 64, 64, { health: 10 });
      controller.takeDamage(20);
      expect(controller.isDead()).to.be.true;
    });
  });
  
  describe('Spawn API', function() {
    it('should have getSpawnConfig method', function() {
      const controller = new BuildingController(100, 100, 64, 64);
      expect(controller.getSpawnConfig).to.be.a('function');
    });
    
    it('should return spawn configuration', function() {
      const controller = new BuildingController(100, 100, 64, 64, {
        spawnInterval: 5,
        spawnCount: 2
      });
      const config = controller.getSpawnConfig();
      expect(config).to.have.property('interval', 5);
      expect(config).to.have.property('count', 2);
    });
    
    it('should have updateSpawnTimer method', function() {
      const controller = new BuildingController(100, 100, 64, 64);
      expect(controller.updateSpawnTimer).to.be.a('function');
    });
    
    it('should update spawn timer with delta time', function() {
      const controller = new BuildingController(100, 100, 64, 64, {
        spawnInterval: 5
      });
      controller.updateSpawnTimer(2);
      // Timer should advance (no error)
      expect(() => controller.updateSpawnTimer(2)).to.not.throw();
    });
    
    it('should have update method', function() {
      const controller = new BuildingController(100, 100, 64, 64);
      expect(controller.update).to.be.a('function');
    });
    
    it('should call model update on update', function() {
      const controller = new BuildingController(100, 100, 64, 64);
      const updateSpy = sinon.spy(controller._model, 'update');
      
      controller.update(1);
      
      expect(updateSpy.calledOnce).to.be.true;
      expect(updateSpy.firstCall.args[0]).to.equal(1);
    });
  });
  
  describe('Upgrade API', function() {
    it('should have canUpgrade method', function() {
      const controller = new BuildingController(100, 100, 64, 64);
      expect(controller.canUpgrade).to.be.a('function');
    });
    
    it('should check upgrade availability', function() {
      const controller = new BuildingController(100, 100, 64, 64, {
        upgradeTree: {
          progressions: {
            1: { cost: 50 }
          }
        }
      });
      expect(controller.canUpgrade(30)).to.be.false;
      expect(controller.canUpgrade(60)).to.be.true;
    });
    
    it('should have upgrade method', function() {
      const controller = new BuildingController(100, 100, 64, 64);
      expect(controller.upgrade).to.be.a('function');
    });
    
    it('should apply upgrade when called', function() {
      const controller = new BuildingController(100, 100, 64, 64, {
        upgradeTree: {
          progressions: {
            1: { cost: 50 }
          }
        }
      });
      const initialLevel = controller._model._currentLevel;
      
      controller.upgrade();
      
      expect(controller._model._currentLevel).to.equal(initialLevel + 1);
    });
    
    it('should accept image callback on upgrade', function() {
      const controller = new BuildingController(100, 100, 64, 64, {
        upgradeTree: {
          progressions: {
            1: { cost: 50 }
          }
        }
      });
      const mockImage = { width: 100, height: 100 };
      const imageCallback = sinon.stub().returns(mockImage);
      
      controller.upgrade(imageCallback);
      
      expect(imageCallback.calledOnce).to.be.true;
    });
    
    it('should update view image on upgrade', function() {
      const controller = new BuildingController(100, 100, 64, 64, {
        imagePath: 'test.png',
        upgradeTree: {
          progressions: {
            1: { cost: 50 }
          }
        }
      });
      const mockImage = { width: 100, height: 100 };
      const imageCallback = sinon.stub().returns(mockImage);
      const setImageSpy = sinon.spy(controller._view, 'setImage');
      
      controller.upgrade(imageCallback);
      
      expect(setImageSpy.calledOnce).to.be.true;
      expect(setImageSpy.firstCall.args[0]).to.equal(mockImage);
    });
  });
  
  describe('Type and Faction API', function() {
    it('should have getType method', function() {
      const controller = new BuildingController(100, 100, 64, 64);
      expect(controller.getType).to.be.a('function');
    });
    
    it('should return building type', function() {
      const controller = new BuildingController(100, 100, 64, 64, { type: 'AntHill' });
      expect(controller.getType()).to.equal('AntHill');
    });
    
    it('should have getFaction method', function() {
      const controller = new BuildingController(100, 100, 64, 64);
      expect(controller.getFaction).to.be.a('function');
    });
    
    it('should return building faction', function() {
      const controller = new BuildingController(100, 100, 64, 64, { faction: 'enemy' });
      expect(controller.getFaction()).to.equal('enemy');
    });
  });
  
  describe('Input Handling', function() {
    it('should have handleInput method', function() {
      const controller = new BuildingController(100, 100, 64, 64);
      expect(controller.handleInput).to.be.a('function');
    });
    
    it('should handle click events', function() {
      const controller = new BuildingController(100, 100, 64, 64);
      expect(() => controller.handleInput('click', { x: 120, y: 120 })).to.not.throw();
    });
    
    it('should detect clicks inside bounds', function() {
      const controller = new BuildingController(100, 100, 64, 64);
      const pointer = { x: 120, y: 120 }; // Inside building (100-164, 100-164)
      
      controller.handleInput('click', pointer);
      
      // Should handle without error (actual selection behavior tested in integration)
      expect(controller).to.be.instanceOf(BuildingController);
    });
  });
  
  describe('Serialization', function() {
    it('should have toJSON method', function() {
      const controller = new BuildingController(100, 100, 64, 64);
      expect(controller.toJSON).to.be.a('function');
    });
    
    it('should serialize building state', function() {
      const controller = new BuildingController(100, 100, 64, 64, {
        type: 'AntCone',
        faction: 'player',
        health: 80
      });
      const json = controller.toJSON();
      
      expect(json).to.have.property('position');
      expect(json).to.have.property('size');
      expect(json).to.have.property('type', 'AntCone');
      expect(json).to.have.property('faction', 'player');
      expect(json).to.have.property('health', 80);
    });
    
    it('should include spawn config in serialization', function() {
      const controller = new BuildingController(100, 100, 64, 64, {
        spawnInterval: 5,
        spawnCount: 2
      });
      const json = controller.toJSON();
      
      expect(json).to.have.property('spawnConfig');
      expect(json.spawnConfig).to.have.property('interval', 5);
      expect(json.spawnConfig).to.have.property('count', 2);
    });
  });
  
  describe('Render Delegation', function() {
    it('should have render method', function() {
      const controller = new BuildingController(100, 100, 64, 64);
      expect(controller.render).to.be.a('function');
    });
    
    it('should delegate render to view', function() {
      const controller = new BuildingController(100, 100, 64, 64, { imagePath: 'test.png' });
      const renderSpy = sinon.spy(controller._view, 'render');
      
      controller.render();
      
      expect(renderSpy.calledOnce).to.be.true;
    });
  });
});
