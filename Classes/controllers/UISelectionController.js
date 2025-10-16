/**
 * UISelectionController - Manages click-and-drag selection box functionality
 * Integrates with EffectsLayerRenderer for rendering to UI effects layer
 */
class UISelectionController {
  constructor(effectsRenderer, g_mouseController, entities) {
    this.effectsRenderer = effectsRenderer;
    this.mouseController = g_mouseController;
    
    // Selection state
    this.isSelecting = false;
    this.dragStartPos = null;
    this.dragThreshold = 5; // Minimum pixels to consider as drag vs click
    
    // Configuration
    this.config = {
      enableSelection: true,
      selectionColor: [0, 200, 255], // Cyan
      strokeWidth: 2,
      fillAlpha: 125,
      minSelectionSize: 10, // Minimum selection box size
      fillInside: true
    };
    
    // Callbacks
    this.callbacks = {
      onSelectionStart: null,
      onSelectionUpdate: null,
      onSelectionEnd: null,
      onSingleClick: null
    };
    
    this._entities = entities || [];

    this._isSelecting = false;
    this._selectionStart = null;
    this._selectionEnd = null;
    this._selectedEntities = [];7
    
    this.setupMouseHandlers();
  }
  
  /**
   * Set up mouse event handlers
   * @private
   */
  setupMouseHandlers() {
    if (!this.mouseController) return;
    
    // Handle mouse press - start potential selection
    this.mouseController.onClick((x, y, button) => {
      this.handleMousePressed(x, y, button);
    });
    
    // Handle mouse drag - update selection box
    this.mouseController.onDrag((x, y, dx, dy) => {
      this.handleMouseDrag(x, y, dx, dy);
    });
    
    // Handle mouse release - end selection
    this.mouseController.onRelease((x, y, button) => {
      this.handleMouseReleased(x, y, button);
    });
  }
  
  /**
   * Handle mouse pressed event
   * @param {number} x - Mouse X position
   * @param {number} y - Mouse Y position  
   * @param {number|string} button - Mouse button
   */
  handleMousePressed(x, y, button) {
    if (!this.config.enableSelection) return;
    
    this.dragStartPos = { x, y };
    this.isSelecting = false; // Don't start selection until drag threshold met
    
    if (button === 'right') {
      this.deselectAll();
      return;
    }

    var clicked = false;
    for (var i = 0; i < this._entities.length; i++) {
      var entity = this._entities[i];
      if (SelectionBoxController.isEntityUnderMouse(entity, x, y)) {
        this.deselectAll();
        entity.isSelected = true;
        this._selectedEntities = [entity];
        clicked = true;
        break;
      }
    }

    if (!clicked) {
      if (this._selectedEntities && this._selectedEntities.length > 0) {
        if (typeof moveSelectedEntitiesToTile === 'function') moveSelectedEntitiesToTile(x, y, typeof TILE_SIZE !== 'undefined' ? TILE_SIZE : 16);
      }
      this.deselectAll();
      this._isSelecting = true;
      this._selectionStart = createVector(x + cameraX, y + cameraY);
      this._selectionEnd = this._selectionStart.copy();
    }
  }
  
  /**
   * Handle mouse drag event
   * @param {number} x - Current mouse X position
   * @param {number} y - Current mouse Y position
   * @param {number} dx - Change in X position
   * @param {number} dy - Change in Y position
   */
  handleMouseDrag(x, y, dx, dy) {
    if (!this.config.enableSelection || !this.dragStartPos) return;
    
    const dragDistance = Math.sqrt(
      Math.pow(x - this.dragStartPos.x, 2) + 
      Math.pow(y - this.dragStartPos.y, 2)
    );
    
    // Start selection if drag threshold exceeded
    if (!this.isSelecting && dragDistance >= this.dragThreshold) {
      this.startSelection(this.dragStartPos.x, this.dragStartPos.y);
      this._selectionEnd = createVector(x + cameraX, y + cameraY);
      var sortedX = [this._selectionStart.x, this._selectionEnd.x].sort(function (a, b) { return a - b; });
      var sortedY = [this._selectionStart.y, this._selectionEnd.y].sort(function (a, b) { return a - b; });
      var x1 = sortedX[0], x2 = sortedX[1], y1 = sortedY[0], y2 = sortedY[1];
      for (var i = 0; i < this._entities.length; i++) {
        this._entities[i].isBoxHovered = SelectionBoxController.isEntityInBox(this._entities[i], x1, x2, y1, y2);
      }
    }
    
    // Update selection if active
    if (this.isSelecting) {
      this.updateSelection(x, y);
    }
  }

