/**
 * Unit Tests for MiniMap Entity Tracking (Queen & Enemies)
 * Phase 2: Model Layer - Data access methods
 * 
 * TDD: Write tests FIRST, then implement
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('MiniMap Entity Tracking', function() {
  let MiniMap;
  let miniMap;
  let mockTerrain;
  let mockQueen;
  let mockEnemies;
  let mockSpatialGrid;

  beforeEach(function() {
    // Setup global mocks
    global.window = global.window || {};
    global.queenAnt = null;
    global.spatialGridManager = null;
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
        return { x: 400, y: 400 }; // Mock screen position
      }
    };

    // Mock terrain
    mockTerrain = {
      width: 100,
      height: 100,
      tileSize: 32,
      getArrPos: sinon.stub().returns({ getMaterial: () => 'grass' })
    };

    // Mock queen
    mockQueen = {
      type: 'Queen',
      _type: 'Queen',
      faction: 'player',
      getPosition: sinon.stub().returns({ x: 500, y: 500 }),
      posX: 500,
      posY: 500
    };

    // Mock enemies
    mockEnemies = [
      {
        type: 'Ant',
        _type: 'Ant',
        faction: 'enemy',
        getPosition: sinon.stub().returns({ x: 200, y: 300 }),
        posX: 200,
        posY: 300
      },
      {
        type: 'Ant',
        _type: 'Ant',
        faction: 'enemy',
        getPosition: sinon.stub().returns({ x: 800, y: 600 }),
        posX: 800,
        posY: 600
      },
      {
        type: 'Ant',
        _type: 'Ant',
        faction: 'enemy',
        getPosition: sinon.stub().returns({ x: 1000, y: 1200 }),
        posX: 1000,
        posY: 1200
      }
    ];

    // Mock spatialGridManager
    mockSpatialGrid = {
      getEntitiesByType: sinon.stub().returns([])
    };

    // Load MiniMap class
    MiniMap = require('../../../Classes/ui/MiniMap.js');
    miniMap = new MiniMap(mockTerrain, 200, 200);
  });

  afterEach(function() {
    sinon.restore();
    delete global.queenAnt;
    delete global.spatialGridManager;
    delete global.logNormal;
    delete global.CacheManager;
    delete global.UICoordinateConverter;
  });

  describe('Phase 2: Model Layer - Constructor Extensions', function() {
    it('should initialize with entity tracking disabled by default', function() {
      expect(miniMap.showQueenDot).to.equal(true);
      expect(miniMap.showEnemyDots).to.equal(true);
    });

    it('should initialize with correct queen dot color (gold)', function() {
      expect(miniMap.queenDotColor).to.deep.equal({ r: 255, g: 215, b: 0 });
    });

    it('should initialize with correct enemy dot color (red)', function() {
      expect(miniMap.enemyDotColor).to.deep.equal({ r: 255, g: 0, b: 0 });
    });

    it('should initialize with default dot radius', function() {
      expect(miniMap.dotRadius).to.equal(3);
    });

    it('should initialize with entity position cache', function() {
      expect(miniMap._cachedEnemyPositions).to.be.an('array').that.is.empty;
    });

    it('should initialize with dot update interval', function() {
      expect(miniMap.dotUpdateInterval).to.equal(200);
      expect(miniMap.lastDotUpdate).to.equal(0);
    });
  });

  describe('getQueenPosition()', function() {
    it('should return null when no queen exists', function() {
      global.queenAnt = null;
      const pos = miniMap.getQueenPosition();
      expect(pos).to.be.null;
    });

    it('should return queen position when queen exists (global queenAnt)', function() {
      global.queenAnt = mockQueen;
      const pos = miniMap.getQueenPosition();
      expect(pos).to.deep.equal({ x: 500, y: 500 });
    });

    it('should use getPosition() method if available', function() {
      global.queenAnt = mockQueen;
      miniMap.getQueenPosition();
      expect(mockQueen.getPosition.calledOnce).to.be.true;
    });

    it('should fallback to posX/posY properties', function() {
      const queenNoPosMethod = {
        type: 'Queen',
        posX: 300,
        posY: 400
      };
      global.queenAnt = queenNoPosMethod;
      const pos = miniMap.getQueenPosition();
      expect(pos).to.deep.equal({ x: 300, y: 400 });
    });

    it('should return null if queen has no position data', function() {
      global.queenAnt = { type: 'Queen' };
      const pos = miniMap.getQueenPosition();
      expect(pos).to.be.null;
    });

    it('should check window.queenAnt if global not available', function() {
      global.window = { queenAnt: mockQueen };
      global.queenAnt = null;
      const pos = miniMap.getQueenPosition();
      expect(pos).to.deep.equal({ x: 500, y: 500 });
      delete global.window;
    });
  });

  describe('getEnemyPositions()', function() {
    beforeEach(function() {
      global.spatialGridManager = mockSpatialGrid;
    });

    it('should return empty array when no spatial grid manager', function() {
      global.spatialGridManager = null;
      const positions = miniMap.getEnemyPositions();
      expect(positions).to.be.an('array').that.is.empty;
    });

    it('should return empty array when no ants exist', function() {
      mockSpatialGrid.getEntitiesByType.returns([]);
      const positions = miniMap.getEnemyPositions();
      expect(positions).to.be.an('array').that.is.empty;
    });

    it('should filter ants by enemy faction', function() {
      const allAnts = [
        ...mockEnemies,
        { type: 'Ant', faction: 'player', getPosition: () => ({ x: 100, y: 100 }) },
        { type: 'Ant', faction: 'neutral', getPosition: () => ({ x: 200, y: 200 }) }
      ];
      mockSpatialGrid.getEntitiesByType.returns(allAnts);
      
      const positions = miniMap.getEnemyPositions();
      expect(positions).to.have.lengthOf(3);
    });

    it('should return correct enemy positions', function() {
      mockSpatialGrid.getEntitiesByType.returns(mockEnemies);
      const positions = miniMap.getEnemyPositions();
      
      expect(positions).to.deep.equal([
        { x: 200, y: 300 },
        { x: 800, y: 600 },
        { x: 1000, y: 1200 }
      ]);
    });

    it('should use getPosition() method if available', function() {
      mockSpatialGrid.getEntitiesByType.returns(mockEnemies);
      miniMap.getEnemyPositions();
      
      mockEnemies.forEach(enemy => {
        expect(enemy.getPosition.calledOnce).to.be.true;
      });
    });

    it('should fallback to posX/posY properties', function() {
      const enemyNoPosMethod = [
        { type: 'Ant', faction: 'enemy', posX: 100, posY: 200 },
        { type: 'Ant', faction: 'enemy', posX: 300, posY: 400 }
      ];
      mockSpatialGrid.getEntitiesByType.returns(enemyNoPosMethod);
      
      const positions = miniMap.getEnemyPositions();
      expect(positions).to.deep.equal([
        { x: 100, y: 200 },
        { x: 300, y: 400 }
      ]);
    });

    it('should skip enemies without position data', function() {
      const ants = [
        mockEnemies[0],
        { type: 'Ant', faction: 'enemy' }, // No position
        mockEnemies[1]
      ];
      mockSpatialGrid.getEntitiesByType.returns(ants);
      
      const positions = miniMap.getEnemyPositions();
      expect(positions).to.have.lengthOf(2);
    });

    it('should handle 100+ enemies efficiently', function() {
      const manyEnemies = [];
      for (let i = 0; i < 150; i++) {
        manyEnemies.push({
          type: 'Ant',
          faction: 'enemy',
          posX: i * 10,
          posY: i * 10
        });
      }
      mockSpatialGrid.getEntitiesByType.returns(manyEnemies);
      
      const positions = miniMap.getEnemyPositions();
      expect(positions).to.have.lengthOf(150);
    });

    it('should check both faction and _faction properties', function() {
      const mixedFactionProps = [
        { type: 'Ant', faction: 'enemy', posX: 100, posY: 100 },
        { type: 'Ant', _faction: 'enemy', posX: 200, posY: 200 },
        { type: 'Ant', faction: 'player', posX: 300, posY: 300 }
      ];
      mockSpatialGrid.getEntitiesByType.returns(mixedFactionProps);
      
      const positions = miniMap.getEnemyPositions();
      expect(positions).to.have.lengthOf(2);
    });
  });

  describe('shouldUpdateDots()', function() {
    it('should return true when throttle expires', function() {
      miniMap.lastDotUpdate = Date.now() - 300;
      expect(miniMap.shouldUpdateDots(Date.now())).to.be.true;
    });

    it('should return false when throttle not expired', function() {
      miniMap.lastDotUpdate = Date.now() - 50;
      expect(miniMap.shouldUpdateDots(Date.now())).to.be.false;
    });

    it('should return true on first update', function() {
      miniMap.lastDotUpdate = 0;
      expect(miniMap.shouldUpdateDots(Date.now())).to.be.true;
    });

    it('should respect custom update interval', function() {
      miniMap.dotUpdateInterval = 500;
      miniMap.lastDotUpdate = Date.now() - 400;
      expect(miniMap.shouldUpdateDots(Date.now())).to.be.false;
      
      miniMap.lastDotUpdate = Date.now() - 600;
      expect(miniMap.shouldUpdateDots(Date.now())).to.be.true;
    });
  });

  describe('Coordinate Conversion Accuracy', function() {
    it('should convert queen world position to minimap correctly', function() {
      // Terrain 3200x3200, minimap 200x200 -> scale = 200/3200 = 0.0625
      const largeTerrain = {
        width: 100,
        height: 100,
        tileSize: 32,
        getArrPos: sinon.stub()
      };
      miniMap = new MiniMap(largeTerrain, 200, 200);
      
      const worldPos = { x: 1600, y: 1600 }; // Center of map
      const miniPos = miniMap.worldToMiniMap(worldPos.x, worldPos.y);
      
      expect(miniPos.x).to.equal(100); // 1600 * 0.0625 = 100
      expect(miniPos.y).to.equal(100);
    });

    it('should convert enemy positions accurately', function() {
      const worldPos = { x: 3200, y: 3200 }; // Corner
      const miniPos = miniMap.worldToMiniMap(worldPos.x, worldPos.y);
      
      expect(miniPos.x).to.equal(200); // 3200 * 0.0625 = 200
      expect(miniPos.y).to.equal(200);
    });
  });
});
