/**
 * SelectionController - Handles selection state, highlighting, and visual feedback
 */
class SelectionController {
  constructor(entity) {
    this._entity = entity;
    this._isSelected = false;
    this._isHovered = false;
    this._isBoxHovered = false;
    this._highlightType = "none";
    this._selectionCallbacks = [];
    this._selectable = false;
    this._lastMouseX = -1;
    this._lastMouseY = -1;
    this._lastCameraX = undefined;
    this._lastCameraY = undefined;
  }

  // --- Public API ---

  /**
   * Update selection state and highlighting
   */
  update() {
    // Check if camera has moved
    const cameraX = typeof cameraManager !== 'undefined' ? cameraManager.cameraX : 0;
    const cameraY = typeof cameraManager !== 'undefined' ? cameraManager.cameraY : 0;
    const cameraMoved = (cameraX !== this._lastCameraX || cameraY !== this._lastCameraY);
    
    // Update hover state if mouse moved OR camera moved
    if (mouseX !== undefined && mouseY !== undefined) {
      const mouseMoved = (mouseX !== this._lastMouseX || mouseY !== this._lastMouseY);
      if (mouseMoved || cameraMoved) {
        this.updateHoverState(mouseX, mouseY);
      }
    }
    
    // Store camera position for next frame
    this._lastCameraX = cameraX;
    this._lastCameraY = cameraY;
    
    // Update highlight type based on current states
    this.updateHighlightType();
    
    // Apply highlighting through render controller
    this.applyHighlighting();
  }

  // --- Selection Management ---

  /**
   * Set selection state
   * @param {boolean} selected - Whether entity is selected
   */
  setSelected(selected) {
    const wasSelected = this._isSelected;
    this._isSelected = selected;

    if (wasSelected !== selected) {
      this._onSelectionChange(wasSelected, selected);
    }
  }

  /**
   * Get selection state
   * @returns {boolean} True if selected
   */
  isSelected() {
    // Debug: log when queried

    return this._isSelected;
  }

  get selectable() { return this._selectable; }
  set selectable(value) { this._selectable = value; }

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

  /**
   * Toggle selection state
   * @returns {boolean} New selection state
   */
  toggleSelection() {
    this.setSelected(!this._isSelected);
    return this._isSelected;
  }

  // --- Hover Management ---

  /**
   * Set hover state
   * @param {boolean} hovered - Whether entity is hovered
   */
  setHovered(hovered) {
    // Debug: log when hover state changes
    if (this._isHovered !== hovered && this._entity._debugger && this._entity._debugger.isActive) {
      console.log(`[SelectionController.setHovered] ${this._entity.type || 'Entity'} hover changed: ${this._isHovered} → ${hovered}`);
    }
    this._isHovered = hovered;
  }

  /**
   * Get hover state
   * @returns {boolean} True if hovered
   */
  isHovered() {
    return this._isHovered;
  }

  /**
   * Set box hover state (for selection box)
   * @param {boolean} boxHovered - Whether entity is box hovered
   */
  setBoxHovered(boxHovered) {
    this._isBoxHovered = boxHovered;
  }

  /**
   * Get box hover state
   * @returns {boolean} True if box hovered
   */
  isBoxHovered() {
    return this._isBoxHovered;
  }

  /**
   * Update hover state based on mouse position
   * @param {number} mouseX - Mouse X position (screen coordinates)
   * @param {number} mouseY - Mouse Y position (screen coordinates)
   */
  updateHoverState(mouseX, mouseY) {
    // Only log if mouse has moved
    const mouseMoved = (mouseX !== this._lastMouseX || mouseY !== this._lastMouseY);
    
    // Use transform controller if available, otherwise fallback
    let isOver = false;
    
    if (this._entity._transformController) {
      // TransformController.contains() expects WORLD coordinates, not screen coordinates
      // Convert screen mouse position to world position
      let worldMouseX = mouseX;
      let worldMouseY = mouseY;
      
      if (typeof CoordinateConverter !== 'undefined' && CoordinateConverter.isAvailable()) {
        const worldMouse = CoordinateConverter.screenToWorld(mouseX, mouseY);
        worldMouseX = worldMouse.x;
        worldMouseY = worldMouse.y;
      }
      
      isOver = this._entity._transformController.contains(worldMouseX, worldMouseY);
    } else if (this._entity.isMouseOver) {
      // NOTE: Entity.isMouseOver() uses global mouseX/mouseY and ignores parameters
      // We need to use the collision box directly with converted coordinates
      const pos = this._entity.getPosition(); // World coords
      const size = this._entity.getSize();
      
      // Convert screen mouse position to world position for comparison
      let worldMouseX = mouseX;
      let worldMouseY = mouseY;
      
      if (typeof CoordinateConverter !== 'undefined' && CoordinateConverter.isAvailable()) {
        const worldMouse = CoordinateConverter.screenToWorld(mouseX, mouseY);
        worldMouseX = worldMouse.x;
        worldMouseY = worldMouse.y;
      }
      
      // Use collision box directly with converted coords
      isOver = this._entity._collisionBox && this._entity._collisionBox.contains(worldMouseX, worldMouseY);
    } else {
      // Fallback calculation - convert screen mouse coords to world coords
      const pos = this._entity.getPosition(); // World coords
      const size = this._entity.getSize();
      
      // Convert screen mouse position to world position for comparison
      let worldMouseX = mouseX;
      let worldMouseY = mouseY;
      
      if (typeof CoordinateConverter !== 'undefined' && CoordinateConverter.isAvailable()) {
        const worldMouse = CoordinateConverter.screenToWorld(mouseX, mouseY);
        worldMouseX = worldMouse.x;
        worldMouseY = worldMouse.y;
      }
      
      isOver = (
        worldMouseX >= pos.x &&
        worldMouseX <= pos.x + size.x &&
        worldMouseY >= pos.y &&
        worldMouseY <= pos.y + size.y
      );
    }
    
    this._lastMouseX = mouseX;
    this._lastMouseY = mouseY;
    this.setHovered(isOver);
  }

