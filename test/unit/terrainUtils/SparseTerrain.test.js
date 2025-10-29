/**
 * Unit Tests: SparseTerrain (TDD - Phase 1A)
 * 
 * Tests sparse tile storage system for lazy terrain loading.
 * 
 * TDD: Write FIRST before implementation exists!
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('SparseTerrain', function() {
  let terrain;
  
  beforeEach(function() {
    // SparseTerrain doesn't exist yet - tests will fail (EXPECTED)
    const SparseTerrain = require('../../../Classes/terrainUtils/SparseTerrain');
    terrain = new SparseTerrain(32, 'grass');
  });
  
  describe('Constructor', function() {
    it('should initialize with empty tile map', function() {
      expect(terrain.tiles).to.be.instanceOf(Map);
      expect(terrain.tiles.size).to.equal(0);
    });
    
    it('should set tileSize', function() {
      expect(terrain.tileSize).to.equal(32);
    });
    
    it('should set default material', function() {
      expect(terrain.defaultMaterial).to.equal('grass');
    });
    
    it('should initialize bounds as null', function() {
      expect(terrain.bounds).to.be.null;
    });
  });
  
  describe('setTile()', function() {
    it('should store tile at positive coordinates', function() {
      terrain.setTile(10, 20, 'stone');
      
      const tile = terrain.getTile(10, 20);
      expect(tile).to.not.be.null;
      expect(tile.material).to.equal('stone');
    });
    
    it('should store tile at negative coordinates', function() {
      terrain.setTile(-5, -10, 'water');
      
      const tile = terrain.getTile(-5, -10);
      expect(tile).to.not.be.null;
      expect(tile.material).to.equal('water');
    });
    
    it('should store tile at origin (0, 0)', function() {
      terrain.setTile(0, 0, 'dirt');
      
      const tile = terrain.getTile(0, 0);
      expect(tile).to.not.be.null;
      expect(tile.material).to.equal('dirt');
    });
    
    it('should handle very large coordinates', function() {
      terrain.setTile(1000000, 1000000, 'sand');
      
      const tile = terrain.getTile(1000000, 1000000);
      expect(tile).to.not.be.null;
      expect(tile.material).to.equal('sand');
    });
    
    it('should update existing tile', function() {
      terrain.setTile(5, 5, 'grass');
      terrain.setTile(5, 5, 'stone');
      
      const tile = terrain.getTile(5, 5);
      expect(tile.material).to.equal('stone');
      expect(terrain.tiles.size).to.equal(1); // Should not create duplicate
    });
    
    it('should increment tile count', function() {
      expect(terrain.getTileCount()).to.equal(0);
      
      terrain.setTile(0, 0, 'grass');
      expect(terrain.getTileCount()).to.equal(1);
      
      terrain.setTile(1, 1, 'stone');
      expect(terrain.getTileCount()).to.equal(2);
    });
    
    it('should update bounds when tile added', function() {
      terrain.setTile(10, 20, 'grass');
      
      const bounds = terrain.getBounds();
      expect(bounds).to.not.be.null;
      expect(bounds.minX).to.equal(10);
      expect(bounds.maxX).to.equal(10);
      expect(bounds.minY).to.equal(20);
      expect(bounds.maxY).to.equal(20);
    });
    
    it('should expand bounds when tile added at edge', function() {
      terrain.setTile(5, 5, 'grass');
      terrain.setTile(10, 10, 'stone');
      terrain.setTile(-3, -3, 'water');
      
      const bounds = terrain.getBounds();
      expect(bounds.minX).to.equal(-3);
      expect(bounds.maxX).to.equal(10);
      expect(bounds.minY).to.equal(-3);
      expect(bounds.maxY).to.equal(10);
    });
  });
  
  describe('getTile()', function() {
    it('should return null for unpainted coordinates', function() {
      const tile = terrain.getTile(50, 50);
      expect(tile).to.be.null;
    });
    
    it('should retrieve painted tile', function() {
      terrain.setTile(7, 7, 'moss');
      
      const tile = terrain.getTile(7, 7);
      expect(tile).to.not.be.null;
      expect(tile.material).to.equal('moss');
    });
    
    it('should handle negative coordinate retrieval', function() {
      terrain.setTile(-10, -20, 'dirt');
      
      const tile = terrain.getTile(-10, -20);
      expect(tile).to.not.be.null;
      expect(tile.material).to.equal('dirt');
    });
  });
  
  describe('deleteTile()', function() {
    it('should remove tile from storage', function() {
      terrain.setTile(5, 5, 'grass');
      expect(terrain.getTileCount()).to.equal(1);
      
      terrain.deleteTile(5, 5);
      
      expect(terrain.getTileCount()).to.equal(0);
      expect(terrain.getTile(5, 5)).to.be.null;
    });
    
    it('should recalculate bounds after deletion', function() {
      terrain.setTile(0, 0, 'grass');
      terrain.setTile(10, 10, 'stone');
      terrain.setTile(5, 5, 'water');
      
      // Delete edge tile
      terrain.deleteTile(10, 10);
      
      const bounds = terrain.getBounds();
      expect(bounds.maxX).to.equal(5);
      expect(bounds.maxY).to.equal(5);
    });
    
    it('should set bounds to null when last tile deleted', function() {
      terrain.setTile(5, 5, 'grass');
      terrain.deleteTile(5, 5);
      
      expect(terrain.getBounds()).to.be.null;
    });
    
    it('should handle deleting non-existent tile gracefully', function() {
      expect(() => terrain.deleteTile(100, 100)).to.not.throw();
      expect(terrain.getTileCount()).to.equal(0);
    });
  });
  
  describe('getTileCount()', function() {
    it('should return 0 when no tiles painted', function() {
      expect(terrain.getTileCount()).to.equal(0);
    });
    
    it('should return correct count after painting', function() {
      terrain.setTile(0, 0, 'grass');
      terrain.setTile(1, 1, 'stone');
      terrain.setTile(2, 2, 'water');
      
      expect(terrain.getTileCount()).to.equal(3);
    });
    
    it('should decrement after deletion', function() {
      terrain.setTile(0, 0, 'grass');
      terrain.setTile(1, 1, 'stone');
      
      terrain.deleteTile(0, 0);
      
      expect(terrain.getTileCount()).to.equal(1);
    });
  });
  
  describe('getBounds()', function() {
    it('should return null when no tiles painted', function() {
      expect(terrain.getBounds()).to.be.null;
    });
    
    it('should return bounds for single tile', function() {
      terrain.setTile(5, 10, 'grass');
      
      const bounds = terrain.getBounds();
      expect(bounds).to.deep.equal({
        minX: 5,
        maxX: 5,
        minY: 10,
        maxY: 10
      });
    });
    
    it('should return bounds for multiple tiles', function() {
      terrain.setTile(0, 0, 'grass');
      terrain.setTile(100, 50, 'stone');
      terrain.setTile(-20, -10, 'water');
      
      const bounds = terrain.getBounds();
      expect(bounds.minX).to.equal(-20);
      expect(bounds.maxX).to.equal(100);
      expect(bounds.minY).to.equal(-10);
      expect(bounds.maxY).to.equal(50);
    });
    
    it('should handle widely separated tiles', function() {
      terrain.setTile(0, 0, 'grass');
      terrain.setTile(1000000, 1000000, 'stone');
      
      const bounds = terrain.getBounds();
      expect(bounds.minX).to.equal(0);
      expect(bounds.maxX).to.equal(1000000);
      expect(bounds.minY).to.equal(0);
      expect(bounds.maxY).to.equal(1000000);
    });
  });
  
  describe('getAllTiles()', function() {
    it('should return empty array when no tiles', function() {
      const tiles = Array.from(terrain.getAllTiles());
      expect(tiles).to.have.lengthOf(0);
    });
    
    it('should return all painted tiles', function() {
      terrain.setTile(0, 0, 'grass');
      terrain.setTile(1, 1, 'stone');
      terrain.setTile(2, 2, 'water');
      
      const tiles = Array.from(terrain.getAllTiles());
      expect(tiles).to.have.lengthOf(3);
    });
    
    it('should return tiles with coordinates', function() {
      terrain.setTile(5, 10, 'moss');
      
      const tiles = Array.from(terrain.getAllTiles());
      expect(tiles[0]).to.have.property('x', 5);
      expect(tiles[0]).to.have.property('y', 10);
      expect(tiles[0]).to.have.property('material', 'moss');
    });
  });
  
  describe('exportToJSON()', function() {
    it('should export empty array when no tiles', function() {
      const json = terrain.exportToJSON();
      expect(json.tiles).to.be.an('array').with.lengthOf(0);
    });
    
    it('should export only painted tiles', function() {
      terrain.setTile(0, 0, 'grass');
      terrain.setTile(10, 10, 'stone');
      
      const json = terrain.exportToJSON();
      expect(json.tiles).to.have.lengthOf(2);
      expect(json.tiles[0]).to.deep.include({ x: 0, y: 0, material: 'grass' });
      expect(json.tiles[1]).to.deep.include({ x: 10, y: 10, material: 'stone' });
    });
    
    it('should include metadata', function() {
      const json = terrain.exportToJSON();
      expect(json).to.have.property('tileSize', 32);
      expect(json).to.have.property('defaultMaterial', 'grass');
    });
    
    it('should be sparse (no default tiles)', function() {
      // Paint only 3 tiles in a large area
      terrain.setTile(0, 0, 'grass');
      terrain.setTile(50, 50, 'stone');
      terrain.setTile(100, 100, 'water');
      
      const json = terrain.exportToJSON();
      
      // Should only have 3 tiles, not 101*101 = 10,201 tiles
      expect(json.tiles).to.have.lengthOf(3);
    });
  });
  
  describe('importFromJSON()', function() {
    it('should import tiles from JSON', function() {
      const data = {
        tileSize: 32,
        defaultMaterial: 'grass',
        tiles: [
          { x: 0, y: 0, material: 'stone' },
          { x: 5, y: 5, material: 'water' }
        ]
      };
      
      terrain.importFromJSON(data);
      
      expect(terrain.getTileCount()).to.equal(2);
      expect(terrain.getTile(0, 0).material).to.equal('stone');
      expect(terrain.getTile(5, 5).material).to.equal('water');
    });
    
    it('should calculate bounds from imported tiles', function() {
      const data = {
        tileSize: 32,
        defaultMaterial: 'grass',
        tiles: [
          { x: -10, y: -10, material: 'grass' },
          { x: 50, y: 50, material: 'stone' }
        ]
      };
      
      terrain.importFromJSON(data);
      
      const bounds = terrain.getBounds();
      expect(bounds.minX).to.equal(-10);
      expect(bounds.maxX).to.equal(50);
    });
    
    it('should clear existing tiles before import', function() {
      terrain.setTile(100, 100, 'dirt');
      
      const data = {
        tileSize: 32,
        defaultMaterial: 'grass',
        tiles: [
          { x: 0, y: 0, material: 'grass' }
        ]
      };
      
      terrain.importFromJSON(data);
      
      expect(terrain.getTileCount()).to.equal(1);
      expect(terrain.getTile(100, 100)).to.be.null;
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle (0, 0) correctly', function() {
      terrain.setTile(0, 0, 'grass');
      expect(terrain.getTile(0, 0).material).to.equal('grass');
    });
    
    it('should handle maximum safe integer coordinates', function() {
      const maxSafe = Number.MAX_SAFE_INTEGER;
      terrain.setTile(maxSafe, maxSafe, 'stone');
      
      expect(terrain.getTile(maxSafe, maxSafe).material).to.equal('stone');
    });
    
    it('should handle sparse painting (far apart tiles)', function() {
      terrain.setTile(0, 0, 'grass');
      terrain.setTile(1000, 1000, 'stone');
      terrain.setTile(-500, -500, 'water');
      
      expect(terrain.getTileCount()).to.equal(3);
      
      const bounds = terrain.getBounds();
      expect(bounds.minX).to.equal(-500);
      expect(bounds.maxX).to.equal(1000);
    });
    
    it('should handle rapid add/delete cycles', function() {
      for (let i = 0; i < 100; i++) {
        terrain.setTile(i, i, 'grass');
      }
      expect(terrain.getTileCount()).to.equal(100);
      
      for (let i = 0; i < 100; i++) {
        terrain.deleteTile(i, i);
      }
      expect(terrain.getTileCount()).to.equal(0);
      expect(terrain.getBounds()).to.be.null;
    });
  });
});
