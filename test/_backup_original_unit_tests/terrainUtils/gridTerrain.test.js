/**
 * Unit Tests for gridTerrain and camRenderConverter Classes
 * Tests main terrain system with chunk management, caching, and coordinate conversions
 */

const { expect } = require('chai');

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
global.createGraphics = (w, h) => ({
  _width: w,
  _height: h,
  image: () => {},
  clear: () => {},
  push: () => {},
  pop: () => {},
  translate: () => {},
});

// Mock terrain materials
global.GRASS_IMAGE = { _mockImage: 'grass' };
global.DIRT_IMAGE = { _mockImage: 'dirt' };
global.STONE_IMAGE = { _mockImage: 'stone' };
global.MOSS_IMAGE = { _mockImage: 'moss' };

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

// Mock camera manager
global.cameraManager = {
  cameraZoom: 1.0,
};

// Mock console functions
const originalLog = console.log;
console.log = () => {};

// Load dependencies in order
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

const gridTerrainCode = require('fs').readFileSync(
  require('path').join(__dirname, '../../../Classes/terrainUtils/gridTerrain.js'),
  'utf8'
);
eval(gridTerrainCode);

// Restore console
console.log = originalLog;

describe('Position Utility Functions', function() {
  
  describe('posAdd()', function() {
    it('should add two position vectors', function() {
      const result = posAdd([10, 20], [5, 8]);
      expect(result).to.deep.equal([15, 28]);
    });
    
    it('should handle negative values', function() {
      const result = posAdd([-5, -10], [3, 7]);
      expect(result).to.deep.equal([-2, -3]);
    });
    
    it('should handle zero', function() {
      const result = posAdd([10, 20], [0, 0]);
      expect(result).to.deep.equal([10, 20]);
    });
  });
  
  describe('posSub()', function() {
    it('should subtract two position vectors', function() {
      const result = posSub([20, 30], [5, 10]);
      expect(result).to.deep.equal([15, 20]);
    });
    
    it('should handle negative results', function() {
      const result = posSub([5, 10], [10, 20]);
      expect(result).to.deep.equal([-5, -10]);
    });
  });
  
  describe('posNeg()', function() {
    it('should negate position vector', function() {
      const result = posNeg([10, 20]);
      expect(result).to.deep.equal([-10, -20]);
    });
    
    it('should handle negative input', function() {
      const result = posNeg([-5, -8]);
      expect(result).to.deep.equal([5, 8]);
    });
  });
  
  describe('posMul()', function() {
    it('should multiply vector by scalar', function() {
      const result = posMul([10, 20], 3);
      expect(result).to.deep.equal([30, 60]);
    });
    
    it('should handle fractional scalars', function() {
      const result = posMul([10, 20], 0.5);
      expect(result).to.deep.equal([5, 10]);
    });
    
    it('should handle negative scalars', function() {
      const result = posMul([10, 20], -2);
      expect(result).to.deep.equal([-20, -40]);
    });
  });
});

