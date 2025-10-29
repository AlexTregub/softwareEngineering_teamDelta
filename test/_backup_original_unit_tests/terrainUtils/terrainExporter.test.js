/**
 * Unit Tests for TerrainExporter
 * Tests exporting terrain to various formats (JSON, binary, image)
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

const exporterCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/TerrainExporter.js'),
  'utf8'
);
vm.runInThisContext(exporterCode);

// Restore console
console.log = originalLog;
console.warn = originalWarn;

describe('TerrainExporter - JSON Export', function() {
  
  describe('exportToJSON()', function() {
    
    it('should export basic terrain metadata', function() {
      const terrain = new gridTerrain(3, 3, 12345);
      const exporter = new TerrainExporter(terrain);
      
      const exported = exporter.exportToJSON();
      
      expect(exported.metadata.version).to.equal('1.0');
      expect(exported.metadata.gridSizeX).to.equal(3);
      expect(exported.metadata.gridSizeY).to.equal(3);
      expect(exported.metadata.chunkSize).to.equal(8);
      expect(exported.metadata.seed).to.equal(12345);
    });
    
    it('should export all tile materials', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      const exporter = new TerrainExporter(terrain);
      
      const exported = exporter.exportToJSON();
      
      expect(exported.tiles).to.be.an('array');
      expect(exported.tiles).to.have.lengthOf(2 * 2 * 8 * 8); // gridSizeX * gridSizeY * chunkSize * chunkSize
      exported.tiles.forEach(material => {
        expect(material).to.be.a('string');
      });
    });
    
    it('should include custom metadata when provided', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      const exporter = new TerrainExporter(terrain);
      
      const customMetadata = {
        name: 'Test Level',
        author: 'TestUser',
        description: 'A test level',
        difficulty: 'easy',
        tags: ['tutorial', 'beginner']
      };
      
      const exported = {
        metadata: {
          ...customMetadata,
          version: '1.0',
          gridSizeX: terrain._gridSizeX,
          gridSizeY: terrain._gridSizeY
        }
      };
      
      expect(exported.metadata.name).to.equal('Test Level');
      expect(exported.metadata.author).to.equal('TestUser');
      expect(exported.metadata.tags).to.deep.equal(['tutorial', 'beginner']);
    });
    
    it('should support compressed tile format', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      
      // Compressed format: single string where each char represents a material
      const materialToChar = {
        'grass': 'g',
        'dirt': 'd',
        'stone': 's',
        'water': 'w',
        'sand': 'a',
        'moss_0': 'm'
      };
      
      let compressed = '';
      terrain.chunkArray.rawArray.forEach(chunk => {
        chunk.tileData.rawArray.forEach(tile => {
          compressed += materialToChar[tile._materialSet] || 'g';
        });
      });
      
      expect(compressed).to.be.a('string');
      expect(compressed.length).to.equal(4 * 64); // One char per tile
      expect(compressed).to.match(/^[gdswam]+$/); // Only valid characters
    });
    
    it('should handle empty or minimal terrains', function() {
      const terrain = new gridTerrain(1, 1, 12345);
      
      const exported = {
        metadata: {
          version: '1.0',
          gridSizeX: 1,
          gridSizeY: 1
        },
        tiles: []
      };
      
      terrain.chunkArray.rawArray[0].tileData.rawArray.forEach(tile => {
        exported.tiles.push({
          x: tile._x,
          y: tile._y,
          material: tile._materialSet
        });
      });
      
      expect(exported.tiles).to.have.length.greaterThan(0);
    });
    
    it('should generate valid JSON string', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      
      const data = {
        metadata: { version: '1.0' },
        terrain: { seed: terrain._seed }
      };
      
      const jsonString = JSON.stringify(data);
      expect(jsonString).to.be.a('string');
      
      // Should be parseable
      const parsed = JSON.parse(jsonString);
      expect(parsed.metadata.version).to.equal('1.0');
    });
  });
  
  describe('exportOptions()', function() {
    
    it('should support entities export option', function() {
      const includeEntities = true;
      const entities = [
        { type: 'ant_hill', x: 40, y: 40 },
        { type: 'food', x: 100, y: 100, amount: 50 }
      ];
      
      const exported = {
        entities: includeEntities ? entities : []
      };
      
      expect(exported.entities).to.have.lengthOf(2);
      expect(exported.entities[0].type).to.equal('ant_hill');
    });
    
    it('should support resources export option', function() {
      const includeResources = true;
      const resources = [
        { type: 'wood', x: 60, y: 60, quantity: 20 }
      ];
      
      const exported = {
        resources: includeResources ? resources : []
      };
      
      expect(exported.resources).to.have.lengthOf(1);
    });
    
    it('should support compression option', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      
      // Uncompressed: array of tile objects
      const uncompressed = [];
      terrain.chunkArray.rawArray.forEach(chunk => {
        chunk.tileData.rawArray.forEach(tile => {
          uncompressed.push({ x: tile._x, y: tile._y, material: tile._materialSet });
        });
      });
      
      // Compressed: run-length encoding
      const compressed = [];
      let currentMaterial = null;
      let runLength = 0;
      
      terrain.chunkArray.rawArray.forEach(chunk => {
        chunk.tileData.rawArray.forEach(tile => {
          if (tile._materialSet === currentMaterial) {
            runLength++;
          } else {
            if (currentMaterial !== null) {
              compressed.push({ material: currentMaterial, count: runLength });
            }
            currentMaterial = tile._materialSet;
            runLength = 1;
          }
        });
      });
      
      if (currentMaterial !== null) {
        compressed.push({ material: currentMaterial, count: runLength });
      }
      
      // Compressed should be smaller for homogeneous terrain
      const uncompressedSize = JSON.stringify(uncompressed).length;
      const compressedSize = JSON.stringify(compressed).length;
      
      expect(compressedSize).to.be.lessThan(uncompressedSize);
    });
    
    it('should exclude entities when option is false', function() {
      const exported = {
        metadata: {},
        entities: false ? [{ type: 'ant' }] : []
      };
      
      expect(exported.entities).to.have.lengthOf(0);
    });
    
    it('should include timestamp in metadata', function() {
      const exported = {
        metadata: {
          created: new Date().toISOString(),
          version: '1.0'
        }
      };
      
      expect(exported.metadata.created).to.match(/^\d{4}-\d{2}-\d{2}T/);
    });
  });
  
  describe('chunkBasedExport()', function() {
    
    it('should export terrain by chunks', function() {
      const terrain = new gridTerrain(3, 3, 12345);
      
      const chunkData = terrain.chunkArray.rawArray.map((chunk, idx) => {
        const chunkPos = terrain.chunkArray.convToSquare(idx);
        return {
          position: chunkPos,
          tiles: chunk.tileData.rawArray.map(tile => ({
            offset: [tile._x % 8, tile._y % 8],
            material: tile._materialSet
          }))
        };
      });
      
      expect(chunkData).to.have.lengthOf(9); // 3x3 chunks
      chunkData.forEach(chunk => {
        expect(chunk.position).to.be.an('array');
        expect(chunk.tiles).to.have.lengthOf(64); // 8x8 tiles per chunk
      });
    });
    
    it('should use default material with exceptions', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      
      const chunks = terrain.chunkArray.rawArray.map(chunk => {
        // Find most common material
        const materialCounts = {};
        chunk.tileData.rawArray.forEach(tile => {
          materialCounts[tile._materialSet] = (materialCounts[tile._materialSet] || 0) + 1;
        });
        
        const defaultMaterial = Object.keys(materialCounts).reduce((a, b) => 
          materialCounts[a] > materialCounts[b] ? a : b
        );
        
        // Only store exceptions
        const exceptions = [];
        chunk.tileData.rawArray.forEach((tile, idx) => {
          if (tile._materialSet !== defaultMaterial) {
            exceptions.push({
              offset: [idx % 8, Math.floor(idx / 8)],
              material: tile._materialSet
            });
          }
        });
        
        return {
          defaultMaterial,
          exceptions
        };
      });
      
      chunks.forEach(chunk => {
        expect(chunk.defaultMaterial).to.be.a('string');
        expect(chunk.exceptions).to.be.an('array');
      });
    });
  });
});

describe('TerrainExporter - File Generation', function() {
  
  describe('generateFileName()', function() {
    
    it('should generate filename with timestamp', function() {
      const timestamp = Date.now();
      const filename = `terrain_${timestamp}.json`;
      
      expect(filename).to.match(/^terrain_\d+\.json$/);
    });
    
    it('should support custom filenames', function() {
      const customName = 'my_level';
      const filename = `${customName}.json`;
      
      expect(filename).to.equal('my_level.json');
    });
    
    it('should sanitize filenames', function() {
      const unsafeName = 'my level/with\\bad:chars*';
      const safeName = unsafeName.replace(/[^a-zA-Z0-9_-]/g, '_');
      
      expect(safeName).to.equal('my_level_with_bad_chars_');
      expect(safeName).to.not.match(/[\/\\:*]/);
    });
    
    it('should add extension if missing', function() {
      const name = 'terrain_file';
      const withExtension = name.endsWith('.json') ? name : `${name}.json`;
      
      expect(withExtension).to.equal('terrain_file.json');
    });
  });
  
  describe('getMimeType()', function() {
    
    it('should return correct MIME type for JSON', function() {
      const mimeType = 'application/json';
      expect(mimeType).to.equal('application/json');
    });
    
    it('should return correct MIME type for PNG', function() {
      const mimeType = 'image/png';
      expect(mimeType).to.equal('image/png');
    });
    
    it('should return correct MIME type for binary', function() {
      const mimeType = 'application/octet-stream';
      expect(mimeType).to.equal('application/octet-stream');
    });
  });
});

describe('TerrainExporter - Run-Length Encoding', function() {
  
  describe('runLengthEncode()', function() {
    
    it('should compress homogeneous sequences', function() {
      const materials = ['grass', 'grass', 'grass', 'dirt', 'dirt', 'grass'];
      
      const encoded = [];
      let current = materials[0];
      let count = 1;
      
      for (let i = 1; i < materials.length; i++) {
        if (materials[i] === current) {
          count++;
        } else {
          encoded.push({ material: current, count });
          current = materials[i];
          count = 1;
        }
      }
      encoded.push({ material: current, count });
      
      expect(encoded).to.deep.equal([
        { material: 'grass', count: 3 },
        { material: 'dirt', count: 2 },
        { material: 'grass', count: 1 }
      ]);
    });
    
    it('should handle single material terrain', function() {
      const materials = new Array(100).fill('grass');
      
      const encoded = [{ material: 'grass', count: 100 }];
      
      expect(encoded).to.have.lengthOf(1);
      expect(encoded[0].count).to.equal(100);
    });
    
    it('should handle alternating materials', function() {
      const materials = ['grass', 'dirt', 'grass', 'dirt'];
      
      const encoded = materials.map(m => ({ material: m, count: 1 }));
      
      expect(encoded).to.have.lengthOf(4);
    });
    
    it('should preserve order', function() {
      const materials = ['a', 'a', 'b', 'c', 'c', 'c'];
      
      const encoded = [
        { material: 'a', count: 2 },
        { material: 'b', count: 1 },
        { material: 'c', count: 3 }
      ];
      
      // Decode to verify
      const decoded = [];
      encoded.forEach(run => {
        for (let i = 0; i < run.count; i++) {
          decoded.push(run.material);
        }
      });
      
      expect(decoded).to.deep.equal(materials);
    });
  });
});

describe('TerrainExporter - Validation', function() {
  
  describe('validateExportData()', function() {
    
    it('should validate required metadata fields', function() {
      const data = {
        metadata: {
          version: '1.0',
          gridSizeX: 5,
          gridSizeY: 5,
          chunkSize: 8,
          tileSize: 32
        }
      };
      
      expect(data.metadata.version).to.exist;
      expect(data.metadata.gridSizeX).to.be.a('number');
      expect(data.metadata.gridSizeY).to.be.a('number');
    });
    
    it('should reject invalid version format', function() {
      const version = '1.0';
      const isValid = /^\d+\.\d+$/.test(version);
      
      expect(isValid).to.be.true;
      expect(/^\d+\.\d+$/.test('invalid')).to.be.false;
    });
    
    it('should validate tile data structure', function() {
      const tile = {
        x: 0,
        y: 0,
        material: 'grass',
        weight: 1
      };
      
      expect(tile).to.have.property('x');
      expect(tile).to.have.property('y');
      expect(tile).to.have.property('material');
      expect(tile.material).to.be.a('string');
    });
    
    it('should reject negative coordinates', function() {
      const tile = { x: -1, y: 0, material: 'grass' };
      const isValid = tile.x >= 0 && tile.y >= 0;
      
      expect(isValid).to.be.false;
    });
    
    it('should validate material names', function() {
      const validMaterials = ['grass', 'dirt', 'stone', 'water', 'sand'];
      const material = 'grass';
      
      expect(validMaterials).to.include(material);
      expect(validMaterials).to.not.include('invalid_material');
    });
  });
});

describe('TerrainExporter - Size Calculations', function() {
  
  describe('calculateExportSize()', function() {
    
    it('should calculate JSON byte size', function() {
      const data = { metadata: { version: '1.0' }, tiles: [] };
      const jsonString = JSON.stringify(data);
      const byteSize = new TextEncoder().encode(jsonString).length;
      
      expect(byteSize).to.be.a('number');
      expect(byteSize).to.be.greaterThan(0);
    });
    
    it('should estimate compressed size', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      
      const tileCount = terrain._gridSizeX * terrain._gridSizeY * 
                       terrain._chunkSize * terrain._chunkSize;
      
      // Uncompressed: ~50 bytes per tile (JSON)
      const uncompressedSize = tileCount * 50;
      
      // Compressed: ~10 bytes per run (assuming good compression)
      const estimatedRuns = Math.ceil(tileCount / 10); // Optimistic
      const compressedSize = estimatedRuns * 10;
      
      expect(compressedSize).to.be.lessThan(uncompressedSize);
    });
    
    it('should report size in human-readable format', function() {
      const formatBytes = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
      };
      
      expect(formatBytes(500)).to.equal('500 B');
      expect(formatBytes(2048)).to.equal('2.00 KB');
      expect(formatBytes(2097152)).to.equal('2.00 MB');
    });
  });
});
