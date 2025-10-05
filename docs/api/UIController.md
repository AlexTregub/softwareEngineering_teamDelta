# UIController API Documentation

> **Module**: `Classes/rendering/UIController.js`  
> **Version**: 1.0.0  
> **Last Updated**: October 2025

## Overview

The `UIController` class provides a centralized interface for managing all UI elements, keyboard shortcuts, and debug systems in the game. It serves as the main entry point for UI interactions and integrates with multiple existing systems including draggable panels, performance monitoring, entity debugging, and game state management.

## Class: UIController

### Constructor

#### `new UIController()`

Creates a new UIController instance with default keyboard bindings and initializes internal state.

**Implementation Details:**
- Sets up keyboard binding map with Ctrl+Shift combinations
- Initializes `uiRenderer` to null (set during initialization)
- Creates default key bindings for all major UI functions
- Sets `initialized` flag to false until `initialize()` is called

**Default Key Bindings:**
```javascript
{
  'CTRL+SHIFT+1': 'togglePerformanceOverlay',
  'CTRL+SHIFT+2': 'toggleEntityInspector', 
  'CTRL+SHIFT+3': 'toggleDebugConsole',
  'CTRL+SHIFT+4': 'toggleMinimap',
  'CTRL+SHIFT+5': 'startGame',
  'BACKTICK': 'toggleDebugConsole'
}
```

---

## Core Methods

### `initialize()`

**Returns:** `boolean` - True if successful, false if UIRenderer unavailable

Initializes the UI controller and establishes connections to the rendering system.

**Implementation Details:**
- Searches for `UIRenderer` in both `window` and `global` scope
- Sets up keyboard control integration
- Enables performance overlay by default in development mode
- Logs initialization status to console

**Side Effects:**
- Sets `this.initialized = true` on success
- Calls `setupKeyboardControls()` internally
- Enables `uiRenderer.debugUI.performanceOverlay.enabled = true`

**Error Handling:**
- Returns `false` and logs warning if UIRenderer not found
- Gracefully degrades functionality when renderer unavailable

---

### `handleKeyPress(keyCode, key, event)`

**Parameters:**
- `keyCode` (number): The numeric key code pressed
- `key` (string): The key character representation
- `event` (Event, optional): The keyboard event object

**Returns:** `boolean` - True if key was handled, false if ignored

Processes keyboard input and routes to appropriate UI functions. Uses multiple fallback methods for detecting modifier keys across different environments.

**Implementation Details:**

**Modifier Key Detection:**
```javascript
// Ctrl key detection (multiple fallbacks)
const isCtrlPressed = (event && event.ctrlKey) || 
                     (typeof keyIsDown !== 'undefined' && keyIsDown(CONTROL)) ||
                     (typeof keyIsDown !== 'undefined' && keyIsDown(17)) ||
                     (window.event && window.event.ctrlKey);

// Shift key detection (multiple fallbacks)  
const isShiftPressed = (event && event.shiftKey) ||
                      (typeof keyIsDown !== 'undefined' && keyIsDown(SHIFT)) ||
                      (typeof keyIsDown !== 'undefined' && keyIsDown(16)) ||
                      (window.event && window.event.shiftKey);
```

**Key Combinations Handled:**
- **Shift+N** (keyCode 78): Universal UI toggle - shows/hides all panels
- **Ctrl+Shift+1** (keyCode 49): Performance overlay toggle
- **Ctrl+Shift+2** (keyCode 50): Entity inspector toggle
- **Ctrl+Shift+3** (keyCode 51): Debug console toggle
- **Ctrl+Shift+4** (keyCode 52): Minimap toggle
- **Ctrl+Shift+5** (keyCode 53): Start game transition
- **Backtick** (keyCode 192): Debug console toggle (alternative)

**Integration Notes:**
- Designed to work with p5.js `keyPressed()` events
- Compatible with browser keyboard events
- Returns `false` for unhandled keys to allow event bubbling

---

## UI Toggle Methods

### `toggleAllUI()`

**Shortcut:** Shift+N

Master toggle for all UI elements with intelligent visibility detection. Uses a "show all if any are hidden" approach for intuitive behavior.

