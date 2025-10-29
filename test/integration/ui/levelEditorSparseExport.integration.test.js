/**
 * Integration Tests: Level Editor Sparse Export
 * 
 * Tests for complete export workflow with SparseTerrain.
 * Verifies empty tiles do NOT export as default material.
 * 
 * Phase: Level Editor Sparse Export Fix
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Load required classes directly
const SparseTerrain = require('../../../Classes/terrainUtils/SparseTerrain');
const TerrainEditor = require('../../../Classes/terrainUtils/TerrainEditor');

describe('Level Editor - Sparse Export (Integration)', function() {
  
  describe('Paint and Export Workflow', function() {
    it('should export only painted tiles', function() {
      const terrain = new SparseTerrain(32, 'grass');
      const editor = new TerrainEditor(terrain);
      
      // Paint some tiles
      editor.selectMaterial('stone');
      editor.paintTile(0, 0);
      editor.paintTile(160, 160); // Grid position (5, 5)
      
      editor.selectMaterial('moss');
      editor.paintTile(320, 320); // Grid position (10, 10)
      
      // Export
      const exported = terrain.exportToJSON();
      
      // Should only have 3 tiles
      expect(exported.tiles).to.have.lengthOf(3);
      expect(exported.tileCount).to.equal(3);
      
      // Should NOT have 100*100 = 10,000 tiles
      expect(exported.tiles.length).to.be.lessThan(100);
    });
    
    it('should NOT include empty tiles with default material', function() {
      const terrain = new SparseTerrain(32, 'dirt'); // Default is "dirt"
      const editor = new TerrainEditor(terrain);
      
      // Paint only one tile
      editor.selectMaterial('stone');
      editor.paintTile(0, 0);
      
      // Export
      const exported = terrain.exportToJSON();
      
      // Should only have 1 tile
      expect(exported.tiles).to.have.lengthOf(1);
      
      // Should NOT have tiles with "dirt" material at unpainted positions
      const dirtTiles = exported.tiles.filter(t => t.material === 'dirt');
      expect(dirtTiles).to.have.lengthOf(0);
    });
    
    it('should preserve exact painted positions', function() {
      const terrain = new SparseTerrain(32, 'grass');
      const editor = new TerrainEditor(terrain);
      
      // Paint specific pattern
      editor.selectMaterial('stone');
      editor.paintTile(0, 0);     // (0, 0)
      editor.paintTile(32, 0);    // (1, 0)
      editor.paintTile(0, 32);    // (0, 1)
      editor.paintTile(32, 32);   // (1, 1)
      
      // Export
      const exported = terrain.exportToJSON();
      
      // Should have exactly 4 tiles
      expect(exported.tiles).to.have.lengthOf(4);
      
      // Verify positions
      const coords = exported.tiles.map(t => `${t.x},${t.y}`);
      expect(coords).to.include.members(['0,0', '1,0', '0,1', '1,1']);
    });
  });
  
  describe('Fill Tool Export', function() {
    it('should export filled region sparsely', function() {
      const terrain = new SparseTerrain(32, 'grass');
      const editor = new TerrainEditor(terrain);
      
      // Paint individual tiles to form a pattern
      editor.selectMaterial('water');
      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
          editor.paintTile(x * 32, y * 32);
        }
      }
      
      // Export
      const exported = terrain.exportToJSON();
      
      // Should have 9 tiles (3x3)
      expect(exported.tiles).to.have.lengthOf(9);
      
      // All should be water
      const allWater = exported.tiles.every(t => t.material === 'water');
      expect(allWater).to.be.true;
    });
  });
  
  describe('Import/Export Round Trip', function() {
    it('should preserve sparse data through full cycle', function() {
      // Create and paint terrain
      const terrain1 = new SparseTerrain(32, 'grass');
      const editor1 = new TerrainEditor(terrain1);
      
      editor1.selectMaterial('stone');
      editor1.paintTile(0, 0);
      editor1.paintTile(320, 320); // Grid (10, 10)
      
      editor1.selectMaterial('moss');
      editor1.paintTile(640, 640); // Grid (20, 20)
      
      // Export
      const exported = terrain1.exportToJSON();
      
      // Verify sparse export
      expect(exported.tiles).to.have.lengthOf(3);
      
      // Import into new terrain
      const terrain2 = new SparseTerrain();
      terrain2.importFromJSON(exported);
      
      // Verify imported terrain
      expect(terrain2.getTileCount()).to.equal(3);
      expect(terrain2.getTile(0, 0).material).to.equal('stone');
      expect(terrain2.getTile(10, 10).material).to.equal('stone');
      expect(terrain2.getTile(20, 20).material).to.equal('moss');
      
      // Verify empty tiles are null
      expect(terrain2.getTile(5, 5)).to.be.null;
      expect(terrain2.getTile(15, 15)).to.be.null;
    });
  });
  
  describe('Metadata Preservation', function() {
    it('should include correct metadata in export', function() {
      const terrain = new SparseTerrain(32, 'sand', { maxMapSize: 150 });
      const editor = new TerrainEditor(terrain);
      
      editor.selectMaterial('stone');
      editor.paintTile(0, 0);
      
      // Export
      const exported = terrain.exportToJSON();
      
      // Check metadata
      expect(exported.version).to.equal('1.0');
      expect(exported.metadata.tileSize).to.equal(32);
      expect(exported.metadata.defaultMaterial).to.equal('sand');
      expect(exported.metadata.maxMapSize).to.equal(150);
      expect(exported.metadata.bounds).to.exist;
    });
    
    it('should include bounds in metadata', function() {
      const terrain = new SparseTerrain(32, 'grass');
      const editor = new TerrainEditor(terrain);
      
      // Paint tiles at specific positions
      editor.selectMaterial('stone');
      editor.paintTile(64, 64);   // Grid (2, 2)
      editor.paintTile(320, 320); // Grid (10, 10)
      
      // Export
      const exported = terrain.exportToJSON();
      
      // Bounds should reflect painted area
      expect(exported.metadata.bounds.minX).to.equal(2);
      expect(exported.metadata.bounds.maxX).to.equal(10);
      expect(exported.metadata.bounds.minY).to.equal(2);
      expect(exported.metadata.bounds.maxY).to.equal(10);
    });
  });
  
  describe('Empty Terrain Export', function() {
    it('should export empty terrain correctly', function() {
      const terrain = new SparseTerrain(32, 'grass');
      
      // Don't paint anything
      
      // Export
      const exported = terrain.exportToJSON();
      
      // Should have empty tiles array
      expect(exported.tiles).to.be.an('array').with.lengthOf(0);
      expect(exported.tileCount).to.equal(0);
      expect(exported.metadata.bounds).to.be.null;
    });
  });
  
  describe('Performance with Large Sparse Data', function() {
    it('should handle large sparse terrain efficiently', function() {
      const terrain = new SparseTerrain(32, 'grass');
      const editor = new TerrainEditor(terrain);
      
      // Paint scattered tiles
      editor.selectMaterial('stone');
      for (let i = 0; i < 50; i++) {
        const x = i * 64; // Every other tile
        const y = i * 64;
        editor.paintTile(x, y);
      }
      
      // Export
      const startTime = Date.now();
      const exported = terrain.exportToJSON();
      const exportTime = Date.now() - startTime;
      
      // Should only export painted tiles
      expect(exported.tiles).to.have.lengthOf(50);
      
      // Should be fast (< 100ms)
      expect(exportTime).to.be.lessThan(100);
      
      // Calculate savings vs dense storage
      const denseSize = 100 * 100; // Full grid
      const sparseSize = exported.tiles.length;
      const savingsPercent = Math.round((1 - sparseSize / denseSize) * 100);
      
      // Should have significant savings
      expect(savingsPercent).to.be.greaterThan(90);
    });
  });
});
