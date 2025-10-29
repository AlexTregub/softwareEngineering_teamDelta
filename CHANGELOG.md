# Changelog

All notable changes to the Ant Colony Simulation Game.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

---

## [Unreleased]

### BREAKING CHANGES

(None)

---

### User-Facing Changes

#### Changed
- **DynamicGridOverlay Rewrite** (Performance Fix - TDD)
  - **REMOVED**: Complex edge detection and feathering system causing severe frame drops
  - **STATUS**: Skeleton implementation only - full rewrite in progress using TDD approach
  - **REASON**: Previous implementation had O(n²) complexity with aggressive caching that failed under load
  - **NEXT**: Simple grid rendering (all tiles + buffer) will be implemented with unit tests FIRST
  - See `docs/roadmaps/GRID_OVERLAY_REWRITE_ROADMAP.md` for TDD plan

#### Added
- **LevelEditorSidebar Component** (UI Enhancement)
  - Scrollable sidebar menu with fixed top menu bar and minimize functionality
  - **Composition Pattern**: Uses ScrollableContentArea for content management (not inheritance)
  - **Menu Bar Features**:
    - Fixed 50px header with title text (left side)
    - Minimize button (right side) with hover state tracking
    - Returns `{ type: 'minimize' }` on click for toggle logic
  - **Content Management**: Full delegation to ScrollableContentArea
    - `addText(id, textContent, options)` - Add static text labels
    - `addButton(id, label, callback, options)` - Add clickable buttons
    - `addCustom(id, renderFn, clickFn, height)` - Add custom widgets
    - `removeItem(id)`, `clearAll()`, `getContentItems()`
  - **Scroll Handling**: Menu bar filtering (only scrolls when mouse over content area)
    - `handleMouseWheel(delta, mouseX, mouseY)` - Scroll only if Y > menuBarHeight
    - `getScrollOffset()`, `getMaxScrollOffset()` - Scroll state queries
  - **Click Routing**: Smart delegation between menu bar and content area
    - Menu bar clicks: Check minimize button, else return null
    - Content clicks: Transform coordinates and delegate to contentArea
  - **Hover Tracking**: `updateHover(mouseX, mouseY, sidebarX, sidebarY)` for minimize button + content items
  - **Visibility Toggle**: `isVisible()`, `setVisible(visible)` - Hide/show without losing state
  - **Dynamic Resizing**: `setDimensions(width, height)` - Automatically updates contentArea dimensions
  - **Overflow Detection**: `hasOverflow()` - Checks if content exceeds viewport
  - **Configuration**: Width (default: 300px), height (default: 600px), menuBarHeight (default: 50px), title, colors
  - **Use Cases**: Level editor tool palettes, settings panels, inspector panels, any sidebar with menu bar + scrollable content
  - **Tests**: 74 total (44 unit + 30 integration with real ScrollableContentArea)
  - **Documentation**: `docs/api/LevelEditorSidebar_API_Reference.md`

- **ScrollableContentArea Component** (UI Enhancement)
  - High-performance scrollable content container with viewport culling
  - **Viewport Culling**: Renders only visible items for O(visible) performance instead of O(total)
    - Example: With 100 items, only ~12 rendered (8x faster)
  - **ScrollIndicator Integration**: Automatic scroll arrows via composition
    - Top/bottom indicators appear based on scroll state
    - Integrated via real ScrollIndicator instance (not inheritance)
  - **Three Content Types**: Text (labels), Buttons (interactive), Custom (full control)
  - **Mouse Interactions**: Scroll wheel support, click delegation with coordinate transformation
  - **Dynamic Content Management**: Add/remove items at runtime with automatic scroll bound updates
  - **Public API**:
    - `addText(id, text, options)` - Add static text label
    - `addButton(id, label, callback, options)` - Add clickable button with hover states
    - `addCustom(id, renderFn, clickFn, height)` - Add custom widget with full control
    - `removeItem(id)` - Remove item by ID
    - `clearAll()` - Remove all content
    - `handleMouseWheel(delta)` - Scroll with mouse wheel
    - `handleClick(mouseX, mouseY, areaX, areaY)` - Click delegation
    - `getVisibleItems()` - Get only visible items (viewport culling)
  - **Configuration Options**:
    - Dimensions, scroll speed, colors (background, text)
    - ScrollIndicator customization (height, colors)
    - Callbacks: `onItemClick(item)`, `onScroll(offset, maxOffset)`
  - **Use Cases**: Level editor sidebars, settings panels, event lists, chat windows
  - **Tests**: 109 total (85 unit + 24 integration with heavy ScrollIndicator focus)
  - **Documentation**: `docs/api/ScrollableContentArea_API_Reference.md`

- **[ARCHIVED] Edge-Only Grid Rendering** (Performance Enhancement - REMOVED)
  - Note: This implementation has been removed due to performance issues
  - Previous approach: Grid rendered ONLY at edge tiles (64% reduction in lines)
  - Problem: Complex edge detection + feathering caused frame drops instead of improvements
  - Tests archived: 111+ tests moved to documentation for reference
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
- **LevelEditorSidebar Class** (`Classes/ui/LevelEditorSidebar.js` - 390 lines)
  - **Composition Pattern**: Uses ScrollableContentArea instance (not inheritance)
    - Constructor creates ScrollableContentArea with `height - menuBarHeight`
    - All content methods delegate to `this.contentArea`
  - **Public API** (20 methods):
    - Content: `addText()`, `addButton()`, `addCustom()`, `removeItem()`, `clearAll()`, `getContentItems()`
    - Scroll: `handleMouseWheel()`, `getScrollOffset()`, `getMaxScrollOffset()`
    - Input: `handleClick()`, `updateHover()`
    - Rendering: `render()`
    - Dimensions: `getWidth()`, `getHeight()`, `getMenuBarHeight()`, `getContentAreaHeight()`, `setDimensions()`
    - Visibility: `isVisible()`, `setVisible()`
    - Utility: `hasOverflow()`
  - **Click Routing Logic**:
    - Menu bar clicks (Y < menuBarHeight): Check minimize button bounds, else return null
    - Content clicks: Transform coordinates (`contentAreaY = sidebarY + menuBarHeight`) and delegate
  - **Minimize Button Detection**:
    - Position: `x + width - 40 - 5` (right side, 40px wide)
    - Bounds: Inclusive edge checking with `<=` operator
    - Returns: `{ type: 'minimize' }` on click
  - **Scroll Filtering**: Only calls `contentArea.handleMouseWheel()` if `mouseY >= menuBarHeight`
  - **Tests**: 74 total (44 unit + 30 integration)
  - **Added to**: `index.html` after ScrollableContentArea

- **ScrollableContentArea Bug Fix**: Parameter shadowing in `addText()` method
  - **Problem**: Parameter named `text` shadowed global p5.js function `text()`
  - **Symptom**: `TypeError: text is not a function` when rendering text items in JSDOM tests
  - **Root Cause**: Inside render closure, `text(item.text, x, y)` called STRING parameter instead of global function
  - **Fix**: Renamed parameter `text` → `textContent` in method signature
  - **Impact**: Only affects ScrollableContentArea internal implementation
  - **Breaking**: NO - Parameter name change doesn't affect callers

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