**Implementation Details:**

**Visibility Logic:**
```javascript
const panelCount = window.draggablePanelManager.getPanelCount();
const visibleCount = window.draggablePanelManager.getVisiblePanelCount();
const shouldShow = visibleCount < panelCount; // Show if ANY are hidden
```

**Systems Managed:**
- **Draggable Panels**: All panels via `draggablePanelManager`
  - 'resource-display' panel
  - 'performance-monitor' panel  
  - 'debug-info' panel
- **Legacy Systems**: 
  - Ant Control Panel (`showAntControlPanel`/`hideAntControlPanel`)
- **Debug Systems**:
  - Performance overlay via `g_performanceMonitor`
  - Entity inspector via `getEntityDebugManager()`
  - Debug console via `toggleDevConsole()`
- **Game UI**: Minimap display

**Console Feedback:**
- "👁️ All UI panels shown" when showing
- "🙈 All UI panels hidden" when hiding  
- "⚠️ DraggablePanelManager not available for UI toggle" on error

**Error Handling:**
- Gracefully handles missing `draggablePanelManager`
- Checks for function existence before calling legacy systems
- Continues execution even if individual systems fail

---

### `togglePerformanceOverlay()`

**Shortcut:** Ctrl+Shift+1

Toggles the performance monitoring display showing FPS, memory usage, and render statistics.

**Implementation Details:**

**Primary System Integration:**
```javascript
if (g_performanceMonitor && typeof g_performanceMonitor.setDebugDisplay === 'function') {
  const currentState = g_performanceMonitor.debugDisplay && g_performanceMonitor.debugDisplay.enabled;
  g_performanceMonitor.setDebugDisplay(!currentState);
}
```

**Fallback Integration:**
- Uses `uiRenderer.togglePerformanceOverlay()` if primary system unavailable
- Logs state changes to console for debugging

**Dependencies:**
- **Primary**: Global `g_performanceMonitor` object with `setDebugDisplay()` method
- **Fallback**: UIRenderer with performance overlay capabilities

**Display Information:**
- Current FPS (frames per second)
- Memory usage statistics
- Render performance metrics
- Entity count and processing time

---

### `toggleEntityInspector()`

**Shortcut:** Ctrl+Shift+2  

Toggles detailed entity information display and debug overlays for selected entities.

**Implementation Details:**

**Primary System Integration:**
```javascript
if (typeof getEntityDebugManager === 'function') {
  const manager = getEntityDebugManager();
  if (manager && typeof manager.toggleGlobalDebug === 'function') {
    manager.toggleGlobalDebug();
  }
}
```

**System Dependencies:**
- **Primary**: `debug/EntityDebugManager.js` via `getEntityDebugManager()`
- **Fallback**: UIRenderer entity inspector functionality

**Features Provided:**
- Entity state visualization
- Health/status overlays  
- Debug information display
- Entity selection highlighting
- Property inspection panels

**Integration Points:**
- Uses existing entity debug system from `debug/EntityDebugManager.js`
- Connects to entity selection systems
- Integrates with mouse interaction for entity picking

---

### `toggleDebugConsole()`

**Shortcuts:** Ctrl+Shift+3 or ` (backtick)

Toggles the command-line debug console interface for runtime debugging and system control.

**Implementation Details:**

**Primary System Integration:**
```javascript
if (typeof toggleDevConsole === 'function') {
  toggleDevConsole();
}
```

**System Dependencies:**
- **Primary**: `debug/testing.js` debug console system via `toggleDevConsole()`
- **Fallback**: UIRenderer debug console functionality

**Console Capabilities:**
- Runtime command execution
- Variable inspection and modification
- System state debugging
- Performance profiling commands
- Entity manipulation tools

**Dual Shortcut Support:**
- Ctrl+Shift+3: Part of systematic UI shortcuts
- Backtick (`): Quick access key for developers

---

### `toggleMinimap()`

**Shortcut:** Ctrl+Shift+4

Toggles the minimap display showing a scaled overview of the game world.

**Implementation Details:**

