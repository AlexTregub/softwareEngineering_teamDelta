# Phase 6.1: EntityService - Unified Entity Management

**Status**: 🚀 IN PROGRESS  
**Start Date**: November 4, 2025  
**Estimated Duration**: 12-16 hours  
**Parent Phase**: Phase 6 - Manager Elimination

---

## 📋 Overview

**Goal**: Consolidate AntManager, BuildingManager, ResourceSystemManager into one unified EntityService

**User Stories**:
1. As a developer, I want to spawn any entity type through one API so I have consistent creation patterns
2. As a developer, I want to query entities by type/faction/ID so I can find entities efficiently
3. As a developer, I want one registry for all entities so I eliminate duplicate tracking systems

**Key Design Decisions**:
- **Unified Registry**: Single Map<ID, Entity> for all entity types (ants, buildings, resources)
- **Factory Injection**: EntityService receives factories via constructor (dependency injection)
- **Type-Based Spawning**: `spawn(type, options)` delegates to appropriate factory
- **Backward Compatibility**: Provide facades for old manager APIs during migration

---

## 🎯 Deliverables

### Code
- [x] `Classes/services/EntityService.js` (200-250 lines)
- [ ] Unit tests: `test/unit/services/EntityService.test.js` (40-50 tests)
- [ ] Integration tests: `test/integration/services/EntityService.integration.test.js` (15-20 tests)

### Documentation
- [ ] API Reference: `docs/api/EntityService_API_Reference.md`
- [ ] Migration guide section in `docs/guides/MANAGER_TO_SERVICE_MIGRATION.md`

### Breaking Changes
- `g_antManager.createAnt()` → `gameContext.entities.spawn('Ant', { ... })`
- `g_buildingManager.createBuilding()` → `gameContext.entities.spawn('Building', { ... })`
- `g_resourceSystemManager.spawnResource()` → `gameContext.entities.spawn('Resource', { ... })`

---

## ✅ Implementation Checklist

### Phase 6.1.1: Write EntityService Tests (TDD) ⏳ IN PROGRESS
**Time**: 3-4 hours

- [ ] **Registry Tests** (10 tests)
  - [ ] should initialize with empty registry
  - [ ] should auto-generate sequential IDs
  - [ ] should store entity in registry on spawn
  - [ ] should retrieve entity by ID (O(1) lookup)
  - [ ] should return undefined for non-existent ID
  - [ ] should remove entity from registry on destroy
  - [ ] should get all entities as array
  - [ ] should get entity count
  - [ ] should clear all entities
  - [ ] should not reuse IDs after destroy

- [ ] **Spawn Tests** (12 tests)
  - [ ] should spawn ant with correct type
  - [ ] should spawn ant with auto-generated ID
  - [ ] should spawn ant at specified position
  - [ ] should spawn ant with custom options (job, faction)
  - [ ] should spawn building with correct type
  - [ ] should spawn building with custom options
  - [ ] should spawn resource with correct type
  - [ ] should spawn resource with custom options
  - [ ] should delegate to AntFactory for ant spawning
  - [ ] should delegate to BuildingFactory for building spawning
  - [ ] should delegate to ResourceFactory for resource spawning
  - [ ] should throw error for unknown entity type

- [ ] **Query Tests** (10 tests)
  - [ ] should get entities by type (Ant)
  - [ ] should get entities by type (Building)
  - [ ] should get entities by type (Resource)
  - [ ] should return empty array for non-existent type
  - [ ] should get entities by faction (player)
  - [ ] should get entities by faction (enemy)
  - [ ] should get entities by faction (neutral)
  - [ ] should get entities by type AND faction
  - [ ] should get entities by custom filter function
  - [ ] should handle complex queries efficiently

- [ ] **Update Tests** (5 tests)
  - [ ] should update all entities in registry
  - [ ] should skip inactive entities
  - [ ] should handle entities added during update
  - [ ] should handle entities removed during update
  - [ ] should call update() on each entity controller

