# UI Effects Layer Selection Box System

## Overview

The UI Effects Layer Selection Box is a new selection system that renders click-and-drag selection boxes directly to the UI effects layer of the rendering pipeline. This provides a modern, integrated selection experience that properly layers with other visual effects.

## Architecture

### Components

1. **EffectsLayerRenderer** - Enhanced with selection box rendering capabilities
2. **UISelectionController** - Handles mouse interactions and selection logic
3. **UISelectionBoxIntegration** - Provides callbacks and integration with existing ant systems
4. **Mouse Integration** - Connected to existing MouseInputController system

### Rendering Pipeline Integration

The selection box renders in the **EFFECTS** layer of the rendering pipeline:

```
TERRAIN → ENTITIES → EFFECTS → UI_GAME → UI_DEBUG → UI_MENU
                        ↑
                 Selection Box renders here
```

This ensures the selection box appears above entities but below UI elements.

## Features

### Visual Features
- **Modern Selection Box**: Clean cyan selection rectangle with corner indicators
- **Semi-transparent Fill**: 30% alpha fill for clear visibility
- **Particle Effects**: Sparkle effects on selection start/end
- **Proper Layering**: Renders in effects layer for correct visual stacking

### Interaction Features
- **Click and Drag**: Standard selection box behavior
- **Single Click Selection**: Click individual entities
- **Drag Threshold**: Distinguishes between clicks and drags (5 pixels)
- **Entity Hover**: Visual feedback for entities in selection box

### Integration Features
- **Existing Ant Compatibility**: Works with current ant selection system
- **Automatic Entity Updates**: Updates selectable entities when ants are spawned
- **Callback System**: Comprehensive event system for customization
- **Debug Support**: Built-in debugging and inspection tools

## Usage

### Basic Usage

The system initializes automatically when the game loads. Selection works by:

1. **Click and drag** in empty space to create a selection box
2. **Single click** on entities to select individual items
3. **Click empty space** to deselect all

### API Functions

```javascript
// Enable/disable selection
setUISelectionEnabled(true);

// Get selected entities
const selected = getUISelectedAnts();

// Clear selection
clearUISelection();

// Update selectable entities (called automatically when ants spawn)
updateUISelectionEntities();

// Debug information
debugUISelection();
```

### Configuration

```javascript
// Access the controller directly
g_uiSelectionController.updateConfig({
  enableSelection: true,
  selectionColor: [0, 200, 255], // RGB color
  strokeWidth: 2,
  fillAlpha: 30,
  minSelectionSize: 10
});
```

### Custom Callbacks

```javascript
g_uiSelectionController.setCallbacks({
  onSelectionStart: (x, y, entities) => {
    console.log('Selection started');
  },
  onSelectionUpdate: (bounds, entitiesInBox) => {
    console.log(`${entitiesInBox.length} entities in selection`);
  },
  onSelectionEnd: (bounds, selectedEntities) => {
    console.log(`Selected ${selectedEntities.length} entities`);
  },
  onSingleClick: (x, y, button, clickedEntity) => {
    console.log('Single click on:', clickedEntity);
  }
});
```

## Testing

### Automated Tests

Run the test suite:
```javascript
const testSuite = new UISelectionBoxTest();
testSuite.runAllTests();
```

### Manual Testing

Interactive testing functions:
```javascript
// Visual selection box test
testSelectionBoxVisual();

// Test with existing ants
testSelectionWithAnts();

// Get debug information
debugUISelection();
```

## Implementation Details

### Mouse Event Flow

1. **MouseInputController** receives raw p5.js mouse events
2. **UISelectionController** processes events and determines selection state
3. **EffectsLayerRenderer** handles visual rendering of selection box
4. **Integration callbacks** update ant selection states

### Entity Detection

The system supports multiple entity property formats:
- `getPosition()` / `getSize()` methods
- `posX, posY, sizeX, sizeY` properties
- `x, y, width, height` properties
- `sprite.pos` and `sprite.size` objects

### Performance Considerations

- **Object Pooling**: EffectsLayerRenderer uses particle pooling
- **Efficient Bounds Checking**: Optimized entity-in-box detection
- **Render Pipeline Integration**: Minimal overhead through proper layer management

## Compatibility

### Existing Systems

The new selection box:
- ✅ **Coexists** with existing SelectionBoxController
- ✅ **Maintains** compatibility with existing ant selection properties
- ✅ **Integrates** with AntUtilities spawning system
- ✅ **Preserves** existing selection callbacks and behaviors

### Migration Path

No migration required - the system runs alongside existing selection:
- Old selection box can be disabled if desired
- New system automatically picks up existing ants
- All existing ant properties remain functional

## Troubleshooting

### Common Issues

1. **Selection box not visible**
   - Check if EffectsRenderer is initialized: `window.EffectsRenderer`
   - Verify effects layer is not disabled: `RenderManager.toggleLayer('effects')`

2. **No entities selectable**
   - Run `updateUISelectionEntities()` to refresh entity list
   - Check if ants array has valid entities: `ants.length`

3. **Selection not working**
   - Verify controller is initialized: `g_uiSelectionController`
   - Check if selection is enabled: `g_uiSelectionController.config.enableSelection`

### Debug Commands

```javascript
// Full system status
debugUISelection();

// Controller status
g_uiSelectionController.getDebugInfo();

// Effects renderer status
window.EffectsRenderer.selectionBox;

// Test system
testSelectionBoxVisual();
```

## Future Enhancements

Potential improvements:
- **Multi-selection shapes** (circle, lasso)
- **Selection modifier keys** (add/remove from selection)
- **Visual selection previews** (ghost entities)
- **Selection filters** (by type, faction, etc.)
- **Selection persistence** across game states

---

*This selection box system provides a modern, integrated approach to entity selection that properly integrates with the game's rendering pipeline while maintaining full compatibility with existing systems.*