describe('gridTerrain Class', function() {
  
  describe('Constructor', function() {
    
    it('should create terrain with specified grid size', function() {
      const terrain = new gridTerrain(3, 4, 12345);
      
      expect(terrain._gridSizeX).to.equal(3);
      expect(terrain._gridSizeY).to.equal(4);
      expect(terrain._gridChunkCount).to.equal(12);
    });
    
    it('should calculate center chunk correctly', function() {
      const terrain = new gridTerrain(5, 5, 12345);
      
      expect(terrain._centerChunkX).to.equal(2); // floor((5-1)/2) = 2
      expect(terrain._centerChunkY).to.equal(2);
    });
    
    it('should set generation mode', function() {
      const terrainPerlin = new gridTerrain(2, 2, 12345, CHUNK_SIZE, TILE_SIZE, [800, 600], 'perlin');
      const terrainColumns = new gridTerrain(2, 2, 12345, CHUNK_SIZE, TILE_SIZE, [800, 600], 'columns');
      
      expect(terrainPerlin._generationMode).to.equal('perlin');
      expect(terrainColumns._generationMode).to.equal('columns');
    });
    
    it('should use default chunk size', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      
      expect(terrain._chunkSize).to.equal(CHUNK_SIZE);
    });
    
    it('should use custom chunk size', function() {
      const terrain = new gridTerrain(2, 2, 12345, 16);
      
      expect(terrain._chunkSize).to.equal(16);
    });
    
    it('should use custom tile size', function() {
      const terrain = new gridTerrain(2, 2, 12345, CHUNK_SIZE, 64);
      
      expect(terrain._tileSize).to.equal(64);
    });
    
    it('should initialize chunk array grid', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      
      expect(terrain.chunkArray).to.be.instanceOf(Grid);
      expect(terrain.chunkArray.getSize()).to.deep.equal([2, 2]);
    });
    
    it('should create all chunks', function() {
      const terrain = new gridTerrain(3, 3, 12345);
      
      expect(terrain.chunkArray.rawArray).to.have.lengthOf(9);
      terrain.chunkArray.rawArray.forEach(chunk => {
        expect(chunk).to.be.instanceOf(Chunk);
      });
    });
    
    it('should initialize rendering converter', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      
      expect(terrain.renderConversion).to.be.instanceOf(camRenderConverter);
    });
    
    it('should initialize caching system', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      
      expect(terrain._terrainCache).to.equal(null);
      expect(terrain._cacheValid).to.equal(false);
    });
  });
  
  describe('Coordinate Conversion', function() {
    
    it('should convert tile position to canvas coordinates', function() {
      const terrain = new gridTerrain(2, 2, 12345, 8, 32, [800, 600]);
      terrain.renderConversion.setCenterPos([0, 0]);
      
      const canvasPos = terrain.renderConversion.convPosToCanvas([5, 10]);
      
      expect(canvasPos).to.be.an('array');
      expect(canvasPos).to.have.lengthOf(2);
      expect(canvasPos[0]).to.be.a('number');
      expect(canvasPos[1]).to.be.a('number');
    });
    
    it('should convert canvas coordinates to tile position', function() {
      const terrain = new gridTerrain(2, 2, 12345, 8, 32, [800, 600]);
      terrain.renderConversion.setCenterPos([0, 0]);
      
      const tilePos = terrain.renderConversion.convCanvasToPos([400, 300]);
      
      expect(tilePos).to.be.an('array');
      expect(tilePos).to.have.lengthOf(2);
    });
    
    it('should support round-trip conversion', function() {
      const terrain = new gridTerrain(2, 2, 12345, 8, 32, [800, 600]);
      terrain.renderConversion.setCenterPos([0, 0]);
      
      const originalTilePos = [5, 10];
      const canvasPos = terrain.renderConversion.convPosToCanvas(originalTilePos);
      const backToTile = terrain.renderConversion.convCanvasToPos(canvasPos);
      
      expect(backToTile[0]).to.be.closeTo(originalTilePos[0], 0.01);
      expect(backToTile[1]).to.be.closeTo(originalTilePos[1], 0.01);
    });
  });
  
  describe('Grid Information Methods', function() {
    
    it('should return grid size in chunks', function() {
      const terrain = new gridTerrain(5, 7, 12345);
      
      const size = terrain.getGridSize();
      
      expect(size).to.deep.equal([5, 7]);
    });
    
    it('should return grid size in pixels', function() {
      const terrain = new gridTerrain(2, 3, 12345, 8, 32);
      
      const sizePixels = terrain.getGridSizePixels();
      
      // 2 chunks * 8 tiles * 32 pixels = 512
      // 3 chunks * 8 tiles * 32 pixels = 768
      expect(sizePixels).to.deep.equal([512, 768]);
    });
    
    it('should return render converter', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      
      const converter = terrain.getCamRenderConverter();
      
      expect(converter).to.equal(terrain.renderConversion);
      expect(converter).to.be.instanceOf(camRenderConverter);
    });
  });
  
  describe('setGridToCenter()', function() {
    
    it('should align grid to canvas center', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      
      terrain.setGridToCenter();
      
      // Should call alignToCanvas on renderConversion
      expect(terrain.renderConversion).to.exist;
    });
  });
  
  describe('Edge Cases', function() {
    
    it('should handle 1x1 terrain', function() {
      const terrain = new gridTerrain(1, 1, 12345);
      
      expect(terrain._gridChunkCount).to.equal(1);
      expect(terrain._centerChunkX).to.equal(0);
      expect(terrain._centerChunkY).to.equal(0);
    });
    
    it('should handle large terrains', function() {
      const terrain = new gridTerrain(10, 10, 12345);
      
      expect(terrain._gridChunkCount).to.equal(100);
      expect(terrain.chunkArray.rawArray).to.have.lengthOf(100);
    });
    
    it('should handle rectangular terrains', function() {
      const wide = new gridTerrain(10, 2, 12345);
      const tall = new gridTerrain(2, 10, 12345);
      
      expect(wide.getGridSize()).to.deep.equal([10, 2]);
      expect(tall.getGridSize()).to.deep.equal([2, 10]);
    });
    
    it('should handle different generation modes', function() {
      const modes = ['perlin', 'columns', 'checkerboard', 'flat'];
      
      modes.forEach(mode => {
        const terrain = new gridTerrain(2, 2, 12345, CHUNK_SIZE, TILE_SIZE, [800, 600], mode);
        expect(terrain._generationMode).to.equal(mode);
      });
    });
  });
});

