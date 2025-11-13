# Terrain & Level System - Quick Reference

**Last Updated**: 2025-11-13  
**Status**: Investigation Complete - Fixes Needed

---

## 🚨 CRITICAL BUG

**Problem**: Terrain visuals don't update when loading levels from JSON

**Root Causes**:
1. Cache not invalidated properly
2. Material name validation missing
3. Coordinate cache not reset
4. No forced redraw after load
5. Possible image loading race condition

---

## System Components

### Core Classes

| Class | File | Purpose |
|-------|------|---------|
| `Tile` | `Classes/terrainUtils/tiles.js` | Individual tile with material |
| `Chunk` | `Classes/terrainUtils/gridTerrain.js` | Grid of tiles |
| `gridTerrain` | `Classes/terrainUtils/gridTerrain.js` | Map/level, contains chunks |
| `MapManager` | `Classes/managers/MapManager.js` | Central map registry |
| `TerrainExporter` | `Classes/terrainUtils/TerrainExporter.js` | Save to JSON |
| `TerrainImporter` | `Classes/terrainUtils/TerrainImporter.js` | Load from JSON |

### Global Variables

| Variable | Type | Purpose |
|----------|------|---------|
| `g_activeMap` | `gridTerrain` | Currently active terrain map |
| `mapManager` | `MapManager` | Singleton map manager |
| `TERRAIN_MATERIALS_RANGED` | `Object` | Material→render function mapping |
| Terrain images | `p5.Image` | `GRASS_IMAGE`, `STONE_IMAGE`, etc. |

---

## Data Flow

### Tile Material Storage
```javascript
Tile._materialSet = 'grass'  // Material name (string)
  ↓
TERRAIN_MATERIALS_RANGED['grass'] = [range, renderFunc]
  ↓
renderFunc(x, y, size, ctx) → ctx.image(GRASS_IMAGE, x, y, size, size)
```

### Level Loading
```javascript
JSON → TerrainImporter → gridTerrain → MapManager → Render
```

### Rendering
```javascript
sketch.draw() → RenderLayerManager → TERRAIN layer → g_activeMap.render()
  ↓
Cache valid? → YES: Draw cache | NO: Rebuild cache
  ↓
Iterate chunks → Iterate tiles → Tile.render()
  ↓
TERRAIN_MATERIALS_RANGED[material][1](x, y, size, ctx)
```

---

## Key Methods

### Loading a Level
```javascript
function loadLevel(levelData) {
  // 1. Create map
  const map = new gridTerrain(gridSizeX, gridSizeY, seed, ...);
  
  // 2. Import terrain
  const importer = new TerrainImporter(map);
  importer.importFromJSON(levelData.terrainData);
  
  // 3. Register map
  mapManager.registerMap(levelData.id, map, true);
  
  // 4. Force redraw
  for (let i = 0; i < 3; i++) window.redraw();
}
```

### Switching Maps
```javascript
mapManager.setActiveMap('level_002');
// Automatically:
// • Updates g_activeMap
// • Invalidates cache
// • Forces re-render
```

### Invalidating Cache
```javascript
gridTerrain.invalidateCache() {
  this._cacheValid = false;
  this._terrainCache = null;
}
```

---

## JSON Structure

### Level Data Format (CURRENT)
**Exported by TerrainExporter, imported by TerrainImporter**

```json
{
  "metadata": {
    "version": "1.0",
    "gridSizeX": 50,
    "gridSizeY": 50,
    "chunkSize": 8,
    "tileSize": 32,
    "seed": 12345,
    "exportDate": "2025-11-13T..."
  },
  "tiles": [
    "grass", "grass", "stone", "dirt", 
    "moss", "water", "sand", ...
  ]
}
```

**NOTE**: No wrapper `terrainData` object. This is the direct format from `TerrainExporter.exportToJSON()`.

### Storing Levels in LocalStorage
```javascript
const storage = new LocalStorageManager('terrain_');

// Export from current terrain
const exporter = new TerrainExporter(g_activeMap);
const levelData = exporter.exportToJSON();

// Add custom metadata (optional)
levelData.metadata.levelName = 'My Forest Level';

// Save to LocalStorage
storage.save('my_forest_level', levelData);

// Later: Load from LocalStorage
const savedData = storage.load('my_forest_level');

// Import to new map
const map = new gridTerrain(...);
const importer = new TerrainImporter(map);
importer.importFromJSON(savedData);
mapManager.registerMap('my_forest_level', map, true);
```

