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
    console.log(`🚀 ButtonGroupManager about to create ButtonGroup for: ${config.id}`);
    console.log(`   Config:`, config);
    console.log(`   ActionFactory:`, this.actionFactory);
    
    const buttonGroup = new ButtonGroup(config, this.actionFactory);
    console.log(`✅ ButtonGroupManager ButtonGroup created successfully for: ${config.id}`);
    
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
   * 
   * @returns {Object} Save operation results
   */
  saveAllGroups() {
    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };

    for (const [groupId, entry] of this.activeGroups) {
      try {
        const buttonGroup = entry.instance;
        
        // Use real ButtonGroup persistence API
        if (typeof buttonGroup.saveState === 'function') {
          buttonGroup.saveState();
          results.successful++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          groupId: groupId,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Trigger global load operation for all groups with persistence
   * 
   * @returns {Object} Load operation results
   */
  loadAllGroups() {
    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };

    for (const [groupId, entry] of this.activeGroups) {
      try {
        const buttonGroup = entry.instance;
        
        // Use real ButtonGroup persistence API
        if (typeof buttonGroup.loadPersistedState === 'function') {
          buttonGroup.loadPersistedState();
          results.successful++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          groupId: groupId,
          error: error.message
        });
      }
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