  // --- Highlighting ---

  /**
   * Update highlight type based on current states
   */
  updateHighlightType() {
    if (this._isSelected) {
      this._highlightType = "selected";
    } else if (this._isHovered) {
      this._highlightType = "hover";
    } else if (this._isBoxHovered) {
      this._highlightType = "boxHover";
    } else if (this._entity.isInCombat && this._entity.isInCombat()) {
      this._highlightType = "combat";
    } else {
      this._highlightType = "none";
    }
  }

  /**
   * Get current highlight type
   * @returns {string} Highlight type
   */
  getHighlightType() {
    return this._highlightType;
  }

  /**
   * Apply highlighting through render controller
   */
  applyHighlighting() {
    if (!this._entity._renderController) return;
    
    switch (this._highlightType) {
      case "selected":
        this._entity._renderController.highlightSelected();
        break;
      case "hover":
        this._entity._renderController.highlightHover();
        break;
      case "boxHover":
        this._entity._renderController.highlightBoxHover();
        break;
      case "combat":
        this._entity._renderController.highlightCombat();
        break;
      case "none":
      default:
        this._entity._renderController.clearHighlight();
        break;
    }
  }

  /**
   * Force highlight update
   */
  updateHighlight() {
    this.updateHighlightType();
    this.applyHighlighting();
  }

  // --- Selection Groups ---

  /**
   * Add to selection group
   * @param {Array} selectionGroup - Array to add this entity to
   */
  addToGroup(selectionGroup) {
    if (!selectionGroup.includes(this._entity)) {
      selectionGroup.push(this._entity);
      this.setSelected(true);
    }
  }

  /**
   * Remove from selection group
   * @param {Array} selectionGroup - Array to remove this entity from
   */
  removeFromGroup(selectionGroup) {
    const index = selectionGroup.indexOf(this._entity);
    if (index !== -1) {
      selectionGroup.splice(index, 1);
      this.setSelected(false);
    }
  }

  // --- Callbacks ---

  /**
   * Add selection change callback
   * @param {Function} callback - Callback function (wasSelected, isSelected)
   */
  addSelectionCallback(callback) {
    this._selectionCallbacks.push(callback);
  }

  /**
   * Remove selection change callback
   * @param {Function} callback - Callback function to remove
   */
  removeSelectionCallback(callback) {
    const index = this._selectionCallbacks.indexOf(callback);
    if (index !== -1) {
      this._selectionCallbacks.splice(index, 1);
    }
  }

  /**
   * Handle selection state changes
   * @param {boolean} wasSelected - Previous selection state
   * @param {boolean} isSelected - New selection state
   */
  _onSelectionChange(wasSelected, isSelected) {
    // Notify callbacks
    this._selectionCallbacks.forEach(callback => {
      try {
        callback(wasSelected, isSelected);
      } catch (error) {
        console.error("Selection callback error:", error);
      }
    });
    
    // Update global selection if available
    if (antManager) {
      if (isSelected) {
        antManager.selectedAnt = this._entity;
      } else if (antManager.selectedAnt === this._entity) {
        antManager.selectedAnt = null;
      }
    }
  }

  // --- Utility Methods ---

  /**
   * Clear all selection states
   */
  clearAllStates() {
    this.setSelected(false);
    this.setHovered(false);
    this.setBoxHovered(false);
  }

  /**
   * Get debug information
   * @returns {Object} Debug information
   */
  getDebugInfo() {
    return {
      isSelected: this._isSelected,
      isHovered: this._isHovered,
      isBoxHovered: this._isBoxHovered,
      highlightType: this._highlightType,
      callbackCount: this._selectionCallbacks.length
    };
  }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SelectionController;
}