/**
 * LevelEditorSidebar - Scrollable sidebar menu with top menu bar
 * 
 * Composition pattern: Uses ScrollableContentArea for content management.
 * 
 * @example
 * const sidebar = new LevelEditorSidebar({
 *   width: 300,
 *   height: 600,
 *   title: 'Tools'
 * });
 * 
 * // Add content items
 * sidebar.addText('header', 'Terrain Tools', { fontSize: 16 });
 * sidebar.addButton('grass', 'Grass', () => selectTool('grass'));
 * sidebar.addButton('stone', 'Stone', () => selectTool('stone'));
 * 
 * // Render in draw loop
 * sidebar.updateHover(mouseX, mouseY, sidebarX, sidebarY);
 * sidebar.render(sidebarX, sidebarY);
 * 
 * // Handle interactions
 * function mouseWheel(event) {
 *   sidebar.handleMouseWheel(event.delta, mouseX, mouseY);
 * }
 * 
 * function mousePressed() {
 *   const clicked = sidebar.handleClick(mouseX, mouseY, sidebarX, sidebarY);
 *   if (clicked && clicked.type === 'minimize') {
 *     sidebar.setVisible(false);
 *   }
 * }
 */

class LevelEditorSidebar {
  /**
   * Create a sidebar menu
   * @param {Object} options - Configuration options
   * @param {number} options.width - Sidebar width (default: 300)
   * @param {number} options.height - Sidebar height (default: 600)
   * @param {number} options.menuBarHeight - Menu bar height (default: 50)
   * @param {string} options.title - Menu bar title (default: 'Sidebar')
   * @param {Array<number>} options.backgroundColor - Background RGB (default: [40, 40, 40])
   * @param {Array<number>} options.menuBarColor - Menu bar RGB (default: [50, 50, 50])
   * @param {number} options.scrollSpeed - Scroll sensitivity (default: 20)
   */
  constructor(options = {}) {
    // Dimensions
    this.width = options.width !== undefined ? options.width : 300;
    this.height = options.height !== undefined ? options.height : 600;
    this.menuBarHeight = options.menuBarHeight !== undefined ? options.menuBarHeight : 50;
    
    // Visual properties
    this.title = options.title !== undefined ? options.title : 'Sidebar';
    this.backgroundColor = options.backgroundColor || [40, 40, 40];
    this.menuBarColor = options.menuBarColor || [50, 50, 50];
    
    // State
    this.visible = true;
    this.minimizeHovered = false;
    
    // Create ScrollableContentArea for content management
    const contentAreaHeight = this.height - this.menuBarHeight;
    this.contentArea = new ScrollableContentArea({
      width: this.width,
      height: contentAreaHeight,
      scrollSpeed: options.scrollSpeed !== undefined ? options.scrollSpeed : 20,
      backgroundColor: this.backgroundColor,
      textColor: options.textColor,
      itemPadding: options.itemPadding,
      indicatorHeight: options.indicatorHeight,
      indicatorBg: options.indicatorBg,
      indicatorArrow: options.indicatorArrow,
      onItemClick: options.onItemClick,
      onScroll: options.onScroll
    });
  }
  
  // ==================== Content Management ====================
  
  /**
   * Add a text item (delegates to contentArea)
   * @param {string} id - Unique item ID
   * @param {string} text - Text content
   * @param {Object} options - Text options (height, fontSize, color, padding)
   * @returns {Object} Created item
   */
  addText(id, text, options = {}) {
    return this.contentArea.addText(id, text, options);
  }
  
  /**
   * Add a button item (delegates to contentArea)
   * @param {string} id - Unique item ID
   * @param {string} label - Button label
   * @param {Function} callback - Click callback
   * @param {Object} options - Button options (height, backgroundColor, textColor)
   * @returns {Object} Created item
   */
  addButton(id, label, callback, options = {}) {
    return this.contentArea.addButton(id, label, callback, options);
  }
  
