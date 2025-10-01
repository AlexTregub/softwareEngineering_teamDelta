// RenderLayerManager - Centralized layered rendering system
class RenderLayerManager {
  constructor() {
    // Rendering layers in order (bottom to top)
    this.layers = {
      TERRAIN: 'terrain',      // Static terrain, cached
      ENTITIES: 'entities',    // Dynamic game objects (ants, resources)
      UI_GAME: 'ui_game',     // In-game UI (currencies, selection, dropoff)
      UI_DEBUG: 'ui_debug',   // Debug overlays (console, performance)
      UI_MENU: 'ui_menu'      // Menu system and transitions
    };
    
    // Layer rendering functions
    this.layerRenderers = new Map();
    
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
    this.registerLayerRenderer(this.layers.UI_GAME, this.renderGameUILayer.bind(this));
    this.registerLayerRenderer(this.layers.UI_DEBUG, this.renderDebugUILayer.bind(this));
    this.registerLayerRenderer(this.layers.UI_MENU, this.renderMenuUILayer.bind(this));
    
    this.isInitialized = true;
    console.log('RenderLayerManager initialized');
  }
  
  /**
   * Register a custom renderer for a specific layer
   */
  registerLayerRenderer(layerName, rendererFunction) {
    this.layerRenderers.set(layerName, rendererFunction);
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
    
    // Render each layer in order
    for (const layerName of layersToRender) {
      const layerStart = performance.now();
      
      const renderer = this.layerRenderers.get(layerName);
      if (renderer) {
        try {
          renderer(gameState);
        } catch (error) {
          console.error(`Error rendering layer ${layerName}:`, error);
        }
      }
      
      const layerEnd = performance.now();
      this.renderStats.layerTimes[layerName] = layerEnd - layerStart;
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
        
      case 'DEBUG_MENU':
        return [this.layers.TERRAIN, this.layers.ENTITIES, this.layers.UI_DEBUG, this.layers.UI_MENU];
        
      case 'PLAYING':
        return [this.layers.TERRAIN, this.layers.ENTITIES, this.layers.UI_GAME, this.layers.UI_DEBUG];
        
      case 'PAUSED':
        return [this.layers.TERRAIN, this.layers.ENTITIES, this.layers.UI_GAME];
        
      case 'GAME_OVER':
        return [this.layers.TERRAIN, this.layers.ENTITIES, this.layers.UI_GAME, this.layers.UI_MENU];
        
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
    
    // Use the existing terrain rendering system
    if (typeof g_map2 !== 'undefined' && g_map2 && typeof g_map2.render === 'function') {
      g_map2.render();
    }
  }
  
  /**
   * ENTITIES LAYER - Dynamic game objects
   */
  renderEntitiesLayer(gameState) {
    // Only render entities during gameplay states
    if (!['PLAYING', 'PAUSED', 'GAME_OVER', 'DEBUG_MENU'].includes(gameState)) {
      return;
    }
    
    // Use enhanced entity layer renderer if available
    if (typeof EntityRenderer !== 'undefined' && EntityRenderer) {
      EntityRenderer.renderAllLayers(gameState);
    } else {
      // Fallback to direct rendering
      this.renderEntitiesDirectFallback(gameState);
    }
  }
  
  /**
   * Fallback entity rendering for when EntityRenderer is not available
   * @private
   */
  renderEntitiesDirectFallback(gameState) {
    // Render resources
    if (typeof g_resourceList !== 'undefined' && g_resourceList) {
      if (gameState === 'PLAYING' && typeof g_resourceList.updateAll === 'function') {
        g_resourceList.updateAll();
      }
      if (typeof g_resourceList.drawAll === 'function') {
        g_resourceList.drawAll();
      }
    }
    
    // Render ants
    if (gameState === 'PLAYING') {
      // Update and render ants
      if (typeof antsUpdate === 'function') {
        antsUpdate();
      }
    } else {
      // Just render ants without updates for paused/game over states
      if (typeof antsRender === 'function') {
        antsRender();
      } else if (typeof antsUpdateAndRender === 'function') {
        // Fallback to combined function
        antsUpdateAndRender();
      }
    }
  }
  
  /**
   * GAME UI LAYER - In-game interface elements
   */
  renderGameUILayer(gameState) {
    if (!['PLAYING', 'PAUSED', 'GAME_OVER'].includes(gameState)) {
      return;
    }
    
    // Render base game UI elements
    this.renderBaseGameUI();
    
    // Render interaction UI elements
    this.renderInteractionUI(gameState);
    
    // Render state-specific overlays
    if (gameState === 'PAUSED') {
      this.renderPauseOverlay();
    } else if (gameState === 'GAME_OVER') {
      this.renderGameOverOverlay();
    }
  }
  
  /**
   * Render base game UI elements (currencies, selection)
   * @private
   */
  renderBaseGameUI() {
    // Render currencies
    if (typeof renderCurrencies === 'function') {
      renderCurrencies();
    }
    
    // Selection box
    if (typeof g_selectionBoxController !== 'undefined' && g_selectionBoxController) {
      g_selectionBoxController.draw();
    }
    
    // Recording indicator
    if (typeof g_recordingPath !== 'undefined' && g_recordingPath) {
      // Recording logic here if needed
      this.renderRecordingIndicator();
    }
  }
  
  /**
   * Render interaction UI elements (dropoff, spawn)
   * @private
   */
  renderInteractionUI(gameState) {
    // Only show interaction UI during active gameplay
    if (gameState !== 'PLAYING') return;
    
    // Dropoff UI
    if (typeof window !== 'undefined') {
      if (typeof window.updateDropoffUI === 'function') {
        window.updateDropoffUI();
      }
      if (typeof window.drawDropoffUI === 'function') {
        window.drawDropoffUI();
      }
    }
    
    // Spawn UI (development/debug tool)
    if (typeof window.renderSpawnUI === 'function') {
      window.renderSpawnUI();
    }
  }
  
  /**
   * Render recording indicator
   * @private
   */
  renderRecordingIndicator() {
    fill(255, 0, 0);
    textAlign(LEFT, TOP);
    textSize(16);
    text("● REC", 10, 10);
  }
  
  /**
   * DEBUG UI LAYER - Development overlays
   */
  renderDebugUILayer(gameState) {
    // Debug elements can appear in any state except pure menu
    if (gameState === 'MENU' || gameState === 'OPTIONS') {
      return;
    }
    
    if (typeof debugRender === 'function') {
      debugRender();
    }
    
    // Debug grid for playing state
    if (gameState === 'PLAYING' && typeof drawDebugGrid === 'function') {
      if (typeof g_gridMap !== 'undefined' && g_gridMap) {
        drawDebugGrid(TILE_SIZE, g_gridMap.width, g_gridMap.height);
      }
    }
  }
  
  /**
   * MENU UI LAYER - Menu system and transitions
   */
  renderMenuUILayer(gameState) {
    // Update menu state
    if (typeof updateMenu === 'function') {
      updateMenu();
    }
    
    // Render menu if in menu states
    if (['MENU', 'OPTIONS', 'DEBUG_MENU', 'GAME_OVER'].includes(gameState)) {
      if (typeof renderMenu === 'function') {
        renderMenu();
      }
    }
  }
  
  /**
   * Pause overlay rendering
   */
  renderPauseOverlay() {
    fill(0, 0, 0, 150);
    rect(0, 0, g_canvasX, g_canvasY);
    
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(48);
    text("PAUSED", g_canvasX / 2, g_canvasY / 2);
    textSize(24);
    text("Press ESC to resume", g_canvasX / 2, g_canvasY / 2 + 60);
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
}

// Create global instance
const RenderManager = new RenderLayerManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RenderLayerManager, RenderManager };
}