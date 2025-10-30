# Level Editor Roadmap

## Overview

This roadmap tracks all features for the Level Editor system, from basic terrain editing to full multi-level game creation without code. Each feature is a high-level checklist that will spawn detailed implementation checklists using `FEATURE_ENHANCEMENT_CHECKLIST.md` or `FEATURE_DEVELOPMENT_CHECKLIST.md`.

**Target**: Complete visual level design system with multi-level support, event system integration, and zero-code level creation.

**Status Legend**:
- ✅ Complete (tested, documented)
- 🔄 In Progress (active development)
- ⏳ Planned (not started)

---

## Phase 1: Core Terrain Editing ✅

### 1.1 Terrain Editor Core ✅
**Status**: Complete
- [x] TerrainEditor class with paint/fill operations
- [x] Undo/redo history system
- [x] Grid coordinate conversion (screen ↔ world)
- [x] Terrain mutation tracking
- [x] Integration with SparseTerrain and gridTerrain

**Files**: `Classes/terrainUtils/TerrainEditor.js`
**Tests**: 26 integration tests passing

---

### 1.2 Material Palette ✅
**Status**: Complete (Enhancement Planned)
- [x] Visual material selection interface
- [x] Display available terrain materials (moss, stone, dirt, grass, sand, water)
- [x] Selected material highlighting
- [x] Click handling for material selection
- [x] Integration with TERRAIN_MATERIALS_RANGED

**Planned Enhancements**:
- [ ] Categorized material selection system
  - [ ] Organize materials by type (ground, stone, vegetation, water, etc.)
  - [ ] Expandable/collapsible category sections
  - [ ] Category tabs or accordion-style interface
  - [ ] Search/filter materials by name or category
  - [ ] Material preview with zoom capability

**Files**: `Classes/ui/MaterialPalette.js`
**Tests**: Unit + integration tests passing

---

### 1.3 Toolbar (Tools Panel) ✅
**Status**: Complete
- [x] Draggable panel container
- [x] Tool selection interface (paint, fill, eyedropper, select)
- [x] Visual tool highlighting
- [x] Tool activation/deactivation
- [x] Integration with TerrainEditor

**Tools Implemented**:
- [x] Paint Brush - Paint individual tiles with brush size
- [x] Fill Bucket - Flood fill connected regions
- [x] Eyedropper - Pick material from terrain
- [x] Select Tool - Region selection (basic)

**Tools Planned**:
- [x] Eraser Tool - Remove painted tiles (revert to default/empty) ✅ Complete
- [ ] Entity Painter - Place entities (ants, resources, buildings)
- [ ] Decor Painter - Place decorative elements (rocks, plants, etc.)
- [ ] No Tool (Default) - Disable all tools, allow only UI interaction

**Files**: `Classes/ui/ToolBar.js`
**Tests**: Unit + integration tests passing

---

### 1.4 Brush Size Control ✅
**Status**: Complete
- [x] Slider interface for brush size (1-5)
- [x] Visual size preview
- [x] Real-time brush size update
- [x] Integration with paint tool

**Files**: `Classes/ui/BrushSizeControl.js`
**Tests**: Unit tests passing

---

### 1.5 Grid Overlay ✅
**Status**: Complete (Performance Optimized)
- [x] DynamicGridOverlay with edge-only rendering
- [x] Toggle grid visibility (G key)
- [x] Performance optimization (50-200x faster than full grid)
- [x] Feathering system for smooth transitions
- [x] Integration with camera system

**Files**: `Classes/ui/DynamicGridOverlay.js`
**Tests**: Unit + integration tests passing (15/15)
**Performance**: O(visible tiles) instead of O(all tiles)

---

### 1.6 MiniMap ✅
**Status**: Complete (Performance Optimized)
- [x] Real-time terrain preview
- [x] Camera viewport indicator
- [x] Click-to-navigate functionality
- [x] Toggle minimap (M key)
- [x] Cache system for sparse terrain (99% performance improvement)
- [x] Integration with SparseTerrain

**Files**: `Classes/ui/MiniMap.js`
**Tests**: Integration tests passing
**Performance**: Cached rendering, only redraws on terrain change

