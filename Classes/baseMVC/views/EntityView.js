/**
 * EntityView - Pure rendering for entities
 * 
 * Responsibilities:
 * - Read ALL data from EntityModel (NO state of its own)
 * - Render entity visuals using p5.js
 * - Handle coordinate conversion (world ↔ screen) via camera
 * - Render highlights (selection, hover, box)
 * - NO business logic, NO state management, NO sprite storage
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
    // REMOVED: this.sprite = null; - All visual data now in Model
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

  // --- Highlight Rendering ---

  /**
   * Render selection/hover highlights
   */
  renderHighlight() {
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

    // IMPORTANT: Use getScreenPosition() to respect grid positioning
    const screenPos = this.model.getScreenPosition ? this.model.getScreenPosition() : this.model.getPosition();
    const size = this.model.getSize();

    rect(screenPos.x, screenPos.y, size.x, size.y);

    pop();
  }

  // --- Main Rendering ---

  /**
   * Render entity (reads ALL data from Model)
   * Subclasses (like AntView) should set this.sprite before calling super.render()
   */
  render() {
    if (!this.model.isActive()) {
      return;
    }

    push();

    // Read ALL visual data from Model
    // IMPORTANT: Use getScreenPosition() instead of getPosition() to respect grid positioning
    const screenPos = this.model.getScreenPosition ? this.model.getScreenPosition() : this.model.getPosition();
    const size = this.model.getSize();
    const rotation = this.model.getRotation();
    const opacity = this.model.getOpacity();
    const flipX = this.model.getFlipX();
    const flipY = this.model.getFlipY();

    // Apply opacity
    if (opacity < 1.0) {
      tint(255, opacity * 255);
    }

    // Apply transform using screen position (already converted from grid coordinates)
    translate(screenPos.x + size.x / 2, screenPos.y + size.y / 2);
    
    // Apply flip
    if (flipX || flipY) {
      scale(flipX ? -1 : 1, flipY ? -1 : 1);
    }
    
    if (rotation !== 0) {
      rotate((rotation * Math.PI) / 180); // Convert to radians
    }

    // Render sprite if available (set by subclasses like AntView)
    if (this.sprite && this.sprite.img) {
      noSmooth();
      imageMode(CENTER);
      image(this.sprite.img, 0, 0, size.x, size.y);
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
