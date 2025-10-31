# MaterialPalette Bug Fixes - Checklist (TDD)

**Created**: October 30, 2025  
**Priority**: HIGH (7 bugs affecting core functionality)  
**Related**: `CATEGORIZED_MATERIAL_SYSTEM_CHECKLIST.md` (Phase 5 - Post-Implementation Bugs)

---

## Overview

**Reported Issues** (User Testing - October 30, 2025):
1. ❌ **Material Image Offset** - Swatches render with 0.5-tile displacement
2. ❌ **Search Not Filtering** - Typing doesn't filter materials
3. ❌ **Categories Not Clickable** - Can't expand/collapse categories
4. ❌ **False Material Selection** - Clicking categories selects materials instead
5. ❌ **Content Overflow** - Materials extend beyond panel edges
6. ❌ **No Scroll Indicators** - Missing visual scroll arrows/bars
7. ❌ **Scrolling Not Working** - Mouse wheel doesn't scroll panel

**Root Cause Hypothesis**:
- Image offset: imageMode not set to CORNER
- Search: searchResults not used in render
- Categories: handleClick not routing to MaterialCategory
- False selection: Click coordinate calculation wrong
- Overflow: No clipping applied
- Indicators: ScrollIndicator not initialized
- Scrolling: handleMouseWheel not wired or hover detection broken

---

## Phase 1: Documentation & Evidence ✅

### Document in KNOWN_ISSUES.md ✅
- [x] All 7 bugs documented with file locations, priority, root cause hypothesis
- [x] Added to "Open ❌" section
- [x] Dated: October 30, 2025

### Gather Information
- [x] User report with screenshot showing issues
- [x] Test results: Unit (98/98), Integration (20/20), E2E (7/7) passing
- [x] **Key Finding**: Tests pass but functionality broken → tests not covering actual render/interaction
- [x] Review MaterialPalette.js (720 lines)
- [x] Review LevelEditorPanels.js (Materials panel render section)
- [x] Review LevelEditor.js (handleMouseWheel routing)

---

## Phase 2: Write Failing Tests (TDD Red Phase)

**Strategy**: Create focused integration/E2E tests that reproduce each bug BEFORE fixing

### Bug 1: Material Image Offset ✅ (FALSE POSITIVE - Already Fixed)

- [x] **Test File**: `test/integration/ui/materialPaletteImageOffset.integration.test.js`
- [x] **Test Scenarios**:
  - [x] Verify imageMode(CORNER) called before rendering material swatches
  - [x] Check image coordinates match swatch boundaries (no offset)
  - [x] Spy on p5.js image() calls to verify coordinates
- [x] **Expected**: Test fails - imageMode not set, or set incorrectly
- [x] **Command**: `npx mocha "test/integration/ui/materialPaletteImageOffset.integration.test.js"`
- [x] **Result**: ✅ **6 passing** - Bug NOT reproducible, imageMode(CORNER) already set correctly
- [x] **Analysis**: Code review shows imageMode(CORNER) IS called (line 658 in MaterialPalette.js)
- [x] **Conclusion**: Either bug already fixed, or user experiencing different issue (needs manual verification)

### Bug 2: Search Not Filtering ⏳

- [ ] **Test File**: `test/integration/ui/materialPaletteSearchFilter.integration.test.js`
- [ ] **Test Scenarios**:
  - [ ] Type "moss" in search bar
  - [ ] Verify searchMaterials() called with "moss"
  - [ ] Verify searchResults populated with matching materials only
  - [ ] Verify render() uses searchResults instead of this.materials
  - [ ] Count rendered swatches - should match searchResults.length
- [ ] **Expected**: Test fails - render uses this.materials, not searchResults
- [ ] **Command**: `npx mocha "test/integration/ui/materialPaletteSearchFilter.integration.test.js"`
- [ ] **Result**: ___ failing tests

### Bug 3: Categories Not Clickable ⏳

- [ ] **Test File**: `test/integration/ui/materialPaletteCategoryClick.integration.test.js`
- [ ] **Test Scenarios**:
  - [ ] Click on "Vegetation" category header (y = search bar height + offset)
  - [ ] Verify handleClick routes to MaterialCategory.handleClick()
  - [ ] Verify category.toggle() called
  - [ ] Verify category.isExpanded changes state
  - [ ] Spy on MaterialCategory click handlers
