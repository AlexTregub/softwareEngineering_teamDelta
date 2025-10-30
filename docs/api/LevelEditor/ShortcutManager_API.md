# ShortcutManager API Reference

**Inherits**: (Singleton - No inheritance)  
**File**: `Classes/managers/ShortcutManager.js`

Reusable shortcut system for registering and handling keyboard/mouse shortcuts in a declarative, tool-agnostic way.

---

## Description

`ShortcutManager` is a singleton manager that provides centralized shortcut registration and handling across the application. It eliminates the need for custom event handler wiring by allowing shortcuts to be declared once and applied to multiple tools.

**Key Features**:
- **Declarative API**: Register shortcuts without writing custom event handlers
- **Tool-Agnostic**: Same shortcut can apply to multiple tools or all tools
- **Reusable**: One module handles all shortcuts across entire application
- **Easy Wiring**: Add new shortcuts with <10 lines of code
- **Context-Based**: Actions receive context object with getCurrentTool(), getBrushSize(), etc.
- **Fully Testable**: Comprehensive unit test coverage (23/23 tests passing)

**Design Pattern**: Singleton (only one instance exists)

---

## Tutorials

- **Level Editor Integration**: See `Classes/systems/ui/LevelEditor.js` lines 186-264
- **Shortcut Context Setup**: See `LevelEditor._setupShortcutContext()` method
- **Shortcut Registration**: See `LevelEditor._registerShortcuts()` method

---

## Properties

| Type     | Property     | Default | Description                              |
|----------|--------------|---------|------------------------------------------|
| `Array`  | `_shortcuts` | `[]`    | Registered shortcut configurations       |

---

## Methods

| Returns          | Method                                                                                        |
|------------------|-----------------------------------------------------------------------------------------------|
| `ShortcutManager`| getInstance ( ) static                                                                       |
| `void`           | register ( config: `Object` ) static                                                         |
| `void`           | unregister ( id: `String` ) static                                                           |
| `bool`           | handleMouseWheel ( event: `Object`, modifiers: `Object`, context: `Object` ) static         |
| `Array`          | getRegisteredShortcuts ( ) static                                                            |
| `void`           | clearAll ( ) static                                                                          |
| `bool`           | _matchesModifiers ( required: `String`, current: `Object` ) static private                  |
| `bool`           | _matchesTool ( tools: `Array`, currentTool: `String` ) static private                       |

---

## Method Descriptions

### <span id="getinstance"></span>ShortcutManager **getInstance** ( ) static

Returns the singleton instance of ShortcutManager. Creates instance if it doesn't exist.

```javascript
const manager = ShortcutManager.getInstance();
```

Returns `ShortcutManager` instance.

---

### <span id="register"></span>void **register** ( config: `Object` ) static

Registers a new shortcut with the manager.

```javascript
ShortcutManager.register({
  id: 'brush-size-increase',
  trigger: { modifier: 'shift', event: 'mousewheel', direction: 'up' },
  tools: ['paint', 'eraser'],
  action: (context) => {
    const currentSize = context.getBrushSize();
    context.setBrushSize(Math.min(currentSize + 1, 99));
  }
});
```

**Parameters:**
- `config` (`Object`, **required**): Shortcut configuration
  - `config.id` (`String`, **required**): Unique identifier for shortcut
  - `config.trigger` (`Object`, **required**): Trigger conditions
    - `trigger.modifier` (`String`, **required**): Modifier key(s): `'shift'`, `'ctrl'`, `'alt'`, `'shift+ctrl'`, etc.
    - `trigger.event` (`String`, **required**): Event type: `'mousewheel'`, `'keypress'`, `'click'`
    - `trigger.direction` (`String`, optional): For mousewheel: `'up'`, `'down'`, or omit for any direction
    - `trigger.key` (`String`, optional): For keypress: key code or character
  - `config.tools` (`Array<String>`, optional): Tools this shortcut applies to, or `['all']` for any tool (default: `['all']`)
  - `config.action` (`Function`, **required**): Callback function `(context) => void`

Returns void.

**Throws**:
- `Error` if `id` is missing
- `Error` if `trigger` is missing
- `Error` if `action` is not a function

**Note:** Shortcuts are triggered in registration order. First matching shortcut consumes the event.

---

### <span id="unregister"></span>void **unregister** ( id: `String` ) static

Removes a registered shortcut by its ID.

```javascript
ShortcutManager.unregister('brush-size-increase');
```

**Parameters:**
- `id` (`String`, **required**): Shortcut ID to remove

Returns void. Does not throw if ID doesn't exist.

---

### <span id="handlemousewheel"></span>bool **handleMouseWheel** ( event: `Object`, modifiers: `Object`, context: `Object` ) static

Handles mouse wheel events and triggers matching shortcuts.

```javascript
// In LevelEditor.handleMouseWheel()
const modifiers = { shift: true, ctrl: false, alt: false };
const handled = ShortcutManager.handleMouseWheel(event, modifiers, this._shortcutContext);
if (handled) return true;
```

