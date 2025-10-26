# Auto-Sizing Feature Development Checklist

**Feature:** DraggablePanel Auto-Sizing to Content (Width & Height)
**Start Date:** October 26, 2025
**Status:** In Progress

---

## Overview

### Feature Description
Automatically resize draggable panels to fit button content:
- **HEIGHT**: Based on tallest column of buttons + vertical padding
- **WIDTH**: Based on widest row of buttons + horizontal padding
- Only applies to grid layouts when `autoSizeToContent: true`

### Affected Systems
- `Classes/systems/ui/DraggablePanel.js` - Core panel class
- `Classes/systems/ui/DraggablePanelManager.js` - Panel configurations
- `Classes/systems/ui/LevelEditorPanels.js` - Level editor panels

### Existing Panels (11 total)
1. **ant_spawn** - Vertical layout, 8 buttons
2. **resources** - Horizontal layout, 1 button  
3. **stats** - Vertical layout, 3 buttons
4. **health_controls** - Grid layout (2 cols), 8 buttons
5. **debug** - Grid layout (2 cols), 10 buttons
6. **tasks** - Grid layout (2 cols), 16 buttons
7. **buildings** - Vertical layout, 5 buttons
8. **cheats** - Grid layout (3 cols), 9 buttons
9. **level-editor-materials** - ContentRenderer (no buttons)
10. **level-editor-tools** - ContentRenderer (no buttons)
11. **level-editor-brush** - ContentRenderer (no buttons)

---

## Pre-Development

### ✅ Requirements Analysis (COMPLETED)
- [x] List affected systems/components
- [x] Identify potential side effects or dependencies
- [x] Review existing code architecture
- [x] Write failing unit tests first (34 tests created)
- [x] Identify files that need modification
- [x] Consider backward compatibility (defaults to false, opt-in)
- [x] Document technical decisions (this checklist)

### ✅ Testing Stack Setup (COMPLETED)
- [x] Install sinon for mocking (`npm install --save-dev sinon`)
- [x] Update README.md with testing stack documentation
- [x] Verify test infrastructure working

---

## Implementation Phase

### 1. Core Feature Implementation

#### Config Fields
- [ ] Add `autoSizeToContent: boolean` (default: false)
- [ ] Add `verticalPadding: number` (default: 10)
- [ ] Add `horizontalPadding: number` (default: 10)
- [ ] Update config merging in constructor
- [ ] Add validation for padding values

#### New Methods
- [ ] `calculateTallestColumnHeight()` - Find tallest column
  - [ ] Handle grid layout only
  - [ ] Sum button heights in each column
  - [ ] Include spacing between buttons
  - [ ] Return 0 for non-grid layouts
  
- [ ] `calculateWidestRowWidth()` - Find widest row
  - [ ] Handle grid layout only
  - [ ] Sum button widths in each row
  - [ ] Include spacing between buttons
  - [ ] Return 0 for non-grid layouts

#### Update Existing Methods
- [ ] `autoResizeToFitContent()` - Add auto-sizing logic
  - [ ] Check if `autoSizeToContent` is enabled
  - [ ] Check if layout is 'grid'
  - [ ] Calculate new height: titleBar + tallestColumn + verticalPadding*2
  - [ ] Calculate new width: widestRow + horizontalPadding*2
  - [ ] Update panel dimensions
  - [ ] Preserve existing behavior for non-grid layouts
  - [ ] Don't call `saveState()` (prevent growth bug)

---

### 2. Baseline Testing (IN PROGRESS)

#### ⏳ Create Baseline Test Suite
- [ ] Create `test/baseline/` directory
- [ ] Create baseline test runner script
- [ ] Document baseline test purpose in README

#### Panel-Specific Baseline Tests
- [ ] `ant_spawn` panel
  - [ ] Test current size (140x280)
  - [ ] Test button count (8)
  - [ ] Test layout (vertical)
  - [ ] Test draggable behavior
  - [ ] Test minimize/expand
  
- [ ] `resources` panel
  - [ ] Test current size (180x150)
  - [ ] Test button count (1)
  - [ ] Test layout (horizontal)
  - [ ] Test draggable behavior
  
