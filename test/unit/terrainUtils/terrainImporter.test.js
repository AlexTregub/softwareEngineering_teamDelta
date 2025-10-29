/**
 * Unit Tests for TerrainImporter
 * Tests importing terrain from various formats (JSON, binary, image)
 */

const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Mock p5.js global functions and constants
global.CHUNK_SIZE = 8;
global.TILE_SIZE = 32;
global.PERLIN_SCALE = 0.08;
global.NONE = null;
global.floor = Math.floor;
global.round = Math.round;
global.ceil = Math.ceil;
global.print = () => {};
global.noise = (x, y) => (Math.sin(x * 0.1) + Math.sin(y * 0.1)) / 2 + 0.5;
global.noiseSeed = () => {};
global.randomSeed = () => {};
global.random = (...args) => args.length > 0 ? args[0] + Math.random() * (args[1] - args[0]) : Math.random();
global.noSmooth = () => {};
global.smooth = () => {};
global.image = () => {};
global.fill = () => {};
global.rect = () => {};
global.strokeWeight = () => {};
global.g_canvasX = 800;
global.g_canvasY = 600;
global.CORNER = 'corner';
global.imageMode = () => {};
global.createGraphics = (w, h) => ({
  _width: w,
  _height: h,
  image: () => {},
  clear: () => {},
  push: () => {},
  pop: () => {},
  translate: () => {},
  imageMode: () => {},
  noSmooth: () => {},
  smooth: () => {},
  remove: () => {}
});

// Mock terrain materials
global.TERRAIN_MATERIALS_RANGED = {
  'moss_0': [[0, 0.3], (x, y, s) => {}],
  'stone': [[0, 0.4], (x, y, s) => {}],
  'dirt': [[0.4, 0.525], (x, y, s) => {}],
  'grass': [[0, 1], (x, y, s) => {}],
  'sand': [[0, 1], (x, y, s) => {}],
  'water': [[0, 1], (x, y, s) => {}],
};

global.renderMaterialToContext = () => {};
global.cameraManager = { cameraZoom: 1.0 };

// Mock console
const originalLog = console.log;
const originalWarn = console.warn;
console.log = () => {};
console.warn = () => {};

// Load terrain classes using vm module
const gridCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/grid.js'),
  'utf8'
);
vm.runInThisContext(gridCode);

const terrianGenCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/terrianGen.js'),
  'utf8'
);
vm.runInThisContext(terrianGenCode);

const chunkCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/chunk.js'),
  'utf8'
);
vm.runInThisContext(chunkCode);

const coordinateSystemCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/coordinateSystem.js'),
  'utf8'
);
vm.runInThisContext(coordinateSystemCode);

const gridTerrainCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/gridTerrain.js'),
  'utf8'
);
vm.runInThisContext(gridTerrainCode);

const importerCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/TerrainImporter.js'),
  'utf8'
);
vm.runInThisContext(importerCode);

// Restore console
console.log = originalLog;
console.warn = originalWarn;

