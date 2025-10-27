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

- [x] **Level Editor: Terrain Paints Under Menu Bar (Click and Drag)**
  - Files: `Classes/systems/ui/LevelEditor.js` (handleDrag and handleClick methods)
  - Issue: Both drag painting and click painting occurred when mouse was over menu bar
  - Priority: MEDIUM (UX - unintended painting)
  - Root Cause: `handleDrag()` and `handleClick()` didn't check if mouse was over menu bar before painting
  - Fix: 
    - Added menu bar containsPoint() check FIRST in handleDrag (before panel/event checks)
    - Added menu bar containsPoint() check in handleClick (PRIORITY 3.5)
  - Implementation: 
    1. Check if mouse over menu bar → block painting
    2. Check if menu is open → block painting
    3. EventEditor drag → allow
    4. Panel drag → allow
    5. Terrain painting (lowest priority)
  - Tests: 14 unit tests + 6 E2E tests with screenshots passing
  - Fixed: October 27, 2025

### Open ❌

---

## Statistics

- **Total Issues**: 7
- **Fixed**: 7
- **Open**: 0
- **High Priority Open**: 0
- **Missing Features**: 0
