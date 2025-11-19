# Ant System - Complete Capabilities Documentation

**Purpose**: Comprehensive documentation of ALL ant functionality before MVC conversion
**Files Analyzed**: ants.js (1100+ lines), AntManager.js, antStateMachine.js, GatherState.js, antBrain.js, JobComponent.js

---

## 1. Core Ant Properties

### Identity & Type
- `_antIndex` - Unique ant identifier in global ants array
- `_JobName` - Job type string ("Builder", "Scout", "Farmer", "Warrior", "Spitter", "DeLozier", "Queen", "Spider")
- `type` - Entity type ("Ant" or "Queen")
- `jobName` - Display name for job
- `JobImages` - Static mapping of job names to image paths
- `faction` - Faction identifier (friendly/enemy)
- `_enemies` - Array of enemy faction identifiers

### Timers & Performance
- `_idleTimer` - Tracks idle duration
- `_idleTimerTimeout` - Idle threshold before state change
- `lastFrameTime` - Frame timing for updates
- `_accumulator` - Brain timer accumulator

### UI State
- `isBoxHovered` - Mouse hover detection

---

## 2. State Machine System (AntStateMachine)

### Primary States (9 total)
- `IDLE` - Default state, no activity
- `MOVING` - Actively moving to location
- `GATHERING` - Collecting resources (GatherState active)
- `FOLLOWING` - Following another entity
- `BUILDING` - Construction activity
- `SOCIALIZING` - Interaction with other ants
- `MATING` - Reproduction behavior
- `PATROL` - Patrol route
- `DROPPING_OFF` - Delivering resources to dropoff

### Combat Modifiers (5 total)
- `OUT_OF_COMBAT` - Default peaceful state
- `IN_COMBAT` - Engaged with enemy
- `ATTACKING` - Actively attacking
- `DEFENDING` - Defensive stance
- `SPITTING` - Ranged attack (Spitter job)

### Terrain Modifiers (5 total)
- `DEFAULT` - Normal terrain
- `IN_WATER` - Water terrain (slow)
- `IN_MUD` - Mud terrain (slow)
- `ON_SLIPPERY` - Slippery terrain (no movement)
- `ON_ROUGH` - Rough terrain (slow)

### State Machine Methods
- `setPrimaryState(state)` - Change primary activity
- `setCombatModifier(modifier)` - Change combat state
- `setTerrainModifier(modifier)` - Change terrain state
- `setState(primary, combat, terrain)` - Set all at once
- `getFullState()` - Get combined state string (e.g., "GATHERING_OUT_OF_COMBAT_DEFAULT")
- `getCurrentState()` - Get primary state only
- `canPerformAction(action)` - Check if action allowed in current state
- `isValidPrimary/Combat/Terrain(state)` - Validation checks
- `isPrimaryState(state)` - Check specific primary state
- `isDroppingOff()`, `isInCombat()`, `isOutOfCombat()`, `isOnTerrain()`
- `isIdle()`, `isMoving()`, `isGathering()`, etc. - State query helpers
- `clearModifiers()` - Reset to primary state only
- `reset()` - Full state reset to IDLE
- `setPreferredState(state)` - Set state to resume after IDLE
- `ResumePreferredState()` - Return to preferred state after IDLE
- `beginIdle()` - Force idle state
- `setStateChangeCallback(callback)` - Register state change listener
- `_notifyStateChange(old, new)` - Internal callback trigger
- `printState()` - Debug output
- `getStateSummary()` - Full debug object
- `update()` - Game loop (currently no-op)

---

## 3. Gather State System (GatherState)

### Core Functionality
- **Radius**: 7 grid tiles (224 pixels with 32px tiles)
- **Autonomous Resource Detection**: Scans for resources within radius
- **Prioritized Selection**: Closest resource first
- **Automatic Pathfinding**: Moves to resource, collects, repeats
- **Capacity Management**: Transitions to DROPPING_OFF when full
- **Timeout Mechanism**: 6 second timeout if no resources found

### Properties
- `ant` - Reference to ant entity
- `gatherRadius` - Grid tiles (7)
- `pixelRadius` - Pixel conversion (224)
- `targetResource` - Current collection target
- `searchCooldown` - Frames between scans
- `searchInterval` - Scan frequency (30 frames = 0.5 sec at 60fps)
- `isActive` - Whether gather state is active
- `gatherTimeout` - Timeout duration (6000ms)
- `gatherStartTime` - Time when gathering started
- `lastResourceFoundTime` - Last successful resource detection
- `keepGathering` - Continue until max capacity
- `resourcesCollected` - Resources collected this session
- `debugEnabled` - Debug logging flag
- `lastScanResults` - Last scan result count

