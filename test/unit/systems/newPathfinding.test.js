/**
 * Unit Tests for newPathfinding
 * Tests pathfinding system with nodes, grid, and wandering
 */

const { expect } = require('chai');

// Mock Grid class
class Grid {
  constructor(xCount, yCount, offset1, offset2) {
    this.xCount = xCount;
    this.yCount = yCount;
    this.data = [];
    for (let y = 0; y < yCount; y++) {
      this.data[y] = [];
      for (let x = 0; x < xCount; x++) {
        this.data[y][x] = null;
      }
    }
  }
  
  getArrPos(pos) {
    const [x, y] = pos;
    if (x < 0 || x >= this.xCount || y < 0 || y >= this.yCount) {
      return null;
    }
    return this.data[y][x];
  }
  
  setArrPos(pos, value) {
    const [x, y] = pos;
    if (x >= 0 && x < this.xCount && y >= 0 && y < this.yCount) {
      this.data[y][x] = value;
    }
  }
}

global.Grid = Grid;

// Mock StenchGrid
class StenchGrid {
  constructor() {
    this.grid = {};
  }
  
  addPheromone(x, y, antType, tag) {
    const key = `${x},${y}`;
    if (!this.grid[key]) {
      this.grid[key] = [];
    }
    this.grid[key].push({ antType, tag });
  }
}

global.StenchGrid = StenchGrid;
global.pheromoneGrid = new StenchGrid();

// Load newPathfinding
const pathfindingCode = require('fs').readFileSync(
  require('path').resolve(__dirname, '../../../Classes/systems/newPathfinding.js'),
  'utf8'
);
eval(pathfindingCode);

describe('Node', function() {
  
  let mockTile;
  
  beforeEach(function() {
    mockTile = {
      getWeight: () => 1,
      type: 'grass'
    };
    global.pheromoneGrid = new StenchGrid();
  });
  
  describe('Constructor', function() {
    
    it('should create node with position', function() {
      const node = new Node(mockTile, 5, 10);
      
      expect(node._x).to.equal(5);
      expect(node._y).to.equal(10);
    });
    
    it('should store terrain tile', function() {
      const node = new Node(mockTile, 0, 0);
      
      expect(node._terrainTile).to.equal(mockTile);
    });
    
    it('should create unique ID', function() {
      const node1 = new Node(mockTile, 5, 10);
      const node2 = new Node(mockTile, 3, 7);
      
      expect(node1.id).to.equal('5-10');
      expect(node2.id).to.equal('3-7');
      expect(node1.id).to.not.equal(node2.id);
    });
    
    it('should initialize empty scents array', function() {
      const node = new Node(mockTile, 0, 0);
      
      expect(node.scents).to.be.an('array');
      expect(node.scents).to.have.lengthOf(0);
    });
    
    it('should store weight from terrain tile', function() {
      const node = new Node(mockTile, 0, 0);
      
      expect(node.weight).to.equal(1);
    });
    
    it('should handle different weights', function() {
      mockTile.getWeight = () => 5;
      const node = new Node(mockTile, 0, 0);
      
      expect(node.weight).to.equal(5);
    });
  });
  
  describe('assignWall()', function() {
    
    it('should mark as wall when weight is 100', function() {
      mockTile.getWeight = () => 100;
      const node = new Node(mockTile, 0, 0);
      
      expect(node.wall).to.be.true;
    });
    
    it('should not mark as wall for normal weight', function() {
      mockTile.getWeight = () => 1;
      const node = new Node(mockTile, 0, 0);
      
      expect(node.wall).to.be.false;
    });
    
    it('should not mark as wall for high but non-100 weight', function() {
      mockTile.getWeight = () => 99;
      const node = new Node(mockTile, 0, 0);
      
      expect(node.wall).to.be.false;
    });
  });
  
  describe('addScent()', function() {
    
    it('should add scent to pheromone grid', function() {
      const node = new Node(mockTile, 5, 10);
      
      node.addScent(5, 10, 'player', 'forage');
      
      expect(global.pheromoneGrid.grid['5,10']).to.exist;
      expect(global.pheromoneGrid.grid['5,10']).to.have.lengthOf(1);
    });
    
    it('should store ant type and tag', function() {
      const node = new Node(mockTile, 3, 7);
      
      node.addScent(3, 7, 'enemy', 'combat');
      
      const scent = global.pheromoneGrid.grid['3,7'][0];
      expect(scent.antType).to.equal('enemy');
      expect(scent.tag).to.equal('combat');
    });
  });
});

