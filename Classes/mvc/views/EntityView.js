/**
 * EntityView
 * ==========
 * Presentation layer for game entities.
 * 
 * RESPONSIBILITIES:
 * - Render sprites and visual effects
 * - Handle highlight/selection visuals
 * - Convert coordinates for display
 * - Apply visual properties (opacity, tint, etc.)
 */

class EntityView {
  /**
   * Create an entity view
   * @param {EntityModel} model - The data model to visualize
   */
  constructor(model) {
    this.model = model;
    this.debugRenderer = null;
  }

  // ===== MAIN RENDERING =====
  /**
   * Render the entity
   * Main entry point for drawing the entity to the canvas
   */
  render() {
    // Don't render if inactive or invisible
    if (!this.model.isActive || !this.model.visible) {
      return;
    }

    // Apply visual properties
    this.applyOpacity();

    // Render sprite if available, otherwise fallback to rect
    if (this.model.sprite) {
      // Sync sprite position with model
      this._syncSpritePosition();
      
      push();
      noSmooth();
      this.model.sprite.render();
      smooth();
      pop();
    } else {
      // Fallback rendering without sprite
      this._renderFallback();
    }
  }

  /**
   * Sync sprite position/size with model (INTERNAL)
   * @private
   */
  _syncSpritePosition() {
    if (!this.model.sprite) return;
    if (!this.model.sprite.pos || !this.model.sprite.size) return; // Guard against incomplete sprite
    
    const pos = this.model.getPosition();
    const size = this.model.getSize();
    
    this.model.sprite.pos.x = pos.x;
    this.model.sprite.pos.y = pos.y;
    this.model.sprite.size.x = size.x;
    this.model.sprite.size.y = size.y;
  }

  /**
   * Render fallback rectangle when no sprite
   * @private
   */
  _renderFallback() {
    const pos = this.model.getPosition();
    const size = this.model.getSize();
    
    push();
    fill(150);
    stroke(0);
    strokeWeight(1);
    rect(pos.x - size.x/2, pos.y - size.y/2, size.x, size.y);
    pop();
  }

  /**
   * Render debug visualization
   */
  renderDebug() {
    if (this.debugRenderer?.isActive) {
      this.debugRenderer.render();
    }
  }

  // ===== HIGHLIGHT EFFECTS =====
  /**
   * Highlight entity as selected
   */
  highlightSelected() {
    if (!this.model.isActive || !this.model.visible) return;

    const pos = this.model.getPosition();
    const size = this.model.getSize();

    push();
    noFill();
    stroke(0, 255, 0); // Green outline
    strokeWeight(2);
    ellipse(pos.x, pos.y, size.x + 10, size.y + 10);
    pop();
  }

  /**
   * Highlight entity on hover
   */
  highlightHover() {
    if (!this.model.isActive || !this.model.visible) return;

    const pos = this.model.getPosition();
    const size = this.model.getSize();

    push();
    fill(255, 255, 0, 50); // Yellow tint
    noStroke();
    ellipse(pos.x, pos.y, size.x + 5, size.y + 5);
    pop();
  }

  /**
   * Highlight entity in combat
   */
  highlightCombat() {
    if (!this.model.isActive || !this.model.visible) return;

    const pos = this.model.getPosition();
    const size = this.model.getSize();

    push();
    noFill();
    stroke(255, 0, 0); // Red outline
    strokeWeight(3);
    ellipse(pos.x, pos.y, size.x + 15, size.y + 15);
    pop();
  }

  /**
   * Highlight box hover (rectangular highlight)
   */
  highlightBoxHover() {
    if (!this.model.isActive || !this.model.visible) return;

    const pos = this.model.getPosition();
    const size = this.model.getSize();

    push();
    fill(255, 255, 0, 50);
    stroke(255, 255, 0);
    strokeWeight(2);
    rect(pos.x - size.x/2, pos.y - size.y/2, size.x, size.y);
    pop();
  }

  /**
   * Highlight with spinning effect (normal speed)
   */
  highlightSpinning() {
    if (!this.model.isActive || !this.model.visible) return;

    const pos = this.model.getPosition();
    const size = this.model.getSize();
    const time = (typeof millis !== 'undefined') ? millis() : Date.now();
    const angle = (time * 0.002) % (Math.PI * 2);

    push();
    translate(pos.x, pos.y);
    rotate(angle);
    noFill();
    stroke(0, 255, 255); // Cyan
    strokeWeight(2);
    ellipse(0, 0, size.x + 10, size.y + 10);
    pop();
  }

