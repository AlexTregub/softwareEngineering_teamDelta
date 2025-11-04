# Phase 3.1: AntModel - Implementation Plan

## Current Ant Class Analysis

### Core Data (Must go in AntModel)

**Identity & Type**:
- `_antIndex` - Unique ant ID (auto-increment)
- `_JobName` / `jobName` - Job type (Scout, Farmer, Builder, Warrior, Spitter, Queen, DeLozier)
- `name` - Display name ("Anty" by default)
- `_faction` - Faction (player, enemy, neutral)
- `type` - Entity type ("Ant" or "Queen")

**Position & Movement** (from Entity):
- `position` (x, y) - from TransformController
- `size` (width, height) - from TransformController
- `rotation` - from TransformController
- `movementSpeed` - from MovementController
- `isMoving` - from MovementController

**Health System**:
- `_health` - Current health
- `_maxHealth` - Maximum health
- `_damage` - Attack damage
- `_attackRange` - Attack range (50 pixels)

**Combat System**:
- `_combatTarget` - Current target being attacked
- `_enemies[]` - List of detected enemies
- `_lastEnemyCheck` - Frame counter for enemy detection
- `_enemyCheckInterval` - Frames between enemy scans (30 frames)

**Resource System** (uses ResourceManager component):
- `_resourceManager` - ResourceManager instance (capacity: 2, maxLoad: 25)
- Resource carrying capacity
- Current load
- Carried resources

**State System** (uses AntStateMachine component):
- `_stateMachine` - AntStateMachine instance
- Primary state (IDLE, MOVING, GATHERING, DROPPING_OFF, etc.)
- Combat modifier (IN_COMBAT, ATTACKING, DEFENDING, etc.)
- Terrain modifier (IN_WATER, IN_MUD, etc.)

**Job System** (uses JobComponent):
- `job` - JobComponent instance
- Job stats (strength, health, gatherSpeed, movementSpeed)

**Behavior System**:
- `_gatherState` - GatherState instance (autonomous gathering)
- `pathType` - Pathfinding type
- `_idleTimer` - Idle timer counter
- `_idleTimerTimeout` - Idle timeout threshold
- `_targetDropoff` - Current dropoff target

**Stats System** (uses StatsContainer):
- `_stats` - StatsContainer instance
- Position, size, speed, home position

**Other Properties**:
- `isBoxHovered` - UI hover state
- `brain` - AntBrain instance (behavior tree?)
- `lastFrameTime` - Performance timing
- `isActive` - Active/inactive flag

---

## AntModel Structure

