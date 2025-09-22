# Selection Box Testing Documentation

## Overview
This testing suite ensures the selection box functionality remains stable when making changes to the ant selection system.

## Test Files

### 1. **Node.js Compatible Tests** ⭐ *Recommended*
- `test/AntStateMachine.test.js` - Comprehensive state machine testing
- `test/selectionBox.node.test.js` - Selection box logic testing

### 2. **Browser-based Tests** (Legacy)
- `test/selectionBox.test.js` - Mock-based unit tests for browser
- `test/selectionBox.integration.test.js` - Integration tests with real game entities
**Mock-based unit tests** that test selection logic in isolation.

**Tests Include:**
- ✅ Entity mouse collision detection
- ✅ Box selection area calculations  
- ✅ Wrapped entity handling (AntWrapper compatibility)
- ✅ Faction filtering logic
- ✅ Selection boundary edge cases
- ✅ Multi-selection behavior
- ✅ Performance testing with 1000+ entities

### 2. `test/selectionBox.integration.test.js`
**Integration tests** that verify the selection system works with real game entities.

**Tests Include:**
- ✅ Selection box function availability
- ✅ Real ant entity compatibility
- ✅ Mouse collision with actual ant objects
- ✅ Selection state property validation
- ✅ Global variable existence
- ✅ Real-world selection scenarios

## How to Run Tests

### 🚀 **Node.js Testing (Recommended)**

**Install Node.js** (if not already installed) and run:

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:statemachine    # Ant State Machine tests
npm run test:selection      # Selection Box tests

# Individual test files
node test/AntStateMachine.test.js
node test/selectionBox.node.test.js
```

### 🌐 **Browser Testing**

**Enable Dev Console First**
**Press `` ` `` to toggle the dev console on/off**
- When enabled: Green "DEV CONSOLE ON" indicator appears in top-right
- When disabled: Test hotkeys are ignored

### Keyboard Shortcuts (Dev Console Enabled)
| Key | Test Type | Description |
|-----|-----------|-------------|
| **`** | Toggle | Enable/disable dev console |
| **T** | Mock Tests | Run all mock-based unit tests |
| **P** | Performance | Test selection performance with many entities |
| **I** | Integration | Test with real game entities |

### Console Commands
```javascript
// Run all mock tests
runSelectionBoxTests();

// Test performance
testSelectionPerformance();

// Test integration with real ants
testRealSelectionBoxIntegration();
testSelectionScenarios();
```

## Automatic Testing
- ~~Integration tests run automatically 2 seconds after game load~~ **DISABLED**
- Tests only run when dev console is enabled (`` ` `` key)
- Results appear in browser console
- Green ✅ indicates passed tests
- Red ❌ indicates failed tests

## Test Results Interpretation

### All Tests Pass (🎉)
- Selection box is working correctly
- Safe to make changes
- No regressions detected

### Some Tests Fail (⚠️)
- Check console for specific failures
- Fix issues before implementing new features
- Re-run tests after fixes

## Adding New Tests

### Mock Tests (selectionBox.test.js)
```javascript
function testMyNewFeature() {
  console.log("\\n🧪 Testing: My New Feature");
  
  setupBasicTest();
  
  // Your test logic here
  let testPassed = /* your test condition */;
  
  console.log(`\\n📊 My Feature: ${testPassed ? '1/1' : '0/1'} tests passed`);
  return testPassed;
}

// Add to runSelectionBoxTests():
testResults.push(testMyNewFeature());
```

### Integration Tests (selectionBox.integration.test.js)
```javascript
function testMyIntegration() {
  console.log("🔗 Testing My Integration");
  
  // Test with real ants array
  if (typeof ants === 'undefined') {
    return false;
  }
  
  // Your integration test logic
  return true;
}
```

## Common Test Scenarios

### Testing Selection Changes
1. **Enable dev console**: Press **`**
2. Run tests before making changes: **Press T**
3. Make your modifications to selection code
4. Run tests after changes: **Press T + I**
5. Verify all tests still pass
6. **Disable dev console**: Press **`** (optional)

### Testing Performance Impact
1. Run performance baseline: **Press P**  
2. Make your changes
3. Run performance test again: **Press P**
4. Compare timing results

### Testing with Different Ant Types
```javascript
// Test with player ants only
setupBasicTest();

// Test with mixed factions
setupMixedFactionsTest();

// Test with wrapped ants
setupWrappedAntsTest();
```

## Best Practices

### Before Making Changes
- ✅ Run all tests to establish baseline
- ✅ Document expected behavior changes
- ✅ Plan test updates if needed

### While Developing
- ✅ Run tests frequently during development
- ✅ Fix failing tests immediately
- ✅ Add tests for new functionality

### Before Committing
- ✅ All tests must pass
- ✅ Performance should not degrade significantly
- ✅ Add tests for any new features

## Troubleshooting

### Tests Not Running
- Check browser console for errors
- Verify test files are loaded in index.html
- Ensure game has fully initialized

### Integration Tests Failing
- Make sure ants are spawned (run after game loads)
- Check that selection box functions exist
- Verify ant objects have required methods

### Performance Tests Slow
- Check for infinite loops in selection logic
- Verify efficient collision detection
- Consider optimization if > 10ms for 1000 entities

## Example Test Output
```
🚀 Starting Selection Box Test Suite
==================================================

🧪 Testing: Entity Under Mouse Detection
  ✅ Mouse inside ant bounds: PASS
  ✅ Mouse at top-left corner: PASS
  ✅ Mouse at bottom-right corner: PASS
  ✅ Mouse outside ant bounds: PASS
  ✅ Mouse to the right of ant: PASS

📊 Entity Under Mouse: 5/5 tests passed

...

==================================================
📊 FINAL RESULTS: 6/6 test suites passed
🎉 All tests passed! Selection box is working correctly.
```

This testing system will help prevent selection box regressions and make it safe to implement new features!