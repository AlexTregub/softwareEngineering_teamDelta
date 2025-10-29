/**
 * Unit Tests for FramebufferManager
 * Tests framebuffer optimization system
 */

const { expect } = require('chai');

// Mock p5.js functions
global.createGraphics = (w, h) => ({
  _width: w,
  _height: h,
  _layerName: null,
  _hasAlpha: true,
  _lastUpdate: 0,
  _isDirty: true,
  clear: function() {},
  image: function() {},
  remove: function() {}
});
global.image = () => {};
global.millis = () => Date.now();
global.performance = global.performance || { now: () => Date.now() };

// Load FramebufferManager
const { FramebufferManager, AdaptiveFramebufferManager } = require('../../../Classes/systems/FramebufferManager');

describe('FramebufferManager', function() {
  
  let manager;
  
  beforeEach(function() {
    manager = new FramebufferManager();
  });
  
  describe('Constructor', function() {
    
    it('should create manager with default configuration', function() {
      expect(manager).to.exist;
      expect(manager.framebuffers).to.be.instanceOf(Map);
      expect(manager.config.enabled).to.be.true;
    });
    
    it('should initialize empty framebuffer storage', function() {
      expect(manager.framebuffers.size).to.equal(0);
      expect(manager.changeTracking.size).to.equal(0);
    });
    
    it('should have default buffer configurations', function() {
      expect(manager.bufferConfigs).to.be.instanceOf(Map);
      expect(manager.bufferConfigs.has('TERRAIN')).to.be.true;
      expect(manager.bufferConfigs.has('ENTITIES')).to.be.true;
      expect(manager.bufferConfigs.has('EFFECTS')).to.be.true;
    });
    
    it('should initialize statistics tracking', function() {
      expect(manager.stats.totalFramebuffers).to.equal(0);
      expect(manager.stats.cacheHits).to.equal(0);
      expect(manager.stats.cacheMisses).to.equal(0);
    });
  });
  
  describe('initialize()', function() {
    
    it('should initialize with canvas dimensions', function() {
      const result = manager.initialize(800, 600);
      
      expect(result).to.be.true;
      expect(manager.canvasWidth).to.equal(800);
      expect(manager.canvasHeight).to.equal(600);
    });
    
    it('should update buffer config sizes', function() {
      manager.initialize(1024, 768);
      
      const terrainConfig = manager.bufferConfigs.get('TERRAIN');
      expect(terrainConfig.size.width).to.equal(1024);
      expect(terrainConfig.size.height).to.equal(768);
    });
    
    it('should initialize change tracking for layers', function() {
      manager.initialize(800, 600);
      
      expect(manager.changeTracking.has('TERRAIN')).to.be.true;
      expect(manager.changeTracking.has('ENTITIES')).to.be.true;
      
      const tracking = manager.changeTracking.get('TERRAIN');
      expect(tracking.isDirty).to.be.true;
      expect(tracking.changeCount).to.equal(0);
    });
    
    it('should return false when disabled', function() {
      manager.config.enabled = false;
      const result = manager.initialize(800, 600);
      
      expect(result).to.be.false;
    });
    
    it('should accept custom options', function() {
      manager.initialize(800, 600, { debugMode: true });
      
      expect(manager.config.debugMode).to.be.true;
    });
  });
  
  describe('createFramebuffer()', function() {
    
    it('should create framebuffer with specified dimensions', function() {
      const buffer = manager.createFramebuffer('TEST', 640, 480, true);
      
      expect(buffer).to.exist;
      expect(buffer._width).to.equal(640);
      expect(buffer._height).to.equal(480);
    });
    
    it('should store framebuffer in map', function() {
      manager.createFramebuffer('CUSTOM', 800, 600);
      
      expect(manager.framebuffers.has('CUSTOM')).to.be.true;
    });
    
    it('should increment statistics', function() {
      const beforeCount = manager.stats.totalFramebuffers;
      
      manager.createFramebuffer('TEST', 100, 100);
      
      expect(manager.stats.totalFramebuffers).to.equal(beforeCount + 1);
      expect(manager.stats.activeFramebuffers).to.equal(beforeCount + 1);
    });
    
    it('should estimate memory usage', function() {
      const beforeMemory = manager.stats.memoryUsage;
      
      manager.createFramebuffer('TEST', 100, 100, true);
      
      expect(manager.stats.memoryUsage).to.be.greaterThan(beforeMemory);
    });
    
    it('should handle createGraphics unavailable', function() {
      const oldCreateGraphics = global.createGraphics;
      delete global.createGraphics;
      
      const buffer = manager.createFramebuffer('TEST', 100, 100);
      
      expect(buffer).to.be.null;
      expect(manager.config.enabled).to.be.false;
      
      global.createGraphics = oldCreateGraphics;
    });
  });
  
  describe('getFramebuffer()', function() {
    
    it('should return existing framebuffer', function() {
      const created = manager.createFramebuffer('EXISTING', 100, 100);
      const retrieved = manager.getFramebuffer('EXISTING');
      
      expect(retrieved).to.equal(created);
    });
    
    it('should create framebuffer if config exists', function() {
      manager.initialize(800, 600);
      
      const buffer = manager.getFramebuffer('TERRAIN');
      
      expect(buffer).to.exist;
      expect(manager.framebuffers.has('TERRAIN')).to.be.true;
    });
    
    it('should return null when disabled', function() {
      manager.config.enabled = false;
      const buffer = manager.getFramebuffer('TEST');
      
      expect(buffer).to.be.null;
    });
    
    it('should return null for unknown layer without config', function() {
      const buffer = manager.getFramebuffer('UNKNOWN');
      
      expect(buffer).to.be.null;
    });
  });
  
  describe('markLayerDirty()', function() {
    
    it('should mark layer as dirty', function() {
      manager.initialize(800, 600);
      
      const tracking = manager.changeTracking.get('TERRAIN');
      tracking.isDirty = false;
      
      manager.markLayerDirty('TERRAIN');
      
      expect(tracking.isDirty).to.be.true;
      expect(tracking.changeCount).to.equal(1);
    });
    
    it('should update last change time', function() {
      manager.initialize(800, 600);
      
      const before = Date.now();
      manager.markLayerDirty('TERRAIN');
      const tracking = manager.changeTracking.get('TERRAIN');
      
      expect(tracking.lastChangeTime).to.be.at.least(before);
    });
    
    it('should handle unknown layer gracefully', function() {
      expect(() => {
        manager.markLayerDirty('UNKNOWN');
      }).to.not.throw();
    });
  });
  
  describe('markLayerClean()', function() {
    
    it('should mark layer as clean', function() {
      manager.initialize(800, 600);
      manager.markLayerDirty('TERRAIN');
      
      manager.markLayerClean('TERRAIN');
      
      const tracking = manager.changeTracking.get('TERRAIN');
      expect(tracking.isDirty).to.be.false;
      expect(tracking.forceRefresh).to.be.false;
    });
    
    it('should update last update time', function() {
      manager.initialize(800, 600);
      
      const before = Date.now();
      manager.markLayerClean('TERRAIN');
      
      const lastUpdate = manager.lastUpdateTimes.get('TERRAIN');
      expect(lastUpdate).to.be.at.least(before);
    });
  });
  
  describe('shouldRedrawLayer()', function() {
    
    it('should return true when change tracking disabled', function() {
      manager.config.enableChangeTracking = false;
      
      expect(manager.shouldRedrawLayer('TERRAIN')).to.be.true;
    });
    
    it('should return true when forced refresh', function() {
      manager.initialize(800, 600);
      
      const tracking = manager.changeTracking.get('TERRAIN');
      tracking.forceRefresh = true;
      
      expect(manager.shouldRedrawLayer('TERRAIN')).to.be.true;
    });
    
    it('should return true when buffer age exceeds maximum', function() {
      manager.initialize(800, 600);
      manager.config.maxBufferAge = 100;
      
      manager.lastUpdateTimes.set('TERRAIN', Date.now() - 200);
      
      expect(manager.shouldRedrawLayer('TERRAIN')).to.be.true;
    });
  });
  
  describe('forceRefreshAll()', function() {
    
    it('should force refresh all layers', function() {
      manager.initialize(800, 600);
      
      manager.forceRefreshAll();
      
      manager.changeTracking.forEach(tracking => {
        expect(tracking.forceRefresh).to.be.true;
        expect(tracking.isDirty).to.be.true;
      });
    });
  });
  
  describe('forceRefreshLayer()', function() {
    
    it('should force refresh specific layer', function() {
      manager.initialize(800, 600);
      
      manager.forceRefreshLayer('TERRAIN');
      
      const tracking = manager.changeTracking.get('TERRAIN');
      expect(tracking.forceRefresh).to.be.true;
      expect(tracking.isDirty).to.be.true;
    });
  });
  
  describe('destroyFramebuffer()', function() {
    
    it('should remove framebuffer from map', function() {
      manager.createFramebuffer('TEST', 100, 100);
      expect(manager.framebuffers.has('TEST')).to.be.true;
      
      manager.destroyFramebuffer('TEST');
      
      expect(manager.framebuffers.has('TEST')).to.be.false;
    });
    
    it('should decrement active count', function() {
      manager.createFramebuffer('TEST', 100, 100);
      const before = manager.stats.activeFramebuffers;
      
      manager.destroyFramebuffer('TEST');
      
      expect(manager.stats.activeFramebuffers).to.equal(before - 1);
    });
    
    it('should handle non-existent framebuffer', function() {
      expect(() => {
        manager.destroyFramebuffer('NONEXISTENT');
      }).to.not.throw();
    });
  });
  
  describe('cleanup()', function() {
    
    it('should destroy all framebuffers', function() {
      manager.createFramebuffer('TEST1', 100, 100);
      manager.createFramebuffer('TEST2', 100, 100);
      
      manager.cleanup();
      
      expect(manager.framebuffers.size).to.equal(0);
      expect(manager.stats.activeFramebuffers).to.equal(0);
    });
    
    it('should reset tracking data', function() {
      manager.initialize(800, 600);
      
      manager.cleanup();
      
      expect(manager.changeTracking.size).to.equal(0);
      expect(manager.lastUpdateTimes.size).to.equal(0);
    });
    
    it('should reset statistics', function() {
      manager.stats.cacheHits = 100;
      manager.stats.cacheMisses = 50;
      
      manager.cleanup();
      
      expect(manager.stats.cacheHits).to.equal(0);
      expect(manager.stats.cacheMisses).to.equal(0);
    });
  });
  
  describe('getStatistics()', function() {
    
    it('should return statistics object', function() {
      const stats = manager.getStatistics();
      
      expect(stats).to.be.an('object');
      expect(stats).to.have.property('cacheHitRate');
      expect(stats).to.have.property('memoryUsageMB');
      expect(stats).to.have.property('isEnabled');
    });
    
    it('should calculate cache hit rate', function() {
      manager.stats.cacheHits = 80;
      manager.stats.cacheMisses = 20;
      
      const stats = manager.getStatistics();
      
      expect(stats.cacheHitRate).to.equal(80);
    });
    
    it('should convert memory to MB', function() {
      manager.stats.memoryUsage = 1024 * 1024 * 5; // 5 MB
      
      const stats = manager.getStatistics();
      
      expect(stats.memoryUsageMB).to.equal(5);
    });
  });
  
  describe('updateConfig()', function() {
    
    it('should update configuration options', function() {
      manager.updateConfig({ debugMode: true });
      
      expect(manager.config.debugMode).to.be.true;
    });
    
    it('should cleanup when disabling', function() {
      manager.initialize(800, 600);
      manager.createFramebuffer('TEST', 100, 100);
      
      manager.updateConfig({ enabled: false });
      
      expect(manager.framebuffers.size).to.equal(0);
    });
  });
});