### Methods
- `enter()` - Activate gather state, set ant to GATHERING
- `exit()` - Deactivate gather state
- `update()` - Main loop (capacity check, search, movement)
- `searchForResources()` - Scan 7-tile radius, sort by distance
- `getResourcesInRadius(x, y, radius)` - Query g_resourceManager
- `updateTargetMovement()` - Move toward target resource
- `attemptResourceCollection()` - Collect resource via _resourceManager
- `removeResourceFromSystem(resource)` - Remove from g_resourceManager
- `moveToResource(x, y)` - Delegate to _movementController
- `isAtMaxCapacity()` - Check _resourceManager.isAtMaxLoad()
- `transitionToDropOff()` - Set DROPPING_OFF state, find dropoff location
- `getAntPosition()` - Get ant position via getPosition()
- `getDistance(x1, y1, x2, y2)` - Euclidean distance
- `getDebugInfo()` - Debug object (active, radius, target, cooldown, capacity)
- `setDebugEnabled(enabled)` - Toggle debug logging

---

## 4. Brain & AI System (AntBrain)

### Hunger System
- **Hunger Thresholds**:
  - `HUNGRY = 100` - Increase forage priority
  - `STARVING = 160` - Prioritize forage only
  - `DEATH = 200` - Die (Queens survive)
- **Increment**: Configurable hunger rate (default 1/sec)
- **Flags**: `"hungry"`, `"starving"`, `"death"`, `"reset"`

### Trail Following (Pheromone System)
- **Trail Types**: Build, Forage, Farm, Enemy, Boss
- **Priority Values** (0-1): Job-specific weights for each trail type
- **Penalty System**: Penalize ignored trails to reduce re-checking
- **Decision Algorithm**: `random() < (strength/initial) * priority * penalty`

### Properties
- `ant` - Reference to ant entity
- `antType` - Job type string
- `flag_` - Current hunger flag
- `hunger` - Hunger counter (0-200)
- `followBuildTrail` - Build trail priority (0-1)
- `followForageTrail` - Forage trail priority (0-1)
- `followFarmTrail` - Farm trail priority (0-1)
- `followEnemyTrail` - Enemy trail priority (0-1)
- `followBossTrail` - Boss trail priority (default 100)
- `penalizedTrails` - Array of `{name, penalty}` objects
- `_accumulator` - Timer accumulator for hunger updates

### Methods
- `setPriority(antType, mult)` - Set trail priorities by job type
- `decideState()` - Determine state based on variables (future)
- `checkTrail(pheromone)` - Test if ant follows trail (probabilistic)
- `addPenalty(pheromoneName, penaltyValue)` - Reduce trail priority
- `getPenalty(pheromoneName)` - Get penalty value (default 1)
- `getTrailPriority(trailType)` - Get priority for trail type
- `modifyPriorityTrails()` - Adjust priorities based on hunger flag
- `checkHunger()` - Increment hunger, check thresholds, set flags
- `resetHunger()` - Reset hunger to 0, clear flags
- `runFlagState()` - Execute behavior for current flag
- `update(deltaTime)` - Update brain timer, check hunger
- `changeIncrement(newIncrement)` - Adjust hunger rate
- `internalTimer(deltaTime)` - Accumulator-based timer

### Job-Specific Trail Priorities
**Builder**: Build 90%, Forage 5%, Enemy 5%, Boss 100%
**Scout**: All 25%, Boss 100%
**Farmer**: Farm 85%, Forage 10%, Enemy 5%, Boss 100%
**Warrior**: Enemy 100%, Forage 20%, Boss 100%
**Spitter**: Enemy 100%, Forage 20%, Boss 100%
**DeLozier**: Boss 100% only
**Default**: Forage 75%, Enemy 25%, Boss 100%

---

## 5. Job & Stats System (JobComponent)

### Job Types & Stats
Each job has 4 stats: `strength`, `health`, `gatherSpeed`, `movementSpeed`

**Builder**:
- Strength: 20, Health: 120, GatherSpeed: 15, MovementSpeed: 55
- Role: Construction and carrying

**Scout**:
- Strength: 10, Health: 70, GatherSpeed: 8, MovementSpeed: 85
- Role: Fast exploration, fragile

