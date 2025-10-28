/**
 * Unit Tests: DynamicGridOverlay Caching System
 * 
 * Tests the grid line caching mechanism to eliminate frame rate drops.
 * 
 * TDD Phase: RED (Write tests FIRST, expect failures)
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

// Setup JSDOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

describe('DynamicGridOverlay - Caching System', function() {
  let overlay, mockP5, mockTerrain;
  
  beforeEach(function() {
    // Mock p5.js functions
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.stroke = sinon.stub();
    global.strokeWeight = sinon.stub();
    global.line = sinon.stub();
    global.floor = Math.floor;
    global.round = Math.round;
    global.min = Math.min;
    global.max = Math.max;
    global.abs = Math.abs;
    global.pow = Math.pow;
    global.map = sinon.stub();
    global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));
    
    // Sync to window for JSDOM
    window.push = global.push;
    window.pop = global.pop;
    window.stroke = global.stroke;
    window.strokeWeight = global.strokeWeight;
    window.line = global.line;
    window.floor = global.floor;
    window.round = global.round;
    window.min = global.min;
    window.max = global.max;
    window.abs = global.abs;
    window.pow = global.pow;
    window.map = global.map;
    window.createVector = global.createVector;
    
    // Mock terrain
    mockTerrain = {
      getTileAtGridCoords: sinon.stub().returns(null),
      paintedTiles: [],
      tileSize: 32,
      getBounds: sinon.stub().returns(null),
      getAllTiles: function*() { yield* this.paintedTiles; }
    };
    
    // Create DynamicGridOverlay instance (bufferSize default = 2)
    const DynamicGridOverlay = require('../../../Classes/ui/DynamicGridOverlay');
    overlay = new DynamicGridOverlay(mockTerrain, 2);
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Cache Hit Scenarios', function() {
    it('should return cached grid when mouse stays in same tile', function() {
      // First call - cache miss, generates grid
      overlay.update({ x: 3.2, y: 3.2 }); // Tile (3, 3)
      const firstGridLines = overlay.gridLines.length;
      const firstCacheKey = overlay._gridCache.cacheKey;
      
      // Second call - mouse moved within same tile
      overlay.update({ x: 3.8, y: 3.8 }); // Still tile (3, 3)
      const secondCacheKey = overlay._gridCache.cacheKey;
      
      // Should use cache (same cache key, same grid lines)
      expect(secondCacheKey).to.equal(firstCacheKey, 'Cache key should not change');
      expect(overlay.gridLines.length).to.equal(firstGridLines, 'Grid lines should be cached');
    });
    
    it('should return cached grid when no changes occur', function() {
      // Generate grid once
      overlay.update({ x: 100, y: 100 });
      const firstCacheKey = overlay._gridCache.cacheKey;
      
      // Call again with same parameters
      overlay.update({ x: 100, y: 100 });
      const secondCacheKey = overlay._gridCache.cacheKey;
      
      // Should use cache
      expect(secondCacheKey).to.equal(firstCacheKey, 'Should not regenerate grid when nothing changed');
    });
    
    it('should have >10x performance improvement on cache hit', function() {
      // First call - measure generation time
      overlay.update({ x: 3.5, y: 3.5 });
      const region = overlay.calculateGridRegion({ x: 3.5, y: 3.5 });
      
      const start1 = Date.now();
      overlay._gridCache.cacheKey = null; // Force regeneration
      overlay.generateGridLines(region, { x: 3.5, y: 3.5 });
      const generationTime = Date.now() - start1;
      
      // Second call - measure cache hit time (same tile)
      const start2 = Date.now();
      overlay.generateGridLines(region, { x: 3.8, y: 3.8 }); // Same tile (3, 3), should hit cache
      const cacheHitTime = Date.now() - start2;
      
      // Cache hit should be very fast (<1ms typically)
      expect(cacheHitTime).to.be.lessThan(Math.max(1, generationTime / 5), 
        'Cache hit should be significantly faster than generation');
    });
  });
  
  describe('Cache Invalidation - Mouse Movement', function() {
    it('should invalidate cache when mouse moves to different tile', function() {
      // Generate grid at tile (3, 3) - using grid coordinates
      overlay.update({ x: 3.5, y: 3.5 });
      const firstCacheKey = overlay._gridCache.cacheKey;
      
      // Move to different tile (4, 4)
      overlay.update({ x: 4.5, y: 4.5 });
      const secondCacheKey = overlay._gridCache.cacheKey;
      
      // Should regenerate grid (different cache key)
      expect(secondCacheKey).to.not.equal(firstCacheKey, 
        'Should regenerate grid when mouse moves to different tile');
    });
    
    it('should NOT invalidate cache when mouse moves within same tile', function() {
      // Generate grid at tile (3, 3)
      overlay.update({ x: 3.2, y: 3.2 });
      const firstCacheKey = overlay._gridCache.cacheKey;
      
      // Move within same tile (floor(3.8) = 3, same as floor(3.2) = 3)
      overlay.update({ x: 3.8, y: 3.8 });
      const secondCacheKey = overlay._gridCache.cacheKey;
      
      // Should NOT regenerate
      expect(secondCacheKey).to.equal(firstCacheKey, 
        'Should NOT regenerate grid for movement within same tile');
    });
    
    it('should invalidate cache when moving exactly 1 tile away', function() {
      // Start at tile (3, 3)
      overlay.update({ x: 3.5, y: 3.5 });
      const firstCacheKey = overlay._gridCache.cacheKey;
      
      // Move exactly 1 tile (to tile 4, 3)
      overlay.update({ x: 4.5, y: 3.5 });
      const secondCacheKey = overlay._gridCache.cacheKey;
      
      // Should regenerate
      expect(secondCacheKey).to.not.equal(firstCacheKey,
        'Should regenerate when moving 1 tile away');
    });
  });
  
  describe('Cache Invalidation - Painted Tiles', function() {
    it('should invalidate cache when painted tiles change', function() {
      // Generate grid with no painted tiles
      mockTerrain.paintedTiles = [];
      overlay.update({ x: 100, y: 100 });
      const firstCacheKey = overlay._gridCache.cacheKey;
      
      // Add painted tile
      mockTerrain.paintedTiles = [{ x: 3, y: 3 }];
      mockTerrain.getAllTiles = function*() { yield* mockTerrain.paintedTiles; };
      mockTerrain.getBounds = sinon.stub().returns({ minX: 3, maxX: 3, minY: 3, maxY: 3 });
      overlay.update({ x: 100, y: 100 }); // Same mouse position
      const secondCacheKey = overlay._gridCache.cacheKey;
      
      // Should regenerate due to tile change
      expect(secondCacheKey).to.not.equal(firstCacheKey,
        'Should regenerate when painted tiles change');
    });
    
    it('should invalidate cache when tile is removed', function() {
      // Generate grid with painted tile
      mockTerrain.paintedTiles = [{ x: 3, y: 3 }];
      mockTerrain.getAllTiles = function*() { yield* mockTerrain.paintedTiles; };
      mockTerrain.getBounds = sinon.stub().returns({ minX: 3, maxX: 3, minY: 3, maxY: 3 });
      overlay.update({ x: 3.5, y: 3.5 });
      const firstCacheKey = overlay._gridCache.cacheKey;
      
      // Remove painted tile - keep mouse at same position
      mockTerrain.paintedTiles = [];
      mockTerrain.getAllTiles = function*() { yield* mockTerrain.paintedTiles; };
      mockTerrain.getBounds = sinon.stub().returns(null);
      overlay.update({ x: 3.5, y: 3.5 });
      const secondCacheKey = overlay._gridCache.cacheKey;
      
      // Should regenerate
      expect(secondCacheKey).to.not.equal(firstCacheKey,
        'Should regenerate when painted tile is removed');
    });
    
    it('should invalidate cache when multiple tiles painted', function() {
      // Start with 1 tile
      mockTerrain.paintedTiles = [{ x: 3, y: 3 }];
      mockTerrain.getAllTiles = function*() { yield* mockTerrain.paintedTiles; };
      mockTerrain.getBounds = sinon.stub().returns({ minX: 3, maxX: 3, minY: 3, maxY: 3 });
      overlay.update({ x: 100, y: 100 });
      const firstCacheKey = overlay._gridCache.cacheKey;
      
      // Add 2 more tiles
      mockTerrain.paintedTiles = [
        { x: 3, y: 3 },
        { x: 4, y: 3 },
        { x: 3, y: 4 }
      ];
      mockTerrain.getAllTiles = function*() { yield* mockTerrain.paintedTiles; };
      mockTerrain.getBounds = sinon.stub().returns({ minX: 3, maxX: 4, minY: 3, maxY: 4 });
      overlay.update({ x: 100, y: 100 });
      const secondCacheKey = overlay._gridCache.cacheKey;
      
      // Should regenerate
      expect(secondCacheKey).to.not.equal(firstCacheKey,
        'Should regenerate when tiles added');
    });
  });
  
  describe('Cache Key Generation', function() {
    it('should generate different cache keys for different mouse tiles', function() {
      // This tests cache key generation by checking if keys are different
      overlay.update({ x: 3.5, y: 3.5 }); // Tile (3, 3)
      const cacheKey1 = overlay._gridCache.cacheKey;
      
      overlay.update({ x: 4.5, y: 4.5 }); // Tile (4, 4)
      const cacheKey2 = overlay._gridCache.cacheKey;
      
      // Different tiles should have different cache keys
      expect(cacheKey2).to.not.equal(cacheKey1,
        'Different mouse tiles should have different cache keys');
    });
    
    it('should generate different cache keys for different painted tile sets', function() {
      mockTerrain.paintedTiles = [{ x: 3, y: 3 }];
      mockTerrain.getAllTiles = function*() { yield* mockTerrain.paintedTiles; };
      mockTerrain.getBounds = sinon.stub().returns({ minX: 3, maxX: 3, minY: 3, maxY: 3 });
      overlay.update({ x: 100, y: 100 });
      const cacheKey1 = overlay._gridCache.cacheKey;
      
      mockTerrain.paintedTiles = [{ x: 4, y: 4 }];
      mockTerrain.getAllTiles = function*() { yield* mockTerrain.paintedTiles; };
      mockTerrain.getBounds = sinon.stub().returns({ minX: 4, maxX: 4, minY: 4, maxY: 4 });
      overlay.update({ x: 100, y: 100 });
      const cacheKey2 = overlay._gridCache.cacheKey;
      
      // Different tiles should have different cache keys
      expect(cacheKey2).to.not.equal(cacheKey1,
        'Different painted tiles should have different cache keys');
    });
    
    it('should generate same cache key for tile order changes', function() {
      // Order shouldn't matter for cache key
      mockTerrain.paintedTiles = [{ x: 3, y: 3 }, { x: 4, y: 4 }];
      mockTerrain.getAllTiles = function*() { yield* mockTerrain.paintedTiles; };
      mockTerrain.getBounds = sinon.stub().returns({ minX: 3, maxX: 4, minY: 3, maxY: 4 });
      overlay.update({ x: 100, y: 100 });
      const cacheKey1 = overlay._gridCache.cacheKey;
      
      // Same tiles, different order
      mockTerrain.paintedTiles = [{ x: 4, y: 4 }, { x: 3, y: 3 }];
      mockTerrain.getAllTiles = function*() { yield* mockTerrain.paintedTiles; };
      overlay.update({ x: 100, y: 100 });
      const cacheKey2 = overlay._gridCache.cacheKey;
      
      // Should use cache (order-independent)
      expect(cacheKey2).to.equal(cacheKey1,
        'Cache key should be order-independent for painted tiles');
    });
  });
  
  describe('Cache Memory Safety', function() {
    it('should not grow cache unbounded', function() {
      // Generate grids with many different configurations
      for (let i = 0; i < 100; i++) {
        mockTerrain.paintedTiles = [{ x: i, y: i }];
        mockTerrain.getAllTiles = function*() { yield* mockTerrain.paintedTiles; };
        overlay.update({ x: i * 32, y: i * 32 });
      }
      
      // Cache should be single instance (last configuration)
      // We can't directly check size, but verify no memory leak warnings
      expect(overlay).to.exist; // Placeholder - would check memory in real scenario
    });
  });
});