describe('AdaptiveFramebufferManager', function() {
  
  let adaptive;
  
  beforeEach(function() {
    adaptive = new AdaptiveFramebufferManager();
  });
  
  describe('Constructor', function() {
    
    it('should initialize metrics and strategies maps', function() {
      expect(adaptive.layerMetrics).to.be.instanceOf(Map);
      expect(adaptive.refreshStrategies).to.be.instanceOf(Map);
    });
  });
  
  describe('getLayerMetrics()', function() {
    
    it('should create metrics for new layer', function() {
      const metrics = adaptive.getLayerMetrics('TEST');
      
      expect(metrics).to.exist;
      expect(metrics.avgRenderTime).to.equal(0);
      expect(metrics.renderCount).to.equal(0);
    });
    
    it('should return existing metrics', function() {
      const first = adaptive.getLayerMetrics('TEST');
      first.renderCount = 5;
      
      const second = adaptive.getLayerMetrics('TEST');
      
      expect(second.renderCount).to.equal(5);
    });
  });
  
  describe('getRefreshStrategy()', function() {
    
    it('should return static strategy for static layers', function() {
      const strategy = adaptive.getRefreshStrategy('TEST', 'static');
      
      expect(strategy.type).to.equal('static');
    });
    
    it('should return time-based strategy for low refresh', function() {
      const strategy = adaptive.getRefreshStrategy('TEST', 'low');
      
      expect(strategy.type).to.equal('time-based');
      expect(strategy.interval).to.equal(500);
    });
    
    it('should return adaptive strategy for high refresh', function() {
      const strategy = adaptive.getRefreshStrategy('TEST', 'high');
      
      expect(strategy.type).to.equal('adaptive');
    });
    
    it('should cache strategy for layer', function() {
      adaptive.getRefreshStrategy('TEST', 'always');
      
      expect(adaptive.refreshStrategies.has('TEST')).to.be.true;
    });
  });
  
  describe('recordRenderTime()', function() {
    
    it('should record render time', function() {
      adaptive.recordRenderTime('TEST', 15.5);
      
      const metrics = adaptive.layerMetrics.get('TEST');
      expect(metrics.renderCount).to.equal(1);
      expect(metrics.lastRenderTime).to.equal(15.5);
    });
    
    it('should calculate average render time', function() {
      adaptive.recordRenderTime('TEST', 10);
      adaptive.recordRenderTime('TEST', 20);
      adaptive.recordRenderTime('TEST', 30);
      
      const metrics = adaptive.layerMetrics.get('TEST');
      expect(metrics.avgRenderTime).to.equal(20);
    });
  });
  
  describe('shouldRefresh()', function() {
    
    it('should refresh static layers when dirty', function() {
      const tracking = { isDirty: true };
      const result = adaptive.shouldRefresh('TEST', 'static', tracking, Date.now());
      
      expect(result).to.be.true;
    });
    
    it('should not refresh static layers when clean', function() {
      const tracking = { isDirty: false };
      const result = adaptive.shouldRefresh('TEST', 'static', tracking, Date.now());
      
      expect(result).to.be.false;
    });
    
    it('should refresh always layers', function() {
      const tracking = {};
      const result = adaptive.shouldRefresh('TEST', 'always', tracking, Date.now());
      
      expect(result).to.be.true;
    });
  });
  
  describe('getDiagnostics()', function() {
    
    it('should return diagnostic information', function() {
      adaptive.recordRenderTime('TEST', 10);
      
      const diagnostics = adaptive.getDiagnostics();
      
      expect(diagnostics).to.have.property('layerMetrics');
      expect(diagnostics).to.have.property('refreshStrategies');
    });
  });
});
