# Dropdown UI Component Documentation

## Overview

The Dropdown UI Component is a self-contained, feature-rich dropdown menu system designed for seamless integration with both standalone applications and the existing draggable panel system. It provides a modern, customizable dropdown experience with support for searching, scrolling, animations, and extensive styling options.

## Features

- ✅ **Self-Contained**: Works independently without external dependencies
- ✅ **Draggable Panel Integration**: Native support for draggable panels with coordinate transformation
- ✅ **Searchable Options**: Built-in filtering with real-time search
- ✅ **Scrollable Lists**: Handles large option lists with smooth scrolling
- ✅ **Custom Styling**: Comprehensive theming system with color, font, and size options
- ✅ **Smooth Animations**: Configurable open/close animations
- ✅ **Keyboard Support**: Full keyboard navigation and search input
- ✅ **Event System**: Rich callback system for selection, open/close, and change events
- ✅ **Manager System**: Global dropdown management ensuring only one open at a time
- ✅ **Responsive Design**: Adapts to different screen sizes and container constraints

## Quick Start

### Basic Standalone Usage

```javascript
// Create a simple dropdown
const dropdown = new Dropdown(100, 50, 150, 30, {
  placeholder: 'Select option...',
  options: ['Option 1', 'Option 2', 'Option 3'],
  onSelect: (value, index) => {
    console.log('Selected:', value);
  }
});

// In your update loop
dropdown.update(mouseX, mouseY, mousePressed);

// In your render loop
dropdown.render();
```

### Draggable Panel Integration

```javascript
// Create a panel with integrated dropdowns
const panel = createDropdownPanel({
  id: 'settings-panel',
  title: 'Settings',
  position: { x: 200, y: 100 },
  size: { width: 250, height: 200 }
}, [
  {
    x: 10, y: 30, width: 200, height: 25,
    options: {
      options: ['Low', 'Medium', 'High'],
      placeholder: 'Graphics Quality',
      onSelect: (value) => console.log('Graphics:', value)
    }
  }
]);
```

## API Reference

### Dropdown Class

#### Constructor

```javascript
new Dropdown(x, y, width, height, options)
```

**Parameters:**

- `x` (number): X position
- `y` (number): Y position  
- `width` (number): Dropdown width
- `height` (number): Dropdown height
- `options` (Object): Configuration object

#### Configuration Options

```javascript
{
  // Data
  options: ['Option 1', 'Option 2'],           // Available options
  selectedIndex: -1,                           // Initially selected index
  placeholder: 'Select...',                    // Placeholder text
  
  // Behavior  
  searchable: false,                           // Enable search filtering
  maxDisplayItems: 6,                          // Max visible items before scrolling
  
  // Styling
  backgroundColor: [240, 240, 240],            // Button background color
  borderColor: [180, 180, 180],                // Border color
  textColor: [0, 0, 0],                        // Text color
  hoverColor: [220, 220, 220],                 // Hover background color
  selectedColor: [100, 150, 255],              // Selected item color
  placeholderColor: [128, 128, 128],           // Placeholder text color
  dropdownBackgroundColor: [255, 255, 255],    // Dropdown list background
  dropdownBorderColor: [160, 160, 160],        // Dropdown list border
  scrollbarColor: [200, 200, 200],             // Scrollbar color
  fontSize: 12,                                // Text size
  borderWidth: 1,                              // Border thickness
  cornerRadius: 4,                             // Border radius
  maxDropdownHeight: 150,                      // Max dropdown list height
  
  // Animation
  animationDuration: 150,                      // Open/close animation time (ms)
  
  // Callbacks
  onSelect: (value, index) => {},              // Called when item selected
  onChange: (value, index) => {},              // Called when selection changes  
  onOpen: () => {},                            // Called when dropdown opens
  onClose: () => {},                           // Called when dropdown closes
  
  // Advanced
  zIndex: 1000                                 // Z-index for layering
}
```

#### Methods

