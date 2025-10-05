/**
 * @fileoverview DraggablePanelManager - Complete draggable UI panel system
 * @module DraggablePanelManager
 * @author Software Engineering Team Delta - David Willman  
 * @version 2.0.0
 * @see {@link docs/api/DraggablePanelManager.md} Complete API documentation
 * @see {@link docs/quick-reference.md} Panel system reference
 */

/**
 * Comprehensive draggable panel management system with render integration.
 * 
 * **Features**: Panel lifecycle, render integration, game state visibility, button management
 * 
 * @class DraggablePanelManager
 * @see {@link docs/api/DraggablePanelManager.md} Full documentation and examples
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
    
    // Panel visibility by game state (from Integration class)
    this.stateVisibility = {
      'MENU': [],
      'PLAYING': ['tools', 'resources', 'stats'],
      'PAUSED': ['tools', 'resources', 'stats'],
      'DEBUG_MENU': ['tools', 'resources', 'stats', 'debug'],
      'GAME_OVER': ['stats']
    };
    
    // Current game state for visibility management
    this.gameState = 'MENU';
  }

  /**
   * Initialize the panel manager and register with render pipeline
   */
  initialize() {
    if (this.isInitialized) {
      console.warn('DraggablePanelManager already initialized');
      return;
    }

    // Create default game panels
    this.createDefaultPanels();
    
    // Register with RenderLayerManager if available
    if (typeof g_renderLayerManager !== 'undefined' && g_renderLayerManager) {
      // Hook into the UI_GAME layer renderer
      const originalUIRenderer = g_renderLayerManager.layerRenderers.get('ui_game');
      
      g_renderLayerManager.layerRenderers.set('ui_game', (gameState) => {
        // Call original UI renderer first
        if (originalUIRenderer) {
          originalUIRenderer(gameState);
        }
        
        // Then render our panels
        this.renderPanels(gameState);
      });
      
      console.log('✅ DraggablePanelManager integrated into render pipeline');
    } else {
      console.warn('⚠️ RenderLayerManager not found - panels will need manual rendering');
    }

    this.isInitialized = true;
  }

  /**
   * Create the default example panels
   */
  createDefaultPanels() {
    // Tools Panel (vertical layout)
    this.panels.set('tools', new DraggablePanel({
      id: 'tools-panel',
      title: 'Game Tools',
      position: { x: 20, y: 80 },
      size: { width: 140, height: 180 },
      buttons: {
        layout: 'vertical',
        spacing: 5,
        buttonWidth: 120,
        buttonHeight: 28,
        items: [
          {
            caption: 'Spawn Ant',
            onClick: () => this.spawnAnt(),
            style: ButtonStyles.SUCCESS
          },
          {
            caption: 'Clear Ants',
            onClick: () => this.clearAnts(),
            style: ButtonStyles.DANGER
          },
          {
            caption: 'Pause/Play',
            onClick: () => this.togglePause(),
            style: ButtonStyles.WARNING
          },
          {
            caption: 'Debug Info',
            onClick: () => this.toggleDebug(),
            style: ButtonStyles.PURPLE
          }
        ]
      }
    }));

    // Resources Panel (grid layout)
    this.panels.set('resources', new DraggablePanel({
      id: 'resources-panel',
      title: 'Resources',
      position: { x: 180, y: 80 },
      size: { width: 180, height: 150 },
      buttons: {
        layout: 'grid',
        columns: 2,
        spacing: 8,
        buttonWidth: 70,
        buttonHeight: 40,
        items: [
          {
            caption: 'Wood',
            onClick: () => this.selectResource('wood'),
            style: { ...ButtonStyles.DEFAULT, backgroundColor: '#8B4513' }
          },
          {
            caption: 'Food', 
            onClick: () => this.selectResource('food'),
            style: { ...ButtonStyles.SUCCESS, backgroundColor: '#228B22' }
          },
          {
            caption: 'Stone',
            onClick: () => this.selectResource('stone'),
            style: { ...ButtonStyles.DEFAULT, backgroundColor: '#696969' }
          },
          {
            caption: 'Info',
            onClick: () => this.showResourceInfo(),
            style: ButtonStyles.PURPLE
          }
        ]
      }
    }));

    // Stats Panel (with mixed content and horizontal buttons)
    this.panels.set('stats', new DraggablePanel({
      id: 'stats-panel',
      title: 'Game Statistics',
      position: { x: 380, y: 80 },
      size: { width: 200, height: 160 },
      buttons: {
        layout: 'horizontal',
        spacing: 5,
        buttonWidth: 60,
        buttonHeight: 25,
        items: [
          {
            caption: 'Save',
            onClick: () => this.saveGame(),
            style: ButtonStyles.SUCCESS
          },
          {
            caption: 'Load',
            onClick: () => this.loadGame(),
            style: ButtonStyles.DEFAULT
          },
          {
            caption: 'Reset',
            onClick: () => this.resetGame(),
            style: ButtonStyles.DANGER
          }
        ]
      }
    }));

    // Debug Panel (only shown in debug mode)
    this.panels.set('debug', new DraggablePanel({
      id: 'debug-panel',
      title: 'Debug Controls',
      position: { x: 600, y: 80 },
      size: { width: 160, height: 200 },
      buttons: {
        layout: 'vertical',
        spacing: 3,
        buttonWidth: 140,
        buttonHeight: 25,
        items: [
          {
            caption: 'Toggle Rendering',
            onClick: () => this.toggleRendering(),
            style: ButtonStyles.WARNING
          },
          {
            caption: 'Performance',
            onClick: () => this.togglePerformance(),
            style: ButtonStyles.PURPLE
          },
          {
            caption: 'Entity Debug',
            onClick: () => this.toggleEntityDebug(),
            style: ButtonStyles.DEFAULT
          },
          {
            caption: 'Console Log',
            onClick: () => this.dumpConsole(),
            style: ButtonStyles.DANGER
          }
        ]
      }
    }));
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
   * Check if a panel exists
   * 
   * @param {string} panelId - Panel identifier
   * @returns {boolean} True if panel exists
   */
  hasPanel(panelId) {
    return this.panels.has(panelId);
  }

  /**
   * Check if a specific panel is visible
   * 
   * @param {string} panelId - Panel identifier
   * @returns {boolean} True if panel exists and is visible
   */
  isPanelVisible(panelId) {
    const panel = this.panels.get(panelId);
    return panel ? panel.isVisible() : false;
  }

  /**
   * Render all visible panels based on current game state
   */
  renderPanels(gameState) {
    // Update current game state
    if (gameState && gameState !== this.gameState) {
      this.gameState = gameState;
    }
    
    // Get panels that should be visible for current state
    const visiblePanelIds = this.stateVisibility[this.gameState] || [];
    
    // Update panel visibility
    for (const [panelId, panel] of this.panels) {
      const shouldBeVisible = visiblePanelIds.includes(panelId);
      if (shouldBeVisible && !panel.isVisible()) {
        panel.show();
      } else if (!shouldBeVisible && panel.isVisible()) {
        panel.hide();
      }
    }
    
    // Render all visible panels
    for (const panel of this.panels.values()) {
      if (panel.isVisible()) {
        panel.render();
      }
    }
  }

  /**
   * Update game state and adjust panel visibility
   */
  updateGameState(newState) {
    if (this.gameState !== newState) {
      this.gameState = newState;
      console.log(`🎮 Panel visibility updated for state: ${newState}`);
    }
  }

  // =============================================================================
  // GAME ACTION METHODS (Button Callbacks)
  // =============================================================================

  /**
   * Spawn a new ant at mouse position or default location
   */
  spawnAnt() {
    console.log('🐜 Spawning new ant...');
    // TODO: Integrate with actual ant spawning system
    if (typeof g_antManager !== 'undefined' && g_antManager) {
      // Use mouse position if available, otherwise center of screen
      const spawnX = mouseX || width / 2;
      const spawnY = mouseY || height / 2;
      g_antManager.spawnAnt({ x: spawnX, y: spawnY });
    } else {
      console.warn('⚠️ AntManager not found');
    }
  }

  /**
   * Clear all ants from the game
   */
  clearAnts() {
    console.log('🧹 Clearing all ants...');
    if (typeof g_antManager !== 'undefined' && g_antManager) {
      g_antManager.clearAllAnts();
    } else {
      console.warn('⚠️ AntManager not found');
    }
  }

  /**
   * Toggle game pause state
   */
  togglePause() {
    console.log('⏯️ Toggling pause state...');
    if (typeof g_gameStateManager !== 'undefined' && g_gameStateManager) {
      g_gameStateManager.togglePause();
    } else {
      console.warn('⚠️ GameStateManager not found');
    }
  }

  /**
   * Toggle debug information display
   */
  toggleDebug() {
    console.log('🔧 Toggling debug mode...');
    if (typeof g_uiDebugManager !== 'undefined' && g_uiDebugManager) {
      g_uiDebugManager.toggleDebug();
    } else {
      console.warn('⚠️ UIDebugManager not found');
    }
  }

  /**
   * Select a resource type for interaction
   */
  selectResource(resourceType) {
    console.log(`📦 Selected resource: ${resourceType}`);
    if (typeof g_resourceManager !== 'undefined' && g_resourceManager) {
      g_resourceManager.selectResource(resourceType);
    } else {
      console.warn('⚠️ ResourceManager not found');
    }
  }

  /**
   * Show resource information panel
   */
  showResourceInfo() {
    console.log('ℹ️ Showing resource information...');
    // TODO: Integrate with resource info system
  }

  /**
   * Save current game state
   */
  saveGame() {
    console.log('💾 Saving game...');
    if (typeof g_gameStateManager !== 'undefined' && g_gameStateManager) {
      g_gameStateManager.saveGame();
    } else {
      console.warn('⚠️ GameStateManager not found');
    }
  }

  /**
   * Load saved game state
   */
  loadGame() {
    console.log('📁 Loading game...');
    if (typeof g_gameStateManager !== 'undefined' && g_gameStateManager) {
      g_gameStateManager.loadGame();
    } else {
      console.warn('⚠️ GameStateManager not found');
    }
  }

  /**
   * Reset game to initial state
   */
  resetGame() {
    console.log('🔄 Resetting game...');
    if (typeof g_gameStateManager !== 'undefined' && g_gameStateManager) {
      g_gameStateManager.resetGame();
    } else {
      console.warn('⚠️ GameStateManager not found');
    }
  }

  /**
   * Toggle rendering system on/off
   */
  toggleRendering() {
    console.log('🎨 Toggling rendering system...');
    if (typeof g_renderController !== 'undefined' && g_renderController) {
      g_renderController.toggleRendering();
    } else {
      console.warn('⚠️ RenderController not found');
    }
  }

  /**
   * Toggle performance monitoring
   */
  togglePerformance() {
    console.log('📊 Toggling performance monitor...');
    if (typeof g_performanceMonitor !== 'undefined' && g_performanceMonitor) {
      g_performanceMonitor.toggle();
    } else {
      console.warn('⚠️ PerformanceMonitor not found');
    }
  }

  /**
   * Toggle entity debug visualization
   */
  toggleEntityDebug() {
    console.log('🔍 Toggling entity debug...');
    if (typeof g_entityDebugManager !== 'undefined' && g_entityDebugManager) {
      g_entityDebugManager.toggle();
    } else {
      console.warn('⚠️ EntityDebugManager not found');
    }
  }

  /**
   * Dump debug information to console
   */
  dumpConsole() {
    console.log('📝 Dumping debug information...');
    console.table({
      'Panel Manager': this.getStatus(),
      'Game State': this.gameState,
      'Visible Panels': this.stateVisibility[this.gameState]
    });
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