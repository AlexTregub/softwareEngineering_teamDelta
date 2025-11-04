/**
 * BuildingManager Integration Tests
 * ----------------------------------
 * Test-driven development for simplified BuildingManager.
 * 
 * Tests BEFORE implementation (TDD Red Phase).
 * 
 * BuildingManager responsibilities:
 * - Central tracking of all buildings (buildings[] array)
 * - Delegate creation to BuildingFactory
 * - Coordinate updates for all buildings
 * - Manage building lifecycle (add/remove)
 * - Integrate with game systems (selectables, spatial grid)
 * 
 * Test Structure:
 * - Singleton pattern
 * - Building creation (delegates to BuildingFactory)
 * - Building tracking (central array)
 * - Update coordination
 * - Building removal
 * - System integration
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupTestEnvironment, cleanupTestEnvironment } = require('../../helpers/mvcTestHelpers');

// Setup environment
setupTestEnvironment({ rendering: true, sprite: true });

describe('BuildingManager Integration', function() {

  afterEach(function() {
    cleanupTestEnvironment();
  });
  let BuildingManager, BuildingFactory, BuildingController;
  let manager;
  
  before(function() {
    BuildingFactory = require('../../../Classes/factories/BuildingFactory');
    BuildingController = require('../../../Classes/controllers/mvc/BuildingController');
    BuildingManager = require('../../../Classes/managers/BuildingManager');
  });
  
  beforeEach(function() {
    // Create fresh manager instance for each test
    manager = new BuildingManager();
  });
  
  afterEach(function() {
    cleanupTestEnvironment();
    cleanupTestEnvironment();
  });
  
  describe('Singleton Pattern', function() {
    it('should create BuildingManager instance', function() {
      expect(manager).to.be.instanceOf(BuildingManager);
    });
    
    it('should have buildings array', function() {
      expect(manager.buildings).to.be.an('array');
      expect(manager.buildings).to.have.lengthOf(0);
    });
  });
  
  describe('Building Creation', function() {
    it('should have createBuilding method', function() {
      expect(manager.createBuilding).to.be.a('function');
    });
    
    it('should create AntCone via factory', function() {
      const building = manager.createBuilding('antcone', 100, 100, 'player');
      
      expect(building).to.be.instanceOf(BuildingController);
      expect(building.getType()).to.equal('AntCone');
    });
    
    it('should create AntHill via factory', function() {
      const building = manager.createBuilding('anthill', 200, 200, 'enemy');
      
      expect(building).to.be.instanceOf(BuildingController);
      expect(building.getType()).to.equal('AntHill');
    });
    
    it('should create HiveSource via factory', function() {
      const building = manager.createBuilding('hivesource', 300, 300, 'neutral');
      
      expect(building).to.be.instanceOf(BuildingController);
      expect(building.getType()).to.equal('HiveSource');
    });
    
    it('should default faction to neutral', function() {
      const building = manager.createBuilding('antcone', 100, 100);
      expect(building.getFaction()).to.equal('neutral');
    });
    
    it('should return null for invalid type', function() {
      const building = manager.createBuilding('invalid', 100, 100);
      expect(building).to.be.null;
    });
  });
  
  describe('Building Tracking', function() {
    it('should track created buildings', function() {
      const building = manager.createBuilding('antcone', 100, 100);
      
      expect(manager.buildings).to.have.lengthOf(1);
      expect(manager.buildings[0]).to.equal(building);
    });
    
    it('should track multiple buildings', function() {
      const cone = manager.createBuilding('antcone', 100, 100);
      const hill = manager.createBuilding('anthill', 200, 200);
      const hive = manager.createBuilding('hivesource', 300, 300);
      
      expect(manager.buildings).to.have.lengthOf(3);
      expect(manager.buildings).to.include(cone);
      expect(manager.buildings).to.include(hill);
      expect(manager.buildings).to.include(hive);
    });
    
    it('should have getAllBuildings method', function() {
      expect(manager.getAllBuildings).to.be.a('function');
    });
    
    it('should return all buildings', function() {
      manager.createBuilding('antcone', 100, 100);
      manager.createBuilding('anthill', 200, 200);
      
      const buildings = manager.getAllBuildings();
      expect(buildings).to.have.lengthOf(2);
    });
    
    it('should have getBuildingCount method', function() {
      expect(manager.getBuildingCount).to.be.a('function');
    });
    
    it('should return building count', function() {
      manager.createBuilding('antcone', 100, 100);
      manager.createBuilding('anthill', 200, 200);
      
      expect(manager.getBuildingCount()).to.equal(2);
    });
  });
  
  describe('Update Coordination', function() {
    it('should have update method', function() {
      expect(manager.update).to.be.a('function');
    });
    
    it('should update all buildings', function() {
      const cone = manager.createBuilding('antcone', 100, 100);
      const hill = manager.createBuilding('anthill', 200, 200);
      
      const coneUpdateSpy = sinon.spy(cone, 'update');
      const hillUpdateSpy = sinon.spy(hill, 'update');
      
      manager.update(1.0);
      
      expect(coneUpdateSpy.calledOnce).to.be.true;
      expect(hillUpdateSpy.calledOnce).to.be.true;
      expect(coneUpdateSpy.firstCall.args[0]).to.equal(1.0);
    });
    
    it('should handle empty buildings array', function() {
      expect(() => manager.update(1.0)).to.not.throw();
    });
  });
  
  describe('Building Removal', function() {
    it('should have removeBuilding method', function() {
      expect(manager.removeBuilding).to.be.a('function');
    });
    
    it('should remove building from tracking', function() {
      const building = manager.createBuilding('antcone', 100, 100);
      
      manager.removeBuilding(building);
      
      expect(manager.buildings).to.have.lengthOf(0);
    });
    
    it('should handle removing non-existent building', function() {
      const building = BuildingFactory.createAntCone(100, 100);
      
      expect(() => manager.removeBuilding(building)).to.not.throw();
    });
    
    it('should have clear method', function() {
      expect(manager.clear).to.be.a('function');
    });
    
    it('should remove all buildings', function() {
      manager.createBuilding('antcone', 100, 100);
      manager.createBuilding('anthill', 200, 200);
      
      manager.clear();
      
      expect(manager.buildings).to.have.lengthOf(0);
    });
  });
  
  describe('Backwards Compatibility', function() {
    it('should support lowercase building types', function() {
      const cone = manager.createBuilding('antcone', 100, 100);
      expect(cone).to.not.be.null;
    });
    
    it('should support case-insensitive types', function() {
      const cone = manager.createBuilding('AntCone', 100, 100);
      const hill = manager.createBuilding('ANTHILL', 200, 200);
      
      expect(cone).to.not.be.null;
      expect(hill).to.not.be.null;
    });
  });
});