### Material Names
Valid materials (must match `TERRAIN_MATERIALS_RANGED` keys):
- `'grass'` (default)
- `'stone'`, `'stone_1'`, `'stone_2'`, `'stone_3'`
- `'dirt'`, `'dirt_1'`
- `'moss'`, `'moss_1'`, `'moss_2'`, `'moss_3'`, `'moss_4'`
- `'water'`, `'waterCave'`
- `'sand'`, `'sandDark'`
- `'farmland'`, `'caveDirt'`, `'caveDark'`

---

## Required Fixes

### Fix 1: Enhanced Material Validation
**File**: `Classes/terrainUtils/TerrainImporter.js`

```javascript
_importFull(terrain, data) {
  const validMaterials = Object.keys(TERRAIN_MATERIALS_RANGED);
  
  let index = 0;
  for (let y = 0; y < totalTilesY; y++) {
    for (let x = 0; x < totalTilesX; x++) {
      let material = data.tiles[index];
      
      // ⚠️ VALIDATE MATERIAL
      if (!validMaterials.includes(material)) {
        console.warn(`Invalid material '${material}', using 'grass'`);
        material = 'grass';
      }
      
      const tile = terrain.getArrPos([x, y]);
      tile.setMaterial(material);
      tile.assignWeight();
      
      // ⚠️ RESET COORDINATE CACHE
      tile._coordSysUpdateId = -1;
      tile._coordSysPos = NONE;
      
      index++;
    }
  }
  
  // ⚠️ FORCE CACHE INVALIDATION
  terrain.invalidateCache();
}
```

### Fix 2: Force Redraw After Load
**File**: Wherever `loadLevel()` is implemented

```javascript
function loadLevel(levelData) {
  // ... create map, import terrain, register map ...
  
  // ⚠️ FORCE MULTIPLE REDRAWS
  if (typeof window.redraw === 'function') {
    for (let i = 0; i < 3; i++) {
      window.redraw();
    }
  }
}
```

### Fix 3: Verify Images Loaded
**File**: `sketch.js` or level loading code

```javascript
function verifyTerrainImages() {
  const required = [
    'GRASS_IMAGE', 'DIRT_IMAGE', 'STONE_IMAGE',
    'MOSS_IMAGE', 'WATER', 'SAND_IMAGE'
  ];
  
  for (const img of required) {
    if (!window[img]) {
      console.error(`Missing: ${img}`);
      return false;
    }
  }
  return true;
}

function loadLevel(levelData) {
  // ⚠️ CHECK IMAGES LOADED
  if (!verifyTerrainImages()) {
    console.error("Cannot load level: images not ready");
    return;
  }
  
  // Continue with load...
}
```

---

## Debug Commands

### Check Tile Materials
```javascript
// In browser console
const tile = g_activeMap.getArrPos([0, 0]);
console.log('Tile material:', tile.getMaterial());
console.log('Has render func:', !!TERRAIN_MATERIALS_RANGED[tile.getMaterial()]);
```

### Check Cache State
```javascript
console.log('Cache valid:', g_activeMap._cacheValid);
console.log('Cache object:', g_activeMap._terrainCache);
```

### Verify Materials in JSON
```javascript
const materials = [...new Set(levelData.terrainData.tiles)];
const valid = Object.keys(TERRAIN_MATERIALS_RANGED);
materials.forEach(m => {
  if (!valid.includes(m)) console.error('Invalid:', m);
});
```

### Force Cache Rebuild
```javascript
g_activeMap.invalidateCache();
for (let i = 0; i < 3; i++) window.redraw();
```

---

## Missing Features (Level Selection)

### What Doesn't Exist Yet
- ❌ Level selection UI/menu
- ❌ Level switching workflow UI
- ❌ Simple list/grid view for saved levels

### What DOES Exist (Ready to Use!)
- ✅ MapManager (map registry & switching)
- ✅ TerrainExporter (save to JSON)
- ✅ TerrainImporter (load from JSON)
- ✅ LocalStorageManager (save/load to browser storage)
- ✅ SaveDialog/LoadDialog (UI for save/load)
- ✅ Level Editor (create/edit terrain)
- ✅ JSON format: `{metadata: {...}, tiles: [...]}`

### Existing JSON Level Format
**File**: `src/levels/tutorialCave_Start.json`

```json
{
  "metadata": {
    "version": "1.0",
    "gridSizeX": 1,
    "gridSizeY": 1,
    "chunkSize": 50,
    "tileSize": 32,
    "exportDate": "2025-10-27T02:57:21.027Z"
  },
  "tiles": [
    "cave_dark", "cave_3", "cave_dirt", ...
  ]
}
```

**This format works directly with `TerrainImporter`!**

### LocalStorage Already Working
**Class**: `LocalStorageManager` (`Classes/ui/LocalStorageManager.js`)

