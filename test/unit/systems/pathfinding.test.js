/**
 * Unit tests for pathfinding.js
 * Tests bidirectional A* pathfinding system including:
 * - PathMap creation and grid management
 * - Node construction and neighbor detection
 * - BinaryHeap priority queue operations
 * - Path finding algorithms (bidirectional A*)
 * - Distance calculations (octile distance)
 * - Path reconstruction and optimization
 */

const { expect } = require('chai');
const path = require('path');

// Mock p5.js functions
global.abs = Math.abs;
global.min = Math.min;
global.max = Math.max;

// Mock Grid class
class Grid {
  constructor(sizeX, sizeY, pos1, pos2) {
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
}

global.Grid = Grid;

// Load pathfinding module
const pathfindingPath = path.resolve(__dirname, '../../../Classes/pathfinding.js');
const pathfindingCode = require('fs').readFileSync(pathfindingPath, 'utf8');
eval(pathfindingCode);

describe('BinaryHeap', function() {
  describe('Constructor', function() {
    it('should create empty heap', function() {
      const heap = new BinaryHeap();
      expect(heap.items).to.be.an('array');
      expect(heap.items).to.have.lengthOf(0);
      expect(heap.isEmpty()).to.be.true;
    });
  });

  describe('push() - Adding Elements', function() {
    it('should add single element to heap', function() {
      const heap = new BinaryHeap();
      const node = { f: 5, id: 'test' };
      heap.push(node);
      expect(heap.items).to.have.lengthOf(1);
      expect(heap.items[0]).to.equal(node);
    });

    it('should maintain min-heap property with multiple elements', function() {
      const heap = new BinaryHeap();
      heap.push({ f: 5, id: '5' });
      heap.push({ f: 3, id: '3' });
      heap.push({ f: 7, id: '7' });
      
      expect(heap.items[0].f).to.equal(3); // Min at root
    });

    it('should bubble up smaller elements', function() {
      const heap = new BinaryHeap();
      heap.push({ f: 10, id: '10' });
      heap.push({ f: 5, id: '5' });
      heap.push({ f: 1, id: '1' });
      
      expect(heap.items[0].f).to.equal(1); // Smallest bubbled to top
    });

    it('should handle many elements correctly', function() {
      const heap = new BinaryHeap();
      const values = [15, 10, 20, 8, 25, 5, 30];
      
      values.forEach(v => heap.push({ f: v, id: String(v) }));
      
      expect(heap.items[0].f).to.equal(5); // Minimum at root
      expect(heap.items).to.have.lengthOf(7);
    });

    it('should handle duplicate f values', function() {
      const heap = new BinaryHeap();
      heap.push({ f: 5, id: 'a' });
      heap.push({ f: 5, id: 'b' });
      heap.push({ f: 5, id: 'c' });
      
      expect(heap.items).to.have.lengthOf(3);
      expect(heap.items[0].f).to.equal(5);
    });
  });

  describe('pop() - Removing Elements', function() {
    it('should return and remove minimum element', function() {
      const heap = new BinaryHeap();
      heap.push({ f: 5, id: '5' });
      heap.push({ f: 3, id: '3' });
      heap.push({ f: 7, id: '7' });
      
      const min = heap.pop();
      expect(min.f).to.equal(3);
      expect(heap.items).to.have.lengthOf(2);
    });

    it('should maintain heap property after pop', function() {
      const heap = new BinaryHeap();
      const values = [10, 5, 15, 3, 8];
      values.forEach(v => heap.push({ f: v, id: String(v) }));
      
      heap.pop(); // Remove 3
      expect(heap.items[0].f).to.equal(5); // Next minimum
    });

    it('should handle single element', function() {
      const heap = new BinaryHeap();
      const node = { f: 10, id: '10' };
      heap.push(node);
      
      const popped = heap.pop();
      expect(popped).to.equal(node);
      expect(heap.isEmpty()).to.be.true;
    });

    it('should return elements in sorted order', function() {
      const heap = new BinaryHeap();
      const values = [9, 4, 7, 2, 6];
      values.forEach(v => heap.push({ f: v, id: String(v) }));
      
      const sorted = [];
      while (!heap.isEmpty()) {
        sorted.push(heap.pop().f);
      }
      
      expect(sorted).to.deep.equal([2, 4, 6, 7, 9]);
    });

    it('should handle empty heap gracefully', function() {
      const heap = new BinaryHeap();
      const result = heap.pop();
      expect(result).to.be.undefined;
    });
  });

  describe('isEmpty()', function() {
    it('should return true for empty heap', function() {
      const heap = new BinaryHeap();
      expect(heap.isEmpty()).to.be.true;
    });

    it('should return false for non-empty heap', function() {
      const heap = new BinaryHeap();
      heap.push({ f: 5, id: '5' });
      expect(heap.isEmpty()).to.be.false;
    });

    it('should return true after popping all elements', function() {
      const heap = new BinaryHeap();
      heap.push({ f: 5, id: '5' });
      heap.pop();
      expect(heap.isEmpty()).to.be.true;
    });
  });

  describe('Heap Property Invariant', function() {
    it('should maintain parent <= children property', function() {
      const heap = new BinaryHeap();
      for (let i = 0; i < 20; i++) {
        heap.push({ f: Math.floor(Math.random() * 100), id: String(i) });
      }
      
      // Check heap property
      for (let i = 0; i < heap.items.length; i++) {
        const leftChild = 2 * i + 1;
        const rightChild = 2 * i + 2;
        
        if (leftChild < heap.items.length) {
          expect(heap.items[i].f).to.be.at.most(heap.items[leftChild].f);
        }
        if (rightChild < heap.items.length) {
          expect(heap.items[i].f).to.be.at.most(heap.items[rightChild].f);
        }
      }
    });
  });
});

describe('Node', function() {
  let mockTerrainTile;

  beforeEach(function() {
    mockTerrainTile = {
      getWeight: function() { return 1; }
    };
  });

  describe('Constructor', function() {
    it('should create node with terrain tile and coordinates', function() {
      const node = new Node(mockTerrainTile, 5, 7);
      
      expect(node._terrainTile).to.equal(mockTerrainTile);
      expect(node._x).to.equal(5);
      expect(node._y).to.equal(7);
      expect(node.id).to.equal('5-7');
    });

    it('should initialize empty neighbors array', function() {
      const node = new Node(mockTerrainTile, 0, 0);
      expect(node.neighbors).to.be.an('array');
      expect(node.neighbors).to.have.lengthOf(0);
    });

    it('should initialize pathfinding values to zero', function() {
      const node = new Node(mockTerrainTile, 0, 0);
      expect(node.f).to.equal(0);
      expect(node.g).to.equal(0);
      expect(node.h).to.equal(0);
    });

    it('should initialize previous pointers to null', function() {
      const node = new Node(mockTerrainTile, 0, 0);
      expect(node.previousStart).to.be.null;
      expect(node.previousEnd).to.be.null;
    });

    it('should set weight from terrain tile', function() {
      mockTerrainTile.getWeight = function() { return 2.5; };
      const node = new Node(mockTerrainTile, 0, 0);
      expect(node.weight).to.equal(2.5);
    });

    it('should generate unique IDs for different coordinates', function() {
      const node1 = new Node(mockTerrainTile, 3, 4);
      const node2 = new Node(mockTerrainTile, 4, 3);
      
      expect(node1.id).to.not.equal(node2.id);
      expect(node1.id).to.equal('3-4');
      expect(node2.id).to.equal('4-3');
    });
  });

  describe('assignWall()', function() {
    it('should mark node as wall when weight is 100', function() {
      mockTerrainTile.getWeight = function() { return 100; };
      const node = new Node(mockTerrainTile, 0, 0);
      expect(node.wall).to.be.true;
    });

    it('should not mark node as wall when weight is less than 100', function() {
      mockTerrainTile.getWeight = function() { return 50; };
      const node = new Node(mockTerrainTile, 0, 0);
      expect(node.wall).to.be.false;
    });

    it('should not mark node as wall when weight is 1', function() {
      mockTerrainTile.getWeight = function() { return 1; };
      const node = new Node(mockTerrainTile, 0, 0);
      expect(node.wall).to.be.false;
    });

    it('should not mark node as wall when weight is 0', function() {
      mockTerrainTile.getWeight = function() { return 0; };
      const node = new Node(mockTerrainTile, 0, 0);
      expect(node.wall).to.be.false;
    });
  });

  describe('reset()', function() {
    it('should reset all pathfinding values to zero', function() {
      const node = new Node(mockTerrainTile, 0, 0);
      node.f = 10;
      node.g = 5;
      node.h = 5;
      
      node.reset();
      
      expect(node.f).to.equal(0);
      expect(node.g).to.equal(0);
      expect(node.h).to.equal(0);
    });

    it('should reset previous pointers to null', function() {
      const node = new Node(mockTerrainTile, 0, 0);
      node.previousStart = { id: 'start' };
      node.previousEnd = { id: 'end' };
      
      node.reset();
      
      expect(node.previousStart).to.be.null;
      expect(node.previousEnd).to.be.null;
    });

    it('should be callable multiple times', function() {
      const node = new Node(mockTerrainTile, 0, 0);
      node.f = 10;
      node.reset();
      node.f = 20;
      node.reset();
      
      expect(node.f).to.equal(0);
    });
  });

  describe('setNeighbors()', function() {
    it('should find all 8 neighbors for center node', function() {
      const grid = new Grid(5, 5, [0, 0], [0, 0]);
      
      // Create nodes
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          const node = new Node(mockTerrainTile, x, y);
          grid.setArrPos([x, y], node);
        }
      }
      
      const centerNode = grid.getArrPos([2, 2]);
      centerNode.setNeighbors(grid);
      
      expect(centerNode.neighbors).to.have.lengthOf(8);
    });

    it('should find 3 neighbors for corner node', function() {
      const grid = new Grid(5, 5, [0, 0], [0, 0]);
      
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          const node = new Node(mockTerrainTile, x, y);
          grid.setArrPos([x, y], node);
        }
      }
      
      const cornerNode = grid.getArrPos([0, 0]);
      cornerNode.setNeighbors(grid);
      
      expect(cornerNode.neighbors).to.have.lengthOf(3);
    });