##### Core Methods

```javascript
dropdown.setOptions(newOptions)              // Update options array
dropdown.addOption(option, index)            // Add single option
dropdown.removeOption(option)                // Remove option by value/index
dropdown.setSelected(option)                 // Set selected option
dropdown.getSelected()                       // Get selected {value, index}
```

##### State Management

```javascript
dropdown.open()                              // Open dropdown
dropdown.close()                             // Close dropdown
dropdown.toggle()                            // Toggle open/closed
dropdown.setEnabled(enabled)                 // Enable/disable dropdown
```

##### Positioning & Styling

```javascript
dropdown.setPosition(x, y)                   // Update position
dropdown.setSize(width, height)              // Update size
dropdown.updateStyle(styleObject)            // Update styling
dropdown.setParent(panel)                    // Set parent for coord transform
```

##### Event Handling

```javascript
dropdown.update(mouseX, mouseY, mousePressed) // Update state (call in update loop)
dropdown.render()                            // Render dropdown (call in draw loop)
dropdown.handleKeyPress(key)                 // Handle keyboard input
dropdown.handleScroll(delta)                 // Handle mouse wheel
```

##### Utility

```javascript
dropdown.containsPoint(x, y)                 // Check if point is inside
dropdown.getBounds()                         // Get bounding rectangle
dropdown.dispose()                           // Clean up resources
```

### DropdownManager Class

The DropdownManager ensures only one dropdown is open at a time and provides global dropdown coordination.

```javascript
// Get global manager instance
const manager = window.dropdownManager;

// Register dropdown with manager
manager.register(dropdown);

// Manage dropdowns
manager.closeAll();                          // Close all dropdowns
manager.closeAll(exceptDropdown);            // Close all except one
manager.getActiveDropdown();                 // Get currently open dropdown

// Update and render all registered dropdowns
manager.updateAll(mouseX, mouseY, mousePressed);
manager.renderAll();
```

## Integration with Draggable Panels

### Panel Integration Functions

```javascript
// Create panel with dropdowns
createDropdownPanel(panelConfig, dropdownConfigs)

// Add dropdown to existing panel
addDropdownToPanel(panel, dropdownConfig)

// Create content renderer for dropdown panel
createDropdownPanelRenderer(options)
```

### Example Panel Configurations

#### Settings Panel

```javascript
const settingsPanel = createSettingsPanel();
// Creates panel with graphics, sound, and difficulty dropdowns
```

#### Entity Inspector Panel  

```javascript
const inspectorPanel = createEntityInspectorPanel();
// Creates panel with searchable entity type and property dropdowns
```

#### Resource Filter Panel

```javascript
const filterPanel = createResourceFilterPanel();
// Creates panel with resource type and sort order dropdowns
```

## Styling Guide

### Color Schemes

#### Light Theme

```javascript
{
  backgroundColor: [240, 240, 240],
  borderColor: [180, 180, 180],
  textColor: [0, 0, 0],
  hoverColor: [220, 220, 220],
  selectedColor: [100, 150, 255]
}
```

#### Dark Theme

```javascript
{
  backgroundColor: [60, 60, 60],
  borderColor: [100, 100, 100],
  textColor: [255, 255, 255],
  hoverColor: [80, 80, 80],
  selectedColor: [80, 120, 200]
}
```

#### Game Theme (matches existing UI)

```javascript
{
  backgroundColor: [70, 80, 90],
  borderColor: [100, 110, 120],
  textColor: [220, 220, 220],
  hoverColor: [90, 100, 110],
  selectedColor: [60, 120, 180]
}
```

### Size Guidelines

- **Compact**: width: 120, height: 25
- **Standard**: width: 150, height: 30  
- **Large**: width: 200, height: 35
- **Panel**: width: panel.width - 20, height: 25-30

## Demo & Testing

### Running the Demo

