// KeyboardInputController.js - Simple, modern keyboard input controller
// Usage:
//   const keyboard = new KeyboardInputController();
//   keyboard.onKeyPress((keyCode, key) => { ... });
//   keyboard.onKeyRelease((keyCode, key) => { ... });
//   keyboard.onKeyType((key) => { ... });
//   // In your p5.js handlers:
//   function keyPressed()  { keyboard.handleKeyPressed(keyCode, key); }
//   function keyReleased() { keyboard.handleKeyReleased(keyCode, key); }
//   function keyTyped()    { keyboard.handleKeyTyped(key); }

class KeyboardInputController {
  constructor() {
    this.keyPressHandlers = [];
    this.keyReleaseHandlers = [];
    this.keyTypeHandlers = [];
    this.pressedKeys = new Set();
    
    // Ant group management integration
    this.groupManager = null;
    this.gameStateManager = null;
    this.antManager = null;
    this.groupIntegrationEnabled = false;
  }

  onKeyPress(fn) {
    if (typeof fn === 'function') this.keyPressHandlers.push(fn);
  }
  onKeyRelease(fn) {
    if (typeof fn === 'function') this.keyReleaseHandlers.push(fn);
  }
  onKeyType(fn) {
    if (typeof fn === 'function') this.keyTypeHandlers.push(fn);
  }

  handleKeyPressed(keyCode, key) {
    this.pressedKeys.add(keyCode);
    this.keyPressHandlers.forEach(fn => fn(keyCode, key));
  }

  handleKeyReleased(keyCode, key) {
    this.pressedKeys.delete(keyCode);
    this.keyReleaseHandlers.forEach(fn => fn(keyCode, key));
  }

  handleKeyTyped(key) {
    this.keyTypeHandlers.forEach(fn => fn(key));
  }

  isKeyDown(keyCode) {
    return this.pressedKeys.has(keyCode);
  }

  // --- ANT GROUP MANAGEMENT INTEGRATION ---

  /**
   * Initialize ant group management integration.
   * 
   * @param {AntGroupManager} groupManager - The group manager instance
   * @param {Object} gameStateManager - Game state manager for context
   * @param {AntManager} antManager - Ant manager for selection access
   * @returns {boolean} True if initialization succeeded
   */
  initializeGroupManagement(groupManager, gameStateManager = null, antManager = null) {
    if (!groupManager) {
      console.error('KeyboardInputController: Group manager is required');
      return false;
    }

    this.groupManager = groupManager;
    this.gameStateManager = gameStateManager;
    this.antManager = antManager;
    this.groupIntegrationEnabled = true;

    console.log('✅ KeyboardInputController group management integration enabled');
    return true;
  }

  /**
   * Enhanced key press handler that includes group management.
   * Processes group keys before calling other handlers.
   * 
   * @param {number} keyCode - The key code
   * @param {string} key - The key string
   * @param {Object} modifiers - Modifier keys state
   * @returns {boolean} True if key was handled by group system
   */
  handleKeyPressedWithGroups(keyCode, key, modifiers = {}) {
    this.pressedKeys.add(keyCode);

    // Handle group management keys first
    if (this.groupIntegrationEnabled && this.canHandleGroupKeys()) {
      if (this.isNumberKey(keyCode)) {
        const groupNumber = this.getNumberFromKeyCode(keyCode);
        
        if (modifiers.ctrlKey) {
          const handled = this.handleGroupAssignmentKey(groupNumber);
          if (handled) {
            // Still call other handlers for compatibility
            this.keyPressHandlers.forEach(fn => fn(keyCode, key, modifiers));
            return true;
          }
        } else {
          const handled = this.handleGroupSelectionKey(groupNumber);
          if (handled) {
            // Still call other handlers for compatibility  
            this.keyPressHandlers.forEach(fn => fn(keyCode, key, modifiers));
            return true;
          }
        }
      }
    }

    // Call standard key handlers
    this.keyPressHandlers.forEach(fn => fn(keyCode, key, modifiers));
    return false;
  }

  /**
   * Check if the key is a number key (1-9).
   */
  isNumberKey(keyCode) {
    return keyCode >= 49 && keyCode <= 57; // Keys 1-9
  }

  /**
   * Convert keycode to number (1-9).
   */
  getNumberFromKeyCode(keyCode) {
    return keyCode - 48; // Convert keycode to number
  }

