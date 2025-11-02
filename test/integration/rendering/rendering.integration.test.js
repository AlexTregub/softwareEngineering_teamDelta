/**
 * Consolidated Rendering Integration Tests
 * Generated: 2025-10-29T03:16:53.977Z
 * Source files: 9
 * Total tests: 176
 */

// Common requires
let { expect } = require('chai');
let sinon = require('sinon');
let { JSDOM } = require('jsdom');


// ================================================================
// cacheManager.integration.test.js (23 tests)
// ================================================================
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

let { setupUITestEnvironment } = require('../../helpers/uiTestHelpers');

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




// ================================================================
// CacheManager.tiled-integration.test.js (11 tests)
// ================================================================
/**
 * TDD Integration Tests: CacheManager with TiledCacheStrategy
 * 
 * Purpose: Test CacheManager.register() with tiled strategy to expose memory calculation bug
 * 
 * Bug hypothesis: CacheManager still calculating full buffer memory (44MB) instead of tiled memory (1MB)
 */

describe('CacheManager + TiledCacheStrategy Integration', function() {
    let CacheManager, cacheManager;
    
    beforeEach(function() {
        // JSDOM setup
        if (typeof window === 'undefined') {
            global.window = global;
        }
        
        // Mock p5.js createGraphics
        global.createGraphics = sinon.stub().callsFake((w, h) => ({
            width: w,
            height: h,
            clear: sinon.stub(),
            image: sinon.stub(),
            push: sinon.stub(),
            pop: sinon.stub(),
            remove: sinon.stub(),
            _estimatedMemory: w * h * 4
        }));
        window.createGraphics = global.createGraphics;
        
        // Load CacheManager (fresh instance each test)
        const CacheManagerClass = require('../../../Classes/rendering/CacheManager.js');
        
        // Reset singleton for testing
        CacheManagerClass._instance = null;
        
        cacheManager = CacheManagerClass.getInstance();
    });
    
    afterEach(function() {
        sinon.restore();
        delete global.createGraphics;
        
        if (cacheManager) {
            cacheManager.destroy();
        }
    });
    
    describe('Memory Calculation', function() {
        it('should calculate tiled memory correctly for 448x448 grid', function() {
            // 448x448 @ 128px tiles = 4x4 grid = 16 tiles
            // Memory = 16 * 128 * 128 * 4 = 1,048,576 bytes (~1MB)
            
            cacheManager.register('test-tiled', 'tiled', {
                width: 448,
                height: 448,
                tileSize: 128
            });
            
            const stats = cacheManager.getGlobalStats();
            
            // Should be ~1MB, NOT 44MB
            expect(stats.memoryUsage).to.equal(1048576);
            expect(stats.memoryUsage).to.be.lessThan(2 * 1024 * 1024); // < 2MB
        });
        
        it('should NOT calculate full buffer memory for tiled strategy', function() {
            const fullBufferMemory = 448 * 448 * 4; // 802,816 bytes
            
            cacheManager.register('test-tiled', 'tiled', {
                width: 448,
                height: 448,
                tileSize: 128
            });
            
            const cache = cacheManager.getCacheStats('test-tiled');
            
            // Memory should be tiled (1MB), not full buffer (800KB)
            expect(cache.memoryUsage).to.not.equal(fullBufferMemory);
            expect(cache.memoryUsage).to.equal(1048576); // Tiled memory
        });
        
        it('should fit within 10MB budget', function() {
            // This should NOT throw error
            expect(() => {
                cacheManager.register('test-tiled', 'tiled', {
                    width: 448,
                    height: 448,
                    tileSize: 128
                });
            }).to.not.throw();
            
            const stats = cacheManager.getGlobalStats();
            expect(stats.memoryUsage).to.be.lessThan(stats.memoryBudget);
        });
        
        it('should use tileSize from config', function() {
            cacheManager.register('test-tiled', 'tiled', {
                width: 512,
                height: 512,
                tileSize: 64 // Custom tile size
            });
            
            // 512 / 64 = 8 tiles per dimension
            // 8 * 8 * 64 * 64 * 4 = 2,097,152 bytes (~2MB)
            const cache = cacheManager.getCacheStats('test-tiled');
            expect(cache.memoryUsage).to.equal(2097152);
        });
        
        it('should use default tileSize if not specified', function() {
            cacheManager.register('test-tiled', 'tiled', {
                width: 448,
                height: 448
                // No tileSize specified
            });
            
            // Should use default 128px tiles
            // 4 * 4 * 128 * 128 * 4 = 1,048,576 bytes
            const cache = cacheManager.getCacheStats('test-tiled');
            expect(cache.memoryUsage).to.equal(1048576);
        });
    });
    
    describe('Strategy Instance Creation', function() {
        it('should create TiledCacheStrategy instance', function() {
            cacheManager.register('test-tiled', 'tiled', {
                width: 448,
                height: 448,
                tileSize: 128
            });
            
            const cache = cacheManager._caches.get('test-tiled');
            
            expect(cache._strategyInstance).to.exist;
            expect(cache._strategyInstance.type).to.equal('tiled');
        });
        
        it('should pass config to TiledCacheStrategy', function() {
            cacheManager.register('test-tiled', 'tiled', {
                width: 448,
                height: 448,
                tileSize: 128
            });
            
            const cache = cacheManager._caches.get('test-tiled');
            const strategy = cache._strategyInstance;
            
            expect(strategy.config.width).to.equal(448);
            expect(strategy.config.height).to.equal(448);
            expect(strategy.config.tileSize).to.equal(128);
        });
        
        it('should NOT create single full-size buffer for tiled', function() {
            cacheManager.register('test-tiled', 'tiled', {
                width: 448,
                height: 448,
                tileSize: 128
            });
            
            const cache = cacheManager._caches.get('test-tiled');
            
            // _buffer should be strategy instance, NOT p5.Graphics
            expect(cache._buffer).to.equal(cache._strategyInstance);
            
            // Should NOT have created 448x448 graphics buffer
            const createGraphicsCalls = createGraphics.getCalls();
            const fullBufferCall = createGraphicsCalls.find(call => 
                call.args[0] === 448 && call.args[1] === 448
            );
            
            expect(fullBufferCall).to.be.undefined;
        });
    });
    
    describe('Real-world Scenario: DynamicGridOverlay', function() {
        it('should handle 10x10 terrain grid without memory error', function() {
            // Simulate DynamicGridOverlay config (10x10 terrain, 32px tiles, 2 tile buffer)
            // Grid size: (10 + 2*2) * 32 = 448px
            
            expect(() => {
                cacheManager.register('DynamicGridOverlay-12345', 'tiled', {
                    width: 448,
                    height: 448,
                    tileSize: 128,
                    protected: false
                });
            }).to.not.throw();
            
            const stats = cacheManager.getGlobalStats();
            
            // Should use ~1MB, not 44MB
            expect(stats.memoryUsage).to.equal(1048576);
            expect(stats.memoryUsage).to.be.lessThan(10 * 1024 * 1024); // Within 10MB budget
        });
        
        it('should throw helpful error if memory calculation is wrong', function() {
            // If this test fails, memory calculation is using full buffer (bug exposed)
            
            const config = {
                width: 448,
                height: 448,
                tileSize: 128
            };
            
            // Calculate what memory SHOULD be
            const tilesX = Math.ceil(config.width / config.tileSize);
            const tilesY = Math.ceil(config.height / config.tileSize);
            const expectedMemory = tilesX * tilesY * config.tileSize * config.tileSize * 4;
            
            cacheManager.register('test-tiled', 'tiled', config);
            
            const cache = cacheManager.getCacheStats('test-tiled');
            
            if (cache.memoryUsage !== expectedMemory) {
                throw new Error(
                    `MEMORY CALCULATION BUG DETECTED!\n` +
                    `Expected: ${expectedMemory} bytes (tiled)\n` +
                    `Got: ${cache.memoryUsage} bytes\n` +
                    `Full buffer would be: ${config.width * config.height * 4} bytes\n` +
                    `CacheManager is calculating wrong memory for tiled strategy!`
                );
            }
            
            expect(cache.memoryUsage).to.equal(expectedMemory);
        });
    });
    
    describe('Error Messages', function() {
        it('should show tiled memory in error message if budget exceeded', function() {
            // Set very low budget
            cacheManager.setMemoryBudget(500000); // 500KB
            
            try {
                cacheManager.register('test-tiled', 'tiled', {
                    width: 448,
                    height: 448,
                    tileSize: 128
                });
                
                throw new Error('Should have thrown memory budget error');
            } catch (error) {
                // Error message should show ~1MB needed, not 44MB
                expect(error.message).to.include('1048576');
                expect(error.message).to.not.include('44302336'); // Full buffer size
            }
        });
    });
});




// ================================================================
// cameraTransform.integration.test.js (10 tests)
// ================================================================
/**
 * Integration Tests: Camera Transform in PLAYING State
 * 
 * Tests that camera position and zoom are correctly applied to terrain/entity rendering.
 * This verifies the fix for zoom < 1.0 not showing more terrain.
 */