---

### 1.7 Properties Panel ✅
**Status**: Complete
- [x] Display terrain metadata (size, tile count, etc.)
- [x] Real-time property updates
- [x] Visual panel rendering

**Files**: `Classes/ui/PropertiesPanel.js`
**Tests**: Unit tests passing

---

### 1.8 Notification System ✅
**Status**: Complete
- [x] Toast-style notifications
- [x] Auto-dismiss after timeout
- [x] Queue system for multiple notifications
- [x] Visual feedback for actions (save, load, paint, etc.)

**Files**: `Classes/ui/NotificationManager.js`
**Tests**: Unit tests passing

---

### 1.9 Eraser Tool ✅
**Status**: Complete (October 29, 2025)
- [x] Remove painted tiles (revert to empty/default)
- [x] Brush size support (erase multiple tiles - 1x1, 3x3, 5x5, etc.)
- [ ] Visual eraser cursor indicator (deferred - requires UI event wiring)
- [x] Undo/redo support for eraser operations
- [x] Integration with SparseTerrain (remove tiles from sparse storage using `deleteTile()`)
- [x] Toolbar button with eraser icon 

**Implementation**:
- Core erase functionality: TerrainEditor.erase(x, y, brushSize)
- SparseTerrain: Removes tiles using `deleteTile()` (tile becomes null)
- gridTerrain: Resets to default material using `setTile()`
- Undo/redo integration: Full history tracking with old materials
- ToolBar integration: Eraser added as 5th tool
- LevelEditor integration: Eraser added to toolbar config

**Tests**: 33 passing (19 unit + 14 integration) - 100% coverage for core functionality

**Files Modified**: 
- `Classes/terrainUtils/TerrainEditor.js` (added erase(), updated undo()/redo())
- `Classes/ui/ToolBar.js` (added eraser to default tools)
- `Classes/systems/ui/LevelEditor.js` (added eraser to toolbar config)

**Checklist**: `docs/checklists/active/ERASER_TOOL_CHECKLIST.md` (Phases 1-5 complete, UI event wiring deferred)

---

### 1.10 Tool Deactivation (No Tool Mode) ✅
**Status**: Complete (October 29, 2025)
- [x] "No Tool" mode as default state (no active tool)
- [x] Clicking terrain does nothing when no tool active
- [x] Visual indicator showing no tool selected
- [x] ESC key to deselect current tool
- [x] Only UI interactions allowed (panels, buttons, dialogs)
- [x] Prevent accidental terrain edits

**Implementation**:
- Default state: No tool selected on Level Editor open ✅
- Toolbar shows no highlighted tool ✅
- Mouse cursor normal (not paint/erase cursor) ✅
- Click terrain → Early return, no action ✅
- ESC key → Calls `toolbar.deselectTool()` ✅

**Files Modified**: 
- `Classes/ui/ToolBar.js` - Added `deselectTool()`, `hasActiveTool()`, default null
- `Classes/systems/ui/LevelEditor.js` - ESC handler, early return for null tool

**Tests**: 
- Unit: 23 passing ✅
- Integration: 16 passing ✅
- E2E: 6 passing with screenshots ✅
- **Total**: 45 tests passing

**Checklist**: `docs/checklists/active/TOOL_DEACTIVATION_NO_TOOL_MODE_CHECKLIST.md` (Phases 1-5 complete)

---

### 1.11 Entity Painter ⏳
**Status**: Planned
- [ ] Entity palette (ants, resources, buildings, spawners)
- [ ] Drag-and-drop entity placement on terrain
- [ ] Entity property editor (health, inventory, patrol path)
- [ ] Entity selection and manipulation (move, delete)
- [ ] Entity layering (render order)
- [ ] Entity collision preview (show collision boxes)

**Entity Types**:
- **Ants**: Worker, soldier, queen (different types)
- **Resources**: Food, wood, stone (resource nodes)
- **Buildings**: Colony, storage, defense structures
- **Spawners**: Enemy spawners, resource spawners
- **NPCs**: Quest givers, merchants (future)

