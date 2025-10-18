# Software Testing Types - A Comprehensive Guide

**Date**: October 18, 2025  
**Purpose**: Understanding different testing types and when to use them

---

## The Test Pyramid 🔺

```
                    /\
                   /  \
                  / E2E \          ← Fewer, slower, expensive
                 /------\
                /        \
               / Integration \     ← Medium quantity, medium speed
              /--------------\
             /                \
            /   Unit Tests     \   ← Many, fast, cheap
           /____________________\
```

**Key Principle**: More tests at the bottom (fast, cheap), fewer at the top (slow, expensive).

---

## 1. Unit Tests 🧩

### What They Are
Tests for **individual functions, methods, or classes** in isolation. The smallest testable parts of your code.

### Purpose
- Verify a single unit of code works correctly
- Test logic, calculations, data transformations
- Catch bugs early in specific functions

### Characteristics
- ⚡ **Very Fast** (milliseconds per test)
- 💰 **Cheap** to write and maintain
- 🎯 **Focused** on one thing
- 🔒 **Isolated** (no database, no network, no file system)
- 🎭 **Uses Mocks** for dependencies

### Example from Your Codebase
```javascript
// test/unit/button.test.js
describe('Button', () => {
  it('should calculate correct position', () => {
    const button = new Button(10, 20, 100, 50, 'Click Me');
    expect(button.x).toBe(10);
    expect(button.y).toBe(20);
  });
  
  it('should detect click inside bounds', () => {
    const button = new Button(0, 0, 100, 50, 'Click Me');
    expect(button.isClicked(50, 25)).toBe(true);
    expect(button.isClicked(200, 200)).toBe(false);
  });
});
```

### When to Use
✅ Testing utility functions  
✅ Testing business logic  
✅ Testing calculations and algorithms  
✅ Testing data transformations  
✅ Testing class methods in isolation

### When NOT to Use
❌ Testing UI interactions  
❌ Testing database queries  
❌ Testing API calls  
❌ Testing multiple components together

---

## 2. Integration Tests 🔗

### What They Are
Tests that verify **multiple components work together correctly**. Tests the "glue" between units.

### Purpose
- Verify components interact correctly
- Test data flow between modules
- Catch interface/contract bugs
- Test database queries, API calls

### Characteristics
- 🐢 **Slower** than unit tests (seconds per test)
- 💵 **More expensive** to write and maintain
- 🌐 **Broader scope** (multiple components)
- 🔌 **Uses real dependencies** (or close to real)

### Example from Your Codebase
```javascript
// test/integration/resourceSystemManagerIntegration.test.js (old version)
describe('ResourceSystemManager Integration', () => {
  it('should spawn resources and add to global list', () => {
    const initialCount = g_resourceManager.getResourceList().length;
    g_resourceManager.forceSpawn();
    const afterCount = g_resourceManager.getResourceList().length;
    expect(afterCount).toBeGreaterThan(initialCount);
  });
  
  it('should integrate with selection system', () => {
    const resource = g_resourceManager.getResourceList()[0];
    g_selectionController.select(resource);
    expect(g_selectionController.getSelected()).toContain(resource);
  });
});
```

### When to Use
✅ Testing database + business logic together  
✅ Testing API calls + data processing  
✅ Testing multiple managers working together  
✅ Testing file I/O operations  
✅ Testing message passing between components

