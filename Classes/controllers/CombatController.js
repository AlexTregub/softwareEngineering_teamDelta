/**
 * CombatController - Handles combat detection, enemy tracking, and combat state management
 */



class CombatController {
  static _states = {OUT: "OUT_OF_COMBAT",IN: "IN_COMBAT"};
  static _actionStates = {ATTACK: "ATTACKING", DEFEND: "DEFENDING", SPIT: "SPITTING", NONE: "NONE"};

  constructor(entity) {
    this._entity = entity;
    this._nearbyEnemies = [];
    this._detectionRadius = 200; // pixels
    this._combatState = CombatController._states.OUT;
    this._combatActionState = CombatController._actionStates.NONE;
    this._lastEnemyCheck = 0;
    this._enemyCheckInterval = 100; // Check every 100ms for performance
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

    const entityFaction = this._entity.faction || "neutral";
    // Check all other ants for enemies
    for (let i = 0; i < ants.length; i++) {
      if (!ants[i] || ants[i] === this._entity) continue;
      
      const otherAnt = ants[i];
      
      // Skip if same faction or either is neutral
      if (otherAnt.faction === entityFaction || 
          entityFaction === "neutral" || 
          otherAnt.faction === "neutral") {
        continue;
      }


      // Check distance
      const distance = this.calculateDistance(this._entity, otherAnt);

      if (distance <= this._detectionRadius) {
        this._nearbyEnemies.push(otherAnt);
      }
    }

    // Focus on attacking ants before buildings
    if( this._nearbyEnemies.length > 0){return;}

    // Detect buildings
    for (let i = 0; i < Buildings.length; i++) {
      const building = Buildings[i];
      if (!building) continue;
      if (building.faction === entityFaction || entityFaction === "neutral" || building.faction === "neutral") {
        continue;
      }

      const distance = this.calculateDistance(this._entity, building);
      if (distance <= this._detectionRadius) {
        this._nearbyEnemies.push(building);
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