**Requirements**:
- Entity Painter tool in toolbar
- Entity palette sidebar (categorized by type)
- Click terrain → Place selected entity at world coordinates
- Entity appears in game at exact position
- Entity saves with level JSON (entities array)
- Double-click entity → Open property editor

**Files**: 
- `Classes/ui/EntityPalette.js` (new)
- `Classes/ui/EntityPainter.js` (new)
- `Classes/systems/ui/LevelEditor.js` (integration)

**Tests**: Unit + integration + E2E tests

**Level JSON Schema**:
```json
{
  "entities": [
    {
      "id": "entity_001",
      "type": "ant_worker",
      "position": { "x": 100, "y": 100 },
      "properties": { "health": 100, "inventory": [] }
    }
  ]
}
```

---

### 1.12 Decor Painter ⏳
**Status**: Planned
- [ ] Decorative element palette (rocks, plants, flowers, debris)
- [ ] Drag-and-drop decor placement
- [ ] Multiple decor layers (ground, mid, top)
- [ ] Decor randomization (random rotation, scale variation)
- [ ] Decor clustering (place multiple at once)
- [ ] Decor removal (eraser mode for decor)

**Decor Categories**:
- **Ground**: Pebbles, patches, cracks, puddles
- **Vegetation**: Grass tufts, flowers, mushrooms, bushes
- **Rocks**: Small stones, large boulders, rock clusters
- **Foliage**: Leaves, branches, fallen logs
- **Ambiance**: Fireflies, butterflies, mist (animated)

**Requirements**:
- Decor Painter tool in toolbar
- Decor palette sidebar (categorized)
- Click terrain → Place decor at position
- Decor purely visual (no collision, no gameplay impact)
- Decor saves in level JSON (decor array)
- Random rotation/scale option (checkbox)

**Files**: 
- `Classes/ui/DecorPalette.js` (new)
- `Classes/ui/DecorPainter.js` (new)
- `Classes/systems/ui/LevelEditor.js` (integration)

**Tests**: Unit + integration + E2E tests

**Level JSON Schema**:
```json
{
  "decor": [
    {
      "id": "decor_001",
      "type": "rock_small",
      "position": { "x": 150, "y": 200 },
      "rotation": 45,
      "scale": 0.8,
      "layer": "ground"
    }
  ]
}
```

---

### 1.13 Categorized Material System ⏳
**Status**: Planned (Enhancement to 1.2)
- [ ] Material categories (Ground, Stone, Vegetation, Water, Special)
- [ ] Expandable category sections in palette
- [ ] Tab-based or accordion-style interface
- [ ] Material search/filter functionality
- [ ] Material preview on hover (zoom view)
- [ ] Recently used materials section
- [ ] Favorite materials system (star to save)

**Material Categories**:
```
Ground:
  - dirt, dirt_dark, dirt_light
  - sand, sand_dark, sand_light
  - mud, clay, gravel

Stone:
  - stone, stone_dark, stone_light
  - cobblestone, brick, marble
  - rock, boulder, pebbles

Vegetation:
  - grass, grass_tall, grass_dry
  - moss, moss_thick, lichen
  - leaves, foliage

Water:
  - water, water_deep, water_shallow
  - water_flowing, waterfall
  - ice, snow

Special:
  - lava, magma
  - crystal, gem
  - metal, gold
```

**UI Design**:
```
┌─────────────────────┐
│ Materials           │
├─────────────────────┤
│ Search: [______]    │
├─────────────────────┤
│ ▼ Ground (12)       │
│   [dirt] [sand]...  │
├─────────────────────┤
│ ▶ Stone (8)         │
├─────────────────────┤
│ ▶ Vegetation (10)   │
├─────────────────────┤
│ ▼ Recently Used     │
│   [moss] [stone]    │
└─────────────────────┘
```

**Files**: 
- `Classes/ui/MaterialPalette.js` (refactor)
- `Classes/ui/MaterialCategory.js` (new)
- `config/material-categories.json` (new config file)

**Tests**: Unit + integration tests

---

## Phase 2: File I/O & Persistence ✅

