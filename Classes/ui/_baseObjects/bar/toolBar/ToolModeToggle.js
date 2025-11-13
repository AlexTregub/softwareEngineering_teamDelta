/**
 * ToolModeToggle
 * 
 * Radio-button style mode selector for Level Editor tools.
 * Displays mode buttons in menu bar when a tool with modes is selected.
 * 
 * Features:
 * - Radio button pattern (only one mode active)
 * - Click to switch modes
 * - Hover highlighting
 * - Callback on mode change
 * 
 * @class ToolModeToggle
 */
class ToolModeToggle {
  // Button dimensions (constants)
  static BUTTON_WIDTH = 80;
  static BUTTON_HEIGHT = 28;
  static BUTTON_SPACING = 8;
  
  /**
   * Create a tool mode toggle
   * @param {number} x - X position for first button
   * @param {number} y - Y position for buttons
   * @param {Array<string>} modes - Array of mode names
   * @param {Function} [onModeChange] - Optional callback function (mode) => {}
   */
  constructor(x, y, modes, onModeChange = null) {
    this.x = x;
    this.y = y;
    this.modes = modes;
    this.onModeChange = onModeChange;
    
    // Button dimensions
    this.buttonWidth = ToolModeToggle.BUTTON_WIDTH;
    this.buttonHeight = ToolModeToggle.BUTTON_HEIGHT;
    this.buttonSpacing = ToolModeToggle.BUTTON_SPACING;
    
    // Current mode (default to first mode)
    this.currentMode = modes.length > 0 ? modes[0] : null;
  }
  
  /**
   * Set current mode
   * @param {string} mode - Mode to set
   * @throws {Error} If mode is not in modes array
   */
  setMode(mode) {
    if (!this.modes.includes(mode)) {
      throw new Error(`Invalid mode: ${mode}. Valid modes are: ${this.modes.join(', ')}`);
    }
    
    // Only trigger callback if mode actually changed
    if (this.currentMode !== mode) {
      this.currentMode = mode;
      
      if (this.onModeChange) {
        this.onModeChange(mode);
      }
    }
  }
  
  /**
   * Get current mode
   * @returns {string} Current mode
   */
  getCurrentMode() {
    return this.currentMode;
  }
  
  /**
   * Test if point is within any button
   * @param {number} mouseX - Mouse X coordinate
   * @param {number} mouseY - Mouse Y coordinate
   * @returns {boolean} True if hit
   */
  hitTest(mouseX, mouseY) {
    for (let i = 0; i < this.modes.length; i++) {
      const bounds = this._getButtonBounds(i);
      
      if (mouseX >= bounds.x && mouseX <= bounds.x + bounds.width &&
          mouseY >= bounds.y && mouseY <= bounds.y + bounds.height) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Handle click event
   * @param {number} mouseX - Mouse X coordinate
   * @param {number} mouseY - Mouse Y coordinate
   * @returns {boolean} True if click was handled
   */
  handleClick(mouseX, mouseY) {
    for (let i = 0; i < this.modes.length; i++) {
      const bounds = this._getButtonBounds(i);
      
      if (mouseX >= bounds.x && mouseX <= bounds.x + bounds.width &&
          mouseY >= bounds.y && mouseY <= bounds.y + bounds.height) {
        
        const clickedMode = this.modes[i];
        
        // Only change if different from current mode
        if (clickedMode !== this.currentMode) {
          this.setMode(clickedMode);
          return true;
        }
        
        return false; // Clicked current mode, no change
      }
    }
    
    return false; // Click outside all buttons
  }
  
  /**
   * Get bounds for a specific mode button
   * @param {string} mode - Mode name
   * @returns {Object|null} Bounds {x, y, width, height} or null if not found
   */
  getButtonBounds(mode) {
    const index = this.modes.indexOf(mode);
    if (index === -1) return null;
    
    return this._getButtonBounds(index);
  }
  
  /**
   * Get bounds for button at index
   * @param {number} index - Button index
   * @returns {Object} Bounds {x, y, width, height}
   * @private
   */
  _getButtonBounds(index) {
    const buttonX = this.x + index * (this.buttonWidth + this.buttonSpacing);
    
    return {
      x: buttonX,
      y: this.y,
      width: this.buttonWidth,
      height: this.buttonHeight
    };
  }
  
  /**
   * Check if mouse is over a specific button
   * @param {number} mouseX - Mouse X coordinate
   * @param {number} mouseY - Mouse Y coordinate
   * @param {number} buttonIndex - Button index
   * @returns {boolean} True if hovering
   * @private
   */
  _isHovering(mouseX, mouseY, buttonIndex) {
    const bounds = this._getButtonBounds(buttonIndex);
    
    return (mouseX >= bounds.x && mouseX <= bounds.x + bounds.width &&
            mouseY >= bounds.y && mouseY <= bounds.y + bounds.height);
  }
  
  /**
   * Render mode toggle buttons
   */
  render() {
    if (!this.modes || this.modes.length === 0) return;
    
    // Get mouse position for hover detection (check global first for testing)
    const mouseX = (typeof global !== 'undefined' && global.mouseX !== undefined) ? global.mouseX :
                   (typeof window !== 'undefined' && window.mouseX !== undefined) ? window.mouseX : 0;
    const mouseY = (typeof global !== 'undefined' && global.mouseY !== undefined) ? global.mouseY :
                   (typeof window !== 'undefined' && window.mouseY !== undefined) ? window.mouseY : 0;
    
    push();
    
    for (let i = 0; i < this.modes.length; i++) {
      const mode = this.modes[i];
      const bounds = this._getButtonBounds(i);
      const isActive = (mode === this.currentMode);
      const isHovering = this._isHovering(mouseX, mouseY, i);
      
      // Draw button background
      if (isActive) {
        fill(100, 150, 255); // Blue for active mode
      } else if (isHovering) {
        fill(220, 220, 220); // Light gray for hover
      } else {
        fill(200, 200, 200); // Gray for inactive
      }
      
      stroke(50, 50, 50);
      strokeWeight(1);
      rect(bounds.x, bounds.y, bounds.width, bounds.height);
      
      // Draw text label
      fill(0);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(12);
      text(mode, bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    }
    
    pop();
  }
}

// Export for Node.js (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ToolModeToggle;
}

// Export for browser (global)
if (typeof window !== 'undefined') {
  window.ToolModeToggle = ToolModeToggle;
}
