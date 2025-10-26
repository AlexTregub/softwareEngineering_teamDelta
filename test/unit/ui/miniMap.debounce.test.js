/**
 * Unit Tests - MiniMap Debounced Cache Invalidation
 * 
 * Tests the debounced cache invalidation system for terrain editing:
 * - Schedule invalidation when painting starts
 * - Debounce multiple rapid edits
 * - Invalidate cache 1 second after last edit
 * - Cancel pending invalidation if disabled
 * 
 * TDD Phase: RED - Tests written FIRST, implementation follows
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('MiniMap - Debounced Cache Invalidation', function() {
  let MiniMap;
  let clock;
  let mockTerrain;
  let mockCacheManager;

  beforeEach(function() {
    // Setup fake timers for debounce testing
    clock = sinon.useFakeTimers({
      shouldAdvanceTime: false,
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval']
    });
    
    // Mock terrain
    mockTerrain = {
      width: 50,
      height: 50,
      tileSize: 32,
      getArrPos: sinon.stub().returns({
        getMaterial: () => 'grass'
      })
    };
    
    // Mock CacheManager
    mockCacheManager = {
      register: sinon.stub(),
      getCache: sinon.stub().returns({
        _buffer: { clear: sinon.stub() },
        valid: false,
        config: { renderCallback: sinon.stub() },
        hits: 0
      }),
      invalidate: sinon.stub(),
      removeCache: sinon.stub()
    };
    
    // Setup globals
    global.CacheManager = {
      getInstance: () => mockCacheManager
    };
    
    // Load MiniMap
    delete require.cache[require.resolve('../../../Classes/ui/MiniMap')];
    MiniMap = require('../../../Classes/ui/MiniMap');
    
    if (!MiniMap) {
      this.skip();
    }
  });

  afterEach(function() {
    clock.restore();
    sinon.restore();
    delete global.CacheManager;
  });

  describe('Debounce Timer', function() {
    it('should have debounce delay property (default 1000ms)', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      expect(minimap).to.have.property('_invalidateDebounceDelay');
      expect(minimap._invalidateDebounceDelay).to.equal(1000);
    });

    it('should allow configuring debounce delay', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      minimap.setInvalidateDebounceDelay(500);
      expect(minimap._invalidateDebounceDelay).to.equal(500);
    });

    it('should track pending invalidation timer', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      expect(minimap).to.have.property('_invalidateTimer');
      expect(minimap._invalidateTimer).to.be.null;
    });
  });

  describe('Schedule Invalidation', function() {
    it('should schedule invalidation on first edit', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      minimap.scheduleInvalidation();
      
      expect(minimap._invalidateTimer).to.not.be.null;
    });

    it('should NOT invalidate immediately', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      minimap.scheduleInvalidation();
      
      expect(mockCacheManager.invalidate.called).to.be.false;
    });

    it('should invalidate after debounce delay (1000ms)', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      minimap.scheduleInvalidation();
      clock.tick(999); // Just before delay
      expect(mockCacheManager.invalidate.called).to.be.false;
      
      clock.tick(1); // At delay
      expect(mockCacheManager.invalidate.calledOnce).to.be.true;
    });

    it('should reset timer on subsequent edits (debouncing)', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      minimap.scheduleInvalidation();
      clock.tick(500); // 500ms pass
      
      minimap.scheduleInvalidation(); // Second edit resets timer
      clock.tick(500); // 500ms more (1000ms total)
      
      // Should NOT have invalidated yet (timer was reset)
      expect(mockCacheManager.invalidate.called).to.be.false;
      
      clock.tick(500); // 500ms more (1500ms total, 1000ms from second edit)
      expect(mockCacheManager.invalidate.calledOnce).to.be.true;
    });

    it('should handle rapid edits correctly (only invalidate once)', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      // Simulate 10 rapid edits
      for (let i = 0; i < 10; i++) {
        minimap.scheduleInvalidation();
        clock.tick(100); // 100ms between edits
      }
      
      // Should not have invalidated during edits
      expect(mockCacheManager.invalidate.called).to.be.false;
      
      // Wait for debounce after last edit
      clock.tick(1000);
      
      // Should invalidate exactly once
      expect(mockCacheManager.invalidate.calledOnce).to.be.true;
    });
  });

  describe('Cancel Scheduled Invalidation', function() {
    it('should cancel pending invalidation', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      minimap.scheduleInvalidation();
      expect(minimap._invalidateTimer).to.not.be.null;
      
      minimap.cancelScheduledInvalidation();
      expect(minimap._invalidateTimer).to.be.null;
    });

    it('should NOT invalidate after cancellation', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      minimap.scheduleInvalidation();
      minimap.cancelScheduledInvalidation();
      
      clock.tick(2000);
      expect(mockCacheManager.invalidate.called).to.be.false;
    });

    it('should handle cancellation when no timer exists', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      expect(() => minimap.cancelScheduledInvalidation()).to.not.throw();
    });
  });

  describe('Immediate Invalidation', function() {
    it('should still support immediate invalidation', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      minimap.invalidateCache();
      
      expect(mockCacheManager.invalidate.calledOnce).to.be.true;
    });

    it('should cancel pending timer when immediately invalidating', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      minimap.scheduleInvalidation();
      expect(minimap._invalidateTimer).to.not.be.null;
      
      minimap.invalidateCache();
      expect(minimap._invalidateTimer).to.be.null;
    });

    it('should not double-invalidate if timer fires after immediate invalidation', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      minimap.scheduleInvalidation();
      minimap.invalidateCache(); // Immediate invalidation
      
      clock.tick(2000); // Timer would have fired
      
      // Should only be called once (from immediate invalidation)
      expect(mockCacheManager.invalidate.calledOnce).to.be.true;
    });
  });

  describe('Cleanup', function() {
    it('should clear timer on destroy', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      minimap.scheduleInvalidation();
      expect(minimap._invalidateTimer).to.not.be.null;
      
      minimap.destroy();
      expect(minimap._invalidateTimer).to.be.null;
    });

    it('should not invalidate after destroy', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      minimap.scheduleInvalidation();
      minimap.destroy();
      
      clock.tick(2000);
      expect(mockCacheManager.invalidate.called).to.be.false;
    });
  });

  describe('Edge Cases', function() {
    it('should handle zero debounce delay', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      minimap.setInvalidateDebounceDelay(0);
      
      minimap.scheduleInvalidation();
      clock.tick(0);
      
      expect(mockCacheManager.invalidate.calledOnce).to.be.true;
    });

    it('should handle very long debounce delay', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      minimap.setInvalidateDebounceDelay(10000);
      
      minimap.scheduleInvalidation();
      clock.tick(9999);
      expect(mockCacheManager.invalidate.called).to.be.false;
      
      clock.tick(1);
      expect(mockCacheManager.invalidate.calledOnce).to.be.true;
    });

    it('should handle cache disabled scenario', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      minimap.setCacheEnabled(false);
      
      minimap.scheduleInvalidation();
      clock.tick(1000);
      
      // Should not crash, timer should be cleaned up
      expect(minimap._invalidateTimer).to.be.null;
    });

    it('should handle multiple schedule/cancel cycles', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      minimap.scheduleInvalidation();
      minimap.cancelScheduledInvalidation();
      
      minimap.scheduleInvalidation();
      minimap.cancelScheduledInvalidation();
      
      minimap.scheduleInvalidation();
      clock.tick(1000);
      
      expect(mockCacheManager.invalidate.calledOnce).to.be.true;
    });
  });

  describe('Integration with Terrain Editing', function() {
    it('should provide method to notify terrain change started', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      expect(minimap).to.respondTo('notifyTerrainEditStart');
    });

    it('should provide method to notify terrain change ended', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      expect(minimap).to.respondTo('notifyTerrainEditEnd');
    });

    it('should schedule invalidation when edit starts', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      minimap.notifyTerrainEditStart();
      
      expect(minimap._invalidateTimer).to.not.be.null;
    });

    it('should schedule invalidation when edit ends (debounced)', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      minimap.notifyTerrainEditStart();
      clock.tick(100);
      minimap.notifyTerrainEditEnd();
      
      // Should still be scheduled
      expect(minimap._invalidateTimer).to.not.be.null;
      
      // Should invalidate after debounce
      clock.tick(1000);
      expect(mockCacheManager.invalidate.calledOnce).to.be.true;
    });
  });
});