**Direct UIRenderer Integration:**
```javascript
if (this.uiRenderer) {
  if (this.uiRenderer.hudElements.minimap.enabled) {
    this.uiRenderer.disableMinimap();
  } else {
    this.uiRenderer.enableMinimap();
  }
}
```

**Features:**
- Scaled world overview
- Entity position indicators
- Camera viewport representation
- Interactive navigation support

---

## Game State Management

### `startGame()`

**Shortcut:** Ctrl+Shift+5

Initiates game start by transitioning from MENU state to PLAYING state through the GameState management system.

**Implementation Details:**

**State Transition Logic:**
```javascript
if (GameState && GameState.startGame) {
  console.log('UIController: Starting game (MENU -> PLAYING state)');
  GameState.startGame();
} else {
  console.warn('UIController: GameState.startGame() not available');
}
```

**System Integration:**
- Delegates to global `GameState.startGame()` method
- Handles world initialization through GameState system
- Manages UI transitions from menu to game view

**State Flow:**
- **From**: MENU, PAUSED, or any non-PLAYING state
- **To**: PLAYING state with full game systems active
- **Fallback**: Logs warning and maintains current state

**Side Effects:**
- Initializes game world and entities
- Activates gameplay UI elements
- Starts game loops and timers
- Transitions visual elements from menu to game

---

## Mouse Interaction System

### `handleMousePressed(x, y, button)`

**Parameters:**
- `x` (number): Mouse X coordinate
- `y` (number): Mouse Y coordinate  
- `button` (number): Mouse button pressed (LEFT/RIGHT/etc)

**Returns:** `boolean` - True if event was handled

Processes mouse press events for UI interaction including selection boxes and context menus.

**Implementation Details:**

**Left Click (Selection):**
```javascript
if (button === LEFT || button === 0) {
  this.uiRenderer.startSelectionBox(x, y);
  return false; // Allow other systems to handle too
}
```

**Right Click (Context Menu):**
```javascript
if (button === RIGHT || button === 2) {
  const contextItems = this.getContextMenuItems(x, y);
  if (contextItems.length > 0) {
    this.uiRenderer.showContextMenu(contextItems, x, y);
    return true;
  }
}
```

**System Integration:**
- Starts selection box drawing for multi-entity selection
- Generates context-sensitive right-click menus
- Integrates with entity detection and interaction systems

---

### `handleMouseDragged(x, y)`

Manages ongoing mouse drag operations, primarily for selection box updates.

**Implementation:**
```javascript
if (this.uiRenderer.interactionUI.selectionBox.active) {
  this.uiRenderer.updateSelectionBox(x, y);
  return true;
}
```

**Features:**
- Real-time selection box size updates
- Visual feedback during drag operations
- Integration with multi-entity selection system

---

### `handleMouseReleased(x, y, button)`

Handles mouse release events to complete interaction operations.

**Implementation Details:**
- **Selection Box**: Completes multi-entity selection
- **Context Menu**: Hides context menu on any click
- **State Cleanup**: Resets interaction state flags

**Selection Completion:**
```javascript
if (this.uiRenderer.interactionUI.selectionBox.active) {
  this.uiRenderer.endSelectionBox(); // Completes entity selection
  return true;
}
```

---

### `handleMouseMoved(x, y)`

Processes mouse movement for hover effects and tooltip updates.

**Tooltip System:**
```javascript
const hoveredEntity = this.getEntityAtPosition(x, y);
if (hoveredEntity) {
  const tooltipText = this.getEntityTooltipText(hoveredEntity);
  this.uiRenderer.showTooltip(tooltipText, x, y + 20);
} else {
  this.uiRenderer.hideTooltip();
}
```

**Entity Detection:**
- Checks all entities within 20-pixel hover radius
- Prioritizes closest entity to mouse position
- Supports both ants array and general entity systems

---

## Utility Methods

### `getEntityAtPosition(x, y)`

**Returns:** Entity object or null

Performs spatial query to find entity at specified screen coordinates.

**Implementation:**
```javascript
if (typeof ants !== 'undefined') {
  for (let ant of ants) {
    if (ant && ant.x !== undefined && ant.y !== undefined) {
      const distance = Math.sqrt((ant.x - x) ** 2 + (ant.y - y) ** 2);
      if (distance < 20) { // 20 pixel hover radius
        return ant;
      }
    }
  }
}
```

