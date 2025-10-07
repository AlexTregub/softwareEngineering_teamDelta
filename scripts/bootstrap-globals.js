// scripts/bootstrap-globals.js
// Central bootstrap for small runtime globals and defensive shims.
// Loaded very early in index.html to make APIs available to inline scripts
// and other `<script>` files that expect certain globals to exist.

(function () {
  if (typeof window === 'undefined' && typeof globalThis === 'undefined') return;
  const G = globalThis;

  // Avoid re-running the bootstrap if it was already loaded
  if (G.__ANT_GAME_BOOTSTRAP_LOADED__) return;
  Object.defineProperty(G, '__ANT_GAME_BOOTSTRAP_LOADED__', {
    configurable: false,
    enumerable: false,
    writable: false,
    value: true
  });

  // Lightweight safe logger used during bootstrap
  function safeLog() {
    if (typeof console !== 'undefined' && typeof console.log === 'function') {
      console.log.apply(console, arguments);
    }
  }

  // Initialize basic test runner and verbosity state if not present
  G.globalDebugTestRunner = G.globalDebugTestRunner ?? false;
  G.globalDebugVerbosity = G.globalDebugVerbosity ?? 0; // Default to SILENT
  G.registeredTests = G.registeredTests || [];

  // Provide basic test runner and verbosity functions if not already loaded
  if (typeof G.enableTests !== 'function') {
    G.enableTests = function() {
      G.globalDebugTestRunner = true;
      safeLog('✅ Debug tests ENABLED - tests will run automatically');
      return true;
    };

    G.disableTests = function() {
      G.globalDebugTestRunner = false;
      safeLog('❌ Debug tests DISABLED - tests will not run automatically');
      return false;
    };

    G.toggleTests = function() {
      G.globalDebugTestRunner = !G.globalDebugTestRunner;
      safeLog(`🔄 Debug tests ${G.globalDebugTestRunner ? 'ENABLED' : 'DISABLED'}`);
      return G.globalDebugTestRunner;
    };

    G.shouldRunTests = function() {
      return G.globalDebugTestRunner === true;
    };

    // Basic verbosity functions
    G.setVerbosity = function(level) {
      if (level >= 0 && level <= 4) {
        G.globalDebugVerbosity = level;
        const levels = ['SILENT', 'QUIET', 'NORMAL', 'VERBOSE', 'DEBUG'];
        safeLog(`🔊 Verbosity set to ${level} (${levels[level]})`);
        return true;
      }
      return false;
    };

    G.getVerbosity = function() {
      return G.globalDebugVerbosity;
    };

    G.setQuiet = function() { return G.setVerbosity(1); };
    G.setSilent = function() { return G.setVerbosity(0); };
    G.setDebug = function() { return G.setVerbosity(4); };

    G.shouldLog = function(messageLevel) {
      return G.globalDebugVerbosity >= messageLevel;
    };
  }

  // Provide a small, defensive createDebugLogger API if not present.
  // This mirrors the full `debug/globalDebugging.js` API but doesn't overwrite it.
  if (typeof G.createDebugLogger !== 'function') {
    G.debugLoggers = G.debugLoggers || Object.create(null);
    G.globalVerboseDebuggingEnabled = !!G.globalVerboseDebuggingEnabled;

    G.createDebugLogger = function (name, opts = {}) {
      if (!name) throw new Error('createDebugLogger requires a name');
      const n = String(name);
      if (!G.debugLoggers[n]) {
        G.debugLoggers[n] = {
          enabled: !!opts.enabled,
          fn: (...args) => {
            if (G.globalVerboseDebuggingEnabled || G.debugLoggers[n].enabled) {
              if (console && console.debug) console.debug.apply(console, [`[${n}]`, ...args]);
            }
          }
        };
        try {
          const alias = `${n}Debug`;
          if (typeof alias === 'string' && !(alias in G)) {
            Object.defineProperty(G, alias, {
              configurable: true,
              enumerable: false,
              get() { return G.debugLoggers[n].fn; }
            });
          }
        } catch (e) {
          // ignore
        }
      }
      return G.debugLoggers[n].fn;
    };

    G.getDebugLogger = function (name) {
      const n = String(name);
      if (G.debugLoggers[n]) return G.debugLoggers[n].fn;
      return G.createDebugLogger(n, { enabled: false });
    };

    G.setDebugLoggerEnabled = function (name, enabled) {
      const n = String(name);
      if (!G.debugLoggers[n]) G.createDebugLogger(n);
      G.debugLoggers[n].enabled = !!enabled;
    };

    G.toggleDebugLogger = function (name) {
      const n = String(name);
      if (!G.debugLoggers[n]) G.createDebugLogger(n);
      G.debugLoggers[n].enabled = !G.debugLoggers[n].enabled;
      return G.debugLoggers[n].enabled;
    };

    G.setGlobalDebug = function (enabled) {
      G.globalVerboseDebuggingEnabled = !!enabled;
    };

    G.toggleGlobalDebug = function () {
      G.globalVerboseDebuggingEnabled = !G.globalVerboseDebuggingEnabled;
      return G.globalVerboseDebuggingEnabled;
    };

    // Create the default logger for draggable panels without overwriting later full impl
    try { G.createDebugLogger('draggablePanel', { enabled: false }); } catch (e) { }
  }

  // Provide a common event name for the draggable panel system readiness.
  // If upstream code sets its own constant, don't overwrite it.
  if (!G.DRAGGABLE_PANEL_SYSTEM_READY_EVENT) {
    Object.defineProperty(G, 'DRAGGABLE_PANEL_SYSTEM_READY_EVENT', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: 'draggablePanelSystemReady'
    });
  }

  // Provide a helper to safely dispatch the readiness event.
  G.dispatchDraggablePanelSystemReady = function (detail) {
    try {
      const evName = G.DRAGGABLE_PANEL_SYSTEM_READY_EVENT || 'draggablePanelSystemReady';
      if (typeof document !== 'undefined' && typeof CustomEvent === 'function') {
        const ev = new CustomEvent(evName, { detail });
        document.dispatchEvent(ev);
      }
    } catch (e) {
      safeLog('dispatchDraggablePanelSystemReady failed', e);
    }
  };

  // Small compatibility shim: ensure window.initializeDraggablePanelSystem exists
  if (typeof G.initializeDraggablePanelSystem !== 'function') {
    G.initializeDraggablePanelSystem = G.initializeDraggablePanelSystem || function () {
      // If the real implementation loads later, it will overwrite this.
      safeLog('initializeDraggablePanelSystem: fallback called (real impl may load later)');
      return Promise.resolve(false);
    };
  }

  // Expose a small 'bootstrap' namespace for future helpers
  G.__antBootstrap = G.__antBootstrap || {
    dispatchDraggablePanelSystemReady: G.dispatchDraggablePanelSystemReady
  };

  // Log early so we can see that bootstrap ran
  safeLog('Bootstrap loaded: globals initialized, test runner controls available');
})();