/**
 * Unit Tests: UIObject Base Class
 * 
 * Tests for the UIObject base class with integrated CacheManager support.
 * Following TDD approach - these tests define expected behavior.
 * 
 * Test Coverage:
 * - Constructor & Initialization
 * - Cache Management
 * - Rendering Pattern
 * - Visibility & Common Properties
 * - Cleanup & Destruction
 * - Inheritance & Extensibility
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('UIObject Base Class - Unit Tests', function() {
  let UIObject;
  let mockCacheManager;
  let mockCache;
  let mockBuffer;
  
  beforeEach(function() {
    // Mock p5.js globals
    global.createGraphics = sinon.stub().callsFake((w, h) => {
      return {
        width: w,
        height: h,
        clear: sinon.stub(),
        background: sinon.stub(),
        stroke: sinon.stub(),
        fill: sinon.stub(),
        line: sinon.stub(),
        rect: sinon.stub(),
        remove: sinon.stub(),
        _estimatedMemory: w * h * 4
      };
    });
    
    global.image = sinon.stub();
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.translate = sinon.stub();
    
    // Sync to window for JSDOM
    if (typeof window !== 'undefined') {
      window.createGraphics = global.createGraphics;
      window.image = global.image;
      window.push = global.push;
      window.pop = global.pop;
      window.translate = global.translate;
    }
    
    // Create mock cache buffer
    mockBuffer = global.createGraphics(100, 100);
    
    // Create mock cache
    mockCache = {
      name: 'test-cache',
      strategy: 'fullBuffer',
      memoryUsage: 40000,
      valid: false,
      hits: 0,
      lastAccessed: 0,
      _buffer: mockBuffer
    };
    
    // Mock CacheManager
    mockCacheManager = {
      register: sinon.stub(),
      getCache: sinon.stub().returns(mockCache),
      invalidate: sinon.stub(),
      removeCache: sinon.stub(),
      hasCache: sinon.stub().returns(true),
      getInstance: sinon.stub().returnsThis()
    };
    
    global.CacheManager = {
      getInstance: () => mockCacheManager
    };
    
    if (typeof window !== 'undefined') {
      window.CacheManager = global.CacheManager;
    }
    
    // Load UIObject
    UIObject = require('../../../Classes/ui/UIObject');
  });
  
  afterEach(function() {
    sinon.restore();
    delete global.createGraphics;
    delete global.image;
    delete global.push;
    delete global.pop;
    delete global.translate;
    delete global.CacheManager;
    
    if (typeof window !== 'undefined') {
      delete window.createGraphics;
      delete window.image;
      delete window.push;
      delete window.pop;
      delete window.translate;
      delete window.CacheManager;
    }
  });
  
  // ===================================================================
  // Test Suite 1: Constructor & Initialization
  // ===================================================================
  
  describe('Constructor & Initialization', function() {
    it('should initialize with default config (100x100, fullBuffer, visible=true)', function() {
      const obj = new UIObject();
      
      expect(obj.width).to.equal(100);
      expect(obj.height).to.equal(100);
      expect(obj.visible).to.be.true;
      expect(obj._cacheStrategy).to.equal('fullBuffer');
      expect(obj._cacheEnabled).to.be.true;
    });
    
    it('should accept custom width/height', function() {
      const obj = new UIObject({ width: 200, height: 150 });
      
      expect(obj.width).to.equal(200);
      expect(obj.height).to.equal(150);
    });
    
    it('should accept custom position (x, y)', function() {
      const obj = new UIObject({ x: 50, y: 75 });
      
      expect(obj.x).to.equal(50);
      expect(obj.y).to.equal(75);
    });
    
    it('should accept custom cache strategy', function() {
      const strategies = ['fullBuffer', 'dirtyRect', 'throttled', 'tiled', 'none'];
      
      strategies.forEach(strategy => {
        const obj = new UIObject({ cacheStrategy: strategy });
        expect(obj._cacheStrategy).to.equal(strategy);
      });
    });
    
    it('should set visible flag correctly', function() {
      const visibleObj = new UIObject({ visible: true });
      const hiddenObj = new UIObject({ visible: false });
      
      expect(visibleObj.visible).to.be.true;
      expect(hiddenObj.visible).to.be.false;
    });
    
    it('should register cache with CacheManager if strategy not "none"', function() {
      const obj = new UIObject({ width: 100, height: 100, cacheStrategy: 'fullBuffer' });
      
      expect(mockCacheManager.register.calledOnce).to.be.true;
      
      const registerCall = mockCacheManager.register.firstCall;
      expect(registerCall.args[1]).to.equal('fullBuffer');
      expect(registerCall.args[2].width).to.equal(100);
      expect(registerCall.args[2].height).to.equal(100);
    });
    
    it('should NOT register cache if strategy="none"', function() {
      const obj = new UIObject({ cacheStrategy: 'none' });
      
      expect(mockCacheManager.register.called).to.be.false;
      expect(obj._cacheEnabled).to.be.false;
    });
    
    it('should generate unique cache name including class name', function() {
      const obj1 = new UIObject();
      const obj2 = new UIObject();
      
      expect(obj1._cacheName).to.include('UIObject');
      expect(obj2._cacheName).to.include('UIObject');
      expect(obj1._cacheName).to.not.equal(obj2._cacheName);
    });
    
    it('should handle CacheManager unavailable gracefully', function() {
      delete global.CacheManager;
      if (typeof window !== 'undefined') {
        delete window.CacheManager;
      }
      
      const obj = new UIObject();
      
      expect(obj._cacheEnabled).to.be.false;
      expect(obj._cache).to.be.null;
    });
    
    it('should validate width/height are positive numbers', function() {
      const obj = new UIObject({ width: 100, height: 100 });
      
      expect(obj.width).to.be.a('number');
      expect(obj.height).to.be.a('number');
      expect(obj.width).to.be.above(0);
      expect(obj.height).to.be.above(0);
    });
  });
  
  // ===================================================================
  // Test Suite 2: Cache Management
  // ===================================================================
  
  describe('Cache Management', function() {
    it('should set _isDirty flag to true when markDirty() called', function() {
      const obj = new UIObject();
      obj._isDirty = false;
      
      obj.markDirty();
      
      expect(obj._isDirty).to.be.true;
    });
    
    it('should invalidate CacheManager cache when markDirty() called', function() {
      const obj = new UIObject();
      
      obj.markDirty();
      
      expect(mockCacheManager.invalidate.calledOnce).to.be.true;
      expect(mockCacheManager.invalidate.firstCall.args[0]).to.equal(obj._cacheName);
    });
    
    it('should pass region to CacheManager.invalidate() when markDirty(region) called', function() {
      const obj = new UIObject();
      const region = { x: 10, y: 10, width: 50, height: 50 };
      
      obj.markDirty(region);
      
      expect(mockCacheManager.invalidate.calledOnce).to.be.true;
      expect(mockCacheManager.invalidate.firstCall.args[1]).to.deep.equal(region);
    });
    
    it('should return true from isDirty() after markDirty() called', function() {
      const obj = new UIObject();
      
      obj.markDirty();
      
      expect(obj.isDirty()).to.be.true;
    });
    
    it('should return false from isDirty() after render completes', function() {
      const obj = new UIObject();
      obj.renderToCache = sinon.stub(); // Override abstract method
      obj.markDirty();
      
      obj.render();
      
      expect(obj.isDirty()).to.be.false;
    });
    
    it('should return p5.Graphics buffer from getCacheBuffer()', function() {
      const obj = new UIObject();
      
      const buffer = obj.getCacheBuffer();
      
      expect(buffer).to.equal(mockBuffer);
    });
    
    it('should return null from getCacheBuffer() if caching disabled', function() {
      const obj = new UIObject({ cacheStrategy: 'none' });
      
      const buffer = obj.getCacheBuffer();
      
      expect(buffer).to.be.null;
    });
    
    it('should automatically create cache on construction with fullBuffer strategy', function() {
      const obj = new UIObject({ cacheStrategy: 'fullBuffer' });
      
      expect(mockCacheManager.register.calledOnce).to.be.true;
      expect(obj._cache).to.not.be.null;
    });
    
    it('should include class name in cache name for debugging', function() {
      const obj = new UIObject();
      
      expect(obj._cacheName).to.include('UIObject');
    });
    
    it('should create separate caches for multiple UIObject instances', function() {
      const obj1 = new UIObject();
      const obj2 = new UIObject();
      
      expect(obj1._cacheName).to.not.equal(obj2._cacheName);
      expect(mockCacheManager.register.calledTwice).to.be.true;
    });
  });
  
  // ===================================================================
  // Test Suite 3: Rendering Pattern
  // ===================================================================
  
  describe('Rendering Pattern', function() {
    it('should skip rendering if visible=false', function() {
      const obj = new UIObject({ visible: false });
      obj.renderToCache = sinon.stub();
      obj.renderToScreen = sinon.stub();
      
      obj.render();
      
      expect(obj.renderToCache.called).to.be.false;
      expect(obj.renderToScreen.called).to.be.false;
    });
    
    it('should call renderToCache() if cache dirty', function() {
      const obj = new UIObject();
      obj.renderToCache = sinon.stub();
      obj.markDirty();
      
      obj.render();
      
      expect(obj.renderToCache.calledOnce).to.be.true;
      expect(obj.renderToCache.firstCall.args[0]).to.equal(mockBuffer);
    });
    
    it('should NOT call renderToCache() if cache clean', function() {
      const obj = new UIObject();
      obj.renderToCache = sinon.stub();
      obj._isDirty = false;
      
      obj.render();
      
      expect(obj.renderToCache.called).to.be.false;
    });
    
    it('should call renderToScreen() every frame', function() {
      const obj = new UIObject();
      obj.renderToCache = sinon.stub();
      obj.renderToScreen = sinon.stub();
      obj._isDirty = false;
      
      obj.render();
      
      expect(obj.renderToScreen.calledOnce).to.be.true;
    });
    
    it('should throw error when renderToCache() called (abstract method)', function() {
      const obj = new UIObject();
      
      expect(() => obj.renderToCache(mockBuffer)).to.throw(/must implement renderToCache/);
    });
    
    it('should draw cached buffer with image() when cache exists', function() {
      const obj = new UIObject({ x: 10, y: 20 });
      obj._isDirty = false;
      
      obj.renderToScreen();
      
      expect(global.image.calledOnce).to.be.true;
      expect(global.image.firstCall.args[0]).to.equal(mockBuffer);
      expect(global.image.firstCall.args[1]).to.equal(10);
      expect(global.image.firstCall.args[2]).to.equal(20);
    });
    
    it('should call renderDirect() fallback when no cache', function() {
      const obj = new UIObject({ cacheStrategy: 'none' });
      obj.renderDirect = sinon.stub();
      
      obj.renderToScreen();
      
      expect(global.push.calledOnce).to.be.true;
      expect(global.translate.calledOnce).to.be.true;
      expect(obj.renderDirect.calledOnce).to.be.true;
      expect(global.pop.calledOnce).to.be.true;
    });
    
    it('should do nothing in default renderDirect() implementation', function() {
      const obj = new UIObject();
      
      // Should not throw
      expect(() => obj.renderDirect()).to.not.throw();
    });
    
    it('should clear dirty flag after successful renderToCache()', function() {
      const obj = new UIObject();
      obj.renderToCache = sinon.stub();
      obj.markDirty();
      
      obj.render();
      
      expect(obj._isDirty).to.be.false;
    });
    
    it('should work without cache in fallback mode', function() {
      const obj = new UIObject({ cacheStrategy: 'none' });
      obj.renderDirect = sinon.stub();
      
      obj.render();
      
      expect(obj.renderDirect.calledOnce).to.be.true;
    });
  });
  
  // ===================================================================
  // Test Suite 4: Visibility & Common Properties
  // ===================================================================
  
  describe('Visibility & Common Properties', function() {
    it('should hide component when setVisible(false) called', function() {
      const obj = new UIObject({ visible: true });
      
      obj.setVisible(false);
      
      expect(obj.visible).to.be.false;
    });
    
    it('should show component when setVisible(true) called', function() {
      const obj = new UIObject({ visible: false });
      
      obj.setVisible(true);
      
      expect(obj.visible).to.be.true;
    });
    
    it('should return current visibility state from isVisible()', function() {
      const obj = new UIObject({ visible: true });
      
      expect(obj.isVisible()).to.be.true;
      
      obj.setVisible(false);
      expect(obj.isVisible()).to.be.false;
    });
    
    it('should skip render when visible=false (no cache update)', function() {
      const obj = new UIObject();
      obj.renderToCache = sinon.stub();
      obj.markDirty();
      
      obj.setVisible(false);
      obj.render();
      
      expect(obj.renderToCache.called).to.be.false;
      expect(obj._isDirty).to.be.true; // Still dirty - not rendered
    });
    
    it('should store position (x, y) correctly', function() {
      const obj = new UIObject({ x: 100, y: 200 });
      
      expect(obj.x).to.equal(100);
      expect(obj.y).to.equal(200);
    });
    
    it('should store size (width, height) correctly', function() {
      const obj = new UIObject({ width: 300, height: 400 });
      
      expect(obj.width).to.equal(300);
      expect(obj.height).to.equal(400);
    });
    
    it('should pass protected flag to CacheManager', function() {
      const obj = new UIObject({ protected: true });
      
      expect(mockCacheManager.register.calledOnce).to.be.true;
      const registerCall = mockCacheManager.register.firstCall;
      expect(registerCall.args[2].protected).to.be.true;
    });
    
    it('should not cause multiple cache invalidations on property updates', function() {
      const obj = new UIObject();
      mockCacheManager.invalidate.resetHistory();
      
      obj.x = 50;
      obj.y = 75;
      obj.width = 200;
      obj.height = 150;
      
      // Properties don't auto-invalidate - must call markDirty() manually
      expect(mockCacheManager.invalidate.called).to.be.false;
    });
  });
  
  // ===================================================================
  // Test Suite 5: Cleanup & Destruction
  // ===================================================================
  
  describe('Cleanup & Destruction', function() {
    it('should remove cache from CacheManager when destroy() called', function() {
      const obj = new UIObject();
      
      obj.destroy();
      
      expect(mockCacheManager.removeCache.calledOnce).to.be.true;
      expect(mockCacheManager.removeCache.firstCall.args[0]).to.equal(obj._cacheName);
    });
    
    it('should nullify cache reference on destroy()', function() {
      const obj = new UIObject();
      
      obj.destroy();
      
      expect(obj._cache).to.be.null;
    });
    
    it('should disable caching flag on destroy()', function() {
      const obj = new UIObject();
      
      obj.destroy();
      
      expect(obj._cacheEnabled).to.be.false;
    });
    
    it('should allow destroy() to be called multiple times safely', function() {
      const obj = new UIObject();
      
      obj.destroy();
      obj.destroy();
      obj.destroy();
      
      expect(mockCacheManager.removeCache.calledOnce).to.be.true;
    });
    
    it('should work even if cache never created', function() {
      const obj = new UIObject({ cacheStrategy: 'none' });
      
      expect(() => obj.destroy()).to.not.throw();
    });
    
    it('should call CacheManager.removeCache() with correct cache name', function() {
      const obj = new UIObject();
      const cacheName = obj._cacheName;
      
      obj.destroy();
      
      expect(mockCacheManager.removeCache.firstCall.args[0]).to.equal(cacheName);
    });
    
    it('should free memory after destruction (cache removed from manager)', function() {
      const obj = new UIObject();
      
      obj.destroy();
      
      // Verify cache removal was called (memory cleanup handled by CacheManager)
      expect(mockCacheManager.removeCache.calledOnce).to.be.true;
    });
  });
  
  // ===================================================================
  // Test Suite 6: Inheritance & Extensibility
  // ===================================================================
  
  describe('Inheritance & Extensibility', function() {
    it('should allow subclass to override renderToCache()', function() {
      class TestUIObject extends UIObject {
        renderToCache(buffer) {
          buffer.background(255, 0, 0);
        }
      }
      
      const obj = new TestUIObject();
      obj.markDirty();
      
      obj.render();
      
      expect(mockBuffer.background.calledOnce).to.be.true;
      expect(mockBuffer.background.firstCall.args).to.deep.equal([255, 0, 0]);
    });
    
    it('should allow subclass to override renderToScreen()', function() {
      class TestUIObject extends UIObject {
        renderToCache(buffer) {} // No-op
        renderToScreen() {
          this.customRenderCalled = true;
        }
      }
      
      const obj = new TestUIObject();
      obj.render();
      
      expect(obj.customRenderCalled).to.be.true;
    });
    
    it('should allow subclass to override renderDirect()', function() {
      class TestUIObject extends UIObject {
        renderDirect() {
          this.directRenderCalled = true;
        }
      }
      
      const obj = new TestUIObject({ cacheStrategy: 'none' });
      obj.render();
      
      expect(obj.directRenderCalled).to.be.true;
    });
    
    it('should allow subclass to override update()', function() {
      class TestUIObject extends UIObject {
        renderToCache(buffer) {} // No-op
        update() {
          this.updateCalled = true;
        }
      }
      
      const obj = new TestUIObject();
      obj.update();
      
      expect(obj.updateCalled).to.be.true;
    });
    
    it('should allow subclass to add custom properties', function() {
      class TestUIObject extends UIObject {
        constructor(config) {
          super(config);
          this.customProperty = config.customProperty || 'default';
        }
        renderToCache(buffer) {} // No-op
      }
      
      const obj = new TestUIObject({ customProperty: 'custom value' });
      
      expect(obj.customProperty).to.equal('custom value');
    });
    
    it('should include subclass name in cache name (not "UIObject")', function() {
      class CustomUIComponent extends UIObject {
        renderToCache(buffer) {} // No-op
      }
      
      const obj = new CustomUIComponent();
      
      expect(obj._cacheName).to.include('CustomUIComponent');
      expect(obj._cacheName).to.not.include('UIObject');
    });
    
    it('should not interfere between multiple subclass instances', function() {
      class ComponentA extends UIObject {
        renderToCache(buffer) {} // No-op
      }
      class ComponentB extends UIObject {
        renderToCache(buffer) {} // No-op
      }
      
      const objA = new ComponentA();
      const objB = new ComponentB();
      
      objA.markDirty();
      
      expect(objA._isDirty).to.be.true;
      expect(objB._isDirty).to.be.true; // Starts dirty
    });
    
    it('should allow subclass to disable caching via constructor', function() {
      class TestUIObject extends UIObject {
        renderToCache(buffer) {} // No-op
      }
      
      const obj = new TestUIObject({ cacheStrategy: 'none' });
      
      expect(obj._cacheEnabled).to.be.false;
      expect(mockCacheManager.register.called).to.be.false;
    });
  });
});
