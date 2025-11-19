/**
 * SelectionBoxController
 * =======================
 * Orchestrates selection box MVC components and entity hover detection.
 * 
 * RESPONSIBILITIES:
 * - Handle mouse down/drag/up events
 * - Update entities' boxHovered state
 * - Emit selection box events to EventBus
 * - Convert boxHovered entities to selected on mouse up
 * - Coordinate model and view
 * - NO rendering (delegates to view)
 * - NO direct data storage (delegates to model)
 */

class SelectionBoxController {
  /**
   * Create a selection box controller
   * @param {SelectionBoxModel} model - Data model
   * @param {SelectionBoxView} view - Presentation layer
   */
  constructor(model, view) {
    this.model = model;
    this.view = view;

    // Get EventManager instance for pub/sub
    this._eventBus = typeof EventManager !== 'undefined' ? EventManager.getInstance() : null;

    // Track entities under selection box
    this._hoveredEntities = new Set();
  }

  // ===== MOUSE EVENT HANDLERS =====
  /**
   * Handle mouse press (start selection)
   * @param {number} mouseX - Mouse X position (screen coordinates)
   * @param {number} mouseY - Mouse Y position (screen coordinates)
   */
  onMouseDown(mouseX, mouseY) {
    this.model.setStart(mouseX, mouseY);
    this._clearHoveredEntities();
  }

  /**
   * Handle mouse drag (update selection box)
   * @param {number} mouseX - Mouse X position (screen coordinates)
   * @param {number} mouseY - Mouse Y position (screen coordinates)
   */
  onMouseDrag(mouseX, mouseY) {
    if (!this.model.isActive) return;

    this.model.setEnd(mouseX, mouseY);

    // Update entities under box
    this._updateHoveredEntities();

    // Emit bounds update event
    this._emitBoundsUpdate();
  }

  /**
   * Handle mouse release (finalize selection)
   */
  onMouseUp() {
    if (!this.model.isActive) return;

    // Convert boxHovered entities to selected
    if (this.model.isDragging) {
      this._finalizeSelection();
    }

    // Clear box
    this.model.clear();
    this._clearHoveredEntities();

    // Emit selection complete event
    this._emitSelectionComplete();
  }

  // ===== ENTITY HOVER DETECTION =====
  /**
   * Update which entities are under the selection box
   * @private
   */
  _updateHoveredEntities() {
    if (!this.model.shouldRender()) {
      return;
    }

    const worldBounds = this.model.getWorldBounds();

    // Get all entities from EntityManager
    if (typeof window.entityManager === 'undefined' || !window.entityManager) {
      return;
    }

    const ants = window.entityManager.getByType('ant');
    const newHoveredSet = new Set();

    // Check each ant
    ants.forEach(ant => {
      const pos = ant.model.getPosition();
      const size = ant.model.getSize();

      // Check if ant's center is within selection box bounds
      const inBounds = 
        pos.x >= worldBounds.minX &&
        pos.x <= worldBounds.maxX &&
        pos.y >= worldBounds.minY &&
        pos.y <= worldBounds.maxY;

      if (inBounds) {
        newHoveredSet.add(ant);

        // Set boxHovered state
        const selection = ant.controller?.getController('selection');
        if (selection) {
          selection.setBoxHovered(true);
        }
      } else {
        // Clear boxHovered state
        const selection = ant.controller?.getController('selection');
        if (selection && this._hoveredEntities.has(ant)) {
          selection.setBoxHovered(false);
        }
      }
    });

    this._hoveredEntities = newHoveredSet;
  }

  /**
   * Clear boxHovered state from all entities
   * @private
   */
  _clearHoveredEntities() {
    this._hoveredEntities.forEach(ant => {
      const selection = ant.controller?.getController('selection');
      if (selection) {
        selection.setBoxHovered(false);
      }
    });
    this._hoveredEntities.clear();
  }

  /**
   * Finalize selection (convert boxHovered to selected)
   * @private
   */
  _finalizeSelection() {
    // Check if Shift is held for multi-select
    const isMultiSelect = typeof keyIsDown !== 'undefined' && keyIsDown(SHIFT);

    // If not multi-select, deselect all ants first
    if (!isMultiSelect && typeof window.entityManager !== 'undefined') {
      const allAnts = window.entityManager.getByType('ant');
      allAnts.forEach(ant => {
        const selection = ant.controller?.getController('selection');
        if (selection) {
          selection.setSelected(false);
        }
      });
    }

    // Select all boxHovered entities
    this._hoveredEntities.forEach(ant => {
      const selection = ant.controller?.getController('selection');
      if (selection) {
        selection.setBoxHovered(false);
        selection.setSelected(true);
      }
    });
  }

  // ===== EVENT BUS INTEGRATION =====
  /**
   * Emit bounds update event
   * @private
   */
  _emitBoundsUpdate() {
    if (!this._eventBus) return;

    const worldBounds = this.model.getWorldBounds();
    const screenBounds = this.model.getBounds();

    // Create custom event if not defined
    if (typeof EntityEvents !== 'undefined' && EntityEvents.SELECTION_BOX_UPDATE) {
      this._eventBus.emit(EntityEvents.SELECTION_BOX_UPDATE, {
        worldBounds,
        screenBounds,
        entityCount: this._hoveredEntities.size
      });
    }
  }

  /**
   * Emit selection complete event
   * @private
   */
  _emitSelectionComplete() {
    if (!this._eventBus) return;

    const selectedCount = this._hoveredEntities.size;

    if (typeof EntityEvents !== 'undefined' && EntityEvents.SELECTION_BOX_COMPLETE) {
      this._eventBus.emit(EntityEvents.SELECTION_BOX_COMPLETE, {
        selectedCount,
        entities: Array.from(this._hoveredEntities)
      });
    }
  }

  // ===== RENDERING =====
  /**
   * Render selection box (delegates to view)
   */
  render() {
    if (this.view) {
      this.view.render();
    }
  }

  /**
   * Render debug information (delegates to view)
   */
  renderDebug() {
    if (this.view) {
      this.view.renderDebug();
    }
  }

  // ===== COLOR CONFIGURATION =====
  /**
   * Update selection box colors
   * @param {Object} config - Color configuration
   */
  updateColors(config) {
    this.model.updateColors(config);
  }

  /**
   * Get current colors
   * @returns {Object} Color configuration
   */
  getColors() {
    return this.model.getColors();
  }

  // ===== STATE QUERIES =====
  /**
   * Check if selection box is active
   * @returns {boolean} True if user is dragging
   */
  isActive() {
    return this.model.isActive;
  }

  /**
   * Check if selection box should render
   * @returns {boolean} True if box is visible
   */
  shouldRender() {
    return this.model.shouldRender();
  }

  /**
   * Get number of entities under box
   * @returns {number} Entity count
   */
  getHoveredCount() {
    return this._hoveredEntities.size;
  }
}

// ===== EXPORTS =====
if (typeof window !== 'undefined') {
  window.SelectionBoxController = SelectionBoxController;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SelectionBoxController;
}
