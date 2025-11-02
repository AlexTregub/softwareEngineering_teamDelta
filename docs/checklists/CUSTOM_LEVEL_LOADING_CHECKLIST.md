# Custom Level Loading - Feature Development Checklist

**Feature**: Load custom levels created in Level Editor into playable game state

**Estimated Effort**: 32-40 hours (4-5 days of work)

**Branch**: `DW_LevelTrans`

**Date Started**: November 2, 2025

---

## Overview

**User Stories**:
1. As a level designer, I want to load custom levels from the Level Editor into a playable state so I can test my creations
2. As a player, I want to select custom levels from a menu so I can play community-created content
3. As a developer, I want level data to integrate with existing terrain/pathfinding systems so custom levels work seamlessly
4. As a player, I want the camera to follow the queen ant when the game starts so I know where my base is
5. As a player, I want the game to end when the queen dies so there are clear win/loss conditions

**Key Design Decisions**:
- **Terrain System Integration**: Analyze MapManager, GridTerrain, and PathMap coupling → refactor for unified system
- **Entity Spawning**: Use EntityFactory pattern with template IDs from EntityPalette
- **Grid Coordinates**: Store entities as grid coords in JSON, convert to world coords at spawn time
- **Camera Following**: Implement queen tracking on game start using existing CameraManager
- **Game Over State**: Detect queen death and trigger GameState transition to GAME_OVER
- **Active Map Reference**: Use `g_activeMap` (not `g_map2`) as the swappable terrain reference

**Implementation Notes**:

### Terrain System Coupling Analysis
```javascript
// CURRENT: Three separate systems
// 1. GridTerrain (Classes/terrainUtils/GridTerrain.js) - Chunk-based terrain with sparse storage
// 2. PathMap (Classes/pathfinding.js) - Wraps old Terrain class in Grid for A* pathfinding
// 3. MapManager (Classes/managers/MapManager.js) - Manages map registration and switching

// PROBLEM: PathMap is tightly coupled to old Terrain class structure
// PathMap expects: terrain._xCount, terrain._yCount, terrain._tileStore[], terrain.conv2dpos()
// GridTerrain uses: chunkArray, renderConversion, sparse tile storage

// SOLUTION OPTIONS:
// Option A: Create GridTerrain adapter for PathMap (preserves existing pathfinding)
// Option B: Refactor PathMap to work directly with GridTerrain API
// Option C: Create unified TerrainInterface that both systems implement
```

### Camera Following Algorithm
```javascript
// When game starts (GameState.startGame() or level load):
// 1. Find queen ant in ants[] or custom level entities
// 2. If queen exists:
//    - cameraManager.followEntity(queenAnt)
//    - cameraManager.enableFollow()
// 3. If no queen found:
//    - Center camera on starting area or map center
```

### Game Over Detection
```javascript
// In game update loop (draw()):
// 1. If GameState === 'PLAYING':
//    - Check if queen exists and is alive
//    - If queen.health <= 0:
//      - GameState.endGame()
//      - Show death screen with "Game Over" message
//      - Options: Restart level, Return to menu, Load checkpoint
```

---

## Phase 1: System Analysis & Refactoring (High Priority)

**Goal**: Understand terrain/pathfinding coupling and plan unified system

### 1.1: Terrain System Audit

- [ ] **Analyze GridTerrain API** (Classes/terrainUtils/GridTerrain.js)
  - [ ] Document chunkArray structure and access patterns
  - [ ] Document renderConversion (grid ↔ world coordinate system)
  - [ ] Document getTile(), setTile() methods
  - [ ] Document sparse vs dense storage behavior
  - [ ] **Deliverable**: `docs/api/GridTerrain_Analysis.md`

- [ ] **Analyze PathMap coupling** (Classes/pathfinding.js)
  - [ ] Document dependencies on old Terrain class
  - [ ] List required terrain methods (_xCount, _yCount, _tileStore, conv2dpos)
  - [ ] Identify coordinate system differences
  - [ ] Document Node class terrain weight integration
  - [ ] **Deliverable**: `docs/api/PathMap_Coupling_Analysis.md`

