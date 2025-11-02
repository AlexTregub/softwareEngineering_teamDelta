# SparseTerrain API Analysis

**File**: `Classes/terrainUtils/SparseTerrain.js`  
**Purpose**: Sparse tile storage for Level Editor (lazy loading)  
**Date**: November 2, 2025  
**Part of**: Custom Level Loading - Phase 1.1

---

## Overview

`SparseTerrain` is a **Map-based sparse tile storage system** designed for the Level Editor. Unlike GridTerrain's chunk-based dense allocation, SparseTerrain only stores painted tiles, making it ideal for large, sparsely populated maps.

### Key Concepts

- **Map<"x,y", Tile> Storage**: Only painted tiles consume memory
- **Dynamic Bounds**: Grows/shrinks as tiles are added/removed
- **Unbounded Coordinates**: Supports negative values and very large values
- **Sparse JSON Export**: Only exports painted tiles, not empty grid
- **Level Editor Integration**: Primary terrain system for custom level creation

---

## Architecture

```
SparseTerrain
  └── tiles: Map<"x,y", Tile>
        ├── "5,10" → { material: "stone" }
        ├── "6,10" → { material: "stone" }
        └── "12,15" → { material: "water" }
  
  └── bounds: { minX: 5, maxX: 12, minY: 10, maxY: 15 }
```

**Storage Pattern**: Sparse Map with string keys, not 2D array

---

## Constructor

```javascript
new SparseTerrain(tileSize = 32, defaultMaterial = 0, options = {})
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `tileSize` | `int` | `32` | Pixels per tile edge |
| `defaultMaterial` | `*` | `0` | Default material for unpainted tiles |
| `options.maxMapSize` | `int` | `100` | Maximum map dimensions (10-1000) |

### Example

```javascript
// Default configuration
const terrain = new SparseTerrain(); // 32px tiles, 100x100 max

// Custom configuration
const largeTerrain = new SparseTerrain(32, 'grass', { maxMapSize: 250 });
```

---

## Properties

### Public Properties

| Property | Type | Description |
|----------|------|-------------|
| `tiles` | `Map<string, Tile>` | Sparse tile storage (key: "x,y") |
| `tileSize` | `int` | Pixels per tile |
| `defaultMaterial` | `*` | Default material |
| `bounds` | `Object|null` | `{minX, maxX, minY, maxY}` or null if empty |
| `MAX_MAP_SIZE` | `int` | Maximum width/height (10-1000) |

### Compatibility Properties (for TerrainEditor)

| Property | Type | Description |
|----------|------|-------------|
| `_tileSize` | `int` | Alias for tileSize |
| `_gridSizeX` | `int` | Equals MAX_MAP_SIZE |
| `_gridSizeY` | `int` | Equals MAX_MAP_SIZE |
| `_chunkSize` | `int` | Always 1 (no chunking) |

---

## Tile Access Methods

### setTile(x, y, material)

Set a tile at grid coordinates. Creates simple tile object `{ material }`.

```javascript
/**
 * @param {number} x - Grid X coordinate (can be negative)
 * @param {number} y - Grid Y coordinate (can be negative)
 * @param {*} material - Material type (string, number, or object)
 * @returns {boolean} True if set, false if rejected (size limit)
 */
const success = terrain.setTile(5, 10, 'stone');
```

**Behavior**:
- Updates bounds to include new tile
- Rejects tile if would exceed MAX_MAP_SIZE
- Overwrites existing tile at same position

---

### getTile(x, y)

Get a tile at grid coordinates.

```javascript
/**
 * @param {number} x - Grid X coordinate
 * @param {number} y - Grid Y coordinate
 * @returns {Object|null} Tile object { material } or null if unpainted
 */
const tile = terrain.getTile(5, 10);
if (tile) {
  console.log(tile.material); // "stone"
}
```

**Returns null** for unpainted tiles (not a default tile).

---

### deleteTile(x, y)

Delete a tile at grid coordinates. Recalculates bounds.

```javascript
/**
 * @param {number} x - Grid X coordinate
 * @param {number} y - Grid Y coordinate
 * @returns {boolean} True if deleted, false if didn't exist
 */
