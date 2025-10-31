# Known Issues - Checklist

Track bugs and technical debt. Only bugs discovered after integration/E2E testing (feature fully implemented) are tracked here. Bugs found during development go in the active feature checklist.

---

## Issues Status

### Open ❌

- [ ] **MaterialPalette: Material Image Offset Issue**
  - File: `Classes/ui/MaterialPalette.js` (render method)
  - Issue: Material swatches render with incorrect offset (0.5-tile displacement)
  - Priority: HIGH (Visual Bug)
  - Expected: Material images aligned correctly in swatches
  - Current: Images offset by approximately half a tile
  - Root Cause: Likely imageMode not set to CORNER before rendering TERRAIN_MATERIALS_RANGED images
  - Reported: October 30, 2025

- [ ] **MaterialPalette: Search Bar Not Filtering Materials**
  - File: `Classes/ui/MaterialPalette.js` (handleKeyPress, searchMaterials, render methods)
  - Issue: Typing in search bar doesn't filter displayed materials
  - Priority: HIGH (Core Feature Broken)
  - Expected: Typing filters materials by name in real-time
  - Current: Materials remain unchanged when typing
  - Root Cause: Unknown - search results may not be used in render(), or render not updating
  - Related: handleKeyPress routes to searchBar, searchMaterials updates searchResults
  - Reported: October 30, 2025

- [ ] **MaterialPalette: Category Headers Not Clickable**
  - File: `Classes/ui/MaterialPalette.js` (handleClick method)
  - Issue: Clicking category headers doesn't expand/collapse categories
  - Priority: HIGH (Core Feature Broken)
  - Expected: Click category header toggles expanded/collapsed state
  - Current: No response when clicking categories
  - Root Cause: handleClick may not route clicks to MaterialCategory components
  - Reported: October 30, 2025

- [ ] **MaterialPalette: False Material Selection on Category Click**
  - File: `Classes/ui/MaterialPalette.js` (handleClick method)
  - Issue: Clicking category headers selects materials and adds to recently used
  - Priority: HIGH (Incorrect Behavior)
  - Expected: Category clicks should toggle expand/collapse only
  - Current: Category clicks trigger material selection
  - Root Cause: handleClick routing clicks to wrong handler (material swatch instead of category header)
  - Related: Click coordinate transformation may be incorrect with scroll offset
  - Reported: October 30, 2025

- [ ] **MaterialPalette: Content Extends Beyond Panel Edges**
  - File: `Classes/ui/MaterialPalette.js` (render method)
  - Issue: Materials in middle of panel render outside panel boundaries
  - Priority: MEDIUM (Visual Bug)
  - Expected: All content clipped to panel contentArea boundaries
  - Current: Materials overflow panel edges
  - Root Cause: No clip() or boundary checks during rendering
  - Reported: October 30, 2025

- [ ] **MaterialPalette: No Scroll Indicators Visible**
  - File: `Classes/ui/MaterialPalette.js` (render method)
  - Issue: No visual scroll indicators (arrows/bars) showing scrollable content
  - Priority: LOW (UX Enhancement)
  - Expected: Scroll indicators show when content exceeds viewport
  - Current: No indicators rendered
  - Root Cause: ScrollIndicator not initialized or not rendered
  - Reported: October 30, 2025

- [ ] **MaterialPalette: Mouse Wheel Scrolling Not Working**
  - File: `Classes/systems/ui/LevelEditor.js` (handleMouseWheel method)
  - Issue: Mouse wheel doesn't scroll when hovering over Materials panel
  - Priority: HIGH (Core Feature Broken)
  - Expected: Mouse wheel scrolls content when over Materials panel
  - Current: No scrolling occurs
  - Root Cause: handleMouseWheel delegation may not be wired correctly, or hover detection failing
  - Related: LevelEditor.handleMouseWheel checks if mouse over materials panel
  - Reported: October 30, 2025

- [ ] **Level Editor: Zoom Focus Point Incorrect**
  - File: `Classes/systems/ui/LevelEditor.js` (handleZoom method)
  - Issue: When zooming with mouse wheel in Level Editor, zoom doesn't focus on mouse pointer correctly
  - Priority: MEDIUM (UX)
  - Expected: Zoom should focus on mouse cursor position (like PLAYING state does)
  - Current: Zoom focuses on incorrect point, not following mouse cursor
  - Note: PLAYING state zoom works correctly via cameraManager
  - Root Cause: Level Editor uses center-based scaling transform while CameraManager uses simple transform

- [ ] **Level Editor: MenuBar needs to resize with window**
  - Issue: When expanding the window, the menu bar size remains the same and is
  visabliy cut off
  - Priority: MEDIUM (UX)
  - Expected: When a user resizes the window, the bar extends to the new window width
  - Current: MenuBar size is static and decided when the user enters the LevelEditor

### Fixed ✅

- [x] **DraggablePanel: Starts Dragging/Minimizing When Painting Over Title Bar**
  - File: `Classes/systems/ui/DraggablePanel.js` (handleDragging method, update method, minimize button check)
  - Issue: When user is painting/erasing with mouse held down and moves over a panel's title bar, the panel starts dragging or minimize button activates instead of continuing to paint
  - Priority: HIGH (interrupts painting workflow)
  - Root Cause: Neither `handleDragging()` nor minimize button check verified if user initiated the click on the panel - only checked `if (mousePressed && isPointInBounds(titleBar))`
  - Fix: Added click origin tracking
    1. Added `clickStartedOnTitleBar` flag to track where mouse click originated
    2. Added `_wasMousePressed` flag to detect mouse press/release edges
    3. Track click origin in `update()` method (sets flag true only if click starts on title bar)
    4. Reset flag when mouse released
    5. Updated `handleDragging()` to require `this.clickStartedOnTitleBar && isPointInBounds(titleBar)`
    6. Updated minimize button check to require `this.clickStartedOnTitleBar`
  - Implementation: Self-contained solution (no system coupling), tracks click origin on press edge
  - Tests: 13/13 unit tests passing (click origin tracking + drag prevention + minimize protection)
  - Result: Panel only drags/minimizes if click started on title bar, painting workflow no longer interrupted
  - Fixed: October 29, 2025

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

- **Total Issues**: 13
- **Fixed**: 12
- **Open**: 2
- **High Priority Open**: 0

---

## Archive Policy

Fixed issues are moved to `KNOWN_ISSUES_ARCHIVE.md` 2 weeks after fix date.