- [ ] **Analyze MapManager capabilities** (Classes/managers/MapManager.js)
  - [ ] Review map registration system
  - [ ] Check if level loading methods exist
  - [ ] Document getTileAtGridCoords() and getTileAtPosition()
  - [ ] Verify g_activeMap swapping behavior
  - [ ] **Deliverable**: MapManager enhancement plan

### 1.2: Terrain System Integration (Choose Strategy)

**Decision Point**: Choose integration approach after analysis

- [ ] **Option A: GridTerrain Adapter Pattern** (RECOMMENDED - preserves existing code)
  - [ ] Write unit tests for GridTerrainAdapter
  - [ ] Implement adapter that exposes PathMap-compatible API
  - [ ] Methods: `_xCount`, `_yCount`, `_tileStore[]`, `conv2dpos(x, y)`
  - [ ] Map GridTerrain chunks to flat array view
  - [ ] Integration tests with PathMap
  - [ ] **Deliverable**: `Classes/adapters/GridTerrainAdapter.js`

- [ ] **Option B: Refactor PathMap for GridTerrain** (more work, cleaner long-term)
  - [ ] Write unit tests for refactored PathMap
  - [ ] Update PathMap constructor to accept GridTerrain directly
  - [ ] Replace _tileStore array iteration with chunk queries
  - [ ] Update coordinate conversion to use renderConversion
  - [ ] Integration tests with GridTerrain
  - [ ] **Deliverable**: Updated `Classes/pathfinding.js`

- [ ] **Option C: Unified Terrain Interface** (future-proof, most work)
  - [ ] Define ITerrainSystem interface
  - [ ] Write unit tests for interface implementations
  - [ ] Implement interface for GridTerrain
  - [ ] Implement interface for PathMap terrain requirements
  - [ ] Create TerrainSystemFactory
  - [ ] **Deliverable**: `Classes/interfaces/ITerrainSystem.js`

- [ ] **Update MapManager for level loading**
  - [ ] Write unit tests for `loadLevel(levelData)`
  - [ ] Implement level JSON parsing
  - [ ] Create terrain from level.terrain data
  - [ ] Register loaded level with unique ID
  - [ ] Set as active map
  - [ ] **Deliverable**: Enhanced MapManager with loading capability

### 1.3: Coordinate System Unification

- [ ] **Document coordinate systems**
  - [ ] GridTerrain grid coordinates (chunk-relative)
  - [ ] PathMap grid coordinates (flat array indices)
  - [ ] World pixel coordinates (for entities)
  - [ ] Conversion utilities and edge cases
  - [ ] **Deliverable**: `docs/guides/COORDINATE_SYSTEMS.md`

- [ ] **Create coordinate conversion utilities**
  - [ ] Write unit tests for CoordinateConverter
  - [ ] gridToWorld(gridX, gridY) → {worldX, worldY}
  - [ ] worldToGrid(worldX, worldY) → {gridX, gridY}
  - [ ] Tile size handling (TILE_SIZE constant)
  - [ ] **Deliverable**: `Classes/utils/CoordinateConverter.js`

---

## Phase 2: Level Loader System (High Priority)

**Goal**: Parse level JSON and instantiate game world

### 2.1: LevelLoader Core

- [ ] **Write unit tests for LevelLoader** (TDD)
  - [ ] Test loadLevel(levelData) with valid JSON
  - [ ] Test invalid JSON handling (missing fields, malformed)
  - [ ] Test terrain loading from level.terrain
  - [ ] Test entity spawning from level.entities[]
  - [ ] Test coordinate conversion (grid → world)
  - [ ] Test empty level edge case

