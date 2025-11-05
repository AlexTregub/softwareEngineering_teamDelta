/**
 * @file AntModel.js
 * @description Data model for ant entities (Phase 3.1 - MVC Refactoring)
 * 
 * AntModel contains:
 * - Identity (antIndex, jobName, name, faction, type)
 * - Position & Movement (position, size, rotation, movementSpeed)
 * - Health System (health, maxHealth, damage, attackRange)
 * - Combat System (combatTarget, enemies, attack logic)
 * - Resource System (ResourceManager integration)
 * - State Machine (AntStateMachine integration)
 * - Job System (JobComponent integration)
 * - Behavior System (GatherState integration)
 * 
 * @extends BaseModel
 */

// Load dependencies (Node.js require, or use global in browser)
const BaseModel = (typeof require !== 'undefined') ? require('./BaseModel') : window.BaseModel;
const JobComponent = (typeof require !== 'undefined') ? require('../ants/JobComponent') : window.JobComponent;
const AntStateMachine = (typeof require !== 'undefined') ? require('../ants/antStateMachine') : window.AntStateMachine;
const ResourceManager = (typeof require !== 'undefined') ? require('../managers/ResourceManager') : window.ResourceManager;
const StatsContainer = (typeof require !== 'undefined') ? require('../containers/StatsContainer') : window.StatsContainer;

// Note: GatherState will be integrated later

// Global ant index counter (auto-increment)
let nextAntIndex = 0;

class AntModel extends BaseModel {
  /**
   * Constructor
   * @param {number} x - X position in world coordinates
   * @param {number} y - Y position in world coordinates
   * @param {number} width - Width in pixels
   * @param {number} height - Height in pixels
   * @param {Object} options - Configuration options
   * @param {number} options.antIndex - Unique ant ID (auto-increments if not provided)
   * @param {string} options.jobName - Job type (Scout, Farmer, Builder, Warrior, Spitter, Queen, DeLozier)
   * @param {string} options.name - Display name (default: "Anty")
   * @param {string} options.faction - Faction (player, enemy, neutral)
   * @param {number} options.rotation - Initial rotation angle
   * @param {number} options.movementSpeed - Movement speed (default: 60)
   * @param {number} options.health - Initial health (default: 100)
   * @param {number} options.maxHealth - Maximum health (default: 100)
   * @param {number} options.damage - Attack damage (default: 10)
   * @param {number} options.attackRange - Attack range in pixels (default: 50)
   * @param {string} options.jobImage - Job-specific image path
   */
  constructor(x, y, width, height, options = {}) {
    super();
    
    // ========================================
    // Identity & Type
    // ========================================
    this._antIndex = options.antIndex !== undefined ? options.antIndex : nextAntIndex++;
    this._jobName = options.jobName || 'Scout';
    this._name = options.name || 'Anty';
    this._faction = options.faction || 'neutral';
    this._type = (this._jobName === 'Queen') ? 'Queen' : 'Ant';
    
    // ========================================
    // Position & Size
    // ========================================
    this._position = { x, y };
    this._size = { width, height };
    this._rotation = options.rotation || 0;
    
    // ========================================
    // Movement
    // ========================================
    this._movementSpeed = options.movementSpeed || 60;
    this._isMoving = false;
    this._targetPosition = null;
    this._path = null;
    this._pathType = options.pathType || null;
    
    // ========================================
    // Health System (store custom bonuses separately)
    // ========================================
    // Store custom values as bonuses to apply AFTER job stats
    this._customHealthBonus = options.health !== undefined ? options.health - 100 : 0; // Bonus relative to default 100
    this._customMaxHealthBonus = options.maxHealth !== undefined ? options.maxHealth - 100 : 0; // Bonus relative to default 100
    this._isFirstJobApplication = true; // Track if job stats applied yet (for health bonus logic)
    
    // Initialize with defaults (will be overwritten by job stats, then bonuses applied)
    this._health = 100;
    this._maxHealth = 100;
    this._damage = options.damage !== undefined ? options.damage : 10;
    this._attackRange = options.attackRange !== undefined ? options.attackRange : 50;
    
    // ========================================
    // Combat System
    // ========================================
    this._combatTarget = null;
    this._enemies = [];
    this._lastEnemyCheck = 0;
    this._enemyCheckInterval = 30;
    
    // ========================================
    // State & Lifecycle
    // ========================================
    this._isActive = true;
    
    // ========================================
    // Components (composition over inheritance)
    // ========================================
    this._jobComponent = new JobComponent(this._jobName, options.jobImage);
    this._stateMachine = new AntStateMachine();
    
    // ResourceManager integration (capacity: 2 slots, collectionRange: 25 pixels)
    this._resourceManager = new ResourceManager(this, 2, 25);
    
    // GatherState integration for autonomous resource collection
    this._gatherState = (typeof GatherState !== 'undefined') ? new GatherState(this) : null;
    
    // StatsContainer (keep for compatibility)
    this._statsContainer = null; // TODO: new StatsContainer(...);
    
    // ========================================
    // Behavior
    // ========================================
    this._targetDropoff = null;
    this._idleTimer = 0;
    this._idleTimerTimeout = 1;
    
    // ========================================
    // Initialize job stats
    // ========================================
    this._applyJobStats(this._jobComponent.stats);
    
    // ========================================
    // State machine callback
    // ========================================
    this._stateMachine.setStateChangeCallback((oldState, newState) => {
      this._onStateChange(oldState, newState);
    });
  }
  
