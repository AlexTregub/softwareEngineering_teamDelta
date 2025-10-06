# Keyboard Shortcuts Quick Reference

> **Last Updated**: October 2025  
> **System**: UIController keyboard shortcuts

## Master Controls

| Shortcut | Action | Description |
|----------|---------|-------------|
| **Shift + N** | Toggle All UI | Smart toggle - shows all if any hidden, hides all if all visible |

## Individual Panel Controls

| Shortcut | Action | Description |
|----------|---------|-------------|
| **Ctrl + Shift + 1** | Performance Overlay | FPS, memory usage, render statistics |
| **Ctrl + Shift + 2** | Entity Inspector | Entity debug information and overlays |
| **Ctrl + Shift + 3** | Debug Console | Command-line interface for debugging |
| **Ctrl + Shift + 4** | Minimap | Scaled world overview with entity positions |
| **Ctrl + Shift + 5** | Start Game | Transition from MENU to PLAYING state |

## Alternative Shortcuts

| Shortcut | Action | Notes |
|----------|---------|--------|
| **` (Backtick)** | Debug Console | Quick access alternative to Ctrl+Shift+3 |

---

## Shortcut Behavior Details

### Shift + N (Toggle All UI)
- **Smart Logic**: If ANY panels are hidden → Show all panels
- **Smart Logic**: If ALL panels are visible → Hide all panels
- **Affects**: All draggable panels, performance overlay, debug systems, minimap
- **Console**: Shows "👁️ All UI panels shown" or "🙈 All UI panels hidden"

### Ctrl + Shift + 1 (Performance Overlay)
- **Primary**: Uses `g_performanceMonitor.setDebugDisplay()`
- **Fallback**: UIRenderer performance overlay if monitor unavailable
- **Display**: FPS counter, memory usage, render performance metrics
- **Console**: Logs "Performance Monitor ENABLED/DISABLED"

### Ctrl + Shift + 2 (Entity Inspector)  
- **Primary**: Uses existing `EntityDebugManager` from `debug/EntityDebugManager.js`
- **Fallback**: UIRenderer entity inspector functionality
- **Features**: Entity state visualization, health overlays, property inspection
- **Integration**: Works with mouse entity selection

### Ctrl + Shift + 3 (Debug Console)
- **Primary**: Uses `toggleDevConsole()` from `debug/testing.js`
- **Fallback**: UIRenderer debug console
- **Alternative**: Backtick (`) key for quick access
- **Features**: Runtime commands, variable inspection, system debugging

### Ctrl + Shift + 4 (Minimap)
- **Implementation**: Direct UIRenderer minimap toggle
- **Features**: World overview, entity indicators, camera viewport
- **State**: Toggles `uiRenderer.hudElements.minimap.enabled`

### Ctrl + Shift + 5 (Start Game)
- **Function**: Delegates to `GameState.startGame()`
- **Transition**: MENU → PLAYING state
- **Side Effects**: Initializes world, activates game systems, transitions UI
- **Error**: Logs warning if GameState unavailable

---

## System Integration

### Keyboard Event Handling

The UIController processes keyboard events through multiple pathways:

1. **p5.js Integration**: Via `keyPressed()` in sketch.js calling `UIManager.handleKeyPress()`
2. **Browser Events**: Direct keyboard event handling in web environments
3. **Modifier Detection**: Multiple fallback methods for Ctrl/Shift detection

### Modifier Key Detection

**Robust Detection Logic:**
```javascript
// Ctrl Key Detection (Multiple Fallbacks)
const isCtrlPressed = (event && event.ctrlKey) || 
                     (typeof keyIsDown !== 'undefined' && keyIsDown(CONTROL)) ||
                     (typeof keyIsDown !== 'undefined' && keyIsDown(17)) ||
                     (window.event && window.event.ctrlKey);

// Shift Key Detection (Multiple Fallbacks)
const isShiftPressed = (event && event.shiftKey) ||
                      (typeof keyIsDown !== 'undefined' && keyIsDown(SHIFT)) ||
                      (typeof keyIsDown !== 'undefined' && keyIsDown(16)) ||
                      (window.event && window.event.shiftKey);
```

### Key Code Reference

