# sketch.js Reduction Plan - WorldService Migration

**Current**: 1574 LOC  
**Target**: ~600-700 LOC (62% reduction)  
**Date**: November 5, 2025

---

## Detailed LOC Breakdown by Section

### 1. Global Variable Declarations (Lines 1-45, ~45 LOC)

**Current State**:
```javascript
// Grid System (7 variables)
let g_canvasX = 800;
let g_canvasY = 800;
const TILE_SIZE = 32;
const CHUNKS_X = 20;
const CHUNKS_Y = 20;
let COORDSY;
const NONE = '\0';

// Controllers (4 variables)
let g_mouseController;
let g_keyboardController;
let g_selectionBoxController;
let g_tileInteractionManager;
let selectables = [];

// World/Terrain (5 variables)
let g_seed;
let g_map;
let g_map2;
let g_gridMap;
let g_activeMap;

// UI
let g_menuFont;
let g_recordingPath;
let queenAnt;
let g_globalTime;

// Buildings
let Buildings = [];

// DEPRECATED MANAGERS (7 variables)
let buildingManager;
let cameraManager;
let antManager;
let antFactory;
let entityService;
let buildingFactory;
let resourceFactory;

// NEW
let world; // WorldService instance
```

**After Migration** (~15 LOC, -30 LOC):
```javascript
// === P5.JS CANVAS CONSTANTS ===
let g_canvasX = 800;
let g_canvasY = 800;
const TILE_SIZE = 32;
const CHUNKS_X = 20;
const CHUNKS_Y = 20;
const NONE = '\0';

// === LEGACY CONTROLLERS (Phase 7 migration target) ===
let g_mouseController;      // TODO: Phase 7 - migrate to world.handleInput()
let g_keyboardController;   // TODO: Phase 7 - migrate to world.handleInput()
let g_selectionBoxController; // TODO: Phase 7 - migrate to world selection API

// === WORLD SERVICE (ONE GLOBAL) ===
let world; // Replaces 40+ manager globals
```

**Reduction**: -30 LOC

---

### 2. Manager Initialization Functions (Lines 46-90, ~45 LOC)

**Current State**:
```javascript
function setUpManagers() {
  antManager = AntManager.getInstance();
  buildingManager = BuildingManager.getInstance();
  resourceManger = ResourceManger.getInstance();
}

function setUpFactories() {
  antFactory = new AntFactory(antManager);
  buildingFactory = new BuildingFactory(buildingManager);
  resourceFactory = new ResourceFactory(resourceManger);
  entityService = new EntityService(antFactory, buildingFactory, resourceFactory);
}

function initGlobals() {
  setUpManagers();
  setUpFactories();
  entityService.setSpatialGrid(spatialGridManager);
  
  // NEW APPROACH
  const worldAntFactory = new AntFactory(null);
  const worldBuildingFactory = new BuildingFactory(null);
  const worldResourceFactory = new ResourceFactory(null);
  
  world = new WorldService({
    factories: {
      ant: worldAntFactory,
      building: worldBuildingFactory,
      resource: worldResourceFactory
    }
  });
}
```

**After Migration** (~10 LOC, -35 LOC):
```javascript
function initWorldService() {
  const antFactory = new AntFactory();
  const buildingFactory = new BuildingFactory();
  const resourceFactory = new ResourceFactory();
  
  world = new WorldService({
    factories: { ant: antFactory, building: buildingFactory, resource: resourceFactory }
  });
  console.log('WorldService initialized');
}
```

**Reduction**: -35 LOC

---

### 3. registerEntitiesWithGameWorld() (Lines 91-145, ~55 LOC)

**Current State**: Complex function that pushes entities to legacy arrays (ants[], resource_list[], Buildings[]), registers with spatialGridManager, etc.

**After Migration** (~5 LOC, -50 LOC):
```javascript
// DEPRECATED: WorldService.spawnEntity() handles all registration automatically
// Legacy arrays (ants[], Buildings[]) populated by WorldService internally for rendering compatibility
// This function can be DELETED
```

**Reduction**: -50 LOC (entire function deleted)

---

### 4. preload() (Lines 147-160, ~14 LOC)

**No Change**: Keep as-is (asset loading)

**Reduction**: 0 LOC

---

### 5. setup() (Lines 162-314, ~153 LOC)

**Current State**: Massive initialization function with 10 major sections

