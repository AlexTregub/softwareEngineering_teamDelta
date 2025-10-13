/**
 * @fileoverview AntManager class for handling ant selection, movement, and interaction logic
 * Provides centralized management of ant selection state and related operations.
 * 
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 */

/**
 * Manages ant selection, movement, and interaction logic.
 * Encapsulates the selected ant state and provides methods for ant operations.
 * 
 * @class AntManager
 * @example
 * const manager = new AntManager();
 * manager.handleAntClick(); // Handle click interactions
 * const selected = manager.getSelectedAnt(); // Get current selection
 */
class AntManager {
  /**
   * Creates a new AntManager instance with no selected ant.
   */
  constructor() {
    this.selectedAnt = null;
  }

  _getCursorWorldPoint() {
    if (typeof getWorldMousePosition === 'function') {
      return getWorldMousePosition();
    }
    return { x: mouseX, y: mouseY };
  }

  _applySelection(antToSelect) {
    if (this.selectedAnt && this.selectedAnt !== antToSelect) {
      this.selectedAnt.isSelected = false;
    }
    if (antToSelect) {
      antToSelect.isSelected = true;
    }
    this.setSelectedAnt(antToSelect);
  }

  /**
   * Handles ant click control logic - moves selected ant or selects ant under mouse.
   * If an ant is already selected, moves it to the mouse position.
   * Otherwise, checks all ants to see if any are under the mouse cursor for selection.
   * 
   * @example
   * // In mouse click handler
   * antManager.handleAntClick();
   */
  handleAntClick() {
    const worldPoint = this._getCursorWorldPoint();
    let antUnderCursor = null;

    for (let i = 0; i < ant_Index; i++) {
      const antObj = this.getAntObject(i);
      if (!antObj || typeof antObj.isMouseOver !== 'function') continue;
      if (antObj.isMouseOver(worldPoint.x, worldPoint.y)) {
        antUnderCursor = antObj;
        break;
      }
    }

    if (antUnderCursor) {
      this._applySelection(antUnderCursor);
      return;
    }

    if (this.selectedAnt) {
      this.moveSelectedAnt(true, worldPoint);
    }
  }

  /**
   * Moves the selected ant to the current mouse position.
   * Validates the resetSelection parameter and handles the ant movement.
   * 
   * @param {boolean} resetSelection - Whether to reset selection after move
   * @example
   * // Move selected ant and keep it selected
   * antManager.moveSelectedAnt(true);
   * 
   * // Move selected ant and deselect it
   * antManager.moveSelectedAnt(false);
   */
  moveSelectedAnt(resetSelection, worldPointOverride) {
    if (typeof resetSelection === "boolean") {
      if (this.selectedAnt) {
        const worldPoint = worldPointOverride || this._getCursorWorldPoint();
        this.selectedAnt.moveToLocation(worldPoint.x, worldPoint.y);
        this.selectedAnt.isSelected = resetSelection;
        if (resetSelection === false) {
          this.setSelectedAnt(null);
        }
        // If resetSelection is false, keep the ant selected
      }
    } else {
      // Use global IncorrectParamPassed function for error reporting
      if (typeof IncorrectParamPassed === 'function') {
        IncorrectParamPassed(true, resetSelection);
      } else {
        console.error('AntManager: Invalid parameter type for resetSelection. Expected boolean, got', typeof resetSelection);
      }
    }
  }

  /**
   * Selects an ant if it's under the mouse cursor.
   * Validates the ant instance and checks if the mouse is over it.
   * 
   * @param {ant} antCurrent - The ant to potentially select
   * @example
   * const antObj = antManager.getAntObject(0);
   * antManager.selectAnt(antObj);
   */
  selectAnt(antCurrent = null) {
    // Use global ant class for instanceof check
    if (typeof ant !== 'undefined' && !(antCurrent instanceof ant)) return;
    if (!antCurrent || typeof antCurrent.isMouseOver !== 'function') return;
    const worldPoint = this._getCursorWorldPoint();
    if (antCurrent.isMouseOver(worldPoint.x, worldPoint.y)) {
      this._applySelection(antCurrent);
    }
  }

