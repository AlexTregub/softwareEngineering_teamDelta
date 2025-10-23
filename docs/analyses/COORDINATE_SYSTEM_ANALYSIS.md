# Coordinate System Analysis - Root Cause Investigation

## The Problem

The spatial grid cells are visually misaligned with where entities actually appear on screen. This suggests a coordinate system mismatch.

## Systems Involved

### 1. **Terrain System** (Y-axis inverted)
- Location: `Classes/terrainUtils/gridTerrain.js`, `Classes/terrainUtils/grid.js`
- Uses: `g_map2.renderConversion.convCanvasToPos()` and `convPosToCanvas()`
- Coordinate space: **Tile coordinates with Y-axis inverted**
- Y increases **downward** in screen space but **upward** in tile space
- Example: Screen (100, 100) might map to Tile (3.125, -3.125) depending on camera

### 2. **Entity System** (Unknown coordinate space)
- Location: `Classes/containers/Entity.js`, `Classes/ants/ants.js`
- Stores: `posX`, `posY` via collision box and sprite
- Methods: `getPosition()`, `setPosition(x, y)`
- **QUESTION**: Are these screen pixels, world pixels, or tile coordinates?

### 3. **Spatial Grid System** (Uses entity coordinates directly)
- Location: `Classes/systems/SpatialGrid.js`
- Uses: `entity.getX()`, `entity.getY()` directly
- Hashes into cells: `cellX = floor(x / cellSize)`, `cellY = floor(y / cellSize)`
- **CRITICAL**: No coordinate conversion applied

### 4. **Camera System** (Viewport transformation)
- Location: `Classes/controllers/CameraManager.js`
- Transforms: Screen coordinates ↔ World coordinates
- Handles: Pan, zoom, viewport offset
- **Does NOT handle Y-axis inversion** (that's terrain's job)

### 5. **Rendering System**
- Location: `Classes/rendering/RenderLayerManager.js`
- Renders: Entities at their stored positions
- Uses: p5.js coordinate system (origin top-left, Y increases down)

### 6. **CoordinateConverter** (Utility wrapper)
- Location: `Classes/systems/CoordinateConverter.js`
- Provides: `screenToWorld()`, `worldToScreen()`, `screenToWorldTile()`
- **Uses terrain's renderConversion internally**

## Potential Root Causes

### Issue #1: **Entity positions stored in wrong coordinate space**

**Evidence:**
- `antsSpawn()` creates ants at `random(0, 500)` pixel coordinates
- No coordinate conversion applied
- Spatial grid uses these raw values

**Test:**
```javascript
// In console:
const ant = ants[0];
const pos = ant.getPosition();
console.log("Entity pos:", pos);
const tile = mapManager.getTileAtPosition(pos.x, pos.y);
console.log("Tile at entity:", tile);
```

**Expected if correct:** Entity should be on the tile returned
**Expected if broken:** Entity visually on different tile than returned

### Issue #2: **Terrain renderConversion inverts Y twice**

**Flow:**
1. Mouse click at screen (200, 300)
2. `convCanvasToPos([200, 300])` → Tile (6.25, -9.375) ← **Y inverted**
3. Lightning system uses tile coords directly
4. Rendering: Draw at (6.25 * 32, -9.375 * 32) → **(-299 pixels?)**

**This would cause entities to render off-screen**

### Issue #3: **Camera and terrain both transform coordinates**

**Flow:**
1. Entity at world (400, 400)
2. Camera offset: (-100, -100)
3. Screen position: (300, 300) ← **Camera applied**
4. Terrain renders at: `convPosToCanvas([9.375, 9.375])` → **Different position?**

**Result:** Entity and terrain render at different positions

### Issue #4: **Spatial grid uses screen space, terrain uses tile space**

**Current state:**
- Entity stored at: `(400, 400)` screen pixels
- Spatial grid cell: `floor(400/64) = (6, 6)`
- Terrain tile at (400, 400): Converts to tile (12.5, -12.5)
- Terrain's grid cell: **Completely different**

**This explains the misalignment!**

## Coordinate Space Standards (What SHOULD be)

### Option A: **Screen-space entities** (Current approach?)
- Entities store raw canvas pixel coordinates (0,0 = top-left)
- Camera applied when rendering: `drawX = entityX - cameraX`
- Terrain system handles its own inversion internally
- Spatial grid uses screen-space cells
- **Problem**: Entities and terrain tiles don't align

### Option B: **World-space entities** (Camera-adjusted)
- Entities store world coordinates (unlimited range)
- Camera converts: `screenX = worldX - cameraX`
- Terrain also in world space
- Spatial grid uses world-space cells
- **Problem**: Still doesn't handle Y-inversion

### Option C: **Tile-space entities** (Terrain-native)
- Entities store positions in tile coordinates (e.g., 15.5, 12.3)
- Rendering: `screenPos = convPosToCanvas([tileX, tileY])`
- Spatial grid uses tile-space cells
- **Advantage**: Perfect alignment with terrain
- **Disadvantage**: All movement/collision in tile-space

## Current System Behavior

Let's trace an entity from spawn to render:

### Spawn Flow:
```javascript
antsSpawn(1, 'player', 200, 300);
  → px = 200, py = 300  // Raw screen coords
  → new ant(200, 300, ...)
    → Entity constructor stores in collision box
    → this._collisionBox.x = 200
    → this._collisionBox.y = 300
  → spatialGrid.addEntity(ant)
    → key = "3,4" // floor(200/64), floor(300/64)
```

