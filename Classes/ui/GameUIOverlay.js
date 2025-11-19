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
    this.antCountDisplay = null;
    
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
   * @param {Object} [config.antCountDisplay] - AntCountDisplay config
   * @param {number} [config.antCountDisplay.x=10] - X position
   * @param {number} [config.antCountDisplay.y=120] - Y position
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
    // Center ResourceDisplay horizontally at top of screen
    const resourceX = resourceConfig.x !== undefined ? resourceConfig.x : (typeof width !== 'undefined' ? width / 2 - 120 : 10);
    const resourceY = resourceConfig.y !== undefined ? resourceConfig.y : 10;

    // Load ant sprites from spriteMapping (before creating components)
    const antSprites = this._loadAntSprites();
    const resourceSprites = this._loadResourceSprites();
    
    // Create ResourceDisplayComponent with resource sprites
    this.resourceDisplay = this._createResourceDisplay(resourceX, resourceY, factionId, resourceSprites);
    this.components.push(this.resourceDisplay);

    // Create AntCountDisplayComponent with all ant sprites
    const antCountConfig = config.antCountDisplay || {};
    const antCountX = antCountConfig.x !== undefined ? antCountConfig.x : 10;
    const antCountY = antCountConfig.y !== undefined ? antCountConfig.y : 120;
    this.antCountDisplay = this._createAntCountDisplay(antCountX, antCountY, antSprites);
    this.components.push(this.antCountDisplay);

    // Register with RenderLayerManager if available
    if (this.renderManager) {
      this._registerRenderers();
    }

    this.initialized = true;
  }

  /**
   * Create ResourceDisplayComponent
   * @private
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} factionId - Faction identifier
   * @param {Object} resourceSprites - Resource sprites (food, wood, stone)
   */
  _createResourceDisplay(x, y, factionId, resourceSprites) {
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

    // Create component with EventManager integration and resource sprites
    return new ResourceDisplayComponent(x, y, factionId, {
      eventManager: this.eventManager,
      sprites: resourceSprites
    });
  }

  /**
   * Load ant sprites from sprite paths
   * @private
   * @returns {Object} Loaded sprites for each ant type
   */
  _loadAntSprites() {
    const sprites = {};
    
    // Load using p5.js loadImage if available
    if (typeof loadImage !== 'undefined') {
      try {
        sprites.worker = loadImage('Images/Ants/gray_ant.png');
        sprites.builder = loadImage('Images/Ants/gray_ant_builder.png');
        sprites.farmer = loadImage('Images/Ants/gray_ant_farmer.png');
        sprites.scout = loadImage('Images/Ants/gray_ant_scout.png');
        sprites.soldier = loadImage('Images/Ants/gray_ant_soldier.png');
        sprites.spitter = loadImage('Images/Ants/gray_ant_spitter.png');
        sprites.queen = loadImage('Images/Ants/gray_ant_queen.png');
      } catch (e) {
        console.warn('[GameUIOverlay] Failed to load ant sprites:', e);
      }
    }
    
    return sprites;
  }
  
  /**
   * Load resource sprites from sprite paths
   * @private
   * @returns {Object} Loaded sprites for resources (food, wood, stone)
   */
  _loadResourceSprites() {
    const sprites = {};
    
    // Load using p5.js loadImage if available
    if (typeof loadImage !== 'undefined') {
      try {
        sprites.food = loadImage('Images/Resources/mapleLeaf.png');
        sprites.wood = loadImage('Images/Resources/twig_1.png');
        sprites.stone = loadImage('Images/Resources/stone.png');
      } catch (e) {
        console.warn('[GameUIOverlay] Failed to load resource sprites:', e);
      }
    }
    
    return sprites;
  }

  /**
   * Create AntCountDisplayComponent
   * @private
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} sprites - Loaded ant sprites
   */
  _createAntCountDisplay(x, y, sprites = {}) {
    // Load AntCountDisplayComponent class
    let AntCountDisplayComponent;
    if (typeof window !== 'undefined' && window.AntCountDisplayComponent) {
      AntCountDisplayComponent = window.AntCountDisplayComponent;
    } else if (typeof require !== 'undefined') {
      AntCountDisplayComponent = require('./AntCountDisplayComponent.js');
    }

    if (!AntCountDisplayComponent) {
      throw new Error('AntCountDisplayComponent not available');
    }

    // Get EntityManager instance
    let EntityManager;
    if (typeof window !== 'undefined' && window.EntityManager) {
      EntityManager = window.EntityManager;
    } else if (typeof require !== 'undefined') {
      EntityManager = require('../mvc/managers/EntityManager.js');
    }

    const entityManager = EntityManager ? EntityManager.getInstance() : null;

    // Create component with EventManager and EntityManager integration
    return new AntCountDisplayComponent(x, y, {
      eventManager: this.eventManager,
      entityManager: entityManager,
      sprites: sprites
    });
  }

  /**
   * Register component renderers with RenderLayerManager
   * @private
   */
  _registerRenderers() {
    if (!this.renderManager) return;

    // Register ResourceDisplayComponent renderer
    if (this.resourceDisplay) {
      const resourceRenderFn = () => {
        if (this.resourceDisplay && this.resourceDisplay.render) {
          this.resourceDisplay.render('PLAYING');
        }
      };

      this.renderManager.addDrawableToLayer(
        this.renderManager.layers.UI_GAME,
        resourceRenderFn
      );

      this._drawableFunctions.push({
        layer: this.renderManager.layers.UI_GAME,
        fn: resourceRenderFn
      });
    }

    // Register AntCountDisplayComponent renderer
    if (this.antCountDisplay) {
      const antCountRenderFn = () => {
        if (this.antCountDisplay && this.antCountDisplay.render) {
          this.antCountDisplay.render('PLAYING');
        }
      };

      this.renderManager.addDrawableToLayer(
        this.renderManager.layers.UI_GAME,
        antCountRenderFn
      );

      this._drawableFunctions.push({
        layer: this.renderManager.layers.UI_GAME,
        fn: antCountRenderFn
      });
    }
  }

  /**
   * Update all components (called per frame)
   * @param {number} [deltaTime] - Time since last frame in milliseconds
   */
  update(deltaTime) {
    if (!this.initialized) return;

    // Update AntCountDisplay (queries EntityManager each frame)
    if (this.antCountDisplay && this.antCountDisplay.update) {
      this.antCountDisplay.update();
    }
    
    // Check hover state for AntCountDisplay
    if (this.antCountDisplay && typeof mouseX !== 'undefined' && typeof mouseY !== 'undefined') {
      const isHovering = this.antCountDisplay.isMouseOver(mouseX, mouseY);
      this.antCountDisplay.setHovered(isHovering);
    }

    // ResourceDisplayComponent is event-driven (no per-frame updates needed)
  }
  
  /**
   * Handle mouse clicks for interactive UI
   * @param {number} mx - Mouse X position
   * @param {number} my - Mouse Y position
   * @returns {boolean} True if any component handled the click
   */
  handleClick(mx, my) {
    if (!this.initialized) return false;
    
    // Check AntCountDisplay first (it's on top)
    if (this.antCountDisplay && typeof this.antCountDisplay.handleClick === 'function') {
      if (this.antCountDisplay.handleClick(mx, my)) {
        return true;
      }
    }
    
    return false;
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
    this.antCountDisplay = null;

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
