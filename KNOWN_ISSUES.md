# Known Issues - Checklist

Track bugs and their status with test coverage.

---

## Issues Status

### Fixed ✅

- [x] **DraggablePanel: Boundary Detection Bug**
  - File: `Classes/systems/ui/DraggablePanel.js`
  - Issue: Off-by-one errors in `isPointInBounds()` method
  - Tests: 15 passing unit tests

- [x] **GridTerrain & CustomTerrain: imageMode Mismatch (0.5-Tile Offset)**
  - Files: `Classes/terrainUtils/gridTerrain.js`, `Classes/terrainUtils/CustomTerrain.js`
  - Issue: Grid/terrain visual misalignment in main game and Level Editor
  - Tests: 7 unit + 28 integration + 2 E2E tests passing

- [x] **Grid Coordinate System: Y-Axis Span Boundary Check Bug**
  - File: `Classes/terrainUtils/grid.js` (line ~185)
  - Issue: `get()` method incorrectly rejects valid Y-coordinate queries
  - Priority: HIGH
  - Workaround: Use `MapManager.getTileAtGridCoords()` instead of `Grid.get()`
  - Tests Needed: Unit + integration tests for inverted Y-axis spans

- [x] **Level Editor: Select Tool & Hover Preview**
  - Files: `Classes/ui/SelectionManager.js`, `Classes/ui/HoverPreviewManager.js`, `Classes/systems/ui/LevelEditor.js`
  - Feature: Select tool for rectangle selection + hover preview for all tools
  - Implemented: Click-drag rectangle selection, paint all tiles under selection, hover highlights affected tiles
  - Tests: 19 unit + 13 integration + 4 E2E tests passing

- [x] **Level Editor: Menu Bar Interaction Blocks All Input**
  - Files: `Classes/ui/FileMenuBar.js`, `Classes/systems/ui/LevelEditor.js`
  - Issue: Opening any menu dropdown blocked ALL input including menu bar itself
  - Fix: Reordered click handling priority - menu bar checked FIRST, then block terrain if menu open
  - Result: Menu bar remains clickable, can switch menus, canvas click closes menu
  - Tests: 10 FileMenuBar unit + 9 LevelEditor unit + 4 E2E with screenshots (all passing)

### Open ❌

- [ ] **Level Editor: Terrain Paints Under Menu Bar on Hover**
  - File: `Classes/systems/ui/LevelEditor.js`
  - Issue: While hover highlight is correctly disabled over menu bar, terrain still paints when hovering over menu bar
  - Expected Behavior: Menu bar should block ALL terrain interaction (painting and highlighting)
  - Current Behavior: Highlight disabled ✅, but painting still occurs ❌
  - Priority: MEDIUM
  - Fix Needed: Add menu bar check in handleMouseMove() to block drag painting over menu bar
  - Tests Needed: Unit + E2E tests for drag painting over menu bar

---

## Statistics

- **Total Issues**: 6
- **Fixed**: 5
- **Open**: 1
- **High Priority Open**: 0
- **Missing Features**: 0
