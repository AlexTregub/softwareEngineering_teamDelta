# Double Rendering Regression Prevention Tests

## Overview
This document describes the comprehensive regression test suite created to prevent the Level Editor panel double-rendering bug from recurring.

## Bug Summary
**Issue**: Level Editor panels (Materials, Tools, Brush Size) rendered twice per frame:
1. First by `LevelEditor.render()` with content callbacks ✅
2. Second by `DraggablePanelManager` without callbacks ❌ (background over content)

**Root Cause**: Interactive adapter (line 135 in `DraggablePanelManager.js`) called `this.render()` instead of `this.renderPanels(gameState)`

**Fix**: Changed line 135 to use `renderPanels()` which respects the `managedExternally: true` flag

## Test Suite Architecture

### 1. Unit Tests (`test/unit/ui/draggablePanelManagerDoubleRender.test.js`)
**Status**: ✅ 7/7 passing

**Tests**:
1. `renderPanels()` skips panels with `managedExternally=true`
2. `renderPanels()` renders panels WITHOUT `managedExternally` flag
3. `renderPanels()` skips invisible panels even without `managedExternally` flag
4. `render()` calls `panel.render()` for ALL panels (documents why it shouldn't be used)
5. Interactive adapter uses `renderPanels()` not `render()` to respect `managedExternally`
6. Level Editor panels not rendered when they have `managedExternally=true`
7. Only render each panel once per frame when using `renderPanels()`

**Run Command**:
```bash
npx mocha "test/unit/ui/draggablePanelManagerDoubleRender.test.js"
```

**Key Assertions**:
- Verifies `renderPanels()` method-level behavior
- Documents the difference between `render()` and `renderPanels()`
- Ensures `managedExternally` flag is respected at the lowest level

### 2. Integration Tests (`test/integration/ui/levelEditorDoubleRenderPrevention.integration.test.js`)
**Status**: ✅ 6/6 passing

**Test Suites**:
1. **Single frame rendering**: Verifies panels not rendered by `renderPanels()` when managed
2. **Interactive adapter integration**: Confirms adapter calls `renderPanels()` not `render()`
3. **Render order verification**: Checks managed panels maintain correct order
4. **Mixed panel scenario**: Verifies only non-managed panels rendered
5. **Regression test**: Ensures background never rendered without content for managed panels

**Run Command**:
```bash
npx mocha "test/integration/ui/levelEditorDoubleRenderPrevention.integration.test.js"
```

**Key Validations**:
- Full panel manager behavior with real panel instances
- Interactive adapter integration with RenderLayerManager
- Mixed scenarios (managed + non-managed panels)

### 3. E2E Tests (`test/e2e/level_editor/pw_double_render_prevention.js`)
**Status**: ✅ 3/3 passing + screenshot proof

**Test Scenarios**:
1. **managedExternally flag check**: Verifies flag is set and respected
2. **Render call tracking**: Monitors render calls during full draw cycle
   - Confirms each panel rendered exactly once
   - Verifies all renders include content callbacks
   - Detects any background-only renders
3. **Visual verification**: Checks content components exist and are visible

**Run Command**:
```bash
node "test/e2e/level_editor/pw_double_render_prevention.js"
```

**Screenshot**: `test/e2e/screenshots/level_editor/success/double_render_prevention_test.png`

**Key Features**:
- Real browser environment (Puppeteer)
- Stack trace capture for debugging
- Visual proof via screenshots
- Comprehensive render call tracking

## Test Coverage Summary

| Test Type | Files | Tests | Status | Purpose |
|-----------|-------|-------|--------|---------|
| **Unit** | 1 | 7 | ✅ 7/7 | Method-level behavior |
| **Integration** | 1 | 6 | ✅ 6/6 | Component interactions |
| **E2E** | 1 | 3 | ✅ 3/3 | Browser + screenshots |
| **TOTAL** | **3** | **16** | **✅ 16/16** | **Full coverage** |

## Running All Regression Tests

### Individual Test Suites
```bash
# Unit tests only
npx mocha "test/unit/ui/draggablePanelManagerDoubleRender.test.js"

# Integration tests only
npx mocha "test/integration/ui/levelEditorDoubleRenderPrevention.integration.test.js"

# E2E test only
node "test/e2e/level_editor/pw_double_render_prevention.js"
```

### All Regression Tests
```bash
# Run all (unit + integration)
npx mocha "test/unit/ui/draggablePanelManagerDoubleRender.test.js" "test/integration/ui/levelEditorDoubleRenderPrevention.integration.test.js"

# Then run E2E
node "test/e2e/level_editor/pw_double_render_prevention.js"
```

## How These Tests Prevent Regression

### 1. If `render()` is used instead of `renderPanels()` in the interactive adapter:
- ✅ Unit test #5 will fail (interactive adapter test)
- ✅ Integration test "Interactive adapter integration" will fail
- ✅ E2E test #2 will fail (double rendering detected)

### 2. If `renderPanels()` logic is changed to ignore `managedExternally`:
- ✅ Unit test #1 will fail
- ✅ Integration test "Single frame rendering" will fail
- ✅ E2E test #1 will fail (flag not respected)

### 3. If Level Editor panels lose `managedExternally: true`:
- ✅ Unit test #6 will fail
- ✅ E2E test #1 will fail (flag missing)
- ✅ E2E test #2 will detect double rendering

### 4. If double rendering returns for any reason:
- ✅ E2E test #2 will detect multiple render calls
- ✅ E2E screenshot will show incorrect visual state
- ✅ Integration test "Background over content bug" will fail

## Test Maintenance

### When to Update These Tests
1. **Never remove** - These tests document a critical bug fix
2. **Extend** if new panel types are added with `managedExternally`
3. **Update** if `DraggablePanelManager` API changes (e.g., new render methods)
4. **Keep** even if Level Editor is refactored - the pattern applies to any managed panels

### Adding New Managed Panel Types
If you add a new panel with `managedExternally: true`:
1. Add a test case to unit test #6 (Level Editor panels scenario)
2. Add the panel to integration test beforeEach setup
3. Update E2E test to include the new panel in tracking

## Related Files
- **Bug Location**: `Classes/systems/ui/DraggablePanelManager.js` line 135
- **Fixed Method**: `renderPanels()` (line 991)
- **Interactive Adapter**: Lines 133-137 in DraggablePanelManager
- **Bug Documentation**: `test/e2e/level_editor/TEST_RESULTS.md`

## Success Criteria
- ✅ All 16 tests passing
- ✅ Screenshot shows content visible in Level Editor panels
- ✅ No render call counts > 1 per frame
- ✅ All panels with `managedExternally=true` skipped by `renderPanels()`

## Last Verified
- **Date**: 2025-01-XX (update when running)
- **Unit Tests**: 7/7 passing
- **Integration Tests**: 6/6 passing  
- **E2E Tests**: 3/3 passing + screenshot proof

---

**TDD Philosophy**: These tests were created AFTER the bug was fixed to prevent regression. For NEW features, write tests FIRST, then implement.
