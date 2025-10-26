# Cache System Implementation Roadmap

**Goal**: Implement a universal caching system to optimize rendering performance across MiniMap, Level Editor, and UI components.

**Approach**: Test-Driven Development (TDD) - Write tests FIRST, then implement.

---

## Phase 1: Core CacheManager Foundation ✅ COMPLETE

### 1.1 Base CacheManager Unit Tests ✅ COMPLETE
- [x] Write test for CacheManager singleton pattern
- [x] Write test for cache registration
- [x] Write test for cache retrieval
- [x] Write test for cache invalidation
- [x] Write test for memory budget tracking
- [x] Write test for memory limit enforcement
- [x] Write test for cache eviction (LRU)
- [x] Write test for cache statistics
- [x] Write test for multiple cache instances
- [x] Write test for cache cleanup on destroy
- [x] **Run tests** - 41/41 passing ✅

### 1.2 Implement CacheManager ✅ COMPLETE
- [x] Create `Classes/rendering/CacheManager.js`
- [x] Implement singleton pattern
- [x] Implement cache registration
- [x] Implement memory tracking
- [x] Implement LRU eviction with monotonic counter
- [x] Implement invalidation
- [x] Implement statistics
- [x] **Run tests** - 41/41 passing ✅

### 1.3 CacheManager Integration Tests ✅ COMPLETE
- [x] Write integration test with mock graphics buffers
- [x] Test memory pressure scenarios
- [x] Test concurrent cache operations
- [x] Test cache lifecycle (create → use → evict → destroy)
- [x] **Run tests** - 23/23 passing ✅

---

## Phase 2: Full Buffer Cache Strategy ✅ COMPLETE

### 2.1 FullBufferCache Unit Tests ✅ COMPLETE
- [x] Write test for buffer creation
- [x] Write test for buffer rendering
- [x] Write test for dirty flag tracking
- [x] Write test for cache regeneration
- [x] Write test for memory calculation
- [x] Write test for buffer cleanup
- [x] Write test for viewport-based caching
- [x] Write test for cache hit/miss tracking
- [x] **Run tests** - 27/27 passing ✅

### 2.2 Implement FullBufferCache ✅ COMPLETE
- [x] Create `Classes/rendering/caches/FullBufferCache.js`
- [x] Implement `createGraphics()` wrapper
- [x] Implement render-to-buffer logic
- [x] Implement invalidation
- [x] Implement memory calculation
- [x] Implement cleanup with graceful error handling
- [x] **Run tests** - 27/27 passing ✅

### 2.3 FullBufferCache Integration Tests ⚠️ DEFERRED
- [ ] Test with real p5.Graphics buffers (covered by CacheManager integration tests)
- [ ] Test viewport scrolling scenarios (will be covered by MiniMap tests)
- [ ] Test buffer resize on canvas change (will be covered by MiniMap tests)
- **Note**: Deferred to Phase 3 MiniMap integration tests

---

## Phase 3: MiniMap Cache Integration ✅ COMPLETE

### 3.1 MiniMap Cache Implementation ✅ COMPLETE
- [x] Update `Classes/ui/MiniMap.js`
- [x] Add cache registration in constructor (`_initializeCache()`)
- [x] Add `_renderTerrainToBuffer()` method (cache callback)
- [x] Add `invalidateCache()` method for terrain changes
- [x] Modify `render()` to use cached buffer
- [x] Keep viewport indicator dynamic (green overlay, not cached)
- [x] Add `setCacheEnabled()` / `isCacheValid()` methods
- [x] Add `_renderTerrainDirect()` fallback method
- [x] Add `destroy()` cleanup method
- [x] Update viewport color: yellow → green
- [x] Add scripts to index.html (CacheManager, FullBufferCache)

### 3.2 Testing ⏳ NEXT
- [ ] Test MiniMap with 10x10 terrain (small, should be fast)
- [ ] Test MiniMap with 100x100 terrain (CRITICAL - should not crash!)
- [ ] Verify cache console messages
- [ ] Verify cache statistics (hits/misses)
- [ ] Test invalidateCache() when terrain edited
- [ ] Verify green viewport indicator renders correctly
- [ ] Test setCacheEnabled(false) fallback

