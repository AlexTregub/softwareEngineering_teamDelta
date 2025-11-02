/**
 * terrainIntegrationHelper.js
 * Reusable helper for terrain adapter + PathMap integration tests
 * 
 * PURPOSE: Centralize JSDOM setup, mocks, and class loading for integration tests
 *          Minimize duplication, maximize maintainability
 * 
 * USAGE:
 *   const helper = require('./terrainIntegrationHelper');
 *   helper.setupTestEnvironment();
 *   const { gridTerrain, SparseTerrain, GridTerrainAdapter, SparseTerrainAdapter, PathMap } = helper.loadClasses();
 */

const { JSDOM } = require('jsdom');
const sinon = require('sinon');

/**
 * Setup JSDOM and global mocks
 * Call this in beforeEach() of integration tests
 */
function setupTestEnvironment() {
  // Set up JSDOM for window object
  if (typeof window === 'undefined') {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
  }
  
  // Mock p5.js globals
  global.floor = Math.floor;
  global.ceil = Math.ceil;
  global.abs = Math.abs;
  global.sqrt = Math.sqrt;
  global.min = Math.min;
  global.max = Math.max;
  global.round = Math.round;
  
  // Mock p5.js stubs (for noise, logging)
  const sandbox = sinon.createSandbox();
  global.noiseSeed = sandbox.stub();
  global.noise = sandbox.stub().returns(0.5);
  global.logNormal = sandbox.stub();
  global.print = sandbox.stub();
  
  // Mock constants
  global.CHUNK_SIZE = 8;
  global.TILE_SIZE = 32;
  global.g_canvasX = 800;
  global.g_canvasY = 600;
  global.g_seed = 12345;
  
  // Sync to window for JSDOM
  window.floor = global.floor;
  window.ceil = global.ceil;
  window.abs = global.abs;
  window.sqrt = global.sqrt;
  window.min = global.min;
  window.max = global.max;
  window.round = global.round;
  window.noiseSeed = global.noiseSeed;
  window.noise = global.noise;
  window.logNormal = global.logNormal;
  window.print = global.print;
  window.CHUNK_SIZE = global.CHUNK_SIZE;
  window.TILE_SIZE = global.TILE_SIZE;
  window.g_canvasX = global.g_canvasX;
  window.g_canvasY = global.g_canvasY;
  window.g_seed = global.g_seed;
  
  return sandbox;
}

/**
 * Mock GridTerrain class for integration testing
 * Matches real GridTerrain API without browser dependencies
 */
class MockGridTerrain {
  constructor(gridSizeX, gridSizeY, seed, chunkSize = 8) {
    this._gridSizeX = gridSizeX;
    this._gridSizeY = gridSizeY;
    this.seed = seed;
    this._chunkSize = chunkSize;
    
    // GridTerrain stores total TILE dimensions (chunks * chunkSize)
    this._tileSpanRange = [
      gridSizeX * chunkSize,
      gridSizeY * chunkSize
    ];
    
    // Create mock tile data for all tiles
    this._tiles = new Map();
    const totalTilesX = this._tileSpanRange[0];
    const totalTilesY = this._tileSpanRange[1];
    
    for (let ty = 0; ty < totalTilesY; ty++) {
      for (let tx = 0; tx < totalTilesX; tx++) {
        const key = `${tx},${ty}`;
        // Create tile with type (0=walkable, 2=blocked)
        const tile = {
          type: (tx + ty) % 10 === 0 ? 2 : 0, // 10% blocked
          color: [100, 200, 100],
          x: tx,
          y: ty
        };
        this._tiles.set(key, tile);
      }
    }
  }
  
  getArrPos(coords) {
    const [x, y] = coords;
    const key = `${x},${y}`;
    return this._tiles.get(key) || null;
  }
}

/**
 * Mock PathMap class for integration testing
 * Matches real PathMap API
 */
class MockPathMap {
  constructor(terrain) {
    if (!terrain || typeof terrain.conv2dpos !== 'function') {
      throw new Error('PathMap requires terrain with conv2dpos method');
    }
    
    this.terrain = terrain;
    this.width = terrain._xCount;
    this.height = terrain._yCount;
    this.grid = [];
    
    // Create node grid
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const index = terrain.conv2dpos(x, y);
        const tile = terrain._tileStore[index];
        
        // Create node with terrain weight
        const node = {
          x: x,
          y: y,
          weight: this._calculateWeight(tile)
        };
        
        this.grid.push(node);
      }
    }
  }
  
  _calculateWeight(tile) {
    if (!tile) return Infinity; // Blocked
    
    // Map terrain types to weights
    switch (tile.type || tile.material) {
      case 0: // Grass
      case 'grass':
      case 'dirt':
        return 1.0;
      case 1: // Water
      case 'water':
        return 3.0;
      case 2: // Stone (impassable)
      case 'stone':
        return Infinity;
      case 3: // Sand
      case 'sand':
        return 1.2;
      default:
        return 1.0;
    }
  }
}

/**
 * Load all required classes for integration tests
 * @returns {Object} { gridTerrain, SparseTerrain, GridTerrainAdapter, SparseTerrainAdapter, PathMap }
 */
