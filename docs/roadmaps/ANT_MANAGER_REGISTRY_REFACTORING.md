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

### Phase 3.4.3: Lifecycle Management (TDD)

**Deliverables**:
- `updateAll()` method (calls ant.update() on all ants)
- `renderAll()` method (delegates to RenderLayerManager)
- Selection management (keep existing, integrate with registry)
- Unit tests (10+ tests)

**Test Coverage**:
1. `updateAll()` calls update() on all ants
2. `updateAll()` skips destroyed ants
3. `renderAll()` delegates to RenderLayerManager
4. Selection persists across queries
5. Destroying selected ant clears selection

**Files**:
- `test/unit/managers/AntManager.test.js` (+10 tests)

---

### Phase 3.4.4: Backward Compatibility Layer

**Deliverables**:
- Deprecation warnings for old patterns
- Adapter methods for legacy code
- Migration guide documentation

**Compatibility Methods**:
```javascript
// Deprecated: Direct array access
// OLD: ants[i]
// NEW: antManager.getAllAnts()[i] (temporary)
// BETTER: antManager.getAntById(id)

// Deprecated: Global antIndex counter
// OLD: antIndex++ when creating ant
// NEW: antManager.createAnt() handles IDs automatically

// Deprecated: getAntObject(index)
// OLD: antManager.getAntObject(5)
// NEW: antManager.getAntById(5)
```

**Files**:
- `docs/guides/ANT_MANAGER_MIGRATION_GUIDE.md` (NEW)

---

### Phase 3.4.5: Integration with Existing Systems

**Integration Points**:
1. **SpatialGridManager** - Auto-register/remove ants
2. **RenderLayerManager** - Delegate rendering
3. **Legacy Ant class** - Wrapper for backward compatibility
4. **AntFactory** (NEW) - Create ants via factory pattern
5. **sketch.js** - Replace global `ants[]` array with `antManager.getAllAnts()`

**Test Coverage**:
- Integration tests with SpatialGridManager (5 tests)
- Integration tests with RenderLayerManager (3 tests)
- Integration tests with legacy Ant class (5 tests)

**Files**:
- `test/integration/managers/AntManager.integration.test.js` (+13 tests)

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
