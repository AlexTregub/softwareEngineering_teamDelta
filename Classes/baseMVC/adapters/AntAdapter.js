/**
 * AntAdapter.js
 * 
 * Backward compatibility adapter for Ant class using MVC architecture.
 * Maintains exact same public API as original ant class while delegating
 * to AntModel/View/Controller internally.
 * 
 * Purpose: Zero-breaking-change migration path to MVC architecture.
 * 
 * @class AntAdapter
 */

if (typeof require !== 'undefined') {
  var AntModel = require('../models/AntModel');
  var AntView = require('../views/AntView');
  var AntController = require('../controllers/AntController');
}

class AntAdapter {
  /**
   * Creates an ant with exact same constructor signature as original ant class.
   * 
   * @param {number} posX - X position
   * @param {number} posY - Y position
   * @param {number} sizex - Width
   * @param {number} sizey - Height
   * @param {number} movementSpeed - Movement speed (legacy, unused)
   * @param {number} rotation - Initial rotation
   * @param {*} img - Sprite image (legacy, handled by view)
   * @param {string} JobName - Job name (Scout, Farmer, Builder, Soldier)
   * @param {string} faction - Faction (player, enemy, neutral)
   */
  constructor(posX = 0, posY = 0, sizex = 50, sizey = 50, movementSpeed = 1, rotation = 0, img = null, JobName = "Scout", faction = "player") {
    // Create MVC components
    this._model = new AntModel(posX, posY, sizex, sizey, { 
      jobName: JobName,
      faction: faction,
      rotation: rotation
    });
    
    this._view = new AntView(this._model);
    this._controller = new AntController(this._model, this._view);
    
    // Initialize job (applies stats, sets up systems)
    this._controller.assignJob(JobName);
  }
  
  // ========================================
  // PROPERTY GETTERS (read-only)
  // ========================================
  
  get antIndex() { return this._model.getAntIndex(); }
  get JobName() { return this._model.getJobName(); }
  get StatsContainer() { return this._model.getStatsContainer(); }
  get EntityInventoryManager() { return this._model.getResourceManager(); }
  get stateMachine() { return this._model.getStateMachine(); }
  get gatherState() { return this._model.getGatherState(); }
  get faction() { return this._model.getFaction(); }
  get health() { return this._model.getHealth(); }
  get maxHealth() { return this._model.getMaxHealth(); }
  get damage() { return this._model.getDamage(); }
  
  // ========================================
  // PROPERTY SETTERS
  // ========================================
  
  set JobName(value) { this._controller.assignJob(value); }
  
  // ========================================
  // LEGACY POSITION PROPERTIES (posX/posY)
  // ========================================
  
  get posX() { return this._model.getPosition().x; }
  set posX(value) { 
    const pos = this._model.getPosition();
    this._model.setPosition(parseFloat(value), pos.y);
  }
  
  get posY() { return this._model.getPosition().y; }
  set posY(value) { 
    const pos = this._model.getPosition();
    this._model.setPosition(pos.x, parseFloat(value));
  }
  
  // ========================================
  // LEGACY STATE PROPERTIES
  // ========================================
  
  get isMoving() { return this._model._isMoving; }
  get isSelected() { return this._model._isSelected; }
  set isSelected(value) { this._model._isSelected = value; }
  get isActive() { return this._model._active; }
  
  // ========================================
  // CONTROLLER GETTERS (for Entity pattern compatibility)
  // ========================================
  
  get _movementController() { return this._model; }  // Placeholder
  get _taskManager() { return this._model; }  // Placeholder
  get _renderController() { return this._view; }  // Placeholder
  get _selectionController() { return this._model; }  // Placeholder
  get _combatController() { return this._controller; }  // Placeholder
  get _transformController() { return this._model; }  // Placeholder
  get _terrainController() { return this._model; }  // Placeholder
  get _interactionController() { return this._model; }  // Placeholder
  get _healthController() { return this._controller; }  // Placeholder
  
  // ========================================
  // JOB SYSTEM METHODS
  // ========================================
  
  assignJob(jobName, image = null) {
    return this._controller.assignJob(jobName);
  }
  
  getJobStats() {
    return this._controller.getJobStats();
  }
  
  _applyJobStats(stats) {
    return this._controller._applyJobStats(stats);
  }
  
  _getFallbackJobStats(jobName) {
    return this._controller._getFallbackJobStats(jobName);
  }
  
  // ========================================
  // RESOURCE MANAGEMENT METHODS
  // ========================================
  
