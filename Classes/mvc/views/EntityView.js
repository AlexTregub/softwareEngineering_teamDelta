/**
 * EntityView - Pure rendering component for entity models
 * Implements View in MVC pattern
 * 
 * Design Principles:
 * - **Stateless** - No internal state, pure rendering function
 * - **Read-only** - Never modifies models
 * - **Pure functions** - Same model + context = same output
 * - **Isolated rendering** - Uses push/pop for graphics state
 * 
 * Usage:
 * ```javascript
 * const view = new EntityView();
 * const model = new EntityModel({ position: { x: 100, y: 200 }, size: { width: 32, height: 32 } });
 * 
 * // Render to p5.js graphics context
 * view.render(model, graphics);
 * 
 * // Render with custom styling
 * view.render(model, graphics, { fillColor: [255, 0, 0], strokeColor: [0, 0, 0] });
 * ```
 */

class EntityView {
  /**
   * Render entity model to graphics context
   * @param {EntityModel} model - Model to render (read-only)
   * @param {Object} graphics - p5.js graphics context (or compatible)
   * @param {Object} [options] - Rendering options
   * @param {Array<number>|null} [options.fillColor=[200, 200, 200]] - Fill color [r, g, b] or null for no fill
   * @param {Array<number>|null} [options.strokeColor=[0, 0, 0]] - Stroke color [r, g, b] or null for no stroke
   * @param {number} [options.strokeWeight=1] - Stroke weight in pixels
   */
  render(model, graphics, options = {}) {
    // Validation
    if (!model) {
      throw new Error('EntityView.render: model is required');
    }
    if (!graphics) {
      throw new Error('EntityView.render: graphics context is required');
    }
    
    // Skip rendering if model is disabled
    if (!model.enabled) {
      return;
    }
    
    // Default options
    const fillColor = options.fillColor !== undefined ? options.fillColor : [200, 200, 200];
    const strokeColor = options.strokeColor !== undefined ? options.strokeColor : [0, 0, 0];
    const strokeWeight = options.strokeWeight !== undefined ? options.strokeWeight : 1;
    
    // Isolate graphics state (no side effects on caller's context)
    graphics.push();
    
    try {
      // Get model data (read-only access via getters)
      const position = model.getPosition();
      const size = model.getSize();
      
      // Apply styling
      if (fillColor === null) {
        graphics.noFill();
      } else {
        graphics.fill(fillColor[0], fillColor[1], fillColor[2]);
      }
      
      if (strokeColor === null) {
        graphics.noStroke();
      } else {
        graphics.stroke(strokeColor[0], strokeColor[1], strokeColor[2]);
        graphics.strokeWeight(strokeWeight);
      }
      
      // Draw entity as rectangle
      graphics.rect(position.x, position.y, size.width, size.height);
      
    } finally {
      // Always restore graphics state
      graphics.pop();
    }
  }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EntityView;
}

// Export for browser
if (typeof window !== 'undefined') {
  window.EntityView = EntityView;
}
