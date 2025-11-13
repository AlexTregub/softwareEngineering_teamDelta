/**
 * MaterialCategory - Expandable/collapsible category of terrain materials
 * 
 * Represents a single category (e.g., Ground, Stone, Vegetation) with expandable/collapsible behavior.
 * Renders header with category name and expand/collapse indicator (▶ collapsed, ▼ expanded).
 * Renders materials grid when expanded.
 * 
 * Usage:
 * const category = new MaterialCategory('ground', 'Ground', ['dirt', 'sand']);
 * category.expand();
 * category.render(10, 10, 200);
 * 
 * @class MaterialCategory
 */
class MaterialCategory {
  /**
   * @param {string} id - Unique category identifier
   * @param {string} name - Display name
   * @param {Array<string>} materials - Array of material names
   * @param {Object} options - Configuration options
   * @param {boolean} options.defaultExpanded - Initial expanded state
   * @param {Function} options.onToggle - Callback when state changes
   * @param {string} options.icon - Optional icon/emoji for category
   */
  constructor(id, name, materials, options = {}) {
    this.id = id;
    this.name = name;
    this.materials = materials || [];
    this.expanded = options.defaultExpanded || false;
    this.onToggle = options.onToggle || null;
    this.icon = options.icon || '';
    
    // Layout constants
    this.headerHeight = 40;
    this.swatchSize = 40;
    this.swatchSpacing = 5;
    this.columns = 2;
  }
  
  /**
   * Expand the category to show materials
   */
  expand() {
    this.expanded = true;
  }
  
  /**
   * Collapse the category to hide materials
   */
  collapse() {
    this.expanded = false;
  }
  
  /**
   * Toggle between expanded and collapsed states
   */
  toggle() {
    this.expanded = !this.expanded;
    
    if (this.onToggle) {
      this.onToggle(this.id, this.expanded);
    }
  }
  
  /**
   * Check if category is expanded
   * @returns {boolean}
   */
  isExpanded() {
    return this.expanded;
  }
  
  /**
   * Get materials in this category
   * @returns {Array<string>}
   */
  getMaterials() {
    return this.materials;
  }
  
  /**
   * Calculate total height of category (header + materials grid if expanded)
   * @returns {number} Height in pixels
   */
  getHeight() {
    if (!this.expanded || this.materials.length === 0) {
      return this.headerHeight;
    }
    
    const rows = Math.ceil(this.materials.length / this.columns);
    const gridHeight = rows * (this.swatchSize + this.swatchSpacing) + this.swatchSpacing;
    
    return this.headerHeight + gridHeight;
  }
  
  /**
   * Render the category
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Available width
   */
  render(x, y, width) {
    push();
    imageMode(CORNER)
    // Draw header background
    fill(60);
    noStroke();
    rect(x, y, width, this.headerHeight);
    
    // Draw expand/collapse indicator
    fill(255);
    textAlign(LEFT, CENTER);
    textSize(16);
    const indicator = this.expanded ? '▼' : '▶';
    text(indicator, x + 10, y + this.headerHeight / 2);
    
    // Draw category name
    text(this.name, x + 30, y + this.headerHeight / 2);
    
    // Draw materials grid if expanded
    if (this.expanded && this.materials.length > 0) {
      this._renderMaterialsGrid(x, y + this.headerHeight, width);
    }
    
    pop();
  }
  
  /**
   * Render materials grid (internal)
   * @private
   */
  _renderMaterialsGrid(x, y, width) {
    let currentX = x + this.swatchSpacing;
    let currentY = y + this.swatchSpacing;
    let column = 0;
    
    for (let i = 0; i < this.materials.length; i++) {
      const material = this.materials[i];
      
      // Draw material swatch
      this._renderMaterialSwatch(material, currentX, currentY);
      
      column++;
      
      if (column >= this.columns) {
        // Move to next row
        column = 0;
        currentX = x + this.swatchSpacing;
        currentY += this.swatchSize + this.swatchSpacing;
      } else {
        // Move to next column
        currentX += this.swatchSize + this.swatchSpacing;
      }
    }
  }
  
  /**
   * Render a single material swatch
   * @private
   */
  _renderMaterialSwatch(material, x, y) {
    // Draw swatch background
    stroke(80);
    strokeWeight(1);
    fill(40);
    rect(x, y, this.swatchSize, this.swatchSize);
    
    // Try to render material texture if available
    if (typeof TERRAIN_MATERIALS_RANGED !== 'undefined' && TERRAIN_MATERIALS_RANGED[material]) {
      const renderFunc = TERRAIN_MATERIALS_RANGED[material][1];
      if (typeof renderFunc === 'function') {
        push();
        try {
          renderFunc(x, y, this.swatchSize);
        } catch (e) {
          // Fallback to colored rectangle
          noStroke();
          fill(100, 100, 100);
          rect(x + 2, y + 2, this.swatchSize - 4, this.swatchSize - 4);
        }
        pop();
      }
    } else {
      // Fallback: draw colored rectangle
      noStroke();
      fill(100, 100, 100);
      rect(x + 2, y + 2, this.swatchSize - 4, this.swatchSize - 4);
    }
  }
  
  /**
   * Handle click events
   * @param {number} mouseX - Mouse X coordinate
   * @param {number} mouseY - Mouse Y coordinate
   * @param {number} categoryX - Category X position
   * @param {number} categoryY - Category Y position
   * @returns {string|null} Clicked material name or null
   */
  handleClick(mouseX, mouseY, categoryX, categoryY) {
    const relX = mouseX - categoryX;
    const relY = mouseY - categoryY;
    
    // Check if click is within category bounds
    const categoryHeight = this.getHeight();
    if (relX < 0 || relY < 0 || relY > categoryHeight) {
      return null;
    }
    
    // Check if click is on header
    if (relY < this.headerHeight) {
      this.toggle();
      return null;
    }
    
    // If not expanded, ignore clicks below header
    if (!this.expanded) {
      return null;
    }
    
    // Check if click is on a material swatch
    const gridRelY = relY - this.headerHeight - this.swatchSpacing;
    const gridRelX = relX - this.swatchSpacing;
    
    if (gridRelY < 0 || gridRelX < 0) {
      return null;
    }
    
    // Calculate which swatch was clicked
    const column = Math.floor(gridRelX / (this.swatchSize + this.swatchSpacing));
    const row = Math.floor(gridRelY / (this.swatchSize + this.swatchSpacing));
    
    if (column >= this.columns || column < 0) {
      return null;
    }
    
    const index = row * this.columns + column;
    
    if (index >= 0 && index < this.materials.length) {
      return this.materials[index];
    }
    
    return null;
  }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MaterialCategory;
}

// Export for browser
if (typeof window !== 'undefined') {
  window.MaterialCategory = MaterialCategory;
}
