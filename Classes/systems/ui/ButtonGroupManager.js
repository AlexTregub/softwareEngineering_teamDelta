/**
 * @fileoverview ButtonGroupManager - Master controller for Universal Button Group System
 * Orchestrates multiple button groups, handles configuration loading, and provides unified API
 * Implementation driven by Gherkin/Behave test scenarios
 * 
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 */

// ButtonGroup class should be loaded via script tag in index.html

/**
 * ButtonGroupManager - Central coordinator for multiple button groups
 * Handles JSON configuration, lifecycle management, and interaction coordination
 */
/**
 * NOTE: This file now includes a small, non-invasive interactive adapter
 * wrapper that allows the ButtonGroupManager to register itself with the
 * central `RenderManager` as an interactive drawable. The wrapper is kept
 * inside this class to make migration simple and to avoid scattering
 * adapter files across the repo. The adapter delegates to existing
 * public APIs on this manager (handleClick, update, render) and provides
 * the minimal contract required by RenderManager: hitTest, onPointerDown,
 * onPointerMove, onPointerUp, update, render.
 *
 * Why this approach?
 * - Keeps the adapter colocated with the implementation it wraps.
 * - Minimizes risk during incremental migration (no changes to button
 *   group internals required).
 * - Keeps the runtime API simple: call `buttonGroupManager.registerAsInteractive()`
 *   (or the manager will auto-register itself during initialize()).
 */
class ButtonGroupManager {
  /**
   * Creates a new ButtonGroupManager instance
   * 
   * @param {Object} actionFactory - Factory for executing button actions
   * @param {Object} options - Manager configuration options
   */
  constructor(actionFactory, options = {}) {
    // Validate required dependencies
    if (!actionFactory || typeof actionFactory.executeAction !== 'function') {
      throw new Error('ButtonGroupManager requires a valid actionFactory with executeAction method');
    }

    this.actionFactory = actionFactory;
    this.options = {
      enableCulling: options.enableCulling !== false,
      canvasWidth: options.canvasWidth || 1200,
      canvasHeight: options.canvasHeight || 800,
      debugMode: options.debugMode || false,
      ...options
    };

    // Active button groups registry
    this.activeGroups = new Map();
    this.groupCreationErrors = [];
    this.performanceMetrics = {
      totalGroups: 0,
      renderCallsThisFrame: 0,
      interactionChecksThisFrame: 0
    };

    // State tracking
    this.isInitialized = false;
    this.lastRenderTime = 0;
    this.lastInteractionTime = 0;
  }

  /**
   * Initialize manager with JSON configuration
   * 
   * @param {Object|Array} config - Button group configuration(s)
   * @returns {Object} Initialization results with success/error counts
   */
  initialize(config) {
    if (this.isInitialized) {
      throw new Error('ButtonGroupManager is already initialized');
    }



    this.groupCreationErrors = [];
    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };

