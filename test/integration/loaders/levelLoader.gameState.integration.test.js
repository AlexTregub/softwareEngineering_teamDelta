/**
 * Integration Tests: LevelLoader + Game State
 * 
 * Tests the integration between LevelLoader and game systems:
 * - CameraManager (queen tracking)
 * - SpatialGridManager (entity registration)
 * - Game initialization workflow
 * - Performance benchmarks
 * 
 * TDD Phase: Red (tests first, implementation follows)
 */

const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');
const fs = require('fs');

// Load the classes
const LevelLoader = require('../../../Classes/loaders/LevelLoader');

describe('LevelLoader + Game State Integration', function() {
  let loader;
  let mockCameraManager;
  let mockSpatialGrid;
  let sampleLevelData;

  beforeEach(function() {
    // Load sample level JSON
    const samplePath = path.join(__dirname, '../../fixtures/sample-level.json');
    sampleLevelData = JSON.parse(fs.readFileSync(samplePath, 'utf-8'));

    // Mock CameraManager
    mockCameraManager = {
      followEntity: sinon.stub(),
      setPosition: sinon.stub(),
      getPosition: sinon.stub().returns({ x: 0, y: 0 }),
      getZoom: sinon.stub().returns(1.0)
    };

    // Mock SpatialGridManager
    mockSpatialGrid = {
      registerEntity: sinon.stub(),
      unregisterEntity: sinon.stub(),
      clear: sinon.stub(),
      getNearbyEntities: sinon.stub().returns([]),
      updateEntityPosition: sinon.stub()
    };

    // Create loader
    loader = new LevelLoader();
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('Game Initialization Integration', function() {
    it('should load level and return game-ready data structure', function() {
      const result = loader.loadLevel(sampleLevelData);

      expect(result).to.be.an('object');
      expect(result.terrain).to.exist;
      expect(result.entities).to.be.an('array');
      expect(result.metadata).to.exist;
    });

    it('should provide terrain instance compatible with game systems', function() {
      const result = loader.loadLevel(sampleLevelData);
      const terrain = result.terrain;

      // Terrain should have game-compatible API (SparseTerrain uses getTile, not getTileAtGridCoords)
      expect(terrain).to.respondTo('getTile');
      expect(terrain).to.have.property('tiles').that.is.a('map');
    });

    it('should provide entities array with correct world coordinates', function() {
      const result = loader.loadLevel(sampleLevelData);
      const entities = result.entities;

      expect(entities).to.be.an('array').with.length.at.least(1);
      
      entities.forEach(entity => {
        expect(entity).to.have.property('x').that.is.a('number');
        expect(entity).to.have.property('y').that.is.a('number');
        expect(entity).to.have.property('type').that.is.a('string');
        expect(entity).to.have.property('id').that.is.a('string');
        
        // World coordinates should be multiples of TILE_SIZE (32)
        expect(entity.x % 32).to.equal(0, 'Entity x should be aligned to grid');
        expect(entity.y % 32).to.equal(0, 'Entity y should be aligned to grid');
      });
    });

    it('should complete full level load in under 3 seconds for typical level', function() {
      this.timeout(5000);
      
      const start = Date.now();
      const result = loader.loadLevel(sampleLevelData);
      const elapsed = Date.now() - start;

      expect(elapsed).to.be.below(3000, 'Level loading should be fast enough for game startup');
      expect(result.entities).to.be.an('array');
      expect(result.terrain).to.exist;
    });
  });

  describe('CameraManager Integration', function() {
    it('should provide queen entity for camera tracking', function() {
      const result = loader.loadLevel(sampleLevelData);
      const entities = result.entities;

      // Find queen in entities
      const queen = entities.find(e => e.type === 'Queen');
      
      expect(queen).to.exist;
      expect(queen).to.have.property('x');
      expect(queen).to.have.property('y');
      expect(queen.type).to.equal('Queen');
    });

    it('should return null if no queen exists in level', function() {
      // Create level without queen
      const noQueenLevel = {
        id: 'test-no-queen',
        terrain: sampleLevelData.terrain,
        entities: [
          { id: 'ant1', type: 'Ant', gridPosition: { x: 5, y: 5 }, properties: {} }
        ]
      };

      const result = loader.loadLevel(noQueenLevel);
      const queen = result.entities.find(e => e.type === 'Queen');

      expect(queen).to.be.undefined;
    });

    it('should handle multiple queens by returning first found', function() {
      // Create level with multiple queens
      const multiQueenLevel = {
        id: 'test-multi-queen',
        terrain: sampleLevelData.terrain,
        entities: [
          { id: 'queen1', type: 'Queen', gridPosition: { x: 5, y: 5 }, properties: {} },
          { id: 'queen2', type: 'Queen', gridPosition: { x: 10, y: 10 }, properties: {} }
        ]
      };

      const result = loader.loadLevel(multiQueenLevel);
      const queens = result.entities.filter(e => e.type === 'Queen');

      expect(queens).to.have.length(2);
      expect(queens[0].id).to.equal('queen1'); // First one returned
    });
  });

  describe('SpatialGridManager Integration', function() {
    it('should provide entities in format compatible with SpatialGrid registration', function() {
      const result = loader.loadLevel(sampleLevelData);
      const entities = result.entities;

      entities.forEach(entity => {
        // SpatialGrid expects x, y, type properties
        expect(entity).to.have.property('x').that.is.a('number');
        expect(entity).to.have.property('y').that.is.a('number');
        expect(entity).to.have.property('type').that.is.a('string');
        expect(entity).to.have.property('id').that.is.a('string');
      });
    });

    it('should allow registering all entities with SpatialGrid', function() {
      const result = loader.loadLevel(sampleLevelData);
      const entities = result.entities;

      // Simulate registration
      entities.forEach(entity => {
        mockSpatialGrid.registerEntity(entity);
      });

      expect(mockSpatialGrid.registerEntity.callCount).to.equal(entities.length);
    });

    it('should provide entities with unique IDs for grid tracking', function() {
      const result = loader.loadLevel(sampleLevelData);
      const entities = result.entities;

      const ids = new Set();
      entities.forEach(entity => {
        expect(entity.id).to.be.a('string');
        expect(ids.has(entity.id)).to.be.false;
        ids.add(entity.id);
      });

      expect(ids.size).to.equal(entities.length);
    });
  });

  describe('Game Startup Workflow', function() {
    it('should provide all data needed for game initialization', function() {
      const result = loader.loadLevel(sampleLevelData);

      // Check all required game systems have data
      expect(result).to.have.property('terrain');
      expect(result).to.have.property('entities').that.is.an('array');
      expect(result).to.have.property('metadata').that.is.an('object');

      // Metadata should include level info
      expect(result.metadata).to.have.property('id');
    });

    it('should handle empty level gracefully', function() {
      const emptyLevel = {
        id: 'empty-level',
        terrain: {
          tiles: []
        },
        entities: []
      };

      const result = loader.loadLevel(emptyLevel);

      expect(result.terrain).to.exist;
      expect(result.entities).to.be.an('array').with.length(0);
      expect(result.metadata.id).to.equal('empty-level');
    });

    it('should maintain entity properties through loading pipeline', function() {
      const customLevel = {
        id: 'test-properties',
        terrain: sampleLevelData.terrain,
        entities: [
          { 
            id: 'ant1', 
            type: 'Ant', 
            gridPosition: { x: 5, y: 5 }, 
            properties: { 
              JobName: 'Gatherer',
              faction: 'player',
              health: 100
            }
          }
        ]
      };

      const result = loader.loadLevel(customLevel);
      const ant = result.entities[0];

      expect(ant.properties).to.exist;
      expect(ant.properties.JobName).to.equal('Gatherer');
      expect(ant.properties.faction).to.equal('player');
      expect(ant.properties.health).to.equal(100);
    });
  });

  describe('Performance Benchmarks', function() {
    it('should load large level with 100+ entities in under 3 seconds', function() {
      this.timeout(5000);

      // Create large level
      const largeLevel = {
        id: 'large-performance-test',
        terrain: {
          tiles: []
        },
        entities: []
      };

      // Add 50x50 terrain (2500 tiles)
      for (let x = 0; x < 50; x++) {
        for (let y = 0; y < 50; y++) {
          largeLevel.terrain.tiles.push({
            gridX: x,
            gridY: y,
            material: 'GRASS'
          });
        }
      }

      // Add 200 entities
      for (let i = 0; i < 200; i++) {
        largeLevel.entities.push({
          id: `entity_${i}`,
          type: i === 0 ? 'Queen' : 'Ant',
          gridPosition: { x: i % 50, y: Math.floor(i / 50) },
          properties: { JobName: 'Worker' }
        });
      }

      const start = Date.now();
      const result = loader.loadLevel(largeLevel);
      const elapsed = Date.now() - start;

      expect(elapsed).to.be.below(3000);
      expect(result.entities).to.have.length(200);
      expect(result.terrain.tiles.size).to.equal(2500);
    });

    it('should handle level with 1000+ entities efficiently', function() {
      this.timeout(10000);

      const massiveLevel = {
        id: 'massive-performance-test',
        terrain: {
          tiles: []
        },
        entities: []
      };

      // Minimal terrain
      for (let i = 0; i < 100; i++) {
        massiveLevel.terrain.tiles.push({
          gridX: i % 10,
          gridY: Math.floor(i / 10),
          material: 'GRASS'
        });
      }

      // Add 1500 entities
      for (let i = 0; i < 1500; i++) {
        massiveLevel.entities.push({
          id: `entity_${i}`,
          type: i === 0 ? 'Queen' : 'Ant',
          gridPosition: { x: i % 100, y: Math.floor(i / 100) },
          properties: {}
        });
      }

      const start = Date.now();
      const result = loader.loadLevel(massiveLevel);
      const elapsed = Date.now() - start;

      expect(elapsed).to.be.below(5000, 'Should handle 1500 entities in under 5 seconds');
      expect(result.entities).to.have.length(1500);
    });
  });

  describe('Error Handling in Game Context', function() {
    it('should throw meaningful error for invalid level during game startup', function() {
      const invalidLevel = {
        id: 'invalid',
        terrain: null, // Invalid
        entities: []
      };

      const result = loader.loadLevel(invalidLevel);
      expect(result.success).to.be.false;
      expect(result.errors).to.be.an('array').with.length.above(0);
    });

    it('should provide error context for debugging', function() {
      const badLevel = {
        id: 'bad-entity',
        terrain: { tiles: [] },
        entities: [
          { id: 'bad', type: 'InvalidType', gridPosition: { x: 0, y: 0 } }
        ]
      };

      try {
        loader.loadLevel(badLevel);
      } catch (error) {
        expect(error.message).to.be.a('string');
        expect(error.message.length).to.be.above(0);
      }
    });
  });
});
