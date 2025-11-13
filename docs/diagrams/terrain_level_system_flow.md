# Terrain & Level System Flow Diagrams

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TERRAIN SYSTEM                               │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│  MapManager  │ (Singleton: window.mapManager)
│              │
│ • _maps      │ Map<string, gridTerrain>
│ • _activeMap │ gridTerrain
│ • _activeMapId
└──────┬───────┘
       │ manages
       ↓
┌──────────────────┐
│  gridTerrain     │ (Level/Map)
│                  │
│ • chunkArray     │ Grid of Chunks
│ • _terrainCache  │ p5.Graphics (off-screen buffer)
│ • _cacheValid    │ boolean (dirty flag)
│ • renderConversion
└──────┬───────────┘
       │ contains
       ↓
┌──────────────┐
│   Chunk      │
│              │
│ • tileData   │ Grid of Tiles
│ • position   │
└──────┬───────┘
       │ contains
       ↓
┌──────────────┐
│    Tile      │
│              │
│ • _materialSet  │ 'grass'/'stone'/etc.
│ • _weight       │
│ • _x, _y        │
│ • render()      │
└──────┬───────────┘
       │ uses
       ↓
┌────────────────────────┐
│ TERRAIN_MATERIALS_RANGED
│                        │
│ 'grass' → render λ     │
│ 'stone' → render λ     │
│ 'dirt'  → render λ     │
│ ...                    │
└────────────────────────┘
       │ uses
       ↓
┌──────────────────┐
│ Terrain Images   │
│                  │
│ • GRASS_IMAGE    │
│ • STONE_IMAGE    │
│ • DIRT_IMAGE     │
│ • MOSS_IMAGE     │
│ ...              │
└──────────────────┘
```

---

## Level Loading Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      LEVEL LOADING WORKFLOW                          │
└─────────────────────────────────────────────────────────────────────┘

1. USER SELECTS LEVEL
   │
   ↓
┌────────────────────┐
│ LevelSelectionMenu │ (NOT YET IMPLEMENTED)
│ .startLevel(id)    │
└────────┬───────────┘
         │
         ↓
2. LOAD LEVEL DATA
   │
   ↓
┌─────────────────────┐
│ LevelStorage        │
│ .getLevel(id)       │
│                     │
│ Returns:            │
│ {                   │
│   id: 'level_001',  │
│   name: 'Forest',   │
│   terrainData: {    │
│     metadata: {...},│
│     tiles: [...]    │
│   },                │
│   entities: [...],  │
│   ...               │
│ }                   │
└────────┬────────────┘
         │
         ↓
3. CREATE NEW MAP
   │
   ↓
┌─────────────────────────────────────┐
│ const map = new gridTerrain(        │
│   gridSizeX, gridSizeY, seed,       │
│   chunkSize, tileSize, canvasSize   │
│ );                                  │
└────────┬────────────────────────────┘
         │
         ↓
4. IMPORT TERRAIN DATA
   │
   ↓
┌─────────────────────────────────────┐
│ const importer = new TerrainImporter│
│ importer.importFromJSON(            │
│   levelData.terrainData             │
│ );                                  │
│                                     │
│ ⚠️ CRITICAL STEPS:                 │
│ • Validate tile format              │
│ • Check material names valid        │
│ • Set tile._materialSet             │
│ • Call tile.assignWeight()          │
│ • Reset tile._coordSysUpdateId      │
│ • Call terrain.invalidateCache()    │
└────────┬────────────────────────────┘
         │
         ↓
5. REGISTER WITH MAPMANAGER
   │
   ↓
┌─────────────────────────────────────┐
│ mapManager.registerMap(             │
│   levelData.id,                     │
│   map,                              │
│   setActive: true                   │
│ );                                  │
│                                     │
│ ⚠️ CRITICAL:                       │
│ • Sets _activeMap = map             │
│ • Sets g_activeMap = map            │
│ • Calls map.invalidateCache()       │
└────────┬────────────────────────────┘
         │
         ↓
6. FORCE REDRAW
   │
   ↓
┌─────────────────────────────────────┐
│ for (let i = 0; i < 3; i++) {       │
│   window.redraw();                  │
│ }                                   │
└────────┬────────────────────────────┘
         │
         ↓
7. SPAWN ENTITIES
   │
   ↓
┌─────────────────────────────────────┐
│ levelData.entities.forEach(entity =>│
│   spawnEntity(entity);              │
│ );                                  │
└────────┬────────────────────────────┘
         │
         ↓
8. TRANSITION TO GAMEPLAY
   │
   ↓
┌─────────────────────────────────────┐
│ GameState.setState('PLAYING');      │
└─────────────────────────────────────┘
```

---

## Rendering Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         RENDERING PIPELINE                           │
└─────────────────────────────────────────────────────────────────────┘

sketch.js draw()
   │
   ↓
