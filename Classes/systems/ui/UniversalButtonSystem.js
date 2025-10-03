/**
 * @fileoverview UniversalButtonSystem - Main Integration Layer
 * Integrates all components of the Universal Button Group System with the existing game engine
 * Provides unified API for button management, rendering, and interaction
 * 
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 */

// All system components should be loaded via script tags in index.html
// ButtonGroupManager, ButtonGroupConfigLoader, UIQuadTree, UIObjectPoolManager, UIVisibilityCuller
// are all loaded via index.html script tags

/**
 * Universal Button System - Main integration class
 * Coordinates all components and provides unified API
 */
class UniversalButtonSystem {
  /**
   * Creates a new Universal Button System instance
   * 
   * @param {Object} options - System configuration options
   */
  constructor(options = {}) {
    this.options = {
      // Performance settings
      enableQuadTree: options.enableQuadTree !== false,
      enableObjectPooling: options.enableObjectPooling !== false,
      enableVisibilityCulling: options.enableVisibilityCulling !== false,
      
      // Integration settings
      autoInitialize: options.autoInitialize !== false,
      configPath: options.configPath || './config/button-system.json',
      
      // Rendering settings
      enableDebugRendering: options.enableDebugRendering || false,
      renderPriority: options.renderPriority || 100,
      
      // Canvas settings
      canvasWidth: options.canvasWidth || 1200,
      canvasHeight: options.canvasHeight || 800,
      
      // Debug and development
      debugMode: options.debugMode || false,
      enableStatistics: options.enableStatistics !== false,
      
      ...options
    };

    // System state
    this.isInitialized = false;
    this.currentGameState = 'menu';
    this.isPaused = false;
    this.lastUpdateTime = 0;
    this.lastRenderTime = 0;

    // Core components (will be initialized)
    this.configLoader = null;
    this.buttonManager = null;
    this.quadTree = null;
    this.objectPoolManager = null;
    this.visibilityCuller = null;
    this.actionFactory = null;

    // Performance tracking
    this.statistics = {
      updateTime: 0,
      renderTime: 0,
      activeGroups: 0,
      visibleGroups: 0,
      totalButtons: 0,
      frameCount: 0,
      averageFPS: 0,
      fpsHistory: []
    };

    // Integration hooks
    this.renderHooks = [];
    this.updateHooks = [];
    this.stateChangeHooks = [];

    // Auto-initialize if enabled
    if (this.options.autoInitialize) {
      this.initialize().catch(error => {
        console.error('Universal Button System auto-initialization failed:', error);
      });
    }
  }

  /**
   * Initialize the Universal Button System
   * 
   * @param {Object} actionFactory - Factory for executing button actions
   * @returns {Promise<Object>} Initialization results
   */
  async initialize(actionFactory = null) {
    if (this.isInitialized) {
      throw new Error('Universal Button System is already initialized');
    }

    try {
      // Set up action factory
      this.actionFactory = actionFactory || this.createDefaultActionFactory();

      // Initialize configuration loader
      this.configLoader = new ButtonGroupConfigLoader({
        basePath: this.options.configPath.substring(0, this.options.configPath.lastIndexOf('/')),
        enableCaching: true,
        enableValidation: true,
        debugMode: this.options.debugMode
      });

      const configResults = await this.configLoader.initialize(this.options.configPath);

      // Initialize button group manager
      this.buttonManager = new ButtonGroupManager(this.actionFactory, {
        enableCulling: this.options.enableVisibilityCulling,
        canvasWidth: this.options.canvasWidth,
        canvasHeight: this.options.canvasHeight,
        debugMode: this.options.debugMode
      });

      // Initialize performance optimizations
      if (this.options.enableQuadTree) {
        this.quadTree = new UIQuadTree(
          { x: 0, y: 0, width: this.options.canvasWidth, height: this.options.canvasHeight },
          {
            maxObjects: 10,
            maxLevels: 5,
            enableDebug: this.options.enableDebugRendering
          }
        );
      }

      if (this.options.enableObjectPooling) {
        this.objectPoolManager = new UIObjectPoolManager({
          enableDebug: this.options.debugMode,
          buttonPool: { initialSize: 20, maxSize: 200 },
          eventPool: { initialSize: 50, maxSize: 500 }
        });
      }

      if (this.options.enableVisibilityCulling) {
        this.visibilityCuller = new UIVisibilityCuller({
          enableDistanceCulling: true,
          maxRenderDistance: 2000,
          enableFrustumCulling: true,
          debugMode: this.options.enableDebugRendering
        });

        // Set initial viewport
        this.visibilityCuller.updateViewport(0, 0, this.options.canvasWidth, this.options.canvasHeight);
      }

      // Load initial button groups for current state
      await this.loadButtonGroupsForState(this.currentGameState);

      this.isInitialized = true;

      // Notify hooks
      this.triggerStateChangeHooks('initialized', null, this.currentGameState);

      return {
        success: true,
        configResults: configResults,
        componentsInitialized: {
          configLoader: !!this.configLoader,
          buttonManager: !!this.buttonManager,
          quadTree: !!this.quadTree,
          objectPoolManager: !!this.objectPoolManager,
          visibilityCuller: !!this.visibilityCuller
        },
        initialGroups: this.buttonManager.getActiveGroupCount()
      };

    } catch (error) {
      throw new Error(`Failed to initialize Universal Button System: ${error.message}`);
    }
  }

