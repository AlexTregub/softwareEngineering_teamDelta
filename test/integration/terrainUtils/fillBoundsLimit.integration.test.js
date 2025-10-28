/**
 * Integration Tests: Fill Tool Bounds Limit
 * 
 * Tests fillRegion() with real TerrainEditor and SparseTerrain integration
 * Verifies bounds limiting works correctly with actual terrain operations
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
const TerrainEditor = require('../../../Classes/terrainUtils/TerrainEditor');

describe('TerrainEditor Fill Bounds - Integration', function() {
  let terrain;
  let editor;
  
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
  
  describe('Fill on Sparse Terrain (Fills All Tiles)', function() {
    it('should hit 10,000 tile limit when filling 100x100 sparse terrain', function() {
      // Create terrain with 100x100 limit, defaultMaterial='grass'
      // All tiles return 'grass' even if unpainted (sparse behavior)
      terrain = new SparseTerrain(32, 'grass', { maxMapSize: 100 });
      
      // Paint just one tile to start fill from
      terrain.setTile(25, 25, 'grass');
      
      // Create editor and fill
      editor = new TerrainEditor(terrain);
      const result = editor.fillRegion(25, 25, 'dirt');
      
      // Should fill entire 100x100 area (10,000 tiles) and hit limit
      expect(result.tilesFilled).to.equal(10000);
      expect(result.limitReached).to.be.false; // Filled entire grid, natural end
      expect(result.startMaterial).to.equal('grass');
      expect(result.newMaterial).to.equal('dirt');
      
      // All tiles in grid should now be dirt
      expect(terrain.getTileCount()).to.equal(10000);
    });
    
    it('should stop at limit when filling sparse terrain with stone borders', function() {
      // Create terrain with stone borders to contain fill area
      terrain = new SparseTerrain(32, 'grass', { maxMapSize: 100 });
      
      // Create 50x50 area with stone border
      // Border prevents fill from spreading beyond it
      for (let x = -1; x <= 50; x++) {
        terrain.setTile(x, -1, 'stone');
        terrain.setTile(x, 50, 'stone');
      }
      for (let y = 0; y < 50; y++) {
        terrain.setTile(-1, y, 'stone');
        terrain.setTile(50, y, 'stone');
      }
      
      editor = new TerrainEditor(terrain);
      const result = editor.fillRegion(25, 25, 'dirt');
      
      // Should fill 50x50 area (2500 tiles), not hit limit
      expect(result.tilesFilled).to.equal(2500);
      expect(result.limitReached).to.be.false;
      expect(result.startMaterial).to.equal('grass');
      
      // Border tiles should still be stone
      expect(terrain.getTile(-1, -1).material).to.equal('stone');
    });
    
    it('should respect material boundaries using stone barriers', function() {
      terrain = new SparseTerrain(32, 'grass', { maxMapSize: 100 });
      
      // Create 30x30 grass area surrounded by stone
      for (let x = -1; x <= 30; x++) {
        terrain.setTile(x, -1, 'stone');
        terrain.setTile(x, 30, 'stone');
      }
      for (let y = 0; y < 30; y++) {
        terrain.setTile(-1, y, 'stone');
        terrain.setTile(30, y, 'stone');
      }
      
      editor = new TerrainEditor(terrain);
      const result = editor.fillRegion(15, 15, 'dirt');
      
      // Should only fill 30x30 grass area (900 tiles)
      expect(result.tilesFilled).to.equal(900);
      expect(result.limitReached).to.be.false;
      
      // Verify stone border unchanged
      expect(terrain.getTile(-1, -1).material).to.equal('stone');
      expect(terrain.getTile(30, 30).material).to.equal('stone');
    });
  });
  
  describe('150x150 Area Fill (Should Stop at Limit)', function() {
    it('should stop at 10,000 tiles when filling 150x150 area', function() {
      // Create terrain with 200x200 limit to accommodate 150x150
      terrain = new SparseTerrain(32, 'grass', { maxMapSize: 200 });
      
      // Paint 150x150 grass area (22,500 tiles)
      for (let x = 0; x < 150; x++) {
        for (let y = 0; y < 150; y++) {
          terrain.setTile(x, y, 'grass');
        }
      }
      
      expect(terrain.getTileCount()).to.equal(22500);
      
      // Create editor and fill from center
      editor = new TerrainEditor(terrain);
      const result = editor.fillRegion(75, 75, 'dirt');
      
      // Should stop at 10,000 tiles
      expect(result.tilesFilled).to.equal(10000);
      expect(result.limitReached).to.be.true;
      expect(result.startMaterial).to.equal('grass');
      expect(result.newMaterial).to.equal('dirt');
      
      // Verify some tiles changed to dirt, some still grass
      let dirtCount = 0;
      let grassCount = 0;
      for (let x = 0; x < 150; x++) {
        for (let y = 0; y < 150; y++) {
          const tile = terrain.getTile(x, y);
          if (tile) {
            if (tile.material === 'dirt') dirtCount++;
            if (tile.material === 'grass') grassCount++;
          }
        }
      }
      
      expect(dirtCount).to.equal(10000);
      expect(grassCount).to.equal(12500); // 22,500 - 10,000
    });
    
    it('should return limitReached=true for 200x200 area', function() {
      terrain = new SparseTerrain(32, 'grass', { maxMapSize: 250 });
      
      // Paint 200x200 grass area (40,000 tiles)
      for (let x = 0; x < 200; x++) {
        for (let y = 0; y < 200; y++) {
          terrain.setTile(x, y, 'grass');
        }
      }
      
      editor = new TerrainEditor(terrain);
      const result = editor.fillRegion(100, 100, 'stone');
      
      expect(result.tilesFilled).to.equal(10000);
      expect(result.limitReached).to.be.true;
      
      // Should have 30,000 grass tiles remaining
      let grassCount = 0;
      for (let x = 0; x < 200; x++) {
        for (let y = 0; y < 200; y++) {
          const tile = terrain.getTile(x, y);
          if (tile && tile.material === 'grass') grassCount++;
        }
      }
      
      expect(grassCount).to.equal(30000);
    });
    
    it('should handle multiple fill operations on large area', function() {
      terrain = new SparseTerrain(32, 'grass', { maxMapSize: 200 });
      
      // Paint 150x150 grass area
      for (let x = 0; x < 150; x++) {
        for (let y = 0; y < 150; y++) {
          terrain.setTile(x, y, 'grass');
        }
      }
      
      editor = new TerrainEditor(terrain);
      
      // First fill: should hit limit
      const result1 = editor.fillRegion(75, 75, 'dirt');
      expect(result1.tilesFilled).to.equal(10000);
      expect(result1.limitReached).to.be.true;
      
      // Count remaining grass tiles
      let grassCount = 0;
      for (let x = 0; x < 150; x++) {
        for (let y = 0; y < 150; y++) {
          const tile = terrain.getTile(x, y);
          if (tile && tile.material === 'grass') grassCount++;
        }
      }
      
      expect(grassCount).to.equal(12500);
      
      // Second fill on remaining grass: should hit limit again
      const result2 = editor.fillRegion(10, 10, 'stone');
      
      // Should fill 10,000 more or remaining grass, whichever is less
      expect(result2.tilesFilled).to.be.at.most(10000);
    });
  });
  
  describe('Edge Cases with Real Terrain', function() {
    it('should fill isolated regions with stone barriers', function() {
      terrain = new SparseTerrain(32, 'grass', { maxMapSize: 150 });
      
      // Create single 20x20 grass area with stone border
      for (let x = -1; x <= 20; x++) {
        terrain.setTile(x, -1, 'stone');
        terrain.setTile(x, 20, 'stone');
      }
      for (let y = 0; y < 20; y++) {
        terrain.setTile(-1, y, 'stone');
        terrain.setTile(20, y, 'stone');
      }
      
      editor = new TerrainEditor(terrain);
      
      // Fill grass region
      const result = editor.fillRegion(10, 10, 'dirt');
      
      // Should only fill 20x20 area (400 tiles)
      expect(result.tilesFilled).to.equal(400);
      expect(result.limitReached).to.be.false;
      
      // Verify stone barrier intact
      expect(terrain.getTile(-1, -1).material).to.equal('stone');
    });
    
    it('should work with negative coordinates and stone borders', function() {
      terrain = new SparseTerrain(32, 'grass', { maxMapSize: 100 });
      
      // Create 10x10 area from 0 to 9 with stone border
      for (let x = -1; x <= 10; x++) {
        terrain.setTile(x, -1, 'stone');
        terrain.setTile(x, 10, 'stone');
      }
      for (let y = 0; y < 10; y++) {
        terrain.setTile(-1, y, 'stone');
        terrain.setTile(10, y, 'stone');
      }
      
      editor = new TerrainEditor(terrain);
      const result = editor.fillRegion(5, 5, 'dirt');
      
      // Should fill 10x10 area (100 tiles)
      expect(result.tilesFilled).to.equal(100);
      expect(result.limitReached).to.be.false;
      
      // Border should be intact
      expect(terrain.getTile(-1, -1).material).to.equal('stone');
    });
  });
});