  // ========================================
  // Getters (read-only access)
  // ========================================
  
  get antIndex() { return this._antIndex; }
  get jobName() { return this._jobName; }
  get name() { return this._name; }
  get faction() { return this._faction; }
  get type() { return this._type; }
  
  get position() { return this._position; }
  get size() { return this._size; }
  get rotation() { return this._rotation; }
  
  get health() { return this._health; }
  get maxHealth() { return this._maxHealth; }
  get damage() { return this._damage; }
  get attackRange() { return this._attackRange; }
  get isDead() { return this._health <= 0; }
  
  get movementSpeed() { return this._movementSpeed; }
  get isMoving() { return this._isMoving; }
  get targetPosition() { return this._targetPosition; }
  
  get combatTarget() { return this._combatTarget; }
  get enemies() { return this._enemies; }
  
  get stateMachine() { return this._stateMachine; }
  get resourceManager() { return this._resourceManager; }
  get gatherState() { return this._gatherState; }
  get jobComponent() { return this._jobComponent; }
  get statsContainer() { return this._statsContainer; }
  
  get isActive() { return this._isActive; }
  get targetDropoff() { return this._targetDropoff; }
  
  // ========================================
  // Job System Methods
  // ========================================
  
  /**
   * Assign new job to ant
   * @param {string} jobName - Job type (Scout, Farmer, Builder, Warrior, Spitter, Queen, DeLozier)
   * @param {string} image - Job-specific image path
   */
  assignJob(jobName, image) {
    const oldJob = this._jobName;
    this._jobName = jobName;
    this._type = (jobName === 'Queen') ? 'Queen' : 'Ant';
    
    // Update JobComponent
    this._jobComponent = new JobComponent(jobName, image);
    
    // Apply new job stats (preserve current health)
    this._applyJobStats(this._jobComponent.stats);
    
    // Notify listeners
    this._notifyChange('job', { oldJob, newJob: jobName, image });
  }
  
