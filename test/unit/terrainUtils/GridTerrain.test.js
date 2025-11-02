/**
 * GridTerrain.test.js
 * Unit tests for GridTerrain API analysis
 * Part of Custom Level Loading - Phase 1.1
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('GridTerrain API Analysis', function() {
  let sandbox;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Set up JSDOM for window object
    if (typeof window === 'undefined') {
      const { JSDOM } = require('jsdom');
      const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
      global.window = dom.window;
      global.document = dom.window.document;
    }
    
    // Mock p5.js globals
    global.floor = Math.floor;
    global.ceil = Math.ceil;
    global.noiseSeed = sandbox.stub();
    global.noise = sandbox.stub().returns(0.5);
    global.logNormal = sandbox.stub();
    global.print = sandbox.stub();
    
    // Mock constants
    global.CHUNK_SIZE = 8;
    global.TILE_SIZE = 32;
    global.g_canvasX = 800;
    global.g_canvasY = 600;
    
    // Sync to window for JSDOM
    window.floor = global.floor;
    window.ceil = global.ceil;
    window.noiseSeed = global.noiseSeed;
    window.noise = global.noise;
    window.logNormal = global.logNormal;
    window.CHUNK_SIZE = global.CHUNK_SIZE;
    window.TILE_SIZE = global.TILE_SIZE;
    window.g_canvasX = global.g_canvasX;
    window.g_canvasY = global.g_canvasY;
    
    // Load required classes (gridTerrain includes Grid, Chunk, camRenderConverter)
    require('../../../Classes/terrainUtils/gridTerrain');
    
    // Extract classes from window (where they're defined)
    global.gridTerrain = window.gridTerrain;
    global.Grid = window.Grid;
    global.Chunk = window.Chunk;
    global.camRenderConverter = window.camRenderConverter;
  });
  
  afterEach(function() {
    sandbox.restore();
  });
  
  describe('Constructor and Initialization', function() {
    it('should create GridTerrain with correct chunk grid structure', function() {
      const terrain = new gridTerrain(3, 3, 12345);
      
      expect(terrain).to.exist;
      expect(terrain.chunkArray).to.exist;
      expect(terrain.chunkArray).to.be.instanceOf(Grid);
    });
    
    it('should initialize chunk array with correct dimensions', function() {
      const terrain = new gridTerrain(5, 5, 12345);
      const chunkCount = terrain.chunkArray.rawArray.length;
      
      expect(chunkCount).to.equal(25); // 5x5 = 25 chunks
    });
    
    it('should store chunk size and tile size', function() {
      const terrain = new gridTerrain(3, 3, 12345, 8, 32);
      
      expect(terrain._chunkSize).to.equal(8);
      expect(terrain._tileSize).to.equal(32);
    });
    
    it('should create renderConversion for coordinate transforms', function() {
      const terrain = new gridTerrain(3, 3, 12345);
      
      expect(terrain.renderConversion).to.exist;
      expect(terrain.renderConversion).to.be.instanceOf(camRenderConverter);
    });
  });
  
  describe('Coordinate System - Grid to Chunk/Tile Access', function() {
    it('should convert array position to chunk+relative coords (convArrToAccess)', function() {
      const terrain = new gridTerrain(3, 3, 12345);
      
      // Test: tile at [10, 10] should be in chunk [1, 1] with relative [2, 2]
      const result = terrain.convArrToAccess([10, 10]);
      
      expect(result).to.be.an('array').with.lengthOf(2);
      expect(result[0]).to.deep.equal([1, 1]); // chunk position
      expect(result[1]).to.deep.equal([2, 2]); // relative tile position
    });
    
    it('should convert relative position to chunk+tile coords (convRelToAccess)', function() {
      const terrain = new gridTerrain(3, 3, 12345);
      
      // Test with relative grid coordinates
      const result = terrain.convRelToAccess([5, 5]);
      
      expect(result).to.be.an('array').with.lengthOf(2);
      expect(result[0]).to.be.an('array'); // chunk coords
      expect(result[1]).to.be.an('array'); // relative tile coords
    });
  });
  
  describe('Tile Access Methods', function() {
    it('should get tile using array position (getArrPos)', function() {
      const terrain = new gridTerrain(3, 3, 12345);
      
      const tile = terrain.getArrPos([5, 5]);
      
      expect(tile).to.exist;
      expect(tile).to.have.property('type');
    });
    
    it('should get tile using relative grid position (get)', function() {
      const terrain = new gridTerrain(3, 3, 12345);
      
      const tile = terrain.get([0, 0]);
      
      expect(tile).to.exist;
      expect(tile).to.have.property('type');
    });
    
    it('should set tile using array position (setArrPos)', function() {
      const terrain = new gridTerrain(3, 3, 12345);
      const mockTile = { type: 2, material: 'stone' };
      
      terrain.setArrPos([5, 5], mockTile);
      const retrieved = terrain.getArrPos([5, 5]);
      
      expect(retrieved).to.deep.equal(mockTile);
    });
    
    it('should set tile using relative position (set)', function() {
      const terrain = new gridTerrain(3, 3, 12345);
      const mockTile = { type: 1, material: 'water' };
      
      terrain.set([0, 0], mockTile);
      const retrieved = terrain.get([0, 0]);
      
      expect(retrieved).to.deep.equal(mockTile);
    });
  });
  
  describe('Sparse vs Dense Storage Behavior', function() {
    it('should use chunk-based sparse storage', function() {
      const terrain = new gridTerrain(3, 3, 12345);
      
      // GridTerrain uses chunks, not a flat array
      expect(terrain.chunkArray.rawArray).to.be.an('array');
      expect(terrain.chunkArray.rawArray[0]).to.be.instanceOf(Chunk);
    });
    
    it('should access tiles through chunk hierarchy', function() {
      const terrain = new gridTerrain(3, 3, 12345);
      
      // Each chunk contains a tileData grid
      const chunk = terrain.chunkArray.rawArray[0];
      expect(chunk).to.have.property('tileData');
      expect(chunk.tileData).to.be.instanceOf(Grid);
    });
  });
  
  describe('Coordinate Conversion via renderConversion', function() {
    it('should provide renderConversion for world/grid transforms', function() {
      const terrain = new gridTerrain(3, 3, 12345);
      
      expect(terrain.renderConversion).to.exist;
      expect(terrain.renderConversion.convCanvasToPos).to.be.a('function');
      expect(terrain.renderConversion.convPosToCanvas).to.be.a('function');
    });
    
    it('should center grid to canvas using setGridToCenter', function() {
      const terrain = new gridTerrain(3, 3, 12345);
      
      expect(() => terrain.setGridToCenter()).to.not.throw();
    });
  });
  
  describe('Cache System', function() {
    it('should have terrain cache properties', function() {
      const terrain = new gridTerrain(3, 3, 12345);
      
      expect(terrain._terrainCache).to.be.null;
      expect(terrain._cacheValid).to.be.false;
      expect(terrain._cacheViewport).to.be.null;
    });
    
    it('should invalidate cache on terrain changes', function() {
      const terrain = new gridTerrain(3, 3, 12345);
      terrain._cacheValid = true;
      
      terrain.randomize();
      
      expect(terrain._cacheValid).to.be.false;
    });
  });
  
  describe('Terrain Generation Modes', function() {
    it('should support perlin noise generation mode', function() {
      const terrain = new gridTerrain(3, 3, 12345, 8, 32, [800, 600], 'perlin');
      
      expect(terrain._generationMode).to.equal('perlin');
    });
    
    it('should apply generation mode to all chunks', function() {
      const terrain = new gridTerrain(3, 3, 12345);
      
      // All chunks should have received terrain generation
      terrain.chunkArray.rawArray.forEach(chunk => {
        expect(chunk).to.exist;
        expect(chunk.tileData.rawArray.length).to.be.greaterThan(0);
      });
    });
  });
  
  describe('Tile Span and Bounds', function() {
    it('should calculate tile span range', function() {
      const terrain = new gridTerrain(3, 3, 12345);
      
      expect(terrain._tileSpan).to.exist;
      expect(terrain._tileSpan).to.be.an('array').with.lengthOf(2);
    });
    
    it('should provide tile span range (width/height)', function() {
      const terrain = new gridTerrain(3, 3, 12345);
      
      expect(terrain._tileSpanRange).to.exist;
      expect(terrain._tileSpanRange).to.be.an('array').with.lengthOf(2);
      expect(terrain._tileSpanRange[0]).to.be.a('number');
      expect(terrain._tileSpanRange[1]).to.be.a('number');
    });
  });
});
