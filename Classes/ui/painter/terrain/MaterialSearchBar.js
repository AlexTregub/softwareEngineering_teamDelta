/**
 * MaterialSearchBar - Search input component for filtering materials by name
 * 
 * Provides text input with focus states, keyboard handling, and clear button.
 * Supports Enter key submission and Escape key clearing.
 * 
 * Usage:
 * const searchBar = new MaterialSearchBar({ placeholder: 'Search materials...' });
 * searchBar.render(10, 10, 200, 30);
 * const query = searchBar.getValue();
 * 
 * @class MaterialSearchBar
 */
class MaterialSearchBar {
  /**
   * @param {Object} options - Configuration options
   * @param {string} options.placeholder - Placeholder text
   * @param {number} options.width - Bar width (default: 200)
   * @param {Function} options.onSubmit - Callback when Enter pressed
   */
  constructor(options = {}) {
    this.value = '';
    this.focused = false;
    this.placeholder = options.placeholder || 'Search...';
    this.width = options.width || 200;
    this.onSubmit = options.onSubmit || null;
    
    // Layout constants
    this.height = 30;
    this.padding = 5;
    this.clearButtonSize = 20;
  }
  
  /**
   * Get current input value
   * @returns {string}
   */
  getValue() {
    return this.value;
  }
  
  /**
   * Set input value
   * @param {string} text - New value
   */
  setValue(text) {
    this.value = text || '';
  }
  
  /**
   * Clear input value
   */
  clear() {
    this.value = '';
  }
  
  /**
   * Focus the input
   */
  focus() {
    this.focused = true;
  }
  
  /**
   * Blur (unfocus) the input
   */
  blur() {
    this.focused = false;
  }
  
  /**
   * Check if input is focused
   * @returns {boolean}
   */
  isFocused() {
    return this.focused;
  }
  
  /**
   * Render the search bar
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Bar width
   * @param {number} height - Bar height
   */
  render(x, y, width, height) {
    push();
    
    // Use provided dimensions or defaults
    const w = width || this.width;
    const h = height || this.height;
    
    // Draw input box
    if (this.focused) {
      stroke(100, 150, 255); // Blue border when focused
      strokeWeight(2);
    } else {
      stroke(80);
      strokeWeight(1);
    }
    fill(40);
    rect(x, y, w, h);
    
    // Draw text or placeholder
    fill(this.value ? 255 : 120); // White for text, gray for placeholder
    noStroke();
    textAlign(LEFT, CENTER);
    textSize(14);
    
    const displayText = this.value || this.placeholder;
    text(displayText, x + this.padding, y + h / 2);
    
    // Draw cursor if focused and has value
    if (this.focused && typeof line === 'function') {
      const textW = typeof textWidth === 'function' ? textWidth(this.value) : this.value.length * 8;
      stroke(255);
      strokeWeight(1);
      line(x + this.padding + textW + 2, y + 5, x + this.padding + textW + 2, y + h - 5);
    }
    
    // Draw clear button (X) if has value
    if (this.value) {
      const clearX = x + w - this.clearButtonSize - this.padding;
      const clearY = y + (h - this.clearButtonSize) / 2;
      
      // Clear button background
      fill(80);
      noStroke();
      rect(clearX, clearY, this.clearButtonSize, this.clearButtonSize);
      
      // X icon
      stroke(200);
      strokeWeight(2);
      const offset = 5;
      line(clearX + offset, clearY + offset, 
           clearX + this.clearButtonSize - offset, clearY + this.clearButtonSize - offset);
      line(clearX + this.clearButtonSize - offset, clearY + offset,
           clearX + offset, clearY + this.clearButtonSize - offset);
    }
    
    pop();
  }
  
  /**
   * Handle click events
   * @param {number} mouseX - Mouse X coordinate
   * @param {number} mouseY - Mouse Y coordinate
   * @param {number} barX - Bar X position
   * @param {number} barY - Bar Y position
   * @returns {boolean} True if clear button clicked
   */
  handleClick(mouseX, mouseY, barX, barY) {
    const relX = mouseX - barX;
    const relY = mouseY - barY;
    
    // Check if click is within search bar bounds
    if (relX >= 0 && relX <= this.width && relY >= 0 && relY <= this.height) {
      // Check if click is on clear button
      if (this.value) {
        const clearX = this.width - this.clearButtonSize - this.padding;
        const clearY = (this.height - this.clearButtonSize) / 2;
        
        if (relX >= clearX && relX <= clearX + this.clearButtonSize &&
            relY >= clearY && relY <= clearY + this.clearButtonSize) {
          // Clear button clicked
          this.clear();
          return true;
        }
      }
      
      // Focus the input
      this.focus();
      return false;
    }
    
    return false;
  }
  
  /**
   * Handle keyboard input
   * @param {string} key - Key character
   * @param {number} keyCode - Key code
   * @returns {boolean} True if key was handled
   */
  handleKeyPress(key, keyCode) {
    // Backspace or Delete
    if (keyCode === 8 || keyCode === 46) {
      if (this.value.length > 0) {
        this.value = this.value.slice(0, -1);
      }
      return true;
    }
    
    // Escape
    if (keyCode === 27) {
      this.clear();
      this.blur();
      return true;
    }
    
    // Enter
    if (keyCode === 13) {
      if (this.onSubmit) {
        this.onSubmit(this.value);
      }
      return true;
    }
    
    // Alphanumeric, space, underscore, hyphen
    if (key && key.length === 1 && /[a-zA-Z0-9 _-]/.test(key)) {
      this.value += key;
      return true;
    }
    
    return false;
  }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MaterialSearchBar;
}

// Export for browser
if (typeof window !== 'undefined') {
  window.MaterialSearchBar = MaterialSearchBar;
}
