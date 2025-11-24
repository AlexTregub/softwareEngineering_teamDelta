/**
 * UICoordinateConverter
 * @module ui_new/components/UICoordinateConverter
 * 
 * Converts between normalized UI coordinates and screen pixel coordinates.
 * 
 * Normalized coordinate system:
 * - (0, 0) = center of screen
 * - (-1, -1) = bottom-left corner
 * - (1, 1) = top-right corner
 * - Y-axis: -1 at bottom, 1 at top (inverted from screen coords)
 * 
 * This makes UI elements resolution-independent.
 */

class UICoordinateConverter {
  /**
   * Create coordinate converter
   * @param {Object} p5Instance - p5.js instance with width/height
   */
  constructor(p5Instance) {
    this.p5 = p5Instance;
  }

  /**
   * Convert normalized UI coordinates to screen pixel coordinates
   * @param {number} nx - Normalized X (-1 to 1, 0 = center)
   * @param {number} ny - Normalized Y (-1 to 1, 0 = center, -1 = bottom, 1 = top)
   * @returns {Object} {x, y} in screen pixels
   */
  normalizedToScreen(nx, ny) {
    const halfWidth = this.p5.width / 2;
    const halfHeight = this.p5.height / 2;
    
    // Convert: normalized [-1, 1] to screen [0, width/height]
    // X: -1 = 0, 0 = width/2, 1 = width
    // Y: 1 = 0 (top), 0 = height/2, -1 = height (bottom) - inverted!
    return {
      x: halfWidth + (nx * halfWidth),
      y: halfHeight - (ny * halfHeight) // Note: subtract because Y-axis is inverted
    };
  }

  /**
   * Convert screen pixel coordinates to normalized UI coordinates
   * @param {number} sx - Screen X in pixels
   * @param {number} sy - Screen Y in pixels
   * @returns {Object} {x, y} in normalized coords [-1, 1]
   */
  screenToNormalized(sx, sy) {
    const halfWidth = this.p5.width / 2;
    const halfHeight = this.p5.height / 2;
    
    // Convert: screen [0, width/height] to normalized [-1, 1]
    // X: 0 = -1, width/2 = 0, width = 1
    // Y: 0 = 1 (top), height/2 = 0, height = -1 (bottom) - inverted!
    return {
      x: (sx - halfWidth) / halfWidth,
      y: (halfHeight - sy) / halfHeight // Note: subtract because Y-axis is inverted
    };
  }

  /**
   * Get current screen dimensions
   * @returns {Object} {width, height} in pixels
   */
  getScreenDimensions() {
    return {
      width: this.p5.width,
      height: this.p5.height
    };
  }
}

// Export for Node.js (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UICoordinateConverter;
}

// Make available globally for browser
if (typeof window !== 'undefined') {
  window.UICoordinateConverter = UICoordinateConverter;
}
