# Comprehensive Test Runner

This directory contains the comprehensive test runner that executes all test suites in the proper order.

## Quick Start

Run all tests in sequence:
```bash
npm test
# or
npm run test:all
```

## Test Execution Order

The comprehensive test runner executes tests in this order:

1. **Unit Tests** - Fast, isolated tests for individual modules
2. **Integration Tests** - Tests for component interactions
3. **BDD Tests** - Behavior-driven development tests (Behave/Python)
4. **E2E Tests** - End-to-end browser tests (Puppeteer)

## Available Commands

### Comprehensive Testing
- `npm test` - Run all test suites in order
- `npm run test:all` - Same as `npm test`

### Unit Tests (Mocha + Chai)
- `npm run test:unit` - Run all unit tests with spec reporter
- `npm run test:unit:controllers` - Run controller unit tests only
- `npm run test:unit:managers` - Run manager unit tests only
- `npm run test:unit:systems` - Run system unit tests only
- `npm run test:unit:silent` - Run unit tests with minimal output

### Integration Tests
- `npm run test:integration` - Run integration tests (if any exist)

### BDD Tests (Behave/Python)
- `npm run test:bdd` - Run all BDD tests
- `npm run test:bdd:ants` - Run ant-specific BDD tests
- `npm run test:bdd:buttons` - Run button system BDD tests
- `npm run test:bdd:ui` - Run UI BDD tests
- `npm run test:bdd:integration` - Run integration BDD tests
- `npm run test:bdd:core` - Run core functionality BDD tests

### E2E Tests (Puppeteer)
- `npm run test:e2e` - Run main E2E test suite
- `npm run test:e2e:camera` - Camera system tests
- `npm run test:e2e:ui` - UI component tests
- `npm run test:e2e:entity` - Entity system tests
- `npm run test:e2e:controllers` - Controller tests
- `npm run test:e2e:ants` - Ant behavior tests
- `npm run test:e2e:all` - Run all E2E test categories

### Smoke Tests
- `npm run test:smoke` - Quick smoke tests to verify basic functionality

### Development Server
- `npm run dev` - Start Python development server on port 8000
- `npm start` - Same as `npm run dev`

## Test Runner Features

The comprehensive test runner (`test/run-all-tests.js`) provides:

- ✅ **Sequential Execution** - Tests run in proper dependency order
- ✅ **Color-coded Output** - Easy to read test results
- ✅ **Duration Tracking** - See how long each suite takes
- ✅ **Failure Detection** - Immediately see which suites failed
- ✅ **Summary Report** - Final summary with pass/fail counts
- ✅ **Optional Suites** - Skip integration tests if none exist
- ✅ **Large Buffer** - Handles extensive test output

## Test Statistics

Current test coverage:

- **Unit Tests**: 862 passing tests across 17 controller modules
- **BDD Tests**: Comprehensive behavior scenarios
- **E2E Tests**: Full browser automation with screenshot validation

## Prerequisites

### Node.js Tests (Unit/E2E)
- Node.js >= 14.0.0
- npm packages: `mocha`, `chai`, `puppeteer`

### Python Tests (BDD)
- Python 3.x
- Behave framework
- Selenium WebDriver

Install all dependencies:
```bash
npm install
npm run test:setup
```

## Writing New Tests

### Unit Tests
Place in `test/unit/` with `.test.js` extension:
```javascript
const { expect } = require('chai');
const MyModule = require('../../../Classes/MyModule.js');

describe('MyModule', function() {
  it('should do something', function() {
    expect(true).to.be.true;
  });
});
```

### BDD Tests
Place in `test/bdd/features/` with `.feature` extension:
```gherkin
Feature: My Feature
  Scenario: My Scenario
    Given some precondition
    When some action
    Then some assertion
```

### E2E Tests
Place in `test/e2e/` with descriptive names:
```javascript
const puppeteer = require('puppeteer');
const { launchBrowser } = require('./puppeteer_helper');

// Your E2E test implementation
```

## CI/CD Integration

The test runner is designed for CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run all tests
  run: npm test
```

Exit codes:
- `0` - All tests passed
- `1` - Some tests failed

## Troubleshooting

**Unit tests fail to run:**
- Ensure all dependencies are installed: `npm install`
- Check that test files have `.test.js` extension

**BDD tests fail:**
- Install Python dependencies: `npm run test:setup`
- Ensure Python 3.x is installed
- Check that Chrome/Chromium is available for Selenium

**E2E tests fail:**
- Make sure development server is running: `npm run dev`
- Check that port 8000 is available
- Verify Puppeteer can launch Chrome

**Tests timeout:**
- Increase Mocha timeout in individual test files
- Check for infinite loops or hanging promises

## Performance Tips

- Run individual test suites during development
- Use `test:unit:silent` for quick validation
- Run full suite before committing to main branch
- Use `test:smoke` for fastest feedback loop
