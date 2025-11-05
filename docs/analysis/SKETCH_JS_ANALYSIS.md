# sketch.js Analysis - Pre-Migration to WorldService

**Date**: November 5, 2025  
**Purpose**: Map all responsibilities and dependencies before migrating to WorldService

---

## Global Variables (60+ globals)

### Grid System (7 variables)
- `g_canvasX`, `g_canvasY` - Canvas dimensions (800x800 default)
- `TILE_SIZE` - 32px tiles
- `CHUNKS_X`, `CHUNKS_Y` - 20x20 chunks
- `COORDSY` - Coordinate system
- `NONE` - '\0' constant

### Controllers (4 variables)
- `g_mouseController` - MouseInputController instance
- `g_keyboardController` - KeyboardInputController instance
- `g_selectionBoxController` - Selection box system
- `g_tileInteractionManager` - Tile click detection

### World/Terrain (5 variables)
- `g_seed` - Random seed
- `g_map` - OLD terrain system (Terrain class)
- `g_map2` - NEW terrain system (gridTerrain class)
- `g_gridMap` - PathMap for pathfinding
- `g_activeMap` - Currently active map reference

### Entities (4 arrays + 1 special)
- `ants[]` - Global ant array (used by EntityLayerRenderer)
- `resource_list[]` - Global resource array
- `Buildings[]` - Global building array
- `selectables[]` - Selection system array
- `queenAnt` - Special queen reference

### Managers (7 DEPRECATED → WorldService)
- `buildingManager` - BuildingManager.getInstance()
- `cameraManager` - CameraSystemManager instance
- `antManager` - AntManager.getInstance()
- `resourceManger` - ResourceManger.getInstance()
- `antFactory`, `buildingFactory`, `resourceFactory` - Factory instances
- `entityService` - EntityService instance

### NEW SERVICE (1 variable)
- `world` - WorldService instance (replaces 40+ globals)

### UI/Misc (5 variables)
- `g_menuFont` - Menu font
- `g_recordingPath` - Recording path
- `g_globalTime` - GlobalTime instance
- `spatialGridManager` - SpatialGridManager instance
- `mapManager` - MapManager instance (auto-initialized)

---

## Function Analysis

### Initialization Functions (7 functions)

#### `preload()`
**Dependencies**: None (p5.js lifecycle)  
**Purpose**: Load assets before setup()  
**Calls**:
- `terrainPreloader()` - Load terrain sprites
- `soundManagerPreload()` - Load sound files
- `new ResourceManager()` - Initialize MVC resource system
- `preloadPauseImages()` - Load pause menu images
- `loadPresentationAssets()` - Load presentation assets
- `menuPreload()` - Load menu assets
- `antsPreloader()` - Load ant sprites

#### `setup()`
**Dependencies**: preload() complete  
**Purpose**: Initialize game world, systems, UI  
**Major Sections**:
1. **Canvas Setup**
   - `createCanvas(g_canvasX, g_canvasY)`
   
2. **Spatial Grid** (FIRST - before entities)
   - `new SpatialGridManager(TILE_SIZE)`
   - Registers visualization in RenderManager.layers.UI_DEBUG
   
3. **Managers & Factories**
   - `initGlobals()` - OLD: setUpManagers(), setUpFactories()
   - `initializeWorld()` - Terrain + map generation
   - `initializeDraggablePanelSystem()` - UI panels
   - **NEW: WorldService initialization**
   
4. **Controllers**
   - `new TileInteractionManager()`
   - `new MouseInputController()`
   - `new KeyboardInputController()`
   - `SelectionBoxController.getInstance()`
   
5. **Selection System Integration**
   - Registers selection adapter with RenderManager
   - Interactive drawable for selection box
   
6. **Camera System**
   - `new CameraSystemManager()`
   - `cameraManager.switchCamera('MENU')`
   - Register GameState.onStateChange() callback
   
7. **Context Menu Prevention**
   - Document-level prevention
   - Canvas-specific prevention
   - Mouse button event prevention
   
8. **UI Systems**
   - `initializeQueenControlPanel()`
   - `new FireballManager()`
   - `EventManager.getInstance()`
   - `new EventDebugManager()`
   - `initializeMenu()`
   - `renderPipelineInit()`
   
9. **Level Editor Integration**
   - Register GameState.onStateChange() for LEVEL_EDITOR state
   - Initialize SparseTerrain or CustomTerrain
   
