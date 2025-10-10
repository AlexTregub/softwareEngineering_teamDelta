/**
 * CombatController - Handles combat detection, enemy tracking, and combat state management
 */



class CombatController {
  static _states = {OUT: "OUT_OF_COMBAT",IN: "IN_COMBAT"};
  static _actionStates = {ATTACK: "ATTACKING", DEFEND: "DEFENDING", SPIT: "SPITTING", NONE: "NONE"};

  constructor(entity) {
    this._entity = entity;
    this._nearbyEnemies = [];
    this._detectionRadius = 60; // pixels
    this._combatState = CombatController._states.OUT;
    this._combatActionState = CombatController._actionStates.NONE;
    this._lastEnemyCheck = 0;
    
    // PERFORMANCE: Adaptive update intervals based on combat state
    this._enemyCheckInterval = 150; // Reduced frequency: 150ms instead of 100ms
    this._combatCheckInterval = 100; // Faster when in combat
    this._outOfCombatCheckInterval = 200; // Slower when not in combat
    
    this._proximityTracking = new Map(); // entity -> first_proximity_time
    
    // PERFORMANCE: Cache controller references to avoid repeated getController() calls
    this._factionController = entity.getController ? entity.getController('faction') : null;
    this._entityFaction = entity.faction || "neutral";
    
    // Cache for other entities' faction controllers to avoid repeated lookups
    this._otherControllerCache = new Map(); // entity -> factionController
    this._cacheCleanupCounter = 0;
    
    // PERFORMANCE: Stagger updates across entities to spread CPU load
    this._updateOffset = Math.floor(Math.random() * 50); // 0-50ms random offset
    
    // Combat-specific behavioral settings
    this._behaviorModifiers = {
      attackOnSight: true,        // Engage immediately vs wait and observe
      defensivePosture: false,    // Prefer defensive vs aggressive tactics
      groupCombat: true          // Fight as group vs individual combat
    };
    
    this._combatSettings = {
      engagementDelay: 2000,      // Wait time before engaging non-immediate threats
      disengagementThreshold: 5,  // Distance to disengage from combat
      assistRange: 80            // Range to assist allies in combat
    };
  }
  
  // --- Public API ---

  /**
   * Update combat state and enemy detection (PERFORMANCE OPTIMIZED)
   */
  update() {
    const now = Date.now();
    
    // PERFORMANCE: Adaptive update frequency based on combat state + staggered timing
    const currentInterval = this.isInCombat() ? this._combatCheckInterval : this._outOfCombatCheckInterval;
    const staggeredTime = this._lastEnemyCheck + currentInterval + this._updateOffset;
    
    if (now > staggeredTime) {
      this.detectEnemies();
      this.updateCombatState();
      this._cleanupProximityTracking();
      this._lastEnemyCheck = now;
    }
  }

  /**
   * Get nearby enemies
   * @returns {Array} Array of nearby enemy entities
   */
  getNearbyEnemies() {
    return this._nearbyEnemies;
  }

  /**
   * Check if entity is currently in combat
   * @returns {boolean} True if in combat
   */
  isInCombat() {
    return this._combatState === CombatController._states.IN;
  }

  /**
   * Set detection radius for enemies
   * @param {number} radius - Detection radius in pixels
   */
  setDetectionRadius(radius) {
    this._detectionRadius = radius;
  }

  // REMOVED: Faction management methods moved to FactionController
  // Use entity.getController('faction').getFactionId() instead

  /**
   * Get current combat state
   * @returns {string} Combat state
   */
  getCombatState() {
    return this._combatState;
  }

  /**
   * Force combat state (for testing/debugging)
   * @param {string} state - Combat state to set
   */
  setCombatState(state) {
    const oldState = this._combatState;
    this._combatState = state;
    
    // Update state machine if available
    if (this._entity._stateMachine) {
      this._entity._stateMachine.setCombatModifier(state);
    }
    
    this._onCombatStateChange(oldState, state);
  }

  // --- Private Methods ---

