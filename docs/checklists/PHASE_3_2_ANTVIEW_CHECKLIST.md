# Phase 3.2: AntView - Implementation Plan

## Overview

Create the **AntView** class to handle all rendering for ant entities. This separates visual presentation from data/logic (AntModel).

**Goal**: Render ant sprites, health bars, selection highlights, and resource indicators based on AntModel state changes.

**Estimated Time**: 15-20 hours
**Target Tests**: 35 tests (25 unit + 10 integration)

---

## AntView Responsibilities

### What AntView DOES:
- ✅ Render ant sprite (job-specific images)
- ✅ Render health bar above ant
- ✅ Render selection highlight
- ✅ Render resource indicator (carried resources)
- ✅ React to AntModel changes (observable pattern)
- ✅ Handle visual effects (damage flash, etc.)
- ✅ Manage sprite position/rotation

### What AntView DOES NOT DO:
- ❌ Game logic (belongs in AntModel)
- ❌ Input handling (belongs in AntController)
- ❌ State management (belongs in AntModel)
- ❌ Pathfinding (belongs in AntController/systems)

---

## AntView Structure

```javascript
class AntView extends BaseView {
  constructor(model, options = {}) {
    super(model, options);
    
    // Sprite rendering
    this._sprite = new Sprite2d(options.imagePath, model.position, model.size);
    
    // Visual state
    this._healthBarVisible = true;
    this._selectionHighlight = false;
    this._damageFlashTimer = 0;
    
    // Resource indicator
    this._resourceIndicatorVisible = true;
    
    // Listen to model changes
    this._observeModel();
  }
  
  // BaseView abstract methods
  _onModelChange(property, data) { /* React to model changes */ }
  _renderContent() { /* Render all visual elements */ }
  
  // Rendering methods
  _renderSprite() { /* Render ant sprite */ }
  _renderHealthBar() { /* Render health bar */ }
  _renderSelectionHighlight() { /* Render selection */ }
  _renderResourceIndicator() { /* Render resource count */ }
  
  // Visual effects
  _updateDamageFlash(deltaTime) { /* Damage flash effect */ }
  
  // Configuration
  setHealthBarVisible(visible) { /* Show/hide health bar */ }
  setSelectionHighlight(enabled) { /* Enable/disable selection */ }
}
```

---

## Phase 3.2 Tasks Checklist

### Week 1: Foundation & Basic Rendering (15-20 hours)

- [ ] **Task 2.1: Create AntView Test Suite** (4-6 hours)
  - [ ] Create `test/unit/views/AntView.test.js`
  - [ ] Write tests for constructor (model binding, sprite creation)
  - [ ] Write tests for sprite rendering
  - [ ] Write tests for health bar rendering
  - [ ] Write tests for selection highlight
  - [ ] Write tests for resource indicator
  - [ ] Write tests for model change reactions
  - [ ] Write tests for visual effects
  - [ ] Write tests for configuration methods
  - **Target**: 25 unit tests (all failing initially - TDD red phase)
  - **Files**: `test/unit/views/AntView.test.js`

- [ ] **Task 2.2: Create AntView Class - Part 1 (Core)** (3-4 hours)
  - [ ] Create `Classes/views/AntView.js`
  - [ ] Extend BaseView
  - [ ] Implement constructor (sprite initialization)
  - [ ] Implement `_onModelChange()` callback
  - [ ] Implement basic `_renderContent()` skeleton
  - [ ] Run tests (expect some to pass)
  - **Files**: `Classes/views/AntView.js`

- [ ] **Task 2.3: Implement Sprite Rendering** (2-3 hours)
  - [ ] Implement `_renderSprite()`
  - [ ] Handle sprite position updates (model change)
  - [ ] Handle sprite rotation updates (model change)
  - [ ] Handle job change (update sprite image)
  - [ ] Run sprite tests (should pass)
  - **Files**: `Classes/views/AntView.js`

- [ ] **Task 2.4: Implement Health Bar Rendering** (2-3 hours)
  - [ ] Implement `_renderHealthBar()`
  - [ ] Position above ant sprite
  - [ ] Visual design (background, foreground, border)
  - [ ] React to health changes (model change)
  - [ ] Handle health bar visibility toggle
  - [ ] Run health bar tests (should pass)
  - **Files**: `Classes/views/AntView.js`