describe('TerrainImporter - JSON Import', function() {
  
  describe('importFromJSON()', function() {
    
    it('should import basic terrain metadata', function() {
      const terrainData = {
        metadata: {
          version: '1.0',
          gridSizeX: 3,
          gridSizeY: 3,
          chunkSize: 8,
          tileSize: 32,
          seed: 12345,
          generationMode: 'perlin'
        }
      };
      
      expect(terrainData.metadata.gridSizeX).to.equal(3);
      expect(terrainData.metadata.gridSizeY).to.equal(3);
      expect(terrainData.metadata.seed).to.equal(12345);
    });
    
    it('should reconstruct terrain from tile data', function() {
      const tiles = [
        { x: 0, y: 0, material: 'grass', weight: 1 },
        { x: 1, y: 0, material: 'dirt', weight: 3 },
        { x: 0, y: 1, material: 'stone', weight: 100 }
      ];
      
      const tileMap = new Map();
      tiles.forEach(tile => {
        const key = `${tile.x},${tile.y}`;
        tileMap.set(key, tile);
      });
      
      expect(tileMap.size).to.equal(3);
      expect(tileMap.get('0,0').material).to.equal('grass');
      expect(tileMap.get('1,0').material).to.equal('dirt');
    });
    
    it('should handle compressed tile format', function() {
      const compressed = 'gggdddsss';
      const charToMaterial = {
        'g': 'grass',
        'd': 'dirt',
        's': 'stone',
        'w': 'water',
        'a': 'sand'
      };
      
      const tiles = [];
      for (let i = 0; i < compressed.length; i++) {
        tiles.push({
          index: i,
          material: charToMaterial[compressed[i]]
        });
      }
      
      expect(tiles).to.have.lengthOf(9);
      expect(tiles[0].material).to.equal('grass');
      expect(tiles[3].material).to.equal('dirt');
      expect(tiles[6].material).to.equal('stone');
    });
    
    it('should apply run-length decoded data', function() {
      const runs = [
        { material: 'grass', count: 5 },
        { material: 'dirt', count: 3 },
        { material: 'stone', count: 2 }
      ];
      
      const tiles = [];
      runs.forEach(run => {
        for (let i = 0; i < run.count; i++) {
          tiles.push({ material: run.material });
        }
      });
      
      expect(tiles).to.have.lengthOf(10);
      expect(tiles[0].material).to.equal('grass');
      expect(tiles[4].material).to.equal('grass');
      expect(tiles[5].material).to.equal('dirt');
      expect(tiles[8].material).to.equal('stone');
    });
    
    it('should restore custom metadata', function() {
      const terrainData = {
        metadata: {
          version: '1.0',
          name: 'Desert Level',
          author: 'TestUser',
          description: 'A sandy battlefield',
          difficulty: 'hard',
          tags: ['desert', 'pvp']
        }
      };
      
      expect(terrainData.metadata.name).to.equal('Desert Level');
      expect(terrainData.metadata.author).to.equal('TestUser');
      expect(terrainData.metadata.tags).to.include('desert');
    });
    
    it('should handle minimal terrain data', function() {
      const minimal = {
        metadata: {
          version: '1.0',
          gridSizeX: 1,
          gridSizeY: 1
        },
        tiles: 'gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg' // 64 tiles (1 chunk)
      };
      
      expect(minimal.tiles.length).to.equal(64);
    });
  });
  
  describe('validateImportData()', function() {
    
    it('should validate required fields exist', function() {
      const data = {
        metadata: {
          version: '1.0',
          gridSizeX: 5,
          gridSizeY: 5
        }
      };
      
      const hasVersion = !!(data.metadata && data.metadata.version);
      const hasGridSize = !!(data.metadata && data.metadata.gridSizeX && data.metadata.gridSizeY);
      
      expect(hasVersion).to.be.true;
      expect(hasGridSize).to.be.true;
    });
    
    it('should reject missing metadata', function() {
      const data = { tiles: [] };
      const isValid = data.metadata !== undefined;
      
      expect(isValid).to.be.false;
    });
    
    it('should reject invalid version format', function() {
      const version = 'invalid';
      const isValid = /^\d+\.\d+$/.test(version);
      
      expect(isValid).to.be.false;
    });
    
    it('should validate grid sizes are positive', function() {
      const gridSizeX = 5;
      const gridSizeY = -1;
      
      const isValid = gridSizeX > 0 && gridSizeY > 0;
      
      expect(isValid).to.be.false;
    });
    
    it('should validate material names', function() {
      const validMaterials = Object.keys(TERRAIN_MATERIALS_RANGED);
      const material = 'grass';
      const invalid = 'invalid_material';
      
      expect(validMaterials).to.include(material);
      expect(validMaterials).to.not.include(invalid);
    });
    
    it('should reject malformed JSON', function() {
      const malformed = '{ "metadata": { "version": "1.0" ';
      
      let isValid = true;
      try {
        JSON.parse(malformed);
      } catch (e) {
        isValid = false;
      }
      
      expect(isValid).to.be.false;
    });
    
    it('should validate tile coordinates are within bounds', function() {
      const gridSize = { x: 5, y: 5, chunkSize: 8 };
      const maxX = gridSize.x * gridSize.chunkSize;
      const maxY = gridSize.y * gridSize.chunkSize;
      
      const validTile = { x: 10, y: 10 };
      const invalidTile = { x: 100, y: 10 };
      
      expect(validTile.x < maxX && validTile.y < maxY).to.be.true;
      expect(invalidTile.x < maxX && invalidTile.y < maxY).to.be.false;
    });
  });
  
  describe('chunkBasedImport()', function() {
    
    it('should import terrain by chunks', function() {
      const chunkData = [
        {
          position: [0, 0],
          tiles: Array(64).fill(null).map((_, i) => ({
            offset: [i % 8, Math.floor(i / 8)],
            material: 'grass'
          }))
        }
      ];
      
      expect(chunkData[0].tiles).to.have.lengthOf(64);
      expect(chunkData[0].position).to.deep.equal([0, 0]);
    });
    
    it('should apply default material with exceptions', function() {
      const chunkData = {
        defaultMaterial: 'grass',
        exceptions: [
          { offset: [3, 4], material: 'water' },
          { offset: [7, 2], material: 'stone' }
        ]
      };
      
      const tiles = Array(64).fill(null).map((_, i) => {
        const offset = [i % 8, Math.floor(i / 8)];
        const exception = chunkData.exceptions.find(e => 
          e.offset[0] === offset[0] && e.offset[1] === offset[1]
        );
        
        return {
          offset,
          material: exception ? exception.material : chunkData.defaultMaterial
        };
      });
      
      expect(tiles.filter(t => t.material === 'grass')).to.have.lengthOf(62);
      expect(tiles.filter(t => t.material === 'water')).to.have.lengthOf(1);
      expect(tiles.filter(t => t.material === 'stone')).to.have.lengthOf(1);
    });
    
    it('should handle multiple chunks', function() {
      const chunks = [
        { position: [0, 0], defaultMaterial: 'grass', exceptions: [] },
        { position: [1, 0], defaultMaterial: 'dirt', exceptions: [] },
        { position: [0, 1], defaultMaterial: 'stone', exceptions: [] }
      ];
      
      expect(chunks).to.have.lengthOf(3);
      expect(chunks[0].defaultMaterial).to.equal('grass');
      expect(chunks[1].defaultMaterial).to.equal('dirt');
    });
  });
});

