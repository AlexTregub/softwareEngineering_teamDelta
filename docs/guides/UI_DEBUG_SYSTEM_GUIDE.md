# Universal UI Debug System

## Overview

The Universal UI Debug System provides interactive debugging capabilities for **any** UI element in the game. It addresses the limitations of the existing menu_debug system by providing:

- **Full X & Y axis movement** (not just Y-axis)
- **Direct click-and-drag** on UI elements (no indirect controls)
- **Screen boundary constraints** (keeps elements visible)
- **Universal compatibility** with any UI component
- **Position persistence** across sessions
- **Integration with existing rendering pipeline**

## Architecture Integration

### Rendering Pipeline Integration
```
RenderLayerManager
├── TERRAIN Layer
├── ENTITIES Layer  
├── EFFECTS Layer
├── UI_GAME Layer
├── UI_DEBUG Layer  ← **UIDebugManager renders here**
└── UI_MENU Layer
```

The `UIDebugManager` is integrated into the `UI_DEBUG` layer in `RenderLayerManager.js`, ensuring it renders on top of all other UI elements for maximum visibility and interaction.

### Key Components

1. **`UIDebugManager.js`** - Core debug system class
2. **`UIDebugIntegration.js`** - Example integration patterns  
3. **`RenderLayerManager.js`** - Pipeline integration
4. **Global instance** - `g_uiDebugManager` available throughout the application

## Usage Guide

### Basic Setup

1. **Initialize the system** (done automatically):
```javascript
// Global initialization - happens automatically
window.g_uiDebugManager = new UIDebugManager();
```

2. **Register UI elements** in your renderer classes:
```javascript
// In UILayerRenderer constructor or initialization
g_uiDebugManager.registerElement(
  'unique_element_id',
  { x: 100, y: 50, width: 200, height: 60 },  // Current bounds
  (newX, newY) => {
    // Callback when position changes
    this.myElementPosition.x = newX;
    this.myElementPosition.y = newY;
  },
  {
    label: 'My UI Element',           // Display name
    persistKey: 'my_element_pos',     // localStorage key
    constraints: {                    // Optional movement limits
      minX: 0,
      maxX: 800,
      minY: 50,
      maxY: 600
    }
  }
);
```

3. **Update your render methods** to use debug-aware positions:
```javascript
renderMyElement() {
  // Use debug position if available, fallback to default
  const x = this.myElementPosition.x || this.defaultX;
  const y = this.myElementPosition.y || this.defaultY;
  
  // Render at debug-aware position
  rect(x, y, width, height);
  // ... rest of rendering
}
```

### Advanced Features

#### Keyboard Controls
- **`~` (tilde)** - Toggle debug mode on/off
- **Arrow keys** - Fine positioning of elements (5px steps)
- **Shift + Arrow keys** - Ultra-fine positioning (1px steps)  
- **Ctrl + Arrow keys** - Coarse positioning (10px steps)
- **`G`** - Toggle grid snapping on/off

#### Mouse Interaction
- **Click yellow handle** - Start dragging an element
- **Drag anywhere** - Move element to new position
- **Auto-snap** - Elements stay within screen bounds
- **Visual feedback** - Red bounding boxes, yellow drag handles

#### Position Persistence  
All positions are automatically saved to localStorage and restored when the game loads.

## Implementation Examples

### Example 1: Simple HUD Element
```javascript
class SimpleHUD {
  constructor() {
    this.position = { x: 10, y: 10 };
    
    // Register with debug system
    g_uiDebugManager.registerElement(
      'simple_hud',
      { x: 10, y: 10, width: 150, height: 60 },
      (x, y) => { this.position.x = x; this.position.y = y; },
      { label: 'Resource Display' }
    );
  }
  
  render() {
    rect(this.position.x, this.position.y, 150, 60);
    text('Resources: 100', this.position.x + 10, this.position.y + 20);
  }
}
```

