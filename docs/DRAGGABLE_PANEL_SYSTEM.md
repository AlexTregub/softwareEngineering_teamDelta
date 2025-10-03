# Draggable Panel System Documentation

## Overview
The Draggable Panel System extends the Universal Button System's excellent drag functionality to create moveable UI panels for displaying information like resource counts, performance metrics, and other game data.

## ✨ **Key Features**

### 🎯 **Reused Architecture**
- **Drag Logic**: Directly adapted from `ButtonGroup.js` drag handling
- **Position Calculation**: Reuses constraint and snapping algorithms  
- **State Persistence**: Leverages localStorage pattern from button system
- **Unified Management**: Similar manager pattern as `ButtonGroupManager`

### 🪟 **Panel Capabilities**
- **Drag & Drop**: Click title bar to drag panels anywhere on screen
- **Position Persistence**: Panel positions automatically saved to localStorage
- **Screen Constraints**: Panels cannot be dragged off-screen
- **Edge Snapping**: Panels snap to screen edges when dragged nearby
- **Minimize/Maximize**: Collapsible panels to save screen space
- **Custom Styling**: Fully customizable appearance and behavior

### ⌨️ **Keyboard Shortcuts**
- `Ctrl+Shift+1`: Toggle Performance Monitor panel
- `Ctrl+Shift+2`: Toggle Resource Display panel  
- `Ctrl+Shift+R`: Reset all panels to default positions

## 🏗️ **Architecture**

### Core Components

#### 1. **DraggablePanel.js**
- Individual draggable panel implementation
- Handles rendering, drag behavior, and state persistence
- Reuses drag logic from `ButtonGroup.js`

#### 2. **DraggablePanelManager.js** 
- Centralized management of multiple panels
- Coordinates mouse events and rendering
- Similar to `ButtonGroupManager.js` pattern

#### 3. **DraggablePanelSystem.js**
- System initialization and integration
- Content renderers for specific panel types
- Keyboard shortcut management

## 🚀 **Implementation**

### Basic Usage

```javascript
// Initialize the system (done automatically in main game)
await initializeDraggablePanelSystem();

// Create a custom panel
const panel = window.draggablePanelManager.addPanel({
  id: 'my-panel',
  title: 'My Custom Panel',
  position: { x: 100, y: 100 },
  size: { width: 200, height: 150 },
  style: {
    backgroundColor: [0, 0, 0, 150],
    titleColor: [255, 255, 255],
    textColor: [200, 200, 200]
  },
  behavior: {
    draggable: true,
    persistent: true,
    constrainToScreen: true,
    snapToEdges: true
  }
});

// Update panels in draw loop
function draw() {
  updateDraggablePanels();
  renderDraggablePanels();
}
```

### Content Renderers

Panels use content renderer functions to display dynamic content:

```javascript
function renderMyPanelContent(contentArea, style) {
  // contentArea provides: x, y, width, height
  // style provides: textColor, fontSize, etc.
  
  if (typeof text === 'function') {
    let yOffset = 0;
    const lineHeight = 16;
    
    text('Custom Data:', contentArea.x, contentArea.y + yOffset);
    yOffset += lineHeight;
    
    text(`Value: ${myData.value}`, contentArea.x, contentArea.y + yOffset);
  }
}

// Register the content renderer
window.draggablePanelContentRenderers['my-panel'] = renderMyPanelContent;
```

## 🔧 **Configuration Options**

### Panel Configuration

```javascript
{
  id: 'unique-panel-id',           // Required: Unique identifier
  title: 'Panel Title',            // Panel title bar text
  position: { x: 50, y: 50 },      // Initial position
  size: { width: 200, height: 150 }, // Panel dimensions
  
  style: {
    backgroundColor: [0, 0, 0, 150],    // Background color [r,g,b,a]
    titleColor: [255, 255, 255],        // Title text color
    textColor: [200, 200, 200],         // Content text color
    borderColor: [100, 100, 100],       // Border color
    titleBarHeight: 25,                 // Height of title bar
    padding: 10,                        // Internal padding
    cornerRadius: 5,                    // Border radius
    fontSize: 12,                       // Content font size
    titleFontSize: 14                   // Title font size
  },
  
  behavior: {
    draggable: true,                    // Enable dragging
    persistent: true,                   // Save position to localStorage
    constrainToScreen: true,            // Prevent dragging off-screen
    snapToEdges: true                   // Snap to screen edges
  },
  
  visible: true,                        // Initial visibility
  minimized: false                      // Initial minimized state
}
```

