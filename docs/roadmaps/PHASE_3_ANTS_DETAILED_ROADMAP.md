# Phase 3: Ants MVC Refactoring - Detailed Roadmap

## Overview

**Goal**: Refactor Ant system from Entity-based inheritance to clean MVC pattern while preserving all functionality.

**Challenge**: Most complex entity type with multiple integrated systems:
- State machine (AntStateMachine)
- Job system (JobComponent)
- Behavior states (GatherState, etc.)
- Resource management
- Combat system
- Movement and pathfinding

**Estimated Time**: 80-120 hours (10-15 days)

**Date Started**: November 4, 2025

---

## Current Ant System Analysis

### Current Architecture

```
ant (class) extends Entity
  ├─ Entity Controllers (inherited):
  │   ├─ TransformController (position, rotation, scale)
  │   ├─ MovementController (pathfinding, speed)
  │   ├─ RenderController (sprite rendering)
  │   ├─ SelectionController (selection, highlighting)
  │   ├─ CombatController (attack, defend)
  │   ├─ HealthController (health, damage)
  │   ├─ InventoryController (resource carrying)
  │   └─ TaskManager (priority queue)
  │
  ├─ Ant-Specific Components:
  │   ├─ JobComponent (job stats, job name)
  │   ├─ AntStateMachine (primary state, combat modifier, terrain modifier)
  │   ├─ GatherState (autonomous gathering behavior)
  │   ├─ StatsContainer (stats management)
  │   └─ ResourceManager (carrying resources)
  │
  └─ Ant-Specific Properties:
      ├─ _JobName (job type)
      ├─ _antIndex (unique ID)
      ├─ name (display name)
      ├─ _faction (player/enemy/neutral)
      ├─ brain (behavior tree - if used)
      └─ pathType (pathfinding type)
```

### Key Files

| File | Lines | Purpose |
|------|-------|---------|
| `ants.js` | 1025 | Main ant class, extends Entity |
| `antStateMachine.js` | 365 | State management (IDLE, MOVING, GATHERING, etc.) |
| `JobComponent.js` | 50 | Job data and stats |
| `GatherState.js` | 398 | Autonomous gathering behavior |
| `Queen.js` | ~200 | Queen ant subclass |
| `antBrain.js` | ? | Behavior tree (if used) |

**Total**: ~2000+ lines to refactor

### Ant Job Types

- **Scout**: Fast movement, low gather, low combat
- **Farmer**: High gather speed, moderate stats
- **Builder**: High strength, moderate gather
- **Warrior**: High combat, low gather
- **Spitter**: Ranged combat, moderate stats
- **Queen**: Special unit, spawns ants
- **DeLozier**: Easter egg (super stats)

---

## Strategy: Incremental Refactoring

**CRITICAL**: We cannot refactor everything at once. Break into small, testable phases.

### Why Incremental?

1. **Ants are EVERYWHERE** in the codebase
2. **Many systems depend on ants** (AntManager, selection, combat, pathfinding)
3. **High risk of breaking gameplay**
4. **Need to keep game playable** during refactoring

### Approach

Each sub-phase will:
1. ✅ Write tests FIRST (TDD red phase)
2. ✅ Implement ONE component at a time
3. ✅ Run tests (TDD green phase)
4. ✅ Integration test with existing code
5. ✅ Refactor and clean up
6. ✅ Move to next component

---

## Phase 3 Breakdown

### Phase 3.1: AntModel (Data Layer) - Week 1
**Goal**: Create AntModel with all data and business logic.

**What Goes in AntModel**:
- Position, size, rotation
- Health system
- Job system (JobComponent integration)
- State machine (AntStateMachine integration)
- Resource inventory
- Faction
- Stats (strength, speed, etc.)
- Movement data (target, path)

**What Does NOT Go in AntModel**:
- Rendering logic (goes in AntView)
- Input handling (goes in AntController)
- Pathfinding algorithms (delegate to pathfinding system)
- Combat calculations (use existing CombatController or create CombatModel)

**Deliverables**:
- `Classes/models/AntModel.js` (~400-500 lines)
- Unit tests (60-80 tests)
- Integration with JobComponent
- Integration with AntStateMachine
- Observable pattern (notify view on changes)

**Time Estimate**: 20-30 hours

---

### Phase 3.2: AntView (Presentation Layer) - Week 1
**Goal**: Create AntView for rendering ants.

**What Goes in AntView**:
- Sprite rendering
- Job-specific sprite selection
- Health bar rendering
- Selection highlight rendering
- Debug visualization
- Animation states

**What Does NOT Go in AntView**:
- Game logic
- Movement calculations
- State transitions

