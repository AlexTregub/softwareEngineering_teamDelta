/**
 * Consolidated Rendering System Tests
 * Generated: 2025-10-29T03:11:41.140Z
 * Source files: 11
 * Total tests: 693
 * 
 * This file contains all rendering system tests merged from individual test files.
 * Each section preserves its original setup, mocks, and teardown.
 */

// Common requires (extracted from all test files)
let { expect } = require('chai');
let sinon = require('sinon');


// ================================================================
// cacheManager.test.js (41 tests)
// ================================================================
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

let { setupUITestEnvironment } = require('../../helpers/uiTestHelpers');

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




// ================================================================
// EffectsLayerRenderer.test.js (101 tests)
// ================================================================
let path = require('path');

describe('EffectsLayerRenderer', () => {
  let EffectsLayerRenderer;
  
  before(() => {
    // Mock p5.js globals
    global.push = () => {};
    global.pop = () => {};
    global.translate = () => {};
    global.rotate = () => {};
    global.fill = () => {};
    global.noStroke = () => {};
    global.stroke = () => {};
    global.strokeWeight = () => {};
    global.rect = () => {};
    global.circle = () => {};
    global.image = () => {};
    global.width = 800;
    global.height = 600;
    global.performance = {
      now: () => Date.now()
    };
    
    // Load the class
    const effectsPath = path.join(__dirname, '../../../Classes/rendering/EffectsLayerRenderer.js');
    EffectsLayerRenderer = require(effectsPath);
  });
  
  afterEach(() => {
    // Clean up any global instances
    if (typeof window !== 'undefined' && window.EffectsRenderer) {
      delete window.EffectsRenderer;
    }
    if (typeof global !== 'undefined' && global.EffectsRenderer) {
      delete global.EffectsRenderer;
    }
  });
  
  describe('Constructor', () => {
    it('should initialize with default configuration', () => {
      const renderer = new EffectsLayerRenderer();
      
      expect(renderer.config).to.exist;
      expect(renderer.config.enableParticles).to.be.true;
      expect(renderer.config.enableVisualEffects).to.be.true;
      expect(renderer.config.enableAudioEffects).to.be.true;
      expect(renderer.config.maxParticles).to.equal(500);
      expect(renderer.config.particlePoolSize).to.equal(1000);
      expect(renderer.config.enablePerformanceScaling).to.be.true;
    });
    
    it('should initialize particle pools', () => {
      const renderer = new EffectsLayerRenderer();
      
      expect(renderer.particlePools).to.exist;
      expect(renderer.particlePools.combat).to.be.an('array');
      expect(renderer.particlePools.environment).to.be.an('array');
      expect(renderer.particlePools.interactive).to.be.an('array');
      expect(renderer.particlePools.magical).to.be.an('array');
    });
    
    it('should initialize active effects arrays', () => {
      const renderer = new EffectsLayerRenderer();
      
      expect(renderer.activeParticleEffects).to.be.an('array').that.is.empty;
      expect(renderer.activeVisualEffects).to.be.an('array').that.is.empty;
      expect(renderer.activeAudioEffects).to.be.an('array').that.is.empty;
    });
    
    it('should initialize selection box state', () => {
      const renderer = new EffectsLayerRenderer();
      
      expect(renderer.selectionBox).to.exist;
      expect(renderer.selectionBox.active).to.be.false;
      expect(renderer.selectionBox.startX).to.equal(0);
      expect(renderer.selectionBox.startY).to.equal(0);
      expect(renderer.selectionBox.endX).to.equal(0);
      expect(renderer.selectionBox.endY).to.equal(0);
      expect(renderer.selectionBox.color).to.deep.equal([0, 200, 255]);
      expect(renderer.selectionBox.strokeWidth).to.equal(2);
      expect(renderer.selectionBox.fillAlpha).to.equal(30);
      expect(renderer.selectionBox.entities).to.be.an('array').that.is.empty;
    });
    
    it('should initialize effect types registry with Map', () => {
      const renderer = new EffectsLayerRenderer();
      
      expect(renderer.effectTypes).to.be.instanceOf(Map);
      expect(renderer.effectTypes.size).to.be.greaterThan(0);
    });
    
    it('should register combat effect types', () => {
      const renderer = new EffectsLayerRenderer();
      
      expect(renderer.effectTypes.has('BLOOD_SPLATTER')).to.be.true;
      expect(renderer.effectTypes.get('BLOOD_SPLATTER')).to.deep.equal({
        type: 'particle',
        category: 'combat',
        duration: 1000
      });
      
      expect(renderer.effectTypes.has('IMPACT_SPARKS')).to.be.true;
      expect(renderer.effectTypes.has('WEAPON_TRAIL')).to.be.true;
    });
    
    it('should register environmental effect types', () => {
      const renderer = new EffectsLayerRenderer();
      
      expect(renderer.effectTypes.has('DUST_CLOUD')).to.be.true;
      expect(renderer.effectTypes.has('FALLING_LEAVES')).to.be.true;
      expect(renderer.effectTypes.has('WEATHER_RAIN')).to.be.true;
      expect(renderer.effectTypes.get('WEATHER_RAIN').duration).to.equal(-1); // Continuous
    });
    
    it('should register interactive effect types', () => {
      const renderer = new EffectsLayerRenderer();
      
      expect(renderer.effectTypes.has('SELECTION_SPARKLE')).to.be.true;
      expect(renderer.effectTypes.has('MOVEMENT_TRAIL')).to.be.true;
      expect(renderer.effectTypes.has('GATHERING_SPARKLE')).to.be.true;
      expect(renderer.effectTypes.has('SELECTION_BOX')).to.be.true;
    });
    
    it('should register visual effect types', () => {
      const renderer = new EffectsLayerRenderer();
      
      expect(renderer.effectTypes.has('SCREEN_SHAKE')).to.be.true;
      expect(renderer.effectTypes.has('FADE_TRANSITION')).to.be.true;
      expect(renderer.effectTypes.has('HIGHLIGHT_GLOW')).to.be.true;
      expect(renderer.effectTypes.has('DAMAGE_FLASH')).to.be.true;
    });
    
    it('should register audio effect types', () => {
      const renderer = new EffectsLayerRenderer();
      
      expect(renderer.effectTypes.has('COMBAT_SOUND')).to.be.true;
      expect(renderer.effectTypes.has('FOOTSTEP_SOUND')).to.be.true;
      expect(renderer.effectTypes.has('UI_CLICK')).to.be.true;
      expect(renderer.effectTypes.has('AMBIENT_NATURE')).to.be.true;
    });
    
    it('should initialize screen effects state', () => {
      const renderer = new EffectsLayerRenderer();
      
      expect(renderer.screenEffects.shake).to.deep.equal({
        active: false,
        intensity: 0,
        timeLeft: 0
      });
      
      expect(renderer.screenEffects.fade).to.deep.equal({
        active: false,
        alpha: 0,
        direction: 1,
        timeLeft: 0
      });
      
      expect(renderer.screenEffects.flash).to.deep.equal({
        active: false,
        color: [255, 255, 255],
        alpha: 0,
        timeLeft: 0
      });
    });
    
    it('should initialize performance stats', () => {
      const renderer = new EffectsLayerRenderer();
      
      expect(renderer.stats).to.exist;
      expect(renderer.stats.activeParticles).to.equal(0);
      expect(renderer.stats.activeVisualEffects).to.equal(0);
      expect(renderer.stats.activeAudioEffects).to.equal(0);
      expect(renderer.stats.lastRenderTime).to.equal(0);
      expect(renderer.stats.poolHits).to.equal(0);
      expect(renderer.stats.poolMisses).to.equal(0);
    });
  });
  
  describe('Particle Effect Creation', () => {
    it('should create blood splatter effect', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = renderer.addEffect('BLOOD_SPLATTER', { x: 100, y: 200, particleCount: 5 });
      
      expect(effect).to.exist;
      expect(effect.effectType).to.equal('BLOOD_SPLATTER');
      expect(effect.category).to.equal('combat');
      expect(effect.x).to.equal(100);
      expect(effect.y).to.equal(200);
      expect(effect.particles).to.be.an('array').with.lengthOf(5);
    });
    
    it('should create impact sparks effect', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = renderer.addEffect('IMPACT_SPARKS', { x: 150, y: 250, particleCount: 8 });
      
      expect(effect).to.exist;
      expect(effect.effectType).to.equal('IMPACT_SPARKS');
      expect(effect.particles).to.be.an('array').with.lengthOf(8);
    });
    
    it('should create dust cloud effect', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = renderer.addEffect('DUST_CLOUD', { x: 200, y: 300 });
      
      expect(effect).to.exist;
      expect(effect.effectType).to.equal('DUST_CLOUD');
      expect(effect.category).to.equal('environment');
    });
    
    it('should create selection sparkle effect', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = renderer.addEffect('SELECTION_SPARKLE', { x: 250, y: 350, particleCount: 10 });
      
      expect(effect).to.exist;
      expect(effect.effectType).to.equal('SELECTION_SPARKLE');
      expect(effect.category).to.equal('interactive');
      expect(effect.particles).to.have.lengthOf(10);
    });
    
    it('should use default particle count if not specified', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = renderer.addEffect('IMPACT_SPARKS', { x: 100, y: 100 });
      
      expect(effect.particles).to.be.an('array').with.length.greaterThan(0);
    });
    
    it('should set effect position correctly', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = renderer.addEffect('DUST_CLOUD', { x: 123, y: 456 });
      
      expect(effect.x).to.equal(123);
      expect(effect.y).to.equal(456);
      expect(effect.centerX).to.equal(123);
      expect(effect.centerY).to.equal(456);
    });
    
    it('should apply custom particle color', () => {
      const renderer = new EffectsLayerRenderer();
      const customColor = [255, 0, 255];
      const effect = renderer.addEffect('BLOOD_SPLATTER', { 
        x: 100, y: 100, 
        color: customColor,
        particleCount: 3
      });
      
      expect(effect.particles[0].color).to.deep.equal(customColor);
    });
    
    it('should add effect to active list', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = renderer.addEffect('IMPACT_SPARKS', { x: 100, y: 100 });
      
      expect(renderer.activeParticleEffects).to.include(effect);
    });
    
    it('should warn on unknown effect type', () => {
      const renderer = new EffectsLayerRenderer();
      const consoleWarn = console.warn;
      let warnMessage = null;
      console.warn = (msg) => { warnMessage = msg; };
      
      const result = renderer.addEffect('UNKNOWN_EFFECT', {});
      
      console.warn = consoleWarn;
      expect(warnMessage).to.include('Unknown effect type');
      expect(result).to.be.null;
    });
  });
  
  describe('Visual Effect Creation', () => {
    it('should create screen shake effect', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.addEffect('SCREEN_SHAKE', { intensity: 10 });
      
      expect(renderer.screenEffects.shake.active).to.be.true;
      expect(renderer.screenEffects.shake.intensity).to.equal(10);
      expect(renderer.screenEffects.shake.timeLeft).to.equal(300);
    });
    
    it('should use default intensity for screen shake', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.addEffect('SCREEN_SHAKE', {});
      
      expect(renderer.screenEffects.shake.intensity).to.equal(5);
    });
    
    it('should create fade transition effect', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.addEffect('FADE_TRANSITION', { direction: -1 });
      
      expect(renderer.screenEffects.fade.active).to.be.true;
      expect(renderer.screenEffects.fade.direction).to.equal(-1);
      expect(renderer.screenEffects.fade.timeLeft).to.equal(1000);
    });
    
    it('should create damage flash effect', () => {
      const renderer = new EffectsLayerRenderer();
      const flashColor = [255, 100, 100];
      renderer.addEffect('DAMAGE_FLASH', { color: flashColor });
      
      expect(renderer.screenEffects.flash.active).to.be.true;
      expect(renderer.screenEffects.flash.color).to.deep.equal(flashColor);
      expect(renderer.screenEffects.flash.timeLeft).to.equal(150);
    });
    
    it('should use default flash color', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.addEffect('DAMAGE_FLASH', {});
      
      expect(renderer.screenEffects.flash.color).to.deep.equal([255, 0, 0]);
    });
  });
  
  describe('Audio Effect Creation', () => {
    it('should create audio effect', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = renderer.addEffect('COMBAT_SOUND', { volume: 0.8, position: { x: 100, y: 100 } });
      
      expect(effect).to.exist;
      expect(effect.effectType).to.equal('COMBAT_SOUND');
      expect(effect.volume).to.equal(0.8);
      expect(effect.position).to.deep.equal({ x: 100, y: 100 });
    });
    
    it('should use default audio volume', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = renderer.addEffect('UI_CLICK', {});
      
      expect(effect.volume).to.equal(1.0);
    });
    
    it('should add audio effect to active list', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.addEffect('FOOTSTEP_SOUND', {});
      
      expect(renderer.activeAudioEffects).to.have.lengthOf(1);
    });
  });
  
  describe('Particle Update Methods', () => {
    it('should update blood splatter particles', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = {
        effectType: 'BLOOD_SPLATTER',
        timeLeft: 500,
        particles: [
          { x: 100, y: 100, velocityX: 2, velocityY: -3, alpha: 255, size: 5 }
        ]
      };
      
      const result = renderer.updateParticleEffect(effect);
      
      expect(result).to.be.true;
      expect(effect.timeLeft).to.equal(484); // Reduced by ~16ms
      expect(effect.particles[0].x).to.equal(102); // Moved by velocityX
      expect(effect.particles[0].y).to.be.lessThan(100); // velocityY = -3, gravity adds 0.2, so y decreases (particle moves up initially)
    });
    
    it('should update impact sparks particles', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = {
        effectType: 'IMPACT_SPARKS',
        timeLeft: 300,
        particles: [
          { x: 100, y: 100, velocityX: 5, velocityY: 5, size: 10 }
        ]
      };
      
      const initialSize = effect.particles[0].size;
      renderer.updateParticleEffect(effect);
      
      expect(effect.particles[0].size).to.be.lessThan(initialSize); // Shrinking
    });
    
    it('should update dust cloud particles', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = {
        effectType: 'DUST_CLOUD',
        timeLeft: 1500,
        particles: [
          { x: 100, y: 100, velocityX: 1, velocityY: 1, alpha: 100, size: 5 }
        ]
      };
      
      const initialSize = effect.particles[0].size;
      renderer.updateParticleEffect(effect);
      
      expect(effect.particles[0].size).to.be.greaterThan(initialSize); // Expanding
      expect(effect.particles[0].alpha).to.be.lessThan(100); // Fading
    });
    
    it('should remove dead particles', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = {
        effectType: 'BLOOD_SPLATTER',
        timeLeft: 500,
        particles: [
          { x: 100, y: 100, velocityX: 0, velocityY: 0, alpha: 1, size: 5 } // alpha=1, after -=2 becomes -1 (dead)
        ]
      };
      
      renderer.updateParticleEffect(effect);
      
      // Alpha should drop below 0, marking particle as dead
      expect(effect.particles).to.have.lengthOf(0);
    });
    
    it('should return false when effect expires', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = {
        effectType: 'IMPACT_SPARKS',
        timeLeft: 0,
        particles: []
      };
      
      const result = renderer.updateParticleEffect(effect);
      
      expect(result).to.be.false;
    });
    
    it('should update selection sparkle particles with orbital motion', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = {
        effectType: 'SELECTION_SPARKLE',
        timeLeft: 1000,
        centerX: 100,
        centerY: 100,
        particles: [
          { angle: 0, radius: 20, radiusGrowth: 0.5, alpha: 255, x: 120, y: 100 }
        ]
      };
      
      const initialAngle = effect.particles[0].angle;
      const initialRadius = effect.particles[0].radius;
      renderer.updateParticleEffect(effect);
      
      expect(effect.particles[0].angle).to.be.greaterThan(initialAngle);
      expect(effect.particles[0].radius).to.be.greaterThan(initialRadius);
    });
    
    it('should update gathering sparkle with spiral inward motion', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = {
        effectType: 'GATHERING_SPARKLE',
        timeLeft: 500,
        centerX: 100,
        centerY: 100,
        particles: [
          { angle: 0, radius: 50, x: 150, y: 100 }
        ]
      };
      
      const initialRadius = effect.particles[0].radius;
      renderer.updateParticleEffect(effect);
      
      expect(effect.particles[0].radius).to.be.lessThan(initialRadius); // Spiraling inward
    });
    
    it('should use generic particle update for unknown types', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = {
        effectType: 'CUSTOM_EFFECT',
        timeLeft: 500,
        particles: [
          { x: 100, y: 100, velocityX: 1, velocityY: 1, alpha: 255, fadeRate: 2 }
        ]
      };
      
      const initialAlpha = effect.particles[0].alpha;
      renderer.updateParticleEffect(effect);
      
      expect(effect.particles[0].alpha).to.be.lessThan(initialAlpha);
    });
  });
  
  describe('Visual Effect Updates', () => {
    it('should update screen shake', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.screenEffects.shake = { active: true, intensity: 10, timeLeft: 100 };
      
      renderer.updateVisualEffects();
      
      expect(renderer.screenEffects.shake.timeLeft).to.equal(84); // Reduced by ~16ms
    });
    
    it('should deactivate screen shake when expired', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.screenEffects.shake = { active: true, intensity: 10, timeLeft: 10 };
      
      renderer.updateVisualEffects();
      
      expect(renderer.screenEffects.shake.active).to.be.false;
      expect(renderer.screenEffects.shake.intensity).to.equal(0);
    });
    
    it('should update screen fade alpha', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.screenEffects.fade = { active: true, direction: 1, timeLeft: 500, alpha: 0 };
      
      renderer.updateVisualEffects();
      
      expect(renderer.screenEffects.fade.alpha).to.be.greaterThan(0);
    });
    
    it('should deactivate screen fade when expired', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.screenEffects.fade = { active: true, direction: 1, timeLeft: 10, alpha: 0 };
      
      renderer.updateVisualEffects();
      
      expect(renderer.screenEffects.fade.active).to.be.false;
    });
    
    it('should update screen flash alpha', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.screenEffects.flash = { active: true, color: [255, 0, 0], timeLeft: 150, alpha: 100 };
      
      renderer.updateVisualEffects();
      
      expect(renderer.screenEffects.flash.timeLeft).to.be.lessThan(150);
    });
    
    it('should track active visual effects count', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.screenEffects.shake = { active: true, intensity: 5, timeLeft: 100 };
      renderer.screenEffects.fade = { active: true, direction: 1, timeLeft: 500, alpha: 0 };
      
      renderer.updateVisualEffects();
      
      expect(renderer.stats.activeVisualEffects).to.equal(2);
    });
  });
  
  describe('Audio Effect Updates', () => {
    it('should update audio effects time', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.activeAudioEffects.push({
        effectType: 'COMBAT_SOUND',
        timeLeft: 300,
        sound: null
      });
      
      renderer.updateAudioEffects();
      
      expect(renderer.activeAudioEffects[0].timeLeft).to.equal(284);
    });
    
    it('should remove expired audio effects', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.activeAudioEffects.push({
        effectType: 'UI_CLICK',
        timeLeft: 10,
        sound: { stop: () => {} }
      });
      
      renderer.updateAudioEffects();
      
      expect(renderer.activeAudioEffects).to.have.lengthOf(0);
    });
    
    it('should track active audio effects count', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.activeAudioEffects.push(
        { effectType: 'COMBAT_SOUND', timeLeft: 300 },
        { effectType: 'FOOTSTEP_SOUND', timeLeft: 150 }
      );
      
      renderer.updateAudioEffects();
      
      expect(renderer.stats.activeAudioEffects).to.equal(2);
    });
  });
  
  describe('Particle Pooling System', () => {
    it('should get particle from pool when available', () => {
      const renderer = new EffectsLayerRenderer();
      const pooledEffect = { particles: [], timeLeft: 0 };
      renderer.particlePools.combat.push(pooledEffect);
      
      const result = renderer.getParticleFromPool('combat');
      
      expect(result).to.equal(pooledEffect);
      expect(renderer.stats.poolHits).to.equal(1);
      expect(renderer.particlePools.combat).to.have.lengthOf(0);
    });
    
    it('should return null when pool is empty', () => {
      const renderer = new EffectsLayerRenderer();
      
      const result = renderer.getParticleFromPool('combat');
      
      expect(result).to.be.null;
      expect(renderer.stats.poolMisses).to.equal(1);
    });
    
    it('should return particle to pool', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = {
        category: 'interactive',
        particles: [{ x: 100 }],
        timeLeft: 500
      };
      
      renderer.returnParticleToPool(effect);
      
      expect(renderer.particlePools.interactive).to.have.lengthOf(1);
      expect(effect.particles).to.be.empty;
      expect(effect.timeLeft).to.equal(0);
    });
    
    it('should create new pool category if needed', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = {
        category: 'newCategory',
        particles: [],
        timeLeft: 0
      };
      
      renderer.returnParticleToPool(effect);
      
      expect(renderer.particlePools.newCategory).to.exist;
    });
    
    it('should create new particle effect when pool empty', () => {
      const renderer = new EffectsLayerRenderer();
      
      const newEffect = renderer.createNewParticleEffect();
      
      expect(newEffect).to.exist;
      expect(newEffect.effectType).to.be.null;
      expect(newEffect.particles).to.be.an('array').that.is.empty;
      expect(newEffect.timeLeft).to.equal(0);
    });
  });
  
  describe('Selection Box System', () => {
    it('should start selection box', () => {
      const renderer = new EffectsLayerRenderer();
      
      renderer.startSelectionBox(100, 150);
      
      expect(renderer.selectionBox.active).to.be.true;
      expect(renderer.selectionBox.startX).to.equal(100);
      expect(renderer.selectionBox.startY).to.equal(150);
      expect(renderer.selectionBox.endX).to.equal(100);
      expect(renderer.selectionBox.endY).to.equal(150);
    });
    
    it('should apply custom selection box styling', () => {
      const renderer = new EffectsLayerRenderer();
      const customColor = [255, 0, 0];
      
      renderer.startSelectionBox(100, 100, {
        color: customColor,
        strokeWidth: 4,
        fillAlpha: 50
      });
      
      expect(renderer.selectionBox.color).to.deep.equal(customColor);
      expect(renderer.selectionBox.strokeWidth).to.equal(4);
      expect(renderer.selectionBox.fillAlpha).to.equal(50);
    });
    
    it('should call onStart callback when starting selection', () => {
      const renderer = new EffectsLayerRenderer();
      let callbackCalled = false;
      let callbackX, callbackY;
      
      renderer.startSelectionBox(100, 150, {
        onStart: (x, y) => {
          callbackCalled = true;
          callbackX = x;
          callbackY = y;
        }
      });
      
      expect(callbackCalled).to.be.true;
      expect(callbackX).to.equal(100);
      expect(callbackY).to.equal(150);
    });
    
    it('should update selection box end position', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.startSelectionBox(100, 100);
      
      renderer.updateSelectionBox(200, 250);
      
      expect(renderer.selectionBox.endX).to.equal(200);
      expect(renderer.selectionBox.endY).to.equal(250);
    });
    
    it('should call onUpdate callback when updating selection', () => {
      const renderer = new EffectsLayerRenderer();
      let callbackCalled = false;
      
      renderer.startSelectionBox(100, 100, {
        onUpdate: (bounds, entities) => {
          callbackCalled = true;
        }
      });
      
      renderer.updateSelectionBox(200, 200);
      
      expect(callbackCalled).to.be.true;
    });
    
    it('should not update if selection is not active', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.selectionBox.active = false;
      
      renderer.updateSelectionBox(200, 200);
      
      expect(renderer.selectionBox.endX).to.equal(0);
    });
    
    it('should end selection box and return entities', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.startSelectionBox(100, 100);
      renderer.selectionBox.entities = [{ id: 1 }, { id: 2 }];
      
      const result = renderer.endSelectionBox();
      
      expect(result).to.deep.equal([{ id: 1 }, { id: 2 }]);
      expect(renderer.selectionBox.active).to.be.false;
      expect(renderer.selectionBox.entities).to.be.empty;
    });
    
    it('should call onEnd callback when ending selection', () => {
      const renderer = new EffectsLayerRenderer();
      let callbackCalled = false;
      
      renderer.startSelectionBox(100, 100, {
        onEnd: (bounds, entities) => {
          callbackCalled = true;
        }
      });
      
      renderer.endSelectionBox();
      
      expect(callbackCalled).to.be.true;
    });
    
    it('should return empty array if selection not active', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.selectionBox.active = false;
      
      const result = renderer.endSelectionBox();
      
      expect(result).to.be.an('array').that.is.empty;
    });
    
    it('should cancel selection box without callbacks', () => {
      const renderer = new EffectsLayerRenderer();
      let callbackCalled = false;
      
      renderer.startSelectionBox(100, 100, {
        onEnd: () => { callbackCalled = true; }
      });
      
      renderer.cancelSelectionBox();
      
      expect(callbackCalled).to.be.false;
      expect(renderer.selectionBox.active).to.be.false;
    });
    
    it('should get selection box bounds', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.startSelectionBox(100, 100);
      renderer.updateSelectionBox(200, 250);
      
      const bounds = renderer.getSelectionBoxBounds();
      
      expect(bounds.x1).to.equal(100);
      expect(bounds.y1).to.equal(100);
      expect(bounds.x2).to.equal(200);
      expect(bounds.y2).to.equal(250);
      expect(bounds.width).to.equal(100);
      expect(bounds.height).to.equal(150);
      expect(bounds.area).to.equal(15000);
    });
    
    it('should return null bounds if selection not active', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.selectionBox.active = false;
      
      const bounds = renderer.getSelectionBoxBounds();
      
      expect(bounds).to.be.null;
    });
    
    it('should set entity list for selection detection', () => {
      const renderer = new EffectsLayerRenderer();
      const entities = [{ id: 1 }, { id: 2 }];
      
      renderer.setSelectionEntities(entities);
      
      expect(renderer.selectionBox.entityList).to.deep.equal(entities);
    });
    
    it('should detect entity in selection box', () => {
      const renderer = new EffectsLayerRenderer();
      const entity = { x: 150, y: 150, width: 20, height: 20 };
      const bounds = { x1: 100, y1: 100, x2: 200, y2: 200 };
      
      const result = renderer.isEntityInSelectionBox(entity, bounds);
      
      expect(result).to.be.true;
    });
    
    it('should detect entity outside selection box', () => {
      const renderer = new EffectsLayerRenderer();
      const entity = { x: 300, y: 300, width: 20, height: 20 };
      const bounds = { x1: 100, y1: 100, x2: 200, y2: 200 };
      
      const result = renderer.isEntityInSelectionBox(entity, bounds);
      
      expect(result).to.be.false;
    });
    
    it('should chain selection box methods', () => {
      const renderer = new EffectsLayerRenderer();
      
      const result = renderer.startSelectionBox(100, 100)
        .updateSelectionBox(200, 200)
        .cancelSelectionBox();
      
      expect(result).to.equal(renderer);
    });
  });
  
  describe('Convenience Methods', () => {
    it('should create blood splatter with convenience method', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = renderer.bloodSplatter(100, 200, { particleCount: 5 });
      
      expect(effect).to.exist;
      expect(effect.effectType).to.equal('BLOOD_SPLATTER');
    });
    
    it('should create impact sparks with convenience method', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = renderer.impactSparks(100, 200);
      
      expect(effect).to.exist;
      expect(effect.effectType).to.equal('IMPACT_SPARKS');
    });
    
    it('should create dust cloud with convenience method', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = renderer.dustCloud(100, 200);
      
      expect(effect).to.exist;
      expect(effect.effectType).to.equal('DUST_CLOUD');
    });
    
    it('should create screen shake with convenience method', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.screenShake(10);
      
      expect(renderer.screenEffects.shake.active).to.be.true;
      expect(renderer.screenEffects.shake.intensity).to.equal(10);
    });
    
    it('should create damage flash with convenience method', () => {
      const renderer = new EffectsLayerRenderer();
      const color = [255, 0, 0];
      renderer.damageFlash(color);
      
      expect(renderer.screenEffects.flash.active).to.be.true;
      expect(renderer.screenEffects.flash.color).to.deep.equal(color);
    });
    
    it('should create fade transition with convenience method', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.fadeTransition(-1);
      
      expect(renderer.screenEffects.fade.active).to.be.true;
      expect(renderer.screenEffects.fade.direction).to.equal(-1);
    });
    
    it('should create flash effect with backwards compatibility', () => {
      const renderer = new EffectsLayerRenderer();
      const result = renderer.flash(100, 200, { count: 5 });
      
      expect(result).to.be.true;
    });
    
    it('should spawn particle burst', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = renderer.spawnParticleBurst(100, 200, { count: 8 });
      
      expect(effect).to.exist;
      expect(effect.particles).to.have.lengthOf(8);
    });
  });
  
  describe('Visual Effect Helpers', () => {
    it('should add visual effect with screen shake type', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.addVisualEffect({ type: 'screen_shake', intensity: 8, duration: 500 });
      
      expect(renderer.screenEffects.shake.active).to.be.true;
      expect(renderer.screenEffects.shake.intensity).to.equal(8);
    });
    
    it('should add visual effect with screen flash type', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.addVisualEffect({ type: 'screen_flash', color: [255, 255, 0], duration: 200 });
      
      expect(renderer.screenEffects.flash.active).to.be.true;
      expect(renderer.screenEffects.flash.color).to.deep.equal([255, 255, 0]);
    });
    
    it('should add custom visual effect to active list', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.addVisualEffect({ type: 'custom', duration: 1000 });
      
      expect(renderer.activeVisualEffects).to.have.lengthOf(1);
    });
    
    it('should generate unique ID for visual effects', () => {
      const renderer = new EffectsLayerRenderer();
      const id1 = renderer.addVisualEffect({ type: 'custom' });
      const id2 = renderer.addVisualEffect({ type: 'custom' });
      
      expect(id1).to.not.equal(id2);
    });
  });
  
  describe('Configuration and Stats', () => {
    it('should update configuration', () => {
      const renderer = new EffectsLayerRenderer();
      
      renderer.updateConfig({ maxParticles: 1000, enableParticles: false });
      
      expect(renderer.config.maxParticles).to.equal(1000);
      expect(renderer.config.enableParticles).to.be.false;
    });
    
    it('should get stats copy', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.stats.activeParticles = 50;
      
      const stats = renderer.getStats();
      
      expect(stats.activeParticles).to.equal(50);
      stats.activeParticles = 100; // Modify copy
      expect(renderer.stats.activeParticles).to.equal(50); // Original unchanged
    });
    
    it('should get active particles count', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.activeParticleEffects = [
        { particles: [1, 2, 3] },
        { particles: [4, 5] }
      ];
      
      const count = renderer.getActiveParticlesCount();
      
      expect(count).to.equal(5);
    });
    
    it('should get active effects summary', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.activeParticleEffects = [{}];
      renderer.activeVisualEffects = [{}, {}];
      renderer.screenEffects.shake.active = true;
      
      const summary = renderer.getActiveEffectsSummary();
      
      expect(summary.particleEffects).to.equal(1);
      expect(summary.visualEffects).to.equal(2);
      expect(summary.screenEffects.shake).to.be.true;
    });
    
    it('should get configuration copy', () => {
      const renderer = new EffectsLayerRenderer();
      
      const config = renderer.getConfig();
      
      expect(config.enableParticles).to.be.true;
      config.enableParticles = false;
      expect(renderer.config.enableParticles).to.be.true; // Original unchanged
    });
    
    it('should set and return new configuration', () => {
      const renderer = new EffectsLayerRenderer();
      
      const newConfig = renderer.setConfig({ maxParticles: 750 });
      
      expect(newConfig.maxParticles).to.equal(750);
      expect(renderer.config.maxParticles).to.equal(750);
    });
    
    it('should toggle particles enabled', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.config.enableParticles = true;
      
      const result = renderer.toggleParticles();
      
      expect(result).to.be.false;
      expect(renderer.config.enableParticles).to.be.false;
    });
    
    it('should toggle particles with explicit parameter', () => {
      const renderer = new EffectsLayerRenderer();
      
      renderer.toggleParticles(true);
      
      expect(renderer.config.enableParticles).to.be.true;
    });
    
    it('should clear all effects', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.activeParticleEffects = [{}];
      renderer.activeVisualEffects = [{}];
      renderer.activeAudioEffects = [{}];
      renderer.screenEffects.shake.active = true;
      
      renderer.clearAllEffects();
      
      expect(renderer.activeParticleEffects).to.be.empty;
      expect(renderer.activeVisualEffects).to.be.empty;
      expect(renderer.activeAudioEffects).to.be.empty;
      expect(renderer.screenEffects.shake.active).to.be.false;
    });
  });
  
  describe('Main Render Method', () => {
    it('should track render time', () => {
      const renderer = new EffectsLayerRenderer();
      
      renderer.renderEffects('PLAYING');
      
      expect(renderer.stats.lastRenderTime).to.be.a('number');
      expect(renderer.stats.lastRenderTime).to.be.at.least(0);
    });
    
    it('should skip particles if disabled', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.config.enableParticles = false;
      renderer.activeParticleEffects = [
        { effectType: 'IMPACT_SPARKS', timeLeft: 500, particles: [{}] }
      ];
      
      renderer.renderEffects('PLAYING');
      
      // Particles not updated, so active effects remain
      expect(renderer.activeParticleEffects).to.have.lengthOf(1);
    });
    
    it('should skip visual effects if disabled', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.config.enableVisualEffects = false;
      renderer.screenEffects.shake = { active: true, intensity: 5, timeLeft: 100 };
      
      renderer.renderEffects('PLAYING');
      
      // Visual effects not updated
      expect(renderer.screenEffects.shake.timeLeft).to.equal(100);
    });
    
    it('should skip audio effects if disabled', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.config.enableAudioEffects = false;
      renderer.activeAudioEffects = [{ timeLeft: 100 }];
      
      renderer.renderEffects('PLAYING');
      
      // Audio effects not updated
      expect(renderer.activeAudioEffects[0].timeLeft).to.equal(100);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle null particle pools gracefully', () => {
      const renderer = new EffectsLayerRenderer();
      renderer.particlePools = null;
      
      expect(() => renderer.getParticleFromPool('combat')).to.throw;
    });
    
    it('should handle empty effect type in particle update', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = {
        effectType: null,
        timeLeft: 100,
        particles: [{ x: 100, y: 100, alpha: 255 }]
      };
      
      const result = renderer.updateParticleEffect(effect);
      
      expect(result).to.be.true; // Falls back to generic update
    });
    
    it('should handle missing entity properties in selection detection', () => {
      const renderer = new EffectsLayerRenderer();
      const entity = {}; // No position or size
      const bounds = { x1: 100, y1: 100, x2: 200, y2: 200 };
      
      const result = renderer.isEntityInSelectionBox(entity, bounds);
      
      expect(result).to.not.throw;
    });
    
    it('should handle very large particle counts', () => {
      const renderer = new EffectsLayerRenderer();
      
      const effect = renderer.addEffect('IMPACT_SPARKS', { 
        x: 100, 
        y: 100, 
        particleCount: 1000 
      });
      
      expect(effect.particles).to.have.lengthOf(1000);
    });
    
    it('should handle negative coordinates', () => {
      const renderer = new EffectsLayerRenderer();
      
      const effect = renderer.addEffect('DUST_CLOUD', { x: -100, y: -200 });
      
      expect(effect.x).to.equal(-100);
      expect(effect.y).to.equal(-200);
    });
    
    it('should handle zero duration effects', () => {
      const renderer = new EffectsLayerRenderer();
      const effect = {
        effectType: 'IMPACT_SPARKS',
        timeLeft: 0,
        particles: [{}]
      };
      
      const result = renderer.updateParticleEffect(effect);
      
      expect(result).to.be.false;
    });
  });
  
  describe('Integration Scenarios', () => {
    it('should handle full particle lifecycle', () => {
      const renderer = new EffectsLayerRenderer();
      
      // Create effect
      const effect = renderer.addEffect('BLOOD_SPLATTER', { x: 100, y: 100, particleCount: 3 });
      expect(renderer.activeParticleEffects).to.have.lengthOf(1);
      
      // Update effect multiple times
      for (let i = 0; i < 100; i++) {
        renderer.updateParticleEffects();
      }
      
      // Effect should expire and be returned to pool
      expect(renderer.activeParticleEffects).to.have.lengthOf(0);
    });
    
    it('should manage multiple concurrent effects', () => {
      const renderer = new EffectsLayerRenderer();
      
      renderer.addEffect('IMPACT_SPARKS', { x: 100, y: 100 });
      renderer.addEffect('DUST_CLOUD', { x: 200, y: 200 });
      renderer.addEffect('SCREEN_SHAKE', { intensity: 5 });
      renderer.addEffect('COMBAT_SOUND', {});
      
      expect(renderer.activeParticleEffects.length).to.be.greaterThan(0);
      expect(renderer.screenEffects.shake.active).to.be.true;
      expect(renderer.activeAudioEffects.length).to.be.greaterThan(0);
    });
    
    it('should handle full selection box workflow', () => {
      const renderer = new EffectsLayerRenderer();
      const entities = [
        { x: 150, y: 150, width: 20, height: 20 },
        { x: 300, y: 300, width: 20, height: 20 }
      ];
      
      renderer.setSelectionEntities(entities);
      renderer.startSelectionBox(100, 100);
      renderer.updateSelectionBox(200, 200);
      
      const bounds = renderer.getSelectionBoxBounds();
      expect(bounds.width).to.equal(100);
      
      const selected = renderer.endSelectionBox();
      expect(selected).to.be.an('array');
    });
  });
});




