# PathMap Coupling Analysis

**File**: `Classes/pathfinding/pathfinding.js`  
**Purpose**: A* pathfinding system with terrain integration  
**Date**: November 2, 2025  
**Part of**: Custom Level Loading - Phase 1.1

---

## Overview

`PathMap` wraps the **old Terrain class structure** to provide A* pathfinding for ant movement. It creates a grid of `Node` objects that store pathfinding state (f, g, h scores) and terrain weight information.

### Critical Problem

**PathMap is tightly coupled to the OLD Terrain class format**, which uses:
- Flat `_tileStore` array
- `_xCount` and `_yCount` properties
- `conv2dpos(x, y)` method

**GridTerrain uses a different structure**:
- Chunk-based sparse storage
- `chunkArray` with nested Grid objects
- `get()` / `getArrPos()` methods

**Result**: PathMap CANNOT directly use GridTerrain without an adapter.

---

## Current PathMap Architecture

### Constructor Dependencies

```javascript
class PathMap {
  constructor(terrain) {
    this._terrain = terrain; // Stores reference to OLD Terrain
    
    // DEPENDENCY 1: _xCount and _yCount
    this._grid = new Grid(
      terrain._xCount,  // ❌ GridTerrain doesn't have this
      terrain._yCount,  // ❌ GridTerrain doesn't have this
      [0,0]
    );
    
    // DEPENDENCY 2: _tileStore and conv2dpos()
    for(let y = 0; y < terrain._yCount; y++) {
      for(let x = 0; x < terrain._xCount; x++) {
        // ❌ GridTerrain doesn't have _tileStore or conv2dpos
        let node = new Node(terrain._tileStore[terrain.conv2dpos(x, y)], x, y);
        this._grid.setArrPos([x, y], node);
      }
    }
    
    // Set neighbors for each node
    for(let y = 0; y < terrain._yCount; y++) {
      for(let x = 0; x < terrain._xCount; x++) {
        let node = this._grid.getArrPos([x,y]);
        node.setNeighbors(this._grid);
      }
    }
  }
}
```

---

## Required Terrain Methods

PathMap expects the terrain object to have:

| Property/Method | Type | Purpose | GridTerrain Equivalent |
|----------------|------|---------|------------------------|
| `_xCount` | `int` | Tile width | `_tileSpanRange[0]` |
| `_yCount` | `int` | Tile height | `_tileSpanRange[1]` |
| `_tileStore[]` | `Array<Tile>` | Flat tile array | N/A (chunk-based) |
| `conv2dpos(x,y)` | `Function` | 2D → flat index | N/A (chunk-based) |

---

## Node Class Structure

```javascript
class Node {
  constructor(terrainTile, x, y) {
    this._terrainTile = terrainTile; // Tile object from terrain
    this._x = x;
    this._y = y;
    
    this.id = `${x}-${y}`;
    this.neighbors = []; // Traversible neighbors
    this.assignWall();
    this.weight = this._terrainTile.getWeight(); // ❗ Depends on Tile.getWeight()
    this.reset();
  }
  
  assignWall() {
    if(this._terrainTile.getWeight() === 100) { // ❗ Hard-coded wall weight
      this.wall = true;
    } else {
      this.wall = false;
    }
  }
  
  // Pathfinding properties
  reset() {
    this.f = 0;
    this.g = 0;
    this.h = 0;
    this.previousStart = null;
    this.previousEnd = null;
  }
}
```

### Node Dependencies on Tile

| Method | Purpose | Tile Requirement |
|--------|---------|------------------|
| `assignWall()` | Check if impassable | `tile.getWeight() === 100` |
| `weight` property | Movement cost | `tile.getWeight()` returns `Number` |

---

## Coordinate System Differences

### Old Terrain (Flat Array)

```javascript
// Flat 1D array storage
_tileStore[index] where index = y * _xCount + x

// Access pattern
const index = terrain.conv2dpos(x, y); // y * _xCount + x
const tile = terrain._tileStore[index];
```

### GridTerrain (Chunk-Based)

```javascript
// Chunk hierarchy
chunkArray[chunkIndex] → Chunk → tileData[tileIndex]

// Access pattern
const tile = gridTerrain.getArrPos([x, y]);
// Internally: finds chunk, then finds tile within chunk
```

---

## Integration Options

### Option A: GridTerrainAdapter (RECOMMENDED)