**Deliverables**:
- `Classes/views/AntView.js` (~200-300 lines)
- Integration tests (30-40 tests)
- React to model changes (observable pattern)
- Render different job sprites
- Render state indicators

**Time Estimate**: 15-20 hours

---

### Phase 3.3: AntController (Public API) - Week 2
**Goal**: Create AntController as the public-facing API.

**What Goes in AntController**:
- Public methods (getPosition, getHealth, getJob, etc.)
- Input handling (click to select)
- Command methods (moveTo, gather, attack)
- State transition coordination
- Serialization (toJSON)

**What Does NOT Go in AntController**:
- Business logic (delegate to model)
- Rendering (delegate to view)

**Public API Design**:
```javascript
// Position and movement
getPosition()
getSize()
moveTo(x, y)
stopMovement()

// Health and combat
getHealth()
getMaxHealth()
takeDamage(amount)
heal(amount)
isDead()
attack(target)

// Job and stats
getJob()
getJobStats()
changeJob(newJob)

// State machine
getState()
setState(primary, combat, terrain)
isInState(stateName)

// Resources
getInventory()
addResource(resource)
removeResource(amount)
isInventoryFull()

// Behavior
startGathering()
stopGathering()
returnToBase()

// Serialization
toJSON()
```

**Deliverables**:
- `Classes/controllers/mvc/AntController.js` (~400-500 lines)
- Unit tests (60-80 tests)
- Complete public API
- Input handling
- Serialization support

**Time Estimate**: 25-35 hours

---

### Phase 3.4: AntFactory (Creation Layer) - Week 2
**Goal**: Centralize ant creation logic.

**What Goes in AntFactory**:
- Factory methods for each job type
- Image loading per job
- Default stat configuration
- Position and faction handling

**Factory Methods**:
```javascript
AntFactory.createScout(x, y, faction)
AntFactory.createFarmer(x, y, faction)
AntFactory.createBuilder(x, y, faction)
AntFactory.createWarrior(x, y, faction)
AntFactory.createSpitter(x, y, faction)
AntFactory.createQueen(x, y, faction)
AntFactory.createDeLozier(x, y, faction) // Easter egg

// Generic with options
AntFactory.createAnt(x, y, jobName, faction, options)
```

**Deliverables**:
- `Classes/factories/AntFactory.js` (~200-250 lines)
- Unit tests (30-40 tests)
- All job type factories
- Image preloading
- Configuration management

**Time Estimate**: 10-15 hours

---

### Phase 3.5: Behavior State Refactoring - Week 3
**Goal**: Integrate GatherState and other behaviors with AntModel.

**Current Behaviors**:
- GatherState (autonomous gathering)
- Combat behaviors (via CombatController)
- Building behaviors (if any)
- Patrol behaviors (if any)

**Strategy**:
1. Keep GatherState as separate component (composition over inheritance)
2. Update GatherState to work with AntModel instead of Entity
3. Add behavior state to AntModel
4. Controller coordinates behaviors

**Deliverables**:
- Updated `GatherState.js` (~400 lines, refactored)
- Integration tests (20-30 tests)
- Behavior coordination in AntController
- State machine integration

**Time Estimate**: 15-20 hours

---

### Phase 3.6: AntManager Refactoring - Week 3
**Goal**: Simplify AntManager to coordinate AntControllers.

**Current AntManager** (analyze further):
- Tracks all ants
- Spawns ants
- Updates ants
- Removes dead ants

**New AntManager**:
- Track AntController instances (not Entity instances)
- Delegate creation to AntFactory
- Coordinate updates
- Handle lifecycle (spawn, death, removal)

**Deliverables**:
- `Classes/managers/AntManager.js` (refactored, ~150-200 lines)
- Integration tests (20-30 tests)
- Factory integration
- Update coordination
- Cleanup lifecycle

**Time Estimate**: 10-15 hours

---

### Phase 3.7: Integration and Migration - Week 4
**Goal**: Update all code that creates/uses ants.

**Files to Update**:
- `sketch.js` (ant spawning, updates)
- Queen spawning logic
- Building spawn logic
- Level loader (if it spawns ants)
- Any UI that displays ant info
- Selection system
- Combat system

**Migration Pattern**:
```javascript
// OLD (Entity-based)
const ant = new ant(x, y, 20, 20, 1, 0, JobImages.Scout, "Scout", "player");
ants.push(ant);

// NEW (MVC)
const ant = AntFactory.createScout(x, y, "player");
// AntManager automatically tracks
```

**Deliverables**:
- Updated all ant creation sites
- Updated all ant usage sites
- Removed old ant class
- Integration tests passing
- Game fully playable

**Time Estimate**: 15-20 hours

---

### Phase 3.8: Documentation and Cleanup - Week 4
**Goal**: Complete API documentation and update roadmap.

