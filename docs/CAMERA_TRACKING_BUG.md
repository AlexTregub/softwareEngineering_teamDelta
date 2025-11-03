# Camera System Issues - Bug Documentation

## 🐛 Bug Report: Camera Not Tracking Queen on Custom Level Load

### Date: November 3, 2025
### Severity: HIGH
### Status: Partially Fixed

---

## Summary

When loading a custom level via `loadCustomLevel('levels/CaveTutorial.json')`, the camera does NOT automatically jump to the queen ant's position, even though `cameraManager.followEntity(queen)` is called successfully.

---

## E2E Test Results

### Test 1: pw_camera_tracking_queen.js

**Initial State After Level Load:**
```
Queen Position: (2848, 608)
Camera Position: (2478, 338)
Camera Follow Enabled: true
Camera Follow Target: Queen (correct)
```

**Issues:**
- ❌ Camera NOT centered on queen (should be at ~(2448, 308) to center queen)
- ❌ Initial camera jump doesn't happen
- ✅ Camera follow IS enabled
- ✅ Follow target IS set to queen
- ✅ Arrow keys work (FIXED by adding setCameraPosition to SparseTerrainAdapter)

### Test 2: pw_camera_state_comparison.js

**Comparison Results:**
- PLAYING state (gridTerrain): ✅ Camera controls work
- IN_GAME state (SparseTerrain): ✅ Camera controls work (FIXED)
- Both terrains now have `setCameraPosition()` method

---

## Root Causes Identified

### ✅ FIXED: SparseTerrain Missing setCameraPosition()

**Problem:**
- `CameraManager.update()` calls `g_activeMap.setCameraPosition()` every frame
- SparseTerrain (custom levels) didn't have this method
- Camera updates silently failed in IN_GAME state

**Fix Applied:**
- Added `setCameraPosition(centerTilePos)` to `SparseTerrainAdapter`
- Camera now updates properly with SparseTerrain

**Files Changed:**
- `Classes/adapters/SparseTerrainAdapter.js` - Added setCameraPosition method

---

### ❌ NOT FIXED: Camera Doesn't Jump to Queen Initially

**Problem:**
- `cameraManager.followEntity(queen)` is called in `loadCustomLevel()`
- `followEntity()` calls `centerOnEntity(entity)` which should jump camera
- But camera remains at initial position (2478, 338) instead of centering on queen (2848, 608)

**Hypothesis:**
The camera centering happens BEFORE the game draw loop starts, so the camera position is set but then immediately overwritten or ignored.

**Sequence of Events:**
```
1. loadCustomLevel() starts
2. Entities spawn (queen at 2848, 608)
3. cameraManager.followEntity(queen) called
4. centerOnEntity() sets camera to (2448, 308) to center queen
5. GameState.goToGame() transitions to IN_GAME
6. Draw loop starts
7. Camera mysteriously at (2478, 338) instead of (2448, 308)
```

**Possible Causes:**
1. `CameraManager.initialize()` is called AFTER followEntity() and resets position
2. Camera clamping in `clampToBounds()` is moving camera away from queen
3. Camera position is being set somewhere else (CameraController sync issue?)
4. SparseTerrain bounds calculation is wrong

---

## Code Flow Analysis

### loadCustomLevel() Flow
```javascript
// sketch.js line ~595
if (queen) {
  window.queenAnt = queen;
  
  if (cameraManager && cameraManager.followEntity) {
    const followResult = cameraManager.followEntity(queen);
    // followResult returns true
    safeLogNormal('[loadCustomLevel] Camera now following queen ant');
  }
}

// Transition to IN_GAME state
GameState.goToGame();
```

### followEntity() Flow
```javascript
// CameraManager.js line ~632
followEntity(entity) {
  if (!entity) {
    this.cameraFollowEnabled = false;
    this.cameraFollowTarget = null;
    return false;
  }

  this.cameraFollowEnabled = true;
  this.cameraFollowTarget = entity;

  // Center camera on entity if it has valid coordinates
  if (typeof entity.x === 'number' && typeof entity.y === 'number') {
    this.centerOnEntity(entity);
  }

  return true;
}
```

### centerOnEntity() Flow
```javascript
// CameraManager.js line ~587
centerOnEntity(entity) {
  const center = this.getEntityWorldCenter(entity);
  if (center) {
    this.centerOn(center.x, center.y);
  }
}
```

---

## Verification Steps

### To Reproduce:
1. Start dev server: `npm run dev`
2. Open game in browser: `http://localhost:8000`
3. Click "Custom Level" button (loads CaveTutorial.json)
4. Observe: Camera NOT centered on queen

### To Test Fix:
1. Run E2E test: `node test/e2e/camera/pw_camera_tracking_queen.js`
2. Check console output for camera position vs queen position
3. View screenshot: `test/e2e/screenshots/camera/camera_tracking_queen.png`

---

## Proposed Solutions

### Option 1: Delay Camera Centering (After Draw Loop Starts)
```javascript
// In loadCustomLevel(), AFTER GameState.goToGame()
setTimeout(() => {
  if (window.queenAnt && window.cameraManager) {
    cameraManager.followEntity(window.queenAnt);
  }
}, 100);
```

### Option 2: Force Camera Update After Setting Follow
```javascript
// In CameraManager.followEntity(), after setting target
this.centerOnEntity(entity);
this.update(); // Force immediate update
this.clampToBounds(); // Apply bounds
```

### Option 3: Check Camera Initialization Order
- Verify `CameraManager.initialize()` isn't called after `followEntity()`
- Ensure `clampToBounds()` doesn't move camera away from queen

---

## Related Files

- `Classes/controllers/CameraManager.js` - Camera management, following, centering
- `sketch.js` - loadCustomLevel() function
- `Classes/adapters/SparseTerrainAdapter.js` - setCameraPosition() fix applied
- `test/e2e/camera/pw_camera_tracking_queen.js` - E2E test for this bug
- `test/e2e/camera/pw_camera_state_comparison.js` - PLAYING vs IN_GAME comparison

---

## Next Steps

1. ✅ Add setCameraPosition to SparseTerrainAdapter (DONE)
2. ⏳ Debug why centerOnEntity() doesn't work on initial load
3. ⏳ Test Option 1 (setTimeout delay)
4. ⏳ Add console logging to centerOnEntity() to see if it's being called
5. ⏳ Check if clampToBounds() is moving camera away from queen

---

## Test Commands

```bash
# Run camera tracking test
node test/e2e/camera/pw_camera_tracking_queen.js

# Run state comparison test
node test/e2e/camera/pw_camera_state_comparison.js

# View screenshots
start test/e2e/screenshots/camera/camera_tracking_queen.png
start test/e2e/screenshots/camera/camera_state_ingame.png
```
