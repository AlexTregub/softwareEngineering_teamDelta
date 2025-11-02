/**
 * ButtonGroup - Manages multiple buttons as a unified group
 * 
 * Provides automatic button positioning, styling, and interaction handling.
 * Reduces code duplication when managing multiple buttons in dialogs/panels.
 * 
 * Features:
 * - Auto-positioning (horizontal/vertical)
 * - Standard button styles (cancel, primary, danger)
 * - Click handling for all buttons
 * - Enable/disable individual buttons
 * - Alignment options (bottom-center, top-center, etc.)
 * 
 * @class ButtonGroup
 */
class ButtonGroup {
  /**
   * Create a button group
   * @param {Object} config - Configuration options
   * @param {string} [config.orientation='horizontal'] - 'horizontal' or 'vertical'
   * @param {number} [config.spacing=10] - Spacing between buttons in pixels
   * @param {string} [config.alignment='bottom-center'] - Alignment within parent
   * @param {number} [config.parentWidth=400] - Parent container width
   * @param {number} [config.parentHeight=300] - Parent container height
   * @param {number} [config.buttonWidth=100] - Default button width
   * @param {number} [config.buttonHeight=30] - Default button height
   */
  constructor(config = {}) {
    this.buttons = [];
    this.orientation = config.orientation || 'horizontal';
    this.spacing = config.spacing !== undefined ? config.spacing : 10;
    this.alignment = config.alignment || 'bottom-center';
    this.parentWidth = config.parentWidth || 400;
    this.parentHeight = config.parentHeight || 300;
    this.buttonWidth = config.buttonWidth || 100;
    this.buttonHeight = config.buttonHeight || 30;
  }
  
  /**
   * Add a button to the group
   * @param {string} label - Button label text
   * @param {string} type - Button type ('cancel', 'primary', 'danger')
   * @param {Function} callback - Click callback function
   */
  addButton(label, type, callback) {
    // Get style for button type
    const styles = this._getStyleForType(type);
    
    // Create button at temporary position (will be repositioned)
    const button = new Button(0, 0, this.buttonWidth, this.buttonHeight, label, styles);
    button.callback = callback;
    
    this.buttons.push(button);
    
    // Reposition all buttons
    this._repositionButtons();
  }
  
  /**
   * Get button style configuration for type
   * @private
   * @param {string} type - Button type
   * @returns {Object} Style configuration
   */
  _getStyleForType(type) {
    const baseStyles = {
      borderColor: '#646464',
      borderWidth: 2,
      cornerRadius: 5,
      fontSize: 14,
      textColor: '#FFFFFF'
    };
    
    if (type === 'cancel') {
      return { ...baseStyles, ...ButtonStyles.CANCEL };
    } else if (type === 'primary') {
      return { ...baseStyles, ...ButtonStyles.PRIMARY };
    } else if (type === 'danger') {
      return { ...baseStyles, ...ButtonStyles.DANGER };
    }
    
    return baseStyles;
  }
  
  /**
   * Reposition all buttons based on orientation and alignment
   * @private
   */
  _repositionButtons() {
    if (this.buttons.length === 0) return;
    
    if (this.orientation === 'horizontal') {
      this._repositionHorizontal();
    } else {
      this._repositionVertical();
    }
  }
  
  /**
   * Reposition buttons horizontally
   * @private
   */
  _repositionHorizontal() {
    // Calculate total width
    const totalWidth = (this.buttonWidth * this.buttons.length) + 
                       (this.spacing * (this.buttons.length - 1));
    
    // Calculate starting X based on alignment
    let startX;
    if (this.alignment.includes('center')) {
      startX = (this.parentWidth - totalWidth) / 2;
    } else if (this.alignment.includes('left')) {
      startX = this.spacing;
    } else if (this.alignment.includes('right')) {
      startX = this.parentWidth - totalWidth - this.spacing;
    } else {
      startX = (this.parentWidth - totalWidth) / 2; // Default to center
    }
    
    // Calculate Y based on alignment
    let y;
    if (this.alignment.includes('bottom')) {
      y = this.parentHeight - this.buttonHeight - 50;
    } else if (this.alignment.includes('top')) {
      y = 50;
    } else {
      y = (this.parentHeight - this.buttonHeight) / 2;
    }
    
    // Position each button
    let currentX = startX;
    this.buttons.forEach(button => {
      button.bounds.x = currentX;
      button.bounds.y = y;
      currentX += this.buttonWidth + this.spacing;
    });
  }
  
  /**
   * Reposition buttons vertically
   * @private
   */
  _repositionVertical() {
    // Calculate total height
    const totalHeight = (this.buttonHeight * this.buttons.length) + 
                        (this.spacing * (this.buttons.length - 1));
    
    // Calculate starting Y based on alignment
    let startY;
    if (this.alignment.includes('center')) {
      startY = (this.parentHeight - totalHeight) / 2;
    } else if (this.alignment.includes('top')) {
      startY = this.spacing;
    } else if (this.alignment.includes('bottom')) {
      startY = this.parentHeight - totalHeight - this.spacing;
    } else {
      startY = (this.parentHeight - totalHeight) / 2; // Default to center
    }
    
    // Calculate X based on alignment
    let x;
    if (this.alignment.includes('center')) {
      x = (this.parentWidth - this.buttonWidth) / 2;
    } else if (this.alignment.includes('left')) {
      x = this.spacing;
    } else if (this.alignment.includes('right')) {
      x = this.parentWidth - this.buttonWidth - this.spacing;
    } else {
      x = (this.parentWidth - this.buttonWidth) / 2; // Default to center
    }
    
    // Position each button
    let currentY = startY;
    this.buttons.forEach(button => {
      button.bounds.x = x;
      button.bounds.y = currentY;
      currentY += this.buttonHeight + this.spacing;
    });
  }
  
  /**
   * Render all buttons to buffer
   * @param {p5.Graphics} buffer - Graphics buffer to render to
   */
  renderToBuffer(buffer) {
    if (!buffer) return;
    
    this.buttons.forEach(button => {
      button.renderToBuffer(buffer);
    });
  }
  
  /**
   * Handle click on button group
   * @param {number} x - Click X coordinate (relative to parent)
   * @param {number} y - Click Y coordinate (relative to parent)
   * @returns {boolean} True if any button was clicked
   */
  handleClick(x, y) {
    for (const button of this.buttons) {
      const bounds = button.bounds.getBounds();
      if (x >= bounds.x && x <= bounds.x + bounds.width &&
          y >= bounds.y && y <= bounds.y + bounds.height) {
        if (button.callback) {
          button.callback();
        }
        return true;
      }
    }
    return false;
  }
  
  /**
   * Enable or disable a specific button
   * @param {string} label - Button label
   * @param {boolean} enabled - Whether button should be enabled
   */
  setButtonEnabled(label, enabled) {
    const button = this.buttons.find(b => b.caption === label);
    if (button) {
      button.setEnabled(enabled);
    }
  }
  
  /**
   * Get button by label
   * @param {string} label - Button label
   * @returns {Button|undefined} Button instance or undefined
   */
  getButton(label) {
    return this.buttons.find(b => b.caption === label);
  }
  
  /**
   * Set parent dimensions (for repositioning)
   * @param {number} width - Parent width
   * @param {number} height - Parent height
   */
  setParentDimensions(width, height) {
    this.parentWidth = width;
    this.parentHeight = height;
    this._repositionButtons();
  }
  
  /**
   * Clear all buttons
   */
  clear() {
    this.buttons = [];
  }
}

// Export for Node.js tests and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ButtonGroup;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
  window.ButtonGroup = ButtonGroup;
}