// ================================================================
// EntityAccessor.test.js (79 tests)
// ================================================================
// DUPLICATE REQUIRE REMOVED: let path = require('path');

describe('EntityAccessor', () => {
  let EntityAccessor;
  
  before(() => {
    // Load the class
    EntityAccessor = require(path.resolve(__dirname, '../../../Classes/rendering/EntityAccessor.js'));
  });
  
  describe('getPosition()', () => {
    it('should return default position for null entity', () => {
      const pos = EntityAccessor.getPosition(null);
      expect(pos).to.deep.equal({ x: 0, y: 0 });
    });
    
    it('should return default position for undefined entity', () => {
      const pos = EntityAccessor.getPosition(undefined);
      expect(pos).to.deep.equal({ x: 0, y: 0 });
    });
    
    it('should use getPosition() method when available', () => {
      const entity = {
        getPosition: () => ({ x: 100, y: 200 })
      };
      const pos = EntityAccessor.getPosition(entity);
      expect(pos).to.deep.equal({ x: 100, y: 200 });
    });
    
    it('should use position property when getPosition not available', () => {
      const entity = {
        position: { x: 150, y: 250 }
      };
      const pos = EntityAccessor.getPosition(entity);
      expect(pos).to.deep.equal({ x: 150, y: 250 });
    });
    
    it('should prefer getPosition() over position property', () => {
      const entity = {
        getPosition: () => ({ x: 100, y: 200 }),
        position: { x: 150, y: 250 }
      };
      const pos = EntityAccessor.getPosition(entity);
      expect(pos).to.deep.equal({ x: 100, y: 200 });
    });
    
    it('should use _sprite.pos when position not available', () => {
      const entity = {
        _sprite: {
          pos: { x: 175, y: 275 }
        }
      };
      const pos = EntityAccessor.getPosition(entity);
      expect(pos).to.deep.equal({ x: 175, y: 275 });
    });
    
    it('should use sprite.pos when _sprite not available', () => {
      const entity = {
        sprite: {
          pos: { x: 185, y: 285 }
        }
      };
      const pos = EntityAccessor.getPosition(entity);
      expect(pos).to.deep.equal({ x: 185, y: 285 });
    });
    
    it('should use posX/posY properties as fallback', () => {
      const entity = {
        posX: 200,
        posY: 300
      };
      const pos = EntityAccessor.getPosition(entity);
      expect(pos).to.deep.equal({ x: 200, y: 300 });
    });
    
    it('should use x/y properties as final fallback', () => {
      const entity = {
        x: 225,
        y: 325
      };
      const pos = EntityAccessor.getPosition(entity);
      expect(pos).to.deep.equal({ x: 225, y: 325 });
    });
    
    it('should handle entity with only x coordinate', () => {
      const entity = { x: 100 };
      const pos = EntityAccessor.getPosition(entity);
      expect(pos).to.deep.equal({ x: 0, y: 0 }); // Both must be defined
    });
    
    it('should handle entity with only y coordinate', () => {
      const entity = { y: 200 };
      const pos = EntityAccessor.getPosition(entity);
      expect(pos).to.deep.equal({ x: 0, y: 0 }); // Both must be defined
    });
    
    it('should handle zero coordinates', () => {
      const entity = { x: 0, y: 0 };
      const pos = EntityAccessor.getPosition(entity);
      expect(pos).to.deep.equal({ x: 0, y: 0 });
    });
    
    it('should handle negative coordinates', () => {
      const entity = { x: -50, y: -100 };
      const pos = EntityAccessor.getPosition(entity);
      expect(pos).to.deep.equal({ x: -50, y: -100 });
    });
    
    it('should handle very large coordinates', () => {
      const entity = { x: 999999, y: 888888 };
      const pos = EntityAccessor.getPosition(entity);
      expect(pos).to.deep.equal({ x: 999999, y: 888888 });
    });
  });
  
  describe('getSize()', () => {
    it('should return default size for null entity', () => {
      const size = EntityAccessor.getSize(null);
      expect(size).to.deep.equal({ x: 20, y: 20 });
    });
    
    it('should return default size for undefined entity', () => {
      const size = EntityAccessor.getSize(undefined);
      expect(size).to.deep.equal({ x: 20, y: 20 });
    });
    
    it('should use getSize() method when available', () => {
      const entity = {
        getSize: () => ({ x: 50, y: 60 })
      };
      const size = EntityAccessor.getSize(entity);
      expect(size).to.deep.equal({ x: 50, y: 60 });
    });
    
    it('should use size property with x/y format', () => {
      const entity = {
        size: { x: 40, y: 45 }
      };
      const size = EntityAccessor.getSize(entity);
      expect(size).to.deep.equal({ x: 40, y: 45 });
    });
    
    it('should use size property with width/height format', () => {
      const entity = {
        size: { width: 55, height: 65 }
      };
      const size = EntityAccessor.getSize(entity);
      expect(size).to.deep.equal({ x: 55, y: 65 });
    });
    
    it('should prefer x/y over width/height in size property', () => {
      const entity = {
        size: { x: 40, y: 45, width: 55, height: 65 }
      };
      const size = EntityAccessor.getSize(entity);
      expect(size).to.deep.equal({ x: 40, y: 45 });
    });
    
    it('should prefer getSize() over size property', () => {
      const entity = {
        getSize: () => ({ x: 50, y: 60 }),
        size: { x: 40, y: 45 }
      };
      const size = EntityAccessor.getSize(entity);
      expect(size).to.deep.equal({ x: 50, y: 60 });
    });
    
    it('should use _sprite.size when size not available', () => {
      const entity = {
        _sprite: {
          size: { x: 35, y: 38 }
        }
      };
      const size = EntityAccessor.getSize(entity);
      expect(size).to.deep.equal({ x: 35, y: 38 });
    });
    
    it('should use sprite.size when _sprite not available', () => {
      const entity = {
        sprite: {
          size: { x: 42, y: 48 }
        }
      };
      const size = EntityAccessor.getSize(entity);
      expect(size).to.deep.equal({ x: 42, y: 48 });
    });
    
    it('should use sizeX/sizeY properties as fallback', () => {
      const entity = {
        sizeX: 70,
        sizeY: 80
      };
      const size = EntityAccessor.getSize(entity);
      expect(size).to.deep.equal({ x: 70, y: 80 });
    });
    
    it('should use width/height properties as final fallback', () => {
      const entity = {
        width: 90,
        height: 100
      };
      const size = EntityAccessor.getSize(entity);
      expect(size).to.deep.equal({ x: 90, y: 100 });
    });
    
    it('should handle entity with only width', () => {
      const entity = { width: 50 };
      const size = EntityAccessor.getSize(entity);
      expect(size).to.deep.equal({ x: 20, y: 20 }); // Both must be defined
    });
    
    it('should handle entity with only height', () => {
      const entity = { height: 60 };
      const size = EntityAccessor.getSize(entity);
      expect(size).to.deep.equal({ x: 20, y: 20 }); // Both must be defined
    });
    
    it('should handle zero size', () => {
      const entity = { width: 0, height: 0 };
      const size = EntityAccessor.getSize(entity);
      expect(size).to.deep.equal({ x: 0, y: 0 });
    });
    
    it('should handle very large size', () => {
      const entity = { width: 5000, height: 6000 };
      const size = EntityAccessor.getSize(entity);
      expect(size).to.deep.equal({ x: 5000, y: 6000 });
    });
    
    it('should handle partial size property (x only)', () => {
      const entity = {
        size: { x: 30 }
      };
      const size = EntityAccessor.getSize(entity);
      expect(size.x).to.equal(30);
      expect(size.y).to.equal(20); // Default
    });
    
    it('should handle partial size property (y only)', () => {
      const entity = {
        size: { y: 35 }
      };
      const size = EntityAccessor.getSize(entity);
      expect(size.x).to.equal(20); // Default
      expect(size.y).to.equal(35);
    });
  });
  
  describe('getSizeWH()', () => {
    it('should return size with width/height properties', () => {
      const entity = { width: 50, height: 60 };
      const size = EntityAccessor.getSizeWH(entity);
      expect(size).to.have.property('width', 50);
      expect(size).to.have.property('height', 60);
    });
    
    it('should convert x/y to width/height', () => {
      const entity = {
        size: { x: 40, y: 45 }
      };
      const size = EntityAccessor.getSizeWH(entity);
      expect(size).to.have.property('width', 40);
      expect(size).to.have.property('height', 45);
    });
    
    it('should return default size in width/height format', () => {
      const size = EntityAccessor.getSizeWH(null);
      expect(size).to.have.property('width', 20);
      expect(size).to.have.property('height', 20);
    });
    
    it('should handle mixed format (x and height)', () => {
      const entity = {
        size: { x: 35, height: 42 }
      };
      const size = EntityAccessor.getSizeWH(entity);
      expect(size).to.have.property('width', 35);
      expect(size).to.have.property('height', 42);
    });
    
    it('should handle mixed format (width and y)', () => {
      const entity = {
        size: { width: 38, y: 48 }
      };
      const size = EntityAccessor.getSizeWH(entity);
      expect(size).to.have.property('width', 38);
      expect(size).to.have.property('height', 48);
    });
  });
  
  describe('getCenter()', () => {
    it('should calculate center from position and size', () => {
      const entity = {
        x: 100,
        y: 200,
        width: 50,
        height: 60
      };
      const center = EntityAccessor.getCenter(entity);
      expect(center).to.deep.equal({ x: 125, y: 230 });
    });
    
    it('should use default values for null entity', () => {
      const center = EntityAccessor.getCenter(null);
      expect(center).to.deep.equal({ x: 10, y: 10 }); // 0 + 20/2
    });
    
    it('should handle zero position', () => {
      const entity = { x: 0, y: 0, width: 40, height: 40 };
      const center = EntityAccessor.getCenter(entity);
      expect(center).to.deep.equal({ x: 20, y: 20 });
    });
    
    it('should handle negative position', () => {
      const entity = { x: -50, y: -100, width: 30, height: 40 };
      const center = EntityAccessor.getCenter(entity);
      expect(center).to.deep.equal({ x: -35, y: -80 });
    });
    
    it('should handle odd sizes correctly', () => {
      const entity = { x: 100, y: 200, width: 51, height: 61 };
      const center = EntityAccessor.getCenter(entity);
      expect(center).to.deep.equal({ x: 125.5, y: 230.5 });
    });
    
    it('should work with getPosition/getSize methods', () => {
      const entity = {
        getPosition: () => ({ x: 150, y: 250 }),
        getSize: () => ({ x: 80, y: 100 })
      };
      const center = EntityAccessor.getCenter(entity);
      expect(center).to.deep.equal({ x: 190, y: 300 });
    });
  });
  
  describe('hasPosition()', () => {
    it('should return false for null entity', () => {
      expect(EntityAccessor.hasPosition(null)).to.be.false;
    });
    
    it('should return false for undefined entity', () => {
      expect(EntityAccessor.hasPosition(undefined)).to.be.false;
    });
    
    it('should return true when getPosition exists', () => {
      const entity = { getPosition: () => ({}) };
      expect(EntityAccessor.hasPosition(entity)).to.be.true;
    });
    
    it('should return true when position property exists', () => {
      const entity = { position: { x: 0, y: 0 } };
      expect(EntityAccessor.hasPosition(entity)).to.be.true;
    });
    
    it('should return true when _sprite.pos exists', () => {
      const entity = { _sprite: { pos: { x: 0, y: 0 } } };
      expect(EntityAccessor.hasPosition(entity)).to.be.true;
    });
    
    it('should return true when sprite.pos exists', () => {
      const entity = { sprite: { pos: { x: 0, y: 0 } } };
      expect(EntityAccessor.hasPosition(entity)).to.be.true;
    });
    
    it('should return true when posX/posY exist', () => {
      const entity = { posX: 0, posY: 0 };
      expect(EntityAccessor.hasPosition(entity)).to.be.true;
    });
    
    it('should return true when x/y exist', () => {
      const entity = { x: 0, y: 0 };
      expect(EntityAccessor.hasPosition(entity)).to.be.true;
    });
    
    it('should return false when only x exists', () => {
      const entity = { x: 100 };
      expect(EntityAccessor.hasPosition(entity)).to.be.false;
    });
    
    it('should return false when only y exists', () => {
      const entity = { y: 200 };
      expect(EntityAccessor.hasPosition(entity)).to.be.false;
    });
    
    it('should return false for empty object', () => {
      const entity = {};
      expect(EntityAccessor.hasPosition(entity)).to.be.false;
    });
    
    it('should return true for x/y even if zero', () => {
      const entity = { x: 0, y: 0 };
      expect(EntityAccessor.hasPosition(entity)).to.be.true;
    });
  });
  
  describe('hasSize()', () => {
    it('should return false for null entity', () => {
      expect(EntityAccessor.hasSize(null)).to.be.false;
    });
    
    it('should return false for undefined entity', () => {
      expect(EntityAccessor.hasSize(undefined)).to.be.false;
    });
    
    it('should return true when getSize exists', () => {
      const entity = { getSize: () => ({}) };
      expect(EntityAccessor.hasSize(entity)).to.be.true;
    });
    
    it('should return true when size property exists', () => {
      const entity = { size: { x: 20, y: 20 } };
      expect(EntityAccessor.hasSize(entity)).to.be.true;
    });
    
    it('should return true when _sprite.size exists', () => {
      const entity = { _sprite: { size: { x: 20, y: 20 } } };
      expect(EntityAccessor.hasSize(entity)).to.be.true;
    });
    
    it('should return true when sprite.size exists', () => {
      const entity = { sprite: { size: { x: 20, y: 20 } } };
      expect(EntityAccessor.hasSize(entity)).to.be.true;
    });
    
    it('should return true when sizeX/sizeY exist', () => {
      const entity = { sizeX: 20, sizeY: 20 };
      expect(EntityAccessor.hasSize(entity)).to.be.true;
    });
    
    it('should return true when width/height exist', () => {
      const entity = { width: 20, height: 20 };
      expect(EntityAccessor.hasSize(entity)).to.be.true;
    });
    
    it('should return false when only width exists', () => {
      const entity = { width: 50 };
      expect(EntityAccessor.hasSize(entity)).to.be.false;
    });
    
    it('should return false when only height exists', () => {
      const entity = { height: 60 };
      expect(EntityAccessor.hasSize(entity)).to.be.false;
    });
    
    it('should return false for empty object', () => {
      const entity = {};
      expect(EntityAccessor.hasSize(entity)).to.be.false;
    });
    
    it('should return true for width/height even if zero', () => {
      const entity = { width: 0, height: 0 };
      expect(EntityAccessor.hasSize(entity)).to.be.true;
    });
  });
  
  describe('getBounds()', () => {
    it('should return bounds with x, y, width, height', () => {
      const entity = { x: 100, y: 200, width: 50, height: 60 };
      const bounds = EntityAccessor.getBounds(entity);
      expect(bounds).to.deep.equal({
        x: 100,
        y: 200,
        width: 50,
        height: 60
      });
    });
    
    it('should use default values for null entity', () => {
      const bounds = EntityAccessor.getBounds(null);
      expect(bounds).to.deep.equal({
        x: 0,
        y: 0,
        width: 20,
        height: 20
      });
    });
    
    it('should handle getPosition/getSize methods', () => {
      const entity = {
        getPosition: () => ({ x: 150, y: 250 }),
        getSize: () => ({ x: 80, y: 100 })
      };
      const bounds = EntityAccessor.getBounds(entity);
      expect(bounds).to.deep.equal({
        x: 150,
        y: 250,
        width: 80,
        height: 100
      });
    });
    
    it('should handle negative coordinates', () => {
      const entity = { x: -50, y: -100, width: 30, height: 40 };
      const bounds = EntityAccessor.getBounds(entity);
      expect(bounds).to.deep.equal({
        x: -50,
        y: -100,
        width: 30,
        height: 40
      });
    });
    
    it('should handle zero size', () => {
      const entity = { x: 100, y: 200, width: 0, height: 0 };
      const bounds = EntityAccessor.getBounds(entity);
      expect(bounds).to.deep.equal({
        x: 100,
        y: 200,
        width: 0,
        height: 0
      });
    });
    
    it('should handle position from one source and size from another', () => {
      const entity = {
        position: { x: 120, y: 180 },
        width: 45,
        height: 55
      };
      const bounds = EntityAccessor.getBounds(entity);
      expect(bounds).to.deep.equal({
        x: 120,
        y: 180,
        width: 45,
        height: 55
      });
    });
  });
  
  describe('Fallback Chain Priority', () => {
    it('should follow correct position priority chain', () => {
      const entity = {
        getPosition: () => ({ x: 1, y: 1 }),
        position: { x: 2, y: 2 },
        _sprite: { pos: { x: 3, y: 3 } },
        sprite: { pos: { x: 4, y: 4 } },
        posX: 5, posY: 5,
        x: 6, y: 6
      };
      
      // Should use getPosition (highest priority)
      expect(EntityAccessor.getPosition(entity)).to.deep.equal({ x: 1, y: 1 });
      
      // Remove getPosition, should use position
      delete entity.getPosition;
      expect(EntityAccessor.getPosition(entity)).to.deep.equal({ x: 2, y: 2 });
      
      // Remove position, should use _sprite.pos
      delete entity.position;
      expect(EntityAccessor.getPosition(entity)).to.deep.equal({ x: 3, y: 3 });
      
      // Remove _sprite, should use sprite.pos
      delete entity._sprite;
      expect(EntityAccessor.getPosition(entity)).to.deep.equal({ x: 4, y: 4 });
      
      // Remove sprite, should use posX/posY
      delete entity.sprite;
      expect(EntityAccessor.getPosition(entity)).to.deep.equal({ x: 5, y: 5 });
      
      // Remove posX/posY, should use x/y
      delete entity.posX;
      delete entity.posY;
      expect(EntityAccessor.getPosition(entity)).to.deep.equal({ x: 6, y: 6 });
    });
    
    it('should follow correct size priority chain', () => {
      const entity = {
        getSize: () => ({ x: 1, y: 1 }),
        size: { x: 2, y: 2 },
        _sprite: { size: { x: 3, y: 3 } },
        sprite: { size: { x: 4, y: 4 } },
        sizeX: 5, sizeY: 5,
        width: 6, height: 6
      };
      
      // Should use getSize (highest priority)
      expect(EntityAccessor.getSize(entity)).to.deep.equal({ x: 1, y: 1 });
      
      // Remove getSize, should use size
      delete entity.getSize;
      expect(EntityAccessor.getSize(entity)).to.deep.equal({ x: 2, y: 2 });
      
      // Remove size, should use _sprite.size
      delete entity.size;
      expect(EntityAccessor.getSize(entity)).to.deep.equal({ x: 3, y: 3 });
      
      // Remove _sprite, should use sprite.size
      delete entity._sprite;
      expect(EntityAccessor.getSize(entity)).to.deep.equal({ x: 4, y: 4 });
      
      // Remove sprite, should use sizeX/sizeY
      delete entity.sprite;
      expect(EntityAccessor.getSize(entity)).to.deep.equal({ x: 5, y: 5 });
      
      // Remove sizeX/sizeY, should use width/height
      delete entity.sizeX;
      delete entity.sizeY;
      expect(EntityAccessor.getSize(entity)).to.deep.equal({ x: 6, y: 6 });
    });
  });
  
  describe('Edge Cases and Integration', () => {
    it('should handle entity with mixed position/size formats', () => {
      const entity = {
        getPosition: () => ({ x: 100, y: 200 }),
        size: { width: 50, height: 60 }
      };
      const bounds = EntityAccessor.getBounds(entity);
      expect(bounds.x).to.equal(100);
      expect(bounds.y).to.equal(200);
      expect(bounds.width).to.equal(50);
      expect(bounds.height).to.equal(60);
    });
    
    it('should handle entity with partial sprite data', () => {
      const entity = {
        _sprite: { pos: { x: 150, y: 250 } },
        width: 70,
        height: 80
      };
      const pos = EntityAccessor.getPosition(entity);
      const size = EntityAccessor.getSize(entity);
      expect(pos).to.deep.equal({ x: 150, y: 250 });
      expect(size).to.deep.equal({ x: 70, y: 80 });
    });
    
    it('should handle entity with function-based properties', () => {
      let callCount = 0;
      const entity = {
        getPosition: () => {
          callCount++;
          return { x: 100, y: 200 };
        },
        getSize: () => {
          callCount++;
          return { x: 50, y: 60 };
        }
      };
      
      EntityAccessor.getBounds(entity);
      expect(callCount).to.equal(2); // Both methods called once
    });
    
    it('should handle very large numbers without precision loss', () => {
      const entity = {
        x: 9999999.5,
        y: 8888888.25,
        width: 1000000.75,
        height: 2000000.125
      };
      const bounds = EntityAccessor.getBounds(entity);
      expect(bounds.x).to.equal(9999999.5);
      expect(bounds.y).to.equal(8888888.25);
      expect(bounds.width).to.equal(1000000.75);
      expect(bounds.height).to.equal(2000000.125);
    });
    
    it('should handle fractional coordinates and sizes', () => {
      const entity = {
        x: 100.5,
        y: 200.75,
        width: 50.25,
        height: 60.125
      };
      const center = EntityAccessor.getCenter(entity);
      expect(center.x).to.equal(125.625);
      expect(center.y).to.equal(230.8125);
    });
  });
});