**Pros**:
- ✅ No PathMap code changes
- ✅ Preserves existing pathfinding logic
- ✅ Easy to test independently
- ✅ Minimal risk of breaking pathfinding

**Cons**:
- ❌ Extra abstraction layer
- ❌ Memory overhead (virtual flat array)

**Implementation**:

```javascript
class GridTerrainAdapter {
  constructor(gridTerrain) {
    this._gridTerrain = gridTerrain;
    
    // Expose OLD Terrain API
    this._xCount = gridTerrain._tileSpanRange[0];
    this._yCount = gridTerrain._tileSpanRange[1];
    
    // Create virtual flat array view
    this._tileStore = this._generateFlatView();
  }
  
  conv2dpos(x, y) {
    return y * this._xCount + x;
  }
  
  _generateFlatView() {
    const tiles = [];
    for (let y = 0; y < this._yCount; y++) {
      for (let x = 0; x < this._xCount; x++) {
        tiles.push(this._gridTerrain.getArrPos([x, y]));
      }
    }
    return tiles;
  }
}

// Usage
const adapter = new GridTerrainAdapter(gridTerrain);
const pathMap = new PathMap(adapter); // Works with existing PathMap!
```

**Memory Cost**: 
- 24x24 terrain: 576 tiles × ~16 bytes = ~9KB (negligible)
- 64x64 terrain: 4096 tiles × ~16 bytes = ~64KB (acceptable)

---

### Option B: Refactor PathMap for GridTerrain

**Pros**:
- ✅ Cleaner long-term architecture
- ✅ No memory overhead
- ✅ Direct chunk access

**Cons**:
- ❌ Requires PathMap rewrite
- ❌ High risk of breaking pathfinding
- ❌ More testing required

**Implementation**:

```javascript
class PathMap {
  constructor(gridTerrain) {
    this._terrain = gridTerrain;
    
    // NEW: Get dimensions from GridTerrain
    const width = gridTerrain._tileSpanRange[0];
    const height = gridTerrain._tileSpanRange[1];
    
    this._grid = new Grid(width, height, [0,0]);
    
    // NEW: Direct chunk access
    for(let y = 0; y < height; y++) {
      for(let x = 0; x < width; x++) {
        const tile = gridTerrain.getArrPos([x, y]); // Direct chunk lookup
        let node = new Node(tile, x, y);
        this._grid.setArrPos([x, y], node);
      }
    }
    
    // Set neighbors (unchanged)
    for(let y = 0; y < height; y++) {
      for(let x = 0; x < width; x++) {
        let node = this._grid.getArrPos([x,y]);
        node.setNeighbors(this._grid);
      }
    }
  }
}
```

**Changes Required**:
1. Replace `terrain._xCount` → `terrain._tileSpanRange[0]`
2. Replace `terrain._yCount` → `terrain._tileSpanRange[1]`
3. Replace `terrain._tileStore[terrain.conv2dpos(x,y)]` → `terrain.getArrPos([x,y])`

**Risk**: Must verify all pathfinding algorithms still work correctly.

---

### Option C: Unified Terrain Interface

**Pros**:
- ✅ Future-proof for multiple terrain systems
- ✅ Enforces consistent API
- ✅ Allows pluggable terrain implementations

**Cons**:
- ❌ Most work upfront
- ❌ Over-engineering for current needs
- ❌ Requires interface definition and implementation

**Implementation**:

```javascript
// Define interface
class ITerrainSystem {
  getTileCount() { throw new Error("Not implemented"); }
  getTileAt(x, y) { throw new Error("Not implemented"); }
}

// GridTerrain implements interface
class GridTerrain extends ITerrainSystem {
  getTileCount() {
    return {
      width: this._tileSpanRange[0],
      height: this._tileSpanRange[1]
    };
  }
  
  getTileAt(x, y) {
    return this.getArrPos([x, y]);
  }
}

// PathMap uses interface
class PathMap {
  constructor(terrainSystem) {
    if (!(terrainSystem instanceof ITerrainSystem)) {
      throw new Error("PathMap requires ITerrainSystem implementation");
    }
    
    const { width, height } = terrainSystem.getTileCount();
    this._grid = new Grid(width, height, [0,0]);
    
    for(let y = 0; y < height; y++) {
      for(let x = 0; x < width; x++) {
        const tile = terrainSystem.getTileAt(x, y);
        let node = new Node(tile, x, y);
        this._grid.setArrPos([x, y], node);
      }
    }
  }
}
```

