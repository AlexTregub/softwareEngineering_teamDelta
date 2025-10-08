/**
 * Universal debug activation tool
 *
 * This script provides a small runtime API for creating and toggling named
 * debug loggers as well as a global 'master' switch. It's designed for use
 * with classic `<script>` loading (no imports required) so different parts of
 * the app can opt into debug output by name.
 */

// Ensure the runtime structures exist
globalThis.debugLoggers = globalThis.debugLoggers || Object.create(null);

// Master switch (when true, all loggers are active)
if (typeof globalThis.globalVerboseDebuggingEnabled === 'undefined') {
  globalThis.globalVerboseDebuggingEnabled = false;
}

/**
 * Create or return a named debug logger.
 * The logger is a function that accepts any arguments and forwards them to
 * console.debug when either the global master switch is enabled or the
 * logger's individual enabled flag is true.
 *
 * @param {string} name - Logger name (used as prefix, e.g. 'ants')
 * @param {Object} [opts]
 * @param {boolean} [opts.enabled=false] - initial enabled state for this logger
 * @returns {Function} logger function
 */
globalThis.createDebugLogger = function createDebugLogger(name, opts = {}) {
  if (!name) throw new Error('createDebugLogger requires a name');

  const normalized = String(name);

  if (!globalThis.debugLoggers[normalized]) {
    globalThis.debugLoggers[normalized] = {
      enabled: !!opts.enabled,
      fn: (...args) => {
        if (globalThis.globalVerboseDebuggingEnabled || globalThis.debugLoggers[normalized].enabled) {
          console.debug(`[${normalized}]`, ...args);
        }
      }
    };

    // Backwards-compatible global alias: e.g. globalThis.antsDebug
    try {
      const alias = `${normalized}Debug`;
      if (typeof alias === 'string' && !(alias in globalThis)) {
        Object.defineProperty(globalThis, alias, {
          configurable: true,
          enumerable: false, // non-enumerable to keep globals clean
          get() { return globalThis.debugLoggers[normalized].fn; }
        });
      }
    } catch (e) {
      // ignore if environment prevents defineProperty
    }
  }

  return globalThis.debugLoggers[normalized].fn;
};

/**
 * Get a logger function by name (returns noop if it doesn't exist).
 * @param {string} name
 * @returns {Function}
 */
globalThis.getDebugLogger = function getDebugLogger(name) {
  const n = String(name);
  if (globalThis.debugLoggers[n]) return globalThis.debugLoggers[n].fn;
  // create a disabled logger for convenience
  return globalThis.createDebugLogger(n, { enabled: false });
};

/**
 * Enable or disable a named logger.
 * @param {string} name
 * @param {boolean} enabled
 */
globalThis.setDebugLoggerEnabled = function setDebugLoggerEnabled(name, enabled) {
  const n = String(name);
  if (!globalThis.debugLoggers[n]) globalThis.createDebugLogger(n);
  globalThis.debugLoggers[n].enabled = !!enabled;
};

/**
 * Toggle a named logger and return the new state.
 * @param {string} name
 * @returns {boolean}
 */
globalThis.toggleDebugLogger = function toggleDebugLogger(name) {
  const n = String(name);
  if (!globalThis.debugLoggers[n]) globalThis.createDebugLogger(n);
  globalThis.debugLoggers[n].enabled = !globalThis.debugLoggers[n].enabled;
  return globalThis.debugLoggers[n].enabled;
};

/**
 * Master switch: enable/disable all loggers.
 * @param {boolean} enabled
 */
globalThis.setGlobalDebug = function setGlobalDebug(enabled) {
  globalThis.globalVerboseDebuggingEnabled = !!enabled;
};

/**
 * Toggle the master switch and return new state.
 * @returns {boolean}
 */
globalThis.toggleGlobalDebug = function toggleGlobalDebug() {
  globalThis.globalVerboseDebuggingEnabled = !globalThis.globalVerboseDebuggingEnabled;
  return globalThis.globalVerboseDebuggingEnabled;
};

// Convenience: create a default logger for the draggable panel subsystem and
// expose old helpers for backward compatibility.
globalThis.createDebugLogger('draggablePanel', { enabled: false });

// Backwards-compatible alias (non-enumerable)
Object.defineProperty(globalThis, 'setVerboseDebuggingEnabled', {
  configurable: true,
  enumerable: false,
  writable: true,
  value: globalThis.setDraggablePanelDebug
});