- [ ] **Lifecycle Tests** (5 tests)
  - [ ] should destroy entity by ID
  - [ ] should call destroy() on entity controller
  - [ ] should remove from registry after destroy
  - [ ] should unregister from spatial grid on destroy
  - [ ] should handle destroying non-existent ID gracefully

**Run Tests**:
```bash
npx mocha "test/unit/services/EntityService.test.js"
```

---

### Phase 6.1.2: Implement EntityService ⏱️ NOT STARTED
**Time**: 4-5 hours

**Algorithm - Unified Spawn**:
```javascript
spawn(type, options) {
  // 1. Generate unique ID
  const id = this._nextId++;
  
  // 2. Delegate to appropriate factory
  let entity;
  switch(type) {
    case 'Ant':
      entity = this._antFactory.create(options);
      break;
    case 'Building':
      entity = this._buildingFactory.create(options);
      break;
    case 'Resource':
      entity = this._resourceFactory.create(options);
      break;
    default:
      throw new Error(`Unknown entity type: ${type}`);
  }
  
  // 3. Assign ID to entity
  entity._id = id;
  
  // 4. Register in unified registry
  this._entities.set(id, entity);
  
  // 5. Register with spatial grid (if available)
  if (this._spatialGrid) {
    this._spatialGrid.addEntity(entity);
  }
  
  // 6. Return entity
  return entity;
}
```

**Tasks**:
- [ ] Create `Classes/services/` directory
- [ ] Create `Classes/services/EntityService.js`
- [ ] Implement constructor (inject factories)
- [ ] Implement `spawn(type, options)` with type switching
- [ ] Implement `getById(id)` (O(1) Map lookup)
- [ ] Implement `getByType(type)` (filter registry)
- [ ] Implement `getByFaction(faction)` (filter registry)
- [ ] Implement `getAllEntities()` (convert Map to Array)
- [ ] Implement `update(deltaTime)` (iterate registry)
- [ ] Implement `destroy(id)` (remove from registry + spatial grid)
- [ ] Implement `clearAll()` (destroy all + reset)
- [ ] Implement `getCount()` (return registry size)
- [ ] Add JSDoc comments for all methods

**File Structure**:
```javascript
// Classes/services/EntityService.js
class EntityService {
  constructor(antFactory, buildingFactory, resourceFactory) {
    this._entities = new Map();      // ID → Entity
    this._nextId = 0;
    
    // Inject factories
    this._antFactory = antFactory;
    this._buildingFactory = buildingFactory;
    this._resourceFactory = resourceFactory;
    
    // Optional dependencies (set via setter)
    this._spatialGrid = null;
  }
  
  // Dependency injection
  setSpatialGrid(grid) { this._spatialGrid = grid; }
  
  // Spawn API
  spawn(type, options) { /* unified creation */ }
  
  // Query API
  getById(id) { /* O(1) lookup */ }
  getByType(type) { /* filter */ }
  getByFaction(faction) { /* filter */ }
  getAllEntities() { /* Array.from(this._entities.values()) */ }
  getCount() { /* this._entities.size */ }
  
  // Query with custom filter
  query(filterFn) {
    return Array.from(this._entities.values()).filter(filterFn);
  }
  
  // Lifecycle
  update(deltaTime) { /* iterate + update */ }
  destroy(id) { /* remove + cleanup */ }
  clearAll() { /* reset state */ }
}
```

**Run Tests**:
```bash
npx mocha "test/unit/services/EntityService.test.js"
# Expect: 42 tests passing
```

---

### Phase 6.1.3: Integration Tests ⏱️ NOT STARTED
**Time**: 2-3 hours

**Integration Test Scenarios**:
- [ ] **EntityService + AntFactory Integration** (5 tests)
  - [ ] should spawn ant with all job types (Scout, Warrior, Builder, etc.)
  - [ ] should spawn ant with correct AntController instance
  - [ ] should spawn ant registered in spatial grid
  - [ ] should query spawned ants by faction
  - [ ] should destroy ant and unregister from spatial grid

