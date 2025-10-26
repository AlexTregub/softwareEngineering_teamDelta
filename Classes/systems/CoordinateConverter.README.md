# CoordinateConverter Utility

Centralized coordinate conversion utility for the Ant Game project. Handles all conversions between screen, world, and tile coordinate spaces with automatic Y-axis inversion via the terrain system.

## Quick Start

```javascript
// Convert mouse click to world coordinates
const worldPos = CoordinateConverter.screenToWorld(mouseX, mouseY);
ant.moveToLocation(worldPos.x, worldPos.y);

// Convert entity position to screen for rendering
const screenPos = CoordinateConverter.worldToScreen(entity.posX, entity.posY);
text("HP: 100", screenPos.x, screenPos.y - 20);

// Get tile under mouse
const tile = CoordinateConverter.screenToWorldTile(mouseX, mouseY);
console.log(`Mouse over tile [${tile.x}, ${tile.y}]`);
```

## API Reference

### Core Conversions

#### `screenToWorld(screenX, screenY)`
Converts screen/canvas coordinates to world pixel coordinates.

**Parameters:**
- `screenX` (number): X coordinate in screen space
- `screenY` (number): Y coordinate in screen space

**Returns:** `{x: number, y: number}` - World coordinates in pixels

**Example:**
```javascript
function mousePressed() {
  const worldPos = CoordinateConverter.screenToWorld(mouseX, mouseY);
  spawnResource(worldPos.x, worldPos.y);
}
```

---

#### `worldToScreen(worldX, worldY)`
Converts world pixel coordinates to screen/canvas coordinates.

**Parameters:**
- `worldX` (number): X coordinate in world space (pixels)
- `worldY` (number): Y coordinate in world space (pixels)

**Returns:** `{x: number, y: number}` - Screen coordinates in pixels

**Example:**
```javascript
function drawHealthBar(entity) {
  const screenPos = CoordinateConverter.worldToScreen(entity.posX, entity.posY);
  fill(255, 0, 0);
  rect(screenPos.x - 16, screenPos.y - 30, 32, 4);
}
```

---

### Tile Conversions (Convenience Methods)

#### `screenToWorldTile(screenX, screenY)`
Converts screen coordinates directly to world tile coordinates.

**Parameters:**
- `screenX` (number): X coordinate in screen space
- `screenY` (number): Y coordinate in screen space

**Returns:** `{x: number, y: number}` - Tile coordinates (floored integers)

**Example:**
```javascript
function highlightTileUnderMouse() {
  const tile = CoordinateConverter.screenToWorldTile(mouseX, mouseY);
  const screenPos = CoordinateConverter.worldTileToScreen(tile.x, tile.y);
  fill(255, 255, 0, 50);
  rect(screenPos.x, screenPos.y, TILE_SIZE, TILE_SIZE);
}
```

---