  /**
   * Create a default action factory if none provided
   * 
   * @returns {Object} Default action factory
   */
  createDefaultActionFactory() {
    return {
      executeAction: (buttonConfig, gameContext) => {
        if (this.options.debugMode) {
          console.log('🎯 Default Action Factory:', buttonConfig.action, gameContext);
        }
        
        // Handle basic action types
        const actionType = buttonConfig.action?.type;
        const handler = buttonConfig.action?.handler;
        
        switch (actionType) {
          case 'gameState':
            return this.handleGameStateAction(handler, buttonConfig.action.parameters);
          
          case 'ui':
            return this.handleUIAction(handler, buttonConfig.action.parameters);
          
          case 'debug':
            return this.handleDebugAction(handler, buttonConfig.action.parameters);
          
          default:
            console.warn(`Unhandled action type: ${actionType}`);
            return false;
        }
      }
    };
  }

  /**
   * Handle game state actions
   * 
   * @param {string} handler - Action handler name
   * @param {Object} parameters - Action parameters
   * @returns {boolean} Success status
   */
  handleGameStateAction(handler, parameters = {}) {
    switch (handler) {
      case 'game.start':
        return this.changeGameState('playing');
      
      case 'game.pause':
      case 'game.togglePause':
        this.isPaused = !this.isPaused;
        return true;
      
      case 'game.save':
        return this.saveAllButtonGroups();
      
      case 'game.load':
        return this.loadAllButtonGroups();
      
      case 'game.exit':
        return this.shutdown();
      
      default:
        console.warn(`Unhandled game state action: ${handler}`);
        return false;
    }
  }

  /**
   * Handle UI actions
   * 
   * @param {string} handler - Action handler name
   * @param {Object} parameters - Action parameters
   * @returns {boolean} Success status
   */
  handleUIAction(handler, parameters = {}) {
    switch (handler) {
      case 'menu.showSettings':
      case 'ui.showSettings':
        return this.changeGameState('settings');
      
      case 'ui.showGameMenu':
        return this.changeGameState('menu');
      
      case 'ui.cancelSettings':
        return this.changeGameState('menu');
      
      default:
        console.warn(`Unhandled UI action: ${handler}`);
        return false;
    }
  }

  /**
   * Handle debug actions
   * 
   * @param {string} handler - Action handler name
   * @param {Object} parameters - Action parameters
   * @returns {boolean} Success status
   */
  handleDebugAction(handler, parameters = {}) {
    if (!this.options.debugMode) {
      return false;
    }

    switch (handler) {
      case 'debug.toggleGrid':
        console.log('Debug: Grid display toggled');
        return true;
      
      case 'debug.toggleFPS':
        console.log('Debug: FPS display toggled');
        return true;
      
      case 'debug.spawnAnt':
        console.log('Debug: Spawning test ant');
        return true;
      
      default:
        console.warn(`Unhandled debug action: ${handler}`);
        return false;
    }
  }

