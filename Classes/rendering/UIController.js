/**
 * @fileoverview UIController - Centralized UI system controller with keyboard shortcuts
 * @module UIController
 * @see {@link docs/api/UIController.md} Complete API documentation
 * @see {@link docs/quick-reference.md} Keyboard shortcuts reference
 */

/**
 * Easy-to-use API for controlling the UI system.
 * Integrates with existing debug systems and provides keyboard shortcuts.
 * 
 * **Quick Shortcuts**: Ctrl+Shift+1-5, Backtick for debug console
 * 
 * @class UIController
 * @see {@link docs/api/UIController.md} Full documentation and examples
 */
class UIController {
  /**
   * Creates new UIController instance with default keyboard bindings.
   * @constructor
   */
  constructor() {
    this.uiRenderer = null;
    this.initialized = false;
    this.keyBindings = new Map([
      ['CTRL+SHIFT+1', 'togglePerformanceOverlay'],
      ['CTRL+SHIFT+2', 'toggleEntityInspector'], 
      ['CTRL+SHIFT+3', 'toggleDebugConsole'],
      ['CTRL+SHIFT+4', 'toggleMinimap'],
      ['CTRL+SHIFT+5', 'startGame'],
      ['BACKTICK', 'toggleDebugConsole']
    ]);
  }

  /**
   * Initialize UI controller and set up keyboard controls.
   * @returns {boolean} True if successful, false if UIRenderer unavailable
   */
  initialize() {
    this.uiRenderer = (typeof window !== 'undefined') ? window.UIRenderer : 
                     (typeof global !== 'undefined') ? global.UIRenderer : null;
    
    if (this.uiRenderer) {
      this.initialized = true;
      this.setupKeyboardControls();
      
      // Enable performance overlay by default in development
      this.uiRenderer.debugUI.performanceOverlay.enabled = true;
      
      console.log('UIController initialized successfully');
      return true;
    } else {
      console.warn('UIController: UIRenderer not available');
      return false;
    }
  }

  /**
   * Set up keyboard event bindings.
   * @private
   */
  setupKeyboardControls() {
    // Note: Keyboard integration is handled via g_keyboardController.onKeyPress() in sketch.js setup()
    // The handleKeyPress method below processes the actual key combinations
    console.log('UIController keyboard shortcuts: Shift+N (Toggle All UI), Ctrl+Shift+1-5 (Individual Panels), ` (Command Line)');
  }

  /**
   * Process keyboard shortcuts for UI controls.
   * 
   * **Main Shortcuts**: Shift+N (toggle all), Ctrl+Shift+1-5 (individual), ` (console)
   * 
   * @param {number} keyCode - The key code pressed
   * @param {string} key - The key character
   * @param {Event} [event] - Optional keyboard event
   * @returns {boolean} True if key was handled, false otherwise
   * @see {@link docs/api/UIController.md#keyboard-shortcuts} Complete shortcut list
   */
  handleKeyPress(keyCode, key, event = null) {
    if (!this.initialized) return false;

    // Check if Ctrl key is pressed through multiple methods
    const isCtrlPressed = (event && event.ctrlKey) || 
                         (typeof keyIsDown !== 'undefined' && typeof CONTROL !== 'undefined' && keyIsDown(CONTROL)) ||
                         (typeof keyIsDown !== 'undefined' && keyIsDown(17)) || // 17 is Ctrl keyCode fallback
                         (window.event && window.event.ctrlKey);

    // Check if Shift key is pressed through multiple methods
    const isShiftPressed = (event && event.shiftKey) ||
                          (typeof keyIsDown !== 'undefined' && typeof SHIFT !== 'undefined' && keyIsDown(SHIFT)) ||
                          (typeof keyIsDown !== 'undefined' && keyIsDown(16)) || // 16 is Shift keyCode fallback
                          (window.event && window.event.shiftKey);

    // Handle Shift+N - Universal UI Toggle
    if (isShiftPressed && !isCtrlPressed && keyCode === 78) { // Shift+N
      this.toggleAllUI();
      return true;
    }

    // Handle Ctrl+Shift key combinations (kept for legacy)
    if (isCtrlPressed && isShiftPressed) {
      switch(keyCode) {
        case 49: // Ctrl+Shift+1
          this.togglePerformanceOverlay();
          return true;
        case 50: // Ctrl+Shift+2
          this.toggleEntityInspector();
          return true;
        case 51: // Ctrl+Shift+3
          return true;
        case 52: // Ctrl+Shift+4
          this.toggleMinimap();
          return true;
        case 53: // Ctrl+Shift+5
          this.startGame();
          return true;
      }
    }

    // Handle non-modifier keys
    switch(keyCode) {
      case 192: // ` (backtick) - Debug Console
        this.toggleDebugConsole();
        return true;
    }

    return false; // Key not handled
  }

