/**
 * AntController.js
 * 
 * Ant-specific business logic controller extending EntityController.
 * Handles all ant behaviors: job system, resource management, combat,
 * state machine, dropoff, commands, update loop, debug.
 * 
 * TDD Implementation: Phase 2 - Ant MVC Conversion
 * Test Coverage: 80+ tests ensuring complete functional parity with ant class
 */

const EntityController = require('./EntityController');

class AntController extends EntityController {
  constructor(model, view) {
    super(model, view);
    
    // Internal state flags
    this._isGathering = false;
  }
  
  // ===== Job System =====
  
  getJobName() {
    return this.model.getJobName();
  }
  
  assignJob(jobName, image = null, customStats = null) {
    this.model.setJobName(jobName);
    
    // Apply job stats
    const stats = customStats || this._getFallbackJobStats(jobName);
    this._applyJobStats(stats);
    
    // Store stats in model
    this.model.setJobStats(stats);
  }
  
  _applyJobStats(stats) {
    if (stats.maxHealth !== undefined) {
      this.model.setMaxHealth(stats.maxHealth);
    }
    if (stats.health !== undefined) {
      this.model.setHealth(stats.health);
    }
    if (stats.damage !== undefined) {
      this.model.setDamage(stats.damage);
    }
  }
  
  _getFallbackJobStats(jobName) {
    const fallbackStats = {
      'Scout': { strength: 10, health: 100, maxHealth: 100, damage: 5, gatherSpeed: 10, movementSpeed: 100 },
      'Farmer': { strength: 15, health: 120, maxHealth: 120, damage: 8, gatherSpeed: 20, movementSpeed: 80 },
      'Builder': { strength: 20, health: 150, maxHealth: 150, damage: 10, gatherSpeed: 5, movementSpeed: 70 },
      'Soldier': { strength: 25, health: 200, maxHealth: 200, damage: 30, gatherSpeed: 5, movementSpeed: 90 }
    };
    
    return fallbackStats[jobName] || fallbackStats['Scout'];
  }
  
  getJobStats() {
    return this.model.getJobStats();
  }
  
  // ===== Resource Management =====
  
  getResourceCount() {
    const resourceManager = this.model.getResourceManager();
    return resourceManager ? resourceManager.getResourceCount() : 0;
  }
  
  getMaxResources() {
    const resourceManager = this.model.getResourceManager();
    return resourceManager ? resourceManager.getMaxResources() : 0;
  }
  
  addResource(resource) {
    const resourceManager = this.model.getResourceManager();
    return resourceManager ? resourceManager.addResource(resource) : false;
  }
  
  removeResource(amount) {
    const resourceManager = this.model.getResourceManager();
    return resourceManager ? resourceManager.removeResource(amount) : false;
  }
  
  dropAllResources() {
    const resourceManager = this.model.getResourceManager();
    if (resourceManager) {
      resourceManager.dropAllResources();
    }
  }
  
  startGathering() {
    this._isGathering = true;
  }
  
  stopGathering() {
    this._isGathering = false;
  }
  
  isGathering() {
    return this._isGathering;
  }
  
  // ===== Combat System =====
  
  getHealth() {
    return this.model.getHealth();
  }
  
  getMaxHealth() {
    return this.model.getMaxHealth();
  }
  
  getDamage() {
    return this.model.getDamage();
  }
  
  takeDamage(amount) {
    const currentHealth = this.model.getHealth();
    const newHealth = Math.max(0, currentHealth - amount);
    this.model.setHealth(newHealth);
    
    if (newHealth === 0) {
      // Death will be handled in update loop
    }
  }
  
  heal(amount) {
    const currentHealth = this.model.getHealth();
    const maxHealth = this.model.getMaxHealth();
    const newHealth = Math.min(maxHealth, currentHealth + amount);
    this.model.setHealth(newHealth);
  }
  
  attack(target) {
    if (!target || typeof target.takeDamage !== 'function') return;
    
    const damage = this.model.getDamage();
    target.takeDamage(damage);
  }
  
