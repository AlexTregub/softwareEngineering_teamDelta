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

- [x] **Analyze GridTerrain API** (Classes/terrainUtils/GridTerrain.js)
  - [x] Document chunkArray structure and access patterns
  - [x] Document renderConversion (grid ↔ world coordinate system)
  - [x] Document get(), set(), getArrPos(), setArrPos() methods
  - [x] Document sparse vs dense storage behavior
  - [x] **Deliverable**: `docs/api/GridTerrain_Analysis.md` ✅

- [x] **Analyze PathMap coupling** (Classes/pathfinding/pathfinding.js)
  - [x] Document dependencies on old Terrain class
  - [x] List required terrain methods (_xCount, _yCount, _tileStore, conv2dpos)
  - [x] Identify coordinate system differences
  - [x] Document Node class terrain weight integration
  - [x] Document 3 integration options (Adapter/Refactor/Interface)
  - [x] **Deliverable**: `docs/api/PathMap_Coupling_Analysis.md` ✅
  - [x] **DECISION**: Use Option A - GridTerrainAdapter (low risk, fast implementation)

- [ ] **Analyze MapManager capabilities** (Classes/managers/MapManager.js)
  - [ ] Review map registration system
  - [ ] Check if level loading methods exist
  - [ ] Document getTileAtGridCoords() and getTileAtPosition()
  - [ ] Verify g_activeMap swapping behavior
  - [ ] **Deliverable**: MapManager enhancement plan

### 1.2: Terrain System Integration (Choose Strategy)

**Decision Point**: ✅ **CHOSEN - Option A: Separate Adapters for GridTerrain AND SparseTerrain**

- [x] **GridTerrainAdapter** (for procedural/dense maps) ✅
  - [x] Write unit tests for GridTerrainAdapter (TDD - Red phase)
  - [x] Implement adapter that exposes PathMap-compatible API
  - [x] Methods: `_xCount`, `_yCount`, `_tileStore[]`, `conv2dpos(x, y)`
  - [x] Map GridTerrain chunks to flat array view
  - [x] All 19 unit tests passing (TDD - Green phase)
  - [x] Integration tests with PathMap (18 tests passing) ✅
  - [x] **Deliverable**: `Classes/adapters/GridTerrainAdapter.js` ✅
  - [x] **Deliverable**: `test/unit/adapters/GridTerrainAdapter.test.js` ✅
  - [x] **Deliverable**: `test/integration/adapters/gridTerrainAdapter.integration.test.js` ✅

- [x] **SparseTerrainAdapter** (for Level Editor levels) ✅
  - [x] Write unit tests for SparseTerrainAdapter (TDD - Red phase)
  - [x] Implement adapter that exposes PathMap-compatible API
  - [x] Handle dynamic bounds from SparseTerrain
  - [x] Generate flat array from sparse Map<"x,y", Tile>
  - [x] Create default tiles for unpainted cells
  - [x] Handle negative coordinates and coordinate offsets
  - [x] All 20 unit tests passing (TDD - Green phase)
  - [x] Integration tests with PathMap (26 tests passing) ✅
  - [x] **Deliverable**: `Classes/adapters/SparseTerrainAdapter.js` ✅
  - [x] **Deliverable**: `test/unit/adapters/SparseTerrainAdapter.test.js` ✅
  - [x] **Deliverable**: `test/integration/adapters/sparseTerrainAdapter.integration.test.js` ✅
  - [x] **Deliverable**: `test/helpers/terrainIntegrationHelper.js` ✅ (reusable test helper)

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

### 2.1: LevelLoader Core ✅

- [x] **Write unit tests for LevelLoader** (TDD - Red phase) ✅
  - [x] Test loadLevel(levelData) with valid JSON
  - [x] Test invalid JSON handling (missing fields, malformed)
  - [x] Test terrain loading from level.terrain
  - [x] Test entity spawning from level.entities[]
  - [x] Test coordinate conversion (grid → world)
  - [x] Test empty level edge case
  - [x] **27 unit tests passing** ✅

- [x] **Implement LevelLoader class** (TDD - Green phase) ✅
  - [x] Create `Classes/loaders/LevelLoader.js`
  - [x] Constructor with optional terrain/entity factories
  - [x] loadLevel(levelData) main method
  - [x] _loadTerrain(terrainData) private method
  - [x] _spawnEntities(entitiesData) private method
  - [x] gridToWorld(gridX, gridY) coordinate conversion
  - [x] Error handling and validation
  - [x] **Deliverable**: `Classes/loaders/LevelLoader.js` ✅
  - [x] **Deliverable**: `test/unit/loaders/LevelLoader.test.js` ✅

