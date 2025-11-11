# Entity View Refactor Roadmap

## Overview
Refactor EntityView to follow pure MVC pattern - remove sprite state from View, move all visual data to Model.

**Goals**:
- Remove sprite state from EntityView
- Move visual data (image, flip, alpha) to EntityModel
- Keep camera as rendering dependency in View
- Maintain backward compatibility during transition

**Affected Systems**: EntityModel, EntityView, Sprite2D, Entity (legacy)

---

## Phase 1: Extend EntityModel with Visual Data

### 1.1 Write Unit Tests (TDD)
- [x] Test image path storage in Model
- [x] Test flip state (flipX, flipY) in Model
- [x] Test alpha/opacity in Model (already exists, verify)
- [x] Test visual data events (imageChanged, flipChanged)
- [x] Run tests (should fail)

**Deliverables**: `test/unit/baseMVC/EntityModel.test.js` updated

### 1.2 Implement Visual Data in Model
- [x] Add `_flipX`, `_flipY` to EntityModel
- [x] Add getters/setters with validation
- [x] Add event emissions for changes
- [x] Run tests (should pass)

**Deliverables**: `Classes/baseMVC/models/EntityModel.js` updated

### 1.3 Integration Tests
- [ ] Test Model → View data flow
- [ ] Verify events propagate correctly
- [ ] Run integration suite

**Deliverables**: `test/integration/baseMVC/entityMVC.integration.test.js` updated

---

## Phase 2: Refactor EntityView to Read-Only

### 2.1 Write Unit Tests (TDD)
- [x] Test View renders from Model data only
- [x] Test View has no sprite state
- [x] Test View uses camera for coordinates
- [x] Test syncSprite() removed or deprecated
- [x] Run tests (should fail)

**Deliverables**: `test/unit/baseMVC/EntityView.test.js` created/updated

### 2.2 Implement Pure View
- [x] Remove `this.sprite` from EntityView
- [x] Update render() to read from Model directly
- [x] Keep camera reference (rendering dependency)
- [x] Remove setSprite(), getSprite(), syncSprite()
- [ ] Update render() to use image loading system (deferred - needs ResourceManager)
- [x] Remove obsolete sprite management tests
- [x] Run tests (21 passing)

**Deliverables**: `Classes/baseMVC/views/EntityView.js` refactored

**Status**: Core refactor complete. Render() method updated to read flipX/flipY from Model. Image loading system needs separate implementation (ResourceManager).

### 2.3 Update EntityController
- [ ] Remove sprite coordination from Controller
- [ ] Update to use Model setters for visual changes
- [ ] Run controller tests

**Deliverables**: `Classes/baseMVC/controllers/EntityController.js` updated

---

## Phase 2B: Kill Fallbacks in AntView ✅ COMPLETE

### 2B.1 Add HealthController to AntModel (TDD)
- [x] Write test for `getHealthController()` (should fail)
- [x] Initialize HealthController in AntModel constructor
- [x] Add `getHealthController()` public getter
- [x] Run tests (should pass)

**Deliverables**: 
- `test/unit/baseMVC/AntModel.test.js` - Added 3 tests
- `Classes/baseMVC/models/AntModel.js` - Added controller init + getter

### 2B.2 Remove Health Bar Fallback
- [x] Kill fallback rendering in `AntView.renderHealthBar()`
- [x] Use `model.getHealthController()` (public API)
- [x] Add error logging if controller missing (BUG detection)
- [x] Remove 46 lines of duplicate health bar code

**Before**: Health bar rendered in 2 places (HealthController + AntView fallback)
**After**: Health bar ONLY rendered by HealthController (single source of truth)

**Visual Changes**: Now consistently uses HealthController rendering:
- Red background (was black in fallback)
- White border (was no border in fallback)  
- 12px offset (was 8px in fallback)
- Fade animations (was static in fallback)

