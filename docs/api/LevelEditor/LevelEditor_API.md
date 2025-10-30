# LevelEditor API Reference

**Inherits**: (No inheritance)  
**File**: `Classes/systems/ui/LevelEditor.js`

Complete Level Editor system for creating and editing game terrains with tools, shortcuts, and UI integration.

---

## Description

`LevelEditor` is the main controller for the Level Editor mode in the Ant Colony Simulation Game. It provides a complete terrain editing experience with multiple tools (paint, fill, eraser, eyedropper, select), material palette, minimap, undo/redo, save/load functionality, and keyboard shortcuts.

**Key Features**:
- **Multiple Editing Tools**: Paint, Fill, Eraser, Eyedropper, Select
- **Material Palette**: Browse and select from categorized terrain materials
- **Brush Size Control**: Adjustable brush size (1-99) for paint and eraser tools
- **Undo/Redo System**: Full history with Ctrl+Z and Ctrl+Y shortcuts
- **Save/Load**: JSON export/import with sparse terrain support
- **Minimap**: Real-time terrain preview with camera position indicator
- **Keyboard Shortcuts**: Tool selection, brush resizing, undo/redo
- **Event System**: Random event editor integration
- **Shortcut Manager Integration**: Reusable shortcut system for extensibility

**Architecture**: Composition pattern - delegates to specialized components (TerrainEditor, MaterialPalette, ToolBar, FileMenuBar, etc.)

---

## Tutorials

- **Level Editor Setup**: `docs/LEVEL_EDITOR_SETUP.md`
- **Shortcut System**: `docs/api/ShortcutManager_API_Reference.md`
- **Terrain Import/Export**: `docs/TERRAIN_IMPORT_EXPORT_IMPLEMENTATION.md`
- **Event System Integration**: `docs/roadmaps/RANDOM_EVENTS_ROADMAP.md`

---

## Properties

| Type                  | Property              | Default        | Description                                    |
|-----------------------|-----------------------|----------------|------------------------------------------------|
| `bool`                | `active`              | `false`        | Whether Level Editor is currently active       |
| `CustomTerrain`       | `terrain`             | `null`         | Current terrain being edited                   |
| `TerrainEditor`       | `editor`              | `null`         | Terrain editing operations manager             |
| `MaterialPalette`     | `palette`             | `null`         | Material selection UI                          |
| `ToolBar`             | `toolbar`             | `null`         | Tool selection toolbar                         |
| `EventEditorPanel`    | `eventEditor`         | `null`         | Random event editor panel                      |
| `EventFlagLayer`      | `eventFlagLayer`      | `null`         | EventFlag collection manager                   |
| `MiniMap`             | `minimap`             | `null`         | Minimap preview component                      |
| `PropertiesPanel`     | `propertiesPanel`     | `null`         | Properties display panel                       |
| `DynamicGridOverlay`  | `gridOverlay`         | `null`         | Grid overlay renderer                          |
| `SaveDialog`          | `saveDialog`          | `null`         | Save dialog UI                                 |
| `LoadDialog`          | `loadDialog`          | `null`         | Load dialog UI                                 |
| `NotificationManager` | `notifications`       | `null`         | Notification system                            |
| `DraggablePanelManager`| `levelEditorPanels`  | `null`         | Panel manager for draggable UI                 |
| `FileMenuBar`         | `fileMenuBar`         | `null`         | File operations menu bar                       |
| `SelectionManager`    | `selectionManager`    | `null`         | Rectangle selection for select tool            |
| `HoverPreviewManager` | `hoverPreviewManager` | `null`         | Hover preview for all tools                    |
| `LevelEditorSidebar`  | `sidebar`             | `null`         | Sidebar menu (wired from panels)               |
| `String`              | `currentFilename`     | `'Untitled'`   | Current filename (no extension)                |
| `bool`                | `isModified`          | `false`        | Track if terrain modified                      |
| `bool`                | `isMenuOpen`          | `false`        | Track if menu dropdown open                    |
| `bool`                | `showGrid`            | `true`         | Grid overlay visibility                        |
| `bool`                | `showMinimap`         | `true`         | Minimap visibility                             |
| `CameraManager`       | `editorCamera`        | `null`         | Camera for Level Editor                        |
| `Object`              | `_shortcutContext`    | `null`         | Context for ShortcutManager (private)          |

