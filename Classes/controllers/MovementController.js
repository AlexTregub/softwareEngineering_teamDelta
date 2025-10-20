/**
 * MovementController - Handles all entity movement logic
 * Provides pathfinding, terrain-aware movement, and position management
 */
class MovementController {
  constructor(entity) {
    this._entity = entity;
    this._isMoving = false;
    this._targetPosition = null;
    this._path = null;
    this._wandering = false;
    this._movementSpeed = 30; // Default speed
    this._skitterTimer = 0;
    this._maxSkitterTime = 200;
    this._minSkitterTime = 30;
    
    // Movement state
    this._lastPosition = null;
    this._stuckCounter = 0;
    this._maxStuckFrames = 60; // 1 second at 60fps
    
    this.resetSkitterTimer();
  }

  // --- Public API ---
  
  /**
   * Move entity to specific coordinates
   * @param {number} x - Target X coordinate
   * @param {number} y - Target Y coordinate
   * @returns {boolean} - True if movement started successfully
   */
  moveToLocation(x, y) {
    // Check if entity's state machine allows movement
    if (this._entity._stateMachine && !this._entity._stateMachine.canPerformAction("move")) {
      return false;
    }

    // Try to use pathfinding if available
    if (typeof findPath === 'function' && typeof pathMap !== 'undefined' && pathMap) {
      try {
        // Convert entity position to grid coordinates
        const tileSize = window.tileSize || 32;
        const pos = this._entity.getPosition();
        const startX = Math.floor(pos.x / tileSize);
        const startY = Math.floor(pos.y / tileSize);
        const endX = Math.floor(x / tileSize);
        const endY = Math.floor(y / tileSize);

        // Find path using pathfinding system
        const calculatedPath = findPath([startX, startY], [endX, endY], pathMap);
        
        if (calculatedPath && calculatedPath.length > 0) {
          // Set the path and start following it
          this.setPath(calculatedPath);
          return true;
        }
      } catch (error) {
        console.warn("Pathfinding failed, using direct movement:", error);
      }
    }

    // Fallback to direct movement
    this._targetPosition = { x, y };
    this._isMoving = true;
    this._stuckCounter = 0;

    // Update entity's state if it has a state machine
    if (this._entity._stateMachine) {
      this._entity._stateMachine.setPrimaryState("MOVING");
    }

    return true;
  }

  /**
   * Set a path for the entity to follow
   * @param {Array} pathArray - Array of path nodes with x, y coordinates
   */
  setPath(pathArray) {
    this._path = pathArray ? [...pathArray] : null;
    
    // Start following path if one exists
    if (this._path && this._path.length > 0) {
      this.followPath();
    }
  }

  /**
   * Get current path
   * @returns {Array|null} - Current path array or null
   */
  getPath() {
    return this._path;
  }

  /**
   * Stop current movement and clear path
   */
  stop() {
    this._isMoving = false;
    this._targetPosition = null;
    this._path = null;
    this._stuckCounter = 0;

    // Update entity state to idle if it has a state machine
    if (this._entity._stateMachine && this._entity._stateMachine.isPrimaryState("MOVING")) {
      this._entity._stateMachine.setPrimaryState("IDLE");
    }
  }

  /**
   * Check if entity is currently moving
   * @returns {boolean}
   */
  getIsMoving() {
    return this._isMoving;
  }

  /**
   * Get current target position
   * @returns {Object|null} - Target position {x, y} or null
   */
  getTarget() {
    return this._targetPosition;
  }

  /**
   * Get movement speed
   * @returns {number} - Current movement speed
   */
  get movementSpeed() {
    return this._movementSpeed;
  }

  /**
   * Set movement speed
   * @param {number} speed - New movement speed
   */
  set movementSpeed(speed) {
    this._movementSpeed = speed;
  }

  /**
   * Update movement logic - call this every frame
   */
  update() {
    // Handle pathfinding movement first
    if (!this._isMoving && this._path && this._path.length > 0) {
      this.followPath();
    }

    if(!this._isMoving && this._wandering){
      this.handlePheromoneMovement();
    }
    
    // Handle direct movement
    if (this._isMoving && this._targetPosition) {
      this.updateDirectMovement();
    }
    
    // Handle idle skitter behavior
    if (!this._isMoving && this.shouldSkitter()) {
      this.performSkitter();
    }

    // Update stuck detection
    this.updateStuckDetection();
    this._wandering = true;
  }