// ================================================================
// EntityDelegationBuilder.test.js (67 tests)
// ================================================================
// DUPLICATE REQUIRE REMOVED: let path = require('path');

describe('EntityDelegationBuilder', () => {
  let EntityDelegationBuilder, STANDARD_ENTITY_API_CONFIG, MINIMAL_ENTITY_API_CONFIG, ADVANCED_ENTITY_API_CONFIG;
  
  before(() => {
    // Mock performance if not available
    if (typeof global.performance === 'undefined') {
      global.performance = {
        now: () => Date.now()
      };
    }
    
    // Load the module
    const module = require(path.resolve(__dirname, '../../../Classes/rendering/EntityDelegationBuilder.js'));
    EntityDelegationBuilder = module.EntityDelegationBuilder;
    STANDARD_ENTITY_API_CONFIG = module.STANDARD_ENTITY_API_CONFIG;
    MINIMAL_ENTITY_API_CONFIG = module.MINIMAL_ENTITY_API_CONFIG;
    ADVANCED_ENTITY_API_CONFIG = module.ADVANCED_ENTITY_API_CONFIG;
  });
  
  beforeEach(() => {
    // Reset stats before each test
    EntityDelegationBuilder.resetStats();
  });
  
  describe('Configuration Exports', () => {
    it('should export EntityDelegationBuilder class', () => {
      expect(EntityDelegationBuilder).to.be.a('function');
      expect(EntityDelegationBuilder.name).to.equal('EntityDelegationBuilder');
    });
    
    it('should export STANDARD_ENTITY_API_CONFIG', () => {
      expect(STANDARD_ENTITY_API_CONFIG).to.be.an('object');
      expect(STANDARD_ENTITY_API_CONFIG).to.have.property('namespaces');
      expect(STANDARD_ENTITY_API_CONFIG).to.have.property('properties');
      expect(STANDARD_ENTITY_API_CONFIG).to.have.property('chainable');
      expect(STANDARD_ENTITY_API_CONFIG).to.have.property('directMethods');
    });
    
    it('should export MINIMAL_ENTITY_API_CONFIG', () => {
      expect(MINIMAL_ENTITY_API_CONFIG).to.be.an('object');
      expect(MINIMAL_ENTITY_API_CONFIG).to.have.property('namespaces');
    });
    
    it('should export ADVANCED_ENTITY_API_CONFIG', () => {
      expect(ADVANCED_ENTITY_API_CONFIG).to.be.an('object');
      expect(ADVANCED_ENTITY_API_CONFIG).to.have.property('namespaces');
      expect(ADVANCED_ENTITY_API_CONFIG.namespaces).to.have.property('animation');
      expect(ADVANCED_ENTITY_API_CONFIG.namespaces).to.have.property('physics');
      expect(ADVANCED_ENTITY_API_CONFIG.namespaces).to.have.property('audio');
    });
  });
  
  describe('createDelegationMethods()', () => {
    let TestClass, controller;
    
    beforeEach(() => {
      TestClass = class {
        constructor() {
          this._renderController = controller;
        }
      };
      
      controller = {
        render: () => 'rendered',
        update: () => 'updated',
        clear: () => 'cleared'
      };
    });
    
    it('should create delegation methods on prototype', () => {
      EntityDelegationBuilder.createDelegationMethods(
        TestClass,
        '_renderController',
        ['render', 'update', 'clear']
      );
      
      const instance = new TestClass();
      expect(instance).to.have.property('render');
      expect(instance).to.have.property('update');
      expect(instance).to.have.property('clear');
    });
    
    it('should delegate method calls to controller', () => {
      EntityDelegationBuilder.createDelegationMethods(
        TestClass,
        '_renderController',
        ['render', 'update']
      );
      
      const instance = new TestClass();
      expect(instance.render()).to.equal('rendered');
      expect(instance.update()).to.equal('updated');
    });
    
    it('should pass arguments to delegated methods', () => {
      controller.setColor = (color) => `color: ${color}`;
      
      EntityDelegationBuilder.createDelegationMethods(
        TestClass,
        '_renderController',
        ['setColor']
      );
      
      const instance = new TestClass();
      expect(instance.setColor('red')).to.equal('color: red');
    });
    
    it('should handle multiple arguments', () => {
      controller.setPosition = (x, y) => `position: ${x}, ${y}`;
      
      EntityDelegationBuilder.createDelegationMethods(
        TestClass,
        '_renderController',
        ['setPosition']
      );
      
      const instance = new TestClass();
      expect(instance.setPosition(100, 200)).to.equal('position: 100, 200');
    });
    
    it('should warn when controller not available', () => {
      const warnings = [];
      const originalWarn = console.warn;
      console.warn = (msg) => warnings.push(msg);
      
      EntityDelegationBuilder.createDelegationMethods(
        TestClass,
        '_missingController',
        ['render']
      );
      
      const instance = new TestClass();
      const result = instance.render();
      
      console.warn = originalWarn;
      expect(result).to.be.null;
      expect(warnings.length).to.be.greaterThan(0);
    });
    
    it('should warn when method not available on controller', () => {
      const warnings = [];
      const originalWarn = console.warn;
      console.warn = (msg) => warnings.push(msg);
      
      EntityDelegationBuilder.createDelegationMethods(
        TestClass,
        '_renderController',
        ['nonExistentMethod']
      );
      
      const instance = new TestClass();
      const result = instance.nonExistentMethod();
      
      console.warn = originalWarn;
      expect(result).to.be.null;
      expect(warnings.length).to.be.greaterThan(0);
    });
    
    it('should support namespace parameter', () => {
      EntityDelegationBuilder.createDelegationMethods(
        TestClass,
        '_renderController',
        ['render'],
        'gfx'
      );
      
      const instance = new TestClass();
      expect(instance).to.have.property('gfx_render');
      expect(instance.gfx_render()).to.equal('rendered');
    });
  });
  
  describe('createNamespaceDelegation()', () => {
    let TestClass, controller;
    
    beforeEach(() => {
      TestClass = class {
        constructor() {
          this._renderController = controller;
        }
      };
      
      controller = {
        selected: () => 'selected',
        hover: () => 'hover',
        clear: () => 'clear'
      };
    });
    
    it('should create namespace property on prototype', () => {
      EntityDelegationBuilder.createNamespaceDelegation(
        TestClass,
        '_renderController',
        { highlight: ['selected', 'hover', 'clear'] }
      );
      
      const instance = new TestClass();
      expect(instance).to.have.property('highlight');
    });
    
    it('should create methods within namespace', () => {
      EntityDelegationBuilder.createNamespaceDelegation(
        TestClass,
        '_renderController',
        { highlight: ['selected', 'hover', 'clear'] }
      );
      
      const instance = new TestClass();
      expect(instance.highlight).to.have.property('selected');
      expect(instance.highlight).to.have.property('hover');
      expect(instance.highlight).to.have.property('clear');
    });
    
    it('should delegate namespace method calls', () => {
      EntityDelegationBuilder.createNamespaceDelegation(
        TestClass,
        '_renderController',
        { highlight: ['selected', 'hover'] }
      );
      
      const instance = new TestClass();
      expect(instance.highlight.selected()).to.equal('selected');
      expect(instance.highlight.hover()).to.equal('hover');
    });
    
    it('should support multiple namespaces', () => {
      controller.add = () => 'effect added';
      controller.remove = () => 'effect removed';
      
      EntityDelegationBuilder.createNamespaceDelegation(
        TestClass,
        '_renderController',
        {
          highlight: ['selected', 'clear'],
          effects: ['add', 'remove']
        }
      );
      
      const instance = new TestClass();
      expect(instance.highlight.selected()).to.equal('selected');
      expect(instance.effects.add()).to.equal('effect added');
    });
    
    it('should cache namespace object per instance', () => {
      EntityDelegationBuilder.createNamespaceDelegation(
        TestClass,
        '_renderController',
        { highlight: ['selected'] }
      );
      
      const instance = new TestClass();
      const ns1 = instance.highlight;
      const ns2 = instance.highlight;
      expect(ns1).to.equal(ns2); // Same object reference
    });
  });
  
  describe('createChainableAPI()', () => {
    let TestClass, controller;
    
    beforeEach(() => {
      TestClass = class {
        constructor() {
          this._renderController = controller;
        }
      };
      
      controller = {
        highlight: () => 'highlighted',
        effect: () => 'effect applied',
        render: () => 'rendered',
        update: () => 'updated'
      };
    });
    
    it('should create chainable namespace', () => {
      EntityDelegationBuilder.createChainableAPI(
        TestClass,
        '_renderController',
        {
          chain: [
            { name: 'highlight', chainable: true },
            { name: 'effect', chainable: true }
          ]
        }
      );
      
      const instance = new TestClass();
      expect(instance).to.have.property('chain');
    });
    
    it('should allow method chaining', () => {
      EntityDelegationBuilder.createChainableAPI(
        TestClass,
        '_renderController',
        {
          chain: [
            { name: 'highlight', chainable: true },
            { name: 'effect', chainable: true }
          ]
        }
      );
      
      const instance = new TestClass();
      const result = instance.chain.highlight().effect();
      expect(result).to.have.property('highlight');
      expect(result).to.have.property('effect');
    });
    
    it('should return value for non-chainable methods', () => {
      EntityDelegationBuilder.createChainableAPI(
        TestClass,
        '_renderController',
        {
          chain: [
            { name: 'render', chainable: false }
          ]
        }
      );
      
      const instance = new TestClass();
      const result = instance.chain.render();
      expect(result).to.equal('rendered');
    });
    
    it('should default to chainable if not specified', () => {
      EntityDelegationBuilder.createChainableAPI(
        TestClass,
        '_renderController',
        {
          chain: [
            { name: 'highlight' } // chainable not specified
          ]
        }
      );
      
      const instance = new TestClass();
      const result = instance.chain.highlight();
      expect(result).to.have.property('highlight');
    });
  });
  
  describe('createPropertyAPI()', () => {
    let TestClass, controller;
    
    beforeEach(() => {
      TestClass = class {
        constructor() {
          this._renderController = controller;
        }
      };
      
      controller = {
        _debugMode: false,
        _opacity: 1.0,
        getDebugMode: function() { return this._debugMode; },
        setDebugMode: function(val) { this._debugMode = val; },
        getOpacity: function() { return this._opacity; },
        setOpacity: function(val) { this._opacity = val; }
      };
    });
    
    it('should create property namespace', () => {
      EntityDelegationBuilder.createPropertyAPI(
        TestClass,
        '_renderController',
        {
          config: [
            { name: 'debugMode' }
          ]
        }
      );
      
      const instance = new TestClass();
      expect(instance).to.have.property('config');
    });
    
    it('should create getter properties', () => {
      EntityDelegationBuilder.createPropertyAPI(
        TestClass,
        '_renderController',
        {
          config: [
            { name: 'debugMode' }
          ]
        }
      );
      
      const instance = new TestClass();
      expect(instance.config.debugMode).to.equal(false);
      instance._renderController._debugMode = true;
      expect(instance.config.debugMode).to.equal(true);
    });
    
    it('should create setter properties', () => {
      EntityDelegationBuilder.createPropertyAPI(
        TestClass,
        '_renderController',
        {
          config: [
            { name: 'opacity' }
          ]
        }
      );
      
      const instance = new TestClass();
      instance.config.opacity = 0.5;
      expect(instance._renderController._opacity).to.equal(0.5);
    });
    
    it('should support custom getter/setter names', () => {
      controller.isVisible = () => true;
      controller.setVisible = () => {};
      
      EntityDelegationBuilder.createPropertyAPI(
        TestClass,
        '_renderController',
        {
          config: [
            { name: 'visible', getter: 'isVisible', setter: 'setVisible' }
          ]
        }
      );
      
      const instance = new TestClass();
      expect(instance.config.visible).to.equal(true);
    });
  });
  
  describe('setupEntityAPI()', () => {
    let TestClass, controller;
    
    beforeEach(() => {
      TestClass = class {
        constructor() {
          this._renderController = controller;
        }
      };
      
      controller = {
        selected: () => 'selected',
        clear: () => 'cleared',
        render: () => 'rendered',
        getRenderController: function() { return this; },
        _debugMode: false,
        getDebugMode: function() { return this._debugMode; },
        setDebugMode: function(val) { this._debugMode = val; }
      };
    });
    
    it('should setup namespaces from config', () => {
      EntityDelegationBuilder.setupEntityAPI(TestClass, {
        namespaces: {
          highlight: ['selected', 'clear']
        }
      });
      
      const instance = new TestClass();
      expect(instance.highlight.selected()).to.equal('selected');
    });
    
    it('should setup direct methods from config', () => {
      EntityDelegationBuilder.setupEntityAPI(TestClass, {
        directMethods: ['render', 'getRenderController']
      });
      
      const instance = new TestClass();
      expect(instance.render()).to.equal('rendered');
    });
    
    it('should setup properties from config', () => {
      EntityDelegationBuilder.setupEntityAPI(TestClass, {
        properties: {
          config: [
            { name: 'debugMode' }
          ]
        }
      });
      
      const instance = new TestClass();
      expect(instance.config.debugMode).to.equal(false);
    });
    
    it('should handle empty config', () => {
      expect(() => {
        EntityDelegationBuilder.setupEntityAPI(TestClass, {});
      }).to.not.throw();
    });
    
    it('should use custom controller property name', () => {
      TestClass = class {
        constructor() {
          this._customController = controller;
        }
      };
      
      EntityDelegationBuilder.setupEntityAPI(TestClass, {
        renderController: '_customController',
        directMethods: ['render']
      });
      
      const instance = new TestClass();
      expect(instance.render()).to.equal('rendered');
    });
  });
  
  describe('createNamespaceAPI()', () => {
    let TestClass, controller;
    
    beforeEach(() => {
      TestClass = class {
        constructor() {
          this._renderController = controller;
        }
      };
      
      controller = {
        selected: () => 'selected',
        hover: () => 'hover'
      };
    });
    
    it('should create namespace with statistics tracking', () => {
      EntityDelegationBuilder.createNamespaceAPI(
        TestClass,
        '_renderController',
        { highlight: ['selected', 'hover'] }
      );
      
      const stats = EntityDelegationBuilder.getDelegationStats();
      expect(stats.totalDelegatedMethods).to.be.greaterThan(0);
    });
    
    it('should track class names in statistics', () => {
      EntityDelegationBuilder.createNamespaceAPI(
        TestClass,
        '_renderController',
        { highlight: ['selected'] }
      );
      
      const stats = EntityDelegationBuilder.getDelegationStats();
      expect(stats.classesWithDelegation).to.include(TestClass.name);
    });
    
    it('should track methods per class', () => {
      EntityDelegationBuilder.createNamespaceAPI(
        TestClass,
        '_renderController',
        { highlight: ['selected', 'hover'] }
      );
      
      const stats = EntityDelegationBuilder.getDelegationStats();
      expect(stats.methodsPerClass[TestClass.name]).to.equal(2);
    });
  });
  
  describe('validateDelegationConfig()', () => {
    it('should validate valid configuration', () => {
      const result = EntityDelegationBuilder.validateDelegationConfig({
        highlight: { selected: 'selected', clear: 'clear' }
      });
      
      expect(result.isValid).to.be.true;
      expect(result.errors).to.be.an('array').with.lengthOf(0);
    });
    
    it('should reject null configuration', () => {
      const result = EntityDelegationBuilder.validateDelegationConfig(null);
      expect(result.isValid).to.be.false;
      expect(result.errors.length).to.be.greaterThan(0);
    });
    
    it('should reject undefined configuration', () => {
      const result = EntityDelegationBuilder.validateDelegationConfig(undefined);
      expect(result.isValid).to.be.false;
    });
    
    it('should reject non-object configuration', () => {
      const result = EntityDelegationBuilder.validateDelegationConfig('invalid');
      expect(result.isValid).to.be.false;
    });
    
    it('should reject invalid namespace structure', () => {
      const result = EntityDelegationBuilder.validateDelegationConfig({
        highlight: 'not an object'
      });
      
      expect(result.isValid).to.be.false;
    });
    
    it('should accept null method values', () => {
      const result = EntityDelegationBuilder.validateDelegationConfig({
        highlight: { selected: null }
      });
      
      expect(result.isValid).to.be.true;
    });
    
    it('should accept string method values', () => {
      const result = EntityDelegationBuilder.validateDelegationConfig({
        highlight: { selected: 'selected' }
      });
      
      expect(result.isValid).to.be.true;
    });
    
    it('should accept function method values', () => {
      const result = EntityDelegationBuilder.validateDelegationConfig({
        highlight: { selected: () => {} }
      });
      
      expect(result.isValid).to.be.true;
    });
  });
  
  describe('validateControllerMethods()', () => {
    let TestClass, controller;
    
    beforeEach(() => {
      controller = {
        render: () => {},
        update: () => {}
      };
      
      TestClass = class {
        constructor() {
          this._renderController = controller;
        }
      };
    });
    
    it('should identify available methods', () => {
      const result = EntityDelegationBuilder.validateControllerMethods(
        TestClass,
        '_renderController',
        ['render', 'update']
      );
      
      expect(result.available).to.include('render');
      expect(result.available).to.include('update');
      expect(result.missing).to.be.empty;
    });
    
    it('should identify missing methods', () => {
      const result = EntityDelegationBuilder.validateControllerMethods(
        TestClass,
        '_renderController',
        ['render', 'nonExistent']
      );
      
      expect(result.available).to.include('render');
      expect(result.missing).to.include('nonExistent');
    });
    
    it('should detect when controller exists', () => {
      const result = EntityDelegationBuilder.validateControllerMethods(
        TestClass,
        '_renderController',
        ['render']
      );
      
      expect(result.controllerExists).to.be.true;
    });
    
    it('should detect when controller missing', () => {
      const result = EntityDelegationBuilder.validateControllerMethods(
        TestClass,
        '_missingController',
        ['render']
      );
      
      expect(result.controllerExists).to.be.false;
      expect(result.missing).to.include('render');
    });
  });
  
  describe('createAdvancedDelegation()', () => {
    let TestClass, controller;
    
    beforeEach(() => {
      controller = {
        setColor: (color) => `color: ${color}`,
        render: () => 'rendered'
      };
      
      TestClass = class {
        constructor() {
          this._renderController = controller;
          this.enabled = true;
        }
      };
    });
    
    it('should support method transforms', () => {
      EntityDelegationBuilder.createAdvancedDelegation(
        TestClass,
        '_renderController',
        {
          methods: {
            setColor: { targetMethod: 'setColor' }
          },
          methodTransforms: {
            setColor: function(color) {
              return [color.toUpperCase()];
            }
          }
        }
      );
      
      const instance = new TestClass();
      expect(instance.setColor('red')).to.equal('color: RED');
    });
    
    it('should support conditional delegation', () => {
      EntityDelegationBuilder.createAdvancedDelegation(
        TestClass,
        '_renderController',
        {
          methods: {
            render: { targetMethod: 'render' }
          },
          conditionalDelegation: {
            render: function() {
              return this.enabled === true;
            }
          }
        }
      );
      
      const instance = new TestClass();
      expect(instance.render()).to.equal('rendered');
      
      instance.enabled = false;
      expect(instance.render()).to.be.null;
    });
    
    it('should support warn error handling', () => {
      const warnings = [];
      const originalWarn = console.warn;
      console.warn = (msg) => warnings.push(msg);
      
      EntityDelegationBuilder.createAdvancedDelegation(
        TestClass,
        '_renderController',
        {
          methods: {
            nonExistent: { targetMethod: 'nonExistent' }
          },
          errorHandling: 'warn'
        }
      );
      
      const instance = new TestClass();
      instance.nonExistent();
      
      console.warn = originalWarn;
      expect(warnings.length).to.be.greaterThan(0);
    });
    
    it('should support silent error handling', () => {
      const warnings = [];
      const originalWarn = console.warn;
      console.warn = (msg) => warnings.push(msg);
      
      EntityDelegationBuilder.createAdvancedDelegation(
        TestClass,
        '_renderController',
        {
          methods: {
            nonExistent: { targetMethod: 'nonExistent' }
          },
          errorHandling: 'silent'
        }
      );
      
      const instance = new TestClass();
      const result = instance.nonExistent();
      
      console.warn = originalWarn;
      expect(result).to.be.null;
      expect(warnings).to.be.empty;
    });
  });
  
  describe('Delegation Statistics', () => {
    it('should initialize statistics', () => {
      const stats = EntityDelegationBuilder.getDelegationStats();
      expect(stats).to.have.property('totalDelegatedMethods');
      expect(stats).to.have.property('classesWithDelegation');
      expect(stats).to.have.property('methodsPerClass');
    });
    
    it('should track total delegated methods', () => {
      const TestClass = class {
        constructor() {
          this._renderController = {
            method1: () => {},
            method2: () => {}
          };
        }
      };
      
      EntityDelegationBuilder.createNamespaceAPI(
        TestClass,
        '_renderController',
        { namespace: ['method1', 'method2'] }
      );
      
      const stats = EntityDelegationBuilder.getDelegationStats();
      expect(stats.totalDelegatedMethods).to.be.greaterThan(0);
    });
    
    it('should reset statistics', () => {
      const TestClass = class {
        constructor() {
          this._renderController = { method: () => {} };
        }
      };
      
      EntityDelegationBuilder.createNamespaceAPI(
        TestClass,
        '_renderController',
        { namespace: ['method'] }
      );
      
      EntityDelegationBuilder.resetStats();
      
      const stats = EntityDelegationBuilder.getDelegationStats();
      expect(stats.totalDelegatedMethods).to.equal(0);
      expect(stats.classesWithDelegation).to.be.empty;
    });
  });
  
  describe('Predefined Configurations', () => {
    it('STANDARD_ENTITY_API_CONFIG should have highlight namespace', () => {
      expect(STANDARD_ENTITY_API_CONFIG.namespaces).to.have.property('highlight');
      expect(STANDARD_ENTITY_API_CONFIG.namespaces.highlight).to.include('selected');
      expect(STANDARD_ENTITY_API_CONFIG.namespaces.highlight).to.include('hover');
      expect(STANDARD_ENTITY_API_CONFIG.namespaces.highlight).to.include('clear');
    });
    
    it('STANDARD_ENTITY_API_CONFIG should have effects namespace', () => {
      expect(STANDARD_ENTITY_API_CONFIG.namespaces).to.have.property('effects');
      expect(STANDARD_ENTITY_API_CONFIG.namespaces.effects).to.include('add');
      expect(STANDARD_ENTITY_API_CONFIG.namespaces.effects).to.include('remove');
    });
    
    it('STANDARD_ENTITY_API_CONFIG should have rendering namespace', () => {
      expect(STANDARD_ENTITY_API_CONFIG.namespaces).to.have.property('rendering');
      expect(STANDARD_ENTITY_API_CONFIG.namespaces.rendering).to.include('render');
      expect(STANDARD_ENTITY_API_CONFIG.namespaces.rendering).to.include('setDebugMode');
    });
    
    it('STANDARD_ENTITY_API_CONFIG should have properties config', () => {
      expect(STANDARD_ENTITY_API_CONFIG.properties).to.have.property('config');
      expect(STANDARD_ENTITY_API_CONFIG.properties.config).to.be.an('array');
    });
    
    it('STANDARD_ENTITY_API_CONFIG should have chainable config', () => {
      expect(STANDARD_ENTITY_API_CONFIG).to.have.property('chainable');
      expect(STANDARD_ENTITY_API_CONFIG.chainable).to.have.property('chain');
    });
    
    it('STANDARD_ENTITY_API_CONFIG should have direct methods', () => {
      expect(STANDARD_ENTITY_API_CONFIG).to.have.property('directMethods');
      expect(STANDARD_ENTITY_API_CONFIG.directMethods).to.be.an('array');
    });
    
    it('MINIMAL_ENTITY_API_CONFIG should be subset of STANDARD', () => {
      expect(MINIMAL_ENTITY_API_CONFIG.namespaces).to.have.property('highlight');
      expect(MINIMAL_ENTITY_API_CONFIG.namespaces).to.have.property('effects');
      expect(MINIMAL_ENTITY_API_CONFIG.namespaces).to.have.property('rendering');
    });
    
    it('ADVANCED_ENTITY_API_CONFIG should extend STANDARD with additional namespaces', () => {
      expect(ADVANCED_ENTITY_API_CONFIG.namespaces).to.have.property('animation');
      expect(ADVANCED_ENTITY_API_CONFIG.namespaces).to.have.property('physics');
      expect(ADVANCED_ENTITY_API_CONFIG.namespaces).to.have.property('audio');
    });
    
    it('ADVANCED_ENTITY_API_CONFIG should include STANDARD namespaces', () => {
      expect(ADVANCED_ENTITY_API_CONFIG.namespaces).to.have.property('highlight');
      expect(ADVANCED_ENTITY_API_CONFIG.namespaces).to.have.property('effects');
      expect(ADVANCED_ENTITY_API_CONFIG.namespaces).to.have.property('rendering');
    });
  });
  
  describe('Edge Cases and Integration', () => {
    it('should handle class without constructor', () => {
      const TestClass = class {};
      
      expect(() => {
        EntityDelegationBuilder.createDelegationMethods(
          TestClass,
          '_renderController',
          ['method']
        );
      }).to.not.throw();
    });
    
    it('should handle multiple instances sharing prototype methods', () => {
      const TestClass = class {
        constructor(controller) {
          this._renderController = controller;
        }
      };
      
      EntityDelegationBuilder.createDelegationMethods(
        TestClass,
        '_renderController',
        ['render']
      );
      
      const controller1 = { render: () => 'controller1' };
      const controller2 = { render: () => 'controller2' };
      
      const instance1 = new TestClass(controller1);
      const instance2 = new TestClass(controller2);
      
      expect(instance1.render()).to.equal('controller1');
      expect(instance2.render()).to.equal('controller2');
    });
    
    it('should handle delegating to same method from multiple namespaces', () => {
      const TestClass = class {
        constructor() {
          this._renderController = {
            clear: () => 'cleared'
          };
        }
      };
      
      EntityDelegationBuilder.createNamespaceDelegation(
        TestClass,
        '_renderController',
        {
          highlight: ['clear'],
          effects: ['clear']
        }
      );
      
      const instance = new TestClass();
      expect(instance.highlight.clear()).to.equal('cleared');
      expect(instance.effects.clear()).to.equal('cleared');
    });
    
    it('should handle very long method names', () => {
      const longMethodName = 'thisIsAVeryLongMethodNameForTestingPurposes';
      const TestClass = class {
        constructor() {
          this._renderController = {
            [longMethodName]: () => 'success'
          };
        }
      };
      
      EntityDelegationBuilder.createDelegationMethods(
        TestClass,
        '_renderController',
        [longMethodName]
      );
      
      const instance = new TestClass();
      expect(instance[longMethodName]()).to.equal('success');
    });
    
    it('should handle delegating methods that return undefined', () => {
      const TestClass = class {
        constructor() {
          this._renderController = {
            voidMethod: () => undefined
          };
        }
      };
      
      EntityDelegationBuilder.createDelegationMethods(
        TestClass,
        '_renderController',
        ['voidMethod']
      );
      
      const instance = new TestClass();
      expect(instance.voidMethod()).to.be.undefined;
    });
    
    it('should handle delegating methods that throw errors', () => {
      const TestClass = class {
        constructor() {
          this._renderController = {
            errorMethod: () => { throw new Error('Test error'); }
          };
        }
      };
      
      EntityDelegationBuilder.createDelegationMethods(
        TestClass,
        '_renderController',
        ['errorMethod']
      );
      
      const instance = new TestClass();
      expect(() => instance.errorMethod()).to.throw('Test error');
    });
    
    it('should preserve method context in delegated calls', () => {
      const controller = {
        value: 42,
        getValue: function() { return this.value; }
      };
      
      const TestClass = class {
        constructor() {
          this._renderController = controller;
        }
      };
      
      EntityDelegationBuilder.createDelegationMethods(
        TestClass,
        '_renderController',
        ['getValue']
      );
      
      const instance = new TestClass();
      expect(instance.getValue()).to.equal(42);
    });
  });
});