---

## Methods

### Core Lifecycle

| Returns | Method                                                    |
|---------|-----------------------------------------------------------|
| `bool`  | initialize ( terrain: `CustomTerrain` )                  |
| `void`  | activate ( )                                             |
| `void`  | deactivate ( )                                           |

### Shortcut System (NEW)

| Returns | Method                                                    |
|---------|-----------------------------------------------------------|
| `void`  | _setupShortcutContext ( ) private                        |
| `void`  | _registerShortcuts ( ) private                           |

### Input Handling

| Returns | Method                                                                                        |
|---------|-----------------------------------------------------------------------------------------------|
| `void`  | handleMouseMove ( mouseX: `int`, mouseY: `int` )                                            |
| `void`  | handleClick ( mouseX: `int`, mouseY: `int` )                                                |
| `bool`  | handleMouseWheel ( event: `Object`, shiftKey: `bool`, mouseX: `int`, mouseY: `int` )       |
| `void`  | handleHover ( mouseX: `int`, mouseY: `int` )                                                |
| `void`  | handleKeyPress ( key: `String` )                                                            |

### Rendering

| Returns | Method                                                    |
|---------|-----------------------------------------------------------|
| `void`  | render ( )                                               |
| `void`  | renderHoverPreview ( )                                   |

### File Operations

| Returns | Method                                                    |
|---------|-----------------------------------------------------------|
| `void`  | save ( )                                                 |
| `void`  | load ( )                                                 |
| `Object`| _performExport ( ) private                               |
| `void`  | _performImport ( data: `Object` ) private                |

### UI State Management

| Returns | Method                                                    |
|---------|-----------------------------------------------------------|
| `void`  | setMenuOpen ( isOpen: `bool` )                           |
| `void`  | markModified ( )                                         |
| `void`  | clearModified ( )                                        |

---

## Method Descriptions

### <span id="initialize"></span>bool **initialize** ( terrain: `CustomTerrain` )

Initializes the Level Editor with a terrain instance. Sets up all components (editor, palette, toolbar, panels, etc.) and registers shortcuts.

```javascript
const terrain = new SparseTerrain(32, 'dirt');
const levelEditor = new LevelEditor();
const success = levelEditor.initialize(terrain);
if (success) {
  console.log('Level Editor ready');
}
```

**Parameters:**
- `terrain` (`CustomTerrain`, **required**): The terrain to edit (SparseTerrain or gridTerrain)

Returns `bool`. True if initialization succeeded, false if terrain is null.

**Initialization Steps**:
1. Creates `TerrainEditor` for editing operations
2. Creates `MaterialPalette` and selects 'grass' by default
3. Creates `ToolBar` with 5 tools (paint, fill, eyedropper, select, eraser)
4. Creates `EventEditorPanel` for random events
5. Creates `SaveDialog` and `LoadDialog` for file operations
6. Creates `NotificationManager` for user feedback
7. Creates `FileMenuBar` for save/load/export
8. Creates `SelectionManager` for select tool
9. Creates `HoverPreviewManager` for cursor preview
10. **Calls `_setupShortcutContext()` to create context provider**
11. **Calls `_registerShortcuts()` to register keyboard shortcuts**
12. Creates `MiniMap`, `PropertiesPanel`, `DynamicGridOverlay`
13. Integrates with `DraggablePanelManager` for UI panels

**Note:** Must be called before `activate()`.

---

### <span id="activate"></span>void **activate** ( )

Activates the Level Editor mode. Creates default terrain if none exists. Shows all UI panels.

```javascript
levelEditor.activate();
// Level Editor now active, panels visible
```

**Behavior**:
- If no terrain exists, creates new `SparseTerrain(32, 'dirt')` and calls `initialize()`
- Sets `active = true`
- Shows `levelEditorPanels` (all UI components)
- Switches game state to Level Editor mode