### 2.1 Terrain Export/Import ✅
**Status**: Complete (Bug Fixed)
- [x] TerrainExporter - Export to JSON (gridTerrain format)
- [x] TerrainImporter - Import from JSON (both formats)
- [x] SparseTerrain native export (sparse format)
- [x] Format detection (sparse vs grid)
- [x] Validation for both formats
- [x] Metadata preservation (tileSize, bounds, materials)
- [x] Bug fix: Empty tiles no longer export as default material
- [x] Bug fix: Import accepts SparseTerrain format

**Files**: 
- `Classes/terrainUtils/TerrainExporter.js`
- `Classes/terrainUtils/TerrainImporter.js`
- `Classes/systems/ui/LevelEditor.js` (uses native export)

**Tests**: 34 tests passing (25 unit + 9 integration)
**E2E**: 2 E2E tests with screenshot proof

---

### 2.2 LocalStorage Integration ✅
**Status**: Complete
- [x] Save levels to browser storage
- [x] Load levels from browser storage
- [x] Storage quota management (~5-10MB)
- [x] Level listing and selection
- [x] Error handling for storage failures

**Files**: `Classes/ui/LocalStorageManager.js`
**Tests**: Integration tests passing

---

### 2.3 Save/Load Dialogs ✅
**Status**: Complete
- [x] SaveDialog - Name level, confirm save
- [x] LoadDialog - Browse saved levels, select to load
- [x] ConfirmationDialog - Confirm destructive actions
- [x] Modal dialog system
- [x] Keyboard shortcuts (Ctrl+S, Ctrl+O)

**Files**: 
- `Classes/ui/SaveDialog.js`
- `Classes/ui/LoadDialog.js`
- `Classes/ui/ConfirmationDialog.js`

**Tests**: 103 unit tests passing

---

### 2.4 Auto-Save ✅
**Status**: Complete
- [x] Periodic auto-save (configurable interval)
- [x] Auto-save on state change
- [x] Recovery from unsaved changes
- [x] Visual indicator for auto-save status

**Files**: `Classes/ui/AutoSave.js`
**Tests**: Unit tests passing

---

### 2.5 Format Converter ✅
**Status**: Complete
- [x] Convert between SparseTerrain and gridTerrain formats
- [x] Bidirectional conversion
- [x] Data preservation during conversion
- [x] Validation before/after conversion

**Files**: `Classes/ui/FormatConverter.js`
**Tests**: Integration tests passing

---

## Phase 3: Event System Integration 🔄

**Known Issues**:
- 🐛 **HIGH**: View menu panel toggles cause panels to flash/disappear immediately
  - Affects: All panels (Materials, Tools, Events, Properties, Sidebar)
  - Root cause: `DraggablePanelManager.togglePanel()` doesn't update `stateVisibility` array
  - Workaround: Use toolbar buttons for Events panel
  - Fix: Update `togglePanel()` to maintain `stateVisibility` synchronization
  - Checklist: `docs/checklists/active/VIEW_MENU_PANEL_TOGGLE_BUG_CHECKLIST.md`

### 3.1 EventManager Integration ✅
**Status**: Complete (Phase 3A)
- [x] EventManager singleton with full API
- [x] Event types: dialogue, spawn, tutorial, boss
- [x] Trigger system: time, flag, spatial, conditional, viewport
- [x] Flag-based conditions and state tracking
- [x] JSON import/export for events
- [x] Integration with LevelEditor

**Files**: `Classes/managers/EventManager.js`
**Tests**: Full test coverage (unit + integration + E2E)
**Documentation**: `docs/api/EventManager_API_Reference.md`

---

### 3.2 EventEditorPanel (Sidebar) 🔄
**Status**: In Progress
- [x] LevelEditorSidebar base component (scrollable with menu bar)
- [x] ScrollableContentArea for content management
- [x] EventEditorPanel basic structure
- [x] Integration with LevelEditorPanels system
- [x] Integration with LevelEditor (mouse wheel, click delegation)
- [x] View menu integration (Ctrl+6 keyboard shortcut)
- [ ] Event template browser (scrollable list)
- [ ] Event creation dialog
- [ ] Event property editor
- [ ] Drag-to-place event flags on terrain
- [ ] Event flag visualization on map