  /**
   * Gets the ant object from the global ants array, handling wrapped and unwrapped ants.
   * Safely retrieves ant objects from the ants array, accounting for AntWrapper structures.
   * 
   * @param {number} antIndex - Index of the ant in the ants array
   * @returns {ant|null} The ant object or null if not found
   * @example
   * const antObj = antManager.getAntObject(5);
   * if (antObj) {
   *   const pos = antObj.getPosition();
   *   console.log('Ant position:', pos.x, pos.y);
   * }
   */
  getAntObject(antIndex) {
    // Use global ants array - now returns direct ant objects
    if (typeof ants === 'undefined' || !ants[antIndex]) return null;
    return ants[antIndex];
  }

  /**
   * Gets the currently selected ant.
   * 
   * @returns {ant|null} The selected ant or null if none selected
   * @example
   * const selected = antManager.getSelectedAnt();
   * if (selected) {
   *   const pos = selected.getPosition();
   *   console.log('Selected ant at:', pos.x, pos.y);
   * }
   */
  getSelectedAnt() {
    return this.selectedAnt;
  }

  /**
   * Sets the selected ant.
   * 
   * @param {ant|null} ant - The ant to select or null to deselect
   * @example
   * // Select a specific ant
   * antManager.setSelectedAnt(myAnt);
   * 
   * // Clear selection
   * antManager.setSelectedAnt(null);
   */
  setSelectedAnt(ant) {
    this.selectedAnt = ant;
    if (typeof selectedAnt !== 'undefined') {
      selectedAnt = ant;
    }
  }

  /**
   * Clears the current selection by deselecting the ant and setting selectedAnt to null.
   * 
   * @example
   * // Clear current selection
   * antManager.clearSelection();
   */
  clearSelection() {
    if (this.selectedAnt) {
      this.selectedAnt.isSelected = false;
      this.setSelectedAnt(null);
    }
  }

  /**
   * Checks if there is currently a selected ant.
   * 
   * @returns {boolean} True if an ant is selected, false otherwise
   * @example
   * if (antManager.hasSelection()) {
   *   console.log('An ant is selected');
   * }
   */
  hasSelection() {
    return this.selectedAnt !== null;
  }

  /**
   * Gets debug information about the current state of the AntManager.
   * 
   * @returns {Object} Debug information object
   * @example
   * const debug = antManager.getDebugInfo();
   * console.log('Manager state:', debug);
   */
  getDebugInfo() {
    return {
      hasSelectedAnt: this.selectedAnt !== null,
      selectedAntIndex: this.selectedAnt ? this.selectedAnt.antIndex : null,
      selectedAntPosition: this.selectedAnt ? 
        this.selectedAnt.getPosition() : null
    };
  }

  // --- Legacy Compatibility Interface ---
  /**
   * Legacy compatibility method for AntClickControl.
   * @deprecated Use handleAntClick() instead
   */
  AntClickControl() {
    this.handleAntClick();
  }

  /**
   * Legacy compatibility method for MoveAnt.
   * @deprecated Use moveSelectedAnt() instead
   * @param {boolean} resetSection - Whether to reset selection after move
   */
  MoveAnt(resetSection) {
    this.moveSelectedAnt(resetSection);
  }

  /**
   * Legacy compatibility method for SelectAnt.
   * @deprecated Use selectAnt() instead
   * @param {ant} antCurrent - The ant to potentially select
   */
  SelectAnt(antCurrent = null) {
    this.selectAnt(antCurrent);
  }

  /**
   * Legacy compatibility method for getAntObj.
   * @deprecated Use getAntObject() instead
   * @param {number} antCurrent - Index of the ant in the ants array
   * @returns {ant|null} The ant object or null if not found
   */
  getAntObj(antCurrent) {
    return this.getAntObject(antCurrent);
  }
}

// Export for Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AntManager;
}
