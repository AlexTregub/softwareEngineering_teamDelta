/**
 * Verbose Logger - Console output control based on verbosity levels
 * 
 * Provides console wrappers that respect the global verbosity setting.
 * Use these instead of direct console.log to create tiered output.
 * 
 * VERBOSITY LEVELS:
 *   0 = SILENT    - No debug messages, only critical errors
 *   1 = QUIET     - Essential messages only (test status, major errors)
 *   2 = NORMAL    - Standard operation messages (default)
 *   3 = VERBOSE   - Detailed system initialization and debug info
 *   4 = DEBUG     - Full debug output including internal state
 * 
 * Usage:
 *   logSilent('Critical error')     - Always shows (level 0+)
 *   logDebug('Internal state: {}')  - Shows on debug only (level 4)
 */

// Get current verbosity level
function getCurrentVerbosity() {
  return (typeof globalThis !== 'undefined' && typeof globalThis.globalDebugVerbosity === 'number') 
    ? globalThis.globalDebugVerbosity 
    : 0; // Default to SILENT
}

// Check if a message should be logged
function shouldLogAtLevel(requiredLevel) {
  return getCurrentVerbosity() >= requiredLevel;
}

// Verbosity-aware logging functions
globalThis.logSilent = function(...args) {
  if (shouldLogAtLevel(0) && console && console.log) {
    console.log(...args);
  }
};

globalThis.logQuiet = function(...args) {
  if (shouldLogAtLevel(1) && console && console.log) {
    console.log(...args);
  }
};

globalThis.logNormal = function(...args) {
  if (shouldLogAtLevel(2) && console && console.log) {
    console.log(...args);
  }
};

globalThis.logVerbose = function(...args) {
  if (shouldLogAtLevel(3) && console && console.log) {
    console.log(...args);
  }
};

globalThis.logDebug = function(...args) {
  if (shouldLogAtLevel(4) && console && console.log) {
    console.log(...args);
  }
};

// Error logging (always shows regardless of verbosity)
globalThis.logError = function(...args) {
  if (console && console.error) {
    console.error(...args);
  }
};

// Warn logging (shows on quiet+)
globalThis.logWarn = function(...args) {
  if (shouldLogAtLevel(1) && console && console.warn) {
    console.warn(...args);
  }
};

// Info logging (shows on normal+)
globalThis.logInfo = function(...args) {
  if (shouldLogAtLevel(2) && console && console.info) {
    console.info(...args);
  }
};

// Utility function to wrap existing console.log calls
globalThis.verboseLog = function(level, ...args) {
  if (shouldLogAtLevel(level) && console && console.log) {
    console.log(...args);
  }
};

// For existing code that wants to check verbosity before logging
globalThis.isVerbose = function(level) {
  return shouldLogAtLevel(level);
};

// Export for module environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    logSilent: globalThis.logSilent,
    logQuiet: globalThis.logQuiet,
    logNormal: globalThis.logNormal,
    logVerbose: globalThis.logVerbose,
    logDebug: globalThis.logDebug,
    logError: globalThis.logError,
    logWarn: globalThis.logWarn,
    logInfo: globalThis.logInfo,
    verboseLog: globalThis.verboseLog,
    isVerbose: globalThis.isVerbose
  };
}

// Initialize verbosity logging system
if (typeof console !== 'undefined') {
  const level = getCurrentVerbosity();
  const levels = ['SILENT', 'QUIET', 'NORMAL', 'VERBOSE', 'DEBUG'];
}