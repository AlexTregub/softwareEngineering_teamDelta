/**
 * @file EntityService.test.js
 * @description Unit tests for EntityService (Phase 6.1 - Manager Elimination)
 * 
 * EntityService consolidates:
 * - AntManager (ant registry, creation, queries)
 * - BuildingManager (building registry, spawn queue)
 * - ResourceSystemManager (resource spawning, detection)
 * 
 * Into one unified entity management service.
 * 
 * @requires setupTestEnvironment (test/helpers/mvcTestHelpers.js)
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupTestEnvironment, cleanupTestEnvironment } = require('../../helpers/mvcTestHelpers');

// Setup test environment
setupTestEnvironment();

describe('EntityService', function() {
  let EntityService;
  let mockAntFactory, mockBuildingFactory, mockResourceFactory;
  let service;
  
  before(function() {
    // Load EntityService (will fail initially - TDD red phase)
    try {
      EntityService = require('../../../Classes/services/EntityService');
    } catch (e) {
      // Expected to fail on first run
      console.log('EntityService not yet implemented (TDD red phase)');
    }
  });
  
  beforeEach(function() {
    // Create mock ant entity generator
    const createMockAnt = (jobName = 'Worker', faction = 'player', isActive = true) => ({ 
      type: 'Ant', 
      jobName, 
      faction,
      isActive,
      update: sinon.stub(),
      destroy: sinon.stub()
    });
    
    // Mock AntFactory with instance methods matching real API
    mockAntFactory = {
      spawnAnts: sinon.stub().callsFake((count, faction, x, y) => {
        const ants = [];
        for (let i = 0; i < count; i++) {
          ants.push(createMockAnt('Worker', faction));
        }
        return ants;
      }),
      createScout: sinon.stub().callsFake((x, y, faction) => createMockAnt('Scout', faction)),
      createWarrior: sinon.stub().callsFake((x, y, faction) => createMockAnt('Warrior', faction)),
      createBuilder: sinon.stub().callsFake((x, y, faction) => createMockAnt('Builder', faction)),
      createFarmer: sinon.stub().callsFake((x, y, faction) => createMockAnt('Farmer', faction)),
      createSpitter: sinon.stub().callsFake((x, y, faction) => createMockAnt('Spitter', faction))
    };
    
    // Mock BuildingFactory with static-style methods matching real API
    mockBuildingFactory = {
      createAntCone: sinon.stub().callsFake((x, y, faction) => ({ 
        type: 'Building', 
        buildingType: 'AntCone', 
        faction,
        isActive: true,
        update: sinon.stub(),
        destroy: sinon.stub()
      })),
      createAntHill: sinon.stub().callsFake((x, y, faction) => ({ 
        type: 'Building', 
        buildingType: 'AntHill', 
        faction,
        isActive: true,
        update: sinon.stub(),
        destroy: sinon.stub()
      })),
      createHiveSource: sinon.stub().callsFake((x, y, faction) => ({ 
        type: 'Building', 
        buildingType: 'HiveSource', 
        faction,
        isActive: true,
        update: sinon.stub(),
        destroy: sinon.stub()
      }))
    };
    
    // Mock ResourceFactory with static-style createResource method
    mockResourceFactory = {
      createResource: sinon.stub().callsFake((resourceType, x, y, options) => ({ 
        type: 'Resource', 
        resourceType, 
        amount: options?.amount || 100,
        isActive: true,
        update: sinon.stub(),
        destroy: sinon.stub()
      }))
    };
    
    // Create EntityService with mock factories
    if (EntityService) {
      service = new EntityService(mockAntFactory, mockBuildingFactory, mockResourceFactory);
    }
  });
  
  afterEach(function() {
    cleanupTestEnvironment();
  });
  
  // ========================================
  // Registry Tests (10 tests)
  // ========================================
  
  describe('Registry', function() {
    it('should initialize with empty registry', function() {
      if (!EntityService) this.skip();
      
      expect(service.getCount()).to.equal(0);
      expect(service.getAllEntities()).to.be.an('array').that.is.empty;
    });
    
    it('should auto-generate sequential IDs', function() {
      if (!EntityService) this.skip();
      
      const entity1 = service.spawn('Ant', { x: 100, y: 100, faction: 'player' });
      const entity2 = service.spawn('Ant', { x: 200, y: 200, faction: 'player' });
      const entity3 = service.spawn('Building', { x: 300, y: 300, buildingType: 'AntCone', faction: 'player' });
      
      // IDs should be sequential (0, 1, 2)
      expect(entity1._id).to.be.a('number');
      expect(entity2._id).to.equal(entity1._id + 1);
      expect(entity3._id).to.equal(entity2._id + 1);
    });
    
    it('should store entity in registry on spawn', function() {
      if (!EntityService) this.skip();
      
      const entity = service.spawn('Ant', { x: 100, y: 100, faction: 'player' });
      
      expect(service.getCount()).to.equal(1);
      expect(service.getAllEntities()).to.include(entity);
    });
    
    it('should retrieve entity by ID (O(1) lookup)', function() {
      if (!EntityService) this.skip();
      
      const entity = service.spawn('Ant', { x: 100, y: 100, faction: 'player' });
      const id = entity._id;
      
      const retrieved = service.getById(id);
      
      expect(retrieved).to.equal(entity);
    });
    
    it('should return undefined for non-existent ID', function() {
      if (!EntityService) this.skip();
      
      const retrieved = service.getById(999);
      
      expect(retrieved).to.be.undefined;
    });
    
    it('should remove entity from registry on destroy', function() {
      if (!EntityService) this.skip();
      
      const entity = service.spawn('Ant', { x: 100, y: 100, faction: 'player' });
      const id = entity._id;
      
      service.destroy(id);
      
      expect(service.getCount()).to.equal(0);
      expect(service.getById(id)).to.be.undefined;
    });
    
    it('should get all entities as array', function() {
      if (!EntityService) this.skip();
      
      const ant1 = service.spawn('Ant', { x: 100, y: 100, faction: 'player' });
      const building1 = service.spawn('Building', { x: 200, y: 200, buildingType: 'AntCone', faction: 'player' });
      const resource1 = service.spawn('Resource', { x: 300, y: 300, resourceType: 'greenLeaf' });
      
      const allEntities = service.getAllEntities();
      
      expect(allEntities).to.be.an('array');
      expect(allEntities).to.have.lengthOf(3);
      expect(allEntities).to.include(ant1);
      expect(allEntities).to.include(building1);
      expect(allEntities).to.include(resource1);
    });
    
    it('should get entity count', function() {
      if (!EntityService) this.skip();
      
      expect(service.getCount()).to.equal(0);
      
      service.spawn('Ant', { x: 100, y: 100, faction: 'player' });
      expect(service.getCount()).to.equal(1);
      
      service.spawn('Building', { x: 200, y: 200, buildingType: 'AntCone', faction: 'player' });
      expect(service.getCount()).to.equal(2);
      
      service.spawn('Resource', { x: 300, y: 300, resourceType: 'greenLeaf' });
      expect(service.getCount()).to.equal(3);
    });
    
    it('should clear all entities', function() {
      if (!EntityService) this.skip();
      
      service.spawn('Ant', { x: 100, y: 100, faction: 'player' });
      service.spawn('Building', { x: 200, y: 200, buildingType: 'AntCone', faction: 'player' });
      service.spawn('Resource', { x: 300, y: 300, resourceType: 'greenLeaf' });
      
      service.clearAll();
      
      expect(service.getCount()).to.equal(0);
      expect(service.getAllEntities()).to.be.empty;
    });
    
    it('should not reuse IDs after destroy', function() {
      if (!EntityService) this.skip();
      
      const entity1 = service.spawn('Ant', { x: 100, y: 100, faction: 'player' });
      const id1 = entity1._id;
      
      service.destroy(id1);
      
      const entity2 = service.spawn('Ant', { x: 200, y: 200, faction: 'player' });
      const id2 = entity2._id;
      
      // ID should increment, not reuse
      expect(id2).to.not.equal(id1);
      expect(id2).to.be.greaterThan(id1);
    });
  });
  
  // ========================================
  // Spawn Tests (12 tests)
  // ========================================
  
  describe('Spawn', function() {
    it('should spawn ant with correct type (generic)', function() {
      if (!EntityService) this.skip();
      
      const ant = service.spawn('Ant', { x: 100, y: 100, faction: 'player' });
      
      expect(ant.type).to.equal('Ant');
      expect(mockAntFactory.spawnAnts.calledOnce).to.be.true;
    });
    
    it('should spawn ant with auto-generated ID', function() {
      if (!EntityService) this.skip();
      
      const ant = service.spawn('Ant', { x: 100, y: 100, faction: 'player' });
      
      expect(ant._id).to.be.a('number');
      expect(ant._id).to.be.at.least(0);
    });
    
    it('should spawn ant at specified position (via spawnAnts)', function() {
      if (!EntityService) this.skip();
      
      const ant = service.spawn('Ant', { x: 123, y: 456, faction: 'player' });
      
      expect(mockAntFactory.spawnAnts.calledOnce).to.be.true;
      expect(mockAntFactory.spawnAnts.calledWith(1, 'player', 123, 456)).to.be.true;
    });
    
    it('should spawn ant with specific job (via createWarrior)', function() {
      if (!EntityService) this.skip();
      
      const ant = service.spawn('Ant', { 
        x: 100, 
        y: 100, 
        jobName: 'Warrior', 
        faction: 'enemy' 
      });
      
      expect(mockAntFactory.createWarrior.calledOnce).to.be.true;
      expect(mockAntFactory.createWarrior.calledWith(100, 100, 'enemy')).to.be.true;
      expect(ant.jobName).to.equal('Warrior');
      expect(ant.faction).to.equal('enemy');
    });
    
    it('should spawn building with correct type', function() {
      if (!EntityService) this.skip();
      
      const building = service.spawn('Building', { x: 200, y: 200, buildingType: 'AntCone', faction: 'player' });
      
      expect(building.type).to.equal('Building');
      expect(mockBuildingFactory.createAntCone.calledOnce).to.be.true;
    });
    
    it('should spawn building with custom options', function() {
      if (!EntityService) this.skip();
      
      const building = service.spawn('Building', { 
        x: 200, 
        y: 200, 
        buildingType: 'AntHill', 
        faction: 'player' 
      });
      
      expect(mockBuildingFactory.createAntHill.calledOnce).to.be.true;
      expect(mockBuildingFactory.createAntHill.calledWith(200, 200, 'player')).to.be.true;
      expect(building.buildingType).to.equal('AntHill');
      expect(building.faction).to.equal('player');
    });
    
    it('should spawn resource with correct type', function() {
      if (!EntityService) this.skip();
      
      const resource = service.spawn('Resource', { x: 300, y: 300, resourceType: 'greenLeaf' });
      
      expect(resource.type).to.equal('Resource');
      expect(mockResourceFactory.createResource.calledOnce).to.be.true;
    });
    
    it('should spawn resource with custom options', function() {
      if (!EntityService) this.skip();
      
      const resource = service.spawn('Resource', { 
        x: 300, 
        y: 300, 
        resourceType: 'berry', 
        amount: 50 
      });
      
      expect(mockResourceFactory.createResource.calledOnce).to.be.true;
      expect(mockResourceFactory.createResource.calledWith('berry', 300, 300, { amount: 50 })).to.be.true;
      expect(resource.resourceType).to.equal('berry');
      expect(resource.amount).to.equal(50);
    });
    
    it('should delegate to AntFactory for ant spawning', function() {
      if (!EntityService) this.skip();
      
      service.spawn('Ant', { x: 100, y: 100, faction: 'player' });
      
      expect(mockAntFactory.spawnAnts.calledOnce).to.be.true;
      expect(mockBuildingFactory.createAntCone.called).to.be.false;
      expect(mockResourceFactory.createResource.called).to.be.false;
    });
    
    it('should delegate to BuildingFactory for building spawning', function() {
      if (!EntityService) this.skip();
      
      service.spawn('Building', { x: 200, y: 200, buildingType: 'AntCone', faction: 'player' });
      
      expect(mockBuildingFactory.createAntCone.calledOnce).to.be.true;
      expect(mockAntFactory.spawnAnts.called).to.be.false;
      expect(mockResourceFactory.createResource.called).to.be.false;
    });
    
    it('should delegate to ResourceFactory for resource spawning', function() {
      if (!EntityService) this.skip();
      
      service.spawn('Resource', { x: 300, y: 300, resourceType: 'greenLeaf' });
      
      expect(mockResourceFactory.createResource.calledOnce).to.be.true;
      expect(mockAntFactory.spawnAnts.called).to.be.false;
      expect(mockBuildingFactory.createAntCone.called).to.be.false;
    });
    
    it('should throw error for unknown entity type', function() {
      if (!EntityService) this.skip();
      
      expect(() => {
        service.spawn('UnknownType', { x: 100, y: 100 });
      }).to.throw(/unknown entity type/i);
    });
  });
  
  // ========================================
  // Query Tests (10 tests)
  // ========================================
  
  describe('Query', function() {
    beforeEach(function() {
      if (!EntityService) return;
      
      // Don't override mocks - let the callsFake handle it
      // Tests will pass options to spawn() which factories will use
    });
    
    it('should get entities by type (Ant)', function() {
      if (!EntityService) this.skip();
      
      service.spawn('Ant', { x: 100, y: 100, faction: 'player' });
      service.spawn('Ant', { x: 200, y: 200, faction: 'player' });
      service.spawn('Building', { x: 300, y: 300, buildingType: 'AntCone', faction: 'player' });
      
      const ants = service.getByType('Ant');
      
      expect(ants).to.be.an('array');
      expect(ants).to.have.lengthOf(2);
      expect(ants.every(e => e.type === 'Ant')).to.be.true;
    });
    
    it('should get entities by type (Building)', function() {
      if (!EntityService) this.skip();
      
      service.spawn('Ant', { x: 100, y: 100, faction: 'player' });
      service.spawn('Building', { x: 200, y: 200, buildingType: 'AntCone', faction: 'player' });
      service.spawn('Building', { x: 300, y: 300, buildingType: 'AntHill', faction: 'player' });
      
      const buildings = service.getByType('Building');
      
      expect(buildings).to.have.lengthOf(2);
      expect(buildings.every(e => e.type === 'Building')).to.be.true;
    });
    
    it('should get entities by type (Resource)', function() {
      if (!EntityService) this.skip();
      
      service.spawn('Ant', { x: 100, y: 100, faction: 'player' });
      service.spawn('Resource', { x: 200, y: 200, resourceType: 'greenLeaf' });
      
      const resources = service.getByType('Resource');
      
      expect(resources).to.have.lengthOf(1);
      expect(resources[0].type).to.equal('Resource');
    });
    
    it('should return empty array for non-existent type', function() {
      if (!EntityService) this.skip();
      
      service.spawn('Ant', { x: 100, y: 100, faction: 'player' });
      
      const nonExistent = service.getByType('NonExistentType');
      
      expect(nonExistent).to.be.an('array').that.is.empty;
    });
    
    it('should get entities by faction (player)', function() {
      if (!EntityService) this.skip();
      
      service.spawn('Ant', { x: 100, y: 100, faction: 'player' });
      service.spawn('Ant', { x: 200, y: 200, faction: 'enemy' });
      service.spawn('Building', { x: 300, y: 300, buildingType: 'AntCone', faction: 'player' });
      
      const playerEntities = service.getByFaction('player');
      
      expect(playerEntities).to.have.lengthOf(2);
      expect(playerEntities.every(e => e.faction === 'player')).to.be.true;
    });
    
    it('should get entities by faction (enemy)', function() {
      if (!EntityService) this.skip();
      
      service.spawn('Ant', { x: 100, y: 100, faction: 'player' });
      service.spawn('Ant', { x: 200, y: 200, faction: 'enemy' });
      service.spawn('Building', { x: 300, y: 300, buildingType: 'AntCone', faction: 'enemy' });
      
      const enemyEntities = service.getByFaction('enemy');
      
      expect(enemyEntities).to.have.lengthOf(2);
      expect(enemyEntities.every(e => e.faction === 'enemy')).to.be.true;
    });
    
    it('should get entities by faction (neutral)', function() {
      if (!EntityService) this.skip();
      
      service.spawn('Ant', { x: 100, y: 100, faction: 'neutral' });
      service.spawn('Ant', { x: 200, y: 200, faction: 'player' });
      
      const neutralEntities = service.getByFaction('neutral');
      
      expect(neutralEntities).to.have.lengthOf(1);
      expect(neutralEntities[0].faction).to.equal('neutral');
    });
    
    it('should get entities by type AND faction', function() {
      if (!EntityService) this.skip();
      
      service.spawn('Ant', { x: 100, y: 100, faction: 'player' });
      service.spawn('Ant', { x: 200, y: 200, faction: 'enemy' });
      service.spawn('Building', { x: 300, y: 300, buildingType: 'AntCone', faction: 'player' });
      
      // Get only player ants
      const playerAnts = service.query(e => e.type === 'Ant' && e.faction === 'player');
      
      expect(playerAnts).to.have.lengthOf(1);
      expect(playerAnts[0].type).to.equal('Ant');
      expect(playerAnts[0].faction).to.equal('player');
    });
    
    it('should get entities by custom filter function', function() {
      if (!EntityService) this.skip();
      
      // Override spawnAnts to return custom health values
      mockAntFactory.spawnAnts = sinon.stub();
      mockAntFactory.spawnAnts
        .onFirstCall().returns([{ _id: 0, type: 'Ant', health: 100, faction: 'player', update: sinon.stub(), destroy: sinon.stub() }])
        .onSecondCall().returns([{ _id: 1, type: 'Ant', health: 30, faction: 'player', update: sinon.stub(), destroy: sinon.stub() }])
        .onThirdCall().returns([{ _id: 2, type: 'Ant', health: 75, faction: 'player', update: sinon.stub(), destroy: sinon.stub() }]);
      
      service.spawn('Ant', { x: 100, y: 100, faction: 'player' });
      service.spawn('Ant', { x: 200, y: 200, faction: 'player' });
      service.spawn('Ant', { x: 300, y: 300, faction: 'player' });
      
      // Get ants with health < 50
      const lowHealthAnts = service.query(e => e.health < 50);
      
      expect(lowHealthAnts).to.have.lengthOf(1);
      expect(lowHealthAnts[0].health).to.equal(30);
    });
    
    it('should handle complex queries efficiently', function() {
      if (!EntityService) this.skip();
      
      // Recreate service with a factory that always returns valid objects
      mockAntFactory.create = sinon.stub().callsFake((options) => ({
        type: 'Ant',
        jobName: 'Worker',
        faction: 'player',
        isActive: true,
        update: sinon.stub(),
        destroy: sinon.stub()
      }));
      
      service = new EntityService(mockAntFactory, mockBuildingFactory, mockResourceFactory);
      
      // Spawn many entities
      for (let i = 0; i < 50; i++) {
        service.spawn('Ant', { x: i * 10, y: i * 10, faction: 'player' });
      }
      
      const startTime = Date.now();
      const results = service.query(e => e.type === 'Ant');
      const endTime = Date.now();
      
      expect(results).to.have.lengthOf(50);
      expect(endTime - startTime).to.be.lessThan(10); // Query should be fast (<10ms)
    });
  });
  
  // ========================================
  // Update Tests (5 tests)
  // ========================================
  
  describe('Update', function() {
    it('should update all entities in registry', function() {
      if (!EntityService) this.skip();
      
      const ant = service.spawn('Ant', { x: 100, y: 100, faction: 'player' });
      const building = service.spawn('Building', { x: 200, y: 200, buildingType: 'AntCone', faction: 'player' });
      const resource = service.spawn('Resource', { x: 300, y: 300, resourceType: 'greenLeaf' });
      
      service.update(16);
      
      expect(ant.update.calledOnce).to.be.true;
      expect(ant.update.firstCall.args[0]).to.equal(16);
      expect(building.update.calledOnce).to.be.true;
      expect(resource.update.calledOnce).to.be.true;
    });
    
    it('should skip inactive entities', function() {
      if (!EntityService) this.skip();
      
      const ant1 = service.spawn('Ant', { x: 100, y: 100, faction: 'player' });
      const ant2 = service.spawn('Ant', { x: 200, y: 200, faction: 'player' });
      
      // Mark ant2 as inactive
      ant2.isActive = false;
      
      service.update(16);
      
      // ant1 should be updated
      expect(ant1.update.calledOnce).to.be.true;
      expect(ant1.update.firstCall.args[0]).to.equal(16);
      
      // ant2 should NOT be updated (inactive)
      expect(ant2.update.called).to.be.false;
    });
    
    it('should handle entities added during update', function() {
      if (!EntityService) this.skip();
      
      let newEntityAdded = false;
      
      // Override spawnAnts to return entities with custom update logic
      mockAntFactory.spawnAnts = sinon.stub();
      mockAntFactory.spawnAnts
        .onFirstCall().returns([{
          _id: 0,
          type: 'Ant',
          faction: 'player',
          update: function() {
            if (!newEntityAdded) {
              service.spawn('Ant', { x: 300, y: 300, faction: 'player' });
              newEntityAdded = true;
            }
          },
          destroy: sinon.stub()
        }])
        .onSecondCall().returns([{
          _id: 1,
          type: 'Ant',
          faction: 'player',
          update: sinon.stub(),
          destroy: sinon.stub()
        }]);
      
      service.spawn('Ant', { x: 100, y: 100, faction: 'player' });
      
      expect(() => {
        service.update(16);
      }).to.not.throw();
      
      expect(service.getCount()).to.equal(2);
    });
    
    it('should handle entities removed during update', function() {
      if (!EntityService) this.skip();
      
      const ant1 = service.spawn('Ant', { x: 100, y: 100, faction: 'player' });
      const ant2 = service.spawn('Ant', { x: 200, y: 200, faction: 'player' });
      
      // ant1 destroys itself during update
      ant1.update = function() {
        service.destroy(ant1._id);
      };
      
      expect(() => {
        service.update(16);
      }).to.not.throw();
      
      expect(service.getCount()).to.equal(1);
    });
    
    it('should call update() on each entity controller', function() {
      if (!EntityService) this.skip();
      
      const entities = [];
      for (let i = 0; i < 10; i++) {
        entities.push(service.spawn('Ant', { x: i * 10, y: i * 10, faction: 'player' }));
      }
      
      service.update(16);
      
      entities.forEach((entity, index) => {
        expect(entity.update.calledOnce, `Entity ${index} update should be called`).to.be.true;
        expect(entity.update.firstCall.args[0]).to.equal(16);
      });
    });
  });
  
  // ========================================
  // Lifecycle Tests (5 tests)
  // ========================================
  
  describe('Lifecycle', function() {
    it('should destroy entity by ID', function() {
      if (!EntityService) this.skip();
      
      const ant = service.spawn('Ant', { x: 100, y: 100, faction: 'player' });
      const id = ant._id;
      
      const result = service.destroy(id);
      
      expect(result).to.be.true;
      expect(service.getById(id)).to.be.undefined;
    });
    
    it('should call destroy() on entity controller', function() {
      if (!EntityService) this.skip();
      
      const ant = service.spawn('Ant', { x: 100, y: 100, faction: 'player' });
      
      service.destroy(ant._id);
      
      expect(ant.destroy.calledOnce).to.be.true;
    });
    
    it('should remove from registry after destroy', function() {
      if (!EntityService) this.skip();
      
      const ant = service.spawn('Ant', { x: 100, y: 100, faction: 'player' });
      const building = service.spawn('Building', { x: 200, y: 200, buildingType: 'AntCone', faction: 'player' });
      
      service.destroy(ant._id);
      
      expect(service.getCount()).to.equal(1);
      expect(service.getAllEntities()).to.not.include(ant);
      expect(service.getAllEntities()).to.include(building);
    });
    
    it('should unregister from spatial grid on destroy', function() {
      if (!EntityService) this.skip();
      
      // Mock spatial grid
      const mockSpatialGrid = {
        addEntity: sinon.stub(),
        removeEntity: sinon.stub()
      };
      
      service.setSpatialGrid(mockSpatialGrid);
      
      const ant = service.spawn('Ant', { x: 100, y: 100, faction: 'player' });
      
      service.destroy(ant._id);
      
      expect(mockSpatialGrid.removeEntity.calledOnce).to.be.true;
      expect(mockSpatialGrid.removeEntity.firstCall.args[0]).to.equal(ant);
    });
    
    it('should handle destroying non-existent ID gracefully', function() {
      if (!EntityService) this.skip();
      
      const result = service.destroy(999);
      
      expect(result).to.be.false;
      expect(() => service.destroy(999)).to.not.throw();
    });
  });
});