**Files**: 
- `Classes/ui/LevelEditorSidebar.js` ✅
- `Classes/ui/ScrollableContentArea.js` ✅
- `Classes/ui/EventEditorPanel.js` 🔄
- `Classes/systems/ui/LevelEditor.js` ✅ (sidebar wiring)
- `Classes/ui/FileMenuBar.js` ✅ (View menu)

**Tests**: 127 tests passing (57 unit + 30 integration + 20 LevelEditorPanels + 20 LevelEditor)
**Next**: Fix View menu panel toggle bug, then Event flag placement system

---

### 3.3 Event Flag Placement ⏳
**Status**: Planned
- [ ] Click-and-drag event flags from sidebar to terrain
- [ ] Visual flag indicator on terrain (above terrain, below UI)
- [ ] Flag positioning system (world coordinates)
- [ ] Flag collision detection (prevent overlap)
- [ ] Flag selection and editing
- [ ] Flag deletion
- [ ] Flag metadata display (hover tooltips)

**Requirements**:
- Mouse down in EventEditorPanel → attach flag to cursor
- Mouse move → show flag preview at cursor position
- Mouse up on terrain → place flag at world coordinates
- Visual: Flag sprite/icon above terrain layer, below UI layer
- Click existing flag → open property editor

---

### 3.4 Event Property Editor ⏳
**Status**: Planned
- [ ] Click placed flag → open property dialog
- [ ] Edit trigger conditions (spatial radius, flags, viewport)
- [ ] Edit event actions (dialogue, spawn, level transition, etc.)
- [ ] Visual trigger radius indicator on map
- [ ] Save changes to event configuration
- [ ] Delete event option

**Requirements**:
- Modal dialog or sidebar panel for editing
- Visual radius circle on terrain showing trigger area
- Real-time preview of trigger conditions
- Validation before saving

---

### 3.5 Event Templates Library ⏳
**Status**: Planned
- [ ] Predefined event templates (dialogue, spawn, boss, transition)
- [ ] Template browser in EventEditorPanel
- [ ] Template selection and instantiation
- [ ] Template customization workflow
- [ ] Save custom templates

**Templates**:
- Dialogue Event: Trigger dialogue on spatial enter
- Spawn Event: Spawn entities at location
- Tutorial Event: Show tutorial messages
- Boss Event: Trigger boss encounter
- **Level Transition Event**: Load new level (see Phase 4)

---

## Phase 4: Multi-Level System ⏳

### 4.1 Level Metadata System ⏳
**Status**: Planned
- [ ] Level JSON schema (name, description, terrain, events, spawn points)
- [ ] LevelMetadata class for metadata management
- [ ] Level ID system (unique identifiers)
- [ ] Level dependency tracking (which levels link to which)
- [ ] Level validation (ensure all references valid)

**Level JSON Format**:
```json
{
  "id": "level_001",
  "name": "Starting Forest",
  "description": "Tutorial level",
  "terrain": { ... },
  "events": [ ... ],
  "spawnPoints": [
    { "id": "default", "x": 100, "y": 100 },
    { "id": "from_level_002", "x": 500, "y": 300 }
  ],
  "minimap": "data:image/png;base64,..."
}
```

---

### 4.2 Level Transition Event Template ⏳
**Status**: Planned
- [ ] New event type: `levelTransition`
- [ ] Level selection dialog (browse available levels)
- [ ] Target level preview (name, minimap snapshot, event count)
- [ ] Spawn point selection (click on minimap to set entry point)
- [ ] Entity transfer options (take nearby ants? yes/no)
- [ ] Validation (must select spawn point before proceeding)

**User Workflow**:
1. Drag "Level Transition" template from EventEditorPanel to terrain
2. Click to place transition flag
3. Dialog opens: "Select Target Level"
   - Scrollable list of available levels (using ScrollableContentArea)
   - Each entry shows: Level name, minimap thumbnail, event count
4. User clicks level entry → Load level metadata
5. Dialog updates: Show larger minimap snapshot
6. User clicks on minimap → Set spawn point coordinates
7. Checkbox: "Transfer nearby entities?"
8. Button: "Create Transition" (disabled until spawn point set)
9. Click Create → Attach transition data to flag, close dialog

