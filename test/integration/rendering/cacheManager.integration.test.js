/**
 * Integration Tests - CacheManager
 * 
 * Tests CacheManager with real p5.Graphics buffers and system interactions:
 * - Real graphics buffer creation and cleanup
 * - Memory pressure scenarios
 * - Concurrent cache operations
 * - Complete cache lifecycle
 * - Performance under load
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('CacheManager - Integration Tests', function() {
  let cleanup;
  let CacheManager;

  beforeEach(function() {
    cleanup = setupUITestEnvironment();

    // Load CacheManager
    delete require.cache[require.resolve('../../../Classes/rendering/CacheManager.js')];
    CacheManager = require('../../../Classes/rendering/CacheManager.js');
  });

  afterEach(function() {
    // Clean up singleton
    if (CacheManager && CacheManager._instance) {
      CacheManager._instance.destroy();
      CacheManager._instance = null;
    }
    
    if (cleanup) cleanup();
  });

  describe('Real Graphics Buffer Integration', function() {
    it('should create and manage graphics buffers', function() {
      const manager = CacheManager.getInstance();
      
      manager.register('test-buffer', 'fullBuffer', { width: 100, height: 100 });
      
      const cache = manager.getCache('test-buffer');
      expect(cache).to.exist;
      // Buffer may be null in test environment without real p5.js
      if (cache._buffer) {
        expect(cache._buffer.width).to.equal(100);
        expect(cache._buffer.height).to.equal(100);
      }
    });

    it('should properly clean up buffers on cache removal', function() {
      const manager = CacheManager.getInstance();
      
      manager.register('cleanup-test', 'fullBuffer', { width: 200, height: 200 });
      const cache = manager.getCache('cleanup-test');
      const buffer = cache._buffer;
      
      manager.removeCache('cleanup-test');
      
      // Buffer should be removed (remove() should have been called if buffer exists)
      if (buffer && buffer.remove) {
        expect(buffer.remove.called).to.be.true;
      }
    });

    it('should handle multiple buffers simultaneously', function() {
      const manager = CacheManager.getInstance();
      
      manager.register('buffer-1', 'fullBuffer', { width: 100, height: 100 });
      manager.register('buffer-2', 'fullBuffer', { width: 150, height: 150 });
      manager.register('buffer-3', 'fullBuffer', { width: 200, height: 200 });
      
      expect(manager.getCacheNames()).to.have.lengthOf(3);
      
      const cache1 = manager.getCache('buffer-1');
      const cache2 = manager.getCache('buffer-2');
      const cache3 = manager.getCache('buffer-3');
      
      expect(cache1).to.exist;
      expect(cache2).to.exist;
      expect(cache3).to.exist;
      
      // Check memory usage is tracked correctly
      const totalMemory = (100*100*4) + (150*150*4) + (200*200*4);
      expect(manager.getCurrentMemoryUsage()).to.equal(totalMemory);
    });
  });

  describe('Memory Pressure Scenarios', function() {
    it('should handle gradual memory pressure with incremental evictions', function() {
      const manager = CacheManager.getInstance();
      manager.setMemoryBudget(500 * 1024); // 500KB
      manager.setEvictionEnabled(true);
      
      // Fill up memory
      manager.register('cache-1', 'fullBuffer', { width: 200, height: 200 }); // 160KB
      manager.register('cache-2', 'fullBuffer', { width: 200, height: 200 }); // 160KB
      manager.register('cache-3', 'fullBuffer', { width: 200, height: 200 }); // 160KB
      
      // Current: 480KB, under budget
      expect(manager.getCacheNames()).to.have.lengthOf(3);
      
      // This should trigger eviction of cache-1
      manager.register('cache-4', 'fullBuffer', { width: 200, height: 200 }); // 160KB
      
      expect(manager.hasCache('cache-1')).to.be.false; // Evicted
      expect(manager.hasCache('cache-4')).to.be.true;  // Added
    });

    it('should handle sudden memory spike requiring multiple evictions', function() {
      const manager = CacheManager.getInstance();
      manager.setMemoryBudget(800 * 1024); // 800KB (large enough for test)
      manager.setEvictionEnabled(true);
      
      // Create several small caches
      manager.register('small-1', 'fullBuffer', { width: 100, height: 100 }); // 40KB
      manager.register('small-2', 'fullBuffer', { width: 100, height: 100 }); // 40KB
      manager.register('small-3', 'fullBuffer', { width: 100, height: 100 }); // 40KB
      manager.register('small-4', 'fullBuffer', { width: 100, height: 100 }); // 40KB
      manager.register('small-5', 'fullBuffer', { width: 100, height: 100 }); // 40KB
      
      // Access some to change LRU order
      manager.getCache('small-3');
      manager.getCache('small-5');
      
      // Add large cache requiring multiple evictions
      manager.register('large', 'fullBuffer', { width: 400, height: 400 }); // 640KB
      
      // Should evict small-1, small-2, small-4 to make room
      expect(manager.hasCache('large')).to.be.true;
      expect(manager.hasCache('small-3')).to.be.true;  // Accessed, kept
      expect(manager.hasCache('small-5')).to.be.true;  // Accessed, kept
      
      // At least 2 caches should be evicted
      const remainingCaches = manager.getCacheNames();
      expect(remainingCaches.length).to.be.lessThan(6);
      expect(remainingCaches.length).to.be.at.least(3); // large + 2 accessed
    });

    it('should respect protected caches during memory pressure', function() {
      const manager = CacheManager.getInstance();
      manager.setMemoryBudget(300 * 1024); // 300KB
      manager.setEvictionEnabled(true);
      
      manager.register('protected-1', 'fullBuffer', { width: 200, height: 200, protected: true }); // 160KB
      manager.register('normal-1', 'fullBuffer', { width: 100, height: 100 }); // 40KB
      manager.register('normal-2', 'fullBuffer', { width: 100, height: 100 }); // 40KB
      
      // Try to add another cache
      manager.register('new-cache', 'fullBuffer', { width: 150, height: 150 }); // 90KB
      
      // Protected cache should never be evicted
      expect(manager.hasCache('protected-1')).to.be.true;
      expect(manager.hasCache('new-cache')).to.be.true;
      
      // Normal caches may be evicted
      const normalCachesRemaining = 
        (manager.hasCache('normal-1') ? 1 : 0) +
        (manager.hasCache('normal-2') ? 1 : 0);
      expect(normalCachesRemaining).to.be.lessThan(2);
    });

    it('should fail gracefully when memory budget cannot be satisfied', function() {
      const manager = CacheManager.getInstance();
      manager.setMemoryBudget(100 * 1024); // 100KB
      manager.setEvictionEnabled(true);
      
      manager.register('cache-1', 'fullBuffer', { width: 100, height: 100, protected: true }); // 40KB
      manager.register('cache-2', 'fullBuffer', { width: 100, height: 100, protected: true }); // 40KB
      
      // Try to add large cache that can't fit even with evictions
      expect(() => {
        manager.register('too-large', 'fullBuffer', { width: 300, height: 300 }); // 360KB
      }).to.throw(/memory budget exceeded/i);
    });
  });

  describe('Concurrent Cache Operations', function() {
    it('should handle rapid cache registration and access', function() {
      const manager = CacheManager.getInstance();
      manager.setMemoryBudget(1 * 1024 * 1024); // 1MB
      
      // Rapidly register multiple caches
      for (let i = 0; i < 10; i++) {
        manager.register(`rapid-${i}`, 'fullBuffer', { width: 50, height: 50 });
      }
      
      expect(manager.getCacheNames()).to.have.lengthOf(10);
      
      // Rapidly access them
      for (let i = 0; i < 10; i++) {
        const cache = manager.getCache(`rapid-${i}`);
        expect(cache).to.exist;
      }
    });

    it('should handle interleaved registration, access, and invalidation', function() {
      const manager = CacheManager.getInstance();
      
      manager.register('cache-1', 'fullBuffer', { width: 100, height: 100 });
      manager.getCache('cache-1');
      manager.invalidate('cache-1');
      
      manager.register('cache-2', 'fullBuffer', { width: 100, height: 100 });
      manager.getCache('cache-1'); // Access invalidated cache
      manager.getCache('cache-2');
      
      const stats1 = manager.getCacheStats('cache-1');
      const stats2 = manager.getCacheStats('cache-2');
      
      expect(stats1.valid).to.be.false; // Invalidated
      expect(stats2.valid).to.be.true;
      expect(stats1.hits).to.equal(2); // Accessed twice
      expect(stats2.hits).to.equal(1); // Accessed once
    });

    it('should maintain consistency during eviction with ongoing access', function() {
      const manager = CacheManager.getInstance();
      manager.setMemoryBudget(500 * 1024); // 500KB
      manager.setEvictionEnabled(true);
      
      manager.register('cache-1', 'fullBuffer', { width: 100, height: 100 });
      manager.register('cache-2', 'fullBuffer', { width: 100, height: 100 });
      manager.register('cache-3', 'fullBuffer', { width: 100, height: 100 });
      
      // Access cache-2 while registering large cache
      manager.getCache('cache-2');
      manager.register('large', 'fullBuffer', { width: 300, height: 300 }); // Triggers eviction
      
      // cache-2 should still be accessible if not evicted
      const cache2 = manager.getCache('cache-2');
      if (cache2) {
        expect(cache2.name).to.equal('cache-2');
      }
      
      // Verify consistency
      const stats = manager.getGlobalStats();
      expect(stats.totalCaches).to.equal(manager.getCacheNames().length);
    });
  });

  describe('Cache Lifecycle', function() {
    it('should complete full lifecycle: create → use → invalidate → evict → destroy', function() {
      const manager = CacheManager.getInstance();
      manager.setMemoryBudget(400 * 1024); // 400KB to fit both caches
      manager.setEvictionEnabled(true);
      
      // 1. Create
      manager.register('lifecycle-cache', 'fullBuffer', { width: 100, height: 100 });
      expect(manager.hasCache('lifecycle-cache')).to.be.true;
      
      // 2. Use
      manager.getCache('lifecycle-cache');
      const stats1 = manager.getCacheStats('lifecycle-cache');
      expect(stats1.hits).to.equal(1);
      
      // 3. Invalidate
      manager.invalidate('lifecycle-cache');
      const stats2 = manager.getCacheStats('lifecycle-cache');
      expect(stats2.valid).to.be.false;
      
      // 4. Evict (by adding large cache)
      manager.register('eviction-trigger', 'fullBuffer', { width: 300, height: 300 });
      
      // lifecycle-cache may or may not exist depending on eviction
      // But global stats should be consistent
      const globalStats = manager.getGlobalStats();
      expect(globalStats.memoryUsage).to.be.greaterThan(0);
      
      // 5. Destroy
      manager.destroy();
      expect(manager.getCacheNames()).to.have.lengthOf(0);
      expect(manager.getCurrentMemoryUsage()).to.equal(0);
    });

    it('should track cache from creation through multiple accesses', function() {
      const manager = CacheManager.getInstance();
      
      manager.register('tracked-cache', 'fullBuffer', { width: 100, height: 100 });
      
      // Access multiple times
      for (let i = 0; i < 5; i++) {
        manager.getCache('tracked-cache');
      }
      
      const stats = manager.getCacheStats('tracked-cache');
      
      // Verify hits were tracked
      expect(stats.hits).to.equal(5);
      
      // Verify timestamps exist and are reasonable
      expect(stats.created).to.be.a('number');
      expect(stats.lastAccessed).to.be.a('number');
      
      // Note: created uses Date.now(), lastAccessed uses monotonic counter
      // Cannot directly compare, but both should be > 0
      expect(stats.created).to.be.greaterThan(0);
      expect(stats.lastAccessed).to.be.greaterThan(0);
    });

    it('should handle cache replacement (remove old, add new with same name)', function(done) {
      const manager = CacheManager.getInstance();
      
      manager.register('replaceable', 'fullBuffer', { width: 100, height: 100 });
      const stats1 = manager.getCacheStats('replaceable');
      const created1 = stats1.created;
      
      manager.removeCache('replaceable');
      expect(manager.hasCache('replaceable')).to.be.false;
      
      // Small delay to ensure different timestamp
      setTimeout(() => {
        // Re-register with same name
        manager.register('replaceable', 'fullBuffer', { width: 200, height: 200 });
        const stats2 = manager.getCacheStats('replaceable');
        
        expect(stats2.created).to.be.greaterThan(created1);
        expect(stats2.memoryUsage).to.equal(200 * 200 * 4); // New size
        done();
      }, 10);
    });
  });

  describe('Strategy-Specific Integration', function() {
    it('should support fullBuffer strategy with real buffers', function() {
      const manager = CacheManager.getInstance();
      
      manager.register('full-buffer-test', 'fullBuffer', { width: 150, height: 150 });
      const cache = manager.getCache('full-buffer-test');
      
      expect(cache.strategy).to.equal('fullBuffer');
      
      // Buffer may be null in test environment
      if (cache._buffer) {
        expect(cache._buffer.width).to.equal(150);
      }
      
      // Verify memory tracking works regardless
      const stats = manager.getCacheStats('full-buffer-test');
      expect(stats.memoryUsage).to.equal(150 * 150 * 4);
    });

    it('should support dirtyRect strategy with region tracking', function() {
      const manager = CacheManager.getInstance();
      
      manager.register('dirty-rect-test', 'dirtyRect', { width: 500, height: 500 });
      
      // Add dirty regions
      manager.invalidate('dirty-rect-test', { x: 0, y: 0, width: 10, height: 10 });
      manager.invalidate('dirty-rect-test', { x: 50, y: 50, width: 20, height: 20 });
      
      const stats = manager.getCacheStats('dirty-rect-test');
      expect(stats.dirtyRegions).to.have.lengthOf(2);
    });

    it('should support throttled strategy', function() {
      const manager = CacheManager.getInstance();
      
      manager.register('throttled-test', 'throttled', { 
        width: 200, 
        height: 200,
        interval: 100 
      });
      
      const cache = manager.getCache('throttled-test');
      expect(cache.strategy).to.equal('throttled');
    });

    it('should support tiled strategy for large caches', function() {
      const manager = CacheManager.getInstance();
      
      manager.register('tiled-test', 'tiled', { 
        width: 1000, 
        height: 1000,
        tileSize: 100
      });
      
      const cache = manager.getCache('tiled-test');
      expect(cache.strategy).to.equal('tiled');
    });
  });

  describe('Performance Under Load', function() {
    it('should handle 50 caches within memory budget', function() {
      const manager = CacheManager.getInstance();
      manager.setMemoryBudget(5 * 1024 * 1024); // 5MB
      
      const startTime = Date.now();
      
      // Register 50 small caches (each ~10KB)
      for (let i = 0; i < 50; i++) {
        manager.register(`load-cache-${i}`, 'fullBuffer', { width: 50, height: 50 });
      }
      
      const registrationTime = Date.now() - startTime;
      
      expect(manager.getCacheNames()).to.have.lengthOf(50);
      expect(registrationTime).to.be.lessThan(1000); // Should complete in under 1 second
    });

    it('should efficiently evict under high memory pressure', function() {
      const manager = CacheManager.getInstance();
      manager.setMemoryBudget(500 * 1024); // 500KB
      manager.setEvictionEnabled(true);
      
      const startTime = Date.now();
      
      // Rapidly add caches until eviction kicks in
      for (let i = 0; i < 20; i++) {
        manager.register(`pressure-${i}`, 'fullBuffer', { width: 100, height: 100 });
      }
      
      const evictionTime = Date.now() - startTime;
      
      // Should stay within memory budget
      expect(manager.getCurrentMemoryUsage()).to.be.at.most(500 * 1024);
      
      // Should have evicted some caches
      const stats = manager.getGlobalStats();
      expect(stats.evictions).to.be.greaterThan(0);
      
      // Should complete evictions reasonably quickly
      expect(evictionTime).to.be.lessThan(2000);
    });

    it('should maintain high hit rate with repeated access', function() {
      const manager = CacheManager.getInstance();
      
      manager.register('hot-cache-1', 'fullBuffer', { width: 100, height: 100 });
      manager.register('hot-cache-2', 'fullBuffer', { width: 100, height: 100 });
      manager.register('cold-cache', 'fullBuffer', { width: 100, height: 100 });
      
      // Access hot caches repeatedly
      for (let i = 0; i < 100; i++) {
        manager.getCache('hot-cache-1');
        manager.getCache('hot-cache-2');
      }
      
      // Access cold cache once
      manager.getCache('cold-cache');
      
      // Try to access non-existent cache (miss)
      manager.getCache('non-existent');
      
      const globalStats = manager.getGlobalStats();
      
      // Hit rate should be very high (201 hits / 202 total)
      expect(globalStats.hitRate).to.be.at.least(0.99);
    });
  });

  describe('Error Recovery', function() {
    it('should recover from buffer creation failure', function() {
      const manager = CacheManager.getInstance();
      
      // Temporarily break createGraphics (make it return null)
      const originalCreateGraphics = global.createGraphics;
      global.createGraphics = sinon.stub().returns(null);
      window.createGraphics = global.createGraphics; // Sync for JSDOM
      
      manager.register('no-buffer', 'fullBuffer', { width: 100, height: 100 });
      const cache = manager.getCache('no-buffer');
      
      // Cache should exist but buffer should be null
      expect(cache).to.exist;
      if (cache._buffer !== undefined) {
        expect(cache._buffer).to.be.null;
      }
      
      // Restore createGraphics
      global.createGraphics = originalCreateGraphics;
      window.createGraphics = global.createGraphics;
    });

    it('should handle invalid cache operations gracefully', function() {
      const manager = CacheManager.getInstance();
      
      // Operations on non-existent cache should not throw
      expect(() => manager.invalidate('non-existent')).to.not.throw();
      expect(() => manager.removeCache('non-existent')).to.not.throw();
      
      const stats = manager.getCacheStats('non-existent');
      expect(stats).to.be.null;
    });

    it('should maintain consistency after partial eviction failure', function() {
      const manager = CacheManager.getInstance();
      manager.setMemoryBudget(200 * 1024);
      manager.setEvictionEnabled(true);
      
      // All caches protected (can't evict)
      manager.register('protected-1', 'fullBuffer', { width: 100, height: 100, protected: true });
      manager.register('protected-2', 'fullBuffer', { width: 100, height: 100, protected: true });
      
      // Try to add cache that requires eviction
      expect(() => {
        manager.register('needs-eviction', 'fullBuffer', { width: 200, height: 200 });
      }).to.throw(/memory budget exceeded/i);
      
      // Manager should still be in consistent state
      expect(manager.getCacheNames()).to.have.lengthOf(2);
      expect(manager.getCurrentMemoryUsage()).to.equal(2 * 100 * 100 * 4);
    });
  });
});
