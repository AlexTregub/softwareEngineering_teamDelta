# Terrain & Level System Investigation

**Date**: 2025-11-13  
**Status**: CRITICAL - Terrain visuals not updating when loading levels from JSON  
**Branch**: DW_LevelSelection

---

## 🔴 CRITICAL PROBLEM

**Issue**: When loading terrain data from JSON, the visual rendering doesn't update to show the new terrain materials stored in the JSON file.

**Expected Behavior**: Loading a JSON level should display the terrain visuals (grass, stone, dirt, etc.) that were saved in that JSON.

**Actual Behavior**: Terrain materials are loaded into the data structures, but the visual rendering doesn't reflect the changes.

---

## System Architecture Overview

### 1. **Terrain Data Storage**
- **Tile Class** (`Classes/terrainUtils/tiles.js`)
  - Stores material type in `_materialSet` property
  - Material examples: `'grass'`, `'stone'`, `'dirt'`, `'moss'`, `'water'`, etc.
  - Each tile has position (`_x`, `_y`) and size (`_squareSize`)

### 2. **Terrain Hierarchy**
```
gridTerrain (Map/Level)
  └─> chunkArray: Grid of Chunks
       └─> Chunk
            └─> tileData: Grid of Tiles
                 └─> Tile
                      └─> _materialSet: 'grass'/'stone'/etc.
```

### 3. **Material Visual Definitions**
**Location**: `Classes/terrainUtils/tiles.js`

```javascript
TERRAIN_MATERIALS_RANGED = {
  'grass': [[0,1], (x,y,squareSize,ctx) => ctx.image(GRASS_IMAGE, x, y, squareSize, squareSize)],
  'stone': [[0.57,0.63], (x,y,squareSize,ctx) => ctx.image(STONE_IMAGE, x,y,squareSize,squareSize)],
  'dirt': [[0.52,0.57], (x,y,squareSize,ctx) => ctx.image(DIRT_IMAGE, x, y, squareSize, squareSize)],
  'moss': [[0.63,0.693], (x,y,squareSize,ctx) => ctx.image(MOSS_IMAGE, x,y,squareSize,squareSize)],
  'water': [[0.22,0.3], (x,y,squareSize,ctx) => ctx.image(WATER, x,y,squareSize,squareSize)],
  // ... more materials
};
```

**Image Loading**: `terrainPreloader()` in `tiles.js`
```javascript
function terrainPreloader() {
  GRASS_IMAGE = loadImage('Images/16x16 Tiles/grass.png');
  STONE_IMAGE = loadImage('Images/16x16 Tiles/stone.png');
  DIRT_IMAGE = loadImage('Images/16x16 Tiles/dirt.png');
  MOSS_IMAGE = loadImage('Images/16x16 Tiles/moss.png');
  WATER = loadImage('Images/16x16 Tiles/water.png');
  // ... more images
}
```

### 4. **Tile Rendering**
**Method**: `Tile.render(coordSys, ctx=window)` in `tiles.js`

```javascript
render(coordSys, ctx=window) {
  if (this._coordSysUpdateId != coordSys.getUpdateId() || this._coordSysPos == NONE) {
    this._coordSysPos = coordSys.convPosToCanvas([this._x, this._y]);
  }
  
  // Render using the material's lambda function from TERRAIN_MATERIALS_RANGED
  TERRAIN_MATERIALS_RANGED[this._materialSet][1](
    this._coordSysPos[0], 
    this._coordSysPos[1], 
    this._squareSize, 
    ctx
  );
}
```

**Key Point**: `this._materialSet` must match a key in `TERRAIN_MATERIALS_RANGED` for correct rendering.

---

## Level Loading System

### 5. **JSON Export/Import System**

#### Export (`TerrainExporter.js`)
```javascript
exportToJSON(options = {}) {
  const { compressed, chunked, customMetadata } = options;
  
  return {
    metadata: {
      version: '1.0',
      gridSizeX, gridSizeY, chunkSize, tileSize, seed,
      exportDate: new Date().toISOString()
    },
    tiles: [/* array of material strings */]
  };
}
```