10. **Final Setup**
    - `soundManager.startBGMMonitoring()`
    - `initializeContextMenuPrevention()`
    - `MiddleClickPan.initialize()`
    - **TEST**: `buildingManager.createBuilding('hivesource', 200, 200, 'neutral')`

#### `setUpManagers()` - DEPRECATED
**Purpose**: Initialize old singleton managers  
**Creates**:
- `antManager = AntManager.getInstance()`
- `buildingManager = BuildingManager.getInstance()`
- `resourceManger = ResourceManger.getInstance()`

#### `setUpFactories()` - DEPRECATED
**Purpose**: Initialize old factories  
**Creates**:
- `antFactory = new AntFactory(antManager)`
- `buildingFactory = new BuildingFactory(buildingManager)`
- `resourceFactory = new ResourceFactory(resourceManger)`
- `entityService = new EntityService(antFactory, buildingFactory, resourceFactory)`

#### `initGlobals()` - HYBRID (old + new)
**Purpose**: Initialize both old and new systems during migration  
**Old Approach**:
- Calls `setUpManagers()`
- Calls `setUpFactories()`
- `entityService.setSpatialGrid(spatialGridManager)`

**New Approach**:
- Creates factories without manager dependencies
- `world = new WorldService({ factories: {...} })`
- Console log: '[WorldService] Initialized - ready to replace 40+ globals'

#### `initializeWorld()`
**Purpose**: Create terrain, map, queen ant  
**Steps**:
1. Generate seed from time
2. Create old terrain (g_map)
3. Create new terrain (g_map2 = gridTerrain)
4. Set g_activeMap = g_map2
5. Register with MapManager
6. Create PathMap
7. Create GlobalTime
8. Call `initGlobals()` (redundant?)
9. `RenderManager.initialize()`
10. `antFactory.spawnQueen()` - Sets queenAnt global
11. `cameraManager.followEntity(queenAnt)`

#### `initializeContextMenuPrevention()`
**Purpose**: Disable right-click menu (for brush controls)  
**Methods**:
- Document-level prevention
- Window-level prevention
- p5.js canvas-specific prevention

---

### Entity Management Functions (2 functions)

#### `registerEntitiesWithGameWorld(entities)`
**Purpose**: Register LevelLoader entities with legacy arrays  
**Process**:
1. Iterate entities array
2. Push to appropriate global array (ants, resource_list, Buildings)
3. Push to selectables (for ants/buildings)
4. Register with spatialGridManager
5. Return counts

**Used by**: `loadCustomLevel()`

#### `clearGameEntities()`
**Purpose**: Clear all entities before loading custom level  
**Clears**:
- `ants.length = 0`
- `resource_list.length = 0`
- `Buildings.length = 0`
- `selectables.length = 0`
- `queenAnt = null`
- `spatialGridManager.clear()`
- `resourceManager.stopSpawning()`

**Returns**: Object with counts

---

### Level Loading Functions (1 async function)

#### `loadCustomLevel(levelPath)` - COMPLEX
**Purpose**: Load level from JSON (Level Editor export)  
**Dependencies**: MapManager, LevelLoader, EntityService  
**Steps**:
1. `entityService.clearAll()` - Clear existing entities
2. Fetch level JSON
3. `mapManager.loadLevel(levelData, mapId, true)` - Load terrain
4. Update `g_activeMap`, `g_map2`
5. `new LevelLoader()` - Parse entity data
6. **Entity Spawning** (CRITICAL SECTION):
   - Iterate `result.entities`
   - For each entity type:
     - **Ant**: `entityService.spawn('Ant', { x, y, jobName, faction })`
       - Push to `ants[]` (legacy rendering)
       - Push to `selectables[]`
       - Track queen for camera
     - **Resource**: `entityService.spawn('Resource', { x, y, resourceType, amount })`
       - Push to `resource_list[]`
     - **Building**: `entityService.spawn('Building', { x, y, buildingType, faction })`
       - Push to `Buildings[]`
7. **Camera Setup**:
   - `window.queenAnt = queen`
   - `cameraManager.followEntity(queen)`
   - `cameraManager.activeCamera.centerOn(queenX, queenY)`
8. `GameState.goToGame()`
9. `cameraManager.setCurrentMap(terrain)`

**Migration Impact**: Entity spawning section needs WorldService conversion

---

### Main Loop Functions (2 functions)

