# AntManager Registry Refactoring Roadmap (Phase 3.4)

## Overview

**Goal**: Eliminate `antIndex` global counter and array-based ant lookups. Replace with Map-based registry pattern in AntManager for O(1) lookups, clean API, and simplified codebase.

**Problem Statement**:
- Global counter pollution (`let nextAntIndex = 0` at file level)
- Array-based lookups (`ants[antIndex]`) break with gaps when ants die
- Manual index management confusing (constructor param vs auto-increment)
- Spatial grid added complexity for simple queries
- Index fragmentation when ants removed from array

**Solution**: AntManager becomes **single source of truth** with Map-based registry.

---

## 🎯 Goals

### Primary Objectives
1. **Eliminate global counter** - Move `nextAntIndex` into AntManager
2. **Map-based registry** - `Map<id, AntController>` for O(1) lookups
3. **Clean creation API** - `antManager.createAnt(x, y, options)` returns AntController with auto-generated ID
4. **Type-safe queries** - `getAntsByJob()`, `getAntsByFaction()`, `getNearbyAnts()`
5. **Lifecycle management** - `destroyAnt(id)` handles cleanup + spatial grid removal
6. **Backward compatibility** - Deprecate `ants[]` array gradually, provide migration layer

### Success Metrics
- ✅ Zero global ant counters
- ✅ Zero direct `ants[]` array access in new code
- ✅ O(1) ant lookup by ID
- ✅ 50+ tests (unit + integration)
- ✅ All legacy code still works (compatibility layer)
- ✅ Spatial grid auto-integrated

---

## 📋 API Design

### New AntManager API

```javascript
class AntManager {
  // ========================================
  // Core Registry
  // ========================================
  
  /**
   * Create ant with auto-generated ID
   * @param {number} x - World X position
   * @param {number} y - World Y position
   * @param {Object} options - Ant configuration
   * @param {string} options.jobName - Job type (Scout, Farmer, Warrior, etc.)
   * @param {string} options.faction - Faction (player, enemy, neutral)
   * @returns {AntController} Created ant with auto-generated ID
   */
  createAnt(x, y, options = {})
  
  /**
   * Get ant by ID (O(1) lookup)
   * @param {number} id - Ant ID
   * @returns {AntController|undefined} Ant or undefined if not found
   */
  getAntById(id)
  
  /**
   * Get all ants as array (for iteration)
   * @returns {Array<AntController>} All ants
   */
  getAllAnts()
  
  /**
   * Destroy ant and cleanup resources
   * @param {number} id - Ant ID
   * @returns {boolean} True if destroyed, false if not found
   */
  destroyAnt(id)
  
  // ========================================
  // Query Methods
  // ========================================
  
  /**
   * Get ants by job type (fast filtering)
   * @param {string} jobName - Job name (Scout, Farmer, Warrior, etc.)
   * @returns {Array<AntController>} Matching ants
   */
  getAntsByJob(jobName)
  
  /**
   * Get ants by faction
   * @param {string} faction - Faction (player, enemy, neutral)
   * @returns {Array<AntController>} Matching ants
   */
  getAntsByFaction(faction)
  
  /**
   * Get nearby ants (delegates to SpatialGridManager)
   * @param {number} x - World X position
   * @param {number} y - World Y position
   * @param {number} radius - Search radius in pixels
   * @returns {Array<AntController>} Nearby ants
   */
  getNearbyAnts(x, y, radius)
  
  /**
   * Find first ant matching predicate
   * @param {Function} predicate - Test function (ant => boolean)
   * @returns {AntController|undefined} First match or undefined
   */
  findAnt(predicate)
  
  /**
   * Filter ants by predicate
   * @param {Function} predicate - Test function (ant => boolean)
   * @returns {Array<AntController>} Matching ants
   */
  filterAnts(predicate)
  
  /**
   * Get ant count
   * @returns {number} Total ants in registry
   */
  getAntCount()
  
  // ========================================
  // Selection Management (existing)
  // ========================================
  
  getSelectedAnt()
  setSelectedAnt(ant)
  clearSelection()
  handleAntClick()
  
  // ========================================
  // Lifecycle Management
  // ========================================
  
  /**
   * Update all ants
   * @param {number} deltaTime - Time elapsed in ms
   */
  updateAll(deltaTime)
  
  /**
   * Render all ants (delegates to RenderLayerManager)
   */
  renderAll()
  
  /**
   * Clear all ants from registry
   */
  clearAll()
}
```

### Usage Examples

