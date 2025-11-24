/**
 * Integration Tests for MiniMap Entity Tracking
 * Phase 6: Integration testing with real-world scenarios
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('MiniMap Entity Integration', function() {
  let MiniMap;
  let miniMap;
  let mockTerrain;
  let mockQueen;
  let mockSpatialGrid;

  beforeEach(function() {
    // Mock p5.js globals
    global.window = global.window || {};
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.fill = sinon.stub();
    global.noStroke = sinon.stub();
    global.ellipse = sinon.stub();
    global.rect = sinon.stub();
    global.noFill = sinon.stub();
    global.stroke = sinon.stub();
    global.strokeWeight = sinon.stub();
    global.image = sinon.stub();
    global.imageMode = sinon.stub();
    global.translate = sinon.stub();
    global.text = sinon.stub();
    global.textAlign = sinon.stub();
    global.textSize = sinon.stub();
    global.CORNER = 'corner';
    global.CENTER = 'center';
    global.TOP = 'top';

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

    // Load MiniMap
    MiniMap = require('../../../Classes/ui/MiniMap.js');
    miniMap = new MiniMap(mockTerrain, 200, 200);
  });

  afterEach(function() {
    sinon.restore();
    delete global.queenAnt;
    delete global.spatialGridManager;
    delete global.push;
    delete global.pop;
    delete global.fill;
    delete global.noStroke;
    delete global.ellipse;
    delete global.rect;
    delete global.noFill;
    delete global.stroke;
    delete global.strokeWeight;
    delete global.image;
    delete global.imageMode;
    delete global.translate;
    delete global.text;
    delete global.textAlign;
    delete global.textSize;
    delete global.CORNER;
    delete global.CENTER;
    delete global.TOP;
    delete global.logNormal;
    delete global.CacheManager;
    delete global.UICoordinateConverter;
  });

  describe('Phase 4: Performance Optimization', function() {
    it('should cache enemy positions', function() {
      const enemies = [
        { type: 'Ant', faction: 'enemy', posX: 100, posY: 100 },
        { type: 'Ant', faction: 'enemy', posX: 200, posY: 200 }
      ];
      
      global.spatialGridManager = {
        getEntitiesByType: sinon.stub().returns(enemies)
      };

      miniMap._updateCachedEnemyPositions();
      
      expect(miniMap._cachedEnemyPositions).to.have.lengthOf(2);
    });

    it('should use cached positions to reduce queries', function() {
      const enemies = [
        { type: 'Ant', faction: 'enemy', posX: 100, posY: 100 }
      ];
      
      const spy = sinon.stub().returns(enemies);
      global.spatialGridManager = {
        getEntitiesByType: spy
      };

      miniMap._updateCachedEnemyPositions();
      miniMap._renderEntityDots(); // Should use cache
      miniMap._renderEntityDots(); // Should use cache again
      
      expect(spy.callCount).to.equal(1); // Only called once
    });

    it('should update cache after throttle expires', function(done) {
      const enemies = [
        { type: 'Ant', faction: 'enemy', posX: 100, posY: 100 }
      ];
      
      global.spatialGridManager = {
        getEntitiesByType: sinon.stub().returns(enemies)
      };

      miniMap.setDotUpdateInterval(50); // 50ms throttle
      miniMap._updateCachedEnemyPositions();
      
      setTimeout(() => {
        miniMap._updateCachedEnemyPositions();
        expect(miniMap._cachedEnemyPositions).to.have.lengthOf(1);
        done();
      }, 100);
    });
  });

  describe('Phase 5: Configuration API', function() {
    it('should toggle queen dot visibility', function() {
      miniMap.setShowQueenDot(false);
      expect(miniMap.getShowQueenDot()).to.be.false;
      
      miniMap.setShowQueenDot(true);
      expect(miniMap.getShowQueenDot()).to.be.true;
    });

    it('should toggle enemy dots visibility', function() {
      miniMap.setShowEnemyDots(false);
      expect(miniMap.getShowEnemyDots()).to.be.false;
      
      miniMap.setShowEnemyDots(true);
      expect(miniMap.getShowEnemyDots()).to.be.true;
    });

    it('should change queen dot color', function() {
      miniMap.setQueenDotColor(100, 200, 50);
      expect(miniMap.queenDotColor).to.deep.equal({ r: 100, g: 200, b: 50 });
    });

    it('should change enemy dot color', function() {
      miniMap.setEnemyDotColor(50, 100, 200);
      expect(miniMap.enemyDotColor).to.deep.equal({ r: 50, g: 100, b: 200 });
    });

    it('should change dot radius', function() {
      miniMap.setDotRadius(5);
      expect(miniMap.dotRadius).to.equal(5);
    });

    it('should change dot update interval', function() {
      miniMap.setDotUpdateInterval(500);
      expect(miniMap.dotUpdateInterval).to.equal(500);
    });
  });

  describe('Phase 6: Full Integration', function() {
    it('should render queen and enemies together with caching', function() {
      global.queenAnt = {
        type: 'Queen',
        getPosition: () => ({ x: 1600, y: 1600 })
      };
      
      const enemies = [
        { type: 'Ant', faction: 'enemy', posX: 500, posY: 500 },
        { type: 'Ant', faction: 'enemy', posX: 2500, posY: 2500 }
      ];
      
      global.spatialGridManager = {
        getEntitiesByType: sinon.stub().returns(enemies)
      };

      // Update cache
      miniMap._updateCachedEnemyPositions();
      
      // Render
      miniMap._renderEntityDots();
      
      // Should have rendered 3 dots (1 queen + 2 enemies)
      expect(global.ellipse.callCount).to.equal(3);
    });

    it('should respect visibility settings during render', function() {
      global.queenAnt = {
        type: 'Queen',
        getPosition: () => ({ x: 1600, y: 1600 })
      };
      
      global.spatialGridManager = {
        getEntitiesByType: sinon.stub().returns([
          { type: 'Ant', faction: 'enemy', posX: 500, posY: 500 }
        ])
      };

      miniMap.setShowQueenDot(false);
      miniMap._renderEntityDots();
      
      // Should only render 1 dot (enemy only)
      expect(global.ellipse.callCount).to.equal(1);
    });

    it('should update on each frame call', function() {
      const enemies = [
        { type: 'Ant', faction: 'enemy', posX: 100, posY: 100 }
      ];
      
      global.spatialGridManager = {
        getEntitiesByType: sinon.stub().returns(enemies)
      };

      miniMap.update();
      
      // Cache should be populated
      expect(miniMap._cachedEnemyPositions).to.not.be.empty;
    });

    it('should handle no entities gracefully', function() {
      global.queenAnt = null;
      global.spatialGridManager = {
        getEntitiesByType: sinon.stub().returns([])
      };

      expect(() => {
        miniMap.update();
        miniMap._renderEntityDots();
      }).to.not.throw();
      
      expect(global.ellipse.called).to.be.false;
    });
  });
});
