/**
 * BrushSizeMenuModule - Inline brush size controls for menu bar
 * 
 * Provides inline +/- buttons in the menu bar for brush size control
 * Shows only when paint tool is active
 * Automatically hides when other tools are selected
 * 
 */

class BrushSizeMenuModule {
  /**
   * Create a brush size menu module
   * @param {Object} options - Configuration options
   * @param {number} options.x - X position
   * @param {number} options.y - Y position  
   * @param {number} options.initialSize - Initial brush size (1-99, default: 1)
   */
  constructor(options = {}) {
    // Position
    this.x = options.x || 0;
    this.y = options.y || 0;
    
    // Clamp initial size to valid range
    const initialSize = options.initialSize !== undefined ? options.initialSize : 1;
    this.currentSize = Math.max(1, Math.min(99, initialSize));
    
    // Callback
    this.onSizeChange = options.onSizeChange || null;
    
    // Visibility (controlled by tool selection)
    this.visible = false;
    
    // Style (matches FileMenuBar style)
    this.style = {
      backgroundColor: [45, 45, 45],
      textColor: [220, 220, 220],
      buttonColor: [60, 60, 60],
      buttonHoverColor: [80, 80, 80],
      buttonStroke: [150, 150, 150],
      width: 90,
      height: 40,
      buttonSize: 20,
      fontSize: 16
    };
    
    // Hover state
    this.hoveredButton = null; // 'decrease', 'increase', or null
  }
  
  /**
   * Set the brush size
   * @param {number} size - New brush size (1-9)
   */
  setSize(size) {
    const oldSize = this.currentSize;
    
    // Clamp to valid range
    const newSize = Math.max(1, Math.min(99, size));
    
    if (newSize !== oldSize) {
      this.currentSize = newSize;
      
      // Call callback if provided
      if (this.onSizeChange) {
        this.onSizeChange(newSize);
      }
    }
  }
  
  /**
   * Get the current brush size
   * @returns {number} Current brush size
   */
  getSize() {
    return this.currentSize;
  }
  
  /**
   * Increase brush size
   */
  increase() {
    this.setSize(this.currentSize + 1);
  }
  
  /**
   * Decrease brush size
   */
  decrease() {
    this.setSize(this.currentSize - 1);
  }
  
  /**
   * Set visibility based on tool selection
   * @param {boolean} visible - Whether module should be visible
   */
  setVisible(visible) {
    this.visible = visible;
  }
  
  /**
   * Check if module is visible
   * @returns {boolean} True if visible
   */
  isVisible() {
    return this.visible;
  }
  
  /**
   * Handle mouse move for hover effects
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   */
  handleMouseMove(mouseX, mouseY) {
    if (!this.visible) {
      this.hoveredButton = null;
      return;
    }
    
    const decreaseX = this.x + 5;
    const decreaseY = this.y + (this.style.height - this.style.buttonSize) / 2;
    
    const increaseX = this.x + this.style.width - 25;
    const increaseY = this.y + (this.style.height - this.style.buttonSize) / 2;
    
    // Check decrease button hover
    if (mouseX >= decreaseX && mouseX <= decreaseX + this.style.buttonSize &&
        mouseY >= decreaseY && mouseY <= decreaseY + this.style.buttonSize) {
      this.hoveredButton = 'decrease';
      return;
    }
    
    // Check increase button hover
    if (mouseX >= increaseX && mouseX <= increaseX + this.style.buttonSize &&
        mouseY >= increaseY && mouseY <= increaseY + this.style.buttonSize) {
      this.hoveredButton = 'increase';
      return;
    }
    
    this.hoveredButton = null;
  }
  
  /**
   * Handle click on module
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   * @returns {boolean} True if click was consumed
   */
  handleClick(mouseX, mouseY) {
    if (!this.visible) return false;
    
    const decreaseX = this.x + 5;
    const decreaseY = this.y + (this.style.height - this.style.buttonSize) / 2;
    
    const increaseX = this.x + this.style.width - 25;
    const increaseY = this.y + (this.style.height - this.style.buttonSize) / 2;
    
    // Check decrease button
    if (mouseX >= decreaseX && mouseX <= decreaseX + this.style.buttonSize &&
        mouseY >= decreaseY && mouseY <= decreaseY + this.style.buttonSize) {
      this.decrease();
      return true;
    }
    
    // Check increase button
    if (mouseX >= increaseX && mouseX <= increaseX + this.style.buttonSize &&
        mouseY >= increaseY && mouseY <= increaseY + this.style.buttonSize) {
      this.increase();
      return true;
    }
    
    return false;
  }
  
  /**
   * Render the inline brush size control
   */
  render() {
    if (!this.visible) return;
    if (typeof push !== 'function') return; // Guard for tests
    
    push();
    
    const centerY = this.y + this.style.height / 2;
    
    // Size value (centered)
    fill(this.style.textColor[0], this.style.textColor[1], this.style.textColor[2]);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(this.style.fontSize);
    text(this.currentSize, this.x + this.style.width / 2, centerY);
    
    // Decrease button
    const decreaseX = this.x + 5;
    const decreaseY = this.y + (this.style.height - this.style.buttonSize) / 2;
    const decreaseColor = this.hoveredButton === 'decrease' ? 
      this.style.buttonHoverColor : this.style.buttonColor;
    
    fill(decreaseColor[0], decreaseColor[1], decreaseColor[2]);
    stroke(this.style.buttonStroke[0], this.style.buttonStroke[1], this.style.buttonStroke[2]);
    strokeWeight(1);
    rect(decreaseX, decreaseY, this.style.buttonSize, this.style.buttonSize, 3);
    
    fill(this.style.textColor[0], this.style.textColor[1], this.style.textColor[2]);
    noStroke();
    textSize(18);
    textAlign(CENTER, CENTER);
    text('-', decreaseX + this.style.buttonSize / 2, decreaseY + this.style.buttonSize / 2);
    
    // Increase button
    const increaseX = this.x + this.style.width - 25;
    const increaseY = this.y + (this.style.height - this.style.buttonSize) / 2;
    const increaseColor = this.hoveredButton === 'increase' ? 
      this.style.buttonHoverColor : this.style.buttonColor;
    
    fill(increaseColor[0], increaseColor[1], increaseColor[2]);
    stroke(this.style.buttonStroke[0], this.style.buttonStroke[1], this.style.buttonStroke[2]);
    strokeWeight(1);
    rect(increaseX, increaseY, this.style.buttonSize, this.style.buttonSize, 3);
    
    fill(this.style.textColor[0], this.style.textColor[1], this.style.textColor[2]);
    noStroke();
    textSize(18);
    textAlign(CENTER, CENTER);
    text('+', increaseX + this.style.buttonSize / 2, increaseY + this.style.buttonSize / 2);
    
    pop();
  }
  
  /**
   * Get the width of the module (for layout calculation)
   * @returns {number} Width in pixels
   */
  getWidth() {
    return this.visible ? this.style.width : 0;
  }
}

// Global exports
if (typeof window !== 'undefined') {
  window.BrushSizeMenuModule = BrushSizeMenuModule;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BrushSizeMenuModule;
}