  /**
   * Change the current game state
   * 
   * @param {string} newState - New game state
   * @returns {boolean} Success status
   */
  async changeGameState(newState) {
    if (!this.isInitialized) {
      console.warn('Cannot change game state: system not initialized');
      return false;
    }

    const oldState = this.currentGameState;
    
    try {
      // Load button groups for new state
      await this.loadButtonGroupsForState(newState);
      
      this.currentGameState = newState;
      
      // Trigger state change hooks
      this.triggerStateChangeHooks('stateChanged', oldState, newState);
      
      if (this.options.debugMode) {
        console.log(`🎮 Game state changed: ${oldState} → ${newState}`);
      }
      
      return true;
      
    } catch (error) {
      console.error(`Failed to change game state to ${newState}:`, error);
      return false;
    }
  }

  /**
   * Load button groups for a specific game state
   * 
   * @param {string} gameState - Game state to load groups for
   */
  async loadButtonGroupsForState(gameState) {
    if (!this.configLoader) {
      throw new Error('Configuration loader not initialized');
    }

    // Get button groups for the state
    const buttonGroups = this.configLoader.getButtonGroupsForState(gameState);
    
    // Clear existing groups that don't belong to this state
    const activeGroups = this.buttonManager.getAllActiveGroups();
    for (const group of activeGroups) {
      const shouldKeep = buttonGroups.some(bg => bg.id === group.getId());
      if (!shouldKeep) {
        this.buttonManager.removeButtonGroup(group.getId());
      }
    }

    // Add new groups for this state
    for (const groupConfig of buttonGroups) {
      if (!this.buttonManager.getButtonGroup(groupConfig.id)) {
        try {
          this.buttonManager.addButtonGroup(groupConfig);
        } catch (error) {
          console.error(`Failed to add button group ${groupConfig.id}:`, error);
        }
      }
    }

    // Update spatial partitioning if enabled
    if (this.quadTree) {
      this.rebuildQuadTree();
    }
  }

  /**
   * Update the system (called every frame)
   * 
   * @param {number} mouseX - Current mouse X position
   * @param {number} mouseY - Current mouse Y position
   * @param {boolean} mousePressed - Whether mouse is pressed
   */
  update(mouseX, mouseY, mousePressed) {
    if (!this.isInitialized || this.isPaused) {
      return;
    }

    const updateStart = performance.now();

    // Handle mouse interaction
    this.handleMouseInteraction(mouseX, mouseY, mousePressed);

    // Update visibility culler frame
    if (this.visibilityCuller) {
      this.visibilityCuller.nextFrame();
    }

    // Update statistics
    this.updateStatistics();

    // Trigger update hooks
    this.triggerUpdateHooks(mouseX, mouseY, mousePressed);

    this.statistics.updateTime = performance.now() - updateStart;
    this.lastUpdateTime = Date.now();
  }

  /**
   * Handle mouse interaction across all button groups
   * 
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   * @param {boolean} mousePressed - Mouse pressed state
   */
  handleMouseInteraction(mouseX, mouseY, mousePressed) {
    // Get visible groups for interaction
    const visibleGroups = this.getVisibleButtonGroups();
    
    // Use spatial partitioning if available
    if (this.quadTree) {
      const nearbyGroups = this.quadTree.queryPoint(mouseX, mouseY);
      const interactionCandidates = nearbyGroups.filter(group => visibleGroups.includes(group));
      
      // Handle interaction with nearby groups only
      for (const group of interactionCandidates) {
        group.update(mouseX, mouseY, mousePressed);
      }
    } else {
      // Fallback to checking all visible groups
      for (const group of visibleGroups) {
        group.update(mouseX, mouseY, mousePressed);
      }
    }
  }

  /**
   * Render the system (called every frame)
   */
  render() {
    if (!this.isInitialized) {
      return;
    }

    const renderStart = performance.now();

    // Get visible button groups
    const visibleGroups = this.getVisibleButtonGroups();

    // Render visible groups
    for (const group of visibleGroups) {
      group.render();
    }

    // Render debug information if enabled
    if (this.options.enableDebugRendering) {
      this.renderDebug();
    }

    // Trigger render hooks
    this.triggerRenderHooks(visibleGroups);

    this.statistics.renderTime = performance.now() - renderStart;
    this.lastRenderTime = Date.now();
  }