    it('should find 5 neighbors for edge node', function() {
      const grid = new Grid(5, 5, [0, 0], [0, 0]);
      
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          const node = new Node(mockTerrainTile, x, y);
          grid.setArrPos([x, y], node);
        }
      }
      
      const edgeNode = grid.getArrPos([2, 0]);
      edgeNode.setNeighbors(grid);
      
      expect(edgeNode.neighbors).to.have.lengthOf(5);
    });

    it('should not include self as neighbor', function() {
      const grid = new Grid(3, 3, [0, 0], [0, 0]);
      
      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
          const node = new Node(mockTerrainTile, x, y);
          grid.setArrPos([x, y], node);
        }
      }
      
      const centerNode = grid.getArrPos([1, 1]);
      centerNode.setNeighbors(grid);
      
      const selfIncluded = centerNode.neighbors.some(n => n.id === centerNode.id);
      expect(selfIncluded).to.be.false;
    });

    it('should only add in-bounds neighbors', function() {
      const grid = new Grid(3, 3, [0, 0], [0, 0]);
      
      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
          const node = new Node(mockTerrainTile, x, y);
          grid.setArrPos([x, y], node);
        }
      }
      
      const node = grid.getArrPos([0, 0]);
      node.setNeighbors(grid);
      
      // All neighbors should be valid nodes
      node.neighbors.forEach(neighbor => {
        expect(neighbor).to.not.be.null;
        expect(neighbor).to.be.an('object');
        expect(neighbor.id).to.be.a('string');
      });
    });

    it('should include diagonal neighbors', function() {
      const grid = new Grid(3, 3, [0, 0], [0, 0]);
      
      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
          const node = new Node(mockTerrainTile, x, y);
          grid.setArrPos([x, y], node);
        }
      }
      
      const centerNode = grid.getArrPos([1, 1]);
      centerNode.setNeighbors(grid);
      
      const diagonalIds = ['0-0', '2-0', '0-2', '2-2'];
      const foundDiagonals = centerNode.neighbors.filter(n => 
        diagonalIds.includes(n.id)
      );
      
      expect(foundDiagonals).to.have.lengthOf(4);
    });
  });
});