- [ ] **Task 2.5: Implement Selection Highlight** (2-3 hours)
  - [ ] Implement `_renderSelectionHighlight()`
  - [ ] Visual design (circle, glow, or outline)
  - [ ] React to selection state changes
  - [ ] Handle selection toggle
  - [ ] Run selection tests (should pass)
  - **Files**: `Classes/views/AntView.js`

- [ ] **Task 2.6: Implement Resource Indicator** (2-3 hours)
  - [ ] Implement `_renderResourceIndicator()`
  - [ ] Show resource count (text or icons)
  - [ ] Position near ant
  - [ ] React to resource changes (model change)
  - [ ] Handle full inventory visual
  - [ ] Run resource indicator tests (should pass)
  - **Files**: `Classes/views/AntView.js`

- [ ] **Task 2.7: Implement Visual Effects** (2-3 hours)
  - [ ] Implement damage flash effect
  - [ ] Implement heal effect (optional)
  - [ ] Implement death animation trigger
  - [ ] Update effects in render loop
  - [ ] Run effects tests (should pass)
  - **Files**: `Classes/views/AntView.js`

- [ ] **Task 2.8: Integration Testing** (2-3 hours)
  - [ ] Create `test/integration/views/AntView.integration.test.js`
  - [ ] Test AntModel + AntView integration
  - [ ] Test model change → view update workflow
  - [ ] Test complete rendering pipeline
  - [ ] Verify all 25 unit tests passing
  - [ ] Verify 10 integration tests passing
  - **Files**: `test/integration/views/AntView.integration.test.js`

- [ ] **Task 2.9: Final Testing & Polish** (2-3 hours)
  - [ ] Run full test suite (35 tests)
  - [ ] Fix any failing tests
  - [ ] Code review and refactor
  - [ ] Performance optimization (if needed)
  - [ ] Add JSDoc comments
  - **Files**: `Classes/views/AntView.js`

---

## Test Categories

### Constructor Tests (5 tests)
- Should extend BaseView
- Should bind to AntModel
- Should create Sprite2d
- Should observe model changes
- Should initialize visual state

### Sprite Rendering Tests (4 tests)
- Should render sprite at model position
- Should update sprite on position change
- Should update sprite on rotation change
- Should update sprite on job change

### Health Bar Tests (5 tests)
- Should render health bar above sprite
- Should update health bar on health change
- Should hide health bar when disabled
- Should show correct health percentage
- Should change color based on health level

### Selection Highlight Tests (3 tests)
- Should render selection highlight when selected
- Should hide selection when not selected
- Should update highlight on selection change

### Resource Indicator Tests (4 tests)
- Should render resource count
- Should update on resource change
- Should show full inventory indicator
- Should hide when no resources

### Model Change Reaction Tests (4 tests)
- Should react to position change
- Should react to health change
- Should react to job change
- Should react to death

---

## Expected Test Output

```
AntView
  Constructor
    ✔ should extend BaseView
    ✔ should bind to AntModel
    ✔ should create Sprite2d
    ✔ should observe model changes
    ✔ should initialize visual state
  Sprite Rendering
    ✔ should render sprite at model position
    ✔ should update sprite on position change
    ... (35 total tests)
```

---

## Integration Points

### Components to Integrate:
1. ✅ **AntModel** (already complete) - Data source
2. ✅ **BaseView** (already exists) - Parent class
3. ✅ **Sprite2d** (already exists) - Sprite rendering
4. ⚠️ **p5.js rendering** - Use test environment rendering setup

### What NOT to Include:
- ❌ Input handling (goes in AntController)
- ❌ Game logic (stays in AntModel)
- ❌ Pathfinding (stays in systems)

---

## Success Criteria

### Phase 3.2 Complete When:
- [ ] ✅ AntView class created (~300-400 lines)
- [ ] ✅ 25 unit tests passing
- [ ] ✅ 10 integration tests passing
- [ ] ✅ All rendering methods implemented
- [ ] ✅ Observable pattern working (model changes update view)
- [ ] ✅ Sprite rendering with job-specific images
- [ ] ✅ Health bar, selection, resource indicators working
- [ ] ✅ Code reviewed and refactored
- [ ] ✅ Ready for Phase 3.3 (AntController)

---

## Next Phase Preview

**Phase 3.3: AntController** will:
- Create AntController class
- Coordinate AntModel and AntView
- Handle input events
- Provide public API
- Delegate commands to model

---

**Ready to Start**: Task 2.1 (Create AntView Test Suite)
**Estimated Time**: 4-6 hours for comprehensive test suite
**Next Action**: Create `test/unit/views/AntView.test.js` with failing tests
