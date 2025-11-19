/**
 * @fileoverview SpatialGridManager - Hybrid manager for spatial entity management
 * Wraps SpatialGrid for efficient queries while maintaining backward-compatible array access
 * 
 * @author Software Engineering Team Delta
 * @version 1.0.0
 */

/**
 * Manages entities using spatial grid for fast queries while maintaining backward compatibility.
 * Provides both modern spatial queries and legacy array access patterns.
 * 
 * Architecture:
 * - Uses SpatialGrid internally for O(1) spatial queries
 * - Maintains _allEntities array for backward compatibility
 * - Automatically syncs spatial grid when entities move
 * 
 * @class SpatialGridManager
 * @example
 * const manager = new SpatialGridManager();
 * manager.addEntity(myAnt);
 * const nearby = manager.getNearbyEntities(100, 100, 50);
 */
class SpatialGridManager {
  /**
   * Create a spatial grid manager
   * @param {number} [cellSize] - Grid cell size in pixels (default: TILE_SIZE * 2)
   */
  constructor(cellSize) {
    // Core spatial grid for efficient queries
    this._grid = new SpatialGrid(cellSize);
    
    // Maintain array for backward compatibility with existing code
    this._allEntities = [];
    
    // Track entities by type for quick filtering
    this._entitiesByType = new Map();
    
    // Performance tracking
    this._stats = {
      addCount: 0,
      removeCount: 0,
      updateCount: 0,
      queryCount: 0
    };

    const globalObj = typeof globalThis !== 'undefined' ? globalThis : (typeof global !== 'undefined' ? global : window);
    if (globalObj && typeof globalObj.logNormal === 'function') {
    }
  }

  /**
   * Add an entity to spatial management
   * @param {Entity} entity - Entity to add
   * @returns {boolean} True if added successfully
   * @example
   * spatialGridManager.addEntity(myAnt);
   */
  addEntity(entity) {
    if (!entity) {
      console.warn('SpatialGridManager: Cannot add null entity');
      return false;
    }

    // Add to spatial grid
    const gridSuccess = this._grid.addEntity(entity);
    if (!gridSuccess) {
      return false;
    }

    // Add to array (maintain insertion order)
    this._allEntities.push(entity);

    // Track by type
    const type = entity.type || 'Unknown';
    if (!this._entitiesByType.has(type)) {
      this._entitiesByType.set(type, []);
    }
    this._entitiesByType.get(type).push(entity);

    this._stats.addCount++;

    return true;
  }

  /**
   * Remove an entity from spatial management
   * @param {Entity} entity - Entity to remove
   * @returns {boolean} True if removed successfully
   * @example
   * spatialGridManager.removeEntity(deadAnt);
   */
  removeEntity(entity) {
    if (!entity) {
      return false;
    }

    // Remove from spatial grid
    const gridSuccess = this._grid.removeEntity(entity);

    // Remove from array
    const arrayIndex = this._allEntities.indexOf(entity);
    if (arrayIndex !== -1) {
      this._allEntities.splice(arrayIndex, 1);
    }

    // Remove from type tracking
    const type = entity.type || 'Unknown';
    if (this._entitiesByType.has(type)) {
      const typeArray = this._entitiesByType.get(type);
      const typeIndex = typeArray.indexOf(entity);
      if (typeIndex !== -1) {
        typeArray.splice(typeIndex, 1);
      }
      
      // Clean up empty type arrays
      if (typeArray.length === 0) {
        this._entitiesByType.delete(type);
      }
    }

    this._stats.removeCount++;

    return gridSuccess;
  }

  /**
   * Update entity position in spatial grid (call when entity moves)
   * @param {Entity} entity - Entity that moved
   * @returns {boolean} True if updated successfully
   * @example
   * myAnt.setPosition(newX, newY);
   * spatialGridManager.updateEntity(myAnt);
   */
  updateEntity(entity) {
    if (!entity) {
      return false;
    }

    this._stats.updateCount++;
    return this._grid.updateEntity(entity);
  }

