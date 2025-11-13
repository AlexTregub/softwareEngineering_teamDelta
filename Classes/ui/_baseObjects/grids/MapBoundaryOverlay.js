/**
 * MapBoundaryOverlay - Visualizes map boundaries in Level Editor
 * 
 * Renders a rectangular outline showing the maximum map dimensions.
 * Helps users understand the playable area and avoid painting outside bounds.
 * 
 * Usage:
 *   const overlay = new MapBoundaryOverlay(terrain);
 *   overlay.render(); // In draw loop
 *   overlay.toggle(); // Show/hide
 */
class MapBoundaryOverlay {
  /**
   * Create a map boundary overlay
   * @param {Object} terrain - Terrain instance with MAX_MAP_SIZE or _gridSizeX/_gridSizeY
   */
  constructor(terrain) {
    this.terrain = terrain;
    this.visible = true; // Start visible by default
    
    this._calculateBounds();
  }
  
  /**
   * Calculate world-space bounds from terrain
   * @private
   */
  _calculateBounds() {
    if (!this.terrain) {
      this.worldWidth = 0;
      this.worldHeight = 0;
      return;
    }
    
    const tileSize = this.terrain.tileSize || this.terrain._tileSize || 32;
    
    // Use _gridSizeX/_gridSizeY if available (more accurate), otherwise MAX_MAP_SIZE
    const gridX = this.terrain._gridSizeX || this.terrain.MAX_MAP_SIZE || 100;
    const gridY = this.terrain._gridSizeY || this.terrain.MAX_MAP_SIZE || 100;
    
    this.worldWidth = gridX * tileSize;
    this.worldHeight = gridY * tileSize;
  }
  
  /**
   * Set visibility
   * @param {boolean} visible - Visibility state
   */
  setVisible(visible) {
    this.visible = visible;
  }
  
  /**
   * Toggle visibility
   */
  toggle() {
    this.visible = !this.visible;
  }
  
  /**
   * Update terrain reference and recalculate bounds
   * @param {Object} terrain - New terrain instance
   */
  updateTerrain(terrain) {
    this.terrain = terrain;
    this._calculateBounds();
  }
  
  /**
   * Render the boundary overlay
   * Should be called in draw loop, after camera transforms applied
   */
  render() {
    if (!this.visible) return;
    if (!this.terrain) return;
    
    push();
    
    // Semi-transparent yellow stroke
    stroke(255, 255, 0, 150); // Yellow with 150/255 alpha
    strokeWeight(3);
    noFill();
    
    // Draw boundary rectangle at world origin
    rect(0, 0, this.worldWidth, this.worldHeight);
    
    // Draw dimension label at bottom-center
    fill(255, 255, 0, 200); // Yellow text, slightly more opaque
    textAlign(CENTER, BOTTOM);
    textSize(16);
    
    const gridX = this.terrain._gridSizeX || this.terrain.MAX_MAP_SIZE || 100;
    const gridY = this.terrain._gridSizeY || this.terrain.MAX_MAP_SIZE || 100;
    const label = `Map Boundary: ${gridX}x${gridY} tiles`;
    
    text(label, this.worldWidth / 2, this.worldHeight + 30);
    
    pop();
  }
}

// Export for Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MapBoundaryOverlay;
}

// Export for browser (global)
if (typeof window !== 'undefined') {
  window.MapBoundaryOverlay = MapBoundaryOverlay;
}