---

## Tile Weight System

### Current Weight Values

```javascript
// From Node.assignWall()
if (tile.getWeight() === 100) {
  node.wall = true; // Impassable
}

// Weight property
node.weight = tile.getWeight();
```

### Terrain Type Weights (from TERRAIN_TYPES)

```javascript
const TERRAIN_TYPES = {
  GRASS: 0,  // Weight: 1.0 (normal speed)
  WATER: 1,  // Weight: 3.0 (slow movement)
  STONE: 2,  // Weight: Infinity (impassable, but getWeight() returns 100)
  SAND: 3,   // Weight: 1.2 (slightly slow)
  DIRT: 4    // Weight: 1.0 (normal speed)
};
```

**Critical**: PathMap expects `tile.getWeight()` method on ALL tiles.

### Tile Class Requirements

```javascript
class Tile {
  constructor(type, material) {
    this.type = type;       // 0-4 (GRASS, WATER, STONE, SAND, DIRT)
    this.material = material; // String identifier
  }
  
  getWeight() {
    // MUST return Number
    switch(this.type) {
      case 0: return 1.0;   // GRASS
      case 1: return 3.0;   // WATER
      case 2: return 100;   // STONE (impassable)
      case 3: return 1.2;   // SAND
      case 4: return 1.0;   // DIRT
      default: return 1.0;
    }
  }
}
```

---

## A* Algorithm Dependencies

### PathMap Grid Structure

```javascript
pathMap._grid.getArrPos([x, y]) // Returns Node

// Node properties used by A*
node.f  // Total cost (g + h)
node.g  // Distance from start
node.h  // Heuristic to goal
node.neighbors // Array of adjacent Nodes
node.wall // Boolean: is impassable?
node.weight // Movement cost multiplier
```

### Critical for Pathfinding

| Property | Purpose | Source |
|----------|---------|--------|
| `node.weight` | Movement cost | `tile.getWeight()` |
| `node.wall` | Impassability check | `tile.getWeight() === 100` |
| `node.neighbors` | Traversal graph | `setNeighbors()` from Grid |

**Pathfinding will BREAK if**:
- Tile doesn't have `getWeight()` method
- Weight returns non-numeric value
- Grid structure is incorrect

---

## Performance Analysis

### Current PathMap Creation

```javascript
// For 24x24 terrain (576 tiles)
for(let y = 0; y < 24; y++) {
  for(let x = 0; x < 24; x++) {
    // 576 tile lookups
    let tile = terrain._tileStore[terrain.conv2dpos(x, y)];
    let node = new Node(tile, x, y);
  }
}

// 576 neighbor calculations (8 neighbors each)
for(let y = 0; y < 24; y++) {
  for(let x = 0; x < 24; x++) {
    node.setNeighbors(this._grid); // ~4608 neighbor checks
  }
}
```

**Complexity**: O(width × height × neighbors) = O(n²)

### GridTerrainAdapter Performance

```javascript
// One-time cost: Generate flat view
_generateFlatView() {
  for (let y = 0; y < height; y++) {
    for(let x = 0; x < width; x++) {
      tiles.push(gridTerrain.getArrPos([x, y])); // O(1) chunk lookup
    }
  }
}
```

**Complexity**: O(width × height) = O(n)

**Result**: Adapter adds negligible overhead (~1ms for 24x24 terrain).

---

## Recommended Solution: GridTerrainAdapter

### Why Option A?

1. **Preserves Existing Code**: PathMap already works and is battle-tested
2. **Low Risk**: No changes to pathfinding algorithms
3. **Easy Testing**: Adapter can be unit tested independently
4. **Fast Implementation**: ~2-3 hours vs 8-10 hours for Option B
5. **Memory Acceptable**: 9KB-64KB for virtual array (negligible)

### Implementation Plan (Phase 1.2)

```markdown
Phase 1.2: GridTerrainAdapter
- [ ] Write unit tests for GridTerrainAdapter (TDD)
- [ ] Implement adapter with OLD Terrain API
- [ ] Test with existing PathMap
- [ ] Integration tests with ant movement
- [ ] E2E tests with pathfinding
```

---

## Code Examples

### Current Usage (OLD Terrain)

