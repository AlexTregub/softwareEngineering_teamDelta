/**
 * @fileoverview Integration layer for DraggablePanel examples with the render pipeline
 * Hooks draggable panels into RenderLayerManager's UI_GAME layer
 * 
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 */

/**
 * DraggablePanelManager - Integrates draggable panels into the render pipeline
 */
class DraggablePanelManagerTEST extends DraggablePanelManager {
  constructor() {
    super();

    // Panel visibility by game state
    this.stateVisibility = {
      'MENU': [],
      'PLAYING': ['tools', 'resources', 'stats'],
      'PAUSED': ['tools', 'resources', 'stats'],
      'DEBUG_MENU': ['tools', 'resources', 'stats', 'debug'],
      'GAME_OVER': ['stats']
    };
  }

  /**
   * Initialize the panel manager and register with render pipeline
   */
  initialize() {
    if (this.initialized) return;
    
    // Create example panels
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
    
    this.initialized = true;
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
   * Update all active panels
   */
  updatePanels(gameState) {
    this.gameState = gameState;
    
    if (typeof mouseX !== 'undefined' && typeof mouseY !== 'undefined') {
      this.getVisiblePanels(gameState).forEach(panel => {
        panel.update(mouseX, mouseY, mouseIsPressed);
      });
    }
  }

  /**
   * Render all panels for the current game state
   */
  renderPanels(gameState) {
    const visiblePanels = this.getVisiblePanels(gameState);
    
    visiblePanels.forEach(panel => {
      // Render stats panel with custom content
      if (panel.config.id === 'stats-panel') {
        panel.render((contentArea, style) => {
          this.renderStatsContent(contentArea, style);
        });
      } else {
        // Render other panels with just buttons
        panel.render();
      }
    });
  }

  /**
   * Get panels that should be visible for the current game state
   */
  getVisiblePanels(gameState) {
    const visiblePanelIds = this.stateVisibility[gameState] || [];
    return visiblePanelIds
      .map(id => this.panels.get(id))
      .filter(panel => panel !== undefined);
  }

  /**
   * Render custom content for stats panel
   */
  renderStatsContent(contentArea, style) {
    fill(style.textColor);
    textAlign(LEFT, TOP);
    textSize(11);
    
    let yOffset = 0;
    const lineHeight = 14;
    
    // Game statistics
    const antCount = (typeof ants !== 'undefined' && ants) ? ants.length : 0;
    const resourceCount = (typeof g_resourceList !== 'undefined' && g_resourceList && g_resourceList.resources) 
      ? g_resourceList.resources.length : 0;
    
    text(`Ants: ${antCount}`, contentArea.x, contentArea.y + yOffset);
    yOffset += lineHeight;
    
    text(`Resources: ${resourceCount}`, contentArea.x, contentArea.y + yOffset);
    yOffset += lineHeight;
    
    text(`FPS: ${Math.round(frameRate())}`, contentArea.x, contentArea.y + yOffset);
    yOffset += lineHeight;
    
    text(`Frame: ${frameCount}`, contentArea.x, contentArea.y + yOffset);
    yOffset += lineHeight + 5; // Extra space before buttons
  }

  // ===================
  // BUTTON HANDLERS
  // ===================

  spawnAnt() {
    console.log('🐜 Spawning ant...');
    if (typeof spawnAnt === 'function') {
      spawnAnt();
    } else if (typeof AntUtilities !== 'undefined' && AntUtilities.createAnt) {
      AntUtilities.createAnt(mouseX || 400, mouseY || 300);
    } else {
      console.warn('No ant spawning function available');
    }
  }

  clearAnts() {
    console.log('🧹 Clearing all ants...');
    if (typeof ants !== 'undefined' && Array.isArray(ants)) {
      ants.length = 0;
    }
  }

  togglePause() {
    console.log('⏯️ Toggling pause...');
    if (typeof GameState !== 'undefined' && GameState.togglePause) {
      GameState.togglePause();
    } else if (typeof noLoop === 'function' && typeof loop === 'function') {
      if (isLooping()) {
        noLoop();
        console.log('Game paused');
      } else {
        loop();
        console.log('Game resumed');
      }
    }
  }

  toggleDebug() {
    console.log('🔍 Toggling debug mode...');
    if (typeof g_uiDebugManager !== 'undefined' && g_uiDebugManager) {
      g_uiDebugManager.toggle();
    }
  }

  selectResource(resourceType) {
    console.log(`📦 Selected resource: ${resourceType}`);
    // Your resource selection logic here
  }

  showResourceInfo() {
    console.log('ℹ️ Showing resource information...');
    if (typeof g_resourceList !== 'undefined' && g_resourceList) {
      console.log('Resource counts:', {
        wood: g_resourceList.wood ? g_resourceList.wood.length : 0,
        food: g_resourceList.food ? g_resourceList.food.length : 0
      });
    }
  }

  saveGame() {
    console.log('💾 Saving game...');
    // Your save game logic here
  }

  loadGame() {
    console.log('📂 Loading game...');
    // Your load game logic here
  }

  resetGame() {
    console.log('🔄 Resetting game...');
    this.clearAnts();
    if (typeof g_resourceList !== 'undefined' && g_resourceList && g_resourceList.clear) {
      g_resourceList.clear();
    }
  }

  toggleRendering() {
    console.log('🎨 Toggling rendering layers...');
    if (typeof g_renderLayerManager !== 'undefined' && g_renderLayerManager) {
      // Toggle a layer for testing
      if (g_renderLayerManager.disabledLayers.has('effects')) {
        g_renderLayerManager.disabledLayers.delete('effects');
        console.log('Effects layer enabled');
      } else {
        g_renderLayerManager.disabledLayers.add('effects');
        console.log('Effects layer disabled');
      }
    }
  }

  togglePerformance() {
    console.log('📊 Toggling performance monitor...');
    if (typeof g_performanceMonitor !== 'undefined' && g_performanceMonitor) {
      g_performanceMonitor.toggle();
    }
  }

  toggleEntityDebug() {
    console.log('🔬 Toggling entity debug...');
    if (typeof getEntityDebugManager === 'function') {
      const debugManager = getEntityDebugManager();
      if (debugManager) {
        debugManager.toggle();
      }
    }
  }

  dumpConsole() {
    console.log('📜 Console dump:', {
      ants: typeof ants !== 'undefined' ? ants.length : 'N/A',
      resources: typeof g_resourceList !== 'undefined' ? 'Available' : 'N/A',
      gameState: this.gameState,
      panels: Array.from(this.panels.keys())
    });
  }

  // ===================
  // PUBLIC API
  // ===================

  /**
   * Add a custom panel
   */
  addPanel(id, panelConfig) {
    this.panels.set(id, new DraggablePanel(panelConfig));
  }

  /**
   * Remove a panel
   */
  removePanel(id) {
    this.panels.delete(id);
  }

  /**
   * Get panel by ID
   */
  getPanel(id) {
    return this.panels.get(id);
  }

  /**
   * Show panel in specific game states
   */
  setPanelVisibility(panelId, gameStates) {
    gameStates.forEach(state => {
      if (!this.stateVisibility[state]) {
        this.stateVisibility[state] = [];
      }
      if (!this.stateVisibility[state].includes(panelId)) {
        this.stateVisibility[state].push(panelId);
      }
    });
  }
}

// Create global instance
let g_draggablePanelManager = null;

// Initialize function to call from your main setup
function initializeDraggablePanels() {
  if (!g_draggablePanelManager) {
    g_draggablePanelManager = new DraggablePanelManager();
    g_draggablePanelManager.initialize();
    console.log('✅ Draggable panels initialized and integrated');
  }
  return g_draggablePanelManager;
}

// Update function to call from your main update loop
function updateDraggablePanels(gameState) {
  if (g_draggablePanelManager) {
    g_draggablePanelManager.updatePanels(gameState);
  }
}

// Make globally available
if (typeof window !== 'undefined') {
  window.DraggablePanelManager = DraggablePanelManager;
  window.g_draggablePanelManager = g_draggablePanelManager;
  window.initializeDraggablePanels = initializeDraggablePanels;
  window.updateDraggablePanels = updateDraggablePanels;
}

// Export for Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DraggablePanelManager,
    initializeDraggablePanels,
    updateDraggablePanels
  };
}