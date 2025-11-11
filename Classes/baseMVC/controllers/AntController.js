/**
 * AntController.js
 * 
 * Ant-specific business logic controller extending EntityController.
 * Handles all ant behaviors: job system, resource management, combat,
 * state machine, dropoff, commands, update loop, debug.
 * 
 * TDD Implementation: Phase 2 - Ant MVC Conversion
 * Test Coverage: 60+ tests ensuring complete controller behavior
 */

// Node.js: Load EntityController
if (typeof require !== 'undefined' && typeof module !== 'undefined' && module.exports) {
  const EntityController = require('./EntityController');
  const MovementController = require('./MovementController');
  global.EntityController = EntityController;
  global.MovementController = MovementController;
}

class AntController extends EntityController {
  constructor(model, view, options = {}) {
    super(model, view);
    
    // Dependency injection (NO GLOBAL STATE)
    this._entityManager = options.entityManager || null;
    this._buildingManager = options.buildingManager || null;
    this._spatialGrid = options.spatialGrid || null;
    
    if (typeof MovementController === 'undefined') {
      throw new Error('MovementController not available');
    }
    
    this._movementController = new MovementController(this.model, {
      pathfindingSystem: options.pathfindingSystem || null,
      terrainSystem: options.terrainSystem || null
    });
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
    if (!resourceManager) {
      throw new Error('ResourceManager not initialized - This is a BUG');
    }
    return resourceManager.getResourceCount();
  }
  
  getMaxResources() {
    const resourceManager = this.model.getResourceManager();
    if (!resourceManager) {
      throw new Error('ResourceManager not initialized - This is a BUG');
    }
    return resourceManager.getMaxResources();
  }
  
  addResource(resource) {
    const resourceManager = this.model.getResourceManager();
    if (!resourceManager) {
      throw new Error('ResourceManager not initialized - This is a BUG');
    }
    return resourceManager.addResource(resource);
  }
  
  removeResource(amount) {
    const resourceManager = this.model.getResourceManager();
    if (!resourceManager) {
      throw new Error('ResourceManager not initialized - This is a BUG');
    }
    return resourceManager.removeResource(amount);
  }
  
  dropAllResources() {
    const resourceManager = this.model.getResourceManager();
    if (!resourceManager) {
      throw new Error('ResourceManager not initialized - This is a BUG');
    }
    resourceManager.dropAllResources();
  }
  
  startGathering() {
    this.model.setGathering(true);
  }
  
  stopGathering() {
    this.model.setGathering(false);
  }
  
  isGathering() {
    return this.model.isGathering();
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
    // Use event system instead of direct array manipulation (NO GLOBAL STATE)
    // The model should emit an event that AntManager listens to
    this.model.emit('removeRequested', { ant: this.model });
    
    // Mark as inactive in model
    this.model.setActive(false);
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
    // Require entity manager (NO GLOBAL STATE)
    if (!this._entityManager) {
      console.warn('EntityManager not provided to AntController - skipping enemy detection');
      return;
    }
    
    const myPos = this.model.getPosition();
    const detectionRange = this.model.getAttackRange() * 2;
    
    const entities = this._entityManager.getAllEntities();
    entities.forEach(entity => {
      if (entity.faction !== this.model.getFaction()) {
        const distance = this._calculateDistance(this.model, entity);
        if (distance < detectionRange) {
          this.addEnemy(entity);
        }
      }
    });
  }
  
