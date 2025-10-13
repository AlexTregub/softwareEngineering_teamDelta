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
      'MENU': ['presentation-control'],
      'PLAYING': ['ant_spawn', 'health_controls', 'tasks'],
      'PAUSED': ['ant_spawn', 'health_controls', 'tasks'],
      'DEBUG_MENU': ['ant_spawn', 'health_controls'],
      'GAME_OVER': ['stats'],
      'KANBAN': ['presentation-kanban-transition']
    };
    
    // Current game state for visibility management
    this.gameState = 'MENU';
  }

  /**
   * Initialize the panel manager and register with render pipeline
   * @returns {void}
   * @memberof DraggablePanelManager
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
      
      if (typeof globalThis.logVerbose === 'function') {
        globalThis.logVerbose('✅ DraggablePanelManager integrated into render pipeline');
      } else {
        console.log('✅ DraggablePanelManager integrated into render pipeline');
      }
    } else {
      console.warn('⚠️ RenderLayerManager not found - panels will need manual rendering');
    }

    this.isInitialized = true;
  }

  /**
   * Create the default example panels
   */
  createDefaultPanels() {
    // Ant Spawn Panel (vertical layout with ant spawning options)
    this.panels.set('ant_spawn', new DraggablePanel({
      id: 'ant-Spawn-panel',
      title: 'Ant Government Population Manager (🐜)',
      position: { x: 20, y: 80 },
      size: { width: 140, height: 280 },
      scale: 1.0, // Initial scale
      buttons: {
        layout: 'vertical',
        spacing: 3,
        buttonWidth: 120,
        buttonHeight: 24,
        items: [
          {
            caption: 'Spawn 1 Ant',
            onClick: () => this.spawnAnts(1),
            style: ButtonStyles.SUCCESS
          },
          {
            caption: 'Spawn 10 Ants',
            onClick: () => this.spawnAnts(10),
            style: { ...ButtonStyles.SUCCESS, backgroundColor: '#32CD32' }
          },
          {
            caption: 'Spawn 100 Ants',
            onClick: () => this.spawnAnts(100),
            style: { ...ButtonStyles.SUCCESS, backgroundColor: '#228B22' }
          },
          {
            caption: 'Spawn 1000 Ants (Don\'t do this!)',
            onClick: () => this.spawnAnts(1000),
            style: { ...ButtonStyles.SUCCESS, backgroundColor: '#218221ff' }
          },
          {
            caption: 'Kill 1 Ant',
            onClick: () => this.killAnts(1),
            style: ButtonStyles.DANGER
          },
          {
            caption: 'Kill 10 Ants',
            onClick: () => this.killAnts(10),
            style: { ...ButtonStyles.DANGER, backgroundColor: '#DC143C' }
          },
          {
            caption: 'Kill 100 Ants',
            onClick: () => this.killAnts(100),
            style: { ...ButtonStyles.DANGER, backgroundColor: '#B22222' }
          },
          {
            caption: 'Clear All Ants',
            onClick: () => this.clearAnts(),
            style: { ...ButtonStyles.DANGER, backgroundColor: '#8B0000' }
          }/*,
          {
            caption: 'Pause/Play',
            onClick: () => this.togglePause(),
            style: ButtonStyles.WARNING
          },
          {
            caption: 'Debug Info',
            onClick: () => this.toggleDebug(),
            style: ButtonStyles.PURPLE
          }*/
        ]
      }
    }));

    // Resources Panel (grid layout)
    this.panels.set('resources', new DraggablePanel({
      id: 'resources-spawn-panel',
      title: 'Resource Spawner',
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
            onClick: () => this.selectResource('stick'),
            style: { ...ButtonStyles.DEFAULT, backgroundColor: '#8B4513' }
          },
          {
            caption: 'Leaves',
            onClick: () => this.selectResource('leaves'),
            style: { ...ButtonStyles.SUCCESS, backgroundColor: '#11cd5cff' }
          },
          {
            caption: 'Stone',
            onClick: () => this.selectResource('stone'),
            style: { ...ButtonStyles.DEFAULT, backgroundColor: '#696969' }
          }/*,
          {
            caption: 'Info',
            onClick: () => this.showResourceInfo(),
            style: ButtonStyles.PURPLE
          }*/
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

    // Health Management Panel (horizontal layout with health controls)
    this.panels.set('health_controls', new DraggablePanel({
      id: 'health-controls-panel',
      title: 'Health & Selection Manager 💚',
      position: { x: 20, y: 400 },
      size: { width: 560, height: 100 },
      buttons: {
        layout: 'horizontal',
        spacing: 5,
        buttonWidth: 65,
        buttonHeight: 30,
        items: [
          {
            caption: 'Select All',
            onClick: () => this.selectAllAnts(),
            style: { ...ButtonStyles.PURPLE, backgroundColor: '#9932CC' }
          },
          {
            caption: 'Damage 10',
            onClick: () => this.damageSelectedAnts(10),
            style: { ...ButtonStyles.DANGER, backgroundColor: '#FF6B6B' }
          },
          {
            caption: 'Damage 25',
            onClick: () => this.damageSelectedAnts(25),
            style: { ...ButtonStyles.DANGER, backgroundColor: '#FF4757' }
          },
          {
            caption: 'Damage 50',
            onClick: () => this.damageSelectedAnts(50),
            style: { ...ButtonStyles.DANGER, backgroundColor: '#FF3742' }
          },
          {
            caption: 'Heal 10',
            onClick: () => this.healSelectedAnts(10),
            style: { ...ButtonStyles.SUCCESS, backgroundColor: '#32CD32' }
          },
          {
            caption: 'Heal 25',
            onClick: () => this.healSelectedAnts(25),
            style: { ...ButtonStyles.SUCCESS, backgroundColor: '#20B2AA' }
          },
          {
            caption: 'Heal 50',
            onClick: () => this.healSelectedAnts(50),
            style: { ...ButtonStyles.SUCCESS, backgroundColor: '#228B22' }
          },
          {
            caption: 'Deselect',
            onClick: () => this.deselectAllAnts(),
            style: { ...ButtonStyles.DEFAULT, backgroundColor: '#808080' }
          }
        ]
      }
    }));

    // Debug Panel (only shown in debug mode)
    this.panels.set('debug', new DraggablePanel({
      id: 'debug-panel',
      title: 'Debug Controls',
      position: { x: 600, y: 80 },
      size: { width: 160, height: 320 },
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
            caption: 'Scale Up (+)',
            onClick: () => this.scaleUp(),
            style: ButtonStyles.SUCCESS
          },
          {
            caption: 'Scale Down (-)',
            onClick: () => this.scaleDown(),
            style: ButtonStyles.WARNING
          },
          {
            caption: 'Reset Scale',
            onClick: () => this.resetScale(),
            style: ButtonStyles.DEFAULT
          },
          {
            caption: 'Responsive Scale',
            onClick: () => this.toggleResponsiveScaling(),
            style: ButtonStyles.PURPLE
          },
          {
            caption: 'Apply Responsive',
            onClick: () => this.applyResponsiveScaling(true),
            style: ButtonStyles.SUCCESS
          },
          {
            caption: 'Console Log',
            onClick: () => this.dumpConsole(),
            style: ButtonStyles.DANGER
          }
        ]
      }
    }));

    //task panel
    console.log("Creating task panel");
    this.panels.set('tasks', new DraggablePanel({
      id: 'task-panel',
      title: 'Task/Objective Manager 📋',
      position: { x: 20, y: 80 },
      size: { width: 140, height: 280 },
      scale: 1.0, // Initial scale
      buttons: {
        layout: 'vertical',
        spacing: 5,
        buttonWidth: 120,
        buttonHeight: 24,
        items: this.taskLibrary.availableTasks.slice(0, 5).map((task, index) => ({
          caption: task.description,
          onClick: () => console.log(`Task clicked: ${task.ID}`),
        style: ButtonStyles.SUCCESS
      }))
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
   * @returns {void}
   * @memberof DraggablePanelManager
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
   * @param {Object} [contentRenderers={}] - Map of panel ID to content renderer functions
   * @returns {void}
   * @memberof DraggablePanelManager
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
   * @memberof DraggablePanelManager
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
   * Set global scale for all panels
   * 
   * @param {number} scale - Scale factor (0.5 to 2.0)
   */
  setGlobalScale(scale) {
    this.globalScale = Math.max(this.minScale, Math.min(this.maxScale, scale));
    
    // Apply scale to all panels
    for (const panel of this.panels.values()) {
      if (typeof panel.setScale === 'function') {
        panel.setScale(this.globalScale);
      }
    }
    
    console.log(`🔍 Global panel scale set to ${this.globalScale.toFixed(2)}x`);
  }

  /**
   * Get current global scale
   * 
   * @returns {number} Current global scale factor
   */
  getGlobalScale() {
    return this.globalScale;
  }

  /**
   * Scale panels up by 10%
   */
  scaleUp() {
    this.setGlobalScale(this.globalScale * 1.1);
  }

  /**
   * Scale panels down by 10%
   */
  scaleDown() {
    this.setGlobalScale(this.globalScale / 1.1);
  }

  /**
   * Reset scale to default (1.0)
   */
  resetScale() {
    this.setGlobalScale(1.0);
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
   * Spawn multiple ants at random positions or near mouse
   */
  spawnAnts(count = 1) {
    console.log(`🐜 Spawning ${count} ant(s)...`);
    
    let spawned = 0;
    
    // Try multiple spawning methods until we find one that works
    const spawnMethods = [
      // Method 1: Try g_antManager
      () => {
        if (typeof g_antManager !== 'undefined' && g_antManager && typeof g_antManager.spawnAnt === 'function') {
          for (let i = 0; i < count; i++) {
            const centerX = (typeof g_canvasX !== 'undefined') ? g_canvasX / 2 : (typeof width !== 'undefined') ? width / 2 : 400;
            const centerY = (typeof g_canvasY !== 'undefined') ? g_canvasY / 2 : (typeof height !== 'undefined') ? height / 2 : 400;
            const spawnX = (typeof mouseX !== 'undefined' ? mouseX : centerX) + (Math.random() - 0.5) * 100;
            const spawnY = (typeof mouseY !== 'undefined' ? mouseY : centerY) + (Math.random() - 0.5) * 100;
            g_antManager.spawnAnt({ x: spawnX, y: spawnY });
            spawned++;
          }
          return true;
        }
        return false;
      },
      
      // Method 2: Try global ants array
      () => {
        if (typeof ants !== 'undefined' && Array.isArray(ants) && typeof Ant !== 'undefined') {
          for (let i = 0; i < count; i++) {
            const centerX = (typeof g_canvasX !== 'undefined') ? g_canvasX / 2 : (typeof width !== 'undefined') ? width / 2 : 400;
            const centerY = (typeof g_canvasY !== 'undefined') ? g_canvasY / 2 : (typeof height !== 'undefined') ? height / 2 : 400;
            const spawnX = (typeof mouseX !== 'undefined' ? mouseX : centerX) + (Math.random() - 0.5) * 100;
            const spawnY = (typeof mouseY !== 'undefined' ? mouseY : centerY) + (Math.random() - 0.5) * 100;
            const newAnt = new Ant(spawnX, spawnY);
            ants.push(newAnt);
            spawned++;
          }
          return true;
        }
        return false;
      },
      
      // Method 4: Try command line spawning system
      () => {
        if (typeof executeCommand === 'function' && typeof ants !== 'undefined') {
          const initialAntCount = ants.length;
          try {
            // Use the command line spawn system which creates proper ant objects
            executeCommand(`spawn ${count} ant player`);
            spawned = ants.length - initialAntCount;
            return spawned > 0;
          } catch (error) {
            console.warn('⚠️ Command line spawn method failed:', error.message);
            return false;
          }
        }
        return false;
      }
    ];
    
    // Try each method until one succeeds
    for (const method of spawnMethods) {
      if (method()) {
        console.log(`✅ Successfully spawned ${spawned} ant(s)`);
        return;
      }
    }
    
    console.warn('⚠️ Could not spawn ants - no compatible ant system found');
  }
  
  /**
   * Kill/remove multiple ants from the game
   */
  killAnts(count = 1) {
    console.log(`💀 Killing ${count} ant(s)...`);
    
    let killed = 0;
    
    // Try multiple removal methods
    const killMethods = [
      // Method 1: Try g_antManager
      () => {
        if (typeof g_antManager !== 'undefined' && g_antManager && typeof g_antManager.removeAnts === 'function') {
          killed = g_antManager.removeAnts(count);
          return killed > 0;
        }
        return false;
      },
      
      // Method 2: Try global ants array
      () => {
        if (typeof ants !== 'undefined' && Array.isArray(ants) && ants.length > 0) {
          const toRemove = Math.min(count, ants.length);
          ants.splice(-toRemove, toRemove); // Remove from end
          killed = toRemove;
          return true;
        }
        return false;
      },
      
      // Method 3: Try temp ants
      () => {
        if (typeof globalThis !== 'undefined' && globalThis.tempAnts && Array.isArray(globalThis.tempAnts)) {
          const toRemove = Math.min(count, globalThis.tempAnts.length);
          globalThis.tempAnts.splice(-toRemove, toRemove);
          killed = toRemove;
          return true;
        }
        return false;
      }
    ];
    
    // Try each method until one succeeds
    for (const method of killMethods) {
      if (method()) {
        console.log(`✅ Successfully killed ${killed} ant(s)`);
        return;
      }
    }
    
    console.warn('⚠️ Could not kill ants - no ants found or no compatible ant system');
  }

  /**
   * Clear all ants from the game
   */
  clearAnts() {
    console.log('🧹 Clearing all ants...');
    
    let cleared = 0;
    
    // Try multiple clearing methods
    if (typeof g_antManager !== 'undefined' && g_antManager && typeof g_antManager.clearAllAnts === 'function') {
      cleared += g_antManager.clearAllAnts();
    }
    
    if (typeof ants !== 'undefined' && Array.isArray(ants)) {
      cleared += ants.length;
      ants.length = 0; // Clear the array
    }
    
    if (typeof globalThis !== 'undefined' && globalThis.tempAnts && Array.isArray(globalThis.tempAnts)) {
      cleared += globalThis.tempAnts.length;
      globalThis.tempAnts.length = 0;
    }
    
    console.log(`✅ Cleared ${cleared} ant(s)`);
  }

  /**
   * Toggle game pause state
   */
  togglePause() {
    globalThis.logNormal('⏯️ Toggling pause state...');
    
    // Try multiple pause methods
    if (typeof g_gameStateManager !== 'undefined' && g_gameStateManager && typeof g_gameStateManager.togglePause === 'function') {
      g_gameStateManager.togglePause();
      globalThis.logNormal('✅ Game pause toggled via GameStateManager');
    } else {
      console.warn('⚠️ No pause system available');
    }
  }

  /**
   * Toggle debug information display
   */
  toggleDebug() {
    console.log('🔧 Toggling debug mode...');
    
    // Try multiple debug systems
    let debugToggled = false;
    
    // Method 1: Try g_uiDebugManager
    if (typeof g_uiDebugManager !== 'undefined' && g_uiDebugManager && typeof g_uiDebugManager.toggleDebug === 'function') {
      g_uiDebugManager.toggleDebug();
      debugToggled = true;
    }
    
    // Method 2: Try global debug test runner
    if (typeof globalThis !== 'undefined' && typeof globalThis.toggleDebugTestRunner === 'function') {
      globalThis.toggleDebugTestRunner();
      debugToggled = true;
    }
    
    // Method 3: Try global verbosity toggle
    if (typeof globalThis !== 'undefined' && typeof globalThis.toggleVerbosity === 'function') {
      globalThis.toggleVerbosity();
      debugToggled = true;
    }
    
    // Method 4: Simple global debug flag toggle
    if (!debugToggled) {
      if (typeof globalThis.debugMode === 'undefined') {
        globalThis.debugMode = false;
      }
      globalThis.debugMode = !globalThis.debugMode;
      console.log(`✅ Global debug mode ${globalThis.debugMode ? 'enabled' : 'disabled'}`);
      debugToggled = true;
    }
    
    if (!debugToggled) {
      console.warn('⚠️ No debug system available');
    }
  }

  /**
   * Select a resource type for interaction
   */
  selectResource(resourceType) {
    console.log(`📦 Selected resource: ${resourceType}`);
    if (typeof g_resourceManager !== 'undefined' && g_resourceManager && typeof g_resourceManager.selectResource === 'function') {
      g_resourceManager.selectResource(resourceType);
    } else {
      console.warn('⚠️ ResourceManager not found or selectResource method not available');
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
    
    if (typeof g_gameStateManager !== 'undefined' && g_gameStateManager && typeof g_gameStateManager.saveGame === 'function') {
      g_gameStateManager.saveGame();
      console.log('✅ Game saved via GameStateManager');
    } else {
      // Fallback: Save basic game state to localStorage
      try {
        const gameState = {
          timestamp: Date.now(),
          antCount: (typeof ants !== 'undefined' && Array.isArray(ants)) ? ants.length : 0,
          resourceCount: (typeof g_resourceManager !== 'undefined' && g_resourceManager) ? g_resourceManager.getResourceList().length : 0
        };
        localStorage.setItem('gameState', JSON.stringify(gameState));
        console.log('✅ Basic game state saved to localStorage');
      } catch (e) {
        console.warn('⚠️ Could not save game state:', e.message);
      }
    }
  }

  /**
   * Load saved game state
   */
  loadGame() {
    console.log('📁 Loading game...');
    
    if (typeof g_gameStateManager !== 'undefined' && g_gameStateManager && typeof g_gameStateManager.loadGame === 'function') {
      g_gameStateManager.loadGame();
      console.log('✅ Game loaded via GameStateManager');
    } else {
      // Fallback: Load from localStorage
      try {
        const savedState = localStorage.getItem('gameState');
        if (savedState) {
          const gameState = JSON.parse(savedState);
          console.log('📋 Found saved game state:', gameState);
          console.log('✅ Basic game state loaded from localStorage');
        } else {
          console.log('ℹ️ No saved game state found');
        }
      } catch (e) {
        console.warn('⚠️ Could not load game state:', e.message);
      }
    }
  }

  /**
   * Reset game to initial state
   */
  resetGame() {
    console.log('🔄 Resetting game...');
    
    if (typeof g_gameStateManager !== 'undefined' && g_gameStateManager && typeof g_gameStateManager.resetGame === 'function') {
      g_gameStateManager.resetGame();
      console.log('✅ Game reset via GameStateManager');
    } else {
      // Fallback: Manual reset
      this.clearAnts();
      if (typeof g_resourceManager !== 'undefined' && g_resourceManager && typeof g_resourceManager.clearAllResources === 'function') {
        g_resourceManager.clearAllResources();
      }
      console.log('✅ Basic game reset completed');
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
   * Select all ants in the game
   */
  selectAllAnts() {
    console.log('🎯 Selecting all ants...');
    
    // Try multiple selection methods
    const selectionMethods = [
      // Method 1: Use executeCommand (debug console system)
      () => {
        if (typeof executeCommand === 'function') {
          try {
            executeCommand('select all');
            return true;
          } catch (error) {
            console.warn('⚠️ Command selection method failed:', error.message);
            return false;
          }
        }
        return false;
      },
      
      // Method 2: Use AntUtilities
      () => {
        if (typeof AntUtilities !== 'undefined' && typeof ants !== 'undefined' && Array.isArray(ants)) {
          if (typeof AntUtilities.selectAllAnts === 'function') {
            AntUtilities.selectAllAnts(ants);
            return true;
          } else if (typeof AntUtilities.getSelectedAnts === 'function') {
            // Manually select all ants
            ants.forEach(ant => {
              if (ant && typeof ant.isSelected !== 'undefined') {
                ant.isSelected = true;
              }
            });
            return true;
          }
        }
        return false;
      },
      
      // Method 3: Direct ant array manipulation
      () => {
        if (typeof ants !== 'undefined' && Array.isArray(ants)) {
          let selected = 0;
          ants.forEach(ant => {
            if (ant && typeof ant.isSelected !== 'undefined') {
              ant.isSelected = true;
              selected++;
            }
          });
          if (selected > 0) {
            console.log(`✅ Selected ${selected} ants directly`);
            return true;
          }
        }
        return false;
      }
    ];
    
    // Try each method until one succeeds
    for (const method of selectionMethods) {
      if (method()) return;
    }
    
    console.warn('⚠️ Could not select ants - no compatible selection system found');
  }

  /**
   * Deselect all ants in the game
   */
  deselectAllAnts() {
    console.log('🎯 Deselecting all ants...');
    
    // Try multiple deselection methods
    const deselectionMethods = [
      // Method 1: Use executeCommand (debug console system)
      () => {
        if (typeof executeCommand === 'function') {
          try {
            executeCommand('select none');
            return true;
          } catch (error) {
            console.warn('⚠️ Command deselection method failed:', error.message);
            return false;
          }
        }
        return false;
      },
      
      // Method 2: Use AntUtilities
      () => {
        if (typeof AntUtilities !== 'undefined' && typeof ants !== 'undefined' && Array.isArray(ants)) {
          if (typeof AntUtilities.deselectAllAnts === 'function') {
            AntUtilities.deselectAllAnts(ants);
            return true;
          }
        }
        return false;
      },
      
      // Method 3: Direct ant array manipulation
      () => {
        if (typeof ants !== 'undefined' && Array.isArray(ants)) {
          let deselected = 0;
          ants.forEach(ant => {
            if (ant && typeof ant.isSelected !== 'undefined') {
              ant.isSelected = false;
              deselected++;
            }
          });
          if (deselected > 0) {
            console.log(`✅ Deselected ${deselected} ants directly`);
            return true;
          }
        }
        return false;
      }
    ];
    
    // Try each method until one succeeds
    for (const method of deselectionMethods) {
      if (method()) return;
    }
    
    console.warn('⚠️ Could not deselect ants - no compatible selection system found');
  }

  /**
   * Damage selected ants by specified amount
   */
  damageSelectedAnts(amount) {
    console.log(`💥 Damaging selected ants by ${amount} HP...`);
    
    // Try multiple damage methods
    const damageMethods = [
      // Method 1: Use executeCommand (debug console system)
      () => {
        if (typeof executeCommand === 'function') {
          try {
            executeCommand(`damage ${amount}`);
            return true;
          } catch (error) {
            console.warn('⚠️ Command damage method failed:', error.message);
            return false;
          }
        }
        return false;
      },
      
      // Method 2: Direct ant manipulation with AntUtilities
      () => {
        if (typeof AntUtilities !== 'undefined' && typeof ants !== 'undefined' && Array.isArray(ants)) {
          const selectedAnts = AntUtilities.getSelectedAnts ? AntUtilities.getSelectedAnts(ants) : ants.filter(ant => ant && ant.isSelected);
          let damaged = 0;
          selectedAnts.forEach(ant => {
            if (ant && typeof ant.takeDamage === 'function') {
              ant.takeDamage(amount);
              damaged++;
            }
          });
          if (damaged > 0) {
            console.log(`✅ Damaged ${damaged} selected ants by ${amount} HP`);
            return true;
          }
        }
        return false;
      },
      
      // Method 3: Direct ant array damage
      () => {
        if (typeof ants !== 'undefined' && Array.isArray(ants)) {
          let damaged = 0;
          ants.forEach(ant => {
            if (ant && ant.isSelected && typeof ant.takeDamage === 'function') {
              ant.takeDamage(amount);
              damaged++;
            }
          });
          if (damaged > 0) {
            console.log(`✅ Damaged ${damaged} selected ants by ${amount} HP directly`);
            return true;
          }
        }
        return false;
      }
    ];
    
    // Try each method until one succeeds
    for (const method of damageMethods) {
      if (method()) return;
    }
    
    console.warn('⚠️ Could not damage ants - no selected ants or compatible damage system found');
  }

  /**
   * Heal selected ants by specified amount
   */
  healSelectedAnts(amount) {
    console.log(`💚 Healing selected ants by ${amount} HP...`);
    
    // Try multiple healing methods
    const healMethods = [
      // Method 1: Use executeCommand (debug console system)
      () => {
        if (typeof executeCommand === 'function') {
          try {
            executeCommand(`heal ${amount}`);
            return true;
          } catch (error) {
            console.warn('⚠️ Command heal method failed:', error.message);
            return false;
          }
        }
        return false;
      },
      
      // Method 2: Direct ant manipulation with AntUtilities
      () => {
        if (typeof AntUtilities !== 'undefined' && typeof ants !== 'undefined' && Array.isArray(ants)) {
          const selectedAnts = AntUtilities.getSelectedAnts ? AntUtilities.getSelectedAnts(ants) : ants.filter(ant => ant && ant.isSelected);
          let healed = 0;
          selectedAnts.forEach(ant => {
            if (ant && typeof ant.heal === 'function') {
              ant.heal(amount);
              healed++;
            }
          });
          if (healed > 0) {
            console.log(`✅ Healed ${healed} selected ants by ${amount} HP`);
            return true;
          }
        }
        return false;
      },
      
      // Method 3: Direct ant array healing
      () => {
        if (typeof ants !== 'undefined' && Array.isArray(ants)) {
          let healed = 0;
          ants.forEach(ant => {
            if (ant && ant.isSelected && typeof ant.heal === 'function') {
              ant.heal(amount);
              healed++;
            }
          });
          if (healed > 0) {
            console.log(`✅ Healed ${healed} selected ants by ${amount} HP directly`);
            return true;
          }
        }
        return false;
      }
    ];
    
    // Try each method until one succeeds
    for (const method of healMethods) {
      if (method()) return;
    }
    
    console.warn('⚠️ Could not heal ants - no selected ants or compatible heal system found');
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