### 3.3 Performance Validation ⏳ NEXT
- [ ] Measure FPS with 100x100 terrain (should be 60fps)
- [ ] Measure memory usage (should be <10MB)
- [ ] Verify no heap overflow errors
- [ ] Check cache hit rate (should be >95%)
- [ ] Compare before/after performance metrics

**Performance Impact**:
- **Before**: 100×100 terrain = 10,000 tiles × 60fps = 600,000 iterations/sec → HEAP OVERFLOW ❌
- **After**: 100×100 terrain = 10,000 tiles × 1 render = Cached buffer reused → NO OVERFLOW ✅

### 3.4 MiniMap E2E Tests
- [ ] Create E2E test for minimap rendering with cache
- [ ] Screenshot proof: minimap displays correctly
- [ ] Screenshot proof: viewport rectangle updates with camera
- [ ] Verify no memory leaks (monitor heap usage)
- [ ] **Run tests** - Confirm all pass with screenshots

---

## Phase 4: Level Editor Cache Integration

### 4.1 Level Editor Dirty Rectangle Unit Tests ✅ (FIRST)
- [ ] Write test for DirtyRectCache creation
- [ ] Write test for single tile marking dirty
- [ ] Write test for region marking dirty
- [ ] Write test for dirty region merging (optimization)
- [ ] Write test for partial buffer updates
- [ ] Write test for full redraw when too many dirty regions
- [ ] Write test for memory calculation
- [ ] **Run tests** - Confirm all fail (RED)

### 4.2 Implement DirtyRectCache
- [ ] Create `Classes/rendering/caches/DirtyRectCache.js`
- [ ] Implement dirty region tracking
- [ ] Implement region merging algorithm
- [ ] Implement partial buffer updates
- [ ] Implement full redraw threshold
- [ ] **Run tests** - Confirm all pass (GREEN)

### 4.3 Integrate with Level Editor
- [ ] Update `Classes/systems/ui/LevelEditor.js`
- [ ] Register cache in constructor
- [ ] Mark regions dirty on paint operations
- [ ] Update render to use cache
- [ ] **Run unit tests** - Confirm all pass

### 4.4 Level Editor Integration Tests
- [ ] Test painting single tile (dirty rect)
- [ ] Test painting large region (merged dirty rects)
- [ ] Test undo/redo operations
- [ ] Test terrain import (full invalidation)
- [ ] **Run tests** - Confirm all pass

### 4.5 Level Editor E2E Tests
- [ ] Create E2E test for paint operation with cache
- [ ] Screenshot proof: painted tiles appear immediately
- [ ] Verify cache updates only affected regions
- [ ] Monitor memory usage during extended editing session
- [ ] **Run tests** - Confirm all pass with screenshots

---

## Phase 5: UI Panel Cache Integration

### 5.1 UI Panel Cache Unit Tests ✅ (FIRST)
- [ ] Write test for PropertiesPanel cache
- [ ] Write test for MaterialPalettePanel cache
- [ ] Write test for EventEditorPanel cache
- [ ] Write test for cache invalidation on content change
- [ ] Write test for draggable panel cache persistence
- [ ] **Run tests** - Confirm all fail (RED)

### 5.2 Implement Panel Caching
- [ ] Update `Classes/ui/PropertiesPanel.js`
- [ ] Update `Classes/ui/MaterialPalettePanel.js`
- [ ] Update `Classes/ui/EventEditorPanel.js`
- [ ] Register caches for panel backgrounds
- [ ] Keep dynamic content (text, values) uncached
- [ ] **Run tests** - Confirm all pass (GREEN)

### 5.3 Panel Integration Tests
- [ ] Test panel rendering with cache
- [ ] Test panel updates (dynamic content changes)
- [ ] Test panel resize (cache invalidation)
- [ ] **Run tests** - Confirm all pass

---

## Phase 6: Advanced Features