- [x] **Integration tests** ✅
  - [x] Load real level JSON from Level Editor export
  - [x] Verify terrain creation with real SparseTerrain
  - [x] Verify entity spawning with coordinate conversion
  - [x] Verify PathMap compatibility via SparseTerrainAdapter
  - [x] Performance benchmarks (1000+ entities, 10k tiles)
  - [x] Edge cases (sparse gaps, negative coords, malformed JSON)
  - [x] **17 integration tests passing** ✅
  - [x] **Fixtures**: `test/fixtures/sample-level.json`, `large-level.json` ✅
  - [x] **Deliverable**: `test/integration/loaders/levelLoader.integration.test.js` ✅
  - [ ] Verify terrain matches exported data
  - [ ] Verify entities spawn at correct positions
  - [ ] Verify spatial grid registration
  - [ ] Performance test with large levels (1000+ entities)

### 2.2: Level Validation ✅

- [x] **Write unit tests for LevelValidator** (TDD - Red phase) ✅
  - [x] Test validate(levelData) with complete data
  - [x] Test missing required fields (terrain, entities)
  - [x] Test invalid entity types (against allowed list)
  - [x] Test out-of-bounds entity positions
  - [x] Test terrain format validation (tiles array, coordinates, materials)
  - [x] Test multiple validation errors accumulation
  - [x] Test edge cases (negative coords, null properties, large levels)
  - [x] Test custom validation options
  - [x] **36 unit tests passing** ✅
  - [x] **Deliverable**: `test/unit/validators/LevelValidator.test.js` ✅

- [x] **Implement LevelValidator class** (TDD - Green phase) ✅
  - [x] Create `Classes/validators/LevelValidator.js`
  - [x] validate(levelData) returns {valid, errors[]}
  - [x] Check required fields exist (terrain, entities)
  - [x] Validate entity types against allowed list (Ant, Queen, Resource, Building)
  - [x] Validate grid coordinates within configurable bounds
  - [x] Validate terrain structure (tiles array, coordinates, materials)
  - [x] Support both gridX/gridY and x/y tile formats
  - [x] Detailed error messages with indices
  - [x] Custom options (maxEntities, maxTiles, maxCoordinate, allowedEntityTypes)
  - [x] **Deliverable**: `Classes/validators/LevelValidator.js` ✅

- [x] **Integration with LevelLoader** ✅
  - [x] Call validator before loading (automatic when validation enabled)
  - [x] Return validation errors to caller
  - [x] Prevent invalid levels from loading
  - [x] Optional validation (can be disabled via constructor option)
  - [x] Custom validator options (maxEntities, maxTiles, allowedEntityTypes)
  - [x] **13 integration tests passing** ✅
  - [x] **Deliverable**: `test/integration/loaders/levelLoader.validation.integration.test.js` ✅

---

## Phase 3: Entity Factory Pattern (High Priority)

**Goal**: Construct game entities from template data

### 3.1: EntityFactory Core ✅

- [x] **Write unit tests for EntityFactory** (TDD - Red phase) ✅
  - [x] Test createEntity(type, gridX, gridY, properties)
  - [x] Test Ant, Queen, Resource, Building construction
  - [x] Test unknown entity type handling
  - [x] Test property application system
  - [x] Test grid to world coordinate conversion
  - [x] Test ID generation (automatic and manual)
  - [x] Test createFromLevelData() for Level Editor integration
  - [x] Test custom entity classes
  - [x] Test edge cases (large coords, fractional, batch creation)
  - [x] Test error handling
  - [x] **34 unit tests passing** ✅
  - [x] **Deliverable**: `test/unit/factories/EntityFactory.test.js` ✅

- [x] **Implement EntityFactory class** (TDD - Green phase) ✅
  - [x] Create `Classes/factories/EntityFactory.js`
  - [x] createEntity(type, gridX, gridY, properties, id) method
  - [x] createFromLevelData(levelEntityData) method
  - [x] Support Ant, Queen, Resource, Building types
  - [x] Apply custom properties from level data
  - [x] Grid→world coordinate conversion
  - [x] Automatic ID generation
  - [x] Custom entity class support
  - [x] Fallback mock classes for testing
  - [x] **Deliverable**: `Classes/factories/EntityFactory.js` ✅
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

## Phase 3.5: Game State Integration (High Priority) ✅

**Goal**: Connect LevelLoader to game systems (CameraManager, SpatialGrid)

**Status**: Complete - 17 integration tests passing

### 3.5.1: LevelLoader Enhancements ✅