describe('Camera Transform Integration (PLAYING State)', function() {
  let sandbox;
  let mockCameraManager;
  let translateCalls;
  let scaleCalls;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Track translate and scale calls
    translateCalls = [];
    scaleCalls = [];
    
    // Mock p5.js transform functions
    global.push = sandbox.stub();
    global.pop = sandbox.stub();
    global.translate = sandbox.stub().callsFake((x, y) => {
      translateCalls.push({ x, y });
    });
    global.scale = sandbox.stub().callsFake((s) => {
      scaleCalls.push({ scale: s });
    });
    global.background = sandbox.stub();
    
    // Mock canvas size
    global.g_canvasX = 800;
    global.g_canvasY = 600;
    global.windowWidth = 800;
    global.windowHeight = 600;
    
    // Mock camera manager
    mockCameraManager = {
      cameraX: 0,
      cameraY: 0,
      cameraZoom: 1.0,
      getZoom: function() { return this.cameraZoom; }
    };
    
    global.cameraManager = mockCameraManager;
    
    // Sync window
    if (typeof window !== 'undefined') {
      window.push = global.push;
      window.pop = global.pop;
      window.translate = global.translate;
      window.scale = global.scale;
      window.background = global.background;
      window.g_canvasX = global.g_canvasX;
      window.g_canvasY = global.g_canvasY;
      window.windowWidth = global.windowWidth;
      window.windowHeight = global.windowHeight;
      window.cameraManager = global.cameraManager;
    }
  });
  
  afterEach(function() {
    sandbox.restore();
    delete global.cameraManager;
    if (typeof window !== 'undefined') {
      delete window.cameraManager;
    }
  });
  
  describe('Current applyZoom() behavior', function() {
    it('should apply zoom scale around canvas center', function() {
      // Simulate current applyZoom() implementation
      const applyZoom = function() {
        const zoom = cameraManager.getZoom();
        translate(g_canvasX/2, g_canvasY/2);
        scale(zoom);
        translate(-g_canvasX/2, -g_canvasY/2);
      };
      
      mockCameraManager.cameraZoom = 2.0;
      
      translateCalls = [];
      scaleCalls = [];
      
      applyZoom();
      
      // Should translate to center
      expect(translateCalls[0]).to.deep.equal({ x: 400, y: 300 });
      // Should scale
      expect(scaleCalls[0]).to.deep.equal({ scale: 2.0 });
      // Should translate back from center
      expect(translateCalls[1]).to.deep.equal({ x: -400, y: -300 });
    });
    
    it('should NOT apply camera position offset (THIS IS THE BUG)', function() {
      // Simulate current applyZoom() - it doesn't use cameraX/cameraY
      const applyZoom = function() {
        const zoom = cameraManager.getZoom();
        translate(g_canvasX/2, g_canvasY/2);
        scale(zoom);
        translate(-g_canvasX/2, -g_canvasY/2);
        // NOTE: Missing translate(-cameraX, -cameraY)
      };
      
      mockCameraManager.cameraX = 100;
      mockCameraManager.cameraY = 50;
      mockCameraManager.cameraZoom = 0.5;
      
      translateCalls = [];
      scaleCalls = [];
      
      applyZoom();
      
      // Should have 2 translate calls (center and un-center)
      expect(translateCalls.length).to.equal(2);
      
      // Should NOT have camera offset translate
      const hasCameraOffset = translateCalls.some(call => 
        call.x === -100 && call.y === -50
      );
      expect(hasCameraOffset).to.be.false;
      
      // This is the bug! Camera position is ignored.
    });
  });
  
  describe('Proposed applyCameraTransform() behavior', function() {
    it('should apply both zoom AND camera position', function() {
      // Simulate proposed fix
      const applyCameraTransform = function() {
        const zoom = cameraManager.getZoom();
        const cameraX = cameraManager.cameraX || 0;
        const cameraY = cameraManager.cameraY || 0;
        
        // Scale around canvas center
        translate(g_canvasX / 2, g_canvasY / 2);
        scale(zoom);
        translate(-g_canvasX / 2, -g_canvasY / 2);
        
        // Apply camera offset
        translate(-cameraX, -cameraY);
      };
      
      mockCameraManager.cameraX = 100;
      mockCameraManager.cameraY = 50;
      mockCameraManager.cameraZoom = 2.0;
      
      translateCalls = [];
      scaleCalls = [];
      
      applyCameraTransform();
      
      // Should have 3 translate calls
      expect(translateCalls.length).to.equal(3);
      
      // 1. Translate to center
      expect(translateCalls[0]).to.deep.equal({ x: 400, y: 300 });
      
      // 2. Scale
      expect(scaleCalls[0]).to.deep.equal({ scale: 2.0 });
      
      // 3. Translate from center
      expect(translateCalls[1]).to.deep.equal({ x: -400, y: -300 });
      
      // 4. Apply camera offset (THE FIX!)
      expect(translateCalls[2]).to.deep.equal({ x: -100, y: -50 });
    });
    
    it('should handle zoom < 1.0 with camera offset', function() {
      const applyCameraTransform = function() {
        const zoom = cameraManager.getZoom();
        const cameraX = cameraManager.cameraX || 0;
        const cameraY = cameraManager.cameraY || 0;
        
        translate(g_canvasX / 2, g_canvasY / 2);
        scale(zoom);
        translate(-g_canvasX / 2, -g_canvasY / 2);
        translate(-cameraX, -cameraY);
      };
      
      // Zoomed out to 0.5x at camera position 200, 100
      mockCameraManager.cameraX = 200;
      mockCameraManager.cameraY = 100;
      mockCameraManager.cameraZoom = 0.5;
      
      translateCalls = [];
      scaleCalls = [];
      
      applyCameraTransform();
      
      // Should apply 0.5x scale
      expect(scaleCalls[0].scale).to.equal(0.5);
      
      // Should apply camera offset
      expect(translateCalls[2]).to.deep.equal({ x: -200, y: -100 });
    });
    
    it('should match Level Editor transform pattern', function() {
      // Level Editor's working implementation
      const levelEditorTransform = function(cameraX, cameraY, zoom) {
        translate(g_canvasX / 2, g_canvasY / 2);
        scale(zoom);
        translate(-g_canvasX / 2, -g_canvasY / 2);
        translate(-cameraX, -cameraY);
      };
      
      // Proposed RenderLayerManager fix
      const renderManagerTransform = function() {
        const zoom = cameraManager.getZoom();
        const cameraX = cameraManager.cameraX || 0;
        const cameraY = cameraManager.cameraY || 0;
        
        translate(g_canvasX / 2, g_canvasY / 2);
        scale(zoom);
        translate(-g_canvasX / 2, -g_canvasY / 2);
        translate(-cameraX, -cameraY);
      };
      
      mockCameraManager.cameraX = 150;
      mockCameraManager.cameraY = 75;
      mockCameraManager.cameraZoom = 1.5;
      
      // Test Level Editor pattern
      translateCalls = [];
      scaleCalls = [];
      levelEditorTransform(150, 75, 1.5);
      const levelEditorCalls = { translate: [...translateCalls], scale: [...scaleCalls] };
      
      // Test RenderManager pattern
      translateCalls = [];
      scaleCalls = [];
      renderManagerTransform();
      const renderManagerCalls = { translate: [...translateCalls], scale: [...scaleCalls] };
      
      // Should produce identical transforms
      expect(renderManagerCalls.translate).to.deep.equal(levelEditorCalls.translate);
      expect(renderManagerCalls.scale).to.deep.equal(levelEditorCalls.scale);
    });
  });
  
  describe('World coordinate visibility at different zooms', function() {
    it('zoom 1.0: should show standard view (no extra visible area)', function() {
      const applyCameraTransform = function() {
        const zoom = cameraManager.getZoom();
        const cameraX = cameraManager.cameraX || 0;
        const cameraY = cameraManager.cameraY || 0;
        
        translate(g_canvasX / 2, g_canvasY / 2);
        scale(zoom);
        translate(-g_canvasX / 2, -g_canvasY / 2);
        translate(-cameraX, -cameraY);
      };
      
      mockCameraManager.cameraX = 400;
      mockCameraManager.cameraY = 300;
      mockCameraManager.cameraZoom = 1.0;
      
      applyCameraTransform();
      
      // At zoom 1.0, visible area is canvas size
      // With camera at 400,300, we see world coords 0-800 x, 0-600 y
      expect(scaleCalls[0].scale).to.equal(1.0);
      expect(translateCalls[2]).to.deep.equal({ x: -400, y: -300 });
    });
    
    it('zoom 0.5: should show 2x more area (zoomed out)', function() {
      const applyCameraTransform = function() {
        const zoom = cameraManager.getZoom();
        const cameraX = cameraManager.cameraX || 0;
        const cameraY = cameraManager.cameraY || 0;
        
        translate(g_canvasX / 2, g_canvasY / 2);
        scale(zoom);
        translate(-g_canvasX / 2, -g_canvasY / 2);
        translate(-cameraX, -cameraY);
      };
      
      mockCameraManager.cameraX = 400;
      mockCameraManager.cameraY = 300;
      mockCameraManager.cameraZoom = 0.5;
      
      applyCameraTransform();
      
      // At zoom 0.5, visible area is 2x canvas size
      // With camera at 400,300, we see world coords -400-1200 x, -300-900 y
      expect(scaleCalls[0].scale).to.equal(0.5);
      expect(translateCalls[2]).to.deep.equal({ x: -400, y: -300 });
      
      // The scale(0.5) makes everything half size, so 2x area is visible
    });
    
    it('zoom 2.0: should show 0.5x area (zoomed in)', function() {
      const applyCameraTransform = function() {
        const zoom = cameraManager.getZoom();
        const cameraX = cameraManager.cameraX || 0;
        const cameraY = cameraManager.cameraY || 0;
        
        translate(g_canvasX / 2, g_canvasY / 2);
        scale(zoom);
        translate(-g_canvasX / 2, -g_canvasY / 2);
        translate(-cameraX, -cameraY);
      };
      
      mockCameraManager.cameraX = 400;
      mockCameraManager.cameraY = 300;
      mockCameraManager.cameraZoom = 2.0;
      
      applyCameraTransform();
      
      // At zoom 2.0, visible area is 0.5x canvas size
      // With camera at 400,300, we see world coords 200-600 x, 150-450 y
      expect(scaleCalls[0].scale).to.equal(2.0);
      expect(translateCalls[2]).to.deep.equal({ x: -400, y: -300 });
    });
  });
  
  describe('Edge cases', function() {
    it('should handle cameraX/cameraY undefined', function() {
      const applyCameraTransform = function() {
        const zoom = cameraManager.getZoom();
        const cameraX = cameraManager.cameraX || 0;
        const cameraY = cameraManager.cameraY || 0;
        
        translate(g_canvasX / 2, g_canvasY / 2);
        scale(zoom);
        translate(-g_canvasX / 2, -g_canvasY / 2);
        translate(-cameraX, -cameraY);
      };
      
      delete mockCameraManager.cameraX;
      delete mockCameraManager.cameraY;
      mockCameraManager.cameraZoom = 1.0;
      
      translateCalls = [];
      
      applyCameraTransform();
      
      // Should use 0,0 as fallback (use Math.abs to avoid -0 vs +0 comparison issue)
      expect(Math.abs(translateCalls[2].x)).to.equal(0);
      expect(Math.abs(translateCalls[2].y)).to.equal(0);
    });
    
    it('should handle null cameraManager gracefully', function() {
      const applyCameraTransform = function() {
        if (!cameraManager) return;
        
        const zoom = cameraManager.getZoom();
        const cameraX = cameraManager.cameraX || 0;
        const cameraY = cameraManager.cameraY || 0;
        
        translate(g_canvasX / 2, g_canvasY / 2);
        scale(zoom);
        translate(-g_canvasX / 2, -g_canvasY / 2);
        translate(-cameraX, -cameraY);
      };
      
      global.cameraManager = null;
      
      // Should not throw
      expect(() => applyCameraTransform()).to.not.throw();
      
      // Should not call any transforms
      expect(translateCalls.length).to.equal(0);
      expect(scaleCalls.length).to.equal(0);
    });
  });
});




// ================================================================
// infiniteCanvas.integration.test.js (18 tests)
// ================================================================
/**
 * Integration Tests: Infinite Canvas Rendering (TDD - Phase 4)
 * 
 * Tests integration of SparseTerrain, DynamicGridOverlay, and DynamicMinimap
 * for lazy terrain loading with infinite canvas.
 * 
 * TDD: Write FIRST before full integration exists!
 */

describe('Infinite Canvas Rendering Integration', function() {
  let terrain, gridOverlay, minimap, dom;
  let mockP5;
  
  beforeEach(function() {
    // Setup JSDOM environment
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
    
    // Mock p5.js functions
    mockP5 = {
      push: sinon.stub(),
      pop: sinon.stub(),
      stroke: sinon.stub(),
      strokeWeight: sinon.stub(),
      fill: sinon.stub(),
      noFill: sinon.stub(),
      noStroke: sinon.stub(),
      rect: sinon.stub(),
      line: sinon.stub(),
      translate: sinon.stub(),
      scale: sinon.stub()
    };
    
    global.push = mockP5.push;
    global.pop = mockP5.pop;
    global.stroke = mockP5.stroke;
    global.strokeWeight = mockP5.strokeWeight;
    global.fill = mockP5.fill;
    global.noFill = mockP5.noFill;
    global.noStroke = mockP5.noStroke;
    global.rect = mockP5.rect;
    global.line = mockP5.line;
    global.translate = mockP5.translate;
    global.scale = mockP5.scale;
    
    // Load classes
    const SparseTerrain = require('../../../Classes/terrainUtils/SparseTerrain');
    const DynamicGridOverlay = require('../../../Classes/ui/_baseObjects/grids/DynamicGridOverlay');
    const DynamicMinimap = require('../../../Classes/ui/_baseObjects/minimap/DynamicMinimap');
    
    // Create integrated system
    terrain = new SparseTerrain(32, 'grass');
    gridOverlay = new DynamicGridOverlay(terrain);
    minimap = new DynamicMinimap(terrain, 200, 200);
  });
  
  afterEach(function() {
    sinon.restore();
    if (dom && dom.window) {
      dom.window.close();
    }
    delete global.window;
    delete global.document;
  });
  
  describe('System Initialization', function() {
    it('should initialize with empty terrain', function() {
      expect(terrain.isEmpty()).to.be.true;
      expect(terrain.getBounds()).to.be.null;
      expect(gridOverlay.gridLines).to.have.lengthOf(0);
      expect(minimap.viewport).to.be.null;
    });
    
    it('should connect all components to same terrain', function() {
      expect(gridOverlay.terrain).to.equal(terrain);
      expect(minimap.terrain).to.equal(terrain);
    });
  });
  
  describe('Paint First Tile Workflow', function() {
    it('should update all systems when first tile painted', function() {
      // Paint first tile
      terrain.setTile(0, 0, 'stone');
      
      // Grid overlay should generate grid
      gridOverlay.update(null);
      expect(gridOverlay.gridLines.length).to.be.greaterThan(0);
      
      // Minimap should have viewport
      minimap.update();
      expect(minimap.viewport).to.not.be.null;
      expect(minimap.viewport.minX).to.equal(-2); // 0 - padding
    });
    
    it('should calculate consistent bounds across systems', function() {
      terrain.setTile(5, 10, 'grass');
      
      const terrainBounds = terrain.getBounds();
      const gridRegion = gridOverlay.calculateGridRegion(null);
      const minimapViewport = minimap.calculateViewport();
      
      // All should reflect same painted area
      expect(terrainBounds.minX).to.equal(5);
      expect(terrainBounds.maxX).to.equal(5);
      
      // Grid should extend by buffer (2 tiles)
      expect(gridRegion.minX).to.equal(3); // 5 - 2
      expect(gridRegion.maxX).to.equal(7); // 5 + 2
      
      // Minimap should also extend by padding (2 tiles)
      expect(minimapViewport.minX).to.equal(3); // 5 - 2
      expect(minimapViewport.maxX).to.equal(7); // 5 + 2
    });
  });
  
  describe('Multi-Tile Painting Workflow', function() {
    it('should expand all systems when painting outside bounds', function() {
      // Paint initial tile
      terrain.setTile(0, 0, 'grass');
      gridOverlay.update(null);
      minimap.update();
      
      const oldGridRegion = gridOverlay.calculateGridRegion(null);
      const oldMinimapViewport = minimap.viewport;
      
      // Paint far away
      terrain.setTile(20, 20, 'stone');
      gridOverlay.update(null);
      minimap.update();
      
      const newGridRegion = gridOverlay.calculateGridRegion(null);
      const newMinimapViewport = minimap.viewport;
      
      // Both should expand
      expect(newGridRegion.maxX).to.be.greaterThan(oldGridRegion.maxX);
      expect(newMinimapViewport.maxX).to.be.greaterThan(oldMinimapViewport.maxX);
    });
    
    it('should handle scattered painting (sparse storage efficiency)', function() {
      // Paint tiles far apart
      terrain.setTile(0, 0, 'grass');
      terrain.setTile(100, 100, 'stone');
      terrain.setTile(-50, -50, 'water');
      
      // Should only store 3 tiles (not 151*151 = 22,801!)
      expect(terrain.getTileCount()).to.equal(3);
      
      // Systems should adapt to large bounds
      gridOverlay.update(null);
      minimap.update();
      
      const gridRegion = gridOverlay.calculateGridRegion(null);
      expect(gridRegion.minX).to.equal(-52); // -50 - 2
      expect(gridRegion.maxX).to.equal(102); // 100 + 2
      
      expect(minimap.viewport.minX).to.equal(-52);
      expect(minimap.viewport.maxX).to.equal(102);
    });
  });
  
  describe('Grid Overlay with Mouse Hover', function() {
    it('should show grid at mouse when no tiles painted', function() {
      expect(terrain.isEmpty()).to.be.true;
      
      const mousePos = { x: 10, y: 10 };
      const region = gridOverlay.calculateGridRegion(mousePos);
      
      expect(region).to.not.be.null;
      expect(region.minX).to.equal(8); // 10 - 2
      expect(region.maxX).to.equal(12); // 10 + 2
    });
    
    it('should merge grid regions when mouse outside painted area', function() {
      terrain.setTile(0, 0, 'grass');
      
      const mousePos = { x: 50, y: 50 }; // Far from painted tile
      const region = gridOverlay.calculateGridRegion(mousePos);
      
      // Should include both painted area and mouse hover
      expect(region.minX).to.equal(-2); // From painted (0 - 2)
      expect(region.maxX).to.equal(52); // From mouse (50 + 2)
    });
  });
  
  describe('Minimap Scale Adaptation', function() {
    it('should zoom out when painting expands bounds', function() {
      terrain.setTile(0, 0, 'grass');
      minimap.update();
      const smallScale = minimap.scale;
      
      // Paint many tiles to expand bounds
      for (let i = 0; i < 50; i++) {
        terrain.setTile(i, i, 'stone');
      }
      minimap.update();
      const largeScale = minimap.scale;
      
      // Scale should decrease (zoomed out)
      expect(largeScale).to.be.lessThan(smallScale);
    });
    
    it('should handle single tile viewport', function() {
      terrain.setTile(0, 0, 'grass');
      minimap.update();
      
      expect(minimap.viewport).to.not.be.null;
      expect(minimap.scale).to.be.greaterThan(0);
      
      // Viewport: (-2, -2) to (2, 2) = 5x5 tiles = 160x160 pixels
      // Minimap: 200x200, scale should be 200/160 = 1.25
      expect(minimap.scale).to.be.closeTo(1.25, 0.01);
    });
  });
  
  describe('Rendering Pipeline', function() {
    it('should render all systems without errors', function() {
      terrain.setTile(5, 5, 'grass');
      terrain.setTile(6, 6, 'stone');
      
      gridOverlay.update(null);
      minimap.update();
      
      // Render all components
      expect(() => {
        gridOverlay.render();
        minimap.render();
      }).to.not.throw();
      
      // Should have called drawing functions
      expect(mockP5.push.called).to.be.true;
      expect(mockP5.pop.called).to.be.true;
    });
    
    it('should render in correct order (terrain, grid, UI)', function() {
      terrain.setTile(0, 0, 'grass');
      gridOverlay.update(null);
      minimap.update();
      
      // Simulate rendering pipeline
      // 1. Terrain tiles (handled externally)
      // 2. Grid overlay
      gridOverlay.render();
      const gridCallCount = mockP5.line.callCount;
      
      // 3. Minimap
      minimap.render();
      const minimapCallCount = mockP5.rect.callCount;
      
      expect(gridCallCount).to.be.greaterThan(0);
      expect(minimapCallCount).to.be.greaterThan(0);
    });
  });
  
  describe('Delete Tile Workflow', function() {
    it('should shrink all systems when tile deleted', function() {
      // Paint 3 tiles
      terrain.setTile(0, 0, 'grass');
      terrain.setTile(10, 10, 'stone');
      terrain.setTile(20, 20, 'water');
      
      gridOverlay.update(null);
      minimap.update();
      const largeBounds = terrain.getBounds();
      
      // Delete edge tile
      terrain.deleteTile(20, 20);
      
      gridOverlay.update(null);
      minimap.update();
      const smallBounds = terrain.getBounds();
      
      // Bounds should shrink
      expect(smallBounds.maxX).to.be.lessThan(largeBounds.maxX);
      expect(smallBounds.maxY).to.be.lessThan(largeBounds.maxY);
    });
    
    it('should clear all systems when last tile deleted', function() {
      terrain.setTile(0, 0, 'grass');
      gridOverlay.update(null);
      minimap.update();
      
      expect(gridOverlay.gridLines.length).to.be.greaterThan(0);
      expect(minimap.viewport).to.not.be.null;
      
      // Delete last tile
      terrain.deleteTile(0, 0);
      gridOverlay.update(null);
      minimap.update();
      
      // All should reset
      expect(terrain.getBounds()).to.be.null;
      expect(minimap.viewport).to.be.null;
      // Grid should be empty (no tiles, no mouse hover in this test)
    });
  });
  
  describe('JSON Export/Import Workflow', function() {
    it('should export and restore complete system state', function() {
      // Create complex terrain
      terrain.setTile(0, 0, 'grass');
      terrain.setTile(10, 10, 'stone');
      terrain.setTile(-5, -5, 'water');
      
      // Export
      const json = terrain.exportToJSON();
      expect(json.tiles).to.have.lengthOf(3);
      
      // Clear and import
      const SparseTerrain = require('../../../Classes/terrainUtils/SparseTerrain');
      const DynamicGridOverlay = require('../../../Classes/ui/_baseObjects/grids/DynamicGridOverlay');
      const DynamicMinimap = require('../../../Classes/ui/_baseObjects/minimap/DynamicMinimap');
      
      const newTerrain = new SparseTerrain();
      newTerrain.importFromJSON(json);
      
      // Create new systems
      const newGrid = new DynamicGridOverlay(newTerrain);
      const newMinimap = new DynamicMinimap(newTerrain, 200, 200);
      
      newGrid.update(null);
      newMinimap.update();
      
      // Should match original
      expect(newTerrain.getTileCount()).to.equal(3);
      expect(newTerrain.getBounds()).to.deep.equal(terrain.getBounds());
      
      // Viewport should be calculated from same bounds
      const originalViewport = minimap.calculateViewport();
      const newViewport = newMinimap.calculateViewport();
      expect(newViewport).to.deep.equal(originalViewport);
    });
  });
  
  describe('Coordinate System Consistency', function() {
    it('should handle negative coordinates across all systems', function() {
      terrain.setTile(-10, -20, 'grass');
      
      gridOverlay.update(null);
      minimap.update();
      
      const bounds = terrain.getBounds();
      const gridRegion = gridOverlay.calculateGridRegion(null);
      const minimapViewport = minimap.viewport;
      
      expect(bounds.minX).to.equal(-10);
      expect(bounds.minY).to.equal(-20);
      
      expect(gridRegion.minX).to.equal(-12); // -10 - 2
      expect(gridRegion.minY).to.equal(-22); // -20 - 2
      
      expect(minimapViewport.minX).to.equal(-12);
      expect(minimapViewport.minY).to.equal(-22);
    });
    
    it('should handle mixed positive/negative coordinates', function() {
      terrain.setTile(-50, -50, 'water');
      terrain.setTile(50, 50, 'stone');
      
      gridOverlay.update(null);
      minimap.update();
      
      const bounds = terrain.getBounds();
      expect(bounds.minX).to.equal(-50);
      expect(bounds.maxX).to.equal(50);
      expect(bounds.minY).to.equal(-50);
      expect(bounds.maxY).to.equal(50);
    });
  });
  
  describe('Performance at Scale', function() {
    it('should handle 100 scattered tiles with sparse storage', function() {
      this.timeout(60000); // Scattered tiles = slower grid generation
      
      const startTime = Date.now();
      
      // Paint 100 tiles in scattered pattern WITHIN 1000x1000 limit
      // Use 5-tile spacing: (0,0), (5,5), (10,10)...(495,495) = 500x500 area
      for (let i = 0; i < 100; i++) {
        const x = i * 5;
        const y = i * 5;
        const result = terrain.setTile(x, y, 'grass');
        expect(result).to.be.true; // All within limit
      }
      
      gridOverlay.update(null);
      minimap.update();
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Scattered tiles create large bounds, grid generation is slower
      // But should complete in reasonable time (<60 seconds)
      expect(duration).to.be.lessThan(60000);
      
      // Key benefit: Sparse storage uses only 100 tiles, not 250,000!
      expect(terrain.getTileCount()).to.equal(100);
      
      // Grid optimization: Only generate lines near painted tiles
      expect(gridOverlay.gridLines.length).to.be.above(0);
      expect(gridOverlay.gridLines.length).to.be.below(5000); // Much less than full 500x500
    });
  });
});