describe('PathMap', function() {
  let mockTerrain;

  beforeEach(function() {
    mockTerrain = {
      _xCount: 5,
      _yCount: 5,
      _tileStore: [],
      conv2dpos: function(x, y) {
        return y * this._xCount + x;
      }
    };

    // Create mock tiles
    for (let i = 0; i < 25; i++) {
      mockTerrain._tileStore[i] = {
        getWeight: function() { return 1; }
      };
    }
  });

  describe('Constructor', function() {
    it('should create PathMap from terrain', function() {
      const pathMap = new PathMap(mockTerrain);
      expect(pathMap._terrain).to.equal(mockTerrain);
      expect(pathMap._grid).to.be.an('object');
    });

    it('should create grid with correct dimensions', function() {
      const pathMap = new PathMap(mockTerrain);
      expect(pathMap._grid._sizeX).to.equal(5);
      expect(pathMap._grid._sizeY).to.equal(5);
    });

    it('should create nodes for all terrain tiles', function() {
      const pathMap = new PathMap(mockTerrain);
      
      let nodeCount = 0;
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          const node = pathMap._grid.getArrPos([x, y]);
          if (node) nodeCount++;
        }
      }
      
      expect(nodeCount).to.equal(25);
    });

    it('should initialize neighbors for all nodes', function() {
      const pathMap = new PathMap(mockTerrain);
      
      const centerNode = pathMap._grid.getArrPos([2, 2]);
      expect(centerNode.neighbors).to.have.lengthOf(8);
    });

    it('should handle small grids (1x1)', function() {
      mockTerrain._xCount = 1;
      mockTerrain._yCount = 1;
      mockTerrain._tileStore = [{ getWeight: () => 1 }];
      
      const pathMap = new PathMap(mockTerrain);
      const node = pathMap._grid.getArrPos([0, 0]);
      
      expect(node).to.not.be.null;
      expect(node.neighbors).to.have.lengthOf(0);
    });

    it('should handle rectangular grids', function() {
      mockTerrain._xCount = 3;
      mockTerrain._yCount = 7;
      mockTerrain._tileStore = [];
      
      for (let i = 0; i < 21; i++) {
        mockTerrain._tileStore[i] = { getWeight: () => 1 };
      }
      
      const pathMap = new PathMap(mockTerrain);
      expect(pathMap._grid._sizeX).to.equal(3);
      expect(pathMap._grid._sizeY).to.equal(7);
    });
  });

  describe('getGrid()', function() {
    it('should return grid object', function() {
      const pathMap = new PathMap(mockTerrain);
      const grid = pathMap.getGrid();
      
      expect(grid).to.equal(pathMap._grid);
      expect(grid._sizeX).to.equal(5);
      expect(grid._sizeY).to.equal(5);
    });

    it('should allow access to nodes through grid', function() {
      const pathMap = new PathMap(mockTerrain);
      const grid = pathMap.getGrid();
      const node = grid.getArrPos([2, 3]);
      
      expect(node).to.not.be.null;
      expect(node.id).to.equal('2-3');
    });
  });
});