#### `draw()` - CRITICAL
**Purpose**: Main rendering loop (60fps)  
**Phase 1: UPDATE**:
- `soundManager.onDraw()`
- `cameraManager.update()` (if in-game or LEVEL_EDITOR)
- **Entity Updates** (CRITICAL):
  - `entityService.update(deltaTime)` - Syncs sprite positions via Entity.update()
  - LEGACY FALLBACK: Direct `ants.forEach(ant => ant.update())`
- `g_enemyAntBrush.update()`
- `g_lightningAimBrush.update()`
- `g_resourceBrush.update()`
- `g_buildingBrush.update()`
- `updateQueenPanelVisibility()`
- `g_queenControlPanel.update()`
- `eventManager.update()`
- `g_fireballManager.update()`
- `g_lightningManager.update()`
- `g_globalTime.update()`
- **Queen movement** (WASD keys)
- **Level Editor**: `levelEditor.update()` if active

**Phase 2: RENDER**:
- **Level Editor Mode**:
  - `background(40, 40, 40)`
  - `levelEditor.render()`
  - `RenderManager.render(GameState.getState())` - For draggable panels
- **Normal Game Mode**:
  - `RenderManager.render(GameState.getState())`
- **Debug Overlays**:
  - `drawCoordinateVisualization()` (if enabled)
  - `drawTerrainGrid()` (if enabled)
- `settingsPanel.render()`

**Migration Impact**: 
- Entity updates: Replace `entityService.update()` with `world.update()`
- Rendering: Replace `RenderManager.render()` with `world.render()`

#### `windowResized()` - Utility
**Purpose**: Handle window resize  
**Actions**:
- `g_activeMap.renderConversion.setCanvasSize([windowWidth, windowHeight])`
- Update `g_canvasX`, `g_canvasY`
- `resizeCanvas(g_canvasX, g_canvasY)`

---

### Mouse Event Functions (6 functions)

#### `handleMouseEvent(type, ...args)` - Utility
**Purpose**: Delegate mouse events to g_mouseController  
**Condition**: Only if `GameState.isInGame()`

#### `mousePressed()` - COMPLEX
**Priority Order**:
1. **Settings Panel** - `settingsPanel.handleClick()`
2. **Middle-click pan** - `MiddleClickPan.handlePress()`
3. **Level Editor** - `levelEditor.handleClick()`
4. **Tile Inspector** - `inspectTileAtMouse()`
5. **UI Debug Manager** - `g_uiDebugManager.handlePointerDown()`
6. **Brush Handling** - `brushHandling()`
7. **RenderManager** - `RenderManager.dispatchPointerEvent('pointerdown')`
8. **DraggablePanelManager** - `draggablePanelManager.handleMouseEvents()`
9. **Queen Control Panel** - `g_queenControlPanel.handleMouseClick()`
10. **Legacy** - `handleMouseEvent('handleMousePressed')`

#### `mouseDragged()` - COMPLEX
**Priority Order**:
1. **Settings Panel** - `settingsPanel.handleMouseDrag()`
2. **Middle-click pan** - `MiddleClickPan.handleDrag()`
3. **Level Editor** - `levelEditor.handleDrag()`
4. **UI Debug Manager** - `g_uiDebugManager.handlePointerMove()`
5. **RenderManager** - `RenderManager.dispatchPointerEvent('pointermove')`
6. **Legacy** - `handleMouseEvent('handleMouseDragged')`

#### `mouseReleased()` - COMPLEX
**Priority Order**:
1. **Settings Panel** - `settingsPanel.handleMouseRelease()`
2. **Middle-click pan** - `MiddleClickPan.handleRelease()`
3. **Level Editor** - `levelEditor.handleMouseRelease()`
4. **UI Debug Manager** - `g_uiDebugManager.handlePointerUp()`
5. **Brushes** (enemy ant, resource, building, lightning)
6. **RenderManager** - `RenderManager.dispatchPointerEvent('pointerup')`
7. **Legacy** - `handleMouseEvent('handleMouseReleased')`

#### `mouseMoved()` - Simple
**Purpose**: Handle hover for Level Editor  
**Actions**:
- `levelEditor.handleHover(mouseX, mouseY)`
- `levelEditor.handleMouseMoved(mouseX, mouseY)`

#### `mouseWheel(event)` - COMPLEX
**Purpose**: Scroll wheel events  
**Level Editor Mode**:
- `levelEditor.handleMouseWheel(event, shiftPressed, mouseX, mouseY)`
- Falls back to `levelEditor.handleZoom(delta)`

