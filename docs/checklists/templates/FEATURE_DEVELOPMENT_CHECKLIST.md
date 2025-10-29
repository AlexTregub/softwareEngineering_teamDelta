# Feature Development Checklist Template

Based on the Level Editor Panel Management feature implementation (October 2025)

## Pre-Development

### Requirements Analysis
- [ ] List affected systems/components
- [ ] Identify potential side effects or dependencies
- [ ] Review existing code architecture
- [ ] Write failing unit tests first
- [ ] Identify files that need modification
- [ ] Consider backward compatibility
- [ ] Document technical decisions

## Implementation Phase

### 1. Core Feature Implementation

#### Source Code Changes
- [ ] Implement primary feature logic
- [ ] Add configuration options/flags (e.g., `managedExternally`)
- [ ] Update affected systems to respect new logic
- [ ] Add null checks and defensive programming
- [ ] Follow existing code style and patterns
- [ ] Test at the end of the primary implementation

#### Code Quality
- [ ] Add inline comments for complex logic
- [ ] Use descriptive variable/function names
- [ ] Adhere to DRY
- [ ] Adhere to SRC
- [ ] Keep functions focused and single-purpose
- [ ] Handle edge cases

### 2. Integration Points

#### Update Dependent Systems
- [ ] Identify all systems that interact with the feature
- [ ] Update integration points (e.g., render pipelines)
- [ ] Ensure proper initialization order
- [ ] Verify event handling still works
- [ ] Check for circular dependencies

#### Clean Up Obsolete Code If Needed
- [ ] Remove unused/deprecated components
- [ ] Clean up dead code references
- [ ] Update comments and documentation
- [ ] Remove obsolete configuration files
- [ ] Archive or delete removed features

### 3. Testing Strategy

#### Unit Tests
- [ ] Write tests for new functionality
- [ ] Test edge cases and boundary conditions
- [ ] Test error handling
- [ ] Verify mock objects are properly configured
- [ ] Ensure test isolation (no shared state)
- [ ] Target 100% code coverage for new code

#### Integration Tests
- [ ] Test interactions between systems
- [ ] Verify end-to-end workflows
- [ ] Test state transitions
- [ ] Add proper setup/teardown (beforeEach/afterEach)
- [ ] Mock external dependencies appropriately
- [ ] Test error propagation

#### BDD/Behavioral Tests
- [ ] Update scenario tests if applicable
- [ ] Verify user-facing behavior
- [ ] Test state persistence
- [ ] Disable obsolete scenarios appropriately

#### E2E Tests
- [ ] Test in browser automation (Puppeteer/Selenium)
- [ ] Verify UI interactions work correctly
- [ ] Test with real user workflows
- [ ] Add timeouts to prevent hanging
- [ ] Capture screenshots for failures

### 4. Test Fixes and Debugging

#### Test Environment Setup
- [ ] Configure JSDOM properly for browser APIs
- [ ] Sync `global` and `window` objects
- [ ] Mock p5.js functions if needed
- [ ] Set up test fixtures and data
- [ ] Configure proper timeouts

## Verification Phase

### Run Test Suites
- [ ] Run unit tests: `npm run test:unit`
- [ ] Run integration tests: `npm run test:integration`
- [ ] Run BDD tests: `npm run test:bdd`
- [ ] Run E2E tests: `npm run test:e2e`
- [ ] Run full test suite: `npm test`

### Verify Test Results
- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] BDD tests passing
- [ ] E2E tests passing

### Manual Testing
- [ ] Test in actual browser (Chrome/Firefox/Safari)
- [ ] Verify UI components render correctly
- [ ] Test user interactions (clicks, drags, inputs, etc)
- [ ] Check browser console for errors
- [ ] Test on different screen sizes
- [ ] Verify performance (no lag or freezes)

## Bug Fixes

### Identify Issues
- [ ] Review test failure messages
- [ ] Check browser console errors
- [ ] Analyze stack traces
- [ ] Reproduce issues
- [ ] Document error patterns

### Fix Common Problems
- [ ] Missing null checks → Add defensive programming
- [ ] Undefined variables → Check initialization order
- [ ] Function not found → Verify imports and global scope
- [ ] Test pollution → Add cleanup in beforeEach/afterEach
- [ ] Timing issues → Add proper async/await or timeouts
- [ ] Mock missing → Add required mock objects

## Documentation

### Code Documentation
- [ ] Add JSDoc comments to public functions
- [ ] Document complex algorithms
- [ ] Explain non-obvious design decisions
- [ ] Add examples for API usage
- [ ] Update README if needed