    try {
      const configurations = Array.isArray(config) ? config : [config];

      
      for (const groupConfig of configurations) {

        try {
          this.createButtonGroup(groupConfig);
          results.successful++;

        } catch (error) {
          console.error(`❌ Failed to create group ${groupConfig?.id || 'unknown'}:`, error);
          results.failed++;
          results.errors.push({
            groupId: groupConfig?.id || 'unknown',
            error: error.message
          });
          this.groupCreationErrors.push({
            config: groupConfig,
            error: error.message,
            timestamp: Date.now()
          });
        }
      }

      this.isInitialized = true;
      this.performanceMetrics.totalGroups = this.activeGroups.size;

      // Auto-register a minimal interactive adapter with RenderManager so
      // the ButtonGroupManager can receive pointer events via the central
      // interactive system without changing existing APIs. The adapter is
      // intentionally small: it implements hitTest and pointer handlers and
      // delegates to public methods on this manager.
      try {
        if (typeof RenderManager !== 'undefined' && RenderManager && typeof RenderManager.addInteractiveDrawable === 'function') {
          const adapter = {
            hitTest: (pointer) => {
              try {
                // Prefer world coordinates when available (pointer.world), fall back to screen
                const x = pointer.world ? pointer.world.x : pointer.screen.x;
                const y = pointer.world ? pointer.world.y : pointer.screen.y;
                // Check visible groups for bounds
                const groups = this.getAllActiveGroups();
                for (let i = groups.length - 1; i >= 0; i--) {
                  const g = groups[i];
                  if (typeof g.isPointInBounds === 'function' && g.isPointInBounds(x, y)) return true;
                }
              } catch (e) { /* ignore */ }
              return false;
            },
            onPointerDown: (pointer) => {
              try {
                const x = pointer.world ? pointer.world.x : pointer.screen.x;
                const y = pointer.world ? pointer.world.y : pointer.screen.y;
                return !!this.handleClick(x, y);
              } catch (e) { return false; }
            },
            onPointerMove: (pointer) => {
              try {
                const x = pointer.world ? pointer.world.x : pointer.screen.x;
                const y = pointer.world ? pointer.world.y : pointer.screen.y;
                if (typeof this.update === 'function') this.update(x, y, pointer.isPressed === true);
                return false;
              } catch (e) { return false; }
            },
            onPointerUp: (pointer) => {
              // Nothing special to do here; return false to allow fallthrough
              return false;
            },
            update: (pointer) => {
              try {
                const x = pointer.world ? pointer.world.x : pointer.screen.x;
                const y = pointer.world ? pointer.world.y : pointer.screen.y;
                if (typeof this.update === 'function') this.update(x, y, pointer.isPressed === true);
              } catch (e) {}
            },
            render: (gameState, pointer) => {
              try {
                if (typeof this.render === 'function') this.render({ gameState: gameState, layerName: RenderManager.layers.UI_GAME });
              } catch (e) {}
            }
          };
          RenderManager.addInteractiveDrawable(RenderManager.layers.UI_GAME, adapter);
        }
      } catch (e) {
        console.warn('ButtonGroupManager: failed to auto-register interactive adapter', e);
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to initialize ButtonGroupManager: ${error.message}`);
    }
  }

  /**
   * Create a single button group from configuration
   * 
   * @param {Object} config - Button group configuration
   * @returns {ButtonGroup} Created button group instance
   */
  createButtonGroup(config) {

    
    // Validate configuration
    if (!config || typeof config !== 'object') {
      throw new Error('Button group configuration must be a valid object');
    }

    
    if (!config.id || typeof config.id !== 'string') {
      throw new Error('Button group configuration must have a valid string ID');
    }

    
    if (this.activeGroups.has(config.id)) {
      throw new Error(`Button group with ID '${config.id}' already exists`);
    }


    // Create button group using real ButtonGroup class
    if (typeof globalThis.logDebug === 'function') {
      globalThis.logDebug(`🚀 ButtonGroupManager about to create ButtonGroup for: ${config.id}`);
    } else if (globalThis.globalDebugVerbosity >= 4) {
      console.log(`🚀 ButtonGroupManager about to create ButtonGroup for: ${config.id}`);
    }
    if (typeof globalThis.logDebug === 'function') {
      globalThis.logDebug(`   Config:`, config);
      globalThis.logDebug(`   ActionFactory:`, this.actionFactory);
    } else if (globalThis.globalDebugVerbosity >= 4) {
      console.log(`   Config:`, config);
      console.log(`   ActionFactory:`, this.actionFactory);
    }
    
    const buttonGroup = new ButtonGroup(config, this.actionFactory);
    if (typeof globalThis.logVerbose === 'function') {
      globalThis.logVerbose(`✅ ButtonGroupManager ButtonGroup created successfully for: ${config.id}`);
    } else {
      console.log(`✅ ButtonGroupManager ButtonGroup created successfully for: ${config.id}`);
    }
    
    // Register in active groups
    this.activeGroups.set(config.id, {
      instance: buttonGroup,
      config: config,
      createdAt: Date.now(),
      lastInteraction: 0,
      renderCount: 0
    });

    return buttonGroup;
  }

  /**
   * Get all active button groups
   * 
   * @returns {Array<ButtonGroup>} Array of active button group instances
   */
  getAllActiveGroups() {
    return Array.from(this.activeGroups.values()).map(entry => entry.instance);
  }

  /**
   * Get button group by ID
   * 
   * @param {string} groupId - Button group identifier
   * @returns {ButtonGroup|null} Button group instance or null if not found
   */
  getButtonGroup(groupId) {
    const entry = this.activeGroups.get(groupId);
    return entry ? entry.instance : null;
  }

  /**
   * Add a new button group dynamically
   * 
   * @param {Object} config - Button group configuration
   * @returns {ButtonGroup} Created button group instance
   */
  addButtonGroup(config) {
    if (!this.isInitialized) {
      throw new Error('Manager must be initialized before adding groups');
    }

    const buttonGroup = this.createButtonGroup(config);
    this.performanceMetrics.totalGroups = this.activeGroups.size;
    return buttonGroup;
  }

  /**
   * Remove button group by ID
   * 
   * @param {string} groupId - Button group identifier
   * @returns {boolean} True if group was removed, false if not found
   */
  removeButtonGroup(groupId) {
    const entry = this.activeGroups.get(groupId);
    if (!entry) {
      return false;
    }

    // Cleanup group resources if method exists
    if (typeof entry.instance.dispose === 'function') {
      entry.instance.dispose();
    }

    this.activeGroups.delete(groupId);
    this.performanceMetrics.totalGroups = this.activeGroups.size;
    return true;
  }

  /**
   * Update button group properties at runtime
   * 
   * @param {string} groupId - Button group identifier
   * @param {Object} updates - Properties to update
   * @returns {boolean} True if updates were applied, false if group not found
   */
  updateButtonGroup(groupId, updates) {
    const buttonGroup = this.getButtonGroup(groupId);
    if (!buttonGroup) {
      return false;
    }

    // Apply updates using real ButtonGroup API
    if (updates.transparency !== undefined && typeof buttonGroup.setTransparency === 'function') {
      buttonGroup.setTransparency(updates.transparency);
    }
    if (updates.position !== undefined && typeof buttonGroup.setPosition === 'function') {
      buttonGroup.setPosition(updates.position.x, updates.position.y);
    }
    if (updates.scale !== undefined && typeof buttonGroup.setScale === 'function') {
      buttonGroup.setScale(updates.scale);
    }
    if (updates.visible !== undefined && typeof buttonGroup.setVisible === 'function') {
      buttonGroup.setVisible(updates.visible);
    }

    return true;
  }

  /**
   * Handle mouse interaction across all button groups
   * 
   * @param {number} x - Mouse X coordinate
   * @param {number} y - Mouse Y coordinate
   * @param {boolean} isClicked - Whether mouse is clicked
   * @returns {Array} Array of interaction results from groups
   */
  handleMouseInteraction(x, y, isClicked) {
    this.performanceMetrics.interactionChecksThisFrame = 0;
    this.lastInteractionTime = Date.now();
    const results = [];

    for (const [groupId, entry] of this.activeGroups) {
      this.performanceMetrics.interactionChecksThisFrame++;
      
      try {
        // Use real ButtonGroup interaction methods
        const buttonGroup = entry.instance;
        
        // Check if point is within group bounds for efficiency
        if (typeof buttonGroup.isPointInBounds === 'function') {
          if (buttonGroup.isPointInBounds(x, y)) {
            // Update the group with interaction
            if (typeof buttonGroup.update === 'function') {
              buttonGroup.update(x, y, isClicked);
            }
            
            entry.lastInteraction = Date.now();
            results.push({
              groupId: groupId,
              handled: true,
              inBounds: true
            });
          } else {
            results.push({
              groupId: groupId,
              handled: false,
              inBounds: false
            });
          }
        }
      } catch (error) {
        results.push({
          groupId: groupId,
          handled: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Render all active button groups
   * 
   * @param {Object} renderContext - Rendering context (optional)
   * @returns {Object} Render statistics
   */
  renderAllGroups(renderContext = {}) {
    this.performanceMetrics.renderCallsThisFrame = 0;
    this.lastRenderTime = Date.now();
    const stats = {
      rendered: 0,
      skipped: 0,
      errors: 0
    };

    // Get visible groups sorted by render order
    const visibleGroups = this.getVisibleGroupsInRenderOrder();

    for (const entry of visibleGroups) {
      try {
        const buttonGroup = entry.instance;
        
        // Use real ButtonGroup render method
        if (typeof buttonGroup.render === 'function') {
          buttonGroup.render(renderContext);
          entry.renderCount++;
          stats.rendered++;
          this.performanceMetrics.renderCallsThisFrame++;
        }
      } catch (error) {
        stats.errors++;
        if (this.options.debugMode) {
          console.error(`Render error for group ${entry.config.id}:`, error);
        }
      }
    }

    return stats;
  }

  /**
   * Get visible groups in proper render order
   * 
   * @returns {Array} Array of group entries sorted for rendering
   */
  getVisibleGroupsInRenderOrder() {
    const visibleGroups = [];
    
    for (const entry of this.activeGroups.values()) {
      const buttonGroup = entry.instance;
      
      // Check visibility using real ButtonGroup API
      if (typeof buttonGroup.isVisible === 'function' && buttonGroup.isVisible()) {
        visibleGroups.push(entry);
      }
    }

    // Sort by creation time for consistent render order (can be enhanced with z-index)
    return visibleGroups.sort((a, b) => a.createdAt - b.createdAt);
  }

  /**
   * Trigger global save operation for all groups with persistence
   * Saves both group configurations and individual group states
   * 
   * @returns {Object} Save operation results
   */
  saveAllGroups() {
    const results = {
      successful: 0,
      failed: 0,
      errors: [],
      configurationsSaved: 0,
      statesSaved: 0
    };

    try {
      // Step 1: Save group configurations for recreation
      const groupConfigurations = {};
      
      for (const [groupId, entry] of this.activeGroups) {
        try {
          // Save the original configuration
          groupConfigurations[groupId] = {
            config: entry.config,
            createdAt: entry.createdAt,
            metadata: {
              version: '1.0.0',
              savedAt: Date.now()
            }
          };
          results.configurationsSaved++;
        } catch (error) {
          console.error(`❌ Failed to save configuration for group ${groupId}:`, error);
          results.errors.push({
            groupId: groupId,
            error: error.message,
            phase: 'configuration_save'
          });
        }
      }
      
      // Save configurations to localStorage
      const savedGroupsKey = 'buttonGroupManager_savedGroups';
      localStorage.setItem(savedGroupsKey, JSON.stringify(groupConfigurations));
      console.log(`💾 Saved ${results.configurationsSaved} button group configurations`);

      // Step 2: Save individual group states
      for (const [groupId, entry] of this.activeGroups) {
        try {
          const buttonGroup = entry.instance;
          
          // Use real ButtonGroup persistence API
          if (typeof buttonGroup.saveState === 'function') {
            buttonGroup.saveState();
            results.statesSaved++;
            results.successful++;
          }
          // Fallback: save basic state to localStorage
          else {
            const groupState = {
              position: buttonGroup.state ? { x: buttonGroup.state.position.x, y: buttonGroup.state.position.y } : null,
              transparency: buttonGroup.state ? buttonGroup.state.transparency : 1.0,
              visible: typeof buttonGroup.isVisible === 'function' ? buttonGroup.isVisible() : true,
              scale: buttonGroup.state ? buttonGroup.state.scale : 1.0,
              savedAt: Date.now()
            };
            
            const groupStateKey = `buttonGroup_${groupId}_state`;
            localStorage.setItem(groupStateKey, JSON.stringify(groupState));
            results.statesSaved++;
            results.successful++;
          }
          
        } catch (error) {
          results.failed++;
          results.errors.push({
            groupId: groupId,
            error: error.message,
            phase: 'state_save'
          });
        }
      }

      console.log(`✅ Save complete: ${results.configurationsSaved} configurations saved, ${results.statesSaved} states saved`);
      
    } catch (error) {
      console.error('❌ Failed to save button groups:', error);
      results.failed++;
      results.errors.push({
        groupId: 'global',
        error: error.message,
        phase: 'global_save'
      });
    }

    return results;
  }

  /**
   * Trigger global load operation for all groups with persistence
   * Loads saved button group configurations and recreates the groups
   * 
   * @returns {Object} Load operation results
   */
  loadAllGroups() {
    const results = {
      successful: 0,
      failed: 0,
      errors: [],
      groupsRecreated: 0,
      groupsRestored: 0
    };

    try {
      // Step 1: Load saved group configurations from localStorage
      const savedGroupsKey = 'buttonGroupManager_savedGroups';
      const savedGroupsData = localStorage.getItem(savedGroupsKey);
      
      if (savedGroupsData) {
        const savedConfigurations = JSON.parse(savedGroupsData);
        console.log(`🔄 Loading ${Object.keys(savedConfigurations).length} saved button group configurations...`);
        
        // Step 2: Recreate groups from saved configurations
        for (const [groupId, savedConfig] of Object.entries(savedConfigurations)) {
          try {
            // Only recreate if group doesn't already exist
            if (!this.activeGroups.has(groupId)) {
              const buttonGroup = this.createButtonGroup(savedConfig.config);
              results.groupsRecreated++;
              console.log(`✅ Recreated button group: ${groupId}`);
            }
            results.successful++;
          } catch (error) {
            console.error(`❌ Failed to recreate group ${groupId}:`, error);
            results.failed++;
            results.errors.push({
              groupId: groupId,
              error: error.message,
              phase: 'recreation'
            });
          }
        }
      } else {
        console.log('ℹ️ No saved button group configurations found');
      }

      // Step 3: Load individual group state for existing groups
      for (const [groupId, entry] of this.activeGroups) {
        try {
          const buttonGroup = entry.instance;
          
          // Use real ButtonGroup persistence API
          if (typeof buttonGroup.loadPersistedState === 'function') {
            buttonGroup.loadPersistedState();
            results.groupsRestored++;
            console.log(`🔄 Restored state for group: ${groupId}`);
          }
          
          // Also try to load from localStorage if method not available
          else {
            const groupStateKey = `buttonGroup_${groupId}_state`;
            const savedState = localStorage.getItem(groupStateKey);
            
            if (savedState) {
              const state = JSON.parse(savedState);
              
              // Apply saved state to button group
              if (state.position && typeof buttonGroup.setPosition === 'function') {
                buttonGroup.setPosition(state.position.x, state.position.y);
              }
              if (state.transparency !== undefined && typeof buttonGroup.setTransparency === 'function') {
                buttonGroup.setTransparency(state.transparency);
              }
              if (state.visible !== undefined && typeof buttonGroup.setVisible === 'function') {
                buttonGroup.setVisible(state.visible);
              }
              if (state.scale !== undefined && typeof buttonGroup.setScale === 'function') {
                buttonGroup.setScale(state.scale);
              }
              
              results.groupsRestored++;
              console.log(`🔄 Restored state from localStorage for group: ${groupId}`);
            }
          }
          
        } catch (error) {
          results.failed++;
          results.errors.push({
            groupId: groupId,
            error: error.message,
            phase: 'state_restoration'
          });
        }
      }

      console.log(`✅ Load complete: ${results.groupsRecreated} groups recreated, ${results.groupsRestored} groups restored`);
      
    } catch (error) {
      console.error('❌ Failed to load button groups:', error);
      results.failed++;
      results.errors.push({
        groupId: 'global',
        error: error.message,
        phase: 'global_load'
      });
    }

    return results;
  }

  /**
   * Clear all saved button group data from localStorage
   * 
   * @returns {Object} Clear operation results
   */
  clearAllSavedData() {
    const results = {
      configurationsCleared: 0,
      statesCleared: 0,
      keysRemoved: [],
      errors: []
    };

    try {
      // Clear main group configurations
      const savedGroupsKey = 'buttonGroupManager_savedGroups';
      if (localStorage.getItem(savedGroupsKey)) {
        localStorage.removeItem(savedGroupsKey);
        results.configurationsCleared++;
        results.keysRemoved.push(savedGroupsKey);
      }

      // Clear individual group states
      const allKeys = Object.keys(localStorage);
      for (const key of allKeys) {
        if (key.startsWith('buttonGroup_') && key.endsWith('_state')) {
          localStorage.removeItem(key);
          results.statesCleared++;
          results.keysRemoved.push(key);
        }
      }

      console.log(`🗑️ Cleared saved data: ${results.configurationsCleared} configurations, ${results.statesCleared} states`);
      
    } catch (error) {
      console.error('❌ Failed to clear saved data:', error);
      results.errors.push(error.message);
    }

    return results;
  }

  /**
   * Check if there is saved button group data available
   * 
   * @returns {Object} Information about available saved data
   */
  checkSavedData() {
    const results = {
      hasConfigurations: false,
      configurationCount: 0,
      hasStates: false,
      stateCount: 0,
      availableGroups: []
    };

    try {
      // Check for saved configurations
      const savedGroupsKey = 'buttonGroupManager_savedGroups';
      const savedGroupsData = localStorage.getItem(savedGroupsKey);
      
      if (savedGroupsData) {
        const savedConfigurations = JSON.parse(savedGroupsData);
        results.hasConfigurations = true;
        results.configurationCount = Object.keys(savedConfigurations).length;
        results.availableGroups = Object.keys(savedConfigurations);
      }

      // Check for individual group states
      const allKeys = Object.keys(localStorage);
      for (const key of allKeys) {
        if (key.startsWith('buttonGroup_') && key.endsWith('_state')) {
          results.stateCount++;
        }
      }
      results.hasStates = results.stateCount > 0;

      console.log(`📊 Saved data check: ${results.configurationCount} configurations, ${results.stateCount} states available`);
      
    } catch (error) {
      console.error('❌ Failed to check saved data:', error);
    }

    return results;
  }

  /**
   * Get comprehensive manager diagnostic information
   * 
   * @returns {Object} Complete diagnostic data
   */
  getDiagnosticInfo() {
    const activeGroupInfo = [];
    
    for (const [groupId, entry] of this.activeGroups) {
      const buttonGroup = entry.instance;
      
      activeGroupInfo.push({
        id: groupId,
        createdAt: entry.createdAt,
        lastInteraction: entry.lastInteraction,
        renderCount: entry.renderCount,
        visible: typeof buttonGroup.isVisible === 'function' ? buttonGroup.isVisible() : 'unknown',
        buttonCount: buttonGroup.buttons ? buttonGroup.buttons.length : 0,
        position: buttonGroup.state ? { x: buttonGroup.state.position.x, y: buttonGroup.state.position.y } : null
      });
    }

    return {
      isInitialized: this.isInitialized,
      totalActiveGroups: this.activeGroups.size,
      creationErrors: this.groupCreationErrors.length,
      performanceMetrics: { ...this.performanceMetrics },
      lastRenderTime: this.lastRenderTime,
      lastInteractionTime: this.lastInteractionTime,
      activeGroups: activeGroupInfo,
      options: { ...this.options }
    };
  }

  /**
   * Clean shutdown of manager and all resources
   * 
   * @returns {Object} Cleanup results
   */
  shutdown() {
    const results = {
      groupsDisposed: 0,
      persistenceSaved: 0,
      errors: []
    };

    // Save all groups before shutdown
    try {
      const saveResults = this.saveAllGroups();
      results.persistenceSaved = saveResults.successful;
    } catch (error) {
      results.errors.push(`Persistence save error: ${error.message}`);
    }

    // Dispose all groups
    for (const [groupId, entry] of this.activeGroups) {
      try {
        if (typeof entry.instance.dispose === 'function') {
          entry.instance.dispose();
        }
        results.groupsDisposed++;
      } catch (error) {
        results.errors.push(`Disposal error for ${groupId}: ${error.message}`);
      }
    }

    // Clear all data
    this.activeGroups.clear();
    this.groupCreationErrors = [];
    this.isInitialized = false;
    this.performanceMetrics = {
      totalGroups: 0,
      renderCallsThisFrame: 0,
      interactionChecksThisFrame: 0
    };

    return results;
  }

  /**
   * Check if manager is successfully initialized
   * 
   * @returns {boolean} True if initialized and ready
   */
  isReady() {
    return this.isInitialized && this.activeGroups.size > 0;
  }

  /**
   * Get count of active groups
   * 
   * @returns {number} Number of active button groups
   */
  getActiveGroupCount() {
    return this.activeGroups.size;
  }

  /**
   * Update all active button groups
   * 
   * @param {number} mouseX - Current mouse X position
   * @param {number} mouseY - Current mouse Y position  
   * @param {boolean} mousePressed - Whether mouse is currently pressed
   */
  update(mouseX, mouseY, mousePressed) {
    if (!this.isInitialized) {
      return;
    }

    // Update each active button group
    for (const [groupId, groupEntry] of this.activeGroups) {
      if (groupEntry.instance && typeof groupEntry.instance.update === 'function') {
        try {
          groupEntry.instance.update(mouseX, mouseY, mousePressed);
        } catch (error) {
          console.error(`❌ Error updating button group ${groupId}:`, error);
        }
      }
    }
  }

  /**
   * Render all active button groups
   * 
   * @param {Object} renderContext - Optional rendering context/settings
   */
  render(renderContext = {}) {
    if (!this.isInitialized) { return; }

    // Render each active button group
    for (const [groupId, groupEntry] of this.activeGroups) {
      if (groupEntry.instance && typeof groupEntry.instance.render === 'function') {
        try {
          groupEntry.instance.render(renderContext);
        } catch (error) {
          console.error(`❌ Error rendering button group ${groupId}:`, error);
        }
      }
    }
  }

  /**
   * Handle mouse click events for all button groups
   * 
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   * @returns {boolean} True if any button was clicked
   */
  handleClick(mouseX, mouseY) {
    if (!this.isInitialized) {
      return false;
    }

    let clickHandled = false;

    // Check each active button group for clicks
    for (const [groupId, groupEntry] of this.activeGroups) {
      if (groupEntry.instance && typeof groupEntry.instance.handleClick === 'function') {
        try {
          if (groupEntry.instance.handleClick(mouseX, mouseY)) {
            clickHandled = true;
            break; // Only handle first click
          }
        } catch (error) {
          console.error(`❌ Error handling click for button group ${groupId}:`, error);
        }
      }
    }

    return clickHandled;
  }
}

// Export for Node.js environments only
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ButtonGroupManager;
}