```javascript
// sketch.js initialization
const oldTerrain = new Terrain(24, 24, 12345);
const pathMap = new PathMap(oldTerrain); // Works

// Pathfinding
const path = findPath(startX, startY, endX, endY, pathMap);
```

### Future Usage (GridTerrain + Adapter)

```javascript
// Level loading
const gridTerrain = new gridTerrain(3, 3, 12345); // 24x24 tiles
const adapter = new GridTerrainAdapter(gridTerrain);
const pathMap = new PathMap(adapter); // Works with adapter!

// Pathfinding (unchanged)
const path = findPath(startX, startY, endX, endY, pathMap);
```

---

## Testing Strategy

### Unit Tests (Adapter)

```javascript
describe('GridTerrainAdapter', function() {
  it('should expose _xCount from GridTerrain', function() {
    const terrain = new gridTerrain(3, 3, 12345);
    const adapter = new GridTerrainAdapter(terrain);
    
    expect(adapter._xCount).to.equal(24); // 3 chunks × 8 tiles
  });
  
  it('should provide conv2dpos() method', function() {
    const adapter = new GridTerrainAdapter(terrain);
    const index = adapter.conv2dpos(5, 10);
    
    expect(index).to.equal(10 * 24 + 5); // y * width + x
  });
  
  it('should create flat _tileStore array', function() {
    const adapter = new GridTerrainAdapter(terrain);
    
    expect(adapter._tileStore).to.be.an('array');
    expect(adapter._tileStore.length).to.equal(576); // 24×24
  });
  
  it('should preserve tile data from GridTerrain', function() {
    const terrain = new gridTerrain(3, 3, 12345);
    const originalTile = terrain.getArrPos([5, 10]);
    
    const adapter = new GridTerrainAdapter(terrain);
    const adapterTile = adapter._tileStore[adapter.conv2dpos(5, 10)];
    
    expect(adapterTile).to.deep.equal(originalTile);
  });
});
```

### Integration Tests (PathMap + Adapter)

```javascript
describe('PathMap with GridTerrainAdapter', function() {
  it('should create PathMap from GridTerrain via adapter', function() {
    const terrain = new gridTerrain(3, 3, 12345);
    const adapter = new GridTerrainAdapter(terrain);
    
    const pathMap = new PathMap(adapter);
    
    expect(pathMap._grid).to.exist;
    expect(pathMap._grid.getSize()).to.deep.equal([24, 24]);
  });
  
  it('should generate nodes with correct weights', function() {
    const terrain = new gridTerrain(3, 3, 12345);
    const adapter = new GridTerrainAdapter(terrain);
    const pathMap = new PathMap(adapter);
    
    const node = pathMap._grid.getArrPos([5, 10]);
    
    expect(node).to.exist;
    expect(node.weight).to.be.a('number');
    expect(node._x).to.equal(5);
    expect(node._y).to.equal(10);
  });
  
  it('should set neighbors correctly', function() {
    const terrain = new gridTerrain(3, 3, 12345);
    const adapter = new GridTerrainAdapter(terrain);
    const pathMap = new PathMap(adapter);
    
    const node = pathMap._grid.getArrPos([5, 10]);
    
    expect(node.neighbors).to.be.an('array');
    expect(node.neighbors.length).to.be.greaterThan(0);
  });
});
```

### E2E Tests (Pathfinding)

```javascript
describe('Pathfinding with GridTerrain', function() {
  it('should find path on GridTerrain-based map', function() {
    const terrain = new gridTerrain(3, 3, 12345);
    const adapter = new GridTerrainAdapter(terrain);
    const pathMap = new PathMap(adapter);
    
    const path = findPath(0, 0, 23, 23, pathMap);
    
    expect(path).to.be.an('array');
    expect(path.length).to.be.greaterThan(0);
    expect(path[0]).to.deep.equal({x: 0, y: 0});
    expect(path[path.length - 1]).to.deep.equal({x: 23, y: 23});
  });
});
```

---

## Breaking Changes

### If Choosing Option B or C

**Breaking Changes**:
- PathMap constructor signature changes
- Terrain parameter type changes
- Existing code using `new PathMap(oldTerrain)` breaks

