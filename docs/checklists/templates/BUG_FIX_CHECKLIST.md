# Bug Fix Checklist (TDD Methodology)

Use this checklist for fixing bugs following Test-Driven Development.

## Phase 1: Documentation & Reproduction

- [ ] **Document in KNOWN_ISSUES.md**
  - [ ] Add to appropriate category (Critical/High/Medium/Low)
  - [ ] Describe observed behavior vs expected behavior
  - [ ] List affected files/systems
  - [ ] Note root cause if known
  - [ ] Add reproduction steps
  - [ ] Assign priority level

- [ ] **Gather Information**
  - [ ] Collect error messages/stack traces
  - [ ] Identify browser console errors
  - [ ] Note environment (browser, OS, game state)
  - [ ] Check if regression (worked before?)
  - [ ] Review related code/recent changes

## Phase 2: Write Failing Test (TDD Red Phase)

- [ ] **Create Regression Test FIRST**
  - [ ] Choose test type (unit/integration/E2E)
  - [ ] Write test that reproduces bug
  - [ ] Use descriptive test name (what bug it catches)
  - [ ] Mock dependencies appropriately
  - [ ] Add comments explaining bug scenario

- [ ] **Run Test (Expect Failure)**
  - [ ] Command: `npx mocha "test/[type]/[file].test.js"`
  - [ ] Verify test fails for correct reason
  - [ ] Confirm failure message matches bug
  - [ ] Screenshot failure if E2E test

## Phase 3: Fix Implementation (TDD Green Phase)

- [ ] **Make Minimal Code Change**
  - [ ] Fix root cause, not symptoms
  - [ ] Add null checks if missing
  - [ ] Fix logic errors
  - [ ] Add defensive programming
  - [ ] Keep scope focused (single bug)

- [ ] **Run Bug Test (Expect Pass)**
  - [ ] Verify regression test now passes
  - [ ] Check fix resolves original issue
  - [ ] No new errors introduced

- [ ] **Run Full Test Suite**
  - [ ] Command: `npm test`
  - [ ] All unit tests pass
  - [ ] All integration tests pass
  - [ ] All E2E tests pass
  - [ ] No regressions in other features

## Phase 4: Verification & Testing

- [ ] **Manual Testing**
  - [ ] Reproduce original bug scenario
  - [ ] Verify fix works in actual game
  - [ ] Test edge cases
  - [ ] Check related features still work
  - [ ] Test in multiple browsers if UI bug

- [ ] **E2E Screenshot Verification (if applicable)**
  - [ ] Run E2E test: `node test/e2e/[category]/pw_[feature].js`
  - [ ] Check screenshots: `test/e2e/screenshots/[category]/success/`
  - [ ] Verify visual correctness
  - [ ] Compare before/after screenshots

## Phase 5: Code Quality

- [ ] **Code Review**
  - [ ] Add inline comments explaining fix
  - [ ] Remove debug console.log statements
  - [ ] Check for similar bugs elsewhere
  - [ ] Verify no hardcoded values introduced
  - [ ] Ensure proper error handling

- [ ] **Refactor If Needed**
  - [ ] Improve code structure if fixing revealed issues
  - [ ] Extract duplicated logic
  - [ ] Add helper functions if needed
  - [ ] Re-run tests after refactoring

## Phase 6: Documentation Updates

- [ ] **Update KNOWN_ISSUES.md**
  - [ ] Move bug to "Fixed Issues" section
  - [ ] Add fix description and commit reference
  - [ ] Note if workaround exists
  - [ ] Keep for historical reference

- [ ] **Update Code Documentation**
  - [ ] Add JSDoc comments if missing
  - [ ] Document why fix was needed
  - [ ] Explain non-obvious solutions
  - [ ] Add usage warnings if applicable

- [ ] **Update Project Documentation**
  - [ ] Update CHANGELOG.md (user-facing fixes)
  - [ ] Update API docs if behavior changed
  - [ ] Update architecture docs if design changed
  - [ ] Add troubleshooting notes if needed

