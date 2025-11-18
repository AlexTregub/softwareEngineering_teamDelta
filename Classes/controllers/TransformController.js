/**
 * TransformController - Handles position, size, rotation, and sprite synchronization
 */
class TransformController {
  constructor(entity) {
    this._entity = entity;
    this._isDirty = false; // Track if transform needs sprite update
    
    // Initialize cached values safely (avoid circular dependency during construction)
    this._lastPosition = { x: 0, y: 0 };
    this._lastSize = { x: 32, y: 32 };
    this._lastRotation = 0;
    
    // Initialize with collision box values if available
    if (entity._collisionBox) {
      this._lastPosition.x = entity._collisionBox.x;
      this._lastPosition.y = entity._collisionBox.y;
      this._lastSize.x = entity._collisionBox.width;
      this._lastSize.y = entity._collisionBox.height;
    }
  }

  // --- Public API ---

  /**
   * Update transform - sync with sprite if dirty
   */
  update() {
    if (this._isDirty) {
      this.syncSprite();
      this._isDirty = false;
    }
  }

  // --- Position Management ---

  /**
   * Set position - Called by Entity after collision box is updated
   * Collision box is already updated by Entity.setPosition() before this is called
   * @param {number} x - X coordinate in world space (pixels)
   * @param {number} y - Y coordinate in world space (pixels)
   */
  setPosition(x, y) {
    // Update StatsContainer if available -- NEVER AVAILABLE
    if (this._entity._stats && 
        this._entity._stats.position && 
        this._entity._stats.position.statValue) {
      this._entity._stats.position.statValue.x = x;
      this._entity._stats.position.statValue.y = y;

      // console.log("QWERTYUI")
    }
    
    // Update cache for dirty flag tracking
    this._lastPosition.x = x;
    this._lastPosition.y = y;
    this._isDirty = true;

    // console.log("QWERTYUI")
  }

  /**
   * Get position - CollisionBox is the single source of truth
   * @returns {Object} Position object with x, y
   */
  getPosition() {
    // CollisionBox is the authoritative source for position
    if (this._entity._collisionBox) {
      return {
        x: this._entity._collisionBox.x,
        y: this._entity._collisionBox.y
      };
    }
    // Last resort cached value
    if (this._lastPosition && this._lastPosition.x !== undefined) {
      return this._lastPosition;
    }
  }

  /**
   * Get center position
   * @returns {Object} Center position with x, y
   */
  getCenter() {
    const pos = this.getPosition();
    const size = this.getSize();
    return {
      x: pos.x + (size.x / 2),
      y: pos.y + (size.y / 2)
    };
  }

  // --- Size Management ---

  /**
   * Set size
   * @param {number} width - Width
   * @param {number} height - Height
   */
  setSize(width, height) {
    if (this._entity._stats && 
        this._entity._stats.size && 
        this._entity._stats.size.statValue) {
      this._entity._stats.size.statValue.x = width;
      this._entity._stats.size.statValue.y = height;
    }
    this._lastSize.x = width;
    this._lastSize.y = height;
    this._isDirty = true;
  }

  /**
   * Get size
   * @returns {Object} Size object with x, y
   */
  getSize() {
    // Try to get from StatsContainer system first
    if (this._entity._stats && this._entity._stats.size && this._entity._stats.size.statValue) {
      return this._entity._stats.size.statValue;
    }
    
    // Fall back to cached size
    if (this._lastSize && this._lastSize.x !== undefined) {
      return this._lastSize;
    }
    
    // Final fallback to collision box
    if (this._entity._collisionBox) {
      return {
        x: this._entity._collisionBox.width,
        y: this._entity._collisionBox.height
      };
    }
    
    // Absolute fallback
    return { x: 32, y: 32 };
  }

  // --- Rotation Management ---

  /**
   * Set rotation
   * @param {number} rotation - Rotation in degrees
   */
  setRotation(rotation) {
    // Normalize rotation to 0-360 range
    while (rotation > 360) rotation -= 360;
    while (rotation < 0) rotation += 360;
    
    this._lastRotation = rotation;
    this._isDirty = true;
  }