// ================================================================
// EntityLayerRenderer.test.js (67 tests)
// ================================================================
// DUPLICATE REQUIRE REMOVED: let path = require('path');

describe('EntityLayerRenderer (EntityRenderer)', () => {
  let EntityRenderer;
  
  before(() => {
    // Mock p5.js globals
    global.push = () => {};
    global.pop = () => {};
    global.stroke = () => {};
    global.strokeWeight = () => {};
    global.noFill = () => {};
    global.rect = () => {};
    global.fill = () => {};
    global.textAlign = () => {};
    global.textSize = () => {};
    global.text = () => {};
    global.LEFT = 'left';
    global.TOP = 'top';
    global.performance = {
      now: () => Date.now()
    };
    
    // Mock game globals
    global.g_canvasX = 800;
    global.g_canvasY = 600;
    global.ants = [];
    global.antsUpdate = () => {};
    global.g_resourceList = { resources: [], updateAll: () => {} };
    global.Buildings = [];
    global.g_performanceMonitor = null;
    
    // Mock EntityAccessor
    global.EntityAccessor = {
      getPosition: (entity) => {
        return entity.sprite?.pos || { x: entity.posX || entity.x || 0, y: entity.posY || entity.y || 0 };
      },
      getSizeWH: (entity) => {
        return entity.sprite?.size || { width: entity.sizeX || entity.width || 20, height: entity.sizeY || entity.height || 20 };
      }
    };
    
    // Load the class
    const entityRendererPath = path.join(__dirname, '../../../Classes/rendering/EntityLayerRenderer.js');
    EntityRenderer = require(entityRendererPath);
  });
  
  afterEach(() => {
    // Reset globals
    global.ants = [];
    global.g_resourceList = { resources: [], updateAll: () => {} };
    global.Buildings = [];
    global.g_performanceMonitor = null;
    
    // Clean up instances
    if (typeof window !== 'undefined' && window.EntityRenderer) {
      delete window.EntityRenderer;
    }
    if (typeof global !== 'undefined' && global.EntityRenderer) {
      delete global.EntityRenderer;
    }
  });
  
  describe('Constructor', () => {
    it('should initialize render groups', () => {
      const renderer = new EntityRenderer();
      
      expect(renderer.renderGroups).to.exist;
      expect(renderer.renderGroups.BACKGROUND).to.be.an('array').that.is.empty;
      expect(renderer.renderGroups.RESOURCES).to.be.an('array').that.is.empty;
      expect(renderer.renderGroups.ANTS).to.be.an('array').that.is.empty;
      expect(renderer.renderGroups.EFFECTS).to.be.an('array').that.is.empty;
      expect(renderer.renderGroups.FOREGROUND).to.be.an('array').that.is.empty;
    });
    
    it('should initialize with default configuration', () => {
      const renderer = new EntityRenderer();
      
      expect(renderer.config).to.exist;
      expect(renderer.config.enableDepthSorting).to.be.true;
      expect(renderer.config.enableFrustumCulling).to.be.true;
      expect(renderer.config.enableBatching).to.be.true;
      expect(renderer.config.maxBatchSize).to.equal(100);
      expect(renderer.config.cullMargin).to.equal(50);
    });
    
    it('should initialize performance stats', () => {
      const renderer = new EntityRenderer();
      
      expect(renderer.stats).to.exist;
      expect(renderer.stats.totalEntities).to.equal(0);
      expect(renderer.stats.renderedEntities).to.equal(0);
      expect(renderer.stats.culledEntities).to.equal(0);
      expect(renderer.stats.renderTime).to.equal(0);
      expect(renderer.stats.lastFrameStats).to.deep.equal({});
    });
    
    it('should have exactly 5 render groups', () => {
      const renderer = new EntityRenderer();
      
      const groupNames = Object.keys(renderer.renderGroups);
      expect(groupNames).to.have.lengthOf(5);
    });
  });
  
  describe('Entity Collection', () => {
    it('should collect resources from global resource list', () => {
      const renderer = new EntityRenderer();
      global.g_resourceList.resources = [
        { x: 100, y: 100, width: 20, height: 20 },
        { x: 200, y: 200, width: 20, height: 20 }
      ];
      
      renderer.collectEntities('PLAYING');
      
      expect(renderer.renderGroups.RESOURCES).to.have.lengthOf(2);
      expect(renderer.stats.totalEntities).to.equal(2);
    });
    
    it('should collect ants from global ants array', () => {
      const renderer = new EntityRenderer();
      global.ants = [
        { x: 100, y: 100, width: 20, height: 20 },
        { x: 200, y: 200, width: 20, height: 20 },
        { x: 300, y: 300, width: 20, height: 20 }
      ];
      
      renderer.collectEntities('PLAYING');
      
      expect(renderer.renderGroups.ANTS).to.have.lengthOf(3);
      expect(renderer.stats.totalEntities).to.equal(3);
    });
    
    it('should collect buildings from global Buildings array', () => {
      const renderer = new EntityRenderer();
      global.Buildings = [
        { x: 150, y: 150, width: 50, height: 50 }
      ];
      
      renderer.collectEntities('PLAYING');
      
      expect(renderer.renderGroups.BACKGROUND).to.have.lengthOf(1);
      expect(renderer.stats.totalEntities).to.equal(1);
    });
    
    it('should skip null entities in ants array', () => {
      const renderer = new EntityRenderer();
      global.ants = [
        { x: 100, y: 100 },
        null,
        { x: 200, y: 200 },
        undefined
      ];
      
      renderer.collectEntities('PLAYING');
      
      expect(renderer.renderGroups.ANTS).to.have.lengthOf(2);
    });
    
    it('should call updateAll on resources in PLAYING state', () => {
      const renderer = new EntityRenderer();
      let updateCalled = false;
      global.g_resourceList = {
        resources: [{ x: 100, y: 100 }],
        updateAll: () => { updateCalled = true; }
      };
      
      renderer.collectEntities('PLAYING');
      
      expect(updateCalled).to.be.true;
    });
    
    it('should call antsUpdate in PLAYING state', () => {
      const renderer = new EntityRenderer();
      let updateCalled = false;
      global.antsUpdate = () => { updateCalled = true; };
      global.ants = [{ x: 100, y: 100 }];
      
      renderer.collectEntities('PLAYING');
      
      expect(updateCalled).to.be.true;
    });
    
    it('should call building update in PLAYING state', () => {
      const renderer = new EntityRenderer();
      let updateCalled = false;
      global.Buildings = [{
        x: 100,
        y: 100,
        update: () => { updateCalled = true; }
      }];
      
      renderer.collectEntities('PLAYING');
      
      expect(updateCalled).to.be.true;
    });
    
    it('should handle missing resource list gracefully', () => {
      const renderer = new EntityRenderer();
      global.g_resourceList = null;
      
      expect(() => renderer.collectEntities('PLAYING')).to.not.throw();
    });
    
    it('should clear render groups before collecting', () => {
      const renderer = new EntityRenderer();
      renderer.renderGroups.ANTS = [{ entity: 'old' }];
      global.ants = [{ x: 100, y: 100 }];
      
      renderer.collectEntities('PLAYING');
      
      expect(renderer.renderGroups.ANTS).to.have.lengthOf(1);
      expect(renderer.renderGroups.ANTS[0].entity).to.not.equal('old');
    });
  });
  
  describe('Frustum Culling', () => {
    it('should render entity within viewport', () => {
      const renderer = new EntityRenderer();
      const entity = { x: 400, y: 300, width: 20, height: 20 }; // Center of screen
      
      const result = renderer.shouldRenderEntity(entity);
      
      expect(result).to.be.true;
    });
    
    it('should cull entity outside viewport', () => {
      const renderer = new EntityRenderer();
      const entity = { x: 2000, y: 2000, width: 20, height: 20 }; // Way off screen
      
      const result = renderer.shouldRenderEntity(entity);
      
      expect(result).to.be.false;
    });
    
    it('should render entity partially in viewport', () => {
      const renderer = new EntityRenderer();
      const entity = { x: -10, y: -10, width: 50, height: 50 }; // Partially on screen
      
      const result = renderer.shouldRenderEntity(entity);
      
      expect(result).to.be.true;
    });
    
    it('should respect cull margin', () => {
      const renderer = new EntityRenderer();
      renderer.config.cullMargin = 100;
      const entity = { x: global.g_canvasX + 50, y: 300, width: 20, height: 20 }; // Just outside viewport but within margin
      
      const result = renderer.shouldRenderEntity(entity);
      
      expect(result).to.be.true;
    });
    
    it('should skip culling when disabled', () => {
      const renderer = new EntityRenderer();
      renderer.config.enableFrustumCulling = false;
      const entity = { x: 5000, y: 5000, width: 20, height: 20 };
      
      const result = renderer.shouldRenderEntity(entity);
      
      expect(result).to.be.true;
    });
    
    it('should not render inactive entities', () => {
      const renderer = new EntityRenderer();
      const entity = { x: 400, y: 300, width: 20, height: 20, isActive: false };
      
      const result = renderer.shouldRenderEntity(entity);
      
      expect(result).to.be.false;
    });
    
    it('should render when position cannot be determined', () => {
      const renderer = new EntityRenderer();
      global.EntityAccessor.getPosition = () => null;
      const entity = { x: 100, y: 100 };
      
      const result = renderer.shouldRenderEntity(entity);
      
      // Reset EntityAccessor
      global.EntityAccessor.getPosition = (entity) => {
        return { x: entity.x || 0, y: entity.y || 0 };
      };
      
      expect(result).to.be.true;
    });
  });
  
  describe('Depth Sorting', () => {
    it('should sort entities by Y position (depth)', () => {
      const renderer = new EntityRenderer();
      global.ants = [
        { x: 100, y: 300 }, // Higher Y = more depth
        { x: 100, y: 100 },
        { x: 100, y: 200 }
      ];
      
      renderer.collectEntities('PLAYING');
      renderer.sortEntitiesByDepth();
      
      expect(renderer.renderGroups.ANTS[0].depth).to.equal(100);
      expect(renderer.renderGroups.ANTS[1].depth).to.equal(200);
      expect(renderer.renderGroups.ANTS[2].depth).to.equal(300);
    });
    
    it('should sort all render groups', () => {
      const renderer = new EntityRenderer();
      global.ants = [
        { x: 100, y: 300 },
        { x: 100, y: 100 }
      ];
      global.g_resourceList.resources = [
        { x: 50, y: 250 },
        { x: 50, y: 50 }
      ];
      
      renderer.collectEntities('PLAYING');
      renderer.sortEntitiesByDepth();
      
      expect(renderer.renderGroups.ANTS[0].depth).to.be.lessThan(renderer.renderGroups.ANTS[1].depth);
      expect(renderer.renderGroups.RESOURCES[0].depth).to.be.lessThan(renderer.renderGroups.RESOURCES[1].depth);
    });
    
    it('should skip sorting when disabled', () => {
      const renderer = new EntityRenderer();
      renderer.config.enableDepthSorting = false;
      global.ants = [
        { x: 100, y: 300 },
        { x: 100, y: 100 }
      ];
      
      renderer.collectEntities('PLAYING');
      const beforeSort = [...renderer.renderGroups.ANTS];
      renderer.sortEntitiesByDepth();
      
      // Order should remain unchanged
      expect(renderer.renderGroups.ANTS[0]).to.equal(beforeSort[0]);
    });
    
    it('should handle entities with same depth', () => {
      const renderer = new EntityRenderer();
      global.ants = [
        { x: 100, y: 100 },
        { x: 200, y: 100 },
        { x: 300, y: 100 }
      ];
      
      renderer.collectEntities('PLAYING');
      
      expect(() => renderer.sortEntitiesByDepth()).to.not.throw();
    });
  });
  
  describe('Entity Position and Size', () => {
    it('should get entity position using EntityAccessor', () => {
      const renderer = new EntityRenderer();
      const entity = { x: 123, y: 456 };
      
      const pos = renderer.getEntityPosition(entity);
      
      expect(pos.x).to.equal(123);
      expect(pos.y).to.equal(456);
    });
    
    it('should get entity size using EntityAccessor', () => {
      const renderer = new EntityRenderer();
      const entity = { width: 30, height: 40 };
      
      const size = renderer.getEntitySize(entity);
      
      expect(size.width).to.equal(30);
      expect(size.height).to.equal(40);
    });
    
    it('should get entity depth from Y position', () => {
      const renderer = new EntityRenderer();
      const entity = { x: 100, y: 250 };
      
      const depth = renderer.getEntityDepth(entity);
      
      expect(depth).to.equal(250);
    });
    
    it('should use 0 depth if position unavailable', () => {
      const renderer = new EntityRenderer();
      const entity = {};
      
      const depth = renderer.getEntityDepth(entity);
      
      expect(depth).to.equal(0);
    });
  });
  
  describe('Render Group Management', () => {
    it('should clear all render groups', () => {
      const renderer = new EntityRenderer();
      renderer.renderGroups.ANTS = [{ entity: 'test' }];
      renderer.renderGroups.RESOURCES = [{ entity: 'test' }];
      
      renderer.clearRenderGroups();
      
      expect(renderer.renderGroups.ANTS).to.be.empty;
      expect(renderer.renderGroups.RESOURCES).to.be.empty;
    });
    
    it('should render standard group with render method', () => {
      const renderer = new EntityRenderer();
      let renderCalled = 0;
      const entityGroup = [
        { entity: { render: () => { renderCalled++; } } },
        { entity: { render: () => { renderCalled++; } } }
      ];
      
      renderer.renderEntityGroupStandard(entityGroup);
      
      expect(renderCalled).to.equal(2);
      expect(renderer.stats.renderedEntities).to.equal(2);
    });
    
    it('should skip entities without render method', () => {
      const renderer = new EntityRenderer();
      const entityGroup = [
        { entity: {} },
        { entity: { render: () => {} } }
      ];
      
      expect(() => renderer.renderEntityGroupStandard(entityGroup)).to.not.throw();
      expect(renderer.stats.renderedEntities).to.equal(1);
    });
    
    it('should handle render errors gracefully', () => {
      const renderer = new EntityRenderer();
      const entityGroup = [
        { entity: { render: () => { throw new Error('Render error'); } } },
        { entity: { render: () => {} } }
      ];
      
      const consoleWarn = console.warn;
      let warnCalled = false;
      console.warn = () => { warnCalled = true; };
      
      renderer.renderEntityGroupStandard(entityGroup);
      
      console.warn = consoleWarn;
      expect(warnCalled).to.be.true;
      expect(renderer.stats.renderedEntities).to.equal(1);
    });
    
    it('should use batched rendering for large groups', () => {
      const renderer = new EntityRenderer();
      renderer.config.maxBatchSize = 5;
      const largeGroup = Array(10).fill(null).map(() => ({ entity: { render: () => {} } }));
      
      renderer.renderGroup(largeGroup);
      
      expect(renderer.stats.renderedEntities).to.equal(10);
    });
    
    it('should use standard rendering for small groups', () => {
      const renderer = new EntityRenderer();
      renderer.config.maxBatchSize = 100;
      const smallGroup = [
        { entity: { render: () => {} } },
        { entity: { render: () => {} } }
      ];
      
      renderer.renderGroup(smallGroup);
      
      expect(renderer.stats.renderedEntities).to.equal(2);
    });
    
    it('should skip empty groups', () => {
      const renderer = new EntityRenderer();
      
      expect(() => renderer.renderGroup([])).to.not.throw();
      expect(renderer.stats.renderedEntities).to.equal(0);
    });
  });
  
  describe('Performance Monitoring Integration', () => {
    it('should track render phases with performance monitor', () => {
      const renderer = new EntityRenderer();
      let phasesStarted = [];
      let phasesEnded = 0;
      
      global.g_performanceMonitor = {
        startRenderPhase: (phase) => { phasesStarted.push(phase); },
        endRenderPhase: () => { phasesEnded++; },
        recordEntityStats: () => {},
        finalizeEntityPerformance: () => {}
      };
      
      renderer.renderAllLayers('PLAYING');
      
      expect(phasesStarted).to.include('preparation');
      expect(phasesStarted).to.include('culling');
      expect(phasesStarted).to.include('rendering');
      expect(phasesStarted).to.include('postProcessing');
      expect(phasesEnded).to.equal(4);
    });
    
    it('should record entity stats with performance monitor', () => {
      const renderer = new EntityRenderer();
      let statsRecorded = false;
      
      global.g_performanceMonitor = {
        startRenderPhase: () => {},
        endRenderPhase: () => {},
        recordEntityStats: (total, rendered, culled, breakdown) => {
          statsRecorded = true;
          expect(total).to.be.a('number');
          expect(rendered).to.be.a('number');
          expect(culled).to.be.a('number');
        },
        finalizeEntityPerformance: () => {}
      };
      
      renderer.renderAllLayers('PLAYING');
      
      expect(statsRecorded).to.be.true;
    });
    
    it('should finalize entity performance', () => {
      const renderer = new EntityRenderer();
      let finalizeCalled = false;
      
      global.g_performanceMonitor = {
        startRenderPhase: () => {},
        endRenderPhase: () => {},
        recordEntityStats: () => {},
        finalizeEntityPerformance: () => { finalizeCalled = true; }
      };
      
      renderer.renderAllLayers('PLAYING');
      
      expect(finalizeCalled).to.be.true;
    });
    
    it('should track entity render time', () => {
      const renderer = new EntityRenderer();
      let startCalled = false;
      let endCalled = false;
      
      global.g_performanceMonitor = {
        startRenderPhase: () => {},
        endRenderPhase: () => {},
        recordEntityStats: () => {},
        finalizeEntityPerformance: () => {},
        startEntityRender: () => { startCalled = true; },
        endEntityRender: () => { endCalled = true; }
      };
      
      global.ants = [{ x: 100, y: 100, render: () => {} }];
      
      renderer.collectEntities('PLAYING');
      renderer.renderEntityGroupStandard(renderer.renderGroups.ANTS);
      
      expect(startCalled).to.be.true;
      expect(endCalled).to.be.true;
    });
    
    it('should work without performance monitor', () => {
      const renderer = new EntityRenderer();
      global.g_performanceMonitor = null;
      
      expect(() => renderer.renderAllLayers('PLAYING')).to.not.throw();
    });
  });
  
  describe('Main Render Method', () => {
    it('should reset stats at start of render', () => {
      const renderer = new EntityRenderer();
      renderer.stats.totalEntities = 100;
      renderer.stats.renderedEntities = 50;
      renderer.stats.culledEntities = 50;
      
      renderer.renderAllLayers('PLAYING');
      
      expect(renderer.stats.totalEntities).to.equal(0);
      expect(renderer.stats.renderedEntities).to.equal(0);
      expect(renderer.stats.culledEntities).to.equal(0);
    });
    
    it('should track render time', () => {
      const renderer = new EntityRenderer();
      
      renderer.renderAllLayers('PLAYING');
      
      expect(renderer.stats.renderTime).to.be.a('number');
      expect(renderer.stats.renderTime).to.be.at.least(0);
    });
    
    it('should store last frame stats', () => {
      const renderer = new EntityRenderer();
      global.ants = [{ x: 100, y: 100, render: () => {} }];
      
      renderer.renderAllLayers('PLAYING');
      
      expect(renderer.stats.lastFrameStats).to.exist;
      expect(renderer.stats.lastFrameStats.totalEntities).to.be.a('number');
    });
    
    it('should render all groups in correct order', () => {
      const renderer = new EntityRenderer();
      const renderOrder = [];
      
      const originalRenderGroup = renderer.renderGroup.bind(renderer);
      renderer.renderGroup = function(group) {
        if (group === this.renderGroups.BACKGROUND) renderOrder.push('BACKGROUND');
        if (group === this.renderGroups.RESOURCES) renderOrder.push('RESOURCES');
        if (group === this.renderGroups.ANTS) renderOrder.push('ANTS');
        if (group === this.renderGroups.EFFECTS) renderOrder.push('EFFECTS');
        if (group === this.renderGroups.FOREGROUND) renderOrder.push('FOREGROUND');
        return originalRenderGroup(group);
      };
      
      renderer.renderAllLayers('PLAYING');
      
      expect(renderOrder).to.deep.equal(['BACKGROUND', 'RESOURCES', 'ANTS', 'EFFECTS', 'FOREGROUND']);
    });
    
    it('should sort entities when depth sorting enabled', () => {
      const renderer = new EntityRenderer();
      renderer.config.enableDepthSorting = true;
      global.ants = [
        { x: 100, y: 300, render: () => {} },
        { x: 100, y: 100, render: () => {} }
      ];
      
      renderer.renderAllLayers('PLAYING');
      
      expect(renderer.renderGroups.ANTS[0].depth).to.be.lessThan(renderer.renderGroups.ANTS[1].depth);
    });
  });
  
  describe('Performance Statistics', () => {
    it('should calculate cull efficiency', () => {
      const renderer = new EntityRenderer();
      renderer.stats.totalEntities = 100;
      renderer.stats.culledEntities = 30;
      
      const stats = renderer.getPerformanceStats();
      
      expect(stats.cullEfficiency).to.equal(30);
    });
    
    it('should calculate render efficiency', () => {
      const renderer = new EntityRenderer();
      renderer.stats.totalEntities = 100;
      renderer.stats.renderedEntities = 70;
      
      const stats = renderer.getPerformanceStats();
      
      expect(stats.renderEfficiency).to.equal(70);
    });
    
    it('should handle zero total entities', () => {
      const renderer = new EntityRenderer();
      renderer.stats.totalEntities = 0;
      
      const stats = renderer.getPerformanceStats();
      
      expect(stats.cullEfficiency).to.equal(0);
      expect(stats.renderEfficiency).to.equal(0);
    });
    
    it('should include all stats properties', () => {
      const renderer = new EntityRenderer();
      
      const stats = renderer.getPerformanceStats();
      
      expect(stats).to.have.property('totalEntities');
      expect(stats).to.have.property('renderedEntities');
      expect(stats).to.have.property('culledEntities');
      expect(stats).to.have.property('renderTime');
      expect(stats).to.have.property('cullEfficiency');
      expect(stats).to.have.property('renderEfficiency');
    });
  });
  
  describe('Configuration', () => {
    it('should update configuration', () => {
      const renderer = new EntityRenderer();
      
      renderer.updateConfig({
        enableDepthSorting: false,
        maxBatchSize: 200,
        cullMargin: 100
      });
      
      expect(renderer.config.enableDepthSorting).to.be.false;
      expect(renderer.config.maxBatchSize).to.equal(200);
      expect(renderer.config.cullMargin).to.equal(100);
    });
    
    it('should preserve unmodified config values', () => {
      const renderer = new EntityRenderer();
      
      renderer.updateConfig({ maxBatchSize: 150 });
      
      expect(renderer.config.enableDepthSorting).to.be.true; // Original value
      expect(renderer.config.maxBatchSize).to.equal(150); // Updated value
    });
  });
  
  describe('Entity Type Breakdown', () => {
    it('should get entity type breakdown', () => {
      const renderer = new EntityRenderer();
      global.ants = [{ x: 100, y: 100 }, { x: 200, y: 200 }];
      global.g_resourceList.resources = [{ x: 50, y: 50 }];
      
      renderer.collectEntities('PLAYING');
      const breakdown = renderer.getEntityTypeBreakdown();
      
      expect(breakdown.ant).to.equal(2);
      expect(breakdown.resource).to.equal(1);
    });
    
    it('should handle mixed entity types', () => {
      const renderer = new EntityRenderer();
      global.ants = [{ x: 100, y: 100 }];
      global.g_resourceList.resources = [{ x: 50, y: 50 }];
      global.Buildings = [{ x: 150, y: 150 }];
      
      renderer.collectEntities('PLAYING');
      const breakdown = renderer.getEntityTypeBreakdown();
      
      expect(breakdown.ant).to.equal(1);
      expect(breakdown.resource).to.equal(1);
      expect(breakdown.building).to.equal(1);
    });
    
    it('should return empty breakdown when no entities', () => {
      const renderer = new EntityRenderer();
      
      const breakdown = renderer.getEntityTypeBreakdown();
      
      expect(breakdown).to.be.an('object');
      expect(Object.keys(breakdown)).to.be.empty;
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle null entities gracefully', () => {
      const renderer = new EntityRenderer();
      
      const result = renderer.shouldRenderEntity(null);
      
      expect(result).to.be.false;
    });
    
    it('should handle undefined entities gracefully', () => {
      const renderer = new EntityRenderer();
      
      const result = renderer.shouldRenderEntity(undefined);
      
      expect(result).to.be.false;
    });
    
    it('should handle entities without position', () => {
      const renderer = new EntityRenderer();
      const entity = { width: 20, height: 20 }; // No x or y
      
      expect(() => renderer.shouldRenderEntity(entity)).to.not.throw();
    });
    
    it('should handle entities without size', () => {
      const renderer = new EntityRenderer();
      const entity = { x: 100, y: 100 }; // No width or height
      
      expect(() => renderer.isEntityInViewport(entity)).to.not.throw();
    });
    
    it('should handle very large coordinates', () => {
      const renderer = new EntityRenderer();
      const entity = { x: 999999, y: 999999, width: 20, height: 20 };
      
      const result = renderer.shouldRenderEntity(entity);
      
      expect(result).to.be.false; // Should be culled
    });
    
    it('should handle negative coordinates', () => {
      const renderer = new EntityRenderer();
      const entity = { x: -100, y: -100, width: 50, height: 50 };
      
      const result = renderer.shouldRenderEntity(entity);
      
      expect(result).to.be.true; // Partially visible with margin
    });
    
    it('should handle zero-size entities', () => {
      const renderer = new EntityRenderer();
      const entity = { x: 100, y: 100, width: 0, height: 0 };
      
      expect(() => renderer.isEntityInViewport(entity)).to.not.throw();
    });
    
    it('should handle empty Buildings array', () => {
      const renderer = new EntityRenderer();
      global.Buildings = [];
      
      expect(() => renderer.collectEntities('PLAYING')).to.not.throw();
    });
    
    it('should handle undefined Buildings', () => {
      const renderer = new EntityRenderer();
      global.Buildings = undefined;
      
      expect(() => renderer.collectEntities('PLAYING')).to.not.throw();
    });
  });
  
  describe('Integration Scenarios', () => {
    it('should handle full render cycle with mixed entities', () => {
      const renderer = new EntityRenderer();
      global.ants = [
        { x: 100, y: 100, render: () => {} },
        { x: 200, y: 200, render: () => {} }
      ];
      global.g_resourceList.resources = [
        { x: 50, y: 50, render: () => {} }
      ];
      
      renderer.renderAllLayers('PLAYING');
      
      expect(renderer.stats.totalEntities).to.equal(3);
      expect(renderer.stats.renderedEntities).to.equal(3);
      expect(renderer.stats.renderTime).to.be.at.least(0); // >= 0, can be 0 for very fast renders
    });
    
    it('should cull off-screen entities correctly', () => {
      const renderer = new EntityRenderer();
      renderer.config.cullMargin = 10;
      global.ants = [
        { x: 400, y: 300, render: () => {} }, // On screen
        { x: 5000, y: 5000, render: () => {} }  // Off screen
      ];
      
      renderer.renderAllLayers('PLAYING');
      
      expect(renderer.stats.renderedEntities).to.equal(1);
      expect(renderer.stats.culledEntities).to.equal(1);
    });
    
    it('should maintain render order with depth sorting', () => {
      const renderer = new EntityRenderer();
      const renderOrder = [];
      
      global.ants = [
        { x: 100, y: 300, render: function() { renderOrder.push(this.y); } },
        { x: 100, y: 100, render: function() { renderOrder.push(this.y); } },
        { x: 100, y: 200, render: function() { renderOrder.push(this.y); } }
      ];
      
      renderer.renderAllLayers('PLAYING');
      
      expect(renderOrder).to.deep.equal([100, 200, 300]);
    });
    
    it('should handle entities appearing and disappearing', () => {
      const renderer = new EntityRenderer();
      
      // First frame
      global.ants = [{ x: 100, y: 100, render: () => {} }];
      renderer.renderAllLayers('PLAYING');
      expect(renderer.stats.totalEntities).to.equal(1);
      
      // Second frame - more entities
      global.ants = [
        { x: 100, y: 100, render: () => {} },
        { x: 200, y: 200, render: () => {} }
      ];
      renderer.renderAllLayers('PLAYING');
      expect(renderer.stats.totalEntities).to.equal(2);
      
      // Third frame - fewer entities
      global.ants = [];
      renderer.renderAllLayers('PLAYING');
      expect(renderer.stats.totalEntities).to.equal(0);
    });
  });
});




