/**
 * @file EntityService.integration.test.js
 * @description Integration tests for EntityService with real factories
 * 
 * Tests full spawn → query → destroy workflows with:
 * - Real AntFactory (creates AntController → AntModel + AntView)
 * - Real BuildingFactory (creates BuildingController → BuildingModel + BuildingView)
 * - Real ResourceFactory (creates ResourceController → ResourceModel + ResourceView)
 * 
 * @requires setupTestEnvironment (test/helpers/mvcTestHelpers.js)
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupTestEnvironment, cleanupTestEnvironment } = require('../../helpers/mvcTestHelpers');

// Setup test environment (JSDOM, p5.js, CollisionBox2D, rendering, sprite support)
setupTestEnvironment({ rendering: true, sprite: true });

describe('EntityService Integration Tests', function() {
  let EntityService, AntFactory, BuildingFactory, ResourceFactory;
  let AntManager, BuildingManager;
  let service, antFactory, buildingFactory, resourceFactory;
  
  before(function() {
    // Load MVC base classes and expose as globals (required for extending)
    global.BaseModel = require('../../../Classes/models/BaseModel');
    global.BaseView = require('../../../Classes/views/BaseView');
    global.BaseController = require('../../../Classes/controllers/mvc/BaseController');
    
    // Load Models (extend BaseModel)
    require('../../../Classes/models/AntModel');
    require('../../../Classes/models/BuildingModel');
    require('../../../Classes/models/ResourceModel');
    
    // Load Views (extend BaseView)
    require('../../../Classes/views/AntView');
    require('../../../Classes/views/BuildingView');
    require('../../../Classes/views/ResourceView');
    
    // Load Controllers (extend BaseController) and expose as globals
    global.AntController = require('../../../Classes/controllers/mvc/AntController');
    global.BuildingController = require('../../../Classes/controllers/mvc/BuildingController');
    global.ResourceController = require('../../../Classes/controllers/mvc/ResourceController');
    
    // Load EntityService
    EntityService = require('../../../Classes/services/EntityService');
    
    // Load real factories
    AntFactory = require('../../../Classes/factories/AntFactory');
    BuildingFactory = require('../../../Classes/factories/BuildingFactory');
    ResourceFactory = require('../../../Classes/factories/ResourceFactory');
    
    // Load managers (for factory dependencies)
    AntManager = require('../../../Classes/managers/AntManager');
    BuildingManager = require('../../../Classes/managers/BuildingManager');
  });
  
  beforeEach(function() {
    // Create real managers (AntFactory needs AntManager)
    const antManager = new AntManager();
    
    // Create real factories
    antFactory = new AntFactory(antManager);
    
    // BuildingFactory and ResourceFactory are static classes
    buildingFactory = BuildingFactory;
    resourceFactory = ResourceFactory;
    
    // Create EntityService with real factories
    service = new EntityService(antFactory, buildingFactory, resourceFactory);
  });
  
  afterEach(function() {
    cleanupTestEnvironment();
  });
  
  // ========================================
  // EntityService + AntFactory Integration (5 tests)
  // ========================================
  
  describe('EntityService + AntFactory', function() {
    it('should spawn ant with all job types', function() {
      const jobs = ['Scout', 'Warrior', 'Builder', 'Farmer', 'Spitter'];
      
      jobs.forEach(job => {
        const ant = service.spawn('Ant', { 
          x: 100, 
          y: 100, 
          jobName: job 
        });
        
        expect(ant).to.exist;
        expect(ant.jobName).to.equal(job);
        expect(ant.type).to.equal('Ant');
      });
      
      expect(service.getCount()).to.equal(5);
    });
    
    it('should spawn ant with correct AntController instance', function() {
      const ant = service.spawn('Ant', { 
        x: 150, 
        y: 250, 
        jobName: 'Scout',
        faction: 'player'
      });
      
      // Verify it's an AntController with MVC methods
      expect(ant).to.have.property('model');
      expect(ant).to.have.property('view');
      expect(ant.getPosition).to.be.a('function');
      expect(ant.getJobName).to.be.a('function');
      expect(ant.getFaction).to.be.a('function');
      
      // Verify position
      const position = ant.getPosition();
      expect(position.x).to.equal(150);
      expect(position.y).to.equal(250);
      
      // Verify job and faction
      expect(ant.getJobName()).to.equal('Worker');
      expect(ant.getFaction()).to.equal('player');
    });
    
    it('should spawn ant registered in spatial grid', function() {
      // Mock spatial grid
      const mockSpatialGrid = {
        addEntity: sinon.spy(),
        removeEntity: sinon.spy()
      };
      
      service.setSpatialGrid(mockSpatialGrid);
      
      const ant = service.spawn('Ant', { x: 100, y: 100 });
      
      expect(mockSpatialGrid.addEntity.calledOnce).to.be.true;
      expect(mockSpatialGrid.addEntity.firstCall.args[0]).to.equal(ant);
    });
    
    it('should query spawned ants by faction', function() {
      service.spawn('Ant', { x: 100, y: 100, faction: 'player' });
      service.spawn('Ant', { x: 200, y: 200, faction: 'player' });
      service.spawn('Ant', { x: 300, y: 300, faction: 'enemy' });
      
      const playerAnts = service.getByFaction('player');
      const enemyAnts = service.getByFaction('enemy');
      
      expect(playerAnts).to.have.lengthOf(2);
      expect(enemyAnts).to.have.lengthOf(1);
      
      playerAnts.forEach(ant => {
        expect(ant.getFaction()).to.equal('player');
      });
    });
    
    it('should destroy ant and unregister from spatial grid', function() {
      const mockSpatialGrid = {
        addEntity: sinon.spy(),
        removeEntity: sinon.spy()
      };
      
      service.setSpatialGrid(mockSpatialGrid);
      
      const ant = service.spawn('Ant', { x: 100, y: 100 });
      const antId = ant._id;
      
      const result = service.destroy(antId);
      
      expect(result).to.be.true;
      expect(service.getById(antId)).to.be.undefined;
      expect(mockSpatialGrid.removeEntity.calledOnce).to.be.true;
    });
  });
  
  // ========================================
  // EntityService + BuildingFactory Integration (5 tests)
  // ========================================
  
  describe('EntityService + BuildingFactory', function() {
    it('should spawn building with all types', function() {
      const types = ['AntCone', 'AntHill', 'HiveSource'];
      
      types.forEach(buildingType => {
        const building = service.spawn('Building', { 
          x: 100, 
          y: 100, 
          buildingType: buildingType,
          faction: 'player'
        });
        
        expect(building).to.exist;
        expect(building.type).to.equal('Building');
        expect(building.getType()).to.equal(buildingType);
      });
      
      expect(service.getCount()).to.equal(3);
    });
    
    it('should spawn building with correct BuildingController instance', function() {
      const building = service.spawn('Building', { 
        x: 300, 
        y: 400, 
        buildingType: 'AntCone',
        faction: 'player'
      });
      
      // Verify it's a BuildingController with MVC methods
      expect(building).to.have.property('model');
      expect(building).to.have.property('view');
      expect(building.getPosition).to.be.a('function');
      expect(building.getType).to.be.a('function');
      expect(building.getFaction).to.be.a('function');
      
      // Verify position
      const position = building.getPosition();
      expect(position.x).to.equal(300);
      expect(position.y).to.equal(400);
      
      // Verify type and faction
      expect(building.getType()).to.equal('AntCone');
      expect(building.getFaction()).to.equal('player');
    });
    
    it('should query spawned buildings by faction', function() {
      service.spawn('Building', { x: 100, y: 100, buildingType: 'AntCone', faction: 'player' });
      service.spawn('Building', { x: 200, y: 200, buildingType: 'AntHill', faction: 'enemy' });
      service.spawn('Building', { x: 300, y: 300, buildingType: 'HiveSource', faction: 'player' });
      
      const playerBuildings = service.getByFaction('player');
      const enemyBuildings = service.getByFaction('enemy');
      
      expect(playerBuildings).to.have.lengthOf(2);
      expect(enemyBuildings).to.have.lengthOf(1);
    });
    
    it('should destroy building and cleanup resources', function() {
      const building = service.spawn('Building', { 
        x: 100, 
        y: 100, 
        buildingType: 'AntCone',
        faction: 'player'
      });
      const buildingId = building._id;
      
      const result = service.destroy(buildingId);
      
      expect(result).to.be.true;
      expect(service.getById(buildingId)).to.be.undefined;
      expect(service.getCount()).to.equal(0);
    });
    
    it('should update all buildings each frame', function() {
      const building1 = service.spawn('Building', { x: 100, y: 100, buildingType: 'AntCone', faction: 'player' });
      const building2 = service.spawn('Building', { x: 200, y: 200, buildingType: 'AntHill', faction: 'player' });
      
      const spy1 = sinon.spy(building1, 'update');
      const spy2 = sinon.spy(building2, 'update');
      
      service.update(16);
      
      expect(spy1.calledOnce).to.be.true;
      expect(spy1.firstCall.args[0]).to.equal(16);
      expect(spy2.calledOnce).to.be.true;
    });
  });
  
  // ========================================
  // EntityService + ResourceFactory Integration (5 tests)
  // ========================================
  
  describe('EntityService + ResourceFactory', function() {
    it('should spawn resource with all types', function() {
      const resource1 = service.spawn('Resource', { 
        x: 100, 
        y: 100, 
        resourceType: 'greenLeaf'
      });
      
      const resource2 = service.spawn('Resource', { 
        x: 200, 
        y: 200, 
        resourceType: 'berry'
      });
      
      expect(resource1).to.exist;
      expect(resource1.type).to.equal('Resource');
      expect(resource2).to.exist;
      expect(resource2.type).to.equal('Resource');
      expect(service.getCount()).to.equal(2);
    });
    
    it('should spawn resource with correct ResourceController instance', function() {
      const resource = service.spawn('Resource', { 
        x: 150, 
        y: 250, 
        resourceType: 'greenLeaf',
        amount: 50
      });
      
      // Verify it's a ResourceController with MVC methods
      expect(resource).to.have.property('model');
      expect(resource).to.have.property('view');
      expect(resource.getPosition).to.be.a('function');
      expect(resource.getType).to.be.a('function');
      expect(resource.getAmount).to.be.a('function');
      
      // Verify position
      const position = resource.getPosition();
      expect(position.x).to.equal(150);
      expect(position.y).to.equal(250);
      
      // Verify type and amount
      expect(resource.getType()).to.equal('greenLeaf');
      expect(resource.getAmount()).to.equal(50);
    });
    
    it('should query spawned resources by type', function() {
      service.spawn('Resource', { x: 100, y: 100, resourceType: 'greenLeaf' });
      service.spawn('Resource', { x: 200, y: 200, resourceType: 'greenLeaf' });
      service.spawn('Resource', { x: 300, y: 300, resourceType: 'berry' });
      
      const resources = service.getByType('Resource');
      
      expect(resources).to.have.lengthOf(3);
      resources.forEach(r => {
        expect(r.type).to.equal('Resource');
      });
    });
    
    it('should destroy resource and unregister', function() {
      const resource = service.spawn('Resource', { 
        x: 100, 
        y: 100, 
        resourceType: 'greenLeaf'
      });
      const resourceId = resource._id;
      
      const result = service.destroy(resourceId);
      
      expect(result).to.be.true;
      expect(service.getById(resourceId)).to.be.undefined;
    });
    
    it('should handle gathering resource (amount reduction)', function() {
      const resource = service.spawn('Resource', { 
        x: 100, 
        y: 100, 
        resourceType: 'greenLeaf',
        amount: 100
      });
      
      // Gather 30 units
      resource.gather(30);
      
      expect(resource.getAmount()).to.equal(70);
      
      // Gather remaining
      resource.gather(70);
      
      expect(resource.getAmount()).to.equal(0);
    });
  });
});
