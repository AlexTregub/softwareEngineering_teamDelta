/**
 * EntityManager - Singleton manager for all MVC entities
 * 
 * Centralized tracking system for entities created through MVC factories.
 * Provides type-based queries, legacy compatibility, and efficient lookups.
 * 
 * @class EntityManager
 * @singleton
 * 
 * @example
 * // Get singleton instance
 * const manager = EntityManager.getInstance();
 * 
 * // Register entity controller
 * manager.register(antController, 'ant');
 * 
 * // Query entities
 * const allAnts = manager.getByType('ant');
 * const entity = manager.getById('entity_123');
 * const total = manager.getCount();
 * 
 * // Legacy compatibility
 * const ants = manager.getLegacyAnts(); // Returns all ant controllers
 */
class EntityManager {
  /**
   * Private constructor (singleton pattern)
   * @private
   */
  constructor() {
    if (EntityManager._instance) {
      return EntityManager._instance;
    }

    /**
     * Map of entity ID -> controller
     * @type {Map<string, Object>}
     * @private
     */
    this._entities = new Map();

    /**
     * Map of type -> Set of entity IDs
     * @type {Map<string, Set<string>>}
     * @private
     */
    this._typeIndex = new Map();

    /**
     * Auto-increment counter for generating unique IDs
     * @type {number}
     * @private
     */
    this._idCounter = 0;

    EntityManager._instance = this;
    
    // Make globally available
    if (typeof window !== 'undefined') {
      window.entityManager = this;
    }
  }

  /**
   * Get singleton instance of EntityManager
   * @returns {EntityManager} The singleton instance
   */
  static getInstance() {
    if (!EntityManager._instance) {
      EntityManager._instance = new EntityManager();
    }
    return EntityManager._instance;
  }

  /**
   * Register an entity controller with the manager
   * 
   * @param {Object} controller - The entity controller to register
   * @param {string} [type] - Entity type (auto-detected from controller.type if omitted)
   * @throws {Error} If controller is null/undefined
   * @returns {string} The entity ID
   * 
   * @example
   * manager.register(antController, 'ant');
   * manager.register(antController); // Auto-detects type from controller.type
   */
  register(controller, type = null) {
    if (!controller) {
      throw new Error('EntityManager.register(): controller cannot be null or undefined');
    }

    // Auto-detect type from controller if not provided
    const entityType = type || controller.type;
    if (!entityType) {
      throw new Error('EntityManager.register(): type must be provided or controller.type must exist');
    }

    // Assign unique ID if controller doesn't have one
    if (!controller.id) {
      controller.id = `entity_${Date.now()}_${this._generateUniqueId()}`;
    }

    // Check for duplicate ID
    if (this._entities.has(controller.id)) {
      console.warn(`EntityManager: Entity with ID ${controller.id} already registered. Skipping.`);
      return controller.id;
    }

    // Store controller
    this._entities.set(controller.id, controller);

    // Update type index
    if (!this._typeIndex.has(entityType)) {
      this._typeIndex.set(entityType, new Set());
    }
    this._typeIndex.get(entityType).add(controller.id);

    // Store type on controller for future queries
    controller.type = entityType;

    return controller.id;
  }

  /**
   * Unregister an entity by ID
   * 
   * @param {string} id - Entity ID to remove
   * @returns {boolean} True if entity was removed, false if not found
   * 
   * @example
   * const removed = manager.unregister('entity_123');
   */
  unregister(id) {
    const controller = this._entities.get(id);
    if (!controller) {
      return false;
    }

    // Remove from type index
    if (controller.type && this._typeIndex.has(controller.type)) {
      this._typeIndex.get(controller.type).delete(id);
      
      // Clean up empty type sets
      if (this._typeIndex.get(controller.type).size === 0) {
        this._typeIndex.delete(controller.type);
      }
    }

    // Remove from main storage
    this._entities.delete(id);
    
    return true;
  }

  /**
   * Get all registered entities
   * 
   * @returns {Array<Object>} Array of all entity controllers (copy)
   * 
   * @example
   * const allEntities = manager.getAll();
   */
  getAll() {
    return Array.from(this._entities.values());
  }

  /**
   * Get all entities of a specific type
   * 
   * @param {string} type - Entity type to filter by
   * @returns {Array<Object>} Array of matching entity controllers (copy)
   * 
   * @example
   * const ants = manager.getByType('ant');
   * const buildings = manager.getByType('building');
   */
  getByType(type) {
    if (!this._typeIndex.has(type)) {
      return [];
    }

    const ids = this._typeIndex.get(type);
    const entities = [];
    
    for (const id of ids) {
      const entity = this._entities.get(id);
      if (entity) {
        entities.push(entity);
      }
    }

    return entities;
  }

  /**
   * Get entity by ID
   * 
   * @param {string} id - Entity ID to find
   * @returns {Object|null} Entity controller or null if not found
   * 
   * @example
   * const entity = manager.getById('entity_123');
   */
  getById(id) {
    return this._entities.get(id) || null;
  }

  /**
   * Clear all registered entities
   * 
   * @example
   * manager.clear(); // Remove all entities
   */
  clear() {
    this._entities.clear();
    this._typeIndex.clear();
  }

  /**
   * Get count of registered entities
   * 
   * @param {string} [type] - Optional type to count specific entity type
   * @returns {number} Total count or count of specific type
   * 
   * @example
   * const total = manager.getCount(); // All entities
   * const antCount = manager.getCount('ant'); // Only ants
   */
  getCount(type = null) {
    if (type === null) {
      return this._entities.size;
    }

    if (!this._typeIndex.has(type)) {
      return 0;
    }

    return this._typeIndex.get(type).size;
  }

  /**
   * Get all ant controllers (legacy compatibility)
   * 
   * Provides backward compatibility with global window.ants array.
   * Returns all entities with type 'ant'.
   * 
   * @returns {Array<Object>} Array of ant controllers
   * 
   * @example
   * const ants = manager.getLegacyAnts();
   * // Same as: manager.getByType('ant')
   */
  getLegacyAnts() {
    return this.getByType('ant');
  }

  /**
   * Generate unique ID suffix
   * @private
   * @returns {string} Unique ID string
   */
  _generateUniqueId() {
    this._idCounter++;
    return Math.random().toString(36).substr(2, 9) + this._idCounter;
  }

  /**
   * Get debug statistics
   * @returns {Object} Statistics about registered entities
   */
  getStats() {
    const typeStats = {};
    for (const [type, ids] of this._typeIndex) {
      typeStats[type] = ids.size;
    }

    return {
      total: this._entities.size,
      types: typeStats,
      typeCount: this._typeIndex.size
    };
  }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EntityManager;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
  window.EntityManager = EntityManager;
}
