# Known Issues - Checklist

Track bugs and technical debt. Only bugs discovered after integration/E2E testing (feature fully implemented) are tracked here. Bugs found during development go in the active feature checklist.

---

## Issues Status

### Open ❌

- [ ] **DynamicGridOverlay: Severe Performance Issues (REWRITE IN PROGRESS)**
  - File: `Classes/ui/DynamicGridOverlay.js`
  - Issue: Grid overlay causes frame drops and stuttering when painting tiles
  - Priority: CRITICAL (blocks Level Editor usage)
  - Expected: 60 fps with 100+ painted tiles
  - Current: Severe frame drops (10-30 fps) even with small painted areas
  - Root Cause: 
    - Complex edge detection with O(n²) nested loops
    - Aggressive feathering calculations with poor cache performance
    - Multiple Set creations per frame for neighbor checking
    - Opacity sampling at 5+ points per grid line
    - Cache invalidation logic triggers too frequently
  - Solution: Complete rewrite using TDD approach (see `docs/roadmaps/GRID_OVERLAY_REWRITE_ROADMAP.md`)
  - Status: OLD IMPLEMENTATION REMOVED, starting from scratch with tests-first
  - Timeline: 5-7 hours estimated for TDD rewrite
  - Note: Previous "edge-only rendering" approach archived - too complex

- [ ] **Level Editor: Zoom Focus Point Incorrect**
  - File: `Classes/systems/ui/LevelEditor.js` (handleZoom method)
  - Issue: When zooming with mouse wheel in Level Editor, zoom doesn't focus on mouse pointer correctly
  - Priority: MEDIUM (UX)
  - Expected: Zoom should focus on mouse cursor position (like PLAYING state does)
  - Current: Zoom focuses on incorrect point, not following mouse cursor
  - Note: PLAYING state zoom works correctly via cameraManager
  - Root Cause: Level Editor uses center-based scaling transform while CameraManager uses simple transform

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

- [x] **Level Editor Material Palette: Material Names Truncated**
  - File: `Classes/ui/MaterialPalette.js` (line 285)
  - Issue: Material names were truncated to 4 characters (e.g., "stone" appeared as "ston")
  - Priority: LOW (cosmetic)
  - Fix: Removed `.substring(0, 4)` truncation, now renders full material names
  - Fixed: October 2025

- [x] **Level Editor: Paint Tool Offset When Zoomed**
  - File: `Classes/systems/ui/LevelEditor.js` (applyCameraTransform method, lines 494-519)
  - Issue: When zoomed in/out, painted tiles appeared far from mouse cursor position (e.g., "3 tiles left and 2 tiles up")
  - Priority: HIGH (blocked Level Editor usage)
  - Root Cause: Transform order was `translate(-camera); scale(zoom)` which caused translation vector to be scaled
  - Fix: Changed transform order to `scale(zoom); translate(-camera)` so translation is not scaled
  - Mathematical Explanation: Wrong order created effective translation of `(-cameraX * zoom)` instead of `(-cameraX)`
  - Fixed: October 27, 2025

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
  - Fixed: October 27, 2025

- [x] **Level Editor: Events Panel Toggle Bug**
  - Files: 
    - `Classes/systems/ui/LevelEditorPanels.js` (toggleEventsPanel, line 383-407)
    - `Classes/systems/ui/DraggablePanelManager.js` (renderPanels, line 1043-1060)
    - `Classes/systems/ui/DraggablePanel.js` (constructor, line 67)
  - Issue: Events panel toggles on then immediately off when clicking Events button (🚩)
  - Priority: HIGH (blocked Event Editor usage)
  - Root Causes (TDD process revealed TWO bugs):
    1. **DraggablePanel defaults to visible**: `visible: config.visible !== false` → all panels start visible
    2. **renderPanels() enforces stateVisibility**: Runs 60fps, hides panels not in `stateVisibility.LEVEL_EDITOR`
       - `toggleEventsPanel()` toggled `panel.visible` but didn't update stateVisibility array
       - Result: Panel toggles ON → next frame renderPanels() hides it
  - Fix:
    1. Added `visible: false` to Events/Properties panel configs
    2. Updated `toggleEventsPanel()` to sync with stateVisibility:
       - Toggle ON: `panel.show()` + add to array
       - Toggle OFF: `panel.hide()` + remove from array
  - Fixed: January 2025

- [x] **Level Editor: EventEditorPanel Render Parameters Missing**
  - Files:
    - `Classes/systems/ui/LevelEditorPanels.js` (render method, line 352-360)
    - `Classes/systems/ui/EventEditorPanel.js` (render signature, line 89)
  - Issue: Events panel shows only text, drag-to-place functionality broken
  - Priority: HIGH (blocked Event Editor drag functionality)
  - Root Cause: 
    - `EventEditorPanel.render()` expects 4 parameters: `(x, y, width, height)`
    - `LevelEditorPanels.render()` only passed 2: `(contentArea.x, contentArea.y)`
    - Missing width/height broke layout calculations and drag button positioning
  - Fix:
    - Updated render callback to pass all 4 parameters from contentArea object
    - Changed: `render(contentArea.x, contentArea.y)` 
    - To: `render(contentArea.x, contentArea.y, contentArea.width, contentArea.height)`
  - Fixed: October 28, 2025

---

## Statistics

- **Total Issues**: 12
- **Fixed**: 11
- **Open**: 1
- **High Priority Open**: 0

---

## Archive Policy

Fixed issues are moved to `KNOWN_ISSUES_ARCHIVE.md` 2 weeks after fix date.