  /**
   * Find all entities within a radius of a point
   * @param {number} x - Center X coordinate
   * @param {number} y - Center Y coordinate
   * @param {number} radius - Search radius in pixels
   * @param {Object} [options] - Query options
   * @param {string} [options.type] - Filter by entity type
   * @param {Function} [options.filter] - Custom filter function
   * @returns {Array<Entity>} Entities within radius
   * @example
   * // Find all ants within 100px
   * const nearbyAnts = spatialGridManager.getNearbyEntities(x, y, 100, { type: 'Ant' });
   */
  getNearbyEntities(x, y, radius, options = {}) {
    this._stats.queryCount++;

    // Build filter function
    let filter = options.filter || null;
    if (options.type) {
      const typeFilter = (entity) => entity.type === options.type;
      const originalFilter = filter; // Capture original to avoid circular reference
      filter = originalFilter ? 
        (entity) => typeFilter(entity) && originalFilter(entity) : 
        typeFilter;
    }

    return this._grid.queryRadius(x, y, radius, filter);
  }

  /**
   * Find entities in a rectangular area
   * @param {number} x - Top-left X coordinate
   * @param {number} y - Top-left Y coordinate  
   * @param {number} width - Rectangle width
   * @param {number} height - Rectangle height
   * @param {Object} [options] - Query options
   * @returns {Array<Entity>} Entities in rectangle
   * @example
   * // Selection box query
   * const selected = spatialGridManager.getEntitiesInRect(100, 100, 200, 150);
   */
  getEntitiesInRect(x, y, width, height, options = {}) {
    this._stats.queryCount++;

    let filter = options.filter || null;
    if (options.type) {
      const typeFilter = (entity) => entity.type === options.type;
      const originalFilter = filter; // Capture original to avoid circular reference
      filter = originalFilter ?
        (entity) => typeFilter(entity) && originalFilter(entity) :
        typeFilter;
    }

    return this._grid.queryRect(x, y, width, height, filter);
  }

  /**
   * Find the nearest entity to a point
   * @param {number} x - Center X coordinate
   * @param {number} y - Center Y coordinate
   * @param {number} [maxRadius=Infinity] - Maximum search radius
   * @param {Object} [options] - Query options
   * @returns {Entity|null} Nearest entity or null
   * @example
   * const nearest = spatialGridManager.findNearestEntity(mouseX, mouseY, 50);
   */
  findNearestEntity(x, y, maxRadius = Infinity, options = {}) {
    this._stats.queryCount++;

    let filter = options.filter || null;
    if (options.type) {
      const typeFilter = (entity) => entity.type === options.type;
      const originalFilter = filter; // Capture original to avoid circular reference
      filter = originalFilter ?
        (entity) => typeFilter(entity) && originalFilter(entity) :
        typeFilter;
    }

    return this._grid.findNearest(x, y, maxRadius, filter);
  }

  /**
   * Get all entities (backward compatible with array access)
   * @returns {Array<Entity>} All entities
   * @example
   * const all = spatialGridManager.getAllEntities();
   * for (const entity of all) { ... }
   */
  getAllEntities() {
    return this._allEntities;
  }

  /**
   * Get entities by type
   * @param {string} type - Entity type to filter
   * @returns {Array<Entity>} Entities of specified type
   * @example
   * const allAnts = spatialGridManager.getEntitiesByType('Ant');
   */
  getEntitiesByType(type) {
    return this._entitiesByType.get(type) || [];
  }

  /**
   * Get count of all entities
   * @returns {number} Total entity count
   * @example
   */
  getEntityCount() {
    return this._allEntities.length;
  }

  /**
   * Get count of entities by type
   * @param {string} type - Entity type
   * @returns {number} Count of entities of this type
   * @example
   */
  getEntityCountByType(type) {
    const entities = this._entitiesByType.get(type);
    return entities ? entities.length : 0;
  }

