/**
 * WorldService - Unified world management service
 * 
 * Consolidates MapManager, SpatialGridManager, and TileInteractionManager into
 * a single service with clear API for map data, spatial queries, and tile interactions.
 * 
 * Uses delegation pattern - wraps existing systems without rewriting them.
 * 
 * @class WorldService
 * @example
 * const worldService = new WorldService(mapManager, spatialGridManager);
 * const tile = worldService.getTileAt(5, 10);
 * const nearby = worldService.getNearbyEntities(100, 200, 50);
 * const entitiesOnTile = worldService.getEntitiesOnTile(5, 10);
 */

const TILE_SIZE = 32;

class WorldService {
  /**
   * Create WorldService with dependency injection
   * 
   * @param {MapManager} mapManager - Map/terrain manager
   * @param {SpatialGridManager} spatialGridManager - Spatial partitioning system
   * @throws {Error} If mapManager or spatialGridManager is null/undefined
   */
  constructor(mapManager, spatialGridManager) {
    if (!mapManager) {
      throw new Error('WorldService requires MapManager');
    }
    if (!spatialGridManager) {
      throw new Error('WorldService requires SpatialGridManager');
    }
    
    this._mapManager = mapManager;
    this._spatialGrid = spatialGridManager;
  }
  
  // ============================================================================
  // Map API (delegates to MapManager)
  // ============================================================================
  
  /**
   * Get tile at grid coordinates (tile-based, not world pixels)
   * 
   * @param {number} x - Grid X coordinate (tile column)
   * @param {number} y - Grid Y coordinate (tile row)
   * @returns {Object|null} Tile object or null if out of bounds
   * 
   * @example
   * const tile = worldService.getTileAt(5, 10);
   * if (tile) console.log(tile.type, tile.material);
   */
  getTileAt(x, y) {
    const tile = this._mapManager.getTileAtGridCoords(x, y);
    return tile || null;
  }
  
  /**
   * Get tile at world position (pixel coordinates)
   * 
   * @param {number} worldX - World X coordinate (pixels)
   * @param {number} worldY - World Y coordinate (pixels)
   * @returns {Object|null} Tile object or null if out of bounds
   * 
   * @example
   * const tile = worldService.getTileAtWorldPos(160, 320);
   */
  getTileAtWorldPos(worldX, worldY) {
    const tile = this._mapManager.getTileAtPosition(worldX, worldY);
    return tile || null;
  }
  
  /**
   * Get tile material at world position
   * 
   * @param {number} worldX - World X coordinate (pixels)
   * @param {number} worldY - World Y coordinate (pixels)
   * @returns {string|null} Material name or null if no tile
   * 
   * @example
   * const material = worldService.getTileMaterial(160, 320); // 'grass'
   */
  getTileMaterial(worldX, worldY) {
    const material = this._mapManager.getTileMaterial(worldX, worldY);
    return material || null;
  }
  
  /**
   * Load map from level data
   * 
   * @param {Object} levelData - Level data with terrain and entities
   * @param {string} mapId - Unique map identifier
   * @param {boolean} setActive - Whether to set as active map (default: false)
   * @returns {boolean} True if loaded successfully
   * 
   * @example
   * worldService.loadMap(levelData, 'level-001', true);
   */
  loadMap(levelData, mapId, setActive = false) {
    return this._mapManager.loadLevel(levelData, mapId, setActive);
  }
  
  /**
   * Get currently active map
   * 
   * @returns {Object|null} Active map object or null if none
   * 
   * @example
   * const map = worldService.getActiveMap();
   * console.log(map.id, map.terrain);
   */
  getActiveMap() {
    return this._mapManager.getActiveMap();
  }
  
  /**
   * Set active map by ID
   * 
   * @param {string} mapId - Map identifier to activate
   * @returns {boolean} True if set successfully
   * 
   * @example
   * worldService.setActiveMap('level-002');
   */
  setActiveMap(mapId) {
    return this._mapManager.setActiveMap(mapId);
  }
  
  // ============================================================================
  // Spatial API (delegates to SpatialGridManager)
  // ============================================================================
  
  /**
   * Get entities within radius of point
   * 
   * @param {number} x - Center X coordinate (world pixels)
   * @param {number} y - Center Y coordinate (world pixels)
   * @param {number} radius - Search radius (pixels)
   * @param {Object} options - Filter options (type, faction, etc.)
   * @returns {Array} Array of entities within radius
   * @throws {Error} If radius is negative
   * 
   * @example
   * const nearby = worldService.getNearbyEntities(100, 200, 50);
   * const ants = worldService.getNearbyEntities(100, 200, 50, { type: 'Ant' });
   */
  getNearbyEntities(x, y, radius, options = {}) {
    if (radius < 0) {
      throw new Error('Radius cannot be negative');
    }
    
    return this._spatialGrid.getNearbyEntities(x, y, radius, options);
  }
  
