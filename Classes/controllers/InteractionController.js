/**
 * InteractionController - Handles mouse interactions, click detection, and input events
 */
class InteractionController {
  constructor(entity) {
    this._entity = entity;
    this._isMouseOver = false;
    this._lastMousePosition = { x: -1, y: -1 };
    this._clickCallbacks = [];
    this._hoverCallbacks = [];
    this._interactionEnabled = true;
    this._clickThreshold = 5; // pixels - max distance for click vs drag
    this._lastClickTime = 0;
    this._doubleClickThreshold = 300; // ms
  }

  // --- Public API ---

  /**
   * Update interaction state
   * @param {number} mouseX - Current mouse X position
   * @param {number} mouseY - Current mouse Y position
   */
  update(mouseX, mouseY) {
    if (!this._interactionEnabled) return;
    
    // Update mouse over state
    const wasMouseOver = this._isMouseOver;
    this._isMouseOver = this._checkMouseOver(mouseX, mouseY);
    
    // Handle hover state changes
    if (wasMouseOver !== this._isMouseOver) {
      this._onHoverChange(wasMouseOver, this._isMouseOver);
    }
    
    // Update last mouse position
    this._lastMousePosition.x = mouseX;
    this._lastMousePosition.y = mouseY;
  }

  // --- Mouse Over Detection ---

  /**
   * Check if mouse is over entity
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   * @returns {boolean} True if mouse is over entity
   */
  _checkMouseOver(mouseX, mouseY) {
    // Use transform controller if available
    if (this._entity._transformController) {
      return this._entity._transformController.contains(mouseX, mouseY);
    }
    
    // Use entity's isMouseOver method if available
    if (this._entity.isMouseOver) {
      return this._entity.isMouseOver(mouseX, mouseY);
    }
    
    // Fallback to basic bounds checking
    return this._basicBoundsCheck(mouseX, mouseY);
  }

  /**
   * Basic bounds checking fallback
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   * @returns {boolean} True if within bounds
   */
  _basicBoundsCheck(mouseX, mouseY) {
    const pos = this._getEntityPosition();
    const size = this._getEntitySize();
    
    return (
      mouseX >= pos.x &&
      mouseX <= pos.x + size.x &&
      mouseY >= pos.y &&
      mouseY <= pos.y + size.y
    );
  }

  /**
   * Get if mouse is currently over entity
   * @returns {boolean} True if mouse is over
   */
  isMouseOver() {
    return this._isMouseOver;
  }

  // --- Click Handling ---

  /**
   * Handle mouse press event
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   * @param {string} button - Mouse button ('LEFT', 'RIGHT', 'CENTER')
   * @returns {boolean} True if click was handled by this entity
   */
  handleMousePress(mouseX, mouseY, button = 'LEFT') {
    if (!this._interactionEnabled || !this._isMouseOver) return false;
    
    // Store click start position for drag detection
    this._clickStartPos = { x: mouseX, y: mouseY };
    this._clickButton = button;
    
    return true; // Click was handled
  }

  /**
   * Handle mouse release event
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   * @param {string} button - Mouse button ('LEFT', 'RIGHT', 'CENTER')
   * @returns {boolean} True if click was handled by this entity
   */
  handleMouseRelease(mouseX, mouseY, button = 'LEFT') {
    if (!this._interactionEnabled) return false;
    
    // Check if this was a click (not a drag)
    if (this._clickStartPos && this._clickButton === button) {
      const distance = this._getDistance(
        this._clickStartPos.x, this._clickStartPos.y,
        mouseX, mouseY
      );
      
      if (distance <= this._clickThreshold) {
        this._handleClick(mouseX, mouseY, button);
        return true;
      }
    }
    
    // Clear click tracking
    this._clickStartPos = null;
    this._clickButton = null;
    
    return false;
  }

  /**
   * Handle actual click event
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   * @param {string} button - Mouse button
   */
  _handleClick(mouseX, mouseY, button) {
    const now = Date.now();
    const isDoubleClick = (now - this._lastClickTime) < this._doubleClickThreshold;
    
    // Create click event object
    const clickEvent = {
      x: mouseX,
      y: mouseY,
      button: button,
      isDoubleClick: isDoubleClick,
      entity: this._entity,
      timestamp: now
    };
    
    // Notify callbacks
    this._clickCallbacks.forEach(callback => {
      try {
        callback(clickEvent);
      } catch (error) {
        console.error("Click callback error:", error);
      }
    });
    
    // Default click behavior based on button
    this._handleDefaultClick(clickEvent);
    
    this._lastClickTime = now;
  }

