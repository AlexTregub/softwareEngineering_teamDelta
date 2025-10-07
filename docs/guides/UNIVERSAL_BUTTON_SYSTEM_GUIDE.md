# Universal Button Group System - Integration Guide

## Overview

The Universal Button Group System provides a comprehensive, performance-optimized solution for managing UI button groups in your game. This system features JSON-based configuration, drag-and-drop functionality, persistent state management, and advanced performance optimizations.

## Quick Start

### 1. Basic Setup

```javascript
// Import the system
const UniversalButtonSystem = require('./Classes/systems/ui/UniversalButtonSystem.js');

// Create and initialize the system
const buttonSystem = new UniversalButtonSystem({
  enableQuadTree: true,
  enableObjectPooling: true,
  enableVisibilityCulling: true,
  configPath: './config/button-system.json',
  canvasWidth: window.innerWidth || 1200,
  canvasHeight: window.innerHeight || 800,
  debugMode: false
});

// Initialize with custom action factory
const actionFactory = {
  executeAction: (buttonConfig, gameContext) => {
    console.log('Button action:', buttonConfig.action);
    // Handle your custom actions here
    return true;
  }
};

buttonSystem.initialize(actionFactory).then(result => {
  console.log('Universal Button System initialized:', result);
});
```

### 2. Integration with Game Loop

```javascript
// In your game's update function
function update() {
  // Update the button system
  buttonSystem.update(mouseX, mouseY, mouseIsPressed);
  
  // Your other game logic...
}

// In your game's render function
function render() {
  // Your game rendering...
  
  // Render button system (should be done last for UI overlay)
  buttonSystem.render();
}
```

### 3. Game State Management

```javascript
// Change game state (automatically loads appropriate button groups)
buttonSystem.changeGameState('playing');

// Available states: 'menu', 'playing', 'paused', 'settings'
// States are defined in config/button-system.json
```

## Configuration System

### Master Configuration (config/button-system.json)

The master configuration defines:
- System-wide settings
- Performance options  
- Game state definitions
- References to button group files
- Default styles and validation rules

### Button Group Files

Individual button group configurations are stored in `config/button-groups/`:
- `main-menu.json` - Main menu navigation
- `gameplay.json` - In-game controls and info
- `settings.json` - Settings and preferences

### Adding New Button Groups

1. Create a new JSON file in `config/button-groups/`
2. Add reference to the file in `config/button-system.json`
3. Define your button groups with layout, appearance, and behavior

Example button group:
```json
{
  "id": "my-custom-group",
  "name": "Custom Button Group",
  "layout": {
    "type": "horizontal",
    "position": { "x": "center", "y": "top" },
    "spacing": 10,
    "padding": { "top": 15, "right": 20, "bottom": 15, "left": 20 }
  },
  "appearance": {
    "scale": 1.0,
    "transparency": 0.9,
    "visible": true,
    "background": { "color": [45, 45, 55, 200], "cornerRadius": 8 }
  },
  "behavior": {
    "draggable": true,
    "snapToEdges": true
  },
  "persistence": {
    "savePosition": true,
    "storageKey": "my-custom-group"
  },
  "buttons": [
    {
      "id": "custom-button",
      "text": "Click Me",
      "size": { "width": 100, "height": 40 },
      "action": { "type": "custom", "handler": "myCustomAction" },
      "tooltip": "This is a custom button"
    }
  ]
}
```

## Advanced Features

### Performance Optimizations

The system includes several performance features:

- **QuadTree Spatial Partitioning**: Efficiently organizes UI elements by location
- **Object Pooling**: Reduces garbage collection by reusing button objects
- **Visibility Culling**: Only renders buttons visible in the viewport

### Custom Action Handlers

Create custom action handlers for your buttons:

```javascript
const actionFactory = {
  executeAction: (buttonConfig, gameContext) => {
    const actionType = buttonConfig.action.type;
    const handler = buttonConfig.action.handler;
    
    switch (actionType) {
      case 'custom':
        return handleCustomAction(handler, buttonConfig.action.parameters);
      case 'entity':
        return handleEntityAction(handler, gameContext);
      // Add more action types as needed
    }
    
    return false;
  }
};

function handleCustomAction(handler, parameters) {
  switch (handler) {
    case 'myCustomAction':
      console.log('Custom action executed!', parameters);
      return true;
  }
  return false;
}
```

### Persistent State

Button groups automatically save their state (position, scale, transparency) to localStorage when persistence is enabled:

```json
{
  "persistence": {
    "savePosition": true,
    "saveScale": true,
    "saveTransparency": true,
    "storageKey": "unique-storage-key"
  }
}
```

### Event Hooks

Add custom hooks for system events:

```javascript
// Render hook - called every frame during rendering
buttonSystem.addRenderHook((visibleGroups, statistics) => {
  console.log(`Rendering ${visibleGroups.length} button groups`);
});

// Update hook - called every frame during update
buttonSystem.addUpdateHook((mouseX, mouseY, mousePressed, statistics) => {
  // Custom update logic
});

// State change hook - called when game state changes
buttonSystem.addStateChangeHook((changeType, oldState, newState) => {
  console.log(`State changed from ${oldState} to ${newState}`);
});
```

## Debugging and Diagnostics

### Debug Mode

Enable debug mode for detailed logging:

```javascript
const buttonSystem = new UniversalButtonSystem({
  debugMode: true,
  enableDebugRendering: true
});
```

### Performance Statistics

Get system performance metrics:

```javascript
const stats = buttonSystem.getStatistics();
console.log('FPS:', stats.averageFPS);
console.log('Active Groups:', stats.activeGroups);
console.log('Update Time:', stats.updateTime, 'ms');
```

### Diagnostic Information

Get comprehensive system diagnostics:

```javascript
const diagnostics = buttonSystem.getDiagnostics();
console.log('System Diagnostics:', diagnostics);
```

## Best Practices

1. **Group Organization**: Organize buttons by functionality and game state
2. **Performance**: Use visibility culling and object pooling for large UIs
3. **State Management**: Define clear game states and appropriate button groups
4. **Persistence**: Enable persistence for user-customizable UI elements
5. **Action Handlers**: Keep action handlers simple and focused
6. **Configuration**: Use JSON configuration for easy modification without code changes

## Troubleshooting

### Common Issues

1. **System not initializing**: Check that all configuration files exist and are valid JSON
2. **Buttons not responding**: Verify action factory is properly configured
3. **Performance issues**: Enable performance optimizations (QuadTree, culling, pooling)
4. **State not persisting**: Check persistence configuration and localStorage availability

### Error Messages

The system provides detailed error messages for common issues:
- Configuration validation errors
- Missing required components
- Action execution failures
- Initialization problems

## Example Implementation

See the test files in `test/behavioral/` for comprehensive examples of system usage and configuration patterns.

The Universal Button Group System is designed to be flexible, performant, and easy to integrate into any game engine or framework.