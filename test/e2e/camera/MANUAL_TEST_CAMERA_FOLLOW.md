# Manual Testing Instructions: Camera Following in Custom Levels

## Setup
1. Ensure dev server is running: `npm run dev`
2. Open browser to http://localhost:8000
3. Open browser console (F12)

## Test Steps

### 1. Load Custom Level
- Game should automatically load a custom level on start
- Check console for these logs:
  ```
  [loadCustomLevel] Camera now following queen ant
  [CameraManager.followEntity] Called with entity: [entity_id]
  [CameraManager.followEntity] Follow enabled, target set to: [entity_id]
  [CameraManager.followEntity] Centering on entity at: [x] [y]
  ```

### 2. Verify Camera State
Run this in console:
```javascript
console.log('Follow enabled:', cameraManager.cameraFollowEnabled);
console.log('Follow target:', cameraManager.cameraFollowTarget);
console.log('Camera position:', cameraManager.cameraX, cameraManager.cameraY);
console.log('Queen position:', queenAnt.x, queenAnt.y);
```

Expected:
- `cameraFollowEnabled` should be `true`
- `cameraFollowTarget` should be the queen object
- Camera should be centered on queen

### 3. Test Camera Following
Run this in console to move the queen:
```javascript
// Store original position
const originalX = queenAnt.x;
const originalY = queenAnt.y;

// Move queen
queenAnt.x = 1500;
queenAnt.y = 700;

// Wait 1 second, then check camera
setTimeout(() => {
  console.log('Queen moved to:', queenAnt.x, queenAnt.y);
  console.log('Camera at:', cameraManager.cameraX, cameraManager.cameraY);
  
  // Calculate expected camera position
  const queenCenterX = queenAnt.x + (queenAnt.width || 60) / 2;
  const queenCenterY = queenAnt.y + (queenAnt.height || 60) / 2;
  const expectedCamX = queenCenterX - (cameraManager.canvasWidth / cameraManager.cameraZoom / 2);
  const expectedCamY = queenCenterY - (cameraManager.canvasHeight / cameraManager.cameraZoom / 2);
  
  console.log('Expected camera:', expectedCamX, expectedCamY);
  console.log('Delta:', Math.abs(cameraManager.cameraX - expectedCamX), Math.abs(cameraManager.cameraY - expectedCamY));
}, 1000);
```

Expected:
- Camera should follow queen to new position
- Delta should be < 50 pixels

### 4. Check Update Loop
Watch console during gameplay. You should see (every frame):
```
[CameraManager.update] Following target: [id] at [x] [y]
[CameraManager.update] Camera now at: [x] [y]
```

If you DON'T see these logs:
- Camera follow is not enabled
- Or update() is not being called

### 5. Test Arrow Keys
Press RIGHT arrow key 5 times.

Expected:
- Camera should NOT move (arrow keys disabled in IN_GAME state)
- Follow should remain enabled

### 6. Diagnostic Script
Run the diagnostic script:
```javascript
// Copy contents of test/e2e/camera/test_camera_follow_manual.js
// and run diagnoseCameraFollow()
```

## Common Issues

### Issue: Camera not following
**Symptoms**: Camera stays at one position, doesn't follow queen
**Possible causes**:
1. `cameraFollowEnabled` is false
2. `cameraFollowTarget` is null
3. `update()` not being called
4. Queen not moving

**Debug**:
```javascript
console.log('Follow enabled:', cameraManager.cameraFollowEnabled);
console.log('Follow target:', cameraManager.cameraFollowTarget);
console.log('Game state:', GameState.getState());
console.log('isInGame:', GameState.isInGame());
```

### Issue: Camera following but offset
**Symptoms**: Camera follows but is offset from queen center
**Possible causes**:
1. Canvas size mismatch
2. Zoom not accounted for

**Debug**:
```javascript
console.log('Canvas:', cameraManager.canvasWidth, cameraManager.canvasHeight);
console.log('Zoom:', cameraManager.cameraZoom);
console.log('Queen size:', queenAnt.width, queenAnt.height);
```

### Issue: Console logs spamming
**Symptoms**: Too many console logs
**Fix**: Comment out the debug logs in CameraManager.js update() method

## Expected Console Output

When working correctly, you should see (once):
```
[loadCustomLevel] Camera now following queen ant
[CameraManager.followEntity] Called with entity: Queen
[CameraManager.followEntity] Follow enabled, target set to: Queen
[CameraManager.followEntity] Centering on entity at: 2848 608
```

Then every frame (can be spammy, comment out if needed):
```
[CameraManager.update] Following target: entity_xxx at 2848 608
[CameraManager.update] Camera now at: 2400 338
```
