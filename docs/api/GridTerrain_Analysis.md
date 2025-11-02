# GridTerrain API Analysis

**File**: `Classes/terrainUtils/gridTerrain.js`  
**Purpose**: Chunk-based sparse terrain storage system with caching  
**Date**: November 2, 2025  
**Part of**: Custom Level Loading - Phase 1.1

---

## Overview

`gridTerrain` is the core terrain system for the game. It implements a **chunk-based sparse storage** architecture where the world is divided into chunks, and each chunk contains a grid of tiles. This provides efficient memory usage and fast rendering for large terrain maps.

### Key Concepts

- **Chunk-based Architecture**: Terrain divided into chunks (default 8x8 tiles per chunk)
- **Sparse Storage**: Only allocated chunks contain tile data, reducing memory overhead
- **Coordinate Systems**: Multiple coordinate spaces for different use cases
- **Caching System**: Off-screen buffer for performance optimization
- **Perlin Noise Generation**: Procedural terrain generation

---

## Architecture

```
GridTerrain (world container)
  └── chunkArray (Grid of Chunks)
        └── Chunk[0,0] (8x8 tiles)
        └── Chunk[0,1] (8x8 tiles)
        └── ...
              └── tileData (Grid of Tiles)
                    └── Tile{type, material}
```

**Storage Pattern**: 2D Grid → 1D rawArray

### Coordinate Systems

GridTerrain uses THREE different coordinate systems:

1. **Array Position** (`[x, y]` from [0,0])
   - Zero-indexed from top-left
   - Used by internal storage
   - Methods: `getArrPos()`, `setArrPos()`

2. **Relative Position** (`[x, y]` from `_tileSpan[0]`)
   - Grid coordinates relative to terrain bounds
   - Respects terrain offset (`_gridSpanTL`)
   - Methods: `get()`, `set()`

3. **World Pixel Position** (`[worldX, worldY]`)
   - Canvas pixel coordinates
   - Converted via `renderConversion`
   - Methods: `renderConversion.convCanvasToPos()`, `convPosToCanvas()`

**CRITICAL**: Y-axis is flipped - higher Y values are at the top of the terrain

---

## Constructor

```javascript
new gridTerrain(gridSizeX, gridSizeY, g_seed, chunkSize=8, tileSize=32, 
                canvasSize=[800,600], generationMode='perlin')
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `gridSizeX` | `int` | **required** | Number of chunks horizontally |
| `gridSizeY` | `int` | **required** | Number of chunks vertically |
| `g_seed` | `int` | **required** | Random seed for terrain generation |
| `chunkSize` | `int` | `8` (CHUNK_SIZE) | Tiles per chunk (8x8 = 64 tiles) |
| `tileSize` | `int` | `32` (TILE_SIZE) | Pixels per tile edge |
| `canvasSize` | `Array` | `[g_canvasX, g_canvasY]` | Canvas dimensions |
| `generationMode` | `String` | `'perlin'` | Terrain algorithm |

### Example

```javascript
// Create 3x3 chunk terrain (24x24 tiles = 768x768 pixels)
const terrain = new gridTerrain(3, 3, 12345);

// Create 5x5 chunk terrain with custom settings
const largeTerrain = new gridTerrain(5, 5, 99999, 16, 64);
```

---

## Properties

### Public Properties

| Property | Type | Description |
|----------|------|-------------|
| `chunkArray` | `Grid` | Grid container of all chunks |
| `renderConversion` | `camRenderConverter` | Coordinate transformation system |

### Private Properties (Documented for Analysis)

| Property | Type | Description |
|----------|------|-------------|
| `_gridSizeX` | `int` | Chunk grid width |
| `_gridSizeY` | `int` | Chunk grid height |
| `_gridChunkCount` | `int` | Total chunks (`_gridSizeX * _gridSizeY`) |
| `_centerChunkX` | `int` | Center chunk X coordinate |
| `_centerChunkY` | `int` | Center chunk Y coordinate |
| `_gridSpanTL` | `[int, int]` | Top-left chunk position in grid coords |
| `_chunkSize` | `int` | Tiles per chunk edge |
| `_tileSize` | `int` | Pixels per tile edge |
| `_seed` | `int` | Random generation seed |
| `_generationMode` | `String` | Generation algorithm (`'perlin'`) |
| `_canvasSize` | `[int, int]` | Canvas dimensions |
| `_tileSpan` | `[[int,int], [int,int]]` | Tile bounds `[TL, BR]` |
| `_tileSpanRange` | `[int, int]` | Tile dimensions `[width, height]` |
| `_gridTileSpan` | `[int, int]` | Total tile span (calculated) |
| `_terrainCache` | `p5.Graphics|null` | Off-screen rendering buffer |
| `_cacheValid` | `bool` | Cache dirty flag |
| `_cacheViewport` | `Object|null` | Cached camera viewport state |
| `_lastCameraPosition` | `[int, int]` | Last camera position for invalidation |

---

## Tile Access Methods

### getArrPos(pos)

Get tile using **array coordinates** (0-indexed from top-left).

```javascript
/**
 * @param {[int, int]} pos - Array position [x, y]
 * @returns {Tile} Tile object {type, material}
 */
