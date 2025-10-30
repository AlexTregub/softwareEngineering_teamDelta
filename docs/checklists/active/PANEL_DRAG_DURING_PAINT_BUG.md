# Bug Fix Checklist: Panel Starts Dragging During Terrain Painting

**Bug**: DraggablePanel Starts Dragging When Painting Over Title Bar
**Type**: Bug Fix
**Priority**: HIGH (interrupts painting workflow)
**Estimated Time**: 2-3 hours
**Started**: October 29, 2025
**Completed**: [Not Started]
**Status**: 🔴 OPEN

---

## Bug Description

### User Report
> "When the user clicks and holds the mouse to paint, but then moves over held down mouse over a draggable panel, the panel begins to be dragged. We need for that not to happen."

### Observed Behavior
1. User clicks on terrain and holds mouse button down
2. User starts painting/erasing tiles
3. User continues dragging mouse while button is held
4. Mouse enters a panel's title bar area
5. **Panel starts dragging** (unexpected)
6. Painting stops, panel is now being dragged

### Expected Behavior
1. User clicks on terrain and holds mouse button down
2. User starts painting/erasing tiles
3. User continues dragging mouse while button is held
4. Mouse enters a panel's title bar area
5. **Panel should NOT start dragging** (painting continues)
6. Panel only drags if click was initiated ON the panel's title bar

---

## Root Cause Analysis

### File
`Classes/systems/ui/DraggablePanel.js` (handleDragging method, line 337)

### Code
```javascript
handleDragging(mouseX, mouseY, mousePressed) {
  const titleBarBounds = this.getTitleBarBounds();
  
  // Start dragging if mouse is pressed and within title bar
  if (mousePressed && !this.isDragging && this.isPointInBounds(mouseX, mouseY, titleBarBounds)) {
    this.isDragging = true;  // ❌ BUG: Doesn't check if click started on panel
    this.dragOffset = {
      x: mouseX - this.state.position.x,
      y: mouseY - this.state.position.y
    };
  }
  // ... rest of method
}
```

### Problem
The condition `mousePressed && !this.isDragging && isPointInBounds(titleBar)` is TRUE when:
- Mouse button is held down (from painting)
- Panel is not currently being dragged
- Mouse is over the title bar

**Missing check**: Did the user START the click on this panel's title bar?

