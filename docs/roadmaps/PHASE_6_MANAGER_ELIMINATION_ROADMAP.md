# Phase 6: Manager Elimination & Unified WorldService - Roadmap

**Status**: 🚀 REVISED - Radical Simplification  
**Start Date**: November 5, 2025  
**Estimated Duration**: 20-30 hours (3-5 days)  
**Goal**: Eliminate ALL 30+ manager classes + 8 rendering classes, replace with ONE WorldService (~800 lines), reduce globals from 40+ to 1

---

## 🎯 CRITICAL CHANGE: Simplified Architecture

~~**REJECTED**: 7-service architecture (EntityService, WorldService, CameraService, etc.) - Over-engineered~~

**NEW APPROACH**: Single unified WorldService that owns the entire game world.

### **EntityService + WorldService Merge Decision**

**Question**: Should EntityService and WorldService be separate?

**Answer**: NO - Merge them into one service

**Why?**
1. **Entities tightly coupled to rendering** - Need camera, spatial grid, effects
2. **No reuse planned** - EntityService won't be used outside WorldService
3. **Avoid overlap** - Both would manage entity registry (confusion)
4. **Simplification goal** - 1 file better than 2 files
5. **Single responsibility** - WorldService IS the game world (entities are part of that)

**Architecture**:
```
BEFORE (EntityService separate):
┌─────────────────────┐
│   WorldService      │
│  - terrain          │
│  - camera           │
│  - rendering        │
│  - input            │
│  ↓ depends on       │
│  EntityService ────→│ ← Dependency coupling
│   - entities        │
│   - factories       │
└─────────────────────┘

AFTER (EntityService merged):
┌─────────────────────┐
│   WorldService      │
│  - entities ✅      │ ← Merged from EntityService
│  - factories ✅     │
│  - terrain          │
│  - camera           │
│  - spatial          │
│  - rendering        │
│  - input            │
│  - effects          │
│  - UI               │
│  - audio            │
└─────────────────────┘
Single source of truth, no dependencies
```

**Result**: EntityService.js (346 LOC) → merged into WorldService.js

---

## 📋 Overview

### The Problem
- **30+ Manager classes** scattered across codebase (AntManager, ResourceSystemManager, BuildingManager, MapManager, etc.)
- **8+ Rendering classes** (RenderLayerManager 1228 LOC, EffectsLayerRenderer 1107 LOC, UILayerRenderer 850 LOC, etc.)
- **27 Systems files** with mixed responsibilities (some managers, some features, some utils)
- **40+ Global variables** (g_map2, spatialGridManager, cameraManager, draggablePanelManager, etc.)
- **Tight coupling** between systems (managers reference each other directly)
- **No centralized architecture** (each system does its own thing)
- **Hard to test** (mocking globals is painful)
- **~24,105 lines of coordinator code** (~8000 managers + ~6105 rendering + ~10,000 systems = 24,105 total)

### The Solution: Single WorldService
```javascript
// ONE global: world
const world = new WorldService();

// All systems unified in one service
world.spawnEntity('Ant', x, y, options)          // Replaces AntManager, BuildingManager, ResourceSystemManager
world.getTileAt(x, y)                            // Replaces MapManager
world.getNearbyEntities(x, y, radius)            // Replaces SpatialGridManager
world.screenToWorld(x, y)                        // Replaces CameraSystemManager
world.handleMousePress(x, y)                     // Replaces MouseInputController
world.registerPanel(panel)                       // Replaces DraggablePanelManager
world.playSound(name)                            // Replaces soundManager
world.render()                                   // Replaces RenderLayerManager + 7 renderer classes
```

### Expected Impact
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Manager classes | 30+ files (~8000 LOC) | **0 files** | **-100%** |
| Rendering classes | 8 files (~6105 LOC) | **Integrated into WorldService** | **-100%** |
| Systems files | 27 files (~10,000 LOC) | **22 files (~8,650 LOC)** | **-19% files, -14% LOC** |
| Total coordinator LOC | ~24,105 lines | **~1,600 lines (WorldService)** | **-93%** |
| Global variables | 40+ | **1 (world)** | **-98%** |
| Coupling | High (direct refs) | **Zero (single class)** | **Massive** |
| Testability | Hard (global mocks) | **Easy (one mock)** | **Massive** |
| Files to eliminate | 65+ files | **43 files deleted** | **-66%** |

---

## 🎨 Rendering Pipeline Analysis

### Current Rendering System (8+ files, ~5000 LOC)

**RenderLayerManager** (1228 LOC):
- Layer management (TERRAIN → ENTITIES → EFFECTS → UI_GAME → UI_DEBUG → UI_MENU)
- Drawable callbacks per layer
- Interactive element dispatch (hitTest, pointer events)
- Performance tracking
- Cache invalidation
- **Complexity**: Heavy coordinator with global registration system

**EntityLayerRenderer** (472 LOC):
- Entity grouping (BACKGROUND, RESOURCES, ANTS, EFFECTS, FOREGROUND)
- Depth sorting
- Frustum culling (disabled)
- Batch rendering (unused)
- **Can be simplified**: Just iterate entities and call `.render()`

**EffectsLayerRenderer** (1107 LOC):
- Particle systems, screen effects
- **Overbuilt**: Most complexity unused

**UILayerRenderer** (850 LOC):
- UI panel rendering coordination
- **Redundant**: Panels already render themselves

