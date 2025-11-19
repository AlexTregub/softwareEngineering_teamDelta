/**
 * @fileoverview AntModel - Pure data storage for ant entities
 * Extends EntityModel with ant-specific properties
 * 
 * CRITICAL: This is a MODEL - ONLY data storage, NO logic, NO rendering
 * 
 * Ant-Specific Properties:
 * - Identity: _antIndex, _JobName, type, jobName, faction, enemies
 * - Health: _health, _maxHealth
 * - Combat: _damage, _attackRange, _combatTarget, _attackCooldown, _lastEnemyCheck
 * - Resources: capacity, resourceCount
 * - Stats: strength, gatherSpeed, movementSpeed
 * - State: primaryState, combatModifier, terrainModifier, preferredState
 * - Job: job reference, jobImagePath
 * - Timers: _idleTimer, _idleTimerTimeout
 * - Flags: isBoxHovered
 * - Components: brain, stateMachine, gatherState, resourceManager
 * 
 * @extends EntityModel
 * @author Software Engineering Team Delta
 * @version 1.0.0
 */

const EntityModel = require('./EntityModel.js');

class AntModel extends EntityModel {
  /**
   * Create an AntModel with ant-specific properties
   * @param {Object} options - Configuration options
   * @param {number} options.antIndex - Unique ant identifier
   * @param {string} options.jobName - Job type (Builder, Scout, Farmer, Warrior, Spitter, etc.)
   * @param {string} options.type - Entity type ('Ant' or 'Queen')
   * @param {string} options.faction - Faction identifier
   * @param {Array<string>} options.enemies - Enemy faction identifiers
   * @param {number} options.health - Current health
   * @param {number} options.maxHealth - Maximum health
   * @param {number} options.damage - Attack damage
   * @param {number} options.attackRange - Attack range in pixels
   * @param {Object} options.combatTarget - Current combat target
   * @param {number} options.attackCooldown - Attack cooldown in frames
   * @param {number} options.lastEnemyCheck - Last enemy check timestamp
   * @param {number} options.capacity - Resource carrying capacity
   * @param {number} options.resourceCount - Current resource count
   * @param {number} options.strength - Strength stat
   * @param {number} options.gatherSpeed - Gather speed stat
   * @param {number} options.movementSpeed - Movement speed stat
   * @param {string} options.primaryState - Primary state (IDLE, GATHERING, etc.)
   * @param {string} options.combatModifier - Combat modifier (OUT_OF_COMBAT, IN_COMBAT, etc.)
   * @param {string} options.terrainModifier - Terrain modifier (DEFAULT, IN_WATER, etc.)
   * @param {string} options.preferredState - Preferred state to resume after IDLE
   * @param {Object} options.job - Job component reference
   * @param {string} options.jobImagePath - Path to job sprite image
   * @param {number} options.idleTimer - Idle timer value
   * @param {number} options.idleTimerTimeout - Idle timeout threshold
   * @param {boolean} options.isBoxHovered - Box hover flag
   * @param {Object} options.brain - AntBrain component reference
   * @param {Object} options.stateMachine - AntStateMachine component reference
   * @param {Object} options.gatherState - GatherState component reference
   * @param {Object} options.resourceManager - ResourceManager component reference
   */
  constructor(options = {}) {
    // Call EntityModel constructor
    super(options);

    // Identity properties
    this._antIndex = options.antIndex !== undefined ? options.antIndex : null;
    this._JobName = options.jobName || null;
    this._type = options.type || 'Ant';
    this._jobName = options.jobName || null; // Display name
    this._faction = options.faction || 'friendly';
    this._enemies = Array.isArray(options.enemies) ? [...options.enemies] : [];

    // Health properties
    this._health = options.health !== undefined ? options.health : 100;
    this._maxHealth = options.maxHealth !== undefined ? options.maxHealth : 100;

    // Combat properties
    this._damage = options.damage !== undefined ? options.damage : 10;
    this._attackRange = options.attackRange !== undefined ? options.attackRange : 50;
    this._combatTarget = options.combatTarget !== undefined ? options.combatTarget : null;
    this._attackCooldown = options.attackCooldown !== undefined ? options.attackCooldown : 0;
    this._lastEnemyCheck = options.lastEnemyCheck !== undefined ? options.lastEnemyCheck : 0;

    // Resource properties
    this._capacity = options.capacity !== undefined ? options.capacity : 10;
    this._resourceCount = options.resourceCount !== undefined ? options.resourceCount : 0;

    // Stats properties
    this._strength = options.strength !== undefined ? options.strength : 15;
    this._gatherSpeed = options.gatherSpeed !== undefined ? options.gatherSpeed : 10;
    this._movementSpeed = options.movementSpeed !== undefined ? options.movementSpeed : 60;

    // State properties
    this._primaryState = options.primaryState || 'IDLE';
    this._combatModifier = options.combatModifier || 'OUT_OF_COMBAT';
    this._terrainModifier = options.terrainModifier || 'DEFAULT';
    this._preferredState = options.preferredState || 'GATHERING';

    // Job properties
    this._job = options.job !== undefined ? options.job : null;
    this._jobImagePath = options.jobImagePath || null;

    // Timer properties
    this._idleTimer = options.idleTimer !== undefined ? options.idleTimer : 0;
    this._idleTimerTimeout = options.idleTimerTimeout !== undefined ? options.idleTimerTimeout : 300;

    // Flag properties
    this._isBoxHovered = options.isBoxHovered !== undefined ? options.isBoxHovered : false;

    // Component references
    this._brain = options.brain !== undefined ? options.brain : null;
    this._stateMachine = options.stateMachine !== undefined ? options.stateMachine : null;
    this._gatherState = options.gatherState !== undefined ? options.gatherState : null;
    this._resourceManager = options.resourceManager !== undefined ? options.resourceManager : null;
  }