**Export Formats**:
1. **Full**: Array of all tile materials `['grass', 'stone', 'dirt', ...]`
2. **Compressed**: Run-length encoded `"100:grass,50:stone,20:dirt"`
3. **Chunked**: Default material + exceptions `{ defaultMaterial: 'grass', exceptions: [{x, y, material}] }`

#### Import (`TerrainImporter.js`)
```javascript
importFromJSON(data, options = {}) {
  // 1. Validate data structure
  // 2. Migrate old versions
  // 3. Apply defaults
  // 4. Import tiles based on format
  //    - _importFull() for array format
  //    - _importCompressed() for RLE format
  //    - _importChunked() for exception format
  // 5. Import entities (optional)
  // 6. Import resources (optional)
  // 7. Invalidate cache to force re-render
  
  if (this._terrain.invalidateCache) {
    this._terrain.invalidateCache(); // ⚠️ CRITICAL
  }
}
```

**Import Methods**:
```javascript
_importFull(terrain, data) {
  let index = 0;
  for (let y = 0; y < totalTilesY; y++) {
    for (let x = 0; x < totalTilesX; x++) {
      const tile = terrain.getArrPos([x, y]);
      tile.setMaterial(data.tiles[index]); // ⚠️ Sets _materialSet
      tile.assignWeight();
      index++;
    }
  }
}
```

### 6. **MapManager System**
**Location**: `Classes/managers/MapManager.js`

**Purpose**: Centralized map management for level switching

```javascript
class MapManager {
  _maps: Map<string, gridTerrain>  // All registered maps
  _activeMap: gridTerrain           // Currently active map
  _activeMapId: string              // Active map ID
  
  registerMap(mapId, map, setActive=false)
  setActiveMap(mapId)
  getActiveMap()
  getTileAtPosition(worldX, worldY)
  getTileAtGridCoords(tileGridX, tileGridY)
  createProceduralMap(mapId, config, setActive)
}
```

**Global Singleton**: `window.mapManager` (created automatically)

**Backwards Compatibility**: Maintains `window.g_activeMap` reference

#### Key Method: `setActiveMap()`
```javascript
setActiveMap(mapId) {
  const map = this._maps.get(mapId);
  this._activeMap = map;
  this._activeMapId = mapId;
  
  // Update global reference
  window.g_activeMap = map;
  
  // ⚠️ CRITICAL: Invalidate cache to force re-render
  if (map && typeof map.invalidateCache === 'function') {
    map.invalidateCache();
    logNormal(`MapManager: Terrain cache invalidated for '${mapId}'`);
  }
}
```

---

## Rendering Pipeline

### 7. **Terrain Cache System**
**Location**: `Classes/terrainUtils/gridTerrain.js`

```javascript
class gridTerrain {
  _terrainCache: p5.Graphics  // Off-screen buffer
  _cacheValid: boolean        // Dirty flag
  _cacheViewport: object      // Cached viewport state
  
  invalidateCache() {
    this._cacheValid = false;
    this._terrainCache = null;
    logNormal("Terrain cache invalidated");
  }
  
  render() {
    // If cache invalid, regenerate terrain rendering
    if (!this._cacheValid) {
      this._rebuildCache();
    }
    
    // Draw cached terrain to screen
    image(this._terrainCache, ...);
  }
}
```

**Cache Invalidation Triggers**:
1. Map switching (`MapManager.setActiveMap()`)
2. Terrain import (`TerrainImporter.importFromJSON()`)
3. Tile editing (Level Editor)
4. Camera movement (viewport changes)

### 8. **RenderLayerManager Integration**
**Location**: `Classes/rendering/RenderLayerManager.js`

