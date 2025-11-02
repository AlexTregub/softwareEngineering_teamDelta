/**
 * LevelLoader.test.js
 * Unit tests for LevelLoader - Custom Level Loading System
 * Part of Custom Level Loading - Phase 2.1
 * 
 * PURPOSE: Parse level JSON and instantiate game world (terrain + entities)
 * 
 * TESTS:
 * - loadLevel() with valid JSON
 * - Invalid JSON handling (missing fields, malformed)
 * - Terrain loading from level.terrain
 * - Entity spawning from level.entities[]
 * - Coordinate conversion (grid → world)
 * - Empty level edge cases
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('LevelLoader', function() {
  let LevelLoader;
  let sandbox;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Mock TILE_SIZE constant
    global.TILE_SIZE = 32;
    
    // Load LevelLoader (will fail until implemented)
    try {
      LevelLoader = require('../../../Classes/loaders/LevelLoader');
    } catch (e) {
      LevelLoader = null;
    }
  });
  
  afterEach(function() {
    sandbox.restore();
  });
  
  describe('Constructor', function() {
    it('should create LevelLoader instance', function() {
      if (!LevelLoader) this.skip();
      
      const loader = new LevelLoader();
      
      expect(loader).to.exist;
    });
    
    it('should accept optional terrain factory', function() {
      if (!LevelLoader) this.skip();
      
      const terrainFactory = sandbox.stub();
      const loader = new LevelLoader({ terrainFactory });
      
      expect(loader).to.exist;
    });
    
    it('should accept optional entity factory', function() {
      if (!LevelLoader) this.skip();
      
      const entityFactory = sandbox.stub();
      const loader = new LevelLoader({ entityFactory });
      
      expect(loader).to.exist;
    });
  });
  
  describe('loadLevel() - Valid JSON', function() {
    it('should load level from valid JSON', function() {
      if (!LevelLoader) this.skip();
      
      const levelData = {
        id: 'test_level_001',
        terrain: {
          type: 'sparse',
          tiles: [
            { x: 0, y: 0, material: 'grass' },
            { x: 1, y: 0, material: 'stone' }
          ]
        },
        entities: [
          { id: 'ant_001', type: 'Ant', gridPosition: { x: 5, y: 5 } }
        ]
      };
      
      const loader = new LevelLoader();
      const result = loader.loadLevel(levelData);
      
      expect(result).to.exist;
      expect(result.success).to.be.true;
    });
    
    it('should return loaded terrain', function() {
      if (!LevelLoader) this.skip();
      
      const levelData = {
        id: 'test_level_001',
        terrain: {
          type: 'sparse',
          tiles: []
        },
        entities: []
      };
      
      const loader = new LevelLoader();
      const result = loader.loadLevel(levelData);
      
      expect(result.terrain).to.exist;
    });
    
    it('should return loaded entities', function() {
      if (!LevelLoader) this.skip();
      
      const levelData = {
        id: 'test_level_001',
        terrain: { type: 'sparse', tiles: [] },
        entities: [
          { id: 'ant_001', type: 'Ant', gridPosition: { x: 5, y: 5 } },
          { id: 'ant_002', type: 'Ant', gridPosition: { x: 6, y: 6 } }
        ]
      };
      
      const loader = new LevelLoader();
      const result = loader.loadLevel(levelData);
      
      expect(result.entities).to.be.an('array');
      expect(result.entities.length).to.equal(2);
    });
  });
  
  describe('loadLevel() - Invalid JSON', function() {
    it('should reject null level data', function() {
      if (!LevelLoader) this.skip();
      
      const loader = new LevelLoader();
      const result = loader.loadLevel(null);
      
      expect(result.success).to.be.false;
      expect(result.errors).to.include('Level data is null or undefined');
    });
    
    it('should reject missing terrain field', function() {
      if (!LevelLoader) this.skip();
      
      const levelData = {
        id: 'test_level_001',
        entities: []
      };
      
      const loader = new LevelLoader();
      const result = loader.loadLevel(levelData);
      
      expect(result.success).to.be.false;
      expect(result.errors).to.include('Missing required field: terrain');
    });
    
    it('should reject missing entities field', function() {
      if (!LevelLoader) this.skip();
      
      const levelData = {
        id: 'test_level_001',
        terrain: { type: 'sparse', tiles: [] }
      };
      
      const loader = new LevelLoader();
      const result = loader.loadLevel(levelData);
      
      expect(result.success).to.be.false;
      expect(result.errors).to.include('Missing required field: entities');
    });
    
    it('should reject malformed terrain data', function() {
      if (!LevelLoader) this.skip();
      
      const levelData = {
        id: 'test_level_001',
        terrain: 'invalid', // Should be object
        entities: []
      };
      
      const loader = new LevelLoader();
      const result = loader.loadLevel(levelData);
      
      expect(result.success).to.be.false;
      expect(result.errors).to.include('Terrain must be an object');
    });
    
    it('should reject malformed entities data', function() {
      if (!LevelLoader) this.skip();
      
      const levelData = {
        id: 'test_level_001',
        terrain: { type: 'sparse', tiles: [] },
        entities: 'invalid' // Should be array
      };
      
      const loader = new LevelLoader();
      const result = loader.loadLevel(levelData);
      
      expect(result.success).to.be.false;
      expect(result.errors).to.include('Entities must be an array');
    });
    
    it('should accumulate multiple errors', function() {
      if (!LevelLoader) this.skip();
      
      const levelData = {
        // Missing id, terrain, entities
      };
      
      const loader = new LevelLoader();
      const result = loader.loadLevel(levelData);
      
      expect(result.success).to.be.false;
      expect(result.errors.length).to.be.at.least(2);
    });
  });
  
  describe('_loadTerrain() - Terrain Loading', function() {
    it('should load sparse terrain type', function() {
      if (!LevelLoader) this.skip();
      
      const terrainData = {
        type: 'sparse',
        tiles: [
          { x: 0, y: 0, material: 'grass' }
        ]
      };
      
      const loader = new LevelLoader();
      const terrain = loader._loadTerrain(terrainData);
      
      expect(terrain).to.exist;
    });
    
    it('should load grid terrain type', function() {
      if (!LevelLoader) this.skip();
      
      const terrainData = {
        type: 'grid',
        width: 3,
        height: 3,
        seed: 12345
      };
      
      const loader = new LevelLoader();
      const terrain = loader._loadTerrain(terrainData);
      
      expect(terrain).to.exist;
    });
    
    it('should call custom terrain factory if provided', function() {
      if (!LevelLoader) this.skip();
      
      const mockTerrain = { type: 'mock' };
      const terrainFactory = sandbox.stub().returns(mockTerrain);
      const loader = new LevelLoader({ terrainFactory });
      
      const terrainData = { type: 'sparse', tiles: [] };
      const terrain = loader._loadTerrain(terrainData);
      
      expect(terrainFactory.calledOnce).to.be.true;
      expect(terrain).to.equal(mockTerrain);
    });
    
    it('should populate sparse terrain with tiles', function() {
      if (!LevelLoader) this.skip();
      
      const terrainData = {
        type: 'sparse',
        tiles: [
          { x: 0, y: 0, material: 'grass' },
          { x: 1, y: 0, material: 'stone' },
          { x: 2, y: 0, material: 'water' }
        ]
      };
      
      const loader = new LevelLoader();
      const terrain = loader._loadTerrain(terrainData);
      
      // Verify tiles were added
      expect(terrain.tiles).to.exist;
    });
  });
  
  describe('_spawnEntities() - Entity Spawning', function() {
    it('should spawn entities from array', function() {
      if (!LevelLoader) this.skip();
      
      const entitiesData = [
        { id: 'ant_001', type: 'Ant', gridPosition: { x: 5, y: 5 } },
        { id: 'ant_002', type: 'Ant', gridPosition: { x: 6, y: 6 } }
      ];
      
      const loader = new LevelLoader();
      const entities = loader._spawnEntities(entitiesData);
      
      expect(entities).to.be.an('array');
      expect(entities.length).to.equal(2);
    });
    
    it('should convert grid coordinates to world coordinates', function() {
      if (!LevelLoader) this.skip();
      
      const entitiesData = [
        { id: 'ant_001', type: 'Ant', gridPosition: { x: 5, y: 10 } }
      ];
      
      const loader = new LevelLoader();
      const entities = loader._spawnEntities(entitiesData);
      
      // Grid (5, 10) → World (5*32=160, 10*32=320)
      expect(entities[0].position.x).to.equal(160);
      expect(entities[0].position.y).to.equal(320);
    });
    
    it('should call custom entity factory if provided', function() {
      if (!LevelLoader) this.skip();
      
      const mockEntity = { id: 'mock', type: 'Mock' };
      const entityFactory = sandbox.stub().returns(mockEntity);
      const loader = new LevelLoader({ entityFactory });
      
      const entitiesData = [
        { id: 'ant_001', type: 'Ant', gridPosition: { x: 5, y: 5 } }
      ];
      
      const entities = loader._spawnEntities(entitiesData);
      
      expect(entityFactory.calledOnce).to.be.true;
      expect(entities[0]).to.equal(mockEntity);
    });
    
    it('should skip entities with invalid type', function() {
      if (!LevelLoader) this.skip();
      
      const entitiesData = [
        { id: 'valid', type: 'Ant', gridPosition: { x: 5, y: 5 } },
        { id: 'invalid', type: 'InvalidType', gridPosition: { x: 6, y: 6 } }
      ];
      
      const loader = new LevelLoader();
      const entities = loader._spawnEntities(entitiesData);
      
      // Should only spawn valid entity
      expect(entities.length).to.equal(1);
      expect(entities[0].id).to.equal('valid');
    });
    
    it('should preserve entity properties', function() {
      if (!LevelLoader) this.skip();
      
      const entitiesData = [
        {
          id: 'ant_001',
          type: 'Ant',
          gridPosition: { x: 5, y: 5 },
          properties: {
            JobName: 'Worker',
            faction: 'player'
          }
        }
      ];
      
      const loader = new LevelLoader();
      const entities = loader._spawnEntities(entitiesData);
      
      expect(entities[0].properties).to.deep.equal({
        JobName: 'Worker',
        faction: 'player'
      });
    });
  });
  
  describe('Coordinate Conversion', function() {
    it('should convert grid coordinates to world pixel coordinates', function() {
      if (!LevelLoader) this.skip();
      
      const loader = new LevelLoader();
      const world = loader.gridToWorld(5, 10);
      
      expect(world.x).to.equal(160); // 5 * 32
      expect(world.y).to.equal(320); // 10 * 32
    });
    
    it('should handle negative grid coordinates', function() {
      if (!LevelLoader) this.skip();
      
      const loader = new LevelLoader();
      const world = loader.gridToWorld(-5, -10);
      
      expect(world.x).to.equal(-160); // -5 * 32
      expect(world.y).to.equal(-320); // -10 * 32
    });
    
    it('should handle zero coordinates', function() {
      if (!LevelLoader) this.skip();
      
      const loader = new LevelLoader();
      const world = loader.gridToWorld(0, 0);
      
      expect(world.x).to.equal(0);
      expect(world.y).to.equal(0);
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle empty level', function() {
      if (!LevelLoader) this.skip();
      
      const levelData = {
        id: 'empty_level',
        terrain: { type: 'sparse', tiles: [] },
        entities: []
      };
      
      const loader = new LevelLoader();
      const result = loader.loadLevel(levelData);
      
      expect(result.success).to.be.true;
      expect(result.entities.length).to.equal(0);
    });
    
    it('should handle level with only terrain', function() {
      if (!LevelLoader) this.skip();
      
      const levelData = {
        id: 'terrain_only',
        terrain: {
          type: 'sparse',
          tiles: [{ x: 0, y: 0, material: 'grass' }]
        },
        entities: []
      };
      
      const loader = new LevelLoader();
      const result = loader.loadLevel(levelData);
      
      expect(result.success).to.be.true;
      expect(result.terrain).to.exist;
    });
    
    it('should handle large entity count', function() {
      if (!LevelLoader) this.skip();
      
      // Create 1000 entities
      const entities = [];
      for (let i = 0; i < 1000; i++) {
        entities.push({
          id: `ant_${i}`,
          type: 'Ant',
          gridPosition: { x: i % 100, y: Math.floor(i / 100) }
        });
      }
      
      const levelData = {
        id: 'large_level',
        terrain: { type: 'sparse', tiles: [] },
        entities
      };
      
      const loader = new LevelLoader();
      
      const start = Date.now();
      const result = loader.loadLevel(levelData);
      const elapsed = Date.now() - start;
      
      expect(result.success).to.be.true;
      expect(result.entities.length).to.equal(1000);
      expect(elapsed).to.be.below(2000); // <2 seconds target
    });
  });
});