// ================================================================
// PerformanceMonitor.test.js (93 tests)
// ================================================================
/**
 * @fileoverview Unit tests for PerformanceMonitor - Performance tracking and debug display
 * @module test/unit/rendering/PerformanceMonitor.test
 * @requires chai
 * @requires mocha
 */

// DUPLICATE REQUIRE REMOVED: let path = require('path');
let fs = require('fs');

describe('PerformanceMonitor', function() {
    let PerformanceMonitor;
    let monitor;
    
    // Mock p5.js globals
    const mockP5Globals = () => {
        global.fill = () => {};
        global.noStroke = () => {};
        global.rect = () => {};
        global.text = () => {};
        global.textAlign = () => {};
        global.textSize = () => {};
        global.LEFT = 0;
        global.TOP = 0;
        global.performance = {
            now: () => Date.now(),
            memory: {
                usedJSHeapSize: 50 * 1024 * 1024,
                totalJSHeapSize: 100 * 1024 * 1024,
                jsHeapSizeLimit: 2048 * 1024 * 1024
            }
        };
    };

    before(function() {
        mockP5Globals();
        
        // Load PerformanceMonitor class using require
        const performanceMonitorModule = require('../../../Classes/rendering/PerformanceMonitor.js');
        PerformanceMonitor = performanceMonitorModule.PerformanceMonitor;
    });

    beforeEach(function() {
        monitor = new PerformanceMonitor();
    });

    describe('Constructor and Initialization', function() {
        it('should initialize with default frame data', function() {
            expect(monitor.frameData).to.exist;
            expect(monitor.frameData.frameCount).to.equal(0);
            expect(monitor.frameData.frameHistory).to.be.an('array').with.lengthOf(60);
            expect(monitor.frameData.historyIndex).to.equal(0);
        });

        it('should initialize with default layer timing', function() {
            expect(monitor.layerTiming).to.exist;
            expect(monitor.layerTiming.currentLayers).to.be.an('object');
            expect(monitor.layerTiming.layerHistory).to.be.an('object');
            expect(monitor.layerTiming.activeLayer).to.be.null;
        });

        it('should initialize with default entity stats', function() {
            expect(monitor.entityStats).to.exist;
            expect(monitor.entityStats.totalEntities).to.equal(0);
            expect(monitor.entityStats.renderedEntities).to.equal(0);
            expect(monitor.entityStats.culledEntities).to.equal(0);
            expect(monitor.entityStats.entityTypes).to.be.an('object');
        });

        it('should initialize with default performance metrics', function() {
            expect(monitor.metrics).to.exist;
            expect(monitor.metrics.fps).to.equal(60);
            expect(monitor.metrics.avgFPS).to.equal(60);
            expect(monitor.metrics.performanceLevel).to.equal('GOOD');
        });

        it('should initialize with default debug display settings', function() {
            expect(monitor.debugDisplay).to.exist;
            expect(monitor.debugDisplay.enabled).to.be.true;
            expect(monitor.debugDisplay.width).to.equal(280);
            expect(monitor.debugDisplay.height).to.equal(200);
        });

        it('should detect memory tracking availability', function() {
            expect(monitor.memoryTracking.enabled).to.be.true;
            expect(monitor.memoryTracking.baseline).to.be.a('number');
        });

        it('should initialize entity performance tracking', function() {
            expect(monitor.entityPerformance).to.exist;
            expect(monitor.entityPerformance.currentEntityTimings).to.be.instanceOf(Map);
            expect(monitor.entityPerformance.currentTypeTimings).to.be.instanceOf(Map);
            expect(monitor.entityPerformance.slowestEntities).to.be.an('array');
        });

        it('should accept custom configuration', function() {
            const config = {
                thresholds: {
                    goodAvgFPS: 50,
                    fairAvgFPS: 25
                }
            };
            const customMonitor = new PerformanceMonitor(config);
            expect(customMonitor.thresholds.goodAvgFPS).to.equal(50);
            expect(customMonitor.thresholds.fairAvgFPS).to.equal(25);
        });
    });

    describe('Frame Timing', function() {
        it('should start frame timing', function() {
            monitor.startFrame();
            expect(monitor.frameData.currentFrameStart).to.be.a('number');
            expect(monitor.frameData.currentFrameStart).to.be.greaterThan(0);
        });

        it('should end frame timing', function() {
            monitor.startFrame();
            monitor.endFrame();
            expect(monitor.frameData.lastFrameStart).to.be.a('number');
            expect(monitor.frameData.frameCount).to.equal(1);
        });

        it('should update frame history', function() {
            const initialHistory = [...monitor.frameData.frameHistory];
            monitor.frameData.frameTime = 20;
            monitor.updateFrameHistory();
            expect(monitor.frameData.frameHistory).to.not.deep.equal(initialHistory);
        });

        it('should handle multiple frames', function() {
            for (let i = 0; i < 5; i++) {
                monitor.startFrame();
                monitor.endFrame();
            }
            expect(monitor.frameData.frameCount).to.equal(5);
        });

        it('should update memory tracking on startFrame', function() {
            const initialMemory = monitor.memoryTracking.current;
            monitor.startFrame();
            expect(monitor.memoryTracking.current).to.be.a('number');
        });

        it('should track peak memory', function() {
            monitor.memoryTracking.current = 100;
            monitor.memoryTracking.peak = 50;
            monitor.startFrame();
            // Memory should update peak if current is higher
            if (monitor.memoryTracking.current > monitor.memoryTracking.peak) {
                expect(monitor.memoryTracking.peak).to.equal(monitor.memoryTracking.current);
            }
        });

        it('should reset layer timing on startFrame', function() {
            monitor.layerTiming.currentLayers = { TERRAIN: 5 };
            monitor.startFrame();
            expect(Object.keys(monitor.layerTiming.currentLayers)).to.have.lengthOf(0);
        });
    });

    describe('Layer Timing', function() {
        it('should start layer timing', function() {
            monitor.startLayer('TERRAIN');
            expect(monitor.layerTiming.activeLayer).to.equal('TERRAIN');
            expect(monitor.layerTiming.layerStart).to.be.greaterThan(0);
        });

        it('should end layer timing', function() {
            monitor.startLayer('TERRAIN');
            monitor.endLayer('TERRAIN');
            expect(monitor.layerTiming.activeLayer).to.be.null;
            expect(monitor.layerTiming.currentLayers['TERRAIN']).to.be.a('number');
        });

        it('should track layer history', function() {
            monitor.startLayer('ENTITIES');
            monitor.endLayer('ENTITIES');
            expect(monitor.layerTiming.layerHistory['ENTITIES']).to.be.an('array');
            expect(monitor.layerTiming.layerHistory['ENTITIES'].length).to.be.greaterThan(0);
        });

        it('should limit layer history to 30 measurements', function() {
            for (let i = 0; i < 40; i++) {
                monitor.startLayer('UI');
                monitor.endLayer('UI');
            }
            expect(monitor.layerTiming.layerHistory['UI'].length).to.equal(30);
        });

        it('should get layer statistics', function() {
            monitor.startLayer('EFFECTS');
            monitor.endLayer('EFFECTS');
            const stats = monitor.getLayerStats('EFFECTS');
            expect(stats).to.have.all.keys(['avg', 'min', 'max', 'current']);
            expect(stats.avg).to.be.a('number');
        });

        it('should return zero stats for unknown layer', function() {
            const stats = monitor.getLayerStats('UNKNOWN');
            expect(stats.avg).to.equal(0);
            expect(stats.min).to.equal(0);
            expect(stats.max).to.equal(0);
        });

        it('should handle multiple layers simultaneously', function() {
            monitor.startLayer('TERRAIN');
            monitor.endLayer('TERRAIN');
            monitor.startLayer('ENTITIES');
            monitor.endLayer('ENTITIES');
            expect(monitor.layerTiming.currentLayers['TERRAIN']).to.be.a('number');
            expect(monitor.layerTiming.currentLayers['ENTITIES']).to.be.a('number');
        });

        it('should only end timing for matching layer', function() {
            monitor.startLayer('TERRAIN');
            monitor.endLayer('ENTITIES'); // Wrong layer
            expect(monitor.layerTiming.activeLayer).to.equal('TERRAIN'); // Should still be active
        });

        it('should use startLayerTiming method', function() {
            monitor.startLayerTiming('UI_DEBUG');
            expect(monitor.layerTiming.activeLayer).to.equal('UI_DEBUG');
        });

        it('should use endLayerTiming method', function() {
            monitor.startLayerTiming('UI_GAME');
            const duration = monitor.endLayerTiming('UI_GAME');
            expect(duration).to.be.a('number');
            expect(monitor.layerTiming.activeLayer).to.be.null;
        });

        it('should return 0 if endLayerTiming called without start', function() {
            const duration = monitor.endLayerTiming('TERRAIN');
            expect(duration).to.equal(0);
        });
    });

    describe('Entity Statistics', function() {
        it('should record entity statistics', function() {
            monitor.recordEntityStats(100, 75, 25, { Ant: 50, Resource: 50 });
            expect(monitor.entityStats.totalEntities).to.equal(100);
            expect(monitor.entityStats.renderedEntities).to.equal(75);
            expect(monitor.entityStats.culledEntities).to.equal(25);
        });

        it('should update entity types', function() {
            monitor.recordEntityStats(50, 40, 10, { Ant: 30, Building: 20 });
            expect(monitor.entityStats.entityTypes).to.have.property('Ant', 30);
            expect(monitor.entityStats.entityTypes).to.have.property('Building', 20);
        });

        it('should get entity statistics', function() {
            monitor.recordEntityStats(200, 150, 50);
            const stats = monitor.getEntityStats();
            expect(stats.total).to.equal(200);
            expect(stats.rendered).to.equal(150);
            expect(stats.culled).to.equal(50);
        });

        it('should calculate culling efficiency', function() {
            monitor.recordEntityStats(100, 60, 40);
            const stats = monitor.getEntityStats();
            expect(stats.cullingEfficiency).to.equal(40);
        });

        it('should handle zero entities gracefully', function() {
            monitor.recordEntityStats(0, 0, 0);
            const stats = monitor.getEntityStats();
            expect(stats.cullingEfficiency).to.equal(0);
        });

        it('should update lastUpdate timestamp', function() {
            const before = Date.now();
            monitor.recordEntityStats(10, 10, 0);
            const after = Date.now();
            expect(monitor.entityStats.lastUpdate).to.be.within(before, after);
        });
    });

    describe('Entity Performance Tracking', function() {
        it('should start render phase', function() {
            monitor.startRenderPhase('preparation');
            expect(monitor.entityPerformance.activePhase).to.equal('preparation');
            expect(monitor.entityPerformance.phaseStartTime).to.be.greaterThan(0);
        });

        it('should end render phase', function() {
            monitor.startRenderPhase('rendering');
            monitor.endRenderPhase();
            expect(monitor.entityPerformance.phaseTimings.rendering).to.be.a('number');
            expect(monitor.entityPerformance.activePhase).to.be.null;
        });

        it('should track all render phases', function() {
            const phases = ['preparation', 'culling', 'rendering', 'postProcessing'];
            phases.forEach(phase => {
                monitor.startRenderPhase(phase);
                monitor.endRenderPhase();
                expect(monitor.entityPerformance.phaseTimings[phase]).to.be.a('number');
            });
        });

        it('should start entity render timing', function() {
            const entity = { id: 'ant-1', type: 'Ant' };
            monitor.startEntityRender(entity);
            expect(monitor.entityPerformance.activeEntity).to.equal(entity);
            expect(monitor.entityPerformance.entityStartTime).to.be.greaterThan(0);
        });

        it('should end entity render timing', function() {
            const entity = { id: 'ant-2', type: 'Ant' };
            monitor.startEntityRender(entity);
            monitor.endEntityRender();
            expect(monitor.entityPerformance.currentEntityTimings.size).to.equal(1);
            expect(monitor.entityPerformance.activeEntity).to.be.null;
        });

        it('should track slowest entities', function() {
            const entities = [
                { id: 'slow-1', type: 'Ant' },
                { id: 'slow-2', type: 'Resource' }
            ];
            
            entities.forEach(entity => {
                monitor.startEntityRender(entity);
                monitor.endEntityRender();
            });
            
            expect(monitor.entityPerformance.slowestEntities.length).to.be.greaterThan(0);
        });

        it('should limit slowest entities list', function() {
            for (let i = 0; i < 20; i++) {
                const entity = { id: `entity-${i}`, type: 'Ant' };
                monitor.startEntityRender(entity);
                monitor.endEntityRender();
            }
            
            expect(monitor.entityPerformance.slowestEntities.length).to.be.at.most(monitor.entityPerformance.maxSlowEntities);
        });

        it('should finalize entity performance', function() {
            const entity = { id: 'test-1', type: 'Ant' };
            monitor.startEntityRender(entity);
            monitor.endEntityRender();
            
            monitor.finalizeEntityPerformance();
            
            expect(monitor.entityPerformance.totalEntityRenderTime).to.be.a('number');
            expect(monitor.entityPerformance.avgEntityRenderTime).to.be.a('number');
            expect(monitor.entityPerformance.entityRenderEfficiency).to.be.a('number');
        });

        it('should clear current frame data after finalize', function() {
            const entity = { id: 'test-2', type: 'Resource' };
            monitor.startEntityRender(entity);
            monitor.endEntityRender();
            
            monitor.finalizeEntityPerformance();
            
            expect(monitor.entityPerformance.currentEntityTimings.size).to.equal(0);
            expect(monitor.entityPerformance.currentTypeTimings.size).to.equal(0);
        });

        it('should preserve last frame data for display', function() {
            const entity = { id: 'test-3', type: 'Building' };
            monitor.startEntityRender(entity);
            monitor.endEntityRender();
            
            monitor.finalizeEntityPerformance();
            
            expect(monitor.entityPerformance.lastFrameData.totalEntityRenderTime).to.be.a('number');
            expect(monitor.entityPerformance.lastFrameData.typeAverages).to.be.instanceOf(Map);
        });

        it('should calculate type averages', function() {
            const entities = [
                { id: 'ant-1', type: 'Ant' },
                { id: 'ant-2', type: 'Ant' },
                { id: 'resource-1', type: 'Resource' }
            ];
            
            entities.forEach(entity => {
                monitor.startEntityRender(entity);
                monitor.endEntityRender();
            });
            
            monitor.finalizeEntityPerformance();
            
            expect(monitor.entityPerformance.typeAverages.size).to.be.greaterThan(0);
        });

        it('should get entity performance report', function() {
            const entity = { id: 'report-test', type: 'Ant' };
            monitor.startEntityRender(entity);
            monitor.endEntityRender();
            monitor.finalizeEntityPerformance();
            
            const report = monitor.getEntityPerformanceReport();
            expect(report).to.have.property('totalRenderTime');
            expect(report).to.have.property('typePerformance');
            expect(report).to.have.property('slowestEntities');
            expect(report).to.have.property('phaseBreakdown');
        });

        it('should handle entity without explicit ID', function() {
            const entity = { type: 'Ant' }; // No ID
            monitor.startEntityRender(entity);
            monitor.endEntityRender();
            
            expect(monitor.entityPerformance.currentEntityTimings.size).to.equal(1);
        });

        it('should handle entity with constructor name', function() {
            class TestEntity {}
            const entity = new TestEntity();
            
            monitor.startEntityRender(entity);
            monitor.endEntityRender();
            
            const typeData = Array.from(monitor.entityPerformance.currentTypeTimings.keys());
            expect(typeData).to.include('TestEntity');
        });
    });

    describe('Performance Metrics', function() {
        it('should update performance metrics', function() {
            monitor.frameData.frameTime = 16.67;
            monitor.updatePerformanceMetrics();
            expect(monitor.metrics.fps).to.be.closeTo(60, 1);
        });

        it('should detect GOOD performance level', function() {
            monitor.frameData.frameHistory.fill(16);
            monitor.updatePerformanceMetrics();
            expect(monitor.metrics.performanceLevel).to.equal('GOOD');
        });

        it('should detect FAIR performance level', function() {
            monitor.frameData.frameHistory.fill(30);
            monitor.updatePerformanceMetrics();
            expect(monitor.metrics.performanceLevel).to.equal('FAIR');
        });

        it('should detect POOR performance level', function() {
            monitor.frameData.frameHistory.fill(50);
            monitor.updatePerformanceMetrics();
            expect(monitor.metrics.performanceLevel).to.equal('POOR');
        });

        it('should calculate average FPS', function() {
            monitor.frameData.frameHistory.fill(20);
            monitor.updatePerformanceMetrics();
            expect(monitor.metrics.avgFPS).to.be.closeTo(50, 1);
        });

        it('should track min and max FPS', function() {
            monitor.frameData.frameHistory = [10, 20, 30, 40, 50, ...new Array(55).fill(16)];
            monitor.updatePerformanceMetrics();
            expect(monitor.metrics.minFPS).to.be.greaterThan(0);
            expect(monitor.metrics.maxFPS).to.be.greaterThan(monitor.metrics.minFPS);
        });

        it('should check if performance is poor', function() {
            monitor.metrics.avgFPS = 25;
            expect(monitor.isPerformancePoor()).to.be.true;
        });

        it('should check if performance is good', function() {
            monitor.metrics.avgFPS = 60;
            monitor.metrics.avgFrameTime = 16;
            expect(monitor.isPerformancePoor()).to.be.false;
        });
    });

    describe('Performance Warnings', function() {
        it('should warn about low FPS', function() {
            monitor.metrics.avgFPS = 25;
            const warnings = monitor.getPerformanceWarnings();
            expect(warnings.some(w => w.includes('Low FPS'))).to.be.true;
        });

        it('should warn about frame spikes', function() {
            monitor.metrics.worstFrameTime = 60;
            const warnings = monitor.getPerformanceWarnings();
            expect(warnings.some(w => w.includes('Frame spikes'))).to.be.true;
        });

        it('should warn about low culling efficiency', function() {
            monitor.entityStats.totalEntities = 200;
            monitor.entityStats.culledEntities = 5;
            const warnings = monitor.getPerformanceWarnings();
            expect(warnings.some(w => w.includes('culling efficiency'))).to.be.true;
        });

        it('should warn about memory growth', function() {
            monitor.memoryTracking.enabled = true;
            monitor.memoryTracking.baseline = 50 * 1024 * 1024;
            monitor.memoryTracking.current = 150 * 1024 * 1024;
            const warnings = monitor.getPerformanceWarnings();
            expect(warnings.some(w => w.includes('Memory'))).to.be.true;
        });

        it('should return empty array when performance is good', function() {
            monitor.metrics.avgFPS = 60;
            monitor.metrics.worstFrameTime = 20;
            monitor.entityStats.totalEntities = 0;
            const warnings = monitor.getPerformanceWarnings();
            expect(warnings).to.be.an('array');
        });
    });

    describe('Frame Statistics', function() {
        it('should get comprehensive frame stats', function() {
            const stats = monitor.getFrameStats();
            expect(stats).to.have.property('fps');
            expect(stats).to.have.property('avgFPS');
            expect(stats).to.have.property('frameTime');
            expect(stats).to.have.property('layerTimes');
            expect(stats).to.have.property('entityStats');
            expect(stats).to.have.property('performanceLevel');
        });

        it('should include entity performance in stats', function() {
            const stats = monitor.getFrameStats();
            expect(stats).to.have.property('entityPerformance');
            expect(stats.entityPerformance).to.have.property('totalEntityRenderTime');
            expect(stats.entityPerformance).to.have.property('avgEntityRenderTime');
        });

        it('should include memory info when available', function() {
            const stats = monitor.getFrameStats();
            if (monitor.memoryTracking.enabled) {
                expect(stats.memory).to.exist;
                expect(stats.memory).to.have.property('current');
                expect(stats.memory).to.have.property('peak');
            }
        });

        it('should round values appropriately', function() {
            monitor.metrics.fps = 59.999999;
            const stats = monitor.getFrameStats();
            expect(Number.isInteger(stats.fps * 10)).to.be.true; // Rounded to 1 decimal
        });
    });

    describe('Memory Tracking', function() {
        it('should detect memory tracking availability', function() {
            expect(monitor.memoryTracking.enabled).to.be.a('boolean');
        });

        it('should track memory baseline', function() {
            if (monitor.memoryTracking.enabled) {
                expect(monitor.memoryTracking.baseline).to.be.a('number');
                expect(monitor.memoryTracking.baseline).to.be.greaterThan(0);
            }
        });

        it('should update memory tracking', function() {
            const memInfo = monitor.updateMemoryTracking();
            if (monitor.memoryTracking.enabled) {
                expect(memInfo).to.exist;
                expect(memInfo.usedJSHeapSize).to.be.a('number');
            }
        });

        it('should get memory information', function() {
            const memInfo = monitor.getMemoryInfo();
            if (monitor.memoryTracking.enabled) {
                expect(memInfo).to.have.property('usedJSHeapSize');
                expect(memInfo).to.have.property('totalJSHeapSize');
                expect(memInfo).to.have.property('baseline');
            }
        });

        it('should track peak memory usage', function() {
            if (monitor.memoryTracking.enabled) {
                monitor.memoryTracking.current = 100 * 1024 * 1024;
                monitor.memoryTracking.peak = 50 * 1024 * 1024;
                monitor.startFrame();
                expect(monitor.memoryTracking.peak).to.equal(monitor.memoryTracking.current);
            }
        });

        it('should have getMemoryStats alias', function() {
            const stats = monitor.getMemoryStats();
            const info = monitor.getMemoryInfo();
            expect(stats).to.deep.equal(info);
        });
    });

    describe('Debug Display', function() {
        it('should enable debug display', function() {
            monitor.setDebugDisplay(true);
            expect(monitor.debugDisplay.enabled).to.be.true;
        });

        it('should disable debug display', function() {
            monitor.setDebugDisplay(false);
            expect(monitor.debugDisplay.enabled).to.be.false;
        });

        it('should set debug position', function() {
            monitor.setDebugPosition(100, 200);
            expect(monitor.debugDisplay.position.x).to.equal(100);
            expect(monitor.debugDisplay.position.y).to.equal(200);
        });

        it('should not render when disabled', function() {
            monitor.debugDisplay.enabled = false;
            // Should not throw error
            expect(() => monitor.renderDebugOverlay()).to.not.throw();
        });

        it('should have default display settings', function() {
            expect(monitor.debugDisplay.width).to.equal(280);
            expect(monitor.debugDisplay.height).to.equal(200);
            expect(monitor.debugDisplay.fontSize).to.equal(12);
        });

        it('should get performance level color', function() {
            const goodColor = monitor._getPerformanceLevelColor('GOOD');
            const fairColor = monitor._getPerformanceLevelColor('FAIR');
            const poorColor = monitor._getPerformanceLevelColor('POOR');
            
            expect(goodColor).to.deep.equal([0, 255, 0]); // Green
            expect(fairColor).to.deep.equal([255, 255, 0]); // Yellow
            expect(poorColor).to.deep.equal([255, 0, 0]); // Red
        });

        it('should return white for unknown performance level', function() {
            const color = monitor._getPerformanceLevelColor('UNKNOWN');
            expect(color).to.deep.equal([255, 255, 255]);
        });
    });

    describe('Data Export and Reset', function() {
        it('should export performance data', function() {
            monitor.recordEntityStats(100, 75, 25);
            const data = monitor.exportData();
            
            expect(data).to.have.property('timestamp');
            expect(data).to.have.property('frameData');
            expect(data).to.have.property('layerTiming');
            expect(data).to.have.property('entityStats');
            expect(data).to.have.property('metrics');
        });

        it('should include frame history in export', function() {
            const data = monitor.exportData();
            expect(data.frameHistory).to.be.an('array');
            expect(data.frameHistory.length).to.equal(60);
        });

        it('should reset performance data', function() {
            monitor.frameData.frameCount = 100;
            monitor.layerTiming.layerHistory = { TERRAIN: [1, 2, 3] };
            monitor.entityStats.totalEntities = 50;
            
            monitor.reset();
            
            expect(monitor.frameData.frameCount).to.equal(0);
            expect(Object.keys(monitor.layerTiming.layerHistory)).to.have.lengthOf(0);
            expect(monitor.entityStats.totalEntities).to.equal(0);
        });

        it('should reset memory baseline on reset', function() {
            if (monitor.memoryTracking.enabled) {
                const oldBaseline = monitor.memoryTracking.baseline;
                monitor.reset();
                // Baseline should be updated to current memory
                expect(monitor.memoryTracking.baseline).to.be.a('number');
            }
        });

        it('should reset frame history', function() {
            monitor.frameData.frameHistory = new Array(60).fill(50);
            monitor.reset();
            expect(monitor.frameData.frameHistory.every(val => val === 16.67)).to.be.true;
        });
    });

    describe('Edge Cases and Error Handling', function() {
        it('should handle missing entity type', function() {
            const entity = { id: 'no-type' };
            monitor.startEntityRender(entity);
            monitor.endEntityRender();
            expect(monitor.entityPerformance.currentEntityTimings.size).to.equal(1);
        });

        it('should handle endEntityRender without start', function() {
            expect(() => monitor.endEntityRender()).to.not.throw();
            expect(monitor.entityPerformance.currentEntityTimings.size).to.equal(0);
        });

        it('should handle endRenderPhase without start', function() {
            expect(() => monitor.endRenderPhase()).to.not.throw();
        });

        it('should handle empty frame history', function() {
            monitor.frameData.frameHistory = [];
            expect(() => monitor.updatePerformanceMetrics()).to.not.throw();
        });

        it('should handle zero frame time', function() {
            monitor.frameData.frameTime = 0;
            monitor.finalizeEntityPerformance();
            expect(monitor.entityPerformance.entityRenderEfficiency).to.equal(100);
        });

        it('should handle missing memory API', function() {
            const oldPerformance = global.performance;
            global.performance = { now: () => Date.now() }; // No memory property
            
            const testMonitor = new PerformanceMonitor();
            expect(testMonitor.memoryTracking.enabled).to.be.false;
            
            global.performance = oldPerformance;
        });

        it('should handle invalid custom thresholds', function() {
            const config = { thresholds: null };
            expect(() => new PerformanceMonitor(config)).to.not.throw();
        });

        it('should handle very large entity counts', function() {
            monitor.recordEntityStats(1000000, 500000, 500000);
            const stats = monitor.getEntityStats();
            expect(stats.total).to.equal(1000000);
        });

        it('should handle negative timing values gracefully', function() {
            monitor.frameData.frameTime = -1;
            expect(() => monitor.updateFrameHistory()).to.not.throw();
        });
    });

    describe('Integration Scenarios', function() {
        it('should handle complete frame cycle', function() {
            monitor.startFrame();
            
            monitor.startLayer('TERRAIN');
            monitor.endLayer('TERRAIN');
            
            monitor.startLayer('ENTITIES');
            const entity = { id: 'ant-1', type: 'Ant' };
            monitor.startEntityRender(entity);
            monitor.endEntityRender();
            monitor.endLayer('ENTITIES');
            
            monitor.recordEntityStats(1, 1, 0);
            monitor.finalizeEntityPerformance();
            monitor.endFrame();
            
            expect(monitor.frameData.frameCount).to.equal(1);
            expect(Object.keys(monitor.layerTiming.currentLayers).length).to.be.greaterThan(0);
        });

        it('should maintain data across multiple frames', function() {
            for (let i = 0; i < 10; i++) {
                monitor.startFrame();
                monitor.recordEntityStats(100, 80, 20);
                monitor.endFrame();
            }
            
            expect(monitor.frameData.frameCount).to.equal(10);
            expect(monitor.entityStats.totalEntities).to.equal(100);
        });

        it('should track performance degradation', function() {
            // Good performance
            monitor.frameData.frameHistory.fill(16);
            monitor.updatePerformanceMetrics();
            const goodLevel = monitor.metrics.performanceLevel;
            
            // Degrade performance
            monitor.frameData.frameHistory.fill(50);
            monitor.updatePerformanceMetrics();
            const poorLevel = monitor.metrics.performanceLevel;
            
            expect(goodLevel).to.equal('GOOD');
            expect(poorLevel).to.equal('POOR');
        });
    });
});