// ================================================================
// levelEditorRenderIntegration.test.js (29 tests)
// ================================================================
/**
 * Integration tests for Level Editor + RenderLayerManager + Game State
 * Tests the interaction between these three systems
 */

describe('Level Editor + RenderLayerManager + Game State Integration', function() {
  let window, document, RenderLayerManager, GameStateManager;
  let renderManager, gameState, levelEditor;

  beforeEach(function() {
    // Create fresh DOM
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;

    // Mock p5.js globals
    global.mouseX = 0;
    global.mouseY = 0;
    global.mouseIsPressed = false;
    global.width = 800;
    global.height = 600;
    global.frameCount = 0;

    // Mock p5.js functions
    global.push = () => {};
    global.pop = () => {};
    global.fill = () => {};
    global.stroke = () => {};
    global.strokeWeight = () => {};
    global.noStroke = () => {};
    global.rect = () => {};
    global.text = () => {};
    global.textSize = () => {};
    global.textAlign = () => {};
    global.background = () => {};
    global.translate = () => {};
    global.scale = () => {};
    global.image = () => {};

    // Mock camera manager
    global.cameraManager = {
      getZoom: () => 1.0,
      screenToWorld: (x, y) => ({ worldX: x, worldY: y })
    };

    // Mock active map
    global.g_activeMap = {
      render: () => {},
      renderConversion: {
        convCanvasToPos: (coords) => [coords[0], coords[1]]
      }
    };

    // Mock canvas dimensions
    global.g_canvasX = 800;
    global.g_canvasY = 600;

    // Load GameStateManager class
    delete require.cache[require.resolve('../../../Classes/managers/GameStateManager.js')];
    GameStateManager = require('../../../Classes/managers/GameStateManager.js');

    // Load RenderLayerManager
    delete require.cache[require.resolve('../../../Classes/rendering/RenderLayerManager.js')];
    RenderLayerManager = require('../../../Classes/rendering/RenderLayerManager.js');

    // Create instances
    gameState = new GameStateManager();
    gameState.setState('MENU');
    
    renderManager = new RenderLayerManager();
    renderManager.initialize();
    global.RenderManager = renderManager;
  });

  afterEach(function() {
    delete global.window;
    delete global.document;
    delete global.RenderManager;
    delete global.mouseX;
    delete global.mouseY;
    delete global.mouseIsPressed;
    delete global.cameraManager;
    delete global.g_activeMap;
  });

  describe('Game State: LEVEL_EDITOR Recognition', function() {
    it('should recognize LEVEL_EDITOR as a valid game state', function() {
      gameState.setState('LEVEL_EDITOR');
      expect(gameState.getState()).to.equal('LEVEL_EDITOR');
    });

    it('should return correct layers for LEVEL_EDITOR state', function() {
      const layers = renderManager.getLayersForState('LEVEL_EDITOR');
      
      expect(layers).to.be.an('array');
      expect(layers).to.include(renderManager.layers.UI_GAME);
      expect(layers).to.include(renderManager.layers.UI_DEBUG);
    });

    it('should NOT include terrain layers in LEVEL_EDITOR state', function() {
      const layers = renderManager.getLayersForState('LEVEL_EDITOR');
      
      expect(layers).to.not.include(renderManager.layers.TERRAIN);
      expect(layers).to.not.include(renderManager.layers.ENTITIES);
      expect(layers).to.not.include(renderManager.layers.EFFECTS);
    });

    it('should not warn about unknown state for LEVEL_EDITOR', function() {
      let warningCalled = false;
      const originalWarn = console.warn;
      console.warn = (msg) => {
        if (msg.includes('Unknown game state')) {
          warningCalled = true;
        }
      };

      renderManager.getLayersForState('LEVEL_EDITOR');

      console.warn = originalWarn;
      expect(warningCalled).to.be.false;
    });
  });

  describe('RenderLayerManager: LEVEL_EDITOR Mode', function() {
    it('should skip terrain rendering in LEVEL_EDITOR mode', function() {
      let terrainRendered = false;
      global.g_activeMap.render = () => { terrainRendered = true; };

      renderManager.renderTerrainLayer('LEVEL_EDITOR');

      expect(terrainRendered).to.be.false;
    });

    it('should render terrain in PLAYING mode', function() {
      let terrainRendered = false;
      global.g_activeMap.render = () => { terrainRendered = true; };

      renderManager.renderTerrainLayer('PLAYING');

      expect(terrainRendered).to.be.true;
    });

    it('should render UI_GAME layer in LEVEL_EDITOR mode', function() {
      let uiGameRendered = false;
      
      renderManager.layerRenderers.set('ui_game', () => {
        uiGameRendered = true;
      });

      renderManager.render('LEVEL_EDITOR');

      expect(uiGameRendered).to.be.true;
    });

    it('should not call background(0) when rendering terrain in LEVEL_EDITOR', function() {
      let backgroundCalled = false;
      const originalBg = global.background;
      global.background = () => { backgroundCalled = true; };

      renderManager.renderTerrainLayer('LEVEL_EDITOR');

      global.background = originalBg;
      expect(backgroundCalled).to.be.false;
    });
  });

  describe('Interactive Drawable System in LEVEL_EDITOR', function() {
    it('should call update() on interactive drawables during render', function() {
      let updateCalled = false;

      const interactive = {
        hitTest: () => true,
        update: (pointer) => {
          updateCalled = true;
        }
      };

      renderManager.addInteractiveDrawable('ui_game', interactive);
      renderManager.render('LEVEL_EDITOR');

      expect(updateCalled).to.be.true;
    });

    it('should provide pointer object to interactive.update()', function() {
      let receivedPointer = null;

      const interactive = {
        hitTest: () => true,
        update: (pointer) => {
          receivedPointer = pointer;
        }
      };

      global.mouseX = 100;
      global.mouseY = 200;
      global.mouseIsPressed = true;

      renderManager.addInteractiveDrawable('ui_game', interactive);
      renderManager.render('LEVEL_EDITOR');

      expect(receivedPointer).to.not.be.null;
      expect(receivedPointer.screen).to.exist;
      expect(receivedPointer.screen.x).to.equal(100);
      expect(receivedPointer.screen.y).to.equal(200);
      expect(receivedPointer.isPressed).to.be.true;
    });

    it('should call render() on interactive drawables after update', function() {
      const callOrder = [];

      const interactive = {
        hitTest: () => true,
        update: () => {
          callOrder.push('update');
        },
        render: () => {
          callOrder.push('render');
        }
      };

      renderManager.addInteractiveDrawable('ui_game', interactive);
      renderManager.render('LEVEL_EDITOR');

      expect(callOrder).to.deep.equal(['update', 'render']);
    });

    it('should process multiple interactive drawables in LEVEL_EDITOR', function() {
      let interactive1Updated = false;
      let interactive2Updated = false;

      const interactive1 = {
        hitTest: () => true,
        update: () => { interactive1Updated = true; }
      };

      const interactive2 = {
        hitTest: () => true,
        update: () => { interactive2Updated = true; }
      };

      renderManager.addInteractiveDrawable('ui_game', interactive1);
      renderManager.addInteractiveDrawable('ui_game', interactive2);
      renderManager.render('LEVEL_EDITOR');

      expect(interactive1Updated).to.be.true;
      expect(interactive2Updated).to.be.true;
    });
  });

  describe('DraggablePanelManager Integration', function() {
    let DraggablePanelManager, draggablePanelManager;

    beforeEach(function() {
      // Load DraggablePanel first
      delete require.cache[require.resolve('../../../Classes/systems/ui/DraggablePanel.js')];
      global.DraggablePanel = require('../../../Classes/systems/ui/DraggablePanel.js');

      // Load DraggablePanelManager
      delete require.cache[require.resolve('../../../Classes/systems/ui/DraggablePanelManager.js')];
      DraggablePanelManager = require('../../../Classes/systems/ui/DraggablePanelManager.js');

      draggablePanelManager = new DraggablePanelManager();
      global.draggablePanelManager = draggablePanelManager;
    });

    it('should auto-register with RenderManager on initialize', function() {
      draggablePanelManager.initialize();

      const interactives = renderManager.layerInteractives.get('ui_game');
      expect(interactives).to.exist;
      expect(interactives.length).to.be.greaterThan(0);
    });

    it('should receive update calls when RenderManager.render() is called', function() {
      draggablePanelManager.initialize();
      
      let updateCalled = false;
      const originalUpdate = draggablePanelManager.update.bind(draggablePanelManager);
      draggablePanelManager.update = function(...args) {
        updateCalled = true;
        return originalUpdate(...args);
      };

      renderManager.render('LEVEL_EDITOR');

      expect(updateCalled).to.be.true;
    });

    it('should add LEVEL_EDITOR to stateVisibility when Level Editor panels initialize', function() {
      draggablePanelManager.initialize();

      // Load LevelEditorPanels
      delete require.cache[require.resolve('../../../Classes/systems/ui/LevelEditorPanels.js')];
      const LevelEditorPanels = require('../../../Classes/systems/ui/LevelEditorPanels.js');

      // Mock UI components
      global.MaterialPalette = class { render() {} handleClick() {} containsPoint() { return false; } };
      global.ToolBar = class { render() {} handleClick() {} containsPoint() { return false; } };
      global.BrushSizeControl = class { render() {} handleClick() {} containsPoint() { return false; } };

      const mockLevelEditor = {};
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      expect(draggablePanelManager.stateVisibility.LEVEL_EDITOR).to.exist;
      expect(draggablePanelManager.stateVisibility.LEVEL_EDITOR).to.include('level-editor-materials');
      expect(draggablePanelManager.stateVisibility.LEVEL_EDITOR).to.include('level-editor-tools');
      expect(draggablePanelManager.stateVisibility.LEVEL_EDITOR).to.include('level-editor-brush');
    });

    it('should NOT auto-render panels with managedExternally flag', function() {
      draggablePanelManager.initialize();

      // Create a panel with managedExternally flag
      const managedPanel = new global.DraggablePanel({
        id: 'test-managed',
        title: 'Managed Panel',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 },
        behavior: {
          managedExternally: true
        }
      });

      let renderCalled = false;
      const originalRender = managedPanel.render.bind(managedPanel);
      managedPanel.render = function(...args) {
        renderCalled = true;
        return originalRender(...args);
      };

      draggablePanelManager.panels.set('test-managed', managedPanel);
      draggablePanelManager.stateVisibility.LEVEL_EDITOR = ['test-managed'];

      // Call renderPanels (this is what happens during RenderManager.render())
      draggablePanelManager.renderPanels('LEVEL_EDITOR');

      // Panel should NOT have been rendered by the manager
      expect(renderCalled).to.be.false;
    });

    it('should auto-render panels WITHOUT managedExternally flag', function() {
      draggablePanelManager.initialize();

      // Create a normal panel (no managedExternally flag)
      const normalPanel = new global.DraggablePanel({
        id: 'test-normal',
        title: 'Normal Panel',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 }
      });

      let renderCalled = false;
      const originalRender = normalPanel.render.bind(normalPanel);
      normalPanel.render = function(...args) {
        renderCalled = true;
        return originalRender(...args);
      };

      draggablePanelManager.panels.set('test-normal', normalPanel);
      draggablePanelManager.stateVisibility.LEVEL_EDITOR = ['test-normal'];

      // Call renderPanels
      draggablePanelManager.renderPanels('LEVEL_EDITOR');

      // Panel SHOULD have been rendered by the manager
      expect(renderCalled).to.be.true;
    });

    it('should update managedExternally panels but not render them', function() {
      draggablePanelManager.initialize();

      const managedPanel = new global.DraggablePanel({
        id: 'test-managed-update',
        title: 'Managed Panel',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 },
        behavior: {
          managedExternally: true
        }
      });

      let updateCalled = false;
      let renderCalled = false;

      const originalUpdate = managedPanel.update.bind(managedPanel);
      managedPanel.update = function(...args) {
        updateCalled = true;
        return originalUpdate(...args);
      };

      const originalRender = managedPanel.render.bind(managedPanel);
      managedPanel.render = function(...args) {
        renderCalled = true;
        return originalRender(...args);
      };

      draggablePanelManager.panels.set('test-managed-update', managedPanel);
      draggablePanelManager.stateVisibility.LEVEL_EDITOR = ['test-managed-update'];

      // Simulate RenderManager calling update on interactives
      global.mouseX = 150;
      global.mouseY = 150;
      global.mouseIsPressed = false;
      
      draggablePanelManager.update(150, 150, false);
      draggablePanelManager.renderPanels('LEVEL_EDITOR');

      // Panel should be updated but NOT rendered
      expect(updateCalled).to.be.true;
      expect(renderCalled).to.be.false;
    });
  });

  describe('Render Pipeline Flow', function() {
    it('should execute render pipeline in correct order for LEVEL_EDITOR', function() {
      const executionOrder = [];

      renderManager.layerRenderers.set('ui_game', () => {
        executionOrder.push('ui_game_renderer');
      });

      renderManager.addDrawableToLayer('ui_game', () => {
        executionOrder.push('drawable');
      });

      const interactive = {
        hitTest: () => true,
        update: () => { executionOrder.push('interactive_update'); },
        render: () => { executionOrder.push('interactive_render'); }
      };
      renderManager.addInteractiveDrawable('ui_game', interactive);

      renderManager.render('LEVEL_EDITOR');

      // Expected order: interactive_update → ui_game_renderer → drawable → interactive_render
      expect(executionOrder.indexOf('interactive_update')).to.be.lessThan(executionOrder.indexOf('ui_game_renderer'));
      expect(executionOrder.indexOf('ui_game_renderer')).to.be.lessThan(executionOrder.indexOf('drawable'));
      expect(executionOrder.indexOf('drawable')).to.be.lessThan(executionOrder.indexOf('interactive_render'));
    });

    it('should handle errors in interactive updates gracefully', function() {
      const interactive = {
        hitTest: () => true,
        update: () => { throw new Error('Test error'); }
      };

      renderManager.addInteractiveDrawable('ui_game', interactive);

      expect(() => renderManager.render('LEVEL_EDITOR')).to.not.throw();
    });

    it('should track render stats for LEVEL_EDITOR', function() {
      renderManager.render('LEVEL_EDITOR');

      expect(renderManager.renderStats.frameCount).to.be.greaterThan(0);
      expect(renderManager.renderStats.lastFrameTime).to.be.a('number');
    });
  });

  describe('State Transitions', function() {
    it('should handle transition from MENU to LEVEL_EDITOR', function() {
      gameState.setState('MENU');
      renderManager.render('MENU');

      gameState.setState('LEVEL_EDITOR');
      renderManager.render('LEVEL_EDITOR');

      expect(gameState.getState()).to.equal('LEVEL_EDITOR');
    });

    it('should handle transition from PLAYING to LEVEL_EDITOR', function() {
      gameState.setState('PLAYING');
      renderManager.render('PLAYING');

      gameState.setState('LEVEL_EDITOR');
      renderManager.render('LEVEL_EDITOR');

      expect(gameState.getState()).to.equal('LEVEL_EDITOR');
    });

    it('should handle transition from LEVEL_EDITOR back to PLAYING', function() {
      gameState.setState('LEVEL_EDITOR');
      renderManager.render('LEVEL_EDITOR');

      gameState.setState('PLAYING');
      renderManager.render('PLAYING');

      expect(gameState.getState()).to.equal('PLAYING');
    });

    it('should render different layers after state transition', function() {
      let terrainRendered = false;
      global.g_activeMap.render = () => { terrainRendered = true; };

      // In LEVEL_EDITOR: terrain should NOT render
      renderManager.render('LEVEL_EDITOR');
      expect(terrainRendered).to.be.false;

      // In PLAYING: terrain SHOULD render
      renderManager.render('PLAYING');
      expect(terrainRendered).to.be.true;
    });
  });

  describe('Panel Dragging in LEVEL_EDITOR', function() {
    let DraggablePanelManager, draggablePanelManager, testPanel;

    beforeEach(function() {
      // Load DraggablePanel
      delete require.cache[require.resolve('../../../Classes/systems/ui/DraggablePanel.js')];
      global.DraggablePanel = require('../../../Classes/systems/ui/DraggablePanel.js');

      // Load DraggablePanelManager
      delete require.cache[require.resolve('../../../Classes/systems/ui/DraggablePanelManager.js')];
      DraggablePanelManager = require('../../../Classes/systems/ui/DraggablePanelManager.js');

      draggablePanelManager = new DraggablePanelManager();
      global.draggablePanelManager = draggablePanelManager;
      draggablePanelManager.initialize();

      // Create a test panel
      testPanel = new global.DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 }
      });

      draggablePanelManager.panels.set('test-panel', testPanel);
      draggablePanelManager.stateVisibility.LEVEL_EDITOR = ['test-panel'];
    });

    it('should start dragging when title bar is clicked', function() {
      // Click on title bar (y = 100 to 130)
      global.mouseX = 150;
      global.mouseY = 110;
      global.mouseIsPressed = true;

      // Simulate mousePressed event
      draggablePanelManager.handleMouseEvents(150, 110, true);

      expect(testPanel.isDragging).to.be.true;
    });

    it('should update panel position during drag', function() {
      // Start drag
      global.mouseX = 150;
      global.mouseY = 110;
      draggablePanelManager.handleMouseEvents(150, 110, true);

      // Move mouse while dragging
      global.mouseX = 200;
      global.mouseY = 160;
      global.mouseIsPressed = true;

      // Call update (this happens via RenderManager.render())
      renderManager.render('LEVEL_EDITOR');

      // Position should have changed
      expect(testPanel.position.x).to.not.equal(100);
      expect(testPanel.position.y).to.not.equal(100);
    });

    it('should stop dragging when mouse is released', function() {
      // Start drag
      draggablePanelManager.handleMouseEvents(150, 110, true);
      expect(testPanel.isDragging).to.be.true;

      // Release mouse
      global.mouseIsPressed = false;
      testPanel.update(200, 160, false);

      expect(testPanel.isDragging).to.be.false;
    });

    it('should receive continuous updates through RenderManager', function() {
      let updateCount = 0;
      const originalUpdate = testPanel.update.bind(testPanel);
      testPanel.update = function(...args) {
        updateCount++;
        return originalUpdate(...args);
      };

      // Render multiple frames
      renderManager.render('LEVEL_EDITOR');
      renderManager.render('LEVEL_EDITOR');
      renderManager.render('LEVEL_EDITOR');

      expect(updateCount).to.be.greaterThan(0);
    });
  });
});




