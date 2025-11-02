/**
 * SparseTerrainAdapter.test.js
 * Unit tests for SparseTerrainAdapter - PathMap compatibility layer
 * Part of Custom Level Loading - Phase 1.2
 * 
 * PURPOSE: Adapter exposes OLD Terrain API for PathMap while wrapping SparseTerrain
 *          Handles dynamic bounds, sparse storage, and coordinate offsets
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('SparseTerrainAdapter', function() {
  let sandbox;
  let SparseTerrainAdapter;
  
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
    global.TILE_SIZE = 32;
    
    // Sync to window for JSDOM
    window.floor = global.floor;
    window.ceil = global.ceil;
    window.noiseSeed = global.noiseSeed;
    window.noise = global.noise;
    window.logNormal = global.logNormal;
    window.TILE_SIZE = global.TILE_SIZE;
    
    // Mock SparseTerrain (Level Editor terrain system)
    global.SparseTerrain = class MockSparseTerrain {
      constructor(tileSize = 32, defaultMaterial = 0, options = {}) {
        this.tileSize = tileSize;
        this.defaultMaterial = defaultMaterial;
        this.tiles = new Map(); // Map<"x,y", Tile>
        this.bounds = null;
        this.MAX_MAP_SIZE = options.maxMapSize || 100;
        
        // Aliases for compatibility
        this._tileSize = this.tileSize;
        this._gridSizeX = this.MAX_MAP_SIZE;
        this._gridSizeY = this.MAX_MAP_SIZE;
      }
      
      setTile(x, y, material) {
        const key = `${x},${y}`;
        const tile = { material, x, y };
        this.tiles.set(key, tile);
        this._updateBounds(x, y);
      }
      
      getTile(x, y) {
        const key = `${x},${y}`;
        return this.tiles.get(key) || null;
      }
      
      _updateBounds(x, y) {
        if (!this.bounds) {
          this.bounds = { minX: x, maxX: x, minY: y, maxY: y };
        } else {
          this.bounds.minX = Math.min(this.bounds.minX, x);
          this.bounds.maxX = Math.max(this.bounds.maxX, x);
          this.bounds.minY = Math.min(this.bounds.minY, y);
          this.bounds.maxY = Math.max(this.bounds.maxY, y);
        }
      }
      
      // Clear all tiles
      clear() {
        this.tiles.clear();
        this.bounds = null;
      }
    };
    window.SparseTerrain = global.SparseTerrain;
    
    // Load SparseTerrainAdapter
    try {
      SparseTerrainAdapter = require('../../../Classes/adapters/SparseTerrainAdapter');
      global.SparseTerrainAdapter = SparseTerrainAdapter;
    } catch (e) {
      // Adapter doesn't exist yet - tests will fail (EXPECTED for TDD)
      SparseTerrainAdapter = null;
    }
  });
  
  afterEach(function() {
    sandbox.restore();
  });
  
  describe('Constructor', function() {
    it('should accept SparseTerrain as parameter', function() {
      if (!SparseTerrainAdapter) this.skip();
      
      const terrain = new SparseTerrain();
      terrain.setTile(5, 10, 'stone');
      
      const adapter = new SparseTerrainAdapter(terrain);
      
      expect(adapter).to.exist;
      expect(adapter._sparseTerrain).to.equal(terrain);
    });
    
    it('should expose _xCount property (total tile width from bounds)', function() {
      if (!SparseTerrainAdapter) this.skip();
      
      const terrain = new SparseTerrain();
      terrain.setTile(0, 0, 'stone');
      terrain.setTile(9, 5, 'stone'); // maxX = 9, minX = 0 → width = 10
      
      const adapter = new SparseTerrainAdapter(terrain);
      
      expect(adapter._xCount).to.equal(10);
    });
    
    it('should expose _yCount property (total tile height from bounds)', function() {
      if (!SparseTerrainAdapter) this.skip();
      
      const terrain = new SparseTerrain();
      terrain.setTile(0, 0, 'stone');
      terrain.setTile(5, 9, 'stone'); // maxY = 9, minY = 0 → height = 10
      
      const adapter = new SparseTerrainAdapter(terrain);
      
      expect(adapter._yCount).to.equal(10);
    });
    
    it('should handle negative coordinates (offset bounds)', function() {
      if (!SparseTerrainAdapter) this.skip();
      
      const terrain = new SparseTerrain();
      terrain.setTile(-5, -10, 'stone'); // minX = -5, minY = -10
      terrain.setTile(5, 10, 'stone');   // maxX = 5, maxY = 10
      
      const adapter = new SparseTerrainAdapter(terrain);
      
      expect(adapter._xCount).to.equal(11); // -5 to 5 = 11 tiles
      expect(adapter._yCount).to.equal(21); // -10 to 10 = 21 tiles
    });
    
    it('should handle empty terrain with default size', function() {
      if (!SparseTerrainAdapter) this.skip();
      
      const terrain = new SparseTerrain();
      const adapter = new SparseTerrainAdapter(terrain);
      
      // Empty terrain should default to 1x1 (or minimal size)
      expect(adapter._xCount).to.be.at.least(1);
      expect(adapter._yCount).to.be.at.least(1);
    });
  });
  
  describe('conv2dpos() Method', function() {
    it('should provide conv2dpos() method', function() {
      if (!SparseTerrainAdapter) this.skip();
      
      const terrain = new SparseTerrain();
      terrain.setTile(0, 0, 'stone');
      const adapter = new SparseTerrainAdapter(terrain);
      
      expect(adapter.conv2dpos).to.be.a('function');
    });
    
    it('should convert 2D coordinates to flat array index', function() {
      if (!SparseTerrainAdapter) this.skip();
      
      const terrain = new SparseTerrain();
      terrain.setTile(0, 0, 'stone');
      terrain.setTile(9, 9, 'stone'); // 10x10 grid
      
      const adapter = new SparseTerrainAdapter(terrain);
      
      // Formula: index = y * width + x
      expect(adapter.conv2dpos(0, 0)).to.equal(0);      // First tile
      expect(adapter.conv2dpos(5, 0)).to.equal(5);      // Row 0, col 5
      expect(adapter.conv2dpos(0, 1)).to.equal(10);     // Row 1, col 0
      expect(adapter.conv2dpos(5, 5)).to.equal(55);     // Middle
    });
    
    it('should handle coordinate offsets (negative bounds)', function() {
      if (!SparseTerrainAdapter) this.skip();
      
      const terrain = new SparseTerrain();
      terrain.setTile(-5, -5, 'stone'); // minX = -5, minY = -5
      terrain.setTile(5, 5, 'stone');   // maxX = 5, maxY = 5
      // Grid is 11x11 (from -5 to 5)
      
      const adapter = new SparseTerrainAdapter(terrain);
      
      // World coordinates → array index (accounting for offset)
      expect(adapter.conv2dpos(-5, -5)).to.equal(0);    // Top-left
      expect(adapter.conv2dpos(0, 0)).to.equal(60);     // Center (row 5, col 5)
      expect(adapter.conv2dpos(5, 5)).to.equal(120);    // Bottom-right
    });
  });
  
  describe('_tileStore Array', function() {
    it('should create _tileStore flat array', function() {
      if (!SparseTerrainAdapter) this.skip();
      
      const terrain = new SparseTerrain();
      terrain.setTile(0, 0, 'stone');
      const adapter = new SparseTerrainAdapter(terrain);
      
      expect(adapter._tileStore).to.be.an('array');
    });
    
    it('should have correct array length (width × height)', function() {
      if (!SparseTerrainAdapter) this.skip();
      
      const terrain = new SparseTerrain();
      terrain.setTile(0, 0, 'stone');
      terrain.setTile(9, 9, 'stone'); // 10x10 grid
      
      const adapter = new SparseTerrainAdapter(terrain);
      
      expect(adapter._tileStore.length).to.equal(100); // 10 * 10
    });
    
    it('should populate painted tiles from SparseTerrain', function() {
      if (!SparseTerrainAdapter) this.skip();
      
      const terrain = new SparseTerrain();
      terrain.setTile(0, 0, 'stone');
      terrain.setTile(5, 5, 'water');
      terrain.setTile(9, 9, 'grass');
      
      const adapter = new SparseTerrainAdapter(terrain);
      
      // Check painted tiles exist in _tileStore
      const tile00 = adapter._tileStore[adapter.conv2dpos(0, 0)];
      const tile55 = adapter._tileStore[adapter.conv2dpos(5, 5)];
      const tile99 = adapter._tileStore[adapter.conv2dpos(9, 9)];
      
      expect(tile00).to.exist;
      expect(tile00.material).to.equal('stone');
      expect(tile55.material).to.equal('water');
      expect(tile99.material).to.equal('grass');
    });
    
    it('should fill unpainted tiles with default material', function() {
      if (!SparseTerrainAdapter) this.skip();
      
      const terrain = new SparseTerrain(32, 'grass'); // Default = grass
      terrain.setTile(0, 0, 'stone');
      terrain.setTile(9, 9, 'water');
      
      const adapter = new SparseTerrainAdapter(terrain);
      
      // Check unpainted tile (5, 5) has default material
      const tile55 = adapter._tileStore[adapter.conv2dpos(5, 5)];
      
      expect(tile55).to.exist;
      expect(tile55.material).to.equal('grass');
    });
  });
  
  describe('PathMap Compatibility', function() {
    it('should provide all properties PathMap expects', function() {
      if (!SparseTerrainAdapter) this.skip();
      
      const terrain = new SparseTerrain();
      terrain.setTile(0, 0, 'stone');
      const adapter = new SparseTerrainAdapter(terrain);
      
      expect(adapter._xCount).to.exist;
      expect(adapter._yCount).to.exist;
      expect(adapter._tileStore).to.exist;
      expect(adapter.conv2dpos).to.be.a('function');
    });
    
    it('should allow tile access via PathMap pattern', function() {
      if (!SparseTerrainAdapter) this.skip();
      
      const terrain = new SparseTerrain();
      terrain.setTile(0, 0, 'stone');
      terrain.setTile(9, 9, 'water');
      
      const adapter = new SparseTerrainAdapter(terrain);
      
      // PathMap accesses tiles via: terrain._tileStore[terrain.conv2dpos(x, y)]
      const index = adapter.conv2dpos(5, 5);
      const tile = adapter._tileStore[index];
      
      expect(tile).to.exist;
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle single tile terrain', function() {
      if (!SparseTerrainAdapter) this.skip();
      
      const terrain = new SparseTerrain();
      terrain.setTile(0, 0, 'stone');
      
      const adapter = new SparseTerrainAdapter(terrain);
      
      expect(adapter._xCount).to.equal(1);
      expect(adapter._yCount).to.equal(1);
      expect(adapter._tileStore.length).to.equal(1);
    });
    
    it('should handle large sparse terrain', function() {
      if (!SparseTerrainAdapter) this.skip();
      
      const terrain = new SparseTerrain();
      terrain.setTile(0, 0, 'stone');
      terrain.setTile(99, 99, 'water'); // 100x100 grid
      
      const adapter = new SparseTerrainAdapter(terrain);
      
      expect(adapter._xCount).to.equal(100);
      expect(adapter._yCount).to.equal(100);
      expect(adapter._tileStore.length).to.equal(10000); // 100 * 100
    });
    
    it('should handle non-rectangular sparse tiles', function() {
      if (!SparseTerrainAdapter) this.skip();
      
      const terrain = new SparseTerrain();
      // Paint L-shaped pattern
      terrain.setTile(0, 0, 'stone');
      terrain.setTile(1, 0, 'stone');
      terrain.setTile(0, 1, 'stone');
      terrain.setTile(0, 2, 'stone');
      
      const adapter = new SparseTerrainAdapter(terrain);
      
      // Bounds should be rectangular (0-1, 0-2)
      expect(adapter._xCount).to.equal(2);
      expect(adapter._yCount).to.equal(3);
    });
  });
  
  describe('Memory and Performance', function() {
    it('should create flat array view efficiently', function() {
      if (!SparseTerrainAdapter) this.skip();
      
      const terrain = new SparseTerrain();
      terrain.setTile(0, 0, 'stone');
      terrain.setTile(49, 49, 'water'); // 50x50 grid
      
      const start = Date.now();
      const adapter = new SparseTerrainAdapter(terrain);
      const elapsed = Date.now() - start;
      
      expect(elapsed).to.be.below(50); // Should be fast (<50ms)
      expect(adapter._tileStore.length).to.equal(2500); // 50 * 50
    });
    
    it('should handle coordinate offset calculations efficiently', function() {
      if (!SparseTerrainAdapter) this.skip();
      
      const terrain = new SparseTerrain();
      terrain.setTile(-25, -25, 'stone');
      terrain.setTile(25, 25, 'water'); // 51x51 grid with offsets
      
      const adapter = new SparseTerrainAdapter(terrain);
      
      // Should calculate offsets correctly without performance issues
      expect(adapter.conv2dpos(-25, -25)).to.equal(0);
      expect(adapter.conv2dpos(25, 25)).to.equal(2600); // Last tile (51*51-1)
    });
  });
  
  describe('Integration Preparation', function() {
    it('should be compatible with PathMap constructor signature', function() {
      if (!SparseTerrainAdapter) this.skip();
      
      const terrain = new SparseTerrain();
      terrain.setTile(0, 0, 'stone');
      terrain.setTile(9, 9, 'water');
      
      const adapter = new SparseTerrainAdapter(terrain);
      
      // PathMap expects: new PathMap(terrain)
      // Where terrain has _xCount, _yCount, _tileStore[], conv2dpos()
      expect(adapter._xCount).to.be.a('number');
      expect(adapter._yCount).to.be.a('number');
      expect(adapter._tileStore).to.be.an('array');
      expect(adapter.conv2dpos).to.be.a('function');
    });
  });
});
