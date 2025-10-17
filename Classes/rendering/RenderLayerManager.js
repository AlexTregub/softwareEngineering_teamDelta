/**
 * @fileoverview RenderLayerManager - Centralized layered rendering system
 * @module RenderLayerManager
 * @see {@link docs/api/RenderLayerManager.md} Complete API documentation
 * @see {@link docs/quick-reference.md} Layer system reference
 */

/**
 * Manages rendering layers from terrain to UI with performance optimization.
 * 
 * **Layers**: TERRAIN → ENTITIES → EFFECTS → UI_GAME → UI_DEBUG → UI_MENU
 * 
 * @class RenderLayerManager
 * @see {@link docs/api/RenderLayerManager.md} Full documentation and examples
 */
class RenderLayerManager {
  constructor() {
    // Rendering layers in order (bottom to top)
    this.layers = {
      TERRAIN: 'terrain',      // Static terrain, cached
      ENTITIES: 'entities',    // Dynamic game objects (ants, resources)
      EFFECTS: 'effects',      // Particle effects, visual effects, screen effects
      UI_GAME: 'ui_game',     // In-game UI (currencies, selection, dropoff)
      UI_DEBUG: 'ui_debug',   // Debug overlays (console, performance)
      UI_MENU: 'ui_menu'      // Menu system and transitions
    };
    
    // Layer rendering functions
    this.layerRenderers = new Map();
    
    // Layer drawables (additional callbacks appended to a layer)
    this.layerDrawables = new Map();
    
    // Layer toggle state for debugging
    this.disabledLayers = new Set();
    
    // Performance tracking
    this.renderStats = {
      frameCount: 0,
      lastFrameTime: 0,
      layerTimes: {}
    };
    
    // Cache management
    this.cacheStatus = {
      terrainCacheValid: false,
      lastTerrainUpdate: 0
    };
    
    this.isInitialized = false;
  }
  
  /**
   * Initialize the rendering system
   * Called once during setup
   */
  initialize() {
    if (this.isInitialized) return;
    
    // Register default layer renderers
    this.registerLayerRenderer(this.layers.TERRAIN, this.renderTerrainLayer.bind(this));
    this.registerLayerRenderer(this.layers.ENTITIES, this.renderEntitiesLayer.bind(this));
    this.registerLayerRenderer(this.layers.EFFECTS, this.renderEffectsLayer.bind(this));
    this.registerLayerRenderer(this.layers.UI_GAME, this.renderGameUILayer.bind(this));
    this.registerLayerRenderer(this.layers.UI_DEBUG, this.renderDebugUILayer.bind(this));
    this.registerLayerRenderer(this.layers.UI_MENU, this.renderMenuUILayer.bind(this));
    
    this.isInitialized = true;
  }
  
  /**
   * Register a custom renderer for a specific layer
   */
  registerLayerRenderer(layerName, rendererFunction) {
    this.layerRenderers.set(layerName, rendererFunction);
  }

  /**
   * Add a drawable callback to a layer (does not replace existing renderer).
   * Drawable signature: function(gameState) { ...drawing code... }
   */
  addDrawableToLayer(layerName, drawableFn) {
    if (!this.layerDrawables.has(layerName)) {
      this.layerDrawables.set(layerName, []);
    }
    this.layerDrawables.get(layerName).push(drawableFn);
  }

  /**
   * Remove a drawable callback from a layer.
   */
  removeDrawableFromLayer(layerName, drawableFn) {
    const arr = this.layerDrawables.get(layerName);
    if (!arr) return false;
    const idx = arr.indexOf(drawableFn);
    if (idx === -1) return false;
    arr.splice(idx, 1);
    return true;
  }
  
