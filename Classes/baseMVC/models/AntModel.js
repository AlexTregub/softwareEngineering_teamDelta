/**
 * AntModel.js
 * 
 * Ant-specific data model extending EntityModel.
 * Stores all ant-specific state including combat, systems, timing, and job data.
 * 
 * TDD Implementation: Phase 2 - Ant MVC Conversion
 * Test Coverage: 60+ tests ensuring complete functional parity with ant class
 */

// Node.js: Load EntityModel
if (typeof require !== 'undefined' && typeof module !== 'undefined' && module.exports) {
  const EntityModel = require('./EntityModel');
  // Make it available in this module's scope
  global.EntityModel = EntityModel;
}

// Global ant index counter for unique ant IDs
let globalAntIndex = 0;

class AntModel extends EntityModel {
  constructor(x, y, width, height, options = {}) {
    super(x, y, width, height, { ...options, type: 'Ant' });
    
    // Ant Identity
    this._antIndex = globalAntIndex++;
    this._jobName = options.jobName || 'Worker'; // Default to Worker (most common)
    
    // Movement Properties
    this._movementSpeed = options.movementSpeed !== undefined ? options.movementSpeed : 1;
    
    // System References
    this._brain = null;
    this._stateMachine = null;
    this._gatherState = null;
    this._resourceManager = null;
    this._stats = null;
    this._jobComponent = null;
    
    // Combat Properties
    this._health = options.health !== undefined ? options.health : 100;
    this._maxHealth = options.maxHealth !== undefined ? options.maxHealth : 100;
    this._damage = options.damage !== undefined ? options.damage : 10;
    this._attackRange = options.attackRange !== undefined ? options.attackRange : 50;
    
    // Enemy Tracking
    this._enemies = [];
    this._combatTarget = null;
    this._lastEnemyCheck = 0;
    this._enemyCheckInterval = options.enemyCheckInterval !== undefined ? options.enemyCheckInterval : 60;
    
    // Dropoff System
    this._targetDropoff = null;
    
    // Timing Properties
    this._idleTimer = 0;
    this._idleTimerTimeout = options.idleTimerTimeout !== undefined ? options.idleTimerTimeout : 300;
    this._lastFrameTime = 0;
    
    // Path Type
    this._pathType = null;
    
    // Box Hover State
    this._boxHovered = false;
    
    // Job Stats
    this._jobStats = null;
  }
  
  // ===== Ant Identity =====
  
  getAntIndex() {
    return this._antIndex;
  }
  
  getJobName() {
    return this._jobName;
  }
  
  setJobName(jobName) {
    if (typeof jobName !== 'string') {
      throw new Error('Job name must be a string');
    }
    if (jobName.trim() === '') {
      throw new Error('Job name cannot be empty');
    }
    
    const oldValue = this._jobName;
    this._jobName = jobName;
    this.emit('jobNameChanged', { oldValue, newValue: jobName });
  }
  
  // ===== Movement Properties =====
  
  getMovementSpeed() {
    return this._movementSpeed;
  }
  
  setMovementSpeed(speed) {
    if (typeof speed !== 'number' || speed < 0) {
      throw new Error('Movement speed must be a non-negative number');
    }
    
    const oldValue = this._movementSpeed;
    this._movementSpeed = speed;
    this.emit('movementSpeedChanged', { oldValue, newValue: speed });
  }
  
  // ===== System References =====
  
  getBrain() {
    return this._brain;
  }
  
  setBrain(brain) {
    const oldValue = this._brain;
    this._brain = brain;
    this.emit('brainChanged', { oldValue, newValue: brain });
  }
  
  getStateMachine() {
    return this._stateMachine;
  }
  
  setStateMachine(stateMachine) {
    const oldValue = this._stateMachine;
    this._stateMachine = stateMachine;
    this.emit('stateMachineChanged', { oldValue, newValue: stateMachine });
  }
  
  // State machine delegation methods
  getCurrentState() {
    return this._stateMachine?.getCurrentState() || 'IDLE';
  }
  
  setState(newState) {
    if (!this._stateMachine) {
      console.warn('Cannot set state: state machine not initialized');
      return false;
    }
    return this._stateMachine.setState(newState);
  }
  
  getGatherState() {
    return this._gatherState;
  }
  
  setGatherState(gatherState) {
    const oldValue = this._gatherState;
    this._gatherState = gatherState;
    this.emit('gatherStateChanged', { oldValue, newValue: gatherState });
  }
  
  getResourceManager() {
    return this._resourceManager;
  }
  
  setResourceManager(resourceManager) {
    const oldValue = this._resourceManager;
    this._resourceManager = resourceManager;
    this.emit('resourceManagerChanged', { oldValue, newValue: resourceManager });
  }
  
  getStatsContainer() {
    return this._stats;
  }
  
  setStatsContainer(stats) {
    const oldValue = this._stats;
    this._stats = stats;
    this.emit('statsChanged', { oldValue, newValue: stats });
  }
  
  getJobComponent() {
    return this._jobComponent;
  }
  
  setJobComponent(jobComponent) {
    const oldValue = this._jobComponent;
    this._jobComponent = jobComponent;
    this.emit('jobComponentChanged', { oldValue, newValue: jobComponent });
  }
  
  // ===== Combat Properties =====
  
  getHealth() {
    return this._health;
  }
  
