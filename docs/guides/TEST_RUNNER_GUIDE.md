# Test Runner Guide

This guide explains how to run the Gherkin/Cucumber tests for the Universal Button Group System.

## Prerequisites

Make sure you have Node.js installed and have run `npm install` in the project directory to install dependencies including Cucumber.js.

## Test Structure

The project uses Behavior-Driven Development (BDD) with Gherkin syntax:

tests/e2e/
├── features/           # Gherkin feature files (.feature)
│   ├── button_group_management.feature
│   ├── button_group_manager.feature
│   ├── entity_lifecycle.feature
│   └── game_state_rendering.feature
├── steps/              # Step definition files (JavaScript/Python)
│   ├── button_group_given_steps.js
│   ├── button_group_when_steps.js
│   ├── button_group_then_steps.js
│   └── button_group_manager_*.js
└── support/           # Test configuration
    └── world.js       # Shared test context

## Basic Commands

### Navigate to Project Directory

```powershell
cd "c:\Users\willm\OneDrive\Desktop\Classes\Class Repo\softwareEngineering_teamDelta"
```

### Run All ButtonGroup Tests

```powershell
npx cucumber-js test/behavioral/features/button_group_management.feature --require test/behavioral/steps/button_group_*.js --require test/behavioral/support/world.js --format progress
```

### Run All ButtonGroupManager Tests

```powershell
npx cucumber-js test/behavioral/features/button_group_manager.feature --require test/behavioral/steps/button_group_manager_*.js --require test/behavioral/support/world.js --format progress
```

### Run All Entity Lifecycle Tests

```powershell
npx cucumber-js test/behavioral/features/entity_lifecycle.feature --require test/behavioral/steps/*.js --require test/behavioral/support/world.js --format progress
```

### Run All Game State Rendering Tests

```powershell
npx cucumber-js test/behavioral/features/game_state_rendering.feature --require test/behavioral/steps/*.js --require test/behavioral/support/world.js --format progress
```

### Run All Tests

```powershell
npx cucumber-js test/behavioral/features/*.feature --require test/behavioral/steps/*.js --require test/behavioral/support/world.js --format progress
```

## Advanced Commands

### Run a Specific Scenario (by line number)

```powershell
# Example: Run the scenario starting at line 73 in button_group_management.feature
npx cucumber-js test/behavioral/features/button_group_management.feature:73 --require test/behavioral/steps/button_group_*.js --require test/behavioral/support/world.js --format progress
```

### Run Multiple Specific Scenarios

```powershell
# Run scenarios at lines 19 and 27
npx cucumber-js test/behavioral/features/button_group_management.feature:19:27 --require test/behavioral/steps/button_group_*.js --require test/behavioral/support/world.js --format progress
```

### Different Output Formats

#### Progress Format (default, shows dots and symbols)

```powershell
npx cucumber-js test/behavioral/features/button_group_management.feature --require test/behavioral/steps/button_group_*.js --require test/behavioral/support/world.js --format progress
```

#### Pretty Format (shows readable test names and steps)

```powershell
npx cucumber-js test/behavioral/features/button_group_management.feature --require test/behavioral/steps/button_group_*.js --require test/behavioral/support/world.js --format pretty
```

#### JSON Format (for programmatic parsing)

```powershell
npx cucumber-js test/behavioral/features/button_group_management.feature --require test/behavioral/steps/button_group_*.js --require test/behavioral/support/world.js --format json
```

#### Summary Format (shows only final results)

```powershell
npx cucumber-js test/behavioral/features/button_group_management.feature --require test/behavioral/steps/button_group_*.js --require test/behavioral/support/world.js --format summary
```

## Understanding Test Output

### Status Symbols (Progress Format)

- `.` = Passed step
- `F` = Failed step  
- `U` = Undefined step (missing implementation)
- `-` = Skipped step
- `P` = Pending step

### Test Results Summary

At the end of each test run, you'll see:

X scenarios (Y failed, Z undefined, W passed)
X steps (Y failed, Z undefined, W skipped, V passed)

## Common Issues

### Node.js Version Warning

You may see: "This Node.js version (v24.8.0) has not been tested with this version of Cucumber"

- This is just a warning and tests should still work normally

### Missing Step Definitions

If you see "Undefined" steps, it means:

- The step definition is not implemented yet
- Cucumber will show you the code snippet to add

### ButtonGroup Configuration Errors

You may see warnings like "ButtonGroup invalid-group has no buttons configuration"

- These are expected validation messages from the tests

## Debugging Failed Tests

### View Detailed Error Information

Use the `pretty` format to see exactly which assertions are failing:

```powershell
npx cucumber-js test/behavioral/features/button_group_management.feature --require test/behavioral/steps/button_group_*.js --require test/behavioral/support/world.js --format pretty
```

### Focus on Specific Failing Scenario

If scenario at line 73 is failing:

```powershell
npx cucumber-js test/behavioral/features/button_group_management.feature:73 --require test/behavioral/steps/button_group_*.js --require test/behavioral/support/world.js --format pretty
```

## Current Test Status

As of the latest run, there are several test categories:

### ✅ Working Tests

- Basic button group creation
- Configuration parsing
- Button arrangement (horizontal, vertical, grid)
- Some persistence tests

### ❌ Known Issues

- Drag operation positioning conflicts
- ButtonGroupManager group retrieval returning null
- Some render integration tests
- Configuration validation edge cases

### ⚠️ Undefined Tests

- Entity lifecycle management
- Game state rendering
- Advanced UI interactions

## Quick Reference Commands

```powershell
# Quick test commands (run from project root)

# Test everything
npm test

# ButtonGroup only
npx cucumber-js test/behavioral/features/button_group_management.feature --require test/behavioral/steps/button_group_*.js --require test/behavioral/support/world.js

# ButtonGroupManager only  
npx cucumber-js test/behavioral/features/button_group_manager.feature --require test/behavioral/steps/button_group_manager_*.js --require test/behavioral/support/world.js

# Pretty output for debugging
npx cucumber-js test/behavioral/features/*.feature --require test/behavioral/steps/*.js --require test/behavioral/support/world.js --format pretty
```

## Notes

- Tests are written following the established testing methodology standards
- Each test uses real system integration rather than heavy mocking
- Tests validate authentic behavior and state management
- The test suite covers the complete Universal Button Group System functionality