- [ ] **Implement LevelLoader class**
  - [ ] Create `Classes/loaders/LevelLoader.js`
  - [ ] Constructor with optional terrain/entity factories
  - [ ] loadLevel(levelData) main method
  - [ ] _loadTerrain(terrainData) private method
  - [ ] _spawnEntities(entitiesData) private method
  - [ ] Error handling and validation
  - [ ] **Deliverable**: Working LevelLoader class

- [ ] **Integration tests**
  - [ ] Load real level JSON from Level Editor export
  - [ ] Verify terrain matches exported data
  - [ ] Verify entities spawn at correct positions
  - [ ] Verify spatial grid registration
  - [ ] Performance test with large levels (1000+ entities)

### 2.2: Level Validation

- [ ] **Write unit tests for LevelValidator** (TDD)
  - [ ] Test validate(levelData) with complete data
  - [ ] Test missing required fields (terrain, entities)
  - [ ] Test invalid entity types (not in EntityPalette)
  - [ ] Test out-of-bounds entity positions
  - [ ] Test terrain format validation
  - [ ] Test multiple validation errors accumulation

- [ ] **Implement LevelValidator class**
  - [ ] Create `Classes/validation/LevelValidator.js`
  - [ ] validate(levelData) returns {valid, errors[]}
  - [ ] Check required fields exist
  - [ ] Validate entity templateIds against EntityPalette
  - [ ] Validate grid coordinates within terrain bounds
  - [ ] Validate terrain structure (version, metadata, tiles)
  - [ ] **Deliverable**: LevelValidator class

- [ ] **Integration with LevelLoader**
  - [ ] Call validator before loading
  - [ ] Show user-friendly error messages
  - [ ] Prevent invalid levels from loading

---

## Phase 3: Entity Factory Pattern (High Priority)

**Goal**: Construct game entities from template data

### 3.1: EntityFactory Core

- [ ] **Write unit tests for EntityFactory** (TDD)
  - [ ] Test createFromTemplate(templateId, gridX, gridY, properties)
  - [ ] Test Ant construction from template
  - [ ] Test Building construction from template
  - [ ] Test Resource construction from template
  - [ ] Test unknown template ID handling
  - [ ] Test property override system
  - [ ] Test grid to world coordinate conversion

- [ ] **Implement EntityFactory class**
  - [ ] Create `Classes/factories/EntityFactory.js`
  - [ ] Static createFromTemplate() method
  - [ ] Integrate with EntityPalette for templates
  - [ ] Support Ant, Building, Resource types
  - [ ] Apply custom properties from level data
  - [ ] Convert grid coords to world coords
  - [ ] **Deliverable**: EntityFactory class

- [ ] **Integration tests**
  - [ ] Spawn entities from real level JSON
  - [ ] Verify entity types correct
  - [ ] Verify positions match grid coordinates
  - [ ] Verify properties applied (health, faction, etc.)
  - [ ] Verify entities registered with spatial grid

### 3.2: Entity Spawning System

- [ ] **Write unit tests for entity spawn flow**
  - [ ] Test batch spawning from entities array
  - [ ] Test queen ant special handling
  - [ ] Test worker ant spawning
  - [ ] Test building placement validation
  - [ ] Test resource node spawning

- [ ] **Implement spawning in LevelLoader**
  - [ ] Iterate entities array from level JSON
  - [ ] Call EntityFactory for each entity
  - [ ] Add to global ants[] or Buildings[] arrays
  - [ ] Register with spatialGridManager
  - [ ] Set up queen reference if present
  - [ ] **Deliverable**: Complete entity spawning

- [ ] **E2E tests with screenshots**
  - [ ] Load level with ants, buildings, resources
  - [ ] Verify all entities visible on screen
  - [ ] Verify entity selection works
  - [ ] Verify entity movement works
  - [ ] **Screenshot proof**: Entity spawning success

---

## Phase 4: Queen Ant Camera Tracking (High Priority)

**Goal**: Camera follows queen ant on game start

### 4.1: Queen Detection System

