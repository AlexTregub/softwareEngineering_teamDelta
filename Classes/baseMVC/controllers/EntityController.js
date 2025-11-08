/**
 * EntityController - Business logic coordination for entities
 * 
 * Responsibilities:
 * - Coordinate Model and View interactions
 * - Handle input (mouse clicks, hover)
 * - Manage selection logic
 * - Coordinate movement
 * - Update loop coordination
 * - Spatial grid integration
 * - Event propagation
 */
class EntityController {
  /**
   * Create an EntityController
   * @param {EntityModel} model - Entity model
   * @param {EntityView} view - Entity view
   * @param {Object} options - Configuration options
   */
  constructor(model, view, options = {}) {
    if (!model) {
      throw new Error('EntityController requires a model');
    }
    if (!view) {
      throw new Error('EntityController requires a view');
    }

    this.model = model;
    this.view = view;
    this.spatialGrid = options.spatialGrid || null;

    // Register with spatial grid
    if (this.spatialGrid) {
      const pos = this.model.getPosition();
      const size = this.model.getSize();
      this.spatialGrid.register(this, pos.x, pos.y, size.x, size.y);
    }
  }

  // --- Lifecycle Management ---

  /**
   * Deactivate entity
   */
  deactivate() {
    this.model.setActive(false);
    if (this.spatialGrid) {
      this.spatialGrid.unregister(this);
    }
  }

  /**
   * Activate entity
   */
  activate() {
    this.model.setActive(true);
    if (this.spatialGrid) {
      const pos = this.model.getPosition();
      const size = this.model.getSize();
      this.spatialGrid.register(this, pos.x, pos.y, size.x, size.y);
    }
  }

  /**
   * Destroy entity and clean up
   */
  destroy() {
    this.deactivate();
  }

  // --- Selection Logic ---

  /**
   * Select entity
   */
  select() {
    this.model.setSelected(true);
  }

  /**
   * Deselect entity
   */
  deselect() {
    this.model.setSelected(false);
  }

  /**
   * Toggle selection state
   */
  toggleSelection() {
    this.model.setSelected(!this.model.isSelected());
  }

  /**
   * Check if point is inside entity bounds
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {boolean} True if point is inside
   */
  containsPoint(x, y) {
    const pos = this.model.getPosition();
    const size = this.model.getSize();
    
    return x >= pos.x && x <= pos.x + size.x &&
           y >= pos.y && y <= pos.y + size.y;
  }

  /**
   * Handle mouse click
   * @param {number} x - Click X coordinate
   * @param {number} y - Click Y coordinate
   * @returns {boolean} True if entity was clicked
   */
  handleClick(x, y) {
    if (this.containsPoint(x, y)) {
      this.select();
      return true;
    }
    return false;
  }

  /**
   * Set box hover state
   * @param {boolean} boxHovered - Box hover state
   */
  setBoxHover(boxHovered) {
    this.model.setBoxHovered(boxHovered);
  }

  // --- Movement Coordination ---

  /**
   * Set target position
   * @param {number} x - Target X coordinate
   * @param {number} y - Target Y coordinate
   */
  setTargetPosition(x, y) {
    this.model.setTargetPosition(x, y);
    this.model.setMoving(true);
  }

  /**
   * Clear target position
   */
  clearTarget() {
    this.model.setTargetPosition(null, null);
    this.model.setMoving(false);
  }

  /**
   * Set path
   * @param {Array} path - Path array
   */
  setPath(path) {
    this.model.setPath(path);
  }

  /**
   * Clear path
   */
  clearPath() {
    this.model.setPath(null);
  }

  /**
   * Stop all movement
   */
  stopMovement() {
    this.model.setMoving(false);
    this.model.setTargetPosition(null, null);
    this.model.setPath(null);
  }

  // --- Update Loop ---

  /**
   * Update entity (called each frame)
   * @param {number} deltaTime - Time since last frame (ms)
   */
  update(deltaTime) {
    if (!this.model.isActive()) {
      return;
    }

    // Update spatial grid
    if (this.spatialGrid) {
      const pos = this.model.getPosition();
      const size = this.model.getSize();
      this.spatialGrid.update(this, pos.x, pos.y, size.x, size.y);
    }

    // Sync view with model
    this.view.syncSprite();
  }

  // --- Hover Logic ---

  /**
   * Set hover state
   * @param {boolean} hovered - Hover state
   */
  setHover(hovered) {
    this.model.setHovered(hovered);
  }

  /**
   * Handle mouse move
   * @param {number} x - Mouse X coordinate
   * @param {number} y - Mouse Y coordinate
   * @returns {boolean} True if entity is hovered
   */
  handleMouseMove(x, y) {
    const hovered = this.containsPoint(x, y);
    this.model.setHovered(hovered);
    return hovered;
  }

  // --- Position Management ---

  /**
   * Move entity to position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  moveTo(x, y) {
    this.model.setPosition(x, y);
    
    if (this.spatialGrid) {
      const pos = this.model.getPosition();
      const size = this.model.getSize();
      this.spatialGrid.update(this, pos.x, pos.y, size.x, size.y);
    }
  }

  /**
   * Move entity by offset
   * @param {number} dx - X offset
   * @param {number} dy - Y offset
   */
  moveBy(dx, dy) {
    const pos = this.model.getPosition();
    this.moveTo(pos.x + dx, pos.y + dy);
  }

  /**
   * Get current position
   * @returns {Object} Position {x, y}
   */
  getPosition() {
    return this.model.getPosition();
  }

  // --- Size Management ---

