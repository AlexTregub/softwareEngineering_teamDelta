# Changelog

All notable changes to the Ant Colony Simulation Game will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- **Event Placement Mode** (Level Editor Enhancement)
  - **Double-click drag button** in Events panel to enter "sticky" placement mode
  - **Flag cursor (🚩)** appears next to mouse with trigger radius preview circle
  - **Single-click placement** - no need to hold mouse button
  - **ESC key cancellation** - exits placement mode instantly
  - Full event wiring: `doubleClicked()` → LevelEditor → LevelEditorPanels → EventEditorPanel
  - Comprehensive E2E test covering complete user workflow (5 steps)
  - 27 unit tests + 17 integration tests + 5 E2E tests (all passing)
- **Fill Tool Bounds Limit** (Bug Fix - Post-Launch Issue)
  - Fill tool now limited to 100x100 tile area per operation (10,000 tiles maximum)
  - Prevents performance issues when filling large sparse regions
  - Returns operation metadata including tiles filled and whether limit was reached
  - Supports SparseTerrain's dynamic bounds (including negative coordinates)
- **Custom Canvas Sizes** (Enhancement - Post-Launch Issue)
  - **Changed default canvas size from 1000x1000 to 100x100 tiles** for better performance
  - Terrains can now be created with custom sizes: `new SparseTerrain(32, 'grass', { maxMapSize: 250 })`
  - Size validation: minimum 10x10, maximum 1000x1000 (automatically clamped)
  - Canvas size persisted in saved terrain files
  - Level Editor now starts with smaller, faster 100x100 canvas by default
- EventManager system for random game events (dialogue, spawn, tutorial, boss)
- Event trigger system (time-based, flag-based, spatial, conditional, viewport)
- EventEditorPanel for Level Editor (create/edit/test events)
- JSON import/export for events in Level Editor
- **SparseTerrain class** for lazy terrain loading (Phase 1B complete)
  - Map-based sparse tile storage (`Map<"x,y", { material }>`)
  - Supports painting at any coordinate (positive/negative) within 1000x1000 limit
  - **1000x1000 tile hard limit** to prevent memory leaks (8 dedicated tests)
  - Dynamic bounds tracking (auto-expands/shrinks with operations)
  - Sparse JSON export (only painted tiles, massive space savings)
  - 48 unit tests + 18 integration tests covering all functionality
  - Foundation for infinite canvas terrain system
- **DynamicGridOverlay class** for lazy terrain grid rendering (Phase 2B complete)
  - Grid appears only at painted tiles + 2-tile buffer
  - Opacity feathering: 1.0 at painted tiles, fades to 0.0 at buffer edge
  - Shows grid at mouse hover when no tiles painted
  - **Memoization caching** for feathering and nearest-tile calculations (6 new tests)
  - **75% performance improvement** with caching (73s → 18.5s for 100 scattered tiles)
  - Grid generation optimization: skips lines far from painted tiles
  - Viewport culling for performance (only renders visible lines)
  - Efficient nearest-tile search using sparse storage
  - 27 unit tests covering all functionality (21 original + 6 caching)
- **DynamicMinimap class** for lazy terrain minimap (Phase 3B complete)
  - Viewport calculated from painted terrain bounds + padding (not fixed 50x50)
  - Auto-scaling to fit viewport in minimap dimensions
  - World-to-minimap coordinate conversion
  - Renders painted tiles with material colors
  - Camera viewport outline overlay (yellow)
  - Handles empty terrain, single tile, negative coords, 1000x1000 bounds
  - 26 unit tests covering all functionality
- **Infinite Canvas Integration** (Phase 4 complete)
  - All three systems (SparseTerrain, DynamicGridOverlay, DynamicMinimap) work together
  - 18 integration tests covering paint workflows, bounds sync, JSON persistence
  - Performance testing with scattered tiles (100 tiles in 500x500 area)
  - Memory efficiency: 100 tiles vs 250,000 in dense grid
- **SparseTerrain Compatibility Layer** (Level Editor Integration)
  - Added `getArrPos([x, y])` interface for TerrainEditor compatibility
  - Added `invalidateCache()` no-op method
  - Added compatibility properties: `_tileSize`, `_gridSizeX`, `_gridSizeY`, `_chunkSize`
  - 26 compatibility unit tests ensuring seamless TerrainEditor integration
  - 20 Level Editor integration tests (paint, fill, undo/redo, JSON)
- **Level Editor now uses SparseTerrain by default**
  - Replaced CustomTerrain with SparseTerrain in `LevelEditor.js`
  - New terrains start with **black canvas** (zero tiles)
  - Can paint anywhere within 1000x1000 bounds
  - Supports negative coordinates
  - Sparse JSON saves (only painted tiles exported)
  - All existing TerrainEditor features work: paint, fill, undo/redo, eyedropper
  - Added `render()` method to SparseTerrain for Level Editor compatibility
- **E2E Tests with Screenshots** (Phase 6 complete)
  - `pw_sparse_terrain_black_canvas.js` - Verifies Level Editor starts with 0 tiles ✅
  - `pw_sparse_terrain_paint_anywhere.js` - Tests painting at scattered/negative coords ✅
  - `pw_sparse_terrain_json_export.js` - Verifies sparse JSON export (100% savings) ✅
  - All screenshots captured: `test/e2e/screenshots/levelEditor/success/`