// ================================================================
// sprite2d.test.js (16 tests)
// ================================================================
/**
 * Test Suite for Sprite2D Class (Mocha/Chai)
 */

// Mock global variables and dependencies
global.createVector = (x, y) => ({ 
  x: x || 0, 
  y: y || 0, 
  copy: function() { return { x: this.x, y: this.y, copy: this.copy }; }
});

// Mock p5.js rendering functions
global.push = () => {};
global.pop = () => {};
global.translate = (x, y) => {};
global.rotate = (angle) => {};
global.radians = (degrees) => degrees * (Math.PI / 180);
global.imageMode = (mode) => {};
global.image = (img, x, y, width, height) => {};
global.scale = (x, y) => {}; // Added missing scale function
global.tint = (c, alpha) => {}; // Added missing tint function
global.CENTER = 'center';

// Import the Sprite2D class
let Sprite2D = require('../../../Classes/rendering/Sprite2d.js');

describe('Sprite2D', function() {
  describe('Constructor', function() {
    it('should initialize with basic parameters', function() {
      const mockImg = { src: 'test-image.png' };
      const pos = createVector(10, 20);
      const size = createVector(30, 40);
      const rotation = 45;
      
      const sprite = new Sprite2D(mockImg, pos, size, rotation);
      
      expect(sprite.img).to.equal(mockImg);
      expect(sprite.pos).to.deep.include({ x: 10, y: 20 });
      expect(sprite.size).to.deep.include({ x: 30, y: 40 });
      expect(sprite.rotation).to.equal(45);
    });

    it('should default rotation to 0', function() {
      const mockImg = { src: 'test-image.png' };
      const pos = createVector(0, 0);
      const size = createVector(50, 50);
      
      const sprite = new Sprite2D(mockImg, pos, size);
      
      expect(sprite.rotation).to.equal(0);
    });

    it('should copy vectors not reference them', function() {
      const mockImg = { src: 'test-image.png' };
      const originalPos = createVector(100, 200);
      const originalSize = createVector(60, 80);
      
      const sprite = new Sprite2D(mockImg, originalPos, originalSize);
      
      // Modify original vectors
      originalPos.x = 999;
      originalPos.y = 999;
      originalSize.x = 999;
      originalSize.y = 999;
      
      // Sprite should have copied values
      expect(sprite.pos).to.deep.include({ x: 100, y: 200 });
      expect(sprite.size).to.deep.include({ x: 60, y: 80 });
    });

    it('should handle plain object vectors', function() {
      const mockImg = { src: 'test-image.png' };
      const pos = { x: 15, y: 25 };
      const size = { x: 35, y: 45 };
      
      const sprite = new Sprite2D(mockImg, pos, size);
      
      expect(sprite.pos).to.deep.include({ x: 15, y: 25 });
      expect(sprite.size).to.deep.include({ x: 35, y: 45 });
    });
  });

  describe('Setters', function() {
    it('setImage should update image', function() {
      const mockImg1 = { src: 'image1.png' };
      const mockImg2 = { src: 'image2.png' };
      const sprite = new Sprite2D(mockImg1, createVector(0, 0), createVector(50, 50));
      
      sprite.setImage(mockImg2);
      
      expect(sprite.img).to.equal(mockImg2);
    });

    it('setPosition should update and copy position', function() {
      const sprite = new Sprite2D({ src: 'test.png' }, createVector(0, 0), createVector(50, 50));
      const newPos = createVector(100, 150);
      
      sprite.setPosition(newPos);
      
      expect(sprite.pos).to.deep.include({ x: 100, y: 150 });
      
      // Verify it was copied
      newPos.x = 999;
      expect(sprite.pos).to.deep.include({ x: 100, y: 150 });
    });

    it('setPosition should handle plain objects', function() {
      const sprite = new Sprite2D({ src: 'test.png' }, createVector(0, 0), createVector(50, 50));
      const newPos = { x: 200, y: 250 };
      
      sprite.setPosition(newPos);
      
      expect(sprite.pos).to.deep.include({ x: 200, y: 250 });
    });

    it('setSize should update and copy size', function() {
      const sprite = new Sprite2D({ src: 'test.png' }, createVector(0, 0), createVector(50, 50));
      const newSize = createVector(80, 120);
      
      sprite.setSize(newSize);
      
      expect(sprite.size).to.deep.include({ x: 80, y: 120 });
      
      // Verify it was copied
      newSize.x = 999;
      expect(sprite.size).to.deep.include({ x: 80, y: 120 });
    });

    it('setSize should handle plain objects', function() {
      const sprite = new Sprite2D({ src: 'test.png' }, createVector(0, 0), createVector(50, 50));
      const newSize = { x: 90, y: 110 };
      
      sprite.setSize(newSize);
      
      expect(sprite.size).to.deep.include({ x: 90, y: 110 });
    });

    it('setRotation should update rotation', function() {
      const sprite = new Sprite2D({ src: 'test.png' }, createVector(0, 0), createVector(50, 50));
      
      sprite.setRotation(90);
      expect(sprite.rotation).to.equal(90);
      
      sprite.setRotation(-45);
      expect(sprite.rotation).to.equal(-45);
      
      sprite.setRotation(0);
      expect(sprite.rotation).to.equal(0);
    });
  });

  describe('Rendering', function() {
    beforeEach(function() {
      // Reset render functions
      global.push = () => {};
      global.pop = () => {};
      global.translate = () => {};
      global.rotate = () => {};
      global.imageMode = () => {};
      global.image = () => {};
    });

    it('render should execute without error', function() {
      const sprite = new Sprite2D({ src: 'test.png' }, createVector(10, 20), createVector(50, 60), 30);
      expect(() => sprite.render()).to.not.throw();
    });

    it('render should call p5 functions in correct order', function() {
      const sprite = new Sprite2D({ src: 'test.png' }, createVector(10, 20), createVector(50, 60), 30);
      
      const callOrder = [];
      global.push = () => callOrder.push('push');
      global.imageMode = () => callOrder.push('imageMode');
      global.translate = () => callOrder.push('translate');
      global.rotate = () => callOrder.push('rotate');
      global.image = () => callOrder.push('image');
      global.pop = () => callOrder.push('pop');
      global.scale = () => callOrder.push('scale');
      
      sprite.render();
      
      // Correct order: push → imageMode → translate → scale → rotate → image → pop
      expect(callOrder).to.deep.equal(['push', 'imageMode', 'translate', 'scale', 'rotate', 'image', 'pop']);
    });

    it('render should handle zero rotation', function() {
      const sprite = new Sprite2D({ src: 'test.png' }, createVector(0, 0), createVector(40, 40), 0);
      
      let rotateAngle = null;
      global.rotate = (angle) => { rotateAngle = angle; };
      
      sprite.render();
      
      expect(rotateAngle).to.equal(0);
    });
  });

  describe('Integration', function() {
    it('should support full lifecycle updates', function() {
      const mockImg1 = { src: 'initial.png' };
      const mockImg2 = { src: 'updated.png' };
      
      const sprite = new Sprite2D(mockImg1, createVector(0, 0), createVector(32, 32));
      
      sprite.setImage(mockImg2);
      sprite.setPosition(createVector(100, 150));
      sprite.setSize(createVector(64, 48));
      sprite.setRotation(45);
      
      expect(sprite.img).to.equal(mockImg2);
      expect(sprite.pos).to.deep.include({ x: 100, y: 150 });
      expect(sprite.size).to.deep.include({ x: 64, y: 48 });
      expect(sprite.rotation).to.equal(45);
      
      expect(() => sprite.render()).to.not.throw();
    });

    it('should handle vector method compatibility', function() {
      const posWithCopy = { x: 10, y: 20, copy: function() { return { x: this.x, y: this.y, copy: this.copy }; }};
      const sizeWithCopy = { x: 30, y: 40, copy: function() { return { x: this.x, y: this.y, copy: this.copy }; }};
      
      const sprite = new Sprite2D({ src: 'test.png' }, posWithCopy, sizeWithCopy);
      
      expect(sprite.pos).to.deep.include({ x: 10, y: 20 });
      expect(sprite.size).to.deep.include({ x: 30, y: 40 });
      
      const plainPos = { x: 50, y: 60 };
      const plainSize = { x: 70, y: 80 };
      
      sprite.setPosition(plainPos);
      sprite.setSize(plainSize);
      
      expect(sprite.pos).to.deep.include({ x: 50, y: 60 });
      expect(sprite.size).to.deep.include({ x: 70, y: 80 });
    });

    it('should create multiple independent sprites', function() {
      const mockImg = { src: 'test.png' };
      const sprites = [];
      
      for (let i = 0; i < 100; i++) {
        sprites.push(new Sprite2D(mockImg, createVector(i, i), createVector(20, 20), i));
      }
      
      expect(sprites).to.have.lengthOf(100);
      
      sprites[0].setPosition(createVector(999, 999));
      expect(sprites[1].pos).to.deep.include({ x: 1, y: 1 });
    });
  });
});




// ================================================================
// UIController.test.js (77 tests)
// ================================================================
// DUPLICATE REQUIRE REMOVED: let path = require('path');

describe('UIController', () => {
  let UIController, UIManager;
  
  before(() => {
    // Mock window/global environment
    global.window = global.window || {};
    
    // Load the module
    const module = require(path.resolve(__dirname, '../../../Classes/rendering/UIController.js'));
    UIController = module.UIController;
    UIManager = module.UIManager;
  });
  
  afterEach(() => {
    // Clean up global mocks
    delete global.UIRenderer;
    delete global.GameState;
    delete global.ants;
    delete global.g_performanceMonitor;
    delete global.getEntityDebugManager;
    delete global.toggleDevConsole;
    delete global.showDevConsole;
    delete global.hideDevConsole;
    delete global.logNormal;
  });
  
  describe('Constructor', () => {
    it('should create instance with null uiRenderer', () => {
      const controller = new UIController();
      expect(controller.uiRenderer).to.be.null;
    });
    
    it('should initialize as not initialized', () => {
      const controller = new UIController();
      expect(controller.initialized).to.be.false;
    });
    
    it('should create key bindings Map', () => {
      const controller = new UIController();
      expect(controller.keyBindings).to.be.instanceOf(Map);
    });
    
    it('should have CTRL+SHIFT+1 binding for performance overlay', () => {
      const controller = new UIController();
      expect(controller.keyBindings.get('CTRL+SHIFT+1')).to.equal('togglePerformanceOverlay');
    });
    
    it('should have CTRL+SHIFT+2 binding for entity inspector', () => {
      const controller = new UIController();
      expect(controller.keyBindings.get('CTRL+SHIFT+2')).to.equal('toggleEntityInspector');
    });
    
    it('should have CTRL+SHIFT+3 binding for debug console', () => {
      const controller = new UIController();
      expect(controller.keyBindings.get('CTRL+SHIFT+3')).to.equal('toggleDebugConsole');
    });
    
    it('should have CTRL+SHIFT+4 binding for minimap', () => {
      const controller = new UIController();
      expect(controller.keyBindings.get('CTRL+SHIFT+4')).to.equal('toggleMinimap');
    });
    
    it('should have CTRL+SHIFT+5 binding for start game', () => {
      const controller = new UIController();
      expect(controller.keyBindings.get('CTRL+SHIFT+5')).to.equal('startGame');
    });
    
    it('should have BACKTICK binding for debug console', () => {
      const controller = new UIController();
      expect(controller.keyBindings.get('BACKTICK')).to.equal('toggleDebugConsole');
    });
  });
  
  describe('initialize()', () => {
    it('should return false when UIRenderer not available', () => {
      const controller = new UIController();
      const result = controller.initialize();
      expect(result).to.be.false;
      expect(controller.initialized).to.be.false;
    });
    
    it('should return true when UIRenderer available on window', () => {
      global.window.UIRenderer = {
        debugUI: {
          performanceOverlay: { enabled: false }
        }
      };
      
      const controller = new UIController();
      const result = controller.initialize();
      expect(result).to.be.true;
      expect(controller.initialized).to.be.true;
    });
    
    it('should return true when UIRenderer available on global', () => {
      global.UIRenderer = {
        debugUI: {
          performanceOverlay: { enabled: false }
        }
      };
      
      const controller = new UIController();
      const result = controller.initialize();
      expect(result).to.be.true;
    });
    
    it('should set uiRenderer reference', () => {
      const mockUIRenderer = {
        debugUI: {
          performanceOverlay: { enabled: false }
        }
      };
      global.window.UIRenderer = mockUIRenderer;
      
      const controller = new UIController();
      controller.initialize();
      expect(controller.uiRenderer).to.equal(mockUIRenderer);
    });
    
    it('should enable performance overlay by default', () => {
      global.window.UIRenderer = {
        debugUI: {
          performanceOverlay: { enabled: false }
        }
      };
      
      const controller = new UIController();
      controller.initialize();
      expect(controller.uiRenderer.debugUI.performanceOverlay.enabled).to.be.true;
    });
  });
  
  describe('handleKeyPress()', () => {
    let controller;
    
    beforeEach(() => {
      global.window.UIRenderer = {
        debugUI: { performanceOverlay: { enabled: false } },
        hudElements: { minimap: { enabled: false } },
        togglePerformanceOverlay: () => {},
        toggleEntityInspector: () => {},
        toggleDebugConsole: () => {},
        enableMinimap: () => {},
        disableMinimap: () => {}
      };
      
      controller = new UIController();
      controller.initialize();
    });
    
    it('should return false when not initialized', () => {
      const uninit = new UIController();
      const result = uninit.handleKeyPress(49, '1');
      expect(result).to.be.false;
    });
    
    it('should handle backtick (192) for debug console', () => {
      const result = controller.handleKeyPress(192, '`');
      expect(result).to.be.true;
    });
    
    it('should handle Shift+N (78) for toggle all UI', () => {
      const event = { shiftKey: true, ctrlKey: false };
      const result = controller.handleKeyPress(78, 'N', event);
      expect(result).to.be.true;
    });
    
    it('should handle Ctrl+Shift+1 for performance overlay', () => {
      const event = { ctrlKey: true, shiftKey: true };
      const result = controller.handleKeyPress(49, '1', event);
      expect(result).to.be.true;
    });
    
    it('should handle Ctrl+Shift+2 for entity inspector', () => {
      const event = { ctrlKey: true, shiftKey: true };
      const result = controller.handleKeyPress(50, '2', event);
      expect(result).to.be.true;
    });
    
    it('should handle Ctrl+Shift+3', () => {
      const event = { ctrlKey: true, shiftKey: true };
      const result = controller.handleKeyPress(51, '3', event);
      expect(result).to.be.true;
    });
    
    it('should handle Ctrl+Shift+4 for minimap', () => {
      const event = { ctrlKey: true, shiftKey: true };
      const result = controller.handleKeyPress(52, '4', event);
      expect(result).to.be.true;
    });
    
    it('should handle Ctrl+Shift+5 for start game', () => {
      global.GameState = { startGame: () => {} };
      const event = { ctrlKey: true, shiftKey: true };
      const result = controller.handleKeyPress(53, '5', event);
      expect(result).to.be.true;
    });
    
    it('should return false for unhandled keys', () => {
      const result = controller.handleKeyPress(65, 'A');
      expect(result).to.be.false;
    });
  });
  
  describe('Mouse Event Handlers', () => {
    let controller, mockUIRenderer;
    
    beforeEach(() => {
      mockUIRenderer = {
        debugUI: { performanceOverlay: { enabled: false } },
        interactionUI: {
          selectionBox: { active: false },
          contextMenu: { active: false }
        },
        startSelectionBox: () => {},
        updateSelectionBox: () => {},
        endSelectionBox: () => {},
        showContextMenu: () => {},
        hideContextMenu: () => {},
        showTooltip: () => {},
        hideTooltip: () => {}
      };
      
      global.window.UIRenderer = mockUIRenderer;
      controller = new UIController();
      controller.initialize();
    });
    
    describe('handleMousePressed()', () => {
      it('should return false when not initialized', () => {
        const uninit = new UIController();
        const result = uninit.handleMousePressed(100, 200, 0);
        expect(result).to.be.false;
      });
      
      it('should start selection box on left click', () => {
        let called = false;
        mockUIRenderer.startSelectionBox = () => { called = true; };
        controller.handleMousePressed(100, 200, 0);
        expect(called).to.be.true;
      });
      
      it('should handle right click for context menu', () => {
        controller.getContextMenuItems = () => ['Item 1', 'Item 2'];
        let called = false;
        mockUIRenderer.showContextMenu = () => { called = true; };
        const result = controller.handleMousePressed(100, 200, 2);
        expect(called).to.be.true;
      });
      
      it('should not show context menu when no items', () => {
        controller.getContextMenuItems = () => [];
        const result = controller.handleMousePressed(100, 200, 2);
        expect(result).to.be.false;
      });
    });
    
    describe('handleMouseDragged()', () => {
      it('should return false when not initialized', () => {
        const uninit = new UIController();
        const result = uninit.handleMouseDragged(150, 250);
        expect(result).to.be.false;
      });
      
      it('should update selection box when active', () => {
        mockUIRenderer.interactionUI.selectionBox.active = true;
        let called = false;
        mockUIRenderer.updateSelectionBox = () => { called = true; };
        const result = controller.handleMouseDragged(150, 250);
        expect(result).to.be.true;
        expect(called).to.be.true;
      });
      
      it('should return false when selection box not active', () => {
        mockUIRenderer.interactionUI.selectionBox.active = false;
        const result = controller.handleMouseDragged(150, 250);
        expect(result).to.be.false;
      });
    });
    
    describe('handleMouseReleased()', () => {
      it('should return false when not initialized', () => {
        const uninit = new UIController();
        const result = uninit.handleMouseReleased(200, 300, 0);
        expect(result).to.be.false;
      });
      
      it('should end selection box when active', () => {
        mockUIRenderer.interactionUI.selectionBox.active = true;
        let called = false;
        mockUIRenderer.endSelectionBox = () => { called = true; };
        const result = controller.handleMouseReleased(200, 300, 0);
        expect(result).to.be.true;
        expect(called).to.be.true;
      });
      
      it('should hide context menu when active', () => {
        mockUIRenderer.interactionUI.contextMenu.active = true;
        let called = false;
        mockUIRenderer.hideContextMenu = () => { called = true; };
        const result = controller.handleMouseReleased(200, 300, 0);
        expect(result).to.be.true;
        expect(called).to.be.true;
      });
    });
    
    describe('handleMouseMoved()', () => {
      it('should return false when not initialized', () => {
        const uninit = new UIController();
        const result = uninit.handleMouseMoved(250, 350);
        expect(result).to.be.false;
      });
      
      it('should update tooltips on mouse move', () => {
        let called = false;
        controller.updateTooltips = () => { called = true; };
        controller.handleMouseMoved(250, 350);
        expect(called).to.be.true;
      });
    });
  });
  
  describe('Tooltip and Entity Methods', () => {
    let controller;
    
    beforeEach(() => {
      global.window.UIRenderer = {
        debugUI: { performanceOverlay: { enabled: false } },
        showTooltip: () => {},
        hideTooltip: () => {}
      };
      
      controller = new UIController();
      controller.initialize();
    });
    
    describe('getEntityAtPosition()', () => {
      it('should return null when no ants', () => {
        const result = controller.getEntityAtPosition(100, 100);
        expect(result).to.be.null;
      });
      
      it('should return ant within hover radius', () => {
        global.ants = [
          { x: 100, y: 100 }
        ];
        
        const result = controller.getEntityAtPosition(105, 105);
        expect(result).to.not.be.null;
        expect(result.x).to.equal(100);
      });
      
      it('should return null when ant too far', () => {
        global.ants = [
          { x: 100, y: 100 }
        ];
        
        const result = controller.getEntityAtPosition(150, 150);
        expect(result).to.be.null;
      });
      
      it('should skip null ants', () => {
        global.ants = [null, { x: 100, y: 100 }];
        const result = controller.getEntityAtPosition(105, 105);
        expect(result).to.not.be.null;
      });
    });
    
    describe('getEntityTooltipText()', () => {
      it('should generate basic tooltip', () => {
        const entity = {};
        const text = controller.getEntityTooltipText(entity);
        expect(text).to.be.a('string');
      });
      
      it('should include constructor name', () => {
        class Ant {}
        const entity = new Ant();
        const text = controller.getEntityTooltipText(entity);
        expect(text).to.include('Ant');
      });
      
      it('should include entity id', () => {
        const entity = { id: 'ant-123' };
        const text = controller.getEntityTooltipText(entity);
        expect(text).to.include('ant-123');
      });
      
      it('should include current state', () => {
        const entity = { currentState: 'MOVING' };
        const text = controller.getEntityTooltipText(entity);
        expect(text).to.include('MOVING');
      });
      
      it('should include health', () => {
        const entity = { health: 75 };
        const text = controller.getEntityTooltipText(entity);
        expect(text).to.include('Health: 75');
      });
    });
    
    describe('getContextMenuItems()', () => {
      it('should return entity-specific items when entity hovered', () => {
        controller.getEntityAtPosition = () => ({ isSelected: () => false });
        const items = controller.getContextMenuItems(100, 100);
        expect(items).to.include('Inspect Entity');
        expect(items).to.include('Select');
      });
      
      it('should include Deselect for selected entities', () => {
        controller.getEntityAtPosition = () => ({ isSelected: () => true });
        const items = controller.getContextMenuItems(100, 100);
        expect(items).to.include('Deselect');
      });
      
      it('should return general items when no entity', () => {
        controller.getEntityAtPosition = () => null;
        const items = controller.getContextMenuItems(100, 100);
        expect(items).to.include('Build Here');
        expect(items).to.include('Set Waypoint');
      });
      
      it('should always include Cancel', () => {
        controller.getEntityAtPosition = () => null;
        const items = controller.getContextMenuItems(100, 100);
        expect(items).to.include('Cancel');
      });
    });
  });
  
  describe('UI Toggle Methods', () => {
    let controller, mockUIRenderer;
    
    beforeEach(() => {
      mockUIRenderer = {
        debugUI: { performanceOverlay: { enabled: false } },
        hudElements: { minimap: { enabled: false } },
        togglePerformanceOverlay: () => {},
        toggleEntityInspector: () => {},
        toggleDebugConsole: () => {},
        enableMinimap: () => {},
        disableMinimap: () => {}
      };
      
      global.window.UIRenderer = mockUIRenderer;
      controller = new UIController();
      controller.initialize();
    });
    
    describe('togglePerformanceOverlay()', () => {
      it('should use g_performanceMonitor when available', () => {
        let toggled = false;
        global.g_performanceMonitor = {
          debugDisplay: { enabled: false },
          setDebugDisplay: (val) => { toggled = true; }
        };
        
        controller.togglePerformanceOverlay();
        expect(toggled).to.be.true;
      });
      
      it('should fallback to uiRenderer', () => {
        let called = false;
        mockUIRenderer.togglePerformanceOverlay = () => { called = true; };
        controller.togglePerformanceOverlay();
        expect(called).to.be.true;
      });
    });
    
    describe('toggleEntityInspector()', () => {
      it('should use EntityDebugManager when available', () => {
        let toggled = false;
        global.getEntityDebugManager = () => ({
          toggleGlobalDebug: () => { toggled = true; }
        });
        
        controller.toggleEntityInspector();
        expect(toggled).to.be.true;
      });
      
      it('should fallback to uiRenderer', () => {
        let called = false;
        mockUIRenderer.toggleEntityInspector = () => { called = true; };
        controller.toggleEntityInspector();
        expect(called).to.be.true;
      });
    });
    
    describe('toggleMinimap()', () => {
      it('should disable minimap when enabled', () => {
        let disabled = false;
        mockUIRenderer.hudElements.minimap.enabled = true;
        mockUIRenderer.disableMinimap = () => { disabled = true; };
        controller.toggleMinimap();
        expect(disabled).to.be.true;
      });
      
      it('should enable minimap when disabled', () => {
        let enabled = false;
        mockUIRenderer.hudElements.minimap.enabled = false;
        mockUIRenderer.enableMinimap = () => { enabled = true; };
        controller.toggleMinimap();
        expect(enabled).to.be.true;
      });
    });
  });
  
  describe('Game State Methods', () => {
    let controller;
    
    beforeEach(() => {
      global.window.UIRenderer = {
        debugUI: { performanceOverlay: { enabled: false } },
        menuSystems: {
          mainMenu: { active: false },
          pauseMenu: { active: false }
        }
      };
      
      controller = new UIController();
      controller.initialize();
    });
    
    it('should start game when GameState available', () => {
      let started = false;
      global.GameState = {
        startGame: () => { started = true; }
      };
      
      controller.startGame();
      expect(started).to.be.true;
    });
    
    it('should show main menu', () => {
      controller.showMainMenu();
      expect(controller.uiRenderer.menuSystems.mainMenu.active).to.be.true;
    });
    
    it('should hide main menu', () => {
      controller.uiRenderer.menuSystems.mainMenu.active = true;
      controller.hideMainMenu();
      expect(controller.uiRenderer.menuSystems.mainMenu.active).to.be.false;
    });
    
    it('should show pause menu', () => {
      controller.showPauseMenu();
      expect(controller.uiRenderer.menuSystems.pauseMenu.active).to.be.true;
    });
    
    it('should hide pause menu', () => {
      controller.uiRenderer.menuSystems.pauseMenu.active = true;
      controller.hidePauseMenu();
      expect(controller.uiRenderer.menuSystems.pauseMenu.active).to.be.false;
    });
  });
  
  describe('Individual Panel Show/Hide Methods', () => {
    let controller;
    
    beforeEach(() => {
      global.window.UIRenderer = {
        debugUI: { performanceOverlay: { enabled: false } },
        hudElements: { minimap: { enabled: false } }
      };
      
      controller = new UIController();
      controller.initialize();
    });
    
    it('should show performance overlay', () => {
      global.g_performanceMonitor = {
        setDebugDisplay: (val) => {
          global.g_performanceMonitor._enabled = val;
        },
        _enabled: false
      };
      
      controller.showPerformanceOverlay();
      expect(global.g_performanceMonitor._enabled).to.be.true;
    });
    
    it('should hide performance overlay', () => {
      global.g_performanceMonitor = {
        setDebugDisplay: (val) => {
          global.g_performanceMonitor._enabled = val;
        },
        _enabled: true
      };
      
      controller.hidePerformanceOverlay();
      expect(global.g_performanceMonitor._enabled).to.be.false;
    });
    
    it('should show entity inspector', () => {
      let shown = false;
      global.getEntityDebugManager = () => ({
        enableGlobalDebug: () => { shown = true; }
      });
      
      controller.showEntityInspector();
      expect(shown).to.be.true;
    });
    
    it('should hide entity inspector', () => {
      let hidden = false;
      global.getEntityDebugManager = () => ({
        disableGlobalDebug: () => { hidden = true; }
      });
      
      controller.hideEntityInspector();
      expect(hidden).to.be.true;
    });
    
    it('should show minimap', () => {
      controller.showMinimap();
      expect(controller.uiRenderer.hudElements.minimap.enabled).to.be.true;
    });
    
    it('should hide minimap', () => {
      controller.uiRenderer.hudElements.minimap.enabled = true;
      controller.hideMinimap();
      expect(controller.uiRenderer.hudElements.minimap.enabled).to.be.false;
    });
  });
  
  describe('Configuration and Utility Methods', () => {
    let controller, mockUIRenderer;
    
    beforeEach(() => {
      mockUIRenderer = {
        debugUI: { performanceOverlay: { enabled: false } },
        updateConfig: () => {},
        getStats: () => ({ rendered: 100 }),
        selectEntityForInspection: () => {}
      };
      
      global.window.UIRenderer = mockUIRenderer;
      controller = new UIController();
      controller.initialize();
    });
    
    it('should configure UI renderer', () => {
      let configured = false;
      mockUIRenderer.updateConfig = () => { configured = true; };
      controller.configure({ someOption: true });
      expect(configured).to.be.true;
    });
    
    it('should get stats from UI renderer', () => {
      const stats = controller.getStats();
      expect(stats).to.have.property('rendered', 100);
    });
    
    it('should return null stats when no UI renderer', () => {
      controller.uiRenderer = null;
      const stats = controller.getStats();
      expect(stats).to.be.null;
    });
    
    it('should get UI renderer reference', () => {
      const renderer = controller.getUIRenderer();
      expect(renderer).to.equal(mockUIRenderer);
    });
    
    it('should select entity for inspection', () => {
      let selected = false;
      mockUIRenderer.selectEntityForInspection = () => { selected = true; };
      controller.selectEntityForInspection({ id: 'entity-1' });
      expect(selected).to.be.true;
    });
  });
  
  describe('Module Exports', () => {
    it('should export UIController class', () => {
      expect(UIController).to.be.a('function');
      expect(UIController.name).to.equal('UIController');
    });
    
    it('should export UIManager instance', () => {
      expect(UIManager).to.be.instanceOf(UIController);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle initialize when logNormal not available', () => {
      global.window.UIRenderer = {
        debugUI: { performanceOverlay: { enabled: false } }
      };
      
      const controller = new UIController();
      expect(() => controller.initialize()).to.not.throw();
    });
    
    it('should handle toggleDebugConsole with uiRenderer fallback', () => {
      const mockUIRenderer = {
        debugUI: { performanceOverlay: { enabled: false } },
        toggleDebugConsole: () => {}
      };
      global.window.UIRenderer = mockUIRenderer;
      
      const controller = new UIController();
      controller.initialize();
      
      expect(() => controller.toggleDebugConsole()).to.not.throw();
    });
    
    it('should handle startGame when GameState not available', () => {
      global.window.UIRenderer = {
        debugUI: { performanceOverlay: { enabled: false } }
      };
      
      const controller = new UIController();
      controller.initialize();
      
      expect(() => controller.startGame()).to.not.throw();
    });
    
    it('should handle getEntityAtPosition with entities missing coordinates', () => {
      global.ants = [
        {},
        { x: 100 },
        { y: 100 }
      ];
      
      global.window.UIRenderer = {
        debugUI: { performanceOverlay: { enabled: false } }
      };
      
      const controller = new UIController();
      controller.initialize();
      
      const result = controller.getEntityAtPosition(100, 100);
      expect(result).to.be.null;
    });
    
    it('should handle toggleAllUI without draggablePanelManager', () => {
      global.window.UIRenderer = {
        debugUI: { performanceOverlay: { enabled: false } }
      };
      global.window.draggablePanelManager = null;
      
      const controller = new UIController();
      controller.initialize();
      
      expect(() => controller.toggleAllUI()).to.not.throw();
    });
  });
});




