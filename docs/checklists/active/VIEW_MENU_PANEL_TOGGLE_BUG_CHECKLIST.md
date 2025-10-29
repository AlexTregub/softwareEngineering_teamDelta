# View Menu Panel Toggle Bug - Bug Fix Checklist

**Bug ID**: VIEW_MENU_PANEL_FLASH  
**Priority**: HIGH  
**Date Reported**: October 29, 2025  
**Affected Systems**: FileMenuBar, DraggablePanelManager, LevelEditorPanels  

---

## Phase 1: Documentation & Reproduction

- [x] **Document in KNOWN_ISSUES.md**
  - Bug: Panels toggled from View menu appear for 1 frame then disappear
  - Affected: All panels (Materials, Tools, Events, Properties, Sidebar)
  - NOT affected: Toolbar button toggle for Events panel (works correctly)
  - Root cause: `stateVisibility` array not updated by `togglePanel()`

- [x] **Gather Information**
  - ✅ Observed behavior: Click View → Sidebar/Events/etc, panel flashes for 1 frame
  - ✅ Expected behavior: Panel stays visible after toggle
  - ✅ Working alternative: Toolbar "Events" button works correctly
  - ✅ Environment: All browsers, LEVEL_EDITOR game state
  - ✅ Root cause identified: Two different toggle mechanisms

**Root Cause Analysis**:

1. **Toolbar Button (WORKS)**:
   - Calls `LevelEditorPanels.toggleEventsPanel()`
   - Manually calls `panel.show()` or `panel.hide()`
   - Manually updates `stateVisibility.LEVEL_EDITOR` array
   - Result: Panel visibility persists across frames

2. **View Menu (BROKEN)**:
   - Calls `FileMenuBar._handleTogglePanel()`
   - Calls `draggablePanelManager.togglePanel(panelId)`
   - `togglePanel()` only calls `panel.toggleVisibility()`
   - Does NOT update `stateVisibility` array
   - Result: Panel becomes visible for 1 frame
   - Next frame: `renderPanels('LEVEL_EDITOR')` enforces `stateVisibility`
   - Panel hidden because not in array

**The Problem**:
```javascript
// DraggablePanelManager.js:818
togglePanel(panelId) {
  const panel = this.panels.get(panelId);
  if (panel) {
    panel.toggleVisibility(); // ❌ Only toggles visibility flag
    return panel.isVisible();
  }
  return null;
}
// ❌ Does NOT update this.stateVisibility[currentState]
// renderPanels() will hide panel next frame
```

**The Fix (Two Options)**:

**Option A: Fix `togglePanel()` to update `stateVisibility`** (RECOMMENDED)
- Centralized fix
- All callers benefit
- Consistent behavior

**Option B: Fix `FileMenuBar._handleTogglePanel()` to manually update array**
- Duplicates logic from `LevelEditorPanels.toggleEventsPanel()`
- Requires updating View menu handler
- Not scalable

**Chosen Solution**: Option A - Fix `DraggablePanelManager.togglePanel()`

---

## Phase 2: Write Failing Test (TDD Red Phase)

- [ ] **Create Regression Test FIRST**
  - [ ] Test type: Integration (tests DraggablePanelManager + state management)
  - [ ] Test file: `test/integration/ui/draggablePanelToggle_stateVisibility.integration.test.js`
  - [ ] Test scenarios:
    - `togglePanel()` adds panel to `stateVisibility` when shown
    - `togglePanel()` removes panel from `stateVisibility` when hidden
    - Multiple toggles maintain correct state
    - `renderPanels()` respects updated `stateVisibility`
    - Does not duplicate panel IDs in array

- [ ] **Run Test (Expect Failure)**
  - [ ] Command: `npx mocha "test/integration/ui/draggablePanelToggle_stateVisibility.integration.test.js" --reporter spec`
  - [ ] Expected: Tests fail because `togglePanel()` doesn't update `stateVisibility`
  - [ ] Verify failure message: "Expected stateVisibility to include panel ID"

---

## Phase 3: Fix Implementation (TDD Green Phase)

- [ ] **File to Modify**: `Classes/systems/ui/DraggablePanelManager.js`

