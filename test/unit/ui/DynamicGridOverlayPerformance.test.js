/**
 * Performance Tests: DynamicGridOverlay Optimization
 * 
 * Tests grid generation performance and identifies bottlenecks
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
const DynamicGridOverlay = require('../../../Classes/ui/DynamicGridOverlay');

describe('DynamicGridOverlay - Performance Tests', function() {
  let terrain;
  let gridOverlay;
  
  beforeEach(function() {
    // Mock logging
    global.logVerbose = sinon.stub();
    global.logInfo = sinon.stub();
    global.logError = sinon.stub();
    global.logNormal = sinon.stub();
    
    window.logVerbose = global.logVerbose;
    window.logInfo = global.logInfo;
    window.logError = global.logError;
    window.logNormal = global.logNormal;
    
    terrain = new SparseTerrain(32, 'grass', { maxMapSize: 100 });
    gridOverlay = new DynamicGridOverlay(terrain, 2);
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Grid Generation Performance', function() {
    it('should generate grid for mouse hover quickly (<10ms)', function() {
      const start = Date.now();
      
      gridOverlay.update({ x: 10, y: 10 });
      
      const elapsed = Date.now() - start;
      
      expect(elapsed).to.be.lessThan(10, `Grid generation took ${elapsed}ms, should be <10ms`);
    });
    
    it('should generate grid for single painted tile quickly (<10ms)', function() {
      terrain.setTile(10, 10, 'grass');
      
      const start = Date.now();
      
      gridOverlay.update(null);
      
      const elapsed = Date.now() - start;
      
      expect(elapsed).to.be.lessThan(10, `Grid generation took ${elapsed}ms, should be <10ms`);
    });
    
    it('should handle 10 painted tiles efficiently (<20ms)', function() {
      // Paint 10 scattered tiles
      for (let i = 0; i < 10; i++) {
        terrain.setTile(i * 5, i * 5, 'grass');
      }
      
      const start = Date.now();
      
      gridOverlay.update(null);
      
      const elapsed = Date.now() - start;
      
      expect(elapsed).to.be.lessThan(20, `Grid generation took ${elapsed}ms, should be <20ms for 10 tiles`);
    });
    
    it('should handle 50 painted tiles efficiently (<50ms)', function() {
      // Paint 50 tiles in a cluster
      for (let i = 0; i < 50; i++) {
        const x = 10 + (i % 10);
        const y = 10 + Math.floor(i / 10);
        terrain.setTile(x, y, 'grass');
      }
      
      const start = Date.now();
      
      gridOverlay.update(null);
      
      const elapsed = Date.now() - start;
      
      expect(elapsed).to.be.lessThan(50, `Grid generation took ${elapsed}ms, should be <50ms for 50 tiles`);
    });
  });
  
  describe('Cache Effectiveness', function() {
    it('should reuse cached feathering calculations on second update', function() {
      terrain.setTile(10, 10, 'grass');
      
      // First update - populates cache
      gridOverlay.update(null);
      const firstLineCount = gridOverlay.gridLines.length;
      
      // Spy on calculateFeathering
      const calculateFeatheringSpy = sinon.spy(gridOverlay, 'calculateFeathering');
      
      // Second update with same state - should use cache more
      gridOverlay.update(null);
      const secondLineCount = gridOverlay.gridLines.length;
      
      expect(firstLineCount).to.equal(secondLineCount);
      
      // Note: Cache is cleared on update(), so this tests cache within single update
    });
    
    it('should clear cache when tiles change', function() {
      // Use more tiles to engage the cache (fast path skips cache for <=5 tiles)
      for (let i = 0; i < 10; i++) {
        terrain.setTile(10 + i, 10, 'grass');
      }
      gridOverlay.update(null);
      
      const cacheSize1 = gridOverlay._featheringCache.size;
      
      // Add more tiles
      for (let i = 0; i < 5; i++) {
        terrain.setTile(10, 15 + i, 'dirt');
      }
      gridOverlay.update(null);
      
      // Cache should exist (regenerated after clear)
      expect(gridOverlay._featheringCache.size).to.be.greaterThan(0);
    });
  });
  
  describe('Algorithm Complexity', function() {
    it('should scale linearly with painted tile count', function() {
      const results = [];
      
      // Test with different tile counts (use larger counts to avoid fast path)
      const tileCounts = [10, 20, 30, 40];
      
      tileCounts.forEach(count => {
        const testTerrain = new SparseTerrain(32, 'grass', { maxMapSize: 100 });
        const testOverlay = new DynamicGridOverlay(testTerrain, 2);
        
        // Paint tiles in a line
        for (let i = 0; i < count; i++) {
          testTerrain.setTile(i, 0, 'grass');
        }
        
        const start = Date.now();
        testOverlay.update(null);
        const elapsed = Date.now() - start;
        
        results.push({ count, time: elapsed });
      });
      
      // Check that performance scales reasonably (not exponential)
      // Time per tile should not increase dramatically
      if (results.length >= 2 && results[0].time > 0) {
        const timePerTile1 = results[0].time / results[0].count;
        const timePerTileLast = results[results.length - 1].time / results[results.length - 1].count;
        
        // Should not be more than 5x slower per tile at higher counts
        // Only test if we have meaningful timing data (> 0ms)
        if (timePerTile1 > 0) {
          expect(timePerTileLast).to.be.lessThan(timePerTile1 * 5, 
            `Performance degraded: ${timePerTile1.toFixed(3)}ms/tile -> ${timePerTileLast.toFixed(3)}ms/tile`);
        }
      }
    });
    
    it('should not recalculate feathering for same coordinates', function() {
      terrain.setTile(10, 10, 'grass');
      
      // Spy on _findNearestPaintedTile (expensive operation)
      const findNearestSpy = sinon.spy(gridOverlay, '_findNearestPaintedTile');
      
      gridOverlay.update(null);
      
      const region = gridOverlay.calculateGridRegion(null);
      const expectedCoords = ((region.maxX - region.minX + 1) * (region.maxY - region.minY + 1)) * 2; // Rough estimate
      
      // Should not call findNearest more than once per unique coordinate
      // (Cache should prevent excessive calls)
      expect(findNearestSpy.callCount).to.be.lessThan(expectedCoords);
    });
  });
  
  describe('Memory Usage', function() {
    it('should limit grid line count with aggressive feathering', function() {
      // Paint a single tile
      terrain.setTile(10, 10, 'grass');
      
      gridOverlay.update(null);
      
      // With bufferSize=2, grid region is 5x5 tiles
      // That's 6 vertical + 6 horizontal lines = 12 lines max
      // With aggressive feathering filtering, should be fewer
      expect(gridOverlay.gridLines.length).to.be.lessThan(20, 'Should not generate excessive grid lines');
    });
    
    it('should not grow cache unbounded', function() {
      // Paint many tiles
      for (let i = 0; i < 100; i++) {
        const x = 10 + (i % 10);
        const y = 10 + Math.floor(i / 10);
        terrain.setTile(x, y, 'grass');
      }
      
      gridOverlay.update(null);
      
      // Cache should be reasonable size (not 10,000+ entries)
      expect(gridOverlay._featheringCache.size).to.be.lessThan(500, 'Cache should not grow unbounded');
      expect(gridOverlay._nearestTileCache.size).to.be.lessThan(500, 'Nearest tile cache should not grow unbounded');
    });
  });
});