**Layer Order** (bottom to top):
- `TERRAIN` (terrain rendering)
- `ENTITIES` (ants, buildings)
- `EFFECTS` (particles, animations)
- `UI_GAME` (HUD, panels)
- `UI_DEBUG` (debug overlays)
- `UI_MENU` (main menu, level selection)

**Terrain Layer Registration**:
```javascript
RenderManager.addDrawableToLayer(RenderManager.layers.TERRAIN, () => {
  push();
  if (g_activeMap) {
    g_activeMap.render(); // Renders terrain
  }
  pop();
});
```

---

## Level Selection System (Needed)

### 9. **Current State: NO LEVEL SELECTION**
**Status**: ⚠️ **NOT IMPLEMENTED**

**What Exists**:
- MapManager (centralized map registry)
- TerrainExporter (save levels to JSON)
- TerrainImporter (load levels from JSON)
- Level Editor (create/edit levels)

**What's Missing**:
- Level selection UI/menu
- Level metadata storage (name, thumbnail, description)
- Level browser/grid view
- Level loading workflow
- Level switching workflow

### 10. **Proposed Level Selection Architecture**

#### Level Metadata Structure
```javascript
{
  id: 'level_001',
  name: 'Forest Valley',
  description: 'A peaceful valley with dense forests',
  thumbnail: 'base64_image_data_or_path',
  difficulty: 'easy',
  terrainData: {
    metadata: { gridSizeX, gridSizeY, seed, ... },
    tiles: [/* terrain data */]
  },
  entities: [/* spawned entities */],
  resources: [/* resource nodes */],
  playerStartPos: { x: 400, y: 400 },
  objectives: [/* quest objectives */],
  createdAt: '2025-11-13T12:00:00Z',
  lastModified: '2025-11-13T14:30:00Z'
}
```

#### Level Storage Options
1. **LocalStorage** (browser-based, limited size)
   ```javascript
   localStorage.setItem('level_001', JSON.stringify(levelData));
   ```

2. **IndexedDB** (browser-based, large storage)
   ```javascript
   const db = await openLevelDatabase();
   await db.levels.put(levelData);
   ```

3. **File Download/Upload** (export/import JSON files)
   ```javascript
   // Export
   const blob = new Blob([JSON.stringify(levelData)], { type: 'application/json' });
   saveAs(blob, 'level_001.json');
   
   // Import
   const file = await openFileDialog();
   const levelData = JSON.parse(await file.text());
   ```

#### Level Selection UI Components

**LevelSelectionMenu** (proposed):
```javascript
class LevelSelectionMenu {
  constructor() {
    this.levels = [];           // Array of level metadata
    this.selectedLevel = null;  // Currently selected level
    this.gridView = true;       // Grid vs list view
  }
  
  loadLevelList() {
    // Load from LocalStorage/IndexedDB
    this.levels = getLevelsFromStorage();
  }
  
  selectLevel(levelId) {
    this.selectedLevel = levelId;
  }
  
  startLevel() {
    const level = this.levels.find(l => l.id === this.selectedLevel);
    
    // 1. Create new map
    const map = new gridTerrain(...);
    
    // 2. Import terrain data
    const importer = new TerrainImporter(map);
    importer.importFromJSON(level.terrainData);
    
    // 3. Register with MapManager
    mapManager.registerMap(levelId, map, true);
    
    // 4. Spawn entities
    spawnLevelEntities(level.entities);
    
    // 5. Set player position
    setPlayerPosition(level.playerStartPos);
    
    // 6. Transition to gameplay
    GameState.setState('PLAYING');
  }
  
  render() {
    // Render level grid/list
    // Show thumbnails, names, descriptions
    // Highlight selected level
  }
  
  handleClick(x, y) {
    // Handle level selection clicks
  }
}
```

---

## 🔍 ROOT CAUSE ANALYSIS: Why Terrain Visuals Don't Update

### 11. **Likely Issue #1: Cache Not Invalidated**

**Problem**: After loading JSON, the terrain cache (`_terrainCache`) may still contain the OLD terrain visuals.