  /**
   * Main render call - renders all layers based on game state
   */
  render(gameState) {
    if (!this.isInitialized) {
      console.warn('RenderLayerManager not initialized');
      return;
    }
    
    const frameStart = performance.now();
    
    // Determine which layers to render based on game state
    const layersToRender = this.getLayersForState(gameState);
    
    // Render each layer in order (skip disabled layers)
    for (const layerName of layersToRender) {
      // Skip disabled layers
      if (this.disabledLayers.has(layerName)) {
        if (layerName == this.layers.TERRAIN) { background(0); }
        continue;
      }
      
      const layerStart = performance.now();
      
      const renderer = this.layerRenderers.get(layerName);
      if (renderer) {
        try {
          renderer(gameState);
        } catch (error) {
          console.error(`Error rendering layer ${layerName}:`, error);
        }
      }
      
      // Call any extra drawables registered for this layer
      const drawables = this.layerDrawables.get(layerName);
      if (drawables && drawables.length) {
        for (const fn of drawables) {
          try {
            fn(gameState);
          } catch (err) {
            console.error(`Error in drawable for layer ${layerName}:`, err);
          }
        }
      }
      
      const layerEnd = performance.now();
      this.renderStats.layerTimes[layerName] = layerEnd - layerStart;
    }
    // Update button groups (rendering handled by RenderLayerManager)
    if (window.buttonGroupManager) {
      try {
        window.buttonGroupManager.update(mouseX, mouseY, mouseIsPressed);
      } catch (error) {
        console.error('❌ Error updating button group system:', error);
      }
    }
    
    // Update performance stats
    this.renderStats.frameCount++;
    this.renderStats.lastFrameTime = performance.now() - frameStart;
  }
  
  /**
   * Determine which layers should be rendered for the current game state
   */
  getLayersForState(gameState) {
    switch (gameState) {
      case 'MENU':
      case 'OPTIONS':
        return [this.layers.TERRAIN, this.layers.UI_MENU];
        
      case 'KANBAN':
        return [this.layers.TERRAIN, this.layers.UI_MENU];
        
      case 'DEBUG_MENU':
        return [this.layers.TERRAIN, this.layers.ENTITIES, this.layers.EFFECTS, this.layers.UI_DEBUG, this.layers.UI_MENU];
        
      case 'PLAYING':
        return [this.layers.TERRAIN, this.layers.ENTITIES, this.layers.EFFECTS, this.layers.UI_GAME, this.layers.UI_DEBUG];
        
      case 'PAUSED':
        return [this.layers.TERRAIN, this.layers.ENTITIES, this.layers.EFFECTS, this.layers.UI_GAME];
        
      case 'GAME_OVER':
        return [this.layers.TERRAIN, this.layers.ENTITIES, this.layers.EFFECTS, this.layers.UI_GAME, this.layers.UI_MENU];
        
      default:
        console.warn(`Unknown game state: ${gameState}`);
        return [this.layers.TERRAIN, this.layers.UI_MENU];
    }
  }
  
  /**
   * TERRAIN LAYER - Cached background rendering
   */
  renderTerrainLayer(gameState) {
    // Only render terrain for game states that need it
    if (!['PLAYING', 'PAUSED', 'GAME_OVER', 'DEBUG_MENU', 'MENU', 'OPTIONS'].includes(gameState)) {
      return;
    }

    push();
    this.applyZoom();
    g_map2.render();
    pop();

    
    // do not render the world until the grid has recentered
    if (gridRecenters <= MAX_RECENTERS) {
      g_map2.setGridToCenter()
      gridRecenters++
    }
    
  }
  /**
   * Gets zoom from the cameraManager and applys it to the scale, 
   * make sure you surrond this with push() and pop() or everything will scale incorrectly.
   */
  applyZoom(){
    const zoom = cameraManager.getZoom();
    // Scale around the canvas center so world tiles scale about the view
    translate((g_canvasX/2), (g_canvasY/2));
    scale(zoom);
    translate(-(g_canvasX/2), -(g_canvasY/2));
    g_canvasX = windowWidth;
    g_canvasY = windowHeight;
  }
  
