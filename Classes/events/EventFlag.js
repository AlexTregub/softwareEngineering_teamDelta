/**
 * EventFlag - Visual flag entity for Level Editor
 * Represents trigger zones for random events
 * 
 * Features:
 * - Circle or rectangle shapes
 * - Customizable position, size, color
 * - Trigger zone detection (containsPoint)
 * - Editor-only rendering (invisible in game)
 * - JSON import/export
 * - One-time or repeatable triggers
 * 
 * @author Software Engineering Team Delta
 */

class EventFlag {
  /**
   * Create EventFlag
   * @param {Object} config - Flag configuration
   * @param {string} config.id - Unique flag ID (auto-generated if not provided)
   * @param {number} config.x - Center X position
   * @param {number} config.y - Center Y position
   * @param {number} config.radius - Radius for circle shape
   * @param {number} config.width - Width for rectangle shape
   * @param {number} config.height - Height for rectangle shape
   * @param {string} config.shape - Shape type: 'circle' or 'rectangle' (default: 'circle')
   * @param {string} config.eventId - Linked event ID from EventManager
   * @param {Object} config.color - Color object {r, g, b, a} (default: yellow with transparency)
   * @param {boolean} config.oneTime - True for one-time trigger, false for repeatable (default: false)
   * @param {string} config.triggerType - Trigger type: 'spatial', 'flag', 'custom', 'combined'
   * @param {Object} config.condition - Condition data for flag/custom triggers
   */
  constructor(config) {
    // Validate required fields
    if (!config) {
      throw new Error('EventFlag: config is required');
    }
    
    if (config.x === undefined || config.y === undefined) {
      throw new Error('EventFlag: position (x, y) is required');
    }
    
    if (!config.eventId) {
      throw new Error('EventFlag: eventId is required');
    }
    
    // Generate unique ID or use provided
    this.id = config.id || this._generateUniqueId();
    
    // Position (center point)
    this.x = config.x;
    this.y = config.y;
    
    // Shape type
    this.shape = config.shape || 'circle';
    
    // Shape-specific properties
    if (this.shape === 'circle') {
      if (config.radius === undefined) {
        throw new Error('EventFlag: radius is required for circle shape');
      }
      this.radius = Math.abs(config.radius); // Use absolute value
    } else if (this.shape === 'rectangle') {
      if (config.width === undefined || config.height === undefined) {
        throw new Error('EventFlag: width and height are required for rectangle shape');
      }
      this.width = config.width;
      this.height = config.height;
    }
    
    // Linked event
    this.eventId = config.eventId;
    
    // Visual properties
    this.color = config.color || this._getDefaultColor();
    
    // Trigger behavior
    this.oneTime = config.oneTime || false;
    this.triggerType = config.triggerType || 'spatial';
    this.condition = config.condition || null;
  }
  
  /**
   * Generate unique flag ID
   * @private
   * @returns {string} Unique ID
   */
  _generateUniqueId() {
    return 'flag-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }
  
  /**
   * Get default flag color (yellow with transparency)
   * @private
   * @returns {Object} Color object {r, g, b, a}
   */
  _getDefaultColor() {
    // Use p5.js color if available, otherwise return raw object
    if (typeof color !== 'undefined') {
      return color(255, 220, 0, 150);
    }
    return { r: 255, g: 220, b: 0, a: 150 };
  }
  
  /**
   * Check if point is within trigger zone
   * @param {number} x - Point X coordinate
   * @param {number} y - Point Y coordinate
   * @returns {boolean} True if point is inside trigger zone
   */
  containsPoint(x, y) {
    if (this.shape === 'circle') {
      // Circle: distance from center <= radius
      const dx = x - this.x;
      const dy = y - this.y;
      const distanceSquared = dx * dx + dy * dy;
      return distanceSquared <= this.radius * this.radius;
    } else if (this.shape === 'rectangle') {
      // Rectangle: centered at (x, y)
      const halfWidth = this.width / 2;
      const halfHeight = this.height / 2;
      
      return (
        x >= this.x - halfWidth &&
        x <= this.x + halfWidth &&
        y >= this.y - halfHeight &&
        y <= this.y + halfHeight
      );
    }
    
    return false;
  }
  
  /**
   * Render flag (visible only in editor mode)
   * @param {boolean} editorMode - True to render, false to skip
   */
  render(editorMode) {
    if (!editorMode) return;
    
    if (typeof push === 'undefined' || typeof pop === 'undefined') {
      return; // No rendering context
    }
    
    push();
    
    // Set fill color
    if (this.color) {
      if (this.color.r !== undefined) {
        fill(this.color.r, this.color.g, this.color.b, this.color.a || 150);
      } else {
        fill(this.color);
      }
    }
    
    // Set stroke
    stroke(255, 255, 255, 200);
    strokeWeight(2);
    
    // Draw shape
    if (this.shape === 'circle') {
      circle(this.x, this.y, this.radius * 2);
    } else if (this.shape === 'rectangle') {
      rectMode(CENTER);
      rect(this.x, this.y, this.width, this.height);
    }
    
    // Draw flag icon/label (optional - can add later)
    
    pop();
  }
  
  /**
   * Export flag to JSON
   * @returns {Object} JSON representation
   */
  exportToJSON() {
    const data = {
      id: this.id,
      x: this.x,
      y: this.y,
      shape: this.shape,
      eventId: this.eventId,
      color: this.color,
      oneTime: this.oneTime,
      triggerType: this.triggerType
    };
    
    // Add shape-specific properties
    if (this.shape === 'circle') {
      data.radius = this.radius;
    } else if (this.shape === 'rectangle') {
      data.width = this.width;
      data.height = this.height;
    }
    
    // Add condition if present
    if (this.condition) {
      data.condition = this.condition;
    }
    
    return data;
  }
  
  /**
   * Create EventFlag from JSON data
   * @param {Object} data - JSON data
   * @returns {EventFlag} New EventFlag instance
   */
  static importFromJSON(data) {
    return new EventFlag(data);
  }
}

// Export for browser
if (typeof window !== 'undefined') {
  window.EventFlag = EventFlag;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EventFlag;
}