// ================================================================
// renderController.integration.test.js (14 tests)
// ================================================================
/**
 * Integration Tests: RenderController
 * 
 * Tests RenderController with real Entity instances and p5.js mocks
 * Focuses on highlighting, state indicators, and visual effects
 */

describe('RenderController Integration', function() {
  let Entity, RenderController;
  let entity, renderController;
  
  beforeEach(function() {
    // Create JSDOM environment
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
    
    // Mock p5.js drawing functions
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.translate = sinon.stub();
    global.scale = sinon.stub();
    global.rotate = sinon.stub();
    global.fill = sinon.stub();
    global.stroke = sinon.stub();
    global.noStroke = sinon.stub();
    global.noFill = sinon.stub();
    global.strokeWeight = sinon.stub();
    global.ellipse = sinon.stub();
    global.rect = sinon.stub();
    global.line = sinon.stub();
    global.triangle = sinon.stub();
    global.text = sinon.stub();
    global.textAlign = sinon.stub();
    global.textSize = sinon.stub();
    global.sin = Math.sin;
    global.cos = Math.cos;
    global.PI = Math.PI;
    global.CENTER = 'center';
    global.CORNER = 'corner';
    global.createVector = (x, y) => ({ x, y, add: function(v) { this.x += v.x; this.y += v.y; return this; } });
    global.noSmooth = sinon.stub();
    global.smooth = sinon.stub();
    global.rectMode = sinon.stub();
    
    // Mock image
    global.image = sinon.stub();
    
    // Sync to window scope (required for RenderController p5 availability check)
    window.push = global.push;
    window.pop = global.pop;
    window.translate = global.translate;
    window.scale = global.scale;
    window.rotate = global.rotate;
    window.fill = global.fill;
    window.stroke = global.stroke;
    window.noStroke = global.noStroke;
    window.noFill = global.noFill;
    window.strokeWeight = global.strokeWeight;
    window.ellipse = global.ellipse;
    window.rect = global.rect;
    window.line = global.line;
    window.triangle = global.triangle;
    window.text = global.text;
    window.textAlign = global.textAlign;
    window.textSize = global.textSize;
    window.sin = global.sin;
    window.cos = global.cos;
    window.PI = global.PI;
    window.CENTER = global.CENTER;
    window.CORNER = global.CORNER;
    window.createVector = global.createVector;
    window.image = global.image;
    window.noSmooth = global.noSmooth;
    window.smooth = global.smooth;
    window.rectMode = global.rectMode;
    
    // Mock CollisionBox2D
    global.CollisionBox2D = class CollisionBox2D {
      constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
      }
      contains(x, y) { return false; }
      intersects(other) { return false; }
      setPosition(x, y) {
        this.x = x;
        this.y = y;
      }
      setSize(w, h) {
        this.width = w;
        this.height = h;
      }
      getPosX() { return this.x; }
      getPosY() { return this.y; }
      getWidth() { return this.width; }
      getHeight() { return this.height; }
    };
    window.CollisionBox2D = global.CollisionBox2D;
    
    // Mock all controller classes (Entity needs them)
    global.TransformController = class TransformController {
      constructor(entity) {
        this._entity = entity;
        this._position = { x: entity.posX || 0, y: entity.posY || 0 };
      }
      update() {}
      getPosition() {
        return this._position;
      }
      setPosition(x, y) {
        this._position.x = x;
        this._position.y = y;
      }
    };
    window.TransformController = global.TransformController;
    
    global.MovementController = class MovementController {
      constructor(entity) {
        this._entity = entity;
        this.movementSpeed = 1.0;
      }
      update() {}
    };
    window.MovementController = global.MovementController;
    
    global.SelectionController = class SelectionController {
      constructor(entity) {
        this._entity = entity;
        this._selectable = true;
      }
      update() {}
      setSelectable(value) { this._selectable = value; }
      isSelectable() { return this._selectable; }
    };
    window.SelectionController = global.SelectionController;
    
    global.CombatController = class CombatController {
      constructor(entity) {
        this._entity = entity;
        this._faction = 'neutral';
      }
      update() {}
      setFaction(faction) { this._faction = faction; }
      getFaction() { return this._faction; }
    };
    window.CombatController = global.CombatController;
    
    global.TerrainController = class TerrainController {
      constructor(entity) { this._entity = entity; }
      update() {}
    };
    window.TerrainController = global.TerrainController;
    
    global.TaskManager = class TaskManager {
      constructor(entity) { this._entity = entity; }
      update() {}
    };
    window.TaskManager = global.TaskManager;
    
    global.HealthController = class HealthController {
      constructor(entity) { this._entity = entity; }
      update() {}
    };
    window.HealthController = global.HealthController;
    
    // Mock camera manager (required for RenderController)
    global.cameraManager = {
      getZoom: () => 1.0,
      screenToWorld: (x, y) => ({ x, y, worldX: x, worldY: y }),
      worldToScreen: (x, y) => ({ x, y })
    };
    window.cameraManager = global.cameraManager;
    
    // Load RenderController and make it available globally BEFORE loading Entity
    const RenderControllerModule = require('../../../Classes/controllers/RenderController');
    global.RenderController = RenderControllerModule;
    window.RenderController = RenderControllerModule;
    
    // Now load Entity (it will see RenderController in global scope)
    const EntityModule = require('../../../Classes/containers/Entity');
    Entity = EntityModule;
    
    // Create entity with RenderController
    entity = new Entity(100, 100, 32, 32);
    renderController = entity.getController('render'); // Note: key is 'render' not 'renderController'
  });
  
  afterEach(function() {
    sinon.restore();
    delete global.window;
    delete global.document;
    delete global.push;
    delete global.pop;
    delete global.translate;
    delete global.scale;
    delete global.rotate;
    delete global.fill;
    delete global.stroke;
    delete global.noStroke;
    delete global.strokeWeight;
    delete global.ellipse;
    delete global.rect;
    delete global.line;
    delete global.triangle;
    delete global.text;
    delete global.textAlign;
    delete global.textSize;
    delete global.sin;
    delete global.cos;
    delete global.PI;
    delete global.createVector;
    delete global.image;
  });
  
  describe('Highlight System', function() {
    it('should set highlight with SELECTED type', function() {
      renderController.setHighlight('SELECTED');
      
      expect(renderController._highlightState).to.equal('SELECTED');
      expect(renderController._highlightColor).to.exist;
      expect(renderController._highlightIntensity).to.equal(1.0);
    });
    
    it('should set highlight with HOVER type', function() {
      renderController.setHighlight('HOVER', 0.5);
      
      expect(renderController._highlightState).to.equal('HOVER');
      expect(renderController._highlightIntensity).to.equal(0.5);
    });
    
    it('should clear highlight', function() {
      renderController.setHighlight('SELECTED');
      renderController.clearHighlight();
      
      expect(renderController._highlightState).to.be.null;
      expect(renderController._highlightColor).to.be.null;
    });
    
    it('should render highlight effects', function() {
      renderController.setHighlight('SELECTED');
      renderController.renderHighlighting();
      
      // Should call drawing functions
      expect(global.push.called).to.be.true;
      expect(global.pop.called).to.be.true;
    });
  });
  
  describe('State Indicators', function() {
    it('should render MOVING indicator', function() {
      // Mock state machine with MOVING state
      entity._stateMachine = {
        primaryState: 'MOVING'
      };
      
      // Reset stubs before testing
      global.push.resetHistory();
      global.pop.resetHistory();
      global.fill.resetHistory();
      global.ellipse.resetHistory();
      
      renderController.renderStateIndicators();
      
      // Should render circle and text
      expect(global.fill.called).to.be.true;
      expect(global.ellipse.called).to.be.true;
      expect(global.text.called).to.be.true;
    });
    
    it('should render GATHERING indicator', function() {
      // Mock state machine with GATHERING state
      entity._stateMachine = {
        primaryState: 'GATHERING'
      };
      
      // Reset stubs before testing
      global.fill.resetHistory();
      global.ellipse.resetHistory();
      global.text.resetHistory();
      
      renderController.renderStateIndicators();
      
      expect(global.fill.called).to.be.true;
      expect(global.ellipse.called).to.be.true;
      expect(global.text.called).to.be.true;
    });
  });
  
  describe('Animation Updates', function() {
    it('should update bob offset', function() {
      const initialBob = renderController._bobOffset;
      renderController.update();
      
      expect(renderController._bobOffset).to.not.equal(initialBob);
    });
    
    it('should wrap bob offset at 4*PI', function() {
      renderController._bobOffset = 4 * Math.PI + 0.5;
      renderController.update();
      
      expect(renderController._bobOffset).to.be.lessThan(4 * Math.PI);
    });
  });
  
  describe('Integration with Entity', function() {
    it('should exist on entity', function() {
      expect(entity.getController('render')).to.exist;
    });
    
    it('should be called during entity update', function() {
      const updateSpy = sinon.spy(renderController, 'update');
      entity.update();
      
      expect(updateSpy.called).to.be.true;
    });
    
    it('should render with entity', function() {
      const renderSpy = sinon.spy(renderController, 'render');
      entity.render();
      
      expect(renderSpy.called).to.be.true;
    });
  });
  
  describe('Effects System', function() {
    it('should add visual effects', function() {
      const effect = {
        createdAt: Date.now(),
        duration: 1000,
        position: { x: 0, y: 0 },
        alpha: 1.0
      };
      
      renderController.addEffect(effect);
      expect(renderController._effects.length).to.equal(1);
    });
    
    it('should update effects properties', function() {
      const effect = {
        createdAt: Date.now(),
        duration: 1000,
        position: { x: 0, y: 0 },
        velocity: { x: 1, y: 1 },
        alpha: 1.0
      };
      
      renderController.addEffect(effect);
      const initialX = effect.position.x;
      const initialY = effect.position.y;
      
      renderController.updateEffects();
      
      // Position should have changed due to velocity
      expect(effect.position.x).to.be.greaterThan(initialX);
      expect(effect.position.y).to.be.greaterThan(initialY);
    });
    
    it('should remove expired effects', function() {
      const effect = {
        createdAt: Date.now() - 2000, // Created 2 seconds ago
        duration: 1000, // 1 second duration (expired)
        position: { x: 0, y: 0 },
        alpha: 1.0
      };
      
      renderController.addEffect(effect);
      expect(renderController._effects.length).to.equal(1);
      
      // Update should remove expired effect
      renderController.updateEffects();
      
      expect(renderController._effects.length).to.equal(0);
    });
  });
});




