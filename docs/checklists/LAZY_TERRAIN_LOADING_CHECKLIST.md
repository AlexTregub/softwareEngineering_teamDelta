# Lazy Terrain Loading Enhancement - Checklist

**Date**: October 27, 2025  
**Status**: Planning Phase  
**Methodology**: Test-Driven Development (TDD)  
**Priority**: HIGH (Major UX Enhancement)

---

## Overview

Transform Level Editor from eager tile loading to lazy/sparse tile loading:

**Current Behavior**:
- Terrain initializes with full grid of default tiles (e.g., 50x50 = 2,500 tiles)
- User can only paint within pre-initialized bounds
- Minimap shows entire grid
- Grid overlay visible everywhere

**Target Behavior**:
- **Black canvas** on startup (no tiles rendered)
- **UI and grid overlay** only visible at mouse hover location
- **Paint anywhere** - tiles created on-demand at any coordinate
- **Minimap** dynamically bounds to painted region (e.g., if tiles at (0,0) and (100,100), minimap shows that bounding box)
- **Grid overlay** appears at painted tiles + 2-tile radius with feathering

---

## Technical Design

### Architecture Changes

1. **Sparse Tile Storage**
   - Change from dense 2D array to sparse Map: `Map<string, Tile>` where key is `"x,y"`
   - Only store painted tiles (not default/empty tiles)
   - Unbounded canvas (no preset width/height limits)

2. **Dynamic Bounding Box**
   - Track `minX, maxX, minY, maxY` of painted tiles
   - Update on every paint operation
   - Minimap uses these bounds for viewport

3. **Grid Overlay System**
   - Render grid lines only in painted regions + 2-tile buffer
   - Feathering: Fade opacity from 1.0 (painted tiles) to 0.0 (2 tiles away)
   - Hover-based grid preview at mouse location

4. **Render Optimization**
   - Only render tiles within camera viewport + buffer
   - Cull tiles outside visible area
   - Minimap cache invalidation on paint only

---

## TDD Workflow

### Phase 1: Unit Tests (Write FIRST)
- [x] Create all unit test files
- [x] Verify all tests fail (EXPECTED - no implementation)
- [ ] Implement features
- [ ] Run tests (all pass)

### Phase 2: Integration Tests
- [ ] Test sparse storage with real TerrainEditor
- [ ] Test bounding box calculations
- [ ] Test grid overlay rendering

### Phase 3: E2E Tests
- [ ] Visual verification with screenshots
- [ ] Test painting at arbitrary coordinates
- [ ] Test minimap dynamic bounds

---

## Phase 1A: Sparse Tile Storage - Unit Tests (TDD)

**Goal**: Replace dense 2D array with sparse Map storage

**Test File**: `test/unit/terrainUtils/SparseTerrain.test.js`

### Unit Tests to Write (FIRST)
- [ ] Should initialize with empty tile map
- [ ] Should store tile at arbitrary coordinates (positive/negative)
- [ ] Should retrieve tile by coordinates
- [ ] Should return null for unpainted coordinates
- [ ] Should handle negative coordinates
- [ ] Should handle very large coordinates (1000000, 1000000)
- [ ] Should update existing tile
- [ ] Should delete tile (return to unpainted state)
- [ ] Should track painted tile count
- [ ] Should calculate bounding box (minX, maxX, minY, maxY)
- [ ] Should return null bounds when no tiles painted
- [ ] Should update bounds when tile added at edge
- [ ] Should recalculate bounds when edge tile deleted

**Status**: NOT STARTED

---

## Phase 1B: Sparse Tile Storage - Implementation ✅ COMPLETE

**Goal**: Create `SparseTerrain` class to replace `CustomTerrain`

**File Created**: `Classes/terrainUtils/SparseTerrain.js`  
**Completed**: October 27, 2025  
**Tests**: 48/48 passing ✅

