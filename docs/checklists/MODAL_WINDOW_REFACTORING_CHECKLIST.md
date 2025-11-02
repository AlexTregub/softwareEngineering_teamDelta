# Modal Window Refactoring Checklist

**Date Created:** November 2, 2025  
**Purpose:** Extract common methods from modal window classes into base `Dialog` class  
**Estimated Time:** 6-8 hours

## Overview

**Goal:** Refactor modal window classes to eliminate code duplication by extracting common patterns into the base `Dialog` class.

**Affected Files:**
- `Classes/ui/_baseObjects/modalWindow/Dialog.js` (base class)
- `Classes/ui/_baseObjects/modalWindow/ConfirmationDialog.js`
- `Classes/ui/_baseObjects/modalWindow/ModalDialog.js`
- `Classes/ui/_baseObjects/modalWindow/NewMapDialog.js`
- `Classes/ui/_baseObjects/modalWindow/settings/SettingsPanel.js`
- `Classes/ui/levelEditor/fileIO/SaveDialog.js`
- `Classes/ui/levelEditor/fileIO/LoadDialog.js`

## Common Patterns Identified

### 1. Dialog Positioning & Centering
**Found in:** All classes  
**Pattern:** Calculate centered position based on canvas dimensions
```javascript
const dialogX = (canvasWidth - this.dialogWidth) / 2;
const dialogY = (canvasHeight - this.dialogHeight) / 2;
```
**Extract to:** `Dialog.getCenteredCoordinates()`, `Dialog.center()`

### 2. Overlay Rendering
**Found in:** SaveDialog, LoadDialog, ModalDialog, NewMapDialog  
**Pattern:** Semi-transparent black overlay behind dialog
```javascript
fill(0, 0, 0, 180);
noStroke();
rect(0, 0, canvasWidth, canvasHeight);
```
**Extract to:** `Dialog.renderOverlay(opacity = 180)`

### 3. Point-in-Bounds Testing
**Found in:** All classes  
**Pattern:** Hit testing for click detection
```javascript
return x >= bounds.x && x <= bounds.x + bounds.width &&
       y >= bounds.y && y <= bounds.y + bounds.height;
```
**Extract to:** `Dialog.isPointInBounds(x, y, bounds)`

### 4. Button Rendering
**Found in:** SaveDialog, LoadDialog, ModalDialog, NewMapDialog  
**Pattern:** Render buttons with hover/enabled states
```javascript
fill(buttonEnabled ? activeColor : disabledColor);
stroke(borderColor);
rect(x, y, width, height, radius);
```
**Extract to:** `Dialog.renderButton(config)`

### 5. Input Field Rendering
**Found in:** SaveDialog, NewMapDialog, ModalDialog  
**Pattern:** Text input boxes with labels and validation
```javascript
fill(30, 30, 40);
stroke(100, 100, 120);
rect(x, y, width, height, radius);
```
**Extract to:** `Dialog.renderInputField(config)`

### 6. Dialog Dimensions & Storage
**Found in:** All classes  
**Pattern:** Store dialog dimensions in constructor
```javascript
this.dialogWidth = 500;
this.dialogHeight = 300;
```
**Extract to:** `Dialog` base class properties with getters/setters

### 7. Button Bounds Storage
**Found in:** All classes  
**Pattern:** Store button bounds for click detection
```javascript
this._createButtonBounds = { x: 0, y: 0, width: 0, height: 0 };
```
**Extract to:** `Dialog.setButtonBounds(id, bounds)`, `Dialog.getButtonBounds(id)`

### 8. Keyboard Handling
**Found in:** SaveDialog, LoadDialog, ModalDialog, NewMapDialog  
**Pattern:** Handle Enter, Escape, Backspace keys
```javascript
if (key === 'Enter') { this.confirm(); }
if (key === 'Escape') { this.cancel(); }
```
**Extract to:** `Dialog.handleKeyPress(key, keyCode)` - already exists, needs enhancement

### 9. Show/Hide with State Reset
**Found in:** All classes  
**Pattern:** Reset internal state when showing/hiding
```javascript
show() {
  this.visible = true;
  this._validationError = '';
  // Reset other state
}
```
**Extract to:** `Dialog.show()`, `Dialog.hide()` - already exist, need enhancement

