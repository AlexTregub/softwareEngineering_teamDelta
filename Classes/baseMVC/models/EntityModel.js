/**
 * EntityModel - Pure data storage for entity state
 * 
 * Responsibilities:
 * - Store all entity data (position, size, rotation, etc.)
 * - Provide getters/setters with validation
 * - Fire change events when data updates
 * - NO business logic, NO rendering, NO input handling
 */
class EntityModel {
  /**
   * Create an EntityModel
   * @param {number} x - Initial X position
   * @param {number} y - Initial Y position
   * @param {number} width - Initial width
   * @param {number} height - Initial height
   * @param {Object} options - Configuration options
   */
  constructor(x = 0, y = 0, width = 32, height = 32, options = {}) {
    // Core identity
    this._id = this._generateId();
    this._type = options.type || 'Entity';
    this._isActive = true;

    // Transform data
    this._position = { x, y };
    this._size = { x: width, y: height };
    this._rotation = 0;

    // Visual data
    this._imagePath = options.imagePath || null;
    this._opacity = 1.0;
    this._flipX = false;
    this._flipY = false;

    // Faction
    this._faction = options.faction || 'neutral';

    // Movement state
    this._isMoving = false;
    this._targetPosition = null;
    this._path = null;

    // Selection state
    this._isSelected = false;
    this._isHovered = false;
    this._isBoxHovered = false;

    // Event system
    this._eventListeners = new Map();
  }

  // --- Core Identity ---

  /**
   * Get unique entity ID
   * @returns {string} Entity ID
   */
  getId() {
    return this._id;
  }

  /**
   * Get entity type
   * @returns {string} Entity type
   */
  getType() {
    return this._type;
  }

  /**
   * Get entity type (property accessor for SpatialGridManager)
   * @returns {string} Entity type
   */
  get type() {
    return this._type;
  }

  /**
   * Check if entity is active
   * @returns {boolean} Active state
   */
  isActive() {
    return this._isActive;
  }

  /**
   * Set active state
   * @param {boolean} active - New active state
   */
  setActive(active) {
    const oldActive = this._isActive;
    this._isActive = active;
    this.emit('activeChanged', { oldActive, newActive: active });
  }

  // --- Position Management ---

  /**
   * Get position
   * @returns {Object} Position {x, y}
   */
  getPosition() {
    return { x: this._position.x, y: this._position.y };
  }

  /**
   * Get X coordinate
   * @returns {number} X position
   */
  getX() {
    return this._position.x;
  }

  /**
   * Get Y coordinate
   * @returns {number} Y position
   */
  getY() {
    return this._position.y;
  }

  /**
   * Set position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  setPosition(x, y) {
    this._validateNumber(x, 'X position');
    this._validateNumber(y, 'Y position');

    const oldPosition = { ...this._position };
    this._position.x = x;
    this._position.y = y;

    this.emit('positionChanged', {
      x,
      y,
      oldPosition
    });
  }

  // --- Size Management ---

  /**
   * Get size
   * @returns {Object} Size {x, y}
   */
  getSize() {
    return { x: this._size.x, y: this._size.y };
  }

  /**
   * Set size
   * @param {number} width - Width
   * @param {number} height - Height
   */
  setSize(width, height) {
    this._validatePositiveNumber(width, 'Width');
    this._validatePositiveNumber(height, 'Height');

    const oldSize = { ...this._size };
    this._size.x = width;
    this._size.y = height;

    this.emit('sizeChanged', {
      x: width,
      y: height,
      oldSize
    });
  }

  // --- Rotation Management ---

  /**
   * Get rotation (0-360 degrees)
   * @returns {number} Rotation in degrees
   */
  getRotation() {
    return this._rotation;
  }

  /**
   * Set rotation (auto-normalizes to 0-360)
   * @param {number} rotation - Rotation in degrees
   */
  setRotation(rotation) {
    this._validateNumber(rotation, 'Rotation');

    // Normalize to 0-360
    while (rotation >= 360) rotation -= 360;
    while (rotation < 0) rotation += 360;

    const oldRotation = this._rotation;
    this._rotation = rotation;

    this.emit('rotationChanged', {
      rotation,
      oldRotation
    });
  }

  // --- Faction Management ---

  /**
   * Get faction
   * @returns {string} Faction name
   */
  getFaction() {
    return this._faction;
  }

  /**
   * Set faction
   * @param {string} faction - New faction
   */
  setFaction(faction) {
    if (typeof faction !== 'string') {
      throw new Error('Faction must be a string');
    }

    const oldFaction = this._faction;
    this._faction = faction;

    this.emit('factionChanged', {
      oldFaction,
      newFaction: faction
    });
  }

  // --- Visual Data ---

  /**
   * Get image path
   * @returns {string|null} Image path
   */
  getImagePath() {
    return this._imagePath;
  }

  /**
   * Set image path
   * @param {string|null} path - Image path
   */
  setImagePath(path) {
    const oldPath = this._imagePath;
    this._imagePath = path;

    this.emit('imagePathChanged', {
      oldPath,
      newPath: path
    });
  }

  /**
   * Get opacity (0-1)
   * @returns {number} Opacity value
   */
  getOpacity() {
    return this._opacity;
  }

  /**
   * Set opacity (clamped 0-1)
   * @param {number} opacity - Opacity value
   */
  setOpacity(opacity) {
    this._validateNumber(opacity, 'Opacity');

    // Clamp between 0 and 1
    opacity = Math.max(0, Math.min(1, opacity));

    const oldOpacity = this._opacity;
    this._opacity = opacity;

    this.emit('opacityChanged', {
      oldOpacity,
      newOpacity: opacity
    });
  }