- [ ] **Update `togglePanel()` method** (line 818)
  ```javascript
  togglePanel(panelId) {
    const panel = this.panels.get(panelId);
    if (panel) {
      panel.toggleVisibility();
      const newVisibility = panel.isVisible();
      
      // CRITICAL FIX: Update stateVisibility array to persist toggle
      // This prevents renderPanels() from hiding panel next frame
      const currentState = window.GameState?.current || 'LEVEL_EDITOR';
      if (!this.stateVisibility[currentState]) {
        this.stateVisibility[currentState] = [];
      }
      
      const visibilityArray = this.stateVisibility[currentState];
      const index = visibilityArray.indexOf(panelId);
      
      if (newVisibility && index === -1) {
        // Panel shown - add to visibility array
        visibilityArray.push(panelId);
      } else if (!newVisibility && index > -1) {
        // Panel hidden - remove from visibility array
        visibilityArray.splice(index, 1);
      }
      
      return newVisibility;
    }
    return null;
  }
  ```

- [ ] **Run Bug Test (Expect Pass)**
  - [ ] Command: `npx mocha "test/integration/ui/draggablePanelToggle_stateVisibility.integration.test.js" --reporter spec`
  - [ ] Expected: All tests pass
  - [ ] Verify: `stateVisibility` array updated correctly

- [ ] **Run Full Test Suite**
  - [ ] Command: `npm test`
  - [ ] Expected: All tests pass (no regressions)
  - [ ] Check: Events panel toggle tests still pass
  - [ ] Check: Sidebar tests still pass

---

## Phase 4: Verification & Testing

- [ ] **Manual Testing**
  - [ ] Start Level Editor
  - [ ] Open View menu → Sidebar (Ctrl+6)
  - [ ] Verify: Sidebar stays visible (does not flash/disappear)
  - [ ] Close Sidebar via View menu
  - [ ] Verify: Sidebar stays hidden
  - [ ] Repeat for all panels:
    - [ ] Materials Panel (Ctrl+2)
    - [ ] Tools Panel (Ctrl+3)
    - [ ] Events Panel (Ctrl+4)
    - [ ] Properties Panel (Ctrl+5)
    - [ ] Sidebar (Ctrl+6)
  - [ ] Test toolbar Events button still works

- [ ] **E2E Screenshot Verification**
  - [ ] Create E2E test: `test/e2e/levelEditor/pw_view_menu_panel_toggle.js`
  - [ ] Test all View menu toggles with screenshots
  - [ ] Verify panels stay visible after toggle
  - [ ] Screenshot before/after toggle
  - [ ] Run test: `node test/e2e/levelEditor/pw_view_menu_panel_toggle.js`

---

## Phase 5: Code Quality

- [ ] **Code Review**
  - [ ] Add inline comment explaining `stateVisibility` update
  - [ ] Document why this prevents `renderPanels()` from hiding panel
  - [ ] Check for similar issues in `showPanel()` and `hidePanel()` methods
  - [ ] Consider adding helper method: `_updateStateVisibility(panelId, visible)`

- [ ] **Refactor If Needed**
  - [ ] Extract state visibility logic to helper method (if duplicated)
  - [ ] Update `showPanel()` and `hidePanel()` to use same logic
  - [ ] Re-run tests after refactoring

---

## Phase 6: Documentation Updates

- [ ] **Update KNOWN_ISSUES.md**
  - [ ] Move bug to "Fixed Issues" section
  - [ ] Add fix description: "Updated togglePanel() to maintain stateVisibility array"
  - [ ] Note: "Prevents renderPanels() from hiding toggled panels next frame"
  - [ ] Reference commit SHA

- [ ] **Update Code Documentation**
  - [ ] Add JSDoc to `togglePanel()` explaining state management
  - [ ] Document `stateVisibility` array purpose in class header
  - [ ] Add usage warning: "renderPanels() enforces stateVisibility"

- [ ] **Update Project Documentation**
  - [ ] Update CHANGELOG.md (user-facing fix)
    ```markdown
    ### Fixed
    - **View Menu Panel Toggles**: Panels no longer disappear after toggling from View menu. Fixed stateVisibility synchronization in DraggablePanelManager.
    ```
  - [ ] Update `docs/LEVEL_EDITOR_SETUP.md` if panel toggle behavior changed
  - [ ] Update `docs/api/DraggablePanelManager_API_Reference.md` if exists

---

## Phase 7: Commit & Verify

- [ ] **Prepare Commit**
  - [ ] Stage modified files:
    - `Classes/systems/ui/DraggablePanelManager.js`
    - `test/integration/ui/draggablePanelToggle_stateVisibility.integration.test.js`
    - `test/e2e/levelEditor/pw_view_menu_panel_toggle.js` (if created)
    - `KNOWN_ISSUES.md`
    - `CHANGELOG.md`