**Solution**: Ensure `invalidateCache()` is called after import:

```javascript
// In TerrainImporter.importFromJSON()
if (this._terrain.invalidateCache) {
  this._terrain.invalidateCache(); // ✅ Already present
}
```

**Verify**: Check if `gridTerrain.invalidateCache()` actually clears the cache:
```javascript
invalidateCache() {
  this._cacheValid = false;
  this._terrainCache = null; // ✅ Ensure this is set to null
  logNormal("Terrain cache invalidated");
}
```

### 12. **Likely Issue #2: Material Names Mismatch**

**Problem**: JSON may contain material names that don't exist in `TERRAIN_MATERIALS_RANGED`.

**Example**:
```json
{
  "tiles": ["Grass", "Stone", "Dirt"] // ❌ Capitalized (wrong)
}
```

Should be:
```json
{
  "tiles": ["grass", "stone", "dirt"] // ✅ Lowercase (correct)
}
```

**Solution**: Add validation in `TerrainImporter`:
```javascript
_importFull(terrain, data) {
  for (let i = 0; i < data.tiles.length; i++) {
    const material = data.tiles[i];
    
    // ⚠️ Check if material exists
    if (!TERRAIN_MATERIALS_RANGED[material]) {
      console.warn(`Invalid material '${material}', using 'grass'`);
      data.tiles[i] = 'grass'; // Fallback
    }
  }
  
  // Continue with import...
}
```

### 13. **Likely Issue #3: No Forced Redraw**

**Problem**: After loading terrain, the game may not trigger a redraw immediately.

**Solution**: Force redraw after level load:
```javascript
function loadLevel(levelData) {
  const map = new gridTerrain(...);
  const importer = new TerrainImporter(map);
  importer.importFromJSON(levelData.terrainData);
  
  mapManager.registerMap(levelData.id, map, true);
  
  // ⚠️ Force redraw
  if (typeof window.redraw === 'function') {
    window.redraw();
    window.redraw(); // Multiple calls for layers
    window.redraw();
  }
}
```

### 14. **Likely Issue #4: Coordinate System Not Updated**

**Problem**: Tiles have cached coordinate positions (`_coordSysPos`) that may be stale after loading.

**Solution**: Reset coordinate update IDs:
```javascript
_importFull(terrain, data) {
  let index = 0;
  for (let y = 0; y < totalTilesY; y++) {
    for (let x = 0; x < totalTilesX; x++) {
      const tile = terrain.getArrPos([x, y]);
      tile.setMaterial(data.tiles[index]);
      tile.assignWeight();
      
      // ⚠️ Reset coordinate cache
      tile._coordSysUpdateId = -1;
      tile._coordSysPos = NONE;
      
      index++;
    }
  }
}
```

### 15. **Likely Issue #5: Images Not Loaded**

**Problem**: If level is loaded before `preload()` completes, terrain images may not be available.

**Check**:
```javascript
function verifyTerrainImages() {
  const requiredImages = [
    'GRASS_IMAGE', 'DIRT_IMAGE', 'STONE_IMAGE', 
    'MOSS_IMAGE', 'WATER', 'SAND_IMAGE'
  ];
  
  for (const imgName of requiredImages) {
    if (!window[imgName]) {
      console.error(`Missing terrain image: ${imgName}`);
      return false;
    }
  }
  
  return true;
}
```

**Solution**: Only allow level loading after preload:
```javascript
let terrainImagesLoaded = false;

function preload() {
  terrainPreloader();
  terrainImagesLoaded = true;
}

function loadLevel(levelData) {
  if (!terrainImagesLoaded) {
    console.error("Cannot load level: terrain images not loaded");
    return;
  }
  
  // Continue with load...
}
```

---

## 🛠️ DEBUG CHECKLIST

