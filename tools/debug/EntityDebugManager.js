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
    
    /** @type {boolean} Whether global performance summary is visible */
    this.showGlobalPerformance = false;
    
    /** @type {Object} Collected performance data storage */
    this.collectedPerformanceData = {
      combinedUpdateTimes: [],
      combinedRenderTimes: [],
      combinedMemoryUsage: [],
      totalAverageUpdateTime: 0,
      totalAverageRenderTime: 0,
      totalAverageMemoryUsage: 0,
      peakUpdateTime: 0,
      peakRenderTime: 0,
      peakMemoryUsage: 0,
      lastCollectionTime: 0,
      collectionInterval: 3000, // 3 seconds in milliseconds
      dataHistory: [] // Store historical collection points
    };
    
    /** @type {number|null} Timer ID for periodic data collection */
    this._dataCollectionTimer = null;
    
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
      // Bind once and store the handler so we can remove the exact same
      // function reference later (avoid removeEventListener mismatch)
      this._keyDownHandler = this._handleKeyDown.bind(this);
      window.addEventListener('keydown', this._keyDownHandler);
      this._listenersAttached = true;

      if (typeof globalThis.logNormal === 'function') {
        globalThis.logNormal('EntityDebugManager: Event listeners attached');
      } else {
        console.log('EntityDebugManager: Event listeners attached');
      }
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
    
    if (typeof globalThis.logVerbose === 'function') {
      globalThis.logVerbose(`EntityDebugManager: Registered entity ${entity.type} (${entity.id})`);
    } else {
      console.log(`EntityDebugManager: Registered entity ${entity.type} (${entity.id})`);
    }
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
  /**
   * Toggles only the closest entity to the mouse cursor.
   * If no entity is currently being debugged, enables the closest one.
   * If an entity is being debugged, toggles it off.
   */
  toggleClosestEntity() {
    const entities = this.getAllEntities();
    if (entities.length === 0) return;
    
    // Find currently active debugger
    const activeEntities = entities.filter(entity => 
      entity.entityDebugger && entity.entityDebugger.isActive
    );
    
    // If we have active debuggers, turn them off
    if (activeEntities.length > 0) {
      activeEntities.forEach(entity => entity.toggleDebugger(false));
      this.isDebugEnabled = false;
      console.log('EntityDebugManager: Disabled active entity debuggers');
      this._updateDebugState();
      return;
    }
    
    // No active debuggers, find and enable the closest entity
    const closestEntity = this._findClosestEntity();
    if (closestEntity) {
      closestEntity.toggleDebugger(true);
      this.isDebugEnabled = true;
      console.log(`EntityDebugManager: Enabled debugger for closest entity (${closestEntity.constructor.name})`);
      this._updateDebugState();
    }
  }

  toggleGlobalDebug() {
    this.isDebugEnabled = !this.isDebugEnabled;
    
    if (this.isDebugEnabled) {
      this.toggleClosestEntity();
      // Automatically show global performance graph when debug mode is enabled
      this.showGlobalPerformance = true;
      console.log('EntityDebugManager: Global debug enabled (with performance graph)');
    } else {
      this.hideAllDebuggers();
      // Hide global performance graph when debug mode is disabled
      this.showGlobalPerformance = false;
      console.log('EntityDebugManager: Global debug disabled (performance graph hidden)');
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
   * Finds the closest entity to the mouse cursor (or screen center if no mouse available).
   * 
   * @returns {Entity|null} The closest entity or null if no entities exist
   * @private
   */
  _findClosestEntity() {
    const entities = this.getAllEntities();
    if (entities.length === 0) return null;
    
    // Use mouse position if available, otherwise screen center
    const targetX = (typeof mouseX !== 'undefined') ? mouseX : (typeof g_canvasX !== 'undefined') ? g_canvasX / 2 : 400;
    const targetY = (typeof mouseY !== 'undefined') ? mouseY : (typeof g_canvasY !== 'undefined') ? g_canvasY / 2 : 300;
    
    // Find the closest entity
    let closestEntity = null;
    let closestDistance = Infinity;
    
    entities.forEach(entity => {
      const pos = entity.getPosition();
      const dx = pos.x - targetX;
      const dy = pos.y - targetY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestEntity = entity;
      }
    });
    
    return closestEntity;
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
    
    // Handle periodic data collection when debug mode is enabled
    if (this.isDebugEnabled) {
      this._updateDataCollection();
    }
    
    // Clean up inactive entities
    this._cleanupInactiveEntities();
  }

  /**
   * Manages periodic data collection from all entities.
   * Collects data every 3 seconds when debug mode is active.
   * @private
   */
  _updateDataCollection() {
    const currentTime = Date.now();
    
    // Check if it's time to collect data (every 3 seconds)
    if (currentTime - this.collectedPerformanceData.lastCollectionTime >= this.collectedPerformanceData.collectionInterval) {
      this._collectPerformanceDataFromAllEntities();
      this.collectedPerformanceData.lastCollectionTime = currentTime;
      
      console.log(`EntityDebugManager: Collected performance data from ${this.entities.size} entities`);
    }
  }

  /**
   * Collects current performance data from all entities and updates storage.
   * @private
   */
  _collectPerformanceDataFromAllEntities() {
    const currentCollection = {
      timestamp: Date.now(),
      updateTimes: [],
      renderTimes: [],
      memoryUsage: [],
      entityCount: 0
    };

    // Collect from all entities with debuggers
    const allEntities = Array.from(this.entities).filter(entity => 
      entity.entityDebugger && entity.isActive
    );

    allEntities.forEach(entity => {
      const perfData = entity.entityDebugger.getPerformanceData();
      
      // Collect current frame performance data
      if (perfData.updateTimes && perfData.updateTimes.length > 0) {
        const latestUpdateTime = perfData.updateTimes[perfData.updateTimes.length - 1];
        if (latestUpdateTime > 0) {
          currentCollection.updateTimes.push(latestUpdateTime);
        }
      }
      
      if (perfData.renderTimes && perfData.renderTimes.length > 0) {
        const latestRenderTime = perfData.renderTimes[perfData.renderTimes.length - 1];
        if (latestRenderTime > 0) {
          currentCollection.renderTimes.push(latestRenderTime);
        }
      }
      
      // Estimate memory usage (simplified calculation)
      const estimatedMemory = this._estimateEntityMemoryUsage(entity);
      if (estimatedMemory > 0) {
        currentCollection.memoryUsage.push(estimatedMemory);
      }
      
      currentCollection.entityCount++;
    });

    // Add to historical data and update combined arrays
    this.collectedPerformanceData.dataHistory.push(currentCollection);
    
    // Keep only last 100 collection points to prevent memory bloat
    if (this.collectedPerformanceData.dataHistory.length > 100) {
      this.collectedPerformanceData.dataHistory.shift();
    }
    
    // Update combined arrays with latest data
    this._updateCombinedPerformanceData();
  }

  /**
   * Estimates memory usage for an entity (simplified calculation).
   * @param {Entity} entity - Entity to estimate memory for
   * @returns {number} Estimated memory usage in bytes
   * @private
   */
  _estimateEntityMemoryUsage(entity) {
    // Simple heuristic based on entity properties and debugger data
    let memoryEstimate = 1024; // Base entity overhead
    
    // Add memory for common entity properties
    if (entity.position) memoryEstimate += 64;
    if (entity.velocity) memoryEstimate += 64;
    if (entity.sprite) memoryEstimate += 512;
    if (entity.stats) memoryEstimate += 256;
    
    // Add debugger memory overhead
    if (entity.entityDebugger) {
      memoryEstimate += 2048; // Debugger overhead
      const perfData = entity.entityDebugger.getPerformanceData();
      if (perfData.updateTimes) memoryEstimate += perfData.updateTimes.length * 8;
      if (perfData.renderTimes) memoryEstimate += perfData.renderTimes.length * 8;
    }
    
    return memoryEstimate;
  }

  /**
   * Updates the combined performance arrays from historical data.
   * @private
   */
  _updateCombinedPerformanceData() {
    const data = this.collectedPerformanceData;
    
    // Reset combined arrays
    data.combinedUpdateTimes = [];
    data.combinedRenderTimes = [];
    data.combinedMemoryUsage = [];
    
    let totalUpdate = 0, totalRender = 0, totalMemory = 0;
    let updateCount = 0, renderCount = 0, memoryCount = 0;
    
    data.peakUpdateTime = 0;
    data.peakRenderTime = 0;
    data.peakMemoryUsage = 0;
    
    // Process each historical collection point
    this.collectedPerformanceData.dataHistory.forEach(collection => {
      // Combine update times
      collection.updateTimes.forEach(time => {
        data.combinedUpdateTimes.push(time);
        totalUpdate += time;
        updateCount++;
        data.peakUpdateTime = Math.max(data.peakUpdateTime, time);
      });
      
      // Combine render times
      collection.renderTimes.forEach(time => {
        data.combinedRenderTimes.push(time);
        totalRender += time;
        renderCount++;
        data.peakRenderTime = Math.max(data.peakRenderTime, time);
      });
      
      // Combine memory usage
      collection.memoryUsage.forEach(memory => {
        data.combinedMemoryUsage.push(memory);
        totalMemory += memory;
        memoryCount++;
        data.peakMemoryUsage = Math.max(data.peakMemoryUsage, memory);
      });
    });
    
    // Calculate averages
    data.totalAverageUpdateTime = updateCount > 0 ? totalUpdate / updateCount : 0;
    data.totalAverageRenderTime = renderCount > 0 ? totalRender / renderCount : 0;
    data.totalAverageMemoryUsage = memoryCount > 0 ? totalMemory / memoryCount : 0;
    
    // Keep arrays to reasonable size (last 300 data points)
    if (data.combinedUpdateTimes.length > 300) {
      data.combinedUpdateTimes = data.combinedUpdateTimes.slice(-300);
    }
    if (data.combinedRenderTimes.length > 300) {
      data.combinedRenderTimes = data.combinedRenderTimes.slice(-300);
    }
    if (data.combinedMemoryUsage.length > 300) {
      data.combinedMemoryUsage = data.combinedMemoryUsage.slice(-300);
    }
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
   * Gets aggregated performance data from all registered entities.
   * Uses the periodically collected data for more accurate statistics.
   * 
   * @returns {Object} Combined performance statistics
   * @public
   */
  getGlobalPerformanceData() {
    const allData = {
      totalEntities: 0,
      activeDebuggers: 0,
      allEntities: 0,
      combinedUpdateTimes: [],
      combinedRenderTimes: [],
      combinedMemoryUsage: [],
      totalAverageUpdateTime: 0,
      totalAverageRenderTime: 0,
      totalAverageMemoryUsage: 0,
      peakUpdateTime: 0,
      peakRenderTime: 0,
      peakMemoryUsage: 0,
      entityBreakdown: [],
      dataCollectionActive: false,
      lastCollectionTime: 0,
      collectionCount: 0
    };

    const allEntities = Array.from(this.entities).filter(entity => entity.entityDebugger);
    const activeDebuggers = allEntities.filter(entity => entity.entityDebugger.isActive);

    allData.totalEntities = this.entities.size;
    allData.allEntities = allEntities.length;
    allData.activeDebuggers = activeDebuggers.length;

    // Add collection status information
    allData.dataCollectionActive = this.isDebugEnabled;
    allData.lastCollectionTime = this.collectedPerformanceData.lastCollectionTime;
    allData.collectionCount = this.collectedPerformanceData.dataHistory.length;

    if (allEntities.length === 0) return allData;

    // Use collected performance data if available and recent
    const timeSinceCollection = Date.now() - this.collectedPerformanceData.lastCollectionTime;
    const hasRecentData = timeSinceCollection < (this.collectedPerformanceData.collectionInterval * 2);

    if (hasRecentData && this.collectedPerformanceData.dataHistory.length > 0) {
      // Use periodically collected data
      allData.combinedUpdateTimes = [...this.collectedPerformanceData.combinedUpdateTimes];
      allData.combinedRenderTimes = [...this.collectedPerformanceData.combinedRenderTimes];
      allData.combinedMemoryUsage = [...this.collectedPerformanceData.combinedMemoryUsage];
      allData.totalAverageUpdateTime = this.collectedPerformanceData.totalAverageUpdateTime;
      allData.totalAverageRenderTime = this.collectedPerformanceData.totalAverageRenderTime;
      allData.totalAverageMemoryUsage = this.collectedPerformanceData.totalAverageMemoryUsage;
      allData.peakUpdateTime = this.collectedPerformanceData.peakUpdateTime;
      allData.peakRenderTime = this.collectedPerformanceData.peakRenderTime;
      allData.peakMemoryUsage = this.collectedPerformanceData.peakMemoryUsage;
    } else {
      // Fallback to real-time data collection for immediate display
      let totalUpdateSum = 0;
      let totalRenderSum = 0;
      let updateCount = 0;
      let renderCount = 0;

      allEntities.forEach(entity => {
        const perfData = entity.entityDebugger.getPerformanceData();

        // Aggregate averages
        if (perfData.averageUpdateTime > 0) {
          totalUpdateSum += perfData.averageUpdateTime;
          updateCount++;
        }
        if (perfData.averageRenderTime > 0) {
          totalRenderSum += perfData.averageRenderTime;
          renderCount++;
        }

        // Track peaks
        allData.peakUpdateTime = Math.max(allData.peakUpdateTime, perfData.peakUpdateTime);
        allData.peakRenderTime = Math.max(allData.peakRenderTime, perfData.peakRenderTime);

        // Combine time series data (take the most recent values)
        if (perfData.updateTimes && perfData.updateTimes.length > 0) {
          allData.combinedUpdateTimes.push(...perfData.updateTimes.slice(-10)); // Last 10 frames
        }
        if (perfData.renderTimes && perfData.renderTimes.length > 0) {
          allData.combinedRenderTimes.push(...perfData.renderTimes.slice(-10)); // Last 10 frames
        }
      });

      // Calculate global averages
      allData.totalAverageUpdateTime = updateCount > 0 ? totalUpdateSum / updateCount : 0;
      allData.totalAverageRenderTime = renderCount > 0 ? totalRenderSum / renderCount : 0;
    }

    // Build entity breakdown (always real-time for current status)
    allEntities.forEach(entity => {
      const perfData = entity.entityDebugger.getPerformanceData();
      
      allData.entityBreakdown.push({
        entityType: perfData.targetObjectType,
        entityId: perfData.targetObjectId,
        avgUpdateTime: perfData.averageUpdateTime,
        avgRenderTime: perfData.averageRenderTime,
        updateFrequency: perfData.updateFrequency,
        renderFrequency: perfData.renderFrequency,
        isActive: entity.entityDebugger.isActive
      });
    });

    return allData;
  }

  /**
   * Draws a global performance summary graph showing aggregated data.
   * Always shows a toggle button, and shows performance data when enabled.
   * 
   * @param {number} x - X position for the summary graph
   * @param {number} y - Y position for the summary graph
   * @param {number} width - Width of the summary graph
   * @param {number} height - Height of the summary graph
   * @public
   */
  drawGlobalPerformanceSummary(x, y, width, height) {
    const globalData = this.getGlobalPerformanceData();
    
    push();
    
    // Always draw the toggle button
    this._drawGlobalToggleButton(x, y, width);
    
    // Only show performance data if toggled on and we have active debuggers
    if (this.showGlobalPerformance && globalData.activeDebuggers > 0) {
      // Draw background
      fill(0, 200);
      stroke(255, 255, 0);
      strokeWeight(2);
      rect(x, y + 35, width, height - 35); // Adjusted for button space
      
      // Title
      fill(255, 255, 0);
      textSize(12);
      textAlign(LEFT, TOP);
      text(`Global Performance Summary (${globalData.activeDebuggers} entities)`, x + 5, y + 40);
    
      // Stats display
      fill(255);
      textSize(10);
      let yPos = y + 55; // Adjusted for button space
      text(`Total Avg Update: ${globalData.totalAverageUpdateTime.toFixed(2)}ms`, x + 5, yPos);
      yPos += 15;
      text(`Total Avg Render: ${globalData.totalAverageRenderTime.toFixed(2)}ms`, x + 5, yPos);
      yPos += 15;
      text(`Peak Update: ${globalData.peakUpdateTime.toFixed(2)}ms`, x + 5, yPos);
      yPos += 15;
      text(`Peak Render: ${globalData.peakRenderTime.toFixed(2)}ms`, x + 5, yPos);
      
      // Draw combined performance graph
      const graphY = y + 115; // Adjusted for button space
      const graphHeight = height - 120; // Adjusted for button space
      
      if (globalData.combinedUpdateTimes.length > 0 || globalData.combinedRenderTimes.length > 0) {
        this._drawGlobalPerformanceChart(x + 5, graphY, width - 10, graphHeight, globalData);
      }
    } else if (globalData.activeDebuggers === 0) {
      // Show message when no debuggers are active
      fill(150);
      textSize(10);
      textAlign(CENTER, CENTER);
      text('No active debuggers', x + width/2, y + 20);
    }
    
    pop();
  }

  /**
   * Draws the toggle button for global performance summary.
   * 
   * @param {number} x - Button panel X position
   * @param {number} y - Button panel Y position
   * @param {number} width - Panel width
   * @private
   */
  _drawGlobalToggleButton(x, y, width) {
    const buttonW = 120;
    const buttonH = 25;
    const buttonX = x + width - buttonW - 10;
    const buttonY = y + 5;
    
    // Draw button background
    fill(this.showGlobalPerformance ? [0, 200, 0, 150] : [100, 100, 100, 150]);
    stroke(this.showGlobalPerformance ? [0, 255, 0] : [200, 200, 200]);
    strokeWeight(2);
    rect(buttonX, buttonY, buttonW, buttonH);
    
    // Draw button text
    fill(255);
    textSize(10);
    textAlign(CENTER, CENTER);
    text(this.showGlobalPerformance ? 'Hide Global Perf' : 'Show Global Perf', 
         buttonX + buttonW/2, buttonY + buttonH/2);
    
    // Handle button clicks
    if (mouseIsPressed && frameCount % 5 === 0) { // Debounce clicks
      if (mouseX >= buttonX && mouseX <= buttonX + buttonW &&
          mouseY >= buttonY && mouseY <= buttonY + buttonH) {
        this.showGlobalPerformance = !this.showGlobalPerformance;
        console.log(`Global performance summary ${this.showGlobalPerformance ? 'enabled' : 'disabled'}`);
      }
    }
  }

  /**
   * Draws the global performance chart.
   * 
   * @param {number} x - Chart X position
   * @param {number} y - Chart Y position
   * @param {number} w - Chart width
   * @param {number} h - Chart height
   * @param {Object} globalData - Global performance data
   * @private
   */
  _drawGlobalPerformanceChart(x, y, w, h, globalData) {
    // Combine all update and render times into a single timeline
    const combinedTimes = [];
    const maxLength = Math.max(globalData.combinedUpdateTimes.length, globalData.combinedRenderTimes.length);
    
    for (let i = 0; i < maxLength; i++) {
      const updateTime = i < globalData.combinedUpdateTimes.length ? globalData.combinedUpdateTimes[i] : 0;
      const renderTime = i < globalData.combinedRenderTimes.length ? globalData.combinedRenderTimes[i] : 0;
      combinedTimes.push(updateTime + renderTime);
    }
    
    if (combinedTimes.length < 2) return;
    
    // Draw chart background
    fill(0, 100);
    noStroke();
    rect(x, y, w, h);
    
    // Draw chart border
    noFill();
    stroke(255, 200);
    strokeWeight(1);
    rect(x, y, w, h);
    
    // Scale and draw the combined performance line
    const maxValue = Math.max(...combinedTimes);
    const minValue = Math.min(...combinedTimes);
    const range = maxValue - minValue;
    const scale = range > 0 ? (h - 10) / range : 1;
    
    stroke(255, 255, 0);
    strokeWeight(2);
    noFill();
    
    beginShape();
    for (let i = 0; i < combinedTimes.length; i++) {
      const dataX = x + (i / (combinedTimes.length - 1)) * w;
      const dataY = y + h - 5 - ((combinedTimes[i] - minValue) * scale);
      vertex(dataX, dataY);
    }
    endShape();
    
    // Current value indicator
    if (combinedTimes.length > 0) {
      const currentValue = combinedTimes[combinedTimes.length - 1];
      const currentY = y + h - 5 - ((currentValue - minValue) * scale);
      
      fill(255, 255, 0);
      noStroke();
      ellipse(x + w - 2, currentY, 6, 6);
      
      fill(255);
      textSize(8);
      textAlign(RIGHT, CENTER);
      text(currentValue.toFixed(1), x + w - 8, currentY);
    }
    
    // Draw scale labels
    fill(255, 150);
    textSize(7);
    textAlign(LEFT, CENTER);
    text(maxValue.toFixed(1), x + 2, y + 5);
    if (range > 0) {
      text(minValue.toFixed(1), x + 2, y + h - 5);
    }
  }

  /**
   * Toggles the global performance summary display.
   * 
   * @param {boolean} [state] - Optional specific state to set
   * @returns {boolean} New toggle state
   * @public
   */
  toggleGlobalPerformance(state) {
    if (typeof state === 'boolean') {
      this.showGlobalPerformance = state;
    } else {
      this.showGlobalPerformance = !this.showGlobalPerformance;
    }
    
    console.log(`Global performance summary ${this.showGlobalPerformance ? 'enabled' : 'disabled'}`);
    return this.showGlobalPerformance;
  }

  /**
   * Gets the current state of the global performance toggle.
   * 
   * @returns {boolean} Current toggle state
   * @public
   */
  getGlobalPerformanceState() {
    return this.showGlobalPerformance;
  }

  /**
   * Draws a standalone global performance graph using GlobalPerformanceData.
   * This is a simpler version that can be called independently.
   * 
   * @param {number} x - X position for the graph
   * @param {number} y - Y position for the graph
   * @param {number} width - Width of the graph
   * @param {number} height - Height of the graph
   * @param {Object} [options] - Optional display settings
   * @public
   */
  drawGlobalPerformanceGraph(x, y, width, height, options = {}) {
    const globalData = this.getGlobalPerformanceData();
    
    if (globalData.allEntities === 0) {
      // Show message when no entities exist
      push();
      fill(100, 100, 100, 150);
      stroke(150);
      strokeWeight(1);
      rect(x, y, width, height);
      
      fill(200);
      textSize(12);
      textAlign(CENTER, CENTER);
      text('No Entities Available', x + width/2, y + height/2);
      pop();
      return;
    }

    push();
    
    // Draw background
    fill(options.backgroundColor || [0, 0, 0, 180]);
    stroke(options.borderColor || [100, 200, 255]);
    strokeWeight(options.borderWidth || 2);
    rect(x, y, width, height);
    
    // Title
    fill(options.titleColor || [100, 200, 255]);
    textSize(options.titleSize || 14);
    textAlign(LEFT, TOP);
    text(`Global Performance (${globalData.allEntities} entities, ${globalData.activeDebuggers} active)`, x + 5, y + 5);
    
    // Performance statistics
    fill(options.textColor || [255, 255, 255]);
    textSize(options.textSize || 10);
    let yPos = y + 25;
    
    text(`Entities: ${globalData.allEntities} total, ${globalData.activeDebuggers} tracking`, x + 5, yPos);
    yPos += 12;
    text(`Data Points: ${globalData.combinedUpdateTimes.length} update, ${globalData.combinedRenderTimes.length} render, ${globalData.combinedMemoryUsage.length} memory`, x + 5, yPos);
    yPos += 12;
    text(`Avg Update: ${globalData.totalAverageUpdateTime.toFixed(2)}ms`, x + 5, yPos);
    yPos += 12;
    text(`Avg Render: ${globalData.totalAverageRenderTime.toFixed(2)}ms`, x + 5, yPos);
    yPos += 12;
    text(`Avg Memory: ${(globalData.totalAverageMemoryUsage / 1024).toFixed(1)}KB`, x + 5, yPos);
    yPos += 12;
    text(`Peak Update: ${globalData.peakUpdateTime.toFixed(2)}ms`, x + 5, yPos);
    yPos += 12;
    text(`Peak Render: ${globalData.peakRenderTime.toFixed(2)}ms`, x + 5, yPos);
    yPos += 12;
    text(`Peak Memory: ${(globalData.peakMemoryUsage / 1024).toFixed(1)}KB`, x + 5, yPos);
    yPos += 12;
    
    const totalAvg = globalData.totalAverageUpdateTime + globalData.totalAverageRenderTime;
    fill(options.highlightColor || [255, 255, 100]);
    text(`Total Avg: ${totalAvg.toFixed(2)}ms`, x + 5, yPos);
    yPos += 12;
    
    // Collection status
    fill(globalData.dataCollectionActive ? [100, 255, 100] : [255, 100, 100]);
    text(`Collection: ${globalData.dataCollectionActive ? 'Active' : 'Inactive'} (${globalData.collectionCount} samples)`, x + 5, yPos);
    
    // Draw performance chart
    const chartY = y + 80;
    const chartHeight = height - 85;
    const chartWidth = width - 10;
    
    if (globalData.combinedUpdateTimes.length > 0 || globalData.combinedRenderTimes.length > 0) {
      this._drawGlobalPerformanceChart(x + 5, chartY, chartWidth, chartHeight, globalData, options);
    } else if (globalData.allEntities > 0) {
      // Show message about data collection when entities exist but no performance data yet
      fill(150);
      textSize(10);
      textAlign(CENTER, CENTER);
      text('Performance data collecting...', x + chartWidth/2, chartY + chartHeight/2);
    }
    
    // Entity breakdown (if space allows and option enabled)
    if (options.showEntityBreakdown && height > 200 && globalData.entityBreakdown.length > 0) {
      this._drawEntityBreakdown(x + width - 150, y + 25, 140, Math.min(100, height - 30), globalData.entityBreakdown);
    }
    
    pop();
  }

  /**
   * Draws entity performance breakdown list.
   * 
   * @param {number} x - X position
   * @param {number} y - Y position  
   * @param {number} width - Width of breakdown area
   * @param {number} height - Height of breakdown area
   * @param {Array} entityBreakdown - Array of entity performance data
   * @private
   */
  _drawEntityBreakdown(x, y, width, height, entityBreakdown) {
    // Background for breakdown
    fill(0, 0, 0, 100);
    stroke(100, 100, 100);
    strokeWeight(1);
    rect(x, y, width, height);
    
    fill(200, 200, 200);
    textSize(8);
    textAlign(LEFT, TOP);
    text('Entity Breakdown:', x + 3, y + 3);
    
    let yPos = y + 15;
    const maxEntries = Math.floor((height - 20) / 10);
    
    for (let i = 0; i < Math.min(entityBreakdown.length, maxEntries); i++) {
      const entity = entityBreakdown[i];
      const totalTime = entity.avgUpdateTime + entity.avgRenderTime;
      
      // Color code by performance (green = good, red = bad)
      if (totalTime < 1.0) {
        fill(100, 255, 100);
      } else if (totalTime < 2.0) {
        fill(255, 255, 100);  
      } else {
        fill(255, 100, 100);
      }
      
      textSize(7);
      text(`${entity.entityType}: ${totalTime.toFixed(1)}ms`, x + 3, yPos);
      yPos += 10;
    }
    
    if (entityBreakdown.length > maxEntries) {
      fill(150);
      textSize(6);
      text(`+${entityBreakdown.length - maxEntries} more...`, x + 3, yPos);
    }
  }

  /**
   * Destroys the debug manager and cleans up resources.
   */
  destroy() {
    this.hideAllDebuggers();
    this.entities.clear();
    
    // Clean up data collection timer if it exists
    if (this._dataCollectionTimer) {
      clearInterval(this._dataCollectionTimer);
      this._dataCollectionTimer = null;
    }
    
    // Clear collected performance data
    this.collectedPerformanceData.combinedUpdateTimes = [];
    this.collectedPerformanceData.combinedRenderTimes = [];
    this.collectedPerformanceData.combinedMemoryUsage = [];
    this.collectedPerformanceData.dataHistory = [];
    
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
    if (typeof globalThis.logNormal === 'function') {
      globalThis.logNormal('EntityDebugManager: Global instance initialized');
    } else {
      console.log('EntityDebugManager: Global instance initialized');
    }
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