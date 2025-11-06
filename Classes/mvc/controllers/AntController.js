/**
 * AntController - Controls ant behavior (movement, tasks, combat)
 * Extends EntityController with ant-specific logic
 * 
 * **Features**:
 * - **Movement** - Pathfinding, waypoint following, target seeking
 * - **Combat** - Attack target tracking, damage dealing
 * - **Tasks** - Job-specific behavior (Scout, Warrior, Builder, etc.)
 * - **Health** - Damage handling, death state
 * 
 * **Usage**:
 * ```javascript
 * const controller = new AntController();
 * const antModel = new AntModel({ x: 100, y: 200, jobName: 'Scout' });
 * 
 * // Set movement target
 * antModel.targetPosition = { x: 300, y: 400 };
 * 
 * // Update loop
 * controller.update(antModel, deltaTime);
 * ```
 */

// Conditional import for Node.js environment
if (typeof module !== 'undefined' && typeof EntityController === 'undefined') {
  var EntityController = require('./EntityController');
}

class AntController extends EntityController {
  /**
   * Movement speed (pixels per millisecond)
   * @private
   */
  get _baseSpeed() {
    return 0.1; // 100 pixels per second at 60fps
  }
  
  /**
   * Distance threshold to consider target "reached"
   * @private
   */
  get _arrivalThreshold() {
    return 5; // pixels
  }
  
  /**
   * Internal update logic for ants
   * @protected
   * @param {AntModel} model - Ant model to update
   * @param {number} deltaTime - Time since last frame (milliseconds)
   */
  _updateInternal(model, deltaTime) {
    // 1. Movement system
    this._updateMovement(model, deltaTime);
    
    // 2. Combat system (if target exists)
    if (model.combatTarget) {
      this._updateCombat(model, deltaTime);
    }
    
    // 3. Job-specific behavior
    this._updateJob(model, deltaTime);
    
    // 4. Health system
    this._updateHealth(model, deltaTime);
  }
  
  /**
   * Movement system - pathfinding and waypoint following
   * @private
   */
  _updateMovement(model, deltaTime) {
    let targetX, targetY;
    
    // Priority 1: Follow path waypoints
    if (model.path && model.path.length > 0) {
      const waypoint = model.path[0];
      targetX = waypoint.x;
      targetY = waypoint.y;
      
      // Check if waypoint reached
      const currentPos = model.getPosition();
      const dist = Math.hypot(targetX - currentPos.x, targetY - currentPos.y);
      
      if (dist < this._arrivalThreshold) {
        // Remove reached waypoint
        model.path.shift();
        
        // Keep path as empty array instead of null (consistent with tests)
        return; // Wait for next frame to start next waypoint
      }
    }
    // Priority 2: Move to target position
    else if (model.targetPosition) {
      targetX = model.targetPosition.x;
      targetY = model.targetPosition.y;
      
      // Check if target reached
      const currentPos = model.getPosition();
      const dist = Math.hypot(targetX - currentPos.x, targetY - currentPos.y);
      
      if (dist < this._arrivalThreshold) {
        // Clear target when reached
        model.targetPosition = null;
        return;
      }
    }
    // No movement target
    else {
      return;
    }
    
    // Calculate movement direction
    const currentPos = model.getPosition();
    const dx = targetX - currentPos.x;
    const dy = targetY - currentPos.y;
    const distance = Math.hypot(dx, dy);
    
    if (distance > 0) {
      // Normalize direction and apply speed
      const moveDistance = this._baseSpeed * deltaTime;
      const actualDistance = Math.min(moveDistance, distance);
      
      const newX = currentPos.x + (dx / distance) * actualDistance;
      const newY = currentPos.y + (dy / distance) * actualDistance;
      
      model.setPosition(newX, newY);
    }
  }
  
  /**
   * Combat system - attack target tracking
   * @private
   */
  _updateCombat(model, deltaTime) {
    // Combat logic placeholder
    // Full implementation would:
    // 1. Check if target is in range
    // 2. Apply damage
    // 3. Clear target if destroyed
    // (Requires integration with game systems)
  }
  
  /**
   * Job-specific behavior
   * @private
   */
  _updateJob(model, deltaTime) {
    // Job-specific logic placeholder
    // Different jobs have different behaviors:
    // - Scout: Faster movement
    // - Warrior: Combat bonuses
    // - Builder: Construction abilities
    // - Farmer: Resource gathering
    // (Full implementation requires game context)
  }
  
  /**
   * Health system - damage and death
   * @private
   */
  _updateHealth(model, deltaTime) {
    // Health logic placeholder
    // Full implementation would:
    // 1. Apply damage over time effects
    // 2. Disable model when health reaches 0
    // 3. Trigger death animations/cleanup
    
    if (model.health <= 0) {
      // Ant is dead - could disable model
      // model.enabled = false;
    }
  }
  
  /**
   * Handle input for ants
   * @protected
   * @param {AntModel} model - Ant model
   * @param {Object} input - Input state (mouse, keyboard)
   */
  _handleInputInternal(model, input) {
    // Input handling placeholder
    // Full implementation would:
    // 1. Check for selection clicks
    // 2. Handle right-click movement commands
    // 3. Process keyboard shortcuts
    // (Requires integration with input system)
  }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AntController;
}

// Export for browser
if (typeof window !== 'undefined') {
  window.AntController = AntController;
}
