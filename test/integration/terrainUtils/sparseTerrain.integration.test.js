/**
 * Integration Tests: SparseTerrain with TerrainEditor (TDD - Phase 1C)
 * 
 * Tests SparseTerrain integration with TerrainEditor and related systems.
 * 
 * TDD: Write FIRST before integration exists!
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('SparseTerrain Integration', function() {
  let terrain, editor, mockP5, dom;
  
  beforeEach(function() {
    // Setup JSDOM environment
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
    global.Map = Map;
    global.Math = Math;
    
    // Mock p5.js functions
    mockP5 = {
      createVector: sinon.stub().callsFake((x, y) => ({ x, y }))
    };
    global.createVector = mockP5.createVector;
    global.window.createVector = mockP5.createVector;
    
    // Load SparseTerrain
    const SparseTerrain = require('../../../Classes/terrainUtils/SparseTerrain');
    terrain = new SparseTerrain(32, 'grass');
    
    // Mock TerrainEditor (simplified for integration testing)
    editor = {
      terrain: terrain,
      currentMaterial: 'stone',
      brushSize: 1,
      undoStack: [],
      redoStack: []
    };
  });
  
  afterEach(function() {
    sinon.restore();
    // Clean up JSDOM
    if (dom && dom.window) {
      dom.window.close();
    }
    delete global.window;
    delete global.document;
  });
  
  describe('Painting Integration', function() {
    it('should paint to SparseTerrain when editor paints', function() {
      // Simulate painting at (10, 20)
      terrain.setTile(10, 20, editor.currentMaterial);
      
      const tile = terrain.getTile(10, 20);
      expect(tile).to.not.be.null;
      expect(tile.material).to.equal('stone');
    });
    
    it('should update bounding box when painting', function() {
      // Paint first tile
      terrain.setTile(0, 0, 'grass');
      expect(terrain.getBounds()).to.deep.equal({ minX: 0, maxX: 0, minY: 0, maxY: 0 });
      
      // Paint second tile - bounds should expand
      terrain.setTile(10, 15, 'stone');
      const bounds = terrain.getBounds();
      expect(bounds.minX).to.equal(0);
      expect(bounds.maxX).to.equal(10);
      expect(bounds.minY).to.equal(0);
      expect(bounds.maxY).to.equal(15);
    });
    
    it('should handle painting with different brush sizes', function() {
      // Simulate 3x3 brush at (5, 5)
      const brushSize = 3;
      const centerX = 5, centerY = 5;
      const halfSize = Math.floor(brushSize / 2);
      
      for (let y = centerY - halfSize; y <= centerY + halfSize; y++) {
        for (let x = centerX - halfSize; x <= centerX + halfSize; x++) {
          terrain.setTile(x, y, 'moss');
        }
      }
      
      expect(terrain.getTileCount()).to.equal(9);
      expect(terrain.getTile(4, 4).material).to.equal('moss'); // TL
      expect(terrain.getTile(6, 6).material).to.equal('moss'); // BR
    });
    
    it('should handle sparse painting (far apart tiles)', function() {
      terrain.setTile(0, 0, 'grass');
      terrain.setTile(1000, 1000, 'stone');
      terrain.setTile(-500, -500, 'water');
      
      // Only 3 tiles stored (not 1501 x 1501 = 2,253,001 tiles!)
      expect(terrain.getTileCount()).to.equal(3);
      
      // Bounds should be correct
      const bounds = terrain.getBounds();
      expect(bounds.minX).to.equal(-500);
      expect(bounds.maxX).to.equal(1000);
      expect(bounds.minY).to.equal(-500);
      expect(bounds.maxY).to.equal(1000);
    });
  });
  
  describe('Fill Tool Integration', function() {
    it('should work with sparse storage', function() {
      // Create a small island of tiles
      terrain.setTile(0, 0, 'grass');
      terrain.setTile(1, 0, 'grass');
      terrain.setTile(0, 1, 'grass');
      terrain.setTile(1, 1, 'grass');
      
      // Simulate fill changing all 'grass' to 'stone' in the area
      const tilesToFill = [];
      for (const tileData of terrain.getAllTiles()) {
        if (tileData.material === 'grass') {
          tilesToFill.push({ x: tileData.x, y: tileData.y });
        }
      }
      
      tilesToFill.forEach(({ x, y }) => {
        terrain.setTile(x, y, 'stone');
      });
      
      // All tiles should be 'stone' now
      expect(terrain.getTile(0, 0).material).to.equal('stone');
      expect(terrain.getTile(1, 1).material).to.equal('stone');
      expect(terrain.getTileCount()).to.equal(4); // Still 4 tiles
    });
  });
  
  describe('Eyedropper Integration', function() {
    it('should return null for unpainted tiles', function() {
      const tile = terrain.getTile(100, 100);
      expect(tile).to.be.null;
    });
    
    it('should return material for painted tiles', function() {
      terrain.setTile(5, 10, 'moss');
      
      const tile = terrain.getTile(5, 10);
      expect(tile).to.not.be.null;
      expect(tile.material).to.equal('moss');
    });
  });
  
  describe('Undo/Redo Integration', function() {
    it('should support undo by deleting tile', function() {
      // Paint tile
      terrain.setTile(10, 10, 'stone');
      expect(terrain.getTileCount()).to.equal(1);
      
      // Undo = delete tile
      const deleted = terrain.deleteTile(10, 10);
      expect(deleted).to.be.true;
      expect(terrain.getTileCount()).to.equal(0);
      expect(terrain.getBounds()).to.be.null;
    });
    
    it('should support redo by restoring tile', function() {
      // Original state
      terrain.setTile(5, 5, 'grass');
      const originalMaterial = 'grass';
      
      // Change (can be undone)
      terrain.setTile(5, 5, 'stone');
      
      // Undo (restore original)
      terrain.setTile(5, 5, originalMaterial);
      expect(terrain.getTile(5, 5).material).to.equal('grass');
    });
    
    it('should handle rapid undo/redo cycles', function() {
      // Paint
      terrain.setTile(0, 0, 'stone');
      expect(terrain.getTileCount()).to.equal(1);
      
      // Undo (delete)
      terrain.deleteTile(0, 0);
      expect(terrain.getTileCount()).to.equal(0);
      
      // Redo (restore)
      terrain.setTile(0, 0, 'stone');
      expect(terrain.getTileCount()).to.equal(1);
      
      // Undo again
      terrain.deleteTile(0, 0);
      expect(terrain.getTileCount()).to.equal(0);
    });
  });
  
  describe('JSON Export/Import Integration', function() {
    it('should export only painted tiles (sparse format)', function() {
      // Paint scattered tiles
      terrain.setTile(0, 0, 'grass');
      terrain.setTile(50, 50, 'stone');
      terrain.setTile(100, 100, 'water');
      
      const json = terrain.exportToJSON();
      
      // Should only have 3 tiles, not 101*101 = 10,201
      expect(json.tiles).to.have.lengthOf(3);
      expect(json.tileCount).to.equal(3);
      
      // Verify sparse data
      const coords = json.tiles.map(t => [t.x, t.y]);
      expect(coords).to.deep.include([0, 0]);
      expect(coords).to.deep.include([50, 50]);
      expect(coords).to.deep.include([100, 100]);
    });
    
    it('should reconstruct terrain from JSON', function() {
      // Create terrain
      terrain.setTile(-10, -10, 'dirt');
      terrain.setTile(20, 30, 'moss');
      
      // Export
      const json = terrain.exportToJSON();
      
      // Create new terrain and import
      const SparseTerrain = require('../../../Classes/terrainUtils/SparseTerrain');
      const newTerrain = new SparseTerrain();
      newTerrain.importFromJSON(json);
      
      // Should match original
      expect(newTerrain.getTileCount()).to.equal(2);
      expect(newTerrain.getTile(-10, -10).material).to.equal('dirt');
      expect(newTerrain.getTile(20, 30).material).to.equal('moss');
    });
    
    it('should preserve bounds when importing', function() {
      // Create terrain with specific bounds
      terrain.setTile(-100, -50, 'grass');
      terrain.setTile(200, 150, 'stone');
      
      const json = terrain.exportToJSON();
      
      // Import to new terrain
      const SparseTerrain = require('../../../Classes/terrainUtils/SparseTerrain');
      const newTerrain = new SparseTerrain();
      newTerrain.importFromJSON(json);
      
      // Bounds should match
      const bounds = newTerrain.getBounds();
      expect(bounds.minX).to.equal(-100);
      expect(bounds.maxX).to.equal(200);
      expect(bounds.minY).to.equal(-50);
      expect(bounds.maxY).to.equal(150);
    });
    
    it('should clear existing tiles before import', function() {
      // Terrain has existing data
      terrain.setTile(999, 999, 'dirt');
      expect(terrain.getTileCount()).to.equal(1);
      
      // Import different data
      const json = {
        tileSize: 32,
        defaultMaterial: 'grass',
        tiles: [
          { x: 0, y: 0, material: 'stone' }
        ]
      };
      
      terrain.importFromJSON(json);
      
      // Old tile should be gone
      expect(terrain.getTile(999, 999)).to.be.null;
      expect(terrain.getTileCount()).to.equal(1);
      expect(terrain.getTile(0, 0).material).to.equal('stone');
    });
  });
  
  describe('Rendering Integration', function() {
    it('should provide efficient iteration for rendering', function() {
      // Paint some tiles
      terrain.setTile(0, 0, 'grass');
      terrain.setTile(1, 0, 'stone');
      terrain.setTile(0, 1, 'water');
      
      // Collect all tiles via iteration
      const renderedTiles = [];
      for (const tileData of terrain.getAllTiles()) {
        renderedTiles.push(tileData);
      }
      
      expect(renderedTiles).to.have.lengthOf(3);
      
      // Each should have x, y, material
      renderedTiles.forEach(tile => {
        expect(tile).to.have.property('x');
        expect(tile).to.have.property('y');
        expect(tile).to.have.property('material');
      });
    });
    
    it('should handle empty terrain gracefully', function() {
      const tiles = Array.from(terrain.getAllTiles());
      expect(tiles).to.have.lengthOf(0);
      expect(terrain.getBounds()).to.be.null;
    });
  });
  
  describe('Performance Characteristics', function() {
    it('should scale with painted tiles, not total grid size', function() {
      // Paint 100 tiles scattered across huge area
      for (let i = 0; i < 100; i++) {
        const x = i * 1000; // Very far apart
        const y = i * 1000;
        terrain.setTile(x, y, 'grass');
      }
      
      // Should only store 100 tiles
      expect(terrain.getTileCount()).to.equal(100);
      
      // If this was a dense grid, it would be 99,000 x 99,000 = 9.8 billion tiles!
      // But with sparse storage: just 100 tiles
    });
    
    it('should maintain O(1) tile access', function() {
      // Paint tiles
      terrain.setTile(0, 0, 'grass');
      terrain.setTile(1000000, 1000000, 'stone');
      
      // Access should be instant (Map.get is O(1))
      const tile1 = terrain.getTile(0, 0);
      const tile2 = terrain.getTile(1000000, 1000000);
      const tile3 = terrain.getTile(500000, 500000); // unpainted
      
      expect(tile1.material).to.equal('grass');
      expect(tile2.material).to.equal('stone');
      expect(tile3).to.be.null;
    });
  });
});