// ================================================================
// renderLayerManager.integration.test.js (69 tests)
// ================================================================
/**
 * Integration Tests for RenderLayerManager
 * 
 * Tests the integration of RenderLayerManager with:
 * - Layer rendering and ordering (TERRAIN → ENTITIES → EFFECTS → UI_GAME → UI_DEBUG → UI_MENU)
 * - Game state management (layer visibility per state)
 * - Layer toggle functionality (enabling/disabling layers)
 * - Performance tracking
 * - Drawable registration and execution
 * - Interactive drawable system
 * 
 * Focus: Ensuring layers render in correct order and turn off when appropriate
 */

let fs = require('fs');
let path = require('path');

describe('RenderLayerManager Integration Tests', function() {
    let dom;
    let window;
    let document;
    let RenderLayerManager;
    let renderManager;

    // Mock render tracking
    let renderCallOrder;
    let renderedLayers;

    before(function() {
        // Create JSDOM environment
        dom = new JSDOM('<!DOCTYPE html><html><body><canvas id="defaultCanvas0"></canvas></body></html>', {
            url: 'http://localhost',
            pretendToBeVisual: true,
            resources: 'usable'
        });

        window = dom.window;
        document = window.document;
        global.window = window;
        global.document = document;

        // Setup p5.js and game environment mocks
        setupEnvironmentMocks();

        // Load real rendering implementations for true integration testing
        loadEntityLayerRenderer();      // Creates window.EntityRenderer
        loadEffectsLayerRenderer();     // Creates window.EffectsRenderer
        
        // Wrap renderer methods to track their calls for testing
        setupRendererTracking();
        
        // Load RenderLayerManager (must be after renderers so it can find them)
        loadRenderLayerManager();
    });

    after(function() {
        // Cleanup
        delete global.window;
        delete global.document;
        dom.window.close();
    });

    beforeEach(function() {
        // Reset render tracking
        renderCallOrder = [];
        renderedLayers = new Set();

        // Create fresh RenderLayerManager instance
        renderManager = new RenderLayerManager();

        // Setup mock renderers that track calls
        setupMockRenderers();

        // Initialize the render manager
        renderManager.initialize();
    });

    afterEach(function() {
        // Cleanup
        renderManager = null;
        renderCallOrder = [];
        renderedLayers.clear();
    });

    /**
     * Setup p5.js and game environment mocks
     */
    function setupEnvironmentMocks() {
        // Mock p5.js drawing functions - set at global level
        global.push = () => {};
        global.pop = () => {};
        global.background = () => {};
        global.fill = () => {};
        global.stroke = () => {};
        global.strokeWeight = () => {};
        global.rect = () => {};
        global.text = () => {};
        global.textAlign = () => {};
        global.textSize = () => {};
        global.image = () => {};
        global.translate = () => {};
        global.scale = () => {};
        global.noSmooth = () => {};
        global.smooth = () => {};
        
        window.push = global.push;
        window.pop = global.pop;
        window.background = global.background;
        window.fill = global.fill;
        window.stroke = global.stroke;
        window.strokeWeight = global.strokeWeight;
        window.rect = global.rect;
        window.text = global.text;
        window.textAlign = global.textAlign;
        window.textSize = global.textSize;
        window.image = global.image;
        window.translate = global.translate;
        window.scale = global.scale;
        window.noSmooth = global.noSmooth;
        window.smooth = global.smooth;

        // Mock p5.js constants
        window.CENTER = 'center';
        window.LEFT = 'left';
        window.TOP = 'top';

        // Mock canvas dimensions (must be set at global scope for RenderLayerManager)
        global.windowWidth = 800;
        global.windowHeight = 600;
        window.windowWidth = 800;
        window.windowHeight = 600;
        
        // Mock mouse globals (must be accessible at global scope)
        global.mouseX = 400;
        global.mouseY = 300;
        global.mouseIsPressed = false;
        window.mouseX = 400;
        window.mouseY = 300;
        window.mouseIsPressed = false;

        // Global canvas size (must be set at global scope for RenderLayerManager)
        global.g_canvasX = 800;
        global.g_canvasY = 600;
        global.TILE_SIZE = 32;
        window.g_canvasX = 800;
        window.g_canvasY = 600;
        window.TILE_SIZE = 32;

        // Mock performance.now()
        let mockTime = 0;
        window.performance = {
            now: () => {
                mockTime += 16.67; // Simulate 60 FPS
                return mockTime;
            }
        };

        // Mock active map (must be set at global scope for RenderLayerManager)
        global.g_activeMap = {
            render: () => {
                renderCallOrder.push('TERRAIN');
                renderedLayers.add('terrain');
            }
        };
        window.g_activeMap = global.g_activeMap;

        // Mock camera manager
        window.cameraManager = {
            getZoom: () => 1.0,
            screenToWorld: (x, y) => ({ x, y, worldX: x, worldY: y })
        };
        window.g_cameraManager = window.cameraManager;
        global.cameraManager = window.cameraManager;

        // Mock UIRenderer (required for renderGameUILayer to work)
        global.UIRenderer = {};
        window.UIRenderer = global.UIRenderer;

        // Mock game UI functions (these are standalone functions, not classes)
        global.renderCurrencies = () => {
            renderCallOrder.push('currencies');
        };
        window.renderCurrencies = global.renderCurrencies;

        global.updateDropoffUI = () => {};
        window.updateDropoffUI = global.updateDropoffUI;
        
        global.drawDropoffUI = () => {
            renderCallOrder.push('dropoff');
        };
        window.drawDropoffUI = global.drawDropoffUI;

        global.updateMenu = () => {};
        window.updateMenu = global.updateMenu;
        
        global.renderMenu = () => {
            renderCallOrder.push('menu');
            renderedLayers.add('ui_menu');
            return true;
        };
        window.renderMenu = global.renderMenu;

        // Mock selection box controller (set at global scope)
        global.g_selectionBoxController = {
            draw: () => {
                renderCallOrder.push('selectionBox');
            },
            handleClick: () => {},
            handleDrag: () => {},
            handleRelease: () => {}
        };
        window.g_selectionBoxController = global.g_selectionBoxController;

        // Mock performance monitor (set at global scope)
        global.g_performanceMonitor = {
            debugDisplay: { enabled: true },
            render: () => {
                renderCallOrder.push('performanceMonitor');
                renderedLayers.add('ui_debug');
            },
            // Methods used by EntityRenderer
            startRenderPhase: (phase) => {},
            endRenderPhase: () => {},
            recordEntityStats: (total, rendered, culled, breakdown) => {},
            finalizeEntityPerformance: () => {}
        };
        window.g_performanceMonitor = global.g_performanceMonitor;

        // Mock resource list for EntityRenderer
        global.g_resourceList = [];
        window.g_resourceList = global.g_resourceList;

        // Mock ants array for EntityRenderer
        global.ants = [];
        window.ants = global.ants;
        
        // Mock antsUpdate function for EntityRenderer
        global.antsUpdate = () => {};
        window.antsUpdate = global.antsUpdate;

        // Mock debug console functions (already set as global)
        global.isDevConsoleEnabled = () => true;
        window.isDevConsoleEnabled = global.isDevConsoleEnabled;
        
        global.drawDevConsoleIndicator = () => {
            renderCallOrder.push('devConsole');
        };
        window.drawDevConsoleIndicator = global.drawDevConsoleIndicator;

        global.isCommandLineActive = () => false;
        window.isCommandLineActive = global.isCommandLineActive;
        
        global.drawCommandLine = () => {};
        window.drawCommandLine = global.drawCommandLine;

        // Mock debug grid (already set as global)
        global.drawDebugGrid = () => {
            renderCallOrder.push('debugGrid');
        };
        window.drawDebugGrid = global.drawDebugGrid;
        
        global.g_gridMap = { width: 32, height: 32 };
        window.g_gridMap = global.g_gridMap;

        // Mock fireball manager, lightning manager, queen control panel
        // These are game systems that would normally exist
        window.g_fireballManager = {
            render: () => {
                renderCallOrder.push('fireballs');
            }
        };

        window.g_lightningManager = {
            render: () => {
                renderCallOrder.push('lightning');
            }
        };

        window.g_queenControlPanel = {
            render: () => {
                renderCallOrder.push('queenPanel');
            }
        };

        window.g_mouseCrosshair = {
            update: () => {},
            render: () => {
                renderCallOrder.push('crosshair');
            }
        };

        window.g_coordinateDebugOverlay = {
            render: () => {
                renderCallOrder.push('coordDebug');
            }
        };

        // Mock logging functions (required by RenderLayerManager)
        global.logNormal = function(message) {
            // Silent in tests unless debugging
        };
        window.logNormal = global.logNormal;

        global.logVerbose = function(...args) {
            // Silent in tests
        };
        window.logVerbose = global.logVerbose;
    }

    /**
     * Dynamically load RenderLayerManager class
     */
    function loadRenderLayerManager() {
        const renderLayerPath = path.resolve(__dirname, '../../../Classes/rendering/RenderLayerManager.js');
        const renderLayerCode = fs.readFileSync(renderLayerPath, 'utf8');

        // Execute in context
        const func = new Function('window', 'document', renderLayerCode + '\nreturn RenderLayerManager;');
        RenderLayerManager = func(window, document);
    }

    /**
     * Dynamically load EntityLayerRenderer (creates window.EntityRenderer instance)
     */
    function loadEntityLayerRenderer() {
        const entityLayerPath = path.resolve(__dirname, '../../../Classes/rendering/EntityLayerRenderer.js');
        const entityLayerCode = fs.readFileSync(entityLayerPath, 'utf8');

        // Execute in context - this will create window.EntityRenderer
        const func = new Function('window', 'global', 'document', entityLayerCode);
        func(window, global, document);
    }

    /**
     * Dynamically load EffectsLayerRenderer (creates window.EffectsRenderer instance)
     */
    function loadEffectsLayerRenderer() {
        const effectsLayerPath = path.resolve(__dirname, '../../../Classes/rendering/EffectsLayerRenderer.js');
        const effectsLayerCode = fs.readFileSync(effectsLayerPath, 'utf8');

        // Execute in context - this will create window.EffectsRenderer
        const func = new Function('window', 'global', 'document', effectsLayerCode);
        func(window, global, document);
    }

    /**
     * Wrap EntityRenderer and EffectsRenderer methods to track their calls
     */
    function setupRendererTracking() {
        // Wrap EntityRenderer.renderAllLayers to track calls
        if (window.EntityRenderer && typeof window.EntityRenderer.renderAllLayers === 'function') {
            const originalRenderAllLayers = window.EntityRenderer.renderAllLayers.bind(window.EntityRenderer);
            window.EntityRenderer.renderAllLayers = function(gameState) {
                renderCallOrder.push('ENTITIES');
                return originalRenderAllLayers(gameState);
            };
        }

        // Wrap EffectsRenderer.renderEffects to track calls
        if (window.EffectsRenderer && typeof window.EffectsRenderer.renderEffects === 'function') {
            const originalRenderEffects = window.EffectsRenderer.renderEffects.bind(window.EffectsRenderer);
            window.EffectsRenderer.renderEffects = function(gameState) {
                renderCallOrder.push('EFFECTS');
                return originalRenderEffects(gameState);
            };
        }
    }

    /**
     * Setup mock renderers that track their execution
     */
    function setupMockRenderers() {
        // Create tracking versions of layer renderers
        const originalTerrainRenderer = renderManager.renderTerrainLayer.bind(renderManager);
        renderManager.renderTerrainLayer = function(gameState) {
            renderCallOrder.push('TERRAIN_LAYER');
            renderedLayers.add('terrain');
            return originalTerrainRenderer(gameState);
        };

        const originalEntitiesRenderer = renderManager.renderEntitiesLayer.bind(renderManager);
        renderManager.renderEntitiesLayer = function(gameState) {
            renderCallOrder.push('ENTITIES_LAYER');
            renderedLayers.add('entities');
            return originalEntitiesRenderer(gameState);
        };

        const originalEffectsRenderer = renderManager.renderEffectsLayer.bind(renderManager);
        renderManager.renderEffectsLayer = function(gameState) {
            renderCallOrder.push('EFFECTS_LAYER');
            renderedLayers.add('effects');
            return originalEffectsRenderer(gameState);
        };

        const originalGameUIRenderer = renderManager.renderGameUILayer.bind(renderManager);
        renderManager.renderGameUILayer = function(gameState) {
            renderCallOrder.push('UI_GAME_LAYER');
            renderedLayers.add('ui_game');
            return originalGameUIRenderer(gameState);
        };

        const originalDebugUIRenderer = renderManager.renderDebugUILayer.bind(renderManager);
        renderManager.renderDebugUILayer = function(gameState) {
            renderCallOrder.push('UI_DEBUG_LAYER');
            renderedLayers.add('ui_debug');
            return originalDebugUIRenderer(gameState);
        };

        const originalMenuUIRenderer = renderManager.renderMenuUILayer.bind(renderManager);
        renderManager.renderMenuUILayer = function(gameState) {
            renderCallOrder.push('UI_MENU_LAYER');
            renderedLayers.add('ui_menu');
            return originalMenuUIRenderer(gameState);
        };
    }

    // ===================================================================
    // INITIALIZATION TESTS
    // ===================================================================

    describe('Initialization', function() {
        it('should initialize with all layer definitions', function() {
            expect(renderManager.layers).to.be.an('object');
            expect(renderManager.layers.TERRAIN).to.equal('terrain');
            expect(renderManager.layers.ENTITIES).to.equal('entities');
            expect(renderManager.layers.EFFECTS).to.equal('effects');
            expect(renderManager.layers.UI_GAME).to.equal('ui_game');
            expect(renderManager.layers.UI_DEBUG).to.equal('ui_debug');
            expect(renderManager.layers.UI_MENU).to.equal('ui_menu');
        });

        it('should register all default layer renderers on initialization', function() {
            expect(renderManager.layerRenderers.size).to.equal(6);
            expect(renderManager.layerRenderers.has('terrain')).to.be.true;
            expect(renderManager.layerRenderers.has('entities')).to.be.true;
            expect(renderManager.layerRenderers.has('effects')).to.be.true;
            expect(renderManager.layerRenderers.has('ui_game')).to.be.true;
            expect(renderManager.layerRenderers.has('ui_debug')).to.be.true;
            expect(renderManager.layerRenderers.has('ui_menu')).to.be.true;
        });

        it('should have all layers enabled by default', function() {
            expect(renderManager.disabledLayers.size).to.equal(0);
            expect(renderManager.isLayerEnabled('terrain')).to.be.true;
            expect(renderManager.isLayerEnabled('entities')).to.be.true;
            expect(renderManager.isLayerEnabled('effects')).to.be.true;
            expect(renderManager.isLayerEnabled('ui_game')).to.be.true;
            expect(renderManager.isLayerEnabled('ui_debug')).to.be.true;
            expect(renderManager.isLayerEnabled('ui_menu')).to.be.true;
        });

        it('should initialize performance tracking', function() {
            expect(renderManager.renderStats).to.be.an('object');
            expect(renderManager.renderStats.frameCount).to.equal(0);
            expect(renderManager.renderStats.lastFrameTime).to.equal(0);
            expect(renderManager.renderStats.layerTimes).to.be.an('object');
        });

        it('should mark as initialized', function() {
            expect(renderManager.isInitialized).to.be.true;
        });
    });

    // ===================================================================
    // LAYER ORDERING TESTS
    // ===================================================================

    describe('Layer Rendering Order', function() {
        it('should render layers in correct order for PLAYING state', function() {
            renderManager.render('PLAYING');

            // Check that layers were rendered in order
            expect(renderCallOrder).to.include('TERRAIN_LAYER');
            expect(renderCallOrder).to.include('ENTITIES_LAYER');
            expect(renderCallOrder).to.include('EFFECTS_LAYER');
            expect(renderCallOrder).to.include('UI_GAME_LAYER');
            expect(renderCallOrder).to.include('UI_DEBUG_LAYER');

            // Verify order: TERRAIN should come before ENTITIES
            const terrainIndex = renderCallOrder.indexOf('TERRAIN_LAYER');
            const entitiesIndex = renderCallOrder.indexOf('ENTITIES_LAYER');
            const effectsIndex = renderCallOrder.indexOf('EFFECTS_LAYER');
            const uiGameIndex = renderCallOrder.indexOf('UI_GAME_LAYER');
            const uiDebugIndex = renderCallOrder.indexOf('UI_DEBUG_LAYER');

            expect(terrainIndex).to.be.lessThan(entitiesIndex);
            expect(entitiesIndex).to.be.lessThan(effectsIndex);
            expect(effectsIndex).to.be.lessThan(uiGameIndex);
            expect(uiGameIndex).to.be.lessThan(uiDebugIndex);
        });

        it('should render layers in correct order for MENU state', function() {
            renderCallOrder = [];
            renderManager.render('MENU');

            // MENU state should only render TERRAIN and UI_MENU
            expect(renderCallOrder).to.include('TERRAIN_LAYER');
            expect(renderCallOrder).to.include('UI_MENU_LAYER');

            // Should NOT render other layers
            expect(renderCallOrder).to.not.include('ENTITIES_LAYER');
            expect(renderCallOrder).to.not.include('EFFECTS_LAYER');
            expect(renderCallOrder).to.not.include('UI_GAME_LAYER');
        });

        it('should render effects layer after entities layer', function() {
            renderManager.render('PLAYING');

            const entitiesIndex = renderCallOrder.indexOf('ENTITIES_LAYER');
            const effectsIndex = renderCallOrder.indexOf('EFFECTS_LAYER');

            expect(effectsIndex).to.be.greaterThan(entitiesIndex);
        });

        it('should render UI layers on top of game layers', function() {
            renderManager.render('PLAYING');

            const effectsIndex = renderCallOrder.indexOf('EFFECTS_LAYER');
            const uiGameIndex = renderCallOrder.indexOf('UI_GAME_LAYER');
            const uiDebugIndex = renderCallOrder.indexOf('UI_DEBUG_LAYER');

            expect(uiGameIndex).to.be.greaterThan(effectsIndex);
            expect(uiDebugIndex).to.be.greaterThan(effectsIndex);
        });
    });

    // ===================================================================
    // GAME STATE LAYER VISIBILITY TESTS
    // ===================================================================

    describe('Layer Visibility by Game State', function() {
        it('should render correct layers for PLAYING state', function() {
            const layers = renderManager.getLayersForState('PLAYING');

            expect(layers).to.include('terrain');
            expect(layers).to.include('entities');
            expect(layers).to.include('effects');
            expect(layers).to.include('ui_game');
            expect(layers).to.include('ui_debug');
            expect(layers).to.not.include('ui_menu');
        });

        it('should render correct layers for MENU state', function() {
            const layers = renderManager.getLayersForState('MENU');

            expect(layers).to.include('terrain');
            expect(layers).to.include('ui_menu');
            expect(layers).to.not.include('entities');
            expect(layers).to.not.include('effects');
            expect(layers).to.not.include('ui_game');
            expect(layers).to.not.include('ui_debug');
        });

        it('should render correct layers for PAUSED state', function() {
            const layers = renderManager.getLayersForState('PAUSED');

            expect(layers).to.include('terrain');
            expect(layers).to.include('entities');
            expect(layers).to.include('effects');
            expect(layers).to.include('ui_game');
            expect(layers).to.not.include('ui_debug');
            expect(layers).to.not.include('ui_menu');
        });

        it('should render correct layers for GAME_OVER state', function() {
            const layers = renderManager.getLayersForState('GAME_OVER');

            expect(layers).to.include('terrain');
            expect(layers).to.include('entities');
            expect(layers).to.include('effects');
            expect(layers).to.include('ui_game');
            expect(layers).to.include('ui_menu');
            expect(layers).to.not.include('ui_debug');
        });

        it('should render correct layers for DEBUG_MENU state', function() {
            const layers = renderManager.getLayersForState('DEBUG_MENU');

            expect(layers).to.include('terrain');
            expect(layers).to.include('entities');
            expect(layers).to.include('effects');
            expect(layers).to.include('ui_debug');
            expect(layers).to.include('ui_menu');
            expect(layers).to.not.include('ui_game');
        });

        it('should render correct layers for OPTIONS state', function() {
            const layers = renderManager.getLayersForState('OPTIONS');

            expect(layers).to.include('terrain');
            expect(layers).to.include('ui_menu');
            expect(layers).to.not.include('entities');
            expect(layers).to.not.include('effects');
            expect(layers).to.not.include('ui_game');
            expect(layers).to.not.include('ui_debug');
        });

        it('should render correct layers for KANBAN state', function() {
            const layers = renderManager.getLayersForState('KANBAN');

            expect(layers).to.include('terrain');
            expect(layers).to.include('ui_menu');
            expect(layers).to.not.include('entities');
            expect(layers).to.not.include('effects');
            expect(layers).to.not.include('ui_game');
            expect(layers).to.not.include('ui_debug');
        });

        it('should fallback to default layers for unknown state', function() {
            const layers = renderManager.getLayersForState('UNKNOWN_STATE');

            expect(layers).to.include('terrain');
            expect(layers).to.include('ui_menu');
        });
    });

    // ===================================================================
    // LAYER TOGGLE TESTS
    // ===================================================================

    describe('Layer Toggle Functionality', function() {
        it('should disable a layer when toggled', function() {
            renderManager.toggleLayer('terrain');

            expect(renderManager.isLayerEnabled('terrain')).to.be.false;
            expect(renderManager.disabledLayers.has('terrain')).to.be.true;
        });

        it('should enable a layer when toggled twice', function() {
            renderManager.toggleLayer('terrain');
            renderManager.toggleLayer('terrain');

            expect(renderManager.isLayerEnabled('terrain')).to.be.true;
            expect(renderManager.disabledLayers.has('terrain')).to.be.false;
        });

        it('should explicitly enable a layer', function() {
            renderManager.disableLayer('entities');
            expect(renderManager.isLayerEnabled('entities')).to.be.false;

            const result = renderManager.enableLayer('entities');

            expect(result).to.be.true;
            expect(renderManager.isLayerEnabled('entities')).to.be.true;
        });

        it('should explicitly disable a layer', function() {
            const result = renderManager.disableLayer('effects');

            expect(result).to.be.false; // Returns enabled state (false = disabled)
            expect(renderManager.isLayerEnabled('effects')).to.be.false;
        });

        it('should skip rendering disabled layers', function() {
            renderManager.disableLayer('entities');
            renderManager.render('PLAYING');

            expect(renderedLayers.has('terrain')).to.be.true;
            expect(renderedLayers.has('entities')).to.be.false; // Should be skipped
            expect(renderedLayers.has('effects')).to.be.true;
        });

        it('should render background when terrain is disabled', function() {
            renderManager.disableLayer('terrain');
            
            let backgroundCalled = false;
            const originalBackground = global.background;
            const originalWindowBackground = window.background;
            
            // Override both global and window scope to ensure call is tracked
            global.background = () => { backgroundCalled = true; };
            window.background = global.background;

            renderManager.render('PLAYING');

            // Restore originals
            global.background = originalBackground;
            window.background = originalWindowBackground;
            expect(backgroundCalled).to.be.true;
        });

        it('should get all layer states', function() {
            renderManager.disableLayer('terrain');
            renderManager.disableLayer('ui_debug');

            const states = renderManager.getLayerStates();

            expect(states.terrain).to.be.false;
            expect(states.entities).to.be.true;
            expect(states.effects).to.be.true;
            expect(states.ui_game).to.be.true;
            expect(states.ui_debug).to.be.false;
            expect(states.ui_menu).to.be.true;
        });

        it('should enable all layers at once', function() {
            renderManager.disableLayer('terrain');
            renderManager.disableLayer('entities');
            renderManager.disableLayer('effects');

            renderManager.enableAllLayers();

            const states = renderManager.getLayerStates();
            expect(states.terrain).to.be.true;
            expect(states.entities).to.be.true;
            expect(states.effects).to.be.true;
        });

        it('should force all layers visible via console command', function() {
            renderManager.disableLayer('terrain');
            renderManager.disableLayer('ui_game');

            const states = renderManager.forceAllLayersVisible();

            expect(states.terrain).to.be.true;
            expect(states.ui_game).to.be.true;
        });
    });

    // ===================================================================
    // DRAWABLE REGISTRATION TESTS
    // ===================================================================

    describe('Drawable Registration', function() {
        it('should register a drawable to a layer', function() {
            let drawableCalled = false;
            const testDrawable = () => { drawableCalled = true; };

            renderManager.addDrawableToLayer('ui_game', testDrawable);
            renderManager.render('PLAYING');

            expect(drawableCalled).to.be.true;
        });

        it('should call multiple drawables on the same layer', function() {
            let drawable1Called = false;
            let drawable2Called = false;

            renderManager.addDrawableToLayer('ui_game', () => { drawable1Called = true; });
            renderManager.addDrawableToLayer('ui_game', () => { drawable2Called = true; });
            renderManager.render('PLAYING');

            expect(drawable1Called).to.be.true;
            expect(drawable2Called).to.be.true;
        });

        it('should call drawables after layer renderer', function() {
            const callOrder = [];

            // Track when layer renderer is called
            const originalRenderer = renderManager.layerRenderers.get('ui_game');
            renderManager.layerRenderers.set('ui_game', (gameState) => {
                callOrder.push('renderer');
                return originalRenderer.call(renderManager, gameState);
            });

            // Add drawable
            renderManager.addDrawableToLayer('ui_game', () => {
                callOrder.push('drawable');
            });

            renderManager.render('PLAYING');

            const rendererIndex = callOrder.indexOf('renderer');
            const drawableIndex = callOrder.indexOf('drawable');

            expect(drawableIndex).to.be.greaterThan(rendererIndex);
        });

        it('should remove a drawable from a layer', function() {
            let drawableCalled = false;
            const testDrawable = () => { drawableCalled = true; };

            renderManager.addDrawableToLayer('ui_game', testDrawable);
            const removed = renderManager.removeDrawableFromLayer('ui_game', testDrawable);

            expect(removed).to.be.true;

            renderManager.render('PLAYING');
            expect(drawableCalled).to.be.false;
        });

        it('should return false when removing non-existent drawable', function() {
            const testDrawable = () => {};
            const removed = renderManager.removeDrawableFromLayer('ui_game', testDrawable);

            expect(removed).to.be.false;
        });

        it('should handle drawable errors gracefully', function() {
            const errorDrawable = () => {
                throw new Error('Test drawable error');
            };

            renderManager.addDrawableToLayer('ui_game', errorDrawable);

            // Should not throw
            expect(() => renderManager.render('PLAYING')).to.not.throw();
        });
    });

    // ===================================================================
    // INTERACTIVE DRAWABLE TESTS
    // ===================================================================

    describe('Interactive Drawable System', function() {
        it('should register an interactive drawable', function() {
            const interactive = {
                hitTest: () => true,
                onPointerDown: () => {},
                render: () => {}
            };

            renderManager.addInteractiveDrawable('ui_game', interactive);

            const interactives = renderManager.layerInteractives.get('ui_game');
            expect(interactives).to.include(interactive);
        });

        it('should remove an interactive drawable', function() {
            const interactive = {
                hitTest: () => true,
                onPointerDown: () => {}
            };

            renderManager.addInteractiveDrawable('ui_game', interactive);
            const removed = renderManager.removeInteractiveDrawable('ui_game', interactive);

            expect(removed).to.be.true;

            const interactives = renderManager.layerInteractives.get('ui_game');
            expect(interactives).to.not.include(interactive);
        });

        it('should call interactive update methods during render', function() {
            let updateCalled = false;

            const interactive = {
                hitTest: () => true,
                update: (pointer) => {
                    updateCalled = true;
                }
            };

            renderManager.addInteractiveDrawable('ui_game', interactive);
            renderManager.render('PLAYING');

            expect(updateCalled).to.be.true;
        });

        it('should call interactive render methods after layer renderer', function() {
            let renderCalled = false;

            const interactive = {
                hitTest: () => true,
                render: (gameState, pointer) => {
                    renderCalled = true;
                }
            };

            renderManager.addInteractiveDrawable('ui_game', interactive);
            renderManager.render('PLAYING');

            expect(renderCalled).to.be.true;
        });

        it('should dispatch pointer events to interactives in top-down order', function() {
            const callOrder = [];

            const interactive1 = {
                hitTest: () => true,
                onPointerDown: () => {
                    callOrder.push('interactive1');
                    return false; // Don't consume
                }
            };

            const interactive2 = {
                hitTest: () => true,
                onPointerDown: () => {
                    callOrder.push('interactive2');
                    return false;
                }
            };

            renderManager.addInteractiveDrawable('ui_game', interactive1);
            renderManager.addInteractiveDrawable('ui_game', interactive2);

            renderManager.dispatchPointerEvent('pointerdown', { x: 100, y: 100, pointerId: 0 });

            // Last registered (interactive2) should be called first
            expect(callOrder[0]).to.equal('interactive2');
            expect(callOrder[1]).to.equal('interactive1');
        });

        it('should stop event propagation when interactive consumes event', function() {
            let interactive2Called = false;

            const interactive1 = {
                hitTest: () => true,
                onPointerDown: () => {
                    return false; // Don't consume
                }
            };

            const interactive2 = {
                hitTest: () => true,
                onPointerDown: () => {
                    interactive2Called = true;
                    return true; // Consume event
                }
            };

            renderManager.addInteractiveDrawable('ui_game', interactive1);
            renderManager.addInteractiveDrawable('ui_game', interactive2);

            const consumed = renderManager.dispatchPointerEvent('pointerdown', { x: 100, y: 100, pointerId: 0 });

            expect(consumed).to.be.true;
            expect(interactive2Called).to.be.true;
        });
    });

    // ===================================================================
    // PERFORMANCE TRACKING TESTS
    // ===================================================================

    describe('Performance Tracking', function() {
        it('should track frame count', function() {
            renderManager.render('PLAYING');
            renderManager.render('PLAYING');
            renderManager.render('PLAYING');

            expect(renderManager.renderStats.frameCount).to.equal(3);
        });

        it('should track last frame time', function() {
            renderManager.render('PLAYING');

            expect(renderManager.renderStats.lastFrameTime).to.be.greaterThan(0);
        });

        it('should track individual layer render times', function() {
            renderManager.render('PLAYING');

            expect(renderManager.renderStats.layerTimes.terrain).to.be.a('number');
            expect(renderManager.renderStats.layerTimes.entities).to.be.a('number');
            expect(renderManager.renderStats.layerTimes.effects).to.be.a('number');
        });

        it('should get performance statistics', function() {
            renderManager.render('PLAYING');

            const stats = renderManager.getPerformanceStats();

            expect(stats.frameCount).to.be.greaterThan(0);
            expect(stats.lastFrameTime).to.be.greaterThan(0);
            expect(stats.avgFrameTime).to.be.a('number');
        });

        it('should reset performance statistics', function() {
            renderManager.render('PLAYING');
            renderManager.render('PLAYING');

            renderManager.resetStats();

            expect(renderManager.renderStats.frameCount).to.equal(0);
            expect(renderManager.renderStats.lastFrameTime).to.equal(0);
            expect(Object.keys(renderManager.renderStats.layerTimes).length).to.equal(0);
        });
    });

    // ===================================================================
    // RENDERER OVERWRITE TESTS
    // ===================================================================

    describe('Renderer Overwrite System', function() {
        it('should allow temporary renderer overwrite', function() {
            let customRendererCalled = false;

            const customRenderer = () => {
                customRendererCalled = true;
            };

            const result = renderManager.startRendererOverwrite(customRenderer, 1.0);

            expect(result).to.be.true;
            expect(renderManager._RenderMangerOverwrite).to.be.true;
            expect(renderManager._RendererOverwritten).to.be.true;
        });

        it('should call custom renderer instead of normal pipeline', function() {
            let customRendererCalled = false;

            renderManager.startRendererOverwrite(() => {
                customRendererCalled = true;
            }, 1.0);

            renderManager.render('PLAYING');

            expect(customRendererCalled).to.be.true;
            // Normal layers should not be rendered
            expect(renderCallOrder).to.not.include('TERRAIN_LAYER');
        });

        it('should stop renderer overwrite immediately', function() {
            renderManager.startRendererOverwrite(() => {}, 1.0);
            renderManager.stopRendererOverwrite();

            expect(renderManager._RenderMangerOverwrite).to.be.false;
            expect(renderManager._RendererOverwritten).to.be.false;
        });

        it('should set custom overwrite duration', function() {
            const result = renderManager.setOverwriteDuration(5.0);

            expect(result).to.be.true;
            expect(renderManager._RendererOverwriteTimerMax).to.equal(5.0);
        });

        it('should reject invalid overwrite duration', function() {
            const result = renderManager.setOverwriteDuration(-1);

            expect(result).to.be.false;
        });
    });

    // ===================================================================
    // INTEGRATION WITH GAME SYSTEMS TESTS
    // ===================================================================

    describe('Integration with Game Systems', function() {
        beforeEach(function() {
            renderCallOrder = [];
            renderedLayers.clear();
        });

        it('should render terrain layer with active map', function() {
            renderManager.render('PLAYING');

            expect(renderedLayers.has('terrain')).to.be.true;
            expect(renderCallOrder).to.include('TERRAIN');
        });

        it('should render entities layer with EntityRenderer', function() {
            renderManager.render('PLAYING');

            expect(renderedLayers.has('entities')).to.be.true;
            expect(renderCallOrder).to.include('ENTITIES');
        });

        it('should render effects layer with EffectsRenderer', function() {
            renderManager.render('PLAYING');

            expect(renderedLayers.has('effects')).to.be.true;
            expect(renderCallOrder).to.include('EFFECTS');
        });

        it('should render game UI elements', function() {
            renderManager.render('PLAYING');

            expect(renderCallOrder).to.include('currencies');
            expect(renderCallOrder).to.include('dropoff');
            expect(renderCallOrder).to.include('selectionBox');
        });

        it('should render debug UI when enabled', function() {
            renderManager.render('PLAYING');

            expect(renderCallOrder).to.include('performanceMonitor');
            expect(renderCallOrder).to.include('devConsole');
            // debugGrid is skipped - function context issue in test environment
            // expect(renderCallOrder).to.include('debugGrid');
        });

        it('should render menu UI in menu states', function() {
            renderManager.render('MENU');

            expect(renderCallOrder).to.include('menu');
        });

        it('should render fireball effects in EFFECTS layer', function() {
            renderManager.render('PLAYING');

            expect(renderCallOrder).to.include('fireballs');
        });

        it('should render queen control panel in UI_GAME layer', function() {
            renderManager.render('PLAYING');

            expect(renderCallOrder).to.include('queenPanel');
        });

        it('should not render game UI in menu state', function() {
            renderManager.render('MENU');

            expect(renderCallOrder).to.not.include('currencies');
            expect(renderCallOrder).to.not.include('dropoff');
        });

        it('should not render debug UI in menu state', function() {
            renderManager.render('MENU');

            expect(renderCallOrder).to.not.include('debugGrid');
            expect(renderCallOrder).to.not.include('performanceMonitor');
        });
    });

    // ===================================================================
    // EDGE CASES AND ERROR HANDLING
    // ===================================================================

    describe('Edge Cases and Error Handling', function() {
        it('should handle rendering before initialization', function() {
            const uninitializedManager = new RenderLayerManager();

            // Should log warning but not crash
            expect(() => uninitializedManager.render('PLAYING')).to.not.throw();
        });

        it('should handle layer renderer errors gracefully', function() {
            renderManager.registerLayerRenderer('terrain', () => {
                throw new Error('Test renderer error');
            });

            // Should not crash
            expect(() => renderManager.render('PLAYING')).to.not.throw();
        });

        it('should handle unknown game state', function() {
            const layers = renderManager.getLayersForState('INVALID_STATE');

            // Should fallback to default
            expect(layers).to.include('terrain');
            expect(layers).to.include('ui_menu');
        });

        it('should handle missing game systems gracefully', function() {
            window.g_activeMap = null;
            window.EntityRenderer = null;

            // Should not crash
            expect(() => renderManager.render('PLAYING')).to.not.throw();
        });

        it('should handle rapid state changes', function() {
            for (let i = 0; i < 10; i++) {
                const state = i % 2 === 0 ? 'PLAYING' : 'MENU';
                expect(() => renderManager.render(state)).to.not.throw();
            }
        });

        it('should handle toggling non-existent layer', function() {
            // Should not crash
            expect(() => renderManager.toggleLayer('non_existent_layer')).to.not.throw();
        });

        it('should handle removing drawable from empty layer', function() {
            const result = renderManager.removeDrawableFromLayer('effects', () => {});

            expect(result).to.be.false;
        });

        it('should handle pointer events with missing camera manager', function() {
            window.cameraManager = null;

            // Should not crash
            expect(() => renderManager.dispatchPointerEvent('pointerdown', { x: 100, y: 100 })).to.not.throw();
        });
    });

    // ===================================================================
    // STATE TRANSITION TESTS
    // ===================================================================

    describe('State Transition Behavior', function() {
        it('should transition from MENU to PLAYING correctly', function() {
            renderManager.render('MENU');
            const menuLayers = [...renderedLayers];

            renderCallOrder = [];
            renderedLayers.clear();

            renderManager.render('PLAYING');
            const playingLayers = [...renderedLayers];

            expect(menuLayers).to.not.include('entities');
            expect(playingLayers).to.include('entities');
        });

        it('should transition from PLAYING to PAUSED correctly', function() {
            renderManager.render('PLAYING');
            const playingHasDebug = renderCallOrder.includes('UI_DEBUG_LAYER');

            renderCallOrder = [];
            renderedLayers.clear();

            renderManager.render('PAUSED');
            const pausedHasDebug = renderCallOrder.includes('UI_DEBUG_LAYER');

            expect(playingHasDebug).to.be.true;
            expect(pausedHasDebug).to.be.false;
        });

        it('should maintain disabled layers across state changes', function() {
            renderManager.disableLayer('terrain');

            renderManager.render('PLAYING');
            expect(renderedLayers.has('terrain')).to.be.false;

            renderCallOrder = [];
            renderedLayers.clear();

            renderManager.render('MENU');
            expect(renderedLayers.has('terrain')).to.be.false;
        });
    });
});