  die() {
    this.model.setActive(false);
    this._removeFromGame();
  }
  
  _removeFromGame() {
    if (typeof global.ants !== 'undefined' && Array.isArray(global.ants)) {
      const index = global.ants.indexOf(this);
      if (index !== -1) {
        global.ants.splice(index, 1);
      }
    }
  }
  
  setCombatTarget(target) {
    this.model.setCombatTarget(target);
  }
  
  addEnemy(enemy) {
    this.model.addEnemy(enemy);
  }
  
  removeEnemy(enemy) {
    this.model.removeEnemy(enemy);
  }
  
  clearEnemies() {
    this.model.clearEnemies();
  }
  
  _updateEnemyDetection() {
    // Check for nearby enemies
    if (typeof global.entities === 'undefined') return;
    
    const myPos = this.model.getPosition();
    const detectionRange = this.model.getAttackRange() * 2;
    
    global.entities.forEach(entity => {
      if (entity.faction !== this.model.getFaction()) {
        const distance = this._calculateDistance(this.model, entity);
        if (distance < detectionRange) {
          this.addEnemy(entity);
        }
      }
    });
  }
  
  _calculateDistance(entity1, entity2) {
    const pos1 = entity1.getPosition ? entity1.getPosition() : { x: 0, y: 0 };
    const pos2 = entity2.getPosition ? entity2.getPosition() : { x: 0, y: 0 };
    
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  // ===== State Machine Integration =====
  
  getCurrentState() {
    const stateMachine = this.model.getStateMachine();
    return stateMachine ? stateMachine.getCurrentState() : 'idle';
  }
  
  setState(state) {
    const stateMachine = this.model.getStateMachine();
    if (stateMachine) {
      stateMachine.setState(state);
    }
  }
  
  getPreferredState() {
    const stateMachine = this.model.getStateMachine();
    return stateMachine ? stateMachine.getPreferredState() : 'idle';
  }
  
  setPreferredState(state) {
    const stateMachine = this.model.getStateMachine();
    if (stateMachine) {
      stateMachine.setPreferredState(state);
    }
  }
  
  _onStateChange(oldState, newState) {
    // State change callback - can be overridden
  }
  
  // ===== Dropoff System =====
  
  setTargetDropoff(dropoff) {
    this.model.setTargetDropoff(dropoff);
  }
  
  _goToNearestDropoff() {
    if (typeof global.buildings === 'undefined') return;
    
    const myPos = this.model.getPosition();
    let nearestDropoff = null;
    let nearestDistance = Infinity;
    
    global.buildings.forEach(building => {
      if (building.type === 'anthill' && building.isActive) {
        const distance = this._calculateDistance(this.model, building);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestDropoff = building;
        }
      }
    });
    
    if (nearestDropoff) {
      this.setTargetDropoff(nearestDropoff.getPosition());
    }
  }
  
  _checkDropoffArrival() {
    const targetDropoff = this.model.getTargetDropoff();
    if (!targetDropoff) return false;
    
    const myPos = this.model.getPosition();
    const dx = targetDropoff.x - myPos.x;
    const dy = targetDropoff.y - myPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance < 50; // Within 50 pixels
  }
  
  // ===== Movement Commands =====
  
  moveToLocation(x, y) {
    if (this.model._movementController) {
      this.model._movementController.moveToLocation(x, y);
    }
  }
  
  isMoving() {
    if (this.model._movementController) {
      return this.model._movementController.isMoving();
    }
    return false;
  }
  
  stopMovement() {
    if (this.model._movementController) {
      this.model._movementController.stop();
    }
  }
  
  // ===== Command/Task System =====
  
  addCommand(command) {
    if (this.model._taskManager) {
      this.model._taskManager.addTask(command);
    }
    
    // Process command immediately
    this._processCommand(command);
  }
  
