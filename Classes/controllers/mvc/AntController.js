/**
 * AntController - MVC Controller for Ant entities
 * 
 * Coordinates AntModel (data/logic) and AntView (rendering).
 * Provides public API for ant operations and handles input events.
 * 
 * @extends BaseController
 */

// Load dependencies (Node.js require, or use global in browser)
const BaseController = (typeof require !== 'undefined') ? require('./BaseController') : window.BaseController;
const AntModel = (typeof require !== 'undefined') ? require('../../models/AntModel') : window.AntModel;
const AntView = (typeof require !== 'undefined') ? require('../../views/AntView') : window.AntView;

class AntController extends BaseController {
  /**
   * Create an AntController
   * @param {number} antIndex - Unique index for this ant
   * @param {number} x - Initial X position
   * @param {number} y - Initial Y position
   * @param {number} width - Ant width
   * @param {number} height - Ant height
   * @param {Object} options - Configuration options
   * @param {string} options.jobName - Job name (Worker, Scout, Warrior, etc.)
   * @param {string} options.imagePath - Path to ant sprite image
   * @param {number} [options.health] - Initial health
   * @param {number} [options.rotation] - Initial rotation
   */
  constructor(antIndex, x, y, width, height, options = {}) {
    // Add antIndex to options for AntModel
    const modelOptions = { ...options, antIndex };
    
    // Create model and view
    const model = new AntModel(x, y, width, height, modelOptions);
    const view = new AntView(model, options);
    
    // Call parent constructor
    super(model, view, options);
    
    // Store ant index
    this._antIndex = antIndex;
  }
  
  // ==================== Movement API ====================
  
  /**
   * Move ant to target position
   * @param {number} x - Target X coordinate
   * @param {number} y - Target Y coordinate
   */
  moveTo(x, y) {
    this._model.moveTo(x, y);
  }
  
  /**
   * Stop ant movement
   */
  stopMovement() {
    this._model.stopMovement();
  }
  
  // ==================== Combat API ====================
  
  /**
   * Attack a target entity
   * @param {Object} target - Target entity
   */
  attack(target) {
    this._model.attack(target);
  }
  
  /**
   * Set combat target
   * @param {Object} target - Target entity
   */
  setCombatTarget(target) {
    this._model.setCombatTarget(target);
  }
  
  // ==================== Resource API ====================
  
  /**
   * Add resource to ant's inventory
   * @param {Object} resource - Resource object
   * @returns {boolean} True if resource was added
   */
  addResource(resource) {
    return this._model.addResource(resource);
  }
  
  /**
   * Remove resources from inventory
   * @param {number} amount - Number of resources to remove
   * @returns {Array} Removed resources
   */
  removeResource(amount) {
    // Get current resources before removal
    const currentResources = this._model._resourceManager ? 
      [...this._model._resourceManager.resources] : [];
    
    const toRemove = Math.min(amount, currentResources.length);
    const removed = currentResources.splice(0, toRemove);
    
    // Remove from model
    this._model.removeResource(amount);
    
    return removed;
  }
  
  /**
   * Drop all resources from inventory
   * @returns {Array} Dropped resources
   */
  dropAllResources() {
    return this._model.dropAllResources();
  }
  
  // ==================== Job API ====================
  
  /**
   * Assign a new job to the ant
   * @param {string} jobName - New job name
   * @param {string} image - New sprite image path
   */
  assignJob(jobName, image) {
    this._model.assignJob(jobName, image);
  }
  
  // ==================== Health API ====================
  
  /**
   * Apply damage to the ant
   * @param {number} amount - Damage amount
   */
  takeDamage(amount) {
    this._model.takeDamage(amount);
  }
  
  /**
   * Heal the ant
   * @param {number} amount - Heal amount
   */
  heal(amount) {
    this._model.heal(amount);
  }
  
  // ==================== State API ====================
  
  /**
   * Set ant state
   * @param {string} primary - Primary state
   * @param {string} combat - Combat state
   * @param {string} terrain - Terrain state
   */
  setState(primary, combat, terrain) {
    this._model.setState(primary, combat, terrain);
  }
  
