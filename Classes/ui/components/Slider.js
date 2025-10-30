/**
 * Slider Component
 * 
 * Reusable horizontal slider for numeric values with drag interaction
 * 
 * Example usage:
 *   const slider = new Slider(100, 200, 150, 0.5, 3.0, 1.5, (value) => {
 *     console.log('New value:', value);
 *   });
 *   slider.render();
 *   if (slider.containsPoint(mouseX, mouseY)) slider.handleDrag(mouseX, mouseY);
 */
class Slider {
  /**
   * Create a slider
   * @param {number} x - X position of slider's left edge
   * @param {number} y - Y position of slider's center
   * @param {number} width - Width of slider track
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @param {number} value - Initial value
   * @param {function} onChange - Optional callback when value changes
   */
  constructor(x, y, width, min, max, value, onChange = null) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.min = min;
    this.max = max;
    this.onChange = onChange;
    
    // Visual properties
    this.trackHeight = 4;
    this.handleRadius = 8;
    
    // State
    this.dragging = false;
    this.enabled = true;
    
    // Constrain initial value to range
    this.value = this._constrain(value);
  }
  
  /**
   * Render the slider
   */
  render() {
    if (typeof push !== 'undefined') push();
    
    // Calculate handle position
    const handleX = this._valueToPosition(this.value);
    
    // Track line
    if (typeof stroke !== 'undefined') {
      stroke(100);
      strokeWeight(this.trackHeight);
    }
    if (typeof line !== 'undefined') {
      line(this.x, this.y, this.x + this.width, this.y);
    }
    
    // Handle (circle)
    if (typeof noStroke !== 'undefined') noStroke();
    if (typeof fill !== 'undefined') {
      if (this.dragging) {
        fill(180, 200, 255); // Brighter when dragging
      } else {
        fill(120, 150, 200); // Normal color
      }
    }
    if (typeof circle !== 'undefined') {
      circle(handleX, this.y, this.handleRadius * 2);
    }
    
    // Value label
    if (typeof fill !== 'undefined') fill(255);
    if (typeof textAlign !== 'undefined') textAlign(typeof CENTER !== 'undefined' ? CENTER : 'center');
    if (typeof textSize !== 'undefined') textSize(11);
    if (typeof text !== 'undefined') {
      const displayValue = this._formatValue(this.value);
      text(displayValue, handleX, this.y - this.handleRadius - 5);
    }
    
    if (typeof pop !== 'undefined') pop();
  }
  
  /**
   * Check if point is within slider's interactive area
   * @param {number} x - X coordinate to test
   * @param {number} y - Y coordinate to test
   * @returns {boolean} True if point is on slider
   */
  containsPoint(x, y) {
    const hitBoxRadius = this.handleRadius;
    return x >= this.x && 
           x <= this.x + this.width && 
           y >= this.y - hitBoxRadius && 
           y <= this.y + hitBoxRadius;
  }
  
  /**
   * Start dragging the slider
   */
  startDrag() {
    this.dragging = true;
  }
  
  /**
   * Stop dragging the slider
   */
  endDrag() {
    this.dragging = false;
  }
  
  /**
   * Handle drag interaction - updates value based on x position
   * @param {number} x - Current mouse X position
   * @param {number} y - Current mouse Y position (unused but kept for consistency)
   */
  handleDrag(x, y) {
    if (!this.enabled) return;
    
    const newValue = this._positionToValue(x);
    
    // Only update if value actually changed
    if (newValue !== this.value) {
      this.value = newValue;
      
      // Call onChange callback if provided
      if (this.onChange) {
        this.onChange(this.value);
      }
    }
  }
  
  /**
   * Get current value
   * @returns {number} Current slider value
   */
  getValue() {
    return this.value;
  }
  
  /**
   * Set slider value programmatically
   * @param {number} value - New value to set
   */
  setValue(value) {
    const constrainedValue = this._constrain(value);
    
    if (constrainedValue !== this.value) {
      this.value = constrainedValue;
      
      // Call onChange callback
      if (this.onChange) {
        this.onChange(this.value);
      }
    }
  }
  
  /**
   * Enable or disable slider
   * @param {boolean} enabled - Whether slider should be enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    
    // Stop dragging if disabled
    if (!enabled && this.dragging) {
      this.dragging = false;
    }
  }
  
  // --- PRIVATE METHODS ---
  
  /**
   * Convert value to X position on track
   * @param {number} value - Value to convert
   * @returns {number} X position on track
   * @private
   */
  _valueToPosition(value) {
    if (this.max === this.min) return this.x;
    
    const normalized = (value - this.min) / (this.max - this.min);
    return this.x + (normalized * this.width);
  }
  
  /**
   * Convert X position on track to value
   * @param {number} x - X position
   * @returns {number} Value at that position
   * @private
   */
  _positionToValue(x) {
    if (this.max === this.min) return this.min;
    
    const constrainedX = this._constrainPosition(x);
    const normalized = (constrainedX - this.x) / this.width;
    const value = this.min + (normalized * (this.max - this.min));
    
    return this._constrain(value);
  }
  
  /**
   * Constrain X position to track bounds
   * @param {number} x - X position
   * @returns {number} Constrained X position
   * @private
   */
  _constrainPosition(x) {
    if (typeof constrain !== 'undefined') {
      return constrain(x, this.x, this.x + this.width);
    }
    return Math.max(this.x, Math.min(this.x + this.width, x));
  }
  
  /**
   * Constrain value to min/max range
   * @param {number} value - Value to constrain
   * @returns {number} Constrained value
   * @private
   */
  _constrain(value) {
    if (typeof constrain !== 'undefined') {
      return constrain(value, this.min, this.max);
    }
    return Math.max(this.min, Math.min(this.max, value));
  }
  
  /**
   * Format value for display
   * @param {number} value - Value to format
   * @returns {string} Formatted value
   * @private
   */
  _formatValue(value) {
    // Round to 2 decimal places if decimal
    if (value % 1 !== 0) {
      return value.toFixed(2);
    }
    return value.toString();
  }
}

// Export for Node.js and browser
if (typeof window !== 'undefined') {
  window.Slider = Slider;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Slider;
}