  // --- Private Methods ---

  /**
   * Follow the current path by moving to the next node
   */
  followPath() {
    if (!this._path || this._path.length === 0) return;

    const nextNode = this._path.shift();
    let targetX, targetY;

    // Handle different path node formats
    if (nextNode._x !== undefined && nextNode._y !== undefined) {
      // Tile-based pathfinding format
      const tileSize = window.tileSize || 32; // Default tile size
      targetX = nextNode._x * tileSize;
      targetY = nextNode._y * tileSize;
    } else if (nextNode.x !== undefined && nextNode.y !== undefined) {
      // Direct coordinate format
      targetX = nextNode.x;
      targetY = nextNode.y;
    } else {
      console.warn("Invalid path node format:", nextNode);
      return;
    }

    this.moveToLocation(targetX, targetY);
  }

  /**
   * Update direct movement towards target
   */
  updateDirectMovement() {
    if (!this._targetPosition) return;

    const currentPos = this.getCurrentPosition();
    const target = this._targetPosition;

    const direction = {
      x: target.x - currentPos.x,
      y: target.y - currentPos.y
    };

    const distance = Math.sqrt(direction.x * direction.x + direction.y * direction.y);

    if (distance > 1) {
      // Normalize direction
      direction.x /= distance;
      direction.y /= distance;

      // Calculate movement step
      const effectiveSpeed = this.getEffectiveMovementSpeed();
      const deltaTime = window.deltaTime || 16.67; // Default to 60fps
      const speedPerMs = effectiveSpeed / 1000;
      const step = Math.min(speedPerMs * deltaTime, distance);

      // Only move if effective speed is greater than 0
      if (effectiveSpeed > 0) {
        const newPos = {
          x: currentPos.x + direction.x * step,
          y: currentPos.y + direction.y * step
        };
        this.setEntityPosition(newPos);
      }
    } else {
      // Target reached
      this.setEntityPosition(target);
      this._isMoving = false;
      this._targetPosition = null;

      // Handle resource drop-off if entity has resource manager
      if (this._entity._resourceManager && this._entity._resourceManager.isDroppingOff) {
        const globalResource = window.globalResource || [];
        this._entity._resourceManager.processDropOff(globalResource);
      }

      // Set state back to IDLE when movement is complete
      if (this._entity._stateMachine && this._entity._stateMachine.isPrimaryState("MOVING")) {
        // Check if there are pending commands
        if (this._entity._taskManager && this._entity._taskManager.hasPendingTasks()) {
          // Don't set to IDLE if there are pending tasks
        } else {
          this._entity._stateMachine.setPrimaryState("IDLE");
        }
      }
    }
  }

  /**
   * Get effective movement speed with terrain modifiers
   * @returns {number} - Effective speed
   */
  getEffectiveMovementSpeed() {
    let baseSpeed = this._movementSpeed;

    // Get base speed from entity if available
    if (this._entity.movementSpeed !== undefined) {
      baseSpeed = this._entity.movementSpeed;
    }

    // Apply terrain modifiers if entity has state machine
    if (this._entity._stateMachine) {
      switch (this._entity._stateMachine.terrainModifier) {
        case "IN_WATER":
          return baseSpeed * 0.5; // 50% speed in water
        case "IN_MUD":
          return baseSpeed * 0.3; // 30% speed in mud
        case "ON_SLIPPERY":
          return 0; // Can't move on slippery terrain
        case "ON_ROUGH":
          return baseSpeed * 0.8; // 80% speed on rough terrain
        case "DEFAULT":
        default:
          return baseSpeed; // Normal speed
      }
    }

    return baseSpeed;
  }

  /**
   * Get current entity position
   * @returns {Object} - Position {x, y}
   */
  getCurrentPosition() {
    return this._entity.getPosition();
  }

  /**
   * Set entity position
   * @param {Object} position - New position {x, y}
   */
  setEntityPosition(position) {
    this._entity.setPosition(position.x, position.y);
    
    // Update StatsContainer system if available and properly structured
    if (this._entity._stats && 
        this._entity._stats.position && 
        this._entity._stats.position.statValue) {
      this._entity._stats.position.statValue.x = position.x;
      this._entity._stats.position.statValue.y = position.y;
    }

    // Update sprite position if available
    if (this._entity._sprite && this._entity._sprite.setPosition) {
      this._entity._sprite.setPosition(position);
    }
  }

