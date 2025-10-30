# UI Current State - API Inventory

**Date**: October 29, 2025  
**Purpose**: Document existing UI class APIs before consolidation  
**Status**: Phase 1 - Analysis

---

## Overview

Current UI folder contains **24 files** (+ 1 in menuBar/):
- **2 duplicates**: MiniMap/DynamicMinimap, GridOverlay/DynamicGridOverlay
- **5-6 non-UI**: LocalStorageManager, FormatConverter, HoverPreviewManager, SelectionManager, ServerIntegration, AutoSave
- **Remaining**: Legitimate UI components needing refactoring

---

## Class Inventory

### UIObject (Base Class) ✅

**File**: `Classes/ui/UIObject.js`  
**Status**: Keep as universal base  
**Extends**: None

**Public API**:
```javascript
constructor(config = {})           // x, y, width, height, cacheStrategy, tileSize, protected, visible
markDirty(region = null)          // Mark cache dirty
isDirty()                         // Check if dirty
getCacheBuffer()                  // Get cache buffer
renderToCache(buffer)             // ABSTRACT - subclasses implement
update()                          // Called each frame
render()                          // Main render method
renderToScreen()                  // Render cached/direct
renderDirect()                    // Fallback when no cache
setVisible(visible)               // Set visibility
isVisible()                       // Get visibility
destroy()                         // Cleanup cache
```

**Design**:
- Already has cache management (CacheManager integration)
- Template method pattern (render → renderToCache → renderToScreen)
- Dirty tracking
- Position/size management

**Verdict**: ✅ Perfect base class, no changes needed

---

### Dialogs

#### SaveDialog

**File**: `Classes/ui/SaveDialog.js` (507 lines)  
**Status**: Refactor to extend Dialog base  
**Extends**: None (currently standalone)

**Public API**:
```javascript
constructor()
setFilename(filename)
getFilename()
validateFilename(filename)
setFormat(format)
getFormat()
getFullFilename(filename)
checkOverwrite(filename)
setExistingFiles(files)
show(defaultFilename)
hide()
isVisible()
estimateSize(terrainData)
formatSize(bytes)
getAvailableFormats()
generateTimestampedFilename(prefix)
render()
isPointInside(x, y)
```

**Duplicated Patterns**:
- show/hide/isVisible (same as LoadDialog, ConfirmationDialog)
- Dialog dimensions (dialogWidth, dialogHeight)
- Callbacks (onSave, onCancel - similar to onLoad, onCancel)

**Unique Features**:
- Format selection (JSON, compressed, chunked, PNG, binary)
- Filename validation
- Overwrite warnings
- Size estimation

**Refactor Plan**:
- Create Dialog base with show/hide/callbacks/dimensions
- SaveDialog extends Dialog, override renderContent()
- Keep format/filename/validation logic

---

#### LoadDialog

**File**: `Classes/ui/LoadDialog.js` (499 lines)  
**Status**: Refactor to extend Dialog base  
**Extends**: None (currently standalone)

**Public API**:
```javascript
constructor()
setFiles(files)
getFileList()
setSearchTerm(term)
getSearchTerm()
setSortOrder(order)
getSortOrder()
selectFile(file)
getSelectedFile()
show()
hide()
isVisible()
render()
isPointInside(x, y)
```

**Duplicated Patterns**:
- show/hide/isVisible (same as SaveDialog, ConfirmationDialog)
- Dialog dimensions (dialogWidth, dialogHeight)
- Callbacks (onLoad, onCancel)

**Unique Features**:
- File listing
- Search filtering
- Sort order (date/name)
- File preview

**Refactor Plan**:
- LoadDialog extends Dialog, override renderContent()
- Keep file list/search/sort logic

---

#### ConfirmationDialog

**File**: `Classes/ui/ConfirmationDialog.js` (88 lines)  
**Status**: Refactor to extend Dialog base  
**Extends**: None (currently standalone)

