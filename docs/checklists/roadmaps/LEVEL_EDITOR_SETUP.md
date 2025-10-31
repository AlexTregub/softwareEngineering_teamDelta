# Level Editor Setup Guide

## Overview
The Level Editor is a terrain editing system integrated into the main game menu, allowing users to create and modify game levels using a visual interface.

## Game State Integration

### New Game State
- **State Name**: `LEVEL_EDITOR`
- **Added to**: `GameStateManager.STATES`
- **Transition Method**: `GameState.goToLevelEditor()`
- **Check Method**: `GameState.isLevelEditor()`

### Menu Button
A new "Level Editor" button has been added to the main menu:
- **Position**: Third button in the menu (after "Moss & Stone Level")
- **Style**: `'warning'` (yellow/orange color)
- **Action**: Calls `GameState.goToLevelEditor()`

## Architecture

### Core Controller
**File**: `Classes/systems/ui/LevelEditor.js`

The `LevelEditor` class manages:
- Terrain editing via `TerrainEditor`
- Material selection via `MaterialPalette`
- Tool selection via `ToolBar`
- UI panels and overlays
- Save/Load functionality
- Keyboard shortcuts

### Terrain Editing Classes

#### Loaded in `index.html` (in order):
1. **Core Editing**:
   - `TerrainEditor.js` - Main editing operations (paint, fill, undo/redo)
   - `TerrainExporter.js` - Export terrain to JSON
   - `TerrainImporter.js` - Import terrain from JSON

2. **UI Components**:
   - `MaterialPalette.js` - Material selection interface
   - `ToolBar.js` - Tool selection (paint, fill, eyedropper, select, eraser)
   - `BrushSizeControl.js` - Brush size slider
   - `MiniMap.js` - Mini-map overview
   - `PropertiesPanel.js` - Terrain properties display
   - `GridOverlay.js` - Grid visualization (legacy)
   - `DynamicGridOverlay.js` - **Edge-only grid rendering** (performance optimized)
   - `NotificationManager.js` - User notifications

3. **File I/O**:
   - `ConfirmationDialog.js` - User confirmations
   - `SaveDialog.js` - Save file dialog
   - `LoadDialog.js` - Load file dialog
   - `LocalStorageManager.js` - Browser storage
   - `AutoSave.js` - Auto-save functionality
   - `ServerIntegration.js` - Server save/load
   - `FormatConverter.js` - Format conversion

4. **Main Controller**:
   - `LevelEditor.js` - Main editor controller

## User Interface

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ [Back to Menu]                    Notifications        │
├──────────────┬──────────────────────────────────┬───────────┤
│              │                                  │Properties │
│ Material     │                                  │Panel      │
│ Palette      │        Terrain View              │           │
│              │                                  ├───────────┤
├──────────────┤                                  │           │
│ Toolbar      │                                  │ MiniMap   │
│              │                                  │           │
├──────────────┤                                  │           │
│ Brush Size   │                                  │           │
│              │                                  │           │
└──────────────┴──────────────────────────────────┴───────────┘
```

### Available Tools
1. **Paint** (🖌️) - Paint individual tiles or with a brush
2. **Fill** (🪣) - Flood fill connected regions
3. **Eyedropper** (💧) - Pick material from terrain
4. **Select** (⬚) - Select regions (future feature)
5. **Eraser** (🧹) - Remove painted tiles (revert to empty/default) ✅ NEW

### Available Materials
From `TERRAIN_MATERIALS_RANGED`:
- `moss` - Moss tiles
- `moss_1` - Moss variant
- `stone` - Stone tiles
- `dirt` - Dirt tiles
- `grass` - Grass tiles

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+S` | Save level |
| `Ctrl+O` | Load level |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `G` | Toggle grid overlay |
| `M` | Toggle minimap |

## Creating a New Map

### New Map Size Dialog

When creating a new level, the editor now prompts for map dimensions via the **New Map Size Dialog**.

#### Opening the Dialog
1. Click **"File"** in the menu bar
2. Select **"New"**
3. The "New Map" dialog appears

**If unsaved changes exist**, you'll be prompted: "Discard unsaved changes?"

#### Dialog Features

**Default Values**: 50x50 tiles (medium-sized map)

**Input Fields**:
- **Width**: Number of tiles horizontally (10-200)
- **Height**: Number of tiles vertically (10-200)

**Validation**:
- Minimum: 10 tiles per dimension
- Maximum: 200 tiles per dimension
- Error message displayed for invalid input (red text)
- Create button disabled when validation fails (gray)