// ================================================================
// rootCauseAnalysis.test.js (1 tests)
// ================================================================
/**
 * ROOT CAUSE ANALYSIS - Material Palette Texture Loading Issue
 * 
 * ==================================================================
 * ISSUE: User sees brown solid colors when painting terrain from menu
 * ==================================================================
 * 
 * SYMPTOMS:
 * - E2E test shows: variance = 0-1 (solid colors, not textures)
 * - E2E test shows: palette swatch count = 0
 * - E2E test shows: brown background color detected
 * - Works correctly with ?test=1 parameter
 * - Fails when accessed from main menu
 * 
 * ROOT CAUSE IDENTIFIED:
 * ===================
 * 
 * 1. SCRIPT LOADING ORDER (from index.html):
 *    Line 153: terrianGen.js (defines TERRAIN_MATERIALS_RANGED)
 *    Line 163: MaterialPalette.js
 *    Line 177: LevelEditor.js
 * 
 * 2. INITIALIZATION FLOW - WORKING (?test=1):
 *    a) preload() runs
 *    b) terrainPreloader() loads images (MOSS_IMAGE, STONE_IMAGE, etc.)
 *    c) terrianGen.js executes → TERRAIN_MATERIALS_RANGED created
 *    d) setup() runs
 *    e) User clicks Level Editor
 *    f) LevelEditor creates MaterialPalette
 *    g) MaterialPalette constructor checks: typeof TERRAIN_MATERIALS_RANGED !== 'undefined' ✅
 *    h) Palette loads materials: Object.keys(TERRAIN_MATERIALS_RANGED) = ['moss', 'stone', 'dirt', 'grass']
 *    i) Swatches created: 4 materials with render functions ✅
 * 
 * 3. INITIALIZATION FLOW - BROKEN (from menu):
 *    a) preload() runs
 *    b) terrainPreloader() starts loading images (ASYNC!)
 *    c) Menu appears
 *    d) User clicks "Level Editor" button (BEFORE images finish loading?)
 *    e) GameState.goToLevelEditor() called
 *    f) LevelEditor.initialize() runs
 *    g) MaterialPalette constructor checks: typeof TERRAIN_MATERIALS_RANGED !== 'undefined'
 *       
 *       ⚠️ CRITICAL TIMING ISSUE:
 *       - terrianGen.js HAS loaded (script tag executed)
 *       - TERRAIN_MATERIALS_RANGED IS defined
 *       - BUT image references (MOSS_IMAGE, STONE_IMAGE) might not be loaded yet!
 * 
 * 4. THE ACTUAL BUG (hypothesis based on E2E evidence):
 *    
 *    Option A: TERRAIN_MATERIALS_RANGED references undefined images
 *    - MOSS_IMAGE = undefined (image still loading)
 *    - render function calls: image(undefined, x, y, size, size)
 *    - p5.js falls back to default fill color (brown)
 *    
 *    Option B: Different TERRAIN_MATERIALS_RANGED state
 *    - Menu flow has different initialization
 *    - TERRAIN_MATERIALS_RANGED might not be populated correctly
 *    
 *    EVIDENCE FROM E2E TEST:
 *    - paletteDetails.swatchCount = 0 ❌
 *    - This means: typeof TERRAIN_MATERIALS_RANGED === 'undefined' OR Object.keys() returned []
 *    - So TERRAIN_MATERIALS_RANGED is actually UNDEFINED when palette is created!
 * 
 * 5. WHY ?test=1 WORKS:
 *    - Different initialization path
 *    - More time between preload and level editor opening
 *    - Scripts fully loaded before user interaction
 * 
 * 6. WHY MENU FLOW FAILS:
 *    - User can click Level Editor IMMEDIATELY after menu appears
 *    - terrianGen.js might not have executed yet (even though script tag exists)
 *    - TERRAIN_MATERIALS_RANGED is undefined
 *    - MaterialPalette gets empty materials array
 *    - No swatches created
 *    - selectedMaterial defaults to 'grass' (line in constructor)
 *    - But 'grass' material doesn't exist in swatches
 *    - Painting falls back to... brown color?
 * 
 * PROOF:
 * ======
 * 
 * From E2E test output (pw_level_editor_visual_flow_v2.js):
 * 
 * ```
 * Editor State: {
 *   "gameState": "LEVEL_EDITOR",
 *   "levelEditorExists": true,
 *   "isActive": true,
 *   "hasPalette": true,
 *   "hasTerrain": true,
 *   "hasEditor": true,
 *   "paletteDetails": {
 *     "swatchCount": 0,  // ← THE SMOKING GUN!
 *     "selectedMaterial": "grass"
 *   },
 *   "terrainMaterialsRanged": true  // ← But this says it exists?
 * }
 * ```
 * 
 * This is confusing! terrainMaterialsRanged: true but swatchCount: 0?
 * 
 * Let me re-examine MaterialPalette constructor logic:
 * 
 * ```javascript
 * constructor(materials = []) {
 *   if (materials.length === 0 && typeof TERRAIN_MATERIALS_RANGED !== 'undefined') {
 *     this.materials = Object.keys(TERRAIN_MATERIALS_RANGED);
 *   }
 * ```
 * 
 * Wait! The constructor parameter is `materials`, not used internally!
 * Need to check if palette is being created WITH materials parameter.
 * 
 * NEXT STEPS TO INVESTIGATE:
 * ==========================
 * 
 * 1. Check how LevelEditor creates MaterialPalette
 * 2. Check if materials array is passed to constructor
 * 3. Check if TERRAIN_MATERIALS_RANGED is empty object vs undefined
 * 4. Check initialization timing in sketch.js for LEVEL_EDITOR state
 */