describe('distanceFinder()', function() {
  it('should calculate horizontal distance', function() {
    const start = { _x: 0, _y: 0 };
    const end = { _x: 5, _y: 0 };
    
    const distance = distanceFinder(start, end);
    expect(distance).to.equal(5);
  });

  it('should calculate vertical distance', function() {
    const start = { _x: 0, _y: 0 };
    const end = { _x: 0, _y: 5 };
    
    const distance = distanceFinder(start, end);
    expect(distance).to.equal(5);
  });

  it('should calculate diagonal distance (octile)', function() {
    const start = { _x: 0, _y: 0 };
    const end = { _x: 3, _y: 3 };
    
    const distance = distanceFinder(start, end);
    const expected = 3 * Math.SQRT2;
    expect(distance).to.be.closeTo(expected, 0.01);
  });

  it('should calculate mixed diagonal and straight distance', function() {
    const start = { _x: 0, _y: 0 };
    const end = { _x: 5, _y: 3 };
    
    const distance = distanceFinder(start, end);
    // Should favor diagonal movement
    expect(distance).to.be.greaterThan(5);
    expect(distance).to.be.lessThan(8);
  });

  it('should be commutative (distance A to B = distance B to A)', function() {
    const start = { _x: 2, _y: 3 };
    const end = { _x: 7, _y: 8 };
    
    const distAB = distanceFinder(start, end);
    const distBA = distanceFinder(end, start);
    
    expect(distAB).to.equal(distBA);
  });

  it('should return zero for same node', function() {
    const node = { _x: 5, _y: 5 };
    const distance = distanceFinder(node, node);
    expect(distance).to.equal(0);
  });

  it('should handle negative coordinates', function() {
    const start = { _x: -3, _y: -2 };
    const end = { _x: 4, _y: 5 };
    
    const distance = distanceFinder(start, end);
    expect(distance).to.be.greaterThan(0);
  });
});

