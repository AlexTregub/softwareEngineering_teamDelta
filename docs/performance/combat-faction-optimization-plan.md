# Combat & Faction Controller Optimization Plan

## Performance Issues Identified

### Current Bottlenecks (from browser profiler)

1. **CombatController.detectEnemies()** - 6,673ms (96.3% of total time)
2. **FactionController._getEntityFaction()** - Called thousands of times per second
3. **getController('faction')** - Repeated lookups for same entities
4. **shouldAttackOnSight/shouldAttackAfterDelay** - Quadratic complexity

### Root Cause Analysis

#### Mathematical Complexity
- **N ants × N checks = N² operations every 100ms**
- With 50 ants: 2,500 operations per 100ms = 25,000/second
- With 100 ants: 10,000 operations per 100ms = 100,000/second

#### Inefficient Patterns
1. **Repeated Controller Lookups**: Same entity.getController('faction') called multiple times
2. **No Spatial Optimization**: Checking ants across entire map regardless of distance
3. **Cache Inefficiency**: Controller cache cleanup is too infrequent
4. **Redundant Faction Checks**: Re-checking same faction relationships repeatedly

## Optimization Strategy

### Phase 1: Immediate Performance Fixes

#### A. Spatial Optimization
```javascript
// Instead of checking ALL ants:
for (let i = 0; i < ants.length; i++) { /* N×N complexity */ }

// Use spatial partitioning:
const nearbyAnts = getSpatiallyNearbyAnts(this._entity, this._detectionRadius * 1.5);
for (const otherAnt of nearbyAnts) { /* Much smaller subset */ }
```

#### B. Batched Processing
```javascript
// Instead of every ant running detectEnemies() every 100ms:
static _globalEnemyDetection = new Map(); // ant -> enemies
static _lastGlobalCheck = 0;

// Run global check less frequently, stagger individual checks
if (now - CombatController._lastGlobalCheck > 300) {
  CombatController._runGlobalEnemyDetection();
}
```

#### C. Enhanced Controller Caching
```javascript
// Pre-populate controller cache at entity creation:
constructor(entity) {
  this._controllerCache = new Map();
  this._populateInitialCache(); // Cache all existing ants
}

// Use WeakMap for automatic cleanup:
static _globalFactionCache = new WeakMap(); // entity -> factionController
```

### Phase 2: System Consolidation

#### A. Unified Combat-Faction System
Current architecture has redundancy:
- CombatController manages enemy detection
- FactionController manages relationship logic
- Both cache entity controllers separately
- Both iterate through ant collections

**Proposed**: Single `CombatFactionController` that handles both:

```javascript
class CombatFactionController {
  constructor(entity) {
    this._entity = entity;
    // Combine combat + faction state
    this._combatState = 'OUT_OF_COMBAT';
    this._factionId = entity.faction || 'neutral';
    this._nearbyEnemies = [];
    this._spatialGrid = null; // Reference to global spatial system
  }
  
  // Unified enemy detection with faction logic
  detectEnemiesWithFactionRules() {
    // Use spatial grid, apply faction rules in single pass
  }
}
```

#### B. Global Spatial Grid System
Instead of each ant checking all other ants:

```javascript
class GlobalSpatialGrid {
  static _grid = new Map(); // gridCell -> Set<entities>
  static _cellSize = 100; // pixels
  
  static getEntitiesInRadius(entity, radius) {
    // Return only entities in nearby grid cells
    // Reduces N×N to N×(small constant)
  }
}
```

#### C. Faction Relationship Cache
Pre-compute faction relationships instead of checking per-ant:

```javascript
class GlobalFactionRelationships {
  static _relationships = new Map(); // "factionA-factionB" -> relationship
  
  static getRelationship(factionA, factionB) {
    // O(1) lookup instead of O(N) computation
  }
}
```

### Phase 3: Advanced Optimizations

#### A. Update Frequency Optimization
```javascript
// Different update frequencies for different behaviors:
- Combat detection: 100ms (high priority)
- Faction discovery: 2000ms (low priority) 
- Territory checks: 1000ms (medium priority)

// Stagger updates across frames:
const frameOffset = entityId % 10; // Spread across 10 frames
```

#### B. Dirty State Tracking
```javascript
// Only process when needed:
class CombatFactionController {
  _isDirty = true;
  _lastPosition = null;
  
  update() {
    if (!this._needsUpdate()) return;
    // ... expensive operations
  }
  
  _needsUpdate() {
    return this._isDirty || 
           this._positionChanged() || 
           this._timeElapsed() > this._updateInterval;
  }
}
```

## Implementation Plan

### Step 1: Quick Wins (Immediate - 1 hour)
1. **Spatial Pre-filtering**: Only check ants within 2× detection radius
2. **Controller Cache Warming**: Pre-populate caches at startup
3. **Update Frequency Adjustment**: Reduce faction discovery frequency

```javascript
// Expected improvement: 60-80% reduction in CPU usage
```

### Step 2: System Consolidation (Short-term - 2-3 hours)
1. **Merge Controllers**: Create unified CombatFactionController
2. **Global Spatial Grid**: Implement spatial partitioning system
3. **Relationship Caching**: Pre-compute faction relationships

```javascript
// Expected improvement: 80-90% reduction in CPU usage
```

### Step 3: Advanced Optimization (Long-term - 4-5 hours)
1. **Multi-frame Processing**: Spread expensive operations across frames
2. **Dirty State System**: Only update when necessary
3. **Memory Pool**: Reuse objects to reduce garbage collection

```javascript
// Expected improvement: 90-95% reduction in CPU usage
```

## Expected Results

### Performance Improvements
- **Phase 1**: 60-80% CPU reduction
- **Phase 2**: 80-90% CPU reduction  
- **Phase 3**: 90-95% CPU reduction

### Code Quality Benefits
- **Reduced Duplication**: Single controller instead of two separate systems
- **Better Maintainability**: Unified logic for combat and faction decisions
- **Cleaner Architecture**: Spatial grid system benefits other systems too

### Scalability Improvements
- **50 ants**: Smooth performance (currently struggles)
- **100 ants**: Good performance (currently unplayable)
- **200+ ants**: Feasible with optimizations

## Risk Assessment

### Low Risk
- Controller caching improvements
- Spatial pre-filtering
- Update frequency adjustments

### Medium Risk  
- System consolidation (requires careful testing)
- Global spatial grid (affects other systems)

### High Risk
- Multi-frame processing (complex state management)
- Memory pooling (potential memory leaks)

## Testing Strategy

1. **Performance Benchmarks**: Before/after CPU profiling
2. **Functional Testing**: Ensure combat behavior unchanged
3. **Stress Testing**: Test with 100+ ants
4. **Memory Testing**: Check for memory leaks with consolidation

## Next Steps

Would you like me to implement:
1. **Quick wins first** (spatial filtering + caching improvements)?
2. **Full consolidation** (merge combat + faction controllers)?
3. **Step-by-step** with testing at each phase?

Each approach has different time/risk trade-offs. The quick wins alone should give you 60-80% performance improvement with minimal risk.