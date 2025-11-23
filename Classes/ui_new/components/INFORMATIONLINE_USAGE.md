# InformationLine Usage Guide

## Overview

`InformationLine` is a UI component designed to display a single line of information (sprite + caption) within a DropdownMenu. It automatically subscribes to the EventBus for updates.

## Basic Usage

### Creating an InformationLine

```javascript
const { InformationLine, InformationLineSignals } = require('./informationLine');

// Simple creation
const infoLine = new InformationLine({
    caption: "Health: 100"
});

// With all options
const detailedLine = new InformationLine({
    sprite: mySprite,           // p5.Image
    caption: "Gold: 500",
    color: '#FFD700',
    textSize: 16,
    textFont: 'Arial',
    textAlignment: 'left',      // 'left', 'center', 'right'
    opacity: 1,                 // 0-1
    padding: 5,                 // Padding between sprite and caption
    paddingAbove: 10,
    paddingBelow: 10,
    paddingLeft: 15,
    paddingRight: 15
});
```

## Using with DropdownMenu

```javascript
class DropdownMenu {
    constructor() {
        this.informationLines = new Map();
    }
    
    addInformationLine(options) {
        const line = new InformationLine(options);
        this.informationLines.set(line.id, line);
        return line;
    }
    
    removeInformationLine(lineId) {
        const line = this.informationLines.get(lineId);
        if (line) {
            line.destroy(); // Cleanup EventBus subscription
            this.informationLines.delete(lineId);
        }
    }
    
    render() {
        this.informationLines.forEach(line => line.render());
    }
}

// Usage
const menu = new DropdownMenu();
const healthLine = menu.addInformationLine({ caption: "Health: 100" });
const goldLine = menu.addInformationLine({ caption: "Gold: 500" });
```

## Updating via EventBus

```javascript
// Update all information lines
eventBus.emit(InformationLineSignals.UPDATE_INFORMATION_LINES, {
    caption: "Health: 75",
    opacity: 0.8
});

// Update specific properties
eventBus.emit(InformationLineSignals.UPDATE_INFORMATION_LINES, {
    color: '#FF0000',
    textSize: 18
});
```

## Properties

### Core Properties
- `sprite` - p5.Image for the icon (default: null)
- `caption` - Text content (default: "")
- `id` - Unique identifier (auto-generated)
- `opacity` - Transparency 0-1 (default: 1)
- `isHighlighted` - Highlight state (default: false)

### Styling Properties
- `color` - Text color (default: null)
- `textSize` - Font size (default: null)
- `textFont` - Font family (default: null)
- `textAlignment` - 'left', 'center', 'right' (default: 'left')

### Spacing Properties
- `padding` - Space between sprite and caption (default: 5)
- `paddingAbove/Below/Left/Right` - Individual padding values

### Layout
- `layout` - Array: `[sprite, " : ", caption]`

## Methods

### Setters
All properties have setters:
- `setSprite(sprite)` - Also updates layout[0]
- `setCaption(caption)` - Also updates layout[2]
- `setColor(color)`
- `setTextSize(size)`
- `setTextFont(font)`
- `setTextAlignment(alignment)`
- `setOpacity(opacity)`
- `setPadding(padding)`
- `setPaddingAbove/Below/Left/Right(value)`
- `setHighlighted(bool)`

### Core Methods
- `render()` - Render the line (implement p5.js drawing logic)
- `update(data)` - Update properties from data object
- `destroy()` - Cleanup EventBus subscriptions (IMPORTANT!)

## Example: Dynamic Updates

```javascript
// Create lines
const healthLine = new InformationLine({ caption: "Health: 100" });
const manaLine = new InformationLine({ caption: "Mana: 50" });

// Game loop updates health
function takeDamage(amount) {
    currentHealth -= amount;
    healthLine.setCaption(`Health: ${currentHealth}`);
    
    // Or via EventBus (updates all lines with matching signal)
    eventBus.emit(InformationLineSignals.UPDATE_INFORMATION_LINES, {
        caption: `Health: ${currentHealth}`,
        color: currentHealth < 30 ? '#FF0000' : '#00FF00'
    });
}

// Cleanup when done
healthLine.destroy();
manaLine.destroy();
```

## Important Notes

1. **Always call `destroy()`** when removing lines to prevent memory leaks
2. **Layout array** maintains `[sprite, " : ", caption]` structure
3. **EventBus updates** affect ALL InformationLine instances listening
4. **Unique IDs** are auto-generated using timestamp + random number
5. **Default values**: opacity=1, padding=5, textAlignment='left'

## Integration with Tests

The class is designed to pass all tests in `dropDownMenu.test.js`:
- ✅ Property initialization
- ✅ Custom options
- ✅ Unique IDs
- ✅ Layout structure
- ✅ EventBus subscription
- ✅ Update handling
- ✅ Setter methods
