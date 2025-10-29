/**
 * ScrollableContentArea Component
 * 
 * Reusable scrollable content container with viewport culling.
 * High-performance scrollable content rendering with item management.
 * 
 * @class ScrollableContentArea
 * @file Classes/ui/ScrollableContentArea.js
 * 
 * Usage Example:
 * 
 * const contentArea = new ScrollableContentArea({
 *   width: 300,
 *   height: 600,
 *   scrollSpeed: 20,
 *   onItemClick: (item) => console.log('Clicked:', item.id)
 * });
 * 
 * // Add content
 * contentArea.addText('title', 'My Sidebar', { fontSize: 16 });
 * contentArea.addButton('btn1', 'Click Me', () => alert('Clicked!'));
 * contentArea.addCustom('custom1', (x, y, w) => {
 *   fill(255, 0, 0);
 *   rect(x, y, w, 50);
 * }, null, 50);
 * 
 * // In parent's render()
 * contentArea.render(10, 50);
 * 
 * // In parent's handleMouseWheel()
 * if (contentArea.handleMouseWheel(event.delta)) {
 *   return; // Consumed
 * }
 * 
 * // In parent's handleClick()
 * const clicked = contentArea.handleClick(mouseX, mouseY, 10, 50);
 * if (clicked) {
 *   console.log('Clicked item:', clicked.id);
 * }
 */

class ScrollableContentArea {
  /**
   * Create a scrollable content area
   * @param {Object} options - Configuration options
   * @param {number} [options.width=200] - Content area width
   * @param {number} [options.height=400] - Content area height
   * @param {number} [options.scrollSpeed=20] - Pixels per wheel tick
   * @param {number} [options.itemPadding=5] - Default item padding
   * @param {Array<number>} [options.backgroundColor=[50, 50, 50]] - Background RGB
   * @param {Array<number>} [options.textColor=[220, 220, 220]] - Default text RGB
   * @param {number} [options.indicatorHeight=20] - Scroll indicator height
   * @param {Array<number>} [options.indicatorBg=[60, 60, 60]] - Indicator background
   * @param {Array<number>} [options.indicatorArrow=[200, 200, 200]] - Indicator arrow color
   * @param {Function} [options.onItemClick] - Global click callback (item, x, y)
   * @param {Function} [options.onScroll] - Scroll callback (offset, maxOffset)
   */
  constructor(options = {}) {
    // Dimensions
    this.width = options.width || 200;
    this.height = options.height || 400;
    
    // Scroll state
    this.scrollOffset = 0;
    this.maxScrollOffset = 0;
    this.scrollSpeed = options.scrollSpeed || 20; // px per wheel tick
    
    // Content items
    this.contentItems = [];
    
    // Styling
    this.itemPadding = options.itemPadding || 5;
    this.backgroundColor = options.backgroundColor || [50, 50, 50];
    this.textColor = options.textColor || [220, 220, 220];
    
    // Scroll indicator (composition pattern)
    this.scrollIndicator = new ScrollIndicator({
      height: options.indicatorHeight || 20,
      backgroundColor: options.indicatorBg || [60, 60, 60],
      arrowColor: options.indicatorArrow || [200, 200, 200]
    });
    
    // Callbacks
    this.onItemClick = options.onItemClick || null;
    this.onScroll = options.onScroll || null;
  }
  
  /**
   * Add a text item
   * @param {string} id - Unique identifier
   * @param {string} textContent - Text to display
   * @param {Object} options - Additional options (color, fontSize, etc.)
   * @returns {Object} Created item
   */
  addText(id, textContent, options = {}) {
    const item = {
      id: id,
      type: 'text',
      text: textContent,
      height: options.height || 25,
      fontSize: options.fontSize || 12,
      color: options.color || this.textColor,
      padding: options.padding || this.itemPadding,
      render: (x, y, width) => {
        push();
        fill(item.color);
        textAlign(LEFT, CENTER);
        textSize(item.fontSize);
        text(item.text, x + item.padding, y + item.height / 2);
        pop();
      }
    };
    
    this.contentItems.push(item);
    this.updateScrollBounds();
    return item;
  }
  
