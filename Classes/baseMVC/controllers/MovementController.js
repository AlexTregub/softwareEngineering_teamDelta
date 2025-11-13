/**
 * MovementController.js - MVC-compliant movement coordination
 * 
 * Responsibilities:
 * - Coordinate movement between Model (state) and external systems (pathfinding, terrain)
 * - Handle pathfinding logic
 * - Apply terrain modifiers
 * - Detect stuck entities
 * - NO state storage (all state in Model)
 * 
 * MVC Pattern:
 * - Reads state from Model (position, isMoving, targetPosition, path)
 * - Writes state to Model (setPosition, setMoving, setTargetPosition, setPath)
 * - Coordinates with external systems (pathfinding, terrain)
 */

// Node.js: Load dependencies
if (typeof require !== 'undefined' && typeof module !== 'undefined' && module.exports) {
  // Dependencies loaded in test environment
}

class MovementController {
  /**
   * Create a MovementController
   * @param {Object} model - Entity model with movement state
   * @param {Object} options - Configuration options
   */
  constructor(model, options = {}) {
    if (!model) {
      throw new Error('MovementController requires a model');
    }
    
    this.model = model;
    
    // Configuration (not persistent state)
    this._skitterTimer = 0;
    this._maxSkitterTime = options.maxSkitterTime || 200;
    this._minSkitterTime = options.minSkitterTime || 30;
    
    // Stuck detection (transient state, not persistent)
    this._lastPosition = null;
    this._stuckCounter = 0;
    this._maxStuckFrames = options.maxStuckFrames || 60;
    
    // External system references (dependency injection)
    this._pathfindingSystem = options.pathfindingSystem || null;
    this._terrainSystem = options.terrainSystem || null;
    
    this.resetSkitterTimer();
  }

  // --- Public API (Coordinates Model + Systems) ---
  
  /**
   * Move entity to specific coordinates
   * @param {number} x - Target X coordinate
   * @param {number} y - Target Y coordinate
   * @returns {boolean} - True if movement started successfully
   */
  moveToLocation(x, y) {
    // Validation
    if (typeof x !== 'number' || typeof y !== 'number') {
      throw new Error('Target coordinates must be numbers');
    }

    // Handle sprite flip direction (left/right)
    const pos = this.model.getPosition();
    const flipLeft = (x < pos.x);
    if (typeof this.model.setFlipX === 'function') {
      this.model.setFlipX(flipLeft);
    }

    // Try pathfinding first
    const path = this._calculatePath(x, y);
    
    if (path && path.length > 0) {
      // Set path in Model
      this.model.setPath(path);
      this.model.setTargetPosition(x, y);
      this.model.setMoving(true);
      this._stuckCounter = 0;
      return true;
    }
    
    // Fallback to direct movement
    this.model.setTargetPosition(x, y);
    this.model.setMoving(true);
    this._stuckCounter = 0;
    return true;
  }

  /**
   * Stop current movement and clear path
   */
  stop() {
    this.model.setMoving(false);
    this.model.setTargetPosition(null, null);
    this.model.setPath(null);
    this._stuckCounter = 0;
  }

  /**
   * Check if entity is currently moving (reads from Model)
   * @returns {boolean}
   */
  isMoving() {
    return this.model.isMoving();
  }

  /**
   * Check if entity has a target position (reads from Model)
   * @returns {boolean}
   */
  hasTarget() {
    const target = this.model.getTargetPosition();
    return target !== null && target !== undefined;
  }

  /**
   * Get current target position (reads from Model)
   * @returns {Object|null} - Target position {x, y} or null
   */
  getTarget() {
    return this.model.getTargetPosition();
  }

  /**
   * Get movement speed (reads from Model)
   * @returns {number} - Current movement speed
   */
  getMovementSpeed() {
    if (typeof this.model.getMovementSpeed === 'function') {
      return this.model.getMovementSpeed();
    }
    return 30; // Default fallback
  }

  /**
   * Set movement speed (writes to Model)
   * @param {number} speed - New movement speed
   */
  setMovementSpeed(speed) {
    if (typeof this.model.setMovementSpeed === 'function') {
      this.model.setMovementSpeed(speed);
    }
  }

  /**
   * Set path for entity to follow
   * @param {Array} pathArray - Array of path nodes
   */
  setPath(pathArray) {
    this.model.setPath(pathArray);
  }

  /**
   * Get current path (reads from Model)
   * @returns {Array|null} - Path array or null
   */
  getPath() {
    return this.model.getPath();
  }

