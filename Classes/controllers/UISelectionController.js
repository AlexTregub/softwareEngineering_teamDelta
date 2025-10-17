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
      fillAlpha: 50,
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
    this.selectableEntities = entities || [];

    this._isSelecting = false;
    this._selectionStart = null;
    this._selectionEnd = null;
    this._selectedEntities = [];
    
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
      if (this.isEntityUnderMouse(entity, x, y)) {
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
    }
    
    // Update selection if active
    if (this._isSelecting && this._selectionStart) {
      this._selectionEnd = createVector(x + cameraX, y + cameraY);
      var sortedX = [this._selectionStart.x, this._selectionEnd.x].sort(function (a, b) { return a - b; });
      var sortedY = [this._selectionStart.y, this._selectionEnd.y].sort(function (a, b) { return a - b; });
      var x1 = sortedX[0], x2 = sortedX[1], y1 = sortedY[0], y2 = sortedY[1];
      for (var i = 0; i < this._entities.length; i++) {
        this._entities[i].isBoxHovered = this.isEntityInBox(this._entities[i], x1, x2, y1, y2);
      }
      
      // Also update effects renderer if available
      if (this.effectsRenderer) {
        this.effectsRenderer.updateSelectionBox(x, y);
      }
    }
  }

  isEntityInBox (entity, x1, x2, y1, y2) {
    var pos = (entity && typeof entity.getPosition === 'function') ? entity.getPosition() : (entity && entity.sprite && entity.sprite.pos) || { x: (entity && entity.posX) || 0, y: (entity && entity.posY) || 0 };
    var size = (entity && typeof entity.getSize === 'function') ? entity.getSize() : (entity && entity.sprite && entity.sprite.size) || { x: (entity && entity.sizeX) || 0, y: (entity && entity.sizeY) || 0 };
    var cx = pos.x + size.x / 2;
    var cy = pos.y + size.y / 2;
    return (cx >= x1 && cx <= x2 && cy >= y1 && cy <= y2);
  };

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
    
    if (this._isSelecting) {
      // End selection using SelectionBoxController logic
      this._selectedEntities = [];
      var sortedX = [this._selectionStart.x, this._selectionEnd.x].sort(function (a, b) { return a - b; });
      var sortedY = [this._selectionStart.y, this._selectionEnd.y].sort(function (a, b) { return a - b; });
      var x1 = sortedX[0], x2 = sortedX[1], y1 = sortedY[0], y2 = sortedY[1];
      var dragDistance = dist(x1, y1, x2, y2);
      if (dragDistance >= 5) {
        for (var i = 0; i < this._entities.length; i++) {
          var e = this._entities[i];
          e.isSelected = this.isEntityInBox(e, x1, x2, y1, y2);
          e.isBoxHovered = false;
          if (e.isSelected) this._selectedEntities.push(e);
        }
      }
      this._isSelecting = false;
      this._selectionStart = null;
      this._selectionEnd = null;
      
      // Also end effects renderer selection if available
      if (this.effectsRenderer) {
        this.effectsRenderer.endSelectionBox();
      }
      
      // Call end callback
      if (this.callbacks.onSelectionEnd) {
        this.callbacks.onSelectionEnd({x1, y1, x2, y2}, this._selectedEntities);
      }
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
    this._isSelecting = true;
    this._selectionStart = createVector(x + cameraX, y + cameraY);
    this._selectionEnd = this._selectionStart.copy();
    
    if (this.effectsRenderer) {
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
    }
    
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
      // Clear previous selections
      this.selectedEntities = [clickedEntity];
      
      // Activate entity selection if it has selection methods
      if (clickedEntity.isSelected !== undefined) {
        clickedEntity.isSelected = true;
      }
      if (typeof clickedEntity.onSelected === 'function') {
        clickedEntity.onSelected();
      }
    } else {
      this.selectedEntities = [];
    }
  }
  
  /**
   * Get entity under mouse cursor (using SelectionBoxController logic)
   * @param {Object} entity - Entity to check
   * @param {number} mx - Mouse X position
   * @param {number} my - Mouse Y position
   * @returns {boolean} True if entity is under mouse
   * @private
   */
  isEntityUnderMouse(entity, mx, my) {
    if (entity && typeof entity.isMouseOver === 'function') return entity.isMouseOver(mx, my);
    var pos = (entity && typeof entity.getPosition === 'function') ? entity.getPosition() : (entity && entity.sprite && entity.sprite.pos) || { x: (entity && entity.posX) || 0, y: (entity && entity.posY) || 0 };
    var size = (entity && typeof entity.getSize === 'function') ? entity.getSize() : (entity && entity.sprite && entity.sprite.size) || { x: (entity && entity.sizeX) || 0, y: (entity && entity.sizeY) || 0 };
    return (mx >= pos.x && mx <= pos.x + size.x && my >= pos.y && my <= pos.y + size.y);
  }

  /**
   * Get entity under mouse cursor
   * @param {number} x - Mouse X position
   * @param {number} y - Mouse Y position
   * @returns {Object|null} Entity under mouse or null
   * @private
   */
  getEntityUnderMouse(x, y) {
    if (!this.selectableEntities) return null;
    
    for (const entity of this.selectableEntities) {
      if (this.isEntityUnderMouse(entity, x, y)) {
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
   * Get currently selected entities (using internal _selectedEntities)
   * @returns {Array} Array of selected entities
   */
  getSelectedEntities() {
    return Array.isArray(this._selectedEntities) ? this._selectedEntities.slice() : [];
  }
  
  /**
   * Clear current selection
   */
  clearSelection() {
    this.deselectAll();
    if (this.effectsRenderer && this.effectsRenderer.selectionBox && this.effectsRenderer.selectionBox.active) {
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
      selectedEntitiesCount: this._selectedEntities.length,
      selectableEntitiesCount: this.selectableEntities.length,
      config: { ...this.config },
      hasEffectsRenderer: !!this.effectsRenderer,
      hasMouseController: !!this.mouseController
    };
  }

  /**
   * Draw selection box and debug info (transferred from SelectionBoxController)
   */
  draw() {
    // Draw selection box
    if (this._isSelecting && this._selectionStart && this._selectionEnd) {
      push();
      stroke(0, 200, 255);
      noFill();
      rect(this._selectionStart.x, this._selectionStart.y, this._selectionEnd.x - this._selectionStart.x, this._selectionEnd.y - this._selectionStart.y);
      pop();
    }

    // Draw debug info for selected entities
    if (typeof devConsoleEnabled !== 'undefined' && devConsoleEnabled) {
      for (var i = 0; i < this._selectedEntities.length; i++) {
        var entity = this._selectedEntities[i];
        try {
          if (entity && typeof entity.getController === 'function') {
            var rc = entity.getController('render');
            if (rc && typeof rc.renderDebugInfo === 'function') {
              rc.renderDebugInfo();
              continue;
            }
          }

          if (typeof DebugRenderer !== 'undefined' && DebugRenderer && typeof DebugRenderer.renderEntityDebug === 'function') {
            DebugRenderer.renderEntityDebug(entity);
            continue;
          }

          var posX = (entity && (entity.posX || entity.x)) || (entity.getPosition && entity.getPosition().x) || 0;
          var posY = (entity && (entity.posY || entity.y)) || (entity.getPosition && entity.getPosition().y) || 0;
          push();
          fill(0, 0, 0, 150);
          noStroke();
          rect(posX, posY + 20, 120, 60);
          fill(255);
          textSize(8);
          textAlign(LEFT, TOP);
          text('ID: ' + (entity && (entity._antIndex || 'unknown')), posX + 2, posY + 24);
          text('Pos: (' + Math.round(posX) + ', ' + Math.round(posY) + ')', posX + 2, posY + 34);
          pop();
        } catch (err) {
          console.warn('UISelectionController debug render failed for entity', entity, err);
        }
      }
    }
  }
}

// Export for use
if (typeof window !== 'undefined') {
  window.UISelectionController = UISelectionController;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = UISelectionController;
}