const tile = terrain.getArrPos([5, 5]);
console.log(tile.type); // 0=GRASS, 1=WATER, 2=STONE, 3=SAND, 4=DIRT
```

**Use when**: Accessing tiles by flat 2D array indices.

---

### setArrPos(pos, obj)

Set tile using **array coordinates**.

```javascript
/**
 * @param {[int, int]} pos - Array position
 * @param {Tile} obj - Tile object to set
 */
const newTile = { type: 2, material: 'stone' };
terrain.setArrPos([5, 5], newTile);
```

---

### get(relPos)

Get tile using **relative grid coordinates** (indexed from `_tileSpan[0]`).

```javascript
/**
 * @param {[int, int]} relPos - Relative grid position
 * @returns {Tile} Tile object
 */
const tile = terrain.get([0, 0]); // Top-left tile in terrain bounds
```

**Use when**: Working with terrain-relative coordinates.

---

### set(relPos, obj)

Set tile using **relative grid coordinates**.

```javascript
/**
 * @param {[int, int]} relPos - Relative grid position
 * @param {Tile} obj - Tile object to set
 */
const waterTile = { type: 1, material: 'water' };
terrain.set([0, 0], waterTile);
```

---

## Coordinate Conversion Methods

### convArrToAccess(pos)

Convert **array position → chunk + relative tile**.

```javascript
/**
 * @param {[int, int]} pos - Array position
 * @returns {[[int, int], [int, int]]} [chunkPos, tileRelPos]
 */
const result = terrain.convArrToAccess([10, 10]);
// result = [[1, 1], [2, 2]] 
// Chunk [1,1], tile [2,2] within chunk
```

**Algorithm**:
- `chunkX = floor(pos[0] / chunkSize)`
- `chunkY = floor(pos[1] / chunkSize)`
- `relX = pos[0] - chunkX * chunkSize`
- `relY = pos[1] - chunkY * chunkSize`

---

### convRelToAccess(pos)

Convert **relative grid position → chunk + tile**.

```javascript
/**
 * @param {[int, int]} pos - Relative grid position
 * @returns {[[int, int], [int, int]]} [chunkPos, tileRelPos]
 */
const result = terrain.convRelToAccess([5, 5]);
```

**Use when**: Converting terrain-relative coords to chunk/tile access.

---

## Rendering Methods

### render()

Main rendering method with **automatic caching system**.

```javascript
terrain.render();
```

**Behavior**:
1. Check if caching should be used (`_shouldUseCache()`)
2. If cache invalid or viewport changed: regenerate cache
3. Draw cached terrain to canvas
4. Fallback to `renderDirect()` if cache fails

**Performance**: ~10x faster than direct rendering for large terrains.

---

### renderDirect()

Direct tile-by-tile rendering (no cache).

```javascript
terrain.renderDirect();
```

**Use when**: Cache disabled or debugging rendering issues.

---

### setGridToCenter()

Center terrain on canvas.

```javascript
terrain.setGridToCenter();
```

Calls `renderConversion.alignToCanvas()` internally.

---

## Terrain Generation

### randomize(g_seed)

Regenerate terrain with new seed using Perlin noise.

```javascript
/**
 * @param {int} g_seed - Random seed (default: current seed)
 */
terrain.randomize(99999);
```

**Side Effects**:
- Regenerates all chunks
- Invalidates terrain cache (`_cacheValid = false`)

---

## Cache System

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `_terrainCache` | `p5.Graphics|null` | Off-screen rendering buffer |
| `_cacheValid` | `bool` | `true` if cache matches current terrain |
| `_cacheViewport` | `Object|null` | Cached camera viewport state |
| `_lastCameraPosition` | `[int, int]` | Last camera position |

### Cache Invalidation

Cache is automatically invalidated when:
- Terrain data changes (`randomize()`, `set()`, `setArrPos()`)
- Viewport changes (camera zoom, canvas resize)
- Camera moves significantly

### Performance

**Chunk Buffer System**: Dynamic chunk rendering based on zoom level.

```javascript
/**
 * @private
 * @returns {int} Extra chunks to render per direction
 */
