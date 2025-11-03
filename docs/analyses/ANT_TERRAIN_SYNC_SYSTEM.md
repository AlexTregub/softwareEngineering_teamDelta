# Ant-Terrain Synchronization System - Complete Documentation

**Date**: October 19, 2025  
**Purpose**: How ants (entities) sync to the terrain grid coordinate system

---

## System Overview

Ants are **NOT directly tied to terrain tiles**. Instead, they use a **coordinate conversion system** that translates between:
1. **Pixel coordinates** (entity world position)
2. **Tile coordinates** (grid position)
3. **Screen coordinates** (rendered position with camera)

This allows smooth pixel-perfect movement while maintaining awareness of which tile they're on.

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Entity System (Ants)                          │
│ - Position stored in pixels (e.g., x=1024, y=512)      │
│ - Movement in pixels (smooth interpolation)             │
└────────────────┬────────────────────────────────────────┘
                 │ Coordinate Conversion
                 ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 2: Coordinate System (camRenderConverter)        │
│ - Converts: Pixels ↔ Tiles ↔ Screen                   │
│ - Handles camera offset and zoom                        │
└────────────────┬────────────────────────────────────────┘
                 │ Grid Lookup
                 ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 3: Terrain System (gridTerrain)                  │
│ - Grid of tiles (20x20 chunks, 8x8 tiles per chunk)   │
│ - Tile materials (grass, dirt, stone, moss)            │
└─────────────────────────────────────────────────────────┘
```

---

## Key Systems

### 1. **Entity Position Storage**

**Location**: `Classes/ants/ants.js`, `Classes/containers/Entity.js`

Entities store position in **pixel coordinates**:

```javascript
// Ant class
class ant {
  constructor(posX = 0, posY = 0, ...) {
    this._stats.position.statValue.x = posX;  // Pixel position
    this._stats.position.statValue.y = posY;
    this._sprite.pos.x = posX;
    this._sprite.pos.y = posY;
  }
  