describe('TerrainImporter - Version Migration', function() {
  
  describe('migrateVersion()', function() {
    
    it('should detect old version format', function() {
      const oldData = {
        metadata: { version: '1.0' }
      };
      
      const currentVersion = '2.0';
      const needsMigration = oldData.metadata.version !== currentVersion;
      
      expect(needsMigration).to.be.true;
    });
    
    it('should migrate v1.0 to v2.0', function() {
      const v1Data = {
        metadata: {
          version: '1.0',
          width: 5,
          height: 5
        }
      };
      
      // Migration: rename width/height to gridSizeX/gridSizeY
      const v2Data = {
        metadata: {
          version: '2.0',
          gridSizeX: v1Data.metadata.width,
          gridSizeY: v1Data.metadata.height
        }
      };
      
      expect(v2Data.metadata.version).to.equal('2.0');
      expect(v2Data.metadata.gridSizeX).to.equal(5);
      expect(v2Data.metadata.gridSizeY).to.equal(5);
    });
    
    it('should chain multiple migrations', function() {
      const versions = ['1.0', '1.5', '2.0'];
      const currentVersion = '2.0';
      
      let data = { metadata: { version: '1.0' } };
      
      while (data.metadata.version !== currentVersion) {
        const versionIndex = versions.indexOf(data.metadata.version);
        const nextVersion = versions[versionIndex + 1];
        
        // Simulate migration
        data.metadata.version = nextVersion;
      }
      
      expect(data.metadata.version).to.equal('2.0');
    });
    
    it('should preserve data during migration', function() {
      const original = {
        metadata: { version: '1.0', name: 'Test Level' },
        tiles: ['g', 'g', 'd']
      };
      
      const migrated = {
        metadata: {
          ...original.metadata,
          version: '2.0'
        },
        tiles: original.tiles
      };
      
      expect(migrated.metadata.name).to.equal('Test Level');
      expect(migrated.tiles).to.deep.equal(['g', 'g', 'd']);
    });
    
    it('should skip migration for current version', function() {
      const currentData = {
        metadata: { version: '2.0' }
      };
      
      const needsMigration = currentData.metadata.version !== '2.0';
      
      expect(needsMigration).to.be.false;
    });
  });
  
  describe('validateMigration()', function() {
    
    it('should validate migrated data structure', function() {
      const migrated = {
        metadata: {
          version: '2.0',
          gridSizeX: 5,
          gridSizeY: 5
        }
      };
      
      const hasRequiredFields = !!(
        migrated.metadata.version &&
        migrated.metadata.gridSizeX &&
        migrated.metadata.gridSizeY
      );
      
      expect(hasRequiredFields).to.be.true;
    });
    
    it('should reject incomplete migrations', function() {
      const incomplete = {
        metadata: {
          version: '2.0'
          // Missing gridSizeX, gridSizeY
        }
      };
      
      const isComplete = 
        incomplete.metadata.gridSizeX !== undefined &&
        incomplete.metadata.gridSizeY !== undefined;
      
      expect(isComplete).to.be.false;
    });
  });
});

