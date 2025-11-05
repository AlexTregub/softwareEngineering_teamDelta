# ESLint Configuration - Test Helper Enforcement

## Overview
This project uses ESLint v9 with custom rules to **enforce test helper usage** and reduce test file duplication. The linter automatically catches manual JSDOM setup, mock creation, and other anti-patterns.

## Quick Start

### Run Linting
```bash
# Lint entire project
npm run lint

# Auto-fix issues where possible
npm run lint:fix

# Lint only tests
npm run lint:test

# Lint unit tests
npm run lint:test:unit

# Lint integration tests
npm run lint:test:integration
```

## Enforced Rules

### ❌ VIOLATIONS (Will cause linting errors)

1. **Manual JSDOM Creation**
   ```javascript
   // ❌ WRONG
   const { JSDOM } = require('jsdom');
   const dom = new JSDOM('...');
   
   // ✅ CORRECT
   const { setupTestEnvironment } = require('../helpers/mvcTestHelpers');
   setupTestEnvironment();
   ```

2. **Manual global.window Assignment**
   ```javascript
   // ❌ WRONG
   global.window = dom.window;
   
   // ✅ CORRECT
   setupTestEnvironment(); // Handles this automatically
   ```

3. **Manual global.document Assignment**
   ```javascript
   // ❌ WRONG
   global.document = dom.window.document;
   
   // ✅ CORRECT
   setupTestEnvironment(); // Handles this automatically
   ```

4. **Manual sinon.restore()**
   ```javascript
   // ❌ WRONG
   after(function() {
     sinon.restore();
   });
   
   // ✅ CORRECT
   afterEach(function() {
     cleanupTestEnvironment(); // Restores all stubs
   });
   ```

5. **Using p5.Vector instead of createVector()**
   ```javascript
   // ❌ WRONG
   const vec = new p5.Vector(10, 10);
   
   // ✅ CORRECT
   const vec = createVector(10, 10); // Provided by setupTestEnvironment
   ```

6. **Manual CollisionBox2D Mocking**
   ```javascript
   // ❌ WRONG
   global.CollisionBox2D = sinon.stub();
   
   // ✅ CORRECT
   setupTestEnvironment(); // Includes real CollisionBox2D implementation
   ```

## Test Helper Usage

### Basic Setup (Unit Tests)
```javascript
const { expect } = require('chai');
const { setupTestEnvironment, cleanupTestEnvironment } = require('../../helpers/mvcTestHelpers');

// Setup environment at top level
setupTestEnvironment();

describe('MyClass', function() {
  let MyClass;
  
  before(function() {
    MyClass = require('../../../Classes/MyClass');
  });
  
  afterEach(function() {
    cleanupTestEnvironment(); // MUST call in afterEach
  });
  
  it('should work', function() {
    // Test code
  });
});
```

### With Rendering Support
```javascript
// Include p5.js rendering functions (push, pop, fill, etc.)
setupTestEnvironment({ rendering: true });
```

### With Sprite Support
```javascript
// Include Sprite2d mock
setupTestEnvironment({ rendering: true, sprite: true });
```

## Configuration Details

### File: `eslint.config.js`
- **Format**: ESLint v9 flat config (ES modules)
- **Location**: Project root
- **Custom Rules**: Syntax restrictions for test files

### Scope
Rules apply to:
- `test/unit/**/*.test.js`
- `test/integration/**/*.test.js`
- MVC-specific tests (models, views, controllers)

### Ignored Patterns
- `node_modules/`
- `libraries/`
- `test/baseline/`
- `test/e2e/screenshots/`
- `*.min.js`

## Benefits

### Before (Manual Setup)
```javascript
// 15+ lines of boilerplate per test file
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.createVector = (x, y, z) => ({ x, y, z });
global.CollisionBox2D = class { /* mock */ };
// ... more setup
```

### After (Test Helpers)
```javascript
// 1 line
setupTestEnvironment({ rendering: true, sprite: true });
```

**Reduction**: ~15 lines → 1 line per test file ≈ **93% less boilerplate**

## Troubleshooting

### Warning: Module type not specified
```
Warning: Module type of eslint.config.js is not specified
```
**Ignore this warning**. ESLint v9 uses ES modules but the project uses CommonJS. This doesn't affect functionality.

### Linting fails on valid code
Make sure you're using the helper functions:
1. Import `setupTestEnvironment` and `cleanupTestEnvironment`
2. Call `setupTestEnvironment()` at top level
3. Call `cleanupTestEnvironment()` in `afterEach()`

### False positives
If a rule incorrectly flags valid code, add an ESLint disable comment:
```javascript
// eslint-disable-next-line no-restricted-syntax
const specialCase = require('special');
```

## Example Files

### Bad Example (Violations)
See: `test/unit/_examples/bad-test-example.test.js`
- Shows all violations
- Running `npm run lint` will flag 6 errors

### Good Example (Correct)
See: `test/unit/_examples/good-test-example.test.js`
- Shows correct usage
- Passes linting with 0 errors

## Integration with CI/CD

Add linting to your CI pipeline:
```yaml
# .github/workflows/ci.yml
- name: Lint tests
  run: npm run lint:test
  
- name: Run tests
  run: npm test
```

## Updating Rules

To add new restrictions, edit `eslint.config.js`:
```javascript
{
  selector: 'CallExpression[callee.name="badFunction"]',
  message: '❌ DO NOT use badFunction. Use goodFunction instead.'
}
```

## Performance

- Linting ~100 test files: **~2-3 seconds**
- Minimal impact on development workflow
- Can run in watch mode: `npx eslint --watch`

## Questions?

See:
- **Test Helpers**: `test/helpers/mvcTestHelpers.js`
- **Testing Guide**: `docs/guides/TESTING_TYPES_GUIDE.md`
- **Copilot Instructions**: `.github/copilot-instructions.md` (Section: Testing Anti-Patterns)