**Public API**:
```javascript
constructor()
show(message, onConfirm, onCancel)
hide()
isVisible()
```

**Duplicated Patterns**:
- show/hide/isVisible (same as SaveDialog, LoadDialog)
- Callbacks (confirmCallback, cancelCallback)

**Unique Features**:
- Simple message display
- Confirm/cancel only (no complex UI)

**Refactor Plan**:
- ConfirmationDialog extends Dialog, minimal override
- Most logic handled by Dialog base

---

### Overlays

#### MiniMap (Legacy)

**File**: `Classes/ui/MiniMap.js` (464 lines)  
**Status**: MERGE with DynamicMinimap → Minimap  
**Extends**: None

**Public API**:
```javascript
constructor(terrain, width, height)
invalidateCache()
scheduleInvalidation()
cancelScheduledInvalidation()
setInvalidateDebounceDelay(delay)
notifyTerrainEditStart()
notifyTerrainEditEnd()
setCacheEnabled(enabled)
isCacheValid()
getScale()
getViewportRect(camera)
clickToWorldPosition(miniMapX, miniMapY)
shouldUpdate(currentTime)
setUpdateInterval(interval)
getTerrainAt(miniMapX, miniMapY)
getDimensions()
worldToMiniMap(worldX, worldY)
update()
render(x, y)
destroy()
```

**Features**:
- Full terrain rendering (iteration over all tiles)
- CacheManager integration (FullBufferCache)
- Debounced invalidation
- Camera viewport rendering
- World↔Minimap coordinate conversion
- Update throttling

**Verdict**: Keep cache logic, merge with DynamicMinimap viewport calculation

---

#### DynamicMinimap

**File**: `Classes/ui/DynamicMinimap.js` (190 lines)  
**Status**: MERGE with MiniMap → Minimap  
**Extends**: None

**Public API**:
```javascript
constructor(terrain, width, height, padding)
calculateViewport()
calculateScale(viewport)
worldToMinimap(worldX, worldY)
update()
render(x, y)
renderCameraViewport(cameraViewport, x, y)
getInfo()
```

**Features**:
- Sparse terrain rendering (painted tiles only)
- Dynamic viewport calculation (bounds + padding)
- Auto-scaling to fit viewport
- Coordinate conversion
- No caching (direct rendering each frame)

**Verdict**: Keep viewport/scale logic, merge with MiniMap cache support

---

#### GridOverlay (Full)

**File**: `Classes/ui/GridOverlay.js` (245 lines)  
**Status**: MERGE with DynamicGridOverlay → GridOverlay  
**Extends**: None

**Public API**:
```javascript
constructor(tileSize, width, height)
toggle()
setVisible(visible)
isVisible()
setOpacity(opacity)
getOpacity()
getVerticalLines()
getHorizontalLines()
getAllLines()
setHovered(mouseX, mouseY)
getHoveredTile()
clearHovered()
getHighlightRect()
render(offsetX, offsetY)
```

**Features**:
- Full grid rendering (all tiles)
- Toggle visibility
- Opacity control
- Hover detection/highlighting
- 0.5px stroke offset fix (alignment)

**Verdict**: Keep hover logic, merge with DynamicGridOverlay bounds calculation

---

#### DynamicGridOverlay

**File**: `Classes/ui/DynamicGridOverlay.js` (82 lines)  
**Status**: MERGE with GridOverlay → GridOverlay  
**Extends**: None

**Public API**:
```javascript
constructor(terrain, tileSize, bufferSize)
render()
setVisible(visible)
destroy()
```

**Features**:
- Sparse grid rendering (painted tiles + buffer only)
- Direct rendering (no cache - grid lines are fast)
- Bounds calculation from painted tiles

**Verdict**: Keep bounds logic, merge with GridOverlay hover support

---

### Editor Tools

#### ToolBar