  /**
   * ENTITIES LAYER - Dynamic game objects
   */
  renderEntitiesLayer(gameState) {
    // Only render entities during gameplay states
    if (!['PLAYING', 'PAUSED', 'GAME_OVER', 'DEBUG_MENU'].includes(gameState)) {
      return;
    }
    
    push();
    this.applyZoom();
    
    // Get the EntityRenderer instance (not the class)
    const entityRenderer = (typeof window !== 'undefined') ? window.EntityRenderer : 
                          (typeof global !== 'undefined') ? global.EntityRenderer : null;

    // Use EntityRenderer instance for all entity rendering
    if (entityRenderer && typeof entityRenderer.renderAllLayers === 'function') {
      entityRenderer.renderAllLayers(gameState);
    }
    pop();
  }

  /**
   * EFFECTS LAYER - Particle effects, visual effects, screen effects
   */
  renderEffectsLayer(gameState) {
    // Render effects in most game states
    if (!['PLAYING', 'PAUSED', 'GAME_OVER', 'DEBUG_MENU', 'MAIN_MENU'].includes(gameState)) {
      return;
    }
    
    
    push();
    this.applyZoom();
    // Get the EffectsRenderer instance
    const effectsRenderer = (typeof window !== 'undefined') ? window.EffectsRenderer : 
                           (typeof global !== 'undefined') ? global.EffectsRenderer : null;

    // Use EffectsRenderer for all effect rendering
    if (effectsRenderer && typeof effectsRenderer.renderEffects === 'function') {
      effectsRenderer.renderEffects(gameState);
    }
    pop();
  }
  

  
  /**
   * GAME UI LAYER - In-game interface elements
   */
  renderGameUILayer(gameState) {
    if (!['PLAYING', 'PAUSED', 'GAME_OVER'].includes(gameState)) { return; }
    
    // Use comprehensive UI renderer
    const uiRenderer = (typeof window !== 'undefined') ? window.UIRenderer : 
                      (typeof global !== 'undefined') ? global.UIRenderer : null;
    
    if (uiRenderer) {
      //uiRenderer.renderUI(gameState);
      this.renderBaseGameUI();
      this.renderInteractionUI(gameState);
      // Render state-specific overlays
      if (gameState === 'PAUSED') { this.renderPauseOverlay(); } 
      if (gameState === 'GAME_OVER') { this.renderGameOverOverlay();  }
          // Render Universal Button Group System (always on top of other UI)
      this.renderButtonGroups(gameState);
    } 
    

  }
  
  /**
   * Render base game UI elements (currencies, selection)
   * @private
   */
  renderBaseGameUI() {
    // Render currencies
    if (renderCurrencies) {
      renderCurrencies();
    }
    
    // Selection box
    if (g_selectionBoxController) {
      g_selectionBoxController.draw();
    }
  }
  
  /**
   * Render interaction UI elements (dropoff, spawn)
   * @private
   */
  renderInteractionUI(gameState) {
    // Only show interaction UI during active gameplay
    if (gameState !== 'PLAYING') return;
    
    window.updateDropoffUI();
    window.drawDropoffUI();
  }
  
  /**
   * DEBUG UI LAYER - Development overlays
   */
  renderDebugUILayer(gameState) {
    // Debug elements can appear in any state except pure menu
    if (gameState === 'MENU' || gameState === 'OPTIONS') {
      return;
    }
    
    // Render existing PerformanceMonitor if enabled
    if (g_performanceMonitor && g_performanceMonitor.debugDisplay && g_performanceMonitor.debugDisplay.enabled &&
        typeof g_performanceMonitor.render === 'function') {
      g_performanceMonitor.render();
    }

    // Render dev console indicator if enabled
    if (isDevConsoleEnabled()) {
      drawDevConsoleIndicator();
    }
    
    // Render UIRenderer debug elements as fallback
    const uiRenderer = (typeof window !== 'undefined') ? window.UIRenderer : 
                      (typeof global !== 'undefined') ? global.UIRenderer : null;
    
    if (uiRenderer && uiRenderer.config.enableDebugUI) {
      if (uiRenderer.debugUI.entityInspector.enabled) {
        uiRenderer.renderEntityInspector();
      }
    }
    
    // Debug grid for playing state
    if (gameState === 'PLAYING' && drawDebugGrid) {
      if (g_gridMap) {
        drawDebugGrid(TILE_SIZE, g_gridMap.width, g_gridMap.height);
      }
    }

         // Render existing debug console if active
    if (isCommandLineActive()) {
      drawCommandLine();
    }
  }
  