**Event Configuration**:
```json
{
  "type": "levelTransition",
  "targetLevel": "level_002",
  "spawnPoint": { "x": 500, "y": 300 },
  "transferEntities": true,
  "transferRadius": 200
}
```

---

### 4.3 IN_GAME State (Level Playback) ⏳
**Status**: Planned
- [ ] New game state: `IN_GAME` (distinct from `PLAYING`)
- [ ] Load discrete level from JSON
- [ ] Spawn player entities at designated spawn point
- [ ] Activate level events (spatial triggers, dialogue, etc.)
- [ ] Handle level transitions (trigger → load next level → spawn)
- [ ] Entity transfer system (preserve nearby ants)
- [ ] Level exit system (return to menu, restart, etc.)

**Differences from PLAYING state**:
- `PLAYING`: Sandbox mode, infinite terrain, no win condition
- `IN_GAME`: Discrete levels, defined boundaries, event-driven progression

**Requirements**:
- LevelManager class to handle level loading/unloading
- Entity persistence during transitions
- Camera constraints (no scrolling outside level bounds)
- Win condition system (optional, per level)

---

### 4.4 Scrollable Level Browser ⏳
**Status**: Planned (Reusable Component)
- [ ] ScrollableLevelBrowser class (extends ScrollableContentArea)
- [ ] Display level list with thumbnails
- [ ] Click to select level
- [ ] Callback system for level selection
- [ ] Integration with Level Transition Event dialog

**Reuse Pattern**:
- Used in: Level Transition Event dialog
- Used in: Level select screen (future)
- Used in: Level Editor load dialog (enhance existing)

---

### 4.5 Spawn Point Editor ⏳
**Status**: Planned
- [ ] Visual spawn point placement on minimap
- [ ] Multiple spawn points per level (named IDs)
- [ ] Default spawn point designation
- [ ] Spawn point visualization in Level Editor
- [ ] Spawn point testing (preview spawn location)

**Spawn Point Types**:
- `default`: Main entry point for level
- `from_[levelId]`: Entry point when coming from specific level
- `checkpoint_[n]`: Mid-level respawn points (future)

---

### 4.6 Entity Transfer System ⏳
**Status**: Planned
- [ ] Query nearby entities within radius of transition flag
- [ ] Serialize entity state (position, health, inventory, etc.)
- [ ] Transfer entity data to next level
- [ ] Deserialize and spawn entities at new spawn point
- [ ] Maintain entity IDs across transitions

**Transfer Options**:
- Transfer all nearby entities (radius-based)
- Transfer only player-controlled entities
- Transfer specific entity types (ants, not resources)

---

## Phase 5: Advanced Features ⏳

### 5.1 Scrollable Dialog Box (Reusable) ⏳
**Status**: Planned (High Priority)
- [ ] ScrollableDialog class (modal + scrollable content)
- [ ] Header with title and close button
- [ ] ScrollableContentArea for body content
- [ ] Footer with action buttons (OK, Cancel, etc.)
- [ ] Draggable modal positioning
- [ ] Resize support (optional)

**Used By**:
- Level Transition Event dialog
- Event Property Editor dialog
- Confirmation dialogs with long text
- Tutorial/help dialogs

---

### 5.2 Level Validation System ⏳
**Status**: Planned
- [ ] Validate all event references (no broken level IDs)
- [ ] Validate spawn points (no out-of-bounds)
- [ ] Validate transition targets (target levels exist)
- [ ] Validation report (list issues with locations)
- [ ] Auto-fix suggestions (fix common issues)

---

### 5.3 Level Testing Mode ⏳
**Status**: Planned
- [ ] "Test Level" button in Level Editor
- [ ] Quick transition to IN_GAME state with current level
- [ ] Spawn at default spawn point
- [ ] Full event system activation
- [ ] Quick return to editor (ESC or button)
- [ ] Preserve editor state during testing

**Workflow**:
1. User edits level in Level Editor
2. Click "Test Level" button
3. Game transitions to IN_GAME state
4. Level loads with all events active
5. User plays level to test functionality
6. Press ESC → Return to Level Editor at same view

---