  /**
   * Detect nearby enemies within detection radius (PERFORMANCE OPTIMIZED WITH SPATIAL FILTERING)
   */
  detectEnemies() {
    this._nearbyEnemies = [];
    
    // Access global ants array (this could be improved with dependency injection)
    if (typeof ants === 'undefined' || typeof antIndex === 'undefined') return;
    
    // PERFORMANCE: Use cached faction controller instead of repeated getController() calls
    const factionController = this._factionController;
    const entityFaction = this._entityFaction;
    
    // PERFORMANCE: Get entity position once
    const myPosition = this._entity.getPosition();
    const searchRadius = this._detectionRadius * 1.5; // Slightly larger for pre-filtering
    const searchRadiusSquared = searchRadius * searchRadius; // Avoid sqrt in distance checks
    
    // Periodically clean up controller cache (every 30 calls, more frequent)
    this._cacheCleanupCounter++;
    if (this._cacheCleanupCounter > 30) {
      this._cleanupControllerCache();
      this._cacheCleanupCounter = 0;
    }
    
    // PERFORMANCE OPTIMIZATION: Spatial pre-filtering
    // Only check ants that could possibly be within detection range
    const candidateAnts = this._getSpatiallyNearbyAnts(myPosition, searchRadius);
    
    // Check candidate ants for enemies (much smaller set than all ants)
    for (const otherAnt of candidateAnts) {
      if (!otherAnt || otherAnt === this._entity) continue;
      const otherFaction = otherAnt.faction || "neutral";
      
        // Use faction controller to check relationships, but combat controller makes combat decisions
        if (factionController) {
          // Check if these factions are hostile to each other
          const isHostile = this._areFactionsHostile(factionController, otherAnt);
          const proximityTime = this._getProximityTime(otherAnt);
          
          // Combat controller decides when to engage based on faction hostility
          const shouldEngage = this._shouldEngageInCombat(isHostile, proximityTime);
          
          if (!shouldEngage) {
            continue;
          }
        } else {
          // Fallback to simple faction logic
          // Skip if same faction or either is neutral
          if (otherFaction === entityFaction || 
              entityFaction === "neutral" || 
              otherFaction === "neutral") {
            continue;
          }
        }      // Check distance
      const distance = this.calculateDistance(this._entity, otherAnt);
      
      if (distance <= this._detectionRadius) {
        this._nearbyEnemies.push(otherAnt);
        
        // Trigger faction discovery if using faction system
        if (factionController && typeof g_factionManager !== 'undefined' && g_factionManager) {
          const myFactionId = factionController.getFactionId();
          
          // PERFORMANCE: Use cached controller lookup for other ant
          let otherFactionController = this._otherControllerCache.get(otherAnt);
          if (otherFactionController === undefined) {
            otherFactionController = otherAnt.getController ? otherAnt.getController('faction') : null;
            this._otherControllerCache.set(otherAnt, otherFactionController);
          }
          
          const otherFactionId = otherFactionController ? otherFactionController.getFactionId() : otherFaction;
          
          if (myFactionId && otherFactionId && myFactionId !== otherFactionId) {
            g_factionManager.discoverFaction(myFactionId, otherFactionId);
          }
        }
      }
    }
  }

