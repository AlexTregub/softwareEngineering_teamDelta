/**
 * @file EntityService.js
 * @description Unified entity management service (Phase 6.1 - Manager Elimination)
 * 
 * Consolidates:
 * - AntManager (ant registry, creation, queries)
 * - BuildingManager (building registry, spawn queue)
 * - ResourceSystemManager (resource spawning, detection)
 * 
 * Into one service with unified registry and consistent API.
 * 
 * @author Software Engineering Team Delta - AI Assistant
 * @version 1.0.0
 */

/**
 * EntityService - Unified entity management
 * 
 * Responsibilities:
 * - Spawn entities of any type (Ant, Building, Resource)
 * - Maintain unified entity registry (Map<ID, Entity>)
 * - Query entities by ID, type, faction, custom filters
 * - Update all entities each frame
 * - Destroy entities and clean up resources
 * 
 * Design:
 * - Factory pattern: Delegates creation to injected factories
 * - Dependency injection: Receives factories via constructor
 * - O(1) ID lookup via Map
 * - Sequential ID generation (never reuse)
 * 
 * @class EntityService
 */
class EntityService {
  /**
   * Constructor
   * @param {Object} antFactory - AntFactory instance for ant creation
   * @param {Object} buildingFactory - BuildingFactory instance for building creation
   * @param {Object} resourceFactory - ResourceFactory instance for resource creation
   */
  constructor(antFactory, buildingFactory, resourceFactory) {
    // Unified entity registry (ID → Entity)
    this._entities = new Map();
    
    // Sequential ID generation (never reuse after destroy)
    this._nextId = 0;
    
    // Inject factories (dependency injection)
    this._antFactory = antFactory;
    this._buildingFactory = buildingFactory;
    this._resourceFactory = resourceFactory;
    
    // Optional dependencies (set via setter)
    this._spatialGrid = null;
  }
  
  // ========================================
  // Dependency Injection
  // ========================================
  
  /**
   * Set spatial grid for entity registration
   * @param {Object} spatialGrid - SpatialGridManager instance
   */
  setSpatialGrid(spatialGrid) {
    this._spatialGrid = spatialGrid;
  }
  
  // ========================================
  // Spawn API - Unified Entity Creation
  // ========================================
  
  /**
   * Spawn entity of specified type
   * 
   * Algorithm:
   * 1. Generate unique ID
   * 2. Delegate to appropriate factory
   * 3. Assign ID to entity
   * 4. Register in unified registry
   * 5. Register with spatial grid (if available)
   * 6. Return entity
   * 
   * @param {string} type - Entity type ('Ant', 'Building', 'Resource')
   * @param {Object} options - Creation options (x, y, jobName, faction, etc.)
   * @returns {Object} Created entity controller
   * @throws {Error} If unknown entity type
   */
  spawn(type, options = {}) {
    // 1. Generate unique ID
    const id = this._nextId++;
    
    // Extract common options
    const { x, y, jobName, buildingType, resourceType, faction = 'neutral', amount } = options;
    
    // 2. Delegate to appropriate factory with correct API
    let entity;
    switch(type) {
      case 'Ant':
        // AntFactory: instance methods (createScout, createWarrior, etc.) or spawnAnts()
        if (jobName) {
          const methodName = `create${jobName}`;
          if (typeof this._antFactory[methodName] === 'function') {
            entity = this._antFactory[methodName](x, y, faction);
          } else {
            throw new Error(`Unknown ant job: ${jobName}`);
          }
        } else {
          // Generic ant via spawnAnts(count, faction, x, y)
          entity = this._antFactory.spawnAnts(1, faction, x, y)[0];
        }
        break;
        
      case 'Building':
        // BuildingFactory: static methods (createAntCone, createAntHill, createHiveSource)
        if (!buildingType) {
          throw new Error('buildingType required for Building spawn');
        }
        const buildingMethodName = `create${buildingType}`;
        if (typeof this._buildingFactory[buildingMethodName] === 'function') {
          entity = this._buildingFactory[buildingMethodName](x, y, faction);
        } else {
          throw new Error(`Unknown building type: ${buildingType}`);
        }
        break;
        
      case 'Resource':
        // ResourceFactory: static method createResource(type, x, y, options)
        if (!resourceType) {
          throw new Error('resourceType required for Resource spawn');
        }
        entity = this._resourceFactory.createResource(resourceType, x, y, { amount });
        break;
        
      default:
        throw new Error(`Unknown entity type: ${type}`);
    }
    
    if (!entity) {
      throw new Error(`Failed to create ${type} entity`);
    }
    
    // 3. Assign ID to entity
    entity._id = id;
    
    // 4. Register in unified registry
    this._entities.set(id, entity);
    
    // 5. Register with spatial grid (if available)
    if (this._spatialGrid) {
      this._spatialGrid.addEntity(entity);
    }
    
    // 6. Return entity
    return entity;
  }
  
