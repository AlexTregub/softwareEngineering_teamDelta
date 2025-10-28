/**
 * Integration Tests: Custom Canvas Sizes
 * 
 * Tests SparseTerrain custom size functionality with real operations
 * Verifies size validation, JSON persistence, and compatibility
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

// Setup JSDOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

// Load classes
const SparseTerrain = require('../../../Classes/terrainUtils/SparseTerrain');

describe('SparseTerrain Size Customization - Integration', function() {
  beforeEach(function() {
    // Mock p5.js and logging
    global.logVerbose = sinon.stub();
    global.logInfo = sinon.stub();
    global.logError = sinon.stub();
    
    window.logVerbose = global.logVerbose;
    window.logInfo = global.logInfo;
    window.logError = global.logError;
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Custom Size Workflow', function() {
    it('should create, populate, and export custom 250x250 terrain', function() {
      const terrain = new SparseTerrain(32, 'grass', { maxMapSize: 250 });
      
      // Verify size
      expect(terrain.MAX_MAP_SIZE).to.equal(250);
      expect(terrain._gridSizeX).to.equal(250);
      expect(terrain._gridSizeY).to.equal(250);
      
      // Paint 100x100 area in corner
      for (let x = 0; x < 100; x++) {
        for (let y = 0; y < 100; y++) {
          terrain.setTile(x, y, 'stone');
        }
      }
      
      expect(terrain.getTileCount()).to.equal(10000);
      
      // Export and verify
      const exported = terrain.exportToJSON();
      
      expect(exported.metadata.maxMapSize).to.equal(250);
      expect(exported.tileCount).to.equal(10000);
      expect(exported.tiles).to.be.an('array').with.lengthOf(10000);
    });
    
    it('should import, modify, and re-export custom terrain', function() {
      // Create and export
      const terrain1 = new SparseTerrain(32, 'grass', { maxMapSize: 300 });
      terrain1.setTile(50, 50, 'stone');
      terrain1.setTile(100, 100, 'dirt');
      
      const exported = terrain1.exportToJSON();
      
      // Import
      const terrain2 = new SparseTerrain(32, 'grass');
      terrain2.importFromJSON(exported);
      
      expect(terrain2.MAX_MAP_SIZE).to.equal(300);
      expect(terrain2.getTileCount()).to.equal(2);
      expect(terrain2.getTile(50, 50).material).to.equal('stone');
      expect(terrain2.getTile(100, 100).material).to.equal('dirt');
      
      // Modify
      terrain2.setTile(150, 150, 'sand');
      expect(terrain2.getTileCount()).to.equal(3);
      
      // Re-export
      const exported2 = terrain2.exportToJSON();
      
      expect(exported2.metadata.maxMapSize).to.equal(300);
      expect(exported2.tileCount).to.equal(3);
    });
    
    it('should handle size upgrade via import', function() {
      // Create small terrain
      const terrain1 = new SparseTerrain(32, 'grass', { maxMapSize: 50 });
      for (let x = 0; x < 50; x++) {
        for (let y = 0; y < 50; y++) {
          terrain1.setTile(x, y, 'grass');
        }
      }
      
      const exported = terrain1.exportToJSON();
      
      // Import into larger terrain
      const terrain2 = new SparseTerrain(32, 'grass', { maxMapSize: 150 });
      terrain2.importFromJSON(exported);
      
      // Should preserve original size from metadata
      expect(terrain2.MAX_MAP_SIZE).to.equal(50);
      expect(terrain2.getTileCount()).to.equal(2500);
      
      // Should reject tiles beyond restored size
      terrain2.setTile(60, 60, 'stone');
      expect(terrain2.getTileCount()).to.equal(2500); // No change
    });
  });
  
  describe('Size Validation in Real Use', function() {
    it('should clamp size to minimum during construction', function() {
      const terrain = new SparseTerrain(32, 'grass', { maxMapSize: 5 });
      
      expect(terrain.MAX_MAP_SIZE).to.equal(10);
      
      // Should accept tiles within 10x10
      terrain.setTile(8, 8, 'stone');
      expect(terrain.getTileCount()).to.equal(1);
      
      // Should reject tiles at boundary (10x10)
      terrain.setTile(9, 9, 'stone');
      expect(terrain.getTileCount()).to.equal(2);
    });
    
    it('should clamp size to maximum during construction', function() {
      const terrain = new SparseTerrain(32, 'grass', { maxMapSize: 5000 });
      
      expect(terrain.MAX_MAP_SIZE).to.equal(1000);
      
      // Should accept tiles within 1000x1000
      terrain.setTile(998, 998, 'stone');
      expect(terrain.getTileCount()).to.equal(1);
      
      // Should accept tiles at boundary
      terrain.setTile(999, 999, 'stone');
      expect(terrain.getTileCount()).to.equal(2);
    });
    
    it('should handle invalid size strings gracefully', function() {
      const terrain1 = new SparseTerrain(32, 'grass', { maxMapSize: 'abc' });
      expect(terrain1.MAX_MAP_SIZE).to.equal(100); // Default (NaN not parsed)
      
      const terrain2 = new SparseTerrain(32, 'grass', { maxMapSize: null });
      expect(terrain2.MAX_MAP_SIZE).to.equal(10); // Number(null)=0, clamped to 10
      
      const terrain3 = new SparseTerrain(32, 'grass', { maxMapSize: undefined });
      expect(terrain3.MAX_MAP_SIZE).to.equal(100); // Default
    });
  });
  
  describe('Backward Compatibility', function() {
    it('should import old format JSON without maxMapSize', function() {
      const oldFormatJSON = JSON.stringify({
        version: '1.0',
        tileSize: 32,
        defaultMaterial: 'grass',
        tileCount: 2,
        tiles: [
          { x: 10, y: 10, material: 'stone' },
          { x: 20, y: 20, material: 'dirt' }
        ]
      });
      
      const terrain = new SparseTerrain(32, 'grass');
      terrain.importFromJSON(oldFormatJSON);
      
      // Should use default size
      expect(terrain.MAX_MAP_SIZE).to.equal(100);
      expect(terrain.getTileCount()).to.equal(2);
      expect(terrain.getTile(10, 10).material).to.equal('stone');
      expect(terrain.getTile(20, 20).material).to.equal('dirt');
    });
    
    it('should import new format JSON with metadata wrapper', function() {
      const newFormatJSON = JSON.stringify({
        version: '1.0',
        metadata: {
          tileSize: 32,
          defaultMaterial: 'grass',
          maxMapSize: 200,
          bounds: { minX: 0, maxX: 50, minY: 0, maxY: 50 }
        },
        tileCount: 2,
        tiles: [
          { x: 10, y: 10, material: 'stone' },
          { x: 20, y: 20, material: 'dirt' }
        ]
      });
      
      const terrain = new SparseTerrain(32, 'grass');
      terrain.importFromJSON(newFormatJSON);
      
      expect(terrain.MAX_MAP_SIZE).to.equal(200);
      expect(terrain.getTileCount()).to.equal(2);
      expect(terrain.getTile(10, 10).material).to.equal('stone');
    });
  });
  
  describe('Multi-Terrain Interaction', function() {
    it('should handle multiple terrains with different sizes', function() {
      const small = new SparseTerrain(32, 'grass', { maxMapSize: 50 });
      const medium = new SparseTerrain(32, 'grass', { maxMapSize: 150 });
      const large = new SparseTerrain(32, 'grass', { maxMapSize: 500 });
      
      // Paint areas
      small.setTile(40, 40, 'stone');
      medium.setTile(100, 100, 'dirt');
      large.setTile(400, 400, 'sand');
      
      // Each should respect its own limits
      expect(small.getTileCount()).to.equal(1);
      expect(medium.getTileCount()).to.equal(1);
      expect(large.getTileCount()).to.equal(1);
      
      // Try at max boundary
      small.setTile(49, 49, 'stone');
      medium.setTile(149, 149, 'dirt');
      large.setTile(499, 499, 'sand');
      
      expect(small.getTileCount()).to.equal(2);
      expect(medium.getTileCount()).to.equal(2);
      expect(large.getTileCount()).to.equal(2);
    });
    
    it('should copy terrain data between different sizes', function() {
      // Create small terrain with data
      const source = new SparseTerrain(32, 'grass', { maxMapSize: 100 });
      for (let x = 0; x < 50; x++) {
        for (let y = 0; y < 50; y++) {
          source.setTile(x, y, 'stone');
        }
      }
      
      const json = source.exportToJSON();
      
      // Import into larger terrain
      const dest = new SparseTerrain(32, 'grass', { maxMapSize: 200 });
      dest.importFromJSON(json);
      
      // Should restore original size
      expect(dest.MAX_MAP_SIZE).to.equal(100);
      expect(dest.getTileCount()).to.equal(2500);
      
      // Data should be preserved
      let stoneCount = 0;
      for (let x = 0; x < 100; x++) {
        for (let y = 0; y < 100; y++) {
          const tile = dest.getTile(x, y);
          if (tile && tile.material === 'stone') stoneCount++;
        }
      }
      
      expect(stoneCount).to.equal(2500);
    });
  });
  
  describe('Performance with Different Sizes', function() {
    it('should handle full 100x100 default terrain', function() {
      const terrain = new SparseTerrain(32, 'grass');
      
      // Fill entire default area
      for (let x = 0; x < 100; x++) {
        for (let y = 0; y < 100; y++) {
          terrain.setTile(x, y, 'stone');
        }
      }
      
      expect(terrain.getTileCount()).to.equal(10000);
      
      // Export should complete
      const exported = terrain.exportToJSON();
      expect(exported.tileCount).to.equal(10000);
    });
    
    it('should handle full 1000x1000 maximum terrain', function() {
      const terrain = new SparseTerrain(32, 'grass', { maxMapSize: 1000 });
      
      // Fill every 10th row (100 rows of 1000 tiles)
      for (let y = 0; y < 1000; y += 10) {
        for (let x = 0; x < 1000; x++) {
          terrain.setTile(x, y, 'stone');
        }
      }
      
      expect(terrain.getTileCount()).to.equal(100000);
      
      // Export should complete
      const exported = terrain.exportToJSON();
      expect(exported.tileCount).to.equal(100000);
    });
  });
});