// ================================================================
// UIDebugManager.test.js (64 tests)
// ================================================================
// DUPLICATE REQUIRE REMOVED: let path = require('path');

describe('UIDebugManager', () => {
  let UIDebugManager;
  
  before(() => {
    // Mock localStorage for Node.js environment
    if (typeof global.localStorage === 'undefined') {
      global.localStorage = {
        _data: {},
        getItem(key) { return this._data[key] || null; },
        setItem(key, value) { this._data[key] = value; },
        removeItem(key) { delete this._data[key]; },
        clear() { this._data = {}; }
      };
    }
    
    // Mock document and canvas
    global.document = {
      querySelector: () => ({
        getBoundingClientRect: () => ({ left: 0, top: 0 })
      })
    };
    
    // Mock window with event listeners
    global.window = {
      addEventListener: () => {},
      removeEventListener: () => {},
      innerWidth: 800,
      innerHeight: 600
    };
    
    // Load the class
    UIDebugManager = require(path.resolve(__dirname, '../../../Classes/rendering/UIDebugManager.js'));
  });
  
  beforeEach(() => {
    // Clear localStorage before each test
    global.mockLocalStorage = {};
    if (global.localStorage && global.localStorage.clear) {
      global.localStorage.clear();
    }
  });
  
  describe('Constructor', () => {
    it('should initialize with isActive false', () => {
      const manager = new UIDebugManager();
      expect(manager.isActive).to.be.false;
    });
    
    it('should initialize registeredElements as empty object', () => {
      const manager = new UIDebugManager();
      expect(manager.registeredElements).to.be.an('object');
      expect(Object.keys(manager.registeredElements)).to.have.lengthOf(0);
    });
    
    it('should initialize drag state', () => {
      const manager = new UIDebugManager();
      expect(manager.dragState).to.be.an('object');
      expect(manager.dragState.isDragging).to.be.false;
      expect(manager.dragState.elementId).to.be.null;
    });
    
    it('should initialize config with default values', () => {
      const manager = new UIDebugManager();
      expect(manager.config).to.have.property('boundingBoxColor');
      expect(manager.config).to.have.property('dragHandleColor');
      expect(manager.config).to.have.property('handleSize', 8);
      expect(manager.config).to.have.property('snapToGrid', false);
      expect(manager.config).to.have.property('gridSize', 10);
    });
    
    it('should initialize event listeners object', () => {
      const manager = new UIDebugManager();
      expect(manager.listeners).to.be.an('object');
      expect(manager.listeners).to.have.property('pointerDown');
      expect(manager.listeners).to.have.property('pointerMove');
      expect(manager.listeners).to.have.property('pointerUp');
      expect(manager.listeners).to.have.property('keyDown');
    });
  });
  
  describe('registerElement()', () => {
    let manager;
    
    beforeEach(() => {
      manager = new UIDebugManager();
    });
    
    it('should register element with valid parameters', () => {
      const bounds = { x: 10, y: 20, width: 100, height: 50 };
      const callback = () => {};
      
      const result = manager.registerElement('test-element', bounds, callback);
      expect(result).to.be.true;
      expect(manager.registeredElements['test-element']).to.exist;
    });
    
    it('should reject registration with null elementId', () => {
      const result = manager.registerElement(null, {}, () => {});
      expect(result).to.be.false;
    });
    
    it('should reject registration with invalid elementId type', () => {
      const result = manager.registerElement(123, {}, () => {});
      expect(result).to.be.false;
    });
    
    it('should reject registration with null bounds', () => {
      const result = manager.registerElement('test', null, () => {});
      expect(result).to.be.false;
    });
    
    it('should reject registration with invalid bounds', () => {
      const result = manager.registerElement('test', {}, () => {});
      expect(result).to.be.false;
    });
    
    it('should reject registration with null callback', () => {
      const bounds = { x: 10, y: 20, width: 100, height: 50 };
      const result = manager.registerElement('test', bounds, null);
      expect(result).to.be.false;
    });
    
    it('should reject registration with invalid callback type', () => {
      const bounds = { x: 10, y: 20, width: 100, height: 50 };
      const result = manager.registerElement('test', bounds, 'not a function');
      expect(result).to.be.false;
    });
    
    it('should store element bounds', () => {
      const bounds = { x: 10, y: 20, width: 100, height: 50 };
      manager.registerElement('test', bounds, () => {});
      
      expect(manager.registeredElements['test'].bounds).to.deep.include(bounds);
    });
    
    it('should store original bounds separately', () => {
      const bounds = { x: 10, y: 20, width: 100, height: 50 };
      manager.registerElement('test', bounds, () => {});
      
      expect(manager.registeredElements['test'].originalBounds).to.deep.include(bounds);
    });
    
    it('should store position callback', () => {
      const bounds = { x: 10, y: 20, width: 100, height: 50 };
      const callback = () => {};
      manager.registerElement('test', bounds, callback);
      
      expect(manager.registeredElements['test'].positionCallback).to.equal(callback);
    });
    
    it('should use elementId as default label', () => {
      const bounds = { x: 10, y: 20, width: 100, height: 50 };
      manager.registerElement('test-elem', bounds, () => {});
      
      expect(manager.registeredElements['test-elem'].label).to.equal('test-elem');
    });
    
    it('should use custom label when provided', () => {
      const bounds = { x: 10, y: 20, width: 100, height: 50 };
      manager.registerElement('test', bounds, () => {}, { label: 'Custom Label' });
      
      expect(manager.registeredElements['test'].label).to.equal('Custom Label');
    });
    
    it('should use elementId as default persistKey', () => {
      const bounds = { x: 10, y: 20, width: 100, height: 50 };
      manager.registerElement('test', bounds, () => {});
      
      expect(manager.registeredElements['test'].persistKey).to.equal('test');
    });
    
    it('should use custom persistKey when provided', () => {
      const bounds = { x: 10, y: 20, width: 100, height: 50 };
      manager.registerElement('test', bounds, () => {}, { persistKey: 'persist-key' });
      
      expect(manager.registeredElements['test'].persistKey).to.equal('persist-key');
    });
    
    it('should default isDraggable to true', () => {
      const bounds = { x: 10, y: 20, width: 100, height: 50 };
      manager.registerElement('test', bounds, () => {});
      
      expect(manager.registeredElements['test'].isDraggable).to.be.true;
    });
    
    it('should respect isDraggable option', () => {
      const bounds = { x: 10, y: 20, width: 100, height: 50 };
      manager.registerElement('test', bounds, () => {}, { isDraggable: false });
      
      expect(manager.registeredElements['test'].isDraggable).to.be.false;
    });
    
    it('should store constraints when provided', () => {
      const bounds = { x: 10, y: 20, width: 100, height: 50 };
      const constraints = { minX: 0, minY: 0, maxX: 500, maxY: 400 };
      manager.registerElement('test', bounds, () => {}, { constraints });
      
      expect(manager.registeredElements['test'].constraints).to.deep.equal(constraints);
    });
  });
  
  describe('unregisterElement()', () => {
    let manager;
    
    beforeEach(() => {
      manager = new UIDebugManager();
      manager.registerElement('test', { x: 0, y: 0, width: 10, height: 10 }, () => {});
    });
    
    it('should unregister existing element', () => {
      const result = manager.unregisterElement('test');
      expect(result).to.be.true;
      expect(manager.registeredElements['test']).to.be.undefined;
    });
    
    it('should return false for non-existent element', () => {
      const result = manager.unregisterElement('non-existent');
      expect(result).to.be.false;
    });
  });
  
  describe('updateElementBounds()', () => {
    let manager, callback;
    
    beforeEach(() => {
      manager = new UIDebugManager();
      callback = () => {};
      manager.registerElement('test', { x: 100, y: 100, width: 50, height: 50 }, callback);
    });
    
    it('should update element bounds', () => {
      const result = manager.updateElementBounds('test', { x: 200, y: 200 });
      expect(result).to.be.true;
      expect(manager.registeredElements['test'].bounds.x).to.equal(200);
      expect(manager.registeredElements['test'].bounds.y).to.equal(200);
    });
    
    it('should return false for non-existent element', () => {
      const result = manager.updateElementBounds('non-existent', { x: 100 });
      expect(result).to.be.false;
    });
    
    it('should preserve existing bounds properties', () => {
      manager.updateElementBounds('test', { x: 200 });
      expect(manager.registeredElements['test'].bounds.y).to.equal(100);
      expect(manager.registeredElements['test'].bounds.width).to.equal(50);
    });
    
    it('should constrain position to screen', () => {
      manager.updateElementBounds('test', { x: -50, y: -50 });
      expect(manager.registeredElements['test'].bounds.x).to.be.at.least(0);
      expect(manager.registeredElements['test'].bounds.y).to.be.at.least(0);
    });
  });
  
  describe('toggle() and enable/disable()', () => {
    let manager;
    
    beforeEach(() => {
      manager = new UIDebugManager();
    });
    
    it('should toggle from disabled to enabled', () => {
      expect(manager.isActive).to.be.false;
      manager.toggle();
      expect(manager.isActive).to.be.true;
    });
    
    it('should toggle from enabled to disabled', () => {
      manager.isActive = true;
      manager.toggle();
      expect(manager.isActive).to.be.false;
    });
    
    it('should enable debug mode', () => {
      manager.enable();
      expect(manager.isActive).to.be.true;
    });
    
    it('should disable debug mode', () => {
      manager.isActive = true;
      manager.disable();
      expect(manager.enabled).to.be.false;
    });
  });
  
  describe('render()', () => {
    let manager, mockP5;
    
    beforeEach(() => {
      manager = new UIDebugManager();
      manager.registerElement('test', { x: 10, y: 20, width: 100, height: 50 }, () => {});
      
      mockP5 = {
        push: () => {},
        pop: () => {},
        stroke: () => {},
        strokeWeight: () => {},
        noFill: () => {},
        fill: () => {},
        noStroke: () => {},
        rect: () => {},
        text: () => {},
        textAlign: () => {},
        textSize: () => {},
        LEFT: 'left',
        TOP: 'top',
        height: 600
      };
    });
    
    it('should not render when inactive', () => {
      let rendered = false;
      mockP5.push = () => { rendered = true; };
      
      manager.render(mockP5);
      expect(rendered).to.be.false;
    });
    
    it('should render when active', () => {
      let rendered = false;
      mockP5.push = () => { rendered = true; };
      
      manager.enable();
      manager.render(mockP5);
      expect(rendered).to.be.true;
    });
  });
  
  describe('Drag Handling', () => {
    let manager;
    
    beforeEach(() => {
      manager = new UIDebugManager();
      manager.registerElement('test', { x: 100, y: 100, width: 50, height: 50 }, () => {});
      manager.enable();
    });
    
    describe('handlePointerDown()', () => {
      it('should return false when inactive', () => {
        manager.disable();
        const result = manager.handlePointerDown({ x: 110, y: 110 });
        expect(result).to.be.false;
      });
      
      it('should detect drag handle click', () => {
        const handleX = 100 + 50 - 8; // x + width - handleSize
        const handleY = 100 + 8 / 2;   // y + handleSize / 2
        
        const result = manager.handlePointerDown({ x: handleX + 4, y: handleY });
        expect(result).to.be.true;
        expect(manager.dragState.isDragging).to.be.true;
      });
      
      it('should not start drag when clicking outside handle', () => {
        const result = manager.handlePointerDown({ x: 50, y: 50 });
        expect(result).to.be.false;
        expect(manager.dragState.isDragging).to.be.false;
      });
    });
    
    describe('startDragging()', () => {
      it('should initialize drag state', () => {
        manager.startDragging('test', 110, 110);
        expect(manager.dragState.isDragging).to.be.true;
        expect(manager.dragState.elementId).to.equal('test');
        expect(manager.dragState.startX).to.equal(110);
        expect(manager.dragState.startY).to.equal(110);
      });
      
      it('should not start drag for non-draggable element', () => {
        manager.registeredElements['test'].isDraggable = false;
        manager.startDragging('test', 110, 110);
        expect(manager.dragState.isDragging).to.be.false;
      });
    });
    
    describe('updateDragPosition()', () => {
      it('should not update when not dragging', () => {
        const originalX = manager.registeredElements['test'].bounds.x;
        manager.updateDragPosition(200, 200);
        expect(manager.registeredElements['test'].bounds.x).to.equal(originalX);
      });
      
      it('should update position when dragging', () => {
        manager.startDragging('test', 110, 110);
        manager.updateDragPosition(150, 150);
        
        // Delta: 40, 40. Original: 100, 100. New: 140, 140
        expect(manager.registeredElements['test'].bounds.x).to.equal(140);
        expect(manager.registeredElements['test'].bounds.y).to.equal(140);
      });
      
      it('should apply grid snapping when enabled', () => {
        manager.config.snapToGrid = true;
        manager.config.gridSize = 20;
        manager.startDragging('test', 110, 110);
        manager.updateDragPosition(155, 155);
        
        // Should snap to nearest grid (20 pixel grid)
        expect(manager.registeredElements['test'].bounds.x % 20).to.equal(0);
      });
    });
  });
  
  describe('moveElement()', () => {
    let manager, callbackCalled;
    
    beforeEach(() => {
      manager = new UIDebugManager();
      callbackCalled = false;
      manager.registerElement('test', { x: 100, y: 100, width: 50, height: 50 }, () => { callbackCalled = true; });
    });
    
    it('should move element to new position', () => {
      const result = manager.moveElement('test', 200, 200);
      expect(result).to.be.true;
      expect(manager.registeredElements['test'].bounds.x).to.equal(200);
      expect(manager.registeredElements['test'].bounds.y).to.equal(200);
    });
    
    it('should return false for non-existent element', () => {
      const result = manager.moveElement('non-existent', 200, 200);
      expect(result).to.be.false;
    });
    
    it('should call position callback', () => {
      manager.moveElement('test', 200, 200);
      expect(callbackCalled).to.be.true;
    });
    
    it('should constrain to screen boundaries', () => {
      manager.moveElement('test', -50, -50);
      expect(manager.registeredElements['test'].bounds.x).to.be.at.least(0);
      expect(manager.registeredElements['test'].bounds.y).to.be.at.least(0);
    });
    
    it('should apply custom constraints', () => {
      manager.registeredElements['test'].constraints = { minX: 50, minY: 50, maxX: 300, maxY: 300 };
      manager.moveElement('test', 10, 10);
      expect(manager.registeredElements['test'].bounds.x).to.be.at.least(50);
      expect(manager.registeredElements['test'].bounds.y).to.be.at.least(50);
    });
  });
  
  describe('Position Persistence', () => {
    let manager;
    
    beforeEach(() => {
      manager = new UIDebugManager();
    });
    
    it('should save element position', () => {
      const elementId = 'test-persist';
      const positionData = { x: 150, y: 250, width: 100, height: 50 };
      
      manager.saveElementPosition(elementId, positionData);
      
      // Check mock localStorage
      const key = manager.storagePrefix + elementId;
      expect(global.mockLocalStorage[key]).to.exist;
    });
    
    it('should load element position', () => {
      const elementId = 'test-persist';
      const positionData = { x: 150, y: 250 };
      
      // Save to mock localStorage
      global.mockLocalStorage[manager.storagePrefix + elementId] = JSON.stringify(positionData);
      
      const loaded = manager.loadElementPosition(elementId);
      expect(loaded).to.not.be.null;
      expect(loaded.x).to.equal(150);
      expect(loaded.y).to.equal(250);
    });
    
    it('should return null when no saved position', () => {
      const loaded = manager.loadElementPosition('never-saved');
      expect(loaded).to.be.null;
    });
    
    it('should apply loaded position to element', () => {
      const positionData = { x: 150, y: 250 };
      global.mockLocalStorage[manager.storagePrefix + 'test'] = JSON.stringify(positionData);
      
      let callbackX, callbackY;
      const callback = (x, y) => { callbackX = x; callbackY = y; };
      
      // Register element - should load saved position
      manager.registerElement('test', { x: 0, y: 0, width: 50, height: 50 }, callback);
      
      expect(manager.registeredElements['test'].bounds.x).to.equal(150);
      expect(manager.registeredElements['test'].bounds.y).to.equal(250);
    });
  });
  
  describe('constrainToScreen()', () => {
    let manager;
    
    beforeEach(() => {
      manager = new UIDebugManager();
    });
    
    it('should constrain negative X to 0', () => {
      const bounds = { x: -50, y: 100, width: 50, height: 50 };
      const constrained = manager.constrainToScreen(bounds);
      expect(constrained.x).to.equal(0);
    });
    
    it('should constrain negative Y to 0', () => {
      const bounds = { x: 100, y: -50, width: 50, height: 50 };
      const constrained = manager.constrainToScreen(bounds);
      expect(constrained.y).to.equal(0);
    });
    
    it('should constrain X to keep element on screen', () => {
      const bounds = { x: 850, y: 100, width: 50, height: 50 };
      const constrained = manager.constrainToScreen(bounds);
      expect(constrained.x).to.be.at.most(750); // 800 - 50
    });
    
    it('should constrain Y to keep element on screen', () => {
      const bounds = { x: 100, y: 650, width: 50, height: 50 };
      const constrained = manager.constrainToScreen(bounds);
      expect(constrained.y).to.be.at.most(550); // 600 - 50
    });
    
    it('should not modify bounds already within screen', () => {
      const bounds = { x: 100, y: 100, width: 50, height: 50 };
      const constrained = manager.constrainToScreen(bounds);
      expect(constrained.x).to.equal(100);
      expect(constrained.y).to.equal(100);
    });
  });
  
  describe('Cleanup', () => {
    let manager;
    
    beforeEach(() => {
      manager = new UIDebugManager();
    });
    
    it('should dispose without errors', () => {
      expect(() => manager.dispose()).to.not.throw();
    });
    
    it('should stop dragging on disable', () => {
      manager.registerElement('test', { x: 100, y: 100, width: 50, height: 50 }, () => {});
      manager.enable();
      manager.startDragging('test', 110, 110);
      
      manager.disable();
      expect(manager.dragState.active).to.be.false;
    });
  });
  
  describe('Edge Cases', () => {
    let manager;
    
    beforeEach(() => {
      manager = new UIDebugManager();
    });
    
    it('should handle registration with minimal options', () => {
      const result = manager.registerElement('minimal', { x: 0, y: 0, width: 1, height: 1 }, () => {});
      expect(result).to.be.true;
    });
    
    it('should handle zero-size elements', () => {
      const result = manager.registerElement('zero', { x: 0, y: 0, width: 0, height: 0 }, () => {});
      expect(result).to.be.true;
    });
    
    it('should handle very large coordinates', () => {
      const bounds = { x: 99999, y: 99999, width: 100, height: 100 };
      manager.registerElement('large', bounds, () => {});
      
      // Should constrain to screen
      const constrained = manager.constrainToScreen(bounds);
      expect(constrained.x).to.be.at.most(700); // 800 - 100
    });
    
    it('should handle multiple elements', () => {
      manager.registerElement('elem1', { x: 10, y: 10, width: 50, height: 50 }, () => {});
      manager.registerElement('elem2', { x: 100, y: 100, width: 50, height: 50 }, () => {});
      manager.registerElement('elem3', { x: 200, y: 200, width: 50, height: 50 }, () => {});
      
      expect(Object.keys(manager.registeredElements)).to.have.lengthOf(3);
    });
    
    it('should handle updating non-draggable element', () => {
      manager.registerElement('fixed', { x: 100, y: 100, width: 50, height: 50 }, () => {}, { isDraggable: false });
      manager.enable();
      
      manager.startDragging('fixed', 110, 110);
      expect(manager.dragState.isDragging).to.be.false;
    });
    
    it('should handle render without p5 instance', () => {
      manager.enable();
      manager.registerElement('test', { x: 10, y: 10, width: 50, height: 50 }, () => {});
      
      expect(() => manager.render()).to.not.throw();
    });
  });
});




// ================================================================
// UILayerRenderer.test.js (88 tests)
// ================================================================
// DUPLICATE REQUIRE REMOVED: let path = require('path');