- [ ] **Commit Message**
  ```
  [BugFix] Fix View menu panel toggles - panels no longer flash/disappear
  
  Fixes: View menu panel toggles (Ctrl+2/3/4/5/6) causing panels to appear then immediately disappear
  
  Problem:
  - Panels toggled from View menu appeared for 1 frame then vanished
  - Affected all panels: Materials, Tools, Events, Properties, Sidebar
  - Toolbar Events button worked correctly (used different code path)
  - Root cause: togglePanel() only toggled visibility flag, did not update stateVisibility array
  - renderPanels() enforced stateVisibility each frame, hiding panels not in array
  
  Solution:
  - Updated DraggablePanelManager.togglePanel() to maintain stateVisibility array
  - Adds panel ID to array when shown, removes when hidden
  - Prevents renderPanels() from overriding manual toggles
  - Unified behavior: Toolbar and View menu now use same mechanism
  
  Changes:
  - Classes/systems/ui/DraggablePanelManager.js: Updated togglePanel() to sync stateVisibility
  - test/integration/ui/draggablePanelToggle_stateVisibility.integration.test.js: Added regression tests (8 tests)
  - test/e2e/levelEditor/pw_view_menu_panel_toggle.js: Added visual verification (6 panels)
  
  Tests:
  - Added 8 integration tests (all passing)
  - Added 1 E2E test with 12 screenshots (6 panels × 2 states)
  - Full test suite passing (127 tests → 135 tests)
  ```

- [ ] **Final Verification**
  - [ ] Run `npm test` one final time
  - [ ] All tests pass (100%)
  - [ ] No console warnings
  - [ ] Manual test: Toggle all panels from View menu
  - [ ] Screenshot verification: Panels stay visible

---

## Testing Strategy

### Integration Tests (8 tests)
```javascript
describe('DraggablePanelManager - togglePanel() State Visibility', function() {
  // Test 1: Add to stateVisibility when panel shown
  // Test 2: Remove from stateVisibility when panel hidden
  // Test 3: Multiple toggles maintain correct state
  // Test 4: Does not duplicate panel IDs
  // Test 5: renderPanels() respects updated stateVisibility
  // Test 6: Works with different game states
  // Test 7: Handles missing panel gracefully
  // Test 8: Returns correct visibility state
});
```

### E2E Test (1 test, 12 screenshots)
```javascript
// Test all View menu panel toggles
// - Toggle each panel ON via View menu
// - Screenshot: Panel visible
// - Toggle each panel OFF via View menu
// - Screenshot: Panel hidden
// Panels: Materials, Tools, Events, Properties, Sidebar
```

---

## Related Files

**Modified**:
- `Classes/systems/ui/DraggablePanelManager.js` - Core fix
- `KNOWN_ISSUES.md` - Bug documentation
- `CHANGELOG.md` - User-facing fix note

**Created**:
- `test/integration/ui/draggablePanelToggle_stateVisibility.integration.test.js` - Regression tests
- `test/e2e/levelEditor/pw_view_menu_panel_toggle.js` - Visual verification
- `docs/checklists/active/VIEW_MENU_PANEL_TOGGLE_BUG_CHECKLIST.md` - This checklist

**Related (Reference Only)**:
- `Classes/ui/FileMenuBar.js` - View menu toggle handler (calls togglePanel)
- `Classes/systems/ui/LevelEditorPanels.js` - Toolbar toggle (working reference implementation)

---

## Success Criteria

**Bug is fixed when**:
1. ✅ Panels toggled from View menu stay visible (no flash)
2. ✅ All View menu keyboard shortcuts work (Ctrl+2/3/4/5/6)
3. ✅ Toolbar Events button still works
4. ✅ Integration tests pass (8/8)
5. ✅ E2E test passes with correct screenshots (12/12)
6. ✅ No regressions in existing tests
7. ✅ Manual testing: All panels toggle correctly
8. ✅ Both toggle methods (View menu + Toolbar) work identically

---

## Notes

- **Two toggle mechanisms**: This bug revealed duplicate logic between toolbar and View menu
- **Future refactor**: Consider deprecating toolbar toggle in favor of View menu only
- **State management**: `stateVisibility` is the source of truth for panel visibility per game state
- **renderPanels() behavior**: Enforces `stateVisibility` every frame - any panel not in array is hidden

---

## Timeline

- **Bug Reported**: October 29, 2025
- **Root Cause Identified**: October 29, 2025
- **Tests Written**: TBD
- **Fix Implemented**: TBD
- **Tests Passing**: TBD
- **Documentation Updated**: TBD
- **Committed**: TBD