## 🎨 **Integration with Existing UI**

### Replacing Static UI Elements

The system automatically replaces static UI elements when available:

```javascript
// In UILayerRenderer.js
renderCurrencyDisplay() {
  // Check if draggable panel system is active
  if (window.draggablePanelManager?.getPanel('resource-display')) {
    // Use draggable panel system
    return;
  }
  
  // Fallback to static display
  this.renderFallbackCurrencyDisplay();
}
```

### Built-in Panel Types

1. **Resource Display Panel** (`resource-display`)
   - Shows Wood, Food, Population counts
   - Replaces static currency display
   - Default position: top-left

2. **Performance Monitor Panel** (`performance-monitor`) 
   - Shows FPS, frame time, entity counts
   - Replaces static performance overlay
   - Default position: below resource display
   - Initially hidden (toggle with Ctrl+Shift+1)

## 🧪 **Testing & Demos**

### Demo Page
Visit `/test/demo/draggable_panels_demo.html` to see the system in action:
- Interactive draggable panels
- Real-time content updates
- Keyboard shortcut demonstrations
- Visual feedback for operations

### Integration Testing
The system works alongside the Universal Button System:
- No conflicts with button drag operations
- Unified mouse event handling
- Coordinated rendering pipeline

## 🔄 **Code Reuse Analysis**

### From Universal Button System

#### Drag Handling Logic
```javascript
// ButtonGroup.js (source)
handleDragging(mouseX, mouseY, mousePressed) {
  // Start dragging detection
  if (mousePressed && !this.isDragging && this.isPointInBounds(mouseX, mouseY)) {
    this.isDragging = true;
    this.dragOffset = { x: mouseX - x, y: mouseY - y };
  }
  // ... rest of drag logic
}

// DraggablePanel.js (adapted)  
handleDragging(mouseX, mouseY, mousePressed) {
  const titleBarBounds = this.getTitleBarBounds();
  // Same drag logic, adapted for title bar interaction
}
```

#### Position Constraints
```javascript
// Both systems use identical constraint logic:
applyDragConstraints(x, y) {
  // Screen boundary constraints
  // Edge snapping logic  
  // Same algorithms, same parameters
}
```

#### State Persistence
```javascript
// Both systems use same localStorage pattern:
saveState() {
  const dataToSave = { position, visible, lastModified };
  localStorage.setItem(storageKey, JSON.stringify(dataToSave));
}
```

### Unique Adaptations

#### Title Bar Interaction
- Drag detection limited to title bar area
- Visual title bar with minimize/maximize controls
- Content area separate from drag handle

#### Content Rendering System
- Flexible content renderer functions
- Automatic content area calculation
- Style-aware rendering context

## 🎯 **Performance Considerations**

### Minimal Overhead
- Reuses proven drag algorithms (no new performance cost)
- Content renderers only called when panels visible
- State persistence batched to minimize localStorage calls

### Memory Efficiency  
- Panels created on-demand
- Content rendered per-frame (no caching overhead)
- Automatic cleanup on panel removal

## 🛠️ **Troubleshooting**

### Common Issues

1. **Panels not appearing**
   - Check console for initialization errors
   - Verify script loading order in index.html
   - Ensure content renderers are registered

2. **Drag not working**
   - Panels drag from title bar only
   - Check if `constrainToScreen` is preventing movement
   - Verify mouse coordinates are being passed correctly

3. **Position not persisting**
   - Check localStorage permissions
   - Verify `persistent: true` in panel config
   - Check console for save/load errors

### Debug Commands

```javascript
// Get panel system status
console.log(window.draggablePanelManager.getDiagnosticInfo());

// Reset all panels
window.draggablePanelManager.resetAllPanels();

// Toggle specific panel
window.draggablePanelManager.togglePanel('resource-display');
```

## 🔮 **Future Enhancements**

### Planned Features
- **Panel Docking**: Snap panels together into groups
- **Resize Handles**: Allow panel resizing by dragging corners
- **Panel Templates**: Predefined panel configurations
- **Animation System**: Smooth transitions and effects

### Extensibility
- Custom panel types through configuration
- Plugin system for specialized panels  
- Theme system for consistent styling
- Layout presets and workspace management

---

**Last Updated**: October 3, 2025  
**Version**: 1.0.0  
**Status**: Production Ready  
**Demo**: `/test/demo/draggable_panels_demo.html`