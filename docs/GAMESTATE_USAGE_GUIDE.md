# GameStateManager Usage Guide

## Overview
The GameStateManager provides centralized game state management accessible from anywhere in the application. The global instance `GameState` is available throughout the codebase.

## Quick Usage Examples

### Basic State Operations
```javascript
// Check current state
if (GameState.isInMenu()) {
  // Menu logic
}

// Change states
GameState.goToMenu();
GameState.goToOptions();
GameState.startGame(); // Also starts fade transition

// Get current state
const currentState = GameState.getState();
```

### Available States
- `MENU` - Main menu
- `OPTIONS` - Options/settings menu  
- `PLAYING` - In game
- `PAUSED` - Game paused
- `GAME_OVER` - Game over screen

### Convenience Methods
```javascript
// State checks
GameState.isInMenu()     // Returns true if in MENU
GameState.isInOptions()  // Returns true if in OPTIONS  
GameState.isInGame()     // Returns true if in PLAYING
GameState.isPaused()     // Returns true if in PAUSED
GameState.isGameOver()   // Returns true if in GAME_OVER

// Multi-state checks
GameState.isAnyState("MENU", "OPTIONS") // Returns true if in either state

// State transitions
GameState.goToMenu()
GameState.goToOptions()
GameState.startGame()    // Includes fade transition
GameState.pauseGame()
GameState.resumeGame()
GameState.endGame()
```

### Fade Transition Management
```javascript
// Start fade transition
GameState.startFadeTransition();

// Check if fading
if (GameState.isFadingTransition()) {
  // Handle fade logic
}

// Update fade (returns true when complete)
if (GameState.updateFade(5)) {
  // Fade completed
}

// Get/set fade alpha
const alpha = GameState.getFadeAlpha();
GameState.setFadeAlpha(128);
```

### State Change Callbacks
```javascript
// Register callback for state changes
GameState.onStateChange((newState, oldState) => {
  console.log(`State changed from ${oldState} to ${newState}`);
  
  // Reload UI elements
  if (newState === "MENU" || newState === "OPTIONS") {
    loadButtons();
  }
});

// Remove callback
GameState.removeStateChangeCallback(myCallback);
```

### Debug Information
```javascript
// Get comprehensive debug info
const debugInfo = GameState.getDebugInfo();
console.log(debugInfo);
// Output: { currentState, previousState, fadeAlpha, isFading, callbackCount, validStates }
```

### Reset and Utility
```javascript
// Reset to initial state
GameState.reset(); // Sets to MENU, clears fade, removes callbacks

// Manual state setting with validation
if (GameState.setState("CUSTOM_STATE")) {
  // State was valid and set
} else {
  // Invalid state rejected
}
```

## Integration Notes

- The GameStateManager is loaded before menu.js in index.html
- Global `GameState` instance is immediately available
- All 189 existing tests continue to pass
- Menu system automatically updates when state changes through callbacks
- Fade transitions are fully integrated with state management

## Benefits

1. **Centralized**: All game state logic in one place
2. **Accessible**: Available from any file via global `GameState`
3. **Type Safe**: State validation prevents invalid states
4. **Callback System**: Automatic UI updates when state changes
5. **Backward Compatible**: Existing code continues to work
6. **Debug Friendly**: Comprehensive debug information
7. **Maintainable**: Clean separation of concerns