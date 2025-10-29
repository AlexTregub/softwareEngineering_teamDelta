/**
 * Unit Tests for Custom Levels (customLevels.js)
 * Tests custom level generation functions
 */

const { expect } = require('chai');

// Mock p5.js global functions and constants
global.CHUNK_SIZE = 8;
global.TILE_SIZE = 32;
global.PERLIN_SCALE = 0.08;
global.NONE = null;
global.floor = Math.floor;
global.round = Math.round;
global.print = () => {};
global.noise = (x, y) => (Math.sin(x * 0.1) + Math.sin(y * 0.1)) / 2 + 0.5;
global.noiseSeed = () => {};
global.randomSeed = () => {};
global.random = () => Math.random();
global.noSmooth = () => {};
global.smooth = () => {};
global.image = () => {};
global.fill = () => {};
global.rect = () => {};
global.strokeWeight = () => {};
global.windowWidth = 800;
global.windowHeight = 600;
global.g_canvasX = 800;
global.g_canvasY = 600;

// Mock window object
global.window = global;

// Mock images
global.GRASS_IMAGE = { _mockImage: 'grass' };
global.DIRT_IMAGE = { _mockImage: 'dirt' };
global.STONE_IMAGE = { _mockImage: 'stone' };
global.MOSS_IMAGE = { _mockImage: 'moss' };

// Mock terrain materials
global.TERRAIN_MATERIALS = {
  'stone': [0.01, (x, y, squareSize) => {}],
  'dirt': [0.15, (x, y, squareSize) => {}],
  'grass': [1, (x, y, squareSize) => {}],
};

global.TERRAIN_MATERIALS_RANGED = {
  'moss_0': [[0, 0.3], (x, y, squareSize) => {}],
  'moss_1': [[0.375, 0.4], (x, y, squareSize) => {}],
  'stone': [[0, 0.4], (x, y, squareSize) => {}],
  'dirt': [[0.4, 0.525], (x, y, squareSize) => {}],
  'grass': [[0, 1], (x, y, squareSize) => {}],
};

// Mock console.log to suppress output during tests
const originalLog = console.log;
console.log = () => {};

// Load dependencies in correct order
const gridCode = require('fs').readFileSync(
  require('path').join(__dirname, '../../../Classes/terrainUtils/grid.js'),
  'utf8'
);
eval(gridCode);

const terrianGenCode = require('fs').readFileSync(
  require('path').join(__dirname, '../../../Classes/terrainUtils/terrianGen.js'),
  'utf8'
);
eval(terrianGenCode);

const chunkCode = require('fs').readFileSync(
  require('path').join(__dirname, '../../../Classes/terrainUtils/chunk.js'),
  'utf8'
);
eval(chunkCode);

const coordinateSystemCode = require('fs').readFileSync(
  require('path').join(__dirname, '../../../Classes/terrainUtils/coordinateSystem.js'),
  'utf8'
);
eval(coordinateSystemCode);

// Load gridTerrain first
const gridTerrainCode = require('fs').readFileSync(
  require('path').join(__dirname, '../../../Classes/terrainUtils/gridTerrain.js'),
  'utf8'
);
eval(gridTerrainCode);

// Load customLevels
const customLevelsCode = require('fs').readFileSync(
  require('path').join(__dirname, '../../../Classes/terrainUtils/customLevels.js'),
  'utf8'
);
eval(customLevelsCode);

// Restore console.log
console.log = originalLog;