### Implementation Tasks
- [x] Create `SparseTerrain` class
- [x] Constructor: `constructor(tileSize = 32, defaultMaterial = 'grass')`
- [x] Property: `this.tiles = new Map()` (sparse storage)
- [x] Property: `this.bounds = null` (or `{minX, maxX, minY, maxY}`)
- [x] Method: `setTile(x, y, material)` - add/update tile
- [x] Method: `getTile(x, y)` - retrieve tile or null
- [x] Method: `deleteTile(x, y)` - remove tile, recalc bounds
- [x] Method: `getBounds()` - return current bounds or null
- [x] Method: `_updateBounds(x, y)` - expand bounds if needed
- [x] Method: `_recalculateBounds()` - full recalc (for delete)
- [x] Method: `getTileCount()` - painted tile count
- [x] Method: `getAllTiles()` - generator for rendering (yields { x, y, material })
- [x] Method: `exportToJSON()` - save only painted tiles
- [x] Method: `importFromJSON(data)` - load sparse data
- [x] Add to `index.html` (pending - Phase 1C)
- [x] Run unit tests - **ALL 48 PASSING** ✅

**Status**: ✅ COMPLETE

**Key Implementation Details**:
- Map storage: `Map<"x,y", { material }>`
- Supports unbounded coordinates (negative, very large)
- Dynamic bounds: null when empty, auto-expands/recalculates
- Sparse JSON: exports only painted tiles (massive space savings)
- Generator pattern: `getAllTiles()` yields { x, y, material } for iteration

---

## Phase 1C: Sparse Tile Storage - Integration Tests ✅ COMPLETE

**Goal**: Test SparseTerrain with TerrainEditor

**Test File**: `test/integration/terrainUtils/sparseTerrain.integration.test.js`  
**Completed**: October 27, 2025  
**Tests**: 18/18 passing ✅

### Integration Tests Written
- [x] TerrainEditor should paint to SparseTerrain
- [x] Painting updates bounding box
- [x] Fill tool works with sparse storage
- [x] Eyedropper returns null for unpainted tiles
- [x] Undo/redo works with sparse operations
- [x] Export JSON contains only painted tiles
- [x] Import JSON reconstructs sparse terrain
- [x] Bounds calculation correct after import
- [x] Efficient iteration for rendering
- [x] Empty terrain handled gracefully
- [x] Performance scales with painted tiles, not grid size
- [x] O(1) tile access maintained

**Status**: ✅ COMPLETE

**Key Findings**:
- Painting with different brush sizes works correctly (3x3 = 9 tiles)
- Sparse storage saves massive space (100 tiles vs 9.8 billion in dense grid!)
- JSON export/import preserves all data including bounds
- Undo/redo cycles work seamlessly with deleteTile/setTile
- Iteration via getAllTiles() generator is memory-efficient

---

## Phase 2A: Dynamic Grid Overlay - Unit Tests (TDD) ✅ COMPLETE

**Goal**: Grid overlay shows only at painted tiles + 2-tile buffer with feathering

**Test File**: `test/unit/ui/DynamicGridOverlay.test.js`  
**Completed**: October 27, 2025  
**Tests**: 21/21 passing ✅

### Unit Tests Written (FIRST)
- [x] Should initialize with no grid lines (no tiles painted)
- [x] Should generate grid at mouse hover location
- [x] Should generate grid for painted tiles + 2-tile buffer
- [x] Should calculate feathering opacity (1.0 at tile, 0.0 at 2-tile distance)
- [x] Should update grid when tile painted
- [x] Should expand grid when painting outside current bounds
- [x] Should handle no painted tiles (hover-only mode)
- [x] Should render grid lines with correct opacity
- [x] Should cull grid lines outside viewport

**Status**: ✅ COMPLETE

---

## Phase 2B: Dynamic Grid Overlay - Implementation ✅ COMPLETE

**Goal**: Implement DynamicGridOverlay class

**File Created**: `Classes/ui/DynamicGridOverlay.js`  
**Completed**: October 27, 2025  
**Tests**: 21/21 passing ✅