function loadClasses() {
  // Use MockGridTerrain (matches real API, no browser dependencies)
  const gridTerrain = MockGridTerrain;
  global.gridTerrain = gridTerrain;
  window.gridTerrain = gridTerrain;
  
  // Load SparseTerrain (has CommonJS exports)
  const SparseTerrain = require('../../Classes/terrainUtils/SparseTerrain');
  
  // Load adapters (have CommonJS exports)
  const GridTerrainAdapter = require('../../Classes/adapters/GridTerrainAdapter');
  const SparseTerrainAdapter = require('../../Classes/adapters/SparseTerrainAdapter');
  
  // Use MockPathMap (matches real API, no browser dependencies)
  const PathMap = MockPathMap;
  global.PathMap = PathMap;
  window.PathMap = PathMap;
  
  return {
    gridTerrain,
    SparseTerrain,
    GridTerrainAdapter,
    SparseTerrainAdapter,
    PathMap
  };
}

/**
 * Create a simple test terrain with GridTerrain
 * @param {int} width - Number of chunks wide
 * @param {int} height - Number of chunks tall
 * @returns {gridTerrain} GridTerrain instance
 */
function createTestGridTerrain(width = 3, height = 3) {
  const { gridTerrain } = loadClasses();
  return new gridTerrain(width, height, 12345);
}

/**
 * Create a simple test terrain with SparseTerrain
 * @param {Array} tiles - Array of {x, y, material} objects to paint
 * @returns {SparseTerrain} SparseTerrain instance
 */
function createTestSparseTerrain(tiles = []) {
  const { SparseTerrain } = loadClasses();
  const terrain = new SparseTerrain(32, 'grass');
  
  // Paint provided tiles
  tiles.forEach(tile => {
    terrain.setTile(tile.x, tile.y, tile.material);
  });
  
  // If no tiles provided, create minimal 10x10 grid
  if (tiles.length === 0) {
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        terrain.setTile(x, y, 'grass');
      }
    }
  }
  
  return terrain;
}

/**
 * Create PathMap from adapter
 * @param {GridTerrainAdapter|SparseTerrainAdapter} adapter - Terrain adapter
 * @returns {PathMap} PathMap instance
 */
function createPathMapFromAdapter(adapter) {
  const { PathMap } = loadClasses();
  return new PathMap(adapter);
}

/**
 * Verify PathMap structure
 * @param {PathMap} pathMap - PathMap instance to verify
 * @returns {Object} { valid: boolean, errors: Array<string> }
 */
function verifyPathMapStructure(pathMap) {
  const errors = [];
  
  if (!pathMap) {
    errors.push('PathMap is null or undefined');
    return { valid: false, errors };
  }
  
  // Check required properties
  if (!pathMap.grid || !Array.isArray(pathMap.grid)) {
    errors.push('PathMap.grid is missing or not an array');
  }
  
  if (typeof pathMap.width !== 'number') {
    errors.push('PathMap.width is missing or not a number');
  }
  
  if (typeof pathMap.height !== 'number') {
    errors.push('PathMap.height is missing or not a number');
  }
  
  // Check grid size matches dimensions
  if (pathMap.grid && pathMap.width && pathMap.height) {
    const expectedSize = pathMap.width * pathMap.height;
    if (pathMap.grid.length !== expectedSize) {
      errors.push(`PathMap.grid size mismatch: expected ${expectedSize}, got ${pathMap.grid.length}`);
    }
  }
  
  // Check nodes are valid
  if (pathMap.grid && pathMap.grid.length > 0) {
    const firstNode = pathMap.grid[0];
    if (!firstNode || typeof firstNode.x !== 'number' || typeof firstNode.y !== 'number') {
      errors.push('PathMap.grid nodes are invalid (missing x/y properties)');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get node at specific coordinates from PathMap
 * @param {PathMap} pathMap - PathMap instance
 * @param {int} x - Grid X coordinate
 * @param {int} y - Grid Y coordinate
 * @returns {Node|null} Node at coordinates or null
 */
function getNodeAt(pathMap, x, y) {
  if (!pathMap || !pathMap.grid) return null;
  
  // Validate bounds first
  if (x < 0 || x >= pathMap.width) return null;
  if (y < 0 || y >= pathMap.height) return null;
  
  const index = y * pathMap.width + x;
  if (index < 0 || index >= pathMap.grid.length) return null;
  
  return pathMap.grid[index];
}

/**
 * Count walkable vs blocked nodes in PathMap
 * @param {PathMap} pathMap - PathMap instance
 * @returns {Object} { walkable: int, blocked: int, total: int }
 */
function countNodeTypes(pathMap) {
  if (!pathMap || !pathMap.grid) {
    return { walkable: 0, blocked: 0, total: 0 };
  }
  
  let walkable = 0;
  let blocked = 0;
  
  pathMap.grid.forEach(node => {
    if (node.weight === Infinity) {
      blocked++;
    } else {
      walkable++;
    }
  });
  
  return {
    walkable,
    blocked,
    total: pathMap.grid.length
  };
}

module.exports = {
  setupTestEnvironment,
  loadClasses,
  createTestGridTerrain,
  createTestSparseTerrain,
  createPathMapFromAdapter,
  verifyPathMapStructure,
  getNodeAt,
  countNodeTypes
};