**File**: `Classes/ui/ToolBar.js` (370 lines)  
**Status**: Refactor to extend EditorTool  
**Extends**: None

**Public API**:
```javascript
constructor(toolConfigs)
selectTool(tool)
getSelectedTool()
getShortcut(tool)
isEnabled(tool)
setEnabled(tool, enabled)
getToolGroup(tool)
getToolsByGroup(group)
getAllTools()
addButton(config)
getToolInfo(tool)
getToolByShortcut(shortcut)
getContentSize()
handleClick(mouseX, mouseY, panelX, panelY)
containsPoint(mouseX, mouseY, panelX, panelY)
render(x, y)
```

**Features**:
- Tool selection (brush, fill, rectangle, line, eraser, eyedropper)
- Keyboard shortcuts
- Tool grouping (drawing, selection, edit)
- Enable/disable tools
- Custom button addition
- Click handling

**Duplicated Patterns**:
- Tool selection state (active/inactive)
- Render loop with buttons
- handleClick/containsPoint

**Verdict**: Extract common tool logic to EditorTool base

---

#### MaterialPalette

**File**: `Classes/ui/MaterialPalette.js` (330 lines)  
**Status**: Refactor to extend EditorTool  
**Extends**: None

**Public API**:
```javascript
constructor(materials)
selectMaterial(material)
getSelectedMaterial()
getSelectedIndex()
selectNext()
selectPrevious()
getMaterialColor(material)
getMaterialsByCategory(category)
getCategory(material)
isHighlighted(material)
getMaterials()
getPreview(material)
getContentSize()
handleClick(mouseX, mouseY, panelX, panelY)
containsPoint(mouseX, mouseY, panelX, panelY)
render(x, y)
```

**Features**:
- Material selection
- Category organization (natural, solid, soil)
- Keyboard navigation (next/previous)
- Color/texture preview
- Click handling

**Duplicated Patterns**:
- Selection state (selectedMaterial, selectedIndex)
- Render loop with swatches
- handleClick/containsPoint
- getContentSize

**Verdict**: Extract common selection logic to EditorTool base

---

#### BrushSizeControl

**File**: `Classes/ui/BrushSizeControl.js`  
**Status**: Refactor to extend EditorTool  
**Extends**: None  
**Note**: Not yet analyzed (need to read file)

---

### Panels

#### PropertiesPanel

**File**: `Classes/ui/PropertiesPanel.js`  
**Status**: Refactor to extend Panel  
**Extends**: None  
**Note**: Not yet analyzed

---

#### LevelEditorSidebar

**File**: `Classes/ui/LevelEditorSidebar.js`  
**Status**: Refactor to extend Panel  
**Extends**: None  
**Note**: Not yet analyzed

---

#### FileMenuBar

**File**: `Classes/ui/FileMenuBar.js`  
**Status**: Refactor to extend Panel  
**Extends**: None  
**Note**: Not yet analyzed

---

### Scrollable Components

#### ScrollableContentArea

**File**: `Classes/ui/ScrollableContentArea.js` (430 lines)  
**Status**: Refactor to extend UIObject or ScrollableComponent  
**Extends**: None

**Public API**:
```javascript
constructor(options)
addText(id, textContent, options)
addButton(id, label, callback, options)
addCustom(id, renderFn, clickFn, height)
removeItem(id)
clearAll()
calculateTotalHeight()
calculateMaxScrollOffset()
getVisibleHeight()
updateScrollBounds()
clampScrollOffset()
getVisibleItems()
handleMouseWheel(delta)
handleClick(mouseX, mouseY, areaX, areaY)
updateHover(mouseX, mouseY, areaX, areaY)
render(x, y)
getTotalHeight()
setDimensions(width, height)
```

**Features**:
- Scrollable content container
- Add text/buttons/custom elements
- Mouse wheel scrolling
- Scroll bounds management
- Hover detection

**Verdict**: Possible intermediate base class (ScrollableComponent)