  /**
   * Add a button item
   * @param {string} id - Unique identifier
   * @param {string} label - Button label
   * @param {Function} callback - Click callback
   * @param {Object} options - Additional options
   * @returns {Object} Created item
   */
  addButton(id, label, callback, options = {}) {
    const item = {
      id: id,
      type: 'button',
      label: label,
      height: options.height || 30,
      fontSize: options.fontSize || 12,
      backgroundColor: options.backgroundColor || [70, 130, 180],
      hoverColor: options.hoverColor || [100, 160, 210],
      textColor: options.textColor || [255, 255, 255],
      padding: options.padding || this.itemPadding,
      isHovered: false,
      clickCallback: callback,
      render: (x, y, width) => {
        push();
        
        // Background
        const bgColor = item.isHovered ? item.hoverColor : item.backgroundColor;
        fill(bgColor);
        noStroke();
        rect(x + item.padding, y, width - item.padding * 2, item.height, 5);
        
        // Label
        fill(item.textColor);
        textAlign(CENTER, CENTER);
        textSize(item.fontSize);
        text(item.label, x + width / 2, y + item.height / 2);
        
        pop();
      },
      containsPoint: (x, y, itemX, itemY, width) => {
        return x >= itemX + item.padding && 
               x <= itemX + width - item.padding &&
               y >= itemY && 
               y <= itemY + item.height;
      }
    };
    
    this.contentItems.push(item);
    this.updateScrollBounds();
    return item;
  }
  
  /**
   * Add a custom item with user-defined render function
   * @param {string} id - Unique identifier
   * @param {Function} renderFn - Render function (x, y, width)
   * @param {Function} clickFn - Click handler (x, y) or null
   * @param {number} height - Item height
   * @returns {Object} Created item
   */
  addCustom(id, renderFn, clickFn, height = 30) {
    const item = {
      id: id,
      type: 'custom',
      height: height,
      render: renderFn,
      clickCallback: clickFn,
      containsPoint: clickFn ? (x, y, itemX, itemY, width) => {
        return x >= itemX && x <= itemX + width &&
               y >= itemY && y <= itemY + item.height;
      } : null
    };
    
    this.contentItems.push(item);
    this.updateScrollBounds();
    return item;
  }
  
  /**
   * Remove an item by ID
   * @param {string} id - Item ID to remove
   * @returns {boolean} True if removed
   */
  removeItem(id) {
    const index = this.contentItems.findIndex(item => item.id === id);
    if (index > -1) {
      this.contentItems.splice(index, 1);
      this.updateScrollBounds();
      return true;
    }
    return false;
  }
  
  /**
   * Clear all content items
   */
  clearAll() {
    this.contentItems = [];
    this.scrollOffset = 0;
    this.updateScrollBounds();
  }
  
  /**
   * Calculate total content height
   * @returns {number} Total height in pixels
   */
  calculateTotalHeight() {
    return this.contentItems.reduce((sum, item) => sum + item.height, 0);
  }
  
  /**
   * Calculate maximum scroll offset
   * @returns {number} Max scroll offset
   */
  calculateMaxScrollOffset() {
    const totalHeight = this.calculateTotalHeight();
    const visibleHeight = this.getVisibleHeight();
    return Math.max(0, totalHeight - visibleHeight);
  }
  
  /**
   * Get visible content height (accounting for scroll indicators)
   * @returns {number} Visible height in pixels
   */
  getVisibleHeight() {
    const indicatorHeight = this.scrollIndicator.getTotalHeight(this.scrollOffset, this.maxScrollOffset);
    return this.height - indicatorHeight;
  }
  
  /**
   * Update scroll bounds after content changes
   */
  updateScrollBounds() {
    this.maxScrollOffset = this.calculateMaxScrollOffset();
    this.clampScrollOffset();
  }
  
