/**
 * BuildingFactory Unit Tests
 * ---------------------------
 * Test-driven development for BuildingFactory.
 * 
 * Tests BEFORE implementation (TDD Red Phase).
 * 
 * Test Structure:
 * - Factory method existence
 * - AntCone creation (stats, position, type)
 * - AntHill creation (stats, position, type)
 * - HiveSource creation (stats, position, type)
 * - Type configurations
 * - Returns BuildingController instances
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupTestEnvironment, cleanupTestEnvironment } = require('../../helpers/mvcTestHelpers');

// Setup environment (JSDOM, p5.js, CollisionBox2D, Sprite2D)
setupTestEnvironment({ rendering: true, sprite: true });

describe('BuildingFactory', function() {
  let BuildingFactory, BuildingController;
  
  before(function() {
    BuildingController = require('../../../Classes/controllers/mvc/BuildingController');
    BuildingFactory = require('../../../Classes/factories/BuildingFactory');
  });
  
  afterEach(function() {
    cleanupTestEnvironment();
    sinon.restore();
  });
  
  describe('Factory Methods', function() {
    it('should have createAntCone method', function() {
      expect(BuildingFactory.createAntCone).to.be.a('function');
    });
    
    it('should have createAntHill method', function() {
      expect(BuildingFactory.createAntHill).to.be.a('function');
    });
    
    it('should have createHiveSource method', function() {
      expect(BuildingFactory.createHiveSource).to.be.a('function');
    });
  });
  
  describe('AntCone Creation', function() {
    it('should return BuildingController instance', function() {
      const cone = BuildingFactory.createAntCone(100, 150);
      expect(cone).to.be.instanceOf(BuildingController);
    });
    
    it('should set correct position', function() {
      const cone = BuildingFactory.createAntCone(100, 150);
      const pos = cone.getPosition();
      expect(pos.x).to.equal(100);
      expect(pos.y).to.equal(150);
    });
    
    it('should set correct type', function() {
      const cone = BuildingFactory.createAntCone(100, 150);
      expect(cone.getType()).to.equal('AntCone');
    });
    
    it('should accept faction parameter', function() {
      const cone = BuildingFactory.createAntCone(100, 150, 'player');
      expect(cone.getFaction()).to.equal('player');
    });
    
    it('should default to neutral faction', function() {
      const cone = BuildingFactory.createAntCone(100, 150);
      expect(cone.getFaction()).to.equal('neutral');
    });
    
    it('should have spawn configuration', function() {
      const cone = BuildingFactory.createAntCone(100, 150);
      const config = cone.getSpawnConfig();
      expect(config).to.have.property('interval');
      expect(config).to.have.property('count');
    });
    
    it('should have health stats', function() {
      const cone = BuildingFactory.createAntCone(100, 150);
      expect(cone.getHealth()).to.be.a('number');
      expect(cone.getMaxHealth()).to.be.a('number');
    });
  });
  
  describe('AntHill Creation', function() {
    it('should return BuildingController instance', function() {
      const hill = BuildingFactory.createAntHill(200, 250);
      expect(hill).to.be.instanceOf(BuildingController);
    });
    
    it('should set correct position', function() {
      const hill = BuildingFactory.createAntHill(200, 250);
      const pos = hill.getPosition();
      expect(pos.x).to.equal(200);
      expect(pos.y).to.equal(250);
    });
    
    it('should set correct type', function() {
      const hill = BuildingFactory.createAntHill(200, 250);
      expect(hill.getType()).to.equal('AntHill');
    });
    
    it('should accept faction parameter', function() {
      const hill = BuildingFactory.createAntHill(200, 250, 'enemy');
      expect(hill.getFaction()).to.equal('enemy');
    });
    
    it('should have different stats than AntCone', function() {
      const cone = BuildingFactory.createAntCone(100, 100);
      const hill = BuildingFactory.createAntHill(100, 100);
      
      // AntHill should have different health or spawn rates
      const coneHealth = cone.getMaxHealth();
      const hillHealth = hill.getMaxHealth();
      
      expect(hillHealth).to.not.equal(coneHealth);
    });
  });
  
  describe('HiveSource Creation', function() {
    it('should return BuildingController instance', function() {
      const hive = BuildingFactory.createHiveSource(300, 350);
      expect(hive).to.be.instanceOf(BuildingController);
    });
    
    it('should set correct position', function() {
      const hive = BuildingFactory.createHiveSource(300, 350);
      const pos = hive.getPosition();
      expect(pos.x).to.equal(300);
      expect(pos.y).to.equal(350);
    });
    
    it('should set correct type', function() {
      const hive = BuildingFactory.createHiveSource(300, 350);
      expect(hive.getType()).to.equal('HiveSource');
    });
    
    it('should accept faction parameter', function() {
      const hive = BuildingFactory.createHiveSource(300, 350, 'player');
      expect(hive.getFaction()).to.equal('player');
    });
    
    it('should have different stats than other buildings', function() {
      const cone = BuildingFactory.createAntCone(100, 100);
      const hive = BuildingFactory.createHiveSource(100, 100);
      
      const coneSpawn = cone.getSpawnConfig();
      const hiveSpawn = hive.getSpawnConfig();
      
      // HiveSource should have different spawn configuration
      expect(hiveSpawn.interval).to.not.equal(coneSpawn.interval);
    });
  });
  
  describe('Size Configuration', function() {
    it('should set default size for AntCone', function() {
      const cone = BuildingFactory.createAntCone(100, 100);
      const size = cone.getSize();
      expect(size.width).to.be.a('number');
      expect(size.height).to.be.a('number');
    });
    
    it('should set default size for AntHill', function() {
      const hill = BuildingFactory.createAntHill(100, 100);
      const size = hill.getSize();
      expect(size.width).to.be.a('number');
      expect(size.height).to.be.a('number');
    });
    
    it('should set default size for HiveSource', function() {
      const hive = BuildingFactory.createHiveSource(100, 100);
      const size = hive.getSize();
      expect(size.width).to.be.a('number');
      expect(size.height).to.be.a('number');
    });
  });
});