**Farmer**:
- Strength: 15, Health: 100, GatherSpeed: 35, MovementSpeed: 50
- Role: Resource gathering efficiency

**Warrior**:
- Strength: 45, Health: 300, GatherSpeed: 5, MovementSpeed: 45
- Role: Heavy combat, high durability

**Spitter**:
- Strength: 35, Health: 110, GatherSpeed: 5, MovementSpeed: 55
- Role: Ranged attacker, moderate health

**DeLozier** (Special):
- Strength: 45, Health: 160, GatherSpeed: 5, MovementSpeed: 45
- Role: Special unit

**Queen**:
- Strength: 25, Health: 500, GatherSpeed: 1, MovementSpeed: 45
- Role: Central unit, extremely durable, immobile

**Spider** (Enemy):
- Strength: 80, Health: 1000, GatherSpeed: 3, MovementSpeed: 40
- Role: Boss enemy

**Default** (fallback):
- Strength: 15, Health: 100, GatherSpeed: 10, MovementSpeed: 60

### JobComponent Methods
- `constructor(name, image)` - Create job component with stats
- `static getJobStats(jobName)` - Get stats object for job
- `static getJobList()` - Get standard jobs (Builder, Scout, Farmer, Warrior, Spitter)
- `static getSpecialJobs()` - Get special jobs (DeLozier)
- `static getAllJobs()` - Get all jobs

### Ant Job Methods (ants.js)
- `assignJob(jobName)` - Create JobComponent, apply stats, create AntBrain
- `_applyJobStats()` - Update _stats, health, damage, speed, detection radius
- `_getFallbackJobStats()` - Get default stats for job type

---

## 6. Combat System

### Combat Properties
- `_health` - Current health
- `_maxHealth` - Maximum health (from job stats)
- `_damage` - Attack damage (from job stats)
- `_attackRange` - Attack range (pixels)
- `_combatTarget` - Current attack target
- `_attackCooldown` - Frames between attacks
- `_lastEnemyCheck` - Timestamp of last enemy scan
- `_enemies` - Array of enemy faction identifiers
- `_faction` - Ant's faction identifier

### Combat Methods
- `takeDamage(amount, source)` - Apply damage, trigger death if health <= 0
- `heal(amount)` - Restore health (capped at _maxHealth)
- `attack(target)` - Set combat target, transition to IN_COMBAT
- `die()` - Death cleanup (remove from game, visual effects)
- `_performCombatAttack()` - Execute attack if target in range and cooldown ready
- `_attackTarget(target)` - Deal damage to target, apply effects
- `_calculateAction()` - Determine combat behavior (approach, attack, retreat)
- `_checkForEnemies()` - Scan for enemies within detection radius, set combat target
- `nearestEntity()` - Find closest entity of any type
- `nearestFriendlyBuilding()` - Find closest building in same faction

### Combat Logic Flow
1. `_checkForEnemies()` scans detection radius every frame
2. If enemy found → `attack(target)` → set `_combatTarget`, state to IN_COMBAT
3. `_calculateAction()` determines approach/attack/retreat
4. `_performCombatAttack()` executes damage if in range and cooldown ready
5. `takeDamage()` applies damage, triggers `die()` if health <= 0
6. `die()` calls `_removeFromGame()` (cleanup)

---

## 7. Resource System

### Resource Properties
- `_resourceManager` - ResourceManager component instance
- `capacity` - Max resources ant can carry (from job stats)
- Dropoff target - Target location for resource delivery

### Resource Methods
- `getResourceCount()` - Get current resource count via _resourceManager
- `addResource(resource)` - Add resource to inventory via _resourceManager
- `dropAllResources()` - Remove all resources from inventory
- `getMaxResources()` - Get max capacity
- `_goToNearestDropoff()` - Find and move to closest dropoff location
- `_checkDropoffArrival()` - Check if ant reached dropoff, unload resources
- `_onStateChange(oldState, newState)` - Handle state transitions (DROPPING_OFF logic)

### Resource Flow
1. GatherState searches for resources (7-tile radius)
2. Ant moves to resource, collects via `addResource()`
3. When `_resourceManager.isAtMaxLoad()` → transition to DROPPING_OFF
4. `_goToNearestDropoff()` finds closest dropoff
5. `_checkDropoffArrival()` detects arrival, calls `dropAllResources()`
6. Return to GATHERING or IDLE

---

## 8. Movement & Pathfinding

### Movement Integration
- `_movementController` - MovementController component (from Entity base)
- `pathType` - Pathfinding type identifier
- Terrain-aware movement via MapManager integration

