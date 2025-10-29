/**
 * @file SparseTerrainCompatibility.test.js
 * @description Unit tests for SparseTerrain compatibility layer with TerrainEditor
 * 
 * Tests ensure SparseTerrain provides the same interface as CustomTerrain for TerrainEditor.
 * 
 * TerrainEditor Requirements:
 * - getArrPos([x, y]) - returns tile object with getMaterial(), setMaterial(), assignWeight()
 * - invalidateCache() - called after terrain changes
 * - _tileSize, _gridSizeX, _gridSizeY, _chunkSize - properties for bounds checking
 * 
 * @see Classes/terrainUtils/SparseTerrain.js
 * @see Classes/terrainUtils/TerrainEditor.js
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Mock window for browser globals
if (typeof window === 'undefined') {
  global.window = {};
}

// Load SparseTerrain
const SparseTerrain = require('../../../Classes/terrainUtils/SparseTerrain.js');

describe('SparseTerrain Compatibility Layer', function() {
  let terrain;
  
  beforeEach(function() {
    terrain = new SparseTerrain(32, 'dirt');
  });
  
  afterEach(function() {
    sinon.restore();
  });

  describe('Compatibility Properties', function() {
    it('should have _tileSize property', function() {
      expect(terrain._tileSize).to.equal(32);
    });

    it('should have _gridSizeX property', function() {
      // For SparseTerrain, grid size should be MAX_MAP_SIZE
      expect(terrain._gridSizeX).to.be.a('number');
      expect(terrain._gridSizeX).to.be.greaterThan(0);
    });

    it('should have _gridSizeY property', function() {
      expect(terrain._gridSizeY).to.be.a('number');
      expect(terrain._gridSizeY).to.be.greaterThan(0);
    });

    it('should have _chunkSize property', function() {
      // For compatibility, chunk size should be 1 (no chunking in SparseTerrain)
      expect(terrain._chunkSize).to.equal(1);
    });

    it('should calculate grid size from MAX_MAP_SIZE', function() {
      // _gridSizeX * _chunkSize should equal MAX_MAP_SIZE
      expect(terrain._gridSizeX * terrain._chunkSize).to.equal(terrain.MAX_MAP_SIZE);
      expect(terrain._gridSizeY * terrain._chunkSize).to.equal(terrain.MAX_MAP_SIZE);
    });
  });

  describe('getArrPos([x, y]) - Tile Object Interface', function() {
    it('should return tile object for painted tile', function() {
      terrain.setTile(5, 10, 'moss');
      const tile = terrain.getArrPos([5, 10]);
      
      expect(tile).to.be.an('object');
      expect(tile.getMaterial).to.be.a('function');
      expect(tile.setMaterial).to.be.a('function');
      expect(tile.assignWeight).to.be.a('function');
    });

    it('should return tile object for unpainted tile (default material)', function() {
      const tile = terrain.getArrPos([0, 0]);
      
      expect(tile).to.be.an('object');
      expect(tile.getMaterial()).to.equal('dirt'); // defaultMaterial
    });

    it('should return tile with correct material', function() {
      terrain.setTile(3, 7, 'stone');
      const tile = terrain.getArrPos([3, 7]);
      
      expect(tile.getMaterial()).to.equal('stone');
    });

    it('tile.setMaterial() should update terrain', function() {
      const tile = terrain.getArrPos([2, 4]);
      tile.setMaterial('grass');
      
      expect(terrain.getTile(2, 4).material).to.equal('grass');
    });

    it('tile.assignWeight() should be no-op (compatibility)', function() {
      const tile = terrain.getArrPos([1, 1]);
      expect(() => tile.assignWeight()).to.not.throw();
    });

    it('should handle negative coordinates', function() {
      terrain.setTile(-5, -10, 'sand');
      const tile = terrain.getArrPos([-5, -10]);
      
      expect(tile.getMaterial()).to.equal('sand');
    });

    it('should throw error for array format other than [x, y]', function() {
      expect(() => terrain.getArrPos([1])).to.throw();
      expect(() => terrain.getArrPos([1, 2, 3])).to.throw();
    });

    it('should accept array with exactly 2 elements', function() {
      expect(() => terrain.getArrPos([0, 0])).to.not.throw();
    });
  });

  describe('invalidateCache() - Cache Invalidation', function() {
    it('should have invalidateCache method', function() {
      expect(terrain.invalidateCache).to.be.a('function');
    });

    it('should not throw when called', function() {
      expect(() => terrain.invalidateCache()).to.not.throw();
    });

    it('should be callable multiple times', function() {
      terrain.invalidateCache();
      terrain.invalidateCache();
      terrain.invalidateCache();
      expect(() => terrain.invalidateCache()).to.not.throw();
    });

    it('should maintain terrain integrity after invalidation', function() {
      terrain.setTile(5, 5, 'moss');
      terrain.invalidateCache();
      
      expect(terrain.getTile(5, 5).material).to.equal('moss');
    });
  });

  describe('TerrainEditor Integration Pattern', function() {
    it('should support paint workflow', function() {
      // Simulate TerrainEditor._isInBounds
      const maxX = terrain._gridSizeX * terrain._chunkSize;
      const maxY = terrain._gridSizeY * terrain._chunkSize;
      const x = 10, y = 20;
      const isInBounds = x >= 0 && x < maxX && y >= 0 && y < maxY;
      
      expect(isInBounds).to.be.true;
      
      // Simulate TerrainEditor.paintTile
      const tile = terrain.getArrPos([x, y]);
      const oldMaterial = tile.getMaterial();
      tile.setMaterial('moss');
      tile.assignWeight();
      terrain.invalidateCache();
      
      expect(terrain.getTile(x, y).material).to.equal('moss');
    });

    it('should support fill workflow', function() {
      // Paint starting tile
      terrain.setTile(5, 5, 'grass');
      
      // Simulate fill tool
      const targetTile = terrain.getArrPos([5, 5]);
      const targetMaterial = targetTile.getMaterial();
      
      expect(targetMaterial).to.equal('grass');
      
      // Change material
      targetTile.setMaterial('stone');
      terrain.invalidateCache();
      
      expect(terrain.getTile(5, 5).material).to.equal('stone');
    });

    it('should support undo workflow', function() {
      // Initial state
      const x = 7, y = 9;
      const tile = terrain.getArrPos([x, y]);
      const oldMaterial = tile.getMaterial();
      
      // Paint
      tile.setMaterial('moss');
      terrain.invalidateCache();
      expect(terrain.getTile(x, y).material).to.equal('moss');
      
      // Undo (restore old material)
      tile.setMaterial(oldMaterial);
      terrain.invalidateCache();
      expect(terrain.getTile(x, y).material).to.equal(oldMaterial);
    });

    it('should support brush size workflow', function() {
      // Simulate brush size 3 (3x3 square)
      const centerX = 10, centerY = 10;
      const brushRadius = Math.floor(3 / 2); // 1
      
      for (let dy = -brushRadius; dy <= brushRadius; dy++) {
        for (let dx = -brushRadius; dx <= brushRadius; dx++) {
          const x = centerX + dx;
          const y = centerY + dy;
          
          const tile = terrain.getArrPos([x, y]);
          tile.setMaterial('sand');
          tile.assignWeight();
        }
      }
      
      terrain.invalidateCache();
      
      // Verify center and corners
      expect(terrain.getTile(10, 10).material).to.equal('sand'); // center
      expect(terrain.getTile(9, 9).material).to.equal('sand');   // top-left
      expect(terrain.getTile(11, 11).material).to.equal('sand'); // bottom-right
    });
  });

  describe('Tile Object Persistence', function() {
    it('should return same tile object for same coordinates', function() {
      const tile1 = terrain.getArrPos([5, 5]);
      const tile2 = terrain.getArrPos([5, 5]);
      
      // Should be different objects (new wrapper each time)
      expect(tile1).to.not.equal(tile2);
      
      // But should have same material
      expect(tile1.getMaterial()).to.equal(tile2.getMaterial());
    });

    it('should reflect changes immediately', function() {
      const tile1 = terrain.getArrPos([3, 3]);
      tile1.setMaterial('grass');
      
      const tile2 = terrain.getArrPos([3, 3]);
      expect(tile2.getMaterial()).to.equal('grass');
    });
  });

  describe('Edge Cases', function() {
    it('should handle coordinates at MAX_MAP_SIZE boundary', function() {
      const maxCoord = terrain.MAX_MAP_SIZE - 1;
      const success = terrain.setTile(maxCoord, maxCoord, 'stone');
      
      expect(success).to.be.true;
      const tile = terrain.getArrPos([maxCoord, maxCoord]);
      expect(tile.getMaterial()).to.equal('stone');
    });

    it('should handle coordinates beyond MAX_MAP_SIZE', function() {
      // Paint first tile at origin
      terrain.setTile(0, 0, 'grass');
      
      // Now try to paint at MAX_MAP_SIZE - this creates 1001x1001 grid
      const beyondMax = terrain.MAX_MAP_SIZE;
      const success = terrain.setTile(beyondMax, beyondMax, 'stone');
      
      expect(success).to.be.false; // Rejected (would create 1001x1001 grid)
      
      // getArrPos should still return tile object (for compatibility)
      const tile = terrain.getArrPos([beyondMax, beyondMax]);
      expect(tile).to.be.an('object');
      expect(tile.getMaterial()).to.equal('dirt'); // default (not painted)
    });

    it('should handle mixed painted and unpainted tiles', function() {
      terrain.setTile(5, 5, 'moss');
      
      const painted = terrain.getArrPos([5, 5]);
      const unpainted = terrain.getArrPos([10, 10]);
      
      expect(painted.getMaterial()).to.equal('moss');
      expect(unpainted.getMaterial()).to.equal('dirt');
    });
  });
});