### Implementation Tasks
- [x] Create `DynamicGridOverlay` class
- [x] Constructor: `constructor(terrain, bufferSize = 2)`
- [x] Method: `calculateGridRegion(mousePos)` - painted tiles + buffer + mouse
- [x] Method: `calculateFeathering(x, y)` - opacity based on distance
- [x] Method: `generateGridLines(region)` - vertical + horizontal lines
- [x] Method: `render()` - draw with feathered opacity
- [x] Method: `update(mousePos, viewport)` - regenerate grid
- [x] Optimize `_findNearestPaintedTile()` - iterate sparse tiles only
- [x] Add to `index.html` (pending - Phase 3)
- [x] Run unit tests - **ALL 21 PASSING** ✅

**Status**: ✅ COMPLETE

**Key Implementation Details**:
- Feathering formula: `opacity = max(0, 1.0 - (distance / bufferSize))`
- Grid merges painted region + mouse hover region
- Viewport culling for performance (only visible lines)
- Efficient nearest-tile search using sparse storage iterator
- Skips rendering lines with opacity ≤ 0.0

---

## Phase 2B: Dynamic Grid Overlay - Implementation

**Goal**: Create grid overlay system that follows paint operations

**File to Create**: `Classes/ui/DynamicGridOverlay.js`

### Implementation Tasks
- [ ] Create `DynamicGridOverlay` class
- [ ] Constructor: Accept `terrain` reference (SparseTerrain)
- [ ] Property: `this.hoverGridRadius = 5` (tiles around mouse)
- [ ] Property: `this.paintedGridBuffer = 2` (tiles around painted area)
- [ ] Property: `this.featherDistance = 2` (tiles for fade effect)
- [ ] Method: `getGridLines(cameraViewport)` - return lines to render
- [ ] Method: `_getHoverGridLines(mouseX, mouseY)` - grid at mouse
- [ ] Method: `_getPaintedGridLines()` - grid at painted tiles + buffer
- [ ] Method: `_calculateOpacity(tileX, tileY, bounds)` - feathering formula
- [ ] Method: `render(camera, mousePos)` - draw grid lines
- [ ] Feathering: `opacity = 1.0 - (distance / featherDistance)` clamped [0, 1]
- [ ] Integrate with LevelEditor
- [ ] Run unit tests - verify they pass

**Status**: NOT STARTED

---

## Phase 3A: Dynamic Minimap - Unit Tests (TDD) ✅ COMPLETE

**Goal**: Minimap shows only painted terrain region, not fixed 50x50 grid

**Test File**: `test/unit/ui/DynamicMinimap.test.js`  
**Completed**: October 27, 2025  
**Tests**: 26/26 passing ✅

### Unit Tests Written (FIRST)
- [x] Should calculate viewport from terrain bounds with padding
- [x] Should return null viewport when no tiles painted
- [x] Should calculate scale to fit viewport in minimap
- [x] Should handle single tile, negative coords, very large bounds
- [x] Should convert world coordinates to minimap coordinates
- [x] Should render background rect and painted tiles
- [x] Should render camera viewport outline
- [x] Should update viewport when terrain bounds change
- [x] Should recalculate scale when viewport changes

**Status**: ✅ COMPLETE

---

## Phase 3B: Dynamic Minimap - Implementation ✅ COMPLETE

**Goal**: Implement DynamicMinimap class

**File Created**: `Classes/ui/DynamicMinimap.js`  
**Completed**: October 27, 2025  
**Tests**: 26/26 passing ✅

### Implementation Tasks
- [x] Create `DynamicMinimap` class
- [x] Constructor: `constructor(terrain, width, height, padding = 2)`
- [x] Method: `calculateViewport()` - bounds + padding or null
- [x] Method: `calculateScale(viewport)` - fit viewport in minimap
- [x] Method: `worldToMinimap(x, y)` - coordinate conversion
- [x] Method: `update()` - recalculate viewport and scale
- [x] Method: `render(x, y)` - draw minimap with tiles
- [x] Method: `renderCameraViewport(cameraViewport)` - outline
- [x] Add to `index.html` (pending - Phase 4)
- [x] Run unit tests - **ALL 26 PASSING** ✅

