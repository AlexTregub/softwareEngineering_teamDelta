# Console Verbosity Control

The game now includes a tiered verbosity system that allows you to control how much console output you see.

## Quick Commands

**Verbosity Levels:**

- `setSilent()` - Level 0: No debug messages, only critical errors (default)
- `setQuiet()` - Level 1: Essential messages only (test status, major errors)  
- `setVerbosity(2)` - Level 2: Standard operation messages
- `setVerbosity(3)` - Level 3: Detailed system initialization and debug info
- `setDebug()` - Level 4: Full debug output including internal state

**Test Control:**

- `enableTests()` - Enable auto-running tests
- `disableTests()` - Disable auto-running tests (default)
- `toggleTests()` - Toggle test execution
- `runTests()` - Manually run all tests
- `getTestStatus()` - Show current settings

## Examples

```javascript
// Make console quiet (only essential messages)
setQuiet()

// Completely silent console
setSilent() 

// See detailed initialization messages
setVerbosity(3)

// Full debug mode
setDebug()

// Check current settings
getTestStatus()
getVerbosity()
```

## What Each Level Shows

**Level 0 (SILENT):** Only critical errors that break functionality
**Level 1 (QUIET):** Test results, major system errors, essential status
**Level 2 (NORMAL):** System ready messages, warnings, normal operations  
**Level 3 (VERBOSE):** Initialization details, configuration loading, component startup
**Level 4 (DEBUG):** Internal state changes, full diagnostic information

## Settings Persistence

Your verbosity and test settings are automatically saved to localStorage and will persist between browser sessions.

## For Developers

When adding new console output to the codebase, use the appropriate logging function:

```javascript
// Always shows (critical only)
logError('Critical failure!') 

// Shows on quiet+ (level 1+)
logQuiet('Test completed successfully')

// Shows on normal+ (level 2+) 
logNormal('System initialized')

// Shows on verbose+ (level 3+)
logVerbose('Loading configuration...')

// Shows on debug only (level 4)
logDebug('Internal state:', stateObject)
```

This allows users to get exactly the level of console detail they want.