describe('Custom Levels', function() {
  
  describe('createMossStoneColumnLevel()', function() {
    
    it('should create terrain with column generation mode', function() {
      const terrain = createMossStoneColumnLevel(2, 2, 12345);
      
      expect(terrain).to.be.instanceOf(gridTerrain);
      expect(terrain._generationMode).to.equal('columns');
    });
    
    it('should use specified chunk dimensions', function() {
      const terrain = createMossStoneColumnLevel(3, 4, 12345);
      
      expect(terrain._gridSizeX).to.equal(3);
      expect(terrain._gridSizeY).to.equal(4);
      expect(terrain._gridChunkCount).to.equal(12);
    });
    
    it('should use specified seed', function() {
      const terrain = createMossStoneColumnLevel(2, 2, 99999);
      
      expect(terrain._seed).to.equal(99999);
    });
    
    it('should use default chunk size if not specified', function() {
      const terrain = createMossStoneColumnLevel(2, 2, 12345);
      
      expect(terrain._chunkSize).to.equal(CHUNK_SIZE);
    });
    
    it('should use custom chunk size if provided', function() {
      const terrain = createMossStoneColumnLevel(2, 2, 12345, 16);
      
      expect(terrain._chunkSize).to.equal(16);
    });
    
    it('should use default tile size if not specified', function() {
      const terrain = createMossStoneColumnLevel(2, 2, 12345);
      
      expect(terrain._tileSize).to.equal(TILE_SIZE);
    });
    
    it('should use custom tile size if provided', function() {
      const terrain = createMossStoneColumnLevel(2, 2, 12345, CHUNK_SIZE, 64);
      
      expect(terrain._tileSize).to.equal(64);
    });
    
    it('should use custom canvas size if provided', function() {
      const customCanvas = [1024, 768];
      const terrain = createMossStoneColumnLevel(2, 2, 12345, CHUNK_SIZE, TILE_SIZE, customCanvas);
      
      expect(terrain._canvasSize).to.deep.equal(customCanvas);
    });
    
    it('should apply column pattern to all chunks', function() {
      const terrain = createMossStoneColumnLevel(2, 2, 12345);
      
      // Check that chunks have column pattern
      terrain.chunkArray.rawArray.forEach(chunk => {
        // Column pattern: even columns are moss, odd are stone
        const tile0 = chunk.getArrPos([0, 0]);
        const tile1 = chunk.getArrPos([1, 0]);
        
        // Materials should be moss or stone (column pattern)
        expect(tile0._materialSet).to.be.oneOf(['moss_0', 'stone']);
        expect(tile1._materialSet).to.be.oneOf(['moss_0', 'stone']);
      });
    });
    
    it('should align terrain to canvas', function() {
      const terrain = createMossStoneColumnLevel(2, 2, 12345);
      
      // Alignment should center the terrain
      expect(terrain.renderConversion).to.exist;
    });
  });
  
  describe('createMossStoneCheckerboardLevel()', function() {
    
    it('should create terrain with checkerboard generation mode', function() {
      const terrain = createMossStoneCheckerboardLevel(2, 2, 12345);
      
      expect(terrain).to.be.instanceOf(gridTerrain);
      expect(terrain._generationMode).to.equal('checkerboard');
    });
    
    it('should use specified chunk dimensions', function() {
      const terrain = createMossStoneCheckerboardLevel(3, 3, 12345);
      
      expect(terrain._gridSizeX).to.equal(3);
      expect(terrain._gridSizeY).to.equal(3);
      expect(terrain._gridChunkCount).to.equal(9);
    });
    
    it('should use specified seed', function() {
      const terrain = createMossStoneCheckerboardLevel(2, 2, 54321);
      
      expect(terrain._seed).to.equal(54321);
    });
    
    it('should use default chunk size if not specified', function() {
      const terrain = createMossStoneCheckerboardLevel(2, 2, 12345);
      
      expect(terrain._chunkSize).to.equal(CHUNK_SIZE);
    });
    
    it('should use custom chunk size if provided', function() {
      const terrain = createMossStoneCheckerboardLevel(2, 2, 12345, 16);
      
      expect(terrain._chunkSize).to.equal(16);
    });
    
    it('should use default tile size if not specified', function() {
      const terrain = createMossStoneCheckerboardLevel(2, 2, 12345);
      
      expect(terrain._tileSize).to.equal(TILE_SIZE);
    });
    
    it('should use custom tile size if provided', function() {
      const terrain = createMossStoneCheckerboardLevel(2, 2, 12345, CHUNK_SIZE, 64);
      
      expect(terrain._tileSize).to.equal(64);
    });
    
    it('should use custom canvas size if provided', function() {
      const customCanvas = [1920, 1080];
      const terrain = createMossStoneCheckerboardLevel(2, 2, 12345, CHUNK_SIZE, TILE_SIZE, customCanvas);
      
      expect(terrain._canvasSize).to.deep.equal(customCanvas);
    });
    
    it('should apply checkerboard pattern to all chunks', function() {
      const terrain = createMossStoneCheckerboardLevel(2, 2, 12345);
      
      // Check that chunks have checkerboard pattern
      terrain.chunkArray.rawArray.forEach(chunk => {
        // Checkerboard pattern: (x+y)%2 determines material
        const tile00 = chunk.getArrPos([0, 0]);
        const tile01 = chunk.getArrPos([0, 1]);
        const tile10 = chunk.getArrPos([1, 0]);
        const tile11 = chunk.getArrPos([1, 1]);
        
        // Tiles should alternate materials
        expect(tile00._materialSet).to.be.oneOf(['moss_0', 'stone']);
        expect(tile01._materialSet).to.be.oneOf(['moss_0', 'stone']);
        expect(tile10._materialSet).to.be.oneOf(['moss_0', 'stone']);
        expect(tile11._materialSet).to.be.oneOf(['moss_0', 'stone']);
        
        // Adjacent tiles should differ (checkerboard property)
        if (tile00._materialSet === 'moss_0') {
          expect(tile01._materialSet).to.equal('stone');
          expect(tile10._materialSet).to.equal('stone');
        } else {
          expect(tile01._materialSet).to.equal('moss_0');
          expect(tile10._materialSet).to.equal('moss_0');
        }
      });
    });
    
    it('should align terrain to canvas', function() {
      const terrain = createMossStoneCheckerboardLevel(2, 2, 12345);
      
      expect(terrain.renderConversion).to.exist;
    });
  });
  
  describe('Global Exports', function() {
    
    it('should export createMossStoneColumnLevel to window', function() {
      expect(window.createMossStoneColumnLevel).to.be.a('function');
    });
    
    it('should export createMossStoneCheckerboardLevel to window', function() {
      expect(window.createMossStoneCheckerboardLevel).to.be.a('function');
    });
  });
  
  describe('Integration Tests', function() {
    
    it('should create different terrains with different modes', function() {
      const columnTerrain = createMossStoneColumnLevel(2, 2, 12345);
      const checkerboardTerrain = createMossStoneCheckerboardLevel(2, 2, 12345);
      
      expect(columnTerrain._generationMode).to.not.equal(checkerboardTerrain._generationMode);
      expect(columnTerrain._generationMode).to.equal('columns');
      expect(checkerboardTerrain._generationMode).to.equal('checkerboard');
    });
    
    it('should create terrains with different sizes', function() {
      const small = createMossStoneColumnLevel(2, 2, 12345);
      const large = createMossStoneColumnLevel(5, 5, 12345);
      
      expect(small._gridChunkCount).to.equal(4);
      expect(large._gridChunkCount).to.equal(25);
    });
    
    it('should support all parameter combinations', function() {
      const terrain = createMossStoneCheckerboardLevel(
        3,     // chunksX
        4,     // chunksY
        99999, // seed
        16,    // chunkSize
        64,    // tileSize
        [1024, 768] // canvasSize
      );
      
      expect(terrain._gridSizeX).to.equal(3);
      expect(terrain._gridSizeY).to.equal(4);
      expect(terrain._seed).to.equal(99999);
      expect(terrain._chunkSize).to.equal(16);
      expect(terrain._tileSize).to.equal(64);
      expect(terrain._canvasSize).to.deep.equal([1024, 768]);
    });
  });
  
  describe('Edge Cases', function() {
    
    it('should handle 1x1 chunk terrain', function() {
      const terrain = createMossStoneColumnLevel(1, 1, 12345);
      
      expect(terrain._gridChunkCount).to.equal(1);
      expect(terrain.chunkArray.rawArray).to.have.lengthOf(1);
    });
    
    it('should handle rectangular terrains', function() {
      const wide = createMossStoneCheckerboardLevel(10, 2, 12345);
      const tall = createMossStoneCheckerboardLevel(2, 10, 12345);
      
      expect(wide._gridSizeX).to.equal(10);
      expect(wide._gridSizeY).to.equal(2);
      
      expect(tall._gridSizeX).to.equal(2);
      expect(tall._gridSizeY).to.equal(10);
    });
    
    it('should handle large terrains', function() {
      const terrain = createMossStoneColumnLevel(10, 10, 12345);
      
      expect(terrain._gridChunkCount).to.equal(100);
    });
    
    it('should handle zero seed', function() {
      const terrain = createMossStoneCheckerboardLevel(2, 2, 0);
      
      expect(terrain._seed).to.equal(0);
      expect(terrain.chunkArray.rawArray).to.have.lengthOf(4);
    });
    
    it('should handle negative seed', function() {
      const terrain = createMossStoneColumnLevel(2, 2, -12345);
      
      expect(terrain._seed).to.equal(-12345);
    });
  });
});