  /**
   * Get entities within rectangle
   * 
   * @param {number} x - Rectangle X (top-left, world pixels)
   * @param {number} y - Rectangle Y (top-left, world pixels)
   * @param {number} width - Rectangle width (pixels)
   * @param {number} height - Rectangle height (pixels)
   * @param {Object} options - Filter options (type, faction, etc.)
   * @returns {Array} Array of entities in rectangle
   * 
   * @example
   * const entities = worldService.getEntitiesInRect(0, 0, 100, 100);
   */
  getEntitiesInRect(x, y, width, height, options = {}) {
    return this._spatialGrid.getEntitiesInRect(x, y, width, height, options);
  }
  
  /**
   * Find nearest entity to point
   * 
   * @param {number} x - Point X (world pixels)
   * @param {number} y - Point Y (world pixels)
   * @param {number} maxRadius - Maximum search radius (default: Infinity)
   * @param {Object} options - Filter options (type, faction, etc.)
   * @returns {Object|null} Nearest entity or null if none found
   * 
   * @example
   * const nearest = worldService.findNearestEntity(100, 200, 100, { type: 'Resource' });
   */
  findNearestEntity(x, y, maxRadius = Infinity, options = {}) {
    return this._spatialGrid.findNearestEntity(x, y, maxRadius, options);
  }
  
  /**
   * Register entity with spatial grid
   * 
   * @param {Object} entity - Entity to register
   * @throws {Error} If entity is null or has no position
   * 
   * @example
   * worldService.addEntity(ant);
   */
  addEntity(entity) {
    if (!entity) {
      throw new Error('Entity cannot be null');
    }
    if (!entity.position) {
      throw new Error('Entity must have position property');
    }
    
    this._spatialGrid.addEntity(entity);
  }
  
  /**
   * Unregister entity from spatial grid
   * 
   * @param {Object} entity - Entity to unregister
   * 
   * @example
   * worldService.removeEntity(ant);
   */
  removeEntity(entity) {
    this._spatialGrid.removeEntity(entity);
  }
  
  /**
   * Get all registered entities
   * 
   * @returns {Array} All entities in spatial grid
   * 
   * @example
   * const all = worldService.getAllEntities();
   */
  getAllEntities() {
    return this._spatialGrid.getAllEntities();
  }
  
  /**
   * Get entities by type
   * 
   * @param {string} type - Entity type ('Ant', 'Building', 'Resource')
   * @returns {Array} Entities of specified type
   * 
   * @example
   * const ants = worldService.getEntitiesByType('Ant');
   */
  getEntitiesByType(type) {
    return this._spatialGrid.getEntitiesByType(type);
  }
  
  /**
   * Get total entity count
   * 
   * @returns {number} Number of registered entities
   * 
   * @example
   * const count = worldService.getEntityCount();
   */
  getEntityCount() {
    return this._spatialGrid.getEntityCount();
  }
  
  // ============================================================================
  // Combined Queries (NEW - use both systems together)
  // ============================================================================
  
  /**
   * Get entities on specific tile (combined tile + spatial query)
   * 
   * @param {number} gridX - Tile grid X coordinate
   * @param {number} gridY - Tile grid Y coordinate
   * @param {Object} options - Filter options (type, faction, etc.)
   * @returns {Array} Entities on tile (within TILE_SIZE/2 radius of tile center)
   * 
   * @example
   * const entitiesOnTile = worldService.getEntitiesOnTile(5, 10);
   * const antsOnTile = worldService.getEntitiesOnTile(5, 10, { type: 'Ant' });
   */
  getEntitiesOnTile(gridX, gridY, options = {}) {
    // Get tile at grid coordinates
    const tile = this.getTileAt(gridX, gridY);
    if (!tile) {
      return [];
    }
    
    // Query entities near tile center (within TILE_SIZE/2)
    const centerX = tile.worldX || (gridX * TILE_SIZE);
    const centerY = tile.worldY || (gridY * TILE_SIZE);
    const radius = TILE_SIZE / 2;
    
    return this.getNearbyEntities(centerX, centerY, radius, options);
  }
  
  /**
   * Get comprehensive tile information (tile + entities)
   * 
   * @param {number} gridX - Tile grid X coordinate
   * @param {number} gridY - Tile grid Y coordinate
   * @returns {Object|null} Object with tile, entities, entityCount or null if no tile
   * 
   * @example
   * const info = worldService.getTileInfo(5, 10);
   * console.log(info.tile.material, info.entityCount);
   */
  getTileInfo(gridX, gridY) {
    const tile = this.getTileAt(gridX, gridY);
    if (!tile) {
      return null;
    }
    
    const entities = this.getEntitiesOnTile(gridX, gridY);
    
    return {
      tile: tile,
      entities: entities,
      entityCount: entities.length
    };
  }
}

// Export for Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WorldService;
}

// Export for browser (game)
if (typeof window !== 'undefined') {
  window.WorldService = WorldService;
}