  /**
   * Handle mouse events for UI interaction
   */
  handleMousePressed(x, y, button) {
    if (!this.initialized) return false;

    // Start selection box on left click drag
    if (button === LEFT || button === 0) {
      this.uiRenderer.startSelectionBox(x, y);
      return false; // Allow other systems to handle too
    }

    // Show context menu on right click
    if (button === RIGHT || button === 2) {
      const contextItems = this.getContextMenuItems(x, y);
      if (contextItems.length > 0) {
        this.uiRenderer.showContextMenu(contextItems, x, y);
        return true;
      }
    }

    return false;
  }

  handleMouseDragged(x, y) {
    if (!this.initialized) return false;

    // Update selection box
    if (this.uiRenderer.interactionUI.selectionBox.active) {
      this.uiRenderer.updateSelectionBox(x, y);
      return true;
    }

    return false;
  }

  handleMouseReleased(x, y, button) {
    if (!this.initialized) return false;

    // End selection box
    if (this.uiRenderer.interactionUI.selectionBox.active) {
      this.uiRenderer.endSelectionBox();
      return true;
    }

    // Hide context menu on any click
    if (this.uiRenderer.interactionUI.contextMenu.active) {
      this.uiRenderer.hideContextMenu();
      return true;
    }

    return false;
  }

  handleMouseMoved(x, y) {
    if (!this.initialized) return false;

    // Update tooltips based on mouse position
    this.updateTooltips(x, y);

    return false;
  }

  /**
   * Update tooltips based on what's under the mouse
   */
  updateTooltips(x, y) {
    // Check if mouse is over an entity
    const hoveredEntity = this.getEntityAtPosition(x, y);
    
    if (hoveredEntity) {
      const tooltipText = this.getEntityTooltipText(hoveredEntity);
      this.uiRenderer.showTooltip(tooltipText, x, y + 20);
    } else {
      this.uiRenderer.hideTooltip();
    }
  }

  /**
   * Get entity at mouse position (simplified)
   */
  getEntityAtPosition(x, y) {
    if (typeof ants !== 'undefined') {
      for (let ant of ants) {
        if (ant && ant.x !== undefined && ant.y !== undefined) {
          const distance = Math.sqrt((ant.x - x) ** 2 + (ant.y - y) ** 2);
          if (distance < 20) { // 20 pixel hover radius
            return ant;
          }
        }
      }
    }
    return null;
  }

  /**
   * Generate tooltip text for an entity
   */
  getEntityTooltipText(entity) {
    let text = `${entity.constructor.name || 'Entity'}`;
    
    if (entity.id) {
      text += ` (${entity.id})`;
    }
    
    if (entity.currentState) {
      text += ` - ${entity.currentState}`;
    }
    
    if (entity.health !== undefined) {
      text += ` | Health: ${entity.health}`;
    }
    
    return text;
  }

  /**
   * Get context menu items for position
   */
  getContextMenuItems(x, y) {
    const items = [];
    const entity = this.getEntityAtPosition(x, y);
    
    if (entity) {
      items.push('Inspect Entity');
      items.push('Follow Entity');
      if (entity.isSelected && entity.isSelected()) {
        items.push('Deselect');
      } else {
        items.push('Select');
      }
    } else {
      items.push('Build Here');
      items.push('Set Waypoint');
    }
    
    items.push('---');
    items.push('Cancel');
    
    return items;
  }