const deleted = terrain.deleteTile(5, 10);
```

**Side Effects**:
- Removes tile from Map
- Recalculates bounds (expensive for large maps)

---

## Bounds Management

### getBounds()

Get current terrain bounds (grows/shrinks with tiles).

```javascript
/**
 * @returns {Object|null} { minX, maxX, minY, maxY } or null if empty
 */
const bounds = terrain.getBounds();
if (bounds) {
  const width = bounds.maxX - bounds.minX + 1;
  const height = bounds.maxY - bounds.minY + 1;
}
```

---

### getTileCount()

Get total number of painted tiles.

```javascript
/**
 * @returns {number} Tile count
 */
const count = terrain.getTileCount(); // tiles.size
```

---

### isEmpty()

Check if terrain has any tiles.

```javascript
/**
 * @returns {boolean} True if no tiles
 */
if (terrain.isEmpty()) {
  console.log("No tiles painted");
}
```

---

### clear()

Remove all tiles and reset bounds.

```javascript
terrain.clear();
console.log(terrain.getTileCount()); // 0
console.log(terrain.getBounds()); // null
```

---

## JSON Import/Export

### exportToJSON()

Export terrain to JSON (sparse format - only painted tiles).

```javascript
/**
 * @returns {Object} JSON object with metadata and sparse tile data
 */
const json = terrain.exportToJSON();
```

**Output Format**:
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
    { "x": 6, "y": 10, "material": "stone" }
  ]
}
```

---

### importFromJSON(json)

Import terrain from JSON (restores tiles and metadata).

```javascript
/**
 * @param {Object|string} json - JSON object or JSON string
 */
terrain.importFromJSON(jsonData);
```

**Behavior**:
- Clears existing data
- Restores tileSize, defaultMaterial, maxMapSize
- Re-creates all tiles (bounds auto-calculated)

---

## Iteration Methods

### getAllTiles()

Get all tile coordinates (generator for memory efficiency).

```javascript
/**
 * @returns {Generator<{x, y, material}>} Yields each tile
 */
for (const { x, y, material } of terrain.getAllTiles()) {
  console.log(`Tile at (${x}, ${y}): ${material}`);
}
```

---

## SparseTerrain vs GridTerrain

### Comparison

| Feature | SparseTerrain | GridTerrain |
|---------|--------------|-------------|
| **Storage** | Map<"x,y", Tile> | Chunk hierarchy (Grid of Grids) |
| **Use Case** | Level Editor (sparse painting) | Game runtime (dense worlds) |
| **Memory** | Only painted tiles (~16 bytes/tile) | Full grid allocated |
| **Access Time** | O(1) Map lookup | O(1) chunk→tile lookup |
| **Bounds** | Dynamic (grows as painted) | Fixed at creation |
| **Chunk Size** | 1 (no chunking) | 8 (8x8 tiles per chunk) |
| **Max Size** | Configurable (100-1000 tiles) | Fixed grid size |
| **Export Format** | Sparse (only painted) | Full grid or compressed |
| **Negative Coords** | ✅ Supported | ❌ Not supported |
| **Unbounded** | ✅ Yes (up to MAX_MAP_SIZE) | ❌ Fixed size |

### When to Use

**SparseTerrain**:
- ✅ Level Editor (user painting tiles)
- ✅ Large maps with sparse coverage
- ✅ Custom levels (exported to JSON)
- ✅ Memory-constrained environments

**GridTerrain**:
- ✅ Procedurally generated dense worlds
- ✅ Runtime game terrain
- ✅ Perlin noise generation
- ✅ Performance-critical rendering

---

## PathMap Integration

### Problem

**PathMap expects OLD Terrain API**:
- `_xCount`, `_yCount` properties
- `_tileStore[]` flat array
- `conv2dpos(x, y)` method

**SparseTerrain has**:
- `tiles` Map (not array)
- `bounds` (dynamic, not fixed size)
- `getTile(x, y)` method (not flat array)

### Solution: SparseTerrainAdapter