  // ============================================================================
  // Identity Getters/Setters
  // ============================================================================

  getAntIndex() { return this._antIndex; }
  setAntIndex(value) { this._antIndex = value; }

  getJobName() { return this._JobName; }
  setJobName(value) { this._JobName = value; this._jobName = value; }

  getType() { return this._type; }
  setType(value) { this._type = value; }

  getFaction() { return this._faction; }
  setFaction(value) { this._faction = value; }

  getEnemies() { return [...this._enemies]; } // Return copy
  setEnemies(value) { this._enemies = Array.isArray(value) ? [...value] : []; }

  // ============================================================================
  // Health Getters/Setters
  // ============================================================================

  getHealth() { return this._health; }
  setHealth(value) { this._health = value; }

  getMaxHealth() { return this._maxHealth; }
  setMaxHealth(value) { this._maxHealth = value; }

  getHealthPercentage() {
    if (this._maxHealth === 0) return 0;
    return this._health / this._maxHealth;
  }

  isAlive() { return this._health > 0; }

  // ============================================================================
  // Combat Getters/Setters
  // ============================================================================

  getDamage() { return this._damage; }
  setDamage(value) { this._damage = value; }

  getAttackRange() { return this._attackRange; }
  setAttackRange(value) { this._attackRange = value; }

  getCombatTarget() { return this._combatTarget; }
  setCombatTarget(value) { this._combatTarget = value; }

  hasCombatTarget() { return this._combatTarget !== null; }
  clearCombatTarget() { this._combatTarget = null; }

  getAttackCooldown() { return this._attackCooldown; }
  setAttackCooldown(value) { this._attackCooldown = value; }

  isAttackReady() { return this._attackCooldown <= 0; }

  getLastEnemyCheck() { return this._lastEnemyCheck; }
  setLastEnemyCheck(value) { this._lastEnemyCheck = value; }

  // ============================================================================
  // Resource Getters/Setters
  // ============================================================================

  getCapacity() { return this._capacity; }
  setCapacity(value) { this._capacity = value; }
  
  // Aliases for clarity
  getResourceCapacity() { return this._capacity; }
  setResourceCapacity(value) { this._capacity = value; }

