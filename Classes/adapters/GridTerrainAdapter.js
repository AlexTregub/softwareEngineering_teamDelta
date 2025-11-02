/**
 * GridTerrainAdapter.js
 * Adapter to expose OLD Terrain API for PathMap while wrapping GridTerrain
 * 
 * PURPOSE: PathMap expects OLD Terrain structure (_xCount, _yCount, _tileStore[], conv2dpos)
 *          GridTerrain uses chunk-based structure (chunkArray, get/set methods)
 *          This adapter bridges the gap without modifying PathMap or GridTerrain.
 * 
 * USAGE:
 *   const adapter = new GridTerrainAdapter(gridTerrain);
 *   const pathMap = new PathMap(adapter); // Works with existing PathMap!
 * 
 * Part of: Custom Level Loading - Phase 1.2
 * Related: SparseTerrainAdapter (for Level Editor levels)
 */

class GridTerrainAdapter {
  /**
   * Create adapter for GridTerrain to PathMap compatibility
   * @param {gridTerrain} gridTerrain - The GridTerrain instance to wrap
   */
  constructor(gridTerrain) {
    if (!gridTerrain || typeof gridTerrain.getArrPos !== 'function') {
      throw new Error('GridTerrainAdapter: Invalid GridTerrain instance');
    }
    
    this._gridTerrain = gridTerrain;
    
    // Expose OLD Terrain API properties
    // PathMap expects _xCount and _yCount (total tile dimensions)
    this._xCount = gridTerrain._tileSpanRange[0];
    this._yCount = gridTerrain._tileSpanRange[1];
    
    // Generate flat array view of tiles
    // PathMap expects _tileStore[] (flat array indexed by conv2dpos)
    this._tileStore = this._generateFlatView();
  }
  
  /**
   * Convert 2D coordinates to flat array index
   * PathMap expects this method: terrain.conv2dpos(x, y)
   * @param {number} x - Tile X coordinate
   * @param {number} y - Tile Y coordinate
   * @returns {number} Flat array index
   */
  conv2dpos(x, y) {
    return y * this._xCount + x;
  }
  
  /**
   * Generate flat array view from GridTerrain chunk structure
   * @private
   * @returns {Array<Tile>} Flat array of all tiles
   */
  _generateFlatView() {
    const tiles = [];
    
    // Iterate through all tiles in row-major order
    for (let y = 0; y < this._yCount; y++) {
      for (let x = 0; x < this._xCount; x++) {
        // Get tile from GridTerrain (handles chunk lookup internally)
        const tile = this._gridTerrain.getArrPos([x, y]);
        
        // Add to flat array (reference, not copy)
        tiles.push(tile);
      }
    }
    
    return tiles;
  }
}

// Export for Node.js (CommonJS)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GridTerrainAdapter;
}

// Export for browser (global window)
if (typeof window !== 'undefined') {
  window.GridTerrainAdapter = GridTerrainAdapter;
}
