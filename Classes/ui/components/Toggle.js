/**
 * Toggle Component
 * 
 * Reusable toggle switch for boolean settings
 * 
 * @class Toggle
 * 
 * Usage:
 * ```javascript
 * const toggle = new Toggle(100, 100, false);
 * toggle.render();
 * if (toggle.containsPoint(mouseX, mouseY)) {
 *   toggle.toggle();
 * }
 * ```
 */
class Toggle {
  /**
   * Create a toggle switch
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {boolean} isOn - Initial state (default: false)
   */
  constructor(x, y, isOn = false) {
    this.x = x;
    this.y = y;
    this.isOn = isOn;
    this.width = 50;
    this.height = 25;
    this.handleRadius = 9;
    this.padding = 3; // Space from edge
  }
  
  /**
   * Render the toggle switch
   */
  render() {
    if (typeof push === 'function') push();
    
    // Background track
    if (typeof fill === 'function') {
      fill(
        this.isOn ? 100 : 60,
        this.isOn ? 150 : 60,
        this.isOn ? 255 : 60
      );
    }
    
    if (typeof noStroke === 'function') noStroke();
    
    if (typeof rect === 'function') {
      rect(this.x, this.y, this.width, this.height, 12);
    }
    
    // Handle circle
    if (typeof fill === 'function') fill(255);
    
    // Calculate handle position
    const handleX = this.isOn 
      ? this.x + this.width - this.handleRadius - this.padding  // Right edge when ON
      : this.x + this.handleRadius + this.padding;              // Left edge when OFF
    const handleY = this.y + this.height / 2;
    
    if (typeof circle === 'function') {
      circle(handleX, handleY, this.handleRadius * 2);
    }
    
    if (typeof pop === 'function') pop();
  }
  
  /**
   * Check if point is inside toggle bounds
   * @param {number} px - Point X coordinate
   * @param {number} py - Point Y coordinate
   * @returns {boolean} True if point inside toggle
   */
  containsPoint(px, py) {
    return px >= this.x && px <= this.x + this.width &&
           py >= this.y && py <= this.y + this.height;
  }
  
  /**
   * Toggle the state (ON ↔ OFF)
   */
  toggle() {
    this.isOn = !this.isOn;
  }
  
  /**
   * Set the toggle state explicitly
   * @param {boolean} value - New state
   */
  setValue(value) {
    this.isOn = !!value; // Convert to boolean
  }
  
  /**
   * Get the current toggle state
   * @returns {boolean} Current state
   */
  getValue() {
    return this.isOn;
  }
}

// Global export for browser
if (typeof window !== 'undefined') {
  window.Toggle = Toggle;
}

// Module export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Toggle;
}
