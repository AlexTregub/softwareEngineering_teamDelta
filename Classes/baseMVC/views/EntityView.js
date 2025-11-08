/**
 * EntityView - Pure rendering for entities
 * 
 * Responsibilities:
 * - Read data from EntityModel
 * - Render entity visuals using p5.js
 * - Handle coordinate conversion (world ↔ screen)
 * - Render highlights (selection, hover, box)
 * - Manage sprite synchronization
 * - NO business logic, NO state management
 */
class EntityView {
  /**
   * Create an EntityView
   * @param {EntityModel} model - Entity model to render
   * @param {Object} options - Configuration options
   */
  constructor(model, options = {}) {
    if (!model) {
      throw new Error('EntityView requires a model');
    }

    this.model = model;
    this.camera = options.camera || null;
    this.sprite = null;
  }

  // --- Coordinate Conversion ---

  /**
   * Convert world coordinates to screen coordinates
   * @param {number} worldX - World X coordinate
   * @param {number} worldY - World Y coordinate
   * @returns {Object} Screen coordinates {x, y}
   */
  worldToScreen(worldX, worldY) {
    if (this.camera && typeof this.camera.worldToScreen === 'function') {
      return this.camera.worldToScreen(worldX, worldY);
    }
    
    // Fallback: no conversion
    return { x: worldX, y: worldY };
  }

  /**
   * Convert screen coordinates to world coordinates
   * @param {number} screenX - Screen X coordinate
   * @param {number} screenY - Screen Y coordinate
   * @returns {Object} World coordinates {x, y}
   */
  screenToWorld(screenX, screenY) {
    if (this.camera && typeof this.camera.screenToWorld === 'function') {
      return this.camera.screenToWorld(screenX, screenY);
    }
    
    // Fallback: no conversion
    return { x: screenX, y: screenY };
  }

  /**
   * Get current zoom level
   * @returns {number} Zoom level (1.0 = no zoom)
   */
  getZoom() {
    if (this.camera && typeof this.camera.getZoom === 'function') {
      return this.camera.getZoom();
    }
    
    return 1.0;
  }

  // --- Sprite Management ---

  /**
   * Set sprite for rendering
   * @param {Object} sprite - Sprite object
   */
  setSprite(sprite) {
    this.sprite = sprite;
  }

  /**
   * Get current sprite
   * @returns {Object|null} Sprite object or null
   */
  getSprite() {
    return this.sprite;
  }

  /**
   * Sync sprite with model data
   */
  syncSprite() {
    if (!this.sprite || typeof this.sprite.update !== 'function') {
      return;
    }

    const pos = this.model.getPosition();
    const rotation = this.model.getRotation();

    this.sprite.update({
      x: pos.x,
      y: pos.y,
      rotation: rotation
    });
  }

  // --- p5.js Availability ---

  /**
   * Check if p5.js is available
   * @returns {boolean} True if p5.js is available
   */
  isP5Available() {
    return typeof push === 'function';
  }

  // --- Highlight Rendering ---

  /**
   * Render selection/hover highlights
   */
  renderHighlight() {
    if (!this.isP5Available()) return;

    const isSelected = this.model.isSelected();
    const isHovered = this.model.isHovered();
    const isBoxHovered = this.model.isBoxHovered();

    if (!isSelected && !isHovered && !isBoxHovered) {
      return;
    }

    push();
    noFill();

    // Priority: selection > hover > box hover
    if (isSelected) {
      stroke(0, 255, 0); // Green
    } else if (isHovered) {
      stroke(255, 255, 0); // Yellow
    } else if (isBoxHovered) {
      stroke(0, 255, 255); // Cyan
    }

    const pos = this.model.getPosition();
    const size = this.model.getSize();

    rect(pos.x, pos.y, size.x, size.y);

    pop();
  }

  // --- Main Rendering ---

  /**
   * Render entity
   */
  render() {
    if (!this.isP5Available()) return;
    if (!this.model.isActive()) return;

    push();

    const pos = this.model.getPosition();
    const size = this.model.getSize();
    const rotation = this.model.getRotation();
    const opacity = this.model.getOpacity();

    // Apply opacity
    if (opacity < 1.0) {
      tint(255, opacity * 255);
    }

    // Apply transform
    translate(pos.x + size.x / 2, pos.y + size.y / 2);
    
    if (rotation !== 0) {
      rotate((rotation * Math.PI) / 180); // Convert to radians
    }

    // Render sprite or fallback
    if (this.sprite && this.sprite.img) {
      imageMode(CENTER);
      image(this.sprite.img, 0, 0);
    } else {
      // Fallback: colored rect
      fill(200, 200, 200);
      rect(-size.x / 2, -size.y / 2, size.x, size.y);
    }

    if (opacity < 1.0) {
      noTint();
    }

    pop();
  }

  // --- Render Layers ---

  /**
   * Render entity layer (main visual)
   */
  renderEntityLayer() {
    this.render();
  }

  /**
   * Render highlight layer (selection, hover)
   */
  renderHighlightLayer() {
    this.renderHighlight();
  }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EntityView;
}

// Make available globally for browser
if (typeof window !== 'undefined') {
  window.EntityView = EntityView;
}