RenderLayerManager.render('PLAYING')
   │
   ├─> TERRAIN Layer
   │   │
   │   ↓
   │   g_activeMap.render()
   │   │
   │   ├─> Check cache valid?
   │   │   │
   │   │   ├─> YES: Draw cached terrain
   │   │   │   │
   │   │   │   └─> image(this._terrainCache, x, y)
   │   │   │
   │   │   └─> NO: Rebuild cache
   │   │       │
   │   │       ├─> Create p5.Graphics buffer
   │   │       │
   │   │       ├─> Iterate all visible chunks
   │   │       │   │
   │   │       │   └─> chunk.render()
   │   │       │       │
   │   │       │       └─> Iterate all tiles in chunk
   │   │       │           │
   │   │       │           └─> tile.render(coordSys, cacheCtx)
   │   │       │               │
   │   │       │               ├─> Get material: this._materialSet
   │   │       │               │
   │   │       │               ├─> Lookup render function:
   │   │       │               │   TERRAIN_MATERIALS_RANGED[material][1]
   │   │       │               │
   │   │       │               └─> Call render function:
   │   │       │                   ctx.image(GRASS_IMAGE, x, y, size, size)
   │   │       │
   │   │       ├─> Set cache valid flag
   │   │       │
   │   │       └─> Draw cache to screen
   │   │
   │   └─> Done
   │
   ├─> ENTITIES Layer
   │   └─> Render ants, buildings, etc.
   │
   ├─> EFFECTS Layer
   │   └─> Render particles, animations
   │
   ├─> UI_GAME Layer
   │   └─> Render HUD, panels
   │
   └─> UI_DEBUG Layer
       └─> Render debug overlays
```

---

## Cache Invalidation Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                   CACHE INVALIDATION TRIGGERS                        │
└─────────────────────────────────────────────────────────────────────┘

TRIGGER 1: Map Switching
   │
   ↓
MapManager.setActiveMap(newMapId)
   │
   └─> newMap.invalidateCache()
       │
       └─> _cacheValid = false
           _terrainCache = null

---

TRIGGER 2: Terrain Import
   │
   ↓
TerrainImporter.importFromJSON(data)
   │
   └─> terrain.invalidateCache()
       │
       └─> _cacheValid = false
           _terrainCache = null

---

TRIGGER 3: Tile Editing (Level Editor)
   │
   ↓
TerrainEditor.paint(x, y, material)
   │
   └─> tile.setMaterial(material)
       │
       └─> terrain.invalidateCache()
           │
           └─> _cacheValid = false
               _terrainCache = null

---

TRIGGER 4: Camera Movement (Viewport Change)
   │
   ↓
CameraManager.update()
   │
   └─> If viewport changed significantly
       │
       └─> terrain.invalidateCache()
           │
           └─> _cacheValid = false
               _terrainCache = null
```

---

## Material Lookup Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      MATERIAL RENDERING FLOW                         │
└─────────────────────────────────────────────────────────────────────┘

Tile has material: 'stone'
   │
   ↓
Tile.render(coordSys, ctx)
   │
   ├─> Get material name: this._materialSet ('stone')
   │
   ├─> Lookup in TERRAIN_MATERIALS_RANGED:
   │   TERRAIN_MATERIALS_RANGED['stone']
   │   │
   │   └─> Returns: [[0.57, 0.63], renderFunction]
   │
   ├─> Extract render function: [1]
   │
   └─> Call render function:
       renderFunction(x, y, size, ctx)
       │
       └─> ctx.image(STONE_IMAGE, x, y, size, size)

---

Material Lookup Table Structure:

TERRAIN_MATERIALS_RANGED = {
  'material_name': [
    [min_noise, max_noise],  // Index 0: Generation range
    (x, y, size, ctx) => {}  // Index 1: Render function
  ]
}

Example:
'grass': [
  [0, 1],                     // Always spawn (default)
  (x, y, size, ctx) => {      // Render lambda
    ctx.image(GRASS_IMAGE, x, y, size, size);
  }
]

