/**
 * BrushSizeMenuModule - Brush size selection dropdown for menu bar
 * 
 * Provides a menu dropdown for selecting brush sizes 1-9
 * Integrates with FileMenuBar as an additional menu item
 * Emits events when size changes
 * 
 * @author Software Engineering Team Delta
 */

class BrushSizeMenuModule {
  /**
   * Create a brush size menu module
   * @param {Object} options - Configuration options
   * @param {string} options.label - Label for the menu item
   * @param {number} options.x - X position
   * @param {number} options.y - Y position  
   * @param {number} options.initialSize - Initial brush size (1-9, default: 1)
   */
  constructor(options = {}) {
    // Position
    this.label = options.label || 'Brush Size';
    this.x = options.x || 0;
    this.y = options.y || 0;
    
    // Clamp initial size to valid range
    const initialSize = options.initialSize !== undefined ? options.initialSize : 1;
    this.currentSize = Math.max(1, Math.min(9, initialSize));
    
    // Callback
    this.onSizeChange = options.onSizeChange || null;
    
    // Event listeners
    this.listeners = {
      brushSizeChanged: []
    };
    
    // State
    this.isOpen = false;
    this.hoveredSize = null;
    
    // Style (matches FileMenuBar style)
    this.style = {
      backgroundColor: [45, 45, 45],
      textColor: [220, 220, 220],
      hoverColor: [70, 70, 70],
      highlightColor: [100, 150, 255],
      dropdownBg: [50, 50, 50],
      itemHeight: 30,
      itemPadding: 10,
      fontSize: 14
    };
  }
  
  /**
   * Set the brush size
   * @param {number} size - New brush size (1-9)
   */
  setSize(size) {
    const oldSize = this.currentSize;
    
    // Clamp to valid range
    const newSize = Math.max(1, Math.min(9, size));
    
    if (newSize !== oldSize) {
      this.currentSize = newSize;
      
      // Call callback if provided
      if (this.onSizeChange) {
        this.onSizeChange(newSize);
      }
      
      // Emit event for listeners
      this._emit('brushSizeChanged', { size: newSize, oldSize });
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
   * Register event listener
   * @param {string} eventName - Event name ('brushSizeChanged')
   * @param {Function} callback - Callback function
   */
  on(eventName, callback) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].push(callback);
    }
  }
  
  /**
   * Emit event to all listeners
   * @param {string} eventName - Event name
   * @param {*} data - Event data
   * @private
   */
  _emit(eventName, data) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].forEach(callback => callback(data));
    }
  }
  
  /**
   * Render the dropdown menu (simple version using position from constructor)
   */
  render() {
    if (!this.isOpen) return;
    
    // Calculate dropdown position (starts right at module position)
    const dropdownX = this.x;
    const dropdownY = this.y;
    const dropdownWidth = 120;
    
    this.renderDropdown(dropdownX, dropdownY, dropdownWidth);
  }
  
  /**
   * Render the dropdown menu (called by FileMenuBar or directly)
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Dropdown width
   */
  renderDropdown(x, y, width) {
    if (!this.isOpen) return;
    
    push();
    
    // Dropdown background
    fill(this.style.dropdownBg[0], this.style.dropdownBg[1], this.style.dropdownBg[2]);
    noStroke();
    const dropdownHeight = 9 * this.style.itemHeight; // 9 sizes
    rect(x, y, width, dropdownHeight);
    
    // Render size options
    for (let size = 1; size <= 9; size++) {
      const itemY = y + (size - 1) * this.style.itemHeight;
      
      // Highlight current size or hovered size
      if (size === this.currentSize) {
        fill(this.style.highlightColor[0], this.style.highlightColor[1], this.style.highlightColor[2]);
        rect(x, itemY, width, this.style.itemHeight);
      } else if (size === this.hoveredSize) {
        fill(this.style.hoverColor[0], this.style.hoverColor[1], this.style.hoverColor[2]);
        rect(x, itemY, width, this.style.itemHeight);
      }
      
      // Size text
      fill(this.style.textColor[0], this.style.textColor[1], this.style.textColor[2]);
      textSize(this.style.fontSize);
      textAlign(LEFT, CENTER);
      text(`Size ${size}`, x + this.style.itemPadding, itemY + this.style.itemHeight / 2);
    }
    
    pop();
  }
  
  /**
   * Handle click on dropdown
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   * @param {Object} dropdownBounds - Optional dropdown bounds {x, y, width, height}
   * @returns {boolean} True if click was consumed
   */
  handleClick(mouseX, mouseY, dropdownBounds = null) {
    if (!this.isOpen) return false;
    
    // Use provided bounds or calculate from position
    const x = dropdownBounds ? dropdownBounds.x : this.x;
    const y = dropdownBounds ? dropdownBounds.y : this.y;
    const width = dropdownBounds ? dropdownBounds.width : 120;
    const dropdownHeight = 9 * this.style.itemHeight;
    
    // Check if click is within dropdown
    if (mouseX >= x && mouseX <= x + width &&
        mouseY >= y && mouseY <= y + dropdownHeight) {
      
      // Calculate which size was clicked
      const relativeY = mouseY - y;
      const clickedSize = Math.floor(relativeY / this.style.itemHeight) + 1;
      
      if (clickedSize >= 1 && clickedSize <= 9) {
        this.setSize(clickedSize);
        this.isOpen = false;
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Handle mouse move for hover effects
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   * @param {Object} dropdownBounds - Dropdown bounds {x, y, width, height}
   */
  handleMouseMove(mouseX, mouseY, dropdownBounds) {
    if (!this.isOpen) {
      this.hoveredSize = null;
      return;
    }
    
    const { x, y, width } = dropdownBounds;
    const dropdownHeight = 9 * this.style.itemHeight;
    
    // Check if mouse is within dropdown
    if (mouseX >= x && mouseX <= x + width &&
        mouseY >= y && mouseY <= y + dropdownHeight) {
      
      // Calculate which size is hovered
      const relativeY = mouseY - y;
      const hoveredSize = Math.floor(relativeY / this.style.itemHeight) + 1;
      
      if (hoveredSize >= 1 && hoveredSize <= 9) {
        this.hoveredSize = hoveredSize;
      } else {
        this.hoveredSize = null;
      }
    } else {
      this.hoveredSize = null;
    }
  }
  
  /**
   * Toggle dropdown open/closed
   */
  toggle() {
    this.isOpen = !this.isOpen;
  }
  
  /**
   * Set dropdown open state
   * @param {boolean} open - Whether dropdown should be open
   */
  setOpen(open) {
    this.isOpen = open;
    if (!open) {
      this.hoveredSize = null;
    }
  }
  
  /**
   * Open dropdown
   */
  open() {
    this.isOpen = true;
  }
  
  /**
   * Close dropdown
   */
  close() {
    this.isOpen = false;
    this.hoveredSize = null;
  }
}

// Global exports
if (typeof window !== 'undefined') {
  window.BrushSizeMenuModule = BrushSizeMenuModule;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BrushSizeMenuModule;
}
