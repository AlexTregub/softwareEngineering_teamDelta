# Debug Test Runner System

## Overview

The global debug test runner system allows you to control when automatic tests run in the browser console. By default, tests are now **disabled** until you explicitly enable them.

## Console Commands

### Basic Controls

```js
enableTests()    // Enable automatic test execution
disableTests()   // Disable automatic test execution  
toggleTests()    // Toggle test execution on/off
```

### Test Execution

```js
runTests()       // Manually run all registered tests
getTestStatus()  // Check current status and available tests
```

### Status Check

```js
getTestStatus()  // Shows:
                 // - Whether tests are enabled/disabled
                 // - Number of registered test suites
                 // - Names of available test suites
```

## Example Usage

### Enable Tests (Auto-run)

```js
enableTests()
// ✅ Debug tests ENABLED - tests will run automatically
// 📊 21 test suites available
// 💾 Preference saved - tests will auto-enable on page reload
```

### Disable Tests (Quiet Mode)

```js
disableTests()
// ❌ Debug tests DISABLED - tests will not run automatically
// 💡 Use runTests() to manually execute tests
// 💾 Preference saved - tests will stay disabled on page reload
```

### Manual Test Execution

```js
runTests()
// 🚀 Running 21 test suites manually...
// ==================================================
// 
// 🧪 Running: Controller Integration Test
// ✅ Controller Integration Test completed
// 
// 🧪 Running: Selection Box Tests  
// ✅ Selection Box Tests completed
// 
// 🧪 Running: VerticalButtonList Tests
// ✅ VerticalButtonList Tests completed
// 
// ... (19 more test suites) ...
// 
// 📊 Test Summary: 21/21 suites completed successfully
```

### Check Status

```js
getTestStatus()
// 🧪 Debug Test Runner Status:
//    Enabled: ❌ NO
//    Registered Tests: 21
//    💾 Saved Preference: ❌ Disabled
//    Available Tests:
//      • Controller Integration Test
//      • Selection Box Tests
//      • UI Selection Box Tests
//      • Selection Box Integration Tests
//      • VerticalButtonList Tests
//      • VerticalButtonList Header Tests
//      • Selection Box Regression Tests
//      • Selection Box Node Tests
//      • Selection Box Comprehensive Tests
//      • EntityInventoryManager Tests
//      • CollisionBox2D Tests
//      • ButtonGroup Persistence Tests
//      • ButtonGroup Layout Tests
//      • ButtonGroup Drag and Drop Tests
//      • ButtonGroup Tests
//      • Button Tests
//      • Button Style Tests
//      • UI Integration Validation Tests
//      • Tracing Tests
//      • TaskManager Tests
//      • Sprite2D Tests
```

## What Tests Are Controlled

The following test suites are now managed by this system:

1. **Controller Integration Test** - Tests ant controller initialization
2. **Selection Box Tests** - Tests selection box functionality  
3. **UI Selection Box Tests** - Tests UI effects layer selection
4. **Selection Box Integration Tests** - Tests integration with real game entities
5. **VerticalButtonList Tests** - Tests vertical button layout functionality
6. **VerticalButtonList Header Tests** - Tests header sizing and positioning
7. **Selection Box Regression Tests** - Tests for regression prevention
8. **Selection Box Node Tests** - Node.js environment compatibility tests
9. **Selection Box Comprehensive Tests** - Comprehensive selection functionality
10. **EntityInventoryManager Tests** - Tests resource management system
11. **CollisionBox2D Tests** - Tests 2D collision detection
12. **ButtonGroup Persistence Tests** - Tests button group state persistence
13. **ButtonGroup Layout Tests** - Tests button positioning and layout
14. **ButtonGroup Drag and Drop Tests** - Tests drag/drop functionality
15. **ButtonGroup Tests** - General button group functionality
16. **Button Tests** - Individual button component tests
17. **Button Style Tests** - Button styling and appearance tests
18. **UI Integration Validation Tests** - Tests UI system integration
19. **Tracing Tests** - Tests debugging and tracing utilities  
20. **TaskManager Tests** - Tests task scheduling and management
21. **Sprite2D Tests** - Tests 2D sprite rendering and manipulation

## Default Behavior

- **Tests start DISABLED** by default (unless you've previously enabled them)
- **Your preference is saved** in localStorage and persists between page reloads
- When disabled, you'll see messages like: "🧪 Tests available but disabled. Use enableTests() to enable or runTests() to run manually."
- Tests only auto-run when `globalDebugTestRunner = true`
- You can always run tests manually with `runTests()` regardless of the enable/disable state

## Persistent Settings

The system automatically saves your test preference using browser localStorage:

- `enableTests()` saves "enabled" - tests will auto-run on future page loads
- `disableTests()` saves "disabled" - tests stay quiet on future page loads  
- Settings persist across browser sessions until manually changed

## Quick Start

1. Open your game in browser
2. Open developer console (F12)
3. Type `enableTests()` to enable auto-running tests
4. Or type `runTests()` to run tests once manually
5. Type `disableTests()` when you want quiet console output

## File Locations

- **Global Test Runner**: `debug/globalTestRunner.js`
- **Bootstrap Integration**: `scripts/bootstrap-globals.js`
- **Modified Test Files**:
  - `test/unit/controllerIntegration.browser.test.js`
  - `test/unit/UISelectionBoxTest.js`
  - `test/unit/selectionBox.integration.test.js`
  - `test/unit/selectionBox.test.js`
