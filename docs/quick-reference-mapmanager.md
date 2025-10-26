# MapManager Quick Reference

## Overview
MapManager is a centralized system for managing terrain maps and level switching.

---

## Global Access
```javascript
window.mapManager  // Available globally after MapManager.js loads
```

---

## Core Methods

### Map Registration
```javascript
// Register a map
mapManager.registerMap(mapId, mapInstance, setActive)

// Example
mapManager.registerMap('level1', g_map2, true);
```

### Create New Map
```javascript
// Create procedural map
const map = mapManager.createProceduralMap('level2', {
  chunksX: 20,
  chunksY: 20,
  seed: 12345,
  chunkSize: 8,
  tileSize: 32,
  canvasSize: [windowWidth, windowHeight]
}, setActive);
```

### Switch Active Map
```javascript
// By ID
mapManager.setActiveMap('level2');

// Check if map exists first
if (mapManager.hasMap('level2')) {
  mapManager.setActiveMap('level2');
}
```

### Access Maps
```javascript
// Get active map
const activeMap = mapManager.getActiveMap();

// Get specific map
const level2 = mapManager.getMap('level2');

// Get active map ID
const currentId = mapManager.getActiveMapId();

// List all map IDs
const allIds = mapManager.getMapIds();
```

### Terrain Queries
```javascript
// Get tile at world position (pixels)
const tile = mapManager.getTileAtPosition(worldX, worldY);

// Get tile at grid coordinates
const tile = mapManager.getTileAtCoords(tileX, tileY);

// Get just the material
const material = mapManager.getTileMaterial(worldX, worldY);
// Returns: 'grass', 'dirt', 'stone', etc.
```

### Cleanup
```javascript
// Remove a map (cannot remove active map)
mapManager.unregisterMap('oldLevel');

// Clear all maps (use with caution!)
mapManager.clearAll();
```

### Information
```javascript
// Get overview
const info = mapManager.getInfo();
// Returns: { totalMaps, activeMapId, mapIds, hasActiveMap }
```

---

## Entity Integration

All entities automatically use MapManager if available:

```javascript
// Entity methods (work automatically)
const terrain = entity.getCurrentTerrain();        // "IN_WATER", "DEFAULT", etc.
const material = entity.getCurrentTileMaterial();  // "grass", "dirt", etc.
```

---

## Backwards Compatibility

MapManager maintains backwards compatibility with `g_activeMap`:

```javascript
// Old way (still works)
const map = g_activeMap;

// New way (preferred)
const map = mapManager.getActiveMap();

// Both stay in sync automatically
```

---

## Common Patterns

### Level Switching System
```javascript
function switchLevel(levelId) {
  if (!mapManager.hasMap(levelId)) {
    console.error(`Level ${levelId} not found`);
    return false;
  }
  
  return mapManager.setActiveMap(levelId);
}
```

### Portal System
```javascript
function checkPortal(entity) {
  if (entity.isNearPortal()) {
    const portalData = entity.getPortalData();
    mapManager.setActiveMap(portalData.targetLevel);
    entity.setPosition(portalData.spawnX, portalData.spawnY);
  }
}
```

### Level Loading
```javascript
function loadAllLevels() {
  const levels = [
    { id: 'forest', seed: 11111 },
    { id: 'desert', seed: 22222 },
    { id: 'cave', seed: 33333 }
  ];
  
  levels.forEach(level => {
    mapManager.createProceduralMap(level.id, {
      chunksX: 20, chunksY: 20,
      seed: level.seed,
      chunkSize: 8, tileSize: 32,
      canvasSize: [windowWidth, windowHeight]
    });
  });
}
```

### Memory Management
```javascript
function cleanupUnusedLevels() {
  const activeId = mapManager.getActiveMapId();
  const allIds = mapManager.getMapIds();
  
  allIds.forEach(id => {
    if (id !== activeId && id !== 'level1') {
      mapManager.unregisterMap(id);
    }
  });
}
```

---

## Console Commands

For debugging in browser console:

```javascript
// View all maps
mapManager.getInfo()

// Switch level
mapManager.setActiveMap('level2')

// Check terrain
mapManager.getTileAtPosition(400, 400)

// List details
mapManager.getMapIds().forEach(id => {
  console.log(id, mapManager.getMap(id));
})
```

---

## Architecture

```
MapManager
├── _maps: Map<string, gridTerrain>    // All registered maps
├── _activeMap: gridTerrain            // Current active map
└── _activeMapId: string               // Active map identifier

Keeps g_activeMap in sync for compatibility
```

---

## When to Use

✅ **Use MapManager when:**
- Creating multiple levels
- Switching between maps
- Need centralized terrain queries
- Building save/load systems
- Managing level lifecycle

✅ **Use g_activeMap when:**
- Quick prototyping
- Direct terrain access needed
- Maintaining old code

---

## Integration Points

- **sketch.js**: Initializes main map as 'level1'
- **TerrainController.js**: Uses MapManager for terrain detection
- **Entity.js**: Uses MapManager for tile queries
- **Backwards compatible**: Falls back to g_activeMap if MapManager unavailable

---

## Error Handling

All methods return `false` or `null` on failure and log errors to console:

```javascript
const success = mapManager.setActiveMap('nonexistent');
// Logs: "MapManager.setActiveMap: Map 'nonexistent' not found"
// Returns: false
```

Always check return values in production code:

```javascript
if (!mapManager.setActiveMap(levelId)) {
  // Handle error - show message, retry, etc.
}
```
