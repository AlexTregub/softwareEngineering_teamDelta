# Ant Game Testing Documentation

## Overview
This comprehensive testing suite ensures all game systems remain stable when making changes to the ant game codebase.

## Test Files

### 1. **Node.js Compatible Tests** ⭐ *Recommended*
- `test/AntStateMachine.test.js` - Comprehensive state machine testing (17 tests)
- `test/selectionBox.node.test.js` - Selection box logic testing (10 tests)
- `test/ant.test.js` - Comprehensive ant class testing (36 tests)
- `test/sprite2d.test.js` - Sprite2D rendering class testing (17 tests)

### 2. **Browser-based Tests** (Legacy)
- `test/selectionBox.test.js` - Mock-based unit tests for browser
- `test/selectionBox.integration.test.js` - Integration tests with real game entities

## Test Coverage

### 🐜 `test/ant.test.js` - **NEW Comprehensive Ant Class Tests**
**Complete testing of the ant class functionality**

**Tests Include:**
- ✅ Constructor and initialization (3 tests)
- ✅ Property getters and setters (5 tests)
- ✅ State machine integration (2 tests)
- ✅ Movement system (3 tests)
- ✅ Mouse interaction (2 tests)
- ✅ Command system (6 tests)
- ✅ Faction and combat system (4 tests)
- ✅ Skitter behavior (2 tests)
- ✅ Helper methods (1 test)
- ✅ Debug functionality (2 tests)
- ✅ Static methods (2 tests)
- ✅ Pathfinding integration (1 test)
- ✅ Terrain detection (2 tests)
- ✅ Integration tests (1 test)

**Key Features Tested:**
- Constructor with default and custom parameters
- Position and size management with sprite synchronization
- Movement speed calculation with terrain modifiers
- State machine integration and state change callbacks
- Command queue processing and execution
- Enemy detection and combat state transitions
- Mouse collision detection and selection
- Debug state reporting and force idle functionality
- Static utility methods for group operations

### 🖼️ `test/sprite2d.test.js` - **NEW Sprite2D Rendering Tests**
**Complete testing of the Sprite2D rendering class**

**Tests Include:**
- ✅ Constructor and initialization (4 tests)
- ✅ Setter methods for all properties (6 tests)
- ✅ Render method execution and parameter validation (2 tests)
- ✅ Vector copying and memory management (2 tests)
- ✅ Edge cases and error handling (1 test)
- ✅ Integration and lifecycle testing (2 tests)

**Key Features Tested:**
- Constructor with default and custom parameters
- Vector copying vs referencing for position and size
- Image, position, size, and rotation setters
- Render method with proper p5.js function calls
- Coordinate transformation and rotation handling
- Memory efficiency and object independence
- Compatibility with both p5.Vector and plain objects

### 🧠 `test/AntStateMachine.test.js`
**Comprehensive state machine testing**

**Tests Include:**
- ✅ State initialization and validation
- ✅ Primary state transitions (IDLE, MOVING, GATHERING, etc.)
- ✅ Combat modifier handling (IN_COMBAT, OUT_OF_COMBAT)
- ✅ Terrain modifier effects (IN_WATER, IN_MUD, ON_SLIPPERY, etc.)
- ✅ Action permission system
- ✅ State query methods
- ✅ State change callbacks
- ✅ Edge cases and error handling
- ✅ All valid state combinations (60 combinations tested)

### 📦 `test/selectionBox.node.test.js`
**Tests Include:**
- ✅ Entity mouse collision detection
- ✅ Box selection area calculations  
- ✅ Wrapped entity handling (AntWrapper compatibility)
- ✅ Faction filtering logic
- ✅ Selection boundary edge cases
- ✅ Multi-selection behavior
- ✅ Performance testing with 1000+ entities

### 3. **Browser-based Tests** (Legacy)
- `test/selectionBox.test.js` - Mock-based unit tests for browser
- `test/selectionBox.integration.test.js` - Integration tests with real game entities

## How to Run Tests

### 🚀 **Node.js Testing (Recommended)**

**Install Node.js** (if not already installed) and run:

```bash
# Run all tests (80 total tests)
npm test

# Run specific test suites
npm run test:statemachine    # Ant State Machine tests (17 tests)
npm run test:selection      # Selection Box tests (10 tests)
npm run test:ant            # Ant Class tests (36 tests)
npm run test:sprite2d       # Sprite2D tests (17 tests)

# Run individual test files
node test/AntStateMachine.test.js
node test/selectionBox.node.test.js
node test/ant.test.js
node test/sprite2d.test.js
```

## Test Statistics

- **Total Tests**: 80 tests across 4 test suites
- **AntStateMachine**: 17 tests (100% pass rate)
- **SelectionBox**: 10 tests (100% pass rate)
- **Ant Class**: 36 tests (100% pass rate)
- **Sprite2D**: 17 tests (100% pass rate)
- **Code Coverage**: Comprehensive coverage of core game systems

## What's Tested

### 🎯 **Core Game Systems**
- **Ant Behavior**: Complete ant lifecycle, movement, states
- **State Management**: Complex state machine with combat/terrain modifiers
- **Selection System**: Mouse interaction and multi-selection
- **Command System**: Queued commands and execution
- **Combat System**: Enemy detection and faction management
- **Terrain System**: Movement speed modifiers and terrain detection
- **Rendering System**: Sprite positioning, rotation, and image management

### 🔧 **Integration Points**
- State machine callbacks and transitions
- Sprite synchronization with game logic
- Command queue processing
- Enemy detection algorithms
- Abstract highlighting system compatibility

### 🚨 **Edge Cases**
- Invalid state transitions
- Boundary collision detection
- Performance with large entity counts
- Error handling and recovery
- Mock vs real entity compatibility

## Adding New Tests

To add tests for new features:

1. **For ant-related functionality**: Add to `test/ant.test.js`
2. **For state machine changes**: Add to `test/AntStateMachine.test.js`
3. **For selection/UI features**: Add to `test/selectionBox.node.test.js`
4. **For new game systems**: Create a new test file and update `package.json`

Example test pattern:
```javascript
suite.test('Feature description', () => {
  const testAnt = new ant();
  // Setup test conditions
  // Perform action
  // Assert expected results
  suite.assertEqual(actual, expected, 'Description of what should happen');
});
```

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