**Keyboard Shortcuts**:
- **Tab**: Switch between width and height fields
- **Enter**: Create map (only if dimensions are valid)
- **Escape**: Cancel dialog
- **0-9**: Enter numeric values
- **Backspace**: Delete last digit

**Visual Feedback**:
- Active field highlighted with yellow border
- Validation hint: "Min: 10 tiles, Max: 200 tiles" (gray)
- Error messages in red
- Create button blue when valid, gray when invalid

#### Example Usage

**Small Map** (quick testing):
- Width: 20
- Height: 20
- Result: 400 tiles

**Medium Map** (balanced gameplay):
- Width: 50
- Height: 50
- Result: 2,500 tiles (default)

**Large Map** (performance intensive):
- Width: 100
- Height: 100
- Result: 10,000 tiles

#### Technical Details

**Terrain Creation**:
- Uses `SparseTerrain` (lazy loading, black canvas)
- Falls back to `CustomTerrain` if `SparseTerrain` unavailable
- Falls back to `gridTerrain` as last resort

**Component Reinitialization**:
- TerrainEditor reset
- MiniMap recreated with new dimensions
- PropertiesPanel updated
- GridOverlay reinitialized
- Filename set to "Untitled"
- Modified flag set to false

**Notification**: "New {width}x{height} terrain created" displayed after confirmation

**API**: See [NewMapDialog API Reference](api/NewMapDialog_API_Reference.md) for programmatic usage.

---

## Sketch.js Integration

### Update Loop
```javascript
if (GameState.getState() === 'LEVEL_EDITOR') {
  if (window.levelEditor) {
    levelEditor.update();
  }
}
```

### Render Loop
```javascript
if (GameState.getState() === 'LEVEL_EDITOR') {
  if (window.levelEditor && levelEditor.isActive()) {
    background(40, 40, 40); // Dark background
    levelEditor.render();
  }
} else {
  RenderManager.render(GameState.getState());
}
```

### Input Handling

**Mouse Clicks**:
```javascript
function mousePressed() {
  if (GameState.getState() === 'LEVEL_EDITOR') {
    if (window.levelEditor && levelEditor.isActive()) {
      levelEditor.handleClick(mouseX, mouseY);
      return;
    }
  }
  // ... other handlers
}
```

**Keyboard**:
```javascript
function keyPressed() {
  if (GameState.getState() === 'LEVEL_EDITOR') {
    if (window.levelEditor && levelEditor.isActive()) {
      levelEditor.handleKeyPress(key);
    }
  }
  // ... other handlers
}
```

### State Change Callback
```javascript
GameState.onStateChange((newState, oldState) => {
  if (newState === 'LEVEL_EDITOR') {
    const terrain = window.g_activeMap || new gridTerrain(10, 10);
    levelEditor.initialize(terrain);
  } else if (oldState === 'LEVEL_EDITOR') {
    levelEditor.deactivate();
  }
});
```

## Data Flow

### Paint Tool Example
```
User clicks terrain
     ↓
mousePressed() → levelEditor.handleClick(x, y)
     ↓
Convert screen coords to grid coords
     ↓
Get selected material from palette
     ↓
Get selected tool from toolbar
     ↓
editor.paint(gridX, gridY, material)
     ↓
Tile.setMaterial() updates terrain
     ↓
notifications.show("Painted...")
     ↓
Terrain re-renders on next frame
```

### Save/Load Flow
```
User presses Ctrl+S
     ↓
levelEditor.handleKeyPress('s')
     ↓
levelEditor.save()
     ↓
TerrainExporter.exportToJSON()
     ↓
LocalStorageManager.save('current', data)
     ↓
notifications.show("Level saved!")
```

## Testing

### Integration Tests
Location: `test/integration/terrainUtils/gridTerrain.integration.test.js`

All 26 integration tests verify:
- ✅ Material palette integration with gridTerrain
- ✅ TerrainEditor paint/fill operations
- ✅ TerrainExporter JSON export
- ✅ TerrainImporter JSON import
- ✅ Save/Load dialog validation
- ✅ Format conversion
- ✅ Full edit → save → load → edit workflow
- ✅ LocalStorage integration

### Unit Tests
Location: `test/unit/ui/terrainUI.test.js` and `test/unit/ui/fileIO.test.js`

103 unit tests passing for all UI and File I/O components.

## Usage Instructions

### Accessing the Level Editor
1. Launch the game
2. From the main menu, click **"Level Editor"** button
3. The level editor opens with a blank or existing terrain