- [ ] `stats` panel
  - [ ] Test current size (200x160)
  - [ ] Test button count (3)
  - [ ] Test layout (vertical)
  
- [ ] `health_controls` panel
  - [ ] Test current size (200x200)
  - [ ] Test button count (8)
  - [ ] Test layout (grid, 2 cols)
  - [ ] Test grid rendering
  
- [ ] `debug` panel
  - [ ] Test current size (220x240)
  - [ ] Test button count (10)
  - [ ] Test layout (grid, 2 cols)
  
- [ ] `tasks` panel
  - [ ] Test current size (250x400)
  - [ ] Test button count (16)
  - [ ] Test layout (grid, 2 cols)
  
- [ ] `buildings` panel
  - [ ] Test current size (180x240)
  - [ ] Test button count (5)
  - [ ] Test layout (vertical)
  
- [ ] `cheats` panel
  - [ ] Test current size (280x200)
  - [ ] Test button count (9)
  - [ ] Test layout (grid, 3 cols)
  
- [ ] Level editor panels (3 panels)
  - [ ] Test contentRenderer panels
  - [ ] Test managedExternally flag
  - [ ] Verify no buttons (buttons.length === 0)

#### Integration Baseline Tests
- [ ] Test panel manager initialization
- [ ] Test panel rendering order
- [ ] Test panel state persistence
- [ ] Test panel visibility toggling
- [ ] Test panel dragging
- [ ] Test panel minimize/expand

#### E2E Baseline Tests
- [ ] Open game in browser
- [ ] Verify all 11 panels render
- [ ] Test dragging each panel
- [ ] Test minimizing each panel
- [ ] Test button clicks for each panel
- [ ] Screenshot each panel for visual regression
- [ ] Measure panel dimensions before changes

---

### 3. Implementation

#### ⏳ DraggablePanel.js Changes
- [ ] Backup current file
- [ ] Add config fields with defaults
- [ ] Implement `calculateTallestColumnHeight()`
  - [ ] Write method
  - [ ] Add inline comments
  - [ ] Handle edge cases (0 buttons, 1 button, uneven grid)
  
- [ ] Implement `calculateWidestRowWidth()`
  - [ ] Write method
  - [ ] Add inline comments
  - [ ] Handle edge cases
  
- [ ] Update `autoResizeToFitContent()`
  - [ ] Add autoSizeToContent check
  - [ ] Add grid layout check
  - [ ] Calculate new dimensions
  - [ ] Apply dimensions
  - [ ] Test with unit tests

#### Run Unit Tests After Implementation
- [ ] Run: `npx mocha "test/unit/ui/DraggablePanel.columnHeightResize.test.js"`
- [ ] Verify all 34 tests passing
- [ ] Document any failures

---

### 4. Post-Implementation Validation

#### Run Baseline Tests
- [ ] Run baseline integration tests
- [ ] Run baseline E2E tests
- [ ] Compare before/after results
- [ ] Document any differences

#### Expected Behavior
- [ ] Existing panels with `autoSizeToContent: false` (default): NO CHANGES
- [ ] Panels with no buttons (contentRenderer): NO CHANGES
- [ ] Non-grid layouts: NO CHANGES
- [ ] Only panels explicitly enabled with `autoSizeToContent: true` should change

#### Regression Testing
- [ ] Verify no panels grow over time
- [ ] Verify drag still works
- [ ] Verify minimize/expand still works
- [ ] Verify button clicks still work
- [ ] Verify state persistence still works
- [ ] Verify no console errors

---

### 5. Integration with Existing Features

#### Compatibility Checks
- [ ] Test with minimized panels
- [ ] Test with persistent state
- [ ] Test with dragging
- [ ] Test with different scales
- [ ] Test with button resizing
- [ ] Test with word wrapping

#### Edge Cases
- [ ] Single button panels
- [ ] Empty panels (no buttons)
- [ ] Very large grids (20+ buttons)
- [ ] Mixed button sizes
- [ ] Zero-size buttons
- [ ] Floating-point precision

---

## Testing Results