**Parameters:**
- `event` (`Object`, **required**): Mouse wheel event with `deltaY` property
- `modifiers` (`Object`, **required**): Modifier key states `{ shift, ctrl, alt }`
- `context` (`Object`, **required**): Context object passed to action callbacks

Returns `bool`. True if shortcut handled event, false otherwise.

**Note:** Only the first matching shortcut is triggered. Event propagation stops after match.

---

### <span id="getregisteredshortcuts"></span>Array **getRegisteredShortcuts** ( ) static

Returns all registered shortcuts as an array.

```javascript
const shortcuts = ShortcutManager.getRegisteredShortcuts();
console.log(`Total shortcuts: ${shortcuts.length}`);
```

Returns `Array` of shortcut configuration objects. Returns a **copy** of the internal array, not a reference.

---

### <span id="clearall"></span>void **clearAll** ( ) static

Removes all registered shortcuts. Useful for testing or resetting state.

```javascript
ShortcutManager.clearAll();
```

Returns void.

---

## Common Workflows

### Registering a Simple Shortcut

```javascript
// Shift+Scroll to increase brush size
ShortcutManager.register({
  id: 'brush-size-increase',
  trigger: { modifier: 'shift', event: 'mousewheel', direction: 'up' },
  tools: ['paint', 'eraser'],
  action: (context) => {
    const currentSize = context.getBrushSize();
    context.setBrushSize(currentSize + 1);
  }
});
```

### Registering a Multi-Modifier Shortcut

```javascript
// Shift+Ctrl+Scroll for opacity adjustment
ShortcutManager.register({
  id: 'opacity-increase',
  trigger: { modifier: 'shift+ctrl', event: 'mousewheel', direction: 'up' },
  tools: ['all'], // Works for any tool
  action: (context) => {
    const currentOpacity = context.getOpacity();
    context.setOpacity(Math.min(currentOpacity + 5, 100));
  }
});
```

### Setup Shortcut Context (Level Editor Example)

```javascript
// In LevelEditor.initialize()
_setupShortcutContext() {
  this._shortcutContext = {
    getCurrentTool: () => this.toolbar ? this.toolbar.getSelectedTool() : null,
    getBrushSize: () => {
      if (this.fileMenuBar && this.fileMenuBar.brushSizeModule) {
        return this.fileMenuBar.brushSizeModule.getSize();
      }
      return 1;
    },
    setBrushSize: (size) => {
      if (this.fileMenuBar && this.fileMenuBar.brushSizeModule) {
        this.fileMenuBar.brushSizeModule.setSize(size);
      }
      if (this.editor && typeof this.editor.setBrushSize === 'function') {
        this.editor.setBrushSize(size);
      }
    }
  };
}
```

### Delegate Event Handling

```javascript
// In LevelEditor.handleMouseWheel()
handleMouseWheel(event, shiftKey, mouseX, mouseY) {
  // ... sidebar delegation logic ...
  
  // Delegate to ShortcutManager
  if (shiftKey && typeof ShortcutManager !== 'undefined') {
    const modifiers = { shift: shiftKey, ctrl: false, alt: false };
    const handled = ShortcutManager.handleMouseWheel(event, modifiers, this._shortcutContext);
    if (handled) return true;
  }
  
  return false;
}
```

### Register Multiple Shortcuts in Batch

```javascript
_registerShortcuts() {
  // Increase brush size
  ShortcutManager.register({
    id: 'leveleditor-brush-size-increase',
    trigger: { modifier: 'shift', event: 'mousewheel', direction: 'up' },
    tools: ['paint', 'eraser'],
    action: (context) => {
      const currentSize = context.getBrushSize();
      context.setBrushSize(Math.min(currentSize + 1, 99));
    }
  });
  
  // Decrease brush size
  ShortcutManager.register({
    id: 'leveleditor-brush-size-decrease',
    trigger: { modifier: 'shift', event: 'mousewheel', direction: 'down' },
    tools: ['paint', 'eraser'],
    action: (context) => {
      const currentSize = context.getBrushSize();
      context.setBrushSize(Math.max(currentSize - 1, 1));
    }
  });
}
```

---

## Notes

- **Singleton Pattern**: Only one instance exists. Use `getInstance()` or static methods.
- **Strict Modifier Matching**: Extra modifiers prevent match. `'shift'` trigger won't match if Ctrl is also pressed.
- **First Match Wins**: Only the first matching shortcut is triggered per event.
- **Tool Filtering**: Use `['all']` to apply shortcut to any tool, or specify tools like `['paint', 'eraser']`.
- **Context Object**: Context must provide all methods used by action callbacks (e.g., `getCurrentTool()`, `getBrushSize()`).
- **Testing**: Use `clearAll()` in `beforeEach()` to reset state between tests.

---

## Related Documentation

- **Level Editor Setup**: `docs/LEVEL_EDITOR_SETUP.md`
- **Eraser Tool Implementation**: `docs/checklists/active/ERASER_TOOL_CHECKLIST.md` (Issue #5)
- **Testing Guide**: `docs/guides/TESTING_TYPES_GUIDE.md`
- **Unit Tests**: `test/unit/managers/shortcutManager.test.js` (23 tests)