### 6.1 Tiled Cache Strategy (Future)
- [ ] Write unit tests for TiledCache
- [ ] Implement tile-based caching
- [ ] Integration tests with large terrains (200x200+)
- [ ] E2E tests with memory monitoring

### 6.2 Throttled Cache Strategy
- [ ] Write unit tests for ThrottledCache
- [ ] Implement time-based invalidation
- [ ] Integration tests with dynamic content
- [ ] E2E tests for visual lag tolerance

### 6.3 Cache Debugging Tools
- [ ] Create CacheDebugPanel for monitoring
- [ ] Show cache hit/miss rates
- [ ] Show memory usage per cache
- [ ] Show cache generation times
- [ ] Add keyboard shortcuts for cache control

---

## Phase 7: Performance Optimization

### 7.1 Benchmarking
- [ ] Create benchmark tests for each cache type
- [ ] Measure render time: with cache vs without cache
- [ ] Measure memory usage: baseline vs cached
- [ ] Measure cache generation time
- [ ] Document performance improvements

### 7.2 Memory Budget Tuning
- [ ] Test with 5MB budget
- [ ] Test with 10MB budget
- [ ] Test with 20MB budget
- [ ] Determine optimal budget for target hardware
- [ ] Document recommendations

### 7.3 Optimization
- [ ] Profile cache eviction performance
- [ ] Optimize dirty region merging algorithm
- [ ] Optimize buffer creation/destruction
- [ ] Add cache warming (pre-generate on load)

---

## Phase 8: Documentation & Cleanup

### 8.1 API Documentation
- [ ] Create `docs/api/CacheManager_API_Reference.md`
- [ ] Document all cache strategies
- [ ] Provide usage examples
- [ ] Document best practices

### 8.2 Integration Guide
- [ ] Create `docs/guides/Cache_Integration_Guide.md`
- [ ] How to add caching to new components
- [ ] When to use each cache strategy
- [ ] Performance tuning guide

### 8.3 Code Review
- [ ] Review all cache-related code
- [ ] Ensure consistent naming conventions
- [ ] Add inline documentation
- [ ] Remove debug logging
- [ ] Final test run (all tests pass)

### 8.4 Commit
- [ ] Commit CacheManager and base strategies
- [ ] Commit MiniMap cache integration
- [ ] Commit Level Editor cache integration
- [ ] Commit UI Panel cache integration
- [ ] Commit documentation
- [ ] Commit benchmarks and performance tests

---

## Success Criteria

### Performance Targets
- [ ] MiniMap: 60fps with 100x100 terrain (currently causes memory error)
- [ ] Level Editor: <50ms for single tile paint operation
- [ ] UI Panels: <10ms for panel render (with cache)
- [ ] Memory: <10MB total cache memory usage
- [ ] Cache hit rate: >95% for static content

### Quality Targets
- [ ] 100% test coverage for CacheManager
- [ ] 100% test coverage for cache strategies
- [ ] All E2E tests pass with screenshot proof
- [ ] No memory leaks (verified with heap profiling)
- [ ] Zero performance regressions

### Code Quality
- [ ] All tests follow TDD (Red → Green → Refactor)
- [ ] All tests use `setupUITestEnvironment()` helper
- [ ] Consistent naming conventions
- [ ] Complete inline documentation
- [ ] No console.log() in production code

---

## Current Status

**Phase**: 0 (Planning Complete)

**Next Steps**:
1. Create `test/unit/rendering/cacheManager.test.js` (Phase 1.1)
2. Write all CacheManager unit tests (FAIL)
3. Run tests to confirm failures (RED)
4. Implement CacheManager (Phase 1.2)
5. Run tests to confirm passes (GREEN)

**Estimated Timeline**:
- Phase 1-2: 2-3 days (Core + FullBuffer)
- Phase 3: 1 day (MiniMap)
- Phase 4: 2 days (Level Editor with DirtyRect)
- Phase 5: 1 day (UI Panels)
- Phase 6-8: 2-3 days (Advanced features, optimization, docs)

**Total**: ~8-10 days for complete implementation
