/**
 * EntityModel
 * ===========
 * Pure data model for game entities.
 * 
 * RESPONSIBILITIES:
 * - Store entity state (position, size, type, faction, etc.)
 * - Provide getters/setters for data access
 */

class EntityModel {
  /**
   * Create an entity data model
   * @param {Object} options - Configuration options
   * @param {number} options.x - Initial X position (world coordinates)
   * @param {number} options.y - Initial Y position (world coordinates)
   * @param {number} options.width - Width in pixels
   * @param {number} options.height - Height in pixels
   * @param {string} options.type - Entity type name
   * @param {string} options.imagePath - Path to sprite image
   * @param {number} options.movementSpeed - Movement speed
   * @param {string} options.faction - Entity faction
   * @param {number} options.rotation - Initial rotation
   */
  constructor(options = {}) {
    // ===== IDENTITY =====
    this.id = this._generateId();
    this.type = options.type || 'Entity';
    this.isActive = true;

    // ===== TRANSFORM DATA =====
    this.position = {
      x: options.x || 0,
      y: options.y || 0
    };
    
    this.size = {
      x: options.width || 32,
      y: options.height || 32
    };
    
    this.rotation = options.rotation || 0;

    // ===== VISUAL DATA =====
    this.imagePath = options.imagePath || null;
    this.opacity = 255;
    this.visible = true;

    // ===== STATE DATA =====
    this.faction = options.faction || 'neutral';
    this.jobName = null;
    this.movementSpeed = options.movementSpeed || 1;
    this.selected = false; // Selection state

    // ===== COMPONENT REFERENCES =====
    // These are set by the controller, not created here
    this.collisionBox = null;
    this.sprite = null;
  }

  // ===== ID GENERATION =====
  /**
   * Generate unique entity ID
   * @returns {string} Unique identifier
   * @private
   */
  _generateId() {
    return `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ===== POSITION ACCESSORS =====
  /**
   * Get position (returns a copy to prevent external mutation)
   * @returns {{x: number, y: number}} Position copy
   */
  getPosition() {
    return { x: this.position.x, y: this.position.y };
  }

  /**
   * Set position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  setPosition(x, y) {
    this.position.x = x;
    this.position.y = y;
  }

  /**
   * Get X coordinate
   * @returns {number} X position
   */
  getX() {
    return this.position.x;
  }

  /**
   * Get Y coordinate
   * @returns {number} Y position
   */
  getY() {
    return this.position.y;
  }

  // ===== SIZE ACCESSORS =====
  /**
   * Get size (returns a copy to prevent external mutation)
   * @returns {{x: number, y: number}} Size copy
   */
  getSize() {
    return { x: this.size.x, y: this.size.y };
  }

  /**
   * Set size
   * @param {number} width - Width in pixels
   * @param {number} height - Height in pixels
   */
  setSize(width, height) {
    this.size.x = width;
    this.size.y = height;
  }

  // ===== VISUAL ACCESSORS =====
  /**
   * Get opacity
   * @returns {number} Opacity value (0-255)
   */
  getOpacity() {
    return this.opacity;
  }

  /**
   * Set opacity
   * @param {number} alpha - Opacity value (0-255)
   */
  setOpacity(alpha) {
    this.opacity = alpha;
  }

  /**
   * Check if visible
   * @returns {boolean} True if visible
   */
  isVisible() {
    return this.visible;
  }

  /**
   * Set visibility
   * @param {boolean} visible - Visibility state
   */
  setVisible(visible) {
    this.visible = visible;
  }

  /**
   * Set rotation
   * @param {number} rotation - Rotation in radians
   */
  setRotation(rotation) {
    this.rotation = rotation;
  }

  // ===== STATE ACCESSORS =====
  /**
   * Get job name
   * @returns {string|null} Current job name
   */
  getJobName() {
    return this.jobName;
  }

  /**
   * Set job name
   * @param {string} jobName - Job name
   */
  setJobName(jobName) {
    this.jobName = jobName;
  }

  /**
   * Set active state
   * @param {boolean} active - Active state
   */
  setActive(active) {
    this.isActive = active;
  }

  // ===== COMPONENT REFERENCES =====
  /**
   * Get sprite reference
   * @returns {Sprite2D|null} Sprite instance or null
   */
  getSprite() {
    return this.sprite;
  }

  /**
   * Set sprite reference (does NOT call sprite methods - data storage only)
   * @param {Sprite2D|null} sprite - Sprite instance or null
   */
  setSprite(sprite) {
    this.sprite = sprite;
  }

  // ===== VALIDATION DATA =====
  /**
   * Get validation data for testing/debugging
   * @returns {Object} Complete model state
   */
  getValidationData() {
    return {
      id: this.id,
      type: this.type,
      faction: this.faction,
      jobName: this.jobName,
      position: this.getPosition(),
      size: this.getSize(),
      isActive: this.isActive,
      visible: this.visible,
      opacity: this.opacity,
      rotation: this.rotation,
      movementSpeed: this.movementSpeed,
      timestamp: new Date().toISOString()
    };
  }
}

// ===== EXPORTS =====
if (typeof window !== 'undefined') {
  window.EntityModel = EntityModel;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EntityModel;
}
