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

## ?? Active Issues

*No active issues! All tests passing.* ??

---

## ?? Statistics

- **Total Known Issues**: 0
- **High Priority**: 0
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