  // --- Flip State ---

  /**
   * Get flipX state
   * @returns {boolean} FlipX state
   */
  getFlipX() {
    return this._flipX;
  }

  /**
   * Set flipX state
   * @param {boolean} flipX - FlipX state
   */
  setFlipX(flipX) {
    if (typeof flipX !== 'boolean') {
      throw new Error('FlipX must be a boolean');
    }

    const oldFlipX = this._flipX;
    this._flipX = flipX;

    this.emit('flipXChanged', {
      oldFlipX,
      newFlipX: flipX
    });
  }

  /**
   * Get flipY state
   * @returns {boolean} FlipY state
   */
  getFlipY() {
    return this._flipY;
  }

  /**
   * Set flipY state
   * @param {boolean} flipY - FlipY state
   */
  setFlipY(flipY) {
    if (typeof flipY !== 'boolean') {
      throw new Error('FlipY must be a boolean');
    }

    const oldFlipY = this._flipY;
    this._flipY = flipY;

    this.emit('flipYChanged', {
      oldFlipY,
      newFlipY: flipY
    });
  }

  // --- Movement State ---

  /**
   * Check if moving
   * @returns {boolean} Moving state
   */
  isMoving() {
    return this._isMoving;
  }

  /**
   * Set moving state
   * @param {boolean} moving - Moving state
   */
  setMoving(moving) {
    this._isMoving = moving;
    this.emit('movingChanged', { moving });
  }

  /**
   * Get target position
   * @returns {Object|null} Target position {x, y} or null
   */
  getTargetPosition() {
    return this._targetPosition ? { ...this._targetPosition } : null;
  }

  /**
   * Set target position
   * @param {number|null} x - X coordinate or null
   * @param {number|null} y - Y coordinate or null
   */
  setTargetPosition(x, y) {
    if (x === null || y === null) {
      this._targetPosition = null;
    } else {
      this._validateNumber(x, 'Target X');
      this._validateNumber(y, 'Target Y');
      this._targetPosition = { x, y };
    }

    this.emit('targetPositionChanged', { target: this._targetPosition });
  }

  /**
   * Get path
   * @returns {Array|null} Path array or null
   */
  getPath() {
    return this._path ? [...this._path] : null;
  }

  /**
   * Set path
   * @param {Array|null} path - Path array or null
   */
  setPath(path) {
    this._path = path ? [...path] : null;
    this.emit('pathChanged', { path: this._path });
  }

  // --- Selection State ---

  /**
   * Check if selected
   * @returns {boolean} Selected state
   */
  isSelected() {
    return this._isSelected;
  }

  /**
   * Set selected state
   * @param {boolean} selected - Selected state
   */
  setSelected(selected) {
    const wasSelected = this._isSelected;
    this._isSelected = selected;

    this.emit('selectionChanged', {
      wasSelected,
      isSelected: selected
    });
  }

  /**
   * Check if hovered
   * @returns {boolean} Hovered state
   */
  isHovered() {
    return this._isHovered;
  }

  /**
   * Set hovered state
   * @param {boolean} hovered - Hovered state
   */
  setHovered(hovered) {
    this._isHovered = hovered;
    this.emit('hoverChanged', { hovered });
  }

  /**
   * Check if box hovered
   * @returns {boolean} Box hovered state
   */
  isBoxHovered() {
    return this._isBoxHovered;
  }

  /**
   * Set box hovered state
   * @param {boolean} boxHovered - Box hovered state
   */
  setBoxHovered(boxHovered) {
    this._isBoxHovered = boxHovered;
    this.emit('boxHoverChanged', { boxHovered });
  }

  // --- Event System ---

  /**
   * Register event listener
   * @param {string} eventName - Event name
   * @param {Function} callback - Callback function
   */
  on(eventName, callback) {
    if (!this._eventListeners.has(eventName)) {
      this._eventListeners.set(eventName, []);
    }
    this._eventListeners.get(eventName).push(callback);
  }

  /**
   * Remove event listener
   * @param {string} eventName - Event name
   * @param {Function} callback - Callback function to remove
   */
  off(eventName, callback) {
    if (!this._eventListeners.has(eventName)) return;

    const listeners = this._eventListeners.get(eventName);
    const index = listeners.indexOf(callback);

    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * Emit event to all listeners
   * @param {string} eventName - Event name
   * @param {Object} data - Event data
   */
  emit(eventName, data = {}) {
    if (!this._eventListeners.has(eventName)) return;

    const listeners = this._eventListeners.get(eventName);
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${eventName}:`, error);
      }
    });
  }

  // --- Private Helpers ---

  /**
   * Generate unique ID
   * @returns {string} Unique ID
   * @private
   */
  _generateId() {
    return `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate that value is a number
   * @param {*} value - Value to validate
   * @param {string} name - Property name for error message
   * @private
   */
  _validateNumber(value, name) {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error(`${name} must be a valid number`);
    }
  }

  /**
   * Validate that value is a positive number
   * @param {*} value - Value to validate
   * @param {string} name - Property name for error message
   * @private
   */
  _validatePositiveNumber(value, name) {
    this._validateNumber(value, name);
    if (value < 0) {
      throw new Error(`${name} must be a positive number`);
    }
  }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EntityModel;
}

// Make available globally for browser
if (typeof window !== 'undefined') {
  window.EntityModel = EntityModel;
}