- [ ] **Write unit tests for queen finding** (TDD)
  - [ ] Test findQueenAnt() in ants[] array
  - [ ] Test queen identified by jobName === 'Queen'
  - [ ] Test queen identified by constructor name
  - [ ] Test no queen present (return null)
  - [ ] Test multiple queens (return first)
  - [ ] Test queen in custom level entities

- [ ] **Implement queen detection**
  - [ ] Create `Classes/utils/QueenFinder.js` utility
  - [ ] findQueenAnt(antsArray) method
  - [ ] Check jobName, job property, constructor
  - [ ] Handle global queenAnt or playerQueen variables
  - [ ] **Deliverable**: QueenFinder utility

- [ ] **Integration tests**
  - [ ] Find queen after level load
  - [ ] Find queen after procedural generation
  - [ ] Handle missing queen gracefully

### 4.2: Camera Following Integration

- [ ] **Write unit tests for camera following** (TDD)
  - [ ] Test startFollowingQueen(queenAnt)
  - [ ] Test camera centers on queen position
  - [ ] Test camera smoothly follows queen movement
  - [ ] Test following disabled when queen dies
  - [ ] Test following toggled on/off by user

- [ ] **Implement in CameraManager**
  - [ ] Add followQueen() method to CameraManager
  - [ ] Set queen as follow target
  - [ ] Enable camera following
  - [ ] Handle queen death (stop following)
  - [ ] **Deliverable**: Queen following in CameraManager

- [ ] **Integrate with game initialization**
  - [ ] Call in GameState.startGame()
  - [ ] Call in LevelLoader after entities spawn
  - [ ] Call in initializeWorld() for procedural
  - [ ] **Deliverable**: Auto-follow on game start

- [ ] **E2E tests with screenshots**
  - [ ] Start game, verify camera on queen
  - [ ] Load custom level, verify camera on queen
  - [ ] Move queen, verify camera follows
  - [ ] **Screenshot proof**: Camera tracking queen

---

## Phase 5: Game Over on Queen Death (High Priority)

**Goal**: End game when queen dies

### 5.1: Queen Health Monitoring

- [ ] **Write unit tests for health monitoring** (TDD)
  - [ ] Test isQueenAlive() check
  - [ ] Test queen health <= 0 detection
  - [ ] Test queen removed from ants[] array
  - [ ] Test queen reference set to null
  - [ ] Test monitoring disabled when no queen

- [ ] **Implement health monitoring**
  - [ ] Create `Classes/systems/QueenHealthMonitor.js`
  - [ ] update() called each frame
  - [ ] Check queen existence and health
  - [ ] Trigger callback on queen death
  - [ ] **Deliverable**: QueenHealthMonitor system

- [ ] **Integration tests**
  - [ ] Damage queen, verify detection at 0 health
  - [ ] Remove queen from ants[], verify detection
  - [ ] Multiple update calls don't trigger twice

### 5.2: Game Over State Transition

- [ ] **Write unit tests for game over** (TDD)
  - [ ] Test triggerGameOver() transitions to GAME_OVER
  - [ ] Test game over screen shows "Queen Defeated"
  - [ ] Test restart button returns to MENU
  - [ ] Test retry button reloads level
  - [ ] Test game over state prevents entity updates

- [ ] **Implement game over transition**
  - [ ] Add onQueenDeath callback to QueenHealthMonitor
  - [ ] Call GameState.endGame() on queen death
  - [ ] Create game over UI panel (DraggablePanelManager)
  - [ ] Show defeat message and options
  - [ ] **Deliverable**: Game over screen

- [ ] **Integrate with game loop**
  - [ ] Check queen health in draw()
  - [ ] Prevent updates when GAME_OVER state
  - [ ] Show game over UI panel
  - [ ] **Deliverable**: Complete game over flow

- [ ] **E2E tests with screenshots**
  - [ ] Kill queen, verify game over screen
  - [ ] Verify "Queen Defeated" message visible
  - [ ] Click restart, verify returns to menu
  - [ ] **Screenshot proof**: Game over state

