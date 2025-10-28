/**
 * Integration Tests: MiniMap with SparseTerrain
 * 
 * Tests MiniMap rendering with SparseTerrain to ensure:
 * - Only painted tiles are rendered (not full grid)
 * - Empty minimap when no tiles painted
 * - Proper bounds-based scaling
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
const MiniMap = require('../../../Classes/ui/MiniMap');

describe('MiniMap with SparseTerrain - Integration', function() {
  let terrain;
  let minimap;
  let mockP5Graphics;
  
  beforeEach(function() {
    // Mock p5.js and logging
    global.logVerbose = sinon.stub();
    global.logInfo = sinon.stub();
    global.logError = sinon.stub();
    global.logNormal = sinon.stub();
    global.CacheManager = undefined; // Disable caching for tests
    
    window.logVerbose = global.logVerbose;
    window.logInfo = global.logInfo;
    window.logError = global.logError;
    window.logNormal = global.logNormal;
    
    // Mock p5.Graphics for buffer rendering
    mockP5Graphics = {
      background: sinon.stub(),
      fill: sinon.stub(),
      noStroke: sinon.stub(),
      rect: sinon.stub(),
      width: 200,
      height: 200
    };
    
    // Create SparseTerrain
    terrain = new SparseTerrain(32, 'grass', { maxMapSize: 100 });
    minimap = new MiniMap(terrain, 200, 200);
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Empty Terrain Rendering', function() {
    it('should render empty minimap when no tiles painted', function() {
      // Call render method directly
      minimap._renderTerrainToBuffer(mockP5Graphics);
      
      // Should clear background
      expect(mockP5Graphics.background.calledOnce).to.be.true;
      expect(mockP5Graphics.background.calledWith(20, 20, 20)).to.be.true;
      
      // Should NOT render any tiles (no rect calls)
      expect(mockP5Graphics.rect.called).to.be.false;
    });
    
    it('should handle getAllTiles() returning empty array', function() {
      expect(terrain.getTileCount()).to.equal(0);
      
      minimap._renderTerrainToBuffer(mockP5Graphics);
      
      // Should return early without rendering tiles
      expect(mockP5Graphics.rect.called).to.be.false;
    });
  });
  
  describe('Painted Tiles Rendering', function() {
    it('should render only painted tiles, not full grid', function() {
      // Paint 3 tiles
      terrain.setTile(10, 10, 'grass');
      terrain.setTile(20, 20, 'dirt');
      terrain.setTile(30, 30, 'stone');
      
      minimap._renderTerrainToBuffer(mockP5Graphics);
      
      // Should render exactly 3 tiles
      expect(mockP5Graphics.rect.callCount).to.equal(3);
      
      // Verify no iteration through unpainted tiles (would be 10,000 calls for 100x100)
      expect(mockP5Graphics.rect.callCount).to.be.lessThan(10);
    });
    
    it('should calculate scale based on painted bounds, not fixed size', function() {
      // Paint tiles in small region (0,0 to 10,10)
      terrain.setTile(0, 0, 'grass');
      terrain.setTile(10, 10, 'dirt');
      
      minimap._renderTerrainToBuffer(mockP5Graphics);
      
      // Should scale to fit 11x11 tile region, not 100x100
      // Scale should be larger for smaller region
      // With 200x200 minimap and 11x11 tiles (352px), scale ≈ 0.568
      // Each tile display size ≈ 32 * 0.568 ≈ 18px
      
      const rectCalls = mockP5Graphics.rect.getCalls();
      if (rectCalls.length > 0) {
        const tileSize = rectCalls[0].args[2]; // width argument
        expect(tileSize).to.be.greaterThan(5); // Not tiny (would be ~2px for 100x100)
        expect(tileSize).to.be.lessThan(50); // Not huge
      }
    });
    
    it('should render correct colors for different materials', function() {
      terrain.setTile(0, 0, 'grass');
      terrain.setTile(1, 0, 'dirt');
      terrain.setTile(2, 0, 'stone');
      
      minimap._renderTerrainToBuffer(mockP5Graphics);
      
      const fillCalls = mockP5Graphics.fill.getCalls();
      
      // Should have at least 3 fill calls (one per material)
      expect(fillCalls.length).to.be.greaterThan(2);
      
      // Grass: (50, 150, 50)
      expect(fillCalls.some(call => 
        call.args[0] === 50 && call.args[1] === 150 && call.args[2] === 50
      )).to.be.true;
      
      // Dirt: (120, 80, 40)
      expect(fillCalls.some(call =>
        call.args[0] === 120 && call.args[1] === 80 && call.args[2] === 40
      )).to.be.true;
      
      // Stone: (100, 100, 100)
      expect(fillCalls.some(call =>
        call.args[0] === 100 && call.args[1] === 100 && call.args[2] === 100
      )).to.be.true;
    });
  });
  
  describe('Sparse Terrain Performance', function() {
    it('should NOT iterate through all 10,000 tiles of 100x100 grid', function() {
      // Paint just 10 tiles scattered across the map
      for (let i = 0; i < 10; i++) {
        terrain.setTile(i * 10, i * 10, 'grass');
      }
      
      expect(terrain.getTileCount()).to.equal(10);
      
      minimap._renderTerrainToBuffer(mockP5Graphics);
      
      // Should render exactly 10 tiles, NOT 10,000
      expect(mockP5Graphics.rect.callCount).to.equal(10);
      
      // This is the bug we're preventing: old code would iterate 10,000 times
      expect(mockP5Graphics.rect.callCount).to.be.lessThan(100);
    });
    
    it('should handle widely separated tiles efficiently', function() {
      // Paint tiles at corners
      terrain.setTile(0, 0, 'grass');
      terrain.setTile(99, 0, 'grass');
      terrain.setTile(0, 99, 'grass');
      terrain.setTile(99, 99, 'grass');
      
      minimap._renderTerrainToBuffer(mockP5Graphics);
      
      // Should render 4 tiles, not iterate through all tiles in bounds
      expect(mockP5Graphics.rect.callCount).to.equal(4);
    });
  });
  
  describe('Bounds-Based Scaling', function() {
    it('should use getBounds() to calculate viewport', function() {
      terrain.setTile(10, 10, 'grass');
      terrain.setTile(20, 20, 'dirt');
      
      const bounds = terrain.getBounds();
      expect(bounds).to.deep.equal({
        minX: 10, maxX: 20,
        minY: 10, maxY: 20
      });
      
      minimap._renderTerrainToBuffer(mockP5Graphics);
      
      // Rendering should use bounds for scaling
      expect(mockP5Graphics.rect.callCount).to.equal(2);
    });
    
    it('should return early if bounds is null', function() {
      // No tiles painted
      expect(terrain.getBounds()).to.be.null;
      
      minimap._renderTerrainToBuffer(mockP5Graphics);
      
      // Should clear background but not render tiles
      expect(mockP5Graphics.background.called).to.be.true;
      expect(mockP5Graphics.rect.called).to.be.false;
    });
  });
  
  describe('Legacy Terrain Compatibility', function() {
    it('should detect SparseTerrain via getAllTiles method', function() {
      // SparseTerrain has getAllTiles()
      expect(terrain.getAllTiles).to.exist;
      expect(typeof terrain.getAllTiles).to.equal('function');
      
      // Legacy terrain doesn't have getAllTiles()
      const legacyTerrain = {
        width: 320,
        height: 320,
        tileSize: 32,
        getArrPos: sinon.stub()
      };
      
      expect(legacyTerrain.getAllTiles).to.be.undefined;
    });
  });
});
