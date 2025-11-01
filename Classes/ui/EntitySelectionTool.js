/**
 * EntitySelectionTool
 * 
 * Provides mode-based selection/painting for entities and events in Level Editor.
 * 
 * Modes:
 * - PAINT: Paint entity spawn points (default behavior)
 * - ENTITY: Box selection for entity spawn points
 * - EVENT: Box selection for event triggers
 * 
 * Features:
 * - Drag to create selection box (ENTITY/EVENT modes)
 * - Multi-select entities or events within box
 * - Highlight with mode-specific colors
 * - Delete selected items (Delete key)
 * - Get selected items array
 * 
 * @class EntitySelectionTool
 */
class EntitySelectionTool {
  /**
   * Create an entity selection tool
   * @param {Array} placedEntities - Reference to array of placed entities
   * @param {Array} placedEvents - Reference to array of placed events
   * @param {string} initialMode - Initial mode ('PAINT', 'ENTITY', or 'EVENT')
   */
  constructor(placedEntities, placedEvents = [], initialMode = 'PAINT') {
    this.placedEntities = placedEntities;
    this.placedEvents = placedEvents;
    
    // Mode system
    this._mode = initialMode;
    
    // Selection state
    this.isSelecting = false;
    this.selectionStart = null;
    this.selectionEnd = null;
    
    // Selected entities/events
    this.selectedEntities = [];
  }
  
  /**
   * Set the current mode
   * @param {string} mode - Mode to set ('PAINT', 'ENTITY', or 'EVENT')
   */
  setMode(mode) {
    if (mode !== 'PAINT' && mode !== 'ENTITY' && mode !== 'EVENT') {
      console.warn(`Invalid mode: ${mode}. Must be 'PAINT', 'ENTITY', or 'EVENT'.`);
      return;
    }
    
    this._mode = mode;
    
    // Clear selection when switching modes
    this.clearSelection();
  }
  
  /**
   * Get the current mode
   * @returns {string} Current mode ('PAINT', 'ENTITY', or 'EVENT')
   */
  getMode() {
    return this._mode;
  }
  
  /**
   * Get the target array based on current mode
   * @returns {Array} Target array (placedEntities or placedEvents)
   * @private
   */
  _getTargetArray() {
    if (this._mode === 'EVENT') {
      return this.placedEvents;
    }
    return this.placedEntities;
  }
  
  /**
   * Handle mouse pressed - start selection
   * @param {number} x - Mouse X coordinate
   * @param {number} y - Mouse Y coordinate
   */
  handleMousePressed(x, y) {
    // PAINT mode: no selection, let EntityPainter handle
    if (this._mode === 'PAINT') {
      return;
    }
    
    if (this.isSelecting) return; // Prevent nested selections
    
    this.isSelecting = true;
    this.selectionStart = { x, y };
    this.selectionEnd = { x, y };
    
    // Clear previous selection
    this.clearSelection();
  }
  
  /**
   * Handle mouse dragged - update selection bounds
   * @param {number} x - Mouse X coordinate
   * @param {number} y - Mouse Y coordinate
   */
  handleMouseDragged(x, y) {
    // PAINT mode: no selection
    if (this._mode === 'PAINT') {
      return;
    }
    
    if (!this.isSelecting) return;
    
    this.selectionEnd = { x, y };
    
    // Highlight entities/events within selection box
    this.updateHoverState();
  }
  
  /**
   * Handle mouse released - finalize selection
   * @param {number} x - Mouse X coordinate
   * @param {number} y - Mouse Y coordinate
   */
  handleMouseReleased(x, y) {
    if (!this.isSelecting) return;
    
    this.selectionEnd = { x, y };
    this.isSelecting = false;
    
    // Finalize selection
    this.selectEntitiesInBox();
    
    // Clear hover state
    this.clearHoverState();
  }
  
  /**
   * Update hover state for items within selection box
   * @private
   */
  updateHoverState() {
    const bounds = this.getSelectionBounds();
    const targetArray = this._getTargetArray();
    
    targetArray.forEach(item => {
      const inBounds = this.isEntityInBounds(item, bounds);
      item.isBoxHovered = inBounds;
    });
  }
  
  /**
   * Clear hover state for all items
   * @private
   */
  clearHoverState() {
    // Clear both arrays
    this.placedEntities.forEach(entity => {
      entity.isBoxHovered = false;
    });
    this.placedEvents.forEach(event => {
      event.isBoxHovered = false;
    });
  }
  
  /**
   * Select items within selection box
   * @private
   */
  selectEntitiesInBox() {
    const bounds = this.getSelectionBounds();
    const targetArray = this._getTargetArray();
    
    this.selectedEntities = targetArray.filter(item => {
      const inBounds = this.isEntityInBounds(item, bounds);
      if (inBounds) {
        item.isSelected = true;
      }
      return inBounds;
    });
  }
  
