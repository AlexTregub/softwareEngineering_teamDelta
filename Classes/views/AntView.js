/**
 * AntView - Rendering for Ant Entities
 * 
 * Handles all visual presentation for ants including:
 * - Sprite rendering (job-specific images)
 * - Health bar visualization
 * - Selection highlights
 * - Resource indicators
 * - Visual effects (damage flash, etc.)
 * 
 * Extends BaseView and reacts to AntModel changes via observable pattern.
 * 
 * @class AntView
 * @extends BaseView
 */

// Load dependencies (Node.js require, or use global in browser)
const BaseView = (typeof require !== 'undefined') ? require('./BaseView') : window.BaseView;
// Use mock Sprite2d in tests if available, otherwise load real class
const Sprite2d = (typeof global !== 'undefined' && global.Sprite2d) ? global.Sprite2d :
                 (typeof require !== 'undefined') ? require('../rendering/Sprite2d') : window.Sprite2d;

class AntView extends BaseView {
  /**
   * Creates an AntView
   * @param {AntModel} model - The ant model to render
   * @param {Object} options - Configuration options
   * @param {string} options.imagePath - Path to ant sprite image
   * @param {boolean} [options.healthBarVisible=true] - Show health bar
   * @param {boolean} [options.resourceIndicatorVisible=true] - Show resource indicator
   */
  constructor(model, options = {}) {
    super(model, options);
    
    // Sprite rendering
    this._sprite = new Sprite2d(
      options.imagePath,
      model.position,
      model.size
    );
    
    // Visual state
    this._healthBarVisible = options.healthBarVisible !== undefined ? options.healthBarVisible : true;
    this._selectionHighlight = false;
    this._resourceIndicatorVisible = options.resourceIndicatorVisible !== undefined ? options.resourceIndicatorVisible : true;
    this._damageFlashTimer = 0;
    
    // Health bar configuration
    this._healthBarWidth = 40;
    this._healthBarHeight = 6;
    this._healthBarOffset = -20; // Above sprite
    
    // Current image path (for job changes)
    this._currentImagePath = options.imagePath;
  }
  
  /**
   * React to model property changes
   * @param {string} property - Changed property name
   * @param {*} data - New property value
   * @protected
   */
  _onModelChange(property, data) {
    switch (property) {
      case 'position':
        this._sprite.setPosition(data);
        break;
        
      case 'rotation':
        this._sprite.setRotation(data);
        break;
        
      case 'job':
        // Update sprite image when job changes
        if (data && data.image) {
          this._currentImagePath = data.image;
          // Preserve rotation when creating new sprite
          const currentRotation = this._sprite ? this._sprite.rotation : 0;
          this._sprite = new Sprite2d(
            data.image,
            this._model.position,
            this._model.size,
            currentRotation
          );
        }
        break;
        
      case 'health':
        // Trigger damage flash if health decreased
        if (data < this._model.maxHealth) {
          this._damageFlashTimer = 0.3; // 300ms flash
        }
        break;
        
      case 'resourceAdded':
      case 'resourceRemoved':
      case 'resourcesDropped':
        // Resource changes will be reflected in next render
        break;
    }
  }
  
  /**
   * Main render method - renders all visual elements
   * @protected
   */
  _renderContent() {
    // Update visual effects
    if (this._damageFlashTimer > 0) {
      this._updateDamageFlash(1/60); // Assume 60fps
    }
    
    // Render selection highlight (behind sprite)
    if (this._selectionHighlight) {
      this._renderSelectionHighlight();
    }
    
    // Render sprite with damage flash effect
    if (this._damageFlashTimer > 0) {
      push();
      tint(255, 100, 100); // Red tint
      this._renderSprite();
      pop();
    } else {
      this._renderSprite();
    }
    
    // Render health bar (above sprite)
    if (this._healthBarVisible) {
      this._renderHealthBar();
    }
    
    // Render resource indicator (if has resources)
    if (this._resourceIndicatorVisible && this._model.getResourceCount() > 0) {
      this._renderResourceIndicator();
    }
  }
  
