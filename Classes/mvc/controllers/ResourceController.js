/**
 * ResourceController - Controls resource behavior (pickup, drop, collection)
 * Extends EntityController with resource-specific logic
 * 
 * **Features**:
 * - **Pickup/Drop** - Carrier tracking, position updates
 * - **Weight System** - Resource weight for carrying capacity
 * - **Amount Tracking** - Stack size, depletion
 * - **Resource Types** - Different behavior per type (greenLeaf, stick, stone, etc.)
 * 
 * **Usage**:
 * ```javascript
 * const controller = new ResourceController();
 * const resourceModel = new ResourceModel({ 
 *   position: { x: 100, y: 200 }, 
 *   resourceType: 'greenLeaf',
 *   amount: 5 
 * });
 * 
 * // Ant picks up resource
 * controller.pickup(resourceModel, 'ant_123');
 * 
 * // Ant drops resource at new location
 * controller.drop(resourceModel, 300, 400);
 * ```
 */

// Conditional import for Node.js environment
if (typeof module !== 'undefined' && typeof EntityController === 'undefined') {
  var EntityController = require('./EntityController');
}

class ResourceController extends EntityController {
  /**
   * Pickup resource (assign carrier)
   * @param {ResourceModel} model - Resource model
   * @param {string} carrierId - Entity ID carrying the resource
   * @throws {Error} If resource already carried or carrier ID invalid
   */
  pickup(model, carrierId) {
    // Validation
    if (!carrierId) {
      throw new Error('Carrier ID required');
    }
    
    if (model.carriedBy) {
      throw new Error('Resource already carried');
    }
    
    // Assign carrier
    model.carriedBy = carrierId;
  }
  
  /**
   * Drop resource (clear carrier, optionally set position)
   * @param {ResourceModel} model - Resource model
   * @param {number} [x] - Drop position X (optional)
   * @param {number} [y] - Drop position Y (optional)
   */
  drop(model, x, y) {
    // Clear carrier
    model.carriedBy = null;
    
    // Set position if provided
    if (x !== undefined && y !== undefined) {
      model.setPosition(x, y);
    }
  }
  
  /**
   * Check if resource is currently carried
   * @param {ResourceModel} model - Resource model
   * @returns {boolean} True if carried
   */
  isCarried(model) {
    return model.carriedBy !== null;
  }
  
  /**
   * Internal update logic for resources
   * @protected
   * @param {ResourceModel} model - Resource model to update
   * @param {number} deltaTime - Time since last frame (milliseconds)
   */
  _updateInternal(model, deltaTime) {
    // 1. Check for depletion
    if (model.amount <= 0) {
      // Resource depleted - could disable model for cleanup
      // model.enabled = false;
    }
    
    // 2. Resource-specific behavior
    this._updateResourceType(model, deltaTime);
    
    // 3. Weight/physics (if not carried)
    if (!this.isCarried(model)) {
      this._updatePhysics(model, deltaTime);
    }
  }
  
  /**
   * Resource type-specific behavior
   * @private
   */
  _updateResourceType(model, deltaTime) {
    // Resource type logic placeholder
    // Different resources might have different behaviors:
    // - greenLeaf: Decay over time
    // - stick: Static
    // - stone: Heavy, affects movement
    // (Full implementation requires game context)
  }
  
  /**
   * Physics for non-carried resources
   * @private
   */
  _updatePhysics(model, deltaTime) {
    // Physics logic placeholder
    // Full implementation would:
    // 1. Apply gravity
    // 2. Check terrain collision
    // 3. Settle resources on ground
    // (Requires integration with terrain system)
  }
  
  /**
   * Handle input for resources
   * @protected
   * @param {ResourceModel} model - Resource model
   * @param {Object} input - Input state (mouse, keyboard)
   */
  _handleInputInternal(model, input) {
    // Input handling placeholder
    // Full implementation would:
    // 1. Check for click selection
    // 2. Handle drag/drop UI
    // 3. Show resource info tooltip
    // (Requires integration with input system)
  }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResourceController;
}

// Export for browser
if (typeof window !== 'undefined') {
  window.ResourceController = ResourceController;
}
