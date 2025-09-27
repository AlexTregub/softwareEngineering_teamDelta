// GameStateManager - Centralized game state management
class GameStateManager {
  constructor() {
    this.currentState = "MENU";
    this.previousState = null;
    this.fadeAlpha = 0;
    this.isFading = false;
    this.stateChangeCallbacks = [];
    
    // Valid game states
    this.STATES = {
      MENU: "MENU",
      OPTIONS: "OPTIONS", 
      DEBUG_MENU: "DEBUG_MENU",
      PLAYING: "PLAYING",
      PAUSED: "PAUSED",
      GAME_OVER: "GAME_OVER"
    };
  }

  // Get current state
  getState() {
    return this.currentState;
  }

  // Set state with optional callback execution
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

  // Get previous state
  getPreviousState = () => this.previousState;

  // Check if current state matches
  isState = (state) => this.currentState === state;

  // Check if any of the provided states match current
  isAnyState = (...states) => states.includes(this.currentState);

  // Validate state
  isValidState = (state) => Object.values(this.STATES).includes(state);

  // Transition fade management
  getFadeAlpha = () => this.fadeAlpha;
  setFadeAlpha = (alpha) => { this.fadeAlpha = Math.max(0, Math.min(255, alpha));  };
  isFadingTransition = () => this.isFading;
  startFadeTransition() { this.isFading = true; this.fadeAlpha = 0; }
  stopFadeTransition() { this.isFading = false; }

  updateFade(increment = 5) {
    if (this.isFading) {
      this.fadeAlpha += increment;
      if (this.fadeAlpha >= 255) {
        this.fadeAlpha = 255;
        return true; // Fade complete
      }
    }
    return false;
  }

  // State change callback system
  onStateChange(callback) {
    if (typeof callback === 'function') {
      this.stateChangeCallbacks.push(callback);
    }
  }

  removeStateChangeCallback(callback) {
    const index = this.stateChangeCallbacks.indexOf(callback);
    if (index > -1) {
      this.stateChangeCallbacks.splice(index, 1);
    }
  }

  executeCallbacks(newState, oldState) {
    this.stateChangeCallbacks.forEach(callback => {
      try {
        callback(newState, oldState);
      } catch (error) {
        console.error('Error in state change callback:', error);
      }
    });
  }

  // Convenience methods for common states
  isInMenu = () => this.currentState === this.STATES.MENU;
  isInOptions = () => this.currentState === this.STATES.OPTIONS;
  isInGame = () => this.currentState === this.STATES.PLAYING;
  isPaused = () => this.currentState === this.STATES.PAUSED;
  isGameOver = () => this.currentState === this.STATES.GAME_OVER;
  isDebug = () => this.currentState === this.STATES.DEBUG_MENU;

  // Transition methods
  goToMenu = () => this.setState(this.STATES.MENU);
  goToOptions = () => this.setState(this.STATES.OPTIONS);
  goToDebug = () => this.setState(this.STATES.DEBUG_MENU);
  startGame = () => { this.startFadeTransition(); return this.setState(this.STATES.PLAYING); };
  pauseGame = () => this.setState(this.STATES.PAUSED);
  resumeGame = () => this.setState(this.STATES.PLAYING);
  endGame = () => this.setState(this.STATES.GAME_OVER);

  // Reset to initial state
  reset() {
    this.currentState = this.STATES.MENU;
    this.previousState = null;
    this.fadeAlpha = 0;
    this.isFading = false;
  }

  // Debug information
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