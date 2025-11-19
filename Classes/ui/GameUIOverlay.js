/**
 * GameUIOverlay - UI Orchestrator
 * ================================
 * TDD Phase 7: Manages lifecycle of UI components
 * 
 * Responsibilities:
 * - Creates and initializes UI components (ResourceDisplayComponent, etc.)
 * - Registers components with RenderLayerManager
 * - Manages EventManager integration
 * - Handles component lifecycle (init, update, destroy)
 * - Provides centralized UI management
 * 
 * @class GameUIOverlay
 */

console.log('Loading GameUIOverlay.js');

class GameUIOverlay {
  /**
   * Create a GameUIOverlay
   * @param {Object} options - Configuration options
   * @param {EventManager} [options.eventManager] - EventManager instance for event integration
   * @param {RenderLayerManager} [options.renderManager] - RenderLayerManager for rendering
   */
  constructor(options = {}) {
    // Store manager references
    this.eventManager = options.eventManager;
    this.renderManager = options.renderManager;
    
    // Component storage
    this.components = [];
    this.resourceDisplay = null;
    
    // Lifecycle state
    this.initialized = false;
    
    // Track drawable functions for cleanup
    this._drawableFunctions = [];
  }

  /**
   * Initialize all UI components
   * @param {Object} [config={}] - Configuration for components
   * @param {string} [config.factionId='player'] - Faction identifier
   * @param {Object} [config.resourceDisplay] - ResourceDisplay config
   * @param {number} [config.resourceDisplay.x=10] - X position
   * @param {number} [config.resourceDisplay.y=10] - Y position
   */
  initialize(config = {}) {
    // Prevent re-initialization
    if (this.initialized) {
      if (typeof logWarn === 'function') {
        logWarn('[GameUIOverlay] Already initialized, skipping re-initialization');
      }
      return;
    }

    const factionId = config.factionId || 'player';
    const resourceConfig = config.resourceDisplay || {};
    const x = resourceConfig.x !== undefined ? resourceConfig.x : 10;
    const y = resourceConfig.y !== undefined ? resourceConfig.y : 10;

    // Create ResourceDisplayComponent
    this.resourceDisplay = this._createResourceDisplay(x, y, factionId);
    this.components.push(this.resourceDisplay);

    // Register with RenderLayerManager if available
    if (this.renderManager) {
      this._registerRenderers();
    }

    this.initialized = true;
  }

  /**
   * Create ResourceDisplayComponent
   * @private
   */
  _createResourceDisplay(x, y, factionId) {
    // Load ResourceDisplayComponent class
    let ResourceDisplayComponent;
    if (typeof window !== 'undefined' && window.ResourceDisplayComponent) {
      ResourceDisplayComponent = window.ResourceDisplayComponent;
    } else if (typeof require !== 'undefined') {
      ResourceDisplayComponent = require('./ResourceDisplayComponent.js');
    }

    if (!ResourceDisplayComponent) {
      throw new Error('ResourceDisplayComponent not available');
    }

    // Create component with EventManager integration
    return new ResourceDisplayComponent(x, y, factionId, {
      eventManager: this.eventManager
    });
  }

  /**
   * Register component renderers with RenderLayerManager
   * @private
   */
  _registerRenderers() {
    if (!this.renderManager || !this.resourceDisplay) return;

    // Register ResourceDisplayComponent renderer
    const renderFn = () => {
      if (this.resourceDisplay && this.resourceDisplay.render) {
        this.resourceDisplay.render('PLAYING');
      }
    };

    this.renderManager.addDrawableToLayer(
      this.renderManager.layers.UI_GAME,
      renderFn
    );

    // Store for cleanup
    this._drawableFunctions.push({
      layer: this.renderManager.layers.UI_GAME,
      fn: renderFn
    });
  }

  /**
   * Update all components (called per frame)
   * @param {number} [deltaTime] - Time since last frame in milliseconds
   */
  update(deltaTime) {
    if (!this.initialized) return;

    // Future: Update components that need per-frame updates
    // Currently, ResourceDisplayComponent is event-driven (no per-frame updates needed)
  }

  /**
   * Cleanup and destroy all components
   */
  destroy() {
    // Unregister from RenderLayerManager
    if (this.renderManager) {
      this._drawableFunctions.forEach(({ layer, fn }) => {
        this.renderManager.removeDrawableFromLayer(layer, fn);
      });
      this._drawableFunctions = [];
    }

    // Destroy all components
    this.components.forEach(component => {
      if (component && component.destroy) {
        component.destroy();
      }
    });

    // Clear component references
    this.components = [];
    this.resourceDisplay = null;

    // Reset state
    this.initialized = false;

    if (typeof console.log === 'function') {
      console.log('[GameUIOverlay] Destroyed and cleaned up');
    }
  }
}

// Export for Node.js (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameUIOverlay;
}

// Export for browser (global)
if (typeof window !== 'undefined') {
  window.GameUIOverlay = GameUIOverlay;
}