### 5.4 Multi-Level Project System ⏳
**Status**: Planned
- [ ] Project JSON format (list of levels + metadata)
- [ ] Project save/load (entire game campaign)
- [ ] Level dependency graph visualization
- [ ] Project-wide validation
- [ ] Export entire project to single file
- [ ] Import project from file

**Project Format**:
```json
{
  "name": "My Game Campaign",
  "version": "1.0",
  "startLevel": "level_001",
  "levels": [
    { "id": "level_001", "file": "levels/level_001.json" },
    { "id": "level_002", "file": "levels/level_002.json" }
  ],
  "dependencies": {
    "level_001": ["level_002"],
    "level_002": ["level_003"]
  }
}
```

---

### 5.5 Visual Event Graph ⏳
**Status**: Planned (Low Priority)
- [ ] Node-based event editor (alternative to list)
- [ ] Visual connections between events (triggers → actions)
- [ ] Drag-and-drop event node creation
- [ ] Event flow visualization
- [ ] Zoom/pan graph view

**Similar to**: Unreal Engine Blueprints, Unity Visual Scripting

---

### 5.6 Copy/Paste Terrain Sections ⏳
**Status**: Planned
- [ ] Select region with Select Tool
- [ ] Copy selected region to clipboard (Ctrl+C)
- [ ] Paste at cursor position (Ctrl+V)
- [ ] Visual paste preview
- [ ] Rotation/flip options (R, F keys)

---

### 5.7 Terrain Layers ⏳
**Status**: Planned
- [ ] Multiple terrain layers (base, decoration, overlay)
- [ ] Layer visibility toggles
- [ ] Layer opacity control
- [ ] Paint on specific layer
- [ ] Merge layers operation

---

### 5.8 Entity Placement in Editor ⏳
**Status**: Planned
- [ ] Entity palette (ants, resources, buildings)
- [ ] Drag-and-drop entity placement
- [ ] Entity property editor
- [ ] Entity spawner zones
- [ ] Entity patrol paths

---

### 5.9 Server Integration (Cloud Save) ⏳
**Status**: Planned
- [ ] ServerIntegration class (already exists, needs backend)
- [ ] Cloud save/load levels
- [ ] Level sharing (publish to community)
- [ ] Community level browser
- [ ] Version control for levels
- [ ] Collaborative editing (future)

---

## Phase 6: Polish & Quality of Life ⏳

### 6.1 Keyboard Shortcuts Expansion ⏳
**Status**: Planned
- [ ] Shortcut reference overlay (? key)
- [ ] Customizable keyboard shortcuts
- [ ] Tool hotkeys (1-4 for tools)
- [ ] Quick material selection (Q, E to cycle)
- [ ] Quick brush size ([ ] keys)

---

### 6.2 UI Themes ⏳
**Status**: Planned
- [ ] Light/dark theme toggle
- [ ] Custom color schemes
- [ ] High contrast mode (accessibility)
- [ ] Theme persistence (save preference)

---

### 6.3 Undo/Redo Visualization ⏳
**Status**: Planned
- [ ] History panel showing undo/redo stack
- [ ] Visual preview of each history state
- [ ] Jump to specific history state
- [ ] History branching (undo, edit, creates new branch)

---

### 6.4 Performance Profiler ⏳
**Status**: Planned
- [ ] FPS counter overlay
- [ ] Render time breakdown
- [ ] Memory usage display
- [ ] Bottleneck identification
- [ ] Performance suggestions

---

### 6.5 Tutorial System ⏳
**Status**: Planned
- [ ] First-time user tutorial
- [ ] Interactive tool tips
- [ ] Step-by-step level creation guide
- [ ] Video tutorials (external links)

---

## Acceptance Criteria Summary

### Completed ✅
- [x] User can paint terrain with brush (size 1-99)
- [x] User can fill regions with flood fill
- [x] User can pick materials with eyedropper
- [x] User can select regions (basic)
- [x] User can undo/redo edits (Ctrl+Z, Ctrl+Y)
- [x] User can save levels to browser storage (Ctrl+S)
- [x] User can load levels from browser storage (Ctrl+O)
- [x] User can toggle grid overlay (G key)
- [x] User can toggle minimap (M key)
- [x] User can navigate via minimap clicks
- [x] User can export levels to JSON
- [x] User can import levels from JSON (both formats)
- [x] User sees real-time notifications for actions
- [x] User sees terrain properties in panel
- [x] User experiences auto-save (no data loss)
- [x] Empty tiles export correctly (not as default material)
- [x] SparseTerrain JSON imports without errors