  /**
   * MENU UI LAYER - Menu system and transitions
   */
  renderMenuUILayer(gameState) {
    // Handle Kanban presentation state
    if (gameState === 'KANBAN') {
      if (typeof renderKanbanPresentation !== 'undefined') {
        renderKanbanPresentation();
      } else {
        // Fallback rendering if PresentationPanel.js not loaded
        background(20, 20, 30);
        fill(255, 0, 0);
        textAlign(LEFT, TOP);
        textSize(24);
        text('05:00', 20, 20);
        
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(32);
        text('Presentation', width / 2, height / 2);
      }
      return;
    }
    
    // Use comprehensive UI renderer for menu states
    const uiRenderer = (typeof window !== 'undefined') ? window.UIRenderer : 
                      (typeof global !== 'undefined') ? global.UIRenderer : null;
    
    if (uiRenderer && ['MAIN_MENU', 'OPTIONS', 'SETTINGS', 'DEBUG_MENU', 'GAME_OVER'].includes(gameState)) {
      uiRenderer.renderUI(gameState);
    } else {
      // Fallback to legacy menu rendering
      if (updateMenu) {
        updateMenu();
      }
      
      // Render menu if in menu states
      if (['MENU', 'OPTIONS', 'DEBUG_MENU', 'GAME_OVER'].includes(gameState)) {
        if (renderMenu) {
          renderMenu();
        }
      }
    }
    
    // Render Sprint 5 image overlay if enabled and in MENU state
    if (gameState === 'MENU' && typeof renderSprintImageInMenu !== 'undefined') {
      renderSprintImageInMenu();
    }
  }
  
  /**
   * Pause overlay rendering
   */
  renderPauseOverlay() {
    /*
    fill(0, 0, 0, 150);
    rect(0, 0, g_canvasX, g_canvasY);
    
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(48);
    text("PAUSED", g_canvasX / 2, g_canvasY / 2);
    textSize(24);
    text("Press ESC to resume", g_canvasX / 2, g_canvasY / 2 + 60);
    */
  }
  
  /**
   * Game over overlay rendering
   */
  renderGameOverOverlay() {
    fill(0, 0, 0, 180);
    rect(0, 0, g_canvasX, g_canvasY);
    
    fill(255, 100, 100);
    textAlign(CENTER, CENTER);
    textSize(64);
    text("GAME OVER", g_canvasX / 2, g_canvasY / 2 - 50);
    
    fill(255);
    textSize(24);
    text("Press R to restart or ESC for menu", g_canvasX / 2, g_canvasY / 2 + 50);
  }
  