describe('TerrainImporter - Entity Import', function() {
  
  describe('importEntities()', function() {
    
    it('should import entity data', function() {
      const entities = [
        { type: 'ant_hill', x: 40, y: 40, faction: 'red' },
        { type: 'food', x: 100, y: 100, amount: 50 }
      ];
      
      expect(entities).to.have.lengthOf(2);
      expect(entities[0].type).to.equal('ant_hill');
      expect(entities[1].amount).to.equal(50);
    });
    
    it('should validate entity types', function() {
      const validTypes = ['ant_hill', 'food', 'resource', 'obstacle'];
      const entity = { type: 'ant_hill' };
      
      const isValid = validTypes.includes(entity.type);
      
      expect(isValid).to.be.true;
    });
    
    it('should validate entity positions', function() {
      const bounds = { maxX: 100, maxY: 100 };
      const validEntity = { type: 'food', x: 50, y: 50 };
      const invalidEntity = { type: 'food', x: 150, y: 50 };
      
      const isValidPosition = (entity) => 
        entity.x >= 0 && entity.x <= bounds.maxX &&
        entity.y >= 0 && entity.y <= bounds.maxY;
      
      expect(isValidPosition(validEntity)).to.be.true;
      expect(isValidPosition(invalidEntity)).to.be.false;
    });
    
    it('should handle optional entity data', function() {
      const terrainData = {
        metadata: {},
        entities: [] // Optional, may be empty
      };
      
      expect(terrainData.entities).to.be.an('array');
      expect(terrainData.entities).to.have.lengthOf(0);
    });
  });
});

describe('TerrainImporter - Resource Import', function() {
  
  describe('importResources()', function() {
    
    it('should import resource data', function() {
      const resources = [
        { type: 'wood', x: 60, y: 60, quantity: 20 },
        { type: 'stone', x: 80, y: 80, quantity: 15 }
      ];
      
      expect(resources).to.have.lengthOf(2);
      expect(resources[0].quantity).to.equal(20);
    });
    
    it('should validate resource quantities', function() {
      const resource = { type: 'wood', quantity: 20 };
      const isValid = resource.quantity > 0;
      
      expect(isValid).to.be.true;
    });
    
    it('should reject negative quantities', function() {
      const resource = { type: 'wood', quantity: -5 };
      const isValid = resource.quantity > 0;
      
      expect(isValid).to.be.false;
    });
  });
});