- [ ] **EntityService + BuildingFactory Integration** (5 tests)
  - [ ] should spawn building with all types (AntCone, AntHill, HiveSource)
  - [ ] should spawn building with correct BuildingController instance
  - [ ] should query spawned buildings by faction
  - [ ] should destroy building and cleanup resources
  - [ ] should update all buildings each frame

- [ ] **EntityService + ResourceFactory Integration** (5 tests)
  - [ ] should spawn resource with all types (GreenLeaf, Berry, etc.)
  - [ ] should spawn resource with correct ResourceController instance
  - [ ] should query spawned resources by type
  - [ ] should destroy resource and unregister
  - [ ] should handle gathering resource (amount reduction)

**Run Tests**:
```bash
npx mocha "test/integration/services/EntityService.integration.test.js"
# Expect: 15 tests passing
```

---

### Phase 6.1.4: Create EntityService Instance ⏱️ NOT STARTED
**Time**: 1 hour

- [ ] Update `sketch.js` to create EntityService
- [ ] Initialize with AntFactory, BuildingFactory, ResourceFactory
- [ ] Wire up spatial grid dependency
- [ ] Test manual entity spawning via console

**sketch.js changes**:
```javascript
// sketch.js (temporary setup before GameContext)
let g_entityService;

function setup() {
  createCanvas(800, 600);
  
  // Create EntityService
  g_entityService = new EntityService(
    new AntFactory(/* ... */),
    new BuildingFactory(/* ... */),
    new ResourceFactory(/* ... */)
  );
  
  // Wire dependencies
  g_entityService.setSpatialGrid(spatialGridManager);
  
  // Test spawn
  const ant = g_entityService.spawn('Ant', { x: 100, y: 100, job: 'Worker', faction: 'player' });
  console.log('Spawned ant:', ant);
}
```

**Manual Testing**:
```javascript
// Open browser console
g_entityService.spawn('Ant', { x: 200, y: 200, job: 'Warrior', faction: 'enemy' });
g_entityService.getByFaction('player');  // Should return player ants
g_entityService.getByType('Ant');        // Should return all ants
```

---

### Phase 6.1.5: Migration Facades (Backward Compatibility) ⏱️ NOT STARTED
**Time**: 2-3 hours

**Goal**: Keep old manager APIs working temporarily

**Tasks**:
- [ ] Create `AntManager` facade class (wraps EntityService)
- [ ] Create `BuildingManager` facade class (wraps EntityService)
- [ ] Deprecate old manager methods with console warnings
- [ ] Update index.html to load EntityService + facades

**Facade Pattern**:
```javascript
// Classes/managers/AntManager.js (FACADE - deprecated)
class AntManager {
  constructor(entityService) {
    this._entityService = entityService;
  }
  
  createAnt(x, y, options = {}) {
    console.warn('AntManager.createAnt() is deprecated. Use gameContext.entities.spawn("Ant", ...) instead.');
    return this._entityService.spawn('Ant', { x, y, ...options });
  }
  
  getAntById(id) {
    console.warn('AntManager.getAntById() is deprecated. Use gameContext.entities.getById() instead.');
    return this._entityService.getById(id);
  }
  
  // ... other facade methods
}
```

**sketch.js update**:
```javascript
// Temporary: Create facades for backward compatibility
g_antManager = new AntManager(g_entityService);
g_buildingManager = new BuildingManager(g_entityService);
```

---

### Phase 6.1.6: Documentation ⏱️ NOT STARTED
**Time**: 2-3 hours

- [ ] Create `docs/api/EntityService_API_Reference.md` (Godot-style)
- [ ] Add EntityService section to `docs/guides/MANAGER_TO_SERVICE_MIGRATION.md`
- [ ] Update CHANGELOG.md with Phase 6.1 completion
- [ ] Add code examples for common use cases

