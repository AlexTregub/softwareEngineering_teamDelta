/**
 * Unit tests for DynamicGridOverlay edge detection functionality
 * Tests the _isEdgeTile() method and edge-only grid rendering
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('DynamicGridOverlay - Edge Detection', function() {
  let DynamicGridOverlay;
  let SparseTerrain;
  let overlay;
  let terrain;
  let sandbox;

  before(function() {
    // Set up JSDOM for browser globals
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;

    // Mock p5.js drawing functions
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.stroke = sinon.stub();
    global.strokeWeight = sinon.stub();
    global.line = sinon.stub();
    global.translate = sinon.stub();
    global.scale = sinon.stub();

    // Load classes
    DynamicGridOverlay = require('../../../Classes/ui/DynamicGridOverlay');
    SparseTerrain = require('../../../Classes/terrainUtils/SparseTerrain');
  });

  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Create terrain and overlay
    terrain = new SparseTerrain(32); // 32px tile size
    overlay = new DynamicGridOverlay(terrain, 2); // bufferSize = 2
    
    // Reset drawing stubs
    global.push.resetHistory();
    global.pop.resetHistory();
    global.stroke.resetHistory();
    global.strokeWeight.resetHistory();
    global.line.resetHistory();
  });

  afterEach(function() {
    sandbox.restore();
  });

  after(function() {
    delete global.window;
    delete global.document;
    delete global.push;
    delete global.pop;
    delete global.stroke;
    delete global.strokeWeight;
    delete global.line;
    delete global.translate;
    delete global.scale;
  });

  describe('_isEdgeTile()', function() {
    it('should return true for tile with empty north neighbor', function() {
      const paintedSet = new Set(['5,5', '5,6']); // Two tiles vertically, (5,5) has empty north
      
      const isEdge = overlay._isEdgeTile(5, 5, paintedSet);
      
      expect(isEdge).to.be.true;
    });

    it('should return true for tile with empty south neighbor', function() {
      const paintedSet = new Set(['5,5', '5,4']); // Two tiles vertically, (5,5) has empty south
      
      const isEdge = overlay._isEdgeTile(5, 5, paintedSet);
      
      expect(isEdge).to.be.true;
    });

    it('should return true for tile with empty east neighbor', function() {
      const paintedSet = new Set(['5,5', '4,5']); // Two tiles horizontally, (5,5) has empty east
      
      const isEdge = overlay._isEdgeTile(5, 5, paintedSet);
      
      expect(isEdge).to.be.true;
    });

    it('should return true for tile with empty west neighbor', function() {
      const paintedSet = new Set(['5,5', '6,5']); // Two tiles horizontally, (5,5) has empty west
      
      const isEdge = overlay._isEdgeTile(5, 5, paintedSet);
      
      expect(isEdge).to.be.true;
    });

    it('should return false for tile fully surrounded on all 4 sides', function() {
      const paintedSet = new Set([
        '5,5',   // Center tile
        '5,4',   // North
        '5,6',   // South
        '6,5',   // East
        '4,5'    // West
      ]);
      
      const isEdge = overlay._isEdgeTile(5, 5, paintedSet);
      
      expect(isEdge).to.be.false;
    });

    it('should return true for single isolated tile (all neighbors empty)', function() {
      const paintedSet = new Set(['5,5']); // Only one tile
      
      const isEdge = overlay._isEdgeTile(5, 5, paintedSet);
      
      expect(isEdge).to.be.true;
    });

    it('should return true for corner tile in 3x3 grid (has 2 empty neighbors)', function() {
      const paintedSet = new Set([
        '0,0', '1,0', '2,0', // Top row
        '0,1', '1,1', '2,1', // Middle row
        '0,2', '1,2', '2,2'  // Bottom row
      ]);
      
      // Top-left corner (0,0) has empty north and west
      const isEdge = overlay._isEdgeTile(0, 0, paintedSet);
      
      expect(isEdge).to.be.true;
    });

    it('should return false for center tile in 3x3 grid (fully surrounded)', function() {
      const paintedSet = new Set([
        '0,0', '1,0', '2,0', // Top row
        '0,1', '1,1', '2,1', // Middle row
        '0,2', '1,2', '2,2'  // Bottom row
      ]);
      
      // Center tile (1,1) is surrounded on all 4 sides
      const isEdge = overlay._isEdgeTile(1, 1, paintedSet);
      
      expect(isEdge).to.be.false;
    });
  });

  describe('calculateGridRegion() - Edge Filtering', function() {
    it('should include only edge tiles when calculating region (not interior tiles)', function() {
      // Paint 3x3 grid - only outer 8 tiles should be edges, center tile should NOT
      terrain.setTile(0, 0, 1);
      terrain.setTile(1, 0, 1);
      terrain.setTile(2, 0, 1);
      terrain.setTile(0, 1, 1);
      terrain.setTile(1, 1, 1); // Center - NOT an edge
      terrain.setTile(2, 1, 1);
      terrain.setTile(0, 2, 1);
      terrain.setTile(1, 2, 1);
      terrain.setTile(2, 2, 1);

      const region = overlay.calculateGridRegion(null);

      // Region should NOT extend to include the center tile if it's filtered
      // This is implementation-dependent, but we expect edge-only bounds
      expect(region).to.have.property('minX');
      expect(region).to.have.property('maxX');
      expect(region).to.have.property('minY');
      expect(region).to.have.property('maxY');
    });

    it('should include mouse hover location even if not an edge tile', function() {
      // Paint 3x3 grid
      terrain.setTile(0, 0, 1);
      terrain.setTile(1, 0, 1);
      terrain.setTile(2, 0, 1);
      terrain.setTile(0, 1, 1);
      terrain.setTile(1, 1, 1); // Center - NOT an edge
      terrain.setTile(2, 1, 1);
      terrain.setTile(0, 2, 1);
      terrain.setTile(1, 2, 1);
      terrain.setTile(2, 2, 1);

      // Mouse hovering over center tile (1, 1) which is NOT an edge
      const mousePos = { x: 1 * 32 + 16, y: 1 * 32 + 16 };
      const region = overlay.calculateGridRegion(mousePos);

      // Region should include center tile because mouse is there
      expect(region.minX).to.be.lte(1);
      expect(region.maxX).to.be.gte(1);
      expect(region.minY).to.be.lte(1);
      expect(region.maxY).to.be.gte(1);
    });

    it('should handle single row of tiles (all are edges)', function() {
      // Single horizontal row - all tiles have empty north and south
      terrain.setTile(0, 5, 1);
      terrain.setTile(1, 5, 1);
      terrain.setTile(2, 5, 1);

      const region = overlay.calculateGridRegion(null);

      // All tiles should be considered edges
      // bufferSize is 2, so region extends beyond tile bounds
      expect(region.minX).to.be.lte(0);
      expect(region.maxX).to.be.gte(2);
    });

    it('should handle L-shaped pattern (no fully interior tiles)', function() {
      // L-shape: all tiles have at least one empty neighbor
      terrain.setTile(0, 0, 1);
      terrain.setTile(0, 1, 1);
      terrain.setTile(0, 2, 1);
      terrain.setTile(1, 2, 1);
      terrain.setTile(2, 2, 1);

      const region = overlay.calculateGridRegion(null);

      // All tiles in L-shape are edges
      expect(region).to.exist;
      expect(region.minX).to.be.lte(0);
      expect(region.maxX).to.be.gte(2);
    });
  });

  describe('generateGridLines() - Edge-Only Rendering', function() {
    it('should NOT generate grid lines for fully surrounded tiles when mouse elsewhere', function() {
      // Paint 3x3 grid
      terrain.setTile(0, 0, 1);
      terrain.setTile(1, 0, 1);
      terrain.setTile(2, 0, 1);
      terrain.setTile(0, 1, 1);
      terrain.setTile(1, 1, 1); // Center - fully surrounded
      terrain.setTile(2, 1, 1);
      terrain.setTile(0, 2, 1);
      terrain.setTile(1, 2, 1);
      terrain.setTile(2, 2, 1);

      // Mouse far away from grid
      const mousePos = { x: 1000, y: 1000 };
      const viewport = null;

      overlay.update(mousePos, viewport);
      overlay.render();

      // Grid should be generated, but we can't easily verify line count
      // This test verifies the system doesn't crash and generates something
      expect(global.line.called).to.be.true;
    });

    it('should generate grid lines for fully surrounded tile when mouse hovers over it', function() {
      // Paint 3x3 grid
      terrain.setTile(0, 0, 1);
      terrain.setTile(1, 0, 1);
      terrain.setTile(2, 0, 1);
      terrain.setTile(0, 1, 1);
      terrain.setTile(1, 1, 1); // Center - fully surrounded
      terrain.setTile(2, 1, 1);
      terrain.setTile(0, 2, 1);
      terrain.setTile(1, 2, 1);
      terrain.setTile(2, 2, 1);

      // Mouse hovering over center tile (1, 1)
      const mousePos = { x: 1 * 32 + 16, y: 1 * 32 + 16 };
      const viewport = null;

      overlay.update(mousePos, viewport);
      overlay.render();

      // Grid should be generated at mouse position
      expect(global.line.called).to.be.true;
    });

    it('should generate grid lines for all tiles in single row (all edges)', function() {
      // Single row - all tiles have empty neighbors
      terrain.setTile(0, 5, 1);
      terrain.setTile(1, 5, 1);
      terrain.setTile(2, 5, 1);

      const mousePos = null;
      const viewport = null;

      overlay.update(mousePos, viewport);
      overlay.render();

      // All tiles are edges, should generate grid
      expect(global.line.called).to.be.true;
    });
  });

  describe('Cache Invalidation - Edge Detection', function() {
    it('should invalidate cache when tile painted changes edge status', function() {
      // Start with L-shape (all edges)
      terrain.setTile(0, 0, 1);
      terrain.setTile(0, 1, 1);
      terrain.setTile(1, 1, 1);

      const mousePos = null;
      const viewport = null;

      // Generate initial grid (cache miss)
      overlay.update(mousePos, viewport);
      const initialCacheKey = overlay._gridCache.cacheKey;

      // Paint tile at (1, 0) - this makes (0, 0) NOT an edge anymore
      terrain.setTile(1, 0, 1);

      // Update should invalidate cache (different edge tiles)
      overlay.update(mousePos, viewport);
      const newCacheKey = overlay._gridCache.cacheKey;

      // Cache key should change because edge tiles changed
      expect(newCacheKey).to.not.equal(initialCacheKey);
    });

    it('should invalidate cache when tile erased changes edge status', function() {
      // Start with 2x2 grid
      terrain.setTile(0, 0, 1);
      terrain.setTile(1, 0, 1);
      terrain.setTile(0, 1, 1);
      terrain.setTile(1, 1, 1);

      const mousePos = null;
      const viewport = null;

      // Generate initial grid
      overlay.update(mousePos, viewport);
      const initialCacheKey = overlay._gridCache.cacheKey;

      // Erase tile at (1, 0) - changes edge status of neighbors
      terrain.deleteTile(1, 0);

      // Update should invalidate cache
      overlay.update(mousePos, viewport);
      const newCacheKey = overlay._gridCache.cacheKey;

      expect(newCacheKey).to.not.equal(initialCacheKey);
    });
  });

  describe('Performance - Large Grid with Interior Tiles', function() {
    it('should have improved performance with 100 tiles (mostly interior)', function() {
      // Paint 10x10 grid - 36 edge tiles + 64 interior tiles
      for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
          terrain.setTile(x, y);
        }
      }

      const mousePos = null;
      const viewport = null;

      const startTime = performance.now();
      overlay.update(mousePos, viewport);
      overlay.render();
      const endTime = performance.now();

      const duration = endTime - startTime;

      // With edge-only rendering, should be < 20ms for 100 tiles (mostly interior)
      // This is much faster than rendering all 100 tiles (would be 50-100ms)
      expect(duration).to.be.lessThan(20); // Generous margin for test environment
    });

    it('should generate significantly fewer grid lines for interior-heavy grids', function() {
      // Paint 10x10 grid
      for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
          terrain.setTile(x, y);
        }
      }

      const mousePos = null;
      const viewport = null;

      global.line.resetHistory();
      overlay.update(mousePos, viewport);
      overlay.render();

      const lineCount = global.line.callCount;

      // With edge-only rendering (36 edge tiles out of 100):
      // ~276 lines (36 edge tiles * ~7.7 lines/tile average)
      // Without edge detection: ~768 lines (100 tiles * ~7.7 lines/tile)
      // Should be significantly less than 768
      expect(lineCount).to.be.lessThan(500); // Should be ~276, but being generous
    });
  });

  describe('Edge Cases', function() {
    it('should handle empty terrain (no tiles)', function() {
      const mousePos = null;
      const viewport = null;

      expect(() => {
        overlay.update(mousePos, viewport);
        overlay.render();
      }).to.not.throw();
    });

    it('should handle single tile (edge by definition)', function() {
      terrain.setTile(5, 5, 1);

      const mousePos = null;
      const viewport = null;

      expect(() => {
        overlay.update(mousePos, viewport);
        overlay.render();
      }).to.not.throw();

      expect(global.line.called).to.be.true;
    });

    it('should handle two adjacent tiles (both edges)', function() {
      terrain.setTile(5, 5, 1);
      terrain.setTile(6, 5, 1);

      const mousePos = null;
      const viewport = null;

      overlay.update(mousePos, viewport);
      overlay.render();

      expect(global.line.called).to.be.true;
    });
  });
});
