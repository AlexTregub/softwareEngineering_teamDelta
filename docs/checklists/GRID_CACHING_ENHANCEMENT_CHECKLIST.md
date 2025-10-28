# Grid Caching Enhancement Checklist

**Feature**: Add caching to DynamicGridOverlay to eliminate frame rate drops

**Problem**: Grid regeneration happening every frame is causing performance issues despite optimization attempts

**Solution**: Cache generated grid lines and invalidate only when terrain changes or mouse moves significantly

---

## Phase 1: Planning & Design ✅

- [x] **Define Requirements**
  - [x] Cache generated grid lines to avoid regeneration every frame
  - [x] Invalidate cache when painted tiles change
  - [x] Invalidate cache when mouse moves beyond threshold (1 tile)
  - [x] Maintain current aggressive feathering behavior
  - [x] Target: 60fps with 50+ painted tiles

- [x] **Design Architecture**
  - [x] Cache structure: `{ gridLines: [], cacheKey: string, lastMouseTile: {x, y} }`
  - [x] Cache key: Hash of painted tile coordinates + mouse tile position
  - [x] Invalidation triggers: Tile paint/erase, mouse moves >1 tile
  - [x] Cache location: DynamicGridOverlay instance variable

- [x] **Review Existing Code**
  - [x] `Classes/ui/DynamicGridOverlay.js` - generateGridLines() method
  - [x] `Classes/ui/TerrainEditor.js` - calls updateGrid() after paint
  - [x] Existing feathering cache in DynamicGridOverlay
  - [x] No breaking changes - internal optimization only

---

## Phase 2: Unit Tests (TDD Red Phase)

- [x] **Write Failing Unit Tests FIRST**
  - [x] Create test file: `test/unit/ui/DynamicGridOverlayCache.test.js`
  - [x] Test: Cache hit when no changes (same mouse tile, same painted tiles)
  - [x] Test: Cache invalidation when mouse moves >1 tile
  - [x] Test: Cache invalidation when mouse moves within same tile (no invalidation)
  - [x] Test: Cache invalidation when painted tiles change
  - [x] Test: Cache returns identical grid lines on hit
  - [x] Test: Cache key generation from painted tiles + mouse position
  - [x] Test: Performance improvement with cache (>10x faster on cache hit)
  - [x] Target: 10+ tests covering cache behavior (13 tests created)

- [x] **Run Unit Tests (Expect Failures)**
  - [x] Command: `npx mocha "test/unit/ui/DynamicGridOverlayCache.test.js"`
  - [x] Document: Tests fail because cache methods don't exist yet
  - [x] Verify: Tests check correct behavior (cache logic, not implementation)

---

## Phase 3: Implementation (TDD Green Phase)

- [ ] **Implement Cache System**
  - [ ] Add instance variables to DynamicGridOverlay:
    ```javascript
    this._gridCache = { gridLines: [], cacheKey: null, lastMouseTile: null };
    ```
  - [ ] Add `_generateCacheKey(paintedTiles, mouseTileX, mouseTileY)` method
  - [ ] Add `_shouldInvalidateCache(newCacheKey, newMouseTile)` method
  - [ ] Modify `generateGridLines()` to check cache before regeneration
  - [ ] Add cache invalidation in `updateGrid()` when tiles change
  - [ ] Keep functions small (<20 lines each)

- [ ] **Run Unit Tests (Expect Pass)**
  - [ ] Command: `npx mocha "test/unit/ui/DynamicGridOverlayCache.test.js"`
  - [ ] Fix any failures
  - [ ] Verify: All 10+ tests passing
  - [ ] Check: Cache hit rate >90% in normal usage

- [ ] **Refactor (If Needed)**
  - [ ] Extract cache key generation if complex
  - [ ] Optimize tile coordinate hashing
  - [ ] Re-run tests after each refactor

---

## Phase 4: Integration Tests

- [ ] **Write Integration Tests**
  - [ ] Create test file: `test/integration/ui/dynamicGridOverlayCache.integration.test.js`
  - [ ] Test: Cache works with real TerrainEditor paint operations
  - [ ] Test: Cache invalidates when erasing tiles
  - [ ] Test: Cache survives multiple mouse movements within same tile
  - [ ] Test: Cache updates when moving between tiles
  - [ ] Test: Frame rate improvement with cache enabled
  - [ ] Target: 8+ integration tests

- [ ] **Run Integration Tests**
  - [ ] Command: `npx mocha "test/integration/ui/dynamicGridOverlayCache.integration.test.js"`
  - [ ] Verify: All integration tests pass
  - [ ] Check: No memory leaks from unbounded cache growth
  - [ ] Verify: Cleanup in afterEach() hooks

---

## Phase 5: E2E Tests (Visual Verification)

- [ ] **Write E2E Tests with Screenshots**
  - [ ] Create test file: `test/e2e/ui/pw_grid_cache_performance.js`
  - [ ] Use `puppeteer_helper.js` and `camera_helper.js`
  - [ ] Test: Paint 50 tiles, measure frame time with cache
  - [ ] Test: Move mouse rapidly, verify smooth rendering
  - [ ] Test: Take screenshot showing grid quality unchanged
  - [ ] Include: `ensureGameStarted()` to bypass menu
  - [ ] Include: Multiple `redraw()` calls after state changes
  - [ ] Target: Frame time <16ms (60fps) with 50+ tiles

- [ ] **Run E2E Tests**
  - [ ] Command: `node test/e2e/ui/pw_grid_cache_performance.js`
  - [ ] Verify: Screenshots in `test/e2e/screenshots/ui/`
  - [ ] Check: Visual quality matches non-cached version
  - [ ] Check: No console errors in browser
  - [ ] Verify: Headless mode works for CI/CD

