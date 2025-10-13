# UIDebugManager API Documentation

> **Module**: `Classes/rendering/UIDebugManager.js`  
> **Version**: 1.0.0  
> **Author**: Software Engineering Team Delta - David Willman  
> **Last Updated**: October 2025

## Overview

The `UIDebugManager` class provides interactive debugging for UI elements with click-drag repositioning, bounding box visualization, and position persistence across sessions.

## Class: UIDebugManager

### Constructor

Creates debug manager with drag state tracking and event listeners.

**Configuration:**
```javascript
constructor() {
  this.isActive = false;
  this.registeredElements = {}; // elementId -> UIDebugElement
  
  this.config = {
    boundingBoxColor: [255, 0, 0], // Red outline
    boundingBoxStroke: 2,
    dragHandleColor: [255, 255, 0, 150], // Yellow handle
    handleSize: 8,
    snapToGrid: false,
    gridSize: 10,
    showLabels: true,
    labelColor: [255, 255, 255],
    labelSize: 10
  };
  
  this.dragState = {
    isDragging: false,
    elementId: null,
    startX: 0,
    startY: 0,
    elementStartX: 0,
    elementStartY: 0
  };
}
```

## Element Registration

### `registerElement(elementId, element)`

**Parameters:**
- `elementId` (string): Unique identifier for the element
- `element` (Object): UI element with position properties

Registers a UI element for debug manipulation.

**Element Structure:**
```javascript
const element = {
  x: 100,
  y: 50,
  width: 200,
  height: 30,
  render: function() { /* rendering logic */ }
};

uiDebugManager.registerElement('healthBar', element);
```

### `unregisterElement(elementId)`

Removes element from debug system.

## Debug Interaction

### `activate()` / `deactivate()`

Enables/disables debug mode with visual indicators.

**Implementation:**
```javascript
activate() {
  this.isActive = true;
  console.log('UIDebugManager: Debug mode activated');
  
  // Load saved positions
  this.loadPositions();
  
  // Show visual feedback
  this.showDebugOverlay();
}
```

### `handleMousePressed(x, y)`

**Parameters:**
- `x`, `y` (number): Mouse coordinates

Starts drag operation if mouse is over debug handle.

### `handleMouseDragged(x, y)`

Updates element position during drag operation with optional grid snapping.

**Implementation:**
```javascript
handleMouseDragged(x, y) {
  if (!this.dragState.isDragging) return false;
  
  const element = this.registeredElements[this.dragState.elementId];
  if (!element) return false;
  
  // Calculate new position
  let newX = this.dragState.elementStartX + (x - this.dragState.startX);
  let newY = this.dragState.elementStartY + (y - this.dragState.startY);
  
  // Apply grid snapping
  if (this.config.snapToGrid) {
    newX = Math.round(newX / this.config.gridSize) * this.config.gridSize;
    newY = Math.round(newY / this.config.gridSize) * this.config.gridSize;
  }
  
  // Apply screen boundaries
  newX = constrain(newX, 0, width - element.width);
  newY = constrain(newY, 0, height - element.height);
  
  element.x = newX;
  element.y = newY;
  
  return true;
}
```

### `handleMouseReleased()`

Ends drag operation and saves new position.

## Visual Debug Features

### `renderDebugOverlays()`

Renders debug visualizations for all registered elements.

**Debug Elements:**
```javascript
renderDebugOverlays() {
  if (!this.isActive) return;
  
  Object.entries(this.registeredElements).forEach(([id, element]) => {
    // Bounding box
    stroke(this.config.boundingBoxColor);
    strokeWeight(this.config.boundingBoxStroke);
    noFill();
    rect(element.x, element.y, element.width, element.height);
    
    // Drag handle
    fill(this.config.dragHandleColor);
    noStroke();
    const handleX = element.x + element.width - this.config.handleSize;
    const handleY = element.y;
    rect(handleX, handleY, this.config.handleSize, this.config.handleSize);
    
    // Label
    if (this.config.showLabels) {
      fill(this.config.labelColor);
      textSize(this.config.labelSize);
      text(id, element.x, element.y - 5);
    }
  });
}
```

## Position Persistence

### `savePositions()` / `loadPositions()`

Persists element positions to localStorage for session persistence.

**Storage Format:**
```javascript
{
  "ui_debug_position_healthBar": { x: 120, y: 80 },
  "ui_debug_position_minimap": { x: 50, y: 200 }
}
```

### `resetPositions()`

Resets all elements to their original positions.

## Configuration

### `configure(options)`

**Parameters:**  
- `options` (Object): Configuration options to update

Updates debug manager configuration.

**Example:**
```javascript
uiDebugManager.configure({
  boundingBoxColor: [0, 255, 0],
  snapToGrid: true,
  gridSize: 20,
  showLabels: false
});
```

## Integration Examples

### Basic UI Element Debug
```javascript
// Register UI elements
uiDebugManager.registerElement('healthBar', {
  x: 10, y: 10, width: 200, height: 20,
  render() { /* health bar rendering */ }
});

// Main loop integration
function draw() {
  // Render UI elements
  healthBar.render();
  
  // Render debug overlays
  uiDebugManager.renderDebugOverlays();
}

// Event handling
function mousePressed() {
  uiDebugManager.handleMousePressed(mouseX, mouseY);
}

function mouseDragged() {
  uiDebugManager.handleMouseDragged(mouseX, mouseY);
}

function mouseReleased() {
  uiDebugManager.handleMouseReleased();
}
```

### Debug Mode Toggle
```javascript
function keyPressed() {
  if (key === 'D' && keyIsPressed(CONTROL)) {
    if (uiDebugManager.isActive) {
      uiDebugManager.deactivate();
    } else {
      uiDebugManager.activate();
    }
  }
}
```

## TODO Enhancements

### Advanced Features
- **Multi-select**: Drag multiple elements simultaneously
- **Alignment Guides**: Snap to other elements and screen edges  
- **Resize Handles**: Interactive resizing of UI elements
- **Layer Management**: Z-order manipulation of elements

### Enhanced Visualization
- **Grid Overlay**: Visual grid for alignment assistance
- **Measurement Tools**: Distance and size measurement overlays
- **Preview Mode**: Show element positions without debug controls
- **Animation Recording**: Record and playback position changes

---

## See Also

- **[UIDebugIntegration API Documentation](UIDebugIntegration.md)** - Integration examples
- **[UILayerRenderer API Documentation](UILayerRenderer.md)** - UI rendering integration