```javascript
// ========================================
// CREATE ANTS
// ========================================

// Simple creation
const ant1 = antManager.createAnt(100, 100, { jobName: 'Scout', faction: 'player' });
const ant2 = antManager.createAnt(200, 200, { jobName: 'Warrior', faction: 'enemy' });

// IDs auto-generated
console.log(ant1.antIndex); // 0
console.log(ant2.antIndex); // 1

// ========================================
// LOOKUP ANTS
// ========================================

// By ID (O(1))
const retrieved = antManager.getAntById(ant1.antIndex);

// By job type
const warriors = antManager.getAntsByJob('Warrior');

// By faction
const playerAnts = antManager.getAntsByFaction('player');
const enemyAnts = antManager.getAntsByFaction('enemy');

// Nearby ants (spatial)
const nearby = antManager.getNearbyAnts(playerX, playerY, 100);

// Custom predicate
const lowHealthAnts = antManager.filterAnts(ant => ant.health < 50);
const firstScout = antManager.findAnt(ant => ant.jobName === 'Scout');

// ========================================
// ITERATE ANTS
// ========================================

// All ants
antManager.getAllAnts().forEach(ant => {
  ant.update(deltaTime);
});

// With count
console.log(`Total ants: ${antManager.getAntCount()}`);

// ========================================
// DESTROY ANTS
// ========================================

// Single ant
antManager.destroyAnt(ant1.antIndex); // Auto-removes from spatial grid

// Clear all
antManager.clearAll();

// ========================================
// BACKWARD COMPATIBILITY (DEPRECATED)
// ========================================

// OLD WAY (still works during migration)
const ants = antManager.getAllAnts(); // Replaces global ants[] array
for (let i = 0; i < ants.length; i++) {
  const ant = ants[i];
  // ...
}
```

---

## 🏗️ Implementation Plan

### Phase 3.4.1: AntManager Core Registry (TDD)

**Deliverables**:
- Map-based registry implementation
- Core CRUD methods (create, get, destroy)
- Auto-ID generation
- Unit tests (30+ tests)

**Test Coverage**:
1. Constructor initializes empty registry
2. `createAnt()` generates sequential IDs
3. `createAnt()` stores in Map
4. `createAnt()` auto-registers with spatial grid (if available)
5. `getAntById()` returns correct ant (O(1))
6. `getAntById()` returns undefined for missing ID
7. `getAllAnts()` returns array of all ants
8. `getAllAnts()` returns empty array when no ants
9. `getAntCount()` returns correct count
10. `destroyAnt()` removes from registry
11. `destroyAnt()` removes from spatial grid
12. `destroyAnt()` calls ant.destroy()
13. `destroyAnt()` returns false for missing ID
14. `clearAll()` removes all ants
15. IDs never reuse (even after destroy)

**Files**:
- `test/unit/managers/AntManager.test.js` (NEW - 30 tests)
- `Classes/managers/AntManager.js` (REWRITE)

---

### Phase 3.4.2: Query Methods (TDD)

**Deliverables**:
- Type-based queries (job, faction)
- Predicate-based filtering
- Spatial queries (delegates to SpatialGridManager)
- Unit + Integration tests (20+ tests)

**Test Coverage**:
1. `getAntsByJob()` returns all matching ants
2. `getAntsByJob()` returns empty for non-existent job
3. `getAntsByFaction()` returns all matching ants
4. `getAntsByFaction()` case-insensitive matching
5. `findAnt()` returns first match
6. `findAnt()` returns undefined if no match
7. `filterAnts()` returns all matches
8. `filterAnts()` returns empty array if no matches
9. `getNearbyAnts()` delegates to spatial grid
10. `getNearbyAnts()` filters by ant type (not buildings/resources)
11. Query performance: 1000 ants filtered in <10ms

**Files**:
- `test/unit/managers/AntManager.test.js` (+20 tests)
- `test/integration/managers/AntManager.integration.test.js` (NEW - spatial grid integration)

---

### Phase 3.4.3: Lifecycle Management (TDD) ✅ COMPLETE (Nov 4, 2025)

**Deliverables**:
- ✅ Singleton pattern (`getInstance()`)
- ✅ `_pausedAnts` Set for pause state tracking
- ✅ `pauseAnt(id)` method - pause individual ant
- ✅ `resumeAnt(id)` method - resume individual ant
- ✅ `pauseAll()` method - pause all ants
- ✅ `resumeAll()` method - resume all ants
- ✅ `isPaused(id)` method - check pause state
- ✅ `updateAll()` method - update only active (non-paused) ants
- ✅ Unit tests - 19/19 tests passing (100%)