### Render Flow:
```javascript
draw() {
  RenderManager.render()
    → EntityLayerRenderer.render()
      → for each entity:
        → pos = entity.getPosition() // (200, 300)
        → sprite.render() at (200, 300)
        → p5.js draws at screen pixel (200, 300)
}
```

### Terrain Query Flow:
```javascript
mapManager.getTileAtPosition(200, 300)
  → tilePos = g_map2.renderConversion.convCanvasToPos([200, 300])
  → tilePos ≈ [6.25, -9.375]  // Y INVERTED!
  → returns tile at grid coords (6, -9)
```

**THE PROBLEM**: Entity renders at screen (200, 300) but terrain thinks that's tile (6, -9)!

## Solution Approaches

### Solution 1: **Store entities in tile-space**
- Convert all entity positions to tile coordinates on creation
- Spatial grid works in tile-space
- Render: Convert tile → screen using `convPosToCanvas`

**Changes needed:**
- `antsSpawn()`: Convert input coords to tile-space
- `Entity.setPosition()`: Accept and store tile coords
- `Entity.render()`: Convert to screen coords
- `SpatialGrid`: Use tile-space cells (cell size = 2 tiles instead of 64px)

### Solution 2: **Standardize on world-space with manual Y-inversion**
- Keep entities in screen/world pixels
- Apply Y-inversion manually: `invertedY = canvasHeight - y`
- Spatial grid uses inverted coordinates

**Changes needed:**
- `Entity.setPosition()`: Apply Y-inversion before storing
- `Entity.getPosition()`: Return inverted coords
- `SpatialGrid`: Use inverted coordinates

### Solution 3: **Separate logical and visual positions**
- Entities store logical position (tile-space)
- Cache visual position (screen-space) after camera/terrain transform
- Spatial grid uses logical position

**Changes needed:**
- Add `_logicalPosition` and `_visualPosition` to Entity
- Update both when moving
- SpatialGrid queries use logical position

### Solution 4: **Make terrain system NOT invert Y** (Big refactor)
- Remove Y-inversion from terrain's renderConversion
- Update all terrain rendering to use standard Y-down coordinates
- Everything uses screen-space

**Changes needed:**
- Major refactor of terrain system
- Update all terrain-dependent code
- **NOT RECOMMENDED** - too invasive

## Recommended Solution

**Solution 1: Tile-space entities** is the cleanest because:
1. ✅ Entities align perfectly with terrain tiles
2. ✅ Spatial grid cells = terrain tiles (natural alignment)
3. ✅ All game logic in same coordinate space
4. ✅ Rendering is just a view transform
5. ✅ Minimal changes to existing code

## Implementation Plan

1. **Update Entity class**:
   - Add comment: "Position stored in tile coordinates"
   - Keep existing `getPosition()` / `setPosition()` API
   
2. **Update spawn functions**:
   - Convert input coordinates to tile-space
   - `const tilePos = CoordinateConverter.screenToWorldTile(x, y);`
   
3. **Update rendering**:
   - Convert tile position to screen position before rendering
   - `const screenPos = CoordinateConverter.worldTileToScreen(tileX, tileY);`
   
4. **Update SpatialGrid**:
   - Change cell size to tile units (e.g., 2 tiles = 64px worth)
   - Keep using entity positions directly (now in tile-space)

5. **Update movement/pathfinding**:
   - Movement targets already in tile-space (from terrain clicks)
   - No changes needed

6. **Test thoroughly**:
   - Spawn entity at specific tile
   - Verify it appears at correct screen position
   - Verify spatial grid finds it at correct cell
   - Verify terrain queries return correct tile

## Debug Tests to Run

```javascript
// Test 1: Entity-to-tile alignment
const ant = ants[0];
const pos = ant.getPosition();
const tile = CoordinateConverter.worldToTile(pos.x, pos.y);
const tileFromManager = mapManager.getTileAtPosition(pos.x, pos.y);
console.log("Entity pos:", pos);
console.log("Calculated tile:", tile);
console.log("Manager tile:", tileFromManager);
// Should all align

// Test 2: Spatial grid alignment
const cellKey = spatialGrid._getKey(pos.x, pos.y);
const nearby = spatialGrid.queryRadius(pos.x, pos.y, 5);
console.log("Grid cell:", cellKey);
console.log("Nearby entities:", nearby.length);
console.log("Includes self:", nearby.includes(ant));
// Should include the ant

// Test 3: Round-trip coordinate conversion
const screen = { x: 200, y: 300 };
const world = CoordinateConverter.screenToWorld(screen.x, screen.y);
const backToScreen = CoordinateConverter.worldToScreen(world.x, world.y);
console.log("Original:", screen);
console.log("World:", world);
console.log("Back to screen:", backToScreen);
// Should match original

// Test 4: Y-axis inversion verification
const point1 = CoordinateConverter.screenToWorld(100, 100);
const point2 = CoordinateConverter.screenToWorld(100, 200);
console.log("Point at y=100:", point1);
console.log("Point at y=200:", point2);
console.log("Y difference:", point2.y - point1.y);
// If negative, Y is inverted
```

## Next Steps

1. Run debug tests above
2. Determine which coordinate space entities are ACTUALLY in
3. Choose solution approach based on results
4. Implement changes incrementally
5. Update documentation