```javascript
// Initialize and show demo
initializeDropdownDemo();
toggleDropdownDemo(); // or press 'h'

// Demo controls
// 'h' - Hide/show demo
// 'p' - Create panel demo  
// 'r' - Reset demo
// Type in searchable dropdowns to filter

// Get demo statistics
console.log(getDropdownDemoStats());
```

### Panel Demo

```javascript
// Create example panels with dropdowns
createDropdownPanelDemo();

// Individual panel creation
const settings = createSettingsPanel();
const inspector = createEntityInspectorPanel(); 
const filter = createResourceFilterPanel();
```

## Best Practices

### Performance

- Use `DropdownManager` to ensure only one dropdown is open
- Set reasonable `maxDisplayItems` for large lists (6-8 items)
- Dispose of dropdowns when no longer needed
- Use `containsPoint()` for custom hit testing

### User Experience

- Provide clear placeholder text
- Use consistent styling across dropdowns
- Enable search for lists with >10 items
- Provide visual feedback for selection changes
- Use appropriate sizing for content

### Integration

- Set parent panels for coordinate transformation
- Register dropdowns with the global manager
- Use provided integration helpers for panels
- Follow existing UI color schemes

### Accessibility

- Use sufficient color contrast
- Provide keyboard navigation
- Include descriptive placeholders
- Support screen reader friendly text

## Advanced Usage

### Dynamic Options

```javascript
const dropdown = new Dropdown(x, y, w, h, {
  options: ['Loading...'],
  onOpen: function() {
    // Load options dynamically
    fetchOptions().then(options => {
      this.setOptions(options);
    });
  }
});
```

### Chained Dropdowns

```javascript
const primaryDropdown = new Dropdown(x, y, w, h, {
  options: ['Category A', 'Category B'],
  onSelect: (value) => {
    const subOptions = getSubOptions(value);
    secondaryDropdown.setOptions(subOptions);
    secondaryDropdown.setEnabled(true);
  }
});
```

### Custom Rendering

```javascript
// Override render method for custom appearance
dropdown.drawDropdownItem = function(x, y, text, index) {
  // Custom item rendering logic
  // Add icons, custom colors, etc.
};
```

## Troubleshooting

### Common Issues

**Dropdown not appearing:**

- Check if `update()` and `render()` are called in game loops
- Verify position coordinates are within screen bounds
- Ensure dropdown is not hidden behind other elements

**Multiple dropdowns open:**

- Use `DropdownManager` to enforce single-open behavior
- Register all dropdowns with the manager

**Coordinate issues in panels:**

- Use `setParent(panel)` for coordinate transformation
- Verify panel provides `getContentArea()` method

**Search not working:**

- Enable `searchable: true` in options
- Call `handleKeyPress(key)` for keyboard input
- Check search text with dropdown console methods

### Debug Helpers

```javascript
// Get dropdown state
console.log('Dropdown state:', {
  isOpen: dropdown.isOpen,
  selectedIndex: dropdown.selectedIndex,
  optionsCount: dropdown.options.length,
  filteredCount: dropdown.filteredOptions.length
});

// Check bounds
console.log('Bounds:', dropdown.getBounds());

// Manager diagnostics  
console.log('Active dropdown:', window.dropdownManager.getActiveDropdown());
console.log('Registered count:', window.dropdownManager.dropdowns.size);
```

## File Structure

Classes/systems/ui/
├── Dropdown.js                     # Main dropdown component
├── DropdownPanelIntegration.js     # Draggable panel integration
├── DropdownDemo.js                 # Demo and testing utilities
└── docs/
    └── dropdown-component.md       # This documentation

## Dependencies

- **p5.js** (for rendering and mouse/keyboard input)
- **DraggablePanelManager** (optional, for panel integration)
- **Modern JavaScript** (ES6+ features used)

## Browser Support

- Chrome/Edge 70+
- Firefox 65+  
- Safari 12+
- Mobile browsers with touch support

---

*For questions, issues, or contributions, please refer to the main project documentation or contact the Software Engineering Team Delta.*