  /**
   * Set size
   * @param {number} width - Width
   * @param {number} height - Height
   */
  setSize(width, height) {
    this.model.setSize(width, height);
  }

  /**
   * Get size
   * @returns {Object} Size {x, y}
   */
  getSize() {
    return this.model.getSize();
  }

  /**
   * Get bounds
   * @returns {Object} Bounds {x, y, width, height}
   */
  getBounds() {
    const pos = this.model.getPosition();
    const size = this.model.getSize();
    
    return {
      x: pos.x,
      y: pos.y,
      width: size.x,
      height: size.y
    };
  }

  // --- Rotation Management ---

  /**
   * Set rotation
   * @param {number} rotation - Rotation in degrees
   */
  setRotation(rotation) {
    this.model.setRotation(rotation);
  }

  /**
   * Rotate by offset
   * @param {number} offset - Rotation offset in degrees
   */
  rotateBy(offset) {
    const current = this.model.getRotation();
    this.model.setRotation(current + offset);
  }

  /**
   * Get rotation
   * @returns {number} Rotation in degrees
   */
  getRotation() {
    return this.model.getRotation();
  }

  // --- Rendering Coordination ---

  /**
   * Render entity
   */
  render() {
    if (!this.model.isActive()) {
      return;
    }
    this.view.render();
  }

  /**
   * Render highlights
   */
  renderHighlights() {
    if (!this.model.isActive()) {
      return;
    }
    this.view.renderHighlight();
  }

  // --- Spatial Queries ---

  /**
   * Get nearby entities
   * @param {number} radius - Search radius
   * @returns {Array} Nearby entities
   */
  getNearbyEntities(radius) {
    if (!this.spatialGrid) {
      return [];
    }
    
    const pos = this.model.getPosition();
    return this.spatialGrid.getNearbyEntities(pos.x, pos.y, radius);
  }

  /**
   * Find nearest entity
   * @returns {Object|null} Nearest entity or null
   */
  findNearestEntity() {
    if (!this.spatialGrid) {
      return null;
    }
    
    const pos = this.model.getPosition();
    return this.spatialGrid.findNearestEntity(pos.x, pos.y);
  }

  // --- State Queries ---

  /**
   * Check if selected
   * @returns {boolean} Selected state
   */
  isSelected() {
    return this.model.isSelected();
  }

  /**
   * Check if hovered
   * @returns {boolean} Hovered state
   */
  isHovered() {
    return this.model.isHovered();
  }

  /**
   * Check if moving
   * @returns {boolean} Moving state
   */
  isMoving() {
    return this.model.isMoving();
  }

  /**
   * Check if active
   * @returns {boolean} Active state
   */
  isActive() {
    return this.model.isActive();
  }

  /**
   * Get entity ID
   * @returns {string} Entity ID
   */
  getId() {
    return this.model.getId();
  }

  /**
   * Get entity type
   * @returns {string} Entity type
   */
  getType() {
    return this.model.getType();
  }

  // --- Faction Management ---

  /**
   * Set faction
   * @param {string} faction - Faction name
   */
  setFaction(faction) {
    this.model.setFaction(faction);
  }

  /**
   * Get faction
   * @returns {string} Faction name
   */
  getFaction() {
    return this.model.getFaction();
  }

  /**
   * Check if same faction
   * @param {string} faction - Faction to compare
   * @returns {boolean} True if same faction
   */
  isSameFaction(faction) {
    return this.model.getFaction() === faction;
  }

  // --- Event Handling ---

  /**
   * Register event listener
   * @param {string} eventName - Event name
   * @param {Function} callback - Callback function
   */
  on(eventName, callback) {
    this.model.on(eventName, callback);
  }

  /**
   * Remove event listener
   * @param {string} eventName - Event name
   * @param {Function} callback - Callback function
   */
  off(eventName, callback) {
    this.model.off(eventName, callback);
  }

  /**
   * Emit event
   * @param {string} eventName - Event name
   * @param {Object} data - Event data
   */
  emit(eventName, data) {
    this.model.emit(eventName, data);
  }

  // --- Opacity Management ---

  /**
   * Set opacity
   * @param {number} opacity - Opacity (0-1)
   */
  setOpacity(opacity) {
    this.model.setOpacity(opacity);
  }

  /**
   * Get opacity
   * @returns {number} Opacity (0-1)
   */
  getOpacity() {
    return this.model.getOpacity();
  }

  /**
   * Fade out by amount
   * @param {number} amount - Amount to fade (0-1)
   */
  fadeOut(amount) {
    const current = this.model.getOpacity();
    this.model.setOpacity(Math.max(0, current - amount));
  }

  /**
   * Fade in by amount
   * @param {number} amount - Amount to fade (0-1)
   */
  fadeIn(amount) {
    const current = this.model.getOpacity();
    this.model.setOpacity(Math.min(1, current + amount));
  }

  // --- Debug Information ---

  /**
   * Get debug information
   * @returns {Object} Debug info
   */
  getDebugInfo() {
    const pos = this.model.getPosition();
    const size = this.model.getSize();
    
    return {
      id: this.model.getId(),
      type: this.model.getType(),
      position: pos,
      size: size,
      rotation: this.model.getRotation(),
      faction: this.model.getFaction(),
      isActive: this.model.isActive(),
      isSelected: this.model.isSelected(),
      isHovered: this.model.isHovered(),
      isMoving: this.model.isMoving(),
      opacity: this.model.getOpacity()
    };
  }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EntityController;
}

// Make available globally for browser
if (typeof window !== 'undefined') {
  window.EntityController = EntityController;
}
