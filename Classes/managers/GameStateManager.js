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
  getPreviousState() {
    return this.previousState;
  }

  // Check if current state matches
  isState(state) {
    return this.currentState === state;
  }

  // Check if any of the provided states match current
  isAnyState(...states) {
    return states.includes(this.currentState);
  }

  // Validate state
  isValidState(state) {
    return Object.values(this.STATES).includes(state);
  }

  // Transition fade management
  getFadeAlpha() {
    return this.fadeAlpha;
  }

  setFadeAlpha(alpha) {
    this.fadeAlpha = Math.max(0, Math.min(255, alpha));
  }

  isFadingTransition() {
    return this.isFading;
  }

  startFadeTransition() {
    this.isFading = true;
    this.fadeAlpha = 0;
  }

  stopFadeTransition() {
    this.isFading = false;
  }

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
  isInMenu() {
    return this.currentState === this.STATES.MENU;
  }

  isInOptions() {
    return this.currentState === this.STATES.OPTIONS;
  }

  isInGame() {
    return this.currentState === this.STATES.PLAYING;
  }

  isPaused() {
    return this.currentState === this.STATES.PAUSED;
  }

  isGameOver() {
    return this.currentState === this.STATES.GAME_OVER;
  }

  // Transition methods
  goToMenu() {
    return this.setState(this.STATES.MENU);
  }

  goToOptions() {
    return this.setState(this.STATES.OPTIONS);
  }

  startGame() {
    this.startFadeTransition();
    return this.setState(this.STATES.PLAYING);
  }

  pauseGame() {
    return this.setState(this.STATES.PAUSED);
  }

  resumeGame() {
    return this.setState(this.STATES.PLAYING);
  }

  endGame() {
    return this.setState(this.STATES.GAME_OVER);
  }

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