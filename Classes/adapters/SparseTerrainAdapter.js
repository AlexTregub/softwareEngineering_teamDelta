/**
 * SparseTerrainAdapter.js
 * Adapter to expose OLD Terrain API for PathMap while wrapping SparseTerrain
 * 
 * PURPOSE: PathMap expects OLD Terrain structure (_xCount, _yCount, _tileStore[], conv2dpos)
 *          SparseTerrain uses Map<"x,y", Tile> sparse structure with dynamic bounds
 *          This adapter bridges the gap without modifying PathMap or SparseTerrain.
 * 
 * CHALLENGES:
 *   - SparseTerrain has dynamic bounds (negative coords, sparse storage)
 *   - PathMap expects flat array with 0-based indices
 *   - Need coordinate offset calculations (world → array)
 *   - Need to fill unpainted tiles with default material
 * 
 * USAGE:
 *   const adapter = new SparseTerrainAdapter(sparseTerrain);
 *   const pathMap = new PathMap(adapter); // Works with existing PathMap!
 * 
 * Part of: Custom Level Loading - Phase 1.2
 * Related: GridTerrainAdapter (for procedural terrains)
 */

class SparseTerrainAdapter {
  /**
   * Create adapter for SparseTerrain to PathMap compatibility
   * @param {SparseTerrain} sparseTerrain - The SparseTerrain instance to wrap
   */
  constructor(sparseTerrain) {
    if (!sparseTerrain || typeof sparseTerrain.getTile !== 'function') {
      throw new Error('SparseTerrainAdapter: Invalid SparseTerrain instance');
    }
    
    this._sparseTerrain = sparseTerrain;
    
    // Calculate bounds from sparse tiles
    const bounds = this._calculateBounds();
    
    this._minX = bounds.minX;
    this._minY = bounds.minY;
    this._maxX = bounds.maxX;
    this._maxY = bounds.maxY;
    
    // Expose OLD Terrain API properties
    // PathMap expects _xCount and _yCount (total tile dimensions)
    this._xCount = bounds.maxX - bounds.minX + 1;
    this._yCount = bounds.maxY - bounds.minY + 1;
    
    // Generate flat array view of tiles
    // PathMap expects _tileStore[] (flat array indexed by conv2dpos)
    this._tileStore = this._generateFlatView();
  }
  
  /**
   * Convert 2D coordinates to flat array index
   * PathMap expects this method: terrain.conv2dpos(x, y)
   * 
   * @param {int} x - World X coordinate
   * @param {int} y - World Y coordinate
   * @returns {int} Flat array index
   */
  conv2dpos(x, y) {
    // Account for coordinate offset (e.g., negative bounds)
    const localX = x - this._minX;
    const localY = y - this._minY;
    
    // Flat array indexing: index = y * width + x
    return localY * this._xCount + localX;
  }
  
  /**
   * Calculate bounds from sparse tiles
   * @private
   * @returns {Object} {minX, maxX, minY, maxY}
   */
  _calculateBounds() {
    // Use SparseTerrain bounds if available
    if (this._sparseTerrain.bounds) {
      return this._sparseTerrain.bounds;
    }
    
    // Empty terrain - default to 1x1 at origin
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }
  
  /**
   * Generate flat array view from sparse tiles
   * Fills unpainted tiles with default material
   * @private
   * @returns {Array} Flat array of tiles
   */
  _generateFlatView() {
    const tiles = [];
    const width = this._xCount;
    const height = this._yCount;
    const totalTiles = width * height;
    
    // Pre-allocate array
    tiles.length = totalTiles;
    
    // Fill array with tiles (painted or default)
    for (let localY = 0; localY < height; localY++) {
      for (let localX = 0; localX < width; localX++) {
        const worldX = localX + this._minX;
        const worldY = localY + this._minY;
        
        // Get tile from sparse storage (or null if unpainted)
        let tile = this._sparseTerrain.getTile(worldX, worldY);
        
        // If unpainted, create default tile
        if (!tile) {
          tile = {
            material: this._sparseTerrain.defaultMaterial,
            x: worldX,
            y: worldY
          };
        }
        
        // Store in flat array
        const index = localY * width + localX;
        tiles[index] = tile;
      }
    }
    
    return tiles;
  }
  
  /**
   * Set camera position (for terrain caching/culling systems)
   * Camera position passed as [tileX, tileY] array
   * 
   * @param {Array<number>} centerTilePos - [x, y] camera center in tile coordinates
   */
  setCameraPosition(centerTilePos) {
    // SparseTerrain doesn't need camera position for rendering
    // (no tile caching like gridTerrain)
    // But method must exist for API compatibility with CameraManager
    
    // Store for potential future use (debugging, culling, etc.)
    if (this._sparseTerrain && typeof this._sparseTerrain.setCameraPosition === 'function') {
      this._sparseTerrain.setCameraPosition(centerTilePos);
    }
  }
}

// Global export (browser)
if (typeof window !== 'undefined') {
  window.SparseTerrainAdapter = SparseTerrainAdapter;
}

// CommonJS export (Node.js for testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SparseTerrainAdapter;
}