_calculateChunkBuffer() {
  const zoomLevel = cameraManager.cameraZoom || 1.0;
  const baseBuffer = 3;
  const dynamicBuffer = Math.floor(baseBuffer / Math.max(0.25, zoomLevel));
  return Math.min(6, Math.max(1, dynamicBuffer));
}
```

**Zoom Levels**:
- Zoomed in (2.0x): Render ±1 chunk
- Default (1.0x): Render ±3 chunks
- Zoomed out (0.5x): Render ±6 chunks

---

## Tile Span and Bounds

### _tileSpan

Terrain bounds in **grid coordinates**.

```javascript
terrain._tileSpan; // [[TL_x, TL_y], [BR_x, BR_y]]
// Example: [[-12, 20], [12, -4]] for 3x3 chunks (24x24 tiles)
```

---

### _tileSpanRange

Terrain dimensions in **tiles**.

```javascript
terrain._tileSpanRange; // [width, height]
// Example: [24, 24] for 3x3 chunks
```

---

## Integration with PathMap

**CRITICAL for Custom Level Loading**: PathMap (A* pathfinding) expects old Terrain class structure.

### Required Properties for PathMap Compatibility

```javascript
// PathMap constructor expects:
terrain._xCount     // Tile count X
terrain._yCount     // Tile count Y
terrain._tileStore  // Flat array of tiles
terrain.conv2dpos() // Convert 2D to flat array index
```

**GridTerrain does NOT have these** - uses chunk-based storage instead.

### Adapter Required

**Solution**: Create `GridTerrainAdapter` to expose PathMap-compatible API.

```javascript
// FUTURE: GridTerrainAdapter
class GridTerrainAdapter {
  constructor(gridTerrain) {
    this._gridTerrain = gridTerrain;
    
    // Expose PathMap-compatible properties
    this._xCount = gridTerrain._tileSpanRange[0];
    this._yCount = gridTerrain._tileSpanRange[1];
    
    // Create virtual flat array view
    this._tileStore = this._generateFlatView();
  }
  
  conv2dpos(x, y) {
    return y * this._xCount + x;
  }
  
  _generateFlatView() {
    // Convert chunk storage to flat array
    const tiles = [];
    for (let y = 0; y < this._yCount; y++) {
      for (let x = 0; x < this._xCount; x++) {
        tiles.push(this._gridTerrain.getArrPos([x, y]));
      }
    }
    return tiles;
  }
}
```

**See**: `docs/roadmaps/CUSTOM_LEVEL_LOADING_CHECKLIST.md` Phase 1.2

---

## Usage Examples

### Creating Terrain

```javascript
// Small terrain for testing
const testTerrain = new gridTerrain(2, 2, 12345);

// Medium game terrain
const gameTerrain = new gridTerrain(5, 5, 54321);

// Large procedural world
const worldTerrain = new gridTerrain(10, 10, 99999, 16, 32);
```

---

### Accessing Tiles

```javascript
const terrain = new gridTerrain(3, 3, 12345);

// Array position (0-indexed)
const tileA = terrain.getArrPos([5, 5]);

// Relative position (terrain bounds)
const tileB = terrain.get([0, 0]);

// Modify tile
const stoneTile = { type: 2, material: 'stone' };
terrain.setArrPos([10, 10], stoneTile);
```

---

### Coordinate Conversion

```javascript
// Array → Chunk/Tile
const access = terrain.convArrToAccess([10, 10]);
// access = [[1, 1], [2, 2]]

// World pixels → Grid
const gridPos = terrain.renderConversion.convCanvasToPos([320, 240]);
// gridPos = [10, 7] (example)

// Grid → World pixels
const worldPos = terrain.renderConversion.convPosToCanvas([10, 7]);
// worldPos = [320, 224] (example)
```

---

### Rendering

```javascript
// Standard rendering with cache
terrain.render();

// Force direct rendering (debugging)
terrain.renderDirect();

// Center on canvas
terrain.setGridToCenter();
```

---

### Regenerating Terrain

```javascript
// Randomize with new seed
terrain.randomize(99999);