- [ ] **Expected**: Test fails - clicks not routed to categories
- [ ] **Command**: `npx mocha "test/integration/ui/materialPaletteCategoryClick.integration.test.js"`
- [ ] **Result**: ___ failing tests

### Bug 4: False Material Selection ⏳

- [ ] **Test File**: `test/integration/ui/materialPaletteFalseSelection.integration.test.js`
- [ ] **Test Scenarios**:
  - [ ] Click on category header coordinates
  - [ ] Verify addToRecentlyUsed() NOT called
  - [ ] Verify selectedMaterial unchanged
  - [ ] Verify category.toggle() IS called
  - [ ] Test click coordinate transformation with scroll offset
- [ ] **Expected**: Test fails - material selected instead of category toggled
- [ ] **Command**: `npx mocha "test/integration/ui/materialPaletteFalseSelection.integration.test.js"`
- [ ] **Result**: ___ failing tests

### Bug 5: Content Overflow ⏳

- [ ] **Test File**: `test/integration/ui/materialPaletteClipping.integration.test.js`
- [ ] **Test Scenarios**:
  - [ ] Render palette with width=200, height=300
  - [ ] Calculate expected render bounds (x, y, x+width, y+height)
  - [ ] Spy on rect(), image() calls
  - [ ] Verify ALL drawing calls within bounds
  - [ ] Check for clip() calls with panel boundaries
- [ ] **Expected**: Test fails - no clip() called, content exceeds bounds
- [ ] **Command**: `npx mocha "test/integration/ui/materialPaletteClipping.integration.test.js"`
- [ ] **Result**: ___ failing tests

### Bug 6: No Scroll Indicators ⏳

- [ ] **Test File**: `test/integration/ui/materialPaletteScrollIndicators.integration.test.js`
- [ ] **Test Scenarios**:
  - [ ] Create palette with content height > viewport height (needs scrolling)
  - [ ] Call render()
  - [ ] Verify scrollIndicator initialized (constructor check)
  - [ ] Verify scrollIndicator.renderTop() called if scrollOffset > 0
  - [ ] Verify scrollIndicator.renderBottom() called if scrollOffset < maxScrollOffset
  - [ ] Spy on ScrollIndicator methods
- [ ] **Expected**: Test fails - ScrollIndicator not initialized or not called
- [ ] **Command**: `npx mocha "test/integration/ui/materialPaletteScrollIndicators.integration.test.js"`
- [ ] **Result**: ___ failing tests

### Bug 7: Mouse Wheel Scrolling Not Working ⏳

- [ ] **Test File**: `test/integration/ui/materialPaletteMouseWheelScroll.integration.test.js`
- [ ] **Test Scenarios**:
  - [ ] Mock LevelEditor with palette and levelEditorPanels
  - [ ] Set up materials panel at known position (x=100, y=100, width=200, height=400)
  - [ ] Trigger handleMouseWheel with mouse over panel (mouseX=150, mouseY=150)
  - [ ] Verify palette.handleMouseWheel() called with delta
  - [ ] Verify scrollOffset updated
  - [ ] Test hover detection logic (mouseX/Y within panel bounds)
- [ ] **Expected**: Test fails - handleMouseWheel not called or hover detection broken
- [ ] **Command**: `npx mocha "test/integration/ui/materialPaletteMouseWheelScroll.integration.test.js"`
- [ ] **Result**: ___ failing tests

### Run All Bug Tests (Expect Failures) ⏳

- [ ] **Command**: `npx mocha "test/integration/ui/materialPalette*.integration.test.js" --timeout 10000`
- [ ] **Expected**: ~30-40 failing tests across 7 test files
- [ ] **Documented Failures**: List key error messages here
- [ ] **Screenshot**: Save terminal output showing failures

---

## Phase 3: Fix Implementation (TDD Green Phase)

**Order of Fixes** (dependencies first):
1. Image offset (prerequisite for visual testing)
2. Content clipping (prerequisite for scroll indicators)
3. Scroll indicators (visual feedback)
4. Mouse wheel scrolling (interaction)
5. Category clicks (interaction)
6. False selection (interaction logic)
7. Search filtering (feature completion)

### Fix 1: Material Image Offset

- [ ] **File**: `Classes/ui/MaterialPalette.js` (render method)
- [ ] **Changes**:
  - [ ] Add `imageMode(CORNER)` before rendering material swatches
  - [ ] Verify image coordinates: `image(material, swatchX, swatchY, swatchSize, swatchSize)`
  - [ ] Ensure push/pop wraps imageMode change
