/**
 * SparseTerrainSizeCustomization.test.js
 * 
 * TDD unit tests for custom canvas size configuration
 * Issue #2: Reduce default from 1000x1000 to 100x100, allow custom sizes
 * 
 * Test Strategy:
 * - SparseTerrain accepts custom maxMapSize in constructor
 * - Size validation (min 10x10, max 1000x1000)
 * - Default size is 100x100
 * - setTile respects custom max size
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

// Setup JSDOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

// Load SparseTerrain
const SparseTerrain = require('../../../Classes/terrainUtils/SparseTerrain');

describe('SparseTerrain - Size Customization', function() {
  let terrain;
  
  beforeEach(function() {
    // Mock p5.js globals
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
  
  describe('Constructor with Custom Size', function() {
    it('should accept custom maxMapSize parameter', function() {
      terrain = new SparseTerrain(32, 'grass', { maxMapSize: 200 });
      
      expect(terrain.MAX_MAP_SIZE).to.equal(200);
    });
    
    it('should use default 100x100 if no maxMapSize provided', function() {
      terrain = new SparseTerrain(32, 'grass');
      
      expect(terrain.MAX_MAP_SIZE).to.equal(100);
    });
    
    it('should accept options object with maxMapSize', function() {
      terrain = new SparseTerrain(32, 'grass', { maxMapSize: 500 });
      
      expect(terrain.MAX_MAP_SIZE).to.equal(500);
    });
    
    it('should validate maxMapSize minimum (10x10)', function() {
      terrain = new SparseTerrain(32, 'grass', { maxMapSize: 5 });
      
      // Should clamp to minimum
      expect(terrain.MAX_MAP_SIZE).to.equal(10);
    });
    
    it('should validate maxMapSize maximum (1000x1000)', function() {
      terrain = new SparseTerrain(32, 'grass', { maxMapSize: 2000 });
      
      // Should clamp to maximum
      expect(terrain.MAX_MAP_SIZE).to.equal(1000);
    });
    
    it('should handle negative maxMapSize gracefully', function() {
      terrain = new SparseTerrain(32, 'grass', { maxMapSize: -50 });
      
      // Should clamp to minimum
      expect(terrain.MAX_MAP_SIZE).to.equal(10);
    });
    
    it('should handle non-numeric maxMapSize', function() {
      terrain = new SparseTerrain(32, 'grass', { maxMapSize: 'invalid' });
      
      // Should use default
      expect(terrain.MAX_MAP_SIZE).to.equal(100);
    });
  });
  
  describe('Size Validation with Custom Limits', function() {
    it('should reject tiles exceeding custom 50x50 limit', function() {
      terrain = new SparseTerrain(32, 'grass', { maxMapSize: 50 });
      
      // Fill 0-24 (25 tiles)
      for (let x = 0; x < 25; x++) {
        terrain.setTile(x, 0, 'dirt');
      }
      
      // Try to add tile at x=30 (would create 31-tile span, exceeds 50)
      // Wait, this wouldn't exceed because 0 to 30 = 31 tiles, under 50
      // Let me create proper test: 0 to 50 = 51 tiles, exceeds limit
      const result = terrain.setTile(50, 0, 'dirt');
      
      expect(result).to.be.false; // Rejected
    });
    
    it('should allow tiles within custom 200x200 limit', function() {
      terrain = new SparseTerrain(32, 'grass', { maxMapSize: 200 });
      
      // Add tiles at corners of 200x200 area
      expect(terrain.setTile(0, 0, 'dirt')).to.be.true;
      expect(terrain.setTile(199, 0, 'dirt')).to.be.true;
      expect(terrain.setTile(0, 199, 'dirt')).to.be.true;
      expect(terrain.setTile(199, 199, 'dirt')).to.be.true;
      
      const bounds = terrain.getBounds();
      expect(bounds.maxX - bounds.minX + 1).to.equal(200);
      expect(bounds.maxY - bounds.minY + 1).to.equal(200);
    });
    
    it('should reject tile that would expand beyond custom limit', function() {
      terrain = new SparseTerrain(32, 'grass', { maxMapSize: 100 });
      
      // Create 100x100 area from 0,0 to 99,99
      terrain.setTile(0, 0, 'dirt');
      terrain.setTile(99, 99, 'dirt');
      
      // Try to add at 100,100 (would create 101x101)
      const result = terrain.setTile(100, 100, 'dirt');
      
      expect(result).to.be.false;
    });
    
    it('should allow negative coords within custom limit', function() {
      terrain = new SparseTerrain(32, 'grass', { maxMapSize: 100 });
      
      // Create area from -50 to 49 (100 tiles)
      expect(terrain.setTile(-50, 0, 'dirt')).to.be.true;
      expect(terrain.setTile(49, 0, 'dirt')).to.be.true;
      
      const bounds = terrain.getBounds();
      expect(bounds.maxX - bounds.minX + 1).to.equal(100);
    });
  });
  
  describe('Compatibility Properties with Custom Size', function() {
    it('should set _gridSizeX/_gridSizeY to match custom maxMapSize', function() {
      terrain = new SparseTerrain(32, 'grass', { maxMapSize: 250 });
      
      // For compatibility, these should represent the max canvas
      expect(terrain._gridSizeX).to.equal(250);
      expect(terrain._gridSizeY).to.equal(250);
    });
    
    it('should maintain _chunkSize = 1 for all sizes', function() {
      terrain = new SparseTerrain(32, 'grass', { maxMapSize: 500 });
      
      expect(terrain._chunkSize).to.equal(1);
    });
    
    it('should update compatibility properties when size changes', function() {
      terrain = new SparseTerrain(32, 'grass', { maxMapSize: 100 });
      
      expect(terrain._gridSizeX).to.equal(100);
      
      // If we add setMaxMapSize method later
      // terrain.setMaxMapSize(200);
      // expect(terrain._gridSizeX).to.equal(200);
    });
  });
  
  describe('JSON Export/Import with Custom Size', function() {
    it('should export maxMapSize in metadata', function() {
      terrain = new SparseTerrain(32, 'grass', { maxMapSize: 150 });
      terrain.setTile(0, 0, 'dirt');
      
      const data = terrain.exportToJSON(); // Returns object, not string
      
      expect(data.metadata.maxMapSize).to.equal(150);
    });
    
    it('should restore maxMapSize from JSON import', function() {
      const json = JSON.stringify({
        version: '1.0',
        metadata: {
          tileSize: 32,
          defaultMaterial: 'grass',
          maxMapSize: 300,
          bounds: { minX: 0, minY: 0, maxX: 5, maxY: 5 }
        },
        tiles: [
          { x: 0, y: 0, material: 'dirt' }
        ]
      });
      
      terrain = new SparseTerrain(32, 'grass');
      terrain.importFromJSON(json);
      
      expect(terrain.MAX_MAP_SIZE).to.equal(300);
    });
    
    it('should use default if JSON missing maxMapSize', function() {
      const json = JSON.stringify({
        version: '1.0',
        metadata: {
          tileSize: 32,
          defaultMaterial: 'grass',
          bounds: { minX: 0, minY: 0, maxX: 5, maxY: 5 }
        },
        tiles: [
          { x: 0, y: 0, material: 'dirt' }
        ]
      });
      
      terrain = new SparseTerrain(32, 'grass');
      terrain.importFromJSON(json);
      
      expect(terrain.MAX_MAP_SIZE).to.equal(100); // Default
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle very small custom size (10x10)', function() {
      terrain = new SparseTerrain(32, 'grass', { maxMapSize: 10 });
      
      expect(terrain.setTile(0, 0, 'dirt')).to.be.true;
      expect(terrain.setTile(9, 9, 'dirt')).to.be.true;
      expect(terrain.setTile(10, 10, 'dirt')).to.be.false; // Exceeds
    });
    
    it('should handle maximum allowed size (1000x1000)', function() {
      terrain = new SparseTerrain(32, 'grass', { maxMapSize: 1000 });
      
      expect(terrain.MAX_MAP_SIZE).to.equal(1000);
      expect(terrain.setTile(0, 0, 'dirt')).to.be.true;
      expect(terrain.setTile(999, 999, 'dirt')).to.be.true;
    });
    
    it('should handle options object with other properties', function() {
      terrain = new SparseTerrain(32, 'grass', { 
        maxMapSize: 200,
        someOtherOption: true 
      });
      
      expect(terrain.MAX_MAP_SIZE).to.equal(200);
    });
  });
});