  /**
   * Get rotation
   * @returns {number} Rotation in degrees
   */
  getRotation() {
    return this._lastRotation;
  }

  /**
   * Rotate by delta amount
   * @param {number} delta - Amount to rotate by in degrees
   */
  rotate(delta) {
    this.setRotation(this._lastRotation + delta);
  }

  // --- Utility Methods ---

  /**
   * Check if point is within entity bounds
   * @param {number} x - X coordinate (ASSUMES WORLD COORDINATES)
   * @param {number} y - Y coordinate (ASSUMES WORLD COORDINATES)
   * @returns {boolean} True if point is within bounds
   */
  contains(x, y) {
    const pos = this.getPosition();
    const size = this.getSize();
    
    const result = (
      x >= pos.x &&
      x <= pos.x + size.x &&
      y >= pos.y &&
      y <= pos.y + size.y
    );
    
    return result;
  }

  /**
   * Get distance to another transform controller or position
   * @param {TransformController|Object} target - Target with getPosition() or {x, y}
   * @returns {number} Distance in pixels
   */
  getDistanceTo(target) {
    const thisPos = this.getPosition();
    const targetPos = target.getPosition ? target.getPosition() : target;
    
    const dx = thisPos.x - targetPos.x;
    const dy = thisPos.y - targetPos.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Move by offset amount
   * @param {number} deltaX - X offset
   * @param {number} deltaY - Y offset
   */
  translate(deltaX, deltaY) {
    const pos = this.getPosition();
    this.setPosition(pos.x + deltaX, pos.y + deltaY);
  }

  /**
   * Scale size by factor
   * @param {number} factor - Scale factor
   */
  scale(factor) {
    const size = this.getSize();
    this.setSize(size.x * factor, size.y * factor);
  }

  // --- Sprite Synchronization ---

  /**
   * Sync transform values with sprite and collision box
   */
  syncSprite() {
    if (!this._entity._sprite) return;
    
    const pos = this.getPosition();
    const size = this.getSize();
    
    // Update sprite position and size
    this._entity._sprite.setPosition(createVector(pos.x, pos.y));
    this._entity._sprite.setSize(createVector(size.x, size.y));
    this._entity._sprite.setRotation(this._lastRotation);

    // Update collision box position and size (synced the same way as sprite)
    this._entity._collisionBox.setPosition(createVector(pos.x, pos.y));
    this._entity._collisionBox.setSize(size.x, size.y);
  }

  /**
   * Force sprite sync (useful for initialization)
   */
  forceSyncSprite() {
    this._isDirty = true;
    this.syncSprite();
    this._isDirty = false;
  }

  // --- Bounds and Collision ---

  /**
   * Get bounding box
   * @returns {Object} Bounding box with x, y, width, height
   */
  getBounds() {
    const pos = this.getPosition();
    const size = this.getSize();
    
    return {
      x: pos.x,
      y: pos.y,
      width: size.x,
      height: size.y
    };
  }

  /**
   * Check if this transform intersects with another
   * @param {TransformController} other - Other transform controller
   * @returns {boolean} True if intersecting
   */
  intersects(other) {
    const thisBounds = this.getBounds();
    const otherBounds = other.getBounds();
    
    return !(
      thisBounds.x + thisBounds.width < otherBounds.x ||
      otherBounds.x + otherBounds.width < thisBounds.x ||
      thisBounds.y + thisBounds.height < otherBounds.y ||
      otherBounds.y + otherBounds.height < thisBounds.y
    );
  }

  /**
   * Get debug information
   * @returns {Object} Debug information
   */
  getDebugInfo() {
    return {
      position: this.getPosition(),
      size: this.getSize(),
      rotation: this.getRotation(),
      center: this.getCenter(),
      bounds: this.getBounds(),
      isDirty: this._isDirty
    };
  }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TransformController;
}