## Phase 7: Commit & Verify

- [ ] **Prepare Commit**
  - [ ] Stage all changed files
  - [ ] Write descriptive commit message
  - [ ] Reference issue/bug report
  - [ ] List files modified

- [ ] **Commit Message Format**
  ```
  [BugFix] Brief description (50 chars max)
  
  Fixes: #[issue-number] or [bug description]
  
  Problem:
  - What was broken
  - How it manifested
  
  Solution:
  - What changed
  - Why this fixes it
  
  Changes:
  - File1: Description
  - File2: Description
  
  Tests:
  - Added regression test: test/[type]/[file].test.js
  - All tests passing (X/X)
  ```

- [ ] **Final Verification**
  - [ ] Run `npm test` one final time
  - [ ] All tests pass (100%)
  - [ ] No console warnings
  - [ ] No uncommitted files
  - [ ] No debug code left behind

## Bug Priority Guidelines

**Critical** (Fix immediately):
- Game crashes/unplayable
- Data loss/corruption
- Security vulnerabilities
- Infinite loops/memory leaks

**High** (Fix within 24hrs):
- Major feature broken
- Performance degradation
- Visual glitches in main UI
- Frequent errors in console

**Medium** (Fix within week):
- Minor feature issues
- Edge case failures
- Non-critical UI issues
- Workaround exists

**Low** (Backlog):
- Cosmetic issues
- Rare edge cases
- Nice-to-have improvements
- Documentation typos

## Common Bug Patterns & Solutions

### Null/Undefined Errors
```javascript
// Problem
const value = entity.controller.property; // Error if controller undefined

// Solution
const controller = entity.getController('name');
const value = controller ? controller.property : defaultValue;
```

### Test Pollution (State Leaks)
```javascript
// Problem
// Tests fail randomly, pass when run individually

// Solution
beforeEach(function() {
  // Reset ALL shared state
  renderCallOrder = [];
  globalCache.clear();
  sinon.restore();
});
```

### JSDOM Sync Issues
```javascript
// Problem
ReferenceError: SomeClass is not defined

// Solution
global.SomeClass = MockClass;
window.SomeClass = global.SomeClass; // Sync both
```

### E2E Screenshots Show Menu
```javascript
// Problem
Screenshots show main menu instead of game

// Solution
const gameStarted = await cameraHelper.ensureGameStarted(page);
if (!gameStarted.started) throw new Error('Game failed to start');
```

### Rendering Not Updated
```javascript
// Problem
Visual changes not appearing in screenshots

// Solution
await page.evaluate(() => {
  window.gameState = 'PLAYING';
  if (window.RenderManager) window.RenderManager.render('PLAYING');
  if (typeof window.redraw === 'function') {
    window.redraw(); window.redraw(); window.redraw(); // Multiple calls
  }
});
await sleep(500); // Wait for render
```

## Quick Reference Commands

```bash
# Run specific test file
npx mocha "test/unit/path/to/test.js"

# Run with debugging
npx mocha "test/unit/path/to/test.js" --inspect-brk

# Run E2E test
node test/e2e/category/pw_feature.js

# Full test suite
npm test

# Check coverage
npm run test:coverage
```

## Checklist Usage Example

**Bug**: Ants stuck at water edges (pathfinding issue)

**Phase 1**: Document in KNOWN_ISSUES.md under "High Priority"
**Phase 2**: Write failing test in `test/unit/pathfinding/water_edge.test.js`
**Phase 3**: Fix MovementController water detection logic
**Phase 4**: Verify ants now path correctly around water
**Phase 5**: Add comments explaining water edge case
**Phase 6**: Update KNOWN_ISSUES.md to "Fixed Issues", add to CHANGELOG
**Phase 7**: Commit with message "[BugFix] Fix ants stuck at water edges"

---

**Remember**: TDD for bug fixes = Write failing test FIRST, then fix!