**CacheManager** (651 LOC):
- LRU eviction, memory budgets
- Multiple strategies (FullBuffer, DirtyRect, Tiled)
- **Keep minimal caching**: Only terrain needs caching

**Other** (~1700 LOC):
- RenderController, UIController, PerformanceMonitor, etc.
- **Most can be eliminated**: Slim down to essential features

### How WorldService Replaces This

**Simple layer rendering** (~150 lines in WorldService):
```javascript
// Inside WorldService
render() {
  // Layer 1: Terrain (with simple cache)
  if (this._terrain) {
    if (!this._terrainCache || this._terrainDirty) {
      this._cacheTerrainLayer();
    }
    image(this._terrainCache, 0, 0);
  }
  
  // Layer 2: Entities (depth-sorted if needed)
  const entities = Array.from(this._entities.values());
  if (this._enableDepthSort) {
    entities.sort((a, b) => a.position.y - b.position.y);
  }
  for (const entity of entities) {
    entity.render();
  }
  
  // Layer 3: Effects (if we even need this)
  for (const effect of this._effects) {
    effect.render();
  }
  
  // Layer 4: UI Panels
  for (const panel of this._panels.values()) {
    panel.render();
  }
  
  // Layer 5: Debug overlay (if enabled)
  if (this._showDebug) {
    this._renderDebugOverlay();
  }
}
```

**What we eliminate**:
- ❌ Complex layer registration system
- ❌ Drawable callback arrays
- ❌ Interactive drawable hitTest systems (move to entity controllers)
- ❌ Render groups (BACKGROUND, RESOURCES, ANTS) - just iterate entities
- ❌ Frustum culling (unused anyway)
- ❌ Batch rendering (unused)
- ❌ LRU cache eviction (overkill for game this size)
- ❌ Multiple cache strategies (just cache terrain)
- ❌ Performance monitor (use browser DevTools)

**What we keep** (simplified):
- ✅ Layer ordering (hardcoded: terrain → entities → effects → UI)
- ✅ Terrain caching (single cached p5.Graphics)
- ✅ Depth sorting for entities (optional, simple y-sort)
- ✅ Entity rendering delegation (entities render themselves)

**Result**: ~5000 LOC → ~150 LOC in WorldService (97% reduction)

---

## 🗺️ Phase Breakdown

### Phase 6.1: WorldService Core (8-10 hours)
**Goal**: Create unified WorldService with entity registry, terrain, spatial grid, rendering, panel management