### When NOT to Use
❌ Testing simple functions (use unit tests)  
❌ Testing full user workflows (use E2E tests)  
❌ When mocking everything (that's a unit test)

---

## 3. End-to-End (E2E) Tests 🌍

### What They Are
Tests that simulate **real user behavior** from start to finish. Test the entire application as a black box.

### Purpose
- Verify complete user workflows work
- Test from user's perspective
- Catch integration bugs across the whole system
- Verify UI + backend + database all work together

### Characteristics
- 🐌 **Very Slow** (seconds to minutes per test)
- 💸 **Expensive** to write and maintain
- 🎬 **Full workflow** testing
- 🌐 **Real browser, real server, real database**
- 📸 **Often includes screenshots/videos**

### Example from Your Codebase
```javascript
// test/puppeteer/selection/pw_selection_deterministic.js
describe('E2E: Select Ants', () => {
  it('should allow user to click and select an ant', async () => {
    // 1. Load game
    await page.goto('http://localhost:8000');
    await page.waitForSelector('canvas');
    
    // 2. Start game
    await page.click('#playButton');
    await page.waitFor(1000);
    
    // 3. Click on ant
    const ant = await page.evaluate(() => g_antManager.ants[0]);
    await page.mouse.click(ant.x, ant.y);
    
    // 4. Verify selection
    const selected = await page.evaluate(() => 
      g_selectionController.getSelected()
    );
    expect(selected.length).toBe(1);
  });
});
```

### When to Use
✅ Testing critical user workflows (login, checkout, etc.)  
✅ Testing cross-browser compatibility  
✅ Testing UI interactions end-to-end  
✅ Smoke tests (does it basically work?)  
✅ Regression tests (did we break something?)

### When NOT to Use
❌ Testing business logic (too slow)  
❌ Testing edge cases (too many tests)  
❌ Testing every possible scenario (use unit tests)

---

## 4. BDD (Behavior-Driven Development) Tests 📝

### What They Are
Tests written in **human-readable language** (Given-When-Then) that describe business requirements. Often uses tools like Cucumber, Behave.

### Purpose
- Bridge gap between technical and non-technical people
- Document requirements as tests
- Ensure features match business needs
- Living documentation

### Characteristics
- 📖 **Readable** by non-programmers
- 🎯 **Feature-focused** (not implementation-focused)
- 🔄 **Can be E2E or Integration** (depends on implementation)
- 📚 **Self-documenting**

### Example from Your Codebase
```gherkin
# test/bdd_new/features/ant_creation_and_properties.feature
Feature: Ant Creation and Properties
  As a game developer
  I want to create ants with specific properties
  So that the game has diverse ant types

  Scenario: Create a basic ant
    Given the game is initialized
    When I create an ant at position (100, 200)
    Then the ant should exist at coordinates (100, 200)
    And the ant should have a health value
    And the ant should have a movement speed

  Scenario: Create multiple ant types
    Given the game is initialized
    When I create a "worker" ant
    And I create a "soldier" ant
    And I create a "queen" ant
    Then I should have 3 ants total
    And each ant should have different job types
```

### When to Use
✅ Defining requirements with stakeholders  
✅ User acceptance testing (UAT)  
✅ When non-technical people write tests  
✅ Complex business rules  
✅ Living documentation of features

### When NOT to Use
❌ Testing technical implementation details  
❌ When you don't need human-readable tests  
❌ Simple utility functions

---

## 5. Smoke Tests 💨

### What They Are
**Quick sanity checks** to ensure basic functionality works. "Is it on fire?" 🔥

### Purpose
- Verify build didn't catastrophically break
- Quick feedback before running full test suite
- Verify critical paths work

### Characteristics
- ⚡ **Very Fast** (usually < 1 minute total)
- 🎯 **Minimal coverage** (just critical paths)
- 🚨 **First line of defense**

### Example
```javascript
// test/puppeteer/helper_smoke_test.js
describe('Smoke Test', () => {
  it('should load the game without errors', async () => {
    await page.goto('http://localhost:8000');
    const errors = await page.evaluate(() => window.errors || []);
    expect(errors.length).toBe(0);
  });
  
  it('should have core managers initialized', async () => {
    const managersExist = await page.evaluate(() => {
      return !!(window.g_antManager && 
                window.g_resourceManager && 
                window.cameraManager);
    });
    expect(managersExist).toBe(true);
  });
});
```

### When to Use
✅ After every commit  
✅ Before running full test suite  
✅ CI/CD first step  
✅ After deployments

---

## 6. Regression Tests 🔄

### What They Are
Tests that verify **previously fixed bugs don't come back**. Usually E2E or integration level.

### Purpose
- Prevent old bugs from reappearing
- Ensure changes don't break existing features
- Build confidence in refactoring

### Characteristics
- 📦 **Accumulates over time** (grows with each bug fix)
- 🎯 **Targets specific bugs**
- 🔒 **Protects against regressions**

### Example from Your Codebase
```javascript
// test/unit/spawn-interaction.regression.test.js
describe('Regression: Spawn Interaction Bug #145', () => {
  it('should not crash when spawning resources during ant movement', () => {
    // This test was added after bug #145 was fixed
    const ant = new Ant(100, 100);
    ant.startMoving(200, 200);
    
    // This used to crash
    expect(() => {
      g_resourceManager.forceSpawn();
    }).not.toThrow();
  });
});
```

### When to Use
✅ After fixing every bug  
✅ Before releases  
✅ Protecting critical features

---

## 7. Performance Tests ⚡

### What They Are
Tests that measure **speed, throughput, resource usage**. Not pass/fail, but metrics.

### Purpose
- Ensure code meets performance requirements
- Catch performance regressions
- Identify bottlenecks

### Characteristics
- ⏱️ **Time-based** (measures execution time)
- 📊 **Metrics-focused** (not pass/fail)
- 🎯 **Baseline comparison** (is it slower than before?)

### Example
```javascript
describe('Performance: Ant Pathfinding', () => {
  it('should find path in less than 16ms (60fps)', () => {
    const start = performance.now();
    const path = findPath(startPos, endPos, obstacles);
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(16); // 60fps frame budget
  });
  
  it('should handle 1000 ants without frame drops', () => {
    for (let i = 0; i < 1000; i++) {
      new Ant(random(0, 800), random(0, 600));
    }
    
    const fps = measureFPS(60); // Measure for 60 frames
    expect(fps).toBeGreaterThan(55); // Allow 5fps drop
  });
});
```

### When to Use
✅ Performance-critical code (game loops, rendering)  
✅ Before/after optimization  
✅ CI/CD to catch regressions

---

## 8. Visual Regression Tests 👁️

### What They Are
Tests that take **screenshots and compare them** to baseline images. Catches visual bugs.

### Purpose
- Ensure UI looks correct
- Catch unintended visual changes
- Test across browsers/devices

### Characteristics
- 📸 **Screenshot-based**
- 🎨 **Visual comparison**
- 🖥️ **Cross-browser testing**

### Example from Your Codebase (Implicit)
```javascript
// Your Puppeteer tests save screenshots
await saveScreenshot(page, 'camera/zoom_in', true);
// ↑ This creates a visual record you can compare
```

### When to Use
✅ Testing UI components  
✅ Cross-browser testing  
✅ Design system validation  
✅ After CSS changes

---

## 9. Snapshot Tests 📷

### What They Are
Tests that save the **output of a function/component** and compare future runs to it.

### Purpose
- Catch unexpected changes in output
- Quick way to test complex output
- Documentation of expected output

### Characteristics
- 💾 **Saves expected output** to file
- 🔄 **Compares on each run**
- 🤔 **Review changes manually**

### Example (Jest)
```javascript
describe('Ant Stats Display', () => {
  it('should match snapshot', () => {
    const ant = new Ant(100, 100, { health: 100, speed: 2.5 });
    const stats = ant.getStatsDisplay();
    expect(stats).toMatchSnapshot();
    // First run: saves stats to __snapshots__/
    // Future runs: compares to saved snapshot
  });
});
```

### When to Use
✅ Testing complex object structures  
✅ Testing rendered output (HTML, etc.)  
✅ Quick way to test lots of properties

### When NOT to Use
❌ When output changes frequently  
❌ When output includes timestamps/random data

---

## 10. Load/Stress Tests 💪

### What They Are
Tests that put the system under **heavy load** to see how it handles pressure.

### Purpose
- Find breaking points
- Ensure scalability
- Test under realistic load

### Characteristics
- 🔥 **High volume/concurrency**
- ⏱️ **Long-running**
- 📊 **Metrics-focused**

### Example
```javascript
describe('Load Test: 10,000 Concurrent Ants', () => {
  it('should maintain performance with massive ant count', () => {
    const ants = [];
    for (let i = 0; i < 10000; i++) {
      ants.push(new Ant(random(0, 2000), random(0, 2000)));
    }
    
    const start = performance.now();
    gameLoop(); // Run one frame
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(16); // Still 60fps
  });
});
```

### When to Use
✅ Before launch  
✅ Server/multiplayer games  
✅ Large-scale simulations

---

## Your Codebase Test Structure 📁

Here's what you currently have:

```
test/
├── unit/                    # Unit Tests (fast, isolated)
│   ├── button.test.js
│   ├── collisionBox2D.test.js
│   ├── taskManager.test.js
│   └── ...
│
├── integration/             # Integration Tests (deprecated, mostly cleaned)
│   └── run_unit_tests.js   # CI/CD runner
│
├── puppeteer/               # E2E Tests (browser automation)
│   ├── camera/
│   │   ├── pw_camera_zoom.js
│   │   └── ...
│   ├── spawn/
│   ├── combat/
│   ├── selection/
│   ├── ui/                  # New! Panel dragging
│   └── run-tests.js
│
└── bdd_new/                 # BDD Tests (Gherkin/Behave)
    ├── features/
    │   ├── ant_creation_and_properties.feature
    │   ├── ant_faction_system.feature
    │   └── ...
    └── steps/
```

---

## Test Coverage Goals 🎯

### Unit Tests
- **Goal**: 70-80% code coverage
- **Your Status**: Good coverage on core systems

### Integration Tests
- **Goal**: Test all major component interactions
- **Your Status**: Migrating to Puppeteer (good move!)

### E2E Tests
- **Goal**: Cover critical user workflows
- **Your Status**: Excellent organization (camera, spawn, combat, selection, ui)

### BDD Tests
- **Goal**: Document all features
- **Your Status**: Strong feature coverage

---

## Quick Decision Guide 🤔

**"What test type should I write?"**

```
Is it a single function/method?
├─ YES → Unit Test
└─ NO
    │
    Does it involve multiple components?
    ├─ YES → Integration Test
    └─ NO
        │
        Does it simulate user behavior in browser?
        ├─ YES → E2E Test (Puppeteer)
        └─ NO
            │
            Is it a business requirement?
            ├─ YES → BDD Test
            └─ NO → Probably Unit Test
```

---

## Common Anti-Patterns ⚠️

### 1. Testing Implementation, Not Behavior
```javascript
❌ BAD:
it('should call _privateMethod 3 times', () => {
  const spy = jest.spyOn(obj, '_privateMethod');
  obj.doSomething();
  expect(spy).toHaveBeenCalledTimes(3);
});

✅ GOOD:
it('should process all items', () => {
  const result = obj.doSomething([1, 2, 3]);
  expect(result).toEqual([2, 4, 6]);
});
```

### 2. Too Many Mocks in Integration Tests
```javascript
❌ BAD: (This is really a unit test!)
it('integration test', () => {
  const mockDB = jest.fn();
  const mockAPI = jest.fn();
  const mockCache = jest.fn();
  // Everything is mocked!
});

✅ GOOD:
it('integration test', () => {
  // Use real database (or test database)
  // Use real API (or test server)
  // Test actual integration!
});
```

### 3. E2E Tests for Everything
```javascript
❌ BAD: (Way too slow!)
it('should calculate 2 + 2 = 4', async () => {
  await page.goto('http://localhost:8000');
  await page.type('#num1', '2');
  await page.type('#num2', '2');
  await page.click('#add');
  const result = await page.textContent('#result');
  expect(result).toBe('4');
});

✅ GOOD: (Unit test!)
it('should calculate 2 + 2 = 4', () => {
  expect(add(2, 2)).toBe(4);
});
```

---

## Summary Table 📊

| Test Type | Speed | Cost | Scope | When to Use |
|-----------|-------|------|-------|-------------|
| **Unit** | ⚡⚡⚡ Very Fast | 💰 Cheap | 🎯 Single function | Always! Most tests |
| **Integration** | ⚡⚡ Fast | 💰💰 Medium | 🔗 Multiple components | Component interactions |
| **E2E** | ⚡ Slow | 💰💰💰 Expensive | 🌍 Full system | Critical user workflows |
| **BDD** | ⚡ Varies | 💰💰 Medium | 📝 Feature-level | Business requirements |
| **Smoke** | ⚡⚡⚡ Very Fast | 💰 Cheap | 🚨 Basic checks | After every build |
| **Regression** | ⚡⚡ Fast | 💰 Cheap | 🐛 Specific bugs | After bug fixes |
| **Performance** | ⚡ Varies | 💰💰 Medium | ⏱️ Speed/resources | Performance-critical code |
| **Visual** | ⚡ Slow | 💰💰💰 Expensive | 👁️ UI appearance | UI components |
| **Load** | 🐌 Very Slow | 💰💰💰 Expensive | 💪 Under pressure | Before launch |

---

## Further Reading 📚

- [Testing Pyramid (Martin Fowler)](https://martinfowler.com/articles/practical-test-pyramid.html)
- [Test-Driven Development (TDD)](https://en.wikipedia.org/wiki/Test-driven_development)
- [Behavior-Driven Development (BDD)](https://cucumber.io/docs/bdd/)
- Your own: `docs/standards/testing/TESTING_METHODOLOGY_STANDARDS.md`

---

**Key Takeaway**: Use the right tool for the job. Most of your tests should be fast unit tests. Save expensive E2E tests for critical workflows. 🎯
