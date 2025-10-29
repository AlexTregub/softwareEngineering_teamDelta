# Unit Test Fixes Checklist

**Summary**: 40 failing tests, 357 pending tests, 1388 passing

---

## CRITICAL FAILURES (40 tests)

### 1. TiledCacheStrategy - NOT A CONSTRUCTOR (18 tests) ❌
**File**: `test/unit/rendering/TiledCacheStrategy.test.js`
**Error**: `TypeError: TiledCacheStrategy is not a constructor`
**Root Cause**: TiledCacheStrategy was removed/deprecated when DynamicGridOverlay v3 eliminated caching
**Impact**: All 18 TiledCacheStrategy tests fail

**Action Items**:
- [ ] **DECISION**: Remove TiledCacheStrategy tests (v2 feature, no longer used in v3)
- [ ] Delete `test/unit/rendering/TiledCacheStrategy.test.js`
- [ ] OR: Move to archived tests folder if needed for reference

**Related Tests**:
- Constructor (4 tests)
- Tile Creation (4 tests)
- Memory Calculation (4 tests)
- Dirty Tracking (3 tests)
- Rendering Integration (2 tests)
- Cleanup (1 test)

---

### 2. BuildingManager - globalResource Undefined (10 tests) ❌
**File**: `test/unit/managers/BuildingManager.test.js`
**Error**: `ReferenceError: globalResource is not defined`
**Root Cause**: BuildingManager.js line 41 references `globalResource` without proper initialization in tests

**Action Items**:
- [ ] Add `global.globalResource` mock in test beforeEach
- [ ] Mock globalResource with required methods/properties
- [ ] Verify AntCone.createBuilding() works with mock

**Affected Tests** (lines):
- should create building by type (386)
- should create antcone (401)
- should be case insensitive (419)
- should default faction to neutral (429)
- should set building as active (434)
- should add to Buildings array (439)
- should add to selectables array (444)
- should enable spawning for antcone (461)
- should not add duplicate to Buildings (467)
- AntCone should create building (359)

---

### 3. BrushSizeMenuModule - Missing Methods (4 tests) ❌
**File**: `test/unit/ui/menuBar/BrushSizeMenuModule.test.js`
**Error**: `TypeError: module.setOpen is not a function`
**Root Cause**: BrushSizeMenuModule API changed, tests reference old methods

**Action Items**:
- [ ] Check BrushSizeMenuModule implementation for current API
- [ ] Update test mocks to match current interface
- [ ] Fix size validation test (expects 9, gets 10) - line 92

**Affected Tests**:
- should clamp size above 9 to 9 (line 92) - **AssertionError: expected 10 to equal 9**
- should render size options in dropdown (line 108)
- should highlight current brush size (line 125)
- should handle click on size option (line 181)

---

### 4. LevelEditor - EventFlagLayer Undefined (1 test) ❌
**File**: `test/unit/levelEditor/menuInteractionBlocking.test.js`
**Error**: `ReferenceError: EventFlagLayer is not defined`
**Root Cause**: LevelEditor.js line 88 references EventFlagLayer without loading the class

**Action Items**:
- [ ] Add EventFlagLayer to test setup mocks
- [ ] OR: Mock EventFlagLayer globally in beforeEach
- [ ] Verify LevelEditor.initialize() works with mock

**Affected Test**:
- beforeEach hook for "should NOT paint terrain when clicking menu bar" (line 44)

---

### 5. LevelEditorPanels - isVisible Not a Function (1 test) ❌
**File**: `test/unit/levelEditor/eventsToolsPanelIntegration.test.js`
**Error**: `TypeError: panel.isVisible is not a function`
**Root Cause**: LevelEditorPanels.js line 421 calls `panel.isVisible()` but mock doesn't implement it

**Action Items**:
- [ ] Add `isVisible` method to panel mock
- [ ] Verify toggleEventsPanel() logic

**Affected Test**:
- should maintain state across multiple toggles (line 213)

---

### 6. ResourceSystemManager - GameState.onStateChange (1 test) ❌
**File**: `test/unit/managers/ResourceSystemManager.test.js`
**Error**: `TypeError: GameState.onStateChange is not a function`
**Root Cause**: ResourceSystemManager.js line 102 calls GameState.onStateChange but test doesn't mock it

**Action Items**:
- [ ] Mock GameState.onStateChange in beforeEach
- [ ] Verify ResourceSystemManager._initialize() works with mock

