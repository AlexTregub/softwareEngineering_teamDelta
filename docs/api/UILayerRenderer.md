# UILayerRenderer API Documentation

> **Module**: `Classes/rendering/UILayerRenderer.js`  
> **Version**: 1.0.0  
> **Last Updated**: October 2025

## Overview

The `UILayerRenderer` class handles comprehensive UI layer rendering including HUD elements, debug overlays, tooltips, selection boxes, and context menus.

## Class: UILayerRenderer

### Constructor

```javascript
constructor() {
  this.config = {
    enableHUD: true,
    enableDebugUI: true,
    enableTooltips: true,
    enableSelectionBox: true,
    hudOpacity: 0.9,
    debugUIOpacity: 0.8
  };

  this.hudElements = {
    currency: { wood: 0, food: 0, population: 0, pain: 100 },
    toolbar: { activeButton: null, buttons: [] },
    minimap: { enabled: false, size: 120 }
  };

  this.interactionUI = {
    selectionBox: { active: false, start: null, end: null },
    contextMenu: { active: false, items: [], position: null },
    tooltip: { active: false, text: '', position: null }
  };
}
```

## HUD System

### `renderHUD(gameState)`

**Parameters:**
- `gameState` (Object): Current game state

Renders heads-up display elements including resource counters, toolbar, and minimap.

**HUD Elements:**
```javascript
renderHUD(gameState) {
  if (!this.config.enableHUD) return;
  
  // Resource counters
  this.renderResourceCounters(gameState.resources);
  
  // Toolbar
  this.renderToolbar(gameState.ui.toolbar);
  
  // Minimap
  if (this.hudElements.minimap.enabled) {
    this.renderMinimap(gameState);
  }
}
```

### `renderResourceCounters(resources)`

Displays wood, food, population, and other resource counters.

### `renderMinimap(gameState)`

Renders scaled world overview with entity indicators.

## Interaction UI

### `startSelectionBox(x, y)`

**Parameters:**
- `x`, `y` (number): Starting coordinates

Begins selection box drawing for multi-entity selection.

### `updateSelectionBox(x, y)`

Updates selection box end position during drag.

### `endSelectionBox()`

Completes selection and returns selected entities.

**Implementation:**
```javascript
endSelectionBox() {
  if (!this.interactionUI.selectionBox.active) return [];
  
  const box = this.interactionUI.selectionBox;
  const selectedEntities = [];
  
  // Check all entities against selection box
  entities.forEach(entity => {
    const pos = EntityAccessor.getPosition(entity);
    const size = EntityAccessor.getSize(entity);
    
    if (this.isInSelectionBox(pos, size, box)) {
      selectedEntities.push(entity);
    }
  });
  
  this.interactionUI.selectionBox.active = false;
  return selectedEntities;
}
```

### Context Menu System

#### `showContextMenu(items, x, y)`

**Parameters:**
- `items` (Array): Menu item strings
- `x`, `y` (number): Menu position

Displays context menu at specified position.

#### `handleContextMenuClick(itemIndex)`

Processes context menu item selection.

## Tooltip System

### `showTooltip(text, x, y)`

**Parameters:**
- `text` (string): Tooltip content
- `x`, `y` (number): Tooltip position

Displays tooltip with automatic positioning to stay on screen.

### `hideTooltip()`

Hides the current tooltip.

## Debug UI Integration

### `renderDebugOverlays()`

Renders development debug information including performance stats, entity info, and debug controls.

**Debug Elements:**
- Performance monitor integration
- Entity inspector overlays  
- Debug console interface
- Frame timing displays

## Configuration

### `configure(options)`

**Parameters:**
- `options` (Object): Configuration options

Updates renderer configuration.

**Example:**
```javascript
uiRenderer.configure({
  enableTooltips: false,
  hudOpacity: 0.7,
  debugUIOpacity: 1.0
});
```

## Usage Examples

### Basic UI Rendering
```javascript
const uiRenderer = new UILayerRenderer();

function draw() {
  // Render HUD
  uiRenderer.renderHUD(gameState);
  
  // Handle interactions
  uiRenderer.renderSelectionBox();
  uiRenderer.renderTooltips();
}
```

### Selection System Integration
```javascript
function mousePressed() {
  if (mouseButton === LEFT) {
    uiRenderer.startSelectionBox(mouseX, mouseY);
  }
}

function mouseReleased() {
  if (uiRenderer.interactionUI.selectionBox.active) {
    const selected = uiRenderer.endSelectionBox();
    gameState.selectedEntities = selected;
  }
}
```

---

## See Also

- **[UIDebugManager API Documentation](UIDebugManager.md)** - UI debug integration
- **[RenderLayerManager API Documentation](RenderLayerManager.md)** - Layer system integration