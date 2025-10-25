# Moss & Stone Level Implementation Guide

## Overview
A custom level featuring alternating columns of moss and stone terrain has been created. This level is perfect for testing terrain-based speed modifications since:
- **Moss columns** → `IN_MUD` terrain modifier (30% speed)
- **Stone columns** → `ON_ROUGH` terrain modifier (80% speed)

## Files Created/Modified

### New Files
1. **`Classes/terrainUtils/customLevels.js`** - Custom level generation functions
   - `createMossStoneColumnLevel()` - Alternating vertical columns
   - `createMossStoneCheckerboardLevel()` - Checkerboard pattern (bonus)
   - `applyColumnPattern()` - Column pattern logic
   - `applyCheckerboardPattern()` - Checkerboard logic

### Modified Files
1. **`index.html`** - Added script import for customLevels.js
2. **`sketch.js`** - Added level loading and switching functions
   - `loadMossStoneLevel()` - Creates and registers moss/stone level
   - `switchToLevel(levelId)` - Switches to level and starts game
3. **`Classes/systems/ui/menu.js`** - Added "Moss & Stone Level" button to main menu

## How It Works

### Level Generation
```javascript
// Creates terrain with alternating moss/stone columns
const terrain = createMossStoneColumnLevel(
  CHUNKS_X,      // Number of chunks horizontally
  CHUNKS_Y,      // Number of chunks vertically
  seed,          // Random seed
  CHUNK_SIZE,    // Size of each chunk (default: 8 tiles)
  TILE_SIZE,     // Size of each tile (default: 32px)
  [windowWidth, windowHeight]  // Canvas dimensions
);
```

### Pattern Logic
```
Column Index:  0  1  2  3  4  5  6  7  8  9
Material:      M  S  M  S  M  S  M  S  M  S
Terrain Type:  🟫 🪨 🟫 🪨 🟫 🪨 🟫 🪨 🟫 🪨
Speed:         30% 80% 30% 80% 30% 80% 30% 80%

M = Moss (moss_0)
S = Stone
```

### Menu Integration
The main menu now has a new button between "Start Game" and "Options":
- **"Moss & Stone Level"** (blue/info style)
  - Creates the level if it doesn't exist
  - Switches to the level
  - Starts the game automatically

### Level Management
```javascript
// The level is registered with MapManager as 'mossStone'
mapManager.registerMap('mossStone', terrain, true);

// Switch to it later
switchToLevel('mossStone');  // From menu button
// or
setActiveMap('mossStone');   // Direct switch
```

## Testing the Level

### Visual Testing
1. Start the game
2. Click **"Moss & Stone Level"** button on main menu
3. Game loads with alternating moss (green) and stone (gray) columns
4. Spawn ants using your existing spawn system

### Terrain Speed Testing
```javascript
// In browser console after loading level:

// Test terrain indicators
testTerrainIndicators()  // Cycles through terrain types

// Show all terrain effects on ants
showAllTerrainEffects()  // Sets different ants to different terrains

// Check specific ant's terrain
testAntSpeed(0)  // Shows speed analysis for first ant

// Test column detection
const ant = spatialGridManager.getEntitiesByType('Ant')[0];
const tile = g_activeMap.getTileAtPosition(ant.x, ant.y);
console.log('Tile material:', tile.getMaterial());
console.log('Terrain modifier:', ant._stateMachine.terrainModifier);
```

### Expected Behavior
When ants move across the level:
1. **On moss columns**: 
   - Visual indicator: 🟫 (brown mud square)
   - Speed: 30% of base speed
   - Terrain type: `IN_MUD`

2. **On stone columns**:
   - Visual indicator: 🪨 (gray rock)
   - Speed: 80% of base speed  
   - Terrain type: `ON_ROUGH`

3. **Visual feedback**:
   - Terrain indicator appears **above** state indicator
   - Only visible when terrain affects movement (not on DEFAULT)

## Console Commands

### Level Switching
```javascript
// Switch to moss/stone level
switchToLevel('mossStone')

// Switch back to normal level
switchToLevel('level1')

// List all registered maps
mapManager.listMaps()
```