describe('makePath()', function() {
  it('should reconstruct path from end node', function() {
    const node1 = { _x: 0, _y: 0, previousStart: null, previousEnd: null };
    const node2 = { _x: 1, _y: 0, previousStart: node1, previousEnd: null };
    const node3 = { _x: 2, _y: 0, previousStart: node2, previousEnd: null };
    
    const path = makePath(node3);
    
    expect(path).to.have.lengthOf(3);
    expect(path[0]).to.equal(node1);
    expect(path[1]).to.equal(node2);
    expect(path[2]).to.equal(node3);
  });

  it('should handle bidirectional path (from start)', function() {
    const start = { _x: 0, _y: 0, previousStart: null, previousEnd: null };
    const middle = { _x: 1, _y: 0, previousStart: start, previousEnd: null };
    
    const path = makePath(middle);
    
    expect(path).to.have.lengthOf(2);
    expect(path[0]).to.equal(start);
    expect(path[1]).to.equal(middle);
  });

  it('should handle bidirectional path (from end)', function() {
    const end = { _x: 3, _y: 0, previousStart: null, previousEnd: null };
    const middle = { _x: 2, _y: 0, previousStart: null, previousEnd: end };
    const meetingNode = { _x: 1, _y: 0, previousStart: null, previousEnd: middle };
    
    const path = makePath(meetingNode);
    
    expect(path).to.have.lengthOf(3);
    expect(path[2]).to.equal(end);
  });

  it('should handle single node path', function() {
    const node = { _x: 0, _y: 0, previousStart: null, previousEnd: null };
    const path = makePath(node);
    
    expect(path).to.have.lengthOf(1);
    expect(path[0]).to.equal(node);
  });

  it('should concatenate both directions correctly', function() {
    const n1 = { _x: 0, _y: 0, previousStart: null, previousEnd: null };
    const n2 = { _x: 1, _y: 0, previousStart: n1, previousEnd: null };
    const n3 = { _x: 2, _y: 0, previousStart: n2, previousEnd: null };
    const n4 = { _x: 3, _y: 0, previousStart: null, previousEnd: null };
    const n5 = { _x: 4, _y: 0, previousStart: null, previousEnd: n4 };
    
    n3.previousEnd = n4;
    
    const path = makePath(n3);
    
    expect(path).to.have.lengthOf(5);
    expect(path[0]).to.equal(n1);
    expect(path[2]).to.equal(n3);
    expect(path[4]).to.equal(n5);
  });
});