**Game Mode**:
- Cycle brushes (enemy ant, resource, lightning)
- `g_queenControlPanel.handleMouseWheel(delta)`
- `cameraManager.handleMouseWheel(event)` - Zoom

---

### Keyboard Event Functions (3 functions)

#### `handleKeyEvent(type, ...args)` - Utility
**Purpose**: Delegate keyboard events to g_keyboardController  
**Condition**: Only if `GameState.isInGame()`

#### `keyPressed()` - VERY COMPLEX
**Priority Order**:
1. **Settings Panel Escape** - Close settings
2. **Level Editor**:
   - Escape: Clear cursor attachment
   - Other keys: `levelEditor.handleKeyPress(key)`
3. **Coordinate Debug** - Tilde (~) key
4. **Tile Inspector** - T key
5. **Terrain Grid Debug** - `handleTerrainGridKeys()`
6. **Debug Console** - `handleDebugConsoleKeys()`
7. **Escape** - `deselectAllEntities()`
8. **UI Shortcuts** - `UIManager.handleKeyPress()`
9. **Render Layer Toggles** (Shift + C/V/B/N/M/,/.)
10. **Queen Movement** - WASD, R (rally), M (gather)
11. **Escape** - `deactivateActiveBrushes()`, `g_selectionBoxController.deselectAll()`
12. **Legacy** - `handleKeyEvent('handleKeyPressed')`
13. **Camera Follow** - F key
14. **Camera Navigation**:
    - H: Home (center on map)
    - O: Overview (zoom out)
    - R: Reset zoom
15. **Camera Zoom** - +/- keys

#### `doubleClicked()` - Simple
**Purpose**: Handle double-click  
**Level Editor**: `levelEditor.handleDoubleClick()`

---

### Utility Functions (10 functions)

#### `getPrimarySelectedEntity()` - Legacy
**Purpose**: Get selected entity (antManager or global selectedAnt)  
**Returns**: Selected entity or null

#### `getEntityWorldCenter(entity)` - Legacy
**Purpose**: Calculate entity center in world coords  
**Returns**: { x, y } or null

#### `getMapPixelDimensions()` - Utility
**Purpose**: Get map size in pixels  
**Returns**: { width, height }

#### `deactivateActiveBrushes()` - Utility
**Purpose**: Turn off resource/enemy ant brushes  
**Returns**: Boolean (was any brush deactivated)

#### `drawDebugGrid(tileSize, gridWidth, gridHeight)` - Debug
**Purpose**: Draw grid overlay for debugging

#### `setActiveMap(mapIdOrMap)` - MapManager wrapper
**Purpose**: Switch active terrain map  
**Delegates to**: `mapManager.setActiveMap()` or `mapManager.registerMap()`

#### `getActiveMap()` - MapManager wrapper
**Purpose**: Get current active map  
**Delegates to**: `mapManager.getActiveMap()` or returns `g_activeMap`

#### `loadMossStoneLevel()` - Test level
**Purpose**: Create moss/stone column level for testing  
**Uses**: `createMossStoneColumnLevel()`, `mapManager.registerMap()`

#### `switchToLevel(levelId)` - Level switcher
**Purpose**: Switch level and start game  
**Steps**:
1. Load or switch to level (calls `loadMossStoneLevel()` if needed)
2. `setActiveMap(levelId)`
3. `g_activeMap.invalidateCache()` - Force re-render
4. `startGameTransition()`

#### `disableContextMenu()` - Utility
**Purpose**: Force disable right-click menu

---

### Debug Functions (3 functions)

#### `window.spawnDebugAnt()` - Debug
**Purpose**: Spawn test ant at camera center  
**Steps**:
1. Get camera position
2. Calculate viewport center in world coords
3. Create new ant at center
4. Push to ants[], selectables[]
5. Register with spatialGridManager, g_tileInteractionManager

#### `window.goToQueen()` - Debug
**Purpose**: Center camera on Queen  
**Steps**:
1. Find Queen via `antManager.getAllAnts()`
2. Get Queen position
3. `cameraManager.activeCamera.centerOn(queen.x, queen.y)`
4. Force redraws

#### `window.checkCamera()` - Debug
**Purpose**: Log camera state and Queen distance  
**Logs**:
- Active camera type
- Camera position, zoom
- Queen position
- Distance from camera to Queen
- Whether Queen is in viewport