```javascript
class AntModel extends BaseModel {
  constructor(x, y, width, height, options = {}) {
    super();
    
    // Identity
    this._antIndex = options.antIndex || nextAntIndex++;
    this._jobName = options.jobName || 'Scout';
    this._name = options.name || 'Anty';
    this._faction = options.faction || 'neutral';
    this._type = options.type || (this._jobName === 'Queen' ? 'Queen' : 'Ant');
    
    // Position & Size
    this._position = { x, y };
    this._size = { width, height };
    this._rotation = options.rotation || 0;
    
    // Movement
    this._movementSpeed = options.movementSpeed || 60;
    this._isMoving = false;
    this._targetPosition = null;
    this._path = null;
    this._pathType = options.pathType || null;
    
    // Health
    this._health = options.health || 100;
    this._maxHealth = options.maxHealth || 100;
    this._damage = options.damage || 10;
    this._attackRange = options.attackRange || 50;
    
    // Combat
    this._combatTarget = null;
    this._enemies = [];
    this._lastEnemyCheck = 0;
    this._enemyCheckInterval = 30;
    
    // Components (composition over inheritance)
    this._jobComponent = new JobComponent(this._jobName, options.jobImage);
    this._stateMachine = new AntStateMachine();
    this._resourceManager = new ResourceManager(this, 2, 25);
    this._gatherState = new GatherState(this);
    this._statsContainer = new StatsContainer(
      createVector(x, y),
      { x: width, y: height },
      this._movementSpeed,
      createVector(x, y)
    );
    
    // Behavior
    this._targetDropoff = null;
    this._idleTimer = 0;
    this._idleTimerTimeout = 1;
    
    // Initialize job stats
    this._applyJobStats(this._jobComponent.stats);
    
    // State machine callback
    this._stateMachine.setStateChangeCallback((old, newState) => {
      this._onStateChange(old, newState);
    });
  }
  
  // Getters (read-only access)
  get antIndex() { return this._antIndex; }
  get jobName() { return this._jobName; }
  get name() { return this._name; }
  get faction() { return this._faction; }
  get type() { return this._type; }
  get position() { return this._position; }
  get size() { return this._size; }
  get rotation() { return this._rotation; }
  get health() { return this._health; }
  get maxHealth() { return this._maxHealth; }
  get damage() { return this._damage; }
  get isMoving() { return this._isMoving; }
  get stateMachine() { return this._stateMachine; }
  get resourceManager() { return this._resourceManager; }
  get gatherState() { return this._gatherState; }
  get jobComponent() { return this._jobComponent; }
  
  // Business Logic Methods
  takeDamage(amount) { /* ... */ }
  heal(amount) { /* ... */ }
  attack(target) { /* ... */ }
  die() { /* ... */ }
  assignJob(jobName, image) { /* ... */ }
  startGathering() { /* ... */ }
  stopGathering() { /* ... */ }
  addResource(resource) { /* ... */ }
  removeResource(amount) { /* ... */ }
  dropAllResources() { /* ... */ }
  moveTo(x, y) { /* ... */ }
  stopMovement() { /* ... */ }
  update(deltaTime) { /* ... */ }
  
  // State change notification (observable pattern)
  _onStateChange(oldState, newState) {
    if (newState.includes("DROPPING_OFF")) {
      this._notifyChange('dropoff-start', { oldState, newState });
    }
    // ... other state transitions
  }
  
  // Serialization
  toJSON() { /* ... */ }
}
```

---

## Phase 3.1 Tasks Checklist

### Week 1: Foundation (20-30 hours)

- [ ] **Task 1.1: Create AntModel Test Suite** (6-8 hours)
  - [ ] Create `test/unit/models/AntModel.test.js`
  - [ ] Write tests for constructor (identity, position, size, health)
  - [ ] Write tests for job system (assignJob, getJobStats)
  - [ ] Write tests for health system (takeDamage, heal, isDead)
  - [ ] Write tests for combat system (attack, target management)
  - [ ] Write tests for resource system (add, remove, drop, capacity)
  - [ ] Write tests for movement system (moveTo, stopMovement, isMoving)
  - [ ] Write tests for state machine integration
  - [ ] Write tests for lifecycle (update, die, destroy)
  - [ ] Write tests for serialization (toJSON, fromJSON)
  - **Target**: 70-80 tests (all failing initially - TDD red phase)
  - **Files**: `test/unit/models/AntModel.test.js`

- [ ] **Task 1.2: Create AntModel Class - Part 1 (Core)** (4-6 hours)
  - [ ] Create `Classes/models/AntModel.js`
  - [ ] Extend BaseModel
  - [ ] Implement constructor (all properties)
  - [ ] Implement getters (read-only access)
  - [ ] Implement identity methods (getName, setName, getAntIndex)
  - [ ] Run tests (expect some to pass)
  - **Files**: `Classes/models/AntModel.js`

- [ ] **Task 1.3: Implement Job System** (3-4 hours)
  - [ ] Implement `assignJob(jobName, image)`
  - [ ] Implement `_applyJobStats(stats)`
  - [ ] Implement `getJobStats()`
  - [ ] Integrate JobComponent
  - [ ] Run job tests (should pass)
  - **Files**: `Classes/models/AntModel.js`

- [ ] **Task 1.4: Implement Health System** (2-3 hours)
  - [ ] Implement `takeDamage(amount)`
  - [ ] Implement `heal(amount)`
  - [ ] Implement `isDead()` getter
  - [ ] Implement `die()` method
  - [ ] Add health change notifications
  - [ ] Run health tests (should pass)
  - **Files**: `Classes/models/AntModel.js`