### Test Documentation
- [ ] Document test setup requirements
- [ ] Explain mock object purposes
- [ ] Add comments for non-obvious assertions
- [ ] Document known limitations
- [ ] Create test data fixtures

### Feature Documentation
- [ ] Write user-facing documentation
- [ ] Create architecture diagrams if needed
- [ ] Document configuration options
- [ ] Add troubleshooting guide
- [ ] Update CHANGELOG

## Pre-Commit Checklist

### Code Quality
- [ ] No console.log statements (or marked for removal)
- [ ] No commented-out code (unless with explanation)
- [ ] No TODO comments without ticket reference
- [ ] Proper error handling throughout
- [ ] No hard-coded values (use constants)

### Testing
- [ ] All tests passing locally
- [ ] Test coverage meets minimum threshold
- [ ] No skipped tests without justification
- [ ] Test names are descriptive
- [ ] No flaky tests

### Version Control
- [ ] Meaningful commit messages
- [ ] Commits are atomic (one logical change each)
- [ ] No merge conflicts
- [ ] Branch up to date with main/develop
- [ ] No accidentally committed files (node_modules, etc.)

## Post-Implementation Review

### Code Review
- [ ] Self-review all changes
- [ ] Check for potential performance issues
- [ ] Verify security implications
- [ ] Ensure accessibility standards
- [ ] Review error messages for clarity

### Testing Summary
- [ ] Document test pass rates
- [ ] List any known issues
- [ ] Explain any skipped tests
- [ ] Document test environment issues
- [ ] Create summary report

### Cleanup
- [ ] Remove debug code
- [ ] Clean up temporary files
- [ ] Archive old documentation
- [ ] Update dependency versions if needed
- [ ] Remove unused imports

---

## Example: Level Editor Panel Management Feature

#### Implementation
1. Added `managedExternally` flag to panel configuration
2. Updated `DraggablePanelManager.renderPanels()` to skip managed panels
3. Removed obsolete ButtonGroupManager and action system

#### Testing
1. Unit Tests:
   - 11 new tests for DraggablePanelSystem (38 total, 100% passing)
   - 4 new tests for LevelEditorPanels (28 total, 100% passing)

2. Integration Tests:
   - Added UIRenderer mock
   - Added renderCallOrder cleanup in beforeEach
   - Skipped obsolete buttonGroups test
   - 69 passing, 1 pending (98.6%)

3. BDD Tests:
   - Disabled obsolete button system tests
   - 5/6 scenarios passing (83.3%)

4. E2E Tests:
   - 8/9 tests passing (88.9%)

#### Bug Fixes
1. Fixed double-rendering issue (panels growing)
2. Fixed test isolation (state accumulation)
3. Fixed missing mocks (UIRenderer)
4. Fixed test runner hanging (timeouts)

#### Documentation
- Created TEST_CLEANUP_SUMMARY.md
- Updated todo list
- This checklist template

### Results
- **Overall test pass rate**: 87.6% (92/105 tests)
- **Files modified**: 7 (3 source, 4 test)
- **Lines changed**: ~200 additions, ~150 deletions
- **Time to complete**: ~2 hours

---

## Best Practices Learned

### Test Isolation
```javascript
beforeEach(function() {
  // Clear shared state between tests
  renderCallOrder = [];
  renderedLayers.clear();
});
```

### Mock at Guard Clauses
```javascript
// Mock where it's checked, not just where it's used
global.UIRenderer = {};
window.UIRenderer = global.UIRenderer;
```

### JSDOM Synchronization
```javascript
// Always sync both objects
global.SomeClass = MockClass;
window.SomeClass = global.SomeClass;
```

### Defensive Programming
```javascript
// Add null checks for optional systems
if (system && system.enableDebugUI) {
  system.enableDebugUI();
}
```

### Pragmatic Solutions
- Skip obsolete tests rather than deleting (preserve history)
- Document workarounds for future maintainers

---

## Resources

### Testing Commands
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:bdd
npm run test:e2e

# Run specific test file
npx mocha "test/unit/path/to/test.js" --reporter spec

# Run with debugging
npx mocha "test/unit/path/to/test.js" --inspect-brk
```

### Common Test Patterns
- **Unit**: Mock all dependencies, test in isolation
- **Integration**: Mock external systems only, test interactions
- **BDD**: Test user-facing behavior, use Selenium/WebDriver
- **E2E**: Full browser automation, test real workflows

