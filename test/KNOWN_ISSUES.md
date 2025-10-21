# Known Issues - Test Suite

This document tracks **known bugs that have test coverage** but are not yet fixed. These tests are expected to fail until the underlying issues are resolved.

---

## ?? Recently Fixed Issues

### 1. DraggablePanel: Boundary Detection Bug (FIXED ?)

**File**: Classes/systems/ui/DraggablePanel.js  
**Fixed**: 2025-10-18  
**Tests**: 	est/unit/draggablePanel.test.js - All 15 tests passing ?

**Issue**:
The `isPointInBounds()` method used `<=` instead of `<` for boundary checks, causing off-by-one errors.

**Root Cause**:
Inclusive upper bounds allowed mouse detection one pixel beyond actual panel boundaries.

**Fix Applied**:
Changed to exclusive upper bounds: `x < bounds.x + bounds.width` and `y < bounds.y + bounds.height`

**Impact**: 
- ? Mouse detection now correctly respects panel boundaries
- ? Minimized panels correctly ignore clicks below title bar
- ? No off-by-one errors in hit detection
- ? State persistence working correctly

---

## 🔥 Active Issues

### 1. Grid Coordinate System: Y-Axis Span Boundary Check Bug

**File**: Classes/terrainUtils/grid.js  
**Discovered**: 2025-10-21  
**Priority**: HIGH  
**Impact**: Terrain tile queries fail at certain Y coordinates

**Issue**:
The Grid class's `get()` method has an inverted Y-axis boundary check that incorrectly rejects valid tile queries. When querying tiles in the middle of a chunk's Y-range, the OOB check fails even though the coordinates are within the chunk's span.

**Example**:
- Chunk span: `((8,16), (16,8))` - TopLeft=(8,16), BotRight=(16,8)
- Query position: `(15, 9)` - should be VALID (X: 8-16, Y: 8-16)
- Grid.get() check fails: `9 < 16` is FALSE, `9 >= 8` is TRUE → incorrectly marked OOB

**Root Cause** (grid.js line ~185):
```javascript
if (relPos[0]<this._spanTopLeft[0] || relPos[0]>=this._spanBotRight[0] || 
    relPos[1]<this._spanTopLeft[1] || relPos[1]>=this._spanBotRight[1])
```
The Y-axis check uses OR logic with inverted comparisons, failing for valid middle-range values.

**Current Workaround**:
MapManager.getTileAtGridCoords() bypasses Grid.get() by directly accessing rawArray after doing its own span validation.

**Proper Fix Required**:
Fix Grid.get() boundary check to correctly handle inverted Y-axis:
```javascript
// Y should be: <= spanTopLeft[1] AND >= spanBotRight[1]
const yInRange = relPos[1] <= this._spanTopLeft[1] && relPos[1] >= this._spanBotRight[1];
if (xOutOfRange || !yInRange) { /* OOB */ }
```

**Blocked Systems**:
- Any direct Grid.get() usage with inverted Y coordinates
- Tile coordinate debugging/visualization
- Potentially affects terrain pathfinding if it uses Grid.get()

**Tests Needed**:
- Unit tests for Grid.get() with inverted Y-axis spans
- Integration tests for tile queries across chunk boundaries
- Verify terrain queries work at all Y positions in chunks

---

## 📊 Statistics

- **Total Known Issues**: 1
- **High Priority**: 1
- **Medium Priority**: 0
- **Low Priority**: 0
- **Recently Fixed**: 1

---

## ?? Testing Standards

All issues tracked here must have:
1. ? Automated test coverage
2. ? Clear expected vs actual behavior
3. ? Root cause analysis
4. ? Fix requirements documented

See [TESTING_METHODOLOGY_STANDARDS.md](../docs/standards/testing/TESTING_METHODOLOGY_STANDARDS.md) for details.
