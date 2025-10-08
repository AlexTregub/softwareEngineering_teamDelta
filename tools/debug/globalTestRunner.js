/**
 * Global Debug Test Runner & Verbosity Controller
 * 
 * Controls test execution and console verbosity levels.
 * User preferences are persisted in localStorage.
 * 
 * VERBOSITY LEVELS:
 *   0 = SILENT    - No debug messages, only critical errors
 *   1 = QUIET     - Essential messages only (test status, major errors)
 *   2 = NORMAL    - Standard operation messages (default)
 *   3 = VERBOSE   - Detailed system initialization and debug info
 *   4 = DEBUG     - Full debug output including internal state
 * 
 * Usage from console:
 *   enableTests()         - Enable test execution
 *   disableTests()        - Disable test execution  
 *   toggleTests()         - Toggle test execution
 *   runTests()            - Manually run all available tests
 *   getTestStatus()       - Check current test runner status
 *   setVerbosity(level)   - Set console verbosity (0-4)
 *   getVerbosity()        - Get current verbosity level
 *   setQuiet()            - Set to quiet mode (level 1)
 *   setSilent()           - Set to silent mode (level 0)
 *   setDebug()            - Set to full debug mode (level 4)
 */

// Load test runner preference from localStorage (default to false/disabled)
function loadTestPreference() {
  try {
    const saved = localStorage.getItem('debugTestsEnabled');
    return saved === 'true'; // Only true if explicitly saved as 'true'
  } catch (error) {
    // localStorage might not be available (Node.js, etc.)
    return false; // Default to disabled
  }
}

// Save test runner preference to localStorage
function saveTestPreference(enabled) {
  try {
    localStorage.setItem('debugTestsEnabled', enabled.toString());
  } catch (error) {
    // Silently fail if localStorage unavailable
  }
}

// Load verbosity preference from localStorage (default to 0/SILENT)
function loadVerbosityPreference() {
  try {
    const saved = localStorage.getItem('debugVerbosity');
    const level = parseInt(saved);
    return (level >= 0 && level <= 4) ? level : 0; // Default to SILENT (0)
  } catch (error) {
    console.error('❌ Failed to load verbosity preference:', error);
    return 0; // Default to SILENT (0)
  }
}

// Save verbosity preference to localStorage
function saveVerbosityPreference(level) {
  try {
    localStorage.setItem('debugVerbosity', level.toString());
  } catch (error) {
    console.error('❌ Failed to save verbosity preference:', error);
  }
}

// Verbosity levels
const VERBOSITY_LEVELS = {
  SILENT: 0,   // No debug messages, only critical errors
  QUIET: 1,    // Essential messages only (test status, major errors)
  NORMAL: 2,   // Standard operation messages (default)
  VERBOSE: 3,  // Detailed system initialization and debug info
  DEBUG: 4     // Full debug output including internal state
};

// Global test runner state - load from localStorage, default disabled
globalThis.globalDebugTestRunner = globalThis.globalDebugTestRunner ?? loadTestPreference();

// Global verbosity state - load from localStorage, default to NORMAL
globalThis.globalDebugVerbosity = globalThis.globalDebugVerbosity ?? loadVerbosityPreference();

// Store test functions for manual execution
globalThis.registeredTests = globalThis.registeredTests || [];

// ===== VERBOSITY CONTROL FUNCTIONS =====

/**
 * Set console verbosity level
 * @param {number} level - Verbosity level (0-4)
 */
globalThis.setVerbosity = function(level) {
  if (level < 0 || level > 4) {
    console.error('❌ Invalid verbosity level. Use 0-4 (0=Silent, 1=Quiet, 2=Normal, 3=Verbose, 4=Debug)');
    return false;
  }
  
  globalThis.globalDebugVerbosity = level;
  saveVerbosityPreference(level);
  
  const levels = ['SILENT', 'QUIET', 'NORMAL', 'VERBOSE', 'DEBUG'];
  console.log(`🔊 Verbosity set to ${level} (${levels[level]})`);
  console.log('💾 Preference saved - verbosity will persist on page reload');
  return true;
};

/**
 * Get current verbosity level
 */
globalThis.getVerbosity = function() {
  const levels = ['SILENT', 'QUIET', 'NORMAL', 'VERBOSE', 'DEBUG'];
  const level = globalThis.globalDebugVerbosity;
  console.log(`🔊 Current verbosity: ${level} (${levels[level]})`);
  return level;
};

/**
 * Set to quiet mode (level 1) - essential messages only
 */
globalThis.setQuiet = function() {
  return globalThis.setVerbosity(1);
};

/**
 * Set to silent mode (level 0) - no debug messages
 */
globalThis.setSilent = function() {
  return globalThis.setVerbosity(0);
};

/**
 * Set to debug mode (level 4) - full debug output
 */
globalThis.setDebug = function() {
  return globalThis.setVerbosity(4);
};

/**
 * Check if a message should be logged based on current verbosity
 * @param {number} messageLevel - Required verbosity level for this message
 * @returns {boolean} - Whether to log the message
 */
globalThis.shouldLog = function(messageLevel) {
  return globalThis.globalDebugVerbosity >= messageLevel;
};

// ===== TEST RUNNER FUNCTIONS =====

/**
 * Register a test function to be available for manual execution
 * @param {string} name - Test suite name
 * @param {Function} testFn - Test function to register
 */
globalThis.registerTest = function(name, testFn) {
  if (typeof testFn === 'function') {
    globalThis.registeredTests.push({ name, fn: testFn });
    if (globalThis.globalDebugTestRunner) {
      if (globalThis.shouldLog(1)) {
        console.log(`🧪 Auto-running test: ${name}`);
      }
      testFn();
    }
  }
};