describe('PathMap', function() {
  
  let mockTerrain;
  
  beforeEach(function() {
    mockTerrain = {
      _xCount: 3,
      _yCount: 3,
      _tileStore: [],
      conv2dpos: (x, y) => y * 3 + x
    };
    
    // Create 9 tiles
    for (let i = 0; i < 9; i++) {
      mockTerrain._tileStore.push({
        getWeight: () => 1,
        type: 'grass'
      });
    }
  });
  
  describe('Constructor', function() {
    
    it('should create grid matching terrain size', function() {
      const pathMap = new PathMap(mockTerrain);
      const grid = pathMap.getGrid();
      
      expect(grid.xCount).to.equal(3);
      expect(grid.yCount).to.equal(3);
    });
    
    it('should create nodes for all tiles', function() {
      const pathMap = new PathMap(mockTerrain);
      const grid = pathMap.getGrid();
      
      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
          const node = grid.getArrPos([x, y]);
          expect(node).to.exist;
          expect(node._x).to.equal(x);
          expect(node._y).to.equal(y);
        }
      }
    });
    
    it('should store terrain reference', function() {
      const pathMap = new PathMap(mockTerrain);
      
      expect(pathMap._terrain).to.equal(mockTerrain);
    });
  });
  
  describe('getGrid()', function() {
    
    it('should return grid', function() {
      const pathMap = new PathMap(mockTerrain);
      const grid = pathMap.getGrid();
      
      expect(grid).to.be.an.instanceof(Grid);
    });
  });
});

describe('findBestNeighbor()', function() {
  
  let grid, node, travelled;
  
  beforeEach(function() {
    grid = new Grid(5, 5, [0, 0], [0, 0]);
    travelled = new Set();
    
    // Create nodes with different weights
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const mockTile = {
          getWeight: () => Math.random() * 5,
          type: 'grass'
        };
        grid.setArrPos([x, y], new Node(mockTile, x, y));
      }
    }
    
    node = grid.getArrPos([2, 2]); // Center node
  });
  
  it('should find best neighbor', function() {
    const bestNeighbor = findBestNeighbor(grid, node, travelled);
    
    expect(bestNeighbor).to.exist;
  });
  
  it('should return neighbor with lowest weight', function() {
    // Set specific weights
    grid.getArrPos([1, 2]).weight = 1;  // Left
    grid.getArrPos([3, 2]).weight = 5;  // Right
    grid.getArrPos([2, 1]).weight = 3;  // Up
    grid.getArrPos([2, 3]).weight = 4;  // Down
    
    const bestNeighbor = findBestNeighbor(grid, node, travelled);
    
    expect(bestNeighbor.weight).to.equal(1);
    expect(bestNeighbor._x).to.equal(1);
    expect(bestNeighbor._y).to.equal(2);
  });
  
  it('should add current node to travelled set', function() {
    findBestNeighbor(grid, node, travelled);
    
    expect(travelled.has(node.id)).to.be.true;
  });
  
  it('should exclude already travelled nodes', function() {
    // Mark left neighbor as travelled
    const leftNeighbor = grid.getArrPos([1, 2]);
    leftNeighbor.weight = 1; // Lowest weight
    travelled.add(leftNeighbor.id);
    
    // Set right neighbor with higher weight
    grid.getArrPos([3, 2]).weight = 2;
    
    const bestNeighbor = findBestNeighbor(grid, node, travelled);
    
    // Should not pick left neighbor even though it has lowest weight
    expect(bestNeighbor.id).to.not.equal(leftNeighbor.id);
  });
  
  it('should check all 8 neighbors', function() {
    // Set corner neighbor as best
    const cornerNode = grid.getArrPos([1, 1]);
    cornerNode.weight = 0.5;
    
    // Set all adjacent neighbors higher
    grid.getArrPos([1, 2]).weight = 5;
    grid.getArrPos([2, 1]).weight = 5;
    grid.getArrPos([3, 2]).weight = 5;
    grid.getArrPos([2, 3]).weight = 5;
    
    const bestNeighbor = findBestNeighbor(grid, node, travelled);
    
    expect(bestNeighbor._x).to.equal(1);
    expect(bestNeighbor._y).to.equal(1);
  });
  
  it('should return null if all neighbors travelled', function() {
    // Mark all neighbors as travelled
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        const neighbor = grid.getArrPos([node._x + i, node._y + j]);
        if (neighbor) {
          travelled.add(neighbor.id);
        }
      }
    }
    
    const bestNeighbor = findBestNeighbor(grid, node, travelled);
    
    expect(bestNeighbor).to.be.null;
  });
  
  it('should handle edge nodes', function() {
    const edgeNode = grid.getArrPos([0, 0]); // Top-left corner
    
    const bestNeighbor = findBestNeighbor(grid, edgeNode, travelled);
    
    expect(bestNeighbor).to.exist;
  });
});

