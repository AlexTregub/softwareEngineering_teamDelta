// UIController - Easy-to-use API for controlling the UI system
// Integrates with existing debug systems from debug/ folder
// 
// Keyboard Shortcuts:
// - Ctrl+Shift+1: Toggle Performance Monitor (uses existing PerformanceMonitor.js)
// - Ctrl+Shift+2: Toggle Entity Debug (uses existing EntityDebugManager.js)
// - Ctrl+Shift+3: Toggle Debug Console (uses existing debug/testing.js)
// - Ctrl+Shift+4: Toggle Minimap
// - Ctrl+Shift+5: Start Game (MENU -> PLAYING state)
// - ` (backtick): Toggle Debug Console (existing system from debug/commandLine.js)
//
class UIController {
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
   * Initialize the UI controller with the UI renderer
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
   * Set up keyboard controls for UI features
   */
  setupKeyboardControls() {
    // Note: Keyboard integration is handled via g_keyboardController.onKeyPress() in sketch.js setup()
    // The handleKeyPress method below processes the actual key combinations
    console.log('UIController keyboard shortcuts: Ctrl+Shift+1 (Performance Monitor), Ctrl+Shift+2 (Entity Debug), Ctrl+Shift+3 (Debug Console), Ctrl+Shift+4 (Minimap), Ctrl+Shift+5 (Start Game), ` (Command Line)');
  }

  /**
   * Handle key press events
   */
  handleKeyPress(keyCode, key, event = null) {
    if (!this.initialized) return false;

    // Check if Ctrl key is pressed through multiple methods
    const isCtrlPressed = (event && event.ctrlKey) || 
                         (typeof keyIsDown !== 'undefined' && typeof CONTROL !== 'undefined' && keyIsDown(CONTROL)) ||
                         (typeof keyIsDown !== 'undefined' && keyIsDown(17)) || // 17 is Ctrl keyCode fallback
                         (typeof window !== 'undefined' && window.event && window.event.ctrlKey);

    // Check if Shift key is pressed through multiple methods
    const isShiftPressed = (event && event.shiftKey) ||
                          (typeof keyIsDown !== 'undefined' && typeof SHIFT !== 'undefined' && keyIsDown(SHIFT)) ||
                          (typeof keyIsDown !== 'undefined' && keyIsDown(16)) || // 16 is Shift keyCode fallback
                          (typeof window !== 'undefined' && window.event && window.event.shiftKey);

    // Handle Ctrl+Shift key combinations
    if (isCtrlPressed && isShiftPressed) {
      switch(keyCode) {
        case 49: // Ctrl+Shift+1 - Performance Overlay
          this.togglePerformanceOverlay();
          return true;
        case 50: // Ctrl+Shift+2 - Entity Inspector  
          this.toggleEntityInspector();
          return true;
        case 51: // Ctrl+Shift+3 - Debug Console
          this.toggleDebugConsole();
          return true;
        case 52: // Ctrl+Shift+4 - Minimap
          this.toggleMinimap();
          return true;
        case 53: // Ctrl+Shift+5 - Start Game
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
   * Debug UI toggle methods
   */
  togglePerformanceOverlay() {
    // Use existing PerformanceMonitor system
    if (typeof g_performanceMonitor !== 'undefined' && g_performanceMonitor && typeof g_performanceMonitor.setDebugDisplay === 'function') {
      const currentState = g_performanceMonitor.debugDisplay && g_performanceMonitor.debugDisplay.enabled;
      g_performanceMonitor.setDebugDisplay(!currentState);
      console.log('UIController: Performance Monitor', !currentState ? 'ENABLED' : 'DISABLED');
    } else if (this.uiRenderer && typeof this.uiRenderer.togglePerformanceOverlay === 'function') {
      this.uiRenderer.togglePerformanceOverlay();
    }
  }

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

  toggleDebugConsole() {
    // Use existing debug console system from debug/testing.js
    if (typeof toggleDevConsole === 'function') {
      toggleDevConsole();
      console.log('UIController: Using existing debug console system');
    } else if (this.uiRenderer && typeof this.uiRenderer.toggleDebugConsole === 'function') {
      this.uiRenderer.toggleDebugConsole();
    }
  }

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
  startGame() {
    if (typeof GameState !== 'undefined' && GameState.startGame) {
      console.log('UIController: Starting game (MENU -> PLAYING state)');
      GameState.startGame();
    } else {
      console.warn('UIController: GameState.startGame() not available');
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