**Test Coverage**:
1. ✅ `pauseAnt()` pauses individual ant by ID
2. ✅ `pauseAnt()` adds ant ID to paused set
3. ✅ `pauseAnt()` handles nonexistent IDs gracefully
4. ✅ `pauseAnt()` is idempotent (pause already paused ant)
5. ✅ `resumeAnt()` resumes individual paused ant by ID
6. ✅ `resumeAnt()` removes ant ID from paused set
7. ✅ `resumeAnt()` handles nonexistent IDs gracefully
8. ✅ `resumeAnt()` is idempotent (resume already active ant)
9. ✅ `pauseAll()` pauses all registered ants
10. ✅ `pauseAll()` adds all ant IDs to paused set
11. ✅ `pauseAll()` handles empty registry gracefully
12. ✅ `resumeAll()` resumes all paused ants
13. ✅ `resumeAll()` clears paused set completely
14. ✅ `resumeAll()` handles empty paused set gracefully
15. ✅ `isPaused()` returns true for paused ant
16. ✅ `isPaused()` returns false for active ant
17. ✅ `isPaused()` returns false for nonexistent ant ID
18. ✅ `updateAll()` skips update() for paused ants
19. ✅ `updateAll()` calls update() for active ants

**Files**:
- ✅ `test/unit/managers/AntManager.lifecycle.test.js` (NEW - 19 tests)
- ✅ `Classes/managers/AntManager.js` (+80 lines)
- ✅ `test/helpers/mvcTestHelpers.js` (+60 lines - `loadAntMVCStack()` helper)

**Key Improvements**:
- Created `loadAntMVCStack()` helper to eliminate 20+ lines of boilerplate per test
- Tests use `antManager.createAnt()` factory pattern (consistent with Phase 3.4.1/3.4.2)
- Lifecycle methods enable game pause/resume functionality
- Singleton pattern ensures single AntManager instance

**Time**: ~2.5 hours

---

~~### Phase 3.4.4: Backward Compatibility Layer~~

~~**Deliverables**:~~  
~~- Deprecation warnings for old patterns~~  
~~- Adapter methods for legacy code~~  
~~- Migration guide documentation~~

~~**Compatibility Methods**:~~  
~~```javascript~~  
~~// Deprecated: Direct array access~~  
~~// OLD: ants[i]~~  
~~// NEW: antManager.getAllAnts()[i] (temporary)~~  
~~// BETTER: antManager.getAntById(id)~~  

~~// Deprecated: Global antIndex counter~~  
~~// OLD: antIndex++ when creating ant~~  
~~// NEW: antManager.createAnt() handles IDs automatically~~  

~~// Deprecated: getAntObject(index)~~  
~~// OLD: antManager.getAntObject(5)~~  
~~// NEW: antManager.getAntById(5)~~  
~~```~~

~~**Files**:~~  
~~- `docs/guides/ANT_MANAGER_MIGRATION_GUIDE.md` (NEW)~~

---

### Phase 3.4.5: System Integration (TDD) ✅ COMPLETE (Nov 4, 2025)

**Goal**: Integrate AntManager with existing game systems, refactor `Classes/ants/ants.js` to use AntManager.

**Deliverables**:
- ✅ Feature parity tests (34/34 passing)
- ✅ Added `getSelectedAnts()` method to AntManager
- ✅ Refactored `antsSpawn()` to use `antManager.createAnt()` with fallback
- ✅ Refactored `antsUpdate()` to use `antManager.updateAll()` with fallback
- ✅ Refactored `antsRender()` to use `antManager.getAllAnts()` with fallback
- ✅ Updated exports to provide `getAntManager()` accessor

**Integration Tests** (34 total):
- Feature Parity (21 tests):
  * Core Identity & Properties (4): antIndex, jobName, faction, position
  * Movement API (2): moveTo(), stopMovement()
  * Combat API (4): takeDamage(), heal(), attack(), health/maxHealth
  * Resource API (4): addResource(), removeResource(), dropAllResources(), resourceCount
  * Job API (1): assignJob()
  * State API (2): setState(), getCurrentState()
  * Selection API (2): setSelected(), isSelected()
  * Lifecycle Methods (3): update(), render(), destroy()
- SpatialGridManager Integration (2 tests):
  * Auto-register on creation
  * Auto-remove on destruction