  // ========================================
  // Query API - Entity Lookups
  // ========================================
  
  /**
   * Get entity by ID (O(1) lookup)
   * @param {number} id - Entity ID
   * @returns {Object|undefined} Entity controller or undefined if not found
   */
  getById(id) {
    return this._entities.get(id);
  }
  
  /**
   * Get all entities by type
   * @param {string} type - Entity type ('Ant', 'Building', 'Resource')
   * @returns {Array<Object>} Array of matching entities
   */
  getByType(type) {
    return Array.from(this._entities.values()).filter(entity => entity.type === type);
  }
  
  /**
   * Get all entities by faction
   * @param {string} faction - Faction ('player', 'enemy', 'neutral')
   * @returns {Array<Object>} Array of matching entities
   */
  getByFaction(faction) {
    return Array.from(this._entities.values()).filter(entity => entity.faction === faction);
  }
  
  /**
   * Get all entities as array
   * @returns {Array<Object>} All entities
   */
  getAllEntities() {
    return Array.from(this._entities.values());
  }
  
  /**
   * Get entity count
   * @returns {number} Number of entities in registry
   */
  getCount() {
    return this._entities.size;
  }
  
  /**
   * Query entities with custom filter function
   * 
   * Example:
   * ```javascript
   * // Get low-health ants
   * const lowHealthAnts = service.query(e => e.type === 'Ant' && e.health < 50);
   * 
   * // Get player buildings
   * const playerBuildings = service.query(e => e.type === 'Building' && e.faction === 'player');
   * ```
   * 
   * @param {Function} filterFn - Filter function (entity) => boolean
   * @returns {Array<Object>} Array of matching entities
   */
  query(filterFn) {
    return Array.from(this._entities.values()).filter(filterFn);
  }
  
  // ========================================
  // Lifecycle - Update & Destroy
  // ========================================
  
  /**
   * Update all entities (called each frame)
   * 
   * Algorithm:
   * 1. Iterate registry (handle mutations during iteration)
   * 2. Skip inactive entities
   * 3. Call update() on each active entity
   * 
   * @param {number} deltaTime - Time since last update (ms)
   */
  update(deltaTime) {
    // Convert to array to handle mutations during iteration
    const entities = Array.from(this._entities.values());
    
    for (const entity of entities) {
      // Skip inactive entities
      if (entity.isActive === false) {
        continue;
      }
      
      // Update entity (if it still exists - may have been destroyed)
      if (this._entities.has(entity._id)) {
        entity.update(deltaTime);
      }
    }
  }
  
  /**
   * Destroy entity by ID
   * 
   * Algorithm:
   * 1. Check if entity exists
   * 2. Call entity.destroy() (cleanup)
   * 3. Unregister from spatial grid
   * 4. Remove from registry
   * 
   * @param {number} id - Entity ID
   * @returns {boolean} True if destroyed, false if not found
   */
  destroy(id) {
    const entity = this._entities.get(id);
    
    // Entity not found
    if (!entity) {
      return false;
    }
    
    // Call entity cleanup
    if (typeof entity.destroy === 'function') {
      entity.destroy();
    }
    
    // Unregister from spatial grid
    if (this._spatialGrid) {
      this._spatialGrid.removeEntity(entity);
    }
    
    // Remove from registry
    this._entities.delete(id);
    
    return true;
  }
  
  /**
   * Clear all entities
   * 
   * Algorithm:
   * 1. Destroy each entity (cleanup)
   * 2. Clear registry
   * 3. Keep ID counter (never reuse IDs)
   */
  clearAll() {
    // Destroy each entity
    for (const entity of this._entities.values()) {
      if (typeof entity.destroy === 'function') {
        entity.destroy();
      }
      
      if (this._spatialGrid) {
        this._spatialGrid.removeEntity(entity);
      }
    }
    
    // Clear registry
    this._entities.clear();
    
    // Note: Do NOT reset _nextId (never reuse IDs)
  }
}

// ========================================
// Module Exports
// ========================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EntityService;
}

if (typeof window !== 'undefined') {
  window.EntityService = EntityService;
}