---

## Phase 6: Game Initialization from Custom Level (High Priority)

**Goal**: Initialize game world with custom level instead of procedural

### 6.1: Level Loading Flow

- [ ] **Write integration tests for load flow** (TDD)
  - [ ] Test loadCustomLevel(levelData) full flow
  - [ ] Test terrain initialized from JSON
  - [ ] Test entities spawned from JSON
  - [ ] Test spatial grid initialized
  - [ ] Test pathfinding system initialized
  - [ ] Test queen found and camera follows
  - [ ] Test GameState transitions to PLAYING

- [ ] **Implement loadCustomLevel() in sketch.js**
  - [ ] Accept levelData as parameter
  - [ ] Call LevelValidator
  - [ ] Call LevelLoader.loadLevel()
  - [ ] Initialize spatialGridManager with new map
  - [ ] Create PathMap for new terrain (or adapter)
  - [ ] Find queen and start camera following
  - [ ] Set up QueenHealthMonitor
  - [ ] Set GameState to PLAYING
  - [ ] **Deliverable**: loadCustomLevel() function

- [ ] **Update initializeWorld() for swappable init**
  - [ ] Check if custom level or procedural
  - [ ] If procedural: existing perlin noise generation
  - [ ] If custom: call loadCustomLevel()
  - [ ] **Deliverable**: Unified initialization

### 6.2: Active Map Integration

- [ ] **Write unit tests for g_activeMap** (TDD)
  - [ ] Test g_activeMap set after level load
  - [ ] Test g_activeMap used by pathfinding
  - [ ] Test g_activeMap used by rendering
  - [ ] Test g_activeMap swappable between levels
  - [ ] Test g_map2 still works for backwards compat

- [ ] **Implement active map switching**
  - [ ] LevelLoader sets g_activeMap after load
  - [ ] MapManager.setActiveMap() updates reference
  - [ ] Update pathfinding to use g_activeMap
  - [ ] Update rendering to use g_activeMap
  - [ ] Keep g_map2 as fallback reference
  - [ ] **Deliverable**: Swappable terrain system

- [ ] **Integration tests**
  - [ ] Load level 1, verify g_activeMap
  - [ ] Load level 2, verify g_activeMap switches
  - [ ] Verify pathfinding uses correct map
  - [ ] Verify rendering uses correct map

---

## Phase 7: UI/Menu Integration (Medium Priority)

**Goal**: Let users select and load custom levels

### 7.1: File Picker Dialog

- [ ] **Write E2E tests for file selection** (TDD with screenshots)
  - [ ] Test file input appears on button click
  - [ ] Test .json file selection
  - [ ] Test invalid file format rejection
  - [ ] Test file parsing and validation
  - [ ] Test level loads after selection

- [ ] **Implement file picker**
  - [ ] Create `<input type="file" accept=".json">` element
  - [ ] Wire to "Load Custom Level" button
  - [ ] Handle file read via FileReader API
  - [ ] Parse JSON and validate
  - [ ] Pass to loadCustomLevel()
  - [ ] **Deliverable**: Working file picker

- [ ] **E2E tests with screenshots**
  - [ ] Click "Load Custom Level"
  - [ ] Select valid level JSON
  - [ ] Verify level loads and game starts
  - [ ] **Screenshot proof**: Custom level loaded

### 7.2: Main Menu Integration

- [ ] **Update main menu config**
  - [ ] Add "Load Custom Level" button to `config/button-groups/main-menu.json`
  - [ ] Position below "Start New Game"
  - [ ] Set action handler to show file picker
  - [ ] **Deliverable**: Updated menu config

- [ ] **Add menu handlers**
  - [ ] Implement `menu.loadCustomLevel()` handler
  - [ ] Show file picker dialog
  - [ ] Show loading screen during load
  - [ ] Handle load errors gracefully
  - [ ] **Deliverable**: Menu integration complete

