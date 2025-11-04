/**
 * BuildingController
 * ------------------
 * Controller class for building entities using MVC pattern.
 * 
 * Extends BaseController to provide:
 * - Public API for building interactions
 * - Coordination between BuildingModel and BuildingView
 * - Input handling (click to select)
 * - Serialization support
 * 
 * Responsibilities:
 * - Provide public methods for building operations
 * - Delegate to model for data/logic
 * - Delegate to view for rendering
 * - Handle input events
 * - NO business logic (delegate to model)
 * - NO rendering logic (delegate to view)
 * 
 * Usage:
 * ```javascript
 * const building = new BuildingController(x, y, width, height, {
 *   type: 'AntCone',
 *   faction: 'player',
 *   imagePath: 'Images/Buildings/Cone/Cone1.png',
 *   health: 100,
 *   spawnInterval: 5,
 *   spawnCount: 1
 * });
 * 
 * building.update(deltaTime); // Update spawn timer
 * building.takeDamage(30); // Reduce health
 * building.render(); // Render building
 * 
 * if (building.canUpgrade(resources)) {
 *   building.upgrade((level) => loadImage(`path/to/level${level}.png`));
 * }
 * ```
 */

// Load dependencies (browser uses window.* directly, Node.js requires them)
let BaseController, BuildingModel, BuildingView;
if (typeof require !== 'undefined') {
  BaseController = require('./BaseController');
  BuildingModel = require('../../models/BuildingModel');
  BuildingView = require('../../views/BuildingView');
} else {
  BaseController = window.BaseController;
  BuildingModel = window.BuildingModel;
  BuildingView = window.BuildingView;
}

class BuildingController extends BaseController {
  /**
   * Construct a building controller.
   * @param {number} x - X position in world coordinates
   * @param {number} y - Y position in world coordinates
   * @param {number} width - Building width in pixels
   * @param {number} height - Building height in pixels
   * @param {Object} [options={}] - Building configuration options
   * @param {string} [options.type='Building'] - Building type (AntCone, AntHill, HiveSource)
   * @param {string} [options.faction='neutral'] - Building faction (player, enemy, neutral)
   * @param {string} [options.imagePath] - Path to building image
   * @param {number} [options.health=100] - Initial health
   * @param {number} [options.maxHealth=100] - Maximum health
   * @param {number} [options.spawnInterval=10] - Spawn interval in seconds
   * @param {number} [options.spawnCount=1] - Number of units to spawn
   * @param {Object} [options.upgradeTree] - Upgrade progression tree
   * @param {boolean} [options.showHealthBar=true] - Whether to show health bar
   */
  constructor(x, y, width, height, options = {}) {
    // Create model
    const model = new BuildingModel(x, y, width, height, options);
    
    // Create view
    const view = new BuildingView(model, options);
    
    // Initialize base controller
    super(model, view, options);
  }
  
  // --- Position and Size API ---
  
  /**
   * Get building position.
   * @returns {{x: number, y: number}} Building position
   */
  getPosition() {
    return this._model.position;
  }
  
  /**
   * Get building size.
   * @returns {{width: number, height: number}} Building size
   */
  getSize() {
    return this._model.size;
  }
  
  // --- Health API ---
  
  /**
   * Get current health.
   * @returns {number} Current health
   */
  getHealth() {
    return this._model.health;
  }
  
  /**
   * Get maximum health.
   * @returns {number} Maximum health
   */
  getMaxHealth() {
    return this._model.maxHealth;
  }
  
  /**
   * Damage the building.
   * @param {number} amount - Damage amount
   */
  takeDamage(amount) {
    this._model.takeDamage(amount);
  }
  
  /**
   * Heal the building.
   * @param {number} amount - Heal amount
   */
  heal(amount) {
    this._model.heal(amount);
  }
  
  /**
   * Check if building is dead.
   * @returns {boolean} True if health is 0
   */
  isDead() {
    return this._model.isDead;
  }
  
  // --- Spawn API ---
  
  /**
   * Get spawn configuration.
   * @returns {{interval: number, count: number, timer: number}} Spawn config
   */
  getSpawnConfig() {
    return this._model.spawnConfig;
  }
  
  /**
   * Update spawn timer.
   * @param {number} deltaTime - Time elapsed in seconds
   */
  updateSpawnTimer(deltaTime) {
    this._model.updateSpawnTimer(deltaTime);
  }
  
  // --- Upgrade API ---
  
  /**
   * Check if building can upgrade.
   * @param {number} availableResources - Available resources for upgrade
   * @returns {boolean} True if upgrade available and affordable
   */
  canUpgrade(availableResources) {
    return this._model.canUpgrade(availableResources);
  }
  
  /**
   * Apply upgrade to building.
   * @param {Function} [imageCallback] - Optional callback to get new image (level => Image)
   * @returns {boolean} True if upgrade successful
   */
  upgrade(imageCallback) {
    const success = this._model.applyUpgrade();
    
    if (success && imageCallback && typeof imageCallback === 'function') {
      const newImage = imageCallback(this._model._currentLevel);
      if (newImage) {
        this._view.setImage(newImage);
      }
    }
    
    return success;
  }
  
  // --- Type and Faction API ---
  
  /**
   * Get building type.
   * @returns {string} Building type (AntCone, AntHill, HiveSource)
   */
  getType() {
    return this._model.type;
  }
  
  /**
   * Get building faction.
   * @returns {string} Building faction (player, enemy, neutral)
   */
  getFaction() {
    return this._model.faction;
  }
  
  // --- Lifecycle Methods ---
  
  /**
   * Update building state (spawn timer, etc).
   * @param {number} deltaTime - Time elapsed in seconds
   */
  update(deltaTime) {
    this._model.update(deltaTime);
  }
  
  /**
   * Handle input events.
   * @param {string} type - Input type ('click', 'hover', etc.)
   * @param {Object} data - Input data (pointer position, etc.)
   */
  handleInput(type, data) {
    if (type === 'click' && data) {
      // Check if click is inside building bounds
      const pos = this._model.position;
      const size = this._model.size;
      
      if (data.x >= pos.x && data.x <= pos.x + size.width &&
          data.y >= pos.y && data.y <= pos.y + size.height) {
        // Handle building selection (can be extended later)
        // For now, just acknowledge the click
      }
    }
  }
  
  // --- Serialization ---
  
  /**
   * Serialize building state to JSON.
   * @returns {Object} Serialized building state
   */
  toJSON() {
    const modelData = this._model.toJSON();
    return {
      ...modelData,
      spawnConfig: this.getSpawnConfig()
    };
  }
}

// Export for Node.js testing and browser usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BuildingController;
}

if (typeof window !== 'undefined') {
  window.BuildingController = BuildingController;
}