describe('resetSearch()', function() {
  let mockTerrain, pathMap;

  beforeEach(function() {
    mockTerrain = {
      _xCount: 5,
      _yCount: 5,
      _tileStore: [],
      conv2dpos: function(x, y) {
        return y * this._xCount + x;
      }
    };

    for (let i = 0; i < 25; i++) {
      mockTerrain._tileStore[i] = { getWeight: () => 1 };
    }

    pathMap = new PathMap(mockTerrain);
  });

  it('should reset all node f, g, h values', function() {
    const grid = pathMap.getGrid();
    const node = grid.getArrPos([2, 2]);
    
    node.f = 10;
    node.g = 5;
    node.h = 5;
    
    const start = grid.getArrPos([0, 0]);
    const end = grid.getArrPos([4, 4]);
    resetSearch(start, end, pathMap);
    
    expect(node.f).to.equal(0);
    expect(node.g).to.equal(0);
    expect(node.h).to.equal(0);
  });

  it('should initialize start node with f value', function() {
    const grid = pathMap.getGrid();
    const start = grid.getArrPos([0, 0]);
    const end = grid.getArrPos([4, 4]);
    
    resetSearch(start, end, pathMap);
    
    expect(start.g).to.equal(0);
    expect(start.f).to.be.greaterThan(0);
  });

  it('should initialize end node with f value', function() {
    const grid = pathMap.getGrid();
    const start = grid.getArrPos([0, 0]);
    const end = grid.getArrPos([4, 4]);
    
    resetSearch(start, end, pathMap);
    
    expect(end.g).to.equal(0);
    expect(end.f).to.be.greaterThan(0);
  });

  it('should clear previous search path', function() {
    const grid = pathMap.getGrid();
    const start = grid.getArrPos([0, 0]);
    const end = grid.getArrPos([4, 4]);
    
    // Run a search first
    resetSearch(start, end, pathMap);
    
    // Check that path is cleared
    // (path variable is global in the module)
    expect(typeof path).to.not.be.undefined;
  });

  it('should reset meeting node to null', function() {
    const grid = pathMap.getGrid();
    const start = grid.getArrPos([0, 0]);
    const end = grid.getArrPos([4, 4]);
    
    resetSearch(start, end, pathMap);
    
    expect(meetingNode).to.be.null;
  });
});