  // Position in pixels, NOT tiles
  get posX() { return this._stats.position.statValue.x; }
  get posY() { return this._stats.position.statValue.y; }
}
```

**Key Points**:
- Position is in **world pixels**, not tile indices
- Allows sub-tile positioning (e.g., `x=1024.5` for smooth movement)
- Independent of terrain grid - can move freely

---

### 2. **Coordinate Conversion System**

**Location**: `Classes/terrainUtils/gridTerrain.js` (class `camRenderConverter`)

#### A. **Pixel Position → Tile Position**

```javascript
// Convert pixel position to tile coordinates
const tileX = pixelX / TILE_SIZE;  // e.g., 1024px / 32 = tile 32
const tileY = pixelY / TILE_SIZE;  // e.g., 512px / 32 = tile 16
```

**Simple formula**: Divide pixel position by tile size (32px)

#### B. **Tile Position → Screen Position** (Camera-aware)

```javascript
class camRenderConverter {
  convPosToCanvas(tilePos) {
    // Converts tile coordinates to screen pixels
    return [
      (tilePos[0] - this._camPosition[0]) * this._tileSize + this._canvasCenter[0],
      -1 * (tilePos[1] - this._camPosition[1]) * this._tileSize + this._canvasCenter[1]
    ];
  }
}
```

**Formula Breakdown**:
```
screenX = (tileX - cameraX) * tileSize + canvasWidth/2
screenY = -(tileY - cameraY) * tileSize + canvasHeight/2
```

**Note**: Y-axis is inverted (`-1 *`) to convert math coordinates (+Y up) to screen coordinates (+Y down)

#### C. **Screen Position → Tile Position** (Camera-aware)

```javascript
convCanvasToPos(screenPos) {
  // Converts screen pixels to tile coordinates
  return [
    (screenPos[0] - this._canvasCenter[0]) / this._tileSize + this._camPosition[0],
    (screenPos[1] - this._canvasCenter[1]) / -this._tileSize + this._camPosition[1]
  ];
}
```

---

### 3. **Sprite Rendering with Terrain Sync**

**Location**: `Classes/rendering/Sprite2d.js`

The sprite rendering system automatically syncs with terrain coordinates:

```javascript
class Sprite2D {
  render() {
    // Entity position in pixels
    let screenX = this.pos.x + this.size.x / 2;
    let screenY = this.pos.y + this.size.y / 2;
    
    // CRITICAL: Sync with terrain's coordinate system
    if (typeof g_map2 !== 'undefined' && g_map2 && g_map2.renderConversion) {
      // Step 1: Convert pixel position to tile position
      const tileX = this.pos.x / TILE_SIZE;
      const tileY = this.pos.y / TILE_SIZE;
      
      // Step 2: Use terrain's converter to get screen position
      const screenPos = g_map2.renderConversion.convPosToCanvas([tileX, tileY]);
      screenX = screenPos[0] + this.size.x / 2;
      screenY = screenPos[1] + this.size.y / 2;
    }
    
    // Render at calculated screen position
    push();
    translate(screenX, screenY);
    image(this.img, 0, 0, this.size.x, this.size.y);
    pop();
  }
}
```

**This is THE KEY SYNC MECHANISM!**

Every time an ant renders:
1. Takes ant's pixel position (`this.pos.x`, `this.pos.y`)
2. Converts to tile coordinates (`tileX`, `tileY`)
3. Uses terrain's `renderConversion.convPosToCanvas()` to get screen position
4. Renders at screen position

**Result**: Ant moves with terrain when camera pans/zooms

---

### 4. **Terrain Detection (Which Tile Is Ant On?)**

**Location**: `Classes/controllers/TerrainController.js`

```javascript
class TerrainController {
  detectTerrain() {
    // Get entity position in pixels
    const pos = this._getEntityPosition();
    
    // Convert to tile coordinates
    const tileSize = window.tileSize || 32;
    const tileX = Math.floor(pos.x / tileSize);
    const tileY = Math.floor(pos.y / tileSize);
    
    // Get tile from grid
    const grid = g_gridMap.getGrid();
    const tile = grid?.getArrPos([tileX, tileY]);
    
    // Return terrain type
    return tile ? this._mapTerrainType(tile._terrainTile) : "DEFAULT";
  }
}
```

**Conversion Steps**:
1. Get entity position in **pixels**: `pos.x`, `pos.y`
2. Convert to **tile indices**: `Math.floor(pos.x / 32)`, `Math.floor(pos.y / 32)`
3. Look up tile in grid: `grid.getArrPos([tileX, tileY])`
4. Get tile properties (material, weight, etc.)

---

### 5. **Pathfinding Integration**

**Location**: `Classes/ants/ants.js` (functions `moveSelectedAntToTile`, `moveSelectedAntsToTile`)

```javascript
function moveSelectedAntToTile(mx, my, tileSize) {
  // Step 1: Convert mouse click to tile coordinates
  const tileX = Math.floor(mx / tileSize);
  const tileY = Math.floor(my / tileSize);
  
  // Step 2: Convert ant position to tile coordinates
  const antX = Math.floor(selectedAnt.posX / tileSize);
  const antY = Math.floor(selectedAnt.posY / tileSize);
  
  // Step 3: Get tiles from pathfinding grid
  const grid = GRIDMAP.getGrid();
  const startTile = grid.getArrPos([antX, antY]);
  const endTile = grid.getArrPos([tileX, tileY]);
  
  // Step 4: Find path
  const newPath = findPath(startTile, endTile, GRIDMAP);
  selectedAnt.setPath(newPath);
}
```

**In ant update loop**:

```javascript
class ant {
  update() {
    if (this._path && this.path.length > 0) {
      const nextNode = this._path.shift();
      
      // Convert tile coordinates back to pixel coordinates
      const targetX = nextNode._x * tileSize;
      const targetY = nextNode._y * tileSize;
      
      this.moveToLocation(targetX, targetY);
    }
  }
}
```

---

## How to Reproduce the Sync

### API Calls Needed

#### 1. **Create an Ant at Specific Tile**

```javascript
// Create ant at tile (10, 10)
const tileX = 10;
const tileY = 10;
const TILE_SIZE = 32;

// Convert tile to pixel position
const pixelX = tileX * TILE_SIZE;  // 320 pixels
const pixelY = tileY * TILE_SIZE;  // 320 pixels

