# UIDebugIntegration API Documentation

> **Module**: `Classes/rendering/UIDebugIntegration.js`  
> **Version**: 1.0.0  
> **Author**: Software Engineering Team Delta - David Willman  
> **Last Updated**: October 2025

## Overview

The `UIDebugIntegration` module provides integration examples and patterns for connecting existing UI systems with the UIDebugManager for universal drag-and-drop repositioning and debug visualization.

## Class: UILayerRendererDebugIntegration

### Integration Pattern

Shows how to retrofit existing UI rendering systems with debug capabilities.

```javascript
class UILayerRendererDebugIntegration {
  constructor() {
    // Initialize debug-aware positions for UI elements
    this.debugPositions = {
      toolbar: { x: 0, y: 0 }, // Will be set by debug system
      hud: { x: 10, y: 10 },
      minimap: { x: 0, y: 0 }, // Calculated based on screen size
      resourceCounter: { x: 20, y: 20 }
    };
    
    // Reference to debug manager
    this.debugManager = null;
    this.debugEnabled = false;
  }
}
```

## Integration Methods

### `initializeDebugIntegration(debugManager)`

**Parameters:**
- `debugManager` (UIDebugManager): Debug manager instance

Sets up debug integration for all UI elements.

**Implementation:**
```javascript
initializeDebugIntegration(debugManager) {
  this.debugManager = debugManager;
  
  // Register all UI elements with debug manager
  this.registerUIElementsForDebug();
  
  // Set up debug event handlers
  this.setupDebugEventHandlers();
  
  console.log('UILayerRenderer: Debug integration initialized');
}

registerUIElementsForDebug() {
  // Register toolbar
  this.debugManager.registerElement('toolbar', {
    x: this.debugPositions.toolbar.x,
    y: this.debugPositions.toolbar.y,
    width: 400,
    height: 60,
    render: () => this.renderToolbar()
  });
  
  // Register HUD elements
  this.debugManager.registerElement('resourceCounter', {
    x: this.debugPositions.resourceCounter.x,
    y: this.debugPositions.resourceCounter.y,
    width: 200,
    height: 80,
    render: () => this.renderResourceCounter()
  });
  
  // Register minimap
  this.debugManager.registerElement('minimap', {
    x: this.debugPositions.minimap.x,
    y: this.debugPositions.minimap.y,
    width: 120,
    height: 120,
    render: () => this.renderMinimap()
  });
}
```

### `enableDebugMode()`

Activates debug mode for UI positioning.

```javascript
enableDebugMode() {
  if (!this.debugManager) {
    console.warn('UILayerRenderer: Debug manager not initialized');
    return;
  }
  
  this.debugEnabled = true;
  this.debugManager.activate();
  
  // Show debug indicators
  console.log('UILayerRenderer: Debug mode enabled - drag UI elements to reposition');
}
```

### `disableDebugMode()`

Deactivates debug mode and saves current positions.

```javascript
disableDebugMode() {
  if (!this.debugManager) return;
  
  this.debugEnabled = false;
  this.debugManager.deactivate();
  
  // Save current positions
  this.syncDebugPositions();
  
  console.log('UILayerRenderer: Debug mode disabled');
}
```

## Position Synchronization

### `syncDebugPositions()`

Synchronizes positions from debug manager back to UI system.

```javascript
syncDebugPositions() {
  if (!this.debugManager) return;
  
  // Update internal positions from debug manager
  Object.keys(this.debugPositions).forEach(elementId => {
    const debugElement = this.debugManager.registeredElements[elementId];
    if (debugElement) {
      this.debugPositions[elementId].x = debugElement.x;
      this.debugPositions[elementId].y = debugElement.y;
    }
  });
  
  console.log('UI positions synchronized from debug manager');
}
```

### `updateElementPosition(elementId, x, y)`

**Parameters:**
- `elementId` (string): UI element identifier
- `x`, `y` (number): New position coordinates

Updates both internal position and debug manager position.

```javascript
updateElementPosition(elementId, x, y) {
  // Update internal position
  if (this.debugPositions[elementId]) {
    this.debugPositions[elementId].x = x;
    this.debugPositions[elementId].y = y;
  }
  
  // Update debug manager if active
  if (this.debugManager && this.debugManager.registeredElements[elementId]) {
    this.debugManager.registeredElements[elementId].x = x;
    this.debugManager.registeredElements[elementId].y = y;
  }
}
```

## Enhanced Rendering Methods

### `renderWithDebugSupport(renderMethod, elementId)`

**Parameters:**
- `renderMethod` (Function): Original render function
- `elementId` (string): Element ID for debug integration

Wrapper that adds debug support to existing render methods.

```javascript
renderWithDebugSupport(renderMethod, elementId) {
  // Get current position (debug or normal)
  const position = this.getElementPosition(elementId);
  
  // Save current transform state
  push();
  
  // Apply debug position if active
  if (this.debugEnabled) {
    translate(position.x, position.y);
  }
  
  // Call original render method
  renderMethod.call(this);
  
  // Restore transform state
  pop();
  
  // Render debug overlay if active
  if (this.debugEnabled && this.debugManager) {
    this.debugManager.renderDebugOverlays();
  }
}
```