**After Migration** (~80 LOC, -73 LOC):
```javascript
function setup() {
  g_canvasX = windowWidth;
  g_canvasY = windowHeight;
  createCanvas(g_canvasX, g_canvasY);
  
  // === WORLD SERVICE INITIALIZATION (replaces 40+ manager inits) ===
  initWorldService();
  
  // === LEGACY CONTROLLERS (Phase 7 target) ===
  g_mouseController = new MouseInputController();
  g_keyboardController = new KeyboardInputController();
  g_selectionBoxController = SelectionBoxController.getInstance(g_mouseController, ants);
  
  // === TERRAIN & MAP ===
  initializeWorld();
  
  // === UI SYSTEMS ===
  initializeDraggablePanelSystem();
  initializeQueenControlPanel();
  initializeMenu();
  
  // === GAME SYSTEMS ===
  window.g_fireballManager = new FireballManager();
  window.eventManager = EventManager.getInstance();
  window.eventDebugManager = new EventDebugManager();
  window.eventManager.setEventDebugManager(window.eventDebugManager);
  
  // === LEVEL EDITOR INTEGRATION ===
  if (typeof GameState !== 'undefined' && typeof levelEditor !== 'undefined') {
    GameState.onStateChange((newState, oldState) => {
      if (newState === 'LEVEL_EDITOR') {
        if (!levelEditor.isActive()) {
          const terrain = typeof SparseTerrain !== 'undefined' 
            ? new SparseTerrain(32, 'dirt')
            : new CustomTerrain(50, 50, 32, 'dirt');
          levelEditor.initialize(terrain);
        }
      } else if (oldState === 'LEVEL_EDITOR') {
        levelEditor.deactivate();
      }
    });
  }
  
  // === FINAL SETUP ===
  if (soundManager) soundManager.startBGMMonitoring();
  initializeContextMenuPrevention();
  MiddleClickPan.initialize();
  
  // TEST: Spawn building
  world.spawnEntity('Building', { x: 200, y: 200, buildingType: 'hivesource', faction: 'neutral' });
}
```

**Key Simplifications**:
- Remove SpatialGridManager init (WorldService handles internally)
- Remove RenderManager registration boilerplate (WorldService handles)
- Remove CameraSystemManager init (WorldService handles)
- Remove EntityRenderer init (WorldService handles)
- Remove selection adapter registration (WorldService handles)
- Remove context menu prevention duplication (consolidate)

**Reduction**: -73 LOC

---

### 6. initializeContextMenuPrevention() (Lines 316-350, ~35 LOC)

**After Migration** (~10 LOC, -25 LOC):
```javascript
function initializeContextMenuPrevention() {
  if (typeof document !== 'undefined') {
    document.oncontextmenu = (e) => { e.preventDefault(); return false; };
  }
  if (typeof window !== 'undefined') {
    window.oncontextmenu = (e) => { e.preventDefault(); return false; };
  }
}
```

**Reduction**: -25 LOC (remove duplicate methods and comments)

---

### 7. initializeWorld() (Lines 366-413, ~48 LOC)

**Current State**: Creates terrain, PathMap, GlobalTime, spawns queen, sets up camera

**After Migration** (~25 LOC, -23 LOC):
```javascript
function initializeWorld() {
  g_seed = hour() * minute() * floor(second() / 10);
  
  // Create terrain
  g_map2 = new gridTerrain(CHUNKS_X, CHUNKS_Y, g_seed, CHUNK_SIZE, TILE_SIZE, [windowWidth, windowHeight]);
  g_map2.randomize(g_seed);
  g_map2.renderConversion.alignToCanvas();
  g_activeMap = g_map2;
  
  // Load terrain into WorldService
  world.loadTerrain(g_map2, 'level1', true);
  
  // Legacy systems
  g_gridMap = new PathMap(g_map);
  g_globalTime = new GlobalTime();
  
  // Spawn queen and follow
  queenAnt = world.spawnEntity('Ant', { x: 400, y: 400, jobName: 'Queen', faction: 'player' });
  world.centerCameraOnEntity(queenAnt);
}
```

**Key Simplifications**:
- Remove MapManager.registerMap() (WorldService handles)
- Remove RenderManager.initialize() (WorldService handles)
- Remove redundant initGlobals() call
- Replace antFactory.spawnQueen() with world.spawnEntity()
- Replace cameraManager.followEntity() with world.centerCameraOnEntity()

**Reduction**: -23 LOC

---

### 8. clearGameEntities() (Lines 415-435, ~21 LOC)

**After Migration** (~3 LOC, -18 LOC):
```javascript
function clearGameEntities() {
  return world.clearAllEntities(); // Returns counts
}
```

**Reduction**: -18 LOC (WorldService handles all cleanup)

---

### 9. loadCustomLevel() (Lines 438-600, ~163 LOC)