### 10. Validation Error Display
**Found in:** SaveDialog, NewMapDialog, ModalDialog  
**Pattern:** Display validation errors below input fields
```javascript
if (this._validationError) {
  fill(255, 80, 80);
  text(this._validationError, x, y);
}
```
**Extract to:** `Dialog.renderValidationError(error, x, y)`

---

## Phase 1: Analysis & Design (1 hour)

### ✅ Step 1.1: Document Current State
- [x] List all modal window classes
- [x] Identify common patterns
- [x] Document method signatures
- [x] List affected test files

### ⬜ Step 1.2: Design New API
- [ ] Define new `Dialog` base class methods
- [ ] Define configuration objects for new methods
- [ ] Plan backward compatibility strategy
- [ ] Document migration path for subclasses

**Deliverables:**
- API design document with method signatures
- Configuration object schemas
- Migration guide outline

---

## Phase 2: Write Tests FIRST (2 hours)

### ⬜ Step 2.1: Unit Tests for Dialog Base Class
**File:** `test/unit/ui/Dialog.test.js` (create if doesn't exist)

Write tests for NEW methods:
- [ ] `getCenteredCoordinates()` - returns {x, y}
- [ ] `center()` - updates this.x and this.y
- [ ] `renderOverlay(buffer, opacity)` - renders to buffer
- [ ] `isPointInBounds(x, y, bounds)` - returns boolean
- [ ] `setButtonBounds(id, bounds)` - stores bounds
- [ ] `getButtonBounds(id)` - retrieves bounds
- [ ] `renderButton(buffer, config)` - renders button to buffer
- [ ] `renderInputField(buffer, config)` - renders input to buffer
- [ ] `renderValidationError(buffer, error, x, y)` - renders error text
- [ ] Enhanced `show()` with state reset
- [ ] Enhanced `hide()` with state cleanup
- [ ] Enhanced `handleKeyPress(key, keyCode)` with common handlers

**Configuration objects:**
```javascript
// Button config
{
  id: 'save',
  label: 'Save',
  x: 100, y: 200,
  width: 120, height: 40,
  enabled: true,
  primary: true,
  onClick: () => {}
}

// Input field config
{
  label: 'Filename',
  value: 'terrain_001',
  x: 100, y: 150,
  width: 300, height: 40,
  placeholder: 'Enter filename',
  active: false,
  validation: (value) => ({ valid: true })
}
```

### ⬜ Step 2.2: Update Existing Tests
**Files to update:**
- [ ] `test/unit/ui/fileDialogs.test.js` (SaveDialog, LoadDialog)
- [ ] `test/unit/ui/modalDialog.test.js` (ModalDialog)
- [ ] `test/unit/ui/NewMapDialog.test.js` (NewMapDialog)
- [ ] `test/_backup_original_unit_tests/ui/saveDialog_*.test.js` (if still relevant)
- [ ] `test/_backup_original_unit_tests/ui/loadDialog_*.test.js` (if still relevant)

Update tests to:
- [ ] Mock new base class methods
- [ ] Test subclass calls to base methods
- [ ] Verify backward compatibility

### ⬜ Step 2.3: Run Tests (Should Fail)
```bash
npx mocha "test/unit/ui/Dialog.test.js"
npx mocha "test/unit/ui/fileDialogs.test.js"
npx mocha "test/unit/ui/modalDialog.test.js"
npx mocha "test/unit/ui/NewMapDialog.test.js"
```

**Expected:** All new tests fail (methods don't exist yet)

---

## Phase 3: Implement Base Class Methods (2 hours)

### ⬜ Step 3.1: Add Common Properties to Dialog
**File:** `Classes/ui/_baseObjects/modalWindow/Dialog.js`

Add to constructor:
- [ ] `this._buttonBounds = new Map()` - store button bounds
- [ ] `this._validationError = ''` - validation error message
- [ ] Dialog dimensions already exist in base class (from UIObject)

### ⬜ Step 3.2: Implement Positioning Methods
- [ ] `getCenteredCoordinates(canvasWidth, canvasHeight)` - returns {x, y}
- [ ] `center(canvasWidth, canvasHeight)` - updates this.x, this.y
- [ ] Update existing `getCenteredPosition()` to use new method

### ⬜ Step 3.3: Implement Rendering Helpers
- [ ] `renderOverlay(buffer, opacity = 180)` - renders semi-transparent overlay
- [ ] `renderButton(buffer, config)` - renders button with states
- [ ] `renderInputField(buffer, config)` - renders input field
- [ ] `renderValidationError(buffer, error, x, y)` - renders error text

### ⬜ Step 3.4: Implement Bounds Management
- [ ] `setButtonBounds(id, bounds)` - stores button bounds
- [ ] `getButtonBounds(id)` - retrieves button bounds
- [ ] `isPointInBounds(x, y, bounds)` - hit testing utility
- [ ] `clearButtonBounds()` - clears all bounds

### ⬜ Step 3.5: Enhance Existing Methods
- [ ] `show()` - add state reset logic
- [ ] `hide()` - add state cleanup logic
- [ ] `handleKeyPress(key, keyCode)` - add common key handlers (Enter, Escape)

### ⬜ Step 3.6: Run Unit Tests (Should Pass)
```bash
npx mocha "test/unit/ui/Dialog.test.js"
```

**Expected:** All Dialog base class tests pass

---

## Phase 4: Refactor Subclasses (2 hours)

### ⬜ Step 4.1: Refactor SaveDialog
**File:** `Classes/ui/levelEditor/fileIO/SaveDialog.js`

Replace:
- [ ] Dialog positioning → `this.center(canvasWidth, canvasHeight)`
- [ ] Overlay rendering → `this.renderOverlay(buffer)`
- [ ] Button rendering → `this.renderButton(buffer, config)`
- [ ] Input field rendering → `this.renderInputField(buffer, config)`
- [ ] Button bounds storage → `this.setButtonBounds(id, bounds)`
- [ ] Point-in-bounds testing → `this.isPointInBounds(x, y, bounds)`
- [ ] Validation error rendering → `this.renderValidationError(buffer, error, x, y)`

### ⬜ Step 4.2: Refactor LoadDialog
**File:** `Classes/ui/levelEditor/fileIO/LoadDialog.js`

Replace (same patterns as SaveDialog):
- [ ] Dialog positioning
- [ ] Overlay rendering
- [ ] Button rendering
- [ ] Button bounds storage
- [ ] Point-in-bounds testing
- [ ] File list rendering (keep custom - unique to LoadDialog)

### ⬜ Step 4.3: Refactor ModalDialog
**File:** `Classes/ui/_baseObjects/modalWindow/ModalDialog.js`

Replace:
- [ ] Dialog positioning
- [ ] Overlay rendering
- [ ] Button rendering (multiple buttons)
- [ ] Input field rendering
- [ ] Validation error rendering
- [ ] Button bounds storage

### ⬜ Step 4.4: Refactor NewMapDialog
**File:** `Classes/ui/_baseObjects/modalWindow/NewMapDialog.js`

Replace:
- [ ] Dialog positioning → use `this.center()`
- [ ] Overlay rendering in `renderToScreen()` → `this.renderOverlay(buffer)`
- [ ] Input field rendering → `this.renderInputField(buffer, config)`
- [ ] Button rendering → `this.renderButton(buffer, config)`
- [ ] Button bounds storage → `this.setButtonBounds(id, bounds)`
- [ ] Point-in-bounds testing → `this.isPointInBounds(x, y, bounds)`
- [ ] Validation error rendering → `this.renderValidationError(buffer, error, x, y)`

### ⬜ Step 4.5: Refactor ConfirmationDialog
**File:** `Classes/ui/_baseObjects/modalWindow/ConfirmationDialog.js`

Note: This is minimal - may not need refactoring (already simple)
- [ ] Review for potential simplifications using base class

### ⬜ Step 4.6: Review SettingsPanel
**File:** `Classes/ui/_baseObjects/modalWindow/settings/SettingsPanel.js`

Note: SettingsPanel doesn't extend Dialog - may not benefit from refactoring
- [ ] Evaluate if conversion to Dialog subclass is beneficial
- [ ] If yes, plan separate refactoring (out of scope for this checklist)

---

## Phase 5: Update Tests (1 hour)

### ⬜ Step 5.1: Update SaveDialog Tests
**Files:**
- [ ] `test/unit/ui/fileDialogs.test.js`
- [ ] `test/_backup_original_unit_tests/ui/saveDialog_*.test.js`

Update to:
- [ ] Mock base class methods called by SaveDialog
- [ ] Verify base class methods are called with correct arguments
- [ ] Test SaveDialog-specific logic (filename validation, format selection)

### ⬜ Step 5.2: Update LoadDialog Tests
**Files:**
- [ ] `test/unit/ui/fileDialogs.test.js`
- [ ] `test/_backup_original_unit_tests/ui/loadDialog_*.test.js`

Update to:
- [ ] Mock base class methods
- [ ] Test LoadDialog-specific logic (file listing, selection, search)

### ⬜ Step 5.3: Update ModalDialog Tests
**File:** `test/unit/ui/modalDialog.test.js`

Update to:
- [ ] Mock base class methods
- [ ] Test ModalDialog-specific logic (multiple buttons, dynamic config)

### ⬜ Step 5.4: Update NewMapDialog Tests
**Files:**
- [ ] `test/unit/ui/NewMapDialog.test.js`
- [ ] `test/integration/ui/newMapDialog.integration.test.js`

Update to:
- [ ] Mock base class methods
- [ ] Test NewMapDialog-specific logic (dimension validation, field switching)

### ⬜ Step 5.5: Run All Unit Tests
```bash
npm run test:unit
```

**Expected:** All tests pass, no regressions

---

## Phase 6: Integration Testing (1 hour)

### ⬜ Step 6.1: Integration Tests
**Files:**
- [ ] `test/integration/ui/newMapDialog.integration.test.js`
- [ ] `test/integration/ui/entityPaletteModalIntegration.integration.test.js`

Update to:
- [ ] Test with real Dialog base class (no mocks)
- [ ] Verify rendering pipeline works correctly
- [ ] Test user interactions (click, keyboard)

### ⬜ Step 6.2: Run Integration Tests
```bash
npm run test:integration
```

**Expected:** All integration tests pass

---

## Phase 7: E2E Testing (1 hour)

### ⬜ Step 7.1: Existing E2E Tests
**Find existing E2E tests:**
```bash
grep -r "SaveDialog\|LoadDialog\|NewMapDialog\|ModalDialog" test/e2e/
```

### ⬜ Step 7.2: Update E2E Tests
**Files to update:**
- [ ] Level Editor save/load tests
- [ ] New Map dialog tests
- [ ] Any modal dialog interaction tests

### ⬜ Step 7.3: Add Screenshots
For each dialog test:
- [ ] Add screenshot verification
- [ ] Test success path (screenshots in `success/`)
- [ ] Test error path (screenshots in `failure/`)

### ⬜ Step 7.4: Run E2E Tests
```bash
npm run test:e2e
```

**Expected:** All E2E tests pass with valid screenshots

---

## Phase 8: Documentation (30 minutes)

### ⬜ Step 8.1: Update API Documentation
**File:** `docs/api/Dialog_API_Reference.md` (create if doesn't exist)

Document:
- [ ] New base class methods
- [ ] Configuration object schemas
- [ ] Migration guide for subclasses
- [ ] Usage examples

### ⬜ Step 8.2: Update Architecture Docs
**Files:**
- [ ] `docs/LEVEL_EDITOR_SETUP.md` (update Dialog section)
- [ ] `docs/quick-reference-ui.md` (create if needed)

### ⬜ Step 8.3: Code Comments
**Files:** All refactored files

Add JSDoc comments:
- [ ] New methods in Dialog.js
- [ ] Updated methods in subclasses
- [ ] Configuration object schemas

### ⬜ Step 8.4: Update CHANGELOG.md
Add to `[Unreleased]` → `Developer-Facing Changes` → `Refactored`:

```markdown
- **Dialog Base Class**: Extracted common modal window patterns
  - Methods added: `getCenteredCoordinates()`, `center()`, `renderOverlay()`, 
    `renderButton()`, `renderInputField()`, `renderValidationError()`, 
    `setButtonBounds()`, `getButtonBounds()`, `isPointInBounds()`
  - Subclasses updated: SaveDialog, LoadDialog, ModalDialog, NewMapDialog
  - Breaking: None (backward compatible)
  - Migration: Optional - subclasses can adopt new methods gradually
```

---

## Phase 9: Code Review & Cleanup (30 minutes)

### ⬜ Step 9.1: Code Review Checklist
- [ ] All methods have JSDoc comments
- [ ] No code duplication remains
- [ ] Backward compatibility maintained
- [ ] All tests pass (`npm test`)
- [ ] No console errors in browser
- [ ] Performance unchanged (no regressions)

### ⬜ Step 9.2: Final Test Run
```bash
npm test  # Run all tests
```

**Expected:** 100% pass rate

### ⬜ Step 9.3: Manual Testing
In browser:
- [ ] Open Level Editor
- [ ] Test Save Dialog (enter filename, save)
- [ ] Test Load Dialog (select file, load)
- [ ] Test New Map Dialog (enter dimensions, create)
- [ ] Test confirmation dialogs (if any)
- [ ] Verify no console errors
- [ ] Verify no visual regressions

---

## Deliverables

### Code
- [x] `Classes/ui/_baseObjects/modalWindow/Dialog.js` - enhanced base class
- [x] `Classes/ui/levelEditor/fileIO/SaveDialog.js` - refactored
- [x] `Classes/ui/levelEditor/fileIO/LoadDialog.js` - refactored
- [x] `Classes/ui/_baseObjects/modalWindow/ModalDialog.js` - refactored
- [x] `Classes/ui/_baseObjects/modalWindow/NewMapDialog.js` - refactored

### Tests
- [x] `test/unit/ui/Dialog.test.js` - new base class tests
- [x] Updated tests for all subclasses
- [x] Updated integration tests
- [x] Updated E2E tests with screenshots

### Documentation
- [x] `docs/api/Dialog_API_Reference.md` - API documentation
- [x] Updated architecture docs
- [x] Updated CHANGELOG.md
- [x] Migration guide for future subclasses

---

## Success Criteria

- ✅ All tests pass (unit, integration, E2E)
- ✅ No code duplication in dialog classes
- ✅ Backward compatibility maintained
- ✅ Documentation complete and accurate
- ✅ No visual regressions in browser
- ✅ Performance unchanged
- ✅ Code coverage >80% for new methods

---

## Rollback Plan

If issues arise:
```bash
git checkout HEAD -- Classes/ui/_baseObjects/modalWindow/
git checkout HEAD -- Classes/ui/levelEditor/fileIO/
git checkout HEAD -- test/unit/ui/
git checkout HEAD -- test/integration/ui/
```

Or revert specific commits:
```bash
git log --oneline | grep "modal"  # Find commit hash
git revert <commit-hash>
```

---

## Notes

- **TDD First**: Write ALL tests before implementation
- **No shortcuts**: Follow checklist step-by-step
- **Test after each phase**: Don't accumulate failures
- **Backward compatibility**: Subclasses can adopt new methods gradually
- **Optional migration**: Old code still works, new code is cleaner

---

## Timeline Estimate

| Phase | Duration | Cumulative |
|-------|----------|-----------|
| 1. Analysis & Design | 1 hour | 1 hour |
| 2. Write Tests FIRST | 2 hours | 3 hours |
| 3. Implement Base Class | 2 hours | 5 hours |
| 4. Refactor Subclasses | 2 hours | 7 hours |
| 5. Update Tests | 1 hour | 8 hours |
| 6. Integration Testing | 1 hour | 9 hours |
| 7. E2E Testing | 1 hour | 10 hours |
| 8. Documentation | 30 min | 10.5 hours |
| 9. Review & Cleanup | 30 min | 11 hours |

**Total:** ~11 hours (revised from initial 6-8 estimate)

---

## Contact & Questions

If issues arise during refactoring:
1. Check test output for specific failures
2. Review `docs/api/Dialog_API_Reference.md` for API details
3. Check `KNOWN_ISSUES.md` for known bugs
4. Ask development team for clarification