**Architecture Decision**: Fold EntityService + Panel Management + Crosshair into WorldService
- **Why**: Entities tightly coupled to rendering, camera, spatial grid
- **Panel Management**: DraggablePanelManager is a manager pattern (exactly what we're eliminating)
- **Crosshair**: Simple HUD overlay, no complex state
- **Result**: One unified service instead of multiple managers
- **Trade-off**: Larger class (~1600 LOC) but massively simpler architecture

**Systems Analysis**: See `docs/roadmaps/SYSTEMS_CONSOLIDATION_ANALYSIS.md` for full breakdown

**Implementation**:
```javascript
// Classes/services/WorldService.js (~1600 lines total)

class WorldService {
  constructor(antFactory, buildingFactory, resourceFactory) {
    // === ENTITIES (EntityService merged) ===
    this._entities = new Map();
    this._nextEntityId = 0;
    this._antFactory = antFactory;
    this._buildingFactory = buildingFactory;
    this._resourceFactory = resourceFactory;
    
    // === TERRAIN ===
    this._terrain = null;
    this._terrainCache = null;
    this._terrainDirty = true;
    
    // === SPATIAL ===
    this._spatialGrid = new SpatialGrid(64);
    
    // === CAMERA ===
    this._camera = { x: 0, y: 0, zoom: 1.0 };
    
    // === INPUT ===
    this._mouse = { x: 0, y: 0, pressed: false };
    this._keys = new Map();
    
    // === UI PANELS (DraggablePanelManager merged) ===
    this._panels = new Map();
    this._activePanelId = null;
    this._panelZIndex = 0;
    
    // === RENDERING ===
    this._enableDepthSort = true;
    this._activeEffects = [];
    this._hudVisible = true;
    this._crosshairEnabled = true; // MouseCrosshair merged
    this._crosshairOverEntity = false;
    
    // === AUDIO ===
    this._sounds = new Map();
    this._volume = 1.0;
  }
  
  // === ENTITY API (~250 lines - from EntityService) ===
  spawnEntity(type, x, y, options) {
    const id = this._nextEntityId++;
    let entity;
    
    switch(type) {
      case 'Ant':
        entity = this._antFactory.createScout(x, y, options.faction);
        break;
      case 'Building':
        entity = this._buildingFactory.createAntCone(x, y, options.faction);
        break;
      case 'Resource':
        entity = this._resourceFactory.createResource(options.resourceType, x, y);
        break;
    }
    
    // Enforce consistent interface (replaces EntityAccessor)
    entity._id = id;
    if (!entity.getPosition && entity.position) {
      entity.getPosition = () => entity.position;
    }
    
    this._entities.set(id, entity);
    this._spatialGrid.insert(entity);
    return entity;
  }
  
  getEntityById(id) { return this._entities.get(id); }
  getEntitiesByType(type) { /* filter by type */ }
  getNearbyEntities(x, y, radius) { return this._spatialGrid.query(x, y, radius); }
  destroyEntity(id) { /* remove + cleanup */ }
  
  // === PANEL API (~100 lines - from DraggablePanelManager) ===
  registerPanel(panel) {
    const id = panel.id || `panel_${this._panels.size}`;
    this._panels.set(id, panel);
    panel.zIndex = this._panelZIndex++;
    return id;
  }
  
  removePanel(id) { 
    this._panels.delete(id); 
  }
  
  bringToFront(id) {
    const panel = this._panels.get(id);
    if (panel) {
      panel.zIndex = this._panelZIndex++;
      this._activePanelId = id;
    }
  }
  
  getPanelById(id) { return this._panels.get(id); }
  getAllPanels() { return Array.from(this._panels.values()); }
  
  // === TERRAIN API (~100 lines) ===
  loadTerrain(data) { /* ... */ }
  getTileAt(x, y) { /* ... */ }
  getTerrainType(x, y) { /* ... */ }
  _cacheTerrainLayer() { /* cache to p5.Graphics */ }
  
  // === CAMERA API (~100 lines) ===
  setCameraPosition(x, y) { /* ... */ }
  screenToWorld(x, y) { /* ... */ }
  worldToScreen(x, y) { /* ... */ }
  
  // === INPUT API (~150 lines) ===
  handleMousePress(x, y) { /* ... */ }
  handleMouseMove(x, y) { /* ... */ }
  handleMouseRelease(x, y) { /* ... */ }
  handleKeyPress(key) { /* ... */ }
  
  // === UI API (~100 lines) ===
  registerPanel(panel) { /* ... */ }
  removePanel(id) { /* ... */ }
  
  // === RENDERING API (~200 lines) ===
  render() {
    // Terrain layer (cached)
    if (this._terrain) {
      if (!this._terrainCache || this._terrainDirty) {
        this._cacheTerrainLayer();
      }
      image(this._terrainCache, 0, 0);
    }
    
    // Entity layer (depth-sorted)
    const entities = Array.from(this._entities.values());
    if (this._enableDepthSort) {
      entities.sort((a, b) => a.position.y - b.position.y);
    }
    for (const entity of entities) {
      entity.render();
    }
    
    // UI layer (z-ordered panels)
    const sortedPanels = Array.from(this._panels.values())
      .sort((a, b) => a.zIndex - b.zIndex);
    for (const panel of sortedPanels) {
      panel.render();
    }
    
    // HUD layer
    if (this._hudVisible) {
      this._renderCrosshair(); // MouseCrosshair merged
    }
    
    // Debug overlay
    if (this._showDebug) this._renderDebugOverlay();
  }
  
  _renderCrosshair() {
    // ~30 lines from MouseCrosshair.js
    if (!this._crosshairEnabled) return;
    
    const color = this._crosshairOverEntity 
      ? [0, 255, 0, 200] // Green when over entity
      : [255, 255, 255, 150]; // White normally
    
    push();
    stroke(color);
    strokeWeight(2);
    const size = 20;
    line(mouseX - size, mouseY, mouseX + size, mouseY);
    line(mouseX, mouseY - size, mouseX, mouseY + size);
    pop();
  }
  
  // === AUDIO API (~50 lines) ===
  playSound(name) { /* ... */ }
  setVolume(level) { /* ... */ }
  
  // === UPDATE (~50 lines) ===
  update(deltaTime) {
    // Update entities
    for (const entity of this._entities.values()) {
      entity.update(deltaTime);
      this._spatialGrid.update(entity);
    }
    
    // Update panels
    for (const panel of this._panels.values()) {
      panel.update(deltaTime);
    }
  }
}
```

**Tasks**:
1. ✅ **Write 113 comprehensive tests FIRST** (TDD - see WorldService.test.js)
2. ✅ **Merge EntityService.js into WorldService.js** (consolidate entity management)
3. ✅ **Merge DraggablePanelManager.js** (panel registry, z-ordering, drag/drop)
4. ✅ **Merge MouseCrosshair.js** (HUD rendering)
5. ✅ Create unified WorldService with all subsystems
6. ✅ Implement entity registry with factory delegation
7. ✅ Implement terrain API (load, query, simple caching)
8. ✅ Implement spatial grid integration
9. ✅ Implement simplified rendering (hardcoded layer order)
10. ✅ Implement panel management API (register, remove, bringToFront)
11. ✅ Implement crosshair rendering (HUD overlay)
12. ✅ Implement basic effects system (SimpleParticle)
13. ✅ Run all tests (confirm 113 tests pass)

**What Gets Eliminated**:

**Managers** (30+ files, ~8000 LOC):
- ❌ AntManager (680 LOC) → WorldService entity registry
- ❌ BuildingManager (120 LOC) → WorldService entity registry
- ❌ ResourceSystemManager (883 LOC) → WorldService entity registry
- ❌ MapManager (450 LOC) → WorldService terrain API
- ❌ SpatialGridManager (442 LOC) → WorldService spatial grid
- ❌ CameraSystemManager (~300 LOC) → WorldService camera API
- ❌ MouseInputController (~200 LOC) → WorldService input API
- ❌ KeyboardInputController (~150 LOC) → WorldService input API
- ❌ ShortcutManager (~200 LOC) → WorldService keyboard shortcuts
- ❌ DraggablePanelManager (~600 LOC) → WorldService UI panel registry
- ❌ soundManager (~100 LOC) → WorldService audio API
- ❌ + 20 more managers (~4000 LOC)

**Rendering** (8 files, ~6105 LOC):
- ❌ RenderLayerManager (1228 LOC) → WorldService.render()
- ❌ EntityLayerRenderer (472 LOC) → WorldService entity iteration
- ❌ EffectsLayerRenderer (1107 LOC) → SimpleParticle class
- ❌ UILayerRenderer (850 LOC) → WorldService._renderHUD()
- ❌ CacheManager (651 LOC) → WorldService terrain cache
- ❌ PerformanceMonitor (918 LOC) → Use browser DevTools
- ❌ UIDebugManager (705 LOC) → Fixed UI positions
- ❌ EntityDelegationBuilder (544 LOC) → Direct method calls
- ❌ EntityAccessor (183 LOC) → Interface normalization at spawn
- ❌ UIController (570 LOC) → WorldService keyboard shortcuts
- ⚠️ RenderController (829 → 400 LOC) → Simplified version kept
- ✅ EventFlagRenderer (201 LOC) → Keep for level editor

**Systems** (5 files, ~1927 LOC eliminated):
- ❌ DraggablePanelManager.js (~600 LOC) → WorldService panel API
- ❌ DraggablePanelSystem.js (~200 LOC) → WorldService panel coordination
- ❌ MouseCrosshair.js (178 LOC) → WorldService._renderCrosshair()
- ❌ FramebufferManager.js (749 LOC) → WorldService simple terrain cache
- ❌ UIVisibilityCuller.js (~200 LOC) → Premature optimization, unused

**What Gets Kept** (24 files, ~8850 LOC):
- ✅ RenderController.js (simplified to ~400 LOC)
- ✅ EventFlagRenderer.js (201 LOC - level editor feature)
- ✅ 22 systems files (~8,650 LOC - see SYSTEMS_CONSOLIDATION_ANALYSIS.md)
  - Core utilities: SpatialGrid, CoordinateConverter, CollisionBox2D
  - Domain logic: newPathfinding, pheromones, ResourceNode, Nature
  - Combat: FireballSystem, LightningSystem
  - UI: DraggablePanel (base), menu, pauseMenu, panels, Button
  - Level Editor: LevelEditor (2353 LOC), tools, brushes
  - Debug: GatherDebugRenderer
  - Dialogue: DialogueDemo

**New Code** (~1600 LOC):
- WorldService.js (~1600 LOC total)
  - Entity management (~250 LOC from EntityService)
  - Terrain API (~100 LOC)
  - Spatial grid (~50 LOC)
  - Camera API (~100 LOC)
  - Input API (~150 LOC)
  - Rendering (~200 LOC with crosshair)
  - Effects (~100 LOC)
  - HUD (~100 LOC with crosshair)
  - UI panels (~100 LOC from DraggablePanelManager)
  - Panel coordination (~70 LOC from DraggablePanelSystem)
  - Audio (~50 LOC)
  - Keyboard shortcuts (~50 LOC)
  - Update loop (~50 LOC)

**Total Impact**:
- **Delete**: 43 files, ~16,032 LOC (managers 8000 + rendering 6105 + systems 1927)
- **Create**: 1 file, ~1,600 LOC (WorldService)
- **Keep**: 24 files, ~8,850 LOC (2 rendering + 22 systems)
- **NET REDUCTION**: -84% (-14,432 LOC)

---

### ~~Phase 6.1: EntityService - Unify Entity Management (12-16 hours)~~
~~**DEPRECATED**: Replaced by unified WorldService~~
**Goal**: Consolidate AntManager, BuildingManager, ResourceSystemManager into one EntityService

**Current Managers**:
- `AntManager` (289 lines) - Ant registry, creation, queries
- `BuildingManager` (120 lines) - Building registry, spawn queue
- `ResourceSystemManager` (865 lines) - Resource spawning, detection, persistence

**New Service**:
```javascript
// Classes/services/EntityService.js
class EntityService {
  constructor() {
    this._entities = new Map();  // Unified entity registry (ID → entity)
    this._nextId = 0;
    
    // Factories (inject dependencies)
    this._antFactory = null;
    this._buildingFactory = null;
    this._resourceFactory = null;
  }
  
  // Unified API
  spawn(type, options) {
    switch(type) {
      case 'Ant': return this._antFactory.create(options);
      case 'Building': return this._buildingFactory.create(options);
      case 'Resource': return this._resourceFactory.create(options);
    }
  }
  
  getById(id) { return this._entities.get(id); }
  getByType(type) { /* filter by type */ }
  getByFaction(faction) { /* filter by faction */ }
  
  update(deltaTime) { /* update all entities */ }
  destroy(id) { /* remove entity */ }
  clearAll() { /* reset state */ }
}
```

**Migration Steps**:
1. ✅ Write EntityService tests (TDD - 40-50 tests)
2. ✅ Implement EntityService with unified registry
3. ✅ Integrate AntFactory, BuildingFactory, ResourceFactory
4. ✅ Update sketch.js to use gameContext.entities
5. ✅ Deprecate AntManager, BuildingManager, ResourceSystemManager
6. ✅ Run full test suite (expect 603+ tests passing)

**Breaking Changes**:
- `g_antManager.createAnt()` → `gameContext.entities.spawn('Ant', { ... })`
- `g_buildingManager.createBuilding()` → `gameContext.entities.spawn('Building', { ... })`
- `g_resourceSystemManager.spawnResource()` → `gameContext.entities.spawn('Resource', { ... })`

---

### Phase 6.2: WorldService - Unify World Management (10-14 hours)
**Goal**: Consolidate MapManager, SpatialGridManager, TileInteractionManager

**Current Managers**:
- `MapManager` - Terrain generation, tile queries, pathfinding integration
- `SpatialGridManager` - Spatial partitioning for collision/queries
- `TileInteractionManager` - Tile click detection, terrain interaction

**New Service**:
```javascript
// Classes/services/WorldService.js
class WorldService {
  constructor() {
    this._map = null;                  // MapManager functionality
    this._spatialGrid = null;          // SpatialGridManager functionality
    this._tileInteraction = null;      // TileInteractionManager functionality
  }
  
  // Map API
  loadMap(data) { /* terrain loading */ }
  getTileAt(x, y) { /* tile queries */ }
  getTerrainType(x, y) { /* terrain info */ }
  
  // Spatial API
  getNearbyEntities(x, y, radius) { /* spatial queries */ }
  addEntity(entity) { /* register with spatial grid */ }
  removeEntity(entity) { /* unregister */ }
  
  // Interaction API
  handleTileClick(x, y) { /* tile click logic */ }
  getInteractiveTile(x, y) { /* clickable tiles */ }
}
```

**Migration Steps**:
1. ✅ Write WorldService tests (TDD - 30-40 tests)
2. ✅ Implement WorldService (wrap existing systems)
3. ✅ Update sketch.js to use gameContext.world
4. ✅ Deprecate MapManager, SpatialGridManager, TileInteractionManager
5. ✅ Run integration tests (map + entities)

**Breaking Changes**:
- `g_map2.getTileAtGridCoords()` → `gameContext.world.getTileAt()`
- `spatialGridManager.getNearbyEntities()` → `gameContext.world.getNearbyEntities()`

---

### Phase 6.3: CameraService - Camera System (4-6 hours)
**Goal**: Consolidate CameraSystemManager

**Current Manager**:
- `CameraSystemManager` - Camera position, zoom, bounds, transforms

**New Service**:
```javascript
// Classes/services/CameraService.js
class CameraService {
  constructor() {
    this._position = { x: 0, y: 0 };
    this._zoom = 1.0;
    this._bounds = null;
  }
  
  setPosition(x, y) { /* move camera */ }
  setZoom(level) { /* zoom in/out */ }
  screenToWorld(x, y) { /* coordinate transform */ }
  worldToScreen(x, y) { /* coordinate transform */ }
  
  update(deltaTime) { /* smooth camera movement */ }
}
```

**Migration Steps**:
1. ✅ Write CameraService tests (TDD - 15-20 tests)
2. ✅ Implement CameraService
3. ✅ Update sketch.js to use gameContext.camera
4. ✅ Deprecate CameraSystemManager

**Breaking Changes**:
- `cameraManager.setPosition()` → `gameContext.camera.setPosition()`

---

### Phase 6.4: InputService - Input System (8-12 hours)
**Goal**: Consolidate MouseInputController, KeyboardInputController, ShortcutManager

**Current Managers**:
- `MouseInputController` - Mouse events, click detection
- `KeyboardInputController` - Key events, modifiers
- `ShortcutManager` - Keyboard shortcuts, hotkeys

**New Service**:
```javascript
// Classes/services/InputService.js
class InputService {
  constructor() {
    this._mouse = { x: 0, y: 0, pressed: false };
    this._keys = new Map();
    this._shortcuts = new Map();
  }
  
  // Mouse API
  getMousePosition() { return this._mouse; }
  isMousePressed() { return this._mouse.pressed; }
  
  // Keyboard API
  isKeyDown(key) { return this._keys.get(key); }
  registerShortcut(key, callback) { /* hotkeys */ }
  
  // Event handling (called from sketch.js)
  handleMousePress(x, y) { /* internal */ }
  handleKeyPress(key) { /* internal */ }
}
```

**Migration Steps**:
1. ✅ Write InputService tests (TDD - 25-30 tests)
2. ✅ Implement InputService
3. ✅ Update sketch.js to use gameContext.input
4. ✅ Deprecate MouseInputController, KeyboardInputController, ShortcutManager

**Breaking Changes**:
- `mouseInputController.getMousePosition()` → `gameContext.input.getMousePosition()`
- `shortcutManager.register()` → `gameContext.input.registerShortcut()`

---

### Phase 6.5: UIService - UI System (6-10 hours)
**Goal**: Consolidate DraggablePanelManager

**Current Manager**:
- `DraggablePanelManager` - Panel registration, rendering, drag/drop

**New Service**:
```javascript
// Classes/services/UIService.js
class UIService {
  constructor() {
    this._panels = new Map();
    this._activePanel = null;
  }
  
  registerPanel(panel) { /* add panel */ }
  removePanel(id) { /* remove panel */ }
  bringToFront(id) { /* z-order */ }
  
  update(deltaTime) { /* update panels */ }
  render() { /* render all panels */ }
}
```

**Migration Steps**:
1. ✅ Write UIService tests (TDD - 20-25 tests)
2. ✅ Implement UIService
3. ✅ Update sketch.js to use gameContext.ui
4. ✅ Deprecate DraggablePanelManager

**Breaking Changes**:
- `draggablePanelManager.registerPanel()` → `gameContext.ui.registerPanel()`

---

### Phase 6.6: AudioService - Audio System (4-6 hours)
**Goal**: Consolidate soundManager

**Current Manager**:
- `soundManager` - Sound effects, music

**New Service**:
```javascript
// Classes/services/AudioService.js
class AudioService {
  constructor() {
    this._sounds = new Map();
    this._music = null;
    this._volume = 1.0;
  }
  
  playSound(name) { /* play SFX */ }
  playMusic(track) { /* play music */ }
  setVolume(level) { /* volume control */ }
}
```

**Migration Steps**:
1. ✅ Write AudioService tests (TDD - 15-20 tests)
2. ✅ Implement AudioService
3. ✅ Update sketch.js to use gameContext.audio
4. ✅ Deprecate soundManager

---

### Phase 6.7: RenderService - Render Coordination (4-6 hours)
**Goal**: Coordinate RenderLayerManager with GameContext

**Current System**:
- `RenderLayerManager` - Layer-based rendering (TERRAIN → ENTITIES → EFFECTS → UI)

**New Service**:
```javascript
// Classes/services/RenderService.js
class RenderService {
  constructor(entityService, worldService, uiService) {
    this._entityService = entityService;
    this._worldService = worldService;
    this._uiService = uiService;
    this._renderLayers = new RenderLayerManager();
  }
  
  render(gameState) {
    // Coordinate rendering across services
    this._renderLayers.renderLayer('TERRAIN', () => {
      this._worldService.renderTerrain();
    });
    
    this._renderLayers.renderLayer('ENTITIES', () => {
      this._entityService.renderAll();
    });
    
    this._renderLayers.renderLayer('UI_GAME', () => {
      this._uiService.render();
    });
  }
}
```

**Migration Steps**:
1. ✅ Write RenderService tests (TDD - 10-15 tests)
2. ✅ Implement RenderService (coordinate existing systems)
3. ✅ Update sketch.js draw() to use gameContext.rendering.render()

---

### Phase 6.8: GameContext Architecture (6-10 hours)
**Goal**: Create unified GameContext with all services

**Implementation**:
```javascript
// Classes/core/GameContext.js
class GameContext {
  constructor() {
    // Create services (order matters for dependencies)
    this.world = new WorldService();
    this.entities = new EntityService();
    this.camera = new CameraService();
    this.input = new InputService();
    this.audio = new AudioService();
    this.ui = new UIService();
    this.rendering = new RenderService(this.entities, this.world, this.ui);
    
    // Inject dependencies
    this.entities.setSpatialGrid(this.world._spatialGrid);
    this.camera.setWorldBounds(this.world._map);
  }
  
  update(deltaTime) {
    this.input.update(deltaTime);
    this.camera.update(deltaTime);
    this.entities.update(deltaTime);
    this.ui.update(deltaTime);
  }
  
  render(gameState) {
    this.rendering.render(gameState);
  }
}
```

**sketch.js Integration**:
```javascript
// sketch.js
let gameContext;

function setup() {
  createCanvas(800, 600);
  
  // ONE initialization
  gameContext = new GameContext();
  
  // Load world
  gameContext.world.loadMap('level1.json');
  
  // Spawn entities
  gameContext.entities.spawn('Ant', { x: 100, y: 100, job: 'Worker' });
  gameContext.entities.spawn('Building', { x: 200, y: 200, type: 'antcone' });
}

function draw() {
  // Update
  gameContext.update(deltaTime);
  
  // Render
  gameContext.render(gameState);
}

// p5.js events → InputService
function mousePressed() {
  gameContext.input.handleMousePress(mouseX, mouseY);
}

function keyPressed() {
  gameContext.input.handleKeyPress(key);
}
```

**Migration Steps**:
1. ✅ Create GameContext class
2. ✅ Write integration tests (GameContext with all services)
3. ✅ Update sketch.js to use gameContext
4. ✅ Create migration guide for all global references
5. ✅ Run full regression test suite

---

### Phase 6.9: Deprecation & Cleanup (4-8 hours)
**Goal**: Remove all old manager classes, update documentation

**Tasks**:
1. ✅ Delete 30+ manager files
2. ✅ Remove from index.html
3. ✅ Update CHANGELOG.md with breaking changes
4. ✅ Create migration guide (`docs/guides/MANAGER_TO_SERVICE_MIGRATION.md`)
5. ✅ Update all documentation references
6. ✅ Run full test suite (expect 650+ tests passing)

**Expected Deletions**:
| Component | Lines |
|-----------|-------|
| AntManager | 289 |
| BuildingManager | 120 |
| ResourceSystemManager | 865 |
| MapManager | ~500 |
| SpatialGridManager | ~400 |
| CameraSystemManager | ~300 |
| MouseInputController | ~200 |
| KeyboardInputController | ~150 |
| ShortcutManager | ~200 |
| DraggablePanelManager | ~600 |
| soundManager | ~100 |
| + 20 more managers | ~4000 |
| **Total** | **~8000 lines** |

---

## 📊 Testing Strategy

### Test Coverage Targets (TDD - Write Tests FIRST)
- **WorldService**: **113 comprehensive tests** (see `test/unit/services/WorldService.test.js`)
  - Entity API (15 tests) - spawn, query, update, destroy
  - Terrain API (8 tests) - tile access, coordinate conversion
  - Spatial Query API (6 tests) - nearby entities, rectangle queries
  - Camera API (10 tests) - position, zoom, screen/world transforms
  - Render API (8 tests) - layer ordering, depth sorting, frustum culling
  - Ant-Specific Queries (12 tests) - job queries, selection, formations, state changes
  - Resource Management (15 tests) - spawning, selection, registration, patterns
  - Input Handling (10 tests) - shortcuts, mouse events, selection box
  - **UI Panel Management (8 tests)** - registration, dragging, visibility, z-order
  - Audio Management (7 tests) - loading, playing, volume, BGM
  - Game State Integration (6 tests) - state changes, callbacks, pause/resume
  - Integration (8 tests) - full system coordination

### Integration Tests
- ✅ Entity + Spatial Grid (spawn + query)
- ✅ Camera + Terrain (coordinate transforms)
- ✅ Input + Panels (drag/drop, z-ordering)
- ✅ Render Pipeline (terrain → entities → panels → HUD)
- ✅ Full game loop simulation

### BDD Tests (Cucumber/Selenium)
- ✅ Player spawns ant via world
- ✅ Player builds structure via world
- ✅ Camera follows selected entity
- ✅ UI panels respond to input
- ✅ Panel drag/drop interaction
- ✅ Crosshair highlights entities

---

## 🚨 Risk Mitigation

### High-Risk Areas
1. **Global Variable Elimination**
   - 40+ globals → 1 gameContext
   - Solution: Gradual migration with deprecated aliases
   - Use feature flags: `FEATURE_FLAGS.USE_GAMECONTEXT = true`

2. **Circular Dependencies**
   - Services may reference each other
   - Solution: Dependency injection via constructor
   - Use interfaces for loose coupling

3. **Performance Regression**
   - Service indirection may slow things down
   - Solution: Benchmark before/after
   - Target: <5% regression acceptable

4. **Breaking Changes**
   - Massive API changes
   - Solution: Comprehensive migration guide
   - Deprecated aliases for 1 version

### Rollback Plan
- Branch: `feature/phase-6-gamecontext`
- If failure: Rollback to Phase 3 complete state
- Feature flag: Can disable GameContext and use old managers

---

## 📈 Success Criteria

### Per Sub-Phase
- ✅ All tests pass (unit + integration)
- ✅ Game is playable (no broken features)
- ✅ No console errors
- ✅ Performance unchanged (<5% regression)

### Phase 6 Complete
- ✅ **0 manager classes** (all 30+ deleted)
- ✅ **1 global variable** (`world` only, instead of 40+)
- ✅ **716+ tests passing** (current 603 + new 113 WorldService tests)
- ✅ **~14,432 LOC reduction** (16,032 deleted - 1,600 added)
- ✅ **43 files eliminated** (managers + rendering + systems consolidation)
- ✅ **22 systems files kept** (clean architecture, focused responsibilities)
- ✅ **Clean architecture** (WorldService facade + domain systems)
- ✅ **Documentation complete** (API refs + migration guide + systems analysis)

---

## 📅 REVISED Timeline (Unified WorldService Approach)

### Week 1 (Days 1-3): Core Implementation (TDD)
- **Day 1 (8 hours)**: 
  - ✅ **Write 113 tests FIRST** (TDD - WorldService.test.js already complete)
  - Merge EntityService into WorldService
  - Merge DraggablePanelManager panel API
  - Implement entity registry with factories
  - Implement terrain API
  - Implement spatial grid integration
  - Implement panel management (register, remove, bringToFront)
  - Run tests (aim for 50+ passing)
  
- **Day 2 (6 hours)**: 
  - Implement camera API
  - Implement input handling (mouse, keyboard, shortcuts)
  - Implement basic rendering pipeline (terrain → entities → panels)
  - Merge MouseCrosshair into HUD rendering
  - Run tests (aim for 80+ passing)
  
- **Day 3 (6 hours)**: 
  - Implement effects system (SimpleParticle)
  - Implement HUD rendering with crosshair
  - Implement audio API
  - Implement update loop
  - Run all 113 tests (confirm all pass)

### Week 2 (Days 4-5): Migration & Cleanup
- **Day 4 (6 hours)**: 
  - Update sketch.js to use `world` instead of 40+ globals
  - Find/replace all manager references:
    - `g_antManager.X()` → `world.spawnEntity('Ant', ...)`
    - `draggablePanelManager.registerPanel()` → `world.registerPanel()`
    - `cameraManager.screenToWorld()` → `world.screenToWorld()`
  - Update entity controllers to use `world.X()` instead of globals
  - Run full regression suite (716+ tests)
  
- **Day 5 (4 hours)**: 
  - **DELETE 43 files** (~16,032 LOC):
    - 30+ manager files (~8000 LOC)
    - 8 rendering files (~6105 LOC)
    - 5 systems files (~1927 LOC - consolidated into WorldService)
    - EntityService.js (merged into WorldService)
  - Update index.html (remove 43 script tags)
  - Update CHANGELOG.md with breaking changes
  - Create migration guide (`docs/guides/MANAGER_TO_WORLDSERVICE_MIGRATION.md`)
  - Update architecture docs
  - Final regression test (716+ tests passing)

**Total**: 20-30 hours (vs. 40-60 for original 7-service plan)

**Key Milestone**: After Day 3, you have a working WorldService with 113 passing tests. Days 4-5 are migration and cleanup.

---

## 🎯 Next Steps

**Immediate Actions** (RIGHT NOW):
1. ✅ **Tests already written** (113 comprehensive tests in `test/unit/services/WorldService.test.js`)
2. ✅ **Systems analysis complete** (`docs/roadmaps/SYSTEMS_CONSOLIDATION_ANALYSIS.md`)
3. Create `Classes/services/WorldService.js` (~1600 lines including panel management)
4. Implement WorldService with all subsystems unified (guided by 113 tests)
5. Run tests frequently (TDD red-green-refactor)
6. Update sketch.js to use `world` instead of 40+ globals

**Test Coverage** (Already defined - 113 tests):
- Entity API (15 tests) - spawn, query, update, destroy
- Terrain API (8 tests) - tile access, coordinate conversion
- Spatial Query API (6 tests) - nearby entities, rectangle queries
- Camera API (10 tests) - position, zoom, screen/world transforms
- Render API (8 tests) - layer ordering, depth sorting, frustum culling
- Ant-Specific Queries (12 tests) - job queries, selection, formations
- Resource Management (15 tests) - spawning, selection, registration
- Input Handling (10 tests) - shortcuts, mouse events, selection box
- **UI Panel Management (8 tests)** - registration, dragging, visibility, z-order
- Audio Management (7 tests) - loading, playing, volume
- Game State Integration (6 tests) - state changes, callbacks, pause/resume
- Integration (8 tests) - full system coordination

**Architecture Decision Summary** (from SYSTEMS_CONSOLIDATION_ANALYSIS.md):
- ✅ **Merge into WorldService**: DraggablePanelManager, DraggablePanelSystem, MouseCrosshair
- ✅ **Keep Separate**: 22 systems files (utilities, domain logic, UI components, level editor)
- ✅ **Delete**: FramebufferManager, UIVisibilityCuller (over-engineered/unused)

---

## 🚀 Let's Go!

Phase 6 is the **biggest architectural shift** AND **biggest simplification** in this roadmap. When complete, you'll have:

### **What You're Building**
- ✅ **ONE WorldService file** (~1600 LOC) that replaces 43 files
- ✅ **ONE global variable** (`world`) instead of 40+ globals
- ✅ **ZERO managers** (all 30+ deleted)
- ✅ **ZERO complex rendering** (8 files deleted)
- ✅ **EntityService merged** (no overlap, single source of truth)
- ✅ **Panel management merged** (DraggablePanelManager eliminated)
- ✅ **Crosshair integrated** (MouseCrosshair eliminated)
- ✅ **113 comprehensive tests** (full coverage of all manager functionality)

### **What You're Deleting**
- ❌ **43 files** (~16,032 LOC)
  - 30+ manager files (~8000 LOC)
  - 8 rendering files (~6105 LOC)
  - 5 systems files (~1927 LOC - DraggablePanelManager, DraggablePanelSystem, MouseCrosshair, FramebufferManager, UIVisibilityCuller)
  - EntityService.js (merged into WorldService)

### **What You're Keeping**
- ✅ **24 files** (~10,450 LOC)
  - WorldService.js (~1600 LOC **NEW**)
  - RenderController.js (~400 LOC simplified)
  - EventFlagRenderer.js (~201 LOC as-is)
  - **22 systems files** (~8,650 LOC - see SYSTEMS_CONSOLIDATION_ANALYSIS.md)
    - Core utilities (SpatialGrid, CoordinateConverter, CollisionBox2D)
    - Domain logic (pathfinding, pheromones, ResourceNode, Nature)
    - Combat (FireballSystem, LightningSystem)
    - UI components (DraggablePanel, menu, panels, Button)
    - Level Editor (LevelEditor + tools + brushes)
    - Debug tools (GatherDebugRenderer)

### **The Numbers**
| Metric | Before | After | Reduction |
|--------|--------|-------|-----------|
| **Files** | 65+ files | 24 files | **-63%** |
| **Lines of Code** | ~24,105 LOC | ~10,450 LOC | **-57%** |
| **Globals** | 40+ | 1 (world) | **-98%** |
| **Managers** | 30+ manager classes | 0 managers | **-100%** |
| **Rendering Systems** | 8 complex files | 1 unified facade | **-87.5%** |
| **Complexity** | 65 interconnected systems | 1 facade + 23 focused systems | **Massive** |

### **Architecture Clarity**
```javascript
// BEFORE (40+ globals, 39 files)
g_antManager.createAnt(x, y);
g_map2.getTileAt(x, y);
spatialGridManager.getNearbyEntities(x, y, r);
cameraManager.screenToWorld(x, y);
draggablePanelManager.registerPanel(panel);
RenderManager.render(gameState);

// AFTER (1 global, 1 file)
world.spawnEntity('Ant', x, y);
world.getTileAt(x, y);
world.getNearbyEntities(x, y, r);
world.screenToWorld(x, y);
world.registerPanel(panel);
world.render();
```

**Ready to start Phase 6.1 (Merge EntityService + Build WorldService)?** 🎯

---

## ~~DEPRECATED: Original 7-Service Timeline~~

~~**Week 1 (Days 1-5)**:~~
- ~~Day 1: Phase 6.1 - EntityService (tests + implementation)~~
- ~~Day 2: Phase 6.2 - WorldService (tests + implementation)~~
- ~~Day 3: Phase 6.3 - CameraService + Phase 6.6 - AudioService~~
- ~~Day 4: Phase 6.4 - InputService (tests + implementation)~~
- ~~Day 5: Phase 6.5 - UIService (tests + implementation)~~

~~**Week 2 (Days 6-10)**:~~
- ~~Day 6: Phase 6.7 - RenderService~~
- ~~Day 7: Phase 6.8 - GameContext integration~~
- ~~Day 8: Phase 6.9 - Deprecation + cleanup~~
- ~~Day 9: Full regression testing + performance benchmarks~~
- ~~Day 10: Documentation + migration guide~~

~~**Total**: 40-60 hours~~

**Rejected Reason**: Over-engineered with 7 separate services causing circular dependencies and maintenance overhead.
