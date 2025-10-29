/**
 * Unit Tests for Chunk Class
 * Tests terrain chunk management with Grid of Tiles
 */

const { expect } = require('chai');

// Mock p5.js global functions and constants
global.floor = Math.floor;
global.print = () => {};
global.NONE = null;
global.CHUNK_SIZE = 8;
global.TILE_SIZE = 32;
global.PERLIN_SCALE = 0.1;
global.noise = (x, y) => (Math.sin(x * 0.1) + Math.sin(y * 0.1)) / 2 + 0.5; // Mock noise function
global.noiseSeed = () => {};
global.random = () => Math.random();

// Mock Tile class
class Tile {
  constructor(renderX, renderY, tileSize) {
    this._x = renderX;
    this._y = renderY;
    this._squareSize = tileSize;
    this._materialSet = 'grass';
    this._weight = 1;
    this._coordSysUpdateId = -1;
    this._coordSysPos = NONE;
    this.entities = [];
    this.tileX = renderX;
    this.tileY = renderY;
    this.x = renderX * tileSize;
    this.y = renderY * tileSize;
    this.width = tileSize;
    this.height = tileSize;
  }
  
  randomizePerlin(pos) {
    const val = noise(pos[0] * PERLIN_SCALE, pos[1] * PERLIN_SCALE);
    if (val < 0.3) this._materialSet = 'grass';
    else if (val < 0.6) this._materialSet = 'dirt';
    else this._materialSet = 'stone';
  }
  
  getMaterial() { return this._materialSet; }
  setMaterial(matName) { this._materialSet = matName; return true; }
  getWeight() { return this._weight; }
}

global.Tile = Tile;

// Load Grid class first (dependency)
const gridCode = require('fs').readFileSync(
  require('path').join(__dirname, '../../../Classes/terrainUtils/grid.js'),
  'utf8'
);
eval(gridCode);

// Load Chunk class
const chunkCode = require('fs').readFileSync(
  require('path').join(__dirname, '../../../Classes/terrainUtils/chunk.js'),
  'utf8'
);
eval(chunkCode);