  /**
   * Toggle performance overlay - Shows FPS, memory usage, render stats.
   * **Shortcut**: Ctrl+Shift+1
   * @see {@link docs/api/UIController.md#togglePerformanceOverlay} Advanced configuration
   */
  togglePerformanceOverlay() {
    // Use existing PerformanceMonitor system
    if (g_performanceMonitor && typeof g_performanceMonitor.setDebugDisplay === 'function') {
      const currentState = g_performanceMonitor.debugDisplay && g_performanceMonitor.debugDisplay.enabled;
      g_performanceMonitor.setDebugDisplay(!currentState);
      console.log('UIController: Performance Monitor', !currentState ? 'ENABLED' : 'DISABLED');
    } else if (this.uiRenderer && typeof this.uiRenderer.togglePerformanceOverlay === 'function') {
      this.uiRenderer.togglePerformanceOverlay();
    }
  }

  /**
   * Toggle entity inspector - Shows detailed entity information and debug overlays.
   * **Shortcut**: Ctrl+Shift+2
   */
  toggleEntityInspector() {
    // Use existing entity debug system from debug/EntityDebugManager.js
    if (typeof getEntityDebugManager === 'function') {
      const manager = getEntityDebugManager();
      if (manager && typeof manager.toggleGlobalDebug === 'function') {
        manager.toggleGlobalDebug();
        console.log('UIController: Using existing entity debug manager');
        return;
      }
    }
    
    // Fallback to UI renderer
    if (this.uiRenderer && typeof this.uiRenderer.toggleEntityInspector === 'function') {
      this.uiRenderer.toggleEntityInspector();
    }
  }

  /**
   * Toggle debug console - Command line interface for debugging.
   * **Shortcuts**: Ctrl+Shift+3 or ` (backtick)
   */
  toggleDebugConsole() {
    // Use existing debug console system from debug/testing.js
    /*if (typeof toggleDevConsole === 'function') {
      toggleDevConsole();
      console.log('UIController: Using existing debug console system');
    } else if (this.uiRenderer && typeof this.uiRenderer.toggleDebugConsole === 'function') { */
      this.uiRenderer.toggleDebugConsole();
    //}
  }

  /**
   * Toggle minimap display.
   * **Shortcut**: Ctrl+Shift+4
   */
  toggleMinimap() {
    if (this.uiRenderer) {
      if (this.uiRenderer.hudElements.minimap.enabled) {
        this.uiRenderer.disableMinimap();
      } else {
        this.uiRenderer.enableMinimap();
      }
    }
  }

  /**
   * Game State Management Methods
   */
  /**
   * Start the game - Transitions from MENU to PLAYING state.
   * 
   * **Shortcut**: Ctrl+Shift+5
   * 
   * @description
   * Delegates to GameState.startGame() to handle world initialization, 
   * UI setup, and state transitions.
   * 
   * @example
   * uiController.startGame(); // Manual start
   * // Or press Ctrl+Shift+5
   * 
   * @see {@link docs/api/UIController.md#startGame} Complete documentation
   */
  startGame() {
    if (GameState && GameState.startGame) {
      console.log('UIController: Starting game (MENU -> PLAYING state)');
      GameState.startGame();
    } else {
      console.warn('UIController: GameState.startGame() not available');
    }
  }

  /**
   * Toggle visibility of all UI panels.
   * 
   * **Shortcut**: Shift+N
   * 
   * @description
   * Smart toggle - shows all panels if any are hidden, hides all if all are visible.
   * Manages draggable panels, performance overlay, debug console, and minimap.
   * 
   * @example
   * uiController.toggleAllUI(); // Manual toggle
   * // Or press Shift+N
   * 
   * @see {@link docs/api/UIController.md#toggleAllUI} Complete documentation
   */
  toggleAllUI() {
    // Toggle all draggable panels
    if (window && window.draggablePanelManager) {
        const panelCount = window.draggablePanelManager.getPanelCount();
        const visibleCount = window.draggablePanelManager.getVisiblePanelCount();
        
        // If ALL panels are visible, hide all. Otherwise, show all.
        const shouldShow = visibleCount < panelCount;
        
        if (shouldShow) {
            // Show all panels
            if (typeof window.showAntControlPanel === 'function') window.showAntControlPanel();
            if (window.draggablePanelManager.hasPanel('resource-display')) {
                window.draggablePanelManager.showPanel('resource-display');
            }
            if (window.draggablePanelManager.hasPanel('performance-monitor')) {
                window.draggablePanelManager.showPanel('performance-monitor');
            }
            if (window.draggablePanelManager.hasPanel('debug-info')) {
                window.draggablePanelManager.showPanel('debug-info');
            }
            this.showPerformanceOverlay();
            this.showEntityInspector();
            this.showDebugConsole();
            this.showMinimap();
            console.log('👁️ All UI panels shown');
        } else {
            // Hide all panels
            if (typeof window.hideAntControlPanel === 'function') window.hideAntControlPanel();
            if (window.draggablePanelManager.hasPanel('resource-display')) {
                window.draggablePanelManager.hidePanel('resource-display');
            }
            if (window.draggablePanelManager.hasPanel('performance-monitor')) {
                window.draggablePanelManager.hidePanel('performance-monitor');
            }
            if (window.draggablePanelManager.hasPanel('debug-info')) {
                window.draggablePanelManager.hidePanel('debug-info');
            }
            this.hidePerformanceOverlay();
            this.hideEntityInspector();
            this.hideDebugConsole();
            this.hideMinimap();
            console.log('🙈 All UI panels hidden');
        }
    } else {
        console.warn('⚠️ DraggablePanelManager not available for UI toggle');
    }
  }