### Unit Tests (34 total)
- **Status**: 12 passing (baseline), 22 failing (awaiting implementation)
- **File**: `test/unit/ui/DraggablePanel.columnHeightResize.test.js`
- **Coverage**:
  - ✅ Config validation (6 tests)
  - ⏳ Height calculation (6 tests)
  - ⏳ Width calculation (6 tests)
  - ⏳ Auto-resize (5 tests)
  - ✅ Stability (3 tests)
  - ⏳ Edge cases (4 tests)
  - ✅ Integration (4 tests)

### Baseline Tests
- **Status**: Not yet created
- **Location**: `test/baseline/`
- **Purpose**: Verify no regressions in existing panels

### Integration Tests
- **Status**: Not yet created
- **Purpose**: Test panel interactions after changes

### E2E Tests
- **Status**: Not yet created
- **Purpose**: Visual verification in real browser

---

## Documentation

### Code Documentation
- [ ] Add JSDoc comments to new methods
- [ ] Document config fields in DraggablePanel
- [ ] Update inline comments
- [ ] Add usage examples

### Feature Documentation
- [ ] Update `docs/guides/DRAGGABLE_PANEL_SYSTEM.md`
- [ ] Create auto-sizing usage example
- [ ] Document verticalPadding/horizontalPadding
- [ ] Add migration guide for existing panels

### Test Documentation
- [ ] Document baseline test purpose
- [ ] Explain when to run baseline tests
- [ ] Add troubleshooting section
- [ ] Document test data fixtures

---

## Pre-Commit Checklist

### Code Quality
- [ ] No console.log statements
- [ ] No commented-out code
- [ ] No TODO comments without context
- [ ] Proper error handling
- [ ] No hard-coded values

### Testing
- [ ] All unit tests passing (34/34)
- [ ] All baseline tests passing
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] No skipped tests

### Version Control
- [ ] Meaningful commit messages
- [ ] Atomic commits
- [ ] No merge conflicts
- [ ] Branch up to date

---

## Risk Assessment

### High Risk
- **Panel growth bug regression**: Mitigated by keeping `saveState()` removed
- **Breaking existing panels**: Mitigated by opt-in flag (`autoSizeToContent: false` by default)

### Medium Risk
- **Floating-point precision errors**: Tests verify no accumulation
- **Performance with large grids**: Edge case tests cover 20+ buttons

### Low Risk
- **Backward compatibility**: Default behavior unchanged
- **Test isolation**: Comprehensive beforeEach cleanup

---

## Success Criteria

### Must Have
- [ ] All 34 unit tests passing
- [ ] All baseline tests passing (no regressions)
- [ ] No panel growth over time
- [ ] Default behavior unchanged

### Should Have
- [ ] E2E tests verify visual behavior
- [ ] Documentation complete
- [ ] Usage examples provided
- [ ] Migration guide written

### Nice to Have
- [ ] Performance benchmarks
- [ ] Visual regression screenshots
- [ ] Animated demo GIF

---

## Timeline

- **Test Creation**: 2 hours (COMPLETED)
- **Baseline Test Creation**: 2 hours (IN PROGRESS)
- **Implementation**: 1 hour
- **Validation**: 1 hour
- **Documentation**: 1 hour
- **Total Estimated**: 7 hours

---

## Notes

### Design Decisions
1. **Opt-in via flag**: Prevents breaking existing panels
2. **Grid layout only**: Other layouts work differently
3. **Separate padding**: Allows fine-tuning vertical vs horizontal
4. **No saveState()**: Prevents growth bug from recurring
5. **Tallest column**: Ensures all buttons visible
6. **Widest row**: Ensures all buttons fit horizontally

### Known Limitations
- Only works with grid layout
- Requires buttons to have width/height properties
- Doesn't account for dynamic content changes
- Padding must be set manually per panel

### Future Enhancements
- Auto-detect content type (buttons vs contentRenderer)
- Dynamic padding calculation
- Support for non-grid layouts
- Animation during resize
- Responsive sizing based on screen size

---

**Last Updated**: October 26, 2025
**Status**: Baseline testing in progress