  _processCommand(command) {
    switch (command.type) {
      case 'gather':
        this.startGathering();
        if (command.target) {
          this.moveToLocation(command.target.x, command.target.y);
        }
        break;
      case 'move':
        if (command.target) {
          this.moveToLocation(command.target.x, command.target.y);
        }
        break;
      case 'attack':
        if (command.target) {
          this.setCombatTarget(command.target);
        }
        break;
    }
  }
  
  // ===== Update Loop =====
  
  update() {
    if (!this.model.isActive()) return;
    
    // Update frame time
    const currentTime = Date.now();
    this.model.setLastFrameTime(currentTime);
    
    // Update subsystems
    const stateMachine = this.model.getStateMachine();
    if (stateMachine && typeof stateMachine.update === 'function') {
      stateMachine.update();
    }
    
    const brain = this.model.getBrain();
    if (brain && typeof brain.update === 'function') {
      brain.update();
    }
    
    const gatherState = this.model.getGatherState();
    if (gatherState && typeof gatherState.update === 'function') {
      gatherState.update();
    }
    
    // Update idle timer
    if (!this.isMoving() && !this.isGathering()) {
      const idleTimer = this.model.getIdleTimer();
      this.model.setIdleTimer(idleTimer + 1);
    } else {
      this.model.setIdleTimer(0);
    }
    
    // Check for death
    if (this.model.getHealth() === 0) {
      this.die();
    }
    
    // Call base update
    super.update();
  }
  
  // ===== Rendering Coordination =====
  
  render() {
    if (!this.model.isActive()) return;
    
    this.view.render();
  }
  
  // ===== Debug Methods =====
  
  getDebugInfo() {
    const baseInfo = super.getDebugInfo();
    const gatherState = this.model.getGatherState();
    const gatherInfo = gatherState ? 
      (typeof gatherState.getDebugInfo === 'function' ? gatherState.getDebugInfo() : { isActive: false }) :
      { isActive: false };
    
    return {
      ...baseInfo,
      antIndex: this.model.getAntIndex(),
      JobName: this.model.getJobName(),
      currentState: this.getCurrentState(),
      health: `${this.model.getHealth()}/${this.model.getMaxHealth()}`,
      resources: `${this.getResourceCount()}/${this.getMaxResources()}`,
      faction: this.model.getFaction(),
      enemies: this.model.getEnemies().length,
      gathering: gatherInfo
    };
  }
  
  // ===== Cleanup =====
  
  cleanup() {
    const brain = this.model.getBrain();
    if (brain && typeof brain.cleanup === 'function') {
      brain.cleanup();
    }
    
    this.clearEnemies();
    this.model.setActive(false);
    
    // Call base cleanup if it exists
    if (super.cleanup && typeof super.cleanup === 'function') {
      super.cleanup();
    }
  }
  
  // ===== Legacy Compatibility - Property Accessors =====
  
  get posX() {
    return this.model.getPosition().x;
  }
  
  set posX(value) {
    const pos = this.model.getPosition();
    this.model.setPosition(value, pos.y);
  }
  
  get posY() {
    return this.model.getPosition().y;
  }
  
  set posY(value) {
    const pos = this.model.getPosition();
    this.model.setPosition(pos.x, value);
  }
  
  get isSelected() {
    return this.model.isSelected();
  }
  
  get faction() {
    return this.model.getFaction();
  }
  
  get antIndex() {
    return this.model.getAntIndex();
  }
  
  get JobName() {
    return this.model.getJobName();
  }
  
  get health() {
    return this.model.getHealth();
  }
  
  getAntIndex() {
    return this.model.getAntIndex();
  }
  
  getHealthData() {
    return {
      current: this.model.getHealth(),
      max: this.model.getMaxHealth(),
      percentage: this.model.getHealth() / this.model.getMaxHealth()
    };
  }
  
  // ===== System Integration Accessors =====
  
  getBrain() {
    return this.model.getBrain();
  }
  
  getStatsContainer() {
    return this.model.getStatsContainer();
  }
  
  getJobComponent() {
    return this.model.getJobComponent();
  }
}

// Node.js export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AntController;
}

// Browser global export
if (typeof window !== 'undefined') {
  window.AntController = AntController;
}
