/**
 * @fileoverview EntityDebugManager - Global manager for entity debugging visualization
 * Integrates with existing backtick (`) debug toggle system to provide unified debugging
 * controls across all entities in the game world.
 * 
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 */

/**
 * Global manager for entity debugging visualization.
 * Provides centralized control over all entity debuggers and integrates 
 * with the existing debug toggle system.
 */
class EntityDebugManager {
  /**
   * Creates a new EntityDebugManager instance.
   */
  constructor() {
    /** @type {Set<Entity>} Registered entities with debuggers */
    this.entities = new Set();
    
    /** @type {boolean} Global debug state */
    this.isDebugEnabled = false;
    
    /** @type {boolean} Whether event listeners are attached */
    this._listenersAttached = false;
    
    /** @type {Object} Debug configuration options */
    this.config = {
      toggleKey: '`',           // Backtick key for toggle
      modifierKeys: {
        showAll: 'Shift',       // Shift+` to show all entity debuggers
        hideAll: 'Alt',         // Alt+` to hide all entity debuggers  
        cycleSelected: 'Ctrl'   // Ctrl+` to cycle through selected entities
      },
      maxVisibleDebuggers: 50,  // Increased limit for better debugging
      forceShowAllLimit: 200,   // Maximum entities when forcing "show all"
      autoHideDelay: 5000,      // Auto-hide after 5 seconds of inactivity
      debugColors: [
        '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
        '#FF00FF', '#00FFFF', '#FF8000', '#8000FF',
        '#FF4444', '#44FF44', '#4444FF', '#FFFF44',
        '#FF44FF', '#44FFFF', '#FFB044', '#B044FF'
      ]
    };
    
    /** @type {number} Color index for next debugger */
    this._colorIndex = 0;
    
    /** @type {Entity|null} Currently focused entity */
    this._focusedEntity = null;
    
    /** @type {number} Timestamp of last debug activity */
    this._lastActivity = Date.now();
    
    this._setupEventListeners();
  }

  // --- Event Handling ---

  /**
   * Sets up keyboard event listeners for debug controls.
   * Integrates with existing debug toggle system.
   * @private
   */
  _setupEventListeners() {
    if (this._listenersAttached) return;
    
    // Integrate with existing debug system
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this._handleKeyDown.bind(this));
      this._listenersAttached = true;
      