---

#### ScrollIndicator

**File**: `Classes/ui/ScrollIndicator.js` (172 lines)  
**Status**: Refactor to extend UIObject or ScrollableComponent  
**Extends**: None

**Public API**:
```javascript
constructor(options)
canScrollUp(scrollOffset)
canScrollDown(scrollOffset, maxScrollOffset)
renderTop(x, y, width, scrollOffset, isHovered)
renderBottom(x, y, width, scrollOffset, maxScrollOffset, isHovered)
containsPointTop(mouseX, mouseY, x, y, width)
containsPointBottom(mouseX, mouseY, x, y, width)
getTotalHeight(scrollOffset, maxScrollOffset)
```

**Features**:
- Scroll arrows (up/down)
- Hover states
- Visibility based on scroll state

**Verdict**: Companion to ScrollableContentArea

---

### Non-UI Classes (Relocate)

#### LocalStorageManager

**File**: `Classes/ui/LocalStorageManager.js`  
**Status**: **RELOCATE to `Classes/managers/`**  
**Reason**: Storage operations, not visual UI

**Public API**: (Not yet analyzed)

**Verdict**: Move to managers/, update imports in calling code

---

#### FormatConverter

**File**: `Classes/ui/FormatConverter.js`  
**Status**: **RELOCATE to `Classes/terrainUtils/`**  
**Reason**: Data conversion utility, not UI

**Public API**: (Not yet analyzed)

**Verdict**: Move to terrainUtils/, update imports

---

#### HoverPreviewManager

**File**: `Classes/ui/HoverPreviewManager.js`  
**Status**: **RELOCATE to `Classes/managers/`**  
**Reason**: Manager logic, not UI component

**Public API**: (Not yet analyzed)

**Verdict**: Move to managers/, update imports

---

#### SelectionManager

**File**: `Classes/ui/SelectionManager.js` (108 lines)  
**Status**: **RELOCATE to `Classes/managers/`**  
**Reason**: Selection logic, not visual UI

**Public API**:
```javascript
constructor()
startSelection(tileX, tileY)
updateSelection(tileX, tileY)
endSelection()
clearSelection()
hasSelection()
getSelectionBounds()
getTilesInSelection()
```

**Features**:
- Tile selection tracking
- Rectangle selection
- Bounds calculation

**Verdict**: Move to managers/, update imports

---

#### ServerIntegration

**File**: `Classes/ui/ServerIntegration.js`  
**Status**: **RELOCATE to `Classes/managers/`** or **SPLIT**  
**Reason**: Contains 2 classes (ServerUpload, ServerDownload) - not UI

**Classes**:
1. `ServerUpload` - Upload terrain data
2. `ServerDownload` - Download terrain data

**Options**:
- Option A: Move entire file to managers/
- Option B: Split into 2 files in managers/
- **Recommendation**: Option A (keep together)

**Verdict**: Move to managers/, update imports

---

#### AutoSave

**File**: `Classes/ui/AutoSave.js`  
**Status**: **EVALUATE** - Manager or utility?  
**Reason**: Auto-save logic, likely not UI

**Public API**: (Not yet analyzed)

**Verdict**: Analyze, then relocate if not UI

---

#### NotificationManager

**File**: `Classes/ui/NotificationManager.js`  
**Status**: **EVALUATE** - Does it render UI?  
**Reason**: Could be UI component (toast notifications) or pure logic

**Public API**: (Not yet analyzed)

**Verdict**: If it has render methods, refactor to extend UIObject. Otherwise, move to managers/

---

## Duplicated Code Patterns

### 1. Dialog Pattern

**Found in**: SaveDialog, LoadDialog, ConfirmationDialog

**Duplicated code**:
```javascript
// Properties
this.visible = false;
this.onSave = null; // or onLoad, onConfirm
this.onCancel = null;
this.dialogWidth = 500; // or 600
this.dialogHeight = 300; // or 400

// Methods
show() { this.visible = true; }
hide() { this.visible = false; }
isVisible() { return this.visible; }
```