  /**
   * Render the ant sprite
   * @private
   */
  _renderSprite() {
    if (this._sprite) {
      this._sprite.render();
    }
  }
  
  /**
   * Render health bar above sprite
   * @private
   */
  _renderHealthBar() {
    const pos = this._model.position;
    const healthPercent = this._model.health / this._model.maxHealth;
    
    // Calculate health bar position (centered above sprite)
    const barX = pos.x - this._healthBarWidth / 2;
    const barY = pos.y + this._healthBarOffset;
    
    push();
    
    // Background (gray)
    fill(60, 60, 60);
    noStroke();
    rect(barX, barY, this._healthBarWidth, this._healthBarHeight, 2);
    
    // Foreground (health-based color)
    const healthColor = this._getHealthColor(healthPercent);
    fill(healthColor.r, healthColor.g, healthColor.b);
    const foregroundWidth = this._healthBarWidth * healthPercent;
    rect(barX, barY, foregroundWidth, this._healthBarHeight, 2);
    
    // Border
    noFill();
    stroke(0);
    strokeWeight(1);
    rect(barX, barY, this._healthBarWidth, this._healthBarHeight, 2);
    
    pop();
  }
  
  /**
   * Get health bar color based on health percentage
   * @param {number} healthPercent - Health percentage (0-1)
   * @returns {Object} RGB color object
   * @private
   */
  _getHealthColor(healthPercent) {
    if (healthPercent > 0.6) {
      // Green for healthy
      return { r: 50, g: 200, b: 50 };
    } else if (healthPercent > 0.3) {
      // Yellow for damaged
      return { r: 220, g: 220, b: 50 };
    } else {
      // Red for critical
      return { r: 220, g: 50, b: 50 };
    }
  }
  
  /**
   * Render selection highlight around sprite
   * @private
   */
  _renderSelectionHighlight() {
    const pos = this._model.position;
    const size = this._model.size;
    const radius = Math.max(size.width, size.height) * 0.7;
    
    push();
    
    // Yellow circle outline
    noFill();
    stroke(255, 220, 0);
    strokeWeight(2);
    ellipse(pos.x, pos.y, radius, radius);
    
    pop();
  }
  
  /**
   * Render resource indicator showing carried resources
   * @private
   */
  _renderResourceIndicator() {
    const pos = this._model.position;
    const resourceCount = this._model.getResourceCount();
    const maxResources = this._model.getMaxResources();
    const isFull = resourceCount >= maxResources;
    
    // Position below sprite
    const textX = pos.x;
    const textY = pos.y + 20;
    
    push();
    
    // Background circle
    if (isFull) {
      fill(220, 180, 50); // Gold for full
    } else {
      fill(100, 100, 100, 180); // Gray semi-transparent
    }
    noStroke();
    ellipse(textX, textY, 16, 16);
    
    // Resource count text
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(10);
    text(resourceCount.toString(), textX, textY);
    
    pop();
  }
  
  /**
   * Update damage flash effect timer
   * @param {number} deltaTime - Time since last frame (seconds)
   * @private
   */
  _updateDamageFlash(deltaTime) {
    if (this._damageFlashTimer > 0) {
      this._damageFlashTimer -= deltaTime;
      if (this._damageFlashTimer < 0) {
        this._damageFlashTimer = 0;
      }
    }
  }
  
  /**
   * Set health bar visibility
   * @param {boolean} visible - Show or hide health bar
   */
  setHealthBarVisible(visible) {
    this._healthBarVisible = visible;
  }
  
  /**
   * Set selection highlight state
   * @param {boolean} enabled - Enable or disable selection highlight
   */
  setSelectionHighlight(enabled) {
    this._selectionHighlight = enabled;
  }
  
  /**
   * Set resource indicator visibility
   * @param {boolean} visible - Show or hide resource indicator
   */
  setResourceIndicatorVisible(visible) {
    this._resourceIndicatorVisible = visible;
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    this._sprite = null;
    super.destroy();
  }
}

// Export for Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AntView;
}
if (typeof window !== 'undefined') {
  window.AntView = AntView;
}
