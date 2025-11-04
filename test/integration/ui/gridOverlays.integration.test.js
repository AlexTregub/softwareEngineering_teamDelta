/**
 * Consolidated Grid & Overlays Integration Tests
 * Generated: 2025-10-29T03:16:53.948Z
 * Source files: 4
 * Total tests: 64
 */

// Common requires
let { expect } = require('chai');
let sinon = require('sinon');


// ================================================================
// dynamicGridOverlay.integration.test.js (16 tests)
// ================================================================
/**
 * Integration Tests: DynamicGridOverlay with SparseTerrain
 * 
 * Tests grid overlay rendering with SparseTerrain to ensure:
 * - Grid shows at mouse position when no tiles painted
 * - Grid updates with mouse movement
 * - Grid shows both vertical and horizontal lines
 */

// Setup JSDOM

// Load classes
let SparseTerrain = require('../../../Classes/terrainUtils/SparseTerrain');
let DynamicGridOverlay = require('../../../Classes/ui/_baseObjects/grids/DynamicGridOverlay');

// NOTE: These tests were written for DynamicGridOverlay v1/v2 which had update(), gridLines, etc.
// Current version is v3 which uses direct rendering without those methods.
// Tests are skipped pending API update or test rewrite for v3.
describe.skip('DynamicGridOverlay with SparseTerrain - Integration (OUTDATED - v1/v2 API)', function() {
  let terrain;
  let gridOverlay;
  
  beforeEach(function() {
    // Mock p5.js and logging
    global.logVerbose = sinon.stub();
    global.logInfo = sinon.stub();
    global.logError = sinon.stub();
    global.logNormal = sinon.stub();
    global.stroke = sinon.stub();
    global.strokeWeight = sinon.stub();
    global.line = sinon.stub();
    global.push = sinon.stub();
    global.pop = sinon.stub();
    
    window.logVerbose = global.logVerbose;
    window.logInfo = global.logInfo;
    window.logError = global.logError;
    window.logNormal = global.logNormal;
    window.stroke = global.stroke;
    window.strokeWeight = global.strokeWeight;
    window.line = global.line;
    window.push = global.push;
    window.pop = global.pop;
    
    // Create SparseTerrain
    terrain = new SparseTerrain(32, 'grass', { maxMapSize: 100 });
    gridOverlay = new DynamicGridOverlay(terrain, 2);
  });
  
  afterEach(function() {
    cleanupTestEnvironment();
  });
  
  describe('Grid at Mouse Position (No Tiles Painted)', function() {
    it('should show grid at mouse position when no tiles painted', function() {
      expect(terrain.getTileCount()).to.equal(0);
      
      // Update with mouse at (5, 5)
      gridOverlay.update({ x: 5, y: 5 });
      
      // Should generate grid lines
      expect(gridOverlay.gridLines.length).to.be.greaterThan(0);
    });
    
    it('should show both vertical and horizontal lines at mouse', function() {
      gridOverlay.update({ x: 10, y: 10 });
      
      const verticalLines = gridOverlay.gridLines.filter(line => line.x1 === line.x2);
      const horizontalLines = gridOverlay.gridLines.filter(line => line.y1 === line.y2);
      
      // Should have BOTH vertical and horizontal lines
      expect(verticalLines.length).to.be.greaterThan(0, 'Should have vertical lines');
      expect(horizontalLines.length).to.be.greaterThan(0, 'Should have horizontal lines');
    });
    
    it('should render grid with default opacity when no tiles', function() {
      gridOverlay.update({ x: 0, y: 0 });
      gridOverlay.render();
      
      // Should call line() to render grid
      expect(global.line.called).to.be.true;
      
      // Should set opacity (stroke with alpha)
      expect(global.stroke.called).to.be.true;
      const strokeCalls = global.stroke.getCalls();
      const hasAlpha = strokeCalls.some(call => call.args.length === 4); // RGBA
      expect(hasAlpha).to.be.true;
    });
    
    it('should cover bufferSize region around mouse', function() {
      const bufferSize = 2;
      const mouseX = 10;
      const mouseY = 10;
      
      gridOverlay.update({ x: mouseX, y: mouseY });
      
      const region = gridOverlay.calculateGridRegion({ x: mouseX, y: mouseY });
      
      expect(region.minX).to.equal(mouseX - bufferSize);
      expect(region.maxX).to.equal(mouseX + bufferSize);
      expect(region.minY).to.equal(mouseY - bufferSize);
      expect(region.maxY).to.equal(mouseY + bufferSize);
    });
  });
  
  describe('Grid Updates with Mouse Movement', function() {
    it('should update grid when mouse moves', function() {
      gridOverlay.update({ x: 5, y: 5 });
      const firstGridLines = gridOverlay.gridLines.length;
      
      gridOverlay.update({ x: 10, y: 10 });
      const secondGridLines = gridOverlay.gridLines.length;
      
      // Grid should be regenerated (may have same count but different positions)
      expect(secondGridLines).to.be.greaterThan(0);
    });
    
    it('should detect when update is needed', function() {
      gridOverlay.update({ x: 5, y: 5 });
      
      // Same position = no update needed
      expect(gridOverlay.needsUpdate({ x: 5, y: 5 })).to.be.false;
      
      // Different position = update needed
      expect(gridOverlay.needsUpdate({ x: 6, y: 5 })).to.be.true;
    });
  });
  
  describe('Grid with Painted Tiles', function() {
    it('should merge mouse and painted tile regions', function() {
      // Paint tiles at (0, 0)
      terrain.setTile(0, 0, 'grass');
      
      // Mouse at (10, 10)
      gridOverlay.update({ x: 10, y: 10 });
      
      const region = gridOverlay.calculateGridRegion({ x: 10, y: 10 });
      
      // Should cover both painted tiles (0,0) and mouse (10,10)
      expect(region.minX).to.be.lessThan(1);
      expect(region.maxX).to.be.greaterThan(9);
    });
    
    it('should show grid at painted tiles with feathering', function() {
      terrain.setTile(5, 5, 'grass');
      terrain.setTile(6, 5, 'dirt');
      
      gridOverlay.update(null); // No mouse, just painted tiles
      
      expect(gridOverlay.gridLines.length).to.be.greaterThan(0);
      
      // Should have opacity variation (feathering)
      const opacities = gridOverlay.gridLines.map(line => line.opacity);
      const uniqueOpacities = new Set(opacities);
      expect(uniqueOpacities.size).to.be.greaterThan(1);
    });
  });
  
  describe('Grid Line Rendering', function() {
    beforeEach(function() {
      terrain.setTile(0, 0, 'grass');
      gridOverlay.update({ x: 0, y: 0 });
    });
    
    it('should render vertical lines (x1 === x2)', function() {
      gridOverlay.render();
      
      const lineCalls = global.line.getCalls();
      const verticalLines = lineCalls.filter(call => 
        call.args[0] === call.args[2] // x1 === x2
      );
      
      expect(verticalLines.length).to.be.greaterThan(0);
    });
    
    it('should render horizontal lines (y1 === y2)', function() {
      gridOverlay.render();
      
      const lineCalls = global.line.getCalls();
      const horizontalLines = lineCalls.filter(call =>
        call.args[1] === call.args[3] // y1 === y2
      );
      
      expect(horizontalLines.length).to.be.greaterThan(0);
    });
    
    it('should apply opacity to each line', function() {
      gridOverlay.render();
      
      // Each line should have a stroke call before it
      expect(global.stroke.callCount).to.be.greaterThan(0);
      expect(global.line.callCount).to.be.greaterThan(0);
    });
  });
  
  describe('Performance with Sparse Terrain', function() {
    it('should only iterate painted tiles for feathering', function() {
      // Paint 10 tiles
      for (let i = 0; i < 10; i++) {
        terrain.setTile(i, 0, 'grass');
      }
      
      gridOverlay.update(null);
      
      // Should generate grid efficiently (not iterate 10,000 tiles)
      expect(gridOverlay.gridLines.length).to.be.lessThan(500);
    });
    
    it('should use cache for repeated feathering calculations', function() {
      terrain.setTile(0, 0, 'grass');
      
      gridOverlay.update(null);
      const firstLineCount = gridOverlay.gridLines.length;
      
      // Update again (should use cache)
      gridOverlay.update(null);
      const secondLineCount = gridOverlay.gridLines.length;
      
      expect(secondLineCount).to.equal(firstLineCount);
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle null mouse position', function() {
      expect(() => gridOverlay.update(null)).to.not.throw();
    });
    
    it('should handle no region (no tiles, no mouse)', function() {
      const region = gridOverlay.calculateGridRegion(null);
      expect(region).to.be.null;
      
      gridOverlay.update(null);
      expect(gridOverlay.gridLines.length).to.equal(0);
    });
    
    it('should handle negative grid coordinates', function() {
      expect(() => gridOverlay.update({ x: -5, y: -10 })).to.not.throw();
      expect(gridOverlay.gridLines.length).to.be.greaterThan(0);
    });
  });
});