**Note:** Safe to call multiple times. Will initialize terrain if needed.

---

### <span id="deactivate"></span>void **deactivate** ( )

Deactivates the Level Editor mode. Hides all UI panels.

```javascript
levelEditor.deactivate();
// Level Editor hidden, game returns to normal mode
```

**Behavior**:
- Sets `active = false`
- Hides `levelEditorPanels`
- Does **not** destroy terrain or components (can be reactivated)

---

### <span id="setupshortcutcontext"></span>void **_setupShortcutContext** ( ) private

Creates the context object for `ShortcutManager` integration. Provides methods for shortcuts to interact with Level Editor state.

```javascript
// Called automatically by initialize()
// Creates this._shortcutContext with:
{
  getCurrentTool: () => this.toolbar.getSelectedTool(),
  getBrushSize: () => this.fileMenuBar.brushSizeModule.getSize(),
  setBrushSize: (size) => { /* update brush size */ }
}
```

**Context Methods Provided**:
- `getCurrentTool()` - Returns active tool name ('paint', 'eraser', etc.)
- `getBrushSize()` - Returns current brush size (1-99)
- `setBrushSize(size)` - Updates brush size in menu bar and terrain editor

**Usage**: Context is passed to `ShortcutManager.handleMouseWheel()` for shortcut actions.

**Note:** This is a **context provider pattern** - decouples shortcut actions from LevelEditor internals.

---

### <span id="registershortcuts"></span>void **_registerShortcuts** ( ) private

Registers keyboard shortcuts with `ShortcutManager`. Currently registers Shift+Scroll for brush size adjustment.

```javascript
// Called automatically by initialize()
// Registers two shortcuts:
// 1. Shift+Scroll Up: Increase brush size
// 2. Shift+Scroll Down: Decrease brush size
```

**Registered Shortcuts**:

1. **Brush Size Increase** (`leveleditor-brush-size-increase`)
   - Trigger: Shift + MouseWheel Up
   - Tools: paint, eraser
   - Action: Increases brush size by 1 (max 99)

2. **Brush Size Decrease** (`leveleditor-brush-size-decrease`)
   - Trigger: Shift + MouseWheel Down
   - Tools: paint, eraser
   - Action: Decreases brush size by 1 (min 1)

**Adding New Shortcuts**:
```javascript
// In _registerShortcuts() method, add:
ShortcutManager.register({
  id: 'leveleditor-my-shortcut',
  trigger: { modifier: 'ctrl', event: 'mousewheel', direction: 'up' },
  tools: ['all'],
  action: (context) => {
    // Your action code here
    console.log('Custom shortcut triggered!');
  }
});
```

**Note:** Shortcuts are registered once during initialization and remain active while ShortcutManager instance exists.

---

### <span id="handlemousewheel"></span>bool **handleMouseWheel** ( event: `Object`, shiftKey: `bool`, mouseX: `int`, mouseY: `int` )

Handles mouse wheel events. Delegates to sidebar for scrolling or ShortcutManager for shortcuts.

```javascript
// Called by sketch.js mouseWheel() event
function mouseWheel(event) {
  if (levelEditor.active) {
    const handled = levelEditor.handleMouseWheel(
      event,
      keyIsDown(SHIFT),
      mouseX,
      mouseY
    );
    if (handled) return false; // Prevent default
  }
}
```

**Parameters:**
- `event` (`Object`, **required**): Mouse wheel event with `deltaY` property
- `shiftKey` (`bool`, **required**): Whether Shift key is pressed
- `mouseX` (`int`, optional): Mouse X position (uses global if undefined)
- `mouseY` (`int`, optional): Mouse Y position (uses global if undefined)

Returns `bool`. True if event was handled (consumed), false otherwise.

**Handling Priority**:
1. **Sidebar scrolling** (if mouse over sidebar) - scrolls content
2. **ShortcutManager** (if Shift pressed) - triggers brush size shortcuts
3. **Return false** - event not handled