**Current State**: Massive async function with complex entity spawning logic

**After Migration** (~60 LOC, -103 LOC):
```javascript
async function loadCustomLevel(levelPath) {
  try {
    world.clearAllEntities();
    
    const response = await fetch(levelPath);
    if (!response.ok) {
      throw new Error(`Failed to load level: ${response.status}`);
    }
    const levelData = await response.json();
    
    // Load terrain via WorldService
    const mapId = levelData.metadata?.id || 'custom-level';
    const terrain = world.loadTerrain(levelData, mapId, true);
    if (!terrain) throw new Error('Failed to load terrain');
    
    g_activeMap = terrain;
    g_map2 = terrain;
    
    // Load entities via LevelLoader
    if (typeof LevelLoader === 'undefined') {
      console.warn('LevelLoader not available, skipping entities');
      GameState.goToGame();
      return true;
    }
    
    const loader = new LevelLoader();
    const result = loader.loadLevel(levelData);
    
    if (!result || !result.success || !Array.isArray(result.entities)) {
      console.warn('No entities to spawn');
      GameState.goToGame();
      return true;
    }
    
    // Spawn entities via WorldService (handles all registration automatically)
    let queen = null;
    result.entities.forEach(entityData => {
      if (!entityData || !entityData.type) return;
      
      const { type, x, y, properties } = entityData;
      const spawnedEntity = world.spawnEntity(type, { x, y, ...properties });
      
      if (type === 'Queen' || properties?.jobName === 'Queen') {
        queen = spawnedEntity;
      }
    });
    
    // Setup camera
    if (queen) {
      window.queenAnt = queen;
      world.centerCameraOnEntity(queen);
    }
    
    GameState.goToGame();
    return true;
    
  } catch (error) {
    console.error('[loadCustomLevel] Error:', error);
    return false;
  }
}
```

**Key Simplifications**:
- Remove entityService.clearAll() → world.clearAllEntities()
- Remove mapManager.loadLevel() → world.loadTerrain()
- Remove complex entity spawning with legacy array pushes
- WorldService.spawnEntity() handles ALL registration (spatial grid, rendering, etc.)
- Remove manual spatial grid registration
- Remove cameraManager calls → world.centerCameraOnEntity()

**Reduction**: -103 LOC

---

### 10. draw() - Main Loop (Lines 608-710, ~103 LOC)

**Current State**: Two phases (UPDATE, RENDER) with many individual system updates

**After Migration** (~40 LOC, -63 LOC):
```javascript
function draw() {
  // === UPDATE PHASE ===
  soundManager.onDraw();
  
  if (GameState.getState() === 'PLAYING' || GameState.getState() === 'IN_GAME') {
    // WorldService handles ALL entity updates, camera, spatial grid
    world.update(deltaTime || 16.67);
    
    // Brush systems (keep separate)
    window.g_enemyAntBrush.update();
    window.g_lightningAimBrush.update();
    window.g_resourceBrush.update();
    window.g_buildingBrush.update();
    
    // UI systems (keep separate)
    updateQueenPanelVisibility();
    window.g_queenControlPanel.update();
    
    // Game systems (keep separate)
    window.eventManager.update();
    window.g_fireballManager.update();
    window.g_lightningManager.update();
    g_globalTime.update();
  }
  
  if (GameState.getState() === 'LEVEL_EDITOR') {
    if (window.levelEditor) levelEditor.update();
  }
  
  // === RENDER PHASE ===
  if (GameState.getState() === 'LEVEL_EDITOR') {
    background(40, 40, 40);
    if (window.levelEditor) levelEditor.render();
  } else {
    world.render(); // Replaces RenderManager
  }
  
  // Debug overlays
  if (typeof window.drawCoordinateVisualization === 'function') window.drawCoordinateVisualization();
  if (typeof window.drawTerrainGrid === 'function') window.drawTerrainGrid();
  
  settingsPanel.render();
}
```

**Key Simplifications**:
- Remove entityService.update() → world.update() (includes camera, entities, spatial grid)
- Remove cameraManager.update() (WorldService handles)
- Remove individual entity.update() loop (WorldService handles)
- Remove queen WASD movement (WorldService handles via input system)
- Remove RenderManager.render() → world.render()

**Reduction**: -63 LOC

---

### 11. Mouse Event Functions (Lines 712-900, ~189 LOC)

**After Migration** (~120 LOC, -69 LOC):

**Simplifications**:
- Remove RenderManager.dispatchPointerEvent() → world.handleMousePress/Drag/Release()
- Remove draggablePanelManager checks → world.handleMousePress()
- WorldService handles UI panel events internally
- Reduce priority chain complexity (WorldService handles most cases)

