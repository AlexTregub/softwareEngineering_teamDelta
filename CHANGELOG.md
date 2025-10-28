# Changelog

All notable changes to the Ant Colony Simulation Game.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

---

## [Unreleased]

### BREAKING CHANGES

(None)

---

### User-Facing Changes

#### Added
- **Event Placement Mode** (Level Editor Enhancement)
  - Double-click drag button in Events panel for "sticky" placement mode
  - Flag cursor (🚩) with trigger radius preview circle
  - Single-click placement without holding mouse button
  - ESC key cancellation

- **Fill Tool Bounds Limit**
  - Limited to 100x100 tile area per operation (10,000 tiles maximum)
  - Prevents performance issues when filling large sparse regions
  - Returns operation metadata (tiles filled, limit reached status)

- **Custom Canvas Sizes**
  - Default canvas size: 100x100 tiles (was 1000x1000) for better performance
  - Custom sizes supported: `new SparseTerrain(32, 'grass', { maxMapSize: 250 })`
  - Size validation: minimum 10x10, maximum 1000x1000 (auto-clamped)
  - Canvas size persisted in saved terrain files

- **Event Manager**
  - EventManager system for random game events (dialogue, spawn, tutorial, boss)
  - Event trigger system (time-based, flag-based, spatial, conditional, viewport)
  - EventEditorPanel for Level Editor (create/edit/test events)
  - JSON import/export for events in Level Editor

- **SparseTerrain class** for lazy terrain loading
  - Map-based sparse tile storage
  - Supports painting at any coordinate (positive/negative) within 1000x1000 limit
  - Dynamic bounds tracking (auto-expands/shrinks)
  - Sparse JSON export (only painted tiles, massive space savings)

- **DynamicGridOverlay class** for lazy terrain grid rendering
  - Grid appears only at painted tiles + 2-tile buffer
  - Opacity feathering: 1.0 at painted tiles, fades to 0.0 at buffer edge
  - Shows grid at mouse hover when no tiles painted
  - Memoization caching (75% performance improvement)

- **DynamicMinimap class** for lazy terrain minimap
  - Viewport calculated from painted terrain bounds + padding
  - Auto-scaling to fit viewport
  - Renders painted tiles with material colors
  - Camera viewport outline overlay (yellow)

- **Level Editor now uses SparseTerrain by default**
  - New terrains start with black canvas (zero tiles)
  - Can paint anywhere within 1000x1000 bounds
  - Supports negative coordinates
  - Sparse JSON saves (only painted tiles exported)

#### Fixed
- **Event Placement Mode Double-Click Bug**
  - Root cause: Missing double-click event wiring - `handleDoubleClick()` was never called
  - Fixed: Added `doubleClicked()` p5.js handler + routing through LevelEditor → LevelEditorPanels → EventEditorPanel

- Terrain no longer paints underneath menu bar during drag/click operations
- Terrain no longer paints underneath save/load dialogs
- View menu panel toggles now work correctly

#### Changed
- Level Editor brush size now controlled via menu bar inline controls (+/- buttons)
- Brush Size draggable panel hidden by default (redundant with menu bar controls)
- Properties panel hidden by default in Level Editor (toggle via View menu)
- Events panel hidden by default in Level Editor (toggle via Tools panel)

---

### Developer-Facing Changes

#### Added
- SparseTerrain compatibility layer: `getArrPos([x, y])` interface for TerrainEditor
- `invalidateCache()` no-op method for compatibility
- Compatibility properties: `_tileSize`, `_gridSizeX`, `_gridSizeY`, `_chunkSize`
- Full event wiring: `doubleClicked()` → LevelEditor → LevelEditorPanels → EventEditorPanel

#### Refactored
- **EventEditorPanel.render()**: Now accepts 4 parameters `(x, y, width, height)` instead of 2
  - Functions changed: `render()` signature in EventEditorPanel
  - Functions changed: `LevelEditorPanels.render()` callback to pass all 4 parameters
  - New workflow: ContentArea object provides all layout dimensions
  - Breaking: External code calling `EventEditorPanel.render()` must pass width/height

- **FileMenuBar._handleTogglePanel()**: Switched to global `draggablePanelManager` API
  - Functions changed: `_handleTogglePanel()` method
  - New workflow: Direct use of `draggablePanelManager.togglePanel(panelId)`
  - Functions changed: Panel ID mapping (short names → full IDs)

- **LevelEditor click handling priority**: Reordered for better UX
  - Functions changed: `handleClick()`, `handleDrag()` methods
  - New workflow:
    1. Check if mouse over menu bar → block painting
    2. Check if menu is open → block painting
    3. EventEditor drag → allow
    4. Panel drag → allow
    5. Terrain painting (lowest priority)

---

## Migration Guides

### SparseTerrain Migration
If you have custom terrain classes extending CustomTerrain:
- Add `getArrPos([x, y])` method for TerrainEditor compatibility
- Add `invalidateCache()` no-op if not using caching
- Add compatibility properties: `_tileSize`, `_gridSizeX`, `_gridSizeY`, `_chunkSize`

### EventEditorPanel Render Signature
If you're calling `EventEditorPanel.render()` directly:
```javascript
// Old (broken)
panel.render(contentArea.x, contentArea.y);

// New (correct)
panel.render(contentArea.x, contentArea.y, contentArea.width, contentArea.height);
```

---

## Notes

- This changelog tracks **unreleased changes only**
- Version sections are created manually during release process
- For detailed bug tracking, see `KNOWN_ISSUES.md`
- For feature requests and optimizations, see `FEATURE_REQUESTS.md`
- For development workflows, see `docs/checklists/`