- Global ants[] Array Replacement (3 tests):
  * getAllAnts() replacement
  * Iteration support
  * Array access by index
- Batch Operations (2 tests):
  * updateAll() batch update
  * Legacy antsUpdate() replacement
- Query Methods (2 tests):
  * getAntsByFaction()
  * getAntsByJob()
- Selection System (3 tests):
  * getSelectedAnt()
  * getSelectedAnts() (NEW)
  * clearSelection()

**Refactored Functions** (`Classes/ants/ants.js`):
```javascript
// antsSpawn() - Uses AntManager if available, falls back to legacy
function antsSpawn(numToSpawn, faction, x, y) {
  const useManager = antManager && typeof antManager.createAnt === 'function';
  if (useManager) {
    newAnt = antManager.createAnt(px, py, options);
  } else {
    // Legacy fallback
  }
}

// antsUpdate() - Uses AntManager.updateAll() if available
function antsUpdate() {
  if (antManager && typeof antManager.updateAll === 'function') {
    antManager.updateAll(); // Respects pause state
  } else {
    // Legacy loop
  }
}

// antsRender() - Gets ants via AntManager if available
function antsRender() {
  const antsToRender = (antManager && typeof antManager.getAllAnts === 'function') 
    ? antManager.getAllAnts() 
    : ants;
  // Render loop...
}
```

**Global Variables Replaced**:
- ~~`let antIndex = 0;`~~ → `antManager._nextId` (internal)
- ~~`let ants = [];`~~ → `antManager._ants` Map (replaced with fallback logic)

**Files Modified**:
- `Classes/ants/ants.js` (+40 lines, refactored spawn/update/render)
- `Classes/managers/AntManager.js` (+15 lines, added `getSelectedAnts()`)
- `test/integration/managers/AntManager.integration.test.js` (NEW - 34 tests, 400 lines)

**Key Improvements**:
- ✅ Dual-mode operation (AntManager + legacy fallback)
- ✅ Zero breaking changes to existing code
- ✅ Feature parity verified (all 44 legacy ant methods have MVC equivalents)
- ✅ Performance maintained (batch operations via updateAll())
- ✅ Selection system integrated (getSelectedAnt/Ants/clearSelection)

**Time**: ~3 hours

---

### Phase 3.4.6: AntFactory Implementation (Optional Enhancement)

**Deliverables**:
- Factory pattern for ant creation
- Job-specific factory methods
- Integration with AntManager registry

**Factory API**:
```javascript
class AntFactory {
  /**
   * Create Scout ant
   * @param {number} x - World X position
   * @param {number} y - World Y position
   * @param {Object} options - Additional options
   * @returns {AntController} Scout ant
   */
  static createScout(x, y, options = {}) {
    return antManager.createAnt(x, y, {
      ...options,
      jobName: 'Scout',
      jobImage: 'Images/Ants/scoutAnt.png'
    });
  }
  
  static createFarmer(x, y, options = {}) { /* ... */ }
  static createWarrior(x, y, options = {}) { /* ... */ }
  static createSpitter(x, y, options = {}) { /* ... */ }
  static createQueen(x, y, options = {}) { /* ... */ }
  static createDeLozier(x, y, options = {}) { /* ... */ }
}
```

**Files**:
- `Classes/factories/AntFactory.js` (NEW)
- `test/unit/factories/AntFactory.test.js` (NEW - 10 tests)

---

## 📊 Testing Strategy

### Test Breakdown

| Test Type | Count | Focus |
|-----------|-------|-------|
| Unit (Core Registry) | 30 | Map CRUD, ID generation, lifecycle |
| Unit (Query Methods) | 20 | Filtering, predicate logic |
| Unit (Lifecycle) | 10 | Update, render, selection |
| Integration (Spatial Grid) | 5 | Auto-registration, nearby queries |
| Integration (Rendering) | 3 | RenderLayerManager delegation |
| Integration (Legacy) | 5 | Backward compatibility |
| Integration (Factory) | 10 | AntFactory integration |
| **TOTAL** | **83** | **Comprehensive coverage** |

### Test Execution Order
1. **Phase 3.4.1 Tests** → Implement Core Registry
2. **Phase 3.4.2 Tests** → Implement Query Methods
3. **Phase 3.4.3 Tests** → Implement Lifecycle Management
4. **Phase 3.4.4** → No new tests (documentation only)
5. **Phase 3.4.5 Tests** → Integration testing
6. **Phase 3.4.6 Tests** → Factory pattern testing

---

## 🔄 Migration Strategy