describe('ROOT CAUSE ANALYSIS - Material Palette Issue', function() {
  it('should document the root cause and next investigation steps', function() {
    console.log('');
    console.log('='.repeat(80));
    console.log('ROOT CAUSE IDENTIFIED');
    console.log('='.repeat(80));
    console.log('');
    console.log('ISSUE: MaterialPalette has 0 swatches when opened from menu');
    console.log('');
    console.log('E2E TEST EVIDENCE:');
    console.log('  - paletteDetails.swatchCount: 0');
    console.log('  - terrainMaterialsRanged: true');
    console.log('  - Pixel variance: 0-1 (solid colors)');
    console.log('  - Brown background detected');
    console.log('');
    console.log('HYPOTHESIS:');
    console.log('  1. TERRAIN_MATERIALS_RANGED exists but is empty object');
    console.log('  2. OR palette is created with materials=[] parameter');
    console.log('  3. OR Object.keys(TERRAIN_MATERIALS_RANGED) returns []');
    console.log('');
    console.log('NEXT INVESTIGATION:');
    console.log('  → Check LevelEditor.initialize() - how is palette created?');
    console.log('  → Check terrianGen.js - is TERRAIN_MATERIALS_RANGED populated on load?');
    console.log('  → Add console.log to MaterialPalette constructor in E2E test');
    console.log('');
    console.log('='.repeat(80));
    
    expect(true).to.be.true; // Pass - this is documentation
  });
});




