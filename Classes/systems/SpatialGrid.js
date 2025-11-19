/**
 * @fileoverview SpatialGrid - Efficient spatial partitioning system for entity queries
 * Uses a hash grid to partition 2D space into cells for O(1) lookups
 * 
 * @author Software Engineering Team Delta
 * @version 1.0.0
 */

/**
 * Spatial hash grid for efficient entity proximity queries.
 * Divides the world into fixed-size cells and stores entities in their corresponding cells.
 * 
 * Performance:
 * - Add/Remove: O(1)
 * - Update: O(1) 
 * - Query radius: O(k) where k = entities in nearby cells (typically k << n total entities)
 * 
 * Memory: ~16 bytes per entity (grid cell key + Set storage)
 * 
 * @class SpatialGrid
 * @example
 * const grid = new SpatialGrid(32); // 32px cells (match TILE_SIZE)
 * grid.addEntity(myAnt);
 * const nearby = grid.queryRadius(100, 100, 50); // Find entities within 50px of (100,100)
 */
class SpatialGrid {
  /**
   * Create a spatial grid with fixed cell size
   * Cell size should match terrain tile size for perfect alignment
   * @param {number} [cellSize=32] - Size of each grid cell in pixels (default: TILE_SIZE to match terrain)
   */
  constructor(cellSize = (typeof TILE_SIZE !== 'undefined' ? TILE_SIZE : 32)) {
    this._cellSize = cellSize;
    this._grid = new Map(); // key: "x,y", value: Set of entities
    this._entityCount = 0;
    
    const globalObj = typeof globalThis !== 'undefined' ? globalThis : (typeof global !== 'undefined' ? global : window);
    if (globalObj && typeof globalObj.logNormal === 'function') {
    }
  }

  /**
   * Convert world coordinates to grid cell key
   * @param {number} x - World X coordinate (pixel-space)
   * @param {number} y - World Y coordinate (pixel-space)
   * @returns {string} Grid cell key "cellX,cellY"
   * @private
   */
  _getKey(x, y) {
    const cellX = Math.floor(x / this._cellSize);
    const cellY = Math.floor(y / this._cellSize);
    return `${cellX},${cellY}`;
  }

  /**
   * Get cell coordinates from world coordinates
   * @param {number} x - World X coordinate (pixel-space)
   * @param {number} y - World Y coordinate (pixel-space)
   * @returns {Array<number>} [cellX, cellY]
   * @private
   */
  _getCellCoords(x, y) {
    const cellX = Math.floor(x / this._cellSize);
    const cellY = Math.floor(y / this._cellSize);
    return [cellX, cellY];
  }

  /**
   * Add an entity to the spatial grid
   * @param {Entity} entity - Entity to add (must have getX()/getY() or getPosition() methods)
   * @returns {boolean} True if added successfully
   * @example
   * const success = spatialGrid.addEntity(myAnt);
   */
  addEntity(entity) {
    if (!entity) {
      console.warn('SpatialGrid: Cannot add null/undefined entity');
      return false;
    }

    // Support both getX()/getY() and getPosition() patterns
    let x, y;
    if (typeof entity.getX === 'function' && typeof entity.getY === 'function') {
      x = entity.getX();
      y = entity.getY();
    } else if (typeof entity.getPosition === 'function') {
      const pos = entity.getPosition();
      x = pos.x;
      y = pos.y;
    } else {
      console.warn('SpatialGrid: Entity must have getX()/getY() or getPosition() methods', entity);
      return false;
    }

    try {
      const key = this._getKey(x, y);

      // Create cell if it doesn't exist
      if (!this._grid.has(key)) {
        this._grid.set(key, new Set());
      }

      // Add entity to cell
      this._grid.get(key).add(entity);
      
      // Track which cell this entity is in
      entity._gridCell = key;
      this._entityCount++;

      return true;
    } catch (error) {
      console.error('SpatialGrid: Error adding entity', error);
      return false;
    }
  }

  /**
   * Remove an entity from the spatial grid
   * @param {Entity} entity - Entity to remove
   * @returns {boolean} True if removed successfully
   * @example
   * const removed = spatialGrid.removeEntity(myAnt);
   */
  removeEntity(entity) {
    if (!entity || !entity._gridCell) {
      return false;
    }

    try {
      const cell = this._grid.get(entity._gridCell);
      if (cell) {
        const deleted = cell.delete(entity);
        if (deleted) {
          this._entityCount--;
          
          // Clean up empty cells to prevent memory bloat
          if (cell.size === 0) {
            this._grid.delete(entity._gridCell);
          }
        }
        entity._gridCell = null;
        return deleted;
      }
      return false;
    } catch (error) {
      console.error('SpatialGrid: Error removing entity', error);
      return false;
    }
  }