**Affected Test**:
- beforeEach hook for "should initialize with default spawn interval" (line 97)

---

### 7. EventManager - Return Value Mismatch (1 test) ❌
**File**: `test/unit/managers/eventManager.test.js`
**Error**: `AssertionError: expected undefined to be null`
**Root Cause**: EventManager returns `undefined` instead of `null` for non-existent events

**Action Items**:
- [ ] Check EventManager.getEvent() implementation
- [ ] Update to return `null` for missing events (or update test expectation)

**Affected Test**:
- should return null for non-existent event ID (line 152)

---

### 8. BuildingManager - Spawn Interval Wrong (1 test) ❌
**File**: `test/unit/managers/BuildingManager.test.js`
**Error**: `AssertionError: expected 10 to equal 5`
**Root Cause**: Building spawn interval default changed from 5 to 10

**Action Items**:
- [ ] Update test expectation from 5 to 10
- [ ] OR: Verify if default should be 5 and fix implementation

**Affected Test**:
- should set default spawn parameters (line 95)

---

### 9. BuildingManager - Spawning Not Enabled (2 tests) ❌
**File**: `test/unit/managers/BuildingManager.test.js`
**Error**: `AssertionError: expected false to be true`
**Root Cause**: Spawning not enabled for HiveSource and AntHill (likely missing globalResource)

