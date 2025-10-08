# DraggablePanelManager API Documentation

> **Comprehensive draggable panel management system with render integration**

## Overview

The `DraggablePanelManager` provides a complete solution for managing interactive UI panels in the ant simulation game. It handles panel lifecycle, render pipeline integration, game state visibility, and button management.

### Key Features

- ✅ **Panel Management**: Add, remove, show/hide panels with Map-based storage
- ✅ **Render Integration**: Automatic hookup with RenderLayerManager
- ✅ **State Visibility**: Panels shown/hidden based on game state
- ✅ **Button Systems**: Support for vertical, horizontal, and grid button layouts
- ✅ **Debug Features**: Panel train mode 🚂 and comprehensive debugging
- ✅ **Game Actions**: Built-in handlers for common game operations

## Class Reference

### Constructor

```javascript
const panelManager = new DraggablePanelManager();
```

Creates a new panel manager with:

- Empty panel Map storage
- Default state visibility configuration
- Debug mode disabled
- Game state set to 'MENU'

### Core Methods

#### `initialize()`

Initializes the panel manager and integrates with render pipeline.

```javascript
panelManager.initialize();
// ✅ Creates default game panels
// ✅ Registers with RenderLayerManager
// ✅ Sets up automatic rendering
```

#### `addPanel(panelId, config)`

Adds a new draggable panel to the system.

```javascript
panelManager.addPanel('custom-panel', {
  id: 'my-panel',
  title: 'Custom Panel',
  position: { x: 100, y: 100 },
  size: { width: 200, height: 150 },
  buttons: {
    layout: 'vertical',
    spacing: 5,
    items: [
      {
        caption: 'Action 1',
        onClick: () => console.log('Clicked!'),
        style: ButtonStyles.SUCCESS
      }
    ]
  }
});
```

**Parameters:**

- `panelId` (string): Unique identifier for the panel
- `config` (Object): Panel configuration object

**Returns:** `DraggablePanel` instance

#### `removePanel(panelId)`

Removes a panel from the system.

```javascript
panelManager.removePanel('tools');
// Removes the tools panel completely
```

#### `showPanel(panelId)` / `hidePanel(panelId)`

Control individual panel visibility.

```javascript
panelManager.showPanel('debug');   // Show debug panel
panelManager.hidePanel('stats');   // Hide stats panel
```

### Game State Management

#### `updateGameState(newState)`

Updates the current game state and adjusts panel visibility.

```javascript
panelManager.updateGameState('PLAYING');
// Shows: tools, resources, stats panels
// Hides: debug panel (unless in DEBUG_MENU state)
```

**Supported Game States:**

- `'MENU'`: No panels visible
- `'PLAYING'`: tools, resources, stats panels
- `'PAUSED'`: tools, resources, stats panels  
- `'DEBUG_MENU'`: All panels including debug
- `'GAME_OVER'`: Only stats panel

#### `renderPanels(gameState)`

Renders all visible panels based on current game state.

```javascript
// Called automatically by render pipeline
panelManager.renderPanels('PLAYING');
```

### Default Panels

The system creates four default panels:

#### 1. Tools Panel (`'tools'`)

- **Position**: (20, 80)
- **Layout**: Vertical buttons
- **Actions**: Spawn Ant, Clear Ants, Pause/Play, Debug Info

#### 2. Resources Panel (`'resources'`)

- **Position**: (180, 80)
- **Layout**: 2-column grid
- **Actions**: Wood, Food, Stone selection, Resource Info

#### 3. Stats Panel (`'stats'`)

- **Position**: (380, 80)
- **Layout**: Horizontal buttons
- **Actions**: Save, Load, Reset game

#### 4. Debug Panel (`'debug'`)

- **Position**: (600, 80)
- **Layout**: Vertical buttons  
- **Actions**: Toggle Rendering, Performance, Entity Debug, Console Dump
- **Visibility**: Only shown in `DEBUG_MENU` state

### Game Action Methods

The panel manager includes built-in handlers for common game operations:

```javascript
// Ant Management
panelManager.spawnAnt()        // Spawn ant at mouse position
panelManager.clearAnts()       // Remove all ants

// Game Control  
panelManager.togglePause()     // Pause/unpause game
panelManager.toggleDebug()     // Toggle debug mode

// Resource Management
panelManager.selectResource('wood')  // Select resource type
panelManager.showResourceInfo()      // Show resource details

// Save/Load
panelManager.saveGame()        // Save current state
panelManager.loadGame()        // Load saved state  
panelManager.resetGame()       // Reset to initial state

// Debug Actions
panelManager.toggleRendering()     // Toggle render system
panelManager.togglePerformance()   // Toggle performance monitor
panelManager.toggleEntityDebug()   // Toggle entity debug viz
panelManager.dumpConsole()         // Log debug info
```

### Debug Features

#### Panel Train Mode 🚂