### `getElementPosition(elementId)`

**Parameters:**
- `elementId` (string): Element identifier

**Returns:** `{x, y}` - Current element position

Gets element position from debug manager if active, otherwise returns stored position.

```javascript
getElementPosition(elementId) {
  if (this.debugEnabled && 
      this.debugManager && 
      this.debugManager.registeredElements[elementId]) {
    const debugElement = this.debugManager.registeredElements[elementId];
    return { x: debugElement.x, y: debugElement.y };
  }
  
  return this.debugPositions[elementId] || { x: 0, y: 0 };
}
```

## Event Integration

### `handleDebugInput(inputType, ...args)`

**Parameters:**
- `inputType` (string): Input event type
- `args`: Event-specific arguments

Routes input events to debug manager when debug mode is active.

```javascript
handleDebugInput(inputType, ...args) {
  if (!this.debugEnabled || !this.debugManager) return false;
  
  switch (inputType) {
    case 'mousePressed':
      return this.debugManager.handleMousePressed(...args);
    case 'mouseDragged':
      return this.debugManager.handleMouseDragged(...args);
    case 'mouseReleased':
      return this.debugManager.handleMouseReleased(...args);
    case 'keyPressed':
      return this.handleDebugKeyPress(...args);
  }
  
  return false;
}

handleDebugKeyPress(key, keyCode) {
  // Toggle debug mode with Ctrl+D
  if (key === 'D' && keyIsDown(CONTROL)) {
    if (this.debugEnabled) {
      this.disableDebugMode();
    } else {
      this.enableDebugMode();
    }
    return true;
  }
  
  // Save positions with Ctrl+S
  if (key === 'S' && keyIsDown(CONTROL) && this.debugEnabled) {
    this.debugManager.savePositions();
    return true;
  }
  
  return false;
}
```

## Usage Examples

### Basic Integration Setup

```javascript
// Create UI renderer with debug integration
const uiRenderer = new UILayerRendererDebugIntegration();
const debugManager = new UIDebugManager();

// Initialize debug integration
uiRenderer.initializeDebugIntegration(debugManager);

// Main loop integration
function draw() {
  // Render UI elements with debug support
  uiRenderer.renderWithDebugSupport(() => {
    uiRenderer.renderHUD(gameState);
    uiRenderer.renderToolbar(gameState.ui);
  }, 'main_ui');
}

// Input event integration
function mousePressed() {
  uiRenderer.handleDebugInput('mousePressed', mouseX, mouseY);
}

function keyPressed() {
  uiRenderer.handleDebugInput('keyPressed', key, keyCode);
}
```

### Selective Debug Integration

```javascript
// Enable debug only for specific UI elements
function setupSelectiveDebug() {
  // Only debug-enable certain elements
  uiRenderer.debugManager.registerElement('minimap', minimapElement);
  uiRenderer.debugManager.registerElement('toolbar', toolbarElement);
  
  // Regular elements render normally
  // Debug elements can be repositioned
}
```

### Runtime Debug Toggle

```javascript
// Toggle debug mode during runtime
function toggleUIDebugMode() {
  if (uiRenderer.debugEnabled) {
    uiRenderer.disableDebugMode();
    console.log('UI Debug: OFF');
  } else {
    uiRenderer.enableDebugMode();
    console.log('UI Debug: ON - Drag UI elements to reposition');
  }
}

// Bind to development key
function keyPressed() {
  if (key === 'F12') {
    toggleUIDebugMode();
  }
}
```

## Integration Benefits

### Development Efficiency
- **Live Positioning**: Adjust UI layout without code changes
- **Visual Feedback**: See bounding boxes and handles
- **Persistent Changes**: Positions saved across sessions
- **Non-Intrusive**: Existing code requires minimal modification

### Designer Collaboration
- **No Code Required**: Designers can adjust layouts directly
- **Immediate Preview**: See changes instantly in running game
- **Easy Iteration**: Quick position adjustments and testing
- **Version Control**: Position data can be committed to repository

### Quality Assurance
- **Layout Testing**: Test UI at different screen positions
- **Overlap Detection**: Visual identification of UI collisions
- **Accessibility Testing**: Ensure UI remains accessible when repositioned
- **Responsive Design**: Test UI behavior at various positions

## TODO Enhancements

### Advanced Integration
- **Batch Registration**: Register multiple elements with single call
- **Dynamic Elements**: Support for UI elements created at runtime
- **Constraint System**: Limit repositioning within bounds or relative to other elements
- **Undo/Redo**: Position change history and reversal

### Enhanced Features
- **Alignment Guides**: Visual guides for element alignment
- **Grid Snapping**: Snap to grid or other elements during positioning
- **Resize Support**: Interactive resizing in addition to repositioning
- **Z-Order Management**: Drag to change layer order of UI elements

---

## See Also

- **[UIDebugManager API Documentation](UIDebugManager.md)** - Core debug manager functionality
- **[UILayerRenderer API Documentation](UILayerRenderer.md)** - UI rendering system
- **[UI Development Guide](../guides/ui-development.md)** - UI system architecture and patterns