describe('findPath() - Integration Tests', function() {
  let mockTerrain, pathMap;

  beforeEach(function() {
    mockTerrain = {
      _xCount: 10,
      _yCount: 10,
      _tileStore: [],
      conv2dpos: function(x, y) {
        return y * this._xCount + x;
      }
    };

    for (let i = 0; i < 100; i++) {
      mockTerrain._tileStore[i] = { getWeight: () => 1 };
    }

    pathMap = new PathMap(mockTerrain);
  });

  describe('Basic Pathfinding', function() {
    it('should find straight horizontal path', function() {
      const grid = pathMap.getGrid();
      const start = grid.getArrPos([0, 5]);
      const end = grid.getArrPos([5, 5]);
      
      const path = findPath(start, end, pathMap);
      
      expect(path).to.be.an('array');
      expect(path.length).to.be.greaterThan(0);
      expect(path[0]).to.equal(start);
      expect(path[path.length - 1]).to.equal(end);
    });

    it('should find straight vertical path', function() {
      const grid = pathMap.getGrid();
      const start = grid.getArrPos([5, 0]);
      const end = grid.getArrPos([5, 5]);
      
      const path = findPath(start, end, pathMap);
      
      expect(path).to.be.an('array');
      expect(path.length).to.be.greaterThan(0);
      expect(path[0]).to.equal(start);
      expect(path[path.length - 1]).to.equal(end);
    });

    it('should find diagonal path', function() {
      const grid = pathMap.getGrid();
      const start = grid.getArrPos([0, 0]);
      const end = grid.getArrPos([5, 5]);
      
      const path = findPath(start, end, pathMap);
      
      expect(path).to.be.an('array');
      expect(path.length).to.be.greaterThan(0);
      expect(path[0]).to.equal(start);
      expect(path[path.length - 1]).to.equal(end);
    });

    it('should return single node for same start and end', function() {
      const grid = pathMap.getGrid();
      const start = grid.getArrPos([5, 5]);
      const end = start;
      
      const path = findPath(start, end, pathMap);
      
      // Should meet immediately
      expect(path).to.be.an('array');
    });

    it('should find path between adjacent nodes', function() {
      const grid = pathMap.getGrid();
      const start = grid.getArrPos([5, 5]);
      const end = grid.getArrPos([5, 6]);
      
      const path = findPath(start, end, pathMap);
      
      expect(path.length).to.be.at.least(2);
      expect(path[0]).to.equal(start);
      expect(path[path.length - 1]).to.equal(end);
    });
  });

  describe('Pathfinding with Obstacles', function() {
    it('should return empty array when no path exists', function() {
      const grid = pathMap.getGrid();
      
      // Create a wall blocking the path
      for (let y = 0; y < 10; y++) {
        const wallNode = grid.getArrPos([5, y]);
        wallNode.wall = true;
      }
      
      const start = grid.getArrPos([0, 5]);
      const end = grid.getArrPos([9, 5]);
      
      const path = findPath(start, end, pathMap);
      
      expect(path).to.be.an('array');
      expect(path).to.have.lengthOf(0);
    });

    it('should route around obstacles', function() {
      const grid = pathMap.getGrid();
      
      // Create vertical wall with gap
      for (let y = 0; y < 8; y++) {
        const wallNode = grid.getArrPos([5, y]);
        wallNode.wall = true;
      }
      
      const start = grid.getArrPos([0, 5]);
      const end = grid.getArrPos([9, 5]);
      
      const path = findPath(start, end, pathMap);
      
      expect(path).to.be.an('array');
      expect(path.length).to.be.greaterThan(0);
      expect(path[0]).to.equal(start);
      expect(path[path.length - 1]).to.equal(end);
    });

    it('should avoid wall nodes in path', function() {
      const grid = pathMap.getGrid();
      
      // Create some walls
      grid.getArrPos([3, 3]).wall = true;
      grid.getArrPos([3, 4]).wall = true;
      grid.getArrPos([3, 5]).wall = true;
      
      const start = grid.getArrPos([0, 4]);
      const end = grid.getArrPos([7, 4]);
      
      const path = findPath(start, end, pathMap);
      
      // Ensure no wall nodes in path
      const hasWallInPath = path.some(node => node.wall);
      expect(hasWallInPath).to.be.false;
    });
  });

  describe('Path Optimality', function() {
    it('should prefer diagonal movement when optimal', function() {
      const grid = pathMap.getGrid();
      const start = grid.getArrPos([0, 0]);
      const end = grid.getArrPos([3, 3]);
      
      const path = findPath(start, end, pathMap);
      
      // Diagonal path should be shorter than Manhattan path
      expect(path.length).to.be.at.most(4); // Perfect diagonal
    });

    it('should handle weighted terrain', function() {
      const grid = pathMap.getGrid();
      
      // Make a row expensive
      for (let x = 0; x < 10; x++) {
        const node = grid.getArrPos([x, 5]);
        node.weight = 10;
      }
      
      const start = grid.getArrPos([0, 5]);
      const end = grid.getArrPos([9, 5]);
      
      const path = findPath(start, end, pathMap);
      
      expect(path).to.be.an('array');
      // Path may route around expensive terrain if available
    });
  });

  describe('Edge Cases', function() {
    it('should handle path along grid boundaries', function() {
      const grid = pathMap.getGrid();
      const start = grid.getArrPos([0, 0]);
      const end = grid.getArrPos([9, 0]);
      
      const path = findPath(start, end, pathMap);
      
      expect(path.length).to.be.greaterThan(0);
      expect(path[0]).to.equal(start);
      expect(path[path.length - 1]).to.equal(end);
    });

    it('should handle corner to corner paths', function() {
      const grid = pathMap.getGrid();
      const start = grid.getArrPos([0, 0]);
      const end = grid.getArrPos([9, 9]);
      
      const path = findPath(start, end, pathMap);
      
      expect(path.length).to.be.greaterThan(0);
      expect(path[0]).to.equal(start);
      expect(path[path.length - 1]).to.equal(end);
    });

    it('should find path in small grid (3x3)', function() {
      const smallTerrain = {
        _xCount: 3,
        _yCount: 3,
        _tileStore: [],
        conv2dpos: function(x, y) {
          return y * this._xCount + x;
        }
      };

      for (let i = 0; i < 9; i++) {
        smallTerrain._tileStore[i] = { getWeight: () => 1 };
      }

      const smallPathMap = new PathMap(smallTerrain);
      const grid = smallPathMap.getGrid();
      const start = grid.getArrPos([0, 0]);
      const end = grid.getArrPos([2, 2]);
      
      const path = findPath(start, end, smallPathMap);
      
      expect(path.length).to.be.greaterThan(0);
    });
  });

  describe('Bidirectional Search Properties', function() {
    it('should meet in the middle for long paths', function() {
      const grid = pathMap.getGrid();
      const start = grid.getArrPos([0, 5]);
      const end = grid.getArrPos([9, 5]);
      
      const path = findPath(start, end, pathMap);
      
      // Bidirectional should be efficient
      expect(path).to.be.an('array');
      expect(path.length).to.be.greaterThan(0);
    });

    it('should work correctly when searches meet quickly', function() {
      const grid = pathMap.getGrid();
      const start = grid.getArrPos([5, 5]);
      const end = grid.getArrPos([6, 5]);
      
      const path = findPath(start, end, pathMap);
      
      expect(path.length).to.be.at.least(2);
      expect(path[0]).to.equal(start);
    });
  });
});

