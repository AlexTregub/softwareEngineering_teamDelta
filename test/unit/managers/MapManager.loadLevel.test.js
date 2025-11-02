/**
 * MapManager.loadLevel() Unit Tests
 * ==================================
 * Test loading custom levels into MapManager
 * 
 * TDD Workflow: RED phase - tests written FIRST
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Mock global functions
global.logNormal = sinon.stub();
global.logWarning = sinon.stub();
global.logError = sinon.stub();
global.console = { log: sinon.stub(), warn: sinon.stub(), error: sinon.stub() };
global.window = global;

// Load classes
const MapManager = require('../../../Classes/managers/MapManager');
const SparseTerrain = require('../../../Classes/terrainUtils/SparseTerrain');

describe('MapManager.loadLevel()', function() {
  let mapManager;
  
  beforeEach(function() {
    // Fresh instance for each test
    mapManager = new MapManager();
    
    // Reset stubs
    sinon.reset();
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  // --- Basic Functionality ---
  
  describe('Basic Functionality', function() {
    it('should exist as a method', function() {
      expect(mapManager.loadLevel).to.be.a('function');
    });
    
    it('should load valid level data and return terrain', function() {
      const levelData = {
        metadata: {
          tileSize: 32,
          defaultMaterial: 'dirt'
        },
        tiles: [
          { x: 0, y: 0, material: 'grass' },
          { x: 1, y: 0, material: 'dirt' }
        ]
      };
      
      const result = mapManager.loadLevel(levelData, 'test-level', false);
      
      expect(result).to.not.be.null;
      expect(result).to.have.property('getTile');
    });
    
    it('should register map with provided ID', function() {
      const levelData = {
        metadata: { tileSize: 32, defaultMaterial: 'dirt' },
        tiles: [{ x: 0, y: 0, material: 'grass' }]
      };
      
      mapManager.loadLevel(levelData, 'test-map', false);
      
      expect(mapManager.hasMap('test-map')).to.be.true;
    });
    
    it('should set as active map when setActive=true', function() {
      const levelData = {
        metadata: { tileSize: 32, defaultMaterial: 'dirt' },
        tiles: [{ x: 0, y: 0, material: 'grass' }]
      };
      
      mapManager.loadLevel(levelData, 'active-map', true);
      
      expect(mapManager.getActiveMapId()).to.equal('active-map');
    });
    
    it('should not set as active when setActive=false', function() {
      const levelData = {
        metadata: { tileSize: 32, defaultMaterial: 'dirt' },
        tiles: [{ x: 0, y: 0, material: 'grass' }]
      };
      
      mapManager.loadLevel(levelData, 'inactive-map', false);
      
      expect(mapManager.getActiveMapId()).to.be.null;
    });
  });
  
  // --- Terrain Creation ---
  
  describe('Terrain Creation', function() {
    it('should create SparseTerrain from level tiles', function() {
      const levelData = {
        metadata: {
          tileSize: 32,
          defaultMaterial: 'dirt',
          bounds: { minX: 0, maxX: 10, minY: 0, maxY: 10 }
        },
        tiles: [
          { x: 5, y: 5, material: 'stone' }
        ]
      };
      
      const terrain = mapManager.loadLevel(levelData, 'terrain-test', false);
      
      expect(terrain).to.not.be.null;
      expect(terrain.getTile).to.be.a('function');
    });
    
    it('should apply tiles to terrain at correct positions', function() {
      const levelData = {
        metadata: { tileSize: 32, defaultMaterial: 'dirt' },
        tiles: [
          { x: 0, y: 0, material: 'grass' },
          { x: 1, y: 1, material: 'stone' }
        ]
      };
      
      const terrain = mapManager.loadLevel(levelData, 'tile-test', false);
      const tile1 = terrain.getTile(0, 0);
      const tile2 = terrain.getTile(1, 1);
      
      expect(tile1).to.exist;
      expect(tile1.material).to.equal('grass');
      expect(tile2).to.exist;
      expect(tile2.material).to.equal('stone');
    });
    
    it('should use default material from metadata', function() {
      const levelData = {
        metadata: {
          tileSize: 32,
          defaultMaterial: 'sand',
          bounds: { minX: 0, maxX: 10, minY: 0, maxY: 10 }
        },
        tiles: [{ x: 0, y: 0, material: 'grass' }]
      };
      
      const terrain = mapManager.loadLevel(levelData, 'default-test', false);
      
      // SparseTerrain should have default material set
      expect(terrain.defaultMaterial).to.equal('sand');
    });
    
    it('should handle level with many tiles (performance)', function() {
      const tiles = [];
      for (let x = 0; x < 100; x++) {
        for (let y = 0; y < 100; y++) {
          tiles.push({ x, y, material: 'grass' });
        }
      }
      
      const levelData = {
        metadata: { tileSize: 32, defaultMaterial: 'dirt' },
        tiles: tiles
      };
      
      const start = Date.now();
      const terrain = mapManager.loadLevel(levelData, 'large-test', false);
      const elapsed = Date.now() - start;
      
      expect(terrain).to.not.be.null;
      expect(elapsed).to.be.lessThan(5000); // < 5 seconds for 10k tiles
    });
  });
  
  // --- Validation & Error Handling ---
  
  describe('Validation & Error Handling', function() {
    it('should reject null levelData', function() {
      const result = mapManager.loadLevel(null, 'null-test', false);
      expect(result).to.be.null;
    });
    
    it('should reject undefined levelData', function() {
      const result = mapManager.loadLevel(undefined, 'undef-test', false);
      expect(result).to.be.null;
    });
    
    it('should reject levelData without tiles array', function() {
      const levelData = {
        metadata: { tileSize: 32, defaultMaterial: 'dirt' }
        // Missing tiles
      };
      
      const result = mapManager.loadLevel(levelData, 'no-tiles', false);
      expect(result).to.be.null;
    });
    
    it('should reject invalid mapId (null)', function() {
      const levelData = {
        metadata: { tileSize: 32, defaultMaterial: 'dirt' },
        tiles: []
      };
      
      const result = mapManager.loadLevel(levelData, null, false);
      expect(result).to.be.null;
    });
    
    it('should reject invalid mapId (empty string)', function() {
      const levelData = {
        metadata: { tileSize: 32, defaultMaterial: 'dirt' },
        tiles: []
      };
      
      const result = mapManager.loadLevel(levelData, '', false);
      expect(result).to.be.null;
    });
    
    it('should handle levelData without metadata gracefully', function() {
      const levelData = {
        tiles: [{ x: 0, y: 0, material: 'grass' }]
      };
      
      // Should use defaults
      const result = mapManager.loadLevel(levelData, 'no-meta', false);
      expect(result).to.not.be.null;
    });
    
    it('should handle empty tiles array', function() {
      const levelData = {
        metadata: { tileSize: 32, defaultMaterial: 'dirt' },
        tiles: []
      };
      
      const result = mapManager.loadLevel(levelData, 'empty-tiles', false);
      expect(result).to.not.be.null;
    });
  });
  
  // --- Integration with Existing Methods ---
  
  describe('Integration with Existing Methods', function() {
    it('should integrate with registerMap', function() {
      const levelData = {
        metadata: { tileSize: 32, defaultMaterial: 'dirt' },
        tiles: [{ x: 0, y: 0, material: 'grass' }]
      };
      
      mapManager.loadLevel(levelData, 'integration-test', false);
      
      const map = mapManager.getMap('integration-test');
      expect(map).to.not.be.null;
    });
    
    it('should integrate with setActiveMap', function() {
      const levelData = {
        metadata: { tileSize: 32, defaultMaterial: 'dirt' },
        tiles: [{ x: 0, y: 0, material: 'grass' }]
      };
      
      mapManager.loadLevel(levelData, 'active-test', true);
      
      const activeMap = mapManager.getActiveMap();
      expect(activeMap).to.not.be.null;
    });
    
    it('should allow switching between loaded levels', function() {
      const level1 = {
        metadata: { tileSize: 32, defaultMaterial: 'dirt' },
        tiles: [{ x: 0, y: 0, material: 'grass' }]
      };
      const level2 = {
        metadata: { tileSize: 32, defaultMaterial: 'sand' },
        tiles: [{ x: 0, y: 0, material: 'stone' }]
      };
      
      mapManager.loadLevel(level1, 'level1', true);
      mapManager.loadLevel(level2, 'level2', false);
      
      expect(mapManager.getActiveMapId()).to.equal('level1');
      
      mapManager.setActiveMap('level2');
      expect(mapManager.getActiveMapId()).to.equal('level2');
    });
  });
  
  // --- Return Values ---
  
  describe('Return Values', function() {
    it('should return SparseTerrain instance on success', function() {
      const levelData = {
        metadata: { tileSize: 32, defaultMaterial: 'dirt' },
        tiles: [{ x: 0, y: 0, material: 'grass' }]
      };
      
      const result = mapManager.loadLevel(levelData, 'return-test', false);
      
      expect(result).to.be.an('object');
      expect(result.getTile).to.be.a('function');
    });
    
    it('should return null on validation failure', function() {
      const result = mapManager.loadLevel(null, 'fail-test', false);
      expect(result).to.be.null;
    });
  });
});