### Step 1: Verify JSON Structure
```javascript
console.log('Level Data:', levelData);
console.log('Terrain Tiles:', levelData.terrainData.tiles.slice(0, 10));
console.log('Unique Materials:', [...new Set(levelData.terrainData.tiles)]);
```

### Step 2: Verify Material Names
```javascript
const materials = levelData.terrainData.tiles;
const validMaterials = Object.keys(TERRAIN_MATERIALS_RANGED);

for (const mat of materials) {
  if (!validMaterials.includes(mat)) {
    console.error(`Invalid material in JSON: '${mat}'`);
  }
}
```

### Step 3: Verify Cache Invalidation
```javascript
console.log('Before Import - Cache Valid:', map._cacheValid);
importer.importFromJSON(levelData.terrainData);
console.log('After Import - Cache Valid:', map._cacheValid); // Should be false
console.log('After Import - Cache Object:', map._terrainCache); // Should be null
```

### Step 4: Verify Tile Materials
```javascript
const tile = map.getArrPos([0, 0]);
console.log('Tile [0,0] Material:', tile.getMaterial());
console.log('Tile [0,0] Render Func:', TERRAIN_MATERIALS_RANGED[tile.getMaterial()]);
```

### Step 5: Verify Rendering
```javascript
// Add to Tile.render()
render(coordSys, ctx=window) {
  console.log(`Rendering tile at (${this._x},${this._y}) with material '${this._materialSet}'`);
  
  if (!TERRAIN_MATERIALS_RANGED[this._materialSet]) {
    console.error(`Missing render function for material '${this._materialSet}'`);
  }
  
  // Continue with render...
}
```

---

## 🎯 RECOMMENDED FIXES

### Fix 1: Enhanced TerrainImporter Validation
```javascript
_importFull(terrain, data) {
  const validMaterials = Object.keys(TERRAIN_MATERIALS_RANGED);
  
  let index = 0;
  for (let y = 0; y < totalTilesY; y++) {
    for (let x = 0; x < totalTilesX; x++) {
      const tile = terrain.getArrPos([x, y]);
      let material = data.tiles[index];
      
      // Validate material
      if (!validMaterials.includes(material)) {
        console.warn(`Invalid material '${material}' at [${x},${y}], using 'grass'`);
        material = 'grass';
      }
      
      tile.setMaterial(material);
      tile.assignWeight();
      
      // Reset coordinate cache
      tile._coordSysUpdateId = -1;
      tile._coordSysPos = NONE;
      
      index++;
    }
  }
  
  // Force cache invalidation
  terrain.invalidateCache();
  
  console.log(`Imported ${index} tiles successfully`);
}
```

### Fix 2: Enhanced Level Loading Workflow
```javascript
function loadLevel(levelData) {
  try {
    // Validate terrain images loaded
    if (!verifyTerrainImages()) {
      throw new Error("Terrain images not loaded");
    }
    
    // Create new map
    const { gridSizeX, gridSizeY, chunkSize, tileSize, seed } = levelData.terrainData.metadata;
    const map = new gridTerrain(
      gridSizeX, gridSizeY, seed, 
      chunkSize, tileSize, 
      [windowWidth, windowHeight]
    );
    
    // Import terrain
    const importer = new TerrainImporter(map);
    const success = importer.importFromJSON(levelData.terrainData);
    
    if (!success) {
      throw new Error("Failed to import terrain data");
    }
    
    // Register with MapManager
    mapManager.registerMap(levelData.id, map, true);
    
    // Force cache rebuild
    map.invalidateCache();
    
    // Force multiple redraws
    if (typeof window.redraw === 'function') {
      for (let i = 0; i < 3; i++) {
        window.redraw();
      }
    }
    
    console.log(`Level '${levelData.name}' loaded successfully`);
    return true;
    
  } catch (error) {
    console.error("Failed to load level:", error);
    return false;
  }
}
```