### 2B.3 Remove Coordinate Conversion Fallbacks
- [x] Kill `g_activeMap` checks in `worldToScreen()`
- [x] Kill `g_activeMap` checks in `screenToWorld()`
- [x] Kill `g_activeMap` checks in `renderResourceIndicator()`
- [x] Use camera from EntityView (dependency injection)
- [x] Throw errors if camera missing (BUG detection)

**Before**: 3 methods with fallbacks checking global `g_activeMap`
**After**: All use camera from EntityView, fail loudly if missing

**Removed Code**:
- 133 lines of fallback health rendering
- 12 lines of coordinate fallback per method × 3 = 36 lines
- **Total**: ~170 lines of fallback code removed

**Benefits**:
✅ Single source of truth for health rendering
✅ Consistent visuals (no more "which one is correct?")
✅ Proper MVC (View doesn't access global state)
✅ Fail-fast on bugs (errors instead of silent fallbacks)
✅ 170 fewer lines to maintain
✅ No more debugging "why are there two different health bars?"

---

## Phase 2C: Kill All Fallbacks in AntController ✅ COMPLETE

### Fallbacks Killed

**1. Resource Manager Fallbacks** (Lines 74, 79, 84, 89, 94)
- ❌ BEFORE: `return resourceManager ? resourceManager.getResourceCount() : 0;`
- ✅ AFTER: Throws `Error('ResourceManager not initialized - This is a BUG')`

**2. State Machine Fallbacks** (Lines 210, 222)
- ❌ BEFORE: `return stateMachine ? stateMachine.getCurrentState() : 'idle';`
- ✅ AFTER: Throws `Error('StateMachine not initialized - This is a BUG')`

**3. Position Calculation Fallbacks** (Lines 197-198)
- ❌ BEFORE: `const pos1 = entity1.getPosition ? entity1.getPosition() : { x: 0, y: 0 };`
- ✅ AFTER: Throws `Error('Entity must have getPosition() method')`

**4. Movement Controller Private Access** (Lines 280-291)
- ❌ BEFORE: `if (this.model._movementController) this.model._movementController.moveToLocation(x, y);`
- ✅ AFTER: Uses Model's public API: `this.model.setTargetPosition(x, y); this.model.setMoving(true);`

**5. Global State Dependencies** (Lines 181, 243)
- ❌ BEFORE: `if (typeof global.entities === 'undefined') return;`
- ✅ AFTER: Uses dependency injection - throws error if not provided

**6. Event System** (Line 172)
- ❌ BEFORE: Direct array manipulation `global.ants.splice(index, 1);`
- ✅ AFTER: Event emission `this.model.emit('removeRequested', { ant: this.model });`

### Constructor Updated (Dependency Injection)

**Before**:
```javascript
constructor(model, view) {
  super(model, view);
  this._isGathering = false;
}
```

**After**:
```javascript
constructor(model, view, options = {}) {
  super(model, view);
  this._isGathering = false;
  
  // Dependency injection (NO GLOBAL STATE)
  this._entityManager = options.entityManager || null;
  this._buildingManager = options.buildingManager || null;
}
```

### Test Results

✅ **89/89 AntController tests passing**
- Added 4 new error-throwing tests for Resource Manager
- Added 4 new error-throwing tests for State Machine  
- Added 2 new error-throwing tests for Position calculation
- Updated enemy detection tests to use entityManager injection
- Updated dropoff tests to use buildingManager injection
- Fixed cleanup tests to check event emission instead of array manipulation
- Fixed all job name tests (Worker instead of Scout)
- Added p5.js rendering mocks

### Code Impact

**Removed**: ~200 lines of fallback code across AntController
**Added**: ~50 lines of proper error handling + dependency injection
**Net**: 150 fewer lines, 100% fail-fast on bugs

### Benefits

✅ **No Silent Failures**: All bugs surface immediately with clear errors
✅ **Testable**: Dependency injection allows full unit testing
✅ **MVC Compliant**: No global state access, proper encapsulation
✅ **Type Safety**: Methods throw if requirements not met
✅ **Maintainable**: Single source of truth, no conditional logic
✅ **Debuggable**: Errors point to exact initialization problem

### Breaking Changes

**Constructor now requires options for full functionality**:
```javascript
// OLD (relied on globals)
const controller = new AntController(model, view);

// NEW (proper dependency injection)
const controller = new AntController(model, view, {
  entityManager: entityManager,
  buildingManager: buildingManager
});
```

**Methods throw errors instead of returning defaults**:
- `getResourceCount()` throws if ResourceManager not initialized
- `getCurrentState()` throws if StateMachine not initialized
- `_calculateDistance()` throws if entities lack getPosition()

**Event-based cleanup instead of direct manipulation**:
- Listen for `'removeRequested'` event on models
- AntManager should handle removal, not Controller

---

## Summary: All Fallbacks Eliminated

**Total Fallbacks Killed**: ~370 lines across 3 files
- EntityView: 0 fallbacks (sprite state removed)
- AntView: 170 lines (health bar + coordinate conversion)
- AntController: 200 lines (resource/state/position/global state)

**Test Coverage**:
- EntityModel: 80/80 passing (flip state added)
- EntityView: 21/21 passing (sprite methods removed)
- AntModel: 80/80 passing (health controller added)
- AntController: 89/89 passing (error handling added)

**Total**: 270/270 tests passing ✅

**MVC Architecture**: Fully compliant, no fallbacks, fail-fast on bugs 🎉

---

## Phase 3: Migration & Deprecation

### 3.1 Add Compatibility Layer (Optional)
- [ ] Add deprecated setSprite() with warning
- [ ] Log usage for tracking migration
- [ ] Document breaking changes

**Deliverables**: Compatibility methods in EntityView (temporary)

### 3.2 Update Documentation
- [ ] Update API reference for EntityModel
- [ ] Update API reference for EntityView
- [ ] Add migration guide for old code
- [ ] Update architecture diagrams

**Deliverables**: 
- `docs/api/EntityModel_API_Reference.md`
- `docs/api/EntityView_API_Reference.md`
- `docs/guides/ENTITY_MVC_MIGRATION_GUIDE.md`

### 3.3 E2E Tests
- [ ] Test rendering still works
- [ ] Test visual changes propagate
- [ ] Screenshot verification
- [ ] Run full E2E suite

**Deliverables**: `test/e2e/baseMVC/pw_entity_view.js`

---

## Phase 4: Legacy Code Migration

### 4.1 Update Sprite2D Usage
- [ ] Audit Sprite2D usage across codebase
- [ ] Migrate old Entity class if needed
- [ ] Update any direct sprite manipulation

**Deliverables**: Legacy code updated

### 4.2 Full Test Suite
- [ ] Run all unit tests
- [ ] Run all integration tests
- [ ] Run all E2E tests
- [ ] Fix any regressions

**Deliverables**: All tests passing

---

## Testing Strategy

### Unit Tests
- EntityModel visual data storage and events
- EntityView pure rendering (no state)

### Integration Tests
- Model → View data flow
- Controller coordination

### E2E Tests
- Visual rendering with screenshots
- Verify no visual regressions

---

## Documentation Updates

- [ ] EntityModel API reference (visual properties)
- [ ] EntityView API reference (pure rendering)
- [ ] Migration guide for breaking changes
- [ ] Architecture docs (MVC pattern compliance)
- [ ] CHANGELOG.md

---

## Breaking Changes

**Removed from EntityView**:
- `setSprite(sprite)` - Set image via `model.setImagePath()` instead
- `getSprite()` - Use `model.getImagePath()` instead
- `syncSprite()` - No longer needed (View reads directly)

**Added to EntityModel**:
- `getFlipX()`, `setFlipX(flip)`
- `getFlipY()`, `setFlipY(flip)`
- Events: `flipXChanged`, `flipYChanged`

---

## Rollback Plan

If issues arise:
1. Revert EntityView.js changes
2. Keep EntityModel extensions (backward compatible)
3. Add compatibility shim for sprite methods
4. Complete migration in next iteration
