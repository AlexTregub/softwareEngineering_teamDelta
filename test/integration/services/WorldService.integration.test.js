/**
 * WorldService Integration Tests
 * 
 * Tests WorldService with REAL MapManager and SpatialGridManager instances
 * Verifies actual system integration (not mocks)
 * 
 * Test Strategy:
 * - Use real MapManager with loaded terrain
 * - Use real SpatialGridManager with registered entities
 * - Test world + entities interaction
 * - Test coordinate transformations
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupTestEnvironment, cleanupTestEnvironment, loadAllMVCStacks } = require('../../helpers/mvcTestHelpers');

// Setup environment with rendering and sprite support
setupTestEnvironment({ rendering: true, sprite: true });

describe('WorldService Integration Tests', function() {
  let WorldService;
  let MapManager;
  let SpatialGridManager;
  let worldService;
  let mapManager;
  let spatialGrid;
  
  before(function() {
    // Load WorldService
    WorldService = require('../../../Classes/services/WorldService');
    
    // Load dependencies first
    global.SpatialGrid = require('../../../Classes/systems/SpatialGrid');
    global.gridTerrain = require('../../../Classes/terrainUtils/gridTerrain');
    global.SparseTerrain = require('../../../Classes/terrainUtils/SparseTerrain');
    
    // Load MapManager and SpatialGridManager
    MapManager = require('../../../Classes/managers/MapManager');
    SpatialGridManager = require('../../../Classes/managers/SpatialGridManager');
    
    // Load MVC stacks for entity testing
    loadAllMVCStacks();
  });
  
  beforeEach(function() {
    // Create real manager instances
    mapManager = new MapManager();
    spatialGrid = new SpatialGridManager(64); // Cell size 64px
    
    // Create WorldService with real dependencies
    worldService = new WorldService(mapManager, spatialGrid);
  });
  
  afterEach(function() {
    cleanupTestEnvironment();
  });
  
  describe('Real MapManager Integration', function() {
    it('should load level data and query tiles', function() {
      // Create minimal level data (MapManager expects tiles array)
      const levelData = {
        tiles: [
          { x: 0, y: 0, material: 'grass' },
          { x: 1, y: 0, material: 'grass' },
          { x: 2, y: 0, material: 'water' },
          { x: 3, y: 0, material: 'water' },
          { x: 0, y: 1, material: 'grass' },
          { x: 1, y: 1, material: 'grass' },
          { x: 2, y: 1, material: 'water' },
          { x: 3, y: 1, material: 'water' }
        ],
        metadata: {
          tileSize: 32,
          defaultMaterial: 'dirt'
        }
      };
      
      // Load via WorldService
      const loaded = worldService.loadMap(levelData, 'test-level', true);
      expect(loaded).to.exist;
      
      // Query tiles
      const tile00 = worldService.getTileAt(0, 0);
      expect(tile00).to.exist;
      expect(tile00.material).to.equal('grass');
      
      const tile20 = worldService.getTileAt(2, 0);
      expect(tile20).to.exist;
      expect(tile20.material).to.equal('water');
    });
    
    it('should handle world position to tile conversion', function() {
      const levelData = {
        tiles: [
          { x: 0, y: 0, material: 'grass' },
          { x: 1, y: 1, material: 'sand' }
        ],
        metadata: { tileSize: 32 }
      };
      
      worldService.loadMap(levelData, 'pos-test', true);
      
      // Query by world position (pixels)
      const tile = worldService.getTileAtWorldPos(32, 32); // Should be grid (1, 1)
      expect(tile).to.exist;
      expect(tile.material).to.equal('sand');
    });
    
    it('should return null for out-of-bounds tiles', function() {
      const levelData = {
        tiles: [{ x: 0, y: 0, material: 'grass' }],
        metadata: { tileSize: 32 }
      };
      
      worldService.loadMap(levelData, 'bounds-test', true);
      
      const outOfBounds = worldService.getTileAt(99, 99);
      expect(outOfBounds).to.be.null;
    });
  });
  
  describe('Real SpatialGridManager Integration', function() {
    it('should register entities and query nearby', function() {
      // Create mock entities with positions
      const entity1 = { id: 1, position: { x: 100, y: 100 }, type: 'Ant' };
      const entity2 = { id: 2, position: { x: 110, y: 110 }, type: 'Ant' };
      const entity3 = { id: 3, position: { x: 500, y: 500 }, type: 'Resource' };
      
      // Register via WorldService
      worldService.addEntity(entity1);
      worldService.addEntity(entity2);
      worldService.addEntity(entity3);
      
      // Query nearby entities
      const nearby = worldService.getNearbyEntities(105, 105, 20);
      
      expect(nearby).to.be.an('array');
      expect(nearby.length).to.be.at.least(2); // Should find entity1 and entity2
      
      const ids = nearby.map(e => e.id);
      expect(ids).to.include(1);
      expect(ids).to.include(2);
      expect(ids).to.not.include(3); // Too far away
    });
    
    it('should find nearest entity', function() {
      const entity1 = { id: 1, position: { x: 100, y: 100 }, type: 'Resource' };
      const entity2 = { id: 2, position: { x: 200, y: 200 }, type: 'Resource' };
      
      worldService.addEntity(entity1);
      worldService.addEntity(entity2);
      
      // Find nearest to (110, 110) - should be entity1
      const nearest = worldService.findNearestEntity(110, 110);
      
      expect(nearest).to.exist;
      expect(nearest.id).to.equal(1);
    });
    
    it('should filter entities by type', function() {
      const ant = { id: 1, position: { x: 100, y: 100 }, type: 'Ant' };
      const resource = { id: 2, position: { x: 110, y: 110 }, type: 'Resource' };
      
      worldService.addEntity(ant);
      worldService.addEntity(resource);
      
      // Query only ants
      const ants = worldService.getEntitiesByType('Ant');
      expect(ants).to.have.lengthOf(1);
      expect(ants[0].id).to.equal(1);
      
      // Query only resources
      const resources = worldService.getEntitiesByType('Resource');
      expect(resources).to.have.lengthOf(1);
      expect(resources[0].id).to.equal(2);
    });
    
    it('should remove entities', function() {
      const entity = { id: 1, position: { x: 100, y: 100 }, type: 'Ant' };
      
      worldService.addEntity(entity);
      expect(worldService.getEntityCount()).to.equal(1);
      
      worldService.removeEntity(entity);
      expect(worldService.getEntityCount()).to.equal(0);
    });
  });
  
  describe('World + Entities Combined Queries', function() {
    beforeEach(function() {
      // Load terrain
      const levelData = {
        tiles: [
          { x: 0, y: 0, material: 'grass' },
          { x: 1, y: 0, material: 'grass' },
          { x: 2, y: 0, material: 'water' },
          { x: 0, y: 1, material: 'grass' },
          { x: 1, y: 1, material: 'grass' },
          { x: 2, y: 1, material: 'water' }
        ],
        metadata: { tileSize: 32 }
      };
      worldService.loadMap(levelData, 'combined-test', true);
    });
    
    it('should find entities on specific tile', function() {
      // Place entities on tile (1, 1) - center at (32, 32)
      const ant1 = { id: 1, position: { x: 32, y: 32 }, type: 'Ant' };
      const ant2 = { id: 2, position: { x: 35, y: 35 }, type: 'Ant' };
      const farEntity = { id: 3, position: { x: 200, y: 200 }, type: 'Resource' };
      
      worldService.addEntity(ant1);
      worldService.addEntity(ant2);
      worldService.addEntity(farEntity);
      
      // Query entities on tile (1, 1)
      const entitiesOnTile = worldService.getEntitiesOnTile(1, 1);
      
      expect(entitiesOnTile).to.be.an('array');
      expect(entitiesOnTile.length).to.equal(2); // Only ant1 and ant2
      
      const ids = entitiesOnTile.map(e => e.id);
      expect(ids).to.include(1);
      expect(ids).to.include(2);
      expect(ids).to.not.include(3);
    });
    
    it('should return empty array for empty tiles', function() {
      const entitiesOnTile = worldService.getEntitiesOnTile(0, 0);
      expect(entitiesOnTile).to.be.an('array').that.is.empty;
    });
    
    it('should get comprehensive tile info', function() {
      // Place entity on tile
      const entity = { id: 1, position: { x: 16, y: 16 }, type: 'Resource' };
      worldService.addEntity(entity);
      
      // Get tile info
      const info = worldService.getTileInfo(0, 0);
      
      expect(info).to.exist;
      expect(info).to.have.property('tile');
      expect(info.tile.material).to.equal('grass');
      expect(info).to.have.property('entities');
      expect(info.entities).to.have.lengthOf(1);
      expect(info).to.have.property('entityCount', 1);
    });
    
    it('should filter entities on tile by type', function() {
      // Place different entity types on same tile
      const ant = { id: 1, position: { x: 32, y: 32 }, type: 'Ant' };
      const resource = { id: 2, position: { x: 35, y: 35 }, type: 'Resource' };
      
      worldService.addEntity(ant);
      worldService.addEntity(resource);
      
      // Query only ants on tile
      const antsOnTile = worldService.getEntitiesOnTile(1, 1, { type: 'Ant' });
      expect(antsOnTile).to.have.lengthOf(1);
      expect(antsOnTile[0].id).to.equal(1);
      
      // Query only resources on tile
      const resourcesOnTile = worldService.getEntitiesOnTile(1, 1, { type: 'Resource' });
      expect(resourcesOnTile).to.have.lengthOf(1);
      expect(resourcesOnTile[0].id).to.equal(2);
    });
  });
  
  describe('Coordinate System Integration', function() {
    beforeEach(function() {
      const levelData = {
        tiles: [
          { x: 0, y: 0, material: 'grass' },
          { x: 1, y: 1, material: 'sand' }
        ],
        metadata: { tileSize: 32 }
      };
      worldService.loadMap(levelData, 'coords-test', true);
    });
    
    it('should correctly convert grid to world coordinates', function() {
      // Tile at grid (1, 1) should have world coords (32, 32)
      const tile = worldService.getTileAt(1, 1);
      expect(tile).to.exist;
      
      // Place entity at tile center
      const entity = { id: 1, position: { x: 32, y: 32 }, type: 'Ant' };
      worldService.addEntity(entity);
      
      // Query entities on that tile
      const entitiesOnTile = worldService.getEntitiesOnTile(1, 1);
      expect(entitiesOnTile).to.have.lengthOf(1);
    });
    
    it('should handle world position queries', function() {
      // Query by world position
      const tile = worldService.getTileAtWorldPos(48, 48); // Should be grid (1, 1)
      expect(tile).to.exist;
      expect(tile.material).to.equal('sand');
    });
  });
  
  describe('Performance with Multiple Entities', function() {
    it('should efficiently handle many entities', function() {
      const levelData = {
        tiles: [{ x: 0, y: 0, material: 'grass' }],
        metadata: { tileSize: 32 }
      };
      worldService.loadMap(levelData, 'perf-test', true);
      
      // Add 100 entities
      for (let i = 0; i < 100; i++) {
        const entity = {
          id: i,
          position: { x: Math.random() * 1000, y: Math.random() * 1000 },
          type: 'Ant'
        };
        worldService.addEntity(entity);
      }
      
      expect(worldService.getEntityCount()).to.equal(100);
      
      // Query should still be fast (spatial grid optimization)
      const nearby = worldService.getNearbyEntities(500, 500, 100);
      expect(nearby).to.be.an('array');
    });
  });
});
