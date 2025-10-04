/**
 * @fileoverview DraggablePanelManager - Manages multiple draggable UI panels
 * Coordinates with Universal Button System for unified UI interaction
 * 
 * @author Software Engineering Team Delta - David Willman  
 * @version 1.0.0
 */

/**
 * DraggablePanelManager - Centralized management for draggable UI panels
 * Works alongside the Universal Button System for comprehensive UI management
 */
class DraggablePanelManager {
  /**
   * Creates a new DraggablePanelManager instance
   */
  constructor() {
    this.panels = new Map();
    this.isInitialized = false;
    
    // Debug mode: Panel Train Mode (panels follow each other when dragged) 🚂
    this.debugMode = {
      panelTrainMode: false
    };
    
    // Track which panel is currently being dragged (for proper isolation)
    this.currentlyDragging = null;
    

  }

  /**
   * Initialize the panel manager
   */
  initialize() {
    if (this.isInitialized) {
      console.warn('DraggablePanelManager already initialized');
      return;
    }

    this.isInitialized = true;

  }

  /**
   * Add a draggable panel
   * 
   * @param {Object} config - Panel configuration
   * @returns {DraggablePanel} Created panel instance
   */
  addPanel(config) {
    if (!this.isInitialized) {
      throw new Error('DraggablePanelManager must be initialized before adding panels');
    }

    if (this.panels.has(config.id)) {
      throw new Error(`Panel with ID '${config.id}' already exists`);
    }

    const panel = new DraggablePanel(config);
    this.panels.set(config.id, panel);
    

    return panel;
  }

  /**
   * Remove a panel by ID
   * 
   * @param {string} panelId - Panel identifier
   * @returns {boolean} True if panel was removed
   */
  removePanel(panelId) {
    const success = this.panels.delete(panelId);
    if (success) {

    }
    return success;
  }

  /**
   * Get a panel by ID
   * 
   * @param {string} panelId - Panel identifier
   * @returns {DraggablePanel|null} Panel instance or null if not found
   */
  getPanel(panelId) {
    return this.panels.get(panelId) || null;
  }

  /**
   * Update all panels for mouse interaction
   * 
   * @param {number} mouseX - Current mouse X position
   * @param {number} mouseY - Current mouse Y position
   * @param {boolean} mousePressed - Whether mouse is currently pressed
   */
  update(mouseX, mouseY, mousePressed) {
    if (!this.isInitialized) return;

    if (this.debugMode.panelTrainMode) {
      // 🚂 PANEL TRAIN MODE: All panels follow the leader!
      this.updatePanelTrainMode(mouseX, mouseY, mousePressed);
    } else {
      // Normal mode: Proper drag isolation (only one panel drags at a time)
      this.updateNormalMode(mouseX, mouseY, mousePressed);
    }
  }

  /**
   * Normal update mode with proper drag isolation
   */
  updateNormalMode(mouseX, mouseY, mousePressed) {
    // If mouse is released, clear the currently dragging panel
    if (!mousePressed) {
      this.currentlyDragging = null;
    }

    // If no panel is currently being dragged, check for new drag start
    if (!this.currentlyDragging && mousePressed) {
      // Find the topmost panel under the mouse (iterate in reverse order)
      const panelArray = Array.from(this.panels.values()).reverse();
      for (const panel of panelArray) {
        if (panel.state.visible && panel.config.behavior.draggable) {
          const titleBarBounds = panel.getTitleBarBounds();
          if (panel.isPointInBounds(mouseX, mouseY, titleBarBounds)) {
            this.currentlyDragging = panel.config.id;
            break;
          }
        }
      }
    }

    // Update only the currently dragging panel, or all panels if none are dragging
    for (const panel of this.panels.values()) {
      if (!this.currentlyDragging || panel.config.id === this.currentlyDragging) {
        panel.update(mouseX, mouseY, mousePressed);
      }
    }
  }

  /**
   * 🚂 Panel Train Mode: All panels follow each other in a fun chain!
   */
  updatePanelTrainMode(mouseX, mouseY, mousePressed) {
    // All panels update together - the bug becomes a feature! 
    for (const panel of this.panels.values()) {
      panel.update(mouseX, mouseY, mousePressed);
    }
  }

  /**
   * Render all visible panels
   * 
   * @param {Object} contentRenderers - Map of panel ID to content renderer functions
   */
  render(contentRenderers = {}) {
    if (!this.isInitialized) return;

    // Render panels in creation order (panels added later appear on top)
    for (const [panelId, panel] of this.panels) {
      const contentRenderer = contentRenderers[panelId];
      panel.render(contentRenderer);
    }
  }