  getResourceCount() { return this._resourceCount; }
  setResourceCount(value) { this._resourceCount = value; }

  isAtMaxCapacity() { return this._resourceCount >= this._capacity; }
  getRemainingCapacity() { return this._capacity - this._resourceCount; }

  // ============================================================================
  // Stats Getters/Setters
  // ============================================================================

  getStrength() { return this._strength; }
  setStrength(value) { this._strength = value; }

  getGatherSpeed() { return this._gatherSpeed; }
  setGatherSpeed(value) { this._gatherSpeed = value; }

  getMovementSpeed() { return this._movementSpeed; }
  setMovementSpeed(value) { this._movementSpeed = value; }

  getStats() {
    return {
      strength: this._strength,
      gatherSpeed: this._gatherSpeed,
      movementSpeed: this._movementSpeed
    };
  }

  // Get job stats (includes all stats)
  getJobStats() {
    return {
      strength: this._strength,
      health: this._maxHealth,
      gatherSpeed: this._gatherSpeed,
      movementSpeed: this._movementSpeed
    };
  }

  // Set job stats (for controller to update after job change)
  setJobStats(stats) {
    if (stats.strength !== undefined) this._strength = stats.strength;
    if (stats.health !== undefined) this._maxHealth = stats.health;
    if (stats.gatherSpeed !== undefined) this._gatherSpeed = stats.gatherSpeed;
    if (stats.movementSpeed !== undefined) this._movementSpeed = stats.movementSpeed;
  }

  // ============================================================================
  // State Getters/Setters
  // ============================================================================

  getPrimaryState() { return this._primaryState; }
  setPrimaryState(value) { this._primaryState = value; }

  // Alias for state (for controller compatibility)
  getState() { return this._primaryState; }
  setState(value) { this._primaryState = value; }

  getCombatModifier() { return this._combatModifier; }
  setCombatModifier(value) { this._combatModifier = value; }

  getTerrainModifier() { return this._terrainModifier; }
  setTerrainModifier(value) { this._terrainModifier = value; }

  getPreferredState() { return this._preferredState; }
  setPreferredState(value) { this._preferredState = value; }

  // ============================================================================
  // Job Getters/Setters
  // ============================================================================

  getJob() { return this._job; }
  setJob(value) { this._job = value; }

  getJobImagePath() { return this._jobImagePath; }
  setJobImagePath(value) { this._jobImagePath = value; }

  // ============================================================================
  // Timer Getters/Setters
  // ============================================================================

  getIdleTimer() { return this._idleTimer; }
  setIdleTimer(value) { this._idleTimer = value; }

  getIdleTimerTimeout() { return this._idleTimerTimeout; }
  setIdleTimerTimeout(value) { this._idleTimerTimeout = value; }

  isIdleTimeoutExceeded() { return this._idleTimer > this._idleTimerTimeout; }
  resetIdleTimer() { this._idleTimer = 0; }

  // ============================================================================
  // Flag Getters/Setters
  // ============================================================================

  isBoxHovered() { return this._isBoxHovered; }
  getIsBoxHovered() { return this._isBoxHovered; } // Alias for consistency
  setIsBoxHovered(value) { this._isBoxHovered = value; }
  setBoxHovered(value) { this._isBoxHovered = value; } // Keep both

  // Selection (from EntityModel base, but add aliases for clarity)
  getSelected() { return this.selected; }
  setSelected(value) { this.selected = value; }

  // ============================================================================
  // Component Reference Getters/Setters
  // ============================================================================

  getBrain() { return this._brain; }
  setBrain(value) { this._brain = value; }

  getStateMachine() { return this._stateMachine; }
  setStateMachine(value) { this._stateMachine = value; }

  getGatherState() { return this._gatherState; }
  setGatherState(value) { this._gatherState = value; }

  getResourceManager() { return this._resourceManager; }
  setResourceManager(value) { this._resourceManager = value; }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AntModel;
}

// Make available globally for browser
if (typeof window !== 'undefined') {
  window.AntModel = AntModel;
}
