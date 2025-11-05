# Phase 6: Manager Elimination & Service Architecture - Roadmap

**Status**: 🚀 IN PROGRESS  
**Start Date**: November 4, 2025  
**Estimated Duration**: 40-60 hours (1-1.5 weeks)  
**Goal**: Eliminate ALL 30+ manager classes, replace with 7 unified services, reduce globals from 40+ to 1

---

## 📋 Overview

### The Problem
- **30+ Manager classes** scattered across codebase (AntManager, ResourceSystemManager, BuildingManager, MapManager, etc.)
- **40+ Global variables** (g_map2, spatialGridManager, cameraManager, draggablePanelManager, etc.)
- **Tight coupling** between systems (managers reference each other directly)
- **No centralized architecture** (each system does its own thing)
- **Hard to test** (mocking globals is painful)

### The Solution: GameContext + Services
```javascript
// ONE global: gameContext
const gameContext = new GameContext();

// Services replace managers
gameContext.entities     // EntityService (replaces AntManager, BuildingManager, ResourceSystemManager)
gameContext.world        // WorldService (replaces MapManager, SpatialGridManager, TileInteractionManager)
gameContext.camera       // CameraService (replaces CameraSystemManager)
gameContext.input        // InputService (replaces MouseInputController, KeyboardInputController, ShortcutManager)
gameContext.audio        // AudioService (replaces soundManager)
gameContext.ui           // UIService (replaces DraggablePanelManager)
gameContext.rendering    // RenderService (replaces RenderLayerManager coordination)
```

### Expected Impact
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Manager classes | 30+ files | 0 files | **-100%** |
| Total manager LOC | ~8000 lines | ~2000 lines (services) | **-75%** |
| Global variables | 40+ | 1 (gameContext) | **-98%** |
| Coupling | High (direct refs) | Low (DI via context) | **Massive** |
| Testability | Hard (global mocks) | Easy (inject services) | **Massive** |

---

## 🗺️ Phase Breakdown

### Phase 6.1: EntityService - Unify Entity Management (12-16 hours)
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
- `buildingManager.createBuilding()` → `gameContext.entities.spawn('Building', { ... })`
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

### Test Coverage Targets
- **EntityService**: 40-50 tests (unified entity operations)
- **WorldService**: 30-40 tests (map + spatial + interaction)
- **CameraService**: 15-20 tests (camera transforms)
- **InputService**: 25-30 tests (mouse + keyboard + shortcuts)
- **UIService**: 20-25 tests (panel management)
- **AudioService**: 15-20 tests (sound playback)
- **RenderService**: 10-15 tests (render coordination)
- **GameContext**: 30-40 tests (integration)
- **Total New Tests**: **185-240 tests**

### Integration Tests
- ✅ EntityService + WorldService (spawn + spatial queries)
- ✅ CameraService + WorldService (coordinate transforms)
- ✅ InputService + UIService (panel drag/drop)
- ✅ RenderService + All Services (full render pipeline)
- ✅ GameContext (full game loop simulation)

### BDD Tests (Cucumber/Selenium)
- ✅ Player spawns ant via gameContext
- ✅ Player builds structure via gameContext
- ✅ Camera follows selected entity
- ✅ UI panels respond to input

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
- ✅ **0 manager classes** (all deleted)
- ✅ **1 global variable** (gameContext only)
- ✅ **650+ tests passing** (current 603 + new 185-240)
- ✅ **~6000 LOC reduction** (8000 deleted - 2000 added)
- ✅ **Clean architecture** (services with DI)
- ✅ **Documentation complete** (API refs + migration guide)

---

## 📅 Timeline

### Week 1 (Days 1-5)
- **Day 1**: Phase 6.1 - EntityService (tests + implementation)
- **Day 2**: Phase 6.2 - WorldService (tests + implementation)
- **Day 3**: Phase 6.3 - CameraService + Phase 6.6 - AudioService
- **Day 4**: Phase 6.4 - InputService (tests + implementation)
- **Day 5**: Phase 6.5 - UIService (tests + implementation)

### Week 2 (Days 6-10)
- **Day 6**: Phase 6.7 - RenderService
- **Day 7**: Phase 6.8 - GameContext integration
- **Day 8**: Phase 6.9 - Deprecation + cleanup
- **Day 9**: Full regression testing + performance benchmarks
- **Day 10**: Documentation + migration guide

---

## 🎯 Next Steps

**Immediate Actions** (RIGHT NOW):
1. Create Phase 6.1 checklist in `docs/checklists/active/PHASE_6.1_ENTITY_SERVICE.md`
2. Write EntityService tests (TDD - start with registry operations)
3. Implement EntityService with unified entity registry
4. Integrate AntFactory, BuildingFactory, ResourceFactory

**First Test** (Write this now):
```javascript
// test/unit/services/EntityService.test.js
describe('EntityService', function() {
  it('should spawn ant via unified API', function() {
    const service = new EntityService(antFactory, buildingFactory, resourceFactory);
    
    const ant = service.spawn('Ant', { x: 100, y: 100, job: 'Worker' });
    
    expect(ant).to.exist;
    expect(ant.jobName).to.equal('Worker');
    expect(service.getById(ant.id)).to.equal(ant);
  });
});
```

---

## 🚀 Let's Go!

Phase 6 is the **biggest architectural shift** in this roadmap. When complete, you'll have:
- Clean service architecture
- Zero managers
- One global
- 650+ tests
- -6000 LOC

**Ready to start Phase 6.1 (EntityService)?** 🎯