  /**
   * Add a custom item (delegates to contentArea)
   * @param {string} id - Unique item ID
   * @param {Function} renderFn - Render function (x, y, width) => void
   * @param {Function} clickFn - Click function (mouseX, mouseY, itemX, itemY, width, height) => boolean
   * @param {number} height - Item height
   * @returns {Object} Created item
   */
  addCustom(id, renderFn, clickFn = null, height) {
    return this.contentArea.addCustom(id, renderFn, clickFn, height);
  }
  
  /**
   * Remove an item by ID (delegates to contentArea)
   * @param {string} id - Item ID
   * @returns {boolean} True if item was removed
   */
  removeItem(id) {
    return this.contentArea.removeItem(id);
  }
  
  /**
   * Clear all content items (delegates to contentArea)
   */
  clearAll() {
    this.contentArea.clearAll();
  }
  
  /**
   * Get all content items (delegates to contentArea)
   * @returns {Array<Object>} Content items
   */
  getContentItems() {
    return this.contentArea.contentItems;
  }
  
  // ==================== Scroll Management ====================
  
  /**
   * Handle mouse wheel scrolling
   * @param {number} delta - Mouse wheel delta
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position relative to sidebar
   * @returns {boolean} True if scrolling occurred
   */
  handleMouseWheel(delta, mouseX, mouseY) {
    // Only scroll if mouse is over content area (not menu bar)
    if (mouseY < this.menuBarHeight) {
      return false;
    }
    
    return this.contentArea.handleMouseWheel(delta);
  }
  
  /**
   * Get current scroll offset (delegates to contentArea)
   * @returns {number} Scroll offset in pixels
   */
  getScrollOffset() {
    return this.contentArea.scrollOffset;
  }
  
  /**
   * Get maximum scroll offset (delegates to contentArea)
   * @returns {number} Max scroll offset in pixels
   */
  getMaxScrollOffset() {
    return this.contentArea.maxScrollOffset;
  }
  
  // ==================== Click Handling ====================
  
  /**
   * Handle mouse click
   * @param {number} mouseX - Mouse X in screen coordinates
   * @param {number} mouseY - Mouse Y in screen coordinates
   * @param {number} sidebarX - Sidebar X position
   * @param {number} sidebarY - Sidebar Y position
   * @returns {Object|null} Clicked item or menu action
   */
  handleClick(mouseX, mouseY, sidebarX, sidebarY) {
    const relX = mouseX - sidebarX;
    const relY = mouseY - sidebarY;
    
    // Check menu bar clicks
    if (relY >= 0 && relY < this.menuBarHeight) {
      // Check minimize button (right side of menu bar)
      const btnWidth = 40;
      const btnX = this.width - btnWidth - 5;
      const btnY = 5;
      const btnHeight = this.menuBarHeight - 10;
      
      if (relX >= btnX && relX <= btnX + btnWidth && 
          relY >= btnY && relY <= btnY + btnHeight) {
        return { type: 'minimize' };
      }
      
      return null; // Clicked menu bar but not a button
    }
    
    // Delegate content area clicks
    // Transform coordinates: content area starts below menu bar
    const contentAreaY = sidebarY + this.menuBarHeight;
    return this.contentArea.handleClick(mouseX, mouseY, sidebarX, contentAreaY);
  }
  
  // ==================== Hover State ====================
  
  /**
   * Update hover states
   * @param {number} mouseX - Mouse X in screen coordinates
   * @param {number} mouseY - Mouse Y in screen coordinates
   * @param {number} sidebarX - Sidebar X position
   * @param {number} sidebarY - Sidebar Y position
   */
  updateHover(mouseX, mouseY, sidebarX, sidebarY) {
    const relX = mouseX - sidebarX;
    const relY = mouseY - sidebarY;
    
    // Update minimize button hover
    if (relY >= 0 && relY < this.menuBarHeight) {
      const btnWidth = 40;
      const btnX = this.width - btnWidth - 5;
      const btnY = 5;
      const btnHeight = this.menuBarHeight - 10;
      
      this.minimizeHovered = (relX >= btnX && relX <= btnX + btnWidth && 
                              relY >= btnY && relY <= btnY + btnHeight);
    } else {
      this.minimizeHovered = false;
    }
    
    // Delegate content area hover
    const contentAreaY = sidebarY + this.menuBarHeight;
    this.contentArea.updateHover(mouseX, mouseY, sidebarX, contentAreaY);
  }
  
