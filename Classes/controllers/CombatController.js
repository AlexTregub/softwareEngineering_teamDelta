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
    this._enemyCheckInterval = 100; // Check every 100ms for performance
    this._proximityTracking = new Map(); // entity -> first_proximity_time
  }
  
  // --- Public API ---

  /**
   * Update combat state and enemy detection
   */
  update() {
    const now = Date.now();
    if (now - this._lastEnemyCheck > this._enemyCheckInterval) {
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

  /**
   * Set entity faction for combat determination
   * @param {string} faction - Faction name (e.g., "player", "enemy", "neutral")
   */
  setFaction(faction) {
    this._entity._faction = faction;
  }

  /**
   * Get entity faction
   * @returns {string} Entity faction
   */
  getFaction() {
    return this._entity._faction || this._entity.faction || "neutral";
  }

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
   * Detect nearby enemies within detection radius
   */
  detectEnemies() {
    this._nearbyEnemies = [];
    
    // Access global ants array (this could be improved with dependency injection)
    if (typeof ants === 'undefined' || typeof antIndex === 'undefined') return;
    
    // Get faction controller for advanced faction logic
    const factionController = this._entity.getController ? this._entity.getController('faction') : null;
    const entityFaction = this._entity.faction || "neutral";
    
    // Check all other ants for enemies
    for (let i = 0; i < ants.length; i++) {
      if (!ants[i] || ants[i] === this._entity) continue;
      
      const otherAnt = ants[i];
      const otherFaction = otherAnt.faction || "neutral";
      
      // Use faction controller for advanced relationship checking
      if (factionController) {
        // Check if should attack on sight or after delay
        const shouldAttackNow = factionController.shouldAttackOnSight(otherAnt);
        const proximityTime = this._getProximityTime(otherAnt);
        const shouldAttackDelayed = factionController.shouldAttackAfterDelay(otherAnt, proximityTime);
        
        if (!shouldAttackNow && !shouldAttackDelayed) {
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
      }
      
      // Check distance
      const distance = this.calculateDistance(this._entity, otherAnt);
      
      if (distance <= this._detectionRadius) {
        this._nearbyEnemies.push(otherAnt);
        
        // Trigger faction discovery if using faction system
        if (factionController && typeof g_factionManager !== 'undefined' && g_factionManager) {
          const myFactionId = factionController.getFactionId();
          const otherFactionController = otherAnt.getController ? otherAnt.getController('faction') : null;
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