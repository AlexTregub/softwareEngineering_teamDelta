# GridTerrain Tileset Management Tests

## Overview
This test suite (`gridTerrain.tileset.test.js`) defines comprehensive unit tests for terrain loading/unloading and tileset swapping functionality in the gridTerrain system. These tests are written **BEFORE implementing the features** to follow Test-Driven Development (TDD) principles.

## Current Status
- **Total Tests**: 39
- **Passing**: 39 (2 actual tests + 37 placeholder tests)
- **Purpose**: Define the API and expected behavior before implementation

## Test Categories

### 1. Terrain Loading/Unloading (9 tests)
Tests for managing terrain chunk lifecycle:

#### `loadTerrain()`
- ✅ **should load new terrain chunks when terrain is initialized** - IMPLEMENTED
  - Verifies that all chunks are created when terrain initializes
  - Checks that tiles have valid materials assigned
  
- ✅ **should initialize all tiles with valid materials** - IMPLEMENTED
  - Validates all tiles have materials from the allowed set
  
- 📝 **should support reloading terrain with new seed** - TODO
  - Future method: `terrain.reloadTerrain(seed)`
  - Should regenerate terrain with different seed

#### `unloadTerrain()` - TODO
Planned methods for clearing terrain data:
- `terrain.unloadTerrain()` - Clear all chunks
- Should invalidate cache
- Should release graphics buffers

#### `partialLoad()` - Chunk Streaming - TODO
Dynamic chunk loading for large terrains:
- `terrain.loadVisibleChunks()` - Load only visible chunks
- `terrain.updateLoadedChunks()` - Load/unload as camera moves
- Performance optimization for large worlds

### 2. Tileset Swapping (10 tests)
Tests for changing materials without full terrain regeneration:

#### `swapTileset()` - Full Terrain - TODO
Planned API:
```javascript
terrain.swapTileset(fromMaterial, toMaterial, options);
```
Features to implement:
- Swap all instances of one material to another
- Invalidate cache automatically
- Option to preserve or update tile weights
- Example: `terrain.swapTileset('grass', 'sand', { preserveWeights: true })`

#### `swapTilesetInRegion()` - Partial Terrain - TODO
Regional material swapping:
```javascript
terrain.swapTilesetInRegion(from, to, region);
```
- Rectangular regions: `{ x, y, width, height }`
- Circular regions: `{ centerX, centerY, radius }`
- Handle chunk boundary overlaps

#### `applyTilesetMap()` - Pattern-Based - TODO
Advanced material transformations:
```javascript
terrain.applyTilesetMap(materialMap);
terrain.swapTilesetConditional(from, to, conditionFn);
terrain.applyGradientTransition(from, to, options);
```
- Batch material replacements
- Conditional swapping based on neighbors
- Smooth gradient transitions

### 3. Rendering Accuracy (10 tests)
Tests to ensure visual output matches underlying data:

#### `renderAccuracy()` - TODO
Validation methods to implement:
```javascript
const accuracy = terrain.validateRendering();
// Returns: { correct, total, mismatches: [] }

const cacheValid = terrain.validateCache();
// Returns: boolean

const coverage = terrain.checkRenderCoverage();
// Returns: { visibleTiles, renderedTiles, missingTiles: [] }
```

#### `cacheInvalidation()` - TODO
Smart cache management:
```javascript
terrain.setTileMaterial(pos, material); // Auto-invalidates cache
terrain._dirtyRegions; // Track what needs re-render
terrain.updateCache(); // Partial cache updates
```

#### `visualDataConsistency()` - TODO
Prevent visual glitches:
```javascript
terrain.swapTilesetAtomic(from, to); // No intermediate states
terrain.flushRenderQueue(); // Batch updates
terrain.swapTilesetSmooth(from, to, frames); // Animated transitions
```

### 4. Tileset Memory Management (5 tests)
Memory optimization for tilesets:

#### `tilesetPreloading()` - TODO
Lazy loading system:
```javascript
const terrain = new gridTerrain(w, h, seed, size, tileSize, canvas, mode, {
  lazyLoadTilesets: true
});

terrain.loadTileset('desert');
terrain.unloadUnusedTilesets();
gridTerrain.getTilesetCache(); // Static cache shared across instances
```

#### `chunkMemoryManagement()` - TODO
Track and manage memory:
```javascript
terrain.unloadChunk(chunkPos);

const memory = terrain.getMemoryUsage();
// Returns: { tiles, chunks, cache, total }
```

### 5. Advanced Tileset Operations (7 tests)
Advanced rendering features:

#### `tilesetAnimations()` - TODO
Animated tile support:
```javascript
terrain.registerAnimatedTileset('water', {
  frames: ['water_1', 'water_2', 'water_3'],
  frameDuration: 200
});

terrain.updateAnimations(deltaTime);
```

#### `tilesetVariations()` - TODO
Prevent repetitive patterns:
```javascript
terrain.enableTilesetVariations('grass', {
  variations: ['grass_1', 'grass_2', 'grass_3'],
  probability: 0.3
});

terrain.swapTileset('grass', 'sand', { 
  preserveVariations: true 
});
```