  /**
   * Entity selection and inspection
   */
  selectEntityForInspection(entity) {
    if (this.uiRenderer && entity) {
      this.uiRenderer.selectEntityForInspection(entity);
    }
  }

  /**
   * Game state UI methods
   */
  showMainMenu() {
    if (this.uiRenderer) {
      this.uiRenderer.menuSystems.mainMenu.active = true;
    }
  }

  hideMainMenu() {
    if (this.uiRenderer) {
      this.uiRenderer.menuSystems.mainMenu.active = false;
    }
  }

  showPauseMenu() {
    if (this.uiRenderer) {
      this.uiRenderer.menuSystems.pauseMenu.active = true;
    }
  }

  hidePauseMenu() {
    if (this.uiRenderer) {
      this.uiRenderer.menuSystems.pauseMenu.active = false;
    }
  }

  /**
   * Individual UI panel show/hide methods for toggleAllUI
   */
  showPerformanceOverlay() {
    if (typeof g_performanceMonitor !== 'undefined' && g_performanceMonitor && typeof g_performanceMonitor.setDebugDisplay === 'function') {
      g_performanceMonitor.setDebugDisplay(true);
    }
  }

  hidePerformanceOverlay() {
    if (typeof g_performanceMonitor !== 'undefined' && g_performanceMonitor && typeof g_performanceMonitor.setDebugDisplay === 'function') {
      g_performanceMonitor.setDebugDisplay(false);
    }
  }

  showEntityInspector() {
    if (typeof getEntityDebugManager === 'function') {
      const manager = getEntityDebugManager();
      if (manager && typeof manager.enableGlobalDebug === 'function') {
        manager.enableGlobalDebug();
      }
    }
  }

  hideEntityInspector() {
    if (typeof getEntityDebugManager === 'function') {
      const manager = getEntityDebugManager();
      if (manager && typeof manager.disableGlobalDebug === 'function') {
        manager.disableGlobalDebug();
      }
    }
  }

  showDebugConsole() {
    // Debug console is typically shown via existing systems
    if (typeof showDevConsole === 'function') {
      showDevConsole();
    }
  }

  hideDebugConsole() {
    // Debug console is typically hidden via existing systems
    if (typeof hideDevConsole === 'function') {
      hideDevConsole();
    }
  }

  showMinimap() {
    if (this.uiRenderer && this.uiRenderer.hudElements && this.uiRenderer.hudElements.minimap) {
      this.uiRenderer.hudElements.minimap.enabled = true;
    }
  }

  hideMinimap() {
    if (this.uiRenderer && this.uiRenderer.hudElements && this.uiRenderer.hudElements.minimap) {
      this.uiRenderer.hudElements.minimap.enabled = false;
    }
  }

  /**
   * Configuration and stats
   */
  configure(options) {
    if (this.uiRenderer) {
      this.uiRenderer.updateConfig(options);
    }
  }

  getStats() {
    return this.uiRenderer ? this.uiRenderer.getStats() : null;
  }

  getUIRenderer() {
    return this.uiRenderer;
  }
}

// Create global instance
const UIManager = new UIController();

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
  window.UIManager = UIManager;
  
  // Initialize after a short delay to ensure UIRenderer is available
  setTimeout(() => {
    UIManager.initialize();
  }, 100);
} else if (typeof global !== 'undefined') {
  global.UIManager = UIManager;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { UIController, UIManager };
}