**Refactored Code** (using ShortcutManager):
```javascript
// OLD: 40+ lines of hardcoded brush size logic
// NEW: 5-line delegation
if (shiftKey && typeof ShortcutManager !== 'undefined') {
  const modifiers = { shift: shiftKey, ctrl: false, alt: false };
  const handled = ShortcutManager.handleMouseWheel(event, modifiers, this._shortcutContext);
  if (handled) return true;
}
```

**Note:** This method demonstrates the **power of ShortcutManager** - replaced 40 lines with 5 lines.

---

### <span id="handleclick"></span>void **handleClick** ( mouseX: `int`, mouseY: `int` )

Handles mouse clicks for tool actions (paint, erase, fill, select, eyedropper).

```javascript
// Called by sketch.js mousePressed() event
function mousePressed() {
  if (levelEditor.active) {
    levelEditor.handleClick(mouseX, mouseY);
  }
}
```

**Parameters:**
- `mouseX` (`int`, **required**): Mouse X position in screen space
- `mouseY` (`int`, **required**): Mouse Y position in screen space

**Behavior by Tool**:
- **Paint**: Paints material at cursor with brush size
- **Eraser**: Erases tiles at cursor with brush size
- **Fill**: Flood fills connected region with material
- **Eyedropper**: Samples material at cursor and selects it in palette
- **Select**: Starts rectangle selection (drag to select region)

**Coordinate Transformation**:
```javascript
// Screen space → World space → Grid coordinates
const worldPos = cameraManager.screenToWorld(mouseX, mouseY);
const tileX = Math.floor(worldPos.x / TILE_SIZE);
const tileY = Math.floor(worldPos.y / TILE_SIZE);
```

**Integration**:
- Updates undo/redo history for paint/erase
- Shows notifications (e.g., "Painted 9 tiles", "Erased 5 tiles")
- Updates minimap cache
- Updates undo/redo button states

---

### <span id="handlehover"></span>void **handleHover** ( mouseX: `int`, mouseY: `int` )

Handles mouse hover for cursor preview (shows affected tiles before click).

```javascript
// Called by sketch.js mouseMoved() event
function mouseMoved() {
  if (levelEditor.active) {
    levelEditor.handleHover(mouseX, mouseY);
  }
}
```

**Parameters:**
- `mouseX` (`int`, **required**): Mouse X position in screen space
- `mouseY` (`int`, **required**): Mouse Y position in screen space

**Behavior**:
- Calculates affected tiles using `HoverPreviewManager`
- Stores affected tiles for rendering in `renderHoverPreview()`
- Updates in real-time as mouse moves

**Tool-Specific Previews**:
- **Paint**: Yellow outline showing brush area
- **Eraser**: **RED outline** showing erase area (indicates destructive action)
- **Fill**: Blue outline showing target tile
- **Select**: Blue outline showing selection rectangle
- **Eyedropper**: White outline showing sample tile

---

### <span id="renderhoverpreview"></span>void **renderHoverPreview** ( )

Renders the hover preview overlay showing affected tiles for current tool.

```javascript
// Called automatically by render() method
render() {
  // ... render terrain, UI, etc ...
  this.renderHoverPreview(); // Draw cursor preview on top
}
```

**Rendering Logic**:
```javascript
// Tool-specific colors
switch (currentTool) {
  case 'paint':
    fill(255, 255, 0, 80); // Yellow
    break;
  case 'eraser':
    fill(255, 0, 0, 80); // RED (destructive)
    break;
  case 'fill':
    fill(100, 150, 255, 80); // Blue
    break;
  // ... other tools
}

// Draw rectangles for each affected tile
for (const tile of affectedTiles) {
  rect(screenX, screenY, TILE_SIZE, TILE_SIZE);
}
```

**Note:** Uses screen space coordinates (already transformed from world space).

---

### <span id="save"></span>void **save** ( )

Opens save dialog for exporting terrain to JSON file.

```javascript
levelEditor.save();
// Save dialog appears, user enters filename
```

**Behavior**:
- Shows `SaveDialog` with current filename
- On confirm: Calls `_performExport()` and triggers browser download
- On cancel: Closes dialog

