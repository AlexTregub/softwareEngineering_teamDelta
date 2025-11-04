# BDD Tests for Resource MVC System

## Overview

This directory contains Behavior-Driven Development (BDD) tests for the Resource MVC system using **Cucumber** and **Selenium WebDriver**.

## Structure

```
test/bdd/
├── features/
│   └── resource_mvc.feature       # Feature file with scenarios
├── steps/
│   └── resource_mvc_steps.js      # Step definitions (Selenium)
├── reports/                        # Test reports (auto-generated)
└── run_resource_mvc_tests.js      # Test runner script
```

## Prerequisites

1. **Node.js** (v14+)
2. **Chrome browser** (for Selenium WebDriver)
3. **Dev server running** on `localhost:8000`

## Running Tests

### Automatic (Recommended) - Integrated with Main Test Suite
```bash
npm test
# Runs: Unit → Integration → BDD (Python) → BDD (Resource MVC) → E2E
# Server starts automatically, tests run sequentially, server stops after
```

This is the **recommended** way to run tests as it:
- ✅ Automatically starts/stops the dev server
- ✅ Runs all test types in the correct order
- ✅ Provides comprehensive test coverage report
- ✅ No need to remember to start the server manually

### Manual (Individual Tests)

**Start the dev server (required for manual runs)**:
```bash
npm run dev
# Server will run on localhost:8000
```

**Run all scenarios**:
```bash
node test/bdd/run_resource_mvc_tests.js
# OR
npm run test:bdd:resources
```

### Run specific scenarios by tag
```bash
# Core scenarios only
node test/bdd/run_resource_mvc_tests.js --tags @core

# API scenarios only
node test/bdd/run_resource_mvc_tests.js --tags @api

# Gathering scenarios only
node test/bdd/run_resource_mvc_tests.js --tags @gathering

# Performance scenarios only
node test/bdd/run_resource_mvc_tests.js --tags @performance

# Integration scenarios only
node test/bdd/run_resource_mvc_tests.js --tags @integration

# Deprecation scenarios only
node test/bdd/run_resource_mvc_tests.js --tags @deprecation

# Factory scenarios only
node test/bdd/run_resource_mvc_tests.js --tags @factory

# Rendering scenarios only
node test/bdd/run_resource_mvc_tests.js --tags @rendering
```

### Run via npm script (optional - add to package.json)
```bash
npm run test:bdd:resources
```

## Test Scenarios

### 1. **Create resources using ResourceFactory** (@core)
- Creates 4 different resource types (green leaf, maple leaf, stick, stone)
- Verifies correct positioning at grid coordinates
- Validates resource count

### 2. **Resource Controller provides correct API** (@api)
- Verifies all MVC methods exist (getPosition, getType, getAmount, gather, isDepleted)
- Validates resource properties (type, amount)

### 3. **Gathering resources reduces amount and triggers depletion** (@gathering)
- Tests gather() functionality
- Verifies amount decreases correctly
- Tests depletion state changes

### 4. **Create multiple resources efficiently** (@performance)
- Creates 100 resources
- Validates creation time (<1 second)
- Verifies all resources have valid properties

### 5. **ResourceManager integrates with ResourceController** (@integration)
- Tests ResourceManager API with ResourceController instances
- Queries resources by type (food, wood)
- Validates filtering logic

### 6. **Old Resource class shows deprecation warning** (@deprecation)
- Creates resource using old Resource class
- Verifies deprecation warning appears in console
- Confirms backward compatibility

### 7. **ResourceFactory creates all resource types** (@factory)
- Tests all ResourceFactory methods
- Verifies instances are ResourceController
- Validates MVC pattern methods

### 8. **Resources render correctly on the game canvas** (@rendering)
- Tests resource rendering
- Captures screenshots for visual verification
- Validates sprite positioning

## Screenshots

Screenshots are automatically saved to:
```
test/e2e/screenshots/resources/bdd/
```

Examples:
- `green_leaf_at_10_10.png` - Green leaf sprite at grid (10,10)
- `both_resources_rendered.png` - Multiple resources rendered

## Browser Configuration

Tests run in **headless Chrome** by default for CI/CD compatibility.

To run with visible browser (for debugging):
1. Open `test/bdd/steps/resource_mvc_steps.js`
2. Remove `--headless` from chrome options:
   ```javascript
   // options.addArguments('--headless'); // Comment out this line
   ```

## Writing New Scenarios

### 1. Add scenario to feature file
```gherkin
# test/bdd/features/resource_mvc.feature

@resources @mvc @myfeature
Scenario: My new test scenario
  Given the game is loaded on localhost:8000
  And the game has started
  When I do something
  Then something should happen
```

### 2. Add step definitions
```javascript
// test/bdd/steps/resource_mvc_steps.js

When('I do something', async function() {
  await driver.executeScript(() => {
    // Your JavaScript code here
  });
});

Then('something should happen', async function() {
  const result = await driver.executeScript(() => {
    return window.someValue;
  });
  
  assert.strictEqual(result, expectedValue);
});
```

## Troubleshooting

### Server not running
```
Error: connect ECONNREFUSED 127.0.0.1:8000
```
**Solution**: Start dev server with `npm run dev`

### Chrome driver issues
```
Error: ChromeDriver not found
```
**Solution**: Update chromedriver: `npm install chromedriver@latest`

### Browser timeout
```
Error: Game did not load in time
```
**Solution**: Increase timeout in step definitions or check browser console for errors

### MVC classes not loading
```
Error: ResourceFactory not available
```
**Solution**: 
1. Check index.html has all MVC scripts loaded
2. Verify script load order (BaseModel → BaseView → BaseController → ResourceModel → ResourceView → ResourceController → ResourceFactory)
3. Check browser console for JavaScript errors

## BDD Best Practices

### ✅ DO:
- Use plain language (user-facing behavior)
- Test complete workflows (create → gather → deplete)
- Verify real browser behavior with Selenium
- Capture screenshots for visual verification
- Run headless for CI/CD

### ❌ DON'T:
- Test implementation details (use unit tests)
- Use technical jargon in scenarios
- Mock browser APIs (use real browser)
- Ignore screenshot failures

## Integration with CI/CD

Add to your CI pipeline:
```yaml
# .github/workflows/test.yml
- name: Run BDD Tests
  run: |
    npm run dev &
    sleep 5
    node test/bdd/run_resource_mvc_tests.js
```

## Related Documentation

- [MVC Refactoring Roadmap](../../docs/roadmaps/MVC_REFACTORING_ROADMAP.md)
- [Resource Migration Guide](../../docs/guides/RESOURCE_MIGRATION_GUIDE.md)
- [Testing Methodology](../../docs/standards/testing/TESTING_METHODOLOGY_STANDARDS.md)
- [BDD Language Style Guide](../../docs/standards/testing/BDD_LANGUAGE_STYLE_GUIDE.md)