### Movement Methods
- `moveToLocation(x, y)` - Delegate to _movementController (A* pathfinding)
- `nearestEntity()` - Find closest entity (uses spatial grid)
- `nearestFriendlyBuilding()` - Find closest friendly building (spatial grid)

### Pathfinding Features
- A* algorithm with terrain cost integration
- Avoids water, stone (impassable), prefers grass/dirt
- Automatic path recalculation on obstacle detection
- Speed modulation based on terrain type

---

## 9. Update & Lifecycle

### Update Loop (update() method)
Called every frame, orchestrates all systems in order:

1. **Brain Update**: `this.brain.update(deltaTime)` - Hunger, trail decisions
2. **Stats Update**: `this._stats.update(deltaTime)` - Stat modifications
3. **State Machine Update**: `this._stateMachine.update()` - State transitions
4. **Resource Manager Update**: `this._resourceManager.update()` - Resource logic
5. **Enemy Detection**: `this._checkForEnemies()` - Scan for enemies
6. **Health Update**: Health decay, regeneration (if implemented)
7. **Controller Updates**: Base Entity updates (movement, collision, etc.)

### Render Loop (render() method)
Called every frame for visual presentation:

1. **Super Render**: `super.render()` - Entity base rendering (sprite, collision box)
2. **Health Bar**: Draw health indicator above ant
3. **Resource Indicator**: Show resource count if carrying resources
4. **Box Hover**: Highlight if mouse hovering

### Lifecycle Events

#### Spawn (antsSpawn function)
```javascript
antsSpawn(spawnX, spawnY, numberOfAnts, faction)
```
1. Create ant instances
2. Assign random jobs via `assignJob()`
3. Add to global `ants` array
4. Register with spatial grid
5. Register with TileInteractionManager
6. Add to selection system

#### Death (die() method)
```javascript
die()
```
1. Set health to 0
2. Trigger visual effects (blood splatter)
3. Call `_removeFromGame()`
4. Remove from `ants` array
5. Remove from spatial grid
6. Remove from selection system
7. Remove from UI (AntControlPanel)
8. Dispose controllers and components

---

## 10. AntManager System

### Purpose
Centralized management of ant selection, movement, and interaction logic

### Properties
- `selectedAnt` - Currently selected ant (null if none)

### Methods
- `handleAntClick()` - Handle click interactions (move or select)
- `moveSelectedAnt(resetSelection)` - Move selected ant to mouse position
- `selectAnt(antCurrent)` - Select ant if under mouse
- `getAntObject(antIndex)` - Get ant from global ants array by index
- `getSelectedAnt()` - Get currently selected ant
- `setSelectedAnt(ant)` - Set selected ant
- `clearSelection()` - Deselect and clear selectedAnt
- `hasSelection()` - Check if ant selected
- `getDebugInfo()` - Get debug information object

### Selection Logic
1. Click with no selection → `selectAnt()` checks if mouse over ant
2. Click with selection → `moveSelectedAnt()` moves ant to mouse position
3. Optional deselection after move via `resetSelection` parameter

### Legacy Compatibility
- `AntClickControl()` → `handleAntClick()`
- `MoveAnt()` → `moveSelectedAnt()`
- `SelectAnt()` → `selectAnt()`
- `getAntObj()` → `getAntObject()`

---

## 11. System Integration Points

### Entity Base Class
**Ants extend Entity**, inheriting:
- CollisionBox2D
- MovementController
- RenderController
- SelectionController
- TerrainController
- HealthController (optional)
- InventoryController (optional)
- CombatController (optional)

### Global Systems
**Ants integrate with**:
- `g_map2` (MapManager) - Terrain queries, tile data
- `spatialGridManager` (SpatialGridManager) - Spatial queries (O(1) nearest entity)
- `g_resourceManager` (ResourceManager) - Global resource access
- `RenderManager` (RenderLayerManager) - Rendering in ENTITIES layer
- `draggablePanelManager` - AntControlPanel UI
- `EventManager` - Random events, triggers
- `TileInteractionManager` - Tile-based interactions

### Performance Tracking
- Frame timing via `lastFrameTime`
- Performance overlay integration
- Debug inspector integration

---

## 12. MVC Conversion Analysis

### What Goes Where?