  /**
   * Check if entity is within bounds
   * @param {Object} entity - Entity to check
   * @param {Object} bounds - Bounds object {x1, x2, y1, y2}
   * @returns {boolean} True if entity center is within bounds
   * @private
   */
  isEntityInBounds(entity, bounds) {
    const pos = entity.getPosition();
    const size = entity.getSize();
    
    // Use entity center for hit detection
    const centerX = pos.x + size.x / 2;
    const centerY = pos.y + size.y / 2;
    
    return (
      centerX >= bounds.x1 && centerX <= bounds.x2 &&
      centerY >= bounds.y1 && centerY <= bounds.y2
    );
  }
  
  /**
   * Get normalized selection bounds (handles inverted drag)
   * @returns {Object} Bounds object {x1, x2, y1, y2}
   * @private
   */
  getSelectionBounds() {
    if (!this.selectionStart || !this.selectionEnd) {
      return { x1: 0, x2: 0, y1: 0, y2: 0 };
    }
    
    return {
      x1: Math.min(this.selectionStart.x, this.selectionEnd.x),
      x2: Math.max(this.selectionStart.x, this.selectionEnd.x),
      y1: Math.min(this.selectionStart.y, this.selectionEnd.y),
      y2: Math.max(this.selectionStart.y, this.selectionEnd.y)
    };
  }
  
  /**
   * Deselect all items
   */
  deselectAll() {
    // Clear both arrays
    this.placedEntities.forEach(entity => {
      entity.isSelected = false;
    });
    this.placedEvents.forEach(event => {
      event.isSelected = false;
    });
    this.selectedEntities = [];
  }
  
  /**
   * Delete selected items (entities or events based on mode)
   */
  deleteSelectedEntities() {
    if (this.selectedEntities.length === 0) return;
    
    const targetArray = this._getTargetArray();
    
    // Remove selected items from target array using filter
    // This avoids index shifting issues when splicing during iteration
    const selectedSet = new Set(this.selectedEntities);
    
    // Filter out selected items and rebuild array
    const remaining = targetArray.filter(item => !selectedSet.has(item));
    
    // Update array in place to maintain reference
    targetArray.length = 0;
    targetArray.push(...remaining);
    
    // Clear selection
    this.selectedEntities = [];
  }
  
  /**
   * Get currently selected entities
   * @returns {Array} Array of selected entities
   */
  getSelectedEntities() {
    return this.selectedEntities;
  }
  
  /**
   * Clear current selection
   * @private
   */
  clearSelection() {
    // Clear both arrays
    this.placedEntities.forEach(entity => {
      entity.isSelected = false;
    });
    this.placedEvents.forEach(event => {
      event.isSelected = false;
    });
    this.selectedEntities = [];
  }
  
  /**
   * Get colors for current mode
   * @returns {Object} Colors {hover, selection, stroke}
   * @private
   */
  _getModeColors() {
    if (this._mode === 'EVENT') {
      return {
        hover: { r: 255, g: 255, b: 0, a: 100 },    // Yellow hover
        selection: { r: 255, g: 165, b: 0, a: 150 }, // Orange selection
        stroke: { r: 255, g: 200, b: 0 }             // Yellow-orange stroke
      };
    }
    
    // ENTITY mode (default)
    return {
      hover: { r: 0, g: 255, b: 0, a: 100 },       // Green hover
      selection: { r: 0, g: 100, b: 255, a: 150 }, // Blue selection
      stroke: { r: 100, g: 150, b: 255 }           // Blue stroke
    };
  }
  
  /**
   * Render selection box and highlights
   */
  render() {
    // PAINT mode: no rendering
    if (this._mode === 'PAINT') {
      return;
    }
    
    if (!this.isSelecting) return;
    
    const bounds = this.getSelectionBounds();
    const width = bounds.x2 - bounds.x1;
    const height = bounds.y2 - bounds.y1;
    const colors = this._getModeColors();
    
    push();
    
    // Draw selection box
    noFill();
    stroke(colors.stroke.r, colors.stroke.g, colors.stroke.b);
    strokeWeight(2);
    rect(bounds.x1, bounds.y1, width, height);
    
    // Draw semi-transparent fill
    fill(colors.hover.r, colors.hover.g, colors.hover.b, colors.hover.a);
    noStroke();
    rect(bounds.x1, bounds.y1, width, height);
    
    pop();
  }
}

// Export for Node.js (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EntitySelectionTool;
}

// Export for browser (global)
if (typeof window !== 'undefined') {
  window.EntitySelectionTool = EntitySelectionTool;
}