  deselectAll() {
    for (var i = 0; i < this._selectedEntities.length; i++) {
      var e = this._selectedEntities[i];
      e.isSelected = false;
      if (typeof e.isBoxHovered !== 'undefined') e.isBoxHovered = false;
    }
    this._selectedEntities = [];
    if (this._entities && Array.isArray(this._entities)) {
      for (var j = 0; j < this._entities.length; j++) {
        if (typeof this._entities[j].isBoxHovered !== 'undefined') this._entities[j].isBoxHovered = false;
      }
    }
  };
  
  /**
   * Handle mouse released event
   * @param {number} x - Mouse X position
   * @param {number} y - Mouse Y position
   * @param {number|string} button - Mouse button
   */
  handleMouseReleased(x, y, button) {
    if (!this.config.enableSelection) return;
    
    if (this.isSelecting) {
      // End selection
      this.endSelection(x, y);
    } else if (this.dragStartPos) {
      // Handle single click (no drag occurred)
      this.handleSingleClick(x, y, button);
    }
    
    this.dragStartPos = null;
    this.isSelecting = false;
  }
  
  /**
   * Start selection box
   * @param {number} x - Start X position
   * @param {number} y - Start Y position
   * @private
   */
  startSelection(x, y) {
    this.isSelecting = true;
    
    if (!this.effectsRenderer) return;
    
    // Configure effects renderer selection box
    this.effectsRenderer.setSelectionEntities(this.selectableEntities);
    
    // Start selection box in effects renderer
    this.effectsRenderer.startSelectionBox(x, y, {
      color: this.config.selectionColor,
      strokeWidth: this.config.strokeWidth,
      fillAlpha: this.config.fillAlpha,
      onStart: this.callbacks.onSelectionStart,
      onUpdate: this.callbacks.onSelectionUpdate,
      onEnd: null // We'll handle this manually
    });
    
    // Call start callback
    if (this.callbacks.onSelectionStart) {
      this.callbacks.onSelectionStart(x, y, []);
    }
  }
  
  /**
   * Update selection box
   * @param {number} x - Current X position
   * @param {number} y - Current Y position
   * @private
   */
  updateSelection(x, y) {
    if (!this.effectsRenderer) return;
    
    // Update selection box in effects renderer
    this.effectsRenderer.updateSelectionBox(x, y);
    
    // Get current selection bounds and entities
    const bounds = this.effectsRenderer.getSelectionBoxBounds();
    const entitiesInBox = this.effectsRenderer.selectionBox.entities || [];
    
    // Call update callback
    if (this.callbacks.onSelectionUpdate) {
      this.callbacks.onSelectionUpdate(bounds, entitiesInBox);
    }
  }
  
  /**
   * End selection box
   * @param {number} x - End X position
   * @param {number} y - End Y position
   * @private
   */
  endSelection(x, y) {
    if (!this.effectsRenderer) return;
    
    // Get final selection results
    const selectedEntities = this.effectsRenderer.endSelectionBox();
    const bounds = this.effectsRenderer.getSelectionBoxBounds();
    
    // Update internal selected entities
    this.selectedEntities = [...selectedEntities];
    
    // Call end callback
    if (this.callbacks.onSelectionEnd) {
      this.callbacks.onSelectionEnd(bounds, this.selectedEntities);
    }
  }
  