### Terrain Testing (from terrainIndicatorTest.js)
```javascript
testTerrainIndicators()       // Cycle through all terrain types
setAntTerrain(0, 'IN_MUD')   // Set first ant to mud terrain
showAllTerrainEffects()       // Demo all terrain types at once
clearTerrainEffects()         // Reset all to DEFAULT
getTerrainIndicatorStatus()   // Show breakdown by terrain
```

### Terrain Speed Testing (from terrainSpeedTest.js)
```javascript
testTerrainSpeed()    // Comprehensive speed modifier tests
testAntSpeed(0)       // Individual ant speed analysis
```

## Architecture Notes

### Terrain Controller Integration
The moss and stone materials need to be mapped to terrain types in `TerrainController._mapTerrainType()`:

**Current implementation** (from earlier work):
```javascript
case 'moss_0':
case 'moss_1':
  return 'IN_MUD';

case 'stone':
  return 'ON_ROUGH';
```

These mappings should already be in place from the previous terrain indicator work.

### Level Persistence
- Level is created on first access (lazy loading)
- Cached in MapManager after creation
- Switching between levels preserves both terrains
- Each level has independent terrain state

### Custom Pattern Extensions
You can create new patterns by:
1. Add new function in `customLevels.js`
2. Apply custom logic to each chunk's tiles
3. Set `tile._materialSet` to desired material
4. Update `tile._weight` for pathfinding

Example custom patterns:
- Horizontal stripes
- Diagonal stripes
- Concentric circles
- Random patches
- Maze patterns

## Future Enhancements

### Additional Level Types
- **Water maze** - Navigate through water channels
- **Ice rink** - Large slippery areas (0% speed)
- **Mixed terrain** - All terrain types combined
- **Obstacle course** - Strategic placement for gameplay

### UI Improvements
- Level preview thumbnails
- Level description on hover
- Custom level creator (drag & drop)
- Save/load custom levels

### Gameplay Integration
- Level-specific objectives
- Different starting resources per level
- Level progression system
- Achievements per level

## Troubleshooting

### Issue: Level doesn't appear different
**Solution**: Check browser console for errors. Verify customLevels.js is loaded in index.html

### Issue: Terrain indicators not showing
**Solution**: Ensure TerrainController has moss→IN_MUD and stone→ON_ROUGH mappings

### Issue: Menu button doesn't work
**Solution**: Check that `switchToLevel` function is defined in sketch.js (global scope)

### Issue: Ants not detecting terrain
**Solution**: Verify TerrainController is initialized and detecting terrain every 200ms

### Issue: Visual pattern incorrect
**Solution**: Check chunk position calculation in `applyColumnPattern()`. Ensure absolute position includes chunk offset.

## Code References

### Key Functions
- **customLevels.js**: `createMossStoneColumnLevel()`
- **sketch.js**: `loadMossStoneLevel()`, `switchToLevel()`
- **menu.js**: MENU_CONFIGS.MENU array
- **TerrainController.js**: `_mapTerrainType()` method

### Related Systems
- **MapManager**: Level registration and switching
- **TerrainController**: Material → terrain type mapping  
- **RenderController**: Terrain indicator rendering
- **MovementController**: Speed modification based on terrain
- **AntStateMachine**: Terrain modifier state tracking

## Success Criteria

✅ **Implementation Complete When:**
1. Menu has "Moss & Stone Level" button
2. Clicking button loads alternating column level
3. Ants detect moss as IN_MUD (🟫 indicator, 30% speed)
4. Ants detect stone as ON_ROUGH (🪨 indicator, 80% speed)
5. Can switch between levels without errors
6. Visual indicators appear above entities on terrain

✅ **Testing Complete When:**
1. Console commands work for all terrain types
2. Speed modifiers apply correctly
3. Visual indicators render at correct positions
4. Level switching preserves state
5. No console errors during gameplay

---

**Status**: ✅ IMPLEMENTATION COMPLETE - Ready for testing!