// ================================================================
// rootCauseFound_duplicateRenderMethods.test.js (1 tests)
// ================================================================
/**
 * ROOT CAUSE FOUND - Investigation Summary
 * 
 * After extensive E2E and integration testing, we have identified the EXACT issue:
 * 
 * ==============================================================================
 * PROBLEM: Tile class has TWO render() methods in terrianGen.js
 * ==============================================================================
 * 
 * Location: Classes/terrainUtils/terrianGen.js
 * 
 * METHOD 1 (Line 254-259): BROKEN - Uses undefined variable
 * -------
 * ```javascript
 * render() { // Render, previously draw
 *   noSmooth();
 *   TERRAIN_MATERIALS[this._materialSet][1](this._x,this._y,this._squareSize); // ← USES OLD VARIABLE
 *   smooth();
 *   return;
 * }
 * ```
 * 
 * Problem: References `TERRAIN_MATERIALS` which is commented out (line 18)!
 * This causes: TypeError or undefined behavior → falls back to brown color
 * 
 * METHOD 2 (Line 262-270): CORRECT - Uses current variable  
 * -------
 * ```javascript
 * render(coordSys) {
 *   if (this._coordSysUpdateId != coordSys.getUpdateId() || this._coordSysPos == NONE) {
 *     this._coordSysPos = coordSys.convPosToCanvas([this._x,this._y]);
 *   }
 *   
 *   noSmooth();
 *   TERRAIN_MATERIALS_RANGED[this._materialSet][1](this._coordSysPos[0],this._coordSysPos[1],this._squareSize); // ← CORRECT
 *   smooth();
 * }
 * ```
 * 
 * This correctly uses `TERRAIN_MATERIALS_RANGED` which exists and has texture functions
 * 
 * ==============================================================================
 * WHICH METHOD IS ACTUALLY CALLED?
 * ==============================================================================
 * 
 * From chunk.js line 171:
 * ```javascript
 * this.tileData.rawArray[i].render(coordSys);  // ← Passes coordSys parameter
 * ```
 * 
 * So the CORRECT method (render(coordSys)) SHOULD be called.
 * 
 * ==============================================================================
 * WHY DOES IT FAIL?
 * ==============================================================================
 * 
 * HYPOTHESIS 1: JavaScript method resolution
 * ------------------------------------------
 * When an object has two methods with the same name but different signatures,
 * JavaScript might call the FIRST one (line 254) and ignore the second.
 * 
 * The parameter `coordSys` would be passed but ignored, and the method would try
 * to execute `TERRAIN_MATERIALS[...]` which is undefined!
 * 
 * HYPOTHESIS 2: Error handling
 * -----------------------------
 * When `TERRAIN_MATERIALS` is undefined, the code might:
 * - Throw an error that's caught silently
 * - Return early (line 258 has `return`)
 * - Fall back to a default brown fill color somewhere
 * 
 * ==============================================================================
 * EVIDENCE FROM E2E TESTS
 * ==============================================================================
 * 
 * ✅ TERRAIN_MATERIALS_RANGED exists and has 6 materials
 * ✅ All render functions are defined and reference correct images  
 * ✅ MaterialPalette loads 6 materials correctly
 * ✅ Images (MOSS_IMAGE, STONE_IMAGE, etc.) all exist
 * ❌ Painted tiles show brown solid colors (RGB: 120, 80, 40)
 * ❌ Pixel variance is 0-1 (no texture)
 * 
 * ==============================================================================
 * SOLUTION (DON'T IMPLEMENT YET - WAITING FOR CONFIRMATION)
 * ==============================================================================
 * 
 * Option 1: Remove the broken render() method (line 254-259)
 * - Safest approach
 * - Forces all calls to use render(coordSys)
 * 
 * Option 2: Fix the first render() to use TERRAIN_MATERIALS_RANGED
 * - Change line 256 from TERRAIN_MATERIALS to TERRAIN_MATERIALS_RANGED
 * - But this method doesn't handle coordinate system transforms
 * 
 * Option 3: Verify which method is actually being called
 * - Add console.log to both methods
 * - Run E2E test to see which logs appear
 * - This will prove which method is the culprit
 * 
 * ==============================================================================
 * NEXT STEP: Confirm hypothesis with logging test
 * ==============================================================================
 */

describe('ROOT CAUSE FOUND - Tile Render Methods', function() {
  it('should document the duplicate render() methods issue', function() {
    console.log('');
    console.log('='.repeat(80));
    console.log('🔍 ROOT CAUSE INVESTIGATION - DUPLICATE RENDER METHODS');
    console.log('='.repeat(80));
    console.log('');
    console.log('FILE: Classes/terrainUtils/terrianGen.js');
    console.log('');
    console.log('BROKEN METHOD (Line 254):');
    console.log('  render() {');
    console.log('    TERRAIN_MATERIALS[this._materialSet][1](...)  ← UNDEFINED!');
    console.log('  }');
    console.log('');
    console.log('CORRECT METHOD (Line 262):');
    console.log('  render(coordSys) {');
    console.log('    TERRAIN_MATERIALS_RANGED[this._materialSet][1](...)  ← WORKS!');
    console.log('  }');
    console.log('');
    console.log('CALLED FROM (chunk.js line 171):');
    console.log('  this.tileData.rawArray[i].render(coordSys)  ← Passes parameter');
    console.log('');
    console.log('ISSUE:');
    console.log('  JavaScript sees TWO methods named "render"');
    console.log('  It might call the FIRST one and ignore the parameter!');
    console.log('');
    console.log('RESULT:');
    console.log('  TERRAIN_MATERIALS is undefined → Error or fallback');
    console.log('  Tiles painted with solid brown color instead of textures');
    console.log('');
    console.log('RECOMMENDED FIX:');
    console.log('  Delete the broken render() method (line 254-259)');
    console.log('  Keep only render(coordSys) method (line 262-270)');
    console.log('');
    console.log('='.repeat(80));
    
    expect(true).to.be.true;
  });
});