- [ ] **E2E test full workflow**
  - [ ] Start game → Main Menu
  - [ ] Click "Load Custom Level"
  - [ ] Select level file
  - [ ] Verify game starts with custom level
  - [ ] Verify queen camera tracking
  - [ ] Verify entities spawned correctly
  - [ ] **Screenshot proof**: End-to-end flow

---

## Phase 8: Polish & Error Handling (Low Priority)

**Goal**: Professional UX and robust error handling

### 8.1: Loading Screen

- [ ] **Create loading state**
  - [ ] Add LOADING_LEVEL to GameState.STATES
  - [ ] Show progress indicator
  - [ ] Display "Loading level..." message
  - [ ] Handle large level loading time

- [ ] **Progress tracking**
  - [ ] Terrain loading progress (0-50%)
  - [ ] Entity spawning progress (50-100%)
  - [ ] Display percentage complete
  - [ ] **Deliverable**: Loading screen

### 8.2: Error Messages

- [ ] **User-friendly error handling**
  - [ ] Show notification for invalid level JSON
  - [ ] Show notification for missing entities
  - [ ] Show notification for terrain load failure
  - [ ] Provide actionable error messages
  - [ ] **Deliverable**: Error notification system

### 8.3: Level Browser (Future Enhancement)

- [ ] **LocalStorage level list**
  - [ ] Show saved levels from localStorage
  - [ ] Thumbnail/preview images
  - [ ] Search and filter levels
  - [ ] Delete saved levels
  - [ ] **Deliverable**: Level browser UI

---

## Testing Strategy

### Unit Tests (Write FIRST)
- LevelLoader (parsing, validation, spawning)
- LevelValidator (all validation rules)
- EntityFactory (template-based construction)
- QueenFinder (detection in various scenarios)
- QueenHealthMonitor (death detection)
- CoordinateConverter (grid ↔ world)
- GridTerrainAdapter (if using Option A)

### Integration Tests
- LevelLoader + MapManager + GridTerrain
- EntityFactory + EntityPalette + spatial grid
- PathMap + GridTerrain (via adapter or refactor)
- Camera + Queen following
- Game over + queen death

### E2E Tests (PRIMARY with screenshots)
- Load custom level from menu
- Verify terrain renders correctly
- Verify entities spawn at correct positions
- Verify camera follows queen
- Kill queen, verify game over
- Complete gameplay loop with custom level

### BDD Tests (Headless)
- User loads custom level
- User plays custom level
- User experiences game over when queen dies

---

## Documentation Updates

- [ ] Create `docs/api/GridTerrain_Analysis.md`
- [ ] Create `docs/api/PathMap_Coupling_Analysis.md`
- [ ] Create `docs/guides/COORDINATE_SYSTEMS.md`
- [ ] Create `docs/api/LevelLoader_API.md`
- [ ] Create `docs/api/EntityFactory_API.md`
- [ ] Update `docs/api/MapManager_API.md` with loading methods
- [ ] Update `docs/api/CameraManager_API.md` with queen following
- [ ] Update `docs/api/GameStateManager_API.md` with GAME_OVER state
- [ ] Create `docs/guides/CUSTOM_LEVEL_WORKFLOW.md` (user guide)

---

## CHANGELOG.md Updates

### User-Facing Changes

#### Added
- **Custom Level Loading**: Load levels created in Level Editor into playable game
  - File picker for selecting .json level files
  - "Load Custom Level" button in main menu
  - Loading screen with progress indicator
  - Error notifications for invalid levels

- **Queen Camera Tracking**: Camera automatically follows queen ant on game start
  - Smooth camera following as queen moves
  - Centers on queen when loading custom levels
  - Works with both procedural and custom levels

- **Game Over State**: Game ends when queen ant is killed
  - "Queen Defeated" message displayed
  - Options to restart level or return to menu
  - Prevents further gameplay after queen death

#### Fixed
- **Active Map System**: `g_activeMap` now properly switches between levels (not `g_map2`)

---

### Developer-Facing Changes