**Example mousePressed() after migration**:
```javascript
function mousePressed() {
  // Settings Panel (highest priority)
  if (window.settingsPanel && settingsPanel.visible) {
    settingsPanel.handleClick(mouseX, mouseY);
    return;
  }
  
  // Middle-click pan
  if (mouseButton === CENTER && typeof MiddleClickPan !== 'undefined') {
    if (MiddleClickPan.handlePress()) return;
  }
  
  // Level Editor
  if (GameState.getState() === 'LEVEL_EDITOR') {
    if (window.levelEditor && levelEditor.isActive()) {
      levelEditor.handleClick(mouseX, mouseY);
      return;
    }
  }
  
  // Tile Inspector
  if (typeof tileInspectorEnabled !== 'undefined' && tileInspectorEnabled) {
    if (typeof inspectTileAtMouse === 'function') {
      inspectTileAtMouse(mouseX, mouseY);
      return;
    }
  }
  
  // Brush handling
  brushHandling();
  
  // WorldService handles all other input (UI panels, entity selection, etc.)
  const consumed = world.handleMousePress(mouseX, mouseY, mouseButton);
  if (consumed) return;
  
  // Fallback to legacy controller
  handleMouseEvent('handleMousePressed', window.getWorldMouseX(), window.getWorldMouseY(), mouseButton);
}
```

**Reduction**: -69 LOC (across all 6 mouse functions)

---

### 12. Keyboard Event Functions (Lines 902-1100, ~199 LOC)

**After Migration** (~100 LOC, -99 LOC):

**Simplifications**:
- Remove render layer toggle logic (WorldService provides simple API)
- Remove camera navigation shortcuts (WorldService provides unified API)
- Remove queen movement logic (WorldService handles via input system)
- Consolidate debug shortcuts

**Example keyPressed() after migration**:
```javascript
function keyPressed() {
  // Settings Panel Escape (highest priority)
  if (keyCode === ESCAPE && window.settingsPanel && settingsPanel.visible) {
    settingsPanel.close();
    return;
  }
  
  // Level Editor shortcuts
  if (GameState.getState() === 'LEVEL_EDITOR') {
    if (window.levelEditor && levelEditor.isActive()) {
      if (keyCode === ESCAPE && levelEditor.getCursorAttachment) {
        levelEditor.clearCursorAttachment();
        return;
      }
      levelEditor.handleKeyPress(key);
    }
  }
  
  // Debug shortcuts (consolidated)
  if (key === '`' || key === '~') { toggleCoordinateDebug(); return; }
  if (key === 't' || key === 'T') { toggleTileInspector(); return; }
  if (handleTerrainGridKeys()) return;
  if (handleDebugConsoleKeys(keyCode, key)) return;
  
  // Escape: Deselect all
  if (keyCode === ESCAPE) {
    world.deselectAll();
    return;
  }
  
  // WorldService handles most shortcuts (camera, layer toggles, etc.)
  const consumed = world.handleKeyPress(keyCode, key);
  if (consumed) return;
  
  // Fallback to legacy controller
  handleKeyEvent('handleKeyPressed', keyCode, key);
}
```

**Reduction**: -99 LOC

---

### 13. Utility Functions (Lines 1102-1340, ~239 LOC)

**After Migration** (~80 LOC, -159 LOC):

**Functions to DELETE** (WorldService provides equivalent):
- `getPrimarySelectedEntity()` → `world.getPrimarySelectedEntity()`
- `getEntityWorldCenter()` → Entity methods
- `getMapPixelDimensions()` → `world.getTerrainDimensions()`
- `setActiveMap()` → `world.loadTerrain()`
- `getActiveMap()` → `world.getTerrain()`
- `loadMossStoneLevel()` → Use world.loadTerrain()
- `switchToLevel()` → Simplified with world API

**Functions to KEEP** (but simplify):
- `deactivateActiveBrushes()` - Keep as-is
- `drawDebugGrid()` - Keep as-is
- `disableContextMenu()` - Keep as-is
- `windowResized()` - Simplified to call world.handleResize()

**Reduction**: -159 LOC

---

### 14. Debug Functions (Lines 1342-1574, ~233 LOC)

**After Migration** (~50 LOC, -183 LOC):

**Simplifications**:
```javascript
window.spawnDebugAnt = function() {
  const camPos = world.getCameraPosition();
  const viewWidth = g_canvasX / camPos.zoom;
  const viewHeight = g_canvasY / camPos.zoom;
  const centerX = camPos.x + (viewWidth / 2);
  const centerY = camPos.y + (viewHeight / 2);
  
  const ant = world.spawnEntity('Ant', { 
    x: centerX, y: centerY, 
    jobName: 'Scout', faction: 'player' 
  });
  
  console.log(`✅ Test ant spawned at camera center (${Math.round(centerX)}, ${Math.round(centerY)})`);
  return ant;
}

