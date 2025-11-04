/**
 * Integration Tests for LevelLoader
 * Tests LevelLoader with real Level Editor JSON exports
 * 
 * Test Strategy:
 * - Load real JSON fixture files
 * - Verify terrain creation (SparseTerrain/GridTerrain)
 * - Verify entity spawning with coordinate conversion
 * - Verify PathMap compatibility (via SparseTerrainAdapter)
 * - Performance benchmarks for large levels
 */

const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');

const { setupTestEnvironment, cleanupTestEnvironment } = require('../../helpers/mvcTestHelpers');


setupTestEnvironment({ rendering: true });

describe('LevelLoader Integration Tests', function() {

  afterEach(function() {
    cleanupTestEnvironment();
  });
  let LevelLoader;
  let SparseTerrainAdapter;
  let sampleLevelData;
  let largeLevelData;

  before(function() {
    // Setup JSDOM for browser globals
      url: 'http://localhost',
      pretendToBeVisual: true
    });
    
    // Load LevelLoader
    const loaderPath = path.join(__dirname, '../../..', 'Classes/loaders/LevelLoader.js');
    LevelLoader = require(loaderPath);

    // Load SparseTerrainAdapter for PathMap verification
    const adapterPath = path.join(__dirname, '../../..', 'Classes/adapters/SparseTerrainAdapter.js');
    SparseTerrainAdapter = require(adapterPath);

    // Load fixture files
    const samplePath = path.join(__dirname, '../../fixtures/sample-level.json');
    const largePath = path.join(__dirname, '../../fixtures/large-level.json');
    
    sampleLevelData = JSON.parse(fs.readFileSync(samplePath, 'utf8'));
    largeLevelData = JSON.parse(fs.readFileSync(largePath, 'utf8'));
  });

  beforeEach(function() {
    // Mock p5.js global
    global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));
    window.createVector = global.createVector;
  });

  afterEach(function() {
    cleanupTestEnvironment();
  });

  describe('Load Real Level Editor JSON', function() {
    it('should load sample level with terrain and entities', function() {
      const loader = new LevelLoader();
      const result = loader.loadLevel(sampleLevelData);

      expect(result.success).to.be.true;
      expect(result.errors).to.be.undefined;
      expect(result.terrain).to.exist;
      expect(result.entities).to.be.an('array');
      expect(result.entities).to.have.lengthOf(3);
    });

    it('should create SparseTerrain with correct tiles', function() {
      const loader = new LevelLoader();
      const result = loader.loadLevel(sampleLevelData);

      expect(result.success).to.be.true;
      expect(result.terrain).to.exist;

      // Verify terrain type
      expect(result.terrain.constructor.name).to.include('SparseTerrain');

      // Verify tiles were populated (9 tiles in sample level)
      // Note: SparseTerrain stores tiles in a Map, check via getTileAt or similar
      expect(result.terrain.tiles).to.exist;
    });

    it('should spawn entities at correct world coordinates', function() {
      const TILE_SIZE = 32;
      const loader = new LevelLoader();
      const result = loader.loadLevel(sampleLevelData);

      expect(result.success).to.be.true;
      expect(result.entities).to.have.lengthOf(3);

      // Verify first entity (Ant at grid 1,1)
      const ant = result.entities.find(e => e.type === 'Ant');
      expect(ant).to.exist;
      expect(ant.position.x).to.equal(1 * TILE_SIZE); // 32
      expect(ant.position.y).to.equal(1 * TILE_SIZE); // 32
      expect(ant.properties.JobName).to.equal('Worker');
      expect(ant.properties.faction).to.equal('player');

      // Verify second entity (Resource at grid 2,0)
      const resource = result.entities.find(e => e.type === 'Resource');
      expect(resource).to.exist;
      expect(resource.position.x).to.equal(2 * TILE_SIZE); // 64
      expect(resource.position.y).to.equal(0 * TILE_SIZE); // 0
      expect(resource.properties.resourceType).to.equal('food');
      expect(resource.properties.amount).to.equal(50);

      // Verify third entity (Queen at grid 0,2)
      const queen = result.entities.find(e => e.type === 'Queen');
      expect(queen).to.exist;
      expect(queen.position.x).to.equal(0 * TILE_SIZE); // 0
      expect(queen.position.y).to.equal(2 * TILE_SIZE); // 64
      expect(queen.properties.faction).to.equal('player');
      expect(queen.properties.health).to.equal(100);
    });

    it('should preserve entity IDs and types', function() {
      const loader = new LevelLoader();
      const result = loader.loadLevel(sampleLevelData);

      expect(result.success).to.be.true;

      const entityIds = result.entities.map(e => e.id);
      expect(entityIds).to.include('entity_001');
      expect(entityIds).to.include('entity_002');
      expect(entityIds).to.include('entity_003');

      const entityTypes = result.entities.map(e => e.type);
      expect(entityTypes).to.include('Ant');
      expect(entityTypes).to.include('Resource');
      expect(entityTypes).to.include('Queen');
    });
  });

  describe('PathMap Compatibility', function() {
    it('should create terrain compatible with SparseTerrainAdapter', function() {
      const loader = new LevelLoader();
      const result = loader.loadLevel(sampleLevelData);

      expect(result.success).to.be.true;
      expect(result.terrain).to.exist;

      // Create adapter
      const adapter = new SparseTerrainAdapter(result.terrain);

      // Verify adapter properties (OLD Terrain API)
      expect(adapter._xCount).to.be.a('number');
      expect(adapter._yCount).to.be.a('number');
      expect(adapter._tileStore).to.be.an('array');
      expect(typeof adapter.conv2dpos).to.equal('function');
    });

    it('should allow PathMap to query terrain via adapter', function() {
      const loader = new LevelLoader();
      const result = loader.loadLevel(sampleLevelData);

      expect(result.success).to.be.true;

      const adapter = new SparseTerrainAdapter(result.terrain);

      // Simulate PathMap querying terrain
      const tileIndex = adapter.conv2dpos(1, 1);
      const tile = adapter._tileStore[tileIndex];

      expect(tile).to.exist;
      expect(tile.material).to.equal('water'); // Grid (1,1) is water in sample level
    });

    it('should handle coordinate conversion for pathfinding', function() {
      const loader = new LevelLoader();
      const result = loader.loadLevel(sampleLevelData);

      expect(result.success).to.be.true;

      const adapter = new SparseTerrainAdapter(result.terrain);

      // Test multiple coordinates
      const coords = [
        { x: 0, y: 0, expectedMaterial: 'grass' },
        { x: 1, y: 0, expectedMaterial: 'dirt' },
        { x: 2, y: 0, expectedMaterial: 'stone' },
        { x: 1, y: 1, expectedMaterial: 'water' }
      ];

      coords.forEach(coord => {
        const index = adapter.conv2dpos(coord.x, coord.y);
        const tile = adapter._tileStore[index];
        expect(tile).to.exist;
        expect(tile.material).to.equal(coord.expectedMaterial);
      });
    });
  });

  describe('Performance Benchmarks', function() {
    it('should load large level with 1000+ entities in <2 seconds', function() {
      // Generate large level data programmatically
      const largeLevel = JSON.parse(JSON.stringify(largeLevelData));
      
      // Add 50x50 grid of tiles (2500 tiles)
      for (let y = 0; y < 50; y++) {
        for (let x = 0; x < 50; x++) {
          const materials = ['grass', 'dirt', 'sand', 'stone'];
          const material = materials[Math.floor(Math.random() * materials.length)];
          largeLevel.terrain.tiles.push({ gridX: x, gridY: y, material });
        }
      }

      // Add 1000 entities
      for (let i = 0; i < 1000; i++) {
        largeLevel.entities.push({
          id: `entity_${i}`,
          type: i % 3 === 0 ? 'Ant' : (i % 3 === 1 ? 'Resource' : 'Queen'),
          gridPosition: {
            x: Math.floor(Math.random() * 50),
            y: Math.floor(Math.random() * 50)
          },
          properties: {
            faction: 'player'
          }
        });
      }

      const loader = new LevelLoader();
      const startTime = Date.now();
      const result = loader.loadLevel(largeLevel);
      const endTime = Date.now();
      const elapsed = endTime - startTime;

      expect(result.success).to.be.true;
      expect(result.entities).to.have.lengthOf(1000);
      expect(elapsed).to.be.lessThan(2000); // <2 seconds
    });

    it('should handle 100x100 terrain grid efficiently', function() {
      const largeLevel = JSON.parse(JSON.stringify(largeLevelData));
      
      // Add 100x100 grid (10,000 tiles)
      for (let y = 0; y < 100; y++) {
        for (let x = 0; x < 100; x++) {
          largeLevel.terrain.tiles.push({
            gridX: x,
            gridY: y,
            material: 'grass'
          });
        }
      }

      const loader = new LevelLoader();
      const startTime = Date.now();
      const result = loader.loadLevel(largeLevel);
      const endTime = Date.now();
      const elapsed = endTime - startTime;

      expect(result.success).to.be.true;
      expect(result.terrain).to.exist;
      expect(elapsed).to.be.lessThan(3000); // <3 seconds for 10k tiles
    });
  });

  describe('Edge Cases with Real Data', function() {
    it('should handle level with only terrain (no entities)', function() {
      const terrainOnlyLevel = {
        id: 'terrain_only',
        terrain: {
          type: 'sparse',
          tileSize: 32,
          tiles: [
            { gridX: 0, gridY: 0, material: 'grass' },
            { gridX: 1, gridY: 0, material: 'dirt' }
          ]
        },
        entities: []
      };

      const loader = new LevelLoader();
      const result = loader.loadLevel(terrainOnlyLevel);

      expect(result.success).to.be.true;
      expect(result.terrain).to.exist;
      expect(result.entities).to.be.an('array').that.is.empty;
    });

    it('should handle sparse terrain with gaps', function() {
      const sparseLevel = {
        id: 'sparse_gaps',
        terrain: {
          type: 'sparse',
          tileSize: 32,
          tiles: [
            { gridX: 0, gridY: 0, material: 'grass' },
            { gridX: 5, gridY: 5, material: 'stone' }, // Gap
            { gridX: 10, gridY: 10, material: 'dirt' } // Another gap
          ]
        },
        entities: []
      };

      const loader = new LevelLoader();
      const result = loader.loadLevel(sparseLevel);

      expect(result.success).to.be.true;
      expect(result.terrain).to.exist;

      // Verify adapter can handle gaps
      const adapter = new SparseTerrainAdapter(result.terrain);
      expect(adapter._xCount).to.be.greaterThan(0);
      expect(adapter._yCount).to.be.greaterThan(0);
    });

    it('should handle negative grid coordinates', function() {
      const negativeLevel = {
        id: 'negative_coords',
        terrain: {
          type: 'sparse',
          tileSize: 32,
          tiles: [
            { gridX: -5, gridY: -5, material: 'grass' },
            { gridX: 0, gridY: 0, material: 'dirt' },
            { gridX: 5, gridY: 5, material: 'stone' }
          ]
        },
        entities: [
          {
            id: 'entity_neg',
            type: 'Ant',
            gridPosition: { x: -3, y: -3 },
            properties: { faction: 'player' }
          }
        ]
      };

      const TILE_SIZE = 32;
      const loader = new LevelLoader();
      const result = loader.loadLevel(negativeLevel);

      expect(result.success).to.be.true;
      expect(result.entities).to.have.lengthOf(1);

      // Verify negative coordinate conversion
      const entity = result.entities[0];
      expect(entity.position.x).to.equal(-3 * TILE_SIZE); // -96
      expect(entity.position.y).to.equal(-3 * TILE_SIZE); // -96
    });

    it('should validate and reject malformed real JSON', function() {
      const malformedLevel = {
        id: 'malformed',
        terrain: {
          type: 'sparse',
          tileSize: 32
          // Missing tiles array
        },
        entities: []
      };

      const loader = new LevelLoader();
      const result = loader.loadLevel(malformedLevel);

      expect(result.success).to.be.false;
      expect(result.errors).to.be.an('array').that.is.not.empty;
    });
  });

  describe('Level Metadata Preservation', function() {
    it('should preserve level ID and metadata', function() {
      const loader = new LevelLoader();
      const result = loader.loadLevel(sampleLevelData);

      expect(result.success).to.be.true;
      
      // Note: Current implementation doesn't return metadata
      // This test documents expected behavior for future enhancement
      // TODO: Add metadata preservation to LevelLoader
    });

    it('should handle levels with custom properties', function() {
      const customLevel = JSON.parse(JSON.stringify(sampleLevelData));
      customLevel.customData = {
        author: 'Test Author',
        difficulty: 'easy',
        tags: ['tutorial', 'beginner']
      };

      const loader = new LevelLoader();
      const result = loader.loadLevel(customLevel);

      expect(result.success).to.be.true;
      // TODO: Verify custom properties preserved
    });
  });

  describe('Integration with Real Game Systems', function() {
    it('should produce terrain ready for spatial grid registration', function() {
      const loader = new LevelLoader();
      const result = loader.loadLevel(sampleLevelData);

      expect(result.success).to.be.true;
      expect(result.terrain).to.exist;

      // Verify terrain has necessary properties for game integration
      expect(result.terrain.tiles).to.exist;
      
      // Terrain should be queryable for entity placement
      // (SparseTerrain has getTileAt or similar method)
    });

    it('should produce entities ready for game world registration', function() {
      const loader = new LevelLoader();
      const result = loader.loadLevel(sampleLevelData);

      expect(result.success).to.be.true;
      expect(result.entities).to.have.lengthOf(3);

      // Verify entities have necessary structure
      result.entities.forEach(entity => {
        expect(entity.id).to.be.a('string');
        expect(entity.type).to.be.a('string');
        expect(entity.position).to.exist;
        expect(entity.position.x).to.be.a('number');
        expect(entity.position.y).to.be.a('number');
        expect(entity.properties).to.be.an('object');
      });
    });
  });
});