  /**
   * Highlight with slow spinning effect
   */
  highlightSlowSpin() {
    if (!this.model.isActive || !this.model.visible) return;

    const pos = this.model.getPosition();
    const size = this.model.getSize();
    const time = (typeof millis !== 'undefined') ? millis() : Date.now();
    const angle = (time * 0.001) % (Math.PI * 2);

    push();
    translate(pos.x, pos.y);
    rotate(angle);
    noFill();
    stroke(0, 255, 255); // Cyan
    strokeWeight(2);
    ellipse(0, 0, size.x + 10, size.y + 10);
    pop();
  }

  /**
   * Highlight with fast spinning effect
   */
  highlightFastSpin() {
    if (!this.model.isActive || !this.model.visible) return;

    const pos = this.model.getPosition();
    const size = this.model.getSize();
    const time = (typeof millis !== 'undefined') ? millis() : Date.now();
    const angle = (time * 0.005) % (Math.PI * 2);

    push();
    translate(pos.x, pos.y);
    rotate(angle);
    noFill();
    stroke(255, 0, 255); // Magenta
    strokeWeight(3);
    ellipse(0, 0, size.x + 15, size.y + 15);
    pop();
  }

  /**
   * Highlight resource on hover (pulsing circle)
   */
  highlightResourceHover() {
    if (!this.model.isActive || !this.model.visible) return;

    const pos = this.model.getPosition();
    const size = this.model.getSize();
    const time = (typeof millis !== 'undefined') ? millis() : Date.now();
    const pulse = Math.sin(time * 0.005) * 5 + 10;

    push();
    noFill();
    stroke(255, 215, 0); // Gold
    strokeWeight(2);
    ellipse(pos.x, pos.y, size.x + pulse, size.y + pulse);
    pop();
  }

  // ===== COORDINATE CONVERSION =====
  /**
   * Get screen position for rendering
   * Converts world coordinates to screen coordinates
   * @returns {{x: number, y: number}} Screen coordinates
   */
  getScreenPosition() {
    const worldPos = this.model.getPosition();

    // Use CoordinateConverter if available
    if (typeof CoordinateConverter !== 'undefined' && CoordinateConverter !== null) {
      const result = CoordinateConverter.worldToScreen(worldPos.x, worldPos.y);
      // Ensure we return an object with x and y properties
      if (result && typeof result === 'object') {
        return { x: result.x, y: result.y };
      }
    }

    // Fallback to world coordinates
    return { x: worldPos.x, y: worldPos.y };
  }

  // ===== VISUAL PROPERTIES =====
  /**
   * Apply opacity to sprite
   * Sets sprite alpha based on model opacity
   */
  applyOpacity() {
    if (this.model.sprite && this.model.opacity !== undefined) {
      this.model.sprite.alpha = this.model.opacity;
    }
  }

  /**
   * Apply tint to sprite
   * @param {number} r - Red value (0-255)
   * @param {number} g - Green value (0-255)
   * @param {number} b - Blue value (0-255)
   * @param {number} a - Alpha value (0-255)
   */
  applyTint(r, g, b, a = 255) {
    if (typeof tint !== 'undefined') {
      tint(r, g, b, a);
    }
  }

  /**
   * Remove tint from sprite
   */
  clearTint() {
    if (typeof noTint !== 'undefined') {
      noTint();
    }
  }

  // ===== COLLISION BOX RENDERING (DEBUG) =====
  /**
   * Render collision box (for debugging)
   * @param {string} color - CSS color string
   */
  renderCollisionBox(color = 'rgba(255, 0, 0, 0.3)') {
    if (!this.model.collisionBox) return;

    const box = this.model.collisionBox;
    const pos = box.getCenter ? box.getCenter() : this.model.getPosition();
    const size = { x: box.width, y: box.height };

    push();
    fill(color);
    stroke(255, 0, 0);
    strokeWeight(1);
    rect(pos.x - size.x/2, pos.y - size.y/2, size.x, size.y);
    pop();
  }

  // ===== UTILITY =====
  /**
   * Check if entity should be rendered
   * @returns {boolean} True if should render
   */
  shouldRender() {
    return this.model.isActive && this.model.visible;
  }
}

// ===== EXPORTS =====
if (typeof window !== 'undefined') {
  window.EntityView = EntityView;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EntityView;
}