**Solution**: Create Dialog base class with these common properties/methods

---

### 2. Editor Tool Pattern

**Found in**: ToolBar, MaterialPalette, (BrushSizeControl - TBD)

**Duplicated code**:
```javascript
// Properties
this.selectedTool / this.selectedMaterial
this.selectedIndex

// Methods
getContentSize() { /* calculate panel size */ }
handleClick(mouseX, mouseY, panelX, panelY) { /* hit testing */ }
containsPoint(mouseX, mouseY, panelX, panelY) { /* bounds check */ }
render(x, y) { /* draw UI */ }
```

**Solution**: Create EditorTool base class with selection state, hit testing, rendering

---

### 3. Minimap Pattern

**Found in**: MiniMap, DynamicMinimap

**Duplicated code**:
```javascript
// Properties
this.terrain
this.width / this.height
this.scale

// Methods
update() { /* update state */ }
render(x, y) { /* draw minimap */ }
worldToMinimap(worldX, worldY) { /* coordinate conversion */ }
```

**Solution**: Merge into single Minimap class with mode detection

---

### 4. Grid Overlay Pattern

**Found in**: GridOverlay, DynamicGridOverlay

**Duplicated code**:
```javascript
// Properties
this.tileSize
this.visible

// Methods
setVisible(visible) { this.visible = visible; }
render() { /* draw grid */ }
destroy() { /* cleanup */ }
```

**Solution**: Merge into single GridOverlay class with mode detection

---

## Breaking Changes

**Goal**: Zero breaking changes (backward compatible)

**Strategies**:
1. **Preserve public APIs**: All existing methods remain callable
2. **Internal refactoring**: Change inheritance without changing external interface
3. **Gradual migration**: Update callers after refactor is stable
4. **Deprecation warnings**: If any API needs to change, add warnings first

**Current assessment**: ✅ No breaking changes required

---

## Migration Priority

**Phase order** (bottom-up dependency):

1. **Base classes** (Dialog, Overlay, EditorTool, Panel) - No dependencies
2. **Consolidate duplicates** (Minimap, GridOverlay) - Simple merges
3. **Refactor dialogs** (SaveDialog, LoadDialog, ConfirmationDialog) - Extend Dialog
4. **Refactor tools** (MaterialPalette, ToolBar, BrushSizeControl) - Extend EditorTool
5. **Refactor panels** (PropertiesPanel, LevelEditorSidebar, FileMenuBar) - Extend Panel
6. **Relocate non-UI** - Move files, update imports
7. **Testing** - Integration and E2E

---

## Next Steps

1. ✅ **API inventory complete** (this document)
2. **Finish analysis**: BrushSizeControl, PropertiesPanel, LevelEditorSidebar, FileMenuBar, AutoSave, NotificationManager
3. **Create base class specs**: Write detailed specs for Dialog, Overlay, EditorTool, Panel
4. **Begin Phase 2**: Start TDD cycle (tests FIRST for Dialog base class)

---

## Summary

**File count**: 24 files → ~15-18 files (net reduction: 6-9)

**Duplicates identified**: 4 classes (2 pairs)
- MiniMap + DynamicMinimap → Minimap
- GridOverlay + DynamicGridOverlay → GridOverlay

**Non-UI classes**: 5-6 to relocate
- LocalStorageManager, FormatConverter, HoverPreviewManager, SelectionManager, ServerIntegration, AutoSave (TBD), NotificationManager (TBD)

**Refactor targets**: 11+ classes
- 3 dialogs → extend Dialog
- 3 tools → extend EditorTool
- 3 panels → extend Panel
- 2 overlays → extend Overlay
- 2 scrollables → extend ScrollableComponent (TBD)

**Breaking changes**: ✅ None (fully backward compatible)
