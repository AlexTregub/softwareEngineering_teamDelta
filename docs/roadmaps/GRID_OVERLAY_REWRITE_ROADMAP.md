# DynamicGridOverlay Rewrite - TDD Roadmap

**Status**: Planning Phase  
**Start Date**: October 28, 2025  
**Reason**: Previous implementation has severe performance issues causing frame drops

---

## Problem Statement

The current `DynamicGridOverlay` implementation is extremely slow and causes performance degradation:

**Performance Issues**:
- Complex edge detection with O(n²) nested loops
- Aggressive feathering calculations with cache misses
- Multiple Set creations per frame
- Opacity sampling at 5+ points per grid line
- Cache invalidation logic triggers too frequently

**Result**: Frame drops, stuttering, poor user experience in Level Editor

---

## Solution Approach

**NEW Design Principles**:
1. **Simplicity First**: Minimal complexity, predictable performance
2. **No Premature Optimization**: Start simple, optimize only if needed
3. **Clean Separation**: Render what's visible, cache aggressively
4. **TDD Driven**: Tests define behavior, implementation follows
5. **Static Rendering**: Grid rendered ONCE to off-screen canvas, updated only on change

**Core Requirements** (from TDD):
- ✅ Render grid lines for visible terrain tiles
- ✅ Show grid at mouse hover location
- ✅ Maintain 60 fps with 500+ painted tiles
- ✅ **OFF-SCREEN CANVAS**: Render grid ONCE to p5.Graphics, blit to screen (FAST)
- ✅ **STATIC GRID**: Only regenerate when tiles change (not every frame)
- ✅ **MOUSE HOVER**: Separate tiny canvas for mouse area (5x5 tiles)
- ✅ No complex feathering or edge detection (unless tests prove it's needed)

**Selected Approach**: **Option 1 - Off-Screen Canvas** (see notes below)
- Static grid canvas (regenerated only when tiles change)
- Mouse hover canvas (small 5x5 tile overlay, updated on mouse tile change)
- Zero per-frame calculations (just image blitting)
- Expected: 60 fps with 1000+ tiles

---

## Phases

### Phase 1: Planning & Requirements Definition ✅ COMPLETE

**Goal**: Define what the grid overlay MUST do (no implementation yet)

- [x] Document performance issues with old implementation
- [x] Define core requirements (render grid, mouse hover, 60 fps)
- [x] Create TDD roadmap document
- [x] Remove old implementation (keep skeleton only)
- [x] Prepare test environment

**Deliverables**:
- ✅ `docs/roadmaps/GRID_OVERLAY_REWRITE_ROADMAP.md`
- ✅ Empty `DynamicGridOverlay` class with constructor, update(), render()
- ✅ Tests will be written FIRST in Phase 2

---

### Phase 2: Unit Tests (TDD Red Phase)

**Goal**: Write tests that define expected behavior (tests will fail)

**Test File**: `test/unit/ui/DynamicGridOverlay.v2.test.js`

#### Test Suite 1: Basic Grid Rendering
- [ ] Test: Constructor initializes with terrain and bufferSize
- [ ] Test: `update()` with no tiles generates empty gridLines array
- [ ] Test: `update()` with 1 tile generates grid around that tile
- [ ] Test: `update()` with multiple tiles generates grid covering bounds
- [ ] Test: `render()` with no gridLines does nothing (no errors)
- [ ] Test: Grid lines have correct structure (x1, y1, x2, y2)

**Expected Tests**: 6 tests, all failing

#### Test Suite 2: Mouse Hover Behavior
- [ ] Test: `update(mousePos)` with no tiles shows grid at mouse location
- [ ] Test: Mouse hover expands grid region to include mouse position
- [ ] Test: Moving mouse updates grid region
- [ ] Test: Mouse hover with painted tiles merges regions

**Expected Tests**: 4 tests, all failing

#### Test Suite 3: Caching (Performance)
- [ ] Test: Calling `update()` twice with same tiles reuses gridLines
- [ ] Test: Cache invalidates when tiles change
- [ ] Test: Cache invalidates when mouse moves to different tile
- [ ] Test: Cache does NOT invalidate when mouse moves within same tile

**Expected Tests**: 4 tests, all failing

**Phase 2 Total**: ~14 unit tests, all failing

**Actions**:
1. Write tests FIRST (do not implement anything)
2. Run tests: `npx mocha "test/unit/ui/DynamicGridOverlay.v2.test.js"`
3. Confirm all tests fail (as expected)
4. **STOP - Wait for user review/approval**

---

### Phase 3: Implementation (TDD Green Phase)

**Goal**: Write MINIMAL code to make tests pass

**Implementation Steps**:
1. Implement `update(mousePos, viewport)`:
   - Calculate grid region from terrain bounds
   - Merge with mouse region if provided
   - Generate grid lines (vertical + horizontal)
   - Cache results with simple key (tiles hash + mouse tile)

2. Implement `render()`:
   - Loop through gridLines array
   - Draw each line with p5.js `line()` function
   - Use simple white stroke

3. Implement caching:
   - Generate cache key from tiles + mouse tile coordinates
   - Store gridLines in cache
   - Invalidate when key changes

**No Edge Detection**: Start simple, render grid for ALL painted tiles + buffer  
**No Feathering**: Start with solid opacity, add later only if tests require it  
**No Complex Optimization**: Use simple caching, optimize only if performance fails

**Actions**:
1. Implement methods to pass tests
2. Run tests: `npx mocha "test/unit/ui/DynamicGridOverlay.v2.test.js"`
3. Confirm all tests pass
4. **No refactoring yet** - move to integration tests

---

### Phase 4: Integration Tests

**Goal**: Test with real SparseTerrain instance

**Test File**: `test/integration/ui/gridOverlay.v2.integration.test.js`

#### Integration Test Suite
- [ ] Test: Grid renders for 10x10 painted area (real terrain)
- [ ] Test: Grid updates when tiles added/removed via terrain API
- [ ] Test: Mouse hover works with real world coordinates
- [ ] Test: Multiple overlays can exist independently
- [ ] Test: Cache invalidates when terrain changes
- [ ] Test: No memory leaks after 100 updates

**Expected Tests**: 6 integration tests

**Actions**:
1. Write integration tests
2. Run tests: `npx mocha "test/integration/ui/gridOverlay.v2.integration.test.js"`
3. Fix any integration issues
4. Confirm all tests pass

---

### Phase 5: E2E Performance Tests

**Goal**: Verify 60 fps with real browser rendering

**Test File**: `test/e2e/ui/pw_grid_overlay_performance.v2.js`

#### E2E Test Suite
- [ ] Test: Paint 100 tiles, measure fps (target: 60 fps)
- [ ] Test: Paint 500 tiles, measure fps (target: 50+ fps)
- [ ] Test: Mouse hover over large painted area (target: 60 fps)
- [ ] Test: Screenshot showing grid rendering correctly
- [ ] Test: No console errors during painting/hovering

**Performance Targets**:
- 100 tiles: 60 fps (MUST PASS)
- 500 tiles: 50+ fps (acceptable)
- 1000 tiles: 30+ fps (acceptable for edge case)

**Actions**:
1. Write E2E tests with performance benchmarks
2. Run test: `node test/e2e/ui/pw_grid_overlay_performance.v2.js`
3. Take screenshots showing correct rendering
4. If performance fails, add optimization (e.g., viewport culling)
5. Re-run tests until targets met

---

### Phase 6: Optimization (Only If Needed)

**Trigger**: E2E tests show fps < 60 with 100 tiles

**Optimization Options** (in order of simplicity):
1. **Viewport Culling**: Only render grid lines within camera viewport
2. **Line Batching**: Batch all lines into single draw call
3. **Incremental Updates**: Only update changed regions
4. **Web Workers**: Move grid generation to background thread

**Process**:
1. Profile to identify bottleneck
2. Write test for optimization (TDD)
3. Implement optimization
4. Re-run E2E tests
5. Verify fps improvement

**DO NOT OPTIMIZE** unless tests prove it's needed!

---

### Phase 7: Documentation & Cleanup

**Goal**: Document new implementation, update references

- [ ] Add JSDoc comments to all public methods
- [ ] Update `docs/LEVEL_EDITOR_SETUP.md`
- [ ] Update `CHANGELOG.md`:
  - User-facing: "Improved grid rendering performance in Level Editor"
  - Developer-facing: "Rewrote DynamicGridOverlay with TDD approach"
- [ ] Archive old tests (move to `ignore/archived_tests/`)
- [ ] Update this roadmap with final results

**Deliverables**:
- ✅ Well-documented code
- ✅ Updated user docs
- ✅ Updated changelog
- ✅ Clean test structure

---

### Phase 8: Integration & Commit

**Goal**: Merge into Level Editor, verify in-game

- [ ] Manual test: Open Level Editor
- [ ] Manual test: Paint tiles, verify grid renders
- [ ] Manual test: Hover mouse, verify grid appears
- [ ] Manual test: Check fps counter (Ctrl+Shift+1)
- [ ] Run full test suite: `npm test`
- [ ] Commit with clear message

**Commit Message Format**:
```
[Rewrite] DynamicGridOverlay performance improvement (TDD)

Problem: Old implementation caused frame drops due to complex edge detection
Solution: Complete rewrite using TDD approach with simple, performant design

Changes:
- Removed complex edge detection and feathering
- Simplified grid generation (all tiles + buffer)
- Improved caching mechanism (invalidate only on tile/mouse change)
- Added comprehensive test coverage (unit, integration, E2E)

Performance:
- Before: 10-30 fps with 100 tiles
- After: 60 fps with 500+ tiles
- Improvement: 3-6x faster

Tests: 20+ unit, 6 integration, 5 E2E (all passing)
```

---

## Testing Strategy

**TDD Workflow**:
1. **Red Phase**: Write failing tests that define behavior
2. **Green Phase**: Write minimal code to pass tests
3. **Refactor Phase**: Clean up code while keeping tests green

**Test Layers**:
- **Unit Tests**: Test methods in isolation (mocked terrain)
- **Integration Tests**: Test with real SparseTerrain instance
- **E2E Tests**: Test in real browser with performance benchmarks

**Coverage Target**: >90% for new code

---

## Success Criteria

✅ **Functionality**:
- [ ] Grid renders for all painted tiles
- [ ] Grid shows at mouse hover location
- [ ] Grid updates when tiles added/removed
- [ ] No visual glitches or errors

✅ **Performance**:
- [ ] 60 fps with 100 tiles (MUST PASS)
- [ ] 50+ fps with 500 tiles
- [ ] No frame drops during painting
- [ ] No memory leaks

✅ **Testing**:
- [ ] 20+ unit tests (all passing)
- [ ] 6+ integration tests (all passing)
- [ ] 5+ E2E tests with screenshots (all passing)
- [ ] No regressions in existing tests

✅ **Code Quality**:
- [ ] Simple, readable implementation
- [ ] Well-documented (JSDoc)
- [ ] No premature optimization
- [ ] Clean separation of concerns

---

## Timeline Estimate

- **Phase 1**: 30 minutes (COMPLETE)
- **Phase 2**: 1 hour (write tests)
- **Phase 3**: 1-2 hours (implementation)
- **Phase 4**: 45 minutes (integration tests)
- **Phase 5**: 45 minutes (E2E tests)
- **Phase 6**: 0-2 hours (only if optimization needed)
- **Phase 7**: 30 minutes (documentation)
- **Phase 8**: 30 minutes (integration & commit)

**Total**: 5-7 hours

---

## Key Decisions

1. **No Edge Detection** (initially): Too complex, optimize only if needed
2. **No Feathering** (initially): Visual polish can be added later if tests require
3. **Simple Caching**: Hash tiles + mouse tile, invalidate on change
4. **TDD First**: Tests define behavior, implementation follows
5. **Performance Driven**: If 60 fps achieved with simple approach, stop there

---

## Notes

- Old implementation archived (can reference if needed)
- All old tests will be moved to `ignore/archived_tests/`
- New tests use `v2` suffix to avoid conflicts
- Focus on SIMPLICITY and PERFORMANCE over features
- Add complexity ONLY if tests prove it's needed

---

## Related Documents

- `docs/checklists/GRID_EDGE_ONLY_RENDERING_CHECKLIST.md` - Old approach (archived)
- `docs/checklists/UI_OBJECT_BASE_CLASS_CHECKLIST.md` - UIObject TDD checklist (prerequisite)
- `docs/roadmaps/UI_OBJECT_BASE_CLASS_FEASIBILITY.md` - UIObject feasibility analysis
- `docs/LEVEL_EDITOR_SETUP.md` - Level Editor documentation
- `test/unit/ui/DynamicGridOverlay.v2.test.js` - New unit tests
- `test/integration/ui/gridOverlay.v2.integration.test.js` - New integration tests
- `test/e2e/ui/pw_grid_overlay_performance.v2.js` - New E2E tests
