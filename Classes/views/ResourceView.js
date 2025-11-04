/**
 * ResourceView
 * ------------
 * View class for rendering game resources.
 * 
 * Extends BaseView to provide:
 * - Sprite rendering with resource images
 * - Resource type visualization (color-coded placeholders)
 * - Depletion visualization (opacity based on remaining amount)
 * - Model change reactions (position, size, amount)
 * 
 * Responsibilities:
 * - Render resource sprite or placeholder
 * - Update visuals when model changes
 * - Apply visual effects (opacity, tint) based on state
 * - NO business logic
 * - NO input handling
 * 
 * Usage:
 * ```javascript
 * const model = new ResourceModel(100, 100, 32, 32, { type: 'Food' });
 * const view = new ResourceView(model, { imagePath: 'Images/Resources/food.png' });
 * view.render(); // Renders the resource
 * ```
 */

// Load BaseView (browser uses window.BaseView directly, Node.js requires it)
// const BaseView = (typeof require !== 'undefined') ? require('./BaseView') : window.BaseView;

class ResourceView extends BaseView {
  /**
   * Construct a resource view.
   * @param {ResourceModel} model - The resource model to render
   * @param {Object} [options={}] - View configuration options
   * @param {string} [options.imagePath] - Path to resource image
   */
  constructor(model, options = {}) {
    super(model, options);
    
    // Sprite component (if image path provided)
    this._sprite = null;
    if (typeof Sprite2D !== 'undefined' && options.imagePath) {
      const pos = model.position;
      const size = model.size;
      const createVector = (typeof window !== 'undefined') ? window.createVector : global.createVector;
      
      this._sprite = new Sprite2D(
        options.imagePath,
        createVector(pos.x, pos.y),
        createVector(size.width, size.height),
        0
      );
    }
    
    // Resource type colors (for placeholder rendering)
    this._resourceColors = {
      'Food': [255, 200, 0],   // Orange/yellow
      'Wood': [139, 90, 43],    // Brown
      'Stone': [128, 128, 128]  // Gray
    };
  }
  
  // --- Model Change Handling ---
  
  /**
   * Handle model property changes.
   * @param {string} property - Property that changed
   * @param {*} data - Change data
   * @param {ResourceModel} model - The model that changed
   * @protected
   */
  _onModelChange(property, data, model) {
    switch (property) {
      case 'position':
        // Update sprite position
        if (this._sprite) {
          const createVector = (typeof window !== 'undefined') ? window.createVector : global.createVector;
          this._sprite.setPosition(createVector(data.x, data.y));
        }
        break;
        
      case 'size':
        // Update sprite size
        if (this._sprite) {
          const createVector = (typeof window !== 'undefined') ? window.createVector : global.createVector;
          this._sprite.setSize(createVector(data.width, data.height));
        }
        break;
        
      case 'amount':
        // Amount changed - opacity will update on next render
        break;
        
      case 'depleted':
        // Resource depleted - will stop rendering (model isActive = false)
        break;
    }
  }
  
  // --- Rendering ---
  
  /**
   * Render resource content.
   * @protected
   */
  _renderContent() {
    const pos = this._model.position;
    const size = this._model.size;
    
    // Get access to p5.js functions (try window first, then global for tests)
    const env = (typeof window !== 'undefined' && window.push) ? window : global;
    const push = env.push;
    const pop = env.pop;
    
    if (push && typeof push === 'function') push();
    
    // Apply opacity based on amount remaining
    const opacity = this._getOpacity();
    
    if (this._sprite) {
      // Render sprite with opacity
      this._renderSprite(pos, size, opacity);
    } else {
      // Render placeholder
      this._renderPlaceholder(pos, size, opacity);
    }
    
    if (pop && typeof pop === 'function') pop();
  }
  
  /**
   * Render sprite with opacity.
   * @param {{x: number, y: number}} pos - Position
   * @param {{width: number, height: number}} size - Size
   * @param {number} opacity - Opacity (0-1)
   * @private
   */
  _renderSprite(pos, size, opacity) {
    const env = (typeof window !== 'undefined' && window.tint) ? window : global;
    const tint = env.tint;
    const noTint = env.noTint;
    
    if (tint && typeof tint === 'function' && opacity < 1.0) {
      tint(255, opacity * 255);
    }
    
    if (this._sprite && typeof this._sprite.render === 'function') {
      this._sprite.render();
    }
    
    if (noTint && typeof noTint === 'function') {
      noTint();
    }
  }
  
  /**
   * Render placeholder shape.
   * @param {{x: number, y: number}} pos - Position
   * @param {{width: number, height: number}} size - Size
   * @param {number} opacity - Opacity (0-1)
   * @private
   */
  _renderPlaceholder(pos, size, opacity) {
    const env = (typeof window !== 'undefined' && window.fill) ? window : global;
    const fill = env.fill;
    const noStroke = env.noStroke;
    const ellipse = env.ellipse;
    
    if (fill && typeof fill === 'function') {
      const color = this._getResourceColor();
      fill(color[0], color[1], color[2], opacity * 255);
    }
    
    if (noStroke && typeof noStroke === 'function') {
      noStroke();
    }
    
    if (ellipse && typeof ellipse === 'function') {
      ellipse(pos.x, pos.y, size.width, size.height);
    }
  }
  
  // --- Visual Helpers ---
  
  /**
   * Get resource color based on type.
   * @returns {number[]} RGB color array [r, g, b]
   * @private
   */
  _getResourceColor() {
    const type = this._model.type;
    return this._resourceColors[type] || [255, 255, 255];
  }
  
  /**
   * Get opacity based on remaining amount.
   * @returns {number} Opacity (0-1)
   * @private
   */
  _getOpacity() {
    const amount = this._model.amount;
    const initialAmount = this._model.initialAmount;
    
    if (initialAmount === 0) return 1.0;
    
    // Opacity scales with remaining amount (min 0.1 for visibility)
    const ratio = amount / initialAmount;
    return Math.max(0.1, ratio);
  }
  
  // --- Cleanup ---
  
  /**
   * Destroy view and clean up resources.
   */
  destroy() {
    // Destroy sprite
    if (this._sprite) {
      this._sprite = null;
    }
    
    // Call parent destroy
    super.destroy();
  }
}

// Export for Node.js testing and browser usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResourceView;
}

if (typeof window !== 'undefined') {
  window.ResourceView = ResourceView;
}
