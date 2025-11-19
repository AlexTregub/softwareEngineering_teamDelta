/**
 * SelectionController (MVC Sub-Controller)
 * ==========================================
 * Handles selection state and hover detection for MVC entities.
 * 
 * RESPONSIBILITIES:
 * - Detect mouse hover over entity bounds
 * - Manage selection state (selected/deselected)
 * - Update highlight type based on state priority
 * - Coordinate with EntityView for highlight rendering
 * - NO rendering (delegates to view)
 * - NO data storage (delegates to model)
 * 
 * This is a clean, consolidated MVC sub-controller.
 */

class SelectionController {
  /**
   * Create a selection controller
   * @param {Object} entity - Entity interface with model and view
   */
  constructor(entity) {
    this.entity = entity;
    this.model = entity.model;
    this.view = entity.view;
    
    // Get EventManager instance for pub/sub
    this._eventBus = typeof EventManager !== 'undefined' ? EventManager.getInstance() : null;
    
    // Add selection state to model if not present
    if (this.model.selected === undefined) {
      this.model.selected = false;
    }
    if (this.model.hovered === undefined) {
      this.model.hovered = false;
    }
    if (this.model.boxHovered === undefined) {
      this.model.boxHovered = false;
    }
    
    // Internal state
    this._selectable = true;
    this._highlightType = 'none';
    this._lastMouseX = -1;
    this._lastMouseY = -1;
    this._lastCameraX = undefined;
    this._lastCameraY = undefined;
  }

  // ===== UPDATE CYCLE =====
  /**
   * Update selection state and hover detection
   * Called each frame by EntityController
   */
  update() {
    if (!this._selectable) return;
    
    // Check if camera has moved
    const cameraX = typeof cameraManager !== 'undefined' ? cameraManager.cameraX : 0;
    const cameraY = typeof cameraManager !== 'undefined' ? cameraManager.cameraY : 0;
    const cameraMoved = (cameraX !== this._lastCameraX || cameraY !== this._lastCameraY);
    
    // Update hover state if mouse moved OR camera moved
    if (typeof mouseX !== 'undefined' && typeof mouseY !== 'undefined') {
      const mouseMoved = (mouseX !== this._lastMouseX || mouseY !== this._lastMouseY);
      if (mouseMoved || cameraMoved) {
        this.updateHoverState(mouseX, mouseY);
        this._lastMouseX = mouseX;
        this._lastMouseY = mouseY;
      }
    }
    
    // Store camera position for next frame
    this._lastCameraX = cameraX;
    this._lastCameraY = cameraY;
    
    // Update highlight type based on current states
    this._updateHighlightType();
  }

  // ===== HOVER DETECTION =====
  /**
   * Update hover state based on mouse position
   * @param {number} mouseX - Mouse X position (screen coordinates)
   * @param {number} mouseY - Mouse Y position (screen coordinates)
   */
  updateHoverState(mouseX, mouseY) {
    // Get entity position and size in world coordinates
    const pos = this.model.getPosition();
    const size = this.model.getSize();
    
    // Convert mouse screen coordinates to world coordinates
    let isOver = false;
    
    if (typeof g_activeMap !== 'undefined' && g_activeMap && g_activeMap.renderConversion && typeof TILE_SIZE !== 'undefined') {
      // Use terrain system for coordinate conversion
      const mouseTilePos = g_activeMap.renderConversion.convCanvasToPos([mouseX, mouseY]);
      const mouseWorldX = mouseTilePos[0] * TILE_SIZE;
      const mouseWorldY = mouseTilePos[1] * TILE_SIZE;
      
      // Check if mouse is within entity's bounds
      isOver = (
        mouseWorldX >= pos.x &&
        mouseWorldX <= pos.x + size.x &&
        mouseWorldY >= pos.y &&
        mouseWorldY <= pos.y + size.y
      );
    } else if (typeof cameraManager !== 'undefined') {
      // Fallback: Use camera manager for coordinate conversion
      const worldPos = cameraManager.screenToWorld(mouseX, mouseY);
      
      isOver = (
        worldPos.x >= pos.x &&
        worldPos.x <= pos.x + size.x &&
        worldPos.y >= pos.y &&
        worldPos.y <= pos.y + size.y
      );
    }
    
    this.setHovered(isOver);
  }

  /**
   * Check if point is inside entity bounds
   * @param {number} worldX - World X coordinate
   * @param {number} worldY - World Y coordinate
   * @returns {boolean} True if point is inside entity
   */
  containsPoint(worldX, worldY) {
    const pos = this.model.getPosition();
    const size = this.model.getSize();
    
    return (
      worldX >= pos.x &&
      worldX <= pos.x + size.x &&
      worldY >= pos.y &&
      worldY <= pos.y + size.y
    );
  }