#### Added
- **LevelLoader System**: Parse level JSON and instantiate game world
  - Classes: `LevelLoader`, `LevelValidator`, `EntityFactory`
  - Methods: `loadLevel()`, `validate()`, `createFromTemplate()`
  - Grid coordinate to world coordinate conversion

- **Terrain System Integration**: Unified GridTerrain and PathMap systems
  - **Option A**: `GridTerrainAdapter` for PathMap compatibility
  - **Option B**: Refactored PathMap for GridTerrain direct access
  - **Option C**: `ITerrainSystem` unified interface
  - MapManager enhanced with `loadLevel()` method

- **QueenHealthMonitor**: Detects queen death and triggers game over
  - Classes: `QueenHealthMonitor`, `QueenFinder`
  - Methods: `update()`, `findQueenAnt()`, `onQueenDeath()`

- **CameraManager Enhancements**: Queen following capability
  - Methods: `followQueen()`, `startFollowingQueen()`
  - Auto-enables on game start and level load

#### Refactored
- **initializeWorld()**: Supports both procedural and custom level initialization
  - Checks for custom level data parameter
  - Unified initialization flow
  - Breaking: Signature changed from `initializeWorld()` to `initializeWorld(levelData = null)`

- **Coordinate Systems**: Unified grid and world coordinate handling
  - Classes: `CoordinateConverter`
  - Methods: `gridToWorld()`, `worldToGrid()`
  - TILE_SIZE constant used consistently

#### Migration Guides
- **Active Map Migration**: Replace `g_map2` references with `g_activeMap`
  - Before: `const tile = g_map2.getTileAtGridCoords(x, y);`
  - After: `const tile = g_activeMap.getTileAtGridCoords(x, y);`
  - Fallback: `g_map2` still works for backwards compatibility

---

## Acceptance Criteria

**Definition of Done**:
- [ ] All unit tests passing (100% coverage for new code)
- [ ] All integration tests passing
- [ ] All E2E tests passing with screenshot proof
- [ ] Custom level loads from file picker
- [ ] Terrain matches Level Editor export
- [ ] Entities spawn at correct grid positions
- [ ] Queen camera tracking works on game start
- [ ] Game over triggers on queen death
- [ ] PathMap works with GridTerrain (via adapter or refactor)
- [ ] `g_activeMap` properly switches between levels
- [ ] Documentation complete (API refs, guides)
- [ ] CHANGELOG.md updated
- [ ] No regressions in existing game systems

---

## Notes

**CRITICAL DEPENDENCIES**:
1. **GridTerrain + PathMap Integration** - Must be resolved FIRST before entity spawning
2. **EntityFactory** - Depends on EntityPalette existing templates
3. **Queen Tracking** - Depends on queen detection and CameraManager API
4. **Game Over** - Depends on queen health monitoring

**RISK AREAS**:
- PathMap refactoring may break existing ant movement (test extensively)
- Coordinate system mismatch between GridTerrain and PathMap
- Large levels may cause performance issues (benchmark required)
- Queen not found in custom levels (graceful fallback needed)

**PERFORMANCE TARGETS**:
- Level load time: <2 seconds for 1000 entities
- Pathfinding initialization: <500ms for 100x100 grid
- Entity spawning: <1 second for 500 entities

**FALLBACK PLAN**:
- If PathMap integration fails, use procedural terrain only for now
- If queen tracking fails, center camera on map center
- If game over fails, continue playing without queen (degraded mode)

---

## Progress Tracking

**Last Updated**: November 2, 2025

**Current Phase**: Phase 1 - System Analysis & Refactoring

**Completed**:
- [x] Checklist created
- [ ] GridTerrain analysis
- [ ] PathMap coupling analysis

**Blocked Items**: None

**Next Steps**:
1. Analyze GridTerrain API and structure
2. Analyze PathMap terrain dependencies
3. Choose integration strategy (Option A, B, or C)
4. Begin GridTerrain adapter or PathMap refactor