- [ ] **Test**: Run Bug 1 tests (expect pass)
- [ ] **Command**: `npx mocha "test/integration/ui/materialPaletteImageOffset.integration.test.js"`
- [ ] **Result**: ___ passing tests

### Fix 2: Content Clipping

- [ ] **File**: `Classes/ui/MaterialPalette.js` (render method)
- [ ] **Changes**:
  - [ ] Add `clip(x, y, width, height)` at start of render
  - [ ] Use contentArea bounds from panel
  - [ ] Remove clip with `noClip()` at end (inside pop())
- [ ] **Test**: Run Bug 5 tests (expect pass)
- [ ] **Command**: `npx mocha "test/integration/ui/materialPaletteClipping.integration.test.js"`
- [ ] **Result**: ___ passing tests

### Fix 3: Scroll Indicators

- [ ] **File**: `Classes/ui/MaterialPalette.js` (constructor, render method)
- [ ] **Changes**:
  - [ ] Add to constructor: `this.scrollIndicator = new ScrollIndicator()`
  - [ ] In render(), after content rendering:
    ```javascript
    if (this.scrollIndicator) {
      if (this.scrollOffset > 0) {
        this.scrollIndicator.renderTop(x, y, width);
      }
      if (this.scrollOffset < this.maxScrollOffset) {
        this.scrollIndicator.renderBottom(x, y + height - 20, width);
      }
    }
    ```
- [ ] **Test**: Run Bug 6 tests (expect pass)
- [ ] **Command**: `npx mocha "test/integration/ui/materialPaletteScrollIndicators.integration.test.js"`
- [ ] **Result**: ___ passing tests

### Fix 4: Mouse Wheel Scrolling

- [ ] **File**: `Classes/systems/ui/LevelEditor.js` (handleMouseWheel method)
- [ ] **Changes**:
  - [ ] Review existing delegation code (lines ~410-426)
  - [ ] Verify hover detection: `mouseX >= pos.x && mouseX <= pos.x + size.width`
  - [ ] Add debug logging (temporary): `console.log('Materials panel hover check:', hover, mouseX, mouseY, pos, size)`
  - [ ] Verify palette.handleMouseWheel() called with correct delta
  - [ ] Check if minimized check preventing delegation
- [ ] **Test**: Run Bug 7 tests (expect pass)
- [ ] **Command**: `npx mocha "test/integration/ui/materialPaletteMouseWheelScroll.integration.test.js"`
- [ ] **Result**: ___ passing tests

### Fix 5: Category Clicks

- [ ] **File**: `Classes/ui/MaterialPalette.js` (handleClick method)
- [ ] **Changes**:
  - [ ] Calculate currentY with scroll offset adjustment
  - [ ] Check if click Y within each category header bounds
  - [ ] Route to category.handleClick(adjustedX, adjustedY) if hit
  - [ ] Return early if category handled click
  - [ ] Example:
    ```javascript
    let currentY = panelY - this.scrollOffset;
    for (const category of this.categories) {
      const headerHeight = 30;
      if (mouseY >= currentY && mouseY <= currentY + headerHeight) {
        category.toggle();
        return true; // Consumed
      }
      if (category.isExpanded) {
        currentY += category.getHeight();
      } else {
        currentY += headerHeight;
      }
    }
    ```
- [ ] **Test**: Run Bug 3 tests (expect pass)
- [ ] **Command**: `npx mocha "test/integration/ui/materialPaletteCategoryClick.integration.test.js"`
- [ ] **Result**: ___ passing tests

### Fix 6: False Material Selection

- [ ] **File**: `Classes/ui/MaterialPalette.js` (handleClick method)
- [ ] **Changes**:
  - [ ] Move material swatch click detection AFTER category header checks
  - [ ] Only check material swatches if categories don't handle click
  - [ ] Adjust material swatch Y coordinates with scroll offset
  - [ ] Add bounds checking to prevent off-screen clicks
- [ ] **Test**: Run Bug 4 tests (expect pass)
- [ ] **Command**: `npx mocha "test/integration/ui/materialPaletteFalseSelection.integration.test.js"`
- [ ] **Result**: ___ passing tests

### Fix 7: Search Filtering

