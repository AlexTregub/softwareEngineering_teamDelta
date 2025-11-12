/**
 * GameStateManager - Centralized game state management
 * 
 * Manages game state transitions, fade effects, and state change callbacks.
 * Provides a single source of truth for the current game state.
 * @typedef {'MENU'|'OPTIONS'|'DEBUG_MENU'|'PLAYING'|'PAUSED'|'GAME_OVER'|'KANBAN'|'LEVEL_EDITOR'} GameStateType
 */
class GameStateManager {
  constructor() {
    /** @type {GameStateType} */
    this.currentState = "MENU";
    
    this.previousState = null;
    this.fadeAlpha = 0;
    this.isFading = false;
    this.stateChangeCallbacks = [];
    this.fadeDirection = "out";
    
    /** @type {{MENU: 'MENU', OPTIONS: 'OPTIONS', DEBUG_MENU: 'DEBUG_MENU', PLAYING: 'PLAYING', PAUSED: 'PAUSED', GAME_OVER: 'GAME_OVER', KAN_BAN: 'KANBAN', LEVEL_EDITOR: 'LEVEL_EDITOR'}} */
    this.STATES = {
      MENU: "MENU",              // Main menu screen
      OPTIONS: "OPTIONS",         // Settings/options menu
      DEBUG_MENU: "DEBUG_MENU",   // Debug menu for developers
      PLAYING: "PLAYING",         // Active gameplay
      PAUSED: "PAUSED",           // Game paused
      GAME_OVER: "GAME_OVER",     // Game over screen
      KAN_BAN: "KANBAN",          // Kanban board view
      LEVEL_EDITOR: "LEVEL_EDITOR" // Level editor mode
    };
  }

  /**
   * Get the current game state
   * @returns {string} Current state (e.g., 'PLAYING', 'MENU')
   * @example
   * const state = GameState.getState();
   * console.log(state); // "PLAYING"
   */
  getState() {
    return this.currentState;
  }

  /**
   * Get the list of states the game can be in
   * @returns {list} Current state (e.g., 'PLAYING', 'MENU')
   */
  getStateList(){
    return this.STATES;
  }

  /**
   * Set a new game state
   * @param {string} newState - New state to transition to (must be valid)
   * @param {boolean} skipCallbacks - If true, don't execute state change callbacks
   * @returns {boolean} True if state change succeeded, false if invalid state
   * @example
   * GameState.setState('PLAYING');
   * GameState.setState('LEVEL_EDITOR', true); // Skip callbacks
   */
  setState(newState, skipCallbacks = false) {
    if (!this.isValidState(newState)) {
      console.warn(`Invalid game state: ${newState}`);
      return false;
    }

    this.previousState = this.currentState;
    this.currentState = newState;

    if (!skipCallbacks) {
      this.executeCallbacks(newState, this.previousState);
    }
    return true;
  }

  /**
   * Get the previous game state
   * @returns {string|null} Previous state or null if no previous state
   * @example
   * GameState.setState('PLAYING');
   * console.log(GameState.getPreviousState()); // "MENU"
   */
  getPreviousState = () => this.previousState;

  /**
   * Check if current state matches the given state
   * @param {string} state - State to check against
   * @returns {boolean} True if current state matches
   * @example
   * if (GameState.isState('PLAYING')) {
   *   updateGame();
   * }
   */
  isState = (state) => this.currentState === state;

  /**
   * Check if current state matches any of the provided states
   * @param {...string} states - States to check against
   * @returns {boolean} True if current state matches any provided state
   * @example
   * if (GameState.isAnyState('MENU', 'PAUSED', 'GAME_OVER')) {
   *   renderUI();
   * }
   */
  isAnyState = (...states) => states.includes(this.currentState);

  /**
   * Validate if a state string is valid
   * @param {string} state - State to validate
   * @returns {boolean} True if state is valid
   */
  isValidState = (state) => Object.values(this.STATES).includes(state);

  /**
   * Get the current fade alpha value (0-255)
   * @returns {number} Fade alpha (0 = transparent, 255 = opaque)
   */
  getFadeAlpha() {
    return this.fadeAlpha;
  }

  /**
   * Set the fade alpha value
   * @param {number} alpha - Alpha value (0-255), automatically clamped
   */
  setFadeAlpha(alpha) {
    this.fadeAlpha = Math.max(0, Math.min(255, alpha));
  }

  /**
   * Check if a fade transition is currently active
   * @returns {boolean} True if fading
   */
  isFadingTransition() {
    return this.isFading;
  }

  /**
   * Start a fade transition
   * @param {string} direction - 'out' (fade to black) or 'in' (fade from black)
   * @example
   * GameState.startFadeTransition('out'); // Fade to black
   * GameState.startFadeTransition('in');  // Fade from black
   */
  startFadeTransition(direction = "out") {
    this.isFading = true;
    this.fadeAlpha = direction === "out" ? 0 : 255;
    this.fadeDirection = direction;
  }

  /**
   * Stop the current fade transition
   */
  stopFadeTransition() {
    this.isFading = false;
  }