**Action Items**:
- [ ] Fix after globalResource mock is added (see #2)
- [ ] Verify spawning logic in createBuilding()

**Affected Tests**:
- should enable spawning for hivesource (line 450)
- should enable spawning for anthill (line 456)

---

### 10. Sprite2D - Render Call Order (1 test) ❌
**File**: `test/unit/rendering/sprite2d.test.js`
**Error**: `AssertionError: expected [ 'push', 'imageMode', ... ] to deeply equal [ 'push', 'translate', 'scale', ... ]`
**Root Cause**: Sprite2D render() method changed, call order different

**Action Items**:
- [ ] Check current Sprite2D.render() implementation
- [ ] Update test expectations to match current call order

**Affected Test**:
- render should call p5 functions in correct order (line 185)

---

## PENDING TESTS (357 tests)

### Category Breakdown

#### 1. SoundManager - Entire Suite Skipped 🔶
**File**: `test/unit/managers/soundManager.test.js`
**Reason**: `describe.skip` - likely incomplete implementation
**Count**: ~30-50 tests (estimated)

**Action Items**:
- [ ] Review SoundManager implementation status
- [ ] DECISION: Implement SoundManager OR remove tests if not planned
- [ ] If implementing: Remove `.skip` and fix tests
- [ ] If removing: Delete test file or move to future features

---

#### 2. RenderLayerManager - Entire Suite Skipped 🔶
**File**: `test/unit/rendering/RenderLayerManager.test.js`
**Reason**: `describe.skip` - possibly refactored
**Count**: ~50-100 tests (estimated)

**Action Items**:
- [ ] Check if RenderLayerManager is still in use (it is - renders layers)
- [ ] Remove `.skip` and update tests for current implementation
- [ ] Verify layer rendering system works as expected

---

#### 3. RenderController - Entire Suite Skipped 🔶
**File**: `test/unit/rendering/RenderController.test.js`
**Reason**: `describe.skip` - controller pattern might have changed
**Count**: ~50-100 tests (estimated)

**Action Items**:
- [ ] Check if RenderController exists and is used
- [ ] If obsolete: Delete test file
- [ ] If in use: Remove `.skip` and update tests

---

#### 4. UILayerRenderer - Individual Tests Skipped 🔶
**File**: `test/unit/rendering/UILayerRenderer.test.js`
**Skipped Tests**:
- should render tooltip when active (line 760)
- should render main menu (line 821)
- should handle game state transitions (line 1007)
- should handle concurrent UI elements (line 1033)

**Action Items**:
- [ ] Review each skipped test
- [ ] Remove `.skip` and fix/update implementation
- [ ] Test tooltip rendering
- [ ] Test main menu rendering
- [ ] Test state transitions
- [ ] Test concurrent UI

---

#### 5. PerformanceMonitor - Individual Tests Skipped 🔶
**File**: `test/unit/rendering/PerformanceMonitor.test.js`
**Skipped Tests**:
- should calculate frame time (line 124)
- should track entity type timings (line 333)
- should maintain type history (line 423)
- should limit type history to 30 frames (line 438)

**Action Items**:
- [ ] Review timing-dependent tests
- [ ] Remove `.skip` or add proper async handling
- [ ] Verify PerformanceMonitor implementation

---

#### 6. GameStateManager - Infinite Loop Test Skipped 🔶
**File**: `test/unit/managers/GameStateManager.test.js`
**Skipped Test**: should handle callback during state transition (line 593)
**Reason**: Causes infinite loop (documented)

**Action Items**:
- [ ] DECISION: Fix infinite loop in GameStateManager OR remove test
- [ ] If keeping test: Add timeout safeguard
- [ ] Document why test is skipped if not fixing

---

#### 7. Entity - Game State Test Skipped 🔶
**File**: `test/unit/containers/entity.test.js`
**Skipped Test**: should not run any update loops while gamestate is not "PLAYING" (line 594)

**Action Items**:
- [ ] Remove `.skip` and implement test
- [ ] Verify Entity update loop respects game state

---

#### 8. Other Pending Tests (~150-200 estimated) 🔶
**Likely Sources**:
- Integration tests with `.skip`
- Feature tests for unimplemented features
- Tests with timing/async issues

**Action Items**:
- [ ] Run full test suite with `--reporter json` to get exact pending test list
- [ ] Categorize remaining pending tests
- [ ] Create sub-checklists for each category

---

## PRIORITY ORDER

### Phase 1: Critical Failures (High Impact) 🔴
1. ✅ **TiledCacheStrategy** - Delete obsolete tests (18 tests) - QUICK WIN
2. ⚠️ **BuildingManager globalResource** - Fix mocks (10 tests) - BLOCKS BUILDING TESTS
3. ⚠️ **BrushSizeMenuModule** - Update API usage (4 tests) - UI CRITICAL

### Phase 2: Quick Fixes (Easy Wins) 🟡
4. ⚠️ **EventManager null return** - One-line fix (1 test)
5. ⚠️ **BuildingManager spawn interval** - Update expectation (1 test)
6. ⚠️ **Sprite2D call order** - Update expectations (1 test)

### Phase 3: Integration Fixes 🟠
7. ⚠️ **LevelEditor EventFlagLayer** - Add mock (1 test)
8. ⚠️ **LevelEditorPanels isVisible** - Add method (1 test)
9. ⚠️ **ResourceSystemManager GameState** - Add mock (1 test)
10. ⚠️ **BuildingManager spawning** - Depends on #2 (2 tests)

### Phase 4: Pending Tests (Lower Priority) 🔵
11. 🔶 **SoundManager** - Implement or remove (~50 tests)
12. 🔶 **RenderLayerManager** - Unskip and update (~100 tests)
13. 🔶 **RenderController** - Check if obsolete (~100 tests)
14. 🔶 **Individual skipped tests** - Case by case (~107 tests)

---

## ESTIMATED EFFORT

| Phase | Tests | Estimated Time | Complexity |
|-------|-------|----------------|------------|
| Phase 1 | 32 | 2-3 hours | Low-Medium |
| Phase 2 | 3 | 30 minutes | Low |
| Phase 3 | 5 | 1-2 hours | Medium |
| Phase 4 | 357 | 8-16 hours | High |
| **TOTAL** | **397** | **12-22 hours** | **Mixed** |

---

## NOTES

- **v3 Cleanup**: TiledCacheStrategy tests are for v2 (UIObject + caching). Since v3 uses direct rendering, these tests should be deleted.
- **globalResource**: Appears to be a global singleton that's not properly mocked in tests. Need to add comprehensive global mocks.
- **API Changes**: Several modules changed APIs without updating tests (BrushSizeMenuModule, LevelEditorPanels, etc.)
- **Pending Tests**: Most pending tests are entire test suites (describe.skip), not individual tests. This suggests incomplete features or refactoring.

---

## QUICK START GUIDE

1. **Delete TiledCacheStrategy tests** (18 tests fixed immediately)
2. **Add globalResource mock** to BuildingManager tests (10 tests fixed)
3. **Fix BrushSizeMenuModule** API mismatches (4 tests fixed)
4. **Run `npm test` again** - Should see ~32 fewer failures

After Phase 1-3: ~35/40 failures fixed (87.5%)

---

**Last Updated**: October 28, 2025
**Status**: Initial analysis complete, awaiting Phase 1 implementation