### In Progress 🔄
- [ ] User can browse event templates in sidebar
- [ ] User can create events from templates
- [ ] User can drag event flags to terrain
- [ ] User can edit event properties (click flag)
- [ ] User can see visual trigger radius on map

### Planned - Phase 1 Enhancements ⏳
- [ ] User can erase painted tiles (revert to empty/default)
- [ ] User can deselect all tools (No Tool mode as default)
- [ ] User can press ESC to deactivate current tool
- [ ] User can place entities (ants, resources, buildings) on terrain
- [ ] User can edit entity properties (double-click entity)
- [ ] User can place decorative elements (rocks, plants, flowers)
- [ ] User can browse materials by category (Ground, Stone, Vegetation, etc.)
- [ ] User can search/filter materials by name
- [ ] User can access recently used materials
- [ ] User can favorite materials for quick access

### Planned - Multi-Level System ⏳
- [ ] User can create level transition events without code
- [ ] User can select target level from scrollable list
- [ ] User can click minimap to set spawn point
- [ ] User can test level in IN_GAME state
- [ ] User can play through multiple connected levels
- [ ] User can transfer entities between levels
- [ ] User can validate entire level project
- [ ] User can export multi-level project to single file
- [ ] User can share levels with community (cloud)

---

## Development Process

Each feature follows TDD methodology:
1. **Planning** - Review this roadmap, select feature
2. **Checklist** - Create detailed checklist from `FEATURE_ENHANCEMENT_CHECKLIST.md` or `FEATURE_DEVELOPMENT_CHECKLIST.md`
3. **Unit Tests** - Write failing tests FIRST
4. **Implementation** - Write minimal code to pass tests
5. **Integration Tests** - Test component interactions
6. **E2E Tests** - Visual verification with screenshots
7. **Documentation** - Update docs, CHANGELOG.md
8. **Commit** - Descriptive commit with test results

---

## Priority Queue

**Immediate Phase 1 Enhancements** (Quick Wins):
1. **Tool Deactivation (No Tool Mode)** - Default state, prevents accidental edits
2. **Eraser Tool** - Essential for terrain editing workflow
3. **Categorized Material System** - Better UX for material selection

**Next 3 Features** (User Priority):
1. Event Flag Placement System (complete event workflow)
2. Entity Painter (place ants, resources, buildings)
3. Decor Painter (visual polish, ambiance)

**Next 3 Features** (Multi-Level Foundation):
1. Level Metadata System (foundation for multi-level)
2. Scrollable Dialog Box (reusable for many features)
3. Level Transition Event Template (enable multi-level)

**Next 3 Features** (Technical Debt):
1. IN_GAME State Implementation (level playback)
2. Level Validation System (prevent broken levels)
3. Entity/Decor Save/Load System (persist placed objects)

---

## Notes

- **Zero-Code Goal**: User should never need to write code to create levels
- **Visual-First**: All operations via drag-and-drop, dialogs, and clicks
- **Reusable Components**: ScrollableContentArea, ScrollableDialog used everywhere
- **TDD Always**: No code without tests first
- **Performance**: Cache, optimize, profile all systems
- **Documentation**: Every feature gets usage guide

---

## Related Documentation

- `docs/LEVEL_EDITOR_SETUP.md` - Current setup guide
- `docs/api/EventManager_API_Reference.md` - Event system API
- `docs/checklists/templates/FEATURE_ENHANCEMENT_CHECKLIST.md` - Small feature template
- `docs/checklists/templates/FEATURE_DEVELOPMENT_CHECKLIST.md` - Large feature template
- `docs/roadmaps/RANDOM_EVENTS_ROADMAP.md` - EventManager implementation reference
- `CHANGELOG.md` - Track all changes
