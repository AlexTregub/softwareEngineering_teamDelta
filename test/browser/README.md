# Browser Tests

This directory contains HTML-based integration tests for the ant game project.

## Test Files

### `integration-status.html`
**Purpose**: Comprehensive integration test runner for controller system
**Usage**: 
1. Start server: `python -m http.server 8000` 
2. Open: `http://localhost:8000/test/browser/integration-status.html`
3. Click "Run Integration Test" to verify all controllers work correctly

**Expected Result**: Should show "10 passed, 0 failed" when all controllers are properly integrated

### `error-test.html`
**Purpose**: Error detection and class availability verification
**Usage**: Open in browser to check if all required classes load without errors
**Features**:
- Detects JavaScript loading errors
- Verifies class availability (ant, MovementController, TaskManager, etc.)
- Tests basic ant creation and controller initialization

### `speed-test.html`
**Purpose**: Validates MovementController speed getter/setter functionality
**Usage**: Tests the movement speed configuration that was fixed in the final integration
**Validates**: 
- Speed property getter returns correct value
- Speed property setter updates correctly
- Public API access to private _movementSpeed property

### `validation-test.html`
**Purpose**: Comprehensive property and controller validation
**Usage**: Validates controller integration and property access patterns
**Features**:
- Tests all controller creation
- Validates property delegation
- Checks state machine integration

## Running Browser Tests

1. **Start Development Server**:
   ```bash
   cd path/to/project
   python -m http.server 8000
   ```

2. **Access Tests**:
   - Main integration: `http://localhost:8000/test/browser/integration-status.html`
   - Error detection: `http://localhost:8000/test/browser/error-test.html`
   - Speed validation: `http://localhost:8000/test/browser/speed-test.html`
   - Property validation: `http://localhost:8000/test/browser/validation-test.html`

3. **Browser Console**: Use browser developer tools to see detailed test output

## Notes

These browser tests complement the Node.js tests in the parent `test/` directory and provide real-environment validation of the controller integration system.