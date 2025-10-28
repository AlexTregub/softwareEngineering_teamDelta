/**
 * @file sparseTerrainIntegration.test.js
 * @description Integration tests for Level Editor with SparseTerrain
 * 
 * Tests ensure Level Editor components (TerrainEditor, MiniMap) work with SparseTerrain.
 * 
 * Phase: Level Editor Integration
 * 
 * @see Classes/terrainUtils/SparseTerrain.js
 * @see Classes/terrainUtils/TerrainEditor.js
 * @see Classes/systems/ui/LevelEditor.js
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Mock window for browser globals
if (typeof window === 'undefined') {
  global.window = {};
}

// Load required classes
const SparseTerrain = require('../../../Classes/terrainUtils/SparseTerrain.js');
const TerrainEditor = require('../../../Classes/terrainUtils/TerrainEditor.js');

describe('Level Editor with SparseTerrain Integration', function() {
  let terrain, editor;
  
  beforeEach(function() {
    // Create SparseTerrain instead of CustomTerrain
    terrain = new SparseTerrain(32, 'dirt');
    editor = new TerrainEditor(terrain);
  });
  
  afterEach(function() {
    sinon.restore();
  });

  describe('TerrainEditor Basic Operations', function() {
    it('should paint a single tile', function() {
      editor.setBrushSize(1);
      editor.selectMaterial('moss');
      
      // Paint at grid position (5, 5) = canvas position (160, 160)
      editor.paintTile(160, 160);
      
      expect(terrain.getTile(5, 5).material).to.equal('moss');
      expect(terrain.getTileCount()).to.equal(1);
    });

    it('should paint with brush size 3', function() {
      editor.setBrushSize(3);
      editor.selectMaterial('stone');
      
      // Paint at grid (10, 10) = canvas (320, 320)
      editor.paintTile(320, 320);
      
      // Should paint 3x3 square (9 tiles)
      expect(terrain.getTileCount()).to.equal(9);
      
      // Check center and corners
      expect(terrain.getTile(10, 10).material).to.equal('stone'); // center
      expect(terrain.getTile(9, 9).material).to.equal('stone');   // top-left
      expect(terrain.getTile(11, 11).material).to.equal('stone'); // bottom-right
    });

    it('should update bounds when painting', function() {
      editor.setBrushSize(1);
      editor.selectMaterial('grass');
      
      expect(terrain.getBounds()).to.be.null; // Empty initially
      
      editor.paintTile(32, 32); // Grid (1, 1)
      
      const bounds = terrain.getBounds();
      expect(bounds).to.not.be.null;
      expect(bounds.minX).to.equal(1);
      expect(bounds.maxX).to.equal(1);
      expect(bounds.minY).to.equal(1);
      expect(bounds.maxY).to.equal(1);
    });

    it('should paint at negative coordinates', function() {
      editor.setBrushSize(1);
      editor.selectMaterial('sand');
      
      // Paint at negative grid coordinates
      // Canvas coordinates can't be negative, but internal setTile can be called
      const tile = terrain.getArrPos([-5, -10]);
      tile.setMaterial('sand');
      terrain.invalidateCache();
      
      expect(terrain.getTile(-5, -10).material).to.equal('sand');
    });
  });

  describe('TerrainEditor Fill Tool', function() {
    it('should fill contiguous area', function() {
      // Create a 3x3 area of grass
      for (let x = 5; x <= 7; x++) {
        for (let y = 5; y <= 7; y++) {
          terrain.setTile(x, y, 'grass');
        }
      }
      
      expect(terrain.getTileCount()).to.equal(9);
      
      // Fill from center with stone (grid coordinates, not canvas)
      editor.fillRegion(6, 6, 'stone');
      
      // All 9 tiles should now be stone
      expect(terrain.getTile(5, 5).material).to.equal('stone');
      expect(terrain.getTile(7, 7).material).to.equal('stone');
      expect(terrain.getTileCount()).to.equal(9);
    });

    it('should not fill beyond different materials', function() {
      // Create a pattern: grass, stone barrier, grass
      terrain.setTile(5, 5, 'grass');
      terrain.setTile(5, 6, 'grass');
      terrain.setTile(5, 7, 'stone'); // barrier
      terrain.setTile(5, 8, 'grass');
      
      // Fill from bottom grass (grid coordinates)
      editor.fillRegion(5, 6, 'sand');
      
      // Should fill only connected grass
      expect(terrain.getTile(5, 5).material).to.equal('sand');
      expect(terrain.getTile(5, 6).material).to.equal('sand');
      expect(terrain.getTile(5, 7).material).to.equal('stone'); // unchanged
      expect(terrain.getTile(5, 8).material).to.equal('grass'); // unchanged
    });
  });

  describe('TerrainEditor Undo/Redo', function() {
    it('should undo paint operation', function() {
      editor.setBrushSize(1);
      editor.selectMaterial('moss');
      
      // Paint tile
      editor.paintTile(160, 160); // Grid (5, 5)
      expect(terrain.getTile(5, 5).material).to.equal('moss');
      
      // Undo
      editor.undo();
      
      // Should be back to default material (undo restores to default, not null)
      const tile = terrain.getTile(5, 5);
      expect(tile).to.not.be.null;
      expect(tile.material).to.equal('dirt'); // defaultMaterial
    });

    it('should redo paint operation', function() {
      editor.setBrushSize(1);
      editor.selectMaterial('stone');
      
      editor.paintTile(64, 64); // Grid (2, 2)
      editor.undo();
      
      const undoTile = terrain.getTile(2, 2);
      expect(undoTile.material).to.equal('dirt'); // back to default
      
      editor.redo();
      expect(terrain.getTile(2, 2).material).to.equal('stone');
    });

    it('should handle multiple undo/redo', function() {
      editor.setBrushSize(1);
      
      // Paint 3 different tiles
      editor.selectMaterial('moss');
      editor.paintTile(32, 32);
      
      editor.selectMaterial('stone');
      editor.paintTile(64, 64);
      
      editor.selectMaterial('grass');
      editor.paintTile(96, 96);
      
      expect(terrain.getTileCount()).to.equal(3);
      
      // Undo all
      editor.undo();
      editor.undo();
      editor.undo();
      
      // All tiles restored to default, but still counted as painted
      // (TerrainEditor doesn't delete tiles on undo, just restores material)
      expect(terrain.getTileCount()).to.equal(3);
      expect(terrain.getTile(1, 1).material).to.equal('dirt');
      expect(terrain.getTile(2, 2).material).to.equal('dirt');
      expect(terrain.getTile(3, 3).material).to.equal('dirt');
      
      // Redo all
      editor.redo();
      editor.redo();
      editor.redo();
      
      expect(terrain.getTileCount()).to.equal(3);
      expect(terrain.getTile(1, 1).material).to.equal('moss');
      expect(terrain.getTile(2, 2).material).to.equal('stone');
      expect(terrain.getTile(3, 3).material).to.equal('grass');
    });
  });

  describe('Sparse Terrain Behavior', function() {
    it('should start with zero tiles (black canvas)', function() {
      expect(terrain.getTileCount()).to.equal(0);
      expect(terrain.getBounds()).to.be.null;
      expect(terrain.isEmpty()).to.be.true;
    });

    it('should only store painted tiles', function() {
      editor.setBrushSize(1);
      editor.selectMaterial('moss');
      
      // Paint 5 scattered tiles
      const positions = [
        [32, 32],   // Grid (1, 1)
        [160, 160], // Grid (5, 5)
        [320, 320], // Grid (10, 10)
        [480, 480], // Grid (15, 15)
        [640, 640]  // Grid (20, 20)
      ];
      
      positions.forEach(([x, y]) => editor.paintTile(x, y));
      
      // Should only have 5 tiles, not a 20x20 grid (400 tiles)
      expect(terrain.getTileCount()).to.equal(5);
      
      // Bounds should span from (1,1) to (20,20)
      const bounds = terrain.getBounds();
      expect(bounds.minX).to.equal(1);
      expect(bounds.maxX).to.equal(20);
    });

    it('should handle painting beyond initial bounds', function() {
      // Start with tile at origin
      terrain.setTile(0, 0, 'grass');
      
      // Paint far away (but within 1000x1000 limit)
      editor.setBrushSize(1);
      editor.selectMaterial('stone');
      editor.paintTile(999 * 32, 999 * 32); // Grid (999, 999)
      
      // Should have 2 tiles, not 1,000,000 tiles
      expect(terrain.getTileCount()).to.equal(2);
      
      const bounds = terrain.getBounds();
      expect(bounds.minX).to.equal(0);
      expect(bounds.maxX).to.equal(999);
      expect(bounds.minY).to.equal(0);
      expect(bounds.maxY).to.equal(999);
    });
  });

  describe('JSON Export/Import', function() {
    it('should export sparse terrain', function() {
      // Paint a few tiles
      editor.setBrushSize(1);
      editor.selectMaterial('moss');
      editor.paintTile(32, 32);
      editor.paintTile(64, 64);
      editor.paintTile(96, 96);
      
      const json = terrain.exportToJSON();
      
      expect(json.tileCount).to.equal(3);
      expect(json.tiles).to.have.lengthOf(3);
      expect(json.version).to.equal('1.0');
    });

    it('should import sparse terrain', function() {
      const json = {
        version: '1.0',
        tileSize: 32,
        defaultMaterial: 'dirt',
        bounds: { minX: 5, maxX: 10, minY: 5, maxY: 10 },
        tileCount: 4,
        tiles: [
          { x: 5, y: 5, material: 'moss' },
          { x: 10, y: 5, material: 'stone' },
          { x: 5, y: 10, material: 'grass' },
          { x: 10, y: 10, material: 'sand' }
        ]
      };
      
      terrain.importFromJSON(json);
      
      expect(terrain.getTileCount()).to.equal(4);
      expect(terrain.getTile(5, 5).material).to.equal('moss');
      expect(terrain.getTile(10, 10).material).to.equal('sand');
    });

    it('should maintain sparsity after import', function() {
      const json = {
        version: '1.0',
        tileSize: 32,
        defaultMaterial: 'dirt',
        bounds: { minX: 0, maxX: 100, minY: 0, maxY: 100 },
        tileCount: 10,
        tiles: [
          // Only 10 tiles in a 101x101 potential grid
          { x: 0, y: 0, material: 'moss' },
          { x: 10, y: 10, material: 'stone' },
          { x: 20, y: 20, material: 'grass' },
          { x: 30, y: 30, material: 'sand' },
          { x: 40, y: 40, material: 'moss' },
          { x: 50, y: 50, material: 'stone' },
          { x: 60, y: 60, material: 'grass' },
          { x: 70, y: 70, material: 'sand' },
          { x: 80, y: 80, material: 'moss' },
          { x: 100, y: 100, material: 'stone' }
        ]
      };
      
      terrain.importFromJSON(json);
      
      // Should have 10 tiles, not 10,201 (101*101)
      expect(terrain.getTileCount()).to.equal(10);
    });
  });

  describe('Performance Characteristics', function() {
    it('should be memory efficient for sparse painting', function() {
      // Paint 100 scattered tiles
      editor.setBrushSize(1);
      editor.selectMaterial('moss');
      
      for (let i = 0; i < 100; i++) {
        const gridX = i * 10; // Scattered every 10 tiles
        const gridY = i * 10;
        editor.paintTile(gridX * 32, gridY * 32);
      }
      
      // Should only have 100 tiles, not 990,001 (999*999 grid)
      expect(terrain.getTileCount()).to.equal(100);
      
      const bounds = terrain.getBounds();
      expect(bounds.maxX - bounds.minX + 1).to.equal(991); // Spans 991 tiles
      expect(bounds.maxY - bounds.minY + 1).to.equal(991);
    });

    it('should handle dense painting efficiently', function() {
      // Paint a dense 50x50 area
      editor.setBrushSize(1);
      editor.selectMaterial('stone');
      
      for (let x = 0; x < 50; x++) {
        for (let y = 0; y < 50; y++) {
          editor.paintTile(x * 32, y * 32);
        }
      }
      
      expect(terrain.getTileCount()).to.equal(2500); // 50*50
    });
  });

  describe('Compatibility with CustomTerrain Interface', function() {
    it('should support TerrainEditor._isInBounds pattern', function() {
      const maxX = terrain._gridSizeX * terrain._chunkSize;
      const maxY = terrain._gridSizeY * terrain._chunkSize;
      
      expect(maxX).to.equal(1000);
      expect(maxY).to.equal(1000);
      
      // Test bounds check
      expect(0 >= 0 && 0 < maxX).to.be.true;
      expect(500 >= 0 && 500 < maxX).to.be.true;
      expect(999 >= 0 && 999 < maxX).to.be.true;
      expect(1000 >= 0 && 1000 < maxX).to.be.false; // Out of bounds
    });

    it('should support TerrainEditor.getArrPos pattern', function() {
      terrain.setTile(5, 5, 'moss');
      
      const tile = terrain.getArrPos([5, 5]);
      
      expect(tile.getMaterial()).to.equal('moss');
      
      tile.setMaterial('stone');
      expect(terrain.getTile(5, 5).material).to.equal('stone');
      
      tile.assignWeight(); // Should not throw
    });

    it('should support TerrainEditor.invalidateCache pattern', function() {
      terrain.setTile(3, 3, 'grass');
      
      expect(() => terrain.invalidateCache()).to.not.throw();
      
      // Terrain should still be intact
      expect(terrain.getTile(3, 3).material).to.equal('grass');
    });
  });
});