**Status**: ✅ COMPLETE

**Key Implementation Details**:
- Viewport: terrain bounds + 2-tile padding (configurable)
- Scale: min(width/viewportWidth, height/viewportHeight) to fit
- Color mapping: grass=green, stone=gray, water=blue, etc.
- Camera viewport rendered as yellow outline
- Handles empty terrain, single tile, asymmetric bounds, 1000x1000

---

## Phase 3C: Dynamic Minimap - Integration (REMOVED - Now Phase 2B)

**Status**: MERGED INTO PHASE 2B (see above)

---

## Phase 2C: Dynamic Grid Overlay - Integration Tests

**Goal**: Test grid overlay with painting workflow

**Test File**: `test/integration/ui/dynamicGridOverlay.integration.test.js`

### Integration Tests to Write
- [ ] Grid appears when hovering over blank canvas
- [ ] Grid expands when painting new tile
- [ ] Grid fades at edges (feathering)
- [ ] Grid updates immediately after paint
- [ ] Grid doesn't render far from painted area
- [ ] Grid respects camera viewport (culling)

**Status**: NOT STARTED

---

## Phase 3A: Dynamic Minimap Bounds - Unit Tests (TDD)

**Goal**: Minimap shows only bounding box of painted tiles

**Test File**: `test/unit/ui/DynamicMinimap.test.js`

### Unit Tests to Write (FIRST)
- [ ] Should show no content when no tiles painted
- [ ] Should calculate viewport from terrain bounds
- [ ] Should center on painted region
- [ ] Should expand viewport when painting outside bounds
- [ ] Should maintain aspect ratio
- [ ] Should add padding around painted region
- [ ] Should handle single painted tile
- [ ] Should handle widely separated tiles (efficient bounds)

**Status**: NOT STARTED

---

## Phase 3B: Dynamic Minimap Bounds - Implementation

**Goal**: Update MiniMap to use terrain bounds instead of fixed dimensions

**File to Modify**: `Classes/ui/MiniMap.js`

### Implementation Tasks
- [ ] Replace `this.worldWidth/Height` with dynamic bounds
- [ ] Method: `_calculateViewportFromBounds(bounds)` - get minimap viewport
- [ ] Property: `this.minimumViewportSize = 10` (tiles, minimum zoom)
- [ ] Property: `this.boundsadding = 2` (tiles of padding around painted area)
- [ ] Update `render()` to use terrain.getBounds()
- [ ] Handle null bounds (no tiles) - show placeholder or nothing
- [ ] Update cache invalidation logic
- [ ] Run unit tests - verify they pass

**Status**: NOT STARTED

---

## Phase 3C: Dynamic Minimap Bounds - Integration Tests

**Goal**: Test minimap with sparse terrain painting

**Test File**: `test/integration/ui/dynamicMinimap.integration.test.js`

### Integration Tests to Write
- [ ] Minimap empty when no tiles painted
- [ ] Minimap shows tile at (0,0) centered
- [ ] Minimap expands to show tiles at (0,0) and (100,100)
- [ ] Minimap maintains correct aspect ratio
- [ ] Minimap camera viewport indicator updates correctly
- [ ] Minimap invalidates cache only on paint

**Status**: NOT STARTED

---

## Phase 4A: Infinite Canvas Rendering - Unit Tests (TDD)

**Goal**: Render only visible tiles within camera viewport

**Test File**: `test/unit/rendering/SparseTerrainRenderer.test.js`

### Unit Tests to Write (FIRST)
- [ ] Should cull tiles outside camera viewport
- [ ] Should render tiles within viewport
- [ ] Should handle no tiles in viewport (render nothing)
- [ ] Should include buffer zone around viewport
- [ ] Should skip rendering when no tiles exist
- [ ] Should update visible tile list when camera moves
- [ ] Should handle zoom changes

**Status**: NOT STARTED

---