### Fix 3: Add Cache Debug Logging
```javascript
// In gridTerrain.js
invalidateCache() {
  console.log("[Cache] Invalidating terrain cache");
  this._cacheValid = false;
  this._terrainCache = null;
  this._cacheViewport = null;
}

render() {
  if (!this._cacheValid) {
    console.log("[Cache] Rebuilding terrain cache");
    this._rebuildCache();
  }
  
  console.log("[Cache] Rendering cached terrain");
  // Continue with render...
}
```

---

## 📋 NEXT STEPS

### Immediate Actions (Fix Visual Bug)
1. ✅ **Add material validation** in `TerrainImporter._importFull()`
2. ✅ **Reset tile coordinate cache** after import
3. ✅ **Force cache invalidation** after import
4. ✅ **Add debug logging** to cache system
5. ✅ **Verify terrain images loaded** before level load
6. ✅ **Force multiple redraws** after level load

### Short-Term (Level Selection)
1. Create `LevelMetadata` class (name, description, thumbnail)
2. Create `LevelStorage` class (save/load to LocalStorage)
3. Create `LevelSelectionMenu` UI (grid view, level cards)
4. Add thumbnail generation (capture terrain preview)
5. Add level import/export buttons (JSON file I/O)

### Long-Term (Level System)
1. Create level editor metadata panel (set name, description)
2. Add level categories/tags (forest, desert, cave, etc.)
3. Add level difficulty settings
4. Add level objectives/quests integration
5. Add procedural level generation presets
6. Add level sharing/community features

---

## 🔗 Related Files

**Core Systems**:
- `Classes/terrainUtils/tiles.js` - Tile class, material definitions
- `Classes/terrainUtils/gridTerrain.js` - Terrain map, cache system
- `Classes/terrainUtils/TerrainExporter.js` - Export to JSON
- `Classes/terrainUtils/TerrainImporter.js` - Import from JSON
- `Classes/managers/MapManager.js` - Map registry, switching

**Rendering**:
- `Classes/rendering/RenderLayerManager.js` - Layer system
- `sketch.js` - Main loop, preload, setup

**Level Editor**:
- `Classes/systems/ui/LevelEditor.js` - Edit terrain
- `Classes/ui/SaveDialog.js` - Save UI
- `Classes/ui/LoadDialog.js` - Load UI

**Documentation**:
- `docs/quick-reference-mapmanager.md` - MapManager guide
- `docs/TERRAIN_IMPORT_EXPORT_IMPLEMENTATION.md` - Import/export docs
- `docs/LEVEL_EDITOR_SETUP.md` - Level editor docs

---

## 🧪 Test Cases Needed

### Test: Material Import Validation
```javascript
it('should validate material names during import', function() {
  const invalidData = {
    metadata: { gridSizeX: 2, gridSizeY: 2, chunkSize: 1 },
    tiles: ['grass', 'INVALID_MATERIAL', 'stone', 'dirt']
  };
  
  const importer = new TerrainImporter(terrain);
  const success = importer.importFromJSON(invalidData);
  
  expect(success).to.be.true;
  expect(terrain.getArrPos([1,0]).getMaterial()).to.equal('grass'); // Fallback
});
```

### Test: Cache Invalidation
```javascript
it('should invalidate cache after import', function() {
  terrain._cacheValid = true;
  terrain._terrainCache = createGraphics(100, 100);
  
  const importer = new TerrainImporter(terrain);
  importer.importFromJSON(validData);
  
  expect(terrain._cacheValid).to.be.false;
  expect(terrain._terrainCache).to.be.null;
});
```

### Test: Coordinate Reset
```javascript
it('should reset tile coordinate cache after import', function() {
  const tile = terrain.getArrPos([0, 0]);
  tile._coordSysUpdateId = 999;
  tile._coordSysPos = [100, 200];
  
  const importer = new TerrainImporter(terrain);
  importer.importFromJSON(validData);
  
  expect(tile._coordSysUpdateId).to.equal(-1);
  expect(tile._coordSysPos).to.equal(NONE);
});
```

---

**END OF INVESTIGATION**