- [ ] **Task 1.5: Implement Combat System** (2-3 hours)
  - [ ] Implement `attack(target)`
  - [ ] Implement `setCombatTarget(target)`
  - [ ] Implement `getCombatTarget()`
  - [ ] Implement enemy detection logic
  - [ ] Add combat notifications
  - [ ] Run combat tests (should pass)
  - **Files**: `Classes/models/AntModel.js`

- [ ] **Task 1.6: Implement Resource System** (2-3 hours)
  - [ ] Implement `addResource(resource)`
  - [ ] Implement `removeResource(amount)`
  - [ ] Implement `dropAllResources()`
  - [ ] Implement `getResourceCount()`
  - [ ] Implement `getMaxResources()`
  - [ ] Integrate ResourceManager component
  - [ ] Run resource tests (should pass)
  - **Files**: `Classes/models/AntModel.js`

- [ ] **Task 1.7: Implement Movement System** (2-3 hours)
  - [ ] Implement `moveTo(x, y)`
  - [ ] Implement `stopMovement()`
  - [ ] Implement `setPosition(x, y)`
  - [ ] Implement `setRotation(angle)`
  - [ ] Add movement notifications
  - [ ] Run movement tests (should pass)
  - **Files**: `Classes/models/AntModel.js`

- [ ] **Task 1.8: Integrate State Machine** (3-4 hours)
  - [ ] Integrate AntStateMachine component
  - [ ] Implement `getCurrentState()`
  - [ ] Implement `setState(primary, combat, terrain)`
  - [ ] Implement `_onStateChange(oldState, newState)`
  - [ ] Implement dropoff navigation logic
  - [ ] Run state machine tests (should pass)
  - **Files**: `Classes/models/AntModel.js`

- [ ] **Task 1.9: Integrate GatherState** (2-3 hours)
  - [ ] Integrate GatherState component
  - [ ] Implement `startGathering()`
  - [ ] Implement `stopGathering()`
  - [ ] Implement `isGathering()`
  - [ ] Run gathering tests (should pass)
  - **Files**: `Classes/models/AntModel.js`

- [ ] **Task 1.10: Implement Lifecycle** (2-3 hours)
  - [ ] Implement `update(deltaTime)`
  - [ ] Implement update sub-methods (_updateStats, _updateStateMachine, etc.)
  - [ ] Implement `destroy()`
  - [ ] Run lifecycle tests (should pass)
  - **Files**: `Classes/models/AntModel.js`

- [ ] **Task 1.11: Implement Serialization** (2-3 hours)
  - [ ] Implement `toJSON()`
  - [ ] Implement static `fromJSON(data)`
  - [ ] Include all necessary data (position, health, job, state, resources)
  - [ ] Run serialization tests (should pass)
  - **Files**: `Classes/models/AntModel.js`

- [ ] **Task 1.12: Final Testing & Debugging** (2-3 hours)
  - [ ] Run full test suite
  - [ ] Fix any failing tests
  - [ ] Add edge case tests if needed
  - [ ] Verify all 70-80 tests passing
  - [ ] Code review and refactor
  - **Files**: `test/unit/models/AntModel.test.js`, `Classes/models/AntModel.js`

---

## Test Categories

### Constructor Tests (10 tests)
- Should extend BaseModel
- Should set identity properties (antIndex, jobName, name, faction)
- Should set position and size
- Should initialize health system
- Should initialize components (JobComponent, AntStateMachine, ResourceManager, GatherState)
- Should apply job stats on creation
- Should set default values correctly

### Job System Tests (8 tests)
- Should assign new job
- Should apply job stats correctly
- Should update image on job change
- Should return job stats
- Should handle all job types (Scout, Farmer, Builder, Warrior, Spitter, Queen, DeLozier)
- Should notify on job change

### Health System Tests (12 tests)
- Should have health property
- Should have maxHealth property
- Should take damage
- Should reduce health on damage
- Should not go below 0 health
- Should heal
- Should not exceed maxHealth
- Should notify on health change
- Should have isDead property
- Should return true when health = 0
- Should call die() when health reaches 0
- Should notify on death