  /**
   * Update movement logic - call this every frame
   * Coordinates: Model state → position updates → Model state
   * @param {number} deltaTime - Time since last frame (ms)
   */
  update(deltaTime = 16.67) {
    if (!this.model.isActive()) {
      console.log('[MovementController.update] Model is not active, skipping update');
      return;
    }
    
    const isMoving = this.model.isMoving();
    const hasTarget = this.model.getTargetPosition();
    const path = this.model.getPath();
    
    console.log(`[MovementController.update] isMoving: ${isMoving}, hasTarget: ${!!hasTarget}, hasPath: ${!!path}`);
    
    // Handle path following
    if (isMoving && path && path.length > 0) {
      console.log('[MovementController.update] Following path...');
      this._followPath();
    }
    
    // Handle direct movement
    if (isMoving && hasTarget) {
      console.log('[MovementController.update] Direct movement...');
      this._updateDirectMovement(deltaTime);
    }
    
    // Handle idle skitter behavior
    if (!isMoving && this._shouldSkitter()) {
      this._performSkitter();
    }

    // Update stuck detection
    this._updateStuckDetection();
  }

  // --- Private Methods (Logic only, no state storage) ---

  /**
   * Calculate path using pathfinding system
   * @param {number} targetX - Target X coordinate
   * @param {number} targetY - Target Y coordinate
   * @returns {Array|null} - Path array or null
   * @private
   */
  _calculatePath(targetX, targetY) {
    // Use injected pathfinding system if available
    if (this._pathfindingSystem && typeof this._pathfindingSystem.findPath === 'function') {
      const pos = this.model.getPosition();
      return this._pathfindingSystem.findPath(pos.x, pos.y, targetX, targetY);
    }
    
    // Use global pathfinding system (g_gridMap and findPath)
    if (typeof findPath === 'function' && typeof g_gridMap !== 'undefined' && g_gridMap) {
      try {
        const pos = this.model.getPosition();
        const tileSize = (typeof window !== 'undefined' && window.tileSize) || 32;
        
        const startX = Math.floor(pos.x / tileSize);
        const startY = Math.floor(pos.y / tileSize);
        const endX = Math.floor(targetX / tileSize);
        const endY = Math.floor(targetY / tileSize);

        const path = findPath([startX, startY], [endX, endY], g_gridMap);
        return path;
      } catch (error) {
        console.warn("Pathfinding failed:", error);
        return null;
      }
    }
    
    return null;
  }

