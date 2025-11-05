/**
 * BuildingModel
 * -------------
 * Model class for game buildings (Colonies, Storage, Spawners).
 * 
 * Extends BaseModel to provide:
 * - Position and size management
 * - Health system (damage, healing, death)
 * - Faction management
 * - Spawn configuration (timer, interval, count)
 * - Upgrade system (level progression)
 * - Serialization support
 * 
 * Responsibilities:
 * - Store building data and state
 * - Implement building logic (health, spawning, upgrading)
 * - Notify listeners when data changes
 * - NO rendering
 * - NO input handling
 * 
 * Usage:
 * ```javascript
 * const model = new BuildingModel(100, 100, 91, 97, {
 *   type: 'antcone',
 *   faction: 'player',
 *   spawnEnabled: true,
 *   spawnInterval: 10,
 *   spawnCount: 1
 * });
 * 
 * model.addChangeListener((property, data) => {
 *   if (property === 'health') console.log('Health changed:', data);
 *   if (property === 'spawn') console.log('Spawn triggered:', data);
 * });
 * 
 * model.takeDamage(30); // Notifies 'health' change
 * model.update(1.5); // Updates spawn timer
 * ```
 */

// Load dependencies (Node.js require, or use global in browser)
const BaseModel = (typeof require !== 'undefined') ? require('./BaseModel') : window.BaseModel;
const CollisionBox2D = (typeof require !== 'undefined') ? require('../systems/CollisionBox2D') : window.CollisionBox2D;

class BuildingModel extends BaseModel {
  /**
   * Construct a building model.
   * @param {number} x - X position in world space
   * @param {number} y - Y position in world space
   * @param {number} width - Building width
   * @param {number} height - Building height
   * @param {Object} [options={}] - Building configuration
   * @param {string} [options.type='antcone'] - Building type (antcone, anthill, hivesource)
   * @param {string} [options.faction='neutral'] - Faction (player, enemy, neutral)
   * @param {number} [options.health=100] - Current health
   * @param {number} [options.maxHealth=100] - Maximum health
   * @param {boolean} [options.spawnEnabled=false] - Whether spawning is enabled
   * @param {number} [options.spawnInterval=10] - Seconds between spawns
   * @param {number} [options.spawnCount=1] - Number of units per spawn
   * @param {Object} [options.upgradeTree=null] - Upgrade progression tree
   */
  constructor(x, y, width, height, options = {}) {
    super();
    
    // Position and size
    this._position = { x, y };
    this._size = { width, height };
    
    // Building type and faction
    this._type = options.type || 'antcone';
    this._faction = options.faction || 'neutral';
    
    // Health system
    this._health = options.health || 100;
    this._maxHealth = options.maxHealth || 100;
    
    // Spawn system
    this._spawnEnabled = options.spawnEnabled || false;
    this._spawnInterval = options.spawnInterval || 10;
    this._spawnCount = options.spawnCount || 1;
    this._spawnTimer = 0;
    
    // Upgrade system
    this._upgradeTree = options.upgradeTree || null;
    this._currentLevel = 0;
  }
  
  // --- Position and Size ---
  
  /**
   * Get building position.
   * @returns {{x: number, y: number}} Position in world space
   */
  get position() {
    return this._position;
  }
  
  /**
   * Get building size.
   * @returns {{width: number, height: number}} Size
   */
  get size() {
    return this._size;
  }
  
  // --- Type and Faction ---
  
  /**
   * Get building type.
   * @returns {string} Building type
   */
  get type() {
    return this._type;
  }
  
  /**
   * Get building faction.
   * @returns {string} Faction
   */
  get faction() {
    return this._faction;
  }
  
  // --- Health System ---
  
  /**
   * Get current health.
   * @returns {number} Health amount
   */
  get health() {
    return this._health;
  }
  
  /**
   * Get maximum health.
   * @returns {number} Max health amount
   */
  get maxHealth() {
    return this._maxHealth;
  }
  