**Migration Required**:
```javascript
// OLD
const pathMap = new PathMap(oldTerrain);

// NEW (Option B)
const pathMap = new PathMap(gridTerrain); // Direct GridTerrain support

// NEW (Option C)
const pathMap = new PathMap(terrainSystem); // Interface-based
```

### If Choosing Option A (Adapter)

**No Breaking Changes**:
- PathMap unchanged
- Existing code still works
- New code uses adapter

```javascript
// OLD code (still works if oldTerrain exists)
const pathMap = new PathMap(oldTerrain);

// NEW code (uses adapter)
const adapter = new GridTerrainAdapter(gridTerrain);
const pathMap = new PathMap(adapter);
```

---

## Related Documentation

- **GridTerrain Analysis**: `docs/api/GridTerrain_Analysis.md`
- **Custom Level Loading**: `docs/checklists/CUSTOM_LEVEL_LOADING_CHECKLIST.md`
- **MapManager API**: `docs/api/MapManager_API.md` (planned)

---

## Decision Matrix

| Criterion | Option A (Adapter) | Option B (Refactor) | Option C (Interface) |
|-----------|-------------------|---------------------|---------------------|
| **Implementation Time** | 2-3 hours | 8-10 hours | 12-15 hours |
| **Risk Level** | LOW | MEDIUM | HIGH |
| **Testing Effort** | LOW | MEDIUM | HIGH |
| **Breaking Changes** | NONE | YES | YES |
| **Memory Overhead** | 9-64KB | NONE | NONE |
| **Future-Proof** | MEDIUM | MEDIUM | HIGH |
| **Code Maintainability** | GOOD | EXCELLENT | EXCELLENT |
| **Recommended** | ✅ **YES** | Maybe later | Future enhancement |

---

## SparseTerrain Compatibility

### Level Editor's Terrain System

**CRITICAL**: The Level Editor uses **SparseTerrain**, not GridTerrain!

```javascript
// SparseTerrain structure (Level Editor)
class SparseTerrain {
  constructor(tileSize = 32, defaultMaterial = 0, options = {}) {
    this.tiles = new Map(); // Map<"x,y", Tile>
    this.tileSize = tileSize;
    this.defaultMaterial = defaultMaterial;
    this.bounds = null; // { minX, maxX, minY, maxY }
    this.MAX_MAP_SIZE = options.maxMapSize || 100;
    
    // Compatibility properties (for TerrainEditor)
    this._tileSize = tileSize;
    this._gridSizeX = this.MAX_MAP_SIZE;
    this._gridSizeY = this.MAX_MAP_SIZE;
    this._chunkSize = 1; // No chunking
  }
  
  getTile(x, y) { return this.tiles.get(`${x},${y}`) || null; }
  setTile(x, y, material) { /* sets tile, updates bounds */ }
  exportToJSON() { /* sparse format - only painted tiles */ }
}
```

### SparseTerrain vs GridTerrain

| Feature | SparseTerrain | GridTerrain |
|---------|--------------|-------------|
| **Storage** | Map<"x,y", Tile> | Chunk hierarchy |
| **Use Case** | Level Editor (sparse painting) | Game runtime (dense worlds) |
| **Memory** | Only painted tiles | Full grid allocated |
| **Bounds** | Dynamic (grows as painted) | Fixed at creation |
| **Chunk Size** | 1 (no chunking) | 8 (8x8 tiles per chunk) |
| **Max Size** | Configurable (100-1000) | Fixed grid size |

### Level Loading Flow

```
Level Editor (SparseTerrain)
  ↓ Export
JSON (sparse format - only painted tiles)
  ↓ Load into game
Convert to GridTerrain OR use directly
  ↓
GridTerrainAdapter OR SparseTerrainAdapter
  ↓
PathMap (works with adapter)
```

### Adapter Strategy for Both Terrain Types

**Option 1: Separate Adapters** (RECOMMENDED)