  /**
   * Update entity position in the grid (call when entity moves)
   * If entity moved to a new cell, removes from old cell and adds to new cell
   * @param {Entity} entity - Entity that moved
   * @returns {boolean} True if update successful
   * @example
   * myAnt.setPosition(newX, newY);
   * spatialGrid.updateEntity(myAnt); // Sync grid with new position
   */
  updateEntity(entity) {
    if (!entity) {
      return false;
    }

    // Support both getX()/getY() and getPosition() patterns
    let x, y;
    if (typeof entity.getX === 'function' && typeof entity.getY === 'function') {
      x = entity.getX();
      y = entity.getY();
    } else if (typeof entity.getPosition === 'function') {
      const pos = entity.getPosition();
      x = pos.x;
      y = pos.y;
    } else {
      return false;
    }

    try {
      const newKey = this._getKey(x, y);

      // If entity hasn't moved to a new cell, no update needed
      if (entity._gridCell === newKey) {
        return true;
      }

      // Remove from old cell
      if (entity._gridCell) {
        const oldCell = this._grid.get(entity._gridCell);
        if (oldCell) {
          oldCell.delete(entity);
          if (oldCell.size === 0) {
            this._grid.delete(entity._gridCell);
          }
        }
      } else {
        // Entity wasn't in grid yet, count it
        this._entityCount++;
      }

      // Add to new cell
      if (!this._grid.has(newKey)) {
        this._grid.set(newKey, new Set());
      }
      this._grid.get(newKey).add(entity);
      entity._gridCell = newKey;

      return true;
    } catch (error) {
      console.error('SpatialGrid: Error updating entity', error);
      return false;
    }
  }

  /**
   * Query all entities within a radius of a point
   * @param {number} x - Center X coordinate
   * @param {number} y - Center Y coordinate
   * @param {number} radius - Search radius in pixels
   * @param {Function} [filter] - Optional filter function (entity => boolean)
   * @returns {Array<Entity>} Entities within radius
   * @example
   * // Find all ants within 100px of position (200, 150)
   * const nearby = spatialGrid.queryRadius(200, 150, 100, e => e.type === "Ant");
   */
  queryRadius(x, y, radius, filter = null) {
    const results = [];
    
    // Calculate how many cells we need to check
    const cellRadius = Math.ceil(radius / this._cellSize);
    const [centerCellX, centerCellY] = this._getCellCoords(x, y);

    // Check all cells within the bounding box
    for (let dy = -cellRadius; dy <= cellRadius; dy++) {
      for (let dx = -cellRadius; dx <= cellRadius; dx++) {
        const key = `${centerCellX + dx},${centerCellY + dy}`;
        const cell = this._grid.get(key);
        
        if (cell) {
          // Check each entity in the cell
          for (const entity of cell) {
            // Distance check (circle vs square approximation)
            const ex = entity.getX();
            const ey = entity.getY();
            const distSq = (x - ex) * (x - ex) + (y - ey) * (y - ey);
            
            if (distSq <= radius * radius) {
              // Apply optional filter
              if (!filter || filter(entity)) {
                results.push(entity);
              }
            }
          }
        }
      }
    }

    return results;
  }

  /**
   * Query entities in a rectangular area
   * @param {number} x - Top-left X coordinate
   * @param {number} y - Top-left Y coordinate
   * @param {number} width - Rectangle width
   * @param {number} height - Rectangle height
   * @param {Function} [filter] - Optional filter function
   * @returns {Array<Entity>} Entities in rectangle
   * @example
   * // Find all entities in a selection box
   * const selected = spatialGrid.queryRect(100, 100, 200, 150);
   */
  queryRect(x, y, width, height, filter = null) {
    const results = [];
    
    // Get cell range for the rectangle
    const [minCellX, minCellY] = this._getCellCoords(x, y);
    const [maxCellX, maxCellY] = this._getCellCoords(x + width, y + height);

    // Iterate through cells in the rectangle
    for (let cy = minCellY; cy <= maxCellY; cy++) {
      for (let cx = minCellX; cx <= maxCellX; cx++) {
        const key = `${cx},${cy}`;
        const cell = this._grid.get(key);
        
        if (cell) {
          for (const entity of cell) {
            const ex = entity.getX();
            const ey = entity.getY();
            
            // Check if entity is actually in the rectangle
            if (ex >= x && ex <= x + width && ey >= y && ey <= y + height) {
              if (!filter || filter(entity)) {
                results.push(entity);
              }
            }
          }
        }
      }
    }

    return results;
  }

  /**
   * Query entities in a specific cell
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   * @returns {Array<Entity>} Entities in the cell containing (x,y)
   * @example
   * const entitiesInCell = spatialGrid.queryCell(100, 100);
   */
  queryCell(x, y) {
    const key = this._getKey(x, y);
    const cell = this._grid.get(key);
    return cell ? Array.from(cell) : [];
  }