  /**
   * Clamp scroll offset to valid range
   */
  clampScrollOffset() {
    this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, this.maxScrollOffset));
  }
  
  /**
   * Get items visible in current viewport
   * @returns {Array} Array of { item, y } objects
   */
  getVisibleItems() {
    const visibleTop = this.scrollOffset;
    const visibleBottom = this.scrollOffset + this.getVisibleHeight();
    const visibleItems = [];
    
    let currentY = 0;
    for (const item of this.contentItems) {
      const itemTop = currentY;
      const itemBottom = currentY + item.height;
      
      // Check if item is in viewport
      if (itemBottom >= visibleTop && itemTop <= visibleBottom) {
        visibleItems.push({
          item: item,
          y: currentY - this.scrollOffset // Y position relative to viewport
        });
      }
      
      currentY += item.height;
      
      // Early exit if we're past the viewport
      if (itemTop > visibleBottom) break;
    }
    
    return visibleItems;
  }
  
  /**
   * Handle mouse wheel scrolling
   * @param {number} delta - Wheel delta (negative = scroll down)
   * @returns {boolean} True if scroll was handled
   */
  handleMouseWheel(delta) {
    if (this.maxScrollOffset <= 0) return false; // No scrolling needed
    
    // delta negative = scroll down (increase offset)
    // delta positive = scroll up (decrease offset)
    const oldOffset = this.scrollOffset;
    this.scrollOffset -= delta * (this.scrollSpeed / 10); // Note: subtract to invert
    this.clampScrollOffset();
    
    // Trigger callback if scrolled
    if (this.scrollOffset !== oldOffset && this.onScroll) {
      this.onScroll(this.scrollOffset, this.maxScrollOffset);
    }
    
    return this.scrollOffset !== oldOffset; // True if we scrolled
  }
  
  /**
   * Handle click on content area
   * @param {number} mouseX - Click X
   * @param {number} mouseY - Click Y
   * @param {number} areaX - Content area X
   * @param {number} areaY - Content area Y
   * @returns {Object|null} Clicked item or null
   */
  handleClick(mouseX, mouseY, areaX, areaY) {
    const visibleItems = this.getVisibleItems();
    
    for (const { item, y } of visibleItems) {
      const itemY = areaY + y;
      
      // Check if item has click handler
      if (item.containsPoint && item.containsPoint(mouseX, mouseY, areaX, itemY, this.width)) {
        // Trigger item's click callback
        if (item.clickCallback) {
          item.clickCallback(mouseX, mouseY);
        }
        
        // Trigger global callback
        if (this.onItemClick) {
          this.onItemClick(item, mouseX, mouseY);
        }
        
        return item;
      }
    }
    
    return null;
  }
  
  /**
   * Update hover state for items
   * @param {number} mouseX - Mouse X
   * @param {number} mouseY - Mouse Y
   * @param {number} areaX - Content area X
   * @param {number} areaY - Content area Y
   */
  updateHover(mouseX, mouseY, areaX, areaY) {
    const visibleItems = this.getVisibleItems();
    
    for (const { item, y } of visibleItems) {
      const itemY = areaY + y;
      
      if (item.type === 'button' && item.containsPoint) {
        item.isHovered = item.containsPoint(mouseX, mouseY, areaX, itemY, this.width);
      }
    }
  }
  
  /**
   * Render the scrollable content area
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  render(x, y) {
    push();
    
    // Render top scroll indicator if needed
    const showTopIndicator = this.scrollIndicator.canScrollUp(this.scrollOffset);
    if (showTopIndicator) {
      this.scrollIndicator.renderTop(x, y, this.width, this.scrollOffset, false);
    }
    
    // Calculate content area position
    const contentY = y + (showTopIndicator ? this.scrollIndicator.height : 0);
    const contentHeight = this.getVisibleHeight();
    
    // Background
    fill(this.backgroundColor);
    noStroke();
    rect(x, contentY, this.width, contentHeight);
    
    // Clip to content area (prevent overflow rendering)
    // Note: p5.js doesn't have built-in clipping, so we track bounds manually
    const clipTop = contentY;
    const clipBottom = contentY + contentHeight;
    
    // Render visible items (viewport culling for performance)
    const visibleItems = this.getVisibleItems();
    for (const { item, y: itemY } of visibleItems) {
      const renderY = contentY + itemY;
      
      // Only render if within clip bounds
      if (renderY + item.height >= clipTop && renderY <= clipBottom) {
        item.render(x, renderY, this.width);
      }
    }
    
    // Render bottom scroll indicator if needed
    const showBottomIndicator = this.scrollIndicator.canScrollDown(this.scrollOffset, this.maxScrollOffset);
    if (showBottomIndicator) {
      const bottomY = contentY + contentHeight;
      this.scrollIndicator.renderBottom(x, bottomY, this.width, this.scrollOffset, this.maxScrollOffset, false);
    }
    
    pop();
  }
  
  /**
   * Get total height including indicators
   * @returns {number} Total height
   */
  getTotalHeight() {
    return this.height;
  }
  
  /**
   * Set dimensions
   * @param {number} width - New width
   * @param {number} height - New height
   */
  setDimensions(width, height) {
    this.width = width;
    this.height = height;
    this.updateScrollBounds();
  }
}

// Export for browser
if (typeof window !== 'undefined') {
  window.ScrollableContentArea = ScrollableContentArea;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScrollableContentArea;
}