- [x] **Write integration tests for game systems** (TDD - Red phase) ✅
  - [x] Test LevelLoader returns game-ready data structure
  - [x] Test terrain compatible with game systems (getTile API)
  - [x] Test entities have correct world coordinates
  - [x] Test game startup performance (<3s for typical level)
  - [x] Test CameraManager integration (queen tracking)
  - [x] Test SpatialGrid compatibility (entity format)
  - [x] Test entity registration workflow
  - [x] Test error handling in game context
  - [x] Test performance benchmarks (100+ entities, 1000+ entities)
  - [x] **17 integration tests passing** ✅
  - [x] **Deliverable**: `test/integration/loaders/levelLoader.gameState.integration.test.js` ✅

- [x] **Implement game state integration** (TDD - Green phase) ✅
  - [x] Add metadata property to loadLevel() return value
  - [x] Include id, name, description, author, version
  - [x] Fix terrain API compatibility (SparseTerrain uses getTile)
  - [x] Ensure entities have x/y + position.x/y structure
  - [x] Maintain unique entity IDs for grid tracking
  - [x] Performance: <3s for 100+ entities, <5s for 1500 entities
  - [x] **Deliverable**: LevelLoader returns {success, terrain, entities, metadata} ✅

- [x] **Verification** ✅
  - [x] All 144 existing tests still passing (no regressions)
  - [x] 17 new game state tests passing
  - [x] **Total: 161 tests passing** ✅

---

## Phase 4: Queen Ant Camera Tracking (High Priority) ✅

**Goal**: Camera follows queen ant on game start

**Status**: Phase 4.1 and 4.2 (partial) complete - Queen detection utility complete

**Goal**: Camera follows queen ant on game start

**Status**: Phase 4.1 and 4.2 (partial) complete - 161 tests passing

### 4.1: Queen Detection System ✅

- [x] **Write unit tests for queen finding** (TDD)
  - [x] Test findQueen() with entity array (17 tests)
  - [x] Test first queen returned if multiple exist
  - [x] Test null returned when no queen present
  - [x] Test case-sensitive type matching ('Queen' not 'queen')
  - [x] Test null/undefined element handling
  - [x] Test performance (<50ms for 10k entities)
  - [x] Test LevelLoader entity format compatibility
  - [x] **Deliverable**: `test/unit/utils/queenDetection.test.js` (17 tests) ✅

- [x] **Implement queen detection**
  - [x] Created `Classes/utils/queenDetection.js` utility
  - [x] findQueen(entities) method - O(n) linear search
  - [x] Returns entity reference (not copy)
  - [x] Case-sensitive type check (entity.type === 'Queen')
  - [x] Handles invalid input (null, undefined, non-array)
  - [x] **Deliverable**: queenDetection utility ✅

- [x] **Integration tests**
  - [x] Test with LevelLoader entity format (x/y + position.x/y)
  - [x] Test with entity properties intact
  - [x] Performance verified (<100ms worst case)
  - [x] **Deliverable**: Integration tests in unit test suite ✅

### 4.2: Camera Following Integration ✅

- [x] **Write unit tests for camera following** (TDD)
  - [x] Test followEntity(entity) method (16 tests)
  - [x] Test enable/disable following
  - [x] Test entity replacement
  - [x] Test null/undefined handling
  - [x] Test edge cases (no x/y coords, zero coords, negative coords)
  - [x] Test return values (true/false)
  - [x] Test zoom compatibility
  - [x] **Deliverable**: `test/unit/controllers/CameraManager.followEntity.test.js` (16 tests) ✅

- [x] **Implement in CameraManager**
  - [x] Add followEntity(entity) method to CameraManager
  - [x] Enable camera following when entity provided
  - [x] Set entity as follow target
  - [x] Center camera on entity
  - [x] Handle null entity (disable following)
  - [x] Return boolean (true=enabled, false=disabled)
  - [x] **Deliverable**: CameraManager.followEntity() method ✅

- [x] **Integrate with game initialization**
  - [x] Call followEntity() in initializeWorld() after spawnQueen()
  - [x] Camera auto-tracks queen on game start
  - [x] Fallback if no queen present (no error)
  - [x] **Deliverable**: Auto-follow queen on game start ✅

- [ ] **E2E tests with screenshots** (Future Phase)

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

**Current Phase**: Phase 2 - Level Loader System (IN PROGRESS)

**Completed**:
- [x] Checklist created
- [x] Phase 1.1 - System Analysis & Refactoring ✅
  - [x] GridTerrain analysis (`docs/api/GridTerrain_Analysis.md`)
  - [x] SparseTerrain analysis (`docs/api/SparseTerrain_Analysis.md`)
  - [x] PathMap coupling analysis (`docs/api/PathMap_Coupling_Analysis.md`)
  - [x] Integration strategy chosen: **Option A - Separate Adapters**