### Creating a Level
1. **Select a material** from the palette (left side)
2. **Select a tool** from the toolbar (paint/fill/eyedropper/eraser)
3. **Adjust brush size** if using paint tool
4. **Click on terrain** to apply changes
5. **Press Ctrl+S** to save your level

### Loading a Level
1. Press **Ctrl+O** to load
2. Previously saved level loads from browser storage
3. Continue editing

### Returning to Game
1. Click **"Back to Menu"** button (top right)
2. Or press ESC (if implemented)

## Future Enhancements

### Planned Features
- [ ] Region selection tool
- [ ] Copy/Paste terrain sections
- [ ] Multiple layer support
- [ ] Entity placement in editor
- [ ] Resource node placement
- [ ] Export to file (download)
- [ ] Import from file (upload)
- [ ] Undo/Redo history visualization
- [ ] Custom terrain materials
- [ ] Terrain preview thumbnails
- [ ] Level metadata (name, description, author)

### Server Integration
The `ServerIntegration` class is ready for:
- Cloud save/load
- Level sharing
- Community levels browser
- Version control

## Troubleshooting

### Level Editor Button Not Showing
- Verify `GameStateManager.js` has `LEVEL_EDITOR` state
- Check `menu.js` has the Level Editor button config
- Ensure `GameState.goToLevelEditor()` exists

### Black Screen in Editor
- Check browser console for errors
- Verify all terrain editing classes are loaded in `index.html`
- Confirm `levelEditor.initialize()` was called

### Can't Paint Terrain
- Verify `TerrainEditor` is initialized
- Check material palette has valid materials
- Ensure toolbar has a tool selected
- Verify terrain exists and is valid gridTerrain

### Save/Load Not Working
- Check browser console for localStorage errors
- Verify `LocalStorageManager` is loaded
- Check browser allows localStorage
- Try different browser if needed

## File Locations

```
Classes/
├── terrainUtils/
│   ├── TerrainEditor.js      - Core editing logic
│   ├── TerrainExporter.js    - JSON export
│   └── TerrainImporter.js    - JSON import
├── ui/
│   ├── MaterialPalette.js    - Material selection
│   ├── ToolBar.js            - Tool selection
│   ├── BrushSizeControl.js   - Brush size
│   ├── MiniMap.js            - Mini-map
│   ├── PropertiesPanel.js    - Properties
│   ├── GridOverlay.js        - Grid display
│   ├── NotificationManager.js - Notifications
│   ├── SaveDialog.js         - Save dialog
│   ├── LoadDialog.js         - Load dialog
│   ├── LocalStorageManager.js - Storage
│   └── FormatConverter.js    - Format conversion
├── systems/ui/
│   ├── LevelEditor.js        - Main controller
│   └── menu.js               - Menu system
└── managers/
    └── GameStateManager.js   - Game states

test/
├── integration/terrainUtils/
│   └── gridTerrain.integration.test.js  - Integration tests
└── unit/ui/
    ├── terrainUI.test.js               - UI unit tests
    └── fileIO.test.js                  - File I/O tests
```

## API Reference

### LevelEditor Methods

```javascript
// Initialize editor
levelEditor.initialize(terrain)

// Activation
levelEditor.activate()
levelEditor.deactivate()
levelEditor.isActive()

// Editing
levelEditor.handleClick(mouseX, mouseY)
levelEditor.handleKeyPress(key)

// File operations
levelEditor.save()
levelEditor.load()

// Undo/Redo
levelEditor.undo()
levelEditor.redo()

// Rendering
levelEditor.update()
levelEditor.render()
```

### GameState Methods

```javascript
// Transition to editor
GameState.goToLevelEditor()

// Check if in editor
GameState.isLevelEditor()

// Register callback
GameState.onStateChange((newState, oldState) => {
  // Handle state changes
})
```

## Dependencies

Required p5.js features:
- Canvas rendering
- Mouse events (mouseX, mouseY, mouseIsPressed)
- Keyboard events (keyIsDown, key, keyCode)
- Drawing functions (rect, fill, stroke, text, etc.)

Required global objects:
- `GameState` - Game state manager
- `gridTerrain` - Terrain system
- `cameraManager` - Camera system (optional)
- `g_canvasX`, `g_canvasY` - Canvas dimensions

## Notes

- Level Editor renders at 60 FPS like the game
- All terrain edits are immediately visible
- Undo/redo history is maintained per session
- LocalStorage is limited to ~5-10MB per domain
- Use server integration for larger levels