### Combat System Tests (10 tests)
- Should have damage property
- Should have attackRange property
- Should attack target
- Should set combat target
- Should clear combat target on death
- Should detect enemies
- Should update enemy list
- Should notify on combat start
- Should notify on combat end
- Should calculate distance correctly

### Resource System Tests (12 tests)
- Should add resource
- Should track resource count
- Should respect max capacity
- Should remove resource
- Should drop all resources
- Should notify on resource add
- Should notify on resource remove
- Should integrate with ResourceManager
- Should handle full inventory
- Should handle empty inventory

### Movement System Tests (10 tests)
- Should set target position
- Should set isMoving flag
- Should stop movement
- Should clear target on stop
- Should update position
- Should set rotation
- Should notify on position change
- Should notify on movement start
- Should notify on movement stop

### State Machine Tests (10 tests)
- Should integrate AntStateMachine
- Should get current state
- Should set primary state
- Should set combat modifier
- Should set terrain modifier
- Should handle state transitions
- Should notify on state change
- Should trigger dropoff logic
- Should handle GATHERING state
- Should handle DROPPING_OFF state

### Lifecycle Tests (8 tests)
- Should have update method
- Should update components
- Should update state machine
- Should update resource manager
- Should update gather state
- Should handle die()
- Should handle destroy()
- Should mark inactive on death

### Serialization Tests (5 tests)
- Should have toJSON method
- Should serialize all properties
- Should include position, health, job, state
- Should have fromJSON static method
- Should reconstruct from JSON

---

## Expected Test Output

```
AntModel
  Constructor
    ✔ should extend BaseModel
    ✔ should set antIndex property
    ✔ should set jobName property
    ✔ should set name property
    ✔ should set faction property
    ✔ should set position and size
    ✔ should initialize health system
    ✔ should initialize JobComponent
    ✔ should initialize AntStateMachine
    ✔ should initialize ResourceManager
  Job System
    ✔ should assign new job
    ✔ should apply job stats
    ✔ should return job stats
    ... (80 total tests)
```

---

## Integration Points

### Components to Integrate:
1. ✅ **JobComponent** (`Classes/ants/JobComponent.js`) - Job stats and configuration
2. ✅ **AntStateMachine** (`Classes/ants/antStateMachine.js`) - State management
3. ✅ **ResourceManager** (existing) - Resource carrying
4. ✅ **GatherState** (`Classes/ants/GatherState.js`) - Gathering behavior
5. ✅ **StatsContainer** (`Classes/containers/StatsContainer.js`) - Stats management

### What NOT to Include in AntModel:
- ❌ Rendering logic (goes in AntView)
- ❌ Input handling (goes in AntController)
- ❌ Sprite management (goes in AntView)
- ❌ Pathfinding algorithms (delegate to pathfinding system)
- ❌ Controller delegation (goes in AntController)

---

## Success Criteria

### Phase 3.1 Complete When:
- [ ] ✅ AntModel class created (~500 lines)
- [ ] ✅ 70-80 unit tests passing
- [ ] ✅ All components integrated (JobComponent, AntStateMachine, ResourceManager, GatherState)
- [ ] ✅ Observable pattern working (health, position, state changes notify)
- [ ] ✅ Serialization working (toJSON/fromJSON)
- [ ] ✅ No dependencies on Entity or controllers
- [ ] ✅ Code reviewed and refactored
- [ ] ✅ Ready for Phase 3.2 (AntView)

---

## Next Phase Preview

**Phase 3.2: AntView** will:
- Create AntView class
- Render ant sprites (job-specific)
- Render health bars
- Render selection highlights
- Render resource indicators
- React to AntModel changes (observable pattern)

---

**Ready to Start**: Task 1.1 (Create AntModel Test Suite)
**Estimated Time**: 6-8 hours for comprehensive test suite
**Next Action**: Create `test/unit/models/AntModel.test.js` with failing tests