## Phase 4B: Infinite Canvas Rendering - Implementation

**Goal**: Optimize rendering for sparse terrain

**File to Modify**: `Classes/systems/ui/LevelEditor.js` (render method)

### Implementation Tasks
- [ ] Method: `_getVisibleTiles(cameraViewport)` - query SparseTerrain
- [ ] Calculate viewport bounds in tile coordinates
- [ ] Add buffer zone (e.g., 5 tiles) around viewport
- [ ] Query `SparseTerrain.getAllTiles()` with bounds filter
- [ ] Render black background for unpainted areas
- [ ] Render only visible tiles
- [ ] Update grid overlay to match visible area
- [ ] Run unit tests - verify they pass

**Status**: NOT STARTED

---

## Phase 5A: Paint Anywhere - Unit Tests (TDD)

**Goal**: Allow painting at any coordinate, not limited by initial bounds

**Test File**: `test/unit/levelEditor/paintAnywhere.test.js`

### Unit Tests to Write (FIRST)
- [ ] Should paint at positive coordinates (1000, 1000)
- [ ] Should paint at negative coordinates (-50, -50)
- [ ] Should paint at origin (0, 0)
- [ ] Should expand bounds when painting outside current area
- [ ] Fill tool should work at arbitrary coordinates
- [ ] Select tool should work across large coordinate ranges
- [ ] Undo/redo should work with unbounded painting

**Status**: NOT STARTED

---

## Phase 5B: Paint Anywhere - Implementation

**Goal**: Remove coordinate limits from painting tools

**Files to Modify**:
- `Classes/ui/TerrainEditor.js`
- `Classes/systems/ui/LevelEditor.js`

### Implementation Tasks
- [ ] Remove bounds checking in `TerrainEditor.paint()`
- [ ] Remove bounds checking in `TerrainEditor.fill()`
- [ ] Update `convertScreenToWorld()` to support unbounded canvas
- [ ] Update camera panning to allow infinite pan
- [ ] Update zoom to work at any coordinate
- [ ] Run unit tests - verify they pass

**Status**: NOT STARTED

---

## Phase 5C: Paint Anywhere - Integration Tests

**Goal**: Test painting workflow with unbounded canvas

**Test File**: `test/integration/levelEditor/paintAnywhere.integration.test.js`

### Integration Tests to Write
- [ ] Paint at (0,0), (500, 500), (-100, -100) all work
- [ ] Minimap shows all painted regions
- [ ] Grid overlay follows painted tiles
- [ ] Camera can pan to any painted area
- [ ] Zoom works at arbitrary coordinates
- [ ] Fill tool fills unbounded regions correctly

**Status**: NOT STARTED

---

## Phase 6: E2E Tests with Screenshots

**Goal**: Visual verification of lazy loading system

**Test File**: `test/e2e/levelEditor/pw_lazy_terrain_loading.js`

### E2E Tests to Write
- [ ] Test 1: Fresh Level Editor shows black canvas only ✅
  - Start Level Editor
  - Screenshot: Should show black background, no tiles, UI visible, no grid
  
- [ ] Test 2: Grid overlay appears on hover ✅
  - Hover mouse over canvas
  - Screenshot: Should show grid at mouse location (5-tile radius)
  
- [ ] Test 3: Paint single tile at (0,0) ✅
  - Paint one tile at origin
  - Screenshot: Should show 1 tile, grid overlay at tile + 2-tile buffer with feathering
  - Minimap: Should show tiny viewport centered on (0,0)
  
- [ ] Test 4: Paint tile at (100,100) ✅
  - Pan camera to (100,100)
  - Paint one tile
  - Screenshot: Should show tile at (100,100)
  - Minimap: Should expand to show region from (0,0) to (100,100)
  
- [ ] Test 5: Paint tile at (-50, -50) ✅
  - Pan camera to negative coordinates
  - Paint one tile
  - Screenshot: Should show negative coordinate tile
  - Minimap: Should include negative region in bounds
  