  /**
   * Toggle panel visibility
   * 
   * @param {string} panelId - Panel identifier
   * @returns {boolean} New visibility state, or null if panel not found
   */
  togglePanel(panelId) {
    const panel = this.panels.get(panelId);
    if (panel) {
      panel.toggleVisibility();
      return panel.isVisible();
    }
    return null;
  }

  /**
   * Show panel
   * 
   * @param {string} panelId - Panel identifier
   * @returns {boolean} True if panel was found and shown
   */
  showPanel(panelId) {
    const panel = this.panels.get(panelId);
    if (panel && !panel.isVisible()) {
      panel.toggleVisibility();
      return true;
    }
    return false;
  }

  /**
   * Hide panel
   * 
   * @param {string} panelId - Panel identifier
   * @returns {boolean} True if panel was found and hidden
   */
  hidePanel(panelId) {
    const panel = this.panels.get(panelId);
    if (panel && panel.isVisible()) {
      panel.toggleVisibility();
      return true;
    }
    return false;
  }

  /**
   * Get all panel IDs
   * 
   * @returns {Array<string>} Array of panel IDs
   */
  getPanelIds() {
    return Array.from(this.panels.keys());
  }

  /**
   * Get count of panels
   * 
   * @returns {number} Number of registered panels
   */
  getPanelCount() {
    return this.panels.size;
  }

  /**
   * Get count of visible panels
   * 
   * @returns {number} Number of visible panels
   */
  getVisiblePanelCount() {
    let count = 0;
    for (const panel of this.panels.values()) {
      if (panel.isVisible()) count++;
    }
    return count;
  }

  /**
   * Check if any panel is currently being dragged
   * 
   * @returns {boolean} True if any panel is being dragged
   */
  isAnyPanelBeingDragged() {
    for (const panel of this.panels.values()) {
      if (panel.isDragActive()) return true;
    }
    return false;
  }

  /**
   * Get diagnostic information
   * 
   * @returns {Object} Diagnostic information
   */
  getDiagnosticInfo() {
    const panelInfo = {};
    for (const [panelId, panel] of this.panels) {
      panelInfo[panelId] = {
        visible: panel.isVisible(),
        position: panel.getPosition(),
        dragging: panel.isDragActive()
      };
    }

    return {
      isInitialized: this.isInitialized,
      totalPanels: this.panels.size,
      visiblePanels: this.getVisiblePanelCount(),
      anyDragging: this.isAnyPanelBeingDragged(),
      panels: panelInfo
    };
  }

  /**
   * Reset all panels to default positions
   */
  resetAllPanels() {
    for (const panel of this.panels.values()) {
      // Reset to initial position from config
      panel.setPosition(panel.config.position.x, panel.config.position.y);
    }
    console.log('🔄 Reset all panels to default positions');
  }

  /**
   * 🚂 Toggle Panel Train Mode (debug feature)
   * When enabled, all panels follow each other when one is dragged
   * 
   * @returns {boolean} New panel train mode state
   */
  togglePanelTrainMode() {
    this.debugMode.panelTrainMode = !this.debugMode.panelTrainMode;
    const status = this.debugMode.panelTrainMode ? 'ENABLED' : 'DISABLED';
    console.log(`🚂 Panel Train Mode ${status}`);
    return this.debugMode.panelTrainMode;
  }

  /**
   * Get current Panel Train Mode state
   * 
   * @returns {boolean} Whether panel train mode is enabled
   */
  isPanelTrainModeEnabled() {
    return this.debugMode.panelTrainMode;
  }

  /**
   * Set Panel Train Mode state
   * 
   * @param {boolean} enabled - Whether to enable panel train mode
   */
  setPanelTrainMode(enabled) {
    this.debugMode.panelTrainMode = !!enabled;
    const status = this.debugMode.panelTrainMode ? 'ENABLED' : 'DISABLED';
    console.log(`🚂 Panel Train Mode ${status}`);
  }

  /**
   * Dispose of the panel manager and cleanup resources
   */
  dispose() {
    this.panels.clear();
    this.isInitialized = false;
    console.log('🗑️ DraggablePanelManager disposed');
  }
}

// Export for browser environments
if (typeof window !== 'undefined') {
  window.DraggablePanelManager = DraggablePanelManager;
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DraggablePanelManager;
}