  getResourceCount() {
    return this._controller.getResourceCount();
  }
  
  getMaxResources() {
    return this._controller.getMaxResources();
  }
  
  addResource(resource) {
    return this._controller.addResource(resource);
  }
  
  removeResource(amount = 1) {
    const manager = this._model.getResourceManager();
    if (!manager) return [];
    
    const removed = [];
    for (let i = 0; i < amount && manager.getCurrentLoad() > 0; i++) {
      const resource = manager.resources.pop();
      if (resource) removed.push(resource);
    }
    return removed;
  }
  
  dropAllResources() {
    const manager = this._model.getResourceManager();
    return manager ? manager.dropAllResources() : [];
  }
  
  startGathering() {
    return this._controller.startGathering();
  }
  
  stopGathering() {
    return this._controller.stopGathering();
  }
  
  isGathering() {
    return this._controller.isGathering();
  }
  
  // ========================================
  // STATE MACHINE METHODS
  // ========================================
  
  getCurrentState() {
    return this._controller.getCurrentState();
  }
  
  setState(newState) {
    return this._controller.setState(newState);
  }
  
  // ========================================
  // COMBAT METHODS
  // ========================================
  
  takeDamage(amount) {
    return this._controller.takeDamage(amount);
  }
  
  heal(amount) {
    return this._controller.heal(amount);
  }
  
  attack(target) {
    return this._controller.attack(target);
  }
  
  die() {
    return this._controller.die();
  }
  
  _removeFromGame() {
    return this._controller._removeFromGame();
  }
  
  // ========================================
  // COMMAND/TASK METHODS
  // ========================================
  
  addCommand(command) {
    return this._controller.addCommand(command);
  }
  
  // ========================================
  // DROPOFF SYSTEM METHODS
  // ========================================
  
  _goToNearestDropoff() {
    return this._controller._goToNearestDropoff();
  }
  
  _checkDropoffArrival() {
    return this._controller._checkDropoffArrival();
  }
  
  // ========================================
  // UPDATE & RENDER METHODS
  // ========================================
  
  update() {
    return this._controller.update();
  }
  
  render() {
    return this._controller.render();
  }
  
  // ========================================
  // DEBUG METHODS
  // ========================================
  
  getDebugInfo() {
    return this._controller.getDebugInfo();
  }
  
  getAntIndex() {
    return this._controller.getAntIndex();
  }
  
  getHealthData() {
    return {
      health: this._model.getHealth(),
      maxHealth: this._model.getMaxHealth()
    };
  }
  
  getResourceData() {
    const manager = this._model.getResourceManager();
    return {
      currentLoad: manager ? manager.getCurrentLoad() : 0,
      maxCapacity: manager ? manager.maxCapacity : 0,
      resources: manager ? manager.resources : []
    };
  }
  
  getCombatData() {
    return {
      damage: this._model.getDamage(),
      attackRange: this._model.getAttackRange(),
      combatTarget: this._model.getCombatTarget(),
      enemies: this._model.getEnemies()
    };
  }
  
  getAntValidationData() {
    return {
      antIndex: this._model.getAntIndex(),
      jobName: this._model.getJobName(),
      faction: this._model.getFaction(),
      health: this._model.getHealth(),
      resourceCount: this.getResourceCount()
    };
  }
  
  // ========================================
  // UTILITY METHODS
  // ========================================
  
  _calculateDistance(entity1, entity2) {
    return this._controller._calculateDistance(entity1, entity2);
  }
  
  // ========================================
  // ENTITY-LIKE METHODS (for compatibility)
  // ========================================
  
  getPosition() {
    return this._model.getPosition();
  }
  
  setPosition(x, y) {
    if (typeof x === 'object') {
      return this._model.setPosition(x);
    }
    return this._model.setPosition({ x, y });
  }
  
  getSize() {
    return this._model.getSize();
  }
  
  setSize(width, height) {
    if (typeof width === 'object') {
      return this._model.setSize(width);
    }
    return this._model.setSize({ width, height });
  }
  
  getRotation() {
    return this._model.getRotation();
  }
  
  setRotation(rotation) {
    return this._model.setRotation(rotation);
  }
  
  // ========================================
  // CLEANUP METHODS
  // ========================================
  
  destroy() {
    return this._controller.destroy();
  }
}

// Global export
if (typeof window !== 'undefined') {
  window.AntAdapter = AntAdapter;
}

// Node.js export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AntAdapter;
}
