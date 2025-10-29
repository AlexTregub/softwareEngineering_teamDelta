/**
 * ScrollIndicator - Reusable scroll indicator component
 * 
 * Displays up/down arrows to indicate scrollable content overflow.
 * This is a pure rendering component (stateless) - it doesn't manage
 * scroll state, only displays indicators based on provided scroll data.
 * 
 * Usage Example:
 * ```javascript
 * const indicator = new ScrollIndicator({
 *   height: 20,
 *   backgroundColor: [60, 60, 60],
 *   arrowColor: [200, 200, 200]
 * });
 * 
 * // In render loop
 * const scrollOffset = 50;
 * const maxScrollOffset = 200;
 * 
 * // Render top indicator (if can scroll up)
 * indicator.renderTop(x, y, width, scrollOffset, isHoveredTop);
 * 
 * // Render bottom indicator (if can scroll down)
 * const bottomY = y + contentHeight;
 * indicator.renderBottom(x, bottomY, width, scrollOffset, maxScrollOffset, isHoveredBottom);
 * 
 * // Calculate content area height (accounting for indicators)
 * const indicatorHeight = indicator.getTotalHeight(scrollOffset, maxScrollOffset);
 * const contentHeight = panelHeight - indicatorHeight;
 * ```
 * 
 * @author Software Engineering Team Delta
 */

class ScrollIndicator {
  /**
   * Create a scroll indicator
   * @param {Object} options - Configuration options
   * @param {number} options.height - Indicator height in pixels (default: 20)
   * @param {Array} options.backgroundColor - Background RGB color (default: [60, 60, 60])
   * @param {Array} options.arrowColor - Arrow RGB color (default: [200, 200, 200])
   * @param {Array} options.hoverColor - Arrow RGB color when hovered (default: [255, 255, 255])
   * @param {number} options.fontSize - Arrow text size (default: 14)
   * @param {boolean} options.fadeEnabled - Enable fade animations (default: true)
   */
  constructor(options = {}) {
    this.height = options.height !== undefined ? options.height : 20;
    this.backgroundColor = options.backgroundColor || [60, 60, 60];
    this.arrowColor = options.arrowColor || [200, 200, 200];
    this.hoverColor = options.hoverColor || [255, 255, 255];
    this.fontSize = options.fontSize !== undefined ? options.fontSize : 14;
    this.fadeEnabled = options.fadeEnabled !== undefined ? options.fadeEnabled : true;
  }
  
  /**
   * Check if can scroll up
   * @param {number} scrollOffset - Current scroll position
   * @returns {boolean} True if can scroll up (scrollOffset > 0)
   */
  canScrollUp(scrollOffset) {
    return scrollOffset > 0;
  }
  
  /**
   * Check if can scroll down
   * @param {number} scrollOffset - Current scroll position
   * @param {number} maxScrollOffset - Maximum scroll value
   * @returns {boolean} True if can scroll down
   */
  canScrollDown(scrollOffset, maxScrollOffset) {
    return scrollOffset < maxScrollOffset && maxScrollOffset > 0;
  }
  
  /**
   * Get total height consumed by indicators
   * Calculates how much vertical space the indicators take up
   * based on current scroll state.
   * 
   * @param {number} scrollOffset - Current scroll position
   * @param {number} maxScrollOffset - Maximum scroll value
   * @returns {number} Total height (0, height, or height*2)
   */
  getTotalHeight(scrollOffset, maxScrollOffset) {
    let totalHeight = 0;
    
    if (this.canScrollUp(scrollOffset)) {
      totalHeight += this.height;
    }
    
    if (this.canScrollDown(scrollOffset, maxScrollOffset)) {
      totalHeight += this.height;
    }
    
    return totalHeight;
  }
  
  /**
   * Render top scroll indicator (up arrow)
   * Only renders if scrollOffset > 0 (can scroll up)
   * 
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width
   * @param {number} scrollOffset - Current scroll position
   * @param {boolean} isHovered - Whether mouse is over indicator
   */
  renderTop(x, y, width, scrollOffset, isHovered = false) {
    // Don't render if can't scroll up
    if (!this.canScrollUp(scrollOffset)) {
      return;
    }
    
    push();
    
    // Background
    fill(this.backgroundColor[0], this.backgroundColor[1], this.backgroundColor[2]);
    noStroke();
    rect(x, y, width, this.height);
    
    // Arrow (use hover color if hovered)
    const arrowColor = isHovered ? this.hoverColor : this.arrowColor;
    fill(arrowColor[0], arrowColor[1], arrowColor[2]);
    textAlign(CENTER, CENTER);
    textSize(this.fontSize);
    text('↑', x + width / 2, y + this.height / 2);
    
    pop();
  }
  
  /**
   * Render bottom scroll indicator (down arrow)
   * Only renders if scrollOffset < maxScrollOffset (can scroll down)
   * 
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width
   * @param {number} scrollOffset - Current scroll position
   * @param {number} maxScrollOffset - Maximum scroll value
   * @param {boolean} isHovered - Whether mouse is over indicator
   */
  renderBottom(x, y, width, scrollOffset, maxScrollOffset, isHovered = false) {
    // Don't render if can't scroll down
    if (!this.canScrollDown(scrollOffset, maxScrollOffset)) {
      return;
    }
    
    push();
    
    // Background
    fill(this.backgroundColor[0], this.backgroundColor[1], this.backgroundColor[2]);
    noStroke();
    rect(x, y, width, this.height);
    
    // Arrow (use hover color if hovered)
    const arrowColor = isHovered ? this.hoverColor : this.arrowColor;
    fill(arrowColor[0], arrowColor[1], arrowColor[2]);
    textAlign(CENTER, CENTER);
    textSize(this.fontSize);
    text('↓', x + width / 2, y + this.height / 2);
    
    pop();
  }
  
  /**
   * Check if point is inside top indicator
   * Used for hit testing (click/hover detection)
   * 
   * @param {number} mouseX - Mouse X coordinate
   * @param {number} mouseY - Mouse Y coordinate
   * @param {number} x - Indicator X position
   * @param {number} y - Indicator Y position
   * @param {number} width - Indicator width
   * @returns {boolean} True if point is inside
   */
  containsPointTop(mouseX, mouseY, x, y, width) {
    return mouseX >= x && mouseX <= x + width &&
           mouseY >= y && mouseY <= y + this.height;
  }
  
  /**
   * Check if point is inside bottom indicator
   * Used for hit testing (click/hover detection)
   * 
   * @param {number} mouseX - Mouse X coordinate
   * @param {number} mouseY - Mouse Y coordinate
   * @param {number} x - Indicator X position
   * @param {number} y - Indicator Y position
   * @param {number} width - Indicator width
   * @returns {boolean} True if point is inside
   */
  containsPointBottom(mouseX, mouseY, x, y, width) {
    return mouseX >= x && mouseX <= x + width &&
           mouseY >= y && mouseY <= y + this.height;
  }
}

// Export for browser
if (typeof window !== 'undefined') {
  window.ScrollIndicator = ScrollIndicator;
}

// Export for Node.js (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScrollIndicator;
}