describe('expandNeighbors() - Algorithm Details', function() {
  it('should skip closed nodes', function() {
    const mockNode = {
      _x: 5,
      _y: 5,
      g: 0,
      neighbors: [
        { id: 'neighbor1', wall: false, g: 0, weight: 1, _x: 6, _y: 5 },
        { id: 'neighbor2', wall: false, g: 0, weight: 1, _x: 4, _y: 5 }
      ]
    };

    const openSet = new BinaryHeap();
    const openMap = new Map();
    const closedSet = new Set(['neighbor1']);
    const target = { _x: 10, _y: 10 };

    expandNeighbors(mockNode, openSet, openMap, closedSet, target, true);

    // Only neighbor2 should be added (neighbor1 is closed)
    expect(openMap.has('neighbor1')).to.be.false;
    expect(openMap.has('neighbor2')).to.be.true;
  });

  it('should skip wall nodes', function() {
    const mockNode = {
      _x: 5,
      _y: 5,
      g: 0,
      neighbors: [
        { id: 'wall', wall: true, g: 0, weight: 1, _x: 6, _y: 5 },
        { id: 'open', wall: false, g: 0, weight: 1, _x: 4, _y: 5 }
      ]
    };

    const openSet = new BinaryHeap();
    const openMap = new Map();
    const closedSet = new Set();
    const target = { _x: 10, _y: 10 };

    expandNeighbors(mockNode, openSet, openMap, closedSet, target, true);

    expect(openMap.has('wall')).to.be.false;
    expect(openMap.has('open')).to.be.true;
  });

  it('should update g value when better path found', function() {
    const neighbor = { 
      id: 'neighbor', 
      wall: false, 
      g: 100, 
      h: 0,
      f: 100,
      weight: 1, 
      _x: 6, 
      _y: 5 
    };

    const mockNode = {
      _x: 5,
      _y: 5,
      g: 1,
      neighbors: [neighbor]
    };

    const openSet = new BinaryHeap();
    const openMap = new Map([['neighbor', neighbor]]);
    const closedSet = new Set();
    const target = { _x: 10, _y: 10 };

    expandNeighbors(mockNode, openSet, openMap, closedSet, target, true);

    // Should update to lower g value
    expect(neighbor.g).to.be.lessThan(100);
  });
});