  /**
   * Check if entity is managed by this manager
   * @param {Entity} entity - Entity to check
   * @returns {boolean} True if entity is managed
   * @example
   * if (spatialGridManager.hasEntity(myAnt)) { ... }
   */
  hasEntity(entity) {
    return this._allEntities.includes(entity);
  }

  /**
   * Clear all entities
   * @example
   * spatialGridManager.clear();
   */
  clear() {
    this._grid.clear();
    this._allEntities = [];
    this._entitiesByType.clear();
    
    const globalObj = typeof globalThis !== 'undefined' ? globalThis : (typeof global !== 'undefined' ? global : window);
    if (globalObj && typeof globalObj.logNormal === 'function') {
    }
  }

  /**
   * Rebuild spatial grid from current entity array (for debugging/recovery)
   * @example
   * spatialGridManager.rebuildGrid();
   */
  rebuildGrid() {
    const globalObj = typeof globalThis !== 'undefined' ? globalThis : (typeof global !== 'undefined' ? global : window);
    if (globalObj && typeof globalObj.logNormal === 'function') {
    }

    this._grid.clear();
    
    for (const entity of this._allEntities) {
      this._grid.addEntity(entity);
    }

    if (globalObj && typeof globalObj.logNormal === 'function') {
    }
  }

  /**
   * Get manager statistics
   * @returns {Object} Statistics object
   * @example
   * const stats = spatialGridManager.getStats();
   */
  getStats() {
    const gridStats = this._grid.getStats();
    
    return {
      ...gridStats,
      totalEntities: this._allEntities.length,
      entityTypes: this._entitiesByType.size,
      operations: {
        adds: this._stats.addCount,
        removes: this._stats.removeCount,
        updates: this._stats.updateCount,
        queries: this._stats.queryCount
      }
    };
  }

  /**
   * Visualize the spatial grid (for debugging)
   * @param {Object} [options] - Visualization options
   * @example
   * spatialGridManager.visualize();
   */
  visualize(options = {}) {
    this._grid.visualize(options);
  }

  /**
   * Get the underlying SpatialGrid instance (for advanced usage)
   * @returns {SpatialGrid} The spatial grid
   * @example
   * const grid = spatialGridManager.getGrid();
   */
  getGrid() {
    return this._grid;
  }
}

// Console helpers for testing
if (typeof window !== 'undefined') {
  /**
   * Query nearby entities from console
   * @param {number} x - Center X
   * @param {number} y - Center Y
   * @param {number} radius - Search radius
   * @global
   */
  window.queryNearbyEntities = function(x, y, radius) {
    if (typeof spatialGridManager !== 'undefined' && spatialGridManager) {
      const results = spatialGridManager.getNearbyEntities(x, y, radius);
      console.table(results.map(e => ({
        id: e.id,
        type: e.type,
        x: e.getX().toFixed(1),
        y: e.getY().toFixed(1)
      })));
      return results;
    } else {
      return [];
    }
  };

  /**
   * Query nearby ants specifically
   * @param {number} x - Center X
   * @param {number} y - Center Y  
   * @param {number} radius - Search radius
   * @global
   */
  window.queryNearbyAnts = function(x, y, radius) {
    if (typeof spatialGridManager !== 'undefined' && spatialGridManager) {
      const results = spatialGridManager.getNearbyEntities(x, y, radius, { type: 'Ant' });
      console.table(results.map(e => ({
        id: e.id,
        x: e.getX().toFixed(1),
        y: e.getY().toFixed(1)
      })));
      return results;
    } else {
      return [];
    }
  };

  /**
   * Find nearest entity to mouse position
   * @global
   */
  window.findNearestToMouse = function(maxRadius = 100) {
    if (typeof spatialGridManager !== 'undefined' && spatialGridManager && typeof mouseX !== 'undefined') {
      const nearest = spatialGridManager.findNearestEntity(mouseX, mouseY, maxRadius);
      if (nearest) {
        // Found nearest entity
      } else {
        // No entity found
      }
      return nearest;
    } else {
      return null;
    }
  };
}

// Export for Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SpatialGridManager;
}