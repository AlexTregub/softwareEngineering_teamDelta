/**
 * WorldService Unit Tests
 * 
 * Tests WorldService API (tile queries, spatial queries, combined queries)
 * Uses mock MapManager and SpatialGridManager for isolated testing
 * 
 * TDD Approach: Write tests FIRST (expect failures), then implement WorldService
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupTestEnvironment, cleanupTestEnvironment } = require('../../helpers/mvcTestHelpers');

// Setup test environment (JSDOM, p5.js, CollisionBox2D)
setupTestEnvironment();

describe('WorldService', function() {
  let WorldService;
  let mockMapManager;
  let mockSpatialGrid;
  
  before(function() {
    WorldService = require('../../../Classes/services/WorldService');
  });
  
  beforeEach(function() {
    // Create mock MapManager
    mockMapManager = {
      getTileAtGridCoords: sinon.stub(),
      getTileAtPosition: sinon.stub(),
      getTileMaterial: sinon.stub(),
      loadLevel: sinon.stub(),
      getActiveMap: sinon.stub(),
      setActiveMap: sinon.stub(),
      getMapIds: sinon.stub()
    };
    
    // Create mock SpatialGridManager
    mockSpatialGrid = {
      register: sinon.stub(),
      unregister: sinon.stub(),
      getNearbyEntities: sinon.stub(),
      getEntitiesInRect: sinon.stub(),
      findNearestEntity: sinon.stub(),
      getAllEntities: sinon.stub(),
      getEntitiesByType: sinon.stub(),
      getEntityCount: sinon.stub()
    };
  });
  
  afterEach(function() {
    cleanupTestEnvironment();
  });
  
  describe('Constructor', function() {
    it('should create WorldService with dependency injection', function() {
      const service = new WorldService(mockMapManager, mockSpatialGrid);
      
      expect(service).to.exist;
      expect(service._mapManager).to.equal(mockMapManager);
      expect(service._spatialGrid).to.equal(mockSpatialGrid);
    });
    
    it('should throw error if MapManager missing', function() {
      expect(() => new WorldService(null, mockSpatialGrid)).to.throw();
    });
    
    it('should throw error if SpatialGridManager missing', function() {
      expect(() => new WorldService(mockMapManager, null)).to.throw();
    });
  });
  
  describe('Tile API', function() {
    let service;
    
    beforeEach(function() {
      service = new WorldService(mockMapManager, mockSpatialGrid);
    });
    
    describe('getTileAt()', function() {
      it('should delegate to MapManager.getTileAtGridCoords()', function() {
        const mockTile = { x: 5, y: 10, type: 0 };
        mockMapManager.getTileAtGridCoords.returns(mockTile);
        
        const result = service.getTileAt(5, 10);
        
        expect(mockMapManager.getTileAtGridCoords.calledOnce).to.be.true;
        expect(mockMapManager.getTileAtGridCoords.firstCall.args).to.deep.equal([5, 10]);
        expect(result).to.equal(mockTile);
      });
      
      it('should return null for out-of-bounds coordinates', function() {
        mockMapManager.getTileAtGridCoords.returns(null);
        
        const result = service.getTileAt(-1, -1);
        
        expect(result).to.be.null;
      });
      
      it('should return null for undefined tiles', function() {
        mockMapManager.getTileAtGridCoords.returns(undefined);
        
        const result = service.getTileAt(999, 999);
        
        expect(result).to.be.null;
      });
    });
    
    describe('getTileAtWorldPos()', function() {
      it('should delegate to MapManager.getTileAtPosition()', function() {
        const mockTile = { x: 5, y: 10, type: 0 };
        mockMapManager.getTileAtPosition.returns(mockTile);
        
        const result = service.getTileAtWorldPos(160, 320);
        
        expect(mockMapManager.getTileAtPosition.calledOnce).to.be.true;
        expect(mockMapManager.getTileAtPosition.firstCall.args).to.deep.equal([160, 320]);
        expect(result).to.equal(mockTile);
      });
    });
    
    describe('getTileMaterial()', function() {
      it('should delegate to MapManager.getTileMaterial()', function() {
        mockMapManager.getTileMaterial.returns('grass');
        
        const result = service.getTileMaterial(160, 320);
        
        expect(mockMapManager.getTileMaterial.calledOnce).to.be.true;
        expect(mockMapManager.getTileMaterial.firstCall.args).to.deep.equal([160, 320]);
        expect(result).to.equal('grass');
      });
      
      it('should return null for tiles without material', function() {
        mockMapManager.getTileMaterial.returns(null);
        
        const result = service.getTileMaterial(0, 0);
        
        expect(result).to.be.null;
      });
    });
    
    describe('loadMap()', function() {
      it('should delegate to MapManager.loadLevel()', function() {
        const levelData = { terrain: [[0, 1]], entities: [] };
        mockMapManager.loadLevel.returns(true);
        
        const result = service.loadMap(levelData, 'test-map', true);
        
        expect(mockMapManager.loadLevel.calledOnce).to.be.true;
        expect(mockMapManager.loadLevel.firstCall.args).to.deep.equal([levelData, 'test-map', true]);
        expect(result).to.be.true;
      });
      
      it('should default setActive to false', function() {
        const levelData = { terrain: [[0, 1]], entities: [] };
        
        service.loadMap(levelData, 'test-map');
        
        expect(mockMapManager.loadLevel.firstCall.args[2]).to.be.false;
      });
    });
    
    describe('getActiveMap()', function() {
      it('should delegate to MapManager.getActiveMap()', function() {
        const mockMap = { id: 'test-map', terrain: [[0, 1]] };
        mockMapManager.getActiveMap.returns(mockMap);
        
        const result = service.getActiveMap();
        
        expect(mockMapManager.getActiveMap.calledOnce).to.be.true;
        expect(result).to.equal(mockMap);
      });
    });
    
    describe('setActiveMap()', function() {
      it('should delegate to MapManager.setActiveMap()', function() {
        mockMapManager.setActiveMap.returns(true);
        
        const result = service.setActiveMap('map-001');
        
        expect(mockMapManager.setActiveMap.calledOnce).to.be.true;
        expect(mockMapManager.setActiveMap.firstCall.args).to.deep.equal(['map-001']);
        expect(result).to.be.true;
      });
    });
  });
  
  describe('Spatial API', function() {
    let service;
    
    beforeEach(function() {
      service = new WorldService(mockMapManager, mockSpatialGrid);
    });
    
    describe('getNearbyEntities()', function() {
      it('should delegate to SpatialGridManager.getNearbyEntities()', function() {
        const mockEntities = [{ id: 1 }, { id: 2 }];
        mockSpatialGrid.getNearbyEntities.returns(mockEntities);
        
        const result = service.getNearbyEntities(100, 200, 50);
        
        expect(mockSpatialGrid.getNearbyEntities.calledOnce).to.be.true;
        expect(mockSpatialGrid.getNearbyEntities.firstCall.args[0]).to.equal(100);
        expect(mockSpatialGrid.getNearbyEntities.firstCall.args[1]).to.equal(200);
        expect(mockSpatialGrid.getNearbyEntities.firstCall.args[2]).to.equal(50);
        expect(result).to.equal(mockEntities);
      });
      
      it('should pass options to SpatialGridManager', function() {
        const options = { type: 'Ant', faction: 'player' };
        mockSpatialGrid.getNearbyEntities.returns([]);
        
        service.getNearbyEntities(100, 200, 50, options);
        
        expect(mockSpatialGrid.getNearbyEntities.firstCall.args[3]).to.deep.equal(options);
      });
      
      it('should return empty array when no entities nearby', function() {
        mockSpatialGrid.getNearbyEntities.returns([]);
        
        const result = service.getNearbyEntities(100, 200, 50);
        
        expect(result).to.be.an('array').that.is.empty;
      });
    });
    
    describe('getEntitiesInRect()', function() {
      it('should delegate to SpatialGridManager.getEntitiesInRect()', function() {
        const mockEntities = [{ id: 1 }, { id: 2 }, { id: 3 }];
        mockSpatialGrid.getEntitiesInRect.returns(mockEntities);
        
        const result = service.getEntitiesInRect(0, 0, 100, 100);
        
        expect(mockSpatialGrid.getEntitiesInRect.calledOnce).to.be.true;
        expect(mockSpatialGrid.getEntitiesInRect.firstCall.args).to.deep.equal([0, 0, 100, 100, {}]);
        expect(result).to.equal(mockEntities);
      });
      
      it('should pass options to SpatialGridManager', function() {
        const options = { type: 'Building' };
        mockSpatialGrid.getEntitiesInRect.returns([]);
        
        service.getEntitiesInRect(0, 0, 100, 100, options);
        
        expect(mockSpatialGrid.getEntitiesInRect.firstCall.args[4]).to.deep.equal(options);
      });
    });
    
    describe('findNearestEntity()', function() {
      it('should delegate to SpatialGridManager.findNearestEntity()', function() {
        const mockEntity = { id: 1, position: { x: 105, y: 205 } };
        mockSpatialGrid.findNearestEntity.returns(mockEntity);
        
        const result = service.findNearestEntity(100, 200, 100);
        
        expect(mockSpatialGrid.findNearestEntity.calledOnce).to.be.true;
        expect(mockSpatialGrid.findNearestEntity.firstCall.args).to.deep.equal([100, 200, 100, {}]);
        expect(result).to.equal(mockEntity);
      });
      
      it('should return null when no entity found', function() {
        mockSpatialGrid.findNearestEntity.returns(null);
        
        const result = service.findNearestEntity(100, 200, 50);
        
        expect(result).to.be.null;
      });
    });
    
    describe('addEntity()', function() {
      it('should delegate to SpatialGridManager.register()', function() {
        const mockEntity = { id: 1, position: { x: 100, y: 200 } };
        
        service.addEntity(mockEntity);
        
        expect(mockSpatialGrid.register.calledOnce).to.be.true;
        expect(mockSpatialGrid.register.firstCall.args).to.deep.equal([mockEntity]);
      });
      
      it('should throw error if entity is null', function() {
        expect(() => service.addEntity(null)).to.throw();
      });
      
      it('should throw error if entity has no position', function() {
        expect(() => service.addEntity({ id: 1 })).to.throw();
      });
    });
    
    describe('removeEntity()', function() {
      it('should delegate to SpatialGridManager.unregister()', function() {
        const mockEntity = { id: 1, position: { x: 100, y: 200 } };
        
        service.removeEntity(mockEntity);
        
        expect(mockSpatialGrid.unregister.calledOnce).to.be.true;
        expect(mockSpatialGrid.unregister.firstCall.args).to.deep.equal([mockEntity]);
      });
      
      it('should not throw error if entity not registered', function() {
        mockSpatialGrid.unregister.returns(false);
        
        expect(() => service.removeEntity({ id: 999 })).to.not.throw();
      });
    });
    
    describe('getAllEntities()', function() {
      it('should delegate to SpatialGridManager.getAllEntities()', function() {
        const mockEntities = [{ id: 1 }, { id: 2 }, { id: 3 }];
        mockSpatialGrid.getAllEntities.returns(mockEntities);
        
        const result = service.getAllEntities();
        
        expect(mockSpatialGrid.getAllEntities.calledOnce).to.be.true;
        expect(result).to.equal(mockEntities);
      });
    });
    
    describe('getEntitiesByType()', function() {
      it('should delegate to SpatialGridManager.getEntitiesByType()', function() {
        const mockAnts = [{ id: 1, type: 'Ant' }, { id: 2, type: 'Ant' }];
        mockSpatialGrid.getEntitiesByType.returns(mockAnts);
        
        const result = service.getEntitiesByType('Ant');
        
        expect(mockSpatialGrid.getEntitiesByType.calledOnce).to.be.true;
        expect(mockSpatialGrid.getEntitiesByType.firstCall.args).to.deep.equal(['Ant']);
        expect(result).to.equal(mockAnts);
      });
    });
    
    describe('getEntityCount()', function() {
      it('should delegate to SpatialGridManager.getEntityCount()', function() {
        mockSpatialGrid.getEntityCount.returns(42);
        
        const result = service.getEntityCount();
        
        expect(mockSpatialGrid.getEntityCount.calledOnce).to.be.true;
        expect(result).to.equal(42);
      });
    });
  });
  
  describe('Combined Queries (NEW - World + Entities)', function() {
    let service;
    
    beforeEach(function() {
      service = new WorldService(mockMapManager, mockSpatialGrid);
    });
    
    describe('getEntitiesOnTile()', function() {
      it('should return entities on specified tile', function() {
        // Mock tile at grid coords (5, 10)
        const mockTile = { 
          x: 5, 
          y: 10, 
          worldX: 160,  // 5 * 32
          worldY: 320,  // 10 * 32
          type: 0 
        };
        mockMapManager.getTileAtGridCoords.returns(mockTile);
        
        // Mock entities near tile center
        const mockEntities = [
          { id: 1, position: { x: 165, y: 325 } },
          { id: 2, position: { x: 175, y: 335 } }
        ];
        mockSpatialGrid.getNearbyEntities.returns(mockEntities);
        
        const result = service.getEntitiesOnTile(5, 10);
        
        // Should query tile
        expect(mockMapManager.getTileAtGridCoords.calledOnce).to.be.true;
        expect(mockMapManager.getTileAtGridCoords.firstCall.args).to.deep.equal([5, 10]);
        
        // Should query entities near tile center (within TILE_SIZE/2)
        expect(mockSpatialGrid.getNearbyEntities.calledOnce).to.be.true;
        expect(mockSpatialGrid.getNearbyEntities.firstCall.args[0]).to.equal(160);
        expect(mockSpatialGrid.getNearbyEntities.firstCall.args[1]).to.equal(320);
        expect(mockSpatialGrid.getNearbyEntities.firstCall.args[2]).to.equal(16); // TILE_SIZE/2 = 32/2
        
        expect(result).to.equal(mockEntities);
      });
      
      it('should return empty array if tile does not exist', function() {
        mockMapManager.getTileAtGridCoords.returns(null);
        
        const result = service.getEntitiesOnTile(999, 999);
        
        expect(result).to.be.an('array').that.is.empty;
        expect(mockSpatialGrid.getNearbyEntities.called).to.be.false;
      });
      
      it('should return empty array if no entities on tile', function() {
        const mockTile = { x: 5, y: 10, worldX: 160, worldY: 320, type: 0 };
        mockMapManager.getTileAtGridCoords.returns(mockTile);
        mockSpatialGrid.getNearbyEntities.returns([]);
        
        const result = service.getEntitiesOnTile(5, 10);
        
        expect(result).to.be.an('array').that.is.empty;
      });
      
      it('should filter by entity type if provided', function() {
        const mockTile = { x: 5, y: 10, worldX: 160, worldY: 320, type: 0 };
        mockMapManager.getTileAtGridCoords.returns(mockTile);
        mockSpatialGrid.getNearbyEntities.returns([{ id: 1, type: 'Ant' }]);
        
        service.getEntitiesOnTile(5, 10, { type: 'Ant' });
        
        expect(mockSpatialGrid.getNearbyEntities.firstCall.args[3]).to.deep.equal({ type: 'Ant' });
      });
    });
    
    describe('getTileInfo()', function() {
      it('should return combined tile + entity data', function() {
        const mockTile = { x: 5, y: 10, worldX: 160, worldY: 320, type: 0, material: 'grass' };
        mockMapManager.getTileAtGridCoords.returns(mockTile);
        
        const mockEntities = [{ id: 1 }, { id: 2 }];
        mockSpatialGrid.getNearbyEntities.returns(mockEntities);
        
        const result = service.getTileInfo(5, 10);
        
        expect(result).to.have.property('tile');
        expect(result.tile).to.equal(mockTile);
        expect(result).to.have.property('entities');
        expect(result.entities).to.equal(mockEntities);
        expect(result).to.have.property('entityCount', 2);
      });
      
      it('should return null if tile does not exist', function() {
        mockMapManager.getTileAtGridCoords.returns(null);
        
        const result = service.getTileInfo(999, 999);
        
        expect(result).to.be.null;
      });
    });
  });
  
  describe('Edge Cases', function() {
    let service;
    
    beforeEach(function() {
      service = new WorldService(mockMapManager, mockSpatialGrid);
    });
    
    it('should handle negative coordinates', function() {
      mockMapManager.getTileAtGridCoords.returns(null);
      
      const result = service.getTileAt(-5, -10);
      
      expect(result).to.be.null;
    });
    
    it('should handle very large coordinates', function() {
      mockMapManager.getTileAtGridCoords.returns(null);
      
      const result = service.getTileAt(99999, 99999);
      
      expect(result).to.be.null;
    });
    
    it('should handle zero radius spatial queries', function() {
      mockSpatialGrid.getNearbyEntities.returns([]);
      
      const result = service.getNearbyEntities(100, 200, 0);
      
      expect(result).to.be.an('array').that.is.empty;
    });
    
    it('should handle negative radius spatial queries', function() {
      expect(() => service.getNearbyEntities(100, 200, -10)).to.throw();
    });
  });
});