// Cache automatically invalidated
console.log(terrain._cacheValid); // false
```

---

## Common Workflows

### 1. Load Custom Level Terrain

```javascript
// Create terrain from level JSON
function loadTerrainFromJSON(levelData) {
  const { gridSizeX, gridSizeY, seed } = levelData.terrain;
  const terrain = new gridTerrain(gridSizeX, gridSizeY, seed);
  
  // Load tile data
  levelData.terrain.tiles.forEach(tileData => {
    terrain.setArrPos([tileData.x, tileData.y], {
      type: tileData.type,
      material: tileData.material
    });
  });
  
  return terrain;
}
```

---

### 2. Export Terrain to JSON

```javascript
function exportTerrainToJSON(terrain) {
  const tiles = [];
  
  for (let y = 0; y < terrain._tileSpanRange[1]; y++) {
    for (let x = 0; x < terrain._tileSpanRange[0]; x++) {
      const tile = terrain.getArrPos([x, y]);
      tiles.push({
        x: x,
        y: y,
        type: tile.type,
        material: tile.material
      });
    }
  }
  
  return {
    terrain: {
      gridSizeX: terrain._gridSizeX,
      gridSizeY: terrain._gridSizeY,
      seed: terrain._seed,
      tiles: tiles
    }
  };
}
```

---

### 3. Query Tile at World Position

```javascript
function getTileAtWorldPos(terrain, worldX, worldY) {
  // Convert world pixels to grid coordinates
  const gridPos = terrain.renderConversion.convCanvasToPos([worldX, worldY]);
  const gridX = Math.floor(gridPos[0]);
  const gridY = Math.floor(gridPos[1]);
  
  // Get tile (use relative position)
  return terrain.get([gridX, gridY]);
}
```

---

## Performance Characteristics

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| **Create terrain** | O(chunks * tiles) | One-time cost |
| **Get tile** | O(1) | Direct chunk→tile lookup |
| **Set tile** | O(1) | Direct access + cache invalidation |
| **Render (cached)** | O(1) | Draws cached buffer |
| **Render (direct)** | O(visible tiles) | Tile-by-tile rendering |
| **Randomize** | O(chunks * tiles) | Full regeneration |

**Memory Usage**:
- **3x3 terrain**: 9 chunks × 64 tiles × ~16 bytes = ~9KB
- **5x5 terrain**: 25 chunks × 64 tiles = ~25KB
- **10x10 terrain**: 100 chunks × 64 tiles = ~100KB

**Cache**: Additional ~1-2MB for off-screen buffer (depends on canvas size)

---

## Related Classes

- **Grid** (`Classes/terrainUtils/grid.js`): 2D grid container with coordinate conversion
- **Chunk** (`Classes/terrainUtils/chunk.js`): 8x8 tile container with generation
- **camRenderConverter** (`Classes/terrainUtils/gridTerrain.js`): Coordinate transformation
- **MapManager** (`Classes/managers/MapManager.js`): Multi-map management, active map switching
- **PathMap** (`Classes/pathfinding/pathfinding.js`): A* pathfinding (requires adapter)

---

## Known Issues

### Y-Axis Boundary Check Bug (Grid.get)

**DO NOT use `Grid.get()` directly** - use `MapManager.getTileAtGridCoords()` instead.

**Problem**: Grid.get() has inverted Y-axis boundary check causing incorrect results.

**Workaround**: Always access tiles through:
- `gridTerrain.get()` (uses internal conversion)
- `MapManager.getTileAtGridCoords()` (safe wrapper)
- `gridTerrain.getArrPos()` (direct array access)

---

## Testing

**Unit Tests**: `test/unit/terrainUtils/GridTerrain.test.js`  
**Integration Tests**: `test/integration/terrain/terrain.integration.test.js`

**Coverage**:
- ✅ Constructor and initialization
- ✅ Coordinate conversion methods
- ✅ Tile access methods (get/set)
- ✅ Chunk-based storage architecture
- ✅ Cache system behavior
- ✅ Terrain generation modes
- ✅ Tile span calculations

---

## Migration Notes

### From Old Terrain Class

```javascript
// OLD (flat array)
const tile = oldTerrain._tileStore[oldTerrain.conv2dpos(x, y)];

// NEW (chunk-based)
const tile = gridTerrain.getArrPos([x, y]);
```

### PathMap Integration

**Current**: PathMap expects old Terrain structure.  
**Required**: Create GridTerrainAdapter (Phase 1.2).

---

## Future Enhancements

- [ ] GridTerrainAdapter for PathMap compatibility
- [ ] Lazy chunk loading (on-demand generation)
- [ ] Chunk serialization/deserialization
- [ ] Multi-threaded terrain generation
- [ ] Biome system integration

---

## References

- **Custom Level Loading Checklist**: `docs/checklists/CUSTOM_LEVEL_LOADING_CHECKLIST.md`
- **PathMap Coupling Analysis**: `docs/api/PathMap_Coupling_Analysis.md` (planned)
- **MapManager API**: `docs/api/MapManager_API.md` (planned)
