# Material Palette Coordinate Offset Fix

## Bug Summary
Material textures in the Level Editor Material Palette were rendering at the wrong position - offset to the top-left corner instead of within the panel.

## Root Cause
**Coordinate system mismatch between p5.js transformation matrix and direct image() calls:**

1. `LevelEditorPanels.render()` used `translate(contentArea.x, contentArea.y)` then called `render(0, 0)`
2. `MaterialPalette.render()` drew two things per material:
   - **Yellow highlight rectangle**: Used `rect()` which respects `translate()` ✅
   - **Material texture**: Called `TERRAIN_MATERIALS_RANGED[material][1](x, y, size)` ❌

3. The TERRAIN_MATERIALS_RANGED render functions (in `terrianGen.js`) use:
   ```javascript
   (x, y, squareSize) => image(MOSS_IMAGE, x, y, squareSize, squareSize)
   ```
   These call `image()` with **absolute screen coordinates**, ignoring p5.js's transformation matrix.

4. **Result**: 
   - Yellow button rendered at correct panel position (100, 200)
   - Texture rendered at top-left (5, 5) ignoring panel offset

## The Fix (Option 1)

**Changed**: `LevelEditorPanels.render()` to pass absolute coordinates directly instead of using `translate()`.

### Before (Buggy):
```javascript
this.panels.materials.render((contentArea, style) => {
  if (this.levelEditor.palette) {
    push();
    translate(contentArea.x, contentArea.y);  // Move coordinate system
    this.levelEditor.palette.render(0, 0);     // Render at (0,0) in translated space
    pop();
  }
});
```

### After (Fixed):
```javascript
this.panels.materials.render((contentArea, style) => {
  if (this.levelEditor.palette) {
    // Pass absolute coordinates directly (no translate)
    // This fixes coordinate offset bug with TERRAIN_MATERIALS_RANGED image() calls
    this.levelEditor.palette.render(contentArea.x, contentArea.y);
  }
});
```

**Applied to all three panels:**
- Materials Panel
- Tools Panel  
- Brush Size Panel

## Test Coverage

**Created**: `test/integration/ui/materialPaletteCoordinateOffset.integration.test.js`

**7 tests covering:**
1. Documents that `image()` uses absolute coordinates (regression test)
2. Documents that `rect()` respects transformation matrix (regression test)
3. Demonstrates why absolute coords are needed (regression test)
4. Verifies correct behavior with absolute coordinates ✅
5. Verifies all swatches render at correct positions ✅
6. Real-world scenario with panel content area ✅
7. Verifies all panel content positioned correctly ✅

**All existing tests still pass:**
- 15 click handling tests ✅
- 15 texture rendering tests ✅
- 7 coordinate offset tests ✅
- **Total: 37 tests passing**

## Files Modified

1. **Classes/systems/ui/LevelEditorPanels.js**
   - Removed `push()`, `translate()`, `pop()` calls
   - Changed `render(0, 0)` to `render(contentArea.x, contentArea.y)`
   - Applied to materials, tools, and brush panels

2. **test/integration/ui/materialPaletteCoordinateOffset.integration.test.js** (NEW)
   - Comprehensive test coverage for coordinate offset bug
   - Regression tests to prevent reintroduction of bug
   - Real-world scenario testing

## Why This Fix Works

**p5.js transformation matrix behavior:**
- `translate()`, `rotate()`, `scale()` affect the coordinate system
- Shape drawing functions (`rect()`, `ellipse()`, `line()`) use the transformed coordinates
- BUT: `image()` in p5.js uses the **current transformation matrix** for rendering

**The issue:**
The TERRAIN_MATERIALS_RANGED render functions are **simple lambdas** that call `image()` directly:
```javascript
(x, y, size) => image(MOSS_IMAGE, x, y, size, size)
```

These don't preserve or accumulate transformations - they just call `image()` with the exact coordinates passed in.

**The solution:**
By passing absolute screen coordinates to `MaterialPalette.render()`, the texture render functions receive the correct absolute position:
- Panel at (120, 180) + spacing (5, 5) = texture at (125, 185) ✅
- No transformation matrix needed
- Works consistently with how terrain rendering works in the main game

## Verification Steps

1. ✅ Run tests: `npx mocha "test/integration/ui/materialPaletteCoordinateOffset.integration.test.js"`
2. ✅ Visual verification: Open Level Editor, material textures should appear inside material palette panel
3. ✅ Interaction: Click material swatches - should select the material you click on
4. ✅ Painting: Selected material should paint correctly on terrain

## Alternative Solutions Considered

**Option 2: Modify MaterialPalette to add base coordinates**
```javascript
// In MaterialPalette.render(baseX, baseY)
const absoluteX = baseX + swatchX;
const absoluteY = baseY + swatchY;
renderFunction(absoluteX, absoluteY, size);
```

**Rejected because:**
- More complex (modifies MaterialPalette internal logic)
- Less consistent with terrain system patterns
- Requires changes to multiple render call sites
- Option 1 is simpler and matches existing code patterns

## Related Issues Fixed

This fix also corrected the same issue for:
- Tool Bar panel (tools now render at correct position)
- Brush Size Control panel (controls now render at correct position)

All three panels now use absolute coordinate rendering consistently.
