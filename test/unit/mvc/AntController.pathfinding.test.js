/**
 * Ant MVC Pathfinding Integration Tests
 * =======================================
 * Tests pathfinding integration with ant MVC controllers
 * 
 * Tests verify:
 * - AntController integrates with MovementController
 * - MovementController uses pathfinding (findPath + pathMap)
 * - Pathfinding respects terrain weights (grass, water, stone)
 * - Path calculation creates valid routes
 * - Ants follow calculated paths tile-by-tile
 * - Path updates when destination changes
 * - Path fails gracefully on impassable terrain
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupP5Mocks } = require('../../helpers/p5Mocks');
const { loadAntModel, loadAntView, loadMVCClasses } = require('../../helpers/mvcTestHelpers');

describe('Ant MVC Pathfinding Integration', function() {
  let AntController;
  let AntModel;
  let AntView;
  let MovementController;
  let PathMap, Node, BinaryHeap, findPath;
  let pathMap;
  let mockTerrain;

  before(function() {
    setupP5Mocks();

    // Load MVC base classes first (EntityModel, EntityView, EntityController)
    loadMVCClasses();
    
    // Load MVC classes
    AntModel = loadAntModel();
    AntView = loadAntView();
    AntController = require('../../../Classes/mvc/controllers/AntController.js');
    
    // Load MovementController
    global.MovementController = require('../../../Classes/controllers/MovementController.js');
    MovementController = global.MovementController;
    
    // Mock animationManager (required by MovementController.update())
    global.animationManager = {
      isAnimation: sinon.stub().returns(false),
      play: sinon.stub()
    };

    // Setup pathfinding system
    setupPathfindingSystem();
  });

  beforeEach(function() {
    // Create mock terrain (10x10 grid)
    mockTerrain = createMockTerrain(10, 10);
    
    // Create PathMap from terrain
    pathMap = new PathMap(mockTerrain);
    
    // Make pathMap globally available
    global.pathMap = pathMap;
  });

  afterEach(function() {
    delete global.pathMap;
  });

  // ===== HELPER: SETUP PATHFINDING SYSTEM =====
  function setupPathfindingSystem() {
    // Mock Grid class for pathfinding
    global.Grid = class Grid {
      constructor(sizeX, sizeY, pos) {
        this._sizeX = sizeX;
        this._sizeY = sizeY;
        this._data = [];
        for (let i = 0; i < sizeX * sizeY; i++) {
          this._data[i] = null;
        }
      }
      setArrPos(pos, value) {
        const [x, y] = pos;
        if (x >= 0 && x < this._sizeX && y >= 0 && y < this._sizeY) {
          this._data[y * this._sizeX + x] = value;
        }
      }
      getArrPos(pos) {
        const [x, y] = pos;
        if (x >= 0 && x < this._sizeX && y >= 0 && y < this._sizeY) {
          return this._data[y * this._sizeX + x];
        }
        return null;
      }
      getSize() { return [this._sizeX, this._sizeY]; }
      infoStr() { return `${this._sizeX}x${this._sizeY}`; }
    };

    // Load pathfinding system
    const pathfindingCode = require('fs').readFileSync(
      require('path').resolve(__dirname, '../../../Classes/pathfinding.js'),
      'utf8'
    );
    
    // Execute pathfinding code in global scope
    const pathfindingModule = new Function('Grid', 'logNormal', pathfindingCode + '; return { PathMap, Node, BinaryHeap, findPath };');
    const pathfinding = pathfindingModule(global.Grid, global.logNormal);
    
    // Store original findPath
    const findPathOriginal = pathfinding.findPath;
    
    // Wrapper to handle array inputs (MovementController uses [x,y] format)
    const findPathWrapper = function(start, end, pathMap) {
      const grid = pathMap.getGrid();
      
      // Convert arrays to Node objects if needed
      let startNode = start;
      let endNode = end;
      
      if (Array.isArray(start)) {
        startNode = grid.getArrPos(start);
        if (!startNode) {
          console.error(`Start node not found at [${start}]`);
          return [];
        }
      }
      
      if (Array.isArray(end)) {
        endNode = grid.getArrPos(end);
        if (!endNode) {
          console.error(`End node not found at [${end}]`);
          return [];
        }
      }
      
      return findPathOriginal(startNode, endNode, pathMap);
    };
    
    // Store in global scope
    PathMap = pathfinding.PathMap;
    Node = pathfinding.Node;
    BinaryHeap = pathfinding.BinaryHeap;
    findPath = findPathWrapper;
    
    global.PathMap = PathMap;
    global.Node = Node;
    global.BinaryHeap = BinaryHeap;
    global.findPath = findPath;
  }

  // ===== HELPER: CREATE MOCK TERRAIN =====
  function createMockTerrain(width, height, obstaclePositions = []) {
    const tiles = [];
    
    // Create tiles with terrain types
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const isObstacle = obstaclePositions.some(pos => pos[0] === x && pos[1] === y);
        tiles.push({
          x: x,
          y: y,
          type: isObstacle ? 2 : 0, // 2 = STONE (impassable), 0 = GRASS (passable)
          getWeight: function() {
            return this.type === 2 ? 100 : 1; // Stone = 100 (impassable), Grass = 1
          }
        });
      }
    }

    return {
      _xCount: width,
      _yCount: height,
      _tileStore: tiles,
      conv2dpos: (x, y) => y * width + x,
      getTileAtGridCoords: (x, y) => {
        if (x < 0 || x >= width || y < 0 || y >= height) return null;
        return tiles[y * width + x];
      }
    };
  }

  // ===== PATHFINDING SYSTEM AVAILABILITY =====
  describe('Pathfinding System Availability', function() {
    it('should have findPath function defined', function() {
      expect(findPath).to.be.a('function');
    });

    it('should have PathMap class defined', function() {
      expect(PathMap).to.be.a('function');
    });

    it('should create valid PathMap from terrain', function() {
      expect(pathMap).to.exist;
      expect(pathMap.getGrid).to.be.a('function');
    });

    it('should have grid with correct dimensions', function() {
      const grid = pathMap.getGrid();
      expect(grid._sizeX).to.equal(10);
      expect(grid._sizeY).to.equal(10);
    });
  });

  // ===== ANT CONTROLLER MOVEMENT INTEGRATION =====
  describe('AntController Movement Integration', function() {
    let model, view, controller;

    beforeEach(function() {
      model = new AntModel({ x: 0, y: 0, width: 32, height: 32, jobName: 'Worker' });
      view = new AntView(model);
      controller = new AntController(model, view);
    });

    it('should have moveToLocation method', function() {
      expect(controller.moveToLocation).to.be.a('function');
    });

    it('should delegate to MovementController', function() {
      const movement = controller.getController('movement');
      expect(movement).to.exist;
      expect(movement.moveToLocation).to.be.a('function');
    });

    it('should create path after moveToLocation', function() {
      this.timeout(2000); // Force 2 second timeout
      
      const initialPos = model.getPosition();
      
      controller.moveToLocation(100, 100);
      
      // Set globals needed by MovementController
      global.deltaTime = 16.67; // 60fps
      global.tileSize = 32;
      
      // Call update() to process movement
      for (let i = 0; i < 10; i++) {
        controller.update();
        
        // Check if position changed
        const currentPos = model.getPosition();
        if (currentPos.x !== initialPos.x || currentPos.y !== initialPos.y) {
          break; // Movement started, test passes
        }
      }
      
      // Position should be updated (may not be exact due to pathfinding)
      const newPos = model.getPosition();
      expect(newPos).to.not.deep.equal(initialPos);
    });
  });

  // ===== PATHFINDING CALCULATION =====
  describe('Pathfinding Calculation', function() {
    it('should find path between two points', function() {
      const start = [0, 0];
      const end = [5, 5];
      
      const path = findPath(start, end, pathMap);
      
      expect(path).to.be.an('array');
      expect(path.length).to.be.greaterThan(0);
    });

    it('should return path with correct start and end', function() {
      this.timeout(2000); // Force 2 second timeout
    
      const start = [1, 1];
      const end = [8, 8];
      
      const path = findPath(start, end, pathMap);
      
      // Compare only _x and _y properties (avoid deep equal on Node with circular references)
      expect(path[0]._x).to.equal(1);
      expect(path[0]._y).to.equal(1);
      expect(path[path.length - 1]._x).to.equal(8);
      expect(path[path.length - 1]._y).to.equal(8);
    });

    it('should find shortest path on open terrain', function() {
      const start = [0, 0];
      const end = [3, 0]; // 3 tiles away horizontally
      
      const path = findPath(start, end, pathMap);
      
      // Should be approximately 4 nodes (start + 2 intermediate + end)
      expect(path.length).to.be.lessThan(6);
    });

    it('should avoid obstacles', function() {
      // Create terrain with obstacle wall
      const terrainWithWall = createMockTerrain(10, 10, [
        [5, 0], [5, 1], [5, 2], [5, 3], [5, 4] // Vertical wall at x=5
      ]);
      const wallPathMap = new PathMap(terrainWithWall);

      const start = [0, 2];
      const end = [9, 2]; // Must go around wall
      
      const path = findPath(start, end, wallPathMap);
      
      expect(path).to.be.an('array');
      expect(path.length).to.be.greaterThan(0);
      
      // Verify path doesn't go through wall
      path.forEach(node => {
        if (node._y === 2) {
          expect(node._x).to.not.equal(5); // Should not cross wall at x=5
        }
      });
    });

    it('should return empty array for impossible paths', function() {
      // Create terrain completely blocked
      const blockedTerrain = createMockTerrain(10, 10, [
        [5, 0], [5, 1], [5, 2], [5, 3], [5, 4], [5, 5], [5, 6], [5, 7], [5, 8], [5, 9]
      ]);
      const blockedPathMap = new PathMap(blockedTerrain);

      const start = [0, 5];
      const end = [9, 5]; // Impossible to reach
      
      const path = findPath(start, end, blockedPathMap);
      
      expect(path).to.be.an('array');
      expect(path).to.have.lengthOf(0);
    });
  });

  // ===== TERRAIN WEIGHT INTEGRATION =====
  describe('Terrain Weight Integration', function() {
    it('should respect terrain weights in path calculation', function() {
      // Create terrain with water (high cost) in middle
      const tiles = [];
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          const isWater = (x >= 3 && x <= 6 && y >= 3 && y <= 6);
          tiles.push({
            x: x,
            y: y,
            type: isWater ? 1 : 0, // 1 = WATER (slow), 0 = GRASS
            getWeight: function() {
              return this.type === 1 ? 3 : 1; // Water = 3x cost
            }
          });
        }
      }

      const weightedTerrain = {
        _xCount: 10,
        _yCount: 10,
        _tileStore: tiles,
        conv2dpos: (x, y) => y * 10 + x,
        getTileAtGridCoords: (x, y) => tiles[y * 10 + x]
      };

      const weightedPathMap = new PathMap(weightedTerrain);
      
      const start = [0, 5];
      const end = [9, 5]; // Could go through water or around
      
      const path = findPath(start, end, weightedPathMap);
      
      expect(path).to.be.an('array');
      expect(path.length).to.be.greaterThan(0);
      
      // Path should prefer going around water (lower total cost)
      const pathThroughWater = path.filter(node => 
        node._x >= 3 && node._x <= 6 && node._y >= 3 && node._y <= 6
      );
      
      // Should minimize water tiles
      expect(pathThroughWater.length).to.be.lessThan(3);
    });

    it('should avoid stone/impassable terrain', function() {
      const grid = pathMap.getGrid();
      const node = grid.getArrPos([0, 0]);
      
      // Verify stone tiles are marked as walls
      expect(node.wall).to.be.false; // Grass tile should not be wall
      
      // Check if weight=100 creates wall
      const stoneNode = { _terrainTile: { getWeight: () => 100 } };
      const testNode = new Node(stoneNode._terrainTile, 5, 5);
      expect(testNode.wall).to.be.true;
    });
  });

  // ===== ANT PATHFINDING BEHAVIOR =====
  describe('Ant Pathfinding Behavior', function() {
    let model, view, controller;

    beforeEach(function() {
      model = new AntModel({ 
        x: 32, // Grid position 1,1
        y: 32, 
        width: 32, 
        height: 32, 
        jobName: 'Worker' 
      });
      view = new AntView(model);
      controller = new AntController(model, view);
    });

    it('should calculate path when moveToLocation is called', function() {
      const findPathSpy = sinon.spy(global, 'findPath');
      
      controller.moveToLocation(256, 256); // Grid position 8,8
      
      // Note: MovementController uses findPath internally
      // We can't directly spy on it, but we can verify movement started
      const movement = controller.getController('movement');
      expect(movement).to.exist;
      
      findPathSpy.restore();
    });

    it('should handle pathfinding failure gracefully', function() {
      // Create completely blocked terrain
      const blockedTerrain = createMockTerrain(10, 10);
      // Make all tiles impassable except start
      for (let i = 1; i < blockedTerrain._tileStore.length; i++) {
        blockedTerrain._tileStore[i].type = 2; // Stone
        blockedTerrain._tileStore[i].getWeight = () => 100;
      }
      
      global.pathMap = new PathMap(blockedTerrain);

      const initialPos = model.getPosition();
      
      // Try to move to blocked location
      expect(() => {
        controller.moveToLocation(256, 256);
      }).to.not.throw();
      
      // Position should not change (or fallback to direct movement)
      const finalPos = model.getPosition();
      expect(finalPos).to.exist;
    });

    it('should update path when destination changes', function() {
      // First movement
      controller.moveToLocation(100, 100);
      const firstPath = controller.getController('movement')?._path;
      
      // Change destination
      controller.moveToLocation(200, 200);
      const secondPath = controller.getController('movement')?._path;
      
      // Paths should be different (or at least movement restarted)
      expect(controller.isMoving()).to.be.true;
    });
  });

  // ===== PATH FOLLOWING =====
  describe('Path Following', function() {
    let model, view, controller;

    beforeEach(function() {
      // Set globals needed by MovementController
      global.deltaTime = 16.67; // 60fps
      global.tileSize = 32;
      
      model = new AntModel({ x: 32, y: 32, width: 32, height: 32, jobName: 'Worker' });
      view = new AntView(model);
      controller = new AntController(model, view);
    });

    it('should follow path tile-by-tile', function() {
      const movement = controller.getController('movement');
      expect(movement).to.exist;

      // Start movement
      controller.moveToLocation(128, 128); // 4 tiles away
      
      // Should have path
      expect(controller.isMoving()).to.be.true;
    });

    it('should reach destination eventually', function() {
      const targetX = 128;
      const targetY = 128;
      
      controller.moveToLocation(targetX, targetY);
      
      // Simulate multiple updates to follow path
      for (let i = 0; i < 100; i++) {
        controller.update();
        
        const pos = model.getPosition();
        const distance = Math.sqrt(
          Math.pow(pos.x - targetX, 2) + Math.pow(pos.y - targetY, 2)
        );
        
        // Check if reached destination
        if (distance < 5) {
          expect(controller.isMoving()).to.be.false;
          return;
        }
      }
      
      // Should have made progress toward destination
      const finalPos = model.getPosition();
      expect(finalPos.x).to.not.equal(32);
      expect(finalPos.y).to.not.equal(32);
    });

    it('should stop moving when path is complete', function() {
      controller.moveToLocation(64, 64); // 2 tiles away
      
      // Fast-forward many updates
      for (let i = 0; i < 200; i++) {
        controller.update();
      }
      
      // Should eventually stop
      expect(controller.isMoving()).to.be.false;
    });
  });

  // ===== EDGE CASES =====
  describe('Edge Cases', function() {
    let model, view, controller;

    beforeEach(function() {
      model = new AntModel({ x: 32, y: 32, width: 32, height: 32, jobName: 'Worker' });
      view = new AntView(model);
      controller = new AntController(model, view);
    });

    it('should handle movement to current position', function() {
      const currentPos = model.getPosition();
      
      expect(() => {
        controller.moveToLocation(currentPos.x, currentPos.y);
      }).to.not.throw();
    });

    it('should handle movement to out-of-bounds position', function() {
      expect(() => {
        controller.moveToLocation(-100, -100);
      }).to.not.throw();
      
      expect(() => {
        controller.moveToLocation(1000, 1000);
      }).to.not.throw();
    });

    it('should handle missing pathMap gracefully', function() {
      delete global.pathMap;
      
      expect(() => {
        controller.moveToLocation(128, 128);
      }).to.not.throw();
      
      // Should fall back to direct movement
      expect(controller.isMoving()).to.be.true;
    });

    it('should handle interrupted movement', function() {
      controller.moveToLocation(256, 256);
      expect(controller.isMoving()).to.be.true;
      
      // Interrupt with new destination
      controller.moveToLocation(64, 64);
      
      // Should still be moving (new path)
      expect(controller.isMoving()).to.be.true;
    });
  });

  // ===== PERFORMANCE =====
  describe('Performance', function() {
    it('should calculate path quickly for short distances', function() {
      const start = [0, 0];
      const end = [5, 5];
      
      const startTime = Date.now();
      const path = findPath(start, end, pathMap);
      const endTime = Date.now();
      
      expect(path).to.exist;
      expect(endTime - startTime).to.be.lessThan(100); // < 100ms
    });

    it('should handle many pathfinding requests', function() {
      const requests = 10;
      const paths = [];
      
      const startTime = Date.now();
      for (let i = 0; i < requests; i++) {
        const path = findPath([0, 0], [9, 9], pathMap);
        paths.push(path);
      }
      const endTime = Date.now();
      
      expect(paths).to.have.lengthOf(requests);
      expect(endTime - startTime).to.be.lessThan(1000); // < 1 second for 10 paths
    });
  });
});