      console.log('EntityDebugManager: Event listeners attached');
    }
  }

  /**
   * Handles keydown events for debug controls.
   * @param {KeyboardEvent} e - Keyboard event
   * @private
   */
  _handleKeyDown(e) {
    // Only handle backtick key
    if (e.key !== '`' && e.key !== '~') return;
    
    this._lastActivity = Date.now();
    
    // Handle modifier combinations
    if (e.shiftKey) {
      // Shift+` - Show all entity debuggers (force override limits)
      this.showAllDebuggers(true);
      e.preventDefault();
      return;
    }
    
    if (e.altKey) {
      // Alt+` - Hide all entity debuggers
      this.hideAllDebuggers();
      e.preventDefault();
      return;
    }
    
    if (e.ctrlKey || e.metaKey) {
      // Ctrl+` - Cycle through selected entities
      this.cycleSelectedEntityDebuggers();
      e.preventDefault();
      return;
    }
    
    // Regular ` - Toggle debug state
    this.toggleGlobalDebug();
    e.preventDefault();
  }

  // --- Debug Limit Management ---

  /**
   * Sets the maximum number of visible debuggers.
   * @param {number} limit - New limit (0 = no limit)
   */
  setDebugLimit(limit) {
    const oldLimit = this.config.maxVisibleDebuggers;
    this.config.maxVisibleDebuggers = Math.max(1, limit);
    
    console.log(`EntityDebugManager: Debug limit changed from ${oldLimit} to ${this.config.maxVisibleDebuggers}`);
    
    // If currently showing debuggers, refresh with new limit
    if (this.isDebugEnabled) {
      this._refreshVisibleDebuggers();
    }
  }

  /**
   * Gets the current debug limit.
   * @returns {number} Current maximum visible debuggers
   */
  getDebugLimit() {
    return this.config.maxVisibleDebuggers;
  }

  /**
   * Refreshes currently visible debuggers according to current limit.
   * @private
   */
  _refreshVisibleDebuggers() {
    const activeCount = this.getActiveDebugEntities().length;
    if (activeCount > this.config.maxVisibleDebuggers) {
      // Too many active, show only the limit
      this.showAllDebuggers(false);
    }
  }

  // --- Entity Management ---

  /**
   * Registers an entity with the debug manager.
   * @param {Entity} entity - Entity to register
   */
  registerEntity(entity) {
    if (!entity || !entity.getDebugger) {
      console.warn('EntityDebugManager: Invalid entity for registration');
      return;
    }
    
    this.entities.add(entity);
    
    // Assign unique debug color
    const entityDebugger = entity.getDebugger();
    if (entityDebugger) {
      const color = this.config.debugColors[this._colorIndex % this.config.debugColors.length];
      entityDebugger.config.borderColor = color;
      entityDebugger.config.fillColor = color.replace(')', ', 0.1)').replace('#', 'rgba(').replace(/(..)(..)(..)/, '$1, $2, $3');
      this._colorIndex++;
    }
    
    console.log(`EntityDebugManager: Registered entity ${entity.type} (${entity.id})`);
  }

  /**
   * Unregisters an entity from the debug manager.
   * @param {Entity} entity - Entity to unregister
   */
  unregisterEntity(entity) {
    this.entities.delete(entity);
    
    if (this._focusedEntity === entity) {
      this._focusedEntity = null;
    }
    
    console.log(`EntityDebugManager: Unregistered entity ${entity.type} (${entity.id})`);
  }

  /**
   * Gets all registered entities.
   * @returns {Array<Entity>} Array of registered entities
   */
  getAllEntities() {
    return Array.from(this.entities).filter(entity => entity.isActive);
  }

  /**
   * Gets all entities with active debuggers.
   * @returns {Array<Entity>} Array of entities with active debuggers
   */
  getActiveDebugEntities() {
    return this.getAllEntities().filter(entity => entity.isDebuggerActive());
  }

  // --- Debug Control Methods ---

  /**
   * Toggles the global debug state.
   * When enabled, shows debuggers for selected entities or nearest entities.
   */
  toggleGlobalDebug() {
    this.isDebugEnabled = !this.isDebugEnabled;
    
    if (this.isDebugEnabled) {
      this._showNearestEntities();
      console.log('EntityDebugManager: Global debug enabled');
    } else {
      this.hideAllDebuggers();
      console.log('EntityDebugManager: Global debug disabled');
    }
    
    this._updateDebugState();
  }

  /**
   * Shows debuggers for all registered entities (with optional force override).
   * @param {boolean} [forceAll=false] - If true, ignores performance limits
   */
  showAllDebuggers(forceAll = false) {
    this.isDebugEnabled = true;
    const entities = this.getAllEntities();
    
    let limit;
    if (forceAll) {
      // When forcing, use higher limit or all entities
      limit = Math.min(entities.length, this.config.forceShowAllLimit);
      console.log(`EntityDebugManager: Force showing ${limit} entity debuggers (ignoring performance limit)`);
    } else {
      // Normal operation with performance limit
      limit = Math.min(entities.length, this.config.maxVisibleDebuggers);
      console.log(`EntityDebugManager: Showing ${limit} entity debuggers (limit: ${this.config.maxVisibleDebuggers})`);
    }
    
    // Hide all first
    entities.forEach(entity => entity.toggleDebugger(false));
    
    // Show up to limit
    for (let i = 0; i < limit; i++) {
      entities[i].toggleDebugger(true);
    }
    
    this._updateDebugState();
  }

  /**
   * Hides all entity debuggers.
   */
  hideAllDebuggers() {
    this.getAllEntities().forEach(entity => entity.toggleDebugger(false));
    this.isDebugEnabled = false;
    this._focusedEntity = null;
    
    console.log('EntityDebugManager: All debuggers hidden');
    this._updateDebugState();
  }

  /**
   * Cycles through debuggers for selected entities only.
   */
  cycleSelectedEntityDebuggers() {
    const selectedEntities = this.getAllEntities().filter(entity => entity.isSelected && entity.isSelected());
    
    if (selectedEntities.length === 0) {
      console.log('EntityDebugManager: No selected entities to cycle');
      return;
    }
    
    // Hide all debuggers first
    this.getAllEntities().forEach(entity => entity.toggleDebugger(false));
    
    // Find next entity to focus
    let nextIndex = 0;
    if (this._focusedEntity) {
      const currentIndex = selectedEntities.indexOf(this._focusedEntity);
      nextIndex = (currentIndex + 1) % selectedEntities.length;
    }
    
    this._focusedEntity = selectedEntities[nextIndex];
    this._focusedEntity.toggleDebugger(true);
    
    console.log(`EntityDebugManager: Focused on ${this._focusedEntity.type} (${this._focusedEntity.id})`);
    this._updateDebugState();
  }

  /**
   * Shows debuggers for nearest entities to the mouse or screen center.
   * @private
   */
  _showNearestEntities() {
    const entities = this.getAllEntities();
    if (entities.length === 0) return;
    
    // Use mouse position if available, otherwise screen center
    const targetX = (typeof mouseX !== 'undefined') ? mouseX : (typeof g_canvasX !== 'undefined') ? g_canvasX / 2 : 400;
    const targetY = (typeof mouseY !== 'undefined') ? mouseY : (typeof g_canvasY !== 'undefined') ? g_canvasY / 2 : 300;
    
    // Calculate distances and sort
    const entitiesWithDistance = entities.map(entity => {
      const pos = entity.getPosition();
      const dx = pos.x - targetX;
      const dy = pos.y - targetY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return { entity, distance };
    });
    
    entitiesWithDistance.sort((a, b) => a.distance - b.distance);
    
    // Hide all debuggers first
    entities.forEach(entity => entity.toggleDebugger(false));
    
    // Show nearest entities up to limit
    const limit = Math.min(entitiesWithDistance.length, this.config.maxVisibleDebuggers);
    for (let i = 0; i < limit; i++) {
      entitiesWithDistance[i].entity.toggleDebugger(true);
    }
    
    console.log(`EntityDebugManager: Showing ${limit} nearest entities`);
  }

  /**
   * Updates global debug state and integrates with existing systems.
   * @private
   */
  _updateDebugState() {
    // Integrate with existing menu debug system if available
    if (typeof window !== 'undefined') {
      // Set global debug flag for other systems
      window.entityDebugEnabled = this.isDebugEnabled;
      
      // Trigger custom event for other systems to listen to
      const event = new CustomEvent('entityDebugStateChanged', {
        detail: {
          enabled: this.isDebugEnabled,
          activeCount: this.getActiveDebugEntities().length,
          totalCount: this.getAllEntities().length
        }
      });
      window.dispatchEvent(event);
    }
  }

  // --- Utility Methods ---

  /**
   * Gets debug statistics for monitoring and debugging.
   * @returns {Object} Debug statistics
   */
  getDebugStats() {
    const activeDebuggers = this.getActiveDebugEntities();
    const entities = this.getAllEntities();
    
    return {
      isEnabled: this.isDebugEnabled,
      totalEntities: entities.length,
      activeDebuggers: activeDebuggers.length,
      focusedEntity: this._focusedEntity?.id || null,
      lastActivity: this._lastActivity,
      registeredEntityTypes: [...new Set(entities.map(e => e.type))],
      memoryUsage: {
        entitiesRegistered: this.entities.size,
        entitiesWithDebuggers: entities.filter(e => e.getDebugger()).length
      }
    };
  }

  /**
   * Updates the debug manager state. Called from main game loop.
   * Handles auto-hide functionality and cleanup.
   */
  update() {
    // Auto-hide debuggers after inactivity
    if (this.isDebugEnabled && this.config.autoHideDelay > 0) {
      const timeSinceActivity = Date.now() - this._lastActivity;
      if (timeSinceActivity > this.config.autoHideDelay) {
        this.hideAllDebuggers();
        console.log('EntityDebugManager: Auto-hidden debuggers due to inactivity');
      }
    }
    
    // Clean up inactive entities
    this._cleanupInactiveEntities();
  }

  /**
   * Cleans up references to inactive entities.
   * @private
   */
  _cleanupInactiveEntities() {
    const inactiveEntities = Array.from(this.entities).filter(entity => !entity.isActive);
    inactiveEntities.forEach(entity => this.unregisterEntity(entity));
  }

  /**
   * Destroys the debug manager and cleans up resources.
   */
  destroy() {
    this.hideAllDebuggers();
    this.entities.clear();
    
    if (this._listenersAttached && typeof window !== 'undefined') {
      window.removeEventListener('keydown', this._handleKeyDown.bind(this));
      this._listenersAttached = false;
    }
    
    console.log('EntityDebugManager: Destroyed');
  }
}

// --- Global Integration ---

/**
 * Initialize the global EntityDebugManager if not already present.
 */
function initializeEntityDebugManager() {
  if (typeof window !== 'undefined' && !window.EntityDebugManager) {
    window.EntityDebugManager = new EntityDebugManager();
    console.log('EntityDebugManager: Global instance initialized');
    return window.EntityDebugManager;
  }
  return window?.EntityDebugManager || null;
}

/**
 * Get the global EntityDebugManager instance.
 * @returns {EntityDebugManager|null} Global instance or null
 */
function getEntityDebugManager() {
  return (typeof window !== 'undefined') ? window.EntityDebugManager : null;
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEntityDebugManager);
  } else {
    initializeEntityDebugManager();
  }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    EntityDebugManager,
    initializeEntityDebugManager,
    getEntityDebugManager
  };
}