**Features:**
- 20-pixel detection radius for user-friendly interaction
- Handles undefined/null entities gracefully
- Currently focused on ants array but extensible

**TODO Enhancements:**
- Extend to support all entity types (resources, buildings, etc.)
- Implement spatial indexing for better performance with many entities
- Add configurable detection radius based on entity size
- Support for entity selection priority (smaller entities prioritized when overlapping)

---

### `getEntityTooltipText(entity)`

**Returns:** String - Formatted tooltip text

Generates descriptive tooltip text for entities based on available properties.

**Implementation:**
```javascript
let text = `${entity.constructor.name || 'Entity'}`;

if (entity.id) text += ` (${entity.id})`;
if (entity.currentState) text += ` - ${entity.currentState}`;
if (entity.health !== undefined) text += ` | Health: ${entity.health}`;

return text;
```

**Information Displayed:**
- Entity type (class name)
- Unique identifier (if available)
- Current state (for state machine entities)  
- Health value (if health system present)

**TODO Enhancements:**
- Add resource information for resource entities
- Display job/task information for worker entities  
- Show inventory contents for container entities
- Add performance metrics for high-frequency entities
- Implement tooltip caching for performance optimization

---

### `getContextMenuItems(x, y)`

**Returns:** Array of menu item strings

Generates context-sensitive menu options based on what's at the clicked position.

**Entity Context Menu:**
```javascript
if (entity) {
  items.push('Inspect Entity');
  items.push('Follow Entity');
  if (entity.isSelected && entity.isSelected()) {
    items.push('Deselect');
  } else {
    items.push('Select');
  }
}
```

**Empty Space Context Menu:**
```javascript
items.push('Build Here');
items.push('Set Waypoint');
```

**Menu Structure:**
- Context-sensitive options based on hover target
- Entity-specific actions when entity is present
- General world actions for empty space
- Separator and Cancel options for all menus

**TODO Enhancements:**
- Implement actual menu action handlers
- Add building type selection submenu
- Support for terrain-specific options
- Add debug actions for development mode
- Implement menu keyboard navigation

---

## Individual Panel Control Methods

The following methods provide programmatic control over individual UI panels, primarily used by `toggleAllUI()`:

### `showPerformanceOverlay()` / `hidePerformanceOverlay()`
Direct control over performance monitoring display.

### `showEntityInspector()` / `hideEntityInspector()`  
Direct control over entity debugging interface.

### `showDebugConsole()` / `hideDebugConsole()`
Direct control over command-line debug console.

### `showMinimap()` / `hideMinimap()`
Direct control over minimap display.

**Implementation Pattern:**
```javascript
// Example: Performance Overlay
showPerformanceOverlay() {
  if (typeof g_performanceMonitor !== 'undefined' && 
      g_performanceMonitor && 
      typeof g_performanceMonitor.setDebugDisplay === 'function') {
    g_performanceMonitor.setDebugDisplay(true);
  }
}
```

**Error Handling:**
- Checks for system availability before calling
- Gracefully handles missing dependencies
- No console warnings for expected missing systems

---

## Menu System Integration

### `showMainMenu()` / `hideMainMenu()`
Controls main menu visibility through UIRenderer menu systems.

### `showPauseMenu()` / `hidePauseMenu()`  
Controls pause menu visibility through UIRenderer menu systems.

**Implementation:**
```javascript
showMainMenu() {
  if (this.uiRenderer) {
    this.uiRenderer.menuSystems.mainMenu.active = true;
  }
}
```

**Integration Points:**
- Direct UIRenderer menu system control
- State-based menu management
- Game flow integration

---

## Configuration and Statistics

### `configure(options)`
**Parameters:** `options` (Object) - Configuration options

Updates UIRenderer configuration with provided options.

### `getStats()`
**Returns:** Object or null - UI system statistics

Retrieves current statistics from UIRenderer if available.

### `getUIRenderer()`
**Returns:** UIRenderer instance or null