```javascript
const storage = new LocalStorageManager('terrain_');

// Save level
storage.save('tutorial_cave', levelData);

// Load level
const levelData = storage.load('tutorial_cave');

// List all saved levels
const savedLevels = storage.list(); // [{name, date, size}, ...]

// Delete level
storage.delete('tutorial_cave');

// Check if exists
const exists = storage.exists('tutorial_cave');
```

### Simple Level Selection (No Thumbnails)
**What We Need**: Basic list menu to select & load saved levels

```javascript
class SimpleLevelSelectionMenu {
  constructor() {
    this.storage = new LocalStorageManager('terrain_');
    this.levels = [];
    this.selectedIndex = 0;
  }
  
  loadLevelList() {
    // Get levels from LocalStorage
    this.levels = this.storage.list();
    
    // Add hardcoded levels from src/levels/ folder
    this.levels.unshift({
      name: 'Tutorial Cave',
      source: 'file',
      path: 'src/levels/tutorialCave_Start.json'
    });
  }
  
  selectLevel(index) {
    this.selectedIndex = index;
  }
  
  startSelectedLevel() {
    const level = this.levels[this.selectedIndex];
    
    if (level.source === 'file') {
      // Load from file
      loadLevelFromFile(level.path);
    } else {
      // Load from LocalStorage
      const levelData = this.storage.load(level.name);
      loadLevelFromData(levelData);
    }
  }
  
  render() {
    // Draw simple list (no thumbnails)
    this.levels.forEach((level, i) => {
      const y = 100 + (i * 40);
      const isSelected = (i === this.selectedIndex);
      
      fill(isSelected ? '#00ff00' : '#ffffff');
      text(level.name, 100, y);
      text(level.date || 'Built-in', 300, y);
    });
  }
}
```

### Next Steps (SIMPLE, NO THUMBNAILS)
1. Create `SimpleLevelSelectionMenu` class (list view only)
2. Add "Load Level" button to main menu
3. Hook up LocalStorage list retrieval
4. Load level from LocalStorage or file on selection
5. Apply the 5 terrain visual fixes when loading

---

## Testing Checklist

### Before Loading Level
- [ ] Terrain images loaded (`preload()` complete)
- [ ] MapManager initialized
- [ ] JSON structure validated

### During Load
- [ ] Material names validated against `TERRAIN_MATERIALS_RANGED`
- [ ] Tiles set with `setMaterial()`
- [ ] Coordinate cache reset (`_coordSysUpdateId = -1`)
- [ ] Cache invalidated (`invalidateCache()` called)

### After Load
- [ ] Active map set (`mapManager.setActiveMap()`)
- [ ] Cache marked invalid (`_cacheValid = false`)
- [ ] Multiple redraws forced
- [ ] Tiles render with correct visuals

---

## Common Errors

### Error: "Invalid material 'Grass'"
**Cause**: Material name capitalized in JSON  
**Fix**: Use lowercase (`'grass'`, not `'Grass'`)

### Error: "GRASS_IMAGE is not defined"
**Cause**: Images not loaded before level load  
**Fix**: Ensure `preload()` completes before loading level

### Error: Terrain shows old visuals after load
**Cause**: Cache not invalidated  
**Fix**: Call `terrain.invalidateCache()` after import

### Error: Terrain blank/black after load
**Cause**: Material names don't match `TERRAIN_MATERIALS_RANGED`  
**Fix**: Validate material names during import

---

## File Locations

### Core System Files
- `Classes/terrainUtils/tiles.js` - Tile, materials, images
- `Classes/terrainUtils/gridTerrain.js` - Terrain map, cache
- `Classes/managers/MapManager.js` - Map registry
- `Classes/terrainUtils/TerrainExporter.js` - Export
- `Classes/terrainUtils/TerrainImporter.js` - Import

### Documentation
- `docs/architecture/TERRAIN_AND_LEVEL_SYSTEM_INVESTIGATION.md` - Full investigation
- `docs/diagrams/terrain_level_system_flow.md` - Flow diagrams
- `docs/quick-reference-mapmanager.md` - MapManager guide

### Tests
- `test/unit/terrainUtils/` - Terrain unit tests
- `test/integration/maps/` - MapManager tests
- `test/integration/terrainUtils/` - Import/export tests

---

## Quick Fixes Summary

1. **Add material validation** in `TerrainImporter._importFull()`
2. **Reset coordinate cache** (`tile._coordSysUpdateId = -1`)
3. **Force cache invalidation** after import
4. **Force multiple redraws** after level load
5. **Verify images loaded** before level load

**Apply these 5 fixes and terrain visuals should update correctly.**

---

**END OF QUICK REFERENCE**