**File Format**: JSON with sparse or grid terrain format (auto-detected)

---

### <span id="load"></span>void **load** ( )

Opens load dialog for importing terrain from JSON file.

```javascript
levelEditor.load();
// Load dialog appears, user selects file
```

**Behavior**:
- Shows `LoadDialog` with file picker
- On file selected: Calls `_performImport(data)` and replaces terrain
- On cancel: Closes dialog

**Validation**: Uses `TerrainImporter` to detect and validate format.

---

### <span id="performexport"></span>Object **_performExport** ( ) private

Exports current terrain to JSON object using native terrain export.

```javascript
// Called internally by save()
const data = this._performExport();
// Returns: { version, metadata, tiles, ... }
```

Returns `Object`. Terrain data in JSON format.

**Format Detection**:
- **SparseTerrain**: Uses `terrain.exportToJSON()` (sparse format)
- **gridTerrain**: Uses legacy grid format

**Refactored** (Issue fixed): Now uses native terrain export instead of forcing grid format.

---

## Keyboard Shortcuts Reference

### Tool Selection
- **P** - Select Paint tool
- **F** - Select Fill tool
- **I** - Select Eyedropper tool
- **S** - Select Select tool
- **E** - Select Eraser tool

### Brush Size (Paint & Eraser only)
- **Shift + Scroll Up** - Increase brush size (+1, max 99)
- **Shift + Scroll Down** - Decrease brush size (-1, min 1)

### Undo/Redo
- **Ctrl+Z** - Undo last action
- **Ctrl+Y** - Redo last undone action

### File Operations
- **Ctrl+S** - Save terrain (opens save dialog)
- **Ctrl+O** - Load terrain (opens load dialog)

### Deselect Tool
- **ESC** - Deselect current tool (return to No Tool mode)

**Note:** Brush size shortcuts powered by `ShortcutManager` for easy extensibility.

---

## Common Workflows

### Creating a New Level

```javascript
// 1. Create terrain
const terrain = new SparseTerrain(32, 'dirt');

// 2. Initialize Level Editor
const levelEditor = new LevelEditor();
levelEditor.initialize(terrain);

// 3. Activate Level Editor
levelEditor.activate();

// 4. User can now paint, erase, etc.
// All keyboard shortcuts automatically active
```

---

### Adding a Custom Shortcut

```javascript
// In LevelEditor._registerShortcuts()
_registerShortcuts() {
  // ... existing shortcuts ...
  
  // NEW: Ctrl+Scroll for opacity control
  ShortcutManager.register({
    id: 'leveleditor-opacity-increase',
    trigger: { modifier: 'ctrl', event: 'mousewheel', direction: 'up' },
    tools: ['all'], // Works for any tool
    action: (context) => {
      // Your custom action
      const currentOpacity = this.palette.getOpacity(); // Example
      this.palette.setOpacity(Math.min(currentOpacity + 5, 100));
      this.notifications.show('Opacity: ' + this.palette.getOpacity());
    }
  });
}
```

**Steps**:
1. Add to `_registerShortcuts()` method
2. Use unique `id` starting with `'leveleditor-'`
3. Define `trigger` with modifier, event, direction
4. Specify `tools` array or `['all']`
5. Implement `action` callback with context parameter

**No other code changes needed!** ShortcutManager handles event delegation automatically.

---

### Extending Shortcut Context

```javascript
// In LevelEditor._setupShortcutContext()
_setupShortcutContext() {
  this._shortcutContext = {
    // ... existing methods ...
    
    // NEW: Add opacity methods
    getOpacity: () => {
      return this.palette ? this.palette.getOpacity() : 100;
    },
    setOpacity: (opacity) => {
      if (this.palette) {
        this.palette.setOpacity(opacity);
      }
    },
    
    // NEW: Add layer methods
    getCurrentLayer: () => {
      return this.layers ? this.layers.getActiveLayer() : 0;
    },
    setCurrentLayer: (layer) => {
      if (this.layers) {
        this.layers.setActiveLayer(layer);
      }
    }
  };
}
```