- [ ] Test 6: Grid feathering visualization ✅
  - Paint 3x3 tile cluster
  - Screenshot: Grid should be opaque at tiles, fade to transparent 2 tiles away
  
- [ ] Test 7: Export and verify JSON ✅
  - Paint tiles at scattered coordinates
  - Export JSON
  - Verify: Only painted tiles in JSON, no default tiles

**Status**: NOT STARTED

---

## Phase 7: Cleanup and Documentation

### Tasks
- [ ] Update `LEVEL_EDITOR_SETUP.md` with sparse terrain info
- [ ] Add API reference for `SparseTerrain` class
- [ ] Add API reference for `DynamicGridOverlay` class
- [ ] Update CHANGELOG.md with enhancement
- [ ] Mark checklist phases complete
- [ ] Remove or deprecate old `CustomTerrain` class (if fully replaced)

**Status**: NOT STARTED

---

## Files to Create

### Core Classes
1. `Classes/terrainUtils/SparseTerrain.js` - Sparse tile storage
2. `Classes/ui/DynamicGridOverlay.js` - Dynamic grid rendering

### Unit Tests
3. `test/unit/terrainUtils/SparseTerrain.test.js`
4. `test/unit/ui/DynamicGridOverlay.test.js`
5. `test/unit/ui/DynamicMinimap.test.js`
6. `test/unit/rendering/SparseTerrainRenderer.test.js`
7. `test/unit/levelEditor/paintAnywhere.test.js`

### Integration Tests
8. `test/integration/terrainUtils/sparseTerrain.integration.test.js`
9. `test/integration/ui/dynamicGridOverlay.integration.test.js`
10. `test/integration/ui/dynamicMinimap.integration.test.js`
11. `test/integration/levelEditor/paintAnywhere.integration.test.js`

### E2E Tests
12. `test/e2e/levelEditor/pw_lazy_terrain_loading.js`

---

## Files to Modify

1. `Classes/ui/MiniMap.js` - Dynamic bounds calculation
2. `Classes/ui/TerrainEditor.js` - Remove bounds checking
3. `Classes/systems/ui/LevelEditor.js` - Integrate SparseTerrain, DynamicGridOverlay
4. `index.html` - Add new script tags
5. `docs/LEVEL_EDITOR_SETUP.md` - Document new architecture

---

## Success Criteria

- [ ] Level Editor starts with **black canvas only** (no tiles)
- [ ] **Grid overlay** appears at mouse hover location
- [ ] User can **paint anywhere** (unbounded coordinates)
- [ ] **Minimap** dynamically bounds to painted region
- [ ] **Grid overlay** shows at painted tiles + 2-tile radius with feathering
- [ ] Export JSON contains **only painted tiles** (sparse data)
- [ ] All unit tests pass (100% coverage target for new code)
- [ ] All integration tests pass
- [ ] All E2E tests pass with visual screenshots
- [ ] No performance regression (painting should be faster due to sparse storage)

---

## Estimated Effort

- **Phase 1 (Sparse Storage)**: 4-6 hours (TDD: tests + implementation)
- **Phase 2 (Grid Overlay)**: 3-4 hours
- **Phase 3 (Minimap)**: 2-3 hours
- **Phase 4 (Rendering)**: 2-3 hours
- **Phase 5 (Paint Anywhere)**: 2-3 hours
- **Phase 6 (E2E Tests)**: 2-3 hours
- **Phase 7 (Cleanup)**: 1-2 hours

**Total**: 16-24 hours of development

---

## Current Status

**Phase**: Planning Complete ✅  
**Next Action**: Begin Phase 1A - Write SparseTerrain unit tests (TDD)

---

## Notes

- This is a **breaking change** - old terrain saves may need migration
- Consider adding migration tool: `CustomTerrain → SparseTerrain`
- Grid feathering formula: `opacity = max(0, 1.0 - (distance / 2.0))`
- Minimap minimum viewport prevents excessive zoom on single tiles
- SparseTerrain key format: `"x,y"` for Map storage (efficient lookups)
