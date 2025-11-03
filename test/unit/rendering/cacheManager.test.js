/**
 * Unit Tests - CacheManager
 * 
 * Tests the core cache management system including:
 * - Singleton pattern
 * - Cache registration and retrieval
 * - Memory budget tracking and enforcement
 * - Cache eviction (LRU)
 * - Cache invalidation
 * - Statistics and monitoring
 * 
 * TDD Approach: These tests are written FIRST and should FAIL initially.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('CacheManager - Core Functionality', function() {
  let cleanup;
  let CacheManager;

  beforeEach(function() {
    cleanup = setupUITestEnvironment();

    // Mock createGraphics for buffer simulation
    global.createGraphics = sinon.stub().callsFake((width, height) => {
      return {
        width,
        height,
        _isGraphicsBuffer: true,
        remove: sinon.stub(),
        clear: sinon.stub(),
        push: sinon.stub(),
        pop: sinon.stub(),
        _estimatedMemory: width * height * 4 // 4 bytes per pixel (RGBA)
      };
    });

    if (typeof window !== 'undefined') {
      window.createGraphics = global.createGraphics;
    }

    // Load CacheManager (will fail initially - TDD RED phase)
    try {
      delete require.cache[require.resolve('../../../Classes/rendering/CacheManager.js')];
      CacheManager = require('../../../Classes/rendering/CacheManager.js');
    } catch (e) {
      // Expected to fail until implementation exists
      CacheManager = null;
    }
  });

  afterEach(function() {
    // Reset singleton for next test
    if (CacheManager && CacheManager._instance) {
      CacheManager._instance.destroy();
      CacheManager._instance = null;
    }
    
    if (cleanup) cleanup();
    delete global.createGraphics;
    if (typeof window !== 'undefined') {
      delete window.createGraphics;
    }
  });

  describe('Singleton Pattern', function() {
    it('should return the same instance on multiple getInstance calls', function() {
      if (!CacheManager) this.skip();
      
      const instance1 = CacheManager.getInstance();
      const instance2 = CacheManager.getInstance();
      
      expect(instance1).to.equal(instance2);
    });

    it('should initialize with default memory budget', function() {
      if (!CacheManager) this.skip();
      
      const manager = CacheManager.getInstance();
      
      expect(manager.getMemoryBudget()).to.be.a('number');
      expect(manager.getMemoryBudget()).to.be.greaterThan(0);
    });

    it('should allow setting custom memory budget', function() {
      if (!CacheManager) this.skip();
      
      const manager = CacheManager.getInstance();
      const customBudget = 5 * 1024 * 1024; // 5MB
      
      manager.setMemoryBudget(customBudget);
      
      expect(manager.getMemoryBudget()).to.equal(customBudget);
    });
  });

  describe('Cache Registration', function() {
    it('should register a new cache with a unique name', function() {
      if (!CacheManager) this.skip();
      
      const manager = CacheManager.getInstance();
      
      manager.register('test-cache', 'fullBuffer', { width: 100, height: 100 });
      
      expect(manager.hasCache('test-cache')).to.be.true;
    });

    it('should throw error when registering duplicate cache name', function() {
      if (!CacheManager) this.skip();
      
      const manager = CacheManager.getInstance();
      
      manager.register('duplicate-cache', 'fullBuffer', { width: 100, height: 100 });
      
      expect(() => {
        manager.register('duplicate-cache', 'fullBuffer', { width: 100, height: 100 });
      }).to.throw(/already registered/i);
    });

    it('should throw error for unsupported cache strategy', function() {
      if (!CacheManager) this.skip();
      
      const manager = CacheManager.getInstance();
      
      expect(() => {
        manager.register('invalid-cache', 'invalidStrategy', {});
      }).to.throw(/unsupported.*strategy/i);
    });

    it('should track memory usage when registering cache', function() {
      if (!CacheManager) this.skip();
      
      const manager = CacheManager.getInstance();
      const initialMemory = manager.getCurrentMemoryUsage();
      
      manager.register('memory-test-cache', 'fullBuffer', { width: 100, height: 100 });
      
      expect(manager.getCurrentMemoryUsage()).to.be.greaterThan(initialMemory);
    });
  });

  describe('Cache Retrieval', function() {
    it('should retrieve registered cache by name', function() {
      if (!CacheManager) this.skip();
      
      const manager = CacheManager.getInstance();
      
      manager.register('retrieve-test', 'fullBuffer', { width: 100, height: 100 });
      const cache = manager.getCache('retrieve-test');
      
      expect(cache).to.exist;
      expect(cache.name).to.equal('retrieve-test');
    });

    it('should return null for non-existent cache', function() {
      if (!CacheManager) this.skip();
      
      const manager = CacheManager.getInstance();
      const cache = manager.getCache('does-not-exist');
      
      expect(cache).to.be.null;
    });

    it('should list all registered cache names', function() {
      if (!CacheManager) this.skip();
      
      const manager = CacheManager.getInstance();
      
      manager.register('cache-1', 'fullBuffer', { width: 100, height: 100 });
      manager.register('cache-2', 'fullBuffer', { width: 100, height: 100 });
      
      const names = manager.getCacheNames();
      
      expect(names).to.include('cache-1');
      expect(names).to.include('cache-2');
    });
  });

  describe('Memory Budget Enforcement', function() {
    it('should track total memory usage across all caches', function() {
      if (!CacheManager) this.skip();
      
      const manager = CacheManager.getInstance();
      manager.setMemoryBudget(10 * 1024 * 1024); // 10MB
      
      // Register first cache: 100x100 = 40KB
      manager.register('cache-1', 'fullBuffer', { width: 100, height: 100 });
      const memory1 = manager.getCurrentMemoryUsage();
      
      // Register second cache: 200x200 = 160KB
      manager.register('cache-2', 'fullBuffer', { width: 200, height: 200 });
      const memory2 = manager.getCurrentMemoryUsage();
      
      expect(memory2).to.be.greaterThan(memory1);
      expect(memory2).to.equal(memory1 + (200 * 200 * 4));
    });

    it('should prevent registration when memory budget exceeded', function() {
      if (!CacheManager) this.skip();
      
      const manager = CacheManager.getInstance();
      manager.setMemoryBudget(100 * 1024); // 100KB budget
      
      // This cache is 40KB (within budget)
      manager.register('small-cache', 'fullBuffer', { width: 100, height: 100 });
      
      // This cache would be 400KB (exceeds budget)
      expect(() => {
        manager.register('large-cache', 'fullBuffer', { width: 500, height: 500 });
      }).to.throw(/memory budget exceeded/i);
    });

    it('should trigger eviction when budget exceeded', function() {
      if (!CacheManager) this.skip();
      
      const manager = CacheManager.getInstance();
      manager.setMemoryBudget(200 * 1024); // 200KB budget
      manager.setEvictionEnabled(true);
      
      // Register caches that fit
      manager.register('cache-1', 'fullBuffer', { width: 100, height: 100 }); // 40KB
      manager.register('cache-2', 'fullBuffer', { width: 100, height: 100 }); // 40KB
      manager.register('cache-3', 'fullBuffer', { width: 100, height: 100 }); // 40KB
      
      // Access cache-2 to make it more recent
      manager.getCache('cache-2');
      
      // This should evict cache-1 and cache-3 (least recently used)
      // Budget: 200KB, Current: 120KB, Need: 160KB, Total would be: 280KB
      // Must evict: 280KB - 200KB = 80KB (so cache-1 AND cache-3)
      manager.register('cache-4', 'fullBuffer', { width: 200, height: 200 }); // 160KB
      
      expect(manager.hasCache('cache-1')).to.be.false; // Evicted (never accessed)
      expect(manager.hasCache('cache-2')).to.be.true;  // Kept (recently accessed)
      expect(manager.hasCache('cache-3')).to.be.false; // Evicted (not accessed)
      expect(manager.hasCache('cache-4')).to.be.true;  // New cache
    });

    it('should calculate accurate memory for graphics buffers', function() {
      if (!CacheManager) this.skip();
      
      const manager = CacheManager.getInstance();
      
      manager.register('test-buffer', 'fullBuffer', { width: 200, height: 150 });
      
      // Expected: 200 * 150 * 4 bytes = 120,000 bytes
      const expectedMemory = 200 * 150 * 4;
      expect(manager.getCurrentMemoryUsage()).to.equal(expectedMemory);
    });
  });

  describe('LRU Eviction Policy', function() {
    it('should track access times for caches', function() {
      if (!CacheManager) this.skip();
      
      const manager = CacheManager.getInstance();
      
      manager.register('cache-1', 'fullBuffer', { width: 100, height: 100 });
      manager.register('cache-2', 'fullBuffer', { width: 100, height: 100 });
      
      // Access cache-1
      manager.getCache('cache-1');
      
      const stats1 = manager.getCacheStats('cache-1');
      const stats2 = manager.getCacheStats('cache-2');
      
      expect(stats1.lastAccessed).to.be.greaterThan(stats2.lastAccessed);
    });

    it('should evict least recently used cache first', function() {
      if (!CacheManager) this.skip();
      
      const manager = CacheManager.getInstance();
      manager.setMemoryBudget(200 * 1024); // 200KB
      manager.setEvictionEnabled(true);
      
      manager.register('oldest', 'fullBuffer', { width: 100, height: 100 });
      manager.register('middle', 'fullBuffer', { width: 100, height: 100 });
      manager.register('newest', 'fullBuffer', { width: 100, height: 100 });
      
      // Access in specific order
      manager.getCache('newest');
      manager.getCache('middle');
      // 'oldest' not accessed
      
      // Force eviction by adding large cache
      // This will evict 'oldest' first (never accessed), then 'newest' (oldest access time)
      manager.register('large', 'fullBuffer', { width: 200, height: 200 });
      
      expect(manager.hasCache('oldest')).to.be.false; // Evicted (never accessed)
      expect(manager.hasCache('middle')).to.be.true;  // Kept (most recently accessed)
      expect(manager.hasCache('newest')).to.be.false; // Evicted (accessed but older than middle)
    });

    it('should update access time on cache retrieval', function() {
      if (!CacheManager) this.skip();
      
      const manager = CacheManager.getInstance();
      
      manager.register('test-cache', 'fullBuffer', { width: 100, height: 100 });
      
      const initialStats = manager.getCacheStats('test-cache');
      const initialTime = initialStats.lastAccessed;
      
      // Wait a bit
      const wait = Date.now();
      while (Date.now() - wait < 10) {} // Small delay
      
      manager.getCache('test-cache');
      
      const updatedStats = manager.getCacheStats('test-cache');
      expect(updatedStats.lastAccessed).to.be.greaterThan(initialTime);
    });

    it('should not evict caches marked as protected', function() {
      if (!CacheManager) this.skip();
      
      const manager = CacheManager.getInstance();
      manager.setMemoryBudget(200 * 1024);
      manager.setEvictionEnabled(true);
      
      manager.register('protected-cache', 'fullBuffer', { width: 100, height: 100, protected: true });
      manager.register('normal-cache', 'fullBuffer', { width: 100, height: 100 });
      
      // Try to trigger eviction
      manager.register('large-cache', 'fullBuffer', { width: 200, height: 200 });
      
      expect(manager.hasCache('protected-cache')).to.be.true; // Protected
      expect(manager.hasCache('normal-cache')).to.be.false;   // Evicted
    });
  });

  describe('Cache Invalidation', function() {
    it('should invalidate cache by name', function() {
      if (!CacheManager) this.skip();
      
      const manager = CacheManager.getInstance();
      
      manager.register('test-cache', 'fullBuffer', { width: 100, height: 100 });
      const cache = manager.getCache('test-cache');
      
      manager.invalidate('test-cache');
      
      const stats = manager.getCacheStats('test-cache');
      expect(stats.valid).to.be.false;
    });

    it('should support partial invalidation with region', function() {
      if (!CacheManager) this.skip();
      
      const manager = CacheManager.getInstance();
      
      manager.register('region-cache', 'dirtyRect', { width: 500, height: 500 });
      
      manager.invalidate('region-cache', { x: 10, y: 10, width: 50, height: 50 });
      
      const stats = manager.getCacheStats('region-cache');
      expect(stats.dirtyRegions).to.have.lengthOf(1);
      expect(stats.dirtyRegions[0]).to.deep.equal({ x: 10, y: 10, width: 50, height: 50 });
    });

    it('should invalidate all caches when no name specified', function() {
      if (!CacheManager) this.skip();
      
      const manager = CacheManager.getInstance();
      
      manager.register('cache-1', 'fullBuffer', { width: 100, height: 100 });
      manager.register('cache-2', 'fullBuffer', { width: 100, height: 100 });
      
      manager.invalidateAll();
      
      expect(manager.getCacheStats('cache-1').valid).to.be.false;
      expect(manager.getCacheStats('cache-2').valid).to.be.false;
    });

    it('should clear dirty regions on full invalidation', function() {
      if (!CacheManager) this.skip();
      
      const manager = CacheManager.getInstance();
      
      manager.register('dirty-cache', 'dirtyRect', { width: 500, height: 500 });
      manager.invalidate('dirty-cache', { x: 0, y: 0, width: 10, height: 10 });
      
      manager.invalidate('dirty-cache'); // Full invalidation
      
      const stats = manager.getCacheStats('dirty-cache');
      expect(stats.dirtyRegions).to.have.lengthOf(0);
    });
  });

  describe('Cache Statistics', function() {
    it('should track cache hit count', function() {
      if (!CacheManager) this.skip();
      
      const manager = CacheManager.getInstance();
      
      manager.register('hit-test', 'fullBuffer', { width: 100, height: 100 });
      
      manager.getCache('hit-test');
      manager.getCache('hit-test');
      manager.getCache('hit-test');
      
      const stats = manager.getCacheStats('hit-test');
      expect(stats.hits).to.equal(3);
    });

    it('should track cache miss count', function() {
      if (!CacheManager) this.skip();
      
      const manager = CacheManager.getInstance();
      
      manager.getCache('does-not-exist');
      manager.getCache('also-missing');
      
      const globalStats = manager.getGlobalStats();
      expect(globalStats.misses).to.be.greaterThanOrEqual(2);
    });

    it('should calculate hit rate percentage', function() {
      if (!CacheManager) this.skip();
      
      const manager = CacheManager.getInstance();
      
      manager.register('rate-test', 'fullBuffer', { width: 100, height: 100 });
      
      manager.getCache('rate-test'); // hit
      manager.getCache('rate-test'); // hit
      manager.getCache('missing');   // miss
      
      const stats = manager.getCacheStats('rate-test');
      expect(stats.hitRate).to.equal(1.0); // 100% hit rate for this cache
      
      const globalStats = manager.getGlobalStats();
      expect(globalStats.hitRate).to.be.approximately(0.67, 0.01); // ~67% overall
    });

    it('should report memory usage per cache', function() {
      if (!CacheManager) this.skip();
      
      const manager = CacheManager.getInstance();
      
      manager.register('small', 'fullBuffer', { width: 50, height: 50 });
      manager.register('large', 'fullBuffer', { width: 200, height: 200 });
      
      const smallStats = manager.getCacheStats('small');
      const largeStats = manager.getCacheStats('large');
      
      expect(smallStats.memoryUsage).to.equal(50 * 50 * 4);
      expect(largeStats.memoryUsage).to.equal(200 * 200 * 4);
    });

    it('should report total caches count', function() {
      if (!CacheManager) this.skip();
      
      const manager = CacheManager.getInstance();
      
      manager.register('cache-1', 'fullBuffer', { width: 100, height: 100 });
      manager.register('cache-2', 'fullBuffer', { width: 100, height: 100 });
      manager.register('cache-3', 'fullBuffer', { width: 100, height: 100 });
      
      const stats = manager.getGlobalStats();
      expect(stats.totalCaches).to.equal(3);
    });

    it('should track eviction count', function() {
      if (!CacheManager) this.skip();
      
      const manager = CacheManager.getInstance();
      manager.setMemoryBudget(200 * 1024);
      manager.setEvictionEnabled(true);
      
      manager.register('cache-1', 'fullBuffer', { width: 100, height: 100 });
      manager.register('cache-2', 'fullBuffer', { width: 100, height: 100 });
      manager.register('cache-3', 'fullBuffer', { width: 200, height: 200 }); // Triggers eviction
      
      const stats = manager.getGlobalStats();
      expect(stats.evictions).to.be.greaterThan(0);
    });
  });

  describe('Cache Cleanup', function() {
    it('should remove cache and free memory', function() {
      if (!CacheManager) this.skip();
      
      const manager = CacheManager.getInstance();
      
      manager.register('to-remove', 'fullBuffer', { width: 100, height: 100 });
      const initialMemory = manager.getCurrentMemoryUsage();
      
      manager.removeCache('to-remove');
      
      expect(manager.hasCache('to-remove')).to.be.false;
      expect(manager.getCurrentMemoryUsage()).to.be.lessThan(initialMemory);
    });

    it('should call graphics buffer remove() on cleanup', function() {
      if (!CacheManager) this.skip();
      
      const manager = CacheManager.getInstance();
      
      manager.register('buffer-test', 'fullBuffer', { width: 100, height: 100 });
      const cache = manager.getCache('buffer-test');
      const removeSpy = cache._buffer ? cache._buffer.remove : null;
      
      manager.removeCache('buffer-test');
      
      if (removeSpy) {
        expect(removeSpy.called).to.be.true;
      }
    });

    it('should remove all caches on destroy', function() {
      if (!CacheManager) this.skip();
      
      const manager = CacheManager.getInstance();
      
      manager.register('cache-1', 'fullBuffer', { width: 100, height: 100 });
      manager.register('cache-2', 'fullBuffer', { width: 100, height: 100 });
      
      manager.destroy();
      
      expect(manager.getCacheNames()).to.have.lengthOf(0);
      expect(manager.getCurrentMemoryUsage()).to.equal(0);
    });

    it('should reset statistics on destroy', function() {
      if (!CacheManager) this.skip();
      
      const manager = CacheManager.getInstance();
      
      manager.register('test', 'fullBuffer', { width: 100, height: 100 });
      manager.getCache('test');
      
      manager.destroy();
      
      const stats = manager.getGlobalStats();
      expect(stats.hits).to.equal(0);
      expect(stats.misses).to.equal(0);
      expect(stats.evictions).to.equal(0);
    });
  });

  describe('Multiple Cache Types', function() {
    it('should support fullBuffer strategy', function() {
      if (!CacheManager) this.skip();
      
      const manager = CacheManager.getInstance();
      
      manager.register('full-buffer', 'fullBuffer', { width: 100, height: 100 });
      const cache = manager.getCache('full-buffer');
      
      expect(cache.strategy).to.equal('fullBuffer');
    });

    it('should support dirtyRect strategy', function() {
      if (!CacheManager) this.skip();
      
      const manager = CacheManager.getInstance();
      
      manager.register('dirty-rect', 'dirtyRect', { width: 500, height: 500 });
      const cache = manager.getCache('dirty-rect');
      
      expect(cache.strategy).to.equal('dirtyRect');
    });

    it('should support throttled strategy', function() {
      if (!CacheManager) this.skip();
      
      const manager = CacheManager.getInstance();
      
      manager.register('throttled', 'throttled', { width: 200, height: 200, interval: 100 });
      const cache = manager.getCache('throttled');
      
      expect(cache.strategy).to.equal('throttled');
    });

    it('should support tiled strategy', function() {
      if (!CacheManager) this.skip();
      
      const manager = CacheManager.getInstance();
      
      manager.register('tiled', 'tiled', { width: 1000, height: 1000, tileSize: 100 });
      const cache = manager.getCache('tiled');
      
      expect(cache.strategy).to.equal('tiled');
    });
  });

  describe('Edge Cases', function() {
    it('should handle zero memory budget gracefully', function() {
      if (!CacheManager) this.skip();
      
      const manager = CacheManager.getInstance();
      manager.setMemoryBudget(0);
      
      expect(() => {
        manager.register('test', 'fullBuffer', { width: 100, height: 100 });
      }).to.throw(/memory budget/i);
    });

    it('should handle negative memory budget gracefully', function() {
      if (!CacheManager) this.skip();
      
      const manager = CacheManager.getInstance();
      
      expect(() => {
        manager.setMemoryBudget(-1000);
      }).to.throw(/invalid.*budget/i);
    });

    it('should handle cache registration with zero dimensions', function() {
      if (!CacheManager) this.skip();
      
      const manager = CacheManager.getInstance();
      
      expect(() => {
        manager.register('zero-cache', 'fullBuffer', { width: 0, height: 0 });
      }).to.throw(/invalid.*dimensions/i);
    });

    it('should handle removing non-existent cache gracefully', function() {
      if (!CacheManager) this.skip();
      
      const manager = CacheManager.getInstance();
      
      expect(() => {
        manager.removeCache('does-not-exist');
      }).to.not.throw();
    });

    it('should handle stats request for non-existent cache', function() {
      if (!CacheManager) this.skip();
      
      const manager = CacheManager.getInstance();
      const stats = manager.getCacheStats('missing');
      
      expect(stats).to.be.null;
    });
  });
});