Debug feature where panels follow each other when dragged:

```javascript
panelManager.togglePanelTrainMode();     // Toggle on/off
panelManager.setPanelTrainMode(true);    // Enable explicitly  
panelManager.isPanelTrainModeEnabled();  // Check status
```

#### Status Information

Get comprehensive status information:

```javascript
const status = panelManager.getStatus();
console.log(status);
// {
//   isInitialized: true,
//   totalPanels: 4, 
//   visiblePanels: 3,
//   anyDragging: false,
//   panels: { /* panel details */ }
// }
```

### Integration Requirements

#### Dependencies

The panel manager integrates with these global systems:

- `g_renderLayerManager`: For automatic rendering integration
- `g_antManager`: For ant spawning/clearing operations  
- `g_gameStateManager`: For game state management
- `g_resourceManager`: For resource selection
- `g_uiDebugManager`: For debug mode toggling
- `g_renderController`: For render system control
- `g_performanceMonitor`: For performance monitoring
- `g_entityDebugManager`: For entity debug visualization

#### Render Pipeline Integration

```javascript
// Automatic integration (happens in initialize())
const originalUIRenderer = g_renderLayerManager.layerRenderers.get('ui_game');

g_renderLayerManager.layerRenderers.set('ui_game', (gameState) => {
  // Call original UI renderer first
  if (originalUIRenderer) {
    originalUIRenderer(gameState);
  }
  
  // Then render our panels
  this.renderPanels(gameState);
});
```

### Button Layout Options

#### Vertical Layout

```javascript
buttons: {
  layout: 'vertical',
  spacing: 5,
  buttonWidth: 120,
  buttonHeight: 28,
  items: [/* button configs */]
}
```

#### Horizontal Layout  

```javascript
buttons: {
  layout: 'horizontal', 
  spacing: 10,
  buttonWidth: 80,
  buttonHeight: 30,
  items: [/* button configs */]
}
```

#### Grid Layout

```javascript
buttons: {
  layout: 'grid',
  columns: 2,
  spacing: 8, 
  buttonWidth: 70,
  buttonHeight: 40,
  items: [/* button configs */]
}
```

### Usage Examples

#### Basic Setup

```javascript
// Initialize the panel manager
const panelManager = new DraggablePanelManager();
panelManager.initialize();

// Panels are now integrated into render pipeline
// and will show/hide based on game state changes
```

#### Adding Custom Panel

```javascript
// Add a custom control panel
panelManager.addPanel('controls', {
  id: 'control-panel',
  title: 'Game Controls',
  position: { x: 50, y: 300 },
  size: { width: 160, height: 120 },
  buttons: {
    layout: 'vertical',
    spacing: 5,
    buttonWidth: 140,  
    buttonHeight: 30,
    items: [
      {
        caption: 'Speed Up',
        onClick: () => game.setSpeed(2.0),
        style: ButtonStyles.SUCCESS
      },
      {
        caption: 'Slow Down', 
        onClick: () => game.setSpeed(0.5),
        style: ButtonStyles.WARNING
      }
    ]
  }
});
```

#### State-Based Visibility

```javascript
// Change game state - panels auto-adjust visibility
panelManager.updateGameState('DEBUG_MENU');
// Now debug panel becomes visible

panelManager.updateGameState('GAME_OVER'); 
// Only stats panel remains visible
```

#### Manual Control

```javascript
// Override state-based visibility
panelManager.showPanel('debug');    // Force show debug panel
panelManager.hidePanel('resources'); // Force hide resources

// Reset all panels to default positions  
panelManager.resetAllPanels();
```

### Error Handling

The panel manager includes comprehensive error handling:

```javascript
// Missing dependencies are logged as warnings
// ⚠️ AntManager not found
// ⚠️ RenderLayerManager not found - panels will need manual rendering

// Duplicate initialization is prevented
// DraggablePanelManager already initialized

// Missing panels are handled gracefully
panelManager.showPanel('nonexistent'); // No error, just no action
```

### Performance Considerations

- **Efficient Rendering**: Only visible panels are rendered
- **State Caching**: Game state changes only update when different
- **Map Storage**: O(1) panel lookup and management
- **Lazy Integration**: Render pipeline integration only when available

### Migration Notes

This version **replaces and combines** the previous separate:

- `DraggablePanelManager.js` (core management)
- `DraggablePanelIntegration.js` (render integration)

**Breaking Changes:** None - all previous functionality maintained

**New Features:**

- ✅ Built-in render pipeline integration
- ✅ Default game panels with working buttons  
- ✅ State-based visibility management
- ✅ Comprehensive game action handlers

---

## See Also

- [DraggablePanel.md](./DraggablePanel.md) - Individual panel API
- [UIController.md](./UIController.md) - Main UI system  
- [RenderLayerManager.md](./RenderLayerManager.md) - Render pipeline
- [Quick Reference](../quick-reference.md) - Panel system overview
