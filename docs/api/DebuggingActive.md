# Debugging Active — `debuggingActive.js`

## Purpose

Provides a small, low-overhead debug logging helper that other non-module scripts can call without importing. The helper respects a global verbosity flag (`globalThis.verboseDebuggingEnabled`) so debug messages can be enabled or disabled at runtime without changing callers.

## Behavior / API

This script now implements a universal, named debug logger system (backwards compatible).

Exposed globals (API):

- `globalThis.createDebugLogger(name: string, opts?: { enabled?: boolean }) => Function`
  - Create and return a named logger. The returned function accepts any arguments and will
    forward them to `console.debug` when either the global master switch is on or the individual
    logger is enabled.

- `globalThis.getDebugLogger(name: string) => Function`
  - Return the named logger (creates a disabled logger if it didn't exist).

- `globalThis.setDebugLoggerEnabled(name: string, enabled: boolean) => void`
  - Enable or disable a named logger at runtime.

- `globalThis.toggleDebugLogger(name: string) => boolean`
  - Toggle a named logger and return its new state.

- `globalThis.setGlobalDebug(enabled: boolean) => void`
  - Master switch: when true all loggers will output regardless of their individual state.

- `globalThis.toggleGlobalDebug() => boolean`
  - Toggle the master switch and return the new state.

- Backwards compatibility:
  - A default logger named `draggablePanel` is created automatically; you can use `globalThis.draggablePanelDebug` (getter alias) to access it.
  - Helper aliases are provided: `globalThis.setDraggablePanelDebug(enabled)` and `globalThis.toggleDraggablePanelDebug()`.

> Note: This file is designed to be included via classic `<script>` tags in `index.html`. The global approach requires no `import`/`export` changes to the rest of the codebase.

## How it works (implementation summary)

- At load time the script checks `globalThis.verboseDebuggingEnabled`.
- If true, it creates a forwarding function that prefixes messages and calls `console.debug`.
- Otherwise it creates a function that performs no work. The chosen pattern avoids branching in callers and keeps runtime overhead minimal when debugging is disabled.

## Usage examples

### 1) Global (recommended for the current codebase — non-module scripts)

Include the helper and create or use named loggers:

```html
<script src="debug/debuggingActive.js"></script>
<script>
  // create/use the draggablePanel logger
  const dpDebug = globalThis.getDebugLogger('draggablePanel');
  dpDebug('Panel factory ready');

  // enable only the draggablePanel logger
  globalThis.setDebugLoggerEnabled('draggablePanel', true);

  // or enable everything
  globalThis.setGlobalDebug(true);
  dpDebug('Now global debug is on');
</script>
```

Create a new named logger for the ants subsystem and toggle it:

```javascript
globalThis.createDebugLogger('ants');
globalThis.toggleDebugLogger('ants'); // returns new boolean state
globalThis.getDebugLogger('ants')('spawned', antId);
```

### 2) Importing as an ES module (only if you refactor to modules)

- If you load `debuggingActive.js` using `<script type="module">` and keep the `export default` in the file you can import it from another module (note: this repo uses classic scripts by default):

```html
<script type="module">
  import draggablePanelDebug from './debug/debuggingActive.js';

  // ensure verbose is enabled at some point before logging
  globalThis.verboseDebuggingEnabled = true;

  draggablePanelDebug('panel created (module import)');
</script>
```

## Notes & recommendations

- Use the global approach (no import) for minimal friction with the codebase's existing non-module structure. The project currently uses many plain `<script>` tags so the named loggers and helper APIs are the easiest integration.

- To toggle at runtime, call `globalThis.setDebugLoggerEnabled(name, true|false)` or `globalThis.toggleDebugLogger(name)` for a specific logger, or `globalThis.setGlobalDebug(true|false)` to enable everything.

If you prefer to prevent accidental overwrites, define the flag property as non-writable:

```javascript
Object.defineProperty(globalThis, 'verboseDebuggingEnabled', {
  value: true,
  writable: false,
  configurable: false,
  enumerable: true
});
```

- TypeScript: add a global declaration to avoid type errors when referencing `globalThis.draggablePanelDebug`:

```ts
declare global {
  interface Window {
    verboseDebuggingEnabled?: boolean;
    draggablePanelDebug?: (...args: any[]) => void;
    setDraggablePanelDebug?: (enabled: boolean) => void;
    toggleDraggablePanelDebug?: () => boolean;
  }
}
```

- Performance: the no-op function has negligible cost and avoids branching at the call-site. This makes it safe to leave debug calls in production code (they do not allocate or do heavy work when disabled).

## Troubleshooting

- If a named logger is undefined, make sure `debuggingActive.js` is included in `index.html` before you call `createDebugLogger`/`getDebugLogger`.

- If you switch to module loading, ensure consumers import the module correctly and avoid the file being included twice (once as a classic script and once as a module).

## Example — full HTML snippet

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Debug Example</title>
    <script>
      // enable verbose messages before the helper is loaded
      globalThis.verboseDebuggingEnabled = true;
    </script>
    <script src="debug/debuggingActive.js"></script>
    <script>
      // now safe to call from any non-module script
      globalThis.draggablePanelDebug && globalThis.draggablePanelDebug('Hello from main script');
    </script>
  </head>
  <body></body>
</html>
```

## Contact

If you'd like, I can also adjust the API surface (for example to make the getter aliases non-enumerable, or to add a small UI toggle) — tell me which change you'd prefer.