#### `worldTileToScreen(tileX, tileY)`
Converts world tile coordinates to screen coordinates (tile's top-left corner).

**Parameters:**
- `tileX` (number): Tile X coordinate
- `tileY` (number): Tile Y coordinate

**Returns:** `{x: number, y: number}` - Screen coordinates of tile's top-left corner

**Example:**
```javascript
function drawTileGrid() {
  for (let ty = 0; ty < MAP_HEIGHT; ty++) {
    for (let tx = 0; tx < MAP_WIDTH; tx++) {
      const screenPos = CoordinateConverter.worldTileToScreen(tx, ty);
      rect(screenPos.x, screenPos.y, TILE_SIZE, TILE_SIZE);
    }
  }
}
```

---

#### `worldToTile(worldX, worldY)`
Converts world pixel coordinates to tile coordinates.

**Parameters:**
- `worldX` (number): X coordinate in world space (pixels)
- `worldY` (number): Y coordinate in world space (pixels)

**Returns:** `{x: number, y: number}` - Tile coordinates (floored integers)

**Example:**
```javascript
const entityTile = CoordinateConverter.worldToTile(entity.posX, entity.posY);
const terrain = getTerrainAt(entityTile.x, entityTile.y);
```

---

#### `tileToWorld(tileX, tileY)`
Converts tile coordinates to world pixel coordinates (tile's top-left corner).

**Parameters:**
- `tileX` (number): Tile X coordinate
- `tileY` (number): Tile Y coordinate

**Returns:** `{x: number, y: number}` - World coordinates in pixels

**Example:**
```javascript
const spawnTile = {x: 10, y: 15};
const worldPos = CoordinateConverter.tileToWorld(spawnTile.x, spawnTile.y);
spawnAnt(worldPos.x, worldPos.y);
```

---

### Utility Methods

#### `isAvailable()`
Check if the terrain coordinate system is available and ready.

**Returns:** `boolean` - True if terrain system is ready

**Example:**
```javascript
if (!CoordinateConverter.isAvailable()) {
  console.warn('Terrain system not ready yet');
  return;
}
```

---

#### `getTileSize()`
Get the current tile size in pixels.

**Returns:** `number` - Tile size (defaults to 32 if TILE_SIZE undefined)

---

#### `getDebugInfo()`
Get comprehensive debug information about the coordinate system state.

**Returns:** `Object` - Debug information including system availability

**Example:**
```javascript
console.table(CoordinateConverter.getDebugInfo());
// Shows: terrainSystemAvailable, tileSize, camera system status, etc.
```

---

## Common Use Cases

### Mouse Event Handling

```javascript
function mousePressed() {
  // Convert screen click to world coordinates
  const worldPos = CoordinateConverter.screenToWorld(mouseX, mouseY);
  
  // Use for game logic
  if (mouseButton === LEFT) {
    selectedAnt.moveToLocation(worldPos.x, worldPos.y);
  } else if (mouseButton === RIGHT) {
    spawnResource(worldPos.x, worldPos.y);
  }
}
```

### Entity Hover Detection

```javascript
function isMouseOverEntity(entity) {
  const worldMouse = CoordinateConverter.screenToWorld(mouseX, mouseY);
  const entityPos = entity.getPosition();
  const entitySize = entity.getSize();
  
  return worldMouse.x >= entityPos.x && 
         worldMouse.x <= entityPos.x + entitySize.x &&
         worldMouse.y >= entityPos.y && 
         worldMouse.y <= entityPos.y + entitySize.y;
}
```

### Rendering UI Above Entities

```javascript
function drawEntityLabels() {
  for (const entity of entities) {
    const worldPos = entity.getPosition();
    const screenPos = CoordinateConverter.worldToScreen(worldPos.x, worldPos.y);
    
    // Draw label above entity
    fill(255);
    textAlign(CENTER, BOTTOM);
    text(entity.name, screenPos.x, screenPos.y - 10);
  }
}
```

### Tile-Based Grid Rendering

```javascript
function drawDebugGrid(tileSize, gridWidth, gridHeight) {
  // Highlight tile under mouse
  const mouseTile = CoordinateConverter.screenToWorldTile(mouseX, mouseY);
  const tileScreenPos = CoordinateConverter.worldTileToScreen(mouseTile.x, mouseTile.y);
  
  fill(255, 255, 0, 50);
  noStroke();
  rect(tileScreenPos.x, tileScreenPos.y, tileSize, tileSize);
}
```

### Terrain Query

```javascript
function getTerrainUnderMouse() {
  const tile = CoordinateConverter.screenToWorldTile(mouseX, mouseY);
  
  if (tile.x >= 0 && tile.x < MAP_WIDTH && tile.y >= 0 && tile.y < MAP_HEIGHT) {
    return terrainGrid[tile.y][tile.x];
  }
  return null;
}
```

---

## Migration Guide

### Before (Manual Conversion)

```javascript
// Entity.isMouseOver() - OLD
isMouseOver() {
  if (g_map2 && g_map2.renderConversion && typeof TILE_SIZE !== 'undefined') {
    const worldPos = g_map2.renderConversion.convCanvasToPos([mouseX, mouseY]);
    const worldX = worldPos[0] * TILE_SIZE;
    const worldY = worldPos[1] * TILE_SIZE;
    return this._collisionBox.contains(worldX, worldY);
  }
  return this._collisionBox.contains(mouseX, mouseY);
}

// drawDebugGrid() - OLD
const tileX = Math.floor(mouseX / tileSize);
const tileY = Math.floor(mouseY / tileSize);
rect(tileX * tileSize, tileY * tileSize, tileSize, tileSize);
```

### After (Using CoordinateConverter)

```javascript
// Entity.isMouseOver() - NEW
isMouseOver() {
  const worldMouse = CoordinateConverter.screenToWorld(mouseX, mouseY);
  return this._collisionBox.contains(worldMouse.x, worldMouse.y);
}

// drawDebugGrid() - NEW
const mouseTile = CoordinateConverter.screenToWorldTile(mouseX, mouseY);
const tileScreenPos = CoordinateConverter.worldTileToScreen(mouseTile.x, mouseTile.y);
rect(tileScreenPos.x, tileScreenPos.y, tileSize, tileSize);
```

---

## Technical Details

### Y-Axis Inversion
The terrain system uses an inverted Y-axis where:
- World coordinates: Origin at top-left, Y increases downward
- Screen coordinates: Origin at top-left, Y increases downward
- Terrain rendering: Applies `-1 * (tileY - cameraTileY)` transformation

CoordinateConverter handles this automatically via `g_map2.renderConversion`.

### Fallback Chain
1. **Primary:** `g_map2.renderConversion` (terrain system with Y-inversion)
2. **Fallback 1:** `g_cameraManager` (if available)
3. **Fallback 2:** `CameraController` static methods
4. **Fallback 3:** Global `cameraX`/`cameraY` variables (no zoom support)

### Performance
- All methods are O(1) constant time
- No object allocations except return values
- Safe for use in draw loop (60 FPS)

---

## Testing

```javascript
// Check if system is ready
console.log('Terrain system available:', CoordinateConverter.isAvailable());

// Test round-trip conversion
const original = { x: 500, y: 300 };
const screen = CoordinateConverter.worldToScreen(original.x, original.y);
const worldAgain = CoordinateConverter.screenToWorld(screen.x, screen.y);
console.log('Round-trip error:', 
  Math.abs(original.x - worldAgain.x), 
  Math.abs(original.y - worldAgain.y)
);

// Debug output
console.table(CoordinateConverter.getDebugInfo());
```

---

## Dependencies

- **Required:** `g_map2.renderConversion` (terrain coordinate system)
- **Required:** `TILE_SIZE` global constant
- **Optional:** `g_cameraManager`, `CameraController`, `cameraX`, `cameraY` (fallbacks)

## Load Order

Must be loaded **after** terrain system but **before** controllers/entities that use it:

```html
<!-- In index.html -->
<script src="Classes/terrainUtils/gridTerrain.js"></script>
<script src="Classes/systems/CoordinateConverter.js"></script> <!-- HERE -->
<script src="Classes/controllers/SelectionBoxController.js"></script>
```

---

## See Also

- `Classes/terrainUtils/gridTerrain.js` - Terrain rendering system
- `Classes/controllers/CameraManager.js` - Camera management
- `Classes/containers/Entity.js` - Entity base class
- `ANT_TERRAIN_SYNC_SYSTEM.md` - Terrain coordinate system documentation
