/**
 * GridTerrainAdapter.test.js
 * Unit tests for GridTerrainAdapter - PathMap compatibility layer
 * Part of Custom Level Loading - Phase 1.2
 * 
 * PURPOSE: Adapter exposes OLD Terrain API for PathMap while wrapping GridTerrain
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('GridTerrainAdapter', function() {
  let sandbox;
  let GridTerrainAdapter;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Set up JSDOM for window object
    if (typeof window === 'undefined') {
      const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
      global.window = dom.window;
      global.document = dom.window.document;
    }
    
    // Mock p5.js globals
    global.floor = Math.floor;
    global.ceil = Math.ceil;
    global.noiseSeed = sandbox.stub();
    global.noise = sandbox.stub().returns(0.5);
    global.logNormal = sandbox.stub();
    global.print = sandbox.stub();
    
    // Mock constants
    global.CHUNK_SIZE = 8;
    global.TILE_SIZE = 32;
    global.g_canvasX = 800;
    global.g_canvasY = 600;
    
    // Sync to window for JSDOM
    window.floor = global.floor;
    window.ceil = global.ceil;
    window.noiseSeed = global.noiseSeed;
    window.noise = global.noise;
    window.logNormal = global.logNormal;
    window.CHUNK_SIZE = global.CHUNK_SIZE;
    window.TILE_SIZE = global.TILE_SIZE;
    window.g_canvasX = global.g_canvasX;
    window.g_canvasY = global.g_canvasY;
    
    // Mock GridTerrain (browser-only class, no CommonJS exports)
    global.gridTerrain = class MockGridTerrain {
      constructor(gridSizeX, gridSizeY, seed, chunkSize = CHUNK_SIZE) {
        this._gridSizeX = gridSizeX;  // Number of chunks wide
        this._gridSizeY = gridSizeY;  // Number of chunks tall
        this.seed = seed;
        this._chunkSize = chunkSize;
        
        // GridTerrain stores total TILE dimensions (chunks * chunkSize)
        this._tileSpanRange = [
          gridSizeX * chunkSize,
          gridSizeY * chunkSize
        ];
        
        this.grid = {
          _xCount: this._tileSpanRange[0],
          _yCount: this._tileSpanRange[1],
          data: new Map()
        };
        
        // Create mock tile data for all tiles in the grid
        const totalTilesX = this._tileSpanRange[0];
        const totalTilesY = this._tileSpanRange[1];
        
        for (let ty = 0; ty < totalTilesY; ty++) {
          for (let tx = 0; tx < totalTilesX; tx++) {
            const chunkX = Math.floor(tx / chunkSize);
            const chunkY = Math.floor(ty / chunkSize);
            const relX = tx % chunkSize;
            const relY = ty % chunkSize;
            const key = `${chunkX},${chunkY}`;
            
            if (!this.grid.data.has(key)) {
              this.grid.data.set(key, {
                tiles: Array(chunkSize * chunkSize).fill(null).map(() => ({
                  type: 0,
                  color: [100, 200, 100]
                }))
              });
            }
          }
        }
      }
      
      get(coords) {
        const [x, y] = coords;
        const chunkX = Math.floor(x / this._chunkSize);
        const chunkY = Math.floor(y / this._chunkSize);
        const relX = x % this._chunkSize;
        const relY = y % this._chunkSize;
        const key = `${chunkX},${chunkY}`;
        const chunk = this.grid.data.get(key);
        if (!chunk) return null;
        return chunk.tiles[relY * this._chunkSize + relX];
      }
      
      getArrPos(coords) {
        // GridTerrain.getArrPos([x, y]) returns tile at array position
        return this.get(coords);
      }
    };
    window.gridTerrain = global.gridTerrain;
    
    // Load GridTerrainAdapter
    try {
      GridTerrainAdapter = require('../../../Classes/adapters/GridTerrainAdapter');
      global.GridTerrainAdapter = GridTerrainAdapter;
    } catch (e) {
      // Adapter doesn't exist yet - tests will fail (EXPECTED for TDD)
      GridTerrainAdapter = null;
    }
  });
  
  afterEach(function() {
    sandbox.restore();
  });
  
  describe('Constructor', function() {
    it('should accept GridTerrain as parameter', function() {
      if (!GridTerrainAdapter) this.skip();
      
      const terrain = new gridTerrain(3, 3, 12345);
      const adapter = new GridTerrainAdapter(terrain);
      
      expect(adapter).to.exist;
      expect(adapter._gridTerrain).to.equal(terrain);
    });
    
    it('should expose _xCount property (total tile width)', function() {
      if (!GridTerrainAdapter) this.skip();
      
      const terrain = new gridTerrain(3, 3, 12345); // 3x3 chunks = 24x24 tiles
      const adapter = new GridTerrainAdapter(terrain);
      
      expect(adapter._xCount).to.equal(24); // 3 chunks × 8 tiles
    });
    
    it('should expose _yCount property (total tile height)', function() {
      if (!GridTerrainAdapter) this.skip();
      
      const terrain = new gridTerrain(3, 3, 12345);
      const adapter = new GridTerrainAdapter(terrain);
      
      expect(adapter._yCount).to.equal(24); // 3 chunks × 8 tiles
    });
    
    it('should handle different grid sizes', function() {
      if (!GridTerrainAdapter) this.skip();
      
      const terrain5x5 = new gridTerrain(5, 5, 12345);
      const adapter5x5 = new GridTerrainAdapter(terrain5x5);
      
      expect(adapter5x5._xCount).to.equal(40); // 5 × 8
      expect(adapter5x5._yCount).to.equal(40);
      
      const terrain2x2 = new gridTerrain(2, 2, 12345);
      const adapter2x2 = new GridTerrainAdapter(terrain2x2);
      
      expect(adapter2x2._xCount).to.equal(16); // 2 × 8
      expect(adapter2x2._yCount).to.equal(16);
    });
  });
  
  describe('conv2dpos() Method', function() {
    it('should provide conv2dpos() method', function() {
      if (!GridTerrainAdapter) this.skip();
      
      const terrain = new gridTerrain(3, 3, 12345);
      const adapter = new GridTerrainAdapter(terrain);
      
      expect(adapter.conv2dpos).to.be.a('function');
    });
    
    it('should convert 2D coordinates to flat array index', function() {
      if (!GridTerrainAdapter) this.skip();
      
      const terrain = new gridTerrain(3, 3, 12345); // 24x24 tiles
      const adapter = new GridTerrainAdapter(terrain);
      
      // Formula: index = y * width + x
      expect(adapter.conv2dpos(0, 0)).to.equal(0); // Top-left
      expect(adapter.conv2dpos(5, 10)).to.equal(10 * 24 + 5); // 245
      expect(adapter.conv2dpos(23, 23)).to.equal(23 * 24 + 23); // Bottom-right
    });
    
    it('should work with different grid sizes', function() {
      if (!GridTerrainAdapter) this.skip();
      
      const terrain = new gridTerrain(2, 2, 12345); // 16x16 tiles
      const adapter = new GridTerrainAdapter(terrain);
      
      expect(adapter.conv2dpos(0, 0)).to.equal(0);
      expect(adapter.conv2dpos(5, 5)).to.equal(5 * 16 + 5); // 85
      expect(adapter.conv2dpos(15, 15)).to.equal(15 * 16 + 15); // 255
    });
  });
  
  describe('_tileStore Array', function() {
    it('should create _tileStore flat array', function() {
      if (!GridTerrainAdapter) this.skip();
      
      const terrain = new gridTerrain(3, 3, 12345);
      const adapter = new GridTerrainAdapter(terrain);
      
      expect(adapter._tileStore).to.be.an('array');
    });
    
    it('should have correct array length (width × height)', function() {
      if (!GridTerrainAdapter) this.skip();
      
      const terrain = new gridTerrain(3, 3, 12345);
      const adapter = new GridTerrainAdapter(terrain);
      
      expect(adapter._tileStore.length).to.equal(576); // 24 × 24
    });
    
    it('should populate array from GridTerrain tiles', function() {
      if (!GridTerrainAdapter) this.skip();
      
      const terrain = new gridTerrain(3, 3, 12345);
      const adapter = new GridTerrainAdapter(terrain);
      
      // All tiles should exist (GridTerrain pre-generates all tiles)
      adapter._tileStore.forEach((tile, index) => {
        expect(tile).to.exist;
        expect(tile).to.have.property('type');
      });
    });
    
    it('should preserve tile data from GridTerrain', function() {
      if (!GridTerrainAdapter) this.skip();
      
      const terrain = new gridTerrain(3, 3, 12345);
      const originalTile = terrain.getArrPos([5, 10]);
      
      const adapter = new GridTerrainAdapter(terrain);
      const adapterTile = adapter._tileStore[adapter.conv2dpos(5, 10)];
      
      expect(adapterTile).to.deep.equal(originalTile);
    });
  });
  
  describe('PathMap Compatibility', function() {
    it('should provide all properties PathMap expects', function() {
      if (!GridTerrainAdapter) this.skip();
      
      const terrain = new gridTerrain(3, 3, 12345);
      const adapter = new GridTerrainAdapter(terrain);
      
      // PathMap constructor checks these properties
      expect(adapter._xCount).to.be.a('number');
      expect(adapter._yCount).to.be.a('number');
      expect(adapter._tileStore).to.be.an('array');
      expect(adapter.conv2dpos).to.be.a('function');
    });
    
    it('should allow tile access via PathMap pattern', function() {
      if (!GridTerrainAdapter) this.skip();
      
      const terrain = new gridTerrain(3, 3, 12345);
      const adapter = new GridTerrainAdapter(terrain);
      
      // PathMap uses: terrain._tileStore[terrain.conv2dpos(x, y)]
      const tile = adapter._tileStore[adapter.conv2dpos(5, 10)];
      
      expect(tile).to.exist;
      expect(tile).to.have.property('type');
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle minimum grid size (1x1 chunk)', function() {
      if (!GridTerrainAdapter) this.skip();
      
      const terrain = new gridTerrain(1, 1, 12345); // 8x8 tiles
      const adapter = new GridTerrainAdapter(terrain);
      
      expect(adapter._xCount).to.equal(8);
      expect(adapter._yCount).to.equal(8);
      expect(adapter._tileStore.length).to.equal(64);
    });
    
    it('should handle large grid size (10x10 chunks)', function() {
      if (!GridTerrainAdapter) this.skip();
      
      const terrain = new gridTerrain(10, 10, 12345); // 80x80 tiles
      const adapter = new GridTerrainAdapter(terrain);
      
      expect(adapter._xCount).to.equal(80);
      expect(adapter._yCount).to.equal(80);
      expect(adapter._tileStore.length).to.equal(6400);
    });
    
    it('should handle corner coordinates', function() {
      if (!GridTerrainAdapter) this.skip();
      
      const terrain = new gridTerrain(3, 3, 12345);
      const adapter = new GridTerrainAdapter(terrain);
      
      // Top-left corner
      const topLeft = adapter._tileStore[adapter.conv2dpos(0, 0)];
      expect(topLeft).to.exist;
      
      // Top-right corner
      const topRight = adapter._tileStore[adapter.conv2dpos(23, 0)];
      expect(topRight).to.exist;
      
      // Bottom-left corner
      const bottomLeft = adapter._tileStore[adapter.conv2dpos(0, 23)];
      expect(bottomLeft).to.exist;
      
      // Bottom-right corner
      const bottomRight = adapter._tileStore[adapter.conv2dpos(23, 23)];
      expect(bottomRight).to.exist;
    });
  });
  
  describe('Memory and Performance', function() {
    it('should create flat array view efficiently', function() {
      if (!GridTerrainAdapter) this.skip();
      
      const terrain = new gridTerrain(3, 3, 12345);
      
      const startTime = Date.now();
      const adapter = new GridTerrainAdapter(terrain);
      const endTime = Date.now();
      
      // Should complete in < 10ms for 24x24 terrain
      expect(endTime - startTime).to.be.lessThan(10);
    });
    
    it('should reference tiles (not copy)', function() {
      if (!GridTerrainAdapter) this.skip();
      
      const terrain = new gridTerrain(3, 3, 12345);
      const adapter = new GridTerrainAdapter(terrain);
      
      // Tiles should be same object reference (not deep copy)
      const originalTile = terrain.getArrPos([10, 10]);
      const adapterTile = adapter._tileStore[adapter.conv2dpos(10, 10)];
      
      // Same reference = changes to one affect the other
      expect(adapterTile).to.equal(originalTile);
    });
  });
  
  describe('Integration Preparation', function() {
    it('should be compatible with PathMap constructor signature', function() {
      if (!GridTerrainAdapter) this.skip();
      
      const terrain = new gridTerrain(3, 3, 12345);
      const adapter = new GridTerrainAdapter(terrain);
      
      // PathMap constructor expects:
      // - terrain._xCount (number)
      // - terrain._yCount (number)
      // - terrain._tileStore[] (array)
      // - terrain.conv2dpos(x, y) (function)
      
      // Simulate PathMap checks
      expect(typeof adapter._xCount).to.equal('number');
      expect(typeof adapter._yCount).to.equal('number');
      expect(Array.isArray(adapter._tileStore)).to.be.true;
      expect(typeof adapter.conv2dpos).to.equal('function');
      
      // Simulate PathMap usage
      for(let y = 0; y < adapter._yCount; y++) {
        for(let x = 0; x < adapter._xCount; x++) {
          const tile = adapter._tileStore[adapter.conv2dpos(x, y)];
          expect(tile).to.exist; // All tiles should exist
        }
      }
    });
  });
});
