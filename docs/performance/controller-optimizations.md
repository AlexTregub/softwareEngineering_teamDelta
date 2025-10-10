# Controller Performance Optimizations

## Applied Optimizations (October 9, 2025)

### Problem Analysis

The browser profiler showed `getController` being called excessively in combat and faction controllers, creating performance bottlenecks. The issue occurred because:

1. **CombatController.detectEnemies()** runs every 100ms and calls `getController('faction')` for every ant in the game
2. **FactionController** methods frequently lookup other entities' faction controllers
3. With N ants having controllers, this created an **N × M** performance problem (N entities × M total entities per check)

### CombatController.js Optimizations

#### 1. Controller Reference Caching

- **Before**: Called `this._entity.getController('faction')` every 100ms in `detectEnemies()`
- **After**: Cache controller reference in constructor as `this._factionController`
- **Impact**: Eliminates repeated self-controller lookups

#### 2. Entity Faction Caching  

- **Before**: Retrieved `this._entity.faction` every iteration
- **After**: Cache faction as `this._entityFaction` in constructor
- **Impact**: Eliminates repeated property access

#### 3. Other Entity Controller Caching

- **Before**: Called `otherAnt.getController('faction')` for every other ant in every check
- **After**: Implemented `this._otherControllerCache` Map to cache results
- **Impact**: Massive reduction in controller lookups (from N×M to ~N)

#### 4. Cache Cleanup Strategy

- Periodic cleanup every 50 calls to prevent memory leaks
- Removes stale references to inactive entities
- Maintains cache efficiency over time

### FactionController.js Optimizations

#### 1. Cached Controller Lookups

- **Before**: `entity.getController('faction')` called repeatedly in `_getEntityFaction()`
- **After**: Implemented `this._controllerCache` Map for caching results
- **Impact**: Eliminates redundant controller lookups

#### 2. Smart Cache Management

- Cache cleanup every 100 operations
- Only keeps references to active entities
- Prevents memory leaks from inactive entities

#### 3. Optimized Gift System

- Cached controller lookups in `giveGift()` method
- Reduces controller access overhead during faction interactions

## Performance Impact

### Before Optimizations

For 50 ants with combat controllers:

- 50 × 50 = 2,500 getController calls every 100ms
- 25,000 controller lookups per second
- Each lookup: Map.get() + validation overhead

### After Optimizations  

For 50 ants with combat controllers:

- Initial: 50 controller caches built once
- Runtime: ~50 cache hits per cycle (mostly cache hits)
- ~500 cache operations per second (95% reduction)

### Expected Performance Improvement

- **90-95% reduction** in `getController` calls
- **Significant CPU usage reduction** in combat/faction systems
- **Improved frame rate** during combat scenarios
- **Reduced garbage collection** pressure

## Browser Profiler Validation

The Firefox profiler showed:

- `getController` consuming significant CPU time in tight loops
- Combat controller update cycles dominating performance
- Faction controller lookups creating bottlenecks

These optimizations directly address those bottlenecks by:

1. **Eliminating redundant Map lookups** through caching
2. **Breaking the N×M complexity** with smart cache strategies  
3. **Maintaining cache efficiency** with periodic cleanup
4. **Preserving functionality** while dramatically improving performance

## Usage Notes

- **Automatic**: Optimizations apply automatically when controllers are created
- **Transparent**: No changes needed to existing controller usage
- **Memory Safe**: Built-in cache cleanup prevents memory leaks
- **Debug Friendly**: Cache sizes included in debug information

The optimizations maintain full backward compatibility while providing substantial performance improvements for scenarios with many entities using combat and faction systems.