  /**
   * Handle default click behavior
   * @param {Object} clickEvent - Click event object
   */
  _handleDefaultClick(clickEvent) {
    switch (clickEvent.button) {
      case 'LEFT':
        // Left click - selection
        if (this._entity._selectionController) {
          if (clickEvent.isDoubleClick) {
            // Double click - special action
            this._handleDoubleClick(clickEvent);
          } else {
            // Single click - toggle selection
            this._entity._selectionController.toggleSelection();
          }
        }
        break;
        
      case 'RIGHT':
        // Right click - context menu or special action
        this._handleRightClick(clickEvent);
        break;
        
      case 'CENTER':
        // Middle click - debug info
        if (typeof devConsoleEnabled !== 'undefined' && devConsoleEnabled) {
          console.log("Entity debug info:", this._entity.debugState?.());
        }
        break;
    }
  }

  /**
   * Handle double click
   * @param {Object} clickEvent - Click event object
   */
  _handleDoubleClick(clickEvent) {
    // Override in subclasses for custom double-click behavior
    // Default: focus on entity
    if (this._entity._transformController) {
      const center = this._entity._transformController.getCenter();
      // Could trigger camera focus here if camera system exists
    }
  }

  /**
   * Handle right click
   * @param {Object} clickEvent - Click event object
   */
  _handleRightClick(clickEvent) {
    // Override in subclasses for custom right-click behavior
    // Default: deselect
    if (this._entity._selectionController) {
      this._entity._selectionController.setSelected(false);
    }
  }

  // --- Hover Handling ---

  /**
   * Handle hover state changes
   * @param {boolean} wasHovered - Previous hover state
   * @param {boolean} isHovered - New hover state
   */
  _onHoverChange(wasHovered, isHovered) {
    // Update selection controller if available
    if (this._entity._selectionController) {
      this._entity._selectionController.setHovered(isHovered);
    }
    
    // Notify hover callbacks
    this._hoverCallbacks.forEach(callback => {
      try {
        callback(wasHovered, isHovered);
      } catch (error) {
        console.error("Hover callback error:", error);
      }
    });
  }

  // --- Callbacks ---

  /**
   * Add click callback
   * @param {Function} callback - Click callback function
   */
  addClickCallback(callback) {
    this._clickCallbacks.push(callback);
  }

  /**
   * Remove click callback
   * @param {Function} callback - Click callback function
   */
  removeClickCallback(callback) {
    const index = this._clickCallbacks.indexOf(callback);
    if (index !== -1) {
      this._clickCallbacks.splice(index, 1);
    }
  }

  /**
   * Add hover callback
   * @param {Function} callback - Hover callback function
   */
  addHoverCallback(callback) {
    this._hoverCallbacks.push(callback);
  }

  /**
   * Remove hover callback
   * @param {Function} callback - Hover callback function
   */
  removeHoverCallback(callback) {
    const index = this._hoverCallbacks.indexOf(callback);
    if (index !== -1) {
      this._hoverCallbacks.splice(index, 1);
    }
  }

  // --- Configuration ---

  /**
   * Enable or disable interactions
   * @param {boolean} enabled - Whether interactions are enabled
   */
  setInteractionEnabled(enabled) {
    this._interactionEnabled = enabled;
  }

  /**
   * Set click threshold for drag detection
   * @param {number} threshold - Threshold in pixels
   */
  setClickThreshold(threshold) {
    this._clickThreshold = threshold;
  }

  /**
   * Set double click threshold
   * @param {number} threshold - Threshold in milliseconds
   */
  setDoubleClickThreshold(threshold) {
    this._doubleClickThreshold = threshold;
  }

  // --- Utility Methods ---

  /**
   * Get distance between two points
   * @param {number} x1 - First point X
   * @param {number} y1 - First point Y
   * @param {number} x2 - Second point X
   * @param {number} y2 - Second point Y
   * @returns {number} Distance in pixels
   */
  _getDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get entity position (with fallbacks)
   * @returns {Object} Position object
   */
  _getEntityPosition() {
    if (this._entity._transformController) {
      return this._entity._transformController.getPosition();
    } else if (this._entity.getPosition) {
      return this._entity.getPosition();
    } else {
      return this._entity.getPosition();
    }
  }

  /**
   * Get entity size (with fallbacks)
   * @returns {Object} Size object
   */
  _getEntitySize() {
    if (this._entity._transformController) {
      return this._entity._transformController.getSize();
    } else if (this._entity.getSize) {
      return this._entity.getSize();
    } else {
      return this._entity.getSize();
    }
  }

  /**
   * Get debug information
   * @returns {Object} Debug information
   */
  getDebugInfo() {
    return {
      isMouseOver: this._isMouseOver,
      interactionEnabled: this._interactionEnabled,
      lastMousePosition: { ...this._lastMousePosition },
      clickCallbacks: this._clickCallbacks.length,
      hoverCallbacks: this._hoverCallbacks.length,
      clickThreshold: this._clickThreshold,
      doubleClickThreshold: this._doubleClickThreshold
    };
  }
}

// Export for Node.js testing
if (typeof module !== "undefined" && module.exports) {
  module.exports = InteractionController;
}