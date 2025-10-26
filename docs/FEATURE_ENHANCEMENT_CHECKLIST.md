# Feature Enhancement Checklist

Use this checklist for implementing new features or enhancements following TDD methodology.

## Phase 1: Planning & Design (Before Writing Code)

- [ ] **Define Requirements**
  - [ ] Write clear user story or feature description
  - [ ] Identify acceptance criteria
  - [ ] List affected systems/components
  - [ ] Document expected behavior

- [ ] **Design Architecture**
  - [ ] Sketch component interactions
  - [ ] Identify dependencies
  - [ ] Plan API/method signatures
  - [ ] Consider edge cases

- [ ] **Review Existing Code**
  - [ ] Identify files that need modification
  - [ ] Check for similar existing functionality
  - [ ] Review related documentation
  - [ ] Check for breaking changes

## Phase 2: Unit Tests (TDD Red Phase)

- [ ] **Write Failing Unit Tests FIRST**
  - [ ] Create test file: `test/unit/[category]/[feature].test.js`
  - [ ] Mock all dependencies (p5.js, managers, etc.)
  - [ ] Test individual methods in isolation
  - [ ] Cover happy path scenarios
  - [ ] Cover edge cases and error handling
  - [ ] Target 80%+ code coverage

- [ ] **Run Unit Tests (Expect Failures)**
  - [ ] Command: `npx mocha "test/unit/[category]/[feature].test.js"`
  - [ ] Verify tests fail for correct reasons
  - [ ] Document expected failures

## Phase 3: Implementation (TDD Green Phase)

- [ ] **Implement Minimal Code**
  - [ ] Write only enough code to pass tests
  - [ ] Follow existing code style
  - [ ] Add JSDoc comments
  - [ ] Use descriptive variable names
  - [ ] Keep functions small and focused

- [ ] **Run Unit Tests (Expect Pass)**
  - [ ] Command: `npx mocha "test/unit/[category]/[feature].test.js"`
  - [ ] All tests should pass
  - [ ] Fix any failures
  - [ ] Check code coverage

- [ ] **Refactor (If Needed)**
  - [ ] Improve code structure
  - [ ] Remove duplication
  - [ ] Optimize performance
  - [ ] Re-run tests after each refactor

## Phase 4: Integration Tests

- [ ] **Write Integration Tests**
  - [ ] Create test file: `test/integration/[category]/[feature].integration.test.js`
  - [ ] Test component interactions with real dependencies
  - [ ] Verify data flows between systems
  - [ ] Test configuration loading
  - [ ] Test state management

- [ ] **Run Integration Tests**
  - [ ] Command: `npx mocha "test/integration/[category]/[feature].integration.test.js"`
  - [ ] Verify all integration tests pass
  - [ ] Check for memory leaks
  - [ ] Verify cleanup/teardown

## Phase 5: E2E Tests (Visual Verification)

- [ ] **Write E2E Tests with Screenshots**
  - [ ] Create test file: `test/e2e/[category]/pw_[feature].js`
  - [ ] Use Puppeteer helper functions
  - [ ] Include `ensureGameStarted()` to bypass menu
  - [ ] Force rendering with `redraw()` after state changes
  - [ ] Take screenshots for visual proof
  - [ ] Run headless for CI/CD

- [ ] **Run E2E Tests**
  - [ ] Command: `node test/e2e/[category]/pw_[feature].js`
  - [ ] Verify screenshots in `test/e2e/screenshots/`
  - [ ] Check visual correctness
  - [ ] Verify no console errors

## Phase 6: Documentation

- [ ] **Update Code Documentation**
  - [ ] Add/update JSDoc comments
  - [ ] Document public APIs
  - [ ] Add usage examples
  - [ ] Document configuration options

- [ ] **Update Project Documentation**
  - [ ] Update README if user-facing
  - [ ] Add to architecture docs if needed
  - [ ] Update CHANGELOG.md
  - [ ] Create feature guide if complex

## Phase 7: Integration & Cleanup

- [ ] **Run Full Test Suite**
  - [ ] Command: `npm test`
  - [ ] All unit tests pass
  - [ ] All integration tests pass
  - [ ] All E2E tests pass
  - [ ] No regressions

- [ ] **Code Review Checklist**
  - [ ] Code follows project style guide
  - [ ] No hardcoded values (use constants)
  - [ ] No console.log in production code
  - [ ] Error handling implemented
  - [ ] Memory leaks prevented

- [ ] **Performance Check**
  - [ ] No performance regressions
  - [ ] Efficient algorithms used
  - [ ] Proper caching implemented
  - [ ] No unnecessary re-renders

## Phase 8: Commit & Push

- [ ] **Prepare Commit**
  - [ ] Stage all changed files
  - [ ] Write descriptive commit message
  - [ ] Follow commit message format
  - [ ] Include issue/ticket reference

- [ ] **Commit Message Format**
  ```
  [Type] Brief description (50 chars max)
  
  Detailed explanation:
  - What changed
  - Why it changed
  - How it works
  
  Changes:
  - File1: Description
  - File2: Description
  
  Tests:
  - Unit tests added/updated
  - Integration tests added/updated
  - E2E tests added/updated
  ```

- [ ] **Push & Verify**
  - [ ] Push to feature branch
  - [ ] Verify CI/CD passes
  - [ ] Check build status
  - [ ] Review on GitHub

## Common Pitfalls to Avoid

❌ **DON'T:**
- Skip writing tests first (TDD is mandatory)
- Test implementation details (test behavior, not internals)
- Write tests that depend on execution order
- Hardcode test data that should be dynamic
- Skip E2E screenshots (visual proof required)
- Use global state in tests
- Test loop counters or trivial code

✅ **DO:**
- Write tests before implementation (TDD Red-Green-Refactor)
- Mock external dependencies
- Use descriptive test names
- Test edge cases and error conditions
- Provide screenshot proof in E2E tests
- Clean up after each test (afterEach)
- Follow the existing test patterns

## Quick Reference Commands

```bash
# Unit tests
npx mocha "test/unit/[category]/[feature].test.js"

# Integration tests
npx mocha "test/integration/[category]/[feature].integration.test.js"

# E2E tests
node test/e2e/[category]/pw_[feature].js

# All tests
npm test

# Run with coverage
npm run test:coverage
```

## Template Files Location

- Unit Test Template: `test/templates/unit.test.template.js`
- Integration Test Template: `test/templates/integration.test.template.js`
- E2E Test Template: `test/templates/e2e.template.js`