describe('tryTrack()', function() {
  
  let mockAnt;
  
  beforeEach(function() {
    mockAnt = {
      brain: {
        checkTrail: (scent) => false
      },
      speciesName: 'worker'
    };
  });
  
  it('should return 0 when no scents match', function() {
    const scents = [
      { name: 'forage' },
      { name: 'combat' }
    ];
    
    const result = tryTrack(scents, mockAnt);
    
    expect(result).to.equal(0);
  });
  
  it('should return scent name when match found', function() {
    mockAnt.brain.checkTrail = (scent) => scent.name === 'forage';
    
    const scents = [
      { name: 'forage' },
      { name: 'combat' }
    ];
    
    const result = tryTrack(scents, mockAnt);
    
    expect(result).to.equal('forage');
  });
  
  it('should check multiple scents', function() {
    const checkedScents = [];
    mockAnt.brain.checkTrail = (scent) => {
      checkedScents.push(scent.name);
      return scent.name === 'build';
    };
    
    const scents = [
      { name: 'forage' },
      { name: 'combat' },
      { name: 'build' }
    ];
    
    tryTrack(scents, mockAnt);
    
    expect(checkedScents).to.include('forage');
    expect(checkedScents).to.include('combat');
  });
  
  it('should return first matching scent', function() {
    mockAnt.brain.checkTrail = (scent) => true; // Match all
    
    const scents = [
      { name: 'forage' },
      { name: 'combat' },
      { name: 'build' }
    ];
    
    const result = tryTrack(scents, mockAnt);
    
    expect(result).to.equal('forage'); // First one
  });
  
  it('should handle empty scents array', function() {
    const scents = [];
    
    const result = tryTrack(scents, mockAnt);
    
    expect(result).to.equal(0);
  });
});

describe('wander()', function() {
  
  let grid, node, travelled, mockAnt;
  
  beforeEach(function() {
    grid = new Grid(5, 5, [0, 0], [0, 0]);
    travelled = new Set();
    
    // Create nodes
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const mockTile = {
          getWeight: () => 1,
          type: 'grass'
        };
        grid.setArrPos([x, y], new Node(mockTile, x, y));
      }
    }
    
    node = grid.getArrPos([2, 2]);
    
    mockAnt = {
      brain: {
        checkTrail: () => false
      },
      speciesName: 'worker',
      avoidSmellCheck: false,
      pathType: null,
      _faction: 'player'
    };
  });
  
  it('should return neighbor when no scents', function() {
    const result = wander(grid, node, travelled, mockAnt, 'idle');
    
    expect(result).to.exist;
  });
  
  it('should call findBestNeighbor when no scents', function() {
    node.scents = [];
    
    const result = wander(grid, node, travelled, mockAnt, 'idle');
    
    // Result should be a neighbor node
    expect(result._x).to.be.within(1, 3);
    expect(result._y).to.be.within(1, 3);
  });
  
  it('should check scents when available', function() {
    node.scents = [{ name: 'forage' }];
    
    const result = wander(grid, node, travelled, mockAnt, 'idle');
    
    expect(result).to.exist;
  });
  
  it('should handle avoidSmellCheck flag', function() {
    node.scents = [{ name: 'forage' }];
    mockAnt.avoidSmellCheck = true;
    
    const result = wander(grid, node, travelled, mockAnt, 'idle');
    
    // Should use findBestNeighbor instead of tracking
    expect(result).to.exist;
  });
});

describe('Pathfinding Integration', function() {
  
  it('should create complete path map from terrain', function() {
    const mockTerrain = {
      _xCount: 5,
      _yCount: 5,
      _tileStore: [],
      conv2dpos: (x, y) => y * 5 + x
    };
    
    for (let i = 0; i < 25; i++) {
      mockTerrain._tileStore.push({
        getWeight: () => 1,
        type: 'grass'
      });
    }
    
    const pathMap = new PathMap(mockTerrain);
    const grid = pathMap.getGrid();
    
    // Verify all nodes accessible
    const centerNode = grid.getArrPos([2, 2]);
    const travelled = new Set();
    
    const neighbor = findBestNeighbor(grid, centerNode, travelled);
    
    expect(neighbor).to.exist;
  });
});