Provides direct access to underlying UIRenderer for advanced operations.

---

## Global Instance

### `UIManager`

A global singleton instance of UIController automatically created and initialized:

```javascript
const UIManager = new UIController();

// Available globally
window.UIManager = UIManager; // Browser
global.UIManager = UIManager; // Node.js

// Auto-initialization with delay
setTimeout(() => {
  UIManager.initialize();
}, 100);
```

**Usage:**
```javascript
// Direct global access
UIManager.toggleAllUI();

// Via keyboard shortcuts  
// Press Shift+N for toggle all UI

// Programmatic control
if (UIManager.initialized) {
  UIManager.startGame();
}
```

---

## Integration Architecture

### System Dependencies

**Core Systems:**
- `UIRenderer`: Primary rendering system (optional)
- `GameState`: Game state management (optional)
- `draggablePanelManager`: Panel management (optional)

**Debug Systems:**
- `g_performanceMonitor`: Performance monitoring
- `EntityDebugManager`: Entity debugging via `getEntityDebugManager()`
- Debug console via `toggleDevConsole()` from `debug/testing.js`

**Game Systems:**  
- `ants`: Global ants array for entity detection
- Various global panel functions (`showAntControlPanel`, etc.)

### Error Resilience

The UIController is designed to work gracefully even when dependent systems are unavailable:

- **Graceful Degradation**: Missing systems result in warnings, not crashes
- **Multiple Fallbacks**: Primary and backup systems for most functions  
- **Optional Dependencies**: Core functionality works without advanced systems
- **Development-Friendly**: Extensive logging for debugging integration issues

### Performance Considerations

- **Lazy Initialization**: Systems initialized only when first used
- **Minimal Overhead**: Keyboard handling uses simple key code checks
- **Efficient Entity Detection**: 20-pixel radius prevents excessive iteration
- **Cached References**: Stores system references to avoid repeated lookups

**TODO Performance Enhancements:**
- Implement spatial indexing for entity detection
- Add debouncing for mouse move events  
- Cache tooltip text for frequently hovered entities
- Optimize keyboard handling with key mapping tables
- Add performance monitoring for UI system overhead

---

## Development and Debugging

### Console Logging

The UIController provides extensive console feedback for debugging:

**Initialization:**
- "UIController initialized successfully" 
- "UIController: UIRenderer not available"

**Keyboard Shortcuts:**
- "UIController keyboard shortcuts: Shift+N (Toggle All UI), Ctrl+Shift+1-5 (Individual Panels), ` (Command Line)"

**System State Changes:**
- "UIController: Performance Monitor ENABLED/DISABLED"
- "UIController: Using existing entity debug manager"
- "UIController: Starting game (MENU -> PLAYING state)"
- "👁️ All UI panels shown" / "🙈 All UI panels hidden"

**Error Conditions:**
- "UIController: GameState.startGame() not available"
- "⚠️ DraggablePanelManager not available for UI toggle"

### Integration Testing

**Manual Testing Shortcuts:**
```javascript
// Test individual systems
UIManager.togglePerformanceOverlay(); // Should show FPS
UIManager.toggleEntityInspector();    // Should show entity info
UIManager.toggleDebugConsole();       // Should show console
UIManager.startGame();                // Should transition to game

// Test master toggle
UIManager.toggleAllUI(); // Should show/hide all panels
```

**System Availability Check:**
```javascript
console.log('UIRenderer available:', !!UIManager.getUIRenderer());
console.log('GameState available:', typeof GameState !== 'undefined');
console.log('Performance Monitor:', typeof g_performanceMonitor !== 'undefined');
console.log('Draggable Panels:', typeof window.draggablePanelManager !== 'undefined');
```

---

## Module Export Compatibility

The UIController supports multiple module systems:

**CommonJS (Node.js):**
```javascript
const { UIController, UIManager } = require('./UIController');
```

**ES6 Modules:**
```javascript
import { UIController, UIManager } from './UIController.js';
```

**Global Browser:**
```javascript
// Available as window.UIManager automatically
UIManager.initialize();
```

This ensures compatibility across different environments and build systems while maintaining backward compatibility with existing code.