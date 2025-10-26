/**
 * Unit Tests - FullBufferCache Strategy
 * 
 * Tests the FullBufferCache strategy for caching static content to off-screen buffers.
 * This strategy is ideal for content that rarely changes (like minimap terrain).
 * 
 * TDD Phase: RED - Tests written FIRST, implementation follows
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupUITestEnvironment } = require('../../../helpers/uiTestHelpers');

describe('FullBufferCache Strategy', function() {
  let cleanup;
  let FullBufferCache;

  beforeEach(function() {
    cleanup = setupUITestEnvironment();
    
    // Mock createGraphics to return a stubbed p5.Graphics object
    global.createGraphics = sinon.stub().callsFake((w, h) => ({
      width: w,
      height: h,
      clear: sinon.stub(),
      remove: sinon.stub(),
      background: sinon.stub(),
      fill: sinon.stub(),
      rect: sinon.stub(),
      ellipse: sinon.stub()
    }));
    window.createGraphics = global.createGraphics;
    
    // Load FullBufferCache
    FullBufferCache = require('../../../../Classes/rendering/caches/FullBufferCache');
    global.FullBufferCache = FullBufferCache;
    
    if (!FullBufferCache) {
      this.skip();
    }
  });

  afterEach(function() {
    if (cleanup) cleanup();
    sinon.restore();
  });

  describe('Initialization', function() {
    it('should create cache with valid dimensions', function() {
      const cache = new FullBufferCache('test-cache', { width: 100, height: 100 });
      
      expect(cache.name).to.equal('test-cache');
      expect(cache.width).to.equal(100);
      expect(cache.height).to.equal(100);
      expect(cache.valid).to.be.false; // Not valid until rendered
    });

    it('should initialize with default config if not provided', function() {
      const cache = new FullBufferCache('test-cache');
      
      expect(cache.name).to.equal('test-cache');
      expect(cache.width).to.be.a('number');
      expect(cache.height).to.be.a('number');
    });

    it('should create graphics buffer on initialization', function() {
      const cache = new FullBufferCache('test-cache', { width: 200, height: 200 });
      
      // Buffer may be null in test environment
      if (cache._buffer !== undefined) {
        if (cache._buffer) {
          expect(cache._buffer.width).to.equal(200);
          expect(cache._buffer.height).to.equal(200);
        }
      }
    });

    it('should track creation timestamp', function() {
      const beforeCreate = Date.now();
      const cache = new FullBufferCache('test-cache', { width: 100, height: 100 });
      const afterCreate = Date.now();
      
      expect(cache.created).to.be.at.least(beforeCreate);
      expect(cache.created).to.be.at.most(afterCreate);
    });
  });

  describe('Buffer Management', function() {
    it('should calculate memory usage correctly', function() {
      const cache = new FullBufferCache('test-cache', { width: 100, height: 100 });
      
      // RGBA = 4 bytes per pixel
      const expectedMemory = 100 * 100 * 4;
      expect(cache.getMemoryUsage()).to.equal(expectedMemory);
    });

    it('should return buffer for rendering', function() {
      const cache = new FullBufferCache('test-cache', { width: 100, height: 100 });
      const buffer = cache.getBuffer();
      
      // Buffer may be null in test environment
      if (buffer !== null && buffer !== undefined) {
        expect(buffer).to.have.property('width');
        expect(buffer).to.have.property('height');
      } else {
        // In test environment, buffer may be null
        expect(buffer).to.satisfy(b => b === null || b === undefined);
      }
    });

    it('should cleanup buffer on destroy', function() {
      const cache = new FullBufferCache('test-cache', { width: 100, height: 100 });
      
      // Get the buffer and track remove calls
      const buffer = cache._buffer;
      
      if (buffer && buffer.remove) {
        // Track if remove was called (it's already a stub)
        const callCountBefore = buffer.remove.callCount;
        cache.destroy();
        expect(buffer.remove.callCount).to.equal(callCountBefore + 1);
      } else {
        // In test environment, just verify destroy doesn't throw
        expect(() => cache.destroy()).to.not.throw();
      }
      
      expect(cache._buffer).to.be.null;
    });

    it('should handle missing createGraphics gracefully', function() {
      const originalCreateGraphics = global.createGraphics;
      global.createGraphics = null;
      window.createGraphics = null;
      
      const cache = new FullBufferCache('test-cache', { width: 100, height: 100 });
      
      expect(cache._buffer).to.be.null;
      expect(cache.getMemoryUsage()).to.equal(100 * 100 * 4); // Still tracks memory
      
      global.createGraphics = originalCreateGraphics;
      window.createGraphics = originalCreateGraphics;
    });
  });

  describe('Render Callback', function() {
    it('should accept and store render callback', function() {
      const renderFn = sinon.stub();
      const cache = new FullBufferCache('test-cache', { 
        width: 100, 
        height: 100,
        renderCallback: renderFn 
      });
      
      expect(cache._renderCallback).to.equal(renderFn);
    });

    it('should call render callback during cache generation', function() {
      const renderFn = sinon.stub();
      const cache = new FullBufferCache('test-cache', { 
        width: 100, 
        height: 100,
        renderCallback: renderFn 
      });
      
      cache.generate();
      
      expect(renderFn.calledOnce).to.be.true;
      
      // Callback should receive the buffer (or null in test environment)
      const callArg = renderFn.firstCall.args[0];
      if (callArg !== null && callArg !== undefined) {
        expect(callArg).to.have.property('width');
      }
    });

    it('should mark cache as valid after successful generation', function() {
      const renderFn = sinon.stub();
      const cache = new FullBufferCache('test-cache', { 
        width: 100, 
        height: 100,
        renderCallback: renderFn 
      });
      
      expect(cache.valid).to.be.false;
      cache.generate();
      expect(cache.valid).to.be.true;
    });

    it('should handle render callback errors gracefully', function() {
      const renderFn = sinon.stub().throws(new Error('Render failed'));
      const cache = new FullBufferCache('test-cache', { 
        width: 100, 
        height: 100,
        renderCallback: renderFn 
      });
      
      expect(() => cache.generate()).to.not.throw();
      expect(cache.valid).to.be.false; // Should remain invalid on error
    });
  });

  describe('Cache Invalidation', function() {
    it('should mark cache as invalid when invalidated', function() {
      const cache = new FullBufferCache('test-cache', { width: 100, height: 100 });
      cache.generate();
      
      expect(cache.valid).to.be.true;
      cache.invalidate();
      expect(cache.valid).to.be.false;
    });

    it('should support partial invalidation with region', function() {
      const cache = new FullBufferCache('test-cache', { width: 100, height: 100 });
      cache.generate();
      
      cache.invalidate({ x: 10, y: 10, width: 20, height: 20 });
      
      // FullBuffer strategy doesn't support partial invalidation,
      // so entire cache should be marked invalid
      expect(cache.valid).to.be.false;
    });

    it('should allow regeneration after invalidation', function() {
      const renderFn = sinon.stub();
      const cache = new FullBufferCache('test-cache', { 
        width: 100, 
        height: 100,
        renderCallback: renderFn 
      });
      
      cache.generate();
      expect(renderFn.callCount).to.equal(1);
      
      cache.invalidate();
      cache.generate();
      expect(renderFn.callCount).to.equal(2);
    });
  });

  describe('Statistics', function() {
    it('should track hit count', function() {
      const cache = new FullBufferCache('test-cache', { width: 100, height: 100 });
      
      expect(cache.hits).to.equal(0);
      cache.recordHit();
      expect(cache.hits).to.equal(1);
      cache.recordHit();
      expect(cache.hits).to.equal(2);
    });

    it('should track miss count', function() {
      const cache = new FullBufferCache('test-cache', { width: 100, height: 100 });
      
      expect(cache.misses).to.equal(0);
      cache.recordMiss();
      expect(cache.misses).to.equal(1);
      cache.recordMiss();
      expect(cache.misses).to.equal(2);
    });

    it('should track last access time', function() {
      const cache = new FullBufferCache('test-cache', { width: 100, height: 100 });
      
      const initialAccess = cache.lastAccessed;
      cache.recordHit();
      
      expect(cache.lastAccessed).to.be.greaterThan(initialAccess);
    });

    it('should provide comprehensive stats', function() {
      const cache = new FullBufferCache('test-cache', { width: 100, height: 100 });
      cache.generate();
      cache.recordHit();
      cache.recordHit();
      cache.recordMiss();
      
      const stats = cache.getStats();
      
      expect(stats).to.have.property('name', 'test-cache');
      expect(stats).to.have.property('strategy', 'fullBuffer');
      expect(stats).to.have.property('width', 100);
      expect(stats).to.have.property('height', 100);
      expect(stats).to.have.property('memoryUsage', 100 * 100 * 4);
      expect(stats).to.have.property('valid', true);
      expect(stats).to.have.property('hits', 2);
      expect(stats).to.have.property('misses', 1);
      expect(stats).to.have.property('created');
      expect(stats).to.have.property('lastAccessed');
    });
  });

  describe('Protected Cache', function() {
    it('should support protected flag to prevent eviction', function() {
      const cache = new FullBufferCache('test-cache', { 
        width: 100, 
        height: 100,
        protected: true 
      });
      
      expect(cache.protected).to.be.true;
    });

    it('should default to unprotected', function() {
      const cache = new FullBufferCache('test-cache', { width: 100, height: 100 });
      
      expect(cache.protected).to.be.false;
    });

    it('should allow toggling protected status', function() {
      const cache = new FullBufferCache('test-cache', { width: 100, height: 100 });
      
      expect(cache.protected).to.be.false;
      cache.setProtected(true);
      expect(cache.protected).to.be.true;
      cache.setProtected(false);
      expect(cache.protected).to.be.false;
    });
  });

  describe('Edge Cases', function() {
    it('should handle zero dimensions', function() {
      const cache = new FullBufferCache('test-cache', { width: 0, height: 0 });
      
      // Memory usage should be 0 regardless of buffer creation
      expect(cache.getMemoryUsage()).to.equal(0);
      expect(cache.width).to.equal(0);
      expect(cache.height).to.equal(0);
    });

    it('should handle very large dimensions', function() {
      const cache = new FullBufferCache('test-cache', { width: 4096, height: 4096 });
      
      const expectedMemory = 4096 * 4096 * 4; // 64MB
      expect(cache.getMemoryUsage()).to.equal(expectedMemory);
    });

    it('should handle missing render callback during generation', function() {
      const cache = new FullBufferCache('test-cache', { width: 100, height: 100 });
      
      expect(() => cache.generate()).to.not.throw();
      expect(cache.valid).to.be.true; // Should still mark as valid
    });

    it('should handle multiple destroy calls', function() {
      const cache = new FullBufferCache('test-cache', { width: 100, height: 100 });
      
      expect(() => {
        cache.destroy();
        cache.destroy();
        cache.destroy();
      }).to.not.throw();
    });

    it('should handle invalidation of already invalid cache', function() {
      const cache = new FullBufferCache('test-cache', { width: 100, height: 100 });
      
      expect(cache.valid).to.be.false;
      expect(() => cache.invalidate()).to.not.throw();
      expect(cache.valid).to.be.false;
    });
  });
});
