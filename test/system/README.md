# System Tests

This folder contains system-level tests that verify full application behavior and workflows.

## Test Files:
- `scriptLoader.node.test.js` - Tests script loading and naming conventions
- `scriptLoader.loadOrder.simple.test.js` - Tests script dependency loading order
- `selectionBox.regression.test.js` - Regression tests for selection system
- `faction-statemachine.test.js` - Tests faction state management

## Running System Tests:
```bash
npm run test:system
```

System tests verify end-to-end functionality and catch regressions.