### Step 1: Create New AntManager (Parallel Implementation)
- Keep existing AntManager methods (selection, etc.)
- Add new registry methods alongside
- **No breaking changes** during development

### Step 2: Update Legacy Code Gradually
```javascript
// BEFORE (old pattern)
ants[antIndex++] = new Ant(x, y, ...);
const ant = ants[5];

// AFTER (new pattern)
const ant = antManager.createAnt(x, y, options);
const retrieved = antManager.getAntById(ant.antIndex);
```

### Step 3: Deprecation Warnings
```javascript
// Add warnings to old methods
getAntObject(index) {
  console.warn('DEPRECATED: Use getAntById() instead');
  return this.getAntById(index);
}
```

### Step 4: Remove Global `ants[]` Array
- Replace all `ants[i]` with `antManager.getAllAnts()[i]` (temporary)
- Then refactor to `antManager.getAntById(id)`
- Finally remove global `ants` variable

### Step 5: Remove Global `antIndex` Counter
- Already handled by AntManager internal `_nextId`
- Remove `let nextAntIndex = 0` from AntModel.js
- Remove all `antIndex++` usage in legacy code

---

## 📝 Key Design Decisions

### Why Map Instead of Array?
- **O(1) lookup** by ID (array requires linear search when gaps exist)
- **No index fragmentation** (array has gaps when ants removed)
- **Clean iteration** (`Map.values()` always returns active ants)
- **Type safety** (Map keys are IDs, not array indices)

### Why Auto-Generated IDs?
- **No manual tracking** (developer doesn't think about IDs)
- **No collisions** (sequential counter never reuses)
- **Simpler API** (`createAnt()` returns ant, ID is automatic)
- **Testable** (predictable ID sequence in tests)

### Why Keep `antIndex` Property?
- **Backward compatibility** (legacy code expects `ant.antIndex`)
- **Serialization** (save/load needs stable IDs)
- **Debugging** (easier to identify ants in logs)
- **Migration path** (can rename to `id` later)

### Why AntManager Owns Spatial Grid Integration?
- **Single responsibility** (AntManager handles all ant lifecycle)
- **No manual registration** (developers can't forget to register)
- **Automatic cleanup** (destroyAnt() removes from spatial grid)
- **Encapsulation** (spatial grid is implementation detail)

---

## 🎯 Success Criteria

### Phase 3.4 Complete When:
- ✅ 83+ tests passing (unit + integration)
- ✅ Zero global `ants[]` array access in new code
- ✅ Zero global `antIndex` counter usage
- ✅ All legacy code still functional (backward compatibility)
- ✅ AntFactory implemented (optional enhancement)
- ✅ Migration guide documentation complete
- ✅ API reference documentation complete
- ✅ Performance verified: 1000 ants created/destroyed in <100ms

### Code Quality Metrics
- ✅ AntManager.js < 500 lines (clean, focused)
- ✅ Zero code duplication in query methods
- ✅ 100% JSDoc coverage
- ✅ No global state pollution

---

## 📚 Documentation Deliverables

1. **API Reference**: `docs/api/AntManager_API_Reference.md`
2. **Migration Guide**: `docs/guides/ANT_MANAGER_MIGRATION_GUIDE.md`
3. **Factory Pattern Guide**: `docs/guides/ANT_FACTORY_PATTERN.md`
4. **Architecture Update**: Update MVC_REFACTORING_ROADMAP.md with Phase 3.4 completion

---

## ⏱️ Time Estimates

| Phase | Tasks | Est. Time |
|-------|-------|-----------|
| 3.4.1 | Core Registry (TDD) | 3-4 hours |
| 3.4.2 | Query Methods (TDD) | 2-3 hours |
| 3.4.3 | Lifecycle Management | 1-2 hours |
| 3.4.4 | Backward Compatibility | 1 hour |
| 3.4.5 | System Integration | 2-3 hours |
| 3.4.6 | AntFactory (Optional) | 2 hours |
| Documentation | API + Migration guides | 1-2 hours |
| **TOTAL** | | **12-17 hours** |

---

## 🚀 Next Steps

1. ✅ **Roadmap approved** - User confirmed registry pattern approach
2. **Create Phase 3.4.1 checklist** - Core Registry implementation (TDD)
3. **Write unit tests FIRST** - 30 tests for Map-based registry
4. **Implement AntManager** - Core CRUD methods
5. **Iterate through phases** - Query → Lifecycle → Integration → Factory

**Ready to begin Phase 3.4.1?** 🎯