window.goToQueen = function() {
  const queen = world.getQueen();
  if (!queen) {
    console.error('❌ Queen not found');
    return;
  }
  
  world.centerCameraOnEntity(queen);
  console.log('✅ Camera centered on Queen');
}

window.checkCamera = function() {
  const camPos = world.getCameraPosition();
  const queen = world.getQueen();
  
  console.log('📸 [Camera Debug]');
  console.log(`   Position: (${Math.round(camPos.x)}, ${Math.round(camPos.y)})`);
  console.log(`   Zoom: ${camPos.zoom.toFixed(2)}x`);
  
  if (queen) {
    const qPos = queen.getPosition();
    console.log(`👑 Queen: (${Math.round(qPos.x)}, ${Math.round(qPos.y)})`);
    
    const dx = qPos.x - camPos.x;
    const dy = qPos.y - camPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    console.log(`   Distance: ${Math.round(distance)} pixels`);
  }
}
```

**Reduction**: -183 LOC

---

## Summary - LOC Reduction Breakdown

| Section | Current LOC | After LOC | Reduction |
|---------|-------------|-----------|-----------|
| 1. Global Variables | 45 | 15 | **-30** |
| 2. Manager Init Functions | 45 | 10 | **-35** |
| 3. registerEntitiesWithGameWorld() | 55 | 0 | **-55** |
| 4. preload() | 14 | 14 | 0 |
| 5. setup() | 153 | 80 | **-73** |
| 6. initializeContextMenuPrevention() | 35 | 10 | **-25** |
| 7. initializeWorld() | 48 | 25 | **-23** |
| 8. clearGameEntities() | 21 | 3 | **-18** |
| 9. loadCustomLevel() | 163 | 60 | **-103** |
| 10. draw() | 103 | 40 | **-63** |
| 11. Mouse Events | 189 | 120 | **-69** |
| 12. Keyboard Events | 199 | 100 | **-99** |
| 13. Utility Functions | 239 | 80 | **-159** |
| 14. Debug Functions | 233 | 50 | **-183** |
| **TOTAL** | **1574** | **~607** | **-967 LOC** |

---

## Final Result

**Before**: 1574 LOC  
**After**: ~607 LOC  
**Reduction**: -967 LOC (61.4% reduction)

---

## Key Simplifications

### What Gets Eliminated:
1. ❌ **All manager initialization boilerplate** (40+ lines)
2. ❌ **registerEntitiesWithGameWorld()** - WorldService handles automatically
3. ❌ **Complex entity spawning logic** - world.spawnEntity() replaces 100+ lines
4. ❌ **Manual spatial grid registration** - WorldService handles automatically
5. ❌ **RenderManager integration code** - WorldService provides simple API
6. ❌ **CameraManager boilerplate** - WorldService provides unified camera API
7. ❌ **Selection system boilerplate** - WorldService handles selection
8. ❌ **Duplicate mouse/keyboard priority chains** - WorldService consolidates
9. ❌ **Utility wrapper functions** - WorldService provides direct APIs
10. ❌ **Complex debug functions** - WorldService provides simple getters

### What Stays Simple:
1. ✅ **p5.js lifecycle** (preload, setup, draw) - Core responsibilities only
2. ✅ **Level Editor integration** - Minimal hooks
3. ✅ **Brush systems** - Keep separate (domain-specific)
4. ✅ **Game-specific systems** (EventManager, FireballManager, etc.)
5. ✅ **Debug shortcuts** - Consolidated and simplified

---

## Code Quality Improvements

### Before:
- 60+ global variables
- 47 functions with complex dependencies
- Tight coupling between systems
- Duplicate code across mouse/keyboard handlers
- Hard to test (mocking 40+ globals)

### After:
- ~15 global variables (mostly constants)
- ~25 functions with clear responsibilities
- Single point of integration (WorldService)
- Consolidated input handling
- Easy to test (mock 1 global)

---

## Migration Confidence

**Risk Level**: MEDIUM-LOW

**Why it's achievable**:
1. WorldService has 180 passing tests (100% coverage)
2. Clear 1:1 mapping for all manager replacements
3. Backward compatibility maintained during transition
4. Can test incrementally (replace section by section)

**Estimated Time**: 6-8 hours for full migration + testing