  /**
   * Get visible button groups (with culling if enabled)
   * 
   * @returns {Array<ButtonGroup>} Array of visible button groups
   */
  getVisibleButtonGroups() {
    const allGroups = this.buttonManager.getAllActiveGroups();
    
    if (!this.visibilityCuller) {
      return allGroups.filter(group => group.isVisible());
    }

    // Use visibility culling
    const cullingResults = this.visibilityCuller.cullElements(allGroups);
    this.statistics.visibleGroups = cullingResults.visible.length;
    
    return cullingResults.visible;
  }

  /**
   * Rebuild the QuadTree with current button groups
   */
  rebuildQuadTree() {
    if (!this.quadTree) {
      return;
    }

    this.quadTree.clear();
    
    const allGroups = this.buttonManager.getAllActiveGroups();
    for (const group of allGroups) {
      this.quadTree.insertButtonGroup(group);
    }
  }

  /**
   * Update performance statistics
   */
  updateStatistics() {
    this.statistics.frameCount++;
    this.statistics.activeGroups = this.buttonManager ? this.buttonManager.getActiveGroupCount() : 0;
    
    // Calculate total buttons
    if (this.buttonManager) {
      const allGroups = this.buttonManager.getAllActiveGroups();
      this.statistics.totalButtons = allGroups.reduce((total, group) => {
        return total + (group.buttons ? group.buttons.length : 0);
      }, 0);
    }

    // Calculate FPS
    const now = Date.now();
    if (this.lastUpdateTime > 0) {
      const fps = 1000 / (now - this.lastUpdateTime);
      this.statistics.fpsHistory.push(fps);
      
      if (this.statistics.fpsHistory.length > 60) {
        this.statistics.fpsHistory.shift();
      }
      
      this.statistics.averageFPS = 
        this.statistics.fpsHistory.reduce((sum, fps) => sum + fps, 0) / 
        this.statistics.fpsHistory.length;
    }
  }

  /**
   * Render debug information
   */
  renderDebug() {
    // Render QuadTree debug
    if (this.quadTree && this.quadTree.options.enableDebug) {
      this.quadTree.renderDebug();
    }

    // Render visibility culler debug
    if (this.visibilityCuller && this.visibilityCuller.options.debugMode) {
      this.visibilityCuller.renderDebug();
    }

    // Render performance statistics
    this.renderPerformanceInfo();
  }

  /**
   * Render performance information overlay
   */
  renderPerformanceInfo() {
    if (typeof textAlign === 'function' && typeof text === 'function' && typeof fill === 'function') {
      fill(255, 255, 0, 200); // Yellow text
      textAlign(LEFT, TOP);
      textSize(12);
      
      const stats = [
        `FPS: ${this.statistics.averageFPS.toFixed(1)}`,
        `Groups: ${this.statistics.activeGroups} (${this.statistics.visibleGroups} visible)`,
        `Buttons: ${this.statistics.totalButtons}`,
        `Update: ${this.statistics.updateTime.toFixed(2)}ms`,
        `Render: ${this.statistics.renderTime.toFixed(2)}ms`
      ];

      stats.forEach((stat, index) => {
        text(stat, 10, 10 + index * 15);
      });
    }
  }

  /**
   * Save all button group states
   * 
   * @returns {boolean} Success status
   */
  saveAllButtonGroups() {
    if (!this.buttonManager) {
      return false;
    }

    try {
      const result = this.buttonManager.saveAllGroups();
      
      if (this.options.debugMode) {
        console.log(`💾 Saved ${result.successful} button groups, ${result.failed} failed`);
      }
      
      return result.failed === 0;
    } catch (error) {
      console.error('Failed to save button groups:', error);
      return false;
    }
  }

  /**
   * Load all button group states
   * 
   * @returns {boolean} Success status
   */
  loadAllButtonGroups() {
    if (!this.buttonManager) {
      return false;
    }

    try {
      const result = this.buttonManager.loadAllGroups();
      
      if (this.options.debugMode) {
        console.log(`📁 Loaded ${result.successful} button groups, ${result.failed} failed`);
      }
      
      return result.failed === 0;
    } catch (error) {
      console.error('Failed to load button groups:', error);
      return false;
    }
  }