- [ ] **File**: `Classes/ui/MaterialPalette.js` (render method)
- [ ] **Changes**:
  - [ ] Determine which materials to render:
    ```javascript
    const materialsToRender = this.searchResults !== null ? this.searchResults : this.materials;
    ```
  - [ ] Use materialsToRender in loops instead of this.materials
  - [ ] Render "No results found" message if searchResults.length === 0
  - [ ] Update category rendering to filter by search results
- [ ] **Test**: Run Bug 2 tests (expect pass)
- [ ] **Command**: `npx mocha "test/integration/ui/materialPaletteSearchFilter.integration.test.js"`
- [ ] **Result**: ___ passing tests

### Run All Bug Tests (Expect Pass) ⏳

- [ ] **Command**: `npx mocha "test/integration/ui/materialPalette*.integration.test.js" --timeout 10000`
- [ ] **Expected**: All 30-40 tests passing
- [ ] **Screenshot**: Save terminal output showing all green

### Run Full Test Suite ⏳

- [ ] **Command**: `npm test`
- [ ] **Expected**: All tests pass (no regressions)
- [ ] **Unit Tests**: 98+ passing
- [ ] **Integration Tests**: 20+ passing
- [ ] **E2E Tests**: 7+ passing

---

## Phase 4: Verification & Testing

### Manual Testing ⏳

- [ ] **Start Server**: `npm run dev`
- [ ] **Open Level Editor**: Navigate to http://localhost:8000?test=1
- [ ] **Switch to LEVEL_EDITOR state**
- [ ] **Open Materials Panel**
- [ ] **Test 1: Image Offset**
  - [ ] Verify materials render without offset
  - [ ] Screenshot: `test/manual/material_palette_no_offset.png`
- [ ] **Test 2: Search Filtering**
  - [ ] Click search bar
  - [ ] Type "moss"
  - [ ] Verify only moss materials visible
  - [ ] Clear search (X button)
  - [ ] Verify all materials return
  - [ ] Screenshot: `test/manual/material_palette_search_moss.png`
- [ ] **Test 3: Category Clicks**
  - [ ] Click "Vegetation" header
  - [ ] Verify category expands/collapses
  - [ ] Verify materials shown/hidden
  - [ ] Screenshot: `test/manual/material_palette_category_expanded.png`
- [ ] **Test 4: No False Selection**
  - [ ] Click multiple category headers
  - [ ] Verify recently used section unchanged
  - [ ] Verify no material selected
- [ ] **Test 5: Clipping**
  - [ ] Scroll to bottom
  - [ ] Verify no materials extend beyond panel edges
  - [ ] Screenshot: `test/manual/material_palette_clipped.png`
- [ ] **Test 6: Scroll Indicators**
  - [ ] Verify up arrow visible when scrolled down
  - [ ] Verify down arrow visible when not at bottom
  - [ ] Screenshot: `test/manual/material_palette_scroll_indicators.png`
- [ ] **Test 7: Mouse Wheel Scrolling**
  - [ ] Hover over Materials panel
  - [ ] Scroll with mouse wheel
  - [ ] Verify content scrolls
  - [ ] Verify indicators update

### E2E Screenshot Verification ⏳

- [ ] **Run E2E Test**: `node test/e2e/ui/pw_categorized_material_palette.js`
- [ ] **Check Screenshots**: `test/e2e/screenshots/ui/success/`
- [ ] **Verify**:
  - [ ] material_palette_search_moss.png shows filtered results
  - [ ] material_palette_category_expanded.png shows correct state
  - [ ] material_palette_scrolled.png shows scroll indicators

---

## Phase 5: Code Quality

### Code Review ⏳

- [ ] **MaterialPalette.js**:
  - [ ] Add comments explaining imageMode(CORNER) fix
  - [ ] Add comments on click routing priority (categories first)
  - [ ] Document search results filtering logic
  - [ ] Remove debug console.log statements
- [ ] **LevelEditor.js**:
  - [ ] Remove temporary debug logging for mouse wheel
  - [ ] Verify hover detection comments clear

### Refactor If Needed ⏳

- [ ] **Extract helper method**: `_getMaterialsToRender()` (search results vs all)
- [ ] **Extract helper method**: `_renderCategoryHeader(category, x, y, width)`
- [ ] **Extract helper method**: `_adjustClickCoordinatesForScroll(mouseX, mouseY)`
- [ ] **Run tests after refactoring**: All pass

---

## Phase 6: Documentation Updates

### Update KNOWN_ISSUES.md ⏳