```javascript
class SparseTerrainAdapter {
  constructor(sparseTerrain) {
    this._terrain = sparseTerrain;
    
    // Get actual bounds
    const bounds = sparseTerrain.bounds || { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    
    // Calculate dimensions from bounds
    this._xCount = (bounds.maxX - bounds.minX) + 1;
    this._yCount = (bounds.maxY - bounds.minY) + 1;
    this._offsetX = bounds.minX;
    this._offsetY = bounds.minY;
    
    // Generate flat array view
    this._tileStore = this._generateFlatView();
  }
  
  conv2dpos(x, y) {
    const relX = x - this._offsetX;
    const relY = y - this._offsetY;
    return relY * this._xCount + relX;
  }
  
  _generateFlatView() {
    const tiles = [];
    for (let y = this._offsetY; y < this._offsetY + this._yCount; y++) {
      for (let x = this._offsetX; x < this._offsetX + this._xCount; x++) {
        const tile = this._terrain.getTile(x, y);
        // Create default tile for unpainted cells
        tiles.push(tile || { 
          material: this._terrain.defaultMaterial,
          type: 0,
          getWeight: () => 1.0 // Default weight
        });
      }
    }
    return tiles;
  }
}

// Usage
const adapter = new SparseTerrainAdapter(sparseTerrain);
const pathMap = new PathMap(adapter); // Works!
```

---

## Usage Examples

### Creating Terrain

```javascript
// Default (100x100 max)
const terrain = new SparseTerrain();

// Large map (250x250)
const largeTerrain = new SparseTerrain(32, 'grass', { maxMapSize: 250 });

// Custom tile size
const bigTiles = new SparseTerrain(64, 'dirt', { maxMapSize: 100 });
```

---

### Painting Tiles

```javascript
const terrain = new SparseTerrain();

// Paint tiles
terrain.setTile(5, 10, 'stone');
terrain.setTile(6, 10, 'stone');
terrain.setTile(5, 11, 'water');

console.log(terrain.getTileCount()); // 3
console.log(terrain.getBounds()); 
// { minX: 5, maxX: 6, minY: 10, maxY: 11 }
```

---

### Querying Tiles

```javascript
// Check specific tile
const tile = terrain.getTile(5, 10);
if (tile) {
  console.log(tile.material); // "stone"
}

// Check unpainted tile
const empty = terrain.getTile(100, 100);
console.log(empty); // null
```

---

### Iterating Tiles

```javascript
// Iterate only painted tiles
for (const { x, y, material } of terrain.getAllTiles()) {
  console.log(`(${x}, ${y}): ${material}`);
}

// Sparse - only 3 iterations for 3 painted tiles
// (not 10,000 iterations for 100x100 grid)
```

---

### Export/Import

```javascript
// Export to JSON
const json = terrain.exportToJSON();
const jsonString = JSON.stringify(json);
localStorage.setItem('myLevel', jsonString);

// Import from JSON
const loaded = new SparseTerrain();
loaded.importFromJSON(JSON.parse(jsonString));

console.log(loaded.getTileCount()); // Same as original
console.log(loaded.getBounds()); // Same as original
```

---

### Size Limit Handling

```javascript
const terrain = new SparseTerrain(32, 'grass', { maxMapSize: 50 });

// Try to paint far away (would exceed 50x50)
const success = terrain.setTile(100, 100, 'stone');
console.log(success); // false (rejected)

// Paint within bounds
const success2 = terrain.setTile(25, 25, 'stone');
console.log(success2); // true
```

---

## Common Workflows

### 1. Level Editor Painting

```javascript
// User clicks at world position
function onCanvasClick(worldX, worldY) {
  const gridX = Math.floor(worldX / terrain.tileSize);
  const gridY = Math.floor(worldY / terrain.tileSize);
  
  const success = terrain.setTile(gridX, gridY, selectedMaterial);
  
  if (!success) {
    showNotification("Map size limit reached!");
  }
}
```

---

### 2. Save Custom Level

```javascript
function saveLevel(levelName) {
  const levelData = {
    name: levelName,
    terrain: terrain.exportToJSON(),
    entities: [], // Entity spawn data
    metadata: {
      author: "Player",
      createdDate: new Date().toISOString()
    }
  };
  
  const jsonString = JSON.stringify(levelData, null, 2);
  localStorage.setItem(`level_${levelName}`, jsonString);
}
```

---

### 3. Load Custom Level (for gameplay)

```javascript
function loadCustomLevel(levelName) {
  const jsonString = localStorage.getItem(`level_${levelName}`);
  const levelData = JSON.parse(jsonString);
  
  // Create SparseTerrain from level JSON
  const terrain = new SparseTerrain();
  terrain.importFromJSON(levelData.terrain);
  
  // Create adapter for PathMap
  const adapter = new SparseTerrainAdapter(terrain);
  const pathMap = new PathMap(adapter);
  
  // Set as active map
  g_activeMap = terrain;
  g_pathMap = pathMap;
  
  // Spawn entities
  spawnEntitiesFromLevel(levelData.entities);
}
```