describe('camRenderConverter Class', function() {
  
  describe('Constructor', function() {
    
    it('should initialize with position and canvas size', function() {
      const converter = new camRenderConverter([0, 0], [800, 600], 32);
      
      expect(converter._camPosition).to.deep.equal([0, 0]);
      expect(converter._canvasSize).to.deep.equal([800, 600]);
      expect(converter._tileSize).to.equal(32);
    });
    
    it('should calculate canvas center', function() {
      const converter = new camRenderConverter([0, 0], [800, 600], 32);
      
      expect(converter._canvasCenter).to.deep.equal([400, 300]);
    });
    
    it('should calculate view span', function() {
      const converter = new camRenderConverter([0, 0], [800, 600], 32);
      
      expect(converter._viewSpan).to.exist;
      expect(converter._viewSpan).to.have.lengthOf(2);
      expect(converter._viewSpan[0]).to.be.an('array'); // TL
      expect(converter._viewSpan[1]).to.be.an('array'); // BR
    });
    
    it('should initialize update ID', function() {
      const converter = new camRenderConverter([0, 0], [800, 600], 32);
      
      expect(converter._updateId).to.equal(0);
    });
  });
  
  describe('setCenterPos()', function() {
    
    it('should update camera position', function() {
      const converter = new camRenderConverter([0, 0], [800, 600], 32);
      
      converter.setCenterPos([10, 20]);
      
      expect(converter._camPosition).to.deep.equal([10, 20]);
    });
    
    it('should increment update ID', function() {
      const converter = new camRenderConverter([0, 0], [800, 600], 32);
      const initialId = converter._updateId;
      
      converter.setCenterPos([5, 5]);
      
      expect(converter._updateId).to.equal(initialId + 1);
    });
  });
  
  describe('setCanvasSize()', function() {
    
    it('should update canvas size', function() {
      const converter = new camRenderConverter([0, 0], [800, 600], 32);
      
      converter.setCanvasSize([1024, 768]);
      
      expect(converter._canvasSize).to.deep.equal([1024, 768]);
    });
    
    it('should recalculate canvas center', function() {
      const converter = new camRenderConverter([0, 0], [800, 600], 32);
      
      converter.setCanvasSize([1000, 800]);
      
      expect(converter._canvasCenter).to.deep.equal([500, 400]);
    });
    
    it('should recalculate view span', function() {
      const converter = new camRenderConverter([0, 0], [800, 600], 32);
      const oldViewSpan = [...converter._viewSpan];
      
      converter.setCanvasSize([1024, 768]);
      
      expect(converter._viewSpan).to.not.deep.equal(oldViewSpan);
    });
    
    it('should increment update ID', function() {
      const converter = new camRenderConverter([0, 0], [800, 600], 32);
      const initialId = converter._updateId;
      
      converter.setCanvasSize([1024, 768]);
      
      expect(converter._updateId).to.equal(initialId + 1);
    });
  });
  
  describe('setTileSize()', function() {
    
    it('should update tile size', function() {
      const converter = new camRenderConverter([0, 0], [800, 600], 32);
      
      converter.setTileSize(64);
      
      expect(converter._tileSize).to.equal(64);
    });
    
    it('should increment update ID', function() {
      const converter = new camRenderConverter([0, 0], [800, 600], 32);
      const initialId = converter._updateId;
      
      converter.setTileSize(48);
      
      expect(converter._updateId).to.equal(initialId + 1);
    });
  });
  
  describe('convPosToCanvas()', function() {
    
    it('should convert tile position to canvas pixels', function() {
      const converter = new camRenderConverter([0, 0], [800, 600], 32);
      
      const canvasPos = converter.convPosToCanvas([0, 0]);
      
      // At camera [0,0], tile [0,0] should be at canvas center
      expect(canvasPos).to.deep.equal([400, 300]);
    });
    
    it('should handle positive offsets', function() {
      const converter = new camRenderConverter([0, 0], [800, 600], 32);
      
      const canvasPos = converter.convPosToCanvas([5, 0]);
      
      // 5 tiles right = 5 * 32 = 160 pixels right of center
      expect(canvasPos[0]).to.equal(400 + 160);
    });
    
    it('should handle Y-axis flip (mathematical coordinates)', function() {
      const converter = new camRenderConverter([0, 0], [800, 600], 32);
      
      const canvasPos = converter.convPosToCanvas([0, 5]);
      
      // +5 in world Y (up) = -160 in canvas Y (down)
      expect(canvasPos[1]).to.equal(300 - 160);
    });
  });
  
  describe('convCanvasToPos()', function() {
    
    it('should convert canvas pixels to tile position', function() {
      const converter = new camRenderConverter([0, 0], [800, 600], 32);
      
      const tilePos = converter.convCanvasToPos([400, 300]);
      
      // Canvas center [400, 300] should be tile [0, 0]
      expect(tilePos[0]).to.be.closeTo(0, 0.01);
      expect(tilePos[1]).to.be.closeTo(0, 0.01);
    });
    
    it('should handle canvas offsets', function() {
      const converter = new camRenderConverter([0, 0], [800, 600], 32);
      
      const tilePos = converter.convCanvasToPos([400 + 160, 300]);
      
      // 160 pixels right = 5 tiles right
      expect(tilePos[0]).to.be.closeTo(5, 0.01);
    });
  });
  
  describe('alignToCanvas()', function() {
    
    it('should align terrain to canvas origin', function() {
      const converter = new camRenderConverter([0, 0], [800, 600], 32);
      
      converter.alignToCanvas();
      
      // Should adjust camera position to align grid
      expect(converter._camPosition).to.exist;
    });
    
    it('should increment update ID', function() {
      const converter = new camRenderConverter([0, 0], [800, 600], 32);
      const initialId = converter._updateId;
      
      converter.alignToCanvas();
      
      expect(converter._updateId).to.be.greaterThan(initialId);
    });
  });
  
  describe('getViewSpan()', function() {
    
    it('should return current view span', function() {
      const converter = new camRenderConverter([0, 0], [800, 600], 32);
      
      const viewSpan = converter.getViewSpan();
      
      expect(viewSpan).to.deep.equal(converter._viewSpan);
    });
  });
  
  describe('getUpdateId()', function() {
    
    it('should return current update ID', function() {
      const converter = new camRenderConverter([0, 0], [800, 600], 32);
      
      const updateId = converter.getUpdateId();
      
      expect(updateId).to.equal(converter._updateId);
    });
    
    it('should reflect changes after updates', function() {
      const converter = new camRenderConverter([0, 0], [800, 600], 32);
      const id1 = converter.getUpdateId();
      
      converter.setCenterPos([5, 5]);
      const id2 = converter.getUpdateId();
      
      expect(id2).to.be.greaterThan(id1);
    });
  });
  
  describe('Integration Tests', function() {
    
    it('should maintain consistency across camera movements', function() {
      const converter = new camRenderConverter([0, 0], [800, 600], 32);
      
      // Move camera
      converter.setCenterPos([10, 20]);
      
      // Convert and back
      const originalTile = [5, 8];
      const canvasPos = converter.convPosToCanvas(originalTile);
      const backToTile = converter.convCanvasToPos(canvasPos);
      
      expect(backToTile[0]).to.be.closeTo(originalTile[0], 0.01);
      expect(backToTile[1]).to.be.closeTo(originalTile[1], 0.01);
    });
    
    it('should handle canvas resize correctly', function() {
      const converter = new camRenderConverter([0, 0], [800, 600], 32);
      
      // Resize canvas
      converter.setCanvasSize([1024, 768]);
      
      // Center should still be at tile [0, 0]
      const centerTile = converter.convCanvasToPos([512, 384]); // New center
      
      expect(centerTile[0]).to.be.closeTo(0, 0.01);
      expect(centerTile[1]).to.be.closeTo(0, 0.01);
    });
  });
});

describe('Global Conversion Functions', function() {
  
  describe('convPosToCanvas()', function() {
    
    it('should delegate to active map', function() {
      const terrain = new gridTerrain(2, 2, 12345, 8, 32, [800, 600]);
      global.g_activeMap = terrain;
      
      const result = convPosToCanvas([5, 10]);
      
      expect(result).to.exist;
      expect(result).to.be.an('array');
    });
    
    it('should handle undefined active map', function() {
      global.g_activeMap = undefined;
      
      const result = convPosToCanvas([5, 10]);
      
      expect(result).to.be.undefined;
    });
  });
  
  describe('convCanvasToPos()', function() {
    
    it('should delegate to active map', function() {
      const terrain = new gridTerrain(2, 2, 12345, 8, 32, [800, 600]);
      global.g_activeMap = terrain;
      
      const result = convCanvasToPos([400, 300]);
      
      expect(result).to.exist;
      expect(result).to.be.an('array');
    });
    
    it('should handle undefined active map', function() {
      global.g_activeMap = undefined;
      
      const result = convCanvasToPos([400, 300]);
      
      expect(result).to.be.undefined;
    });
  });
});