  /**
   * Check if building is dead.
   * @returns {boolean} True if health is 0
   */
  get isDead() {
    return this._health <= 0;
  }
  
  /**
   * Apply damage to building.
   * Notifies 'health' change.
   * Notifies 'died' event if health reaches 0.
   * 
   * @param {number} amount - Damage amount
   * @returns {number} New health value
   */
  takeDamage(amount) {
    const oldHealth = this._health;
    this._health = Math.max(0, this._health - amount);
    this._notifyChange('health', this._health);
    
    if (this._health <= 0 && oldHealth > 0) {
      this._notifyChange('died', true);
    }
    
    return this._health;
  }
  
  /**
   * Heal building.
   * Notifies 'health' change.
   * 
   * @param {number} amount - Heal amount
   * @returns {number} New health value
   */
  heal(amount) {
    this._health = Math.min(this._maxHealth, this._health + amount);
    this._notifyChange('health', this._health);
    return this._health;
  }
  
  // --- Spawn System ---
  
  /**
   * Get spawn configuration.
   * @returns {Object} Spawn config with enabled, interval, count, timer
   */
  get spawnConfig() {
    return {
      enabled: this._spawnEnabled,
      interval: this._spawnInterval,
      count: this._spawnCount,
      timer: this._spawnTimer
    };
  }
  
  /**
   * Update spawn timer.
   * Notifies 'spawn' event when timer exceeds interval.
   * 
   * @param {number} deltaTime - Time elapsed in seconds
   */
  updateSpawnTimer(deltaTime) {
    if (!this._spawnEnabled) return;
    
    this._spawnTimer += deltaTime;
    
    if (this._spawnTimer >= this._spawnInterval) {
      this._spawnTimer -= this._spawnInterval;
      this._notifyChange('spawn', this._spawnCount);
    }
  }
  
  // --- Upgrade System ---
  
  /**
   * Check if building can be upgraded.
   * 
   * @param {number} resources - Available resources
   * @returns {boolean} True if upgrade is possible
   */
  canUpgrade(resources) {
    if (!this._upgradeTree) return false;
    if (!this._upgradeTree.progressions) return false;
    
    const nextLevel = this._currentLevel + 1;
    const next = this._upgradeTree.progressions[nextLevel];
    
    if (!next) return false;
    if (!next.cost) return false;
    
    return resources >= next.cost;
  }
  
  /**
   * Apply upgrade to building.
   * Increases level, improves spawn stats.
   * Notifies 'upgraded' event.
   * 
   * @returns {boolean} True if upgrade succeeded
   */
  applyUpgrade() {
    if (!this._upgradeTree) return false;
    if (!this._upgradeTree.progressions) return false;
    
    const nextLevel = this._currentLevel + 1;
    const next = this._upgradeTree.progressions[nextLevel];
    
    if (!next) return false;
    
    this._currentLevel = nextLevel;
    this._upgradeTree = next;
    this._spawnInterval = Math.max(1, this._spawnInterval - 1);
    this._spawnCount += 1;
    
    this._notifyChange('upgraded', this._currentLevel);
    
    return true;
  }
  
  // --- Lifecycle ---
  
  /**
   * Update building state.
   * Updates spawn timer if spawning enabled.
   * 
   * @param {number} deltaTime - Time elapsed in seconds
   */
  update(deltaTime) {
    this.updateSpawnTimer(deltaTime);
  }
  
  // --- Serialization ---
  
  /**
   * Serialize building to JSON.
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      ...super.toJSON(),
      position: this._position,
      size: this._size,
      type: this._type,
      faction: this._faction,
      health: this._health,
      maxHealth: this._maxHealth,
      spawnConfig: this.spawnConfig,
      currentLevel: this._currentLevel
    };
  }
}

// Export for Node.js testing and browser usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BuildingModel;
}

if (typeof window !== 'undefined') {
  window.BuildingModel = BuildingModel;
}