### Fixed
- **Event Placement Mode Double-Click Bug** (Critical Bug Fix)
  - User reported: "I can't click and drag or double click and place"
  - Root cause: Missing double-click event wiring - `handleDoubleClick()` was never called
  - Fixed: Added `doubleClicked()` p5.js handler + routing through LevelEditor → LevelEditorPanels → EventEditorPanel
  - Comprehensive workflow E2E test now passes (5 steps: open editor → click Events → drag → double-click)
  - All functionality confirmed working: click-and-drag ✅, double-click placement ✅
- **Bug Fix 5**: Terrain no longer paints underneath menu bar during drag/click operations
  - Root cause: `handleDrag()` and `handleClick()` didn't check menu bar position
  - Solution: Added containsPoint() check before terrain interaction
  - Tests: 14 unit tests + 6 E2E tests with screenshots
- **Bug Fix 6**: Terrain no longer paints underneath save/load dialogs
  - Root cause: `handleClick()` only blocked if dialog consumed click; `handleDrag()` never checked
  - Solution: Block ALL terrain interaction when either dialog is visible
  - Tests: 12 unit tests
- **Bug Fix 7**: View menu panel toggles now work correctly
  - Root cause: Used wrong panel IDs and accessed wrong manager object
  - Solution: Use global `draggablePanelManager` with correct full panel IDs
  - Tests: 9 unit tests

### Changed
- Level Editor brush size now controlled via menu bar inline controls (+/- buttons)
- Brush Size draggable panel hidden by default (redundant with menu bar controls)
- Properties panel hidden by default in Level Editor (toggle via View menu)
- Events panel hidden by default in Level Editor (toggle via Tools panel)

---

## [0.3.0] - 2025-10-27

### Added - Level Editor Enhancements

#### Feature 1: Brush Size Menu Bar Module
- Inline brush size controls (+/- buttons) in menu bar
- Shows/hides based on active tool (visible for paint tool only)
- Replaces separate draggable brush panel
- Tests: 10 unit tests + 3 E2E tests with screenshots

#### Feature 2: Shift + Mouse Wheel for Brush Size
- Shift + scroll up/down adjusts brush size (1-9)
- Works only when paint tool is active
- Updates both menu display and terrain editor
- Normal scroll (without Shift) continues to zoom camera
- Tests: 9 unit tests + 18 integration tests + 3 E2E tests

#### Feature 3: File → New Clears Terrain
- Creates blank terrain with confirmation prompt if unsaved changes
- Resets filename to "Untitled"
- Clears undo/redo history
- Default terrain size: 50×50
- Tests: 8 unit tests + 17 integration tests + 3 E2E tests

#### Feature 4: Save/Export Workflow Redesign
- File → Save: Prompts for filename (no file download)
- File → Export: Downloads JSON file (prompts for name if not set)
- Filename stored without .json extension internally
- Filename display in editor (top-center)
- Tests: 10 unit tests + 25 integration tests

#### Feature 5: Menu Open Blocks Terrain Editing
- Opening menu dropdown disables terrain interaction
- Menu bar remains clickable while dropdown open
- Clicking canvas closes menu (click consumed, no painting)
- Hover preview disabled when menu open
- Tests: 19 unit tests + 4 E2E tests with screenshots

#### Feature 6: Filename Display
- Current filename shown at top-center of Level Editor
- Default: "Untitled"
- Updates after Save/Load operations
- Extension (.json) automatically stripped from display
- Tests: 10 unit tests + 14 integration tests + 3 E2E tests

#### Feature 7: Properties Panel Disabled by Default
- Properties panel hidden on Level Editor startup
- Toggle via View → Properties Panel (Ctrl+5)
- Reduces UI clutter for new users
- Tests: 7 unit tests + 11 integration tests + 3 E2E tests

#### Feature 8: Events Panel → Tools Panel Toggle
- Events panel hidden by default
- Toggle button in Tools panel (not View menu)
- Contextual placement for event editing workflow
- Tests: 9 unit tests + 14 integration tests + 3 E2E tests

#### Enhancement 9: Hide Brush Panel by Default
- Brush Size draggable panel hidden by default
- Removed "Brush Panel" toggle from View menu
- Brush size controlled exclusively via menu bar inline controls
- Other panels (Materials, Tools) remain visible
- Tests: 5 unit tests + 4 E2E tests with screenshots

### Fixed

#### Bug Fix 1: Feature 1 Redesign
- Changed from dropdown to inline +/- buttons
- Fixed visibility logic based on active tool
- Tests: All Feature 1 tests updated and passing

#### Bug Fix 2: Shift+Scroll Working Correctly
- Fixed brush size adjustment with Shift modifier
- Ensured normal scroll continues to zoom
- Tests: 9 unit tests + 18 integration tests passing

#### Bug Fix 3: Menu Bar Hover Blocks Terrain Interaction
- Hover preview now disabled when mouse over menu bar
- Prevents unintended terrain highlighting over UI
- Tests: 9 unit tests + 4 E2E tests with screenshots