| Key | Code | Usage |
|-----|------|--------|
| N | 78 | Shift+N master toggle |
| 1 | 49 | Ctrl+Shift+1 performance |
| 2 | 50 | Ctrl+Shift+2 entity inspector |
| 3 | 51 | Ctrl+Shift+3 debug console |
| 4 | 52 | Ctrl+Shift+4 minimap |
| 5 | 53 | Ctrl+Shift+5 start game |
| ` | 192 | Backtick debug console |
| Ctrl | 17 | Control modifier |
| Shift | 16 | Shift modifier |

---

## Troubleshooting

### Common Issues

**Shortcuts Not Working:**
1. Check `UIManager.initialized` is true
2. Verify keyboard event integration in sketch.js
3. Confirm `handleKeyPress()` is being called with correct parameters

**Partial System Functionality:**
- **Performance Overlay**: Requires `g_performanceMonitor` global
- **Entity Inspector**: Requires `getEntityDebugManager()` function
- **Debug Console**: Requires `toggleDevConsole()` from debug/testing.js
- **Draggable Panels**: Requires `window.draggablePanelManager`
- **Game Start**: Requires global `GameState` with `startGame()` method

### Debug Commands

**Check System Availability:**
```javascript
// Console commands for debugging
console.log('UIManager initialized:', UIManager.initialized);
console.log('Performance Monitor:', typeof g_performanceMonitor);
console.log('Entity Debug Manager:', typeof getEntityDebugManager);
console.log('Draggable Panel Manager:', typeof window.draggablePanelManager);
console.log('GameState:', typeof GameState);
```

**Manual Shortcut Testing:**
```javascript
// Test shortcuts programmatically
UIManager.handleKeyPress(78, 'N', { shiftKey: true }); // Shift+N
UIManager.handleKeyPress(49, '1', { ctrlKey: true, shiftKey: true }); // Ctrl+Shift+1
UIManager.handleKeyPress(192, '`'); // Backtick
```

### Integration Setup

**Required Global Variables:**
```javascript
// Performance monitoring
window.g_performanceMonitor = /* PerformanceMonitor instance */;

// Entity debugging  
window.getEntityDebugManager = function() { return /* EntityDebugManager */ };

// Debug console
window.toggleDevConsole = function() { /* toggle implementation */ };

// Draggable panels
window.draggablePanelManager = /* DraggablePanelManager instance */;

// Game state
window.GameState = { startGame: function() { /* start implementation */ } };
```

**sketch.js Integration:**
```javascript
function keyPressed() {
  if (typeof UIManager !== 'undefined' && UIManager.initialized) {
    const handled = UIManager.handleKeyPress(keyCode, key);
    if (handled) {
      return false; // Prevent default behavior
    }
  }
}
```

---

## Advanced Usage

### Custom Keyboard Shortcuts

**Adding New Shortcuts:**
```javascript
// Extend handleKeyPress method
const originalHandleKeyPress = UIManager.handleKeyPress;
UIManager.handleKeyPress = function(keyCode, key, event) {
  // Handle custom shortcuts first
  if (event && event.ctrlKey && event.altKey && keyCode === 68) { // Ctrl+Alt+D
    this.toggleCustomDebugMode();
    return true;
  }
  
  // Delegate to original handler
  return originalHandleKeyPress.call(this, keyCode, key, event);
};
```

### Programmatic Control

**Bypass Keyboard Shortcuts:**
```javascript
// Direct method calls
UIManager.toggleAllUI();
UIManager.togglePerformanceOverlay();
UIManager.startGame();

// Conditional control
if (gameMode === 'presentation') {
  UIManager.hideAllUI(); // Custom method
}
```

### Event Integration

**Custom Event Listeners:**
```javascript
// Listen for UI state changes
window.addEventListener('uiToggle', (event) => {
  console.log('UI toggled:', event.detail.visible);
});

// Trigger custom events
UIManager.toggleAllUI = function() {
  // Original functionality
  // ...
  
  // Dispatch custom event
  window.dispatchEvent(new CustomEvent('uiToggle', {
    detail: { visible: shouldShow }
  }));
};
```

---

## See Also

- **[UIController API Documentation](UIController.md)** - Complete method documentation
- **[Integration Guide](../guides/ui-integration.md)** - System integration setup
- **[Debug Systems](../guides/debug-systems.md)** - Debug system configuration
- **[Performance Monitoring](../guides/performance.md)** - Performance overlay setup