---

## Performance Characteristics

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| **setTile** | O(1) | Map set, bounds update O(1) |
| **getTile** | O(1) | Map lookup |
| **deleteTile** | O(n) | Recalculates bounds from all tiles |
| **getBounds** | O(1) | Cached bounds |
| **getTileCount** | O(1) | Map.size |
| **clear** | O(1) | Map.clear() |
| **exportToJSON** | O(n) | Iterate all tiles |
| **importFromJSON** | O(n) | Set each tile |
| **getAllTiles** | O(n) | Generator (memory efficient) |

**Memory Usage**:
- **Empty**: ~1KB (base object)
- **100 tiles**: ~1KB + (100 × ~16 bytes) = ~2.6KB
- **1000 tiles**: ~1KB + (1000 × ~16 bytes) = ~16KB
- **10000 tiles**: ~1KB + (10000 × ~16 bytes) = ~157KB

**Comparison** (100x100 = 10,000 tiles):
- **SparseTerrain (10% painted)**: ~17KB (1000 tiles)
- **GridTerrain (full allocation)**: ~160KB (10,000 tiles)
- **Savings**: ~90% memory for sparse maps

---

## Related Classes

- **GridTerrain** (`Classes/terrainUtils/gridTerrain.js`): Dense chunk-based terrain
- **TerrainEditor** (`Classes/terrainUtils/TerrainEditor.js`): Painting tools
- **TerrainImporter** (`Classes/terrainUtils/TerrainImporter.js`): Import from JSON
- **TerrainExporter** (`Classes/terrainUtils/TerrainExporter.js`): Export to JSON

---

## Known Issues

### Tile Object Format

SparseTerrain tiles are simple objects: `{ material }`

**PathMap expects tiles with**:
- `getWeight()` method → Movement cost
- `type` property → Terrain type (0=GRASS, 1=WATER, etc.)

**Solution**: Adapter must create compatible tile objects for unpainted cells.

---

## Testing

**Unit Tests**: `test/unit/terrainUtils/SparseTerrain.test.js` (48 tests)  
**Integration Tests**: `test/integration/terrain/terrain.integration.test.js`

**Coverage**:
- ✅ Tile set/get/delete operations
- ✅ Bounds tracking and recalculation
- ✅ Size limit enforcement
- ✅ JSON export/import
- ✅ Sparse iteration
- ✅ Custom maxMapSize configuration

---

## Migration Notes

### From GridTerrain to SparseTerrain

**Not Recommended** - Different use cases. SparseTerrain for Level Editor, GridTerrain for game runtime.

### From SparseTerrain to GridTerrain

```javascript
// Convert sparse to dense (for runtime)
function convertToGridTerrain(sparseTerrain) {
  const bounds = sparseTerrain.getBounds();
  if (!bounds) return null;
  
  const width = bounds.maxX - bounds.minX + 1;
  const height = bounds.maxY - bounds.minY + 1;
  
  // Create GridTerrain (chunk-based)
  const chunkSizeX = Math.ceil(width / 8);
  const chunkSizeY = Math.ceil(height / 8);
  const gridTerrain = new gridTerrain(chunkSizeX, chunkSizeY, 12345);
  
  // Copy tiles
  for (const { x, y, material } of sparseTerrain.getAllTiles()) {
    const adjustedX = x - bounds.minX;
    const adjustedY = y - bounds.minY;
    gridTerrain.setArrPos([adjustedX, adjustedY], { 
      material: material,
      type: materialToType(material)
    });
  }
  
  return gridTerrain;
}
```

---

## References

- **Custom Level Loading Checklist**: `docs/checklists/CUSTOM_LEVEL_LOADING_CHECKLIST.md`
- **PathMap Coupling Analysis**: `docs/api/PathMap_Coupling_Analysis.md`
- **GridTerrain Analysis**: `docs/api/GridTerrain_Analysis.md`
- **Level Editor Roadmap**: `docs/checklists/roadmaps/LEVEL_EDITOR_ROADMAP.md`