// ================================================================
// gridEdgeDetection.integration.test.js (25 tests)
// ================================================================
/**
 * Integration Tests: DynamicGridOverlay Edge Detection
 * 
 * Tests edge-only grid rendering with real SparseTerrain instances.
 * Verifies grid appears only at edge tiles (not fully surrounded) + mouse hover.
 * 
 * Phase: 2B of Lazy Terrain Loading Enhancement
 */

// NOTE: Tests written for old DynamicGridOverlay API with edge detection, which v3 doesn't have
describe.skip('DynamicGridOverlay Edge Detection - Integration (OUTDATED - v1/v2 API)', function() {
  let DynamicGridOverlay;
  let SparseTerrain;
  let overlay;
  let terrain;
  let sandbox;

  before(function() {
    // Set up JSDOM for browser globals

    // Mock p5.js drawing functions
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.stroke = sinon.stub();
    global.strokeWeight = sinon.stub();
    global.line = sinon.stub();
    global.translate = sinon.stub();
    global.scale = sinon.stub();

    // Load classes
    DynamicGridOverlay = require('../../../Classes/ui/_baseObjects/grids/DynamicGridOverlay');
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




// ================================================================
// gridOverlay.v2.integration.test.js (13 tests)
// ================================================================
/**
 * DynamicGridOverlay v2 Integration Tests
 * 
 * Tests new UIObject-based implementation with real SparseTerrain.
 * Validates off-screen canvas rendering and cache integration.
 */

// Import real classes
let UIObject = require('../../../Classes/ui/_baseObjects/UIObject.js');
let CacheManager = require('../../../Classes/rendering/CacheManager.js');

// Make UIObject globally available (required for DynamicGridOverlay to extend it)
global.UIObject = UIObject;

// DUPLICATE REQUIRE REMOVED: let DynamicGridOverlay = require('../../../Classes/ui/UIComponents/DynamicGridOverlay.js');

// NOTE: Tests written specifically for v2 API with UIObject inheritance, cache management
describe.skip('DynamicGridOverlay v2 Integration Tests (OUTDATED - v2 API)', function() {
  let sandbox;
  let cacheManager;
  let mockTerrain;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Mock p5.js global functions
    global.createGraphics = sandbox.stub().callsFake((w, h) => {
      const mockBuffer = {
        width: w,
        height: h,
        clear: sandbox.stub(),
        background: sandbox.stub(),
        stroke: sandbox.stub(),
        strokeWeight: sandbox.stub(),
        line: sandbox.stub(),
        fill: sandbox.stub(),
        rect: sandbox.stub(),
        push: sandbox.stub(),
        pop: sandbox.stub(),
        remove: sandbox.stub()
      };
      return mockBuffer;
    });
    
    global.image = sandbox.stub();
    global.push = sandbox.stub();
    global.pop = sandbox.stub();
    
    // Sync with window for JSDOM
    if (typeof window !== 'undefined') {
      window.createGraphics = global.createGraphics;
      window.image = global.image;
      window.push = global.push;
      window.pop = global.pop;
    }
    
    // Get real CacheManager singleton
    cacheManager = CacheManager.getInstance();
    cacheManager.setMemoryBudget(10 * 1024 * 1024);
    
    // Clean slate
    const cacheNames = Array.from((cacheManager._caches || new Map()).keys());
    cacheNames.forEach(name => cacheManager.removeCache(name));
    
    // Make globally available
    global.CacheManager = CacheManager;
    if (typeof window !== 'undefined') {
      window.CacheManager = CacheManager;
    }
    
    // Mock SparseTerrain
    mockTerrain = {
      getBounds: sandbox.stub().returns({ minX: 0, minY: 0, maxX: 10, maxY: 10 }),
      getTiles: sandbox.stub().returns([
        { x: 0, y: 0, type: 0 },
        { x: 1, y: 0, type: 0 },
        { x: 0, y: 1, type: 0 }
      ])
    };
  });

  afterEach(function() {
    sandbox.restore();
    cacheManager.setMemoryBudget(10 * 1024 * 1024);
    const cacheNames = Array.from((cacheManager._caches || new Map()).keys());
    cacheNames.forEach(name => cacheManager.removeCache(name));
    
    if (typeof global !== 'undefined') {
      delete global.createGraphics;
      delete global.image;
      delete global.push;
      delete global.pop;
      delete global.CacheManager;
    }
    
    if (typeof window !== 'undefined') {
      delete window.createGraphics;
      delete window.image;
      delete window.push;
      delete window.pop;
      delete window.CacheManager;
    }
  });

  describe('UIObject Integration', function() {
    it('should extend UIObject and inherit cache management', function() {
      const overlay = new DynamicGridOverlay(mockTerrain, 32, 2);
      
      expect(overlay).to.be.instanceOf(UIObject);
      expect(overlay).to.be.instanceOf(DynamicGridOverlay);
      
      // Should have UIObject properties
      expect(overlay.width).to.be.a('number');
      expect(overlay.height).to.be.a('number');
      expect(overlay._cacheEnabled).to.be.true;
      
      overlay.destroy();
    });
    
    it('should register cache with CacheManager', function() {
      const overlay = new DynamicGridOverlay(mockTerrain, 32, 2);
      const cacheName = overlay._cacheName;
      
      expect(cacheManager.hasCache(cacheName)).to.be.true;
      
      overlay.destroy();
      
      expect(cacheManager.hasCache(cacheName)).to.be.false;
    });
    
    it('should use inherited render() method from UIObject', function() {
      const overlay = new DynamicGridOverlay(mockTerrain, 32, 2);
      
      // UIObject.render() should call renderToCache when dirty
      overlay.markDirty();
      
      const renderStub = sandbox.spy(overlay, 'renderToCache');
      
      overlay.render();
      
      // renderToCache should have been called (by UIObject)
      expect(renderStub.called).to.be.true;
      
      overlay.destroy();
    });
  });

  describe('Grid Rendering', function() {
    it('should calculate bounds from terrain', function() {
      const overlay = new DynamicGridOverlay(mockTerrain, 32, 2);
      
      // Bounds: 0-10 + buffer 2 = -2 to 12 = 14 tiles * 32px = 448px
      expect(overlay.width).to.equal(14 * 32);
      expect(overlay.height).to.equal(14 * 32);
      
      overlay.destroy();
    });
    
    it('should render grid lines to cache buffer', function() {
      const overlay = new DynamicGridOverlay(mockTerrain, 32, 2);
      
      const mockBuffer = overlay.getCacheBuffer();
      
      if (mockBuffer) {
        overlay.renderToCache(mockBuffer);
        
        // Should draw grid lines
        expect(mockBuffer.line.called).to.be.true;
        expect(mockBuffer.stroke.called).to.be.true;
      }
      
      overlay.destroy();
    });
    
    it('should only regenerate grid when terrain changes', function() {
      const overlay = new DynamicGridOverlay(mockTerrain, 32, 2);
      
      overlay.markDirty();
      overlay.render(); // First render
      
      const mockBuffer = overlay.getCacheBuffer();
      if (mockBuffer) {
        mockBuffer.line.resetHistory();
      }
      
      overlay.render(); // Second render (should NOT regenerate)
      
      if (mockBuffer) {
        // line() should NOT be called (cache reused)
        expect(mockBuffer.line.called).to.be.false;
      }
      
      overlay.destroy();
    });
  });

  describe('Mouse Hover', function() {
    it('should update mouse hover buffer when mouse moves to new tile', function() {
      const overlay = new DynamicGridOverlay(mockTerrain, 32, 2);
      
      overlay.update({ x: 64, y: 64 }); // Mouse at tile (2, 2)
      
      expect(overlay._mouseGridX).to.equal(2);
      expect(overlay._mouseGridY).to.equal(2);
      expect(overlay._mouseHoverBuffer).to.exist;
      
      overlay.destroy();
    });
    
    it('should NOT update when mouse stays in same tile', function() {
      const overlay = new DynamicGridOverlay(mockTerrain, 32, 2);
      
      overlay.update({ x: 64, y: 64 }); // Mouse at tile (2, 2)
      
      const firstBuffer = overlay._mouseHoverBuffer;
      
      overlay.update({ x: 70, y: 70 }); // Still in tile (2, 2)
      
      // Should be same buffer (not recreated)
      expect(overlay._mouseHoverBuffer).to.equal(firstBuffer);
      
      overlay.destroy();
    });
    
    it('should clear mouse hover when mouse leaves', function() {
      const overlay = new DynamicGridOverlay(mockTerrain, 32, 2);
      
      overlay.update({ x: 64, y: 64 }); // Mouse present
      expect(overlay._mouseHoverBuffer).to.exist;
      
      overlay.update(null); // Mouse gone
      
      expect(overlay._mouseGridX).to.be.null;
      expect(overlay._mouseGridY).to.be.null;
      expect(overlay._mouseHoverBuffer).to.be.null;
      
      overlay.destroy();
    });
  });

  describe('Performance & Caching', function() {
    it('should mark dirty when terrain changes', function() {
      const overlay = new DynamicGridOverlay(mockTerrain, 32, 2);
      
      overlay.markDirty();
      overlay.render(); // Render initial
      
      expect(overlay.isDirty()).to.be.false;
      
      // Change terrain
      mockTerrain.getTiles.returns([
        { x: 0, y: 0, type: 0 },
        { x: 1, y: 0, type: 0 },
        { x: 0, y: 1, type: 0 },
        { x: 2, y: 2, type: 0 } // New tile
      ]);
      
      overlay.update();
      
      // Should be dirty after terrain change
      expect(overlay.isDirty()).to.be.true;
      
      overlay.destroy();
    });
    
    it('should resize when terrain bounds change', function() {
      const overlay = new DynamicGridOverlay(mockTerrain, 32, 2);
      
      const initialWidth = overlay.width;
      
      // Expand terrain bounds
      mockTerrain.getBounds.returns({ minX: 0, minY: 0, maxX: 20, maxY: 20 });
      mockTerrain.getTiles.returns([
        { x: 0, y: 0, type: 0 },
        { x: 20, y: 20, type: 0 }
      ]);
      
      overlay.update();
      
      // Width should increase
      expect(overlay.width).to.be.greaterThan(initialWidth);
      
      overlay.destroy();
    });
  });

  describe('Cleanup', function() {
    it('should clean up mouse hover buffer on destroy', function() {
      const overlay = new DynamicGridOverlay(mockTerrain, 32, 2);
      
      overlay.update({ x: 64, y: 64 });
      const hoverBuffer = overlay._mouseHoverBuffer;
      
      overlay.destroy();
      
      expect(overlay._mouseHoverBuffer).to.be.null;
      
      if (hoverBuffer && hoverBuffer.remove) {
        expect(hoverBuffer.remove.called).to.be.true;
      }
    });
    
    it('should call parent destroy() to remove cache', function() {
      const overlay = new DynamicGridOverlay(mockTerrain, 32, 2);
      const cacheName = overlay._cacheName;
      
      expect(cacheManager.hasCache(cacheName)).to.be.true;
      
      overlay.destroy();
      
      expect(cacheManager.hasCache(cacheName)).to.be.false;
    });
  });
});




// ================================================================
// sparseTerrainMinimap.integration.test.js (10 tests)
// ================================================================
/**
 * Integration Tests: MiniMap with SparseTerrain
 * 
 * Tests MiniMap rendering with SparseTerrain to ensure:
 * - Only painted tiles are rendered (not full grid)
 * - Empty minimap when no tiles painted
 * - Proper bounds-based scaling
 */

// Setup JSDOM

// Load classes
// DUPLICATE REQUIRE REMOVED: let SparseTerrain = require('../../../Classes/terrainUtils/SparseTerrain');
let MiniMap = require('../../../Classes/ui/_baseObjects/minimap/MiniMap');

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
    cleanupTestEnvironment();
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
      // With 200x200 minimap and 11x11 tiles (352px), scale â‰ˆ 0.568
      // Each tile display size â‰ˆ 32 * 0.568 â‰ˆ 18px
      
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

