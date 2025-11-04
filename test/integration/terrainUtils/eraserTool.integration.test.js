/**
 * Integration Tests - Eraser Tool with Real Terrain Systems
 * Tests TerrainEditor.erase() with SparseTerrain and gridTerrain
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupTestEnvironment, cleanupTestEnvironment } = require('../../helpers/mvcTestHelpers');

// Setup test environment with rendering support
setupTestEnvironment({ rendering: true });

describe('TerrainEditor - Eraser Tool (Integration)', function() {

  afterEach(function() {
    cleanupTestEnvironment();
  });
  let TerrainEditor, SparseTerrain;
  
  before(function() {
    // Load modules
    const TerrainEditorModule = require('../../../Classes/terrainUtils/TerrainEditor.js');
    TerrainEditor = TerrainEditorModule.TerrainEditor || TerrainEditorModule;
    global.TerrainEditor = TerrainEditor;
    window.TerrainEditor = TerrainEditor;
    
    const SparseTerrainModule = require('../../../Classes/terrainUtils/SparseTerrain.js');
    SparseTerrain = SparseTerrainModule.SparseTerrain || SparseTerrainModule;
    global.SparseTerrain = SparseTerrain;
    window.SparseTerrain = SparseTerrain;
  });
  
  afterEach(function() {
    cleanupTestEnvironment();
  });
  
  after(function() {
    delete global.TerrainEditor;
    delete global.SparseTerrain;
  });

  describe('Erase with SparseTerrain', function() {
    let terrain, editor;
    
    beforeEach(function() {
      terrain = new SparseTerrain(32, 'grass');
      editor = new TerrainEditor(terrain);
    });
    
    it('should erase single painted tile', function() {
      // Paint a tile
      terrain.setTile(10, 10, 'moss');
      expect(terrain.getTile(10, 10)).to.not.be.null;
      expect(terrain.getTileCount()).to.equal(1);
      
      // Erase the tile
      const count = editor.erase(10, 10, 1);
      
      expect(count).to.equal(1);
      expect(terrain.getTile(10, 10)).to.be.null;
      expect(terrain.getTileCount()).to.equal(0);
    });
    
    it('should erase multiple tiles with brush size 3', function() {
      // Paint 3x3 area
      for (let y = 9; y <= 11; y++) {
        for (let x = 9; x <= 11; x++) {
          terrain.setTile(x, y, 'stone');
        }
      }
      expect(terrain.getTileCount()).to.equal(9);
      
      // Erase with brush size 3
      const count = editor.erase(10, 10, 3);
      
      expect(count).to.equal(9);
      expect(terrain.getTileCount()).to.equal(0);
    });
    
    it('should undo erase operation', function() {
      // Paint and erase
      terrain.setTile(5, 5, 'dirt');
      editor.erase(5, 5, 1);
      expect(terrain.getTile(5, 5)).to.be.null;
      
      // Undo
      editor.undo();
      
      const restoredTile = terrain.getTile(5, 5);
      expect(restoredTile).to.not.be.null;
      expect(restoredTile.material).to.equal('dirt');
    });
    
    it('should redo erase operation', function() {
      // Paint, erase, undo
      terrain.setTile(7, 7, 'sand');
      editor.erase(7, 7, 1);
      editor.undo();
      expect(terrain.getTile(7, 7)).to.not.be.null;
      
      // Redo
      editor.redo();
      
      expect(terrain.getTile(7, 7)).to.be.null;
    });
    
    it('should handle partial erase at bounds', function() {
      // Paint tiles at corner
      terrain.setTile(0, 0, 'moss');
      terrain.setTile(1, 0, 'moss');
      terrain.setTile(0, 1, 'moss');
      terrain.setTile(1, 1, 'moss');
      expect(terrain.getTileCount()).to.equal(4);
      
      // Erase with brush size 3 at corner (only 4 tiles in bounds)
      const count = editor.erase(0, 0, 3);
      
      expect(count).to.equal(4); // Only erased in-bounds tiles
      expect(terrain.getTileCount()).to.equal(0);
    });
    
    it('should update bounds after erase', function() {
      // Paint tiles
      terrain.setTile(5, 5, 'moss');
      terrain.setTile(10, 10, 'stone');
      expect(terrain.bounds).to.deep.equal({ minX: 5, maxX: 10, minY: 5, maxY: 10 });
      
      // Erase edge tile
      editor.erase(10, 10, 1);
      
      // Bounds should recalculate
      expect(terrain.bounds).to.deep.equal({ minX: 5, maxX: 5, minY: 5, maxY: 5 });
    });
  });

  describe('Undo/Redo with Multiple Operations', function() {
    let terrain, editor;
    
    beforeEach(function() {
      terrain = new SparseTerrain(32, 'grass');
      editor = new TerrainEditor(terrain);
    });
    
    it('should handle paint-erase-undo-redo cycle', function() {
      // Paint tile
      terrain.setTile(10, 10, 'moss');
      expect(terrain.getTileCount()).to.equal(1);
      
      // Erase tile
      editor.erase(10, 10, 1);
      expect(terrain.getTileCount()).to.equal(0);
      
      // Undo erase
      editor.undo();
      expect(terrain.getTileCount()).to.equal(1);
      expect(terrain.getTile(10, 10).material).to.equal('moss');
      
      // Redo erase
      editor.redo();
      expect(terrain.getTileCount()).to.equal(0);
    });
    
    it('should handle multiple erase operations in history', function() {
      // Paint multiple tiles
      terrain.setTile(5, 5, 'moss');
      terrain.setTile(10, 10, 'stone');
      terrain.setTile(15, 15, 'dirt');
      
      // Erase one by one
      editor.erase(5, 5, 1);
      editor.erase(10, 10, 1);
      editor.erase(15, 15, 1);
      expect(terrain.getTileCount()).to.equal(0);
      
      // Undo all erases
      editor.undo(); // Restore 15, 15
      expect(terrain.getTileCount()).to.equal(1);
      editor.undo(); // Restore 10, 10
      expect(terrain.getTileCount()).to.equal(2);
      editor.undo(); // Restore 5, 5
      expect(terrain.getTileCount()).to.equal(3);
      
      // Verify materials
      expect(terrain.getTile(5, 5).material).to.equal('moss');
      expect(terrain.getTile(10, 10).material).to.equal('stone');
      expect(terrain.getTile(15, 15).material).to.equal('dirt');
    });
  });

  describe('Brush Size Integration', function() {
    let terrain, editor;
    
    beforeEach(function() {
      terrain = new SparseTerrain(32, 'grass');
      editor = new TerrainEditor(terrain);
    });
    
    it('should erase with brush size 5 (5x5 area)', function() {
      // Paint 5x5 area centered at (10, 10)
      for (let y = 8; y <= 12; y++) {
        for (let x = 8; x <= 12; x++) {
          terrain.setTile(x, y, 'moss');
        }
      }
      expect(terrain.getTileCount()).to.equal(25);
      
      // Erase with brush size 5
      const count = editor.erase(10, 10, 5);
      
      expect(count).to.equal(25);
      expect(terrain.getTileCount()).to.equal(0);
    });
    
    it('should erase centered pattern', function() {
      // Paint 5x5 grid
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          terrain.setTile(x, y, 'stone');
        }
      }
      
      // Erase center 3x3
      const count = editor.erase(2, 2, 3);
      
      expect(count).to.equal(9);
      expect(terrain.getTileCount()).to.equal(16); // 25 - 9 = 16
      
      // Verify corners still exist
      expect(terrain.getTile(0, 0)).to.not.be.null;
      expect(terrain.getTile(4, 0)).to.not.be.null;
      expect(terrain.getTile(0, 4)).to.not.be.null;
      expect(terrain.getTile(4, 4)).to.not.be.null;
      
      // Verify center is gone
      expect(terrain.getTile(2, 2)).to.be.null;
    });
  });

  describe('Performance with Large Erase Operations', function() {
    let terrain, editor;
    
    beforeEach(function() {
      terrain = new SparseTerrain(32, 'grass');
      editor = new TerrainEditor(terrain);
    });
    
    it('should handle erasing 100 tiles efficiently', function() {
      // Paint 10x10 area
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          terrain.setTile(x, y, 'moss');
        }
      }
      expect(terrain.getTileCount()).to.equal(100);
      
      const startTime = Date.now();
      
      // Erase all 100 tiles
      const count = editor.erase(4, 4, 10); // 10x10 brush won't fully cover, try multiple
      
      const duration = Date.now() - startTime;
      
      expect(duration).to.be.lessThan(100); // Should complete in <100ms
      expect(count).to.be.greaterThan(0);
    });
  });

  describe('Edge Cases', function() {
    let terrain, editor;
    
    beforeEach(function() {
      terrain = new SparseTerrain(32, 'grass');
      editor = new TerrainEditor(terrain);
    });
    
    it('should return 0 when erasing empty area', function() {
      const count = editor.erase(10, 10, 3);
      expect(count).to.equal(0);
    });
    
    it('should respect bounds checking for out-of-bounds coordinates', function() {
      // SparseTerrain has bounds 0 to MAX_MAP_SIZE-1 (default 0-99)
      // Negative coordinates are out of bounds
      terrain.setTile(50, 50, 'moss'); // Valid tile
      
      // Try to erase out of bounds - should return 0
      const count = editor.erase(-5, -5, 1);
      
      expect(count).to.equal(0); // Nothing erased
      expect(terrain.getTileCount()).to.equal(1); // Original tile still exists
    });
    
    it('should not add to history when no tiles erased', function() {
      expect(editor.canUndo()).to.be.false;
      
      editor.erase(10, 10, 1); // Erase empty area
      
      expect(editor.canUndo()).to.be.false; // No history entry
    });
  });
});