  /**
   * Find the nearest entity to a point
   * @param {number} x - Center X coordinate
   * @param {number} y - Center Y coordinate
   * @param {number} [maxRadius=Infinity] - Maximum search radius
   * @param {Function} [filter] - Optional filter function
   * @returns {Entity|null} Nearest entity or null if none found
   * @example
   * const nearest = spatialGrid.findNearest(mouseX, mouseY, 50);
   */
  findNearest(x, y, maxRadius = Infinity, filter = null) {
    let nearest = null;
    let minDistSq = maxRadius * maxRadius;

    // Start with immediate cell and expand outward
    const searchRadius = Math.min(maxRadius, this._cellSize * 3);
    const candidates = this.queryRadius(x, y, searchRadius, filter);

    for (const entity of candidates) {
      const ex = entity.getX();
      const ey = entity.getY();
      const distSq = (x - ex) * (x - ex) + (y - ey) * (y - ey);

      if (distSq < minDistSq) {
        minDistSq = distSq;
        nearest = entity;
      }
    }

    return nearest;
  }

  /**
   * Clear all entities from the grid
   * @example
   * spatialGrid.clear();
   */
  clear() {
    this._grid.clear();
    this._entityCount = 0;
    
    const globalObj = typeof globalThis !== 'undefined' ? globalThis : (typeof global !== 'undefined' ? global : window);
    if (globalObj && typeof globalObj.logNormal === 'function') {
    }
  }

  /**
   * Get statistics about the spatial grid
   * @returns {Object} Grid statistics
   * @example
   * const stats = spatialGrid.getStats();
   */
  getStats() {
    let minEntitiesPerCell = Infinity;
    let maxEntitiesPerCell = 0;
    let totalEntitiesInCells = 0;

    for (const cell of this._grid.values()) {
      const size = cell.size;
      minEntitiesPerCell = Math.min(minEntitiesPerCell, size);
      maxEntitiesPerCell = Math.max(maxEntitiesPerCell, size);
      totalEntitiesInCells += size;
    }

    const avgEntitiesPerCell = this._grid.size > 0 ? 
      totalEntitiesInCells / this._grid.size : 0;

    return {
      cellSize: this._cellSize,
      entityCount: this._entityCount,
      cellCount: this._grid.size,
      minEntitiesPerCell: minEntitiesPerCell === Infinity ? 0 : minEntitiesPerCell,
      maxEntitiesPerCell,
      avgEntitiesPerCell: avgEntitiesPerCell.toFixed(2)
    };
  }

  /**
   * Get all entities in the grid (for debugging/iteration)
   * @returns {Array<Entity>} All entities
   * @example
   * const allEntities = spatialGrid.getAllEntities();
   */
  getAllEntities() {
    const entities = [];
    for (const cell of this._grid.values()) {
      entities.push(...cell);
    }
    return entities;
  }

  /**
   * Visualize the grid for debugging (draws grid cells)
   * @param {Object} [options] - Drawing options
   * @param {string} [options.color='rgba(0,255,0,0.3)'] - Cell border color
   * @param {number} [options.minX] - Min X to draw
   * @param {number} [options.maxX] - Max X to draw
   * @param {number} [options.minY] - Min Y to draw
   * @param {number} [options.maxY] - Max Y to draw
   * @example
   * // In draw() loop
   * spatialGrid.visualize({ color: 'rgba(255,0,0,0.5)' });
   */
  visualize(options = {}) {
    if (typeof push !== 'function') return; // p5.js not available

    const color = options.color || 'rgba(0, 255, 0, 0.3)';
    
    push();
    stroke(color);
    strokeWeight(1);
    noFill();

    // Draw only populated cells
    for (const [key, cell] of this._grid.entries()) {
      const [cellX, cellY] = key.split(',').map(Number);
      const worldX = cellX * this._cellSize;
      const worldY = cellY * this._cellSize;

      // Draw cell border
      rect(worldX, worldY, this._cellSize, this._cellSize);

      // Draw entity count
      if (cell.size > 0) {
        fill(color);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(10);
        text(cell.size, worldX + this._cellSize / 2, worldY + this._cellSize / 2);
        noFill();
        stroke(color);
      }
    }

    pop();
  }
}

// Console helpers for testing
if (typeof window !== 'undefined') {
  /**
   * Visualize spatial grid cells (call from console)
   * @global
   */
  window.visualizeSpatialGrid = function() {
    if (typeof spatialGridManager !== 'undefined' && spatialGridManager) {
      window.VISUALIZE_SPATIAL_GRID = !window.VISUALIZE_SPATIAL_GRID;
    } else {
    }
  };

  /**
   * Get spatial grid statistics (call from console)
   * @global
   */
  window.getSpatialGridStats = function() {
    if (typeof spatialGridManager !== 'undefined' && spatialGridManager && spatialGridManager._grid) {
      const stats = spatialGridManager._grid.getStats();
      return stats;
    } else {
      return null;
    }
  };
}

// Export for Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SpatialGrid;
}