**API Reference Structure**:
```markdown
# EntityService API Reference

**Inherits**: None (root service)  
**File**: `Classes/services/EntityService.js`

## Description
Unified entity management service. Replaces AntManager, BuildingManager, and ResourceSystemManager.

## Methods
| Returns | Method |
|---------|--------|
| `Entity` | spawn ( type: `String`, options: `Object` = {} ) |
| `Entity` | getById ( id: `int` ) const |
| `Array<Entity>` | getByType ( type: `String` ) const |
| `Array<Entity>` | getByFaction ( faction: `String` ) const |
| `void` | update ( deltaTime: `float` ) |
| `bool` | destroy ( id: `int` ) |

## Method Descriptions
...
```

---

### Phase 6.1.7: Run Full Test Suite ⏱️ NOT STARTED
**Time**: 1 hour

- [ ] Run all EntityService tests (unit + integration)
- [ ] Run all existing tests (Resources, Buildings, Ants)
- [ ] Verify no regressions
- [ ] Check test coverage

**Commands**:
```bash
# EntityService tests only
npx mocha "test/unit/services/EntityService.test.js" "test/integration/services/EntityService.integration.test.js"

# Full test suite (expect 603 + 57 = 660 tests passing)
npm test
```

**Expected Results**:
- ✅ EntityService: 42 unit tests passing
- ✅ EntityService: 15 integration tests passing
- ✅ Resources: 190 tests passing (no regressions)
- ✅ Buildings: 172 tests passing (no regressions)
- ✅ Ants: 241 tests passing (no regressions)
- ✅ **Total: 660 tests passing**

---

## 📊 Progress Tracking

### Current Status
- [x] Phase 6.1.1: Write EntityService Tests (TDD) - 0% complete
- [ ] Phase 6.1.2: Implement EntityService - 0% complete
- [ ] Phase 6.1.3: Integration Tests - 0% complete
- [ ] Phase 6.1.4: Create EntityService Instance - 0% complete
- [ ] Phase 6.1.5: Migration Facades - 0% complete
- [ ] Phase 6.1.6: Documentation - 0% complete
- [ ] Phase 6.1.7: Run Full Test Suite - 0% complete

### Time Tracking
- **Estimated**: 12-16 hours
- **Actual**: 0 hours
- **Remaining**: 12-16 hours

---

## 🎯 Success Criteria

- ✅ EntityService class implemented (200-250 lines)
- ✅ 42 unit tests passing
- ✅ 15 integration tests passing
- ✅ All existing tests passing (no regressions)
- ✅ API documentation complete
- ✅ Migration guide section complete
- ✅ Can spawn ants/buildings/resources via EntityService.spawn()
- ✅ Backward compatibility facades working

---

## 🚀 Next Steps

**After Phase 6.1 Complete**:
1. Move to Phase 6.2: WorldService (10-14 hours)
2. Continue Phase 6 timeline
3. Update PHASE_6_MANAGER_ELIMINATION_ROADMAP.md progress

**Immediate Action** (RIGHT NOW):
1. Create test file: `test/unit/services/EntityService.test.js`
2. Write first test: "should initialize with empty registry"
3. Run test (expect failure)
4. Implement EntityService constructor
5. Run test (expect pass)
6. Continue TDD cycle

---

## 📝 Notes

**Design Philosophy**:
- **Single Responsibility**: EntityService ONLY manages entity lifecycle (spawn, query, update, destroy)
- **Factory Pattern**: EntityService delegates creation to factories (no direct instantiation)
- **Dependency Injection**: Factories and spatial grid injected via constructor/setter
- **Backward Compatible**: Facades allow gradual migration from old managers

**Performance Considerations**:
- Map<ID, Entity> gives O(1) lookup by ID
- Query by type/faction requires iteration (acceptable for current entity counts)
- Consider indexing by type/faction if performance becomes issue (future optimization)

**Testing Strategy**:
- Unit tests: Mock factories, test EntityService in isolation
- Integration tests: Real factories, test full spawn → query → destroy workflow
- BDD tests: User-facing workflows (Phase 6.8 after GameContext)
