/**
 * ResourceView - Specialized rendering for resource models
 * Extends EntityView with resource-specific visuals
 * 
 * Features:
 * - **Resource type sprites** - Different sprite for each resource type
 * - **Amount display** - Shows quantity (hidden for single resources)
 * - **Carried state** - Transparency when carried by an ant
 * - **Fallback rendering** - Colored circles when sprites unavailable
 * 
 * Usage:
 * ```javascript
 * const view = new ResourceView();
 * const resourceModel = new ResourceModel({ x: 100, y: 200, resourceType: 'greenLeaf', amount: 5 });
 * 
 * view.render(resourceModel, graphics);
 * ```
 */

// Conditional import for Node.js environment
if (typeof module !== 'undefined' && typeof EntityView === 'undefined') {
  var EntityView = require('./EntityView');
}

class ResourceView extends EntityView {
  /**
   * Sprite name mapping for resource types
   * @private
   */
  _getSpriteName(resourceType) {
    const spriteMap = {
      'greenLeaf': 'resource_greenleaf',
      'stick': 'resource_stick',
      'stone': 'resource_stone',
      'sand': 'resource_sand',
      'dirt': 'resource_dirt'
    };
    
    return spriteMap[resourceType] || 'resource_greenleaf'; // Default to greenLeaf
  }
  
  /**
   * Fallback color for resource types (when sprites unavailable)
   * @private
   */
  _getResourceColor(resourceType) {
    const colorMap = {
      'greenLeaf': [100, 200, 100],  // Green
      'stick': [139, 90, 43],        // Brown
      'stone': [128, 128, 128],      // Gray
      'sand': [238, 214, 175],       // Tan
      'dirt': [101, 67, 33]          // Dark brown
    };
    
    return colorMap[resourceType] || [150, 150, 150]; // Default gray
  }
  
  /**
   * Render resource model to graphics context
   * @param {ResourceModel} model - Resource model to render
   * @param {Object} graphics - p5.js graphics context
   * @param {Object} [options] - Rendering options
   */
  render(model, graphics, options = {}) {
    // Validation
    if (!model) {
      throw new Error('ResourceView.render: model is required');
    }
    if (!graphics) {
      throw new Error('ResourceView.render: graphics context is required');
    }
    
    // Skip rendering if model is disabled
    if (!model.enabled) {
      return;
    }
    
    // Isolate graphics state
    graphics.push();
    
    try {
      const position = model.getPosition();
      const size = model.getSize();
      
      // 1. Render resource sprite or fallback
      this._renderResourceSprite(model, graphics);
      
      // 2. Render amount text (if > 1)
      if (model.amount > 1) {
        this._renderAmountText(model, graphics);
      }
      
    } finally {
      graphics.pop();
    }
  }
  
  /**
   * Render resource sprite with type-specific sprite and carried state
   * @private
   */
  _renderResourceSprite(model, graphics) {
    const position = model.getPosition();
    const size = model.getSize();
    const spriteName = this._getSpriteName(model.resourceType);
    
    // Check if sprite manager is available (browser environment)
    if (typeof window !== 'undefined' && window.spriteManager) {
      const sprite = window.spriteManager.getSprite(spriteName);
      
      if (sprite && sprite.image) {
        // Apply carried state transparency
        this._applyCarriedState(model.carriedBy, graphics);
        
        // Draw sprite centered at position
        graphics.imageMode(window.CENTER || 'center');
        graphics.image(sprite.image, position.x, position.y, size.width, size.height);
        
        // Reset tint
        graphics.noTint();
      } else {
        // Sprite not loaded yet, use fallback
        this._renderFallbackCircle(model, graphics);
      }
    } else {
      // No sprite manager (testing environment), use fallback
      this._renderFallbackCircle(model, graphics);
    }
  }
  
  /**
   * Apply transparency if resource is carried
   * @private
   */
  _applyCarriedState(carriedBy, graphics) {
    if (carriedBy) {
      // Resource is carried - apply 50% transparency
      graphics.tint(255, 255, 255, 128);
    } else {
      // Resource is not carried - full opacity
      graphics.noTint();
    }
  }
  
  /**
   * Render fallback colored circle (when sprites unavailable)
   * @private
   */
  _renderFallbackCircle(model, graphics) {
    const position = model.getPosition();
    const size = model.getSize();
    const color = this._getResourceColor(model.resourceType);
    
    // Apply carried state transparency to fill color
    if (model.carriedBy) {
      graphics.fill(color[0], color[1], color[2], 128); // 50% alpha
    } else {
      graphics.fill(color[0], color[1], color[2]);
    }
    
    graphics.stroke(0, 0, 0);
    graphics.strokeWeight(1);
    graphics.ellipse(
      position.x + size.width / 2,
      position.y + size.height / 2,
      size.width,
      size.height
    );
  }
  
  /**
   * Render amount text overlay
   * @private
   */
  _renderAmountText(model, graphics) {
    const position = model.getPosition();
    const size = model.getSize();
    
    // Format amount (cap at 99+)
    const amountText = model.amount > 99 ? '99+' : model.amount.toString();
    
    // Text styling
    graphics.fill(255, 255, 255); // White text
    graphics.stroke(0, 0, 0);
    graphics.strokeWeight(2);
    graphics.textSize(10);
    graphics.textAlign(window.RIGHT || 'right', window.CENTER || 'center');
    
    // Position in bottom-right corner
    const textX = position.x + size.width - 2;
    const textY = position.y + size.height - 2;
    
    graphics.text(amountText, textX, textY);
  }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResourceView;
}

// Export for browser
if (typeof window !== 'undefined') {
  window.ResourceView = ResourceView;
}