  /**
   * Handle single click (no drag)
   * @param {number} x - Click X position
   * @param {number} y - Click Y position
   * @param {number|string} button - Mouse button
   * @private
   */
  handleSingleClick(x, y, button) {
    // Check if any entity was clicked
    const clickedEntity = this.getEntityUnderMouse(x, y);
    
    if (this.callbacks.onSingleClick) {
      this.callbacks.onSingleClick(x, y, button, clickedEntity);
    }
    
    // Default single click behavior: select/deselect single entity
    if (clickedEntity) {
      this.selectedEntities = [clickedEntity];
    } else {
      this.selectedEntities = [];
    }
  }
  
  /**
   * Get entity under mouse cursor
   * @param {number} x - Mouse X position
   * @param {number} y - Mouse Y position
   * @returns {Object|null} Entity under mouse or null
   * @private
   */
  getEntityUnderMouse(x, y) {
    for (const entity of this.selectableEntities) {
      if (this.isPointInEntity(x, y, entity)) {
        return entity;
      }
    }
    return null;
  }
  
  /**
   * Check if a point is within an entity's bounds
   * @param {number} x - Point X position
   * @param {number} y - Point Y position
   * @param {Object} entity - Entity to check
   * @returns {boolean} True if point is within entity
   * @private
   */
  isPointInEntity(x, y, entity) {
    // Use entity's isMouseOver method if available
    if (entity && typeof entity.isMouseOver === 'function') {
      return entity.isMouseOver(x, y);
    }
    
    // Fallback to position/size calculation
    const pos = (entity && typeof entity.getPosition === 'function') ? entity.getPosition() : 
                { x: entity?.posX || entity?.x || 0, y: entity?.posY || entity?.y || 0 };
                
    const size = (entity && typeof entity.getSize === 'function') ? entity.getSize() : 
                 { x: entity?.sizeX || entity?.width || 20, y: entity?.sizeY || entity?.height || 20 };
    
    return (x >= pos.x && x <= pos.x + size.x && 
            y >= pos.y && y <= pos.y + size.y);
  }
  
  // --- PUBLIC API ---
  
  /**
   * Set the entities that can be selected
   * @param {Array} entities - Array of selectable entities
   */
  setSelectableEntities(entities) {
    this.selectableEntities = entities || [];
    return this;
  }
  
  /**
   * Get currently selected entities
   * @returns {Array} Array of selected entities
   */
  getSelectedEntities() {
    return [...this.selectedEntities];
  }
  
  /**
   * Clear current selection
   */
  clearSelection() {
    this.selectedEntities = [];
    if (this.effectsRenderer && this.effectsRenderer.selectionBox.active) {
      this.effectsRenderer.cancelSelectionBox();
    }
    return this;
  }
  
  /**
   * Set selection callbacks
   * @param {Object} callbacks - Object with callback functions
   */
  setCallbacks(callbacks) {
    Object.assign(this.callbacks, callbacks);
    return this;
  }
  
  /**
   * Update configuration
   * @param {Object} config - Configuration options
   */
  updateConfig(config) {
    Object.assign(this.config, config);
    return this;
  }
  
  /**
   * Enable/disable selection functionality
   * @param {boolean} enabled - Whether selection is enabled
   */
  setEnabled(enabled) {
    this.config.enableSelection = enabled;
    return this;
  }
  
  /**
   * Check if selection is currently active
   * @returns {boolean} True if selection box is active
   */
  isSelectionActive() {
    return this.isSelecting;
  }
  
  /**
   * Get current selection bounds (if selection is active)
   * @returns {Object|null} Selection bounds or null
   */
  getSelectionBounds() {
    if (!this.effectsRenderer || !this.isSelecting) return null;
    return this.effectsRenderer.getSelectionBoxBounds();
  }
  
  /**
   * Get debug information
   * @returns {Object} Debug information
   */
  getDebugInfo() {
    return {
      isSelecting: this.isSelecting,
      selectedEntitiesCount: this.selectedEntities.length,
      selectableEntitiesCount: this.selectableEntities.length,
      config: { ...this.config },
      hasEffectsRenderer: !!this.effectsRenderer,
      hasMouseController: !!this.mouseController
    };
  }
}

// Export for use
if (typeof window !== 'undefined') {
  window.UISelectionController = UISelectionController;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = UISelectionController;
}