  /**
   * Apply job stats to ant (modifies movement speed, max health, etc.)
   * Job stats are BASE stats, custom values are bonuses added on top
   * First application: Applies custom bonuses as absolute adjustments
   * Subsequent applications: Preserves health percentage when switching jobs
   * @param {Object} stats - Job stats object
   * @private
   */
  _applyJobStats(stats) {
    if (!stats) return;
    
    // Apply movement speed from job
    if (stats.movementSpeed !== undefined) {
      this._movementSpeed = stats.movementSpeed;
    }
    
    // Apply health stats from job as BASE, then add custom bonuses
    if (stats.health !== undefined) {
      if (this._isFirstJobApplication) {
        // FIRST APPLICATION (constructor): Apply custom bonuses as absolute adjustments
        this._isFirstJobApplication = false;
        
        // Set base maxHealth from job stats
        this._maxHealth = stats.health;
        
        // Add custom maxHealth bonus on top of job base
        if (this._customMaxHealthBonus !== undefined && this._customMaxHealthBonus !== 0) {
          this._maxHealth += this._customMaxHealthBonus;
        }
        
        // Set current health: job base + custom health bonus
        this._health = stats.health + this._customHealthBonus;
        
        // Ensure health doesn't exceed maxHealth
        this._health = Math.min(this._health, this._maxHealth);
      } else {
        // SUBSEQUENT APPLICATIONS (job reassignment): Preserve health percentage
        // Calculate current health percentage BEFORE changing maxHealth
        const healthPercentage = this._maxHealth > 0 ? (this._health / this._maxHealth) : 1.0;
        
        // Set base maxHealth from job stats
        this._maxHealth = stats.health;
        
        // Add custom maxHealth bonus on top of job base (carry over from construction)
        if (this._customMaxHealthBonus !== undefined && this._customMaxHealthBonus !== 0) {
          this._maxHealth += this._customMaxHealthBonus;
        }
        
        // Preserve health percentage across job changes
        // This ensures 50/80 Scout becomes 93.75/150 Warrior (both 62.5% health)
        this._health = this._maxHealth * healthPercentage;
        
        // Ensure health doesn't exceed maxHealth
        this._health = Math.min(this._health, this._maxHealth);
      }
    }
    
    // Other stats (strength, gatherSpeed) will be used by controllers/systems
  }
  
  /**
   * Get job stats
   * @returns {Object} Job stats (strength, health, gatherSpeed, movementSpeed)
   */
  getJobStats() {
    return this._jobComponent.stats;
  }
  
  // ========================================
  // Health System Methods
  // ========================================
  
  /**
   * Take damage
   * @param {number} amount - Damage amount
   */
  takeDamage(amount) {
    if (this.isDead) return;
    
    const oldHealth = this._health;
    this._health = Math.max(0, this._health - amount);
    
    // Notify listeners
    this._notifyChange('health', this._health);
    
    // Check for death
    if (this._health === 0) {
      this.die();
    }
  }
  
  /**
   * Heal ant
   * @param {number} amount - Heal amount
   */
  heal(amount) {
    if (this.isDead) return;
    
    const oldHealth = this._health;
    this._health = Math.min(this._maxHealth, this._health + amount);
    
    // Notify listeners
    this._notifyChange('health', this._health);
  }
  
  /**
   * Handle ant death
   */
  die() {
    if (!this._isActive) return; // Already dead
    
    this._health = 0;
    this._isActive = false;
    
    // Clear combat target
    this.setCombatTarget(null);
    
    // Set to IDLE state (DEAD is not a valid state in AntStateMachine)
    this._stateMachine.setState('IDLE');
    
    // Notify listeners
    this._notifyChange('death', { antIndex: this._antIndex });
  }
  
  // ========================================
  // Combat System Methods
  // ========================================
  
  /**
   * Attack target
   * @param {AntModel} target - Target to attack
   */
  attack(target) {
    if (!target || this.isDead) return;
    
    target.takeDamage(this._damage);
  }
  
  /**
   * Set combat target
   * @param {AntModel|null} target - Target to attack (null to clear)
   */
  setCombatTarget(target) {
    this._combatTarget = target;
    this._notifyChange('combatTarget', target);
  }
  
  /**
   * Add enemy to enemies list
   * @param {AntModel} enemy - Enemy ant
   */
  addEnemy(enemy) {
    if (!this._enemies.includes(enemy)) {
      this._enemies.push(enemy);
    }
  }
  