  /**
   * Add a render hook
   * 
   * @param {Function} hook - Hook function to call during render
   */
  addRenderHook(hook) {
    this.renderHooks.push(hook);
  }

  /**
   * Add an update hook
   * 
   * @param {Function} hook - Hook function to call during update
   */
  addUpdateHook(hook) {
    this.updateHooks.push(hook);
  }

  /**
   * Add a state change hook
   * 
   * @param {Function} hook - Hook function to call on state changes
   */
  addStateChangeHook(hook) {
    this.stateChangeHooks.push(hook);
  }

  /**
   * Trigger render hooks
   * 
   * @param {Array} visibleGroups - Currently visible groups
   */
  triggerRenderHooks(visibleGroups) {
    for (const hook of this.renderHooks) {
      try {
        hook(visibleGroups, this.statistics);
      } catch (error) {
        console.error('Render hook error:', error);
      }
    }
  }

  /**
   * Trigger update hooks
   * 
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   * @param {boolean} mousePressed - Mouse pressed state
   */
  triggerUpdateHooks(mouseX, mouseY, mousePressed) {
    for (const hook of this.updateHooks) {
      try {
        hook(mouseX, mouseY, mousePressed, this.statistics);
      } catch (error) {
        console.error('Update hook error:', error);
      }
    }
  }

  /**
   * Trigger state change hooks
   * 
   * @param {string} changeType - Type of state change
   * @param {string} oldState - Previous state
   * @param {string} newState - New state
   */
  triggerStateChangeHooks(changeType, oldState, newState) {
    for (const hook of this.stateChangeHooks) {
      try {
        hook(changeType, oldState, newState);
      } catch (error) {
        console.error('State change hook error:', error);
      }
    }
  }

  /**
   * Get comprehensive system diagnostics
   * 
   * @returns {Object} Diagnostic information
   */
  getDiagnostics() {
    const diagnostics = {
      system: {
        isInitialized: this.isInitialized,
        currentGameState: this.currentGameState,
        isPaused: this.isPaused,
        options: { ...this.options },
        statistics: { ...this.statistics }
      },
      components: {}
    };

    // Add component diagnostics
    if (this.configLoader) {
      diagnostics.components.configLoader = this.configLoader.getDiagnosticInfo();
    }

    if (this.buttonManager) {
      diagnostics.components.buttonManager = this.buttonManager.getDiagnosticInfo();
    }

    if (this.quadTree) {
      diagnostics.components.quadTree = this.quadTree.getDiagnostics();
    }

    if (this.objectPoolManager) {
      diagnostics.components.objectPoolManager = this.objectPoolManager.getDiagnostics();
    }

    if (this.visibilityCuller) {
      diagnostics.components.visibilityCuller = this.visibilityCuller.getDiagnostics();
    }

    return diagnostics;
  }

  /**
   * Shutdown the system and clean up resources
   * 
   * @returns {boolean} Success status
   */
  shutdown() {
    try {
      // Save all groups before shutdown
      if (this.buttonManager) {
        this.buttonManager.saveAllGroups();
        this.buttonManager.shutdown();
      }

      // Clear performance components
      if (this.quadTree) {
        this.quadTree.clear();
      }

      if (this.objectPoolManager) {
        this.objectPoolManager.clearAllPools();
      }

      if (this.visibilityCuller) {
        this.visibilityCuller.invalidateCache();
      }

      // Clear hooks
      this.renderHooks = [];
      this.updateHooks = [];
      this.stateChangeHooks = [];

      this.isInitialized = false;

      if (this.options.debugMode) {
        console.log('🔌 Universal Button System shut down successfully');
      }

      return true;
    } catch (error) {
      console.error('Error during system shutdown:', error);
      return false;
    }
  }

  /**
   * Get the current game state
   * 
   * @returns {string} Current game state
   */
  getCurrentGameState() {
    return this.currentGameState;
  }

  /**
   * Check if the system is initialized
   * 
   * @returns {boolean} True if initialized
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * Get performance statistics
   * 
   * @returns {Object} Performance statistics
   */
  getStatistics() {
    return { ...this.statistics };
  }
}

// Export for browser environments
if (typeof window !== 'undefined') {
  window.UniversalButtonSystem = UniversalButtonSystem;
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UniversalButtonSystem;
}