---

## Migration Strategy for WorldService

### Phase 1: Replace Entity Spawning
**Files to update**: sketch.js, loadCustomLevel()  
**Changes**:
```javascript
// OLD
entityService.spawn('Ant', { x, y, jobName, faction })

// NEW
world.spawnEntity('Ant', { x, y, jobName, faction })
```

### Phase 2: Replace Terrain API
**Files to update**: sketch.js, initializeWorld(), loadCustomLevel()  
**Changes**:
```javascript
// OLD
mapManager.loadLevel(levelData, mapId, true)
g_map2.getTileAtGridCoords(x, y)

// NEW
world.loadTerrain(levelData, mapId)
world.getTileAt(x, y)
```

### Phase 3: Replace Camera API
**Files to update**: sketch.js, setup(), draw(), keyPressed()  
**Changes**:
```javascript
// OLD
cameraManager.setPosition(x, y)
cameraManager.screenToWorld(x, y)
cameraManager.update()

// NEW
world.setCameraPosition(x, y)
world.screenToWorld(x, y)
world.update(deltaTime) // includes camera
```

### Phase 4: Replace Spatial Grid
**Files to update**: sketch.js, registerEntitiesWithGameWorld()  
**Changes**:
```javascript
// OLD
spatialGridManager.getNearbyEntities(x, y, radius)
spatialGridManager.registerEntity(entity)

// NEW
world.getNearbyEntities(x, y, radius)
// Registration automatic in world.spawnEntity()
```

### Phase 5: Replace Rendering
**Files to update**: sketch.js, draw()  
**Changes**:
```javascript
// OLD
RenderManager.render(GameState.getState())
entityService.update(deltaTime)

// NEW
world.render()
world.update(deltaTime)
```

### Phase 6: Replace Panel Management
**Files to update**: Any file using draggablePanelManager  
**Changes**:
```javascript
// OLD
draggablePanelManager.registerPanel(panel)
draggablePanelManager.bringToFront(id)

// NEW
world.registerPanel(panel)
world.bringPanelToFront(id)
```

---

## Critical Dependencies

### Systems that MUST work with WorldService:
1. **RenderManager** - Layer-based rendering (being replaced)
2. **GameState** - State machine (MENU, PLAYING, PAUSED, LEVEL_EDITOR)
3. **Level Editor** - Tools, brushes, panels (keep as-is)
4. **Brushes** - Enemy ant, resource, building, lightning (update spawn calls)
5. **Queen Control Panel** - UI panel (register with world.registerPanel())
6. **Selection System** - SelectionBoxController (update entity queries)

### Systems that can stay separate:
1. **EventManager** - Random events (independent)
2. **FireballManager**, **LightningManager** - Combat systems (independent)
3. **MiddleClickPan** - Camera pan (can delegate to world.camera)
4. **SettingsManager** - Settings persistence (independent)
5. **SoundManager** - Audio (independent for now)

---

## Risk Areas

### High Risk:
1. **Legacy arrays** (ants[], resource_list[], Buildings[], selectables[])
   - EntityLayerRenderer.collectAnts() depends on ants[]
   - May need to keep legacy arrays during transition
   
2. **Entity spawning in loadCustomLevel()**
   - Complex logic with legacy array pushes
   - Need careful migration to world.spawnEntity()

3. **draw() loop**
   - Many systems updated/rendered
   - Need to migrate systematically

### Medium Risk:
1. **Camera system**
   - Deeply integrated (follow, zoom, pan)
   - Many event handlers depend on it

2. **Selection system**
   - Relies on selectables[] array
   - RenderManager integration

### Low Risk:
1. **Debug functions**
   - Easy to update (spawnDebugAnt, goToQueen)
   
2. **Utility functions**
   - Simple wrappers (setActiveMap, getActiveMap)

---

## Next Steps

1. ✅ Complete analysis (this document)
2. ⏳ Update sketch.js initialization (world = new WorldService())
3. ⏳ Replace entity spawning calls (world.spawnEntity())
4. ⏳ Replace terrain queries (world.getTileAt())
5. ⏳ Replace camera calls (world.setCameraPosition())
6. ⏳ Replace spatial queries (world.getNearbyEntities())
7. ⏳ Replace rendering (world.render())
8. ⏳ Replace update loop (world.update())
9. ⏳ Run regression tests (expect 716+ passing)
10. ⏳ Delete 43 manager/rendering files
