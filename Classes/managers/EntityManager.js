/**
 * @fileoverview EntityManager - Central registry and coordinator for all ant entities
 * Manages ant lifecycle, tracks IDs, and coordinates with AntFactory for creation.
 * 
 * @author Software Engineering Team Delta
 * @version 1.0.0
 */

/**
 * Manages all ant entities in the game.
 * - Tracks all ant IDs in a central registry
 * - Coordinates with AntFactory for ant creation
 * - Provides lookup and query methods
 * - Manages entity lifecycle (spawn, update, render, destroy)
 * 
 * @class EntityManager
 * @example
 * const entityManager = new EntityManager();
 * const ant = entityManager.spawnAnt('Scout', 100, 100, 'player');
 * const allAnts = entityManager.getAllAnts();
 */
class EntityManager {
  /**
   * Creates a new EntityManager instance.
   * Integrates AntFactory for entity creation.
   */
  constructor() {
    // Central registry: Map of ant ID -> ant object
    this._registry = new Map();
    
    // Selected entity tracking
    this._selectedEntity = null;
    
    // Factory integration (injected or uses global)
    this._factory = typeof AntFactory !== 'undefined' ? AntFactory : null;
    
    // Statistics
    this._stats = {
      totalSpawned: 0,
      totalDestroyed: 0,
      activeCount: 0
    };
  }

  // --- Factory Integration ---

  /**
   * Set custom factory (for testing or different entity types)
   * @param {Object} factory - Factory instance with create methods
   */
  setFactory(factory) {
    this._factory = factory;
  }

  /**
   * Get the current factory
   * @returns {Object} Factory instance
   */
  getFactory() {
    return this._factory;
  }

  // --- Spawn Methods (Delegate to Factory) ---

  /**
   * Spawn a single ant using the factory
   * @param {string} jobName - Job type (Scout, Warrior, etc.)
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} faction - Faction (player, enemy, neutral)
   * @param {Object} options - Additional options
   * @returns {Object} Spawned ant object
   */
  spawnAnt(jobName, x, y, faction = "player", options = {}) {
    if (!this._factory) {
      console.error('EntityManager: No factory available');
      return null;
    }

    const ant = this._factory.createAnt(jobName, x, y, faction, options);
    this._registerEntity(ant);
    return ant;
  }

  /**
   * Spawn multiple ants in batch
   * @param {number} count - Number to spawn
   * @param {string} faction - Faction
   * @param {number} x - Center X (optional)
   * @param {number} y - Center Y (optional)
   * @returns {Array} Array of spawned ants
   */
  spawnAnts(count, faction = "player", x = null, y = null) {
    if (!this._factory) {
      console.error('EntityManager: No factory available');
      return [];
    }

    const ants = this._factory.spawnAnts(count, faction, x, y);
    ants.forEach(ant => this._registerEntity(ant));
    return ants;
  }

  /**
   * Spawn a Queen ant
   * @param {number} x - X position (optional)
   * @param {number} y - Y position (optional)
   * @param {string} faction - Faction
   * @returns {Object} Queen ant
   */
  spawnQueen(x = null, y = null, faction = "player") {
    if (!this._factory) {
      console.error('EntityManager: No factory available');
      return null;
    }

    const queen = this._factory.createQueen(x, y, faction);
    this._registerEntity(queen);
    return queen;
  }

  /**
   * Spawn a Boss ant
   * @param {string} bossType - Boss type (Spider, etc.)
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} faction - Faction
   * @returns {Object} Boss ant
   */
  spawnBoss(bossType, x, y, faction = "enemy") {
    if (!this._factory) {
      console.error('EntityManager: No factory available');
      return null;
    }

    const boss = this._factory.createBoss(bossType, x, y, faction);
    this._registerEntity(boss);
    return boss;
  }

  // --- Registry Management ---

  /**
   * Register an entity in the central registry
   * @param {Object} entity - Ant entity to register
   * @private
   */
  _registerEntity(entity) {
    if (!entity || !entity.id) {
      console.warn('EntityManager: Cannot register entity without ID');
      return;
    }

    this._registry.set(entity.id, entity);
    this._stats.totalSpawned++;
    this._stats.activeCount++;
  }

  /**
   * Unregister an entity from the registry
   * @param {string} id - Entity ID
   * @private
   */
  _unregisterEntity(id) {
    if (this._registry.has(id)) {
      this._registry.delete(id);
      this._stats.totalDestroyed++;
      this._stats.activeCount--;
    }
  }

  /**
   * Get entity by ID
   * @param {string} id - Entity ID
   * @returns {Object|null} Entity or null if not found
   */
  getEntityById(id) {
    return this._registry.get(id) || null;
  }

  /**
   * Check if entity exists
   * @param {string} id - Entity ID
   * @returns {boolean} True if entity exists
   */
  hasEntity(id) {
    return this._registry.has(id);
  }

  /**
   * Get all registered entities
   * @returns {Array} Array of all entities
   */
  getAllEntities() {
    return Array.from(this._registry.values());
  }

  /**
   * Get all ant IDs
   * @returns {Array} Array of all entity IDs
   */
  getAllEntityIds() {
    return Array.from(this._registry.keys());
  }

  /**
   * Get count of active entities
   * @returns {number} Active entity count
   */
  getActiveCount() {
    return this._stats.activeCount;
  }

  // --- Query Methods ---

  /**
   * Get entities by faction
   * @param {string} faction - Faction name
   * @returns {Array} Entities matching faction
   */
  getEntitiesByFaction(faction) {
    return this.getAllEntities().filter(entity => entity.faction === faction);
  }

