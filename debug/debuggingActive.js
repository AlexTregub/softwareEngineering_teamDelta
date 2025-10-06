const draggablePanelDebug = globalThis.verboseDebuggingEnabled
  ? (...args) => console.debug('[debuggingActive]', ...args)
  : () => {};

// expose for other non-module scripts
globalThis.draggablePanelDebug = draggablePanelDebug;