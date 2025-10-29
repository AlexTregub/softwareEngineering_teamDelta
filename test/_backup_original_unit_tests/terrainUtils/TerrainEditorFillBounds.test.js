/**
 * TerrainEditorFillBounds.test.js
 * 
 * TDD unit tests for fill tool bounds limiting
 * Issue: Fill tool fills EVERYTHING, needs 100x100 area limit
 * 
 * Test Strategy:
 * - Mock SparseTerrain with sparse data structure
 * - Test fillRegion with various area sizes
 * - Verify MAX_FILL_AREA constant limits fill operations
 * - Test count tracking and limit detection
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

// Setup JSDOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

// Load TerrainEditor
const TerrainEditor = require('../../../Classes/terrainUtils/TerrainEditor');

describe('TerrainEditor - Fill Bounds Limit', function() {
  let terrainEditor;
  let mockTerrain;
  
  beforeEach(function() {
    // Mock p5.js globals
    global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));
    global.logVerbose = sinon.stub();
    global.logInfo = sinon.stub();
    
    // Sync to window for JSDOM
    window.createVector = global.createVector;
    window.logVerbose = global.logVerbose;
    window.logInfo = global.logInfo;
    
    // Create mock SparseTerrain with getArrPos interface
    mockTerrain = {
      _tiles: new Map(),
      _tileSize: 32,
      // Note: NO _gridSizeX/_gridSizeY to allow sparse behavior (negative coords)
      
      // Compatibility method - returns wrapper with getMaterial/setMaterial
      getArrPos: function(coords) {
        const key = `${coords[0]},${coords[1]}`;
        const self = this;
        return {
          getMaterial: function() {
            const tile = self._tiles.get(key);
            // Return material if explicitly set, otherwise return unique empty identifier
            // This prevents fill from spreading to unset tiles
            return tile ? tile.material : null;
          },
          setMaterial: function(material) {
            self._tiles.set(key, { material });
          },
          assignWeight: function() {
            // Mock - no-op
          }
        };
      },
      
      // Helper to check if tile exists
      hasTile: function(x, y) {
        return this._tiles.has(`${x},${y}`);
      },
      
      // Helper to set tile directly
      setTile: function(x, y, material) {
        this._tiles.set(`${x},${y}`, { material });
      },
      
      // Compatibility method - no-op for SparseTerrain
      invalidateCache: function() {
        // Mock - no-op
      }
    };
    
    // Create TerrainEditor with mock terrain
    terrainEditor = new TerrainEditor(mockTerrain);
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('MAX_FILL_AREA Constant', function() {
    it('should define MAX_FILL_AREA as 10000 (100x100)', function() {
      expect(terrainEditor.MAX_FILL_AREA).to.equal(10000);
    });
  });
  
  describe('fillRegion() with Bounds Limit', function() {
    it('should fill small area completely (10x10 = 100 tiles)', function() {
      
      // Create 10x10 grass area
      for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
          mockTerrain.setTile(x, y, 'grass');
        }
      }
      
      const result = terrainEditor.fillRegion(5, 5, 'dirt');
      
      expect(result.tilesFilled).to.equal(100);
      expect(result.limitReached).to.be.false;
      
      // Verify all tiles changed
      for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
          expect(mockTerrain.getArrPos([x, y]).getMaterial()).to.equal('dirt');
        }
      }
    });
    
    it('should fill exactly 100x100 area (limit)', function() {
      if (!terrainEditor) this.skip();
      
      // Create 100x100 grass area
      for (let x = 0; x < 100; x++) {
        for (let y = 0; y < 100; y++) {
          mockTerrain.setTile(x, y, 'grass');
        }
      }
      
      const result = terrainEditor.fillRegion(50, 50, 'dirt');
      
      expect(result.tilesFilled).to.equal(10000);
      expect(result.limitReached).to.be.false; // Exactly at limit
    });
    
    it('should stop at 100x100 limit when filling larger area', function() {
      if (!terrainEditor) this.skip();
      
      // Create 200x200 grass area (40,000 tiles)
      for (let x = 0; x < 200; x++) {
        for (let y = 0; y < 200; y++) {
          mockTerrain.setTile(x, y, 'grass');
        }
      }
      
      const result = terrainEditor.fillRegion(100, 100, 'dirt');
      
      expect(result.tilesFilled).to.equal(10000); // Stopped at limit
      expect(result.limitReached).to.be.true;
      
      // Verify not all tiles changed
      let dirtCount = 0;
      let grassCount = 0;
      for (let x = 0; x < 200; x++) {
        for (let y = 0; y < 200; y++) {
          const material = mockTerrain.getArrPos([x, y]).getMaterial();
          if (material === 'dirt') dirtCount++;
          if (material === 'grass') grassCount++;
        }
      }
      
      expect(dirtCount).to.equal(10000);
      expect(grassCount).to.equal(30000); // 40000 - 10000
    });
    
    it('should return correct tilesFilled count for irregular shapes', function() {
      if (!terrainEditor) this.skip();
      
      // Create L-shape (150 tiles total)
      // Vertical: 0-9, 0-9 (100 tiles)
      for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
          mockTerrain.setTile(x, y, 'grass');
        }
      }
      // Horizontal: 10-14, 0-9 (50 tiles)
      for (let x = 10; x < 15; x++) {
        for (let y = 0; y < 10; y++) {
          mockTerrain.setTile(x, y, 'grass');
        }
      }
      
      const result = terrainEditor.fillRegion(5, 5, 'dirt');
      
      expect(result.tilesFilled).to.equal(150);
      expect(result.limitReached).to.be.false;
    });
    
    it('should handle already-filled tiles within limit', function() {
      if (!terrainEditor) this.skip();
      
      // Create 20x20 area
      for (let x = 0; x < 20; x++) {
        for (let y = 0; y < 20; y++) {
          mockTerrain.setTile(x, y, 'grass');
        }
      }
      
      // Fill with dirt first
      terrainEditor.fillRegion(10, 10, 'dirt');
      
      // Reset terrain
      for (let x = 0; x < 20; x++) {
        for (let y = 0; y < 20; y++) {
          mockTerrain.setTile(x, y, 'grass');
        }
      }
      mockTerrain.setTile(10, 10, 'dirt'); // One already dirt
      
      const result = terrainEditor.fillRegion(10, 10, 'dirt');
      
      // Should fill nothing (already same material)
      expect(result.tilesFilled).to.equal(0);
      expect(result.limitReached).to.be.false;
    });
    
    it('should not fill if start tile is different material', function() {
      if (!terrainEditor) this.skip();
      
      // Create mixed terrain
      mockTerrain.setTile(5, 5, 'grass');
      mockTerrain.setTile(6, 5, 'stone');
      
      const result = terrainEditor.fillRegion(5, 5, 'stone');
      
      // Should only fill grass tile
      expect(result.tilesFilled).to.equal(1);
    });
    
    it('should respect material boundaries even with limit', function() {
      if (!terrainEditor) this.skip();
      
      // Create checkerboard (prevents BFS from spreading)
      for (let x = 0; x < 50; x++) {
        for (let y = 0; y < 50; y++) {
          const material = (x + y) % 2 === 0 ? 'grass' : 'stone';
          mockTerrain.setTile(x, y, material);
        }
      }
      
      const result = terrainEditor.fillRegion(0, 0, 'dirt');
      
      // Should only fill grass tiles (half of 2500 = 1250)
      expect(result.tilesFilled).to.be.at.most(1250);
      expect(result.limitReached).to.be.false;
    });
    
    it('should handle sparse terrain with gaps', function() {
      if (!terrainEditor) this.skip();
      
      // Create island of grass tiles (not filled everywhere)
      mockTerrain.setTile(10, 10, 'grass');
      mockTerrain.setTile(11, 10, 'grass');
      mockTerrain.setTile(10, 11, 'grass');
      mockTerrain.setTile(11, 11, 'grass');
      // Surrounding tiles are default (not explicitly set)
      
      const result = terrainEditor.fillRegion(10, 10, 'dirt');
      
      // Should fill 4 grass tiles OR everything connected with same default material
      // Depends on SparseTerrain behavior for unfilled tiles
      expect(result.tilesFilled).to.be.at.least(4);
    });
    
    it('should return metadata about fill operation', function() {
      if (!terrainEditor) this.skip();
      
      mockTerrain.setTile(0, 0, 'grass');
      mockTerrain.setTile(1, 0, 'grass');
      
      const result = terrainEditor.fillRegion(0, 0, 'dirt');
      
      expect(result).to.have.property('tilesFilled');
      expect(result).to.have.property('limitReached');
      expect(result).to.have.property('startMaterial');
      expect(result).to.have.property('newMaterial');
      
      expect(result.startMaterial).to.equal('grass');
      expect(result.newMaterial).to.equal('dirt');
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle fillRegion on non-existent tile', function() {
      if (!terrainEditor) this.skip();
      
      // Don't set any tiles - rely on default material
      const result = terrainEditor.fillRegion(0, 0, 'dirt');
      
      // Should handle gracefully (either fill default or skip)
      expect(result).to.have.property('tilesFilled');
      expect(result.tilesFilled).to.be.at.least(0);
    });
    
    it('should handle negative coordinates within bounds', function() {
      if (!terrainEditor) this.skip();
      
      mockTerrain.setTile(-5, -5, 'grass');
      mockTerrain.setTile(-4, -5, 'grass');
      
      const result = terrainEditor.fillRegion(-5, -5, 'dirt');
      
      expect(result.tilesFilled).to.be.at.least(2);
    });
  });
});