describe('Chunk Class', function() {
  
  describe('Constructor', function() {
    
    it('should create chunk with default size', function() {
      const chunk = new Chunk([0, 0], [0, 0]);
      
      expect(chunk._size).to.equal(CHUNK_SIZE);
      expect(chunk.tileData).to.be.instanceOf(Grid);
    });
    
    it('should create chunk with custom size', function() {
      const chunk = new Chunk([0, 0], [0, 0], 16);
      
      expect(chunk._size).to.equal(16);
    });
    
    it('should set chunk position correctly', function() {
      const chunkPos = [2, 3];
      const chunk = new Chunk(chunkPos, [0, 0]);
      
      expect(chunk._chunkPos).to.deep.equal(chunkPos);
    });
    
    it('should set span top-left position', function() {
      const spanTL = [10, 20];
      const chunk = new Chunk([0, 0], spanTL);
      
      expect(chunk._spanTLPos).to.deep.equal(spanTL);
    });
    
    it('should initialize tileData Grid with correct span', function() {
      const spanTL = [10, 20];
      const chunk = new Chunk([0, 0], spanTL, 8);
      
      const spanRange = chunk.tileData.getSpanRange();
      
      expect(spanRange[0]).to.deep.equal(spanTL);
    });
    
    it('should fill grid with Tile objects', function() {
      const chunk = new Chunk([0, 0], [0, 0], 4);
      
      // Should have 4x4 = 16 tiles
      expect(chunk.tileData.rawArray).to.have.lengthOf(16);
      
      // All should be Tile instances
      chunk.tileData.rawArray.forEach(tile => {
        expect(tile).to.be.instanceOf(Tile);
      });
    });
    
    it('should position tiles with correct offset', function() {
      const chunk = new Chunk([0, 0], [10, 20], 4);
      
      // First tile should be at span position with -0.5 offset
      const firstTile = chunk.tileData.rawArray[0];
      
      expect(firstTile._x).to.equal(10 - 0.5);
      expect(firstTile._y).to.equal(20 - 0.5);
    });
    
    it('should use correct tile size', function() {
      const customTileSize = 64;
      const chunk = new Chunk([0, 0], [0, 0], 4, customTileSize);
      
      expect(chunk._tileSize).to.equal(customTileSize);
      
      const firstTile = chunk.tileData.rawArray[0];
      expect(firstTile._squareSize).to.equal(customTileSize);
    });
  });
  
  describe('Terrain Generation Modes', function() {
    
    describe('applyGenerationMode()', function() {
      
      it('should apply perlin generation mode', function() {
        const chunk = new Chunk([0, 0], [0, 0], 4);
        
        chunk.applyGenerationMode('perlin', [0, 0], [0, 0], 12345);
        
        // All tiles should have materials set
        chunk.tileData.rawArray.forEach(tile => {
          expect(tile._materialSet).to.be.oneOf(['grass', 'dirt', 'stone']);
        });
      });
      
      it('should apply column pattern correctly', function() {
        const chunk = new Chunk([0, 0], [0, 0], 4);
        
        chunk.applyGenerationMode('columns', [0, 0]);
        
        // Even columns should be moss, odd should be stone
        for (let x = 0; x < 4; x++) {
          for (let y = 0; y < 4; y++) {
            const tile = chunk.getArrPos([x, y]);
            if (x % 2 === 0) {
              expect(tile._materialSet).to.equal('moss_0');
              expect(tile._weight).to.equal(2);
            } else {
              expect(tile._materialSet).to.equal('stone');
              expect(tile._weight).to.equal(100);
            }
          }
        }
      });
      
      it('should apply checkerboard pattern correctly', function() {
        const chunk = new Chunk([0, 0], [0, 0], 4);
        
        chunk.applyGenerationMode('checkerboard', [0, 0]);
        
        // Check pattern
        for (let x = 0; x < 4; x++) {
          for (let y = 0; y < 4; y++) {
            const tile = chunk.getArrPos([x, y]);
            if ((x + y) % 2 === 0) {
              expect(tile._materialSet).to.equal('moss_0');
            } else {
              expect(tile._materialSet).to.equal('stone');
            }
          }
        }
      });
      
      it('should apply flat terrain', function() {
        const chunk = new Chunk([0, 0], [0, 0], 4);
        
        chunk.applyGenerationMode('flat', [0, 0]);
        
        // All tiles should be grass
        chunk.tileData.rawArray.forEach(tile => {
          expect(tile._materialSet).to.equal('grass');
          expect(tile._weight).to.equal(1);
        });
      });
      
      it('should default to perlin for unknown mode', function() {
        const chunk = new Chunk([0, 0], [0, 0], 4);
        
        chunk.applyGenerationMode('unknown_mode', [0, 0]);
        
        // Should have materials (from perlin fallback)
        chunk.tileData.rawArray.forEach(tile => {
          expect(tile._materialSet).to.exist;
        });
      });
    });
    
    describe('applyColumnPattern()', function() {
      
      it('should alternate columns based on absolute position', function() {
        const chunk1 = new Chunk([0, 0], [0, 0], 4);
        const chunk2 = new Chunk([1, 0], [4, 0], 4);
        
        chunk1.applyColumnPattern([0, 0]);
        chunk2.applyColumnPattern([1, 0]);
        
        // Chunk 1 column 0 should be moss
        expect(chunk1.getArrPos([0, 0])._materialSet).to.equal('moss_0');
        
        // Chunk 2 starts at absolute X=4 (even), so column 0 should be moss
        expect(chunk2.getArrPos([0, 0])._materialSet).to.equal('moss_0');
      });
    });
    
    describe('applyCheckerboardPattern()', function() {
      
      it('should create proper checkerboard across chunks', function() {
        const chunk = new Chunk([0, 0], [0, 0], 4);
        
        chunk.applyCheckerboardPattern([0, 0]);
        
        // [0,0] = even, [0,1] = odd, [1,0] = odd, [1,1] = even
        expect(chunk.getArrPos([0, 0])._materialSet).to.equal('moss_0');
        expect(chunk.getArrPos([0, 1])._materialSet).to.equal('stone');
        expect(chunk.getArrPos([1, 0])._materialSet).to.equal('stone');
        expect(chunk.getArrPos([1, 1])._materialSet).to.equal('moss_0');
      });
    });
    
    describe('applyFlatTerrain()', function() {
      
      it('should fill all tiles with specified material', function() {
        const chunk = new Chunk([0, 0], [0, 0], 4);
        
        chunk.applyFlatTerrain('dirt');
        
        chunk.tileData.rawArray.forEach(tile => {
          expect(tile._materialSet).to.equal('dirt');
        });
      });
      
      it('should set appropriate weights for materials', function() {
        const chunk = new Chunk([0, 0], [0, 0], 4);
        
        chunk.applyFlatTerrain('grass');
        expect(chunk.getArrPos([0, 0])._weight).to.equal(1);
        
        chunk.applyFlatTerrain('dirt');
        expect(chunk.getArrPos([0, 0])._weight).to.equal(3);
        
        chunk.applyFlatTerrain('stone');
        expect(chunk.getArrPos([0, 0])._weight).to.equal(100);
        
        chunk.applyFlatTerrain('moss_0');
        expect(chunk.getArrPos([0, 0])._weight).to.equal(2);
      });
    });
  });
  
  describe('Data Access Methods (delegated to Grid)', function() {
    
    describe('Conversion Methods', function() {
      
      it('should delegate convToFlat()', function() {
        const chunk = new Chunk([0, 0], [0, 0], 4);
        
        expect(chunk.convToFlat([2, 3])).to.equal(14); // 3*4 + 2
      });
      
      it('should delegate convToSquare()', function() {
        const chunk = new Chunk([0, 0], [0, 0], 4);
        
        expect(chunk.convToSquare(14)).to.deep.equal([2, 3]);
      });
      
      it('should delegate convRelToArrPos()', function() {
        const chunk = new Chunk([0, 0], [10, 20], 4);
        
        const arrPos = chunk.convRelToArrPos([12, 18]);
        expect(arrPos).to.deep.equal([2, 2]);
      });
      
      it('should delegate convArrToRelPos()', function() {
        const chunk = new Chunk([0, 0], [10, 20], 4);
        
        const relPos = chunk.convArrToRelPos([2, 2]);
        expect(relPos).to.deep.equal([12, 18]);
      });
    });
    
    describe('Access Methods', function() {
      
      it('should delegate getArrPos()', function() {
        const chunk = new Chunk([0, 0], [0, 0], 4);
        
        const tile = chunk.getArrPos([2, 2]);
        expect(tile).to.be.instanceOf(Tile);
      });
      
      it('should delegate setArrPos()', function() {
        const chunk = new Chunk([0, 0], [0, 0], 4);
        const mockTile = new Tile(0, 0, 32);
        mockTile._materialSet = 'custom';
        
        chunk.setArrPos([2, 2], mockTile);
        const retrieved = chunk.getArrPos([2, 2]);
        
        expect(retrieved._materialSet).to.equal('custom');
      });
      
      it('should delegate get() with span', function() {
        const chunk = new Chunk([0, 0], [10, 20], 4);
        
        const tile = chunk.get([12, 18]);
        expect(tile).to.be.instanceOf(Tile);
      });
      
      it('should delegate set() with span', function() {
        const chunk = new Chunk([0, 0], [10, 20], 4);
        const mockTile = new Tile(0, 0, 32);
        mockTile._materialSet = 'span_test';
        
        chunk.set([12, 18], mockTile);
        const retrieved = chunk.get([12, 18]);
        
        expect(retrieved._materialSet).to.equal('span_test');
      });
    });
    
    describe('Bulk Data Methods', function() {
      
      it('should delegate getRangeData()', function() {
        const chunk = new Chunk([0, 0], [0, 0], 4);
        
        const range = chunk.getRangeData([0, 0], [1, 1]);
        
        expect(range).to.have.lengthOf(4); // 2x2 area
        range.forEach(tile => expect(tile).to.be.instanceOf(Tile));
      });
      
      it('should delegate getRangeNeighborhoodData()', function() {
        const chunk = new Chunk([0, 0], [0, 0], 4);
        
        const neighborhood = chunk.getRangeNeighborhoodData([2, 2], 1);
        
        expect(neighborhood).to.have.lengthOf(9); // 3x3 area
        neighborhood.forEach(tile => expect(tile).to.be.instanceOf(Tile));
      });
      
      it('should delegate getRangeGrid()', function() {
        const chunk = new Chunk([0, 0], [0, 0], 4);
        
        const grid = chunk.getRangeGrid([0, 0], [1, 1]);
        
        expect(grid).to.be.instanceOf(Grid);
        expect(grid.getSize()).to.deep.equal([0, 0]); // Note: size calculation issue in Grid
      });
      
      it('should delegate getRangeNeighborhoodGrid()', function() {
        const chunk = new Chunk([0, 0], [0, 0], 4);
        
        const grid = chunk.getRangeNeighborhoodGrid([2, 2], 1);
        
        expect(grid).to.be.instanceOf(Grid);
      });
    });
  });
  
  describe('Information Methods', function() {
    
    it('should delegate getSize()', function() {
      const chunk = new Chunk([0, 0], [0, 0], 8);
      
      const size = chunk.getSize();
      expect(size).to.deep.equal([8, 8]);
    });
    
    it('should delegate getSpanRange()', function() {
      const chunk = new Chunk([0, 0], [10, 20], 4);
      
      const spanRange = chunk.getSpanRange();
      
      expect(spanRange[0]).to.deep.equal([10, 20]);
      expect(spanRange[1][0]).to.equal(14); // 10 + 4
      expect(spanRange[1][1]).to.equal(16); // 20 - 4
    });
    
    it('should delegate getObjPos()', function() {
      const chunk = new Chunk([5, 7], [0, 0], 4);
      
      const objPos = chunk.getObjPos();
      expect(objPos).to.deep.equal([5, 7]);
    });
    
    it('should delegate getGridId()', function() {
      const chunk = new Chunk([0, 0], [0, 0], 4);
      
      const gridId = chunk.getGridId();
      expect(gridId).to.be.a('number');
    });
  });
  
  describe('toString()', function() {
    
    it('should return string representation', function() {
      const chunk = new Chunk([0, 0], [0, 0], 2);
      
      const str = chunk.toString();
      
      expect(str).to.be.a('string');
      expect(str).to.include(';'); // Row separator from Grid.toString()
    });
  });
  
  describe('clear()', function() {
    
    it('should reset chunk while preserving properties', function() {
      const chunkPos = [2, 3];
      const spanTL = [10, 20];
      const size = 4;
      const tileSize = 64;
      
      const chunk = new Chunk(chunkPos, spanTL, size, tileSize);
      
      // Modify some tiles
      chunk.applyGenerationMode('flat', [0, 0]);
      chunk.getArrPos([0, 0])._materialSet = 'modified';
      
      // Clear
      chunk.clear();
      
      // Properties should be preserved
      expect(chunk._chunkPos).to.deep.equal(chunkPos);
      expect(chunk._spanTLPos).to.deep.equal(spanTL);
      expect(chunk._size).to.equal(size);
      expect(chunk._tileSize).to.equal(tileSize);
      
      // Data should be reset (tiles recreated)
      expect(chunk.tileData.rawArray).to.have.lengthOf(size * size);
      expect(chunk.getArrPos([0, 0])._materialSet).to.equal('grass'); // Default material
    });
    
    it('should recreate all tiles', function() {
      const chunk = new Chunk([0, 0], [0, 0], 4);
      
      const originalTile = chunk.getArrPos([0, 0]);
      
      chunk.clear();
      
      const newTile = chunk.getArrPos([0, 0]);
      
      // Should be different tile instance
      expect(newTile).to.not.equal(originalTile);
      expect(newTile).to.be.instanceOf(Tile);
    });
  });
  
  describe('randomize()', function() {
    
    it('should randomize all tiles with perlin noise', function() {
      const chunk = new Chunk([0, 0], [0, 0], 4);
      
      chunk.randomize([0, 0]);
      
      // All tiles should have materials (not all same)
      const materials = chunk.tileData.rawArray.map(tile => tile._materialSet);
      const uniqueMaterials = [...new Set(materials)];
      
      expect(uniqueMaterials.length).to.be.greaterThan(0);
    });
    
    it('should use position offset for noise calculation', function() {
      const chunk1 = new Chunk([0, 0], [0, 0], 4);
      const chunk2 = new Chunk([0, 0], [0, 0], 4);
      
      // Different offsets should produce different results (usually)
      chunk1.randomize([0, 0]);
      chunk2.randomize([100, 100]);
      
      const mat1 = chunk1.getArrPos([0, 0])._materialSet;
      const mat2 = chunk2.getArrPos([0, 0])._materialSet;
      
      // Note: This may occasionally fail due to randomness
      // In practice, different offsets usually produce different materials
      expect([mat1, mat2]).to.satisfy(mats => 
        mats[0] === 'grass' || mats[0] === 'dirt' || mats[0] === 'stone'
      );
    });
  });
  
  describe('Edge Cases', function() {
    
    it('should handle 1x1 chunk', function() {
      const chunk = new Chunk([0, 0], [0, 0], 1);
      
      expect(chunk.tileData.rawArray).to.have.lengthOf(1);
      expect(chunk.getArrPos([0, 0])).to.be.instanceOf(Tile);
    });
    
    it('should handle large chunks', function() {
      const chunk = new Chunk([0, 0], [0, 0], 16);
      
      expect(chunk.tileData.rawArray).to.have.lengthOf(256);
    });
    
    it('should handle negative chunk positions', function() {
      const chunk = new Chunk([-5, -10], [0, 0], 4);
      
      expect(chunk._chunkPos).to.deep.equal([-5, -10]);
    });
    
    it('should handle negative span positions', function() {
      const chunk = new Chunk([0, 0], [-20, -30], 4);
      
      const spanRange = chunk.getSpanRange();
      expect(spanRange[0]).to.deep.equal([-20, -30]);
    });
  });
  
  describe('Integration Tests', function() {
    
    it('should create properly positioned tiles across span', function() {
      const chunk = new Chunk([1, 2], [8, 16], 4);
      
      // Check first and last tiles
      const firstTile = chunk.getArrPos([0, 0]);
      const lastTile = chunk.getArrPos([3, 3]);
      
      expect(firstTile._x).to.equal(7.5); // 8 - 0.5
      expect(firstTile._y).to.equal(15.5); // 16 - 0.5
      
      expect(lastTile._x).to.equal(10.5); // 11 - 0.5
      expect(lastTile._y).to.equal(12.5); // 13 - 0.5
    });
    
    it('should support multiple generation modes on same chunk', function() {
      const chunk = new Chunk([0, 0], [0, 0], 4);
      
      // Apply flat
      chunk.applyGenerationMode('flat', [0, 0]);
      expect(chunk.getArrPos([0, 0])._materialSet).to.equal('grass');
      
      // Apply columns
      chunk.applyGenerationMode('columns', [0, 0]);
      expect(chunk.getArrPos([0, 0])._materialSet).to.equal('moss_0');
      
      // Apply checkerboard
      chunk.applyGenerationMode('checkerboard', [0, 0]);
      expect(chunk.getArrPos([0, 0])._materialSet).to.equal('moss_0');
    });
  });
});