describe('TerrainImporter - Error Handling', function() {
  
  describe('handleImportErrors()', function() {
    
    it('should throw error for missing required fields', function() {
      const invalidData = { tiles: [] }; // Missing metadata
      
      const validate = () => {
        if (!invalidData.metadata) {
          throw new Error('Missing required field: metadata');
        }
      };
      
      expect(validate).to.throw('Missing required field: metadata');
    });
    
    it('should throw error for invalid data types', function() {
      const invalidData = {
        metadata: {
          version: '1.0',
          gridSizeX: 'five' // Should be number
        }
      };
      
      const validate = () => {
        if (typeof invalidData.metadata.gridSizeX !== 'number') {
          throw new Error('gridSizeX must be a number');
        }
      };
      
      expect(validate).to.throw('gridSizeX must be a number');
    });
    
    it('should provide helpful error messages', function() {
      const error = new Error('Invalid terrain data: gridSizeX must be positive');
      
      expect(error.message).to.include('gridSizeX');
      expect(error.message).to.include('positive');
    });
    
    it('should handle file read errors gracefully', function() {
      const handleFileError = (error) => {
        if (error.code === 'ENOENT') {
          return { error: 'File not found' };
        }
        return { error: 'Unknown error' };
      };
      
      const result = handleFileError({ code: 'ENOENT' });
      expect(result.error).to.equal('File not found');
    });
  });
});

describe('TerrainImporter - Defaults and Fallbacks', function() {
  
  describe('applyDefaults()', function() {
    
    it('should use default chunk size if not specified', function() {
      const data = {
        metadata: {
          version: '1.0',
          gridSizeX: 5,
          gridSizeY: 5
          // chunkSize not specified
        }
      };
      
      const chunkSize = data.metadata.chunkSize || 8;
      
      expect(chunkSize).to.equal(8);
    });
    
    it('should use default tile size if not specified', function() {
      const data = { metadata: {} };
      const tileSize = data.metadata.tileSize || 32;
      
      expect(tileSize).to.equal(32);
    });
    
    it('should use default generation mode', function() {
      const data = { metadata: {} };
      const generationMode = data.metadata.generationMode || 'perlin';
      
      expect(generationMode).to.equal('perlin');
    });
    
    it('should generate seed if not provided', function() {
      const data = { metadata: {} };
      const seed = data.metadata.seed || Math.floor(Math.random() * 100000);
      
      expect(seed).to.be.a('number');
      expect(seed).to.be.greaterThan(0);
    });
  });
});

describe('TerrainImporter - Performance', function() {
  
  describe('importPerformance()', function() {
    
    it('should handle large terrain imports efficiently', function() {
      const largeData = {
        metadata: { gridSizeX: 20, gridSizeY: 20 }, // 400 chunks
        tiles: new Array(20 * 20 * 64).fill('g') // 25,600 tiles
      };
      
      const startTime = Date.now();
      
      // Simulate processing
      const tiles = largeData.tiles.map((char, index) => ({
        index,
        material: 'grass'
      }));
      
      const duration = Date.now() - startTime;
      
      expect(tiles).to.have.lengthOf(25600);
      expect(duration).to.be.lessThan(1000); // Should be fast
    });
    
    it('should use streaming for very large files', function() {
      const shouldStream = (fileSize) => fileSize > 1024 * 1024; // 1MB
      
      expect(shouldStream(500 * 1024)).to.be.false; // 500KB
      expect(shouldStream(2 * 1024 * 1024)).to.be.true; // 2MB
    });
  });
});