#### AntModel (Pure Data)
**MUST BE DATA ONLY**:
- Identity: _antIndex, _JobName, type, jobName, faction
- Position, size, rotation (from Entity base)
- Stats: _stats reference (StatsContainer data)
- Health: _health, _maxHealth
- Combat: _damage, _attackRange, _combatTarget
- Resources: capacity, resource count
- State: primary state, combat modifier, terrain modifier
- Job: job reference, job stats
- Timers: _idleTimer, _idleTimerTimeout
- Flags: isBoxHovered
- Image paths: sprite image, job image
- Component references: brain, stateMachine, gatherState, resourceManager

**MUST NOT**:
- ❌ NO update logic
- ❌ NO rendering logic
- ❌ NO system calls (MapManager, SpatialGridManager)

#### AntView (Presentation Only)
**MUST RENDER ONLY**:
- Ant sprite rendering (job-specific images)
- Health bar rendering
- Resource indicator rendering
- Box hover highlight
- Selection highlight
- Combat effects (damage numbers, blood)
- State-based visual effects
- Debug overlays (if enabled)

**MUST NOT**:
- ❌ NO state mutations
- ❌ NO update methods
- ❌ NO system queries

#### AntController (Orchestration)
**MUST ORCHESTRATE**:
- Brain updates (hunger, trail decisions)
- State machine transitions
- GatherState activation/deactivation
- Combat logic (_checkForEnemies, _performCombatAttack, _calculateAction)
- Resource management (dropoff detection, collection)
- Movement coordination (pathfinding, terrain)
- Health changes (damage, healing, death)
- Lifecycle events (spawn, die, cleanup)
- System integration (MapManager, SpatialGridManager, EffectsRenderer)
- Sub-controller coordination (movement, combat, health, inventory, selection)
- Update loop orchestration
- State change callbacks

**MUST NOT**:
- ❌ NO direct data storage (use model)
- ❌ NO rendering (use view)

---

## 13. Dependencies & References

### Internal Components (Ant-specific)
- AntStateMachine (9 primary, 5 combat, 5 terrain states)
- GatherState (7-tile autonomous gathering)
- AntBrain (hunger, trail following, pheromone decisions)
- JobComponent (8 job types with stats)
- ResourceManager (capacity, inventory, dropoff)

### Entity Base Controllers (Inherited)
- MovementController (pathfinding, terrain-aware movement)
- RenderController (base sprite rendering)
- SelectionController (selection state, highlights)
- TerrainController (terrain queries, speed modulation)
- HealthController (optional, health bar rendering)
- InventoryController (optional, inventory UI)
- CombatController (optional, combat logic)

### Global Managers
- MapManager (g_map2) - Terrain data, tile queries
- SpatialGridManager - O(1) spatial queries
- ResourceManager (g_resourceManager) - Global resource list
- AntManager - Selection and click handling
- RenderLayerManager - Rendering pipeline
- EventManager - Random events, triggers
- EffectsRenderer - Visual effects (damage numbers, blood, sparks)

### External Dependencies
- p5.js - Drawing, input, game loop
- StatsContainer - Stat storage and modification
- CollisionBox2D - Collision detection

---

## 14. Known Issues & Technical Debt

### Current Architecture Issues
1. **Fragmented Codebase**: Ant logic spread across ants.js (1100+ lines) + 5 component files
2. **Tight Coupling**: Direct access to global managers (g_map2, spatialGridManager, g_resourceManager)
3. **Entity Inheritance**: Extends Entity base class, inherits ALL controllers (even unused)
4. **No Separation of Concerns**: Data, logic, rendering all mixed in ants.js
5. **Difficult Testing**: Cannot test data independently from logic or rendering
6. **Hard to Extend**: Adding new ant features requires modifying giant ants.js file

### MVC Benefits
1. **Testability**: Model, View, Controller tested independently (100% coverage achievable)
2. **Maintainability**: Clear separation prevents tangled dependencies
3. **Reusability**: AntModel, AntView can be composed differently
4. **Debugging**: Isolate issues to specific layer (data vs display vs logic)
5. **Scalability**: Add ant features without breaking existing code
6. **Clean Architecture**: Follow established MVC pattern from EntityModel/View/Controller

---

## 15. Next Steps: MVC Conversion Plan

### Phase 1: AntModel (Data Layer)
- [ ] Write unit tests FIRST (TDD)
- [ ] Create AntModel class (pure data storage)
- [ ] Properties: identity, health, combat, resources, stats, state, job
- [ ] Getters/setters only (no logic)
- [ ] Component references: brain, stateMachine, gatherState, resourceManager
- [ ] Verify NO update/render methods
- [ ] 50+ unit tests expected