#### `proceduralTilesets()` - TODO
Rule-based material assignment:
```javascript
terrain.applyProceduralRules({
  elevation: (x, y) => noise(x * 0.1, y * 0.1),
  moisture: (x, y) => noise(x * 0.15, y * 0.15),
  materialMap: {
    lowElevation_highMoisture: 'water',
    lowElevation_lowMoisture: 'sand',
    highElevation_highMoisture: 'grass',
    highElevation_lowMoisture: 'stone'
  }
});
```

## Implementation Priority

### Phase 1: Core Functionality (High Priority)
1. **swapTileset()** - Basic material swapping
   - Most critical for tileset switching
   - Invalidate cache on swap
   - Update tile weights
   
2. **setTileMaterial()** - Single tile material change
   - Foundation for all swapping operations
   - Auto cache invalidation
   
3. **unloadTerrain()** - Clean terrain shutdown
   - Memory leak prevention
   - Proper resource cleanup

### Phase 2: Performance (Medium Priority)
4. **Partial cache updates** - _dirtyRegions tracking
   - Avoid full cache regeneration
   - Performance boost for local changes
   
5. **swapTilesetInRegion()** - Regional swapping
   - Useful for level editing
   - More efficient than full swaps

### Phase 3: Advanced Features (Lower Priority)
6. **Chunk streaming** - Dynamic loading/unloading
   - Large world support
   - Memory optimization
   
7. **Animated tilesets** - Frame-based tiles
   - Visual polish
   - Water, lava effects
   
8. **Tileset variations** - Pattern breaking
   - Visual variety
   - Organic appearance

## Usage Examples

### Example 1: Simple Tileset Swap
```javascript
const terrain = new gridTerrain(5, 5, 12345);

// Change all grass to sand
terrain.swapTileset('grass', 'sand');

// Cache automatically invalidated and regenerated on next render
terrain.render();
```

### Example 2: Regional Material Change
```javascript
const terrain = new gridTerrain(10, 10, 12345);

// Create a pond in the center
const pondRegion = { centerX: 40, centerY: 40, radius: 10 };
terrain.swapTilesetInCircle('grass', 'water', pondRegion);

// Add sandy beach around pond
const beachRegion = { centerX: 40, centerY: 40, radius: 15 };
terrain.swapTilesetInCircle('grass', 'sand', beachRegion);
```

### Example 3: Procedural Biome Generation
```javascript
const terrain = new gridTerrain(20, 20, 12345);

// Define biome rules
terrain.applyProceduralRules({
  elevation: (x, y) => noise(x * 0.05, y * 0.05),
  moisture: (x, y) => noise(x * 0.08 + 1000, y * 0.08 + 1000),
  
  materialMap: {
    // Water in low elevation areas
    'low_any': 'water',
    
    // Desert in low moisture, medium elevation
    'medium_dry': 'sand',
    
    // Grassland in medium moisture, medium elevation
    'medium_normal': 'grass',
    
    // Forest in high moisture, medium elevation  
    'medium_wet': 'grass',
    
    // Mountains in high elevation
    'high_any': 'stone'
  }
});
```

## Technical Notes

### Cache Invalidation Strategy
When materials change, the terrain cache must be invalidated. Current approach:
- **Full invalidation**: Set `_cacheValid = false`
- **Planned**: Track dirty regions for partial updates
- **Optimization**: Batch multiple changes before cache regeneration

### Tile Weight Management
Different terrain types have different pathfinding weights:
- Grass: 1 (easy to traverse)
- Dirt: 3 (moderate difficulty)
- Stone: 100 (very difficult/impassable)

When swapping materials, weights should be updated unless explicitly preserved.

### Memory Considerations
- Each tile stores: position, material, weight, entities
- Each chunk contains: 8x8 = 64 tiles (default)
- Cache buffer: Full terrain size at current canvas dimensions
- Large terrains (100x100 chunks) need chunk streaming

## Testing Approach

### TDD Workflow
1. Write tests defining desired behavior
2. Run tests (should fail - features not implemented)
3. Implement minimum code to pass tests
4. Refactor while keeping tests green
5. Add more tests for edge cases

### Test Execution
```bash
# Run all tileset tests
npx mocha "test/unit/terrainUtils/gridTerrain.tileset.test.js"

# Run specific test category
npx mocha "test/unit/terrainUtils/gridTerrain.tileset.test.js" --grep "swapTileset"

# Run with coverage
npx c8 mocha "test/unit/terrainUtils/gridTerrain.tileset.test.js"
```

## Next Steps

1. **Review and prioritize** - Determine which features are most critical
2. **Implement Phase 1** - Core tileset swapping functionality
3. **Update tests** - Remove TODO comments as features are implemented
4. **Integration tests** - Test with actual game scenarios
5. **Performance testing** - Benchmark cache regeneration times
6. **Documentation** - Update main docs with new API

## Notes for Implementers

- All TODO methods should invalidate cache when modifying terrain
- Preserve existing terrain generation modes ('perlin', 'columns', etc.)
- Maintain backward compatibility with existing terrain API
- Consider performance - avoid unnecessary full terrain iterations
- Add error handling for invalid materials or positions
- Emit events for terrain changes (useful for debugging/logging)