#### Bug Fix 4: Menu Dropdown Blocks All Input
- **Issue**: Opening menu dropdown froze entire UI
- **Root Cause**: Click handling checked menu open state FIRST, blocking all clicks
- **Fix**: Reordered click priority - menu bar checked FIRST, then block terrain if menu open
- **Result**: Menu bar remains clickable, can switch menus, canvas click closes menu
- Tests: 19 unit tests + 4 E2E tests with screenshots

#### Bug Fix 5: Terrain Paints Under Menu Bar (Click and Drag)
- **Issue**: Both click and drag painting occurred when mouse over menu bar
- **Root Cause**: `handleDrag()` and `handleClick()` didn't check menu bar position
- **Fix**: Added `containsPoint()` check in both methods before terrain painting
- **Implementation**:
  1. Check if mouse over menu bar → block painting
  2. Check if menu is open → block painting  
  3. EventEditor drag → allow
  4. Panel drag → allow
  5. Terrain painting (lowest priority)
- Tests: 14 unit tests + 6 E2E tests with screenshots

### Changed
- Level Editor click handling priority reordered for better UX
- Improved test coverage with comprehensive UI mocks in `test/helpers/uiTestHelpers.js`

---

## [0.2.0] - 2025-10-XX

### Added
- Level Editor with terrain painting, fill tool, eyedropper, select tool
- TerrainEditor with undo/redo support
- MaterialPalette for material selection
- ToolBar for tool selection
- MiniMap with performance-optimized caching
- FileMenuBar with Save/Load dialogs
- DraggablePanelManager for Level Editor UI panels
- TerrainImporter and TerrainExporter for JSON persistence

### Fixed
- **DraggablePanel: Boundary Detection Bug**
  - Off-by-one errors in `isPointInBounds()` method
  - Tests: 15 passing unit tests

- **GridTerrain & CustomTerrain: imageMode Mismatch**
  - 0.5-tile visual offset in grid/terrain alignment
  - Tests: 7 unit + 28 integration + 2 E2E tests passing

- **Grid Coordinate System: Y-Axis Span Boundary Check Bug**
  - `get()` method incorrectly rejected valid Y-coordinate queries
  - Workaround: Use `MapManager.getTileAtGridCoords()` instead
  - Priority: HIGH

- **Level Editor: Select Tool & Hover Preview**
  - Rectangle selection with click-drag
  - Paint all tiles under selection
  - Hover highlights affected tiles
  - Tests: 19 unit + 13 integration + 4 E2E tests passing

- **Level Editor: Material Names Truncated**
  - Material names truncated to 4 characters (e.g., "ston" instead of "stone")
  - Removed `.substring(0, 4)` truncation
  - Tests: 10 unit tests passing

- **Level Editor: Paint Tool Offset When Zoomed**
  - **Issue**: Painted tiles appeared offset from cursor when zoomed
  - **Root Cause**: Transform order was `translate(-camera); scale(zoom)` causing translation to be scaled
  - **Fix**: Changed to `scale(zoom); translate(-camera)` so translation is not scaled
  - Mathematical explanation: Wrong order created effective translation of `(-cameraX * zoom)` instead of `(-cameraX)`
  - Tests: 9 integration tests + 3 E2E tests with screenshots

---

## [0.1.0] - 2025-09-XX

### Added
- Core game engine with p5.js
- Ant entity system with state machine
- Basic terrain generation with Perlin noise
- Pathfinding system (A* algorithm)
- Resource collection mechanics
- Camera system with pan and zoom
- Spatial grid optimization for entity queries
- Entity-Controller architecture pattern
- Basic UI panels and debug overlays

### Infrastructure
- Test-Driven Development (TDD) methodology
- Unit test framework (Mocha/Chai)
- Integration test suite
- E2E test suite (Puppeteer) with screenshot verification
- BDD test suite (Python Behave)
- GitHub Copilot development guidelines

---

## Legend

### Types of Changes
- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Vulnerability fixes

### Priority Levels
- **HIGH**: Blocks core functionality
- **MEDIUM**: Impacts user experience
- **LOW**: Minor issues or cosmetic

---

## Testing Summary

### Current Test Coverage
- **Unit Tests**: 862+ tests
- **Integration Tests**: 164+ tests
- **E2E Tests**: 50+ scenarios with screenshot verification
- **BDD Tests**: Python Behave (headless)

### Test-Driven Development
All features and bug fixes follow strict TDD:
1. Write failing tests FIRST
2. Implement minimal code to pass
3. Run tests (confirm pass)
4. Refactor while keeping tests green
5. Write E2E tests with visual proof (screenshots)

---

## Contributors

David Willman
- Level Editor development and testing
- Bug fixes and enhancements
- Test infrastructure and coverage
- Documentation and changelogs

---

## Notes

This changelog tracks all changes from version 0.1.0 onwards. For detailed bug tracking, see `test/KNOWN_ISSUES.md`. For development checklists, see `docs/checklists/`.

**Current Status**: 7 total issues tracked, 7 fixed, 0 open
