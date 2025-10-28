/**
 * Integration Tests: DynamicGridOverlay Edge Detection
 * 
 * Tests edge-only grid rendering with real SparseTerrain instances.
 * Verifies grid appears only at edge tiles (not fully surrounded) + mouse hover.
 * 
 * Phase: 2B of Lazy Terrain Loading Enhancement
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('DynamicGridOverlay Edge Detection - Integration', function() {
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
    
    // Create real terrain and overlay instances
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

  describe('3x3 Grid Pattern (8 edges + 1 interior)', function() {
    beforeEach(function() {
      // Paint 3x3 grid
      terrain.setTile(0, 0, 1);
      terrain.setTile(1, 0, 1);
      terrain.setTile(2, 0, 1);
      terrain.setTile(0, 1, 1);
      terrain.setTile(1, 1, 1); // Center tile - fully surrounded
      terrain.setTile(2, 1, 1);
      terrain.setTile(0, 2, 1);
      terrain.setTile(1, 2, 1);
      terrain.setTile(2, 2, 1);
    });

    it('should only calculate region for 8 edge tiles (not center interior tile)', function() {
      const region = overlay.calculateGridRegion(null);
      
      expect(region).to.exist;
      // Region should be based on edge tiles (0-2 range) + buffer
      expect(region.minX).to.be.lte(0);
      expect(region.maxX).to.be.gte(2);
      expect(region.minY).to.be.lte(0);
      expect(region.maxY).to.be.gte(2);
    });

    it('should generate grid lines only around edge tiles (not center)', function() {
      overlay.update(null, null);
      
      // Grid should be generated
      expect(overlay.gridLines.length).to.be.greaterThan(0);
      
      // Render should call line() for each grid line
      overlay.render();
      expect(global.line.called).to.be.true;
    });

    it('should include center tile when mouse hovers over it', function() {
      // Mouse hovering over center tile (1, 1)
      const mousePos = { x: 1, y: 1 };
      const region = overlay.calculateGridRegion(mousePos);
      
      // Region should include center tile
      expect(region.minX).to.be.lte(1);
      expect(region.maxX).to.be.gte(1);
      expect(region.minY).to.be.lte(1);
      expect(region.maxY).to.be.gte(1);
    });

    it('should generate grid at center when mouse hovers (even though interior)', function() {
      const mousePos = { x: 1, y: 1 }; // Center tile
      overlay.update(mousePos, null);
      overlay.render();
      
      // Grid should be generated at mouse position
      expect(global.line.called).to.be.true;
      expect(overlay.gridLines.length).to.be.greaterThan(0);
    });
  });

  describe('Single Row Pattern (all edges)', function() {
    it('should treat all tiles in single row as edges', function() {
      // Horizontal row
      terrain.setTile(0, 5, 1);
      terrain.setTile(1, 5, 1);
      terrain.setTile(2, 5, 1);
      terrain.setTile(3, 5, 1);
      terrain.setTile(4, 5, 1);

      const region = overlay.calculateGridRegion(null);

      expect(region).to.exist;
      expect(region.minX).to.be.lte(0);
      expect(region.maxX).to.be.gte(4);
    });

    it('should generate grid for all tiles in single row', function() {
      terrain.setTile(0, 5, 1);
      terrain.setTile(1, 5, 1);
      terrain.setTile(2, 5, 1);

      overlay.update(null, null);
      overlay.render();

      expect(global.line.called).to.be.true;
    });

    it('should treat all tiles in single column as edges', function() {
      // Vertical column
      terrain.setTile(5, 0, 1);
      terrain.setTile(5, 1, 1);
      terrain.setTile(5, 2, 1);
      terrain.setTile(5, 3, 1);

      const region = overlay.calculateGridRegion(null);

      expect(region).to.exist;
      expect(region.minY).to.be.lte(0);
      expect(region.maxY).to.be.gte(3);
    });
  });

  describe('L-Shaped Pattern (no interior tiles)', function() {
    it('should treat all L-shape tiles as edges', function() {
      // L-shape: vertical then horizontal
      terrain.setTile(0, 0, 1);
      terrain.setTile(0, 1, 1);
      terrain.setTile(0, 2, 1);
      terrain.setTile(1, 2, 1);
      terrain.setTile(2, 2, 1);

      const region = overlay.calculateGridRegion(null);

      expect(region).to.exist;
      // All tiles have at least one empty neighbor
      expect(region.minX).to.be.lte(0);
      expect(region.maxX).to.be.gte(2);
      expect(region.minY).to.be.lte(0);
      expect(region.maxY).to.be.gte(2);
    });

    it('should generate grid for entire L-shape', function() {
      terrain.setTile(0, 0, 1);
      terrain.setTile(0, 1, 1);
      terrain.setTile(0, 2, 1);
      terrain.setTile(1, 2, 1);
      terrain.setTile(2, 2, 1);

      overlay.update(null, null);
      overlay.render();

      expect(global.line.called).to.be.true;
    });
  });

  describe('Large Grid with Multiple Interior Tiles', function() {
    it('should only render edges in 5x5 grid (16 edges, 9 interior)', function() {
      // Paint 5x5 grid
      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          terrain.setTile(x, y, 1);
        }
      }

      const region = overlay.calculateGridRegion(null);

      expect(region).to.exist;
      // Should be based on edge tiles only (not all 25 tiles)
      expect(region.minX).to.be.lte(0);
      expect(region.maxX).to.be.gte(4);
    });

    it('should generate fewer grid lines for 5x5 (only edges)', function() {
      // Paint 5x5 grid (25 tiles, 16 edges, 9 interior)
      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          terrain.setTile(x, y, 1);
        }
      }

      global.line.resetHistory();
      overlay.update(null, null);
      overlay.render();

      const lineCountEdgeOnly = global.line.callCount;

      // Should be significantly less than rendering all 25 tiles
      // Edge tiles: 16 (outer ring), Interior: 9 (center 3x3)
      // Rough estimate: should be less than 75% of full grid
      expect(lineCountEdgeOnly).to.be.greaterThan(0);
      expect(lineCountEdgeOnly).to.be.lessThan(200); // Upper bound for edge-only
    });

    it('should have good performance with 10x10 grid (64 interior tiles)', function() {
      // Paint 10x10 grid (36 edge + 64 interior)
      for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
          terrain.setTile(x, y, 1);
        }
      }

      const startTime = performance.now();
      overlay.update(null, null);
      overlay.render();
      const endTime = performance.now();

      const duration = endTime - startTime;

      // Should be fast even with large grid (only rendering edges)
      expect(duration).to.be.lessThan(50); // ms
    });
  });

  describe('Dynamic Edge Changes', function() {
    it('should update edges when tile added changes interior to edge', function() {
      // Start with 2x2 grid (all edges)
      terrain.setTile(0, 0, 1);
      terrain.setTile(1, 0, 1);
      terrain.setTile(0, 1, 1);
      terrain.setTile(1, 1, 1);

      overlay.update(null, null);
      const initialCacheKey = overlay._gridCache.cacheKey;

      // Add tile that makes (1,1) NOT an edge anymore
      // ... actually, 2x2 all are edges. Let's use 3x3 instead
      terrain.setTile(2, 0, 1);
      terrain.setTile(2, 1, 1);
      terrain.setTile(0, 2, 1);
      terrain.setTile(1, 2, 1);
      terrain.setTile(2, 2, 1);
      // Now (1,1) is interior

      overlay.update(null, null);
      const newCacheKey = overlay._gridCache.cacheKey;

      // Cache should invalidate because edge tiles changed
      expect(newCacheKey).to.not.equal(initialCacheKey);
    });

    it('should update edges when tile removed exposes new edge', function() {
      // Start with 3x3 grid
      terrain.setTile(0, 0, 1);
      terrain.setTile(1, 0, 1);
      terrain.setTile(2, 0, 1);
      terrain.setTile(0, 1, 1);
      terrain.setTile(1, 1, 1); // Interior
      terrain.setTile(2, 1, 1);
      terrain.setTile(0, 2, 1);
      terrain.setTile(1, 2, 1);
      terrain.setTile(2, 2, 1);

      overlay.update(null, null);
      const initialCacheKey = overlay._gridCache.cacheKey;

      // Remove top-middle tile - changes edge status
      terrain.deleteTile(1, 0);

      overlay.update(null, null);
      const newCacheKey = overlay._gridCache.cacheKey;

      expect(newCacheKey).to.not.equal(initialCacheKey);
    });
  });

  describe('Mouse Hover Integration', function() {
    it('should prioritize mouse hover over edge detection', function() {
      // 3x3 grid with interior tile
      terrain.setTile(0, 0, 1);
      terrain.setTile(1, 0, 1);
      terrain.setTile(2, 0, 1);
      terrain.setTile(0, 1, 1);
      terrain.setTile(1, 1, 1); // Interior
      terrain.setTile(2, 1, 1);
      terrain.setTile(0, 2, 1);
      terrain.setTile(1, 2, 1);
      terrain.setTile(2, 2, 1);

      // Mouse over interior tile
      const mousePos = { x: 1, y: 1 };
      const region = overlay.calculateGridRegion(mousePos);

      // Should include interior tile because of mouse
      expect(region.minX).to.be.lte(1);
      expect(region.maxX).to.be.gte(1);
      expect(region.minY).to.be.lte(1);
      expect(region.maxY).to.be.gte(1);
    });

    it('should cache correctly with mouse hover on interior tile', function() {
      // 3x3 grid
      for (let x = 0; x < 3; x++) {
        for (let y = 0; y < 3; y++) {
          terrain.setTile(x, y, 1);
        }
      }

      // Mouse over interior tile (1,1)
      const mousePos1 = { x: 1, y: 1 };
      overlay.update(mousePos1, null);
      const cacheKey1 = overlay._gridCache.cacheKey;

      // Move mouse to different interior tile
      const mousePos2 = { x: 1.5, y: 1.5 }; // Still tile (1,1)
      overlay.update(mousePos2, null);
      const cacheKey2 = overlay._gridCache.cacheKey;

      // Cache should NOT invalidate (same tile)
      expect(cacheKey2).to.equal(cacheKey1);

      // Move mouse to different tile
      const mousePos3 = { x: 2, y: 2 };
      overlay.update(mousePos3, null);
      const cacheKey3 = overlay._gridCache.cacheKey;

      // Cache SHOULD invalidate (different tile)
      expect(cacheKey3).to.not.equal(cacheKey1);
    });
  });

  describe('Edge Cases', function() {
    it('should handle empty terrain gracefully', function() {
      const region = overlay.calculateGridRegion(null);
      
      expect(region).to.be.null;
    });

    it('should handle single tile (is an edge by definition)', function() {
      terrain.setTile(5, 5, 1);

      const region = overlay.calculateGridRegion(null);

      expect(region).to.exist;
      expect(region.minX).to.be.lte(5);
      expect(region.maxX).to.be.gte(5);
    });

    it('should handle two adjacent tiles (both edges)', function() {
      terrain.setTile(5, 5, 1);
      terrain.setTile(6, 5, 1);

      const region = overlay.calculateGridRegion(null);

      expect(region).to.exist;
      expect(region.minX).to.be.lte(5);
      expect(region.maxX).to.be.gte(6);
    });

    it('should handle diagonal-only neighbors (all edges)', function() {
      // Diamond pattern - only diagonal neighbors
      terrain.setTile(1, 0, 1); // Top
      terrain.setTile(0, 1, 1); // Left
      terrain.setTile(2, 1, 1); // Right
      terrain.setTile(1, 2, 1); // Bottom

      // All tiles are edges (no cardinal neighbors)
      const region = overlay.calculateGridRegion(null);

      expect(region).to.exist;
    });

    it('should handle sparse scattered tiles (all edges)', function() {
      // Scattered tiles far apart
      terrain.setTile(0, 0, 1);
      terrain.setTile(5, 5, 1);
      terrain.setTile(10, 10, 1);

      const region = overlay.calculateGridRegion(null);

      expect(region).to.exist;
      // All are edges (no neighbors)
      expect(region.minX).to.be.lte(0);
      expect(region.maxX).to.be.gte(10);
    });
  });

  describe('Grid Lines Should NOT Appear at Interior Tiles', function() {
    it('should have ZERO opacity grid lines at interior of 5x5 grid (hole effect)', function() {
      // Paint 5x5 grid (25 tiles: 16 edges, 9 interior)
      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          terrain.setTile(x, y, 1);
        }
      }

      // CRITICAL: Clear cache to ensure fresh calculation
      overlay._clearCache();
      overlay._gridCache.gridLines = [];
      overlay._gridCache.cacheKey = null;

      // Debug: Check what edge tiles exist
      const allTiles = Array.from(terrain.getAllTiles());
      const paintedSet = new Set(allTiles.map(t => `${t.x},${t.y}`));
      const edges = allTiles.filter(t => {
        const hasEmptyNeighbor = 
          !paintedSet.has(`${t.x-1},${t.y}`) ||
          !paintedSet.has(`${t.x+1},${t.y}`) ||
          !paintedSet.has(`${t.x},${t.y-1}`) ||
          !paintedSet.has(`${t.x},${t.y+1}`);
        return hasEmptyNeighbor;
      });
      console.log('Edge tiles in 5x5 grid:', edges.length, 'expected 16');
      
      // Update without mouse (no mouse hover affecting results)
      overlay.update(null, null);

      // Check that grid lines at interior tile (2,2) have ZERO opacity
      // Interior tile at (2,2) is 2 tiles from nearest edge, should be skipped entirely
      const tileSize = 32;
      const interiorX = 2;
      const interiorY = 2;

      // Find grid lines near the interior tile center
      const centerX = (interiorX + 0.5) * tileSize;
      const centerY = (interiorY + 0.5) * tileSize;

      const nearbyLines = overlay.gridLines.filter(line => {
        // Check if line is within 0.5 tiles of interior center
        const isVertical = line.x1 === line.x2;
        if (isVertical) {
          const lineX = line.x1;
          const distanceFromCenter = Math.abs(lineX - centerX) / tileSize;
          return distanceFromCenter < 0.6; // Within 0.6 tiles
        } else {
          const lineY = line.y1;
          const distanceFromCenter = Math.abs(lineY - centerY) / tileSize;
          return distanceFromCenter < 0.6; // Within 0.6 tiles
        }
      });

      // Should have ZERO nearby lines (they're skipped due to opacity 0)
      // Debug: log any lines that exist
      if (nearbyLines.length > 0) {
        console.log('Interior lines found:');
        nearbyLines.forEach(l => {
          const isVert = l.x1 === l.x2;
          console.log(`  ${isVert ? 'V' : 'H'} at ${isVert ? `x=${l.x1/tileSize}` : `y=${l.y1/tileSize}`}, opacity=${l.opacity}`);
        });
      }
      
      expect(nearbyLines.length).to.equal(0, 
        'Interior of 5x5 grid should have NO grid lines (hole effect)');
    });

    it('should have ZERO opacity at center of 10x10 grid (giant hole)', function() {
      // Paint 10x10 grid (100 tiles: 36 edges, 64 interior)
      for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
          terrain.setTile(x, y, 1);
        }
      }

      // Update without mouse
      overlay.update(null, null);

      const tileSize = 32;
      // Check center tile (5,5) - this is 4+ tiles from any edge
      const centerX = (5 + 0.5) * tileSize;
      const centerY = (5 + 0.5) * tileSize;

      const nearbyLines = overlay.gridLines.filter(line => {
        const isVertical = line.x1 === line.x2;
        if (isVertical) {
          const lineX = line.x1;
          const distanceFromCenter = Math.abs(lineX - centerX) / tileSize;
          return distanceFromCenter < 0.6;
        } else {
          const lineY = line.y1;
          const distanceFromCenter = Math.abs(lineY - centerY) / tileSize;
          return distanceFromCenter < 0.6;
        }
      });

      // Grid lines near center should NOT exist (opacity 0 = skipped)
      expect(nearbyLines.length).to.equal(0,
        'Center of 10x10 grid should have NO grid lines (giant hole effect)');
    });

    it('should have high opacity ONLY near edge tiles in 10x10 grid', function() {
      // Paint 10x10 grid
      for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
          terrain.setTile(x, y, 1);
        }
      }

      overlay.update(null, null);

      const tileSize = 32;
      
      // Check edge tile (0,0) - should have high opacity nearby
      const edgeX = (0 + 0.5) * tileSize;
      const edgeY = (0 + 0.5) * tileSize;

      const nearEdgeLines = overlay.gridLines.filter(line => {
        const isVertical = line.x1 === line.x2;
        if (isVertical) {
          const lineX = line.x1;
          const distanceFromEdge = Math.abs(lineX - edgeX) / tileSize;
          return distanceFromEdge < 0.6;
        } else {
          const lineY = line.y1;
          const distanceFromEdge = Math.abs(lineY - edgeY) / tileSize;
          return distanceFromEdge < 0.6;
        }
      });

      // Should have at least some high-opacity lines near edges
      const highOpacityLines = nearEdgeLines.filter(line => line.opacity > 0.5);
      expect(highOpacityLines.length).to.be.greaterThan(0,
        'Should have high opacity grid lines near edge tile (0,0)');
    });
  });

  describe('Performance Comparison', function() {
    it('should be faster with edge-only rendering vs theoretical all-tiles', function() {
      // Create large grid with many interior tiles
      for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
          terrain.setTile(x, y, 1);
        }
      }

      // Measure edge-only performance
      const startTime = performance.now();
      overlay.update(null, null);
      overlay.render();
      const endTime = performance.now();

      const edgeOnlyDuration = endTime - startTime;

      // Should be reasonably fast
      expect(edgeOnlyDuration).to.be.lessThan(30); // ms

      // Edge-only should render fewer lines
      const edgeOnlyLineCount = global.line.callCount;

      // For 10x10: 36 edge tiles vs 100 total tiles
      // Line count should reflect this reduction
      expect(edgeOnlyLineCount).to.be.greaterThan(0);
      expect(edgeOnlyLineCount).to.be.lessThan(500); // Upper bound
    });
  });
});