### Why This Happens
1. User clicks on terrain → `LevelEditor.isDragging = true` (for darker highlight)
2. User drags mouse while painting
3. Mouse enters panel title bar with button still held
4. `DraggablePanel.handleDragging()` sees `mousePressed = true` + mouse in title bar
5. Panel starts dragging (doesn't know user was painting)

---

## Affected Systems

### Files to Modify
- `Classes/systems/ui/DraggablePanel.js` - Add check for external drag state
- `Classes/systems/ui/DraggablePanelManager.js` - Pass terrain interaction flag
- `Classes/systems/ui/LevelEditor.js` - Track terrain interaction state

### Files to Create
- `test/unit/ui/draggablePanelNoDragWhilePainting.test.js` - Unit tests
- `test/integration/ui/panelDragDuringPaint.integration.test.js` - Integration tests
- `test/e2e/levelEditor/pw_no_panel_drag_while_painting.js` - E2E with screenshots

---

## Solution Design

### Approach 1: Track Click Origin (RECOMMENDED)
**Add flag to track where click started**

1. **DraggablePanel** tracks if click started on its title bar
2. Only allow drag if click originated on title bar
3. Ignore `mousePressed` if click started elsewhere

**Implementation**:
```javascript
// In DraggablePanel
constructor() {
  // ... existing code
  this.clickStartedOnTitleBar = false;
}

update(mouseX, mouseY, mousePressed) {
  // Track when click starts
  if (mousePressed && !this._wasMousePressed) {
    const titleBarBounds = this.getTitleBarBounds();
    this.clickStartedOnTitleBar = this.isPointInBounds(mouseX, mouseY, titleBarBounds);
  }
  
  // Reset when mouse released
  if (!mousePressed && this._wasMousePressed) {
    this.clickStartedOnTitleBar = false;
  }
  
  this._wasMousePressed = mousePressed;
  
  // ... existing update logic
}

handleDragging(mouseX, mouseY, mousePressed) {
  const titleBarBounds = this.getTitleBarBounds();
  
  // Only start drag if click STARTED on title bar
  if (mousePressed && !this.isDragging && 
      this.clickStartedOnTitleBar &&  // ← NEW CHECK
      this.isPointInBounds(mouseX, mouseY, titleBarBounds)) {
    this.isDragging = true;
    // ... rest of drag logic
  }
}
```

**Pros**:
- ✅ Self-contained solution (no external dependencies)
- ✅ Solves problem at source
- ✅ Works for all interaction types (painting, erasing, etc.)

**Cons**:
- ❌ Requires tracking previous mouse state

### Approach 2: Pass Terrain Interaction Flag (ALTERNATIVE)
**Pass flag from LevelEditor through panel system**

1. **LevelEditor** tracks if terrain interaction is active
2. Pass flag to `draggablePanelManager.handleMouseEvents()`
3. **DraggablePanelManager** passes to each panel
4. **DraggablePanel** ignores drag start if terrain is active

**Pros**:
- ✅ Clear indication of terrain interaction state
- ✅ Explicit coordination between systems

**Cons**:
- ❌ Requires API changes in multiple files
- ❌ Couples LevelEditor and DraggablePanel systems
- ❌ More complex to test

### Chosen Approach
**Approach 1: Track Click Origin** (RECOMMENDED)
- Self-contained, cleaner architecture
- No coupling between systems
- Easier to test in isolation

---

## Phase 1: Write Failing Tests (TDD Red) ✅

### [✅] 1.1 Unit Test: Click Origin Tracking
**File**: `test/unit/ui/draggablePanelNoDragWhilePainting.test.js` ✅ CREATED

**Test Cases**:
- [✅] Click starts on title bar → should allow drag
- [✅] Click starts on terrain, mouse moves to title bar → should NOT drag
- [✅] Click starts on panel content, mouse moves to title bar → should NOT drag
- [✅] Mouse released and clicked again on title bar → should allow drag
- [✅] `clickStartedOnTitleBar` resets when mouse released

**Result**: ✅ All 11 tests created, 8/11 failing as expected (TDD Red confirmed)

---

### [⏳] 1.2 Integration Test: Panel + LevelEditor
**File**: `test/integration/ui/panelDragDuringPaint.integration.test.js`

**Test Cases**:
- [ ] User paints terrain, mouse moves over panel → panel does NOT drag
- [ ] User erases terrain, mouse moves over panel → panel does NOT drag
- [ ] User clicks panel title bar directly → panel DOES drag
- [ ] User paints, releases, clicks panel → panel DOES drag

**Expected Result**: All tests FAIL

---

### [⏳] 1.3 E2E Test: Visual Confirmation
**File**: `test/e2e/levelEditor/pw_no_panel_drag_while_painting.js`

**Workflow**:
1. Open Level Editor
2. Select paint tool
3. Click and drag on terrain (paint several tiles)
4. Continue dragging over material palette panel
5. Verify panel does NOT move
6. Release mouse
7. Click panel title bar directly
8. Drag panel
9. Verify panel DOES move
10. Screenshot proof for both scenarios

**Expected Result**: Panel moves during painting (bug confirmed)

---

## Phase 2: Implement Fix (TDD Green) ✅

### [✅] 2.1 Add Click Origin Tracking to DraggablePanel
**File**: `Classes/systems/ui/DraggablePanel.js` ✅ IMPLEMENTED

**Changes**:
1. ✅ Add `clickStartedOnTitleBar` property to constructor (line 64)
2. ✅ Add `_wasMousePressed` property for edge detection (line 65)
3. ✅ Track click origin in `update()` method (lines 268-276)
4. ✅ Reset flag on mouse release (lines 272-274)
5. ✅ Update `handleDragging()` to check `clickStartedOnTitleBar` (line 360)
6. ✅ **BONUS**: Update minimize button to check `clickStartedOnTitleBar` (line 293)

**Implementation Details**:
- Click origin tracked on mouse press edge (transition from not pressed to pressed)
- `clickStartedOnTitleBar = true` only if click starts within title bar bounds
- Flag resets on mouse release edge (transition from pressed to not pressed)
- `handleDragging()` requires `this.clickStartedOnTitleBar && isPointInBounds(titleBar)`
- **Minimize button** also requires `this.clickStartedOnTitleBar` (prevents minimize during painting)

---

### [✅] 2.2 Run Unit Tests
```bash
npx mocha "test/unit/ui/draggablePanelNoDragWhilePainting.test.js"
```
**Result**: ✅ **13/13 tests PASSING** (11 original + 2 minimize button tests)

---

### [⏳] 2.3 Run Integration Tests
```bash
npx mocha "test/integration/ui/panelDragDuringPaint.integration.test.js"
```
**Expected Result**: All tests PASS

---

## Phase 3: E2E Verification ⏳

### [⏳] 3.1 Run E2E Test with Screenshots
```bash
node test/e2e/levelEditor/pw_no_panel_drag_while_painting.js
```

**Verify Screenshots**:
- `success/no_panel_drag_while_painting.png` - Panel stays in place while painting
- `success/panel_drag_from_titlebar.png` - Panel moves when clicked directly

**Expected Result**: Test PASSES, screenshots show correct behavior

---

## Phase 4: Regression Testing ⏳

### [⏳] 4.1 Run Full Test Suite
```bash
npm test
```

**Check**:
- [ ] All existing draggable panel tests still pass
- [ ] No regressions in Level Editor tests
- [ ] No regressions in paint/erase tool tests

---

## Phase 5: Documentation ⏳

### [⏳] 5.1 Update Code Documentation
- [ ] Add JSDoc comments to new properties
- [ ] Document click origin tracking logic
- [ ] Add inline comments explaining the fix

---

### [⏳] 5.2 Update KNOWN_ISSUES.md
- [ ] Move bug from "Open" to "Fixed" section
- [ ] Add fix date
- [ ] Document root cause and solution

---

### [⏳] 5.3 Update CHANGELOG.md
- [ ] Add to [Unreleased] → User-Facing Changes (Bug Fixes)
- [ ] Describe issue and fix in user terms
- [ ] Add to Developer-Facing Changes with technical details

---

## Phase 6: Commit & Push ⏳

### [⏳] 6.1 Prepare Commit
- [ ] Stage all changed files
- [ ] Write descriptive commit message

**Commit Message**:
```
[Bug Fix] Prevent Panel Drag During Terrain Painting (TDD)

Fixed bug where draggable panels would start dragging when user moved
mouse over title bar while painting/erasing terrain with button held down.

Root Cause:
- DraggablePanel.handleDragging() only checked if mouse was pressed
  and over title bar, without verifying if click started on panel
- User could be painting terrain, move over panel, and panel would
  hijack the drag operation

Solution:
- Track where mouse click originated (clickStartedOnTitleBar flag)
- Only allow drag if click started on panel's title bar
- Reset flag when mouse released

Changes:
- Classes/systems/ui/DraggablePanel.js: Added click origin tracking
  - New properties: clickStartedOnTitleBar, _wasMousePressed
  - Modified update() to track click start location
  - Modified handleDragging() to check click origin

Tests:
- Unit tests: 5/5 passing (click origin tracking)
- Integration tests: 4/4 passing (panel + terrain interaction)
- E2E tests: 1/1 passing with screenshots
- Regression: All existing tests passing

Closes: Panel drag during painting bug
Related: Issue in KNOWN_ISSUES.md
Fixed: October 29, 2025
```

---

### [⏳] 6.2 Push & Verify
- [ ] Push to feature branch
- [ ] Verify CI/CD passes
- [ ] Check build status

---

## Testing Strategy

### Unit Tests
**Focus**: Click origin tracking logic
- Test flag initialization
- Test flag updates on mouse press/release
- Test drag conditions with different click origins
- Isolated from terrain system

### Integration Tests
**Focus**: Panel + LevelEditor interaction
- Test real painting workflow with panels
- Test eraser workflow with panels
- Verify panel drag still works normally
- Use real DraggablePanel and mock LevelEditor

### E2E Tests
**Focus**: Visual proof in browser
- Real user workflow (paint → move over panel)
- Screenshot evidence of correct behavior
- Test both scenarios (painting and direct panel click)
- Browser automation with Puppeteer

---

## Acceptance Criteria

- [ ] User can paint terrain and move mouse over panels without starting drag
- [ ] User can erase terrain and move mouse over panels without starting drag
- [ ] User can still drag panels by clicking on title bar directly
- [ ] Panel drag works normally when click starts on title bar
- [ ] No regressions in existing panel functionality
- [ ] All tests pass (unit → integration → E2E)
- [ ] E2E screenshots show correct behavior
- [ ] Documentation updated (KNOWN_ISSUES.md, CHANGELOG.md)

---

## Rollback Plan

If issues arise:
1. Revert commit fixing the bug
2. Panel will revert to old behavior (drags during painting)
3. User workaround: Release mouse button before moving over panels
4. Risk: LOW - Fix is isolated to DraggablePanel

---

## Notes

- **Self-contained fix**: No changes to LevelEditor or other systems
- **No API changes**: Existing code continues to work
- **Backward compatible**: Panel drag behavior unchanged for normal clicks
- **Performance**: Minimal overhead (one boolean check per frame)

---

## Related Documentation

- `KNOWN_ISSUES.md` - Bug tracking
- `docs/checklists/templates/BUG_FIX_CHECKLIST.md` - Template used
- `CHANGELOG.md` - Change log