---

## Phase 6: Documentation

- [ ] **Update Code Documentation**
  - [ ] Add JSDoc for `_generateCacheKey()` method
  - [ ] Add JSDoc for `_shouldInvalidateCache()` method
  - [ ] Document cache structure in class header
  - [ ] Add inline comments explaining cache invalidation logic

- [ ] **Update Project Documentation**
  - [ ] Update `docs/LEVEL_EDITOR_SETUP.md` - mention caching
  - [ ] Update `CHANGELOG.md` - performance improvement entry
  - [ ] No new architecture docs needed (internal optimization)

---

## Phase 7: Integration & Cleanup

- [ ] **Run Full Test Suite**
  - [ ] Command: `npm test`
  - [ ] Unit tests: All passing (including 39 existing grid tests)
  - [ ] Integration tests: All passing
  - [ ] E2E tests: All passing
  - [ ] No regressions in other systems

- [ ] **Code Review Checklist**
  - [ ] No hardcoded cache size limits
  - [ ] Cache invalidation logic is clear and correct
  - [ ] No memory leaks (cache bounded by single instance)
  - [ ] Error handling for edge cases
  - [ ] Code follows existing DynamicGridOverlay style

- [ ] **Performance Check**
  - [ ] Measure: Frame time with 0 tiles, 10 tiles, 50 tiles
  - [ ] Target: <16ms frame time (60fps) for all cases
  - [ ] Verify: Cache hit rate >90% during normal editing
  - [ ] Compare: Before/after performance metrics

---

## Phase 8: Commit & Push

- [ ] **Prepare Commit**
  - [ ] Stage: `Classes/ui/DynamicGridOverlay.js`
  - [ ] Stage: `test/unit/ui/DynamicGridOverlayCache.test.js`
  - [ ] Stage: `test/integration/ui/dynamicGridOverlayCache.integration.test.js`
  - [ ] Stage: `test/e2e/ui/pw_grid_cache_performance.js`
  - [ ] Stage: `docs/LEVEL_EDITOR_SETUP.md`
  - [ ] Stage: `CHANGELOG.md`
  - [ ] Stage: `docs/checklists/GRID_CACHING_ENHANCEMENT_CHECKLIST.md`

- [ ] **Commit Message Format**
  ```
  [Performance] Add grid line caching to DynamicGridOverlay
  
  Problem: Grid regeneration every frame causing frame rate drops
  Solution: Cache generated grid lines, invalidate on terrain/mouse changes
  
  Changes:
  - DynamicGridOverlay.js: Added cache system with smart invalidation
  - Cache key: Hash of painted tiles + mouse tile position
  - Invalidation: Tile changes or mouse moves >1 tile
  
  Performance:
  - Cache hit: <1ms (was 20-50ms regeneration)
  - 60fps maintained with 50+ painted tiles
  - Cache hit rate >90% during normal editing
  
  Tests:
  - Unit tests: 10+ tests for cache behavior
  - Integration tests: 8+ tests with real terrain operations
  - E2E tests: Visual verification + performance benchmarks
  - All 57+ grid tests passing
  ```

- [ ] **Push & Verify**
  - [ ] Push to DW_EventsTemplates branch
  - [ ] Verify CI/CD passes (if configured)
  - [ ] Manual browser test: Paint 50 tiles, verify smooth frame rate

---

## Success Criteria

✅ **Performance**
- [ ] 60fps (16ms frame time) with 50+ painted tiles
- [ ] Cache hit rate >90% during normal editing
- [ ] <1ms on cache hit vs 20-50ms on cache miss

✅ **Functionality**
- [ ] Grid quality unchanged (aggressive feathering intact)
- [ ] No visual artifacts or glitches
- [ ] Cache invalidates correctly on all triggers

✅ **Testing**
- [ ] 10+ unit tests passing
- [ ] 8+ integration tests passing
- [ ] E2E tests with screenshot proof
- [ ] No regressions in existing 39 grid tests

---

## Implementation Notes

**Cache Key Strategy**:
```javascript
// Simple hash of tile coordinates + mouse tile
const tileHash = paintedTiles.map(t => `${t.x},${t.y}`).sort().join('|');
const mouseTile = mouseX !== null ? `${floor(mouseX/32)},${floor(mouseY/32)}` : 'null';
return `${tileHash}::${mouseTile}`;
```

**Cache Invalidation Logic**:
```javascript
// Invalidate if:
// 1. Cache key changed (tiles added/removed)
// 2. Mouse moved to different tile (not just pixel movement)
const newMouseTile = { x: floor(mouseX/32), y: floor(mouseY/32) };
const mouseMovedTile = !lastMouseTile || 
                       newMouseTile.x !== lastMouseTile.x || 
                       newMouseTile.y !== lastMouseTile.y;
const tilesChanged = newCacheKey !== this._gridCache.cacheKey;
return tilesChanged || mouseMovedTile;
```

**Memory Safety**:
- Single cache instance per DynamicGridOverlay (bounded)
- Cache size ~1-2KB for 50 tiles (negligible)
- No unbounded growth - overwritten on invalidation

---

## Timeline Estimate

- Phase 2 (Unit Tests): 30 minutes
- Phase 3 (Implementation): 45 minutes
- Phase 4 (Integration Tests): 30 minutes
- Phase 5 (E2E Tests): 30 minutes
- Phase 6-8 (Documentation & Cleanup): 20 minutes
- **Total**: ~2.5 hours

---

## Rollback Plan

If caching causes issues:
1. Tests will catch incorrect cache invalidation
2. Can disable cache with feature flag if needed
3. Cache is self-contained (easy to remove)
4. No breaking changes to public API