  /**
   * Invalidate terrain cache (call when terrain changes)
   */
  invalidateTerrainCache() {
    this.cacheStatus.terrainCacheValid = false;
    this.cacheStatus.lastTerrainUpdate = Date.now();
  }
  
  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    return {
      ...this.renderStats,
      avgFrameTime: this.renderStats.frameCount > 0 ? 
        Object.values(this.renderStats.layerTimes).reduce((a, b) => a + b, 0) / this.renderStats.frameCount : 0
    };
  }
  
  /**
   * Reset performance tracking
   */
  resetStats() {
    this.renderStats = {
      frameCount: 0,
      lastFrameTime: 0,
      layerTimes: {}
    };
  }
  
  /**
   * Render Universal Button Group System
   * Integrated into the UI rendering pipeline
   * @private
   */
  renderButtonGroups(gameState) {
    // Only render buttons in appropriate game states (including MENU for testing)
    if (!['PLAYING', 'PAUSED', 'GAME_OVER', 'MENU', 'DEBUG_MENU'].includes(gameState)) {
      return;
    }
    
    // Check if Universal Button Group System is available
    if (window.buttonGroupManager && 
        typeof window.buttonGroupManager.render === 'function') {
      
      try {
        // Set up state bridge for button groups (uppercase -> lowercase conversion)
        const stateMapping = {
          'PLAYING': 'playing',
          'PAUSED': 'paused',
          'GAME_OVER': 'gameOver',
          'MENU': 'menu',
          'DEBUG_MENU': 'debug'
        };
        
        // Set the current game state for button group conditions
        window.currentGameState = stateMapping[gameState] || gameState.toLowerCase();
        window.gameState = window.currentGameState; // Fallback
        
        // Debug logging (can be removed later)

        
        // Render the button groups on top of other UI elements
        window.buttonGroupManager.render({
          gameState: gameState,
          layerName: 'ui_game',
          zIndex: 1000 // Ensure buttons render on top
        });
      } catch (error) {
        console.error('❌ Error rendering button groups in UI layer:', error);
      }
    }
  }
  
  /**
   * Toggle a specific render layer on/off
   * @param {string} layerName - The layer to toggle
   */
  toggleLayer(layerName) {
    if (this.disabledLayers.has(layerName)) {
      this.disabledLayers.delete(layerName);
    } else {
      this.disabledLayers.add(layerName);
    }
    return !this.disabledLayers.has(layerName);
  }
  
  /**
   * Enable a specific render layer
   * @param {string} layerName - The layer to enable
   * @returns {boolean} True if layer is now enabled
   */
  enableLayer(layerName) {
    if (this.disabledLayers.has(layerName)) {
      this.disabledLayers.delete(layerName);
    }
    return true; // Layer is now enabled
  }
  
  /**
   * Disable a specific render layer
   * @param {string} layerName - The layer to disable
   * @returns {boolean} True if layer is now disabled
   */
  disableLayer(layerName) {
    if (!this.disabledLayers.has(layerName)) {
      this.disabledLayers.add(layerName);
    }
    return false; // Layer is now disabled (returns the enabled state)
  }
  
  /**
   * Check if a layer is enabled
   * @param {string} layerName - The layer to check
   * @returns {boolean} True if layer is enabled
   */
  isLayerEnabled(layerName) {
    return !this.disabledLayers.has(layerName);
  }
  
  /**
   * Get current layer toggle states for debugging
   * @returns {Object} Layer states
   */
  getLayerStates() {
    const states = {};
    Object.values(this.layers).forEach(layer => {
      states[layer] = this.isLayerEnabled(layer);
    });
    return states;
  }
  
  /**
   * Reset all layers to enabled
   */
  enableAllLayers() {
    this.disabledLayers.clear();
  }
}


function renderPipelineInit() {
// UI Debug System initialization
  // Create global UI Debug Manager instance
  // Disabled to avoid conflicts with other UI systems
  //
  window.g_uiDebugManager = new UIDebugManager();
  g_uiDebugManager = window.g_uiDebugManager; // Make globally available
  
  // Initialize dropoff UI if present (creates the Place Dropoff button)
  //window.initDropoffUI();

  // Seed at least one set of resources so the field isn't empty if interval hasn't fired yet
  try {
      if (g_resourceManager && typeof g_resourceManager.forceSpawn === 'function') {
        g_resourceManager.forceSpawn();
      }
  } catch (e) { /* non-fatal; spawner will populate via interval */ }
  
  // Initialize Draggable Panel System
  initializeDraggablePanelSystem();
  
  // Initialize ant control panel for spawning and state management
  if (typeof initializeAntControlPanel !== 'undefined') {
    initializeAntControlPanel();
  }
  
  // Initialize UI Selection Controller for effects layer selection box
  // This must happen after RenderManager.initialize() creates the EffectsRenderer
  if (UISelectionController && window.EffectsRenderer) {
    g_uiSelectionController = new UISelectionController(window.EffectsRenderer, g_mouseController);
  }
}


// Create global instance
const RenderManager = new RenderLayerManager();

// Create global variable for compatibility
if (typeof window !== 'undefined') {
  window.g_renderLayerManager = RenderManager;
} else if (typeof global !== 'undefined') {
  global.g_renderLayerManager = RenderManager;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RenderLayerManager, RenderManager };
}