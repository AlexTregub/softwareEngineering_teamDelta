# AntCountDisplayComponent Integration Guide

## Overview

`AntCountDisplayComponent` is a UI component that displays real-time ant population statistics in an expandable panel. It shows:
- Total ant count vs. maximum capacity
- Breakdown by job type (Worker, Builder, Farmer, Scout, Soldier, Spitter, Queen)
- Visual sprites for each ant type
- Smooth expand/collapse animation

## Quick Setup

### 1. Load the Component

Make sure `AntCountDisplayComponent.js` is loaded in your `index.html`:

```html
<!-- In your script loading section -->
<script src="Classes/ui/AntCountDisplayComponent.js"></script>
```

### 2. Create the Component

In your `sketch.js` or setup function:

```javascript
// Global variable
let g_antCountDisplay;

function setup() {
  // ... other setup code ...
  
  // Create the display component (top-left corner)
  g_antCountDisplay = new AntCountDisplayComponent(20, 20, {
    sprites: {} // Sprites will auto-load from JobImages global
  });
  
  // Register with RenderManager
  if (typeof RenderManager !== 'undefined') {
    // Register update function
    RenderManager.addDrawableToLayer(RenderManager.layers.UI_GAME, () => {
      if (g_antCountDisplay) {
        g_antCountDisplay.update(); // Update counts
      }
    });
    
    // Register render function
    RenderManager.addDrawableToLayer(RenderManager.layers.UI_GAME, () => {
      if (g_antCountDisplay && GameState.getState() === 'PLAYING') {
        g_antCountDisplay.render('PLAYING');
      }
    });
    
    // Register interactive handler for click events
    RenderManager.addInteractiveDrawable(RenderManager.layers.UI_GAME, {
      hitTest: (pointer) => {
        if (!g_antCountDisplay) return false;
        return g_antCountDisplay.isMouseOver(pointer.x, pointer.y);
      },
      onPointerDown: (pointer) => {
        if (g_antCountDisplay) {
          return g_antCountDisplay.handleClick(pointer.x, pointer.y);
        }
        return false;
      }
    });
  }
}
```

### 3. Alternative: Simple Direct Rendering

If you prefer simpler integration without RenderManager:

```javascript
// In your draw() function
function draw() {
  // ... other drawing code ...
  
  if (GameState.getState() === 'PLAYING' && g_antCountDisplay) {
    g_antCountDisplay.update(); // Update counts from global ants array
    g_antCountDisplay.render('PLAYING'); // Draw the panel
  }
}

// In mousePressed() function
function mousePressed() {
  // ... other mouse handling ...
  
  if (GameState.getState() === 'PLAYING' && g_antCountDisplay) {
    const handled = g_antCountDisplay.handleClick(mouseX, mouseY);
    if (handled) return; // Panel consumed the click
  }
}
```

## Features

### Automatic Updates

The component automatically queries the global `ants` array each frame:
- Filters for player faction ants only
- Counts by job type
- Handles job name aliases (Warrior → Soldier, Gatherer → Worker)

### Sprite Auto-Loading

Sprites are automatically loaded from the global `JobImages` object:
- `JobImages.Scout` → Worker/Scout icons
- `JobImages.Builder` → Builder icon
- `JobImages.Farmer` → Farmer icon
- `JobImages.Warrior` → Soldier icon
- `JobImages.Spitter` → Spitter icon
- `JobImages.Queen` → Queen icon

### Interactive Features

- **Click to expand/collapse** - Shows detailed breakdown
- **Hover effect** - Panel brightens on hover
- **Smooth animation** - Height animates smoothly

## Customization

### Change Position

```javascript
g_antCountDisplay.setPosition(100, 50); // Move to new coordinates
```

### Update Max Ants

```javascript
g_antCountDisplay.maxAnts = 100; // Change capacity limit
```

### Manual Count Updates (Optional)

If you want to manually set counts instead of auto-querying:

```javascript
// Update total
g_antCountDisplay.updateTotal(45, 100); // 45 current, 100 max

// Update specific type
g_antCountDisplay.updateTypeCount('Scout', 10);
g_antCountDisplay.updateTypeCount('Warrior', 5);
```

### Custom Styling

Modify properties after creation:

```javascript
g_antCountDisplay.panelWidth = 200; // Wider panel
g_antCountDisplay.backgroundColor = [60, 60, 60]; // Different color
g_antCountDisplay.backgroundAlpha = 180; // More transparent
g_antCountDisplay.lineSpacing = 30; // More vertical space
```

## How It Works

### Data Source

The component queries the global `ants` array directly:

```javascript
// Filters for player faction
const playerAnts = ants.filter(ant => {
  if (ant._faction === 'player') return true;
  if (ant.faction === 'player') return true;
  // ... other checks
});

// Counts by job type
playerAnts.forEach(ant => {
  const jobName = ant.JobName || ant.jobName || 'Scout';
  // Increment appropriate counter
});
```

### Faction Filtering

Only counts ants with:
- `ant._faction === 'player'`
- `ant.faction === 'player'`
- `ant.getFaction() === 'player'`
- No faction specified (defaults to player for backward compatibility)

### Job Name Detection

Tries multiple properties to find job name:
1. `ant.JobName`
2. `ant.jobName`
3. `ant._JobName`
4. `ant.job.name`
5. Defaults to 'Scout' if none found

## API Reference

### Constructor

```javascript
new AntCountDisplayComponent(x, y, options)
```

**Parameters:**
- `x` - X position (screen coordinates)
- `y` - Y position (screen coordinates)
- `options.sprites` - Optional sprite object (auto-loads from JobImages if omitted)

### Methods

#### update()
Updates ant counts and animation state. Call every frame.

#### render(gameState)
Renders the panel. Typically called after update().

#### handleClick(mouseX, mouseY)
Handles mouse clicks. Returns `true` if click was on panel.

#### isMouseOver(mouseX, mouseY)
Checks if mouse is over panel. Returns boolean.

#### setPosition(x, y)
Moves the panel to new coordinates.

#### setExpanded(expanded)
Manually expand/collapse the panel.

#### toggleExpanded()
Toggle expanded state.

#### updateTotal(current, max)
Manually set total counts (optional, overrides auto-querying).

#### updateTypeCount(type, count)
Manually set count for specific ant type (optional).

#### destroy()
Cleanup method for removing the component.

## Troubleshooting

### Panel not showing
- Check that `GameState.getState() === 'PLAYING'`
- Verify `g_antCountDisplay` is initialized
- Ensure component is loaded before setup()

### Sprites not showing
- Check that `JobImages` is loaded in `antsPreloader()`
- Verify sprites have `width > 0` (loaded successfully)
- Fallback colored circles show during loading

### Counts always zero
- Verify global `ants` array exists
- Check that ants have `_faction` or `faction` property set to 'player'
- Ensure `JobName` or `jobName` property exists on ants

### Click not working
- Make sure interactive handler is registered with RenderManager
- Check that mouse coordinates are in screen space (not world space)
- Verify panel is not covered by other UI elements

## Example: Complete Integration

```javascript
// sketch.js

let g_antCountDisplay;

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // ... other setup ...
  
  // Initialize ant count display
  g_antCountDisplay = new AntCountDisplayComponent(20, 20);
  
  // Register with RenderManager
  RenderManager.addDrawableToLayer(RenderManager.layers.UI_GAME, () => {
    if (g_antCountDisplay) g_antCountDisplay.update();
  });
  
  RenderManager.addDrawableToLayer(RenderManager.layers.UI_GAME, () => {
    if (g_antCountDisplay) g_antCountDisplay.render(GameState.getState());
  });
  
  RenderManager.addInteractiveDrawable(RenderManager.layers.UI_GAME, {
    hitTest: (pointer) => g_antCountDisplay?.isMouseOver(pointer.x, pointer.y),
    onPointerDown: (pointer) => g_antCountDisplay?.handleClick(pointer.x, pointer.y)
  });
}

function draw() {
  // RenderManager handles everything
  RenderManager.render(GameState.getState());
}
```

## Notes

- **Performance**: Component is very lightweight - direct array filtering is fast
- **No dependencies**: Works standalone, no EventManager or EntityManager required
- **Backward compatible**: Works with both old Entity-based ants and new MVC ants
- **Automatic**: No manual updates needed - queries ants array every frame

## Future Enhancements

Potential improvements for future versions:
- Add ant type icons/colors customization
- Support for enemy faction counts
- History graph (population over time)
- Click-to-filter (show only specific ant type)
- Drag to reposition