/**
 * Enable automatic test execution
 */
globalThis.enableTests = function() {
  globalThis.globalDebugTestRunner = true;
  saveTestPreference(true);
  console.log('✅ Debug tests ENABLED - tests will run automatically');
  console.log(`📊 ${globalThis.registeredTests.length} test suites available`);
  console.log('💾 Preference saved - tests will auto-enable on page reload');
  return true;
};

/**
 * Disable automatic test execution
 */
globalThis.disableTests = function() {
  globalThis.globalDebugTestRunner = false;
  saveTestPreference(false);
  console.log('❌ Debug tests DISABLED - tests will not run automatically');
  console.log('💡 Use runTests() to manually execute tests');
  console.log('💾 Preference saved - tests will stay disabled on page reload');
  return false;
};

/**
 * Toggle automatic test execution
 */
globalThis.toggleTests = function() {
  const newState = !globalThis.globalDebugTestRunner;
  globalThis.globalDebugTestRunner = newState;
  saveTestPreference(newState);
  console.log(`🔄 Debug tests ${newState ? 'ENABLED' : 'DISABLED'}`);
  if (newState) {
    console.log(`📊 ${globalThis.registeredTests.length} test suites available for auto-run`);
  }
  console.log('💾 Preference saved');
  return newState;
};

/**
 * Manually run all registered tests
 */
globalThis.runTests = function() {
  console.log(`🚀 Running ${globalThis.registeredTests.length} test suites manually...`);
  console.log('='.repeat(50));
  
  let totalSuites = 0;
  let suitesWithErrors = 0;
  
  for (const test of globalThis.registeredTests) {
    totalSuites++;
    console.log(`\n🧪 Running: ${test.name}`);
    try {
      test.fn();
      console.log(`✅ ${test.name} completed`);
    } catch (error) {
      suitesWithErrors++;
      console.error(`❌ ${test.name} failed:`, error);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Summary: ${totalSuites - suitesWithErrors}/${totalSuites} suites completed successfully`);
  
  if (suitesWithErrors > 0) {
    console.log(`⚠️  ${suitesWithErrors} test suites had errors`);
  }
  
  return { totalSuites, suitesWithErrors };
};

/**
 * Get current test runner status
 */
globalThis.getTestStatus = function() {
  const levels = ['SILENT', 'QUIET', 'NORMAL', 'VERBOSE', 'DEBUG'];
  const status = {
    enabled: globalThis.globalDebugTestRunner,
    verbosity: globalThis.globalDebugVerbosity,
    registeredTests: globalThis.registeredTests.length,
    testNames: globalThis.registeredTests.map(t => t.name),
    persistentSetting: loadTestPreference(),
    persistentVerbosity: loadVerbosityPreference()
  };
  
  console.log('🧪 Debug Test Runner Status:');
  console.log(`   Tests: ${status.enabled ? '✅ ENABLED' : '❌ DISABLED'}`);
  console.log(`   Verbosity: ${status.verbosity} (${levels[status.verbosity]})`);
  console.log(`   Registered Tests: ${status.registeredTests}`);
  console.log(`   💾 Saved Preferences:`);
  console.log(`      Tests: ${status.persistentSetting ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`      Verbosity: ${status.persistentVerbosity} (${levels[status.persistentVerbosity]})`);
  if (status.testNames.length > 0) {
    console.log('   Available Tests:');
    status.testNames.forEach(name => console.log(`     • ${name}`));
  }
  
  return status;
};

/**
 * Clear all registered tests (useful for development)
 */
globalThis.clearTests = function() {
  const count = globalThis.registeredTests.length;
  globalThis.registeredTests = [];
  console.log(`🗑️  Cleared ${count} registered tests`);
  return count;
};

// Helper function to conditionally run tests
globalThis.shouldRunTests = function() {
  return globalThis.globalDebugTestRunner === true;
};

// Show initial status
if (typeof console !== 'undefined' && globalThis.globalDebugVerbosity >= 1) {
  const levels = ['SILENT', 'QUIET', 'NORMAL', 'VERBOSE', 'DEBUG'];
  const initialStatus = globalThis.globalDebugTestRunner ? '✅ ENABLED' : '❌ DISABLED';
  const savedPref = loadTestPreference() ? '✅ Enabled' : '❌ Disabled';
  const verbosity = globalThis.globalDebugVerbosity;
  
  console.log(`🧪 Debug Test Runner initialized: ${initialStatus}`);
  console.log(`🔊 Verbosity Level: ${verbosity} (${levels[verbosity]})`);
  console.log(`💾 Saved preferences: Tests ${savedPref}, Verbosity ${verbosity}`);
  console.log('💡 Console commands:');
  console.log('    Tests: enableTests(), disableTests(), toggleTests(), runTests(), getTestStatus()');
  console.log('    Verbosity: setVerbosity(0-4), setQuiet(), setSilent(), setDebug(), getVerbosity()');
}

// Export for module environments (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    enableTests: globalThis.enableTests,
    disableTests: globalThis.disableTests,
    toggleTests: globalThis.toggleTests,
    runTests: globalThis.runTests,
    getTestStatus: globalThis.getTestStatus,
    registerTest: globalThis.registerTest,
    shouldRunTests: globalThis.shouldRunTests,
    setVerbosity: globalThis.setVerbosity,
    getVerbosity: globalThis.getVerbosity,
    setQuiet: globalThis.setQuiet,
    setSilent: globalThis.setSilent,
    setDebug: globalThis.setDebug,
    shouldLog: globalThis.shouldLog
  };
}