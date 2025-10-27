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

### Open ❌

- [ ] **Level Editor Material Palette: Material Names Truncated**
  - File: Material palette rendering (likely in `Classes/systems/ui/LevelEditor.js` or related UI component)
  - Issue: Material names are being truncated too early (e.g., "stone" appears as "ston")
  - Priority: LOW (cosmetic)
  - Expected: Full material names should be visible
  - Current: Names cut off prematurely
  - Tests Needed: Unit test for text rendering/truncation logic

---

## Statistics

- **Total Issues**: 4
- **Fixed**: 4
- **Open**: 0
- **High Priority Open**: 0
- **Missing Features**: 0
