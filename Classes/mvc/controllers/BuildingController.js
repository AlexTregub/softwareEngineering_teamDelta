/**
 * BuildingController - Controls building behavior (upgrade, production, health)
 * Extends EntityController with building-specific logic
 * 
 * **Features**:
 * - **Upgrade System** - Level progression, stat increases
 * - **Health System** - Damage, repair, destruction
 * - **Production** - Resource generation, unit spawning
 * - **Building Types** - Different behavior per type (AntHill, Cone, Hive, Tower)
 * 
 * **Usage**:
 * ```javascript
 * const controller = new BuildingController();
 * const buildingModel = new BuildingModel({ 
 *   x: 100, 
 *   y: 200, 
 *   buildingType: 'AntHill',
 *   level: 1 
 * });
 * 
 * // Upgrade building
 * controller.upgrade(buildingModel);
 * 
 * // Damage building
 * controller.damage(buildingModel, 100);
 * 
 * // Repair building
 * controller.repair(buildingModel, 50);
 * ```
 */

// Conditional import for Node.js environment
if (typeof module !== 'undefined' && typeof EntityController === 'undefined') {
  var EntityController = require('./EntityController');
}

class BuildingController extends EntityController {
  /**
   * Max building level
   * @private
   */
  get _maxLevel() {
    return 10;
  }
  
  /**
   * Upgrade building to next level
   * @param {BuildingModel} model - Building model
   * @throws {Error} If building cannot be upgraded
   */
  upgrade(model) {
    // Validation
    if (!model.canUpgrade) {
      throw new Error('Building cannot be upgraded');
    }
    
    if (model.level >= this._maxLevel) {
      throw new Error('Building at max level');
    }
    
    // Increase level
    model.level += 1;
    
    // Update stats based on new level
    this._updateStatsForLevel(model);
  }
  
  /**
   * Apply damage to building
   * @param {BuildingModel} model - Building model
   * @param {number} amount - Damage amount
   */
  damage(model, amount) {
    if (model.health === undefined) {
      return; // Building has no health (indestructible)
    }
    
    // Apply damage
    model.health = Math.max(0, model.health - amount);
    
    // Check for destruction
    if (model.health <= 0) {
      this._onDestroyed(model);
    }
  }
  
  /**
   * Repair building
   * @param {BuildingModel} model - Building model
   * @param {number} amount - Repair amount
   */
  repair(model, amount) {
    if (model.health === undefined || model.maxHealth === undefined) {
      return; // Building has no health
    }
    
    // Apply repair (cap at max health)
    model.health = Math.min(model.maxHealth, model.health + amount);
  }
  
  /**
   * Internal update logic for buildings
   * @protected
   * @param {BuildingModel} model - Building model to update
   * @param {number} deltaTime - Time since last frame (milliseconds)
   */
  _updateInternal(model, deltaTime) {
    // 1. Building type-specific behavior
    this._updateBuildingType(model, deltaTime);
    
    // 2. Production system (resource generation, unit spawning)
    this._updateProduction(model, deltaTime);
    
    // 3. Health regeneration (if applicable)
    if (model.health !== undefined && model.health > 0 && model.health < model.maxHealth) {
      this._updateHealthRegen(model, deltaTime);
    }
  }
  
  /**
   * Update stats when building levels up
   * @private
   */
  _updateStatsForLevel(model) {
    // Stats scaling placeholder
    // Full implementation would:
    // 1. Increase max health
    // 2. Increase production rate
    // 3. Update upgrade cost
    // 4. Unlock new abilities
    // (Requires game balance configuration)
  }
  
  /**
   * Handle building destruction
   * @private
   */
  _onDestroyed(model) {
    // Destruction logic placeholder
    // Full implementation would:
    // 1. Disable model
    // 2. Trigger destruction effects
    // 3. Drop resources
    // 4. Notify game systems
    // model.enabled = false;
  }
  
  /**
   * Building type-specific behavior
   * @private
   */
  _updateBuildingType(model, deltaTime) {
    // Building type logic placeholder
    // Different buildings have different behaviors:
    // - AntHill: Spawn worker ants
    // - Cone: Defense structure
    // - Hive: Resource storage
    // - Tower: Attack range
    // (Full implementation requires game context)
  }
  
  /**
   * Production system (resources, units)
   * @private
   */
  _updateProduction(model, deltaTime) {
    // Production logic placeholder
    // Full implementation would:
    // 1. Track production timers
    // 2. Generate resources
    // 3. Spawn units
    // 4. Queue production orders
    // (Requires integration with game systems)
  }
  
  /**
   * Health regeneration over time
   * @private
   */
  _updateHealthRegen(model, deltaTime) {
    // Health regen placeholder
    // Full implementation would:
    // 1. Calculate regen rate
    // 2. Apply regen over time
    // 3. Stop at max health
    // (Requires game balance configuration)
  }
  
  /**
   * Handle input for buildings
   * @protected
   * @param {BuildingModel} model - Building model
   * @param {Object} input - Input state (mouse, keyboard)
   */
  _handleInputInternal(model, input) {
    // Input handling placeholder
    // Full implementation would:
    // 1. Check for click selection
    // 2. Handle upgrade button
    // 3. Show building info UI
    // 4. Process production orders
    // (Requires integration with input/UI systems)
  }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BuildingController;
}

// Export for browser
if (typeof window !== 'undefined') {
  window.BuildingController = BuildingController;
}