  // ==================== Rendering ====================
  
  /**
   * Render the sidebar
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  render(x, y) {
    if (!this.visible) return;
    
    push();
    
    // Render menu bar
    this._renderMenuBar(x, y);
    
    // Render content area below menu bar
    const contentAreaY = y + this.menuBarHeight;
    this.contentArea.render(x, contentAreaY);
    
    pop();
  }
  
  /**
   * Render the menu bar
   * @param {number} x - X position
   * @param {number} y - Y position
   * @private
   */
  _renderMenuBar(x, y) {
    // Menu bar background
    fill(this.menuBarColor);
    noStroke();
    rect(x, y, this.width, this.menuBarHeight);
    
    // Title
    fill([200, 200, 200]);
    textAlign(LEFT, CENTER);
    textSize(14);
    text(this.title, x + 10, y + this.menuBarHeight / 2);
    
    // Minimize button
    const btnWidth = 40;
    const btnX = x + this.width - btnWidth - 5;
    const btnY = y + 5;
    const btnHeight = this.menuBarHeight - 10;
    
    // Button background
    if (this.minimizeHovered) {
      fill([80, 80, 80]);
    } else {
      fill([60, 60, 60]);
    }
    rect(btnX, btnY, btnWidth, btnHeight);
    
    // Minimize icon
    fill([200, 200, 200]);
    textAlign(CENTER, CENTER);
    textSize(16);
    text('_', btnX + btnWidth / 2, btnY + btnHeight / 2);
  }
  
  // ==================== Dimensions ====================
  
  /**
   * Get total width
   * @returns {number} Width in pixels
   */
  getWidth() {
    return this.width;
  }
  
  /**
   * Get total height
   * @returns {number} Height in pixels
   */
  getHeight() {
    return this.height;
  }
  
  /**
   * Get menu bar height
   * @returns {number} Menu bar height in pixels
   */
  getMenuBarHeight() {
    return this.menuBarHeight;
  }
  
  /**
   * Get content area height
   * @returns {number} Content area height in pixels
   */
  getContentAreaHeight() {
    return this.height - this.menuBarHeight;
  }
  
  /**
   * Update dimensions
   * @param {number} width - New width
   * @param {number} height - New height
   */
  setDimensions(width, height) {
    this.width = width;
    this.height = height;
    
    // Update content area dimensions
    const contentAreaHeight = this.height - this.menuBarHeight;
    this.contentArea.setDimensions(width, contentAreaHeight);
  }
  
  // ==================== Visibility ====================
  
  /**
   * Check if sidebar is visible
   * @returns {boolean} True if visible
   */
  isVisible() {
    return this.visible;
  }
  
  /**
   * Set visibility
   * @param {boolean} visible - Visibility state
   */
  setVisible(visible) {
    this.visible = visible;
  }
  
  // ==================== Utility ====================
  
  /**
   * Check if content overflows viewport (requires scrolling)
   * @returns {boolean} True if content exceeds visible height
   */
  hasOverflow() {
    const totalHeight = this.contentArea.calculateTotalHeight();
    const visibleHeight = this.contentArea.getVisibleHeight();
    return totalHeight > visibleHeight;
  }
}

// Export for Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LevelEditorSidebar;
}

// Export for browser (global)
if (typeof window !== 'undefined') {
  window.LevelEditorSidebar = LevelEditorSidebar;
}