'stone': [
  [0.57, 0.63],               // Spawn when noise in range
  (x, y, size, ctx) => {      // Render lambda
    ctx.image(STONE_IMAGE, x, y, size, size);
  }
]
```

---

## JSON Export/Import Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      EXPORT/IMPORT WORKFLOW                          │
└─────────────────────────────────────────────────────────────────────┘

EXPORT:
   │
   ↓
User clicks "Save" in Level Editor
   │
   ↓
const exporter = new TerrainExporter(terrain)
   │
   ↓
const data = exporter.exportToJSON({
  compressed: false,
  chunked: false,
  customMetadata: { name: 'Forest Level' }
})
   │
   ↓
JSON Structure Created:
{
  metadata: {
    version: '1.0',
    gridSizeX: 50,
    gridSizeY: 50,
    chunkSize: 8,
    tileSize: 32,
    seed: 12345,
    exportDate: '2025-11-13T...'
  },
  tiles: [
    'grass', 'grass', 'stone', 'dirt',
    'moss', 'water', 'sand', ...
  ]
}
   │
   ↓
SaveDialog displays → User saves to LocalStorage/File

═══════════════════════════════════════════════════════════════════════

IMPORT:
   │
   ↓
User clicks "Load" in Level Editor or Level Selection
   │
   ↓
LoadDialog displays → User selects level
   │
   ↓
const levelData = JSON.parse(jsonString)
   │
   ↓
const map = new gridTerrain(...)
   │
   ↓
const importer = new TerrainImporter(map)
   │
   ↓
importer.importFromJSON(levelData)
   │
   ├─> Validate data structure
   │
   ├─> Iterate tiles array:
   │   for (let i = 0; i < tiles.length; i++) {
   │     const material = tiles[i]; // 'grass', 'stone', etc.
   │     const tile = terrain.getArrPos([x, y]);
   │     
   │     tile.setMaterial(material); // ⚠️ Sets _materialSet
   │     tile.assignWeight();
   │     tile._coordSysUpdateId = -1; // Reset cache
   │   }
   │
   └─> terrain.invalidateCache() // ⚠️ Force re-render
   │
   ↓
mapManager.registerMap(levelId, map, true)
   │
   └─> map.invalidateCache() again
   │
   ↓
Level loaded successfully
```

---

## Problem Investigation Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│               WHY TERRAIN VISUALS DON'T UPDATE                       │
└─────────────────────────────────────────────────────────────────────┘

SYMPTOM:
  Terrain data loads from JSON, but visuals don't change
  │
  ↓
INVESTIGATE:

1. Check tile materials were imported
   │
   ↓
   const tile = map.getArrPos([0, 0]);
   console.log(tile.getMaterial()); // Should show material from JSON
   │
   ├─> YES: Materials imported ✅
   │   │
   │   └─> Continue to step 2
   │
   └─> NO: Import failed ❌
       │
       └─> Check: TerrainImporter.importFromJSON() logic
           • Validate JSON structure
           • Check array indexing
           • Check setMaterial() calls

2. Check material names are valid
   │
   ↓
   const materials = [...new Set(levelData.tiles)];
   const validMaterials = Object.keys(TERRAIN_MATERIALS_RANGED);
   │
   materials.forEach(mat => {
     if (!validMaterials.includes(mat)) {
       console.error('Invalid material:', mat); ❌
     }
   });
   │
   ├─> All valid ✅
   │   │
   │   └─> Continue to step 3
   │
   └─> Invalid materials found ❌
       │
       └─> FIX: Add validation in importer
           • Check material exists in TERRAIN_MATERIALS_RANGED
           • Fallback to 'grass' if invalid

3. Check cache invalidated
   │
   ↓
   console.log('Cache Valid:', map._cacheValid); // Should be false
   console.log('Cache Object:', map._terrainCache); // Should be null
   │
   ├─> Cache invalidated ✅
   │   │
   │   └─> Continue to step 4
   │
   └─> Cache still valid ❌
       │
       └─> FIX: Call invalidateCache() after import
           • In TerrainImporter.importFromJSON()
           • In MapManager.setActiveMap()

4. Check coordinate cache reset
   │
   ↓
   const tile = map.getArrPos([0, 0]);
   console.log('Coord Update ID:', tile._coordSysUpdateId); // Should be -1
   console.log('Coord Pos:', tile._coordSysPos); // Should be NONE
   │
   ├─> Cache reset ✅
   │   │
   │   └─> Continue to step 5
   │
   └─> Cache not reset ❌
       │
       └─> FIX: Reset in importer
           tile._coordSysUpdateId = -1;
           tile._coordSysPos = NONE;

5. Check terrain images loaded
   │
   ↓
   console.log('GRASS_IMAGE:', typeof GRASS_IMAGE); // Should be 'object'
   console.log('STONE_IMAGE:', typeof STONE_IMAGE); // Should be 'object'
   │
   ├─> Images loaded ✅
   │   │
   │   └─> Continue to step 6
   │
   └─> Images missing ❌
       │
       └─> FIX: Ensure preload() called before level load
           • Check terrainPreloader() in preload()
           • Don't allow level load until images ready

6. Check forced redraw
   │
   ↓
   After level load, check if redraw() was called
   │
   ├─> Redraw called ✅
   │   │
   │   └─> Continue to step 7
   │
   └─> No redraw ❌
       │
       └─> FIX: Force multiple redraws after load
           for (let i = 0; i < 3; i++) {
             window.redraw();
           }

7. Check render function exists
   │
   ↓
   const material = tile.getMaterial();
   const renderFunc = TERRAIN_MATERIALS_RANGED[material][1];
   console.log('Render Function:', typeof renderFunc); // Should be 'function'
   │
   ├─> Render function exists ✅
   │   │
   │   └─> Visuals should now work!
   │
   └─> No render function ❌
       │
       └─> FIX: Add material to TERRAIN_MATERIALS_RANGED
           with proper render lambda
```

---

**END OF DIAGRAMS**
