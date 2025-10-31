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

- [ ] **MaterialPalette: No Scroll Indicators Visible**
  - File: `Classes/ui/MaterialPalette.js` (render method)
  - Issue: No visual scroll indicators (arrows/bars) showing scrollable content
  - Priority: LOW (UX Enhancement)
  - Expected: Scroll indicators show when content exceeds viewport
  - Current: No indicators rendered
  - Root Cause: ScrollIndicator not initialized or not rendered
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

  - [ ] **CameraManager: Account for zoom when middle click dragging**
  - Issue: When the camera is at a very far zoom level, it will click and drag very slowly. The user will want to be able to
  move the camera at a consistent feeling speed even very far. The level of zoom is not unreasonable, so we need
  to think of ways to handle this at the far end of zoom levels.
  - Priority: LOW (QOL)

### Fixed ✅

- [x] **Entity Painter Panel: No panel shows up when toggled**
  - File: `Classes/systems/ui/LevelEditorPanels.js` (initialize and render methods), `Classes/ui/FileMenuBar.js` (panelIdMap and labelMap), `Classes/systems/ui/LevelEditor.js` (toolbar onClick handler)
  - Issue: Clicking "Entity Painter" in View menu or ant emoji (🐜) toolbar button had no effect
  - Priority: HIGH (Core Feature Broken)
  - Expected: Entity Painter panel appears with category buttons and entity templates
  - Root Cause:
    1. EntityPalette panel not created in `LevelEditorPanels.initialize()`
    2. Panel ID `'entity-painter'` not mapped to `'level-editor-entity-palette'` in FileMenuBar
    3. Label `'entity-painter'` not mapped to `'Entity Painter'` in FileMenuBar (menu state not syncing)
    4. EntityPalette not rendered in `LevelEditorPanels.render()` method
    5. Toolbar entity_painter tool had no onClick handler
  - Fix:
    - **LevelEditorPanels.js**: 
      - Added `entityPalette` property to panels object
      - Created DraggablePanel with id `'level-editor-entity-palette'`, title `'Entity Palette'`, size 220x300, hidden by default
      - Added contentSizeCallback that delegates to `EntityPalette.getContentSize()`
      - Added rendering code in `render()` method to call `entityPalette.render()`
    - **FileMenuBar.js**: 
      - Added `'entity-painter': 'level-editor-entity-palette'` to panelIdMap
      - Added `'entity-painter': 'Entity Painter'` to labelMap
    - **EntityPalette.js**: 
      - Added `getContentSize()`, `render()`, `handleClick()`, `containsPoint()` methods
    - **LevelEditor.js**:
      - Added onClick handler to `toolbar.tools['entity_painter']` that calls `FileMenuBar._handleTogglePanel('entity-painter')`
  - Implementation: TDD approach with strict Red → Green → Refactor phases
  - Tests:
    - Unit: 10/10 passing (entityPainterPanel.test.js - panel creation, toggle, toolbar button)
    - Integration: 8/8 passing (entityPainterPanelToggle.integration.test.js - full workflow)
    - E2E: 7/7 passing (pw_entity_painter_panel_toggle.js - browser verification with screenshots)
  - Result: 
    - Entity Painter panel now appears when toggled via View menu
    - Toolbar ant button (🐜) toggles panel visibility
    - View menu checked state syncs with panel visibility
    - Panel renders EntityPalette content (placeholder showing category and template count)
    - Panel properly centered in viewport
  - Fixed: October 31, 2025

- [x] **MaterialPalette: Mouse Wheel Scrolling Not Working**
  - File: `Classes/ui/MaterialPalette.js` (handleMouseWheel method), `sketch.js` (mouseWheel function), `Classes/systems/ui/LevelEditor.js` (handleMouseWheel method)
  - Issue: Mouse wheel scrolling had no effect when hovering over Materials panel
  - Priority: HIGH (Core Feature Broken)
  - Expected: Mouse wheel scrolls content when over Materials panel
  - Root Cause:
    1. sketch.js only called levelEditor.handleMouseWheel() when Shift pressed
    2. LevelEditor.handleMouseWheel() tried to call non-existent panel.getPosition()/panel.getSize() methods
  - Fix:
    - **sketch.js**: Removed Shift-only condition, ALWAYS call handleMouseWheel() with mouseX/mouseY parameters
    - **LevelEditor.js**: Changed panel dimension access from getPosition()/getSize() to state.position and direct width/height properties
    - **MaterialPalette.js**: Added input validation for delta parameter
  - Implementation: TDD approach with 16 integration tests (scroll priority, delegation, edge cases) + 6 E2E tests (browser verification)
  - Tests:
    - Unit: 9/11 passing (materialPaletteMouseWheel.test.js)
    - Integration: 16/16 passing (mouseWheelScrolling.integration.test.js, mouseWheelDelegation.integration.test.js)
    - E2E: 6/6 passing (pw_material_palette_mouse_wheel.js) - verified in real browser with screenshots
  - Result: Mouse wheel scrolling now works reliably for all panels (Materials, Sidebar) without conflicting with camera zoom or brush size
  - Related Fix: Removed duplicate ScrollIndicator.js import from index.html (was causing "redeclaration of let ScrollIndicator" error)
  - Fixed: October 31, 2025

- [x] **MaterialPalette: Content Extends Beyond Panel Edges**
  - File: `Classes/ui/MaterialPalette.js` (render method)
  - Issue: Materials in middle of panel render outside panel boundaries
  - Priority: MEDIUM (Visual Bug)
  - Expected: All content clipped to panel contentArea boundaries
  - Current: Materials overflow panel edges
  - Root Cause: No clip() or boundary checks during rendering
  - Fix:
    - Replaced p5.js `clip()`/`noClip()` with native Canvas API (avoid callback complexity)
    - Added `drawingContext.save()` + `beginPath()` + `rect()` + `clip()` at render start
    - Added `drawingContext.restore()` at render end (removes clipping)
    - Wrapped in push/pop for state isolation
  - Implementation: TDD approach with 12 unit tests (clipping setup, push/pop wrapping, edge cases)
  - Tests: 12/12 passing (materialPaletteClipping.test.js)
  - Result: All content now properly clipped to panel contentArea boundaries, no nested clipping errors
  - Fixed: October 31, 2025

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
  - Fixed: 10/30/2025

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

- **Total Issues**: 14
- **Fixed**: 15
- **Open**: 6
- **High Priority Open**: 4

---

## Archive Policy

Fixed issues are moved to `KNOWN_ISSUES_ARCHIVE.md` 2 weeks after fix date.
