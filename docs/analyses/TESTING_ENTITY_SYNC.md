# Quick Testing Guide: Entity-Terrain Synchronization

## What Was Fixed
Entities now move with the terrain when you pan the camera (arrow keys). Previously, entities stayed in place while the terrain moved.

## How to Test (5 minutes)

### 1. Basic Camera Pan Test ⭐ MOST IMPORTANT
1. Load the game in browser: http://localhost:8000
2. Wait for ants to spawn on screen
3. **Press arrow keys** (Up/Down/Left/Right) to pan camera
4. **Expected**: Ants move smoothly with the terrain
5. **Old bug**: Ants would stay in place while terrain moved

### 2. Entity Movement Test
1. Click on an ant to select it (green outline)
2. Right-click somewhere else to command movement
3. Pan camera while ant is moving
4. **Expected**: Movement line stays connected to ant and target

### 3. Selection Highlight Test
1. Select an ant by clicking it
2. Pan camera in all directions
3. **Expected**: Green selection highlight stays on the ant

### 4. Multiple Entities Test
1. Wait for several ants to spawn
2. Pan camera rapidly in different directions
3. **Expected**: All ants move together with terrain, no visual glitches

## Console Debug Commands

```javascript
// Check if coordinate conversion is working
const ant = antManager.getAllAnts()[0];
console.log('Ant world position:', ant.getPosition());
console.log('Camera tile position:', g_map2.renderConversion._camPosition);

// Visualize spatial grid (optional - different system)
visualizeSpatialGrid();

// Check entity count
console.log('Total ants:', antManager.getAllAnts().length);
```

## What to Look For

### ✅ GOOD (Working correctly)
- Ants stay in same spot relative to terrain when camera moves
- Selection highlights move with ants
- Movement lines stay connected
- No visual stuttering or jumping

### ❌ BAD (Bug not fixed)
- Ants slide across screen when camera pans
- Selection highlights become disconnected
- Ants appear to teleport
- Visual glitches or flickering

## If Something Goes Wrong

1. **Check browser console** (F12) for errors
2. **Clear cache**: Run clearChromeCache task or Ctrl+Shift+Del
3. **Verify dev server**: Should be running on port 8000
4. **Check TILE_SIZE**: Should be defined as 32

## Rollback if Needed

If entities are behaving worse than before:
```bash
git diff Classes/rendering/Sprite2d.js
git diff Classes/controllers/RenderController.js
git checkout Classes/rendering/Sprite2d.js Classes/controllers/RenderController.js
```

## Technical Details (For Debugging)

### Files Modified
- `Classes/rendering/Sprite2d.js` - Sprite rendering with coordinate conversion
- `Classes/controllers/RenderController.js` - Highlights, indicators, debug rendering

### Coordinate Conversion
```javascript
// Entities now convert: World Pixels → Tile Coords → Screen Pixels
const tileX = worldX / 32;  // 32 = TILE_SIZE
const screenPos = g_map2.renderConversion.convPosToCanvas([tileX, tileY]);
```

### Camera Position
- **CameraManager**: Stores camera in pixels
- **camRenderConverter**: Stores camera in tiles
- **Synced via**: `g_map2.setCameraPosition([tileX, tileY])`

---

**Expected testing time**: 5-10 minutes  
**Critical test**: #1 (Camera Pan) - if this works, everything else should work