// Create ant at pixel position
const myAnt = new ant(pixelX, pixelY, 32, 32, 1.0, 0, antImg1);
```

#### 2. **Get Which Tile an Ant Is On**

```javascript
// Method A: Direct calculation
const TILE_SIZE = 32;
const antTileX = Math.floor(myAnt.posX / TILE_SIZE);
const antTileY = Math.floor(myAnt.posY / TILE_SIZE);

console.log(`Ant is on tile (${antTileX}, ${antTileY})`);

// Method B: Using TerrainController (if entity-based)
if (entity._terrainController) {
  const terrain = entity._terrainController.detectTerrain();
  console.log(`Ant is on terrain: ${terrain}`);
}
```

#### 3. **Move Ant to Specific Tile**

```javascript
// Move ant to tile (20, 15)
const targetTileX = 20;
const targetTileY = 15;

// Convert to pixel position
const targetPixelX = targetTileX * TILE_SIZE;
const targetPixelY = targetTileY * TILE_SIZE;

// Use ant's movement system
myAnt.moveToLocation(targetPixelX, targetPixelY);
```

#### 4. **Get Tile Under Mouse Click**

```javascript
function mousePressed() {
  const TILE_SIZE = 32;
  
  // Convert mouse position to tile coordinates
  const clickedTileX = Math.floor(mouseX / TILE_SIZE);
  const clickedTileY = Math.floor(mouseY / TILE_SIZE);
  
  console.log(`Clicked tile (${clickedTileX}, ${clickedTileY})`);
  
  // Get tile data from grid
  if (g_gridMap) {
    const grid = g_gridMap.getGrid();
    const tile = grid.getArrPos([clickedTileX, clickedTileY]);
    console.log(`Tile material: ${tile?._terrainTile?.getMaterial()}`);
  }
}
```

#### 5. **Sync Entity with Terrain Camera** (Automatic)

```javascript
// This happens automatically in Sprite2D.render()
// But here's how to manually sync:

function getEntityScreenPosition(entity) {
  // Get pixel position
  const pixelX = entity.posX;
  const pixelY = entity.posY;
  
  // Convert to tile position
  const tileX = pixelX / TILE_SIZE;
  const tileY = pixelY / TILE_SIZE;
  
  // Use terrain's coordinate converter
  if (g_map2 && g_map2.renderConversion) {
    const screenPos = g_map2.renderConversion.convPosToCanvas([tileX, tileY]);
    return {
      x: screenPos[0],
      y: screenPos[1]
    };
  }
  
  // Fallback: no camera transform
  return { x: pixelX, y: pixelY };
}
```

---

## Global Variables Used

```javascript
// Terrain System
g_map2                    // gridTerrain instance (new system)
g_map2.renderConversion   // camRenderConverter for coordinate transforms

// Legacy Terrain System
MAP                       // Terrain instance (old system)
GRIDMAP                   // PathMap instance for pathfinding
COORDSY                   // CoordinateSystem instance (deprecated converter)