  handlePheromoneMovement(){
  /*PHEROMONE MOVEMENT
      If set to wander, will run this instead of skittering. Gets location information by using wander and moves to location
  */
    const ant = this._entity;
    let grid = g_pathMap.getGrid();

    if (!ant?.brain || !ant.brain.travelledTiles) return;

    const node = grid.get([200,50]);

    // Wander or track depending on ant state
    const nextNode = wander(grid, node, ant.brain.travelledTiles, ant, ant.brain.movementState || "idle");
    if (nextNode) {
      const nextX = nextNode._x;
      const nextY = nextNode._y;
      console.log(`nextX: ${this.nextX}`);
      console.log(`nextY: ${this.nextY}`);
      this.moveToLocation(nextX, nextY);
    }
  }

  /**
   * Check if entity should perform skitter behavior
   * @returns {boolean}
   */
  shouldSkitter() {
    // Don't skitter if movement speed is 0
    if (this.getEffectiveMovementSpeed() <= 0) {
      return false;
    }

    // Only skitter if idle and out of combat
    if (this._entity._stateMachine) {
      const canMove = this._entity._stateMachine.canPerformAction("move");
      const isIdle = this._entity._stateMachine.isPrimaryState("IDLE");
      const outOfCombat = this._entity._stateMachine.isOutOfCombat();
      
      if (!canMove || !isIdle || !outOfCombat) {
        return false;
      }
    }

    // Check skitter timer
    this._skitterTimer -= 1;
    return this._skitterTimer <= 0;
  }

  /**
   * Perform random skitter movement
   */
  performSkitter() {
    this.resetSkitterTimer();
    
    const currentPos = this.getCurrentPosition();
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
   */
  updateStuckDetection() {
    const currentPos = this.getCurrentPosition();
    
    if (this._lastPosition) {
      const distance = Math.sqrt(
        Math.pow(currentPos.x - this._lastPosition.x, 2) +
        Math.pow(currentPos.y - this._lastPosition.y, 2)
      );
      
      // If moving but hasn't moved much, increment stuck counter
      if (this._isMoving && distance < 0.1) {
        this._stuckCounter++;
        
        // If stuck for too long, stop and try to unstuck
        if (this._stuckCounter >= this._maxStuckFrames) {
          this.handleStuck();
        }
      } else {
        this._stuckCounter = 0;
      }
    }
    
    this._lastPosition = { x: currentPos.x, y: currentPos.y };
  }

  /**
   * Handle stuck entity by stopping movement and clearing path
   */
  handleStuck() {
    console.warn(`Entity stuck for ${this._maxStuckFrames} frames, stopping movement`);
    this.stop();
  }

  /**
   * Get debug information about movement state
   * @returns {Object} - Debug info
   */
  getDebugInfo() {
    const currentPos = this.getCurrentPosition();
    return {
      isMoving: this._isMoving,
      currentPosition: currentPos,
      targetPosition: this._targetPosition,
      pathLength: this._path ? this._path.length : 0,
      skitterTimer: this._skitterTimer,
      stuckCounter: this._stuckCounter,
      effectiveSpeed: this.getEffectiveMovementSpeed()
    };
  }
}

// Static helper to move an entity to a tile coordinate (used by AntUtilities)
MovementController.moveEntityToTile = function(entity, tileX, tileY, tileSize = 32, pathMap = null) {
  if (!entity) return false;
  const px = tileX * tileSize + Math.floor(tileSize / 2);
  const py = tileY * tileSize + Math.floor(tileSize / 2);

  // Prefer delegating to entity.moveToLocation if present
  if (typeof entity.moveToLocation === 'function') {
    return entity.moveToLocation(px, py);
  }

  // Otherwise use the entity's MovementController instance if available
  if (entity._movementController && typeof entity._movementController.moveToLocation === 'function') {
    return entity._movementController.moveToLocation(px, py);
  }

  // As a last resort, try setting position directly
  if (typeof entity.setPosition === 'function') {
    entity.setPosition(px, py);
    return true;
  }

  return false;
};

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MovementController;
}