```javascript
// GridTerrainAdapter (for procedural/dense maps)
class GridTerrainAdapter {
  constructor(gridTerrain) { /* ... */ }
}

// SparseTerrainAdapter (for Level Editor levels)
class SparseTerrainAdapter {
  constructor(sparseTerrain) {
    this._terrain = sparseTerrain;
    
    // Get actual terrain bounds from SparseTerrain
    const bounds = sparseTerrain.bounds || { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    
    // Use actual bounds, not MAX_MAP_SIZE
    this._xCount = (bounds.maxX - bounds.minX) + 1;
    this._yCount = (bounds.maxY - bounds.minY) + 1;
    this._offsetX = bounds.minX;
    this._offsetY = bounds.minY;
    
    // Create virtual flat array from sparse Map
    this._tileStore = this._generateFlatView();
  }
  
  conv2dpos(x, y) {
    // Adjust for offset
    const relX = x - this._offsetX;
    const relY = y - this._offsetY;
    return relY * this._xCount + relX;
  }
  
  _generateFlatView() {
    const tiles = [];
    for (let y = this._offsetY; y < this._offsetY + this._yCount; y++) {
      for (let x = this._offsetX; x < this._offsetX + this._xCount; x++) {
        const tile = this._terrain.getTile(x, y);
        // SparseTerrain returns null for unpainted tiles
        // Need to create default tile
        tiles.push(tile || { material: this._terrain.defaultMaterial, type: 0 });
      }
    }
    return tiles;
  }
}
```

**Option 2: Unified Adapter**

```javascript
// TerrainAdapter (detects type automatically)
class TerrainAdapter {
  constructor(terrain) {
    // Detect terrain type
    if (terrain.tiles instanceof Map) {
      // SparseTerrain
      this._initFromSparseTerrain(terrain);
    } else if (terrain.chunkArray) {
      // GridTerrain
      this._initFromGridTerrain(terrain);
    } else {
      throw new Error("Unknown terrain type");
    }
  }
  
  _initFromSparseTerrain(sparseTerrain) { /* ... */ }
  _initFromGridTerrain(gridTerrain) { /* ... */ }
}
```

### Level JSON Format (SparseTerrain Export)

```json
{
  "version": "1.0",
  "metadata": {
    "tileSize": 32,
    "defaultMaterial": "grass",
    "maxMapSize": 100,
    "bounds": { "minX": 0, "maxX": 24, "minY": 0, "maxY": 24 }
  },
  "tileCount": 156,
  "tiles": [
    { "x": 5, "y": 10, "material": "stone" },
    { "x": 6, "y": 10, "material": "stone" },
    // Only painted tiles (sparse)
  ]
}
```

### Conversion Options

**Option A: Load SparseTerrain directly** (RECOMMENDED for custom levels)
- Use SparseTerrainAdapter
- No conversion needed
- Faster level loading
- Lower memory for sparse levels

**Option B: Convert SparseTerrain → GridTerrain**
- Fill GridTerrain from SparseTerrain tiles
- Use GridTerrainAdapter
- Better for dense levels
- More memory overhead

### Implementation for Custom Levels

```javascript
// Level loading workflow
function loadCustomLevel(levelJSON) {
  // Parse JSON
  const levelData = JSON.parse(levelJSON);
  
  // Detect terrain format
  if (levelData.metadata && levelData.tiles && Array.isArray(levelData.tiles)) {
    // SparseTerrain format (from Level Editor)
    const sparseTerrain = new SparseTerrain();
    sparseTerrain.importFromJSON(levelData);
    
    // Create adapter for PathMap
    const adapter = new SparseTerrainAdapter(sparseTerrain);
    const pathMap = new PathMap(adapter);
    
    // Store terrain
    g_activeMap = sparseTerrain; // or adapter
    
  } else if (levelData.metadata && levelData.metadata.gridSizeX) {
    // GridTerrain format (procedural export)
    const gridTerrain = loadGridTerrainFromJSON(levelData);
    const adapter = new GridTerrainAdapter(gridTerrain);
    const pathMap = new PathMap(adapter);
    
    g_activeMap = gridTerrain;
  }
}
```

---

## Conclusion

**RECOMMENDATION**: **Option A - Separate Adapters**

**Rationale**:
1. Fast implementation (Phase 1.2 can be completed in 1 day)
2. Zero risk to existing pathfinding
3. No breaking changes
4. Easy to test independently
5. Memory overhead negligible for game-sized maps
6. **Handles both GridTerrain AND SparseTerrain** (Level Editor levels)

**Next Steps**:
1. Create `Classes/adapters/GridTerrainAdapter.js` (procedural maps)
2. Create `Classes/adapters/SparseTerrainAdapter.js` (Level Editor levels)
3. Write unit tests (TDD) for both adapters
4. Integration tests with PathMap
5. E2E tests with ant pathfinding
6. Update MapManager to detect terrain type and use correct adapter
