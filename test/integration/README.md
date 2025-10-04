# Integration Tests

This folder contains integration tests and diagnostic tools for cross-system validation and debugging.

## Structure

```
integration/
├── button_structure_debug.py     # Button system diagnostic tool
├── run_integration_tests.py      # Main integration test runner
├── debugPickup.js                # Legacy debug utilities
├── manual-highlight-debug.js     # Manual highlighting tests
├── run-highlighting-debug.js     # Highlighting system tests
├── run_unit_tests.js            # JavaScript unit test runner
├── testHelpers.js               # Test utility functions
├── integration_quick_check.html # Quick browser validation
└── ui_debug_demo.html           # UI debugging demo page
```

## Usage

### Run All Integration Tests
```bash
cd test/integration
python run_integration_tests.py
```

### Run Specific Diagnostic Tools
```bash
# Button structure analysis
python run_integration_tests.py --tool button-debug

# Direct button debug (standalone)
python button_structure_debug.py
```

### Browser-Based Tests
```bash
# Open in browser for manual testing
open integration_quick_check.html
open ui_debug_demo.html
```

## Integration vs BDD Tests

| Test Type | Purpose | Location |
|-----------|---------|----------|
| **BDD Tests** | Behavioral validation, user scenarios | `test/bdd_new/` |
| **Integration Tests** | Cross-system validation, diagnostics | `test/integration/` |
| **Unit Tests** | Individual component testing | `test/unit/` |

## Diagnostic Tools

### Button Structure Debug
- **File**: `button_structure_debug.py`
- **Purpose**: Deep analysis of button system internal structure
- **Output**: JSON report with group details, dependencies, console logs
- **Use Case**: Debugging button creation issues, structure validation

### Features Covered
- ✅ Button group structure analysis
- ✅ Individual button property inspection  
- ✅ Dependency validation (Button, ButtonStyles classes)
- ✅ Console log analysis for errors
- ✅ Cross-system integration validation

## Adding New Integration Tests

1. Create your test function in appropriate file
2. Add to `run_integration_tests.py` in the `tests` list
3. Follow the pattern: return `True` for success, `False` for failure
4. Include descriptive output and error handling

Example:
```python
def run_my_integration_test():
    """Description of what this test validates"""
    try:
        # Your test logic here
        result = some_system_validation()
        return result.success
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False
```