  /**
   * Handle Ctrl+Number key presses for group assignment.
   */
  handleGroupAssignmentKey(groupNumber) {
    if (!this.canHandleGroupKeys()) return false;

    try {
      // Get currently selected ants
      const selectedAnts = this.getSelectedAnts();
      
      if (selectedAnts.length === 0) {
        console.warn(`No ants selected for group ${groupNumber} assignment`);
        return false;
      }

      const success = this.groupManager.assignGroup(groupNumber, selectedAnts);
      
      if (success) {
        console.log(`✅ Assigned ${selectedAnts.length} ants to group ${groupNumber}`);
      } else {
        console.error(`❌ Failed to assign ants to group ${groupNumber}`);
      }

      return success;
    } catch (error) {
      console.error(`Error handling group assignment for ${groupNumber}:`, error);
      return false;
    }
  }

  /**
   * Handle Number key presses for group selection.
   */
  handleGroupSelectionKey(groupNumber) {
    if (!this.canHandleGroupKeys()) return false;

    try {
      // Check if group has ants
      if (this.groupManager.getGroupSize(groupNumber) === 0) {
        console.log(`Group ${groupNumber} is empty`);
        return false;
      }

      // Toggle group selection
      const success = this.groupManager.toggleGroup(groupNumber);
      
      if (success) {
        const selectedCount = this.groupManager.getSelectedAnts().length;
        console.log(`✅ Group ${groupNumber} toggled, ${selectedCount} ants selected`);
        
        // Update AntManager selection if available
        this.syncSelectionWithAntManager();
      }

      return success;
    } catch (error) {
      console.error(`Error handling group selection for ${groupNumber}:`, error);
      return false;
    }
  }

  /**
   * Check if group keys can be handled in current context.
   */
  canHandleGroupKeys() {
    if (!this.groupIntegrationEnabled || !this.groupManager) {
      return false;
    }

    // Check game state if available
    if (this.gameStateManager) {
      const state = this.gameStateManager.getState();
      // Group keys work in PLAYING and PAUSED states
      return state === 'PLAYING' || state === 'PAUSED';
    }

    return true;
  }

  /**
   * Get currently selected ants from various sources.
   */
  getSelectedAnts() {
    const selectedAnts = [];

    // Try to get from AntManager first
    if (this.antManager && this.antManager.getSelectedAnt) {
      const selectedAnt = this.antManager.getSelectedAnt();
      if (selectedAnt) {
        selectedAnts.push(selectedAnt);
      }
    }

    // Fallback: get from global ants array if available
    if (selectedAnts.length === 0 && typeof ants !== 'undefined') {
      for (let i = 0; i < ants.length; i++) {
        const ant = ants[i];
        if (ant && ant.isSelected) {
          selectedAnts.push(ant);
        }
      }
    }

    // Final fallback: get from group manager
    if (selectedAnts.length === 0 && this.groupManager) {
      return this.groupManager.getSelectedAnts();
    }

    return selectedAnts;
  }

  /**
   * Synchronize selection state with AntManager.
   */
  syncSelectionWithAntManager() {
    if (!this.antManager) return;

    try {
      const selectedAnts = this.groupManager.getSelectedAnts();
      
      if (selectedAnts.length === 1) {
        // Update AntManager with single selected ant
        this.antManager.setSelectedAnt(selectedAnts[0]);
      } else if (selectedAnts.length === 0) {
        // Clear AntManager selection
        this.antManager.setSelectedAnt(null);
      }
      // For multiple selections, AntManager can't handle it directly
      // but individual ants maintain their isSelected state

      // Update global selectedAnt if available
      if (typeof window !== 'undefined' && selectedAnts.length === 1) {
        window.selectedAnt = selectedAnts[0];
      } else if (typeof window !== 'undefined' && selectedAnts.length === 0) {
        window.selectedAnt = null;
      }
    } catch (error) {
      console.error('Error syncing selection with AntManager:', error);
    }
  }

  /**
   * Get diagnostic information for debugging.
   */
  getGroupIntegrationDiagnostic() {
    return {
      groupIntegrationEnabled: this.groupIntegrationEnabled,
      hasGroupManager: this.groupManager !== null,
      hasGameStateManager: this.gameStateManager !== null,
      hasAntManager: this.antManager !== null,
      canHandleGroups: this.canHandleGroupKeys(),
      pressedKeysCount: this.pressedKeys.size,
      selectedAntsCount: this.getSelectedAnts().length
    };
  }

  /**
   * Disable group management integration.
   */
  disableGroupManagement() {
    this.groupIntegrationEnabled = false;
    this.groupManager = null;
    this.gameStateManager = null;
    this.antManager = null;
    console.log('⚠️ KeyboardInputController group management integration disabled');
  }
}

// Export for use in your main file
// window.KeyboardInputController = KeyboardInputController;