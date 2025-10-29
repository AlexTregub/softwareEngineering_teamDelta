/**
 * ScrollIndicator Component
 * 
 * Reusable scroll indicator for showing scroll state (top/bottom arrows).
 * Visual feedback for scrollable content overflow.
 * 
 * @class ScrollIndicator
 * @file Classes/ui/ScrollIndicator.js
 * 
 * Usage Example:
 * 
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
 * // Render top indicator
 * indicator.renderTop(x, y, width, scrollOffset, isHoveredTop);
 * 
 * // Render bottom indicator
 * indicator.renderBottom(x, y + contentHeight, width, scrollOffset, maxScrollOffset, isHoveredBottom);
 * 
 * // Calculate content area height (accounting for indicators)
 * const contentHeight = panelHeight - indicator.getTotalHeight(scrollOffset, maxScrollOffset);
 */

class ScrollIndicator {
  /**
   * Create a scroll indicator
   * @param {Object} options - Configuration options
   * @param {number} [options.height=20] - Indicator height in pixels
   * @param {Array<number>} [options.backgroundColor=[60, 60, 60]] - Background RGB
   * @param {Array<number>} [options.arrowColor=[200, 200, 200]] - Arrow RGB (normal)
   * @param {Array<number>} [options.hoverColor=[255, 255, 255]] - Arrow RGB (hovered)
   * @param {number} [options.fontSize=14] - Arrow text size
   * @param {boolean} [options.fadeEnabled=true] - Enable fade animations
   */
  constructor(options = {}) {
    this.height = options.height || 20;
    this.backgroundColor = options.backgroundColor || [60, 60, 60];
    this.arrowColor = options.arrowColor || [200, 200, 200];
    this.hoverColor = options.hoverColor || [255, 255, 255];
    this.fontSize = options.fontSize || 14;
    this.fadeEnabled = options.fadeEnabled !== undefined ? options.fadeEnabled : true;
  }
  
  /**
   * Calculate if can scroll up
   * @param {number} scrollOffset - Current scroll position
   * @returns {boolean} True if can scroll up
   */
  canScrollUp(scrollOffset) {
    return scrollOffset > 0;
  }
  
  /**
   * Calculate if can scroll down
   * @param {number} scrollOffset - Current scroll position
   * @param {number} maxScrollOffset - Maximum scroll value
   * @returns {boolean} True if can scroll down
   */
  canScrollDown(scrollOffset, maxScrollOffset) {
    return scrollOffset < maxScrollOffset && maxScrollOffset > 0;
  }
  
  /**
   * Render top scroll indicator
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width
   * @param {number} scrollOffset - Current scroll position
   * @param {boolean} [isHovered=false] - Whether mouse is over indicator
   */
  renderTop(x, y, width, scrollOffset, isHovered = false) {
    if (!this.canScrollUp(scrollOffset)) return;
    
    push();
    
    // Background
    fill(this.backgroundColor);
    noStroke();
    rect(x, y, width, this.height);
    
    // Arrow
    const arrowColor = isHovered ? this.hoverColor : this.arrowColor;
    fill(arrowColor);
    textAlign(CENTER, CENTER);
    textSize(this.fontSize);
    text('↑', x + width / 2, y + this.height / 2);
    
    pop();
  }
  
  /**
   * Render bottom scroll indicator
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width
   * @param {number} scrollOffset - Current scroll position
   * @param {number} maxScrollOffset - Maximum scroll value
   * @param {boolean} [isHovered=false] - Whether mouse is over indicator
   */
  renderBottom(x, y, width, scrollOffset, maxScrollOffset, isHovered = false) {
    if (!this.canScrollDown(scrollOffset, maxScrollOffset)) return;
    
    push();
    
    // Background
    fill(this.backgroundColor);
    noStroke();
    rect(x, y, width, this.height);
    
    // Arrow
    const arrowColor = isHovered ? this.hoverColor : this.arrowColor;
    fill(arrowColor);
    textAlign(CENTER, CENTER);
    textSize(this.fontSize);
    text('↓', x + width / 2, y + this.height / 2);
    
    pop();
  }
  
  /**
   * Check if point is inside top indicator
   * @param {number} mouseX - Mouse X
   * @param {number} mouseY - Mouse Y
   * @param {number} x - Indicator X
   * @param {number} y - Indicator Y
   * @param {number} width - Indicator width
   * @returns {boolean} True if point is inside
   */
  containsPointTop(mouseX, mouseY, x, y, width) {
    return mouseX >= x && mouseX <= x + width &&
           mouseY >= y && mouseY <= y + this.height;
  }
  
  /**
   * Check if point is inside bottom indicator
   * @param {number} mouseX - Mouse X
   * @param {number} mouseY - Mouse Y
   * @param {number} x - Indicator X
   * @param {number} y - Indicator Y
   * @param {number} width - Indicator width
   * @returns {boolean} True if point is inside
   */
  containsPointBottom(mouseX, mouseY, x, y, width) {
    return mouseX >= x && mouseX <= x + width &&
           mouseY >= y && mouseY <= y + this.height;
  }
  
  /**
   * Get total height consumed by indicators
   * @param {number} scrollOffset - Current scroll position
   * @param {number} maxScrollOffset - Maximum scroll value
   * @returns {number} Total height (0, 20, or 40px)
   */
  getTotalHeight(scrollOffset, maxScrollOffset) {
    let height = 0;
    if (this.canScrollUp(scrollOffset)) height += this.height;
    if (this.canScrollDown(scrollOffset, maxScrollOffset)) height += this.height;
    return height;
  }
}

// Export for browser
if (typeof window !== 'undefined') {
  window.ScrollIndicator = ScrollIndicator;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScrollIndicator;
}