  /**
   * Calculate distance between two entities
   * @param {Object} entity1 - First entity
   * @param {Object} entity2 - Second entity
   * @returns {number} Distance in pixels
   */
  calculateDistance(entity1, entity2) {
    const pos1 = entity1.getPosition();
    const pos2 = entity2.getPosition();
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Update combat state based on nearby enemies
   */
  updateCombatState() {
    const wasInCombat = this.isInCombat();
    const hasEnemies = this._nearbyEnemies.length > 0;
    
    if (hasEnemies && !wasInCombat) {
      this.setCombatState(CombatController._states.IN);
    } else if (!hasEnemies && wasInCombat) {
      this.setCombatState(CombatController._states.OUT);
    }
  }

  /**
   * Handle combat state changes
   * @param {string} oldState - Previous combat state
   * @param {string} newState - New combat state
   */
  _onCombatStateChange(oldState, newState) {
    // Override in subclasses or set callback for custom behavior
    if (this._onStateChangeCallback) {
      this._onStateChangeCallback(oldState, newState);
    }
  }

  /**
   * Set callback for combat state changes
   * @param {Function} callback - Callback function
   */
  setStateChangeCallback(callback) {
    this._onStateChangeCallback = callback;
  }

  /**
   * Get combat debug information
   * @returns {Object} Debug information
   */
  getDebugInfo() {
    return {
      combatState: this._combatState,
      nearbyEnemyCount: this._nearbyEnemies.length,
      detectionRadius: this._detectionRadius,
      entityFaction: this._entity.faction || "neutral"
    };
  }

  /**
   * Get how long an entity has been in proximity
   * @param {Object} otherEntity - Other entity to check
   * @returns {number} Time in milliseconds
   */
  _getProximityTime(otherEntity) {
    const now = Date.now();
    
    if (!this._proximityTracking.has(otherEntity)) {
      this._proximityTracking.set(otherEntity, now);
      return 0;
    }
    
    return now - this._proximityTracking.get(otherEntity);
  }

  /**
   * Clear proximity tracking for entities no longer nearby
   */
  _cleanupProximityTracking() {
    const currentNearbyEntities = new Set(this._nearbyEnemies);
    
    // Remove tracking for entities no longer nearby
    for (const [entity, startTime] of this._proximityTracking.entries()) {
      if (!currentNearbyEntities.has(entity)) {
        this._proximityTracking.delete(entity);
      }
    }
  }

  /**
   * Clean up cached controller references to prevent memory leaks
   * PERFORMANCE: Removes stale controller references
   */
  _cleanupControllerCache() {
    // Only keep references to entities that still exist and are active
    const entitiesToKeep = new Set();
    
    if (typeof ants !== 'undefined') {
      for (const ant of ants) {
        if (ant && ant._isActive) {
          entitiesToKeep.add(ant);
        }
      }
    }
    
    // Remove stale entries
    for (const [entity] of this._otherControllerCache.entries()) {
      if (!entitiesToKeep.has(entity)) {
        this._otherControllerCache.delete(entity);
      }
    }
  }

  /**
   * Check if two factions are hostile (asks FactionController for relationship)
   * @param {FactionController} factionController - This entity's faction controller
   * @param {Object} otherEntity - Other entity to check
   * @returns {boolean} True if factions are hostile
   */
  _areFactionsHostile(factionController, otherEntity) {
    return factionController.areFactionsHostile(otherEntity);
  }

  /**
   * Combat-specific logic for when to engage based on hostility and proximity
   * @param {boolean} isHostile - Whether factions are hostile
   * @param {number} proximityTime - How long entities have been near each other
   * @returns {boolean} True if should engage in combat
   */
  _shouldEngageInCombat(isHostile, proximityTime) {
    if (!isHostile) return false;
    
    // Combat controller decides engagement timing
    // Immediate engagement for known enemies
    if (this._behaviorModifiers?.attackOnSight) {
      return true;
    }
    
    // Delayed engagement after observing for a while
    const engagementDelay = this._combatSettings?.engagementDelay || 2000; // 2 seconds default
    return proximityTime > engagementDelay;
  }

  /**
   * Get spatially nearby ants for performance optimization
   * MAJOR PERFORMANCE IMPROVEMENT: Reduces N×N to N×(small constant)
   * @param {Object} position - Center position {x, y}
   * @param {number} radius - Search radius
   * @returns {Array} Array of nearby ants (much smaller than full ants array)
   */
  _getSpatiallyNearbyAnts(position, radius) {
    const nearby = [];
    const radiusSquared = radius * radius;
    
    // Quick spatial filtering - only consider ants within bounding box first
    const minX = position.x - radius;
    const maxX = position.x + radius;
    const minY = position.y - radius;
    const maxY = position.y + radius;
    
    for (let i = 0; i < ants.length; i++) {
      if (!ants[i] || ants[i] === this._entity) continue;
      
      const otherAnt = ants[i];
      const otherPos = otherAnt.getPosition();
      
      // Quick bounding box check first (very fast)
      if (otherPos.x < minX || otherPos.x > maxX || 
          otherPos.y < minY || otherPos.y > maxY) {
        continue;
      }
      
      // More precise distance check only for ants in bounding box
      const dx = position.x - otherPos.x;
      const dy = position.y - otherPos.y;
      const distanceSquared = dx * dx + dy * dy;
      
      if (distanceSquared <= radiusSquared) {
        nearby.push(otherAnt);
      }
    }
    
    return nearby;
  }

  /**
   *  draws a circle around an entity that represents is enemy detection range
   *  should only be used if debug state is enabled
   */
  drawDetectionRange() {
    
  }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CombatController;
}