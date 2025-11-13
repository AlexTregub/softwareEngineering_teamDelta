/**
 * MaterialPreviewTooltip - Hover tooltip showing larger material preview
 * 
 * Displays tooltip with larger material preview and metadata on hover.
 * Auto-repositions if extending beyond screen bounds.
 * 
 * Usage:
 * const tooltip = new MaterialPreviewTooltip();
 * tooltip.show('moss', mouseX, mouseY);
 * tooltip.render();
 * tooltip.hide();
 * 
 * @class MaterialPreviewTooltip
 */
class MaterialPreviewTooltip {
  /**
   * Initialize tooltip (hidden by default)
   */
  constructor() {
    this.visible = false;
    this.material = null;
    this.x = 0;
    this.y = 0;
    
    // Layout constants
    this.width = 120;
    this.height = 100;
    this.previewSize = 60;
    this.padding = 10;
    this.offset = 15; // Offset from cursor
  }
  
  /**
   * Show tooltip at position
   * @param {string} material - Material name
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  show(material, x, y) {
    this.visible = true;
    this.material = material;
    this.x = x;
    this.y = y;
  }
  
  /**
   * Hide tooltip
   */
  hide() {
    this.visible = false;
  }
  
  /**
   * Check if tooltip is visible
   * @returns {boolean}
   */
  isVisible() {
    return this.visible;
  }
  
  /**
   * Render the tooltip
   */
  render() {
    if (!this.visible) {
      return;
    }
    
    push();
    
    // Calculate position with auto-repositioning
    let tooltipX = this.x + this.offset;
    let tooltipY = this.y + this.offset;
    
    // Get canvas dimensions (with fallback)
    const canvasWidth = (typeof width !== 'undefined') ? width : 800;
    const canvasHeight = (typeof height !== 'undefined') ? height : 600;
    
    // Reposition if extending beyond right edge
    if (tooltipX + this.width > canvasWidth) {
      tooltipX = this.x - this.width - this.offset;
    }
    
    // Reposition if extending beyond bottom edge
    if (tooltipY + this.height > canvasHeight) {
      tooltipY = this.y - this.height - this.offset;
    }
    
    // Ensure tooltip stays within bounds (left/top)
    tooltipX = Math.max(this.padding, tooltipX);
    tooltipY = Math.max(this.padding, tooltipY);
    
    // Draw tooltip background
    fill(30, 30, 30, 230); // Semi-transparent dark background
    stroke(100);
    strokeWeight(1);
    rect(tooltipX, tooltipY, this.width, this.height);
    
    // Draw material name
    fill(255);
    noStroke();
    textAlign(LEFT, TOP);
    textSize(12);
    text(this.material || 'Unknown', tooltipX + this.padding, tooltipY + this.padding);
    
    // Draw material preview (larger swatch)
    const previewX = tooltipX + (this.width - this.previewSize) / 2;
    const previewY = tooltipY + this.height - this.previewSize - this.padding;
    
    this._renderMaterialPreview(previewX, previewY);
    
    pop();
  }
  
  /**
   * Render material preview swatch
   * @private
   */
  _renderMaterialPreview(x, y) {
    // Draw swatch border
    stroke(80);
    strokeWeight(1);
    fill(40);
    rect(x, y, this.previewSize, this.previewSize);
    
    // Try to render material texture if available
    if (typeof TERRAIN_MATERIALS_RANGED !== 'undefined' && 
        this.material && 
        TERRAIN_MATERIALS_RANGED[this.material]) {
      const renderFunc = TERRAIN_MATERIALS_RANGED[this.material][1];
      if (typeof renderFunc === 'function') {
        push();
        try {
          renderFunc(x, y, this.previewSize);
        } catch (e) {
          // Fallback to colored rectangle
          this._renderFallbackSwatch(x, y);
        }
        pop();
      } else {
        this._renderFallbackSwatch(x, y);
      }
    } else {
      // Material not found - render fallback
      this._renderFallbackSwatch(x, y);
    }
  }
  
  /**
   * Render fallback colored rectangle
   * @private
   */
  _renderFallbackSwatch(x, y) {
    noStroke();
    fill(100, 100, 100);
    rect(x + 2, y + 2, this.previewSize - 4, this.previewSize - 4);
  }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MaterialPreviewTooltip;
}

// Export for browser
if (typeof window !== 'undefined') {
  window.MaterialPreviewTooltip = MaterialPreviewTooltip;
}