  /**
   * Remove enemy from enemies list
   * @param {AntModel} enemy - Enemy ant
   */
  removeEnemy(enemy) {
    const index = this._enemies.indexOf(enemy);
    if (index !== -1) {
      this._enemies.splice(index, 1);
    }
  }
  
  /**
   * Calculate distance to target
   * @param {AntModel} target - Target ant
   * @returns {number} Distance in pixels
   */
  getDistanceTo(target) {
    const dx = target.position.x - this._position.x;
    const dy = target.position.y - this._position.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  // ========================================
  // Resource System Methods
  // ========================================
  
  /**
   * Add resource to inventory
   * @param {Object} resource - Resource object
   * @returns {boolean} True if added successfully
   */
  addResource(resource) {
    if (!this._resourceManager) return false;
    
    const success = this._resourceManager.addResource(resource);
    if (success) {
      this._notifyChange('resources', { 
        action: 'add', 
        resource, 
        count: this._resourceManager.getCurrentLoad(),
        isFull: this._resourceManager.isAtMaxLoad()
      });
    }
    return success;
  }
  
  /**
   * Remove resource from inventory
   * @param {number} amount - Amount to remove
   * @returns {boolean} True if removed successfully
   */
  removeResource(amount) {
    if (!this._resourceManager) return false;
    
    // ResourceManager doesn't have removeResource(amount), so we drop and re-add
    const currentResources = [...this._resourceManager.resources];
    if (currentResources.length === 0) return false;
    
    const toRemove = Math.min(amount, currentResources.length);
    const removed = currentResources.splice(0, toRemove);
    
    // Clear and re-add remaining
    this._resourceManager.dropAllResources();
    currentResources.forEach(r => this._resourceManager.addResource(r));
    
    this._notifyChange('resources', { 
      action: 'remove', 
      amount: toRemove,
      removed,
      count: this._resourceManager.getCurrentLoad()
    });
    
    return true;
  }
  
  /**
   * Drop all resources
   * @returns {Array} Dropped resources
   */
  dropAllResources() {
    if (!this._resourceManager) return [];
    
    const dropped = this._resourceManager.dropAllResources();
    
    this._notifyChange('resources', { 
      action: 'drop', 
      dropped,
      count: 0
    });
    
    return dropped;
  }
  
  /**
   * Get current resource count
   * @returns {number} Resource count
   */
  getResourceCount() {
    if (!this._resourceManager) return 0;
    return this._resourceManager.getCurrentLoad();
  }
  
  /**
   * Get max resource capacity
   * @returns {number} Max capacity
   */
  getMaxResources() {
    if (!this._resourceManager) return 0;
    return this._resourceManager.maxCapacity;
  }
  
  // ========================================
  // Movement System Methods
  // ========================================
  
  /**
   * Move to target position
   * @param {number} x - Target X position
   * @param {number} y - Target Y position
   */
  moveTo(x, y) {
    this._targetPosition = { x, y };
    this._isMoving = true;
    
    this._notifyChange('movementStart', { target: this._targetPosition });
  }
  
  /**
   * Stop movement
   */
  stopMovement() {
    this._targetPosition = null;
    this._isMoving = false;
    this._path = null;
    
    this._notifyChange('movementStop', {});
  }
  
  /**
   * Set position
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  setPosition(x, y) {
    this._position = { x, y };
    this._notifyChange('position', this._position);
  }
  
  /**
   * Set rotation
   * @param {number} angle - Rotation angle in degrees
   */
  setRotation(angle) {
    this._rotation = angle;
    this._notifyChange('rotation', angle);
  }
  
  // ========================================
  // State Machine Methods
  // ========================================
  
  /**
   * Get current state (primary + modifiers)
   * @returns {string} Current state string
   */
  getCurrentState() {
    return this._stateMachine.getCurrentState();
  }
  
  /**
   * Set state
   * @param {string} primary - Primary state (IDLE, MOVING, GATHERING, etc.)
   * @param {string} combat - Combat modifier (optional)
   * @param {string} terrain - Terrain modifier (optional)
   */
  setState(primary, combat, terrain) {
    this._stateMachine.setState(primary, combat, terrain);
  }
  
  /**
   * State change callback (called by AntStateMachine)
   * @param {string} oldState - Old state
   * @param {string} newState - New state
   * @private
   */
  _onStateChange(oldState, newState) {
    // Notify listeners
    this._notifyChange('state', { oldState, newState });
    
    // Handle dropoff state
    if (newState.includes('DROPPING_OFF')) {
      this._notifyChange('dropoff-start', { oldState, newState });
    }
  }
  
  // ========================================
  // Behavior System Methods
  // ========================================
  
  /**
   * Start gathering behavior
   */
  startGathering() {
    if (this._gatherState) {
      try {
        this._gatherState.enter();
      } catch (e) {
        // GatherState might fail in test environment, but we still want to notify
      }
    }
    this._notifyChange('gatheringStart', {});
  }
  
  /**
   * Stop gathering behavior
   */
  stopGathering() {
    if (this._gatherState) {
      try {
        this._gatherState.exit();
      } catch (e) {
        // GatherState might fail in test environment, but we still want to notify
      }
    }
    this._notifyChange('gatheringStop', {});
  }
  
  /**
   * Check if ant is gathering
   * @returns {boolean} True if gathering
   */
  isGathering() {
    if (this._gatherState) {
      return this._gatherState.isActive;
    }
    return false;
  }
  
  /**
   * Set target dropoff location
   * @param {Object|null} dropoff - Dropoff location (null to clear)
   */
  setTargetDropoff(dropoff) {
    this._targetDropoff = dropoff;
  }
  
  // ========================================
  // Lifecycle Methods
  // ========================================
  
  /**
   * Update ant (called every frame)
   * @param {number} deltaTime - Time since last update (ms)
   */
  update(deltaTime) {
    if (!this._isActive) return;
    
    // Update state machine
    if (this._stateMachine) {
      this._stateMachine.update(deltaTime);
    }
    
    // Update resource manager (checks for nearby resources)
    if (this._resourceManager) {
      this._resourceManager.update();
    }
    
    // TODO: Update other components (GatherState, etc.)
  }
  
  /**
   * Destroy ant and cleanup resources
   */
  destroy() {
    this._isActive = false;
    
    // Clear combat
    this.setCombatTarget(null);
    this._enemies = [];
    
    // Clear state
    this._targetPosition = null;
    this._path = null;
    
    // Notify listeners
    this._notifyChange('destroyed', {});
  }
  
  // ========================================
  // Serialization Methods
  // ========================================
  
  /**
   * Serialize to JSON
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      ...super.toJSON(),
      antIndex: this._antIndex,
      jobName: this._jobName,
      name: this._name,
      faction: this._faction,
      type: this._type,
      position: this._position,
      size: this._size,
      rotation: this._rotation,
      health: this._health,
      maxHealth: this._maxHealth,
      damage: this._damage,
      attackRange: this._attackRange,
      movementSpeed: this._movementSpeed,
      isActive: this._isActive
    };
  }
  
  /**
   * Reconstruct from JSON
   * @param {Object} data - JSON data
   * @returns {AntModel} Reconstructed model
   * @static
   */
  static fromJSON(data) {
    const model = new AntModel(
      data.position.x,
      data.position.y,
      data.size.width,
      data.size.height,
      {
        antIndex: data.antIndex,
        jobName: data.jobName,
        name: data.name,
        faction: data.faction,
        rotation: data.rotation,
        health: data.health,
        maxHealth: data.maxHealth,
        damage: data.damage,
        attackRange: data.attackRange,
        movementSpeed: data.movementSpeed
      }
    );
    
    model._isActive = data.isActive;
    
    return model;
  }
}

// ========================================
// Module Exports
// ========================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AntModel;
}
if (typeof window !== 'undefined') {
  window.AntModel = AntModel;
}