  // ===== SELECTION STATE =====
  /**
   * Set selection state
   * @param {boolean} selected - Whether entity is selected
   */
  setSelected(selected) {
    const wasSelected = this.model.selected;
    this.model.selected = selected;
    this._updateHighlightType();
    
    // Emit event if state changed
    if (wasSelected !== selected && this._eventBus) {
      const eventType = selected ? 'ANT_SELECTED' : 'ANT_DESELECTED';
      if (typeof EntityEvents !== 'undefined' && EntityEvents[eventType]) {
        this._eventBus.emit(EntityEvents[eventType], {
          entity: this.entity,
          ant: this.entity,
          position: this.model.getPosition(),
          jobName: this.model.getJobName(),
          selected: selected
        });
      }
    }
  }

  /**
   * Get selection state
   * @returns {boolean} True if selected
   */
  isSelected() {
    return this.model.selected;
  }

  /**
   * Toggle selection state
   * @returns {boolean} New selection state
   */
  toggleSelection() {
    this.setSelected(!this.model.selected);
    return this.model.selected;
  }

  // ===== HOVER STATE =====
  /**
   * Set hover state
   * @param {boolean} hovered - Whether entity is hovered
   */
  setHovered(hovered) {
    this.model.hovered = hovered;
    this._updateHighlightType();
  }

  /**
   * Get hover state
   * @returns {boolean} True if hovered
   */
  isHovered() {
    return this.model.hovered;
  }

  // ===== BOX HOVER STATE =====
  /**
   * Set box hover state (for selection box)
   * @param {boolean} boxHovered - Whether entity is box hovered
   */
  setBoxHovered(boxHovered) {
    this.model.boxHovered = boxHovered;
    this._updateHighlightType();
  }

  /**
   * Get box hover state
   * @returns {boolean} True if box hovered
   */
  isBoxHovered() {
    return this.model.boxHovered;
  }

  // ===== SELECTABLE STATE =====
  /**
   * Set whether entity can be selected
   * @param {boolean} selectable - Whether entity can be selected
   */
  setSelectable(selectable) {
    this._selectable = selectable;
  }

  /**
   * Get whether entity can be selected
   * @returns {boolean} True if entity can be selected
   */
  getSelectable() {
    return this._selectable;
  }

  // ===== HIGHLIGHT COORDINATION =====
  /**
   * Update highlight type based on state priority
   * Priority: selected > hover > boxHover > combat > none
   * @private
   */
  _updateHighlightType() {
    if (this.model.selected) {
      this._highlightType = 'selected';
    } else if (this.model.hovered) {
      this._highlightType = 'hover';
    } else if (this.model.boxHovered) {
      this._highlightType = 'boxHover';
    } else if (this.entity.isInCombat && this.entity.isInCombat()) {
      this._highlightType = 'combat';
    } else {
      this._highlightType = 'none';
    }
  }

  /**
   * Get current highlight type
   * @returns {string} Highlight type (selected, hover, boxHover, combat, none)
   */
  getHighlightType() {
    return this._highlightType;
  }

  /**
   * Apply highlighting through view
   * Called during render phase
   */
  applyHighlighting() {
    if (!this.view) return;
    
    switch (this._highlightType) {
      case 'selected':
        if (typeof this.view.highlightSelected === 'function') {
          this.view.highlightSelected();
        }
        break;
      case 'hover':
        if (typeof this.view.highlightHover === 'function') {
          this.view.highlightHover();
        }
        break;
      case 'boxHover':
        if (typeof this.view.highlightBoxHover === 'function') {
          this.view.highlightBoxHover();
        }
        break;
      case 'combat':
        if (typeof this.view.highlightCombat === 'function') {
          this.view.highlightCombat();
        }
        break;
      case 'none':
      default:
        // No highlight
        break;
    }
  }

  // ===== SELECTION GROUPS =====
  /**
   * Add entity to selection group
   * @param {Array} selectionGroup - Array to add this entity to
   */
  addToGroup(selectionGroup) {
    if (!selectionGroup.includes(this.entity)) {
      selectionGroup.push(this.entity);
      this.setSelected(true);
    }
  }

  /**
   * Remove entity from selection group
   * @param {Array} selectionGroup - Array to remove this entity from
   */
  removeFromGroup(selectionGroup) {
    const index = selectionGroup.indexOf(this.entity);
    if (index !== -1) {
      selectionGroup.splice(index, 1);
      this.setSelected(false);
    }
  }
}

// ===== EXPORTS =====
if (typeof window !== 'undefined') {
  window.SelectionController = SelectionController;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SelectionController;
}