**Pattern**: Add getter/setter pairs for any state you want shortcuts to control.

---

### Handling Tool-Specific Actions

```javascript
// Example: Custom tool action in handleClick()
handleClick(mouseX, mouseY) {
  // ... coordinate transformation ...
  
  const currentTool = this.toolbar.getSelectedTool();
  
  switch (currentTool) {
    case 'paint':
      // Paint logic
      break;
    case 'eraser':
      // Erase logic
      break;
    case 'my-custom-tool': // NEW TOOL
      const material = this.palette.getSelectedMaterial();
      const result = this.editor.myCustomAction(tileX, tileY, material);
      if (result > 0) {
        this.notifications.show(`Custom action affected ${result} tiles`);
        this.minimap.notifyTerrainChange(tileX, tileY);
      }
      break;
  }
}
```

---

### Programmatic Terrain Editing

```javascript
// Paint tiles programmatically
const tileX = 10;
const tileY = 10;
const material = 'stone';
const brushSize = 3;

levelEditor.editor.paint(tileX, tileY, material, brushSize);

// Erase tiles programmatically
levelEditor.editor.erase(tileX, tileY, brushSize);

// Undo last action
levelEditor.editor.undo();

// Redo last undone action
levelEditor.editor.redo();
```

---

## Best Practices

### Shortcut Registration
✅ **DO**: Use unique IDs with prefix (`'leveleditor-brush-size-increase'`)  
✅ **DO**: Specify tools array for tool-specific shortcuts  
✅ **DO**: Use `['all']` for global shortcuts  
❌ **DON'T**: Hardcode shortcut logic in event handlers  
❌ **DON'T**: Register shortcuts outside `_registerShortcuts()` method

### Context Provider Pattern
✅ **DO**: Add methods to `_shortcutContext` for new shortcut actions  
✅ **DO**: Use getter/setter pairs for state management  
✅ **DO**: Null-check components before accessing them  
❌ **DON'T**: Access `this` directly in shortcut actions (use context)  
❌ **DON'T**: Assume components exist (they may be null)

### Event Delegation
✅ **DO**: Check if ShortcutManager exists before using (`typeof ShortcutManager !== 'undefined'`)  
✅ **DO**: Return `true` if event was handled (consumed)  
✅ **DO**: Return `false` if event was not handled (allow propagation)  
❌ **DON'T**: Consume events that weren't handled  
❌ **DON'T**: Skip null checks for optional components

---

## Notes

- **Singleton Managers**: Level Editor uses singleton managers (ShortcutManager, EventManager, etc.)
- **Camera Integration**: Always transform coordinates using `cameraManager.screenToWorld()` before terrain operations
- **Undo/Redo Limits**: History is limited to prevent memory issues (typically 50-100 actions)
- **Panel Management**: All UI panels managed by `DraggablePanelManager` for consistent behavior
- **Sparse Terrain**: Preferred for large maps with sparse content (99% smaller JSON files)
- **Shortcut Conflicts**: First registered shortcut wins - order matters in `_registerShortcuts()`

---

## Performance Considerations

- **Hover Preview**: Recalculated every mouse move - keep `HoverPreviewManager` logic efficient
- **Minimap Cache**: Invalidated on terrain changes - updates asynchronously
- **Grid Overlay**: Only renders visible tiles + buffer - uses spatial optimization
- **Undo History**: Old actions pruned to prevent memory leaks
- **ShortcutManager**: Shortcuts checked sequentially - register frequently-used shortcuts first

---

## Related Documentation

- **ShortcutManager API**: `docs/api/ShortcutManager_API_Reference.md`
- **TerrainEditor API**: `docs/api/TerrainEditor_API_Reference.md` (if exists)
- **EventManager API**: `docs/api/EventManager_API_Reference_NEW.md`
- **Level Editor Setup**: `docs/LEVEL_EDITOR_SETUP.md`
- **Eraser Tool Implementation**: `docs/checklists/active/ERASER_TOOL_CHECKLIST.md`
- **Testing Guide**: `docs/guides/E2E_TESTING_QUICKSTART.md`