// Configuration
TILE_SIZE                 // Tile size in pixels (default: 32)
CHUNK_SIZE                // Chunk size in tiles
g_canvasX                 // Canvas width
g_canvasY                 // Canvas height
```

---

## Conversion Cheat Sheet

| From | To | Formula | Example |
|------|----|---------| --------|
| Pixel → Tile | World pixel → Tile index | `tileX = Math.floor(pixelX / TILE_SIZE)` | `1024px / 32 = tile 32` |
| Tile → Pixel | Tile index → World pixel | `pixelX = tileX * TILE_SIZE` | `tile 32 * 32 = 1024px` |
| Tile → Screen | Tile index → Screen pixel | `g_map2.renderConversion.convPosToCanvas([tileX, tileY])` | Camera-aware |
| Screen → Tile | Screen pixel → Tile index | `g_map2.renderConversion.convCanvasToPos([screenX, screenY])` | Camera-aware |
| Pixel → Screen | World pixel → Screen pixel | Convert via Tile (Pixel → Tile → Screen) | Two-step process |

---

## Common Patterns

### Pattern 1: Spawn Ant at Random Tile

```javascript
function spawnAntAtRandomTile() {
  const TILE_SIZE = 32;
  const gridWidth = 160;   // 20 chunks * 8 tiles
  const gridHeight = 160;
  
  // Random tile
  const tileX = Math.floor(Math.random() * gridWidth);
  const tileY = Math.floor(Math.random() * gridHeight);
  
  // Convert to pixels
  const pixelX = tileX * TILE_SIZE;
  const pixelY = tileY * TILE_SIZE;
  
  // Spawn ant
  const newAnt = new ant(pixelX, pixelY, 32, 32, 1.0, 0, antImg1);
  ants.push(newAnt);
}
```

### Pattern 2: Highlight Tile Under Ant

```javascript
function highlightAntTile(ant) {
  const TILE_SIZE = 32;
  const antTileX = Math.floor(ant.posX / TILE_SIZE);
  const antTileY = Math.floor(ant.posY / TILE_SIZE);
  
  // Get screen position of tile
  const screenPos = g_map2.renderConversion.convPosToCanvas([antTileX, antTileY]);
  
  // Draw highlight
  fill(0, 255, 0, 80);
  noStroke();
  rect(screenPos[0], screenPos[1], TILE_SIZE, TILE_SIZE);
}
```

### Pattern 3: Check If Ant Is On Specific Material

```javascript
function isAntOnGrass(ant) {
  const TILE_SIZE = 32;
  const tileX = Math.floor(ant.posX / TILE_SIZE);
  const tileY = Math.floor(ant.posY / TILE_SIZE);
  
  const grid = g_gridMap.getGrid();
  const tile = grid?.getArrPos([tileX, tileY]);
  
  return tile?._terrainTile?.getMaterial() === 'grass';
}
```

---

## Debugging Tools

### Console Commands

```javascript
// Get ant's current tile
const antTileX = Math.floor(selectedAnt.posX / TILE_SIZE);
const antTileY = Math.floor(selectedAnt.posY / TILE_SIZE);
console.log(`Ant is on tile (${antTileX}, ${antTileY})`);

// Get tile material
const grid = g_gridMap.getGrid();
const tile = grid.getArrPos([antTileX, antTileY]);
console.log(`Tile material: ${tile._terrainTile.getMaterial()}`);

// Test coordinate conversion
const testTilePos = [10, 10];
const screenPos = g_map2.renderConversion.convPosToCanvas(testTilePos);
console.log(`Tile ${testTilePos} renders at screen ${screenPos}`);

// Check terrain controller
if (entity._terrainController) {
  console.log(entity._terrainController.getDebugInfo());
}
```

### Visual Debug Grid

```javascript
// Already implemented in sketch.js
function drawDebugGrid(tileSize, gridWidth, gridHeight) {
  stroke(100, 100, 100, 100);
  strokeWeight(1);
  noFill();

  // Draw grid
  for (let x = 0; x < gridWidth; x++) {
    for (let y = 0; y < gridHeight; y++) {
      rect(x * tileSize, y * tileSize, tileSize, tileSize);
    }
  }

  // Highlight tile under mouse
  const tileX = Math.floor(mouseX / tileSize);
  const tileY = Math.floor(mouseY / tileSize);
  fill(255, 255, 0, 50);
  noStroke();
  rect(tileX * tileSize, tileY * tileSize, tileSize, tileSize);

  // Highlight selected ant's tile
  if (selectedAnt) {
    const antTileX = Math.floor(selectedAnt.posX / tileSize);
    const antTileY = Math.floor(selectedAnt.posY / tileSize);
    fill(0, 255, 0, 80);
    noStroke();
    rect(antTileX * tileSize, antTileY * tileSize, tileSize, tileSize);
  }
}
```

---

## Summary

### The Sync Mechanism

**Ants DON'T directly sync to terrain tiles**. Instead:

1. **Ants store position in pixels** (continuous, not discrete)
2. **Sprite2D.render() converts pixels → tiles → screen** on every frame
3. **Terrain's coordinate converter** (`g_map2.renderConversion`) handles camera offset
4. **Result**: Ants automatically align with terrain regardless of camera position/zoom

### The Critical Code

**In `Sprite2D.render()`**:
```javascript
// Convert pixel position to tile position
const tileX = this.pos.x / TILE_SIZE;
const tileY = this.pos.y / TILE_SIZE;

// Use terrain's converter to get screen position
const screenPos = g_map2.renderConversion.convPosToCanvas([tileX, tileY]);
```

**This single conversion is what keeps ants synced with terrain!**

---

**End of Documentation**