  /**
   * Follow the current path by moving to the next node
   * @private
   */
  _followPath() {
    const path = this.model.getPath();
    if (!path || path.length === 0) return;

    const nextNode = path[0]; // Peek at next node
    let targetX, targetY;

    // Handle different path node formats
    if (nextNode._x !== undefined && nextNode._y !== undefined) {
      const tileSize = (typeof window !== 'undefined' && window.tileSize) || 32;
      targetX = nextNode._x * tileSize;
      targetY = nextNode._y * tileSize;
    } else if (nextNode.x !== undefined && nextNode.y !== undefined) {
      targetX = nextNode.x;
      targetY = nextNode.y;
    } else {
      console.warn("Invalid path node format:", nextNode);
      this.model.setPath(null); // Clear invalid path
      return;
    }

    // Check if we reached this node
    const pos = this.model.getPosition();
    const dx = targetX - pos.x;
    const dy = targetY - pos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 5) {
      // Reached node, remove it and continue
      const newPath = [...path];
      newPath.shift();
      this.model.setPath(newPath.length > 0 ? newPath : null);
      
      // If no more nodes, stop moving
      if (newPath.length === 0) {
        this.stop();
      }
    } else {
      // Move towards this node
      this.model.setTargetPosition(targetX, targetY);
    }
  }

  /**
   * Update direct movement towards target
   * @param {number} deltaTime - Time since last frame (ms)
   * @private
   */
  _updateDirectMovement(deltaTime) {
    const target = this.model.getTargetPosition();
    if (!target) return;

    const currentPos = this.model.getPosition();
    console.log(`[MovementController._updateDirectMovement] Current: (${currentPos.x.toFixed(1)}, ${currentPos.y.toFixed(1)}), Target: (${target.x.toFixed(1)}, ${target.y.toFixed(1)})`);
    
    const direction = {
      x: target.x - currentPos.x,
      y: target.y - currentPos.y
    };

    const distance = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    console.log(`[MovementController._updateDirectMovement] Distance: ${distance.toFixed(2)}`);

    if (distance > 1) {
      // Normalize direction
      direction.x /= distance;
      direction.y /= distance;

      // Calculate movement step
      const effectiveSpeed = this._getEffectiveMovementSpeed();
      const speedPerMs = effectiveSpeed / 1000;
      const step = Math.min(speedPerMs * deltaTime, distance);
      
      console.log(`[MovementController._updateDirectMovement] EffectiveSpeed: ${effectiveSpeed}, Step: ${step.toFixed(3)}`);

      if (effectiveSpeed > 0) {
        const newPos = {
          x: currentPos.x + direction.x * step,
          y: currentPos.y + direction.y * step
        };
        
        console.log(`[MovementController._updateDirectMovement] Setting new position: (${newPos.x.toFixed(1)}, ${newPos.y.toFixed(1)})`);
        
        // Update Model position
        this.model.setPosition(newPos.x, newPos.y);
        
        const verifyPos = this.model.getPosition();
        console.log(`[MovementController._updateDirectMovement] Verified position: (${verifyPos.x.toFixed(1)}, ${verifyPos.y.toFixed(1)})`);
      }
    } else {
      // Target reached
      console.log('[MovementController._updateDirectMovement] Target reached, stopping');
      this.model.setPosition(target.x, target.y);
      this.stop();
    }
  }

  /**
   * Get effective movement speed with terrain modifiers
   * @returns {number} - Effective speed
   * @private
   */
  _getEffectiveMovementSpeed() {
    let baseSpeed = this.getMovementSpeed();

    // Apply terrain modifiers if terrain system available
    if (this._terrainSystem) {
      const pos = this.model.getPosition();
      
      // Try getSpeedModifier method first
      if (typeof this._terrainSystem.getSpeedModifier === 'function') {
        const modifier = this._terrainSystem.getSpeedModifier(pos.x, pos.y);
        return baseSpeed * modifier;
      }
      
      // Fallback: Try getTile method and calculate modifier from tile type
      if (typeof this._terrainSystem.getTile === 'function') {
        const tile = this._terrainSystem.getTile(pos.x, pos.y);
        if (tile && typeof tile.cost === 'number') {
          return baseSpeed / tile.cost; // Higher cost = slower movement
        }
      }
    }

    return baseSpeed;
  }

  /**
   * Check if entity should perform skitter behavior
   * @returns {boolean}
   * @private
   */
  _shouldSkitter() {
    if (this._getEffectiveMovementSpeed() <= 0) return false;
    
    this._skitterTimer -= 1;
    return this._skitterTimer <= 0;
  }

  /**
   * Perform random skitter movement
   * @private
   */
  _performSkitter() {
    this.resetSkitterTimer();
    
    const currentPos = this.model.getPosition();
    const skitterRange = 25;
    const newX = currentPos.x + (Math.random() - 0.5) * 2 * skitterRange;
    const newY = currentPos.y + (Math.random() - 0.5) * 2 * skitterRange;
    
    this.moveToLocation(newX, newY);
  }

  /**
   * Reset skitter timer to random value
   */
  resetSkitterTimer() {
    this._skitterTimer = Math.random() * (this._maxSkitterTime - this._minSkitterTime) + this._minSkitterTime;
  }

  /**
   * Update stuck detection logic
   * @private
   */
  _updateStuckDetection() {
    const currentPos = this.model.getPosition();
    
    if (this._lastPosition) {
      const distance = Math.sqrt(
        Math.pow(currentPos.x - this._lastPosition.x, 2) +
        Math.pow(currentPos.y - this._lastPosition.y, 2)
      );
      
      if (this.model.isMoving() && distance < 0.1) {
        this._stuckCounter++;
        
        if (this._stuckCounter >= this._maxStuckFrames) {
          this._handleStuck();
        }
      } else {
        this._stuckCounter = 0;
      }
    }
    
    this._lastPosition = { x: currentPos.x, y: currentPos.y };
  }

  /**
   * Handle stuck entity by stopping movement
   * @private
   */
  _handleStuck() {
    console.warn(`Entity stuck for ${this._maxStuckFrames} frames, stopping movement`);
    this.stop();
  }

  /**
   * Get debug information about movement state
   * @returns {Object} - Debug info
   */
  getDebugInfo() {
    return {
      isMoving: this.model.isMoving(),
      currentPosition: this.model.getPosition(),
      targetPosition: this.model.getTargetPosition(),
      path: this.model.getPath(),
      pathLength: this.model.getPath()?.length || 0,
      skitterTimer: this._skitterTimer,
      stuckCounter: this._stuckCounter,
      effectiveSpeed: this._getEffectiveMovementSpeed()
    };
  }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MovementController;
}

// Make available globally for browser
if (typeof window !== 'undefined') {
  window.MovementController = MovementController;
}