  _calculateDistance(entity1, entity2) {
    if (!entity1.getPosition || !entity2.getPosition) {
      throw new Error('Entity missing getPosition() method - This is a BUG');
    }
    
    const pos1 = entity1.getPosition();
    const pos2 = entity2.getPosition();
    
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  // ===== State Machine Integration =====
  
  getCurrentState() {
    const stateMachine = this.model.getStateMachine();
    if (!stateMachine) {
      throw new Error('StateMachine not initialized - This is a BUG');
    }
    return stateMachine.getCurrentState();
  }
  
  setState(state) {
    const stateMachine = this.model.getStateMachine();
    if (!stateMachine) {
      throw new Error('StateMachine not initialized - This is a BUG');
    }
    stateMachine.setState(state);
  }
  
  getPreferredState() {
    const stateMachine = this.model.getStateMachine();
    if (!stateMachine) {
      throw new Error('StateMachine not initialized - This is a BUG');
    }
    return stateMachine.getPreferredState();
  }
  
  setPreferredState(state) {
    const stateMachine = this.model.getStateMachine();
    if (!stateMachine) {
      throw new Error('StateMachine not initialized - This is a BUG');
    }
    stateMachine.setPreferredState(state);
  }
  
  _onStateChange(oldState, newState) {
    // State change callback - can be overridden
  }
  
  // ===== Dropoff System =====
  
  setTargetDropoff(dropoff) {
    this.model.setTargetDropoff(dropoff);
  }
  
  _goToNearestDropoff() {
    // Require building manager (NO GLOBAL STATE)
    if (!this._buildingManager) {
      throw new Error('BuildingManager not provided to AntController - This is a BUG');
    }
    
    const myPos = this.model.getPosition();
    
    // Use spatial grid if available for better performance
    let buildings;
    if (this._spatialGrid) {
      // Search within large radius (1000 pixels) for dropoff buildings
      buildings = this._spatialGrid.getNearbyEntities(myPos.x, myPos.y, 1000)
        .filter(entity => entity.getType && entity.getType() === 'Building');
    } else {
      // Fallback to building manager
      buildings = this._buildingManager.getAllBuildings();
    }
    
    // Filter for active anthill buildings
    const dropoffBuildings = buildings.filter(building => 
      building.isActive && 
      (building.getBuildingType ? building.getBuildingType() === 'anthill' : building.type === 'anthill')
    );
    
    if (dropoffBuildings.length === 0) {
      return; // No dropoff buildings available
    }
    
    // Find nearest using reduce
    const nearest = dropoffBuildings.reduce((closest, building) => {
      const distance = this._calculateDistance(this.model, building);
      return distance < closest.distance ? { building, distance } : closest;
    }, { building: null, distance: Infinity });
    
    if (nearest.building) {
      this.setTargetDropoff(nearest.building.getPosition());
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
  
  /**
   * Move ant to specified location
   * Uses MovementController for proper pathfinding and state management
   * @param {number} x - Target X coordinate
   * @param {number} y - Target Y coordinate
   * @returns {boolean} - True if movement started successfully
   */
  moveToLocation(x, y) {
    return this._movementController.moveToLocation(x, y);
  }
  
  isMoving() {
    return this._movementController.isMoving();
  }
  
  stopMovement() {
    this._movementController.stop();
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
    const deltaTime = this.model.getLastFrameTime() ? currentTime - this.model.getLastFrameTime() : 16.67;
    this.model.setLastFrameTime(currentTime);
    
    // Update movement (ALWAYS uses MovementController)
    this._movementController.update(deltaTime);
    
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
  // These accessors provide backward compatibility during MVC migration.
  // They will be removed in a future version.
  // Please use the getter/setter methods instead.
  
  /**
   * @deprecated Use getPosition().x instead
   */
  get posX() {
    console.warn("AntController.PosX is deprecated: Use getPosition().x instead")
    return this.model.getPosition().x;
  }
  
  /**
   * @deprecated Use setPosition(x, y) or moveTo(x, y) instead
   */
  set posX(value) {
    console.warn("AntController.posX setter is deprecated: Use setPosition(x, y) or moveTo(x, y) instead");
    const pos = this.model.getPosition();
    this.model.setPosition(value, pos.y);
  }
  
  /**
   * @deprecated Use getPosition().y instead
   */
  get posY() {
    console.warn("AntController.posY is deprecated: Use getPosition().y instead");
    return this.model.getPosition().y;
  }
  
  /**
   * @deprecated Use setPosition(x, y) or moveTo(x, y) instead
   */
  set posY(value) {
    console.warn("AntController.posY setter is deprecated: Use setPosition(x, y) or moveTo(x, y) instead");
    const pos = this.model.getPosition();
    this.model.setPosition(pos.x, value);
  }
  
  /**
   * @deprecated Use isSelected() method instead
   */
  get isSelected() {
    console.warn("AntController.isSelected property is deprecated: Use isSelected() method instead");
    return this.model.isSelected();
  }
  
  /**
   * @deprecated Use getFaction() method instead
   */
  get faction() {
    console.warn("AntController.faction is deprecated: Use getFaction() method instead");
    return this.model.getFaction();
  }
  
  /**
   * @deprecated Use getAntIndex() method instead
   */
  get antIndex() {
    console.warn("AntController.antIndex is deprecated: Use getAntIndex() method instead");
    return this.model.getAntIndex();
  }
  
  /**
   * @deprecated Use getJobName() method instead
   */
  get JobName() {
    console.warn("AntController.JobName is deprecated: Use getJobName() method instead");
    return this.model.getJobName();
  }
  
  /**
   * @deprecated Use getHealth() method instead
   */
  get health() {
    console.warn("AntController.health is deprecated: Use getHealth() method instead");
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