### Example 2: Complex Menu System
```javascript
class GameMenu {
  constructor() {
    this.menuPosition = { x: 0, y: 0 };
    this.buttonPositions = [];
    
    // Register main menu panel
    g_uiDebugManager.registerElement(
      'main_menu_panel',
      { x: 100, y: 100, width: 300, height: 400 },
      (x, y) => { 
        this.menuPosition.x = x; 
        this.menuPosition.y = y;
        this.updateButtonPositions(); // Reposition buttons relative to menu
      },
      { 
        label: 'Main Menu Panel',
        constraints: { minX: 0, minY: 0, maxX: width-300, maxY: height-400 }
      }
    );
    
    // Register individual buttons (optional - for fine control)
    for (let i = 0; i < 4; i++) {
      g_uiDebugManager.registerElement(
        `menu_button_${i}`,
        { x: 120, y: 150 + i * 60, width: 200, height: 50 },
        (x, y) => { this.buttonPositions[i] = { x, y }; },
        { label: `Menu Button ${i + 1}` }
      );
    }
  }
}
```

### Example 3: Debug Panel Integration
```javascript
class DebugOverlay {
  constructor() {
    this.panels = {
      performance: { x: 10, y: 10 },
      console: { x: 10, y: 200 },
      inspector: { x: width - 250, y: 10 }
    };
    
    // Register each debug panel
    Object.keys(this.panels).forEach(panelName => {
      const panel = this.panels[panelName];
      g_uiDebugManager.registerElement(
        `debug_${panelName}`,
        { x: panel.x, y: panel.y, width: 240, height: 180 },
        (x, y) => { panel.x = x; panel.y = y; },
        { 
          label: `${panelName.charAt(0).toUpperCase() + panelName.slice(1)} Panel`,
          persistKey: `debug_${panelName}_pos`
        }
      );
    });
  }
}
```

## Migration from menu_debug System

### Current Limitations Addressed
1. **Y-axis only** → Full X & Y movement
2. **Indirect dragging** → Direct click-and-drag on elements  
3. **Menu-specific** → Universal for all UI elements
4. **Manual controls** → Visual drag handles
5. **Limited constraints** → Full screen boundary management

### Migration Steps
1. **Keep existing menu_debug** - No need to remove, they can coexist
2. **Add UIDebugManager registration** to your UI classes
3. **Update render methods** to use debug-aware positions
4. **Test with `~` key toggle** - Verify drag handles appear
5. **Gradually migrate elements** from old to new system

## Configuration Options

### UIDebugManager Config
```javascript
g_uiDebugManager.config = {
  boundingBoxColor: [255, 0, 0],      // Red outline
  boundingBoxStroke: 2,               // Outline thickness
  dragHandleColor: [255, 255, 0, 150], // Yellow handle
  handleSize: 8,                      // Handle size in pixels
  snapToGrid: false,                  // Grid snapping
  gridSize: 10,                       // Grid size when snapping
  showLabels: true,                   // Show element labels
  labelColor: [255, 255, 255],        // Label text color
  labelSize: 10                       // Label font size
};
```

### Element-Specific Options
```javascript
g_uiDebugManager.registerElement(id, bounds, callback, {
  label: 'Custom Label',              // Display name
  persistKey: 'storage_key',          // localStorage key (default: elementId)
  constraints: {                      // Movement boundaries
    minX: 0, maxX: 800,              // X-axis limits
    minY: 50, maxY: 600              // Y-axis limits  
  },
  isDraggable: true                   // Enable/disable dragging (default: true)
});
```

## Performance Considerations

- **Minimal overhead** when disabled - no rendering or event processing
- **Efficient hit testing** - only processes mouse events when enabled
- **Lazy initialization** - elements can register before debug system loads
- **Memory cleanup** - automatic disposal of event listeners

## Future Enhancements

Potential improvements that could be added:
- **Multi-select** - Drag multiple elements together
- **Alignment guides** - Snap to align with other elements  
- **Resize handles** - Change element dimensions
- **Layout presets** - Save/load complete UI arrangements
- **Touch support** - Mobile/tablet compatibility
- **Undo/redo** - Position history management (partially implemented)

## Troubleshooting

### Common Issues
1. **Elements not appearing** - Check if debug mode is enabled with `~` key
2. **Can't drag elements** - Ensure element bounds are up-to-date
3. **Position not saving** - Check localStorage permissions
4. **Elements off-screen** - Reset with `g_uiDebugManager.resetAllPositions()`

### Debug Commands
```javascript
// Console commands for debugging
g_uiDebugManager.enable();                    // Force enable
g_uiDebugManager.resetAllPositions();         // Reset all to original
g_uiDebugManager.registeredElements;          // View all registered elements
g_uiDebugManager.config.snapToGrid = true;   // Enable grid snapping
```