### Phase 2: AntView (Presentation Layer)
- [ ] Write unit tests FIRST
- [ ] Create AntView class (rendering only)
- [ ] Render methods: sprite, health bar, resource indicator, highlights
- [ ] Read from AntModel (NEVER modify)
- [ ] Job-specific sprite handling
- [ ] Visual effects integration
- [ ] Verify NO state mutations
- [ ] 40+ unit tests expected

### Phase 3: AntController (Orchestration Layer)
- [ ] Write unit tests FIRST
- [ ] Create AntController class (orchestration)
- [ ] Sub-controllers: brain, state machine, gather state, combat, resource, movement
- [ ] System integration: MapManager, SpatialGridManager, EffectsRenderer
- [ ] Update loop orchestration
- [ ] Lifecycle management (spawn, die, cleanup)
- [ ] Verify NO rendering, NO direct data storage
- [ ] 80+ unit tests expected

### Phase 4: AntFactory (Creation)
- [ ] Create AntFactory.createAnt(jobName, faction, position)
- [ ] Initialize AntModel with job stats
- [ ] Initialize AntView with job sprite
- [ ] Initialize AntController with sub-controllers
- [ ] Wire up brain/state machine/gather state
- [ ] Register with systems (spatial grid, selection, TileInteractionManager)
- [ ] Batch operations (createMultiple, createSwarm)

### Phase 5: Integration & Migration
- [ ] Write integration tests (MVC triad working together)
- [ ] Write E2E tests (browser with screenshots)
- [ ] Migrate existing ant spawning to AntFactory
- [ ] Update antsSpawn() to use AntFactory
- [ ] Update antsUpdate() to call controller.update()
- [ ] Update antsRender() to call view.render()
- [ ] Update AntManager to work with MVC ants
- [ ] Update AntControlPanel UI to read from AntModel
- [ ] Full test suite (all tests passing)

### Phase 6: Documentation & Cleanup
- [ ] Update API reference (docs/api/Ant_API_Reference.md)
- [ ] Update architecture docs with MVC ant pattern
- [ ] Add usage examples
- [ ] Mark ants.js as DEPRECATED
- [ ] Update CHANGELOG.md
- [ ] Update copilot-instructions.md with ant MVC example

---

## 16. Test Coverage Goals

### Unit Tests
- **AntModel**: 50+ tests (identity, health, stats, job, state, getters/setters)
- **AntView**: 40+ tests (rendering, sprites, highlights, visual effects)
- **AntController**: 80+ tests (brain, state machine, combat, resources, movement, lifecycle)
- **Total**: 170+ unit tests

### Integration Tests
- MVC triad working together (30+ tests)
- System integration (spatial grid, MapManager, EffectsRenderer) (20+ tests)
- Ant lifecycle (spawn, update, render, die) (15+ tests)
- **Total**: 65+ integration tests

### E2E Tests
- Ant spawning with job types (8 tests, screenshots)
- Ant gathering behavior (visual proof of resource collection)
- Ant combat (visual proof of enemy detection, attack, death)
- Ant state transitions (visual proof of IDLE → GATHERING → DROPPING_OFF)
- Ant selection and movement (AntManager integration)
- **Total**: 20+ E2E tests with screenshots

### BDD Tests (Behave)
- User-facing ant behaviors (job system, gathering, combat)
- Plain language scenarios (no technical jargon)
- **Total**: 10+ BDD scenarios

---

## Summary Statistics

**Total Files Analyzed**: 6 (ants.js, AntManager.js, antStateMachine.js, GatherState.js, antBrain.js, JobComponent.js)
**Total Lines of Code**: ~2000+
**Total Properties**: 60+
**Total Methods**: 120+
**State Combinations**: 9 primary × 5 combat × 5 terrain = 225 possible states
**Job Types**: 8 (5 standard, 3 special)
**Combat Systems**: Faction, enemy detection, attack, damage, death
**Resource Systems**: Inventory, capacity, gathering, dropoff
**Movement Systems**: A* pathfinding, terrain-aware, speed modulation
**AI Systems**: Hunger, trail following, pheromone decisions
**Integration Points**: 8+ global systems (MapManager, SpatialGridManager, ResourceManager, RenderManager, EventManager, TileInteractionManager, EffectsRenderer, AntManager)

**MVC Conversion Estimate**: 40-60 hours (TDD approach, maintain 100% coverage, system integration, migration, documentation)
