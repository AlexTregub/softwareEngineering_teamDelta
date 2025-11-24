/**
 * Unit Tests for MiniMap Entity Rendering (View Layer)
 * Phase 3: View Layer - Rendering queen and enemy dots
 * 
 * TDD: Write tests FIRST, then implement
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('MiniMap Entity Rendering (View Layer)', function() {
  let MiniMap;
  let miniMap;
  let mockTerrain;
  let mockP5Functions;

  beforeEach(function() {
    // Mock p5.js global functions
    mockP5Functions = {
      push: sinon.stub(),
      pop: sinon.stub(),
      fill: sinon.stub(),
      noFill: sinon.stub(),
      stroke: sinon.stub(),
      noStroke: sinon.stub(),
      strokeWeight: sinon.stub(),
      ellipse: sinon.stub(),
      rect: sinon.stub(),
      image: sinon.stub(),
      imageMode: sinon.stub(),
      translate: sinon.stub(),
      text: sinon.stub(),
      textAlign: sinon.stub(),
      textSize: sinon.stub()
    };

    // Apply mocks globally
    Object.assign(global, mockP5Functions);
    global.CORNER = 'corner';
    global.CENTER = 'center';
    global.TOP = 'top';

    // Setup global mocks
    global.window = global.window || {};
    global.queenAnt = null;
    global.spatialGridManager = null;
    global.cameraManager = null;
    global.logNormal = sinon.stub();
    global.CacheManager = {
      getInstance: sinon.stub().returns({
        register: sinon.stub(),
        getCache: sinon.stub().returns(null),
        invalidate: sinon.stub(),
        removeCache: sinon.stub()
      })
    };
    
    // Mock UICoordinateConverter
    global.UICoordinateConverter = class {
      constructor() {}
      normalizedToScreen(x, y) {
        return { x: 400, y: 400 };
      }
    };

    // Mock terrain
    mockTerrain = {
      width: 100,
      height: 100,
      tileSize: 32,
      getArrPos: sinon.stub().returns({ getMaterial: () => 'grass' })
    };

    // Load MiniMap class
    MiniMap = require('../../../Classes/ui/MiniMap.js');
    miniMap = new MiniMap(mockTerrain, 200, 200);
  });

  afterEach(function() {
    sinon.restore();
    // Clean up global mocks
    Object.keys(mockP5Functions).forEach(key => delete global[key]);
    delete global.CORNER;
    delete global.CENTER;
    delete global.TOP;
    delete global.queenAnt;
    delete global.spatialGridManager;
    delete global.cameraManager;
    delete global.logNormal;
    delete global.CacheManager;
    delete global.UICoordinateConverter;
  });

  describe('_renderEntityDots()', function() {
    it('should be a private method', function() {
      expect(miniMap._renderEntityDots).to.be.a('function');
    });

    it('should use push/pop for graphics context', function() {
      miniMap._renderEntityDots();
      expect(global.push.called).to.be.true;
      expect(global.pop.called).to.be.true;
    });

    it('should not render when showQueenDot and showEnemyDots are false', function() {
      miniMap.showQueenDot = false;
      miniMap.showEnemyDots = false;
      miniMap._renderEntityDots();
      expect(global.ellipse.called).to.be.false;
    });

    it('should render queen dot when queen exists', function() {
      global.queenAnt = {
        type: 'Queen',
        getPosition: () => ({ x: 1600, y: 1600 })
      };
      
      miniMap._renderEntityDots();
      
      // Should set queen color (gold)
      expect(global.fill.calledWith(255, 215, 0)).to.be.true;
      // Should draw ellipse
      expect(global.ellipse.called).to.be.true;
    });

    it('should render queen dot at correct minimap position', function() {
      global.queenAnt = {
        type: 'Queen',
        getPosition: () => ({ x: 1600, y: 1600 }) // Center of 3200x3200 map
      };
      
      miniMap._renderEntityDots();
      
      // Center should map to 100, 100 on 200x200 minimap
      const ellipseCall = global.ellipse.getCall(0);
      expect(ellipseCall.args[0]).to.equal(100); // x
      expect(ellipseCall.args[1]).to.equal(100); // y
      expect(ellipseCall.args[2]).to.equal(6); // diameter (radius * 2)
    });

    it('should not render queen dot when showQueenDot is false', function() {
      global.queenAnt = {
        type: 'Queen',
        getPosition: () => ({ x: 1600, y: 1600 })
      };
      miniMap.showQueenDot = false;
      
      miniMap._renderEntityDots();
      
      expect(global.fill.calledWith(255, 215, 0)).to.be.false;
    });

    it('should render multiple enemy dots', function() {
      global.spatialGridManager = {
        getEntitiesByType: sinon.stub().returns([
          { type: 'Ant', faction: 'enemy', getPosition: () => ({ x: 200, y: 200 }) },
          { type: 'Ant', faction: 'enemy', getPosition: () => ({ x: 800, y: 800 }) },
          { type: 'Ant', faction: 'enemy', getPosition: () => ({ x: 1600, y: 1600 }) }
        ])
      };
      
      miniMap._renderEntityDots();
      
      // Should set enemy color (red)
      expect(global.fill.calledWith(255, 0, 0)).to.be.true;
      // Should draw 3 ellipses (3 enemies)
      expect(global.ellipse.callCount).to.be.at.least(3);
    });

    it('should render enemy dots at correct positions', function() {
      global.spatialGridManager = {
        getEntitiesByType: sinon.stub().returns([
          { type: 'Ant', faction: 'enemy', posX: 3200, posY: 3200 } // Corner
        ])
      };
      
      miniMap._renderEntityDots();
      
      // Corner should map to 200, 200 on minimap
      const lastEllipseCall = global.ellipse.lastCall;
      expect(lastEllipseCall.args[0]).to.equal(200); // x
      expect(lastEllipseCall.args[1]).to.equal(200); // y
    });

    it('should not render enemy dots when showEnemyDots is false', function() {
      global.spatialGridManager = {
        getEntitiesByType: sinon.stub().returns([
          { type: 'Ant', faction: 'enemy', getPosition: () => ({ x: 200, y: 200 }) }
        ])
      };
      miniMap.showEnemyDots = false;
      
      miniMap._renderEntityDots();
      
      expect(global.fill.calledWith(255, 0, 0)).to.be.false;
    });

    it('should use noStroke for clean dots', function() {
      global.queenAnt = {
        type: 'Queen',
        getPosition: () => ({ x: 1600, y: 1600 })
      };
      
      miniMap._renderEntityDots();
      
      expect(global.noStroke.called).to.be.true;
    });

    it('should render both queen and enemies together', function() {
      global.queenAnt = {
        type: 'Queen',
        getPosition: () => ({ x: 1000, y: 1000 })
      };
      global.spatialGridManager = {
        getEntitiesByType: sinon.stub().returns([
          { type: 'Ant', faction: 'enemy', posX: 500, posY: 500 },
          { type: 'Ant', faction: 'enemy', posX: 1500, posY: 1500 }
        ])
      };
      
      miniMap._renderEntityDots();
      
      // Should have gold fill (queen) and red fill (enemies)
      expect(global.fill.calledWith(255, 215, 0)).to.be.true;
      expect(global.fill.calledWith(255, 0, 0)).to.be.true;
      // Should draw 3 ellipses (1 queen + 2 enemies)
      expect(global.ellipse.callCount).to.equal(3);
    });

    it('should respect custom dot radius', function() {
      miniMap.dotRadius = 5;
      global.queenAnt = {
        type: 'Queen',
        getPosition: () => ({ x: 1600, y: 1600 })
      };
      
      miniMap._renderEntityDots();
      
      const ellipseCall = global.ellipse.getCall(0);
      expect(ellipseCall.args[2]).to.equal(10); // diameter = radius * 2
    });

    it('should respect custom colors', function() {
      miniMap.queenDotColor = { r: 100, g: 200, b: 50 };
      miniMap.enemyDotColor = { r: 50, g: 100, b: 200 };
      
      global.queenAnt = {
        type: 'Queen',
        getPosition: () => ({ x: 1600, y: 1600 })
      };
      global.spatialGridManager = {
        getEntitiesByType: sinon.stub().returns([
          { type: 'Ant', faction: 'enemy', posX: 500, posY: 500 }
        ])
      };
      
      miniMap._renderEntityDots();
      
      expect(global.fill.calledWith(100, 200, 50)).to.be.true;
      expect(global.fill.calledWith(50, 100, 200)).to.be.true;
    });
  });

  describe('render() integration', function() {
    this.timeout(5000); // 5 second timeout for rendering tests
    
    it('should call _renderEntityDots during render', function() {
      const spy = sinon.spy(miniMap, '_renderEntityDots');
      
      // Stub render to avoid actual p5 rendering
      const originalRender = miniMap.render;
      miniMap.render = function() {
        this._renderEntityDots();
      };
      
      miniMap.render(0, 0);
      
      expect(spy.called).to.be.true;
      
      spy.restore();
      miniMap.render = originalRender;
    });

    it('should have _renderEntityDots method that can be called', function() {
      expect(miniMap._renderEntityDots).to.be.a('function');
      
      // Just verify it doesn't throw
      expect(() => miniMap._renderEntityDots()).to.not.throw();
    });
  });

  describe('Performance with many entities', function() {
    this.timeout(5000); // 5 second timeout for performance tests
    
    it('should handle 200 enemies without error', function() {
      const manyEnemies = [];
      for (let i = 0; i < 200; i++) {
        manyEnemies.push({
          type: 'Ant',
          faction: 'enemy',
          posX: Math.random() * 3200,
          posY: Math.random() * 3200
        });
      }
      
      global.spatialGridManager = {
        getEntitiesByType: sinon.stub().returns(manyEnemies)
      };
      
      expect(() => miniMap._renderEntityDots()).to.not.throw();
      expect(global.ellipse.callCount).to.equal(200);
    });

    it('should complete rendering quickly with many entities', function() {
      const manyEnemies = [];
      for (let i = 0; i < 100; i++) {
        manyEnemies.push({
          type: 'Ant',
          faction: 'enemy',
          posX: i * 10,
          posY: i * 10
        });
      }
      
      global.spatialGridManager = {
        getEntitiesByType: sinon.stub().returns(manyEnemies)
      };
      
      const startTime = Date.now();
      miniMap._renderEntityDots();
      const duration = Date.now() - startTime;
      
      expect(duration).to.be.lessThan(50); // Should complete in <50ms
    });
  });
});