**Deliverables**:
- `docs/api/AntController_API_Reference.md`
- `docs/api/AntFactory_API_Reference.md`
- `docs/api/AntManager_API_Reference.md`
- `CHANGELOG.md` updated (breaking changes, migration guide)
- `MVC_REFACTORING_ROADMAP.md` updated (Phase 3 complete)
- Code cleanup (remove commented code, refactor duplicates)

**Time Estimate**: 8-10 hours

---

## Testing Strategy

### Unit Tests (Target: 200+ tests)
- AntModel: 60-80 tests
  - Health system
  - Job system
  - State machine integration
  - Resource inventory
  - Movement data
  - Serialization
- AntView: 30-40 tests
  - Sprite rendering
  - Model reactions
  - Job sprite selection
  - Health bar rendering
- AntController: 60-80 tests
  - Public API
  - Input handling
  - Command methods
  - State coordination
  - Serialization
- AntFactory: 30-40 tests
  - Factory methods
  - Job configurations
  - Image loading
- AntManager: 20-30 tests
  - Tracking
  - Creation
  - Updates
  - Cleanup

### Integration Tests (Target: 50+ tests)
- AntModel + AntStateMachine integration
- AntModel + JobComponent integration
- AntModel + GatherState integration
- AntController + AntManager integration
- AntFactory + AntManager integration
- Full ant lifecycle (spawn → gather → return → die)

### BDD Tests (Optional, Target: 8-12 scenarios)
- Create ant via factory
- Ant gathers resources
- Ant returns to base
- Ant takes damage and dies
- Ant changes jobs
- Ant state transitions
- Queen spawns ants
- Combat between ants

---

## Risk Mitigation

### High-Risk Areas

1. **State Machine Integration**
   - Risk: Breaking existing state transitions
   - Mitigation: Comprehensive state machine tests, keep AntStateMachine as-is initially

2. **GatherState Behavior**
   - Risk: Breaking autonomous gathering
   - Mitigation: Keep GatherState as component, update to use AntModel API

3. **Combat System**
   - Risk: Breaking combat calculations
   - Mitigation: Keep CombatController logic, wrap in AntModel methods

4. **Selection System**
   - Risk: Breaking ant selection
   - Mitigation: Ensure AntController has selection API, update selection code incrementally

5. **Queen Spawning**
   - Risk: Breaking queen ant logic
   - Mitigation: Create QueenController extending AntController, preserve spawn logic

### Rollback Plan

If a phase breaks the game:
1. ✅ Git branch per phase (easy rollback)
2. ✅ Keep old ant class until Phase 3.7
3. ✅ Parallel implementation (new + old coexist)
4. ✅ Feature flags (enable/disable new ant system)

---

## Success Criteria

### Phase 3 Complete When:

- [ ] ✅ 250+ tests passing (200 unit + 50 integration)
- [ ] ✅ All ants use AntController (not Entity)
- [ ] ✅ AntFactory used for all ant creation
- [ ] ✅ AntManager refactored (simplified)
- [ ] ✅ Old ant class removed
- [ ] ✅ Game fully playable (no regressions)
- [ ] ✅ API documentation complete
- [ ] ✅ CHANGELOG.md updated
- [ ] ✅ MVC_REFACTORING_ROADMAP.md updated

### Quality Checks

- [ ] No direct property access (use getters/setters)
- [ ] Observable pattern working (views auto-update)
- [ ] State transitions working correctly
- [ ] Gathering behavior working
- [ ] Combat working
- [ ] Selection working
- [ ] Queen spawning working
- [ ] All job types working
- [ ] Serialization working (save/load)

---

## Next Steps (After Phase 3)

1. **Phase 4**: Refactor GameStateManager, SelectionManager
2. **Phase 5**: Refactor UI (draggable panels)
3. **Phase 6**: Manager elimination (service architecture)
4. **Phase 7**: Final Entity cleanup

---

## Notes

- **DO NOT** try to refactor everything at once
- **DO** test each sub-phase thoroughly before moving on
- **DO** keep game playable during migration
- **DO** use git branches for each sub-phase
- **DO** ask for help if stuck (don't guess)
- **DON'T** skip tests (TDD is critical for ants)
- **DON'T** break existing features (regressions are costly)

---

## Questions Before Starting

1. **Are there any other ant behaviors we need to preserve?** (patrol, defend, etc.)
2. **Is antBrain.js still used?** (behavior tree system)
3. **Do we need Queen as separate class or just job type?**
4. **Are there any experimental ant features to remove?**
5. **What ant features are highest priority?** (gathering, combat, movement)

---

**Ready to Start**: Phase 3.1 (AntModel)
**Next Action**: Analyze current ant class methods and properties, create AntModel test suite