  setHealth(health) {
    if (typeof health !== 'number') {
      throw new Error('Health must be a number');
    }
    
    // Clamp health to 0-maxHealth range
    const clampedHealth = Math.max(0, Math.min(health, this._maxHealth));
    const oldValue = this._health;
    this._health = clampedHealth;
    this.emit('healthChanged', { oldValue, newValue: clampedHealth });
    
    // Auto-deactivate when health reaches 0
    if (clampedHealth <= 0 && this.isActive()) {
      this.setActive(false);
    }
  }
  
  getMaxHealth() {
    return this._maxHealth;
  }
  
  setMaxHealth(maxHealth) {
    if (typeof maxHealth !== 'number' || maxHealth <= 0) {
      throw new Error('Max health must be a positive number');
    }
    
    const oldValue = this._maxHealth;
    this._maxHealth = maxHealth;
    
    // Clamp current health if it exceeds new max
    if (this._health > maxHealth) {
      this._health = maxHealth;
    }
    
    this.emit('maxHealthChanged', { oldValue, newValue: maxHealth });
  }
  
  getDamage() {
    return this._damage;
  }
  
  /**
   * Get attack damage (alias for getDamage for API consistency)
   * @returns {number} Attack damage
   */
  getAttackDamage() {
    return this._damage;
  }
  
  setDamage(damage) {
    if (typeof damage !== 'number' || damage < 0) {
      throw new Error('Damage must be a non-negative number');
    }
    
    const oldValue = this._damage;
    this._damage = damage;
    this.emit('damageChanged', { oldValue, newValue: damage });
  }
  
  getAttackRange() {
    return this._attackRange;
  }
  
  setAttackRange(range) {
    const oldValue = this._attackRange;
    this._attackRange = range;
    this.emit('attackRangeChanged', { oldValue, newValue: range });
  }
  
  // ===== Enemy Tracking =====
  
  getEnemies() {
    // Return copy for immutability
    return [...this._enemies];
  }
  
  addEnemy(enemy) {
    if (!this._enemies.includes(enemy)) {
      this._enemies.push(enemy);
      this.emit('enemiesChanged', { action: 'add', enemy });
    }
  }
  
  removeEnemy(enemy) {
    const index = this._enemies.indexOf(enemy);
    if (index !== -1) {
      this._enemies.splice(index, 1);
      this.emit('enemiesChanged', { action: 'remove', enemy });
    }
  }
  
  clearEnemies() {
    const oldEnemies = [...this._enemies];
    this._enemies = [];
    this.emit('enemiesChanged', { action: 'clear', oldEnemies });
  }
  
  getCombatTarget() {
    return this._combatTarget;
  }
  
  setCombatTarget(target) {
    const oldValue = this._combatTarget;
    this._combatTarget = target;
    this.emit('combatTargetChanged', { oldValue, newValue: target });
  }
  
  getLastEnemyCheck() {
    return this._lastEnemyCheck;
  }
  
  setLastEnemyCheck(frameCount) {
    this._lastEnemyCheck = frameCount;
  }
  
  getEnemyCheckInterval() {
    return this._enemyCheckInterval;
  }
  
  setEnemyCheckInterval(interval) {
    this._enemyCheckInterval = interval;
  }
  
  // ===== Dropoff System =====
  
  getTargetDropoff() {
    return this._targetDropoff;
  }
  
  setTargetDropoff(dropoff) {
    const oldValue = this._targetDropoff;
    this._targetDropoff = dropoff;
    this.emit('targetDropoffChanged', { oldValue, newValue: dropoff });
  }
  
  // ===== Timing Properties =====
  
  getIdleTimer() {
    return this._idleTimer;
  }
  
  setIdleTimer(timer) {
    if (typeof timer !== 'number') {
      throw new Error('Idle timer must be a number');
    }
    this._idleTimer = timer;
  }
  
  getIdleTimerTimeout() {
    return this._idleTimerTimeout;
  }
  
  setIdleTimerTimeout(timeout) {
    if (typeof timeout !== 'number') {
      throw new Error('Idle timer timeout must be a number');
    }
    this._idleTimerTimeout = timeout;
  }
  
  getLastFrameTime() {
    return this._lastFrameTime;
  }
  
  setLastFrameTime(time) {
    if (typeof time !== 'number') {
      throw new Error('Last frame time must be a number');
    }
    this._lastFrameTime = time;
  }
  
  // ===== Path Type =====
  
  getPathType() {
    return this._pathType;
  }
  
  setPathType(pathType) {
    this._pathType = pathType;
  }
  
  // ===== Box Hover State =====
  
  isBoxHovered() {
    return this._boxHovered;
  }
  
  setBoxHovered(hovered) {
    const oldValue = this._boxHovered;
    this._boxHovered = hovered;
    this.emit('boxHoverChanged', { oldValue, newValue: hovered });
  }
  
  // ===== Job Stats Integration =====
  
  setJobStats(stats) {
    if (stats && typeof stats !== 'object') {
      throw new Error('Job stats must be an object');
    }
    
    const oldValue = this._jobStats;
    this._jobStats = stats;
    this.emit('jobStatsChanged', { oldValue, newValue: stats });
  }
  
  getJobStats() {
    // Return default stats if not set
    if (!this._jobStats) {
      return { 
        resourcesGathered: 0, 
        distanceTraveled: 0, 
        enemiesDefeated: 0 
      };
    }
    
    // Return copy for immutability
    return { ...this._jobStats };
  }
}

// Node.js export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AntModel;
}

// Browser global export
if (typeof window !== 'undefined') {
  window.AntModel = AntModel;
}