  /**
   * Get entities by job
   * @param {string} jobName - Job name
   * @returns {Array} Entities matching job
   */
  getEntitiesByJob(jobName) {
    return this.getAllEntities().filter(entity => entity.jobName === jobName);
  }

  /**
   * Get entities by type
   * @param {string} type - Entity type
   * @returns {Array} Entities matching type
   */
  getEntitiesByType(type) {
    return this.getAllEntities().filter(entity => entity.type === type);
  }

  /**
   * Find entities within radius
   * @param {number} x - Center X
   * @param {number} y - Center Y
   * @param {number} radius - Search radius
   * @returns {Array} Entities within radius
   */
  getEntitiesInRadius(x, y, radius) {
    const radiusSq = radius * radius;
    return this.getAllEntities().filter(entity => {
      const pos = entity.getPosition();
      const dx = pos.x - x;
      const dy = pos.y - y;
      return (dx * dx + dy * dy) <= radiusSq;
    });
  }

  // --- Selection Management ---

  /**
   * Select an entity
   * @param {Object} entity - Entity to select
   */
  selectEntity(entity) {
    if (this._selectedEntity) {
      this._selectedEntity.setSelected(false);
    }
    this._selectedEntity = entity;
    if (entity) {
      entity.setSelected(true);
    }
  }

  /**
   * Get selected entity
   * @returns {Object|null} Selected entity or null
   */
  getSelectedEntity() {
    return this._selectedEntity;
  }

  /**
   * Clear selection
   */
  clearSelection() {
    if (this._selectedEntity) {
      this._selectedEntity.setSelected(false);
      this._selectedEntity = null;
    }
  }

  /**
   * Check if entity is selected
   * @returns {boolean} True if entity selected
   */
  hasSelection() {
    return this._selectedEntity !== null;
  }

  /**
   * Handle entity click logic
   * - If entity selected, move it
   * - Otherwise, select entity under mouse
   */
  handleEntityClick() {
    if (this._selectedEntity) {
      // Move selected entity
      this._selectedEntity.moveToLocation(mouseX, mouseY);
    } else {
      // Try to select entity under mouse
      const entities = this.getAllEntities();
      for (const entity of entities) {
        if (entity.isMouseOver && entity.isMouseOver()) {
          this.selectEntity(entity);
          break;
        }
      }
    }
  }

  // --- Lifecycle Management ---

  /**
   * Update all entities
   * Removes inactive entities from registry
   */
  updateAll() {
    const entities = this.getAllEntities();
    for (let i = entities.length - 1; i >= 0; i--) {
      const entity = entities[i];
      if (entity.isActive) {
        if (typeof entity.update === 'function') {
          entity.update();
        }
      } else {
        // Remove inactive entity
        this._unregisterEntity(entity.id);
      }
    }
  }

  /**
   * Render all entities
   */
  renderAll() {
    const entities = this.getAllEntities();
    for (const entity of entities) {
      if (entity.isActive && typeof entity.render === 'function') {
        entity.render();
      }
    }
  }

  /**
   * Destroy entity by ID
   * @param {string} id - Entity ID
   */
  destroyEntity(id) {
    const entity = this.getEntityById(id);
    if (entity) {
      if (typeof entity.die === 'function') {
        entity.die();
      }
      this._unregisterEntity(id);
    }
  }

  /**
   * Clear all entities
   */
  clearAll() {
    const entities = this.getAllEntities();
    entities.forEach(entity => {
      if (typeof entity.die === 'function') {
        entity.die();
      }
    });
    this._registry.clear();
    this._selectedEntity = null;
    this._stats.activeCount = 0;
  }

  // --- Statistics ---

  /**
   * Get manager statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      totalSpawned: this._stats.totalSpawned,
      totalDestroyed: this._stats.totalDestroyed,
      activeCount: this._stats.activeCount,
      registrySize: this._registry.size
    };
  }

  /**
   * Get debug information
   * @returns {Object} Debug info
   */
  getDebugInfo() {
    return {
      hasSelectedEntity: this._selectedEntity !== null,
      selectedEntityId: this._selectedEntity ? this._selectedEntity.id : null,
      stats: this.getStats(),
      factionCounts: this._getFactionCounts(),
      jobCounts: this._getJobCounts()
    };
  }

  /**
   * Get count by faction
   * @returns {Object} Faction counts
   * @private
   */
  _getFactionCounts() {
    const counts = {};
    this.getAllEntities().forEach(entity => {
      const faction = entity.faction || 'unknown';
      counts[faction] = (counts[faction] || 0) + 1;
    });
    return counts;
  }

  /**
   * Get count by job
   * @returns {Object} Job counts
   * @private
   */
  _getJobCounts() {
    const counts = {};
    this.getAllEntities().forEach(entity => {
      const job = entity.jobName || 'unknown';
      counts[job] = (counts[job] || 0) + 1;
    });
    return counts;
  }

  // --- Legacy Compatibility (AntManager interface) ---

  /**
   * @deprecated Use getAllEntities() instead
   */
  getAllAnts() {
    return this.getAllEntities();
  }

  /**
   * @deprecated Use spawnAnt() instead
   */
  createAnt(jobName, x, y, faction, options) {
    return this.spawnAnt(jobName, x, y, faction, options);
  }

  /**
   * @deprecated Use getSelectedEntity() instead
   */
  getSelectedAnt() {
    return this.getSelectedEntity();
  }

  /**
   * @deprecated Use selectEntity() instead
   */
  setSelectedAnt(entity) {
    this.selectEntity(entity);
  }

  /**
   * @deprecated Use handleEntityClick() instead
   */
  handleAntClick() {
    this.handleEntityClick();
  }
}

// Export for Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EntityManager;
}

// Browser global
if (typeof window !== 'undefined') {
  window.EntityManager = EntityManager;
}
