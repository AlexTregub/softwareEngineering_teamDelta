/**
 * SelectionBoxModel
 * ==================
 * Pure data model for drag selection box.
 * 
 * RESPONSIBILITIES:
 * - Store box state (start, end, active)
 * - Calculate bounds and dimensions
 * - Provide getters/setters for data access
 * - NO rendering logic
 * - NO update logic
 */

class SelectionBoxModel {
  /**
   * Create a selection box model
   */
  constructor() {
    // ===== POSITION DATA =====
    this.startX = 0;
    this.startY = 0;
    this.endX = 0;
    this.endY = 0;
    
    // ===== STATE DATA =====
    this.isActive = false; // Whether user is currently dragging
    this.isDragging = false; // Whether drag has moved enough to create box
    this.dragThreshold = 5; // Minimum pixels to start showing box
    
    // ===== VISUAL CONFIG =====
    this.config = {
      fillColor: { r: 0, g: 150, b: 255 }, // Blue
      fillAlpha: 60,
      strokeColor: { r: 0, g: 120, b: 200 }, // Darker blue
      strokeAlpha: 200,
      strokeWeight: 2,
      cornerSize: 8,
      cornerColor: { r: 0, g: 100, b: 180 }, // Even darker blue
      cornerAlpha: 255
    };
  }

  // ===== START/END POSITION =====
  /**
   * Set start position (mouse down)
   * @param {number} x - Start X (screen coordinates)
   * @param {number} y - Start Y (screen coordinates)
   */
  setStart(x, y) {
    this.startX = x;
    this.startY = y;
    this.endX = x;
    this.endY = y;
    this.isActive = true;
    this.isDragging = false;
  }

  /**
   * Update end position (mouse drag)
   * @param {number} x - End X (screen coordinates)
   * @param {number} y - End Y (screen coordinates)
   */
  setEnd(x, y) {
    this.endX = x;
    this.endY = y;
    
    // Check if drag distance exceeds threshold
    const dx = this.endX - this.startX;
    const dy = this.endY - this.startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance >= this.dragThreshold) {
      this.isDragging = true;
    }
  }

  /**
   * Clear selection box
   */
  clear() {
    this.isActive = false;
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.endX = 0;
    this.endY = 0;
  }

  // ===== BOUNDS CALCULATION =====
  /**
   * Get normalized bounds (min/max coordinates)
   * @returns {{minX: number, minY: number, maxX: number, maxY: number, width: number, height: number}}
   */
  getBounds() {
    const minX = Math.min(this.startX, this.endX);
    const maxX = Math.max(this.startX, this.endX);
    const minY = Math.min(this.startY, this.endY);
    const maxY = Math.max(this.startY, this.endY);
    
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  /**
   * Get bounds in world coordinates
   * @returns {{minX: number, minY: number, maxX: number, maxY: number, width: number, height: number}}
   */
  getWorldBounds() {
    const screenBounds = this.getBounds();
    
    // Convert screen coordinates to world coordinates
    if (typeof cameraManager !== 'undefined' && cameraManager) {
      const topLeft = cameraManager.screenToWorld(screenBounds.minX, screenBounds.minY);
      const bottomRight = cameraManager.screenToWorld(screenBounds.maxX, screenBounds.maxY);
      
      return {
        minX: topLeft.x,
        minY: topLeft.y,
        maxX: bottomRight.x,
        maxY: bottomRight.y,
        width: bottomRight.x - topLeft.x,
        height: bottomRight.y - topLeft.y
      };
    }
    
    // Fallback: assume screen = world
    return screenBounds;
  }

  // ===== STATE CHECKS =====
  /**
   * Check if box should be visible
   * @returns {boolean} True if box should render
   */
  shouldRender() {
    return this.isActive && this.isDragging;
  }

  // ===== COLOR CONFIGURATION =====
  /**
   * Update color configuration
   * @param {Object} config - New color config
   * @param {Object} config.fillColor - Fill color {r, g, b}
   * @param {number} config.fillAlpha - Fill transparency (0-255)
   * @param {Object} config.strokeColor - Stroke color {r, g, b}
   * @param {number} config.strokeAlpha - Stroke transparency (0-255)
   * @param {Object} config.cornerColor - Corner color {r, g, b}
   */
  updateColors(config) {
    if (config.fillColor) {
      this.config.fillColor = { ...this.config.fillColor, ...config.fillColor };
    }
    if (config.fillAlpha !== undefined) {
      this.config.fillAlpha = config.fillAlpha;
    }
    if (config.strokeColor) {
      this.config.strokeColor = { ...this.config.strokeColor, ...config.strokeColor };
    }
    if (config.strokeAlpha !== undefined) {
      this.config.strokeAlpha = config.strokeAlpha;
    }
    if (config.cornerColor) {
      this.config.cornerColor = { ...this.config.cornerColor, ...config.cornerColor };
    }
    if (config.cornerAlpha !== undefined) {
      this.config.cornerAlpha = config.cornerAlpha;
    }
  }

  /**
   * Get current color configuration
   * @returns {Object} Color config
   */
  getColors() {
    return { ...this.config };
  }
}

// ===== EXPORTS =====
if (typeof window !== 'undefined') {
  window.SelectionBoxModel = SelectionBoxModel;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SelectionBoxModel;
}