- [x] Phase 1.2 - Terrain System Integration ✅
  - [x] GridTerrainAdapter: 19 unit tests + 18 integration tests (37 total) ✅
  - [x] SparseTerrainAdapter: 20 unit tests + 26 integration tests (46 total) ✅
  - [x] Test helper: `test/helpers/terrainIntegrationHelper.js` (reusable) ✅
  - [x] **Phase 1 Total: 83 tests passing** ✅
- [x] Phase 2.1 - LevelLoader Core ✅
  - [x] LevelLoader class with validation, terrain loading, entity spawning
  - [x] Grid → world coordinate conversion
  - [x] **27 unit tests passing** ✅
  - [x] **17 integration tests passing** ✅
  - [x] Fixtures: sample-level.json, large-level.json ✅
  - [x] PathMap compatibility verified via SparseTerrainAdapter ✅
  - [x] Performance targets met (1000+ entities <2s, 10k tiles <3s) ✅

- [x] Phase 2.2 - Level Validation ✅
  - [x] LevelValidator class with comprehensive validation rules
  - [x] **36 unit tests passing** ✅
  - [x] **13 integration tests passing** (LevelLoader + LevelValidator)
  - [x] Validates terrain structure, entity structure, coordinate bounds
  - [x] Custom validation options (maxEntities, maxTiles, allowedEntityTypes)
  - [x] Detailed error messages with indices
  - [x] Integrated with LevelLoader (automatic validation enabled by default)

- [x] Phase 3.1 - EntityFactory Core ✅
  - [x] EntityFactory class for creating game entities
  - [x] **34 unit tests passing** ✅
  - [x] Creates entities from type strings (Ant, Queen, Resource, Building)
  - [x] Grid→world coordinate conversion
  - [x] Property application from level data
  - [x] Automatic ID generation
  - [x] Custom entity class support
  - [x] EntityFactory integrated with LevelLoader

- [x] Phase 3.5 - Game State Integration ✅
  - [x] LevelLoader enhancements for game systems
  - [x] **17 integration tests passing** ✅
  - [x] Metadata property (id, name, description, author, version)
  - [x] Terrain API compatibility (getTile method)
  - [x] Entity format compatible with SpatialGrid
  - [x] Performance: <3s for 100+ entities, <5s for 1500 entities
  - [x] Camera tracking support (queen detection)
  - [x] Error handling in game context

- [x] Phase 4.1 - Queen Detection System ✅
  - [x] queenDetection utility for finding queen ant
  - [x] **17 unit tests passing** ✅
  - [x] findQueen(entities) function - O(n) linear search
  - [x] Case-sensitive type matching
  - [x] Handles invalid input (null, undefined, non-array)
  - [x] Performance: <50ms for 10k entities, <100ms worst case
  - [x] LevelLoader entity format integration

- [x] Phase 4.2 - Camera Following Integration ✅
  - [x] CameraManager.followEntity() method
  - [x] **16 unit tests passing** ✅
  - [x] Enable/disable following
  - [x] Entity replacement
  - [x] Null/undefined handling
  - [x] Edge cases (no coords, zero, negative)
  - [x] Return value (boolean)
  - [x] Zoom compatibility
  - [x] Integrated with initializeWorld() in sketch.js
  - [x] Camera auto-tracks queen on game start

**Blocked Items**: None

**Next Steps**:
1. ✅ **DONE**: Phase 1 - System Analysis & Integration (83 tests)
2. ✅ **DONE**: Phase 2.1 - LevelLoader Core (44 tests: 27 unit + 17 integration)
3. ✅ **DONE**: Phase 2.2 - Level Validation (49 tests: 36 unit + 13 integration)
4. ✅ **DONE**: Phase 3.1 - EntityFactory Core (34 unit tests)
5. ✅ **DONE**: Phase 3.5 - Game State Integration (17 integration tests)
6. ✅ **DONE**: Phase 4.1 - Queen Detection System (17 unit tests)
7. ✅ **DONE**: Phase 4.2 - Camera Following Integration (16 unit tests)
8. **NEXT**: Phase 5 - Game Over on Queen Death

**Test Count**: **177 tests passing**

**Test Breakdown**:
- LevelLoader: 27 unit tests
- LevelLoader Integration (Real JSON): 17 integration tests  
- LevelLoader + Validator: 13 integration tests
- LevelLoader + Game State: 17 integration tests
- LevelValidator: 36 unit tests
- EntityFactory: 34 unit tests
- Queen Detection: 17 unit tests
- CameraManager.followEntity: 16 unit tests (NEW)
- Total unique: 127 (some files overlap when run together)
