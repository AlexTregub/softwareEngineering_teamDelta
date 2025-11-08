# Ant MVC Requirements - Complete Functional Parity

**Goal**: Ensure AntModel, AntView, AntController can do EVERYTHING the current ant class does.

## Complete Method Inventory (from Classes/ants/ants.js)

### Constructor Requirements
- [x] Accept all current parameters: `posX, posY, sizex, sizey, movementSpeed, rotation, img, JobName, faction`
- [x] Initialize with proper Entity options (type, imagePath, movementSpeed, selectable, faction)
- [x] Generate unique `antIndex` identifier
- [x] Initialize all systems: StatsContainer, EntityInventoryManager, AntStateMachine, GatherState, AntBrain

### Core Properties (Must Store in AntModel)
- [ ] `_antIndex` - Unique ant identifier
- [ ] `_JobName` / `jobName` - Current job type
- [ ] `isBoxHovered` - Box selection hover state
- [ ] `brain` - AntBrain instance reference
- [ ] `pathType` - Path type for pathfinding
- [ ] `_idleTimer` / `_idleTimerTimeout` - Idle behavior timing
- [ ] `lastFrameTime` - Delta time tracking
- [ ] `job` - JobComponent instance
- [ ] `_stats` - StatsContainer instance
- [ ] `_resourceManager` - EntityInventoryManager instance
- [ ] `_stateMachine` - AntStateMachine instance
- [ ] `_gatherState` - GatherState instance
- [ ] `_faction` - Faction (may use Entity's)
- [ ] `_enemies` - Enemy tracking array
- [ ] `_lastEnemyCheck` / `_enemyCheckInterval` - Enemy detection timing
- [ ] `_health` / `_maxHealth` - Health (may use HealthController)
- [ ] `_damage` / `_attackRange` - Combat stats
- [ ] `_combatTarget` - Current attack target
- [ ] `_targetDropoff` - Target dropoff location

### Getters/Setters (Property Access)
- [ ] `antIndex` (getter) - Returns `_antIndex`
- [ ] `JobName` (getter/setter) - Job name access
- [ ] `StatsContainer` (getter) - Returns `_stats`
- [ ] `EntityInventoryManager` (getter) - Returns `_resourceManager`
- [ ] `stateMachine` (getter) - Returns `_stateMachine`
- [ ] `gatherState` (getter) - Returns `_gatherState`
- [ ] `faction` (getter) - Returns faction
- [ ] `health` (getter) - Returns current health
- [ ] `maxHealth` (getter) - Returns max health
- [ ] `damage` (getter) - Returns damage stat
- [ ] `posX` / `posY` (getter/setter) - Backwards compatibility
- [ ] `isMoving` (getter) - Movement state
- [ ] `isSelected` (getter/setter) - Selection state

### Controller Access (Legacy Compatibility)
- [ ] `_movementController` - MovementController access
- [ ] `_taskManager` - TaskManager access
- [ ] `_renderController` - RenderController access
- [ ] `_selectionController` - SelectionController access
- [ ] `_combatController` - CombatController access
- [ ] `_transformController` - TransformController access
- [ ] `_terrainController` - TerrainController access
- [ ] `_interactionController` - InteractionController access
- [ ] `_healthController` - HealthController access

### Job System Methods
- [ ] `assignJob(jobName, image)` - Assign job with stats
- [ ] `_applyJobStats(stats)` - Apply job stats to ant properties
- [ ] `_getFallbackJobStats(jobName)` - Fallback job stats
- [ ] `getJobStats()` - Get current job stats
- [ ] `getJobName()` - Get current job name

### Command/Task System
- [ ] `addCommand(command)` - Add task to queue

### State Machine Integration
- [ ] `_onStateChange(oldState, newState)` - State change callback
- [ ] `getCurrentState()` - Get current state
- [ ] `setState(state)` - Set state
- [ ] `getPreferredState()` - Get preferred state
- [ ] `setPreferredState(state)` - Set preferred state

### Dropoff System
- [ ] `_goToNearestDropoff()` - Find and move to nearest dropoff
- [ ] `_checkDropoffArrival()` - Check if at dropoff
- [ ] `_targetDropoff` - Store target dropoff

### Combat System Methods
- [ ] `takeDamage(amount)` - Take damage
- [ ] `heal(amount)` - Heal ant
- [ ] `attack(target)` - Attack target
- [ ] `die()` - Death handling
- [ ] `_removeFromGame()` - Cleanup from game arrays
- [ ] `_updateEnemyDetection()` - Detect enemies
- [ ] `_performCombatAttack()` - Execute attack
- [ ] `_attackTarget(target)` - Attack specific target
- [ ] `_calculateDistance(entity1, entity2)` - Distance calculation

### Resource System Methods
- [ ] `getResourceCount()` - Get current resource count
- [ ] `getMaxResources()` - Get max resource capacity
- [ ] `addResource(resource)` - Add resource to inventory
- [ ] `removeResource(amount)` - Remove resources
- [ ] `dropAllResources()` - Drop all carried resources
- [ ] `startGathering()` - Start gathering state
- [ ] `stopGathering()` - Stop gathering state
- [ ] `isGathering()` - Check if gathering

### Update Loop Methods
- [ ] `update()` - Main update (calls sub-updates)
- [ ] `_updateStats()` - Update StatsContainer
- [ ] `_updateStateMachine()` - Update state machine
- [ ] `_updateResourceManager()` - Update inventory
- [ ] `_updateHealthController()` - Update health

### Rendering Methods
- [ ] `render()` - Main render (calls sub-renders)
- [ ] `_renderResourceIndicator()` - Render resource count text

### Debug/Testing Methods
- [ ] `getDebugInfo()` - Complete debug info
- [ ] `getAntIndex()` - Selenium testing
- [ ] `getHealthData()` - Selenium testing
- [ ] `getResourceData()` - Selenium testing
- [ ] `getCombatData()` - Selenium testing
- [ ] `getAntValidationData()` - Complete validation data
- [ ] `static getAvailableJobs()` - Available job types

### Cleanup Methods
- [ ] `destroy()` - Full cleanup

---

## Test Coverage Requirements

### AntModel Tests (Data Storage)
**Must test ALL properties can be stored/retrieved**:
1. Constructor with all parameters
2. All getters/setters work correctly
3. Job system data (jobName, job component)
4. Brain/StateMachine/GatherState references
5. Stats container data
6. Resource manager data
7. Combat data (enemies, target, health, damage)
8. State machine data
9. Idle timers
10. Dropoff target
11. Delta time tracking
12. Event emission for all property changes

### AntView Tests (Rendering)
**Must test ALL rendering methods**:
1. Basic ant rendering (extends EntityView)
2. Resource indicator rendering
3. Health bar rendering
4. Job-specific sprite rendering
5. State-based visual indicators (gathering, combat, idle)
6. Box hover rendering
7. Selection highlight rendering
8. Coordinate conversion for all render positions
9. p5.js availability checks
10. Render layer separation

### AntController Tests (Business Logic)
**Must test ALL methods work correctly**:
1. **Job System**: assignJob, _applyJobStats, getJobStats, getJobName
2. **Resource Management**: getResourceCount, addResource, removeResource, dropAllResources, startGathering, stopGathering, isGathering
3. **Combat System**: takeDamage, heal, attack, die, _updateEnemyDetection, _performCombatAttack
4. **State Machine**: getCurrentState, setState, getPreferredState, setPreferredState, _onStateChange
5. **Dropoff System**: _goToNearestDropoff, _checkDropoffArrival
6. **Command/Task**: addCommand
7. **Update Loop**: update, _updateStats, _updateStateMachine, _updateResourceManager, _updateHealthController
8. **Rendering**: render, _renderResourceIndicator
9. **Debug**: getDebugInfo, getAntIndex, getHealthData, getResourceData, getCombatData, getAntValidationData
10. **Cleanup**: destroy, _removeFromGame
11. **Legacy Compatibility**: posX/posY accessors, controller getters
12. **Static Methods**: getAvailableJobs

---

## Integration Test Requirements

### Must Work With Existing Systems
- [ ] Works with global `ants[]` array
- [ ] Works with `antsSpawn()`, `antsUpdate()`, `antsRender()` functions
- [ ] Works with AntManager
- [ ] Works with JobComponent system
- [ ] Works with EntityInventoryManager
- [ ] Works with AntBrain
- [ ] Works with AntStateMachine
- [ ] Works with GatherState
- [ ] Works with StatsContainer
- [ ] Works with dropoff locations
- [ ] Works with spatial grid
- [ ] Works with selection system
- [ ] Works with combat system
- [ ] Works with task system

### Backward Compatibility
- [ ] All old ant class methods still callable
- [ ] All old property accessors still work
- [ ] Selenium tests still pass
- [ ] BDD tests still pass
- [ ] E2E tests still pass

---

## Success Criteria

✅ **Phase Complete When**:
1. All 3 MVC components implemented (AntModel, AntView, AntController)
2. All tests passing (unit + integration)
3. Every method from original ant class is tested
4. Every property from original ant class can be accessed
5. All existing game systems still work
6. Zero regressions in existing tests
7. Documentation updated with migration examples

**Total Estimated Tests**: 150-200 tests (50-70 per component)