  /**
   * Update the fade transition (call in draw loop)
   * @param {number} increment - Amount to change alpha per frame (default: 5)
   * @returns {boolean} True if fade transition completed
   * @example
   * function draw() {
   *   if (GameState.isFadingTransition()) {
   *     const fadeComplete = GameState.updateFade(5);
   *     if (fadeComplete) {
   *       console.log('Fade finished!');
   *     }
   *   }
   * }
   */
  updateFade(increment = 5) {
    if (!this.isFading) return false;
  
    if (this.fadeDirection === "out") {
      this.fadeAlpha += increment;
      if (this.fadeAlpha >= 255) {
        this.fadeAlpha = 255;
        return true; // fade-out complete
      }
    } else { // fadeDirection === "in"
      this.fadeAlpha -= increment;
      if (this.fadeAlpha <= 0) {
        this.fadeAlpha = 0;
        this.isFading = false;
        return true; // fade-in complete
      }
    }
  
    return false;
  }
  

  /**
   * Register a callback to be executed on state changes
   * @param {Function} callback - Function(newState, oldState) to execute
   * @example
   * GameState.onStateChange((newState, oldState) => {
   *   console.log(`Changed from ${oldState} to ${newState}`);
   * });
   */
  onStateChange(callback) {
    if (typeof callback === 'function') {
      this.stateChangeCallbacks.push(callback);
    }
  }

  /**
   * Remove a previously registered state change callback
   * @param {Function} callback - Callback to remove
   */
  removeStateChangeCallback(callback) {
    const index = this.stateChangeCallbacks.indexOf(callback);
    if (index > -1) {
      this.stateChangeCallbacks.splice(index, 1);
    }
  }

  /**
   * Execute all registered state change callbacks
   * @param {string} newState - New state
   * @param {string} oldState - Previous state
   * @private
   */
  executeCallbacks(newState, oldState) {
    this.stateChangeCallbacks.forEach(callback => {
      try {
        callback(newState, oldState);
      } catch (error) {
        console.error('Error in state change callback:', error);
      }
    });
  }

  // === Convenience Methods for State Checking ===
  
  /** Check if in main menu @returns {boolean} */
  isInMenu = () => this.currentState === this.STATES.MENU;
  
  /** Check if in options menu @returns {boolean} */
  isInOptions = () => this.currentState === this.STATES.OPTIONS;
  
  /** Check if actively playing @returns {boolean} */
  isInGame = () => this.currentState === this.STATES.PLAYING;
  
  /** Check if game is paused @returns {boolean} */
  isPaused = () => this.currentState === this.STATES.PAUSED;
  
  /** Check if game over @returns {boolean} */
  isGameOver = () => this.currentState === this.STATES.GAME_OVER;
  
  /** Check if in debug menu @returns {boolean} */
  isDebug = () => this.currentState === this.STATES.DEBUG_MENU;
  
  /** Check if in Kanban board @returns {boolean} */
  isKanban = () => this.currentState === this.STATES.KAN_BAN;
  
  /** Check if in level editor @returns {boolean} */
  isLevelEditor = () => this.currentState === this.STATES.LEVEL_EDITOR;

  // === Convenience Methods for State Transitions ===
  
  /** Transition to main menu @returns {boolean} */
  goToMenu = () => this.setState(this.STATES.MENU);
  
  /** Transition to options menu @returns {boolean} */
  goToOptions = () => this.setState(this.STATES.OPTIONS);
  
  /** Transition to debug menu @returns {boolean} */
  goToDebug = () => this.setState(this.STATES.DEBUG_MENU);
  
  /** Transition to level editor @returns {boolean} */
  goToLevelEditor = () => this.setState(this.STATES.LEVEL_EDITOR);
  
  /** Start the game with fade transition @returns {boolean} */
  startGame = () => { this.startFadeTransition(); return this.setState(this.STATES.PLAYING); };
  
  /** Pause the game @returns {boolean} */
  pauseGame = () => this.setState(this.STATES.PAUSED);
  
  /** Resume the game @returns {boolean} */
  resumeGame = () => this.setState(this.STATES.PLAYING);
  
  /** End the game (game over) @returns {boolean} */
  endGame = () => this.setState(this.STATES.GAME_OVER);
  
  /** Transition to Kanban board @returns {boolean} */
  goToKanban = () => this.setState(this.STATES.KAN_BAN);

  /**
   * Reset game state manager to initial state
   */
  reset() {
    this.currentState = this.STATES.MENU;
    this.previousState = null;
    this.fadeAlpha = 0;
    this.isFading = false;
  }

  /**
   * Get debug information about the state manager
   * @returns {Object} Debug info object with current state, callbacks, etc.
   * @example
   * console.log(GameState.getDebugInfo());
   * // {
   * //   currentState: "PLAYING",
   * //   previousState: "MENU",
   * //   fadeAlpha: 0,
   * //   isFading: false,
   * //   callbackCount: 2,
   * //   validStates: {...}
   * // }
   */
  getDebugInfo() {
    return {
      currentState: this.currentState,
      previousState: this.previousState,
      fadeAlpha: this.fadeAlpha,
      isFading: this.isFading,
      callbackCount: this.stateChangeCallbacks.length,
      validStates: this.STATES
    };
  }
}

// Create global instance
const GameState = new GameStateManager();

// Make globally available
if (typeof window !== 'undefined') {
  window.GameState = GameState;
} else if (typeof global !== 'undefined') {
  global.GameState = GameState;
}

// Export for Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameStateManager;
}