- [ ] Move all 7 bugs to "Fixed ✅" section
- [ ] Add fix descriptions:
  - [ ] Bug 1: Added imageMode(CORNER) before material swatch rendering
  - [ ] Bug 2: Render now uses searchResults when filtering active
  - [ ] Bug 3: handleClick routes to category headers before material swatches
  - [ ] Bug 4: Category click detection prioritized, prevents false material selection
  - [ ] Bug 5: Added clip(x, y, width, height) to prevent content overflow
  - [ ] Bug 6: Initialized ScrollIndicator in constructor, render in render()
  - [ ] Bug 7: Verified handleMouseWheel delegation (already working)
- [ ] Add date: Fixed October 30, 2025

### Update Code Documentation ⏳

- [ ] **MaterialPalette.js**:
  - [ ] Add JSDoc for _getMaterialsToRender()
  - [ ] Document imageMode requirement in render()
  - [ ] Explain click priority order in handleClick()
- [ ] **Add inline comments**:
  - [ ] Explain scroll offset adjustment in click handling
  - [ ] Document clipping bounds

### Update Project Documentation ⏳

- [ ] **Update CHANGELOG.md**:
  ```markdown
  ### Fixed
  - MaterialPalette: Fixed material image offset (imageMode CORNER)
  - MaterialPalette: Search bar now correctly filters materials
  - MaterialPalette: Category headers now clickable (expand/collapse)
  - MaterialPalette: Fixed false material selection on category clicks
  - MaterialPalette: Content now clipped to panel boundaries
  - MaterialPalette: Added scroll indicators (up/down arrows)
  - MaterialPalette: Mouse wheel scrolling now functional
  ```

---

## Phase 7: Commit & Verify

### Prepare Commit ⏳

- [ ] Stage all changed files
- [ ] Write commit message (see format below)
- [ ] Reference KNOWN_ISSUES.md entries

### Commit Message ⏳

```
[BugFix] Fix 7 MaterialPalette bugs (image offset, search, categories, scroll)

Fixes: MaterialPalette bugs reported October 30, 2025

Problem:
- Material images offset by 0.5 tiles
- Search bar not filtering materials
- Category headers not clickable
- Clicking categories selects materials
- Content overflows panel edges
- No scroll indicators visible
- Mouse wheel scrolling not working

Solution:
1. Added imageMode(CORNER) before material swatch rendering
2. Render uses searchResults when filtering active
3. handleClick routes to category headers first (priority order)
4. Category clicks return early, prevent material selection
5. Added clip(x, y, width, height) for boundary enforcement
6. Initialized ScrollIndicator, render in render() method
7. Verified handleMouseWheel delegation (already working)

Changes:
- Classes/ui/MaterialPalette.js: render(), handleClick(), constructor
- Test files: 7 new integration tests (30-40 test cases)
- KNOWN_ISSUES.md: Moved 7 bugs to Fixed section

Tests:
- Added integration tests: materialPalette*.integration.test.js
- All tests passing (125+/125+)
- E2E tests updated with screenshots
```

### Final Verification ⏳

- [ ] Run `npm test` (all pass)
- [ ] No console warnings in browser
- [ ] No uncommitted files
- [ ] No debug code left behind
- [ ] Screenshots saved for documentation

---

## Success Criteria

**All 7 bugs fixed when**:
1. ✅ Material swatches render without offset (imageMode CORNER)
2. ✅ Search bar filters materials in real-time
3. ✅ Category headers expand/collapse on click
4. ✅ Category clicks don't select materials
5. ✅ All content clipped to panel boundaries
6. ✅ Scroll indicators visible when scrollable
7. ✅ Mouse wheel scrolls Materials panel

**Testing**:
- ✅ 30-40 new integration tests passing
- ✅ All existing tests still passing (no regressions)
- ✅ Manual verification in browser
- ✅ E2E screenshots show correct behavior

---

## Notes

**Key Lessons**:
- Unit tests passed but functionality broken → need integration tests
- Test rendering behavior, not just method calls
- Test click routing with actual coordinates
- Verify visual output with spy assertions on p5.js calls

**Risk Areas**:
- Click coordinate transformation with scroll offset (precision critical)
- imageMode may affect other rendering (wrap in push/pop)
- Clipping may hide issues if boundaries wrong

---

**Last Updated**: October 30, 2025  
**Status**: Phase 2 - Writing Failing Tests (TDD Red Phase)  
**Next Step**: Create integration tests for each bug, verify failures, then proceed to fixes
