# 🔍 Scaling and Word Wrapping Features for DraggablePanel and Button Systems

## Overview

I've added comprehensive scaling and word wrapping capabilities to both the DraggablePanel and Button systems. These features enable:

- **Panel Scaling**: Resize entire panels and all their contents proportionally
- **Text Word Wrapping**: Automatically wrap long text to fit within button and panel boundaries
- **Persistent Scaling**: Scale settings are saved and restored between sessions
- **Global and Individual Control**: Scale all panels together or individually

## ✨ New Features Added

### DraggablePanelManager Enhancements

#### Global Scaling Controls
```javascript
const panelManager = new DraggablePanelManager();

// Scale all panels
panelManager.setGlobalScale(1.5); // 150% size
panelManager.scaleUp();           // Increase by 10%
panelManager.scaleDown();         // Decrease by 10%
panelManager.resetScale();        // Reset to 100%

// Get current scale
const currentScale = panelManager.getGlobalScale();
```

#### New Debug Panel Buttons
- **Scale Up (+)**: Increase panel size by 10%
- **Scale Down (-)**: Decrease panel size by 10%
- **Reset Scale**: Return to normal (100%) size

### DraggablePanel Enhancements

#### Individual Panel Scaling
```javascript
const panel = new DraggablePanel({
  id: 'my-panel',
  title: 'My Panel',
  scale: 1.2, // Initial scale (120%)
  // ... other config
});

// Control individual panel scaling
panel.setScale(0.8);   // 80% size
panel.scaleUp();       // Increase by 10%
panel.scaleDown();     // Decrease by 10%
panel.resetScale();    // Reset to 100%
```

#### Title Text Wrapping
- Long panel titles automatically wrap to multiple lines
- Wrapping respects panel width and scale factor
- Uses p5.js `textWrap(WORD)` when available

#### Scale-Aware Rendering
- All elements (buttons, text, borders) scale proportionally
- Button positions recalculate automatically
- Maintains visual consistency at any scale

### Button Class Enhancements

#### Text Wrapping
```javascript
const button = new Button(x, y, width, height, 
  "This is a very long caption that will wrap automatically", 
  options
);

// Text automatically wraps to fit button width
// Respects button scaling and font size
```

#### Enhanced Text Methods
```javascript
button.setText("New text");           // Alternative to setCaption
button.setCaption("Updated caption"); // Existing method
```

## 🎮 Usage Examples

### Basic Scaling Setup
```javascript
// In your main sketch
let panelManager;

function setup() {
  createCanvas(1200, 800);
  panelManager = new DraggablePanelManager();
  panelManager.initialize();
}

function draw() {
  background(50);
  panelManager.update(mouseX, mouseY, mouseIsPressed);
  panelManager.render();
}

function keyPressed() {
  if (key === '+') panelManager.scaleUp();
  if (key === '-') panelManager.scaleDown();
  if (key === '0') panelManager.resetScale();
}
```

### Creating Scalable Panels
```javascript
const scalablePanel = new DraggablePanel({
  id: 'test-panel',
  title: 'This title will wrap if it gets too long for the panel width',
  position: { x: 100, y: 100 },
  size: { width: 200, height: 300 },
  scale: 1.0, // Initial scale
  buttons: {
    layout: 'vertical',
    spacing: 5,
    buttonWidth: 180,
    buttonHeight: 40,
    items: [
      {
        caption: 'This button caption will wrap across multiple lines if needed',
        onClick: () => console.log('Wrapped button clicked!'),
        style: ButtonStyles.SUCCESS
      }
    ]
  }
});
```

## 🔧 Technical Implementation

### Scaling System
- **Scale Range**: 0.5x to 2.0x (50% to 200%)
- **Persistence**: Scale settings saved to localStorage
- **Proportional**: All elements scale together (text, buttons, spacing, borders)
- **Performance**: Efficient transform-based scaling

### Text Wrapping Algorithm
1. **Measurement**: Uses p5.js `textWidth()` to measure text
2. **Word-Based**: Wraps on word boundaries (not characters)
3. **Adaptive**: Respects current font size and scaling
4. **Fallback**: Gracefully handles missing p5.js functions

### Coordinate System
- Scaling uses p5.js transform matrix
- Hit detection accounts for scale factor
- Button positioning recalculates on scale change

## 🚀 Getting Started

1. **Enable Debug Mode**: Set your game state to include 'debug' panels
2. **Use Debug Controls**: Click the new scaling buttons in the debug panel
3. **Keyboard Shortcuts**: Press +/- keys to scale all panels
4. **Test Long Text**: Try panels with long titles and button captions

## 📝 Configuration Options

### Panel Configuration
```javascript
{
  scale: 1.0,              // Initial scale factor
  title: "Long title...",  // Will auto-wrap
  buttons: {
    buttonWidth: 120,      // Base width (scales proportionally)
    buttonHeight: 30,      // Base height (scales proportionally)
    items: [
      {
        caption: "Long text that wraps",
        // ... other button config
      }
    ]
  }
}
```

### Style Considerations
- Text remains readable at all scale levels
- Minimum scale prevents text from becoming unreadable
- Maximum scale prevents panels from becoming too large
- Smooth scaling transitions for better UX

## 🐛 Known Limitations

1. **P5.js Dependency**: Text measurement requires p5.js functions
2. **Performance**: Very large scales may impact rendering performance
3. **Layout**: Complex layouts may need adjustment at extreme scales
4. **Font Support**: Some fonts may not measure accurately

## 🔮 Future Enhancements

- **Animated Scaling**: Smooth scale transitions
- **Auto-Scale**: Automatic scaling based on screen size
- **Smart Wrapping**: More sophisticated text layout algorithms
- **Scale Constraints**: Per-panel scale limits
- **Accessibility**: High contrast modes and font scaling options

## 📚 See Also

## Dynamic Resizing

The system now includes automatic resizing capabilities:

### Auto-Resize Features

- **Panel Height**: Automatically adjusts based on button content
- **Button Height**: Grows to accommodate wrapped text
- **Title Bar**: Adjusts height for long titles
- **Content Area**: Recalculates based on button layout

### How It Works

1. Buttons calculate their required height based on wrapped text
2. Panel calculates total content height from all buttons
3. Panel adjusts its overall size to fit content
4. Updates occur automatically when:
   - Text content changes
   - Scale changes
   - Panel width changes

### Configuration

```javascript
// Auto-resize is enabled by default for all panels
const panel = new DraggablePanel({
  // ... other config
  autoResize: true  // This is the default
});

// Manual resize trigger (if needed)
panel.autoResizeToFitContent();
```

## Examples

For practical examples of how to use these features, see:

- `scalingAndWrappingExample.js` - Basic usage examples
- `dynamicResizingExample.js` - Auto-resize demonstrations
- Panel creation with scaling and wrapping enabled
- Button configuration for optimal text display
- `Classes/systems/ui/DraggablePanel.js` - Implementation details
- `Classes/systems/Button.js` - Button text wrapping implementation
- P5.js Typography documentation for `textWrap()` and `textWidth()`