  /**
   * Get current state
   * @returns {Object} Current state object with primary, combat, and terrain properties
   */
  getCurrentState() {
    const stateMachine = this._model._stateMachine;
    return {
      primary: stateMachine.primaryState || 'IDLE',
      combat: stateMachine.combatModifier || 'NONE',
      terrain: stateMachine.terrainModifier || 'NONE'
    };
  }
  
  // ==================== Selection ====================
  
  /**
   * Set selection state
   * @param {boolean} selected - Whether ant is selected
   */
  setSelected(selected) {
    this._view.setSelectionHighlight(selected);
  }
  
  /**
   * Get selection state
   * @returns {boolean} True if ant is selected
   */
  isSelected() {
    return this._view._selectionHighlight || false;
  }
  
  // ==================== Input Handling ====================
  
  /**
   * Handle input events
   * @param {string} type - Input type (click, hover, etc.)
   * @param {Object} data - Input data
   */
  handleInput(type, data) {
    if (!type || !data) return;
    
    switch (type) {
      case 'click':
        this._handleClickInput(data);
        break;
      case 'hover':
        this._handleHoverInput(data);
        break;
      default:
        // Unknown input type, ignore
        break;
    }
  }
  
  /**
   * Handle click input (internal)
   * @private
   * @param {Object} data - Click data
   */
  _handleClickInput(data) {
    // Check if click is on ant
    const pos = this._model.position;
    const size = this._model.size;
    
    if (data.x >= pos.x && data.x <= pos.x + size.width &&
        data.y >= pos.y && data.y <= pos.y + size.height) {
      // Click is on ant - could trigger selection
      // (Actual selection logic handled by external systems)
    }
  }
  
  /**
   * Handle hover input (internal)
   * @private
   * @param {Object} data - Hover data
   */
  _handleHoverInput(data) {
    // Hover logic (e.g., highlight on mouse over)
    // Implementation depends on game requirements
  }
  
  // ==================== Getters ====================
  
  /**
   * Get ant index
   * @returns {number} Ant index
   */
  get antIndex() {
    return this._antIndex;
  }
  
  /**
   * Get ant position
   * @returns {Object} Position {x, y}
   */
  get position() {
    return this._model.position;
  }
  
  /**
   * Get current health
   * @returns {number} Current health
   */
  get health() {
    return this._model.health;
  }
  
  /**
   * Get max health
   * @returns {number} Max health
   */
  get maxHealth() {
    return this._model.maxHealth;
  }
  
  /**
   * Get job name
   * @returns {string} Job name
   */
  get jobName() {
    return this._model.jobName;
  }
  
  /**
   * Get faction
   * @returns {string} Faction (player, enemy, neutral)
   */
  get faction() {
    return this._model.faction;
  }
  
  /**
   * Get resource count
   * @returns {number} Number of resources in inventory
   */
  get resourceCount() {
    return this._model.getResourceCount();
  }
  
  /**
   * Check if ant is moving
   * @returns {boolean} True if ant is moving
   */
  get isMoving() {
    return this._model.isMoving;
  }
  
  /**
   * Check if ant is alive
   * @returns {boolean} True if ant is alive
   */
  get isAlive() {
    return this._model.isActive;
  }
  
  /**
   * Get model reference (for advanced use)
   * @returns {AntModel} The ant model
   */
  get model() {
    return this._model;
  }
  
  /**
   * Get view reference (for advanced use)
   * @returns {AntView} The ant view
   */
  get view() {
    return this._view;
  }
  
  // ==================== Lifecycle ====================
  
  /**
   * Update ant state
   * @param {number} deltaTime - Time since last update (seconds)
   */
  update(deltaTime) {
    if (this._model) {
      this._model.update(deltaTime);
    }
  }
  
  /**
   * Render ant
   */
  render() {
    if (this._view) {
      this._view.render();
    }
  }
  
  /**
   * Destroy controller and cleanup
   */
  destroy() {
    // Call parent destroy (handles model and view cleanup)
    super.destroy();
  }
}

// Export for Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AntController;
}
if (typeof window !== 'undefined') {
  window.AntController = AntController;
}
