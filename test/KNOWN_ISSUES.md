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

- [x] **Level Editor Material Palette: Material Names Truncated**
  - File: `Classes/ui/MaterialPalette.js` (line 285)
  - Issue: Material names were truncated to 4 characters (e.g., "stone" appeared as "ston")
  - Priority: LOW (cosmetic)
  - Fix: Removed `.substring(0, 4)` truncation, now renders full material names
  - Tests: 10 unit tests passing

- [x] **Level Editor: Paint Tool Offset When Zoomed**
  - File: `Classes/systems/ui/LevelEditor.js` (applyCameraTransform method, lines 494-519)
  - Issue: When zoomed in/out, painted tiles appeared far from mouse cursor position (e.g., "3 tiles left and 2 tiles up")
  - Priority: HIGH (blocked Level Editor usage)
  - Root Cause: Transform order was `translate(-camera); scale(zoom)` which caused translation vector to be scaled
  - Fix: Changed transform order to `scale(zoom); translate(-camera)` so translation is not scaled
  - Mathematical Explanation: Wrong order created effective translation of `(-cameraX * zoom)` instead of `(-cameraX)`
  - Tests: 9 integration tests + 3 E2E tests with screenshots passing
  - Fixed: October 27, 2025

- [x] **Level Editor: Terrain Paints Under Menu Bar on Drag**
  - Files: `Classes/systems/ui/LevelEditor.js` (handleDrag and handleClick methods)
  - Issue: Drag painting and click painting still occur when mouse is over menu bar (even though hover preview was correctly disabled)
  - Priority: MEDIUM (UX - unintended painting)
  - Root Cause: `handleDrag()` and `handleClick()` methods didn't check if mouse was over menu bar before painting
  - Fix: 
    - Added menu bar containsPoint() check FIRST in handleDrag (before panel/event checks) to block painting
    - Added menu bar containsPoint() check in handleClick (PRIORITY 3.5) to block painting
  - Implementation: 
    1. Check if mouse over menu bar → block painting
    2. Check if menu is open → block painting
    3. EventEditor drag → allow
    4. Panel drag → allow
    5. Terrain painting (lowest priority)
  - Tests: 14 unit tests + 6 E2E tests with screenshots passing
  - Fixed: January 2025

- [x] **Level Editor: Terrain Paints Under Save/Load Dialogs**
  - Files: `Classes/systems/ui/LevelEditor.js` (handleClick and handleDrag methods)
  - Issue: User can accidentally paint terrain while save/load dialogs are open
  - Priority: HIGH (data corruption - unexpected terrain changes)
  - Root Cause: 
    - `handleClick()` only returned early if dialog **consumed** the click
    - `handleDrag()` didn't check for dialog visibility at all
  - Fix:
    - `handleClick()`: Return immediately if either dialog is visible (block terrain regardless of consumption)
    - `handleDrag()`: Check dialog visibility FIRST (PRIORITY 0) before any terrain interaction
  - Implementation: Dialog check moved to highest priority, blocks terrain even if user clicks outside dialog
  - Tests: 12 unit tests passing
  - Fixed: October 27, 2025

- [x] **Level Editor: View Menu Panel Toggle Not Working**
  - Files: `Classes/ui/FileMenuBar.js` (_handleTogglePanel method)
  - Issue: Panels disappear briefly then reappear, menu shows incorrect checked state
  - Priority: MEDIUM (UX - confusing behavior)
  - Root Cause:
    - Used `this.levelEditor.draggablePanels.panels[panelName]` instead of global `draggablePanelManager`
    - Used short names ('materials') instead of full panel IDs ('level-editor-materials')
    - Called `panel.isVisible()` after `toggleVisibility()` but state hadn't updated yet
  - Fix:
    - Use global `draggablePanelManager.togglePanel(panelId)` method
    - Map short names to full IDs: `'materials' → 'level-editor-materials'`
    - Use return value from `togglePanel()` (new visibility state) instead of querying
  - Implementation: Direct use of draggablePanelManager API, synchronous state updates
  - Tests: 9 unit tests passing
  - Fixed: October 27, 2025

### Open ❌

- [ ] **Level Editor: Zoom Focus Point Incorrect**
  - File: `Classes/systems/ui/LevelEditor.js` (handleZoom method)
  - Issue: When zooming with mouse wheel in Level Editor, zoom doesn't focus on mouse pointer correctly
  - Priority: MEDIUM (UX)
  - Expected: Zoom should focus on mouse cursor position (like PLAYING state does)
  - Current: Zoom focuses on incorrect point, not following mouse cursor
  - Note: PLAYING state zoom works correctly via cameraManager
  - Root Cause: Level Editor uses center-based scaling transform while CameraManager uses simple transform
  - Tests Needed: Integration test comparing zoom behavior between states

## Statistics

- **Total Issues**: 10
- **Fixed**: 9
- **Open**: 1
- **High Priority Open**: 0
- **Missing Features**: 0