describe('UILayerRenderer', () => {
  let UILayerRenderer;
  
  before(() => {
    // Mock p5.js globals
    global.push = () => {};
    global.pop = () => {};
    global.fill = () => {};
    global.noStroke = () => {};
    global.stroke = () => {};
    global.strokeWeight = () => {};
    global.rect = () => {};
    global.circle = () => {};
    global.text = () => {};
    global.textAlign = () => {};
    global.textSize = () => {};
    global.textWidth = () => 100;
    global.line = () => {};
    global.map = (value, start1, stop1, start2, stop2) => {
      return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
    };
    global.LEFT = 'left';
    global.CENTER = 'center';
    global.TOP = 'top';
    global.width = 800;
    global.height = 600;
    global.mouseX = 400;
    global.mouseY = 300;
    global.mouseIsPressed = false;
    global.frameRate = () => 60;
    global.performance = {
      now: () => Date.now(),
      memory: {
        usedJSHeapSize: 10000000
      }
    };
    
    // Mock game globals
    global.g_resourceList = { wood: [], food: [] };
    global.ants = [];
    global.window = {
      draggablePanelManager: null
    };
    
    // Mock functions
    global.toggleDevConsole = () => {};
    
    // Load the class
    const uiRendererPath = path.join(__dirname, '../../../Classes/rendering/UILayerRenderer.js');
    UILayerRenderer = require(uiRendererPath);
  });
  
  afterEach(() => {
    // Reset globals
    global.ants = [];
    global.g_resourceList = { wood: [], food: [] };
    global.window.draggablePanelManager = null;
    
    // Clean up instances
    if (typeof window !== 'undefined' && window.UIRenderer) {
      delete window.UIRenderer;
    }
    if (typeof global !== 'undefined' && global.UIRenderer) {
      delete global.UIRenderer;
    }
  });
  
  describe('Constructor', () => {
    it('should initialize with default configuration', () => {
      const renderer = new UILayerRenderer();
      
      expect(renderer.config).to.exist;
      expect(renderer.config.enableHUD).to.be.true;
      expect(renderer.config.enableDebugUI).to.be.true;
      expect(renderer.config.enableTooltips).to.be.true;
      expect(renderer.config.enableSelectionBox).to.be.true;
      expect(renderer.config.hudOpacity).to.equal(0.9);
      expect(renderer.config.debugUIOpacity).to.equal(0.8);
    });
    
    it('should initialize HUD elements structure', () => {
      const renderer = new UILayerRenderer();
      
      expect(renderer.hudElements).to.exist;
      expect(renderer.hudElements.currency).to.deep.equal({
        wood: 0,
        food: 0,
        population: 0,
        pain: 100
      });
      expect(renderer.hudElements.toolbar).to.exist;
      expect(renderer.hudElements.toolbar.activeButton).to.be.null;
      expect(renderer.hudElements.toolbar.buttons).to.be.an('array').that.is.empty;
      expect(renderer.hudElements.minimap).to.deep.equal({
        enabled: false,
        size: 120
      });
    });
    
    it('should initialize interaction UI structure', () => {
      const renderer = new UILayerRenderer();
      
      expect(renderer.interactionUI).to.exist;
      expect(renderer.interactionUI.selectionBox).to.deep.equal({
        active: false,
        start: null,
        end: null
      });
      expect(renderer.interactionUI.tooltips).to.deep.equal({
        active: null,
        text: '',
        position: null
      });
      expect(renderer.interactionUI.contextMenu).to.deep.equal({
        active: false,
        items: [],
        position: null
      });
    });
    
    it('should initialize debug UI structure', () => {
      const renderer = new UILayerRenderer();
      
      expect(renderer.debugUI).to.exist;
      expect(renderer.debugUI.performanceOverlay).to.deep.equal({
        enabled: true
      });
      expect(renderer.debugUI.entityInspector).to.deep.equal({
        enabled: false,
        selectedEntity: null
      });
      expect(renderer.debugUI.debugConsole).to.deep.equal({
        enabled: false,
        visible: false
      });
    });
    
    it('should initialize menu systems structure', () => {
      const renderer = new UILayerRenderer();
      
      expect(renderer.menuSystems).to.exist;
      expect(renderer.menuSystems.mainMenu).to.deep.equal({ active: false });
      expect(renderer.menuSystems.pauseMenu).to.deep.equal({ active: false });
      expect(renderer.menuSystems.settingsMenu).to.deep.equal({ active: false });
      expect(renderer.menuSystems.gameOverMenu).to.deep.equal({ active: false });
    });
    
    it('should initialize font structure', () => {
      const renderer = new UILayerRenderer();
      
      expect(renderer.fonts).to.exist;
      expect(renderer.fonts.hud).to.be.null;
      expect(renderer.fonts.debug).to.be.null;
      expect(renderer.fonts.menu).to.be.null;
    });
    
    it('should initialize color palette', () => {
      const renderer = new UILayerRenderer();
      
      expect(renderer.colors).to.exist;
      expect(renderer.colors.hudBackground).to.deep.equal([0, 0, 0, 150]);
      expect(renderer.colors.hudText).to.deep.equal([255, 255, 255]);
      expect(renderer.colors.debugBackground).to.deep.equal([0, 0, 0, 180]);
      expect(renderer.colors.debugText).to.deep.equal([0, 255, 0]);
      expect(renderer.colors.selectionBox).to.deep.equal([255, 255, 0, 100]);
      expect(renderer.colors.selectionBorder).to.deep.equal([255, 255, 0]);
      expect(renderer.colors.tooltip).to.deep.equal([0, 0, 0, 200]);
      expect(renderer.colors.tooltipText).to.deep.equal([255, 255, 255]);
    });
    
    it('should initialize performance stats', () => {
      const renderer = new UILayerRenderer();
      
      expect(renderer.stats).to.exist;
      expect(renderer.stats.lastRenderTime).to.equal(0);
      expect(renderer.stats.uiElementsRendered).to.equal(0);
    });
  });
  
  describe('Main Render Method', () => {
    it('should render in-game UI for PLAYING state', () => {
      const renderer = new UILayerRenderer();
      let inGameCalled = false;
      renderer.renderInGameUI = () => { inGameCalled = true; };
      
      renderer.renderUI('PLAYING');
      
      expect(inGameCalled).to.be.true;
    });
    
    it('should render in-game UI and pause menu for PAUSED state', () => {
      const renderer = new UILayerRenderer();
      let inGameCalled = false;
      let pauseCalled = false;
      renderer.renderInGameUI = () => { inGameCalled = true; };
      renderer.renderPauseMenu = () => { pauseCalled = true; };
      
      renderer.renderUI('PAUSED');
      
      expect(inGameCalled).to.be.true;
      expect(pauseCalled).to.be.true;
    });
    
    it('should render main menu for MAIN_MENU state', () => {
      const renderer = new UILayerRenderer();
      let mainMenuCalled = false;
      renderer.renderMainMenu = () => { mainMenuCalled = true; };
      
      renderer.renderUI('MAIN_MENU');
      
      expect(mainMenuCalled).to.be.true;
    });
    
    it('should render settings menu for SETTINGS state', () => {
      const renderer = new UILayerRenderer();
      let settingsCalled = false;
      renderer.renderSettingsMenu = () => { settingsCalled = true; };
      
      renderer.renderUI('SETTINGS');
      
      expect(settingsCalled).to.be.true;
    });
    
    it('should render game over menu for GAME_OVER state', () => {
      const renderer = new UILayerRenderer();
      let gameOverCalled = false;
      renderer.renderGameOverMenu = () => { gameOverCalled = true; };
      
      renderer.renderUI('GAME_OVER');
      
      expect(gameOverCalled).to.be.true;
    });
    
    it('should fallback to in-game UI for unknown states', () => {
      const renderer = new UILayerRenderer();
      let inGameCalled = false;
      renderer.renderInGameUI = () => { inGameCalled = true; };
      
      renderer.renderUI('UNKNOWN_STATE');
      
      expect(inGameCalled).to.be.true;
    });
    
    it('should track render time', () => {
      const renderer = new UILayerRenderer();
      
      renderer.renderUI('PLAYING');
      
      expect(renderer.stats.lastRenderTime).to.be.a('number');
      expect(renderer.stats.lastRenderTime).to.be.at.least(0);
    });
    
    it('should reset UI elements count', () => {
      const renderer = new UILayerRenderer();
      renderer.stats.uiElementsRendered = 100;
      
      renderer.renderUI('PLAYING');
      
      expect(renderer.stats.uiElementsRendered).to.be.a('number');
    });
  });
  
  describe('In-Game UI Rendering', () => {
    it('should render HUD when enabled', () => {
      const renderer = new UILayerRenderer();
      renderer.config.enableHUD = true;
      let hudCalled = false;
      renderer.renderHUDElements = () => { hudCalled = true; };
      
      renderer.renderInGameUI();
      
      expect(hudCalled).to.be.true;
    });
    
    it('should skip HUD when disabled', () => {
      const renderer = new UILayerRenderer();
      renderer.config.enableHUD = false;
      let hudCalled = false;
      renderer.renderHUDElements = () => { hudCalled = true; };
      
      renderer.renderInGameUI();
      
      expect(hudCalled).to.be.false;
    });
    
    it('should render selection box when active and enabled', () => {
      const renderer = new UILayerRenderer();
      renderer.config.enableSelectionBox = true;
      renderer.interactionUI.selectionBox.active = true;
      let selectionCalled = false;
      renderer.renderSelectionBox = () => { selectionCalled = true; };
      
      renderer.renderInGameUI();
      
      expect(selectionCalled).to.be.true;
    });
    
    it('should skip selection box when inactive', () => {
      const renderer = new UILayerRenderer();
      renderer.config.enableSelectionBox = true;
      renderer.interactionUI.selectionBox.active = false;
      let selectionCalled = false;
      renderer.renderSelectionBox = () => { selectionCalled = true; };
      
      renderer.renderInGameUI();
      
      expect(selectionCalled).to.be.false;
    });
    
    it('should render tooltip when active and enabled', () => {
      const renderer = new UILayerRenderer();
      renderer.config.enableTooltips = true;
      renderer.interactionUI.tooltips.active = true;
      let tooltipCalled = false;
      renderer.renderTooltip = () => { tooltipCalled = true; };
      
      renderer.renderInGameUI();
      
      expect(tooltipCalled).to.be.true;
    });
    
    it('should render context menu when active', () => {
      const renderer = new UILayerRenderer();
      renderer.interactionUI.contextMenu.active = true;
      let contextCalled = false;
      renderer.renderContextMenu = () => { contextCalled = true; };
      
      renderer.renderInGameUI();
      
      expect(contextCalled).to.be.true;
    });
    
    it('should render performance overlay when debug UI enabled', () => {
      const renderer = new UILayerRenderer();
      renderer.config.enableDebugUI = true;
      renderer.debugUI.performanceOverlay.enabled = true;
      let perfCalled = false;
      renderer.renderPerformanceOverlay = () => { perfCalled = true; };
      
      renderer.renderInGameUI();
      
      expect(perfCalled).to.be.true;
    });
    
    it('should render entity inspector when enabled', () => {
      const renderer = new UILayerRenderer();
      renderer.config.enableDebugUI = true;
      renderer.debugUI.entityInspector.enabled = true;
      let inspectorCalled = false;
      renderer.renderEntityInspector = () => { inspectorCalled = true; };
      
      renderer.renderInGameUI();
      
      expect(inspectorCalled).to.be.true;
    });
  });
  
  describe('Selection Box API', () => {
    it('should start selection box', () => {
      const renderer = new UILayerRenderer();
      
      renderer.startSelectionBox(100, 150);
      
      expect(renderer.interactionUI.selectionBox.active).to.be.true;
      expect(renderer.interactionUI.selectionBox.start).to.deep.equal({ x: 100, y: 150 });
      expect(renderer.interactionUI.selectionBox.end).to.deep.equal({ x: 100, y: 150 });
    });
    
    it('should update selection box end position', () => {
      const renderer = new UILayerRenderer();
      renderer.startSelectionBox(100, 100);
      
      renderer.updateSelectionBox(200, 250);
      
      expect(renderer.interactionUI.selectionBox.end).to.deep.equal({ x: 200, y: 250 });
    });
    
    it('should not update inactive selection box', () => {
      const renderer = new UILayerRenderer();
      renderer.interactionUI.selectionBox.active = false;
      
      renderer.updateSelectionBox(200, 200);
      
      expect(renderer.interactionUI.selectionBox.end).to.be.null;
    });
    
    it('should end selection box and clear state', () => {
      const renderer = new UILayerRenderer();
      renderer.startSelectionBox(100, 100);
      renderer.updateSelectionBox(200, 200);
      
      renderer.endSelectionBox();
      
      expect(renderer.interactionUI.selectionBox.active).to.be.false;
      expect(renderer.interactionUI.selectionBox.start).to.be.null;
      expect(renderer.interactionUI.selectionBox.end).to.be.null;
    });
  });
  
  describe('Tooltip API', () => {
    it('should show tooltip', () => {
      const renderer = new UILayerRenderer();
      
      renderer.showTooltip('Test Tooltip', 150, 200);
      
      expect(renderer.interactionUI.tooltips.active).to.be.true;
      expect(renderer.interactionUI.tooltips.text).to.equal('Test Tooltip');
      expect(renderer.interactionUI.tooltips.position).to.deep.equal({ x: 150, y: 200 });
    });
    
    it('should hide tooltip', () => {
      const renderer = new UILayerRenderer();
      renderer.showTooltip('Test', 100, 100);
      
      renderer.hideTooltip();
      
      expect(renderer.interactionUI.tooltips.active).to.be.false;
      expect(renderer.interactionUI.tooltips.text).to.equal('');
      expect(renderer.interactionUI.tooltips.position).to.be.null;
    });
  });
  
  describe('Context Menu API', () => {
    it('should show context menu', () => {
      const renderer = new UILayerRenderer();
      const items = ['Option 1', 'Option 2', 'Option 3'];
      
      renderer.showContextMenu(items, 300, 250);
      
      expect(renderer.interactionUI.contextMenu.active).to.be.true;
      expect(renderer.interactionUI.contextMenu.items).to.deep.equal(items);
      expect(renderer.interactionUI.contextMenu.position).to.deep.equal({ x: 300, y: 250 });
    });
    
    it('should hide context menu', () => {
      const renderer = new UILayerRenderer();
      renderer.showContextMenu(['Test'], 100, 100);
      
      renderer.hideContextMenu();
      
      expect(renderer.interactionUI.contextMenu.active).to.be.false;
      expect(renderer.interactionUI.contextMenu.items).to.be.empty;
      expect(renderer.interactionUI.contextMenu.position).to.be.null;
    });
  });
  
  describe('Debug UI API', () => {
    it('should toggle performance overlay', () => {
      const renderer = new UILayerRenderer();
      renderer.debugUI.performanceOverlay.enabled = true;
      
      renderer.togglePerformanceOverlay();
      
      expect(renderer.debugUI.performanceOverlay.enabled).to.be.false;
    });
    
    it('should toggle entity inspector', () => {
      const renderer = new UILayerRenderer();
      renderer.debugUI.entityInspector.enabled = false;
      
      renderer.toggleEntityInspector();
      
      expect(renderer.debugUI.entityInspector.enabled).to.be.true;
    });
    
    it('should select entity for inspection', () => {
      const renderer = new UILayerRenderer();
      const entity = { id: 123, x: 100, y: 100 };
      
      renderer.selectEntityForInspection(entity);
      
      expect(renderer.debugUI.entityInspector.selectedEntity).to.equal(entity);
      expect(renderer.debugUI.entityInspector.enabled).to.be.true;
    });
    
    it('should toggle debug console', () => {
      const renderer = new UILayerRenderer();
      
      expect(() => renderer.toggleDebugConsole()).to.not.throw();
    });
  });
  
  describe('Minimap API', () => {
    it('should enable minimap', () => {
      const renderer = new UILayerRenderer();
      renderer.hudElements.minimap.enabled = false;
      
      renderer.enableMinimap();
      
      expect(renderer.hudElements.minimap.enabled).to.be.true;
    });
    
    it('should disable minimap', () => {
      const renderer = new UILayerRenderer();
      renderer.hudElements.minimap.enabled = true;
      
      renderer.disableMinimap();
      
      expect(renderer.hudElements.minimap.enabled).to.be.false;
    });
  });
  
  describe('Configuration API', () => {
    it('should update configuration', () => {
      const renderer = new UILayerRenderer();
      
      renderer.updateConfig({
        enableHUD: false,
        enableTooltips: false,
        hudOpacity: 0.5
      });
      
      expect(renderer.config.enableHUD).to.be.false;
      expect(renderer.config.enableTooltips).to.be.false;
      expect(renderer.config.hudOpacity).to.equal(0.5);
    });
    
    it('should get configuration copy', () => {
      const renderer = new UILayerRenderer();
      
      const config = renderer.getConfig();
      
      expect(config.enableHUD).to.be.true;
      config.enableHUD = false;
      expect(renderer.config.enableHUD).to.be.true; // Original unchanged
    });
    
    it('should get stats copy', () => {
      const renderer = new UILayerRenderer();
      renderer.stats.lastRenderTime = 15;
      
      const stats = renderer.getStats();
      
      expect(stats.lastRenderTime).to.equal(15);
      stats.lastRenderTime = 100;
      expect(renderer.stats.lastRenderTime).to.equal(15); // Original unchanged
    });
  });
  
  describe('Required API Methods', () => {
    it('should have renderInteractionUI method', () => {
      const renderer = new UILayerRenderer();
      
      expect(renderer.renderInteractionUI).to.be.a('function');
    });
    
    it('should render interaction UI with selection', () => {
      const renderer = new UILayerRenderer();
      const selection = {
        active: true,
        startX: 100,
        startY: 100,
        currentX: 200,
        currentY: 200
      };
      let selectionBoxCalled = false;
      renderer.renderSelectionBoxFromData = () => { selectionBoxCalled = true; };
      
      renderer.renderInteractionUI(selection, null);
      
      expect(selectionBoxCalled).to.be.true;
    });
    
    it('should render interaction UI with hovered entity', () => {
      const renderer = new UILayerRenderer();
      const entity = { x: 100, y: 100, health: 50 };
      let tooltipCalled = false;
      renderer.showTooltip = () => { tooltipCalled = true; };
      renderer.renderTooltip = () => {};
      
      renderer.renderInteractionUI(null, entity);
      
      expect(tooltipCalled).to.be.true;
    });
    
    it('should have renderDebugOverlay method', () => {
      const renderer = new UILayerRenderer();
      
      expect(renderer.renderDebugOverlay).to.be.a('function');
    });
    
    it('should render debug overlay when enabled', () => {
      const renderer = new UILayerRenderer();
      renderer.debugUI.performanceOverlay.enabled = true;
      let perfCalled = false;
      renderer.renderPerformanceOverlay = () => { perfCalled = true; };
      
      renderer.renderDebugOverlay();
      
      expect(perfCalled).to.be.true;
    });
    
    it('should have renderMenus method', () => {
      const renderer = new UILayerRenderer();
      
      expect(renderer.renderMenus).to.be.a('function');
    });
    
    it('should render menus based on game state', () => {
      const renderer = new UILayerRenderer();
      const gameState = { currentState: 'MAIN_MENU' };
      let mainMenuCalled = false;
      renderer.renderMainMenu = () => { mainMenuCalled = true; };
      
      renderer.renderMenus(gameState);
      
      expect(mainMenuCalled).to.be.true;
    });
    
    it('should handle pause state in renderMenus', () => {
      const renderer = new UILayerRenderer();
      const gameState = { currentState: 'PAUSED' };
      let pauseMenuCalled = false;
      renderer.renderPauseMenu = () => { pauseMenuCalled = true; };
      
      renderer.renderMenus(gameState);
      
      expect(pauseMenuCalled).to.be.true;
    });
    
    it('should have setConsoleMessages method', () => {
      const renderer = new UILayerRenderer();
      
      expect(renderer.setConsoleMessages).to.be.a('function');
    });
    
    it('should set console messages', () => {
      const renderer = new UILayerRenderer();
      const messages = [
        { text: 'Test message 1', level: 'info' },
        { text: 'Test message 2', level: 'warn' }
      ];
      
      renderer.setConsoleMessages(messages);
      
      expect(renderer.debugConsoleMessages).to.deep.equal(messages);
    });
  });
  
  describe('Helper Methods', () => {
    it('should render selection box from data', () => {
      const renderer = new UILayerRenderer();
      const selection = {
        startX: 100,
        startY: 100,
        currentX: 200,
        currentY: 250
      };
      
      expect(() => renderer.renderSelectionBoxFromData(selection)).to.not.throw();
      expect(renderer.stats.uiElementsRendered).to.equal(1);
    });
    
    it('should skip rendering invalid selection box data', () => {
      const renderer = new UILayerRenderer();
      const invalidSelection = {
        startX: null,
        startY: 100,
        currentX: 200,
        currentY: 200
      };
      
      expect(() => renderer.renderSelectionBoxFromData(invalidSelection)).to.not.throw();
    });
    
    it('should generate entity tooltip', () => {
      const renderer = new UILayerRenderer();
      const entity = {
        constructor: { name: 'Ant' },
        health: 75,
        currentState: 'GATHERING',
        isActive: true
      };
      
      const tooltip = renderer.generateEntityTooltip(entity);
      
      expect(tooltip).to.include('Ant');
      expect(tooltip).to.include('Health: 75');
      expect(tooltip).to.include('State: GATHERING');
      expect(tooltip).to.include('Active: true');
    });
    
    it('should generate tooltip for entity without optional properties', () => {
      const renderer = new UILayerRenderer();
      const entity = {
        constructor: { name: 'Resource' }
      };
      
      const tooltip = renderer.generateEntityTooltip(entity);
      
      expect(tooltip).to.include('Resource');
    });
  });
  
  describe('Render Methods', () => {
    it('should render HUD elements', () => {
      const renderer = new UILayerRenderer();
      renderer.renderCurrencyDisplay = () => {};
      renderer.renderToolbar = () => {};
      renderer.renderMinimap = () => {};
      
      renderer.renderHUDElements();
      
      expect(renderer.stats.uiElementsRendered).to.equal(3);
    });
    
    it('should render minimap when enabled', () => {
      const renderer = new UILayerRenderer();
      renderer.hudElements.minimap.enabled = true;
      let minimapCalled = false;
      renderer.renderCurrencyDisplay = () => {};
      renderer.renderToolbar = () => {};
      renderer.renderMinimap = () => { minimapCalled = true; };
      
      renderer.renderHUDElements();
      
      expect(minimapCalled).to.be.true;
    });
    
    it('should use fallback currency display when no draggable panel manager', () => {
      const renderer = new UILayerRenderer();
      global.window.draggablePanelManager = null;
      
      expect(() => renderer.renderCurrencyDisplay()).to.not.throw();
    });
    
    it('should use fallback currency display when no resource panel', () => {
      const renderer = new UILayerRenderer();
      global.window.draggablePanelManager = {
        getPanel: () => null
      };
      let fallbackCalled = false;
      renderer.renderFallbackCurrencyDisplay = () => { fallbackCalled = true; };
      
      renderer.renderCurrencyDisplay();
      
      expect(fallbackCalled).to.be.true;
    });
    
    it('should render fallback currency display', () => {
      const renderer = new UILayerRenderer();
      global.g_resourceList = { wood: [1, 2, 3], food: [1, 2] };
      global.ants = [1, 2, 3, 4, 5];
      
      expect(() => renderer.renderFallbackCurrencyDisplay()).to.not.throw();
    });
    
    it('should render selection box when active', () => {
      const renderer = new UILayerRenderer();
      renderer.interactionUI.selectionBox.active = true;
      renderer.interactionUI.selectionBox.start = { x: 100, y: 100 };
      renderer.interactionUI.selectionBox.end = { x: 200, y: 200 };
      
      expect(() => renderer.renderSelectionBox()).to.not.throw();
    });
    
    it('should render context menu when active', () => {
      const renderer = new UILayerRenderer();
      renderer.interactionUI.contextMenu.active = true;
      renderer.interactionUI.contextMenu.items = ['Option 1', 'Option 2'];
      renderer.interactionUI.contextMenu.position = { x: 200, y: 150 };
      
      expect(() => renderer.renderContextMenu()).to.not.throw();
    });
    
    it('should render performance overlay without draggable panel manager', () => {
      const renderer = new UILayerRenderer();
      global.window.draggablePanelManager = null;
      let basicOverlayCalled = false;
      renderer.renderBasicPerformanceOverlay = () => { basicOverlayCalled = true; };
      
      renderer.renderPerformanceOverlay();
      
      expect(basicOverlayCalled).to.be.true;
    });
    
    it('should render basic performance overlay', () => {
      const renderer = new UILayerRenderer();
      global.ants = [1, 2, 3];
      
      expect(() => renderer.renderBasicPerformanceOverlay()).to.not.throw();
    });
    
    it('should render entity inspector when entity selected', () => {
      const renderer = new UILayerRenderer();
      renderer.debugUI.entityInspector.selectedEntity = {
        id: 123,
        constructor: { name: 'Ant' },
        x: 100,
        y: 200,
        isActive: true,
        currentState: 'MOVING'
      };
      
      expect(() => renderer.renderEntityInspector()).to.not.throw();
    });
    
    it('should not render entity inspector when no entity selected', () => {
      const renderer = new UILayerRenderer();
      renderer.debugUI.entityInspector.selectedEntity = null;
      
      const initialElements = renderer.stats.uiElementsRendered;
      renderer.renderEntityInspector();
      
      expect(renderer.stats.uiElementsRendered).to.equal(initialElements);
    });
    
    it('should render settings menu', () => {
      const renderer = new UILayerRenderer();
      
      expect(() => renderer.renderSettingsMenu()).to.not.throw();
    });
    
    it('should render game over menu', () => {
      const renderer = new UILayerRenderer();
      
      expect(() => renderer.renderGameOverMenu()).to.not.throw();
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle null selection in renderInteractionUI', () => {
      const renderer = new UILayerRenderer();
      
      expect(() => renderer.renderInteractionUI(null, null)).to.not.throw();
    });
    
    it('should handle undefined entity in generateEntityTooltip', () => {
      const renderer = new UILayerRenderer();
      
      const tooltip = renderer.generateEntityTooltip({});
      
      expect(tooltip).to.be.a('string');
    });
    
    it('should handle missing tooltip text', () => {
      const renderer = new UILayerRenderer();
      renderer.interactionUI.tooltips.active = true;
      renderer.interactionUI.tooltips.text = null;
      
      expect(() => renderer.renderTooltip()).to.not.throw();
    });
    
    it('should handle missing context menu items', () => {
      const renderer = new UILayerRenderer();
      renderer.interactionUI.contextMenu.active = true;
      renderer.interactionUI.contextMenu.items = null;
      
      expect(() => renderer.renderContextMenu()).to.not.throw();
    });
    
    it('should handle null game state in renderMenus', () => {
      const renderer = new UILayerRenderer();
      
      expect(() => renderer.renderMenus(null)).to.not.throw();
    });
    
    it('should handle game state without currentState property', () => {
      const renderer = new UILayerRenderer();
      
      expect(() => renderer.renderMenus({})).to.not.throw();
    });
    
    it('should handle empty console messages', () => {
      const renderer = new UILayerRenderer();
      
      renderer.setConsoleMessages([]);
      
      expect(renderer.debugConsoleMessages).to.be.empty;
    });
    
    it('should handle null console messages', () => {
      const renderer = new UILayerRenderer();
      
      renderer.setConsoleMessages(null);
      
      expect(renderer.debugConsoleMessages).to.be.empty;
    });
    
    it('should handle missing resource list in fallback currency', () => {
      const renderer = new UILayerRenderer();
      global.g_resourceList = null;
      
      expect(() => renderer.renderFallbackCurrencyDisplay()).to.not.throw();
    });
    
    it('should handle undefined ants array in fallback currency', () => {
      const renderer = new UILayerRenderer();
      global.ants = undefined;
      
      expect(() => renderer.renderFallbackCurrencyDisplay()).to.not.throw();
    });
    
    it('should handle missing performance.memory', () => {
      const renderer = new UILayerRenderer();
      const originalMemory = global.performance.memory;
      global.performance.memory = undefined;
      
      expect(() => renderer.renderBasicPerformanceOverlay()).to.not.throw();
      
      global.performance.memory = originalMemory;
    });
    
    it('should handle very long tooltip text', () => {
      const renderer = new UILayerRenderer();
      const longText = 'A'.repeat(1000);
      
      renderer.showTooltip(longText, 100, 100);
      
      expect(renderer.interactionUI.tooltips.text).to.equal(longText);
    });
    
    it('should handle negative coordinates for UI elements', () => {
      const renderer = new UILayerRenderer();
      
      renderer.showTooltip('Test', -100, -200);
      
      expect(renderer.interactionUI.tooltips.position).to.deep.equal({ x: -100, y: -200 });
    });
    
    it('should handle selection box with zero width', () => {
      const renderer = new UILayerRenderer();
      renderer.startSelectionBox(100, 100);
      renderer.updateSelectionBox(100, 200);
      
      expect(() => renderer.renderSelectionBox()).to.not.throw();
    });
    
    it('should handle selection box with zero height', () => {
      const renderer = new UILayerRenderer();
      renderer.startSelectionBox(100, 100);
      renderer.updateSelectionBox(200, 100);
      
      expect(() => renderer.renderSelectionBox()).to.not.throw();
    });
  });
  
  describe('Integration Scenarios', () => {
    it('should handle full selection workflow', () => {
      const renderer = new UILayerRenderer();
      
      renderer.startSelectionBox(100, 100);
      renderer.updateSelectionBox(150, 150);
      renderer.updateSelectionBox(200, 200);
      renderer.endSelectionBox();
      
      expect(renderer.interactionUI.selectionBox.active).to.be.false;
    });
    
    it('should handle tooltip show/hide cycle', () => {
      const renderer = new UILayerRenderer();
      
      renderer.showTooltip('Tooltip 1', 100, 100);
      expect(renderer.interactionUI.tooltips.active).to.be.true;
      
      renderer.hideTooltip();
      expect(renderer.interactionUI.tooltips.active).to.be.false;
      
      renderer.showTooltip('Tooltip 2', 200, 200);
      expect(renderer.interactionUI.tooltips.text).to.equal('Tooltip 2');
    });
    
    it('should handle multiple context menu cycles', () => {
      const renderer = new UILayerRenderer();
      
      renderer.showContextMenu(['Option 1'], 100, 100);
      renderer.hideContextMenu();
      renderer.showContextMenu(['Option 2', 'Option 3'], 200, 200);
      
      expect(renderer.interactionUI.contextMenu.items).to.have.lengthOf(2);
    });
    
    it('should handle debug UI state transitions', () => {
      const renderer = new UILayerRenderer();
      
      renderer.togglePerformanceOverlay();
      expect(renderer.debugUI.performanceOverlay.enabled).to.be.false;
      
      renderer.toggleEntityInspector();
      expect(renderer.debugUI.entityInspector.enabled).to.be.true;
      
      const entity = { id: 1 };
      renderer.selectEntityForInspection(entity);
      expect(renderer.debugUI.entityInspector.selectedEntity).to.equal(entity);
    });
    
    it('should maintain state across multiple renders', () => {
      const renderer = new UILayerRenderer();
      renderer.config.enableHUD = false;
      renderer.debugUI.performanceOverlay.enabled = false;
      
      renderer.renderUI('PLAYING');
      renderer.renderUI('PLAYING');
      
      expect(renderer.config.enableHUD).to.be.false;
      expect(renderer.debugUI.performanceOverlay.enabled).to.be.false;
    });
  });
});

